import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User as UserIcon, Loader2, ArrowLeft, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '../contexts/AuthContext';
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
    const [step, setStep] = useState<Step>('social');
    const [tab, setTab] = useState<'login' | 'register'>(initialTab);
    const [otpCtx, setOtpCtx] = useState<OtpContext | null>(null);

    // Reset al abrir/cerrar.
    useEffect(() => {
        if (open) {
            setStep('social');
            setTab(initialTab);
            setOtpCtx(null);
        }
    }, [open, initialTab]);

    const handleSuccess = () => {
        onOpenChange(false);
        onSuccess?.();
    };

    return (
        <ResponsiveModal
            open={open}
            onOpenChange={onOpenChange}
            title={
                step === 'social'
                    ? tab === 'login' ? 'Inicia sesión' : 'Crea tu cuenta'
                    : step === 'forgot-email' ? 'Recuperar contraseña'
                    : 'Verifica tu correo'
            }
            description={
                step === 'social'
                    ? 'Accede con Google, Apple o tu correo.'
                    : step === 'forgot-email' ? 'Te enviaremos un código para restablecer o añadir tu contraseña.'
                    : `Te hemos enviado un código a ${otpCtx?.email ?? ''}`
            }
            mobileBreakpoint={768}
            snapPoints={[0.95]}
            className="max-w-md md:max-h-[640px]"
        >
            <div className="flex flex-col h-full overflow-y-auto px-5 pb-6 pt-4 md:px-7 md:pb-7">
                <AnimatePresence mode="wait" initial={false}>
                    {step === 'social' && (
                        <motion.div
                            key="social"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Tabs value={tab} onValueChange={(v) => setTab(v as 'login' | 'register')} className="w-full">
                                <TabsList className="grid w-full grid-cols-2 mb-5 h-11 bg-gray-100 p-1 rounded-full">
                                    <TabsTrigger
                                        value="login"
                                        className="rounded-full transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600"
                                    >
                                        Inicia sesión
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="register"
                                        className="rounded-full transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600"
                                    >
                                        Crea tu cuenta
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="login" className="space-y-4">
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
                                </TabsContent>

                                <TabsContent value="register" className="space-y-4">
                                    <SocialButtonsRow onSuccess={handleSuccess} />
                                    <Separator />
                                    <RegisterForm
                                        onCodeSent={(ctx) => {
                                            setOtpCtx({ ...ctx, origin: 'register' });
                                            setStep('verify-email');
                                        }}
                                    />
                                </TabsContent>
                            </Tabs>

                            <p className="text-[11px] text-gray-500 text-center mt-5 leading-relaxed">
                                Al continuar aceptas nuestros{' '}
                                <a href="/terms.html" className="underline hover:text-gray-700">Términos</a>
                                {' '}y la{' '}
                                <a href="/privacy-policy.html" className="underline hover:text-gray-700">Política de Privacidad</a>.
                            </p>
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
            </div>
        </ResponsiveModal>
    );
};

// ─── Subcomponentes ──────────────────────────────────────────────────────────────

const Separator: React.FC = () => (
    <div className="relative my-4 flex items-center">
        <span className="flex-grow border-t border-gray-200" />
        <span className="mx-4 text-[11px] uppercase tracking-widest font-medium text-gray-400">
            o continúa con
        </span>
        <span className="flex-grow border-t border-gray-200" />
    </div>
);

const SocialButtonsRow: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
    const isNative = Capacitor.isNativePlatform();
    return (
        <div className="space-y-2.5">
            <GoogleSignInButton variant="default" onSuccess={onSuccess} />
            {/* AppleSignInButton se auto-oculta en web (isAvailable=false). Solo aparece en iOS/macOS. */}
            {isNative && <AppleSignInButton variant="default" onSuccess={onSuccess} />}
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

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (busy) return;
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
            setBusy(false);
        }
    };

    return (
        <form onSubmit={onSubmit} className="space-y-3">
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
                {busy ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Entrando…</> : 'Inicia sesión'}
            </Button>
            {/* Hint para usuarios OAuth-only: les recordamos usar los botones sociales. */}
            <p className="text-xs text-gray-500 text-center pt-1">
                ¿Te registraste con Google o Apple? Pulsa el botón de arriba.
            </p>
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

    const strengthHint = (() => {
        if (password.length === 0) return null;
        if (password.length < 8) return { label: 'Demasiado corta', cls: 'text-red-600' };
        if (password.length < 12) return { label: 'Aceptable', cls: 'text-amber-600' };
        return { label: 'Fuerte', cls: 'text-emerald-600' };
    })();

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (busy) return;
        setBusy(true);
        try {
            const res = await capacitorFetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.auth.register}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
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
            setBusy(false);
        }
    };

    return (
        <form onSubmit={onSubmit} className="space-y-3">
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
            <Button type="submit" disabled={busy || !name || !email || !password} className={PRIMARY_BTN}>
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

    useEffect(() => {
        // Countdown para botón "Reenviar".
        const timer = setInterval(() => {
            setCooldown(c => (c > 0 ? c - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const submit = async (autoCode?: string) => {
        const finalCode = autoCode ?? code;
        if (busy || finalCode.length !== 6) return;
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
            setBusy(false);
        }
    };

    const resend = async () => {
        if (resending || cooldown > 0) return;
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
            onResend({ verificationToken: data.verificationToken, expiresAt: data.expiresAt });
            setCooldown(30);
        } catch (err: any) {
            toast.error(err?.message ?? 'Error de red.');
        } finally {
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
                        setCode(v);
                        if (v.length === 6) submit(v);
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

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (busy) return;
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
            setBusy(false);
        }
    };

    return (
        <form onSubmit={onSubmit} className="space-y-3">
            <p className="text-sm text-gray-600 mb-2">
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
            <Button type="submit" disabled={busy || !email} className={PRIMARY_BTN}>
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

    useEffect(() => {
        const timer = setInterval(() => setCooldown(c => (c > 0 ? c - 1 : 0)), 1000);
        return () => clearInterval(timer);
    }, []);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (busy || code.length !== 6 || newPwd.length < 8) return;
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
            setBusy(false);
        }
    };

    const resend = async () => {
        if (resending || cooldown > 0) return;
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
            onResend({ verificationToken: data.verificationToken, expiresAt: data.expiresAt });
            setCooldown(30);
        } finally {
            setResending(false);
        }
    };

    return (
        <form onSubmit={onSubmit} className="space-y-4">
            <p className="text-sm text-gray-600 text-center">
                Introduce el código que enviamos a <strong className="text-gray-900">{ctx.email}</strong> y tu nueva contraseña.
            </p>
            <div className="flex justify-center">
                <InputOTP maxLength={6} value={code} onChange={setCode} autoFocus>
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
    'w-full h-11 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-700 hover:via-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all';

/** Clases compartidas para los slots OTP. */
const OTP_SLOT =
    'w-12 h-14 text-xl font-bold border-gray-200 rounded-xl shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20';

export default LoginModal;
