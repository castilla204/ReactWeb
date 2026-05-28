/** Peticiones a CDNs de mapas — no deben llevar auth ni disparar errores de API. */
export function isExternalMapTileUrl(url: string): boolean {
  return (
    url.includes('cartocdn.com') ||
    url.includes('openfreemap.org') ||
    url.includes('tile.openstreetmap.org')
  );
}
