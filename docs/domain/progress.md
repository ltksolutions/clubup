# Progress

Postup študenta v kurze. 1:1 vzťah s `Enrollment`.

## Schéma

| Pole | Typ | Required | Popis |
|---|---|---|---|
| `_id` | ObjectId | ✓ | |
| `enrollmentId` | ObjectId | ✓ | |
| `studentId` | string | ✓ | denormalizované (`sportup_person_id`) |
| `courseId` | ObjectId | ✓ | denormalizované |
| `currentLevelId` | ObjectId | – | Aktuálny Level, na ktorom študent pracuje |
| `partProgress` | PartProgress[] | ✓ | Záznamy per časť |
| `moduleCompletions` | ModuleCompletion[] | ✓ | Záznamy per modul (po prejdení Module-testu, ak je required) |
| `levelCompletions` | LevelCompletion[] | ✓ | Záznamy per úroveň (po prejdení Level-testu, ak je required) |
| `testAttempts` | ObjectId[] | – | Odkazy na všetky `TestAttempt` dokumenty |
| `courseCompleted` | boolean | ✓ | `true` po dokončení celého kurzu |
| `courseCompletedAt` | Date | – | |
| `lastActivityAt` | Date | ✓ | Pre dashboard, neaktívnych študentov upozorniť |
| `createdAt` | Date | ✓ | |
| `updatedAt` | Date | ✓ | |

```ts
type PartProgress = {
  partId: ObjectId;
  moduleId: ObjectId;            // denormalized pre rýchle agregácie
  state: 'locked' | 'available' | 'in_progress' | 'completed';
  startedAt?: Date;
  completedAt?: Date;
  
  // Pre content blocks tracking
  blockProgress?: BlockProgress[];
  
  // Pre Part-test (ak je definovaný)
  partTestAttemptId?: ObjectId;
  partTestPassed?: boolean;
};

type BlockProgress = {
  blockId: string;               // ContentBlock.id
  type: 'text' | 'image' | 'video' | 'audio' | 'presentation' | 'pdf' | 'webinar' | 'embed';
  state: 'not_started' | 'in_progress' | 'completed';
  
  // Pre video/audio
  secondsWatched?: number;
  totalSeconds?: number;
  completionRatio?: number;       // 0..1
  
  // Pre webinar
  webinarAttended?: boolean;
  webinarAttendanceMin?: number;
};

type ModuleCompletion = {
  moduleId: ObjectId;
  levelId: ObjectId;             // denormalized
  completedAt: Date;
  moduleTestAttemptId?: ObjectId;  // null ak modul nemá test
  moduleTestScore?: number;        // 0..1
};

type LevelCompletion = {
  levelId: ObjectId;
  completedAt: Date;
  levelTestAttemptId?: ObjectId;   // null ak level nemá test
  levelTestScore?: number;         // 0..1
  intermediateCertificateId?: ObjectId; // ak Level.issuesIntermediateCertificate
};
```

## Indexy

```ts
db.progress.createIndex({ enrollmentId: 1 }, { unique: true });
db.progress.createIndex({ studentId: 1, lastActivityAt: -1 });
db.progress.createIndex({ courseId: 1, courseCompleted: 1 });
db.progress.createIndex({ 'partProgress.partId': 1 });
db.progress.createIndex({ 'levelCompletions.levelId': 1 });
db.progress.createIndex({ currentLevelId: 1 });
```

## Pravidlá

### Pre-allocation pri vzniku enrollmentu

Pri vytvorení `Enrollment` sa rovno pre-vyplní:

- `partProgress[]` so všetkými časťami kurzu (state = `locked` alebo `available` podľa pravidiel nižšie)
- `moduleCompletions[]` ako prázdne pole
- `levelCompletions[]` ako prázdne pole
- `currentLevelId` = ID prvého Levelu (Level 1)

Toto je rýchlejšie pri update-och, ktoré sú časté.

### Stav `state` na PartProgress

- **`locked`** — Časť nie je prístupná. Dôvody:
  - Patrí do Levelu, ktorý ešte nie je odomknutý (predošlý Level nedokončený)
  - Patrí do Topic, ktorý ešte nie je odomknutý (`Level.topicSequencing: 'sequential'` a predošlá Téma nedokončená)
  - Má `prerequisites[]`, ktoré ešte nie sú dokončené
- **`available`** — Časť je dostupná, študent ju ešte nezačal
- **`in_progress`** — Študent začal aspoň jeden block
- **`completed`** — Všetky `requiredForCompletion: true` blocks sú completed + Part-test prejdený (ak je required)

### Detekcia dokončenia časti

Časť ide do `state: completed`, keď:

1. Všetky bloky sú v stave `completed`:
   - **Video / Audio** — `completionRatio >= 0.9` ALEBO študent klikne „označiť ako dokončené"
   - **Text / Image / PDF** — explicitné „mark as done" (môže byť aj timer „min. 30 sec na bloku")
   - **Presentation** — automaticky po prechode všetkých slidov
   - **Webinar** — attendance ≥ 50 % trvania alebo zhliadnutie záznamu
2. Ak `Part.partTestRequired: true`, `partTestPassed: true`

### Detekcia dokončenia modulu

Modul ide do `moduleCompletions[]`, keď:

1. Všetky `Part.requiredForCompletion: true` v module sú `state: completed`, **A**
2. Ak `Module.moduleTestRequired: true`, študent prešiel `Module-test`

### Detekcia dokončenia úrovne

Level ide do `levelCompletions[]`, keď:

1. Všetky moduly v Level sú dokončené (v `moduleCompletions[]`), **A**
2. Ak `Level.levelTestRequired: true`, študent prešiel `Level-test`

Po dokončení levelu:

- Server odomkne časti v ďalšom Level (zmena `state` z `locked` na `available`)
- `currentLevelId` sa posunie na ďalší Level
- Ak `Level.issuesIntermediateCertificate: true`, spustí sa proces vydania intermediate certifikátu

### Detekcia dokončenia kurzu

Kurz ide do `courseCompleted: true`, keď:

1. Všetky Levels sú dokončené (v `levelCompletions[]`), **A**
2. Ak `Course.courseTestRequired: true`, študent prešiel `Course-test`

Po dokončení kurzu sa spustí proces vydania `final` certifikátu (od ŽU).

## Triggers

- **Update PartProgress.state → completed**:
  - Re-evaluuj všetky downstream Parts s prerequisites obsahujúcimi tento Part — zmeň `locked → available` pre tie, ktoré majú všetky prerequisites splnené
  - Re-evaluuj Module — ak sú všetky `requiredForCompletion: true` Parts done a Module-test sa nevyžaduje (alebo je už passed), pridaj do `moduleCompletions[]`
- **Update moduleCompletions** → trigger Level evaluation (rovnaký princíp)
- **Update levelCompletions** → trigger Course evaluation + ak intermediate cert, spusť issue process
- **`courseCompleted: true`** → vyvoláva sa async úloha `issueFinalCertificate(enrollmentId)`
- **30 dní bez aktivity** → email pripomienka („Nezabudni dokončiť kurz...")
- **90 dní bez aktivity** → email „Pomôžeme ti?" + link na podporu

## Príklad — študent v polovici Level 1

```json
{
  "_id": "ObjectId('progress_1')",
  "enrollmentId": "ObjectId('enrollment_1')",
  "studentId": "sportup_person_id_123",
  "courseId": "ObjectId('course_sportovy_manazment')",
  "currentLevelId": "ObjectId('level_1_zaklady')",
  "partProgress": [
    {
      "partId": "ObjectId('part_1_4_1')",
      "moduleId": "ObjectId('module_1_4')",
      "state": "completed",
      "startedAt": "2026-09-16T08:00:00Z",
      "completedAt": "2026-09-16T08:25:00Z",
      "blockProgress": [
        { "blockId": "block_1", "type": "text", "state": "completed" },
        { "blockId": "block_2", "type": "video", "state": "completed", "secondsWatched": 1080, "totalSeconds": 1080, "completionRatio": 1.0 },
        { "blockId": "block_3", "type": "text", "state": "completed" }
      ]
    },
    {
      "partId": "ObjectId('part_1_4_2')",
      "moduleId": "ObjectId('module_1_4')",
      "state": "in_progress",
      "startedAt": "2026-09-17T09:00:00Z",
      "blockProgress": [
        { "blockId": "b1", "type": "text", "state": "completed" },
        { "blockId": "b2", "type": "video", "state": "in_progress", "secondsWatched": 320, "totalSeconds": 720, "completionRatio": 0.44 }
      ]
    },
    {
      "partId": "ObjectId('part_1_4_3')",
      "moduleId": "ObjectId('module_1_4')",
      "state": "locked"
    }
    // ... ďalšie parts
  ],
  "moduleCompletions": [
    {
      "moduleId": "ObjectId('module_1_1')",
      "levelId": "ObjectId('level_1_zaklady')",
      "completedAt": "2026-09-15T15:30:00Z",
      "moduleTestAttemptId": "ObjectId('attempt_1')",
      "moduleTestScore": 0.85
    },
    {
      "moduleId": "ObjectId('module_1_2')",
      "levelId": "ObjectId('level_1_zaklady')",
      "completedAt": "2026-09-16T17:00:00Z",
      "moduleTestAttemptId": "ObjectId('attempt_2')",
      "moduleTestScore": 0.90
    },
    {
      "moduleId": "ObjectId('module_1_3')",
      "levelId": "ObjectId('level_1_zaklady')",
      "completedAt": "2026-09-17T08:30:00Z",
      "moduleTestAttemptId": "ObjectId('attempt_3')",
      "moduleTestScore": 0.75
    }
    // ... ešte 7 modulov v Level 1 čaká
  ],
  "levelCompletions": [],
  "testAttempts": [
    "ObjectId('attempt_1')",
    "ObjectId('attempt_2')",
    "ObjectId('attempt_3')"
  ],
  "courseCompleted": false,
  "lastActivityAt": "2026-09-17T09:15:00Z",
  "createdAt": "2026-09-14T14:23:00Z",
  "updatedAt": "2026-09-17T09:15:00Z"
}
```
