import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

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
    const { setUser } = useAuth();
    const navigate = useNavigate();
    const buttonRef = useRef<HTMLDivElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Inicializar Google Auth cuando el componente se monta
        const initGoogleAuth = () => {
            if (window.google?.accounts?.id && buttonRef.current) {
                const clientId = '61603823707-4vsp43naifci8t893hdc276kkhbvn49a.apps.googleusercontent.com';
                
                window.google.accounts.id.initialize({
                    client_id: clientId,
                    callback: async (response: any) => {
                        try {
                            if (!response.credential) {
                                throw new Error('No credential received from Google');
                            }

                            const result = await authService.googleAuth(response.credential);
                            
                            if (!result.success) {
                                throw new Error('Authentication failed');
                            }

                            setUser(result.user);
                            localStorage.setItem('userData', JSON.stringify(result.user));
                            
                            // Redirigir según el rol
                            const token = authService.getAccessToken();
                            if (token) {
                                const { RoleChecker } = await import('../utils/roleChecker');
                                const userRole = RoleChecker.getUserRole(token);
                                const requiresMfa = RoleChecker.requiresMfa(userRole);
                                
                                if (requiresMfa) {
                                    const { mfaService } = await import('../services/mfaService');
                                    try {
                                        const mfaStatus = await mfaService.getMFAStatus();
                                        if (mfaStatus.isEnabled) {
                                            navigate('/mfa/verify', { state: { returnTo: '/busquedas' } });
                                            return;
                                        }
                                    } catch (error) {
                                        console.error('Error checking MFA status:', error);
                                    }
                                }
                            }
                            
                            // Llamar callback si existe
                            if (onSuccess) {
                                onSuccess();
                            } else {
                                navigate('/busquedas');
                            }
                        } catch (error) {
                            console.error('Error during Google authentication:', error);
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
                        width: variant === 'compact' ? undefined : '100%',
                    });

                    // Esperar a que el botón se renderice
                    setTimeout(() => {
                        const renderedButton = buttonRef.current?.querySelector('div[role="button"]');
                        if (renderedButton) {
                            setIsReady(true);
                        }
                    }, 300);
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
    }, [setUser, navigate, onSuccess, variant]);

    // Para la variante compact, necesitamos ocultar el botón nativo y mostrar uno personalizado
    const handleCustomClick = () => {
        if (!isReady || !buttonRef.current) {
            console.warn('Google Sign-In not ready yet');
            return;
        }

        // Hacer clic en el botón renderizado de Google
        const googleButton = buttonRef.current.querySelector('div[role="button"]') as HTMLElement;
        if (googleButton) {
            googleButton.click();
        }
    };

    // Si es compact, mostrar botón personalizado que activa el botón nativo oculto
    if (variant === 'compact') {
        return (
            <div className="relative" ref={wrapperRef}>
                {/* Botón nativo de Google oculto */}
                <div ref={buttonRef} className="absolute opacity-0 pointer-events-none" style={{ width: '1px', height: '1px', overflow: 'hidden' }}></div>
                {/* Botón personalizado visible */}
                <button
                    onClick={handleCustomClick}
                    disabled={!isReady}
                    className={`h-9 px-4 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-white hover:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition-all duration-200 border border-gray-300 dark:border-gray-700 hover:border-blue-600 dark:hover:border-blue-500 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
                >
                    <GoogleIcon />
                    <span>Iniciar Sesión</span>
                </button>
            </div>
        );
    }

    // Para la variante default, mostrar el botón nativo directamente
    return (
        <div ref={buttonRef} className={`w-full ${className}`}></div>
    );
};

