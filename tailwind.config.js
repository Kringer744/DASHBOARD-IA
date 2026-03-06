/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#09090f',
          secondary: '#0f0f1a',
          card: '#13131f',
          elevated: '#1a1a2e',
          hover: '#1f1f30',
          border: '#ffffff10',
        },
        brand: {
          50: '#e6f9ff',
          100: '#b3efff',
          200: '#80e5ff',
          300: '#4ddbff',
          400: '#00c3f0',
          500: '#00aed6',
          600: '#0099bc',
          700: '#007a96',
          800: '#005c70',
          900: '#003d4a',
        },
        accent: {
          blue: '#3b82f6',
          green: '#10b981',
          yellow: '#f59e0b',
          red: '#ef4444',
          pink: '#ec4899',
          cyan: '#06b6d4',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'card-gradient': 'linear-gradient(135deg, rgba(0,174,214,0.1) 0%, rgba(13,93,165,0.05) 100%)',
        'purple-glow': 'radial-gradient(ellipse at 50% 0%, rgba(0,174,214,0.15) 0%, transparent 70%)',
      },
      boxShadow: {
        'card': '0 4px 24px rgba(0,0,0,0.4)',
        'glow': '0 0 20px rgba(0,174,214,0.3)',
        'glow-sm': '0 0 10px rgba(0,174,214,0.2)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
