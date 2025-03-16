import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          '50': '#fdf4ff',
          '100': '#fae8ff',
          '200': '#f5d0fe',
          '300': '#f0abfc',
          '400': '#e879f9',
          '500': '#d946ef',
          '600': '#c026d3',
          '700': '#a21caf',
          '800': '#86198f',
          '900': '#701a75',
          '950': '#4a044e',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)'],
      },
    },
  },
  plugins: [],
}
export default config