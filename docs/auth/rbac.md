# RBAC — Role-Based Access Control

> Mapovanie SportUp rolí na ClubUp roly + permission matrix.

## ClubUp roly

| Rola | Popis | Typický užívateľ |
|---|---|---|
| `student` | Default — môže si kúpiť kurzy, prechádzať obsah, robiť testy | Výkonný riaditeľ klubu, manažér |
| `instructor` | Lektor — pripravuje obsah, vedie webináre | Pedagóg z FRI ŽU, externý expert |
| `content_manager` | Editor obsahu — vytvára/edituje drafts kurzov | Interný pracovník LTK Solutions |
| `admin` | Plná správa — publish, refunds, vydávanie certifikátov | Owner / CTO / DevOps |

Roly sú **kumulatívne** — admin môže robiť všetko, čo content_manager + instructor + student.

## Mapovanie zo SportUp claims

V ID tokene je `sportup_roles[]` so SportUp + ClubUp-špecifickými rolami. Mapovanie:

| `sportup_roles` value | ClubUp rola | Poznámka |
|---|---|---|
| `sportup:user` | `student` | Default; každý prihlásený SportUp user dostane student rolu v ClubUp |
| `clubup:student` | `student` | Explicitne pre case keď `sportup:user` chýba |
| `clubup:instructor` | `instructor` | Pridelené SportUp adminom alebo ClubUp admin requestom |
| `clubup:content_manager` | `content_manager` | Pridelené SportUp adminom |
| `clubup:admin` | `admin` | Pridelené SportUp adminom (highest privilege) |

```ts
// packages/auth/rbac.ts
export type Role = 'student' | 'instructor' | 'content_manager' | 'admin';

export function mapRoles(sportupRoles: string[]): Role[] {
  const roles = new Set<Role>();
  if (sportupRoles.includes('sportup:user') || sportupRoles.includes('clubup:student')) {
    roles.add('student');
  }
  if (sportupRoles.includes('clubup:instructor')) roles.add('instructor');
  if (sportupRoles.includes('clubup:content_manager')) roles.add('content_manager');
  if (sportupRoles.includes('clubup:admin')) roles.add('admin');
  return Array.from(roles);
}
```

## Permission matrix

Permissions sú definované cez stable string keys. Každý key má zoznam rolí, ktoré ho majú:

```ts
// packages/auth/permissions.ts
export const PERMISSIONS = {
  // === Course content ===
  'course.read.published':       ['student', 'instructor', 'content_manager', 'admin'],
  'course.read.draft':           ['content_manager', 'admin'],
  'course.create':               ['content_manager', 'admin'],
  'course.update':               ['content_manager', 'admin'],
  'course.publish':              ['admin'],
  'course.archive':              ['admin'],
  'course.delete':               ['admin'],
  'course.create_new_version':   ['content_manager', 'admin'],
  
  // === Levels / Topics / Modules / Parts ===
  'level.create':                ['content_manager', 'admin'],
  'level.update':                ['content_manager', 'admin'],
  'level.delete':                ['admin'],
  'topic.create':                ['content_manager', 'admin'],
  'topic.update':                ['content_manager', 'admin'],
  'topic.delete':                ['admin'],
  'module.create':               ['content_manager', 'admin'],
  'module.update':               ['content_manager', 'admin'],
  'module.delete':               ['admin'],
  'part.create':                 ['content_manager', 'admin'],
  'part.update':                 ['content_manager', 'admin'],
  'part.delete':                 ['admin'],
  
  // === Tests & Questions ===
  'test.create':                 ['content_manager', 'admin'],
  'test.update':                 ['content_manager', 'admin'],
  'test.delete':                 ['admin'],
  'question.create':             ['content_manager', 'admin'],
  'question.update':             ['content_manager', 'admin'],
  'question.delete':             ['admin'],
  'test_attempt.start':          ['student', 'instructor', 'content_manager', 'admin'],
  'test_attempt.submit':         ['student', 'instructor', 'content_manager', 'admin'],
  'test_attempt.reset':          ['admin'],     // reset count for student
  
  // === Webinars ===
  'webinar.create':              ['instructor', 'content_manager', 'admin'],
  'webinar.update':              ['instructor', 'content_manager', 'admin'],
  'webinar.delete':              ['admin'],
  'webinar.upload_recording':    ['instructor', 'content_manager', 'admin'],
  
  // === Enrollments ===
  'enrollment.read.own':         ['student', 'instructor', 'content_manager', 'admin'],
  'enrollment.read.all':         ['admin'],
  'enrollment.create':           ['admin'],     // manuálne udelenie
  'enrollment.cancel':           ['admin'],
  'enrollment.extend':           ['admin'],
  
  // === Orders & Payments ===
  'order.read.own':              ['student', 'admin'],
  'order.read.all':              ['admin'],
  'order.create':                ['student', 'instructor', 'content_manager', 'admin'],   // všetci si kupujú
  'order.refund':                ['admin'],
  
  // === Certificates ===
  'certificate.read.own':        ['student', 'instructor', 'content_manager', 'admin'],
  'certificate.read.all':        ['admin'],
  'certificate.issue':           ['admin'],     // manuálne (Fáza 1)
  'certificate.revoke':          ['admin'],
  
  // === Audit & system ===
  'audit.read':                  ['admin'],
  'system.settings':             ['admin'],
} as const;

export type Permission = keyof typeof PERMISSIONS;

export function can(roles: Role[], permission: Permission): boolean {
  const allowed = PERMISSIONS[permission];
  return roles.some((r) => allowed.includes(r));
}
```

## Pomocné funkcie

```ts
// packages/auth/guards.ts
import { auth } from './index';
import { can, type Permission } from './permissions';

export async function requirePermission(permission: Permission) {
  const session = await auth();
  if (!session) throw new UnauthorizedError();
  
  if (!can(session.user.roles, permission)) {
    throw new ForbiddenError(permission);
  }
  
  return session;
}

export async function requireRole(role: Role) {
  const session = await auth();
  if (!session) throw new UnauthorizedError();
  
  if (!session.user.roles.includes(role)) {
    throw new ForbiddenError(`role:${role}`);
  }
  
  return session;
}

export class UnauthorizedError extends Error { code = 'unauthorized'; }
export class ForbiddenError extends Error { code = 'forbidden'; }
```

## Použitie

### Server Action

```ts
'use server';
import { requirePermission } from '@clubup/auth';

export async function publishCourse(courseId: string) {
  await requirePermission('course.publish');
  // ...
}
```

### Route Handler

```ts
import { requirePermission } from '@clubup/auth';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    await requirePermission('course.publish');
    // ...
  } catch (e) {
    if (e instanceof UnauthorizedError) return new Response('unauthorized', { status: 401 });
    if (e instanceof ForbiddenError) return new Response('forbidden', { status: 403 });
    throw e;
  }
}
```

### React Server Component

```tsx
import { auth } from '@/auth';
import { can } from '@clubup/auth/permissions';

export default async function CoursePage() {
  const session = await auth();
  const showEditButton = session && can(session.user.roles, 'course.update');
  
  return (
    <div>
      {showEditButton && <EditCourseButton />}
    </div>
  );
}
```

## Ownership checks

Niektoré permissions sú „own only" (napr. `enrollment.read.own`). Tu nestačí role check — treba aj **ownership check**:

```ts
export async function requireEnrollmentAccess(enrollmentId: string) {
  const session = await requirePermission('enrollment.read.own');
  
  const enrollment = await findEnrollment(enrollmentId);
  if (!enrollment) throw new NotFoundError();
  
  // Admin môže čítať všetky
  if (session.user.roles.includes('admin')) return enrollment;
  
  // Student môže len vlastné
  if (enrollment.studentId !== session.user.sportupPersonId) {
    throw new ForbiddenError('not_owner');
  }
  
  return enrollment;
}
```

## Org-level permissions (Fáza 2)

Keď klub kupuje kurzy pre svojich členov, potrebujeme **org-level admina** — užívateľa, ktorý môže vidieť progress všetkých študentov v klube. Toto **NIE JE v MVP**, ale architektúra je pripravená:

```ts
// V claims tokenu:
sportup_orgs: [
  { org_id: 'sportup_org_id_klub', roles: ['coach', 'manager', 'clubup:org_admin'] }
]
```

Vyhodnotenie: ak má `clubup:org_admin` rolu v konkrétnej organizácii, vidí všetkých študentov, ktorí majú aktívny enrollment so `sponsorOrgId` rovnajúcim sa danému org_id.

## Audit pre privileged akcie

Každá akcia s permission `*.delete`, `*.publish`, `*.refund`, `*.issue`, `*.revoke`, `*.reset` automaticky vytvorí záznam v `audit_logs`:

```ts
import { audit } from '@clubup/db/audit';

export async function publishCourse(courseId: string) {
  const session = await requirePermission('course.publish');
  
  const result = await doPublish(courseId);
  
  await audit({
    actor: session.user.sportupPersonId,
    actorRoles: session.user.roles,
    action: 'course.publish',
    target: { type: 'course', id: courseId },
    timestamp: new Date(),
  });
  
  return result;
}
```

Audit log je read-only pre `admin` rolu, immutable, retention 24 mesiacov (alebo dlhšie podľa `operations/gdpr.md`).
