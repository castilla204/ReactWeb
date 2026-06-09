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
 * 🔵 PUNTO ANCLADO — diseño v2 (junio 2026).
 *
 * Reemplaza al marcador decorativo anterior (orbits + glints satélite) porque
 * sus partículas internas se animaban con `transform: translate(...)` dentro de
 * un recuadro de 40px → al hacer zoom regional (~zoom 4) ese recuadro ocupaba
 * ~50-100 km sobre el mapa y las partículas aparecían "flotando en el mar",
 * fuera de la ciudad real. Ahora cada marker es UN punto sólido perfectamente
 * centrado en su lng/lat, con halo blanco para contraste y un glow exterior
 * coloreado. Sin transformaciones que muevan el centro.
 *
 * El opcional `twinkle` reutiliza la animación CSS `expert-sparkle-twinkle`
 * que SOLO modula `opacity` (no translate, no scale) → seguro para no romper
 * el anclado.
 */

interface DotSpec {
  /** Diámetro del punto sólido en píxeles. */
  size: number;
  /** Ancho del halo blanco que rodea el punto. */
  ringPx: number;
  /** Radio del glow exterior coloreado (box-shadow). */
  glowPx: number;
}

const DOT_SPECS: Record<1 | 2 | 3, DotSpec> = {
  // weight=3 (hub principal): un poco más grande para destacar megaciudades
  3: { size: 14, ringPx: 2, glowPx: 10 },
  // weight=2 (ciudad media): tamaño medio
  2: { size: 11, ringPx: 2, glowPx: 7 },
  // weight=1 (presencia ligera): punto pequeño — la mayoría son éste tier
  1: { size: 8, ringPx: 1.5, glowPx: 5 },
};

export function expertSparkleMarkerHtml(
  palette: SparklePalette,
  index: number,
  weight: 1 | 2 | 3,
  twinkle = false,
): string {
  const spec = DOT_SPECS[weight];
  // Reservamos un wrapper algo mayor que el punto para que el glow no quede recortado;
  // pero el punto SÓLIDO va perfectamente centrado en el wrapper. MapLibre.Marker con
  // anchor:'center' pone el centro del wrapper sobre la lng/lat → el punto coincide
  // exactamente con la ciudad.
  const wrapperSize = spec.size + spec.glowPx * 2 + 4;

  // Anti-superposición de parpadeos: cada índice arranca en un punto distinto del ciclo.
  const twinkleDuration = `${3.2 + (index % 9) * 0.35}s`;
  const twinkleDelay = `${(index * 0.71) % 5.3}s`;
  const twinkleClass = twinkle ? ' expert-sparkle-twinkle' : '';
  const twinkleVars = twinkle
    ? `;--sp-twinkle-duration:${twinkleDuration};--sp-twinkle-delay:${twinkleDelay}`
    : '';

  // El wrapper conserva la clase `expert-sparkle-marker` porque
  // `updateSparkleVisibility` lee `--sp-scale` para escalar según zoom (no translate).
  const wrapperStyle = [
    `--sp-scale:1`,
    `width:${wrapperSize}px`,
    `height:${wrapperSize}px`,
    `display:flex`,
    `align-items:center`,
    `justify-content:center`,
    `pointer-events:none`,
    twinkleVars.replace(/^;/, ''),
  ]
    .filter(Boolean)
    .join(';');

  // El punto sólido: círculo coloreado + anillo blanco + glow exterior. Todo
  // posicionado relativo al centro del wrapper, sin transforms que lo desplacen.
  const dotStyle = [
    `width:${spec.size}px`,
    `height:${spec.size}px`,
    `border-radius:50%`,
    `background:${palette.primary}`,
    `border:${spec.ringPx}px solid #ffffff`,
    // Glow exterior: doble box-shadow (color + sombra negra suave para "pegar" al mapa)
    `box-shadow:0 0 ${spec.glowPx}px ${palette.primary}b3,0 1px 2px rgba(0,0,0,0.25)`,
    `box-sizing:border-box`,
  ].join(';');

  return `
    <div class="expert-sparkle-marker${twinkleClass}" style="${wrapperStyle}" aria-hidden="true">
      <span style="${dotStyle}"></span>
    </div>
  `;
}
