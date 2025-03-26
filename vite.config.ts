import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      // Redirige todas las solicitudes que comiencen con /api
      '/api': {
        target: 'https://ecommerceplantilla-back.fileit-contact.workers.dev/api', // La URL de tu backend
        changeOrigin: true, // Necesario para evitar problemas de CORS
        secure: false, // Si tu backend usa HTTPS, cámbialo a true
        rewrite: (path) => path.replace(/^\/api/, ''), // Elimina el prefijo /api
      },
    },
  },
})
