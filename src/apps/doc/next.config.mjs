// SPDX-FileCopyrightText: 2026 Ján Letko / LTK Solutions
// SPDX-License-Identifier: EUPL-1.2

import nextra from 'nextra';

const withNextra = nextra({
  // Default Nextra 4 config — search, latex, mermaid, github-alert syntax.
  // Configuration is intentionally minimal; theme-specific tuning lives in
  // app/layout.jsx props for <Layout>, <Navbar>, <Footer>, <Search>.
  defaultShowCopyCode: true,
  search: {
    codeblocks: false,
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // Same security headers as src/apps/app — keep the docs site aligned
  // with the rest of the ecosystem.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default withNextra(nextConfig);
