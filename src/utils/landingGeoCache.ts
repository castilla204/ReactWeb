import type { MapLandingFromIp } from './detectCountryFromIpClient';

const STORAGE_KEY = 'landing-geo-v1';
const TTL_MS = 24 * 60 * 60_000;

interface CachedLandingGeo {
  data: MapLandingFromIp;
  ts: number;
}

export function readLandingGeoCache(): MapLandingFromIp | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as CachedLandingGeo;
    if (!parsed?.data?.countryCode || Date.now() - parsed.ts > TTL_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return parsed.data;
  } catch {
    return null;
  }
}

export function writeLandingGeoCache(data: MapLandingFromIp): void {
  if (typeof window === 'undefined') return;

  try {
    const payload: CachedLandingGeo = { data, ts: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // localStorage lleno o modo privado
  }
}
