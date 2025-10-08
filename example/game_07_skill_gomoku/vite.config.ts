import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const rootDir = path.resolve(__dirname, 'ui');
const outDir = path.resolve(__dirname, 'out');

export default defineConfig(({ command }) => ({
  root: rootDir,
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 8090,
    open: true,
    fs: {
      strict: true,
      allow: [rootDir, outDir]
    }
  },
  publicDir: path.resolve(rootDir, 'public'),
  build: {
    outDir,
    emptyOutDir: false,
    rollupOptions: {
      input: path.resolve(rootDir, 'index.html')
    }
  }
}));
