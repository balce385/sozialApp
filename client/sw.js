// Service Worker – ermöglicht Offline-Nutzung und App-Installation

const CACHE_NAME = 'sozialapp-v4';
const STATIC_ASSETS = [
  '/',
  '/research.html',
  '/style.css',
  '/research.css',
  '/research.js',
  '/config.js',
  '/darkmode.js',
  '/manifest.json',
  '/assets/icon.svg',
  '/assets/icon-192.png',
  '/assets/icon-512.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // API-Anfragen immer online
  if (url.pathname.startsWith('/api/')) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      const network = fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
