const DetailView = (() => {
  let currentItem = null;
  let issuesCache = {};

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

  // Procesar TODOS los links de Comic Vine después de insertar en DOM
  const processAllComicVineLinks = (container) => {
    const getTypeByPrefix = (prefix) => {
      const prefixNum = parseInt(prefix);
      if (prefixNum === 4000) return 'issue';
      if (prefixNum === 4005) return 'character';
      if (prefixNum === 4050) return 'volume';
      if (prefixNum === 4040) return 'person';
      return 'issue';
    };

    const createFallbackImage = () => 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 150 150%22%3E%3Crect fill=%22%23333%22 width=%22150%22 height=%22150%22/%3E%3C/svg%3E';

    // Procesar links con data-comic-id (ya fueron reemplazados en convertComicVineLinks)
    container.querySelectorAll('a[data-comic-id]').forEach(link => {
      const comicId = link.getAttribute('data-comic-id');
      if (comicId) {
        const [prefix, id] = comicId.split('-');
        const itemType = getTypeByPrefix(prefix);

        link.onclick = (e) => {
          e.preventDefault();
          Router.navigate('/detail', { id: id, type: itemType });
          return false;
        };
      }
    });

    // También procesar cualquier link que aún apunte a Comic Vine (por si acaso)
    container.querySelectorAll('a[href*="comicvine.gamespot.com"]').forEach(link => {
      link.href = 'javascript:void(0)';
      link.onclick = (e) => {
        e.preventDefault();
        return false;
      };
    });

    // Procesar TODAS las imágenes, reemplazando URLs de Comic Vine con proxy
    container.querySelectorAll('img').forEach((img, index) => {
      const src = img.getAttribute('src');

      // CASO 1: URL de Comic Vine - reemplazar con proxy
      if (src && (src.includes('comicvine') || src.includes('gamespot')) && !src.startsWith('data:') && !src.startsWith('/api/proxy-image')) {
        const newSrc = `/api/proxy-image?url=${encodeURIComponent(src)}`;
        img.src = newSrc;
      }

      // CASO 2: Cualquier imagen (ya sea proxy, Comic Vine, o placeholder) - asegurar fallback
      img.onerror = () => {
        img.src = createFallbackImage();
        img.onerror = null;
      };
    });
  };

  const render = async () => {
    const params = Router.getRouteParams();
    let id = params.id;
    const type = params.type || 'issue';

    if (!id) {
      showError('No se especificó un ID válido');
      return;
    }

    // Extraer el número del ID si viene en formato "prefix-id"
    if (id.includes('-')) {
      id = id.split('-')[1];
    }

    const content = document.getElementById('content');
    content.innerHTML = '';

    const view = document.createElement('div');
    view.className = 'view detail-container';
    view.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    content.appendChild(view);

    try {
      let item = null;
      let finalType = type;

      // Si es un issue y está en caché, usarlo directamente
      if (type === 'issue' && issuesCache[id]) {
        item = issuesCache[id];
      } else {
        // Intentar obtener con el tipo especificado
        try {
          if (type === 'issue') {
            item = await API.getComicDetail(id);
          } else if (type === 'volume') {
            item = await API.getVolumeDetail(id);
          } else if (type === 'character') {
            item = await API.getCharacterDetail(id);
          } else if (type === 'person') {
            item = await API.getPersonDetail(id);
          }
        } catch (primaryError) {
          // Si falla el tipo especificado, intentar otros tipos
          console.warn(`Fallo obtener ${type}, intentando otros tipos...`);

          const tipos = ['character', 'person', 'issue', 'volume'].filter(t => t !== type);

          for (const altType of tipos) {
            try {
              if (altType === 'issue') {
                item = await API.getComicDetail(id);
                finalType = 'issue';
              } else if (altType === 'volume') {
                item = await API.getVolumeDetail(id);
                finalType = 'volume';
              } else if (altType === 'character') {
                item = await API.getCharacterDetail(id);
                finalType = 'character';
              } else if (altType === 'person') {
                item = await API.getPersonDetail(id);
                finalType = 'person';
              }

              if (item) break; // Si obtuvimos algo, salir del loop
            } catch (altError) {
              // Continuar intentando otros tipos
              console.warn(`Fallo ${altType}, intentando siguiente...`);
            }
          }

          if (!item) {
            throw primaryError; // Si ninguno funciona, lanzar el error original
          }
        }
      }

      currentItem = { ...item, type: finalType };
      Storage.history.add({ id: item.id, type: finalType, title: item.name || item.title });
      await displayDetail(item, finalType);
    } catch (error) {
      console.error('Error loading detail:', error);
      showError('No se pudo cargar la información del elemento. Verifica que el ID sea válido.');
    }
  };

  // Convertir links de Comic Vine a navegación interna ANTES de insertar en DOM
  const convertComicVineLinks = (html) => {
    if (!html) return html;

    // PASO 1: Reemplazar TODOS los href de Comic Vine con javascript:void(0)
    // Esto previene que el navegador intente cargar esas URLs.
    // La API devuelve tanto links absolutos (https://comicvine.gamespot.com/...)
    // como relativos (ej: "/x-men-by-gerry-duggan-1-vol-1/4000-910395/"), por
    // eso el host es opcional acá: un href relativo sin convertir es resuelto
    // por el navegador contra nuestro propio origen y termina en 404.
    let processed = html.replace(
      /href="(?:https:\/\/comicvine\.gamespot\.com)?\/[^"]*\/(\d+)-(\d+)\/?"/g,
      'href="javascript:void(0)" data-comic-id="$1-$2"'
    );

    // PASO 2: Reemplazar también URLs sin comillas (si las hay)
    processed = processed.replace(
      /href=(?:https:\/\/comicvine\.gamespot\.com)?\/[^\s>]*\/(\d+)-(\d+)\/?(?=[\s>])/g,
      'href="javascript:void(0)" data-comic-id="$1-$2"'
    );

    // PASO 3: Remover atributos data-* sospechosos
    processed = processed.replace(
      /\s+data-[a-z-]*="https:\/\/comicvine\.gamespot\.com\/[^"]*"/g,
      ''
    );

    return processed;
  };

  const displayDetail = async (item, type) => {
    const content = document.getElementById('content');
    content.innerHTML = '';

    const view = document.createElement('div');
    view.className = 'view detail-container';

    const rawImageUrl = item.image?.medium_url || item.image?.original_url || item.image?.small_url || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 300 400%22%3E%3Crect fill=%22%23333%22 width=%22300%22 height=%22400%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 font-size=%2220%22 fill=%22%23999%22 text-anchor=%22middle%22 dominant-baseline=%22central%22%3ENo Image%3C/text%3E%3C/svg%3E';
    const imageUrl = getProxiedImageUrl(rawImageUrl);

    const title = item.name || item.title || 'Sin título';

    // Mostrar biografía para personajes/autores
    let description = item.description || item.bio || 'Sin descripción disponible';
    if (!description || description === 'Sin descripción disponible') {
      if (item.aliases) {
        description = 'Alias: ' + item.aliases.split('\n').slice(0, 3).join(', ');
      }
    }

    // Convertir links de Comic Vine a navegación interna
    description = convertComicVineLinks(description);

    let detailHTML = `
      <a href="#/search" class="back-button">← Volver a búsqueda</a>

      <div class="detail-header">
        <img src="${imageUrl}" alt="${title}" class="detail-image">
        <div class="detail-info">
          <h1>${title}</h1>
          <p>${description.substring(0, 300)}${description.length > 300 ? '...' : ''}</p>

          <div class="detail-meta">
    `;

    if (type === 'issue') {
      if (item.issue_number) {
        detailHTML += `
          <div class="meta-field">
            <span class="meta-label">Número</span>
            <span class="meta-value">#${item.issue_number}</span>
          </div>
        `;
      }
      if (item.cover_date) {
        detailHTML += `
          <div class="meta-field">
            <span class="meta-label">Fecha</span>
            <span class="meta-value">${item.cover_date}</span>
          </div>
        `;
      }
      if (item.volume) {
        detailHTML += `
          <div class="meta-field">
            <span class="meta-label">Volumen</span>
            <span class="meta-value">${item.volume.name}</span>
          </div>
        `;
      }
    } else if (type === 'volume') {
      if (item.start_year) {
        detailHTML += `
          <div class="meta-field">
            <span class="meta-label">Año Inicio</span>
            <span class="meta-value">${item.start_year}</span>
          </div>
        `;
      }
      if (item.publisher) {
        detailHTML += `
          <div class="meta-field">
            <span class="meta-label">Editorial</span>
            <span class="meta-value">${item.publisher.name}</span>
          </div>
        `;
      }
      if (item.count_of_issues) {
        detailHTML += `
          <div class="meta-field">
            <span class="meta-label">Total de Issues</span>
            <span class="meta-value">${item.count_of_issues}</span>
          </div>
        `;
      }
    } else if (type === 'character') {
      if (item.publisher) {
        detailHTML += `
          <div class="meta-field">
            <span class="meta-label">Editorial</span>
            <span class="meta-value">${item.publisher.name}</span>
          </div>
        `;
      }
      if (item.real_name) {
        detailHTML += `
          <div class="meta-field">
            <span class="meta-label">Nombre Real</span>
            <span class="meta-value">${item.real_name}</span>
          </div>
        `;
      }
      if (item.count_of_issue_appearances) {
        detailHTML += `
          <div class="meta-field">
            <span class="meta-label">Apariciones</span>
            <span class="meta-value">${item.count_of_issue_appearances}</span>
          </div>
        `;
      }
    } else if (type === 'person') {
      if (item.birth) {
        const birthDate = new Date(item.birth).toLocaleDateString();
        detailHTML += `
          <div class="meta-field">
            <span class="meta-label">Fecha de Nacimiento</span>
            <span class="meta-value">${birthDate}</span>
          </div>
        `;
      }
      if (item.country) {
        detailHTML += `
          <div class="meta-field">
            <span class="meta-label">País</span>
            <span class="meta-value">${item.country}</span>
          </div>
        `;
      }
      if (item.hometown) {
        detailHTML += `
          <div class="meta-field">
            <span class="meta-label">Ciudad Natal</span>
            <span class="meta-value">${item.hometown}</span>
          </div>
        `;
      }
      if (item.count_of_isssue_appearances) {
        detailHTML += `
          <div class="meta-field">
            <span class="meta-label">Apariciones</span>
            <span class="meta-value">${item.count_of_isssue_appearances}</span>
          </div>
        `;
      }
    }

    detailHTML += `
          </div>
        </div>
      </div>

      <div class="detail-description">
        <h3>Descripción completa</h3>
        <div style="color: var(--text-color); line-height: 1.8;">${description}</div>
      </div>
    `;

    // Placeholder para issues si es un volumen
    if (type === 'volume') {
      detailHTML += `
        <div class="detail-description">
          <h3>Issues en este volumen</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 1rem; margin-top: 1rem;" id="issues-grid">
            <div style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
              <div class="loading"><div class="spinner"></div></div>
            </div>
          </div>
        </div>
      `;
    }

    detailHTML += `
      <div class="detail-actions">
        <button class="btn btn-primary" onclick="DetailView.addToWishlist()">❤️ Agregar a lista de deseos</button>
        <a href="#/search" class="btn btn-secondary">← Volver a búsqueda</a>
      </div>
    `;

    view.innerHTML = detailHTML;
    const contentDiv = document.getElementById('content');
    contentDiv.appendChild(view);

    // IMPORTANTE: Procesar todos los links después de insertarlos en el DOM
    processAllComicVineLinks(view);

    // Cargar issues con imágenes si es un volumen
    if (type === 'volume') {
      loadVolumeIssues(item.id);
    }
  };

  const loadVolumeIssues = async (volumeId) => {
    try {
      const issuesData = await API.getVolumeIssues(volumeId);
      const issues = issuesData.results || [];

      if (issues.length === 0) {
        const grid = document.getElementById('issues-grid');
        if (grid) {
          grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted);">No hay issues disponibles</div>';
        }
        return;
      }

      let issuesHTML = '';
      issues.forEach(issue => {
        issuesCache[issue.id] = issue;
        const issueNumber = issue.issue_number || issue.name || 'Issue';
        const rawImageUrl = issue.image?.small_url || issue.image?.medium_url || issue.image?.original_url;
        const proxiedImageUrl = getProxiedImageUrl(rawImageUrl);

        issuesHTML += `
          <div style="cursor: pointer; text-align: center; padding: 0.5rem; border-radius: 4px; border: 1px solid var(--border-color); transition: all 0.3s;"
               onclick="Router.navigate('/detail', { id: '4000-${issue.id}', type: 'issue' })"
               onmouseover="this.style.borderColor='var(--accent-color)'; this.style.transform='translateY(-2px)';"
               onmouseout="this.style.borderColor='var(--border-color)'; this.style.transform='translateY(0)';">
            <img src="${proxiedImageUrl}" alt="${issueNumber}" style="width: 100%; height: auto; border-radius: 4px; margin-bottom: 0.5rem;" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 150 150%22%3E%3Crect fill=%22%23333%22 width=%22150%22 height=%22150%22/%3E%3C/svg%3E'">
            <div style="font-size: 0.9rem; font-weight: bold;">
              #${issueNumber}
            </div>
          </div>
        `;
      });

      const grid = document.getElementById('issues-grid');
      if (grid) {
        grid.innerHTML = issuesHTML;
        const heading = document.querySelector('.detail-description h3');
        if (heading) {
          heading.textContent = `Issues en este volumen (${issues.length} total)`;
        }
      }
    } catch (error) {
      console.error('Error loading volume issues:', error);
      const grid = document.getElementById('issues-grid');
      if (grid) {
        grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted);">Error al cargar los issues</div>';
      }
    }
  };

  const addToWishlist = () => {
    if (!currentItem) return;

    const modal = document.getElementById('wishlist-modal');
    if (!modal) {
      createWishlistModal();
    } else {
      document.getElementById('wishlist-modal').classList.add('active');
    }
  };

  const createWishlistModal = () => {
    const modal = document.createElement('div');
    modal.id = 'wishlist-modal';
    modal.className = 'modal';

    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>Agregar a lista de deseos</h2>
          <button class="modal-close" onclick="document.getElementById('wishlist-modal').classList.remove('active')">&times;</button>
        </div>

        <form id="wishlist-form">
          <div class="form-group">
            <label for="quantity">Cantidad o Prioridad</label>
            <input type="number" id="quantity" name="quantity" min="1" value="1" required>
            <span class="form-help">Número positivo que indica cantidad o prioridad</span>
          </div>

          <div class="form-group">
            <label for="category">Categoría o Etiqueta</label>
            <input type="text" id="category" name="category" placeholder="Ej: Favoritos, Pendientes..." required>
            <span class="form-help">Categoría personalizada para organizar</span>
          </div>

          <div class="form-group">
            <label for="notes">Notas personales</label>
            <textarea id="notes" name="notes" placeholder="Agrega tus notas..."></textarea>
            <span class="form-help">Máximo 500 caracteres</span>
          </div>

          <div class="button-group">
            <button type="submit" class="btn btn-success">Agregar</button>
            <button type="button" class="btn btn-secondary" onclick="document.getElementById('wishlist-modal').classList.remove('active')">Cancelar</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    const form = modal.querySelector('form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      handleAddToWishlist();
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
  };

  const handleAddToWishlist = () => {
    const quantity = document.getElementById('quantity').value;
    const category = document.getElementById('category').value;
    const notes = document.getElementById('notes').value;

    if (!currentItem) return;

    // Validar formulario usando módulo de seguridad
    const validation = Security.validateWishlistForm({
      quantity,
      category,
      notes
    });

    if (!validation.valid) {
      alert('Error en formulario:\n' + validation.errors.join('\n'));
      return;
    }

    Storage.wishlist.add({
      id: currentItem.id,
      type: currentItem.type,
      title: Security.sanitizeHTML(currentItem.name || currentItem.title),
      quantity: parseInt(quantity),
      category: Security.sanitizeHTML(category.trim()),
      notes: Security.sanitizeHTML(notes.trim()),
    });

    document.getElementById('wishlist-modal').classList.remove('active');
    alert('✅ Agregado a lista de deseos');
  };

  const showError = (message) => {
    const content = document.getElementById('content');
    content.innerHTML = `
      <div class="view detail-container">
        <a href="#/search" class="back-button">← Volver a búsqueda</a>
        <div class="error-container">
          <h3>Error</h3>
          <p>${message}</p>
        </div>
      </div>
    `;
  };

  return {
    render,
    addToWishlist,
  };
})();
