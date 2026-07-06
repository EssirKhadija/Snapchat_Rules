module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        snap: {
          yellow: '#FFFC00',
          bg:     '#f7f5f0',
          card:   '#ffffff',
          border: '#e8e4dc',
          muted:  '#9c9890',
          soft:   '#f0ede7',
          ink:    '#1a1a18',
        }
      },
      borderRadius: {
        '4xl': '2rem',
      }
    }
  },
  plugins: []
};