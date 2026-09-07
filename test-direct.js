const https = require('https');

const apiUrl = 'https://comicvine.gamespot.com/api/search/?api_key=48b0130630fd4f8d42baa2ece75dae399fc446e0&format=json&query=batman&sort=date_added:desc&limit=10&offset=0';

const options = {
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  }
};

console.log('Prueba directa - Pidiendo a Comic Vine API...');
console.log('URL:', apiUrl);
console.log('---\n');

https.get(apiUrl, options, (res) => {
  let data = '';

  console.log('Status:', res.statusCode);
  console.log('Headers:', res.headers);
  console.log('---\n');

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Response length:', data.length);
    console.log('Response preview (primeros 500 caracteres):');
    console.log(data.substring(0, 500));
    console.log('\n---\n');

    try {
      const jsonData = JSON.parse(data);
      console.log('✅ JSON válido');
      console.log('Resultados encontrados:', jsonData.results?.length || 0);
      if (jsonData.results && jsonData.results[0]) {
        console.log('Primer resultado:', jsonData.results[0].title);
      }
    } catch (e) {
      console.log('❌ No es JSON válido:', e.message);
    }
  });
}).on('error', (err) => {
  console.error('Error:', err.message);
});
