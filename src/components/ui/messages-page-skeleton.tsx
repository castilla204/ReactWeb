import { SileoSkeleton } from './sileo-skeleton';
import { HP_FONT } from '../../constants/homepageTypography';

/**
 * Skeleton de MessagesPage (bandeja "El gabinete del perito").
 *
 * Espeja el PRIMER pintado real de la página: su estado `isLoading` (query de
 * conversaciones sin resolver) renderiza `flex min-h-screen flex-col bg-white` con
 * la cabecera SOLO-desktop (`Header`, `hidden md:block`) y un `main`
 * `w-full … md:max-w-[380px]` con 7 filas fantasma. Reutilizamos el lenguaje visual
 * de su `SkeletonRow` interno (avatar 52px + 2 líneas + separador inset a 72px) para
 * que no haya salto entre el fallback de Suspense y ese primer render.
 *
 * Deliberadamente NO se pinta el buscador, los filtros ni el panel derecho (two-pane
 * desktop): esas piezas solo aparecen una vez hay datos (`showSearch`/`showFilters`
 * dependen de `totalCount > 0`), así que el primer render de `isLoading` tampoco las
 * muestra — añadirlas causaría el salto que este skeleton evita.
 *
 * Contraste: sobre `bg-white`/`bg-surface-tinted` el relleno por defecto de
 * `SileoSkeleton` es casi invisible, así que las piezas fuerzan `GHOST_ON_LIGHT`.
 */
const GHOST_ON_LIGHT = 'bg-[#e4e4e4]';

/** Fila de conversación fantasma — espeja SkeletonRow/ConversationRow. */
function ConversationRowSkeleton({ index, isLast }: { index: number; isLast: boolean }) {
  return (
    <div className="relative flex w-full items-center gap-3 px-3 py-3 md:px-3.5">
      <SileoSkeleton
        className={`h-[52px] w-[52px] shrink-0 ${GHOST_ON_LIGHT}`}
        rounded="full"
        shimmerDelayMs={index * 90}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <SileoSkeleton
            className={`h-3.5 w-40 max-w-[55%] ${GHOST_ON_LIGHT}`}
            rounded="full"
            shimmerDelayMs={index * 90}
          />
          <SileoSkeleton
            className={`h-3 w-10 ${GHOST_ON_LIGHT}`}
            rounded="full"
            shimmerDelayMs={index * 90}
          />
        </div>
        <SileoSkeleton
          className={`h-3 w-3/4 ${GHOST_ON_LIGHT}`}
          rounded="full"
          shimmerDelayMs={index * 90}
        />
      </div>
      {!isLast && (
        <span
          className="pointer-events-none absolute bottom-0 left-[72px] right-0 h-px bg-line-soft"
          aria-hidden
        />
      )}
    </div>
  );
}

export function MessagesPageSkeleton() {
  return (
    <div
      className="flex min-h-screen flex-col bg-white"
      style={{ fontFamily: HP_FONT }}
      aria-busy="true"
      aria-label="Cargando mensajes"
    >
      {/* Cabecera — solo desktop (espeja Header: hidden md:block) */}
      <header className="hidden shrink-0 border-b border-line-soft bg-white md:block">
        <div className="flex items-center gap-3 px-3.5 py-3">
          <SileoSkeleton className={`h-9 w-9 shrink-0 ${GHOST_ON_LIGHT}`} rounded="full" />
          <div className="min-w-0 flex-1 space-y-2">
            <SileoSkeleton className={`h-5 w-40 rounded ${GHOST_ON_LIGHT}`} />
            <SileoSkeleton className={`h-3 w-32 rounded ${GHOST_ON_LIGHT}`} />
          </div>
        </div>
      </header>

      {/* Lista de conversaciones (espeja el main del estado isLoading) */}
      <main className="w-full flex-1 px-0 pb-6 pt-[max(0.75rem,env(safe-area-inset-top,0px))] md:max-w-[380px]">
        <div className="flex flex-col" aria-hidden>
          {Array.from({ length: 7 }).map((_, i) => (
            <ConversationRowSkeleton key={i} index={i} isLast={i === 6} />
          ))}
        </div>
      </main>
    </div>
  );
}
