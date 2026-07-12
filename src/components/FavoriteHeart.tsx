import React, { useId, useRef, useEffect } from 'react';
import { MAP_LITERAL } from '../constants/designTokens';
import { motion, useReducedMotion } from 'framer-motion';

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
  const reduceMotion = useReducedMotion();
  const prevFilled = useRef(filled);
  const [pulseKey, setPulseKey] = React.useState(0);

  useEffect(() => {
    if (prevFilled.current !== filled) {
      setPulseKey((k) => k + 1);
      prevFilled.current = filled;
    }
  }, [filled]);

  const unfilledFill = variant === 'on-image' ? 'rgba(0, 0, 0, 0.35)' : 'none';
  const unfilledStroke = variant === 'on-image' ? 'rgba(255, 255, 255, 0.9)' : 'currentColor';

  const heartSvg = (
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
          <stop offset="0%" stopColor={MAP_LITERAL.brand} />
          <stop offset="100%" stopColor={MAP_LITERAL.brandAccent} />
        </linearGradient>
      </defs>
      <path d="m15.9998 28.6668c7.1667-4.8847 14.3334-10.8844 14.3334-18.1088 0-1.84951-.6993-3.69794-2.0988-5.10877-1.3996-1.4098-3.2332-2.11573-5.0679-2.11573-1.8336 0-3.6683.70593-5.0668 2.11573l-2.0999 2.11677-2.0999-2.11677c-1.3985-1.4098-3.2332-2.11573-5.0668-2.11573-1.8347 0-3.6683.70593-5.0679 2.11573-1.3996 1.41083-2.0988 3.25926-2.0988 5.10877 0 7.2244 7.1667 13.2241 14.3334 18.1088z" />
    </svg>
  );

  if (reduceMotion) {
    return heartSvg;
  }

  return (
    <motion.div
      key={pulseKey}
      initial={{ scale: 1 }}
      animate={{ scale: [1, 1.28, 1] }}
      transition={{ duration: 0.32, ease: [0.34, 1.56, 0.64, 1] }}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      {heartSvg}
    </motion.div>
  );
};
