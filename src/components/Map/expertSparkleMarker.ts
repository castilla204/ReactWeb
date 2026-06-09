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
 * 🔵 PERLA 3D + RADAR — diseño v6 (junio 2026)
 *
 * Feedback acumulado:
 *  - v1 (orbits): "puntos en el mar" (satélites con translate).
 *  - v2 (halo blanco grueso): "se ven como varitas".
 *  - v3 (heatmap muy sutil): "no veo ningún punto".
 *  - v4 (heatmap + glow grande): visible PERO el glow de 210 km a zoom 2.5
 *    pintaba auras en el Mediterráneo desde Barcelona/Valencia/Lisboa.
 *  - v5 (glow recortado a 84 km): "apenas se ve", demasiado discreto.
 *
 * v6 ataca todo a la vez:
 *
 *  1. NÚCLEO 3D tipo perla:
 *     - Base color de paleta.
 *     - Radial gradient con brillo blanco al 30%-28% (top-left) → look de
 *       perla satinada, NO de palo blanco; el brillo está DENTRO de la silueta.
 *     - inset box-shadow oscuro al 70% bottom-right para profundidad.
 *     - 1 px de borde colored al 70% → silueta nítida sin invadir mar.
 *     - Cores grandes: 14 / 12 / 10 px → claramente visibles.
 *
 *  2. RADAR centrado (animation `expert-sparkle-radar`):
 *     - Ring concéntrico del color del experto que crece desde scale 0.7 → 2.0
 *       y se desvanece (opacity 0.55 → 0.18 a 60%, 0 al final).
 *     - El "pico" del anillo (opacity 0.55) está en scale 0.7 → radio físico
 *       de ~5 px = ~100 km a zoom 2.5; cuando ha crecido a scale 2.0 ya está
 *       a opacity 0. Resultado: el efecto visible se queda cerca del centro y
 *       NO invade el mar de forma persistente.
 *     - Delay variable por índice → ondas asíncronas, sensación de "actividad".
 *
 *  3. RESPIRACIÓN (animation `expert-sparkle-breathe`) sobre el wrapper:
 *     - scale 1.0 ↔ 1.08, periodo lento 3.6 s. Nunca opacity 0 → nunca
 *       desaparece. Toque vital sin alboroto.
 *
 * Las animaciones SOLO usan scale (radial) → cero desplazamiento del centro
 * de la ciudad. Cero translate. Cero translateX/Y. Mantenemos las clases
 * .expert-sparkle-marker y `--sp-scale` para que `updateSparkleVisibility`
 * siga ajustando tamaño por zoom (mercator vs globe).
 */

interface DotSpec {
  core: number;
  /** Radio del anillo radar BASE (px). El radar pulsa entre 0.7 y 2.0 de este valor. */
  radarBasePx: number;
  /** Ancho del trazo del anillo radar (px). */
  radarStroke: number;
}

const DOT_SPECS: Record<1 | 2 | 3, DotSpec> = {
  // weight=3 (hub principal): núcleo grande para megaciudades, radar visible
  3: { core: 14, radarBasePx: 11, radarStroke: 1.5 },
  // weight=2 (ciudad media)
  2: { core: 12, radarBasePx: 9, radarStroke: 1.5 },
  // weight=1 (presencia ligera): la mayoría
  1: { core: 10, radarBasePx: 7, radarStroke: 1 },
};

function buildPearlBackground(color: string): string {
  // Capa 1 (superior): brillo blanco al 55% en top-left, transparente al 32% → "highlight".
  // Capa 2 (media): sombra negra suave al 18% bottom-right → "depth".
  // Capa 3 (base): color sólido.
  return (
    `radial-gradient(circle at 32% 28%, rgba(255,255,255,0.55) 0%, transparent 32%),` +
    `radial-gradient(circle at 65% 78%, rgba(0,0,0,0.18) 0%, transparent 55%),` +
    color
  );
}

function buildCoreStyle(color: string, spec: DotSpec): string {
  return [
    `width:${spec.core}px`,
    `height:${spec.core}px`,
    `border-radius:50%`,
    `background:${buildPearlBackground(color)}`,
    `border:1px solid ${color}b3`,
    `box-shadow:` +
      // Microhighlight inset para reforzar el "barniz" superior
      `inset 0 1px 1px rgba(255,255,255,0.35),` +
      // Inset sombra inferior para volumen
      `inset 0 -1px 1px rgba(0,0,0,0.22),` +
      // Drop shadow muy ceñida para "pegar" al mapa sin invadir
      `0 1px 2px rgba(0,0,0,0.32),` +
      // Halo color muy ceñido (1.5 px ≈ 30 km a z=2.5 → mínima invasión)
      `0 0 2px ${color}cc`,
    `box-sizing:border-box`,
    `display:block`,
  ].join(';');
}

function buildRadarStyle(color: string, spec: DotSpec): string {
  return [
    `position:absolute`,
    `top:50%`,
    `left:50%`,
    `width:${spec.radarBasePx * 2}px`,
    `height:${spec.radarBasePx * 2}px`,
    `border-radius:50%`,
    `border:${spec.radarStroke}px solid ${color}`,
    `background:transparent`,
    // El scale lo controla la animación; el translate -50/-50 lo COMPONE el
    // user agent porque la keyframe sobrescribe `transform`. Por eso usamos
    // margin-left/top negativos para centrar SIN tocar transform.
    `margin-left:-${spec.radarBasePx}px`,
    `margin-top:-${spec.radarBasePx}px`,
    `box-sizing:border-box`,
    `pointer-events:none`,
  ].join(';');
}

export function expertSparkleMarkerHtml(
  palette: SparklePalette,
  index: number,
  weight: 1 | 2 | 3,
  twinkle = false,
): string {
  const spec = DOT_SPECS[weight];
  const c = palette.primary;

  // Tamaño del wrapper = lo bastante para contener radar al pico (scale 2.0 sobre radarBasePx),
  // halo color (2px) y drop shadow. Mantenemos pointer-events:none para no robar clicks.
  const wrapperSize = spec.radarBasePx * 4 + 8;

  // Periodos y delays asíncronos por marker para "movimiento orgánico" sin sincronía
  const breatheDuration = `${3.4 + (index % 5) * 0.45}s`;
  const breatheDelay = `${(index * 0.41) % 4.1}s`;
  const radarDuration = `${2.6 + (index % 7) * 0.32}s`;
  const radarDelay = `${(index * 0.73) % 3.4}s`;

  const twinkleClass = twinkle ? ' expert-sparkle-twinkle' : '';

  const wrapperStyle = [
    `--sp-scale:1`,
    `--sp-breathe-dur:${breatheDuration}`,
    `--sp-breathe-delay:${breatheDelay}`,
    `--sp-radar-dur:${radarDuration}`,
    `--sp-radar-delay:${radarDelay}`,
    `position:relative`,
    `width:${wrapperSize}px`,
    `height:${wrapperSize}px`,
    `display:flex`,
    `align-items:center`,
    `justify-content:center`,
    `pointer-events:none`,
  ].join(';');

  const coreStyle = buildCoreStyle(c, spec);
  const radarStyle = buildRadarStyle(c, spec);

  // Estructura:
  //  <div .expert-sparkle-marker .expert-sparkle-pearl>     ← respira (scale 1↔1.08)
  //    <span .expert-sparkle-radar style="...">  ← onda radar (scale 0.7→2.0 + fade)
  //    <span style="...core 3D perla...">         ← núcleo estático centrado
  //  </div>
  //
  // El orden importa: el radar ANTES del core en el DOM para que el core
  // quede encima visualmente (z-index implícito por orden).
  return `
    <div class="expert-sparkle-marker expert-sparkle-pearl${twinkleClass}" style="${wrapperStyle}" aria-hidden="true">
      <span class="expert-sparkle-radar" style="${radarStyle}"></span>
      <span style="${coreStyle}"></span>
    </div>
  `;
}
