// SPDX-FileCopyrightText: 2025 Ján Letko / LTK Solutions s.r.o.
// SPDX-License-Identifier: EUPL-1.2
//
// Dev mock OIDC IdP — local stand-in for auth.sportup.sk during development.
//
// NEVER deploy to production. NEVER expose to the internet.
//
// Spec: docs/auth/dev-mock-idp.md
//
// This file is a SCAFFOLD. The full implementation flows are documented in
// the spec; here we provide the bare-minimum HTTP server that responds to
// discovery and JWKS so apps can boot. Authorize/token/userinfo endpoints
// are stubs that need finishing before the apps can complete a sign-in flow.

import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';

import { generateKeyPair, exportJWK } from 'jose';

const PORT = Number(process.env.MOCK_IDP_PORT ?? 9000);
const ISSUER = `http://localhost:${PORT}`;

if (process.env.NODE_ENV === 'production') {
  // eslint-disable-next-line no-console
  console.error('[mock-idp] refusing to start in NODE_ENV=production');
  process.exit(1);
}

async function main() {
  const { publicKey } = await generateKeyPair('RS256');
  const jwk = await exportJWK(publicKey);
  jwk.kid = 'dev-kid-1';
  jwk.use = 'sig';
  jwk.alg = 'RS256';

  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    const url = new URL(req.url ?? '/', ISSUER);

    if (url.pathname === '/.well-known/openid-configuration') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(
        JSON.stringify({
          issuer: ISSUER,
          authorization_endpoint: `${ISSUER}/authorize`,
          token_endpoint: `${ISSUER}/token`,
          userinfo_endpoint: `${ISSUER}/userinfo`,
          jwks_uri: `${ISSUER}/jwks`,
          end_session_endpoint: `${ISSUER}/logout`,
          response_types_supported: ['code'],
          subject_types_supported: ['public'],
          id_token_signing_alg_values_supported: ['RS256'],
          scopes_supported: ['openid', 'profile', 'email', 'sportup_roles'],
          token_endpoint_auth_methods_supported: ['client_secret_post'],
          code_challenge_methods_supported: ['S256'],
        })
      );
      return;
    }

    if (url.pathname === '/jwks') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ keys: [jwk] }));
      return;
    }

    // TODO: /authorize, /token, /userinfo, /logout
    // Reference implementation in docs/auth/dev-mock-idp.md.
    res.writeHead(501, { 'content-type': 'text/plain' });
    res.end(
      'Mock IdP scaffold: this endpoint is not yet implemented. ' +
        'See docs/auth/dev-mock-idp.md for the full spec.'
    );
  });

  server.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`[mock-idp] listening at ${ISSUER}`);
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[mock-idp] failed to start', err);
  process.exit(1);
});
