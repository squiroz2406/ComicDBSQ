const Router = (() => {
  const routes = {
    '/': 'home',
    '/search': 'search',
    '/detail': 'detail',
    '/wishlist': 'wishlist',
    '/history': 'history',
    '/contact': 'contact',
  };

  const parseRoute = () => {
    const hash = window.location.hash.slice(1) || '/';
    const [path, ...params] = hash.split('?');
    return {
      path: path || '/',
      params: new URLSearchParams(params.join('?')),
    };
  };

  const navigate = (path, params = {}) => {
    const query = new URLSearchParams(params).toString();
    const hash = query ? `#${path}?${query}` : `#${path}`;
    window.location.hash = hash;
  };

  const getCurrentView = () => {
    const { path } = parseRoute();
    return routes[path] || 'home';
  };

  const getRouteParams = () => {
    const { params } = parseRoute();
    const result = {};
    for (const [key, value] of params) {
      result[key] = value;
    }
    return result;
  };

  const updateActiveLink = () => {
    const { path } = parseRoute();
    document.querySelectorAll('.nav-link').forEach(link => {
      const href = link.getAttribute('href');
      link.classList.toggle('active', href === `#${path}`);
    });
  };

  return {
    navigate,
    getCurrentView,
    getRouteParams,
    parseRoute,
    updateActiveLink,
  };
})();
