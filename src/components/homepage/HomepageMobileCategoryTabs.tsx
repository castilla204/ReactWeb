import React, { useEffect, useRef } from 'react';

import { HP_FONT } from '../../constants/homepageTypography';
import {
  HP_MOBILE_CATEGORY_TAB_ACTIVE_CHIP_CLASS,
  HP_MOBILE_CATEGORY_TAB_BTN_CLASS,
  HP_MOBILE_CATEGORY_TAB_INACTIVE_DRAWER_CLASS,
  HP_MOBILE_CATEGORY_TAB_INACTIVE_PRIMARY_CLASS,
  HP_MOBILE_CATEGORY_TAB_LABEL_BASE_CLASS,
  HP_MOBILE_TABS_NAV_CLASS,
  HP_MOBILE_TABS_SCROLLER_CLASS,
} from '../../constants/homepageMobileRhythm';
import { cn } from '../../lib/utils';
import { dispatchHomepagePickCategory } from '../../utils/homepageCategoryPick';

/** IDs alineados con `CATEGORIES` en AirbnbSearchBar. Inmobiliaria primero (default home). */
export const MOBILE_HOMEPAGE_CATEGORY_TABS = [
  { id: 3, label: 'Inmobiliaria', kind: 'primary' as const },
  { id: 5, label: 'Coches', kind: 'primary' as const },
  { id: 6, label: 'Motos', kind: 'primary' as const },
  { id: 4, label: 'Cámaras', kind: 'drawer' as const },
  { id: 12, label: 'Fontanería', kind: 'drawer' as const },
] as const;

/**
 * Cámaras/Fontanería filtran el muro pero aún no se pueden contratar desde
 * "elige qué quieres revisar" (ver CATEGORY_META en data/categoryMeta.ts —
 * comentario "cuando pase a activa"). El badge deja claro que solo se puede
 * explorar contenido, no reservar todavía.
 */
const DRAWER_TAB_HINT = 'Próximamente — de momento solo para explorar';

interface HomepageMobileCategoryTabsProps {
  activeCategoryId: number;
}

/**
 * Categorías móvil bajo el hero — variante B-lite: chip brand solo en activo; inactivos texto plano.
 * Baseline (subrayado editorial): rama `backup/homepage-tabs-underline-baseline`.
 * Cámaras/Fontanería: separador visual + misma tinta inactiva (el separador marca 2.º orden).
 * Sincroniza con AirbnbSearchBar vía `dispatchHomepagePickCategory`.
 */
export const HomepageMobileCategoryTabs: React.FC<HomepageMobileCategoryTabsProps> = ({
  activeCategoryId,
}) => {
  const shellRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scroller = scrollerRef.current;
    const shell = shellRef.current;
    if (!scroller || !shell) return;

    const syncScrollHints = () => {
      const maxScroll = scroller.scrollWidth - scroller.clientWidth;
      const atStart = scroller.scrollLeft <= 2;
      const atEnd = maxScroll <= 2 || scroller.scrollLeft >= maxScroll - 2;
      shell.dataset.scrollStart = atStart ? 'false' : 'true';
      shell.dataset.scrollEnd = atEnd ? 'true' : 'false';
    };

    syncScrollHints();
    scroller.addEventListener('scroll', syncScrollHints, { passive: true });
    const observer =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(syncScrollHints) : null;
    observer?.observe(scroller);
    window.addEventListener('resize', syncScrollHints);

    return () => {
      scroller.removeEventListener('scroll', syncScrollHints);
      observer?.disconnect();
      window.removeEventListener('resize', syncScrollHints);
    };
  }, []);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const activeEl = scroller.querySelector<HTMLElement>('[data-active="true"]');
    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    activeEl?.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'nearest',
      inline: 'nearest',
    });
  }, [activeCategoryId]);

  const firstDrawerIndex = MOBILE_HOMEPAGE_CATEGORY_TABS.findIndex((tab) => tab.kind === 'drawer');

  return (
    <nav className={HP_MOBILE_TABS_NAV_CLASS} aria-label="Categorías principales">
      <div ref={shellRef} className="hp-mobile-category-shell">
        <div
          ref={scrollerRef}
          className={HP_MOBILE_TABS_SCROLLER_CLASS}
        >
          {MOBILE_HOMEPAGE_CATEGORY_TABS.map((tab, index) => {
            const isActive = activeCategoryId === tab.id;
            const isDrawer = tab.kind === 'drawer';
            const showSeparator = index === firstDrawerIndex && firstDrawerIndex > 0;

            return (
              <React.Fragment key={tab.id}>
                {showSeparator ? (
                  <span
                    role="presentation"
                    aria-hidden
                    className="mx-0.5 w-px shrink-0 self-center bg-line"
                    style={{ height: '1.25rem' }}
                  />
                ) : null}
                <button
                  type="button"
                  data-active={isActive ? 'true' : undefined}
                  aria-current={isActive ? 'true' : undefined}
                  aria-label={isDrawer ? `${tab.label}. ${DRAWER_TAB_HINT}` : tab.label}
                  onClick={() => dispatchHomepagePickCategory(tab.id, tab.label)}
                  className={HP_MOBILE_CATEGORY_TAB_BTN_CLASS}
                  style={{ fontFamily: HP_FONT }}
                >
                  <span
                    className={cn(
                      HP_MOBILE_CATEGORY_TAB_LABEL_BASE_CLASS,
                      isActive
                        ? HP_MOBILE_CATEGORY_TAB_ACTIVE_CHIP_CLASS
                        : isDrawer
                          ? HP_MOBILE_CATEGORY_TAB_INACTIVE_DRAWER_CLASS
                          : HP_MOBILE_CATEGORY_TAB_INACTIVE_PRIMARY_CLASS,
                    )}
                  >
                    {tab.label}
                  </span>
                  {isDrawer && (
                    <span
                      aria-hidden
                      className="ml-1 inline-flex h-4 shrink-0 items-center self-center rounded-full bg-ink-strong/70 px-1.5 text-[10px] font-bold uppercase leading-none tracking-[0.04em] text-white"
                    >
                      Pronto
                    </span>
                  )}
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
