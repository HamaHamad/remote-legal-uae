/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        body: ['"DM Sans"', 'system-ui', 'sans-serif'],
        arabic: ['"Noto Naskh Arabic"', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        gold: {
          50:  '#fdf9ed',
          100: '#faf0cc',
          200: '#f5de94',
          300: '#f0ca5a',
          400: '#eab830',
          500: '#d99d18',
          600: '#bc7a10',
          700: '#955b10',
          800: '#7a4714',
          900: '#673c16',
          950: '#3c1f09',
        },
        navy: {
          50:  '#f0f4ff',
          100: '#dce6ff',
          200: '#c0d0ff',
          300: '#94afff',
          400: '#6282ff',
          500: '#3d55fb',
          600: '#2836f0',
          700: '#2129dd',
          800: '#1f23b3',
          900: '#1e238c',
          950: '#0d0f2e',
        },
        slate: {
          950: '#0a0c14',
        }
      },
      backgroundImage: {
        'grid-pattern': "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
        'gold-shimmer': 'linear-gradient(135deg, #d99d18 0%, #f0ca5a 40%, #d99d18 60%, #bc7a10 100%)',
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-in-right': 'slideInRight 0.4s ease-out',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          from: { opacity: '0', transform: 'translateX(20px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(217, 157, 24, 0.3)' },
          '50%': { boxShadow: '0 0 0 12px rgba(217, 157, 24, 0)' },
        },
        shimmer: {
          from: { backgroundPosition: '-200% 0' },
          to: { backgroundPosition: '200% 0' },
        },
      },
      boxShadow: {
        'gold': '0 0 30px rgba(217, 157, 24, 0.15)',
        'gold-sm': '0 0 12px rgba(217, 157, 24, 0.1)',
        'panel': '0 4px 24px rgba(0,0,0,0.4)',
        'card': '0 2px 16px rgba(0,0,0,0.3)',
      }
    },
  },
  plugins: [],
}
