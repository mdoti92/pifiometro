import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Pifiómetro',
        short_name: 'Pifiómetro',
        description: 'Pronósticos de fútbol uruguayo entre grupos de amigos',
        theme_color: '#12140f',
        background_color: '#12140f',
        display: 'standalone',
        start_url: '/',
        icons: [],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
})
