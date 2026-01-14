import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Dev-only proxy to avoid browser CORS when calling the PHP API.
    // Browser calls:   http://localhost:5173/api/...
    // Vite forwards to http://localhost:8888/reactauth-api/api/...
    proxy: {
      '/api': {
        target: 'http://localhost:8888/reactauth-api',
        changeOrigin: true,
      },
    },
  },
})
