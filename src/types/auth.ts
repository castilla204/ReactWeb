export interface User {
    id: number;
    name: string;
    email: string;
    phoneVerified: boolean;
}

export interface AuthResponse {
    token: string;
    user: User;
}

export interface GoogleAuthRequest {
    accessToken: string;
    email: string;
    name: string;
    googleId: string;
}