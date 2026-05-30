import { Capacitor } from '@capacitor/core';
import { SocialLogin } from '@capgo/capacitor-social-login';
import { SignInWithApple } from '@capacitor-community/apple-sign-in';
import { jwtDecode } from 'jwt-decode';
import { authService } from './authService';
import { API_CONFIG } from '../config/api';

// ⚠️ IMPORTANTE: Usar el Web Client ID correcto (NO el Android Client ID)
// El plugin @capgo/capacitor-social-login requiere el Web Client ID, no el Android Client ID
const googleWebClientId = '61603823707-4vsp43naifci8t893hdc276kkhbvn49a.apps.googleusercontent.com';

const initConfig = {
    google: {
        webClientId: googleWebClientId.trim(),
    },
};

class NativeAuthService {
    private isNative = Capacitor.isNativePlatform();
    
    async signInWithGoogle(): Promise<{ success: boolean; user: any; requiresMFA: boolean }> {
        const startTime = Date.now();
        try {
            console.log('🚀 [NativeAuth] ========== INICIO GOOGLE SIGN-IN ==========');
            console.log('📱 [NativeAuth] Plataforma:', Capacitor.getPlatform());
            console.log('📱 [NativeAuth] Es nativo:', this.isNative);
            console.log('🔑 [NativeAuth] Web Client ID configurado:', googleWebClientId);
            console.log('🔑 [NativeAuth] Web Client ID longitud:', googleWebClientId.length);
            console.log('🔑 [NativeAuth] Web Client ID esperado:', '61603823707-4vsp43naifci8t893hdc276kkhbvn49a.apps.googleusercontent.com');
            console.log('🔑 [NativeAuth] ¿Web Client ID coincide?:', googleWebClientId === '61603823707-4vsp43naifci8t893hdc276kkhbvn49a.apps.googleusercontent.com');
            console.log('🔑 [NativeAuth] Config completa:', JSON.stringify(initConfig, null, 2));
            console.log('🔐 [NativeAuth] SHA-1 esperado en Google Cloud Console: A7:77:CA:D5:A4:43:D5:EA:C5:A2:66:C5:40:CA:94:4D:94:42:65:10');
            console.log('🔐 [NativeAuth] Package name esperado: com.inspecciono.app');
            console.log('🔐 [NativeAuth] IMPORTANTE: Verifica en Logcat que el SHA-1 del certificado coincida con el de Google Cloud Console');

            // ✅ PASO 1: Inicializar el plugin
            console.log('⏳ [NativeAuth] Inicializando plugin SocialLogin...');
            const initStartTime = Date.now();
            try {
                await (SocialLogin as any).initialize(initConfig);
                const initDuration = Date.now() - initStartTime;
                console.log(`✅ [NativeAuth] Plugin inicializado exitosamente (${initDuration}ms)`);
                console.log('✅ [NativeAuth] Web Client ID aplicado correctamente');
            } catch (initError: any) {
                const initDuration = Date.now() - initStartTime;
                console.error(`❌ [NativeAuth] Error inicializando plugin (${initDuration}ms):`, initError);
                console.error('❌ [NativeAuth] Error init stack:', initError?.stack);
                console.error('❌ [NativeAuth] Error init message:', initError?.message);
                throw initError;
            }

            // ✅ PASO 2: Realizar login
            console.log('⏳ [NativeAuth] Iniciando proceso de login con Google...');
            console.log('📋 [NativeAuth] Opciones de login:', JSON.stringify({
                provider: 'google',
                options: {
                    filterByAuthorizedAccounts: false,
                    scopes: ['profile', 'email'],
                },
            }, null, 2));
            console.log('🔐 [NativeAuth] ANTES DE LOGIN - Verificaciones:');
            console.log('🔐 [NativeAuth] - Web Client ID configurado: ✅', googleWebClientId);
            console.log('🔐 [NativeAuth] - SHA-1 debe estar en Google Cloud Console: A7:77:CA:D5:A4:43:D5:EA:C5:A2:66:C5:40:CA:94:4D:94:42:65:10');
            console.log('🔐 [NativeAuth] - Package name debe ser: com.inspecciono.app');
            console.log('🔐 [NativeAuth] - Revisa Logcat para ver el SHA-1 real del certificado');
            
            const loginStartTime = Date.now();
            let loginResult;
            try {
                loginResult = await (SocialLogin as any).login({
                    provider: 'google',
                    options: {
                        filterByAuthorizedAccounts: false,
                        scopes: ['profile', 'email'],
                    },
                });
                const loginDuration = Date.now() - loginStartTime;
                console.log(`✅ [NativeAuth] Login completado (${loginDuration}ms)`);
            } catch (loginError: any) {
                const loginDuration = Date.now() - loginStartTime;
                console.error(`❌ [NativeAuth] Error durante login (${loginDuration}ms):`, loginError);
                console.error('❌ [NativeAuth] Error login tipo:', typeof loginError);
                console.error('❌ [NativeAuth] Error login constructor:', loginError?.constructor?.name);
                console.error('❌ [NativeAuth] Error login message:', loginError?.message);
                console.error('❌ [NativeAuth] Error login code:', loginError?.code);
                console.error('❌ [NativeAuth] Error login stack:', loginError?.stack);
                if (loginError?.toString) {
                    console.error('❌ [NativeAuth] Error login toString:', loginError.toString());
                }
                
                // ✅ Verificaciones específicas para errores de cancelación
                const errorMessage = loginError?.message || loginError?.toString() || '';
                if (errorMessage.includes('cancelled') || errorMessage.includes('canceled')) {
                    console.error('🔐 [NativeAuth] ========== DIAGNÓSTICO ERROR DE CANCELACIÓN ==========');
                    console.error('🔐 [NativeAuth] Este error generalmente indica:');
                    console.error('🔐 [NativeAuth] 1. SHA-1 no coincide con el configurado en Google Cloud Console');
                    console.error('🔐 [NativeAuth] 2. Web Client ID incorrecto o no vinculado al Android Client ID');
                    console.error('🔐 [NativeAuth] 3. Package name incorrecto en Google Cloud Console');
                    console.error('🔐 [NativeAuth] 4. OAuth Consent Screen no configurado correctamente');
                    console.error('🔐 [NativeAuth] VERIFICA EN LOGCAT:');
                    console.error('🔐 [NativeAuth] - Busca el log "[Certificate] SHA-1 del certificado de la app"');
                    console.error('🔐 [NativeAuth] - Compara con el SHA-1 en Google Cloud Console');
                    console.error('🔐 [NativeAuth] - Deben ser EXACTAMENTE iguales (mayúsculas/minúsculas no importan)');
                    console.error('🔐 [NativeAuth] SHA-1 esperado: A7:77:CA:D5:A4:43:D5:EA:C5:A2:66:C5:40:CA:94:4D:94:42:65:10');
                    console.error('🔐 [NativeAuth] ========================================================');
                }
                
                throw loginError;
            }

            console.log('✅ [NativeAuth] Login exitoso');
            console.log('📦 [NativeAuth] Result completo:', JSON.stringify(loginResult, null, 2));
            console.log('📦 [NativeAuth] Result tipo:', typeof loginResult);
            console.log('📦 [NativeAuth] Result tiene result?:', loginResult?.hasOwnProperty('result'));

            console.log('🔍 [NativeAuth] Analizando resultado del login...');
            console.log('🔍 [NativeAuth] loginResult keys:', Object.keys(loginResult || {}));
            
            const result = loginResult?.result;
            console.log('🔍 [NativeAuth] result existe?:', !!result);
            console.log('🔍 [NativeAuth] result tipo:', typeof result);
            console.log('🔍 [NativeAuth] result keys:', result ? Object.keys(result) : 'N/A');
            console.log('🔍 [NativeAuth] result completo:', JSON.stringify(result, null, 2));
            
            if (!result) {
                console.error('❌ [NativeAuth] No se recibió result en loginResult');
                console.error('❌ [NativeAuth] loginResult completo:', JSON.stringify(loginResult, null, 2));
                throw new Error('No se recibió result de Google Sign-In');
            }
            
            if (!result.idToken) {
                console.error('❌ [NativeAuth] No se recibió idToken en result');
                console.error('❌ [NativeAuth] result keys disponibles:', Object.keys(result));
                console.error('❌ [NativeAuth] result completo:', JSON.stringify(result, null, 2));
                throw new Error('No se recibió idToken de Google');
            }

            console.log('🔑 [NativeAuth] idToken recibido (primeros 50 chars):', result.idToken.substring(0, 50) + '...');
            console.log('🔑 [NativeAuth] idToken longitud:', result.idToken.length);
            console.log('🔑 [NativeAuth] idToken tiene formato JWT?:', result.idToken.split('.').length === 3);

            // ✅ PASO 3: Decodificar el idToken para extraer información
            console.log('🔓 [NativeAuth] Iniciando decodificación del token...');
            let decoded: any;
            try {
                const decodeStartTime = Date.now();
                decoded = jwtDecode(result.idToken);
                const decodeDuration = Date.now() - decodeStartTime;
                console.log(`✅ [NativeAuth] Token decodificado exitosamente (${decodeDuration}ms)`);
                console.log('✅ [NativeAuth] Token decodificado completo:', JSON.stringify(decoded, null, 2));
                console.log('✅ [NativeAuth] Token decodificado resumen:', {
                    email: decoded.email,
                    name: decoded.name,
                    sub: decoded.sub,
                    aud: decoded.aud,
                    exp: decoded.exp,
                    iat: decoded.iat,
                    iss: decoded.iss,
                });
                console.log('✅ [NativeAuth] Token expira en:', decoded.exp ? new Date(decoded.exp * 1000).toISOString() : 'N/A');
            } catch (error: any) {
                console.error('❌ [NativeAuth] Error decodificando token:', error);
                console.error('❌ [NativeAuth] Error decode tipo:', typeof error);
                console.error('❌ [NativeAuth] Error decode message:', error?.message);
                console.error('❌ [NativeAuth] Error decode stack:', error?.stack);
                throw new Error('Invalid token format from Google');
            }

            // ✅ PASO 4: Enviar al backend EN EL MISMO FORMATO QUE WEB
            console.log('📡 [NativeAuth] Enviando al backend...');
            
            // ✅ Preparar el body con el formato correcto
            const requestBody = {
                accessToken: result.idToken,  // ✅ Campo "accessToken" (aunque sea un idToken)
                email: decoded.email || '',
                name: decoded.name || decoded.given_name || '',
                googleId: decoded.sub || '',
            };
            
            // ✅ Log para verificar exactamente qué se envía
            console.log('📤 [NativeAuth] Body que se envía al backend:', JSON.stringify(requestBody, null, 2));
            console.log('📤 [NativeAuth] Verificando que NO hay campo "credential":', !requestBody.hasOwnProperty('credential'));
            
            // ✅ USAR capacitorFetch para control total del formato en Capacitor
            const { capacitorFetch } = await import('../utils/capacitorFetch');
            
            console.log('📡 [NativeAuth] URL del backend:', `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.auth.googleAuth}`);
            const fetchStartTime = Date.now();
            let response;
            try {
                response = await capacitorFetch(
                    `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.auth.googleAuth}`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                        },
                        body: JSON.stringify(requestBody),
                    }
                );
                const fetchDuration = Date.now() - fetchStartTime;
                console.log(`📡 [NativeAuth] Respuesta recibida (${fetchDuration}ms)`);
            } catch (fetchError: any) {
                const fetchDuration = Date.now() - fetchStartTime;
                console.error(`❌ [NativeAuth] Error en fetch (${fetchDuration}ms):`, fetchError);
                console.error('❌ [NativeAuth] Error fetch tipo:', typeof fetchError);
                console.error('❌ [NativeAuth] Error fetch message:', fetchError?.message);
                console.error('❌ [NativeAuth] Error fetch stack:', fetchError?.stack);
                throw fetchError;
            }

            console.log('📡 [NativeAuth] Response status:', response.status);
            console.log('📡 [NativeAuth] Response ok?:', response.ok);
            console.log('📡 [NativeAuth] Response statusText:', response.statusText);
            console.log('📡 [NativeAuth] Response headers:', JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));

            if (!response.ok) {
                console.error('❌ [NativeAuth] La respuesta no es OK, leyendo error...');
                const errorText = await response.text();
                console.error('❌ [NativeAuth] Error del servidor (texto):', errorText);
                console.error('❌ [NativeAuth] Error del servidor (longitud):', errorText.length);
                
                let errorData;
                try {
                    errorData = JSON.parse(errorText);
                    console.error('❌ [NativeAuth] Error del servidor (JSON):', JSON.stringify(errorData, null, 2));
                } catch (parseError) {
                    console.error('❌ [NativeAuth] No se pudo parsear error como JSON:', parseError);
                    errorData = { message: errorText };
                }
                
                throw new Error(errorData.message || errorData.error || 'Authentication failed');
            }

            console.log('📡 [NativeAuth] Parseando respuesta JSON...');
            const data = await response.json();
            console.log('✅ [NativeAuth] Respuesta del backend (completa):', JSON.stringify(data, null, 2));
            console.log('✅ [NativeAuth] Respuesta tiene token?:', !!data.token);
            console.log('✅ [NativeAuth] Respuesta tiene user?:', !!data.user);
            console.log('✅ [NativeAuth] Respuesta tiene requiresMFA?:', data.hasOwnProperty('requiresMFA'));

            // ✅ PASO 5: Separar y guardar tokens
            if (!data.token) {
                throw new Error('No se recibió token del servidor');
            }

            const [accessToken, refreshToken] = data.token.split('|');
            
            if (!accessToken || !refreshToken) {
                throw new Error('Formato de token inválido del servidor');
            }

            console.log('💾 [NativeAuth] Guardando tokens...');
            authService.setTokens(accessToken, refreshToken);
            authService.scheduleTokenRefresh();
            
            const totalDuration = Date.now() - startTime;
            console.log(`✅ [NativeAuth] Autenticación completada exitosamente (${totalDuration}ms total)`);
            console.log('✅ [NativeAuth] Usuario autenticado:', JSON.stringify(data.user, null, 2));
            console.log('✅ [NativeAuth] Requiere MFA?:', data.requiresMFA || false);
            console.log('🚀 [NativeAuth] ========== FIN GOOGLE SIGN-IN EXITOSO ==========');

            // ✅ Retornar el formato esperado por los componentes
            return {
                success: true,
                user: data.user,
                requiresMFA: data.requiresMFA || false,
            };

        } catch (error: any) {
            const totalDuration = Date.now() - startTime;
            console.error('❌ [NativeAuth] ========== ERROR EN GOOGLE SIGN-IN ==========');
            console.error(`❌ [NativeAuth] Tiempo transcurrido: ${totalDuration}ms`);
            console.error('❌ [NativeAuth] Error en signInWithGoogle:', error);
            console.error('❌ [NativeAuth] Error tipo:', typeof error);
            console.error('❌ [NativeAuth] Error constructor:', error?.constructor?.name);
            console.error('❌ [NativeAuth] Error message:', error?.message);
            console.error('❌ [NativeAuth] Error name:', error?.name);
            console.error('❌ [NativeAuth] Error code:', error?.code);
            console.error('❌ [NativeAuth] Error stack:', error?.stack);
            if (error?.toString) {
                console.error('❌ [NativeAuth] Error toString:', error.toString());
            }
            if (error?.cause) {
                console.error('❌ [NativeAuth] Error cause:', error.cause);
            }
            console.error('❌ [NativeAuth] Error objeto completo:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
            console.error('🚀 [NativeAuth] ========== FIN ERROR GOOGLE SIGN-IN ==========');
            throw error;
        }
    }

    /**
     * Autenticación con Apple Sign In
     * Solo disponible en iOS y macOS
     */
    async signInWithApple(): Promise<{ success: boolean; user: any; requiresMFA: boolean }> {
        if (!this.isNative) {
            throw new Error('Apple Sign In is only available on native platforms');
        }

        try {
            // Verificar si Apple Sign In está disponible
            const isAvailable = await (SignInWithApple as any).isAvailable() as any;
            if (!isAvailable?.value) {
                throw new Error('Apple Sign In is not available on this device');
            }

            // 🛡️ Round 16: nonce literal (no hashear cliente — Apple lo envía sin hash en el JWT).
            // Si quieres hashear con SHA256, debes hacerlo aquí y enviar el hash, pero asegurar que
            // el backend espere el MISMO valor que Apple devuelve en el claim 'nonce'.
            const nonce = this.generateNonce();

            // Realizar login
            const result = await (SignInWithApple as any).authorize({
                clientId: 'com.inspecciono.app',
                redirectURI: 'https://inspecciono.com/auth/apple/callback',
                scopes: 'email name',
                state: 'apple-signin-state',
                nonce,
            }) as any;

            if (!result || !result.identityToken) {
                throw new Error('No token received from Apple');
            }

            // 🛡️ Round 16: fullName solo viene en el PRIMER login con Apple (decisión de Apple).
            // Si no viene, el backend ya tiene fallback "Usuario Apple".
            const fullName = result.fullName
                ? `${result.fullName.givenName || ''} ${result.fullName.familyName || ''}`.trim()
                : '';

            // ✅ Usar capacitorFetch para evitar CORS en Capacitor
            const { capacitorFetch } = await import('../utils/capacitorFetch');

            // 🛡️ Round 16: payload alineado con AppleAuthRequestDto (identityToken + authorizationCode + nonce + fullName).
            const response = await capacitorFetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.auth.appleAuth}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    identityToken: result.identityToken,
                    authorizationCode: result.authorizationCode || '',
                    nonce,
                    fullName,
                }),
            });

            if (!response.ok) {
                let errorMessage = 'Authentication failed';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorData.error || errorMessage;
                } catch {
                    errorMessage = `Authentication failed (${response.status})`;
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();

            if (!data.token || !data.user) {
                throw new Error('Invalid response from server');
            }

            // Guardar tokens
            const [accessToken, refreshToken] = data.token.split('|');
            if (!accessToken || !refreshToken) {
                throw new Error('Invalid token format from server');
            }

            authService.setTokens(accessToken, refreshToken);
            authService.scheduleTokenRefresh();

            return {
                success: true,
                user: data.user,
                requiresMFA: data.requiresMFA || false,
            };
        } catch (error: any) {
            console.error('Apple Sign In error:', error);
            throw error;
        }
    }

    /**
     * Cerrar sesión de Google
     */
    async signOutGoogle(): Promise<void> {
        if (this.isNative) {
            try {
                await (SocialLogin as any).signOut({ provider: 'google' });
            } catch (error) {
                console.error('Error signing out from Google:', error);
            }
        }
    }

    /**
     * Generar nonce para Apple Sign In
     */
    private generateNonce(): string {
        const array = new Uint8Array(16);
        crypto.getRandomValues(array);
        return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Decodificar JWT sin verificar (solo para obtener payload)
     */
    private decodeJWT(token: string): any {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split('')
                    .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            );
            return JSON.parse(jsonPayload);
        } catch (error) {
            console.error('Error decoding JWT:', error);
            return {};
        }
    }

    isNativePlatform(): boolean {
        const platform = Capacitor.getPlatform();
        return platform === 'android' || platform === 'ios';
    }
}

// Exportar como default y named para compatibilidad
const nativeAuthService = new NativeAuthService();
export default nativeAuthService;
export { nativeAuthService };
