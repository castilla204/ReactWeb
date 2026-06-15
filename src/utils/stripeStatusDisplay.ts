import { STRIPE_STATUS } from '../constants/stripeStatus';
import i18n from '../i18n';

export type StripeStatusDisplay = {
    title: string;
    kicker: string;
    summary: string;
    reason?: string;
    nextSteps?: string;
};

// 🌐 i18n: mapeamos status → SEGMENTO de clave (no al texto), y resolvemos con i18n.t() DENTRO de
// buildStripeStatusDisplay (que se llama en render) para no congelar el idioma al evaluar el módulo.
const STATUS_KEY: Record<string, string> = {
    [STRIPE_STATUS.APPROVED]: 'approved',
    [STRIPE_STATUS.PENDING]: 'pending',
    [STRIPE_STATUS.PENDING_VERIFICATION]: 'pendingVerification',
    [STRIPE_STATUS.UNDER_REVIEW]: 'underReview',
    [STRIPE_STATUS.ACTION_REQUIRED]: 'actionRequired',
    [STRIPE_STATUS.REQUIREMENTS_DUE]: 'requirementsDue',
    [STRIPE_STATUS.REQUIREMENTS_PAST_DUE]: 'requirementsPastDue',
    [STRIPE_STATUS.RESTRICTED_SOON]: 'restrictedSoon',
    [STRIPE_STATUS.RESTRICTED]: 'restricted',
    [STRIPE_STATUS.DISABLED]: 'disabled',
    [STRIPE_STATUS.REJECTED]: 'rejected',
    [STRIPE_STATUS.DEAUTHORIZED]: 'deauthorized',
    [STRIPE_STATUS.NOT_REQUESTED]: 'notRequested',
};

// Código crudo de disabled_reason → segmento bajo stripe.rejectionReasons.
const REJECTION_REASON_KEY: Record<string, string> = {
    'rejected.fraud': 'fraud',
    'rejected.terms_of_service': 'termsOfService',
    'rejected.listed': 'listed',
    'rejected.incomplete_verification': 'incompleteVerification',
    'rejected.other': 'other',
    'rejected.platform_fraud': 'platformFraud',
    'rejected.platform_terms_of_service': 'platformTermsOfService',
    'rejected.platform_other': 'platformOther',
    platform_paused: 'platformPaused',
    listed: 'listedShort',
};

export function humanizeRejectionReason(code: string): string {
    const trimmed = code.trim();
    const key = REJECTION_REASON_KEY[trimmed];
    if (key) return i18n.t(`stripe.rejectionReasons.${key}`);
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
    const statusKey = STATUS_KEY[stripeStatus] ?? 'unknown';
    const kicker = i18n.t(`stripe.status.${statusKey}.kicker`);
    const title = i18n.t(`stripe.status.${statusKey}.title`);

    const details = (stripeStatusDetails || '').trim();
    const parsed = details ? parseStructuredDetails(details) : {};

    let summary = cleanSummary(fallbackMessage);
    let reason = rejectionReason ? humanizeRejectionReason(rejectionReason) : parsed.reason;
    let nextSteps = parsed.nextSteps;

    if (stripeStatus === STRIPE_STATUS.REJECTED) {
        summary =
            parsed.lead && !isStructuredBackendBlob(parsed.lead)
                ? cleanSummary(parsed.lead)
                : i18n.t('stripe.status.rejected.summary');

        if (!reason && rejectionReason) {
            reason = humanizeRejectionReason(rejectionReason);
        }

        if (!nextSteps) {
            nextSteps =
                canRetryOnboarding === false
                    ? i18n.t('stripe.status.rejected.nextStepsContact')
                    : i18n.t('stripe.status.rejected.nextStepsRetry');
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
