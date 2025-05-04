import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Tiendia',
        short_name: 'Tiendia',
        description: 'Tiendia - Your online store',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'logoblanco.svg', // Use existing vite.svg as placeholder
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: 'logoblanco.svg', // Use existing vite.svg as placeholder
            sizes: '512x512',
            type: 'image/svg+xml'
          },
          {
            src: 'logoblanco.svg', // Use existing vite.svg as placeholder
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      // Redirige todas las solicitudes que comiencen con /api
      '/api': {
        target: 'https://api.tiendia.app/api', // La URL de tu backend
        changeOrigin: true, // Necesario para evitar problemas de CORS
        secure: false, // Si tu backend usa HTTPS, cámbialo a true
        rewrite: (path) => path.replace(/^\/api/, ''), // Elimina el prefijo /api
      },
    },
  },
})
