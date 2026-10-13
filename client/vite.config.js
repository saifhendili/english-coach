import basicSsl from '@vitejs/plugin-basic-ssl';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// Two ways to run the same app:
//   npm run dev        http://localhost:5180   for the computer: no certificate warning (localhost counts as secure)
//   npm run dev:phone  https://<address>:5181  for a phone: it only gives a page the microphone when the page is a
//                      "secure context", and plain http at a network address (http://192.168.x.x) is not one.
//                      The certificate is self-signed, so the phone shows a one-time warning.
// They can run side by side. Both forward /api to the server on port 4000.
export default defineConfig(({ mode }) => {
  const phone = mode === 'phone';

  return {
    plugins: [
      ...(phone ? [basicSsl()] : []),
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icons/apple-touch-icon.png'],
        manifest: {
          name: 'AI English Coach',
          short_name: 'English Coach',
          description: 'Practice spoken English with an AI coach that adapts to your level.',
          display: 'standalone',
          start_url: '/',
          theme_color: '#4f46e5',
          background_color: '#f8fafc',
          icons: [
            { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          // API calls must always hit the network, never the SPA fallback.
          navigateFallbackDenylist: [/^\/api/],
        },
      }),
    ],
    server: {
      host: true, // listen on the network too, so a phone on the same Wi-Fi can open it
      port: phone ? 5181 : 5180,
      strictPort: true,
      proxy: { '/api': 'http://localhost:4000' },
    },
  };
});
