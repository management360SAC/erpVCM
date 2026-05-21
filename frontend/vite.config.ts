// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: Number(process.env.VITE_PORT || 5173),
    allowedHosts: ['crm.vcm.com.pe', 'localhost', '95.216.168.66'],
    proxy: {
      '/api': {
        target: 'http://backend:8080',  // 👈 Usa el nombre del servicio Docker
        changeOrigin: true,
        secure: false,
      },
    },
  },
})