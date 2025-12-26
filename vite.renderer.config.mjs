import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// https://vitejs.dev/config
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '.vite/renderer/main_window',
    rollupOptions: {
      input: {
        main_window: resolve(__dirname, 'index.html'),
      },
    },
  },
});
