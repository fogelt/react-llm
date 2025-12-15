// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react()
  ],

  css: {
    postcss: path.resolve(__dirname, 'postcss.config.cjs'),
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  server: {
    port: 3000,
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    minify: true,
    sourcemap: false,
  },
});