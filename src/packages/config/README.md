<!-- SPDX-FileCopyrightText: 2025 Ján Letko / LTK Solutions s.r.o.
     SPDX-License-Identifier: CC-BY-4.0 -->

# `@clubup/config`

Zdieľaný konfiguračný preset pre ClubUp monorepo: TypeScript, ESLint, Tailwind.

## Použitie

### TypeScript

V app alebo package `tsconfig.json`:

```json
{
  "extends": "@clubup/config/tsconfig.next.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"]
}
```

Tri preset varianty:

- `tsconfig.base.json` — strict TS, ES2022, žiadne emit nastavenia
- `tsconfig.next.json` — pre Next.js apps (DOM lib, JSX preserve, allowJs)
- `tsconfig.lib.json` — pre packages, vytvára `dist/` s `.d.ts`

### ESLint

V app alebo package `eslint.config.js`:

```js
import preset from '@clubup/config/eslint.preset.js';
import next from 'eslint-config-next';

export default [
  ...preset,
  ...next, // pre apps, nie packages
];
```

### Tailwind

V app `tailwind.config.ts`:

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

## Design tokens

Tailwind preset reflektuje `website/brand/tokens/clubup-tokens.css`:

| Token | Tailwind class |
|---|---|
| `--clubup-navy` | `bg-navy`, `text-navy` |
| `--clubup-blue` | `bg-blue`, `text-blue` |
| `--clubup-pale` | `bg-blue-light` |
| `--clubup-paper` | `bg-paper` |
| `--clubup-bg` | `bg-warm` |

Detaily v `website/brand/dev.html`.

## Status

> Placeholder — finálna konfigurácia (s reálnym `eslint.config.js`, `prettier`, atď.) príde pri prvej implementácii apps.
