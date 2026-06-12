import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-csp-worker?url';
import 'maplibre-gl/dist/maplibre-gl.css';
import { capMapWorkers } from '../lib/mapWorkers';
capMapWorkers(maplibregl);
import { MapPin } from 'lucide-react';
import { getCartoVoyagerNoLabelsTiles, isExternalMapTileUrl } from '../utils/mapTileUrls';
import {
  EXPERT_SPARKLE_PALETTES,
  expertSparkleMarkerHtml,
} from './Map/expertSparkleMarker';
import {
  EXPERT_SPARKLE_HUBS,
  HERO_LANDING_SPARKLE_HUBS,
  HERO_WORLD_SPARKLE_HUBS,
  type ExpertSparkleHub,
} from './Map/expertSparkleHubs';
import {
  // 🌍 isMapMercator ya NO se usa aquí: las dos guardas que requerían mercator
  // (creación de marcadores + visibilidad) se eliminaron para soportar globo.
  // El culling de hemisferio lo maneja ahora isSparkleOnScreen internamente.
  pickSpreadSparkleHubIds,
  pickVisibleSparkleHubIds,
  sparkleMarkerScale,
} from './Map/expertSparkleVisibility';

maplibregl.setWorkerUrl(maplibreWorkerUrl);

/**
 * Mapa con perspectiva sutil (MapLibre) + tiles Carto/OSM.
 * Contornos globales de tierra/costa (Natural Earth) — app mundial, no solo España.
 */

/** Paleta clara — agua suave, costas en azul marca (alineada con Carto Voyager).
 *  ⚠️ MapLibre `paint.line-color` exige un color CSS resuelto (hex/rgb/hsl con valores
 *  literales). NO acepta `hsl(var(--brand))` — la `var()` se queda como string opaco.
 *  Por eso este es el único punto del frontend donde se conserva el hex de marca
 *  hardcoded. Si cambia `--brand`, actualizar también este literal. */
const MAP_THEME = {
  sky: '#dce9f2',
  land: '#ebe8e3',
  brand: '#0066CC',
  coastLine: '#0066CC',
  coastHalo: '#ffffff',
  border: '#d1c4c6',
} as const;

/**
 * Natural Earth — el relleno de tierra NO puede depender solo de tiles raster:
 * en proyección globe + zoom regional los tiles Carto a menudo no pintan y solo quedan las líneas.
 */
const NE_GEO = {
  /** 110m: carga más rápida; capa fill bajo los tiles */
  land: '/geo/ne_110m_land.geojson',
  coastline: '/geo/ne_50m_coastline.geojson',
  borders: '/geo/ne_50m_admin_0_boundary_lines_land.geojson',
} as const;

const LINE_LAYOUT: maplibregl.LineLayerSpecification['layout'] = {
  'line-cap': 'round',
  'line-join': 'round',
};

/** Relleno de masas terrestres (siempre visible aunque fallen o no pinten los tiles). */
function ensureLandFillLayer(map: maplibregl.Map): void {
  if (map.getSource('ne-land')) return;

  map.addSource('ne-land', { type: 'geojson', data: NE_GEO.land });
  map.addLayer(
    {
      id: 'land-fill',
      type: 'fill',
      source: 'ne-land',
      paint: {
        'fill-color': MAP_THEME.land,
        'fill-opacity': 1,
      },
    },
    'carto',
  );
}

function addGlobalOutlineLayers(map: maplibregl.Map): void {
  if (map.getSource('ne-coastline')) return;

  map.addSource('ne-coastline', { type: 'geojson', data: NE_GEO.coastline });
  map.addSource('ne-borders', { type: 'geojson', data: NE_GEO.borders });

  map.addLayer({
    id: 'coastline-halo',
    type: 'line',
    source: 'ne-coastline',
    layout: LINE_LAYOUT,
    paint: {
      'line-color': MAP_THEME.coastHalo,
      'line-width': ['interpolate', ['linear'], ['zoom'], 3, 3.5, 5, 5, 7, 6.5, 9, 8],
      'line-opacity': 1,
    },
  });

  map.addLayer({
    id: 'coastline',
    type: 'line',
    source: 'ne-coastline',
    layout: LINE_LAYOUT,
    paint: {
      'line-color': MAP_THEME.coastLine,
      'line-width': ['interpolate', ['linear'], ['zoom'], 3, 1.6, 5, 2.2, 7, 3, 9, 3.8],
      'line-opacity': 0.95,
    },
  });

  map.addLayer({
    id: 'country-borders',
    type: 'line',
    source: 'ne-borders',
    layout: LINE_LAYOUT,
    paint: {
      'line-color': MAP_THEME.border,
      'line-width': ['interpolate', ['linear'], ['zoom'], 3, 0.5, 5, 0.85, 7, 1.2, 9, 1.6],
      'line-opacity': 0.52,
    },
  });
}

export interface ExpertCity {
  name: string;
  lat: number;
  lng: number;
  count: number;
}

const CITY_EXPERTS: ReadonlyArray<ExpertCity> = [
  { name: 'Madrid', lat: 40.4168, lng: -3.7038, count: 2 },
  { name: 'Paris', lat: 48.8566, lng: 2.3522, count: 1 },
  { name: 'London', lat: 51.5074, lng: -0.1278, count: 1 },
  { name: 'Berlin', lat: 52.52, lng: 13.405, count: 1 },
  { name: 'New York', lat: 40.7128, lng: -74.006, count: 2 },
  { name: 'São Paulo', lat: -23.5505, lng: -46.6333, count: 1 },
  { name: 'Tokyo', lat: 35.6762, lng: 139.6503, count: 1 },
  { name: 'Dubai', lat: 25.2048, lng: 55.2708, count: 1 },
  { name: 'Sydney', lat: -33.8688, lng: 151.2093, count: 1 },
  { name: 'Mexico City', lat: 19.4326, lng: -99.1332, count: 1 },
  { name: 'Singapore', lat: 1.3521, lng: 103.8198, count: 1 },
  { name: 'Buenos Aires', lat: -34.6037, lng: -58.3816, count: 1 },
];

/** Carto Voyager limpio — colores naturales tierra/agua */
function buildCartoStyle(): maplibregl.StyleSpecification {
  return {
    version: 8,
    sources: {
      carto: {
        type: 'raster',
        tiles: getCartoVoyagerNoLabelsTiles(),
        tileSize: 256,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a> &copy; <a href="https://www.naturalearthdata.com/">Natural Earth</a>',
      },
    },
    layers: [
      {
        id: 'sky-bg',
        type: 'background',
        paint: { 'background-color': MAP_THEME.sky },
      },
      {
        id: 'carto',
        type: 'raster',
        source: 'carto',
        paint: { 'raster-opacity': 1 },
      },
    ],
  };
}

/**
 * Vista inicial: planeta completo (proyección globe).
 * @see https://maplibre.org/maplibre-gl-js/docs/examples/zoom-and-planet-size-relation-on-globe/
 *
 * 🔧 v7-globo: zoom 1.25 → 0.45. A 1.25 el planeta quedaba pegado a cámara
 * y se veía más bien como un casquete; a 0.45 se aprecia el "efecto globo
 * terráqueo" con esfera completa, curvatura del horizonte, espacio negro
 * alrededor. Pitch moderado para globo reconocible sin picado excesivo.
 */
const GLOBE_INTRO = {
  center: [0, 18] as [number, number],
  zoom: 0.45,
  pitch: 28,
  bearing: -14,
} as const;

/** Vista regional tras el vuelo desde el globo (fallback España).
 *
 * Pitch moderado: curvatura del globo visible sin inclinación extrema (~52°
 * se sentía demasiado girado). Con ~32° el mapa queda más legible y profesional
 * manteniendo profundidad 3D en proyección globe.
 */
const HERO_CAMERA = {
  center: [-4.0, 39.6] as [number, number],
  zoom: 4.1,
  pitch: 32,
  bearing: 0,
  maxPitch: 48,
} as const;

/** Hero móvil: mundo estático en franja lateral — sin globo ni vuelo regional */
const MOBILE_PEEK_CAMERA = {
  center: [0, 18] as [number, number],
  zoom: 1.55,
  pitch: 0,
  bearing: 0,
} as const;

// 🔧 v7-globo: hold 100→650 ms para que el usuario perciba el efecto globo
// terráqueo (esfera completa) antes de empezar el vuelo regional. Sin esta
// pausa el flyTo arrancaba a los 100 ms y el ojo no llegaba a registrar la
// curvatura. 650 ms es el sweet spot — suficiente para "wow", no tanto como
// para sentir que la página se quedó pillada.
const GLOBE_HOLD_MS = 650;
const LANDING_FLY_MS = 1400;
/** Si IP no marca resolved a tiempo, forzar vuelo igual (evita quedarse en globo sin zoom). */
const IP_RESOLVE_FALLBACK_MS = 450;
/** Menos zoom = cámara más lejos al aterrizar (valor final de la transición) */
const LANDING_ZOOM_PULLBACK = 2.55;
const MIN_LANDING_ZOOM = 2.05;

const toHeroLandingZoom = (zoom: number) =>
  Math.max(MIN_LANDING_ZOOM, zoom - LANDING_ZOOM_PULLBACK);

/**
 * 🔧 v7-globo-stay: ya NO conmutamos a mercator tras el vuelo. MapLibre 5.24
 * renderiza tiles raster Carto correctamente en globe a cualquier zoom (la
 * limitación del comentario original era de v4.x). Quedándonos en globe se
 * preserva la curvatura del planeta detrás del bbox regional → no se "aplana".
 * Esta función queda como NO-OP para no romper los call-sites; el `resize +
 * triggerRepaint` final sigue siendo útil para refrescar la viewport.
 */
const applyRegionalProjection = (map: maplibregl.Map) => {
  map.resize();
  map.triggerRepaint();
};

const repaintWhenTilesReady = (map: maplibregl.Map, onDone?: () => void) => {
  let frames = 0;
  const tick = () => {
    map.triggerRepaint();
    frames += 1;
    if (frames < 3) {
      requestAnimationFrame(tick);
    } else {
      onDone?.();
    }
  };
  map.once('idle', () => {
    tick();
  });
  map.triggerRepaint();
};

export interface MapLandingTarget {
  center: [number, number];
  zoom: number;
  countryCode?: string;
}

const sizeFor = (count: number) => Math.max(28, Math.min(44, 28 + (count - 1) * 4));

function markerHtml(
  city: ExpertCity,
  selected: boolean,
  hovered: boolean,
  clickable: boolean,
): string {
  const size = sizeFor(city.count);
  const scale = selected ? 1.12 : hovered ? 1.06 : 1;
  const shadow =
    selected || hovered
      ? '0 8px 18px hsl(var(--brand)/0.42)'
      : '0 4px 10px hsl(var(--brand)/0.28)';

  const ring = selected
    ? `<div style="position:absolute;inset:-7px;border-radius:50%;border:3px solid hsl(var(--brand)/0.35);pointer-events:none"></div>`
    : '';

  const tooltip = hovered
    ? `<div style="position:absolute;bottom:calc(100% + 8px);left:50%;transform:translateX(-50%);background:#fff;color:#222;font-size:11px;font-weight:600;padding:4px 8px;border-radius:8px;border:1px solid #e5e7eb;box-shadow:0 6px 16px rgba(15,23,42,0.12);white-space:nowrap;pointer-events:none">${city.name} · ${city.count} experto${city.count === 1 ? '' : 's'}</div>`
    : '';

  return `
    <div style="position:relative;width:${size}px;height:${size}px;transform:scale(${scale});transition:transform 150ms ease;cursor:${clickable ? 'pointer' : 'default'}">
      ${ring}
      <div style="position:absolute;inset:0;border-radius:50%;background:#fff;border:2px solid hsl(var(--brand));box-shadow:${shadow};display:flex;align-items:center;justify-content:center;color:hsl(var(--brand));font-weight:700;font-size:12px;font-family:system-ui,sans-serif">${city.count}</div>
      ${tooltip}
    </div>
  `;
}

interface ExpertsAreaMapProps {
  onCityClick?: (city: ExpertCity) => void;
  selectedCity?: string | null;
  className?: string;
  /** Fracción del ancho cubierta por el panel izquierdo (0–1). Centra el mapa en la zona visible. */
  overlayPaddingRatio?: number;
  /** Destino del vuelo detectado por IP (capital del país). */
  ipLanding?: MapLandingTarget | null;
  /** true cuando la detección por IP terminó (éxito o error). */
  ipLandingResolved?: boolean;
  /** Oculta el chip inferior derecho (ciudades/expertos) si el padre muestra su propia barra */
  hideCornerStats?: boolean;
  /** Hero homepage: mapa decorativo sin marcadores numerados (menos ruido visual) */
  showCityMarkers?: boolean;
  /** Destellos de color anclados a cada ciudad con expertos (símbolo de red global) */
  showExpertSparkles?: boolean;
  /** `hero-world`: red mundial dispersa. `hero-europe`: densidad regional (homepage desktop). `global`: todos. */
  sparkleRegion?: 'hero-world' | 'hero-europe' | 'global';
  /** `spread`: rejilla en todo el canvas. `cluster`: prioriza hubs sin solaparse. */
  sparkleDensity?: 'spread' | 'cluster';
  /** Ciclo de aparición/desaparición en cada punto (hero decorativo). */
  sparkleTwinkle?: boolean;
  /**
   * `mobile-peek`: franja lateral compacta — mundo estático, sin animación globe.
   * `default`: hero desktop con intro globe + aterrizaje regional.
   */
  heroVariant?: 'default' | 'mobile-peek';
}

export const ExpertsAreaMap: React.FC<ExpertsAreaMapProps> = ({
  onCityClick,
  selectedCity = null,
  className = '',
  overlayPaddingRatio = 0,
  ipLanding = null,
  ipLandingResolved = false,
  hideCornerStats = false,
  showCityMarkers = true,
  showExpertSparkles = false,
  sparkleRegion = 'hero-world',
  sparkleDensity = 'cluster',
  sparkleTwinkle = false,
  heroVariant = 'default',
}) => {
  const isMobilePeek = heroVariant === 'mobile-peek';
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const sparkleMarkersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const landFillLoadedRef = useRef(false);
  const outlinesLoadedRef = useRef(false);
  const landingStartedRef = useRef(false);
  const landingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tryScheduleLandingRef = useRef<(() => void) | null>(null);
  const ipLandingRef = useRef(ipLanding);
  const ipLandingResolvedRef = useRef(ipLandingResolved);

  const [mapReady, setMapReady] = useState(false);
  const [introComplete, setIntroComplete] = useState(false);
  const [mapLoadFailed, setMapLoadFailed] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [detectedCountryCode, setDetectedCountryCode] = useState<string | null>(null);

  const totalExperts = useMemo(
    () => CITY_EXPERTS.reduce((acc, c) => acc + c.count, 0),
    [],
  );

  const sparkleHubs = useMemo<readonly ExpertSparkleHub[]>(() => {
    if (sparkleRegion === 'global') return EXPERT_SPARKLE_HUBS;
    if (sparkleRegion === 'hero-europe') return HERO_LANDING_SPARKLE_HUBS;
    return HERO_WORLD_SPARKLE_HUBS;
  }, [sparkleRegion]);

  const handleCityClick = useCallback(
    (city: ExpertCity) => {
      onCityClick?.(city);
    },
    [onCityClick],
  );

  const clearSparkleMarkers = useCallback(() => {
    sparkleMarkersRef.current.forEach((m) => m.remove());
    sparkleMarkersRef.current.clear();
  }, []);

  const updateSparkleVisibility = useCallback(() => {
    const map = mapRef.current;
    if (!map || sparkleMarkersRef.current.size === 0) return;

    // 🌍 Antes ocultábamos TODOS los marcadores durante el intro de globo (línea
    // `if (!introComplete || !isMapMercator(map))`). Ahora `isSparkleOnScreen`
    // entiende globe — cull por hemisferio visible + bounds del canvas — y los
    // pickers usan grids/límites más densos en globo. Resultado: durante el
    // aterrizaje del planeta también se ven destellos por el hemisferio frontal,
    // sin fantasmas del lado oculto.
    const visibleIds =
      sparkleDensity === 'spread'
        ? pickSpreadSparkleHubIds(map, sparkleHubs)
        : pickVisibleSparkleHubIds(map, sparkleHubs);
    const scale = sparkleMarkerScale(map);

    sparkleMarkersRef.current.forEach((marker, hubId) => {
      const el = marker.getElement();
      const visible = visibleIds.has(hubId);
      el.style.display = visible ? '' : 'none';
      if (visible) {
        el.style.setProperty('--sp-scale', String(scale));
      }
    });
  }, [sparkleHubs, sparkleDensity]);

  useEffect(() => {
    ipLandingRef.current = ipLanding;
    ipLandingResolvedRef.current = ipLandingResolved;
    if (ipLanding?.countryCode) {
      setDetectedCountryCode(ipLanding.countryCode);
    }
    tryScheduleLandingRef.current?.();
  }, [ipLanding, ipLandingResolved]);

  useLayoutEffect(() => {
    const el = containerRef.current;
    const wrapper = wrapperRef.current;
    if (!el || !wrapper) return;

    let cancelled = false;
    let map: maplibregl.Map | null = null;
    let ro: ResizeObserver | null = null;
    let mapReadyHandled = false;
    let landingTarget: { center: [number, number]; zoom: number } = {
      center: HERO_CAMERA.center,
      zoom: HERO_CAMERA.zoom,
    };

    const applyOverlayPadding = () => {
      if (!mapRef.current || !wrapper) return;
      const left = Math.round(wrapper.clientWidth * overlayPaddingRatio);
      mapRef.current.setPadding({ left, top: 0, right: 0, bottom: 0 });
    };

    const flyToLanding = (targetMap: maplibregl.Map, center: [number, number], zoom: number) => {
      applyOverlayPadding();
      const landingZoom = toHeroLandingZoom(zoom);
      const prefersReducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches;

      const finishIntro = () => {
        if (cancelled || mapRef.current !== targetMap) return;
        applyRegionalProjection(targetMap);
        targetMap.jumpTo({
          center,
          zoom: landingZoom,
          pitch: HERO_CAMERA.pitch,
          bearing: HERO_CAMERA.bearing,
        });
        let completed = false;
        const complete = () => {
          if (completed || cancelled || mapRef.current !== targetMap) return;
          completed = true;
          setIntroComplete(true);
        };
        repaintWhenTilesReady(targetMap, complete);
        window.setTimeout(complete, 900);
      };

      if (prefersReducedMotion) {
        applyRegionalProjection(targetMap);
        targetMap.jumpTo({
          center,
          zoom: landingZoom,
          pitch: HERO_CAMERA.pitch,
          bearing: HERO_CAMERA.bearing,
        });
        finishIntro();
        return;
      }

      // Animación regional en globe: pitch final moderado — curvatura sin exceso de inclinación.
      const globeFlyZoom = Math.max(GLOBE_INTRO.zoom, Math.min(landingZoom + 0.35, 3.2));
      targetMap.flyTo({
        center,
        zoom: globeFlyZoom,
        pitch: HERO_CAMERA.pitch,
        bearing: HERO_CAMERA.bearing,
        duration: LANDING_FLY_MS,
        speed: 1.05,
        curve: 1.15,
        essential: true,
      });

      const safetyTimer = window.setTimeout(finishIntro, LANDING_FLY_MS + 600);
      targetMap.once('moveend', () => {
        window.clearTimeout(safetyTimer);
        finishIntro();
      });
    };

    const runLandingIntro = () => {
      if (landingStartedRef.current || cancelled || !map) return;
      if (landingTimerRef.current) clearTimeout(landingTimerRef.current);

      let frames = 0;
      const waitGlobeRender = () => {
        if (cancelled || mapRef.current !== map || !map) return;
        frames += 1;
        if (frames < 2) {
          requestAnimationFrame(waitGlobeRender);
          return;
        }
        landingStartedRef.current = true;
        flyToLanding(map, landingTarget.center, landingTarget.zoom);
      };
      requestAnimationFrame(waitGlobeRender);
    };

    const scheduleLandingIntro = () => {
      if (landingStartedRef.current || cancelled || !map) return;
      if (landingTimerRef.current) clearTimeout(landingTimerRef.current);
      landingTimerRef.current = setTimeout(runLandingIntro, GLOBE_HOLD_MS);
    };

    const tryScheduleLanding = () => {
      if (landingStartedRef.current || cancelled || !map || !mapReadyHandled) return;
      if (!ipLandingResolvedRef.current) return;

      const ipTarget = ipLandingRef.current;
      landingTarget = ipTarget
        ? { center: ipTarget.center, zoom: ipTarget.zoom }
        : { center: HERO_CAMERA.center, zoom: HERO_CAMERA.zoom };

      if (ipTarget?.countryCode) {
        setDetectedCountryCode(ipTarget.countryCode);
      }

      scheduleLandingIntro();
    };

    tryScheduleLandingRef.current = tryScheduleLanding;

    const resizeMap = () => {
      if (mapRef.current) {
        mapRef.current.resize();
        applyOverlayPadding();
      }
    };

    let ipFallbackTimer: ReturnType<typeof setTimeout> | null = null;
    let resizeDebounceId: ReturnType<typeof setTimeout> | null = null;
    const scheduleResize = () => {
      if (resizeDebounceId) clearTimeout(resizeDebounceId);
      resizeDebounceId = setTimeout(() => {
        resizeMap();
        resizeDebounceId = null;
      }, 120);
    };

    const initMap = () => {
      if (cancelled || mapRef.current) return;
      if (wrapper.clientWidth < 2 || wrapper.clientHeight < 2) return;

      const initialCamera = isMobilePeek ? MOBILE_PEEK_CAMERA : GLOBE_INTRO;

      map = new maplibregl.Map({
        container: el,
        style: buildCartoStyle(),
        center: initialCamera.center,
        transformRequest: (url, resourceType) => {
          if (resourceType === 'Tile' && isExternalMapTileUrl(url)) {
            return { url, credentials: 'omit' };
          }
          return { url };
        },
        zoom: initialCamera.zoom,
        pitch: initialCamera.pitch,
        bearing: initialCamera.bearing,
        minZoom: 1,
        maxZoom: isMobilePeek ? 4 : 12,
        maxPitch: isMobilePeek ? 0 : HERO_CAMERA.maxPitch,
        pitchWithRotate: false,
        touchPitch: false,
        dragPan: !isMobilePeek,
        scrollZoom: false,
        boxZoom: false,
        dragRotate: false,
        keyboard: false,
        doubleClickZoom: false,
        touchZoomRotate: false,
        attributionControl: false,
        antialias: false,
        fadeDuration: 0,
      });

      map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-left');
      if (!isMobilePeek) {
        map.addControl(
          new maplibregl.NavigationControl({ visualizePitch: true, showCompass: false }),
          'top-right',
        );
      }

      mapRef.current = map;
      scheduleResize();

      const onStyleReady = () => {
        if (cancelled || mapRef.current !== map || !map) return;
        if (isMobilePeek) {
          applyRegionalProjection(map);
          return;
        }
        try {
          map.setProjection({ type: 'globe' });
        } catch (err) {
          console.error('[ExpertsAreaMap] Proyección globe:', err);
        }
      };

      const onMapReady = () => {
        if (mapReadyHandled || cancelled || mapRef.current !== map || !map) return;
        mapReadyHandled = true;
        onStyleReady();
        scheduleResize();
        applyOverlayPadding();
        try {
          ensureLandFillLayer(map);
          landFillLoadedRef.current = true;
          map.triggerRepaint();
        } catch (err) {
          console.error('[ExpertsAreaMap] Capa de relleno tierra:', err);
        }
        setMapReady(true);
        if (isMobilePeek) {
          map.jumpTo({
            center: MOBILE_PEEK_CAMERA.center,
            zoom: MOBILE_PEEK_CAMERA.zoom,
            pitch: MOBILE_PEEK_CAMERA.pitch,
            bearing: MOBILE_PEEK_CAMERA.bearing,
          });
          setIntroComplete(true);
          repaintWhenTilesReady(map);
          return;
        }
        tryScheduleLanding();
        if (!ipLandingResolvedRef.current) {
          ipFallbackTimer = window.setTimeout(() => {
            if (!landingStartedRef.current && !cancelled && mapRef.current === map) {
              ipLandingResolvedRef.current = true;
              tryScheduleLanding();
            }
          }, IP_RESOLVE_FALLBACK_MS);
        }
        repaintWhenTilesReady(map);
      };

      map.once('style.load', onStyleReady);
      map.on('load', onMapReady);

      // Estilo inline: style.load/load pueden dispararse antes de registrar listeners
      if (map.isStyleLoaded()) onStyleReady();
      if (map.loaded()) onMapReady();

      map.on('error', (e) => {
        console.error('[ExpertsAreaMap] MapLibre error:', e.error?.message ?? e);
      });
    };

    let initAttempts = 0;
    const maxInitAttempts = 120;

    const tryInit = () => {
      initMap();
      if (!mapRef.current && initAttempts < maxInitAttempts) {
        initAttempts += 1;
        requestAnimationFrame(tryInit);
      } else if (!mapRef.current && initAttempts >= maxInitAttempts) {
        setMapLoadFailed(true);
      }
    };

    ro = new ResizeObserver(() => {
      if (!mapRef.current) {
        tryInit();
      } else {
        scheduleResize();
      }
    });
    ro.observe(wrapper);
    window.addEventListener('resize', scheduleResize, { passive: true });

    tryInit();

    return () => {
      cancelled = true;
      tryScheduleLandingRef.current = null;
      if (landingTimerRef.current) clearTimeout(landingTimerRef.current);
      if (ipFallbackTimer) clearTimeout(ipFallbackTimer);
      landingStartedRef.current = false;
      if (resizeDebounceId) clearTimeout(resizeDebounceId);
      ro?.disconnect();
      window.removeEventListener('resize', scheduleResize);
      markersRef.current.forEach((m) => m.remove());
      markersRef.current.clear();
      clearSparkleMarkers();
      map?.remove();
      mapRef.current = null;
      setMapReady(false);
      setIntroComplete(false);
      setMapLoadFailed(false);
      landFillLoadedRef.current = false;
      outlinesLoadedRef.current = false;
    };
  }, [heroVariant, overlayPaddingRatio]);

  // Relleno tierra en cuanto el estilo está listo (no esperar al vuelo)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || landFillLoadedRef.current) return;
    try {
      ensureLandFillLayer(map);
      landFillLoadedRef.current = true;
      map.triggerRepaint();
    } catch (err) {
      console.error('[ExpertsAreaMap] Capa de relleno tierra:', err);
    }
  }, [mapReady]);

  // Contornos costeros — en cuanto el mapa está listo (no esperar al vuelo)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || outlinesLoadedRef.current) return;

    try {
      addGlobalOutlineLayers(map);
      outlinesLoadedRef.current = true;
      map.triggerRepaint();
    } catch (err) {
      console.error('[ExpertsAreaMap] No se pudieron cargar contornos globales:', err);
    }
  }, [mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !introComplete) return;
    repaintWhenTilesReady(map);
  }, [introComplete]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    if (!showCityMarkers) {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current.clear();
      return;
    }

    if (markersRef.current.size === 0) {
      CITY_EXPERTS.forEach((city) => {
        const el = document.createElement('div');
        if (onCityClick) {
          el.addEventListener('click', (e) => {
            e.stopPropagation();
            handleCityClick(city);
          });
        }
        el.addEventListener('mouseenter', () => setHovered(city.name));
        el.addEventListener('mouseleave', () =>
          setHovered((h) => (h === city.name ? null : h)),
        );

        const marker = new maplibregl.Marker({
          element: el,
          anchor: 'center',
          opacityWhenCovered: 0,
        })
          .setLngLat([city.lng, city.lat])
          .addTo(map);

        markersRef.current.set(city.name, marker);
      });
    }
  }, [handleCityClick, mapReady, onCityClick, showCityMarkers]);

  useEffect(() => {
    if (!mapReady) return;
    const clickable = Boolean(onCityClick);
    CITY_EXPERTS.forEach((city) => {
      const marker = markersRef.current.get(city.name);
      if (!marker) return;
      const selected = clickable && selectedCity === city.name;
      const isHovered = hovered === city.name;
      marker.getElement().innerHTML = markerHtml(city, selected, isHovered, clickable);
    });
  }, [hovered, selectedCity, mapReady, onCityClick]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !showExpertSparkles) {
      clearSparkleMarkers();
      return;
    }

    // 🌍 Antes saltábamos la creación durante el globo porque MapLibre proyecta
    // hubs del lado oculto en píxeles válidos del canvas (no clipa back-face),
    // así que se veían fantasmas. Ahora `isSparkleOnScreen` aplica culling de
    // hemisferio en `updateSparkleVisibility` y el marker queda con display:none
    // cuando está al otro lado del planeta → se pueden crear de entrada y la
    // visibilidad se reevalúa en cada `move`/`render` del intro del globo.

    clearSparkleMarkers();

    sparkleHubs.forEach((hub, index) => {
      const palette = EXPERT_SPARKLE_PALETTES[index % EXPERT_SPARKLE_PALETTES.length];
      const wrapper = document.createElement('div');
      wrapper.innerHTML = expertSparkleMarkerHtml(palette, index, hub.weight, sparkleTwinkle);
      const el = wrapper.firstElementChild as HTMLElement | null;
      if (!el) return;

      const marker = new maplibregl.Marker({
        element: el,
        anchor: 'center',
        opacityWhenCovered: 0,
      })
        .setLngLat([hub.lng, hub.lat])
        .addTo(map);

      sparkleMarkersRef.current.set(hub.id, marker);
    });

    updateSparkleVisibility();
  }, [
    mapReady,
    showExpertSparkles,
    // 🌍 introComplete eliminado: los marcadores ya se crean también durante el
    // globe intro (la visibilidad por hemisferio la maneja updateSparkleVisibility).
    sparkleHubs,
    sparkleTwinkle,
    clearSparkleMarkers,
    updateSparkleVisibility,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !showExpertSparkles) return;

    const onFrame = () => updateSparkleVisibility();

    updateSparkleVisibility();
    map.on('move', onFrame);
    map.on('zoom', onFrame);
    map.on('moveend', onFrame);
    map.on('render', onFrame);

    return () => {
      map.off('move', onFrame);
      map.off('zoom', onFrame);
      map.off('moveend', onFrame);
      map.off('render', onFrame);
    };
  }, [mapReady, showExpertSparkles, updateSparkleVisibility]);

  return (
    <div
      ref={wrapperRef}
      className={`relative h-full w-full overflow-hidden bg-[#dce9f2] ${className}`.trim()}
    >
      <div ref={containerRef} className="absolute inset-0 h-full w-full" />

      {/* Velo muy suave — no tapar contornos costeros */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          background:
            'linear-gradient(to top, rgba(255,255,255,0.12) 0%, transparent 18%)',
        }}
      />

      {mapLoadFailed && (
        <div className="absolute inset-0 z-[2] flex items-center justify-center bg-[#e8f0f7] pointer-events-none">
          <p className="text-xs text-[#64748b] px-4 text-center">
            El mapa no pudo cargarse. Recarga la página o comprueba tu conexión.
          </p>
        </div>
      )}

      {detectedCountryCode && introComplete && !isMobilePeek && (
        <div className="absolute bottom-3 left-3 z-[500] flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 border border-[#e5e7eb] text-[11px] font-medium text-[#475569] shadow-sm pointer-events-none select-none">
              <MapPin size={12} className="text-brand" />
          Tu zona
        </div>
      )}

      {!hideCornerStats && (
        <div className="absolute bottom-3 right-3 z-[500] px-2.5 py-1 rounded-full bg-white/90 border border-[#e5e7eb] text-[11px] text-[#6b7280] shadow-sm pointer-events-none select-none">
          <span className="font-semibold text-[#475569]">{CITY_EXPERTS.length} ciudades</span>
          <span className="mx-1.5 text-[#cbd5e1]">·</span>
          <span>{totalExperts} expertos</span>
        </div>
      )}

      <style>{`
        .maplibregl-canvas-container.maplibregl-interactive,
        .maplibregl-canvas-container.maplibregl-interactive .maplibregl-canvas {
          cursor: grab !important;
        }
        .maplibregl-canvas-container.maplibregl-interactive:active .maplibregl-canvas {
          cursor: grabbing !important;
        }
        .maplibregl-ctrl-attribution {
          font-size: 9px !important;
          background: rgba(255,255,255,0.82) !important;
          color: #94a3b8 !important;
        }
        .maplibregl-ctrl-attribution a { color: #64748b !important; }
        .maplibregl-ctrl-group {
          border: none !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08) !important;
        }
        .maplibregl-ctrl-group button { color: #334155 !important; }
        .maplibregl-marker-covered {
          visibility: hidden !important;
          pointer-events: none !important;
        }
      `}</style>
    </div>
  );
};

export default ExpertsAreaMap;
