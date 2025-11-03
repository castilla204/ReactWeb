import { Clock, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { formatAvailabilityRange, formatDaysOfWeek, formatTimeSpan, isExpertAvailableNow, type CurrentExpertAvailabilityDto } from '../utils/availability';
import { cn } from '../lib/utils';

interface ExpertAvailabilityProps {
    availability: CurrentExpertAvailabilityDto | null;
    compact?: boolean;
}

export default function ExpertAvailability({ availability, compact = false }: ExpertAvailabilityProps) {
    if (!availability) {
        return (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <XCircle className="w-3.5 h-3.5" />
                <span>Horarios no disponibles</span>
            </div>
        );
    }

    const isAvailableNow = isExpertAvailableNow(availability);
    const daysFormatted = formatDaysOfWeek(availability.daysOfWeek);
    const timeRange = `${formatTimeSpan(availability.startTime)} - ${formatTimeSpan(availability.endTime)}`;

    if (compact) {
        return (
            <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs">
                    {isAvailableNow ? (
                        <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                    ) : (
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                    <span className="font-medium text-foreground">
                        {isAvailableNow ? "Disponible ahora" : "Disponible en horario"}
                    </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground ml-5 flex-wrap">
                    <span>{daysFormatted}</span>
                    <span>•</span>
                    <span>{timeRange}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {isAvailableNow ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                        <Clock className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span className={cn(
                        "font-semibold",
                        isAvailableNow ? "text-green-600" : "text-foreground"
                    )}>
                        {isAvailableNow ? "Disponible ahora" : "Disponible en horario"}
                    </span>
                </div>
            </div>
            
            <div className="pl-6 space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    <span><strong>Días:</strong> {daysFormatted}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    <span><strong>Horario:</strong> {timeRange}</span>
                </div>
            </div>
        </div>
    );
}

