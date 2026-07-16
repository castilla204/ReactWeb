import { CheckCircle2 } from 'lucide-react';
import { SileoSkeleton } from '../ui/sileo-skeleton';

/** Barra placeholder con el gris del token del centro de notificaciones (visible sobre la superficie
 * blanca de la fila) en vez del `bg-surface-tinted` casi blanco por defecto de SileoSkeleton. */
function NcBar({ className, delayMs }: { className: string; delayMs: number }) {
    return (
        <SileoSkeleton
            className={`${className} bg-[hsl(var(--nc-skeleton))]`}
            shimmerDelayMs={delayMs}
        />
    );
}

/** Filas de carga compartidas — antes el drawer usaba un spinner centrado (SileoLoader) mientras la
 * página móvil ya usaba skeletons; el producto pide "skeleton, no spinner en medio del contenido".
 * Cada fila espeja el marco de la notificación real (pill de tono + título/fecha + líneas de mensaje)
 * con hairlines del token --nc-border, para que la transición a los datos no salte ni cambie de piel. */
export function NotificationSkeletonRows({ count = 4 }: { count?: number }) {
    return (
        <div className="nc-skeleton-list" aria-hidden="true">
            {Array.from({ length: count }, (_, i) => {
                const base = i * 90;
                return (
                    <div key={i} className="nc-skeleton-item">
                        {/* Pill de tono */}
                        <NcBar className="h-4 w-14 rounded-full" delayMs={base} />
                        {/* Título + fecha */}
                        <div className="nc-skeleton-row">
                            <NcBar className="h-3.5 w-2/3 rounded" delayMs={base + 70} />
                            <NcBar className="h-3 w-8 rounded" delayMs={base + 120} />
                        </div>
                        {/* Cuerpo del mensaje */}
                        <NcBar className="h-3 w-full rounded" delayMs={base + 170} />
                        <NcBar className="h-3 w-4/5 rounded" delayMs={base + 220} />
                    </div>
                );
            })}
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
