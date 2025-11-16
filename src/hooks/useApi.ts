import { API_CONFIG } from '../config/api';
import { getAuthToken } from '../lib/auth';
import { showToast } from '../lib/toast';

interface RequestConfig extends RequestInit {
    requiresAuth?: boolean;
}

export const useApi = () => {
    const fetchApi = async <T>(endpoint: string, config: RequestConfig = {}): Promise<T> => {
        const { requiresAuth = true, ...fetchConfig } = config;
        const url = endpoint.startsWith('http') ? endpoint : `${API_CONFIG.baseUrl}${endpoint}`;
        let responseText = '';

        // Log API calls for debugging
        if (endpoint.includes('GetServiceByHireId') || endpoint.includes('dispute-service') || endpoint.includes('map-experts') || endpoint.includes('appointment/confirm')) {
            console.log('[useApi] Making API call:', {
                endpoint,
                fullUrl: url,
                method: fetchConfig.method || 'GET',
                requiresAuth,
                hasToken: !!getAuthToken(),
                token: getAuthToken()?.substring(0, 20) + '...',
                body: config.body
            });
        }

        // El interceptor de authService ya agrega el token automáticamente
        // Pero mantenemos esto para compatibilidad con código que no usa el interceptor
        const token = getAuthToken();
        const headers: Record<string, string> = {
            ...(requiresAuth && token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...(config.headers as Record<string, string>),
        };

        // Only add Content-Type if we're not sending FormData
        if (!(config.body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
        }

        try {
            const response = await fetch(url, {
                ...fetchConfig,
                headers,
            });

            responseText = await response.text();

            // Log response for debugging GetServiceByHireId calls
            if (endpoint.includes('GetServiceByHireId') || endpoint.includes('dispute-service') || endpoint.includes('map-experts')) {
                console.log('[useApi] Response:', {
                    status: response.status,
                    statusText: response.statusText,
                    ok: response.ok,
                    responseText: responseText.substring(0, 200) + (responseText.length > 200 ? '...' : '')
                });
            }

            // Log response for debugging appointment proposal calls
            if (endpoint.includes('appointment/propose')) {
                console.log('[useApi] Appointment Proposal Response:', {
                    status: response.status,
                    statusText: response.statusText,
                    ok: response.ok,
                    responseText: responseText.substring(0, 500) + (responseText.length > 500 ? '...' : ''),
                    requestBody: config.body
                });
            }

            // Log response for debugging appointment config calls
            if (endpoint.includes('appointment-status-configs')) {
                console.log('[useApi] Appointment Config Response:', {
                    status: response.status,
                    statusText: response.statusText,
                    ok: response.ok,
                    responseText: responseText.substring(0, 500) + (responseText.length > 500 ? '...' : ''),
                    requestBody: config.body
                });
            }

            // Log response for debugging appointment confirm calls
            if (endpoint.includes('appointment/confirm')) {
                console.log('[useApi] Appointment Confirm Response:', {
                    status: response.status,
                    statusText: response.statusText,
                    ok: response.ok,
                    responseText: responseText.substring(0, 500) + (responseText.length > 500 ? '...' : ''),
                    requestBody: config.body
                });
            }

            // Handle 204 No Content responses
            if (response.status === 204) {
                return undefined as T;
            }

            if (!response.ok) {
                let error;
                try {
                    error = responseText ? JSON.parse(responseText) : { message: `Request failed with status ${response.status}` };
                } catch {
                    error = { message: responseText || `Request failed with status ${response.status}` };
                }
                
                if (endpoint.includes('GetServiceByHireId')) {
                    console.error('[useApi] GetServiceByHireId error:', error);
                }
                
                if (endpoint.includes('appointment-status-configs')) {
                    console.error('[useApi] Appointment Config error:', error);
                }
                throw error;
            }

            // Parse JSON only if we have content
            return responseText ? JSON.parse(responseText) : undefined as T;
        } catch (error: any) {
            console.error('API Error:', {
                url,
                method: fetchConfig.method,
                body: config.body,
                response: responseText,
                error
            });
            
            // ✅ Detectar errores de red y mostrar toast elegante
            const isNetworkError = error?.message?.includes('Failed to fetch') || 
                                 error?.message?.includes('NetworkError') ||
                                 error?.name === 'TypeError' ||
                                 error?.message?.includes('Network request failed');
            
            if (isNetworkError) {
                // No mostrar toast aquí, dejar que los componentes lo manejen
                // Pero sí mejorar el mensaje de error
                const networkError = {
                    ...error,
                    message: 'Error de conexión. Por favor, verifica tu conexión a internet e intenta nuevamente.',
                    isNetworkError: true
                };
                throw networkError;
            }
            
            throw error;
        }
    };

    const get = <T>(endpoint: string, config: RequestConfig = {}): Promise<T> => {
        return fetchApi<T>(endpoint, { ...config, method: 'GET' });
    };

    const post = <T>(endpoint: string, data?: any, config: RequestConfig = {}): Promise<T> => {
        return fetchApi<T>(endpoint, {
            ...config,
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
        });
    };

    const put = <T>(endpoint: string, data?: any, config: RequestConfig = {}): Promise<T> => {
        return fetchApi<T>(endpoint, {
            ...config,
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined,
        });
    };

    const del = <T>(endpoint: string, config: RequestConfig = {}): Promise<T> => {
        return fetchApi<T>(endpoint, { ...config, method: 'DELETE' });
    };

    return { 
        fetchApi, 
        get, 
        post, 
        put, 
        delete: del 
    };
};