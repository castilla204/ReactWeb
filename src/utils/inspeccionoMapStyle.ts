import type maplibregl from 'maplibre-gl';
import {
  getCartoVoyagerNoLabelsTiles,
  getCartoVoyagerTiles,
} from './mapTileUrls';

/** Paleta compartida — tierra cálida, agua suave, costas en azul marca (ExpertsAreaMap). */
export const INSPECCIONO_MAP_THEME = {
  sky: '#dce9f2',
  land: '#ebe8e3',
  coastLine: '#0066CC',
  coastHalo: '#ffffff',
  border: '#d1c4c6',
} as const;

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

  // ⚡ Carga: UN ÚNICO tileset. Antes la búsqueda bajaba voyager_nolabels + voyager_only_labels
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
      paint: {
        'raster-opacity': 1,
        // Ligero realce de verdes/amarillos Carto — más cálido sin saturar.
        'raster-saturation': 0.12,
        'raster-brightness-min': 0.03,
        'raster-brightness-max': 1,
      },
    },
  ];

  return { version: 8, sources, layers };
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
