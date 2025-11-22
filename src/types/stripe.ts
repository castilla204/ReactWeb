// Types for the Stripe API responses with DTOs

export type StripeStatus =
    | "NotRequested"
    | "Pending"
    | "ActionRequired"
    | "PendingVerification"
    | "RequirementsDue"
    | "RequirementsPastDue"
    | "RestrictedSoon"
    | "Restricted"
    | "Disabled"
    | "Approved"
    | "Rejected"
    | "Deauthorized";

// Disponibilidad horaria
export interface CurrentExpertAvailabilityDto {
    id: number;
    daysOfWeek: string[];        // ["Monday", "Tuesday", "Wednesday", ...]
    startTime: string;            // "09:00:00" (formato TimeSpan)
    endTime: string;              // "18:00:00" (formato TimeSpan)
    effectiveFrom: string;        // "2025-01-01T00:00:00Z" (ISO DateTime)
}

export interface ExpertAvailabilityDto {
    id: number;
    expertId: number;
    daysOfWeek: string[];
    startTime: string;
    endTime: string;
    effectiveFrom: string;
    effectiveTo: string | null;   // null = disponibilidad actual activa
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export const VALID_DAYS_OF_WEEK = [
    "Monday",
    "Tuesday", 
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday"
] as const;

export type DayOfWeek = typeof VALID_DAYS_OF_WEEK[number];

export const DAY_NAMES_ES: Record<DayOfWeek, string> = {
    'Monday': 'Lunes',
    'Tuesday': 'Martes',
    'Wednesday': 'Miércoles',
    'Thursday': 'Jueves',
    'Friday': 'Viernes',
    'Saturday': 'Sábado',
    'Sunday': 'Domingo'
};

// 1. GET /api/user/expert-profile response
export interface ExpertProfileResponse {
    id: number;
    profilePictureUrl: string;
    description: string;
    stripeAccountId: string | null;
    createdAt: string;
    latitude: string;
    longitude: string;
    stripeStatus: StripeStatus;
    stripeStatusDetails: string | null;
    onboardingCompleted: boolean;
    stripeFutureRequirements?: string | null;
    stripeFutureDueAt?: string | null;
    isOnVacation?: boolean;
    currentAvailability?: CurrentExpertAvailabilityDto | null;
}

// 2. POST /api/user/become-expert response
export interface BecomeExpertResponse {
    message: string;
    token: string;
    user: {
        id: number;
        name: string;
        email: string;
        phoneVerified: boolean;
        role: string;
        expertProfile: ExpertProfileResponse;
    };
}

// 3. PUT /api/user/expert-profile response
export interface UpdateExpertProfileResponse {
    message: string;
    expertProfile: ExpertProfileResponse;
}

// 4. GET /api/subscription/onboarding-status response
export interface OnboardingStatusResponse {
    hasStripeAccount: boolean;
    hasPendingOnboarding: boolean;
    onboardingCompleted: boolean;
    stripeAccountId: string | null;
    stripeStatus: StripeStatus;
    stripeStatusDetails: string | null;
    canAccessStripe: boolean;
    stripeFutureRequirements?: string | null;
    stripeFutureDueAt?: string | null;
}

// 5. GET /api/subscription/expert-status response
export interface ExpertStatusResponse {
    hasStripeAccount: boolean;
    hasPendingOnboarding: boolean;
    onboardingCompleted: boolean;
    stripeStatus: StripeStatus;
    stripeStatusDetails: string | null;
    stripeAccountId: string | null;
    canAccessStripe: boolean;
    canCreateServices: boolean;
    canReceivePayments: boolean;
    statusMessage: string;
    stripeFutureRequirements?: string | null;
    stripeFutureDueAt?: string | null;
    canRetryOnboarding: boolean;
    rejectionReason: string | null;
}

// 6. POST /api/subscription/sync-stripe-status response
export interface StripeSyncStatusResponse {
    hasStripeAccount: boolean;
    hasPendingOnboarding: boolean;
    onboardingCompleted: boolean;
    stripeStatus: StripeStatus;
    stripeStatusDetails: string | null;
    stripeAccountId: string | null;
    canAccessStripe: boolean;
    stripeFutureRequirements?: string | null;
    stripeFutureDueAt?: string | null;
    stripeAccountStatus: {
        chargesEnabled: boolean;
        payoutsEnabled: boolean;
        detailsSubmitted: boolean;
    };
}



