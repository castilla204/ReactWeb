import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { es } from 'date-fns/locale';
import { Calendar } from '../ui/calendar';
import { cn } from '../../lib/utils';
import { API_CONFIG } from '../../config/api';
import { getAuthToken } from '../../lib/auth';
import {
    EXPERT_WEEK_DAYS,
    normalizeAvailabilityDays,
    formatAvailabilityTimeRange,
    type ExpertAvailabilityInput,
} from '../../utils/expertAvailability';

interface Props {
    serviceId: number;
    availability?: ExpertAvailabilityInput | null;
    timezone?: string | null;
    isOnVacation?: boolean;
    /** Muestra el encabezado "Disponibilidad" + horario. Por defecto true. */
    showHeading?: boolean;
    /** Versión más compacta (ficha desktop): celdas y tipografía reducidas. */
    compact?: boolean;
    /** Sin marco tipo card — plano sobre el panel padre. */
    embedded?: boolean;
    /** Leyenda de colores bajo el calendario. Por defecto false en ficha. */
    showLegend?: boolean;
    /** Nota orientativa bajo el calendario. */
    showFootnote?: boolean;
    className?: string;
}

const pad = (n: number) => String(n).padStart(2, '0');
const toYmd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const SUMMARY_DAYS = 60;
const MAX_MONTHS_AHEAD = 12;

const COMPACT_EMBEDDED_CLASS_NAMES = {
    root: 'w-fit',
    nav: 'hidden',
    month_caption: 'hidden',
    month: 'flex w-fit flex-col gap-1',
    weekdays: 'flex w-fit gap-px',
    weekday:
        'w-[var(--cell-size)] shrink-0 text-center text-[10px] font-medium leading-none normal-case tracking-normal text-ink-soft',
    week: 'mt-0.5 flex w-fit gap-px',
    day: 'shrink-0 p-0',
} as const;

const CALENDAR_CLASS_NAMES = {
    root: 'w-full',
    nav: 'hidden',
    month_caption: 'hidden',
    month: 'flex w-full flex-col gap-1.5',
    weekdays: 'flex w-full',
    weekday:
        'flex-1 text-center text-caption font-medium normal-case tracking-normal text-ink-soft',
    week: 'mt-1 flex w-full',
    day: 'flex-1 p-[2px]',
} as const;

const LEGEND_ITEMS = [
    { label: 'Libre', swatch: 'bg-avail-free' },
    { label: 'Pocos', swatch: 'bg-avail-low' },
    { label: 'Completo', swatch: 'bg-avail-full' },
] as const;

function cellTint(free: number | undefined, open: boolean, past: boolean): string {
    if (past) return '';
    if (free !== undefined) {
        if (free === 0) {
            return open ? 'bg-avail-full text-ink-muted' : 'bg-surface-tinted text-line';
        }
        if (free <= 2) return 'bg-avail-low text-ink-strong';
        return 'bg-avail-free text-ink-strong';
    }
    return open ? 'bg-avail-free/50 text-ink-muted' : 'bg-surface-tinted text-line';
}

/**
 * Calendario de disponibilidad del experto en la ficha (solo lectura).
 * Colores alineados con checkout (`--avail-*`). Sin leyenda por defecto.
 */
export const ServiceDetailAvailabilityCalendar: React.FC<Props> = ({
    serviceId,
    availability,
    timezone,
    isOnVacation = false,
    showHeading = true,
    compact = false,
    embedded = false,
    showLegend = false,
    showFootnote = false,
    className,
}) => {
    const today = useMemo(() => startOfDay(new Date()), []);
    const minDate = today;
    const maxSummaryDate = useMemo(() => {
        const d = new Date(today);
        d.setDate(d.getDate() + SUMMARY_DAYS - 1);
        return d;
    }, [today]);
    const maxMonth = useMemo(
        () => new Date(today.getFullYear(), today.getMonth() + MAX_MONTHS_AHEAD, 1),
        [today],
    );

    const [calMonth, setCalMonth] = useState<Date>(() => new Date(today.getFullYear(), today.getMonth(), 1));
    const [availByDate, setAvailByDate] = useState<Record<string, number>>({});
    const fetchedRef = useRef(false);

    const activeWeekdays = useMemo(
        () => normalizeAvailabilityDays(availability?.daysOfWeek),
        [availability?.daysOfWeek],
    );
    const timeRange = formatAvailabilityTimeRange(availability?.startTime, availability?.endTime);
    const tzShort = timezone?.split('/').pop()?.replace(/_/g, ' ') ?? null;

    useEffect(() => {
        if (fetchedRef.current) return;
        fetchedRef.current = true;
        let cancelled = false;
        (async () => {
            try {
                const token = getAuthToken();
                const url = `${API_CONFIG.baseUrl}/api/Availability/service/${serviceId}/summary?from=${toYmd(today)}&days=${SUMMARY_DAYS}`;
                const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
                if (!res.ok || cancelled) return;
                const data: Array<{ Date?: string; date?: string; FreeSlots?: number; freeSlots?: number }> =
                    await res.json();
                if (cancelled) return;
                const map: Record<string, number> = {};
                (data || []).forEach((d) => {
                    const k = d.Date ?? d.date;
                    if (k) map[k] = d.FreeSlots ?? d.freeSlots ?? 0;
                });
                setAvailByDate(map);
            } catch {
                /* patrón semanal de respaldo */
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [serviceId, today]);

    const hasSummary = Object.keys(availByDate).length > 0;
    const atCurrentMonth =
        calMonth.getFullYear() === today.getFullYear() && calMonth.getMonth() === today.getMonth();
    const atMaxMonth =
        calMonth.getFullYear() === maxMonth.getFullYear() && calMonth.getMonth() === maxMonth.getMonth();
    const goMonth = (delta: number) =>
        setCalMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));
    const calMonthLabel = calMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

    const worksWeekday = useCallback(
        (date: Date) => {
            const key = EXPERT_WEEK_DAYS[(date.getDay() + 6) % 7].key;
            return activeWeekdays.has(key);
        },
        [activeWeekdays],
    );

    const isFichaCompact = compact && embedded;

    const DayCell = useMemo(() => {
        const Cell = ({ day, modifiers }: any) => {
            const date: Date = day.date;
            const past = !!modifiers?.disabled;
            const isToday = !!modifiers?.today;
            const dd = startOfDay(date);
            const inSummary = hasSummary && dd >= minDate && dd <= maxSummaryDate;
            const free = inSummary ? availByDate[toYmd(date)] : undefined;
            const open = worksWeekday(date);
            const tint = cellTint(free, open, past);

            return (
                <span
                    aria-hidden
                    className={cn(
                        'relative flex select-none items-center justify-center font-medium tabular-nums',
                        isFichaCompact
                            ? 'h-[var(--cell-size)] w-[var(--cell-size)] rounded-sm text-[10px] leading-none'
                            : compact
                              ? 'aspect-square w-full rounded-sm text-caption'
                              : 'aspect-square w-full rounded-md text-meta lg:text-sm',
                        tint,
                        isToday && !past && 'ring-1 ring-inset ring-brand/60',
                        past && 'text-line opacity-35',
                    )}
                >
                    {date.getDate()}
                </span>
            );
        };
        return Cell;
    }, [availByDate, hasSummary, maxSummaryDate, minDate, worksWeekday, compact, isFichaCompact]);

    const isDateDisabled = useCallback((date: Date) => startOfDay(date) < minDate, [minDate]);

    const ariaLabel = ['Calendario de disponibilidad', cap(calMonthLabel), timeRange, tzShort]
        .filter(Boolean)
        .join(', ');

    const cellSize = isFichaCompact ? '1.375rem' : compact ? '1.75rem' : '2.6rem';
    const calendarClassNames = isFichaCompact ? COMPACT_EMBEDDED_CLASS_NAMES : CALENDAR_CLASS_NAMES;

    return (
        <section className={className} aria-label="Disponibilidad del experto">
            {showHeading ? (
                <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="sd-section-label !mb-0">Disponibilidad</p>
                    {timeRange ? (
                        <span className="text-meta font-semibold tabular-nums text-ink-strong">
                            {timeRange}
                            {tzShort ? (
                                <span className="ml-1.5 font-normal text-ink-muted">{tzShort}</span>
                            ) : null}
                        </span>
                    ) : null}
                </div>
            ) : null}

            {isOnVacation ? (
                <p className={cn('mb-2 text-caption font-medium text-warning', compact && 'mb-1.5')}>
                    De vacaciones ahora mismo. Agenda habitual visible abajo.
                </p>
            ) : null}

            <div
                className={cn(
                    'sd-availability-calendar-frame',
                    embedded || compact
                        ? 'sd-availability-calendar-frame--embedded border-0 bg-transparent p-0 shadow-none'
                        : 'rounded-2xl border border-line bg-white p-3.5',
                )}
                role="group"
                aria-label={ariaLabel}
            >
                <div
                    className={cn(
                        'relative flex select-none items-center justify-between gap-1.5',
                        isFichaCompact ? 'mb-1 w-fit min-w-[9.75rem]' : compact ? 'mb-1.5' : 'mb-3',
                    )}
                >
                    <button
                        type="button"
                        onClick={() => goMonth(-1)}
                        disabled={atCurrentMonth}
                        aria-label="Mes anterior"
                        className={cn(
                            'sd-host-interactive inline-flex shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-surface-tinted hover:text-ink-strong disabled:cursor-not-allowed disabled:opacity-35',
                            isFichaCompact ? 'h-6 w-6' : 'h-8 w-8',
                        )}
                    >
                        <ChevronLeft className={isFichaCompact ? 'h-3.5 w-3.5' : 'h-4 w-4'} strokeWidth={2} />
                    </button>
                    <span
                        className={cn(
                            'min-w-0 truncate text-center font-medium capitalize text-ink-muted',
                            isFichaCompact ? 'text-[11px] leading-none' : 'text-caption',
                        )}
                    >
                        {cap(calMonthLabel)}
                    </span>
                    <button
                        type="button"
                        onClick={() => goMonth(1)}
                        disabled={atMaxMonth}
                        aria-label="Mes siguiente"
                        className={cn(
                            'sd-host-interactive inline-flex shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-surface-tinted hover:text-ink-strong disabled:cursor-not-allowed disabled:opacity-35',
                            isFichaCompact ? 'h-6 w-6' : 'h-8 w-8',
                        )}
                    >
                        <ChevronRight className={isFichaCompact ? 'h-3.5 w-3.5' : 'h-4 w-4'} strokeWidth={2} />
                    </button>
                </div>

                <Calendar
                    mode="single"
                    locale={es}
                    month={calMonth}
                    onMonthChange={setCalMonth}
                    selected={undefined}
                    disabled={isDateDisabled}
                    showOutsideDays={false}
                    components={{ DayButton: DayCell }}
                    classNames={calendarClassNames}
                    className={cn(
                        'p-0',
                        isFichaCompact ? 'w-fit [--cell-size:1.375rem]' : 'w-full',
                        !isFichaCompact && `[--cell-size:${cellSize}]`,
                    )}
                />

                {showLegend ? (
                    <div
                        className={cn(
                            'flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-t border-line-soft',
                            compact ? 'mt-2 pt-2' : 'mt-3 pt-2.5',
                        )}
                    >
                        {LEGEND_ITEMS.map(({ label, swatch }) => (
                            <span
                                key={label}
                                className="inline-flex items-center gap-1.5 text-caption font-medium leading-none text-ink-muted"
                            >
                                <span
                                    className={cn('h-3 w-3 shrink-0 rounded-sm', swatch)}
                                    aria-hidden
                                />
                                {label}
                            </span>
                        ))}
                    </div>
                ) : null}
            </div>

            {showFootnote ? (
                <p className={cn('leading-snug text-ink-soft', compact ? 'mt-1.5 text-caption' : 'mt-2 text-caption')}>
                    Disponibilidad orientativa. Las horas concretas se eligen al reservar.
                </p>
            ) : null}
        </section>
    );
};

export default ServiceDetailAvailabilityCalendar;
