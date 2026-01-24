import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

export function ServiceDetailSkeleton() {
  return (
    <SkeletonTheme baseColor="#f3f4f6" highlightColor="#e5e7eb">
      <div className="min-h-screen bg-white">
        {/* Versión Móvil */}
        <div className="lg:hidden">
          {/* Botones flotantes skeleton */}
          <div className="fixed top-4 left-4 z-50">
            <Skeleton height={40} width={40} borderRadius="50%" />
          </div>
          <div className="fixed top-4 right-4 z-50 flex gap-2">
            <Skeleton height={40} width={40} borderRadius="50%" />
            <Skeleton height={40} width={40} borderRadius="50%" />
          </div>

          {/* Galería de imágenes skeleton */}
          <div className="relative w-full">
            <Skeleton height={300} width="100%" borderRadius={0} />
          </div>

          {/* Card blanco con contenido */}
          <div className="relative -mt-12 bg-white rounded-t-3xl pt-6 pb-36 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
            {/* Título y ubicación */}
            <div className="mb-4 px-5 text-center">
              <Skeleton height={26} width="80%" className="mx-auto mb-3" />
              <Skeleton height={20} width="60%" className="mx-auto mb-3" />
              <div className="flex flex-wrap items-center justify-center gap-1.5 mb-3">
                {[...Array(7)].map((_, idx) => (
                  <Skeleton key={idx} height={28} width={32} borderRadius={6} />
                ))}
              </div>
            </div>

            {/* Barra de separación */}
            <div className="border-t border-gray-200 my-6"></div>

            {/* Sección Revisor */}
            <div className="mb-4 px-6">
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
            <div className="mb-6 px-5">
              <div className="flex border-b border-gray-200">
                <Skeleton height={40} width={100} className="mr-4" />
                <Skeleton height={40} width={100} />
              </div>
            </div>

            {/* Contenido skeleton */}
            <div className="pt-6 px-5">
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

            {/* Botón de reserva flotante skeleton */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-40">
              <Skeleton height={48} width="100%" borderRadius={8} />
            </div>
          </div>
        </div>

        {/* Versión Desktop */}
        <div className="hidden lg:block">
          <div className="max-w-[1760px] mx-auto px-8 py-8">
            <div className="grid grid-cols-2 gap-8">
              {/* Columna izquierda - Imágenes */}
              <div>
                <Skeleton height={500} width="100%" borderRadius={12} />
              </div>

              {/* Columna derecha - Contenido */}
              <div>
                <Skeleton height={32} width="80%" className="mb-4" />
                <Skeleton height={20} width="60%" className="mb-6" />
                
                {/* Revisor skeleton */}
                <div className="flex items-center gap-4 mb-6">
                  <Skeleton height={56} width={56} borderRadius="50%" />
                  <div className="flex-1">
                    <Skeleton height={20} width="50%" className="mb-2" />
                    <Skeleton height={16} width="40%" />
                  </div>
                </div>

                <div className="border-t border-gray-200 my-6"></div>

                {/* Descripción skeleton */}
                <div className="mb-6">
                  <Skeleton height={16} width="100%" className="mb-2" />
                  <Skeleton height={16} width="100%" className="mb-2" />
                  <Skeleton height={16} width="90%" className="mb-4" />
                </div>

                {/* Detalles skeleton */}
                <div className="mb-6">
                  <Skeleton height={20} width="40%" className="mb-3" />
                  <div className="flex flex-wrap gap-2">
                    {[...Array(4)].map((_, idx) => (
                      <Skeleton key={idx} height={32} width={80} borderRadius={6} />
                    ))}
                  </div>
                </div>

                {/* Botón de reserva */}
                <Skeleton height={48} width="100%" borderRadius={8} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </SkeletonTheme>
  );
}
