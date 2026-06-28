import React, { useId } from 'react';

interface FavoriteHeartProps {
  /** Marcado como favorito → corazón relleno con el degradado de marca. */
  filled: boolean;
  /** Tamaño en px (lado del SVG). Por defecto 24. */
  size?: number;
  /**
   * Aspecto del estado SIN marcar:
   * - 'on-image' (por defecto): relleno negro translúcido + contorno blanco, legible sobre fotos.
   * - 'plain': sin relleno, contorno = currentColor, para botones sobre fondo sólido/blanco.
   */
  variant?: 'on-image' | 'plain';
  className?: string;
}

/**
 * Corazón de favorito UNIFICADO en toda la app. El estado marcado siempre usa el
 * mismo degradado azul→amarillo de marca, sea cual sea la página (homepage, mapa,
 * ficha, favoritos…). El degradado lleva un id único por instancia (useId) para que
 * no colisionen los <linearGradient> cuando hay muchos corazones en pantalla.
 */
export const FavoriteHeart: React.FC<FavoriteHeartProps> = ({
  filled,
  size = 24,
  variant = 'on-image',
  className,
}) => {
  const gradientId = `fav-grad-${useId().replace(/:/g, '')}`;

  const unfilledFill = variant === 'on-image' ? 'rgba(0, 0, 0, 0.35)' : 'none';
  const unfilledStroke = variant === 'on-image' ? 'rgba(255, 255, 255, 0.9)' : 'currentColor';

  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      role="presentation"
      focusable="false"
      className={className}
      style={{
        display: 'block',
        fill: filled ? `url(#${gradientId})` : unfilledFill,
        stroke: filled ? `url(#${gradientId})` : unfilledStroke,
        strokeWidth: 2,
        overflow: 'visible',
      }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0066CC" />
          <stop offset="100%" stopColor="#FFC107" />
        </linearGradient>
      </defs>
      <path d="m15.9998 28.6668c7.1667-4.8847 14.3334-10.8844 14.3334-18.1088 0-1.84951-.6993-3.69794-2.0988-5.10877-1.3996-1.4098-3.2332-2.11573-5.0679-2.11573-1.8336 0-3.6683.70593-5.0668 2.11573l-2.0999 2.11677-2.0999-2.11677c-1.3985-1.4098-3.2332-2.11573-5.0668-2.11573-1.8347 0-3.6683.70593-5.0679 2.11573-1.3996 1.41083-2.0988 3.25926-2.0988 5.10877 0 7.2244 7.1667 13.2241 14.3334 18.1088z" />
    </svg>
  );
};
