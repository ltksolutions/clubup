# Topic (Téma)

Téma v rámci úrovne. **Organizačný kontajner** — Téma sama o sebe **nemá test ani milestone v progresse**. Hodnotenie ide cez Modul (ktorý je v jej vnútri) a Level (ktorý ju obaľuje).

## Účel

`Topic` zoskupuje obsah do tematických celkov v rámci jednej Úrovne. V kurze „Športový manažment" je 10 Tém v každej Úrovni (jedna Téma „prechádza" cez všetky 4 Úrovne — kombinácia Téma × Úroveň = jeden Modul).

## Schéma

| Pole | Typ | Required | Popis |
|---|---|---|---|
| `_id` | ObjectId | ✓ | |
| `levelId` | ObjectId | ✓ | Parent úroveň |
| `courseId` | ObjectId | ✓ | Denormalized z Level — pre rýchle filtrovanie |
| `orderIndex` | number | ✓ | Pozícia v rámci Levelu (použité ak `Level.topicSequencing: 'sequential'`) |
| `slug` | string | ✓ | URL-friendly (`prostredie-sportu`). Unique v rámci Levelu. |
| `title` | string | ✓ | Názov témy (napr. „Prostredie športu a jeho účastníci") |
| `description` | string (Markdown) | – | Krátky popis témy |
| `module` | ObjectId | ✓ | Referencia na **jediný** modul v rámci tejto Témy (1:1 vzťah) |
| `iconName` | string | – | Lucide icon name pre UI (napr. `landmark`, `gavel`, `coins`) |
| `createdAt` | Date | ✓ | |
| `updatedAt` | Date | ✓ | |

## Indexy

```ts
db.topics.createIndex({ levelId: 1, orderIndex: 1 });
db.topics.createIndex({ levelId: 1, slug: 1 }, { unique: true });
db.topics.createIndex({ courseId: 1 });
```

## Pravidlá

- **Téma má presne 1 Modul** (1:1 vzťah). Kombinácia (Téma, Úroveň) je jedinečná identifikácia Modulu.
- **Téma nemá test, nemá certifikát, nemá vlastný progress milestone**. Slúži len na navigáciu a organizáciu obsahu.
- **„Tá istá téma" naprieč levelmi**: koncepčne má kurz „Športový manažment" 10 tém, kde každá téma má 4 verzie (po jednej v každom Leveli). V databáze to znamená 4 × 10 = **40 Topic dokumentov**, kde `Topic.title` je rovnaké (napr. „Financovanie športu"), ale `levelId` je rôzny. UI vie tieto súvisiace Témy zoskupiť cez `slug` (alebo cez špeciálny `topicGroup` field — ak by to bolo potrebné neskôr).
- **Validácia pri publish**: každá Topic musí mať vyplnený `module` field s referenciou na existujúci Module dokument.

## Vzťah Témy a UI

V študentskej aplikácii sa Téma zobrazuje:

1. **V detaile Levelu** — ako kartička s titulom, ikonou a popisom; klik vedie do detailu Modulu (lebo Téma a Modul sú 1:1)
2. **V navigačnom paneli** — ako sekcia v rámci Levelu

V admin aplikácii sa Téma zobrazuje:

1. **V detaile Kurzu** — ako matrix Tém × Úrovní (mriežka 10 × 4 pre Športový manažment)
2. **V detaile Levelu** — ako reorderable zoznam, kde admin nastavuje poradie (relevantné len pri `topicSequencing: 'sequential'`)

## Príklad — Téma „Financovanie športu" v Level 1

```json
{
  "_id": "ObjectId('topic_1_4')",
  "levelId": "ObjectId('level_1')",
  "courseId": "ObjectId('course_sportovy_manazment')",
  "orderIndex": 4,
  "slug": "financovanie-sportu",
  "title": "Financovanie športu",
  "description": "Systém financovania, vlastné príjmy, dotácie a finančná stabilita.",
  "module": "ObjectId('module_1_4')",
  "iconName": "coins",
  "createdAt": "2026-08-15T10:00:00Z",
  "updatedAt": "2026-09-01T08:00:00Z"
}
```

## Príklad — tá istá Téma v Level 4 (Stratég)

```json
{
  "_id": "ObjectId('topic_4_4')",
  "levelId": "ObjectId('level_4')",
  "courseId": "ObjectId('course_sportovy_manazment')",
  "orderIndex": 4,
  "slug": "financovanie-sportu",
  "title": "Financovanie športu",
  "description": "Pokročilé stratégie financovania a dlhodobá finančná stabilita.",
  "module": "ObjectId('module_4_4')",
  "iconName": "coins",
  "createdAt": "2026-08-15T10:00:00Z",
  "updatedAt": "2026-09-01T08:00:00Z"
}
```

> Slug `financovanie-sportu` je **rovnaký** v oboch dokumentoch, ale `levelId` a `module` sú rôzne. UI vie pre študenta povedať „Tému „Financovanie športu" si už absolvoval na Level 1, teraz pokračuješ s Level 4 verziou".
