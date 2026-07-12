import React, { useState, useEffect, useRef, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react';
import { Loader2, ChevronLeft, ChevronRight, X, Save, Undo2 } from 'lucide-react';
import { es } from 'date-fns/locale';
import { API_CONFIG } from '../../config/api';
import { getAuthToken } from '../../lib/auth';
import { Calendar } from '../ui/calendar';
import { cn } from '../../lib/utils';
import RangeList, { Range } from './RangeList';
import type { AvailabilityHandle } from './AvailabilityRulesEditor';

interface ExceptionDto { date: string; isWorking: boolean; ranges: { start: string; end: string }[]; }
interface RuleDto { dayOfWeek: number; startLocal: string; endLocal: string; }

// Cambio pendiente (sin guardar) de un día: o lo borra (vuelve al horario semanal) o fija estado/franjas.
type PendingChange = { remove: true } | { remove?: false; isWorking: boolean; ranges: Range[] };
interface DayState { isWorking: boolean; ranges: Range[]; }

const pad = (n: number) => String(n).padStart(2, '0');
const toYmd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromYmd = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const startOfDay = (d: Date) => { const c = new Date(d); c.setHours(0, 0, 0, 0); return c; };
const minutesOf = (hhmm: string) => { const [h, m] = hhmm.split(':').map(Number); return (h || 0) * 60 + (m || 0); };

const authHeaders = (): Record<string, string> => {
    const t = getAuthToken();
    return t ? { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
};

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// Días de la semana para los atajos de columna (lunes primero). dow = getDay() (0=domingo).
const WEEKDAYS: { dow: number; short: string }[] = [
    { dow: 1, short: 'L' }, { dow: 2, short: 'M' }, { dow: 3, short: 'X' }, { dow: 4, short: 'J' },
    { dow: 5, short: 'V' }, { dow: 6, short: 'S' }, { dow: 0, short: 'D' },
];

// Categoría visual de un día (para que el COLOR refleje las franjas, no solo abierto/cerrado).
type DayKind = 'closed' | 'full' | 'reduced' | 'split';
const kindOf = (works: boolean, ranges: Range[]): DayKind => {
    if (!works || ranges.length === 0) return 'closed';
    if (ranges.length >= 2) return 'split';
    const dur = minutesOf(ranges[0].end) - minutesOf(ranges[0].start);
    return dur >= 420 ? 'full' : 'reduced';
};
// Cada categoría con su PROPIO hue (sobrio, pastel) para que se distingan de un vistazo:
//   completa = verde · reducido = azul · turnos partidos = violeta · cerrado = gris tramado.
const KIND_CLASS: Record<Exclude<DayKind, 'closed'>, string> = {
    full: 'bg-[hsl(150_46%_88%)] text-[hsl(154_55%_24%)] hover:bg-[hsl(150_46%_82%)]',
    reduced: 'bg-[hsl(206_72%_88%)] text-[hsl(211_60%_30%)] hover:bg-[hsl(206_72%_82%)]',
    split: 'bg-[hsl(258_50%_90%)] text-[hsl(260_46%_36%)] hover:bg-[hsl(258_50%_84%)]',
};
// Tonos para la leyenda (swatches), espejo de los fondos de arriba.
const KIND_SWATCH: Record<Exclude<DayKind, 'closed'>, string> = {
    full: 'hsl(150 46% 80%)',
    reduced: 'hsl(206 72% 80%)',
    split: 'hsl(258 50% 82%)',
};

const sameState = (a: DayState, b: DayState) =>
    a.isWorking === b.isWorking && a.ranges.length === b.ranges.length &&
    a.ranges.every((r, i) => r.start === b.ranges[i].start && r.end === b.ranges[i].end);

/**
 * 🗓️ Calendario mensual de disponibilidad del experto. Permite SELECCIONAR VARIOS días a la vez
 * (clic acumula; atajos por columna de día de la semana / mes), aplicarles el mismo cambio de golpe
 * y guardarlos TODOS con un único PUT batch a /api/ExpertAvailability/exceptions/batch.
 * El COLOR de cada día refleja sus franjas (jornada completa / reducida / turnos partidos / cerrado).
 */
interface AvailabilityCalendarProps {
    adminUserId?: number;
    /** Modo coordinado: oculta la barra propia de guardar; el padre orquesta el guardado unificado. */
    embedded?: boolean;
    onDirtyChange?: (pendingCount: number) => void;
}

const AvailabilityCalendar = forwardRef<AvailabilityHandle, AvailabilityCalendarProps>(function AvailabilityCalendar(
    { adminUserId, embedded = false, onDirtyChange },
    ref,
) {
    // Base de la API: en modo admin apunta al experto objetivo; si no, al experto autenticado.
    const avBase = adminUserId != null
        ? `/api/admin/expert/${adminUserId}/availability`
        : '/api/ExpertAvailability';
    const today = useMemo(() => startOfDay(new Date()), []);
    const [month, setMonth] = useState<Date>(today);
    const [rules, setRules] = useState<RuleDto[]>([]);
    const [exceptions, setExceptions] = useState<Record<string, ExceptionDto>>({});
    const [pending, setPending] = useState<Record<string, PendingChange>>({});
    const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set());
    const [draft, setDraft] = useState<DayState>({ isWorking: true, ranges: [{ start: '09:00', end: '18:00' }] });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    // Alcance de los atajos por día de la semana: solo el mes visible o hasta el horizonte.
    const [scope, setScope] = useState<'month' | 'all'>('month');
    // Confirmación inline al aplicar a muchos días (evita cierres masivos accidentales).
    const [confirmBulk, setConfirmBulk] = useState(false);
    const prevSelSize = useRef(0);

    const enabledWeekdays = useMemo(() => new Set(rules.map((r) => r.dayOfWeek)), [rules]);
    const pendingCount = Object.keys(pending).length;
    const selCount = selectedDays.size;
    const BULK_THRESHOLD = 31; // a partir de aquí, pedir confirmación al aplicar

    // Horizonte para "Todo el calendario": 18 meses desde hoy (acota el batch y es comunicable).
    const horizonEnd = useMemo(() => new Date(today.getFullYear(), today.getMonth() + 18 + 1, 0), [today]);
    const horizonLabel = useMemo(
        () => horizonEnd.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
        [horizonEnd],
    );
    // Cuántos días seleccionados caen fuera del mes que se está viendo (para avisar de que no se ven).
    const selOutsideMonth = useMemo(() => {
        let n = 0;
        selectedDays.forEach((ymd) => { const d = fromYmd(ymd); if (d.getFullYear() !== month.getFullYear() || d.getMonth() !== month.getMonth()) n += 1; });
        return n;
    }, [selectedDays, month]);

    const rangeFromTo = useCallback((m: Date) => {
        const from = new Date(m.getFullYear(), m.getMonth(), 1);
        const to = new Date(m.getFullYear(), m.getMonth() + 2, 0);
        return { from: toYmd(from), to: toYmd(to) };
    }, []);

    const load = useCallback(async (m: Date) => {
        setLoading(true);
        setError(null);
        try {
            const { from, to } = rangeFromTo(m);
            const [rRes, eRes] = await Promise.all([
                fetch(`${API_CONFIG.baseUrl}${avBase}/rules`, { headers: authHeaders() }),
                fetch(`${API_CONFIG.baseUrl}${avBase}/exceptions?from=${from}&to=${to}`, { headers: authHeaders() }),
            ]);
            const rData: any[] = rRes.ok ? await rRes.json() : [];
            const eData: any[] = eRes.ok ? await eRes.json() : [];
            setRules((rData || []).map((r) => ({
                dayOfWeek: r.dayOfWeek ?? r.DayOfWeek,
                startLocal: r.startLocal ?? r.StartLocal,
                endLocal: r.endLocal ?? r.EndLocal,
            })));
            const map: Record<string, ExceptionDto> = {};
            (eData || []).forEach((e) => {
                const date = e.date ?? e.Date;
                map[date] = {
                    date,
                    isWorking: e.isWorking ?? e.IsWorking,
                    ranges: (e.ranges ?? e.Ranges ?? []).map((x: any) => ({ start: x.start ?? x.Start, end: x.end ?? x.End })),
                };
            });
            setExceptions(map);
        } catch {
            setError('No se pudo cargar el calendario.');
        } finally {
            setLoading(false);
        }
    }, [rangeFromTo, avBase]);

    useEffect(() => { load(month); }, [month, load]);

    const effException = useCallback((ymd: string): ExceptionDto | undefined => {
        const p = pending[ymd];
        if (p) return p.remove ? undefined : { date: ymd, isWorking: p.isWorking, ranges: p.ranges };
        return exceptions[ymd];
    }, [pending, exceptions]);

    const worksOn = useCallback((d: Date): boolean => {
        const ex = effException(toYmd(d));
        if (ex) return ex.isWorking;
        return enabledWeekdays.has(d.getDay());
    }, [effException, enabledWeekdays]);

    const hoursFor = useCallback((d: Date): Range[] => {
        const ex = effException(toYmd(d));
        if (ex) return ex.isWorking ? ex.ranges.map((r) => ({ start: r.start.slice(0, 5), end: r.end.slice(0, 5) })) : [];
        if (!enabledWeekdays.has(d.getDay())) return [];
        return rules.filter((r) => r.dayOfWeek === d.getDay())
            .map((r) => ({ start: r.startLocal.slice(0, 5), end: r.endLocal.slice(0, 5) }));
    }, [effException, enabledWeekdays, rules]);

    // Estado efectivo de un día (excepción/pending o, si no, el horario semanal). Para precargar y detectar mezcla.
    const effState = useCallback((ymd: string): DayState => {
        const d = fromYmd(ymd);
        return { isWorking: worksOn(d), ranges: hoursFor(d) };
    }, [worksOn, hoursFor]);

    // ¿La selección tiene estados distintos? (entonces aplicar homogeneizará todos).
    const mixed = useMemo(() => {
        if (selCount < 2) return false;
        const list = [...selectedDays].map(effState);
        return !list.every((s) => sameState(s, list[0]));
    }, [selectedDays, selCount, effState]);

    // Precargar el draft SOLO cuando la selección nace (0 → >0). En toggles sucesivos no se toca
    // para no machacar lo que el usuario está editando.
    useEffect(() => {
        if (prevSelSize.current === 0 && selCount > 0) {
            const states = [...selectedDays].map(effState);
            const allSame = states.every((s) => sameState(s, states[0]));
            if (allSame && states[0]) {
                const s = states[0];
                setDraft(s.isWorking && s.ranges.length === 0
                    ? { isWorking: true, ranges: [{ start: '09:00', end: '18:00' }] }
                    : { isWorking: s.isWorking, ranges: s.ranges.map((r) => ({ ...r })) });
            } else {
                setDraft({ isWorking: true, ranges: [{ start: '09:00', end: '18:00' }] });
            }
            setError(null); setSuccess(null);
        }
        prevSelSize.current = selCount;
    }, [selCount, selectedDays, effState]);

    const toggleDay = (d: Date) => {
        if (startOfDay(d) < today) return; // pasado: solo lectura
        const ymd = toYmd(d);
        setSelectedDays((prev) => {
            const next = new Set(prev);
            if (next.has(ymd)) next.delete(ymd); else next.add(ymd);
            return next;
        });
    };

    // Atajo: añadir todos los días de un día-de-la-semana. Según `scope`: solo el mes visible,
    // o desde hoy hasta el horizonte (varios meses/años). Itera por fecha-calendario (estable en
    // cualquier zona horaria; getDay() de un Y-M-D a medianoche local es el día correcto).
    const selectWeekdayColumn = (dow: number) => {
        const start = scope === 'all'
            ? new Date(today.getFullYear(), today.getMonth(), 1)
            : new Date(month.getFullYear(), month.getMonth(), 1);
        const end = scope === 'all'
            ? horizonEnd
            : new Date(month.getFullYear(), month.getMonth() + 1, 0);
        setSelectedDays((prev) => {
            const next = new Set(prev);
            const cur = new Date(start);
            while (cur <= end) {
                if (startOfDay(cur) >= today && cur.getDay() === dow) next.add(toYmd(cur));
                cur.setDate(cur.getDate() + 1); // setDate normaliza rollover de mes/año y bisiestos
            }
            return next;
        });
    };

    const selectWholeMonth = () => {
        const year = month.getFullYear(); const mi = month.getMonth();
        const days = new Date(year, mi + 1, 0).getDate();
        setSelectedDays((prev) => {
            const next = new Set(prev);
            for (let day = 1; day <= days; day += 1) {
                const d = new Date(year, mi, day);
                if (startOfDay(d) >= today) next.add(toYmd(d));
            }
            return next;
        });
    };

    const clearSelection = () => { setSelectedDays(new Set()); setConfirmBulk(false); setScope('month'); };

    // Aplicar el draft a TODOS los días seleccionados (los acumula en pending). No llama al API.
    const applyToSelection = () => {
        if (selCount === 0) return;
        setError(null);
        if (draft.isWorking) {
            if (draft.ranges.length === 0) { setError('Añade al menos una franja horaria o marca los días como cerrados.'); return; }
            if (draft.ranges.some((r) => !r.start || !r.end || r.end <= r.start)) {
                setError('Revisa las horas: la hora de fin debe ser posterior a la de inicio.'); return;
            }
        }
        // Confirmación ante cambios masivos (p. ej. cerrar todos los martes de 18 meses sin querer).
        if (selCount > BULK_THRESHOLD && !confirmBulk) { setConfirmBulk(true); return; }
        const change: PendingChange = draft.isWorking
            ? { isWorking: true, ranges: draft.ranges.map((r) => ({ ...r })) }
            : { isWorking: false, ranges: [] };
        setPending((p) => {
            const next = { ...p };
            selectedDays.forEach((ymd) => {
                next[ymd] = change.remove
                    ? { remove: true }
                    : { isWorking: change.isWorking, ranges: change.ranges.map((r) => ({ ...r })) };
            });
            return next;
        });
        clearSelection();
    };

    // Restablecer: los días seleccionados vuelven al horario semanal (borra su excepción al guardar).
    const resetSelection = () => {
        if (selCount === 0) return;
        setError(null);
        setPending((p) => {
            const next = { ...p };
            selectedDays.forEach((ymd) => {
                if (exceptions[ymd]) next[ymd] = { remove: true };
                else delete next[ymd];
            });
            return next;
        });
        clearSelection();
    };

    const discardAll = () => { setPending({}); clearSelection(); setError(null); setSuccess(null); };

    const saveAll = async (): Promise<boolean> => {
        if (pendingCount === 0) return true;
        setSaving(true); setError(null); setSuccess(null);
        try {
            const items = Object.entries(pending).map(([date, p]) =>
                'remove' in p && p.remove
                    ? { date, remove: true, isWorking: false, ranges: [] as Range[] }
                    : { date, isWorking: (p as any).isWorking, ranges: (p as any).isWorking ? (p as any).ranges : [] });
            const res = await fetch(`${API_CONFIG.baseUrl}${avBase}/exceptions/batch`, {
                method: 'PUT', headers: authHeaders(), body: JSON.stringify({ exceptions: items }),
            });
            if (!res.ok) {
                const e = await res.json().catch(() => ({} as any));
                throw new Error(e.message || 'No se pudieron guardar los cambios.');
            }
            const n = pendingCount;
            setPending({});
            await load(month);
            setSuccess(`${n} día${n !== 1 ? 's' : ''} guardado${n !== 1 ? 's' : ''} correctamente.`);
            return true;
        } catch (err: any) {
            setError(err.message || 'No se pudieron guardar los cambios.');
            return false;
        } finally {
            setSaving(false);
        }
    };

    // Guardado unificado coordinado por el padre (AvailabilityTab): expone estado + acciones.
    useImperativeHandle(ref, () => ({
        isDirty: pendingCount > 0,
        pendingCount,
        save: saveAll,
        reload: () => load(month),
        discard: discardAll,
    }), [pendingCount, saveAll, load, month]);

    useEffect(() => { onDirtyChange?.(pendingCount); }, [pendingCount, onDirtyChange]);

    const goMonth = (delta: number) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));
    const atCurrentMonth = month.getFullYear() === today.getFullYear() && month.getMonth() === today.getMonth();

    const todayYmd = toYmd(today);
    const DayButton = useMemo(() => {
        const Btn = ({ day, className, ...props }: any) => {
            const d: Date = day.date;
            const ymd = toYmd(d);
            const past = startOfDay(d) < today;
            const works = worksOn(d);
            const kind = kindOf(works, hoursFor(d));
            const hasPersisted = !!exceptions[ymd];
            const isPending = ymd in pending;
            const isToday = ymd === todayYmd;
            const isSelected = selectedDays.has(ymd);
            const label = capitalize(d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }));
            const kindText = kind === 'closed' ? 'cerrado' : kind === 'split' ? 'turnos partidos' : kind === 'reduced' ? 'horario reducido' : 'jornada completa';
            const aria = past
                ? `${label}, pasado`
                : `${label}, ${works ? kindText : 'cerrado'}${isSelected ? ', seleccionado' : ''}${isPending ? ', cambio sin guardar' : hasPersisted ? ', con excepción' : ''}. Pulsa para seleccionar`;
            return (
                <button
                    type="button"
                    {...props}
                    onClick={(e: React.MouseEvent) => { e.preventDefault(); toggleDay(d); }}
                    aria-pressed={isSelected}
                    aria-label={aria}
                    title={past ? undefined : (works ? `${capitalize(kindText)} — pulsa para seleccionar` : 'Cerrado — pulsa para seleccionar')}
                    className={cn(
                        'group/cell relative flex h-full w-full items-center justify-center overflow-hidden rounded-lg text-sm tabular-nums transition-[transform,box-shadow,background-color] duration-150',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1',
                        past && 'cursor-default font-medium text-line',
                        !past && !isSelected && 'cursor-pointer font-semibold motion-safe:hover:-translate-y-px active:translate-y-0 active:scale-[0.97]',
                        !past && works && !isSelected && KIND_CLASS[kind === 'closed' ? 'full' : kind],
                        !past && !works && !isSelected && 'av-closed-cell text-ink-soft hover:text-ink-muted',
                        !past && isToday && !isSelected && 'ring-2 ring-inset ring-brand/70',
                        // seleccionado = relleno azul sólido, número blanco, realce (inconfundible)
                        isSelected && 'cursor-pointer bg-brand text-white font-bold scale-[1.06] z-10 shadow-[0_4px_12px_hsl(var(--brand)/0.5)] ring-2 ring-inset ring-white/70',
                        className,
                    )}
                >
                    <span className="relative z-10">{d.getDate()}</span>
                    {works && kind === 'split' && !isSelected && (
                        <span className="absolute bottom-1 left-1/2 z-10 flex -translate-x-1/2 gap-0.5" aria-hidden>
                            <span className="h-0.5 w-1.5 rounded-full bg-[hsl(260_46%_45%)]" />
                            <span className="h-0.5 w-1.5 rounded-full bg-[hsl(260_46%_45%)]" />
                        </span>
                    )}
                    {(isPending || hasPersisted) && (
                        <span
                            className={cn('absolute right-1 top-1 z-10 h-1.5 w-1.5 rounded-full ring-2 ring-white',
                                isPending ? 'bg-amber-500' : past ? 'bg-line' : 'bg-brand')}
                            aria-hidden
                        />
                    )}
                </button>
            );
        };
        return Btn;
    }, [worksOn, hoursFor, exceptions, pending, selectedDays, today, todayYmd]);

    const monthLabel = capitalize(month.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }));

    const monthStats = useMemo(() => {
        const year = month.getFullYear(); const monthIndex = month.getMonth();
        const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
        let workingDays = 0; let exceptionDays = 0;
        for (let day = 1; day <= daysInMonth; day += 1) {
            const date = new Date(year, monthIndex, day);
            if (worksOn(date)) workingDays += 1;
            if (effException(toYmd(date))) exceptionDays += 1;
        }
        return { workingDays, exceptionDays };
    }, [month, worksOn, effException]);

    const goToday = () => { setMonth(today); setSelectedDays(new Set([todayYmd])); };

    return (
        <section className="av-calendar">
            {error && <p className="av-calendar__alert av-calendar__alert--error">{error}</p>}
            {success && !pendingCount && (
                <p className="av-calendar__alert bg-success-tint text-success">{success}</p>
            )}

            {loading ? (
                <div className="av-calendar__loading">
                    <Loader2 className="h-4 w-4 animate-spin text-brand" /> Cargando calendario…
                </div>
            ) : (
                <div className="av-calendar__layout">
                    <div className="av-calendar__main">
                        <div className="av-calendar__toolbar">
                            <div className="av-calendar__toolbar-start">
                                <h3 className="av-calendar__month">{monthLabel}</h3>
                                <div className="av-calendar__stats">
                                    <span>{monthStats.workingDays} días activos</span>
                                    {monthStats.exceptionDays > 0 ? (
                                        <>
                                            <span className="av-calendar__stats-sep" aria-hidden>·</span>
                                            <span>{monthStats.exceptionDays} excepción{monthStats.exceptionDays !== 1 ? 'es' : ''}</span>
                                        </>
                                    ) : null}
                                </div>
                            </div>
                            <div className="av-calendar__toolbar-actions">
                                <button type="button" onClick={goToday} className="av-calendar__today">Hoy</button>
                                <div className="av-calendar__nav">
                                    <button type="button" onClick={() => goMonth(-1)} disabled={atCurrentMonth} aria-label="Mes anterior" className="av-calendar__nav-btn">
                                        <ChevronLeft className="h-[18px] w-[18px]" />
                                    </button>
                                    <button type="button" onClick={() => goMonth(1)} aria-label="Mes siguiente" className="av-calendar__nav-btn">
                                        <ChevronRight className="h-[18px] w-[18px]" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Atajos de selección múltiple: alcance + columna de día de la semana, todo el mes, limpiar. */}
                        <div className="av-calendar__quickselect" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', margin: '4px 0 6px' }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: 'hsl(var(--ink-soft))' }}>Seleccionar:</span>
                            {/* Alcance: ¿el botón de día abarca solo el mes o todo el calendario hasta el horizonte? */}
                            <div role="group" aria-label="Alcance de la selección por día de la semana"
                                style={{ display: 'inline-flex', border: '1px solid hsl(var(--line))', borderRadius: 999, overflow: 'hidden' }}>
                                <button type="button" aria-pressed={scope === 'month'} onClick={() => setScope('month')}
                                    className={cn('px-3 py-1 text-xs font-semibold', scope === 'month' ? 'bg-brand text-white' : 'bg-white text-ink-muted hover:text-brand')}>
                                    Este mes
                                </button>
                                <button type="button" aria-pressed={scope === 'all'} onClick={() => setScope('all')}
                                    className={cn('px-3 py-1 text-xs font-semibold', scope === 'all' ? 'bg-brand text-white' : 'bg-white text-ink-muted hover:text-brand')}>
                                    Todo el calendario
                                </button>
                            </div>
                            {WEEKDAYS.map((w) => (
                                <button key={w.dow} type="button" onClick={() => selectWeekdayColumn(w.dow)}
                                    aria-label={`Todos los "${w.short}" ${scope === 'all' ? `hasta ${horizonLabel}` : 'de este mes'}`}
                                    title={`Todos los "${w.short}" ${scope === 'all' ? `hasta ${horizonLabel}` : 'de este mes'}`}
                                    className="h-7 w-7 rounded-full border border-line text-xs font-semibold text-ink-muted hover:border-brand/50 hover:text-brand">
                                    {w.short}
                                </button>
                            ))}
                            <button type="button" onClick={selectWholeMonth}
                                className="rounded-full border border-line px-3 py-1 text-xs font-medium text-ink-muted hover:border-brand/50 hover:text-brand">
                                Todo el mes
                            </button>
                            {selCount > 0 && (
                                <button type="button" onClick={clearSelection} aria-label={`Limpiar selección de ${selCount} días`}
                                    className="rounded-full border border-line px-3 py-1 text-xs font-medium text-ink-soft hover:border-red-300 hover:text-red-500">
                                    Limpiar selección ({selCount})
                                </button>
                            )}
                        </div>
                        {(scope === 'all' || selOutsideMonth > 0) && (
                            <p className={cn('mb-2 text-xs', selCount > BULK_THRESHOLD ? 'font-medium text-amber-700' : 'text-ink-muted')}>
                                {scope === 'all' && <>Alcance ampliado: los botones de día seleccionan hasta <strong>{horizonLabel}</strong>. </>}
                                {selCount > 0 && <>{selCount} día{selCount !== 1 ? 's' : ''} seleccionado{selCount !== 1 ? 's' : ''}{selOutsideMonth > 0 ? ` (${selOutsideMonth} en otros meses — navega para verlos)` : ''}.</>}
                            </p>
                        )}

                        <Calendar
                            mode="single"
                            locale={es}
                            month={month}
                            onMonthChange={setMonth}
                            showOutsideDays={false}
                            components={{ DayButton }}
                            classNames={{ nav: 'hidden', month_caption: 'hidden' }}
                            className="av-calendar__picker w-full p-0"
                        />

                        <div className="av-calendar__legend">
                            <span className="av-calendar__legend-item">
                                <span className="av-calendar__legend-swatch" style={{ background: KIND_SWATCH.full }} aria-hidden />
                                Jornada completa
                            </span>
                            <span className="av-calendar__legend-item">
                                <span className="av-calendar__legend-swatch" style={{ background: KIND_SWATCH.reduced }} aria-hidden />
                                Horario reducido
                            </span>
                            <span className="av-calendar__legend-item">
                                <span className="av-calendar__legend-swatch" style={{ background: KIND_SWATCH.split }} aria-hidden />
                                Turnos partidos
                            </span>
                            <span className="av-calendar__legend-item">
                                <span className="av-calendar__legend-swatch av-closed-swatch" aria-hidden />
                                Cerrado
                            </span>
                            <span className="av-calendar__legend-item">
                                <span className="av-calendar__legend-swatch bg-warning" aria-hidden />
                                Sin guardar
                            </span>
                        </div>
                    </div>

                    <aside className="av-calendar__aside">
                        <div className="av-calendar__aside-card">
                        {selCount > 0 ? (
                            <div className="av-day-editor">
                                <div className="av-day-editor__head">
                                    <div className="min-w-0">
                                        {selCount === 1 ? (
                                            <>
                                                <p className="av-day-editor__weekday">{capitalize(fromYmd([...selectedDays][0]).toLocaleDateString('es-ES', { weekday: 'long' }))}</p>
                                                <p className="av-day-editor__date">{fromYmd([...selectedDays][0]).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</p>
                                            </>
                                        ) : (
                                            <>
                                                <p className="av-day-editor__weekday">{selCount} días seleccionados</p>
                                                <p className="av-day-editor__date">
                                                    Se aplicará el mismo horario a todos{selOutsideMonth > 0 ? ` · ${selOutsideMonth} en otros meses` : ''}
                                                </p>
                                            </>
                                        )}
                                    </div>
                                    <button type="button" onClick={clearSelection} className="av-calendar__aside-close" aria-label="Cerrar">
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>

                                {mixed && (
                                    <p className="av-day-editor__hint av-day-editor__hint--warn">
                                        Los días seleccionados tienen horarios distintos. Lo que apliques los sustituirá a todos.
                                    </p>
                                )}

                                <div className="av-day-editor__section">
                                    <p className="av-day-editor__label">Estado {selCount > 1 ? 'de los días' : 'del día'}</p>
                                    <div className="av-day-editor__segment" role="group" aria-label="Estado del día">
                                        <button type="button"
                                            className={cn('av-day-editor__segment-btn', draft.isWorking && 'av-day-editor__segment-btn--active')}
                                            onClick={() => setDraft((p) => ({ ...p, isWorking: true, ranges: p.ranges.length === 0 ? [{ start: '09:00', end: '18:00' }] : p.ranges }))}>
                                            Disponible
                                        </button>
                                        <button type="button"
                                            className={cn('av-day-editor__segment-btn', !draft.isWorking && 'av-day-editor__segment-btn--active')}
                                            onClick={() => setDraft((p) => ({ ...p, isWorking: false }))}>
                                            Cerrado
                                        </button>
                                    </div>
                                    <p className="av-day-editor__hint">
                                        {draft.isWorking ? 'Aceptas reservas en las horas que definas abajo.' : `No aparecerás disponible ${selCount > 1 ? 'esos días' : 'ese día'}.`}
                                    </p>
                                </div>

                                {draft.isWorking ? (
                                    <div className="av-day-editor__section">
                                        <p className="av-day-editor__label">Horario</p>
                                        <RangeList variant="panel" ranges={draft.ranges} onChange={(ranges) => setDraft((p) => ({ ...p, ranges }))} />
                                        {draft.ranges.length === 0 ? (
                                            <p className="av-day-editor__hint av-day-editor__hint--warn">Añade al menos una franja horaria.</p>
                                        ) : null}
                                    </div>
                                ) : null}

                                {confirmBulk ? (
                                    <div className="av-day-editor__section rounded-xl border border-warning-border bg-warning-tint p-3">
                                        <p className="text-sm font-semibold text-warning">
                                            {draft.isWorking
                                                ? `Vas a aplicar este horario a ${selCount} días.`
                                                : `Vas a marcar como CERRADOS ${selCount} días.`}
                                        </p>
                                        <p className="mt-1 text-xs text-ink-muted">Son muchos días — revisa antes de continuar.</p>
                                        <div className="mt-2.5 flex gap-2">
                                            <button type="button" onClick={() => setConfirmBulk(false)}
                                                className="rounded-xl border border-line bg-white px-3 py-2 text-sm font-medium text-ink-muted hover:bg-surface-tinted">
                                                Cancelar
                                            </button>
                                            <button type="button" onClick={applyToSelection}
                                                className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
                                                Sí, aplicar a {selCount} días
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="av-day-editor__footer">
                                            <button type="button" onClick={resetSelection} className="av-day-editor__reset">Restablecer</button>
                                            <button type="button" onClick={applyToSelection} className="av-day-editor__save">
                                                Aplicar{selCount > 1 ? ` a ${selCount} días` : ''}
                                            </button>
                                        </div>
                                        <p className="av-day-editor__hint" style={{ marginTop: 8 }}>
                                            Los cambios no se guardan hasta que pulses <strong>Guardar cambios</strong>.
                                        </p>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="av-calendar__empty">
                                <div className="av-calendar__empty-grid" aria-hidden>
                                    {Array.from({ length: 9 }).map((_, i) => (
                                        <span key={i} className={i === 4 ? 'av-calendar__empty-cell av-calendar__empty-cell--active' : 'av-calendar__empty-cell'} />
                                    ))}
                                </div>
                                <p className="av-calendar__empty-title">Selecciona uno o varios días</p>
                                <p className="av-calendar__empty-text">
                                    Pulsa los días que quieras (o usa los atajos de arriba para una columna entera o todo el mes),
                                    aplícales el horario de una vez y guárdalos todos juntos.
                                </p>
                            </div>
                        )}
                        </div>
                    </aside>
                </div>
            )}

            {!embedded && pendingCount > 0 && (
                <div
                    className="av-calendar__savebar sticky bottom-0 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-warning-border bg-warning-tint px-3.5 py-2.5"
                    role="region"
                    aria-label="Cambios sin guardar"
                >
                    <span className="text-body font-semibold text-warning">
                        {pendingCount} día{pendingCount !== 1 ? 's' : ''} con cambios sin guardar
                    </span>
                    <div className="flex gap-2">
                        <button type="button" onClick={discardAll} disabled={saving}
                            className="inline-flex items-center gap-1 rounded-xl border border-line bg-white px-3 py-2 text-sm font-medium text-ink-muted hover:bg-surface-tinted disabled:opacity-50">
                            <Undo2 className="h-4 w-4" /> Descartar
                        </button>
                        <button type="button" onClick={saveAll} disabled={saving}
                            className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2 text-sm font-semibold text-white shadow-[0_3px_12px_hsl(var(--brand)/0.45)] transition-all hover:opacity-90 disabled:opacity-50 disabled:shadow-none disabled:saturate-[0.6]">
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {saving ? 'Guardando…' : 'Guardar cambios'}
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
});

export default AvailabilityCalendar;
