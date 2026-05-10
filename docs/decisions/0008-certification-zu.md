# ADR-0008: Certifikácia cez Žilinskú univerzitu (FRI)

- **Status:** Accepted
- **Dátum:** 2026-05-10
- **Rozhodol:** Ján Letko (LTK Solutions)
- **Súvisiace ADR:** ADR-0007 (live výučba)

## Kontext

Cieľom kurzu „Športový manažment pre silnejšie kluby" je dať absolventom **niečo viac než len certifikát od ClubUp**. Pre cieľovú skupinu (výkonní riaditelia klubov, generálni sekretári) má hodnotu len certifikát, ktorý:

- Vydáva **akreditovaná inštitúcia** (nie self-issued e-cert)
- Má **registračné číslo** v štátnom alebo univerzitnom systéme
- Je **overiteľný** treťou stranou
- Prípadne sa **dá uznať** ako kreditové vzdelanie pri vyšších štúdiách

Súčasne ClubUp je **digitálna platforma**, nie vzdelávacia inštitúcia — nemáme akreditáciu MŠVVaŠ SR a ani ju nechceme získavať (vyžadovala by zmenu právnej formy, audity, ďalšie roky).

## Zvažované možnosti

### Možnosť A — Self-issued certifikát ClubUp
- **Pros:** plná kontrola, zero externé dependency, zadarmo
- **Cons:** **nemá uznanie** v športovej obci, nie je to cesta k inšpirovaniu cieľovej skupiny, prevod na MBA/iné štúdium nemožný

### Možnosť B — Žilinská univerzita / FRI ŽU
- **Pros:** akreditovaná univerzita, **má katedru športového manažmentu** (resp. súvisiace odbory v rámci FRI), geograficky v centre Slovenska, **už ich poznám / kontakt**, prirodzený fit pre tému
- **Cons:** byrokracia univerzitného procesu, koordinácia s rektorátom, splitting revenue (časť platby ide ŽU)

### Možnosť C — Comenius University FTVŠ (Bratislava)
- **Pros:** najznámejšia športová fakulta na Slovensku, akreditovaná, väčší brand
- **Cons:** silnejšia byrokracia, neexistujúci osobný kontakt, geografický focus na Bratislavu menej pasuje pre celoslovenský dosah

### Možnosť D — Slovenský olympijský a športový výbor (SOŠV)
- **Pros:** národná autorita pre šport, dôveryhodný brand
- **Cons:** SOŠV nie je akreditovaný vzdelávací subjekt, certifikát od nich má politickú váhu ale nie kvalifikačnú; tiež komplexnejšia governance

### Možnosť E — Privátny inštitút (napr. ProFutuRo)
- **Pros:** flexibilita, rýchlosť
- **Cons:** menšia kvalifikačná váha, riziko politickej afiliácie

## Rozhodnutie

**Žilinská univerzita v Žiline, Fakulta riadenia a informatiky (FRI ŽU)** je akreditovaný partner pre certifikáciu kurzu „Športový manažment pre silnejšie kluby".

- ClubUp **dodáva**: obsah (videá, prezentácie, testy), platformu, evaluáciu (test scoring), platobný proces
- ŽU/FRI **dodáva**: akreditovanú strešnú entitu, registračné čísla certifikátov, podpísané PDF certifikáty, svojich lektorov pre webináre
- **Cooperation model**: ClubUp je marketingová a operačná stránka, ŽU je akademický partner, ktorý zaručuje vzdelávaciu hodnotu
- **Revenue sharing**: konkrétny pomer dohodnutý v rámci spoločnej zmluvy (mimo rozsah tohto ADR — toto je business decision, nie technical)
- **Technický model**: viď [`../domain/certificate.md`](../domain/certificate.md)
  - ClubUp eviduje metadata `Certificate` (študent, kurz, dátum, registračné číslo, hash)
  - PDF generuje ŽU zo svojich systémov (manuálne v Fáze 1, automatizovane neskôr)
  - Verejne overiteľný cez `/verify/{registrationNumber}` na ClubUp doméne

## Dôvody

1. **Akreditovaný partner, nie self-issued** — Daná štátna autorita ŽU je presne to, čo cieľová skupina hľadá
2. **FRI ŽU má relevantnú expertízu** — Fakulta riadenia je relevantná pre manažérske vzdelávanie; majú už zavedené postupy pre certifikáciu doplnkového vzdelávania
3. **Existujúci kontakt** — vzťah s FRI ŽU je už nadviazaný (oslovenie cez katedru zo strany Jána Letka). Bez existujúceho mostíka by sa proces s univerzitou ťahal mesiace
4. **Slovenský brand** — ŽU je vnímaná ako kvalitná regionálna univerzita s celoslovenským dosahom; nie elitárska, čo lepšie pasuje k „pre kluby zo všetkých kútov" pozícii
5. **Spôsob spolupráce funguje aj ďalej** — model ClubUp + akreditovaný partner vieme replikovať pre ďalšie kurzy s ďalšími univerzitami (FTVŠ, KU, atď.)
6. **Žiadny vlastný akreditačný proces** — ušetrí nám 1–2 roky a stovky tisíc EUR

## Dôsledky

### Pozitívne
- Certifikát má váhu pre cieľovú skupinu
- Marketingovo „v spolupráci so Žilinskou univerzitou" je veľmi silné
- Prístup k akademickým lektorom (z FRI ŽU)
- Prípadná konvertibilita kreditov / uznanie pri ďalších štúdiách
- Nemusíme byť akreditovaný subjekt

### Negatívne / kompromisy
- **Závislosť na ŽU pre vydávanie certifikátov** — ak ŽU mešká alebo zmení postup, naši študenti čakajú
  - Mitigácia: SLA v zmluve (max 14 dní od dokončenia kurzu po vydanie certifikátu)
  - Mitigácia: automatizácia (Fáza 2) cez API integráciu so Štúdijným systémom ŽU
- **Revenue sharing** — časť ceny kurzu ide ŽU
  - Komentár: pre váhu certifikátu je to opodstatnená cena; pri orientačnej cene 200–500 € za kurz je marže dostatočná pre obe strany
- **Brand co-existence** — na certifikáte musí byť ŽU logo + ClubUp logo; v marketingu „v spolupráci so ŽU" je povinné. Brand book vyriešený cez [`../../website/brand/BRAND.md`](../../website/brand/BRAND.md) — sekcia „Použitie v ekosystéme SportUp" + co-branding so ŽU
- **Akreditácia kurzu v ŽU** — kurz musí prejsť internou akreditáciou ŽU; znamená to formálnu dokumentáciu osnov, výstupov, evaluácie. Toto sme spravili (osnova v [`../curriculum/sportovy-manazment.md`](../curriculum/sportovy-manazment.md))

### Neutrálne
- ŽU môže v budúcnosti mať vlastnú online platformu pre svojich študentov; náš model je doplnkový (širší trh než len ŽU študenti)

## Implementačné poznámky

- **Certifikát flow** v Fáze 1 (manuálny):
  1. Študent prejde kurz a záverečný test
  2. ClubUp pošle adminovi email „John Doe dokončil kurz, pripravený na certifikát"
  3. Admin manuálne exportuje študenta do CSV s detailami (meno, dátum narodenia, kurz, dátum dokončenia, score)
  4. Admin pošle CSV študijnému oddeleniu FRI ŽU
  5. ŽU vytvorí certifikát, pridelí registračné číslo, pošle PDF adminovi
  6. Admin nahrá detaily do `Certificate` entity v ClubUp
  7. Študent dostane email „Tvoj certifikát je hotový"
- **Certifikát flow** v Fáze 2 (automatizovaný — vyžaduje API integráciu so ŽU):
  1. ClubUp automaticky volá ŽU API s dokončením kurzu
  2. ŽU API vráti `registrationNumber` a URL na PDF
  3. ClubUp aktualizuje `Certificate` entity
  4. Email študentovi
- **Verejná verifikácia** v ClubUp:
  - Endpoint `GET /verify/{registrationNumber}?h={verificationHash}`
  - Vráti meno, kurz, dátum, validitu
  - Detaily v [`../domain/certificate.md`](../domain/certificate.md)

## Revisit

- **Po 100 vydaných certifikátoch** — vyhodnotiť uptime ŽU procesu a presnosť SLA
- **Pri rozšírení o ďalšie kurzy** — možno bude treba ďalší univerzitný partner (napr. FTVŠ pre kurzy o trénerstve)
- **Pri zmene zákona o vysokých školách** alebo akreditácii — re-overiť, že ŽU stále môže vydávať osvedčenia tohto typu

## Odkazy

- [Žilinská univerzita - FRI](https://fri.uniza.sk/)
- [Zákon č. 131/2002 Z. z. o vysokých školách](https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2002/131/) — § 60 (osvedčenie o absolvovaní vzdelávacieho programu)
- [`../domain/certificate.md`](../domain/certificate.md) — Certificate entity
- [`../curriculum/sportovy-manazment.md`](../curriculum/sportovy-manazment.md) — osnova kurzu
