import React from 'react';
import { CheckCircle2, Circle, EyeOff, ArrowRight } from 'lucide-react';
import { usePhoneStatus } from './PhoneStatusCard';

/**
 * 🧩 STRIPE-FIRST: checklist de "Completa tu perfil" en el panel del experto.
 *
 * Con el alta nueva (Stripe primero), el perfil se crea con placeholders y el
 * experto NO es visible en búsquedas hasta rellenar foto, descripción y ubicación
 * (gate en el backend). Esta tarjeta muestra el progreso y abre el editor.
 * Si ya está completo, no renderiza nada.
 */
interface ProfileLike {
    profilePictureUrl?: string | null;
    description?: string | null;
    latitude?: number | string | null;
    longitude?: number | string | null;
    currentAvailability?: unknown | null;
    [key: string]: unknown;
}

export function ProfileCompletionCard({ profile, onEdit }: { profile: ProfileLike | null | undefined; onEdit: () => void }) {
    const phoneStatus = usePhoneStatus(Boolean(profile));
    if (!profile) return null;
    const raw = profile as Record<string, unknown>;
    const pick = (a: string, b: string) => (raw[a] ?? raw[b]) as unknown;

    const hasPhoto = Boolean((pick('profilePictureUrl', 'ProfilePictureUrl') as string | null)?.trim());
    const hasDescription = String((pick('description', 'Description') as string | null) ?? '').trim().length >= 10;
    const hasLocation = Boolean(String((pick('latitude', 'Latitude') as string | null) ?? '').trim());
    const hasAvailability = Boolean(pick('currentAvailability', 'CurrentAvailability'));
    const hasMobile = Boolean(phoneStatus.data?.smsCapable);

    const items: Array<{ label: string; done: boolean; required: boolean }> = [
        { label: 'Foto de perfil', done: hasPhoto, required: true },
        { label: 'Descripción (mín. 10 caracteres)', done: hasDescription, required: true },
        { label: 'Ubicación de tu taller/zona', done: hasLocation, required: true },
        { label: 'Móvil verificado (avisos por SMS)', done: hasMobile, required: true },
        { label: 'Disponibilidad horaria', done: hasAvailability, required: false },
    ];

    const requiredDone = items.filter(i => i.required && i.done).length;
    const requiredTotal = items.filter(i => i.required).length;
    const allRequiredDone = requiredDone === requiredTotal;
    const totalDone = items.filter(i => i.done).length;

    // Perfil completo → no molestar.
    if (allRequiredDone && hasAvailability) return null;

    const pct = Math.round((totalDone / items.length) * 100);

    // 🎨 Minimalista: tarjeta blanca, anillo de progreso, lista limpia sin tachados.
    const R = 15.5;
    const C = 2 * Math.PI * R;

    return (
        <div className="rounded-2xl border border-[#e8e8e8] bg-white p-5 space-y-4 shadow-sm">
            <div className="flex items-center gap-3.5">
                {/* Anillo de progreso */}
                <div className="relative shrink-0 w-11 h-11">
                    <svg viewBox="0 0 36 36" className="w-11 h-11 -rotate-90">
                        <circle cx="18" cy="18" r={R} fill="none" stroke="#f1f5f9" strokeWidth="3" />
                        <circle cx="18" cy="18" r={R} fill="none"
                            stroke={allRequiredDone ? '#3b82f6' : '#f59e0b'} strokeWidth="3" strokeLinecap="round"
                            strokeDasharray={`${(pct / 100) * C} ${C}`} className="transition-all duration-500" />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-700">{pct}%</span>
                </div>
                <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-slate-900">Completa tu perfil</h3>
                    {!allRequiredDone ? (
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                            <EyeOff className="w-3 h-3 text-amber-500 shrink-0" />
                            Aún no eres visible para los clientes
                        </p>
                    ) : (
                        <p className="text-xs text-slate-500 mt-0.5">Ya eres visible · falta la disponibilidad horaria</p>
                    )}
                </div>
            </div>

            <ul className="space-y-2">
                {items.map((item) => (
                    <li key={item.label} className="flex items-center gap-2.5 text-[13px]">
                        {item.done
                            ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                            : <Circle className="w-4 h-4 text-slate-200 shrink-0" />}
                        <span className={item.done ? 'text-slate-400' : 'text-slate-700'}>
                            {item.label}
                        </span>
                        {item.required && !item.done && (
                            <span className="ml-auto text-[10px] font-medium text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-1.5 py-px">requerido</span>
                        )}
                    </li>
                ))}
            </ul>

            <button
                onClick={onEdit}
                className="w-full inline-flex items-center justify-center gap-1.5 h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-semibold transition-colors"
            >
                Completar ahora <ArrowRight className="w-3.5 h-3.5" />
            </button>
        </div>
    );
}
