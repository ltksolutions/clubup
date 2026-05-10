// SPDX-FileCopyrightText: 2025 Ján Letko / LTK Solutions s.r.o.
// SPDX-License-Identifier: EUPL-1.2

/**
 * Auth.js v5 configuration builder.
 *
 * Apps call `buildAuthConfig(...)` and pass the result to `NextAuth(...)`.
 * Keeping this in a shared package ensures both apps/app and apps/admin
 * share the same OIDC provider config, callbacks, and RBAC mapping.
 *
 * See: docs/auth/oidc-client.md
 */

import type { NextAuthConfig } from 'next-auth';

import { mapRoles, type Role } from './rbac.js';

export interface AuthConfigInput {
  /** OIDC issuer URL — auth.sportup.sk in prod, http://localhost:9000 in dev. */
  issuer: string;
  /** OIDC client ID, registered in SportUp admin. */
  clientId: string;
  /** OIDC client secret. Never commit. */
  clientSecret: string;
  /** Encryption secret for the JWE session cookie (>= 32 random bytes). */
  authSecret: string;
  /** Cookie name. Defaults differ for student vs admin app. */
  cookieName?: string;
  /** Production flag — toggles `secure` on cookies. */
  isProduction: boolean;
}

export function buildAuthConfig(input: AuthConfigInput): NextAuthConfig {
  return {
    secret: input.authSecret,
    providers: [
      {
        id: 'sportup',
        name: 'SportUp',
        type: 'oidc',
        issuer: input.issuer,
        clientId: input.clientId,
        clientSecret: input.clientSecret,
        authorization: {
          params: {
            scope: 'openid profile email sportup_roles',
          },
        },
        checks: ['pkce', 'state', 'nonce'],
        profile(profile: Record<string, unknown>) {
          const sub = String(profile.sub);
          const sportupRoles = Array.isArray(profile.sportup_roles)
            ? (profile.sportup_roles as string[])
            : [];
          return {
            id: sub,
            name: (profile.name as string | undefined) ?? null,
            email: (profile.email as string | undefined) ?? null,
            image: (profile.picture as string | undefined) ?? null,
            sportupPersonId: sub,
            roles: mapRoles(sportupRoles),
          };
        },
      },
    ],
    callbacks: {
      async jwt({ token, user, account }) {
        if (user && account) {
          token.sportupPersonId = (user as { sportupPersonId?: string })
            .sportupPersonId;
          token.roles = (user as { roles?: Role[] }).roles ?? [];
          token.accessToken = account.access_token;
          token.refreshToken = account.refresh_token;
          if (typeof account.expires_at === 'number') {
            token.accessTokenExpiresAt = account.expires_at * 1000;
          }
        }
        // TODO: refresh access token when near expiry. See docs/auth/session.md
        return token;
      },
      async session({ session, token }) {
        if (session.user) {
          (session.user as { sportupPersonId?: string }).sportupPersonId =
            (token as { sportupPersonId?: string }).sportupPersonId;
          (session.user as { roles?: Role[] }).roles =
            ((token as { roles?: Role[] }).roles) ?? [];
        }
        (session as { accessToken?: string }).accessToken =
          (token as { accessToken?: string }).accessToken;
        return session;
      },
    },
    session: {
      strategy: 'jwt',
      maxAge: 60 * 60 * 24, // 24h
      updateAge: 60 * 60, // refresh sliding session each hour of activity
    },
    cookies: {
      sessionToken: {
        name: input.cookieName ?? '__Secure-clubup.session',
        options: {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          secure: input.isProduction,
        },
      },
    },
    pages: {
      signIn: '/login',
      error: '/login/error',
    },
  };
}
