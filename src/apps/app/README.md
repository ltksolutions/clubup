<!-- SPDX-FileCopyrightText: 2025 Ján Letko / LTK Solutions s.r.o.
     SPDX-License-Identifier: CC-BY-4.0 -->

# `apps/app` — Študentská aplikácia ClubUp

Doména: `app.clubup.sk`. Next.js 15 App Router. **Status: scaffold.**

## Pre koho

Verejne prístupná aplikácia, kde si študenti:

- Pozrú katalóg kurzov a ceny
- Prihlásia sa cez SportUp SSO
- Zakúpia kurz cez 24-pay
- Absolvujú vzdelávanie (Časti, testy, webináre)
- Zobrazia certifikáty

## Status

> **Scaffold úroveň.** `app/page.tsx` a `app/layout.tsx` sú placeholdry, ktoré demonštrujú integráciu s `@clubup/ui` a `@clubup/auth`. Skutočná implementácia začne v **Fáze 1** (2026 Q2) podľa plánu v `docs/architecture/frontend.md`.

## Lokálny dev

```bash
# 1. Spusti mock IdP (v inom termináli)
npm run mock-idp --workspace=@clubup/auth

# 2. Spusti Mongo (lokálne alebo cez Docker)
docker run -d -p 27017:27017 --name clubup-mongo mongo:7

# 3. Skopíruj env
cp src/apps/app/.env.example src/apps/app/.env.local
# vyplň AUTH_SECRET (openssl rand -base64 32)

# 4. Spusti app
npm run dev --workspace=@clubup/app
# → http://localhost:3000
```

## Build & deploy

Vercel projekt: `clubup-app` na `app.clubup.sk`. Detaily v `docs/operations/deployment.md`.

## Štruktúra (po implementácii)

```
app/
├── (public)/              # marketingové podstránky (login, ceny)
├── (dashboard)/           # po prihlásení
│   ├── kurzy/
│   ├── profil/
│   └── certifikaty/
├── kurzy/[slug]/          # detail kurzu (SEO public)
│   ├── page.tsx
│   └── learn/             # priebeh kurzu po enrollmente
│       └── [levelSlug]/[topicSlug]/[partSlug]/
├── api/
│   ├── auth/[...nextauth]/
│   ├── webhooks/24pay/
│   ├── webhooks/mux/
│   └── cron/...
├── layout.tsx
├── page.tsx               # homepage / katalog
└── globals.css

components/                # app-špecifické (nie zdieľané)
lib/                       # business logika, services
auth.ts                    # Auth.js v5 inštancia
middleware.ts              # auth + rate limit
```

## Súvisiace

- Doménový model: `docs/domain/`
- API špecifikácia: `docs/api/`
- Architektúra: `docs/architecture/frontend.md`, `docs/architecture/backend.md`
- Curriculum: `docs/curriculum/sportovy-manazment.md`
