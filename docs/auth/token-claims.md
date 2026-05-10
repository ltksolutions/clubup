# Token Claims

> Aké claims očakávame od `auth.sportup.sk` a ako ich spracovávame.

## ID Token (JWT)

Po úspešnom OIDC login flow ClubUp prijme ID token. Očakávané claims:

### Štandardné OIDC claims

| Claim | Typ | Required | Popis |
|---|---|---|---|
| `iss` | string | ✓ | Issuer URL — musí sa zhodovať s `SPORTUP_OIDC_ISSUER` |
| `sub` | string | ✓ | Subject — `sportup_person_id` užívateľa |
| `aud` | string | ✓ | Audience — náš `client_id` |
| `exp` | number | ✓ | Expiration timestamp (Unix) |
| `iat` | number | ✓ | Issued at timestamp |
| `nonce` | string | ✓ | Náš nonce z authorize requestu |
| `auth_time` | number | – | Kedy sa user prihlásil (pre re-auth check) |
| `acr` | string | – | Authentication Context Class Reference (level of assurance) |
| `amr` | string[] | – | Authentication Methods References (`pwd`, `mfa`, …) |

### Profile claims

| Claim | Typ | Required | Popis |
|---|---|---|---|
| `name` | string | ✓ | Plné meno užívateľa |
| `given_name` | string | – | Krstné meno |
| `family_name` | string | – | Priezvisko |
| `email` | string | ✓ | Email |
| `email_verified` | boolean | ✓ | Či je email verifikovaný |
| `picture` | string | – | URL na profilový obrázok |
| `preferred_username` | string | – | Username (typicky email pre SportUp) |
| `locale` | string | – | `sk-SK`, `en-US`, ... |
| `zoneinfo` | string | – | `Europe/Bratislava` |

### Custom SportUp claims

| Claim | Typ | Required | Popis |
|---|---|---|---|
| `sportup_roles` | string[] | ✓ | Globálne SportUp roly + ClubUp-špecifické |
| `sportup_orgs` | object[] | – | Organizácie, kde je user member (s rolami) |
| `sportup_verified_person` | boolean | – | Či má user overenú identitu cez SportUp KYC |
| `sportup_person_id` | string | – | Duplikát `sub` pre clarity |

### Príklad ID tokenu (decoded payload)

```json
{
  "iss": "https://auth.sportup.sk",
  "sub": "sportup_person_id_abc123",
  "aud": "clubup-app-prod",
  "exp": 1762801800,
  "iat": 1762800000,
  "nonce": "2c7a8f9e3b1d",
  "auth_time": 1762799900,
  "name": "Mária Nováková",
  "given_name": "Mária",
  "family_name": "Nováková",
  "email": "maria.novakova@klubsparta.sk",
  "email_verified": true,
  "picture": "https://cdn.sportup.sk/avatars/abc123.jpg",
  "locale": "sk-SK",
  "sportup_roles": [
    "sportup:user",
    "clubup:student",
    "clubup:instructor"
  ],
  "sportup_orgs": [
    { "org_id": "sportup_org_id_klub", "roles": ["coach", "manager"] }
  ],
  "sportup_verified_person": true
}
```

## UserInfo endpoint

Po získaní access tokenu môžeme zavolať `GET /userinfo` cez Bearer token. Vráti rozšírené info — väčšinou rovnaké ako ID token, ale môže obsahovať aj veľké/sensitivne polia (napr. dátum narodenia pre certifikáty), ktoré nedávame do JWT.

```ts
// packages/auth/userinfo.ts
export async function getUserInfo(accessToken: string) {
  const response = await fetch(`${process.env.SPORTUP_OIDC_ISSUER}/userinfo`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error('userinfo_fetch_failed');
  return await response.json();
}
```

Volá sa zriedkavo — najmä pri vydávaní certifikátu, keď potrebujeme presný dátum narodenia.

## Validácia ID tokenu

Auth.js robí validáciu automaticky, ale pre úplnosť — manuálny postup:

```ts
import { jwtVerify, createRemoteJWKSet } from 'jose';

const JWKS = createRemoteJWKSet(new URL(`${ISSUER}/jwks`));

async function validateIdToken(idToken: string, expectedNonce: string) {
  const { payload } = await jwtVerify(idToken, JWKS, {
    issuer: ISSUER,
    audience: CLIENT_ID,
  });
  
  if (payload.nonce !== expectedNonce) {
    throw new Error('nonce mismatch');
  }
  if (payload.exp! * 1000 < Date.now()) {
    throw new Error('token expired');
  }
  
  return payload;
}
```

## Mapovanie claims na ClubUp doménu

```ts
// packages/auth/profile-mapping.ts
export function mapToClubUpProfile(claims: any) {
  return {
    sportupPersonId: claims.sub,
    name: claims.name,
    email: claims.email,
    emailVerified: claims.email_verified,
    picture: claims.picture,
    locale: claims.locale ?? 'sk-SK',
    timezone: claims.zoneinfo ?? 'Europe/Bratislava',
    
    // Roly — extract len ClubUp-špecifické
    roles: extractClubUpRoles(claims.sportup_roles ?? []),
    
    // Pre certifikáty (z UserInfo, nie ID token)
    birthDate: claims.birthdate ?? null,
    
    // Verified status — relevantné pre intermediate certifikáty
    verified: claims.sportup_verified_person ?? false,
  };
}

function extractClubUpRoles(roles: string[]): Role[] {
  const result: Role[] = [];
  if (roles.includes('clubup:admin')) result.push('admin');
  if (roles.includes('clubup:content_manager')) result.push('content_manager');
  if (roles.includes('clubup:instructor')) result.push('instructor');
  // student je default, ak má aspoň základnú sportup rolu
  if (roles.includes('sportup:user') || result.length > 0) result.push('student');
  return result;
}
```

## Bezpečnostné poznámky

- **Nikdy netrustujme client-side token decode** — vždy validuj na serveri cez JWKS
- **Nonce pred-uložíme do cookies** s SameSite=Lax pred redirektom na authorize, validujeme po callback
- **State** podobne — ako anti-CSRF
- **PKCE code_verifier** uložené v cookies, nie v URL
- **Custom claims** ako `sportup_roles` MUSIA byť validované na serveri pri každom requeste — neveriť cookies session blindly, keď ide o admin operácie
- **Re-auth pre kritické operácie** — `acr` claim môžeme použiť, aby sme pre admin akcie (napr. refund veľkej sumy) vyžadovali re-prihlásenie cez `auth_time` check
