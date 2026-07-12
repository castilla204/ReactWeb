import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
// 🛡️ Round 28 — Sprint 4: i18n para textos UI multi-idioma (ES/EN).
import { useTranslation, Trans } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ArrowLeft, ShieldCheck, Eye, EyeOff, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { toast } from '../lib/toast';
import { useAuth } from '../contexts/AuthContext';
import { getAuthToken } from '../lib/auth';
import { RoleChecker } from '../utils/roleChecker';
import { authService } from '../services/authService';
import { API_CONFIG } from '../config/api';
import { capacitorFetch } from '../utils/capacitorFetch';
import { GoogleSignInButton } from './GoogleSignInButton';
import { AppleSignInButton } from './AppleSignInButton';
import { ResponsiveModal } from './ui/responsive-modal';
import { DrawerHandle } from './ui/drawer';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from './ui/input-otp';

/**
 * 🛡️ Round 16: Modal de autenticación unificado.
 *
 * Estados (controlados por `step`):
 *  - "social": pantalla inicial con tabs Login/Registro + botones Google/Apple.
 *  - "verify-email": pantalla OTP para registro (6 dígitos + reenviar + countdown).
 *  - "verify-reset": pantalla OTP para reset password + campo nueva contraseña.
 *
 * Cambios de tab no resetean state — la pantalla OTP "recuerda" el flujo origen para
 * decidir qué endpoint llamar en submit.
 *
 * Responsivo: ResponsiveModal cambia a Drawer (vaul) en mobile y Dialog en desktop.
 */

export interface LoginModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Llamado tras login/registro exitoso. */
    onSuccess?: () => void;
    /** Tab inicial — útil para abrir directamente en "Crear cuenta". */
    initialTab?: 'login' | 'register';
}

type Step = 'social' | 'verify-email' | 'forgot-email' | 'verify-reset';

interface OtpContext {
    verificationToken: string;
    expiresAt: string;
    email: string; // para mostrar al usuario "Te enviamos un código a x@y.com"
    origin: 'register' | 'reset' | 'login-unverified';
    /**
     * True cuando el backend detectó que el email ya existe con cuenta OAuth (Google/Apple)
     * y estamos vinculando una nueva contraseña a esa cuenta existente.
     * Se setea desde RegisterForm cuando data.linkedAccount === true.
     */
    isLinking?: boolean;
}

// Copys de la cabecera: el titular es la propia acción ("Inicia sesión"), no el logo —
// el wordmark pasa a firma discreta arriba. Sin subtítulo: era redundante con el titular
// y el conmutador de modo ya vive en el pie (AuthFooterLine).
const AUTH_COPY: Record<'login' | 'register', { title: string }> = {
    login: { title: 'Inicia sesión' },
    register: { title: 'Crea tu cuenta' },
};

export const LoginModal: React.FC<LoginModalProps> = ({
    open,
    onOpenChange,
    onSuccess,
    initialTab = 'login',
}) => {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const [step, setStep] = useState<Step>('social');
    const [tab, setTab] = useState<'login' | 'register'>(initialTab);
    const [otpCtx, setOtpCtx] = useState<OtpContext | null>(null);
    const [pendingExpertRedirect, setPendingExpertRedirect] = useState(false);

    const isExpert = useMemo(() => {
        const role = user?.Role ?? user?.role ?? user?.userRole;
        if (role === 'Expert' || role === 'expert' || role === 'EXPERT' || role === 1) {
            return true;
        }
        try {
            const token = getAuthToken();
            if (token) {
                return RoleChecker.getUserRole(token) === 1;
            }
        } catch {
            /* ignore */
        }
        return false;
    }, [user]);

    // Reset al abrir/cerrar.
    useEffect(() => {
        if (open) {
            setStep('social');
            setTab(initialTab);
            setOtpCtx(null);
            setPendingExpertRedirect(false);
        }
    }, [open, initialTab]);

    const handleSuccess = useCallback(() => {
        onOpenChange(false);
        if (pendingExpertRedirect) {
            setPendingExpertRedirect(false);
            navigate(isExpert ? '/expert' : '/expert/join');
            return;
        }
        onSuccess?.();
    }, [onOpenChange, onSuccess, pendingExpertRedirect, navigate, isExpert]);

    const handleExpertSignupClick = useCallback(() => {
        if (isAuthenticated) {
            onOpenChange(false);
            navigate(isExpert ? '/expert' : '/expert/join');
            return;
        }
        setPendingExpertRedirect(true);
        setTab('register');
        toast.message('Completa el registro arriba para seguir con el alta de experto.', { duration: 3500 });
    }, [isAuthenticated, isExpert, navigate, onOpenChange]);

    return (
        <ResponsiveModal
            open={open}
            onOpenChange={onOpenChange}
            title={
                step === 'social'
                    ? undefined
                    : step === 'forgot-email'
                      ? 'Recuperar contraseña'
                      : 'Verifica tu correo'
            }
            description={
                step === 'social'
                    ? undefined
                    : step === 'forgot-email'
                      ? 'Te enviaremos un código a tu correo.'
                      : `Código enviado a ${otpCtx?.email ?? ''}`
            }
            mobileBreakpoint={768}
            noHandle={step === 'social'}
            className="w-full max-w-none md:max-h-[min(90vh,680px)]"
            drawerClassName="!h-auto !max-w-none bg-white"
            drawerMaxHeight="min(92dvh, calc(100dvh - env(safe-area-inset-bottom, 0px) - 2.75rem))"
            drawerScrollClassName="bg-white"
            dialogClassName="md:!max-w-[560px] lg:!max-w-[560px] overflow-hidden rounded-2xl border border-line bg-white shadow-[0_16px_48px_rgba(15,23,42,0.14)]"
            dialogHeaderClassName="border-line"
        >
            <div className="w-full">
                <div
                    className={
                        step === 'social'
                            ? 'pb-[max(0.75rem,env(safe-area-inset-bottom))]'
                            : 'px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-1 md:px-7 md:pt-3 md:pb-5'
                    }
                >
                <AnimatePresence mode="wait" initial={false}>
                    {step === 'social' && (
                        <motion.div
                            key="social"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className="flex w-full flex-col">
                                <AuthHeader tab={tab} onClose={() => onOpenChange(false)} />

                                <div className="px-5 pt-5 md:px-7 md:pt-5">
                                    <div className="flex w-full flex-col gap-4">
                                        <SocialButtonsRow onSuccess={handleSuccess} active={open} />
                                        <Separator />
                                        {tab === 'login' ? (
                                            <LoginForm
                                                onSuccess={handleSuccess}
                                                onGoToForgot={() => setStep('forgot-email')}
                                                onEmailUnverified={(ctx) => {
                                                    setOtpCtx({ ...ctx, origin: 'login-unverified' });
                                                    setStep('verify-email');
                                                }}
                                            />
                                        ) : (
                                            <RegisterForm
                                                onCodeSent={(ctx) => {
                                                    setOtpCtx({ ...ctx, origin: 'register' });
                                                    setStep('verify-email');
                                                }}
                                            />
                                        )}
                                        <AuthFooterLine tab={tab} isExpert={isExpert} onSwitch={setTab} onExpertAction={handleExpertSignupClick} />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {step === 'verify-email' && otpCtx && (
                        <motion.div
                            key="otp"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <button
                                onClick={() => setStep('social')}
                                className="mb-4 flex items-center gap-1.5 font-display text-meta font-medium text-ink-muted transition-colors hover:text-brand"
                            >
                                <ArrowLeft className="h-4 w-4" /> Volver
                            </button>
                            <OtpForm
                                ctx={otpCtx}
                                onSuccess={handleSuccess}
                                onResend={(newCtx) => setOtpCtx({ ...otpCtx, ...newCtx })}
                            />
                        </motion.div>
                    )}

                    {step === 'forgot-email' && (
                        <motion.div
                            key="forgot"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <button
                                onClick={() => setStep('social')}
                                className="mb-4 flex items-center gap-1.5 font-display text-meta font-medium text-ink-muted transition-colors hover:text-brand"
                            >
                                <ArrowLeft className="h-4 w-4" /> Volver
                            </button>
                            <ForgotPasswordForm
                                onCodeSent={(ctx) => {
                                    setOtpCtx({ ...ctx, origin: 'reset' });
                                    setStep('verify-reset');
                                }}
                            />
                        </motion.div>
                    )}

                    {step === 'verify-reset' && otpCtx && (
                        <motion.div
                            key="reset"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <button
                                onClick={() => setStep('forgot-email')}
                                className="mb-4 flex items-center gap-1.5 font-display text-meta font-medium text-ink-muted transition-colors hover:text-brand"
                            >
                                <ArrowLeft className="h-4 w-4" /> Volver
                            </button>
                            <ResetPasswordForm
                                ctx={otpCtx}
                                onSuccess={handleSuccess}
                                onResend={(newCtx) => setOtpCtx({ ...otpCtx, ...newCtx })}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
                </div>
            </div>
        </ResponsiveModal>
    );
};

/**
 * Cabecera: el wordmark baja a firma discreta arriba y el titular real ("Inicia sesión")
 * pasa a ser el elemento dominante — la pantalla habla de la acción, no del logo.
 * Fondo blanco plano + hairline (antes tenía un tinte azul de marca).
 */
const AuthHeader: React.FC<{ tab: 'login' | 'register'; onClose: () => void }> = ({ tab, onClose }) => {
    const { t } = useTranslation();
    const { title } = AUTH_COPY[tab];

    return (
        <div className="sticky top-0 z-10 shrink-0 overflow-hidden rounded-t-[24px] border-b border-line bg-white md:rounded-t-2xl">
            {/* Asa del drawer (solo móvil) — la fila ocupa solo ~10px. */}
            <div className="flex justify-center pt-1.5 md:hidden">
                <DrawerHandle className="!mt-0 !mb-0 h-1 w-10 rounded-full bg-line" />
            </div>
            {/* Botón cerrar: absoluto esquina sup-der. Wordmark es siempre izquierdo → no chocan. */}
            <button
                type="button"
                onClick={onClose}
                className="absolute right-2 top-2 rounded-full p-1.5 text-ink-muted transition-colors hover:bg-black/[0.05] hover:text-ink-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1"
                aria-label={t('common.actions.close')}
            >
                <X className="h-[18px] w-[18px]" />
            </button>
            <div className="px-5 pb-4 pt-3 md:px-7 md:pb-5 md:pt-4">
                <p className="font-display text-kicker font-semibold leading-none tracking-[-0.01em]">
                    <span className="text-brand">Inspecciono</span>
                    <span className="text-amber-500">.</span>
                </p>
                <div className="relative mt-1.5">
                    <motion.div
                        key={tab}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <h2 className="font-display text-xl font-bold leading-tight tracking-[-0.02em] text-ink-strong">
                            {title}
                        </h2>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

/** Pie unificado: switch de modo + CTA de experto en una sola línea (patrón Stripe). */
const AuthFooterLine: React.FC<{
    tab: 'login' | 'register';
    isExpert: boolean;
    onSwitch: (next: 'login' | 'register') => void;
    onExpertAction: () => void;
}> = ({ tab, isExpert, onSwitch, onExpertAction }) => {
    const isLogin = tab === 'login';
    const linkCls =
        'font-semibold text-brand underline-offset-2 transition-colors hover:text-brand-hover hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30';
    return (
        <div className="pb-1 flex flex-col items-center gap-1.5">
            <p className="text-center font-display text-meta leading-relaxed text-ink-muted">
                {isLogin ? (
                    <>
                        ¿Aún no tienes cuenta?{' '}
                        <button type="button" onClick={() => onSwitch('register')} className={linkCls}>
                            Regístrate
                        </button>
                    </>
                ) : (
                    <>
                        ¿Ya tienes cuenta?{' '}
                        <button type="button" onClick={() => onSwitch('login')} className={linkCls}>
                            Inicia sesión
                        </button>
                    </>
                )}
            </p>
            {!isLogin && (
                <p className="text-center font-display text-caption leading-relaxed text-ink-soft">
                    ¿Eres profesional?{' '}
                    <button
                        type="button"
                        onClick={onExpertAction}
                        className="font-semibold text-ink-muted underline-offset-2 transition-colors hover:text-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
                    >
                        {isExpert ? 'Panel de experto' : 'Hazte experto'}
                    </button>
                </p>
            )}
        </div>
    );
};

// 🛡️ Round 28 — Sprint 4: checkbox T&C reutilizable con i18n. Trans permite que los
// elementos <a> internos sigan siendo enlaces clicables aunque el texto venga de la traducción.
const TermsCheckbox: React.FC<{ accepted: boolean; onChange: (v: boolean) => void }> = ({ accepted, onChange }) => {
    const { t } = useTranslation();
    return (
        <label className="flex items-start gap-2 mt-1.5 cursor-pointer">
            <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => onChange(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand cursor-pointer"
                required
                aria-label={t('auth.register.termsRequired')}
            />
            <span className="text-kicker leading-relaxed text-ink-muted">
                <Trans
                    i18nKey="auth.register.acceptTerms"
                    components={{
                        terms: (
                            <a
                                href="/legal/terms"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-brand underline-offset-2 hover:underline"
                            />
                        ),
                        privacy: (
                            <a
                                href="/legal/privacy"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-brand underline-offset-2 hover:underline"
                            />
                        ),
                    }}
                />
            </span>
        </label>
    );
};

// ─── Subcomponentes ──────────────────────────────────────────────────────────────

const Separator: React.FC = () => (
    <div className="relative flex items-center py-3">
        <span className="h-px flex-1 bg-line" />
        <span className="mx-3 shrink-0 font-display text-xs font-medium tracking-[0.01em] text-ink-soft">
            o usa tu correo
        </span>
        <span className="h-px flex-1 bg-line" />
    </div>
);

const SocialButtonsRow: React.FC<{ onSuccess: () => void; active: boolean }> = ({ onSuccess, active }) => {
    // Apple Sign In solo funciona en iOS/macOS nativo. En web/Android se mostraba un botón
    // gris "Próximamente" que parecía roto → mostramos Google a ancho completo (limpio).
    // En iOS, los dos botones en una sola fila (2 columnas) con etiquetas cortas.
    const showApple = Capacitor.getPlatform() === 'ios';

    return (
        <div className={showApple ? 'grid w-full grid-cols-2 gap-2.5' : 'w-full'}>
            <GoogleSignInButton
                variant="compact"
                onSuccess={onSuccess}
                label={showApple ? 'Google' : 'Continuar con Google'}
                active={active}
            />
            {showApple && <AppleSignInButton variant="compact" onSuccess={onSuccess} label="Apple" />}
        </div>
    );
};

// ── Login con email + password ──
const LoginForm: React.FC<{
    onSuccess: () => void;
    onGoToForgot: () => void;
    onEmailUnverified: (ctx: { verificationToken: string; expiresAt: string; email: string }) => void;
}> = ({ onSuccess, onGoToForgot, onEmailUnverified }) => {
    const { updateUser } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPwd, setShowPwd] = useState(false);
    const [busy, setBusy] = useState(false);
    // Candado síncrono: con email sin verificar, cada login emite un OTP nuevo — un doble
    // submit mandaba dos códigos distintos y el del primer email ya no valía.
    const submitLockRef = useRef(false);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitLockRef.current || busy) return;
        submitLockRef.current = true;
        setBusy(true);
        try {
            const res = await capacitorFetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.auth.loginPassword}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim(), password }),
            });
            const data = await res.json();

            if (!res.ok) {
                // Lockout / unverified / blocked / invalid → toast.
                toast.error(data?.message ?? 'No hemos podido iniciar sesión. Revisa tu correo y contraseña.');
                return;
            }

            // Caso: email no verificado → mostrar pantalla OTP.
            if (data.code === 'email_verification_required') {
                toast.info(data.message);
                onEmailUnverified({
                    verificationToken: data.verificationToken,
                    expiresAt: data.expiresAt,
                    email: email.trim(),
                });
                return;
            }

            // Caso: MFA requerido → redirigir a flujo MFA (no implementado en modal por ahora).
            if (data.mfaRequired) {
                toast.info('Se requiere verificación adicional. Te redirigimos…');
                window.location.href = `/mfa/verify?userId=${data.userId}`;
                return;
            }

            // Caso: login OK.
            if (data.token && data.user) {
                const [accessToken, refreshToken] = (data.token as string).split('|');
                if (!accessToken || !refreshToken) throw new Error('Respuesta inválida del servidor.');
                authService.setTokens(accessToken, refreshToken);
                authService.scheduleTokenRefresh();
                updateUser(data.user, accessToken);
                toast.success('¡Hola de nuevo!');
                onSuccess();
            }
        } catch (err: any) {
            toast.error(err?.message ?? 'Error de red. Inténtalo de nuevo.');
        } finally {
            submitLockRef.current = false;
            setBusy(false);
        }
    };

    return (
        <form onSubmit={onSubmit} className="space-y-3.5">
            <FieldGroup label="Correo electrónico">
                <Input
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="nombre@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={INPUT_REBRAND}
                />
            </FieldGroup>
            <FieldGroup label="Contraseña">
                <Input
                    type={showPwd ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${INPUT_REBRAND} pr-11`}
                />
                <button
                    type="button"
                    onClick={() => setShowPwd(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-soft transition-colors hover:text-ink-muted"
                    tabIndex={-1}
                    aria-label={showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
            </FieldGroup>
            <div className="flex justify-end -mt-0.5">
                <button
                    type="button"
                    onClick={onGoToForgot}
                    className="font-display text-meta font-medium text-ink-muted underline-offset-2 transition-colors hover:text-brand hover:underline"
                >
                    ¿Olvidaste tu contraseña?
                </button>
            </div>
            <Button type="submit" disabled={busy || !email || !password} className={PRIMARY_BTN}>
                {busy ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Iniciando sesión…</> : 'Iniciar sesión'}
            </Button>
        </form>
    );
};

// ── Registro con email + password ──
const RegisterForm: React.FC<{
    onCodeSent: (ctx: { verificationToken: string; expiresAt: string; email: string; isLinking?: boolean }) => void;
}> = ({ onCodeSent }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPwd, setShowPwd] = useState(false);
    const [busy, setBusy] = useState(false);
    // 🛡️ Round 28 S2-P0-14: GDPR Art. 7 + LGDCU Art. 80 — consentimiento explícito.
    // Sin este checkbox, los T&C son inoponibles al consumidor y la defensa frente a
    // chargebacks queda comprometida (Stripe exige evidencia de "customer agreed").
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    // Candado síncrono: un doble submit emitía DOS códigos OTP (dos emails con códigos
    // distintos) y el usuario solía teclear el del primer email → "código incorrecto".
    const submitLockRef = useRef(false);

    const strengthHint = (() => {
        if (password.length === 0) return null;
        if (password.length < 8) return { label: 'Muy corta', cls: 'text-red-600' };
        if (password.length < 12) return { label: 'Aceptable', cls: 'text-amber-600' };
        return { label: 'Segura', cls: 'text-emerald-600' };
    })();

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitLockRef.current || busy) return;
        if (!acceptedTerms) {
            toast.error('Debes aceptar los Términos y la Política de Privacidad.');
            return;
        }
        submitLockRef.current = true;
        setBusy(true);
        try {
            const res = await capacitorFetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.auth.register}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // 🛡️ Round 28 S2-P0-14: enviar marcadores de aceptación. Si el backend tiene los
                // campos (AcceptedTermsAt + AcceptedTermsVersion), persiste; si no, los ignora.
                body: JSON.stringify({
                    name: name.trim(),
                    email: email.trim(),
                    password,
                    acceptedTerms: true,
                    acceptedTermsAt: new Date().toISOString(),
                    acceptedTermsVersion: 'v1',
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data?.message ?? 'No hemos podido crear tu cuenta. Inténtalo de nuevo.');
                return;
            }
            // Account-linking flow: el backend detectó que el email ya existe con cuenta OAuth.
            // Mostramos toast diferenciado y propagamos isLinking al OTP context.
            const isLinking = data?.linkedAccount === true;
            if (isLinking) {
                toast.info('Tu cuenta ya existe con Google/Apple. Te enviamos un código para añadir tu contraseña.');
            } else {
                toast.success(data?.message ?? 'Código enviado a tu correo.');
            }
            onCodeSent({
                verificationToken: data.verificationToken,
                expiresAt: data.expiresAt,
                email: email.trim(),
                isLinking,
            });
        } catch (err: any) {
            toast.error(err?.message ?? 'Error de red. Inténtalo de nuevo.');
        } finally {
            submitLockRef.current = false;
            setBusy(false);
        }
    };

    return (
        <form onSubmit={onSubmit} className="space-y-3.5">
            <FieldGroup label="Nombre completo">
                <Input
                    type="text"
                    autoComplete="name"
                    required
                    minLength={2}
                    maxLength={100}
                    placeholder="Ana García"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={INPUT_REBRAND}
                />
            </FieldGroup>
            <FieldGroup label="Correo electrónico">
                <Input
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="nombre@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={INPUT_REBRAND}
                />
            </FieldGroup>
            <FieldGroup label="Contraseña">
                <Input
                    type={showPwd ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    minLength={8}
                    maxLength={128}
                    placeholder="Mínimo 8 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${INPUT_REBRAND} pr-11`}
                />
                <button
                    type="button"
                    onClick={() => setShowPwd(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-soft transition-colors hover:text-ink-muted"
                    tabIndex={-1}
                    aria-label={showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
            </FieldGroup>
            {strengthHint && (
                <p className={`text-kicker -mt-1.5 ${strengthHint.cls}`}>
                    {strengthHint.label}
                </p>
            )}
            {/* 🛡️ Round 28 S2-P0-14: checkbox obligatorio de aceptación T&C + Privacidad. */}
            {/* 🛡️ Round 28 — Sprint 4: textos i18n vía Trans para que los <a> sigan funcionando. */}
            <TermsCheckbox accepted={acceptedTerms} onChange={setAcceptedTerms} />

            <Button type="submit" disabled={busy || !name || !email || !password || !acceptedTerms} className={PRIMARY_BTN}>
                {busy ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando código…</> : 'Crear cuenta'}
            </Button>
        </form>
    );
};

// ── OTP de verificación (registro o login-unverified) ──
const OtpForm: React.FC<{
    ctx: OtpContext;
    onSuccess: () => void;
    onResend: (newCtx: { verificationToken: string; expiresAt: string }) => void;
}> = ({ ctx, onSuccess, onResend }) => {
    const { updateUser } = useAuth();
    const [code, setCode] = useState('');
    const [busy, setBusy] = useState(false);
    const [resending, setResending] = useState(false);
    const [cooldown, setCooldown] = useState(30);
    // Candados SÍNCRONOS: el state `busy` se actualiza de forma asíncrona y no evita dos
    // llamadas en el mismo tick (auto-submit del 6º dígito + click/autofill del teclado).
    // La 2ª petición llegaba al backend y devolvía el falso "este código ya se ha utilizado".
    const submitLockRef = useRef(false);
    const resendLockRef = useRef(false);

    useEffect(() => {
        // Countdown para botón "Reenviar".
        const timer = setInterval(() => {
            setCooldown(c => (c > 0 ? c - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const submit = async (autoCode?: string) => {
        const finalCode = (autoCode ?? code).replace(/\D/g, '');
        if (submitLockRef.current || busy || finalCode.length !== 6) return;
        submitLockRef.current = true;
        setBusy(true);
        try {
            const res = await capacitorFetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.auth.verifyEmail}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ verificationToken: ctx.verificationToken, code: finalCode }),
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data?.message ?? 'Código inválido.');
                setCode('');
                return;
            }

            // Caso normal: registro completado, devuelven token+user.
            if (data.token && data.user) {
                const [accessToken, refreshToken] = (data.token as string).split('|');
                if (!accessToken || !refreshToken) throw new Error('Respuesta inválida del servidor.');
                authService.setTokens(accessToken, refreshToken);
                authService.scheduleTokenRefresh();
                updateUser(data.user, accessToken);
                // accountAction nos dice si fue link de password a OAuth o cuenta nueva.
                if (data.accountAction === 'password_linked') {
                    toast.success('¡Contraseña añadida a tu cuenta!');
                } else {
                    // account_created (default) o cualquier otro valor → toast genérico.
                    toast.success('¡Cuenta verificada!');
                }
                onSuccess();
                return;
            }

            // Caso: el OTP era de un flujo que no era registro (ej. solo verificación).
            // Cerramos el modal y dejamos al usuario que reintente login.
            toast.success('Correo verificado.');
            onSuccess();
        } catch (err: any) {
            toast.error(err?.message ?? 'Error de red.');
        } finally {
            submitLockRef.current = false;
            setBusy(false);
        }
    };

    const resend = async () => {
        if (resendLockRef.current || resending || cooldown > 0) return;
        resendLockRef.current = true;
        setResending(true);
        try {
            const res = await capacitorFetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.auth.resendOtp}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ verificationToken: ctx.verificationToken }),
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data?.message ?? 'No se pudo reenviar.');
                if (typeof data?.retryAfter === 'number') setCooldown(data.retryAfter);
                return;
            }
            toast.success('Te hemos enviado un nuevo código.');
            setCode('');
            onResend({ verificationToken: data.verificationToken, expiresAt: data.expiresAt });
            setCooldown(30);
        } catch (err: any) {
            toast.error(err?.message ?? 'Error de red.');
        } finally {
            resendLockRef.current = false;
            setResending(false);
        }
    };

    // Subtitle especial cuando estamos vinculando una nueva contraseña a una cuenta OAuth existente.
    const showLinkingSubtitle = ctx.isLinking === true && ctx.origin === 'register';

    return (
        <div className="space-y-5 text-center">
            <div className="flex justify-center">
                <div className="rounded-full bg-brand/[0.08] p-3 ring-1 ring-brand/15">
                    <ShieldCheck className="h-6 w-6 text-brand" />
                </div>
            </div>
            <p className="font-display text-sm leading-snug text-ink-muted">
                Introduce el código de 6 dígitos que enviamos a <strong className="font-semibold text-ink-strong">{ctx.email}</strong>.
            </p>
            {showLinkingSubtitle && (
                <p className="-mt-2 font-display text-sm text-brand">
                    Vinculando tu nueva contraseña a tu cuenta de Google/Apple existente.
                </p>
            )}
            <div className="flex justify-center">
                <InputOTP
                    maxLength={6}
                    value={code}
                    onChange={(v) => {
                        // Solo dígitos: pegar "123 456" o "123-456" dejaba caracteres que el
                        // backend rechazaba aunque el usuario "veía" un código correcto.
                        const clean = v.replace(/\D/g, '');
                        setCode(clean);
                        if (clean.length === 6) submit(clean);
                    }}
                    autoFocus
                >
                    <InputOTPGroup className="gap-2">
                        {[0, 1, 2, 3, 4, 5].map(i => (
                            <InputOTPSlot
                                key={i}
                                index={i}
                                className={OTP_SLOT}
                            />
                        ))}
                    </InputOTPGroup>
                </InputOTP>
            </div>
            <Button onClick={() => submit()} disabled={busy || code.length !== 6} className={PRIMARY_BTN}>
                {busy ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verificando…</> : 'Verificar'}
            </Button>
            <div className="font-display text-sm text-ink-muted">
                ¿No te llegó?{' '}
                <button
                    onClick={resend}
                    disabled={cooldown > 0 || resending}
                    className="font-medium text-brand underline-offset-2 transition-colors hover:text-brand-hover hover:underline disabled:text-ink-soft disabled:no-underline"
                >
                    {cooldown > 0 ? `Reenviar en ${cooldown}s` : (resending ? 'Reenviando…' : 'Reenviar código')}
                </button>
            </div>
        </div>
    );
};

// ── Forgot password (paso 1: pedir email) ──
const ForgotPasswordForm: React.FC<{
    onCodeSent: (ctx: { verificationToken: string; expiresAt: string; email: string }) => void;
}> = ({ onCodeSent }) => {
    const [email, setEmail] = useState('');
    const [busy, setBusy] = useState(false);
    // Candado síncrono: doble submit = dos códigos de reset distintos (ver RegisterForm).
    const submitLockRef = useRef(false);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitLockRef.current || busy) return;
        submitLockRef.current = true;
        setBusy(true);
        try {
            const res = await capacitorFetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.auth.forgotPassword}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim() }),
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data?.message ?? 'Operación no disponible.');
                return;
            }
            toast.success(data?.message ?? 'Si el email existe, te hemos enviado un código.');
            onCodeSent({
                verificationToken: data.verificationToken,
                expiresAt: data.expiresAt,
                email: email.trim(),
            });
        } catch (err: any) {
            toast.error(err?.message ?? 'Error de red.');
        } finally {
            submitLockRef.current = false;
            setBusy(false);
        }
    };

    return (
        <form onSubmit={onSubmit} className="flex flex-col">
            <p className="mb-3 font-display text-sm leading-snug text-ink-muted">
                Te enviaremos un código para restablecer o añadir tu contraseña.
            </p>
            <FieldGroup label="Correo electrónico">
                <Input
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="nombre@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={INPUT_REBRAND}
                />
            </FieldGroup>
            <Button type="submit" disabled={busy || !email} className={`${PRIMARY_BTN} mt-6`}>
                {busy ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando código…</> : 'Enviar código'}
            </Button>
        </form>
    );
};

// ── Reset password (paso 2: OTP + nueva contraseña) ──
const ResetPasswordForm: React.FC<{
    ctx: OtpContext;
    onSuccess: () => void;
    onResend: (newCtx: { verificationToken: string; expiresAt: string }) => void;
}> = ({ ctx, onSuccess, onResend }) => {
    const { updateUser } = useAuth();
    const [code, setCode] = useState('');
    const [newPwd, setNewPwd] = useState('');
    const [showPwd, setShowPwd] = useState(false);
    const [busy, setBusy] = useState(false);
    const [cooldown, setCooldown] = useState(30);
    const [resending, setResending] = useState(false);
    // Candados síncronos contra doble submit/reenvío (ver OtpForm).
    const submitLockRef = useRef(false);
    const resendLockRef = useRef(false);

    useEffect(() => {
        const timer = setInterval(() => setCooldown(c => (c > 0 ? c - 1 : 0)), 1000);
        return () => clearInterval(timer);
    }, []);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitLockRef.current || busy || code.length !== 6 || newPwd.length < 8) return;
        submitLockRef.current = true;
        setBusy(true);
        try {
            const res = await capacitorFetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.auth.resetPassword}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    verificationToken: ctx.verificationToken,
                    code,
                    newPassword: newPwd,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data?.message ?? 'No se pudo restablecer.');
                return;
            }
            if (data.token && data.user) {
                const [accessToken, refreshToken] = (data.token as string).split('|');
                authService.setTokens(accessToken, refreshToken);
                authService.scheduleTokenRefresh();
                updateUser(data.user, accessToken);
            }
            toast.success('Contraseña actualizada. ¡Bienvenido de vuelta!');
            onSuccess();
        } catch (err: any) {
            toast.error(err?.message ?? 'Error de red.');
        } finally {
            submitLockRef.current = false;
            setBusy(false);
        }
    };

    const resend = async () => {
        if (resendLockRef.current || resending || cooldown > 0) return;
        resendLockRef.current = true;
        setResending(true);
        try {
            const res = await capacitorFetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.auth.resendOtp}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ verificationToken: ctx.verificationToken }),
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data?.message ?? 'No se pudo reenviar.');
                if (typeof data?.retryAfter === 'number') setCooldown(data.retryAfter);
                return;
            }
            toast.success('Te hemos enviado un nuevo código.');
            setCode('');
            onResend({ verificationToken: data.verificationToken, expiresAt: data.expiresAt });
            setCooldown(30);
        } catch (err: any) {
            // Antes faltaba el catch: un fallo de red dejaba una promesa rechazada sin manejar.
            toast.error(err?.message ?? 'Error de red.');
        } finally {
            resendLockRef.current = false;
            setResending(false);
        }
    };

    return (
        <form onSubmit={onSubmit} className="space-y-4">
            <p className="text-center font-display text-sm leading-snug text-ink-muted">
                Introduce el código que enviamos a <strong className="font-semibold text-ink-strong">{ctx.email}</strong> y tu nueva contraseña.
            </p>
            <div className="flex justify-center">
                <InputOTP maxLength={6} value={code} onChange={(v) => setCode(v.replace(/\D/g, ''))} autoFocus>
                    <InputOTPGroup className="gap-2">
                        {[0, 1, 2, 3, 4, 5].map(i => (
                            <InputOTPSlot
                                key={i}
                                index={i}
                                className={OTP_SLOT}
                            />
                        ))}
                    </InputOTPGroup>
                </InputOTP>
            </div>
            <FieldGroup label="Nueva contraseña">
                <Input
                    type={showPwd ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    minLength={8}
                    maxLength={128}
                    placeholder="Mínimo 8 caracteres"
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    className={`${INPUT_REBRAND} pr-11`}
                />
                <button
                    type="button"
                    onClick={() => setShowPwd(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-soft transition-colors hover:text-ink-muted"
                    tabIndex={-1}
                    aria-label={showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
            </FieldGroup>
            <Button type="submit" disabled={busy || code.length !== 6 || newPwd.length < 8} className={PRIMARY_BTN}>
                {busy ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Restableciendo…</> : 'Restablecer contraseña'}
            </Button>
            <div className="text-center font-display text-sm text-ink-muted">
                ¿No te llegó?{' '}
                <button
                    type="button"
                    onClick={resend}
                    disabled={cooldown > 0 || resending}
                    className="font-medium text-brand underline-offset-2 transition-colors hover:text-brand-hover hover:underline disabled:text-ink-soft disabled:no-underline"
                >
                    {cooldown > 0 ? `Reenviar en ${cooldown}s` : (resending ? 'Reenviando…' : 'Reenviar código')}
                </button>
            </div>
        </form>
    );
};

// Helper: label pequeña encima del input (antes era un icono dentro del campo — sin
// función real, solo relleno visual). La label dice qué es el campo; ya no hace falta
// repetirlo en el placeholder, que ahora muestra un ejemplo de formato.
const FieldGroup: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div>
        <label className="mb-1.5 block font-display text-caption font-medium text-ink-muted">{label}</label>
        <div className="relative">{children}</div>
    </div>
);

/** Clases compartidas para todos los Input del modal. Esquina 10px — comparte familia
 *  con los botones sociales, deja la pastilla (rounded-full) exclusiva del CTA. */
const INPUT_REBRAND =
    'h-11 rounded-[10px] border-line bg-white px-4 font-display text-base md:text-body text-ink-strong placeholder:text-ink-soft transition-all focus:border-brand focus:ring-2 focus:ring-brand/20';

/** Botón primario: única forma en pastilla de la tarjeta — por eso ahora se distingue
 *  como "la acción". Plano en reposo, elevación solo al hover (antes tenía un halo
 *  azul difuminado siempre activo). */
const PRIMARY_BTN =
    'mt-3 h-11 w-full rounded-full bg-brand font-display text-body font-semibold text-white shadow-[0_1px_2px_rgba(15,23,42,0.08)] transition-all hover:bg-brand-hover hover:shadow-[0_4px_12px_hsl(var(--brand)/0.25)] disabled:opacity-50 disabled:shadow-none';

/** Clases compartidas para los slots OTP. */
const OTP_SLOT =
    'h-14 w-12 rounded-xl border-line text-xl font-bold focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/15';

export default LoginModal;
