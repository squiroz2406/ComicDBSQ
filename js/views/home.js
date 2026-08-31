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
        <h1>ComicDB</h1>
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

      if (data && data.results && Array.isArray(data.results) && data.results.length > 0) {
        const comics = data.results.slice(0, 6);
        featuredGrid.innerHTML = comics.map(comic => {
          const rawImageUrl = comic.image?.small_url || comic.image?.medium_url || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 150 150%22%3E%3Crect fill=%22%23333%22 width=%22150%22 height=%22150%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 font-size=%2216%22 fill=%22%23999%22 text-anchor=%22middle%22 dominant-baseline=%22central%22%3ENo Image%3C/text%3E%3C/svg%3E';
          const imageUrl = getProxiedImageUrl(rawImageUrl);
          return `
            <div class="comic-card" onclick="Router.navigate('/detail', { id: '${comic.id}', type: 'issue' })">
              <img src="${imageUrl}" alt="${comic.title || comic.name}" class="comic-image" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 150 150%22%3E%3Crect fill=%22%23333%22 width=%22150%22 height=%22150%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 font-size=%2214%22 fill=%22%23999%22 text-anchor=%22middle%22 dominant-baseline=%22central%22%3E?%3C/text%3E%3C/svg%3E'">
              <div class="comic-info">
                <div>
                  <h3 class="comic-title">${comic.title || comic.name || 'Sin título'}</h3>
                  <p class="comic-description">${comic.description ? comic.description.substring(0, 100) + '...' : 'Sin descripción'}</p>
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
