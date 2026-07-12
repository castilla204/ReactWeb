import { SystemStatusDto } from '../types/searchDetails';
import { CheckCircle, Circle, Clock } from 'lucide-react';
import { cn } from '../lib/utils';

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
    const isActive = (index: number) => index <= currentIndex;

    if (pastStatuses.length === 0) return null;

    return (
        <div className="space-y-3">
            {pastStatuses.map((status, index) => {
                const isCurrent = index === pastStatuses.length - 1;

                return (
                    <div key={status.id} className="flex gap-3 items-start">
                        {/* Simple Icon */}
                        <div className={cn(
                            "flex items-center justify-center w-6 h-6 rounded-full flex-shrink-0 mt-0.5",
                            "bg-success-tint text-success"
                        )}>
                            <CheckCircle className="w-3.5 h-3.5" strokeWidth={2} />
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

