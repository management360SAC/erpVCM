// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: Number(process.env.VITE_PORT || 5173),
    proxy: {
      '/api': {
        target: 'http://backend:8080',  // 👈 Usa el nombre del servicio Docker
        changeOrigin: true,
        secure: false,
      },
    },
  },
})