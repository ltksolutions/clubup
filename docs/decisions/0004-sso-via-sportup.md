# ADR-0004: SSO cez auth.sportup.sk (OIDC client v ClubUp)

- **Status:** Accepted (závisí od dostupnosti `auth.sportup.sk`)
- **Dátum:** 2026-05-10
- **Rozhodol:** Ján Letko (LTK Solutions)
- **Súvisiace ADR:** ADR-0001 (tech stack), ADR-0008 (certifikácia)

## Kontext

ClubUp je **súčasť ekosystému SportUp.sk**. Princíp ekosystému je, že:

- **Osoba** je evidovaná len raz v centrálnom registri SportUp
- **Organizácia** (klub, zväz) je evidovaná len raz v centrálnom registri SportUp
- Všetky aplikácie ekosystému (Activity, ClubUp, ďalšie) **referencujú** entity zo SportUp registra cez ID, **neduplikujú ich**

Z toho plynie, že **prihlasovanie musí byť centrálne**:
- Užívateľ má **jeden účet** pre celý ekosystém
- Heslá, 2FA, password reset sa riešia na jednom mieste
- Pri zmene mena/emailu sa prejaví všade

Stav: **`auth.sportup.sk` ešte neexistuje** — bude sa stavať v sesterskom projekte. ClubUp ako prvý konzument tohto SSO musí byť pripravený, ale nesmie blokovať vývoj na tom, že SSO nie je hotové.

## Zvažované možnosti

### Možnosť A — Vlastná autentifikácia v ClubUp (email + heslo cez Auth.js Credentials)
- **Pros:** rýchle naimplementovať, žiadna závislosť na inom projekte
- **Cons:** **porušuje princíp jedinej identity**, duplikuje účty (jeden užívateľ bude mať konto v SportUp aj v ClubUp), heslá v ClubUp DB sú ďalším bezpečnostným rizikom, password reset infra navyše

### Možnosť B — SAML 2.0 federácia
- **Pros:** štandard pre enterprise SSO
- **Cons:** ťažký XML-based protokol, slabá podpora v JS knižniciach, **overkill** pre nás (nie sme enterprise)

### Možnosť C — OAuth 2.0 (bez OIDC)
- **Pros:** ľahší než SAML
- **Cons:** OAuth sám o sebe je len autorizačný protokol, nedáva nám identitu (`name`, `email`) štandardným spôsobom — preto je OIDC nadstavba navrhnutá presne pre toto

### Možnosť D — OIDC (OpenID Connect) s `auth.sportup.sk` ako OIDC issuer
- **Pros:** štandard pre identity federation, JWT tokeny majú profile claims, refresh token flow, single sign-out, výborná podpora v Auth.js
- **Cons:** vyžaduje, aby `auth.sportup.sk` bol implementovaný ako OIDC provider (čo bude stáť čas v sesterskom projekte)

## Rozhodnutie

**ClubUp je OIDC client; `auth.sportup.sk` je OIDC issuer.**

- ClubUp nemá vlastné heslá, vlastnú registráciu, vlastný password reset
- Auth.js v5 v `packages/auth` ako OIDC client
- Token claims preberáme z ID Token; profile detaily z UserInfo endpointu
- Pre dev mód implementujeme **lokálny mock IdP** (`packages/auth/dev-idp`), aby vývoj ClubUp nezávisel od dostupnosti `auth.sportup.sk`

### Diagram flow

```
User                  ClubUp (app.clubup.sk)         auth.sportup.sk
  |                            |                            |
  | klik "Prihlásiť"           |                            |
  |--------------------------->|                            |
  |                            | redirect /authorize        |
  |                            |--------------------------->|
  |                            |    s code_challenge (PKCE) |
  |   prihl. obrazovka                                      |
  |<--------------------------------------------------------|
  | credentials                                             |
  |-------------------------------------------------------->|
  |                            | redirect s code            |
  |                            |<---------------------------|
  |                            | POST /token (code+verifier)|
  |                            |--------------------------->|
  |                            | id_token + access_token    |
  |                            |<---------------------------|
  |                            | GET /userinfo (Bearer)     |
  |                            |--------------------------->|
  |                            | profile JSON               |
  |                            |<---------------------------|
  |   logged in (session)                                   |
  |<---------------------------|                            |
```

## Dôvody

1. **Zachováva princíp jedinej identity** — nezduplikujeme osoby
2. **Auth.js v5 má excellent OIDC support** — generic provider config v ~30 riadkoch
3. **Token claims poskytnú sportup_person_id ako primárny kľúč** pre študentské entity v ClubUp DB
4. **Single sign-out** — užívateľ sa odhlási na sportup.sk a všetky aplikácie ekosystému spadnú zo session
5. **Mock IdP pre dev** — aj keď `auth.sportup.sk` nebude hotový hneď, vieme stavať ClubUp s ním pripraveným adapterom

## Dôsledky

### Pozitívne
- Žiadna password DB v ClubUp = nižšia attack surface
- 2FA, magic links, sociálne logins — všetko sa rieši v `auth.sportup.sk` raz pre celý ekosystém
- Konzistentný UX prihlasovania naprieč všetkými aplikáciami ekosystému
- GDPR — užívateľ má jeden bod pre data subject access requests

### Negatívne / kompromisy
- **Závislosť na `auth.sportup.sk`** — keď spadne SSO, spadnú všetky aplikácie
  - Mitigácia: SSO musí mať vyšší uptime SLA než aplikácie, hostnuté oddelene
- **Cross-domain cookies** — `auth.sportup.sk` a `app.clubup.sk` sú rôzne registrable domains, takže nemôžeme zdieľať cookies. Riešenie: standard OIDC redirect flow (čo je default)
- **Custom claims pre RBAC** — potrebujeme aby SportUp vedel poslať `sportup_roles` claim s rolami špecifickými pre ClubUp (`clubup_admin`, `clubup_content_manager`, `clubup_instructor`). Toto vyžaduje koordináciu s tímom SportUp
- **Vývoj ClubUp pred dostupnosťou SSO** — riešime cez mock IdP

### Neutrálne
- Token expirácia — nastavíme krátky access token (15 min) + rotujúci refresh token, podobne ako odporúča OIDC best practices

## Implementačné poznámky

- OIDC discovery URL: `https://auth.sportup.sk/.well-known/openid-configuration`
- Scope: `openid profile email sportup_roles`
- Redirect URIs:
  - `https://app.clubup.sk/api/auth/callback/sportup`
  - `https://admin.clubup.sk/api/auth/callback/sportup`
  - `http://localhost:3000/api/auth/callback/sportup` (dev)
- Klient registrácia: ClubUp dostane `client_id` a `client_secret` od `auth.sportup.sk` admin
- PKCE: zapnúť pre ClubUp (aj keď je confidential klient — best practice)
- Mock IdP pre dev: `packages/auth/dev-idp` — jednoduchý server, ktorý simuluje OIDC odpovede
- Detaily integrácie v [`../auth/`](../auth/) (TBD)

## Revisit

- **Po nasadení `auth.sportup.sk`** — ostré integration testy, vyhodnotenie token strategy
- **Pri pridaní 3rd aplikácie do ekosystému** (Activity, ďalšie) — možno bude treba špecifické scope-y per aplikácia
- **Ak by bolo treba enterprise SSO** (klub má svoj Azure AD a chce login cez neho) — pridáme upstream SAML federáciu na `auth.sportup.sk`, ClubUp sa nemení

## Odkazy

- [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html)
- [Auth.js v5 OIDC providers](https://authjs.dev/getting-started/authentication/oauth)
- [PKCE for OAuth Public Clients](https://datatracker.ietf.org/doc/html/rfc7636)
- [`../auth/`](../auth/) — implementačné detaily
