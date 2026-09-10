# ComicDBSQ

**ComicDBSQ** es una Progressive Web App (PWA) para explorar, buscar y organizar una colección personal de cómics, construida sobre la [API pública de Comic Vine](https://comicvine.gamespot.com/api/). Es el trabajo práctico de la asignatura **Aplicaciones Móviles**, y cubre tanto la etapa de SPA con consumo de API externa como la etapa PLUS de conversión a PWA instalable.

## Índice

- [Descripción del proyecto](#descripción-del-proyecto)
- [Enfoque y arquitectura](#enfoque-y-arquitectura)
- [Tecnologías utilizadas](#tecnologías-utilizadas)
- [Framework elegido](#framework-elegido)
- [Requisitos funcionales y su implementación](#requisitos-funcionales-y-su-implementación)
- [Estructura de recursos del proyecto](#estructura-de-recursos-del-proyecto)
- [El proxy: por qué existe un servidor Node](#el-proxy-por-qué-existe-un-servidor-node)
- [Progressive Web App](#progressive-web-app)
- [Seguridad](#seguridad)
- [Puesta en marcha](#puesta-en-marcha)

---

## Descripción del proyecto

La aplicación permite:

- Buscar cómics, volúmenes, personajes, equipos y personas (creadores) por texto libre, con filtros por tipo y orden.
- Ver el detalle completo de cada uno de esos seis tipos de recurso, incluyendo cómics de un volumen, créditos, descripciones e imágenes.
- Agregar cualquier elemento a una **lista de deseos** personal, con cantidad, categoría y notas.
- Llevar un **historial** automático de los últimos 50 elementos visitados.
- Consultar información de contacto con un mapa embebido.
- Instalarse como app nativa en el dispositivo (PWA) y seguir funcionando —de forma limitada— sin conexión.

## Enfoque y arquitectura

El proyecto se resolvió como una **Single Page Application (SPA) en JavaScript vanilla**, sin build step ni bundlers, siguiendo tres decisiones de diseño principales:

1. **Router propio basado en hash** (`#/search`, `#/detail?id=...`), para poder navegar entre "páginas" sin recargar el documento y sin depender de configuración de servidor para rutas limpias (necesario para que funcione igual en local y en GitHub Pages).
2. **Módulos con el patrón IIFE + objeto expuesto** (`const API = (() => { ... return {...} })()`), en vez de una clase o un framework de componentes. Cada archivo de `js/` es responsable de una única cosa (routing, storage, llamadas a la API, seguridad, una vista) y se comunica con el resto a través de su objeto público global. Es el equivalente artesanal a los módulos de un framework, elegido para mantener el proyecto sin dependencias externas.
3. **Servidor Node.js propio como proxy**, no solo como file server: la API key de Comic Vine nunca llega al navegador (ver [más abajo](#el-proxy-por-qué-existe-un-servidor-node)).

## Tecnologías utilizadas

| Tecnología                                                 | Uso en el proyecto                                                                                                                                                                                      |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **HTML5 semántico**                                        | Estructura de `index.html`: `<header>`, `<nav>`, `<main>`, `<footer>`; el contenido de cada vista se inyecta dentro de `<main id="content">`.                                                           |
| **CSS3 (mobile-first, responsive)**                        | Todo en [css/styles.css](css/styles.css): variables CSS para el tema (`:root`), Flexbox/Grid para layouts, media queries para adaptar navbar, tarjetas y popups a mobile.                               |
| **JavaScript ES6+ (Vanilla, sin frameworks)**              | Módulos IIFE, `async/await`, `fetch`, `URLSearchParams`, template literals para render de HTML.                                                                                                         |
| **Node.js (`http`/`https` nativos, sin dependencias npm)** | [server.js](server.js): sirve los archivos estáticos y actúa de proxy autenticado hacia Comic Vine. No usa Express ni ningún paquete de npm — no hay `package.json` porque no hace falta instalar nada. |
| **Comic Vine API (REST)**                                  | Fuente de datos de cómics, volúmenes, personajes, equipos, personas y sagas. Se consume siempre a través del proxy propio, nunca directo desde el navegador.                                            |
| **Fetch API**                                              | Todas las llamadas HTTP del cliente, tanto al proxy propio como (indirectamente) a Comic Vine — ver [js/api.js](js/api.js).                                                                             |
| **localStorage**                                           | Persistencia de la lista de deseos y el historial entre sesiones (`Storage.wishlist`, `Storage.history` en [js/storage.js](js/storage.js)).                                                             |
| **sessionStorage**                                         | Recordar filtros, página y resultados de la última búsqueda al volver de un detalle (`SearchView`, en [js/views/search.js](js/views/search.js)).                                                        |
| **Web App Manifest**                                       | [manifest.json](manifest.json): nombre, íconos, color de tema, modo `standalone` y atajos (shortcuts) a Búsqueda y Lista de deseos.                                                                     |
| **Service Worker / Cache API**                             | [sw.js](sw.js): cachea el app shell y sirve un fallback offline.                                                                                                                                        |
| **OpenStreetMap (embed)**                                  | Mapa de ubicación en la vista de Contacto, vía `iframe`, sin dependencias de mapas del lado del cliente.                                                                                                |
| **dotenv**                                                 | `server.js` parsea `.env` a mano (sin el paquete `dotenv`) para mantener cero dependencias.                                                                                                             |

## Framework elegido

**No se usó un framework de UI (React, Vue, Angular, etc.)** — la aplicación es JavaScript vanilla puro. Esto no fue una omisión sino una decisión, por tres motivos:

- El template PWA provisto por la cátedra ([pwa-template/](pwa-template/)) está pensado para Vanilla JS: usarlo directamente evita reescribir el Service Worker o pelear con el sistema de build de un framework para algo tan simple como cachear un puñado de archivos estáticos.
- El alcance del proyecto (6 vistas, un router de hash, dos colecciones en `localStorage`) no justifica la complejidad ni el peso de un framework completo.
- Mantiene el proyecto **sin build step**: se puede abrir, editar y correr con `node server.js` sin `npm install`, lo cual simplifica tanto el desarrollo como la corrección.

Lo que sí se armó a mano, imitando lo que resolvería un framework, es un **router** ([js/router.js](js/router.js)) y un **despachador de vistas** ([js/app.js](js/app.js)) que decide qué módulo de `js/views/` renderizar según el hash actual.

## Requisitos funcionales y su implementación

| Requisito funcional                                                                  | Cómo se resuelve                                                                                                                            | Tecnología / archivo clave                                                                                    |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Navegar entre secciones sin recargar la página                                       | Router basado en `hashchange` que mapea rutas a vistas                                                                                      | [js/router.js](js/router.js), [js/app.js](js/app.js)                                                          |
| Buscar cómics/personajes/etc. por texto y filtrar por tipo                           | Formulario de búsqueda + `fetch` al endpoint `/search/` de Comic Vine vía proxy, con paginado del lado del cliente (la API ignora `offset`) | [js/views/search.js](js/views/search.js), [js/api.js](js/api.js)                                              |
| Ver el detalle de un cómic, volumen, personaje, equipo, persona o saga               | Una sola vista de detalle que cambia de layout según el `type` recibido por query param                                                     | [js/views/detail.js](js/views/detail.js)                                                                      |
| Agregar un ítem a una lista de deseos con datos propios (cantidad, categoría, notas) | Formulario modal con validación antes de guardar                                                                                            | [js/views/detail.js](js/views/detail.js), `Security.validateWishlistForm` en [js/security.js](js/security.js) |
| Persistir la lista de deseos entre sesiones                                          | `localStorage`, con alta/baja/limpieza                                                                                                      | [js/storage.js](js/storage.js)                                                                                |
| Registrar automáticamente lo que el usuario visita                                   | `Storage.history.add()` se llama al renderizar cada detalle; se limita a 50 registros                                                       | [js/views/detail.js](js/views/detail.js), [js/storage.js](js/storage.js)                                      |
| Mostrar información de contacto y ubicación en un mapa                               | Vista estática + `iframe` de OpenStreetMap centrado con coordenadas configurables                                                           | [js/views/contact.js](js/views/contact.js)                                                                    |
| No exponer la API key de Comic Vine en el cliente                                    | Proxy Node: el navegador nunca conoce la key, solo pega contra `/api/proxy`                                                                 | [server.js](server.js), [js/config.js](js/config.js)                                                          |
| Ser instalable como app y usable (parcialmente) sin conexión                         | Manifest + Service Worker con estrategia cache-first para el shell                                                                          | [manifest.json](manifest.json), [sw.js](sw.js), [js/pwa-init.js](js/pwa-init.js)                              |
| Avisar al usuario cuando se pierde o recupera la conexión                            | Popup fijo arriba-centro que escucha los eventos `online`/`offline` del navegador                                                           | [js/connection-status.js](js/connection-status.js)                                                            |
| Prevenir XSS e inputs inválidos                                                      | Sanitización de HTML de la API antes de inyectarlo en el DOM, validación de formularios y de queries de búsqueda                            | [js/security.js](js/security.js)                                                                              |

## Estructura de recursos del proyecto

```
ComicDBSQ/
├── index.html              # Único documento HTML real: shell de la SPA (navbar, footer, <main id="content">)
├── manifest.json            # Descriptor de la PWA (nombre, íconos, shortcuts, colores)
├── sw.js                    # Service Worker: cache-first para el shell, network-only para la API
├── server.js                 # Servidor Node (http/https nativos): file server + proxy autenticado a Comic Vine
├── .env / .env.example       # Variables de entorno (API key, puerto, config pública)
├── verify-security.sh        # Script de chequeo rápido de buenas prácticas de seguridad del repo
│
├── css/
│   ├── styles.css            # Toda la hoja de estilos: tema, layout, componentes (navbar, tarjetas, toasts, popup de conexión, etc.)
│   └── img/                  # Logo, fondo e imágenes propias de la UI (no de la API)
│
├── icons/                    # Íconos 192x192 y 512x512 requeridos por el manifest
│
├── js/
│   ├── config.js              # Configuración del cliente; carga overrides públicos desde /api/config
│   ├── security.js            # Sanitización HTML, validaciones de formularios/queries, rate limiter
│   ├── api.js                 # Capa de acceso a la API de Comic Vine (siempre vía proxy propio)
│   ├── storage.js             # Persistencia de wishlist e historial en localStorage
│   ├── router.js              # Router de hash: parseo de rutas, navegación, resaltado del link activo
│   ├── app.js                 # Bootstrap de la SPA: despacha la vista actual, maneja el menú mobile
│   ├── toast.js                # Notificaciones flotantes (esquina inferior derecha)
│   ├── connection-status.js    # Popup de estado de conexión (arriba-centro, online/offline)
│   ├── pwa-init.js             # Registro del Service Worker y flujo de instalación (beforeinstallprompt)
│   └── views/                  # Un módulo por vista/ruta
│       ├── home.js             # Home + destacados aleatorios
│       ├── search.js           # Búsqueda, filtros, orden y paginado client-side
│       ├── detail.js           # Detalle de los 6 tipos de recurso + alta a wishlist
│       ├── wishlist.js         # Listado, borrado individual y limpieza de la wishlist
│       ├── history.js          # Listado, borrado individual y limpieza del historial
│       └── contact.js          # Información de contacto + mapa embebido
│
└── pwa-template/              # Template PWA original de la cátedra, de referencia (no se sirve en producción)
```

## El proxy: por qué existe un servidor Node

Comic Vine requiere una API key por request. Si esa key se pusiera directamente en el JavaScript del cliente, cualquiera que abra las DevTools podría copiarla y consumir la cuota de la cuenta. Para evitar eso:

1. El cliente arma la URL de Comic Vine **sin key** (`js/api.js`) y se la pasa como parámetro a `/api/proxy?url=...`.
2. `server.js` intercepta esa ruta, **reemplaza (o agrega) la key** leída desde `.env` del lado del servidor, y recién ahí hace la petición real a `comicvine.gamespot.com`.
3. La respuesta se reenvía al cliente tal cual.

El mismo servidor expone además:

- `/api/proxy-image`, para servir las imágenes de portada evitando problemas de CORS/hotlinking.
- `/api/config`, un endpoint de configuración **pública** (sin key) que el cliente usa para conocer cosas como `RESULTS_PER_PAGE` sin hardcodearlas.

## Progressive Web App

- **Instalación**: `manifest.json` define ícono, nombre, color de tema y modo `standalone`; `pwa-init.js` escucha `beforeinstallprompt` para mostrar un botón "Instalar app" en la navbar en vez del prompt genérico del navegador.
- **Service Worker** ([sw.js](sw.js)): al instalarse, precachea el app shell completo (HTML, CSS, JS, íconos, imágenes propias). En runtime aplica dos estrategias distintas según el tipo de request:
  - **Cache-first** para recursos propios del shell (rápido, funciona offline).
  - **Network-only** para el proxy de la API y cualquier origen externo, para no mostrar nunca datos de cómics desactualizados; si la red falla, devuelve un JSON de error controlado en vez de romper la vista.
- **Aviso de conectividad** ([connection-status.js](js/connection-status.js)): un popup independiente del Service Worker, que escucha `window.addEventListener('online'/'offline', ...)` y muestra un aviso fijo arriba-centro — persiste mientras no hay conexión, y se autooculta a los pocos segundos al reconectar.

## Seguridad

Documentado en detalle en [js/security.js](js/security.js) y verificable con `./verify-security.sh`:

- **Sanitización de HTML**: las descripciones que devuelve Comic Vine vienen con HTML (`<h4>`, `<ul>`, etc.); se limpian con `Security.stripHTML`/`sanitizeHTML` antes de insertarlas en el DOM para evitar XSS.
- **Validación de formularios**: el alta a wishlist valida cantidad, categoría y longitud de notas antes de persistir.
- **Validación de búsqueda**: `validateSearchQuery` restringe los caracteres permitidos en el input de búsqueda.
- **Rate limiting simple**: `createRateLimiter` para prevenir abuso de acciones repetidas del lado del cliente.
- **Headers HTTP de seguridad** en el servidor: `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`, `Permissions-Policy`.
- **API key nunca en el cliente**: ver [sección del proxy](#el-proxy-por-qué-existe-un-servidor-node).

## Puesta en marcha

No hay dependencias de npm que instalar (el servidor usa solo módulos nativos de Node).

```bash
# 1. Cloná el repo y entrá a la carpeta
cd ComicDBSQ

# 2. Copiá el archivo de variables de entorno y completá tu API key de Comic Vine
cp .env.example .env

# 3. Corré el servidor
node server.js

# 4. Abrí en el navegador
http://localhost:8000   # o el puerto que hayas puesto en SERVER_PORT
```

La API key se obtiene gratis registrándose en [comicvine.gamespot.com/api](https://comicvine.gamespot.com/api/).
