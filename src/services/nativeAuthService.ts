import { Capacitor } from '@capacitor/core';
import { SocialLogin } from '@capgo/capacitor-social-login';
import { SignInWithApple } from '@capacitor-community/apple-sign-in';
import { authService } from './authService';
import { API_CONFIG } from '../config/api';

/**
 * Servicio de autenticación nativa para Capacitor
 * Detecta automáticamente si está en web o nativo y usa el método apropiado
 */
class NativeAuthService {
    private isNative = Capacitor.isNativePlatform();

    /**
     * Autenticación con Google
     * Usa OAuth nativo en móviles, web OAuth en navegador
     */
    async signInWithGoogle(): Promise<{ success: boolean; user: any; requiresMFA: boolean }> {
        if (this.isNative) {
            return this.signInWithGoogleNative();
        } else {
            // En web, el componente GoogleSignInButton maneja esto
            throw new Error('Use GoogleSignInButton component for web authentication');
        }
    }

    /**
     * Autenticación nativa con Google (Android/iOS)
     */
    private async signInWithGoogleNative(): Promise<{ success: boolean; user: any; requiresMFA: boolean }> {
        try {
            // ✅ Inicializar el plugin con el formato correcto
            // El plugin @capgo/capacitor-social-login espera 'webClientId' para Android, no 'clientId'
            const googleWebClientId = '61603823707-qdtl859lc1cktfh8m77ppl1brtdkndsv.apps.googleusercontent.com';
            
            console.log('🔧 [NativeAuth] Inicializando SocialLogin con webClientId:', googleWebClientId);
            
            // Verificar que el webClientId no esté vacío antes de inicializar
            if (!googleWebClientId || googleWebClientId.trim().length === 0) {
                throw new Error('Google Web Client ID is empty or undefined');
            }
            
            // ✅ El plugin espera 'webClientId' para Android (según documentación)
            const initConfig = {
                google: {
                    webClientId: googleWebClientId.trim(), // ✅ Cambiar de 'clientId' a 'webClientId'
                },
            };
            
            console.log('🔧 [NativeAuth] Configuración de inicialización:', JSON.stringify(initConfig));
            
            await (SocialLogin as any).initialize(initConfig);
            
            console.log('✅ [NativeAuth] SocialLogin inicializado correctamente');

            // ✅ Realizar login - El método correcto es 'login()', no 'signIn()'
            // El plugin espera: { provider: 'google', options: GoogleLoginOptions }
            const loginResult = await (SocialLogin as any).login({
                provider: 'google',
                options: {}, // Opciones vacías por defecto, o puedes agregar scopes, etc.
            }) as any;
            
            console.log('✅ [NativeAuth] Login exitoso:', loginResult);
            
            // El resultado tiene la estructura: { provider: 'google', result: GoogleLoginResponse }
            const result = loginResult.result;

            if (!result || !result.idToken) {
                throw new Error('No token received from Google');
            }

            // ✅ Usar capacitorFetch para evitar CORS en Capacitor
            const { capacitorFetch } = await import('../utils/capacitorFetch');
            
            // Enviar el token al backend (mismo formato que web - el backend espera 'credential' como JWT)
            const response = await capacitorFetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.auth.googleAuth}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    credential: result.idToken, // El backend espera 'credential' con el JWT
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
            console.error('Google native auth error:', error);
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

    /**
     * Verificar si está en plataforma nativa
     */
    isNativePlatform(): boolean {
        return this.isNative;
    }
}

export const nativeAuthService = new NativeAuthService();
