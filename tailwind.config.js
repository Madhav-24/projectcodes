import defaultTheme from 'tailwindcss/defaultTheme';

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#0f4c81',
        secondary: '#f59e0b',
        surface: '#f8fafc',
        danger: '#dc2626',
        success: '#16a34a',
      },
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
      },
      boxShadow: {
        card: '0 10px 30px rgba(15, 76, 129, 0.08)',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
