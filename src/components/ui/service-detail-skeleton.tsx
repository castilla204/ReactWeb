import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import {
  SD_MOBILE_FOOTER_SHELL_CLASS,
  SD_MOBILE_GUTTER_CLASS,
  SD_MOBILE_SCROLL_PAD_CLASS,
  SD_MOBILE_SHEET_OVERLAP_CLASS,
  SD_MOBILE_SHEET_TOP_CLASS,
  SD_MOBILE_TOPBAR_FLOATING_INNER_CLASS,
  SD_MOBILE_TOPBAR_FLOATING_SHELL_CLASS,
  SD_PAGE_GRID_CLASS,
  SD_PAGE_INNER_MAX_CLASS,
} from '../../constants/homepageTypography';

export function ServiceDetailSkeleton() {
  return (
    <SkeletonTheme baseColor="#f3f4f6" highlightColor="#e5e7eb">
      <div className="min-h-screen bg-[#fafafa]">
        <div className="lg:hidden">
          <div className="relative w-full">
            <div className={`${SD_MOBILE_TOPBAR_FLOATING_SHELL_CLASS} opacity-100`}>
              <div className={SD_MOBILE_TOPBAR_FLOATING_INNER_CLASS}>
                <Skeleton height={44} width={44} borderRadius="50%" />
                <Skeleton height={44} width={44} borderRadius="50%" />
              </div>
            </div>
            <div className="grid aspect-[4/3] w-full grid-cols-2">
              <Skeleton height="100%" width="100%" borderRadius={0} className="!h-full min-h-[240px]" />
              <Skeleton height="100%" width="100%" borderRadius={0} className="!h-full min-h-[240px]" />
            </div>
            <div
              className={`relative ${SD_MOBILE_SHEET_OVERLAP_CLASS} rounded-t-2xl bg-white ${SD_MOBILE_SHEET_TOP_CLASS} ${SD_MOBILE_SCROLL_PAD_CLASS} shadow-[0_-2px_14px_rgba(15,23,42,0.07)]`}
            >
              <div className={SD_MOBILE_GUTTER_CLASS}>
                <Skeleton height={26} width="75%" className="mb-4" />
                <div className="mb-4 flex items-center gap-3">
                  <Skeleton height={44} width={44} borderRadius="50%" />
                  <div className="flex-1">
                    <Skeleton height={18} width="50%" className="mb-2" />
                    <Skeleton height={14} width="40%" />
                  </div>
                  <Skeleton height={36} width={72} borderRadius={9999} />
                </div>
                <div className="flex items-center justify-between gap-2 pb-4">
                  <div className="flex flex-1 gap-1">
                    {[...Array(7)].map((_, idx) => (
                      <Skeleton key={idx} height={28} className="flex-1" borderRadius={6} />
                    ))}
                  </div>
                  <Skeleton height={14} width={72} />
                </div>
              </div>
              <div className="border-t border-[#ebebeb]">
                <div className={`flex ${SD_MOBILE_GUTTER_CLASS}`}>
                  <Skeleton height={48} width="50%" borderRadius={0} />
                  <Skeleton height={48} width="50%" borderRadius={0} />
                </div>
                <div className={`pt-4 pb-6 ${SD_MOBILE_GUTTER_CLASS}`}>
                  <Skeleton height={14} count={4} className="mb-2" />
                </div>
              </div>
            </div>
          </div>

          <div className={SD_MOBILE_FOOTER_SHELL_CLASS}>
            <div className={`${SD_MOBILE_GUTTER_CLASS} sd-mobile-footer-inner`}>
              <div className="sd-mobile-footer-row">
                <Skeleton height={20} width={140} borderRadius={4} className="min-w-0 flex-1" />
                <Skeleton height={44} width={120} borderRadius={9999} className="shrink-0" />
              </div>
            </div>
          </div>
        </div>

        <div className="hidden lg:block bg-[#fafafa]">
          <div className={`${SD_PAGE_INNER_MAX_CLASS} py-6`}>
            <div className={SD_PAGE_GRID_CLASS}>
              <Skeleton height={400} width="100%" borderRadius={12} />
              <Skeleton height={320} width="100%" borderRadius={12} />
            </div>
          </div>
        </div>
      </div>
    </SkeletonTheme>
  );
}
