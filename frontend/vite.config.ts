import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import inject from '@rollup/plugin-inject'

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
    'process.env': {},
  },
  resolve: {
    alias: {
      buffer: 'buffer/',
      process: 'process/browser.js',
      util: 'util',
      stream: 'stream-browserify',
    },
  },
  optimizeDeps: {
    include: ['buffer', 'process', 'util', 'stream-browserify'],
  },
  build: {
    rollupOptions: {
      plugins: [
        inject({
          Buffer: ['buffer', 'Buffer'], // ✅ this line creates Buffer before env.mjs runs
          process: 'process/browser.js',
        }),
      ],
    },
  },
})
