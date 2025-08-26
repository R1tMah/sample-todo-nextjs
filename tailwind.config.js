/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {},
    },
    plugins: [require('daisyui')],
    daisyui: {
        themes: ['light'],
    },
    extend: {
        fontFamily: {
        georgia: ['Georgia', 'Times New Roman', 'Times', 'serif'],
        helvetica: ['Helvetica', 'Arial', 'sans-serif'], // Arial fallback for Windows
      },
        fontFamily: {
        task: ['var(--font-task-body)'],    // descriptions / general text
        tasktitle: ['var(--font-task-title)'], // titles
      },
          fontFamily: {
    task: ['P22UndergroundTitlingB', 'sans-serif'],
  },
        fontFamily: { bethellen: ['"Beth Ellen"', 'cursive'] },
  fontFamily: {
    sans: ['var(--font-gotham)'],
    heading: ['var(--font-sens-serif)'],
  },
  colors: {
    sens: {
      ink: '#0F172A',
      accent: '#6B7280',
      cream: '#F8F5F0',
      primary: '#1E293B',
    },
  },
}
};

