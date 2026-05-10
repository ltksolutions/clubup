# ClubUp.sk — prehľad systému

> Tento dokument je východiskovým bodom pre každého, kto sa s projektom zoznamuje. Po jeho prečítaní by ste mali vedieť **prečo** projekt existuje, **ako zapadá** do ekosystému SportUp.sk a **kde** v repozitári hľadať detaily.

## 1. Prečo ClubUp existuje

Slovenský šport má štrukturálny problém: **kluby riadia ľudia bez systematického vzdelania v športovom manažmente**. Niekto je bývalý hráč, niekto rodič, niekto nadšenec — ale len málokto má formálne vzdelanie v oblasti, ktorá zahŕňa právo, financie, marketing, projektové riadenie a stakeholder management.

Existujúce možnosti vzdelávania sú:

- **Vysokoškolské programy** (FTVŠ UK, FŠT KU, FRI ŽU) — sú akademické, nie praktické pre výkonných riaditeľov klubov, ktorí už pracujú a nemajú 3 roky na denné štúdium
- **Komerčné MBA** — drahé, často generické, nezohľadňujú slovenský právny a finančný kontext (PUŠ, dotácie, zákon o športe)
- **Konferencie a školenia** — fragmentárne, jednorazové, bez merateľného výstupu

ClubUp uzatvára túto medzeru: **modulárne, online, slovenské, s certifikáciou akreditovanou inštitúciou (Žilinská univerzita)**.

## 2. Cieľová skupina

| Primárna | Sekundárna |
|---|---|
| Výkonní riaditelia klubov | Manažéri konkrétnych oblastí (marketing, financie) |
| Zakladatelia nových klubov a akadémií | Lídri zväzov a regionálnych organizácií |
| Generálni sekretári | Trénerske rady, predsedovia výborov |
| | Pracovníci samosprávy zodpovední za šport |
| | Študenti odborov športový manažment (ako doplnok ku štúdiu) |

## 3. Vzťah k ekosystému SportUp.sk

```
                 ┌─────────────────────────────┐
                 │        SportUp.sk           │
                 │   centrálny register +      │
                 │    autorita pre identitu    │
                 └──────────────┬──────────────┘
                                │
                ┌───────────────┼───────────────┐
                │ OIDC SSO      │ REST API      │
                ▼               ▼               ▼
       ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
       │ Activity.sk  │ │  ClubUp.sk   │ │   …ďalšie    │
       │  podujatia   │ │ vzdelávanie  │ │  aplikácie   │
       └──────────────┘ └──────────────┘ └──────────────┘
```

ClubUp **neeviduje osoby ani organizácie autoritatívne**. Pre každú osobu, ktorá sa zaregistruje do kurzu, používame `sportup_person_id` z centrálneho registra. Pre každú organizáciu (klub, zväz, samospráva) používame `sportup_org_id`. Detaily v [`auth/`](auth/).

ClubUp si autoritatívne **vlastní**:

### Vzdelávací obsah (4-vrstvová hierarchia)

- **Course** — kurz (napr. „Športový manažment pre silnejšie kluby")
- **Level** — úroveň v kurze (sekvenčná: Level 1 → 2 → 3 → 4)
- **Topic** — téma v rámci úrovne (organizačný kontajner, bez testu)
- **Module** — modul = priesečník (Téma × Úroveň); hlavná hodnotiaca jednotka
- **Part** — časť modulu, najmenšia jednotka obsahu (`contentBlocks[]` s text/video/audio/prezentácia/PDF + voliteľný Part-test)

### Hodnotenie

- **Test** — testy môžu byť na 4 miestach: Časť, Modul, Úroveň, Course
- **Question** — otázky v teste (single/multiple choice, true/false, short text)
- **TestAttempt** — pokus študenta o test (zachová poradie otázok aj odpovedí pre forenznú reprodukovateľnosť)

### Operatíva

- **Webinar** — plánovaný live event v Microsoft Teams (s Mux záznamom)
- **Enrollment** — zápis konkrétnej osoby do konkrétneho kurzu
- **Progress** — postup osoby v kurze (otvorené časti, výsledky testov, dokončené moduly a úrovne)
- **Order** — objednávka kurzu
- **Payment** — platba cez 24-pay (kópia transakčných dát, 24-pay je zdroj pravdy)
- **Certificate** — záznam o vydanom certifikáte. Dva typy:
  - `final` — hlavný akreditovaný certifikát po dokončení kurzu (vydáva ŽU)
  - `intermediate` — voliteľný medzicertifikát po dokončení Levelu

Kompletný doménový model je v [`domain/`](domain/).

## 4. Hlavné architektonické rozhodnutia

| Oblasť | Rozhodnutie | Detail |
|---|---|---|
| Stack | Next.js 15 + Node.js 20 + MongoDB Atlas | [`decisions/0001-tech-stack.md`](decisions/0001-tech-stack.md) |
| Monorepo | Turborepo + npm workspaces | [`decisions/0002-monorepo.md`](decisions/0002-monorepo.md) |
| Hosting | Vercel | [`decisions/0003-hosting-vercel.md`](decisions/0003-hosting-vercel.md) |
| Auth | OIDC klient → `auth.sportup.sk` (Auth.js v5) | [`decisions/0004-sso-via-sportup.md`](decisions/0004-sso-via-sportup.md), [`auth/`](auth/) |
| Platby | 24-pay.sk REST API + webhook | [`decisions/0005-payments-24pay.md`](decisions/0005-payments-24pay.md), [`payments/`](payments/) |
| Video | Mux (HLS streaming, signed URLs) | [`decisions/0006-video-mux.md`](decisions/0006-video-mux.md) |
| Live výučba | Microsoft Teams (cez kalendárové pozvánky) | [`decisions/0007-live-teams.md`](decisions/0007-live-teams.md) |
| Certifikácia | Žilinská univerzita (FRI) | [`decisions/0008-certification-zu.md`](decisions/0008-certification-zu.md) |

## 5. Princípy projektu

1. **Súčasť ekosystému SportUp** — žiadna duplicitná evidencia osôb a organizácií. Identitu, role a vzťahy preberáme zo SportUp registra. Toto nás drží v synchrone s realitou slovenského športu.

2. **API-first** — Admin a Študentská aplikácia konzumujú **to isté API** (Next.js Route Handlers + Server Actions). Žiadne „skratky" pre admina, žiadny duplicitný kód.

3. **Otvorené zdrojové kódy** — kód pod EUPL-1.2, dokumentácia pod CC-BY-4.0. EUPL je otvorená licencia EÚ Komisie, ekvivalentná v 23 jazykoch EÚ vrátane slovenčiny.

4. **Akreditovaná certifikácia** — sami nevydávame certifikáty. Spolupracujeme so Žilinskou univerzitou (FRI) ako akreditovanou inštitúciou. ClubUp poskytuje obsah a evaluáciu, ŽU vydáva oficiálny certifikát.

5. **GDPR v jadre** — minimalizácia dát, jasné účely spracovania, prepojenie na Purpose Catalogue SportUp. Detaily v [`operations/gdpr.md`](operations/gdpr.md).

6. **Slovenský kontext** — slovenčina v UI aj dokumentácii, slovenský právny a daňový rámec, slovenská diakritika všade. PUŠ systém, zákon č. 440/2015 Z. z. o športe, dotačné mechanizmy MŠVVaŠ SR, IBAN/SEPA platby.

7. **Mobile-first UX** — väčšina študentov si bude obsah prezerať na mobile alebo tablete medzi povinnosťami v klube, nie pri pracovnom stole.

8. **Žiadny dark pattern** — bez auto-renewal predplatného bez upozornenia, bez hidden fees, bez psychologického nátlaku na nákup. Cena kurzu je verejná, vrátenie peňazí možné podľa zákona o ochrane spotrebiteľa.

## 6. Stav projektu

**Verzia 0.1 — koncepčný návrh.** V repozitári máme kompletnú dokumentáciu a scaffold, ale aplikácie ešte nie sú implementované. Poradie implementácie podľa [`../ROADMAP.md`](../ROADMAP.md):

1. **Marketingový web** (najbližšia fáza) — migrácia z websupport.sk na Vercel
2. **SSO** (závisí od `auth.sportup.sk`)
3. **Študentská aplikácia** (`app.clubup.sk`)
4. **Admin aplikácia** (`admin.clubup.sk`)
5. **Druhý a ďalšie kurzy**

## 7. Ako sa vyznám v repozitári

```
docs/
├── 00-overview.md           ← ste tu
├── 01-glossary.md           ← slovník pojmov
├── architecture/            ← high-level architektúra
├── domain/                  ← entity, vzťahy, eventy
├── api/                     ← REST endpoints, OpenAPI
├── auth/                    ← SSO so SportUp.sk
├── payments/                ← 24-pay integrácia
├── curriculum/              ← osnovy kurzov
├── operations/              ← deployment, monitoring, GDPR, security
└── decisions/               ← ADR (rozhodnutia)
```

| Som… | Začnem v… |
|---|---|
| **Architekt** | [`architecture/`](architecture/) → [`decisions/`](decisions/) |
| **Backend developer** | [`domain/`](domain/) → [`api/`](api/) |
| **Frontend developer** | [`architecture/frontend.md`](architecture/frontend.md) → `src/apps/app/README.md` |
| **DevOps** | [`operations/deployment.md`](operations/deployment.md) |
| **Lektor / obsahový manažér** | [`curriculum/`](curriculum/) |
| **Marketing** | [`../website/README.md`](../website/README.md) |
| **DPO / GDPR** | [`operations/gdpr.md`](operations/gdpr.md) |

## 8. Ďalšie čítanie

- **Konvencie projektu** — [`../CONTRIBUTING.md`](../CONTRIBUTING.md)
- **Plán** — [`../ROADMAP.md`](../ROADMAP.md)
- **Glossary** — [`01-glossary.md`](01-glossary.md)
- **Prvé ADR** — [`decisions/`](decisions/)
- **SportUp.sk** — [github.com/ltksolutions/sportup.sk](https://github.com/ltksolutions/sportup.sk)
