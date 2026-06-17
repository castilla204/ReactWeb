import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { es } from 'date-fns/locale';
import { API_CONFIG } from '../config/api';
import { getAuthToken } from '../lib/auth';
import { Calendar } from './ui/calendar';
import { cn } from '../lib/utils';
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
}

const pad = (n: number) => String(n).padStart(2, '0');
const toYmd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const startOfDay = (d: Date) => {
    const copy = new Date(d);
    copy.setHours(0, 0, 0, 0);
    return copy;
};

const BOOKING_WINDOW_DAYS = 14;

/**
 * Selector de cita estilo Calendly: calendario mensual + huecos horarios.
 * El cliente elige día y hora ANTES de pagar; el hueco viaja al checkout.
 */
const SlotPicker: React.FC<Props> = ({ serviceId, selected, onSelect, sectionTitle }) => {
    const minDate = useMemo(() => startOfDay(new Date()), []);
    const maxDate = useMemo(() => {
        const d = new Date(minDate);
        d.setDate(d.getDate() + BOOKING_WINDOW_DAYS - 1);
        return d;
    }, [minDate]);

    const defaultDate = useMemo(() => {
        const tomorrow = new Date(minDate);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow <= maxDate ? tomorrow : minDate;
    }, [minDate, maxDate]);

    const [selectedDate, setSelectedDate] = useState<Date>(defaultDate);
    const [slots, setSlots] = useState<ChosenSlot[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    // Nº de huecos libres por día (ymd → count) para colorear el calendario por ocupación.
    const [availByDate, setAvailByDate] = useState<Record<string, number>>({});

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
            const url = `${API_CONFIG.baseUrl}/api/Availability/service/${serviceId}/slots?date=${toYmd(date)}`;
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
    }, [serviceId]);

    useEffect(() => {
        fetchSlots(selectedDate);
    }, [selectedDate, fetchSlots]);

    // Resumen de ocupación de toda la ventana (una sola petición) → colores del calendario.
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const token = getAuthToken();
                const url = `${API_CONFIG.baseUrl}/api/Availability/service/${serviceId}/summary?from=${toYmd(minDate)}&days=${BOOKING_WINDOW_DAYS}`;
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
    }, [serviceId, minDate]);

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
                        'flex h-full w-full items-center justify-center rounded-lg text-sm font-semibold transition-all',
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
    }, [availByDate]);

    const handleDateSelect = (date: Date | undefined) => {
        if (!date || isDateDisabled(date)) return;
        setSelectedDate(startOfDay(date));
        onSelect(null);
    };

    return (
        <div className={cn('max-md:shadow-sm', SD_CHECKOUT_DESKTOP_CARD_CLASS)}>
            {sectionTitle ? (
                <div className={SD_CHECKOUT_DESKTOP_CARD_HEADER_CLASS}>
                    <h3 className="text-sm font-semibold tracking-[-0.01em] text-[#1c1c1c] lg:text-[15px]">
                        {sectionTitle}
                    </h3>
                </div>
            ) : null}

            <div className="grid max-md:overflow-hidden md:grid-cols-2 md:items-stretch lg:min-h-0">
            {/* Calendario */}
            <div className="flex flex-col max-md:border-b max-md:border-[#f0f0f0] max-md:px-4 max-md:py-3.5 md:border-r md:border-[#f0f0f0] md:p-3 md:py-3">
                <Calendar
                    mode="single"
                    locale={es}
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    defaultMonth={selectedDate}
                    disabled={isDateDisabled}
                    showOutsideDays={false}
                    components={{ DayButton: AvailabilityDayButton }}
                    classNames={{
                        button_previous:
                            'inline-flex size-9 items-center justify-center rounded-lg text-[#6a6a6a] transition-colors hover:bg-[#f3f4f6] hover:text-[#1c1c1c]',
                        button_next:
                            'inline-flex size-9 items-center justify-center rounded-lg text-[#6a6a6a] transition-colors hover:bg-[#f3f4f6] hover:text-[#1c1c1c]',
                    }}
                    className="w-full p-0"
                />
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
            </div>

            {/* Huecos horarios */}
            <div className="flex min-h-0 flex-col justify-center max-md:p-4 max-md:pt-3 md:p-3 md:pl-4">
                <p className="mb-2 text-sm font-medium capitalize text-[#1c1c1c]">
                    {dayLong(selectedDate)}
                </p>

                <div className="flex-1">
                    {loading ? (
                        <div className="flex min-h-[72px] items-center justify-center gap-2 text-xs text-[#9ca3af]">
                            <Loader2 className="h-4 w-4 animate-spin text-brand" />
                            <span>Cargando huecos…</span>
                        </div>
                    ) : error ? (
                        <div className="flex min-h-[72px] items-center justify-center px-2">
                            <p className="text-center text-xs text-[#0b5cad]">{error}</p>
                        </div>
                    ) : slots.length === 0 ? (
                        <div className="flex min-h-[72px] flex-col items-center justify-center gap-0.5 px-2 text-center">
                            <p className="text-xs font-medium text-[#555]">Sin huecos este día</p>
                            <p className="text-[11px] text-[#9ca3af]">Elige otra fecha</p>
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-2" role="listbox" aria-label="Horarios disponibles">
                            {slots.map((s) => {
                                const active = selected?.startUtc === s.startUtc;
                                return (
                                    <button
                                        key={s.startUtc}
                                        type="button"
                                        role="option"
                                        aria-selected={active}
                                        onClick={() => onSelect(active ? null : s)}
                                        className={cn(
                                            'inline-flex h-9 min-w-[3.75rem] items-center justify-center rounded-lg border px-2.5 text-[13px] font-medium tabular-nums transition-colors sm:min-w-[4.25rem] sm:px-3',
                                            active
                                                ? 'border-brand bg-brand text-white shadow-sm'
                                                : 'border-[#e5e7eb] bg-white text-[#1c1c1c] hover:border-brand/45 hover:bg-brand/[0.04] active:scale-[0.98]',
                                        )}
                                    >
                                        {s.label}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
            </div>
        </div>
    );
};

export default SlotPicker;
