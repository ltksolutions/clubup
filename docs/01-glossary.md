# Glossary — slovník pojmov

Pojmy, ktoré používame v dokumentácii a v kóde. Slovenský termín je primárny, anglický ekvivalent je v zátvorke pre kódový kontext.

## A

**ADR (Architecture Decision Record)** — záznam o architektonickom rozhodnutí. Šablóna v [`decisions/0000-template.md`](decisions/0000-template.md), príklad v `0001-tech-stack.md`. Každé väčšie rozhodnutie má svoj ADR.

**Admin / Admin aplikácia** — aplikácia pre správu kurzov, lekcií, lektorov, študentov, objednávok a vyhodnocovania. Beží na `admin.clubup.sk`. Prístup len pre roly `admin`, `content_manager` a `instructor`.

**Akreditovaný poskytovateľ certifikácie** — inštitúcia, ktorá má štátnu akreditáciu na vydávanie kvalifikačných osvedčení v danom odbore. Pre kurz „Športový manažment" je to **Žilinská univerzita, Fakulta riadenia a informatiky (FRI ŽU)**.

**App / Študentská aplikácia** — aplikácia, v ktorej študenti absolvujú kurzy, sledujú progress, robia testy a získavajú certifikáty. Beží na `app.clubup.sk`.

**Auth.js** — knižnica pre autentifikáciu v Next.js (predtým NextAuth.js). Používame v3.x s OIDC providerom napojeným na `auth.sportup.sk`.

## C

**Certificate** — záznam o vydaní certifikátu študentovi. Dva typy:
- **`final`** — hlavný certifikát po dokončení celého kurzu
- **`intermediate`** — medzicertifikát po dokončení Levelu (voliteľný, podľa `Level.issuesIntermediateCertificate`)

ClubUp zaznamenáva metadata; PDF generuje akreditovaný poskytovateľ (ŽU).

**ClubUp Navy / ClubUp Blue** — primárne brand farby. Navy `#1A2D47`, Blue `#388FC3`. Detaily v [`../website/brand/BRAND.md`](../website/brand/BRAND.md).

**Conventional Commits** — formát commit messages: `type(scope): subject`. Detaily v `CONTRIBUTING.md`.

**ContentBlock** — jednotka obsahu v `Part.contentBlocks[]`. Typy: `text`, `image`, `video`, `audio`, `presentation`, `pdf`, `webinar`, `embed`. Časť obsahuje pole blokov, ktoré študent prechádza zhora-dolu.

**Course** — kurz. Najvyššia jednotka vzdelávania. Príklad: „Športový manažment pre silnejšie kluby". Skladá sa z `Level`-ov, jeden kurz má jednu cenu a vedie k jednému `final` certifikátu.

**Course-test** — voliteľný záverečný test celého kurzu. Ak je definovaný, určuje vydanie `final` certifikátu. Ak nie je, certifikát sa vydá po dokončení posledného Levelu (vrátane jeho Level-testu).

## D

**Design Manual** — pravidlá používania vizuálnej identity ClubUp. Markdown index v [`../website/brand/BRAND.md`](../website/brand/BRAND.md), kompletný 10-stranový HTML manuál v [`../website/brand/manual.html`](../website/brand/manual.html). Po nasadení tiež verejne na `https://clubup.sk/brand/`.

## E

**Enrollment** — zápis. Záznam, že konkrétna osoba (`sportup_person_id`) je zapísaná do konkrétneho kurzu (`course_id`). Vzniká po úspešnej platbe alebo manuálnom udelení prístupu adminom.

**EUPL-1.2** — European Union Public Licence 1.2. Open-source licencia EÚ Komisie, právne ekvivalentná v 23 jazykoch EÚ. Použitá pre **kód** v `src/`.

## F

**FRI ŽU** — Fakulta riadenia a informatiky Žilinskej univerzity. Akreditovaný partner pre certifikáciu kurzu „Športový manažment". Detaily v [`decisions/0008-certification-zu.md`](decisions/0008-certification-zu.md).

## H

**HMAC-SHA256** — hash-based message authentication code. Používame na podpis 24-pay požiadaviek a verifikáciu webhookov.

## I

**Instructor / Lektor** — osoba, ktorá pripravuje obsah kurzu (videá, texty, prezentácie, otázky). V neskorších fázach môže mať aj vlastný profil verejne na webe a viesť webináre.

**Intermediate certifikát** — voliteľný „medzicertifikát" vydávaný po dokončení Levelu, ak `Level.issuesIntermediateCertificate: true`. Typicky pri vyšších úrovniach (Level 3, Level 4). Vydáva ho Žilinská univerzita.

## L

**Lesson** — **deprecated**. Pôvodný názov pre `Part`. Viď `lesson.md` (presmerovanie) alebo priamo [`Part`](#p).

**Level / Úroveň** — úroveň v kurze. Levely sú **vždy sekvenčné** — študent musí dokončiť Level N kým získa prístup do Level N+1. V kurze „Športový manažment" sú 4 úrovne: Základy, Pokročilý, Špecialista, Stratég. Každý Level obsahuje 10 Tém a má voliteľný `Level-test`.

**Level-test** — voliteľný test po dokončení všetkých modulov v Leveli. Po prejdení odomyká ďalší Level. Ak `Level.issuesIntermediateCertificate: true`, po prejdení sa vydá intermediate certifikát.

## M

**MCP (Model Context Protocol)** — štandard pre prepojenie AI asistentov na nástroje. ClubUp v budúcnosti môže poskytnúť MCP server pre čítanie obsahu kurzov.

**Module / Modul** — priesečník (Téma × Úroveň). V kurze „Športový manažment" je 4 × 10 = 40 modulov. Modul obsahuje 1+ častí a voliteľný `Module-test`. Modul je hlavná **vzdelávacia a hodnotiaca jednotka**.

**Module-test** — voliteľný záverečný test modulu. Ak `Module.moduleTestRequired: true`, bez prejdenia testu nie je modul dokončený.

**Mux** — video hosting a streaming služba. Používame na hostovanie kurzových videí. Signed URLs, HLS, adaptive bitrate.

## N

**Next.js 15** — React framework, ktorý používame. App Router, Server Components, Server Actions.

## O

**OIDC (OpenID Connect)** — autentifikačná vrstva nad OAuth 2.0. ClubUp je OIDC client; `auth.sportup.sk` je OIDC provider/issuer.

**Order** — objednávka. Vzniká, keď používateľ klikne na „Kúpiť kurz". Obsahuje `course_id`, `student_id`, `amount`, `currency`, `state` (pending → paid → failed → refunded).

## P

**Part / Časť** — najmenšia samostatná jednotka obsahu v module. Časť obsahuje `contentBlocks[]` (text, video, prezentácia, …) a voliteľný `Part-test`. Časti môžu mať `prerequisites[]` — povinné iné Časti, ktoré musia byť dokončené predtým.

**Part-test** — voliteľný overovací test časti. Ak `Part.partTestRequired: true`, bez prejdenia nie je časť dokončená.

**Payment** — platba. Záznam o platobnej transakcii cez 24-pay. ClubUp eviduje len metadata; samotné dáta o karte/banke sú výlučne v 24-pay (PCI DSS).

**Placement (testu)** — pole na `Test` entite, ktoré určuje, kde test patrí: `part`, `module`, `level`, `course`. Test je samostatná entita; placement určuje, čo sa stane po jeho prejdení.

**Progress** — postup študenta v kurze. Aké časti otvoril, kedy ich dokončil, výsledky testov, dokončené moduly a úrovne, intermediate a final certifikáty.

**PUŠ** — Príspevok uznaného športu. Slovenský dotačný mechanizmus pre šport. Pre kurzový obsah relevantné kvôli téme financovania.

## Q

**Question** — otázka v teste. Typy: `single_choice`, `multiple_choice`, `true_false`, `short_text`. Otázka má `weight` (váhu) pre vážený scoring a `tags[]` pre random sampling.

**Question Bank** — kolekcia otázok zdieľaná medzi testami. **V MVP nie je implementovaná** — v MVP sú otázky `bankQuestions[]` field na Test entite. Plánované v Fáze 5.

## R

**REUSE** — špecifikácia ([reuse.software](https://reuse.software)) na licencovanie open-source projektov. ClubUp je REUSE 3.3 compliant; centrálne mapovanie v `REUSE.toml`.

**RBAC (Role-Based Access Control)** — model autorizácie založený na rolách. ClubUp role: `student`, `instructor`, `content_manager`, `admin`.

## S

**Server Action** — Next.js mechanizmus pre mutácie zo Server Components. Alternatíva k REST endpointom pre interné aplikačné mutácie.

**SelectionMode** — pole na `Test` entite. Hodnoty: `fixed` (test má fixnú sadu otázok, len sa mieša poradie) alebo `random_sample` (test má bank otázok, pre každý pokus sa náhodne vyberie podmnožina).

**SPDX** — Software Package Data Exchange. Štandard pre licenčné identifikátory (`EUPL-1.2`, `CC-BY-4.0`). Používame v REUSE headers.

**SportUp.sk** — centrálny ekosystém, ktorého je ClubUp súčasťou. Autoritatívne eviduje osoby a organizácie. Repo: [github.com/ltksolutions/sportup.sk](https://github.com/ltksolutions/sportup.sk).

**`sportup_person_id`** — identifikátor osoby v SportUp registri. ClubUp ho používa ako primárny kľúč pre študentov a lektorov.

**`sportup_org_id`** — identifikátor organizácie v SportUp registri. ClubUp ho používa pri batch enrollment (klub objedná kurz pre 5 svojich ľudí), na faktúrach a v štatistikách.

**SSO (Single Sign-On)** — jednotné prihlásenie. Užívateľ sa raz prihlási v SportUp.sk a má prístup ku všetkým aplikáciám v ekosystéme (Activity, ClubUp, ďalšie).

**Student / Študent** — osoba zapísaná do kurzu. V databáze je len odkaz na `sportup_person_id`.

## T

**Teams (Microsoft Teams)** — platforma pre live webináre. Pozvánka sa generuje cez Microsoft Graph alebo .ics súbor v emaile.

**Test** — overovacia jednotka. Môže byť na 4 miestach (placement): `part`, `module`, `level`, `course`. Otázky sa generujú podľa `selectionMode` (`fixed` alebo `random_sample`).

**TestAttempt** — pokus študenta o test. Ukladá konkrétne vybrané otázky, poradie zobrazenia otázok aj odpovedí (per študent unikátne) a výsledky odpovedí.

**Topic / Téma** — organizačný kontajner v rámci Levelu. Téma **nemá vlastný test ani milestone v progresse**. Hodnotenie ide cez Modul (1:1 s Témou) a Level (obal). V kurze „Športový manažment" je 10 Tém v každom z 4 Levels.

**Turborepo** — monorepo build system. Používame s npm workspaces.

## U

**Úroveň** — viď [Level](#l).

## V

**Vercel** — hostingová platforma, ktorú používame pre marketingový web aj aplikácie.

## W

**Webhook** — HTTP callback. 24-pay nám posiela webhook pri zmene stavu platby. Vždy verifikujeme HMAC podpis predtým, než webhook spracujeme.

**Webinar** — plánovaný live event v Teams. Samostatná entita; odkazuje sa z `Part.contentBlocks[]` cez `WebinarBlock`. Záznam po skončení sa uploaduje do Mux ako on-demand video.

## 2

**24-pay.sk** — slovenská platobná brána. REST API + webhook. Detaily v [`payments/`](payments/).

## Č

**Časť** — viď [Part](#p).

## Ž

**Žilinská univerzita / ŽU** — partnerská inštitúcia pre certifikáciu kurzu „Športový manažment". Konkrétne FRI ŽU.
