# Architecture Decision Records (ADR)

Záznamy o architektonických rozhodnutiach projektu ClubUp. Každý ADR popisuje:

- **Kontext** — čo nás priviedlo k rozhodnutiu
- **Zvažované možnosti** — čo sme vážne posúdili
- **Rozhodnutie** — čo sme zvolili
- **Dôvody** — prečo
- **Dôsledky** — čo to spôsobí (pozitívne aj negatívne)
- **Revisit** — kedy by sme to mali znovu posúdiť

Šablóna: [`0000-template.md`](0000-template.md).

## Aktívne ADR

| # | Téma | Status | Dátum |
|---|---|---|---|
| [0001](0001-tech-stack.md) | Tech stack: Next.js 15 + Node.js 20 + MongoDB Atlas | Accepted | 2026-05-10 |
| [0002](0002-monorepo.md) | Monorepo s Turborepo + npm workspaces | Accepted | 2026-05-10 |
| [0003](0003-hosting-vercel.md) | Hosting na Verceli | Accepted | 2026-05-10 |
| [0004](0004-sso-via-sportup.md) | SSO cez `auth.sportup.sk` (OIDC client) | Accepted (závisí) | 2026-05-10 |
| [0005](0005-payments-24pay.md) | Platobná brána 24-pay.sk | Accepted | 2026-05-10 |
| [0006](0006-video-mux.md) | Video hosting na Mux | Accepted | 2026-05-10 |
| [0007](0007-live-teams.md) | Live výučba cez Microsoft Teams | Accepted | 2026-05-10 |
| [0008](0008-certification-zu.md) | Certifikácia cez Žilinskú univerzitu (FRI) | Accepted | 2026-05-10 |

## Status hodnoty

- **Proposed** — návrh, ešte sa neimplementuje
- **Accepted** — rozhodnuté, kód a docs sa podľa toho stavajú
- **Accepted (závisí)** — rozhodnuté, ale závisí od externej dependencies (napr. ADR-0004 závisí od dostupnosti `auth.sportup.sk`)
- **Deprecated** — už neplatí, ale ešte je v aktívnom kóde
- **Superseded by ADR-XXXX** — nahradené iným ADR

## Kedy vznikne nové ADR

Nové ADR sa vytvára pri rozhodnutí, ktoré:

- Ovplyvňuje **architektúru** (stack, hosting, infra)
- Mení **doménový model** zásadným spôsobom (nová entita, zmena vzťahu medzi entitami)
- Pridáva **externú dependency** (nový SaaS, nová knižnica, nový partner)
- Mení **business model** (revenue sharing, certifikácia, distribúcia)
- Mení **bezpečnostný model** (auth, encryption, data retention)

Bug fix, drobná zmena UX alebo refaktor v rámci jednej vrstvy ADR nepotrebujú.

## Proces

1. **Otvor PR** s návrhom ADR (status: `Proposed`)
2. **Diskusia** v PR review — navrhované možnosti, dôsledky
3. **Rozhodnutie** — pri merge sa status zmení na `Accepted`
4. **Zmeny** — pôvodné ADR sa neupravuje retroaktívne. Ak sa rozhodnutie zmení, vytvorí sa **nové ADR** so statusom `Accepted` a pôvodné dostane `Superseded by ADR-XXXX`

## Konvencie

- Číslovanie: `NNNN-kratky-popisok-kebab-case.md`, 4 číslice s vodiacimi nulami
- Slovenský jazyk (rovnako ako zvyšok dokumentácie)
- ADR nikdy nepopisuje implementačný detail; to patrí do `architecture/`, `domain/`, `api/`, atď.
- ADR má byť čitateľné aj o 3 roky — nepoužívajme aktuálny slang ani referencie na meme
