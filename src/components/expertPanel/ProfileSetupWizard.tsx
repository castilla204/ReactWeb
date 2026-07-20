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
import { useExpertVisibility } from '../../hooks/useExpertVisibility';
import { SileoSkeleton } from '../ui/sileo-skeleton';

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
    onEditProfile: (section?: 'photo' | 'description' | 'location') => void;
    onEditAvailability?: () => void;
    onOpenStripe: () => void;
    visibilityNote?: string | null;
    stripeNote?: string | null;
    stripeContext?: StripeStepContext;
    /** Nº de servicios publicados: sin servicios no hay nada que mostrar en búsquedas. */
    servicesCount?: number;
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
                <div>
                    <label htmlFor="expert-setup-phone" className="expert-setup-field-label">
                        Número de móvil
                    </label>
                    <div className="expert-setup-inline-form">
                        <Input
                            id="expert-setup-phone"
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+34 600 000 000"
                        />
                        <Button onClick={sendCode} disabled={busy || phone.trim().length < 9} className="expert-setup-btn expert-btn-brand shrink-0" size="sm">
                            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Enviar código'}
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="space-y-2">
                    <p className="expert-setup-card-body-text">Código enviado a {phone}</p>
                    <div>
                        <label htmlFor="expert-setup-code" className="expert-setup-field-label">
                            Código de verificación
                        </label>
                        <div className="expert-setup-inline-form">
                            <Input
                                id="expert-setup-code"
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
                    <div className="flex items-center gap-3 text-sm">
                        <button
                            type="button"
                            onClick={() => { setStep('phone'); setCode(''); setError(null); }}
                            disabled={busy}
                            className="font-medium text-ink-muted hover:text-ink-strong disabled:opacity-50"
                        >
                            Atrás
                        </button>
                        <button
                            type="button"
                            onClick={sendCode}
                            disabled={busy}
                            className="font-medium text-brand hover:text-brand-hover disabled:opacity-50"
                        >
                            Reenviar código
                        </button>
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

/**
 * Fiel al frame real (`.expert-setup` header + 6 filas planas). Evita que el
 * paso "Verificación móvil" cambie de pendiente→hecho tras el primer pintado
 * y arrastre la tarjeta activa a otro sitio sin que el usuario lo pidiera.
 */
function ProfileSetupWizardSkeleton() {
    return (
        <div className="expert-setup" aria-busy="true" aria-label="Cargando configuración del perfil">
            <header className="expert-setup-header">
                <div className="expert-setup-header-progress">
                    <div className="expert-setup-header-progress-meta">
                        <SileoSkeleton className="h-3 w-14" rounded="sm" />
                        <SileoSkeleton className="h-[19px] w-24" rounded="full" />
                    </div>
                    <div className="expert-setup-progress-track">
                        <SileoSkeleton className="h-full w-4/5" rounded="sm" />
                    </div>
                </div>
                <SileoSkeleton className="mt-1.5 h-4 w-3/5" rounded="sm" />
            </header>
            <div className="expert-setup-list">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="expert-setup-card">
                        <div className="expert-setup-card-head">
                            <SileoSkeleton className="h-[22px] w-[22px] shrink-0" rounded="full" shimmerDelayMs={i * 60} />
                            <div className="expert-setup-card-head-text">
                                <SileoSkeleton className="h-3.5 w-2/5" rounded="sm" shimmerDelayMs={i * 60} />
                                <SileoSkeleton className="mt-1.5 h-2.5 w-1/3" rounded="sm" shimmerDelayMs={i * 60} />
                            </div>
                            <SileoSkeleton className="h-4 w-14 shrink-0" rounded="full" shimmerDelayMs={i * 60} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
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
    servicesCount,
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

    // 🛡️ Veredicto de visibilidad del BACKEND, no del checklist. Los pasos solo
    // saben 5 condiciones; el gate real añade vacaciones y excluye UnderReview
    // (el paso fiscal se marca "hecho" porque no hay nada que hacer, pero el
    // perfil sigue oculto). Antes el header decía "Perfil visible" en esos casos
    // — y en esta pestaña no hay banner que lo corrija. Mientras carga, caemos
    // al cálculo local (requiredLeft) para no parpadear.
    const visibilityQuery = useExpertVisibility();
    const backendVisibility = visibilityQuery.data ?? null;
    const showAsVisible = backendVisibility ? backendVisibility.isVisible : isComplete;
    // Con los pasos hechos pero oculto por una razón externa al checklist,
    // decir POR QUÉ (si no, "Requisitos completados" + "Perfil oculto" confunde).
    const hiddenBeyondSteps = isComplete && backendVisibility !== null && !backendVisibility.isVisible;
    const hiddenBeyondStepsNote = !hiddenBeyondSteps || !backendVisibility
        ? null
        : !backendVisibility.notOnVacation
            ? 'Estás en modo vacaciones: desactívalo para volver a aparecer en búsquedas.'
            : !backendVisibility.stripeOk
                ? 'Stripe aún está revisando tu cuenta de pagos. Volverás a aparecer automáticamente cuando termine.'
                : 'Hay un dato pendiente de sincronizar. Se actualizará automáticamente en unos minutos.';

    // Re-consultar el veredicto cuando el experto completa un paso (verificar
    // móvil, subir foto…): el dato cacheado quedaría obsoleto justo cuando más
    // importa enseñar el cambio.
    useEffect(() => {
        void visibilityQuery.refetch();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [doneCount]);

    useEffect(() => {
        setActiveIndex(firstIncompleteStepIndex(steps));
    }, [steps.map((s) => s.done).join(',')]);

    const handlePrimary = (stepId: StepId) => {
        if (stepId === 'fiscal') onOpenStripe();
        else if (stepId === 'availability') (onEditAvailability ?? onEditProfile)();
        else if (stepId === 'photo' || stepId === 'description' || stepId === 'location') onEditProfile(stepId);
        else onEditProfile();
    };

    // El estado "hecho" del móvil depende de esta query; pintar antes de que
    // resuelva marcaría el paso como pendiente y luego lo saltaría a "hecho"
    // debajo del usuario, arrastrando la tarjeta activa a otro sitio.
    if (phoneStatus.isLoading) {
        return <ProfileSetupWizardSkeleton />;
    }

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
                                showAsVisible
                                    ? 'expert-setup-header-visibility--visible'
                                    : 'expert-setup-header-visibility--hidden'
                            }`}
                        >
                            <span className="expert-setup-visibility-dot" aria-hidden />
                            {showAsVisible ? 'Perfil visible' : 'Perfil oculto'}
                        </span>
                    </div>
                    <div
                        className="expert-setup-progress-track"
                        role="progressbar"
                        aria-valuenow={progress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                    >
                        <div
                            className="expert-setup-progress-fill"
                            style={{ transform: `scaleX(${progress / 100})` }}
                        />
                    </div>
                </div>

                <h2 className="expert-setup-header-title">
                    {requiredLeft > 0
                        ? `Faltan ${requiredLeft} requisito${requiredLeft === 1 ? '' : 's'} obligatorio${requiredLeft === 1 ? '' : 's'}`
                        : hiddenBeyondSteps
                            ? 'Requisitos completados'
                            : 'Perfil activo en búsquedas'}
                </h2>

                {visibilityNote && requiredLeft > 0 && (
                    <p className="expert-setup-header-note">{visibilityNote}</p>
                )}

                {hiddenBeyondStepsNote && (
                    <p className="expert-setup-header-note">{hiddenBeyondStepsNote}</p>
                )}

                {isComplete && !hiddenBeyondSteps && (
                    <p className="expert-setup-header-complete">
                        {servicesCount === 0
                            ? 'Último paso: crea tu primer servicio para que los clientes puedan encontrarte.'
                            : 'Tus servicios ya aparecen en las búsquedas de clientes.'}
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
    // Solo los required: exigir también los opcionales dejaba la pestaña
    // "Configuración" visible para siempre (y sin badge) a quien no
    // configurara la disponibilidad — estado normal tras el alta fast-path,
    // que no crea disponibilidad.
    const complete = steps.length > 0 && steps.filter((s) => s.required).every((s) => s.done);
    const pendingRequired = steps.filter((s) => s.required && !s.done).length;
    const progress = getSetupProgress(steps);
    return { steps, complete, pendingRequired, progress };
}
