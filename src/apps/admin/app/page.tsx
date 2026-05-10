// SPDX-FileCopyrightText: 2025 Ján Letko / LTK Solutions s.r.o.
// SPDX-License-Identifier: EUPL-1.2

import { Card, CardContent, CardHeader, CardTitle } from '@clubup/ui/card';

/**
 * Placeholder admin landing page.
 *
 * The real admin dashboard requires authentication and lives behind /dashboard.
 */
export default function AdminHomePage() {
  return (
    <main className="mx-auto max-w-container px-6 py-16">
      <header className="mb-12">
        <span className="font-mono text-xs uppercase tracking-widest text-blue">
          admin.clubup.sk · scaffold
        </span>
        <h1 className="mt-3 text-4xl font-extrabold text-navy">
          Administrácia ClubUp
        </h1>
        <p className="mt-3 max-w-prose text-[var(--text-muted)]">
          Tento súbor je dočasný placeholder. Plná admin aplikácia obsahuje
          správu kurzov, lekcií, testov, zápisov, certifikátov a webinárov.
          Prístup bude obmedzený na role <code>content_manager</code> a{' '}
          <code>admin</code>.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Kurzy</CardTitle>
          </CardHeader>
          <CardContent className="text-[var(--text-muted)]">
            CRUD pre Course / Level / Topic / Module / Part.
            Test placement (part / module / level / course).
            Versioning publikovaných kurzov.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Otázky a testy</CardTitle>
          </CardHeader>
          <CardContent className="text-[var(--text-muted)]">
            Question bank, test selection mode (fixed / random_sample),
            tagovanie pre vážený výber. Náhodné poradie odpovedí.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Webináre</CardTitle>
          </CardHeader>
          <CardContent className="text-[var(--text-muted)]">
            Plánovanie a zaznamenávanie webinárov (Microsoft Teams),
            RSVP, prepojenie na časti modulu.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Zápisy a progres</CardTitle>
          </CardHeader>
          <CardContent className="text-[var(--text-muted)]">
            Manuálne udelenie / zrušenie zápisu, predĺženie platnosti,
            reset pokusov testu, ručné vystavenie certifikátu.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Objednávky a platby</CardTitle>
          </CardHeader>
          <CardContent className="text-[var(--text-muted)]">
            Prehľad objednávok, refund cez 24-pay, generovanie faktúr
            (slovenský zákon č. 222/2004 Z. z.).
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Audit log</CardTitle>
          </CardHeader>
          <CardContent className="text-[var(--text-muted)]">
            Read-only prehľad všetkých privileged akcií.
            Filtrovanie podľa actor / target / action.
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
