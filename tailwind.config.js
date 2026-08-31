/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBase: '#0a0a14',
        charcoal: {
          900: '#0c0d1a',
          800: '#121224',
          700: '#1a1a2e',
          600: '#252542',
          500: '#343459'
        },
        cyan: {
          neon: '#00d9ff',
          glow: '#38e1ff',
          dark: '#00a8cc',
          muted: '#005b73',
          faint: 'rgba(0, 217, 255, 0.08)'
        },
        emerald: {
          neon: '#00ff41',
          glow: '#33ff66',
          dark: '#009926',
          faint: 'rgba(0, 255, 65, 0.1)'
        },
        crimson: {
          neon: '#ff4444',
          glow: '#ff6666',
          dark: '#b30000',
          faint: 'rgba(255, 68, 68, 0.1)'
        },
        amber: {
          neon: '#ffd166',
          faint: 'rgba(255, 209, 102, 0.1)'
        },
        textPrimary: '#ffffff',
        textSecondary: '#b0b0c0',
        textMuted: '#6f6f85'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'cyan-glow': '0 0 25px rgba(0, 217, 255, 0.4)',
        'cyan-glow-sm': '0 0 12px rgba(0, 217, 255, 0.3)',
        'cyan-glow-lg': '0 0 45px rgba(0, 217, 255, 0.55)',
        'emerald-glow': '0 0 25px rgba(0, 255, 65, 0.4)',
        'crimson-glow': '0 0 25px rgba(255, 68, 68, 0.4)',
        'glass-card': '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 4s ease-in-out infinite',
        'radar-sweep': 'radarSweep 3s linear infinite',
        'border-flow': 'borderFlow 8s ease infinite',
        'ticker': 'ticker 25s linear infinite'
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        radarSweep: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' }
        },
        borderFlow: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' }
        },
        ticker: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' }
        }
      }
    },
  },
  plugins: [],
}
