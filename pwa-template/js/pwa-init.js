// ============================================================
// PWA INIT — Aplicaciones Móviles · Cátedra 2025-2026
// ============================================================
// Este archivo registra el Service Worker y gestiona el
// ciclo de vida de la PWA. NO es necesario modificarlo.
// Incluirlo al final de cada página HTML de tu aplicación.
// ============================================================

(function () {
  'use strict';

  // Registrar el Service Worker si el navegador lo soporta
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then(registration => {
          console.log('[PWA] Service Worker registrado correctamente.');
          console.log('[PWA] Scope:', registration.scope);

          // Verificar si hay una actualización disponible
          registration.addEventListener('updatefound', () => {
            const nuevoSW = registration.installing;
            nuevoSW.addEventListener('statechange', () => {
              if (nuevoSW.state === 'installed' &&
                  navigator.serviceWorker.controller) {
                console.log('[PWA] Nueva versión disponible. Recargá la página para actualizarla.');
              }
            });
          });
        })
        .catch(error => {
          console.error('[PWA] Error al registrar el Service Worker:', error);
        });
    });
  } else {
    console.warn('[PWA] Este navegador no soporta Service Workers. La app funcionará como web app convencional.');
  }

  // Capturar el evento de instalación para uso futuro
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    window._pwaInstallPrompt = event;
    console.log('[PWA] La aplicación puede ser instalada.');
  });

  window.addEventListener('appinstalled', () => {
    console.log('[PWA] ¡Aplicación instalada correctamente!');
    window._pwaInstallPrompt = null;
  });

})();
