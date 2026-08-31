// Módulo de seguridad y validación
const Security = (() => {
  // Sanitizar HTML para prevenir XSS
  const sanitizeHTML = (text) => {
    if (!text) return '';

    const element = document.createElement('div');
    element.textContent = text;
    return element.innerHTML;
  };

  // Validar email
  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email.trim());
  };

  // Validar número
  const validateNumber = (value, min = 1, max = Infinity) => {
    const num = parseFloat(value);
    return !isNaN(num) && num >= min && num <= max;
  };

  // Validar longitud de string
  const validateLength = (text, min = 0, max = Infinity) => {
    const length = text.trim().length;
    return length >= min && length <= max;
  };

  // Validar query de búsqueda (prevenir inyección)
  const validateSearchQuery = (query) => {
    if (!query) return false;
    if (query.length < 1) return false;
    if (query.length > 200) return false;

    // Permitir solo caracteres alfanuméricos, espacios y algunos símbolos seguros
    const regex = /^[a-zA-Z0-9\s\-_.()&',:#]/;
    return regex.test(query);
  };

  // Escapar caracteres especiales para URL
  const encodeURIComponent_safe = (str) => {
    try {
      return encodeURIComponent(str);
    } catch (e) {
      console.error('Error encoding URI component:', e);
      return '';
    }
  };

  // Rate limiting simple (prevenir spam)
  const createRateLimiter = (limit = 5, windowMs = 60000) => {
    const calls = {};

    return (key) => {
      const now = Date.now();
      if (!calls[key]) {
        calls[key] = [];
      }

      // Limpiar llamadas antiguas
      calls[key] = calls[key].filter(time => now - time < windowMs);

      if (calls[key].length >= limit) {
        return false; // Rate limit exceeded
      }

      calls[key].push(now);
      return true; // OK
    };
  };

  // Validar formulario de lista de deseos (Variante B - Preferencias)
  const validateWishlistForm = (formData) => {
    const errors = [];

    // Validar cantidad
    if (!formData.quantity || !validateNumber(formData.quantity, 1)) {
      errors.push('Cantidad debe ser un número mayor a 0');
    }

    // Validar categoría
    if (!formData.category || !validateLength(formData.category, 1, 50)) {
      errors.push('Categoría debe tener entre 1 y 50 caracteres');
    }

    // Validar notas
    if (formData.notes && !validateLength(formData.notes, 0, 500)) {
      errors.push('Notas no pueden exceder 500 caracteres');
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  };

  // Validar formulario de contacto (si lo implementas)
  const validateContactForm = (formData) => {
    const errors = [];

    // Validar nombre
    if (!formData.name || !validateLength(formData.name, 3, 100)) {
      errors.push('Nombre debe tener entre 3 y 100 caracteres');
    }

    // Validar email
    if (!formData.email || !validateEmail(formData.email)) {
      errors.push('Email no válido');
    }

    // Validar mensaje
    if (formData.message && !validateLength(formData.message, 0, 1000)) {
      errors.push('Mensaje no puede exceder 1000 caracteres');
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  };

  // Crear CSRF token (simple, sin servidor)
  const generateCSRFToken = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  // Validar objeto (whitelist de propiedades)
  const validateObject = (obj, schema) => {
    for (const [key, validator] of Object.entries(schema)) {
      if (!validator(obj[key])) {
        return false;
      }
    }
    return true;
  };

  return {
    sanitizeHTML,
    validateEmail,
    validateNumber,
    validateLength,
    validateSearchQuery,
    encodeURIComponent: encodeURIComponent_safe,
    createRateLimiter,
    validateWishlistForm,
    validateContactForm,
    generateCSRFToken,
    validateObject,
  };
})();
