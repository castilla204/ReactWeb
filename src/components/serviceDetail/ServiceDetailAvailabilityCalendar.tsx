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
    /** Patrón semanal del experto; sirve de respaldo más allá de la ventana con datos. */
    availability?: ExpertAvailabilityInput | null;
    timezone?: string | null;
    isOnVacation?: boolean;
    /** Muestra el encabezado "Disponibilidad" + horario. Por defecto true. */
    showHeading?: boolean;
    /** Versión más compacta (móvil): celdas, tipografía y padding reducidos. */
    compact?: boolean;
    className?: string;
}

const pad = (n: number) => String(n).padStart(2, '0');
const toYmd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** Horizonte con datos finos de huecos (cap del backend = 60 días). */
const SUMMARY_DAYS = 60;
/** Hasta cuántos meses se puede avanzar (más allá se muestra el patrón semanal). */
const MAX_MONTHS_AHEAD = 12;

/** Clases del mes (fluido, sin cabecera/nav propias del day-picker — usamos toolbar aparte). */
const CALENDAR_CLASS_NAMES = {
    root: 'w-full',
    nav: 'hidden',
    month_caption: 'hidden',
    month: 'flex w-full flex-col gap-2',
    weekdays: 'flex w-full',
    weekday: 'flex-1 text-center text-[11px] font-medium uppercase tracking-wide text-[#9ca3af]',
    week: 'mt-1.5 flex w-full',
    day: 'flex-1 p-[3px]',
} as const;

const LEGEND_ITEMS = [
    { label: 'Libre', swatch: 'bg-emerald-200 ring-1 ring-emerald-400/45' },
    { label: 'Pocos', swatch: 'bg-amber-200 ring-1 ring-amber-400/45' },
    { label: 'Completo', swatch: 'bg-slate-200 ring-1 ring-slate-400/40' },
    { label: 'Cerrado', swatch: 'bg-[#f4f4f5] ring-1 ring-[#e4e4e7]' },
] as const;

/**
 * Calendario de disponibilidad del experto en la ficha (SOLO LECTURA, sin horas).
 * Mismo lenguaje visual que el calendario de "Reservar": colores por ocupación.
 * Dentro de la ventana con datos (~60 días) usa los huecos reales del endpoint
 * `/summary`; más allá cae al patrón semanal del experto para poder navegar meses.
 */
export const ServiceDetailAvailabilityCalendar: React.FC<Props> = ({
    serviceId,
    availability,
    timezone,
    isOnVacation = false,
    showHeading = true,
    compact = false,
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

    // Una sola petición de resumen para toda la ventana (60 días) → colores reales.
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
                /* sin datos finos: el calendario sigue con el patrón semanal */
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
            // getDay(): 0=Dom … 6=Sáb → mapear a EXPERT_WEEK_DAYS (Lun primero).
            const key = EXPERT_WEEK_DAYS[(date.getDay() + 6) % 7].key;
            return activeWeekdays.has(key);
        },
        [activeWeekdays],
    );

    // Celda de día, solo lectura: color por ocupación (ventana con datos) o patrón semanal.
    const DayCell = useMemo(() => {
        const Cell = ({ day, modifiers }: any) => {
            const date: Date = day.date;
            const past = !!modifiers?.disabled;
            const isToday = !!modifiers?.today;
            const dd = startOfDay(date);
            const inSummary = hasSummary && dd >= minDate && dd <= maxSummaryDate;
            const free = inSummary ? availByDate[toYmd(date)] : undefined;
            const open = worksWeekday(date);

            let tint = '';
            if (!past) {
                if (free !== undefined) {
                    tint =
                        free === 0
                            ? open
                                ? 'bg-slate-200 text-slate-600' // trabaja pero completo
                                : 'bg-[#f4f4f5] text-[#a1a1aa]' // cerrado ese día
                            : free <= 2
                              ? 'bg-amber-200 text-amber-900'
                              : 'bg-emerald-200 text-emerald-900';
                } else {
                    // Sin datos finos (fuera de ventana / sin sesión): patrón semanal.
                    tint = open ? 'bg-emerald-100/70 text-emerald-800' : 'bg-[#f7f7f8] text-[#c4c4c4]';
                }
            }

            return (
                <span
                    aria-hidden
                    className={cn(
                        'relative flex aspect-square w-full select-none items-center justify-center font-semibold tabular-nums',
                        compact ? 'rounded-md text-[11px]' : 'rounded-lg text-[13px] lg:text-sm',
                        tint,
                        isToday && !past && 'ring-2 ring-inset ring-brand/70',
                        past && 'text-[#d4d4d4] opacity-40',
                    )}
                >
                    {date.getDate()}
                </span>
            );
        };
        return Cell;
    }, [availByDate, hasSummary, maxSummaryDate, minDate, worksWeekday, compact]);

    const isDateDisabled = useCallback((date: Date) => startOfDay(date) < minDate, [minDate]);

    const ariaLabel = ['Calendario de disponibilidad', cap(calMonthLabel), timeRange, tzShort]
        .filter(Boolean)
        .join(', ');

    return (
        <section className={className} aria-label="Disponibilidad del experto">
            {showHeading ? (
                <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="sd-section-label !mb-0">Disponibilidad</p>
                    {timeRange ? (
                        <span className="text-[13px] font-semibold tabular-nums text-[#1c1c1c]">
                            {timeRange}
                            {tzShort ? (
                                <span className="ml-1.5 font-normal text-[#737373]">{tzShort}</span>
                            ) : null}
                        </span>
                    ) : null}
                </div>
            ) : null}

            {isOnVacation ? (
                <div className={cn(
                    'rounded-lg bg-amber-50 px-3 py-2 font-medium text-amber-800 ring-1 ring-inset ring-amber-200',
                    compact ? 'mb-2.5 text-[12px]' : 'mb-3 text-[13px]',
                )}>
                    El experto está de vacaciones ahora mismo. Aun así puedes ver su agenda habitual.
                </div>
            ) : null}

            <div
                className={cn('rounded-2xl border border-[#ececec] bg-white', compact ? 'p-2.5' : 'p-3.5')}
                role="group"
                aria-label={ariaLabel}
            >
                <div className={cn('flex select-none items-center justify-between gap-3', compact ? 'mb-2' : 'mb-3')}>
                    <h3 className={cn('font-bold capitalize tracking-[-0.01em] text-[#1c1c1c]', compact ? 'text-[14px]' : 'text-[15px]')}>
                        {cap(calMonthLabel)}
                    </h3>
                    <div className="flex shrink-0 items-center gap-0.5 rounded-[9px] border border-[#e3e3e3] bg-[#fafafa] p-0.5">
                        <button
                            type="button"
                            onClick={() => goMonth(-1)}
                            disabled={atCurrentMonth}
                            aria-label="Mes anterior"
                            className="inline-flex h-7 w-8 items-center justify-center rounded-md text-[#6a6a6a] transition-colors hover:bg-white hover:text-[#1c1c1c] disabled:cursor-not-allowed disabled:opacity-35"
                        >
                            <ChevronLeft className="h-[18px] w-[18px]" />
                        </button>
                        <button
                            type="button"
                            onClick={() => goMonth(1)}
                            disabled={atMaxMonth}
                            aria-label="Mes siguiente"
                            className="inline-flex h-7 w-8 items-center justify-center rounded-md text-[#6a6a6a] transition-colors hover:bg-white hover:text-[#1c1c1c] disabled:cursor-not-allowed disabled:opacity-35"
                        >
                            <ChevronRight className="h-[18px] w-[18px]" />
                        </button>
                    </div>
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
                    classNames={CALENDAR_CLASS_NAMES}
                    className={cn('w-full p-0', compact ? '[--cell-size:2rem]' : '[--cell-size:2.6rem] lg:[--cell-size:2.75rem]')}
                />

                <div className={cn(
                    'flex flex-wrap items-center justify-center gap-y-1.5 border-t border-[#eef0f2]',
                    compact ? 'mt-2.5 gap-x-2.5 pt-2.5' : 'mt-3 gap-x-3.5 pt-3',
                )}>
                    {LEGEND_ITEMS.map(({ label, swatch }) => (
                        <span
                            key={label}
                            className={cn(
                                'inline-flex items-center gap-1.5 font-medium leading-none text-[#374151]',
                                compact ? 'text-[11px]' : 'text-[12px]',
                            )}
                        >
                            <span className={cn('shrink-0 rounded-[4px]', compact ? 'h-3 w-3' : 'h-3.5 w-3.5', swatch)} aria-hidden />
                            {label}
                        </span>
                    ))}
                </div>
            </div>

            <p className={cn('leading-snug text-[#9ca3af]', compact ? 'mt-1.5 text-[11px]' : 'mt-2 text-[12px]')}>
                Disponibilidad orientativa. Las horas concretas se eligen al reservar.
            </p>
        </section>
    );
};

export default ServiceDetailAvailabilityCalendar;
