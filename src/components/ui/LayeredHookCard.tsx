import React from 'react';
import { ChevronRight } from 'lucide-react';

import { cn } from '../../lib/utils';

/** Superficie frontal — brand un poco más claro que bg-brand (44% L vs 40%). */
export const LAYERED_CARD_SURFACE = 'hsl(210 96% 44%)';
/** Capa clara del doble fondo — mismo matiz, estilo menta delivery. */
export const LAYERED_CARD_BACK_LAYER = 'hsl(210 85% 88%)';
export const LAYERED_CARD_BACK_PEEK_PX = 10;
export const LAYERED_CARD_BACK_INSET_X = '0.75rem';
/** Reserva en flujo para que la capa clara no invada el contenido siguiente. */
export const LAYERED_CARD_PEEK_RESERVE_CLASS = 'h-2.5 shrink-0';

/** Ganchitos tone-on-tone — trazo más claro que la superficie (ref. delivery). */
const LAYERED_CARD_HOOK_STROKE = 'hsl(210 72% 74% / 0.55)';

/**
 * Ganchitos decorativos — ref. tarjeta verde delivery:
 * Arco circular 90° por esquina; extremos fuera del cuadrado → entra/sale por dos bordes.
 * SVG cuadrado evita que el arco se aplaste al estirar la tarjeta.
 */
const LayeredHookCardDecor: React.FC = () => (
  <>
    <svg
      aria-hidden
      overflow="visible"
      className="pointer-events-none absolute left-0 top-0 aspect-square w-[56%] min-w-[7.5rem]"
      viewBox="0 0 200 200"
      preserveAspectRatio="xMinYMin slice"
    >
      <path
        d="M 72 -24 A 96 96 0 0 1 -24 72"
        fill="none"
        stroke={LAYERED_CARD_HOOK_STROKE}
        strokeWidth="42"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>

    <svg
      aria-hidden
      overflow="visible"
      className="pointer-events-none absolute bottom-0 right-0 aspect-square w-[60%] min-w-[8rem]"
      viewBox="0 0 200 200"
      preserveAspectRatio="xMaxYMax slice"
    >
      <path
        d="M 224 128 A 96 96 0 0 0 128 224"
        fill="none"
        stroke={LAYERED_CARD_HOOK_STROKE}
        strokeWidth="42"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </>
);

export interface LayeredHookCardProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  /** Avatar u otro elemento a la izquierda del bloque de texto. */
  leading?: React.ReactNode;
  /** hero = homepage; compact = ficha servicio (sin decor, menos padding). */
  variant?: 'hero' | 'compact';
  onClick?: () => void;
  className?: string;
  /** Etiqueta accesible cuando la tarjeta es interactiva. */
  ariaLabel?: string;
  /** Reserva inferior bajo la capa clara (homepage usa ritmo delivery 16px). */
  peekReserveClass?: string;
}

/**
 * Tarjeta móvil con doble capa + ganchitos decorativos + chevron a la derecha.
 * Patrón compartido: hero homepage y credenciales en ficha de servicio.
 */
export const LayeredHookCard: React.FC<LayeredHookCardProps> = ({
  title,
  subtitle,
  badge,
  leading,
  variant = 'hero',
  onClick,
  className,
  ariaLabel,
  peekReserveClass,
}) => {
  const interactive = Boolean(onClick);
  const CardTag = interactive ? 'button' : 'article';
  const isCompact = variant === 'compact';
  const peekReserveClassName =
    peekReserveClass ?? (isCompact ? 'h-1 shrink-0' : LAYERED_CARD_PEEK_RESERVE_CLASS);
  const peekPx = isCompact ? 4 : LAYERED_CARD_BACK_PEEK_PX;
  const backInset = isCompact ? '0.625rem' : LAYERED_CARD_BACK_INSET_X;

  return (
    <div className={cn('relative', className)}>
      <div className="relative">
        <div
          aria-hidden
          className={cn(
            'pointer-events-none absolute top-0 z-0',
            isCompact ? 'rounded-[14px]' : 'rounded-[16px] min-[390px]:rounded-[18px]',
          )}
          style={{
            left: backInset,
            right: backInset,
            background: LAYERED_CARD_BACK_LAYER,
            height: `calc(100% + ${peekPx}px)`,
          }}
        />

        {isCompact && leading ? (
          <div
            className={cn(
              'relative z-[1] flex w-full items-center gap-2 overflow-hidden bg-brand text-left shadow-[0_4px_24px_rgba(15,23,42,0.06)]',
              'rounded-2xl px-2.5 py-2',
            )}
          >
            {leading}
            {interactive ? (
              <button
                type="button"
                onClick={onClick}
                aria-label={ariaLabel}
                className="flex min-w-0 flex-1 items-center gap-1.5 border-none bg-transparent p-0 text-left transition-opacity hover:opacity-[0.97] active:opacity-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold leading-tight tracking-[-0.02em] text-white">
                    {title}
                  </span>
                  {subtitle ? (
                    <span className="mt-0.5 block text-[11px] leading-snug text-white/90">
                      {subtitle}
                    </span>
                  ) : null}
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-white/90" strokeWidth={2.25} aria-hidden />
              </button>
            ) : (
              <div className="min-w-0 flex-1">
                <p className="m-0 truncate text-sm font-semibold leading-tight tracking-[-0.02em] text-white">
                  {title}
                </p>
                {subtitle ? (
                  <div className="mt-0.5 text-[11px] leading-snug text-white/90">{subtitle}</div>
                ) : null}
              </div>
            )}
          </div>
        ) : (
        <CardTag
          type={interactive ? 'button' : undefined}
          onClick={onClick}
          aria-label={interactive ? ariaLabel : undefined}
          className={cn(
            'relative z-[1] w-full overflow-hidden text-left shadow-[0_4px_24px_rgba(15,23,42,0.06)]',
            isCompact
              ? 'rounded-2xl bg-brand px-3 py-2.5'
              : 'rounded-[18px] px-4 py-3.5 min-[390px]:rounded-[20px] min-[390px]:px-5 min-[390px]:py-4',
            interactive &&
              'cursor-pointer border-none transition-opacity hover:opacity-[0.97] active:opacity-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
          )}
          style={isCompact ? undefined : { background: LAYERED_CARD_SURFACE }}
        >
          {!isCompact ? <LayeredHookCardDecor /> : null}

          <div className="relative z-[1] flex items-start gap-2.5">
            {leading ? <div className="shrink-0">{leading}</div> : null}
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  'm-0 font-semibold leading-tight tracking-[-0.02em] text-white',
                  isCompact
                    ? 'truncate text-sm'
                    : 'text-base font-bold min-[390px]:text-[1.0625rem]',
                )}
              >
                {title}
              </p>
              {subtitle ? (
                <div
                  className={cn(
                    'mt-0.5 text-white',
                    isCompact
                      ? 'text-[11px] leading-snug'
                      : 'text-[0.8125rem] font-normal leading-snug',
                  )}
                >
                  {subtitle}
                </div>
              ) : null}
            </div>

            {interactive ? (
              <ChevronRight
                className={cn(
                  'shrink-0 text-white/90',
                  isCompact ? 'mt-0.5 h-4 w-4' : 'mt-0.5 h-5 w-5',
                )}
                strokeWidth={2.25}
                aria-hidden
              />
            ) : null}
          </div>

          {badge && !isCompact ? (
            <span className="relative mt-3 inline-flex max-w-full items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[0.6875rem] font-semibold leading-none text-brand min-[390px]:px-3 min-[390px]:py-1.5 min-[390px]:text-xs">
              {badge}
            </span>
          ) : null}
        </CardTag>
        )}
      </div>
      <div aria-hidden className={peekReserveClassName} />
    </div>
  );
};
