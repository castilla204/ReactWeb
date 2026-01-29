# 🗺️ Documentación Completa del Sistema de Mapa - Frontend y Backend

## 📋 Índice
1. [Arquitectura General](#arquitectura-general)
2. [Archivos del Frontend](#archivos-del-frontend)
3. [Archivos del Backend](#archivos-del-backend)
4. [Problemas Conocidos](#problemas-conocidos)
5. [Flujo de Datos](#flujo-de-datos)
6. [Endpoints API](#endpoints-api)

---

## 🏗️ Arquitectura General

El sistema de mapa implementa una carga dinámica de servicios basada en el viewport visible, similar a Airbnb/Google Maps. Utiliza:
- **Frontend**: React + TypeScript + `@vis.gl/react-google-maps`
- **Backend**: ASP.NET Core + Entity Framework + PostgreSQL
- **Optimizaciones**: Debounce, caché, filtrado por bounds en SQL, paginación

---

## 📁 Archivos del Frontend

### 1. Componente Principal del Mapa

**Archivo**: `src/components/Map/MapContainer.tsx`

```typescript
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { APIProvider, Map as GoogleMap, useMap } from '@vis.gl/react-google-maps';
import { useServiceLoader, ViewportRequest, Service } from '../../hooks/useServiceLoader';
import { ClusteredMarkers } from './ClusteredMarkers';

interface MapContainerProps {
  categoryId: number | null;
  serviceTypeId: number | null;
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
  onServiceSelect?: (service: Service) => void;
  selectedServiceId?: number | null;
  isMobile?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onMapLoad?: () => void;
}

/**
 * Componente principal del mapa con carga dinámica de servicios
 * Implementa clustering, debounce y optimizaciones de rendimiento
 * Similar a Airbnb/Google Maps
 */
export const MapContainer: React.FC<MapContainerProps> = ({
  categoryId,
  serviceTypeId,
  initialCenter = { lat: 40.0, lng: -3.0 }, // Centro de España por defecto
  initialZoom = 5, // Zoom para ver toda España
  onServiceSelect,
  selectedServiceId,
  isMobile = false,
  className,
  style,
  onMapLoad,
}) => {
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [currentViewport, setCurrentViewport] = useState<ViewportRequest | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isDraggingRef = useRef(false);
  const prevBoundsKeyRef = useRef<string>('');

  // API Key hardcodeada
  const apiKey = 'AIzaSyBNEdqihExcXPnWw_TJgHFzsPXS7BIazyM';
  
  // Map ID opcional - solo usar si está configurado
  const mapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID;

  // Cargar servicios según viewport
  const { services, loading, error } = useServiceLoader(
    categoryId,
    serviceTypeId,
    currentViewport,
    {
      enabled: isMapLoaded,
    }
  );

  // ✅ DEDUPLICAR servicios en el nivel del contenedor también
  const uniqueServices = useMemo(() => {
    console.log(`🔍 MapContainer: Recibidos ${services.length} servicios de useServiceLoader`);
    const seen = new Map<number, Service>();
    let duplicatesCount = 0;
    services.forEach(service => {
      if (service && service.id && !isNaN(service.id)) {
        const existing = seen.get(service.id);
        if (!existing || (service.raw && !existing.raw)) {
          seen.set(service.id, service);
        } else {
          duplicatesCount++;
          console.warn('⚠️ MapContainer: Servicio duplicado detectado, manteniendo el primero:', service.id);
        }
      }
    });
    const unique = Array.from(seen.values());
    if (duplicatesCount > 0) {
      console.log(`⚠️ MapContainer: ${duplicatesCount} servicios duplicados filtrados`);
    }
    console.log(`✅ MapContainer: Pasando ${unique.length} servicios únicos a ClusteredMarkers`);
    return unique;
  }, [services]);

  // Configuración del mapa según dispositivo
  const mapOptions = useMemo(() => ({
    disableDefaultUI: false,
    zoomControl: !isMobile,
    mapTypeControl: false,
    scaleControl: false,
    streetViewControl: false,
    rotateControl: false,
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
      {
        featureType: 'transit',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }],
      },
    ],
  }), [isMobile]);

  // Componente interno para manejar eventos del mapa
  const MapEventHandler: React.FC = () => {
    const map = useMap();
    
    useEffect(() => {
      if (map && !isMapLoaded) {
        setIsMapLoaded(true);
        onMapLoad?.();
      }
    }, [map, isMapLoaded, onMapLoad]);

    useEffect(() => {
      if (!map || !isMapLoaded) {
        setCurrentViewport(null);
        return;
      }

      const updateViewport = () => {
        if (!map || isDraggingRef.current) return;

        const bounds = map.getBounds();
        const zoom = map.getZoom() || initialZoom;

        if (!bounds) {
          setCurrentViewport(null);
          return;
        }

        const northeast = bounds.getNorthEast();
        const southwest = bounds.getSouthWest();

        if (
          !northeast || !southwest ||
          !isFinite(northeast.lat()) || !isFinite(northeast.lng()) ||
          !isFinite(southwest.lat()) || !isFinite(southwest.lng())
        ) {
          return;
        }

        const boundsKey = `${southwest.lat().toFixed(4)},${southwest.lng().toFixed(4)},${northeast.lat().toFixed(4)},${northeast.lng().toFixed(4)},${zoom}`;

        if (prevBoundsKeyRef.current === boundsKey) {
          return;
        }

        prevBoundsKeyRef.current = boundsKey;

        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
          if (!isDraggingRef.current && bounds) {
            const neLat = northeast.lat();
            const neLng = northeast.lng();
            const swLat = southwest.lat();
            const swLng = southwest.lng();
            
            if (isFinite(neLat) && isFinite(neLng) && 
                isFinite(swLat) && isFinite(swLng) &&
                isFinite(zoom) &&
                Math.abs(neLat) <= 90 && Math.abs(swLat) <= 90 &&
                Math.abs(neLng) <= 180 && Math.abs(swLng) <= 180 &&
                neLat > swLat) {
              console.log('✅ MapContainer: Estableciendo viewport válido:', { neLat, neLng, swLat, swLng, zoom });
              setCurrentViewport({
                northeast: { lat: neLat, lng: neLng },
                southwest: { lat: swLat, lng: swLng },
                zoom,
              });
            } else {
              console.log('⚠️ MapContainer: Bounds inválidos, no actualizar viewport:', { neLat, neLng, swLat, swLng, zoom });
              setCurrentViewport(null);
            }
          }
        }, 400);
      };

      const handleIdle = () => {
        isDraggingRef.current = false;
        if (map && map.getBounds()) {
          updateViewport();
        }
      };

      const handleDragStart = () => {
        isDraggingRef.current = true;
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
          debounceTimerRef.current = null;
        }
      };

      const idleListener = map.addListener('idle', handleIdle);
      const dragStartListener = map.addListener('dragstart', handleDragStart);
      const zoomChangedListener = map.addListener('zoom_changed', handleIdle);

      return () => {
        google.maps.event.removeListener(idleListener);
        google.maps.event.removeListener(dragStartListener);
        google.maps.event.removeListener(zoomChangedListener);
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
      };
    }, [map, isMapLoaded, initialZoom]);

    return null;
  };

  return (
    <div className={className} style={{ width: '100%', height: '100%', position: 'relative', ...style }}>
      <APIProvider apiKey={apiKey} libraries={['marker']}>
        <GoogleMap
          defaultCenter={initialCenter}
          defaultZoom={initialZoom}
          {...(mapId ? { mapId } : {})}
          disableDefaultUI={mapOptions.disableDefaultUI}
          zoomControl={mapOptions.zoomControl}
          mapTypeControl={mapOptions.mapTypeControl}
          streetViewControl={mapOptions.streetViewControl}
          fullscreenControl={mapOptions.fullscreenControl}
          gestureHandling={mapOptions.gestureHandling}
          clickableIcons={mapOptions.clickableIcons}
          styles={mapOptions.styles}
          style={{ width: '100%', height: '100%' }}
        >
          <MapEventHandler />
          {isMapLoaded && (
            <ClusteredMarkers
              services={uniqueServices}
              selectedServiceId={selectedServiceId}
              onServiceClick={onServiceSelect}
            />
          )}
        </GoogleMap>

        {loading && (
          <div style={{ position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(255, 255, 255, 0.95)', padding: '8px 16px', borderRadius: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', fontSize: '14px', fontWeight: '500', zIndex: 1000, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '16px', height: '16px', border: '2px solid #e5e5e5', borderTopColor: '#FF385C', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            Cargando servicios...
          </div>
        )}

        {error && (
          <div style={{ position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)', background: '#ff4444', color: '#ffffff', padding: '8px 16px', borderRadius: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', fontSize: '14px', fontWeight: '500', zIndex: 1000 }}>
            {error}
          </div>
        )}
      </APIProvider>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};
```

**Problemas conocidos**:
- API Key hardcodeada (debería estar en variables de entorno)
- El zoom inicial puede no ajustarse correctamente en algunos casos
- No hay manejo de errores de red más allá del overlay básico

---

### 2. Hook de Carga de Servicios

**Archivo**: `src/hooks/useServiceLoader.ts`

```typescript
import { useState, useEffect, useRef, useCallback } from 'react';
import { API_CONFIG } from '../config/api';
import { MapExpert } from './useMapExperts';

export interface Service {
  id: number;
  lat: number;
  lng: number;
  name: string;
  price: number;
  type?: string;
  [key: string]: any;
}

export interface ViewportRequest {
  northeast: { lat: number; lng: number };
  southwest: { lat: number; lng: number };
  zoom: number;
}

/**
 * Hook para cargar servicios dinámicamente según el viewport del mapa
 * Implementa caché y cancelación de peticiones para optimizar rendimiento
 */
export function useServiceLoader(
  categoryId: number | null,
  serviceTypeId: number | null,
  viewport: ViewportRequest | null,
  options?: {
    limit?: number;
    enabled?: boolean;
  }
) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const cacheRef = useRef<Map<string, { services: Service[]; timestamp: number }>>(new Map());
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  const getMaxResults = useCallback((zoom: number): number => {
    if (zoom < 10) return 100;
    if (zoom < 14) return 300;
    return 500;
  }, []);

  const loadServices = useCallback(
    async (viewportData: ViewportRequest) => {
      if (!categoryId || !serviceTypeId || options?.enabled === false) {
        setServices([]);
        setLoading(false);
        return;
      }

      if (!viewportData || 
          !viewportData.northeast || !viewportData.southwest ||
          !isFinite(viewportData.northeast.lat) || !isFinite(viewportData.northeast.lng) ||
          !isFinite(viewportData.southwest.lat) || !isFinite(viewportData.southwest.lng) ||
          !isFinite(viewportData.zoom)) {
        console.log('⚠️ useServiceLoader: Viewport inválido, no hacer llamada:', viewportData);
        setServices([]);
        setLoading(false);
        return;
      }

      const neLat = viewportData.northeast.lat;
      const neLng = viewportData.northeast.lng;
      const swLat = viewportData.southwest.lat;
      const swLng = viewportData.southwest.lng;
      
      if (Math.abs(neLat) > 90 || Math.abs(swLat) > 90) {
        console.log('⚠️ useServiceLoader: Latitudes fuera de rango:', { neLat, swLat });
        setServices([]);
        setLoading(false);
        return;
      }
      
      if (Math.abs(neLng) > 180 || Math.abs(swLng) > 180) {
        console.log('⚠️ useServiceLoader: Longitudes fuera de rango:', { neLng, swLng });
        setServices([]);
        setLoading(false);
        return;
      }
      
      if (neLat <= swLat) {
        console.log('⚠️ useServiceLoader: northeast no está al norte de southwest:', { neLat, swLat });
        setServices([]);
        setLoading(false);
        return;
      }
      
      const latDiff = neLat - swLat;
      const lngDiff = Math.abs(neLng - swLng);
      if (latDiff < 0.001 || (lngDiff < 0.001 && lngDiff > 0 && Math.abs(neLng - swLng) < 359)) {
        console.log('⚠️ useServiceLoader: Bounds demasiado pequeños:', { latDiff, lngDiff });
        setServices([]);
        setLoading(false);
        return;
      }

      if (abortControllerRef.current) {
        console.log('🛑 useServiceLoader: Cancelando petición anterior');
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      console.log('🔄 useServiceLoader: Limpiando servicios anteriores antes de nueva carga');
      setServices([]);
      setLoading(true);
      setError(null);

      const cacheKey = `${categoryId}-${serviceTypeId}-${viewportData.northeast.lat.toFixed(3)}-${viewportData.northeast.lng.toFixed(3)}-${viewportData.southwest.lat.toFixed(3)}-${viewportData.southwest.lng.toFixed(3)}-${viewportData.zoom}`;

      const cached = cacheRef.current.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        if (!signal.aborted) {
          console.log('✅ useServiceLoader: Usando servicios del caché:', cached.services.length);
          setServices(cached.services);
          setLoading(false);
        }
        return;
      }

      try {
        const limit = options?.limit || getMaxResults(viewportData.zoom);
        const params = new URLSearchParams({
          categoryId: categoryId.toString(),
          serviceTypeId: serviceTypeId.toString(),
          northeastLat: viewportData.northeast.lat.toString(),
          northeastLng: viewportData.northeast.lng.toString(),
          southwestLat: viewportData.southwest.lat.toString(),
          southwestLng: viewportData.southwest.lng.toString(),
          zoom: viewportData.zoom.toString(),
          limit: limit.toString(),
        });

        const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.expert.services.mapExperts}?${params.toString()}`;

        const response = await fetch(url, {
          signal,
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        let mappedServices: Service[] = [];

        if (data.services && Array.isArray(data.services)) {
          mappedServices = data.services.map((service: any) => {
            const expert = service.expert || service.Expert || {};
            const lat = parseFloat(expert.latitude || expert.Latitude || '0');
            const lng = parseFloat(expert.longitude || expert.Longitude || '0');

            return {
              id: service.id || service.Id,
              lat,
              lng,
              name: expert.user?.name || expert.User?.Name || 'Experto',
              price: service.price || service.Price || 0,
              type: service.serviceTypeName || service.ServiceTypeName,
              raw: service,
            };
          }).filter((s: Service) => !isNaN(s.lat) && !isNaN(s.lng));
        } else if (data.Experts || data.experts) {
          const experts = data.Experts || data.experts || [];
          mappedServices = experts.map((expert: MapExpert) => ({
            id: expert.id,
            lat: parseFloat(expert.latitude),
            lng: parseFloat(expert.longitude),
            name: expert.name,
            price: expert.price,
            type: expert.serviceTypeName,
          })).filter((s: Service) => !isNaN(s.lat) && !isNaN(s.lng));
        }

        const uniqueServicesMap = new Map<number, Service>();
        let duplicatesCount = 0;
        mappedServices.forEach(service => {
          if (!uniqueServicesMap.has(service.id)) {
            uniqueServicesMap.set(service.id, service);
          } else {
            duplicatesCount++;
            console.warn('⚠️ useServiceLoader: Servicio duplicado detectado en la respuesta de la API, ignorando:', service.id);
          }
        });
        const deduplicatedServices = Array.from(uniqueServicesMap.values());
        if (duplicatesCount > 0) {
          console.log(`⚠️ useServiceLoader: ${duplicatesCount} servicios duplicados filtrados de la respuesta`);
        }
        console.log(`✅ useServiceLoader: ${deduplicatedServices.length} servicios únicos después de deduplicación (de ${mappedServices.length} recibidos)`);

        cacheRef.current.set(cacheKey, {
          services: deduplicatedServices,
          timestamp: Date.now(),
        });

        if (cacheRef.current.size > 10) {
          const entries = Array.from(cacheRef.current.entries());
          entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
          cacheRef.current.clear();
          entries.slice(0, 10).forEach(([key, value]) => {
            cacheRef.current.set(key, value);
          });
        }

        if (!signal.aborted) {
          console.log(`✅ useServiceLoader: Estableciendo ${deduplicatedServices.length} servicios únicos en el estado`);
          setServices(deduplicatedServices);
        } else {
          console.log('⚠️ useServiceLoader: Petición cancelada, no establecer servicios');
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          return;
        }
        console.error('Error loading services:', err);
        setError(err.message || 'Error al cargar servicios');
        setServices([]);
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    },
    [categoryId, serviceTypeId, options?.limit, getMaxResults, options?.enabled]
  );

  useEffect(() => {
    if (options?.enabled === false) {
      console.log('⚠️ useServiceLoader: Deshabilitado (enabled=false), NO hacer llamada');
      setServices([]);
      setLoading(false);
      return;
    }
    
    if (viewport && 
        viewport.northeast && viewport.southwest &&
        isFinite(viewport.northeast.lat) && isFinite(viewport.northeast.lng) &&
        isFinite(viewport.southwest.lat) && isFinite(viewport.southwest.lng) &&
        isFinite(viewport.zoom)) {
      console.log('✅ useServiceLoader: Viewport válido, iniciando carga de servicios:', {
        ne: viewport.northeast,
        sw: viewport.southwest,
        zoom: viewport.zoom
      });
      loadServices(viewport);
    } else {
      console.log('⚠️ useServiceLoader: Viewport null o inválido, limpiando servicios:', viewport);
      setServices([]);
      setLoading(false);
    }

    return () => {
      if (abortControllerRef.current) {
        console.log('🛑 useServiceLoader: Limpiando al desmontar o cambiar dependencias');
        abortControllerRef.current.abort();
      }
    };
  }, [viewport, loadServices, options?.enabled]);

  return {
    services,
    loading,
    error,
    reload: () => viewport && loadServices(viewport),
  };
}
```

**Problemas conocidos**:
- El caché puede acumular datos si no se limpia correctamente
- No hay retry automático en caso de error de red
- La deduplicación puede no ser suficiente si hay servicios con el mismo ID pero diferentes coordenadas

---

### 3. Componente de Marcadores Agrupados

**Archivo**: `src/components/Map/ClusteredMarkers.tsx`

```typescript
import React, { useMemo } from 'react';
import { ServiceMarker } from './ServiceMarker';
import { Service } from '../../hooks/useServiceLoader';

interface ClusteredMarkersProps {
  services: Service[];
  selectedServiceId?: number | null;
  onServiceClick?: (service: Service) => void;
}

export const ClusteredMarkers: React.FC<ClusteredMarkersProps> = ({
  services,
  selectedServiceId,
  onServiceClick,
}) => {
  const uniqueServices = useMemo(() => {
    console.log(`🔍 ClusteredMarkers: Recibidos ${services.length} servicios para renderizar`);
    const seen = new Map<number, Service>();
    let duplicatesCount = 0;
    let invalidServicesCount = 0;
    
    services.forEach(service => {
      if (!service || !service.id || isNaN(service.id)) {
        invalidServicesCount++;
        return;
      }
      
      if (!seen.has(service.id)) {
        seen.set(service.id, service);
      } else {
        duplicatesCount++;
        const existing = seen.get(service.id);
        if (existing && (existing.lat !== service.lat || existing.lng !== service.lng)) {
          console.warn('⚠️ ClusteredMarkers: Servicio duplicado con id pero diferente posición:', {
            id: service.id,
            existing: { lat: existing.lat, lng: existing.lng },
            new: { lat: service.lat, lng: service.lng }
          });
        } else {
          console.warn('⚠️ ClusteredMarkers: Servicio duplicado detectado (mismo id y posición), ignorando:', service.id);
        }
      }
    });
    
    const unique = Array.from(seen.values());
    if (duplicatesCount > 0) {
      console.log(`⚠️ ClusteredMarkers: ${duplicatesCount} servicios duplicados filtrados`);
    }
    if (invalidServicesCount > 0) {
      console.log(`⚠️ ClusteredMarkers: ${invalidServicesCount} servicios inválidos filtrados`);
    }
    console.log(`✅ ClusteredMarkers: Renderizando ${unique.length} servicios únicos (de ${services.length} recibidos)`);
    return unique;
  }, [services]);

  return (
    <>
      {uniqueServices.map((service) => {
        if (!service || !service.id || isNaN(service.id) || isNaN(service.lat) || isNaN(service.lng)) {
          console.warn('⚠️ ClusteredMarkers: Intentando renderizar servicio inválido:', service);
          return null;
        }
        return (
          <ServiceMarker
            key={`service-${service.id}`}
            service={service}
            isSelected={selectedServiceId === service.id}
            onClick={onServiceClick}
          />
        );
      })}
    </>
  );
};
```

**Problemas conocidos**:
- No hay clustering real (todos los marcadores se renderizan individualmente)
- Con muchos servicios (>1000) puede haber problemas de rendimiento
- No hay virtualización de marcadores fuera del viewport

---

### 4. Componente de Marcador Individual

**Archivo**: `src/components/Map/ServiceMarker.tsx`

```typescript
import React from 'react';
import { AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { Service } from '../../hooks/useServiceLoader';

interface ServiceMarkerProps {
  service: Service;
  isSelected?: boolean;
  onClick?: (service: Service) => void;
}

export const ServiceMarker: React.FC<ServiceMarkerProps> = ({
  service,
  isSelected = false,
  onClick,
}) => {
  const priceText = service.price > 0 ? `€${Math.round(service.price)}` : 'Consultar';

  return (
    <AdvancedMarker
      position={{ lat: service.lat, lng: service.lng }}
      onClick={() => onClick?.(service)}
      zIndex={isSelected ? 1000 : 100}
    >
      <div
        style={{
          background: isSelected ? '#000000' : '#ffffff',
          color: isSelected ? '#ffffff' : 'rgb(34, 34, 34)',
          padding: '4px 12px',
          borderRadius: '20px',
          fontSize: '14px',
          fontWeight: '700',
          fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
          border: isSelected ? 'none' : '1px solid #e5e5e5',
          whiteSpace: 'nowrap',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          transform: isSelected ? 'scale(1.1)' : 'scale(1)',
        }}
      >
        {priceText}
      </div>
    </AdvancedMarker>
  );
};
```

**Problemas conocidos**:
- No hay animación suave al cambiar de seleccionado a no seleccionado
- El estilo puede no ser consistente en todos los navegadores
- No hay tooltip o información adicional al hacer hover

---

### 5. Configuración de API

**Archivo**: `src/config/api.ts`

```typescript
const getDevServer = () => {
    if (import.meta.env.DEV) {
        if (import.meta.env.VITE_API_URL) {
            return import.meta.env.VITE_API_URL;
        }
        return 'http://localhost:7124';
    }
    return 'https://newapi-yn9v.onrender.com';
};

const DEV_SERVER = getDevServer();
const API_PATH = '/api';

export const API_CONFIG = {
    baseUrl: DEV_SERVER,
    endpoints: {
        expert: {
            services: {
                mapExperts: `${API_PATH}/SearchService/map-experts`,
            },
        },
    },
};
```

---

## 🔧 Archivos del Backend

### 1. Controlador de Servicios

**Archivo**: `Controllers/SearchServiceController.cs`

```csharp
[HttpGet("map-experts")]
public async Task<IActionResult> GetMapExperts(
    [FromQuery] int categoryId,
    [FromQuery] int serviceTypeId,
    [FromQuery] string? latitude = null,
    [FromQuery] string? longitude = null,
    [FromQuery] int? locationRange = null,
    [FromQuery] decimal? northeastLat = null,
    [FromQuery] decimal? northeastLng = null,
    [FromQuery] decimal? southwestLat = null,
    [FromQuery] decimal? southwestLng = null,
    [FromQuery] int? zoom = null,
    [FromQuery] int limit = 100)
{
    using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(90));
    try
    {
        if (categoryId <= 0)
        {
            return BadRequest(new { message = "El ID de categoría es requerido y debe ser mayor que 0" });
        }

        if (serviceTypeId <= 0)
        {
            return BadRequest(new { message = "El tipo de servicio es requerido y debe ser mayor que 0" });
        }

        bool hasPartialBounds = (northeastLat.HasValue || northeastLng.HasValue || 
                                southwestLat.HasValue || southwestLng.HasValue) &&
                               !(northeastLat.HasValue && northeastLng.HasValue && 
                                 southwestLat.HasValue && southwestLng.HasValue);
        
        if (hasPartialBounds)
        {
            return BadRequest(new { message = "Si se proporcionan bounds, deben proporcionarse todos los parámetros: northeastLat, northeastLng, southwestLat, southwestLng" });
        }

        bool hasBounds = northeastLat.HasValue && northeastLng.HasValue && 
                        southwestLat.HasValue && southwestLng.HasValue;

        bool hasLocationParams = !string.IsNullOrWhiteSpace(latitude) && 
                                !string.IsNullOrWhiteSpace(longitude) && 
                                locationRange.HasValue && locationRange.Value > 0;

        if (hasLocationParams)
        {
            var page = Request.Query.ContainsKey("page") && int.TryParse(Request.Query["page"], out var pageValue) ? pageValue : 1;
            var pageSize = Request.Query.ContainsKey("pageSize") && int.TryParse(Request.Query["pageSize"], out var pageSizeValue) ? pageSizeValue : 50;

            var (services, totalCount) = await _searchServiceService.GetAllServices(
                categoryId, 
                serviceTypeId, 
                latitude, 
                longitude, 
                locationRange.Value,
                page,
                pageSize,
                cts.Token);
            
            return Ok(new
            {
                services = services,
                pagination = new
                {
                    page = page,
                    pageSize = pageSize,
                    totalCount = totalCount,
                    totalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
                    hasNextPage = page * pageSize < totalCount,
                    hasPreviousPage = page > 1
                }
            });
        }

        if (hasBounds)
        {
            if (limit <= 0 || limit > 500)
            {
                return BadRequest(new { message = "El límite debe estar entre 1 y 500" });
            }

            var page = Request.Query.ContainsKey("page") && int.TryParse(Request.Query["page"], out var pageValue) ? pageValue : 1;
            var pageSize = Request.Query.ContainsKey("pageSize") && int.TryParse(Request.Query["pageSize"], out var pageSizeValue) ? pageSizeValue : 50;

            var (services, totalCount) = await _searchServiceService.GetMapExpertsWithDetails(
                categoryId, 
                serviceTypeId,
                northeastLat.Value,
                northeastLng.Value,
                southwestLat.Value,
                southwestLng.Value,
                zoom,
                limit,
                page,
                pageSize,
                cts.Token);
            
            return Ok(new
            {
                services = services,
                pagination = new
                {
                    page = page,
                    pageSize = pageSize,
                    totalCount = totalCount,
                    totalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
                    hasNextPage = page * pageSize < totalCount,
                    hasPreviousPage = page > 1
                }
            });
        }

        if (limit <= 0 || limit > 500)
        {
            return BadRequest(new { message = "El límite debe estar entre 1 y 500" });
        }

        var experts = await _searchServiceService.GetMapExperts(
            categoryId, 
            serviceTypeId,
            null, null, null, null,
            zoom,
            limit,
            cts.Token);
        return Ok(experts);
    }
    catch (OperationCanceledException)
    {
        await _loggingService.LogErrorAsync(...);
        Response.Headers["Access-Control-Allow-Origin"] = Request.Headers["Origin"].ToString();
        Response.Headers["Access-Control-Allow-Credentials"] = "true";
        Response.ContentType = "application/json";
        return StatusCode(408, new { message = "Request timeout. Please try again.", detail = "The request took too long to complete" });
    }
    catch (Exception ex)
    {
        await _loggingService.LogErrorAsync(...);
        return StatusCode(500, new { message = "Failed to retrieve map experts", detail = ex.Message });
    }
}
```

**Problemas conocidos**:
- Timeout de 90 segundos puede ser demasiado largo para algunas consultas
- No hay rate limiting
- Los errores no siempre se propagan correctamente al frontend

---

### 2. Servicio de Búsqueda con Bounds

**Archivo**: `Services/SearchServiceService.cs` - Método `GetMapExpertsWithDetails`

```csharp
public async Task<(IEnumerable<SearchServiceDetailDto> services, int totalCount)> GetMapExpertsWithDetails(
    int categoryId, 
    int serviceTypeId,
    decimal northeastLat,
    decimal northeastLng,
    decimal southwestLat,
    decimal southwestLng,
    int? zoom = null,
    int limit = 100,
    int page = 1,
    int pageSize = 50,
    CancellationToken cancellationToken = default)
{
    // Validaciones de bounds
    if (northeastLat <= southwestLat)
    {
        throw new ArgumentException("Invalid bounds: northeastLat must be greater than southwestLat");
    }
    
    var boundsWidth = northeastLng - southwestLng;
    if (boundsWidth > 360m)
    {
        throw new ArgumentException("Invalid bounds: longitude range cannot exceed 360 degrees");
    }
    
    // Validar rangos de coordenadas
    if (northeastLat < -90m || northeastLat > 90m ||
        southwestLat < -90m || southwestLat > 90m ||
        northeastLng < -180m || northeastLng > 180m ||
        southwestLng < -180m || southwestLng > 180m)
    {
        throw new ArgumentException("Invalid coordinate ranges. Latitude must be between -90 and 90, Longitude between -180 and 180");
    }
    
    var latDiff = northeastLat - southwestLat;
    var lngDiff = northeastLng - southwestLng;
    if (lngDiff < 0)
    {
        lngDiff = lngDiff + 360m;
    }
    var lngDiffAbs = Math.Abs(lngDiff);
    
    if (latDiff > 90m || lngDiffAbs > 90m)
    {
        throw new ArgumentException($"Bounds demasiado grandes: latDiff={latDiff}, lngDiff={lngDiffAbs}. El área visible no puede exceder 90 grados.");
    }
    
    // Determinar límite según zoom
    int maxResults = limit;
    bool isVeryLowZoom = false;
    if (zoom.HasValue)
    {
        isVeryLowZoom = zoom.Value < 8;
        maxResults = zoom.Value switch
        {
            >= 18 => Math.Min(limit, 500),
            >= 15 => Math.Min(limit, 200),
            >= 12 => Math.Min(limit, 100),
            >= 10 => Math.Min(limit, 50),
            >= 8 => Math.Min(limit, 30),
            _ => Math.Min(limit, 50)
        };
    }
    
    // Calcular ancho de bounds
    var boundsWidthLng = northeastLng - southwestLng;
    if (boundsWidthLng < 0)
    {
        boundsWidthLng = boundsWidthLng + 360m;
    }
    var isVeryLargeArea = boundsWidthLng > 180m;

    // Query SQL directo para filtrar por bounds
    var sqlQuery = isVeryLargeArea
        ? @"SELECT ss.""Id"" FROM ""SearchServices"" ss
           INNER JOIN ""ExpertProfiles"" ep ON ss.""ExpertProfileId"" = ep.""Id""
           WHERE ss.""CategoryId"" = @categoryId
             AND ss.""ServiceTypeId"" = @serviceTypeId
             AND ss.""IsActive"" = true
             AND ep.""IsOnVacation"" = false
             AND ((ep.""StripeStatus"" = 1 AND ep.""OnboardingCompleted"" = true) OR ep.""StripeStatus"" = 0 OR ep.""StripeStatus"" = 2)
             AND ep.""Latitude"" IS NOT NULL
             AND ep.""Latitude"" != ''
             AND ep.""Longitude"" IS NOT NULL
             AND ep.""Longitude"" != ''
             AND CAST(ep.""Latitude"" AS NUMERIC) >= @southwestLat
             AND CAST(ep.""Latitude"" AS NUMERIC) <= @northeastLat
           LIMIT @maxResults"
        : @"SELECT ss.""Id"" FROM ""SearchServices"" ss
           INNER JOIN ""ExpertProfiles"" ep ON ss.""ExpertProfileId"" = ep.""Id""
           WHERE ss.""CategoryId"" = @categoryId
             AND ss.""ServiceTypeId"" = @serviceTypeId
             AND ss.""IsActive"" = true
             AND ep.""IsOnVacation"" = false
             AND ((ep.""StripeStatus"" = 1 AND ep.""OnboardingCompleted"" = true) OR ep.""StripeStatus"" = 0 OR ep.""StripeStatus"" = 2)
             AND ep.""Latitude"" IS NOT NULL
             AND ep.""Latitude"" != ''
             AND ep.""Longitude"" IS NOT NULL
             AND ep.""Longitude"" != ''
             AND CAST(ep.""Latitude"" AS NUMERIC) >= @southwestLat
             AND CAST(ep.""Latitude"" AS NUMERIC) <= @northeastLat
             AND (
                 (CAST(ep.""Longitude"" AS NUMERIC) >= @southwestLng AND CAST(ep.""Longitude"" AS NUMERIC) <= @northeastLng)
                 OR
                 (@southwestLng > @northeastLng AND (CAST(ep.""Longitude"" AS NUMERIC) >= @southwestLng OR CAST(ep.""Longitude"" AS NUMERIC) <= @northeastLng))
             )
           LIMIT @maxResults";

    // Ejecutar query SQL y obtener IDs
    var serviceIds = new List<int>();
    using (var command = _context.Database.GetDbConnection().CreateCommand())
    {
        command.CommandText = sqlQuery;
        // ... agregar parámetros ...
        // ... ejecutar query y obtener serviceIds ...
    }

    // Cargar servicios completos con Includes
    var services = await _context.SearchServices
        .AsNoTracking()
        .Where(ss => serviceIds.Contains(ss.Id))
        .Include(ss => ss.Images)
        .Include(ss => ss.ExpertProfile)
            .ThenInclude(ep => ep.User)
        // ... más Includes ...
        .ToListAsync(cancellationToken);

    // Aplicar paginación
    var totalCount = services.Count;
    var paginatedServices = services
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .ToList();

    // Mapear a DTOs
    var serviceDtos = paginatedServices.Select(ss => /* mapeo a SearchServiceDetailDto */).ToList();

    return (serviceDtos, totalCount);
}
```

**Problemas conocidos**:
- El filtrado por bounds puede no ser 100% preciso debido a que las coordenadas se almacenan como strings
- No hay índices espaciales en la base de datos (PostGIS) para optimizar consultas geográficas
- La consulta SQL directa puede ser vulnerable si no se sanitizan correctamente los parámetros (aunque se usan parámetros, hay que verificar)
- El límite de resultados puede no ser suficiente para áreas muy grandes

---

## ⚠️ Problemas Conocidos

### Frontend

1. **Acumulación de servicios duplicados**
   - **Síntoma**: A veces aparecen más servicios de los que devuelve la API
   - **Causa**: Los servicios no se limpian correctamente antes de cargar nuevos, o hay duplicados en la respuesta de la API
   - **Solución parcial**: Se implementó deduplicación en 3 capas (useServiceLoader, MapContainer, ClusteredMarkers), pero puede no ser suficiente

2. **API Key hardcodeada**
   - **Síntoma**: La API key está hardcodeada en el código
   - **Causa**: No se está usando correctamente la variable de entorno
   - **Solución**: Mover a variables de entorno y usar fallback solo en desarrollo

3. **Primera llamada sin bounds**
   - **Síntoma**: La primera llamada a la API puede cargar todos los servicios sin filtrado
   - **Causa**: El viewport puede ser null al inicio y luego se establece
   - **Solución parcial**: Se agregó validación para no hacer llamadas sin bounds, pero puede haber casos edge

4. **Rendimiento con muchos marcadores**
   - **Síntoma**: Con >1000 marcadores, el mapa puede volverse lento
   - **Causa**: No hay clustering real ni virtualización
   - **Solución**: Implementar clustering con `@googlemaps/markerclusterer` o virtualización

### Backend

1. **Filtrado por bounds no preciso**
   - **Síntoma**: Algunos servicios pueden aparecer fuera del área visible
   - **Causa**: Las coordenadas se almacenan como strings y se convierten a decimal en SQL, puede haber problemas de precisión
   - **Solución**: Usar tipos espaciales (PostGIS) o almacenar coordenadas como decimales directamente

2. **Falta de índices espaciales**
   - **Síntoma**: Consultas lentas con muchos servicios
   - **Causa**: No hay índices espaciales en la base de datos
   - **Solución**: Implementar índices PostGIS o índices B-tree en lat/lng

3. **Timeout muy largo**
   - **Síntoma**: Algunas consultas pueden tardar hasta 90 segundos
   - **Causa**: Timeout configurado a 90 segundos
   - **Solución**: Reducir timeout y optimizar consultas SQL

4. **No hay rate limiting**
   - **Síntoma**: El endpoint puede ser abusado
   - **Causa**: No hay límite de requests por IP/usuario
   - **Solución**: Implementar rate limiting con middleware

---

## 🔄 Flujo de Datos

1. **Usuario mueve el mapa** → `MapContainer` detecta cambio en `idle` event
2. **Debounce (400ms)** → Espera a que el usuario termine de mover el mapa
3. **Validación de bounds** → Verifica que los bounds sean válidos
4. **Actualización de viewport** → `setCurrentViewport` con nuevos bounds
5. **Hook `useServiceLoader`** → Detecta cambio en viewport
6. **Limpieza de servicios** → `setServices([])` para evitar acumulación
7. **Verificación de caché** → Busca en caché local (5 min TTL)
8. **Llamada a API** → `GET /api/SearchService/map-experts` con bounds
9. **Backend filtra por bounds** → SQL query con filtrado geográfico
10. **Respuesta paginada** → `{ services: [...], pagination: {...} }`
11. **Mapeo a Service[]** → Conversión de PascalCase a camelCase
12. **Deduplicación** → Filtrado de duplicados por ID
13. **Actualización de estado** → `setServices(deduplicatedServices)`
14. **Renderizado** → `ClusteredMarkers` → `ServiceMarker` para cada servicio

---

## 🌐 Endpoints API

### GET `/api/SearchService/map-experts`

**Parámetros requeridos**:
- `categoryId` (int): ID de la categoría
- `serviceTypeId` (int): ID del tipo de servicio

**Parámetros opcionales**:
- `northeastLat`, `northeastLng`, `southwestLat`, `southwestLng` (decimal): Bounds del mapa visible
- `zoom` (int): Nivel de zoom
- `limit` (int): Límite máximo de resultados (default: 100, max: 500)
- `latitude`, `longitude` (string): Coordenadas de búsqueda
- `locationRange` (int): Rango de búsqueda en km
- `page`, `pageSize` (int): Paginación

**Respuestas**:

1. **Sin bounds ni location** (carga inicial):
```json
{
  "Experts": [...],
  "TotalCount": 123
}
```

2. **Con bounds** (mover mapa):
```json
{
  "services": [...],
  "pagination": {
    "page": 1,
    "pageSize": 50,
    "totalCount": 123,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

3. **Con location** (búsqueda por ubicación):
```json
{
  "services": [...],
  "pagination": {...}
}
```

---

## 🛠️ Recomendaciones para Corrección

### Prioridad Alta

1. **Implementar índices espaciales en PostgreSQL**
   - Usar PostGIS para consultas geográficas más eficientes
   - Crear índices GIST en columnas de coordenadas

2. **Mover API Key a variables de entorno**
   - Usar `VITE_GOOGLE_MAPS_API_KEY` en producción
   - Fallback solo en desarrollo

3. **Implementar clustering real**
   - Usar `@googlemaps/markerclusterer` para agrupar marcadores cercanos
   - Mejorar rendimiento con muchos servicios

4. **Optimizar consultas SQL**
   - Almacenar coordenadas como decimales en lugar de strings
   - Usar tipos espaciales de PostGIS si es posible

### Prioridad Media

5. **Mejorar manejo de errores**
   - Retry automático en caso de fallos de red
   - Mejor feedback visual al usuario

6. **Implementar rate limiting**
   - Limitar requests por IP/usuario
   - Prevenir abuso del endpoint

7. **Virtualización de marcadores**
   - Solo renderizar marcadores visibles en el viewport
   - Mejorar rendimiento con >1000 servicios

### Prioridad Baja

8. **Mejorar UX**
   - Animaciones suaves en marcadores
   - Tooltips con información adicional
   - Loading states más informativos

9. **Testing**
   - Tests unitarios para hooks
   - Tests de integración para el flujo completo
   - Tests de rendimiento con muchos servicios

---

## 📝 Notas Adicionales

- El sistema está diseñado para manejar hasta ~500 servicios por viewport
- El caché tiene un TTL de 5 minutos
- El debounce está configurado a 400ms
- El timeout del backend es de 90 segundos
- El límite máximo de resultados es 500 por request

---

**Última actualización**: 2025-01-29
**Versión**: 1.0.0
