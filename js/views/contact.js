const ContactView = (() => {
  const render = async () => {
    const content = document.getElementById('content');
    content.innerHTML = '';

    const view = document.createElement('div');
    view.className = 'view contact-container';

    const lat = CONFIG.MAP_CENTER[0];
    const lng = CONFIG.MAP_CENTER[1];

    // El mapa se centra en las coordenadas de configuración, pero estas no
    // se muestran como texto en la página.
    const delta = 0.01;
    const bbox = [lng - delta, lat - delta, lng + delta, lat + delta].join('%2C');
    const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;

    view.innerHTML = `
      <h1 style="margin-bottom: 2rem;">Contacto</h1>

      <div class="contact-info">
        <h2>ComicDBSQ</h2>
        <p><strong>Email:</strong> contactus@comicdbsq.com</p>
        <p><strong>Teléfono:</strong> +54 221 XXX-XXXX</p>
        <p><strong>Ubicación:</strong> Catedral de La Plata, La Plata, Buenos Aires, Argentina</p>

        
      </div>

      <h2 style="margin: 2rem 0 1rem 0;">Ubicación en el mapa</h2>
      <div id="map-container" style="width: 100%; height: 400px; border-radius: 8px; border: 1px solid var(--border-color); margin-bottom: 2rem; overflow: hidden;">
        <iframe
          src="${mapSrc}"
          style="width: 100%; height: 100%; border: none;"
          allowfullscreen=""
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade">
        </iframe>
      </div>

    `;

    content.appendChild(view);
  };

  return { render };
})();
