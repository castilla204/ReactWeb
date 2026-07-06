import React, { useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, Loader2, Pencil } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useApi } from '../../hooks/useApi';
import { usePhoneStatus } from './PhoneStatusCard';
import {
    buildProfileSteps,
    firstIncompleteStepIndex,
    getSetupProgress,
    type ProfileStep,
    type StepId,
    type StripeStepContext,
} from './profileSteps';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface ProfileLike {
    profilePictureUrl?: string | null;
    description?: string | null;
    latitude?: number | string | null;
    longitude?: number | string | null;
    currentAvailability?: unknown | null;
    stripeStatus?: string | null;
    onboardingCompleted?: boolean | null;
    [key: string]: unknown;
}

interface ProfileSetupWizardProps {
    profile: ProfileLike;
    onEditProfile: () => void;
    onEditAvailability?: () => void;
    onOpenStripe: () => void;
    visibilityNote?: string | null;
    stripeNote?: string | null;
    stripeContext?: StripeStepContext;
}

const STEP_META: Record<
    StepId,
    { title: string; body: string; action: string; editAction: string }
> = {
    fiscal: {
        title: 'Cuenta de pagos',
        body: 'Conecta Stripe para cobrar y cumplir requisitos fiscales.',
        action: 'Abrir panel de Stripe',
        editAction: 'Revisar cuenta Stripe',
    },
    photo: {
        title: 'Foto de perfil',
        body: 'Los clientes confían más cuando ven quién ofrece el servicio. Usa una foto clara y profesional.',
        action: 'Subir foto de perfil',
        editAction: 'Cambiar foto',
    },
    description: {
        title: 'Descripción profesional',
        body: 'Explica tu especialidad y experiencia. Necesitas al menos 10 caracteres.',
        action: 'Escribir descripción',
        editAction: 'Editar descripción',
    },
    location: {
        title: 'Zona de trabajo',
        body: 'Marca en el mapa dónde atiendes. Sin ubicación no apareces en búsquedas cercanas.',
        action: 'Elegir ubicación en el mapa',
        editAction: 'Actualizar ubicación',
    },
    mobile: {
        title: 'Verificación móvil',
        body: 'Confirma un número móvil. Los avisos de citas y plazos se envían por SMS.',
        action: 'Verificar móvil',
        editAction: 'Cambiar móvil',
    },
    availability: {
        title: 'Disponibilidad horaria',
        body: 'Opcional: indica cuándo puedes atender. Puedes cambiarlo después.',
        action: 'Definir horario',
        editAction: 'Editar horario',
    },
};

function pick(raw: Record<string, unknown>, a: string, b: string) {
    return (raw[a] ?? raw[b]) as unknown;
}

function getStepSnapshot(stepId: StepId, profile: ProfileLike, smsCapable: boolean, phoneNumber?: string): string {
    const raw = profile as Record<string, unknown>;
    switch (stepId) {
        case 'fiscal':
            return profile.onboardingCompleted ? 'Stripe conectado' : 'Sin conectar';
        case 'photo': {
            const url = String(pick(raw, 'profilePictureUrl', 'ProfilePictureUrl') ?? '').trim();
            return url ? 'Foto añadida' : 'Sin foto';
        }
        case 'description': {
            const text = String(pick(raw, 'description', 'Description') ?? '').trim();
            if (text.length >= 10) return text.length > 56 ? `${text.slice(0, 56)}…` : text;
            return 'Sin descripción';
        }
        case 'location':
            return pick(raw, 'latitude', 'Latitude') ? 'Zona definida' : 'Sin ubicación';
        case 'mobile':
            return smsCapable && phoneNumber ? phoneNumber : smsCapable ? 'Verificado' : 'Sin verificar';
        case 'availability':
            return pick(raw, 'currentAvailability', 'CurrentAvailability') ? 'Horario definido' : 'Sin configurar';
        default:
            return '';
    }
}

function MobileVerificationPanel({ onVerified }: { onVerified: () => void }) {
    const { fetchApi } = useApi();
    const queryClient = useQueryClient();
    const statusQuery = usePhoneStatus();
    const status = statusQuery.data;

    const [phone, setPhone] = useState('');
    const [code, setCode] = useState('');
    const [step, setStep] = useState<'phone' | 'code'>('phone');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isLandline = status?.phoneLineType === 'landline';

    const sendCode = async () => {
        setBusy(true);
        setError(null);
        try {
            await fetchApi('/api/User/phone/send-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phoneNumber: phone.trim() }),
            });
            setStep('code');
        } catch (e: unknown) {
            setError((e as Error)?.message || 'No se pudo enviar el código.');
        } finally {
            setBusy(false);
        }
    };

    const verifyCode = async () => {
        setBusy(true);
        setError(null);
        try {
            await fetchApi('/api/User/phone/verify-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phoneNumber: phone.trim(), code: code.trim() }),
            });
            setStep('phone');
            setPhone('');
            setCode('');
            await queryClient.invalidateQueries({ queryKey: ['phone-status'] });
            onVerified();
        } catch (e: unknown) {
            setError((e as Error)?.message || 'Código incorrecto.');
        } finally {
            setBusy(false);
        }
    };

    if (statusQuery.isLoading) {
        return (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Comprobando teléfono…
            </div>
        );
    }

    if (status?.smsCapable) {
        return (
            <p className="expert-setup-card-done-msg">
                Verificado: <span className="font-medium">{status.phoneNumber}</span>
            </p>
        );
    }

    return (
        <div className="expert-setup-mobile-form">
            <p className="expert-setup-card-body-text">
                {isLandline
                    ? `${status?.phoneNumber} es un fijo. Añade un móvil para recibir SMS.`
                    : status?.phoneNumber
                        ? 'Confirma tu móvil con un código SMS.'
                        : 'Introduce tu número móvil con prefijo internacional.'}
            </p>

            {step === 'phone' ? (
                <div className="expert-setup-inline-form">
                    <Input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+34 600 000 000"
                    />
                    <Button onClick={sendCode} disabled={busy || phone.trim().length < 9} className="expert-setup-btn expert-btn-brand shrink-0" size="sm">
                        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Enviar código'}
                    </Button>
                </div>
            ) : (
                <div className="space-y-2">
                    <p className="expert-setup-card-body-text">Código enviado a {phone}</p>
                    <div className="expert-setup-inline-form">
                        <Input
                            type="text"
                            inputMode="numeric"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="000000"
                            maxLength={8}
                            className="expert-setup-code-input"
                        />
                        <Button onClick={verifyCode} disabled={busy || code.trim().length < 4} className="expert-setup-btn expert-btn-brand shrink-0" size="sm">
                            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Confirmar'}
                        </Button>
                    </div>
                </div>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
    );
}

function StepCard({
    step,
    index,
    isActive,
    snapshot,
    stripeNote,
    onSelect,
    onPrimary,
    onVerified,
}: {
    step: ProfileStep;
    index: number;
    isActive: boolean;
    snapshot: string;
    stripeNote?: string | null;
    onSelect: () => void;
    onPrimary: () => void;
    onVerified: () => void;
}) {
    const meta = STEP_META[step.id];
    const statusLabel = step.done ? 'Hecho' : step.required ? 'Pendiente' : 'Opcional';

    return (
        <article
            className={`expert-setup-card ${isActive ? 'expert-setup-card--active' : ''} ${step.done ? 'expert-setup-card--done' : ''}`}
        >
            <button type="button" className="expert-setup-card-head" onClick={onSelect} aria-expanded={isActive}>
                <span className={`expert-setup-card-num ${step.done ? 'expert-setup-card-num--done' : isActive ? 'expert-setup-card-num--active' : ''}`}>
                    {step.done ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : index + 1}
                </span>
                <span className="expert-setup-card-head-text">
                    <span className="expert-setup-card-title">{meta.title}</span>
                    <span className="expert-setup-card-snapshot">{snapshot}</span>
                </span>
                <span
                    className={`expert-setup-card-status ${step.done ? 'expert-setup-card-status--done' : step.required ? 'expert-setup-card-status--pending' : 'expert-setup-card-status--optional'}`}
                >
                    {statusLabel}
                </span>
                <ChevronDown
                    className={`expert-setup-card-chevron ${isActive ? 'expert-setup-card-chevron--open' : ''}`}
                    aria-hidden
                />
            </button>

            {isActive && (
                <div className="expert-setup-card-body">
                    <div className="expert-setup-card-panel">
                        <p className="expert-setup-card-body-text">{meta.body}</p>

                        {stripeNote && step.id === 'fiscal' && !step.done && (
                            <p className="expert-setup-card-note">{stripeNote}</p>
                        )}

                        {step.id === 'mobile' ? (
                            <MobileVerificationPanel onVerified={onVerified} />
                        ) : (
                            <div className="expert-setup-card-actions">
                                <Button
                                    size="sm"
                                    className={`expert-setup-btn ${step.done ? 'expert-btn-outline' : 'expert-btn-brand'}`}
                                    onClick={onPrimary}
                                >
                                    {step.done ? (
                                        <>
                                            <Pencil className="mr-1.5 h-3.5 w-3.5" />
                                            {meta.editAction}
                                        </>
                                    ) : (
                                        meta.action
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </article>
    );
}

export function ProfileSetupWizard({
    profile,
    onEditProfile,
    onEditAvailability,
    onOpenStripe,
    visibilityNote,
    stripeNote,
    stripeContext,
}: ProfileSetupWizardProps) {
    const phoneStatus = usePhoneStatus(true);
    const smsCapable = Boolean(phoneStatus.data?.smsCapable);

    const steps = useMemo(
        () => buildProfileSteps(profile, smsCapable, stripeContext),
        [profile, smsCapable, stripeContext?.stripeStatus, stripeContext?.onboardingCompleted, stripeContext?.stripeAccountId],
    );
    const progress = getSetupProgress(steps);
    const doneCount = steps.filter((s) => s.done).length;
    const requiredLeft = steps.filter((s) => s.required && !s.done).length;
    const [activeIndex, setActiveIndex] = useState(() => firstIncompleteStepIndex(steps));

    const isComplete = requiredLeft === 0;

    useEffect(() => {
        setActiveIndex(firstIncompleteStepIndex(steps));
    }, [steps.map((s) => s.done).join(',')]);

    const handlePrimary = (stepId: StepId) => {
        if (stepId === 'fiscal') onOpenStripe();
        else if (stepId === 'availability') (onEditAvailability ?? onEditProfile)();
        else onEditProfile();
    };

    return (
        <div className="expert-setup">
            <header className="expert-setup-header">
                <div className="expert-setup-header-progress">
                    <div className="expert-setup-header-progress-meta">
                        <span className="expert-setup-header-count">
                            {doneCount} de {steps.length}
                        </span>
                        <span
                            className={`expert-setup-header-visibility ${
                                requiredLeft > 0
                                    ? 'expert-setup-header-visibility--hidden'
                                    : 'expert-setup-header-visibility--visible'
                            }`}
                        >
                            <span className="expert-setup-visibility-dot" aria-hidden />
                            {requiredLeft > 0 ? 'Perfil oculto' : 'Perfil visible'}
                        </span>
                    </div>
                    <div
                        className="expert-setup-progress-track"
                        role="progressbar"
                        aria-valuenow={progress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                    >
                        <div className="expert-setup-progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                </div>

                <h2 className="expert-setup-header-title">
                    {requiredLeft > 0
                        ? `Faltan ${requiredLeft} requisito${requiredLeft === 1 ? '' : 's'} obligatorio${requiredLeft === 1 ? '' : 's'}`
                        : 'Perfil activo en búsquedas'}
                </h2>

                {visibilityNote && requiredLeft > 0 && (
                    <p className="expert-setup-header-note">{visibilityNote}</p>
                )}

                {isComplete && (
                    <p className="expert-setup-header-complete">
                        Tus servicios ya aparecen en las búsquedas de clientes.
                    </p>
                )}
            </header>

            <div className="expert-setup-list" role="list">
                {steps.map((step, index) => (
                    <StepCard
                        key={step.id}
                        step={step}
                        index={index}
                        isActive={index === activeIndex}
                        snapshot={getStepSnapshot(step.id, profile, smsCapable, phoneStatus.data?.phoneNumber)}
                        stripeNote={stripeNote}
                        onSelect={() => setActiveIndex(index)}
                        onPrimary={() => handlePrimary(step.id)}
                        onVerified={() => {
                            const next = firstIncompleteStepIndex(
                                steps.map((s, i) => (i === activeIndex ? { ...s, done: true } : s)),
                            );
                            if (next !== activeIndex) setActiveIndex(next);
                        }}
                    />
                ))}
            </div>
        </div>
    );
}

export function useProfileSetupState(
    profile: ProfileLike | null | undefined,
    smsCapable: boolean,
    stripeContext?: StripeStepContext,
) {
    const steps = useMemo(
        () => (profile ? buildProfileSteps(profile, smsCapable, stripeContext) : []),
        [profile, smsCapable, stripeContext?.stripeStatus, stripeContext?.onboardingCompleted, stripeContext?.stripeAccountId],
    );
    const complete = steps.length > 0 && steps.every((s) => s.done);
    const pendingRequired = steps.filter((s) => s.required && !s.done).length;
    const progress = getSetupProgress(steps);
    return { steps, complete, pendingRequired, progress };
}
