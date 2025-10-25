import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const rootDir = path.resolve(__dirname, 'ui');
const outDir = path.resolve(__dirname, 'out');
const tailwindConfig = path.resolve(__dirname, '..', '..', 'tailwind.config.cjs');
const postcssConfig = path.resolve(rootDir, 'postcss.config.cjs');

if (!process.env.TAILWIND_CONFIG) {
  process.env.TAILWIND_CONFIG = tailwindConfig;
}

if (!process.env.POSTCSS_CONFIG) {
  process.env.POSTCSS_CONFIG = postcssConfig;
}

export default defineConfig(({ command }) => ({
  root: rootDir,
  base: command === 'build' ? './' : '/',
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
