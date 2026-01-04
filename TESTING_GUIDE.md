# 🧪 Guía de Pruebas - Verificación de Funcionalidad

## ✅ Checklist de Pruebas

### 1. Verificar que NO hay recargas constantes

**Pasos:**
1. Abre la consola del navegador (F12 → Console)
2. Navega a la homepage (`/`)
3. **Espera 10-15 segundos** sin hacer nada
4. **Verifica:**
   - ❌ NO deberías ver recargas de página
   - ❌ NO deberías ver múltiples requests repetidos en Network
   - ✅ La página debe permanecer estable

**Qué buscar en la consola:**
```
✅ CORRECTO: Solo logs normales de carga inicial
❌ INCORRECTO: Múltiples logs de "Auth state updated" o "Token refresh"
```

---

### 2. Probar Autenticación

**Pasos:**
1. Si NO estás autenticado:
   - Haz clic en "Iniciar sesión con Google"
   - Completa el proceso de login
   - Verifica que te redirige correctamente

2. Si YA estás autenticado:
   - Verifica que puedes navegar a páginas protegidas
   - Ejemplos: `/busquedas`, `/expert-panel`, `/transacciones`

**Qué buscar en la consola:**
```
✅ CORRECTO:
- "Auth state updated: { user: 'tu@email.com', isAuthenticated: true }"
- "[AuthService] Token expira en X minutos..."

❌ INCORRECTO:
- Múltiples "Signing out user"
- Errores 401 o 403 repetidos
- Redirecciones constantes a "/"
```

---

### 3. Probar Refresh de Tokens

**Pasos:**
1. Inicia sesión
2. Abre la consola
3. Espera o simula que el token expire (normalmente cada 30 minutos)
4. Haz una acción que requiera autenticación (ej: cargar una página protegida)

**Qué buscar en la consola:**
```
✅ CORRECTO:
- "[AuthService] 403 Forbidden, attempting token refresh..."
- "✅ Token renovado exitosamente"
- La acción se completa sin pedir login de nuevo

❌ INCORRECTO:
- "Token refresh failed" seguido de redirección a "/"
- Múltiples intentos de refresh
- Recargas constantes
```

---

### 4. Probar Manejo de Errores 403

**Pasos:**
1. Intenta acceder a un recurso que no tienes permisos (si es posible)
2. O espera a que ocurra un 403 naturalmente

**Qué buscar en la consola:**
```
✅ CORRECTO:
- "[AuthService] 403 Forbidden, attempting token refresh..."
- Si el refresh funciona: el request se completa
- Si el refresh falla: mensaje claro sin recargas infinitas

❌ INCORRECTO:
- Bucle infinito de refresh
- Recargas constantes de página
- Múltiples redirecciones
```

---

### 5. Verificar Homepage

**Pasos:**
1. Navega a la homepage (`/`)
2. Espera a que carguen los servicios
3. Observa la consola y la pestaña Network

**Qué buscar:**
```
✅ CORRECTO:
- Una sola llamada a "homepage-wall"
- Los servicios se muestran correctamente
- No hay recargas de página

❌ INCORRECTO:
- Múltiples llamadas a "homepage-wall"
- La página se recarga constantemente
- Los servicios no aparecen o aparecen y desaparecen
```

---

## 🔍 Comandos Útiles en la Consola

Puedes ejecutar estos comandos en la consola del navegador para verificar el estado:

```javascript
// Verificar si hay token
localStorage.getItem('accessToken') ? '✅ Token presente' : '❌ Sin token'

// Verificar estado de autenticación
console.log('Token:', localStorage.getItem('accessToken')?.substring(0, 20) + '...')

// Verificar si hay refresh token
localStorage.getItem('refreshToken') ? '✅ Refresh token presente' : '❌ Sin refresh token'

// Limpiar tokens (para probar desde cero)
localStorage.clear()
```

---

## 🐛 Problemas Comunes y Soluciones

### Problema: La página se recarga constantemente
**Solución:**
1. Abre la consola
2. Busca errores repetidos
3. Verifica si hay bucles en los logs
4. Si persiste, limpia el localStorage: `localStorage.clear()` y recarga

### Problema: Errores 403 constantes
**Solución:**
1. Verifica que el token no esté expirado
2. Intenta cerrar sesión y volver a iniciar sesión
3. Verifica en la consola si el refresh de token está funcionando

### Problema: No puedo acceder a páginas protegidas
**Solución:**
1. Verifica que estés autenticado: `localStorage.getItem('accessToken')`
2. Si no hay token, inicia sesión de nuevo
3. Verifica en la consola si hay errores de autenticación

---

## ✅ Resultado Esperado

Después de todas las pruebas, deberías tener:
- ✅ Página estable sin recargas constantes
- ✅ Autenticación funcionando correctamente
- ✅ Tokens refrescándose automáticamente
- ✅ Errores manejados sin bucles infinitos
- ✅ Homepage cargando correctamente

Si todo esto funciona, ¡los cambios están funcionando correctamente! 🎉


