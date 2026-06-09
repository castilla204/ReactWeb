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
 * 🔵 PUNTO DE PRESENCIA — diseño v3 (junio 2026, estilo heatmap Strava/Mapbox).
 *
 * v1 (deprecado): composición de orbits + glints satélite animados con
 *   transform:translate → aparecían "en el mar" porque se alejaban del centro.
 * v2 (deprecado): dot sólido + halo blanco grueso (2px) + glow exterior →
 *   feedback del usuario: "se ven como varitas, no me gusta". El halo blanco
 *   denso hacía que el conjunto pareciera la cabeza de un alfiler/varita en
 *   lugar de un punto orgánico de presencia.
 * v3 (actual): SOLO color. Tres capas concéntricas del MISMO tono del experto
 *   con opacidad creciente hacia dentro — el efecto "punto de calor". Sin
 *   blancos duros, sin bordes opacos. Microsombra al suelo para no flotar.
 *
 * Cada capa se hace con box-shadow → un único <span> renderiza todo. Sin
 * elementos hijos que puedan desplazarse del centro de la ciudad.
 */

interface DotSpec {
  /** Diámetro del núcleo sólido (px). */
  core: number;
  /** Radio del halo de presencia, en px añadidos a partir del borde del núcleo. */
  haloPx: number;
  /** Radio del glow exterior suave (px). */
  glowPx: number;
}

const DOT_SPECS: Record<1 | 2 | 3, DotSpec> = {
  // weight=3 (hub principal): núcleo un poco mayor para que destaquen las megaciudades
  3: { core: 9, haloPx: 4, glowPx: 9 },
  // weight=2 (ciudad media): tamaño medio
  2: { core: 7, haloPx: 3, glowPx: 7 },
  // weight=1 (presencia ligera): puntito pequeño — la mayoría de hubs son éste tier
  1: { core: 5, haloPx: 2, glowPx: 5 },
};

/**
 * Construye el estilo inline del único <span> que renderiza el punto. Todo el
 * efecto visual viene de combinar:
 *   1. background sólido del primary  → el núcleo.
 *   2. box-shadow capa 1: spread coloreado a baja opacidad → halo del mismo color
 *      ("aura de presencia"), reemplaza el halo blanco duro de v2.
 *   3. box-shadow capa 2: blur coloreado a media opacidad → glow exterior suave.
 *   4. box-shadow capa 3: sombra negra mínima (0 1px 2px) → "pega" al mapa.
 *   5. inset 0 0 1px white 35% → microhighlight tipo perla, sin grosor — añade
 *      "vida" sin parecer un borde.
 */
function buildDotStyle(color: string, spec: DotSpec): string {
  return [
    `width:${spec.core}px`,
    `height:${spec.core}px`,
    `border-radius:50%`,
    `background:${color}`,
    `box-shadow:` +
      // Microhighlight perla (no es un border, no engrosa la silueta)
      `inset 0 0 1px rgba(255,255,255,0.35),` +
      // Halo concéntrico del mismo color, opacidad muy baja → "aura de presencia"
      `0 0 0 ${spec.haloPx}px ${color}1f,` +
      // Glow exterior difuso del mismo color, opacidad media-baja
      `0 0 ${spec.glowPx}px ${color}73,` +
      // Microsombra al suelo para dar profundidad sin flotar
      `0 1px 2px rgba(0,0,0,0.22)`,
    `box-sizing:border-box`,
  ].join(';');
}

export function expertSparkleMarkerHtml(
  palette: SparklePalette,
  index: number,
  weight: 1 | 2 | 3,
  twinkle = false,
): string {
  const spec = DOT_SPECS[weight];

  // Wrapper algo mayor que núcleo + halo + glow para que el box-shadow no quede
  // recortado por sub-pixel rounding en algunos navegadores. El MapLibre.Marker
  // con anchor:'center' centra ESTE wrapper sobre la lng/lat → el punto coincide
  // exactamente con la ciudad (sin offsets internos, sin transforms).
  const wrapperSize = spec.core + (spec.haloPx + spec.glowPx) * 2 + 4;

  // Anti-superposición de parpadeos: cada índice arranca en un punto distinto del ciclo.
  const twinkleDuration = `${3.4 + (index % 9) * 0.4}s`;
  const twinkleDelay = `${(index * 0.71) % 5.3}s`;
  const twinkleClass = twinkle ? ' expert-sparkle-twinkle' : '';
  const twinkleVars = twinkle
    ? `--sp-twinkle-duration:${twinkleDuration};--sp-twinkle-delay:${twinkleDelay};`
    : '';

  // El wrapper conserva la clase `expert-sparkle-marker` porque
  // `updateSparkleVisibility` lee `--sp-scale` para escalar según zoom (no translate).
  const wrapperStyle =
    `${twinkleVars}` +
    `--sp-scale:1;` +
    `width:${wrapperSize}px;` +
    `height:${wrapperSize}px;` +
    `display:flex;` +
    `align-items:center;` +
    `justify-content:center;` +
    `pointer-events:none`;

  const dotStyle = buildDotStyle(palette.primary, spec);

  return `
    <div class="expert-sparkle-marker${twinkleClass}" style="${wrapperStyle}" aria-hidden="true">
      <span style="${dotStyle}"></span>
    </div>
  `;
}
