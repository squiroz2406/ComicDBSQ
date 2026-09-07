// Script de testing para validar que la API funciona
// Ejecuta esto en la consola del navegador (F12 > Console)

console.log('🧪 Iniciando tests de ComicDB API...\n');

// Test 1: Verificar configuración
console.log('1️⃣ Verificando configuración...');
console.log('API_BASE_URL:', CONFIG.API_BASE_URL);
console.log('API_KEY:', CONFIG.API_KEY.substring(0, 10) + '...');
console.log('✓ Configuración cargada\n');

// Test 2: Probar búsqueda
console.log('2️⃣ Probando búsqueda de cómics...');
API.searchComics({ query: 'batman', offset: 0 })
  .then(data => {
    console.log('✓ Búsqueda exitosa');
    console.log('Total resultados:', data.number_of_total_results);
    console.log('Resultados en página:', data.results?.length || 0);
    if (data.results && data.results[0]) {
      console.log('Primer resultado:', data.results[0].title);
    }
  })
  .catch(err => console.error('✗ Error en búsqueda:', err.message));

// Test 3: Probar cómics aleatorios
console.log('\n3️⃣ Probando cómics aleatorios...');
API.getRandomComics()
  .then(data => {
    console.log('✓ Cómics aleatorios obtenidos');
    console.log('Cantidad:', data.results?.length || 0);
  })
  .catch(err => console.error('✗ Error en aleatorios:', err.message));

// Test 4: Verificar localStorage
console.log('\n4️⃣ Verificando localStorage...');
console.log('Wishlist guardados:', Storage.wishlist.getAll().length);
console.log('Historial guardado:', Storage.history.getAll().length);

console.log('\n✅ Tests completados. Abre la consola para más detalles.');
