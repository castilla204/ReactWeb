import { SileoSkeleton } from './sileo-skeleton';

/**
 * Skeleton del Panel de Experto — espeja el frame real del dashboard
 * (`ExpertPanelPage`) para que NO haya salto de layout al cargar el chunk lazy.
 *
 * Reutiliza las MISMAS clases del shell (`expert-panel.css`): `.expert-panel-layout`,
 * `.expert-sidebar`, `.expert-main`, `.expert-topbar` y la pestaña por defecto
 * (Servicios → `.av-page` / `.av-calendar` / `.sf-services`). Así los breakpoints
 * reales aplican sin duplicar reglas: en <1024px la sidebar queda translada fuera y
 * aparece el topbar; en ≥1024px la sidebar fija de 240px y `.expert-main` con su
 * margen. Sólo shimmer (SileoSkeleton), sin animación de layout ni spinner/texto.
 *
 * Ghost `bg-[#e4e4e4]`: las superficies del panel son casi blancas (sidebar 96%,
 * cards 100%) y `bg-surface-tinted` (98%) sería invisible sobre ellas, así que los
 * bloques usan un gris más marcado para contrastar.
 */

const GHOST = 'bg-[#e4e4e4]';

/** Fila de servicio — espeja `ServiceRowSkeleton` de ServicesTab (grid media/info/acciones). */
function ServiceRowGhost({ index }: { index: number }) {
  return (
    <div className="sf-services__day sf-services__day--skeleton" aria-hidden>
      <div className="sf-services__row">
        <SileoSkeleton className={`sf-services__media !rounded-none ${GHOST}`} shimmerDelayMs={index * 90} />
        <div className="sf-services__info">
          <SileoSkeleton className={`h-4 w-36 ${GHOST}`} rounded="md" shimmerDelayMs={index * 90} />
          <SileoSkeleton className={`mt-2 h-3 w-28 ${GHOST}`} rounded="md" shimmerDelayMs={index * 90} />
          <SileoSkeleton className={`mt-3 h-3.5 w-20 ${GHOST}`} rounded="md" shimmerDelayMs={index * 90} />
        </div>
        <div className="sf-services__actions">
          <SileoSkeleton className={`h-9 w-9 ${GHOST}`} rounded="lg" />
          <SileoSkeleton className={`h-9 w-9 ${GHOST}`} rounded="lg" />
        </div>
      </div>
    </div>
  );
}

/** Item de navegación de la sidebar (icono + etiqueta). */
function NavItemGhost({ width, index }: { width: string; index: number }) {
  return (
    <div className="expert-nav-item">
      <SileoSkeleton className={`h-4 w-4 shrink-0 ${GHOST}`} rounded="sm" />
      <SileoSkeleton className={`h-3 ${GHOST} ${width}`} rounded="sm" shimmerDelayMs={index * 90} />
    </div>
  );
}

export function ExpertPanelSkeleton() {
  return (
    <div className="expert-panel-layout min-h-screen" aria-busy="true" aria-label="Cargando panel">
      {/* ── Sidebar (fija ≥1024px; translada fuera en móvil por el CSS del shell) ── */}
      <aside className="expert-sidebar">
        <div className="expert-sidebar-brand">
          <SileoSkeleton className={`h-9 w-9 shrink-0 ${GHOST}`} rounded="full" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <SileoSkeleton className={`h-3 w-24 ${GHOST}`} rounded="sm" />
            <SileoSkeleton className={`h-2.5 w-14 ${GHOST}`} rounded="sm" />
          </div>
        </div>

        {/* Sólo visible en ≥1024px (display:flex por media query del shell). */}
        <div className="expert-sidebar-actions">
          <SileoSkeleton className={`h-[34px] w-[34px] ${GHOST}`} rounded="lg" />
          <SileoSkeleton className={`h-[34px] w-16 ${GHOST}`} rounded="lg" />
        </div>

        <nav className="expert-sidebar-nav">
          <SileoSkeleton className={`mx-2.5 my-1 h-2.5 w-12 ${GHOST}`} rounded="sm" />
          <NavItemGhost width="w-16" index={0} />
          <NavItemGhost width="w-24" index={1} />
          <NavItemGhost width="w-20" index={2} />
          <NavItemGhost width="w-36" index={3} />
        </nav>

        <div className="expert-sidebar-footer">
          <SileoSkeleton className={`mx-2.5 my-1 h-2.5 w-14 ${GHOST}`} rounded="sm" />
          <NavItemGhost width="w-24" index={0} />
          <NavItemGhost width="w-28" index={1} />
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────────────────── */}
      <div className="expert-main">
        {/* Topbar: display:none en ≥1024px; visible en móvil (menú + título + campana). */}
        <header className="expert-topbar">
          <SileoSkeleton className={`expert-topbar-menu h-9 w-9 ${GHOST}`} rounded="lg" />
          <div className="expert-topbar-heading">
            <SileoSkeleton className={`h-4 w-28 ${GHOST}`} rounded="md" />
          </div>
          <div className="expert-topbar-spacer" />
          <div className="expert-topbar-actions">
            <SileoSkeleton className={`h-9 w-9 ${GHOST}`} rounded="lg" />
          </div>
        </header>

        <main className="expert-workspace expert-workspace--services">
          <div className="av-page">
            {/* Intro (tarjeta de contexto). */}
            <header className="av-page-intro">
              <div className="space-y-2">
                <SileoSkeleton className={`h-3.5 w-full max-w-[52ch] ${GHOST}`} rounded="sm" />
                <SileoSkeleton className={`h-3.5 w-11/12 max-w-[48ch] ${GHOST}`} rounded="sm" />
                <SileoSkeleton className={`h-3.5 w-2/3 max-w-[32ch] ${GHOST}`} rounded="sm" />
              </div>
              {/* Lista de pasos: oculta en móvil, en fila ≥768px (media query del shell). */}
              <div className="av-page-intro__steps">
                <SileoSkeleton className={`h-3 w-56 ${GHOST}`} rounded="sm" />
                <SileoSkeleton className={`h-3 w-48 ${GHOST}`} rounded="sm" />
              </div>
            </header>

            {/* Catálogo de servicios. */}
            <section className="av-calendar sf-services-catalog">
              <div className="av-calendar__main">
                <div className="av-calendar__toolbar sf-services-catalog__toolbar">
                  <div className="sf-services-catalog__toolbar-main">
                    <div className="sf-services-catalog__toolbar-head">
                      <SileoSkeleton className={`h-5 w-40 ${GHOST}`} rounded="md" />
                      {/* Botón "Crear servicio" (móvil). */}
                      <SileoSkeleton className={`sf-services-catalog__add-mobile h-9 w-32 ${GHOST}`} rounded="lg" />
                    </div>
                    <div className="av-calendar__stats sf-services-catalog__stats--mobile">
                      <SileoSkeleton className={`h-3 w-40 ${GHOST}`} rounded="sm" />
                    </div>
                    <div className="av-calendar__stats sf-services-catalog__stats--desktop">
                      <SileoSkeleton className={`h-3 w-40 ${GHOST}`} rounded="sm" />
                    </div>
                  </div>
                  {/* Botón "Nuevo servicio" (desktop). */}
                  <div className="sf-services-catalog__add-desktop">
                    <SileoSkeleton className={`h-10 w-36 ${GHOST}`} rounded="lg" />
                  </div>
                </div>

                {/* Buscador (desktop). */}
                <div className="sf-services-catalog__search sf-services-catalog__search--desktop">
                  <SileoSkeleton className={`h-9 w-full ${GHOST}`} rounded="lg" />
                </div>

                <div className="sf-services__days">
                  {[0, 1, 2].map((i) => (
                    <ServiceRowGhost key={i} index={i} />
                  ))}
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
