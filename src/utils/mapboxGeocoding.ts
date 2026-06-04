// Mapbox Geocoding v6 — forward + reverse + helpers.
// Compat: lee VITE_MAPBOX_PUBLIC_TOKEN con fallback a VITE_MAPBOX_ACCESS_TOKEN.
// Compat call sites: AppointmentMap (usa MapboxAutocompleteItem con address/lat/lng)
// y SearchParameterForm (lee feature.place_name del resultado reverse).

const MAPBOX_FORWARD_URL = 'https://api.mapbox.com/search/geocode/v6/forward';
const MAPBOX_REVERSE_URL = 'https://api.mapbox.com/search/geocode/v6/reverse';
const DEFAULT_AUTOCOMPLETE_LIMIT = 6;
const DEFAULT_LANGUAGE = 'es';
const DEFAULT_TYPES = 'address,place,postcode,locality,neighborhood,street';

// ---------------------------------------------------------------------------
// Tipos públicos
// ---------------------------------------------------------------------------

export interface MapboxFeatureContext {
  country?: { name?: string; country_code?: string; country_code_alpha_3?: string };
  region?: { name?: string };
  place?: { name?: string };
  locality?: { name?: string };
  postcode?: { name?: string };
  district?: { name?: string };
  neighborhood?: { name?: string };
  street?: { name?: string };
}

export interface MapboxFeatureProperties {
  name?: string;
  full_address?: string;
  place_formatted?: string;
  feature_type?: string;
  coordinates?: { latitude: number; longitude: number };
  context?: MapboxFeatureContext;
}

export interface MapboxFeature {
  id: string;
  type: 'Feature';
  properties: MapboxFeatureProperties;
  geometry: { type: 'Point'; coordinates: [number, number] };
  // --- Compat retroactiva con call sites legados (SearchParameterForm, AppointmentMap) ---
  // Estos campos se rellenan a partir de `properties` durante la normalización
  // para que el código existente que lee `feature.place_name` / `.address` siga
  // funcionando sin cambios.
  place_name?: string;
  text?: string;
  center?: [number, number];
  address?: string;
  locationName?: string;
  countryCode?: string | null;
  city?: string | null;
  postalCode?: string | null;
  lat?: number;
  lng?: number;
}

// Alias mantenido por compat: AppointmentMap importa MapboxAutocompleteItem.
export type MapboxAutocompleteItem = MapboxFeature;
// Alias mantenido por compat: la versión v5 exponía MapboxReverseResult.
export type MapboxReverseResult = MapboxFeature;

export interface MapboxGeocodingOptions {
  accessToken?: string;
  language?: string;
  country?: string;
  limit?: number;
  proximity?: { lat: number; lng: number };
  signal?: AbortSignal;
}

interface MapboxResponse {
  features?: MapboxFeature[];
}

// ---------------------------------------------------------------------------
// Token
// ---------------------------------------------------------------------------

export const getMapboxAccessToken = (explicitToken?: string): string => {
  const fromEnv =
    (import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN as string | undefined) ??
    (import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string | undefined);
  const token = explicitToken || fromEnv;
  if (!token) {
    throw new Error('Falta VITE_MAPBOX_PUBLIC_TOKEN (o VITE_MAPBOX_ACCESS_TOKEN como fallback)');
  }
  return token;
};

/** Token pk.* real configurado (no placeholder de plantilla). */
export const isMapboxTokenConfigured = (token?: string): boolean => {
  try {
    const t = token ?? getMapboxAccessToken();
    return (
      t.startsWith('pk.') &&
      !/REPLACE|YOUR_|EXAMPLE|placeholder/i.test(t) &&
      t.length > 24
    );
  } catch {
    return false;
  }
};

const getAccessToken = getMapboxAccessToken;

// ---------------------------------------------------------------------------
// Helpers de extracción
// ---------------------------------------------------------------------------

export const extractCountryCodeFromMapbox = (feature: MapboxFeature | null | undefined): string | null => {
  if (!feature) return null;
  const code = feature.properties?.context?.country?.country_code;
  if (!code) return null;
  // En v6 los country_code ya vienen en minúscula ISO 3166-1 alpha-2.
  return code.split('-')[0]?.toLowerCase() || null;
};

const extractCity = (feature: MapboxFeature): string | null => {
  const ctx = feature.properties?.context;
  return (
    ctx?.place?.name ||
    ctx?.locality?.name ||
    ctx?.district?.name ||
    ctx?.neighborhood?.name ||
    null
  );
};

const extractPostalCode = (feature: MapboxFeature): string | null => {
  return feature.properties?.context?.postcode?.name || null;
};

const buildLocationName = (city: string | null, postalCode: string | null): string => {
  if (city && postalCode) return `${city}, ${postalCode}`;
  if (city) return city;
  if (postalCode) return postalCode;
  return 'Ubicación';
};

// Rellena los campos de compat (place_name, address, lat, lng, etc.) sobre el
// MapboxFeature crudo que devuelve la API v6. Devuelve null si la geometría es
// inválida.
const decorateFeature = (raw: MapboxFeature): MapboxFeature | null => {
  const coords = raw.geometry?.coordinates;
  if (!Array.isArray(coords) || coords.length < 2) return null;
  const [lng, lat] = coords;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const props = raw.properties || ({} as MapboxFeatureProperties);
  const fullAddress = props.full_address || props.place_formatted || props.name || `${lat}, ${lng}`;
  const city = extractCity(raw);
  const postalCode = extractPostalCode(raw);
  const countryCode = extractCountryCodeFromMapbox(raw);

  return {
    ...raw,
    properties: props,
    // Aliases de compat retroactiva:
    place_name: fullAddress,
    text: props.name,
    center: [lng, lat],
    address: fullAddress,
    locationName: buildLocationName(city, postalCode),
    countryCode,
    city,
    postalCode,
    lat,
    lng,
  };
};

// ---------------------------------------------------------------------------
// HTTP
// ---------------------------------------------------------------------------

const appendCommonParams = (
  params: URLSearchParams,
  options: { language?: string; country?: string; proximity?: { lat: number; lng: number } },
): void => {
  params.set('language', options.language || DEFAULT_LANGUAGE);
  if (options.country) params.set('country', options.country);
  if (options.proximity) {
    params.set('proximity', `${options.proximity.lng},${options.proximity.lat}`);
  }
};

const performMapboxRequest = async (
  url: string,
  signal: AbortSignal | undefined,
  label: string,
): Promise<MapboxResponse> => {
  let response: Response;
  try {
    response = await fetch(url, { signal });
  } catch (err) {
    if ((err as DOMException)?.name === 'AbortError') throw err;
    throw new Error(`Mapbox ${label} falló: ${(err as Error)?.message || 'error de red'}`);
  }
  if (!response.ok) {
    throw new Error(`Mapbox ${label} falló (HTTP ${response.status})`);
  }
  return (await response.json()) as MapboxResponse;
};

// ---------------------------------------------------------------------------
// Forward geocoding (autocomplete) — v6
// ---------------------------------------------------------------------------

export const searchMapboxAutocomplete = async (
  query: string,
  options: MapboxGeocodingOptions = {},
): Promise<MapboxFeature[]> => {
  const normalized = query.trim();
  if (!normalized) return [];

  const accessToken = getAccessToken(options.accessToken);
  const params = new URLSearchParams({
    q: normalized,
    access_token: accessToken,
    autocomplete: 'true',
    limit: String(options.limit ?? DEFAULT_AUTOCOMPLETE_LIMIT),
    types: DEFAULT_TYPES,
  });
  appendCommonParams(params, options);

  const url = `${MAPBOX_FORWARD_URL}?${params.toString()}`;
  const data = await performMapboxRequest(url, options.signal, 'autocomplete');
  const features = data.features || [];
  return features
    .map(decorateFeature)
    .filter((item): item is MapboxFeature => !!item);
};

// ---------------------------------------------------------------------------
// Reverse geocoding — v6
// ---------------------------------------------------------------------------

/** Misma lógica que `TimezoneService.GetCountryFromCoordinatesAsync` (types=country). */
export const reverseCountryMapbox = async (
  lat: number,
  lng: number,
  options: MapboxGeocodingOptions = {},
): Promise<string | null> => {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const accessToken = getAccessToken(options.accessToken);
  const params = new URLSearchParams({
    longitude: String(lng),
    latitude: String(lat),
    access_token: accessToken,
    limit: '5',
    types: 'country',
  });
  appendCommonParams(params, options);

  const url = `${MAPBOX_REVERSE_URL}?${params.toString()}`;
  const data = await performMapboxRequest(url, options.signal, 'reverse country');
  for (const raw of data.features || []) {
    const code = extractCountryCodeFromMapbox(decorateFeature(raw));
    if (code) return code.toUpperCase();
  }
  return null;
};

export const reverseGeocodeMapbox = async (
  lat: number,
  lng: number,
  options: MapboxGeocodingOptions = {},
): Promise<MapboxFeature | null> => {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const accessToken = getAccessToken(options.accessToken);
  const params = new URLSearchParams({
    longitude: String(lng),
    latitude: String(lat),
    access_token: accessToken,
    limit: String(options.limit ?? 1),
    types: DEFAULT_TYPES,
  });
  appendCommonParams(params, options);

  const url = `${MAPBOX_REVERSE_URL}?${params.toString()}`;
  const data = await performMapboxRequest(url, options.signal, 'reverse geocoding');
  const feature = data.features?.[0];
  if (!feature) return null;
  return decorateFeature(feature);
};

// ---------------------------------------------------------------------------
// Adaptadores (compat con call sites legados)
// ---------------------------------------------------------------------------

export const toAppointmentLocation = (
  item: Pick<MapboxFeature, 'address' | 'lat' | 'lng'>,
) => ({
  address: item.address || '',
  latitude: item.lat ?? 0,
  longitude: item.lng ?? 0,
});

export const toSearchParameterLocation = (
  item: Pick<MapboxFeature, 'address' | 'locationName' | 'lat' | 'lng'>,
) => ({
  address: item.address || '',
  latitude: (item.lat ?? 0).toString(),
  longitude: (item.lng ?? 0).toString(),
  locationName: item.locationName || 'Ubicación',
});
