<!--
SPDX-FileCopyrightText: 2026 Ján Letko / LTK Solutions
SPDX-License-Identifier: CC-BY-4.0
-->

---
title: ClubUp Dokumentácia
sidebarTitle: Úvod
---

# ClubUp — Dokumentácia

Vitajte v technickej a obsahovej dokumentácii projektu **ClubUp.sk** — vzdelávacej platformy pre slovenské športové kluby.

ClubUp je modulárne online vzdelávanie pre výkonných riaditeľov, generálnych sekretárov a manažérov športových klubov, s certifikáciou akreditovanou inštitúciou (Žilinská univerzita v Žiline, Fakulta riadenia a informatiky).

## Kde začať

- **[Prehľad systému](/00-overview)** — prečo projekt existuje, cieľová skupina, vzťah k SportUp ekosystému
- **[Slovník pojmov](/01-glossary)** — entity (Course, Topic, Level, Module, Part), roly, kľúčové pojmy
- **[Onboarding pre developera](/onboarding-developer)** — ako rozbehnúť projekt lokálne

## Sekcie

- **[Architektúra](/architecture)** — high-level dizajn, backend, frontend, security, scaling
- **[Doménový model](/domain)** — entity, ich vzťahy a invariants
- **[REST API](/api)** — endpointy pre kurzy, enrollment, objednávky, webhooky
- **[Autentifikácia](/auth)** — SSO via SportUp, RBAC, session manažment
- **[Platby](/payments)** — integrácia s 24-pay
- **[Curriculum](/curriculum)** — obsah kurzov (Športový manažment a ďalšie)
- **[Operácie](/operations)** — deployment, monitoring, GDPR, code style
- **[Rozhodnutia (ADR)](/decisions)** — architektonické rozhodnutia s odôvodneniami
- **[Marketing](/marketing)** — komunikačná stratégia, social media

## Stav projektu

ClubUp v0.1 je **koncepčný návrh**. Implementácia ešte nezačala — táto dokumentácia popisuje cieľový stav, ktorý budujeme.

---

*Silné kluby. Silný šport.*
