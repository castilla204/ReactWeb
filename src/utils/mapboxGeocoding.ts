const MAPBOX_BASE_URL = 'https://api.mapbox.com/geocoding/v5/mapbox.places';
const DEFAULT_AUTOCOMPLETE_LIMIT = 6;
const DEFAULT_LANGUAGE = 'es';

export interface MapboxGeocodingOptions {
  accessToken?: string;
  language?: string;
  country?: string;
  proximity?: {
    lat: number;
    lng: number;
  };
}

export interface MapboxAutocompleteItem {
  id: string;
  address: string;
  locationName: string;
  countryCode: string | null;
  city: string | null;
  postalCode: string | null;
  lat: number;
  lng: number;
}

export interface MapboxReverseResult {
  address: string;
  locationName: string;
  countryCode: string | null;
  city: string | null;
  postalCode: string | null;
  lat: number;
  lng: number;
}

export interface MapboxFeature {
  id: string;
  place_name?: string;
  text?: string;
  center?: [number, number];
  context?: Array<{
    id?: string;
    text?: string;
    short_code?: string;
  }>;
}

interface MapboxResponse {
  features?: MapboxFeature[];
}

const getAccessToken = (explicitToken?: string): string => {
  const token = explicitToken || import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
  if (!token) throw new Error('Falta VITE_MAPBOX_ACCESS_TOKEN');
  return token;
};

const extractContextValue = (
  feature: MapboxFeature,
  startsWith: string,
  field: 'text' | 'short_code' = 'text',
): string | null => {
  const context = feature.context || [];
  const match = context.find((item) => item.id?.startsWith(startsWith));
  const rawValue = match?.[field];
  return rawValue ? rawValue.toString() : null;
};

export const extractCountryCodeFromMapbox = (feature: MapboxFeature | null): string | null => {
  if (!feature) return null;
  const countryCodeRaw = extractContextValue(feature, 'country.', 'short_code');
  return countryCodeRaw?.split('-')[0]?.toLowerCase() || null;
};

const buildLocationName = (city: string | null, postalCode: string | null): string => {
  if (city && postalCode) return `${city}, ${postalCode}`;
  if (city) return city;
  if (postalCode) return postalCode;
  return 'Ubicación';
};

const normalizeFeature = (feature: MapboxFeature): MapboxAutocompleteItem | null => {
  const center = feature.center;
  if (!center || center.length < 2) return null;
  const [lng, lat] = center;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const city =
    extractContextValue(feature, 'place.') ||
    extractContextValue(feature, 'locality.') ||
    extractContextValue(feature, 'district.');
  const postalCode = extractContextValue(feature, 'postcode.');
  const countryCode = extractCountryCodeFromMapbox(feature);
  const address = feature.place_name || feature.text || `${lat}, ${lng}`;

  return {
    id: feature.id,
    address,
    locationName: buildLocationName(city, postalCode),
    countryCode,
    city,
    postalCode,
    lat,
    lng,
  };
};

const buildCommonParams = (
  options: MapboxGeocodingOptions,
  accessToken: string,
): URLSearchParams => {
  const params = new URLSearchParams({
    access_token: accessToken,
    language: options.language || DEFAULT_LANGUAGE,
  });
  if (options.country) params.set('country', options.country);
  if (options.proximity) params.set('proximity', `${options.proximity.lng},${options.proximity.lat}`);
  return params;
};

export const searchMapboxAutocomplete = async (
  query: string,
  options: MapboxGeocodingOptions = {},
): Promise<MapboxAutocompleteItem[]> => {
  const normalized = query.trim();
  if (!normalized) return [];

  const accessToken = getAccessToken(options.accessToken);
  const params = buildCommonParams(options, accessToken);
  params.set('autocomplete', 'true');
  params.set('limit', String(DEFAULT_AUTOCOMPLETE_LIMIT));
  params.set('types', 'address,place,postcode,locality');

  const url = `${MAPBOX_BASE_URL}/${encodeURIComponent(normalized)}.json?${params.toString()}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Mapbox autocomplete falló (${response.status})`);

  const data = (await response.json()) as MapboxResponse;
  const features = data.features || [];
  return features.map(normalizeFeature).filter((item): item is MapboxAutocompleteItem => !!item);
};

export const reverseGeocodeMapbox = async (
  lat: number,
  lng: number,
  options: MapboxGeocodingOptions = {},
): Promise<MapboxReverseResult | null> => {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const accessToken = getAccessToken(options.accessToken);
  const params = buildCommonParams(options, accessToken);
  params.set('types', 'address,place,postcode,locality');
  params.set('limit', '1');

  const url = `${MAPBOX_BASE_URL}/${lng},${lat}.json?${params.toString()}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Mapbox reverse geocoding falló (${response.status})`);

  const data = (await response.json()) as MapboxResponse;
  const feature = data.features?.[0];
  if (!feature) return null;
  return normalizeFeature(feature);
};

export const toAppointmentLocation = (item: Pick<MapboxAutocompleteItem, 'address' | 'lat' | 'lng'>) => ({
  address: item.address,
  latitude: item.lat,
  longitude: item.lng,
});

export const toSearchParameterLocation = (
  item: Pick<MapboxAutocompleteItem, 'address' | 'locationName' | 'lat' | 'lng'>,
) => ({
  address: item.address,
  latitude: item.lat.toString(),
  longitude: item.lng.toString(),
  locationName: item.locationName,
});

