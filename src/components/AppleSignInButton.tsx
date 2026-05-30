import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { nativeAuthService } from '../services/nativeAuthService';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface AppleSignInButtonProps {
    className?: string;
    variant?: 'default' | 'compact';
    onSuccess?: () => void;
}

// Apple SVG Icon Component
const AppleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
    </svg>
);

export const AppleSignInButton = ({ className = '', variant = 'default', onSuccess }: AppleSignInButtonProps) => {
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [authStep, setAuthStep] = useState<string>('');
    const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
    const { updateUser } = useAuth();
    const navigate = useNavigate();
    const isNative = Capacitor.isNativePlatform();

    // Verificar disponibilidad de Apple Sign In
    useEffect(() => {
        const checkAvailability = async () => {
            if (!isNative) {
                setIsAvailable(false);
                return;
            }

            try {
                const { SignInWithApple } = await import('@capacitor-community/apple-sign-in');
                const result = await SignInWithApple.isAvailable();
                setIsAvailable(result.value);
            } catch (error) {
                console.error('Error checking Apple Sign In availability:', error);
                setIsAvailable(false);
            }
        };

        checkAvailability();
    }, [isNative]);

    const handleAppleSignIn = async () => {
        if (!isNative) {
            toast.error('Apple Sign In solo está disponible en dispositivos iOS y macOS');
            return;
        }

        if (isAvailable === false) {
            toast.error('Apple Sign In no está disponible en este dispositivo');
            return;
        }

        try {
            setIsAuthenticating(true);
            setAuthStep('Iniciando sesión con Apple...');
            
            const result = await nativeAuthService.signInWithApple();
            
            if (!result.success) {
                throw new Error('Authentication failed');
            }
            
            setAuthStep('Configurando sesión...');
            const token = authService.getAccessToken();
            
            updateUser(result.user, token, () => {
                console.log('✅ [AppleSignIn] Usuario y token actualizados');
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
            console.error('❌ [AppleSignIn] Error:', error);
            const errorMessage = error?.message || 'Error al iniciar sesión con Apple. Inténtalo de nuevo.';
            toast.error(errorMessage, { duration: 5000 });
            setAuthStep('');
        } finally {
            setIsAuthenticating(false);
        }
    };

    // No mostrar el botón si no está disponible
    if (isAvailable === false || (!isNative && isAvailable === null)) {
        return null;
    }

    const compactClasses = 'h-9 px-4 text-sm font-medium text-white bg-black dark:bg-gray-900 hover:bg-gray-800 dark:hover:bg-gray-800 rounded-lg transition-all duration-200 border border-gray-800 dark:border-gray-700 hover:border-gray-700 dark:hover:border-gray-600 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed';
    const defaultClasses = 'w-full bg-black text-white font-semibold py-4 px-6 rounded-xl text-base transition-colors border-2 border-gray-900 hover:bg-gray-900 active:bg-gray-800 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed';

    return (
        <button
            onClick={handleAppleSignIn}
            disabled={isAuthenticating || isAvailable === null}
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
                    <AppleIcon />
                    <span>Continuar con Apple</span>
                </>
            )}
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
        </button>
    );
};
