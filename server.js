const http = require('http');
const https = require('https');
const url = require('url');
const path = require('path');
const fs = require('fs');

// Cargar variables de entorno desde .env
const loadEnv = () => {
  try {
    const envPath = path.join(__dirname, '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const env = {};

    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, value] = trimmed.split('=');
        if (key && value) {
          env[key.trim()] = value.trim();
        }
      }
    });

    return env;
  } catch (err) {
    console.error('⚠️  No se pudo cargar .env:', err.message);
    return {};
  }
};

const ENV = loadEnv();
const PORT = parseInt(ENV.SERVER_PORT) || 8000;
const API_KEY = ENV.COMIC_VINE_API_KEY;
const NODE_ENV = ENV.NODE_ENV || 'development';

const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
};

const server = http.createServer((req, res) => {
  // Headers de seguridad
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  // Headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Proxy de imágenes de Comic Vine
  if (req.url.startsWith('/api/proxy-image')) {
    const parsedUrl = url.parse(req.url, true);
    const imageUrl = parsedUrl.query.url;

    if (!imageUrl || !imageUrl.includes('comicvine.gamespot.com') || !imageUrl.startsWith('https://')) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid image URL' }));
      return;
    }

    console.log('Proxying image from:', imageUrl);

    https.get(imageUrl, { timeout: 10000 }, (imgRes) => {
      const contentType = imgRes.headers['content-type'] || 'image/jpeg';
      const contentLength = imgRes.headers['content-length'];

      const headers = {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
        'X-Content-Type-Options': 'nosniff',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      };

      if (contentLength) {
        headers['Content-Length'] = contentLength;
      }

      res.writeHead(200, headers);
      imgRes.pipe(res);
    }).on('error', (err) => {
      console.error('Image proxy error:', err.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to proxy image' }));
    });

    return;
  }

  // Endpoint de configuración pública (sin API key)
  if (req.url === '/api/config') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      appName: ENV.APP_NAME || 'ComicDB',
      appVersion: ENV.APP_VERSION || '1.0.0',
      resultsPerPage: parseInt(ENV.RESULTS_PER_PAGE) || 10,
      mapCenter: [
        parseFloat(ENV.MAP_LAT) || -34.9215,
        parseFloat(ENV.MAP_LNG) || -57.9536
      ],
      mapZoom: parseInt(ENV.MAP_ZOOM) || 15,
      environment: NODE_ENV,
    }));
    return;
  }

  // Proxy para API de Comic Vine
  if (req.url.startsWith('/api/proxy')) {
    const parsedUrl = url.parse(req.url, true);
    let apiUrl = parsedUrl.query.url;

    if (!apiUrl) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'No URL provided' }));
      return;
    }

    // Reemplazar API key en la URL con la del servidor (más seguro)
    if (API_KEY) {
      // Reemplaza api_key= incluso si está vacío (api_key=&)
      apiUrl = apiUrl.replace(/api_key=[^&]*/, `api_key=${API_KEY}`);
    }

    console.log('Proxying request with API key from server');

    const options = {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    };

    https.get(apiUrl, options, (apiRes) => {
      let data = '';
      let isJson = false;

      apiRes.on('data', (chunk) => {
        data += chunk;
      });

      apiRes.on('end', () => {
        console.log('Response status:', apiRes.statusCode);
        console.log('Response length:', data.length);
        console.log('Response preview:', data.substring(0, 300));

        if (apiRes.statusCode !== 200) {
          console.error('API returned status:', apiRes.statusCode);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            error: 'API Error',
            message: `API returned ${apiRes.statusCode}`,
            results: []
          }));
          return;
        }

        try {
          // Intenta parsear como JSON
          const jsonData = JSON.parse(data);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(jsonData));
        } catch (e) {
          console.error('Response is not valid JSON:', data.substring(0, 200));
          res.writeHead(200, { 'Content-Type': 'application/json' });
          // Devuelve un objeto de error
          res.end(JSON.stringify({
            error: 'API returned invalid JSON',
            message: 'La API devolvió una respuesta inválida',
            results: []
          }));
        }
      });
    }).on('error', (err) => {
      console.error('Proxy error:', err.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Proxy request failed',
        message: err.message
      }));
    }).on('timeout', () => {
      console.error('Proxy timeout');
      res.writeHead(504, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Request timeout',
        message: 'La petición tardó demasiado'
      }));
    });

    return;
  }

  // Servir archivos estáticos
  let filePath = '.' + req.url;
  if (filePath === './') {
    filePath = './index.html';
  }

  const ext = path.extname(filePath);
  const contentType = mimeTypes[ext] || 'text/plain';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end('<h1>404 - Archivo no encontrado</h1>');
      return;
    }

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`✅ Servidor ComicDB ejecutándose en http://localhost:${PORT}`);
  console.log(`📱 Abre tu navegador en http://localhost:${PORT}`);
  console.log(`🛑 Presiona Ctrl+C para detener el servidor`);
});
