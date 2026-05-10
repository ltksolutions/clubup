# Versioning entít

> Ako spravujeme verzie kurzov a obsahu po publikovaní.

## Princíp

**Publikovaný obsah je nemenný.** Ak admin chce zmeniť kurz, ktorý má aktívne enrollmenty, **musí vytvoriť novú verziu**.

Toto je dôležité kvôli:

- **Reprodukovateľnosť testov** — študent, ktorý spravil test pred 6 mesiacmi, musí vidieť rovnaký výsledok aj dnes
- **Forenzná auditovateľnosť** — pri spore o validitu certifikátu vieme presne, aký obsah študent absolvoval
- **Akreditácia** — Žilinská univerzita schválila konkrétnu osnovu; jej úprava bez novej akreditácie by ohrozila platnosť certifikátu
- **Používateľská skúsenosť** — študent neuvidí náhle iné lekcie, iné testy v polovici kurzu

## Verziovanie sa týka

| Entita | Versionovaná | Prečo |
|---|---|---|
| `Course` | ✓ | Cena, štruktúra, akreditácia |
| `Level` | ✓ (cez Course) | Súčasť kurzu |
| `Topic` | ✓ (cez Course) | Súčasť kurzu |
| `Module` | ✓ (cez Course) | Súčasť kurzu |
| `Part` | ✓ (cez Course) | Obsah |
| `Test` | ✓ (cez Course) | Otázky, scoring |
| `Question` | ✓ (cez Course) | Pri zmene textu/odpovedí |
| `Webinar` | ✗ | Eventy v čase, neopakujú sa |
| `Enrollment` | ✗ | Drží referenciu na konkrétnu verziu Course |
| `Progress`, `Order`, `Payment`, `Certificate` | ✗ | Transakčné záznamy |

## Schéma

`Course` má pole `version: number` (1, 2, 3, ...) a `previousVersionId: ObjectId | null`:

```ts
{
  _id: ObjectId('...'),
  slug: 'sportovy-manazment',           // SLUG sa NEMENÍ
  version: 2,
  previousVersionId: ObjectId('...'),    // odkazuje na verziu 1
  state: 'published',
  publishedAt: ISODate('2027-03-15'),
  // ...
}
```

Každá nová verzia má **nový `_id`** a **rovnaký `slug`**. Verejné URL `clubup.sk/kurzy/sportovy-manazment` vždy ukazuje na **najnovšiu publikovanú verziu** (`state: 'published'`, najvyššie `version`).

## Lifecycle nového vydania

### Krok 1 — Vytvorenie draft verzie

Admin volá `POST /api/admin/courses/:id/new-version`. Server:

1. Načíta zdrojový Course (verziu 1)
2. **Klonuje** (deep copy) všetky podriadené entity:
   - Všetky `Level` → nové `_id`, ale `courseId` ukazuje na nový Course
   - Všetky `Topic` → nové `_id`
   - Všetky `Module` → nové `_id`
   - Všetky `Part` → nové `_id`, vrátane `contentBlocks[]` (s tými istými Mux playback IDs — video assety zdieľame)
   - Všetky `Test` → nové `_id`
   - Všetky `Question` → nové `_id`
3. Uchová **všetky reference v správnej hierarchii** (referencie po klonovaní ukazujú na klony, nie na originály)
4. Nastavuje `version: 2`, `previousVersionId: <pôvodný>`, `state: 'draft'`

```ts
async function createNewCourseVersion(sourceCourseId: ObjectId): Promise<ObjectId> {
  return withTransaction(async (session) => {
    const source = await findCourseById(sourceCourseId, { session });
    if (!source) throw new NotFound('course');
    
    const newCourseId = new ObjectId();
    
    // Map starých IDs na nové (pre reference)
    const idMap = new Map<string, ObjectId>();
    idMap.set(source._id.toString(), newCourseId);
    
    // Clone Levels
    const sourceLevels = await findLevelsByIds(source.levels, { session });
    for (const level of sourceLevels) {
      const newLevelId = new ObjectId();
      idMap.set(level._id.toString(), newLevelId);
      // ... clone topics, modules, parts, tests, questions
    }
    
    // Insert clones with remapped references
    await insertClonedEntities(idMap, { session });
    
    // Insert new Course with version + previousVersionId
    await insertCourse({
      _id: newCourseId,
      slug: source.slug,
      version: source.version + 1,
      previousVersionId: source._id,
      state: 'draft',
      // ... ostatné polia z source
    }, { session });
    
    return newCourseId;
  });
}
```

### Krok 2 — Editovanie draft

Admin upraví obsah cez existujúce admin endpointy. Editovanie funguje **len na drafts**.

### Krok 3 — Publikácia

Admin volá `POST /api/admin/courses/:newId/publish`. Server:

1. Validuje úplnosť kurzu (Levels, Topics, Modules, Parts, Tests)
2. Nastavuje `state: 'published'`, `publishedAt: now`
3. **Predošlú verziu archivuje**: `state: 'archived'`
4. Verejné URL teraz ukazuje na novú verziu

### Krok 4 — Existujúce enrollmenty

**Pôvodní študenti pokračujú v starej verzii.** Ich `Enrollment.courseId` ukazuje na verziu 1, a všetky súvisiace entity (Levels, Topics, ...) sú archived ale **nikdy nezmazané**.

Nové enrollmenty (vytvorené po publikácii v2) ukazujú na nový Course `_id`.

## Migrácia študentov medzi verziami

V základe **nepodporujeme automatickú migráciu**. Študent v1 ostáva v1 až do skončenia kurzu.

Voliteľne admin môže ponúknuť **dobrovoľnú migráciu**:

- Endpoint `POST /api/admin/enrollments/:id/migrate-to-version` (admin only)
- Zachová `Progress.partProgress[]` len pre Parts, ktoré majú stable identitu (matching slug + structural position)
- Zvyšok progressu sa stratí — študent musí časti opakovať
- Audit log zaznamená migráciu

V MVP nezavádzame UI pre migráciu — robí sa manuálne admin DB tooling-om pri výnimočných situáciách.

## TestAttempt referencie

`TestAttempt` ukladá **denormalizované otázky a odpovede** v čase pokusu (viď [`test.md`](test.md)). Vďaka tomu je výsledok pokusu **plne reprodukovateľný** aj keď admin neskôr edituje znenie otázky v novej verzii Course.

```ts
type TestAttempt = {
  // ...
  questionSnapshots: Array<{
    questionId: ObjectId;        // referencia na pôvodnú otázku (môže byť archived)
    text: string;                 // znenie v čase pokusu
    answers: Array<{ id: string; text: string; isCorrect: boolean }>;
    weight: number;
  }>;
  questionOrder: ObjectId[];     // poradie pre tohto študenta
  answerOrders: Record<string, string[]>;  // poradie odpovedí per otázka
};
```

Keď v2 zmení otázku, v1 attempt zobrazí **pôvodné znenie** zo snapshotu.

## Slug stability

`slug` je **stabilný naprieč verziami** — verejné URL `kurzy/sportovy-manazment` funguje vždy na najnovšiu publikovanú verziu. Toto je dôležité pre SEO a user-facing odkazy.

`slug` na Topic, Level, Part ostáva tiež rovnaký — admin pri klonovaní môže meniť, ale by sa to mal vyhýbať pre konzistenciu.

## Cena pri novej verzii

Ak v2 má **inú cenu** (napr. 490€ → 590€), aplikuje sa:

- **Nové enrollmenty po publikácii v2** platia novú cenu
- **Existujúce enrollmenty (v1)** ostávajú za pôvodnú cenu — žiadny dorovnávací poplatok
- **Refund + re-purchase** by stál novú cenu

## Akreditácia pri novej verzii

Ak v2 má **významnú zmenu obsahu**, treba **novú akreditáciu od ŽU**:

- Drobné textové úpravy (typá, formulácie) — bez novej akreditácie
- Pridanie/odobranie modulu, zmena testovacích kritérií, zmena hodín — **nová akreditácia**
- Akreditačné rozhodnutie ŽU sa archivuje s konkrétnou verziou kurzu

Detaily akreditačného procesu v [`../decisions/0008-certification-zu.md`](../decisions/0008-certification-zu.md).

## Archivované verzie — viditeľnosť

- **Verejne nedostupné** — z katalógu zmiznú, slug ukazuje na novú verziu
- **Pre študentov v starej verzii** — naďalej dostupné cez ich `/profil` (Enrollment ukazuje na starý Course `_id`)
- **Pre admina** — viditeľné v admin UI s filtrom „Archived"

## Mazanie verzií

**Verzie nikdy nemažeme.** Aj 5 rokov stará archivovaná verzia musí ostať, aby sme:

- Vedeli zobraziť historický enrollment
- Vedeli verifikovať certifikát z minulosti
- Splnili audit a regulatorné požiadavky

Verzie bez aktívnych enrollmentov sa môžu **soft-delete-ovať** (state = `deleted`) po 5 rokoch od archivácie. Hard delete len pri explicitnom GDPR požiadavku, kde sa anonymizuje aj enrollment, ktorý ukazuje na danú verziu.
