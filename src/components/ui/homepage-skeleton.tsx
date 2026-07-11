import { SileoSkeleton } from './sileo-skeleton';

/** Skeleton de homepage — estructura estable + shimmer unificado. */
export function HomepageSkeleton() {
  return (
    <div
      className="min-h-screen bg-white"
      style={{
        position: 'relative',
        overflow: 'hidden',
        paddingBottom: 'calc(65px + env(safe-area-inset-bottom, 0px))',
      }}
      aria-busy="true"
      aria-label="Cargando inicio"
    >
      {/* Bottom Bar skeleton - SIEMPRE PRESENTE EN MÓVIL */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50"
        style={{
          height: 'calc(65px + env(safe-area-inset-bottom, 0px))',
          paddingTop: '11px',
          paddingBottom: 'max(11px, env(safe-area-inset-bottom))',
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          display: 'block',
          visibility: 'visible',
        }}
      >
        <div
          className="flex items-center justify-center h-[44px] px-1 gap-0 w-full"
          style={{ height: '44px' }}
        >
          {[...Array(4)].map((_, index) => (
            <div
              key={index}
              className="flex flex-col items-center justify-center"
              style={{ width: '80px', height: '44px', flexShrink: 0 }}
            >
              <SileoSkeleton className="h-6 w-6 rounded-full mb-1" />
              <SileoSkeleton className="h-2 w-12 rounded" />
            </div>
          ))}
        </div>
      </nav>

      {/* Header skeleton - Solo Desktop */}
      <div className="hidden md:block bg-white border-b border-gray-200">
        <div className="max-w-[1760px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div
            className="flex items-center justify-center mb-3 max-w-[850px] mx-auto gap-8"
            style={{ minHeight: '40px' }}
          >
            {[...Array(3)].map((_, index) => (
              <SileoSkeleton key={index} className="h-10 w-24 rounded" />
            ))}
          </div>
          <div className="max-w-[850px] mx-auto" style={{ minHeight: '56px' }}>
            <SileoSkeleton className="h-14 w-full rounded-full" />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div
        className="pt-3 md:pt-10 md:pb-0"
        style={{
          paddingTop: '12px',
          paddingBottom: '0px',
          minHeight: 'calc(100vh - 65px - env(safe-area-inset-bottom, 0px))',
        }}
      >
        <div className="md:pt-4" style={{ paddingTop: '8px' }}>
          <div className="w-full flex justify-center">
            <div className="w-full max-w-[95%] md:max-w-[85%] lg:max-w-[80%]">
              <div className="space-y-8 md:space-y-12">
                {[...Array(2)].map((sectionIdx) => (
                  <div key={sectionIdx} style={{ minHeight: '240px' }}>
                    <div
                      className="mb-4 px-4 md:px-0"
                      style={{ minHeight: '48px', marginBottom: '16px' }}
                    >
                      <SileoSkeleton className="h-6 w-48 mb-2 rounded" />
                      <SileoSkeleton className="h-4 w-32 rounded" />
                    </div>
                    <div
                      className="flex overflow-x-auto scrollbar-hide gap-3 px-4 md:px-0"
                      style={{
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                        minHeight: '184px',
                        height: '184px',
                      }}
                    >
                      {[...Array(4)].map((_, index) => (
                        <div
                          key={index}
                          className="flex-shrink-0"
                          style={{ width: '160px', height: '184px', flexShrink: 0 }}
                        >
                          <SileoSkeleton className="h-[160px] w-[160px] rounded-[20px] mb-2" />
                          <SileoSkeleton className="h-4 w-full rounded" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
