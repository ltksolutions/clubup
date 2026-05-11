# Deployment

> Ako deploy-ovať a spravovať ClubUp na Verceli + MongoDB Atlas.

Decision context: [`../decisions/0003-hosting-vercel.md`](../decisions/0003-hosting-vercel.md).

## Štyri Vercel projekty

ClubUp je **monorepo** so štyrmi Vercel projektami napojenými na rovnaký GitHub repo:

| Projekt | Doména | Root directory | Output dir |
|---|---|---|---|
| `clubup-website` | `clubup.sk` (apex + www) | `website` | `.` (rieši `website/vercel.json`) |
| `clubup-doc` | `docs.clubup.sk` | `src/apps/doc` | (Next.js default) |
| `clubup-app` | `app.clubup.sk` | `src/apps/app` | (Next.js default) |
| `clubup-admin` | `admin.clubup.sk` | `src/apps/admin` | (Next.js default) |

> **Pozn.:** V koreňovom adresári repa **NIE JE** žiadny `vercel.json`. Každý Vercel projekt má buď vlastný `vercel.json` vo svojom Root Directory (prípad `website/`), alebo sa spolieha na default Next.js detekciu (prípad `src/apps/*`). Root `vercel.json` by prebil všetky projektové Root Directory nastavenia v UI a spôsobil nesprávny deployment.

## DNS migrácia z websupport.sk

**Kontext:** doména `clubup.sk` je registrovaná u websupport.sk a nateraz tam aj hosťuje statický web. Migrácia na Vercel:

### Krok 1 — Pripravenie

1. Vytvor Vercel projekt `clubup-website`, link na repo, **Root Directory: `website`**
2. `website/vercel.json` už obsahuje statickú konfiguráciu (`outputDirectory: "."`)
3. Otestuj na preview URL `clubup-website.vercel.app`
4. Skontroluj všetky linky, brand assety, kontaktný formulár

### Krok 2 — DNS zmena

Vo websupport.sk admin paneli zmeň DNS records pre `clubup.sk`:

| Type | Name | Value | TTL |
|---|---|---|---|
| A | `@` | `76.76.21.21` | 300 |
| AAAA | `@` | `2606:4700:90:0:f22e:fbec:5bed:a9b9` | 300 |
| CNAME | `www` | `cname.vercel-dns.com` | 300 |

> **Pozn.:** TTL 300s pre rýchly rollback ak by niečo zlyhalo. Po stabilnom behu (1–2 týždne) zvýšiť na 3600s.

### Krok 3 — Verifikácia v Verceli

V Vercel projektovom dashboarde **Domains**:

1. Pridaj `clubup.sk`
2. Pridaj `www.clubup.sk` → redirect na `clubup.sk` (apex je primárny)
3. Vercel automaticky vystaví SSL cert (Let's Encrypt)
4. Po DNS propagácii (5–30 min) doména dostane status `Valid`

### Krok 4 — Cleanup

- Vo websupport.sk zruš pôvodný hosting (po 30 dňoch overenia, že všetko funguje)
- DNS zostáva u websupport.sk (registrátor) — len A/CNAME records ukazujú na Vercel
- Email-y na `info@clubup.sk` sa nemenia (MX records ostávajú)

## Apps subdomény

`docs.clubup.sk`, `app.clubup.sk` a `admin.clubup.sk` sa nasadia po DNS migrácii apex domény (resp. nezávisle, pre `docs` už teraz):

| Type | Name | Value | TTL |
|---|---|---|---|
| CNAME | `docs` | `cname.vercel-dns.com` | 300 |
| CNAME | `app` | `cname.vercel-dns.com` | 300 |
| CNAME | `admin` | `cname.vercel-dns.com` | 300 |

V Verceli každý projekt linknúť na svoju doménu.

## Environment variables

### `clubup-website` (statický web — bez env)

Žiadne env vars (statický HTML/CSS/JS).

### `clubup-doc` (Nextra dokumentačná stránka — bez env)

Žiadne env vars. Môže mať `NEXT_PUBLIC_DOC_URL=https://docs.clubup.sk` len ak by sa používalo z runtime; aktuálne v0.1 to netreba.

### `clubup-app`

| Premenná | Production | Preview | Development |
|---|---|---|---|
| `MONGODB_URI` | `mongodb+srv://prod...` | `mongodb+srv://staging...` | `mongodb://localhost:27017/clubup` |
| `MONGODB_DB_NAME` | `clubup_prod` | `clubup_staging` | `clubup_dev` |
| `SPORTUP_OIDC_ISSUER` | `https://auth.sportup.sk` | `https://auth-staging.sportup.sk` | `http://localhost:9000` (mock) |
| `SPORTUP_OIDC_CLIENT_ID` | `clubup-app-prod` | `clubup-app-staging` | `dev-client` |
| `SPORTUP_OIDC_CLIENT_SECRET` | (Vercel secret) | (Vercel secret) | `dev-secret` |
| `AUTH_SECRET` | (32B random base64) | (rôzny) | (rôzny) |
| `AUTH_URL` | `https://app.clubup.sk` | (auto Vercel URL) | `http://localhost:3000` |
| `PAYMENT_24PAY_MERCHANT_ID` | (z 24-pay) | (test merchant) | (test merchant) |
| `PAYMENT_24PAY_SECRET` | (Vercel secret) | (Vercel secret) | (test) |
| `PAYMENT_24PAY_API_URL` | `https://api.24-pay.sk/v1` | `https://test.24-pay.sk/api` | `https://test.24-pay.sk/api` |
| `MUX_TOKEN_ID` | (z Mux) | (z Mux) | (z Mux) |
| `MUX_TOKEN_SECRET` | (Vercel secret) | (Vercel secret) | (Vercel secret) |
| `MUX_SIGNING_KEY_ID` | (z Mux) | — | — |
| `MUX_SIGNING_KEY_SECRET` | (Vercel secret) | — | — |
| `RESEND_API_KEY` | (z Resend) | (z Resend test) | — |
| `SENTRY_DSN` | (z Sentry) | (rovnaký, prostredie=preview) | — |
| `UPSTASH_REDIS_REST_URL` | (z Upstash) | (z Upstash) | (lokálny mock) |
| `UPSTASH_REDIS_REST_TOKEN` | (Vercel secret) | (Vercel secret) | — |
| `MS_GRAPH_TENANT_ID` | (z Azure) | — | — |
| `MS_GRAPH_CLIENT_ID` | (z Azure) | — | — |
| `MS_GRAPH_CLIENT_SECRET` | (Vercel secret) | — | — |
| `MS_GRAPH_USER_ID` | (aplikačný účet) | — | — |
| `NEXT_PUBLIC_APP_URL` | `https://app.clubup.sk` | (auto) | `http://localhost:3000` |

### `clubup-admin`

Rovnaké ako `clubup-app`, ale:

- `AUTH_URL=https://admin.clubup.sk`
- `SPORTUP_OIDC_CLIENT_ID=clubup-admin-prod` (ak chceme oddelený OIDC client; jednoduchšie je zdieľať s app)
- `NEXT_PUBLIC_APP_URL=https://admin.clubup.sk`

## Vercel secrets

Citlivé hodnoty uložené v Vercel Dashboarde **Settings → Environment Variables → Encrypted**. NIKDY v `.env` v repe.

Pre lokálny dev používame `.env.local` (gitignored) s test/dev hodnotami.

## Build process

V root repa `package.json`:

```json
{
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "test": "turbo run test"
  }
}
```

Vercel build commands per projekt sú riešené cez Vercel UI v každom projekte zvlášť (Settings → Build & Development Settings). Pre `clubup-app` a `clubup-admin` napríklad:

```
Build Command:   npm run build --workspace=@clubup/app
Install Command: npm install
Ignored Build Step (Settings → Git):
  git diff HEAD^ HEAD --quiet -- src/apps/app src/packages || exit 1
```

Pre `clubup-doc` stačí default Next.js detekcia (npm run build sa pustí v `src/apps/doc`).
Pre `clubup-website` rieši build `website/vercel.json` (statický web bez build krokov).

## Database — MongoDB Atlas

### Cluster setup

- **Tier:** M10 (Production-ready, $0.08/hr ≈ $58/mes)
- **Region:** EU (Frankfurt) — najbližšie k Verce edge
- **Replica set:** 3 nodes (primary + 2 secondary)
- **Backup:** automatic, retention 7 dní (Continuous Cloud Backup)

### Network access

- Whitelist Vercel egress IPs (Vercel publikuje zoznam)
- Alebo **0.0.0.0/0** + povinné credentials (acceptable trade-off pre M10; M30+ má VPC peering)

### Database users

| User | Práva | Použitie |
|---|---|---|
| `clubup_app_prod` | readWrite na `clubup_prod` | Production aplikácie |
| `clubup_app_staging` | readWrite na `clubup_staging` | Staging |
| `clubup_admin` | dbAdmin na `clubup_prod` | Manuálne admin operácie |
| `clubup_backup` | backup na všetky | Backup automatizácia |

### Indexy

Vytvorenie indexov je v migráciách v `packages/db/migrations/`. Spúšťa sa raz manuálne pri prvom deployi a pri každej novej migrácii cez:

```bash
npm run db:migrate -- --env=prod
```

Detailné indexy per kolekciu sú v jednotlivých `docs/domain/*.md` súboroch.

## Cron joby

Vercel Cron (definované v `src/apps/app/vercel.json` resp. `src/apps/admin/vercel.json`, nie v root-e):

```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-expired-orders",
      "schedule": "0 3 * * *"
    },
    {
      "path": "/api/cron/webinar-reminders",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/cron/inactive-student-reminder",
      "schedule": "0 9 * * *"
    }
  ]
}
```

Cron endpoints majú secret kontrolu (Vercel posiela hlavičku `x-vercel-cron`):

```ts
export async function GET(req: Request) {
  if (req.headers.get('x-vercel-cron') !== '1') {
    return new Response('forbidden', { status: 403 });
  }
  // ...
}
```

## Deploy workflow

### Production deploy

1. PR → review → merge do `main`
2. Vercel auto-buildy 4 projektov (paralelne, každý respektuje svoj Root Directory a Ignored Build Step)
3. Po úspechu — auto-promote na production domény

### Preview deploy (PR)

1. PR pushnutý → Vercel vytvorí preview deployment
2. URL: `clubup-app-pr-42-clubup.vercel.app`
3. Komentár v PR s linkmi na všetky 4 preview URLs
4. Externí review-eri môžu klikať priamo z PR

### Rollback

V Vercel dashboarde **Deployments**:

1. Nájdi predošlý working deploy
2. Klik **Promote to Production**
3. Hotovo — atomic switch (žiadny downtime)

DNS zmeny rollback: pôvodné websupport.sk records ostali (zalogované) — v krízovom scenári vrátime A/CNAME, propagácia 300s.

## CI/CD

GitHub Actions v `.github/workflows/`:

- `lint.yml` — ESLint, TypeScript check, Prettier check
- `test.yml` — Vitest unit + integration testy
- `e2e.yml` — Playwright (len na PR do main)
- `reuse.yml` — REUSE 3.3 compliance check

Vercel build sa spúšťa nezávisle (Git integration), nie cez GitHub Actions.

## Monitoring po deployi

Po každom prod deployi check:

- [ ] Vercel deployment status = Ready
- [ ] Sentry release vytvorený (auto cez Vercel integration)
- [ ] Health check endpoint `/api/health` vráti 200
- [ ] Smoke test: login flow funguje, katalóg sa načíta

Detaily v [`monitoring.md`](monitoring.md).
