const Storage = (() => {
  const getWishlist = () => {
    try {
      const data = localStorage.getItem(CONFIG.STORAGE_KEYS.WISHLIST);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading wishlist:', error);
      return [];
    }
  };

  const saveWishlist = (items) => {
    try {
      localStorage.setItem(CONFIG.STORAGE_KEYS.WISHLIST, JSON.stringify(items));
    } catch (error) {
      console.error('Error saving wishlist:', error);
    }
  };

  const getHistory = () => {
    try {
      const data = localStorage.getItem(CONFIG.STORAGE_KEYS.HISTORY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading history:', error);
      return [];
    }
  };

  const saveHistory = (items) => {
    try {
      localStorage.setItem(CONFIG.STORAGE_KEYS.HISTORY, JSON.stringify(items));
    } catch (error) {
      console.error('Error saving history:', error);
    }
  };

  return {
    wishlist: {
      getAll: getWishlist,
      add: (item) => {
        const wishlist = getWishlist();
        const exists = wishlist.some(w => w.id === item.id && w.type === item.type);
        if (!exists) {
          wishlist.push({
            ...item,
            addedAt: new Date().toISOString(),
          });
          saveWishlist(wishlist);
        }
        return wishlist;
      },
      remove: (id, type) => {
        const wishlist = getWishlist();
        const filtered = wishlist.filter(w => !(w.id === id && w.type === type));
        saveWishlist(filtered);
        return filtered;
      },
      clear: () => {
        saveWishlist([]);
      },
    },
    history: {
      getAll: getHistory,
      add: (item) => {
        const history = getHistory();
        history.unshift({
          ...item,
          visitedAt: new Date().toISOString(),
        });
        const limited = history.slice(0, 50);
        saveHistory(limited);
        return limited;
      },
      remove: (id, type) => {
        const history = getHistory();
        const filtered = history.filter(h => !(h.id === id && h.type === type));
        saveHistory(filtered);
        return filtered;
      },
      clear: () => {
        saveHistory([]);
      },
    },
  };
})();
