import React from 'react';
import { SileoSkeleton } from '../ui/sileo-skeleton';
import { SD_PAGE_INNER_MAX_CLASS } from '../../constants/homepageTypography';

/** Placeholder ligero mientras carga AirbnbSearchBar — ahora con shimmer unificado. */
export const HomePageSearchBarSkeleton: React.FC = () => (
  <div className="md:hidden sticky top-0 z-40 bg-white border-b border-[#ebebeb]">
    <div className="px-4 pt-3 pb-2 space-y-3">
      <SileoSkeleton className="h-10 w-full rounded-full" />
      <div className="flex justify-center gap-5 min-[390px]:gap-6 px-2">
        {[1, 2, 3].map((i) => (
          <SileoSkeleton
            key={i}
            className="h-[4.25rem] w-[5.25rem] min-[390px]:h-[4.75rem] min-[390px]:w-24 rounded-md"
          />
        ))}
      </div>
    </div>
  </div>
);

/**
 * Skeleton desktop de la cabecera de la home. Replica el layout REAL que pinta
 * AirbnbSearchBar en desktop (topbar + hero de mapa), no la barra centrada
 * antigua:
 *   1. Topbar 48px (#fafafa): logo a la izquierda (erizo + wordmark) y fila de
 *      acciones circulares + botón de cuenta a la derecha.
 *   2. Hero ~400/500/520px sobre el mapa: bloque de texto alineado a la izquierda
 *      (eyebrow · título grande a 2 líneas · cuerpo · pestañas de categoría · CTA
 *      "Buscar en el mapa"). El resto es el área del mapa (pulse suave).
 * Así el salto skeleton → contenido real es imperceptible (sin reflow ni cambio
 * de composición).
 */
export const HomePageSearchBarDesktopSkeleton: React.FC = () => (
  <div className="hidden md:block">
    {/* Topbar 48px */}
    <div className="bg-[#fafafa]">
      <div className={`${SD_PAGE_INNER_MAX_CLASS} flex min-h-12 items-center justify-between gap-4`}>
        {/* Logo: icono + wordmark */}
        <div className="flex items-center gap-2">
          <SileoSkeleton className="h-9 w-9" rounded="full" />
          <SileoSkeleton className="h-5 w-28 rounded" />
        </div>
        {/* Acciones: ayuda · moneda · campana · botón de cuenta */}
        <div className="flex items-center gap-2">
          <SileoSkeleton className="h-8 w-8" rounded="full" />
          <SileoSkeleton className="h-8 w-8" rounded="full" />
          <SileoSkeleton className="h-8 w-8" rounded="full" />
          <SileoSkeleton className="h-8 w-28 rounded-full" />
        </div>
      </div>
    </div>

    {/* Hero de mapa con bloque de texto a la izquierda */}
    <div className="relative h-[400px] lg:h-[500px] xl:h-[520px] overflow-hidden border-b border-[#e8e8e8] bg-[#eef2f5]">
      {/* Área del mapa (pulse muy suave, sin shimmer para no competir con el texto).
          motion-safe → se queda quieto si el usuario pide menos movimiento. */}
      <div aria-hidden className="absolute inset-0 motion-safe:animate-pulse bg-[#f0f4f7]/70" />

      {/* Bloque de contenido alineado a la izquierda, centrado verticalmente */}
      <div className="relative h-full">
        <div className={`${SD_PAGE_INNER_MAX_CLASS} flex h-full items-center`}>
          <div className="w-full max-w-[34rem] space-y-3">
            {/* Eyebrow */}
            <SileoSkeleton className="h-4 w-44 rounded" />
            {/* Título grande (2 líneas) */}
            <div className="space-y-2 pt-1">
              <SileoSkeleton className="h-9 lg:h-10 w-[85%] rounded-lg" />
              <SileoSkeleton className="h-9 lg:h-10 w-[60%] rounded-lg" />
            </div>
            {/* Cuerpo (2 líneas) */}
            <div className="space-y-2 pt-1">
              <SileoSkeleton className="h-4 w-[78%] rounded" />
              <SileoSkeleton className="h-4 w-[52%] rounded" />
            </div>
            {/* Pestañas de categoría */}
            <div className="flex flex-wrap gap-2 pt-2">
              {['w-24', 'w-20', 'w-28', 'w-24'].map((w, i) => (
                <SileoSkeleton key={i} className={`h-9 ${w} rounded-full`} />
              ))}
            </div>
            {/* CTA "Buscar en el mapa" */}
            <SileoSkeleton className="h-11 w-44 rounded-full mt-1" />
          </div>
        </div>
      </div>
    </div>
  </div>
);
