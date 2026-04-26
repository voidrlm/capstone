/** @type {import('tailwindcss').Config} */
export default {
  pharmalogsMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  corePlugins: {
    // Disable preflight to avoid conflicts with MUI
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        // PharmaLogs brand tokens
        navy: '#04080f',
        teal: '#00d4aa',
        'teal-bright': '#00ffcc',
        'teal-dim': 'rgba(0,212,170,0.12)',
        'mr-surface': '#0a1628',
        'mr-card': '#0d1d34',
        'mr-border': 'rgba(255,255,255,0.07)',
        'mr-text': '#dce8ff',
        'mr-muted': '#6b82a8',
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'sans-serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease forwards',
        'fade-in': 'fadeIn 0.4s ease forwards',
        glow: 'glow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0,212,170,0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(0,212,170,0.6)' },
        },
      },
    },
  },
  plugins: [],
}
