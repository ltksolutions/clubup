// SPDX-FileCopyrightText: 2026 Ján Letko / LTK Solutions
// SPDX-License-Identifier: EUPL-1.2

import { NotFoundPage } from 'nextra-theme-docs';

export default function NotFound() {
  return (
    <NotFoundPage
      content="Stránka nenájdená — vráťte sa na úvod alebo nahláste nefunkčný link."
      labels="bug"
    >
      Stránka nenájdená
    </NotFoundPage>
  );
}
