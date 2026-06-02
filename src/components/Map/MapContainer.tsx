import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useServiceLoader, ViewportRequest, Service } from '../../hooks/useServiceLoader';
import { ClusteredMarkers } from './ClusteredMarkers';
import { MapLoadingIndicator } from './MapLoadingIndicator';

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
  onLoadingChange?: (state: { loading: boolean; isInitialLoading: boolean; isRefreshing: boolean }) => void;
  /** Al cambiar el centro desde fuera: solo desplazar (vista amplia) o acercar también */
  recenterMode?: 'pan-only' | 'fly-to-zoom';
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
  onLoadingChange,
  recenterMode = 'pan-only',
  debounceMs = 280,
  clusterRadius = 56,
  maxClusterZoom = 17,
}) => {
  // Estado del mapa
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [currentViewport, setCurrentViewport] = useState<ViewportRequest | null>(null);
  const [cameraBounds, setCameraBounds] = useState<[number, number, number, number] | undefined>(undefined);
  const [cameraZoom, setCameraZoom] = useState<number | undefined>(undefined);
  const [mapInstance, setMapInstance] = useState<maplibregl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const onMapLoadRef = useRef(onMapLoad);

  // Referencias para debounce y control
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isDraggingRef = useRef(false);
  const lastBoundsKeyRef = useRef<string>('');
  const lastServicesKeyRef = useRef<string>('');
  const lastInitialCenterRef = useRef(initialCenter);
  const loaderEnabled = isMapLoaded && currentViewport !== null;
  const loaderOptions = useMemo(
    () => ({
      enabled: loaderEnabled,
      cacheTTL: 5 * 60 * 1000, // 5 minutos
    }),
    [loaderEnabled]
  );

  // Hook de carga de servicios (con todas las optimizaciones)
  const { services, loading, isInitialLoading, isRefreshing, error } = useServiceLoader(
    categoryId,
    serviceTypeId,
    currentViewport,
    loaderOptions
  );

  // Notificar cambios en el número de servicios
  useEffect(() => {
    onServicesCountChange?.(services.length);
  }, [services.length, onServicesCountChange]);

  // Notificar cambios en los servicios (evitar re-renders si los ids no cambian)
  useEffect(() => {
    if (!onServicesChange) return;
    const key = services.map((s) => s.id).join(',');
    if (key === lastServicesKeyRef.current) return;
    lastServicesKeyRef.current = key;
    onServicesChange(services);
  }, [services, onServicesChange]);

  useEffect(() => {
    onLoadingChange?.({ loading, isInitialLoading, isRefreshing });
  }, [loading, isInitialLoading, isRefreshing, onLoadingChange]);

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
    }),
    [isMobile]
  );

  /**
   * Genera una clave única para los bounds (evita updates innecesarios)
   */
  const getBoundsKey = useCallback((bounds: maplibregl.LngLatBounds, zoom: number): string => {
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    // Reducimos sensibilidad para evitar refetch por variaciones minimas de camara
    return `${sw.lat.toFixed(4)},${sw.lng.toFixed(4)},${ne.lat.toFixed(4)},${ne.lng.toFixed(4)},${zoom.toFixed(2)}`;
  }, []);

  /**
   * Valida que los bounds sean correctos
   */
  const validateBounds = useCallback((bounds: maplibregl.LngLatBounds, zoom: number): boolean => {
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();

    if (
      !isFinite(ne.lat) ||
      !isFinite(ne.lng) ||
      !isFinite(sw.lat) ||
      !isFinite(sw.lng) ||
      !isFinite(zoom)
    ) {
      return false;
    }

    if (Math.abs(ne.lat) > 90 || Math.abs(sw.lat) > 90) {
      return false;
    }

    if (Math.abs(ne.lng) > 180 || Math.abs(sw.lng) > 180) {
      return false;
    }

    if (ne.lat <= sw.lat) {
      return false;
    }

    return true;
  }, []);

  /** Sincroniza cámara al instante (clusters reactivos) */
  const syncCamera = useCallback(
    (map: maplibregl.Map) => {
      const bounds = map.getBounds();
      const zoom = map.getZoom();
      if (!bounds || !Number.isFinite(zoom) || !validateBounds(bounds, zoom)) return;

      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      setCameraBounds([sw.lng, sw.lat, ne.lng, ne.lat]);
      setCameraZoom(zoom);
    },
    [validateBounds]
  );

  /** Programa fetch de servicios (debounced) */
  const scheduleViewportFetch = useCallback(
    (map: maplibregl.Map) => {
      if (!map || isDraggingRef.current) return;

      const bounds = map.getBounds();
      const zoom = map.getZoom();
      if (!bounds || !Number.isFinite(zoom) || !validateBounds(bounds, zoom)) return;

      const boundsKey = getBoundsKey(bounds, zoom);
      if (lastBoundsKeyRef.current === boundsKey) return;

      lastBoundsKeyRef.current = boundsKey;
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        if (isDraggingRef.current) return;
        setCurrentViewport({
          northeast: { lat: ne.lat, lng: ne.lng },
          southwest: { lat: sw.lat, lng: sw.lng },
          zoom,
        });
      }, debounceMs);
    },
    [validateBounds, getBoundsKey, debounceMs]
  );

  const handleMapIdle = useCallback(
    (map: maplibregl.Map) => {
      isDraggingRef.current = false;
      syncCamera(map);
      scheduleViewportFetch(map);
    },
    [syncCamera, scheduleViewportFetch]
  );

  useEffect(() => {
    onMapLoadRef.current = onMapLoad;
  }, [onMapLoad]);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          carto: {
            type: 'raster',
            tiles: [
              'https://a.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}.png',
              'https://b.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}.png',
              'https://c.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}.png',
              'https://d.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}.png',
            ],
            tileSize: 256,
          },
        },
        layers: [{ id: 'carto-layer', type: 'raster', source: 'carto' }],
      },
      center: [initialCenter.lng, initialCenter.lat],
      zoom: initialZoom,
      minZoom: mapOptions.minZoom,
      maxZoom: mapOptions.maxZoom,
      dragRotate: false,
      touchPitch: false,
      attributionControl: false,
    });

    if (!isMobile) {
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    }

    const onMoveStart = () => {
      isDraggingRef.current = true;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
    const onIdle = () => handleMapIdle(map);

    map.on('movestart', onMoveStart);
    map.on('moveend', onIdle);
    map.on('zoomend', onIdle);
    map.on('load', () => {
      mapInstanceRef.current = map;
      setIsMapLoaded(true);
      setMapInstance(map);
      onMapLoadRef.current?.();
      onIdle();
    });

    return () => {
      map.off('movestart', onMoveStart);
      map.off('moveend', onIdle);
      map.off('zoomend', onIdle);
      map.remove();
      mapInstanceRef.current = null;
      setMapInstance(null);
      setIsMapLoaded(false);
    };
  }, [mapOptions.minZoom, mapOptions.maxZoom, isMobile, handleMapIdle]);

  // Actualizar centro/zoom solo cuando cambie de verdad (geocoding / país)
  useEffect(() => {
    if (!mapInstance) return;
    const prev = lastInitialCenterRef.current;
    const moved =
      Math.abs(prev.lat - initialCenter.lat) > 0.0001 ||
      Math.abs(prev.lng - initialCenter.lng) > 0.0001;
    if (!moved) return;
    lastInitialCenterRef.current = initialCenter;
    const zoom =
      recenterMode === 'pan-only'
        ? mapInstance.getZoom()
        : initialZoom;
    mapInstance.easeTo({
      center: [initialCenter.lng, initialCenter.lat],
      zoom,
      duration: 400,
    });
  }, [mapInstance, initialCenter, initialZoom, recenterMode]);

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
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
      {/* Renderizar marcadores solo cuando el mapa esté cargado */}
      {isMapLoaded && services.length > 0 && (
        <ClusteredMarkers
          map={mapInstance}
          services={services}
          bounds={cameraBounds}
          zoom={cameraZoom}
          selectedServiceId={selectedServiceId}
          onServiceClick={onServiceSelect}
          clusterRadius={clusterRadius}
          maxZoom={maxClusterZoom}
        />
      )}

      {isInitialLoading && <MapLoadingIndicator variant="initial" />}
      {isRefreshing && <MapLoadingIndicator variant="refresh" />}

      {error && (
        <div className="absolute left-1/2 top-3 z-[901] max-w-[90vw] -translate-x-1/2 rounded-full bg-red-500 px-4 py-2 text-xs font-semibold text-white shadow-md">
          {error}
        </div>
      )}
    </div>
  );
};

export default React.memo(MapContainer);
