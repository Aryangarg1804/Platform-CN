/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
theme: {
    extend: {
      fontFamily: {
        // This sets our new 'EB Garamond' as the default serif font
        serif: ['var(--font-garamond)', 'serif'],
        // This creates a new 'font-magic' class for 'Cinzel Decorative'
        magic: ['var(--font-cinzel)', 'cursive'],
      },
      // Adding a text shadow utility for the glow effect
      textShadow: {
        'glow-amber': '0 0 10px rgba(251, 191, 36, 0.7), 0 0 20px rgba(217, 119, 6, 0.5)',
      },
    },
  },
  plugins: [],
};