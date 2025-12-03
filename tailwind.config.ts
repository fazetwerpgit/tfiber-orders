import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // T-Mobile Magenta
        magenta: {
          DEFAULT: '#E20074',
          50: 'rgba(226, 0, 116, 0.1)',
          100: 'rgba(226, 0, 116, 0.2)',
          200: 'rgba(226, 0, 116, 0.3)',
          300: 'rgba(226, 0, 116, 0.5)',
          400: 'rgba(226, 0, 116, 0.7)',
          500: '#E20074',
          600: '#B8005C',
          700: '#8A0045',
          800: '#5C002E',
          900: '#2E0017',
          light: '#FF4DA6',
          dark: '#B8005C',
        },
        // Secondary Teal
        teal: {
          DEFAULT: '#00D9D9',
          light: '#33E6E6',
          dark: '#00A3A3',
        },
        // Semantic Colors
        success: {
          DEFAULT: '#10B981',
          light: '#34D399',
          dark: '#059669',
          bg: {
            light: '#D1FAE5',
            dark: 'rgba(16, 185, 129, 0.15)',
          },
        },
        warning: {
          DEFAULT: '#F59E0B',
          light: '#FBBF24',
          dark: '#D97706',
          bg: {
            light: '#FEF3C7',
            dark: 'rgba(245, 158, 11, 0.15)',
          },
        },
        error: {
          DEFAULT: '#EF4444',
          light: '#F87171',
          dark: '#DC2626',
          bg: {
            light: '#FEE2E2',
            dark: 'rgba(239, 68, 68, 0.15)',
          },
        },
        info: {
          DEFAULT: '#3B82F6',
          light: '#60A5FA',
          dark: '#2563EB',
          bg: {
            light: '#DBEAFE',
            dark: 'rgba(59, 130, 246, 0.15)',
          },
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Courier New', 'monospace'],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],      // 12px/16px
        sm: ['0.875rem', { lineHeight: '1.25rem' }],   // 14px/20px
        base: ['1rem', { lineHeight: '1.5rem' }],      // 16px/24px
        lg: ['1.125rem', { lineHeight: '1.75rem' }],   // 18px/28px
        xl: ['1.25rem', { lineHeight: '1.75rem' }],    // 20px/28px
        '2xl': ['1.5rem', { lineHeight: '2rem' }],     // 24px/32px
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px/36px
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],  // 36px/40px
        '5xl': ['3rem', { lineHeight: '1' }],          // 48px/48px
        '6xl': ['3.75rem', { lineHeight: '1' }],       // 60px/60px
      },
      screens: {
        xs: '390px',
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      },
      spacing: {
        '18': '4.5rem',  // 72px
        '88': '22rem',   // 352px
        '100': '25rem',  // 400px
      },
      borderRadius: {
        '4xl': '2rem',    // 32px
      },
      boxShadow: {
        // Dark mode shadows
        'dark-sm': '0 1px 2px rgba(0, 0, 0, 0.5), 0 1px 3px rgba(0, 0, 0, 0.4)',
        'dark-md': '0 4px 6px rgba(0, 0, 0, 0.4), 0 2px 4px rgba(0, 0, 0, 0.3)',
        'dark-lg': '0 8px 16px rgba(0, 0, 0, 0.5), 0 4px 8px rgba(0, 0, 0, 0.4)',
        'dark-xl': '0 20px 25px rgba(0, 0, 0, 0.6), 0 10px 15px rgba(0, 0, 0, 0.5)',
        'dark-2xl': '0 25px 50px rgba(0, 0, 0, 0.7), 0 12px 24px rgba(0, 0, 0, 0.6)',
        // Glow effects
        'glow-magenta': '0 0 20px rgba(226, 0, 116, 0.3), 0 0 40px rgba(226, 0, 116, 0.15)',
        'glow-magenta-lg': '0 0 30px rgba(226, 0, 116, 0.4), 0 0 60px rgba(226, 0, 116, 0.2)',
        'glow-success': '0 0 20px rgba(16, 185, 129, 0.3), 0 0 40px rgba(16, 185, 129, 0.15)',
      },
      transitionDuration: {
        '0': '0ms',
        '150': '150ms',
        '200': '200ms',
        '250': '250ms',
      },
      transitionTimingFunction: {
        'in-out-custom': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      animation: {
        'shimmer': 'shimmer 1.5s infinite',
        'fade-in': 'fadeIn 200ms ease-out',
        'slide-up': 'slideUp 300ms ease-out',
        'slide-down': 'slideDown 300ms ease-out',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
};

export default config;
