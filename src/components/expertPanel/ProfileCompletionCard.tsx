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

    return (
        <div className={`rounded-xl border p-4 space-y-3 ${allRequiredDone ? 'border-blue-200 bg-blue-50/60' : 'border-amber-300 bg-amber-50/70'}`}>
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h3 className="text-sm font-bold text-slate-900">Completa tu perfil</h3>
                    {!allRequiredDone ? (
                        <p className="text-xs text-amber-800 mt-0.5 flex items-center gap-1">
                            <EyeOff className="w-3.5 h-3.5" />
                            Aún <strong>no eres visible</strong> para los clientes. Rellena los datos marcados.
                        </p>
                    ) : (
                        <p className="text-xs text-blue-800 mt-0.5">Ya eres visible — te falta solo la disponibilidad horaria.</p>
                    )}
                </div>
                <span className="text-xs font-bold text-slate-700 shrink-0">{pct}%</span>
            </div>

            {/* Barra de progreso */}
            <div className="h-1.5 w-full rounded-full bg-white border border-slate-200 overflow-hidden">
                <div className={`h-full rounded-full transition-all ${allRequiredDone ? 'bg-blue-500' : 'bg-amber-500'}`} style={{ width: `${pct}%` }} />
            </div>

            <ul className="space-y-1">
                {items.map((item) => (
                    <li key={item.label} className="flex items-center gap-2 text-xs">
                        {item.done
                            ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            : <Circle className="w-3.5 h-3.5 text-slate-300 shrink-0" />}
                        <span className={item.done ? 'text-slate-500 line-through' : 'text-slate-800'}>
                            {item.label}{item.required && !item.done ? ' *' : ''}
                        </span>
                    </li>
                ))}
            </ul>

            <button
                onClick={onEdit}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
            >
                Completar ahora <ArrowRight className="w-3.5 h-3.5" />
            </button>
        </div>
    );
}
