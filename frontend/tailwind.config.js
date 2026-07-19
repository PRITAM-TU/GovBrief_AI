/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        glass: 'rgba(255,255,255,0.05)',
        'glass-md': 'rgba(255,255,255,0.08)',
        'glass-lg': 'rgba(255,255,255,0.12)',
        'border-glass': 'rgba(255,255,255,0.1)',
        'border-glass-lg': 'rgba(255,255,255,0.2)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backdropBlur: {
        xs: '2px',
        glass: '20px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 6s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(20px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        glow: { '0%': { boxShadow: '0 0 5px rgba(255,255,255,0.1)' }, '100%': { boxShadow: '0 0 20px rgba(255,255,255,0.3)' } },
        float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
      },
      boxShadow: {
        glass: '0 8px 32px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.08)',
        'glass-hover': '0 16px 48px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.15)',
        glow: '0 0 30px rgba(255,255,255,0.15)',
      },
    },
  },
  plugins: [],
}
