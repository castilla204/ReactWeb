# 📊 ANÁLISIS COMPLETO DE LLAMADAS API - Página Crear Búsqueda

## 🔍 RESUMEN EJECUTIVO

En la página `/crear-busqueda` se realizan **múltiples llamadas a la API** para diferentes propósitos. Este documento explica cada una y su función.

---

## 📋 LLAMADAS A LA API (En orden de ejecución)

### 1️⃣ **Cargar Tipos de Servicio** (`useServiceTypes`)
**Endpoint:** `GET /api/ServiceType/public`  
**Cuándo se ejecuta:** Al cargar la página (SearchCreationPage)  
**Frecuencia:** Una vez al inicio, con caché de 60 segundos  
**Propósito:** Obtener la lista de tipos de servicio disponibles (ej: "Solo revisión", "Búsqueda web + revisión")  
**Datos devueltos:** Array de tipos con id, name, description, position  
**¿Es pública?:** ✅ Sí (no requiere autenticación)  
**Optimización:** Cache global de 60 segundos para evitar llamadas duplicadas

---

### 2️⃣ **Cargar Categorías** (`useCategories` - CategoryContext)
**Endpoint:** `GET /api/Categories`  
**Cuándo se ejecuta:** Al cargar la página (a través del CategoryContext)  
**Frecuencia:** Una vez al inicio, con caché de 60 segundos  
**Propósito:** Obtener todas las categorías disponibles (ej: "Vehículos", "Inmuebles")  
**Datos devueltos:** Array de categorías con detalles completos  
**¿Es pública?:** ✅ Sí (no requiere autenticación)  
**Optimización:** Cache global de 60 segundos para evitar llamadas duplicadas

---

### 3️⃣ **Cargar Servicio Específico** (Solo si hay `serviceId` en URL)
**Endpoint:** `GET /api/SearchService/{serviceId}`  
**Cuándo se ejecuta:** Solo si la URL tiene `?serviceId=X`  
**Frecuencia:** Una vez al detectar serviceId en la URL  
**Propósito:** Cargar datos completos de un servicio específico para ir directamente al paso 3 (formulario de pago)  
**Datos devueltos:** Servicio completo con experto, precio, imágenes, etc.  
**¿Es pública?:** ❓ Depende de la configuración del endpoint  
**Optimización:** Solo se ejecuta si hay serviceId en la URL

---

### 4️⃣ **Cargar Servicios para el Drawer/Lista** (`useInfiniteServices`)
**Endpoint:** `GET /api/SearchService/map-experts?categoryId=X&serviceTypeId=Y&latitude=Z&longitude=W&locationRange=R&page=1&pageSize=20`  
**Cuándo se ejecuta:** Cuando hay categoryId, serviceTypeId, latitude, longitude y locationRange válidos  
**Frecuencia:** 
- Al cambiar cualquiera de los parámetros (categoría, tipo, ubicación, rango)
- Al hacer scroll infinito (carga más páginas)
- Cada vez que cambia el viewport del mapa (si está habilitado)
**Propósito:** Cargar servicios para mostrar en el drawer móvil/lista lateral (infinite scroll)  
**Datos devueltos:** Array paginado de servicios (20 por página)  
**¿Es pública?:** ✅ Sí (no requiere autenticación)  
**Optimización:** 
- Paginación infinita (solo carga cuando se necesita)
- Cache de React Query (30 segundos staleTime)
- Se cancela si cambian los parámetros

**⚠️ PROBLEMA POTENCIAL:** Esta llamada se ejecuta **cada vez que cambian los parámetros**, lo que puede generar múltiples llamadas innecesarias si el usuario cambia rápidamente los filtros.

---

### 5️⃣ **Cargar Servicios para el Mapa** (`useServiceLoader` dentro de MapContainer)
**Endpoint:** `GET /api/SearchService/map-experts?categoryId=X&serviceTypeId=Y&northeastLat=A&northeastLng=B&southwestLat=C&southwestLng=D&zoom=Z&limit=L`  
**Cuándo se ejecuta:** 
- Al cargar el mapa inicialmente (después de 200-300ms de delay)
- Cada vez que el usuario mueve el mapa o hace zoom (con debounce de 500ms)
- Cuando cambia el viewport visible en el mapa
**Frecuencia:** 
- 1 vez al inicio
- Cada vez que se mueve el mapa (con debounce de 500ms)
- Se cancela automáticamente si hay una nueva petición
**Propósito:** Cargar servicios visibles en el viewport actual del mapa (solo los que están en pantalla)  
**Datos devueltos:** Array de servicios únicos dentro del bounds del mapa  
**¿Es pública?:** ✅ Sí (no requiere autenticación)  
**Optimización:** 
- ✅ Caché LRU con TTL de 5 minutos
- ✅ Debounce de 500ms para evitar llamadas excesivas
- ✅ Cancelación automática de peticiones obsoletas
- ✅ Límites adaptativos según zoom (menos servicios en zoom bajo)
- ✅ Deduplicación por ID

**⚠️ NOTA:** Esta es la llamada que muestra los **3 servicios reales** en el mapa. Es diferente de `useInfiniteServices` que carga servicios para el drawer.

---

### 6️⃣ **Verificar Favoritos Individuales** (`checkFavorite` - useServiceFavorites)
**Endpoint:** `GET /api/Favorites/check/{serviceId}`  
**Cuándo se ejecuta:** Por cada servicio que se muestra en `MapServiceCard` (card flotante del mapa)  
**Frecuencia:** Una vez por cada servicio visible en el mapa  
**Propósito:** Verificar si el usuario autenticado ha marcado ese servicio como favorito  
**Datos devueltos:** `{ success: true, data: { isFavorite: boolean, favoriteId: number | null } }`  
**¿Es pública?:** ❌ No (requiere autenticación)  
**Optimización:** 
- Solo se ejecuta si el usuario está autenticado
- Cache de React Query (30 segundos staleTime)
- Se cancela si el usuario no está autenticado

**⚠️ PROBLEMA POTENCIAL:** Si hay 3 servicios en el mapa, se hacen **3 llamadas individuales** para verificar favoritos. Esto podría optimizarse usando `checkMultipleFavorites`.

---

### 7️⃣ **Verificar Favoritos Múltiples** (`checkMultipleFavorites` - useServiceFavorites)
**Endpoint:** `POST /api/Favorites/check-multiple`  
**Cuándo se ejecuta:** Cuando se abre el drawer y hay servicios en la lista  
**Frecuencia:** Una vez al abrir el drawer (si hay servicios)  
**Propósito:** Verificar favoritos de **todos los servicios del drawer de una vez** (optimización)  
**Datos devueltos:** `{ success: true, data: { [serviceId]: isFavorite } }`  
**¿Es pública?:** ❌ No (requiere autenticación)  
**Optimización:** 
- Una sola llamada para múltiples servicios (mucho más eficiente)
- Cache de React Query (30 segundos staleTime)
- Solo se ejecuta si el usuario está autenticado

**✅ ESTA ES LA OPTIMIZACIÓN CORRECTA:** En lugar de hacer N llamadas individuales, hace 1 llamada con todos los IDs.

---

## 📊 RESUMEN DE LLAMADAS POR ESCENARIO

### Escenario 1: Usuario entra a la página sin parámetros
1. ✅ `GET /api/ServiceType/public` - Cargar tipos de servicio
2. ✅ `GET /api/Categories` - Cargar categorías
3. ⏸️ Espera a que el usuario seleccione categoría, tipo y ubicación

**Total: 2 llamadas al inicio**

---

### Escenario 2: Usuario selecciona categoría, tipo y ubicación
1. ✅ `GET /api/SearchService/map-experts` (useInfiniteServices) - Cargar servicios para drawer
2. ✅ `GET /api/SearchService/map-experts` (useServiceLoader) - Cargar servicios para mapa
3. ✅ `GET /api/Favorites/check-multiple` - Verificar favoritos (si está autenticado)

**Total: 2-3 llamadas** (depende si está autenticado)

---

### Escenario 3: Usuario mueve el mapa
1. ✅ `GET /api/SearchService/map-experts` (useServiceLoader) - Cargar servicios del nuevo viewport
   - Con debounce de 500ms
   - Se cancela si mueve el mapa antes de que termine

**Total: 1 llamada por movimiento** (con debounce)

---

### Escenario 4: Usuario hace scroll infinito en el drawer
1. ✅ `GET /api/SearchService/map-experts` (useInfiniteServices, página siguiente)
   - Solo si hay más páginas disponibles

**Total: 1 llamada por página adicional**

---

## ⚠️ PROBLEMAS IDENTIFICADOS

### 🔴 PROBLEMA #1: Duplicación de Llamadas
**Situación:** Tanto `useInfiniteServices` como `useServiceLoader` llaman al mismo endpoint `/api/SearchService/map-experts` pero con parámetros diferentes:
- `useInfiniteServices`: Usa `latitude`, `longitude`, `locationRange`, `page`, `pageSize`
- `useServiceLoader`: Usa `northeastLat`, `northeastLng`, `southwestLat`, `southwestLng`, `zoom`, `limit`

**Impacto:** Se hacen **2 llamadas diferentes** para cargar servicios, aunque podrían compartir datos.

**Solución recomendada:** 
- Unificar en una sola fuente de datos
- O sincronizar ambos hooks para evitar duplicación

---

### 🔴 PROBLEMA #2: Favoritos Individuales en el Mapa
**Situación:** Cada `MapServiceCard` hace su propia llamada `checkFavorite` individual.

**Impacto:** Si hay 3 servicios en el mapa → 3 llamadas individuales para favoritos.

**Solución recomendada:**
- Usar `checkMultipleFavorites` también para los servicios del mapa
- Pasar los IDs de los servicios visibles en el mapa

---

### 🔴 PROBLEMA #3: useInfiniteServices se Ejecuta Demasiado
**Situación:** `useInfiniteServices` se ejecuta cada vez que cambian los parámetros, incluso si el usuario no está viendo el drawer.

**Impacto:** Llamadas innecesarias si el usuario solo está viendo el mapa.

**Solución recomendada:**
- Lazy loading: Solo cargar cuando se abre el drawer
- O deshabilitar si el drawer no está visible

---

## ✅ OPTIMIZACIONES YA IMPLEMENTADAS

1. ✅ **Cache global** para categorías y tipos de servicio (60 segundos)
2. ✅ **Debounce** en MapContainer (500ms) para evitar llamadas excesivas
3. ✅ **Cancelación automática** de peticiones obsoletas
4. ✅ **Caché LRU** en useServiceLoader (5 minutos, máximo 20 entradas)
5. ✅ **Deduplicación** de servicios por ID
6. ✅ **Paginación infinita** para el drawer (solo carga cuando se necesita)
7. ✅ **checkMultipleFavorites** para el drawer (1 llamada en lugar de N)

---

## 📈 MÉTRICAS ESTIMADAS

### Carga Inicial (sin parámetros):
- **2 llamadas** (tipos de servicio + categorías)

### Carga Inicial (con parámetros):
- **3-4 llamadas**:
  1. Tipos de servicio (cache)
  2. Categorías (cache)
  3. Servicios para drawer (useInfiniteServices)
  4. Servicios para mapa (useServiceLoader)
  5. Favoritos múltiples (si está autenticado)

### Durante el Uso:
- **1 llamada** cada vez que mueve el mapa (con debounce)
- **1 llamada** cada vez que hace scroll infinito
- **1 llamada** cada vez que cambia un filtro (categoría, tipo, ubicación)

---

## 🎯 RECOMENDACIONES

1. **Unificar fuentes de datos:** Hacer que `useInfiniteServices` y `useServiceLoader` compartan caché
2. **Lazy loading del drawer:** Solo cargar servicios cuando se abre el drawer
3. **Optimizar favoritos del mapa:** Usar `checkMultipleFavorites` también para servicios del mapa
4. **Debounce en filtros:** Agregar debounce cuando el usuario cambia filtros rápidamente

---

**Última actualización:** 2025-01-29  
**Versión del análisis:** 1.0.0
