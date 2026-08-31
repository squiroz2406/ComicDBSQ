const ContactView = (() => {
  const render = () => {
    const content = document.getElementById('content');
    content.innerHTML = '';

    const view = document.createElement('div');
    view.className = 'view contact-container';

    const lat = CONFIG.MAP_CENTER[0];
    const lng = CONFIG.MAP_CENTER[1];

    view.innerHTML = `
      <h1 style="margin-bottom: 2rem;">Contacto</h1>

      <div class="contact-info">
        <h2>ComicDB Studios</h2>
        <p><strong>Email:</strong> info@comicdb.com</p>
        <p><strong>Teléfono:</strong> +54 221 XXX-XXXX</p>
        <p><strong>Ubicación:</strong> Catedral de La Plata, La Plata, Buenos Aires, Argentina</p>
        <p><strong>Coordenadas:</strong> ${lat.toFixed(4)}, ${lng.toFixed(4)}</p>

        <p style="margin-top: 1.5rem; font-size: 0.95rem; color: var(--text-muted);">
          ComicDB es una aplicación de código abierto desarrollada como proyecto educativo para la asignatura
          de Aplicaciones Móviles. Nos especializamos en brindar soluciones de software personalizadas para
          clientes con necesidades específicas.
        </p>
      </div>

      <h2 style="margin: 2rem 0 1rem 0;">Ubicación en el mapa</h2>
      <div id="map-container" style="width: 100%; height: 400px; border-radius: 8px; border: 1px solid var(--border-color); margin-bottom: 2rem; overflow: hidden;">
        <iframe
          src="https://www.openstreetmap.org/export/embed.html?bbox=-57.9636%2C-34.9315%2C-57.9436%2C-34.9115&layer=mapnik&marker=-34.9215%2C-57.9536"
          style="width: 100%; height: 100%; border: none;"
          allowfullscreen=""
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade">
        </iframe>
      </div>

      <div class="contact-info">
        <h3>Desarrollo</h3>
        <p>
          Esta aplicación fue desarrollada utilizando tecnologías web modernas:
        </p>
        <ul style="margin-left: 1.5rem; margin-top: 1rem;">
          <li>HTML5 semántico</li>
          <li>CSS3 responsivo (mobile-first)</li>
          <li>JavaScript ES6+ (Vanilla JS)</li>
          <li>Fetch API para consumo de APIs REST</li>
          <li>localStorage para persistencia de datos</li>
          <li>Progressive Web App (PWA) con Service Worker</li>
        </ul>

        <p style="margin-top: 1.5rem;">
          <strong>API utilizada:</strong>
          <a href="https://comicvine.gamespot.com/api/" target="_blank" rel="noopener" style="color: var(--accent-color); text-decoration: underline;">Comic Vine API</a>
        </p>

        <p style="margin-top: 1rem; font-size: 0.9rem;">
          Esta es una aplicación educativa. Los derechos de autor de los cómics y caracteres pertenecen a sus respectivos propietarios.
        </p>
      </div>
    `;

    content.appendChild(view);
  };

  return { render };
})();
