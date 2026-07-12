import { useEffect, useCallback, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';
import { mfaService } from '../services/mfaService';
import { RoleChecker } from '../utils/roleChecker';
import { getUserId } from '../utils/userId';
import { MFAVerify } from './MFAVerify';
import { useNavigate } from 'react-router-dom';
import {
  ensureGoogleIdentityReady,
  logGoogleOriginHintOnce,
  renderGoogleButton,
} from '../lib/googleIdentity';
const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
);

export function GoogleAuth() {
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isReady, setIsReady] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [requiresMFA, setRequiresMFA] = useState(false);
    const { setUser } = useAuth();
    const navigate = useNavigate();

    const handleCredentialResponse = useCallback(async (response: any) => {
        try {
            setError(null);

            if (!response.credential) {
                throw new Error('No credential received from Google');
            }

            const result = await authService.googleAuth(response.credential);

            if (!result.success) {
                throw new Error('Authentication failed');
            }

            const uid = getUserId(result.user);
            const normalizedUser = { ...result.user, id: uid, Id: uid };
            setUser(normalizedUser);
            localStorage.setItem('userData', JSON.stringify(normalizedUser));

            // Verificar rol del usuario
            const token = authService.getAccessToken();
            if (!token) {
                throw new Error('No token received');
            }

            const userRole = RoleChecker.getUserRole(token);
            const requiresMfa = RoleChecker.requiresMfa(userRole);

            console.log('[GoogleAuth] User role:', userRole, 'Requires MFA:', requiresMfa);

            if (requiresMfa) {
                // Admin o Expert → Verificar si tiene MFA habilitado
                try {
                    console.log('[GoogleAuth] Checking MFA status...');
                    const mfaStatus = await mfaService.getMFAStatus();
                    console.log('[GoogleAuth] MFA Status:', mfaStatus);
                    
                    if (!mfaStatus.isEnabled) {
                        console.log('[GoogleAuth] MFA not enabled, but MFA is no longer mandatory');
                        // ✅ DESACTIVADO: MFA ya no es obligatorio
                        // ⚠️ MFA requerido pero NO configurado → Redirigir a setup
                        // navigate('/mfa/setup-required', {
                        //     state: { 
                        //         reason: 'required_for_role',
                        //         firstLogin: true 
                        //     }
                        // });
                        // return;
                        // Continuar sin MFA - No redirigir automáticamente
                        // El usuario puede hacer clic en "Mis revisiones" si quiere ir a /busquedas
                        return;
                    }
                    
                    // ✅ MFA configurado → Solicitar verificación
                    console.log('[GoogleAuth] MFA is enabled, showing verification screen');
                    setRequiresMFA(true);
                    return;
                } catch (error: any) {
                    // ✅ DESACTIVADO: MFA ya no es obligatorio
                    // Si el error es 404, significa que MFA no está configurado
                    if (error?.response?.status === 404 || error?.message?.includes('404')) {
                        // navigate('/mfa/setup-required', {
                        //     state: { 
                        //         reason: 'required_for_role',
                        //         firstLogin: true 
                        //     }
                        // });
                        // return;
                        // Continuar sin MFA
                        console.log('[GoogleAuth] MFA not configured, but MFA is no longer mandatory');
                        navigate('/hires');
                        return;
                    }
                    
                    // Si el error es 429 (rate limiting), intentar usar caché o asumir que MFA está configurado
                    if (error?.message?.includes('429') || error?.message?.includes('Too Many Requests') || error?.message?.includes('Rate limited')) {
                        console.warn('[GoogleAuth] Rate limited during MFA check, assuming MFA is configured and showing verification');
                        // Si hay rate limiting, asumir que MFA está configurado y mostrar verificación
                        // Esto es más seguro que bloquear al usuario
                        setRequiresMFA(true);
                        return;
                    }
                    
                    // Otro error → Continuar con verificación MFA si result.requiresMFA
                    if (result.requiresMFA) {
                        setRequiresMFA(true);
                        return;
                    }
                    
                    // ✅ DESACTIVADO: MFA ya no es obligatorio
                    // Si no hay result.requiresMFA y hay otro error, redirigir a setup por seguridad
                    console.warn('Error checking MFA status, but MFA is no longer mandatory:', error);
                    // navigate('/mfa/setup-required', {
                    //     state: { 
                    //         reason: 'error_checking_status',
                    //         firstLogin: true 
                    //     }
                    // });
                    // return;
                    // Continuar sin MFA - No redirigir automáticamente
                    // El usuario puede hacer clic en "Mis revisiones" si quiere ir a /busquedas
                    return;
                }
            }

            // Si result.requiresMFA es true (usuario con MFA habilitado pero no Admin/Expert)
            if (result.requiresMFA) {
                console.log('[GoogleAuth] Backend indicates MFA required, showing verification');
                setRequiresMFA(true);
            } else {
                // Cliente o login sin MFA → No redirigir automáticamente
                console.log('[GoogleAuth] No MFA required, staying on current page');
                // El usuario puede hacer clic en "Mis revisiones" si quiere ir a /busquedas
            }
        } catch (error: any) {
            let message = error instanceof Error ? error.message : 'Authentication failed';
            console.error('[GoogleAuth] Error during authentication:', error);
            
            // ✅ BEST PRACTICE: Detectar errores específicos y mostrar mensajes más claros
            if (error?.response?.status === 429 || error?.message?.includes('429') || error?.message?.includes('Too Many Requests')) {
                message = 'Demasiadas solicitudes. Por favor espera unos momentos antes de intentar de nuevo.';
            } else if (error?.response?.status === 403 || message.includes('403')) {
                message = 'Error de configuración de Google OAuth. Por favor contacta al administrador.';
            } else if (message.includes('Client ID') || message.includes('untrusted') || message.includes("'aud' claim")) {
                message = 'Error de configuración: El Client ID de Google OAuth no coincide. Por favor contacta al administrador.';
            } else if (message.includes('Authentication failed') || message.includes('Invalid Google token')) {
                // Si el error viene del backend, intentar obtener el mensaje específico
                const backendMessage = error?.response?.data?.message || error?.data?.message;
                if (backendMessage) {
                    message = backendMessage;
                }
            }
            
            setError(message);
        }
    }, [setUser, navigate]);

    const handleMFASuccess = () => {
        // MFA verificado → Actualizar usuario y continuar
        const userData = localStorage.getItem('userData');
        if (userData) {
            setUser(JSON.parse(userData));
        }
        setRequiresMFA(false);
        // No redirigir automáticamente después de verificar MFA
        // El usuario puede hacer clic en "Mis revisiones" si quiere ir a /busquedas
    };

    const handleMFACancel = () => {
        // Cancelar MFA → Logout y volver al login
        authService.logout();
        setRequiresMFA(false);
        setUser(null);
    };

    if (requiresMFA) {
        console.log('[GoogleAuth] Rendering MFAVerify component');
        return (
            <div className="flex items-center justify-center min-h-screen bg-background p-4">
                <div className="w-full max-w-md">
                    <MFAVerify onSuccess={handleMFASuccess} onCancel={handleMFACancel} />
                </div>
            </div>
        );
    }

    // Detectar cuando el componente es visible
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    setIsVisible(entry.isIntersecting);
                });
            },
            { threshold: 0.1 }
        );

        const element = document.getElementById('googleButton');
        if (element) {
            observer.observe(element);
        }

        return () => {
            if (element) {
                observer.unobserve(element);
            }
        };
    }, []);

    useEffect(() => {
        if (!isVisible) {
            return;
        }

        let cancelled = false;

        const mountButton = async () => {
            const buttonElement = document.getElementById('googleButton');
            if (!buttonElement) return;

            const ready = await ensureGoogleIdentityReady();
            if (cancelled) return;

            if (!ready) {
                logGoogleOriginHintOnce();
                setIsLoading(false);
                setError('No se pudo cargar Google Sign-In. Intenta recargar la página.');
                return;
            }

            renderGoogleButton(buttonElement, {
                type: 'standard',
                theme: 'outline',
                size: 'medium',
                text: 'signin_with',
                width: 250,
            });

            window.setTimeout(() => {
                if (cancelled) return;
                const renderedButton = buttonElement.querySelector('div[role="button"]');
                const clickable = renderedButton?.getAttribute('aria-disabled') !== 'true';
                if (renderedButton && clickable) {
                    setIsReady(true);
                    setIsLoading(false);
                    setError(null);
                } else {
                    setIsReady(false);
                    setIsLoading(false);
                    setError('No se pudo cargar Google Sign-In. Intenta recargar la página.');
                }
            }, 300);
        };

        void mountButton();

        return () => {
            cancelled = true;
            setIsReady(false);
            setIsLoading(true);
        };
    }, [isVisible]);

    const handleGoogleSignIn = () => {
        if (!isReady) {
            setError('Google Sign-In aún no está listo. Inténtalo de nuevo en unos segundos.');
            return;
        }

        // Clear any previous errors
        setError(null);

        try {
            // Multiple fallback attempts for mobile compatibility
            const buttonContainer = document.getElementById('googleButton');
            if (!buttonContainer) {
                throw new Error('Button container not found');
            }

            // Try different selectors for the Google button
            const selectors = [
                'div[role="button"]:not([aria-disabled="true"])',
                'div[role="button"]',
                'button:not([disabled])',
                'button',
                '[data-idom-class*="VfPpkd"]',
                'div[jsaction]'
            ];

            let clicked = false;
            for (const selector of selectors) {
                const googleButton = buttonContainer.querySelector(selector) as HTMLElement;
                if (googleButton && googleButton.offsetParent !== null) { // Check if element is visible
                    console.log('Clicking Google button with selector:', selector);
                    
                    // Ensure the button is not disabled
                    const isDisabled = googleButton.getAttribute('aria-disabled') === 'true' || 
                                     (googleButton as HTMLButtonElement).disabled;
                    
                    if (!isDisabled) {
                        // Create and dispatch multiple event types for maximum compatibility
                        const events = ['mousedown', 'mouseup', 'click'];
                        events.forEach(eventType => {
                            const event = new MouseEvent(eventType, {
                                bubbles: true,
                                cancelable: true,
                                view: window
                            });
                            googleButton.dispatchEvent(event);
                        });
                        
                        // Also try direct click
                        googleButton.click();
                        
                        // For mobile, try touch events
                        if ('ontouchstart' in window) {
                            const touchEvents = ['touchstart', 'touchend'];
                            touchEvents.forEach(eventType => {
                                const touchEvent = new TouchEvent(eventType, {
                                    bubbles: true,
                                    cancelable: true
                                });
                                googleButton.dispatchEvent(touchEvent);
                            });
                        }
                        
                        clicked = true;
                        break;
                    }
                }
            }

            if (!clicked) {
                // Try to trigger Google's prompt directly as fallback
                if (window.google?.accounts?.id?.prompt) {
                    console.log('Trying direct Google prompt as fallback');
                    window.google.accounts.id.prompt();
                    clicked = true;
                } else {
                    throw new Error('Google button not found, not clickable, or not visible');
                }
            }
        } catch (error) {
            console.error('Failed to trigger Google Sign-In:', error);
            setError('Error al iniciar sesión. Por favor, recarga la página e inténtalo de nuevo.');
        }
    };

    return (
        <div className="relative w-full">
            {/* Hidden native Google button for functionality */}
            <div id="googleButton" style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', zIndex: -1 }}></div>
            
            {/* Custom styled button optimized for mobile */}
            <button
                onClick={handleGoogleSignIn}
                disabled={isLoading || !isReady}
                className={`group inline-flex items-center justify-center gap-3 px-6 py-3.5 sm:py-3 rounded-lg font-semibold text-base transition-all duration-300 shadow-lg hover:shadow-xl w-full ${
                    isLoading 
                        ? 'bg-gray-400 cursor-not-allowed text-white' 
                        : !isReady 
                            ? 'bg-yellow-500 cursor-wait text-white'
                            : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
                }`}
                title={!isReady ? 'Preparando Google Sign-In...' : 'Iniciar sesión con Google'}
            >
                {isLoading ? (
                    <>
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        <span>Cargando...</span>
                    </>
                ) : !isReady ? (
                    <>
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        <span>Preparando...</span>
                    </>
                ) : (
                    <>
                        <GoogleIcon />
                        <span>Iniciar sesión con Google</span>
                    </>
                )}
            </button>
            
            {error && (
                <p className="text-red-500 text-sm mt-2 text-center">{error}</p>
            )}
        </div>
    );
}