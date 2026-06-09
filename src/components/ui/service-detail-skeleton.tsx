import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import {
  SD_MOBILE_FLOATING_TOP_CLASS,
  SD_MOBILE_FOOTER_SHELL_CLASS,
  SD_MOBILE_GUTTER_CLASS,
  SD_MOBILE_SCROLL_PAD_CLASS,
  SD_PAGE_GRID_CLASS,
  SD_PAGE_INNER_MAX_CLASS,
} from '../../constants/homepageTypography';

export function ServiceDetailSkeleton() {
  return (
    <SkeletonTheme baseColor="#f3f4f6" highlightColor="#e5e7eb">
      <div className="min-h-screen bg-[#fafafa]">
        {/* Versión Móvil */}
        <div className="lg:hidden">
          {/* Botones flotantes skeleton */}
          <div className={`fixed left-4 z-50 ${SD_MOBILE_FLOATING_TOP_CLASS}`}>
            <Skeleton height={40} width={40} borderRadius="50%" />
          </div>
          <div className={`fixed right-4 z-50 flex gap-2 ${SD_MOBILE_FLOATING_TOP_CLASS}`}>
            <Skeleton height={40} width={40} borderRadius="50%" />
            <Skeleton height={40} width={40} borderRadius="50%" />
          </div>

          {/* Galería de imágenes skeleton */}
          <div className="relative z-10 w-full">
            <Skeleton height={300} width="100%" borderRadius={0} className="aspect-[4/3] !h-auto min-h-[240px]" />
          </div>

          {/* Card blanco con contenido */}
          <div
            className={`relative z-0 -mt-10 rounded-t-2xl bg-white pt-5 ${SD_MOBILE_SCROLL_PAD_CLASS} shadow-[0_-2px_14px_rgba(15,23,42,0.07)] ring-1 ring-black/[0.04]`}
          >
            <div className={`mb-4 text-center ${SD_MOBILE_GUTTER_CLASS}`}>
              <Skeleton height={26} width="80%" className="mx-auto mb-3" />
            </div>

            <div className={`mb-3 ${SD_MOBILE_GUTTER_CLASS}`}>
              <div className="mb-2 flex items-center justify-between gap-3">
                <Skeleton height={14} width={100} borderRadius={4} />
                <Skeleton height={14} width={88} borderRadius={4} />
              </div>
              <Skeleton height={100} width="100%" borderRadius={0} />
            </div>

            <div className={`mb-3 ${SD_MOBILE_GUTTER_CLASS}`}>
              <Skeleton height={14} width={120} className="mb-2" />
              <div className="flex gap-1.5">
                {[...Array(7)].map((_, idx) => (
                  <Skeleton key={idx} height={28} width={32} borderRadius={6} />
                ))}
              </div>
            </div>

            {/* Barra de separación */}
            <div className="border-t border-gray-200 my-6"></div>

            {/* Sección Revisor */}
            <div className={`mb-4 ${SD_MOBILE_GUTTER_CLASS}`}>
              <div className="flex items-start gap-4">
                <Skeleton height={40} width={40} borderRadius="50%" />
                <div className="flex-1">
                  <Skeleton height={20} width="60%" className="mb-2" />
                  <Skeleton height={16} width="40%" />
                </div>
              </div>
            </div>

            {/* Barra de separación */}
            <div className="border-t border-gray-200 my-6"></div>

            {/* Tabs skeleton */}
            <div className={`mb-6 ${SD_MOBILE_GUTTER_CLASS}`}>
              <div className="flex border-b border-gray-200">
                <Skeleton height={40} width={100} className="mr-4" />
                <Skeleton height={40} width={100} />
              </div>
            </div>

            {/* Contenido skeleton */}
            <div className={`pt-6 ${SD_MOBILE_GUTTER_CLASS}`}>
              <Skeleton height={16} width="100%" className="mb-2" />
              <Skeleton height={16} width="100%" className="mb-2" />
              <Skeleton height={16} width="90%" className="mb-4" />
              
              {/* Detalles skeleton */}
              <div className="mb-6">
                <Skeleton height={20} width="40%" className="mb-3" />
                <div className="flex flex-wrap gap-2">
                  {[...Array(4)].map((_, idx) => (
                    <Skeleton key={idx} height={32} width={80} borderRadius={6} />
                  ))}
                </div>
              </div>

              {/* Mapa skeleton */}
              <div className="mb-8">
                <Skeleton height={200} width="100%" borderRadius={8} />
              </div>
            </div>
          </div>

          {/* Barra fija — misma jerarquía que ServiceReviewPage */}
          <div className={SD_MOBILE_FOOTER_SHELL_CLASS}>
            <div className={`${SD_MOBILE_GUTTER_CLASS} sd-mobile-footer-inner`}>
              <div className="sd-mobile-footer-row">
                <Skeleton height={20} width={140} borderRadius={4} className="min-w-0 flex-1" />
                <Skeleton height={48} width={120} borderRadius={9999} className="shrink-0" />
              </div>
            </div>
          </div>
        </div>

        {/* Versión Desktop — alineado con HomepageDesktopTopBar + grid */}
        <div className="hidden lg:block bg-[#fafafa]">
          <div className={`${SD_PAGE_INNER_MAX_CLASS} border-b border-[#e8e8e8]/70 py-5`}>
            <Skeleton height={36} width="100%" borderRadius={8} className="mb-4" />
            <Skeleton height={32} width="55%" borderRadius={6} className="mb-2" />
            <Skeleton height={16} width="35%" borderRadius={4} />
          </div>
          <div className={`${SD_PAGE_INNER_MAX_CLASS} py-4 lg:pt-4`}>
            <div className={SD_PAGE_GRID_CLASS}>
              <div className="space-y-6 lg:space-y-8">
                <Skeleton height={340} width="100%" borderRadius={12} />
                <div className="flex items-center gap-4">
                  <Skeleton height={48} width={48} borderRadius="50%" />
                  <div className="flex-1">
                    <Skeleton height={18} width="40%" className="mb-2" />
                    <Skeleton height={14} width="25%" />
                  </div>
                </div>
                <Skeleton height={72} width="100%" borderRadius={8} />
                <Skeleton height={16} width="100%" count={4} className="mb-1" />
              </div>
              <Skeleton height={280} width="100%" borderRadius={12} />
            </div>
          </div>
        </div>
      </div>
    </SkeletonTheme>
  );
}
