/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: 'var(--brand-primary, #0f766e)',
          accent: 'var(--brand-accent, #0d9488)',
          'primary-light': 'var(--brand-primary-light, rgba(15, 118, 110, 0.1))',
          'accent-light': 'var(--brand-accent-light, rgba(13, 148, 136, 0.1))',
        },
      },
    },
  },
  plugins: [],
};
