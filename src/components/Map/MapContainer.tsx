import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
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
  onServicesCountChange?: (count: number) => void; // Callback para notificar cambios en el número de servicios
  onServicesChange?: (services: Service[]) => void; // Callback para pasar servicios al padre (para favoritos)
  // Opciones de optimización
  debounceMs?: number; // Tiempo de debounce (default: 500ms)
  clusterRadius?: number; // Radio de clustering (default: 75px)
  maxClusterZoom?: number; // Zoom máximo para clustering (default: 16)
}

/**
 * Componente principal del mapa optimizado
 * - Clustering real con Supercluster
 * - Debounce inteligente
 * - Gestión limpia de estado
 * - Sin acumulación de servicios
 * - Compatible móvil/desktop
 */
export const MapContainer: React.FC<MapContainerProps> = ({
  categoryId,
  serviceTypeId,
  initialCenter = { lat: 40.0, lng: -3.0 },
  initialZoom = 5, // Zoom 5 para ver toda España
  onServiceSelect,
  selectedServiceId,
  isMobile = false,
  className,
  style,
  onMapLoad,
  onServicesCountChange,
  onServicesChange,
  debounceMs = 500, // 500ms es óptimo según research de Airbnb
  clusterRadius = 75,
  maxClusterZoom = 16,
}) => {
  // Estado del mapa
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [currentViewport, setCurrentViewport] = useState<ViewportRequest | null>(null);

  // Referencias para debounce y control
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isDraggingRef = useRef(false);
  const lastBoundsKeyRef = useRef<string>('');

  // 🛡️ SECURITY: usa SOLO env var. Antes había fallback hardcoded a una key
  // filtrada en git history → exponía la key vieja en builds aunque rotase. Si el
  // env var no está, el componente fallará con error claro de Google Maps en lugar
  // de usar key insegura. Asegura que VITE_GOOGLE_MAPS_API_KEY está en Render env.
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  // Map ID requerido para AdvancedMarker - usar DEMO_MAP_ID si no está configurado
  const mapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID';

  // Hook de carga de servicios (con todas las optimizaciones)
  const { services, loading, error } = useServiceLoader(
    categoryId,
    serviceTypeId,
    currentViewport,
    {
      enabled: isMapLoaded && currentViewport !== null,
      cacheTTL: 5 * 60 * 1000, // 5 minutos
    }
  );

  // Notificar cambios en el número de servicios
  useEffect(() => {
    if (onServicesCountChange) {
      onServicesCountChange(services.length);
    }
  }, [services.length, onServicesCountChange]);

  // Notificar cambios en los servicios (para favoritos)
  useEffect(() => {
    if (onServicesChange) {
      onServicesChange(services);
    }
  }, [services, onServicesChange]);

  // Configuración del mapa según dispositivo
  const mapOptions = useMemo(
    () => ({
      disableDefaultUI: false,
      zoomControl: !isMobile,
      mapTypeControl: false,
      scaleControl: false,
      streetViewControl: false,
      rotateControl: false,
      fullscreenControl: !isMobile,
      gestureHandling: 'greedy', // ✅ Permite desplazamiento con un solo dedo en móvil
      clickableIcons: false,
      minZoom: 3,
      maxZoom: 20,
      restriction: {
        latLngBounds: {
          north: 85,
          south: -85,
          west: -180,
          east: 180,
        },
        strictBounds: false,
      },
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }],
        },
        {
          featureType: 'poi',
          elementType: 'labels.text',
          stylers: [{ visibility: 'off' }],
        },
        {
          featureType: 'poi.business',
          stylers: [{ visibility: 'off' }],
        },
        {
          featureType: 'transit',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }],
        },
        {
          featureType: 'transit.station',
          stylers: [{ visibility: 'off' }],
        },
        {
          featureType: 'road',
          elementType: 'labels.icon',
          stylers: [{ visibility: 'off' }],
        },
      ],
    }),
    [isMobile]
  );

  /**
   * Genera una clave única para los bounds (evita updates innecesarios)
   */
  const getBoundsKey = useCallback((bounds: google.maps.LatLngBounds, zoom: number): string => {
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    return `${sw.lat().toFixed(4)},${sw.lng().toFixed(4)},${ne.lat().toFixed(4)},${ne.lng().toFixed(4)},${zoom}`;
  }, []);

  /**
   * Valida que los bounds sean correctos
   */
  const validateBounds = useCallback((bounds: google.maps.LatLngBounds, zoom: number): boolean => {
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();

    if (
      !isFinite(ne.lat()) ||
      !isFinite(ne.lng()) ||
      !isFinite(sw.lat()) ||
      !isFinite(sw.lng()) ||
      !isFinite(zoom)
    ) {
      return false;
    }

    if (Math.abs(ne.lat()) > 90 || Math.abs(sw.lat()) > 90) {
      return false;
    }

    if (Math.abs(ne.lng()) > 180 || Math.abs(sw.lng()) > 180) {
      return false;
    }

    if (ne.lat() <= sw.lat()) {
      return false;
    }

    return true;
  }, []);

  /**
   * Actualiza el viewport (con debounce)
   */
  const updateViewport = useCallback(
    (map: google.maps.Map) => {
      if (!map || isDraggingRef.current) return;

      const bounds = map.getBounds();
      const zoom = map.getZoom();

      if (!bounds || !zoom) {
        console.warn('⚠️ Bounds o zoom no disponibles');
        return;
      }

      // Validar bounds
      if (!validateBounds(bounds, zoom)) {
        console.warn('⚠️ Bounds inválidos, ignorando update');
        return;
      }

      // Generar clave para evitar duplicados
      const boundsKey = getBoundsKey(bounds, zoom);

      if (lastBoundsKeyRef.current === boundsKey) {
        console.log('⏭️ Bounds sin cambios, ignorando update');
        return;
      }

      lastBoundsKeyRef.current = boundsKey;

      // Limpiar debounce anterior
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Aplicar debounce
      debounceTimerRef.current = setTimeout(() => {
        if (isDraggingRef.current) return;

        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();

        const viewport: ViewportRequest = {
          northeast: { lat: ne.lat(), lng: ne.lng() },
          southwest: { lat: sw.lat(), lng: sw.lng() },
          zoom,
        };

        console.log('✅ Actualizando viewport:', {
          ne: viewport.northeast,
          sw: viewport.southwest,
          zoom: viewport.zoom,
        });

        setCurrentViewport(viewport);
      }, debounceMs);
    },
    [validateBounds, getBoundsKey, debounceMs]
  );

  /**
   * Componente interno para manejar eventos del mapa
   * Debe estar dentro de APIProvider para acceder al contexto
   */
  const MapEventHandler: React.FC = () => {
    const map = useMap();

    // Efecto para marcar el mapa como cargado
    useEffect(() => {
      if (map && !isMapLoaded) {
        console.log('🗺️ Mapa cargado correctamente');
        setIsMapLoaded(true);
        onMapLoad?.();

        // Ajustar zoom inicial para ver toda España (zoom 5)
        const currentZoom = map.getZoom() || initialZoom;
        if (currentZoom > 5) {
          map.setZoom(5);
          map.setCenter({ lat: 40.0, lng: -3.0 });
        }

        // Cargar viewport inicial inmediatamente (sin debounce para la carga inicial)
        const loadInitialViewport = () => {
          const bounds = map.getBounds();
          const zoom = map.getZoom() || initialZoom;

          if (!bounds || !zoom) {
            // Si los bounds no están listos, esperar un poco y reintentar
            setTimeout(loadInitialViewport, 100);
            return;
          }

          // Validar bounds
          if (!validateBounds(bounds, zoom)) {
            setTimeout(loadInitialViewport, 100);
            return;
          }

          const ne = bounds.getNorthEast();
          const sw = bounds.getSouthWest();

          const viewport: ViewportRequest = {
            northeast: { lat: ne.lat(), lng: ne.lng() },
            southwest: { lat: sw.lat(), lng: sw.lng() },
            zoom,
          };

          console.log('✅ Cargando viewport inicial:', {
            ne: viewport.northeast,
            sw: viewport.southwest,
            zoom: viewport.zoom,
          });

          setCurrentViewport(viewport);
          lastBoundsKeyRef.current = getBoundsKey(bounds, zoom);
        };

        // Esperar a que el mapa esté completamente inicializado
        setTimeout(loadInitialViewport, 200);
      }
    }, [map, isMapLoaded, initialZoom, validateBounds, getBoundsKey]);

    // Efecto para manejar eventos del mapa
    useEffect(() => {
      if (!map || !isMapLoaded) return;

      // Handler para cuando el mapa termina de moverse
      const handleIdle = () => {
        isDraggingRef.current = false;
        updateViewport(map);
      };

      // Handler para cuando empieza a moverse
      const handleDragStart = () => {
        isDraggingRef.current = true;
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
          debounceTimerRef.current = null;
        }
      };

      // Registrar listeners
      const idleListener = map.addListener('idle', handleIdle);
      const dragStartListener = map.addListener('dragstart', handleDragStart);
      const zoomChangedListener = map.addListener('zoom_changed', () => {
        // Solo actualizar en idle, no en cada cambio de zoom
      });

      console.log('👂 Event listeners registrados');

      // Cargar viewport inicial inmediatamente cuando se registran los listeners
      // Esto asegura que se carguen servicios al inicio
      setTimeout(() => {
        handleIdle();
      }, 300);

      // Cleanup
      return () => {
        google.maps.event.removeListener(idleListener);
        google.maps.event.removeListener(dragStartListener);
        google.maps.event.removeListener(zoomChangedListener);

        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }

        console.log('🧹 Event listeners removidos');
      };
    }, [map, isMapLoaded, updateViewport]);

    return null;
  };

  return (
    <div
      className={className}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        ...style,
      }}
    >
      <APIProvider apiKey={apiKey} libraries={['marker']}>
        <GoogleMap
          defaultCenter={initialCenter}
          defaultZoom={initialZoom}
          mapId={mapId}
          disableDefaultUI={mapOptions.disableDefaultUI}
          zoomControl={mapOptions.zoomControl}
          mapTypeControl={mapOptions.mapTypeControl}
          streetViewControl={mapOptions.streetViewControl}
          fullscreenControl={mapOptions.fullscreenControl}
          gestureHandling={mapOptions.gestureHandling}
          clickableIcons={mapOptions.clickableIcons}
          minZoom={mapOptions.minZoom}
          maxZoom={mapOptions.maxZoom}
          restriction={mapOptions.restriction}
          styles={mapOptions.styles}
          style={{ width: '100%', height: '100%' }}
        >
          <MapEventHandler />

          {/* Renderizar marcadores solo cuando el mapa esté cargado */}
          {isMapLoaded && services.length > 0 && (
            <ClusteredMarkers
              services={services}
              selectedServiceId={selectedServiceId}
              onServiceClick={onServiceSelect}
              clusterRadius={clusterRadius}
              maxZoom={maxClusterZoom}
            />
          )}
        </GoogleMap>

        {/* Indicador de carga */}
        {loading && (
          <div
            style={{
              position: 'absolute',
              top: '16px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(255, 255, 255, 0.95)',
              padding: isMobile ? '8px 12px' : '10px 18px',
              borderRadius: '24px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
              fontSize: isMobile ? '12px' : '14px',
              fontWeight: '600',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? '6px' : '10px',
              whiteSpace: 'nowrap',
              fontFamily:
                '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, sans-serif',
            }}
          >
            <div
              style={{
                width: isMobile ? '14px' : '18px',
                height: isMobile ? '14px' : '18px',
                border: '2.5px solid #e5e5e5',
                borderTopColor: '#FF385C',
                borderRadius: '50%',
                animation: 'spin 0.7s linear infinite',
                flexShrink: 0,
              }}
            />
            <span>Cargando servicios...</span>
          </div>
        )}

        {/* Indicador de error */}
        {error && (
          <div
            style={{
              position: 'absolute',
              top: '16px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#ff4444',
              color: '#ffffff',
              padding: '10px 18px',
              borderRadius: '24px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
              fontSize: '14px',
              fontWeight: '600',
              zIndex: 1000,
              fontFamily:
                '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, sans-serif',
            }}
          >
            ⚠️ {error}
          </div>
        )}

      </APIProvider>

      {/* Estilos de animación */}
      <style>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default React.memo(MapContainer);
