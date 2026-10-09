/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        // Latin display / body (unchanged keys so existing classes keep working)
        primary: ["var(--font-montserrat)", "system-ui", "sans-serif"],
        secondary: ["var(--font-roboto)", "system-ui", "sans-serif"],
        // Arabic. Applied document-wide via html[lang="ar"] in globals.css.
        arabic: ["var(--font-arabic)", "system-ui", "sans-serif"],
      },
      container: {
        center: true,
        padding: {
          DEFAULT: "1rem",
          sm: "2rem",
          lg: "3rem",
        },
        screens: {
          "2xl": "1360px",
        },
      },
      colors: {
        // Semantic keys kept from the original theme, re-pointed to the marble
        // brand so existing markup re-skins without being rewritten.
        primary: '#1E1B18',
        secondary: '#9C7A54',
        productBorder: '#E4DCCF',
        productTitle: '#1E1B18',
        productPrice: '#1E1B18',

        // Marble brand palette: warm alabaster ground, deep warm ink,
        // bronze accent, deep verde for depth. Deliberately not black + gold.
        ink: {
          DEFAULT: '#1E1B18',
          soft: '#4A443D',
          muted: '#7C7268',
        },
        sand: {
          50: '#FBF9F6',
          100: '#F6F2EC',
          200: '#EFE9E0',
          300: '#E4DCCF',
          400: '#D2C5B2',
        },
        bronze: {
          DEFAULT: '#9C7A54',
          soft: '#BCA083',
          deep: '#7A5E3F',
          wash: '#F3EBE1',
        },
        verde: {
          DEFAULT: '#35463C',
          soft: '#4F6357',
          wash: '#EAEEEA',
        },
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        stone: '0 1px 2px rgba(30,27,24,.04), 0 12px 32px -12px rgba(30,27,24,.14)',
        'stone-lg': '0 2px 4px rgba(30,27,24,.05), 0 28px 64px -24px rgba(30,27,24,.22)',
      },
      letterSpacing: {
        editorial: '0.18em',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'none' },
        },
      },
      animation: {
        'fade-up': 'fade-up .5s cubic-bezier(.22,.61,.36,1) both',
      },
    },
  },
  plugins: [],
}
