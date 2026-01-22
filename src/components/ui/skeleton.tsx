import { cn } from "../../lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-gray-200", className)}
      {...props}
    />
  );
}

// ✅ Skeleton específico para categorías - Estilo Airbnb
export function CategorySkeleton() {
  return (
    <div className="w-full flex items-center gap-4 p-4 mb-3 rounded-lg bg-white shadow-sm animate-fade-in">
      {/* Imagen skeleton */}
      <Skeleton className="w-12 h-12 rounded-lg flex-shrink-0" />
      
      {/* Texto skeleton */}
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4 rounded" />
        <Skeleton className="h-3 w-1/2 rounded" />
      </div>
    </div>
  );
}

// ✅ Skeleton con shimmer effect (más moderno)
export function ShimmerSkeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-gray-200",
        "before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent",
        className
      )}
      {...props}
    />
  );
}

// ✅ Skeleton para categoría con shimmer
export function CategorySkeletonShimmer() {
  return (
    <div className="w-full flex items-center gap-4 p-4 mb-3 rounded-lg bg-white shadow-sm animate-fade-in">
      {/* Imagen skeleton con shimmer */}
      <ShimmerSkeleton className="w-12 h-12 rounded-lg flex-shrink-0" />
      
      {/* Texto skeleton con shimmer */}
      <div className="flex-1 space-y-2">
        <ShimmerSkeleton className="h-4 w-3/4 rounded" />
        <ShimmerSkeleton className="h-3 w-1/2 rounded" />
      </div>
    </div>
  );
}

// ✅ Skeleton para tipo de servicio
export function ServiceTypeSkeletonShimmer() {
  return (
    <div className="w-full p-3 mb-2 rounded-lg bg-white border border-gray-100 shadow-sm animate-fade-in">
      <ShimmerSkeleton className="h-4 w-2/3 rounded" />
    </div>
  );
}

// ✅ Skeleton para card de servicio de homepage (móvil y desktop)
export function HomepageServiceCardSkeleton() {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const cardWidth = isMobile ? '160px' : '169px';
  
  return (
    <div className="flex-shrink-0 animate-fade-in" style={{ width: cardWidth }}>
      <div className="relative cursor-pointer group w-full">
        {/* Imagen skeleton */}
        <div className="relative w-full overflow-hidden mb-2" style={{ aspectRatio: '1', borderRadius: '20px', width: '100%' }}>
          <ShimmerSkeleton className="w-full h-full rounded-[20px]" />
          
          {/* Badge skeleton */}
          <div className="absolute top-3 left-3 z-10">
            <ShimmerSkeleton className="h-6 w-20 rounded-full" />
          </div>
          
          {/* Botón favorito skeleton */}
          <div className="absolute top-3 right-3 z-10">
            <ShimmerSkeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
        
        {/* Información skeleton */}
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
    </div>
  );
}
