import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, Plus, Trash2, Save, CalendarClock } from 'lucide-react';
import { API_CONFIG } from '../../config/api';
import { getAuthToken } from '../../lib/auth';

interface Range { start: string; end: string; }
type RulesByDay = Record<number, Range[]>;

const DAYS: { id: number; label: string }[] = [
    { id: 1, label: 'Lunes' },
    { id: 2, label: 'Martes' },
    { id: 3, label: 'Miércoles' },
    { id: 4, label: 'Jueves' },
    { id: 5, label: 'Viernes' },
    { id: 6, label: 'Sábado' },
    { id: 0, label: 'Domingo' },
];

const URL = '/api/ExpertAvailability/rules';

/**
 * 🗓️ Fase E1: editor de horario por día (horas distintas por día + turnos partidos).
 * Autónomo: lee/escribe ExpertAvailabilityRule vía /api/ExpertAvailability/rules (la tabla
 * que usa el selector de huecos). No interfiere con el editor de rango único legacy de arriba.
 */
const AvailabilityRulesEditor: React.FC = () => {
    const [rules, setRules] = useState<RulesByDay>({});
    const [loading, setLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const authHeaders = (): Record<string, string> => {
        const t = getAuthToken();
        return t
            ? { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' }
            : { 'Content-Type': 'application/json' };
    };

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_CONFIG.baseUrl}${URL}`, { headers: authHeaders() });
            if (!res.ok) throw new Error();
            const data: any[] = await res.json();
            const grouped: RulesByDay = {};
            (data || []).forEach((r) => {
                const day = r.DayOfWeek ?? r.dayOfWeek;
                const start = String(r.StartLocal ?? r.startLocal ?? '').slice(0, 5);
                const end = String(r.EndLocal ?? r.endLocal ?? '').slice(0, 5);
                if (!grouped[day]) grouped[day] = [];
                grouped[day].push({ start, end });
            });
            setRules(grouped);
        } catch {
            setError('No se pudo cargar el horario por día.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const addRange = (day: number) =>
        setRules((p) => ({ ...p, [day]: [...(p[day] || []), { start: '09:00', end: '13:00' }] }));
    const removeRange = (day: number, i: number) =>
        setRules((p) => ({ ...p, [day]: (p[day] || []).filter((_, idx) => idx !== i) }));
    const updateRange = (day: number, i: number, key: 'start' | 'end', value: string) =>
        setRules((p) => ({ ...p, [day]: (p[day] || []).map((r, idx) => (idx === i ? { ...r, [key]: value } : r)) }));

    const save = async () => {
        setSaving(true);
        setError(null);
        setSuccess(null);
        try {
            const flat: { dayOfWeek: number; startLocal: string; endLocal: string }[] = [];
            for (const d of DAYS) {
                for (const r of rules[d.id] || []) {
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
            setSuccess('Horario por día guardado correctamente.');
        } catch (err: any) {
            setError(err.message || 'No se pudo guardar el horario.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="rounded-2xl border border-[#ececec] bg-white p-4">
            <div className="mb-1 flex items-center gap-2">
                <CalendarClock className="h-5 w-5 text-brand" />
                <h4 className="text-base font-semibold text-[#222]">Horario detallado por día</h4>
            </div>
            <p className="mb-4 text-xs text-[#888]">
                Horas distintas por día y turnos partidos. Es el horario que se usa para las reservas de cita.
            </p>

            {error && <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            {success && <p className="mb-3 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">{success}</p>}

            {loading ? (
                <div className="flex items-center justify-center py-6 text-sm text-[#888]">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando horario…
                </div>
            ) : (
                <>
                    <div className="space-y-3">
                        {DAYS.map((d) => {
                            const ranges = rules[d.id] || [];
                            return (
                                <div key={d.id} className="rounded-xl border border-[#f0f0f0] p-3">
                                    <div className="mb-2 flex items-center justify-between">
                                        <span className="text-sm font-medium text-[#333]">{d.label}</span>
                                        <button
                                            type="button"
                                            onClick={() => addRange(d.id)}
                                            className="inline-flex items-center gap-1 rounded-lg border border-brand/40 px-2 py-1 text-xs font-medium text-brand hover:bg-brand/5"
                                        >
                                            <Plus className="h-3.5 w-3.5" /> Añadir franja
                                        </button>
                                    </div>
                                    {ranges.length === 0 ? (
                                        <p className="text-xs text-[#aaa]">Sin franjas (día no disponible).</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {ranges.map((r, i) => (
                                                <div key={i} className="flex items-center gap-2">
                                                    <input
                                                        type="time"
                                                        value={r.start}
                                                        onChange={(e) => updateRange(d.id, i, 'start', e.target.value)}
                                                        className="rounded-lg border border-[#e3e3e3] px-2 py-1 text-sm"
                                                    />
                                                    <span className="text-[#999]">—</span>
                                                    <input
                                                        type="time"
                                                        value={r.end}
                                                        onChange={(e) => updateRange(d.id, i, 'end', e.target.value)}
                                                        className="rounded-lg border border-[#e3e3e3] px-2 py-1 text-sm"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeRange(d.id, i)}
                                                        className="rounded-lg p-1 text-red-500 hover:bg-red-50"
                                                        aria-label="Quitar franja"
                                                    >
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

                    <div className="mt-4 flex justify-end">
                        <button
                            type="button"
                            onClick={save}
                            disabled={saving}
                            className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {saving ? 'Guardando…' : 'Guardar horario por día'}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default AvailabilityRulesEditor;
