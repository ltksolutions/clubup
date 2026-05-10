<!-- SPDX-FileCopyrightText: 2025 Ján Letko / LTK Solutions s.r.o.
     SPDX-License-Identifier: CC-BY-4.0 -->

# `apps/admin` — Administrátorská aplikácia ClubUp

Doména: `admin.clubup.sk`. Next.js 15 App Router. **Status: scaffold.**

## Pre koho

Vnútorná aplikácia s prístupom obmedzeným na role:

- `content_manager` — vytvára a edituje obsah kurzov
- `admin` — všetky práva content_manager + publish, refund, vystavovanie certifikátov, audit

## Status

> **Scaffold úroveň.** Skutočná implementácia začne v **Fáze 1** (2026 Q2).

## Hlavné moduly (po implementácii)

- **Kurzy** — CRUD pre celú hierarchiu Course → Level → Topic → Module → Part
- **Otázky a testy** — question bank, tagovanie, configurácia testov (fixed / random_sample)
- **Webináre** — plánovanie cez Microsoft Teams, RSVP, recording link
- **Zápisy** — manuálne udelenie, predĺženie, reset pokusov
- **Objednávky a platby** — prehľad, refund cez 24-pay, faktúry
- **Certifikáty** — vystavovanie, revokácia, overenie cez `/verify/{number}`
- **Audit log** — read-only, filtrovanie

## Lokálny dev

```bash
# Pre admin použij iný MOCK_USER_ROLES
cp src/apps/admin/.env.example src/apps/admin/.env.local
# v .env.local: MOCK_USER_ROLES=clubup:admin

npm run dev --workspace=@clubup/admin
# → http://localhost:3001
```

## Bezpečnosť

- **Distinct cookie name** (`__Secure-clubup.admin.session`) — žiadny cross-app leak
- **`X-Robots-Tag: noindex, nofollow`** — admin sa neindexuje
- **Server-side RBAC** — každá Server Action a Route Handler má `requirePermission(...)`
- **Audit log** — všetky privileged akcie sa zaznamenávajú cez `@clubup/db/audit`

## Deploy

Vercel projekt: `clubup-admin` na `admin.clubup.sk`. Detaily v `docs/operations/deployment.md`.
