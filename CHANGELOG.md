# Changelog

Všetky významné zmeny tohto projektu sú zdokumentované v tomto súbore.

Formát vychádza z [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) a projekt sa drží [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added — 2026-05-10 (sedenie 2)

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
- `docs/domain/part.md` — **nová entita** Časť (nahrádza Lesson; `contentBlocks[]` s text/image/video/audio/presentation/pdf/webinar/embed)
- `docs/domain/lesson.md` — premenované na presmerovacie note → `part.md`
- `docs/domain/test.md` — prepísané: `placement` (part/module/level/course), `selectionMode` (`fixed` / `random_sample`), `bankSelection.byTag` rules, `TestAttempt` so zachovaným poradím otázok aj odpovedí (forenzná reprodukovateľnosť)
- `docs/domain/progress.md` — prepísané: `partProgress[]` s `blockProgress[]`, `moduleCompletions[]`, `levelCompletions[]`, `courseCompleted`
- `docs/domain/certificate.md` — typy `final` (po kurze) a `intermediate` (po Leveli, voliteľný)
- `docs/domain/enrollment.md` — pridané `finalCertificateId` + `intermediateCertificateIds[]`
- `docs/domain/webinar.md` — samostatná entita, odkazovaná cez `WebinarBlock` v `Part.contentBlocks[]`
- `docs/domain/course.md` — referencuje `levels[]`, voliteľný `courseTestId`
- `docs/domain/module.md` — Modul = priesečník (Topic × Level), 1:1 s Topic
- `docs/domain/README.md` — nový ER diagram, lifecycle diagramy, mapovanie kurzu „Športový manažment" 4×10=40 modulov
- `docs/01-glossary.md` — pridané pojmy: Topic, Level, Part, ContentBlock, Course-test, Module-test, Level-test, Part-test, Placement, SelectionMode, Question Bank, Intermediate certifikát
- `docs/00-overview.md` — sekcia „ClubUp si autoritatívne vlastní" rozdelená na podsekcie (Vzdelávací obsah, Hodnotenie, Operatíva)
- `docs/architecture/frontend.md` — URL štruktúra `[courseSlug]/[levelSlug]/[topicSlug]/[partSlug]`, ContentBlock rendering, Test UI, design tokens import z `website/brand/tokens/`
- `docs/architecture/backend.md` — aktualizovaná schéma `Course` (`levels[]`), zoznam MongoDB kolekcií, doménová služba `markPartCompleted` s evaluáciou downstream

#### Brand kit v `website/brand/` — kompletný
- 6 variantov loga (primary, dark, mono navy/black/white, original) v SVG
- Design tokens v 3 formátoch: `clubup-tokens.css`, `clubup-tokens.json`, `tailwind.config.js`
- Brand Hub (`index.html`) — interaktívna landing pre celý kit
- Brand Manual (`manual.html`) — 10-stranový HTML manuál (print-ready A4 cez prehliadač)
- Logo Showcase (`logo.html`) — interaktívne všetky varianty s SVG exportom
- Icon Showcase (`icons.html`) — galéria 32 ikon s clipboard kópiou
- Developer Guide (`dev.html`) — sprievodca pre vývojárov s tokenmi a snippetmi
- `BRAND.md` — Markdown index pre vývojárov + odkazy pre marketing/PR

#### REST API špecifikácia — kompletná
- `docs/api/README.md` — princípy, common conventions, error format, pagination, idempotency, rate limiting
- `docs/api/courses.md` — verejný katalóg, detail kurzu, `/learn`, parts, tests, admin CRUD
- `docs/api/enrollments.md` — moje, batch, manuálne udelenie, refund, reset attempts
- `docs/api/orders.md` — vytvorenie, retry-payment, refund, faktúry, return URL
- `docs/api/webhooks.md` — 24-pay (HMAC-SHA256), Mux (`mux-signature`), Teams (Fáza 2)
- `docs/api/openapi.yaml` — OpenAPI 3.1 skeleton

### Added — 2026-05-10 (sedenie 1)

- Iniciálny návrh repozitára v štruktúre podľa SportUp.sk
- README, ROADMAP, CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, CITATION
- REUSE 3.3 compliance: REUSE.toml, LICENSE (EUPL-1.2), LICENSE-DOCS (CC-BY-4.0), `LICENSES/`
- GitHub workflows: REUSE compliance check, lint
- Issue a PR templates

### Changed — 2026-05-10
- Migrácia marketingového webu z websupport.sk na Vercel cez tento repozitár (plán)
- Doménový model prepísaný — pôvodný Course → Module → Lesson nahradený 4-vrstvovou hierarchiou Course → Level → Topic → Module → Part po ujasnení požiadaviek

## [0.1.0] — 2026-05-10
