import { QueryClient } from '@tanstack/react-query';
import { HomepageWallResponse } from '../types/homepageWall';
import { API_CONFIG } from '../config/api';
import { getAuthToken } from '../lib/auth';

export interface HomepageWallQueryParams {
  categoryId: number;
  latitude?: string | null;
  longitude?: string | null;
  countryCode?: string;
  locationRange?: number;
  nearbyPage?: number;
  nearbyPageSize?: number;
  popularPage?: number;
  popularPageSize?: number;
  _enabled?: boolean;
}

export function getHomepageWallQueryKey(params: HomepageWallQueryParams) {
  const normalizedLatitude = params._enabled !== false ? (params.latitude || '') : '';
  const normalizedLongitude = params._enabled !== false ? (params.longitude || '') : '';

  return [
    'homepage-wall',
    params.categoryId,
    normalizedLatitude,
    normalizedLongitude,
    params.countryCode || '',
    params.locationRange || 50,
    params.nearbyPage || 1,
    params.nearbyPageSize || 20,
    params.popularPage || 1,
    params.popularPageSize || 20,
  ] as const;
}

export async function fetchHomepageWall(
  params: HomepageWallQueryParams,
): Promise<HomepageWallResponse> {
  if (!params.categoryId) {
    throw new Error('categoryId es requerido para homepage-wall');
  }

  const queryParams = new URLSearchParams();
  queryParams.append('categoryId', params.categoryId.toString());

  if (params.latitude && params.longitude) {
    queryParams.append('latitude', params.latitude);
    queryParams.append('longitude', params.longitude);
  }
  if (params.countryCode) queryParams.append('countryCode', params.countryCode);
  if (params.locationRange) queryParams.append('locationRange', params.locationRange.toString());
  if (params.nearbyPage) queryParams.append('nearbyPage', params.nearbyPage.toString());
  if (params.nearbyPageSize) queryParams.append('nearbyPageSize', params.nearbyPageSize.toString());
  if (params.popularPage) queryParams.append('popularPage', params.popularPage.toString());
  if (params.popularPageSize) queryParams.append('popularPageSize', params.popularPageSize.toString());

  const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.expert.services.homepageWall}?${queryParams.toString()}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000);

  const token = getAuthToken();
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const { capacitorFetch } = await import('./capacitorFetch');

  let response: Response;
  try {
    response = await capacitorFetch(url, { headers, signal: controller.signal });
    clearTimeout(timeoutId);
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('La petición tardó demasiado tiempo (timeout)');
    }
    throw error;
  }

  if (!response.ok) {
    if (response.status === 400) throw new Error('categoryId es requerido');
    if (response.status === 404) throw new Error('Categoría no encontrada');
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }

  const text = await response.text();
  if (text.trim().toLowerCase().startsWith('<!doctype') || text.trim().toLowerCase().startsWith('<html')) {
    throw new Error('El servidor devolvió HTML en lugar de JSON. Verifica la URL del endpoint.');
  }

  return JSON.parse(text) as HomepageWallResponse;
}

export const HOMEPAGE_WALL_STALE_MS = 60_000;

export function prefetchHomepageWall(
  queryClient: QueryClient,
  params: HomepageWallQueryParams,
) {
  if (!params.categoryId) return Promise.resolve();

  return queryClient.prefetchQuery({
    queryKey: getHomepageWallQueryKey(params),
    queryFn: () => fetchHomepageWall(params),
    staleTime: HOMEPAGE_WALL_STALE_MS,
  });
}
