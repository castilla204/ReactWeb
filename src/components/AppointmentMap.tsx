import React, { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { capMapWorkers } from '../lib/mapWorkers';
capMapWorkers(mapboxgl);
import CountrySelector from './CountrySelector';
import {
  searchMapboxAutocomplete,
  reverseGeocodeMapbox,
  getMapboxAccessToken,
  isMapboxTokenConfigured,
  MapboxAutocompleteItem,
} from '../utils/mapboxGeocoding';
import { buildNeutralCheckoutMapStyle, MAP_CANON } from '../utils/inspeccionoMapStyle';
import { buildInkDotElement, buildInkPinElement } from '../utils/mapMarkers';
import { boundsFromCircle } from '../utils/geoCircle';

interface AppointmentMapProps {
  onLocationSelect?: (location: {
    address: string;
    latitude: number;
    longitude: number;
  }) => void;
  initialLocation?: {
    latitude: number;
    longitude: number;
  };
  disabled?: boolean;
  expertLocation?: {
    latitude: number;
    longitude: number;
  } | null;
  expertRange?: number | null;
  latitude?: number;
  longitude?: number;
  address?: string;
  className?: string;
  radius?: number;
  service?: any;
  expertCountry?: string | null;
  showSearch?: boolean;
  showCountrySelector?: boolean;
  showExpertMarker?: boolean;
  defaultZoom?: number;
  /** Sin borde ni esquinas redondeadas (checkout móvil edge-to-edge). */
  frameless?: boolean;
  /** Buscador flotante minimalista sobre el mapa. */
  searchMinimal?: boolean;
  /** Posición del buscador flotante (p. ej. bajo stepper superpuesto). */
  searchOverlayClassName?: string;
  /** Anillo canónico en ambos modos. `minimal` (checkout): solo contorno discontinuo.
   *  `default` (elegir punto en coordinación): añade atenuación neutra fuera del radio. */
  coverageStyle?: 'default' | 'minimal';
  /** Dirección fuera del radio de cobertura (p. ej. búsqueda). */
  onLocationRejected?: (info: { reason: 'out_of_range'; address: string }) => void;
  /** Usuario borra la búsqueda / ubicación elegida. */
  onLocationClear?: () => void;
  /** Vista referencia checkout (Coordínalo Inspecciono): zoom más abierto para ver la zona. */
  referencePreview?: boolean;
  /** Búsqueda externa (cabecera del wizard): recentra mapa y coloca marcador sin overlay. */
  externalAddressPick?: {
    address: string;
    latitude: number;
    longitude: number;
    nonce: number;
  } | null;
  /** Padding al encuadrar el radio de cobertura (checkout móvil con chrome superior/inferior). */
  boundsPadding?: number | { top: number; bottom: number; left: number; right: number };
}

// ============================================================================
// Helpers (haversine + circle polygon)
// ============================================================================

const EARTH_RADIUS_KM = 6371;

/**
 * Distancia haversine entre dos puntos lat/lng en kilómetros.
 */
const haversineDistanceKm = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number => {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
};

/**
 * Construye un anillo de coordenadas [lng,lat] aproximando un círculo geodésico.
 * Devuelve `steps + 1` puntos cerrando el polígono.
 */
const buildCirclePolygon = (
  centerLng: number,
  centerLat: number,
  radiusKm: number,
  steps = 96,
): Array<[number, number]> => {
  const coords: Array<[number, number]> = [];
  const distanceX =
    radiusKm / (EARTH_RADIUS_KM * Math.cos((centerLat * Math.PI) / 180)) * (180 / Math.PI);
  const distanceY = (radiusKm / EARTH_RADIUS_KM) * (180 / Math.PI);

  for (let i = 0; i < steps; i++) {
    const theta = (i / steps) * (2 * Math.PI);
    const x = distanceX * Math.cos(theta);
    const y = distanceY * Math.sin(theta);
    coords.push([centerLng + x, centerLat + y]);
  }
  // Cerrar el anillo
  coords.push(coords[0]);
  return coords;
};

// ============================================================================
// Sources/layers ids constants (para referenciarlos en cleanup/update)
// ============================================================================

const SRC_CIRCLE = 'appt-circle-src';
const SRC_MASK = 'appt-mask-src';
const LAYER_CIRCLE_FILL = 'appt-circle-fill';
const LAYER_CIRCLE_LINE = 'appt-circle-line';
const LAYER_MASK_FILL = 'appt-mask-fill';

// Marcadores canónicos tinta (buildInkDotElement / buildInkPinElement) — ver utils/mapMarkers.

// ============================================================================
// Component
// ============================================================================

const AppointmentMap: React.FC<AppointmentMapProps> = ({
  latitude,
  longitude,
  address: _address = 'Ubicación del servicio',
  className = 'w-full h-64',
  radius,
  service,
  expertLocation,
  expertRange,
  onLocationSelect,
  initialLocation,
  expertCountry,
  disabled = false,
  showSearch = true,
  showCountrySelector = true,
  showExpertMarker = true,
  defaultZoom = 10,
  frameless = false,
  searchMinimal = false,
  searchOverlayClassName,
  coverageStyle = 'default',
  referencePreview = false,
  onLocationRejected,
  onLocationClear,
  externalAddressPick = null,
  boundsPadding,
}) => {
  const isMinimalCoverage = coverageStyle === 'minimal';
  const searchInputRef = useRef<HTMLInputElement>(null);
  /** Tras elegir dirección, no reabrir autocomplete hasta que el usuario edite. */
  const committedQueryRef = useRef<string | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const expertMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const selectedMarkerRef = useRef<mapboxgl.Marker | null>(null);

  const [selectedCountry, setSelectedCountry] = useState<string | null>(expertCountry || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [autocompleteResults, setAutocompleteResults] = useState<MapboxAutocompleteItem[]>([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismissAutocomplete = () => {
    setShowAutocomplete(false);
    setAutocompleteResults([]);
  };

  const commitSearchQuery = (query: string) => {
    committedQueryRef.current = query;
    setSearchQuery(query);
    dismissAutocomplete();
    searchInputRef.current?.blur();
  };

  // ---------------------------------------------------------------------------
  // Coordenadas / props normalizadas
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (expertCountry) setSelectedCountry(expertCountry);
  }, [expertCountry]);

  const getCoordinates = () => {
    const toValidNumber = (value: any): number | null => {
      if (value === null || value === undefined) return null;
      const num = typeof value === 'string' ? parseFloat(value) : Number(value);
      return typeof num === 'number' && !isNaN(num) && isFinite(num) ? num : null;
    };

    if (expertLocation) {
      const lat = toValidNumber(expertLocation.latitude);
      const lng = toValidNumber(expertLocation.longitude);
      if (lat !== null && lng !== null) {
        const range = toValidNumber(expertRange);
        return { lat, lng, radius: range !== null ? range : 25 };
      }
    }

    if (service?.searchHire?.service) {
      const serviceData = service.searchHire.service;
      const lat = toValidNumber(serviceData.expertLatitude);
      const lng = toValidNumber(serviceData.expertLongitude);
      if (lat !== null && lng !== null) {
        const range = toValidNumber(serviceData.locationRange);
        return { lat, lng, radius: range !== null ? range : 25 };
      }
    }

    if (initialLocation) {
      const lat = toValidNumber(initialLocation.latitude);
      const lng = toValidNumber(initialLocation.longitude);
      if (lat !== null && lng !== null) {
        const range = toValidNumber(radius);
        return { lat, lng, radius: range !== null ? range : 500 };
      }
    }

    const defaultLat = toValidNumber(latitude) ?? 40.4168;
    const defaultLng = toValidNumber(longitude) ?? -3.7038;
    const defaultRadius = toValidNumber(radius) ?? 500;
    return { lat: defaultLat, lng: defaultLng, radius: defaultRadius };
  };

  const memoizedCoordinates = React.useMemo(
    () => getCoordinates(),
    [
      expertLocation?.latitude,
      expertLocation?.longitude,
      expertRange,
      initialLocation?.latitude,
      initialLocation?.longitude,
      service,
      latitude,
      longitude,
      radius,
    ],
  );

  // ---------------------------------------------------------------------------
  // Inicialización del mapa (una sola vez)
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!mapContainerRef.current) return;

    let token: string;
    try {
      token = getMapboxAccessToken();
    } catch {
      setMapError('Falta configurar VITE_MAPBOX_PUBLIC_TOKEN en .env.local');
      return;
    }

    if (!isMapboxTokenConfigured(token)) {
      setMapError(
        'Token de Mapbox no configurado. Sustituye el placeholder en ReactWeb/.env.local y reinicia npm run dev.',
      );
      return;
    }

    if (!isFinite(memoizedCoordinates.lat) || !isFinite(memoizedCoordinates.lng)) {
      setMapError('Coordenadas del experto no válidas.');
      console.error('[AppointmentMap] Coordenadas inválidas:', memoizedCoordinates);
      return;
    }

    setMapError(null);
    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      // Estilo canónico único (Voyager con etiquetas + tratamiento compartido).
      style: buildNeutralCheckoutMapStyle() as any,
      center: [memoizedCoordinates.lng, memoizedCoordinates.lat],
      zoom: defaultZoom,
      minZoom: 3,
      maxZoom: 20,
      interactive: !disabled || referencePreview,
      attributionControl: !isMinimalCoverage,
    });

    mapRef.current = map;

    const resizeMap = () => {
      try {
        map.resize();
      } catch {
        /* ignore */
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      resizeMap();
    });
    resizeObserver.observe(mapContainerRef.current);
    requestAnimationFrame(resizeMap);

    map.on('error', (e) => {
      console.error('[AppointmentMap] Error del mapa:', e);
      setMapError(
        'No se pudieron cargar los tiles del mapa. Revisa el token de Mapbox y la política CSP (tiles.mapbox.com).',
      );
    });

    map.on('load', () => {
      resizeMap();
      // radius === 0: el experto atiende solo en su taller (punto fijo) → no hay zona
      // elegible que dibujar: ni círculo ni máscara, solo el marcador del taller.
      if (memoizedCoordinates.radius > 0) {
      const circleRing = buildCirclePolygon(
        memoizedCoordinates.lng,
        memoizedCoordinates.lat,
        memoizedCoordinates.radius,
      );

      map.addSource(SRC_CIRCLE, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [circleRing],
          },
        },
      });

      // Cobertura canónica ÚNICA (todos los flujos): anillo discontinuo neutro.
      // En preview (paso 2 checkout) va más fino, con trazo corto y lavado suave dentro.
      if (referencePreview) {
        map.addLayer({
          id: LAYER_CIRCLE_FILL,
          type: 'fill',
          source: SRC_CIRCLE,
          paint: {
            'fill-color': MAP_CANON.ringFill,
            'fill-opacity': 0.06,
          },
        });
      }
      map.addLayer({
        id: LAYER_CIRCLE_LINE,
        type: 'line',
        source: SRC_CIRCLE,
        paint: {
          // Anillo neutro (negro translúcido) — cohesiona con el pin tinta sobre el
          // mapa a color, sin verdes/azules que compitan con la base Voyager.
          'line-color': referencePreview ? 'rgba(23, 23, 23, 0.45)' : MAP_CANON.ring,
          'line-width': referencePreview ? 1.75 : MAP_CANON.ringWidth,
          'line-dasharray': referencePreview ? [2, 2.5] : MAP_CANON.ringDash,
        },
      });

      if (!isMinimalCoverage) {
        // Flujos donde se ELIGE punto sobre el mapa (coordinación de cita): atenuación
        // sutil de la zona no elegible. Sustituye a la máscara roja del estilo antiguo —
        // misma información, lenguaje neutro canónico.
        const worldRing: Array<[number, number]> = [
          [-180, -85],
          [180, -85],
          [180, 85],
          [-180, 85],
          [-180, -85],
        ];

        map.addSource(SRC_MASK, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Polygon',
              coordinates: [worldRing, circleRing],
            },
          },
        });

        map.addLayer(
          {
            id: LAYER_MASK_FILL,
            type: 'fill',
            source: SRC_MASK,
            paint: {
              'fill-color': MAP_CANON.maskFill,
              'fill-opacity': MAP_CANON.maskFillOpacity,
            },
          },
          LAYER_CIRCLE_LINE,
        );
      }
      } // fin if (radius > 0)

      if (isMinimalCoverage && memoizedCoordinates.radius > 0) {
        // Encuadre AJUSTADO al rango del experto (círculo de cobertura), no a toda
        // España. Un +12% de margen deja que el círculo respire sin tocar los bordes.
        // Antes referencePreview usaba radius×2.8 + maxZoom 9.5 → se veía medio país.
        const fitRadiusKm = memoizedCoordinates.radius * 1.12;
        const [[minLng, minLat], [maxLng, maxLat]] = boundsFromCircle(
          memoizedCoordinates.lng,
          memoizedCoordinates.lat,
          fitRadiusKm,
        );
        map.fitBounds(
          [
            [minLng, minLat],
            [maxLng, maxLat],
          ],
          {
            padding: boundsPadding ?? (referencePreview ? 44 : 48),
            duration: 0,
            maxZoom: 13,
          },
        );
      } else if (referencePreview && memoizedCoordinates.radius <= 0) {
        map.setZoom(Math.min(defaultZoom, 11));
      }

      // 3) Marker del experto
      if (
        showExpertMarker &&
        isFinite(memoizedCoordinates.lat) &&
        isFinite(memoizedCoordinates.lng)
      ) {
        const expertEl = buildInkDotElement(12);
        expertMarkerRef.current = new mapboxgl.Marker({
          element: expertEl,
          anchor: 'center',
        })
          .setLngLat([memoizedCoordinates.lng, memoizedCoordinates.lat])
          .addTo(map);
      }

      // 4) Marcador de ubicación inicial (si se pasó)
      if (initialLocation && !disabled) {
        const initLat = Number(initialLocation.latitude);
        const initLng = Number(initialLocation.longitude);
        if (isFinite(initLat) && isFinite(initLng)) {
          const el = buildInkPinElement();
          selectedMarkerRef.current = new mapboxgl.Marker({
            element: el,
            anchor: 'center',
          })
            .setLngLat([initLng, initLat])
            .addTo(map);
        }
      }
    });

    // 5) Click handler con reverse geocoding
    const handleClick = async (e: mapboxgl.MapMouseEvent) => {
      if (disabled || referencePreview || !onLocationSelect) return;

      dismissAutocomplete();

      const clickedLat = e.lngLat.lat;
      const clickedLng = e.lngLat.lng;

      // Validar que esté dentro del rango (haversine)
      const distanceKm = haversineDistanceKm(
        memoizedCoordinates.lat,
        memoizedCoordinates.lng,
        clickedLat,
        clickedLng,
      );

      if (distanceKm > memoizedCoordinates.radius) {
        // Fuera del rango: no hacer nada
        return;
      }

      // Crear/mover marcador seleccionado
      if (selectedMarkerRef.current) {
        selectedMarkerRef.current.setLngLat([clickedLng, clickedLat]);
      } else {
        const el = buildInkPinElement();
        selectedMarkerRef.current = new mapboxgl.Marker({
          element: el,
          anchor: 'center',
        })
          .setLngLat([clickedLng, clickedLat])
          .addTo(map);
      }

      // Reverse geocoding
      let resolvedAddress = `Ubicación: ${clickedLat.toFixed(6)}, ${clickedLng.toFixed(6)}`;
      try {
        const result = await reverseGeocodeMapbox(clickedLat, clickedLng, {
          accessToken: token,
          language: 'es',
        });
        if (result?.address) {
          resolvedAddress = result.address;
        }
      } catch (err) {
        console.warn('[AppointmentMap] Reverse geocoding falló:', err);
      }

      onLocationSelect({
        address: resolvedAddress,
        latitude: clickedLat,
        longitude: clickedLng,
      });
      commitSearchQuery(resolvedAddress);
    };

    if (!disabled && !referencePreview && onLocationSelect) {
      map.on('click', handleClick);
    }

    // Cleanup: destruir el mapa entero (markers se limpian con él)
    return () => {
      resizeObserver.disconnect();
      map.off('click', handleClick);
      try {
        map.remove();
      } catch (err) {
        console.warn('[AppointmentMap] Error al destruir el mapa:', err);
      }
      mapRef.current = null;
      expertMarkerRef.current = null;
      selectedMarkerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    memoizedCoordinates.lat,
    memoizedCoordinates.lng,
    memoizedCoordinates.radius,
    defaultZoom,
    disabled,
    showExpertMarker,
    coverageStyle,
    referencePreview,
  ]);

  // ---------------------------------------------------------------------------
  // Autocomplete (Mapbox)
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!showSearch) return;
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    const query = searchQuery.trim();
    if (query.length < 3) {
      committedQueryRef.current = null;
      setAutocompleteResults([]);
      setShowAutocomplete(false);
      setSearchError(null);
      return;
    }

    if (query === committedQueryRef.current) {
      dismissAutocomplete();
      return;
    }

    searchDebounceRef.current = setTimeout(async () => {
      try {
        setSearchError(null);
        const results = await searchMapboxAutocomplete(query, {
          language: 'es',
          country: selectedCountry || undefined,
          proximity: {
            lat: memoizedCoordinates.lat,
            lng: memoizedCoordinates.lng,
          },
        });
        setAutocompleteResults(results);
        setShowAutocomplete(results.length > 0);
      } catch (err: any) {
        console.warn('[AppointmentMap] Autocomplete falló:', err);
        setSearchError(err?.message || 'Error en la búsqueda');
        setAutocompleteResults([]);
        setShowAutocomplete(false);
      }
    }, 300);

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchQuery, showSearch, selectedCountry, memoizedCoordinates.lat, memoizedCoordinates.lng]);

  const handleAutocompleteSelect = (item: MapboxAutocompleteItem) => {
    commitSearchQuery(item.address);

    const map = mapRef.current;
    if (!map) return;

    map.flyTo({ center: [item.lng, item.lat], zoom: 15 });

    if (!disabled) {
      if (selectedMarkerRef.current) {
        selectedMarkerRef.current.setLngLat([item.lng, item.lat]);
      } else {
        const el = buildInkPinElement();
        selectedMarkerRef.current = new mapboxgl.Marker({
          element: el,
          anchor: 'center',
        })
          .setLngLat([item.lng, item.lat])
          .addTo(map);
      }
    }

    const distanceKm = haversineDistanceKm(
      memoizedCoordinates.lat,
      memoizedCoordinates.lng,
      item.lat,
      item.lng,
    );

    if (onLocationSelect && distanceKm <= memoizedCoordinates.radius) {
      onLocationSelect({
        address: item.address,
        latitude: item.lat,
        longitude: item.lng,
      });
    } else if (distanceKm > memoizedCoordinates.radius) {
      onLocationRejected?.({ reason: 'out_of_range', address: item.address });
    }
  };

  const applyExternalAddressPick = (pick: {
    address: string;
    latitude: number;
    longitude: number;
  }) => {
    const map = mapRef.current;
    if (!map) return;

    map.flyTo({ center: [pick.longitude, pick.latitude], zoom: 15 });

    if (!disabled) {
      if (selectedMarkerRef.current) {
        selectedMarkerRef.current.setLngLat([pick.longitude, pick.latitude]);
      } else {
        const el = buildInkPinElement();
        selectedMarkerRef.current = new mapboxgl.Marker({
          element: el,
          anchor: 'center',
        })
          .setLngLat([pick.longitude, pick.latitude])
          .addTo(map);
      }
    }
  };

  useEffect(() => {
    if (!externalAddressPick) return;
    applyExternalAddressPick(externalAddressPick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalAddressPick?.nonce]);

  useEffect(() => {
    if (initialLocation?.latitude != null && initialLocation?.longitude != null) return;
    if (selectedMarkerRef.current) {
      selectedMarkerRef.current.remove();
      selectedMarkerRef.current = null;
    }
  }, [initialLocation?.latitude, initialLocation?.longitude]);

  const handleClearSearch = () => {
    committedQueryRef.current = null;
    setSearchQuery('');
    dismissAutocomplete();
    setSearchError(null);
    if (selectedMarkerRef.current) {
      selectedMarkerRef.current.remove();
      selectedMarkerRef.current = null;
    }
    onLocationClear?.();
    const map = mapRef.current;
    if (map) {
      map.flyTo({
        center: [memoizedCoordinates.lng, memoizedCoordinates.lat],
        zoom: defaultZoom,
      });
    }
    searchInputRef.current?.focus();
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const hasSearchText = searchQuery.length > 0;

  const shellCls = frameless
    ? 'relative bg-background'
    : 'relative rounded-lg border border-border bg-background';

  const mapSurfaceCls = frameless
    ? 'absolute inset-0 h-full w-full overflow-hidden'
    : 'absolute inset-0 h-full w-full overflow-hidden rounded-lg';

  const searchInputCls = searchMinimal
    ? 'w-full rounded-full border-0 bg-white/92 px-4 py-2.5 pr-10 text-sm text-ink shadow-[0_2px_14px_rgba(0,0,0,0.14)] backdrop-blur-md placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-brand/25'
    : 'w-full rounded-lg border-2 border-gray-300 bg-white/98 px-4 py-2.5 pr-10 text-sm shadow-lg backdrop-blur-md placeholder:text-gray-400 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2';

  const searchOverlayCls =
    searchOverlayClassName ??
    (searchMinimal ? 'left-3 right-3 top-3' : 'left-4 right-4 top-4');

  return (
    <div className={`${className} ${shellCls}`}>
      <div ref={mapContainerRef} className={mapSurfaceCls} />

      {mapError && (
        <div className={`absolute inset-0 z-[9998] flex items-center justify-center bg-blue-50/95 p-6 text-center ${frameless ? '' : 'rounded-lg'}`}>
          <p className="max-w-sm text-sm font-medium text-brand">{mapError}</p>
        </div>
      )}

      {(showCountrySelector || showSearch) && !mapError && (
        <div className={`absolute z-[9999] flex gap-2 pointer-events-none ${searchOverlayCls}`}>
          {showCountrySelector && (
            <div className="pointer-events-auto">
              <CountrySelector
                onCountrySelect={(countryCode, coordinates) => {
                  setSelectedCountry(countryCode);
                  if (mapRef.current) {
                    mapRef.current.flyTo({
                      center: [coordinates.lng, coordinates.lat],
                      zoom: coordinates.zoom,
                    });
                  }
                }}
                currentCountry={selectedCountry}
                className="flex-shrink-0"
              />
            </div>
          )}

          {showSearch && (
            <div className="relative flex-1 min-w-0 pointer-events-auto">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Buscar dirección..."
                className={searchInputCls}
                value={searchQuery}
                onChange={(e) => {
                  committedQueryRef.current = null;
                  setSearchQuery(e.target.value);
                }}
                onFocus={() => {
                  if (searchQuery.trim() === committedQueryRef.current) return;
                  if (autocompleteResults.length > 0) setShowAutocomplete(true);
                }}
                onBlur={() => setTimeout(() => dismissAutocomplete(), 150)}
                disabled={disabled}
              />
              {hasSearchText && !disabled ? (
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleClearSearch}
                  className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-black/[0.06] hover:text-ink-strong"
                  aria-label="Borrar búsqueda"
                >
                  <X className="h-4 w-4" strokeWidth={2.25} aria-hidden />
                </button>
              ) : (
                <Search
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
                  strokeWidth={2.25}
                  aria-hidden
                />
              )}

              {showAutocomplete && autocompleteResults.length > 0 && (
                <ul className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-72 overflow-y-auto z-[10000]">
                  {autocompleteResults.map((item) => (
                    <li
                      key={item.id}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleAutocompleteSelect(item);
                      }}
                      className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium truncate">{item.address}</div>
                      {item.locationName && item.locationName !== 'Ubicación' && (
                        <div className="text-xs text-gray-500 truncate">{item.locationName}</div>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {searchError && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-amber-50 border border-amber-200 rounded-lg shadow text-xs text-amber-800 px-3 py-1.5">
                  {searchError}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AppointmentMap;
