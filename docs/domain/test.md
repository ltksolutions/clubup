# Test & Question

Testy môžu byť na **4 miestach v hierarchii kurzu** — v Časti, Module, Úrovni alebo na Course-leveli ako záverečný test.

## Placement (umiestnenie testu)

| Placement | Účel | Povinnosť | Dôsledok |
|---|---|---|---|
| `part` | Overí pochopenie konkrétnej časti pred prechodom | Voliteľný | Bez prejdenia sa časť nepokladá za dokončenú (ak `Part.partTestRequired: true`) |
| `module` | Záverečný test modulu | Voliteľný | Bez prejdenia sa modul nepokladá za dokončený (ak `Module.moduleTestRequired: true`) |
| `level` | „Medzicertifikát" — overuje celý Level | Voliteľný | Po prejdení sa odomyká ďalší Level; ak `Level.issuesIntermediateCertificate: true`, vydá sa intermediate certifikát |
| `course` | Záverečný test celého kurzu | Voliteľný | Po prejdení sa vydá `final` certifikát od ŽU |

**Princíp:** Test je **samostatná entita**, nie embedded. Toto umožňuje:

- Versioning testu nezávisle od entity (Module, Level, …)
- Zdieľanie testu (zriedkavé, ale možné)
- Jednotnú prácu s test attempts a question banks

## Generovanie otázok (selectionMode)

Pri každom pokuse sa otázky pre konkrétneho študenta generujú podľa **`selectionMode`**:

### `fixed`

Test má **fixnú sadu otázok**. Všetci študenti dostanú **rovnakú sadu**, ale:

- **Poradie otázok** sa zamieša pre každého (ak `randomizeQuestionOrder: true`, default)
- **Poradie odpovedí v rámci otázky** sa zamieša pre každého (ak `randomizeAnswerOrder: true`, default)

### `random_sample`

Test má **bank otázok** (napr. 50 otázok). Pre každý pokus sa **náhodne vyberie podmnožina** podľa pravidiel:

- `bankSelection.totalCount` — koľko otázok dostane študent (napr. 20 z 50)
- `bankSelection.byTag` (voliteľne) — váhované rozdelenie podľa tagov (napr. „5 otázok z `tag:financovanie`, 5 z `tag:právne`, 10 zo zvyšku")
- Plus rovnaké zamiešanie poradia otázok aj odpovedí

## Schéma — Test

| Pole | Typ | Required | Popis |
|---|---|---|---|
| `_id` | ObjectId | ✓ | |
| `placement` | enum | ✓ | `part`, `module`, `level`, `course` |
| `placementOwnerId` | ObjectId | – | Referencia na Part/Module/Level/Course (denormalizované pre rýchle lookups). Test môže byť aj „voľný" (nepriradený), ale typicky má ownera. |
| `courseId` | ObjectId | ✓ | Course, ku ktorému patrí (denormalizované) |
| `title` | string | ✓ | |
| `description` | string | – | Inštrukcie pred testom (Markdown) |
| `selectionMode` | enum | ✓ | `fixed` alebo `random_sample` |
| `fixedQuestions` | ObjectId[] | ✓ (ak fixed) | Otázky v `fixed` móde (poradie sa použije ak `randomizeQuestionOrder: false`) |
| `bankQuestions` | ObjectId[] | ✓ (ak random_sample) | Pool otázok pre random sampling |
| `bankSelection` | BankSelection | – (random_sample) | Pravidlá výberu z banku |
| `randomizeQuestionOrder` | boolean | ✓ | Default `true` |
| `randomizeAnswerOrder` | boolean | ✓ | Default `true` |
| `passingScore` | number | ✓ | `0–1`, default `0.7` |
| `timeLimitSec` | number | – | Časový limit; null = neobmedzene |
| `maxAttempts` | number | – | Max. počet pokusov; null = neobmedzene |
| `cooldownMinutes` | number | – | Minimálny čas medzi pokusmi (default 0) |
| `showAnswersAfter` | enum | ✓ | `never`, `after_pass`, `after_each_attempt` |
| `version` | number | ✓ | |
| `createdAt` | Date | ✓ | |
| `updatedAt` | Date | ✓ | |

### `BankSelection` (sub-typ)

```ts
type BankSelection = {
  totalCount: number;                // celkový počet otázok pre študenta (napr. 20)
  byTag?: BankSelectionByTag[];      // voliteľné váhované rozdelenie podľa tagov
};

type BankSelectionByTag = {
  tag: string;                       // napr. "financovanie"
  count: number;                     // koľko otázok z tohto tagu (napr. 5)
};
```

**Pravidlá:**

- Súčet `byTag[].count` musí byť `<= totalCount`
- Zvyšok (`totalCount - sum(byTag[].count)`) sa náhodne dopĺňa z otázok, ktoré nepatria do žiadneho z `byTag` tagov
- Ak v banku nie je dosť otázok pre tag, test sa pri pokuse vyhodnotí ako error a admin dostane notifikáciu

## Schéma — Question

| Pole | Typ | Required | Popis |
|---|---|---|---|
| `_id` | ObjectId | ✓ | |
| `testId` | ObjectId | – | Test, ku ktorému patrí (ak je viazaná na konkrétny test). Môže byť null, ak je otázka v zdieľanej question bank |
| `bankId` | ObjectId | – | Alternatíva k `testId` — viazaná na zdieľanú banku otázok (Question Bank module, viď nižšie) |
| `courseId` | ObjectId | ✓ | Denormalized |
| `orderIndex` | number | ✓ | Použité pri `fixed` mode bez randomizácie |
| `type` | enum | ✓ | `single_choice`, `multiple_choice`, `true_false`, `short_text` |
| `text` | string | ✓ | Text otázky (Markdown) |
| `imageUrl` | string | – | Voliteľný obrázok |
| `weight` | number | ✓ | Váha otázky (default `1`) |
| `answers` | Answer[] | ✓ (single/multi/TF) | |
| `expectedText` | string | ✓ (short_text) | Akceptovaná odpoveď (case-insensitive, normalized) |
| `expectedTextAlternatives` | string[] | – (short_text) | Ďalšie akceptované formy |
| `explanation` | string | – | Vysvetlenie správnej odpovede (zobrazí sa po teste, ak `Test.showAnswersAfter` povolí) |
| `tags` | string[] | – | Pre `random_sample` výber a štatistiky |
| `difficulty` | enum | – | `easy`, `medium`, `hard` (pre filtrovanie a štatistiky) |
| `createdAt` | Date | ✓ | |
| `updatedAt` | Date | ✓ | |

```ts
type Answer = {
  id: string;          // stable ID v rámci otázky (UUID alebo nanoid)
  text: string;        // text odpovede (Markdown)
  isCorrect: boolean;  // pre single_choice presne 1 true; pre multiple_choice 1+
};
```

## Question Banks (otázkové banky)

V neskoršej fáze môžu otázky existovať aj **mimo konkrétneho testu** — v zdieľaných **Question Banks**:

- Question Bank je **kolekcia otázok** so spoločnými tagmi (napr. „Financovanie — všetky otázky")
- Test s `selectionMode: random_sample` môže odkazovať na **bank** namiesto explicitného `bankQuestions[]`
- Pri pokuse sa `random_sample` aplikuje na otázky z banky filtrované podľa `BankSelection`

**MVP**: Question Banks ako samostatná feature **nie sú v MVP** — v MVP sú otázky `bankQuestions[]` field na Test entite. Question Banks sa pridajú v Fáze 5 (multi-tenant CMS pre kurzy).

## Indexy

```ts
db.tests.createIndex({ courseId: 1 });
db.tests.createIndex({ placement: 1, placementOwnerId: 1 });
db.questions.createIndex({ testId: 1, orderIndex: 1 });
db.questions.createIndex({ bankId: 1 });
db.questions.createIndex({ courseId: 1, tags: 1 });
db.questions.createIndex({ courseId: 1, difficulty: 1 });
```

## TestAttempt — pokus študenta

Každý pokus o test je samostatný dokument:

| Pole | Typ | Popis |
|---|---|---|
| `_id` | ObjectId | |
| `testId` | ObjectId | |
| `enrollmentId` | ObjectId | |
| `studentId` | string | denormalizované (`sportup_person_id`) |
| `courseId` | ObjectId | denormalizované |
| `attemptNumber` | number | poradie pokusu pre tohto študenta |
| `selectedQuestionIds` | ObjectId[] | **konkrétne** otázky vybrané pre tento pokus (po `random_sample` alebo `fixed`) |
| `questionOrder` | string[] | poradie zobrazenia otázok — pole question IDs v poradí |
| `answerOrders` | Record<string, string[]> | per-question poradie answer IDs (pre randomized) |
| `startedAt` | Date | |
| `submittedAt` | Date | |
| `timeSpentSec` | number | |
| `answers` | SubmittedAnswer[] | odpovede študenta |
| `score` | number | `0–1`, vážený podľa `Question.weight` |
| `passed` | boolean | |
| `idempotencyKey` | string (unique) | `enrollmentId:testId:attemptNumber` — bráni duplicate submitom |

```ts
type SubmittedAnswer = {
  questionId: ObjectId;
  selectedAnswerIds?: string[];   // single/multiple
  textAnswer?: string;             // short_text
  isCorrect: boolean;
  pointsEarned: number;            // Question.weight × correctness
};
```

### Kľúčové: zachovanie poradia pre forenznú analýzu

`TestAttempt` ukladá **presné poradie**, v ktorom študent videl otázky aj odpovede:

- `questionOrder: string[]` — poradie zobrazenia otázok (pole question IDs)
- `answerOrders: Record<string, string[]>` — per-question poradie answer IDs

Toto má 3 dôvody:

1. **Reprodukovateľnosť** — pri spore vie admin presne ukázať, ako test vyzeral pre konkrétneho študenta
2. **Vyhodnotenie** — server musí vedieť, ktorá pozícia v poradí korešponduje ktorej odpovedi (klient pošle „vybral som 3. odpoveď"; server musí zistiť, ktorá odpoveď to bola podľa `answerOrders`)
3. **Audit** — pri reklamácii vie admin overiť, že študent skutočne videl konkrétnu otázku v konkrétnom poradí

## Algoritmus generovania pokusu

Pri kliku „Spustiť test" server vykoná:

```ts
async function startAttempt(testId: ObjectId, enrollmentId: ObjectId): Promise<TestAttempt> {
  const test = await loadTest(testId);
  const previousAttempts = await countAttempts(testId, enrollmentId);
  
  // 1. Validácie
  if (test.maxAttempts && previousAttempts >= test.maxAttempts) {
    throw new Error('max_attempts_reached');
  }
  if (test.cooldownMinutes) {
    const lastAttempt = await getLastAttempt(testId, enrollmentId);
    if (lastAttempt && minutesSince(lastAttempt.submittedAt) < test.cooldownMinutes) {
      throw new Error('cooldown_active');
    }
  }
  
  // 2. Výber otázok
  let selectedQuestionIds: ObjectId[];
  if (test.selectionMode === 'fixed') {
    selectedQuestionIds = [...test.fixedQuestions];
  } else {
    selectedQuestionIds = sampleFromBank(test.bankQuestions, test.bankSelection);
  }
  
  // 3. Randomizácia poradia otázok
  const questionOrder = test.randomizeQuestionOrder
    ? shuffle(selectedQuestionIds)
    : selectedQuestionIds;
  
  // 4. Randomizácia poradia odpovedí
  const answerOrders: Record<string, string[]> = {};
  for (const qId of questionOrder) {
    const question = await loadQuestion(qId);
    if (question.answers && test.randomizeAnswerOrder) {
      answerOrders[qId.toString()] = shuffle(question.answers.map((a) => a.id));
    } else if (question.answers) {
      answerOrders[qId.toString()] = question.answers.map((a) => a.id);
    }
  }
  
  // 5. Vytvor TestAttempt
  return await createTestAttempt({
    testId,
    enrollmentId,
    studentId: ...,
    attemptNumber: previousAttempts + 1,
    selectedQuestionIds,
    questionOrder,
    answerOrders,
    startedAt: new Date(),
    idempotencyKey: `${enrollmentId}:${testId}:${previousAttempts + 1}`,
  });
}

function sampleFromBank(bank: ObjectId[], rules: BankSelection): ObjectId[] {
  // 1. Načítaj questions z banku s tags
  const questions = await loadQuestionsWithTags(bank);
  const result: ObjectId[] = [];
  
  // 2. Pre každý byTag rule náhodne vyber count otázok
  const usedIds = new Set<string>();
  for (const rule of rules.byTag ?? []) {
    const candidates = questions.filter((q) => 
      q.tags?.includes(rule.tag) && !usedIds.has(q._id.toString())
    );
    const sampled = shuffle(candidates).slice(0, rule.count);
    if (sampled.length < rule.count) {
      throw new Error(`not_enough_questions_for_tag: ${rule.tag}`);
    }
    sampled.forEach((q) => { result.push(q._id); usedIds.add(q._id.toString()); });
  }
  
  // 3. Doplň zvyšok náhodne z untagged
  const remaining = rules.totalCount - result.length;
  if (remaining > 0) {
    const candidates = questions.filter((q) => !usedIds.has(q._id.toString()));
    const sampled = shuffle(candidates).slice(0, remaining);
    if (sampled.length < remaining) {
      throw new Error('not_enough_questions_in_bank');
    }
    sampled.forEach((q) => { result.push(q._id); });
  }
  
  return result;
}
```

## Indexy `test_attempts`

```ts
db.test_attempts.createIndex({ enrollmentId: 1, testId: 1, attemptNumber: 1 }, { unique: true });
db.test_attempts.createIndex({ idempotencyKey: 1 }, { unique: true });
db.test_attempts.createIndex({ studentId: 1, submittedAt: -1 });
db.test_attempts.createIndex({ testId: 1, passed: 1 });   // pre štatistiky
```

## Pravidlá

- **Test je možné submit-núť len raz pre daný `attemptNumber`** — `idempotencyKey` zabezpečuje cez unique index
- Pri prejdení (`passed: true`) sa v `Progress` označí Part/Module/Level/Course ako dokončený podľa `placement`
- Pri `course` placement + passed → spustí sa proces vydania `final` certifikátu
- Pri `level` placement + passed + `Level.issuesIntermediateCertificate: true` → vydá sa `intermediate` certifikát
- Pri `maxAttempts` exceedance UI zablokuje ďalší pokus; admin môže manuálne resetnúť cez Server Action s audit logom

## UX prísnosť

- **Auto-save partial answers** každých 30 sec, aby pri náhodnom zatvorení záložky študent mohol pokračovať
- **Pri `timeLimitSec`** — countdown na klientovi + server-side enforcement (server nepríjme submit po `startedAt + timeLimitSec + 10s` buffer)
- **Žiadny content-blocking** (back tlačítko prehliadača neprerušuje test) — len soft warning, lebo aggressive blocking nie je accessibility-friendly
- **Žiadny copy-paste blocking** — neúčinné voči motivovaným podvodníkom, otravné pre čestných

## Príklad — Module-test s fixed otázkami

```json
{
  "_id": "ObjectId('test_module_1_4')",
  "placement": "module",
  "placementOwnerId": "ObjectId('module_1_4')",
  "courseId": "ObjectId('course_sportovy_manazment')",
  "title": "Záverečný test — Financovanie športu (Základy)",
  "description": "10 otázok pokrývajúcich obsah modulu. Na úspešné absolvovanie potrebuješ 70 %.",
  "selectionMode": "fixed",
  "fixedQuestions": [
    "ObjectId('q1')", "ObjectId('q2')", "...10 otázok..."
  ],
  "randomizeQuestionOrder": true,
  "randomizeAnswerOrder": true,
  "passingScore": 0.7,
  "timeLimitSec": 1200,
  "maxAttempts": 3,
  "cooldownMinutes": 30,
  "showAnswersAfter": "after_pass",
  "version": 1,
  "createdAt": "2026-08-15T10:00:00Z",
  "updatedAt": "2026-09-01T08:00:00Z"
}
```

## Príklad — Level-test s random_sample z banky

```json
{
  "_id": "ObjectId('test_level_1')",
  "placement": "level",
  "placementOwnerId": "ObjectId('level_1')",
  "courseId": "ObjectId('course_sportovy_manazment')",
  "title": "Medzitest — Základy",
  "description": "20 otázok zo všetkých 10 tém Levelu. Náhodný výber z banky 100 otázok.",
  "selectionMode": "random_sample",
  "bankQuestions": [
    "...100 otázok IDs..."
  ],
  "bankSelection": {
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
  },
  "randomizeQuestionOrder": true,
  "randomizeAnswerOrder": true,
  "passingScore": 0.7,
  "timeLimitSec": 2400,
  "maxAttempts": 3,
  "cooldownMinutes": 60,
  "showAnswersAfter": "after_pass",
  "version": 1,
  "createdAt": "2026-08-15T10:00:00Z",
  "updatedAt": "2026-09-01T08:00:00Z"
}
```
