/**
 * ClubUp · Tailwind preset
 * Usage: extend `theme` in your tailwind.config.{js,ts}
 *
 *   const clubup = require('./brand/tokens/tailwind.config.js');
 *   module.exports = { presets: [clubup], content: [...] };
 */
module.exports = {
  theme: {
    extend: {
      colors: {
        clubup: {
          navy:    '#1A2D47',
          'navy-2':'#243A5A',
          blue:    '#388FC3',
          'blue-2':'#5BA8D6',
          pale:    '#E8F4FD',
          ink:     '#0E1320',
          gray:    '#8E8E92',
          line:    '#E2E5EA',
          bg:      '#F4F6F8',
          warm:    '#FAFAF7',
          success: '#2E8B57',
          warning: '#E0A33E',
          danger:  '#C8453B',
        },
      },
      fontFamily: {
        sans:  ['Poppins', 'system-ui', 'sans-serif'],
        serif: ['Poppins', 'system-ui', 'sans-serif'],
        mono:  ['"JetBrains Mono"', 'ui-monospace', 'Menlo', 'monospace'],
      },
      borderRadius: {
        xs: '4px', sm: '6px', md: '8px', lg: '12px', xl: '16px',
      },
      boxShadow: {
        'clubup-card':    '0 1px 2px rgba(14,19,32,0.06)',
        'clubup-popover': '0 4px 14px rgba(14,19,32,0.08)',
        'clubup-modal':   '0 16px 40px rgba(14,19,32,0.16)',
      },
      transitionTimingFunction: {
        clubup: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      },
    },
  },
};
