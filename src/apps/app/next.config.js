// SPDX-FileCopyrightText: 2025 Ján Letko / LTK Solutions s.r.o.
// SPDX-License-Identifier: EUPL-1.2

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // Transpile workspace packages so Next.js builds them on the fly.
  transpilePackages: ['@clubup/ui', '@clubup/auth', '@clubup/db'],

  // Security headers (mirrors docs/operations/security.md CSP intent).
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

  experimental: {
    // Server Actions are stable in Next 15; flag here for future tuning.
  },
};

export default nextConfig;
