import { API_CONFIG } from '../config/api';
import { getAuthToken } from '../lib/auth';

interface RequestConfig extends RequestInit {
    requiresAuth?: boolean;
}

export const useApi = () => {
    const fetchApi = async <T>(endpoint: string, config: RequestConfig = {}): Promise<T> => {
        const { requiresAuth = true, ...fetchConfig } = config;
        const url = `${API_CONFIG.baseUrl}${endpoint}`;
        let responseText = '';

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...(requiresAuth && getAuthToken() ? { 'Authorization': `Bearer ${getAuthToken()}` } : {}),
            ...config.headers,
        };

        try {
            const response = await fetch(url, {
                ...fetchConfig,
                headers,
            });

            responseText = await response.text();

            // Handle 204 No Content responses
            if (response.status === 204) {
                return null as T;
            }

            if (!response.ok) {
                const error = responseText ? JSON.parse(responseText) : { message: `Request failed with status ${response.status}` };
                throw new Error(error.message || 'Request failed');
            }

            // Parse JSON only if we have content
            return responseText ? JSON.parse(responseText) : null;
        } catch (error) {
            console.error('API Error:', {
                url,
                response: responseText,
                error
            });
            throw error;
        }
    };

    return { fetchApi };
};