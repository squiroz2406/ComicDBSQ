// ============================================================
// APP.JS — Tu código va aquí
// ============================================================
// Este es el punto de entrada del código JavaScript de tu
// aplicación. Podés agregar más archivos JS según necesites
// y referenciarlos desde el HTML antes de pwa-init.js.
// ============================================================

console.log('Aplicación iniciada.');

// Ejemplo: obtener datos de una API pública
async function buscar(termino) {
  try {
    const response = await fetch(`https://tu-api.com/endpoint?q=${termino}`);

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const datos = await response.json();
    return datos;
  } catch (error) {
    if (!navigator.onLine) {
      console.warn('Sin conexión a internet.');
    } else {
      console.error('Error al obtener datos:', error);
    }
    throw error;
  }
}
