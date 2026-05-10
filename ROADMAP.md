# Roadmap

Plán implementácie ClubUp.sk. Položky sú rozdelené do **fáz**, nie do termínov — termíny vznikajú až po ukončení predchádzajúcej fázy.

## Fáza 0 — Koncepčný návrh ✅ (aktuálny stav)

- [x] Repo metadata, licencia, REUSE compliance
- [x] Architektonický návrh, doménový model
- [x] Návrh integrácií (SSO so SportUp, 24-pay)
- [x] Osnovy prvého kurzu (Športový manažment)
- [x] Monorepo scaffold

## Fáza 1 — Marketingový web (najbližšia)

- [ ] Migrácia obsahu z websupport.sk → Vercel
- [ ] Nastavenie domény clubup.sk na Vercel
- [ ] Nastavenie www → apex redirect
- [ ] Brand assety (logo SVG, OG image, favicon set)
- [ ] Implementácia stránok podľa návrhu v `website/`:
  - [ ] index (hero, levels, themes, kontakt)
  - [ ] o-projekte
  - [ ] osnova (rozšírená osnova s detailami)
  - [ ] partneri (Žilinská univerzita)
  - [ ] kontakt
  - [ ] 404
- [ ] SEO: sitemap.xml, robots.txt, JSON-LD
- [ ] Analytics + Cookie banner v súlade s GDPR
- [ ] Form na záujem o kurz (Resend + DB záznam alebo MailerLite)

## Fáza 2 — SSO so SportUp.sk

Závisí od dostupnosti `auth.sportup.sk`. Detaily v [`docs/auth/`](docs/auth/).

- [ ] Definovanie OIDC client claims, scopes a redirect URI
- [ ] Integrácia v `packages/auth` (Auth.js v5 OIDC provider)
- [ ] Session management (JWT s rotujúcim refresh tokenom)
- [ ] Mapovanie SportUp rolí (student, instructor, club_admin) → ClubUp role
- [ ] E2E test login flow
- [ ] Logout (single sign-out)

## Fáza 3 — Študentská aplikácia (`app.clubup.sk`)

- [ ] Setup Next.js 15 + App Router + Tailwind + shadcn/ui
- [ ] Layout, navigácia, design tokens z `packages/ui`
- [ ] Stránky:
  - [ ] Dashboard (zápisané kurzy, progress)
  - [ ] Katalóg kurzov
  - [ ] Detail kurzu (popis, lektor, modul, cena)
  - [ ] Detail modulu (zoznam lekcií)
  - [ ] Detail lekcie (video / text / prezentácia / webinar / test)
  - [ ] Profil študenta (osobné údaje zo SSO + ClubUp preferencie)
  - [ ] Certifikáty (zoznam získaných certifikátov, link na overenie)
- [ ] MongoDB Atlas modely v `packages/db`
- [ ] Mux integrácia pre video lekcie
- [ ] Test engine (multi-choice, single-choice, true/false)
- [ ] 24-pay.sk objednávkový flow + webhook handler
- [ ] Email notifikácie (Resend) — potvrdenie objednávky, prístup k kurzu, certifikát

## Fáza 4 — Admin aplikácia (`admin.clubup.sk`)

- [ ] Setup ďalšej Next.js aplikácie
- [ ] RBAC: admin, content_manager, instructor
- [ ] CRUD pre Course / Module / Lesson
- [ ] Správa testov (otázky, varianty, váhy)
- [ ] Správa študentov (zoznam, progress, problémové prípady)
- [ ] Plánovanie webinárov + integrácia MS Teams (kalendárová pozvánka cez .ics alebo Microsoft Graph)
- [ ] Zoznam objednávok a platieb (read-only, 24-pay je zdroj pravdy)
- [ ] Vyhodnocovanie kurzu (štatistiky, NPS, completion rate)
- [ ] Generovanie certifikátov (PDF s podpisom Žilinskej univerzity, registračné číslo)

## Fáza 5 — Druhý a ďalšie kurzy

- [ ] Multi-tenant CMS pre kurzy
- [ ] Šablóny pre tvorbu nových kurzov
- [ ] Zdieľané moduly (entry-level témy spoločné pre rôzne kurzy)
- [ ] Lektorské kontá (vlastné kurzy)

## Fáza 6 — Pokročilé funkcie

- [ ] Komunitný diskusný priestor (per kurz / per modul)
- [ ] 1-on-1 mentoring (booking systém)
- [ ] Mobilná verzia (PWA, neskôr potenciálne native)
- [ ] Integrácia s ClubUp.sk klubovým profilom (per organizácia, batch enrollment)
- [ ] Vouchere/poukážky (pre kluby a zväzy, ktoré chcú sponzorovať vzdelávanie)
- [ ] Affiliate / referral program

## Fáza 7 — Otvorenosť ekosystému

- [ ] Public API pre externé LMS (read-only katalóg kurzov)
- [ ] Webhooks pre tretie strany (enrollment, completion)
- [ ] MCP server pre kurzový obsah (čítanie, vyhľadávanie)
- [ ] Open Badges 3.0 export pre získané certifikáty

## Princípy plánovania

- **Žiadna funkcionalita bez ADR**, ak má vplyv na architektúru.
- **GDPR review** pre každú novú entitu, ktorá obsahuje osobné údaje.
- **Incremental release**: každá fáza má použiteľný produkt na konci.
- **Nezablokovať sa na SportUp**: Fáza 1 môže ísť dopredu aj bez auth.sportup.sk; Fáza 3 v dev móde môže používať lokálny mock IdP.
