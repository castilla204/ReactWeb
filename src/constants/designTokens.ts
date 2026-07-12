/**
 * Tokens de diseño Inspecciono (DESIGN.md).
 * Usar en className (Tailwind) o en style={{ color: INK.strong }}.
 */
export const INK = {
  strong: 'hsl(var(--ink-strong))',
  DEFAULT: 'hsl(var(--ink))',
  muted: 'hsl(var(--ink-muted))',
  soft: 'hsl(var(--ink-soft))',
} as const;

export const SURFACE = {
  DEFAULT: 'hsl(var(--surface))',
  tinted: 'hsl(var(--surface-tinted))',
} as const;

export const LINE = {
  DEFAULT: 'hsl(var(--line))',
  soft: 'hsl(var(--line-soft))',
} as const;

export const SUCCESS = {
  DEFAULT: 'hsl(var(--success))',
  hover: 'hsl(var(--success-hover))',
  tint: 'hsl(var(--success-tint))',
  border: 'hsl(var(--success-border))',
} as const;

/** Clases tipográficas del ramp DESIGN.md */
export const TYPE = {
  badge: 'text-badge',
  kicker: 'text-kicker',
  caption: 'text-caption',
  meta: 'text-meta',
  body: 'text-body',
  lead: 'text-lead',
  subtitle: 'text-subtitle',
  title: 'text-title',
  headline: 'text-headline',
} as const;

export const AVAIL = {
  free: 'hsl(var(--avail-free))',
  low: 'hsl(var(--avail-low))',
  full: 'hsl(var(--avail-full))',
} as const;

/**
 * Literales hex para MapLibre / SVG (no aceptan CSS vars en paint).
 * Mantener sincronizado con --brand y --map-* en index.css.
 */
export const MAP_LITERAL = {
  sky: '#dce9f2',
  skyMuted: '#e8f0f7',
  land: '#ebe8e3',
  brand: '#0066CC',
  coastHalo: '#ffffff',
  border: '#d1c4c6',
  inkStrong: '#171717',
  brandMid: '#3d9ae8',
  warning: '#F59E0B',
  brandAccent: '#FFC107',
  inkMuted: '#737373',
  inkSoft: '#8a8a8a',
  lineMid: '#c8c8c8',
  surfaceMuted: '#eceff3',
  lineSoft: '#e8e8e8',
  inkMid: '#6a6a6a',
  brandFill: 'rgba(0, 102, 204, 0.06)',
} as const;

/** Gradientes compartidos — literales para style/background inline */
export const GRADIENT = {
  checkoutTitleUnderline: `linear-gradient(to right, ${MAP_LITERAL.brand} 0%, ${MAP_LITERAL.brandMid} 38%, ${MAP_LITERAL.warning} 100%)`,
  panelLegacy:
    `linear-gradient(155deg, ${MAP_LITERAL.skyMuted} 0%, #e5f0fa 28%, #f5f9fd 52%, #fff9f2 82%, #fafafa 100%)`,
  mapTutorialBg: `radial-gradient(ellipse 85% 70% at 58% 42%, ${MAP_LITERAL.land} 0%, #e8e4dc 38%, transparent 72%), radial-gradient(ellipse 55% 45% at 22% 68%, #d4e8c8 0%, transparent 62%), linear-gradient(180deg, ${MAP_LITERAL.skyMuted} 0%, ${MAP_LITERAL.sky} 100%)`,
} as const;

/** Sustituciones Tailwind para migración de hex hardcodeados */
export const TW = {
  inkStrong: 'text-ink-strong',
  ink: 'text-ink',
  inkMuted: 'text-ink-muted',
  inkSoft: 'text-ink-soft',
  bgSurface: 'bg-surface',
  bgSurfaceTinted: 'bg-surface-tinted',
  borderLine: 'border-line',
  borderLineSoft: 'border-line-soft',
  bgSuccess: 'bg-success',
  textSuccess: 'text-success',
} as const;
