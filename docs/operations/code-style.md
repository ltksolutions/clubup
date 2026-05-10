# Code Style

> Konvencie pre kód v ClubUp monorepe.

## Princípy

1. **Konzistentnosť > osobná preferencia** — formátujeme cez Prettier, nie ručne
2. **Kompilátor je friend** — TypeScript strict, žiadne `any`
3. **Explicit > clever** — čitateľnosť dôležitejšia než stručnosť
4. **Slovak v UI a doménových termínoch** — kód v angličtine, ale doménové entity (Course, Topic) sú zhodné s našou doménou (slovenský kurz)

## TypeScript

### `tsconfig.json` — strict mode

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "moduleResolution": "bundler",
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"]
  }
}
```

### Pravidlá

- **Žiadne `any`** — pri integrácii s externými API použiť `unknown` + Zod parse
- **Žiadne `as` casting bez dôvodu** — preferovať type guards
- **Branded types** pre IDs:

  ```ts
  type ObjectIdString = string & { __brand: 'ObjectId' };
  type SportupPersonId = string & { __brand: 'SportupPersonId' };
  ```

  Bráni miešať rôzne IDs.

- **Discriminated unions** pre stavy:

  ```ts
  type OrderState =
    | { state: 'pending'; createdAt: Date }
    | { state: 'paid'; paidAt: Date; paymentId: string }
    | { state: 'failed'; failedAt: Date; reason: string };
  ```

- **Readonly** pre nemenné dáta:

  ```ts
  function processOrder(order: Readonly<Order>) { /* ... */ }
  ```

## Naming

### Súbory

- **kebab-case** pre súbory: `course-list.tsx`, `payment-service.ts`
- **PascalCase** je vyhradené pre komponentové súbory v MVP iba v konvencii Next.js (page.tsx, layout.tsx)
- Test súbory: `course-service.test.ts` (vedľa zdrojového)
- Type-only súbory: `course.types.ts` alebo `types.ts` v priečinku

### Identifikátory

- **camelCase** — premenné, funkcie, props
- **PascalCase** — typy, interfacy, komponenty, enums
- **SCREAMING_SNAKE_CASE** — konštanty environment vars (`MONGODB_URI`)
- **`_` prefix** — privátne fields v triedach (rare; preferujeme funkcionálny štýl)

### Doménové termíny

V kóde používame **anglické názvy** entít aj v slovenských projektoch — konzistentné s knižnicami a globálnym tooling-om:

- `Course`, `Level`, `Topic`, `Module`, `Part`, `Test`, `Question`
- `Enrollment`, `Progress`, `Order`, `Payment`, `Certificate`
- `Webinar`, `WebinarRSVP`

V UI a v copy textoch (Slovak) používame slovenské názvy: „Kurz", „Úroveň", „Téma", „Modul", „Časť", „Test".

## Štruktúra

### Server Action

```ts
// apps/app/app/actions/enrollment.ts
'use server';

import { z } from 'zod';
import { auth } from '@/auth';
import { enrollStudent } from '@/services/enrollment';

const InputSchema = z.object({
  courseId: z.string().regex(/^[a-f0-9]{24}$/),
});

export async function enrollInCourse(input: z.infer<typeof InputSchema>) {
  // 1. Auth
  const session = await auth();
  if (!session) throw new Error('UNAUTHORIZED');
  
  // 2. Validate
  const data = InputSchema.parse(input);
  
  // 3. Authorize
  // (žiadny extra check — každý user môže enrollnúť seba)
  
  // 4. Execute
  const enrollment = await enrollStudent({
    studentId: session.user.sportupPersonId,
    courseId: data.courseId,
    reason: 'paid',
  });
  
  // 5. Revalidate
  revalidatePath('/profil');
  
  return { ok: true, enrollmentId: enrollment._id.toString() };
}
```

### Route Handler

```ts
// apps/app/app/api/parts/[id]/playback-url/route.ts
import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { generateMuxPlaybackUrl } from '@/services/video';
import { findPartById } from '@clubup/db/parts';
import { findEnrollment } from '@clubup/db/enrollments';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }
  
  const part = await findPartById(params.id);
  if (!part) {
    return Response.json({ error: 'part_not_found' }, { status: 404 });
  }
  
  const enrollment = await findEnrollment({
    studentId: session.user.sportupPersonId,
    courseId: part.courseId,
  });
  if (!enrollment || enrollment.state !== 'active') {
    return Response.json({ error: 'no_active_enrollment' }, { status: 403 });
  }
  
  const url = await generateMuxPlaybackUrl({ partId: part._id, blockId: req.nextUrl.searchParams.get('blockId')! });
  return Response.json({ url });
}
```

### Repository function

```ts
// packages/db/courses/repository.ts
import { ObjectId, type ClientSession } from 'mongodb';
import { getDb } from '../client';
import { CourseSchema, type Course } from './schema';

export async function findCourseBySlug(
  slug: string,
  opts: { session?: ClientSession } = {}
): Promise<Course | null> {
  const db = await getDb();
  const doc = await db.collection('courses').findOne(
    { slug, state: 'published' },
    { session: opts.session }
  );
  if (!doc) return null;
  return CourseSchema.parse(doc);
}
```

## Komentáre

### Áno

- **Prečo** namiesto **čo** — kód hovorí čo robí, komentár vysvetľuje motiváciu
- **TODO/FIXME** s ticket-om: `// TODO(CLUB-123): refactor when level support is added`
- **JSDoc** pre verejné API funkcie a knižnice (auto-doc generation)

### Nie

- Komentáre, ktoré opakujú kód: `// increment counter\ncounter++`
- Zastaralé komentáre, ktoré popisujú starú logiku
- Vystrašené komentáre („HACK!!!", „THIS IS BAD") — radšej refactor

## Imports

Poradie:

1. External packages
2. Internal packages (`@clubup/*`)
3. Local imports (`@/...`)
4. Relatívne (`./`, `../`)
5. Type-only imports (`import type`)
6. CSS / asset imports

```ts
import { useState } from 'react';
import { z } from 'zod';

import { findCourseBySlug } from '@clubup/db/courses';
import { auth } from '@clubup/auth';

import { Button } from '@/components/button';

import { mySpecificHelper } from './helpers';

import type { Course } from '@clubup/db/types';

import './styles.css';
```

ESLint má `import/order` pravidlo na auto-fix.

## Async / Promise

- **Vždy `await`** namiesto `.then()` v handler-och
- **Žiadne fire-and-forget** v request lifecycle — pošli na background queue (Inngest)
- **Promise.all** pre paralelné nezávislé volania
- **Try/catch** v handler-och, mapuj na HTTP status

```ts
// Good
const [course, levels] = await Promise.all([
  findCourseBySlug(slug),
  findLevelsForCourse(courseId),
]);

// Avoid
const course = await findCourseBySlug(slug);
const levels = await findLevelsForCourse(courseId);  // Sériové, pomalšie
```

## Error handling

- **Custom error classes** v `packages/db/errors`
- **HTTP mapping** centralizovaný v jednom helper-i
- **Sentry capture** pre unexpected errors, **nie** pre expected (`UnauthorizedError`, `NotFound`)

```ts
import { NotFound, ValidationError } from '@clubup/db/errors';

try {
  // ...
} catch (e) {
  if (e instanceof NotFound) return Response.json({ error: e.code }, { status: 404 });
  if (e instanceof ValidationError) return Response.json({ error: e.code, details: e.errors }, { status: 422 });
  Sentry.captureException(e);
  return Response.json({ error: 'internal' }, { status: 500 });
}
```

## React komponenty

### Server Components (default)

```tsx
// apps/app/app/(dashboard)/kurzy/[slug]/page.tsx
import { findCourseBySlug } from '@clubup/db/courses';
import { CourseHero } from '@/components/course-hero';

export default async function CoursePage({ params }: { params: { slug: string } }) {
  const course = await findCourseBySlug(params.slug);
  if (!course) notFound();
  
  return <CourseHero course={course} />;
}
```

### Client Components

```tsx
// apps/app/components/course-purchase-button.tsx
'use client';
import { useState } from 'react';
import { initiatePayment } from '@/app/actions/payment';

interface Props {
  courseId: string;
  priceCents: number;
}

export function CoursePurchaseButton({ courseId, priceCents }: Props) {
  const [pending, setPending] = useState(false);
  
  return (
    <button
      disabled={pending}
      onClick={async () => {
        setPending(true);
        const result = await initiatePayment(courseId);
        if (result.redirectUrl) window.location.href = result.redirectUrl;
      }}
    >
      Kúpiť za {(priceCents / 100).toFixed(2)} €
    </button>
  );
}
```

### Pravidlá

- **Server first** — `'use client'` len keď je nutné
- **Props typed** explicitne (interface alebo `type Props = {}`)
- **Žiadne `React.FC`** — funkčný štýl s explicitnými props
- **Žiadne inline `style={}`** — Tailwind triedy
- **`key` prop** v listoch (žiaden index-as-key tam, kde poradie môže meniť)

## Tailwind

- **Default cez `packages/config`** — zdieľaný preset
- **Žiadny dodatočný CSS súbor** v komponentoch (s výnimkou `globals.css`)
- **`cn` utility** pre conditional classes:

  ```ts
  import { clsx } from 'clsx';
  import { twMerge } from 'tailwind-merge';
  export function cn(...inputs: any[]) { return twMerge(clsx(inputs)); }
  ```

- **Žiadne `style={{ ... }}`** s výnimkou dynamicky vypočítaných hodnôt

## Lint & format

### ESLint

`packages/config/eslint`:

```js
module.exports = {
  extends: [
    'next/core-web-vitals',
    'plugin:@typescript-eslint/recommended-type-checked',
    'plugin:import/typescript',
  ],
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'import/order': ['error', { 'newlines-between': 'always' }],
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
};
```

### Prettier

`.prettierrc`:

```json
{
  "semi": true,
  "trailingComma": "all",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

### Pre-commit

`husky` + `lint-staged`:

```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{md,json,yaml}": ["prettier --write"]
  }
}
```

## Git

### Commit messages — Conventional Commits

Formát: `<type>(<scope>): <subject>`

| Type | Použitie |
|---|---|
| `feat` | Nová funkcionalita |
| `fix` | Bug fix |
| `docs` | Iba dokumentácia |
| `style` | Formátovanie, žiadna zmena logiky |
| `refactor` | Refaktor bez zmeny správania |
| `test` | Pridanie/úprava testov |
| `chore` | Build, deps, tooling |
| `perf` | Performance |

Príklady:

```
feat(courses): add level test placement
fix(payments): handle 24-pay webhook timeout retry
docs(domain): clarify Topic vs Module relationship
refactor(auth): extract OIDC client into packages/auth
```

### Branch naming

```
feat/CLUB-123-level-tests
fix/CLUB-456-payment-webhook-retry
docs/glossary-update
chore/deps-update-2026-09
```

### PR review

- **Min 1 reviewer** pre kód, ktorý ide do `main`
- **Self-review** pred označením ready-for-review
- **Squash merge** do `main` (čistá história)
- **CI musí prejsť** — žiadny merge bez green CI

## Dependencies

### Pridanie nového balíka

1. Skontroluj alternatívy (lighter / popularnejšie)
2. Skontroluj licenciu (MIT / Apache / EUPL OK; GPL nie)
3. Skontroluj bundle size (`bundlephobia.com`)
4. Skontroluj security advisory (`npm audit`)
5. Skontroluj maintenance (last commit, open issues)

### Update

- **Patch** (`x.y.Z`) — automaticky cez Dependabot
- **Minor** (`x.Y.z`) — review a merge týždenne
- **Major** (`X.y.z`) — manuálny PR s changelog review

## Testing

### Unit tests

- **Vitest** (`*.test.ts`)
- **Doménová logika**, repository functions
- **Coverage cieľ:** 70 % pre `packages/`

### Integration tests

- **Vitest + mongodb-memory-server**
- **Repository → service flow**
- **Coverage cieľ:** kritické flows pokryté

### E2E tests

- **Playwright** (`e2e/*.spec.ts`)
- **Kritické user journeys** (login, buy, complete part, take test)
- **Beží na PR do main**, nie každý push

## Performance

### Server-side

- **DB indexy** dôsledné — každá query ide cez index
- **Aggregation pipelines** namiesto multiple findOne
- **Cache** cez `revalidate` v Next.js, alebo Redis pre frequently-accessed data
- **Streaming SSR** pre stránky s pomalými dátami

### Client-side

- **next/image** pre všetky obrázky
- **next/font** s preload
- **Lazy load** non-critical components (`dynamic` import)
- **Bundle analysis** pred majorom releasom

## Logging

```ts
import { logger } from '@clubup/logger';

logger.info('Order paid', { orderId, amountCents });
logger.warn('Webhook signature mismatch', { eventId });
logger.error('Failed to issue certificate', { error: e.message, enrollmentId });
```

**Nelogovať:**
- Hesla (žiadne nemáme — SSO)
- Tokeny / cookies
- Plné mená / emailov (iba IDs)
- Kreditných kariet (nemáme)
- IP adresy bez legitímneho dôvodu

## Accessibility

- **WCAG AA** kompatibilita
- **Sémantické HTML** (button, nav, main, …)
- **Alt text** povinný na images
- **Keyboard navigation** pre všetky interaktívne prvky
- **Focus visible** štýl
- **Captions** v video lekciách (povinné `transcript` field na VideoBlock)

Testovanie cez Playwright + axe-core.

## Documentation

- **JSDoc** pre verejné API knižníc v `packages/`
- **README.md** v každom packagi s use case a quick start
- **Doménové dokumenty** (`docs/domain/*`) sú zdroj pravdy pre business logic — kód má byť consistent
- **ADR** pre architektonické rozhodnutia

Pri zmene správania aktualizuj relevantnú dokumentáciu **v tom istom PR** ako kód.
