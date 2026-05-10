<!-- SPDX-FileCopyrightText: 2025 Ján Letko / LTK Solutions s.r.o.
     SPDX-License-Identifier: CC-BY-4.0 -->

# `@clubup/db`

MongoDB modely, Zod schémy a repository funkcie pre ClubUp.

## Princípy

- **Schema-first** — každá kolekcia má `schema.ts` so Zod schémou ako zdroj pravdy.
- **TypeScript types z Zod** cez `z.infer<typeof Schema>`. Žiadny duplikát definícií.
- **Repository pattern** — operácie nad jednou kolekciou žijú v `repository.ts`.
- **Per-collection sub-paths** — konzumenti importujú z `@clubup/db/courses`, nie z `@clubup/db`. Lepšia tree-shake-abilita a jasnejšie závislosti.
- **Transakcie cez `withTransaction`** — pre cross-collection writes (napr. Order + Enrollment + Progress).

## Štruktúra

```
src/
├── client.ts                      # MongoDB connection singleton + withTransaction
├── errors.ts                      # DomainError hierarchia
├── index.ts                       # cross-cutting re-exports
│
├── courses/                       # ✓ implementované (vzor)
│   ├── schema.ts
│   ├── repository.ts
│   └── index.ts
├── enrollments/                   # ✓ implementované (vzor)
│   ├── schema.ts
│   ├── repository.ts
│   └── index.ts
├── audit/                         # ✓ implementované (vzor)
│   ├── schema.ts
│   ├── repository.ts
│   └── index.ts
│
├── levels/                        # TODO — viď docs/domain/level.md
├── topics/                        # TODO — viď docs/domain/topic.md
├── modules/                       # TODO — viď docs/domain/module.md
├── parts/                         # TODO — viď docs/domain/part.md
├── tests/                         # TODO — viď docs/domain/test.md
├── questions/                     # TODO — Question + question banks
├── test-attempts/                 # TODO — denormalized attempt records
├── webinars/                      # TODO — viď docs/domain/webinar.md
├── progress/                      # TODO — viď docs/domain/progress.md
├── orders/                        # TODO — Order + billing data
├── payments/                      # TODO — Payment + 24-pay data
├── certificates/                  # TODO — viď docs/domain/certificate.md
└── webhooks/                      # TODO — webhook_events idempotency table
```

## Status

> **Tri vzorové moduly (`courses`, `enrollments`, `audit`) sú scaffold-úrovne** — ukazujú správny tvar (Zod schema → TS type → repository → index). Ostatné moduly sa pridajú podľa potreby pri implementácii apps. Všetky majú zdrojovú špecifikáciu v `docs/domain/*.md`.

## Použitie

```ts
import { findCourseBySlug } from '@clubup/db/courses';
import { recordAudit } from '@clubup/db/audit';
import { withTransaction, ObjectId } from '@clubup/db';

const course = await findCourseBySlug('sportovy-manazment');
if (!course) throw new Error('not found');

await withTransaction(async (session) => {
  // ... cross-collection writes
  await recordAudit(
    {
      actor: 'sportup_person_id_123',
      actorRoles: ['admin'],
      action: 'course.publish',
      target: { type: 'course', id: course._id.toString() },
    },
    { session }
  );
});
```

## Environment

Vyžaduje `MONGODB_URI` a `MONGODB_DB_NAME` v `process.env`. Pre lokálny dev:

```env
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=clubup_dev
```

Vid `docs/operations/deployment.md` pre prod konfiguráciu.

## Indexy

Každý `schema.ts` súbor má v komentári zoznam odporúčaných indexov pre danú kolekciu. Migrácie (TODO) ich aplikujú pri prvom deployi a pri každej zmene.

## Testovanie

Plánovaný stack: `vitest` + `mongodb-memory-server`. Príklad:

```ts
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { closeDb } from '@clubup/db';

let mongo: MongoMemoryReplSet;

beforeAll(async () => {
  mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  process.env.MONGODB_URI = mongo.getUri();
  process.env.MONGODB_DB_NAME = 'clubup_test';
});

afterAll(async () => {
  await closeDb();
  await mongo.stop();
});
```

Replica set je potrebný pre transakcie.
