// ============================================================
// CONNECTION STATUS — aviso de conexión/desconexión a internet
// ============================================================
// Muestra un popup fijo en la parte superior central de la
// pantalla cuando se pierde la conexión, y otro al recuperarla.
// ============================================================

const ConnectionStatus = (() => {
  const MESSAGES = {
    offline: 'Sin conexión a internet',
    online: 'Conexión restablecida',
  };

  let banner = null;
  let hideTimer = null;

  const getBanner = () => {
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'connection-banner';
      banner.className = 'connection-banner';
      banner.setAttribute('role', 'status');
      banner.setAttribute('aria-live', 'polite');
      banner.hidden = true;
      banner.innerHTML = '<span class="connection-banner-message"></span>';
      document.body.appendChild(banner);
    }
    return banner;
  };

  const show = (type) => {
    const el = getBanner();
    clearTimeout(hideTimer);

    el.className = `connection-banner connection-banner-${type}`;
    el.querySelector('.connection-banner-message').textContent = MESSAGES[type];
    el.hidden = false;

    void el.offsetWidth;
    el.classList.add('connection-banner-show');

    if (type === 'online') {
      hideTimer = setTimeout(hide, 3000);
    }
  };

  const hide = () => {
    const el = getBanner();
    el.classList.remove('connection-banner-show');
    hideTimer = setTimeout(() => {
      el.hidden = true;
    }, 300);
  };

  const showOffline = () => show('offline');
  const showOnline = () => show('online');

  const init = () => {
    if (!navigator.onLine) {
      showOffline();
    }
    window.addEventListener('offline', showOffline);
    window.addEventListener('online', showOnline);
  };

  return { init, showOffline, showOnline };
})();

document.addEventListener('DOMContentLoaded', ConnectionStatus.init);
