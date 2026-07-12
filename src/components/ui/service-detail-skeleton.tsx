import { SileoSkeleton } from './sileo-skeleton';
import {
  SD_MOBILE_FOOTER_SHELL_CLASS,
  SD_MOBILE_GUTTER_CLASS,
  SD_MOBILE_IDENTITY_STACK_CLASS,
  SD_MOBILE_SCROLL_PAD_TRUST_CLASS,
  SD_MOBILE_SHEET_OVERLAP_CLASS,
  SD_MOBILE_SHEET_TOP_CLASS,
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
          <div className="grid aspect-[4/3] w-full grid-cols-2">
            <SileoSkeleton className="h-full min-h-[240px] rounded-none" />
            <SileoSkeleton className="h-full min-h-[240px] rounded-none" />
          </div>
          <div
            className={`relative ${SD_MOBILE_SHEET_OVERLAP_CLASS} rounded-t-xl bg-white ${SD_MOBILE_SHEET_TOP_CLASS} ${SD_MOBILE_SCROLL_PAD_TRUST_CLASS} shadow-[0_-1px_0_hsl(var(--line))]`}
          >
            <div className={`${SD_MOBILE_GUTTER_CLASS} ${SD_MOBILE_IDENTITY_STACK_CLASS}`}>
              <SileoSkeleton className="h-7 w-4/5 rounded-lg" />
              <div className="flex items-center gap-3">
                <SileoSkeleton className="h-11 w-11" rounded="full" />
                <div className="flex-1">
                  <SileoSkeleton className="mb-1.5 h-[18px] w-1/2 rounded" />
                  <SileoSkeleton className="h-3.5 w-3/5 rounded" />
                </div>
                <SileoSkeleton className="h-10 w-[72px] rounded-full" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <SileoSkeleton className="h-3 w-24 rounded" />
                  <SileoSkeleton className="h-3.5 w-20 rounded" />
                </div>
                <div className="flex gap-1">
                  {[...Array(7)].map((_, idx) => (
                    <SileoSkeleton key={idx} className="h-7 w-7 rounded-full" />
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4 border-t border-line">
              <div className={`flex ${SD_MOBILE_GUTTER_CLASS}`}>
                <SileoSkeleton className="h-12 w-1/2 rounded-none" />
                <SileoSkeleton className="h-12 w-1/2 rounded-none" />
              </div>
              <div className={`pt-4 pb-6 ${SD_MOBILE_GUTTER_CLASS} space-y-2`}>
                {[...Array(4)].map((_, idx) => (
                  <SileoSkeleton key={idx} className="h-3.5 w-full rounded" />
                ))}
              </div>
            </div>
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
