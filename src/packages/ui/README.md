<!-- SPDX-FileCopyrightText: 2025 Ján Letko / LTK Solutions s.r.o.
     SPDX-License-Identifier: CC-BY-4.0 -->

# `@clubup/ui`

Zdieľaný React component library pre ClubUp apps.

## Princípy

- **shadcn/ui pattern** — komponenty s `cva` variantami, exportované ako React komponenty (žiadny generátor, žiadny build-time CLI)
- **Tailwind utility-first** — všetko cez utilities z `@clubup/config/tailwind.preset.js`
- **Server-component-friendly** — žiadne `'use client'` v primitivoch, len keď je nevyhnutné
- **`forwardRef` všade** — interoperabilita s Radix, react-hook-form atď.
- **Typované varianty** — `VariantProps<typeof X>` z `class-variance-authority`

## Štruktúra

```
src/
├── index.ts                    # public re-exports
├── styles.css                  # CSS variables (mirror brand tokens)
├── lib/
│   └── cn.ts                   # twMerge + clsx wrapper
└── components/
    ├── button.tsx              # ✓ implementované
    ├── card.tsx                # ✓ implementované
    │
    ├── input.tsx               # TODO
    ├── label.tsx               # TODO
    ├── select.tsx              # TODO (cez @radix-ui/react-select)
    ├── checkbox.tsx            # TODO
    ├── badge.tsx               # TODO
    ├── alert.tsx               # TODO
    ├── progress.tsx            # TODO  (pre progress-baru úrovne / modulu)
    ├── tabs.tsx                # TODO
    ├── dialog.tsx              # TODO (cez @radix-ui/react-dialog)
    ├── dropdown.tsx            # TODO (cez @radix-ui/react-dropdown-menu)
    └── toast.tsx               # TODO
```

## Status

> **Scaffold úroveň.** `Button` a `Card` ukazujú pattern. Ďalšie primitívy sa pridávajú podľa potreby pri implementácii apps.

## Použitie v apps

V `tailwind.config.ts` ten istý preset zahŕňa aj `packages/ui/src`:

```ts
import preset from '@clubup/config/tailwind.preset.js';

export default {
  presets: [preset],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
};
```

V `app/globals.css`:

```css
@import "@clubup/ui/styles.css";
@import "tailwindcss";
```

V komponentoch:

```tsx
import { Button } from '@clubup/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@clubup/ui/card';

export function CourseCard({ title, description }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{description}</CardContent>
      <Button>Pozrieť kurz</Button>
    </Card>
  );
}
```

## Brand tokens

Komponenty využívajú tokeny z `@clubup/config/tailwind.preset.js` (Tailwind theme) a CSS premenné z `styles.css` (pre direct CSS use). Oboje zrkadlí `website/brand/tokens/clubup-tokens.css` — single source of truth pre brand farby a typografiu.
