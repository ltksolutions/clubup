// SPDX-FileCopyrightText: 2025 Ján Letko / LTK Solutions s.r.o.
// SPDX-License-Identifier: EUPL-1.2

import { Button } from '@clubup/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@clubup/ui/card';

/**
 * Placeholder root page.
 *
 * The real student dashboard lives at /dashboard once the user is signed in.
 * This file is replaced when implementation begins.
 */
export default function HomePage() {
  return (
    <main className="mx-auto max-w-container px-6 py-16">
      <header className="mb-12">
        <span className="font-mono text-xs uppercase tracking-widest text-blue">
          app.clubup.sk · scaffold
        </span>
        <h1 className="mt-3 text-4xl font-extrabold text-navy">
          Študentská aplikácia ClubUp
        </h1>
        <p className="mt-3 max-w-prose text-[var(--text-muted)]">
          Tento súbor je dočasný placeholder. Plná aplikácia príde v rámci
          Fázy 1 (2026 Q2). Implementácia bude postavená na monorepe v{' '}
          <code className="rounded bg-warm px-1.5 py-0.5 font-mono text-sm">
            src/
          </code>
          .
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Marketing web</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-[var(--text-muted)]">
              Verejná stránka projektu, osnova kurzu, partneri a kontakt.
            </p>
            <Button asChild={false} onClick={() => (window.location.href = 'https://clubup.sk')}>
              Otvoriť clubup.sk
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dokumentácia</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-[var(--text-muted)]">
              Architektúra, doménový model, REST API, ADR, kurikulum a operations.
            </p>
            <Button
              variant="outline"
              onClick={() =>
                (window.location.href =
                  'https://github.com/ltksolutions/clubup/tree/main/docs')
              }
            >
              GitHub /docs
            </Button>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
