import { STRIPE_STATUS } from '../constants/stripeStatus';

export type StripeStatusDisplay = {
    title: string;
    kicker: string;
    summary: string;
    reason?: string;
    nextSteps?: string;
};

const STATUS_KICKER: Record<string, string> = {
    [STRIPE_STATUS.APPROVED]: 'Activa',
    [STRIPE_STATUS.PENDING]: 'Pendiente',
    [STRIPE_STATUS.PENDING_VERIFICATION]: 'En revisión',
    [STRIPE_STATUS.UNDER_REVIEW]: 'En revisión',
    [STRIPE_STATUS.ACTION_REQUIRED]: 'Acción requerida',
    [STRIPE_STATUS.REQUIREMENTS_DUE]: 'Datos pendientes',
    [STRIPE_STATUS.REQUIREMENTS_PAST_DUE]: 'Datos vencidos',
    [STRIPE_STATUS.RESTRICTED_SOON]: 'Plazo próximo',
    [STRIPE_STATUS.RESTRICTED]: 'Restringida',
    [STRIPE_STATUS.DISABLED]: 'Deshabilitada',
    [STRIPE_STATUS.REJECTED]: 'Rechazada',
    [STRIPE_STATUS.DEAUTHORIZED]: 'Desconectada',
    [STRIPE_STATUS.NOT_REQUESTED]: 'Sin configurar',
};

const STATUS_TITLE: Record<string, string> = {
    [STRIPE_STATUS.APPROVED]: 'Cuenta de pagos activa',
    [STRIPE_STATUS.PENDING]: 'Completa la verificación',
    [STRIPE_STATUS.PENDING_VERIFICATION]: 'Stripe está revisando tu cuenta',
    [STRIPE_STATUS.UNDER_REVIEW]: 'Revisión manual en curso',
    [STRIPE_STATUS.ACTION_REQUIRED]: 'Faltan datos en Stripe',
    [STRIPE_STATUS.REQUIREMENTS_DUE]: 'Completa los requisitos de Stripe',
    [STRIPE_STATUS.REQUIREMENTS_PAST_DUE]: 'Requisitos vencidos',
    [STRIPE_STATUS.RESTRICTED_SOON]: 'Actualiza tu cuenta pronto',
    [STRIPE_STATUS.RESTRICTED]: 'Cobros restringidos',
    [STRIPE_STATUS.DISABLED]: 'Pagos deshabilitados',
    [STRIPE_STATUS.REJECTED]: 'Cuenta de pagos rechazada',
    [STRIPE_STATUS.DEAUTHORIZED]: 'Cuenta desconectada',
    [STRIPE_STATUS.NOT_REQUESTED]: 'Configura tu cuenta de pagos',
};

const REJECTION_REASON_LABELS: Record<string, string> = {
    'rejected.fraud': 'Stripe detectó un riesgo de seguridad en la solicitud.',
    'rejected.terms_of_service': 'Incumplimiento de los términos de servicio de Stripe.',
    'rejected.listed': 'Apareces en una lista de cumplimiento normativo.',
    'rejected.incomplete_verification': 'No se pudo verificar la identidad tras varios intentos.',
    'rejected.other': 'Stripe rechazó la solicitud sin más detalle.',
    'rejected.platform_fraud': 'Rechazo por sospecha de fraude desde Inspecciono.',
    'rejected.platform_terms_of_service': 'Rechazo por incumplimiento de nuestros términos.',
    'rejected.platform_other': 'Rechazo desde Inspecciono.',
    platform_paused: 'La verificación de pagos está pausada en la plataforma.',
    listed: 'Cuenta incluida en una lista restrictiva.',
};

export function humanizeRejectionReason(code: string): string {
    const trimmed = code.trim();
    if (REJECTION_REASON_LABELS[trimmed]) return REJECTION_REASON_LABELS[trimmed];
    const readable = trimmed
        .replace(/^rejected\.(platform_)?/i, '')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
    return readable || trimmed;
}

/** Extrae bloques estructurados del texto largo que devuelve el backend. */
function parseStructuredDetails(details: string): { reason?: string; nextSteps?: string; lead?: string } {
    const text = details.replace(/\s+/g, ' ').trim();
    if (!text) return {};

    const nextMatch = text.match(/Qué hacer:\s*(.+?)(?:\s*ID de cuenta:|$)/i);
    const reasonMatch = text.match(/Motivo(?: específico)?:\s*(.+?)(?:Qué hacer:|ID de cuenta:|$)/i);
    const leadMatch = text.match(/^(?:Cuenta rechazada\.?\s*)?(?:Tu solicitud[^.]*\.\s*)?/i);

    let lead = text;
    if (reasonMatch || nextMatch) {
        lead = text.split(/Motivo(?: específico)?:/i)[0]?.trim() ?? '';
        lead = lead.replace(/^Cuenta rechazada\.?\s*/i, '').trim();
    }

    const reason = reasonMatch?.[1]
        ?.replace(/^Motivo específico:\s*/i, '')
        .replace(/\.$/, '')
        .trim();

    const nextSteps = nextMatch?.[1]?.replace(/\.$/, '').trim();

    return {
        lead: lead || undefined,
        reason: reason && !/^platform_/i.test(reason) ? humanizeRejectionReason(reason) : reason ? humanizeRejectionReason(reason) : undefined,
        nextSteps,
    };
}

function isStructuredBackendBlob(text: string): boolean {
    return /Motivo(?: específico)?:|Qué hacer:|Cuenta rechazada/i.test(text);
}

function cleanSummary(text: string): string {
    return text
        .replace(/\n+/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/^Cuenta rechazada\.?\s*/i, '')
        .trim();
}

export function buildStripeStatusDisplay({
    stripeStatus,
    fallbackMessage,
    stripeStatusDetails,
    rejectionReason,
    canRetryOnboarding,
}: {
    stripeStatus: string;
    fallbackMessage: string;
    stripeStatusDetails?: string | null;
    rejectionReason?: string | null;
    canRetryOnboarding?: boolean;
}): StripeStatusDisplay {
    const kicker = STATUS_KICKER[stripeStatus] ?? 'Estado';
    const title = STATUS_TITLE[stripeStatus] ?? 'Estado de cuenta de pagos';

    const details = (stripeStatusDetails || '').trim();
    const parsed = details ? parseStructuredDetails(details) : {};

    let summary = cleanSummary(fallbackMessage);
    let reason = rejectionReason ? humanizeRejectionReason(rejectionReason) : parsed.reason;
    let nextSteps = parsed.nextSteps;

    if (stripeStatus === STRIPE_STATUS.REJECTED) {
        summary =
            parsed.lead && !isStructuredBackendBlob(parsed.lead)
                ? cleanSummary(parsed.lead)
                : 'Stripe no ha aprobado tu cuenta de pagos. No podrás cobrar encargos hasta resolverlo.';

        if (!reason && rejectionReason) {
            reason = humanizeRejectionReason(rejectionReason);
        }

        if (!nextSteps) {
            nextSteps =
                canRetryOnboarding === false
                    ? 'Escríbenos a info@inspecciono.io con tu ID de cuenta. Te indicamos los pasos para apelar o reactivar la verificación.'
                    : 'Puedes volver a iniciar la verificación desde el botón de abajo. Si el problema persiste, contacta con soporte de Stripe.';
        }
    } else if (isStructuredBackendBlob(details)) {
        summary = parsed.lead ? cleanSummary(parsed.lead) : cleanSummary(fallbackMessage);
    } else if (details && details.length < 220 && !summary.includes(details)) {
        summary = cleanSummary(details);
    }

    if (summary.length > 280) {
        summary = `${summary.slice(0, 277).trim()}…`;
    }

    return { title, kicker, summary, reason, nextSteps };
}
