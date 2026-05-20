import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: true,
    watch: {
      usePolling: true,
    },
    proxy: {
      "/api": {
        target: "https://localhost:8443",
        changeOrigin: true,
        secure: false,
        rewrite: path => path.replace(/^\/api/, "")
      }
    },
  },
  resolve: {
    preserveSymlinks: true,
    alias: {
      scheduler: 'scheduler/index.js',
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'scheduler', 'tslib'],
    rolldownOptions: {
      resolve: {
        mainFields: ['module', 'main'],
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    basicSsl(),
  ],
})
