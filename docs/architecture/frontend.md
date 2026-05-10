# Frontend architektúra

> Dokumentácia pre senior frontend developerov, ktorí budú implementovať `app.clubup.sk` a `admin.clubup.sk`.

## Stack

| Vrstva | Voľba |
|---|---|
| Framework | **Next.js 15** (App Router) |
| Runtime | Node.js 20 LTS |
| Jazyk | TypeScript 5.6+ (strict) |
| UI library | **shadcn/ui** (cez `packages/ui`) |
| CSS | **Tailwind CSS** (s custom design tokens z `website/brand/tokens/`) |
| Forms | **react-hook-form** + **zod** |
| State (server) | React Server Components + Server Actions |
| State (client) | React state, Zustand pre väčšie stores |
| Tabuľky | **TanStack Table** |
| Dátum/čas | **date-fns** s `sk` locale |
| Video player | **HLS.js** + Mux |
| Testing | **Vitest** (unit), **Playwright** (E2E) |
| Storybook | optional, len pre `packages/ui` |

## App Router štruktúra

### `apps/app` (študentská aplikácia)

URL štruktúra reflektuje hierarchiu kurzu (Course → Level → Topic → Module → Part):

```
app/
├── (marketing)/                       ← public stránky (ak treba — väčšina je v website/)
│   └── pricing/page.tsx
├── (auth)/                            ← prihlásenie, callback, sign-out
│   ├── login/page.tsx
│   └── callback/route.ts
├── (dashboard)/                       ← prihlásená sekcia
│   ├── layout.tsx                     ← shared layout so sidebar/topbar
│   ├── page.tsx                       ← dashboard (prehľad kurzov, aktuálny progress)
│   ├── kurzy/
│   │   ├── page.tsx                   ← katalóg
│   │   └── [courseSlug]/
│   │       ├── page.tsx               ← detail kurzu (popis, lektor, cena, levels overview)
│   │       ├── kupit/
│   │       │   └── page.tsx
│   │       ├── ucim-sa/
│   │       │   └── page.tsx           ← prehľad postupu študenta v kurze (Levels matrix)
│   │       └── [levelSlug]/
│   │           ├── page.tsx           ← detail levelu (10 tém, level-test status)
│   │           ├── test/page.tsx      ← Level-test
│   │           └── [topicSlug]/
│   │               ├── page.tsx       ← Téma redirectuje rovno na Modul (1:1)
│   │               └── [partSlug]/
│   │                   ├── page.tsx   ← detail časti (contentBlocks render)
│   │                   └── test/page.tsx ← Part-test
│   ├── certifikaty/
│   │   ├── page.tsx                   ← zoznam získaných (final + intermediate)
│   │   └── [id]/page.tsx              ← detail certifikátu + verifikačná URL
│   ├── profil/
│   │   ├── page.tsx
│   │   └── nastavenia/page.tsx
│   └── objednavky/
│       ├── page.tsx
│       └── [id]/page.tsx
├── api/
│   ├── webhooks/
│   │   └── 24pay/route.ts
│   ├── orders/
│   │   └── [id]/route.ts
│   ├── progress/
│   │   └── route.ts
│   └── parts/
│       └── [id]/
│           └── playback-url/route.ts  ← signed Mux URL pre video bloky
├── layout.tsx                         ← root layout (fonts, theme)
├── globals.css                        ← Tailwind + design tokens import
└── not-found.tsx
```

### `apps/admin` (admin aplikácia)

```
app/
├── (auth)/
│   ├── login/page.tsx
│   └── callback/route.ts
├── (admin)/
│   ├── layout.tsx
│   ├── page.tsx                       ← dashboard so štatistikami
│   ├── kurzy/
│   │   ├── page.tsx
│   │   ├── novy/page.tsx
│   │   └── [id]/
│   │       ├── page.tsx               ← prehľad kurzu (matrix Tém × Úrovní)
│   │       ├── settings/page.tsx
│   │       ├── levels/
│   │       │   └── [levelId]/
│   │       │       ├── page.tsx       ← edit levelu, level-test, intermediate cert
│   │       │       └── topics/
│   │       │           └── [topicId]/
│   │       │               ├── page.tsx
│   │       │               └── parts/
│   │       │                   └── [partId]/page.tsx  ← edit časti + content blocks
│   │       ├── tests/                 ← samostatná správa testov
│   │       │   └── [testId]/page.tsx
│   │       ├── studenti/
│   │       │   ├── page.tsx           ← zoznam zapísaných
│   │       │   └── [enrollmentId]/page.tsx ← detail progressu jedného študenta
│   │       └── statistics/page.tsx    ← completion rates, test scores
│   ├── studenti/
│   │   ├── page.tsx                   ← cross-course view
│   │   └── [id]/page.tsx
│   ├── objednavky/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── webinare/
│   │   ├── page.tsx
│   │   └── novy/page.tsx
│   ├── otazky/                        ← správa otázok a question banks
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── certifikaty/
│   │   ├── page.tsx
│   │   └── vydat/page.tsx             ← manuálne vydanie certifikátu (Fáza 1)
│   └── nastavenia/
│       └── page.tsx
└── api/
    └── ...
```

## Server vs Client Components

**Default je Server.** Client len keď:

- **Forms** — react-hook-form vyžaduje client
- **Interaktívne UI** — modal, tabs, accordion (zo shadcn/ui)
- **Brouzers API** — clipboard, file picker, geolocation
- **Real-time** — websockety (zatiaľ nepoužívame)
- **Stateful komponenty** — video player s pozíciou, kvíz s timerom

Príklad rozhrania:

```tsx
// Server Component (default)
// apps/app/app/(dashboard)/kurzy/[courseSlug]/page.tsx
import { findCourseBySlug } from '@clubup/db/courses';
import { CoursePurchaseButton } from '@/components/course-purchase-button';

export default async function CoursePage({ params }: { params: { courseSlug: string } }) {
  const course = await findCourseBySlug(params.courseSlug);
  if (!course) notFound();

  return (
    <article>
      <h1>{course.title}</h1>
      <p>{course.description}</p>
      {/* Klient komponent pre interaktivitu */}
      <CoursePurchaseButton courseId={course._id} priceEur={course.priceEur} />
    </article>
  );
}
```

```tsx
// Client Component
// apps/app/components/course-purchase-button.tsx
'use client';
import { useState } from 'react';
import { initiatePayment } from '@/app/actions/payment';

export function CoursePurchaseButton({ courseId, priceEur }: Props) {
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    const result = await initiatePayment(courseId);
    if (result.redirectUrl) window.location.href = result.redirectUrl;
  }

  return (
    <button disabled={pending} onClick={handleClick}>
      {pending ? 'Pripravujem...' : `Kúpiť za ${priceEur} €`}
    </button>
  );
}
```

```typescript
// Server Action
// apps/app/app/actions/payment.ts
'use server';
import { auth } from '@/auth';
import { createOrder } from '@clubup/db/orders';
import { create24PayPayment } from '@clubup/payments-24pay';

export async function initiatePayment(courseId: string) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  const order = await createOrder({
    courseId,
    studentId: session.user.sportupPersonId,
    state: 'pending',
  });

  const payment = await create24PayPayment({
    orderId: order._id.toString(),
    amount: order.amount,
    currency: 'EUR',
    description: `ClubUp kurz: ${order.courseTitle}`,
    returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/objednavky/${order._id}/return`,
  });

  return { redirectUrl: payment.redirectUrl };
}
```

## ContentBlock rendering

Časti (`Part`) obsahujú pole `contentBlocks[]` — server-rendered komponent, ktorý prejde pole a pre každý blok vyrendrejuje špecifický komponent:

```tsx
// apps/app/components/part/part-content.tsx
import { TextBlock } from './blocks/text-block';
import { VideoBlock } from './blocks/video-block';
import { ImageBlock } from './blocks/image-block';
import { PresentationBlock } from './blocks/presentation-block';
import { PdfBlock } from './blocks/pdf-block';
import { WebinarBlock } from './blocks/webinar-block';

export async function PartContent({ part, enrollmentId }: Props) {
  return (
    <div className="space-y-8">
      {part.contentBlocks.map((block) => {
        switch (block.type) {
          case 'text': return <TextBlock key={block.id} block={block} />;
          case 'video': return <VideoBlock key={block.id} block={block} partId={part._id} enrollmentId={enrollmentId} />;
          case 'image': return <ImageBlock key={block.id} block={block} />;
          case 'presentation': return <PresentationBlock key={block.id} block={block} />;
          case 'pdf': return <PdfBlock key={block.id} block={block} />;
          case 'webinar': return <WebinarBlock key={block.id} block={block} />;
          default: return null;
        }
      })}
    </div>
  );
}
```

Video block je client komponent (kvôli prehrávaču + sledovaniu progressu); ostatné môžu byť server.

## Test UI

Test má vlastný layout:

- Server Action `startAttempt(testId)` vráti `TestAttempt` s konkrétnymi otázkami (po `random_sample` alebo `fixed`) a poradím
- Client komponent `TestRunner` zobrazuje otázky postupne, auto-saves answers každých 30 sec
- Server Action `submitAttempt(attemptId, answers)` vyhodnotí a vráti score + passed
- Pri timeoute server odmietne neskorý submit (`startedAt + timeLimitSec + 10s buffer`)

## Design tokens

Pochádzajú z `website/brand/tokens/clubup-tokens.css`. V monorepe importované do `apps/*/app/globals.css`:

```css
/* apps/app/app/globals.css */
@import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,300..800;1,400..700&family=JetBrains+Mono:wght@400;500&display=swap');
@import '../../../website/brand/tokens/clubup-tokens.css';
```

Alebo cez Tailwind preset:

```ts
// apps/app/tailwind.config.ts
import clubup from '../../website/brand/tokens/tailwind.config.js';

export default {
  presets: [clubup],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
};
```

## Loading & error states

Každý route segment má:

- `loading.tsx` — Skeleton z `packages/ui/skeletons`
- `error.tsx` — Boundary s "Skúsiť znova" tlačidlom + Sentry capture
- `not-found.tsx` — 404 stránka pre konkrétny segment

## i18n

Zatiaľ **iba slovenčina**. Štruktúra je pripravená na `next-intl`, keď bude treba češtinu (`/cs/...` cesty).

## Accessibility

- **shadcn/ui** komponenty sú postavené na Radix UI — pripravené na klávesnicu, screen reader, focus management
- Všetky obrázky majú `alt` (povinný field na `ImageBlock`)
- Video bloky v Častiach majú **transkripty** ako `<track kind="captions">` (povinný field `transcript` na `VideoBlock`)
- Kontrast farieb je nad WCAG AA (overené v Design Manuáli)

## Performance

- **next/image** pre všetky obrázky
- **next/font** s Poppins, preload, swap
- **Streaming SSR** pre stránky s pomalými dátami (napr. progress dashboard)
- Static generation kde to dáva zmysel: katalóg kurzov, marketing
- **Mux** pre video → adaptive bitrate, žiadny waterfall
