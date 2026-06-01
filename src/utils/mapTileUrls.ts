/** Peticiones a CDNs de mapas — no deben llevar auth ni disparar errores de API. */
export function isExternalMapTileUrl(url: string): boolean {
  return (
    url.includes('cartocdn.com') ||
    url.includes('/carto/') ||
    url.includes('openfreemap.org') ||
    url.includes('tile.openstreetmap.org')
  );
}

/** URL real del fetch (MapLibre suele pasar `Request`, no string). */
export function resolveFetchUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.href;
  if (typeof Request !== 'undefined' && input instanceof Request) return input.url;
  return String(input);
}

/** Tiles Carto Voyager — en dev van por proxy same-origin para evitar CORS. */
export function getCartoVoyagerNoLabelsTiles(): string[] {
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    return [`${window.location.origin}/carto/rastertiles/voyager_nolabels/{z}/{x}/{y}.png`];
  }
  return [
    'https://a.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}.png',
    'https://b.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}.png',
    'https://c.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}.png',
    'https://d.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}.png',
  ];
}
