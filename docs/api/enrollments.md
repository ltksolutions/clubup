# API — Enrollments

Endpointy pre zápisy do kurzov.

## Pre študenta

### `GET /api/enrollments/me`

Všetky moje enrollmenty (aktívne, dokončené, zrušené).

**Auth:** session
**Response 200:**

```json
{
  "data": [
    {
      "_id": "enrollment_1",
      "courseId": "course_sportovy_manazment",
      "courseTitle": "Športový manažment pre silnejšie kluby",
      "courseSlug": "sportovy-manazment",
      "state": "active",
      "enrolledAt": "2026-09-15T14:23:00Z",
      "currentLevelId": "level_1_zaklady",
      "progress": {
        "completedModules": 3,
        "totalModules": 40,
        "completedLevels": 0,
        "totalLevels": 4,
        "lastActivityAt": "2026-09-17T09:15:00Z"
      },
      "intermediateCertificateIds": [],
      "finalCertificateId": null
    }
  ]
}
```

### `GET /api/enrollments/:id`

Detail enrollmentu (musí byť vlastný).

**Auth:** session, vlastník enrollmentu
**Response 200:** kompletný `Enrollment` + denormalizovaný `Progress` (všetky `partProgress[]`, `moduleCompletions[]`, `levelCompletions[]`).

## Pre admina

### `GET /api/admin/enrollments`

Zoznam všetkých enrollmentov s filtrami.

**Auth:** session, `admin` rola
**Query:**

| Param | Popis |
|---|---|
| `studentId` | filter podľa študenta (`sportup_person_id`) |
| `courseId` | filter podľa kurzu |
| `state` | `active`, `completed`, `cancelled`, `expired` |
| `enrolledAfter` | ISO date |

### `GET /api/admin/enrollments/:id`

Detail jedného enrollmentu — admin vidí aj raw progress data.

### `POST /api/admin/enrollments`

**Manuálne udelenie enrollmentu** bez platby (pre lektorov, testovacích študentov, sponzorované klubmi).

**Auth:** `admin`
**Body:**

```json
{
  "studentId": "sportup_person_id_X",
  "courseId": "course_id",
  "reason": "admin_grant",
  "grantReason": "Testovací prístup pre lektora",
  "accessExpiresAt": "2027-09-15T00:00:00Z"
}
```

ALEBO sponzorovaný klubom:

```json
{
  "studentId": "sportup_person_id_X",
  "courseId": "course_id",
  "reason": "sponsor",
  "sponsorOrgId": "sportup_org_id_klubu"
}
```

**Response 201:**

```json
{
  "enrollment": { /* full doc */ },
  "progress": { /* initialized progress */ }
}
```

### `POST /api/admin/enrollments/:id/cancel`

Zruší enrollment (napr. po refunde, alebo na žiadosť).

**Auth:** `admin`
**Body:**

```json
{
  "reason": "refund",
  "note": "Zákazník požiadal o refund v rámci 14 dní"
}
```

**Response 200:** `{ "ok": true, "cancelledAt": "..." }`

### `POST /api/admin/enrollments/:id/extend`

Predlžuje `accessExpiresAt`.

**Auth:** `admin`
**Body:**

```json
{
  "newExpiresAt": "2028-09-15T00:00:00Z"
}
```

### `POST /api/admin/enrollments/:id/reset-test-attempts`

Resetne počet pokusov pre konkrétny test (manuálny override).

**Auth:** `admin`
**Body:**

```json
{
  "testId": "test_module_1_4",
  "reason": "Technický problém pri prvom pokuse"
}
```

**Response 200:** `{ "ok": true }`

> Audit log zaznamená kto, kedy a prečo resetol.

## Batch enrollment (klub objedná pre svojich)

V Fáze 2: jeden Order pre klub, ktorý vytvorí N enrollmentov pre rôznych študentov.

`POST /api/admin/enrollments/batch`

**Auth:** `admin`
**Body:**

```json
{
  "courseId": "course_id",
  "sponsorOrgId": "sportup_org_id_klubu",
  "studentIds": ["sportup_person_id_1", "sportup_person_id_2", "..."],
  "orderId": "order_id"
}
```

**Response 201:** `{ "createdCount": 5, "enrollmentIds": [...] }`

## Dôsledky pre Progress

Pri vytvorení enrollmentu server **pre-allokuje Progress** dokument so všetkými `partProgress[]` (state = `locked` alebo `available` podľa pravidiel z [`../domain/progress.md`](../domain/progress.md)). Toto sa deje atomicky v rámci tej istej DB transakcie.
