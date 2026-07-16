import { SileoSkeleton } from './sileo-skeleton';
import { HP_PANEL_GRADIENT, SD_PAGE_INNER_MAX_CLASS } from '../../constants/homepageTypography';

/**
 * Skeleton del Centro de Ayuda (CentroAyudaPage) — espeja el frame real para que no
 * haya salto de layout cuando entra el chunk lazy. Sustituye el spinner genérico
 * "Preparando página…".
 *
 * Mismos breakpoints que la página: cabecera propia SOLO en móvil (md:hidden), hero con
 * gradiente `HP_PANEL_GRADIENT`, sub-nav de anclas pegajoso y un puñado de filas de FAQ.
 * El barrido se escalona (`shimmerDelayMs={i * 90}`) para leer como progreso, no como
 * "cargando" plano. Fantasmas `bg-[#e4e4e4]` sobre superficies claras (hero, bg tintado)
 * donde el tono `surface-tinted` por defecto quedaría invisible.
 */
export function HelpCenterSkeleton() {
  return (
    <div
      className="min-h-screen bg-surface-tinted font-display"
      aria-busy="true"
      aria-label="Cargando ayuda"
    >
      {/* Cabecera propia SOLO en móvil (en desktop el topbar global es la cabecera). */}
      <header className="border-b border-line bg-white md:hidden">
        <div className="flex h-12 items-center gap-2 px-4">
          <SileoSkeleton className="h-9 w-9 shrink-0" rounded="full" />
          <SileoSkeleton className="h-4 w-16 rounded" />
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-line" style={{ background: HP_PANEL_GRADIENT }}>
        <div className={`${SD_PAGE_INNER_MAX_CLASS} px-4 py-8 md:px-6 md:py-12 lg:py-14`}>
          <SileoSkeleton className="h-8 w-64 rounded-lg bg-[#e4e4e4] md:h-9 md:w-80" />
          <div className="mt-3 max-w-xl space-y-2">
            <SileoSkeleton className="h-4 w-full rounded bg-[#e4e4e4]" />
            <SileoSkeleton className="h-4 w-4/5 rounded bg-[#e4e4e4]" />
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <SileoSkeleton className="h-12 w-44 rounded-full bg-[#e4e4e4]" />
            <SileoSkeleton className="h-12 w-36 rounded-full bg-[#e4e4e4]" />
          </div>
        </div>
      </section>

      {/* Sub-nav pegajoso de anclas — 4 secciones. */}
      <nav className="border-b border-line bg-white">
        <div className={`${SD_PAGE_INNER_MAX_CLASS} flex gap-2 overflow-x-hidden px-4 py-2 md:px-6`}>
          {[72, 96, 132, 108].map((w, i) => (
            <SileoSkeleton
              key={i}
              className="h-6 shrink-0 rounded-full"
              style={{ width: w }}
              shimmerDelayMs={i * 90}
            />
          ))}
        </div>
      </nav>

      <main className={`${SD_PAGE_INNER_MAX_CLASS} px-4 py-8 pb-24 md:px-6 md:py-10 md:pb-16`}>
        {/* Título de sección + intro (espeja "Sobre / Cómo funciona / FAQ"). */}
        <SileoSkeleton className="h-6 w-56 rounded-lg bg-[#e4e4e4]" />
        <div className="mt-3 max-w-2xl space-y-2">
          <SileoSkeleton className="h-3.5 w-full rounded bg-[#e4e4e4]" />
          <SileoSkeleton className="h-3.5 w-2/3 rounded bg-[#e4e4e4]" />
        </div>

        {/* Buscador de FAQ (input pill blanco). */}
        <div className="mt-8 h-11 w-full max-w-md rounded-full border border-line bg-white px-4">
          <div className="flex h-full items-center gap-2.5">
            <SileoSkeleton className="h-4 w-4 shrink-0" rounded="full" />
            <SileoSkeleton className="h-3.5 w-48 rounded" />
          </div>
        </div>

        {/* Filas de acordeón FAQ (~41 preguntas → mostramos unas pocas). */}
        <div className="mt-4 space-y-2.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-4 rounded-xl border border-line bg-white px-4 py-4 shadow-sm sm:px-5"
            >
              <SileoSkeleton
                className="h-4 min-w-0 flex-1 rounded"
                style={{ maxWidth: `${72 - (i % 4) * 8}%` }}
                shimmerDelayMs={i * 90}
              />
              <SileoSkeleton className="h-4 w-4 shrink-0" rounded="full" shimmerDelayMs={i * 90} />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
