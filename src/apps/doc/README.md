# `@clubup/doc` — dokumentačná stránka `docs.clubup.sk`

Rendrovacia vrstva nad `/docs` (root repozitára). Postavená na **Nextra 4** nad **Next.js 15** (App Router). Nasadzuje sa na **Vercel** pod doménou `docs.clubup.sk`. Rozhodnutie a kontext: [ADR-0009](../../../docs/decisions/0009-documentation-site.md).

## Princíp: content mirror

Zdroj pravdy je **`/docs`** v koreni repa. Tento workspace ho pri každom build-e zrkadlí do `./content` ako `.mdx` súbory cez `scripts/mirror-content.mjs`. `content/` je v `.gitignore` — nikdy ho necommituj.

Edituješ vždy v `/docs/**/*.md`. Stránka sa pri ďalšom deploye prerendruje.

## Lokálne spustenie

```bash
# Z koreňa repa
npm install                     # nainštaluje aj tento workspace

# Buď z koreňa cez turbo…
npm run dev -- --filter=@clubup/doc

# …alebo priamo v adresári
cd src/apps/doc
npm run dev                     # http://localhost:3003
```

Skript `predev` / `prebuild` najprv zrkadlí `/docs` do `./content`, potom Next.js naštartuje.

## Build pre produkciu

```bash
npm run build --filter=@clubup/doc
# 1) mirror-content.mjs    → vyrobí content/
# 2) next build            → SSG všetkých MDX stránok
# 3) pagefind              → indexuje vygenerované HTML pre vyhľadávanie
```

## Štruktúra

```
src/apps/doc/
├── package.json                ← @clubup/doc, next 15, nextra 4
├── next.config.mjs             ← withNextra() + security headers
├── tsconfig.json
├── next-env.d.ts
├── mdx-components.js           ← Nextra 4 (App Router) requirement
├── app/
│   ├── layout.jsx              ← Layout, Navbar, Footer, Banner (branded)
│   ├── globals.css             ← brand overrides pre nextra-theme-docs
│   └── [[...mdxPath]]/
│       └── page.jsx            ← catch-all MDX renderer
├── scripts/
│   └── mirror-content.mjs      ← /docs → ./content
├── content/                    ← GENEROVANÉ (.gitignore)
├── public/
│   ├── logo.svg                 ← biele logo pre navy navbar (z website/brand/logo/)
│   ├── favicon.svg              ← CU monogram (z website/favicon/)
│   └── README.md                ← vysvetlenie zdrojov assetov
├── .gitignore
└── README.md                   ← (tento súbor)
```

## Navigácia (sidebar) — `_meta.js`

Nextra generuje sidebar z file-systému, ale poradie a slovenské popisy sú v `_meta.js` súboroch. Po prvom úspešnom build-e a deploye treba do `/docs` doplniť na vybraných miestach `_meta.js`:

- `docs/_meta.js` — top-level poradie (00-overview, 01-glossary, architecture, domain, …)
- `docs/domain/_meta.js` — slovenské popisy entít (Course → "Kurz", Topic → "Téma", …)
- `docs/decisions/_meta.js` — poradie ADR

Tieto súbory sa **commitujú do `/docs`** (sú súčasťou zdroja pravdy, nie generované). Mirror skript ich kopíruje 1:1.

## Deploy na Vercel

1. Vo Vercel UI: **New Project** → vyber `ltksolutions/clubup` repo
2. **Root Directory:** `src/apps/doc`
3. **Framework Preset:** Next.js
4. **Build Command:** `npm run build` (alebo necháš default)
5. **Domain:** `docs.clubup.sk`
6. **DNS** (websupport.sk): `CNAME docs → cname.vercel-dns.com`

Po prvom deploye sa každý push do `main` automaticky redeployuje. PR dostanú preview URL.

## Branding

Sleduje [Design Manual v1.0](../../../website/brand/):

- Navy `#1A2D47`, Blue `#388FC3`, Blue light `#E8F4FD`
- Poppins font (cez Google Fonts, importované v `app/globals.css`)
- JetBrains Mono pre `<code>`
- Logo a favicon zdieľané s marketingovým webom

Brand overrides nad default Nextra témou sú v `app/globals.css`.

## Vyhľadávanie

[Pagefind](https://pagefind.app/) — Rust-powered static search index, generuje sa `postbuild` skriptom z vyrenderovaného HTML. Funguje plne offline (žiadne externé služby) a podporuje slovenskú diakritiku.

## Edit-this-page

Každá stránka má v pravom hornom rohu link **"Upraviť túto stránku na GitHub"** vedúci na zodpovedajúci `.md` súbor v `/docs`. Konfigurované cez `docsRepositoryBase` v `app/layout.jsx`.

## Licencia

- Kód tohto workspace-u (`next.config.mjs`, `app/layout.jsx`, `scripts/`, atď.) — **EUPL-1.2**
- Tento README — **CC-BY-4.0** (`src/apps/*/README.md` pattern v `REUSE.toml`)
- Obsah `/docs` — **CC-BY-4.0**
