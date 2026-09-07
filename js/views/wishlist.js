const WishlistView = (() => {
  const render = async () => {
    const content = document.getElementById('content');
    content.innerHTML = '';

    const view = document.createElement('div');
    view.className = 'view';

    const wishlist = Storage.wishlist.getAll();

    if (wishlist.length === 0) {
      view.innerHTML = `
        <div class="list-empty">
          <p>Tu lista de deseos está vacía</p>
          <p style="font-size: 2rem;">💔</p>
          <a href="#/search" class="btn btn-primary">Comenzar a agregar</a>
        </div>
      `;
    } else {
      view.innerHTML = `
        <h1 style="margin-bottom: 1.5rem;">Lista de deseos (${wishlist.length})</h1>
        <div id="wishlist-container"></div>
        <button class="btn btn-danger" style="margin-top: 2rem;" onclick="WishlistView.clearAll()">Limpiar lista</button>
      `;

      const container = document.createElement('div');
      container.id = 'wishlist-container';

      wishlist.forEach(item => {
        const itemEl = document.createElement('div');
        itemEl.className = 'list-item';

        const addedDate = new Date(item.addedAt).toLocaleDateString();

        itemEl.innerHTML = `
          <div class="list-item-content">
            <div class="list-item-title">${item.title}</div>
            <div class="list-item-meta">
              <span>Categoría: <strong>${item.category}</strong></span> |
              <span>Cantidad: <strong>${item.quantity}</strong></span> |
              <span>Agregado: ${addedDate}</span>
            </div>
            ${item.notes ? `<div class="list-item-meta">Notas: ${item.notes}</div>` : ''}
          </div>
          <div class="list-item-actions">
            <button class="btn btn-secondary" onclick="Router.navigate('/detail', { id: '${item.id}', type: '${item.type}' })" style="padding: 0.5rem 1rem; font-size: 0.9rem;">Ver</button>
            <button class="btn btn-danger" onclick="WishlistView.removeItem('${item.id}', '${item.type}')" style="padding: 0.5rem 1rem; font-size: 0.9rem;">Eliminar</button>
          </div>
        `;

        container.appendChild(itemEl);
      });

      const viewEl = view.querySelector('#wishlist-container');
      if (viewEl) {
        viewEl.replaceWith(container);
      }
    }

    content.appendChild(view);
  };

  const removeItem = (id, type) => {
    if (confirm('¿Deseas eliminar este elemento de la lista de deseos?')) {
      Storage.wishlist.remove(id, type);
      render();
    }
  };

  const clearAll = () => {
    if (confirm('¿Estás seguro de que deseas limpiar toda la lista de deseos? Esta acción no se puede deshacer.')) {
      Storage.wishlist.clear();
      render();
    }
  };

  return { render, removeItem, clearAll };
})();
