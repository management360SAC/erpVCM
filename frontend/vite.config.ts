// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: Number(process.env.VITE_PORT || 5173),
    proxy: {
      // 1) Auth: reescribir /api/auth -> /auth
      '/api/auth': {
        target: 'http://backend:8080',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ''),
      },
      // 2) Todo lo demás en /api SIN reescritura (users, etc.)
      '/api': {
        target: 'http://backend:8080',
        changeOrigin: true,
      },
    },
  },
})
