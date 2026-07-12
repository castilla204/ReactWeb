import React from 'react';
import { HP_LOADING_DIMS } from './homeLoadingLayout';

/**
 * Header móvil — mismas cajas que AirbnbSearchBar (pill 56px + fila tabs).
 * Tabs: solo reserva de altura (sin iconos/labels dibujados).
 */
export const HomeSearchBarLoading: React.FC = () => (
  <>
    <header
      className="sticky top-0 z-50 md:hidden border-b border-line bg-white/95 backdrop-blur-sm supports-[backdrop-filter]:bg-white/90"
      style={{ top: 'env(safe-area-inset-top, 0px)' }}
      aria-hidden
    >
      <div className="px-4 pt-3.5 pb-1">
        <div
          className="relative w-full rounded-full border border-line bg-white overflow-hidden"
          style={{
            height: HP_LOADING_DIMS.searchPillH,
            boxShadow: HP_LOADING_DIMS.searchPillShadow,
          }}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-14">
            <div className="h-3.5 w-24 rounded bg-line-soft" />
            <div className="h-3 w-32 rounded bg-surface-tinted" />
          </div>
          <div className="absolute right-3 top-1/2 h-11 w-11 -translate-y-1/2 rounded-full bg-brand/10" />
        </div>
      </div>

      <div className="w-full" role="presentation">
        <div className="flex justify-center gap-4 min-[390px]:gap-5 px-2 pt-0 pb-0.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex w-[4.75rem] min-[390px]:w-[5.25rem] shrink-0 flex-col items-center border-b-2 border-transparent py-0"
            >
              <div
                className="h-12 w-12 min-[390px]:h-14 min-[390px]:w-14 rounded-full bg-surface-tinted"
                aria-hidden
              />
              <span
                className="-mt-0.5 block w-12 min-[390px]:w-14 rounded-sm bg-line-soft"
                style={{ height: HP_LOADING_DIMS.tabLabelH }}
                aria-hidden
              />
            </div>
          ))}
        </div>
      </div>
    </header>

    {/* Desktop: reserva el bloque completo del header/kayak para evitar saltos. */}
    <div className="hidden md:block" aria-hidden>
      <div className="min-h-12 bg-surface-tinted border-b border-line" />
      <div className="h-[400px] lg:h-[500px] xl:h-[520px] bg-surface-tinted" />
    </div>
  </>
);
