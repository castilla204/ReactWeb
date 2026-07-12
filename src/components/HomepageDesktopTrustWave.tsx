import React from 'react';
import { cn } from '../lib/utils';
import { ESCROW_TRUST_TAGLINE } from '../constants/escrowCopy';
import {
  TRUST_EASE,
  TrustDesktopPopover,
  useTrustPanel,
} from './homepageTrustShared';

/** Altura de la cresta = solape sobre el hero (debe coincidir con md:-mt-* del shell). */
export const HP_TRUST_WAVE_HEIGHT_CLASS = 'h-32';

/**
 * Ola de confianza desktop.
 *
 * El mensaje de confianza es el ANCLA: una cresta blanca localizada nace
 * alrededor del candado y vuelve suavemente al nivel de las cards. El resto
 * de la separación permanece casi horizontal para no competir con el hero.
 */
export const HomepageDesktopTrustWave: React.FC = () => {
  const { isOpen, cookiesAccepted, triggerRef, panelId, toggle, close } = useTrustPanel();

  if (!cookiesAccepted) return null;

  return (
    <TrustDesktopPopover isOpen={isOpen} panelId={panelId} onClose={close}>
      <div
        data-trust-wave
        className={cn('relative z-30 hidden w-full md:block', HP_TRUST_WAVE_HEIGHT_CLASS)}
      >
        {/* Cresta localizada: la curva sube, abraza el mensaje y vuelve a bajar. */}
        <svg
          viewBox="0 0 1440 128"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 h-full w-full"
          aria-hidden
        >
          <defs>
            <linearGradient id="trust-wave-edge" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--brand))" stopOpacity="0" />
              <stop offset="42%" stopColor="hsl(var(--brand))" stopOpacity="0.06" />
              <stop offset="62%" stopColor="hsl(var(--brand))" stopOpacity="0.46" />
              <stop offset="78%" stopColor="hsl(var(--brand))" stopOpacity="0.2" />
              <stop offset="100%" stopColor="hsl(var(--brand))" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            fill="white"
            d="M0 128 V108 C300 108 590 108 760 102 C830 99 854 66 900 34 C952 -2 1054 -4 1118 20 C1182 44 1200 86 1268 101 C1324 112 1382 108 1440 108 V128 Z"
          />
          <path
            d="M0 108 C300 108 590 108 760 102 C830 99 854 66 900 34 C952 -2 1054 -4 1118 20 C1182 44 1200 86 1268 101 C1324 112 1382 108 1440 108"
            fill="none"
            stroke="url(#trust-wave-edge)"
            strokeWidth="6"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            opacity="0.18"
          />
          <path
            d="M0 108 C300 108 590 108 760 102 C830 99 854 66 900 34 C952 -2 1054 -4 1118 20 C1182 44 1200 86 1268 101 C1324 112 1382 108 1440 108"
            fill="none"
            stroke="url(#trust-wave-edge)"
            strokeWidth="1.35"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        <button
          ref={triggerRef}
          type="button"
          onClick={toggle}
          tabIndex={isOpen ? -1 : 0}
          className={cn(
            'homepage-trust-wave group relative z-10 h-full w-full bg-transparent text-left',
            'touch-manipulation [-webkit-tap-highlight-color:transparent]',
            'focus-visible:outline-none',
            'motion-reduce:transition-none',
            TRUST_EASE,
          )}
          aria-label={`Compra protegida. Pago retenido. ${ESCROW_TRUST_TAGLINE}`}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          aria-controls={panelId}
        >
          <span className="sr-only">Transición a servicios</span>

          <span
            className={cn(
              // Mismo sistema de coordenadas que el SVG: 69,5 % del ancho completo.
              // Antes se calculaba dentro del max-width de las cards y quedaba desplazado.
              'absolute left-[70.75%] top-9 flex w-[20rem] -translate-x-1/2 flex-col items-center',
              'px-3 py-1.5 text-center',
              'group-focus-visible:outline group-focus-visible:outline-2',
              'group-focus-visible:outline-brand/35 group-focus-visible:outline-offset-2',
            )}
          >
              <span className="min-w-0 text-pretty">
                <span className="inline-flex items-center justify-center font-display text-[14px] font-semibold leading-[18px] text-ink-strong">
                  Compra protegida · Pago retenido
                </span>
                <span className="mt-0.5 block text-[11px] font-medium leading-[15px] text-ink">
                  {ESCROW_TRUST_TAGLINE}
                </span>
                <span className="block text-[10px] leading-[14px] text-ink-muted">
                  Peritos verificados · Informe con fotos y vídeo
                </span>
              </span>
          </span>
        </button>
      </div>
    </TrustDesktopPopover>
  );
};

export default HomepageDesktopTrustWave;
