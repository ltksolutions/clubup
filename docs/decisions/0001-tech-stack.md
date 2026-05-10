# ADR-0001: Tech stack — Next.js 15 + Node.js 20 + MongoDB Atlas

- **Status:** Accepted
- **Dátum:** 2026-05-10
- **Rozhodol:** Ján Letko (LTK Solutions)
- **Súvisiace ADR:** ADR-0002 (monorepo), ADR-0003 (hosting), ADR-0006 (video)

## Kontext

ClubUp potrebuje stack pre dve aplikácie (študentskú a admin) plus marketingový web. Nároky:

- **Slovensky-friendly UX** — server-side rendering pre SEO, podpora SK locale
- **API-first** — admin a študent zdieľajú backend
- **Platobný flow** s 24-pay (redirect + webhook handler — ideálne v tom istom procese ako UI)
- **Video lekcie** s adaptive streaming
- **Reálne škálovanie** — 0–500 študentov v 1. roku, 5 000+ neskôr (viď [`../architecture/scaling.md`](../architecture/scaling.md))
- **Zhoda s ekosystémom SportUp** — ten istý stack, aby sa dali zdieľať `packages/*` knižnice
- **Dostupní vývojári na Slovensku** — vyhnúť sa exotike

## Zvažované možnosti

### Možnosť A — Next.js 15 (App Router) + Node.js 20 + MongoDB Atlas
- **Pros:** mainstream stack, server components znižujú JS bundle, Server Actions zjednodušujú backend, hosting na Verceli zero-config, MongoDB má JSON dokumenty zhodné s naším doménovým modelom (versioned courses, embedded progress), bohatý ecosystém.
- **Cons:** Vendor lock-in na Vercel (hoci self-host je možný), Server Components majú learning curve, MongoDB transakcie sú menej zrelé než v PostgreSQL.

### Možnosť B — Remix + Node.js + PostgreSQL
- **Pros:** Web-standards-first prístup, jednoduchší mental model než App Router.
- **Cons:** Menšia komunita než Next.js, menej React Server Components zdrojov, PostgreSQL by si vyžiadal komplexnejší schema management pre versioning entít.

### Možnosť C — SvelteKit + Node.js + PostgreSQL
- **Pros:** Najmenší bundle, najrýchlejší dev mode.
- **Cons:** Menší trh slovenských vývojárov so Svelte skúsenosťami, žiaden zdieľaný kód so SportUp.

### Možnosť D — Astro + samostatný API server (Hono / Express)
- **Pros:** Astro perfektný pre marketing web (statický), oddelený API server pre flexibilitu.
- **Cons:** Dva deployment targets, dva mental modely, viac infraštruktúry, neopodstatnená komplexnosť pre náš objem.

## Rozhodnutie

**Next.js 15 (App Router) na Node.js 20 LTS + MongoDB Atlas + TypeScript 5.6+ strict.**

- Marketingový web: statický build (`website/`), deploy ako root projektu na Verceli
- Študentská aplikácia: Next.js 15 v `src/apps/app/`
- Admin aplikácia: Next.js 15 v `src/apps/admin/`
- Database: MongoDB Atlas, prístup cez natívny `mongodb` driver (NIE Mongoose)
- Validácia: Zod (zdieľaná medzi serverom a klientom)

## Dôvody

1. **Zhoda so SportUp.sk** — ten istý stack znamená zdieľané `packages/*`, zdieľanú znalosť, jednoduchšie cross-projektové onboarding.
2. **App Router je hlavný smer Next.js** — Pages Router je deprecated; ísť do nového projektu s Pages Router by bolo legacy od dňa 1.
3. **Server Components šetria bundle** — väčšina UI je server-rendered, len interaktívne komponenty (formuláre, prehrávač) sú client.
4. **MongoDB pre versioning** — naša entita `Course` má `version + previousVersionId` (viď [`../domain/course.md`](../domain/course.md)). V dokumentovej DB je to triviálne; v relačnej by to vyžadovalo composite keys alebo audit tabuľky.
5. **Žiadny ORM** — Mongoose by pridal vrstvu pomalých proxies, problematické transakcie cez session, nekompatibilitu s niektorými agregáciami. Natívny driver + Zod pokrýva všetko, čo potrebujeme.
6. **Vercel + MongoDB Atlas = zero infrastructure** — žiadne servery na spravovanie, žiadne CI/CD pipelines mimo GitHub Actions.

## Dôsledky

### Pozitívne
- Rýchly štart (zero-config deployment)
- Spoločné knižnice s `sportup.sk` (auth, ui)
- Veľký trh React/Next.js vývojárov v EÚ
- Migrácia existujúceho marketingového webu z websupport.sk je triviálna (statické HTML pôjde tak ako je)

### Negatívne / kompromisy
- **Vendor lock-in na Vercel** — exit by trval ~1–2 dni práce (Next.js sa dá self-hostovať, ale Inngest, Cron, Edge Functions sú Vercel-špecifické)
- **MongoDB transakcie** sú menej zrelé než v PostgreSQL — pre kritické sekvencie (payment → enrollment) pracujeme v session, ale máme na pamäti, že MongoDB nie je SQL
- **Server Components learning curve** pre developerov, ktorí ešte robili len Pages Router

### Neutrálne
- Stack je rovnaký ako v `sportup.sk`, takže každé rozhodnutie tam ovplyvní tu

## Implementačné poznámky

- Node 20 LTS pinned cez `.nvmrc`
- `package.json` engines: `"node": ">=20.0.0"`
- TypeScript strict + noUncheckedIndexedAccess: true
- MongoDB Atlas tier M10 pre štart (viď scaling docs)
- Detaily backendu v [`../architecture/backend.md`](../architecture/backend.md)
- Detaily frontendu v [`../architecture/frontend.md`](../architecture/frontend.md)

## Revisit

- **Pri 5 000+ aktívnych študentoch** — vyhodnotiť, či App Router serverless funkcie nemajú cold-start problém pre dashboard; možno presunúť na Edge runtime alebo dlhobežiace Node servers
- **Ak Vercel zdvihne ceny zásadne** — pripraviť self-host plán (Caddy + Node + Mongo na Hetzneri)
- **Pri integrácii s vládnym registrom** (eDesk, eGov), ak by bolo nutné PostgreSQL kvôli compliance — re-evaluovať

## Odkazy

- [Next.js 15 Release Notes](https://nextjs.org/blog/next-15)
- [MongoDB Atlas Pricing](https://www.mongodb.com/pricing)
- [App Router migration guide](https://nextjs.org/docs/app/building-your-application/upgrading/app-router-migration)
