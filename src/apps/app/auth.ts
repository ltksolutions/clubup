// SPDX-FileCopyrightText: 2025 Ján Letko / LTK Solutions s.r.o.
// SPDX-License-Identifier: EUPL-1.2

import NextAuth from 'next-auth';

import { buildAuthConfig } from '@clubup/auth';

/**
 * Auth.js v5 instance for the student app.
 *
 * Wires up the shared OIDC config from @clubup/auth with this app's
 * environment variables. See docs/auth/oidc-client.md.
 */
export const { handlers, auth, signIn, signOut } = NextAuth(
  buildAuthConfig({
    issuer: process.env.SPORTUP_OIDC_ISSUER ?? '',
    clientId: process.env.SPORTUP_OIDC_CLIENT_ID ?? '',
    clientSecret: process.env.SPORTUP_OIDC_CLIENT_SECRET ?? '',
    authSecret: process.env.AUTH_SECRET ?? '',
    cookieName: '__Secure-clubup.session',
    isProduction: process.env.NODE_ENV === 'production',
  })
);
