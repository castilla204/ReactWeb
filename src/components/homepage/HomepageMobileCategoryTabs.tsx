import React, { useEffect, useRef } from 'react';

import { HP_FONT } from '../../constants/homepageTypography';
import { HP_MOBILE_TABS_NAV_CLASS, HP_MOBILE_TABS_SCROLLER_CLASS } from '../../constants/homepageMobileRhythm';
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

const DRAWER_TAB_HINT = 'Categoría adicional';

interface HomepageMobileCategoryTabsProps {
  activeCategoryId: number;
}

/**
 * Categorías móvil bajo el hero — texto + `border-b-2 border-brand` activo (DESIGN.md §Navigation).
 * Cámaras/Fontanería usan flujo extendido (borde discontinuo + separador).
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
    activeEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
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
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={isDrawer ? `${tab.label}. ${DRAWER_TAB_HINT}` : tab.label}
                  onClick={() => dispatchHomepagePickCategory(tab.id, tab.label)}
                  className={cn(
                    'inline-flex min-h-11 shrink-0 snap-start items-center border-0 bg-transparent px-0 py-2.5 touch-manipulation',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
                  )}
                  style={{ fontFamily: HP_FONT }}
                >
                  <span
                    className={cn(
                      'inline-block whitespace-nowrap border-b-2 pb-1 text-sm leading-snug min-[390px]:text-body',
                      isActive
                        ? 'border-brand font-semibold text-ink'
                        : isDrawer
                          ? 'border-transparent font-normal text-ink-soft'
                          : 'border-transparent font-normal text-ink-muted',
                    )}
                  >
                    {tab.label}
                  </span>
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
