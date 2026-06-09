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

/**
 * 🔵 PIN-PRICK ESTÁTICO — diseño v7 (junio 2026)
 *
 * Historial de iteraciones:
 *   v1 orbits animados → "puntos en el mar".
 *   v2 halo blanco grueso → "varitas".
 *   v3 heatmap muy sutil → "no veo nada".
 *   v4 heatmap + glow grande → glow de 210 km invadía Mediterráneo.
 *   v5 glow recortado a 84 km → "apenas se ve".
 *   v6 perla 3D + radar + respiración → "se desaparecen" (radar fade-out)
 *      + "más pequeñas" + "se vea más la forma del globo".
 *
 * v7: mínimo absoluto. Pin-prick estático, súper pequeño, sin animaciones,
 * sin halos coloreados (cero invasión de mar), sin desapariciones. Solo un
 * dot sólido con definición sutil oscura + microsombra. El globo respira;
 * los puntos NO. Pensados para verse como "presencia anclada", no protagonistas.
 */

interface DotSpec {
  /** Diámetro del dot sólido en px. Pequeño a propósito para no tapar el globo. */
  core: number;
}

const DOT_SPECS: Record<1 | 2 | 3, DotSpec> = {
  // 🔧 v9 (feedback "puntos demasiado grandes"): bajo todos los tiers manteniendo
  // jerarquía sutil. Ahora la diferencia entre hub y secundaria es 1 px en cada
  // salto — perceptible si miras de cerca, pero el conjunto se ve uniforme:
  // "constelación de puntitos" sin que Madrid/Berlín/París tiren del ojo.
  // - weight=3 (megaciudades): 5 px (era 8).
  // - weight=2 (ciudades medias): 4 px (era 5).
  // - weight=1 (secundarias, los pequeñitos): 3 px (era 4).
  3: { core: 5 },
  2: { core: 4 },
  1: { core: 3 },
};

export function expertSparkleMarkerHtml(
  palette: SparklePalette,
  _index: number,
  weight: 1 | 2 | 3,
  _twinkle = false,
): string {
  const spec = DOT_SPECS[weight];
  const c = palette.primary;

  // Estilo del dot. Cero animaciones, cero halos coloreados, cero translates.
  //
  // Capas (todas dentro o muy ceñidas a la silueta):
  //  - background: color sólido de la paleta.
  //  - inset 0 0.5px 0 rgba(255,255,255,0.45): microhighlight perla (DENTRO).
  //  - 0 0 0 0.5px rgba(0,0,0,0.35): contorno oscuro sub-pixel para que el
  //    dot tenga silueta contra mapa claro Y oscuro. No hay blanco exterior
  //    (que se confundía con varitas).
  //  - 0 0.5px 1.5px rgba(0,0,0,0.55): drop shadow muy ceñida abajo. Da
  //    presencia sin extender el halo lateralmente al mar.
  //
  // Bleed lateral total: <1 px (~20 km a z=2.5) → cero invasión visible.
  const dotStyle = [
    `width:${spec.core}px`,
    `height:${spec.core}px`,
    `border-radius:50%`,
    `background:${c}`,
    `box-shadow:` +
      `inset 0 0.5px 0 rgba(255,255,255,0.45),` +
      `0 0 0 0.5px rgba(0,0,0,0.35),` +
      `0 0.5px 1.5px rgba(0,0,0,0.55)`,
    `box-sizing:border-box`,
    `display:block`,
  ].join(';');

  // Wrapper mínimo (core + 4 px de margen para drop shadow). Sin animaciones.
  // La clase `.expert-sparkle-marker` mantiene el `transform: scale(--sp-scale)`
  // del CSS para que `updateSparkleVisibility` siga ajustando tamaño por zoom.
  const wrapperSize = spec.core + 4;
  const wrapperStyle = [
    `--sp-scale:1`,
    `width:${wrapperSize}px`,
    `height:${wrapperSize}px`,
    `display:flex`,
    `align-items:center`,
    `justify-content:center`,
    `pointer-events:none`,
  ].join(';');

  // Sin clases adicionales:
  //  - NO `.expert-sparkle-pearl` (respiración eliminada).
  //  - NO `.expert-sparkle-radar` (las ondas que "desaparecían").
  //  - NO `.expert-sparkle-twinkle` (la animación opacity-0 que ocultaba dots).
  // El twinkle param se ignora a propósito en v7 (mantenemos la firma por compat).
  return `
    <div class="expert-sparkle-marker" style="${wrapperStyle}" aria-hidden="true">
      <span style="${dotStyle}"></span>
    </div>
  `;
}
