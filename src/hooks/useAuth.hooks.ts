import { useMutation } from '@tanstack/react-query';
import { useApi } from './useApi';
import { API_CONFIG } from '../config/api';
import { AuthResponse, GoogleAuthRequest } from '../types/auth';

export const useAuth = () => {
    const { fetchApi } = useApi();

    const googleAuthMutation = useMutation({
        mutationFn: (data: GoogleAuthRequest) =>
            fetchApi<AuthResponse>(API_CONFIG.endpoints.auth.googleAuth, {
                method: 'POST',
                body: JSON.stringify(data),
                requiresAuth: false,
            }),
    });

    const sendVerificationMutation = useMutation({
        mutationFn: (phoneNumber: string) =>
            fetchApi(API_CONFIG.endpoints.auth.sendVerification, {
                method: 'POST',
                body: JSON.stringify({ phoneNumber }),
            }),
    });

    const verifyCodeMutation = useMutation({
        mutationFn: (data: { phoneNumber: string; code: string }) =>
            fetchApi(API_CONFIG.endpoints.auth.verifyCode, {
                method: 'POST',
                body: JSON.stringify(data),
            }),
    });

    return {
        googleAuth: googleAuthMutation,
        sendVerification: sendVerificationMutation,
        verifyCode: verifyCodeMutation,
    };
};