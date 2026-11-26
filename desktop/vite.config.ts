import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    proxy: {
      '/api/v1': {
        target: 'https://api.sabilearn.online',
        changeOrigin: true,
        secure: true,
      },
      '/health': {
        target: 'https://api.sabilearn.online',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  build: {
    target: ['es2021', 'chrome105', 'safari15'],
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom', 'zustand'],
          'katex-vendor': ['katex'],
          'markdown-vendor': ['react-markdown', 'remark-gfm', 'rehype-sanitize'],
          'codemirror-vendor': [
            '@codemirror/view',
            '@codemirror/state',
            '@codemirror/commands',
            '@codemirror/language',
            '@codemirror/lang-python',
            '@codemirror/lang-javascript',
            '@codemirror/lang-html',
            '@codemirror/lang-css',
            '@codemirror/theme-one-dark',
          ],
        },
      },
    },
  },
  worker: {
    format: 'es',
  },
});
