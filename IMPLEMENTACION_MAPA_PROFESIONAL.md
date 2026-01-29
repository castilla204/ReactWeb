# 🗺️ Implementación de Mapa Profesional - Guía Completa

Esta implementación sigue las mejores prácticas recomendadas por múltiples IAs para crear un sistema de mapas profesional similar a Airbnb, con carga dinámica de servicios, clustering y optimizaciones de rendimiento.

## 📦 Dependencias Instaladas

- `@vis.gl/react-google-maps` - Librería oficial moderna de Google Maps para React
- `use-supercluster` - Para clustering avanzado (opcional, ya incluido en MarkerClusterer)
- `@googlemaps/markerclusterer` - Ya estaba instalado, ahora se usa correctamente

## 🏗️ Arquitectura

### Componentes Creados

1. **`MapContainer.tsx`** - Componente principal del mapa
   - Gestiona la carga dinámica de servicios según el viewport
   - Implementa debounce para optimizar llamadas a la API
   - Maneja estados de carga y errores
   - Responsive para móvil y desktop

2. **`ClusteredMarkers.tsx`** - Gestión de clustering
   - Agrupa marcadores cercanos automáticamente
   - Muestra sin clustering si hay < 50 servicios (mejor UX)
   - Usa `@googlemaps/markerclusterer` para agrupación

3. **`ServiceMarker.tsx`** - Marcador individual de servicio
   - Estilo similar a Airbnb (badge circular con precio)
   - Estados seleccionado/no seleccionado
   - Animaciones suaves

4. **`ClusterMarker.tsx`** - Marcador de cluster
   - Muestra número de servicios agrupados
   - Colores y tamaños según cantidad

### Hooks Personalizados

1. **`useDebounce.ts`** - Debounce de valores
   - Evita múltiples llamadas durante interacciones rápidas

2. **`useMapViewport.ts`** - Gestión del viewport del mapa
   - Detecta cambios en bounds y zoom
   - Implementa debounce integrado
   - Previene llamadas duplicadas

3. **`useServiceLoader.ts`** - Carga de servicios
   - Carga servicios según viewport visible
   - Implementa caché (5 minutos TTL)
   - Cancelación de peticiones con AbortController
   - Límites dinámicos según zoom

## ⚙️ Configuración

### Variables de Entorno

**✅ La API Key ya está hardcodeada en el proyecto** (`AIzaSyBNEdqihExcXPnWw_TJgHFzsPXS7BIazyM`)

Si quieres usar una key diferente, crea un archivo `.env` en la raíz del proyecto con:

```env
VITE_GOOGLE_MAPS_API_KEY=tu_api_key_aqui
VITE_GOOGLE_MAPS_MAP_ID=opcional_map_id
```

**Nota:**
- El componente usará automáticamente la key hardcodeada si no hay variable de entorno
- El Map ID es opcional, solo si quieres estilos personalizados

### Uso Básico

```tsx
import { MapContainer } from './components/Map';

function MyComponent() {
  const [selectedService, setSelectedService] = useState(null);

  return (
    <MapContainer
      categoryId={1}
      serviceTypeId={2}
      initialCenter={{ lat: 40.4168, lng: -3.7038 }}
      initialZoom={12}
      onServiceSelect={(service) => setSelectedService(service)}
      selectedServiceId={selectedService?.id}
      isMobile={window.innerWidth < 768}
    />
  );
}
```

## 🚀 Características Implementadas

### ✅ Carga Dinámica por Viewport
- Los servicios se cargan automáticamente cuando el usuario mueve el mapa
- Solo se cargan servicios visibles en el área actual
- Debounce de 400ms para evitar spam de peticiones

### ✅ Clustering Profesional
- Agrupa marcadores cercanos automáticamente
- Muestra número de servicios en cada cluster
- Click en cluster para hacer zoom y expandir
- Sin clustering si hay < 50 servicios (mejor UX)

### ✅ Optimizaciones de Rendimiento
- **Caché**: Resultados cacheados por 5 minutos
- **Debounce**: 400ms en eventos de mapa
- **Cancelación**: Peticiones anteriores se cancelan si hay nuevas
- **Límites dinámicos**: Menos resultados en zoom bajo, más en zoom alto
- **Comparación de bounds**: Evita llamadas duplicadas

### ✅ Responsive Design
- Gestos táctiles optimizados para móvil
- `gestureHandling: 'cooperative'` en móvil (requiere 2 dedos para mover mapa)
- Controles adaptados según dispositivo

### ✅ Estados de Carga y Error
- Indicador visual mientras carga servicios
- Mensajes de error claros
- Manejo graceful de errores de red

## 🔄 Flujo de Funcionamiento

1. **Carga Inicial**: El mapa se carga con el centro y zoom iniciales
2. **Detección de Viewport**: Cuando el mapa se estabiliza (evento `idle`), se detectan los bounds actuales
3. **Debounce**: Se espera 400ms para asegurar que el usuario terminó de mover el mapa
4. **Carga de Servicios**: Se hace petición al backend con los bounds actuales
5. **Caché**: Si los bounds ya fueron consultados recientemente, se usan datos cacheados
6. **Renderizado**: Los servicios se muestran como marcadores o clusters según la cantidad
7. **Actualización**: Al mover el mapa de nuevo, el proceso se repite

## 📊 Endpoint del Backend

El componente espera que el backend tenga un endpoint:

```
GET /api/SearchService/map-experts?categoryId={id}&serviceTypeId={id}&northeastLat={lat}&northeastLng={lng}&southwestLat={lat}&southwestLng={lng}&zoom={zoom}&limit={limit}
```

**Respuesta esperada:**
```json
{
  "services": [
    {
      "id": 1,
      "price": 50,
      "expert": {
        "latitude": "40.4168",
        "longitude": "-3.7038",
        "user": {
          "name": "Nombre del Experto"
        }
      },
      "serviceTypeName": "Tipo de Servicio"
    }
  ],
  "pagination": {
    "totalCount": 100
  }
}
```

## 🎨 Personalización

### Estilos del Mapa

Puedes personalizar los estilos del mapa modificando `mapOptions` en `MapContainer.tsx`:

```tsx
const mapOptions = {
  styles: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    },
    // Más estilos...
  ],
};
```

### Estilos de Marcadores

Modifica `ServiceMarker.tsx` para cambiar el diseño de los badges de precio.

### Configuración de Clustering

Ajusta el umbral de clustering en `ClusteredMarkers.tsx` (actualmente 50 servicios).

## 🐛 Troubleshooting

### El mapa no se muestra
- La API Key ya está hardcodeada, debería funcionar automáticamente
- Revisa la consola del navegador para errores
- Si usas una key personalizada, verifica que `VITE_GOOGLE_MAPS_API_KEY` esté configurada
- Asegúrate de que la API Key tenga permisos para Maps JavaScript API

### Los servicios no se cargan
- Verifica que el endpoint del backend esté funcionando
- Revisa la consola para errores de red
- Asegúrate de que `categoryId` y `serviceTypeId` sean válidos

### Clustering no funciona
- Verifica que `@googlemaps/markerclusterer` esté instalado
- Asegúrate de tener más de 50 servicios para ver clustering
- Revisa que la librería de `marker` esté cargada en `APIProvider`

## 📚 Referencias

- [@vis.gl/react-google-maps Documentation](https://vis.gl/react-google-maps/)
- [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript)
- [MarkerClusterer Documentation](https://github.com/googlemaps/js-markerclusterer)

## ✨ Próximas Mejoras Opcionales

- [ ] Sincronización con URL (deep linking)
- [ ] Filtros que actualicen marcadores en tiempo real
- [ ] InfoWindow personalizado al hacer click
- [ ] Búsqueda por ubicación del usuario
- [ ] Modo offline con Service Worker
- [ ] Animaciones al expandir clusters
