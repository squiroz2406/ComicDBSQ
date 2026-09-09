const HomeView = (() => {
  // Procesar URL de imagen para aplicar proxy si es de Comic Vine
  const getProxiedImageUrl = (imageUrl) => {
    if (!imageUrl || imageUrl.startsWith('data:')) {
      return imageUrl;
    }
    if (imageUrl.includes('comicvine') || imageUrl.includes('gamespot')) {
      return `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;
    }
    return imageUrl;
  };

  const render = async () => {
    const content = document.getElementById('content');
    content.innerHTML = '';

    const view = document.createElement('div');
    view.className = 'view home-container';

    view.innerHTML = `
      <section class="hero">
        <img src="css/img/logo-hero.png" alt="ComicsDBSQ" class="hero-logo">
        <p>Tu base de datos interactiva de cómics</p>
        <p style="font-size: 0.95rem; margin-bottom: 1.5rem;">Explora, busca y organiza tu colección favorita de cómics</p>
        <a href="#/search" class="cta-button">Comenzar búsqueda</a>
      </section>

      <section class="featured-section">
        <h2>Cómics destacados</h2>
        <div class="loading" id="featured-loading">
          <div class="spinner"></div>
        </div>
        <div class="featured-grid" id="featured-grid"></div>
      </section>
    `;

    content.appendChild(view);

    try {
      const data = await API.getRandomComics();
      const featuredGrid = document.getElementById('featured-grid');
      const loadingDiv = document.getElementById('featured-loading');

      if (loadingDiv) {
        loadingDiv.remove();
      }

      // Excluir tipos de recurso fuera del alcance de la app (ej: "series"
      // de TV) que no tienen una página de detalle correcta a la que navegar.
      const KNOWN_RESOURCE_TYPES = ['issue', 'volume', 'character', 'person', 'team', 'story_arc'];
      const supportedResults = (data?.results || []).filter(
        item => !item.resource_type || KNOWN_RESOURCE_TYPES.includes(item.resource_type)
      );

      if (supportedResults.length > 0) {
        const comics = supportedResults.slice(0, 6);
        featuredGrid.innerHTML = comics.map(comic => {
          const rawImageUrl = comic.image?.small_url || comic.image?.medium_url || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 150 150%22%3E%3Crect fill=%22%23333%22 width=%22150%22 height=%22150%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 font-size=%2216%22 fill=%22%23999%22 text-anchor=%22middle%22 dominant-baseline=%22central%22%3ENo Image%3C/text%3E%3C/svg%3E';
          const imageUrl = getProxiedImageUrl(rawImageUrl);

          // La descripción de la API viene en HTML (<h4>, <ul><li>...); se
          // limpia a texto plano antes de truncar para no romper el
          // line-clamp de la tarjeta con etiquetas cortadas a la mitad.
          let description = 'Sin descripción';
          if (comic.description) {
            description = Security.stripHTML(comic.description).trim();
            if (description.length > 100) {
              description = description.substring(0, 100).trim() + '...';
            }
          }

          // La respuesta de /search/ mezcla issues, volúmenes, personajes y
          // equipos; el tipo real viene en "resource_type", con el ID
          // completo (prefijo-id) en api_detail_url como respaldo. Navegar
          // siempre como 'issue' llevaba a un detalle equivocado cuando el
          // resultado destacado no era un cómic (ver también search.js).
          let itemType = 'issue';
          let fullId = `4000-${comic.id}`;

          if (comic.api_detail_url) {
            const urlParts = comic.api_detail_url.split('/');
            const idSegment = urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2];

            if (idSegment && idSegment.includes('-')) {
              fullId = idSegment;

              if (KNOWN_RESOURCE_TYPES.includes(comic.resource_type)) {
                itemType = comic.resource_type;
              } else {
                const prefix = idSegment.split('-')[0];
                if (prefix === '4050') itemType = 'volume';
                else if (prefix === '4005') itemType = 'character';
                else if (prefix === '4040') itemType = 'person';
                else if (prefix === '4060') itemType = 'team';
                else if (prefix === '4045') itemType = 'story_arc';
                else itemType = 'issue';
              }
            }
          }

          return `
            <div class="comic-card" onclick="Router.navigate('/detail', { id: '${fullId}', type: '${itemType}' })">
              <img src="${imageUrl}" alt="${comic.title || comic.name}" class="comic-image" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 150 150%22%3E%3Crect fill=%22%23333%22 width=%22150%22 height=%22150%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 font-size=%2214%22 fill=%22%23999%22 text-anchor=%22middle%22 dominant-baseline=%22central%22%3E?%3C/text%3E%3C/svg%3E'">
              <div class="comic-info">
                <div>
                  <h3 class="comic-title">${comic.title || comic.name || 'Sin título'}</h3>
                  <p class="comic-description">${Security.sanitizeHTML(description)}</p>
                </div>
                <div class="comic-meta">
                  ${comic.cover_date ? `<span class="meta-item">📅 ${comic.cover_date}</span>` : ''}
                  ${comic.issue_number ? `<span class="meta-item">#${comic.issue_number}</span>` : ''}
                </div>
              </div>
            </div>
          `;
        }).join('');
      } else {
        featuredGrid.innerHTML = '<p style="text-align: center; color: var(--text-muted); grid-column: 1/-1;">No se encontraron cómics destacados</p>';
      }
    } catch (error) {
      console.error('Error loading featured comics:', error);
      const featuredGrid = document.getElementById('featured-grid');
      if (featuredGrid) {
        featuredGrid.innerHTML = '<div class="error-container" style="grid-column: 1/-1;"><h3>Error</h3><p>No se pudieron cargar los cómics destacados. Intenta nuevamente o ve a Búsqueda para explorar.</p></div>';
      }
    }
  };

  return { render };
})();
