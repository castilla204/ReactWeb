import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { nativeAuthService } from '../services/nativeAuthService';
import { Capacitor } from '@capacitor/core';
import { toast } from '../lib/toast';
import { Loader2 } from 'lucide-react';

interface AppleSignInButtonProps {
    className?: string;
    variant?: 'default' | 'compact';
    onSuccess?: () => void;
    /** Texto del botón. Default "Continuar con Apple"; usar "Apple" en grids de 2 columnas. */
    label?: string;
}

// Apple SVG Icon Component
const AppleIcon = ({ compact }: { compact?: boolean }) => (
    <svg className={compact ? 'h-[18px] w-[18px] shrink-0' : 'w-5 h-5'} viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
    </svg>
);

export const AppleSignInButton = ({ className = '', variant = 'default', onSuccess, label = 'Continuar con Apple' }: AppleSignInButtonProps) => {
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

            // El usuario cerró la hoja de Apple: no es un error, salimos sin toast.
            if (result.cancelled) {
                console.log('🔐 [AppleSignIn] Inicio de sesión cancelado por el usuario');
                setAuthStep('');
                return;
            }

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

    // 🛡️ Round 19: Apple Sign In NO está completamente configurado en web (requiere
    // Apple Developer Service ID + DKIM + .p8 key — pendiente). En vez de OCULTAR el
    // botón, lo mostramos DISABLED con tooltip "Próximamente" para que el usuario sepa
    // que existe la opción y pueda elegir Google/email mientras se completa la config.
    //
    // - En iOS/macOS nativo (Capacitor): funciona normal (Apple SDK nativo).
    // - En web/Android: disabled hasta que Apple Developer esté configurado.
    const isWebOrUnavailable = !isNative || isAvailable === false;
    const showAsDisabled = isWebOrUnavailable;

    // text-[14px] (no el token text-meta) para igualar exactamente al botón de Google en
    // el grid de iOS; rounded-xl = misma familia que los campos de correo.
    const compactEnabledClasses =
        'flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-ink-strong bg-ink-strong font-display text-[14px] font-medium leading-none tracking-[0.01em] text-white transition-colors hover:bg-black active:bg-ink-strong disabled:cursor-not-allowed disabled:opacity-50';
    const compactDisabledClasses =
        'flex h-11 w-full cursor-not-allowed items-center justify-center gap-2.5 rounded-xl border border-line bg-white font-display text-[14px] font-medium leading-none tracking-[0.01em] text-ink-soft';
    const defaultEnabledClasses =
        'flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-ink-strong bg-ink-strong font-display text-sm font-medium text-white transition-colors hover:bg-black active:bg-ink-strong disabled:cursor-not-allowed disabled:opacity-50';
    const defaultDisabledClasses =
        'flex h-11 w-full cursor-not-allowed items-center justify-center gap-2.5 rounded-xl border border-line bg-white font-display text-sm font-medium text-ink-soft';

    return (
        <button
            onClick={showAsDisabled ? undefined : handleAppleSignIn}
            disabled={isAuthenticating || isAvailable === null || showAsDisabled}
            title={showAsDisabled ? 'Próximamente disponible en web — usa la app de iPhone/Mac' : undefined}
            aria-label={showAsDisabled ? 'Inicia sesión con Apple (próximamente disponible en web)' : 'Inicia sesión con Apple'}
            className={`${
                variant === 'compact'
                    ? showAsDisabled
                        ? compactDisabledClasses
                        : compactEnabledClasses
                    : showAsDisabled
                      ? defaultDisabledClasses
                      : defaultEnabledClasses
            } ${className} ${isAuthenticating ? 'opacity-75 cursor-wait' : ''}`}
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
                    <AppleIcon compact={variant === 'compact'} />
                    <span className="truncate">{label}</span>
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
