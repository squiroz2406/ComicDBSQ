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
          sort: 'date_added:desc',
          limit: CONFIG.RESULTS_PER_PAGE,
          offset: filters.offset || 0,
        };

        const url = buildUrl('/search/', params);
        const response = await fetch(url);
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
        const response = await fetch(url);
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
        const response = await fetch(url);
        const data = await handleResponse(response);

        return data;
      } catch (error) {
        console.error('Error searching characters:', error);
        throw error;
      }
    },

    getCharacterDetail: async (id) => {
      try {
        const url = buildUrl(`/character/4005-${id}/`);
        const response = await fetch(url);
        const data = await handleResponse(response);

        // La API devuelve la información directamente en "results"
        return data.results || data;
      } catch (error) {
        console.error('Error fetching character detail:', error);
        throw error;
      }
    },

    getPersonDetail: async (id) => {
      try {
        const url = buildUrl(`/person/4040-${id}/`);
        const response = await fetch(url);
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
        const response = await fetch(url);
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
        const response = await fetch(url);
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
        const response = await fetch(url);
        const data = await handleResponse(response);

        return data;
      } catch (error) {
        console.error('Error fetching volume issues:', error);
        throw error;
      }
    },

    getRandomComics: async () => {
      try {
        const params = {
          query: 'a',
          limit: 6,
          offset: Math.floor(Math.random() * 500),
        };

        const url = buildUrl('/search/', params);
        console.log('Fetching random comics from:', url);
        const response = await fetch(url);
        const data = await handleResponse(response);

        return data;
      } catch (error) {
        console.error('Error fetching random comics:', error);
        return { results: [] };
      }
    },
  };
})();
