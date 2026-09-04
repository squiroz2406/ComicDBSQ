const SearchView = (() => {
  // La API de Comic Vine ignora el parámetro "offset" en el endpoint /search/
  // (siempre devuelve desde la posición 0, sin importar el offset solicitado).
  // Por eso se trae un único lote grande (el máximo permitido) y se pagina
  // del lado del cliente en vez de pedir una "página" nueva por cada click.
  const SEARCH_BATCH_SIZE = 100;

  let currentPage = 0;
  let currentFilters = {};
  let currentResults = { results: [] };

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

  // Guardar y restaurar estado de búsqueda
  const saveSearchState = () => {
    sessionStorage.setItem('searchState', JSON.stringify({
      filters: currentFilters,
      page: currentPage,
      results: currentResults
    }));
  };

  const loadSearchState = () => {
    const saved = sessionStorage.getItem('searchState');
    if (saved) {
      const state = JSON.parse(saved);
      currentFilters = state.filters;
      currentPage = state.page;
      currentResults = state.results;
      return true;
    }
    return false;
  };

  const render = async () => {
    const content = document.getElementById('content');
    content.innerHTML = '';

    const view = document.createElement('div');
    view.className = 'view search-container';

    view.innerHTML = `
      <div class="search-filters">
        <h2>Búsqueda de cómics</h2>
        <div class="filter-group">
          <label for="search-query">Buscar por título o palabra clave</label>
          <input type="text" id="search-query" placeholder="Ej: Spider-Man, Batman..." value="">
        </div>

        <div class="filter-group">
          <label for="search-type">Tipo de búsqueda</label>
          <select id="search-type">
            <option value="issue">Cómics (Issues)</option>
            <option value="volume">Volúmenes</option>
            <option value="character">Personajes</option>
          </select>
        </div>

        <div class="filter-group">
          <label for="search-sort">Ordenar por</label>
          <select id="search-sort">
            <option value="date_added:desc">Más recientes</option>
            <option value="date_added:asc">Más antiguos</option>
            <option value="name:asc">Nombre (A-Z)</option>
            <option value="name:desc">Nombre (Z-A)</option>
          </select>
        </div>

        <div class="button-group">
          <button class="btn btn-primary" id="search-btn">Buscar</button>
          <button class="btn btn-secondary" id="clear-btn">Limpiar</button>
        </div>
      </div>

      <div class="results-section">
        <div id="results-info" class="results-info"></div>
        <div id="comics-grid" class="comics-grid"></div>
        <div id="pagination" class="pagination"></div>
      </div>
    `;

    content.appendChild(view);

    setupEventListeners();

    // Intentar cargar estado guardado
    if (loadSearchState()) {
      // Si hay un estado guardado, mostrar los resultados
      document.getElementById('search-query').value = currentFilters.query || '';
      document.getElementById('search-type').value = currentFilters.type || 'issue';
      document.getElementById('search-sort').value = currentFilters.sort || 'date_added:desc';
      displayResults();
    } else {
      // Si no hay estado guardado, hacer búsqueda vacía
      await performSearch();
    }
  };

  const setupEventListeners = () => {
    const searchBtn = document.getElementById('search-btn');
    const clearBtn = document.getElementById('clear-btn');
    const queryInput = document.getElementById('search-query');

    searchBtn.addEventListener('click', async () => {
      currentPage = 0;
      await performSearch();
    });

    clearBtn.addEventListener('click', () => {
      document.getElementById('search-query').value = '';
      document.getElementById('search-type').value = 'issue';
      document.getElementById('search-sort').value = 'date_added:desc';
      currentPage = 0;
      currentFilters = {};
      currentResults = { results: [] };
      displayResults();
      sessionStorage.removeItem('searchState'); // Limpiar estado guardado
    });

    queryInput.addEventListener('keypress', async (e) => {
      if (e.key === 'Enter') {
        currentPage = 0;
        await performSearch();
      }
    });
  };

  const performSearch = async () => {
    const query = document.getElementById('search-query').value.trim();
    const type = document.getElementById('search-type').value;
    const sort = document.getElementById('search-sort').value;

    const grid = document.getElementById('comics-grid');

    // Validar query
    if (query && !Security.validateSearchQuery(query)) {
      grid.innerHTML = '<div class="error-container"><h3>Error</h3><p>El término de búsqueda contiene caracteres no permitidos.</p></div>';
      return;
    }

    currentFilters = { query, type, sort };
    currentPage = 0;

    grid.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    try {
      if (!query) {
        currentResults = { results: [] };
        displayResults();
        return;
      }

      console.log('Searching for:', Security.sanitizeHTML(query));
      // Se trae un único lote grande; la paginación posterior se resuelve
      // en el cliente (ver comentario sobre SEARCH_BATCH_SIZE).
      const data = await API.searchComics({
        query,
        offset: 0,
        limit: SEARCH_BATCH_SIZE,
      });

      console.log('Search results received');

      if (data.error && data.error !== 'OK') {
        throw new Error(data.error);
      }

      currentResults = data;
      displayResults();
      saveSearchState(); // Guardar estado después de búsqueda exitosa
    } catch (error) {
      console.error('Search error:', error);
      grid.innerHTML = '<div class="error-container"><h3>Error en búsqueda</h3><p>No se pudieron cargar los resultados: ' + Security.sanitizeHTML(error.message) + '</p><p style="font-size: 0.9rem;">Verifica tu conexión o intenta con otro término de búsqueda.</p></div>';
    }
  };

  const displayResults = () => {
    const grid = document.getElementById('comics-grid');
    const infoDiv = document.getElementById('results-info');
    const paginationDiv = document.getElementById('pagination');

    grid.innerHTML = '';
    paginationDiv.innerHTML = '';

    if (!currentResults.results || currentResults.results.length === 0) {
      grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--text-muted);">No se encontraron resultados</div>';
      infoDiv.innerHTML = '';
      return;
    }

    // currentResults.results contiene el lote completo ya traído (hasta
    // SEARCH_BATCH_SIZE). La página a mostrar se recorta acá, en el cliente.
    const allResults = currentResults.results;
    const navigableTotal = allResults.length;
    const reportedTotal = currentResults.number_of_total_results || navigableTotal;

    const pageStart = currentPage * CONFIG.RESULTS_PER_PAGE;
    const results = allResults.slice(pageStart, pageStart + CONFIG.RESULTS_PER_PAGE);

    infoDiv.innerHTML = `<span class="results-count">Mostrando ${pageStart + 1}-${Math.min(pageStart + CONFIG.RESULTS_PER_PAGE, navigableTotal)} de ${reportedTotal} resultados</span>`;

    // Filtrar resultados inválidos (sin nombre ni descripción)
    const validResults = results.filter(item => {
      const hasName = item.name || item.title;
      const hasContent = item.description || item.bio || item.aliases;
      return hasName && hasContent;
    });

    validResults.forEach(item => {
      const card = document.createElement('div');
      card.className = 'comic-card';
      card.style.cursor = 'pointer';

      // MEJOR: Extraer tipo del api_detail_url de Comic Vine (mucho más confiable)
      let itemType = 'issue';
      let fullId = `4000-${item.id}`; // Formato por defecto

      if (item.api_detail_url) {
        // URL es como: https://comicvine.gamespot.com/api/volume/4050-3173/
        // Extraer el último segmento que tiene el formato "prefix-id"
        const urlParts = item.api_detail_url.split('/');
        const idSegment = urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2]; // Por si hay trailing slash

        if (idSegment && idSegment.includes('-')) {
          fullId = idSegment; // Usar el ID completo del api_detail_url

          const prefix = idSegment.split('-')[0];
          if (prefix === '4050') itemType = 'volume';
          else if (prefix === '4005') itemType = 'character';
          else if (prefix === '4040') itemType = 'person';
          else itemType = 'issue';
        }
      }

      card.onclick = () => Router.navigate('/detail', { id: fullId, type: itemType });

      const rawImageUrl = item.image?.small_url || item.image?.medium_url || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 150 150%22%3E%3Crect fill=%22%23333%22 width=%22150%22 height=%22150%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 font-size=%2216%22 fill=%22%23999%22 text-anchor=%22middle%22 dominant-baseline=%22central%22%3ENo Image%3C/text%3E%3C/svg%3E';
      const imageUrl = getProxiedImageUrl(rawImageUrl);

      // Manejo flexible de descripción
      // Las descripciones de la API vienen en HTML (<h4>, <ul><li>...); hay
      // que pasarlas a texto plano ANTES de truncar, si no el recorte corta
      // etiquetas a la mitad y rompe el line-clamp de la tarjeta.
      let description = '';
      if (item.description) {
        description = Security.stripHTML(item.description).trim();
      } else if (item.bio) {
        description = Security.stripHTML(item.bio).trim();
      } else if (item.aliases) {
        description = 'Alias: ' + item.aliases.split('\n')[0];
      } else if (item.country) {
        description = 'País: ' + item.country;
      } else {
        description = 'Sin descripción disponible';
      }

      if (description.length > 150) {
        description = description.substring(0, 150).trim() + '...';
      }
      description = Security.sanitizeHTML(description);

      const title = item.title || item.name || 'Sin título';
      const subtitle = item.publisher?.name || item.volume?.name || '';

      // Etiqueta del tipo más legible
      const typeLabel = {
        'person': '👤 Persona',
        'character': '🦸 Personaje',
        'issue': '📖 Cómic',
        'volume': '📚 Volumen'
      }[itemType] || itemType;

      card.innerHTML = `
        <img src="${imageUrl}" alt="${title}" class="comic-image" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 150 150%22%3E%3Crect fill=%22%23444%22 width=%22150%22 height=%22150%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 font-size=%2214%22 fill=%22%23999%22 text-anchor=%22middle%22 dominant-baseline=%22central%22%3E?%3C/text%3E%3C/svg%3E'">
        <div class="comic-info">
          <div>
            <h3 class="comic-title">${title}</h3>
            ${subtitle ? `<p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.5rem;">${subtitle}</p>` : ''}
            <p class="comic-description">${description}</p>
          </div>
          <div class="comic-meta">
            ${item.cover_date ? `<span class="meta-item">📅 ${item.cover_date}</span>` : ''}
            ${item.issue_number ? `<span class="meta-item">#${item.issue_number}</span>` : ''}
            ${item.birth ? `<span class="meta-item">🎂 ${new Date(item.birth).getFullYear()}</span>` : ''}
            <span class="meta-item">${typeLabel}</span>
          </div>
        </div>
      `;

      grid.appendChild(card);
    });

    // Procesar todas las imágenes para usar proxy de Comic Vine
    const fallbackImg = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 150 150%22%3E%3Crect fill=%22%23444%22 width=%22150%22 height=%22150%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 font-size=%2214%22 fill=%22%23999%22 text-anchor=%22middle%22 dominant-baseline=%22central%22%3E?%3C/text%3E%3C/svg%3E';

    grid.querySelectorAll('img').forEach(img => {
      const src = img.getAttribute('src');
      if (src && src.includes('comicvine') && !src.startsWith('data:') && !src.startsWith('/api/proxy-image')) {
        img.src = `/api/proxy-image?url=${encodeURIComponent(src)}`;
        img.onerror = () => {
          img.src = fallbackImg;
          img.onerror = null;
        };
      } else if (!img.onerror && (src?.startsWith('data:') || !src)) {
        img.onerror = () => {
          img.src = fallbackImg;
          img.onerror = null;
        };
      }
    });

    if (navigableTotal > CONFIG.RESULTS_PER_PAGE) {
      renderPagination(navigableTotal, paginationDiv);
    }
  };

  // Cambia de página sobre el lote ya cargado en memoria: no vuelve a
  // llamar a la API (ver SEARCH_BATCH_SIZE).
  const goToPage = (page) => {
    currentPage = page;
    displayResults();
    saveSearchState();
  };

  const renderPagination = (navigableTotal, container) => {
    const totalPages = Math.ceil(navigableTotal / CONFIG.RESULTS_PER_PAGE);

    const prevBtn = document.createElement('button');
    prevBtn.textContent = 'Anterior';
    prevBtn.disabled = currentPage === 0;
    prevBtn.onclick = () => {
      if (currentPage > 0) {
        goToPage(currentPage - 1);
      }
    };
    container.appendChild(prevBtn);

    for (let i = 0; i < Math.min(totalPages, 5); i++) {
      const btn = document.createElement('button');
      btn.textContent = i + 1;
      btn.className = i === currentPage ? 'active' : '';
      btn.onclick = () => {
        goToPage(i);
      };
      container.appendChild(btn);
    }

    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Siguiente';
    nextBtn.disabled = currentPage >= totalPages - 1;
    nextBtn.onclick = () => {
      if (currentPage < totalPages - 1) {
        goToPage(currentPage + 1);
      }
    };
    container.appendChild(nextBtn);
  };

  return { render };
})();
