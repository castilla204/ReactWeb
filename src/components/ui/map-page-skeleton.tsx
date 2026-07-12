import { SileoSkeleton } from './sileo-skeleton';
import { SD_PAGE_INNER_MAX_CLASS } from '../../constants/homepageTypography';

/**
 * Skeleton del paso "mapa" (crear-busqueda).
 * Replica la estructura REAL:
 * - Móvil: mapa full + header flotante + franja inferior plegable (MapResultsSheet).
 * - Desktop: topbar 48px (HomepageDesktopTopBar) + mapa + strip flotante de tarjetas.
 *
 * Nota de contraste: `SileoSkeleton` usa `bg-surface-tinted` (#fafafa) como relleno
 * por defecto. Sobre fondos claros (topbar, bottom sheet, tarjetas blancas) ese
 * relleno es casi invisible — por eso las piezas que viven sobre `bg-surface-tinted`
 * o `bg-white` fuerzan `GHOST_ON_LIGHT` para tener contraste real y no salir "en blanco".
 * Sobre el mapa (bg-map-sky) el relleno por defecto ya contrasta y se deja tal cual.
 */
const GHOST_ON_LIGHT = 'bg-[#e4e4e4]';

export function MapPageSkeleton() {
  return (
    <div
      className="fixed inset-0 z-[99999] bg-surface-tinted"
      style={{ pointerEvents: 'none' }}
      aria-busy="true"
      aria-label="Cargando mapa"
    >
      {/* Mobile */}
      <div className="md:hidden relative h-full w-full overflow-hidden">
        <div className="absolute inset-0 bg-map-sky-muted">
          <SileoSkeleton className="absolute inset-0 rounded-none opacity-80" rounded="none" />
          {/* Pins fantasma para que el mapa no se vea vacío */}
          <SileoSkeleton className="absolute left-[22%] top-[36%] h-7 w-14 rounded-full" rounded="full" />
          <SileoSkeleton className="absolute left-[58%] top-[44%] h-7 w-12 rounded-full" rounded="full" />
          <SileoSkeleton className="absolute left-[39%] top-[58%] h-7 w-16 rounded-full" rounded="full" />
        </div>

        {/* Header móvil flotante */}
        <div className="absolute inset-x-0 top-0 z-20 px-5 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2">
          <div className="flex items-center gap-2">
            <SileoSkeleton className="h-11 w-11 rounded-full shrink-0" rounded="full" />
            <SileoSkeleton className="h-11 flex-1 rounded-full" rounded="full" />
          </div>
        </div>

        {/* Franja inferior estilo MapResultsSheet (colapsada) */}
        <div className="absolute inset-x-0 bottom-0 z-20">
          <div className="rounded-t-2xl bg-surface-tinted shadow-[0_-4px_20px_rgba(0,0,0,0.10)]">
            <div
              className="px-3.5 pt-2.5 pb-2.5"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.625rem)' }}
            >
              <div className="flex items-center gap-2.5">
                <div className="flex shrink-0 -space-x-2">
                  <SileoSkeleton className={`h-6 w-6 rounded-full ring-2 ring-white ${GHOST_ON_LIGHT}`} rounded="full" />
                  <SileoSkeleton className={`h-6 w-6 rounded-full ring-2 ring-white ${GHOST_ON_LIGHT}`} rounded="full" />
                  <SileoSkeleton className={`h-6 w-6 rounded-full ring-2 ring-white ${GHOST_ON_LIGHT}`} rounded="full" />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <SileoSkeleton className={`h-4 w-28 rounded ${GHOST_ON_LIGHT}`} />
                  <SileoSkeleton className={`h-3 w-40 max-w-full rounded ${GHOST_ON_LIGHT}`} />
                </div>
                <SileoSkeleton className={`h-5 w-5 rounded-full ${GHOST_ON_LIGHT}`} rounded="full" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden md:flex h-full w-full flex-col overflow-hidden">
        {/* Topbar 48px — mismo chrome que HomepageDesktopTopBar (bg-surface-tinted, sin borde,
            contenedor SD_PAGE_INNER_MAX_CLASS): logo a la izquierda, iconos a la derecha. */}
        <div className="bg-surface-tinted">
          <div className={`${SD_PAGE_INNER_MAX_CLASS} flex min-h-12 items-center justify-between gap-4`}>
            <SileoSkeleton className={`h-5 w-32 rounded ${GHOST_ON_LIGHT}`} />
            <div className="flex shrink-0 items-center gap-2">
              <div className="h-8 w-8 rounded-full border border-line bg-white" />
              <div className="h-8 w-8 rounded-full border border-line bg-white" />
              <div className="h-8 w-8 rounded-full border border-line bg-white" />
              <div className="h-8 w-24 rounded-full border border-line bg-white" />
            </div>
          </div>
        </div>

        <div className="relative min-h-0 flex-1 overflow-hidden bg-surface-tinted">
          {/* Mapa */}
          <div className="absolute inset-0 px-5 pt-4 pb-5 xl:px-6 xl:pb-6">
            <div className="relative h-full w-full overflow-hidden rounded-2xl bg-map-sky ring-1 ring-black/[0.06]">
              <SileoSkeleton className="absolute inset-0 rounded-none opacity-80" rounded="none" />
              <SileoSkeleton className="absolute left-[18%] top-[26%] h-7 w-16 rounded-full" rounded="full" />
              <SileoSkeleton className="absolute left-[64%] top-[38%] h-7 w-12 rounded-full" rounded="full" />
              <SileoSkeleton className="absolute left-[46%] top-[62%] h-7 w-14 rounded-full" rounded="full" />
            </div>
          </div>

          {/* Botones flotantes sobre mapa (volver + buscador) — mismas coordenadas que
              SearchParameterForm: back en left-5/xl:left-6, buscador en left-[4.75rem]/xl:left-[5.25rem]. */}
          <div className="pointer-events-none absolute left-5 top-4 z-20 xl:left-6">
            <SileoSkeleton className="h-11 w-11 rounded-full" rounded="full" />
          </div>
          <div className="pointer-events-none absolute left-[4.75rem] top-4 z-20 w-[min(380px,calc(100%-7rem))] xl:left-[5.25rem]">
            <SileoSkeleton className="h-11 w-full rounded-full" rounded="full" />
          </div>

          {/* Strip inferior desktop — cabecera (MapStripOverlayChrome) + tarjetas MapServiceCard */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-4 pb-4 md:px-5 lg:px-6">
            <SileoSkeleton className="mb-2 h-10 w-[420px] max-w-full rounded-xl bg-black/20" plain />
            <div className="flex gap-3 overflow-hidden">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-[200px] w-[250px] shrink-0 overflow-hidden rounded-2xl border border-white/60 bg-white/85 p-2.5">
                  <SileoSkeleton className={`h-[120px] w-full rounded-xl ${GHOST_ON_LIGHT}`} rounded="xl" />
                  <div className="mt-2 space-y-1.5">
                    <SileoSkeleton className={`h-3.5 w-4/5 rounded ${GHOST_ON_LIGHT}`} />
                    <SileoSkeleton className={`h-3 w-3/5 rounded ${GHOST_ON_LIGHT}`} />
                    <SileoSkeleton className={`h-3 w-2/5 rounded ${GHOST_ON_LIGHT}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
