# Changelog

Všetky významné zmeny tohto projektu sú zdokumentované v tomto súbore.

Formát vychádza z [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) a projekt sa drží [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added — 2026-05-10 (sedenie 4 — pre prezentáciu na ministerstve)

#### Developer onboarding

- `docs/onboarding-developer.md` — kompletný step-by-step návod pre nového seniora alebo skúseného mid-level developera. Reading order (10 dokumentov, ~3 h), lokálne dev prostredie (Mongo Docker, mock IdP, env vars), sanity check, známe medzery v scaffoldoch, workflow pre prvý PR, checklist pred ostrým deployom (Fáza 1, 2026 Q2).
- `eslint.config.js` v koreni — flat config re-exportuje `@clubup/config/eslint.preset.js`, aby `npm run lint` z koreňa fungoval.

#### Sociálne siete — stratégia a vizuál

- `docs/marketing/social-media.md` — kompletná stratégia (LinkedIn primárny, Facebook sekundárny, YouTube archív; Instagram / X / TikTok = NIE v MVP). Tone of voice, vizuálny štýl, ownership workflow (4 roly), frekvencia (~3 hod/týždeň ≈ 0.1 FTE), krízová komunikácia matrix, metriky bez tracking pixelov, účty checklist pred spustením.
- `website/og-image.svg` (1200×630) — defaultný OpenGraph obrázok pre social sharing. Navy gradient, biele logo, tagline, hero text, meta row „10 tém · 4 úrovne · 40 modulov · Akreditácia ŽU/FRI", URL clubup.sk.
- **OG / Twitter Card meta tagy** doplnené v **všetkých 6 HTML stránkach** (`index`, `o-projekte`, `osnova`, `partneri`, `kontakt`, `404`) — `og:image` + dimensions + alt text + `twitter:image`.
- **Footer social ikony** vo všetkých 6 HTML stránkach — LinkedIn / Facebook / YouTube ako placeholdry (vedú na `kontakt.html` s poznámkou „pripravujeme"), GitHub živý link. Štýly v `nav-extras.css` (`.footer-social`, `.footer-social-link`).

### Added — 2026-05-10 (sedenie 3 — finále)

#### `src/` monorepo scaffold

Štyri zdieľané packages + dve Next.js 15 apps placeholder-y. Cieľ: definovať packaging boundaries pred začatím implementácie, aby Fáza 1 začala so správnymi modulárnymi zámkami od prvého commitu.

- `src/README.md` — overview monorepa, dependency graph, tech stack
- `src/packages/config/` — zdieľaný TS / ESLint / Tailwind preset
  - 3 tsconfig variants (base, next, lib)
  - flat ESLint preset s typescript-eslint a import order
  - Tailwind preset s ClubUp brand farbami a typografiou
- `src/packages/db/` — MongoDB modely + Zod schemas + repositories
  - `client.ts` — singleton getDb() + withTransaction()
  - `errors.ts` — DomainError hierarchia (NotFound, Forbidden, ValidationError, …)
  - `courses/`, `enrollments/`, `audit/` — vzorové schémy + repository funkcie
  - Ostatné kolekcie (16 spolu) v TODO podľa `docs/domain/*.md`
- `src/packages/auth/` — Auth.js v5 wrapper + RBAC + dev mock IdP
  - `config.ts` — buildAuthConfig() generic OIDC client
  - `rbac.ts` — Role typ + mapRoles() z sportup_roles claim
  - `permissions.ts` — Permission matrix s can() helper
  - `guards.ts` — createGuards() factory pre requireSession/Permission/Role
  - `profile-mapping.ts` — RawIdTokenClaims → ClubUpProfile
  - `dev-idp/server.ts` — minimal mock OIDC server (discovery + JWKS), authorize/token TODO
- `src/packages/ui/` — shared React component library (shadcn/ui pattern)
  - `lib/cn.ts` — twMerge + clsx wrapper
  - `components/button.tsx` — Button s cva variantami
  - `components/card.tsx` — Card + composition (Header/Title/Description/Content/Footer)
  - `styles.css` — CSS premenné (mirror brand tokens)
- `src/apps/app/` — študentská app placeholder (Next.js 15, port 3000)
  - `app/layout.tsx`, `app/page.tsx`, `app/globals.css`
  - `auth.ts` — NextAuth() inštancia s buildAuthConfig
  - `next.config.js` — security headers, transpilePackages
  - `tailwind.config.ts` — preset z @clubup/config
  - `.env.example` — všetky env vars dokumentované
- `src/apps/admin/` — admin app placeholder (Next.js 15, port 3001)
  - Distinct cookie name (`__Secure-clubup.admin.session`)
  - `X-Robots-Tag: noindex, nofollow` v headers
  - Placeholder dashboard so 6 sekciami (Kurzy, Otázky, Webináre, Zápisy, Objednávky, Audit)

#### Web — odkazy na ekosystém + GitHub + dokumentáciu

Konzistentné prepojenie ClubUp web stránok s SportUp ekosystémom a open-source repom.

- `website/nav-extras.css` — `.nav-iconlink` štýl pre GitHub ikonu v navigácii, footer 5-column override
- Všetkých 6 HTML stránok (`index`, `o-projekte`, `osnova`, `partneri`, `kontakt`, `404`) aktualizovaných:
  - **Ekosystém dropdown rozšírený** na 6 položiek: SportUp.sk, Activity.SportUp.sk, ClubUp.sk, GitHub repozitár, Dokumentácia, Brand kit
  - **GitHub ikona v navigácii** vždy viditeľná (desktop ikonka 36×36, mobile riadok s textom)
  - **Footer 5 stĺpcov**: Projekt | Ekosystém | Open source (GitHub, Docs, Changelog, Roadmap) | Právne + brand block
  - Stránkové sekcie pridané: `index.html` má novú „05 — Ekosystém" sekciu, `o-projekte.html`, `partneri.html` a `kontakt.html` majú „Otvorenosť" / „Sledujte projekt" sekcie s odkazmi na GitHub a /docs
  - `osnova.html` referuje `docs/curriculum/sportovy-manazment.md`
  - `kontakt.html` referuje `docs/operations/gdpr.md` a `security.md`

### Added — 2026-05-10 (sedenie 2)

#### Docs — operácie, auth, payments, curriculum, versioning

- `docs/auth/` — kompletný OIDC client guide
  - `README.md` — flow overview, dev workflow, prod registrácia
  - `oidc-client.md` — Auth.js v5 setup, refresh token rotation, type safety, env vars
  - `token-claims.md` — štandardné OIDC claims + custom SportUp claims, mapovanie
  - `rbac.md` — 4 roly, kompletná permission matrix, guards, ownership checks, audit
  - `session.md` — JWE cookie, lifetime, refresh, sign-out, backchannel logout
  - `dev-mock-idp.md` — kompletný spec lokálneho mock OIDC servera
- `docs/payments/integration.md` — 24-pay HMAC-SHA256, webhook handler, refund flow, idempotency
- `docs/curriculum/sportovy-manazment.md` — kompletná osnova kurzu (4 Levels × 10 Topics = 40 modulov)
- `docs/operations/` — prevádzkové dokumenty
  - `deployment.md` — 3 Vercel projekty, DNS migrácia, env vars, MongoDB Atlas, cron joby
  - `monitoring.md` — Sentry, UptimeRobot, Better Stack, business KPIs, incident response
  - `gdpr.md` — Purpose Catalogue, DSAR workflow, anonymizácia, joint controllership so SportUp
  - `security.md` — secrets, TLS, CSP, RBAC, input validation, dependency security, prod checklist
  - `code-style.md` — TypeScript, naming, structure, React komponenty, lint, git, testing
- `docs/domain/versioning.md` — versioning publikovaných kurzov

#### ADR (Architecture Decision Records) — kompletné

- `docs/decisions/README.md` — index ADR + governance proces
- `docs/decisions/0000-template.md` — ADR template
- `docs/decisions/0001-tech-stack.md` — Next.js 15 + Node 20 + MongoDB Atlas
- `docs/decisions/0002-monorepo.md` — Turborepo + npm workspaces
- `docs/decisions/0003-hosting-vercel.md` — Vercel hosting
- `docs/decisions/0004-sso-via-sportup.md` — OIDC client + dev mock IdP
- `docs/decisions/0005-payments-24pay.md` — 24-pay.sk
- `docs/decisions/0006-video-mux.md` — Mux + plán migrácie na Cloudflare Stream
- `docs/decisions/0007-live-teams.md` — Microsoft Teams + MS Graph API
- `docs/decisions/0008-certification-zu.md` — Žilinská univerzita ako akreditovaný partner

#### Doménový model — prepísaný na 4-vrstvovú hierarchiu

- **Nový model:** Course → Level → Topic → Module → Part (predtým: Course → Module → Lesson)
- `docs/domain/level.md` — **nová entita** Úroveň (sekvenčná, voliteľný Level-test, intermediate certs)
- `docs/domain/topic.md` — **nová entita** Téma (organizačný kontajner, **bez testu**)
- `docs/domain/part.md` — **nová entita** Časť (`contentBlocks[]` s text/image/video/audio/presentation/pdf/webinar/embed)
- `docs/domain/test.md` — prepísané: `placement` (part/module/level/course), `selectionMode` (`fixed`/`random_sample`), `bankSelection.byTag` rules, `TestAttempt` so zachovaným poradím otázok aj odpovedí
- `docs/domain/progress.md` — prepísané: `partProgress[]` s `blockProgress[]`, `moduleCompletions[]`, `levelCompletions[]`, `courseCompleted`
- `docs/domain/certificate.md` — typy `final` a `intermediate`
- `docs/domain/enrollment.md` — pridané `finalCertificateId` + `intermediateCertificateIds[]`
- `docs/domain/webinar.md` — samostatná entita
- `docs/domain/course.md` — referencuje `levels[]`, voliteľný `courseTestId`
- `docs/domain/module.md` — Modul = priesečník (Topic × Level)
- `docs/domain/README.md` — nový ER diagram, lifecycle diagramy
- `docs/01-glossary.md` — pridané pojmy
- `docs/00-overview.md` — sekcia „ClubUp si autoritatívne vlastní" rozdelená
- `docs/architecture/frontend.md` — nová URL štruktúra, ContentBlock rendering
- `docs/architecture/backend.md` — aktualizovaná schéma, MongoDB kolekcie, doménová služba `markPartCompleted`

#### Brand kit v `website/brand/` — kompletný

- 6 variantov loga (primary, dark, mono navy/black/white, original) v SVG
- Design tokens v 3 formátoch: `clubup-tokens.css`, `clubup-tokens.json`, `tailwind.config.js`
- Brand Hub (`index.html`), Brand Manual (`manual.html`), Logo Showcase, Icon Showcase, Developer Guide
- `BRAND.md`

#### Marketing web v `website/`

- 6 HTML stránok (`index`, `o-projekte`, `osnova`, `partneri`, `kontakt`, `404`)
- `styles.css` (~1300 riadkov design system), `script.js` (nav + dropdowns)
- `robots.txt`, `sitemap.xml`, `site.webmanifest`
- `favicon/cu-icon.svg` + README

#### REST API špecifikácia — kompletná

- `docs/api/README.md` — princípy, common conventions, error format, pagination, idempotency
- `docs/api/courses.md` — verejný katalóg, /learn, parts, tests, admin CRUD
- `docs/api/enrollments.md` — moje, batch, manuálne udelenie, refund, reset attempts
- `docs/api/orders.md` — vytvorenie, retry-payment, refund, faktúry, return URL
- `docs/api/webhooks.md` — 24-pay (HMAC-SHA256), Mux, Teams (Fáza 2)
- `docs/api/openapi.yaml` — OpenAPI 3.1 skeleton

### Added — 2026-05-10 (sedenie 1)

- Iniciálny návrh repozitára v štruktúre podľa SportUp.sk
- README, ROADMAP, CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, CITATION
- REUSE 3.3 compliance: REUSE.toml, LICENSE (EUPL-1.2), LICENSE-DOCS (CC-BY-4.0), `LICENSES/`
- GitHub workflows: REUSE compliance check, lint
- Issue a PR templates
- Root files: package.json (npm workspaces), turbo.json, vercel.json, .nvmrc, .prettierrc, .editorconfig, .gitignore

### Changed — 2026-05-10
- Migrácia marketingového webu z websupport.sk na Vercel cez tento repozitár (plán)
- Doménový model prepísaný — pôvodný Course → Module → Lesson nahradený 4-vrstvovou hierarchiou Course → Level → Topic → Module → Part po ujasnení požiadaviek

## [0.1.0] — 2026-05-10
