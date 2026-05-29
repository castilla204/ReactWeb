import { useState } from 'react';
import { getAuthToken } from '../lib/auth';
import { API_CONFIG } from '../config/api';

/**
 * 🛡️ Round 12 — D1 FIX: hook para abrir el Express Dashboard real de Stripe.
 *
 * Distinto de `useStripeAccountLink`:
 *  - `useStripeAccountLink` → llama a `create-account-link`, abre flujo KYC (onboarding).
 *  - `useStripeLoginLink`   → llama a `create-login-link`, abre Express Dashboard
 *                              (vista de payouts, balance, transactions, cuenta bancaria).
 *
 * Sólo funciona para expertos APPROVED + OnboardingCompleted. Si no, el backend
 * devuelve 400 con `currentStatus` para que el frontend redirija al onboarding.
 *
 * Doc Stripe: https://docs.stripe.com/api/account/create_login_link
 * Los LoginLinks son single-use y de corta duración — generar uno por click.
 */
export interface LoginLinkResponse {
    message: string;
    loginLinkUrl: string;
    isLoginLink: true;
}

export const useStripeLoginLink = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createLoginLink = async (): Promise<LoginLinkResponse> => {
        const token = getAuthToken();
        if (!token) {
            throw new Error('No authentication token found');
        }

        setIsLoading(true);
        setError(null);

        try {
            if (import.meta.env.DEV) {
                console.log('🔄 Creating Stripe Express Dashboard login link...');
            }

            const response = await fetch(
                `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.subscription.createLoginLink}`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.ok) {
                let errorMessage = `Failed to create login link: ${response.status} ${response.statusText}`;
                try {
                    const errorData = await response.json();
                    if (errorData.message) {
                        errorMessage = errorData.message;
                    } else if (errorData.error) {
                        errorMessage = errorData.error;
                    }
                } catch { /* ignore parse error */ }
                throw new Error(errorMessage);
            }

            const data: LoginLinkResponse = await response.json();
            return data;
        } catch (err: any) {
            const errorMessage = err.message || 'Error creating login link';
            setError(errorMessage);
            if (import.meta.env.DEV) {
                console.error('❌ Login link error:', err);
            }
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const openLoginLink = async () => {
        try {
            const response = await createLoginLink();
            if (response.loginLinkUrl) {
                // Abrir en nueva pestaña — UX típica del Express Dashboard, el experto puede
                // alternar entre nuestra app y el Dashboard sin perder estado.
                window.open(response.loginLinkUrl, '_blank', 'noopener,noreferrer');
            } else {
                throw new Error('No login link URL received from server');
            }
        } catch (error: any) {
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: {
                    type: 'error',
                    message: error.message || 'Error al abrir el Express Dashboard',
                },
            }));
        }
    };

    return {
        createLoginLink,
        openLoginLink,
        isLoading,
        error
    };
};
