const App = (() => {
  const views = {
    home: HomeView,
    search: SearchView,
    detail: DetailView,
    wishlist: WishlistView,
    history: HistoryView,
    contact: ContactView,
  };

  const init = () => {
    setupMenuToggle();
    handleRoute();
    window.addEventListener('hashchange', handleRoute);
    registerServiceWorker();
  };

  const handleRoute = () => {
    const currentView = Router.getCurrentView();
    const viewModule = views[currentView];

    Router.updateActiveLink();

    if (viewModule && viewModule.render) {
      viewModule.render().catch(error => {
        console.error('Error rendering view:', error);
        showErrorView('No se pudo cargar la página');
      });
    } else {
      showErrorView('Vista no encontrada');
    }
  };

  const showErrorView = (message) => {
    const content = document.getElementById('content');
    content.innerHTML = `
      <div class="view">
        <div class="error-container">
          <h3>Error</h3>
          <p>${message}</p>
          <a href="#/" class="btn btn-primary" style="margin-top: 1rem;">Volver al inicio</a>
        </div>
      </div>
    `;
  };

  const setupMenuToggle = () => {
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (menuToggle && navMenu) {
      menuToggle.addEventListener('click', () => {
        menuToggle.classList.toggle('active');
        navMenu.classList.toggle('open');
      });

      document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
          menuToggle.classList.remove('active');
          navMenu.classList.remove('open');
        });
      });
    }
  };

  const registerServiceWorker = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js')
        .then(registration => {
          console.log('Service Worker registrado:', registration);
        })
        .catch(error => {
          console.warn('Error al registrar Service Worker:', error);
        });
    }
  };

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
