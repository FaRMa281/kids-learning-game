import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// base './' — все пути относительные: сборка работает и в корне домена, и в подкаталоге (GitHub Pages)
export default defineConfig(({ mode }) => ({
  base: process.env.VITE_BASE || './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Острова знаний',
        short_name: 'Острова',
        description: 'Детская обучающая игра: буквы, цифры, цвета, картинки, раскраски',
        lang: 'ru',
        start_url: '.',
        scope: '.',
        display: 'fullscreen',
        orientation: 'landscape',
        background_color: '#4cc9f0',
        theme_color: '#1c7fc4',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // всё, что собрал Vite (JS/CSS/шрифты/иконки) — в precache: игра открывается офлайн
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts', expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
          {
            // прогресс: сначала сеть, без сети — последний ответ из кэша
            urlPattern: ({ url }) => url.pathname.includes('/progress'),
            handler: 'NetworkFirst',
            options: { cacheName: 'api', networkTimeoutSeconds: 4, expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 } },
          },
        ],
      },
      devOptions: { enabled: false }, // в dev service worker не нужен (мешает HMR)
    }),
  ],
  server: {
    host: mode === 'lan' ? '0.0.0.0' : '127.0.0.1', // `npm run dev:lan` — открыть для телефона в той же сети
    port: 3001,
    strictPort: true,
  },
  build: {
    target: 'es2019', // старые мобильные Safari/Chrome
    sourcemap: false,
  },
}))
