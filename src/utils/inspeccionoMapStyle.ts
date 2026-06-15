import type maplibregl from 'maplibre-gl';
import {
  getCartoVoyagerNoLabelsTiles,
  getCartoVoyagerOnlyLabelsTiles,
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

  const sources: maplibregl.StyleSpecification['sources'] = {
    carto: {
      type: 'raster',
      tiles: getCartoVoyagerNoLabelsTiles(),
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

  if (withLabels) {
    sources['carto-labels'] = {
      type: 'raster',
      tiles: getCartoVoyagerOnlyLabelsTiles(),
      tileSize: 256,
    };
    layers.push({
      id: INSPECCIONO_MAP_LAYER_IDS.cartoLabels,
      type: 'raster',
      source: 'carto-labels',
      paint: {
        'raster-opacity': 0.9,
      },
    });
  }

  return { version: 8, sources, layers };
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
