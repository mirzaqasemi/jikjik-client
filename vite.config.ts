import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  server: {
    watch: {
      usePolling: true,
    },
  },
  resolve: {
    preserveSymlinks: true,
    alias: {
      scheduler: 'scheduler/index.js',
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'scheduler'],
    rolldownOptions: {
      resolve: {
        mainFields: ['module', 'main'],
      },
    },
  },
  plugins: [react()],
})
