/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Deep Slate Blue design tokens
        brand: {
          primary: '#1F3A5F',
          dark: '#14263F',
          light: '#3E5C84',
          accent: '#2563EB',
          surface: '#F4F7FB',
          darkBg: '#0E1A2B',
          darkSurface: '#18283E',
          textLight: '#0F1B2D',
          textDark: '#E6ECF5',
        },
        // Centralized Risk Palette
        risk: {
          low: '#2E9E6B',
          moderate: '#E5B93C',
          high: '#E07B39',
          severe: '#C8383E',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.12)',
        'card': '0 4px 12px rgba(15, 27, 45, 0.05)',
      }
    },
  },
  plugins: [],
}
