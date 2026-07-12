import type maplibregl from 'maplibre-gl';
import { MAP_LITERAL } from '../constants/designTokens';
import {
  getCartoVoyagerNoLabelsTiles,
  getCartoVoyagerTiles,
} from './mapTileUrls';

/** Paleta compartida — tierra cálida, agua suave, costas en azul marca (ExpertsAreaMap). */
export const INSPECCIONO_MAP_THEME = {
  sky: MAP_LITERAL.sky,
  land: MAP_LITERAL.land,
  coastLine: MAP_LITERAL.brand,
  coastHalo: MAP_LITERAL.coastHalo,
  border: MAP_LITERAL.border,
} as const;

/**
 * Canon visual ÚNICO de todos los mapas de la app (referencia: app de movilidad —
 * base Voyager clara con verdes/cremas suaves, protagonismo para los marcadores tinta).
 *
 *  · ink        → color de TODOS los marcadores (pins, dots, clusters, seleccionado).
 *  · ring       → anillo de cobertura discontinuo neutro (checkout, ficha, panel, alta).
 *  · ringFill   → lavado casi imperceptible dentro del radio.
 *  · mask       → atenuación de la zona NO elegible (flujos donde se elige punto).
 */
export const MAP_CANON = {
  ink: MAP_LITERAL.inkStrong,
  inkBorder: MAP_LITERAL.coastHalo,
  ring: 'rgba(23, 23, 23, 0.42)',
  ringStrong: 'rgba(23, 23, 23, 0.55)',
  ringDash: [3, 3] as [number, number],
  ringWidth: 2,
  ringFill: MAP_LITERAL.inkStrong,
  ringFillOpacity: 0.05,
  maskFill: MAP_LITERAL.inkStrong,
  maskFillOpacity: 0.06,
} as const;

/**
 * Tratamiento raster BASE de las teselas Carto Voyager (zoom alto ≥10). Objetivo: look
 * VIVO tipo Apple Maps claro (referencia Tribbu) — parques verde vivo, autopistas amarillas
 * visibles, agua azul limpia — manteniendo la base clara y legible.
 *
 * A zoom BAJO (≤7, vista continental), los tiles raster JPG se comprimen agresivamente
 * y pierden saturación → se ven grises. Solución: aplicar paint dinámico por zoom
 * (ver `getPaintForZoom()`).
 *
 *  · saturation 0.35 → a zoom alto: enciende verdes/amarillos/azules sin quemar halos
 *                      de etiquetas del raster (>0.5 aparecen orlas de color).
 *  · contrast 0.10   → carreteras y bordes de parque definidos.
 *  · brightness-min 0 / max 1 → rango tonal completo: blancos limpios.
 * Combinado con teselas @2x (ver mapTileUrls) el resultado es nítido y premium.
 */
export const INSPECCIONO_RASTER_PAINT = {
  'raster-opacity': 1,
  'raster-saturation': 0.35,
  'raster-contrast': 0.1,
  'raster-brightness-min': 0,
  'raster-brightness-max': 1,
} as const;

/**
 * Paint dinámico por zoom: a distancia (zoom bajo) los tiles JPG se comprimen y pierden
 * color → boost agresivo de sat/contraste/brillo para recuperar el look vivo.
 * Interpolación suave (NO cambios bruscos) desde zoom 7 a 10.
 * Inspirado en Apple Maps (que también boosteava zoom bajo).
 */
export function getPaintForZoom(zoom: number): Record<string, number> {
  // zoom ≤ 7: vista continental/país — JPG muy comprimido, need boost máximo
  if (zoom <= 7) {
    return {
      'raster-opacity': 1,
      'raster-saturation': 0.50,      // +50% saturación (máx sin quemar etiquetas)
      'raster-contrast': 0.15,         // definición extra para contrarrestar compresión
      'raster-brightness-min': 0.10,   // menos oscuro de lejos
      'raster-brightness-max': 1,
    };
  }
  // zoom 8-9: región/provincia — interpolación suave hacia detalle
  if (zoom <= 9) {
    const t = (zoom - 7) / 2; // [0, 1] entre z7 y z9
    return {
      'raster-opacity': 1,
      'raster-saturation': 0.50 - t * 0.08,           // 0.50 → 0.42
      'raster-contrast': 0.15 - t * 0.03,             // 0.15 → 0.12
      'raster-brightness-min': 0.10 - t * 0.04,       // 0.10 → 0.06
      'raster-brightness-max': 1,
    };
  }
  // zoom ≥ 10: ciudad/detalle — paint base (sin boost)
  return INSPECCIONO_RASTER_PAINT;
}

export const INSPECCIONO_MAP_LAYER_IDS = {
  cartoBase: 'carto-base',
  cartoLabels: 'carto-labels',
} as const;

const NE_LAND_GEO = '/geo/ne_110m_land.geojson';

export interface InspeccionoMapStyleOptions {
  /** Superpone solo las etiquetas (ciudades) sobre la base Voyager sin labels. */
  withLabels?: boolean;
}

/**
 * Estilo Carto Voyager de la app: base amarillo/verde (nolabels) + etiquetas opcionales.
 * Misma estética que homepage, ficha de servicio y mapa de cobertura.
 */
export function buildInspeccionoMapStyle(
  options: InspeccionoMapStyleOptions = {},
): maplibregl.StyleSpecification {
  const withLabels = options.withLabels !== false;

  // ⚡ Carga: UN ÚNICO tileset.
  //    (2 tilesets = el DOBLE de peticiones de tiles, ~2× bytes y una segunda cola de fetch que
  //    compite por el ancho de banda en redes lentas). `voyager` ya trae las etiquetas
  //    integradas → mitad de peticiones y mismo aspecto. Los mapas sin etiquetas (cobertura)
  //    siguen usando voyager_nolabels vía withLabels:false.
  const sources: maplibregl.StyleSpecification['sources'] = {
    carto: {
      type: 'raster',
      tiles: withLabels ? getCartoVoyagerTiles() : getCartoVoyagerNoLabelsTiles(),
      tileSize: 256,
      attribution: '© OpenStreetMap · CARTO',
    },
  };

  const layers: maplibregl.LayerSpecification[] = [
    {
      id: 'sky-bg',
      type: 'background',
      paint: { 'background-color': INSPECCIONO_MAP_THEME.sky },
    },
    {
      id: INSPECCIONO_MAP_LAYER_IDS.cartoBase,
      type: 'raster',
      source: 'carto',
      // Tratamiento canónico compartido por TODOS los mapas de la app.
      paint: { ...INSPECCIONO_RASTER_PAINT },
    },
  ];

  return { version: 8, sources, layers };
}

/**
 * Mapa de checkout: alias del estilo canónico CON etiquetas (el cliente reconoce su
 * calle/barrio al marcar el punto). Se conserva el nombre para los call-sites; desde la
 * unificación visual ya no hay una variante "neutra" distinta — un único look en toda la app.
 */
export function buildNeutralCheckoutMapStyle(): maplibregl.StyleSpecification {
  return buildInspeccionoMapStyle({ withLabels: true });
}

/** Pitch moderado según zoom: curvatura de globo lejos, plano al acercar para leer precios. */
export function getSearchMapGlobePitch(zoom: number, isMobile = false): number {
  const mobileTrim = isMobile ? 2 : 0;
  if (zoom <= 4.5) return 30 - mobileTrim;
  if (zoom <= 6.5) return 24 - mobileTrim;
  if (zoom <= 8.5) return 16 - mobileTrim;
  if (zoom <= 10.5) return 8;
  if (zoom <= 12.5) return 3;
  return 0;
}

/** Proyección globe + atmósfera suave acorde a la paleta Inspecciono. */
export function applyInspeccionoGlobeProjection(map: maplibregl.Map): void {
  try {
    map.setProjection({ type: 'globe' });
  } catch {
    // Fallback silencioso a mercator si el runtime no soporta globe.
  }

  try {
    map.setFog({
      color: INSPECCIONO_MAP_THEME.sky,
      'high-color': INSPECCIONO_MAP_THEME.sky,
      'horizon-blend': 0.1,
      'space-color': INSPECCIONO_MAP_THEME.sky,
      'star-intensity': 0,
    });
  } catch {
    // Fog cosmético — opcional.
  }

  map.triggerRepaint();
}

/** Relleno de tierra bajo los tiles — evita huecos planos mientras cargan. */
export function ensureInspeccionoLandFill(map: maplibregl.Map): void {
  if (map.getSource('ne-land')) return;

  map.addSource('ne-land', { type: 'geojson', data: NE_LAND_GEO });
  map.addLayer(
    {
      id: 'land-fill',
      type: 'fill',
      source: 'ne-land',
      paint: {
        'fill-color': INSPECCIONO_MAP_THEME.land,
        'fill-opacity': 1,
      },
    },
    INSPECCIONO_MAP_LAYER_IDS.cartoBase,
  );
}

/**
 * Activa paint raster dinámico por zoom en un mapa. A zoom bajo la base se ve apagada
 * (tiles JPG comprimidos) → boost automático de saturación/contraste/brillo para
 * recuperar colores vivos sin cambios visuales bruscos.
 *
 * Llamar en `useEffect` tras `map.loaded()` o en el callback de `onLoad`.
 */
export function enableDynamicRasterPaintByZoom(map: maplibregl.Map): void {
  const applyPaint = () => {
    const zoom = map.getZoom();
    const paint = getPaintForZoom(zoom);
    try {
      map.setPaintProperty(INSPECCIONO_MAP_LAYER_IDS.cartoBase, 'raster-saturation', paint['raster-saturation']);
      map.setPaintProperty(INSPECCIONO_MAP_LAYER_IDS.cartoBase, 'raster-contrast', paint['raster-contrast']);
      map.setPaintProperty(INSPECCIONO_MAP_LAYER_IDS.cartoBase, 'raster-brightness-min', paint['raster-brightness-min']);
    } catch {
      // Layer no existe (eg. mapa aún no ready); reintentará en el próximo evento.
    }
  };

  applyPaint(); // Aplicar paint inicial al zoom actual.
  map.on('zoom', applyPaint); // Reaplica al cambiar zoom.

  // Cleanup al desmontar mapa (caller debería llamar esto en useEffect cleanup).
  (map as any).__dynamicPaintCleanup = () => map.off('zoom', applyPaint);
}
