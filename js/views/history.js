const HistoryView = (() => {
  const render = () => {
    const content = document.getElementById('content');
    content.innerHTML = '';

    const view = document.createElement('div');
    view.className = 'view';

    const history = Storage.history.getAll();

    if (history.length === 0) {
      view.innerHTML = `
        <div class="list-empty">
          <p>Tu historial está vacío</p>
          <p style="font-size: 2rem;">📚</p>
          <a href="#/search" class="btn btn-primary">Comenzar a explorar</a>
        </div>
      `;
    } else {
      view.innerHTML = `
        <h1 style="margin-bottom: 1.5rem;">Historial de cómics visitados (${history.length})</h1>
        <div id="history-container"></div>
        <button class="btn btn-danger" style="margin-top: 2rem;" onclick="HistoryView.clearAll()">Limpiar historial</button>
      `;

      const container = document.createElement('div');
      container.id = 'history-container';

      history.forEach((item, index) => {
        const itemEl = document.createElement('div');
        itemEl.className = 'list-item';

        const visitedDate = new Date(item.visitedAt).toLocaleString();

        itemEl.innerHTML = `
          <div class="list-item-content">
            <div class="list-item-title">${item.title}</div>
            <div class="list-item-meta">
              <span>Tipo: <strong>${item.type === 'issue' ? 'Cómic' : item.type === 'volume' ? 'Volumen' : 'Personaje'}</strong></span> |
              <span>Visitado: ${visitedDate}</span>
            </div>
          </div>
          <div class="list-item-actions">
            <button class="btn btn-secondary" onclick="Router.navigate('/detail', { id: '${item.id}', type: '${item.type}' })" style="padding: 0.5rem 1rem; font-size: 0.9rem;">Ver</button>
            <button class="btn btn-danger" onclick="HistoryView.removeItem('${item.id}', '${item.type}')" style="padding: 0.5rem 1rem; font-size: 0.9rem;">Eliminar</button>
          </div>
        `;

        container.appendChild(itemEl);
      });

      const viewEl = view.querySelector('#history-container');
      if (viewEl) {
        viewEl.replaceWith(container);
      }
    }

    content.appendChild(view);
  };

  const removeItem = (id, type) => {
    Storage.history.remove(id, type);
    render();
  };

  const clearAll = () => {
    if (confirm('¿Estás seguro de que deseas limpiar todo el historial? Esta acción no se puede deshacer.')) {
      Storage.history.clear();
      render();
    }
  };

  return { render, removeItem, clearAll };
})();
