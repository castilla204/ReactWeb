/**
 * SpainCoverageMap
 *
 * Mapa de cobertura propio que reemplaza al SVG que se servía desde
 * `revisario.com/wp-content/uploads/2025/07/mapa-base-revisario.svg`
 * (CDN de un competidor directo listado como anti-referencia en PRODUCT.md).
 *
 * Estilo "stamp del despacho del perito" según DESIGN.md:
 *  · trazo único en azul de bolígrafo (#0066CC / var(--brand))
 *  · fill ultra-suave del país (α 0.06)
 *  · cuadrícula muy tenue dentro del contorno (sensación de papel pautado)
 *  · puntos firmados de 11 ciudades, halo al hover (cancelado con
 *    prefers-reduced-motion)
 *  · inset de Canarias en una caja contenida abajo a la izquierda
 *
 * Sin gradientes, sin glassmorphism, sin SVG remoto, sin dependencias
 * externas más allá de React.
 */
import { useEffect, useMemo, useState } from 'react';
import { MAP_LITERAL } from '../constants/designTokens';

interface SpainCoverageMapProps {
  className?: string;
}

interface City {
  name: string;
  cx: number;
  cy: number;
  /** Coloca el label a la izquierda del punto en vez de a la derecha */
  labelLeft?: boolean;
  /** Empuja verticalmente el label respecto al punto */
  labelDy?: number;
}

/**
 * Contorno simplificado de la España peninsular dibujado con curvas
 * cuadráticas suaves. No es cartográficamente exacto: es un sello
 * reconocible, no un mapa de navegación.
 *
 * viewBox = 0 0 720 720. La península ocupa de y≈90 a y≈465.
 */
const SPAIN_OUTLINE =
  'M 95 100 ' +
  'Q 165 85 295 95 ' +
  'Q 400 105 525 125 ' +
  'Q 605 145 645 170 ' +
  'L 685 215 ' +
  'Q 678 270 645 310 ' +
  'Q 605 365 565 405 ' +
  'Q 525 440 480 450 ' +
  'Q 400 463 305 463 ' +
  'Q 240 460 200 450 ' +
  'Q 170 435 150 405 ' +
  'Q 130 350 135 285 ' +
  'Q 140 225 125 175 ' +
  'Q 105 130 95 100 Z';

/** Islas Baleares como polígonos sueltos al este de Valencia. */
const BALEARES = [
  // Mallorca
  'M 640 358 Q 670 350 685 365 Q 680 380 655 378 Q 638 372 640 358 Z',
  // Menorca (NE de Mallorca)
  'M 690 335 Q 705 332 708 343 Q 700 348 690 343 Z',
  // Ibiza (SO de Mallorca)
  'M 615 390 Q 632 388 638 398 Q 628 405 615 400 Z',
];

/** Inset de Canarias: caja contenida con las siete islas principales. */
const CANARIAS_ISLANDS = [
  // La Palma
  'M 12 30 Q 22 27 22 42 Q 14 47 8 40 Z',
  // El Hierro (pequeña, bajo La Palma)
  'M 18 60 Q 28 58 28 68 Q 22 72 16 68 Z',
  // La Gomera
  'M 40 38 Q 50 36 52 48 Q 45 53 38 48 Z',
  // Tenerife (la más grande, triangular)
  'M 62 28 Q 88 22 96 40 Q 90 56 70 55 Q 56 42 62 28 Z',
  // Gran Canaria (circular)
  'M 110 38 Q 130 34 132 50 Q 126 64 112 60 Q 102 50 110 38 Z',
  // Fuerteventura (alargada)
  'M 162 25 Q 180 22 188 55 Q 178 62 162 50 Q 156 38 162 25 Z',
  // Lanzarote (al NE)
  'M 205 18 Q 222 14 228 28 Q 222 36 210 32 Z',
];

const PENINSULAR_CITIES: City[] = [
  { name: 'A Coruña', cx: 115, cy: 105, labelDy: -6 },
  { name: 'Bilbao', cx: 380, cy: 130, labelDy: -8 },
  { name: 'Valladolid', cx: 320, cy: 215, labelLeft: true },
  { name: 'Zaragoza', cx: 510, cy: 220, labelDy: -8 },
  { name: 'Barcelona', cx: 640, cy: 230 },
  { name: 'Madrid', cx: 380, cy: 285 },
  { name: 'Valencia', cx: 570, cy: 355 },
  { name: 'Palma', cx: 665, cy: 367 },
  { name: 'Sevilla', cx: 260, cy: 415, labelLeft: true },
  { name: 'Málaga', cx: 320, cy: 440, labelDy: 14 },
];

/** Coords (cx, cy) del dot de Las Palmas DENTRO del inset de Canarias. */
const LAS_PALMAS = { cx: 121, cy: 48 };

/**
 * Hook simple para `prefers-reduced-motion`. No usa libs externas y no rompe
 * en SSR — el primer render asume `false` (motion activa), y `useEffect`
 * sincroniza con la media query en cliente.
 */
function usePrefersReducedMotion(): boolean {
  const [prefers, setPrefers] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setPrefers(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return prefers;
}

export default function SpainCoverageMap({ className }: SpainCoverageMapProps) {
  const [activeCity, setActiveCity] = useState<string | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  // El path del contorno también se usa como clipPath; lo memoizamos por
  // limpieza, no por coste.
  const outlinePath = useMemo(() => SPAIN_OUTLINE, []);

  return (
    <div
      className={['flex h-full w-full items-center justify-center', className]
        .filter(Boolean)
        .join(' ')}
    >
      <svg
        viewBox="0 0 720 720"
        preserveAspectRatio="xMidYMid meet"
        className="block h-auto w-full max-w-full"
        role="img"
        aria-label="Mapa de cobertura de revisiones en España"
        style={{
          fontFamily:
            "Manrope, 'SF Pro Display', system-ui, -apple-system, 'Helvetica Neue', sans-serif",
        }}
      >
        <defs>
          {/* Cuadrícula muy sutil — papel pautado del despacho del perito */}
          <pattern
            id="ds-spain-grid"
            width="32"
            height="32"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 32 0 L 0 0 0 32"
              fill="none"
              stroke="rgba(28, 28, 28, 0.05)"
              strokeWidth="1"
            />
          </pattern>

          {/* La cuadrícula sólo se ve dentro del país */}
          <clipPath id="ds-spain-clip">
            <path d={outlinePath} />
            {BALEARES.map((d, i) => (
              <path key={`bal-clip-${i}`} d={d} />
            ))}
          </clipPath>
        </defs>

        {/* Cuadrícula recortada al país */}
        <g clipPath="url(#ds-spain-clip)">
          <rect x="0" y="0" width="720" height="720" fill="url(#ds-spain-grid)" />
        </g>

        {/* Península */}
        <path
          d={outlinePath}
          fill={MAP_LITERAL.brandFill}
          stroke={MAP_LITERAL.brand}
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Baleares */}
        {BALEARES.map((d, i) => (
          <path
            key={`bal-${i}`}
            d={d}
            fill={MAP_LITERAL.brandFill}
            stroke={MAP_LITERAL.brand}
            strokeWidth="1.25"
            strokeLinejoin="round"
          />
        ))}

        {/* Marca de norte tenue, esquina superior derecha */}
        <g transform="translate(670 110)" opacity="0.5" aria-hidden="true">
          <polygon points="0,-14 -4,-4 4,-4" fill={MAP_LITERAL.inkStrong} />
          <line x1="0" y1="-4" x2="0" y2="8" stroke={MAP_LITERAL.inkStrong} strokeWidth="1.25" />
          <text
            x="0"
            y="-18"
            textAnchor="middle"
            fontSize="9"
            fontWeight="600"
            fill={MAP_LITERAL.inkStrong}
            letterSpacing="0.5"
          >
            N
          </text>
        </g>

        {/* Inset de Canarias, abajo-izquierda */}
        <g transform="translate(40 555)">
          {/* Marco fino del inset */}
          <rect
            x="0"
            y="0"
            width="252"
            height="110"
            rx="6"
            fill={MAP_LITERAL.coastHalo}
            stroke={MAP_LITERAL.lineSoft}
            strokeWidth="1"
          />
          {/* Etiqueta del inset (único uppercase del componente) */}
          <text
            x="10"
            y="100"
            fontSize="9"
            fontWeight="600"
            letterSpacing="1.2"
            fill={MAP_LITERAL.inkMid}
            style={{ textTransform: 'uppercase' }}
          >
            Canarias
          </text>
          {/* Islas */}
          {CANARIAS_ISLANDS.map((d, i) => (
            <path
              key={`can-${i}`}
              d={d}
              fill="rgba(0, 102, 204, 0.06)"
              stroke={MAP_LITERAL.brand}
              strokeWidth="1"
              strokeLinejoin="round"
            />
          ))}
          {/* Dot de Las Palmas sobre Gran Canaria */}
          <circle cx={LAS_PALMAS.cx} cy={LAS_PALMAS.cy} r="3.5" fill={MAP_LITERAL.brand} />
          <circle cx={LAS_PALMAS.cx} cy={LAS_PALMAS.cy} r="1.25" fill={MAP_LITERAL.coastHalo} />
          <text
            x={LAS_PALMAS.cx + 7}
            y={LAS_PALMAS.cy + 3}
            fontSize="10"
            fontWeight="500"
            fill={MAP_LITERAL.inkStrong}
          >
            Las Palmas
          </text>
        </g>

        {/* Ciudades peninsulares */}
        <g>
          {PENINSULAR_CITIES.map((city) => {
            const isActive = activeCity === city.name;
            const textAnchor = city.labelLeft ? 'end' : 'start';
            const textX = city.labelLeft ? city.cx - 8 : city.cx + 8;
            const textY = city.cy + (city.labelDy ?? 4);

            return (
              <g
                key={city.name}
                onMouseEnter={() => setActiveCity(city.name)}
                onMouseLeave={() => setActiveCity(null)}
                onFocus={() => setActiveCity(city.name)}
                onBlur={() => setActiveCity(null)}
                tabIndex={0}
                style={{ cursor: 'default', outline: 'none' }}
              >
                {/* Hit-area invisible para hover/focus generoso */}
                <circle
                  cx={city.cx}
                  cy={city.cy}
                  r="14"
                  fill="transparent"
                />

                {/* Halo expansivo, sólo si reducedMotion no está activo */}
                {isActive && !reducedMotion && (
                  <circle cx={city.cx} cy={city.cy} fill={MAP_LITERAL.brand} opacity="0">
                    <animate
                      attributeName="r"
                      from="5"
                      to="18"
                      dur="1.4s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      from="0.4"
                      to="0"
                      dur="1.4s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}

                {/* Dot principal: anillo brand + centro blanco (sello de bolígrafo) */}
                <circle
                  cx={city.cx}
                  cy={city.cy}
                  r={isActive ? 5 : 4}
                  fill={MAP_LITERAL.brand}
                  style={{
                    transition: 'r 200ms cubic-bezier(0.22, 1, 0.36, 1)',
                  }}
                />
                <circle cx={city.cx} cy={city.cy} r="1.5" fill={MAP_LITERAL.coastHalo} />

                {/* Nombre de la ciudad */}
                <text
                  x={textX}
                  y={textY}
                  fontSize="12"
                  fontWeight={isActive ? 600 : 500}
                  fill={isActive ? MAP_LITERAL.brand : MAP_LITERAL.inkStrong}
                  textAnchor={textAnchor}
                  style={{
                    transition:
                      'fill 200ms cubic-bezier(0.22, 1, 0.36, 1), font-weight 200ms cubic-bezier(0.22, 1, 0.36, 1)',
                  }}
                >
                  {city.name}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
