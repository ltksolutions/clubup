# Ako prispieť do ClubUp.sk

Vďaka, že máte záujem prispieť do projektu. Tento dokument popisuje, ako spolupracujeme.

## Tabuľka obsahu

1. [Druhy prispievania](#druhy-prispievania)
2. [Pred prvým commitom](#pred-prvým-commitom)
3. [Workflow](#workflow)
4. [Conventional Commits](#conventional-commits)
5. [Branch model](#branch-model)
6. [Pull Request proces](#pull-request-proces)
7. [Štýl dokumentácie](#štýl-dokumentácie)
8. [Štýl kódu](#štýl-kódu)
9. [Architektonické rozhodnutia](#architektonické-rozhodnutia)
10. [Bezpečnosť](#bezpečnosť)

## Druhy prispievania

V tejto fáze projektu sú najpotrebnejšie príspevky do **dokumentácie, doménového modelu a obsahu kurzu**:

- **Pripomienky k doménovému modelu** — chýbajúce entity, atribúty, edge cases v `docs/domain/`
- **Návrhy lekcií a testových otázok** pre kurz „Športový manažment" v `docs/curriculum/`
- **Recenzia integrácie SSO so SportUp** v `docs/auth/`
- **Recenzia integrácie 24-pay** v `docs/payments/`
- **Návrhy nových kurzov** — osnova, cieľová skupina, výstupy
- **Validácia právnych aspektov** — GDPR, daňová legislatíva (autorské honoráre lektorov), spotrebiteľské právo (kúpa kurzu)
- **Lokalizácia obsahu** — čeština ako neskoršia priorita
- **Marketing & SEO** — kontrola textov, optimalizácia stránok

V neskorších fázach pribudne kód (Next.js aplikácie, MongoDB schémy, integrácie).

## Pred prvým commitom

1. **Prečítajte si [docs/00-overview.md](docs/00-overview.md)** — kontext a hlavné rozhodnutia
2. **Prečítajte si [docs/01-glossary.md](docs/01-glossary.md)** — používame ucelený slovník pojmov
3. **Skontrolujte [Issues](https://github.com/ltksolutions/clubup/issues)** — možno už niekto pracuje na tom istom

## Workflow

```
1. Otvorte Issue, ak ide o väčšiu zmenu — diskusia o smere
2. Forknite repo (alebo si vyžiadajte prístup, ak ste z tímu)
3. Vytvorte branch z `main` s vhodným menom
4. Urobte commity s popisnými správami
5. Otvorte Pull Request voči `main`
6. Reagujte na review komentáre
7. Po schválení merge cez "Squash and merge"
```

## Conventional Commits

Používame [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

[body]

[footer]
```

**Typy:**
- `docs` — zmena v dokumentácii
- `model` — zmena doménového modelu, schémy entity
- `curriculum` — zmena obsahu kurzu (lekcie, testy, osnovy)
- `web` — zmena marketingového webu (`website/`)
- `app` — zmena študentskej aplikácie (`src/apps/app`)
- `admin` — zmena admin aplikácie (`src/apps/admin`)
- `pkg` — zmena zdieľaného balíka (`src/packages/*`)
- `auth` — SSO integrácia
- `payment` — platobná integrácia
- `feat` — nová funkcionalita (kód)
- `fix` — oprava bugu (kód)
- `refactor` — refaktoring kódu bez zmeny správania
- `chore` — údržba, build, CI

**Príklady:**

```
docs(architecture): pridať ADR pre voľbu Mux ako video provider

curriculum(sportovy-manazment): doplniť modul 5.3 o organizačnú kultúru

web(index): pridať sekciu „Pre zväzy" na úvodnú stránku

app(enrollment): zápis študenta po úspešnej platbe cez 24-pay webhook

auth(oidc): refresh token rotation s detection of replay
```

## Branch model

- **`main`** — stabilná verzia, vždy nasaditeľná. Priame commity sú zakázané, len cez PR.
- **`feat/<short-name>`** — feature branche pre nové funkcionality
- **`fix/<short-name>`** — bugfixy
- **`docs/<short-name>`** — väčšie zmeny dokumentácie
- **`exp/<short-name>`** — experimentálne návrhy, ktoré nemusia merge

Branch by mal žiť čo najkratšie. Ak sa práca naťahuje, pravidelne mergujte `main` do feature branche, aby ste predišli veľkým konfliktom.

## Pull Request proces

PR by mal:

- Mať popisný titulok podľa Conventional Commits
- V tele odkazovať na súvisiace Issue (`Fixes #42`, `Refs #58`)
- Vysvetliť **prečo**, nie len **čo** sa mení
- Mať checklist relevantných úloh (viď [šablónu PR](.github/pull_request_template.md))
- Prejsť cez review aspoň jedného maintainera

Maintaineri budú reagovať do **5 pracovných dní**. Ak sa tak nestane, pingnite v komentári.

## Štýl dokumentácie

- **Jazyk:** primárny je slovenčina. Anglické verzie sú vítané v paralelných súboroch s príponou `.en.md`.
- **Formát:** Markdown podľa [GitHub Flavored Markdown](https://github.github.com/gfm/)
- **Riadky:** zalomujte na ~100 znakov pre čitateľnosť v editore aj na GitHube
- **Diakritika:** áno, používame plnú slovenskú diakritiku
- **Identifikátory v texte:** používajte `code style` (napr. `enrollment_id`)
- **Krížové odkazy:** relatívne cesty (`[Glossary](../01-glossary.md)`)
- **Diagramy:** preferujeme [Mermaid](https://mermaid.js.org/) — renderuje sa priamo v GitHube
- **Schémy entít:** v sekciách s tabuľkami `Pole | Typ | Popis`

## Štýl kódu

- **TypeScript** pre celý backend a frontend
- **Strict mode** zapnutý vo všetkých `tsconfig.json`
- **Žiadne `any`** bez explicitného komentára prečo
- **Prettier** + **ESLint** s konfiguráciou v repe — pred commitom spustite `npm run format && npm run lint`
- **Funkčný štýl** preferovaný pred imperatívnym, kde to dáva zmysel
- **Server Components** ako default v Next.js; `"use client"` len keď to skutočne treba (formuláre, interaktivita)
- **Server Actions** pre mutácie namiesto custom REST endpointov, kde to dáva zmysel
- **MongoDB**: všetky modely v `packages/db`, prístup len cez repository funkcie, nie priamo z UI kódu
- **Testy** povinné pre business logiku v `packages/*` a pre platobný/SSO flow
  - Unit testy: Vitest
  - E2E testy: Playwright (kritické flows: login, kúpa kurzu, dokončenie testu)

Kompletný štýlový sprievodca bude v `docs/operations/code-style.md` v Fáze 3.

## Licenčný headers (REUSE 3.3)

Každý zdrojový súbor (kód, HTML, CSS, JS, YAML) má mať header:

```typescript
// SPDX-FileCopyrightText: 2026 Ján Letko / LTK Solutions
// SPDX-License-Identifier: EUPL-1.2
```

```html
<!--
SPDX-FileCopyrightText: 2026 Ján Letko / LTK Solutions
SPDX-License-Identifier: CC-BY-4.0
-->
```

Pre súbory pokryté centrálne v `REUSE.toml` headers nie sú potrebné, ale neuškodia. Validujte cez:

```bash
pipx run reuse lint
```

## Architektonické rozhodnutia

Väčšie zmeny v architektúre alebo doménovom modeli si vyžadujú **ADR (Architecture Decision Record)**. Šablóna je v [`docs/decisions/0000-template.md`](docs/decisions/0000-template.md).

ADR má:
- **Číslo a názov** — `0001-monorepo-turborepo.md`
- **Status** — Proposed, Accepted, Deprecated, Superseded
- **Context** — prečo riešime
- **Decision** — čo sme rozhodli
- **Consequences** — čo to spôsobí, kompromisy

Existujúce ADR sú v `docs/decisions/`.

## Bezpečnosť

Ak nájdete bezpečnostnú zraniteľnosť alebo problém ovplyvňujúci ochranu osobných údajov:

- **NEOTVÁRAJTE Issue.** Verejné Issue dáva útočníkom čas zneužiť problém pred opravou.
- **Pošlite e-mail na `info@clubup.sk`** s popisom a možnými dôsledkami.
- **Nevyžadujte odpoveď za hodinu** — ak ide o critical, dostanete reakciu do 48 hodín.

Pozri tiež [SECURITY.md](SECURITY.md).

## Otázky

Ak niečo z tohto dokumentu nie je jasné, otvorte Issue s tagom `question` alebo napíšte na info@clubup.sk.
