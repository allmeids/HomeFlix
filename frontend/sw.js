/**
 * HomeFlix Service Worker - Cache Purger
 * Garante que nenhuma versão obsoleta fique presa em cache no Chrome ou Smart TVs.
 */

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => caches.delete(key)));
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Sempre busca direto da rede para desenvolvimento e atualizações instantâneas
  event.respondWith(fetch(event.request));
});
