import { API_CONFIG } from '../config/api';
import { jwtDecode } from 'jwt-decode';

interface TokenPair {
    accessToken: string;
    refreshToken: string;
}

interface GoogleAuthResponse {
    token: string; // Formato: "accessToken|refreshToken"
    user: any;
    requiresMFA?: boolean;
}

class AuthService {
    private accessToken: string | null = null;
    private refreshToken: string | null = null;
    private refreshTimeout: NodeJS.Timeout | null = null;
    // ✅ BEST PRACTICE: Prevenir race conditions en token refresh
    private refreshPromise: Promise<boolean> | null = null;

    constructor() {
        this.initFromStorage();
        this.setupAxiosInterceptor();
    }

    // ============================================
    // 1. GOOGLE AUTH (Login)
    // ============================================
    async googleAuth(googleCredential: string): Promise<{ success: boolean; user: any; requiresMFA: boolean }> {
        try {
            const decoded: any = jwtDecode(googleCredential);

            const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.auth.googleAuth}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    accessToken: googleCredential,
                    email: decoded.email,
                    name: decoded.name,
                    googleId: decoded.sub,
                }),
            });

            // ✅ BEST PRACTICE: Manejar diferentes tipos de errores
            if (!response.ok) {
                let errorMessage = 'Authentication failed';
                
                if (response.status === 429) {
                    errorMessage = 'Too many requests. Please wait a moment before trying again.';
                } else if (response.status === 403) {
                    errorMessage = 'Google OAuth configuration error. Please contact administrator.';
                } else {
                    // Intentar obtener mensaje del servidor
                    try {
                        const errorData = await response.json();
                        errorMessage = errorData.message || errorData.error || errorMessage;
                    } catch {
                        // Si no se puede parsear JSON, usar mensaje por defecto
                        errorMessage = `Authentication failed (${response.status})`;
                    }
                }
                
                throw new Error(errorMessage);
            }

            const data: GoogleAuthResponse = await response.json();

            if (!data.token || !data.user) {
                throw new Error('Invalid response from server');
            }

            // ✅ CRÍTICO: El backend devuelve "accessToken|refreshToken"
            const [accessToken, refreshToken] = data.token.split('|');

            if (!accessToken || !refreshToken) {
                throw new Error('Invalid token format from server');
            }

            this.setTokens(accessToken, refreshToken);

            // Iniciar auto-renovación
            this.scheduleTokenRefresh();

            return {
                success: true,
                user: data.user,
                requiresMFA: data.requiresMFA || false,
            };
        } catch (error: any) {
            console.error('Google Auth error:', error);
            throw error;
        }
    }

    // ============================================
    // 2. GUARDAR TOKENS
    // ============================================
    setTokens(accessToken: string, refreshToken: string) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);

        // Guardar también en el formato antiguo para compatibilidad
        localStorage.setItem('authToken', accessToken);
    }

    getAccessToken(): string | null {
        return this.accessToken || localStorage.getItem('accessToken');
    }

    getRefreshToken(): string | null {
        return this.refreshToken || localStorage.getItem('refreshToken');
    }

    // ============================================
    // 3. RENOVAR ACCESS TOKEN AUTOMÁTICAMENTE
    // ============================================
    scheduleTokenRefresh() {
        // ✅ BEST PRACTICE: Limpiar timeout anterior para evitar memory leaks
        if (this.refreshTimeout) {
            clearTimeout(this.refreshTimeout);
            this.refreshTimeout = null;
        }

        try {
            const token = this.getAccessToken();
            if (!token) return;

            const decoded: any = jwtDecode(token);
            const expiresIn = decoded.exp * 1000 - Date.now();

            // ✅ BEST PRACTICE: Renovar 2 minutos antes de expirar (Access Token dura 30 min)
            // Esto asegura que el token nunca expire durante una sesión activa
            const refreshIn = Math.max(0, expiresIn - (2 * 60 * 1000));

            if (refreshIn > 0) {
                // Solo loguear en desarrollo
                if (import.meta.env.DEV) {
                    console.log(`[AuthService] Token expira en ${Math.floor(expiresIn / 1000 / 60)} minutos. Renovando en ${Math.floor(refreshIn / 1000 / 60)} minutos.`);
                }
                
                this.refreshTimeout = setTimeout(() => {
                    this.refreshAccessToken();
                }, refreshIn);
            } else {
                // Token ya expiró o está a punto de expirar, renovar inmediatamente
                this.refreshAccessToken();
            }
        } catch (error) {
            console.error('[AuthService] Error scheduling token refresh:', error);
        }
    }

    async refreshAccessToken(): Promise<boolean> {
        // ✅ BEST PRACTICE: Prevenir múltiples refresh simultáneos (race condition)
        if (this.refreshPromise) {
            return this.refreshPromise;
        }

        this.refreshPromise = (async () => {
            try {
                const refreshToken = this.getRefreshToken();
                if (!refreshToken) {
                    throw new Error('No refresh token available');
                }

                const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.auth.refreshToken}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ refreshToken }),
                });

                if (!response.ok) {
                    if (response.status === 401) {
                        // Refresh token inválido o expirado → Logout
                        this.logout();
                        window.location.href = '/';
                        return false;
                    }
                    throw new Error('Failed to refresh token');
                }

                const data = await response.json();

                if (data.accessToken && data.refreshToken) {
                    // ✅ Backend devuelve NUEVOS access y refresh tokens (rotación)
                    this.setTokens(data.accessToken, data.refreshToken);

                    // Programar próxima renovación
                    this.scheduleTokenRefresh();

                    console.log('✅ Token renovado exitosamente');
                    return true;
                }

                return false;
            } catch (error) {
                console.error('Error refreshing token:', error);
                this.logout();
                return false;
            } finally {
                // Limpiar promise después de un delay para permitir que otros requests la reutilicen
                setTimeout(() => {
                    this.refreshPromise = null;
                }, 1000);
            }
        })();

        return this.refreshPromise;
    }

    // ============================================
    // 4. INTERCEPTOR PARA AUTO-RENOVACIÓN EN 401
    // ============================================
    setupAxiosInterceptor() {
        // Interceptar fetch requests
        const originalFetch = window.fetch;
        const self = this;
        
        window.fetch = async function(...args) {
            const [url, options = {}] = args;
            const fetchOptions: RequestInit = { ...options };

            // Agregar token si existe y no está ya presente
            const token = self.getAccessToken();
            if (token) {
                const headers = new Headers(fetchOptions.headers);
                if (!headers.has('Authorization')) {
                    headers.set('Authorization', `Bearer ${token}`);
                }
                fetchOptions.headers = headers;
            }

            let response = await originalFetch(url, fetchOptions);

            // ✅ Si recibimos 403 por MFA faltante → Redirigir a setup
            if (response.status === 403 && !(fetchOptions as any)._mfaChecked) {
                try {
                    const data = await response.clone().json();
                    if (data.error === 'MFA_REQUIRED' || data.requiresMfaSetup) {
                        (fetchOptions as any)._mfaChecked = true;
                        console.warn('[AuthService] MFA required detected, redirecting to setup');
                        window.location.href = '/mfa/setup-required';
                        return response;
                    }
                } catch {
                    // Si no se puede parsear JSON, continuar normalmente
                }
            }

            // Si recibimos 401, intentar renovar token (solo si tenemos refresh token)
            if (response.status === 401 && !(fetchOptions as any)._retry) {
                const refreshToken = self.getRefreshToken();
                
                // Solo intentar refrescar si tenemos refresh token disponible
                if (refreshToken) {
                    (fetchOptions as any)._retry = true;

                    try {
                        // ✅ BEST PRACTICE: refreshAccessToken ya maneja race conditions
                        const success = await self.refreshAccessToken();

                        if (success) {
                            // Reintentar request original con nuevo token
                            const newToken = self.getAccessToken();
                            if (newToken) {
                                const headers = new Headers(fetchOptions.headers);
                                headers.set('Authorization', `Bearer ${newToken}`);
                                fetchOptions.headers = headers;
                            }
                            response = await originalFetch(url, fetchOptions);
                        }
                    } catch (error) {
                        // Si falla el refresh, no hacer nada (el 401 original se devuelve)
                        console.debug('Token refresh failed, returning original 401 response');
                    }
                } else {
                    // No hay refresh token, no intentar refrescar
                    // Esto es normal cuando el usuario no está autenticado
                }
            }

            return response;
        };
    }

    // ============================================
    // 5. LOGOUT
    // ============================================
    async logout() {
        try {
            const refreshToken = this.getRefreshToken();
            if (refreshToken) {
                await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.auth.logout}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ refreshToken }),
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.clearTokens();
        }
    }

    async logoutAllDevices() {
        try {
            await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.auth.revokeAll}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAccessToken()}`,
                },
            });
            this.clearTokens();
        } catch (error) {
            console.error('Logout all devices error:', error);
        }
    }

    clearTokens() {
        this.accessToken = null;
        this.refreshToken = null;

        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');

        if (this.refreshTimeout) {
            clearTimeout(this.refreshTimeout);
            this.refreshTimeout = null;
        }
    }

    // ============================================
    // 6. INICIALIZAR AL CARGAR LA APP
    // ============================================
    initFromStorage() {
        const accessToken = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');

        if (accessToken && refreshToken) {
            this.accessToken = accessToken;
            this.refreshToken = refreshToken;

            // ✅ BEST PRACTICE: Verificar si el access token ya expiró
            try {
                const decoded: any = jwtDecode(accessToken);
                const expirationTime = decoded.exp * 1000;
                const now = Date.now();
                const isExpired = expirationTime < now;
                const timeUntilExpiry = expirationTime - now;

                if (isExpired) {
                    // Token expirado, renovar inmediatamente
                    if (import.meta.env.DEV) {
                        console.log('[AuthService] Token expired, refreshing immediately');
                    }
                    this.refreshAccessToken();
                } else if (timeUntilExpiry < 2 * 60 * 1000) {
                    // Token expira en menos de 2 minutos, renovar ahora
                    if (import.meta.env.DEV) {
                        console.log('[AuthService] Token expires soon, refreshing immediately');
                    }
                    this.refreshAccessToken();
                } else {
                    // Programar renovación
                    this.scheduleTokenRefresh();
                }
            } catch (error) {
                console.error('[AuthService] Invalid token:', error);
                this.clearTokens();
            }
        }
    }

    // ============================================
    // 7. HELPERS
    // ============================================
    isAuthenticated(): boolean {
        return !!this.accessToken && !!this.refreshToken;
    }

    getCurrentUser(): any | null {
        if (!this.accessToken) return null;

        try {
            return jwtDecode(this.accessToken) as any;
        } catch (error) {
            return null;
        }
    }
}

// Exportar instancia singleton
export const authService = new AuthService();

