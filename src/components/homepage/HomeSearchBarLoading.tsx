import React from 'react';

import {
  HP_MOBILE_HEADER_INSET_CLASS,
  HP_MOBILE_SEARCH_PILL_BASE_CLASS,
  HP_MOBILE_SEARCH_PILL_IDLE_BORDER_CLASS,
  HP_MOBILE_SEARCH_PILL_SHADOW,
} from '../../constants/homepageMobileRhythm';
import { HP_LOADING_DIMS } from './homeLoadingLayout';
import { MobileSearchPillIcon } from './MobileSearchPillIcon';

/** Header móvil — pill de búsqueda (misma silueta que MobileSearchPill). */
export const HomeSearchBarLoading: React.FC = () => (
  <>
    <header
      className="sticky top-0 z-50 md:hidden border-b border-transparent bg-white/95 backdrop-blur-sm supports-[backdrop-filter]:bg-white/90"
      aria-hidden
    >
      <div className={HP_MOBILE_HEADER_INSET_CLASS}>
        <div
          className={`${HP_MOBILE_SEARCH_PILL_BASE_CLASS} ${HP_MOBILE_SEARCH_PILL_IDLE_BORDER_CLASS}`}
          style={{
            height: HP_LOADING_DIMS.searchPillH,
            boxShadow: HP_MOBILE_SEARCH_PILL_SHADOW,
          }}
        >
          <MobileSearchPillIcon />
          <div className="min-w-0 flex-1 space-y-1">
            <div className="h-3.5 w-36 rounded bg-line-soft" />
            <div className="h-3 w-40 rounded bg-surface-tinted" />
          </div>
          <div className="h-4 w-4 shrink-0 rounded-sm bg-surface-tinted" aria-hidden />
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
