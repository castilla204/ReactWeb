import type maplibregl from 'maplibre-gl';

export function isMapMercator(map: maplibregl.Map): boolean {
  try {
    return map.getProjection().type === 'mercator';
  } catch {
    return false;
  }
}

/**
 * Comprueba si un hub cae dentro del canvas visible (descontando padding del overlay).
 * Más fiable que `bounds.contains` con zoom regional bajo (~2), donde el bbox
 * abarca medio mundo y pinta destellos en el Atlántico.
 */
export function isSparkleOnScreen(map: maplibregl.Map, lng: number, lat: number): boolean {
  if (!isMapMercator(map)) return false;

  const point = map.project([lng, lat]);
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return false;

  const container = map.getContainer();
  const width = container.clientWidth;
  const height = container.clientHeight;
  const pad = map.getPadding();
  const margin = 8;

  return (
    point.x >= pad.left + margin &&
    point.x <= width - pad.right - margin &&
    point.y >= pad.top + margin &&
    point.y <= height - pad.bottom - margin
  );
}
