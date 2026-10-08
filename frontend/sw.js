/**
 * HomeFlix Service Worker
 * Caches essential static assets for fast offline shell loading on Smart TVs and Mobile devices.
 * Dynamic /api/ and media streaming requests are always bypassed directly to network.
 */

const CACHE_NAME = 'homeflix-static-v7.5';
const CORE_ASSETS = [
  '/',
  '/manifest.json',
  '/static/css/style.css?v=7.3',
  '/static/js/api.js?v=7.3',
  '/static/js/player.js?v=7.3',
  '/static/js/app.js?v=7.3',
  '/static/icons/icon-192.png',
  '/static/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[HomeFlix SW] Pre-caching offline shell');
      return cache.addAll(CORE_ASSETS).catch((err) => {
        console.warn('[HomeFlix SW] Pre-cache partial fail:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Nunca cachear chamadas de API, proxy ou streamings de vídeo
  if (url.pathname.startsWith('/api/') || 
      url.pathname.includes('.m3u8') || 
      url.pathname.includes('.ts') || 
      url.pathname.includes('.mp4')) {
    return;
  }

  // Apenas métodos GET
  if (event.request.method !== 'GET') {
    return;
  }

  // Stale-While-Revalidate para assets estáticos
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
