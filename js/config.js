// Configuración de ComicDB
// Nota: La API Key no se expone al cliente por seguridad
// Se maneja en el servidor Node.js

let CONFIG = {
  API_BASE_URL: 'https://comicvine.gamespot.com/api',
  PROXY_ENDPOINT: '/api/proxy',
  CONFIG_ENDPOINT: '/api/config',
  STORAGE_KEYS: {
    WISHLIST: 'comicdb_wishlist',
    HISTORY: 'comicdb_history',
  },
  // Valores por defecto (se sobrescriben desde servidor)
  RESULTS_PER_PAGE: 10,
  MAP_CENTER: [-34.9215, -57.9536],
  MAP_ZOOM: 15,
};

// Cargar configuración desde el servidor
const loadConfig = async () => {
  try {
    const response = await fetch(CONFIG.CONFIG_ENDPOINT);
    if (response.ok) {
      const serverConfig = await response.json();
      CONFIG.RESULTS_PER_PAGE = serverConfig.resultsPerPage || CONFIG.RESULTS_PER_PAGE;
      CONFIG.MAP_CENTER = serverConfig.mapCenter || CONFIG.MAP_CENTER;
      CONFIG.MAP_ZOOM = serverConfig.mapZoom || CONFIG.MAP_ZOOM;
      console.log('✅ Configuración cargada desde servidor');
    }
  } catch (error) {
    console.warn('⚠️  Error cargando configuración del servidor, usando valores por defecto:', error.message);
  }
};

// Ejecutar carga de configuración cuando se carga el script
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadConfig);
} else {
  loadConfig();
}

Object.freeze(CONFIG);
