# ADR-0009: Dokumentačná stránka `docs.clubup.sk` na Nextra 4

- **Status:** Accepted
- **Dátum:** 2026-05-11
- **Rozhodol:** Ján Letko (LTK Solutions)
- **Súvisiace ADR:** ADR-0001 (tech stack), ADR-0002 (monorepo), ADR-0003 (hosting Vercel)

## Kontext

V repozitári máme rozsiahlu dokumentáciu v `docs/`:

- `00-overview.md`, `01-glossary.md` — vstupné dokumenty
- `architecture/`, `domain/`, `api/`, `auth/`, `payments/`, `curriculum/`, `operations/`, `decisions/` — odborné sekcie
- ~30+ Markdown súborov, slovenčina s plnou diakritikou, krížové odkazy

Dokumentácia je v GitHub-e čitateľná, ale:

- **Nevyhľadáva sa** — GitHub má len full-text search cez celý repo, nie cez dokumentáciu samostatne
- **Nemá navigáciu** — čitateľ musí poznať file-tree, aby sa vyznal
- **Nemá branding** — pre marketing, partnerov a senior developera, ktorý vývoj prevezme, je matný GitHub README horší prvý dojem než vlastná stránka
- **Nemá verziovanie** — keď sa v budúcnosti zmení doménový model, chceme vedieť, ktorá verzia dokumentácie patrí ku ktorej verzii kódu

Súčasne **nechceme** druhý zdroj pravdy. Markdown v `docs/` musí zostať primárny — to je miesto, kde sa edituje, kde prebieha PR review, kde sú REUSE headers, kde je krížovo odkazované z kódu. Dokumentačná stránka je len **renderovacia vrstva** nad tým istým obsahom.

## Zvažované možnosti

### Možnosť A — Nextra 4 (Next.js plugin)

- **Pros:**
  - Stack-natívna — Next.js 15 App Router je presne to, čo používame v `src/apps/app` a `src/apps/admin`
  - Autor projektu ju **už pozná** z iného projektu, nulový onboarding
  - MDX otvára cestu k interaktívnym ukážkam doménového modelu (live preview komponentov z `@clubup/ui`)
  - Built-in **Pagefind** (Rust-powered search) — bez závislosti na Algolia DocSearch
  - Built-in podpora pre GitHub Alert syntax, Mermaid, Tabs, Cards, FileTree, Steps
  - "Edit this page" link priamo na GitHub — pre open-source projekt ideálne
  - Zapadne do Turborepo monorepa ako `src/apps/doc`, rovnaký build pipeline ako ostatné apps
- **Cons:**
  - Verziovanie nie je natívne; ak by sme chceli `v1` a `v2` paralelne, musíme si to riešiť cez git branches alebo manuálne
  - Nextra 4 je relatívne nová (release koniec 2024), niektoré edge-case bugy ešte vyplávajú
  - Vyžaduje minimum konfigurácie (theme.config, layout.jsx, mdx-components.js)

### Možnosť B — Docusaurus 3 (Meta)

- **Pros:**
  - Najzrelší ekosystém pre docs, dospelý versioning, viacjazyčnosť
  - Veľa pluginov (algolia, blog, redoc, ...)
- **Cons:**
  - **Druhý mentálny stack** — samostatný React framework s vlastným bundlerom (Webpack), vlastným config jazykom, vlastnou strukturou. Žiadny prienik s Next.js, ktorý používame inde
  - Vyhľadávanie je Algolia DocSearch (treba žiadosť, schvaľovanie ~2 týždne pre OSS) alebo lokálny plugin tretej strany
  - Pomalší dev server pri väčších docs (Webpack)

### Možnosť C — Astro Starlight

- **Pros:**
  - Pekný default, rýchly, malý JS bundle
  - Trendy v 2026
- **Cons:**
  - Astro je tretí framework v projekte (popri Next.js a static HTML pre marketingový web)
  - Komponenty z `@clubup/ui` (React) by sa do Astro stránok museli importovať cez Astro Islands — funkčné, ale komplikované
  - Menšia komunita a menej kontextu pre tím

### Možnosť D — MkDocs Material (Python)

- **Pros:**
  - Najjednoduchšie zo všetkých, výborné out-of-box search, krásny default
- **Cons:**
  - Python sa **nikde inde v projekte nevyskytuje** (Node.js 20 LTS všade)
  - DevOps overhead: druhý runtime v CI, druhý package manager v repos
  - Žiaden prienik s `@clubup/ui` (nemožno renderovať React komponenty)

### Možnosť E — Statická stránka v `website/` (rovnaký pattern ako `clubup.sk`)

- **Pros:**
  - Žiadny nový framework
- **Cons:**
  - Manuálne udržiavanie navigácie pre 30+ stránok je neudržateľné
  - Žiadne vyhľadávanie
  - Žiadne syntax highlighting, žiadne MDX

### Možnosť F — Nechať len GitHub README

- **Pros:**
  - Nula práce navyše
- **Cons:**
  - Nereprezentatívne pre seriózny open-source projekt, ktorý má pretvoriť slovenské športové vzdelávanie
  - Pre senior developera, ktorý si projekt obzerá, GitHub `docs/` tree nie je ekvivalent k peknej stránke s vyhľadávaním
  - Pre marketing a partnerov ŽU/MŠVVaŠ je odkaz na `github.com/.../docs/00-overview.md` slabší než `https://docs.clubup.sk`

## Rozhodnutie

**Nextra 4 ako `src/apps/doc` v Turborepo, deployed na `docs.clubup.sk` cez Vercel.**

- Workspace `@clubup/doc` v `src/apps/doc/`
- Stack: Next.js 15 App Router + Nextra 4 + nextra-theme-docs
- **Content mirror pattern:** `docs/` zostáva primárnym zdrojom; pre-build skript zrkadlí `.md` súbory do `src/apps/doc/content/` ako `.mdx`. Žiadny duplicitný obsah nie je commit-nutý — `content/` je v `.gitignore`
- Branding podľa Design Manuálu: navy `#1A2D47`, blue `#388FC3`, Poppins font, ClubUp logo v navbare
- Vercel projekt č. 4 (popri marketing webe, `app.clubup.sk`, `admin.clubup.sk`) — pozri ADR-0003

## Dôvody

V poradí dôležitosti pre tento konkrétny projekt:

1. **Žiadny nový mentálny stack** — Nextra je Next.js plugin. Senior developer, ktorý prevezme vývoj, už má v hlave `app/`, RSC, App Router, `next.config.mjs`. Nextra do toho len pridá MDX rendering a Pagefind search. Pre 1-osobový tím (resp. dvojicu autor + senior) je toto rozhodujúce.

2. **Autor projektu Nextru pozná** — overené v inom projekte. Zero learning curve pre primárneho udržiavateľa.

3. **Markdown v `docs/` zostáva zdroj pravdy** — content mirror pattern (skript `mirror-content.mjs`) garantuje, že každý edit ide do `docs/` a stránka ho zoberie pri ďalšom build-e. Žiadny risk drift-u medzi obsahom v repo a obsahom na stránke.

4. **Pagefind search** — Rust-powered, lokálne indexovanie pri build-e, žiadne externé služby, žiadne čakanie na Algolia approval, podpora slovenskej diakritiky (testované).

5. **Open-source friendly UX** — "Edit this page" link automaticky vedie na GitHub edit URL pre daný `.md` súbor. Komunita môže opravovať preklepy cez UI.

6. **Možnosť budúcich interaktívnych prvkov** — keď budeme chcieť do `domain/course.md` vložiť live preview Course kartu z `@clubup/ui`, alebo do `api/README.md` Swagger UI, MDX to umožní. Bez tejto možnosti by sa dokumentačná stránka zúžila na "Markdown viewer".

7. **Turborepo-friendly** — `src/apps/doc/` je ďalší workspace; build, dev, lint, typecheck ide cez ten istý `turbo run`. Žiadny CI overhead navyše.

## Dôsledky

### Pozitívne

- Verejne dostupná, branded dokumentačná stránka na `docs.clubup.sk`
- Vyhľadávanie cez celú dokumentáciu (Pagefind, lokálne)
- Automatický deploy pri každom merge do `main` (Vercel + GitHub integrácia)
- Preview deployment pre každý PR — reviewer vidí, ako vyzerá zmena v rendrovanej forme
- "Edit this page" znižuje bariéru pre komunitné príspevky
- Pre marketing a partnerov ŽU/MŠVVaŠ profesionálnejší prvý dojem
- MDX otvára dvere k interaktívnym ukážkam (budúcnosť)

### Negatívne / kompromisy

- **Build krok navyše** — `mirror-content.mjs` musí prebehnúť pred `next build`. Riziko: ak skript zlyhá, stránka sa nepostaví. Mitigácia: skript je trivailne testovateľný (kopírovanie + rename `.md` → `.mdx` + úprava front-matteru). CI test ho pokrýva.
- **Vendor coupling s Nextra-špecifickými konvenciami** — `_meta.js` súbory pre navigáciu, MDX-špecifické JSX bloky. Pri migrácii inde (ak by Nextra prestala fungovať) treba prepísať len root layout a `_meta.js`; samotný obsah `docs/` zostáva čistý Markdown.
- **Slovenská diakritika v slug-och** — Nextra defaultne slug-ifikuje nadpisy. Pre nadpisy typu "Časť" alebo "Úroveň" treba v `_meta.js` explicitne pomenovať položky a držať file-system mená v ASCII (`part.mdx`, `level.mdx`) — čo už takto je, lebo `docs/domain/` to dodržiava.
- **Štyri Vercel projekty miesto troch** — drobne komplikuje deployment matrix v `docs/operations/deployment.md` (treba doplniť).

### Neutrálne

- Doména `docs.clubup.sk` (CNAME na `cname.vercel-dns.com`) sa pridá do DNS u websupport.sk súbežne s ostatnými subdoménami
- Licenčný režim sa nemení: `docs/**` je `CC-BY-4.0`, `src/apps/doc/**` (kód layoutu a config) je `EUPL-1.2` — pokryté existujúcim `REUSE.toml`

## Implementačné poznámky

### Štruktúra `src/apps/doc/`

```
src/apps/doc/
├── package.json              ← @clubup/doc, next, nextra, nextra-theme-docs
├── next.config.mjs           ← withNextra({...}) + security headers
├── tsconfig.json             ← extends @clubup/config/tsconfig.next.json
├── next-env.d.ts
├── mdx-components.js         ← Nextra 4 requirement
├── theme.config.tsx          ← logo, repo link, footer
├── scripts/
│   └── mirror-content.mjs    ← docs/**/*.md → content/**/*.mdx
├── app/
│   ├── layout.jsx            ← Layout, Navbar, Footer, Banner
│   └── [[...mdxPath]]/
│       └── page.jsx          ← catch-all renderer
├── content/                  ← GENEROVANÉ (v .gitignore)
│   └── (zrkadlené docs/)
├── public/
│   ├── logo.svg              ← z website/brand/
│   └── favicon.ico           ← z website/favicon/
├── .gitignore                ← content/, .next/, .pagefind/
└── README.md
```

### Mirror skript (princíp)

1. Skopíruje `docs/**/*.md` do `src/apps/doc/content/**/*.mdx`
2. Premenuje extension `.md` → `.mdx`
3. Prepíše interné odkazy `[...](../foo.md)` → `[...](../foo)` (Nextra route-y nemajú `.md`)
4. Pre súbory bez front-matteru pridá minimálny `--- title: ... ---` z prvého H1
5. Volá sa cez `prebuild` v `package.json`

### DNS

- `CNAME docs → cname.vercel-dns.com` v websupport.sk DNS panel
- Vo Vercel projekte `clubup-doc` priradiť doménu `docs.clubup.sk`

### Aktualizácie ostatných dokumentov

- [`../operations/deployment.md`](../operations/deployment.md) — pridať `docs.clubup.sk` do deployment matrix
- [`../../README.md`](../../README.md) — pridať odkaz na `docs.clubup.sk` do "Začnite tu" sekcie
- [`../../website/`](../../website/) — všetky nav-extras odkazy na "Dokumentácia" preklopiť z GitHub `tree/main/docs` na `https://docs.clubup.sk`

## Revisit

- **Ak Nextra 4 prestane byť aktívne udržiavaná** — migrácia na Docusaurus alebo Astro Starlight. `docs/` zostáva čistý Markdown, takže migrácia by bola len o novom render-i a novej navigácii.
- **Ak prídeme na bottleneck Pagefind-u** (napr. zlé výsledky pre slovenskú diakritiku v praxi) — zvážiť Algolia DocSearch (open-source projekt má nárok zadarmo)
- **Pri 100+ dokumentačných stránkach** — zvážiť automatickú generáciu `_meta.js` zo súborového stromu, prípadne plugin pre ADR rendering s metadata badgmi

## Odkazy

- [Nextra Docs Theme](https://nextra.site/docs/docs-theme)
- [Nextra 4 release blogpost](https://the-guild.dev/blog/nextra-4) — App Router, Pagefind, server components
- [Pagefind](https://pagefind.app/) — Rust-powered static search
- [ADR-0003 (Hosting na Verceli)](0003-hosting-vercel.md)
