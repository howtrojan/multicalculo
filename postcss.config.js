// postcss.config.js
// Este arquivo usa a sintaxe CommonJS (module.exports)
// e os plugins de PostCSS esperados pela v3 do Tailwind CSS

module.exports = {
  plugins: {
    // O plugin do Tailwind CSS para a v3 é referenciado assim:
    tailwindcss: {},
    // E o Autoprefixer, que é geralmente usado junto:
    autoprefixer: {},
  },
};