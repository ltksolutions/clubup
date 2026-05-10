// SPDX-FileCopyrightText: 2025 Ján Letko / LTK Solutions s.r.o.
// SPDX-License-Identifier: EUPL-1.2
//
// Shared Tailwind CSS preset for ClubUp.
// Reflects design tokens from website/brand/tokens/clubup-tokens.css

/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#1A2D47',
          dark: '#12203A',
          light: '#243A5A',
        },
        blue: {
          DEFAULT: '#388FC3',
          dark: '#2A7AAA',
          light: '#E8F4FD',
        },
        ink: '#0E1320',
        paper: '#FFFFFF',
        warm: '#FAFAF7',
        success: {
          DEFAULT: '#2E8B57',
          soft: '#E6F2EC',
        },
        warning: {
          DEFAULT: '#E0A33E',
          soft: '#FAF3E0',
        },
        danger: {
          DEFAULT: '#C8453B',
          soft: '#FBEAE8',
        },
      },
      fontFamily: {
        sans: [
          'Poppins',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        mono: ['JetBrains Mono', 'ui-monospace', 'SF Mono', 'Menlo', 'monospace'],
      },
      borderRadius: {
        sm: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(14,19,32,0.06)',
        popover: '0 4px 14px rgba(14,19,32,0.08)',
        modal: '0 16px 40px rgba(14,19,32,0.16)',
      },
      transitionTimingFunction: {
        'clubup-ease': 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      },
      maxWidth: {
        prose: '70ch',
        container: '1200px',
        narrow: '840px',
      },
    },
  },
  plugins: [],
};
