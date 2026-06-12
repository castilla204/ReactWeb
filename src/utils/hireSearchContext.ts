const HIRE_SEARCH_LOCATION_KEY = 'hireSearchLocation';

export interface HireSearchLocation {
  locationName: string;
  latitude?: string | null;
  longitude?: string | null;
}

function normalizeHireSearchLocation(raw: unknown): HireSearchLocation | null {
  if (!raw || typeof raw !== 'object') return null;
  const data = raw as Partial<HireSearchLocation>;
  const latitude =
    data.latitude != null && String(data.latitude).trim() !== ''
      ? String(data.latitude).trim()
      : null;
  const longitude =
    data.longitude != null && String(data.longitude).trim() !== ''
      ? String(data.longitude).trim()
      : null;
  const explicitName = typeof data.locationName === 'string' ? data.locationName.trim() : '';
  const locationName =
    explicitName || (latitude && longitude ? 'Ubicación seleccionada' : '');
  if (!locationName) return null;
  return { locationName, latitude, longitude };
}

export function parseHireSearchLocationFromRouteState(state: unknown): HireSearchLocation | null {
  if (!state || typeof state !== 'object') return null;
  return normalizeHireSearchLocation((state as { hireSearchLocation?: unknown }).hireSearchLocation);
}

export function persistHireSearchLocation(data: HireSearchLocation): void {
  const normalized = normalizeHireSearchLocation(data);
  if (!normalized) return;
  sessionStorage.setItem(HIRE_SEARCH_LOCATION_KEY, JSON.stringify(normalized));
}

export function readHireSearchLocation(): HireSearchLocation | null {
  try {
    const raw = sessionStorage.getItem(HIRE_SEARCH_LOCATION_KEY);
    if (!raw) return null;
    return normalizeHireSearchLocation(JSON.parse(raw));
  } catch {
    return null;
  }
}

/** Prioriza ubicación en router state y la sincroniza en sesión. */
export function resolveHireSearchLocation(routeState?: unknown): HireSearchLocation | null {
  const fromState = parseHireSearchLocationFromRouteState(routeState);
  if (fromState) {
    persistHireSearchLocation(fromState);
    return fromState;
  }
  return readHireSearchLocation();
}

export function snapshotHireSearchLocation(
  locationName: string,
  latitude?: string | null,
  longitude?: string | null,
): HireSearchLocation | null {
  return normalizeHireSearchLocation({ locationName, latitude, longitude });
}

export function buildExpertLocationLabel(expert?: {
  city?: string | null;
  country?: string | null;
  countryName?: string | null;
} | null): string | null {
  if (!expert) return null;
  const city = expert.city?.trim();
  const country = (expert.countryName ?? expert.country)?.trim();
  const parts = [city, country].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : null;
}

/** Ubicación de búsqueda en sesión/state; si no hay, zona del experto. */
export function resolveCheckoutLocation(
  routeState: unknown,
  expert?: {
    city?: string | null;
    country?: string | null;
    countryName?: string | null;
    latitude?: string | number | null;
    longitude?: string | number | null;
  } | null,
): HireSearchLocation | null {
  const fromSearch = resolveHireSearchLocation(routeState);
  if (fromSearch) return fromSearch;

  const expertLabel = buildExpertLocationLabel(expert ?? undefined);
  if (!expertLabel) return null;

  return normalizeHireSearchLocation({
    locationName: expertLabel,
    latitude: expert?.latitude != null ? String(expert.latitude) : null,
    longitude: expert?.longitude != null ? String(expert.longitude) : null,
  });
}
