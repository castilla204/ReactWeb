import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Smartphone, PhoneOff, Loader2, ShieldCheck, MessageSquareText } from 'lucide-react';
import { useApi } from '../../hooks/useApi';

/**
 * 📱 SMS-CENTRAL: estado del teléfono del usuario para avisos por SMS.
 *
 * OBLIGATORIO (gate en backend): el experto no es visible y el cliente no puede
 * contratar sin un MÓVIL verificado (los fijos no reciben SMS). Esta tarjeta
 * muestra el estado y el flujo OTP completo (cargar móvil → código → verificado).
 */
export interface PhoneStatus {
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

/** Hook compartido (panel experto + checkout): estado del teléfono del usuario. */
export function usePhoneStatus(enabled = true) {
    const { fetchApi } = useApi();
    return useQuery({
        queryKey: ['phone-status'],
        queryFn: async () => normalizeStatus(await fetchApi<Record<string, unknown>>('/api/User/phone-status')),
        staleTime: 60_000,
        enabled,
    });
}

export function PhoneStatusCard({ className = '', context = 'expert' }: { className?: string; context?: 'expert' | 'client' }) {
    const { fetchApi } = useApi();
    const queryClient = useQueryClient();
    const [editing, setEditing] = useState(false);
    const [phone, setPhone] = useState('');
    const [code, setCode] = useState('');
    const [step, setStep] = useState<'phone' | 'code'>('phone');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const statusQuery = usePhoneStatus();
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

    const consequence = context === 'expert'
        ? 'Es obligatorio para ser visible y recibir contrataciones.'
        : 'Es obligatorio para poder contratar.';

    return (
        <div className={`rounded-2xl border p-5 space-y-4 transition-all hover:shadow-md ${ok ? 'border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-white shadow-sm' : 'border-red-200 bg-gradient-to-br from-red-50/80 to-white shadow-sm'} ${className}`}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                    <div className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center shadow-sm ${ok ? 'bg-emerald-100' : 'bg-red-100'}`}>
                        {ok ? <ShieldCheck className="w-6 h-6 text-emerald-600" /> : <PhoneOff className="w-6 h-6 text-red-600" />}
                    </div>
                    <div className="flex-1">
                        <h3 className="text-base font-bold text-slate-900">Móvil verificado</h3>
                        {ok ? (
                            <p className="text-sm text-slate-600 mt-1">
                                <span className="font-medium">{status?.phoneNumber}</span> · Recibirás avisos importantes por SMS
                            </p>
                        ) : (
                            <p className="text-sm text-red-700 mt-1.5 leading-relaxed">
                                {isLandline
                                    ? <><strong>{status?.phoneNumber}</strong> es un fijo y no recibe SMS. {consequence}</>
                                    : status?.phoneNumber
                                        ? <>Tu teléfono no está verificado. {consequence}</>
                                        : <>No tienes móvil registrado. {consequence}</>}
                            </p>
                        )}
                    </div>
                </div>
                {ok && <Smartphone className="w-5 h-5 text-emerald-500 shrink-0 mt-1" />}
            </div>

            {!ok && !editing && (
                <button
                    onClick={() => { setEditing(true); setStep('phone'); setError(null); }}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-semibold transition-all shadow-sm hover:shadow-md"
                >
                    <MessageSquareText className="w-4 h-4" />
                    {isLandline ? 'Añadir un móvil y verificarlo' : 'Verificar mi móvil por SMS'}
                </button>
            )}

            {editing && (
                <div className="space-y-3 rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
                    {step === 'phone' ? (
                        <>
                            <label className="text-sm font-semibold text-slate-700">Tu número de móvil (con prefijo)</label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="+34 6XX XXX XXX"
                                className="w-full h-11 px-4 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                            <div className="flex gap-2">
                                <button onClick={sendCode} disabled={busy || phone.trim().length < 9}
                                    className="flex-1 h-10 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                                    {busy ? <Loader2 className="w-4 h-4 animate-spin inline" /> : 'Enviarme código por SMS'}
                                </button>
                                <button onClick={() => setEditing(false)} className="px-4 text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors">Cancelar</button>
                            </div>
                        </>
                    ) : (
                        <>
                            <p className="text-sm text-slate-600">Hemos enviado un código por SMS a <strong>{phone}</strong></p>
                            <input
                                type="text"
                                inputMode="numeric"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                placeholder="123456"
                                maxLength={8}
                                className="w-full h-12 px-4 rounded-lg border border-slate-300 bg-white tracking-[0.3em] text-center font-mono text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                            <div className="flex gap-2">
                                <button onClick={verifyCode} disabled={busy || code.trim().length < 4}
                                    className="flex-1 h-10 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                                    {busy ? <Loader2 className="w-4 h-4 animate-spin inline" /> : 'Confirmar código'}
                                </button>
                                <button onClick={() => { setStep('phone'); setError(null); }} className="px-4 text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors">Atrás</button>
                            </div>
                        </>
                    )}
                    {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
                </div>
            )}
        </div>
    );
}
