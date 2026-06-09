import type maplibregl from 'maplibre-gl';
import type { ExpertSparkleHub } from './expertSparkleHubs';

const MIN_SPARKLE_SCREEN_PX = 56;
const MAX_VISIBLE_SPARKLES = 22;

/** Hero desktop: un punto por celda de rejilla para cubrir todo el mapa visible. */
const SPREAD_GRID_COLS = 10;
const SPREAD_GRID_ROWS = 6;
const SPREAD_MAX_VISIBLE = 52;

/**
 * 🌍 Globo: límite mayor de puntos visibles. En proyección globe se ve el planeta
 * entero, así que tiene sentido enseñar muchos más destellos (~80) repartidos por
 * el hemisferio visible — el usuario percibe "expertos en todo el mundo".
 * Tras aterrizar (mercator regional) volvemos a SPREAD_MAX_VISIBLE para no saturar.
 */
const SPREAD_MAX_VISIBLE_GLOBE = 80;
const MAX_VISIBLE_SPARKLES_GLOBE = 60;
/** Globe usa rejilla más densa porque el hemisferio visible cabe en la mitad central del canvas. */
const SPREAD_GRID_COLS_GLOBE = 14;
const SPREAD_GRID_ROWS_GLOBE = 10;

/**
 * Umbral de hemisferio visible: cos(distancia angular) > 0.05 ≈ < 87° desde la
 * cámara. Por encima (≥90°) el punto cae al lado opuesto del globo y NO se debe
 * pintar. Margen pequeño (87°) en vez de 90° para evitar destellos justo en el
 * terminador que se ven "raros" estirándose.
 */
const HEMISPHERE_COS_THRESHOLD = 0.05;

export function isMapMercator(map: maplibregl.Map): boolean {
  try {
    return map.getProjection().type === 'mercator';
  } catch {
    return false;
  }
}

/**
 * 🌍 Comprueba si (lng, lat) cae en el hemisferio visible desde la cámara cuando
 * el mapa está en proyección globe. Usa la fórmula de la distancia angular
 * (gran círculo) entre dos puntos sobre una esfera:
 *
 *   cos(dist) = sin(lat1)·sin(lat2) + cos(lat1)·cos(lat2)·cos(lng1 - lng2)
 *
 * Si cos(dist) ≤ 0 → el punto está a >90° de la cámara → al otro lado del planeta.
 * Sin esta comprobación los marcadores HTML del lado oculto se proyectarían igual
 * en el canvas como "fantasmas" detrás del relieve.
 */
export function isHubOnGlobeHemisphere(
  map: maplibregl.Map,
  lng: number,
  lat: number,
): boolean {
  const center = map.getCenter();
  const toRad = Math.PI / 180;
  const sinLat = Math.sin(lat * toRad);
  const sinCenterLat = Math.sin(center.lat * toRad);
  const cosLat = Math.cos(lat * toRad);
  const cosCenterLat = Math.cos(center.lat * toRad);
  const deltaLng = (lng - center.lng) * toRad;
  const cosDist =
    sinLat * sinCenterLat + cosLat * cosCenterLat * Math.cos(deltaLng);
  return cosDist > HEMISPHERE_COS_THRESHOLD;
}

/**
 * Comprueba si un hub cae dentro del canvas visible (descontando padding del overlay).
 * En MERCATOR: bounds del canvas. En GLOBE: hemisferio visible + bounds del canvas
 * (porque MapLibre globe NO clipa back-face automáticamente; proyectaría hubs del
 * otro lado en píxeles válidos del canvas como si estuvieran delante).
 */
export function isSparkleOnScreen(map: maplibregl.Map, lng: number, lat: number): boolean {
  // 🌍 En globo: cull por hemisferio ANTES de proyectar.
  if (!isMapMercator(map)) {
    if (!isHubOnGlobeHemisphere(map, lng, lat)) return false;
  }

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
 * Globe → más puntos permitidos (hemisferio completo visible).
 */
export function pickVisibleSparkleHubIds(
  map: maplibregl.Map,
  hubs: readonly ExpertSparkleHub[],
): Set<string> {
  const isGlobe = !isMapMercator(map);
  const maxVisible = isGlobe ? MAX_VISIBLE_SPARKLES_GLOBE : MAX_VISIBLE_SPARKLES;
  const minSeparation = isGlobe ? MIN_SPARKLE_SCREEN_PX * 0.65 : MIN_SPARKLE_SCREEN_PX;

  const sorted = [...hubs].sort((a, b) => b.weight - a.weight);
  const picked: Array<{ x: number; y: number }> = [];
  const visible = new Set<string>();

  for (const hub of sorted) {
    if (!isSparkleOnScreen(map, hub.lng, hub.lat)) continue;

    const point = map.project([hub.lng, hub.lat]);
    const crowded = picked.some(
      (p) => Math.hypot(point.x - p.x, point.y - p.y) < minSeparation,
    );
    if (crowded) continue;

    visible.add(hub.id);
    picked.push({ x: point.x, y: point.y });
    if (visible.size >= maxVisible) break;
  }

  return visible;
}

/**
 * Reparte destellos en una rejilla sobre el canvas visible — evita amontonarse en Iberia
 * y deja puntos de colores dispersos por toda el área del mapa.
 * Globe → rejilla más densa + más puntos máximos.
 */
export function pickSpreadSparkleHubIds(
  map: maplibregl.Map,
  hubs: readonly ExpertSparkleHub[],
): Set<string> {
  const container = map.getContainer();
  const width = container.clientWidth;
  const height = container.clientHeight;
  const pad = map.getPadding();
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  if (innerW <= 0 || innerH <= 0) return new Set();

  const isGlobe = !isMapMercator(map);
  const gridCols = isGlobe ? SPREAD_GRID_COLS_GLOBE : SPREAD_GRID_COLS;
  const gridRows = isGlobe ? SPREAD_GRID_ROWS_GLOBE : SPREAD_GRID_ROWS;
  const maxVisible = isGlobe ? SPREAD_MAX_VISIBLE_GLOBE : SPREAD_MAX_VISIBLE;

  const cells = new Map<string, ExpertSparkleHub>();

  for (const hub of hubs) {
    if (!isSparkleOnScreen(map, hub.lng, hub.lat)) continue;

    const point = map.project([hub.lng, hub.lat]);
    const col = Math.min(
      gridCols - 1,
      Math.max(0, Math.floor(((point.x - pad.left) / innerW) * gridCols)),
    );
    const row = Math.min(
      gridRows - 1,
      Math.max(0, Math.floor(((point.y - pad.top) / innerH) * gridRows)),
    );
    const key = `${col},${row}`;
    const existing = cells.get(key);
    if (!existing || hub.weight > existing.weight) {
      cells.set(key, hub);
    }
  }

  const picked = [...cells.values()]
    .sort((a, b) => b.weight - a.weight)
    .slice(0, maxVisible);

  return new Set(picked.map((hub) => hub.id));
}
