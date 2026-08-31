#!/bin/bash

echo "🔒 Verificación de Seguridad - ComicDB"
echo "======================================"
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASS=0
FAIL=0

# Función para verificar
check() {
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ $1${NC}"
    ((PASS++))
  else
    echo -e "${RED}❌ $1${NC}"
    ((FAIL++))
  fi
}

# Test 1: Verificar que .env existe
echo "1. Verificando .env..."
[ -f ".env" ]
check ".env existe"

# Test 2: Verificar que .env NO está en git
echo ""
echo "2. Verificando .gitignore..."
grep -q "^\.env$" ".gitignore"
check ".env está en .gitignore"

# Test 3: Verificar que API_KEY NO está en archivos JavaScript
echo ""
echo "3. Verificando que API_KEY no está expuesta..."
! grep -r "48b0130630fd4f8d42baa2ece75dae399fc446e0" js/ --include="*.js" 2>/dev/null
check "API_KEY no está en js/"

# Test 4: Verificar que security.js existe
echo ""
echo "4. Verificando módulo de seguridad..."
[ -f "js/security.js" ]
check "security.js existe"

# Test 5: Verificar que index.html carga security.js
echo ""
echo "5. Verificando que security.js está cargado..."
grep -q "security.js" index.html
check "security.js está en index.html"

# Test 6: Verificar que .env.example existe
echo ""
echo "6. Verificando .env.example..."
[ -f ".env.example" ]
check ".env.example existe (sin valores)"

# Test 7: Verificar que server.js carga .env
echo ""
echo "7. Verificando que server.js carga .env..."
grep -q "loadEnv" server.js
check "server.js carga .env"

# Test 8: Verificar headers de seguridad en server.js
echo ""
echo "8. Verificando headers de seguridad..."
grep -q "X-Content-Type-Options" server.js
check "Header X-Content-Type-Options configurado"

grep -q "X-Frame-Options" server.js
check "Header X-Frame-Options configurado"

grep -q "X-XSS-Protection" server.js
check "Header X-XSS-Protection configurado"

# Test 9: Verificar validaciones en detail.js
echo ""
echo "9. Verificando validaciones en detail.js..."
grep -q "validateWishlistForm" "js/views/detail.js"
check "Validaciones de formulario en detail.js"

# Test 10: Verificar sanitización en search.js
echo ""
echo "10. Verificando sanitización en search.js..."
grep -q "sanitizeHTML\|validateSearchQuery" "js/views/search.js"
check "Sanitización en search.js"

# Test 11: Verificar SECURITY.md
echo ""
echo "11. Verificando documentación..."
[ -f "SECURITY.md" ]
check "SECURITY.md existe"

# Test 12: Verificar endpoint /api/config en server.js
echo ""
echo "12. Verificando endpoint de configuración pública..."
grep -q "/api/config" server.js
check "Endpoint /api/config existe"

# Resumen
echo ""
echo "======================================"
echo "📊 Resumen"
echo "======================================"
echo -e "${GREEN}Pasados: $PASS${NC}"
echo -e "${RED}Fallidos: $FAIL${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
  echo -e "${GREEN}✅ Todas las verificaciones pasaron${NC}"
  exit 0
else
  echo -e "${RED}❌ Algunas verificaciones fallaron${NC}"
  exit 1
fi
