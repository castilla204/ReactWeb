import { SileoSkeleton } from './sileo-skeleton';
import { SD_PAGE_INNER_MAX_CLASS } from '../../constants/homepageTypography';

/**
 * Skeletons de ruta genéricos pero FIELES por familia. Sustituyen al spinner
 * "Preparando página…" cuando una ruta no tiene un skeleton bespoke.
 *
 * Todos comparten:
 * - `SileoSkeleton` (shimmer unificado + `sk-shimmer`), con `shimmerDelayMs`
 *   escalonado en listas → onda diagonal (se lee como progreso, no destello).
 * - `bg-[#e4e4e4]` (GHOST_ON_LIGHT) donde el bloque vive sobre blanco/tinted y el
 *   relleno por defecto sería casi invisible.
 * - `aria-busy` + `aria-label` para lectores de pantalla.
 */

const GHOST_ON_LIGHT = 'bg-[#e4e4e4]';

/**
 * NOTA — sin topbar propio: la barra superior global (`HomepageDesktopTopBar`,
 * `hidden md:block`) vive en el shell FUERA de `<Routes>`, así que sigue pintada
 * por encima del skeleton durante el fallback de Suspense en las rutas que la
 * muestran (legales, estado, transacciones, notificaciones…). Si estos skeletons
 * genéricos añadieran su propia barra, se DUPLICARÍA en desktop. Por eso son
 * "content-only": rellenan solo la región de contenido bajo la cabecera real.
 * (Las rutas que ocultan la cabecera global —ficha, checkout, panel experto, mapa—
 * usan skeletons bespoke que sí traen su propio topbar.)
 */

/**
 * Página de contenido / artículo (default de RouteSuspense y páginas legales,
 * estado, anuncios, MFA…). Columna central de prosa con un par de bloques de
 * sección, bajo la cabecera global.
 */
export function AppPageSkeleton() {
  return (
    <div
      className="min-h-screen bg-surface-tinted"
      aria-busy="true"
      aria-label="Cargando página"
    >
      <div className={`${SD_PAGE_INNER_MAX_CLASS} max-w-[820px] py-8 md:py-12`}>
        {/* Encabezado */}
        <SileoSkeleton className={`h-9 w-3/4 rounded-lg ${GHOST_ON_LIGHT}`} />
        <SileoSkeleton className={`mt-3 h-4 w-1/2 rounded ${GHOST_ON_LIGHT}`} />

        {/* Bloques de prosa */}
        <div className="mt-10 space-y-8">
          {[0, 1, 2].map((section) => (
            <div key={section} className="space-y-3">
              <SileoSkeleton
                className={`h-5 w-40 rounded ${GHOST_ON_LIGHT}`}
                shimmerDelayMs={section * 90}
              />
              {[0, 1, 2, 3].map((line) => (
                <SileoSkeleton
                  key={line}
                  className={`h-3.5 rounded ${GHOST_ON_LIGHT} ${line === 3 ? 'w-2/3' : 'w-full'}`}
                  shimmerDelayMs={section * 90 + line * 40}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Página transaccional centrada: recibo/estado (pago OK/cancelado, retorno de
 * Stripe, MFA, login). Tarjeta única centrada con icono + título + acción.
 */
export function ReceiptPageSkeleton({
  ariaLabel = 'Cargando',
}: {
  ariaLabel?: string;
} = {}) {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-surface-tinted px-4 py-10"
      aria-busy="true"
      aria-label={ariaLabel}
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-[0_6px_24px_rgba(16,24,40,0.08)] ring-1 ring-black/[0.04]">
        <div className="flex flex-col items-center text-center">
          <SileoSkeleton className={`h-14 w-14 rounded-full ${GHOST_ON_LIGHT}`} rounded="full" />
          <SileoSkeleton className={`mt-5 h-6 w-2/3 rounded-lg ${GHOST_ON_LIGHT}`} />
          <SileoSkeleton className={`mt-3 h-4 w-full rounded ${GHOST_ON_LIGHT}`} shimmerDelayMs={90} />
          <SileoSkeleton className={`mt-2 h-4 w-4/5 rounded ${GHOST_ON_LIGHT}`} shimmerDelayMs={130} />
        </div>
        <div className="mt-8 space-y-3">
          <SileoSkeleton className={`h-11 w-full rounded-full ${GHOST_ON_LIGHT}`} shimmerDelayMs={180} />
          <SileoSkeleton className={`mx-auto h-4 w-32 rounded ${GHOST_ON_LIGHT}`} shimmerDelayMs={220} />
        </div>
      </div>
    </div>
  );
}

/**
 * Página de lista/bandeja: topbar + cabecera + filas apiladas (transacciones,
 * notificaciones). Cada fila = icono/avatar + dos líneas.
 */
export function ListPageSkeleton({
  ariaLabel = 'Cargando',
  rows = 6,
}: {
  ariaLabel?: string;
  rows?: number;
} = {}) {
  return (
    <div
      className="min-h-screen bg-surface-tinted pb-[calc(65px+env(safe-area-inset-bottom,0px))]"
      aria-busy="true"
      aria-label={ariaLabel}
    >
      <div className={`${SD_PAGE_INNER_MAX_CLASS} max-w-3xl py-6`}>
        {/* Cabecera de sección */}
        <SileoSkeleton className={`h-7 w-52 rounded-lg ${GHOST_ON_LIGHT}`} />
        <SileoSkeleton className={`mt-2 h-4 w-64 max-w-full rounded ${GHOST_ON_LIGHT}`} />

        {/* Filas */}
        <div className="mt-6 space-y-2.5">
          {Array.from({ length: rows }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl bg-white p-3.5 ring-1 ring-black/[0.04]"
            >
              <SileoSkeleton
                className={`h-11 w-11 shrink-0 rounded-full ${GHOST_ON_LIGHT}`}
                rounded="full"
                shimmerDelayMs={i * 90}
              />
              <div className="min-w-0 flex-1 space-y-2">
                <SileoSkeleton className={`h-4 w-3/5 rounded ${GHOST_ON_LIGHT}`} shimmerDelayMs={i * 90} />
                <SileoSkeleton className={`h-3 w-2/5 rounded ${GHOST_ON_LIGHT}`} shimmerDelayMs={i * 90 + 40} />
              </div>
              <SileoSkeleton className={`h-4 w-12 shrink-0 rounded ${GHOST_ON_LIGHT}`} shimmerDelayMs={i * 90 + 60} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
