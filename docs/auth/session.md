# Session management

> Ako ClubUp spravuje session — cookies, lifetime, refresh, sign-out.

## Storage strategy

ClubUp používa **JWE-encrypted session cookie** (Auth.js v5 default). Session token je samostatný JWT, podpísaný a šifrovaný cez `AUTH_SECRET`, uložený v HttpOnly cookie.

**Prečo nie server-side session store (Redis/Mongo):**

- Pre 0–5000 používateľov je server-side store overkill
- JWE cookie umožňuje stateless auth (no DB lookup pri každom requeste)
- Pri SSO logout cez backchannel notification revokneme session lokálne (cookie clear + token invalidation v jwt callback)

Pri vyššom škále (10k+ active sessions) zvážime prechod na stateful store.

## Cookie konfigurácia

```ts
// packages/auth/cookies.ts
export const cookieConfig = {
  sessionToken: {
    name: '__Secure-clubup.session',
    options: {
      httpOnly: true,           // nedostupné z JS — XSS protection
      secure: true,              // len HTTPS (v dev cez ngrok / mkcert)
      sameSite: 'lax',           // chráni pred CSRF, povoľuje top-level navigáciu
      path: '/',
      maxAge: 60 * 60 * 24,      // 24 hodín
    },
  },
  callbackUrl: {
    name: '__Secure-clubup.callback-url',
    options: {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
    },
  },
  csrfToken: {
    name: '__Host-clubup.csrf-token',
    options: {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
    },
  },
};
```

> `__Secure-` prefix vyžaduje `secure: true` a HTTPS. `__Host-` prefix navyše vyžaduje `path=/` a žiadny `domain` atribút — najprísnejšia forma.

## Lifetime & refresh

| Token | Lifetime | Refresh |
|---|---|---|
| **Access token** (z SportUp) | 15 min | Auto-refresh cez refresh token, 60s pred expiráciou |
| **Refresh token** (z SportUp) | 30 dní | Rotujúci pri každom použití |
| **Session cookie** (JWE) | 24 h | Predĺžená pri každej aktivite (sliding session) |

```ts
// packages/auth/index.ts (extract)
session: {
  strategy: 'jwt',
  maxAge: 60 * 60 * 24,           // 24h cookie
  updateAge: 60 * 60,              // refresh cookie každú hodinu pri aktivite
}
```

## Refresh access token

Pri každom prístupe na chránenú stránku Auth.js spustí JWT callback. Ak je access token expirovaný (`exp - 60s`), pokúsi sa o refresh:

```ts
async jwt({ token, user, account, trigger }) {
  // Initial sign-in
  if (user && account) {
    return {
      sportupPersonId: user.sportupPersonId,
      roles: user.roles,
      accessToken: account.access_token,
      refreshToken: account.refresh_token,
      accessTokenExpiresAt: account.expires_at! * 1000,
    };
  }
  
  // Subsequent calls
  if (Date.now() < (token.accessTokenExpiresAt as number) - 60_000) {
    return token;  // still valid
  }
  
  // Refresh
  return await refreshAccessToken(token);
}
```

Pri zlyhaní refresh-u (revoked refresh token, atď.) sa session označí ako `error: 'RefreshAccessTokenError'`. Middleware to detekuje a redirektuje na `/login`.

## Sign-out flow

### Manuálny sign-out (klik užívateľa)

```ts
// apps/app/components/sign-out-button.tsx
'use client';
import { signOut } from 'next-auth/react';

export function SignOutButton() {
  return (
    <button onClick={() => signOut({ redirectTo: '/' })}>
      Odhlásiť
    </button>
  );
}
```

Auth.js:
1. Vymaže session cookie
2. Volá end_session_endpoint na `auth.sportup.sk` (RP-initiated logout)
3. Redirektuje na `redirectTo`

### Backchannel logout (SSO)

Keď sa user odhlási na inom SportUp app (napr. Activity.sk), `auth.sportup.sk` pošle backchannel logout request:

```
POST https://app.clubup.sk/api/auth/backchannel-logout
Content-Type: application/x-www-form-urlencoded

logout_token=<JWT>
```

Logout token obsahuje `sub` a `sid` (session ID). ClubUp:

1. Validuje JWT podpis cez JWKS
2. Pridá session ID do **revocation list** (Mongo collection s TTL)
3. Vráti `200 OK`

V JWT callback potom kontrolujeme, či nie je session v revocation liste:

```ts
async jwt({ token }) {
  const isRevoked = await checkRevocation(token.sid);
  if (isRevoked) return null;  // nuluje session
  // ...
}
```

```ts
// apps/app/app/api/auth/backchannel-logout/route.ts
import { jwtVerify, createRemoteJWKSet } from 'jose';

const JWKS = createRemoteJWKSet(new URL(`${process.env.SPORTUP_OIDC_ISSUER}/jwks`));

export async function POST(req: Request) {
  const formData = await req.formData();
  const logoutToken = formData.get('logout_token') as string;
  
  try {
    const { payload } = await jwtVerify(logoutToken, JWKS, {
      issuer: process.env.SPORTUP_OIDC_ISSUER,
      audience: process.env.SPORTUP_OIDC_CLIENT_ID,
    });
    
    // Validate logout token claims
    const events = payload.events as { 'http://schemas.openid.net/event/backchannel-logout'?: object };
    if (!events?.['http://schemas.openid.net/event/backchannel-logout']) {
      return new Response('invalid logout_token', { status: 400 });
    }
    
    // Add to revocation list
    await db.collection('session_revocations').insertOne({
      sid: payload.sid,
      sub: payload.sub,
      revokedAt: new Date(),
      // TTL index expires in 25h (longer than session)
    });
    
    return new Response('', { status: 200 });
  } catch (e) {
    return new Response('invalid token', { status: 400 });
  }
}
```

## Session expiration UX

Keď session expiruje:

- **Server-side (RSC, Server Action):** redirect na `/login` cez middleware
- **Client-side (mid-session):** Auth.js posiela 401 → klient detekuje a redirektuje s `?callbackUrl=/aktualna-stranka`

Pre zjednodušenie použijeme middleware:

```ts
// apps/app/middleware.ts
import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  if (!req.auth && !isPublicPath(req.nextUrl.pathname)) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', req.url);
    return NextResponse.redirect(loginUrl);
  }
  
  if (req.auth?.error === 'RefreshAccessTokenError') {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('error', 'session_expired');
    return NextResponse.redirect(loginUrl);
  }
});

export const config = {
  matcher: ['/((?!api/auth|_next|favicon|brand|public).*)'],
};

function isPublicPath(path: string) {
  return [
    '/',
    '/kurzy',
    '/login',
    '/o-projekte',
    '/kontakt',
  ].some((p) => path === p || path.startsWith(`${p}/`));
}
```

## CSRF protection

Auth.js automaticky generuje CSRF token pre POST endpoints. Pre Server Actions Next.js má built-in protection (origin check).

**Custom POST API endpoints** (napr. `/api/orders`) musia byť **same-origin** (volané z našho frontendu) alebo **mať API key** (nepoužívame v MVP).

## Concurrency

Keď user otvorí 2 záložky:

- **Session cookie** je zdieľaný — obe vidia tú istú session
- **Token refresh** môže nastať z oboch tabov súčasne — Auth.js používa locking cez `account.expires_at` čas (last-write-wins)
- **Backchannel logout** invaliduje obe taby naraz (revocation list)

## Bezpečnostné checklist

- [ ] `AUTH_SECRET` má aspoň 32 random bytes (base64), unikátne pre prod
- [ ] `__Secure-` prefix na sessionToken cookie
- [ ] HttpOnly + Secure + SameSite=Lax (alebo Strict pre admin app)
- [ ] HTTPS enforced cez Vercel auto-redirect
- [ ] Backchannel logout endpoint implementovaný a registrovaný v SportUp
- [ ] Refresh token rotation enabled (rotácia + reuse detection)
- [ ] Krátky access token (15 min) + dlhší refresh token (30 dní)
- [ ] Logout token validácia cez JWKS (nie iba decode)
- [ ] Session revocation list má TTL index, nie nekonečný rast
