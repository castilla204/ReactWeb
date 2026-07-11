import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { es } from 'date-fns/locale';
import { SileoSkeleton } from './ui/sileo-skeleton';
import { API_CONFIG } from '../config/api';
import { getAuthToken } from '../lib/auth';
import { Calendar } from './ui/calendar';
import { cn } from '../lib/utils';
import { SlotPeriodPanel, type PeriodFilter } from './checkout/SlotPeriodPanel';
import {
    CheckoutSellerChoicePreviewCalendar,
    CheckoutSelfChoicePreviewCalendar,
} from './checkout/CheckoutSellerChoiceLocked';
import { COORD_SELF_SLOT_STEP_DESC, SELLER_COORD_CALENDAR_PREVIEW_NOTE } from './checkout/CheckoutSellerCoordinationFields';
import { CheckoutSlotHoursDrawer } from './checkout/CheckoutSlotHoursDrawer';
import { CheckoutEmbeddedStepHeader } from './checkout/CheckoutEmbeddedStepHeader';
import { computeSlotDateRange, startOfDay } from '../utils/slotDateRange';
import {
    SD_CHECKOUT_DESKTOP_CARD_CLASS,
    SD_CHECKOUT_DESKTOP_CARD_HEADER_CLASS,
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
    /** Checkout desktop 50/50: calendario en columna derecha sin sangría ni cabecera duplicada. */
    embeddedSplitColumn?: boolean;
    /** Muestra la cabecera numerada de sección (checkout desktop con header superior). */
    showSectionHeader?: boolean;
    /** Renderizado plano: sin tarjeta/borde/fondo propios (usado dentro del shell del checkout desktop). */
    bare?: boolean;
}

const pad = (n: number) => String(n).padStart(2, '0');
const toYmd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const BOOKING_WINDOW_DAYS = 14;

/** Calendario checkout desktop embebido — legible en lg; ancho completo en móvil. */
const embeddedCalendarClass = () => 'w-full p-0';
const EMBEDDED_CALENDAR_MAX_WIDTH_CLASS = 'w-full max-lg:max-w-none lg:max-w-[24rem]';
const EMBEDDED_CALENDAR_CLASS_NAMES = {
    root: 'w-full',
    nav: 'hidden',
    month_caption: 'hidden',
    month: 'flex w-full flex-col gap-2',
    weekdays: 'mb-1 flex w-full sm:mb-1.5',
    weekday: 'flex-1 text-center text-[11px] font-medium uppercase tracking-wide text-[#6b7280] lg:text-xs',
    week: 'flex w-full',
    // Padding más ajustado por debajo de 640px: en un móvil estrecho (390px) el botón del
    // día cae a ~40.9px con 3px de aire; a 2px sube a ~43.4px, más cerca del objetivo táctil
    // de 44px sin sacrificar legibilidad en tablet/desktop (que ya sobra ancho).
    day: 'flex-1 p-[2px] sm:p-[3px]',
} as const;

const SPLIT_EMBEDDED_CALENDAR_CLASS_NAMES = {
    ...EMBEDDED_CALENDAR_CLASS_NAMES,
    month: 'flex w-full flex-col gap-1.5 lg:gap-2',
} as const;
/** Mismo patrón visual que el panel del experto cuando aún no hay día elegido. */
function PickDayEmptyState({ compactSplit }: { compactSplit?: boolean }) {
    return (
        <div
            className={cn(
                'flex w-full flex-col items-center justify-center text-center',
                compactSplit ? 'px-2 py-2' : 'px-3 py-3 lg:py-2.5',
            )}
            role="status"
        >
            <div className={cn('grid w-[52px] grid-cols-3 gap-1', compactSplit ? 'mb-2' : 'mb-3 lg:mb-2.5')} aria-hidden>
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
            <p className={cn('font-semibold text-[#1c1c1c]', compactSplit ? 'text-[13px]' : 'text-sm')}>
                Elige un día en el calendario
            </p>
            {!compactSplit ? (
                <>
            <p className="mt-1.5 max-w-[32ch] text-[13px] leading-relaxed text-[#6b7280] max-lg:hidden">
                Los días en verde tienen más huecos libres. Al pulsar uno verás las franjas de mañana
                y tarde con las horas concretas del experto.
            </p>
            <p className="mt-1.5 max-w-[32ch] text-[13px] leading-relaxed text-[#6b7280] lg:hidden">
                Los días en verde tienen más huecos libres. Al pulsar uno se abrirá el selector de hora.
            </p>
                </>
            ) : (
                <p className="mt-1 max-w-[18ch] text-[11px] leading-snug text-[#6b7280]">
                    Pulsa un día en verde para ver las horas.
                </p>
            )}
        </div>
    );
}

// Mismo hue que el resto de la app (STATUS_TONE_BADGE_CLASSES en statusUtils.ts:
// success #0F6A3E, warning #8a5a10) en vez de los verdes/ámbares de stock de Tailwind
// (hue distinto, más teal/naranja) y gris neutro real en vez de slate azulado (que
// remite al azul de marca del día seleccionado). Luminosidad ajustada para AA ≥4.5:1
// con y sin el brightness(0.96) del hover.
const AVAILABILITY_LEGEND_ITEMS = [
    { label: 'Libre', swatch: 'bg-[#d2f4e4]' },
    { label: 'Pocos', swatch: 'bg-[#f8e9ce]' },
    { label: 'Lleno', swatch: 'bg-[#e6e6e6]' },
] as const;

/** Leyenda de disponibilidad bajo el calendario (colores = celdas del mes). */
function AvailabilityLegend({
    align = 'center',
    trailing,
    compact = false,
}: {
    align?: 'center' | 'between';
    trailing?: React.ReactNode;
    compact?: boolean;
}) {
    return (
        <div
            className={cn(
                'flex flex-wrap items-center border-t border-[#eceef2] px-[2px] sm:px-[3px]',
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
                            'inline-flex items-center gap-1.5 font-medium leading-none text-[#475569]',
                            compact ? 'text-[11px]' : 'text-[12px]',
                        )}
                    >
                        <span
                            className={cn('h-3.5 w-3.5 shrink-0 rounded-[4px]', swatch)}
                            aria-hidden
                        />
                        {label}
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
    embeddedSplitColumn = false,
    showSectionHeader = true,
    bare = false,
}) => {
    const embeddedSplitLayout = embedded && embeddedSplitColumn;
    const bareLayout = embedded && bare;
    const previewBrowseHours = embedded && previewMode && embeddedSplitColumn;
    const mobilePreviewDrawer = embedded && previewMode && !embeddedSplitColumn;
    const blockDayPick = previewMode && !embeddedSplitColumn && !mobilePreviewDrawer;

    const availBase = slotsBaseUrl ?? `${API_CONFIG.baseUrl}/api/Availability/service/${serviceId}`;
    const effWindow = windowDays && windowDays > 0 ? windowDays : BOOKING_WINDOW_DAYS;
    const { minDate, maxDate } = useMemo(
        () => computeSlotDateRange(new Date(), minLeadDays, effWindow),
        [minLeadDays, effWindow],
    );
    const defaultDate = useMemo(() => minDate, [minDate]);
    const initialSelectedDate = useMemo((): Date | null => {
        if (previewBrowseHours) return defaultDate;
        if (mobilePreviewDrawer) return defaultDate;
        if (embedded && previewMode) return null;
        if (embedded) return defaultDate;
        return defaultDate;
    }, [embedded, previewMode, previewBrowseHours, mobilePreviewDrawer, defaultDate]);

    const [selectedDate, setSelectedDate] = useState<Date | null>(initialSelectedDate);
    const [slots, setSlots] = useState<ChosenSlot[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [calMonth, setCalMonth] = useState<Date>(defaultDate);
    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
    const calMonthLabel = capitalize(calMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }));
    const atCurrentMonth = calMonth.getFullYear() === new Date().getFullYear() && calMonth.getMonth() === new Date().getMonth();
    const atMaxMonth = calMonth.getFullYear() === maxDate.getFullYear() && calMonth.getMonth() === maxDate.getMonth();
    const goCalMonth = (delta: number) => setCalMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));
    const goCalToday = () => setCalMonth(new Date());
    // Nº de huecos libres por día (ymd → count) para colorear el calendario por ocupación.
    const [availByDate, setAvailByDate] = useState<Record<string, number>>({});
    const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');
    const [hoursDrawerExpanded, setHoursDrawerExpanded] = useState(false);
    const browseAutoPickDone = useRef(false);

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

    // Modo consulta seller desktop: abrir el primer día con huecos libres.
    useEffect(() => {
        if (!previewBrowseHours || browseAutoPickDone.current || Object.keys(availByDate).length === 0) return;
        browseAutoPickDone.current = true;
        const cursor = new Date(minDate);
        while (cursor <= maxDate) {
            const ymd = toYmd(cursor);
            if ((availByDate[ymd] ?? 0) > 0) {
                setSelectedDate(startOfDay(cursor));
                return;
            }
            cursor.setDate(cursor.getDate() + 1);
        }
    }, [previewBrowseHours, availByDate, minDate, maxDate]);

    // Color en cada celda del día (no en el contenedor del calendario).
    const AvailabilityDayButton = useMemo(() => {
        const Btn = ({ day, modifiers, className, ...props }: any) => {
            const ref = useRef<HTMLButtonElement>(null);
            const ymd = toYmd(day.date);
            const free = availByDate[ymd];
            const selected = !!modifiers?.selected;
            const disabled = !!modifiers?.disabled;
            const isToday = !!modifiers?.today;
            const hasSummary = Object.keys(availByDate).length > 0;

            // Contrato de react-day-picker v9: al mover el día enfocado con el
            // teclado (flechas/Home/End), rdp marca modifiers.focused y espera que
            // el botón se auto-enfoque. Sin esto la navegación por teclado se rompe.
            useEffect(() => {
                if (modifiers?.focused) ref.current?.focus();
            }, [modifiers?.focused]);

            let tint = '';
            if (!selected && !disabled) {
                if (hasSummary && free !== undefined) {
                    tint =
                        free === 0
                            ? 'bg-[#e6e6e6] text-[#4a4a4a]'
                            : free <= 2
                              ? 'bg-[#f8e9ce] text-[#8a5a10]'
                              : 'bg-[#d2f4e4] text-[#0F6A3E]';
                }
            }

            return (
                <button
                    type="button"
                    ref={ref}
                    {...props}
                    onClick={(e) => {
                        if (blockDayPick) {
                            e.preventDefault();
                            e.stopPropagation();
                            return;
                        }
                        props.onClick?.(e);
                    }}
                    className={cn(
                        'relative flex aspect-square w-full select-none items-center justify-center overflow-hidden rounded-lg font-semibold tabular-nums transition-[translate,scale,background-color,box-shadow] duration-150 motion-reduce:transition-[background-color,box-shadow]',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/55',
                        embedded ? 'text-[13px] lg:text-[14px]' : 'text-sm',
                        !disabled && !selected && !blockDayPick && 'cursor-pointer motion-safe:hover:-translate-y-px active:translate-y-0 active:scale-[0.97]',
                        selected && !blockDayPick && 'bg-brand text-white font-bold scale-[1.06] z-10 shadow-[0_3px_10px_hsl(var(--brand)/0.35)] ring-2 ring-inset ring-white/70',
                        !selected && tint,
                        !selected && tint && !blockDayPick && 'hover:brightness-[0.96]',
                        !selected && !tint && !blockDayPick && 'text-[#1c1c1c] hover:bg-[#f3f4f6]',
                        !selected && isToday && !blockDayPick && 'ring-2 ring-inset ring-brand/70',
                        blockDayPick && 'cursor-not-allowed',
                        disabled && 'opacity-35',
                        className,
                    )}
                >
                    <span className="relative z-10">{day.date.getDate()}</span>
                </button>
            );
        };
        return Btn;
    }, [availByDate, embedded, blockDayPick]);

    const handleDateSelect = (date: Date | undefined) => {
        if (blockDayPick) return;
        if (!date || isDateDisabled(date)) return;
        setSelectedDate(startOfDay(date));
        if (!previewMode) onSelect(null);
        setHoursDrawerExpanded(true);
    };

    const gridClass = embedded
        ? previewMode && !embeddedSplitColumn
            ? 'grid-cols-1'
            : embeddedSplitColumn
              ? 'grid-cols-1 gap-2.5 lg:grid-cols-[minmax(0,1fr)_minmax(10rem,11.5rem)] lg:items-stretch lg:gap-x-0 lg:gap-y-0'
              : 'grid-cols-1 gap-2.5 lg:grid-cols-[minmax(14rem,15.5rem)_minmax(0,1fr)] lg:items-stretch lg:gap-x-3 lg:gap-y-0'
        : 'grid-cols-1 lg:grid-cols-2';

    const calendarColClass = cn(
        'flex flex-col',
        embedded
            ? cn(
                  'pt-0 pb-0 lg:items-start lg:border-r lg:border-[#eceef2]',
                  embeddedSplitColumn ? 'lg:px-3' : 'lg:pr-4',
                  embeddedSplitColumn && embeddedSplitLayout && 'lg:flex lg:flex-col lg:self-start',
                  !embeddedSplitColumn && 'lg:self-stretch',
              )
            : 'max-lg:border-b max-lg:border-[#eceef2] max-lg:px-4 max-lg:py-3.5 lg:border-r lg:border-[#eceef2] lg:p-3 lg:py-3',
    );

    const slotsColClass = cn(
        'flex min-h-0 flex-col',
        embedded
            ? cn(
                  'pb-0 pt-0 lg:min-w-0',
                  embeddedSplitColumn ? 'lg:px-3' : 'lg:pl-4',
                  embeddedSplitColumn
                      ? cn(
                            'lg:py-1',
                            selectedDate ? 'lg:justify-start' : 'lg:justify-center',
                        )
                      : cn(
                            'lg:min-h-full',
                            previewMode
                                ? 'lg:h-full lg:justify-stretch'
                                : !selectedDate
                                  ? 'lg:justify-center'
                                  : 'lg:justify-start lg:pt-0',
                        ),
              )
            : 'max-lg:p-4 max-lg:pt-3 lg:justify-center lg:p-3 lg:pl-4',
    );

    function CalendarToolbar() {
        return (
            <div className="mb-3 flex select-none items-center justify-between gap-3 px-[2px] sm:px-[3px]">
                <div>
                    <h3 className="text-[16px] font-semibold tracking-[-0.01em] text-[#1c1c1c]">{calMonthLabel}</h3>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        type="button"
                        onClick={goCalToday}
                        className="h-8 rounded-lg border border-[#e5e7eb] bg-white px-3 text-xs font-semibold text-[#1c1c1c] transition-colors hover:bg-[#f7f7f7] hover:border-[#cbd5e1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-1"
                    >
                        Hoy
                    </button>
                    <div className="flex items-center gap-0.5 rounded-lg border border-[#e5e7eb] bg-[#fafafa] p-0.5">
                        <button
                            type="button"
                            onClick={() => goCalMonth(-1)}
                            disabled={atCurrentMonth}
                            aria-label="Mes anterior"
                            className="inline-flex h-[26px] w-8 items-center justify-center rounded-md text-[#6a6a6a] transition-colors hover:bg-white hover:text-[#1c1c1c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:opacity-35 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="h-[18px] w-[18px]" />
                        </button>
                        <button
                            type="button"
                            onClick={() => goCalMonth(1)}
                            disabled={atMaxMonth}
                            aria-label="Mes siguiente"
                            className="inline-flex h-[26px] w-8 items-center justify-center rounded-md text-[#6a6a6a] transition-colors hover:bg-white hover:text-[#1c1c1c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:opacity-35 disabled:cursor-not-allowed"
                        >
                            <ChevronRight className="h-[18px] w-[18px]" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const useMobileHoursDrawer = !previewMode || mobilePreviewDrawer;

    const inlineSlotsColumnClass = cn(
        slotsColClass,
        useMobileHoursDrawer && 'hidden lg:flex',
    );

    const renderSelectableHoursBody = (opts?: {
        embeddedSlots?: boolean;
        splitPeriodsOnMobile?: boolean;
        browseOnly?: boolean;
    }) => {
        const slotEmbedded = opts?.embeddedSlots ?? !!embedded;
        const browseOnly = opts?.browseOnly ?? previewMode;
        if (loading) {
            // Skeleton con la MISMA rejilla que el panel real de horas (h-9, 4 col móvil /
            // 3 col lg) en vez de un spinner centrado → no se colapsa la altura ni salta.
            return (
                <div className="grid grid-cols-4 gap-1.5 lg:grid-cols-3 lg:gap-2" aria-hidden="true">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <SileoSkeleton key={i} className="h-10 w-full rounded-lg lg:h-8" />
                    ))}
                </div>
            );
        }
        if (error) {
            return (
                <div className="flex min-h-[72px] items-center justify-center px-2" role="alert">
                    <p className="text-center text-xs text-red-600">{error}</p>
                </div>
            );
        }
        if (slots.length === 0) {
            return (
                <div
                    className={cn(
                        'flex flex-col items-center justify-center gap-1 px-2 text-center',
                        browseOnly ? 'min-h-[10rem] py-4' : 'min-h-[72px]',
                    )}
                    role="status"
                >
                    <p className="text-[13px] font-semibold text-[#1c1c1c]">
                        Sin huecos este día
                    </p>
                    <p className="text-[12px] text-[#6b7280]">
                        Elige otra fecha en el calendario
                    </p>
                </div>
            );
        }
        return (
            <SlotPeriodPanel
                slots={slots}
                selected={selected}
                previewMode={browseOnly}
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

    const embeddedCalendarGrid = (
        <div
            className={cn(
                'grid lg:min-h-0',
                gridClass,
                embeddedSplitColumn && 'mx-auto w-full',
            )}
        >
            <div className={calendarColClass}>
                <div
                    className={cn(
                        'w-full',
                        embeddedSplitColumn
                            ? 'mx-auto w-full max-w-[24rem] lg:max-w-[27rem]'
                            : cn('lg:flex lg:h-full lg:flex-col', EMBEDDED_CALENDAR_MAX_WIDTH_CLASS),
                    )}
                >
                    <CalendarToolbar />
                    <Calendar
                        mode="single"
                        locale={es}
                        month={calMonth}
                        onMonthChange={setCalMonth}
                        selected={selectedDate ?? undefined}
                        onSelect={handleDateSelect}
                        defaultMonth={selectedDate ?? defaultDate}
                        disabled={isDateDisabled}
                        showOutsideDays={false}
                        components={{ DayButton: AvailabilityDayButton }}
                        classNames={{
                            ...(embeddedSplitColumn
                                ? SPLIT_EMBEDDED_CALENDAR_CLASS_NAMES
                                : EMBEDDED_CALENDAR_CLASS_NAMES),
                        }}
                        className={embeddedCalendarClass()}
                    />
                    <AvailabilityLegend align="between" compact />
                </div>
            </div>
            <div className={inlineSlotsColumnClass}>
                {!selectedDate ? (
                    <PickDayEmptyState compactSplit={embeddedSplitColumn} />
                ) : (
                    <>
                        <p
                            className={cn(
                                'mb-2 font-semibold leading-snug text-[#1c1c1c]',
                                previewBrowseHours ? 'text-center text-sm lg:text-[14px]' : 'text-[13px] lg:text-[14px]',
                            )}
                        >
                            {capitalize(dayLong(selectedDate))}
                        </p>
                        <div className="flex flex-1 flex-col justify-start">
                            {renderSelectableHoursBody({ browseOnly: previewBrowseHours })}
                        </div>
                    </>
                )}
            </div>
        </div>
    );

    const mobileHoursDrawer =
        useMobileHoursDrawer && selectedDate ? (
            <CheckoutSlotHoursDrawer
                open
                dateLabel={capitalize(dayLong(selectedDate))}
                selectedLabel={selected?.label ?? null}
                expanded={hoursDrawerExpanded}
                onToggle={() => setHoursDrawerExpanded((v) => !v)}
            >
                {renderSelectableHoursBody({ splitPeriodsOnMobile: true })}
            </CheckoutSlotHoursDrawer>
        ) : null;

    return (
        <div
            className={cn(
                !embedded && 'max-lg:shadow-sm',
                !embedded && SD_CHECKOUT_DESKTOP_CARD_CLASS,
                embedded && embeddedSplitColumn && !bare && 'flex h-full min-h-0 w-full flex-col',
                bareLayout && 'flex h-full min-h-0 w-full flex-col',
            )}
        >
            {sectionTitle && showSectionHeader ? (
                embedded ? (
                    <div className={cn('max-lg:hidden', embeddedSplitColumn && 'w-full')}>
                        <CheckoutEmbeddedStepHeader
                            step={2}
                            title={sectionTitle}
                            description={
                                previewMode
                                    ? embeddedSplitColumn
                                        ? 'Consulta la agenda del experto: el vendedor elegirá un hueco libre al reservar.'
                                        : SELLER_COORD_CALENDAR_PREVIEW_NOTE
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
                    <p className="mt-0.5 text-[13px] text-[#6a6a6a]">
                        {SELLER_COORD_CALENDAR_PREVIEW_NOTE}
                    </p>
                </div>
                ) : null
            ) : null}

            {embedded && previewMode && !mobilePreviewDrawer && !embeddedSplitColumn ? (
                <CheckoutSellerChoicePreviewCalendar
                    splitColumn={embeddedSplitColumn}
                    showInnerHeader={!embeddedSplitColumn}
                    bare={bare}
                >
                    <div
                        className={cn(
                            'w-full max-lg:mx-auto',
                            cn('lg:flex lg:h-full lg:flex-col', EMBEDDED_CALENDAR_MAX_WIDTH_CLASS),
                        )}
                    >
                        <CalendarToolbar />
                        <Calendar
                            mode="single"
                            locale={es}
                            month={calMonth}
                            onMonthChange={setCalMonth}
                            selected={undefined}
                            onSelect={undefined}
                            defaultMonth={defaultDate}
                            disabled={isDateDisabled}
                            showOutsideDays={false}
                            components={{ DayButton: AvailabilityDayButton }}
                            classNames={{
                                ...EMBEDDED_CALENDAR_CLASS_NAMES,
                            }}
                            className={embeddedCalendarClass()}
                        />
                        <AvailabilityLegend align="between" compact />
                    </div>
                </CheckoutSellerChoicePreviewCalendar>
            ) : embedded && previewMode && !mobilePreviewDrawer && embeddedSplitColumn ? (
                <CheckoutSellerChoicePreviewCalendar
                    splitColumn={embeddedSplitColumn}
                    showInnerHeader={!embeddedSplitColumn}
                    bare={bare}
                >
                    {embeddedCalendarGrid}
                </CheckoutSellerChoicePreviewCalendar>
            ) : embedded ? (
                <>
                <CheckoutSelfChoicePreviewCalendar
                    splitColumn={embeddedSplitColumn}
                    showInnerHeader={!embeddedSplitColumn && !bare}
                    bare={bare}
                    className={cn(useMobileHoursDrawer && selectedDate && 'max-lg:pb-32')}
                >
                    {embeddedCalendarGrid}
                </CheckoutSelfChoicePreviewCalendar>
                {mobileHoursDrawer}
                </>
            ) : (
            <>
            <CheckoutSelfChoicePreviewCalendar
                className={cn('pt-0', useMobileHoursDrawer && selectedDate && 'max-lg:pb-32')}
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
                <CalendarToolbar />
                <Calendar
                    mode="single"
                    locale={es}
                    month={calMonth}
                    onMonthChange={setCalMonth}
                    selected={selectedDate ?? undefined}
                    onSelect={handleDateSelect}
                    defaultMonth={selectedDate ?? defaultDate}
                    disabled={isDateDisabled}
                    showOutsideDays={false}
                    components={{ DayButton: AvailabilityDayButton }}
                    classNames={{
                        ...EMBEDDED_CALENDAR_CLASS_NAMES,
                    }}
                    className={cn(
                        embedded ? embeddedCalendarClass() : 'w-full p-0',
                    )}
                />
                {!embedded ? (
                <AvailabilityLegend align="center" />
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
                    <PickDayEmptyState compactSplit={embeddedSplitColumn} />
                ) : !previewMode ? (
                <>
                <p
                    className={cn(
                        'mb-2.5 font-semibold leading-snug text-[#1c1c1c]',
                        embedded ? 'text-[13px]' : 'mb-2 text-sm',
                    )}
                >
                    {selectedDate ? capitalize(dayLong(selectedDate)) : ''}
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
