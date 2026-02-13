import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      devOptions: {
        enabled: false, // Dev'de SW importScripts hatasını önler; PWA'yı production'da test edin
        type: 'module',
        navigateFallback: '/index.html',
      },
      includeAssets: ['favicon.png', 'pwa-192.png', 'pwa-512.png'],
      manifest: {
        id: '/',
        name: 'Düzen — Günlük Hedef Takibi',
        short_name: 'Düzen',
        description: 'Günlük hedeflerini takip et. Su, egzersiz, alışkanlıklar.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#0c0c0c',
        theme_color: '#0c0c0c',
        orientation: 'portrait-primary',
        lang: 'tr',
        icons: [
          { src: '/pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: '/index.html',
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
