import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2, Plus, Trash2, Save, CalendarClock, Copy, Info, ChevronDown } from 'lucide-react';
import { API_CONFIG } from '../../config/api';
import { getAuthToken } from '../../lib/auth';
import { cn } from '../../lib/utils';

interface Range { start: string; end: string; }
interface DayState { enabled: boolean; ranges: Range[]; }
type WeekState = Record<number, DayState>;

// Orden de presentación: lunes primero. id = DayOfWeek del backend (0=domingo … 6=sábado).
const DAYS: { id: number; label: string; short: string }[] = [
    { id: 1, label: 'Lunes', short: 'L' },
    { id: 2, label: 'Martes', short: 'M' },
    { id: 3, label: 'Miércoles', short: 'X' },
    { id: 4, label: 'Jueves', short: 'J' },
    { id: 5, label: 'Viernes', short: 'V' },
    { id: 6, label: 'Sábado', short: 'S' },
    { id: 0, label: 'Domingo', short: 'D' },
];

const DAY_NAME_TO_ID: Record<string, number> = {
    sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6,
};

const DEFAULT_START = '09:00';
const DEFAULT_END = '18:00';
const URL = '/api/ExpertAvailability/rules';
const CURRENT_URL = '/api/ExpertAvailability/current';

const emptyWeek = (): WeekState => {
    const w: WeekState = {};
    for (const d of DAYS) w[d.id] = { enabled: false, ranges: [] };
    return w;
};

// Estado inicial por defecto: TODOS los días activados a jornada estándar (el experto solo ajusta/guarda).
const defaultWeek = (): WeekState => {
    const w: WeekState = {};
    for (const d of DAYS) w[d.id] = { enabled: true, ranges: [{ start: DEFAULT_START, end: DEFAULT_END }] };
    return w;
};

const hhmm = (v: unknown): string => String(v ?? '').slice(0, 5);

/**
 * 🗓️ Editor semanal de horario del experto (fuente de verdad de las reservas de cita).
 * Pensado para "configúralo una vez": presets, interruptor por día, turnos partidos y
 * "copiar a todos los días". Lee/escribe ExpertAvailabilityRule vía /api/ExpertAvailability/rules.
 * Si aún no hay reglas, precarga el horario clásico del perfil para que el experto solo confirme.
 */
interface Props { collapsible?: boolean; defaultOpen?: boolean; }

const AvailabilityRulesEditor: React.FC<Props> = ({ collapsible = false, defaultOpen = false }) => {
    const [open, setOpen] = useState<boolean>(collapsible ? defaultOpen : true);
    const [week, setWeek] = useState<WeekState>(emptyWeek());
    const [loading, setLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [prefilledFromLegacy, setPrefilledFromLegacy] = useState<boolean>(false);

    const authHeaders = (): Record<string, string> => {
        const t = getAuthToken();
        return t
            ? { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' }
            : { 'Content-Type': 'application/json' };
    };

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        setPrefilledFromLegacy(false);
        try {
            const res = await fetch(`${API_CONFIG.baseUrl}${URL}`, { headers: authHeaders() });
            if (!res.ok) throw new Error();
            const data: any[] = await res.json();

            const next = emptyWeek();
            (data || []).forEach((r) => {
                const day = r.DayOfWeek ?? r.dayOfWeek;
                const start = hhmm(r.StartLocal ?? r.startLocal);
                const end = hhmm(r.EndLocal ?? r.endLocal);
                if (next[day]) {
                    next[day].enabled = true;
                    next[day].ranges.push({ start, end });
                }
            });

            // Sin reglas todavía → precargar el horario clásico del perfil (legacy) para que el
            // experto vea su horario actual y solo tenga que pulsar Guardar para activarlo en reservas.
            const hasRules = Object.values(next).some((d) => d.ranges.length > 0);
            if (!hasRules) {
                try {
                    const legacyRes = await fetch(`${API_CONFIG.baseUrl}${CURRENT_URL}`, { headers: authHeaders() });
                    if (legacyRes.ok) {
                        const legacy = await legacyRes.json();
                        const days: string[] = legacy?.daysOfWeek ?? legacy?.DaysOfWeek ?? [];
                        const start = hhmm(legacy?.startTime ?? legacy?.StartTime);
                        const end = hhmm(legacy?.endTime ?? legacy?.EndTime);
                        if (days.length > 0 && start && end && start !== '00:00' && end !== '00:00') {
                            days.forEach((name) => {
                                const id = DAY_NAME_TO_ID[String(name).toLowerCase()];
                                if (id !== undefined && next[id]) {
                                    next[id].enabled = true;
                                    next[id].ranges = [{ start, end }];
                                }
                            });
                            if (days.length > 0) setPrefilledFromLegacy(true);
                        }
                    }
                } catch { /* sin legacy: se queda vacío */ }
            }

            const stillEmpty = Object.values(next).every((d) => d.ranges.length === 0);
            setWeek(stillEmpty ? defaultWeek() : next);
        } catch {
            setError('No se pudo cargar tu horario.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const summary = useMemo(() => {
        const enabled = DAYS.filter((d) => week[d.id]?.enabled);
        if (enabled.length === 0) return 'Ningún día activo';
        const labels = enabled.map((d) => d.short).join(' ');
        const first = enabled[0] && week[enabled[0].id].ranges[0];
        const sameRange = first && enabled.every((d) => {
            const r = week[d.id].ranges;
            return r.length === 1 && r[0].start === first.start && r[0].end === first.end;
        });
        return sameRange ? `${labels} · ${first.start}–${first.end}` : `${enabled.length} días configurados`;
    }, [week]);

    const clearMessages = () => { setSuccess(null); setError(null); };

    // ── Mutaciones por día ──────────────────────────────────────────────
    const toggleDay = (id: number) => {
        clearMessages();
        setWeek((p) => {
            const d = p[id];
            const enabling = !d.enabled;
            return {
                ...p,
                [id]: {
                    enabled: enabling,
                    // Al activar un día sin franjas, proponer una jornada estándar.
                    ranges: enabling && d.ranges.length === 0 ? [{ start: DEFAULT_START, end: DEFAULT_END }] : d.ranges,
                },
            };
        });
    };

    const addRange = (id: number) => {
        clearMessages();
        setWeek((p) => ({ ...p, [id]: { enabled: true, ranges: [...p[id].ranges, { start: DEFAULT_START, end: DEFAULT_END }] } }));
    };

    const removeRange = (id: number, i: number) => {
        clearMessages();
        setWeek((p) => {
            const ranges = p[id].ranges.filter((_, idx) => idx !== i);
            return { ...p, [id]: { enabled: ranges.length > 0, ranges } };
        });
    };

    const updateRange = (id: number, i: number, key: 'start' | 'end', value: string) => {
        clearMessages();
        setWeek((p) => ({
            ...p,
            [id]: { ...p[id], ranges: p[id].ranges.map((r, idx) => (idx === i ? { ...r, [key]: value } : r)) },
        }));
    };

    const copyToAll = (id: number) => {
        clearMessages();
        setWeek((p) => {
            const source = p[id].ranges.map((r) => ({ ...r }));
            const next: WeekState = {};
            for (const d of DAYS) next[d.id] = { enabled: true, ranges: source.map((r) => ({ ...r })) };
            return next;
        });
        setSuccess(`Horario de ${DAYS.find((d) => d.id === id)?.label} aplicado a todos los días. Recuerda guardar.`);
    };

    // ── Presets ─────────────────────────────────────────────────────────
    const applyPreset = (targetIds: number[]) => {
        clearMessages();
        setWeek((p) => {
            const next: WeekState = {};
            for (const d of DAYS) {
                const isTarget = targetIds.includes(d.id);
                const existing = p[d.id]?.ranges ?? [];
                next[d.id] = {
                    enabled: isTarget,
                    // Conservar franjas ya definidas; si el día objetivo no tenía, jornada estándar.
                    ranges: isTarget ? (existing.length > 0 ? existing : [{ start: DEFAULT_START, end: DEFAULT_END }]) : existing,
                };
            }
            return next;
        });
    };

    const presetEveryDay = () => applyPreset([1, 2, 3, 4, 5, 6, 0]);
    const presetWeekdays = () => applyPreset([1, 2, 3, 4, 5]);
    const presetWeekend = () => applyPreset([6, 0]);
    const presetClear = () => { clearMessages(); setWeek(emptyWeek()); };

    // ── Guardar ─────────────────────────────────────────────────────────
    const save = async () => {
        setSaving(true);
        setError(null);
        setSuccess(null);
        try {
            const flat: { dayOfWeek: number; startLocal: string; endLocal: string }[] = [];
            for (const d of DAYS) {
                const day = week[d.id];
                if (!day.enabled) continue;
                for (const r of day.ranges) {
                    if (!r.start || !r.end || r.end <= r.start) {
                        throw new Error(`Revisa las horas de ${d.label}: la hora de fin debe ser posterior a la de inicio.`);
                    }
                    flat.push({ dayOfWeek: d.id, startLocal: r.start, endLocal: r.end });
                }
            }
            const res = await fetch(`${API_CONFIG.baseUrl}${URL}`, {
                method: 'PUT',
                headers: authHeaders(),
                body: JSON.stringify({ rules: flat }),
            });
            if (!res.ok) {
                const e = await res.json().catch(() => ({} as any));
                throw new Error(e.message || 'No se pudo guardar el horario.');
            }
            setPrefilledFromLegacy(false);
            setSuccess(
                flat.length === 0
                    ? 'Horario guardado: no atiendes ningún día (no aparecerás disponible para reservas).'
                    : 'Horario guardado. Tus clientes ya pueden reservar en estas horas.'
            );
        } catch (err: any) {
            setError(err.message || 'No se pudo guardar el horario.');
        } finally {
            setSaving(false);
        }
    };

    const anyEnabled = Object.values(week).some((d) => d.enabled);

    return (
        <section className="overflow-hidden rounded-2xl border border-[#e7e9ee] bg-white shadow-[0_1px_2px_hsl(220_22%_14%/0.04)]">
            {collapsible ? (
                <button
                    type="button"
                    onClick={() => setOpen((o) => !o)}
                    aria-expanded={open}
                    className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[#fafbfd]"
                >
                    <span className="min-w-0 flex-1">
                        <span className="block text-[15px] font-bold leading-tight tracking-[-0.01em] text-[#171a1f]">
                            Tu horario semanal
                        </span>
                        <span className="mt-0.5 block text-[13px] leading-snug text-[#5a606b]">
                            Se repite cada semana. Define cuándo tus clientes pueden reservar.
                        </span>
                    </span>
                    <span className="hidden shrink-0 rounded-full bg-[#f1f3f7] px-2.5 py-1 text-[12px] font-semibold tabular-nums text-[#5a606b] sm:inline">{summary}</span>
                    <ChevronDown className={cn('h-[18px] w-[18px] shrink-0 text-[#8a8f98] transition-transform', open && 'rotate-180')} />
                </button>
            ) : (
                <header className="flex items-start gap-3 border-b border-[#eef0f4] bg-[#f7f9fc] px-4 py-3.5">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/[0.12] text-brand">
                        <CalendarClock className="h-[18px] w-[18px]" />
                    </span>
                    <div className="min-w-0">
                        <h3 className="text-[15px] font-bold leading-tight tracking-[-0.01em] text-[#171a1f]">Tu horario semanal</h3>
                        <p className="mt-0.5 text-[13px] leading-snug text-[#5a606b]">
                            Se repite cada semana y define cuándo tus clientes pueden reservar. Configúralo una vez.
                        </p>
                    </div>
                </header>
            )}

            {open && (
            <div className={collapsible ? 'border-t border-[#eef0f4] p-4' : 'p-4'}>
            {prefilledFromLegacy && (
                <p className="mb-3 flex items-start gap-2 rounded-lg border border-[hsl(var(--ep-info-border))] bg-[hsl(var(--ep-info-bg))] px-3 py-2 text-[13px] text-[hsl(var(--ep-info))]">
                    <Info className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>Hemos cargado tu horario actual. Revísalo y pulsa <strong>Guardar horario</strong> para activarlo en las reservas.</span>
                </p>
            )}
            {error && <p className="mb-3 rounded-lg border border-[hsl(var(--ep-error-border))] bg-[hsl(var(--ep-error-bg))] px-3 py-2 text-[13px] font-medium text-[hsl(var(--ep-error))]">{error}</p>}
            {success && <p className="mb-3 rounded-lg border border-[hsl(var(--ep-success-border))] bg-[hsl(var(--ep-success-bg))] px-3 py-2 text-[13px] font-medium text-[hsl(var(--ep-success))]">{success}</p>}

            {loading ? (
                <div className="flex items-center justify-center gap-2 py-10 text-[13px] text-[#7a7f88]">
                    <Loader2 className="h-4 w-4 animate-spin text-brand" /> Cargando horario…
                </div>
            ) : (
                <>
                    {/* Presets rápidos */}
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                        <span className="mr-0.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8a8f98]">Plantilla</span>
                        <button type="button" onClick={presetEveryDay}
                            className="rounded-full border border-[#e3e6ec] px-3 py-1 text-[12px] font-medium text-[#44484f] transition-colors hover:border-brand/50 hover:bg-brand/[0.04] hover:text-brand">
                            Todos los días
                        </button>
                        <button type="button" onClick={presetWeekdays}
                            className="rounded-full border border-[#e3e6ec] px-3 py-1 text-[12px] font-medium text-[#44484f] transition-colors hover:border-brand/50 hover:bg-brand/[0.04] hover:text-brand">
                            Lunes a viernes
                        </button>
                        <button type="button" onClick={presetWeekend}
                            className="rounded-full border border-[#e3e6ec] px-3 py-1 text-[12px] font-medium text-[#44484f] transition-colors hover:border-brand/50 hover:bg-brand/[0.04] hover:text-brand">
                            Fines de semana
                        </button>
                        <button type="button" onClick={presetClear}
                            className="rounded-full border border-[#e3e6ec] px-3 py-1 text-[12px] font-medium text-[#8a8f98] transition-colors hover:border-[hsl(var(--ep-error-border))] hover:text-[hsl(var(--ep-error))]">
                            Limpiar
                        </button>
                    </div>

                    {/* Lista limpia: una fila por día separada por hairlines (sin caja por día). */}
                    <div className="divide-y divide-[#f0f2f6]">
                        {DAYS.map((d) => {
                            const day = week[d.id];
                            return (
                                <div key={d.id} className="py-3 first:pt-0 last:pb-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <button
                                            type="button"
                                            role="switch"
                                            aria-checked={day.enabled}
                                            aria-label={`${d.label}: ${day.enabled ? 'trabajas' : 'cerrado'}`}
                                            onClick={() => toggleDay(d.id)}
                                            className="flex min-w-0 items-center gap-3"
                                        >
                                            <span
                                                className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${day.enabled ? 'bg-brand' : 'bg-[#cfd3da]'}`}
                                            >
                                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${day.enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                                            </span>
                                            <span className={`w-[5.5rem] truncate text-left text-[14px] font-semibold ${day.enabled ? 'text-[#171a1f]' : 'text-[#9aa0a8]'}`}>{d.label}</span>
                                        </button>

                                        {day.enabled ? (
                                            <div className="flex items-center gap-1.5">
                                                <button type="button" onClick={() => copyToAll(d.id)}
                                                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[12px] font-medium text-[#777c85] transition-colors hover:bg-[#f1f3f7] hover:text-brand"
                                                    title="Copiar este horario a todos los días">
                                                    <Copy className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Copiar a todos</span>
                                                </button>
                                                <button type="button" onClick={() => addRange(d.id)}
                                                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[12px] font-medium text-brand transition-colors hover:bg-brand/[0.08]">
                                                    <Plus className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Franja</span>
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-[12.5px] font-medium text-[#b4b8bf]">Cerrado</span>
                                        )}
                                    </div>

                                    {day.enabled && (
                                        <div className="mt-2.5 space-y-2 pl-[48px]">
                                            {day.ranges.map((r, i) => (
                                                <div key={i} className="flex items-center gap-2">
                                                    <input type="time" value={r.start}
                                                        onChange={(e) => updateRange(d.id, i, 'start', e.target.value)}
                                                        className="rounded-lg border border-[#e3e6ec] bg-white px-2.5 py-1.5 text-[13px] tabular-nums focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25" />
                                                    <span className="text-[#b4b8bf]">—</span>
                                                    <input type="time" value={r.end}
                                                        onChange={(e) => updateRange(d.id, i, 'end', e.target.value)}
                                                        className="rounded-lg border border-[#e3e6ec] bg-white px-2.5 py-1.5 text-[13px] tabular-nums focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25" />
                                                    <button type="button" onClick={() => removeRange(d.id, i)}
                                                        className="rounded-lg p-1.5 text-[#aeb3bb] transition-colors hover:bg-[hsl(var(--ep-error-bg))] hover:text-[hsl(var(--ep-error))]" aria-label="Quitar franja">
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {!anyEnabled && (
                        <p className="mt-3 text-[12.5px] text-[#9aa0a8]">
                            No tienes ningún día activo. Usa una plantilla de arriba o activa los días en los que atiendes.
                        </p>
                    )}

                    <div className="mt-4 flex items-center justify-end gap-3">
                        <span className="hidden text-[12px] text-[#9aa0a8] sm:inline">Recuerda guardar para que tenga efecto</span>
                        <button type="button" onClick={save} disabled={saving}
                            className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2 text-[13px] font-semibold text-white shadow-[0_2px_8px_hsl(var(--brand)/0.25)] transition-colors hover:bg-brand-hover disabled:opacity-50">
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {saving ? 'Guardando…' : 'Guardar horario'}
                        </button>
                    </div>
                </>
            )}
            </div>
            )}
        </section>
    );
};

export default AvailabilityRulesEditor;
