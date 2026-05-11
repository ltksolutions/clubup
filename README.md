# ClubUp.sk

> **Vzdelávacia platforma pre manažment športových klubov**
>
> Otvorené vzdelávanie a aplikácia pre výkonných riaditeľov, manažérov a lídrov športových klubov na Slovensku. Súčasť otvoreného ekosystému [SportUp.sk](https://sportup.sk).

[![License: EUPL-1.2](https://img.shields.io/badge/License-EUPL--1.2-blue.svg)](LICENSE)
[![License: CC-BY-4.0](https://img.shields.io/badge/Docs-CC--BY--4.0-lightgrey.svg)](LICENSE-DOCS)
[![REUSE status](https://api.reuse.software/badge/github.com/ltksolutions/clubup)](https://api.reuse.software/info/github.com/ltksolutions/clubup)
[![Status: Concept](https://img.shields.io/badge/Status-Concept_v0.1-orange.svg)]()
[![Slovak](https://img.shields.io/badge/Lang-Slovak-blue.svg)]()

---

## O projekte

**ClubUp.sk** je vzdelávací modul ekosystému [SportUp.sk](https://sportup.sk). Ponúka systematické vzdelávanie pre ľudí, ktorí riadia športové kluby — od úvodných pojmov po komplexné strategické riadenie organizácie. Projekt je realizovaný v spolupráci s **Fakultou riadenia a informatiky Žilinskej univerzity** ako akreditovaným poskytovateľom certifikácie.

Repozitár obsahuje:

- **Marketingový web** `clubup.sk` — verejná prezentácia programu, tém a úrovní vzdelávania
- **Dokumentačnú stránku** `docs.clubup.sk` (v príprave) — branded čitateľná verzia obsahu `/docs` (Nextra 4, [ADR-0009](docs/decisions/0009-documentation-site.md))
- **Webovú aplikáciu** `app.clubup.sk` (v príprave) — študentské prostredie pre absolvovanie kurzov, sledovanie progresu, testov a získanie certifikátu
- **Administračnú aplikáciu** `admin.clubup.sk` (v príprave) — správa kurzov, lekcií, lektorov, študentov a vyhodnocovanie
- **Kompletnú dokumentáciu** architektúry, doménového modelu a integrácie do ekosystému SportUp

## Vzdelávací program — Fáza 1

Štartujeme s prvým kurzom **„Športový manažment pre silnejšie kluby"**:

- **10 tematických oblastí** — od právneho prostredia cez financovanie, marketing až po infraštruktúru
- **40 vzdelávacích modulov** — každá téma má 4 moduly s rastúcou náročnosťou
- **4 úrovne** — Základy → Pokročilý → Špecialista → Stratég
- **Formát** — video, text + obrázky, prezentácie, live webináre cez Microsoft Teams, záverečný test
- **Certifikácia** — vydáva akreditovaná inštitúcia (Žilinská univerzita)

Kompletná osnova je v [`docs/curriculum/sportovy-manazment.md`](docs/curriculum/sportovy-manazment.md).

## Repozitár obsahuje

```
.
├── README.md                  ← ste tu
├── CONTRIBUTING.md            ← ako prispieť
├── CODE_OF_CONDUCT.md         ← pravidlá komunity
├── SECURITY.md                ← bezpečnostná politika
├── CHANGELOG.md               ← história zmien
├── ROADMAP.md                 ← plán implementácie
├── CITATION.cff               ← citácia projektu
├── LICENSE                    ← EUPL-1.2 (zdrojové kódy)
├── LICENSE-DOCS               ← CC-BY-4.0 (dokumentácia)
├── REUSE.toml                 ← centrálne licenčné mapovanie (REUSE 3.3)
├── LICENSES/                  ← plné texty používaných licencií
│   ├── EUPL-1.2.txt           ← pre zdrojové kódy
│   └── CC-BY-4.0.txt          ← pre dokumentáciu a web
├── turbo.json                 ← Turborepo pipeline (po naplnení src/)
├── package.json               ← workspace root
├── docs/                      ← kompletná dokumentácia
│   ├── 00-overview.md         ← prehľad systému a kontext
│   ├── 01-glossary.md         ← slovník pojmov
│   ├── architecture/          ← architektonické rozhodnutia (ADR)
│   ├── domain/                ← doménový model (Course, Lesson, Enrollment, …)
│   ├── api/                   ← REST API špecifikácia ClubUp
│   ├── auth/                  ← SSO so SportUp.sk
│   ├── payments/              ← integrácia 24-pay.sk
│   ├── curriculum/            ← osnovy kurzov
│   ├── operations/            ← deployment, monitoring, security
│   └── decisions/             ← ADR (Architecture Decision Records)
├── website/                   ← marketingový web (statické HTML/CSS/JS)
│   ├── index.html, *.html     ← jednotlivé stránky
│   ├── styles.css, script.js  ← štýly a skripty
│   ├── brand/                 ← logo, design manuál (PDF)
│   └── favicon/               ← ikony
└── src/                       ← Turborepo monorepo (aplikácie)
    ├── apps/
    │   ├── app/               ← študentská aplikácia (app.clubup.sk)
    │   ├── admin/             ← admin aplikácia (admin.clubup.sk)
    │   └── doc/               ← dokumentačná stránka (docs.clubup.sk), Nextra 4
    └── packages/
        ├── ui/                ← zdieľaný design system
        ├── db/                ← MongoDB Atlas modely
        ├── auth/              ← klient SSO so SportUp.sk
        └── config/            ← zdieľaná TS/ESLint/Tailwind konfigurácia
```

## Začnite tu

| Som… | Začnem v… |
|---|---|
| **Nový prispievateľ** | [`docs/00-overview.md`](docs/00-overview.md) → [`docs/01-glossary.md`](docs/01-glossary.md) · po nasadení aj na [`docs.clubup.sk`](https://docs.clubup.sk) |
| **Architekt / tech lead** | [`docs/architecture/README.md`](docs/architecture/README.md) |
| **Backend vývojár** | [`docs/domain/README.md`](docs/domain/README.md) → [`docs/api/README.md`](docs/api/README.md) |
| **Frontend vývojár** | [`docs/architecture/frontend.md`](docs/architecture/frontend.md) → [`src/apps/app/README.md`](src/apps/app/README.md) |
| **DevOps** | [`docs/operations/deployment.md`](docs/operations/deployment.md) |
| **Marketing / obsah** | [`website/README.md`](website/README.md) |
| **Lektor / obsahový manažér** | [`docs/curriculum/README.md`](docs/curriculum/README.md) |

## Princípy projektu

1. **Súčasť ekosystému SportUp** — identita osôb a organizácií sa preberá z centrálneho registra cez SSO, neevidujeme ich znova
2. **API-first** — admin aplikácia konzumuje to isté API ako študentská, žiadne skratky
3. **Otvorené zdrojové kódy** — kód pod EUPL-1.2, dokumentácia pod CC-BY-4.0
4. **Akreditovaná certifikácia** — sami nevydávame certifikáty, partnerujeme s akreditovanými inštitúciami
5. **GDPR v jadre** — minimalizácia dát, jasné účely spracovania, prepojenie na Purpose Catalogue SportUp
6. **Slovenský kontext** — legislatíva, financovanie, PUŠ systém, slovenská diakritika v UI aj v dokumentácii

## Stav

**Verzia 0.1 — koncepčný návrh.** Aktuálne v repozitári je:

- Kompletná dokumentácia architektúry, doménového modelu a integrácií
- Statický marketingový web pripravený na nasadenie z Vercelu (zatiaľ beží na websupport.sk, plánuje sa migrácia)
- Kostra (scaffold) Turborepo monorepa pre `apps/app` a `apps/admin`
- Návrh integrácie SSO so SportUp.sk a platobnej brány 24-pay.sk

Implementácia samotných aplikácií ešte nezačala — repo slúži ako východiskový bod pre senior developera, ktorý vývoj prevezme.

## Stack

| Vrstva | Technológia |
|---|---|
| Marketingový web | Statické HTML5 + CSS + vanilla JS |
| Aplikácie (frontend + backend) | **Next.js 15** (App Router, Server Actions) |
| Runtime | **Node.js 20 LTS** |
| Databáza | **MongoDB Atlas** (M10+ produkcia, M0 dev) |
| Auth | **OIDC klient** napojený na `auth.sportup.sk` (Auth.js v5) |
| Platby | **24-pay.sk REST API** (HMAC-SHA256, redirect + webhook) |
| Hosting | **Vercel** (web + apps) |
| Monorepo | **Turborepo** + npm workspaces |
| UI knižnica | **shadcn/ui** + Tailwind CSS |
| Video | **Mux** (sledované self-hosted video pre kurzy) |
| Live výučba | **Microsoft Teams** (cez kalendárové pozvánky) |
| Email | **Resend** (transakčné), **MailerLite** (newsletter) |
| Monitoring | **Vercel Analytics** + **Sentry** |

## Licencia

- **Zdrojové kódy** — [European Union Public Licence v1.2 (EUPL-1.2)](LICENSE)
- **Dokumentácia, číselníky, schémy a obsah webu** — [CC-BY-4.0](LICENSE-DOCS)

EUPL je open-source licencia vytvorená Európskou komisiou, **právne ekvivalentná v 23 jazykoch EÚ** vrátane slovenčiny. Kompatibilné znenia všetkých jazykových verzií sú dostupné na [joinup.ec.europa.eu](https://joinup.ec.europa.eu/collection/eupl/eupl-text-eupl-12).

### REUSE Compliance

Projekt je v plnom súlade s [**REUSE Specification 3.3**](https://reuse.software/spec/) — každý súbor v repozitári má jednoznačnú licenčnú a copyright metadata. Centrálne licenčné mapovanie je v [`REUSE.toml`](REUSE.toml), plné texty licencií v [`LICENSES/`](LICENSES/).

Validácia lokálne:
```bash
pipx install reuse  # alebo: pip install --user reuse
reuse lint
```

Compliance je automaticky kontrolovaná pri každom push a pull request — pozri [`.github/workflows/reuse.yml`](.github/workflows/reuse.yml).

## Vzťah k ostatným projektom ekosystému

```
                 ┌─────────────────────────────┐
                 │        SportUp.sk           │
                 │   (centrálny register +     │
                 │    autorita pre identitu)   │
                 └──────────────┬──────────────┘
                                │ OIDC SSO + REST API
                ┌───────────────┼───────────────┐
                ▼               ▼               ▼
       ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
       │ Activity.sk  │ │  ClubUp.sk   │ │   …ďalšie    │
       │  (podujatia) │ │ (vzdelávanie)│ │  aplikácie   │
       └──────────────┘ └──────────────┘ └──────────────┘
```

ClubUp **neeviduje osoby ani organizácie autoritatívne** — používa identity zo SportUp registra. Vlastné dáta ClubUp:

- **Course** — kurz (napr. „Športový manažment")
- **Module / Lesson** — moduly a lekcie kurzu
- **Enrollment** — zápis konkrétnej osoby do konkrétneho kurzu
- **Progress** — postup v kurze, výsledky testov
- **Order / Payment** — objednávka a platba
- **Certificate** — záznam o vydaní certifikátu (samotný certifikát vydáva Žilinská univerzita)

## Autor a kontakt

**Autor návrhu:** Ján Letko
**E-mail:** info@clubup.sk
**Web:** [clubup.sk](https://clubup.sk) (marketing) · [github.com/ltksolutions/clubup](https://github.com/ltksolutions/clubup) (kód)
**Súvisiaci projekt:** [sportup.sk](https://sportup.sk)

Komunikácia s autorom prebieha v **slovenčine**. Issues a PR môžu byť písané po slovensky aj po anglicky.

## Ako prispieť

Pozrite si [CONTRIBUTING.md](CONTRIBUTING.md). V skratke:

1. **Návrhy a otázky** → otvorte [Issue](https://github.com/ltksolutions/clubup/issues)
2. **Konkrétne zmeny** → otvorte [Pull Request](https://github.com/ltksolutions/clubup/pulls) z feature branche
3. **Bezpečnostné incidenty** → e-mail na info@clubup.sk, nie cez verejné Issues
