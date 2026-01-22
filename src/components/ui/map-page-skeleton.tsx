import { CategorySkeletonShimmer } from './skeleton';

export function MapPageSkeleton() {
  return (
    <div className="fixed inset-0 z-[99999] bg-white flex flex-col" style={{ pointerEvents: 'auto' }}>
      {/* Header skeleton */}
      <div className="h-16 bg-white border-b border-gray-200 flex items-center px-4">
        <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
        <div className="flex-1" />
        <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
      </div>

      {/* Map skeleton */}
      <div className="flex-1 relative bg-gray-100">
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      </div>

      {/* Bottom drawer skeleton */}
      <div className="h-[70vh] bg-white rounded-t-[20px] shadow-[0_-8px_32px_rgba(0,0,0,0.15)] border-t border-gray-100 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
        </div>
        
        <div className="space-y-0">
          {[...Array(3)].map((_, index) => (
            <CategorySkeletonShimmer key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}
