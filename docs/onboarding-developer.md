<!-- SPDX-FileCopyrightText: 2025 Ján Letko / LTK Solutions s.r.o.
     SPDX-License-Identifier: CC-BY-4.0 -->

# Onboarding pre vývojárov

> Cieľová skupina: **senior alebo skúsený mid-level full-stack developer**, ktorý prichádza do projektu prvýkrát a chce ho lokálne spustiť, pochopiť kód a začať prispievať.

Predpokladaný čas na onboarding: **2 dni** (4 h prečítanie + 4 h sfunkčniť lokálne dev prostredie + 8 h prvý zmysluplný PR).

## 1. Prečítaj v tomto poradí

| # | Súbor | Prečo | Čas |
|---|---|---|---|
| 1 | [`README.md`](../README.md) | Čo robíme a pre koho | 5 min |
| 2 | [`docs/00-overview.md`](00-overview.md) | Architektonický prehľad systému | 15 min |
| 3 | [`docs/01-glossary.md`](01-glossary.md) | Pojmy v slovenčine — Course/Level/Topic/Module/Part/Test | 10 min |
| 4 | [`docs/decisions/`](decisions/) | Všetkých 8 ADR — prečo Vercel, Mongo, Mux, 24-pay, ŽU | 30 min |
| 5 | [`docs/domain/README.md`](domain/README.md) | ER diagram, životné cykly entít | 15 min |
| 6 | [`docs/architecture/frontend.md`](architecture/frontend.md) + [`backend.md`](architecture/backend.md) | Next.js 15 stack, Mongo kolekcie, doménové služby | 45 min |
| 7 | [`docs/api/README.md`](api/README.md) | REST API princípy, error format, idempotency | 15 min |
| 8 | [`docs/auth/README.md`](auth/README.md) + [`oidc-client.md`](auth/oidc-client.md) | SportUp SSO, dev mock IdP | 20 min |
| 9 | [`docs/operations/code-style.md`](operations/code-style.md) | Naming, structure, lint, git | 15 min |
| 10 | [`docs/operations/security.md`](operations/security.md) | Secrets, RBAC, GDPR | 15 min |

Po prečítaní by si mal vedieť odpovedať:

- **Prečo má Course → Level → Topic → Module → Part hierarchiu, nie len Course → Module → Lesson?** (viď `docs/domain/README.md`)
- **Prečo nemáme tabuľku `users`?** (viď `docs/decisions/0004-sso-via-sportup.md`)
- **Prečo testy ukladajú denormalizované otázky a poradie odpovedí?** (viď `docs/domain/test.md` + `versioning.md`)

## 2. Pripravenie lokálneho prostredia

### Prerekvizity

- **Node.js 20 LTS** (viď `.nvmrc`)
- **npm 10+**
- **MongoDB 7** lokálne alebo cez Docker
- **Git** s SSH kľúčom registrovaným v GitHube

### Inštalácia

```bash
# 1. Clone
git clone git@github.com:ltksolutions/clubup.git
cd clubup

# 2. Node verzia
nvm use   # alebo: nvm install 20

# 3. Dependencies (vytvorí package-lock.json pri prvom behu)
npm install

# 4. MongoDB (Docker)
docker run -d -p 27017:27017 --name clubup-mongo mongo:7

# 5. Secrets pre dev
cp src/apps/app/.env.example src/apps/app/.env.local
cp src/apps/admin/.env.example src/apps/admin/.env.local
# Vygeneruj AUTH_SECRET pre obe:
openssl rand -base64 32

# 6. Spusti mock IdP (v inom termináli)
npm run mock-idp --workspace=@clubup/auth
# beží na http://localhost:9000

# 7. Spusti študentskú app
npm run dev --workspace=@clubup/app
# → http://localhost:3000

# 8. (Voliteľne) admin app v ďalšom termináli
npm run dev --workspace=@clubup/admin
# → http://localhost:3001
```

### Sanity check

Po `npm install` musí prejsť:

```bash
npm run typecheck     # všetko typed
npm run lint          # žiadne errory
npm run build         # apps a packages sa zostavia
```

> **Pozn.:** Apps placeholdry sú scaffold-úrovne a obsahujú iba ukážkovú homepage. Skutočné stránky (`/kurzy`, `/profil`, login flow) sa dopĺňajú postupne. Mock IdP je tiež scaffold (discovery + JWKS hotové, authorize/token TODO podľa `docs/auth/dev-mock-idp.md`).

## 3. Známe medzery, ktoré zatiaľ čakajú na vývojára

Toto NIE SÚ skryté problémy — sú to vedome odložené úlohy, ktoré treba riešiť pri prvej iterácii:

### `@clubup/db`
- 16 kolekcií podľa `docs/domain/*`, ale fyzicky implementované sú len **3 vzorové** (`courses`, `enrollments`, `audit`). Ostatné (`levels`, `topics`, `modules`, `parts`, `tests`, `questions`, `test_attempts`, `webinars`, `progress`, `orders`, `payments`, `certificates`, `webhooks`) treba dorobiť podľa rovnakého patternu.
- **Migračný runner chýba** — indexy z `schema.ts` komentárov treba aplikovať. Odporúčam jednoduchý `migrations/` adresár s číslovanými skriptami spúšťanými cez `npm run db:migrate`.
- **Žiadne testy.** Pridať `vitest` + `mongodb-memory-server` setup.

### `@clubup/auth`
- **Refresh token rotation chýba** v `config.ts` — TODO komentár tam je. Plný spec v `docs/auth/session.md`.
- **Mock IdP authorize/token endpointy chýbajú** — implementačný spec v `docs/auth/dev-mock-idp.md` (~150 riadkov kódu).
- **Backchannel logout endpoint** v apps chýba — spec v `docs/auth/session.md`.

### `@clubup/ui`
- Iba `Button` a `Card`. Treba pridať: `Input`, `Label`, `Select` (cez `@radix-ui/react-select`), `Checkbox`, `Badge`, `Alert`, `Progress` (pre level/module bary), `Tabs`, `Dialog`, `DropdownMenu`, `Toast`. Všetko podľa shadcn/ui patternu — kopírovať z [shadcn/ui Components](https://ui.shadcn.com/docs/components) a upraviť na ClubUp Tailwind preset.

### `apps/app` & `apps/admin`
- **Nie sú implementované**, len placeholder homepage. Skutočná štruktúra v `docs/architecture/frontend.md`.
- Chýba `middleware.ts` (auth + rate limit guards).
- Chýba `app/api/auth/[...nextauth]/route.ts` (re-export `handlers` z `auth.ts`).
- Chýba `app/api/health/route.ts` (UptimeRobot endpoint, spec v `docs/operations/monitoring.md`).
- Chýba `app/api/webhooks/24pay/route.ts` (spec v `docs/payments/integration.md`).
- Chýba `app/api/webhooks/mux/route.ts` (spec v `docs/api/webhooks.md`).
- Chýba `vercel.json` per app s cron joby (spec v `docs/operations/deployment.md`).

### Globálne
- **Žiadny `package-lock.json`** — vznikne pri prvom `npm install`. Komitnúť po nainštalovaní závislostí.
- **`eslint.config.js` v koreni nie je** — pre `npm run lint` z koreňa. Workspaces majú vlastné. Riešenie: vytvoriť `eslint.config.js` ktorý re-exportuje `@clubup/config/eslint.preset.js` (tak ako popisuje `packages/config/README.md`).
- **`vitest` config chýba** — vznikne pri prvých testoch.
- **Žiadne E2E testy** — `playwright.config.ts` na úrovni `apps/*` treba dorobiť.

## 4. Workflow pre prvý PR

1. Pozri si **otvorené issues** označené `good first issue` v GitHube
2. Vyber jeden, napíš komentár "preberám"
3. Vytvor branch: `feat/CLUB-XX-popis` alebo `fix/CLUB-XX-popis`
4. Implementuj, **dopĺň `CHANGELOG.md`** v sekcii `[Unreleased]`
5. Pred commitom: `npm run typecheck && npm run lint && npm run test`
6. **Conventional Commits** message: `feat(auth): add refresh token rotation`
7. Push, otvor PR na `main`, vyplň PR template
8. Min. **1 reviewer** musí approvnúť
9. **Squash merge** do `main`

Detaily v [`CONTRIBUTING.md`](../CONTRIBUTING.md) a [`docs/operations/code-style.md`](operations/code-style.md).

## 5. Komu sa pýtať

| Otázka | Kontakt |
|---|---|
| Architektúra, doménový model | `info@clubup.sk` (Ján Letko) |
| Bezpečnostná chyba | `security@clubup.sk` (NIE GitHub Issue) |
| GDPR / DPO | `dpo@clubup.sk` |
| Žilinská univerzita / kurikulum | `partneri@clubup.sk` |

## 6. Checklist pred prvým ostrým deployom

Toto je **definícia hotovosti** pre Fázu 1 (2026 Q2):

- [ ] Všetky kolekcie v `@clubup/db` implementované so schemami a repositories
- [ ] Migračný runner + idempotentné migrácie pre indexy
- [ ] Auth.js refresh token rotation funguje
- [ ] Mock IdP plne funguje (alebo `auth.sportup.sk` je live)
- [ ] OIDC client zaregistrovaný v SportUp adminoch
- [ ] 24-pay merchant účet aktivovaný (test → prod)
- [ ] Mux account, signing keys
- [ ] Resend account, DKIM/SPF/DMARC v DNS
- [ ] Sentry, UptimeRobot, Better Stack napojené
- [ ] MongoDB Atlas M10 cluster, backup povolený
- [ ] DNS migrácia z websupport.sk (viď `docs/operations/deployment.md`)
- [ ] Vercel projekty `clubup-website`, `clubup-app`, `clubup-admin` vytvorené a env vars nastavené
- [ ] GDPR — verejné Zásady ochrany osobných údajov publikované
- [ ] OP — Obchodné podmienky publikované
- [ ] Reklamačný poriadok publikovaný
- [ ] Faktúra template podľa zákona č. 222/2004 Z. z.
- [ ] Akreditácia kurikula od ŽU/FRI podpísaná
- [ ] Penetration test report bez critical findings
- [ ] E2E testy pre kritické flows (login, kúpa, dokončenie testu)
- [ ] Privacy ledger založený

Detaily per oblasť sú v `docs/operations/*.md`.
