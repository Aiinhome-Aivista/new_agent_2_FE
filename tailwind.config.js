/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF5A14',
          button: '#FF7A45',
          hover: '#F56B2F',
          border: '#FF8A55',
          50: '#fff7f2',
          100: '#ffefe5',
          200: '#ffdacc',
          300: '#ffbaa3',
          400: '#ff8a55',
          500: '#FF5A14',
          600: '#F56B2F',
          700: '#d94300',
          800: '#b33600',
          900: '#8c2a00',
        },
        sidebar: {
          DEFAULT: '#4A4A4A',
          bg: '#4A4A4A',
        },
        brand: {
          primary: '#FF5A14',
          button: '#FF7A45',
          hover: '#F56B2F',
          sidebar: '#4A4A4A',
          bg: '#FFFFFF',
          inputBg: '#FFF7F2',
          lightBorder: '#D8D8D8',
          orangeBorder: '#FF8A55',
          textPrimary: '#666666',
          textSecondary: '#888888',
          placeholder: '#B0B0B0',
        },
      },
    },
  },
  plugins: [],
}
