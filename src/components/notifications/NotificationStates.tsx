import { CheckCircle2 } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

/** Filas de carga compartidas — antes el drawer usaba un spinner centrado (SileoLoader) mientras la
 * página móvil ya usaba skeletons; el producto pide "skeleton, no spinner en medio del contenido". */
export function NotificationSkeletonRows({ count = 4 }: { count?: number }) {
    return (
        <div className="nc-skeleton-list" aria-hidden="true">
            {Array.from({ length: count }, (_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-none border-b last:border-b-0" />
            ))}
        </div>
    );
}

export function NotificationEmptyState() {
    return (
        <div className="nc-state">
            <div className="nc-state-icon">
                <CheckCircle2 className="h-5 w-5" />
            </div>
            <p className="nc-state-title">Todo al día</p>
            <p className="nc-state-text">No tienes notificaciones pendientes en este momento.</p>
        </div>
    );
}
