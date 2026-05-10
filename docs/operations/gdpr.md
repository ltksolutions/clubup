# GDPR & ochrana osobných údajov

> Ako ClubUp spracováva osobné údaje a plní povinnosti podľa GDPR (Nariadenie EÚ 2016/679) a slovenského zákona č. 18/2018 Z. z. o ochrane osobných údajov.

> **Status:** koncepčný návrh. Pred ostrým spustením treba: (1) vytvoriť verejné Zásady spracovania osobných údajov, (2) podpísať DPA so SportUp (joint controller analysis), (3) zladiť tento dokument s aktuálnym Purpose Catalogue SportUp.

## Roly v ekosystéme

ClubUp je **prevádzkovateľom** (data controller) v zmysle GDPR — určuje účely spracovania osobných údajov v rámci vzdelávacej platformy.

Vzhľadom na ekosystém SportUp existuje **dvojvrstvové vzťah**:

- **SportUp.sk** je prevádzkovateľom centrálneho registra osôb (autoritatívne ID, meno, email, role)
- **ClubUp.sk** je prevádzkovateľom vzdelávacích záznamov (enrollment, progress, payment, certifikát)

Vzťah je **joint controllership** podľa čl. 26 GDPR (treba zmluvne ošetriť).

Subdodávatelia (sprostredkovatelia / data processors):

| Sprostredkovateľ | Čo spracúva | Lokalita |
|---|---|---|
| Vercel Inc. | Hosting, logy | EÚ (Frankfurt) |
| MongoDB Atlas (MongoDB Inc.) | Databáza | EÚ (Frankfurt) |
| Mux Inc. | Video streaming | EÚ + USA (transfer pod Standard Contractual Clauses) |
| Microsoft Ireland | Teams (live webináre) | EÚ |
| 24-pay s.r.o. (4PAY) | Platobné údaje | SK |
| Sentry (Functional Software) | Error tracking (PII redacted) | EÚ + USA |
| Resend Inc. | Transakčné emaily | USA (SCC) |
| Žilinská univerzita | Vydávanie certifikátov | SK |

Pre každého máme/budeme mať **Data Processing Agreement (DPA)**.

## Purpose Catalogue

Účely, na ktoré spracovávame osobné údaje:

### 1. Vzdelávanie (legal basis: zmluva)

**Účel:** poskytnutie vzdelávacieho programu študentovi, ktorý si ho zakúpil.

**Údaje:** meno, email, dátum narodenia (pre certifikát), telefón (voliteľne), enrollment, progress, výsledky testov.

**Doba uchovávania:** počas trvania enrollmentu + 5 rokov po dokončení (pre overenie certifikátu a potenciálne reklamácie).

### 2. Vydávanie certifikátu (legal basis: zmluva + zákonná povinnosť)

**Účel:** odovzdanie údajov Žilinskej univerzite na vystavenie akreditovaného certifikátu.

**Údaje:** meno, dátum narodenia, kurz, dátum dokončenia, score testov.

**Doba uchovávania:** **trvalo** (zákonná povinnosť — zákon č. 131/2002 Z. z. o vysokých školách, vedenie zoznamu absolventov ŽU).

### 3. Platby a fakturácia (legal basis: zmluva + zákonná povinnosť)

**Účel:** spracovanie platby cez 24-pay, vystavenie faktúry, vedenie účtovníctva.

**Údaje:** meno, email, fakturačná adresa, IČO/DIČ (ak firma), order/payment IDs, suma. **Nikdy: čísla kariet, IBAN platiteľa.**

**Doba uchovávania:** **10 rokov** (zákon č. 431/2002 Z. z. o účtovníctve).

### 4. Komunikácia (legal basis: zmluva + oprávnený záujem)

**Účel:** transakčné emaily (potvrdenie platby, pripomienky webinárov, vydanie certifikátu), odpovede na podporu.

**Údaje:** meno, email, history komunikácie.

**Doba uchovávania:** počas trvania vzťahu + 3 roky.

### 5. Marketing (legal basis: súhlas)

**Účel:** newsletter, ponuky ďalších kurzov, eventy.

**Údaje:** meno, email.

**Doba uchovávania:** kým súhlas trvá; možnosť unsubscribe v každom emaile.

> **POZN:** marketingový súhlas vyberáme separe od iných dohôd (žiadny pre-checked checkbox).

### 6. Audit & bezpečnosť (legal basis: oprávnený záujem)

**Účel:** detekcia podvodu, vyšetrovanie incidentov, prevencia zneužitia.

**Údaje:** IP adresa, user agent, timestamps akcií, audit logs.

**Doba uchovávania:** **24 mesiacov**.

### 7. Analytika a zlepšovanie produktu (legal basis: oprávnený záujem; cookies — súhlas)

**Účel:** pochopiť, ako sa používa platforma, identifikovať bottlenecks, zlepšiť UX.

**Údaje:** anonymizované prehľady (Vercel Speed Insights, agregované completion rates). **Žiadne externé trackery (Google Analytics, Facebook Pixel).**

**Doba uchovávania:** agregáty trvalo, individuálne metriky 90 dní.

## Práva dotknutých osôb

ClubUp implementuje všetky práva podľa GDPR čl. 15–22:

| Právo | Implementácia |
|---|---|
| Právo na prístup | `/profil/export` — stiahnuteľný JSON s všetkými moje dáta |
| Právo na opravu | `/profil/upravit` — meno, email; pre opravu v centrálnom registri pošleme na SportUp |
| Právo na vymazanie | `/profil/zrusenie-uctu` — formulár; manuálne spracovanie do 30 dní |
| Právo na prenosnosť | `/profil/export` — JSON v štandardizovanom formáte |
| Právo na obmedzenie | Manuálne — kontakt na DPO |
| Právo namietať | Manuálne — kontakt na DPO |
| Právo nepodliehať automatizovanému rozhodovaniu | ClubUp nerobí auto-decisioning (testy hodnotí algoritmus, ale s možnosťou manuálneho prepočtu adminom) |

### Vymazanie účtu — challenge

**Problém:** niektoré údaje **nemôžeme vymazať** kvôli zákonným povinnostiam (faktúry 10 rokov, certifikáty trvalo).

**Riešenie:** **anonymizácia**:

- Order, Payment záznamy → meno nahradíme `Vymazaný používateľ ID-XXX`
- Certificate záznamy → ostávajú s pôvodnými údajmi (pre overenie tretími stranami), ale link na profil zruší
- Enrollment → state = `cancelled`, `studentDisplayName` = anonymizovaný
- Progress, TestAttempt → vymazané

**Sprostredkujeme** požiadavku do SportUp (centrálny register) — celý ekosystém by mal user vymazať z jedného miesta.

### Workflow pri DSAR (Data Subject Access Request)

1. Užívateľ vyplní formulár alebo pošle email na `dpo@clubup.sk`
2. Identifikácia (cez login alebo iné overenie)
3. Manuálny export cez admin nástroj
4. Doručenie do **30 dní** (predĺženie max o 60 dní s vysvetlením)
5. Všetko zaznamenať do GDPR ledger

## Cookies

| Typ | Účel | Súhlas |
|---|---|---|
| Strictly necessary | Session cookie, CSRF token | NIE (legitímny záujem) |
| Functional | Theme preference, language | Implicitne |
| Analytics | Vercel Speed Insights | Anonymizovaný — bez súhlasu |
| Marketing | (žiadne) | — |

**Cookie banner:** zobrazí sa pri prvej návšteve, len pokiaľ pridáme niečo cez essential. Aktuálne nemáme tracking cookies, takže banner je len informatívny.

## Zásady spracovania osobných údajov

Verejný dokument na `clubup.sk/zasady-ochrany-osobnych-udajov`:

- Identifikácia prevádzkovateľa (LTK Solutions s.r.o.)
- Kontakt na DPO
- Účely spracovania (Purpose Catalogue v zrozumiteľnom jazyku)
- Doba uchovávania
- Prijímatelia údajov (sprostredkovatelia)
- Práva dotknutých osôb a ako ich uplatniť
- Sťažnosť na Úrad na ochranu osobných údajov SR

Tento dokument MUSÍ byť k dispozícii pri každom collection point (login, registrácia, checkout) — formou linku, nie pre-zaškrtnutého checkboxu.

## Data minimization

ClubUp **nezbieraneme údaje, ktoré nepotrebujeme**:

- ❌ Pohlavie — nepotrebné na poskytnutie vzdelávania
- ❌ Adresa bydliska — nepotrebné, iba fakturačná adresa pre faktúry
- ❌ Telefón — voliteľné, len pre podporu
- ❌ Tretie identifikátory (Facebook ID, Google ID) — nepoužívame social login
- ❌ Cookies bez funkčného účelu

Údaje, ktoré **zbierame** sú v Purpose Catalogue vyššie.

## Bezpečnosť údajov

Detaily v [`security.md`](security.md). Zhrnutie pre GDPR:

- TLS 1.3 na všetkých endpointoch
- Encryption at rest (MongoDB Atlas)
- Hashed/encrypted secrets (Vercel env vars)
- Žiadne plain-text heslá u nás (delegované na SportUp SSO)
- HttpOnly cookies (žiadne XSS-readable session)
- Audit log immutable, 24-mesačné retention
- Backup encrypted, retention 7 dní

## Notification of breach

Ak nastane **breach** (napr. neoprávnený prístup k DB):

1. **Detekcia** → Sentry + Mongo Atlas Audit
2. **Containment** — okamžite revokovať credentials, zatvoriť dieru
3. **Assessment** — koho sa to dotklo, akých údajov
4. **Notification ÚOOÚ SR** — do **72 hodín** (čl. 33 GDPR)
5. **Notification dotknutých osôb** — bez zbytočného odkladu, ak je vysoké riziko (čl. 34)
6. **Postmortem** + opatrenia na prevenciu

## Data Protection Officer

ClubUp pri MVP nemá povinného DPO (nie sme verejný subjekt, ani veľkoplošné spracovanie special category data). Ale máme **kontakt na ochranu súkromia** — `dpo@clubup.sk` (technicky preposiela na konateľa LTK Solutions s.r.o.).

Pri prekročení ~10 000 aktívnych študentov vyhodnotíme, či menovať externého DPO.

## DPIA (Data Protection Impact Assessment)

Pre vzdelávaciu platformu s identifikovaným personálom (učitelia + študenti) je DPIA **odporúčaná**, nie povinná. Plánujeme ju vypracovať pred ostrým spustením s kapacitou 1000+ enrollmentov.

## SportUp ekosystém — joint controllership

Keďže ClubUp **delí** spracovanie identity so SportUp:

- SportUp = autoritatívny zdroj profile (meno, email, dátum narodenia)
- ClubUp = autoritatívny zdroj vzdelávacích aktivít

Treba **dohoda o spoločnom spracúvaní** (čl. 26 GDPR) medzi LTK Solutions s.r.o. (ClubUp + SportUp owner) — toto je interná vec, ale dokumentačne musí existovať. Napriek tomu, že obe sú vlastnené tou istou firmou, technicky ide o samostatné systémy.

## Slovenský zákon č. 18/2018 Z. z.

Slovenský zákon je v podstate transpozícia GDPR + slovenské špecifiká. Naše zásady sú s ním v súlade. Kľúčové slovenské špecifiká:

- Notifikácia ÚOOÚ SR pri breach v slovenčine
- Práva dotknutých osôb v slovenčine
- Zásady spracovania v slovenčine
- DPO komunikácia v slovenčine

## Audit trail

Pre audit GDPR compliance držíme:

- **Privacy ledger** — interný dokument so záznamom všetkých DSAR requestov, breaches, DPIA
- **Change log Purpose Catalogue** — každá zmena účelu spracovania je zaznamenaná s dátumom a justification
- **Legitimate interest assessments (LIA)** — pre každý účel s legal basis = legitimate interest

## Často kladené otázky (interné)

**Q: Môžeme posielať marketingové emaily študentom, ktorí dokončili kurz?**
A: Áno, na základe **soft opt-in** (zákazníci, ktorí nakúpili produkt) môžeme posielať emaily o podobných produktoch. Musí byť možnosť unsubscribe v každom emaile a oddelený explicitný súhlas pre 3rd party marketing.

**Q: Môžeme zdieľať dáta s Žilinskou univerzitou?**
A: Áno, na základe zmluvy o akreditovanej spolupráci a so súhlasom študenta (zaškrtnutý pri checkout-e: „Súhlasím s odovzdaním údajov ŽU za účelom vystavenia certifikátu").

**Q: Mužeme používať OpenAI/Anthropic na transcription videí?**
A: Áno, ak v DPA je dohodnutý mode bez tréningu modelov a transfer cez SCC. Aktuálne plánujeme **on-platform transcription cez Mux**, ktorý má vlastný DPA. Externé AI nepoužívame na user data.

## Kontakt

| Úloha | Email |
|---|---|
| GDPR otázky | `dpo@clubup.sk` |
| Žiadosti o údaje (DSAR) | `dpo@clubup.sk` (alebo cez `/profil/export`) |
| Bezpečnostné incidenty | `security@clubup.sk` |
