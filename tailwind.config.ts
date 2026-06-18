import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0f4ff',
          100: '#dde6ff',
          200: '#c3d1ff',
          300: '#9db2ff',
          400: '#7589fd',
          500: '#5562f8',
          600: '#3f43ed',
          700: '#3334d2',
          800: '#2b2ca9',
          900: '#292c86',
          950: '#181a4e',
        },
        surface: {
          0:   '#ffffff',
          50:  '#f8f9fc',
          100: '#f1f3f8',
          200: '#e4e7f0',
          300: '#cdd2e0',
          800: '#2a2d3a',
          900: '#1a1c28',
          950: '#11121c',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config
