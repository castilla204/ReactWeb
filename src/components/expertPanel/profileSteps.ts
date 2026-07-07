import { STRIPE_STATUS } from '../../constants/stripeStatus';

export type StepId = 'fiscal' | 'photo' | 'description' | 'location' | 'mobile' | 'availability';

export interface ProfileStep {
    id: StepId;
    label: string;
    shortLabel: string;
    done: boolean;
    required: boolean;
}

interface ProfileLike {
    profilePictureUrl?: string | null;
    description?: string | null;
    latitude?: number | string | null;
    longitude?: number | string | null;
    currentAvailability?: unknown | null;
    stripeStatus?: string | number | null;
    onboardingCompleted?: boolean | null;
    stripeAccountId?: string | null;
    [key: string]: unknown;
}

export interface StripeStepContext {
    stripeStatus?: string | number | null;
    onboardingCompleted?: boolean | null;
    stripeAccountId?: string | null;
}

/** Backend enum StripeStatus es integer; expert-profile a veces devuelve 2 en vez de "Approved". */
const STRIPE_STATUS_BY_INT: Record<number, string> = {
    0: STRIPE_STATUS.NOT_REQUESTED,
    1: STRIPE_STATUS.PENDING,
    2: STRIPE_STATUS.APPROVED,
    3: STRIPE_STATUS.REJECTED,
    4: STRIPE_STATUS.DEAUTHORIZED,
    5: STRIPE_STATUS.ACTION_REQUIRED,
    6: STRIPE_STATUS.PENDING_VERIFICATION,
    7: STRIPE_STATUS.REQUIREMENTS_DUE,
    8: STRIPE_STATUS.REQUIREMENTS_PAST_DUE,
    9: STRIPE_STATUS.RESTRICTED_SOON,
    10: STRIPE_STATUS.RESTRICTED,
    11: STRIPE_STATUS.DISABLED,
    12: STRIPE_STATUS.UNDER_REVIEW,
};

export function normalizeStripeStatus(value: unknown): string {
    if (value === null || value === undefined || value === '') return '';
    if (typeof value === 'number' && Number.isFinite(value)) {
        return STRIPE_STATUS_BY_INT[value] ?? '';
    }
    const s = String(value).trim();
    if (/^\d+$/.test(s)) {
        const mapped = STRIPE_STATUS_BY_INT[Number(s)];
        if (mapped) return mapped;
    }
    // PascalCase del backend → constantes del frontend
    const direct = Object.values(STRIPE_STATUS).find(
        (v) => v.toLowerCase() === s.toLowerCase(),
    );
    return direct ?? s;
}

function pick(raw: Record<string, unknown>, a: string, b: string) {
    return (raw[a] ?? raw[b]) as unknown;
}

/**
 * Datos fiscales/pagos completados desde el lado del experto.
 * Alineado con UserController + gate de visibilidad, pero incluye estados
 * donde el experto ya envió todo y Stripe está revisando.
 */
export function isFiscalStepComplete(ctx: StripeStepContext): boolean {
    const status = normalizeStripeStatus(ctx.stripeStatus);
    const onboardingCompleted = Boolean(ctx.onboardingCompleted);
    const hasAccount = Boolean(String(ctx.stripeAccountId ?? '').trim());

    if (status === STRIPE_STATUS.APPROVED && onboardingCompleted) return true;
    if (status === STRIPE_STATUS.PENDING_VERIFICATION) return true;
    if (status === STRIPE_STATUS.UNDER_REVIEW) return true;
    // Onboarding Stripe terminado aunque falten requisitos puntuales posteriores
    if (hasAccount && onboardingCompleted && status !== STRIPE_STATUS.NOT_REQUESTED && status !== STRIPE_STATUS.PENDING) {
        return true;
    }
    return false;
}

export function buildProfileSteps(
    profile: ProfileLike,
    smsCapable: boolean,
    stripeCtx?: StripeStepContext,
): ProfileStep[] {
    const raw = profile as Record<string, unknown>;
    const hasPhoto = Boolean(String(pick(raw, 'profilePictureUrl', 'ProfilePictureUrl') ?? '').trim());
    const hasDescription = String(pick(raw, 'description', 'Description') ?? '').trim().length >= 10;
    const hasLocation = Boolean(String(pick(raw, 'latitude', 'Latitude') ?? '').trim());
    const hasAvailability = Boolean(pick(raw, 'currentAvailability', 'CurrentAvailability'));

    const mergedStripe: StripeStepContext = {
        stripeStatus: stripeCtx?.stripeStatus ?? pick(raw, 'stripeStatus', 'StripeStatus'),
        onboardingCompleted: stripeCtx?.onboardingCompleted ?? pick(raw, 'onboardingCompleted', 'OnboardingCompleted'),
        stripeAccountId: stripeCtx?.stripeAccountId ?? pick(raw, 'stripeAccountId', 'StripeAccountId'),
    };
    const hasFiscalData = isFiscalStepComplete(mergedStripe);

    return [
        { id: 'fiscal', label: 'Cuenta de pagos', shortLabel: 'Pagos', done: hasFiscalData, required: true },
        { id: 'photo', label: 'Foto de perfil', shortLabel: 'Foto', done: hasPhoto, required: true },
        { id: 'description', label: 'Descripción profesional', shortLabel: 'Descripción', done: hasDescription, required: true },
        { id: 'location', label: 'Zona de trabajo', shortLabel: 'Ubicación', done: hasLocation, required: true },
        { id: 'mobile', label: 'Verificación móvil', shortLabel: 'Móvil', done: smsCapable, required: true },
        { id: 'availability', label: 'Disponibilidad horaria', shortLabel: 'Horario', done: hasAvailability, required: false },
    ];
}

export function isProfileSetupComplete(
    profile: ProfileLike | null | undefined,
    smsCapable: boolean,
    stripeCtx?: StripeStepContext,
) {
    if (!profile) return true;
    const steps = buildProfileSteps(profile, smsCapable, stripeCtx);
    // Solo los pasos required cuentan: exigir también los opcionales dejaba la
    // pestaña "Configuración" colgada para siempre (sin badge, porque
    // pendingRequired=0) a todo experto que no configurara la disponibilidad.
    return steps.filter((s) => s.required).every((s) => s.done);
}

export function getPendingRequiredCount(steps: ProfileStep[]) {
    return steps.filter((s) => s.required && !s.done).length;
}

export function firstIncompleteStepIndex(steps: ProfileStep[]) {
    const requiredIdx = steps.findIndex((s) => s.required && !s.done);
    if (requiredIdx >= 0) return requiredIdx;
    const optionalIdx = steps.findIndex((s) => !s.done);
    return optionalIdx >= 0 ? optionalIdx : 0;
}

export function getSetupProgress(steps: ProfileStep[]) {
    if (!steps.length) return 0;
    return Math.round((steps.filter((s) => s.done).length / steps.length) * 100);
}
