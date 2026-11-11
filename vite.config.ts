import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Served from https://<user>.github.io/skill-tree/ on GitHub Pages.
export default defineConfig({
  base: '/skill-tree/',
  plugins: [react(), tailwindcss()],
});
