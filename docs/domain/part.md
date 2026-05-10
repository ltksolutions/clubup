# Part (Časť)

Časť je **najmenšia samostatná jednotka obsahu** v module. Jeden modul má 1+ častí.

## Účel

V starších návrhoch sa táto entita volala „Lesson" (lekcia). V doménovom modeli ClubUp je `Part` (Časť) — odráža to fakt, že je to **menšia jednotka než klasická lekcia** a typicky obsahuje **kombináciu obsahu** (napr. video + pracovný list + krátky test).

Každá Časť má:

- **Obsah** — formátovaný text, obrázok, video, audio, prezentácia, PDF (jeden alebo viac mediálnych blokov)
- **Voliteľný `Part-test`** — krátky overovací test (admin nastaví, ak chce overiť pochopenie pred prechodom na ďalšiu časť)
- **Voliteľné `prerequisites[]`** — referencie na iné Časti (z toho istého Modulu), ktoré musia byť dokončené pred začatím tejto časti

## Schéma

| Pole | Typ | Required | Popis |
|---|---|---|---|
| `_id` | ObjectId | ✓ | |
| `moduleId` | ObjectId | ✓ | Parent modul |
| `topicId` | ObjectId | ✓ | Denormalized — pre filtre |
| `levelId` | ObjectId | ✓ | Denormalized |
| `courseId` | ObjectId | ✓ | Denormalized |
| `orderIndex` | number | ✓ | Pozícia v module (default sort, použité ak `Module.partSequencing: 'sequential'`) |
| `slug` | string | ✓ | URL-friendly. Unique v rámci Module. |
| `title` | string | ✓ | Názov časti |
| `summary` | string | – | 1–2 vety pre zobrazenie v zozname |
| `contentBlocks` | ContentBlock[] | ✓ | **Obsah časti** — pole blokov (text, obrázok, video, audio, prezentácia, PDF) |
| `attachments` | Attachment[] | – | Doplnkové súbory na stiahnutie (worksheets, šablóny) |
| `prerequisites` | ObjectId[] | – | IDs iných `Part` v tom istom Module, ktoré musia byť dokončené predtým |
| `partTestId` | ObjectId | – | Voliteľný `Part-test` (overenie konkrétnej časti) |
| `partTestRequired` | boolean | ✓ | `true` → časť nie je dokončená bez prejdenia Part-testu. Default `false`, ak `partTestId` neexistuje. |
| `requiredForCompletion` | boolean | ✓ | `true` → bez tejto časti nie je modul dokončený. Default `true`. |
| `estimatedMinutes` | number | – | Odhad času (default odvodený z videí + 1 min/odsek pre text) |
| `createdAt` | Date | ✓ | |
| `updatedAt` | Date | ✓ | |

### `ContentBlock` (sub-typ)

Časť obsahuje **pole content blokov** — zoradenú postupnosť mediálnych elementov, ktoré študent prechádza zhora-dolu:

```ts
type ContentBlock =
  | TextBlock
  | ImageBlock
  | VideoBlock
  | AudioBlock
  | PresentationBlock
  | PdfBlock
  | WebinarBlock
  | EmbedBlock;

type TextBlock = {
  id: string;                    // stable ID v rámci časti
  type: 'text';
  markdown: string;              // Markdown / MDX obsah
  tableOfContents?: boolean;     // pri dlhom texte vygenerovať TOC
};

type ImageBlock = {
  id: string;
  type: 'image';
  url: string;                   // CDN URL alebo signed URL
  alt: string;                   // povinný pre accessibility
  caption?: string;
  width?: number;                // pixels
  height?: number;
};

type VideoBlock = {
  id: string;
  type: 'video';
  muxAssetId: string;
  muxPlaybackId: string;
  durationSec: number;
  transcript?: string;            // VTT formát
  posterUrl?: string;
  chapters?: { title: string; startSec: number }[];
};

type AudioBlock = {
  id: string;
  type: 'audio';
  url: string;                    // signed URL
  durationSec: number;
  transcript?: string;
};

type PresentationBlock = {
  id: string;
  type: 'presentation';
  pdfUrl: string;                  // signed URL
  slideCount: number;
  thumbnailUrl?: string;
};

type PdfBlock = {
  id: string;
  type: 'pdf';
  url: string;                     // signed URL
  pageCount?: number;
  thumbnailUrl?: string;
  downloadable?: boolean;          // default false (len preview)
};

type WebinarBlock = {
  id: string;
  type: 'webinar';
  webinarId: ObjectId;             // referencia na Webinar entitu
};

type EmbedBlock = {
  id: string;
  type: 'embed';
  provider: 'youtube' | 'vimeo' | 'iframe';
  url: string;                     // whitelisted domain check
  caption?: string;
};

type Attachment = {
  name: string;
  url: string;                     // signed URL
  sizeBytes: number;
  mimeType: string;
};
```

## Indexy

```ts
db.parts.createIndex({ moduleId: 1, orderIndex: 1 });
db.parts.createIndex({ moduleId: 1, slug: 1 }, { unique: true });
db.parts.createIndex({ courseId: 1 });
db.parts.createIndex({ 'contentBlocks.type': 1 });
```

## Pravidlá

- **Minimálne 1 contentBlock** (časť bez obsahu nemá zmysel)
- **Prerequisites musia byť v rovnakom Module** — krížové prerequisites medzi modulmi nie sú povolené (kontroluje sa pri publish-e)
- **No cyklické prerequisites** — kontrola pri publish-e (DAG validation)
- **Validácia pri publish**:
  - Aspoň jedna Part v Module musí mať `requiredForCompletion: true`
  - Všetky `videoBlock.muxAssetId` musia byť `ready` v Mux (overí sa cez Mux API)
  - Všetky `imageBlock.alt` musia byť vyplnené (accessibility)

## Sekvenčné vs. flexibilné poradie

`Module.partSequencing` určuje, ako sa navigujú časti:

- **`sequential`** — Časti sa odomykajú postupne podľa `orderIndex`. Časť N sa odomkne až po dokončení časti N-1. Toto sa používa pre lineárne kurzy, kde poradie je dôležité.
- **`flexible_with_prerequisites`** (default) — Časti sa odomykajú podľa `prerequisites[]`. Časti bez prerequisites sú odomknuté hneď. Toto je flexibilnejšie — študent si vyberá, čo chce robiť ako prvé.

**Príklad** v module „Financovanie športu":
- Časť 1: „Úvod do financovania" — žiadne prerequisites → dostupná hneď
- Časť 2: „Verejné zdroje" — prerequisites: [Časť 1] → dostupná po Časti 1
- Časť 3: „Vlastné príjmy" — prerequisites: [Časť 1] → dostupná po Časti 1 (paralelne s Časťou 2)
- Časť 4: „Tvorba rozpočtu" — prerequisites: [Časť 2, Časť 3] → dostupná až po oboch

## Dokončenie časti

Časť je `completed`, keď:

1. Študent prechádza všetkými `contentBlocks` (klik na „označiť ako prečítané" alebo automatická detekcia pre video → 90 % zhliadnuté), **A**
2. Ak `partTestRequired: true`, študent prešiel `Part-test` (`TestAttempt.passed: true`)

Detekcia dokončenia:
- **Video block** — ratio sledovania ≥ 0.9 (alebo manuálne „mark as done")
- **Audio block** — rovnako
- **Text/image/PDF block** — explicitné „mark as done" tlačidlo (môže byť aj timer „min. 30 sec na bloku" pre prevenciu fast-clicking)
- **Presentation block** — automaticky po prechode všetkých slidov v embed-de
- **Webinar block** — attendance ≥ 50 % trvania alebo zhliadnutie záznamu

## Príklad — Časť „Úvod do financovania"

```json
{
  "_id": "ObjectId('part_1_4_1')",
  "moduleId": "ObjectId('module_1_4')",
  "topicId": "ObjectId('topic_1_4')",
  "levelId": "ObjectId('level_1')",
  "courseId": "ObjectId('course_sportovy_manazment')",
  "orderIndex": 1,
  "slug": "uvod-do-financovania",
  "title": "Úvod do financovania",
  "summary": "Prehľad zdrojov a princípov financovania klubu.",
  "contentBlocks": [
    {
      "id": "block_1",
      "type": "text",
      "markdown": "# Prečo je financovanie kľúčové\n\nKaždý klub stojí na pevných finančných základoch..."
    },
    {
      "id": "block_2",
      "type": "video",
      "muxAssetId": "abc123",
      "muxPlaybackId": "xyz456",
      "durationSec": 1080,
      "transcript": "[00:00] Vitajte v module...",
      "posterUrl": "https://image.mux.com/xyz456/thumbnail.jpg?time=5",
      "chapters": [
        { "title": "Úvod", "startSec": 0 },
        { "title": "Verejné zdroje", "startSec": 180 }
      ]
    },
    {
      "id": "block_3",
      "type": "text",
      "markdown": "## Zhrnutie\n\nFinancovanie klubu pochádza z..."
    }
  ],
  "attachments": [
    {
      "name": "Pracovný list — financovanie.pdf",
      "url": "https://cdn.clubup.sk/...",
      "sizeBytes": 245000,
      "mimeType": "application/pdf"
    }
  ],
  "prerequisites": [],
  "partTestId": null,
  "partTestRequired": false,
  "requiredForCompletion": true,
  "estimatedMinutes": 25,
  "createdAt": "2026-08-15T10:00:00Z",
  "updatedAt": "2026-09-01T08:00:00Z"
}
```

## Príklad — Časť s overovacím Part-testom

```json
{
  "_id": "ObjectId('part_1_4_2')",
  "moduleId": "ObjectId('module_1_4')",
  "orderIndex": 2,
  "slug": "verejne-zdroje",
  "title": "Verejné zdroje (PUŠ a dotácie)",
  "contentBlocks": [
    { "id": "b1", "type": "text", "markdown": "..." },
    { "id": "b2", "type": "video", "muxPlaybackId": "...", "durationSec": 720, "muxAssetId": "..." },
    { "id": "b3", "type": "presentation", "pdfUrl": "https://cdn.clubup.sk/...", "slideCount": 12 }
  ],
  "prerequisites": ["ObjectId('part_1_4_1')"],
  "partTestId": "ObjectId('test_part_1_4_2')",
  "partTestRequired": true,
  "requiredForCompletion": true,
  "estimatedMinutes": 30,
  "createdAt": "2026-08-15T10:00:00Z",
  "updatedAt": "2026-09-01T08:00:00Z"
}
```

## Migrácia z `Lesson`

Pôvodne sa táto entita volala `Lesson`. Premenovanie na `Part` lepšie odráža:

1. **Menšia granularita** — Časť môže byť kratšia než klasická „lekcia" (napr. 5-minútové video + 2 odseky textu)
2. **Kombinácia médií** — pôvodný `Lesson` mal `type: 'video' | 'text' | 'presentation' | …` ako diskriminátor; teraz `Part` má `contentBlocks[]` s rôznymi typmi v jednom celku
3. **Konzistencia s tvojim popisom** — používateľ projektu hovorí o „Časti" (Part)

V kóde sa použije `Part`, v UI sa zobrazuje „Časť" (slovensky).

## Vzťah Part ↔ Test

`Part.partTestId` referencuje `Test` dokument s `placement: 'part'`. Test je samostatná entita.
