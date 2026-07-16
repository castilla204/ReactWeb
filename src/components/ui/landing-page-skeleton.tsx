import { SileoSkeleton } from './sileo-skeleton';
import { HP_PANEL_GRADIENT, SD_PAGE_INNER_MAX_CLASS } from '../../constants/homepageTypography';

/**
 * Skeleton compartido de las landings SEO (CategoryLandingPage, CityLandingPage,
 * CoverageHubPage). Espeja el frame real —cabecera móvil, hero con degradado
 * (eyebrow + H1 + intro + CTAs) y las secciones apiladas del `main`
 * (callout "En resumen", rejilla de tarjetas, pasos y FAQ)— para que NO haya
 * salto de layout cuando el chunk perezoso resuelve. Solo shimmer, sin spinner
 * ni texto. Reutiliza las MISMAS constantes de ancho/degradado que las páginas.
 *
 * Los bloques que van sobre superficies blancas usan un fantasma `bg-[#e4e4e4]`
 * (el `bg-surface-tinted` por defecto de SileoSkeleton se pierde sobre blanco).
 */

/** Ghost sobre tarjeta blanca (bg-surface-tinted es demasiado sutil ahí). */
const GHOST = 'bg-[#e4e4e4]';

export function LandingPageSkeleton() {
  return (
    <div
      className="min-h-screen bg-surface-tinted font-display"
      style={{ paddingBottom: 'calc(65px + env(safe-area-inset-bottom, 0px))' }}
      aria-busy="true"
      aria-label="Cargando página"
    >
      {/* Cabecera móvil (en desktop el topbar global ya es la cabecera). */}
      <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur-sm md:hidden">
        <div className="flex min-h-12 items-center gap-2 px-4 pt-[max(0.5rem,env(safe-area-inset-top,0px))]">
          <SileoSkeleton className={`h-9 w-9 ${GHOST}`} rounded="full" />
          <SileoSkeleton className={`h-4 w-32 ${GHOST}`} rounded="sm" />
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-line" style={{ background: HP_PANEL_GRADIENT }}>
        <div className={`${SD_PAGE_INNER_MAX_CLASS} px-4 py-8 md:px-6 md:py-12 lg:py-14`}>
          {/* eyebrow */}
          <SileoSkeleton className="h-3.5 w-40" rounded="sm" />
          {/* H1 (2 líneas) */}
          <div className="mt-3 max-w-2xl space-y-2">
            <SileoSkeleton className="h-7 w-full md:h-8" rounded="md" />
            <SileoSkeleton className="h-7 w-2/3 md:h-8" rounded="md" />
          </div>
          {/* intro */}
          <div className="mt-4 max-w-xl space-y-2">
            <SileoSkeleton className="h-4 w-full" rounded="sm" />
            <SileoSkeleton className="h-4 w-5/6" rounded="sm" />
          </div>
          {/* CTAs */}
          <div className="mt-6 flex flex-wrap gap-3">
            <SileoSkeleton className="h-12 w-52" rounded="full" />
            <SileoSkeleton className="h-12 w-36" rounded="full" />
          </div>
        </div>
      </section>

      <main className={`${SD_PAGE_INNER_MAX_CLASS} px-4 py-8 pb-24 md:px-6 md:py-10 md:pb-16`}>
        {/* Callout "En resumen" */}
        <div className="mb-10 rounded-xl border border-brand/15 bg-brand/5 p-4 md:p-5">
          <SileoSkeleton className={`h-3 w-24 ${GHOST}`} rounded="sm" />
          <div className="mt-3 space-y-2">
            <SileoSkeleton className={`h-4 w-full ${GHOST}`} rounded="sm" />
            <SileoSkeleton className={`h-4 w-full ${GHOST}`} rounded="sm" />
            <SileoSkeleton className={`h-4 w-3/4 ${GHOST}`} rounded="sm" />
          </div>
        </div>

        {/* Sección con rejilla de tarjetas (checks / categorías / etc.) */}
        <section>
          <SileoSkeleton className="h-6 w-64" rounded="md" />
          <SileoSkeleton className="mt-3 h-4 w-full max-w-2xl" rounded="sm" />
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <li
                key={i}
                className="flex items-center gap-3 rounded-lg border border-line bg-white px-4 py-3"
              >
                <SileoSkeleton
                  className={`h-4 w-4 shrink-0 ${GHOST}`}
                  rounded="full"
                  shimmerDelayMs={i * 90}
                />
                <SileoSkeleton
                  className={`h-4 w-3/4 ${GHOST}`}
                  rounded="sm"
                  shimmerDelayMs={i * 90}
                />
              </li>
            ))}
          </ul>
        </section>

        {/* Cómo funciona · pasos */}
        <section className="mt-12 border-t border-line pt-8">
          <SileoSkeleton className="h-6 w-56" rounded="md" />
          <ol className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <li
                key={i}
                className="rounded-xl border border-line bg-white p-4 shadow-sm"
              >
                <SileoSkeleton
                  className={`h-8 w-8 ${GHOST}`}
                  rounded="full"
                  shimmerDelayMs={i * 90}
                />
                <SileoSkeleton
                  className={`mt-3 h-4 w-2/3 ${GHOST}`}
                  rounded="sm"
                  shimmerDelayMs={i * 90}
                />
                <div className="mt-2 space-y-1.5">
                  <SileoSkeleton className={`h-3 w-full ${GHOST}`} rounded="sm" shimmerDelayMs={i * 90} />
                  <SileoSkeleton className={`h-3 w-5/6 ${GHOST}`} rounded="sm" shimmerDelayMs={i * 90} />
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Preguntas frecuentes */}
        <section className="mt-12 border-t border-line pt-8">
          <SileoSkeleton className="h-6 w-52" rounded="md" />
          <div className="mt-5 grid gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3 rounded-lg border border-line bg-white px-4 py-3.5"
              >
                <SileoSkeleton
                  className={`h-4 w-2/3 ${GHOST}`}
                  rounded="sm"
                  shimmerDelayMs={i * 90}
                />
                <SileoSkeleton
                  className={`h-4 w-4 shrink-0 ${GHOST}`}
                  rounded="sm"
                  shimmerDelayMs={i * 90}
                />
              </div>
            ))}
          </div>
        </section>

        {/* CTA final */}
        <section className="mt-12 rounded-xl border border-line bg-white p-5 md:p-6">
          <SileoSkeleton className={`h-5 w-3/4 max-w-md ${GHOST}`} rounded="md" />
          <div className="mt-3 max-w-2xl space-y-2">
            <SileoSkeleton className={`h-4 w-full ${GHOST}`} rounded="sm" />
            <SileoSkeleton className={`h-4 w-5/6 ${GHOST}`} rounded="sm" />
          </div>
          <SileoSkeleton className={`mt-4 h-12 w-52 ${GHOST}`} rounded="full" />
        </section>
      </main>

      {/* Barra inferior móvil (siempre presente en móvil). */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-line bg-white md:hidden"
        style={{
          height: 'calc(65px + env(safe-area-inset-bottom, 0px))',
          paddingTop: '11px',
          paddingBottom: 'max(11px, env(safe-area-inset-bottom, 0px))',
        }}
      >
        <div className="flex h-[44px] items-center justify-around px-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center justify-center gap-1">
              <SileoSkeleton className="h-6 w-6" rounded="full" shimmerDelayMs={i * 90} />
              <SileoSkeleton className="h-2 w-12" rounded="sm" shimmerDelayMs={i * 90} />
            </div>
          ))}
        </div>
      </nav>
    </div>
  );
}
