# 🗺️ Nuevo Sistema de Mapas - Documentación Completa

## 📋 Resumen

Se ha implementado un sistema de mapas profesional con carga dinámica de servicios, similar a Airbnb, Uber o Google Maps. El sistema carga servicios automáticamente según el viewport del mapa, evitando cargar datos innecesarios.

---

## 🏗️ Arquitectura del Sistema

### Componentes Principales

1. **`MapContainer`** - Componente principal del mapa
2. **`ClusteredMarkers`** - Renderiza los marcadores de servicios
3. **`ServiceMarker`** - Marcador individual de un servicio

### Hooks Personalizados

1. **`useServiceLoader`** - Carga servicios dinámicamente según el viewport
2. **`useMapViewport`** - Gestiona el estado del viewport del mapa
3. **`useDebounce`** - Optimiza las actualizaciones con debounce

---

## 📦 Componentes

### 1. MapContainer

**Ubicación:** `src/components/Map/MapContainer.tsx`

**Descripción:** Componente principal que renderiza el mapa de Google Maps y gestiona la carga dinámica de servicios.

**Props:**
```typescript
interface MapContainerProps {
  categoryId: number | null;           // ID de la categoría
  serviceTypeId: number | null;        // ID del tipo de servicio
  initialCenter?: { lat: number; lng: number };  // Centro inicial del mapa
  initialZoom?: number;                // Zoom inicial (default: 12)
  onServiceSelect?: (service: Service) => void;  // Callback al seleccionar servicio
  selectedServiceId?: number | null;   // ID del servicio seleccionado
  isMobile?: boolean;                  // Si es móvil
  className?: string;                   // Clases CSS adicionales
  style?: React.CSSProperties;          // Estilos adicionales
  onMapLoad?: () => void;              // Callback cuando el mapa carga
}
```

**Características:**
- ✅ Carga dinámica de servicios según el viewport
- ✅ Debounce automático para optimizar peticiones
- ✅ Caché en memoria para evitar peticiones duplicadas
- ✅ Manejo de errores y estados de carga
- ✅ Estilos personalizados tipo Airbnb
- ✅ Optimizado para móvil y desktop

**Ejemplo de uso:**
```typescript
import { MapContainer } from '../components/Map';

<MapContainer
  categoryId={1}
  serviceTypeId={1}
  initialCenter={{ lat: 40.4168, lng: -3.7038 }}
  initialZoom={12}
  onServiceSelect={(service) => {
    console.log('Servicio seleccionado:', service);
  }}
  selectedServiceId={selectedServiceId}
  isMobile={isMobile}
/>
```

---

### 2. ClusteredMarkers

**Ubicación:** `src/components/Map/ClusteredMarkers.tsx`

**Descripción:** Renderiza todos los marcadores de servicios en el mapa.

**Props:**
```typescript
interface ClusteredMarkersProps {
  services: Service[];                  // Array de servicios a mostrar
  selectedServiceId?: number | null;   // ID del servicio seleccionado
  onServiceClick?: (service: Service) => void;  // Callback al hacer click
}
```

**Características:**
- ✅ Renderiza todos los marcadores directamente
- ✅ Maneja la selección visual de servicios
- ✅ Optimizado para rendimiento

---

### 3. ServiceMarker

**Ubicación:** `src/components/Map/ServiceMarker.tsx`

**Descripción:** Marcador individual de un servicio con estilo tipo Airbnb.

**Props:**
```typescript
interface ServiceMarkerProps {
  service: Service;                     // Datos del servicio
  isSelected: boolean;                  // Si está seleccionado
  onClick?: (service: Service) => void; // Callback al hacer click
}
```

**Características:**
- ✅ Muestra el precio del servicio
- ✅ Estilo visual tipo Airbnb (badge con precio)
- ✅ Animación al seleccionar
- ✅ Usa `AdvancedMarker` de Google Maps

---

## 🪝 Hooks Personalizados

### 1. useServiceLoader

**Ubicación:** `src/hooks/useServiceLoader.ts`

**Descripción:** Hook que carga servicios dinámicamente según el viewport del mapa.

**Parámetros:**
```typescript
useServiceLoader(
  categoryId: number | null,
  serviceTypeId: number | null,
  viewport: ViewportRequest | null,
  options?: {
    limit?: number;
    enabled?: boolean;
  }
)
```

**Retorna:**
```typescript
{
  services: Service[];      // Array de servicios cargados
  loading: boolean;         // Si está cargando
  error: string | null;     // Error si existe
  totalCount: number;       // Total de servicios disponibles
}
```

**Características:**
- ✅ Carga servicios según bounds del viewport
- ✅ Caché en memoria (TTL: 5 minutos)
- ✅ Cancelación automática de peticiones anteriores (AbortController)
- ✅ Debounce automático (400ms)
- ✅ Límite de resultados según zoom level

**Ejemplo de uso:**
```typescript
const { services, loading, error } = useServiceLoader(
  categoryId,
  serviceTypeId,
  viewport,
  { limit: 100, enabled: true }
);
```

---

### 2. useMapViewport

**Ubicación:** `src/hooks/useMapViewport.ts`

**Descripción:** Hook que gestiona el estado del viewport del mapa (centro, zoom, bounds).

**Parámetros:**
```typescript
useMapViewport(debounceDelay: number = 400)
```

**Retorna:**
```typescript
{
  viewport: MapViewport;              // Estado del viewport
  onCameraChanged: (ev: google.maps.MapCameraChangedEvent) => void;  // Handler de eventos
  isIdle: boolean;                    // Si el mapa está quieto
}
```

**Características:**
- ✅ Debounce automático para optimizar actualizaciones
- ✅ Detecta cuando el mapa está "idle" (ha dejado de moverse)
- ✅ Proporciona bounds exactos del viewport

---

### 3. useDebounce

**Ubicación:** `src/hooks/useDebounce.ts`

**Descripción:** Hook genérico para debounce de valores.

**Parámetros:**
```typescript
useDebounce<T>(value: T, delay: number): T
```

**Ejemplo de uso:**
```typescript
const debouncedSearch = useDebounce(searchTerm, 300);
```

---

## 🔄 Flujo de Funcionamiento

### 1. Inicialización

```
Usuario entra a la página
  ↓
MapContainer se monta
  ↓
useServiceLoader se inicializa
  ↓
Mapa carga con centro y zoom inicial
  ↓
Se detecta el viewport inicial
  ↓
Primera petición a la API con bounds
```

### 2. Movimiento del Mapa

```
Usuario mueve/zoom el mapa
  ↓
MapEventHandler detecta el cambio
  ↓
Debounce (400ms) para evitar peticiones excesivas
  ↓
Se calculan los nuevos bounds
  ↓
useServiceLoader verifica caché
  ↓
Si no está en caché, hace petición a la API
  ↓
Servicios se actualizan en el mapa
```

### 3. Selección de Servicio

```
Usuario hace click en un marcador
  ↓
ServiceMarker dispara onClick
  ↓
onServiceSelect se ejecuta
  ↓
Componente padre actualiza selectedServiceId
  ↓
Marcador se marca visualmente como seleccionado
```

---

## 🔌 Integración con el Backend

### Endpoint de la API

**URL:** `/api/SearchService/map-experts`

**Parámetros de Query:**
- `categoryId` (requerido) - ID de la categoría
- `serviceTypeId` (requerido) - ID del tipo de servicio
- `northeastLat` (opcional) - Latitud noreste del bounds
- `northeastLng` (opcional) - Longitud noreste del bounds
- `southwestLat` (opcional) - Latitud suroeste del bounds
- `southwestLng` (opcional) - Longitud suroeste del bounds
- `zoom` (opcional) - Nivel de zoom
- `limit` (opcional) - Límite de resultados

**Respuesta:**
```typescript
{
  services: Service[];        // Array de servicios
  pagination: {
    totalCount: number;       // Total de servicios disponibles
    // ... otros campos de paginación
  }
}
```

**Formato de Service:**
```typescript
interface Service {
  id: number;
  lat: number;                // Latitud del experto
  lng: number;                // Longitud del experto
  name: string;                // Nombre del experto
  price: number;              // Precio del servicio
  type?: string;              // Tipo de servicio
  expertProfileId?: number;
  profilePictureUrl?: string;
  averageRating?: number;
  totalReviews?: number;
  serviceDescription?: string;
  serviceTypeName?: string;
  imageUrls?: string[];
}
```

---

## 📝 Cómo Usar en Otras Páginas

### Ejemplo Básico

```typescript
import { MapContainer } from '../components/Map';
import { Service } from '../hooks/useServiceLoader';
import { useState } from 'react';

function MiPagina() {
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const categoryId = 1;
  const serviceTypeId = 1;

  const handleServiceSelect = (service: Service) => {
    setSelectedServiceId(service.id);
    console.log('Servicio seleccionado:', service);
  };

  return (
    <div style={{ width: '100%', height: '500px' }}>
      <MapContainer
        categoryId={categoryId}
        serviceTypeId={serviceTypeId}
        onServiceSelect={handleServiceSelect}
        selectedServiceId={selectedServiceId}
      />
    </div>
  );
}
```

### Ejemplo con Ubicación Inicial

```typescript
import { MapContainer } from '../components/Map';

function MiPagina() {
  const initialCenter = { lat: 40.4168, lng: -3.7038 }; // Madrid
  const initialZoom = 12;

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <MapContainer
        categoryId={1}
        serviceTypeId={1}
        initialCenter={initialCenter}
        initialZoom={initialZoom}
        isMobile={window.innerWidth < 768}
      />
    </div>
  );
}
```

---

## 🔑 Configuración de API Key

### Opción 1: Variable de Entorno (Recomendado)

Crear archivo `.env` en la raíz del proyecto:

```env
VITE_GOOGLE_MAPS_API_KEY=tu_api_key_aqui
VITE_GOOGLE_MAPS_MAP_ID=tu_map_id_aqui
```

### Opción 2: Fallback Hardcodeado

Si no hay variable de entorno, el sistema usa una API key hardcodeada como fallback:

```typescript
const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyBNEdqihExcXPnWw_TJgHFzsPXS7BIazyM';
```

**⚠️ Nota:** La API key hardcodeada es solo para desarrollo. En producción, siempre usar variables de entorno.

---

## 🎨 Personalización de Estilos

### Estilos del Mapa

Los estilos se definen en `MapContainer.tsx` dentro de `mapOptions`:

```typescript
const mapOptions = useMemo(() => ({
  disableDefaultUI: true,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: !isMobile,
  gestureHandling: isMobile ? 'cooperative' : 'greedy',
  clickableIcons: false,
  minZoom: 3,
  maxZoom: 20,
  styles: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    },
    // ... más estilos
  ],
}), [isMobile]);
```

### Estilos de Marcadores

Los estilos de los marcadores se definen en `ServiceMarker.tsx`:

```typescript
// Marcador normal
background: '#ffffff'
color: 'rgb(34, 34, 34)'
border: '1px solid #e5e5e5'

// Marcador seleccionado
background: '#000000'
color: '#ffffff'
border: 'none'
transform: 'scale(1.1)'
```

---

## ⚡ Optimizaciones Implementadas

### 1. Debounce
- **400ms** de delay antes de hacer petición
- Evita peticiones excesivas al mover el mapa

### 2. Caché
- Caché en memoria con TTL de **5 minutos**
- Clave de caché basada en bounds y zoom
- Reduce peticiones duplicadas

### 3. AbortController
- Cancela peticiones anteriores automáticamente
- Evita condiciones de carrera

### 4. Límite de Resultados por Zoom
```typescript
zoom < 10  → 100 resultados
zoom < 14  → 300 resultados
zoom >= 14 → 500 resultados
```

### 5. Filtrado por Bounds
- Solo carga servicios dentro del viewport visible
- Reduce datos innecesarios

---

## 🐛 Solución de Problemas

### El mapa no se muestra

1. Verificar que la API key esté configurada
2. Verificar que `@vis.gl/react-google-maps` esté instalado
3. Revisar la consola del navegador para errores

### Los servicios no se cargan

1. Verificar que `categoryId` y `serviceTypeId` sean válidos
2. Verificar que el endpoint `/api/SearchService/map-experts` funcione
3. Revisar la pestaña Network en DevTools

### Los marcadores no aparecen

1. Verificar que los servicios tengan `lat` y `lng` válidos
2. Verificar que `isMapLoaded` sea `true`
3. Revisar que `services.length > 0`

### El mapa es lento

1. Reducir el límite de resultados
2. Aumentar el delay de debounce
3. Verificar que el caché esté funcionando

---

## 📚 Diferencias con la Implementación Anterior

### ❌ Implementación Antigua (LocationMap)

- Usaba `@react-google-maps/api`
- Carga estática de todos los servicios
- Sin optimizaciones de rendimiento
- Sin caché
- Sin debounce adecuado

### ✅ Nueva Implementación (MapContainer)

- Usa `@vis.gl/react-google-maps` (oficial de Google)
- Carga dinámica según viewport
- Optimizaciones de rendimiento (debounce, caché, AbortController)
- Caché en memoria
- Debounce configurable
- Mejor rendimiento con muchos servicios

---

## 🔄 Migración desde LocationMap

Si tienes código que usa `LocationMap`, reemplázalo así:

### Antes:
```typescript
import { LocationMap } from '../components/LocationMap';
import { useMapExperts } from '../hooks/useMapExperts';

const { experts, loading } = useMapExperts(categoryId, serviceTypeId);

<LocationMap
  mapExperts={experts}
  services={services}
  selectedService={selectedService}
  onServiceSelect={handleServiceSelect}
/>
```

### Después:
```typescript
import { MapContainer } from '../components/Map';

<MapContainer
  categoryId={categoryId}
  serviceTypeId={serviceTypeId}
  onServiceSelect={(service) => handleServiceSelect(service.id)}
  selectedServiceId={selectedService?.id}
/>
```

**Cambios principales:**
- ✅ No necesitas `useMapExperts` - MapContainer lo maneja internamente
- ✅ No necesitas pasar `mapExperts` o `services` - se cargan automáticamente
- ✅ `onServiceSelect` recibe el objeto `Service` completo, no solo el ID
- ✅ `selectedServiceId` es un número, no un objeto

---

## 📖 Referencias

- [@vis.gl/react-google-maps Documentation](https://vis.gl/react-google-maps)
- [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript)
- [AdvancedMarkerElement](https://developers.google.com/maps/documentation/javascript/advanced-markers)

---

## ✅ Checklist de Implementación

- [x] Componente `MapContainer` creado
- [x] Componente `ClusteredMarkers` creado
- [x] Componente `ServiceMarker` creado
- [x] Hook `useServiceLoader` creado
- [x] Hook `useMapViewport` creado
- [x] Hook `useDebounce` creado
- [x] Integración con backend
- [x] Optimizaciones de rendimiento
- [x] Manejo de errores
- [x] Documentación completa

---

**Última actualización:** Diciembre 2024
**Versión:** 1.0.0
