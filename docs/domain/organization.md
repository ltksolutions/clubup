# Organization

> ⚠️ **Organization nie je samostatná kolekcia v ClubUp.** Autoritatívnym zdrojom je `api.sportup.sk`. Tento dokument popisuje, **ako Organization dáta dostávame, kde ich denormalizujeme a aké pravidlá platia.**

## Identifikátor

`sportup_org_id` — UUID/ULID prideľovaný v SportUp registri pri vzniku organizácie.

## Typy organizácií, ktoré sú pre ClubUp relevantné

| Typ | Príklad | Vzťah ku ClubUp |
|---|---|---|
| Športový klub | ŠK Sparta Žilina | Sponzor enrollmentu, fakturačný subjekt |
| Národný zväz | Slovenský futbalový zväz | Sponzor enrollmentu (batch pre svojich predsedov klubov) |
| Regionálna organizácia | Krajský fubalový zväz Žilina | Podobne ako zväz |
| Akreditovaná inštitúcia | Žilinská univerzita, FRI | Vydáva certifikáty (`Course.accreditation.partnerOrgId`) |
| Samospráva | Mesto Žilina, Šport oddelenie | Sponzor enrollmentu pre klubových manažérov v meste |

## Zdroje dát

### REST API

`GET https://api.sportup.sk/organizations/{id}` vráti:

```json
{
  "id": "sportup_org_id_X",
  "name": "ŠK Sparta Žilina",
  "legal_name": "Športový klub Sparta Žilina, o.z.",
  "type": "sport_club",
  "ico": "12345678",
  "dic": "2020123456",
  "ic_dph": null,
  "address": { "country": "SK", "locality": "Žilina", "postal_code": "01001", "street_address": "Štadiónová 1" },
  "iban": "SK10 1100 0000 0000 0000 0000",
  "contact_email": "info@sparta.sk",
  "registry_status": "active"
}
```

### Search API

`GET https://api.sportup.sk/organizations?q=sparta&type=sport_club` pre auto-complete v UI (napr. pri nákupe kurzu, kde admin klubu vyberá fakturačný subjekt).

## Denormalizácia v ClubUp

| Cieľová entita | Snapshot polia |
|---|---|
| `Order` | `billingDetails.orgName`, `ico`, `dic`, `icDph`, `address` (snapshot pre faktúru) |
| `Certificate` | `issuedBy.partnerOrgId`, `partnerName` (snapshot pre certifikát) |
| `Course` | `accreditation.partnerOrgId`, `partnerName` (snapshot v čase publikácie kurzu) |

## `organizations_cache` kolekcia

Tenká cache pre rýchly UI render:

| Pole | Typ |
|---|---|
| `_id` | string (= `sportup_org_id`) |
| `name` | string |
| `legalName` | string |
| `ico` | string |
| `type` | string |
| `lastSyncedAt` | Date |

Invalidácia: nightly cron (TTL 7 dní), plus on-demand pri prvom použití v Order.

## Use case 1: Klub kupuje kurz pre svojho člena

```
Mária Nováková (student) chce absolvovať kurz "Športový manažment".
Predseda klubu (Klubový admin) povie: "Ja to za teba kúpim cez klub."

Flow:
1. Predseda klubu sa prihlási do app.clubup.sk
2. V katalógu klikne "Kúpiť pre člena klubu"
3. Vyberie si Máriu zo zoznamu členov svojho klubu (zoznam pochádza z api.sportup.sk)
4. Order vznikne s:
   - studentId = sportup_person_id of Mária
   - sponsorOrgId = sportup_org_id of klub
   - billingDetails.type = 'organization', billingDetails.orgName = klub
5. Klub zaplatí cez 24-pay (alebo bankovým prevodom — voliteľná alternatíva)
6. Mária dostane email "Tvoj klub ti zaplatil kurz, môžeš ho začať"
```

## Use case 2: ŽU ako akreditujúca inštitúcia

ŽU je v SportUp registri ako `type: educational_institution`. Pri publikácii kurzu „Športový manažment" content_manager vyberie ŽU v poli `Course.accreditation.partnerOrgId`. Snapshot mena a akreditačného čísla sa vloží do `Course.accreditation.partnerName`.

Pri vydaní certifikátu sa `Course.accreditation` skopíruje do `Certificate.issuedBy`.

## RBAC

Nezamieňať **role v SportUp** s **členstvom v organizácii**. Osoba môže byť:

- `club_admin:sportup_org_id_X` — admin tohto klubu, vie kupovať kurzy v jeho mene
- `executive_director:sportup_org_id_X` — výkonný riaditeľ, ten istý prístup
- `member:sportup_org_id_Y` — bežný člen, nevie kupovať v mene organizácie

ClubUp pri akcii „Kúpiť v mene organizácie" overuje cez `api.sportup.sk`, že prihlásená osoba má `*_admin` role v danej organizácii.

## GDPR

- Údaje o organizáciach v centrálnom registri sú **prevažne verejné** (názov, IČO, sídlo).
- IBAN a kontaktné údaje predsedov sú citlivejšie, ale stále spadajú pod legitímny záujem (verifikácia partnera).
- ClubUp pri spracovaní v Orderoch a certifikátoch sa drží **purpose limitation** — používame iba čo treba na faktúru/certifikát.
