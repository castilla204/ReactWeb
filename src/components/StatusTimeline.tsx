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
                            "flex items-center justify-center w-6 h-6 rounded-full border-2 flex-shrink-0 mt-0.5",
                            "bg-primary border-primary text-primary-foreground"
                        )}>
                            <CheckCircle className="w-3.5 h-3.5" />
                        </div>

                        {/* Status Content - Simplified */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-xs font-semibold text-foreground">
                                    {status.displayName}
                                </h4>
                                {isCurrent && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary">
                                        Actual
                                    </span>
                                )}
                            </div>
                            {status.description && (
                                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
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

