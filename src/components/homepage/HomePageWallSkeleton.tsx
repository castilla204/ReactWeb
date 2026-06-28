import React from 'react';
import { SileoSkeleton } from '../ui/sileo-skeleton';
import { HP_WALL_CARD_WIDTH_CLASS } from '../../constants/homepageTypography';

/**
 * Una fila del muro: cabecera de sección (título + flechas) + carril horizontal
 * de tarjetas. La geometría de cada tarjeta replica EXACTAMENTE la real
 * (HomepageWall.ServiceCard): mismo ancho responsive, imagen aspect-square en
 * móvil / 4·3 en desktop y 3 líneas de texto (título · meta · meta). Así el
 * contenido entra sin salto (CLS ≈ 0).
 */
const WallSkeletonRow: React.FC = () => (
  <div>
    {/* Cabecera: título + flechas de navegación (solo desktop, como la real) */}
    <div className="mb-2 md:mb-3 flex items-center justify-between gap-3">
      <SileoSkeleton className="h-7 w-44 max-w-[60%] rounded-lg" />
      <div className="hidden md:flex shrink-0 items-center gap-2">
        <SileoSkeleton className="h-9 w-9" rounded="full" />
        <SileoSkeleton className="h-9 w-9" rounded="full" />
      </div>
    </div>

    {/* Carril horizontal — overflow oculto: la última tarjeta "asoma" igual que
        en el muro real. 6 tarjetas cubren tanto móvil (asoman ~2,5) como desktop. */}
    <div className="flex gap-4 min-[428px]:gap-[18px] md:gap-3 overflow-hidden">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className={`shrink-0 ${HP_WALL_CARD_WIDTH_CLASS}`}>
          <SileoSkeleton className="aspect-square md:aspect-[4/3] w-full rounded-[20px] md:rounded-xl mb-1.5 md:mb-1" />
          <SileoSkeleton className="h-3.5 w-full rounded mb-1" />
          <SileoSkeleton className="h-3 w-[85%] rounded mb-1" />
          <SileoSkeleton className="h-3 w-3/5 rounded" />
        </div>
      ))}
    </div>
  </div>
);

/**
 * Contenido del skeleton del muro SIN contenedor de ancho. Refleja el layout
 * real: 2 secciones apiladas. Se usa dentro de HomepageWall (estados
 * loading/error/vacío), donde el contenedor `max-w-[1280px]` ya lo aporta el
 * caller. Los márgenes verticales (pt/mt) imitan los de `buildRenderedSections`.
 */
export const WallSkeletonContent: React.FC = () => (
  <>
    <div className="pt-1 min-[428px]:pt-2 md:pt-2">
      <WallSkeletonRow />
    </div>
    <div className="mt-5 md:mt-8">
      <WallSkeletonRow />
    </div>
  </>
);

/**
 * Skeleton del muro CON contenedor de ancho. Fallback del <Suspense> de
 * HomePage mientras baja el chunk de HomepageWall. Comparte exactamente la
 * misma estructura que el estado de carga interno → el cambio de un skeleton al
 * otro es imperceptible (sin parpadeo ni reflow).
 */
export const HomePageWallSkeleton: React.FC = () => (
  <div className="w-full max-w-[1280px] mx-auto px-4 md:px-6 lg:px-10 pt-0 md:pt-0 pb-1 md:pb-3">
    <WallSkeletonContent />
  </div>
);
