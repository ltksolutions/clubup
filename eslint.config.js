// SPDX-FileCopyrightText: 2025 Ján Letko / LTK Solutions s.r.o.
// SPDX-License-Identifier: EUPL-1.2
//
// Root ESLint config — used when running `eslint` from repo root.
// Workspaces (apps and packages) extend this with their own rules.

import preset from './src/packages/config/eslint.preset.js';

export default [
  ...preset,
  {
    // Skip non-source areas at root level.
    ignores: [
      '**/dist/**',
      '**/.next/**',
      '**/.turbo/**',
      '**/node_modules/**',
      '**/coverage/**',
      'website/**',         // static site, no TypeScript
      'docs/**',            // docs are markdown
    ],
  },
];
