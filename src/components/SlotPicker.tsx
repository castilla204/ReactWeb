import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { es } from 'date-fns/locale';
import { API_CONFIG } from '../config/api';
import { getAuthToken } from '../lib/auth';
import { Calendar } from './ui/calendar';
import { cn } from '../lib/utils';
import { SlotPeriodPanel, type PeriodFilter } from './checkout/SlotPeriodPanel';
import { computeSlotDateRange } from '../utils/slotDateRange';
import {
    SD_CHECKOUT_DESKTOP_CARD_CLASS,
    SD_CHECKOUT_DESKTOP_CARD_HEADER_CLASS,
    SD_CHECKOUT_EMBEDDED_SECTION_DESC_CLASS,
    SD_CHECKOUT_EMBEDDED_SECTION_TITLE_CLASS,
} from '../constants/homepageTypography';

/** Hueco elegido que se manda al checkout (intervalo UTC + etiqueta local para mostrar). */
export interface ChosenSlot {
    startUtc: string;
    endUtc: string;
    label: string;   // "HH:mm" local
    dateLabel: string; // "lun, 3 ago"
}

interface RawSlot {
    StartUtc?: string; startUtc?: string;
    EndUtc?: string; endUtc?: string;
    StartLocal?: string; startLocal?: string;
    Timezone?: string; timezone?: string;
}

interface Props {
    serviceId: number;
    selected: ChosenSlot | null;
    onSelect: (slot: ChosenSlot | null) => void;
    /** Cabecera integrada en la tarjeta (checkout desktop). */
    sectionTitle?: string;
    /** Sin contenedor de tarjeta propio; va dentro del bloque de cita del checkout. */
    embedded?: boolean;
    /** Solo consulta disponibilidad (modo vendedor): no exige elegir hueco. */
    previewMode?: boolean;
    /**
     * Base de los endpoints de disponibilidad. Por defecto el del cliente autenticado
     * (`/api/Availability/service/{serviceId}`). El magic link del vendedor pasa el público
     * token-gated (`/api/seller-booking/{token}`). Ambos exponen `/slots?date=` y `/summary?from=&days=`.
     */
    slotsBaseUrl?: string;
    /** Nº de días a futuro ofrecibles. Por defecto 14. El magic link usa el tope del cliente. */
    windowDays?: number;
    /** Días de antelación mínima: deshabilita los días anteriores a hoy + minLeadDays. Por defecto 0. */
    minLeadDays?: number;
}

const pad = (n: number) => String(n).padStart(2, '0');
const toYmd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const startOfDay = (d: Date) => {
    const copy = new Date(d);
    copy.setHours(0, 0, 0, 0);
    return copy;
};

const BOOKING_WINDOW_DAYS = 14;

/** Mismo patrón visual que el panel del experto cuando aún no hay día elegido. */
function PickDayEmptyState() {
    return (
        <div
            className="flex w-full flex-col items-center justify-center px-3 py-4 text-center"
            role="status"
        >
            <div className="mb-4 grid w-[52px] grid-cols-3 gap-1" aria-hidden>
                {Array.from({ length: 9 }).map((_, i) => (
                    <span
                        key={i}
                        className={cn(
                            'h-3 rounded-sm',
                            i === 4
                                ? 'bg-brand/20 outline outline-[1.5px] -outline-offset-1 outline-brand/55'
                                : 'bg-[#e5e7eb]',
                        )}
                    />
                ))}
            </div>
            <p className="text-sm font-semibold text-[#1c1c1c]">Elige un día en el calendario</p>
            <p className="mt-1.5 max-w-[32ch] text-[13px] leading-relaxed text-[#6b7280]">
                Los días en verde tienen más huecos libres. Al pulsar uno verás las franjas de mañana
                y tarde con las horas concretas del experto.
            </p>
        </div>
    );
}

/**
 * Selector de cita estilo Calendly: calendario mensual + huecos horarios.
 * El cliente elige día y hora ANTES de pagar; el hueco viaja al checkout.
 */
const SlotPicker: React.FC<Props> = ({
    serviceId,
    selected,
    onSelect,
    sectionTitle,
    embedded,
    previewMode = false,
    slotsBaseUrl,
    windowDays,
    minLeadDays = 0,
}) => {
    const availBase = slotsBaseUrl ?? `${API_CONFIG.baseUrl}/api/Availability/service/${serviceId}`;
    const effWindow = windowDays && windowDays > 0 ? windowDays : BOOKING_WINDOW_DAYS;
    const { minDate, maxDate } = useMemo(
        () => computeSlotDateRange(new Date(), minLeadDays, effWindow),
        [minLeadDays, effWindow],
    );
    const defaultDate = useMemo(() => minDate, [minDate]);

    const [selectedDate, setSelectedDate] = useState<Date | null>(embedded ? null : defaultDate);
    const [slots, setSlots] = useState<ChosenSlot[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    // Nº de huecos libres por día (ymd → count) para colorear el calendario por ocupación.
    const [availByDate, setAvailByDate] = useState<Record<string, number>>({});
    const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');

    const dayShort = (d: Date) =>
        d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });

    const dayLong = (d: Date) =>
        d.toLocaleDateString('es-ES', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
        });

    const isDateDisabled = useCallback(
        (date: Date) => {
            const day = startOfDay(date);
            return day < minDate || day > maxDate;
        },
        [minDate, maxDate]
    );

    const fetchSlots = useCallback(async (date: Date) => {
        setLoading(true);
        setError(null);
        try {
            const token = getAuthToken();
            const url = `${availBase}/slots?date=${toYmd(date)}`;
            const res = await fetch(url, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (!res.ok) throw new Error(`Error ${res.status}`);
            const raw: RawSlot[] = await res.json();
            const dLabel = dayShort(date);
            const mapped: ChosenSlot[] = (raw || [])
                .map((s) => {
                    const startUtc = s.StartUtc ?? s.startUtc ?? '';
                    const endUtc = s.EndUtc ?? s.endUtc ?? '';
                    const startLocal = s.StartLocal ?? s.startLocal ?? '';
                    const label = startLocal.length >= 16 ? startLocal.slice(11, 16) : startLocal;
                    return { startUtc, endUtc, label, dateLabel: dLabel };
                })
                .filter((s) => s.startUtc && s.endUtc);
            setSlots(mapped);
        } catch {
            setError('No se pudieron cargar los huecos. Inténtalo de nuevo.');
            setSlots([]);
        } finally {
            setLoading(false);
        }
    }, [availBase]);

    useEffect(() => {
        setPeriodFilter('all');
    }, [selectedDate]);

    useEffect(() => {
        if (!selectedDate) {
            setSlots([]);
            setLoading(false);
            setError(null);
            return;
        }
        if (selectedDate > maxDate) {
            setSelectedDate(defaultDate <= maxDate ? defaultDate : minDate);
            return;
        }
        fetchSlots(selectedDate);
    }, [selectedDate, fetchSlots, maxDate, defaultDate, minDate]);

    // Resumen de ocupación de toda la ventana (una sola petición) → colores del calendario.
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const token = getAuthToken();
                const url = `${availBase}/summary?from=${toYmd(minDate)}&days=${effWindow}`;
                const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
                if (!res.ok) return;
                const data: Array<{ Date?: string; date?: string; FreeSlots?: number; freeSlots?: number }> = await res.json();
                if (cancelled) return;
                const map: Record<string, number> = {};
                (data || []).forEach((d) => {
                    const k = d.Date ?? d.date;
                    if (k) map[k] = d.FreeSlots ?? d.freeSlots ?? 0;
                });
                setAvailByDate(map);
            } catch {
                /* sin colores si falla; el calendario sigue funcionando */
            }
        })();
        return () => { cancelled = true; };
    }, [availBase, minDate, effWindow]);

    // Color en cada celda del día (no en el contenedor del calendario).
    const AvailabilityDayButton = useMemo(() => {
        const Btn = ({ day, modifiers, className, ...props }: any) => {
            const ymd = toYmd(day.date);
            const free = availByDate[ymd];
            const selected = !!modifiers?.selected;
            const disabled = !!modifiers?.disabled;
            const isToday = !!modifiers?.today;
            const hasSummary = Object.keys(availByDate).length > 0;

            let tint = '';
            if (!selected && !disabled) {
                if (hasSummary && free !== undefined) {
                    tint =
                        free === 0
                            ? 'bg-slate-200 text-slate-600'
                            : free <= 2
                              ? 'bg-amber-200 text-amber-900'
                              : 'bg-emerald-200 text-emerald-900';
                } else if (!hasSummary) {
                    tint = 'bg-emerald-100/80 text-emerald-800';
                }
            }

            return (
                <button
                    type="button"
                    {...props}
                    className={cn(
                        'flex h-full w-full items-center justify-center rounded-md font-semibold transition-all',
                        embedded ? 'text-[13px]' : 'rounded-lg text-sm',
                        selected && 'bg-brand text-white shadow-sm ring-2 ring-brand/30',
                        !selected && tint,
                        !selected && tint && 'hover:brightness-[0.96] active:scale-[0.97]',
                        !selected && !tint && 'text-[#333] hover:bg-[#f3f4f6]',
                        !selected && isToday && 'ring-2 ring-inset ring-brand/50',
                        disabled && 'opacity-35',
                        className,
                    )}
                >
                    {day.date.getDate()}
                </button>
            );
        };
        return Btn;
    }, [availByDate, embedded]);

    const handleDateSelect = (date: Date | undefined) => {
        if (!date || isDateDisabled(date)) return;
        setSelectedDate(startOfDay(date));
        if (!previewMode) onSelect(null);
    };

    const gridClass = embedded
        ? 'grid-cols-1 gap-3 lg:grid-cols-[minmax(17.5rem,19rem)_minmax(0,1fr)] lg:items-stretch lg:gap-x-5 lg:gap-y-0'
        : 'grid-cols-1 lg:grid-cols-2';

    const calendarColClass = cn(
        'flex flex-col',
        embedded
            ? 'px-5 pt-1 pb-0 lg:items-start lg:self-start'
            : 'max-lg:border-b max-lg:border-[#f0f0f0] max-lg:px-4 max-lg:py-3.5 lg:border-r lg:border-[#f0f0f0]/70 lg:p-3 lg:py-3',
    );

    const slotsColClass = cn(
        'flex min-h-0 flex-col',
        embedded
            ? cn(
                  'px-5 pb-4 pt-0 lg:min-h-full lg:min-w-0 lg:px-0 lg:pr-5 lg:pb-4 lg:pt-0',
                  !selectedDate ? 'lg:justify-center' : 'lg:justify-start lg:pt-1',
              )
            : 'max-lg:p-4 max-lg:pt-3 lg:justify-center lg:p-3 lg:pl-4',
    );

    const navBtnClass = cn(
        'inline-flex items-center justify-center rounded-lg text-[#6a6a6a] transition-colors hover:bg-[#f3f4f6] hover:text-[#1c1c1c]',
        embedded ? 'size-8' : 'size-9',
    );

    return (
        <div className={cn(!embedded && 'max-lg:shadow-sm', !embedded && SD_CHECKOUT_DESKTOP_CARD_CLASS)}>
            {sectionTitle ? (
                embedded ? (
                    <div className={SD_CHECKOUT_EMBEDDED_SECTION_TITLE_CLASS}>
                        <h3 className="text-[13px] font-semibold tracking-[-0.01em] text-[#1c1c1c]">
                            {sectionTitle}
                        </h3>
                        <p className={SD_CHECKOUT_EMBEDDED_SECTION_DESC_CLASS}>
                            {previewMode
                                ? `Consulta en qué días y franjas (mañana o tarde) tendrá huecos el experto dentro de los próximos ${effWindow} días que fijaste para el vendedor.`
                                : 'Marca un día con huecos en el calendario (verde = más disponibilidad), elige franja y hora, y confirma la cita al pagar.'}
                        </p>
                    </div>
                ) : (
                <div className={SD_CHECKOUT_DESKTOP_CARD_HEADER_CLASS}>
                    <h3
                        className={cn(
                            'font-semibold tracking-[-0.01em] text-[#1c1c1c]',
                            'text-sm lg:text-[15px]',
                        )}
                    >
                        {sectionTitle}
                    </h3>
                    {previewMode ? (
                        <p className="mt-0.5 text-xs text-[#6a6a6a]">
                            Consulta qué días y franjas (mañana o tarde) tendrá el vendedor disponibles.
                        </p>
                    ) : (
                        <p className="mt-0.5 text-xs text-[#6a6a6a]">
                            Elige día, franja y hora de la cita.
                        </p>
                    )}
                </div>
                )
            ) : null}

            <div className={cn('grid lg:items-stretch lg:min-h-0', gridClass)}>
            {/* Calendario */}
            <div className={calendarColClass}>
                <div className={cn(embedded && 'w-full max-w-[19rem]')}>
                <Calendar
                    mode="single"
                    locale={es}
                    selected={selectedDate ?? undefined}
                    onSelect={handleDateSelect}
                    defaultMonth={selectedDate ?? defaultDate}
                    disabled={isDateDisabled}
                    showOutsideDays={false}
                    components={{ DayButton: AvailabilityDayButton }}
                    classNames={{
                        button_previous: navBtnClass,
                        button_next: navBtnClass,
                        ...(embedded
                            ? {
                                  root: 'w-full',
                                  month: 'flex w-full flex-col gap-1.5',
                                  month_caption:
                                      'flex h-9 w-full items-center justify-center text-sm font-semibold capitalize text-[#1c1c1c]',
                                  weekdays: 'flex gap-1',
                                  weekday:
                                      'text-[10px] font-medium uppercase tracking-wide text-[#9ca3af]',
                                  week: 'mt-1 flex w-full gap-1',
                              }
                            : {}),
                    }}
                    className={cn(
                        embedded ? 'w-full p-0 [--cell-size:2.5rem]' : 'w-full p-0',
                    )}
                />
                {!embedded ? (
                <div className="mt-2 flex flex-wrap items-center justify-center gap-2.5 text-[10px] text-[#6a6a6a]">
                    <span className="inline-flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-sm bg-emerald-200" aria-hidden />
                        Libre
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-sm bg-amber-200" aria-hidden />
                        Pocos
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-sm bg-slate-200" aria-hidden />
                        Completo
                    </span>
                </div>
                ) : embedded ? (
                <div className="mt-2 flex items-center gap-3 text-[10px] text-[#9ca3af]">
                    <span className="inline-flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-emerald-200" aria-hidden />
                        Libre
                    </span>
                    <span className="inline-flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-amber-200" aria-hidden />
                        Pocos
                    </span>
                    <span className="inline-flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-slate-200" aria-hidden />
                        Lleno
                    </span>
                </div>
                ) : null}
                </div>
            </div>

            {/* Huecos horarios */}
            <div className={slotsColClass}>
                {embedded && !selectedDate ? (
                    <PickDayEmptyState />
                ) : (
                <>
                <p
                    className="mb-2 text-sm font-medium capitalize leading-snug text-[#1c1c1c]"
                >
                    {selectedDate ? dayLong(selectedDate) : ''}
                </p>

                <div className={cn('flex flex-1 flex-col', embedded ? 'justify-start' : 'justify-center')}>
                    {loading ? (
                        <div className="flex min-h-[72px] items-center justify-center gap-2 text-xs text-[#9ca3af]">
                            <Loader2 className="h-4 w-4 animate-spin text-brand" />
                            <span>Cargando…</span>
                        </div>
                    ) : error ? (
                        <div className="flex min-h-[72px] items-center justify-center px-2">
                            <p className="text-center text-xs text-[#0b5cad]">{error}</p>
                        </div>
                    ) : slots.length === 0 ? (
                        <div className="flex min-h-[72px] flex-col items-center justify-center gap-0.5 px-2 text-center">
                            <p className="text-xs font-medium text-[#555]">Sin huecos este día</p>
                            <p className="text-[11px] text-[#9ca3af]">
                                {previewMode ? 'Prueba otro día dentro del plazo' : 'Elige otra fecha'}
                            </p>
                        </div>
                    ) : (
                        <SlotPeriodPanel
                            slots={slots}
                            selected={selected}
                            previewMode={previewMode}
                            compact={false}
                            periodFilter={periodFilter}
                            onPeriodFilterChange={setPeriodFilter}
                            onSelectSlot={onSelect}
                        />
                    )}
                </div>
                </>
                )}
            </div>
            </div>
        </div>
    );
};

export default SlotPicker;
