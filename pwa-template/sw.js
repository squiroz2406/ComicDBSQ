// ============================================================
// SERVICE WORKER — Aplicaciones Móviles · Cátedra 2025-2026
// ============================================================
// Este archivo está preconfigurado por la cátedra.
// NO es necesario modificarlo para cumplir con la etapa PWA.
// Implementa una estrategia Cache First para los recursos
// estáticos del shell de la aplicación.
// ============================================================

const CACHE_NAME = 'app-shell-v1';

// Recursos estáticos que se cachean durante la instalación.
// Si tu aplicación tiene archivos adicionales (fuentes locales,
// imágenes propias, etc.), podés agregarlos a esta lista.
const RECURSOS_SHELL = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/app.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// ── INSTALACIÓN ──────────────────────────────────────────────
// Se ejecuta cuando el Service Worker se registra por primera
// vez o cuando el archivo sw.js cambió. Precachea los recursos
// del shell para habilitar el funcionamiento offline.
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
// Se ejecuta cuando el Service Worker toma el control.
// Elimina cachés de versiones anteriores para liberar espacio.
self.addEventListener('activate', event => {
  console.log('[SW] Activando Service Worker...');
  event.waitUntil(
    caches.keys()
      .then(nombres => {
        return Promise.all(
          nombres
            .filter(nombre => nombre !== CACHE_NAME)
            .map(nombre => {
              console.log('[SW] Eliminando caché anterior:', nombre);
              return caches.delete(nombre);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// ── INTERCEPTACIÓN DE PETICIONES ─────────────────────────────
// Estrategia Cache First para recursos estáticos:
// 1. Busca el recurso en el caché local.
// 2. Si está disponible, lo devuelve directamente (sin red).
// 3. Si no está en caché, lo solicita a la red y lo guarda
//    para futuras peticiones.
//
// Las peticiones a la API siempre van a la red (Network Only)
// para garantizar datos actualizados.
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Peticiones a APIs externas: siempre a la red
  // Modificá esta condición si tu API tiene un dominio distinto
  if (event.request.url.includes('/api/') ||
      !url.origin.includes(self.location.origin)) {

    // Para peticiones de API: Network Only
    // Si falla (sin conexión), no intentamos servir desde caché
    event.respondWith(
      fetch(event.request).catch(() => {
        // Respuesta de error amigable cuando no hay conexión
        return new Response(
          JSON.stringify({ error: 'Sin conexión. Los datos no están disponibles offline.' }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }

  // Para recursos estáticos: Cache First
  event.respondWith(
    caches.match(event.request)
      .then(respuestaCacheada => {
        if (respuestaCacheada) {
          return respuestaCacheada;
        }

        // No está en caché: solicitar a la red y guardar
        return fetch(event.request)
          .then(respuestaRed => {
            // Solo cachear respuestas válidas
            if (!respuestaRed || respuestaRed.status !== 200 ||
                respuestaRed.type !== 'basic') {
              return respuestaRed;
            }

            const copiaRespuesta = respuestaRed.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, copiaRespuesta);
            });

            return respuestaRed;
          })
          .catch(() => {
            // Sin conexión y sin caché: página de fallback
            if (event.request.destination === 'document') {
              return caches.match('/index.html');
            }
          });
      })
  );
});
