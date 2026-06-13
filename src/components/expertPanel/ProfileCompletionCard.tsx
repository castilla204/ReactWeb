import React from 'react';
import { CheckCircle2, Circle, EyeOff, ArrowRight } from 'lucide-react';
import { usePhoneStatus } from './PhoneStatusCard';
import { STRIPE_STATUS } from '../../constants/stripeStatus';

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
    // 🧾 Datos fiscales y de pagos: los recoge Stripe en el KYC (NIF/identidad fiscal + IBAN).
    // MISMA condición que el gate de visibilidad del backend: Approved+onboarding
    // completado, o PendingVerification (datos YA enviados, Stripe verificando).
    const stripeStatusName = String(pick('stripeStatus', 'StripeStatus') ?? '');
    const onboardingCompleted = Boolean(pick('onboardingCompleted', 'OnboardingCompleted'));
    const hasFiscalData =
        (stripeStatusName === STRIPE_STATUS.APPROVED && onboardingCompleted)
        || stripeStatusName === STRIPE_STATUS.PENDING_VERIFICATION;

    const items: Array<{ label: string; done: boolean; required: boolean }> = [
        { label: 'Datos fiscales y de pagos (Stripe)', done: hasFiscalData, required: true },
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
        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3.5">
                {/* Anillo de progreso */}
                <div className="relative shrink-0 w-14 h-14">
                    <svg viewBox="0 0 36 36" className="w-14 h-14 -rotate-90">
                        <circle cx="18" cy="18" r={R} fill="none" stroke="#f1f5f9" strokeWidth="3" />
                        <circle cx="18" cy="18" r={R} fill="none"
                            stroke={allRequiredDone ? '#3b82f6' : '#f59e0b'} strokeWidth="3" strokeLinecap="round"
                            strokeDasharray={`${(pct / 100) * C} ${C}`} className="transition-all duration-500" />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-700">{pct}%</span>
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold text-slate-900">Completa tu perfil</h3>
                    {!allRequiredDone ? (
                        <p className="text-xs text-amber-600 mt-1 flex items-center gap-1.5 font-medium">
                            <EyeOff className="w-3.5 h-3.5" />
                            No eres visible para clientes aún
                        </p>
                    ) : (
                        <p className="text-xs text-emerald-600 mt-1 font-medium">✓ Ya eres visible · falta disponibilidad</p>
                    )}
                </div>
            </div>

            <ul className="space-y-2.5">
                {items.map((item) => (
                    <li key={item.label} className="flex items-start gap-3 text-sm">
                        {item.done
                            ? <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                            : <Circle className="w-5 h-5 text-slate-300 shrink-0 mt-0.5" />}
                        <span className={item.done ? 'text-slate-400 flex-1' : 'text-slate-700 font-medium flex-1'}>
                            {item.label}
                        </span>
                        {item.required && !item.done && (
                            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">requerido</span>
                        )}
                    </li>
                ))}
            </ul>

            <button
                onClick={onEdit}
                className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-semibold transition-all shadow-sm hover:shadow-md"
            >
                Completar ahora <ArrowRight className="w-4 h-4" />
            </button>
        </div>
    );
}
