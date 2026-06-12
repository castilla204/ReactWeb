import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Smartphone, PhoneOff, Loader2, CheckCircle2 } from 'lucide-react';
import { useApi } from '../../hooks/useApi';

/**
 * 📱 SMS-CENTRAL: estado del teléfono del usuario para avisos por SMS.
 *
 * - Móvil verificado → "Recibirás avisos por SMS".
 * - FIJO (no recibe SMS) → aviso "no válido" + flujo para cargar un MÓVIL y
 *   verificarlo introduciendo el código recibido por SMS (Twilio Verify).
 * - Sin teléfono → mismo flujo de alta.
 */
interface PhoneStatus {
    phoneNumber: string | null;
    phoneVerified: boolean;
    phoneLineType: string | null;
    smsCapable: boolean;
}

function normalizeStatus(raw: Record<string, unknown>): PhoneStatus {
    return {
        phoneNumber: (raw.phoneNumber ?? raw.PhoneNumber ?? null) as string | null,
        phoneVerified: Boolean(raw.phoneVerified ?? raw.PhoneVerified ?? false),
        phoneLineType: (raw.phoneLineType ?? raw.PhoneLineType ?? null) as string | null,
        smsCapable: Boolean(raw.smsCapable ?? raw.SmsCapable ?? false),
    };
}

export function PhoneStatusCard({ className = '' }: { className?: string }) {
    const { fetchApi } = useApi();
    const queryClient = useQueryClient();
    const [editing, setEditing] = useState(false);
    const [phone, setPhone] = useState('');
    const [code, setCode] = useState('');
    const [step, setStep] = useState<'phone' | 'code'>('phone');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const statusQuery = useQuery({
        queryKey: ['phone-status'],
        queryFn: async () => normalizeStatus(await fetchApi<Record<string, unknown>>('/api/User/phone-status')),
        staleTime: 60_000,
    });

    const status = statusQuery.data;

    const sendCode = async () => {
        setBusy(true); setError(null);
        try {
            await fetchApi('/api/User/phone/send-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phoneNumber: phone.trim() }),
            });
            setStep('code');
        } catch (e: unknown) {
            setError((e as Error)?.message || 'No se pudo enviar el código.');
        } finally { setBusy(false); }
    };

    const verifyCode = async () => {
        setBusy(true); setError(null);
        try {
            await fetchApi('/api/User/phone/verify-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phoneNumber: phone.trim(), code: code.trim() }),
            });
            setEditing(false); setStep('phone'); setPhone(''); setCode('');
            void queryClient.invalidateQueries({ queryKey: ['phone-status'] });
        } catch (e: unknown) {
            setError((e as Error)?.message || 'Código incorrecto.');
        } finally { setBusy(false); }
    };

    if (statusQuery.isLoading) return null;

    const isLandline = status?.phoneLineType === 'landline';
    const ok = Boolean(status?.smsCapable);

    return (
        <div className={`rounded-md border p-2.5 text-xs space-y-1.5 ${ok ? 'border-emerald-200 bg-emerald-50/60' : 'border-amber-200 bg-amber-50/60'} ${className}`}>
            <div className="flex items-center gap-1.5 font-medium text-slate-800">
                {ok ? <Smartphone className="w-3.5 h-3.5 text-emerald-600" /> : <PhoneOff className="w-3.5 h-3.5 text-amber-600" />}
                Avisos por SMS
            </div>

            {ok ? (
                <p className="text-slate-600">
                    <CheckCircle2 className="w-3 h-3 inline mr-1 text-emerald-600" />
                    Móvil verificado{status?.phoneNumber ? ` (${status.phoneNumber})` : ''}. Recibirás avisos de contrataciones y citas por SMS.
                </p>
            ) : (
                <p className="text-amber-800">
                    {isLandline
                        ? `Tu número (${status?.phoneNumber ?? ''}) es un FIJO y no puede recibir SMS. Añade un móvil para no perderte contrataciones y citas.`
                        : status?.phoneNumber
                            ? 'Tu teléfono no está verificado para SMS. Verifícalo para recibir avisos importantes.'
                            : 'No tienes teléfono registrado. Añade un móvil para recibir avisos de contrataciones y citas por SMS.'}
                </p>
            )}

            {!ok && !editing && (
                <button
                    onClick={() => { setEditing(true); setStep('phone'); setError(null); }}
                    className="w-full px-2 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-md border border-amber-300 font-medium transition-colors"
                >
                    {isLandline ? 'Añadir un móvil' : 'Verificar móvil'}
                </button>
            )}

            {editing && (
                <div className="space-y-1.5">
                    {step === 'phone' ? (
                        <>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="+34 6XX XXX XXX"
                                className="w-full px-2 py-1.5 rounded-md border border-slate-300 bg-white"
                            />
                            <div className="flex gap-1.5">
                                <button onClick={sendCode} disabled={busy || phone.trim().length < 9}
                                    className="flex-1 px-2 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium disabled:opacity-50">
                                    {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin inline" /> : 'Enviar código'}
                                </button>
                                <button onClick={() => setEditing(false)} className="px-2 py-1.5 text-slate-500 hover:text-slate-700">Cancelar</button>
                            </div>
                        </>
                    ) : (
                        <>
                            <p className="text-slate-600">Introduce el código que has recibido por SMS en {phone}:</p>
                            <input
                                type="text"
                                inputMode="numeric"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                placeholder="123456"
                                maxLength={8}
                                className="w-full px-2 py-1.5 rounded-md border border-slate-300 bg-white tracking-widest text-center font-mono"
                            />
                            <div className="flex gap-1.5">
                                <button onClick={verifyCode} disabled={busy || code.trim().length < 4}
                                    className="flex-1 px-2 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium disabled:opacity-50">
                                    {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin inline" /> : 'Verificar'}
                                </button>
                                <button onClick={() => setStep('phone')} className="px-2 py-1.5 text-slate-500 hover:text-slate-700">Atrás</button>
                            </div>
                        </>
                    )}
                    {error && <p className="text-red-600">{error}</p>}
                </div>
            )}
        </div>
    );
}
