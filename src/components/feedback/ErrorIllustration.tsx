import React from 'react';

/**
 * Ilustraciones de estado con volumen (estilo "clay/3D"): gradientes radiales con
 * foco de luz arriba-izquierda, sombra proyectada difuminada y rim highlight. NO son
 * SVG planos dibujados a mano. El color de marca viene de la variable CSS --brand,
 * así un rebrand se propaga solo.
 *
 * Si en el futuro se generan PNG 3D reales, basta pasar <ErrorState illustration={...}/>
 * con un <img/>; este componente es el fallback por defecto y la fuente de estilo.
 */

export type IllustrationVariant = 'generic' | 'notFound' | 'serverDown' | 'offline';

interface Props {
  variant?: IllustrationVariant;
  /** Lado del lienzo en px. Por defecto 176. */
  size?: number;
  className?: string;
}

const BRAND = 'hsl(var(--brand))';
const BRAND_DEEP = 'hsl(var(--brand) / 0.85)';

/** Defs compartidas: una sombra blanda y un degradado neutro de "loza". */
const SharedDefs: React.FC<{ id: string }> = ({ id }) => (
  <defs>
    <filter id={`${id}-soft`} x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="6" />
    </filter>
    <radialGradient id={`${id}-clay`} cx="38%" cy="30%" r="80%">
      <stop offset="0%" stopColor="#ffffff" />
      <stop offset="45%" stopColor="#eef2f7" />
      <stop offset="100%" stopColor="#cfd8e3" />
    </radialGradient>
    <linearGradient id={`${id}-brand`} x1="20%" y1="10%" x2="80%" y2="95%">
      <stop offset="0%" stopColor={BRAND} />
      <stop offset="100%" stopColor={BRAND_DEEP} />
    </linearGradient>
  </defs>
);

/** Sombra proyectada elíptica bajo el objeto. */
const GroundShadow: React.FC<{ id: string }> = ({ id }) => (
  <ellipse cx="100" cy="168" rx="58" ry="12" fill="#0f172a" opacity="0.12" filter={`url(#${id}-soft)`} />
);

const Generic: React.FC<{ id: string }> = ({ id }) => (
  <>
    <GroundShadow id={id} />
    {/* disco base con volumen */}
    <circle cx="100" cy="92" r="64" fill={`url(#${id}-clay)`} />
    <circle cx="100" cy="92" r="64" fill="none" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="1.5" />
    {/* burbuja de marca con el signo */}
    <circle cx="100" cy="92" r="40" fill={`url(#${id}-brand)`} />
    <circle cx="100" cy="92" r="40" fill="none" stroke="#ffffff" strokeOpacity="0.25" strokeWidth="2" />
    {/* highlight superior */}
    <ellipse cx="88" cy="74" rx="18" ry="10" fill="#ffffff" opacity="0.35" />
    {/* signo de exclamación */}
    <rect x="95" y="72" width="10" height="26" rx="5" fill="#ffffff" />
    <circle cx="100" cy="110" r="5.5" fill="#ffffff" />
  </>
);

const NotFound: React.FC<{ id: string }> = ({ id }) => (
  <>
    <GroundShadow id={id} />
    {/* lente: anillo de marca con cristal */}
    <circle cx="86" cy="80" r="46" fill={`url(#${id}-brand)`} />
    <circle cx="86" cy="80" r="34" fill={`url(#${id}-clay)`} />
    <circle cx="86" cy="80" r="34" fill="#bcd4f0" opacity="0.35" />
    <ellipse cx="74" cy="66" rx="14" ry="8" fill="#ffffff" opacity="0.55" />
    {/* mango con volumen */}
    <rect
      x="116"
      y="110"
      width="20"
      height="46"
      rx="10"
      transform="rotate(-45 126 133)"
      fill={`url(#${id}-brand)`}
    />
    {/* 404 sutil dentro del cristal */}
    <text
      x="86"
      y="88"
      textAnchor="middle"
      fontFamily="Montserrat, sans-serif"
      fontWeight="800"
      fontSize="26"
      fill={BRAND}
      opacity="0.9"
    >
      404
    </text>
  </>
);

const ServerDown: React.FC<{ id: string }> = ({ id }) => (
  <>
    <GroundShadow id={id} />
    {/* dos racks apilados con profundidad */}
    <rect x="56" y="58" width="88" height="36" rx="10" fill={`url(#${id}-clay)`} />
    <rect x="56" y="58" width="88" height="36" rx="10" fill="none" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="1.5" />
    <rect x="56" y="100" width="88" height="36" rx="10" fill={`url(#${id}-brand)`} />
    <ellipse cx="78" cy="68" rx="14" ry="5" fill="#ffffff" opacity="0.4" />
    {/* leds */}
    <circle cx="70" cy="76" r="4" fill={BRAND} />
    <circle cx="84" cy="76" r="4" fill="#cbd5e1" />
    <circle cx="70" cy="118" r="4" fill="#ffffff" opacity="0.9" />
    <circle cx="84" cy="118" r="4" fill="#ffffff" opacity="0.5" />
    {/* enchufe desconectado */}
    <path d="M122 124 q14 6 14 20" fill="none" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" />
    <circle cx="138" cy="148" r="7" fill={`url(#${id}-clay)`} stroke="#94a3b8" strokeWidth="3" />
  </>
);

const Offline: React.FC<{ id: string }> = ({ id }) => (
  <>
    <GroundShadow id={id} />
    {/* nube con volumen */}
    <path
      d="M64 116 a30 30 0 0 1 6 -59 a34 34 0 0 1 64 8 a26 26 0 0 1 -4 51 z"
      fill={`url(#${id}-clay)`}
    />
    <path
      d="M64 116 a30 30 0 0 1 6 -59 a34 34 0 0 1 64 8 a26 26 0 0 1 -4 51 z"
      fill="none"
      stroke="#ffffff"
      strokeOpacity="0.6"
      strokeWidth="1.5"
    />
    <ellipse cx="86" cy="74" rx="18" ry="9" fill="#ffffff" opacity="0.5" />
    {/* ondas wifi en marca */}
    <path d="M82 108 a26 26 0 0 1 36 0" fill="none" stroke={BRAND} strokeWidth="5" strokeLinecap="round" />
    <path d="M91 117 a14 14 0 0 1 18 0" fill="none" stroke={BRAND} strokeWidth="5" strokeLinecap="round" />
    <circle cx="100" cy="126" r="4.5" fill={BRAND} />
    {/* barra de "sin conexión" */}
    <line x1="70" y1="62" x2="132" y2="124" stroke="#ef4444" strokeWidth="6" strokeLinecap="round" opacity="0.85" />
  </>
);

const VARIANTS: Record<IllustrationVariant, React.FC<{ id: string }>> = {
  generic: Generic,
  notFound: NotFound,
  serverDown: ServerDown,
  offline: Offline,
};

export const ErrorIllustration: React.FC<Props> = ({ variant = 'generic', size = 176, className = '' }) => {
  // id estable por variante para no colisionar defs entre instancias.
  const id = `ill-${variant}`;
  const Scene = VARIANTS[variant];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="presentation"
      aria-hidden="true"
      className={className}
    >
      <SharedDefs id={id} />
      <Scene id={id} />
    </svg>
  );
};

export default ErrorIllustration;
