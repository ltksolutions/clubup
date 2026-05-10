# OIDC Client setup (Auth.js v5)

> Konfigurácia ClubUp ako OIDC client pre `auth.sportup.sk`.

## Knižnica

**Auth.js v5** (predtým NextAuth.js). Zvolené, lebo:

- Native Next.js 15 App Router support
- Generic OIDC provider config (žiadny lock-in na konkrétny IdP)
- Dobrá TypeScript podpora
- Manage session cez encrypted cookies (JWE)
- Built-in CSRF, PKCE, nonce, state handling

## Inštalácia

```bash
npm install next-auth@beta
```

## Konfigurácia

### `packages/auth/index.ts`

```ts
import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';

export const authConfig: NextAuthConfig = {
  providers: [
    {
      id: 'sportup',
      name: 'SportUp',
      type: 'oidc',
      issuer: process.env.SPORTUP_OIDC_ISSUER!,
      clientId: process.env.SPORTUP_OIDC_CLIENT_ID!,
      clientSecret: process.env.SPORTUP_OIDC_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid profile email sportup_roles',
        },
      },
      // PKCE je default v Auth.js v5
      checks: ['pkce', 'state', 'nonce'],
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          // Custom claims
          sportupPersonId: profile.sub,
          roles: parseRoles(profile.sportup_roles ?? []),
        };
      },
    },
  ],
  callbacks: {
    async jwt({ token, user, account, trigger }) {
      // First sign-in
      if (user && account) {
        token.sportupPersonId = user.sportupPersonId;
        token.roles = user.roles;
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.accessTokenExpiresAt = account.expires_at! * 1000;
      }
      
      // Refresh access token if expiring soon
      if (Date.now() > (token.accessTokenExpiresAt as number) - 60_000) {
        return await refreshAccessToken(token);
      }
      
      return token;
    },
    async session({ session, token }) {
      session.user.sportupPersonId = token.sportupPersonId as string;
      session.user.roles = token.roles as string[];
      session.accessToken = token.accessToken as string;
      return session;
    },
  },
  session: {
    strategy: 'jwt',           // JWE-encrypted cookie
    maxAge: 60 * 60 * 24,       // 24h
  },
  cookies: {
    sessionToken: {
      name: '__Secure-clubup.session',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  pages: {
    signIn: '/login',
    error: '/login/error',
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
```

### Použitie v `apps/app`

```ts
// apps/app/auth.ts
export { handlers, auth, signIn, signOut } from '@clubup/auth';
```

```ts
// apps/app/app/api/auth/[...nextauth]/route.ts
export { GET, POST } from '@clubup/auth/handlers';
```

```ts
// apps/app/middleware.ts
export { auth as middleware } from '@clubup/auth';

export const config = {
  matcher: ['/(dashboard|profil|kurzy)/:path*'],
};
```

## Refresh token rotation

```ts
// packages/auth/refresh.ts
async function refreshAccessToken(token: any) {
  try {
    const response = await fetch(`${process.env.SPORTUP_OIDC_ISSUER}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.SPORTUP_OIDC_CLIENT_ID!,
        client_secret: process.env.SPORTUP_OIDC_CLIENT_SECRET!,
        grant_type: 'refresh_token',
        refresh_token: token.refreshToken,
      }),
    });
    
    const tokens = await response.json();
    if (!response.ok) throw tokens;
    
    return {
      ...token,
      accessToken: tokens.access_token,
      accessTokenExpiresAt: Date.now() + tokens.expires_in * 1000,
      refreshToken: tokens.refresh_token ?? token.refreshToken,
    };
  } catch (error) {
    return { ...token, error: 'RefreshAccessTokenError' };
  }
}
```

Pri `RefreshAccessTokenError` sa user vyhodí na `/login` (middleware to detekuje cez `session.error`).

## Type safety

```ts
// packages/auth/types.d.ts
import 'next-auth';
import type { Role } from './rbac';

declare module 'next-auth' {
  interface Session {
    user: {
      sportupPersonId: string;
      name: string;
      email: string;
      image?: string;
      roles: Role[];
    };
    accessToken: string;
    error?: 'RefreshAccessTokenError';
  }
  
  interface User {
    sportupPersonId: string;
    roles: Role[];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    sportupPersonId: string;
    roles: Role[];
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresAt: number;
  }
}
```

## Discovery & JWKS

Auth.js automaticky:

- Volá `${issuer}/.well-known/openid-configuration` pri prvom requeste
- Cachuje výsledok 24h
- Sťahuje JWKS z `jwks_uri` a verifikuje podpis ID tokenu
- Cachuje JWKS 24h, refresh pri unknown `kid`

## Environment variables

| Variable | Príklad | Popis |
|---|---|---|
| `SPORTUP_OIDC_ISSUER` | `https://auth.sportup.sk` | OIDC issuer URL |
| `SPORTUP_OIDC_CLIENT_ID` | `clubup-app-prod` | ID priradený SportUp adminom |
| `SPORTUP_OIDC_CLIENT_SECRET` | `...` | Secret (Vercel env, nikdy v kóde) |
| `AUTH_SECRET` | (random 32 bytes base64) | Pre encryption session cookie |
| `AUTH_URL` | `https://app.clubup.sk` | Base URL aplikácie |

Pre `apps/admin` rovnaké, ale `AUTH_URL=https://admin.clubup.sk`.

## Príklad — chránená Server Action

```ts
'use server';
import { auth } from '@/auth';

export async function purchaseCourse(courseId: string) {
  const session = await auth();
  if (!session) throw new Error('UNAUTHORIZED');
  
  return await createOrder({
    studentId: session.user.sportupPersonId,
    courseId,
  });
}
```

## Príklad — chránený Route Handler

```ts
import { auth } from '@/auth';

export async function GET(req: Request) {
  const session = await auth();
  if (!session) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }
  
  const data = await loadData(session.user.sportupPersonId);
  return Response.json(data);
}
```

## Troubleshooting

| Problem | Príčina | Riešenie |
|---|---|---|
| `nonce mismatch` | Browser zablokoval cookies | Skontroluj SameSite, Secure flags |
| `state mismatch` | User otvoril 2 prihl. okná | UX: detect a redirect na nový login |
| `invalid_client` | Bad client_id/secret v env | Skontroluj Vercel env vars |
| `redirect_uri_mismatch` | URL nesedí s whitelistom | Pošli SportUp adminovi presný URL |
| `JWKS fetch error` | Discovery doc nedostupný | Skontroluj sieť, fallback na cached |
