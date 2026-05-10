# Module (Modul)

Modul je **priesečník Témy a Úrovne**. V kurze „Športový manažment" je 4 × 10 = **40 modulov**.

## Účel

Modul je hlavná **vzdelávacia a hodnotiaca jednotka**. Jeden modul obsahuje:

- Niekoľko **Častí** (`Part`) s obsahom
- Voliteľný **Module-test** na konci

Príklad: Modul „Financovanie športu / Základy" (Téma 4 × Level 1) obsahuje:
- Časť 1: Úvod do financovania (video)
- Časť 2: Verejné zdroje (text + prezentácia)
- Časť 3: Vlastné príjmy klubu (video)
- Modul-test (10 otázok)

## Schéma

| Pole | Typ | Required | Popis |
|---|---|---|---|
| `_id` | ObjectId | ✓ | |
| `topicId` | ObjectId | ✓ | Parent Téma (1:1 — každá Téma má presne 1 modul) |
| `levelId` | ObjectId | ✓ | Denormalized z Topic — pre rýchle filtrovanie podľa Levelu |
| `courseId` | ObjectId | ✓ | Denormalized — pre rýchle filtrovanie podľa Kurzu |
| `slug` | string | ✓ | URL-friendly. Unique v rámci Topic. Default = `Topic.slug` |
| `title` | string | ✓ | Názov modulu. Často rovnaký ako Topic.title pre Level 1, alebo rozšírený pre vyššie Levely (napr. „Financovanie športu — pokročilé stratégie") |
| `description` | string (Markdown) | – | Detailný popis modulu (čo sa študent naučí) |
| `learningOutcomes` | string[] | – | Bodový zoznam výstupov („Po absolvovaní vieš…") |
| `parts` | ObjectId[] | ✓ | Časti v poradí (poradie sa použije, ak `partSequencing` je `sequential` alebo pre default sort) |
| `partSequencing` | enum | ✓ | `sequential` (povinné poradie) alebo `flexible_with_prerequisites` (default — častí majú prerequisites). |
| `moduleTestId` | ObjectId | – | Voliteľný `Module-test` |
| `moduleTestRequired` | boolean | ✓ | `true` → bez prejdenia Module-testu nie je modul dokončený. Default `true`, ak `moduleTestId` existuje. |
| `estimatedMinutes` | number | – | Odhad času (suma z častí + buffer) |
| `createdAt` | Date | ✓ | |
| `updatedAt` | Date | ✓ | |

## Indexy

```ts
db.modules.createIndex({ topicId: 1 }, { unique: true });   // 1 Topic = 1 Module
db.modules.createIndex({ levelId: 1 });
db.modules.createIndex({ courseId: 1 });
```

## Pravidlá

- **Modul je 1:1 s Témou**. Každý Topic má presne jeden Module.
- **Minimálne 1 Part per Module**.
- **Validácia pri publish**:
  - `moduleTestId` (ak je vyplnené) musí byť test s `placement: 'module'`
  - aspoň jedna Part musí byť `requiredForCompletion: true` (inak by sa modul nedal dokončiť)
- **Dokončenie modulu** nastáva, keď:
  - Všetky `requiredForCompletion: true` Parts majú `state: completed` v `Progress`, **A**
  - Ak existuje `moduleTestId` a `moduleTestRequired: true`, študent prešiel Module-test (`TestAttempt.passed: true`)
- **Dokončenie modulu odomyká ďalšiu Tému** v rámci tej istej Úrovne (ak `Level.topicSequencing: 'sequential'`); pri `flexible` to nemá vplyv.

## Príklad — Module „Financovanie športu / Základy"

```json
{
  "_id": "ObjectId('module_1_4')",
  "topicId": "ObjectId('topic_1_4')",
  "levelId": "ObjectId('level_1')",
  "courseId": "ObjectId('course_sportovy_manazment')",
  "slug": "financovanie-sportu",
  "title": "Financovanie športu — Základy",
  "description": "Po absolvovaní modulu pochopíš, odkiaľ kluby získavajú financie a aké sú kľúčové zdroje pre začínajúce kluby.",
  "learningOutcomes": [
    "Pomenuješ hlavné zdroje financovania klubu",
    "Vysvetlíš rozdiel medzi PUŠ a dotáciami",
    "Pripravíš základný rozpočet klubu na sezónu"
  ],
  "parts": [
    "ObjectId('part_1_4_1')",
    "ObjectId('part_1_4_2')",
    "ObjectId('part_1_4_3')"
  ],
  "partSequencing": "flexible_with_prerequisites",
  "moduleTestId": "ObjectId('test_module_1_4')",
  "moduleTestRequired": true,
  "estimatedMinutes": 75,
  "createdAt": "2026-08-15T10:00:00Z",
  "updatedAt": "2026-09-01T08:00:00Z"
}
```

## Vzťah Module ↔ Test

`Module.moduleTestId` referencuje `Test` dokument s `placement: 'module'`. Test je samostatná entita (viď [`test.md`](test.md)), aby:

- Zmena testu nepotrebovala upraviť Module
- Bolo možné zdieľať test medzi modulmi (zriedkavé, ale možné napr. pre zhodný overovací kvíz)
- Versioning testu bol nezávislý

Pri publish-e Modulu sa kontroluje, že referenced Test existuje a má správny `placement`.
