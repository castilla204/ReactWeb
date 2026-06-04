import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import CountrySelector from './CountrySelector';
import {
  searchMapboxAutocomplete,
  reverseGeocodeMapbox,
  getMapboxAccessToken,
  isMapboxTokenConfigured,
  MapboxAutocompleteItem,
} from '../utils/mapboxGeocoding';

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

const EXPERT_MARKER_SVG = `
  <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" fill="#4B5563" stroke="#374151" stroke-width="1.5"/>
    <circle cx="12" cy="12" r="4" fill="#FFFFFF"/>
  </svg>
`;

const SELECTED_MARKER_SVG = `
  <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="14" fill="#3B82F6" stroke="#1E40AF" stroke-width="3"/>
    <circle cx="16" cy="16" r="6" fill="#FFFFFF"/>
    <circle cx="16" cy="16" r="3" fill="#3B82F6"/>
  </svg>
`;

const buildMarkerElement = (svg: string, size: number): HTMLDivElement => {
  const el = document.createElement('div');
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  el.style.cursor = 'pointer';
  el.innerHTML = svg.trim();
  return el;
};

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
}) => {
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
      style: 'mapbox://styles/mapbox/light-v11',
      center: [memoizedCoordinates.lng, memoizedCoordinates.lat],
      zoom: defaultZoom,
      minZoom: 3,
      maxZoom: 20,
      interactive: !disabled,
      attributionControl: true,
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
      // 1) Círculo de cobertura
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

      map.addLayer({
        id: LAYER_CIRCLE_FILL,
        type: 'fill',
        source: SRC_CIRCLE,
        paint: {
          'fill-color': '#F3F4F6',
          'fill-opacity': 0.15,
        },
      });

      map.addLayer({
        id: LAYER_CIRCLE_LINE,
        type: 'line',
        source: SRC_CIRCLE,
        paint: {
          'line-color': '#6B7280',
          'line-opacity': 0.4,
          'line-width': 2,
        },
      });

      // 2) Máscara invertida: polígono mundial con anillo interior = círculo
      // El segundo anillo crea un "agujero" sobre el área de cobertura.
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
            'fill-color': '#EF4444',
            'fill-opacity': 0.4,
          },
        },
        LAYER_CIRCLE_LINE, // insertar debajo de la línea del círculo
      );

      // 3) Marker del experto
      if (
        showExpertMarker &&
        isFinite(memoizedCoordinates.lat) &&
        isFinite(memoizedCoordinates.lng)
      ) {
        const expertEl = buildMarkerElement(EXPERT_MARKER_SVG, 24);
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
          const el = buildMarkerElement(SELECTED_MARKER_SVG, 32);
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
      if (disabled || !onLocationSelect) return;

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
        const el = buildMarkerElement(SELECTED_MARKER_SVG, 32);
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
    };

    if (!disabled && onLocationSelect) {
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
  ]);

  // ---------------------------------------------------------------------------
  // Autocomplete (Mapbox)
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!showSearch) return;
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    const query = searchQuery.trim();
    if (query.length < 3) {
      setAutocompleteResults([]);
      setShowAutocomplete(false);
      setSearchError(null);
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
    setSearchQuery(item.address);
    setShowAutocomplete(false);
    setAutocompleteResults([]);

    const map = mapRef.current;
    if (!map) return;

    map.flyTo({ center: [item.lng, item.lat], zoom: 15 });

    if (!disabled) {
      if (selectedMarkerRef.current) {
        selectedMarkerRef.current.setLngLat([item.lng, item.lat]);
      } else {
        const el = buildMarkerElement(SELECTED_MARKER_SVG, 32);
        selectedMarkerRef.current = new mapboxgl.Marker({
          element: el,
          anchor: 'center',
        })
          .setLngLat([item.lng, item.lat])
          .addTo(map);
      }
    }

    // Solo notificar si está dentro del rango
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
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className={`${className} rounded-lg border border-border bg-background relative`}>
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full rounded-lg overflow-hidden" />

      {mapError && (
        <div className="absolute inset-0 z-[9998] flex items-center justify-center rounded-lg bg-gray-50/95 p-6 text-center">
          <p className="max-w-sm text-sm text-red-700">{mapError}</p>
        </div>
      )}

      {(showCountrySelector || showSearch) && !mapError && (
        <div className="absolute top-4 left-4 right-4 z-[9999] flex gap-2 pointer-events-none">
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
                type="text"
                placeholder="Buscar dirección..."
                className="w-full px-4 py-2.5 pr-10 bg-white/98 backdrop-blur-md border-2 border-gray-300 rounded-lg shadow-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:border-blue-500 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => autocompleteResults.length > 0 && setShowAutocomplete(true)}
                onBlur={() => setTimeout(() => setShowAutocomplete(false), 150)}
                disabled={disabled}
              />
              <svg
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>

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
                <div className="absolute top-full left-0 right-0 mt-1 bg-red-50 border border-red-200 rounded-lg shadow text-xs text-red-700 px-3 py-1.5">
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
