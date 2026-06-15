import React, { useState, useMemo, useRef, useEffect, useCallback, startTransition } from 'react';
import maplibregl from 'maplibre-gl';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-csp-worker?url';
import 'maplibre-gl/dist/maplibre-gl.css';
import { capMapWorkers } from '../../lib/mapWorkers';
import { isExternalMapTileUrl } from '../../utils/mapTileUrls';
import {
  applyInspeccionoGlobeProjection,
  buildInspeccionoMapStyle,
  ensureInspeccionoLandFill,
  getSearchMapGlobePitch,
  INSPECCIONO_MAP_THEME,
} from '../../utils/inspeccionoMapStyle';
capMapWorkers(maplibregl);

maplibregl.setWorkerUrl(maplibreWorkerUrl);
import { useServiceLoader, ViewportRequest, Service } from '../../hooks/useServiceLoader';
// ✅ Default import → activa React.memo del ClusteredMarkers. Antes (named import)
//    cada hover/select sobre la lista forzaba el bucle remove+create de TODOS los markers.
import ClusteredMarkers from './ClusteredMarkers';
import { MapLoadingIndicator } from './MapLoadingIndicator';

interface MapContainerProps {
  categoryId: number | null;
  serviceTypeId: number | null;
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
  onServiceSelect?: (service: Service) => void;
  selectedServiceId?: number | null;
  hoveredServiceId?: number | null;
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
  hoveredServiceId,
  isMobile = false,
  className,
  style,
  onMapLoad,
  onServicesCountChange,
  onServicesChange,
  onLoadingChange,
  recenterMode = 'pan-only',
  // ✅ 500 ms (no 280): da margen al gesto del drawer móvil sin disparar refetch
  //    a mitad del arrastre cuando el mapa "se mueve" bajo el dedo. El default del
  //    comentario superior ya decía 500; el valor real era 280.
  debounceMs = 500,
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

  /** Sincroniza cámara al instante (clusters reactivos).
   *
   * ⚡ `startTransition`: cada moveend/zoomend dispara el recálculo de clusters
   * y el re-render de los markers DOM (caro). Sin transición, ese trabajo
   * compite con el próximo paint y dispara INP malos en gestos continuos de
   * pan/zoom. Con transición, React mantiene el hilo responsivo y el cluster
   * sale en el siguiente idle.
   */
  const syncCamera = useCallback(
    (map: maplibregl.Map) => {
      const bounds = map.getBounds();
      const zoom = map.getZoom();
      if (!bounds || !Number.isFinite(zoom) || !validateBounds(bounds, zoom)) return;

      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      startTransition(() => {
        setCameraBounds([sw.lng, sw.lat, ne.lng, ne.lat]);
        setCameraZoom(zoom);
      });
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
        // ⚡ Transición: el fetch + render de la nueva lista de servicios es
        // pesado. Sin transition, bloquea el primer paint tras el `moveend`
        // y el INP sube. Con transition, React deja respirar al input antes
        // de pintar la nueva tanda.
        startTransition(() => {
          setCurrentViewport({
            northeast: { lat: ne.lat, lng: ne.lng },
            southwest: { lat: sw.lat, lng: sw.lng },
            zoom,
          });
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

  const syncGlobePitch = useCallback(
    (map: maplibregl.Map, animate = false) => {
      const targetPitch = getSearchMapGlobePitch(map.getZoom(), isMobile);
      if (Math.abs(map.getPitch() - targetPitch) < 0.2) return;
      if (animate) {
        map.easeTo({ pitch: targetPitch, bearing: 0, duration: 320 });
      } else {
        map.setPitch(targetPitch);
      }
    },
    [isMobile],
  );

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // ✅ Padding inicial calculado en el constructor — antes se aplicaba dentro de
    //    map.on('load'), lo que provocaba un re-encaje de cámara después del primer
    //    render y los marcadores brincaban. Aplicándolo aquí, la cámara ya nace
    //    con el padding correcto y el primer fetch del viewport ya es el definitivo.
    //
    // 🔝 Bottom padding empuja el centro geográfico HACIA ARRIBA en el viewport.
    //    Móvil: 60% (subido desde 50%) → España visible más arriba sobre el drawer.
    //    Desktop: 30% del alto (era 0) → España queda en el tercio superior del mapa,
    //    mostrando más Europa arriba (Francia, Pirineos) y menos África abajo.
    const initialPadding =
      isMobile && typeof window !== 'undefined'
        ? {
            top: 56,
            bottom: Math.round(window.innerHeight * 0.60),
            left: 20,
            right: 20,
          }
        : typeof window !== 'undefined'
          ? { top: 24, bottom: Math.round(window.innerHeight * 0.30), left: 16, right: 16 }
          : { top: 0, bottom: 0, left: 0, right: 0 };

    const openingPitch = getSearchMapGlobePitch(initialZoom, isMobile);

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: buildInspeccionoMapStyle({ withLabels: true }),
      center: [initialCenter.lng, initialCenter.lat],
      zoom: initialZoom,
      bearing: 0,
      pitch: openingPitch,
      minZoom: mapOptions.minZoom,
      maxZoom: mapOptions.maxZoom,
      minPitch: 0,
      maxPitch: 48,
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
      attributionControl: false,
      fadeDuration: 0,
      transformRequest: (url, resourceType) => {
        if (resourceType === 'Tile' && isExternalMapTileUrl(url)) {
          return { url, credentials: 'omit' };
        }
        return { url };
      },
      // padding se pasa via fitBounds/easeTo; lo aplicamos aquí porque el constructor
      // no acepta padding inicial — MapLibre v3 sí lo acepta, pero por compat dejamos
      // setPadding inmediato tras el new() abajo (antes del primer render del DOM).
    });
    map.setPadding(initialPadding);
    // Pinch = solo zoom; el giro con dos dedos queda desactivado.
    map.touchZoomRotate.disableRotation();
    map.dragRotate.disable();

    const applyGlobe = () => {
      applyInspeccionoGlobeProjection(map);
      syncGlobePitch(map, false);
    };

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
    const onIdle = () => {
      syncGlobePitch(map, true);
      handleMapIdle(map);
    };

    map.once('style.load', applyGlobe);
    map.on('movestart', onMoveStart);
    map.on('moveend', onIdle);
    map.on('zoomend', onIdle);
    map.on('load', () => {
      applyGlobe();
      try {
        ensureInspeccionoLandFill(map);
        map.triggerRepaint();
      } catch {
        // La capa de tierra es cosmética; el mapa sigue usable sin ella.
      }
      // ✅ El padding ya se aplicó en el constructor (initialPadding) → no hay
      //    re-encaje aquí y los marcadores no brincan al primer fetch.
      mapInstanceRef.current = map;
      setIsMapLoaded(true);
      setMapInstance(map);
      onMapLoadRef.current?.();
      handleMapIdle(map);
    });

    if (map.isStyleLoaded()) applyGlobe();

    return () => {
      map.off('style.load', applyGlobe);
      map.off('movestart', onMoveStart);
      map.off('moveend', onIdle);
      map.off('zoomend', onIdle);
      map.remove();
      mapInstanceRef.current = null;
      setMapInstance(null);
      setIsMapLoaded(false);
    };
  }, [mapOptions.minZoom, mapOptions.maxZoom, isMobile, handleMapIdle, initialZoom, syncGlobePitch]);

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
      pitch: getSearchMapGlobePitch(zoom, isMobile),
      bearing: 0,
      duration: 400,
    });
  }, [mapInstance, initialCenter, initialZoom, recenterMode, isMobile]);

  return (
    <div
      className={className}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        backgroundColor: INSPECCIONO_MAP_THEME.sky,
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
          hoveredServiceId={hoveredServiceId}
          onServiceClick={onServiceSelect}
          clusterRadius={clusterRadius}
          maxZoom={maxClusterZoom}
        />
      )}

      {isInitialLoading && !isMobile && (
        <MapLoadingIndicator variant="initial" />
      )}
      {isRefreshing && !isMobile && <MapLoadingIndicator variant="refresh" />}

      {error && (
        <div className="absolute left-1/2 top-3 z-[901] max-w-[90vw] -translate-x-1/2 rounded-full bg-red-500 px-4 py-2 text-xs font-semibold text-white shadow-md">
          {error}
        </div>
      )}
    </div>
  );
};

export default React.memo(MapContainer);
