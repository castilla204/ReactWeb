// Types for the new Stripe API responses with DTOs

export type StripeStatus = "NotRequested" | "Pending" | "Approved" | "Rejected" | "Deauthorized";

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
    stripeAccountStatus: {
        chargesEnabled: boolean;
        payoutsEnabled: boolean;
        detailsSubmitted: boolean;
    };
}
