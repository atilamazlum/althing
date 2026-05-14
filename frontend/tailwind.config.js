/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        parchment: {
          DEFAULT: '#f1e8d4',
          dark: '#e6d9bb',
          light: '#f7f0dd',
        },
        ink: {
          DEFAULT: '#1a1612',
          soft: '#3a322a',
          faded: '#6a5f54',
        },
        oxblood: {
          DEFAULT: '#7a1f1f',
          deep: '#5c1717',
          bright: '#a82828',
        },
        stamp: '#8a2828',
      },
      fontFamily: {
        display: ['"DM Serif Display"', 'serif'],
        body: ['"Crimson Pro"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        paper: '0 1px 0 rgba(0,0,0,0.04), 0 4px 12px rgba(58,50,42,0.08)',
        deep: '0 2px 0 rgba(0,0,0,0.06), 0 12px 32px rgba(58,50,42,0.18)',
      },
    },
  },
  plugins: [],
};
