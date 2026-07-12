import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { nativeAuthService } from '../services/nativeAuthService';
import { Capacitor } from '@capacitor/core';
import { toast } from '../lib/toast';
import { Loader2 } from 'lucide-react';
import {
  ensureGoogleIdentityReady,
  logGoogleOriginHintOnce,
  renderGoogleButton,
  subscribeGoogleAuthSuccess,
} from '../lib/googleIdentity';
import { cn } from '../lib/utils';

const GoogleIcon = ({ compact }: { compact?: boolean }) => (
    <svg className={compact ? 'w-4 h-4 shrink-0' : 'w-5 h-5'} viewBox="0 0 24 24" aria-hidden>
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
);

interface GoogleSignInButtonProps {
    className?: string;
    /** Estilos del botón visible (no del wrapper). */
    shellClassName?: string;
    variant?: 'default' | 'compact';
    onSuccess?: () => void;
    /** Round 19: texto opcional del botón. Default "Iniciar Sesión" (legacy). Usar "Google" en grids 2-col. */
    label?: string;
    /** Remonta el botón nativo cuando el contenedor es visible (p. ej. modal abierto). */
    active?: boolean;
}

// Round: el botón "compact" solo se usa en LoginModal (grid social), donde los inputs
// y el CTA ya no comparten forma pastilla — este radio los alinea con esa familia.
// El variant "default" (sidebar de App.tsx) se queda en pastilla, sin tocar.
const OAUTH_RADIUS_COMPACT = 'rounded-[10px]';
const OAUTH_RADIUS_DEFAULT = 'rounded-full';

const compactClasses =
    'flex h-11 w-full items-center justify-center gap-2.5 border border-[#dadce0] bg-white font-display text-meta font-medium text-[#3c4043] transition-colors hover:border-[#bdc1c6] hover:bg-[#f8f9fa] active:bg-[#f1f3f4]';
const defaultClasses =
    'flex h-11 w-full items-center justify-center gap-2.5 border border-[#dadce0] bg-white font-display text-sm font-medium text-[#3c4043] transition-colors hover:border-[#bdc1c6] hover:bg-[#f8f9fa] active:bg-[#f1f3f4]';

export const GoogleSignInButton = ({
    className = '',
    shellClassName = '',
    variant = 'default',
    onSuccess,
    label = 'Iniciar sesión',
    active = true,
}: GoogleSignInButtonProps) => {
    const [isReady, setIsReady] = useState(false);
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [authStep, setAuthStep] = useState<string>('');
    const { updateUser } = useAuth();
    const navigate = useNavigate();
    const buttonRef = useRef<HTMLDivElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const isNative = Capacitor.isNativePlatform();
    const oauthRadius = variant === 'compact' ? OAUTH_RADIUS_COMPACT : OAUTH_RADIUS_DEFAULT;
    const shellClasses = cn(
        variant === 'compact' ? compactClasses : defaultClasses,
        oauthRadius,
        shellClassName,
    );

    const mountButton = useCallback(async () => {
        if (isNative || !active || !buttonRef.current || !wrapperRef.current) return;

        const ready = await ensureGoogleIdentityReady();
        if (!ready || !buttonRef.current || !wrapperRef.current) {
            logGoogleOriginHintOnce();
            setIsReady(false);
            return;
        }

        const width = Math.round(wrapperRef.current.getBoundingClientRect().width);
        renderGoogleButton(buttonRef.current, {
            type: 'standard',
            theme: 'outline',
            size: variant === 'compact' ? 'large' : 'large',
            text: 'continue_with',
            shape: 'rectangular',
            width: width > 0 ? width : undefined,
        });

        window.setTimeout(() => {
            const renderedButton = buttonRef.current?.querySelector('div[role="button"], iframe');
            setIsReady(!!renderedButton);
        }, 200);
    }, [active, isNative, variant]);

    useEffect(() => {
        if (isNative) {
            setIsReady(true);
            return;
        }

        if (!active) {
            setIsReady(false);
            if (buttonRef.current) {
                buttonRef.current.innerHTML = '';
            }
            return;
        }

        let cancelled = false;
        const timer = window.setTimeout(() => {
            if (cancelled) return;
            void mountButton();
        }, 80);

        const unsubscribeSuccess = subscribeGoogleAuthSuccess(() => {
            onSuccess?.();
        });

        return () => {
            cancelled = true;
            window.clearTimeout(timer);
            unsubscribeSuccess();
        };
    }, [active, isNative, mountButton, onSuccess]);

    const handleNativeSignIn = async () => {
        try {
            setIsAuthenticating(true);
            setAuthStep('Iniciando sesión con Google...');

            const result = await nativeAuthService.signInWithGoogle();

            // El usuario cerró la hoja de Google: no es un error, salimos sin toast.
            if (result.cancelled) {
                console.log('🔐 [GoogleSignIn Native] Inicio de sesión cancelado por el usuario');
                setAuthStep('');
                return;
            }

            if (!result.success) {
                throw new Error('Authentication failed');
            }

            setAuthStep('Configurando sesión...');
            const token = authService.getAccessToken();

            updateUser(result.user, token, () => {
                console.log('✅ [GoogleSignIn Native] Usuario y token actualizados');
            });

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
            onSuccess?.();
        } catch (error: unknown) {
            console.error('❌ [GoogleSignIn Native] Error:', error);
            const errorMessage =
                error instanceof Error ? error.message : 'Error al iniciar sesión. Inténtalo de nuevo.';
            toast.error(errorMessage, { duration: 5000 });
            setAuthStep('');
        } finally {
            setIsAuthenticating(false);
        }
    };

    const handleWebFallbackClick = () => {
        if (isReady) return;
        void mountButton();
        if (window.google?.accounts?.id?.prompt) {
            window.google.accounts.id.prompt();
        }
    };

    return (
        <div className={cn('relative w-full', className)} ref={wrapperRef}>
            {/* Capa visual — el clic real va al iframe de Google encima (web) */}
            <div
                className={cn(
                    shellClasses,
                    'pointer-events-none select-none',
                    (!isReady || isAuthenticating) && 'opacity-60',
                )}
                aria-hidden
            >
                {isAuthenticating ? (
                    <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>{authStep || 'Conectando…'}</span>
                    </>
                ) : (
                    <>
                        <GoogleIcon compact={variant === 'compact'} />
                        <span className="truncate">{label}</span>
                    </>
                )}
            </div>

            {isNative ? (
                <button
                    type="button"
                    onClick={handleNativeSignIn}
                    disabled={isAuthenticating}
                    className={cn(
                        'absolute inset-0 z-[2]',
                        oauthRadius,
                        isAuthenticating && 'cursor-wait opacity-75',
                    )}
                    aria-label={label}
                />
            ) : (
                <>
                    <div
                        ref={buttonRef}
                        className={cn('absolute inset-0 z-[2] overflow-hidden opacity-[0.011]', oauthRadius, '[&>div]:!h-full [&>div]:!w-full [&_iframe]:!h-full [&_iframe]:!w-full', !isReady && 'pointer-events-none')}
                        aria-hidden={isReady}
                    />
                    {!isReady && active && (
                        <button
                            type="button"
                            onClick={handleWebFallbackClick}
                            className={cn('absolute inset-0 z-[1]', oauthRadius)}
                            aria-label={`${label} — cargando`}
                        />
                    )}
                </>
            )}

            {isAuthenticating && (
                <div className={cn('absolute inset-0 z-[3] cursor-wait bg-white/80', oauthRadius)} aria-hidden />
            )}
        </div>
    );
};
