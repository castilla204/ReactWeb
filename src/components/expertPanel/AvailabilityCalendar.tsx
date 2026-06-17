import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2, Save, Trash2, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { es } from 'date-fns/locale';
import { API_CONFIG } from '../../config/api';
import { getAuthToken } from '../../lib/auth';
import { Calendar } from '../ui/calendar';
import { cn } from '../../lib/utils';
import RangeList, { Range } from './RangeList';

interface ExceptionDto { date: string; isWorking: boolean; ranges: { start: string; end: string }[]; }
interface RuleDto { dayOfWeek: number; startLocal: string; endLocal: string; }

const pad = (n: number) => String(n).padStart(2, '0');
const toYmd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const startOfDay = (d: Date) => { const c = new Date(d); c.setHours(0, 0, 0, 0); return c; };

const authHeaders = (): Record<string, string> => {
    const t = getAuthToken();
    return t ? { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
};

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * 🗓️ Calendario mensual de disponibilidad del experto. Pinta cada fecha según el horario
 * semanal (reglas) + excepciones por fecha. Al pulsar una fecha futura, abre un panel para
 * cerrarla, abrirla u horas especiales (turnos partidos). Lee/escribe /api/ExpertAvailability/exceptions.
 *
 * Modelo mental que la UI deja explícito:
 *   "Tu horario semanal pinta el calendario. Pulsa un día para hacer una excepción."
 */
const AvailabilityCalendar: React.FC = () => {
    const today = useMemo(() => startOfDay(new Date()), []);
    const [month, setMonth] = useState<Date>(today);
    const [rules, setRules] = useState<RuleDto[]>([]);
    const [exceptions, setExceptions] = useState<Record<string, ExceptionDto>>({});
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<Date | null>(null);
    const [draft, setDraft] = useState<{ isWorking: boolean; ranges: Range[] }>({ isWorking: true, ranges: [] });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Días de la semana con horario semanal activo (para colorear lo recurrente).
    const enabledWeekdays = useMemo(() => new Set(rules.map((r) => r.dayOfWeek)), [rules]);

    const rangeFromTo = useCallback((m: Date) => {
        const from = new Date(m.getFullYear(), m.getMonth(), 1);
        const to = new Date(m.getFullYear(), m.getMonth() + 2, 0); // hasta fin del mes siguiente (cubre overscroll)
        return { from: toYmd(from), to: toYmd(to) };
    }, []);

    const load = useCallback(async (m: Date) => {
        setLoading(true);
        setError(null);
        try {
            const { from, to } = rangeFromTo(m);
            const [rRes, eRes] = await Promise.all([
                fetch(`${API_CONFIG.baseUrl}/api/ExpertAvailability/rules`, { headers: authHeaders() }),
                fetch(`${API_CONFIG.baseUrl}/api/ExpertAvailability/exceptions?from=${from}&to=${to}`, { headers: authHeaders() }),
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
    }, [rangeFromTo]);

    useEffect(() => { load(month); }, [month, load]);

    // ¿La fecha es laborable? (excepción manda; si no, el día de la semana del horario).
    const worksOn = useCallback((d: Date): boolean => {
        const ex = exceptions[toYmd(d)];
        if (ex) return ex.isWorking;
        return enabledWeekdays.has(d.getDay());
    }, [exceptions, enabledWeekdays]);

    // Horas que se atienden ese día (excepción manda; si no, las del horario semanal). Para mostrarlas.
    const hoursFor = useCallback((d: Date): Range[] => {
        const ex = exceptions[toYmd(d)];
        if (ex) return ex.isWorking ? ex.ranges.map((r) => ({ start: r.start.slice(0, 5), end: r.end.slice(0, 5) })) : [];
        if (!enabledWeekdays.has(d.getDay())) return [];
        return rules.filter((r) => r.dayOfWeek === d.getDay())
            .map((r) => ({ start: r.startLocal.slice(0, 5), end: r.endLocal.slice(0, 5) }));
    }, [exceptions, enabledWeekdays, rules]);

    const openEditor = (d: Date) => {
        if (startOfDay(d) < today) return; // pasado: solo lectura
        setError(null);
        setSelected(startOfDay(d));
        const ex = exceptions[toYmd(d)];
        if (ex) {
            setDraft({ isWorking: ex.isWorking, ranges: ex.ranges.map((r) => ({ ...r })) });
        } else {
            // Prefill con el horario semanal de ese día (si lo hay).
            const dow = d.getDay();
            const dayRules = rules.filter((r) => r.dayOfWeek === dow)
                .map((r) => ({ start: r.startLocal.slice(0, 5), end: r.endLocal.slice(0, 5) }));
            setDraft({ isWorking: enabledWeekdays.has(dow), ranges: dayRules.length ? dayRules : [{ start: '09:00', end: '18:00' }] });
        }
    };

    const saveException = async () => {
        if (!selected) return;
        setSaving(true);
        setError(null);
        try {
            if (draft.isWorking && draft.ranges.some((r) => !r.start || !r.end || r.end <= r.start)) {
                throw new Error('Revisa las horas: la hora de fin debe ser posterior a la de inicio.');
            }
            const res = await fetch(`${API_CONFIG.baseUrl}/api/ExpertAvailability/exceptions`, {
                method: 'PUT',
                headers: authHeaders(),
                body: JSON.stringify({ date: toYmd(selected), isWorking: draft.isWorking, ranges: draft.isWorking ? draft.ranges : [] }),
            });
            if (!res.ok) {
                const e = await res.json().catch(() => ({} as any));
                throw new Error(e.message || 'No se pudo guardar.');
            }
            await load(month);
            setSelected(null);
        } catch (err: any) {
            setError(err.message || 'No se pudo guardar.');
        } finally {
            setSaving(false);
        }
    };

    const removeException = async () => {
        if (!selected) return;
        setSaving(true);
        setError(null);
        try {
            const res = await fetch(`${API_CONFIG.baseUrl}/api/ExpertAvailability/exceptions/${toYmd(selected)}`, {
                method: 'DELETE', headers: authHeaders(),
            });
            if (!res.ok) throw new Error('No se pudo quitar la excepción.');
            await load(month);
            setSelected(null);
        } catch (err: any) {
            setError(err.message || 'No se pudo quitar la excepción.');
        } finally {
            setSaving(false);
        }
    };

    const goMonth = (delta: number) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));
    const atCurrentMonth = month.getFullYear() === today.getFullYear() && month.getMonth() === today.getMonth();

    // ── Celda de día ──────────────────────────────────────────────────────────
    // Lenguaje visual deliberado (no el verde/gris plano por defecto):
    //   · trabaja  → relleno azul-marca suave, número en azul oscuro (su propio tono).
    //   · cerrado  → neutro con trama diagonal sutil (textura = "no atiende", sin depender del color).
    //   · excepción → punto azul arriba a la derecha.
    //   · hoy      → anillo interior azul.  · seleccionado → relleno azul sólido.
    const todayYmd = toYmd(today);
    const DayButton = useMemo(() => {
        const Btn = ({ day, modifiers, className, ...props }: any) => {
            const d: Date = day.date;
            const ymd = toYmd(d);
            const past = startOfDay(d) < today;
            const works = worksOn(d);
            const hasException = !!exceptions[ymd];
            const isToday = ymd === todayYmd;
            const isSelected = !!modifiers?.selected;
            const label = capitalize(d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }));
            const aria = past
                ? `${label}, pasado`
                : `${label}, ${works ? 'trabajas' : 'cerrado'}${hasException ? ', con excepción' : ''}. Pulsa para editar`;
            return (
                <button
                    type="button"
                    {...props}
                    aria-label={aria}
                    title={past ? undefined : (works ? 'Trabajas este día — pulsa para ajustar' : 'Cerrado — pulsa para abrirlo')}
                    className={cn(
                        'group/cell relative flex h-full w-full items-center justify-center overflow-hidden rounded-lg text-sm tabular-nums transition-[transform,box-shadow,background-color] duration-150',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1',
                        isSelected && 'bg-brand font-bold text-white shadow-[0_2px_8px_hsl(var(--brand)/0.35)]',
                        !isSelected && past && 'cursor-default font-medium text-[#c2c2c2]',
                        !isSelected && !past && 'cursor-pointer font-semibold motion-safe:hover:-translate-y-px active:translate-y-0 active:scale-[0.97]',
                        !isSelected && !past && works && 'bg-brand/[0.10] text-[#0b3f73] hover:bg-brand/[0.16]',
                        !isSelected && !past && !works && 'av-closed-cell text-[#8b8b8b] hover:text-[#5f5f5f]',
                        !isSelected && !past && isToday && 'ring-2 ring-inset ring-brand/70',
                        className,
                    )}
                >
                    <span className="relative z-10">{d.getDate()}</span>
                    {hasException && !isSelected && (
                        <span
                            className={cn('absolute right-1 top-1 z-10 h-1.5 w-1.5 rounded-full ring-2 ring-white', past ? 'bg-[#c4c4c4]' : 'bg-brand')}
                            aria-hidden
                        />
                    )}
                </button>
            );
        };
        return Btn;
    }, [worksOn, exceptions, today, todayYmd]);

    const monthLabel = capitalize(month.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }));
    const selectedHours = selected ? hoursFor(selected) : [];

    return (
        <section className="overflow-hidden rounded-2xl border border-[#e7e9ee] bg-white shadow-[0_1px_2px_hsl(220_22%_14%/0.04)]">
            {error && (
                <p className="mx-4 mt-3 rounded-lg border border-[hsl(var(--ep-error-border))] bg-[hsl(var(--ep-error-bg))] px-3 py-2 text-[13px] font-medium text-[hsl(var(--ep-error))]">
                    {error}
                </p>
            )}

            {loading ? (
                <div className="flex items-center justify-center gap-2 py-12 text-[13px] text-[#7a7f88]">
                    <Loader2 className="h-4 w-4 animate-spin text-brand" /> Cargando calendario…
                </div>
            ) : (
                <div className="grid gap-0 md:grid-cols-[minmax(0,1fr)_300px]">
                    {/* ── Calendario ──────────────────────────────────────────── */}
                    <div className="border-b border-[#eef0f4] p-4 md:border-b-0 md:border-r">
                        {/* Cabecera de mes propia: navegación clara, mes en grande */}
                        <div className="mb-3 flex items-center justify-between">
                            <h4 className="text-base font-bold tracking-[-0.01em] text-[#171a1f]">{monthLabel}</h4>
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => goMonth(-1)}
                                    disabled={atCurrentMonth}
                                    aria-label="Mes anterior"
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#6a6f78] transition-colors hover:bg-[#f1f3f7] hover:text-[#171a1f] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
                                >
                                    <ChevronLeft className="h-[18px] w-[18px]" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => goMonth(1)}
                                    aria-label="Mes siguiente"
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#6a6f78] transition-colors hover:bg-[#f1f3f7] hover:text-[#171a1f]"
                                >
                                    <ChevronRight className="h-[18px] w-[18px]" />
                                </button>
                            </div>
                        </div>

                        <Calendar
                            mode="single"
                            locale={es}
                            month={month}
                            onMonthChange={setMonth}
                            showOutsideDays={false}
                            selected={selected ?? undefined}
                            onSelect={(d) => { if (d) openEditor(d); }}
                            components={{ DayButton }}
                            classNames={{
                                nav: 'hidden', // usamos nuestra cabecera de mes
                                month_caption: 'hidden',
                            }}
                            className="w-full p-0"
                        />

                        {/* Leyenda: conecta cada color con su significado */}
                        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#f0f2f6] pt-3 text-[11.5px] font-medium text-[#5a606b]">
                            <span className="inline-flex items-center gap-1.5">
                                <span className="h-3.5 w-3.5 rounded bg-brand/[0.16]" aria-hidden /> Trabajas
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <span className="av-closed-swatch h-3.5 w-3.5 rounded" aria-hidden /> Cerrado
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <span className="relative inline-block h-3.5 w-3.5 rounded bg-brand/[0.16]" aria-hidden>
                                    <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-brand ring-2 ring-white" />
                                </span>
                                Excepción tuya
                            </span>
                        </div>
                    </div>

                    {/* ── Panel lateral: detalle del día o ayuda ──────────────── */}
                    <div className="flex flex-col bg-[#fbfcfe] p-4">
                        {selected ? (
                            <>
                                <div className="mb-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-brand">Editar día</p>
                                    <p className="mt-0.5 text-[15px] font-bold leading-tight tracking-[-0.01em] text-[#171a1f]">
                                        {capitalize(selected.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }))}
                                    </p>
                                </div>

                                {/* Interruptor trabajo/cierre con descripción del efecto */}
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={draft.isWorking}
                                    onClick={() => setDraft((p) => ({
                                        ...p,
                                        isWorking: !p.isWorking,
                                        ranges: !p.isWorking && p.ranges.length === 0 ? [{ start: '09:00', end: '18:00' }] : p.ranges,
                                    }))}
                                    className={cn(
                                        'flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors',
                                        draft.isWorking ? 'border-brand/30 bg-brand/[0.06]' : 'border-[#e5e7ec] bg-white',
                                    )}
                                >
                                    <span className={cn('relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors', draft.isWorking ? 'bg-brand' : 'bg-[#cfd3da]')}>
                                        <span className={cn('inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform', draft.isWorking ? 'translate-x-4' : 'translate-x-0.5')} />
                                    </span>
                                    <span className="min-w-0">
                                        <span className="block text-[13px] font-semibold text-[#222]">
                                            {draft.isWorking ? 'Trabajo este día' : 'Cerrado este día'}
                                        </span>
                                        <span className="block text-[11.5px] leading-snug text-[#777c85]">
                                            {draft.isWorking ? 'Aceptas reservas en estas horas' : 'No aparecerás disponible'}
                                        </span>
                                    </span>
                                </button>

                                {draft.isWorking && (
                                    <div className="mt-3">
                                        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8a8f98]">Horas de este día</p>
                                        <RangeList ranges={draft.ranges} onChange={(ranges) => setDraft((p) => ({ ...p, ranges }))} />
                                    </div>
                                )}

                                <div className="mt-auto flex items-center justify-between gap-2 pt-4">
                                    <button
                                        type="button"
                                        onClick={removeException}
                                        disabled={saving}
                                        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[12px] font-medium text-[#777c85] transition-colors hover:bg-[hsl(var(--ep-error-bg))] hover:text-[hsl(var(--ep-error))] disabled:opacity-50"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" /> Restablecer
                                    </button>
                                    <button
                                        type="button"
                                        onClick={saveException}
                                        disabled={saving}
                                        className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-[13px] font-semibold text-white shadow-[0_2px_8px_hsl(var(--brand)/0.25)] transition-colors hover:bg-brand-hover disabled:opacity-50"
                                    >
                                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                        Guardar día
                                    </button>
                                </div>
                                {selected && draft.isWorking && selectedHours.length === 0 && (
                                    <p className="mt-2 text-[11.5px] text-[#9aa0a8]">Añade al menos una franja horaria.</p>
                                )}
                            </>
                        ) : (
                            // Estado vacío que enseña a usar el panel
                            <div className="flex flex-1 flex-col items-center justify-center py-6 text-center">
                                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/[0.10] text-brand">
                                    <Clock className="h-5 w-5" />
                                </span>
                                <p className="mt-3 text-[13.5px] font-semibold text-[#33373f]">Pulsa un día del calendario</p>
                                <p className="mt-1 max-w-[34ch] text-[12.5px] leading-relaxed text-[#7a7f88]">
                                    Verás aquí sus horas y podrás cerrarlo (vacaciones, festivo), abrir un día suelto o
                                    cambiar el horario solo ese día.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
};

export default AvailabilityCalendar;
