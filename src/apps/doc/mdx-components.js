// SPDX-FileCopyrightText: 2026 Ján Letko / LTK Solutions
// SPDX-License-Identifier: EUPL-1.2

// Nextra 4 requires this file at the project root. It allows us to
// extend or override MDX components project-wide. For now we just
// re-export Nextra's defaults; custom components (callouts wrapping
// ClubUp UI primitives, etc.) can be added here later.

import { useMDXComponents as getDocsMDXComponents } from 'nextra-theme-docs';

const docsComponents = getDocsMDXComponents();

export function useMDXComponents(components) {
  return {
    ...docsComponents,
    ...components,
  };
}
