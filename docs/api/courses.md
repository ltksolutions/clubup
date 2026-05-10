# API — Courses

Endpointy pre prácu s kurzami a ich obsahom (Levels, Topics, Modules, Parts).

## Public endpointy

### `GET /api/courses`

Verejný katalóg kurzov (len `state: 'published'`).

**Auth:** žiadna
**Rate limit:** 60/min/IP

**Query parametre:**

| Param | Typ | Default | Popis |
|---|---|---|---|
| `tag` | string | – | Filter podľa tagu (napr. `manazment`) |
| `page` | int | 1 | |
| `pageSize` | int | 20 | max 50 |

**Response 200:**

```json
{
  "data": [
    {
      "_id": "66e1f8a0123456789abcdef0",
      "slug": "sportovy-manazment",
      "title": "Športový manažment pre silnejšie kluby",
      "shortDescription": "10 tém, 40 modulov, 4 úrovne — od základov po stratégiu.",
      "coverImageUrl": "https://cdn.clubup.sk/courses/sportovy-manazment/cover.webp",
      "priceCents": 49000,
      "currency": "EUR",
      "vatIncluded": true,
      "durationHours": 40,
      "language": "sk",
      "tags": ["manazment", "kluby", "akreditovany-kurz"],
      "instructorProfiles": [
        { "displayName": "Doc. Ing. Ján Príklad, PhD.", "affiliation": "FRI ŽU" }
      ],
      "accreditation": {
        "partnerName": "Žilinská univerzita v Žiline, Fakulta riadenia a informatiky"
      }
    }
  ],
  "pagination": { "page": 1, "pageSize": 20, "totalItems": 1, "totalPages": 1 }
}
```

### `GET /api/courses/:slug`

Detail kurzu s úrovňami, témami, modulmi (verejne čo do popisu, ale obsah Časti je za enrollmentom).

**Auth:** žiadna pre marketing dáta. Ak je session a má aktívny enrollment, vráti aj `enrollment` objekt s progressom.

**Response 200:**

```json
{
  "course": {
    "_id": "66e1f8a0123456789abcdef0",
    "slug": "sportovy-manazment",
    "title": "Športový manažment pre silnejšie kluby",
    "subtitle": "Komplexné vzdelávanie pre výkonných riaditeľov",
    "description": "## O kurze\n\nKomplexné vzdelávanie pre ľudí, ktorí riadia športové kluby...",
    "priceCents": 49000,
    "currency": "EUR",
    "durationHours": 40,
    "instructorProfiles": [ /* ... */ ],
    "accreditation": { /* ... */ }
  },
  "levels": [
    {
      "_id": "level_1_zaklady",
      "orderIndex": 1,
      "slug": "zaklady",
      "title": "Základy",
      "subtitle": "Pre tých, ktorí začínajú s riadením klubu",
      "estimatedHours": 7.5,
      "topicSequencing": "flexible",
      "issuesIntermediateCertificate": false,
      "topicCount": 10,
      "topics": [
        {
          "_id": "topic_1_1",
          "slug": "prostredie-sportu",
          "title": "Prostredie športu a jeho účastníci",
          "iconName": "landmark",
          "moduleId": "module_1_1",
          "moduleEstimatedMinutes": 60
        }
        // ... 10 tém spolu
      ]
    }
    // ... 4 levels spolu
  ],
  "enrollment": null
}
```

> Ak je session aktívna a študent má enrollment, `enrollment` obsahuje `state`, `currentLevelId` a tlačový-friendly stav postupu.

### `GET /api/courses/:slug/preview`

Krátky preview prvých 1–2 časti pre **neprihlásených návštevníkov** (marketing — „pozri ako vyzerá kurz"). Vracia limited content blocks (text áno, video s preview signed URL maximálne 60 sec).

**Auth:** žiadna
**Rate limit:** 30/min/IP

**Response 200:** rovnaký formát ako `parts` route, ale `videoBlock.muxPlaybackId` je nahradený `previewPlaybackId` (10–60 sec preview).

## Endpointy pre prihlásených študentov

### `GET /api/courses/:slug/learn`

Detail kurzu s **odomknutým obsahom** podľa progressu študenta.

**Auth:** session, aktívny enrollment na danom kurze
**Response 200:**

```json
{
  "course": { /* ... */ },
  "enrollment": {
    "_id": "...",
    "state": "active",
    "enrolledAt": "2026-09-15T14:23:00Z",
    "currentLevelId": "level_1_zaklady"
  },
  "progress": {
    "currentLevelId": "level_1_zaklady",
    "completedModules": 3,
    "totalModules": 40,
    "completedLevels": 0,
    "totalLevels": 4,
    "lastActivityAt": "2026-09-17T09:15:00Z"
  },
  "levels": [
    {
      "_id": "level_1_zaklady",
      "title": "Základy",
      "state": "in_progress",
      "topics": [
        {
          "_id": "topic_1_1",
          "title": "Prostredie športu a jeho účastníci",
          "module": {
            "_id": "module_1_1",
            "state": "completed",
            "completedAt": "2026-09-15T15:30:00Z"
          }
        }
        // ...
      ]
    }
    // ...
  ]
}
```

### `GET /api/parts/:id`

Detail časti s content blocks. Pre `videoBlock` server vygeneruje signed Mux playback URL.

**Auth:** session, aktívny enrollment na rodičovskom kurze, časť musí byť v `state: 'available' | 'in_progress' | 'completed'` (nie `locked`)

**Response 200:**

```json
{
  "_id": "part_1_4_1",
  "slug": "uvod-do-financovania",
  "title": "Úvod do financovania",
  "summary": "Prehľad zdrojov a princípov financovania klubu.",
  "module": {
    "_id": "module_1_4",
    "title": "Financovanie športu — Základy",
    "topicTitle": "Financovanie športu",
    "levelTitle": "Základy"
  },
  "contentBlocks": [
    {
      "id": "block_1",
      "type": "text",
      "markdown": "# Prečo je financovanie kľúčové..."
    },
    {
      "id": "block_2",
      "type": "video",
      "muxPlaybackId": "xyz456",
      "playbackUrl": "https://stream.mux.com/xyz456.m3u8?token=eyJhbGc...",
      "playbackUrlExpiresAt": "2026-09-17T15:00:00Z",
      "durationSec": 1080,
      "transcript": "[00:00] Vitajte v module...",
      "posterUrl": "https://image.mux.com/xyz456/thumbnail.jpg?time=5",
      "chapters": [
        { "title": "Úvod", "startSec": 0 }
      ]
    },
    {
      "id": "block_3",
      "type": "presentation",
      "pdfUrl": "https://cdn.clubup.sk/...?signature=...",
      "slideCount": 12
    }
  ],
  "attachments": [
    {
      "name": "Pracovný list — financovanie.pdf",
      "url": "https://cdn.clubup.sk/...?signature=...",
      "sizeBytes": 245000,
      "mimeType": "application/pdf"
    }
  ],
  "prerequisites": [],
  "partTest": {
    "id": "test_part_1_4_1",
    "required": false,
    "available": true
  },
  "progress": {
    "state": "in_progress",
    "blockProgress": [
      { "blockId": "block_1", "state": "completed" },
      { "blockId": "block_2", "state": "in_progress", "secondsWatched": 240, "totalSeconds": 1080 }
    ]
  }
}
```

### `GET /api/parts/:id/playback-url`

Refresh signed Mux URL pre konkrétny video block (po expirácii).

**Auth:** session, aktívny enrollment
**Response 200:**

```json
{
  "blockId": "block_2",
  "playbackUrl": "https://stream.mux.com/xyz456.m3u8?token=...",
  "expiresAt": "2026-09-17T20:00:00Z"
}
```

### `POST /api/parts/:id/progress` (Server Action ekvivalent)

Update progress pre block alebo celú časť. Volá sa zo študentskej UI pri:

- Dokončenie video block (`completionRatio >= 0.9`)
- „Označiť ako prečítané" pre text/image
- Manuálne „Označiť ako dokončené"

**Auth:** session, aktívny enrollment
**Body:**

```json
{
  "blockId": "block_2",
  "state": "completed",
  "secondsWatched": 1080
}
```

ALEBO pre celú časť:

```json
{
  "markPartCompleted": true
}
```

**Response 200:**

```json
{
  "ok": true,
  "partState": "completed",
  "moduleCompleted": false,
  "unlockedParts": ["part_1_4_2", "part_1_4_3"]
}
```

Ak sa dokončením časti dokončí modul/level/kurz, server vráti aj tieto eventy:

```json
{
  "ok": true,
  "partState": "completed",
  "moduleCompleted": true,
  "moduleId": "module_1_4",
  "levelCompleted": false,
  "unlockedTopics": ["topic_1_5"]
}
```

## Test endpointy

### `POST /api/tests/:id/attempts`

Spustí nový pokus o test. Vygeneruje konkrétne otázky podľa `selectionMode` a uloží `TestAttempt`.

**Auth:** session, aktívny enrollment
**Idempotency-Key:** vyžadované
**Body:** prázdne

**Response 201:**

```json
{
  "attemptId": "...",
  "test": {
    "_id": "test_module_1_4",
    "title": "Záverečný test — Financovanie športu (Základy)",
    "description": "10 otázok pokrývajúcich obsah modulu. Na úspešné absolvovanie potrebuješ 70 %.",
    "passingScore": 0.7,
    "timeLimitSec": 1200
  },
  "questions": [
    {
      "id": "q1",
      "type": "single_choice",
      "text": "Aký je hlavný zdroj verejných financií pre šport na Slovensku?",
      "weight": 1,
      "answers": [
        { "id": "a1", "text": "PUŠ — Príspevok uznaného športu" },
        { "id": "a2", "text": "Lotériový zákon" },
        { "id": "a3", "text": "EUROFONDY" },
        { "id": "a4", "text": "PUDOL" }
      ]
    }
    // ... ďalšie otázky v poradí pre tohto študenta
  ],
  "startedAt": "2026-09-18T14:00:00Z",
  "deadline": "2026-09-18T14:20:00Z"
}
```

> Pozn.: `answers` sú v poradí, ako ich má študent vidieť (po `randomizeAnswerOrder`). `correct` flag NIE JE v response — overuje sa len server-side po submite.

**Možné chyby:**

- `409 max_attempts_reached` — študent dosiahol `Test.maxAttempts`
- `409 cooldown_active` — od posledného pokusu neuplynul `Test.cooldownMinutes`
- `403 prerequisites_not_met` — chýba dokončenie predošlej Časti/Modulu

### `POST /api/tests/:id/attempts/:attemptId/submit`

Submit pokusu. Server vyhodnotí a vráti score.

**Auth:** session, vlastník attemptu
**Idempotency-Key:** vyžadované (zabráni double-submit)
**Body:**

```json
{
  "answers": [
    { "questionId": "q1", "selectedAnswerIds": ["a1"] },
    { "questionId": "q2", "selectedAnswerIds": ["a3", "a5"] },
    { "questionId": "q3", "textAnswer": "PUŠ" }
  ]
}
```

**Response 200:**

```json
{
  "attemptId": "...",
  "score": 0.85,
  "passed": true,
  "passingScore": 0.7,
  "correctCount": 9,
  "totalCount": 10,
  "submittedAt": "2026-09-18T14:18:00Z",
  "results": [
    {
      "questionId": "q1",
      "isCorrect": true,
      "pointsEarned": 1,
      "explanation": "PUŠ je hlavný štátny dotačný mechanizmus..."
    }
    // ... ak Test.showAnswersAfter to povolí
  ],
  "downstream": {
    "partCompleted": false,
    "moduleCompleted": true,
    "moduleId": "module_1_4",
    "levelCompleted": false,
    "courseCompleted": false,
    "intermediateCertificateIssued": false,
    "finalCertificateIssued": false
  }
}
```

Ak by submit prešiel `Course-test`, `downstream.finalCertificateIssued: true` a frontend redirektuje na detail certifikátu.

### `GET /api/tests/:id/attempts`

História pokusov študenta na danom teste.

**Auth:** session, aktívny enrollment
**Response 200:**

```json
{
  "attempts": [
    { "attemptId": "...", "attemptNumber": 1, "score": 0.6, "passed": false, "submittedAt": "..." },
    { "attemptId": "...", "attemptNumber": 2, "score": 0.85, "passed": true, "submittedAt": "..." }
  ],
  "remaining": 1,
  "maxAttempts": 3
}
```

## Admin endpointy

### `GET /api/admin/courses`

Zoznam kurzov vrátane `draft` a `archived`.

**Auth:** session s `content_manager` alebo `admin` rolou

### `POST /api/admin/courses`

Vytvorí draft kurzu.

**Auth:** `content_manager`+
**Body:**

```json
{
  "slug": "novy-kurz",
  "title": "Nový kurz",
  "shortDescription": "...",
  "priceCents": 30000,
  "currency": "EUR"
}
```

### `PATCH /api/admin/courses/:id`

Update draft. Po `state: published` sa už nedá upravovať — treba vytvoriť novú verziu.

### `POST /api/admin/courses/:id/publish`

Publish (state → published). Validuje, že kurz má aspoň 1 Level, každý Level aspoň 1 Topic, každá Topic 1 Module, každý Module aspoň 1 Part atď.

**Auth:** `admin`
**Response 200:** `{ "ok": true, "publishedAt": "..." }`
**Response 422:** `{ "error": "validation", "details": [...] }`

### `POST /api/admin/courses/:id/new-version`

Vytvorí novú verziu kurzu (klonuje všetky Levels, Topics, Modules, Parts, Tests).

**Auth:** `content_manager`+
**Response 201:** `{ "newCourseId": "...", "version": 2 }`

### CRUD pre Levels / Topics / Modules / Parts / Tests / Questions

| Operácia | Endpoint | Auth |
|---|---|---|
| Vytvoriť Level | `POST /api/admin/courses/:courseId/levels` | content_manager+ |
| Update Level | `PATCH /api/admin/levels/:id` | content_manager+ |
| Delete Level | `DELETE /api/admin/levels/:id` | admin |
| Vytvoriť Topic | `POST /api/admin/levels/:levelId/topics` | content_manager+ |
| Vytvoriť Module | `POST /api/admin/topics/:topicId/module` | content_manager+ |
| Vytvoriť Part | `POST /api/admin/modules/:moduleId/parts` | content_manager+ |
| Reorder Parts | `PUT /api/admin/modules/:moduleId/parts/order` | content_manager+ |
| Vytvoriť Test | `POST /api/admin/tests` | content_manager+ |
| Vytvoriť Question | `POST /api/admin/tests/:testId/questions` | content_manager+ |
| Move Question medzi testami | `PUT /api/admin/questions/:id/move` | content_manager+ |

Detaily payload-ov sa odvodzujú zo schém v [`../domain/`](../domain/) a sú generované do OpenAPI spec.

### Mux Direct Upload

Pre nahrávanie videí pre Part:

`POST /api/admin/uploads/video`

**Auth:** `content_manager`+
**Response 201:**

```json
{
  "uploadId": "abc123",
  "uploadUrl": "https://storage.googleapis.com/...",
  "expiresAt": "2026-09-18T16:00:00Z"
}
```

Klient potom uploaduje súbor priamo na `uploadUrl` (pas-through, žiaden Vercel bandwidth). Po dokončení Mux pošle webhook (viď `webhooks.md`).
