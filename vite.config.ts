///<reference types="vitest" />
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],

  clearScreen: false,

  build: {
    outDir: 'lib',
    assetsDir: 'app',
    emptyOutDir: false,
  },

  server: {
    port: 50000,
    proxy: {
      '/api': {
        target: 'http://localhost:50001',
        ws: true,
      },
    },
  },

  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
  },
})
