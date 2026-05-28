import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { nativeAuthService } from '../services/nativeAuthService';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import {
  ensureGoogleIdentityReady,
  logGoogleOriginHintOnce,
  renderGoogleButton,
  subscribeGoogleAuthSuccess,
} from '../lib/googleIdentity';
const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
);

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
        if (isNative) {
            setIsReady(true);
            return;
        }

        let cancelled = false;

        const mountButton = async () => {
            if (!buttonRef.current) return;

            const ready = await ensureGoogleIdentityReady();
            if (cancelled || !buttonRef.current) return;

            if (!ready) {
                logGoogleOriginHintOnce();
                return;
            }

            renderGoogleButton(buttonRef.current, {
                type: 'standard',
                theme: 'outline',
                size: variant === 'compact' ? 'medium' : 'large',
                text: 'signin_with',
            });

            window.setTimeout(() => {
                if (cancelled) return;
                const renderedButton = buttonRef.current?.querySelector('div[role="button"]');
                setIsReady(!!renderedButton);
            }, 150);
        };

        void mountButton();

        const unsubscribeSuccess = subscribeGoogleAuthSuccess(() => {
            onSuccess?.();
        });

        return () => {
            cancelled = true;
            unsubscribeSuccess();
        };
    }, [variant, isNative, onSuccess]);

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

