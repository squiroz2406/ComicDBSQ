const API = (() => {
  const buildUrl = (endpoint, params = {}) => {
    const url = new URL(`${CONFIG.API_BASE_URL}${endpoint}`);
    // API_KEY se pasa vacía aquí, el servidor reemplaza desde .env
    url.searchParams.append('api_key', '');
    url.searchParams.append('format', 'json');

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.append(key, value);
      }
    }

    const fullUrl = url.toString();
    const proxyUrl = new URL(CONFIG.PROXY_ENDPOINT, window.location.origin);
    proxyUrl.searchParams.append('url', fullUrl);

    return proxyUrl.toString();
  };

  // El proxy responde 500/504 ante fallos transitorios de red hacia Comic
  // Vine (reset de socket, hipo de TLS, Happy Eyeballs). Los errores "de
  // negocio" de la API llegan como 200, así que reintentar solo ante 5xx o
  // error de conexión es seguro y suele resolverse al segundo intento.
  const RETRY_STATUS = new Set([500, 502, 503, 504]);

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const fetchWithRetry = async (url, { retries = 2, backoff = 400 } = {}) => {
    let lastError;

    for (let attempt = 0; attempt <= retries; attempt++) {
      if (attempt > 0) {
        await wait(backoff * attempt);
      }

      try {
        const response = await fetch(url);
        if (RETRY_STATUS.has(response.status) && attempt < retries) {
          console.warn(`Reintentando (${attempt + 1}/${retries}) tras HTTP ${response.status}`);
          continue;
        }
        return response;
      } catch (err) {
        lastError = err;
        console.warn(`Reintentando (${attempt + 1}/${retries}) tras error de red: ${err.message}`);
      }
    }

    throw lastError || new Error('No se pudo completar la petición');
  };

  const handleResponse = async (response) => {
    console.log('Response status:', response.status, response.statusText);

    if (!response.ok) {
      console.error(`HTTP Error: ${response.status}`, response.statusText);
      throw new Error(`HTTP Error: ${response.status} - ${response.statusText}`);
    }

    let data;
    try {
      const text = await response.text();
      console.log('Response text length:', text.length);
      data = JSON.parse(text);
    } catch (e) {
      console.error('Error parsing response:', e.message);
      throw new Error(`Error al procesar respuesta: ${e.message}`);
    }

    // Comic Vine API usa "error":"OK" para indicar éxito
    if (data.error && data.error !== 'OK') {
      console.error('API Error:', data.error);
      throw new Error(data.error);
    }

    return data;
  };

  return {
    searchComics: async (filters = {}) => {
      try {
        const params = {
          query: filters.query || '',
          filter: filters.filter || '',
          // Restringe el/los tipo(s) de recurso que devuelve la búsqueda
          // global (issue, volume, character, team, person...).
          resources: filters.resources || '',
          sort: 'date_added:desc',
          limit: filters.limit || CONFIG.RESULTS_PER_PAGE,
          offset: filters.offset || 0,
        };

        const url = buildUrl('/search/', params);
        const response = await fetchWithRetry(url);
        const data = await handleResponse(response);

        return data;
      } catch (error) {
        console.error('Error searching comics:', error);
        throw error;
      }
    },

    getComicDetail: async (id) => {
      try {
        const url = buildUrl(`/issue/4000-${id}/`);
        const response = await fetchWithRetry(url);
        const data = await handleResponse(response);

        // API devuelve en "results" para endpoints individuales
        return data.results || data;
      } catch (error) {
        console.error('Error fetching comic detail:', error);
        throw error;
      }
    },

    searchCharacters: async (query, offset = 0) => {
      try {
        const params = {
          query,
          limit: CONFIG.RESULTS_PER_PAGE,
          offset,
          sort: 'name:asc',
        };

        const url = buildUrl('/search/', params);
        const response = await fetchWithRetry(url);
        const data = await handleResponse(response);

        return data;
      } catch (error) {
        console.error('Error searching characters:', error);
        throw error;
      }
    },

    getStoryArcDetail: async (id) => {
      try {
        const url = buildUrl(`/story_arc/4045-${id}/`);
        const response = await fetchWithRetry(url);
        const data = await handleResponse(response);

        // API devuelve en "results" para endpoints individuales
        return data.results || data;
      } catch (error) {
        console.error('Error fetching story arc detail:', error);
        throw error;
      }
    },

    getCharacterDetail: async (id) => {
      try {
        const url = buildUrl(`/character/4005-${id}/`);
        const response = await fetchWithRetry(url);
        const data = await handleResponse(response);

        // La API devuelve la información directamente en "results"
        return data.results || data;
      } catch (error) {
        console.error('Error fetching character detail:', error);
        throw error;
      }
    },

    getTeamDetail: async (id) => {
      try {
        const url = buildUrl(`/team/4060-${id}/`);
        const response = await fetchWithRetry(url);
        const data = await handleResponse(response);

        // API devuelve en "results" para endpoints individuales
        return data.results || data;
      } catch (error) {
        console.error('Error fetching team detail:', error);
        throw error;
      }
    },

    getPersonDetail: async (id) => {
      try {
        const url = buildUrl(`/person/4040-${id}/`);
        const response = await fetchWithRetry(url);
        const data = await handleResponse(response);

        // API devuelve en "results" para endpoints individuales
        return data.results || data;
      } catch (error) {
        console.error('Error fetching person detail:', error);
        throw error;
      }
    },

    searchVolumes: async (filters = {}) => {
      try {
        const params = {
          query: filters.query || '',
          limit: CONFIG.RESULTS_PER_PAGE,
          offset: filters.offset || 0,
          sort: 'start_year:desc',
        };

        const url = buildUrl('/search/', params);
        const response = await fetchWithRetry(url);
        const data = await handleResponse(response);

        return data;
      } catch (error) {
        console.error('Error searching volumes:', error);
        throw error;
      }
    },

    getVolumeDetail: async (id) => {
      try {
        const url = buildUrl(`/volume/4050-${id}/`);
        const response = await fetchWithRetry(url);
        const data = await handleResponse(response);

        // API devuelve en "results" para endpoints individuales
        return data.results || data;
      } catch (error) {
        console.error('Error fetching volume detail:', error);
        throw error;
      }
    },

    getVolumeIssues: async (volumeId) => {
      try {
        const params = {
          filter: `volume:${volumeId}`,
          limit: 100,
          offset: 0,
        };

        const url = buildUrl('/issues/', params);
        const response = await fetchWithRetry(url);
        const data = await handleResponse(response);

        return data;
      } catch (error) {
        console.error('Error fetching volume issues:', error);
        throw error;
      }
    },

    // Franquicias/series reconocibles para la sección "Cómics destacados".
    // Buscar 'a' con offset aleatorio traía basura (títulos "A", "The", "&"),
    // así que se rota entre títulos conocidos y se restringe a volúmenes.
    FEATURED_QUERIES: [
      'Batman', 'Superman', 'The Amazing Spider-Man', 'X-Men', 'Wonder Woman',
      'The Avengers', 'Justice League', 'Watchmen', 'The Sandman', 'Saga',
      'Hellboy', 'Daredevil', 'Invincible', 'Sin City', 'Y: The Last Man',
      'V for Vendetta', 'Preacher', 'Fantastic Four', 'Green Lantern', 'The Flash',
      'Captain America', 'Black Panther', 'Thor', 'Iron Man', 'Deadpool',
    ],

    getRandomComics: async () => {
      try {
        // Una sola búsqueda ("Saga") devolvía muchas ediciones del mismo
        // volumen (traducciones, publicaciones extranjeras, recopilatorios).
        // Se lanza una búsqueda por cada franquicia distinta y se toma un
        // único volumen de cada una.
        const queries = API.FEATURED_QUERIES
          .slice()
          .sort(() => Math.random() - 0.5)
          .slice(0, 6);

        const searches = await Promise.allSettled(
          queries.map((query) => {
            const url = buildUrl('/search/', { query, resources: 'volume', limit: 8 });
            return fetchWithRetry(url).then(handleResponse);
          })
        );

        const seen = new Set();
        const results = [];

        for (const outcome of searches) {
          if (outcome.status !== 'fulfilled') {
            continue;
          }

          const candidates = (outcome.value?.results || []).filter((item) => {
            const key = (item.name || item.title || '').trim().toLowerCase();
            return key && !seen.has(key);
          });

          if (!candidates.length) {
            continue;
          }

          // Preferir la edición principal (la que más números publicó) por
          // encima de traducciones o recopilatorios sueltos.
          candidates.sort(
            (a, b) => (b.count_of_issues || 0) - (a.count_of_issues || 0)
          );

          const pick = candidates[0];
          seen.add((pick.name || pick.title || '').trim().toLowerCase());
          results.push(pick);
        }

        return { results };
      } catch (error) {
        console.error('Error fetching random comics:', error);
        return { results: [] };
      }
    },
  };
})();
