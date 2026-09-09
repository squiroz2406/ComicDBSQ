# Template PWA — Aplicaciones Móviles · Cátedra 2025-2026

Este template está preconfigurado por la cátedra para facilitar la conversión de tu aplicación web en una Progressive Web App (PWA) instalable. **No necesitás entender en profundidad cómo funciona el Service Worker** para completar la etapa PLUS del TP.

---

## Estructura del proyecto

```
pwa-template/
├── index.html              ← Página principal (reemplazá con tu home)
├── manifest.json           ← Descriptor de la PWA (editá con tus datos)
├── sw.js                   ← Service Worker preconfigurado (no modificar)
├── generar-iconos.py       ← Script para generar íconos placeholder
├── icons/
│   ├── icon-192.png        ← Ícono 192x192 px (reemplazá con el tuyo)
│   └── icon-512.png        ← Ícono 512x512 px (reemplazá con el tuyo)
├── css/
│   └── styles.css          ← Tus estilos van aquí
└── js/
    ├── app.js              ← Tu código JavaScript va aquí
    └── pwa-init.js         ← Inicialización PWA (no modificar)
```

---

## Archivos que SÍ debés modificar

| Archivo | Qué editás |
|---|---|
| `manifest.json` | Nombre, colores y descripción de tu app |
| `index.html` | Reemplazás con el HTML de tu aplicación |
| `css/styles.css` | Tus estilos CSS |
| `js/app.js` | Tu código JavaScript |
| `icons/icon-192.png` | Tu ícono en 192x192 px |
| `icons/icon-512.png` | Tu ícono en 512x512 px |

## Archivos que NO debés modificar

| Archivo | Por qué |
|---|---|
| `sw.js` | Service Worker preconfigurado por la cátedra |
| `js/pwa-init.js` | Registro automático del Service Worker |

---

## Paso a paso: cómo integrar tu aplicación

### Paso 1 — Clonar o descargar el template

Descargá el template desde el repositorio de la cátedra y copiá tus archivos dentro de la carpeta del proyecto.

### Paso 2 — Editar el manifest.json

Abrí `manifest.json` y completá los campos con los datos de tu aplicación:

```json
{
  "name": "El nombre completo de tu app",
  "short_name": "NombreCorto",
  "description": "Una descripción breve de tu aplicación",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#tu-color-principal",
  "icons": [...]
}
```

**Campos obligatorios:**
- `name`: nombre completo que aparece al instalar la app
- `short_name`: nombre corto que aparece en el lanzador del dispositivo
- `theme_color`: el color principal de tu app en formato hexadecimal

### Paso 3 — Generar o reemplazar los íconos

**Opción A — Usar el script generador** (si todavía no tenés íconos propios):

```bash
# Instalar dependencia
pip install Pillow

# Generar íconos con tus iniciales y color
python3 generar-iconos.py --nombre "Mi App" --color "#1F4E79"
```

**Opción B — Reemplazar con tus propios íconos:**

Creá dos imágenes en formato PNG:
- `icons/icon-192.png` de exactamente 192x192 píxeles
- `icons/icon-512.png` de exactamente 512x512 píxeles

Podés usar Figma, Canva o cualquier editor de imágenes. Los íconos deben tener fondo sólido (no transparente) para que se vean correctamente en todos los dispositivos.

### Paso 4 — Integrar tu HTML

Copiá el contenido de tu aplicación dentro del `<body>` de `index.html` y de cada página adicional. Asegurate de incluir al final de cada página el script de inicialización PWA:

```html
<!-- Al final del body, antes del cierre </body> -->
<script src="/js/app.js"></script>
<script src="/js/pwa-init.js"></script>  <!-- Siempre último -->
```

Si tu aplicación tiene múltiples páginas HTML (busqueda.html, detalle.html, etc.), incluí ambos scripts en todas ellas.

### Paso 5 — Actualizar la lista de recursos en el Service Worker

Abrí `sw.js` y verificá que la lista `RECURSOS_SHELL` incluye todos tus archivos estáticos principales:

```javascript
const RECURSOS_SHELL = [
  '/',
  '/index.html',
  '/busqueda.html',      // ← Agregá tus páginas adicionales
  '/detalle.html',
  '/lista-deseos.html',
  '/historial.html',
  '/contacto.html',
  '/css/styles.css',
  '/js/app.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];
```

Este es el **único cambio** que debés hacer en `sw.js`.

---

## Cómo probar la PWA en local

Las PWA requieren ser servidas desde un servidor HTTP, no directamente desde el sistema de archivos (no funciona abriendo el HTML con doble clic).

### Opción A — Live Server (VS Code) — Recomendada

1. Instalá la extensión **Live Server** en VS Code
2. Abrí la carpeta del proyecto en VS Code
3. Hacé clic derecho sobre `index.html` → **Open with Live Server**
4. La app se abre en `http://127.0.0.1:5500`

> **Importante:** Live Server usa HTTP en localhost, lo cual es suficiente para que el Service Worker funcione durante el desarrollo.

### Opción B — Servidor Python

Si tenés Python instalado, ejecutá desde la carpeta del proyecto:

```bash
# Python 3
python3 -m http.server 8080
```

Luego abrí `http://localhost:8080` en Chrome.

### Verificar que la PWA funciona correctamente

1. Abrí Chrome DevTools (F12)
2. Ir a la pestaña **Application**
3. En el panel izquierdo, verificar:
   - **Manifest:** debe mostrar los datos de tu `manifest.json` sin errores
   - **Service Workers:** debe aparecer como "Activated and running"
   - **Cache Storage:** debe mostrar los recursos cacheados

Si todo está en verde, tu PWA está correctamente configurada.

---

## Cómo publicar en GitHub Pages

GitHub Pages permite publicar tu aplicación de forma gratuita con HTTPS, que es **obligatorio** para que la PWA funcione correctamente en producción.

### Paso 1 — Crear un repositorio en GitHub

1. Creá una cuenta en [github.com](https://github.com) si no tenés una
2. Creá un nuevo repositorio público con el nombre de tu aplicación
3. **No** inicialices el repositorio con README ni .gitignore desde GitHub

### Paso 2 — Subir tu código

Desde la carpeta de tu proyecto, ejecutá los siguientes comandos en la terminal:

```bash
# Inicializar Git en tu proyecto
git init

# Agregar todos los archivos
git add .

# Primer commit
git commit -m "Primera versión de la aplicación"

# Conectar con tu repositorio de GitHub
git remote add origin https://github.com/tu-usuario/tu-repositorio.git

# Subir el código
git push -u origin main
```

### Paso 3 — Activar GitHub Pages

1. En tu repositorio de GitHub, ir a **Settings** (Configuración)
2. En el menú lateral, ir a **Pages**
3. En **Source**, seleccionar la rama `main` y la carpeta `/ (root)`
4. Hacer clic en **Save**

GitHub Pages tardará unos minutos en publicar tu sitio. La URL será:
```
https://tu-usuario.github.io/tu-repositorio/
```

### Paso 4 — Actualizar start_url en el manifest

Si GitHub Pages publica tu app en una subcarpeta (ej: `/tu-repositorio/`), debés actualizar el `manifest.json`:

```json
{
  "start_url": "/tu-repositorio/",
  "scope": "/tu-repositorio/"
}
```

Y también la lista `RECURSOS_SHELL` en `sw.js`:

```javascript
const RECURSOS_SHELL = [
  '/tu-repositorio/',
  '/tu-repositorio/index.html',
  '/tu-repositorio/css/styles.css',
  ...
];
```

### Paso 5 — Verificar la instalación

Una vez publicada en GitHub Pages, abrí la URL en Chrome desde tu celular. Deberías ver un banner o botón que dice **"Agregar a pantalla de inicio"** o **"Instalar aplicación"**. Al instalarlo, la app aparecerá en el lanzador de tu dispositivo como una app nativa.

---

## Si usás React, Vue o Next.js

Si desarrollaste tu aplicación con un framework que requiere un proceso de build, el flujo es diferente porque el template Vanilla JS no aplica directamente. Seguí estas instrucciones según el framework:

### React (Create React App)

1. **No copies el `sw.js` ni el `pwa-init.js` de este template.** Create React App tiene su propio sistema de PWA.
2. En `src/index.js`, cambiá `serviceWorker.unregister()` por `serviceWorker.register()`.
3. Editá `public/manifest.json` con los datos de tu app (mismo formato que el de este template).
4. Reemplazá los íconos en `public/icons/`.
5. Para publicar en GitHub Pages: `npm run build` genera la carpeta `build/`. Publicá esa carpeta usando el paquete `gh-pages`:

```bash
npm install --save-dev gh-pages
```

En `package.json`, agregá:
```json
{
  "homepage": "https://tu-usuario.github.io/tu-repositorio",
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d build"
  }
}
```

Luego ejecutá: `npm run deploy`

### Vue (Vue CLI)

1. El `sw.js` y `pwa-init.js` de este template no aplican.
2. Instalá el plugin PWA de Vue: `vue add pwa`
3. Editá `public/manifest.json` con los datos de tu app.
4. Para publicar en GitHub Pages: `npm run build` genera `dist/`. Publicá esa carpeta:

```bash
npm install --save-dev gh-pages
```

En `package.json`:
```json
{
  "scripts": {
    "deploy": "gh-pages -d dist"
  }
}
```

En `vue.config.js`:
```javascript
module.exports = {
  publicPath: process.env.NODE_ENV === 'production'
    ? '/tu-repositorio/'
    : '/'
}
```

Luego: `npm run build && npm run deploy`

### Next.js

Next.js tiene soporte PWA mediante el paquete `next-pwa`. La integración es más compleja y queda fuera del alcance de este template. Consultá con el docente si elegiste Next.js y querés implementar la etapa PLUS.

---

## Problemas comunes

**El Service Worker no aparece en DevTools**
→ Verificá que estás sirviendo la app desde un servidor HTTP (Live Server, Python server), no abriendo el HTML directamente desde el explorador de archivos.

**El manifest muestra errores en DevTools**
→ Verificá que `manifest.json` es JSON válido (sin comas extra, sin comentarios). Podés validarlo en [jsonlint.com](https://jsonlint.com).

**Los íconos no aparecen**
→ Verificá que los archivos se llaman exactamente `icon-192.png` e `icon-512.png` y que están en la carpeta `icons/`. Los nombres son case-sensitive.

**La app no se puede instalar**
→ Verificás en DevTools > Application > Manifest si aparece el mensaje "Installability: ..." con algún error. Los motivos más comunes son: manifest inválido, íconos faltantes o Service Worker no registrado.

**En GitHub Pages la app no carga los recursos**
→ Actualizá `start_url` y `scope` en el manifest, y la lista `RECURSOS_SHELL` en `sw.js` para incluir el prefijo `/tu-repositorio/`.

---

## Recursos de consulta

- [MDN — Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [MDN — Web App Manifests](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [web.dev — Learn PWA](https://web.dev/learn/pwa)
- [GitHub Pages — Documentación oficial](https://docs.github.com/en/pages)
- [Can I Use — Soporte de PWA por navegador](https://caniuse.com/?search=service%20worker)
