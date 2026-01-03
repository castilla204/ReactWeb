/**
 * Interceptor global para manejar errores HTTP
 * Detecta errores de red, API caída, 404, 500, etc.
 */

import { toast } from 'sonner';

interface ErrorResponse {
    status: number;
    statusText: string;
    url: string;
}

// Estado global para evitar spam de notificaciones
let lastErrorNotification: { url: string; timestamp: number } | null = null;
const ERROR_NOTIFICATION_COOLDOWN = 10000; // 10 segundos entre notificaciones del mismo error

/**
 * Verifica si la API está caída
 */
async function checkApiHealth(): Promise<boolean> {
    try {
        const apiUrl = import.meta.env.DEV 
            ? 'http://localhost:7124' 
            : 'https://api.atrapo.io';
        
        const response = await fetch(`${apiUrl}/health`, {
            method: 'GET',
            signal: AbortSignal.timeout(5000), // Timeout de 5 segundos
        });
        
        return response.ok;
    } catch {
        return false;
    }
}

/**
 * Maneja errores HTTP de forma centralizada
 */
export function handleHttpError(response: Response, url: string): void {
    const errorResponse: ErrorResponse = {
        status: response.status,
        statusText: response.statusText,
        url,
    };

    // Evitar spam de notificaciones
    const now = Date.now();
    if (
        lastErrorNotification &&
        lastErrorNotification.url === url &&
        now - lastErrorNotification.timestamp < ERROR_NOTIFICATION_COOLDOWN
    ) {
        return;
    }

    lastErrorNotification = { url, timestamp: now };

    switch (response.status) {
        case 404:
            toast.error('🔍 Recurso no encontrado', {
                description: 'La página o recurso que buscas no existe.',
                duration: 5000,
            });
            break;

        case 401:
            // Los errores 401 se manejan en authService, no mostrar aquí
            break;

        case 403:
            // Solo mostrar notificación si no es un error de MFA (ya se maneja en authService)
            // Verificar si el error es de MFA antes de mostrar
            response.clone().json().then(data => {
                if (data?.error !== 'MFA_VERIFICATION_REQUIRED') {
                    toast.error('🚫 Acceso denegado', {
                        description: 'No tienes permisos para acceder a este recurso. Si el problema persiste, intenta cerrar sesión y volver a iniciar sesión.',
                        duration: 6000,
                    });
                }
            }).catch(() => {
                // Si no se puede parsear JSON, mostrar notificación genérica
                toast.error('🚫 Acceso denegado', {
                    description: 'No tienes permisos para acceder a este recurso. Si el problema persiste, intenta cerrar sesión y volver a iniciar sesión.',
                    duration: 6000,
                });
            });
            break;

        case 429:
            // Los errores 429 se manejan en rateLimitHandler
            break;

        case 500:
        case 502:
        case 503:
        case 504:
            toast.error('⚠️ Error del servidor', {
                description: 'El servidor está experimentando problemas. Por favor, intenta más tarde.',
                duration: 6000,
            });
            break;

        default:
            if (response.status >= 500) {
                toast.error('⚠️ Error del servidor', {
                    description: `Error ${response.status}: ${response.statusText}`,
                    duration: 6000,
                });
            } else if (response.status >= 400) {
                toast.error('❌ Error en la solicitud', {
                    description: `Error ${response.status}: ${response.statusText}`,
                    duration: 5000,
                });
            }
            break;
    }
}

/**
 * Maneja errores de red (API caída, sin conexión, etc.)
 */
export async function handleNetworkError(error: Error, url: string): Promise<void> {
    // Evitar spam de notificaciones
    const now = Date.now();
    if (
        lastErrorNotification &&
        lastErrorNotification.url === url &&
        now - lastErrorNotification.timestamp < ERROR_NOTIFICATION_COOLDOWN
    ) {
        return;
    }

    lastErrorNotification = { url, timestamp: now };

    // Verificar si la API está caída
    const isApiDown = !(await checkApiHealth());

    if (isApiDown) {
        toast.error('🔴 API no disponible', {
            description: 'El servidor no está respondiendo. Por favor, intenta más tarde.',
            duration: 8000,
        });
    } else {
        // Error de red del cliente
        toast.error('🌐 Error de conexión', {
            description: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
            duration: 6000,
        });
    }
}

/**
 * Configura el interceptor global de fetch
 * ✅ MEJOR PRÁCTICA: Interceptor que complementa React Query, no lo reemplaza
 * Debe ejecutarse DESPUÉS de authService y rateLimitHandler
 * 
 * NOTA: Este interceptor maneja errores de fetch directos y complementa
 * el manejo de errores de React Query (que se maneja en main.tsx con onError global).
 * 
 * Estrategia: Solo mostrar notificaciones para errores críticos (5xx, API caída)
 * y dejar que React Query maneje sus propios errores a través de onError.
 */
export function setupErrorInterceptor(): void {
    // Verificar si ya está configurado (evitar múltiples configuraciones)
    if ((window.fetch as any).__errorInterceptorConfigured) {
        return;
    }

    const originalFetch = window.fetch;

    window.fetch = async function (...args) {
        const [url, options = {}] = args;
        const urlString = typeof url === 'string' ? url : url.toString();

        try {
            const response = await originalFetch(url, options);

            // ✅ MEJOR PRÁCTICA: Solo manejar errores críticos del servidor (5xx)
            // Los errores 4xx y otros se manejan en React Query o en los componentes
            if (!response.ok) {
                // Solo notificar errores críticos del servidor
                // No manejar errores de autenticación (401) - ya se manejan en authService
                // Manejar 403 solo si no es MFA (authService maneja MFA)
                // No manejar errores 404 - se manejan individualmente
                // No manejar errores 429 - ya se manejan en rateLimitHandler
                if (response.status >= 500) {
                    handleHttpError(response, urlString);
                } else if (response.status === 403) {
                    // Manejar 403 solo si no es MFA
                    response.clone().json().then(data => {
                        if (data?.error !== 'MFA_VERIFICATION_REQUIRED') {
                            handleHttpError(response, urlString);
                        }
                    }).catch(() => {
                        // Si no se puede parsear, manejar como 403 normal
                        handleHttpError(response, urlString);
                    });
                }
            }

            return response;
        } catch (error) {
            // ✅ MEJOR PRÁCTICA: Manejar errores de red (API caída, sin conexión)
            // Estos errores son críticos y deben notificarse siempre
            if (error instanceof TypeError && error.message.includes('fetch')) {
                await handleNetworkError(error, urlString);
            } else if (error instanceof Error && isNetworkErrorType(error)) {
                await handleNetworkError(error, urlString);
            }

            // Re-lanzar el error para que el código que llama pueda manejarlo
            throw error;
        }
    };

    // Marcar como configurado
    (window.fetch as any).__errorInterceptorConfigured = true;
}

/**
 * Verifica si un error es de tipo red/conexión
 */
function isNetworkErrorType(error: Error): boolean {
    const networkErrorMessages = [
        'Failed to fetch',
        'NetworkError',
        'Network request failed',
        'Error de conexión',
        'ERR_INTERNET_DISCONNECTED',
        'ERR_NETWORK_CHANGED',
        'ERR_CONNECTION_REFUSED',
        'ERR_CONNECTION_TIMED_OUT',
    ];
    
    return networkErrorMessages.some(msg => 
        error.message.includes(msg) || error.name.includes(msg)
    );
}

