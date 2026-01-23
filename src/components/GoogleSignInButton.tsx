import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { nativeAuthService } from '../services/nativeAuthService';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

// Google SVG Icon Component
const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
);

// Declaración de tipos para Google Sign-In
declare global {
    interface Window {
        google?: {
            accounts: {
                id: {
                    initialize: (config: any) => void;
                    renderButton: (element: HTMLElement, config: any) => void;
                    prompt: () => void;
                };
            };
        };
    }
}

interface GoogleSignInButtonProps {
    className?: string;
    variant?: 'default' | 'compact';
    onSuccess?: () => void;
}

export const GoogleSignInButton = ({ className = '', variant = 'default', onSuccess }: GoogleSignInButtonProps) => {
    const [isReady, setIsReady] = useState(false);
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [authStep, setAuthStep] = useState<string>('');
    const { updateUser } = useAuth();
    const navigate = useNavigate();
    const buttonRef = useRef<HTMLDivElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const isNative = Capacitor.isNativePlatform();

    useEffect(() => {
        // Si es nativo, no necesitamos inicializar Google web
        if (isNative) {
            setIsReady(true);
            return;
        }
        
        // Inicializar Google Auth cuando el componente se monta
        const initGoogleAuth = () => {
            if (window.google?.accounts?.id && buttonRef.current) {
                const clientId = '61603823707-4vsp43naifci8t893hdc276kkhbvn49a.apps.googleusercontent.com';
                
                window.google.accounts.id.initialize({
                    client_id: clientId,
                    callback: async (response: any) => {
                        try {
                            setIsAuthenticating(true);
                            setAuthStep('Verificando credenciales de Google...');
                            console.log('🔐 [GoogleSignIn] Paso 1: Credencial recibida de Google');
                            
                            if (!response.credential) {
                                throw new Error('No credential received from Google');
                            }

                            setAuthStep('Autenticando con el servidor...');
                            console.log('🔐 [GoogleSignIn] Paso 2: Enviando credencial al backend');
                            const result = await authService.googleAuth(response.credential);
                            
                            if (!result.success) {
                                throw new Error('Authentication failed');
                            }
                            console.log('✅ [GoogleSignIn] Paso 3: Autenticación exitosa');

                            setAuthStep('Obteniendo información del usuario...');
                            // Obtener el token después de la autenticación
                            const token = authService.getAccessToken();
                            
                            setAuthStep('Configurando sesión...');
                            console.log('🔐 [GoogleSignIn] Paso 4: Actualizando contexto de usuario');
                            // Actualizar usuario y token usando updateUser del contexto
                            // Esto asegura que tanto el usuario como el token se guarden correctamente
                            updateUser(result.user, token, () => {
                                // Callback después de actualizar usuario y token
                                console.log('✅ [GoogleSignIn] Paso 5: Usuario y token actualizados');
                            });
                            
                            // Verificar MFA solo si es necesario (optimización)
                            if (token) {
                                setAuthStep('Verificando seguridad...');
                                console.log('🔐 [GoogleSignIn] Paso 6: Verificando MFA si es necesario');
                                // Verificar MFA de forma más eficiente
                                const { RoleChecker } = await import('../utils/roleChecker');
                                const userRole = RoleChecker.getUserRole(token);
                                const requiresMfa = RoleChecker.requiresMfa(userRole);
                                
                                if (requiresMfa) {
                                    // Solo verificar MFA si el rol lo requiere
                                    const { mfaService } = await import('../services/mfaService');
                                    try {
                                        const mfaStatus = await mfaService.getMFAStatus();
                                        if (mfaStatus.isEnabled && !mfaStatus.isVerified) {
                                            setAuthStep('Redirigiendo a verificación MFA...');
                                            navigate('/mfa/verify', { state: { returnTo: null } });
                                            return;
                                        }
                                    } catch (error) {
                                        console.error('Error checking MFA status:', error);
                                        // Continuar con el flujo normal si hay error en MFA
                                    }
                                }
                            }
                            
                            setAuthStep('¡Inicio de sesión exitoso!');
                            console.log('✅ [GoogleSignIn] Paso 7: Proceso completado');
                            // No mostrar notificación de bienvenida
                            
                            // Llamar callback si existe
                            if (onSuccess) {
                                onSuccess();
                            }
                            // No redirigir automáticamente después del login
                            // El usuario puede hacer clic en "Mis revisiones" si quiere ir a /busquedas
                        } catch (error: any) {
                            console.error('❌ [GoogleSignIn] Error durante autenticación:', error);
                            const errorMessage = error?.message || 'Error al iniciar sesión. Inténtalo de nuevo.';
                            toast.error(errorMessage, { duration: 5000 });
                            setAuthStep('');
                        } finally {
                            setIsAuthenticating(false);
                        }
                    },
                    auto_select: false,
                    cancel_on_tap_outside: false,
                });

                // Limpiar el contenedor antes de renderizar
                if (buttonRef.current) {
                    buttonRef.current.innerHTML = '';
                    
                    // Renderizar el botón nativo de Google (igual que en el paso 2)
                    window.google.accounts.id.renderButton(buttonRef.current, {
                        type: 'standard',
                        theme: 'outline',
                        size: variant === 'compact' ? 'medium' : 'large',
                        text: 'signin_with',
                        // No pasar width si es 100%, Google Sign-In no lo acepta
                        width: variant === 'compact' ? undefined : undefined,
                    });

                    // Esperar a que el botón se renderice (reducido de 300ms a 100ms)
                    setTimeout(() => {
                        const renderedButton = buttonRef.current?.querySelector('div[role="button"]');
                        if (renderedButton) {
                            setIsReady(true);
                        } else {
                            // Reintentar una vez más si no está listo
                            setTimeout(() => {
                                const retryButton = buttonRef.current?.querySelector('div[role="button"]');
                                if (retryButton) {
                                    setIsReady(true);
                                }
                            }, 200);
                        }
                    }, 100);
                }
            } else {
                // Reintentar después de un delay
                setTimeout(initGoogleAuth, 500);
            }
        };

        // Cargar script de Google si no está cargado
        let checkInterval: NodeJS.Timeout | null = null;
        let retryTimeout: NodeJS.Timeout | null = null;
        
        if (!window.google?.accounts?.id) {
            // Verificar si el script ya está en el DOM
            const existingScript = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
            if (!existingScript) {
                const script = document.createElement('script');
                script.src = 'https://accounts.google.com/gsi/client';
                script.async = true;
                script.defer = true;
                script.onload = () => {
                    setTimeout(initGoogleAuth, 100);
                };
                script.onerror = () => {
                    console.error('Failed to load Google Sign-In script');
                };
                document.head.appendChild(script);
            } else {
                // Script ya existe, esperar a que cargue
                checkInterval = setInterval(() => {
                    if (window.google?.accounts?.id) {
                        if (checkInterval) clearInterval(checkInterval);
                        initGoogleAuth();
                    }
                }, 100);
                
                // Timeout después de 10 segundos
                setTimeout(() => {
                    if (checkInterval) clearInterval(checkInterval);
                }, 10000);
            }
        } else {
            // Script ya está cargado, inicializar directamente
            initGoogleAuth();
        }

        return () => {
            if (checkInterval) clearInterval(checkInterval);
            if (retryTimeout) clearTimeout(retryTimeout);
        };
    }, [updateUser, navigate, onSuccess, variant, isNative]);

    // Función para autenticación nativa
    const handleNativeSignIn = async () => {
        try {
            setIsAuthenticating(true);
            setAuthStep('Iniciando sesión con Google...');
            
            const result = await nativeAuthService.signInWithGoogle();
            
            if (!result.success) {
                throw new Error('Authentication failed');
            }
            
            setAuthStep('Configurando sesión...');
            const token = authService.getAccessToken();
            
            updateUser(result.user, token, () => {
                console.log('✅ [GoogleSignIn Native] Usuario y token actualizados');
            });
            
            // Verificar MFA si es necesario
            if (token) {
                setAuthStep('Verificando seguridad...');
                const { RoleChecker } = await import('../utils/roleChecker');
                const userRole = RoleChecker.getUserRole(token);
                const requiresMfa = RoleChecker.requiresMfa(userRole);
                
                if (requiresMfa) {
                    const { mfaService } = await import('../services/mfaService');
                    try {
                        const mfaStatus = await mfaService.getMFAStatus();
                        if (mfaStatus.isEnabled && !mfaStatus.isVerified) {
                            setAuthStep('Redirigiendo a verificación MFA...');
                            navigate('/mfa/verify', { state: { returnTo: null } });
                            return;
                        }
                    } catch (error) {
                        console.error('Error checking MFA status:', error);
                    }
                }
            }
            
            setAuthStep('¡Inicio de sesión exitoso!');
            if (onSuccess) {
                onSuccess();
            }
        } catch (error: any) {
            console.error('❌ [GoogleSignIn Native] Error:', error);
            const errorMessage = error?.message || 'Error al iniciar sesión. Inténtalo de nuevo.';
            toast.error(errorMessage, { duration: 5000 });
            setAuthStep('');
        } finally {
            setIsAuthenticating(false);
        }
    };

    // Función para hacer clic en el botón renderizado de Google (igual que en el paso 2)
    const handleCustomClick = () => {
        // Si es nativo, usar autenticación nativa
        if (isNative) {
            handleNativeSignIn();
            return;
        }
        
        if (!isReady || !buttonRef.current) {
            console.warn('Google Sign-In not ready yet');
            return;
        }

        // Buscar el botón renderizado de Google (igual que en ServiceReviewPage)
        const googleButton = buttonRef.current.querySelector('div[role="button"]') as HTMLElement;
        if (googleButton) {
            // Crear y dispatchar eventos para máxima compatibilidad (especialmente en móvil)
            const events = ['mousedown', 'mouseup', 'click'];
            events.forEach(eventType => {
                const event = new MouseEvent(eventType, {
                    bubbles: true,
                    cancelable: true,
                    view: window
                });
                googleButton.dispatchEvent(event);
            });
            
            // También hacer clic directo
            googleButton.click();
            
            // Para móvil, intentar eventos táctiles también
            if ('ontouchstart' in window) {
                const touchEvents = ['touchstart', 'touchend'];
                touchEvents.forEach(eventType => {
                    try {
                        const touchEvent = new TouchEvent(eventType, {
                            bubbles: true,
                            cancelable: true
                        } as TouchEventInit);
                        googleButton.dispatchEvent(touchEvent);
                    } catch (e) {
                        // TouchEvent puede no estar disponible en algunos navegadores
                    }
                });
            }
        } else {
            // Fallback: usar prompt si el botón no está disponible
            if (window.google?.accounts?.id?.prompt) {
                window.google.accounts.id.prompt();
            }
        }
    };

    // Para ambas variantes, usar botón personalizado que activa el botón nativo oculto
    // Esto asegura que funcione correctamente incluso cuando el componente está oculto inicialmente
    const compactClasses = 'h-9 px-4 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-white hover:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition-all duration-200 border border-gray-300 dark:border-gray-700 hover:border-blue-600 dark:hover:border-blue-500 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed';
    const defaultClasses = 'w-full bg-white text-gray-900 font-semibold py-4 px-6 rounded-xl text-base transition-colors border-2 border-gray-200 hover:border-gray-300 active:bg-gray-50 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed';

    return (
        <div className="relative" ref={wrapperRef}>
            {/* Botón nativo de Google oculto - siempre renderizado para funcionalidad */}
            <div 
                ref={buttonRef} 
                className="absolute opacity-0 pointer-events-none" 
                style={{ 
                    position: 'absolute', 
                    opacity: 0, 
                    pointerEvents: 'none', 
                    zIndex: -1,
                    width: variant === 'compact' ? '1px' : '100%',
                    height: variant === 'compact' ? '1px' : 'auto',
                    overflow: 'hidden'
                }}
            ></div>
            {/* Botón personalizado visible */}
            <button
                onClick={handleCustomClick}
                disabled={!isReady || isAuthenticating}
                className={`${variant === 'compact' ? compactClasses : defaultClasses} ${className} ${isAuthenticating ? 'opacity-75 cursor-wait' : ''}`}
            >
                {isAuthenticating ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="flex items-center gap-1">
                            <span className="loading-dot" style={{ animationDelay: '0ms' }}>.</span>
                            <span className="loading-dot" style={{ animationDelay: '150ms' }}>.</span>
                            <span className="loading-dot" style={{ animationDelay: '300ms' }}>.</span>
                        </span>
                    </>
                ) : (
                    <>
                        <GoogleIcon />
                        <span>Iniciar Sesión</span>
                    </>
                )}
            </button>
            <style>{`
                .loading-dot {
                    display: inline-block;
                    animation: wave 1.4s ease-in-out infinite;
                    font-size: 1.2em;
                    line-height: 1;
                }
                @keyframes wave {
                    0%, 60%, 100% {
                        transform: translateY(0);
                        opacity: 0.7;
                    }
                    30% {
                        transform: translateY(-10px);
                        opacity: 1;
                    }
                }
            `}</style>
        </div>
    );
};

