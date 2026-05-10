# Auth — autentifikácia a autorizácia

> Dokumentácia pre integráciu s `auth.sportup.sk` ako OIDC issuer.

## Princíp

ClubUp **nemá vlastný systém prihlasovania**. Všetka identita prichádza z `auth.sportup.sk` — centrálneho OIDC providera ekosystému SportUp.

Tento prístup je popísaný v ADR-0004 ([`../decisions/0004-sso-via-sportup.md`](../decisions/0004-sso-via-sportup.md)). Tu sú **implementačné detaily**.

## Zhrnutie flow

```
1. Užívateľ klikne "Prihlásiť" v ClubUp
2. ClubUp redirektuje na auth.sportup.sk/authorize?client_id=...&redirect_uri=...&code_challenge=...
3. SportUp zobrazí prihl. obrazovku (alebo prejde rovno cez SSO ak má aktívnu session)
4. Po prihlásení redirektuje späť na ClubUp /api/auth/callback/sportup?code=...
5. ClubUp vymení code za tokeny (POST /token + code_verifier)
6. Dostane id_token (JWT s claims) + access_token + refresh_token
7. Validuje id_token podpis cez JWKS, kontroluje exp, aud, iss, nonce
8. Cez UserInfo endpoint si dotiahne extra claims (roly, profil)
9. Vytvorí session cookie (HttpOnly, Secure, SameSite=Lax)
```

## Súbory v tomto priečinku

| Súbor | Popis |
|---|---|
| [`oidc-client.md`](oidc-client.md) | OIDC client setup, Auth.js v5 konfigurácia |
| [`token-claims.md`](token-claims.md) | Aké claims očakávame v ID tokene a UserInfo |
| [`rbac.md`](rbac.md) | Mapovanie SportUp rolí na ClubUp roly + permission matrix |
| [`session.md`](session.md) | Cookie scope, lifetime, refresh, sign-out |
| [`dev-mock-idp.md`](dev-mock-idp.md) | Lokálny mock OIDC server pre development |

## Závislosti od SportUp

ClubUp **závisí** od:

- `auth.sportup.sk` musí byť OIDC-compliant issuer s discovery endpointom `/.well-known/openid-configuration`
- Musí podporovať **Authorization Code Flow + PKCE**
- Musí vystaviť claims: `sub` (= `sportup_person_id`), `email`, `name`, plus custom `sportup_roles` claim s ClubUp-špecifickými rolami
- Musí mať **JWKS endpoint** pre verifikáciu podpisu ID tokenu

Ak `auth.sportup.sk` ešte neexistuje (pravdepodobné v MVP), používame **mock IdP** (viď `dev-mock-idp.md`).

## Bezpečnostné požiadavky

- **PKCE povinné** (S256), aj keď ClubUp je confidential client — best practice
- **Nonce povinné** v authorize requeste, validuje sa proti id_token claim
- **State povinné** + uložené v cookie alebo session storage, validuje sa po callback
- **HTTPS only** — aj v development cez ngrok / mkcert
- **HttpOnly cookies** — nikdy nesmie byť token dostupný z JS
- **Token rotation** — access token 15 min, refresh token rotujúci s reuse detection
- **Backchannel logout** — keď sa užívateľ odhlási na sportup.sk, dostane ClubUp notifikáciu a invaliduje session

## Roly v ekosystéme

ClubUp interpretuje claim `sportup_roles[]` z ID tokenu. Možné hodnoty pre ClubUp:

| `sportup_roles` value | ClubUp rola | Popis |
|---|---|---|
| `clubup:student` | `student` | Default — kúpi si kurzy |
| `clubup:instructor` | `instructor` | Pripravuje obsah, vedie webináre |
| `clubup:content_manager` | `content_manager` | Edituje obsah kurzov, vytvára Drafts |
| `clubup:admin` | `admin` | Plná správa, refunds, vydávanie certifikátov |

Detaily v [`rbac.md`](rbac.md).

## Development workflow

V dev móde **bez `auth.sportup.sk`**:

1. Spusti mock IdP: `npm run mock-idp` (z `packages/auth/dev-idp`)
2. ClubUp env vars: `SPORTUP_OIDC_ISSUER=http://localhost:9000`
3. Mock vystaví fake user s rolami podľa `MOCK_USER_ROLES` env var
4. Auth.js callbacks fungujú normálne

V production:

1. Registrácia ClubUp ako OIDC client v `auth.sportup.sk` (admin workflow)
2. Dostane `client_id`, `client_secret`, redirect URIs whitelisting
3. Env vars na Verceli: `SPORTUP_OIDC_ISSUER=https://auth.sportup.sk`, `SPORTUP_OIDC_CLIENT_ID=...`, `SPORTUP_OIDC_CLIENT_SECRET=...`
