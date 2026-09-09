// ============================================================
// PWA INIT — basado en el template de la cátedra
// ============================================================
// Registra el Service Worker y gestiona el ciclo de vida de la
// PWA. Incluido al final del <body>, después del resto de scripts.
//
// Único cambio respecto al template: se registra 'sw.js' (ruta
// relativa) en lugar de '/sw.js' (ruta absoluta). El template
// preconfigurado asume que la app se sirve desde la raíz del
// dominio; como este proyecto se publica en GitHub Pages bajo
// /ComicDBSQ/, una ruta absoluta apuntaría a un sw.js inexistente
// en la raíz del dominio y el registro fallaría en producción.
// ============================================================

(function () {
  'use strict';

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('sw.js')
        .then(registration => {
          console.log('[PWA] Service Worker registrado correctamente.');
          console.log('[PWA] Scope:', registration.scope);

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
