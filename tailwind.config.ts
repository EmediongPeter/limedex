import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Brand colors
        'primary': '#a78bfa',
        'primary-purple': '#a78bfa',
        'light-purple': '#c4b5fd',
        'button-hover': '#8b5cf6',
        'border-color': '#e5e7eb',
        
        // Uniswap-inspired dark mode colors
        'charcoal': {
          DEFAULT: '#191B1F',
          50: '#F5F6F7',
          100: '#E2E3E8',
          200: '#C5C8D0',
          300: '#A7ABB9',
          400: '#888FA1',
          500: '#6B7280', // Text gray
          600: '#4D5463',
          700: '#2E3747',
          800: '#131A2A', // Card backgrounds
          900: '#0D111C', // Main background
          950: '#080B11', // Deepest background
        },
        
        // For transitions between states
        'slate': {
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        'lg': '0.625rem', // 10px
        'xl': '1rem', // 16px
        '2xl': '1.25rem', // 20px
      },
      backdropBlur: {
        'xs': '2px',
      },
      animation: {
        'float': 'float 12s ease-in-out infinite',
        'float-reverse': 'float 10s ease-in-out infinite reverse',
      },
    },
  },
  plugins: [require('daisyui')],
}
export default config
