import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // KaaS Brand Colors - extending, not replacing
        brand: {
          primary: "#2563eb", // blue-600
          secondary: "#3730a3", // indigo-800
          accent: "#06b6d4", // cyan-500
        },
        // Status Colors for test results
        status: {
          success: "#059669", // emerald-600
          warning: "#d97706", // amber-600
          error: "#dc2626", // red-600
          info: "#0284c7", // sky-600
        },
        // Surface Colors for cards and panels
        surface: {
          primary: "#ffffff",
          secondary: "#f8fafc", // slate-50
          tertiary: "#f1f5f9", // slate-100
        },
      },
      fontFamily: {
        // Add font families while keeping existing ones
        display: ['Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Monaco', 'Consolas', 'monospace'],
      },
      fontSize: {
        // Typography scale - extending existing sizes
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        // Display sizes
        'display-sm': ['2.25rem', { lineHeight: '2.5rem', fontWeight: '700' }],
        'display-md': ['3rem', { lineHeight: '3.5rem', fontWeight: '700' }],
        'display-lg': ['4rem', { lineHeight: '4.5rem', fontWeight: '800' }],
      },
      spacing: {
        // Additional spacing values
        '18': '4.5rem',
        '88': '22rem',
      },
      borderRadius: {
        // Additional border radius values
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        // Enhanced shadow system
        'soft': '0 2px 8px 0 rgba(0, 0, 0, 0.05)',
        'medium': '0 4px 16px 0 rgba(0, 0, 0, 0.1)',
        'strong': '0 8px 32px 0 rgba(0, 0, 0, 0.15)',
      },
    },
  },
  plugins: [],
} satisfies Config;
