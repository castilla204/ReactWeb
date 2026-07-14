import { SileoSkeleton } from './sileo-skeleton';
import {
  SD_MOBILE_FOOTER_SHELL_CLASS,
  SD_MOBILE_GUTTER_CLASS,
  SD_MOBILE_IDENTITY_GUTTER_CLASS,
  SD_MOBILE_IDENTITY_STACK_CLASS,
  SD_MOBILE_SCROLL_PAD_CLASS,
  SD_MOBILE_SHEET_OVERLAP_CLASS,
  SD_MOBILE_SHEET_TOP_CLASS,
  SD_MOBILE_TAB_REGION_CLASS,
  SD_MOBILE_TABLIST_SHELL_CLASS,
  SD_MOBILE_TABLIST_CLASS,
  SD_MOBILE_TAB_PANEL_PT_CLASS,
  SD_MOBILE_TOPBAR_FLOATING_INNER_CLASS,
  SD_MOBILE_TOPBAR_FLOATING_SHELL_CLASS,
  SD_PAGE_GRID_CLASS,
  SD_PAGE_INNER_MAX_CLASS,
} from '../../constants/homepageTypography';

/** Skeleton del detalle de servicio — estructura real + shimmer unificado. */
export function ServiceDetailSkeleton() {
  return (
    <div className="min-h-screen bg-surface-tinted" aria-busy="true" aria-label="Cargando servicio">
      <div className="lg:hidden">
        <div className="relative w-full">
          <div className={`${SD_MOBILE_TOPBAR_FLOATING_SHELL_CLASS} opacity-100`}>
            <div className={SD_MOBILE_TOPBAR_FLOATING_INNER_CLASS}>
              <SileoSkeleton className="h-11 w-11" rounded="full" />
              <SileoSkeleton className="h-11 w-11" rounded="full" />
            </div>
          </div>
          <div className="sd-mobile-hero relative w-full overflow-hidden">
            <SileoSkeleton className="h-full w-full rounded-none" />
            <div className="sd-mobile-hero-indicator-scrim" aria-hidden />
            <div className="sd-mobile-hero-indicator-dots" aria-hidden>
              <span className="sd-mobile-hero-indicator-dot sd-mobile-hero-indicator-dot--active" />
              <span className="sd-mobile-hero-indicator-dot sd-mobile-hero-indicator-dot--inactive" />
              <span className="sd-mobile-hero-indicator-dot sd-mobile-hero-indicator-dot--inactive" />
            </div>
          </div>
          <div
            className={`relative ${SD_MOBILE_SHEET_OVERLAP_CLASS} rounded-t-xl bg-white ${SD_MOBILE_SHEET_TOP_CLASS} ${SD_MOBILE_SCROLL_PAD_CLASS} shadow-[0_-1px_0_hsl(var(--line))]`}
          >
            <div className={SD_MOBILE_IDENTITY_GUTTER_CLASS}>
              <div className={SD_MOBILE_IDENTITY_STACK_CLASS}>
                <SileoSkeleton className="h-7 w-4/5 rounded-lg" />
                <div className="flex items-start gap-2">
                  <SileoSkeleton className="h-10 w-10 shrink-0 rounded-full" />
                  <div className="min-w-0 flex-1 space-y-1">
                    <SileoSkeleton className="h-4 w-full rounded" />
                    <SileoSkeleton className="h-3 w-3/5 rounded opacity-70" />
                  </div>
                  <SileoSkeleton className="h-9 w-[68px] shrink-0 rounded-full" />
                </div>
              </div>
            </div>
            <section className={SD_MOBILE_TAB_REGION_CLASS} aria-hidden>
              <div className={SD_MOBILE_TABLIST_SHELL_CLASS}>
                <div className={SD_MOBILE_TABLIST_CLASS}>
                  <SileoSkeleton className="h-8 w-[4.5rem] shrink-0 rounded-full opacity-50" />
                  <SileoSkeleton className="h-8 w-[5.5rem] shrink-0 rounded-full opacity-50" />
                  <SileoSkeleton className="h-8 w-[5.25rem] shrink-0 rounded-full opacity-50" />
                  <SileoSkeleton className="h-8 w-[4.25rem] shrink-0 rounded-full opacity-50" />
                  <span className="sd-tablist__spacer" aria-hidden />
                </div>
              </div>
              <div className={`${SD_MOBILE_TAB_PANEL_PT_CLASS} ${SD_MOBILE_GUTTER_CLASS} space-y-2`}>
                {[...Array(4)].map((_, idx) => (
                  <SileoSkeleton key={idx} className="h-3.5 w-full rounded" />
                ))}
              </div>
            </section>
          </div>
        </div>

        <div className={SD_MOBILE_FOOTER_SHELL_CLASS}>
          <div className={`${SD_MOBILE_GUTTER_CLASS} sd-mobile-footer-inner`}>
            <div className="sd-mobile-footer-row">
              <SileoSkeleton className="h-5 w-[140px] min-w-0 flex-1 rounded" />
              <SileoSkeleton className="h-11 w-[120px] shrink-0 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      <div className="hidden lg:block bg-surface-tinted">
        <div className={`${SD_PAGE_INNER_MAX_CLASS} py-6`}>
          <div className={SD_PAGE_GRID_CLASS}>
            <SileoSkeleton className="h-[400px] w-full rounded-xl" />
            <SileoSkeleton className="h-[320px] w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
