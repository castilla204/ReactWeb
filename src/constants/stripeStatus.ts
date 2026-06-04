// Estados de Stripe alineados con backend 2025
export const STRIPE_STATUS = {
    NOT_REQUESTED: 'NotRequested',
    PENDING: 'Pending',
    ACTION_REQUIRED: 'ActionRequired',
    PENDING_VERIFICATION: 'PendingVerification',
    REQUIREMENTS_DUE: 'RequirementsDue',
    REQUIREMENTS_PAST_DUE: 'RequirementsPastDue',
    RESTRICTED_SOON: 'RestrictedSoon',
    RESTRICTED: 'Restricted',
    DISABLED: 'Disabled',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    DEAUTHORIZED: 'Deauthorized',
    // 🛡️ LOTE C-16: revisión manual del equipo Stripe (separado de PendingVerification).
    UNDER_REVIEW: 'UnderReview'
} as const;
