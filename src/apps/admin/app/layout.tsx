// SPDX-FileCopyrightText: 2025 Ján Letko / LTK Solutions s.r.o.
// SPDX-License-Identifier: EUPL-1.2

import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'ClubUp Admin',
    template: '%s — ClubUp Admin',
  },
  description: 'Administrátorská aplikácia ClubUp.',
  // robots intentionally omitted — locked down via X-Robots-Tag header.
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001'
  ),
};

export const viewport: Viewport = {
  themeColor: '#1A2D47',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="sk">
      <body className="min-h-screen bg-warm text-ink antialiased">{children}</body>
    </html>
  );
}
