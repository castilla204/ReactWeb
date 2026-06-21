import { cn } from "../../lib/utils";
import { SileoSkeleton } from "./sileo-skeleton";

/**
 * Skeleton legacy mantenido por compatibilidad.
 * Los nuevos componentes deben usar `SileoSkeleton` directamente.
 */

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return <SileoSkeleton className={className} {...props} />;
}

// ✅ Skeleton específico para categorías — ahora con shimmer unificado
export function CategorySkeleton() {
  return (
    <div className="w-full flex items-center gap-4 p-4 mb-3 rounded-lg bg-white shadow-sm animate-fade-in">
      <SileoSkeleton className="w-12 h-12 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <SileoSkeleton className="h-4 w-3/4 rounded" />
        <SileoSkeleton className="h-3 w-1/2 rounded" />
      </div>
    </div>
  );
}

// ✅ Skeleton con shimmer effect — delegado en SileoSkeleton
export function ShimmerSkeleton({ className, ...props }: SkeletonProps) {
  return <SileoSkeleton className={className} {...props} />;
}

// ✅ Skeleton para categoría con shimmer
export function CategorySkeletonShimmer() {
  return (
    <div className="w-full flex items-center gap-4 p-4 mb-3 rounded-lg bg-white shadow-sm animate-fade-in">
      <SileoSkeleton className="w-12 h-12 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <SileoSkeleton className="h-4 w-3/4 rounded" />
        <SileoSkeleton className="h-3 w-1/2 rounded" />
      </div>
    </div>
  );
}

// ✅ Skeleton para tipo de servicio
export function ServiceTypeSkeletonShimmer() {
  return (
    <div className="w-full p-3 mb-2 rounded-lg bg-white border border-gray-100 shadow-sm animate-fade-in">
      <SileoSkeleton className="h-4 w-2/3 rounded" />
    </div>
  );
}

// ✅ Skeleton simplificado para card de servicio de homepage
export function HomepageServiceCardSkeleton() {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const cardWidth = isMobile ? '160px' : '169px';

  return (
    <div className="flex-shrink-0" style={{ width: cardWidth }}>
      <SileoSkeleton className="w-full aspect-square rounded-[20px] mb-2" />
      <SileoSkeleton className="h-4 w-3/4 rounded mb-1" />
      <SileoSkeleton className="h-3 w-1/2 rounded" />
    </div>
  );
}
