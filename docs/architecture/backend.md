# Backend architektúra

> Dokumentácia pre senior backend developerov, ktorí budú implementovať API a doménové služby.

## Stack

| Vrstva | Voľba |
|---|---|
| Runtime | Node.js 20 LTS |
| Framework | Next.js 15 Route Handlers + Server Actions |
| Jazyk | TypeScript 5.6+ (strict) |
| DB | MongoDB Atlas (M10+ produkcia) |
| DB driver | `mongodb` (native driver, nie Mongoose) |
| Validácia | **Zod** |
| Auth | `auth.sportup.sk` cez OIDC (Auth.js v5) |
| Externé API klienti | typed wrappers v `packages/*` |
| HTTP klient | natívny `fetch` |
| Rate limiting | **upstash/ratelimit** (Redis) |
| Background jobs | **Inngest** (cron, async events) |
| Email | **Resend** |
| Monitoring | **Sentry** + Vercel Analytics |

## Žiadny ORM

Mongoose nás stáva pri:

- transakciách cez session
- change streams (real-time updates)
- aggregation pipeline (komplexné štatistiky)
- bulk write operations

Preto používame **natívny MongoDB driver** + **Zod** pre validáciu. Schémy a typy sú v `packages/db`.

```ts
// packages/db/courses/schema.ts
import { z } from 'zod';
import { ObjectId } from 'mongodb';

export const CourseSchema = z.object({
  _id: z.instanceof(ObjectId),
  slug: z.string().min(3).max(80).regex(/^[a-z0-9-]+$/),
  title: z.string().min(3),
  description: z.string(),
  priceCents: z.number().int().positive(),  // 12000 = 120,00 €
  currency: z.literal('EUR'),
  state: z.enum(['draft', 'published', 'archived']),
  levels: z.array(z.instanceof(ObjectId)),       // refs na Levels collection
  courseTestId: z.instanceof(ObjectId).optional(),
  courseTestRequired: z.boolean(),
  version: z.number().int().positive(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Course = z.infer<typeof CourseSchema>;
```

> Pozn.: Course referencuje `levels[]`, nie priamo `modules[]`. Hierarchia je Course → Level → Topic → Module → Part. Detaily v [`../domain/README.md`](../domain/README.md).

```ts
// packages/db/courses/repository.ts
import { getDb } from '../client';
import { CourseSchema, type Course } from './schema';

export async function findCourseBySlug(slug: string): Promise<Course | null> {
  const db = await getDb();
  const doc = await db.collection('courses').findOne({ slug, state: 'published' });
  if (!doc) return null;
  return CourseSchema.parse(doc);
}
```

## Doménové kolekcie

Všetky kolekcie v MongoDB:

| Kolekcia | Účel |
|---|---|
| `courses` | Kurzy (root entity) |
| `levels` | Úrovne — sekvenčné v rámci kurzu |
| `topics` | Témy — organizačné kontajnery v Leveli |
| `modules` | Moduly = (Topic × Level), 1:1 s Topic |
| `parts` | Časti — najmenšie jednotky obsahu |
| `tests` | Testy (placement: part/module/level/course) |
| `questions` | Otázky pre testy |
| `test_attempts` | Pokusy študentov o testy |
| `webinars` | Plánované Teams webináre |
| `webinar_rsvps` | RSVP-čka študentov na webináre |
| `enrollments` | Zápisy do kurzov |
| `progress` | Postup študenta (1:1 s enrollment) |
| `orders` | Objednávky |
| `payments` | Platobné transakcie cez 24-pay |
| `certificates` | Certifikáty (final + intermediate) |
| `audit_logs` | Audit pre admin akcie |
| `webhook_events` | Idempotency pre 24-pay webhooky |
| `idempotency_keys` | General-purpose idempotency |

## Doménové služby

Vyššia úroveň ako repository — operuje nad viacerými entitami a je transakčná.

```ts
// apps/app/lib/services/enrollment-service.ts
import { withTransaction } from '@clubup/db';

export async function enrollStudent(args: {
  studentId: string;
  courseId: string;
  paymentId?: string;
  reason: 'paid' | 'admin_grant' | 'sponsor';
}) {
  return withTransaction(async (session) => {
    const course = await findCourseById(args.courseId, { session });
    if (!course) throw new NotFound('course');

    const existing = await findEnrollment(args, { session });
    if (existing) return existing;  // idempotent

    const enrollment = await createEnrollment({
      ...args,
      enrolledAt: new Date(),
      state: 'active',
    }, { session });

    // Pre-allocate progress so vsetkymi castami kurzu
    await initializeProgress({
      enrollmentId: enrollment._id,
      courseId: course._id,
      studentId: args.studentId,
    }, { session });

    return enrollment;
  });
}
```

```ts
// apps/app/lib/services/progress-service.ts
export async function markPartCompleted(args: {
  enrollmentId: ObjectId;
  partId: ObjectId;
}) {
  return withTransaction(async (session) => {
    const progress = await findProgressByEnrollment(args.enrollmentId, { session });
    const part = await findPart(args.partId, { session });

    // 1. Update PartProgress.state -> completed
    await updatePartProgress(args.enrollmentId, args.partId, { state: 'completed', completedAt: new Date() }, { session });

    // 2. Re-evaluate downstream parts (prerequisites)
    await unlockDownstreamParts(args.enrollmentId, part.moduleId, args.partId, { session });

    // 3. Re-evaluate module completion
    const moduleReady = await checkModuleCompletion(args.enrollmentId, part.moduleId, { session });
    if (moduleReady) {
      await recordModuleCompletion(args.enrollmentId, part.moduleId, { session });

      // 4. Re-evaluate level completion
      const levelReady = await checkLevelCompletion(args.enrollmentId, part.levelId, { session });
      if (levelReady) {
        await recordLevelCompletion(args.enrollmentId, part.levelId, { session });

        // 5. Trigger intermediate certificate, ak je nastavené
        await maybeIssueIntermediateCertificate(args.enrollmentId, part.levelId, { session });

        // 6. Re-evaluate course completion
        const courseReady = await checkCourseCompletion(args.enrollmentId, part.courseId, { session });
        if (courseReady) {
          await markCourseCompleted(args.enrollmentId, { session });
          await issueFinalCertificate(args.enrollmentId, { session });  // async via Inngest
        }
      }
    }
  });
}
```

## Idempotencia

Každá mutácia, ktorá ide cez webhook alebo opakovateľný request, má `idempotency_key`:

```ts
// 24-pay webhook handler
export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('x-24pay-signature');

  if (!verifyHmac(body, signature, process.env.PAYMENT_24PAY_SECRET)) {
    return new Response('invalid signature', { status: 401 });
  }

  const event = parse24PayEvent(body);

  // Idempotency: 24-pay môže webhook zopakovať
  await withTransaction(async (session) => {
    const existing = await findWebhookEvent(event.eventId, { session });
    if (existing) return;

    await recordWebhookEvent(event, { session });
    await processPaymentEvent(event, { session });  // update Order, create Enrollment
  });

  return new Response('ok', { status: 200 });
}
```

Pri test attempts je idempotencia cez unique index na `(enrollmentId, testId, attemptNumber)` — ak niekto submit-uje ten istý attempt dvakrát, druhý raz sa odmietne.

## RBAC (Role-Based Access Control)

```ts
// packages/auth/rbac.ts
export type Role = 'student' | 'instructor' | 'content_manager' | 'admin';

export const PERMISSIONS = {
  'course.read.published':  ['student', 'instructor', 'content_manager', 'admin'],
  'course.read.draft':      ['content_manager', 'admin'],
  'course.create':          ['content_manager', 'admin'],
  'course.update':          ['content_manager', 'admin'],
  'course.publish':         ['admin'],
  'course.delete':          ['admin'],
  'level.create':           ['content_manager', 'admin'],
  'topic.create':           ['content_manager', 'admin'],
  'module.create':          ['content_manager', 'admin'],
  'part.create':            ['content_manager', 'admin'],
  'test.create':            ['content_manager', 'admin'],
  'question.create':        ['content_manager', 'admin'],
  'enrollment.read.own':    ['student', 'instructor', 'content_manager', 'admin'],
  'enrollment.read.all':    ['admin'],
  'enrollment.create':      ['admin'],  // manuálne udelenie
  'order.read.own':         ['student', 'admin'],
  'order.read.all':         ['admin'],
  'certificate.issue':      ['admin'],
  'webinar.create':         ['instructor', 'content_manager', 'admin'],
  // ...
} as const;

export function can(role: Role, permission: keyof typeof PERMISSIONS): boolean {
  return PERMISSIONS[permission].includes(role);
}
```

Každá Server Action / Route Handler začína `requireRole`:

```ts
import { requireRole } from '@clubup/auth';

export async function deleteCourse(courseId: string) {
  await requireRole('admin');
  // ...
}
```

## Rate limiting

Najmä na public endpoints (search, contact form):

```ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const limiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(20, '1 m'),
});

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  const { success } = await limiter.limit(`contact:${ip}`);
  if (!success) return new Response('rate limited', { status: 429 });
  // ...
}
```

Test endpoints (start/submit attempt) majú vlastný rate limit per `(studentId, testId)` aby sa zabránilo brute-force pokusom.

## Audit log

Pre platby a admin akcie sa zapisuje audit záznam:

```ts
await audit({
  actor: session.user.sportupPersonId,
  actorRole: session.user.role,
  action: 'course.delete',
  target: { type: 'course', id: courseId },
  diff: { before: existing, after: null },
  ip: req.headers.get('x-forwarded-for'),
  userAgent: req.headers.get('user-agent'),
  timestamp: new Date(),
});
```

Audit kolekcia má TTL index na 24 mesiacov (alebo dlhšie, podľa GDPR retention policy v `operations/gdpr.md`).

## Background jobs

Pre veci, ktoré nie sú synchrónne:

- **Vydanie final certifikátu** po dokončení kurzu — async, lebo PDF generovanie a komunikácia s ŽU
- **Vydanie intermediate certifikátu** po dokončení Levelu (ak `Level.issuesIntermediateCertificate: true`)
- **Reminders** pred webinárom — cron, deň pred a hodinu pred
- **Reminders** pre neaktívnych študentov (30/90 dní bez aktivity)
- **Cleanup expired pending orders** — cron, denne
- **Mux upload monitoring** — webhook od Mux, keď je asset `ready`

Používame **Inngest** (alebo Vercel Cron + simple queue v Mongo). Nie je to MVP-blocker; v MVP môžu reminders bežať z Vercel Cron a certifikát sa vydávať poloautomatizovane (admin notifikovaný).

## Externé integrácie

Každá je v samostatnom packagi:

- `packages/sportup-client` — REST klient na `api.sportup.sk` (read persons, orgs)
- `packages/payments-24pay` — typed klient na 24-pay
- `packages/mux` — Mux API + signed URL helper
- `packages/teams` — Microsoft Graph klient + .ics generátor
- `packages/email` — Resend wrapper s templatami

Tieto packagy sú **typed wrappery** s testami a mock módom (pre development a CI).

## Error handling

```ts
// packages/db/errors.ts
export class DomainError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

export class NotFound extends DomainError {
  constructor(public resource: string) {
    super('not_found', `${resource} not found`);
  }
}

export class ValidationError extends DomainError {
  constructor(public errors: unknown) {
    super('validation', 'validation failed');
  }
}

export class ConflictError extends DomainError {
  constructor(reason: string) {
    super('conflict', reason);
  }
}
```

Route handler mapuje na HTTP:

```ts
try {
  // ...
} catch (e) {
  if (e instanceof NotFound) return Response.json({ error: e.code }, { status: 404 });
  if (e instanceof ValidationError) return Response.json({ error: e.code, details: e.errors }, { status: 422 });
  if (e instanceof ConflictError) return Response.json({ error: e.code, reason: e.message }, { status: 409 });
  Sentry.captureException(e);
  return Response.json({ error: 'internal' }, { status: 500 });
}
```

## Testing

- **Unit:** Vitest, na čistú doménovú logiku v `packages/`
- **Integration:** Vitest + `mongodb-memory-server`, pre repository funkcie
- **E2E:** Playwright, kritické flows:
  - Login → dashboard
  - Browse courses → buy → webhook → access first Part
  - Open Part → render content blocks → mark completed → progress updates
  - Take Module-test → pass → next Topic unlocks
  - Complete Level 1 → take Level-test → pass → Level 2 unlocks
  - Complete all Levels → final certificate issued
  - Admin: create course → add level → add topic → add module → add part → publish → student sees it

CI pipeline v `.github/workflows/lint.yml` (po naplnení src/).
