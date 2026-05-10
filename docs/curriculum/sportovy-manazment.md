# Kurz: Športový manažment pre silnejšie kluby

> Kompletná osnova prvého kurzu na ClubUp.sk. Zdrojová tabuľka: `Sportovy_management_navrh_osnov_final.pdf`.

## Akreditácia

**Žilinská univerzita v Žiline, Fakulta riadenia a informatiky (FRI ŽU).** Detaily v [`../decisions/0008-certification-zu.md`](../decisions/0008-certification-zu.md).

## Pre koho je kurz

Hlavná cieľová skupina: **výkonní riaditelia klubov, generálni sekretári, zakladatelia a manažéri** — ľudia, ktorí riadia klub na dennej báze a potrebujú systematické vzdelanie v športovom manažmente.

Sekundárna: lídri zväzov, manažéri konkrétnych oblastí (marketing, financie), pracovníci samosprávy zodpovední za šport, študenti odborov športový manažment.

## Štruktúra (4 Levels × 10 Topics = 40 Modulov)

```
Level 1: Základy           ← všetky kluby; orientácia v základnom rámci
Level 2: Pokročilý         ← praktické riadenie procesov v klube
Level 3: Špecialista       ← hĺbková expertíza v jednotlivých oblastiach
Level 4: Stratég            ← dlhodobé plánovanie, transformácia, leadership
```

V každom Leveli je tých istých **10 Tém** (s rovnakým slug-om naprieč úrovňami):

1. Prostredie športu a jeho účastníci
2. Právne predpisy v športe
3. Finančné a ekonomické pojmy a operácie
4. Financovanie športu
5. Športová organizácia a jej riadenie
6. Zainteresované strany a práca s nimi
7. Organizácia podujatí a projektové riadenie
8. Sociálno-psychologické aspekty športu
9. Športový marketing a marketingová komunikácia
10. Športová infraštruktúra a jej rozvoj

Každá kombinácia (Téma × Úroveň) = jeden Modul. Spolu **40 Modulov**.

## Postupnosť

- **Levels sú sekvenčné**: študent musí dokončiť všetkých 10 modulov v Level 1 (a prejsť Level-test, ak je nastavený), kým získa prístup do Level 2.
- **Témy v rámci Levelu sú flexibilné** (default `Level.topicSequencing: 'flexible'`) — študent si vyberá poradie.
- **Časti v rámci Modulu** môžu mať definované `prerequisites[]` (admin nastavuje per modul).

## Hodnotenie

| Miesto | V tomto kurze |
|---|---|
| Part-test | Voliteľné per Časť (admin si určí, kde má zmysel overiť pochopenie) |
| Module-test | **Povinný v každom z 40 modulov** — určuje dokončenie modulu |
| Level-test | **Povinný po každom Leveli** — určuje odomknutie ďalšieho Levelu |
| Course-test | **Nie je definovaný** — finálny certifikát sa vydá po dokončení Level 4 |

### Intermediate certifikáty

| Level | `issuesIntermediateCertificate` |
|---|---|
| Level 1: Základy | `false` (po základoch certifikát nedáva veľký zmysel) |
| Level 2: Pokročilý | `false` |
| Level 3: Špecialista | `true` — „Potvrdenie — Špecialista v športovom manažmente" |
| Level 4: Stratég | `true` — zároveň final certifikát „Osvedčenie o absolvovaní vzdelávacieho programu" |

## Časový rozsah

- **Modul:** 45–60 min (samoštúdium)
- **Level:** 10 modulov × ~50 min = **~8–10 hodín** + Level-test (~30–60 min)
- **Celý kurz:** **~40–50 hodín** štúdia + záverečné testy + voliteľné webináre

Cieľ: dokončiť za **6–9 mesiacov** popri pracovných povinnostiach (jeden modul týždenne).

## Mapovanie modulov

> Z PDF: každý riadok = 1 Téma. Každý stĺpec = 1 Level. Cell = 1 Modul.

### Téma 1 — Prostredie športu a jeho účastníci

| Level | Modul | Trvanie |
|---|---|---|
| 1 | Úloha a postavenie športu v spoločnosti | 45 min |
| 2 | Účastníci športového systému a ich úlohy | 45 min |
| 3 | Právny rámec organizovaného športu na Slovensku | 45 min |
| 4 | Riadenie športu na Slovensku a v zahraničí | 60 min |

### Téma 2 — Právne predpisy v športe

| Level | Modul | Trvanie |
|---|---|---|
| 1 | Základné pojmy a právne formy športovej organizácie | 45 min |
| 2 | Zákony ovplyvňujúce šport | 45 min |
| 3 | Športový odborník a založenie podnikateľskej činnosti | 45 min |
| 4 | Interné predpisy a kódexy klubu | 45 min |

### Téma 3 — Finančné a ekonomické pojmy a operácie

| Level | Modul | Trvanie |
|---|---|---|
| 1 | Význam ekonomiky v športe | 45 min |
| 2 | Typy pracovných zmlúv a ohodnotenia zamestnancov | 45 min |
| 3 | Zmluva o sponzorstve | 45 min |
| 4 | Dane v športovej organizácii | 45 min |

### Téma 4 — Financovanie športu

| Level | Modul | Trvanie |
|---|---|---|
| 1 | Systém financovania športu na Slovensku a v zahraničí | 45 min |
| 2 | Vlastné príjmy organizácie | 45 min |
| 3 | Dotácie a finančné granty | 45 min |
| 4 | Finančná stabilita | 45 min |

### Téma 5 — Športová organizácia a jej riadenie

| Level | Modul | Trvanie |
|---|---|---|
| 1 | Vízia a ciele športovej organizácie | 45 min |
| 2 | Organizačná štruktúra | 45 min |
| 3 | Špecifiká športového manažmentu | 45 min |
| 4 | Rozvoj športovej organizácie | 45 min |

### Téma 6 — Zainteresované strany a práca s nimi

| Level | Modul | Trvanie |
|---|---|---|
| 1 | Význam práce so zainteresovanými stranami | 45 min |
| 2 | Hlavné zainteresované strany a komunikácia s nimi | 45 min |
| 3 | Zapájanie dobrovoľníkov a podporovateľov | 45 min |
| 4 | Budovanie komunity | 45 min |

### Téma 7 — Organizácia podujatí a projektové riadenie

| Level | Modul | Trvanie |
|---|---|---|
| 1 | Športové podujatie a jeho špecifiká | 45 min |
| 2 | Plánovanie športového podujatia | 45 min |
| 3 | Logistika a zabezpečenie podujatia | 45 min |
| 4 | Marketing športových podujatí | 60 min |

### Téma 8 — Sociálno-psychologické aspekty športu

| Level | Modul | Trvanie |
|---|---|---|
| 1 | Sociálno-psychologický význam športu | 60 min |
| 2 | Riešenia konfliktných situácií | 45 min |
| 3 | Vzťah športovec – tím – klub – zainteresovaná verejnosť (rodičia, fanúšikovia) | 45 min |
| 4 | Sebarealizácia v športe — emócie a autorita | 45 min |

### Téma 9 — Športový marketing a marketingová komunikácia

| Level | Modul | Trvanie |
|---|---|---|
| 1 | Význam marketingu v športe | 60 min |
| 2 | Základné komunikačné kanály a nástroje | 60 min |
| 3 | Budovanie značky | 60 min |
| 4 | Nástroje na podporu marketingovej komunikácie | 60 min |

### Téma 10 — Športová infraštruktúra a jej rozvoj

| Level | Modul | Trvanie |
|---|---|---|
| 1 | Športová infraštruktúra ako miesto výkonu športu | 45 min |
| 2 | Prevádzka a údržba športovej infraštruktúry | 45 min |
| 3 | Financovanie, investície a optimalizácia nákladov | 45 min |
| 4 | Technologické novinky v športe | 60 min |

## Mapovanie do databázy

```
Course "Športový manažment pre silnejšie kluby"
├── Level 1 "Základy" (orderIndex=1)
│   ├── Topic "Prostredie športu" → Module "Úloha a postavenie športu v spoločnosti"
│   ├── Topic "Právne predpisy" → Module "Základné pojmy a právne formy..."
│   ├── ... (ďalších 8 tém)
│   └── Level-test (povinný)
├── Level 2 "Pokročilý" (orderIndex=2)
│   ├── Topic "Prostredie športu" → Module "Účastníci športového systému..."
│   ├── ... (ďalších 9 tém)
│   └── Level-test (povinný)
├── Level 3 "Špecialista" (orderIndex=3)
│   ├── (10 tém, 10 modulov)
│   ├── Level-test (povinný)
│   └── Intermediate certifikát "Špecialista v športovom manažmente"
└── Level 4 "Stratég" (orderIndex=4)
    ├── (10 tém, 10 modulov)
    ├── Level-test (povinný)
    └── Intermediate certifikát "Stratég v športovom manažmente"
        + Final certifikát "Športový manažment pre silnejšie kluby"
```

## Výstup absolventa

Po dokončení celého kurzu (všetky 4 Levels + Level-tests):

- **Akreditovaný certifikát od ŽU/FRI** — „Osvedčenie o absolvovaní vzdelávacieho programu Športový manažment pre silnejšie kluby"
- **Verejne overiteľný** — `https://clubup.sk/verify/{registrationNumber}`
- **Kompetencie** (vystavené aj v certifikáte):
  - Pozná právny a finančný rámec slovenského športu
  - Vie naplánovať rozpočet klubu na sezónu
  - Rozumie systému dotácií (PUŠ, MŠVVaŠ, samospráva, EÚ fondy)
  - Vie pripraviť strategický plán klubu
  - Pozná princípy práce so zainteresovanými stranami a komunitou
  - Vie organizovať športové podujatie
  - Rozumie marketingu a budovaniu značky klubu
  - Pozná infraštruktúrne výzvy a riešenia

## Cenotvorba

Návrh (orientačný — final cena bude potvrdená pri launch-i):

| Položka | Cena |
|---|---|
| Celý kurz (4 Levels) | **490 €** vrátane DPH |
| Iba Level 1 (Základy) | 99 € (vstupný produkt — bez certifikátu) |
| Skupinová licencia pre klub (5 zápisov) | 1990 € (zľava 19%) |

Možnosti rozšírenia:

- **Mentorský balíček** — 4× 60 min individuálnych konzultácií s lektorom: **+ 290 €**
- **Doplnkové webináre** k aktuálnym témam: zahrnuté v základnej cene

## Webináre (live + záznam)

V rámci kurzu plánujeme **min. 4 živé webináre per Level** s lektormi z FRI ŽU a externými expertmi (športoví riaditelia, právnici, ekonómovia v športe). Detaily v [`../decisions/0007-live-teams.md`](../decisions/0007-live-teams.md).

Webináre sú voliteľné (nie sú prerequisite pre dokončenie modulu) — záznam je dostupný v príslušnej Časti.

## Tagovanie otázok pre random_sample testy

Pre `Level-test` s `selectionMode: random_sample` použijeme `bankSelection.byTag` pre vyváženosť — každá Téma musí byť v Level-teste reprezentovaná. Tagy zodpovedajú slug-om Tém:

```json
{
  "totalCount": 20,
  "byTag": [
    { "tag": "prostredie-sportu", "count": 2 },
    { "tag": "pravne-predpisy", "count": 2 },
    { "tag": "financne-pojmy", "count": 2 },
    { "tag": "financovanie", "count": 2 },
    { "tag": "organizacia-riadenie", "count": 2 },
    { "tag": "zainteresovane-strany", "count": 2 },
    { "tag": "podujatia", "count": 2 },
    { "tag": "socialno-psychologicke", "count": 2 },
    { "tag": "marketing", "count": 2 },
    { "tag": "infrastruktura", "count": 2 }
  ]
}
```

## Ďalšie kurzy (roadmap)

Po stabilizácii prvého kurzu plánujeme rozšírenia (závisí od dopytu):

- **Marketing pre menšie kluby** — koncentrovaný kurz len o marketingu
- **Financovanie športovej organizácie** — hĺbková expertíza pre účtovníkov a ekonómov klubov
- **Trenérsky manažment** — pre trénerov, ktorí riadia akadémie
- **Klubový sekretár — komplexná príprava** — orientácia na admin/operatívu

Tieto budú samostatné `Course` dokumenty s vlastnou hierarchiou.
