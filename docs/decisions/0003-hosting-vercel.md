# ADR-0003: Hosting na Verceli

- **Status:** Accepted
- **Dátum:** 2026-05-10
- **Rozhodol:** Ján Letko (LTK Solutions)
- **Súvisiace ADR:** ADR-0001 (tech stack), ADR-0002 (monorepo)

## Kontext

Potrebujeme hosting pre:

- Marketingový web `clubup.sk` (statický)
- Aplikácie `app.clubup.sk` a `admin.clubup.sk` (Next.js 15, dynamické)
- DNS, SSL certifikáty
- CDN pre brand assety (`/brand/*`)
- Webhook endpoint pre 24-pay (musí byť verejne dostupný, HTTPS)
- Cron joby (pre cleanup expired orders, reminders pred webinármi)

Rozpočet je obmedzený — v 1. roku počítam s ~$160 / mesiac na celú infraštruktúru (viď [`../architecture/scaling.md`](../architecture/scaling.md)). Súčasná stránka `clubup.sk` beží na **websupport.sk** (klasický shared hosting). Treba ju migrovať.

## Zvažované možnosti

### Možnosť A — Vercel
- **Pros:** zero-config Next.js deployment, automatický preview pre každý PR, built-in Edge Network, automatický SSL, Vercel Cron, Inngest integration, KV/Postgres/Blob (ak by sme niekedy potrebovali), GitHub integrácia.
- **Cons:** Vendor lock-in, drahšie pri vysokom traffic, niektoré API kvóty (function timeouts, bandwidth) v Hobby tier sú prísne. Pro plán $20/mes.

### Možnosť B — Cloudflare Pages + Workers
- **Pros:** najlepší CDN na svete, najlacnejšie pri scale, generous free tier.
- **Cons:** Workers nepodporujú plnú Node.js runtime — niektoré npm balíky nefungujú (napr. `mongodb` driver vyžaduje Node API). Riešilo by sa Workers + Hyperdrive, ale to je iný stack než `sportup.sk`.

### Možnosť C — Self-host na Hetzner / Linode (Caddy + Node + PM2)
- **Pros:** plná kontrola, najlacnejší pri stabilnom load, žiadny vendor lock-in.
- **Cons:** **musím spravovať servery sám** — security patches, monitoring, backups, scaling pri špičkách. Pre 1-osobový tím je to brutálne nákladné na čas.

### Možnosť D — AWS (Amplify alebo Lambda + S3 + CloudFront)
- **Pros:** najpopulárnejší enterprise stack, Lambda škáluje neobmedzene.
- **Cons:** komplexnosť (IAM, VPC, Route 53), nepredvídateľné účty, **outsiderov to odrádza** — slovenských AWS expertov je málo.

### Možnosť E — websupport.sk (current state)
- **Pros:** lacný, slovenský, už tam beží.
- **Cons:** **nepodporuje Next.js** (len PHP/static), žiadny serverless runtime, žiaden CDN, žiadny preview environment. Pre dynamické apps je to neudržateľné.

## Rozhodnutie

**Vercel pre celý ekosystém ClubUp.**

- `clubup.sk` (apex + www) → Vercel root project (`outputDirectory: "website"`)
- `app.clubup.sk` → Vercel Next.js project (`src/apps/app`)
- `admin.clubup.sk` → Vercel Next.js project (`src/apps/admin`)
- DNS u websupport.sk (kde je doména registrovaná), zmena A/CNAME records na Vercel

## Dôvody

1. **Zero infrastructure overhead** — keď sa pushne commit, Vercel build-uje, deployuje, prepája doménu, robí SSL. Pre 1-osobový tím nenahraditeľné.
2. **Konzistencia s SportUp.sk** — ten istý hosting, ten istý mental model.
3. **Preview environments** — každý PR dostane vlastnú URL, kde si vie kolega/external reviewer overiť zmenu pred mergom. Toto je kľúčové pre tím, ktorý spolupracuje cez GitHub Issues.
4. **Inngest a Cron** — Vercel má built-in schedule support (`vercel.json` cron rules) + integráciu s Inngest pre event-driven jobs (vydanie certifikátu, reminders).
5. **Edge Network** — naši študenti sú prevažne na Slovensku. Vercel má edge POPs vo Frankfurte a vo Viedni → < 30 ms latency.
6. **Cena pri našom očakávanom raste** — $20/mes Pro plán pokryje 0–5 000 študentov bez bottleneck-u (pozri [`../architecture/scaling.md`](../architecture/scaling.md)).

## Dôsledky

### Pozitívne
- Jednoduchá migrácia `clubup.sk` z websupport.sk → push do `website/`, point DNS, hotovo
- Zero downtime deployment (atomic switch)
- Built-in analytics + Speed Insights
- Bezplatné preview env pre external review
- Webhook endpoint má HTTPS automaticky

### Negatívne / kompromisy
- **Vendor lock-in** na Vercel-špecifické features:
  - Vercel Cron syntax (vs. crontab)
  - Edge Functions runtime (vs. plain Node)
  - Image Optimization API (vs. Cloudinary)
  - Mitigácia: udržiavame zoznam Vercel-onlyspecifických featur v [`../operations/deployment.md`](../operations/deployment.md), aby exit nebol prekvapenie
- **Function execution limits** — 60 s timeout na Pro plane. Pre dlhotrvajúce operácie (hromadné generovanie certifikátov) musíme cez Inngest queue
- **Bandwidth pricing** — pri viral momente (TV repotráž) sa môže náklad krátkodobo zdvihnúť

### Neutrálne
- Doména zostáva u websupport.sk (registrátor) — DNS recordy sa zmenia, ale registračná zmluva ostáva

## Implementačné poznámky

- **žiadny root `vercel.json`** — každý Vercel projekt má vlastný Root Directory v UI a vlastný `vercel.json` vo svojom Root (alebo žiadny, ak stačí Next.js auto-detekcia). Root `vercel.json` by prebil všetky projektové Root Directory nastavenia a spôsobil, že by sa do všetkých projektov nasadzoval marketingový web (úvodné zlyhanie pri nasadení `clubup-doc` 2026-05-11 — pozri ADR-0009).
- `website/vercel.json`: `{ "outputDirectory": "." }` pre marketingový web. Root Directory v UI: `website`.
- Aplikácie majú vlastné Vercel projekty linknuté na ten istý repo s `rootDirectory` nastaveným na `src/apps/app`, `src/apps/admin` resp. `src/apps/doc`
- Environment variables (MONGODB_URI, OIDC secrets, 24-pay secrets) v Vercel dashboarde, **nie v kóde**
- DNS migrácia z websupport.sk:
  1. Pripraviť stránku na Verceli (preview deploy)
  2. Otestovať všetko na `clubup-sk.vercel.app`
  3. Zmeniť DNS A record na Vercel IP (`76.76.21.21`) + AAAA + CNAME pre `www`
  4. TTL 300s pre rýchly rollback
- Detailný runbook v [`../operations/deployment.md`](../operations/deployment.md)

## Revisit

- **Pri 10 000+ aktívnych študentoch** — vyhodnotiť, či by sa neoplatilo presunúť statický web na Cloudflare Pages (lacnejší CDN) a apps nechať na Vercel
- **Ak Vercel zmení pricing** významne — pripraviť self-host plán
- **Ak prídu európske compliance požiadavky** (data residency v EÚ) — overiť, že Vercel garantuje EÚ regióny pre serverless

## Odkazy

- [Vercel Pricing](https://vercel.com/pricing)
- [Vercel Cron](https://vercel.com/docs/cron-jobs)
- [Next.js on Vercel best practices](https://vercel.com/docs/frameworks/nextjs)
