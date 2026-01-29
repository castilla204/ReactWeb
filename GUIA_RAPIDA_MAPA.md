# 🚀 Guía Rápida - Nuevo Sistema de Mapas

## ⚡ Resumen Ejecutivo

El nuevo sistema de mapas usa **`MapContainer`** en lugar de `LocationMap`. Carga servicios automáticamente según el viewport del mapa, sin necesidad de hooks externos como `useMapExperts`.

---

## 🔄 Cambio Principal

### ❌ ANTES (Implementación Antigua)
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

### ✅ AHORA (Nueva Implementación)
```typescript
import { MapContainer } from '../components/Map';

<MapContainer
  categoryId={categoryId}
  serviceTypeId={serviceTypeId}
  onServiceSelect={(service) => {
    // service es un objeto Service completo
    setSelectedServiceId(service.id);
  }}
  selectedServiceId={selectedServiceId}
/>
```

---

## 📦 Componente Principal: MapContainer

**Ubicación:** `src/components/Map/MapContainer.tsx`

**Lo que hace:**
- ✅ Carga servicios automáticamente según el viewport
- ✅ Maneja debounce y caché internamente
- ✅ Renderiza marcadores automáticamente
- ✅ No necesita hooks externos

**Props mínimas requeridas:**
```typescript
<MapContainer
  categoryId={number}      // Requerido
  serviceTypeId={number}   // Requerido
/>
```

**Props opcionales:**
```typescript
<MapContainer
  categoryId={1}
  serviceTypeId={1}
  initialCenter={{ lat: 40.4168, lng: -3.7038 }}  // Centro inicial
  initialZoom={12}                                 // Zoom inicial
  onServiceSelect={(service) => {...}}            // Callback al seleccionar
  selectedServiceId={123}                          // ID del servicio seleccionado
  isMobile={false}                                 // Si es móvil
/>
```

---

## 🎯 Cómo Funciona Internamente

### 1. El usuario mueve el mapa
```
Usuario arrastra/zoom el mapa
  ↓
MapContainer detecta el cambio (con debounce 400ms)
  ↓
Calcula los nuevos bounds (northeast, southwest)
  ↓
Llama a useServiceLoader con los bounds
```

### 2. useServiceLoader carga los servicios
```
useServiceLoader recibe bounds
  ↓
Verifica caché (si existe, devuelve datos en caché)
  ↓
Si no está en caché, hace petición a:
GET /api/SearchService/map-experts?categoryId=X&serviceTypeId=Y&northeastLat=...&southwestLat=...
  ↓
Recibe: { services: [...], pagination: {...} }
  ↓
Guarda en caché y actualiza servicios
```

### 3. Los marcadores se renderizan
```
services se actualiza
  ↓
ClusteredMarkers recibe los servicios
  ↓
Renderiza ServiceMarker para cada servicio
  ↓
Marcadores aparecen en el mapa
```

---

## 🔌 Endpoint del Backend

**URL:** `/api/SearchService/map-experts`

**Parámetros:**
- `categoryId` (requerido)
- `serviceTypeId` (requerido)
- `northeastLat`, `northeastLng`, `southwestLat`, `southwestLng` (opcionales, para bounds)
- `zoom` (opcional)
- `limit` (opcional)

**Respuesta:**
```json
{
  "services": [
    {
      "id": 1,
      "lat": 40.4168,
      "lng": -3.7038,
      "name": "Nombre del experto",
      "price": 50,
      "expertProfileId": 123,
      "profilePictureUrl": "...",
      "averageRating": 4.5,
      "totalReviews": 10
    }
  ],
  "pagination": {
    "totalCount": 100
  }
}
```

---

## 💡 Ejemplos de Uso

### Ejemplo 1: Uso Básico
```typescript
import { MapContainer } from '../components/Map';

function MiComponente() {
  return (
    <div style={{ width: '100%', height: '500px' }}>
      <MapContainer
        categoryId={1}
        serviceTypeId={1}
      />
    </div>
  );
}
```

### Ejemplo 2: Con Selección de Servicio
```typescript
import { MapContainer } from '../components/Map';
import { Service } from '../hooks/useServiceLoader';
import { useState } from 'react';

function MiComponente() {
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);

  const handleServiceSelect = (service: Service) => {
    setSelectedServiceId(service.id);
    console.log('Servicio seleccionado:', service);
  };

  return (
    <div style={{ width: '100%', height: '500px' }}>
      <MapContainer
        categoryId={1}
        serviceTypeId={1}
        onServiceSelect={handleServiceSelect}
        selectedServiceId={selectedServiceId}
      />
    </div>
  );
}
```

### Ejemplo 3: Con Ubicación Inicial
```typescript
import { MapContainer } from '../components/Map';

function MiComponente() {
  const madrid = { lat: 40.4168, lng: -3.7038 };

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <MapContainer
        categoryId={1}
        serviceTypeId={1}
        initialCenter={madrid}
        initialZoom={12}
      />
    </div>
  );
}
```

---

## ⚙️ Configuración

### API Key de Google Maps

**Opción 1: Variable de entorno (Recomendado)**
```env
# .env
VITE_GOOGLE_MAPS_API_KEY=tu_api_key_aqui
```

**Opción 2: Fallback automático**
Si no hay variable de entorno, usa una key hardcodeada como fallback (solo para desarrollo).

---

## 🎨 Personalización

### Cambiar Estilos del Mapa

Editar `src/components/Map/MapContainer.tsx`:

```typescript
const mapOptions = useMemo(() => ({
  disableDefaultUI: true,        // Ocultar controles por defecto
  zoomControl: true,              // Mostrar control de zoom
  gestureHandling: 'greedy',     // 'greedy' o 'cooperative'
  styles: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    },
  ],
}), [isMobile]);
```

### Cambiar Estilos de Marcadores

Editar `src/components/Map/ServiceMarker.tsx`:

```typescript
// Cambiar colores, tamaños, etc.
style={{
  background: '#ffffff',
  color: 'rgb(34, 34, 34)',
  padding: '4px 12px',
  borderRadius: '20px',
  // ...
}}
```

---

## 🐛 Problemas Comunes

### El mapa no se muestra
- ✅ Verificar API key en `.env` o que el fallback funcione
- ✅ Verificar que `@vis.gl/react-google-maps` esté instalado

### Los servicios no aparecen
- ✅ Verificar que `categoryId` y `serviceTypeId` sean válidos
- ✅ Revisar la consola del navegador para errores de API
- ✅ Verificar que el endpoint devuelva datos en el formato correcto

### El mapa es lento
- ✅ Aumentar el debounce (actualmente 400ms)
- ✅ Reducir el límite de resultados
- ✅ Verificar que el caché esté funcionando

---

## 📝 Checklist de Migración

Si estás migrando desde `LocationMap`:

- [ ] Reemplazar `import { LocationMap }` por `import { MapContainer }`
- [ ] Eliminar `useMapExperts` (ya no es necesario)
- [ ] Eliminar props `mapExperts` y `services` (se cargan automáticamente)
- [ ] Cambiar `onServiceSelect` para recibir objeto `Service` completo
- [ ] Cambiar `selectedService` por `selectedServiceId` (número)
- [ ] Eliminar lógica de `handleBoundsChange` (se maneja internamente)

---

## 🔑 Puntos Clave

1. **No necesitas `useMapExperts`** - MapContainer lo maneja internamente
2. **No necesitas pasar servicios** - Se cargan automáticamente según el viewport
3. **El debounce es automático** - 400ms de delay antes de hacer petición
4. **El caché es automático** - Evita peticiones duplicadas
5. **Los marcadores se renderizan automáticamente** - No necesitas crear marcadores manualmente

---

**¿Necesitas más detalles?** Ver `NUEVO_SISTEMA_MAPA.md` para documentación completa.
