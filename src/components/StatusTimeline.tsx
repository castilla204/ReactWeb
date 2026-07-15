import { SystemStatusDto } from '../types/searchDetails';
import { CheckCircle, Circle, Clock, XCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { getStatusTone, StatusTone } from '../utils/statusUtils';

// Solo los desenlaces (éxito/cancelación) encienden color; los hitos
// intermedios quedan en gris tranquilo — mismo criterio que CHAT_STATUS_PILL_CLASSES
// en Chat.tsx, fuente: getStatusTone (nunca el hex del seed).
const TIMELINE_TONE_CLASSES: Record<StatusTone, string> = {
    success: 'bg-success-tint text-success',
    danger: 'bg-destructive/10 text-destructive',
    warning: 'bg-line-soft text-ink-muted',
    info: 'bg-line-soft text-ink-muted',
    neutral: 'bg-line-soft text-ink-muted',
};

const TIMELINE_TONE_ICON: Record<StatusTone, typeof CheckCircle> = {
    success: CheckCircle,
    danger: XCircle,
    warning: Clock,
    info: Circle,
    neutral: Circle,
};

interface StatusTimelineProps {
    currentStatus: SystemStatusDto;
    allStatuses: SystemStatusDto[];
    statusType: 'SearchHireStatus' | 'AppointmentStatus';
}

export default function StatusTimeline({ currentStatus, allStatuses, statusType }: StatusTimelineProps) {
    // Filtrar estados por tipo y ordenar por sortOrder
    const filteredStatuses = allStatuses
        .filter(s => s.statusType === statusType)
        .sort((a, b) => a.sortOrder - b.sortOrder);

    const currentIndex = filteredStatuses.findIndex(s => s.statusValue === currentStatus.statusValue);
    // Solo mostrar estados pasados (hasta el actual, incluido)
    const pastStatuses = filteredStatuses.slice(0, currentIndex + 1);

    if (pastStatuses.length === 0) return null;

    return (
        <div className="space-y-3">
            {pastStatuses.map((status, index) => {
                const isCurrent = index === pastStatuses.length - 1;
                const tone = getStatusTone(status);
                const ToneIcon = TIMELINE_TONE_ICON[tone];

                return (
                    <div key={status.id} className="flex gap-3 items-start">
                        {/* Icono coloreado por tono real del estado (éxito/cancelación/etc.) */}
                        <div className={cn(
                            "flex items-center justify-center w-6 h-6 rounded-full flex-shrink-0 mt-0.5",
                            TIMELINE_TONE_CLASSES[tone]
                        )}>
                            <ToneIcon className="w-3.5 h-3.5" strokeWidth={2} />
                        </div>

                        {/* Status Content - Simplified */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-xs font-semibold text-ink-strong">
                                    {status.displayName}
                                </h4>
                                {isCurrent && (
                                    <span className="px-1.5 py-0.5 rounded-full text-badge font-medium bg-brand/10 text-brand">
                                        Actual
                                    </span>
                                )}
                            </div>
                            {status.description && (
                                <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">
                                    {status.description}
                                </p>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

