# Person

> ⚠️ **Person nie je samostatná kolekcia v ClubUp.** Autoritatívnym zdrojom je `api.sportup.sk`. Tento dokument popisuje, **ako Person dáta dostávame, kde ich denormalizujeme a aké pravidlá platia.**

## Identifikátor

`sportup_person_id` — UUID alebo ULID prideľovaný v SportUp registri pri vzniku osoby. ClubUp ho používa ako primárny kľúč pre študentov, lektorov, adminov.

## Zdroje dát

### 1. ID Token (po prihlásení cez OIDC)

Po SSO prihlásení dostaneme JWT s claims:

```json
{
  "iss": "https://auth.sportup.sk",
  "sub": "sportup_person_id_123",
  "aud": "clubup",
  "exp": 1700000000,
  "name": "Mária Nováková",
  "given_name": "Mária",
  "family_name": "Nováková",
  "email": "maria.novakova@klubsparta.sk",
  "email_verified": true,
  "locale": "sk",
  "sportup_roles": ["student", "club_admin:sportup_org_id_X"]
}
```

### 2. UserInfo endpoint

`GET https://auth.sportup.sk/userinfo` (s `Authorization: Bearer <access_token>`) vráti rozšírené dáta:

```json
{
  "sub": "sportup_person_id_123",
  "name": "Mária Nováková",
  "email": "...",
  "phone_number": "+421 ...",
  "address": { "country": "SK", "locality": "Žilina", "postal_code": "01001", "street_address": "Hlavná 1" },
  "birthdate": "1985-04-12",
  "ico": null,
  "dic": null,
  "organizations": [
    { "org_id": "sportup_org_id_X", "name": "ŠK Sparta", "role": "executive_director" }
  ]
}
```

### 3. SportUp REST API

`GET https://api.sportup.sk/persons/{id}` (s aplikačným tokenom ClubUp) vráti detailné dáta o osobe pre admin pohľady.

## Denormalizácia v ClubUp

Pri vzniku týchto dokumentov **uložíme snapshot** vybraných polí:

| Cieľová entita | Snapshot polia |
|---|---|
| `Enrollment` | `studentDisplayName`, `studentEmail` |
| `Order` | `billingDetails` (kompletný snapshot vrátane fakturačnej adresy), `studentDisplayName`, `studentEmail` |
| `Certificate` | `studentDisplayName`, `studentBirthDate` |
| `TestAttempt` | `studentId` (referencia, nie celý snapshot) |

**Prečo**: rýchly render bez dodatočného fetchu, a navyše pre faktúry/certifikáty je snapshot **právne nutný** (faktúra musí ukazovať dáta v čase vystavenia).

## Aktualizácia denormalizovaných dát

- **Pri každom prihlásení** sa ID Token claims porovná s posledným snapshotom v `users_cache` (tenká kolekcia v ClubUp len pre rýchly read access).
- **Pri zmene mena** v SportUp sa to v ClubUp prejaví:
  - V `users_cache` automaticky pri ďalšom logine
  - V `Enrollment.studentDisplayName` len ak admin manuálne resync-ne
  - V `Order.billingDetails` **nikdy** (immutable po platbe)
  - V `Certificate.studentDisplayName` **nikdy** (immutable, registrované u ŽU)

## `users_cache` kolekcia

Tenká cache pre rýchly UI render bez fetch-u na `auth.sportup.sk`:

| Pole | Typ |
|---|---|
| `_id` | string (= `sportup_person_id`) |
| `displayName` | string |
| `email` | string |
| `avatarUrl` | string |
| `roles` | string[] |
| `lastSyncedAt` | Date |

Cache sa invaliduje pri každom logine + nightly cron (TTL 7 dní).

## RBAC mapping

`sportup_roles` zo SSO sa mapujú na ClubUp role:

| SportUp role | ClubUp role |
|---|---|
| `student` (vždy default) | `student` |
| `clubup_instructor` | `instructor` |
| `clubup_content_manager` | `content_manager` |
| `clubup_admin` | `admin` |
| `club_admin:{org}` | `student` (pre kupu kurzov), navyše môže sponsorovať enrollmenty cez `sportup_org_id` |

Detaily v [`../auth/rbac.md`](../auth/rbac.md) (TBD).

## GDPR

- Osobné údaje sú **vlastnené SportUp** ako spracovateľom. ClubUp je **subspracovateľ** (sub-processor) na špecifický účel — vzdelávanie a vydávanie certifikátov.
- Pri žiadosti o vymazanie sa študent obracia na **SportUp**, ktorý notifikuje ClubUp.
- ClubUp pri žiadosti vymaže `users_cache` záznam, anonymizuje `Enrollment.studentDisplayName` na `"Anonymizovaný študent"`. **Faktúry a certifikáty sa NEVYMAZÁVAJÚ** — sú to právne dokumenty s 10-ročnou retention obligáciou (zákon o dani z príjmov, archivačné povinnosti).
- Detaily v [`../operations/gdpr.md`](../operations/gdpr.md).
