import type maplibregl from 'maplibre-gl';
import type { ExpertSparkleHub } from './expertSparkleHubs';

const MIN_SPARKLE_SCREEN_PX = 56;
const MAX_VISIBLE_SPARKLES = 22;

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

/** Escala los marcadores según zoom para que sigan legibles en vista mundial. */
export function sparkleMarkerScale(map: maplibregl.Map): number {
  const zoom = map.getZoom();
  return Math.max(0.9, Math.min(1.45, 0.55 + zoom * 0.22));
}

/**
 * Elige hubs visibles sin solaparse en pantalla (prioriza weight alto).
 * Evita el "montón" de puntos en Iberia/Mediterráneo.
 */
export function pickVisibleSparkleHubIds(
  map: maplibregl.Map,
  hubs: readonly ExpertSparkleHub[],
): Set<string> {
  const sorted = [...hubs].sort((a, b) => b.weight - a.weight);
  const picked: Array<{ x: number; y: number }> = [];
  const visible = new Set<string>();

  for (const hub of sorted) {
    if (!isSparkleOnScreen(map, hub.lng, hub.lat)) continue;

    const point = map.project([hub.lng, hub.lat]);
    const crowded = picked.some(
      (p) => Math.hypot(point.x - p.x, point.y - p.y) < MIN_SPARKLE_SCREEN_PX,
    );
    if (crowded) continue;

    visible.add(hub.id);
    picked.push({ x: point.x, y: point.y });
    if (visible.size >= MAX_VISIBLE_SPARKLES) break;
  }

  return visible;
}
