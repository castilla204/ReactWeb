import React from 'react';
import { SileoSkeleton } from '../ui/sileo-skeleton';
import {
  HomePageSearchBarSkeleton,
  HomePageSearchBarDesktopSkeleton,
} from './HomePageSearchBarSkeleton';
import { WallSkeletonContent } from './HomePageWallSkeleton';

/**
 * Skeleton de PÁGINA COMPLETA de la home. Fallback del <Suspense> de ruta
 * mientras baja el chunk de HomePage (antes se veía el spinner genérico
 * "Preparando página…").
 *
 * Un skeleton que replica el layout real reduce la espera percibida ~30% frente
 * a un spinner (el usuario ya "ve" dónde caerá el contenido) y evita el salto
 * visual: aquí reutilizamos EXACTAMENTE las mismas piezas que la HomePage usa en
 * sus Suspense internos (barra de búsqueda + muro), así que cuando el chunk
 * monta, el cambio de este skeleton al interno es imperceptible (sin parpadeo).
 */
export const HomePageSkeleton: React.FC = () => (
  <div
    className="min-h-screen md:min-h-0 bg-white"
    role="status"
    aria-busy="true"
    aria-label="Cargando página"
  >
    {/* Anuncio para lectores de pantalla (los bloques visuales son aria-hidden). */}
    <span className="sr-only">Cargando la página…</span>

    {/* Barra de búsqueda: móvil (pill + chips) y desktop (chips + pill + hero) */}
    <HomePageSearchBarSkeleton />
    <HomePageSearchBarDesktopSkeleton />

    {/* Hero móvil — banda de foto. `min-h-` (no `h-` fijo) para casar con el hero
        real (HomepageMobileHero usa min-h) y no empujar el panel al hacer el swap. */}
    <div className="md:hidden relative min-h-[168px] min-[390px]:min-h-[178px] overflow-hidden border-b border-[#e8e8e8]">
      <SileoSkeleton className="absolute inset-0 rounded-none" />
      {/* Fundido inferior hacia el panel blanco de servicios (cose la costura) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-7 bg-gradient-to-t from-white via-white/70 to-transparent"
      />
    </div>

    {/* Panel de servicios — mismo contenedor redondeado que la home real */}
    <div className="relative z-20 bg-white -mt-1.5 md:mt-0 md:rounded-t-2xl md:overflow-hidden pt-3 md:pt-8 pb-1 md:pb-10 md:shadow-[0_-2px_16px_rgba(15,23,42,0.05)]">
      <div className="w-full max-w-[1280px] mx-auto px-4 md:px-6 lg:px-10 pt-0 md:pt-0 pb-1 md:pb-0">
        <WallSkeletonContent />
      </div>
    </div>
  </div>
);

export default HomePageSkeleton;
