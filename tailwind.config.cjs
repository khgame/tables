const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  content: [
    './example/game_07_skill_gomoku/ui/index.html',
    './example/game_07_skill_gomoku/ui/src/**/*.{ts,tsx,js,jsx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Ma Shan Zheng"', 'cursive', ...defaultTheme.fontFamily.sans],
        body: ['"Noto Sans SC"', 'sans-serif', ...defaultTheme.fontFamily.sans]
      },
      colors: {
        midnight: '#0b1220',
        'board-amber': '#e7c693'
      },
      boxShadow: {
        'board-glow': '0 26px 46px rgba(37, 23, 8, 0.38)',
        'card-hover': '0 18px 30px rgba(0, 0, 0, 0.32)'
      }
    }
  },
  plugins: []
};
