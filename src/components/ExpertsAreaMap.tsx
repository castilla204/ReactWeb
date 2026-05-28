import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-csp-worker?url';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapPin } from 'lucide-react';

maplibregl.setWorkerUrl(maplibreWorkerUrl);

/**
 * Mapa con perspectiva sutil (MapLibre) + tiles Carto/OSM.
 * Contornos globales de tierra/costa (Natural Earth) — app mundial, no solo España.
 */

/** Paleta clara — agua suave, costas en azul marca */
const MAP_THEME = {
  sky: '#dce9f2',
  brand: '#0066CC',
  coastLine: '#0066CC',
  coastHalo: '#ffffff',
  border: '#d1c4c6',
} as const;

/** Natural Earth 50m — más precisión costera que 110m (~2 MB, dominio público) */
const NE_GEO = {
  coastline: '/geo/ne_50m_coastline.geojson',
  borders: '/geo/ne_50m_admin_0_boundary_lines_land.geojson',
} as const;

const LINE_LAYOUT: maplibregl.LineLayerSpecification['layout'] = {
  'line-cap': 'round',
  'line-join': 'round',
};

function addGlobalOutlineLayers(map: maplibregl.Map): void {
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
      'line-opacity': 0.9,
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
      'line-opacity': 0.88,
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
      'line-opacity': 0.35,
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
const CARTO_STYLE: maplibregl.StyleSpecification = {
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

/**
 * Vista inicial: planeta completo (proyección globe).
 * @see https://maplibre.org/maplibre-gl-js/docs/examples/zoom-and-planet-size-relation-on-globe/
 */
const GLOBE_INTRO = {
  center: [0, 18] as [number, number],
  zoom: 1.25,
  pitch: 58,
  bearing: -22,
} as const;

/** Vista regional tras el vuelo desde el globo (fallback España) */
const HERO_CAMERA = {
  center: [-4.0, 39.6] as [number, number],
  zoom: 4.35,
  pitch: 28,
  bearing: 0,
  maxPitch: 60,
} as const;

const GLOBE_HOLD_MS = 100;
const LANDING_FLY_MS = 1400;
/** Menos zoom = cámara más lejos al aterrizar */
const LANDING_ZOOM_PULLBACK = 1.35;
const MIN_LANDING_ZOOM = 2.8;

const toHeroLandingZoom = (zoom: number) =>
  Math.max(MIN_LANDING_ZOOM, zoom - LANDING_ZOOM_PULLBACK);

/** Tras el vuelo: mercator pinta bien los tiles Carto; globe a zoom regional solo muestra contornos. */
const applyRegionalProjection = (map: maplibregl.Map) => {
  try {
    if (map.getProjection().type !== 'mercator') {
      map.setProjection({ type: 'mercator' });
    }
  } catch (err) {
    console.warn('[ExpertsAreaMap] Proyección mercator:', err);
  }
  map.resize();
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
      ? '0 8px 18px rgba(0,102,204,0.42)'
      : '0 4px 10px rgba(0,102,204,0.28)';

  const ring = selected
    ? `<div style="position:absolute;inset:-7px;border-radius:50%;border:3px solid rgba(0,102,204,0.35);pointer-events:none"></div>`
    : '';

  const tooltip = hovered
    ? `<div style="position:absolute;bottom:calc(100% + 8px);left:50%;transform:translateX(-50%);background:#fff;color:#222;font-size:11px;font-weight:600;padding:4px 8px;border-radius:8px;border:1px solid #e5e7eb;box-shadow:0 6px 16px rgba(15,23,42,0.12);white-space:nowrap;pointer-events:none">${city.name} · ${city.count} experto${city.count === 1 ? '' : 's'}</div>`
    : '';

  return `
    <div style="position:relative;width:${size}px;height:${size}px;transform:scale(${scale});transition:transform 150ms ease;cursor:${clickable ? 'pointer' : 'default'}">
      ${ring}
      <div style="position:absolute;inset:0;border-radius:50%;background:#fff;border:2px solid #0066CC;box-shadow:${shadow};display:flex;align-items:center;justify-content:center;color:#0066CC;font-weight:700;font-size:12px;font-family:system-ui,sans-serif">${city.count}</div>
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
}

export const ExpertsAreaMap: React.FC<ExpertsAreaMapProps> = ({
  onCityClick,
  selectedCity = null,
  className = '',
  overlayPaddingRatio = 0,
  ipLanding = null,
  ipLandingResolved = false,
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const outlinesLoadedRef = useRef(false);
  const landingStartedRef = useRef(false);
  const landingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tryScheduleLandingRef = useRef<(() => void) | null>(null);
  const ipLandingRef = useRef(ipLanding);
  const ipLandingResolvedRef = useRef(ipLandingResolved);

  const [mapReady, setMapReady] = useState(false);
  const [introComplete, setIntroComplete] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [detectedCountryCode, setDetectedCountryCode] = useState<string | null>(null);

  const totalExperts = useMemo(
    () => CITY_EXPERTS.reduce((acc, c) => acc + c.count, 0),
    [],
  );

  const handleCityClick = useCallback(
    (city: ExpertCity) => {
      onCityClick?.(city);
    },
    [onCityClick],
  );

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
      const finishIntro = () => {
        if (cancelled || mapRef.current !== targetMap) return;
        applyRegionalProjection(targetMap);
        targetMap.once('idle', () => {
          if (!cancelled && mapRef.current === targetMap) {
            targetMap.triggerRepaint();
          }
        });
        setIntroComplete(true);
      };
      const prefersReducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches;

      if (prefersReducedMotion) {
        targetMap.jumpTo({
          center,
          zoom: landingZoom,
          pitch: HERO_CAMERA.pitch,
          bearing: HERO_CAMERA.bearing,
        });
        finishIntro();
        return;
      }

      targetMap.flyTo({
        center,
        zoom: landingZoom,
        pitch: HERO_CAMERA.pitch,
        bearing: HERO_CAMERA.bearing,
        duration: LANDING_FLY_MS,
        speed: 1.1,
        curve: 1.3,
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
      landingStartedRef.current = true;
      if (landingTimerRef.current) clearTimeout(landingTimerRef.current);

      // Esperar 1–2 frames tras activar globe para que flyTo anime bien
      let frames = 0;
      const waitGlobeRender = () => {
        if (cancelled || mapRef.current !== map || !map) return;
        frames += 1;
        if (frames < 2) {
          requestAnimationFrame(waitGlobeRender);
          return;
        }
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

      map = new maplibregl.Map({
        container: el,
        style: CARTO_STYLE,
        center: GLOBE_INTRO.center,
        zoom: GLOBE_INTRO.zoom,
        pitch: GLOBE_INTRO.pitch,
        bearing: GLOBE_INTRO.bearing,
        minZoom: 1,
        maxZoom: 12,
        maxPitch: HERO_CAMERA.maxPitch,
        pitchWithRotate: false,
        touchPitch: false,
        attributionControl: false,
        antialias: false,
        fadeDuration: 0,
      });

      map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-left');
      map.addControl(
        new maplibregl.NavigationControl({ visualizePitch: true, showCompass: false }),
        'top-right',
      );

      mapRef.current = map;
      scheduleResize();

      const onStyleReady = () => {
        if (cancelled || mapRef.current !== map || !map) return;
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
        setMapReady(true);
        tryScheduleLanding();
        map.once('idle', () => {
          if (!cancelled && mapRef.current === map) {
            map.triggerRepaint();
          }
        });
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
    const maxInitAttempts = 60;

    const tryInit = () => {
      initMap();
      if (!mapRef.current && initAttempts < maxInitAttempts) {
        initAttempts += 1;
        requestAnimationFrame(tryInit);
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
      landingStartedRef.current = false;
      if (resizeDebounceId) clearTimeout(resizeDebounceId);
      ro?.disconnect();
      window.removeEventListener('resize', scheduleResize);
      markersRef.current.forEach((m) => m.remove());
      markersRef.current.clear();
      map?.remove();
      mapRef.current = null;
      setMapReady(false);
      setIntroComplete(false);
      outlinesLoadedRef.current = false;
    };
  }, [overlayPaddingRatio]);

  // Contornos Natural Earth (~2 MB) — tras el vuelo para no bloquear el arranque
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !introComplete || outlinesLoadedRef.current) return;

    try {
      if (!map.getSource('ne-coastline')) {
        addGlobalOutlineLayers(map);
        map.triggerRepaint();
      }
      outlinesLoadedRef.current = true;
    } catch (err) {
      console.error('[ExpertsAreaMap] No se pudieron cargar contornos globales:', err);
    }
  }, [mapReady, introComplete]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

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
  }, [handleCityClick, mapReady, onCityClick]);

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

  return (
    <div
      ref={wrapperRef}
      className={`relative h-full w-full overflow-hidden bg-[#dce9f2] ${className}`.trim()}
    >
      <div ref={containerRef} className="absolute inset-0 h-full w-full" />

      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          background:
            'linear-gradient(to top, rgba(255,255,255,0.12) 0%, transparent 18%)',
        }}
      />

      {detectedCountryCode && introComplete && (
        <div className="absolute bottom-3 left-3 z-[500] flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 border border-[#e5e7eb] text-[11px] font-medium text-[#475569] shadow-sm pointer-events-none select-none">
              <MapPin size={12} className="text-[#0066CC]" />
          Tu zona
        </div>
      )}

      <div className="absolute bottom-3 right-3 z-[500] px-2.5 py-1 rounded-full bg-white/90 border border-[#e5e7eb] text-[11px] text-[#6b7280] shadow-sm pointer-events-none select-none">
        <span className="font-semibold text-[#475569]">{CITY_EXPERTS.length} ciudades</span>
          <span className="mx-1.5 text-[#cbd5e1]">·</span>
          <span>{totalExperts} expertos</span>
      </div>

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
