/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-jakarta)', 'var(--font-telugu)', 'system-ui', 'sans-serif'],
        display: ['var(--font-jakarta)', 'var(--font-telugu)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        navy: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          200: '#bcccdc',
          300: '#9fb3c8',
          400: '#829ab1',
          500: '#627d98',
          600: '#486581',
          700: '#334e68',
          800: '#1e3a5f',
          900: '#0f243e',
          950: '#071120',
        },
        teal: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translate3d(0, 18px, 0) scale(0.985)' },
          '100%': { opacity: '1', transform: 'none' },
        },
        pageEnter: {
          '0%': {
            opacity: '0',
            transform: 'translate3d(0, 20px, 0) scale(0.99)',
            filter: 'blur(4px)',
          },
          '65%': {
            opacity: '1',
            filter: 'blur(0px)',
          },
          '100%': {
            opacity: '1',
            transform: 'none',
            filter: 'none',
          },
        },
        tabSwitch: {
          '0%': {
            opacity: '0',
            transform: 'translate3d(0, 12px, 0) scale(0.992)',
            filter: 'blur(2px)',
          },
          '100%': {
            opacity: '1',
            transform: 'none',
            filter: 'none',
          },
        },
        veilSweep: {
          '0%': {
            opacity: '0.85',
            transform: 'translate3d(0, -100%, 0) scaleY(1.1)',
          },
          '45%': {
            opacity: '0.45',
            transform: 'translate3d(0, 0%, 0) scaleY(1)',
          },
          '100%': {
            opacity: '0',
            transform: 'translate3d(0, 100%, 0) scaleY(0.9)',
          },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'translate3d(0, 10px, 0) scale(0.93)' },
          '70%': { opacity: '1', transform: 'translate3d(0, -1px, 0) scale(1.008)' },
          '100%': { opacity: '1', transform: 'none' },
        },
        modalSpring: {
          '0%': { opacity: '0', transform: 'translate3d(0, 24px, 0) scale(0.92)' },
          '65%': { opacity: '1', transform: 'translate3d(0, -2px, 0) scale(1.012)' },
          '100%': { opacity: '1', transform: 'none' },
        },
        slideRight: {
          '0%': { opacity: '0', transform: 'translate3d(-14px, 0, 0)' },
          '100%': { opacity: '1', transform: 'none' },
        },
        floatSlow: {
          '0%, 100%': { transform: 'translate3d(0, 0px, 0)' },
          '50%': { transform: 'translate3d(0, -7px, 0)' },
        },
        pulseRing: {
          '0%': { transform: 'scale(0.85)', opacity: '0.8' },
          '70%': { transform: 'scale(1.9)', opacity: '0' },
          '100%': { transform: 'scale(1.9)', opacity: '0' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        growWidth: {
          '0%': { width: '0%' },
        },
        orbDrift: {
          '0%, 100%': { transform: 'translate3d(0px, 0px, 0) scale(1)' },
          '33%': { transform: 'translate3d(22px, -16px, 0) scale(1.07)' },
          '66%': { transform: 'translate3d(-14px, 12px, 0) scale(0.96)' },
        },
        langSwap: {
          '0%': { opacity: '0.35', transform: 'translate3d(0, 6px, 0) scale(0.994)', filter: 'blur(2px)' },
          '100%': { opacity: '1', transform: 'none', filter: 'none' },
        },
        gradientX: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-4px)' },
          '75%': { transform: 'translateX(4px)' },
        },
      },
      animation: {
        'fade-up': 'fadeUp 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-up-fast': 'fadeUp 0.32s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'page-enter': 'pageEnter 0.58s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'tab-switch': 'tabSwitch 0.38s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'veil-sweep': 'veilSweep 0.52s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'scale-in': 'scaleIn 0.34s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'modal-spring': 'modalSpring 0.38s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-right': 'slideRight 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'float-slow': 'floatSlow 4.5s ease-in-out infinite',
        'orb-drift': 'orbDrift 10s ease-in-out infinite',
        'lang-swap': 'langSwap 0.32s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-ring': 'pulseRing 2s cubic-bezier(0.24, 0, 0.38, 1) infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
        'grow-width': 'growWidth 0.85s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'gradient-x': 'gradientX 6s ease infinite',
        'shake': 'shake 0.3s ease-in-out',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(15, 23, 42, 0.06), 0 4px 6px -4px rgba(15, 23, 42, 0.04)',
        'elevated': '0 12px 32px -4px rgba(15, 23, 42, 0.1), 0 4px 12px -2px rgba(15, 23, 42, 0.05)',
        'glow-teal': '0 0 24px -4px rgba(20, 184, 166, 0.35)',
        'glow-rose': '0 0 24px -4px rgba(225, 29, 72, 0.35)',
      },
    },
  },
  plugins: [],
};
