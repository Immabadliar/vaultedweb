import { defineConfig } from 'vite'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages safe: relative asset paths work whether served from / or /<repo>/.
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    copyPublicDir: true,
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
})
