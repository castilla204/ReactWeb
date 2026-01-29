import React, { useState, useMemo, useRef, useEffect } from 'react';
import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps';
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
  initialCenter = { lat: 40.4168, lng: -3.7038 }, // Madrid por defecto
  initialZoom = 12,
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

  // Obtener API Key desde variables de entorno o usar la key hardcodeada del proyecto
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '__REDACTED_GOOGLE_API_KEY__';
  
  // Map ID hardcodeado para Advanced Markers
  const mapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || 'inspecciono-map';

  // Cargar servicios según viewport
  const { services, loading, error } = useServiceLoader(
    categoryId,
    serviceTypeId,
    currentViewport,
    {
      enabled: isMapLoaded,
    }
  );

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
    
    // Detectar cuando el mapa está listo
    useEffect(() => {
      if (map && !isMapLoaded) {
        setIsMapLoaded(true);
        onMapLoad?.();
      }
    }, [map, isMapLoaded, onMapLoad]);

    useEffect(() => {
      if (!map || !isMapLoaded) return;

      const updateViewport = () => {
        if (!map || isDraggingRef.current) return;

        const bounds = map.getBounds();
        const zoom = map.getZoom() || initialZoom;

        if (!bounds) return;

        const northeast = bounds.getNorthEast();
        const southwest = bounds.getSouthWest();

        // Serializar bounds para comparación
        const boundsKey = `${southwest.lat().toFixed(4)},${southwest.lng().toFixed(4)},${northeast.lat().toFixed(4)},${northeast.lng().toFixed(4)},${zoom}`;

        // Si los bounds no cambiaron significativamente, no actualizar
        if (prevBoundsKeyRef.current === boundsKey) {
          return;
        }

        prevBoundsKeyRef.current = boundsKey;

        // Limpiar timer anterior
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }

        // Debounce para evitar múltiples llamadas
        debounceTimerRef.current = setTimeout(() => {
          if (!isDraggingRef.current) {
            setCurrentViewport({
              northeast: { lat: northeast.lat(), lng: northeast.lng() },
              southwest: { lat: southwest.lat(), lng: southwest.lng() },
              zoom,
            });
          }
        }, 400);
      };

      const handleIdle = () => {
        isDraggingRef.current = false;
        updateViewport();
      };

      const handleDragStart = () => {
        isDraggingRef.current = true;
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
          debounceTimerRef.current = null;
        }
      };

      // Agregar listeners
      const idleListener = map.addListener('idle', handleIdle);
      const dragStartListener = map.addListener('dragstart', handleDragStart);
      const zoomChangedListener = map.addListener('zoom_changed', handleIdle);

      // Carga inicial
      setTimeout(() => {
        updateViewport();
      }, 300);

      // Cleanup
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
        <Map
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
          styles={mapOptions.styles}
          style={{ width: '100%', height: '100%' }}
        >
          <MapEventHandler />
          {isMapLoaded && (
            <ClusteredMarkers
              services={services}
              selectedServiceId={selectedServiceId}
              onServiceClick={onServiceSelect}
            />
          )}
        </Map>

        {/* Loading overlay */}
        {loading && (
          <div
            style={{
              position: 'absolute',
              top: '10px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(255, 255, 255, 0.95)',
              padding: '8px 16px',
              borderRadius: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              fontSize: '14px',
              fontWeight: '500',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <div
              style={{
                width: '16px',
                height: '16px',
                border: '2px solid #e5e5e5',
                borderTopColor: '#FF385C',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }}
            />
            Cargando servicios...
          </div>
        )}

        {/* Error overlay */}
        {error && (
          <div
            style={{
              position: 'absolute',
              top: '10px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#ff4444',
              color: '#ffffff',
              padding: '8px 16px',
              borderRadius: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              fontSize: '14px',
              fontWeight: '500',
              zIndex: 1000,
            }}
          >
            {error}
          </div>
        )}
      </APIProvider>

      {/* CSS para spinner */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
