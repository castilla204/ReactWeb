import { MAP_CANON } from './inspeccionoMapStyle';

/**
 * Marcadores HTML canónicos de los mapas (estética app de movilidad): punto/pin TINTA
 * (#171717) con borde blanco sobre la base Voyager a color. Un único vocabulario para
 * checkout, ficha de servicio, alta de experto, panel y chat — el mapa aporta el color,
 * el marcador aporta el foco.
 *
 * Devuelven elementos DOM listos para `new Marker({ element })` (MapLibre o Mapbox GL).
 */

/**
 * Punto base (centro de cobertura / taller del experto): dot tinta con halo neutro
 * translúcido. Discreto — referencia sin competir con el pin elegido.
 */
export function buildInkDotElement(size: number, options?: { draggable?: boolean }): HTMLDivElement {
  const el = document.createElement('div');
  el.style.cursor = options?.draggable ? 'grab' : 'pointer';
  const halo = size + 12;
  el.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;width:${halo}px;height:${halo}px;border-radius:50%;background:rgba(23,23,23,0.14)">
      <div style="width:${size}px;height:${size}px;border-radius:50%;background:${MAP_CANON.ink};border:2px solid ${MAP_CANON.inkBorder};box-shadow:0 1px 4px rgba(0,0,0,0.32)"></div>
    </div>`;
  return el;
}

/**
 * Ubicación elegida: anillo suave + punto tinta preciso, estilo chincheta de app de
 * movilidad. Ancla en el centro — señala el pixel exacto sin lágrima genérica.
 */
export function buildInkPinElement(): HTMLDivElement {
  const el = document.createElement('div');
  el.style.cursor = 'pointer';
  el.innerHTML = `
    <div style="position:relative;display:flex;align-items:center;justify-content:center;width:40px;height:40px">
      <div style="position:absolute;inset:0;border-radius:50%;background:rgba(23,23,23,0.12)"></div>
      <div style="position:absolute;width:22px;height:22px;border-radius:50%;border:2px solid rgba(23,23,23,0.30);background:rgba(255,255,255,0.94)"></div>
      <div style="position:relative;width:12px;height:12px;border-radius:50%;background:${MAP_CANON.ink};border:2.5px solid ${MAP_CANON.inkBorder};box-shadow:0 1px 6px rgba(0,0,0,0.42)"></div>
    </div>`;
  return el;
}

/**
 * Dot tinta simple SIN halo (miniaturas / mapas pequeños donde el halo ocuparía
 * demasiado). Mismo lenguaje que buildInkDotElement a escala reducida.
 */
export function buildInkDotBareElement(size: number, options?: { draggable?: boolean; borderWidth?: number }): HTMLDivElement {
  const el = document.createElement('div');
  const border = options?.borderWidth ?? 2.5;
  el.style.cursor = options?.draggable ? 'grab' : 'default';
  el.innerHTML = `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${MAP_CANON.ink};border:${border}px solid ${MAP_CANON.inkBorder};box-shadow:0 2px 8px rgba(0,0,0,0.28)"></div>`;
  return el;
}
