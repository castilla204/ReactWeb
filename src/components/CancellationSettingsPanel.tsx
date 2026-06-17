import React, { useState, useEffect } from 'react';
import { CalendarClock, RefreshCw, AlertCircle, CheckCircle2, Loader2, Save } from 'lucide-react';
import { API_CONFIG } from '../config/api';
import { getAuthToken } from '../lib/auth';

interface CancellationSettings {
    tierHighHours: number;
    tierLowHours: number;
    freeCancellationsPerParty: number;
    penaltyFreeWindowDays: number;
}

const ENDPOINT = '/api/Admin/cancellation/settings';

/**
 * 🗓️ Fase D: política de cancelación escalonada, editable por el admin.
 * El reparto exacto (%) de cada tramo se edita en la pestaña "Configuración por Estado"
 * (estados appointment_cancelled_by_client_gt24h / _6to24h / _lt6h / _expert_strike).
 * Aquí se editan los UMBRALES de tiempo y el nº de cancelaciones sin penalización (N).
 */
const CancellationSettingsPanel: React.FC = () => {
    const [form, setForm] = useState<CancellationSettings>({
        tierHighHours: 24,
        tierLowHours: 6,
        freeCancellationsPerParty: 0,
        penaltyFreeWindowDays: 30,
    });
    const [loading, setLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const authHeaders = (): Record<string, string> => {
        const token = getAuthToken();
        if (!token) throw new Error('No se encontró token de autenticación');
        return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
    };

    const fetchSettings = async () => {
        try {
            setLoading(true);
            setError(null);
            setSuccess(null);
            const res = await fetch(`${API_CONFIG.baseUrl}${ENDPOINT}`, { method: 'GET', headers: authHeaders() });
            if (!res.ok) {
                const e = await res.json().catch(() => ({} as any));
                throw new Error(e.message || `Error ${res.status}: ${res.statusText}`);
            }
            const data: CancellationSettings = await res.json();
            setForm(data);
        } catch (err: any) {
            setError(err.message || 'Error al cargar la configuración de cancelaciones');
        } finally {
            setLoading(false);
        }
    };

    const save = async () => {
        try {
            setSaving(true);
            setError(null);
            setSuccess(null);
            if (form.tierHighHours <= form.tierLowHours) {
                throw new Error('Las horas del tramo alto deben ser MAYORES que las del tramo bajo');
            }
            if (form.penaltyFreeWindowDays < 1) {
                throw new Error('La ventana debe ser de al menos 1 día');
            }
            const res = await fetch(`${API_CONFIG.baseUrl}${ENDPOINT}`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify(form),
            });
            if (!res.ok) {
                const e = await res.json().catch(() => ({} as any));
                throw new Error(e.message || `Error ${res.status}: ${res.statusText}`);
            }
            const data: CancellationSettings = await res.json();
            setForm({
                tierHighHours: data.tierHighHours,
                tierLowHours: data.tierLowHours,
                freeCancellationsPerParty: data.freeCancellationsPerParty,
                penaltyFreeWindowDays: data.penaltyFreeWindowDays,
            });
            setSuccess('Política de cancelación guardada correctamente');
        } catch (err: any) {
            setError(err.message || 'Error al guardar la configuración');
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const num = (v: string) => Math.max(0, parseInt(v || '0', 10) || 0);

    const field = (
        label: string,
        value: number,
        onChange: (n: number) => void,
        hint: string,
    ) => (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <input
                type="number"
                min={0}
                value={value}
                onChange={(e) => onChange(num(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">{hint}</p>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <CalendarClock className="w-6 h-6 text-blue-600" />
                    <h2 className="text-xl font-semibold text-gray-900">Política de cancelación</h2>
                </div>
                <button
                    onClick={fetchSettings}
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Actualizar
                </button>
            </div>

            {error && (
                <div className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-md">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}
            {success && (
                <div className="flex items-start space-x-3 p-4 bg-green-50 border border-green-200 rounded-md">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-green-700">{success}</p>
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-600">Cargando configuración...</span>
                </div>
            ) : (
                <>
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {field('Umbral tramo alto (horas)', form.tierHighHours, (n) => setForm({ ...form, tierHighHours: n }),
                                'Cancelar con ≥ estas horas de antelación = tramo más favorable.')}
                            {field('Umbral tramo bajo (horas)', form.tierLowHours, (n) => setForm({ ...form, tierLowHours: n }),
                                'Por debajo de estas horas = tramo más estricto (no-show).')}
                            {field('Cancelaciones sin penalización (N)', form.freeCancellationsPerParty, (n) => setForm({ ...form, freeCancellationsPerParty: n }),
                                'Cancelaciones con reembolso íntegro por parte. 0 = máxima dureza.')}
                            {field('Ventana de cómputo de N (días)', form.penaltyFreeWindowDays, (n) => setForm({ ...form, penaltyFreeWindowDays: n }),
                                'Periodo móvil en el que se cuentan las N cancelaciones gratis del cliente.')}
                        </div>

                        <div className="mt-6 flex items-center justify-end">
                            <button
                                onClick={save}
                                disabled={saving}
                                className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                {saving ? 'Guardando...' : 'Guardar'}
                            </button>
                        </div>
                    </div>

                    {/* Vista previa de la matriz resultante */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Cómo queda el reparto</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="text-left text-gray-500 border-b">
                                        <th className="py-2 pr-4">Quién cancela</th>
                                        <th className="py-2 pr-4">Cuándo</th>
                                        <th className="py-2 pr-4">Cliente</th>
                                        <th className="py-2 pr-4">Experto</th>
                                    </tr>
                                </thead>
                                <tbody className="text-gray-800">
                                    <tr className="border-b">
                                        <td className="py-2 pr-4">Cliente</td>
                                        <td className="py-2 pr-4">≥ {form.tierHighHours}h {form.freeCancellationsPerParty > 0 ? `(con cupo de ${form.freeCancellationsPerParty})` : ''}</td>
                                        <td className="py-2 pr-4 text-green-700 font-medium">{form.freeCancellationsPerParty > 0 ? '100%' : '50%'}</td>
                                        <td className="py-2 pr-4">{form.freeCancellationsPerParty > 0 ? '0%' : '50%'}</td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="py-2 pr-4">Cliente</td>
                                        <td className="py-2 pr-4">{form.tierLowHours}h – {form.tierHighHours}h</td>
                                        <td className="py-2 pr-4">50%</td>
                                        <td className="py-2 pr-4">50%</td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="py-2 pr-4">Cliente</td>
                                        <td className="py-2 pr-4">&lt; {form.tierLowHours}h / no-show</td>
                                        <td className="py-2 pr-4 text-red-700 font-medium">0%</td>
                                        <td className="py-2 pr-4">100%</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 pr-4">Experto</td>
                                        <td className="py-2 pr-4">cualquier momento</td>
                                        <td className="py-2 pr-4 text-green-700 font-medium">100%</td>
                                        <td className="py-2 pr-4">0% + strike</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <p className="text-xs text-gray-500 mt-3">
                            Los porcentajes exactos de cada tramo se ajustan en la pestaña «Configuración por Estado»
                            (estados <code className="bg-gray-100 px-1 rounded">appointment_cancelled_by_client_gt24h / _6to24h / _lt6h / _expert_strike</code>).
                            Esta vista refleja los valores por defecto.
                        </p>
                    </div>
                </>
            )}
        </div>
    );
};

export default CancellationSettingsPanel;
