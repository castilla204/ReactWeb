import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
// 🛡️ Round 28 — Sprint 4: i18n para textos UI multi-idioma (ES/EN).
import { useTranslation, Trans } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User as UserIcon, Loader2, ArrowLeft, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { getAuthToken } from '../lib/auth';
import { RoleChecker } from '../utils/roleChecker';
import { authService } from '../services/authService';
import { API_CONFIG } from '../config/api';
import { capacitorFetch } from '../utils/capacitorFetch';
import { GoogleSignInButton } from './GoogleSignInButton';
import { AppleSignInButton } from './AppleSignInButton';
import { ResponsiveModal } from './ui/responsive-modal';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
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
            navigate(isExpert ? '/expert-panel' : '/become-expert');
            return;
        }
        onSuccess?.();
    }, [onOpenChange, onSuccess, pendingExpertRedirect, navigate, isExpert]);

    const handleExpertSignupClick = useCallback(() => {
        if (isAuthenticated) {
            onOpenChange(false);
            navigate(isExpert ? '/expert-panel' : '/become-expert');
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
                    ? 'Tu cuenta'
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
            className="max-w-md md:max-h-[600px]"
            drawerClassName="!h-auto"
            drawerMaxHeight="min(92dvh, calc(100dvh - env(safe-area-inset-bottom, 0px) - 2.75rem))"
            dialogClassName="md:!max-w-[460px] lg:!max-w-[460px] rounded-xl border-[#ebebeb] shadow-[0_12px_48px_rgba(0,0,0,0.14)]"
            dialogHeaderClassName="border-[#ebebeb] bg-white px-5 pb-2.5 pt-4"
        >
            <div className="w-full md:mx-auto md:max-w-[440px]">
                <div
                    className={`px-4 pt-1 md:px-5 md:pt-3 md:pb-5 ${
                        step !== 'social'
                            ? 'pb-5 max-md:pb-[max(1.25rem,env(safe-area-inset-bottom))]'
                            : ''
                    }`}
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
                            <Tabs value={tab} onValueChange={(v) => setTab(v as 'login' | 'register')} className="flex w-full flex-col">
                                <TabsList className="mb-3 grid h-9 w-full grid-cols-2 rounded-full bg-[#f5f5f5] p-0.5">
                                    <TabsTrigger
                                        value="login"
                                        className="rounded-full text-[13px] transition-all data-[state=active]:bg-white data-[state=active]:text-brand data-[state=active]:shadow-sm"
                                    >
                                        <TabLabel kind="login" />
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="register"
                                        className="rounded-full text-[13px] transition-all data-[state=active]:bg-white data-[state=active]:text-brand data-[state=active]:shadow-sm"
                                    >
                                        <TabLabel kind="register" />
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="login" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                                    <div className="flex w-full flex-col gap-2.5">
                                        <SocialButtonsRow onSuccess={handleSuccess} />
                                        <Separator />
                                        <LoginForm
                                            onSuccess={handleSuccess}
                                            onGoToForgot={() => setStep('forgot-email')}
                                            onEmailUnverified={(ctx) => {
                                                setOtpCtx({ ...ctx, origin: 'login-unverified' });
                                                setStep('verify-email');
                                            }}
                                        />
                                    </div>
                                </TabsContent>

                                <TabsContent value="register" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                                    <div className="flex w-full flex-col gap-2.5">
                                        <SocialButtonsRow onSuccess={handleSuccess} />
                                        <Separator />
                                        <RegisterForm
                                            onCodeSent={(ctx) => {
                                                setOtpCtx({ ...ctx, origin: 'register' });
                                                setStep('verify-email');
                                            }}
                                        />
                                    </div>
                                </TabsContent>
                            </Tabs>
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
                                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-3"
                            >
                                <ArrowLeft className="w-4 h-4" /> Volver
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
                                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-3"
                            >
                                <ArrowLeft className="w-4 h-4" /> Volver
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
                                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-3"
                            >
                                <ArrowLeft className="w-4 h-4" /> Volver
                            </button>
                            <ResetPasswordForm
                                ctx={otpCtx}
                                onSuccess={handleSuccess}
                                onResend={(newCtx) => setOtpCtx({ ...otpCtx, ...newCtx })}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
                {step === 'social' && (
                    <AuthModalFooter isExpert={isExpert} onExpertAction={handleExpertSignupClick} />
                )}
                </div>
            </div>
        </ResponsiveModal>
    );
};

// 🛡️ Round 28 — Sprint 4: pequeño helper i18n para tabs.
const TabLabel: React.FC<{ kind: 'login' | 'register' }> = ({ kind }) => {
    const { t } = useTranslation();
    return <>{kind === 'login' ? t('auth.login.title') : t('auth.register.title')}</>;
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
            <span className="text-[11px] leading-relaxed text-[#717171]">
                <Trans
                    i18nKey="auth.register.acceptTerms"
                    components={{
                        terms: (
                            <a
                                href="/terms.html"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-brand underline-offset-2 hover:underline"
                            />
                        ),
                        privacy: (
                            <a
                                href="/privacy-policy.html"
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

/** Pie legal + experto: fijo al fondo del drawer en móvil; una línea en desktop. */
const AuthModalFooter: React.FC<{
    isExpert: boolean;
    onExpertAction: () => void;
}> = ({ isExpert, onExpertAction }) => {
    const expertLabel = isExpert ? 'Panel experto' : 'Alta como experto';

    const legalLinks = (
        <>
            <a href="/terms.html" className="hover:text-[#717171] underline-offset-2 hover:underline">
                Términos
            </a>
            <span aria-hidden> · </span>
            <a href="/privacy-policy.html" className="hover:text-[#717171] underline-offset-2 hover:underline">
                Privacidad
            </a>
        </>
    );

    return (
        <div className="mt-3 border-t border-[#ebebeb] pt-2.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:mt-3 md:border-0 md:pb-0 md:pt-0">
            <p className="text-center text-[10px] leading-relaxed text-[#9ca3af]">
                {legalLinks}
                <span aria-hidden> · </span>
                <button
                    type="button"
                    onClick={onExpertAction}
                    className="font-semibold text-brand hover:text-brand-hover hover:underline underline-offset-2"
                >
                    {expertLabel}
                </button>
            </p>
        </div>
    );
};

const Separator: React.FC = () => (
    <div className="relative my-2 flex items-center gap-3">
        <span className="h-px flex-1 bg-[#ebebeb]" />
        <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-[#b0b0b0]">o</span>
        <span className="h-px flex-1 bg-[#ebebeb]" />
    </div>
);

const SocialButtonsRow: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
    // 🎨 Round 19: Google + Apple en MISMA LÍNEA (grid 2-col).
    // AppleSignInButton ahora SIEMPRE renderiza — disabled con tag "Próx." en web/Android
    // (hasta completar Apple Developer setup: Service ID + .p8 key), habilitado en iOS/macOS.
    // Así el usuario ve que la opción existe y entiende que estará disponible pronto.
    return (
        <div className="grid w-full max-w-full grid-cols-2 gap-2">
            <GoogleSignInButton variant="compact" onSuccess={onSuccess} label="Google" />
            <AppleSignInButton variant="compact" onSuccess={onSuccess} />
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
                toast.error(data?.message ?? 'No se pudo iniciar sesión.');
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
                toast.success('¡Bienvenido!');
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
        <form onSubmit={onSubmit} className="space-y-2.5">
            <Field icon={<Mail className="w-4 h-4" />}>
                <Input
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="Correo electrónico"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={INPUT_REBRAND}
                />
            </Field>
            <Field icon={<Lock className="w-4 h-4" />}>
                <Input
                    type={showPwd ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${INPUT_REBRAND} pr-10`}
                />
                <button
                    type="button"
                    onClick={() => setShowPwd(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                    aria-label={showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
            </Field>
            <div className="flex justify-end -mt-1">
                <button
                    type="button"
                    onClick={onGoToForgot}
                    className="text-xs text-gray-500 hover:text-gray-800 underline-offset-2 hover:underline"
                >
                    ¿Olvidaste tu contraseña?
                </button>
            </div>
            <Button type="submit" disabled={busy || !email || !password} className={PRIMARY_BTN}>
                {busy ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Entrando…</> : 'Continuar'}
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
        if (password.length < 8) return { label: 'Demasiado corta', cls: 'text-red-600' };
        if (password.length < 12) return { label: 'Aceptable', cls: 'text-amber-600' };
        return { label: 'Fuerte', cls: 'text-emerald-600' };
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
                toast.error(data?.message ?? 'No se pudo crear la cuenta.');
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
        <form onSubmit={onSubmit} className="space-y-2.5">
            <Field icon={<UserIcon className="w-4 h-4" />}>
                <Input
                    type="text"
                    autoComplete="name"
                    required
                    minLength={2}
                    maxLength={100}
                    placeholder="Nombre completo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={INPUT_REBRAND}
                />
            </Field>
            <Field icon={<Mail className="w-4 h-4" />}>
                <Input
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="Correo electrónico"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={INPUT_REBRAND}
                />
            </Field>
            <Field icon={<Lock className="w-4 h-4" />}>
                <Input
                    type={showPwd ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    minLength={8}
                    maxLength={128}
                    placeholder="Contraseña (mín. 8 caracteres)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${INPUT_REBRAND} pr-10`}
                />
                <button
                    type="button"
                    onClick={() => setShowPwd(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                    aria-label={showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
            </Field>
            {strengthHint && (
                <p className={`text-[11px] -mt-1.5 ml-3 ${strengthHint.cls}`}>
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
                <div className="rounded-full bg-blue-50 p-3 ring-1 ring-blue-100">
                    <ShieldCheck className="w-6 h-6 text-blue-600" />
                </div>
            </div>
            <p className="text-sm text-gray-600">
                Introduce el código de 6 dígitos que enviamos a <strong className="text-gray-900">{ctx.email}</strong>.
            </p>
            {showLinkingSubtitle && (
                <p className="text-sm text-blue-600 -mt-2">
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
            <div className="text-sm text-gray-500">
                ¿No te llegó?{' '}
                <button
                    onClick={resend}
                    disabled={cooldown > 0 || resending}
                    className="text-blue-600 hover:underline disabled:text-gray-400 disabled:no-underline"
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
            <p className="mb-3 text-sm text-gray-600">
                Te enviaremos un código para restablecer o añadir tu contraseña.
            </p>
            <Field icon={<Mail className="w-4 h-4" />}>
                <Input
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="Correo electrónico"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={INPUT_REBRAND}
                />
            </Field>
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
            <p className="text-sm text-gray-600 text-center">
                Introduce el código que enviamos a <strong className="text-gray-900">{ctx.email}</strong> y tu nueva contraseña.
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
            <Field icon={<Lock className="w-4 h-4" />}>
                <Input
                    type={showPwd ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    minLength={8}
                    maxLength={128}
                    placeholder="Nueva contraseña (mín. 8)"
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    className={`${INPUT_REBRAND} pr-10`}
                />
                <button
                    type="button"
                    onClick={() => setShowPwd(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                    aria-label={showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
            </Field>
            <Button type="submit" disabled={busy || code.length !== 6 || newPwd.length < 8} className={PRIMARY_BTN}>
                {busy ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Restableciendo…</> : 'Restablecer contraseña'}
            </Button>
            <div className="text-sm text-gray-500 text-center">
                ¿No te llegó?{' '}
                <button
                    type="button"
                    onClick={resend}
                    disabled={cooldown > 0 || resending}
                    className="text-blue-600 hover:underline disabled:text-gray-400 disabled:no-underline"
                >
                    {cooldown > 0 ? `Reenviar en ${cooldown}s` : (resending ? 'Reenviando…' : 'Reenviar código')}
                </button>
            </div>
        </form>
    );
};

// Helper: input con icono prepended.
const Field: React.FC<{ icon: React.ReactNode; children: React.ReactNode }> = ({ icon, children }) => (
    <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">{icon}</span>
        {children}
    </div>
);

/** Clases compartidas para todos los Input del modal — pill estilo HomePresentation. */
const INPUT_REBRAND =
    'pl-10 h-11 rounded-full bg-gray-50 focus:bg-white border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all';

/** Clases compartidas para los botones primarios (submit) — gradient cyan→blue→indigo. */
const PRIMARY_BTN =
    'w-full h-11 rounded-lg bg-brand hover:bg-brand-hover text-white text-sm font-semibold shadow-none transition-colors';

/** Clases compartidas para los slots OTP. */
const OTP_SLOT =
    'w-12 h-14 text-xl font-bold border-gray-200 rounded-xl shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20';

export default LoginModal;
