export interface User {
    id: number;
    name: string;
    email: string;
    phoneNumber?: string | null;
    phoneVerified: boolean;
    profilePictureUrl?: string;
    role?: string;
    isBlocked?: boolean;
    createdAt?: string;
    searchCount?: number;
    subscriptionPlan?: string;
}









