import { getCountryCoordinates } from './countryCoordinates';

export interface MapLandingFromIp {
  center: [number, number];
  zoom: number;
  countryCode: string;
}

const FALLBACK: MapLandingFromIp = {
  center: [-4.0, 39.6],
  zoom: 4.35,
  countryCode: 'ES',
};

/** ipapi.co — HTTPS + CORS desde navegador (~100–300 ms). */
const IPAPI_URL = 'https://ipapi.co/json/';

interface IpApiResponse {
  country_code?: string;
  latitude?: number;
  longitude?: number;
  error?: boolean;
  reason?: string;
}

export function landingFromCountryCode(countryCode: string | null | undefined): MapLandingFromIp {
  if (!countryCode) return FALLBACK;

  const code = countryCode.toUpperCase();
  const coords = getCountryCoordinates(code);
  if (!coords) return FALLBACK;

  return {
    center: [coords.lng, coords.lat],
    zoom: coords.zoom,
    countryCode: code,
  };
}

/** Heurística instantánea: es-AR → AR, en-US → US */
export function landingFromNavigatorLanguage(): MapLandingFromIp {
  if (typeof navigator === 'undefined') return FALLBACK;

  const region = navigator.language?.split('-')[1];
  if (region) {
    const guess = landingFromCountryCode(region.toUpperCase());
    if (guess.countryCode !== 'ES' || region.toUpperCase() === 'ES') {
      return guess;
    }
  }

  return FALLBACK;
}

export async function fetchCountryFromIpBackend(
  signal?: AbortSignal,
): Promise<MapLandingFromIp> {
  const { capacitorFetch } = await import('./capacitorFetch');
  const { API_CONFIG } = await import('../config/api');

  const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.expert.services.detectedCountryFromIp}`;
  const response = await capacitorFetch(url, {
    signal,
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`detected-country-from-ip ${response.status}`);
  }

  const data = (await response.json()) as {
    countryCode?: string;
    latitude?: number;
    longitude?: number;
  };

  const code = data.countryCode?.toUpperCase() ?? 'ES';
  const coords = getCountryCoordinates(code);

  return {
    center: [
      typeof data.longitude === 'number' ? data.longitude : (coords?.lng ?? FALLBACK.center[0]),
      typeof data.latitude === 'number' ? data.latitude : (coords?.lat ?? FALLBACK.center[1]),
    ],
    zoom: coords?.zoom ?? FALLBACK.zoom,
    countryCode: code,
  };
}

export async function fetchCountryFromIpClient(
  signal?: AbortSignal,
): Promise<MapLandingFromIp> {
  const response = await fetch(IPAPI_URL, {
    signal,
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`ipapi.co ${response.status}`);
  }

  const data = (await response.json()) as IpApiResponse;

  if (data.error) {
    throw new Error(data.reason ?? 'ipapi.co error');
  }

  const code = data.country_code?.toUpperCase();
  const coords = getCountryCoordinates(code);

  if (!code || !coords) {
    return FALLBACK;
  }

  return {
    center: [
      typeof data.longitude === 'number' ? data.longitude : coords.lng,
      typeof data.latitude === 'number' ? data.latitude : coords.lat,
    ],
    zoom: coords.zoom,
    countryCode: code,
  };
}
