/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
    "./src/**/*.component.{html,ts}"
  ],
  theme: {
    extend: {
      colors: {
        // Egyptian-inspired color palette
        papyrus: {
          25: '#fefcf6',
          50: '#fdf9f0',
          100: '#f9f0e1',
          200: '#f2e0c3',
          300: '#eacea0',
          400: '#deb377',
          500: '#d19b54',
          600: '#c48742',
          700: '#a36e37',
          800: '#825732',
          900: '#6b472a',
        },
        sand: {
          25: '#fcfbf9',
          50: '#faf9f7',
          100: '#f4f1ed',
          200: '#e8e0d6',
          300: '#dccfbf',
          400: '#c4ad91',
          500: '#ac8b63',
          600: '#9b7c59',
          700: '#81674a',
          800: '#66523b',
          900: '#544230',
        },
        gold: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        hieroglyph: {
          50: '#f8f9fa',
          100: '#f1f3f4',
          200: '#e8eaed',
          300: '#dadce0',
          400: '#bdc1c6',
          500: '#9aa0a6',
          600: '#80868b',
          700: '#5f6368',
          800: '#3c4043',
          900: '#202124',
        },
        lapis: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        ankh: {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899',
          600: '#db2777',
          700: '#be185d',
          800: '#9d174d',
          900: '#831843',
        }
      },
      fontFamily: {
        'hieroglyphic': ['Papyrus', 'fantasy'],
        'ancient': ['Trajan Pro', 'serif'],
        'body': ['Inter', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        'egyptian': '0.75rem',
      },
      boxShadow: {
        'papyrus': '0 4px 6px -1px rgba(209, 155, 84, 0.1), 0 2px 4px -1px rgba(209, 155, 84, 0.06)',
        'hieroglyph': '0 10px 15px -3px rgba(32, 33, 36, 0.1), 0 4px 6px -2px rgba(32, 33, 36, 0.05)',
        'ankh': '0 20px 25px -5px rgba(236, 72, 153, 0.1), 0 10px 10px -5px rgba(236, 72, 153, 0.04)',
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 3s ease-in-out infinite',
        'scroll-hieroglyph': 'scroll-hieroglyph 20s linear infinite',
      },
      keyframes: {
        glow: {
          'from': { boxShadow: '0 0 20px rgba(245, 158, 11, 0.5)' },
          'to': { boxShadow: '0 0 30px rgba(245, 158, 11, 0.8), 0 0 40px rgba(245, 158, 11, 0.3)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'scroll-hieroglyph': {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        }
      }
    },
  },
  plugins: [],
}
