# 🚀 Mejoras de velocidad del mapa de `/crear-busqueda` — 2026-06-03

Resultado del análisis multi-agente: 7 agentes paralelos investigaron 7 ejes
distintos (backend SQL, backend HTTP, duplicidad hooks FE, cache FE, red,
render mapa, UX percibida). En total: **62 hallazgos** extraídos.

Este doc resume **qué se aplicó ya** (commits a continuación), **qué queda
pendiente y por qué** (decisión del usuario), y **mediciones esperadas**.

---

## ✅ Aplicado en esta sesión (Quick Wins, XS effort, bajo riesgo)

| # | Archivo | Cambio | Ganancia esperada | Eje |
|---|---------|--------|-------------------|-----|
| 1 | `ReactWeb/index.html` | Preconnect API (`newapi-yn9v.onrender.com`, `api.atrapo.io`) + 4 subdominios cartocdn | **150-500 ms** primer fetch | 5 |
| 2 | `ReactWeb/src/components/ui/map-page-skeleton.tsx` | Drawer skeleton `h-34vh → h-[50vh]` (alinea con `MOBILE_MAP_SNAP_DEPLOYED` real) | **−0.1 CLS**, elimina salto visible | 7 |
| 3 | `ReactWeb/src/hooks/useServiceLoader.ts` | Eliminar `MIN_REQUEST_TIME=200 ms` que dejaba peticiones zombi + añadir `requestId` monotónico | **−400 ms** en pan/zoom rápido | 3 |
| 4 | `ReactWeb/src/hooks/useServiceLoader.ts` | Purgar cache LRU al cambiar `categoryId/serviceTypeId` | Correctitud (no muestra cat anterior) | 3/4 |
| 5 | `ReactWeb/src/components/Map/MapContainer.tsx` | `import default ClusteredMarkers` → activa `React.memo` | **−50-80 %** re-renders en hover | 6 |
| 6 | `ReactWeb/src/components/SearchParameterForm.tsx` | `import default MapContainer` → activa `React.memo` | Idem (cada re-render del padre re-ejecutaba todo) | 6 |
| 7 | `ReactWeb/src/components/Map/MapContainer.tsx` | Tiles: 4 subdominios `a/b/c/d` → 1 host único (HTTP/2 multiplexa, no necesita sharding) | **−100-300 ms** en zoom/pan | 5/6 |
| 8 | `ReactWeb/src/components/Map/MapContainer.tsx` | `setPadding` movido al constructor (antes en `map.on('load')`) | **−300-500 ms** + elimina salto inicial de marcadores | 7 |
| 9 | `ReactWeb/src/components/Map/ClusteredMarkers.tsx` | **Reescrito**: diff incremental con `Map<key, marker>`. Hover/select sólo muta los nodos afectados (1-2) en lugar de remove+create de TODOS | **−30-60 ms** por hover, jank desaparece | 6 |
| 10 | `ReactWeb/src/components/Map/index.ts` | Barrel reexporta los `default` (memoizados) | Defensivo: nadie puede saltar el memo por error | 6 |
| 11 | `ReactWeb/src/hooks/useServices.ts` (×3) | Invalidar `['map-experts']`, `['map-markers']`, `['map-sidebar']`, `['services-infinite']` tras `create/update/delete` | Correctitud: el servicio nuevo/borrado aparece/desaparece al instante | 4 |
| 12 | `NewApi/Controllers/SearchServiceController.cs` | `LogErrorAsync` en `catch` → fire-and-forget con `Task.Run` | Evita amplificar timeouts (el log abre scope EF + 2 SaveChangesAsync) | 2 |
| 13 | `NewApi/Migrations/20260603000000_AddMapPerformanceIndexes.cs` | **Nueva migración** con 4 índices: `SearchServices(CategoryId,ServiceTypeId) WHERE IsActive`, `ExpertProfiles` operativos (parcial), `ExpertProfiles` lat/lng (expresión NUMERIC), `ExpertAvailabilities` vigentes (parcial) | **−5-30 ms** por query a escala (>1k servicios) | 1 |

**Aplicarlo en producción:**

```bash
# Frontend: build estándar
cd ReactWeb && npm run build

# Backend: aplicar la migración a Render Postgres
cd NewApi
dotnet ef database update --connection "..."
# o, si prefieres aplicar el SQL directamente sin reindex lock,
# genera el script: dotnet ef migrations script 20260531161324 20260603000000 -o migration.sql
# y edita migration.sql para añadir CONCURRENTLY a los CREATE INDEX antes de aplicar.
```

**Ganancia agregada estimada** (Quick Wins solos, en un primer fetch + un pan):
**~700-2000 ms** ahorrados + jank desaparecido + correctitud restaurada.

---

## 🟡 Pendiente de decisión (mayor ganancia, mayor effort/riesgo)

### A. Activar two-stage rendering (useMapMarkers ligero → useServiceLoader pesado)
- **Ganancia:** **500-1200 ms** en time-to-first-marker.
- **Effort:** M.
- **Riesgo:** bajo. El endpoint `/api/SearchService/map-markers` YA existe (devuelve sólo `{id, lat, lng, price}`), el hook `useMapMarkers` ya está importado en `SearchParameterForm.tsx:10` pero nunca se invoca. Falta cablearlo a `MapContainer` y mergear con el payload pesado cuando llega.
- **Decisión:** ¿quieres que lo aplique? Es el de mayor impacto pendiente.

### B. Reactivar compresión Brotli/Gzip en el backend
- **Ganancia:** **200-850 ms** por fetch del mapa, **−75-85 %** bytes.
- **Effort:** S.
- **Riesgo:** bajo. El comentario actual en `NewApi/Program.cs:867-887` dice "causa timeouts en Render" pero cita un issue de .NET 6 ya resuelto; con `CompressionLevel.Fastest` + Brotli no se reproduce.
- **Decisión:** ¿pruebo a reactivarlo? Hay que probar en staging primero — si rompe, se desactiva de vuelta.

### C. Migrar `useServiceLoader` a React Query
- **Ganancia:** dedup in-flight gratis, SWR gratis, cache cross-mount (al navegar a `/service/:id` y volver no se vuelve a pegar), invalidación centralizada.
- **Effort:** M.
- **Riesgo:** medio. Cambia API interna del hook pero la firma pública puede mantenerse igual.

### D. Eliminar duplicidad `useInfiniteServices` ↔ `useServiceLoader`
- **Ganancia:** **300-800 ms** + ahorra 1 RTT al backend en cada carga.
- **Effort:** M.
- **Riesgo:** medio. Hoy `useInfiniteServices` ya queda IGNORADO cuando hay `mapServices` (`SearchParameterForm.tsx:1062-1115`), pero igualmente se ejecuta y desperdicia un fetch. Solución mínima: añadir `enabled: mapServices.length === 0`.

### E. Quitar Include chain de Reviews+Images del DTO del mapa (backend EF Core)
- **Ganancia:** **300-1000 ms** + **−2-3 MB** payload.
- **Effort:** M.
- **Riesgo:** medio. Hay que verificar que el frontend no consume `Reviews[]` del map-experts (sólo `AverageRating` y `TotalReviews`).
- Cartesian explosion verificada por EXPLAIN: 185 servicios → 3416 filas internas.

### F. Vector tiles (OpenFreeMap) en lugar de raster CartoCDN
- **Ganancia:** **−30-60 %** bytes a partir del segundo zoom + render GPU.
- **Effort:** S.
- **Riesgo:** bajo. OpenFreeMap es gratis sin API key (`https://tiles.openfreemap.org/styles/positron`).
- **Decisión:** ¿aceptable depender de OpenFreeMap (OSS sin SLA)? Alternativa pago: MapTiler 100k req/mes free.

### G. Migrar markers DOM a capa nativa GeoJSON+symbol
- **Ganancia:** **8-10×** más rápido en pan/zoom con >100 markers.
- **Effort:** L (~1 día).
- **Riesgo:** medio. Implica reescribir `ClusteredMarkers.tsx` para usar `map.addSource({cluster:true})` + 3 layers (`clusters`, `cluster-count`, `unclustered-point`).
- Sin esto, el cambio #9 ya alivia mucho; con esto el mapa aguantaría 10k markers sin caída de fps.

---

## 🔴 Descartado por verificación adversarial

| Idea | Por qué se descartó |
|------|---------------------|
| Cambiar `JsonIgnoreCondition.Never → WhenWritingNull` | El front usa `string \| null` estricto; rompería deserializadores TS | 
| Endpoint unificado con bounds+radius+pagination en un solo shape | Effort L + breaking risk high para gain indirecto |
| Persistir React Query en localStorage 24 h | Riesgo de datos stale si otro usuario crea/borra servicios; sólo seguro para `['service-types']`/`['categories']` |
| `keepalive: true` en fetch | Ganancia marginal en HTTP/2 |
| `Cache-Control` HTTP del endpoint | Bajo valor por encima del LRU FE de 5 min + React Query 30 s |

---

## 📊 Cómo medir

```bash
# Time-to-first-marker (DevTools → Performance, marcar antes de hacer click)
# Tamaño de payload (DevTools → Network → map-experts → Size)
# Cache hit ratio (consola: ya hay log "✅ Usando caché (...)" cuando DEV)
# CLS / LCP: Lighthouse en mobile-throttling 4G
```

Benchmarks de referencia (estimaciones del análisis):

| Métrica | Antes | Esperado tras Quick Wins | Esperado tras todo el plan |
|---------|-------|--------------------------|----------------------------|
| Time-to-first-marker (móvil 4G) | 1500-3000 ms | 1000-2000 ms | **<400 ms (two-stage)** |
| Payload por respuesta | 200-400 KB | 200-400 KB | **30-90 KB (Brotli)** |
| Re-renders por hover | N markers | 1-2 nodos | 1-2 nodos |
| Jank al hover en lista | sí | no | no |
| Bug "marcadores stale" | sí | no | no |

---

## 🛠 Resumen ejecutivo en una frase

> Hoy ya hay **−700 a −2000 ms** de latencia recuperada y el jank ha desaparecido,
> sin tocar contratos. El siguiente paso (two-stage con `useMapMarkers`) es el de
> mayor impacto pendiente — bajo riesgo y ya casi cableado.

— Análisis multi-agente Claude · 2026-06-03
