import React from 'react';
import { Search } from 'lucide-react';

import { HP_MOBILE_HEADER_INSET_CLASS } from '../../constants/homepageMobileRhythm';
import { HP_LOADING_DIMS } from './homeLoadingLayout';

/** Header móvil — pill de búsqueda estilo delivery (icono + texto alineado a la izquierda). */
export const HomeSearchBarLoading: React.FC = () => (
  <>
    <header
      className="sticky top-0 z-50 md:hidden border-b border-transparent bg-white/95 backdrop-blur-sm supports-[backdrop-filter]:bg-white/90"
      style={{ top: 'env(safe-area-inset-top, 0px)' }}
      aria-hidden
    >
      <div className={HP_MOBILE_HEADER_INSET_CLASS}>
        <div
          className="relative flex w-full items-center gap-3 rounded-full border border-line bg-white px-4"
          style={{
            height: HP_LOADING_DIMS.searchPillH,
            boxShadow: HP_LOADING_DIMS.searchPillShadow,
          }}
        >
          <Search className="h-5 w-5 shrink-0 text-line" strokeWidth={2} aria-hidden />
          <div className="min-w-0 flex-1 space-y-1">
            <div className="h-3.5 w-28 rounded bg-line-soft" />
            <div className="h-3 w-40 rounded bg-surface-tinted" />
          </div>
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
