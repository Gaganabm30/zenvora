/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        zenvora: {
          50: '#F3E8FF',
          100: '#E9D5FF',
          200: '#DDD6FE',
          300: '#C084FC',
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6D28D9',
          bg: '#F9F5FF',
          glass: 'rgba(255, 255, 255, 0.45)',
          border: 'rgba(221, 214, 254, 0.5)'
        }
      },
      fontFamily: {
        sans: ['Inter', 'Poppins', 'Satoshi', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(124, 58, 237, 0.08)',
        'glass-glow': '0 8px 32px 0 rgba(139, 92, 246, 0.15), 0 0 20px 0 rgba(192, 132, 252, 0.1) inset',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-subtle': 'pulseSubtle 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '0.8', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.02)' },
        }
      }
    },
  },
  plugins: [],
}
