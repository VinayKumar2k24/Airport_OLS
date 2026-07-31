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
        navy: {
          950: '#08131F',
          900: '#0a1929',
          800: '#0d2137',
          700: '#112840',
          600: '#163450',
          500: '#1a3f60',
        },
        cyan: {
          neon: '#00f5ff',
          glow: '#00d4ff',
          soft: '#38bdf8',
        },
        blue: {
          neon: '#0080ff',
          glow: '#1a6fff',
        },
      },
      backgroundImage: {
        'grid-pattern': "linear-gradient(rgba(0, 213, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 213, 255, 0.03) 1px, transparent 1px)",
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
      boxShadow: {
        'neon-cyan': '0 0 20px rgba(0, 245, 255, 0.3), 0 0 40px rgba(0, 245, 255, 0.1)',
        'neon-blue': '0 0 20px rgba(0, 128, 255, 0.3), 0 0 40px rgba(0, 128, 255, 0.1)',
        'neon-red': '0 0 20px rgba(239, 68, 68, 0.4)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        'card-hover': '0 16px 48px rgba(0, 0, 0, 0.5), 0 0 30px rgba(0, 200, 255, 0.1)',
      },
      animation: {
        'radar-spin': 'radarSpin 4s linear infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'pulse-neon': 'pulseNeon 2s ease-in-out infinite',
        'scan': 'scan 3s linear infinite',
        'float': 'float 3s ease-in-out infinite',
        'counter': 'counter 0.5s ease-out forwards',
      },
      keyframes: {
        radarSpin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        pulseNeon: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(0, 245, 255, 0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(0, 245, 255, 0.8), 0 0 60px rgba(0, 245, 255, 0.3)' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
