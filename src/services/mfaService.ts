import { API_CONFIG } from '../config/api';
import { authService } from './authService';
import { capacitorFetch } from '../utils/capacitorFetch';

interface MFASetupResponse {
    qrCodeBase64: string;
    manualEntryKey: string;
    message: string;
}

interface MFAEnableResponse {
    success: boolean;
    recoveryCodes: string[];
    message: string;
}

interface MFAVerifyResponse {
    isValid: boolean;
    accessToken?: string;
    refreshToken?: string;
    message?: string;
}

interface MFAStatusResponse {
    isEnabled: boolean;
    enabledAt?: string;
    lastVerifiedAt?: string;
    remainingRecoveryCodes: number;
}

class MFAService {
    // Cache para evitar múltiples llamadas simultáneas
    private statusCache: { data: MFAStatusResponse | null; timestamp: number } = { data: null, timestamp: 0 };
    private readonly CACHE_DURATION = 10000; // 10 segundos
    private pendingStatusRequest: Promise<MFAStatusResponse> | null = null;
    private pendingSetupRequest: Promise<MFASetupResponse> | null = null;
    // ✅ Rate limiting: rastrear cuándo fue el último rate limit y cuánto tiempo queda
    private rateLimitUntil: number = 0; // Timestamp hasta cuando estamos rate limited

    // ============================================
    // 1. SETUP MFA (Obtener QR code)
    // ============================================
    async setupMFA(): Promise<MFASetupResponse> {
        // ✅ Verificar si estamos en rate limit
        const now = Date.now();
        if (now < this.rateLimitUntil) {
            const secondsRemaining = Math.ceil((this.rateLimitUntil - now) / 1000);
            const error = new Error(`Rate limited`) as any;
            error.retryAfter = secondsRemaining;
            error.isRateLimit = true;
            throw error;
        }

        // Si ya hay una solicitud pendiente, esperar a que termine
        if (this.pendingSetupRequest) {
            return this.pendingSetupRequest;
        }

        this.pendingSetupRequest = (async () => {
            try {
                const token = authService.getAccessToken();
                if (!token) {
                    throw new Error('No authentication token');
                }

                // ✅ Usar capacitorFetch para evitar CORS en Capacitor
                const response = await capacitorFetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.mfa.setup}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (response.status === 429) {
                    const retryAfter = response.headers.get('Retry-After') || '30';
                    const retrySeconds = parseInt(retryAfter, 10);
                    // ✅ Guardar el tiempo hasta cuando estamos rate limited
                    this.rateLimitUntil = now + (retrySeconds * 1000);
                    const error = new Error(`Demasiadas solicitudes. Por favor espera ${retrySeconds} segundos antes de intentar de nuevo.`) as any;
                    error.retryAfter = retrySeconds;
                    error.isRateLimit = true;
                    console.warn(`[MFAService] Rate limited (429) - ${retrySeconds}s. Blocking until ${new Date(this.rateLimitUntil).toLocaleTimeString()}`);
                    throw error;
                }

                if (!response.ok) {
                    const errorText = await response.text();
                    let errorMessage = 'Failed to setup MFA';
                    try {
                        const error = JSON.parse(errorText);
                        errorMessage = error.message || errorMessage;
                    } catch {
                        errorMessage = errorText || errorMessage;
                    }
                    throw new Error(errorMessage);
                }

                return await response.json();
            } catch (error: any) {
                console.error('MFA Setup error:', error);
                throw error;
            } finally {
                // Limpiar la solicitud pendiente después de un delay
                setTimeout(() => {
                    this.pendingSetupRequest = null;
                }, 2000);
            }
        })();

        return this.pendingSetupRequest;
    }

    // ============================================
    // 2. ENABLE MFA (Confirmar con código)
    // ============================================
    async enableMFA(totpCode: string): Promise<MFAEnableResponse> {
        try {
            const token = authService.getAccessToken();
            if (!token) {
                throw new Error('No authentication token');
            }

            // ✅ Usar capacitorFetch para evitar CORS en Capacitor
            const response = await capacitorFetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.mfa.enable}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ totpCode }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to enable MFA');
            }

            return await response.json();
        } catch (error: any) {
            console.error('MFA Enable error:', error);
            throw error;
        }
    }

    // ============================================
    // 3. VERIFY MFA (Durante login)
    // ============================================
    async verifyMFA(code: string, isRecoveryCode: boolean = false): Promise<MFAVerifyResponse> {
        try {
            // ✅ Usar capacitorFetch para evitar CORS en Capacitor
            const response = await capacitorFetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.mfa.verify}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    code,
                    isRecoveryCode,
                }),
            });

            // ✅ Leer el cuerpo de la respuesta ANTES de verificar response.ok
            // Esto asegura que el error se capture correctamente
            let responseData: any;
            try {
                const responseText = await response.text();
                responseData = responseText ? JSON.parse(responseText) : {};
            } catch {
                responseData = {};
            }

            if (!response.ok) {
                const errorMessage = responseData.message || 'Invalid MFA code';
                const error = new Error(errorMessage) as any;
                error.response = { 
                    status: response.status, 
                    data: { message: errorMessage } 
                };
                console.error('[MFAService] Verify failed:', response.status, errorMessage);
                throw error;
            }

            // 🛡️ FIX: la API serializa PascalCase (VerifyMfaResponseDto → "AccessToken").
            // Solo se leía camelCase → el verify devolvía isValid:false aunque el servidor
            // hubiera aceptado el código. Aceptamos ambos casings.
            const accessToken = responseData.accessToken ?? responseData.AccessToken;
            const refreshToken = responseData.refreshToken ?? responseData.RefreshToken;
            if (accessToken && refreshToken) {
                return {
                    isValid: true,
                    accessToken,
                    refreshToken,
                    message: responseData.message ?? responseData.Message,
                };
            }

            return { isValid: false };
        } catch (error: any) {
            // ✅ Asegurar que el error se propaga correctamente
            console.error('[MFAService] Verify error:', error);
            // Si el error ya tiene un mensaje, mantenerlo; si no, agregar uno genérico
            if (!error.message) {
                error.message = 'Error al verificar código';
            }
            throw error;
        }
    }

    // ============================================
    // 4. DISABLE MFA
    // ============================================
    async disableMFA(password: string, totpCode: string): Promise<{ success: boolean; message: string }> {
        try {
            const token = authService.getAccessToken();
            if (!token) {
                throw new Error('No authentication token');
            }

            // ✅ Usar capacitorFetch para evitar CORS en Capacitor
            const response = await capacitorFetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.mfa.disable}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    password,
                    totpCode,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to disable MFA');
            }

            const data = await response.json();
            return {
                success: true,
                message: data.message || 'MFA disabled successfully',
            };
        } catch (error: any) {
            console.error('MFA Disable error:', error);
            throw error;
        }
    }

    // ============================================
    // 5. GET MFA STATUS (con caché y throttling)
    // ============================================
    async getMFAStatus(forceRefresh: boolean = false): Promise<MFAStatusResponse> {
        // Verificar caché primero
        const now = Date.now();
        if (!forceRefresh && this.statusCache.data && (now - this.statusCache.timestamp) < this.CACHE_DURATION) {
            console.log('[MFAService] Returning cached MFA status:', this.statusCache.data);
            return this.statusCache.data;
        }
        
        console.log('[MFAService] Fetching fresh MFA status (forceRefresh:', forceRefresh, ')');

        // Si ya hay una solicitud pendiente, reutilizarla
        if (this.pendingStatusRequest) {
            return this.pendingStatusRequest;
        }

        this.pendingStatusRequest = (async () => {
            try {
                const token = authService.getAccessToken();
                if (!token) {
                    throw new Error('No authentication token');
                }

                // ✅ Usar capacitorFetch para evitar CORS en Capacitor
                const response = await capacitorFetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.mfa.status}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (response.status === 429) {
                    // Si es 429, devolver el caché si existe, o lanzar error
                    if (this.statusCache.data) {
                        console.warn('Rate limited, returning cached MFA status');
                        return this.statusCache.data;
                    }
                    const retryAfter = response.headers.get('Retry-After') || '30';
                    const retrySeconds = parseInt(retryAfter, 10);
                    // ✅ Guardar el tiempo hasta cuando estamos rate limited
                    this.rateLimitUntil = Date.now() + (retrySeconds * 1000);
                    const error = new Error(`Demasiadas solicitudes. Por favor espera ${retrySeconds} segundos.`) as any;
                    error.retryAfter = retrySeconds;
                    error.isRateLimit = true;
                    console.warn(`[MFAService] Rate limited (429) - ${retrySeconds}s. Blocking until ${new Date(this.rateLimitUntil).toLocaleTimeString()}`);
                    throw error;
                }

                if (response.status === 404) {
                    // MFA no configurado - esto es válido
                    const defaultStatus: MFAStatusResponse = {
                        isEnabled: false,
                        remainingRecoveryCodes: 0,
                    };
                    this.statusCache = { data: defaultStatus, timestamp: now };
                    return defaultStatus;
                }

                if (!response.ok) {
                    throw new Error('Failed to get MFA status');
                }

                const raw = await response.json();
                console.log('[MFAService] MFA status received:', raw);
                // CASING-FIX: la API serializa PascalCase (Program.cs PropertyNamingPolicy=null), así que
                // leer `raw.isEnabled` daba siempre undefined → un usuario con 2FA activado veía "desactivado".
                // Normalizamos leyendo ambos casings en un único punto (beneficia a todos los consumidores).
                const data: MFAStatusResponse = {
                    isEnabled: raw.isEnabled ?? raw.IsEnabled ?? false,
                    enabledAt: raw.enabledAt ?? raw.EnabledAt,
                    lastVerifiedAt: raw.lastVerifiedAt ?? raw.LastVerifiedAt,
                    remainingRecoveryCodes: raw.remainingRecoveryCodes ?? raw.RemainingRecoveryCodes ?? 0,
                };
                // Actualizar caché
                this.statusCache = { data, timestamp: now };
                return data;
            } catch (error: any) {
                // Si hay error pero tenemos caché, devolverlo
                if (this.statusCache.data && error.message?.includes('429')) {
                    console.warn('Rate limited, returning cached MFA status');
                    return this.statusCache.data;
                }
                console.error('MFA Status error:', error);
                throw error;
            } finally {
                // Limpiar la solicitud pendiente después de un delay
                setTimeout(() => {
                    this.pendingStatusRequest = null;
                }, 1000);
            }
        })();

        return this.pendingStatusRequest;
    }

    // Limpiar caché (útil después de habilitar/deshabilitar MFA)
    clearCache() {
        this.statusCache = { data: null, timestamp: 0 };
    }
}

export const mfaService = new MFAService();

