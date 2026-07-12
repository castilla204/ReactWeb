import { useMemo } from 'react';
import { es } from 'date-fns/locale';
import { Calendar } from '../ui/calendar';
import { cn } from '../../lib/utils';
import { SD_CHECKOUT_EMBEDDED_INTERACTIVE_SHELL_CLASS } from '../../constants/homepageTypography';

interface Props {
    /** Inicio del hueco (ISO UTC). */
    startUtc: string;
    /** Etiqueta de la hora local, p.ej. "10:00". Si no se pasa, se deriva de startUtc. */
    timeLabel?: string;
    className?: string;
}

const CAL_CLASS_NAMES = {
    root: 'w-full',
    nav: 'hidden',
    month_caption: 'hidden',
    month: 'flex w-full flex-col gap-2',
    weekdays: 'flex w-full',
    weekday: 'flex-1 text-center text-kicker font-medium uppercase tracking-wide text-ink-soft lg:text-xs',
    week: 'mt-1.5 flex w-full',
    day: 'flex-1 p-[3px]',
} as const;

export function ReadOnlyAppointmentCalendar({ startUtc, timeLabel, className }: Props) {
    const day = useMemo(() => {
        const d = new Date(startUtc);
        return Number.isNaN(d.getTime()) ? null : d;
    }, [startUtc]);

    const monthLabel = useMemo(() => {
        if (!day) return '';
        const s = day.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
        return s.charAt(0).toUpperCase() + s.slice(1);
    }, [day]);

    const dayLong = useMemo(() => {
        if (!day) return '';
        const s = day.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
        return s.charAt(0).toUpperCase() + s.slice(1);
    }, [day]);

    const hour = timeLabel ?? (day ? day.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '');

    if (!day) return null;

    return (
        <div className={cn(SD_CHECKOUT_EMBEDDED_INTERACTIVE_SHELL_CLASS, 'p-3 lg:p-4', className)}>
            <div className="mb-3 select-none">
                <h3 className="text-[1.125rem] font-bold capitalize tracking-[-0.02em] text-ink-strong">{monthLabel}</h3>
            </div>
            <div className="pointer-events-none select-none [&_td_button]:cursor-default">
                <Calendar
                    mode="single"
                    locale={es}
                    month={day}
                    selected={day}
                    showOutsideDays={false}
                    classNames={CAL_CLASS_NAMES}
                    className="w-full p-0 max-lg:[--cell-size:3rem] lg:[--cell-size:3.125rem]"
                />
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3">
                <p className="text-meta font-semibold capitalize text-ink-strong">{dayLong}</p>
                <span className="inline-flex h-9 items-center justify-center rounded-lg bg-brand px-3.5 text-sm font-bold text-white shadow-[0_4px_12px_hsl(var(--brand)/0.45)]">
                    {hour}
                </span>
            </div>
        </div>
    );
}
