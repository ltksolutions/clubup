<!-- SPDX-FileCopyrightText: 2025 Ján Letko / LTK Solutions s.r.o.
     SPDX-License-Identifier: CC-BY-4.0 -->

# `@clubup/auth`

OIDC client (Auth.js v5) pre SportUp SSO + RBAC helpers + dev mock IdP.

## Princípy

- **No local identity** — všetko cez `auth.sportup.sk` (alebo dev mock)
- **JWE session cookie** — encrypted, HttpOnly, krátka životnosť
- **PKCE + nonce + state** — automaticky cez Auth.js
- **RBAC** — 4 roly (`student`, `instructor`, `content_manager`, `admin`)
- **Permission matrix** — stable string keys, server-side enforcement

## Štruktúra

```
src/
├── index.ts              # public re-exports
├── config.ts             # buildAuthConfig() — wrap Auth.js v5 setup
├── rbac.ts               # Role taxonomy + mapRoles
├── permissions.ts        # Permission matrix + can()
├── guards.ts             # createGuards() — requireSession/Permission/Role
└── profile-mapping.ts    # mapToClubUpProfile() from raw OIDC claims

dev-idp/
└── server.ts             # local mock OIDC server (NEVER in prod)
```

## Použitie v apps

### `apps/app/auth.ts`

```ts
import NextAuth from 'next-auth';
import { buildAuthConfig } from '@clubup/auth';

export const { handlers, auth, signIn, signOut } = NextAuth(
  buildAuthConfig({
    issuer: process.env.SPORTUP_OIDC_ISSUER!,
    clientId: process.env.SPORTUP_OIDC_CLIENT_ID!,
    clientSecret: process.env.SPORTUP_OIDC_CLIENT_SECRET!,
    authSecret: process.env.AUTH_SECRET!,
    cookieName: '__Secure-clubup.session',
    isProduction: process.env.NODE_ENV === 'production',
  })
);
```

### Server actions / route handlers

```ts
import { auth } from '@/auth';
import { createGuards } from '@clubup/auth/guards';

const { requirePermission } = createGuards(auth);

export async function publishCourse(courseId: string) {
  const session = await requirePermission('course.publish');
  // session.user.sportupPersonId, session.user.roles available
  // ...
}
```

## Dev mock IdP

Spustenie:

```bash
npm run mock-idp --workspace=@clubup/auth
```

Bude počúvať na `http://localhost:9000` a slúži discovery + JWKS endpointy. Plné authorize/token/userinfo endpointy sú scaffold-úrovne — viď `docs/auth/dev-mock-idp.md` pre kompletnú implementáciu.

V apps nastav:

```env
SPORTUP_OIDC_ISSUER=http://localhost:9000
SPORTUP_OIDC_CLIENT_ID=dev-client
SPORTUP_OIDC_CLIENT_SECRET=dev-secret
```

## Status

- ✅ rbac.ts — kompletné
- ✅ permissions.ts — reprezentatívna časť permission matice (full v `docs/auth/rbac.md`)
- ✅ guards.ts — kompletné
- ✅ profile-mapping.ts — kompletné
- ✅ config.ts — Auth.js v5 wrapper, refresh-token TODO
- ⚠️ dev-idp/server.ts — scaffold (discovery + JWKS), authorize/token TODO

Detailné špecifikácie sú v `docs/auth/`:
- `oidc-client.md` — OIDC client setup
- `rbac.md` — kompletná permission matica
- `session.md` — refresh token flow, backchannel logout
- `token-claims.md` — claim mapping
- `dev-mock-idp.md` — kompletný spec mock servera
