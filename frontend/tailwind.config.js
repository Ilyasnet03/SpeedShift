/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        carbon: '#0E0F11',
        ink: '#191B1F',
        stone: '#C8C4BC',
        ember: '#D94A2B',
        smoke: '#F4F2EE'
      },
      fontFamily: {
        display: ['Barlow Condensed', 'sans-serif'],
        sans: ['Inter', 'sans-serif']
      },
      boxShadow: {
        soft: '0 10px 30px rgba(0,0,0,0.12)'
      }
    }
  },
  plugins: []
};
