import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

export function HomepageSkeleton() {
  return (
    <SkeletonTheme baseColor="#f3f4f6" highlightColor="#e5e7eb">
      <div 
        className="min-h-screen bg-white"
        style={{
          // ✅ Evitar layout shifts - Estructura estable
          position: 'relative',
          overflow: 'hidden',
          // ✅ Asegurar que el bottom bar siempre esté presente
          paddingBottom: '65px',
        }}
      >
        {/* ✅ Bottom Bar skeleton - SIEMPRE PRESENTE EN MÓVIL (elemento estático) */}
        <nav 
          className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50" 
          style={{ 
            height: '65px', 
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
                style={{ 
                  width: '80px', 
                  height: '44px',
                  flexShrink: 0,
                }}
              >
                <Skeleton 
                  height={24} 
                  width={24} 
                  borderRadius="50%" 
                  className="mb-1"
                  style={{ display: 'block' }}
                />
                <Skeleton 
                  height={8} 
                  width={48} 
                  borderRadius={4}
                  style={{ display: 'block' }}
                />
              </div>
            ))}
          </div>
        </nav>

        {/* ✅ Header skeleton - Solo Desktop (sin drawer en móvil) */}
        <div className="hidden md:block bg-white border-b border-gray-200">
          <div className="max-w-[1760px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div 
              className="flex items-center justify-center mb-3 max-w-[850px] mx-auto gap-8"
              style={{ minHeight: '40px' }}
            >
              {[...Array(3)].map((_, index) => (
                <Skeleton key={index} height={40} width={96} borderRadius={4} />
              ))}
            </div>
            <div className="max-w-[850px] mx-auto" style={{ minHeight: '56px' }}>
              <Skeleton height={56} borderRadius={9999} />
            </div>
          </div>
        </div>

        {/* ✅ Main content - Estructura exacta del contenido real */}
        <div 
          className="pt-3 md:pt-10 md:pb-0" 
          style={{ 
            paddingTop: '12px', 
            paddingBottom: '0px',
            // ✅ Altura mínima estable para evitar shifts
            // En móvil: 100vh - 65px (bottom bar), en desktop: 100vh - 120px (header) - 65px (bottom bar)
            minHeight: 'calc(100vh - 65px)',
          }}
        >
          <div className="md:pt-4" style={{ paddingTop: '8px' }}>
            <div className="w-full flex justify-center">
              <div className="w-full max-w-[95%] md:max-w-[85%] lg:max-w-[80%]">
                <div className="space-y-8 md:space-y-12">
                  {/* Primera sección - Estructura exacta */}
                  <div style={{ minHeight: '240px' }}>
                    {/* Título y subtítulo - Altura fija */}
                    <div 
                      className="mb-4 px-4 md:px-0" 
                      style={{ 
                        minHeight: '48px',
                        marginBottom: '16px',
                      }}
                    >
                      <Skeleton height={24} width={192} borderRadius={4} className="mb-2" />
                      <Skeleton height={16} width={128} borderRadius={4} />
                    </div>
                    {/* Cards horizontales - Altura fija del contenedor */}
                    <div 
                      className="flex overflow-x-auto scrollbar-hide gap-3 px-4 md:px-0" 
                      style={{ 
                        scrollbarWidth: 'none', 
                        msOverflowStyle: 'none',
                        // ✅ Altura fija exacta: 160px imagen + 16px texto + 8px margin = 184px
                        minHeight: '184px',
                        height: '184px',
                      }}
                    >
                      {[...Array(4)].map((_, index) => (
                        <div 
                          key={index} 
                          className="flex-shrink-0" 
                          style={{ 
                            width: '160px', 
                            height: '184px',
                            // ✅ Evitar reflows
                            flexShrink: 0,
                          }}
                        >
                          <Skeleton 
                            height={160} 
                            width={160} 
                            borderRadius={20} 
                            className="mb-2"
                            style={{ 
                              display: 'block',
                              flexShrink: 0,
                            }}
                          />
                          <Skeleton 
                            height={16} 
                            width="100%" 
                            borderRadius={4}
                            style={{ 
                              display: 'block',
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Segunda sección - Estructura exacta */}
                  <div style={{ minHeight: '240px' }}>
                    <div 
                      className="mb-4 px-4 md:px-0" 
                      style={{ 
                        minHeight: '48px',
                        marginBottom: '16px',
                      }}
                    >
                      <Skeleton height={24} width={192} borderRadius={4} className="mb-2" />
                      <Skeleton height={16} width={128} borderRadius={4} />
                    </div>
                    <div 
                      className="flex overflow-x-auto scrollbar-hide gap-3 px-4 md:px-0" 
                      style={{ 
                        scrollbarWidth: 'none', 
                        msOverflowStyle: 'none',
                        // ✅ Altura fija exacta
                        minHeight: '184px',
                        height: '184px',
                      }}
                    >
                      {[...Array(4)].map((_, index) => (
                        <div 
                          key={index} 
                          className="flex-shrink-0" 
                          style={{ 
                            width: '160px', 
                            height: '184px',
                            flexShrink: 0,
                          }}
                        >
                          <Skeleton 
                            height={160} 
                            width={160} 
                            borderRadius={20} 
                            className="mb-2"
                            style={{ 
                              display: 'block',
                              flexShrink: 0,
                            }}
                          />
                          <Skeleton 
                            height={16} 
                            width="100%" 
                            borderRadius={4}
                            style={{ 
                              display: 'block',
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ✅ Bottom Bar skeleton - Visible en móvil */}
        <nav 
          className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50" 
          style={{ 
            height: '65px', 
            paddingTop: '11px', 
            paddingBottom: 'max(11px, env(safe-area-inset-bottom))',
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 50,
            // ✅ Asegurar visibilidad
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
                style={{ 
                  width: '80px', 
                  height: '44px',
                  flexShrink: 0,
                }}
              >
                <Skeleton 
                  height={24} 
                  width={24} 
                  borderRadius="50%" 
                  className="mb-1"
                  style={{ display: 'block' }}
                />
                <Skeleton 
                  height={8} 
                  width={48} 
                  borderRadius={4}
                  style={{ display: 'block' }}
                />
              </div>
            ))}
          </div>
        </nav>
      </div>
    </SkeletonTheme>
  );
}
