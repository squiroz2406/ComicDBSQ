const Toast = (() => {
  const ICONS = {
    success: '✅',
    error: '⚠️',
    info: 'ℹ️',
  };

  const getContainer = () => {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    return container;
  };

  const show = (message, type = 'success', { duration = 3500, icon } = {}) => {
    const container = getContainer();
    const resolvedIcon = icon === undefined ? (ICONS[type] || ICONS.info) : icon;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      ${resolvedIcon ? `<span class="toast-icon">${resolvedIcon}</span>` : ''}
      <span class="toast-message"></span>
      <button class="toast-close" aria-label="Cerrar">&times;</button>
    `;
    toast.querySelector('.toast-message').textContent = message;

    const close = () => {
      toast.classList.add('toast-hide');
      toast.addEventListener('animationend', () => toast.remove(), { once: true });
    };

    toast.querySelector('.toast-close').addEventListener('click', close);
    const timer = setTimeout(close, duration);
    toast.addEventListener('click', () => {
      clearTimeout(timer);
      close();
    });

    container.appendChild(toast);
  };

  return {
    show,
    success: (message, options) => show(message, 'success', options),
    error: (message, options) => show(message, 'error', options),
    info: (message, options) => show(message, 'info', options),
  };
})();
