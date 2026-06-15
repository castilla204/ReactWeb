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

/** Tiles Carto Voyager — en dev van por proxy same-origin para evitar CORS.
 *
 * Single host (`a.basemaps.cartocdn.com`) en prod: con HTTP/2 multiplexing y el
 * connection coalescing de Cloudflare, repartir entre a/b/c/d subdominios obliga
 * a abrir 3 conexiones extra (3 DNS+TCP+TLS) sin ganar paralelismo real —
 * MapLibre/Mapbox ya multiplexan decenas de tiles en una sola conexión H2.
 * Refs: IMC '21 (Sander et al.), MapTiler HTTP/2 vs domain sharding. */
export function getCartoVoyagerNoLabelsTiles(): string[] {
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    return [`${window.location.origin}/carto/rastertiles/voyager_nolabels/{z}/{x}/{y}.png`];
  }
  return [
    'https://a.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}.png',
  ];
}

/** Carto Voyager con etiquetas (ciudades, carreteras) — paso de búsqueda de expertos. */
export function getCartoVoyagerTiles(): string[] {
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    return [`${window.location.origin}/carto/rastertiles/voyager/{z}/{x}/{y}.png`];
  }
  return ['https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png'];
}

/** Solo etiquetas (ciudades) — se superpone sobre voyager_nolabels. */
export function getCartoVoyagerOnlyLabelsTiles(): string[] {
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    return [`${window.location.origin}/carto/rastertiles/voyager_only_labels/{z}/{x}/{y}.png`];
  }
  return ['https://a.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}.png'];
}
