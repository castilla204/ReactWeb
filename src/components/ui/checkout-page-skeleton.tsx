import { SileoSkeleton } from './sileo-skeleton';

/**
 * Skeleton de la página de pago (CheckoutPage).
 *
 * Replica el PRIMER frame que pinta la página real al montar: mientras el chunk
 * lazy carga, RouteSuspense muestra esto; en cuanto CheckoutPage monta, su estado
 * `loading` arranca en `true` y pinta su propio skeleton interno (columna del
 * wizard + resumen lateral) ANTES de que llegue el servicio. Para que no haya
 * salto en ese límite (chunk → montado), este skeleton espeja ese frame interno:
 * mismo fondo `bg-surface-tinted`, mismo contenedor centrado `max-w-[75rem]`, y
 * la misma rejilla `lg:grid-cols-[1fr_360px]` (columna de contenido + aside).
 *
 * Nota: durante `loading` la página real NO monta la topbar desktop (hace return
 * temprano antes de renderizarla), así que aquí tampoco se pinta — añadirla
 * provocaría precisamente el salto que se quiere evitar.
 *
 * Contraste: `SileoSkeleton` rellena con `bg-surface-tinted`, casi invisible sobre
 * la tarjeta blanca del aside (`bg-white`). Ahí se fuerza `GHOST_ON_LIGHT` para que
 * las piezas tengan contraste real (mismo truco que map-page-skeleton).
 */
const GHOST_ON_LIGHT = 'bg-[#e4e4e4]';

export function CheckoutPageSkeleton() {
  return (
    <div
      className="min-h-screen bg-surface-tinted px-4 pb-12 pt-8 sm:px-5 lg:px-8"
      aria-busy="true"
      aria-label="Cargando pago"
    >
      <div className="mx-auto w-full max-w-[75rem]">
        {/* Cabecera del paso (título) */}
        <SileoSkeleton className="mb-6 h-7 w-56 max-w-[70%] rounded-lg" />

        <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
          {/* Columna del wizard: cabecera de paso + lámina (calendario/mapa) + rejilla de huecos */}
          <div className="space-y-4">
            <SileoSkeleton className="h-10 w-full rounded-lg" shimmerDelayMs={0} />
            <SileoSkeleton className="h-64 w-full rounded-2xl" shimmerDelayMs={90} />
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <SileoSkeleton key={i} className="h-9 w-full rounded-md" shimmerDelayMs={i * 90} />
              ))}
            </div>
          </div>

          {/* Aside: resumen + pago (tarjeta blanca → GHOST_ON_LIGHT en los rellenos) */}
          <div className="space-y-4 rounded-2xl border border-line bg-white p-4">
            <div className="flex items-center gap-3">
              <SileoSkeleton className={`h-12 w-12 ${GHOST_ON_LIGHT}`} rounded="full" shimmerDelayMs={0} />
              <div className="flex-1 space-y-2">
                <SileoSkeleton className={`h-4 w-3/4 rounded ${GHOST_ON_LIGHT}`} shimmerDelayMs={0} />
                <SileoSkeleton className={`h-3 w-1/2 rounded ${GHOST_ON_LIGHT}`} shimmerDelayMs={90} />
              </div>
            </div>
            <SileoSkeleton className={`h-16 w-full rounded-lg ${GHOST_ON_LIGHT}`} shimmerDelayMs={90} />
            <SileoSkeleton className={`h-4 w-full rounded ${GHOST_ON_LIGHT}`} shimmerDelayMs={180} />
            <SileoSkeleton className={`h-4 w-5/6 rounded ${GHOST_ON_LIGHT}`} shimmerDelayMs={270} />
            <SileoSkeleton className={`h-11 w-full rounded-full ${GHOST_ON_LIGHT}`} shimmerDelayMs={360} />
          </div>
        </div>
      </div>
    </div>
  );
}
