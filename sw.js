// ============================================================
// SERVICE WORKER — ComicDBSQ
// Basado en el template de la cátedra (estrategia Cache First
// para el shell estático + Network Only para la API).
// ============================================================

const CACHE_NAME = 'comicdbsq-shell-v5';

// Recursos estáticos del shell. Las rutas son relativas al
// propio sw.js: así funcionan tanto en local (raíz del proyecto)
// como publicadas en GitHub Pages bajo /ComicDBSQ/, sin tener que
// tocar este archivo al cambiar de entorno.
const RECURSOS_SHELL = [
  './',
  './index.html',
  './css/styles.css',
  './css/img/app-background.jpg',
  './css/img/logo-hero.png',
  './css/img/logo-navbar.png',
  './js/config.js',
  './js/security.js',
  './js/api.js',
  './js/storage.js',
  './js/toast.js',
  './js/connection-status.js',
  './js/router.js',
  './js/app.js',
  './js/pwa-init.js',
  './js/views/home.js',
  './js/views/search.js',
  './js/views/detail.js',
  './js/views/wishlist.js',
  './js/views/history.js',
  './js/views/contact.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

// ── INSTALACIÓN ──────────────────────────────────────────────
self.addEventListener('install', event => {
  console.log('[SW] Instalando Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Cacheando recursos del shell');
        return cache.addAll(RECURSOS_SHELL);
      })
      .then(() => self.skipWaiting())
  );
});

// ── ACTIVACIÓN ───────────────────────────────────────────────
self.addEventListener('activate', event => {
  console.log('[SW] Activando Service Worker...');
  event.waitUntil(
    caches.keys()
      .then(nombres => Promise.all(
        nombres
          .filter(nombre => nombre !== CACHE_NAME)
          .map(nombre => {
            console.log('[SW] Eliminando caché anterior:', nombre);
            return caches.delete(nombre);
          })
      ))
      .then(() => self.clients.claim())
  );
});

// ── INTERCEPTACIÓN DE PETICIONES ─────────────────────────────
// - Peticiones al proxy propio (/api/...) o a dominios externos:
//   Network Only, para no servir datos de cómics desactualizados.
// - Recursos estáticos del shell: Cache First.
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') {
    return;
  }

  const esPeticionApi = url.pathname.includes('/api/');
  const esOrigenExterno = url.origin !== self.location.origin;

  if (esPeticionApi || esOrigenExterno) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({ error: 'Sin conexión. Los datos no están disponibles offline.' }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }

  event.respondWith(
    caches.match(request)
      .then(respuestaCacheada => {
        if (respuestaCacheada) {
          return respuestaCacheada;
        }

        return fetch(request)
          .then(respuestaRed => {
            if (!respuestaRed || respuestaRed.status !== 200 || respuestaRed.type !== 'basic') {
              return respuestaRed;
            }

            const copiaRespuesta = respuestaRed.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, copiaRespuesta);
            });

            return respuestaRed;
          })
          .catch(() => {
            if (request.destination === 'document') {
              return caches.match('./index.html');
            }
          });
      })
  );
});
