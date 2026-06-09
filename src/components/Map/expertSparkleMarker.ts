/** Paleta por ciudad — cada experto / hub con identidad cromática propia. */
export const EXPERT_SPARKLE_PALETTES = [
  { primary: '#0066CC', accent: '#38bdf8', flare: '#93c5fd' },
  { primary: '#8b5cf6', accent: '#c4b5fd', flare: '#ddd6fe' },
  { primary: '#10b981', accent: '#6ee7b7', flare: '#a7f3d0' },
  { primary: '#f59e0b', accent: '#fcd34d', flare: '#fde68a' },
  { primary: '#f43f5e', accent: '#fb7185', flare: '#fda4af' },
  { primary: '#84cc16', accent: '#bef264', flare: '#d9f99d' },
  { primary: '#ec4899', accent: '#f9a8d4', flare: '#fbcfe8' },
  { primary: '#f97316', accent: '#fdba74', flare: '#fed7aa' },
  { primary: '#06b6d4', accent: '#67e8f9', flare: '#a5f3fc' },
  { primary: '#eab308', accent: '#fde047', flare: '#fef08a' },
  { primary: '#6366f1', accent: '#a5b4fc', flare: '#c7d2fe' },
  { primary: '#14b8a6', accent: '#5eead4', flare: '#99f6e4' },
  { primary: '#0ea5e9', accent: '#7dd3fc', flare: '#bae6fd' },
  { primary: '#a855f7', accent: '#d8b4fe', flare: '#e9d5ff' },
  { primary: '#22c55e', accent: '#86efac', flare: '#bbf7d0' },
  { primary: '#ef4444', accent: '#fca5a5', flare: '#fecaca' },
] as const;

type SparklePalette = (typeof EXPERT_SPARKLE_PALETTES)[number];

function paletteVars(palette: SparklePalette, index: number, scale: number) {
  const delay = `${(index * 0.23) % 3.1}s`;
  return `--sp-primary:${palette.primary};--sp-accent:${palette.accent};--sp-flare:${palette.flare};--sp-delay:${delay};--sp-scale:${scale}`;
}

/** Hub principal — anillo + núcleo + destellos satélite */
function hubMarkup(palette: SparklePalette, index: number): string {
  const vars = paletteVars(palette, index, 1);
  return `
    <div class="expert-sparkle-marker expert-sparkle-tier-hub" style="${vars};width:40px;height:40px;position:relative;pointer-events:none" aria-hidden="true">
      <span class="expert-sparkle-orbit expert-sparkle-orbit-a" style="background:${palette.accent}"></span>
      <span class="expert-sparkle-orbit expert-sparkle-orbit-b" style="background:${palette.flare}"></span>
      <span class="expert-sparkle-pulse"></span>
      <span class="expert-sparkle-core"></span>
      <span class="expert-sparkle-glint expert-sparkle-glint-1" style="background:${palette.accent}"></span>
      <span class="expert-sparkle-glint expert-sparkle-glint-2" style="background:${palette.flare}"></span>
      <span class="expert-sparkle-glint expert-sparkle-glint-3" style="background:${palette.primary}"></span>
    </div>
  `;
}

/** Ciudad media */
function standardMarkup(palette: SparklePalette, index: number): string {
  const vars = paletteVars(palette, index, 0.82);
  return `
    <div class="expert-sparkle-marker expert-sparkle-tier-standard" style="${vars};width:32px;height:32px;position:relative;pointer-events:none" aria-hidden="true">
      <span class="expert-sparkle-pulse expert-sparkle-pulse-sm"></span>
      <span class="expert-sparkle-core expert-sparkle-core-sm"></span>
      <span class="expert-sparkle-glint expert-sparkle-glint-1" style="background:${palette.accent}"></span>
      <span class="expert-sparkle-glint expert-sparkle-glint-2" style="background:${palette.flare}"></span>
    </div>
  `;
}

/** Presencia ligera — punto brillante compacto */
function microMarkup(palette: SparklePalette, index: number): string {
  const vars = paletteVars(palette, index, 0.68);
  return `
    <div class="expert-sparkle-marker expert-sparkle-tier-micro" style="${vars};width:24px;height:24px;position:relative;pointer-events:none" aria-hidden="true">
      <span class="expert-sparkle-core expert-sparkle-core-micro"></span>
      <span class="expert-sparkle-glint expert-sparkle-glint-micro" style="background:${palette.accent}"></span>
    </div>
  `;
}

export function expertSparkleMarkerHtml(
  palette: SparklePalette,
  index: number,
  weight: 1 | 2 | 3,
): string {
  if (weight === 3) return hubMarkup(palette, index);
  if (weight === 2) return standardMarkup(palette, index);
  return microMarkup(palette, index);
}
