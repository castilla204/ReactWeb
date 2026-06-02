import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

export function MapPageSkeleton() {
  return (
    <SkeletonTheme baseColor="#f3f4f6" highlightColor="#e5e7eb">
      <div className="fixed inset-0 z-[99999] flex flex-col bg-white/95 backdrop-blur-sm" style={{ pointerEvents: 'none' }}>
        {/* ✅ Header skeleton - Mejorado */}
        <div
          className="flex items-center justify-between px-4 pb-2 pt-[max(0.625rem,env(safe-area-inset-top))]"
          style={{ minHeight: '3.5rem' }}
        >
          <Skeleton height={32} width={32} borderRadius="50%" />
          <div className="flex-1" />
          <Skeleton height={32} width={32} borderRadius="50%" />
        </div>

        {/* ✅ Map skeleton - Mejorado con gradiente */}
        <div className="flex-1 relative bg-gray-100">
          <div className="absolute inset-0">
            <Skeleton height="100%" width="100%" borderRadius={0} />
          </div>
        </div>

        {/* ✅ Bottom drawer skeleton - Mejorado y más realista */}
        <div className="h-[34vh] rounded-t-[24px] border-t border-[#e8e8e8] bg-white p-4 shadow-[0_-12px_40px_rgba(0,0,0,0.12)]">
          <div className="flex items-center justify-between mb-4">
            <Skeleton height={20} width={120} borderRadius={4} />
            <Skeleton height={32} width={32} borderRadius="50%" />
          </div>
          
          <div className="space-y-3">
            {[...Array(2)].map((_, index) => (
              <div key={index} className="flex gap-3">
                <Skeleton height={80} width={80} borderRadius={12} className="flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton height={16} width="80%" borderRadius={4} />
                  <Skeleton height={14} width="60%" borderRadius={4} />
                  <Skeleton height={14} width="40%" borderRadius={4} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SkeletonTheme>
  );
}
