import { useState } from 'react';
import { getAuthToken } from '../lib/auth';
import { API_CONFIG } from '../config/api';

export interface AccountLinkResponse {
    message: string;
    accountLinkUrl: string;
}

export const useStripeAccountLink = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createAccountLink = async (): Promise<AccountLinkResponse> => {
        const token = getAuthToken();
        if (!token) {
            throw new Error('No authentication token found');
        }

        setIsLoading(true);
        setError(null);

        try {
            console.log('🔄 Creating Stripe account link...');
            const startTime = Date.now();

            const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.subscription.createAccountLink}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const duration = Date.now() - startTime;
            console.log(`⏱️ Account link response time: ${duration}ms`);

            if (!response.ok) {
                console.error(`❌ Account link failed: ${response.status} ${response.statusText}`);
                
                let errorMessage = `Failed to create account link: ${response.status} ${response.statusText}`;
                try {
                    const errorData = await response.json();
                    console.error('Error response data:', errorData);
                    if (errorData.message) {
                        errorMessage = errorData.message;
                    } else if (errorData.error) {
                        errorMessage = errorData.error;
                    }
                } catch (parseError) {
                    console.error('Could not parse error response:', parseError);
                }
                
                throw new Error(errorMessage);
            }

            const data: AccountLinkResponse = await response.json();
            console.log('✅ Account link created successfully:', data);
            return data;
        } catch (err: any) {
            const errorMessage = err.message || 'Error creating account link';
            setError(errorMessage);
            console.error('❌ Account link error:', err);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const openAccountLink = async () => {
        try {
            const response = await createAccountLink();
            if (response.accountLinkUrl) {
                // Redirigir al experto al enlace de Stripe Connect
                window.location.href = response.accountLinkUrl;
            } else {
                throw new Error('No account link URL received from server');
            }
        } catch (error: any) {
            console.error('Error opening account link:', error);
            
            // Mostrar notificación de error
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: {
                    type: 'error',
                    message: error.message || 'Error al abrir el enlace de actualización',
                },
            }));
        }
    };

    return {
        createAccountLink,
        openAccountLink,
        isLoading,
        error
    };
};


























