# Architektúra

ClubUp je **monorepo** s troma hlavnými výstupmi:

1. **Marketingový web** (`website/`) — statické HTML/CSS/JS, deploy ako root projektu na Vercel
2. **Študentská aplikácia** (`src/apps/app/`) — Next.js 15, beží na `app.clubup.sk`
3. **Admin aplikácia** (`src/apps/admin/`) — Next.js 15, beží na `admin.clubup.sk`

Aplikácie zdieľajú kód cez `src/packages/*` (UI, DB, auth, config).

## Diagramy

- [`high-level.md`](high-level.md) — architektonický prehľad celého systému
- [`frontend.md`](frontend.md) — frontend architektúra (App Router, Server Components, dátový tok)
- [`backend.md`](backend.md) — backend architektúra (API, doménové služby, MongoDB)
- [`security.md`](security.md) — bezpečnostný model (zero-trust, RBAC, secrets)
- [`scaling.md`](scaling.md) — strategie škálovania (Vercel limity, MongoDB Atlas, Mux)

## Princípy

### 1. Žiadna duplicitná identita

`auth.sportup.sk` je **jediný issuer JWT tokenov** pre celý ekosystém. ClubUp nemá vlastnú databázu hesiel, nemá vlastnú registráciu (cez UI), nemá vlastný password reset. Detaily v [`../auth/`](../auth/).

### 2. API-first

Admin a Študentská aplikácia konzumujú **to isté API**. Žiadny privátny „backdoor" pre admina. Toto nás núti dobre navrhnúť autorizáciu (RBAC) a vyhneme sa úniku, keď admin endpoint pre študenta omylom otvoríme.

V praxi: API endpoints sú v `src/apps/app/app/api/` a `src/apps/admin/app/api/` a v Server Actions. Doménová logika je v `src/packages/db` (data access) a v doménových moduloch v `src/apps/*/lib/`.

### 3. Server-first rendering

Default je **Server Component**. `"use client"` len keď to skutočne treba (interaktivita, brouzers API, hooks). Toto minimalizuje JS bundle a maximalizuje SEO + cache.

### 4. Mongo schémy v jednom mieste

`src/packages/db/` obsahuje všetky kolekcie a Zod schémy. Aplikácie nemajú vlastné modely — vždy importujú z `@clubup/db`.

### 5. Žiadny ORM

Používame **MongoDB driver** priamo (s pomocnými funkciami v `packages/db`). Mongoose pridáva komplexitu a neriešia naše prípady (transakcie cez session, change streams). Validácia ide cez **Zod**, ktorý zdieľame medzi serverom a klientom.

### 6. Edge-aware

Marketingový web je statický → CDN. API endpoints sú Node.js runtime (kvôli MongoDB driveru); niektoré jednoduché edge handlers (geolokácia pre A/B testing) môžu ísť na Edge runtime.

## Prečítajte si ďalej

- [`high-level.md`](high-level.md) — diagramy a tok dát
- [`../decisions/`](../decisions/) — prečo sme zvolili tento stack
- [`../domain/`](../domain/) — entity a vzťahy
