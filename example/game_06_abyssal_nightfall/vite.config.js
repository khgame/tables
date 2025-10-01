const Path = require('path');
const { defineConfig } = require('vite');

const outDir = Path.resolve(__dirname, 'out');

module.exports = defineConfig({
  root: outDir,
  publicDir: false,
  server: {
    open: true,
    host: '0.0.0.0',
    port: 8086,
    fs: {
      strict: true,
      allow: [outDir]
    }
  },
  optimizeDeps: {
    disabled: true
  },
  build: {
    outDir,
    emptyOutDir: false,
    rollupOptions: {
      input: Path.join(outDir, 'index.html')
    }
  }
});
