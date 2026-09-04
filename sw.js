const CACHE_NAME = 'comicdb-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/css/img/app-background.jpg',
  '/js/config.js',
  '/js/api.js',
  '/js/storage.js',
  '/js/router.js',
  '/js/app.js',
  '/js/views/home.js',
  '/js/views/search.js',
  '/js/views/detail.js',
  '/js/views/wishlist.js',
  '/js/views/history.js',
  '/js/views/contact.js',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.origin !== location.origin) {
    return;
  }

  if (request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(request).then((response) => {
      if (response) {
        return response;
      }

      return fetch(request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });

        return response;
      }).catch(() => {
        return caches.match('/index.html').then((response) => {
          return response || new Response(
            '<!DOCTYPE html><html><body><h1>Offline</h1><p>No hay conexión a internet</p></body></html>',
            { headers: { 'Content-Type': 'text/html' } }
          );
        });
      });
    })
  );
});
