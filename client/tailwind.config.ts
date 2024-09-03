const { fontFamily } = require('tailwindcss/defaultTheme')

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsla(var(--border), <alpha-value>)',
        input: 'hsla(var(--input), <alpha-value>)',
        ring: 'hsla(var(--ring), <alpha-value>)',
        background: 'hsla(var(--background), <alpha-value>)',
        foreground: 'hsla(var(--foreground), <alpha-value>)',
        primary: {
          DEFAULT: 'hsla(var(--primary), <alpha-value>)',
          foreground: 'hsla(var(--primary-foreground), <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'hsla(var(--secondary), <alpha-value>)',
          foreground: 'hsla(var(--secondary-foreground), <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'hsla(var(--destructive), <alpha-value>)',
          foreground: 'hsla(var(--destructive-foreground), <alpha-value>)',
        },
        muted: {
          DEFAULT: 'hsla(var(--muted), <alpha-value>)',
          foreground: 'hsla(var(--muted-foreground), <alpha-value>)',
        },
        accent: {
          DEFAULT: 'hsla(var(--accent), <alpha-value>)',
          foreground: 'hsla(var(--accent-foreground), <alpha-value>)',
        },
        popover: {
          DEFAULT: 'hsla(var(--popover), <alpha-value>)',
          foreground: 'hsla(var(--popover-foreground), <alpha-value>)',
        },
        card: {
          DEFAULT: 'hsla(var(--card), <alpha-value>)',
          foreground: 'hsla(var(--card-foreground), <alpha-value>)',
        },
      },
      borderRadius: {
        xl: 'calc(var(--radius) + 4px)',
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: 0 },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: 0 },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-out': {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        close: {
          from: { width: '20%' },
          to: { width: 0 },
        },
        open: {
          from: { width: 0 },
          to: { width: '20%' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(0)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.5s ease-in-out',
        'fade-out': 'fade-out 0.5s ease-in-out',
        close: 'close 0.2s ease-out',
        open: 'open 0.2s ease-out',
        message: 'slide-up 0.3s',
        thread: 'slide-down 0.3s',
      },
      fontFamily: {
        sora: ['var(--font-sora)', ...fontFamily.sans],
        montserrat: ['var(--font-montserrat)', ...fontFamily.sans],
      },
      container: {
        center: true,
        screens: {
          DEFAULT: '750px',
          sm: '750px',
          lg: '750px',
          xl: '750px',
          '2xl': '750px',
        },
      },
      screens: {
        'small-height': { raw: '(max-height: 800px)' },
        tablet: { raw: '(min-width: 1000px)' },
        medium: '1255px',
      },
      typography: ({ theme }: { theme: (data: string) => string }) => ({
        DEFAULT: {
          css: {
            '--tw-prose-body': theme('colors.foreground'),
            '--tw-prose-headings': theme('colors.foreground'),
            '--tw-prose-lead': theme('colors.foreground'),
            '--tw-prose-links': theme('colors.primary'),
            '--tw-prose-bold': theme('colors.primary'),
            '--tw-prose-counters': theme('colors.foreground'),
            '--tw-prose-bullets': theme('colors.foreground'),
            '--tw-prose-hr': theme('colors.foreground'),
            '--tw-prose-quotes': theme('colors.foreground'),
            '--tw-prose-quote-borders': theme('colors.foreground'),
            '--tw-prose-captions': theme('colors.foreground'),
            '--tw-prose-code': theme('colors.foreground'),
            '--tw-prose-pre-code': theme('colors.foreground'),
            '--tw-prose-pre-bg': theme('colors.foreground'),
            '--tw-prose-th-borders': theme('colors.foreground'),
            '--tw-prose-td-borders': theme('colors.foreground'),
          },
        },
      }),
    },
  },
  plugins: [require('tailwindcss-animate'), require('@tailwindcss/typography')],
}
