import React, { useState, useMemo, useRef, useEffect, useCallback, startTransition } from 'react';
import maplibregl from 'maplibre-gl';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-csp-worker?url';
import 'maplibre-gl/dist/maplibre-gl.css';
import { capMapWorkers } from '../../lib/mapWorkers';
import { isExternalMapTileUrl } from '../../utils/mapTileUrls';
import {
  buildInspeccionoMapStyle,
  ensureInspeccionoLandFill,
  INSPECCIONO_MAP_THEME,
} from '../../utils/inspeccionoMapStyle';
capMapWorkers(maplibregl);

maplibregl.setWorkerUrl(maplibreWorkerUrl);
import { useServiceLoader, ViewportRequest, Service } from '../../hooks/useServiceLoader';
import { getCurrencySymbol } from '../../utils/priceUtils';
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
  // ✅ 250 ms: tras soltar el mapa, pide los markers de la zona nueva enseguida (antes 500 ms
  //    se sentía lento). Sigue agrupando paneos/zooms rápidos. El fetch real solo arranca en el
  //    'moveend' (isDraggingRef), así que no dispara a mitad del arrastre del drawer.
  debounceMs = 250,
  clusterRadius = 56,
  maxClusterZoom = 17,
}) => {
  // Estado del mapa
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [currentViewport, setCurrentViewport] = useState<ViewportRequest | null>(null);
  const [cameraZoom, setCameraZoom] = useState<number | undefined>(undefined);
  const [mapInstance, setMapInstance] = useState<maplibregl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const onMapLoadRef = useRef(onMapLoad);

  // Referencias para debounce y control
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isDraggingRef = useRef(false);
  const lastServicesKeyRef = useRef<string>('');
  const lastInitialCenterRef = useRef(initialCenter);
  // ⚡ Carga: el debounce de viewport agrupa paneos/zooms rápidos del usuario. Pero en la
  //    PRIMERA carga (y al cambiar de categoría/tipo) no hay gesto que agrupar, así que esos
  //    500 ms son tiempo muerto antes de ver los primeros markers. Disparamos el primer fetch
  //    de inmediato y dejamos el debounce sólo para los movimientos posteriores.
  const isInitialFetchRef = useRef(true);
  // Área (ampliada) ya pedida al backend. Mientras el viewport visible siga DENTRO de ella y
  // no cambie el zoom, NO se vuelve a pedir → los markers no aparecen/desaparecen al panear.
  const fetchedAreaRef = useRef<{ w: number; s: number; e: number; n: number; zoom: number } | null>(null);
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

  // Al cambiar categoría/tipo, el siguiente fetch vuelve a ser "inicial" (sin debounce) y se
  // descarta el área ya cargada → se vuelve a pedir la nueva categoría aunque el mapa no se mueva.
  useEffect(() => {
    isInitialFetchRef.current = true;
    fetchedAreaRef.current = null;
  }, [categoryId, serviceTypeId]);

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

      startTransition(() => {
        // ⚡ Anti-flicker: zoom ENTERO. supercluster reclusteriza por nivel ENTERO, pero
        //    use-supercluster compara la dependencia con el zoom crudo (fraccional). Pasarle
        //    5.234 → 5.237 → 5.241 en cada frame de pan/zoom le hacía RECOMPUTAR clusters y
        //    churnar los markers (parpadeo). Con Math.round, el prop solo cambia al cruzar un
        //    nivel entero → supercluster solo recomputa entonces. setState con el mismo valor
        //    no re-renderiza (React lo descarta). (cameraBounds ya no se usa → eliminado.)
        setCameraZoom(Math.round(zoom));
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

      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();

      // 🔄 Refetch al MOVERSE: cuando el viewport visible SALE del área ya cargada (anillo del
      //    35% alrededor) o cambia el zoom, se piden los expertos de la zona nueva. Así, al
      //    panear/zoomear, aparecen los markers del sitio al que vas (la queja: "no busca nuevos
      //    al moverme"). Un pan pequeño dentro del anillo NO dispara llamada → ni spam ni
      //    parpadeo. Los markers NO desaparecen durante la llamada: se mantienen los previos
      //    hasta que llega la nueva tanda (stale-while-revalidate) y el clustering es estable
      //    (zoom entero + supercluster con bounds=mundo).
      const fetched = fetchedAreaRef.current;
      const stillInside =
        !!fetched &&
        sw.lat >= fetched.s && ne.lat <= fetched.n &&
        sw.lng >= fetched.w && ne.lng <= fetched.e &&
        Math.abs(zoom - fetched.zoom) < 0.6;
      if (stillInside) return;

      // Anillo del 35% alrededor del viewport (área pequeña = consulta MÁS RÁPIDA que antes,
      // que pedía ~60° y tardaba). Acotado para no superar el límite de bounds del backend.
      const latSpan = ne.lat - sw.lat;
      const lngSpan = ne.lng - sw.lng;
      const padLat = Math.min(latSpan * 0.35, Math.max(0, (75 - latSpan) / 2));
      const padLng = Math.min(lngSpan * 0.35, Math.max(0, (75 - lngSpan) / 2));
      let n = Math.min(85, ne.lat + padLat);
      let s = Math.max(-85, sw.lat - padLat);
      let e = Math.min(180, ne.lng + padLng);
      let w = Math.max(-180, sw.lng - padLng);
      // 🛡️ Recorte duro del tamaño del box al límite del backend (rechaza >90°,
      //    ver SearchServiceService.GetMapExpertsWithDetails). El padding de arriba
      //    SOLO acota cuando el span es <75°; en pantallas anchas a zoom bajo el
      //    viewport ya supera 90° de longitud y se enviaba tal cual → 400 Bad Request
      //    ("Bounds demasiado grandes"). Encogemos el box (centrado) a un máximo
      //    seguro. Al clusterizar en cliente con tope 500, basta con el área central.
      const MAX_SPAN_DEG = 80;
      if (n - s > MAX_SPAN_DEG) {
        const c = (n + s) / 2;
        n = c + MAX_SPAN_DEG / 2;
        s = c - MAX_SPAN_DEG / 2;
      }
      if (e - w > MAX_SPAN_DEG) {
        const c = (e + w) / 2;
        e = c + MAX_SPAN_DEG / 2;
        w = c - MAX_SPAN_DEG / 2;
      }
      const exp = { n, s, e, w, zoom };
      fetchedAreaRef.current = exp;

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Primer fetch (carga inicial / cambio de categoría) → sin retardo. Resto → debounce.
      const delay = isInitialFetchRef.current ? 0 : debounceMs;
      isInitialFetchRef.current = false;

      debounceTimerRef.current = setTimeout(() => {
        if (isDraggingRef.current) return;
        // ⚡ Transición: el fetch + render de la nueva lista de servicios es pesado. Con
        // transition, React deja respirar al input antes de pintar la nueva tanda.
        startTransition(() => {
          setCurrentViewport({
            northeast: { lat: exp.n, lng: exp.e },
            southwest: { lat: exp.s, lng: exp.w },
            zoom,
          });
        });
      }, delay);
    },
    [validateBounds, debounceMs]
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
            // ⚡ 0.42 (antes 0.60): el 60% subía el centro tanto que los markers se amontonaban
            //    en la franja superior (la queja "se ven arriba en los bordes") y obligaba a
            //    cargar bastantes más tiles. 0.42 deja España por encima del drawer pero reparte
            //    los markers por el área visible y baja el nº de tiles en móvil.
            bottom: Math.round(window.innerHeight * 0.42),
            left: 20,
            right: 20,
          }
        : typeof window !== 'undefined'
          ? { top: 24, bottom: Math.round(window.innerHeight * 0.30), left: 16, right: 16 }
          : { top: 0, bottom: 0, left: 0, right: 0 };

    // 🗺️ Mapa de búsqueda PLANO (mercator, pitch 0). Antes usaba proyección globe + tilt,
    //    pero bajo globe maplibre CLAMPA/OCULTA los markers HTML al acercarse al horizonte
    //    (bug conocido: "globe unproject clamps points to horizon"): al alejar o en móvil,
    //    los markers de los bordes (Londres, Roma, Casablanca…) DESAPARECÍAN. Plano = los
    //    markers se quedan exactamente en su lng/lat y nunca desaparecen (estándar Airbnb).
    const openingPitch = 0;

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

    const applyFlat = () => {
      // Mercator plano explícito (el estilo ya es mercator por defecto) + pitch 0.
      try { map.setProjection({ type: 'mercator' }); } catch { /* runtime sin setProjection */ }
      if (map.getPitch() !== 0) map.setPitch(0);
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
      handleMapIdle(map);
    };

    map.once('style.load', applyFlat);
    map.on('movestart', onMoveStart);
    map.on('moveend', onIdle);
    map.on('zoomend', onIdle);
    map.on('load', () => {
      applyFlat();
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

    if (map.isStyleLoaded()) applyFlat();

    return () => {
      map.off('style.load', applyFlat);
      map.off('movestart', onMoveStart);
      map.off('moveend', onIdle);
      map.off('zoomend', onIdle);
      map.remove();
      mapInstanceRef.current = null;
      setMapInstance(null);
      setIsMapLoaded(false);
    };
  }, [mapOptions.minZoom, mapOptions.maxZoom, isMobile, handleMapIdle, initialZoom]);

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
      pitch: 0,
      bearing: 0,
      duration: 400,
    });
  }, [mapInstance, initialCenter, initialZoom, recenterMode, isMobile]);

  // 📌 Popover anclado al pin seleccionado (desktop): tarjeta compacta sobre el marcador
  //    con foto, nombre, valoración, precio y CTA — la pieza de sincronización lista↔mapa
  //    que faltaba. Additivo: una instancia maplibregl.Popup propia, no toca los markers.
  const popupRef = useRef<maplibregl.Popup | null>(null);
  useEffect(() => {
    const map = mapInstance;
    if (!map || isMobile) return;
    const svc = selectedServiceId != null ? services.find((s) => s.id === selectedServiceId) : null;
    if (!svc || !Number.isFinite(svc.lat) || !Number.isFinite(svc.lng)) {
      if (popupRef.current) { popupRef.current.remove(); popupRef.current = null; }
      return;
    }
    const raw: any = (svc as any).raw || {};
    const expert: any = raw.expert || raw.Expert || (svc as any).expert || {};
    const esc = (s: string) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
    const name = esc(svc.name || expert?.user?.name || 'Experto');
    const avatar = expert.profilePictureUrl || expert.ProfilePictureUrl || '';
    const img = (raw.imageUrls || raw.ImageUrls || [])[0] || '';
    const rating = Number(raw.averageRating ?? raw.AverageRating ?? 0);
    const reviews = Number(raw.totalReviews ?? raw.TotalReviews ?? 0);
    const cur = (svc as any).priceCurrency || (svc as any).currency || 'EUR';
    const price = svc.price > 0 ? `${getCurrencySymbol(cur)}${Math.round(svc.price)}` : 'Consultar';
    const typeLabel = esc(raw.serviceTypeName || raw.ServiceTypeName || 'Revisión');
    const ratingHtml = rating > 0
      ? `<span style="display:inline-flex;align-items:center;gap:3px;font-size:12px;color:#222">
           <svg width="11" height="11" viewBox="0 0 24 24" fill="#F59E0B"><path d="M12 17.3l-6.16 3.7 1.64-7.03L2 9.24l7.19-.61L12 2l2.81 6.63 7.19.61-5.48 4.73 1.64 7.03z"/></svg>
           <strong style="font-weight:600">${rating.toFixed(1).replace('.', ',')}</strong>
           ${reviews > 0 ? `<span style="color:#737373">(${reviews})</span>` : ''}
         </span>`
      : '';
    const html = `
      <a href="/service/${svc.id}" style="display:block;text-decoration:none;color:inherit;width:236px">
        ${img ? `<div style="height:108px;width:100%;overflow:hidden;border-radius:12px 12px 0 0;background:#eceff3"><img src="${esc(img)}" style="height:100%;width:100%;object-fit:cover;display:block"/></div>` : ''}
        <div style="padding:9px 11px 11px;font-family:Manrope,system-ui,sans-serif">
          <div style="display:flex;align-items:center;gap:8px">
            ${avatar ? `<img src="${esc(avatar)}" style="height:26px;width:26px;border-radius:50%;object-fit:cover;flex:none;border:1.5px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.18)"/>` : ''}
            <div style="min-width:0;flex:1">
              <div style="font-size:10px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:#8a8a8a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${typeLabel}</div>
              <div style="font-size:14px;font-weight:600;letter-spacing:-.01em;color:#1c1c1c;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${name}</div>
            </div>
          </div>
          <div style="margin-top:7px;display:flex;align-items:center;justify-content:space-between">
            ${ratingHtml}
            <span style="font-size:14px;font-weight:600;color:#1c1c1c;font-variant-numeric:tabular-nums">${price}<span style="font-size:11px;font-weight:400;color:#737373"> / servicio</span></span>
          </div>
        </div>
      </a>`;
    if (!popupRef.current) {
      popupRef.current = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 20,
        maxWidth: '260px',
        className: 'ip-map-popup',
      });
    }
    popupRef.current.setLngLat([svc.lng, svc.lat]).setHTML(html).addTo(map);
    // Pulir el contenedor por defecto del popup (sin padding, esquinas redondas, sombra).
    const el = popupRef.current.getElement();
    const content = el?.querySelector('.maplibregl-popup-content') as HTMLElement | null;
    if (content) {
      content.style.padding = '0';
      content.style.borderRadius = '14px';
      content.style.overflow = 'hidden';
      content.style.boxShadow = '0 10px 30px rgba(16,24,40,.18),0 2px 8px rgba(16,24,40,.10)';
    }
  }, [mapInstance, selectedServiceId, services, isMobile]);

  // Limpiar el popup al desmontar.
  useEffect(() => () => { if (popupRef.current) { popupRef.current.remove(); popupRef.current = null; } }, []);

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
      {/* Renderizar marcadores cuando el mapa esté cargado. Mantenemos la capa montada
          también mientras `isRefreshing` aunque `services` quede vacío un instante: así un
          refetch (cambio de categoría/viewport) no desmonta TODO el árbol de markers
          —destruyendo entriesRef— para recrearlo entero al volver los datos (flicker). */}
      {isMapLoaded && (services.length > 0 || isRefreshing) && (
        <ClusteredMarkers
          map={mapInstance}
          services={services}
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
