import { ShimmerSkeleton } from './skeleton';

export function HomepageSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      {/* ✅ Header skeleton (AirbnbSearchBar) */}
      <div className="sticky top-0 z-50 bg-[#fbfbfb] border-b border-gray-200">
        {/* Desktop header skeleton */}
        <div className="hidden md:block max-w-[1760px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Tabs skeleton */}
          <div className="flex items-center justify-center mb-3 max-w-[850px] mx-auto gap-8">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="flex items-center gap-3 py-2">
                <ShimmerSkeleton className="w-6 h-6 rounded" />
                <ShimmerSkeleton className="h-4 w-20 rounded" />
              </div>
            ))}
          </div>
          
          {/* Search bar skeleton */}
          <div className="max-w-[850px] mx-auto">
            <div className="flex items-center gap-4">
              <ShimmerSkeleton className="h-14 flex-1 rounded-full" />
            </div>
          </div>
        </div>
        
        {/* Mobile header skeleton */}
        <div className="md:hidden px-4 py-4">
          <ShimmerSkeleton className="h-14 w-full rounded-full" />
        </div>
      </div>

      {/* ✅ Main content skeleton */}
      <div className="pt-3 md:pt-10 md:pb-0" style={{ 
        paddingTop: '12px', 
        paddingBottom: 'calc(65px + max(11px, env(safe-area-inset-bottom)))'
      }}>
        <div className="md:pt-4" style={{ paddingTop: '8px' }}>
          <div className="w-full flex justify-center">
            <div className="w-full max-w-[95%] md:max-w-[85%] lg:max-w-[80%]">
              {/* Skeleton para secciones */}
              <div className="space-y-8 md:space-y-12">
                {/* Primera sección skeleton */}
                <div>
                  <div className="mb-4 px-6 md:px-0">
                    <ShimmerSkeleton className="h-6 w-48 rounded mb-2" />
                    <ShimmerSkeleton className="h-4 w-32 rounded" />
                  </div>
                  <div className="flex overflow-x-auto scrollbar-hide gap-3 px-6 md:px-0" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {[...Array(4)].map((_, index) => (
                      <div key={index} className="flex-shrink-0 w-[160px] md:w-[169px] animate-fade-in">
                        <div className="relative">
                          <ShimmerSkeleton className="w-full aspect-square rounded-[20px] mb-2" />
                          <div className="absolute top-3 left-3">
                            <ShimmerSkeleton className="h-6 w-20 rounded-full" />
                          </div>
                          <div className="absolute top-3 right-3">
                            <ShimmerSkeleton className="h-8 w-8 rounded-full" />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <ShimmerSkeleton className="h-4 w-3/4 rounded" />
                            <ShimmerSkeleton className="h-4 w-12 rounded" />
                          </div>
                          <ShimmerSkeleton className="h-3 w-1/2 rounded" />
                          <div className="flex items-center gap-2">
                            <ShimmerSkeleton className="h-3 w-16 rounded" />
                            <ShimmerSkeleton className="h-3 w-16 rounded" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Segunda sección skeleton */}
                <div>
                  <div className="mb-4 px-6 md:px-0">
                    <ShimmerSkeleton className="h-6 w-48 rounded mb-2" />
                    <ShimmerSkeleton className="h-4 w-32 rounded" />
                  </div>
                  <div className="flex overflow-x-auto scrollbar-hide gap-3 px-6 md:px-0" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {[...Array(4)].map((_, index) => (
                      <div key={index} className="flex-shrink-0 w-[160px] md:w-[169px] animate-fade-in">
                        <div className="relative">
                          <ShimmerSkeleton className="w-full aspect-square rounded-[20px] mb-2" />
                          <div className="absolute top-3 left-3">
                            <ShimmerSkeleton className="h-6 w-20 rounded-full" />
                          </div>
                          <div className="absolute top-3 right-3">
                            <ShimmerSkeleton className="h-8 w-8 rounded-full" />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <ShimmerSkeleton className="h-4 w-3/4 rounded" />
                            <ShimmerSkeleton className="h-4 w-12 rounded" />
                          </div>
                          <ShimmerSkeleton className="h-3 w-1/2 rounded" />
                          <div className="flex items-center gap-2">
                            <ShimmerSkeleton className="h-3 w-16 rounded" />
                            <ShimmerSkeleton className="h-3 w-16 rounded" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Mobile Bottom Bar skeleton */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50" style={{ height: '65px', paddingTop: '11px', paddingBottom: 'max(11px, env(safe-area-inset-bottom))' }}>
        <div className="flex items-center justify-center h-[44px] px-1 gap-0 w-full">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="flex flex-col items-center justify-center" style={{ width: '80px', height: '44px' }}>
              <ShimmerSkeleton className="w-6 h-6 rounded mb-1" />
              <ShimmerSkeleton className="h-2 w-12 rounded" />
            </div>
          ))}
        </div>
      </nav>
    </div>
  );
}
