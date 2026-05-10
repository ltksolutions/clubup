<!-- SPDX-FileCopyrightText: 2025 Ján Letko / LTK Solutions s.r.o.
     SPDX-License-Identifier: CC-BY-4.0 -->

# `src/` — Monorepo

Aplikácie a knižnice ClubUp platformy.

## Štruktúra

```
src/
├── apps/
│   ├── app/             # Študentská aplikácia (app.clubup.sk) — Next.js 15
│   └── admin/           # Admin aplikácia (admin.clubup.sk) — Next.js 15
└── packages/
    ├── auth/            # OIDC client + RBAC + dev mock IdP
    ├── config/          # Zdieľaný TS, ESLint, Tailwind preset
    ├── db/              # MongoDB modely so Zod schémami
    └── ui/              # Shadcn/ui design system
```

## Závislosti

```
apps/app    ─┐
             ├─→ packages/ui ──→ packages/config
apps/admin  ─┤              └─→ tailwind preset (z config)
             ├─→ packages/auth ──→ (Auth.js v5)
             └─→ packages/db ────→ (MongoDB driver, Zod)
```

`apps/*` sú **konzumenti** — nikto neimportuje z apps.
`packages/*` sú **knižnice** — môžu importovať navzájom (`db ← auth`, ale nie naopak).

## Príkazy

Z root repa:

```bash
npm install                # install all workspaces
npm run dev                # spusti všetky apps + watch mode na packages
npm run build              # build všetkého
npm run lint               # ESLint na celom monorepe
npm run typecheck          # TypeScript check na celom monorepe
npm run test               # Vitest unit + integration testy
```

Per-workspace:

```bash
npm run dev --workspace=@clubup/app          # iba študentská app
npm run build --workspace=@clubup/admin      # iba admin app
npm run test --workspace=@clubup/db          # iba db package
```

## Tech stack

- **Node 20 LTS** (viď `.nvmrc`)
- **TypeScript 5.6** strict mode
- **Next.js 15** (App Router, Server Actions, RSC)
- **MongoDB** cez native driver + Zod schémas
- **Auth.js v5** (NextAuth) ako OIDC client
- **Tailwind CSS 4** + shadcn/ui
- **Turborepo** pre task orchestration
- **Vitest** pre unit/integration testy
- **Playwright** pre E2E (v `apps/*/e2e/`)

Viď `docs/decisions/0001-tech-stack.md` a `0002-monorepo.md`.

## Status

> **Tento scaffold je placeholder.** Skutočná implementácia príde v rámci Fázy 0 (2025 Q4–2026 Q1). Cieľom tohto scaffoldu je definovať **štruktúru** a **packaging boundaries**, aby vývoj začal so správnymi zámkami od prvého commitu.

Konkrétny stav per package je v jeho README.
