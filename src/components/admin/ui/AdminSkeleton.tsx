import { cn } from '../../../lib/utils';
import { SileoLoader } from '../../ui/sileo-loader';

/** Skeleton unificado para el panel de administración. */
export const AdminSkeleton = ({ className }: { className?: string }) => (
  <div className={cn('animate-pulse rounded-md bg-[hsl(220_14%_92%)]', className)} />
);

/** Filas de tabla en carga */
export const AdminTableSkeleton = ({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) => (
  <div className="admin-card-body space-y-3">
    {Array.from({ length: rows }).map((_, r) => (
      <div key={r} className="flex gap-3">
        {Array.from({ length: cols }).map((_, c) => (
          <AdminSkeleton key={c} className="h-5 flex-1" />
        ))}
      </div>
    ))}
  </div>
);

export const AdminSpinner = ({ size = 18 }: { size?: number }) => (
  <span className="admin-spinner" style={{ width: size, height: size }}>
    <SileoLoader size="sm" color="current" />
  </span>
);
