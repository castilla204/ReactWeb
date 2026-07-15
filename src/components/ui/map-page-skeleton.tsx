import { SileoSkeleton } from './sileo-skeleton';
import { SD_PAGE_INNER_MAX_CLASS } from '../../constants/homepageTypography';

/**
 * Skeleton del paso "mapa" (crear-busqueda).
 * Replica la estructura REAL:
 * - Móvil: mapa full + header flotante + franja inferior plegable (MapResultsSheet),
 *   pintada DESPLEGADA (asa + filtros + carrusel) porque `stripExpanded` arranca en
 *   `true` en SearchParameterForm — el usuario nunca ve la franja colapsada al cargar.
 * - Desktop: topbar 48px (HomepageDesktopTopBar) + mapa + strip flotante de tarjetas.
 *
 * Nota de contraste: `SileoSkeleton` usa `bg-surface-tinted` (#fafafa) como relleno
 * por defecto. Sobre fondos claros (topbar, bottom sheet, tarjetas blancas) ese
 * relleno es casi invisible — por eso las piezas que viven sobre `bg-surface-tinted`
 * o `bg-white` fuerzan `GHOST_ON_LIGHT` para tener contraste real y no salir "en blanco".
 * Sobre el mapa (bg-map-sky) el relleno por defecto ya contrasta y se deja tal cual.
 */
const GHOST_ON_LIGHT = 'bg-[#e4e4e4]';

/**
 * Placeholder de MapServiceCard (variant="strip") mientras cargan los expertos.
 * Misma forma que la card real (imagen + 2 líneas) para que el remplazo no salte
 * de tamaño. `index` escalona el shimmer (onda diagonal) en vez de destellar
 * todo a la vez — se percibe como progreso, no como "cargando genérico".
 * Compartido entre este skeleton de ruta y el carrusel de `SearchParameterForm`
 * (mismo componente, no dos copias que puedan divergir visualmente).
 */
export function MapServiceCardSkeleton({ isMobile = false, index = 0 }: { isMobile?: boolean; index?: number }) {
  return (
    <div
      className={`shrink-0 overflow-hidden rounded-2xl bg-white shadow-[0_6px_18px_rgba(16,24,40,0.16)] ${isMobile ? 'w-[176px]' : 'w-[250px]'}`}
    >
      <SileoSkeleton
        className={`w-full ${isMobile ? 'h-[88px]' : 'h-[118px]'}`}
        rounded="none"
        shimmerDelayMs={index * 90}
      />
      <div className={`${isMobile ? 'p-2' : 'p-2.5'} space-y-1.5`}>
        <SileoSkeleton className="h-3.5 w-4/5 rounded" shimmerDelayMs={index * 90} />
        <SileoSkeleton className="h-3 w-3/5 rounded" shimmerDelayMs={index * 90} />
      </div>
    </div>
  );
}

interface MapPageSkeletonProps {
  /**
   * true cuando la página real ya está lista y este skeleton se está retirando.
   * En vez de desmontarse en seco (el `!isPageReady &&` del caller), el padre lo
   * mantiene montado un instante más para que se desvanezca en paralelo al fade-in
   * del contenido real — así no hay hueco entre "skeleton desaparece" y "contenido
   * aún translúcido" donde se vería el fondo de golpe.
   */
  fadingOut?: boolean;
}

export function MapPageSkeleton({ fadingOut = false }: MapPageSkeletonProps = {}) {
  return (
    <div
      className={`fixed inset-0 z-[99999] bg-surface-tinted transition-opacity duration-300 ease-out motion-reduce:transition-none ${fadingOut ? 'opacity-0' : 'opacity-100'}`}
      style={{ pointerEvents: 'none' }}
      aria-busy={!fadingOut}
      aria-hidden={fadingOut || undefined}
      aria-label="Cargando mapa"
    >
      {/* Mobile */}
      <div className="md:hidden relative h-full w-full overflow-hidden">
        <div className="absolute inset-0 bg-map-sky-muted">
          <SileoSkeleton className="absolute inset-0 rounded-none opacity-80" rounded="none" />
          {/* Pins fantasma para que el mapa no se vea vacío. Delay escalonado → onda
              diagonal en vez de destello simultáneo (se lee como progreso). */}
          <SileoSkeleton className="absolute left-[22%] top-[36%] h-7 w-14 rounded-full" rounded="full" shimmerDelayMs={0} />
          <SileoSkeleton className="absolute left-[58%] top-[44%] h-7 w-12 rounded-full" rounded="full" shimmerDelayMs={120} />
          <SileoSkeleton className="absolute left-[39%] top-[58%] h-7 w-16 rounded-full" rounded="full" shimmerDelayMs={240} />
        </div>

        {/* Header móvil flotante */}
        <div className="absolute inset-x-0 top-0 z-20 px-5 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2">
          <div className="flex items-center gap-2">
            <SileoSkeleton className="h-11 w-11 rounded-full shrink-0" rounded="full" />
            <SileoSkeleton className="h-11 flex-1 rounded-full" rounded="full" />
          </div>
        </div>

        {/* Franja inferior estilo MapResultsSheet — DESPLEGADA por defecto (stripExpanded
            arranca en `true` en SearchParameterForm, ver useState(true) en línea ~1870), no
            plegada. El asa sola (sin cuerpo) representaba un estado que el usuario nunca ve
            al cargar: el carrusel de cards ya está abierto desde el primer render real. */}
        <div className="absolute inset-x-0 bottom-0 z-20">
          <div className="rounded-t-2xl bg-surface-tinted shadow-[0_-4px_20px_rgba(0,0,0,0.10)]">
            {/* Asa: sin padding-bottom safe-area (ese padding vive en el cuerpo cuando está
                desplegada, igual que en MapResultsSheet real). */}
            <div className="px-3.5 pt-2.5 pb-2.5">
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
            {/* Cuerpo desplegado: fila de filtros (segmentado Relevancia/Cercanía + botón
                Filtros, mismo patrón que MapStripFilterControls isMobile+lightSurface)
                y carrusel de cards fantasma. */}
            <div className="px-5 pt-1 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)]">
              <div className="mb-2 flex items-center justify-between gap-2">
                <SileoSkeleton className={`h-8 w-[148px] rounded-full ${GHOST_ON_LIGHT}`} rounded="full" />
                <SileoSkeleton className={`h-8 w-20 rounded-full ${GHOST_ON_LIGHT}`} rounded="full" />
              </div>
              <div className="-mx-5 flex gap-3 overflow-hidden px-5 pt-1 pb-2">
                {[0, 1, 2].map((i) => (
                  <MapServiceCardSkeleton key={i} index={i} isMobile />
                ))}
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
              <SileoSkeleton className="absolute left-[18%] top-[26%] h-7 w-16 rounded-full" rounded="full" shimmerDelayMs={0} />
              <SileoSkeleton className="absolute left-[64%] top-[38%] h-7 w-12 rounded-full" rounded="full" shimmerDelayMs={120} />
              <SileoSkeleton className="absolute left-[46%] top-[62%] h-7 w-14 rounded-full" rounded="full" shimmerDelayMs={240} />
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

          {/* Strip inferior desktop — cabecera (MapStripOverlayChrome) + tarjetas MapServiceCard,
              siempre visible (sin plegado en desktop, a diferencia del panel móvil). */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-4 pb-4 md:px-5 lg:px-6">
            <SileoSkeleton className="mb-2 h-10 w-[420px] max-w-full rounded-xl bg-black/20" plain />
            <div className="flex gap-3 overflow-hidden">
              {[0, 1, 2, 3].map((i) => (
                <MapServiceCardSkeleton key={i} index={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
