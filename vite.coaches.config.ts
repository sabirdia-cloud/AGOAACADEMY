import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { writeFileSync, renameSync, existsSync } from 'fs';

// Vite config dedicated to building the Coaches Mobile App
// Output goes to dist-coaches-mobile/ which Capacitor uses as webDir
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: './',
    plugins: [
      react(),
      tailwindcss(),
      // Rename output HTML to index.html for Capacitor compatibility
      {
        name: 'rename-html-output',
        closeBundle() {
          const from = path.resolve(__dirname, 'dist-coaches-mobile/index.coaches.html');
          const to = path.resolve(__dirname, 'dist-coaches-mobile/index.html');
          if (existsSync(from)) {
            renameSync(from, to);
          }
        },
      },
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'import.meta.env.VITE_APP_MODE': JSON.stringify('COACHES_MOBILE'),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      outDir: 'dist-coaches-mobile',
      emptyOutDir: true,
      rollupOptions: {
        input: path.resolve(__dirname, 'index.coaches.html'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
