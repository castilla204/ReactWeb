import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { es } from 'date-fns/locale';
import { API_CONFIG } from '../config/api';
import { getAuthToken } from '../lib/auth';
import { Calendar } from './ui/calendar';
import { cn } from '../lib/utils';
import { SlotPeriodPanel, type PeriodFilter } from './checkout/SlotPeriodPanel';
import {
    CheckoutSellerChoicePreviewCalendar,
    CheckoutSelfChoicePreviewCalendar,
} from './checkout/CheckoutSellerChoiceLocked';
import { CHECKOUT_SELLER_PLAZO_SUMMARY, COORD_SELF_SLOT_STEP_DESC } from './checkout/CheckoutSellerCoordinationFields';
import { CheckoutSlotHoursDrawer } from './checkout/CheckoutSlotHoursDrawer';
import { CheckoutEmbeddedStepHeader } from './checkout/CheckoutEmbeddedStepHeader';
import { computeSlotDateRange, startOfDay } from '../utils/slotDateRange';
import {
    SD_CHECKOUT_DESKTOP_CARD_CLASS,
    SD_CHECKOUT_DESKTOP_CARD_HEADER_CLASS,
    SD_CHECKOUT_EMBEDDED_INTERACTIVE_SHELL_CLASS,
    SD_CHECKOUT_EMBEDDED_CALENDAR_SHELL_PADDING_CLASS,
    SD_CHECKOUT_EMBEDDED_STEP_CONTENT_CLASS,
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

const BOOKING_WINDOW_DAYS = 14;

/** Calendario checkout desktop embebido — compacto en lg; ancho completo en móvil. */
const EMBEDDED_CALENDAR_CLASS =
    'w-full p-0 max-lg:[--cell-size:2.5rem] lg:[--cell-size:2.125rem]';
const EMBEDDED_CALENDAR_MAX_WIDTH_CLASS = 'w-full max-lg:max-w-none lg:max-w-[15.5rem]';
const EMBEDDED_CALENDAR_GRID_CLASS =
    'grid grid-cols-1 gap-2.5 lg:grid-cols-[minmax(14rem,15.5rem)_minmax(0,1fr)] lg:items-stretch lg:gap-x-3';
const EMBEDDED_CALENDAR_SHELL_PADDING_CLASS = SD_CHECKOUT_EMBEDDED_CALENDAR_SHELL_PADDING_CLASS;
const EMBEDDED_CALENDAR_CLASS_NAMES = {
    root: 'w-full',
    month: 'flex w-full flex-col gap-1',
    month_caption:
        'flex h-7 w-full items-center justify-center text-[13px] font-semibold capitalize text-[#1c1c1c]',
    weekdays: 'flex gap-0.5',
    weekday: 'text-[9px] font-medium uppercase tracking-wide text-[#9ca3af]',
    week: 'mt-0.5 flex w-full gap-0.5',
} as const;

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
            <p className="mt-1.5 max-w-[32ch] text-[13px] leading-relaxed text-[#6b7280] max-lg:hidden">
                Los días en verde tienen más huecos libres. Al pulsar uno verás las franjas de mañana
                y tarde con las horas concretas del experto.
            </p>
            <p className="mt-1.5 max-w-[32ch] text-[13px] leading-relaxed text-[#6b7280] lg:hidden">
                Los días en verde tienen más huecos libres. Al pulsar uno se abrirá el selector de hora.
            </p>
        </div>
    );
}

const AVAILABILITY_LEGEND_ITEMS = [
    { label: 'Libre', swatch: 'bg-emerald-200 ring-1 ring-emerald-400/45' },
    { label: 'Pocos', swatch: 'bg-amber-200 ring-1 ring-amber-400/45' },
    { label: 'Lleno', swatch: 'bg-slate-200 ring-1 ring-slate-400/40' },
] as const;

/** Leyenda de disponibilidad bajo el calendario (colores = celdas del mes). */
function AvailabilityLegend({
    align = 'center',
    fullLabel = false,
    trailing,
    compact = false,
}: {
    align?: 'center' | 'between';
    fullLabel?: boolean;
    trailing?: React.ReactNode;
    compact?: boolean;
}) {
    return (
        <div
            className={cn(
                'flex flex-wrap items-center border-t border-[#e8ecf1]',
                compact ? 'mt-2 gap-x-2 gap-y-1 pt-2' : 'mt-2.5 gap-x-3 gap-y-1.5 pt-2.5',
                align === 'between' ? 'justify-between' : 'justify-center',
            )}
            role="note"
            aria-label="Leyenda de disponibilidad del calendario"
        >
            <div className="inline-flex flex-wrap items-center gap-x-3.5 gap-y-1.5">
                {AVAILABILITY_LEGEND_ITEMS.map(({ label, swatch }) => (
                    <span
                        key={label}
                        className={cn(
                            'inline-flex items-center gap-1.5 font-medium leading-none text-[#374151]',
                            compact ? 'text-[11px]' : 'text-[12px]',
                        )}
                    >
                        <span
                            className={cn('h-3.5 w-3.5 shrink-0 rounded-[4px]', swatch)}
                            aria-hidden
                        />
                        {fullLabel && label === 'Lleno' ? 'Completo' : label}
                    </span>
                ))}
            </div>
            {trailing}
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
    const initialSelectedDate = useMemo((): Date | null => {
        if (embedded && previewMode) return null;
        if (embedded) return null;
        return defaultDate;
    }, [embedded, previewMode, defaultDate]);

    const [selectedDate, setSelectedDate] = useState<Date | null>(initialSelectedDate);
    const [slots, setSlots] = useState<ChosenSlot[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    // Nº de huecos libres por día (ymd → count) para colorear el calendario por ocupación.
    const [availByDate, setAvailByDate] = useState<Record<string, number>>({});
    const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');
    const [hoursDrawerExpanded, setHoursDrawerExpanded] = useState(false);

    useEffect(() => {
        if (previewMode || !selectedDate) return;
        setHoursDrawerExpanded(true);
    }, [previewMode, selectedDate]);

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
                    onClick={(e) => {
                        if (previewMode) {
                            e.preventDefault();
                            e.stopPropagation();
                            return;
                        }
                        props.onClick?.(e);
                    }}
                    className={cn(
                        'flex h-full w-full items-center justify-center rounded-md font-semibold transition-all',
                        embedded ? 'text-[12px]' : 'rounded-lg text-sm',
                        selected && !previewMode && 'bg-brand text-white shadow-sm ring-2 ring-brand/30',
                        !selected && tint,
                        !selected && tint && !previewMode && 'hover:brightness-[0.96] active:scale-[0.97]',
                        !selected && !tint && !previewMode && 'text-[#333] hover:bg-[#f3f4f6]',
                        !selected && isToday && !previewMode && 'ring-2 ring-inset ring-brand/50',
                        previewMode && 'cursor-not-allowed',
                        disabled && 'opacity-35',
                        className,
                    )}
                >
                    {day.date.getDate()}
                </button>
            );
        };
        return Btn;
    }, [availByDate, embedded, previewMode]);

    const handleDateSelect = (date: Date | undefined) => {
        if (previewMode) return;
        if (!date || isDateDisabled(date)) return;
        setSelectedDate(startOfDay(date));
        onSelect(null);
    };

    const gridClass = embedded
        ? previewMode
            ? 'grid-cols-1'
            : 'grid-cols-1 gap-2.5 lg:grid-cols-[minmax(14rem,15.5rem)_minmax(0,1fr)] lg:items-stretch lg:gap-x-3 lg:gap-y-0'
        : 'grid-cols-1 lg:grid-cols-2';

    const calendarColClass = cn(
        'flex flex-col',
        embedded
            ? cn(
                  'pt-0 pb-0 lg:items-start lg:border-r lg:border-[#eceef2] lg:pr-4',
                  previewMode ? 'lg:self-stretch' : 'lg:self-start',
              )
            : 'max-lg:border-b max-lg:border-[#f0f0f0] max-lg:px-4 max-lg:py-3.5 lg:border-r lg:border-[#f0f0f0]/70 lg:p-3 lg:py-3',
    );

    const slotsColClass = cn(
        'flex min-h-0 flex-col',
        embedded
            ? cn(
                  'pb-0 pt-0 lg:min-h-full lg:min-w-0 lg:pl-4',
                  previewMode
                      ? 'lg:h-full lg:justify-stretch'
                      : !selectedDate
                        ? 'lg:justify-center'
                        : 'lg:justify-start lg:pt-0',
              )
            : 'max-lg:p-4 max-lg:pt-3 lg:justify-center lg:p-3 lg:pl-4',
    );

    const navBtnClass = cn(
        'inline-flex items-center justify-center rounded-lg text-[#6a6a6a] transition-colors hover:bg-[#f3f4f6] hover:text-[#1c1c1c]',
        embedded ? 'size-7' : 'size-8',
    );

    const useMobileHoursDrawer = !previewMode;

    const renderSelectableHoursBody = (opts?: { embeddedSlots?: boolean; splitPeriodsOnMobile?: boolean }) => {
        const slotEmbedded = opts?.embeddedSlots ?? !!embedded;
        if (loading) {
            return (
                <div className="flex min-h-[72px] items-center justify-center gap-2 text-xs text-[#9ca3af]">
                    <Loader2 className="h-4 w-4 animate-spin text-brand" />
                    <span>Cargando…</span>
                </div>
            );
        }
        if (error) {
            return (
                <div className="flex min-h-[72px] items-center justify-center px-2">
                    <p className="text-center text-xs text-[#0b5cad]">{error}</p>
                </div>
            );
        }
        if (slots.length === 0) {
            return (
                <div className="flex min-h-[72px] flex-col items-center justify-center gap-0.5 px-2 text-center">
                    <p className="text-xs font-medium text-[#555]">Sin huecos este día</p>
                    <p className="text-[11px] text-[#9ca3af]">Elige otra fecha</p>
                </div>
            );
        }
        return (
            <SlotPeriodPanel
                slots={slots}
                selected={selected}
                previewMode={false}
                compact={slotEmbedded}
                embedded={slotEmbedded}
                showPeriodFilter={false}
                splitPeriodsOnMobile={opts?.splitPeriodsOnMobile}
                periodFilter={periodFilter}
                onPeriodFilterChange={setPeriodFilter}
                onSelectSlot={onSelect}
            />
        );
    };

    const mobileHoursDrawer =
        useMobileHoursDrawer && selectedDate ? (
            <CheckoutSlotHoursDrawer
                open
                dateLabel={dayLong(selectedDate)}
                selectedLabel={selected?.label ?? null}
                expanded={hoursDrawerExpanded}
                onToggle={() => setHoursDrawerExpanded((v) => !v)}
            >
                {renderSelectableHoursBody({ splitPeriodsOnMobile: true })}
            </CheckoutSlotHoursDrawer>
        ) : null;

    const inlineSlotsColumnClass = cn(
        slotsColClass,
        useMobileHoursDrawer && 'hidden lg:flex',
    );

    return (
        <div className={cn(!embedded && 'max-lg:shadow-sm', !embedded && SD_CHECKOUT_DESKTOP_CARD_CLASS)}>
            {sectionTitle ? (
                embedded ? (
                    <div className="max-lg:hidden">
                        <CheckoutEmbeddedStepHeader
                            step={2}
                            borderedTop
                            title={sectionTitle}
                            description={
                                previewMode
                                    ? `Solo consulta: el vendedor elegirá el hueco al reservar. ${CHECKOUT_SELLER_PLAZO_SUMMARY}`
                                    : COORD_SELF_SLOT_STEP_DESC
                            }
                        />
                    </div>
                ) : previewMode ? (
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
                            Solo consulta: el vendedor elige día y franja al reservar. {CHECKOUT_SELLER_PLAZO_SUMMARY}
                        </p>
                    ) : (
                        <p className="mt-0.5 text-xs text-[#6a6a6a]">
                            Elige día, franja y hora de la cita.
                        </p>
                    )}
                </div>
                ) : null
            ) : null}

            {embedded && previewMode ? (
                <CheckoutSellerChoicePreviewCalendar>
                    <div
                        className={cn(
                            'w-full lg:flex lg:h-full lg:flex-col',
                            EMBEDDED_CALENDAR_MAX_WIDTH_CLASS,
                            'max-lg:mx-auto',
                        )}
                    >
                        <Calendar
                            mode="single"
                            locale={es}
                            selected={undefined}
                            onSelect={undefined}
                            defaultMonth={defaultDate}
                            disabled={isDateDisabled}
                            showOutsideDays={false}
                            components={{ DayButton: AvailabilityDayButton }}
                            classNames={{
                                button_previous: navBtnClass,
                                button_next: navBtnClass,
                                ...EMBEDDED_CALENDAR_CLASS_NAMES,
                            }}
                            className={EMBEDDED_CALENDAR_CLASS}
                        />
                        <AvailabilityLegend align="between" fullLabel compact />
                    </div>
                </CheckoutSellerChoicePreviewCalendar>
            ) : embedded ? (
                <>
                <CheckoutSelfChoicePreviewCalendar
                    className={cn(useMobileHoursDrawer && selectedDate && 'max-lg:pb-24')}
                >
                    <div className={cn('grid lg:items-stretch lg:min-h-0', gridClass)}>
                        <div className={calendarColClass}>
                            <div
                                className={cn(
                                    'w-full lg:flex lg:h-full lg:flex-col',
                                    EMBEDDED_CALENDAR_MAX_WIDTH_CLASS,
                                )}
                            >
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
                                        ...EMBEDDED_CALENDAR_CLASS_NAMES,
                                    }}
                                    className={EMBEDDED_CALENDAR_CLASS}
                                />
                                <AvailabilityLegend align="between" compact />
                            </div>
                        </div>
                        <div className={inlineSlotsColumnClass}>
                            {!selectedDate ? (
                                <PickDayEmptyState />
                            ) : (
                                <>
                                    <p className="mb-2.5 text-[13px] font-semibold capitalize leading-snug text-[#1c1c1c]">
                                        {dayLong(selectedDate)}
                                    </p>
                                    <div className="flex flex-1 flex-col justify-start">
                                        {renderSelectableHoursBody()}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </CheckoutSelfChoicePreviewCalendar>
                {mobileHoursDrawer}
                </>
            ) : (
            <>
            <CheckoutSelfChoicePreviewCalendar
                className={cn('pt-0', useMobileHoursDrawer && selectedDate && 'max-lg:pb-24')}
            >
            <div
                className={cn(
                    'grid lg:items-stretch lg:min-h-0',
                    gridClass,
                )}
            >
            {/* Calendario */}
            <div className={calendarColClass}>
                <div
                    className={cn(
                        embedded && cn('w-full', EMBEDDED_CALENDAR_MAX_WIDTH_CLASS),
                        embedded && previewMode && 'lg:flex lg:h-full lg:flex-col',
                        previewMode && !embedded && 'pointer-events-none select-none opacity-[0.88]',
                    )}
                >
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
                        ...(embedded ? EMBEDDED_CALENDAR_CLASS_NAMES : {}),
                    }}
                    className={cn(
                        embedded ? EMBEDDED_CALENDAR_CLASS : 'w-full p-0',
                    )}
                />
                {!embedded ? (
                <AvailabilityLegend align="center" fullLabel />
                ) : embedded ? (
                <AvailabilityLegend
                    align="between"
                    compact
                />
                ) : null}
                </div>
            </div>

            {/* Huecos horarios */}
            <div className={inlineSlotsColumnClass}>
                {previewMode ? null : embedded && !selectedDate ? (
                    <PickDayEmptyState />
                ) : !previewMode ? (
                <>
                <p
                    className={cn(
                        'mb-2.5 font-semibold capitalize leading-snug text-[#1c1c1c]',
                        embedded ? 'text-[13px]' : 'mb-2 text-sm',
                    )}
                >
                    {selectedDate ? dayLong(selectedDate) : ''}
                </p>

                <div className={cn('flex flex-1 flex-col', embedded ? 'justify-start' : 'justify-center')}>
                    {renderSelectableHoursBody({ embeddedSlots: embedded })}
                </div>
                </>
                ) : null}
            </div>
            </div>
            </CheckoutSelfChoicePreviewCalendar>
            {mobileHoursDrawer}
            </>
            )}
        </div>
    );
};

export default SlotPicker;
