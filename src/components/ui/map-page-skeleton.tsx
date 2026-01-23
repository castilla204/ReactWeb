import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

export function MapPageSkeleton() {
  return (
    <SkeletonTheme baseColor="#f3f4f6" highlightColor="#e5e7eb">
      <div className="fixed inset-0 z-[99999] bg-white flex flex-col" style={{ pointerEvents: 'auto' }}>
        {/* ✅ Header skeleton - Mejorado */}
        <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4">
          <Skeleton height={32} width={32} borderRadius="50%" />
          <div className="flex-1" />
          <Skeleton height={40} width={40} borderRadius="50%" />
        </div>

        {/* ✅ Map skeleton - Mejorado con gradiente */}
        <div className="flex-1 relative bg-gray-100">
          <div className="absolute inset-0">
            <Skeleton height="100%" width="100%" borderRadius={0} />
          </div>
        </div>

        {/* ✅ Bottom drawer skeleton - Mejorado y más realista */}
        <div className="h-[30vh] bg-white rounded-t-[20px] shadow-[0_-8px_32px_rgba(0,0,0,0.15)] border-t border-gray-100 p-4">
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
