import { API_CONFIG } from '../config/api';
import { jwtDecode } from 'jwt-decode';
import { isExternalMapTileUrl, resolveFetchUrl } from '../utils/mapTileUrls';

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
    // ✅ Cola de requests pendientes esperando verificación MFA
    private pendingMfaRequests: Array<{ url: string; options: RequestInit; resolve: (response: Response) => void; reject: (error: any) => void }> = [];

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
                        
                        // ✅ Mejorar mensaje para errores de 'aud' claim
                        if (errorData.details && errorData.details.includes("untrusted 'aud' claim")) {
                            errorMessage = 'Error de configuración: El Client ID de Google OAuth no coincide entre el frontend y el backend. Por favor contacta al administrador.';
                            console.error('[AuthService] Google OAuth Client ID mismatch:', {
                                frontendClientId: '61603823707-4vsp43naifci8t893hdc276kkhbvn49a.apps.googleusercontent.com',
                                error: errorData
                            });
                        }
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

        if (typeof window !== 'undefined') {
            window.dispatchEvent(
                new CustomEvent('auth:token-updated', {
                    detail: accessToken,
                })
            );
        }
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
                        // 🛡️ Round 15 — R6 FIX: indicar 'session_expired' para que clearTokens
                        // emita el evento global que App.tsx escuchará → toast + redirect /login
                        // con returnTo. Antes era silencioso ("dejar que los componentes manejen
                        // el error"), pero NINGÚN componente lo manejaba → 401 zombie.
                        console.warn('[AuthService] Refresh token inválido o expirado');
                        this.clearTokens('session_expired');
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
            const urlString = resolveFetchUrl(url);

            // Tiles de mapa: fetch sin tocar (evita Authorization → preflight CORS en Carto)
            if (isExternalMapTileUrl(urlString)) {
                return originalFetch(...args);
            }

            const fetchOptions: RequestInit = { ...options };

            // ✅ CRÍTICO: Solo agregar token si NO es un endpoint público
            // Los endpoints públicos no necesitan autenticación y agregar token puede causar delays
            const publicEndpoints = [
                '/api/Categories',
                '/api/Currencies',
                '/api/ServiceType/public',
                '/api/SearchService/homepage-wall',
                '/health',
                '/warmup',
                '/api/Auth/register',
                '/api/Auth/login-password',
                '/api/Auth/forgot-password',
                '/api/Auth/reset-password',
                '/api/Auth/verify-email',
                '/api/Auth/resend-otp',
                '/api/Auth/apple-auth'
            ];
            const isPublic = publicEndpoints.some(endpoint => urlString.includes(endpoint));

            // Agregar token solo si NO es un endpoint público
            const token = self.getAccessToken();
            if (token && !isPublic) {
                const headers = new Headers(fetchOptions.headers);
                if (!headers.has('Authorization')) {
                    headers.set('Authorization', `Bearer ${token}`);
                }
                fetchOptions.headers = headers;
            }

            let response = await originalFetch(url, fetchOptions);

            // ✅ Si recibimos 403 por MFA → Manejar según el tipo
            if (response.status === 403 && !(fetchOptions as any)._mfaChecked) {
                try {
                    // ✅ Verificar que la respuesta sea JSON antes de parsear
                    const contentType = response.headers.get('content-type');
                    if (!contentType || !contentType.includes('application/json')) {
                        // Si no es JSON, devolver la respuesta sin procesar
                        return response;
                    }
                    
                    const clonedResponse = response.clone();
                    const text = await clonedResponse.text();
                    
                    // Verificar si es HTML
                    if (text.trim().toLowerCase().startsWith('<!doctype') || text.trim().toLowerCase().startsWith('<html')) {
                        // Es HTML, no JSON - devolver respuesta sin procesar
                        return response;
                    }
                    
                    const data = JSON.parse(text);
                    
                    // ✅ MFA_VERIFICATION_REQUIRED: MFA habilitado pero no verificado → Mostrar verificación
                    if (data.error === 'MFA_VERIFICATION_REQUIRED') {
                        (fetchOptions as any)._mfaChecked = true;
                        console.warn('[AuthService] MFA verification required, showing verification modal');
                        
                        // Guardar request en cola y mostrar modal
                        return new Promise<Response>((resolve, reject) => {
                            self.pendingMfaRequests.push({
                                url: url as string,
                                options: fetchOptions,
                                resolve,
                                reject
                            });
                            
                            // Disparar evento para mostrar modal de verificación
                            const mfaVerificationEvent = new CustomEvent('showMfaVerification', {
                                detail: {
                                    onSuccess: async () => {
                                        // Después de verificación exitosa, reintentar todos los requests pendientes
                                        await self.retryPendingMfaRequests();
                                    }
                                }
                            });
                            window.dispatchEvent(mfaVerificationEvent);
                        });
                    }
                    
                    // ✅ DESACTIVADO: MFA ya no es obligatorio
                    // MFA_REQUIRED: MFA no configurado → Redirigir a setup
                    // if (data.error === 'MFA_REQUIRED' || data.requiresMfaSetup) {
                    //     (fetchOptions as any)._mfaChecked = true;
                    //     console.warn('[AuthService] MFA setup required, redirecting to setup');
                    //     window.location.href = '/mfa/setup-required';
                    //     return response;
                    // }
                } catch {
                    // Si no se puede parsear JSON, continuar normalmente
                }
            }
            
            // Si recibimos 401, intentar renovar token (solo si tenemos refresh token)
            // ✅ EXCEPCIÓN: No intentar renovar token para verifyMFA porque un 401 puede ser código inválido, no token expirado
            const isMfaVerifyEndpoint = typeof url === 'string' && url.includes('/api/auth/mfa/verify');
            if (response.status === 401 && !(fetchOptions as any)._retry && !isMfaVerifyEndpoint) {
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
    // 5. REINTENTAR REQUESTS PENDIENTES DESPUÉS DE MFA
    // ============================================
    private async retryPendingMfaRequests() {
        const requests = [...this.pendingMfaRequests];
        this.pendingMfaRequests = [];
        
        const originalFetch = window.fetch;
        const newToken = this.getAccessToken();
        
        for (const request of requests) {
            try {
                if (newToken) {
                    const headers = new Headers(request.options.headers);
                    headers.set('Authorization', `Bearer ${newToken}`);
                    request.options.headers = headers;
                }
                (request.options as any)._mfaChecked = false; // Permitir reintento
                const response = await originalFetch(request.url, request.options);
                request.resolve(response);
            } catch (error) {
                request.reject(error);
            }
        }
    }

    // ============================================
    // 6. LOGOUT
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

    clearTokens(reason: 'logout' | 'session_expired' | 'manual' = 'manual') {
        this.accessToken = null;
        this.refreshToken = null;

        // 🛡️ Round 15 — R5 FIX: cleanup completo. Antes faltaban 'user', 'token',
        // 'accessTokenExpiresAt' y 'mfa-verification-pending' → tras logout, el objeto user
        // y estado MFA persistían en localStorage. Riesgo: información PII expuesta + estado
        // de MFA huérfano.
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        localStorage.removeItem('user');
        localStorage.removeItem('token'); // legacy clave detectada en PaymentSuccessPage
        localStorage.removeItem('accessTokenExpiresAt');
        localStorage.removeItem('mfa-verification-pending');

        if (typeof window !== 'undefined') {
            // Mantener evento legacy para no romper consumers
            window.dispatchEvent(
                new CustomEvent('auth:token-updated', {
                    detail: null,
                })
            );

            // 🛡️ Round 15 — R6 FIX: emitir evento específico cuando el clear es por sesión
            // expirada (no por logout voluntario). App.tsx escucha y muestra toast +
            // navigate('/login') con returnTo. Sin esto el usuario quedaba en UI autenticada
            // sobre tokens borrados → 401 silencioso en cada acción.
            if (reason === 'session_expired') {
                window.dispatchEvent(
                    new CustomEvent('auth:session-expired', {
                        detail: { returnTo: window.location.pathname + window.location.search },
                    })
                );
            }
        }

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

