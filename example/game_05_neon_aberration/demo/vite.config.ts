import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  root: __dirname,
  publicDir: false,
  server: {
    host: '0.0.0.0',
    port: 5175,
    open: false,
    fs: {
      allow: [__dirname, path.resolve(__dirname, '..'), path.resolve(__dirname, '../out')]
    }
  },
  preview: {
    port: 5175,
    open: true
  },
  build: {
    outDir: path.resolve(__dirname, '../out/demo'),
    emptyOutDir: true
  }
});
