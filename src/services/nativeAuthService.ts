import { Capacitor } from '@capacitor/core';
import { SocialLogin } from '@capgo/capacitor-social-login';
import { SignInWithApple } from '@capacitor-community/apple-sign-in';
import { jwtDecode } from 'jwt-decode';
import { authService } from './authService';
import { API_CONFIG } from '../config/api';

// ⚠️ IMPORTANTE: Usar el Web Client ID correcto
const googleWebClientId = '61603823707-qdtl859lc1cktfh8m77ppl1brtdkndsv.apps.googleusercontent.com';

const initConfig = {
    google: {
        webClientId: googleWebClientId.trim(),
    },
};

class NativeAuthService {
    private isNative = Capacitor.isNativePlatform();
    
    async signInWithGoogle(): Promise<void> {
        try {
            console.log('🚀 [NativeAuth] Iniciando Google Sign-In...');

            // ✅ PASO 1: Inicializar el plugin
            await (SocialLogin as any).initialize(initConfig);
            console.log('✅ [NativeAuth] Plugin inicializado con Web Client ID');

            // ✅ PASO 2: Realizar login
            const loginResult = await (SocialLogin as any).login({
                provider: 'google',
                options: {
                    filterByAuthorizedAccounts: false,
                    scopes: ['profile', 'email'],
                },
            });

            console.log('✅ [NativeAuth] Login exitoso');
            console.log('📦 [NativeAuth] Result completo:', loginResult);

            const result = loginResult.result;
            
            if (!result || !result.idToken) {
                throw new Error('No se recibió idToken de Google');
            }

            console.log('🔑 [NativeAuth] idToken recibido:', result.idToken.substring(0, 50) + '...');

            // ✅ PASO 3: Decodificar el idToken para extraer información
            let decoded: any;
            try {
                decoded = jwtDecode(result.idToken);
                console.log('✅ [NativeAuth] Token decodificado:', {
                    email: decoded.email,
                    name: decoded.name,
                    sub: decoded.sub,
                    aud: decoded.aud,
                });
            } catch (error) {
                console.error('❌ [NativeAuth] Error decodificando token:', error);
                throw new Error('Invalid token format from Google');
            }

            // ✅ PASO 4: Enviar al backend EN EL MISMO FORMATO QUE WEB
            console.log('📡 [NativeAuth] Enviando al backend...');
            
            const response = await fetch(
                `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.auth.googleAuth}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify({
                        accessToken: result.idToken,  // ✅ Mismo nombre que web
                        email: decoded.email || '',
                        name: decoded.name || decoded.given_name || '',
                        googleId: decoded.sub || '',
                    }),
                }
            );

            console.log('📡 [NativeAuth] Response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ [NativeAuth] Error del servidor:', errorText);
                
                let errorData;
                try {
                    errorData = JSON.parse(errorText);
                } catch {
                    errorData = { message: errorText };
                }
                
                throw new Error(errorData.message || 'Authentication failed');
            }

            const data = await response.json();
            console.log('✅ [NativeAuth] Respuesta del backend:', data);

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
            
            console.log('✅ [NativeAuth] Autenticación completada exitosamente');

        } catch (error: any) {
            console.error('❌ [NativeAuth] Error en signInWithGoogle:', error);
            console.error('❌ [NativeAuth] Error stack:', error.stack);
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

            // Realizar login
            const result = await (SignInWithApple as any).authorize({
                clientId: 'com.inspecciono.app',
                redirectURI: 'https://inspecciono.com/auth/apple/callback',
                scopes: 'email name',
                state: 'apple-signin-state',
                nonce: this.generateNonce(),
            }) as any;

            if (!result || !result.identityToken) {
                throw new Error('No token received from Apple');
            }

            // Decodificar el token para obtener información del usuario
            const tokenPayload = this.decodeJWT(result.identityToken);
            const email = result.email || tokenPayload.email || '';
            const name = result.fullName
                ? `${result.fullName.givenName || ''} ${result.fullName.familyName || ''}`.trim()
                : tokenPayload.email?.split('@')[0] || '';

            // ✅ Usar capacitorFetch para evitar CORS en Capacitor
            const { capacitorFetch } = await import('../utils/capacitorFetch');
            
            // Enviar al backend
            const response = await capacitorFetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.auth.appleAuth}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    identityToken: result.identityToken,
                    authorizationCode: result.authorizationCode || '',
                    email: email,
                    name: name,
                    appleId: tokenPayload.sub || '',
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

export default new NativeAuthService();
