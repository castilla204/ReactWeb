import { SileoSkeleton } from './sileo-skeleton';

/** Skeleton de página de mapa — estructura previa completa con shimmer unificado. */
export function MapPageSkeleton() {
  return (
    <div
      className="fixed inset-0 z-[99999] flex flex-col bg-white/95 backdrop-blur-sm"
      style={{ pointerEvents: 'none' }}
      aria-busy="true"
      aria-label="Cargando mapa"
    >
      {/* Header skeleton */}
      <div
        className="flex items-center justify-between px-4 pb-2 pt-[max(0.625rem,env(safe-area-inset-top))]"
        style={{ minHeight: '3.5rem' }}
      >
        <SileoSkeleton className="h-8 w-8" rounded="full" />
        <div className="flex-1" />
        <SileoSkeleton className="h-8 w-8" rounded="full" />
      </div>

      {/* Map skeleton */}
      <div className="flex-1 relative bg-[#eef2f6]">
        <SileoSkeleton className="absolute inset-0 rounded-none" />
      </div>

      {/* Bottom drawer skeleton */}
      <div className="h-[50vh] rounded-t-[24px] border-t border-[#e8e8e8] bg-white p-4 shadow-[0_-12px_40px_rgba(0,0,0,0.12)]">
        <div className="flex items-center justify-between mb-4">
          <SileoSkeleton className="h-5 w-32 rounded" />
          <SileoSkeleton className="h-8 w-8" rounded="full" />
        </div>

        <div className="space-y-3">
          {[...Array(2)].map((_, index) => (
            <div key={index} className="flex gap-3">
              <SileoSkeleton className="h-20 w-20 shrink-0 rounded-xl" />
              <div className="flex-1 space-y-2">
                <SileoSkeleton className="h-4 w-4/5 rounded" />
                <SileoSkeleton className="h-3.5 w-3/5 rounded" />
                <SileoSkeleton className="h-3.5 w-2/5 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
