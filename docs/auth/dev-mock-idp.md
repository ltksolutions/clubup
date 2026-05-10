# Dev Mock IdP

> Lokálny mock OIDC server pre development bez závislosti od `auth.sportup.sk`.

## Prečo

`auth.sportup.sk` v čase písania **ešte neexistuje** — buduje sa v sesterskom projekte. Aby sme mohli stavať ClubUp paralelne, máme **mock IdP** v `packages/auth/dev-idp/`.

Mock simuluje:

- OIDC discovery endpoint (`/.well-known/openid-configuration`)
- JWKS endpoint
- Authorization endpoint (`/authorize`) — auto-approve, bez prihl. obrazovky
- Token endpoint (`/token`)
- UserInfo endpoint (`/userinfo`)

Žiadny user management — vystaví fake user podľa env vars.

## Spustenie

```bash
# V root repa
npm run mock-idp

# Alebo priamo
cd src/packages/auth/dev-idp
npm run start
```

Mock beží na `http://localhost:9000`.

## Konfigurácia ClubUp pre dev

```env
# .env.local v apps/app/
SPORTUP_OIDC_ISSUER=http://localhost:9000
SPORTUP_OIDC_CLIENT_ID=dev-client
SPORTUP_OIDC_CLIENT_SECRET=dev-secret
AUTH_SECRET=development-only-do-not-use-in-prod-aaaaaaaaaaaaaaaaaaaaaaaaaa
AUTH_URL=http://localhost:3000

# Mock-specific — kontroluje, kto sa "prihlási"
MOCK_USER_ID=sportup_person_id_dev_001
MOCK_USER_NAME=Mária Dev Testovacia
MOCK_USER_EMAIL=maria@dev.local
MOCK_USER_ROLES=clubup:student,clubup:admin
```

## Mock IdP implementácia (skeleton)

```ts
// src/packages/auth/dev-idp/server.ts
import http from 'node:http';
import { URL } from 'node:url';
import { generateKeyPair, exportJWK, SignJWT, jwtVerify } from 'jose';

const PORT = 9000;
const ISSUER = `http://localhost:${PORT}`;

// Vygeneruj kľúčový pár pri štarte
const { publicKey, privateKey } = await generateKeyPair('RS256');
const jwk = await exportJWK(publicKey);
jwk.kid = 'dev-kid-1';
jwk.use = 'sig';
jwk.alg = 'RS256';

// Pseudo "user database" — z env vars
const MOCK_USER = {
  sub: process.env.MOCK_USER_ID ?? 'sportup_person_id_dev_001',
  name: process.env.MOCK_USER_NAME ?? 'Mária Dev Testovacia',
  email: process.env.MOCK_USER_EMAIL ?? 'maria@dev.local',
  email_verified: true,
  picture: null,
  locale: 'sk-SK',
  zoneinfo: 'Europe/Bratislava',
  sportup_roles: (process.env.MOCK_USER_ROLES ?? 'clubup:student').split(','),
  sportup_verified_person: true,
};

// In-memory store pre auth codes
const authCodes = new Map<string, { codeChallenge: string; nonce: string; expiresAt: number }>();

http.createServer(async (req, res) => {
  const url = new URL(req.url!, `http://localhost:${PORT}`);
  
  // === Discovery ===
  if (url.pathname === '/.well-known/openid-configuration') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
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
      claims_supported: [
        'sub', 'name', 'given_name', 'family_name', 'email', 'email_verified',
        'picture', 'locale', 'zoneinfo', 'sportup_roles', 'sportup_verified_person',
      ],
      code_challenge_methods_supported: ['S256'],
    }));
  }
  
  // === JWKS ===
  if (url.pathname === '/jwks') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ keys: [jwk] }));
  }
  
  // === Authorize — auto-approve, no UI ===
  if (url.pathname === '/authorize') {
    const responseType = url.searchParams.get('response_type');
    const clientId = url.searchParams.get('client_id');
    const redirectUri = url.searchParams.get('redirect_uri');
    const scope = url.searchParams.get('scope');
    const state = url.searchParams.get('state');
    const nonce = url.searchParams.get('nonce');
    const codeChallenge = url.searchParams.get('code_challenge');
    const codeChallengeMethod = url.searchParams.get('code_challenge_method');
    
    if (responseType !== 'code' || !clientId || !redirectUri || !codeChallenge) {
      res.writeHead(400);
      return res.end('invalid_request');
    }
    
    // Generate auth code
    const code = randomString(32);
    authCodes.set(code, {
      codeChallenge,
      nonce: nonce ?? '',
      expiresAt: Date.now() + 60_000,  // 60s
    });
    
    // Redirect
    const callback = new URL(redirectUri);
    callback.searchParams.set('code', code);
    if (state) callback.searchParams.set('state', state);
    
    res.writeHead(302, { Location: callback.toString() });
    return res.end();
  }
  
  // === Token ===
  if (url.pathname === '/token' && req.method === 'POST') {
    const body = await readBody(req);
    const params = new URLSearchParams(body);
    
    const grantType = params.get('grant_type');
    const code = params.get('code');
    const codeVerifier = params.get('code_verifier');
    const clientId = params.get('client_id');
    
    if (grantType !== 'authorization_code') {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'unsupported_grant_type' }));
    }
    
    const codeData = authCodes.get(code!);
    if (!codeData || codeData.expiresAt < Date.now()) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'invalid_grant' }));
    }
    
    // Validate PKCE
    const expectedChallenge = sha256base64url(codeVerifier!);
    if (expectedChallenge !== codeData.codeChallenge) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'invalid_grant', error_description: 'pkce_mismatch' }));
    }
    
    authCodes.delete(code!);
    
    // Generate tokens
    const idToken = await new SignJWT({
      ...MOCK_USER,
      nonce: codeData.nonce,
    })
      .setProtectedHeader({ alg: 'RS256', kid: 'dev-kid-1' })
      .setIssuer(ISSUER)
      .setAudience(clientId!)
      .setSubject(MOCK_USER.sub)
      .setExpirationTime('1h')
      .setIssuedAt()
      .sign(privateKey);
    
    const accessToken = await new SignJWT({ scope: 'openid profile email sportup_roles' })
      .setProtectedHeader({ alg: 'RS256', kid: 'dev-kid-1' })
      .setIssuer(ISSUER)
      .setSubject(MOCK_USER.sub)
      .setExpirationTime('15m')
      .setIssuedAt()
      .sign(privateKey);
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 900,
      id_token: idToken,
      refresh_token: randomString(64),
      scope: 'openid profile email sportup_roles',
    }));
  }
  
  // === UserInfo ===
  if (url.pathname === '/userinfo') {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) {
      res.writeHead(401);
      return res.end();
    }
    
    try {
      await jwtVerify(auth.slice(7), publicKey, { issuer: ISSUER });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(MOCK_USER));
    } catch {
      res.writeHead(401);
      return res.end();
    }
  }
  
  // === Logout ===
  if (url.pathname === '/logout') {
    const postLogoutRedirect = url.searchParams.get('post_logout_redirect_uri') ?? '/';
    res.writeHead(302, { Location: postLogoutRedirect });
    return res.end();
  }
  
  res.writeHead(404);
  res.end('not found');
}).listen(PORT, () => {
  console.log(`Mock IdP running at ${ISSUER}`);
});

// Helpers
function randomString(len: number) { /* ... */ }
function sha256base64url(input: string) { /* ... */ }
function readBody(req: http.IncomingMessage): Promise<string> { /* ... */ }
```

## Multiple test users

Pre testovanie rôznych rolí môžete spustiť mock s rôznymi env vars v `package.json` scripts:

```json
{
  "scripts": {
    "mock-idp:student": "MOCK_USER_ROLES=clubup:student npm run mock-idp",
    "mock-idp:admin": "MOCK_USER_ROLES=clubup:admin,clubup:content_manager npm run mock-idp",
    "mock-idp:instructor": "MOCK_USER_ROLES=clubup:instructor npm run mock-idp"
  }
}
```

Alebo dynamicky cez query param `?as=admin`:

```ts
// V authorize handlere
const role = url.searchParams.get('as');
const userOverride = role === 'admin' ? { sportup_roles: ['clubup:admin'] } : {};
const userToReturn = { ...MOCK_USER, ...userOverride };
```

## Bezpečnostné upozornenie

Mock IdP **NIKDY nesmie bežať v production**. Ochrany:

1. Mock IdP package nezahŕňame do production build (devDependencies only)
2. Build-time check v `apps/app/auth.ts`:
   ```ts
   if (process.env.NODE_ENV === 'production' && process.env.SPORTUP_OIDC_ISSUER?.includes('localhost')) {
     throw new Error('Cannot use mock IdP in production');
   }
   ```
3. Vercel env vars pre prod sú `SPORTUP_OIDC_ISSUER=https://auth.sportup.sk`

## Migrácia na production

Keď `auth.sportup.sk` bude live:

1. SportUp admin nás zaregistruje ako OIDC client
2. Dostaneme `client_id`, `client_secret`, redirect URIs whitelist
3. Vercel env vars zmeníme:
   ```
   SPORTUP_OIDC_ISSUER=https://auth.sportup.sk
   SPORTUP_OIDC_CLIENT_ID=clubup-app-prod
   SPORTUP_OIDC_CLIENT_SECRET=<from-sportup-admin>
   ```
4. Mock IdP zostáva v repe pre dev workflows
5. Žiadna zmena kódu — Auth.js OIDC config je generic

## Test-mode users v sportup.sk

V budúcnosti `auth.sportup.sk` môže mať „test mode" — sandbox tenant s testovacími účtami pre QA. To by nahradilo lokálny mock IdP pre staging/preview deployments. MVP používa mock pre maximálnu nezávislosť.
