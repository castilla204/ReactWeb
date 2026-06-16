import React from 'react';
import {
    ArrowLeft,
    ChevronRight,
    Check,
    Loader2,
    Wallet,
    ShieldCheck,
    CalendarClock,
    BadgeCheck,
    Star,
    Clock,
} from 'lucide-react';
import { HeroBannerPhoto } from '../HeroBannerPhoto';
import {
    HP_PANEL_GRADIENT,
    SD_MOBILE_FOOTER_SHELL_CLASS,
    SD_MOBILE_GUTTER_CLASS,
    SD_MOBILE_SCROLL_PAD_CLASS,
    hpIconButtonClass,
} from '../../constants/homepageTypography';

export type BecomeExpertStepMeta = {
    id: number;
    label: string;
};

const TRUST_ITEMS = [
    'Perfil verificado visible para clientes',
    'Cobros seguros con Stripe',
    'Tú eliges zona y horarios',
] as const;

const FOCUS_RING =
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand';

/** Una tarjeta por paso — mismo patrón que checkout. */
export const BE_CARD_CLASS = 'overflow-hidden rounded-xl border border-[#e8e8e8] bg-white shadow-sm';

export function BecomeExpertProgress({
    steps,
    currentStep,
    phaseLabel,
}: {
    steps: readonly BecomeExpertStepMeta[];
    currentStep: number;
    phaseLabel?: string;
}) {
    const progress =
        steps.length <= 1
            ? 100
            : Math.round(((currentStep - 1) / (steps.length - 1)) * 100);
    const currentLabel = phaseLabel ?? steps[currentStep - 1]?.label ?? '';

    return (
        <nav className="space-y-2" aria-label="Progreso del registro">
            <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm font-semibold text-[#1c1c1c]">
                    {phaseLabel ? (
                        phaseLabel
                    ) : (
                        <>
                            Paso {currentStep} de {steps.length}
                            <span className="font-normal text-[#6a6a6a]"> · {currentLabel}</span>
                        </>
                    )}
                </p>
                {!phaseLabel && (
                    <span className="text-xs tabular-nums text-[#6a6a6a]">{progress}%</span>
                )}
            </div>
            <div
                className="h-1 overflow-hidden rounded-full bg-[#e8e8e8]"
                role="progressbar"
                aria-valuenow={phaseLabel ? 100 : progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuetext={
                    phaseLabel
                        ? phaseLabel
                        : `Paso ${currentStep} de ${steps.length}, ${progress} por ciento`
                }
            >
                <div
                    className="h-full rounded-full bg-brand transition-[width] duration-300 ease-out"
                    style={{ width: phaseLabel ? '100%' : `${progress}%` }}
                />
            </div>
        </nav>
    );
}

export function BecomeExpertStepHeader({
    title,
    description,
    compact = false,
}: {
    title: string;
    description: string;
    compact?: boolean;
}) {
    return (
        <header className={`hidden space-y-1.5 lg:block ${compact ? 'lg:space-y-1' : ''}`}>
            <h2
                className={`font-display font-semibold leading-snug tracking-[-0.02em] text-[#1c1c1c] ${
                    compact ? 'text-lg' : 'text-base sm:text-lg'
                }`}
            >
                {title}
            </h2>
            <p className="text-sm leading-relaxed text-[#6a6a6a]">{description}</p>
        </header>
    );
}

interface BecomeExpertWizardShellProps {
    steps: readonly BecomeExpertStepMeta[];
    currentStep: number;
    onBack: () => void;
    onNavBack: () => void;
    onNext: () => void;
    onSubmit: () => void;
    canGoNext: boolean;
    canSubmit: boolean;
    isSubmitting: boolean;
    isLastStep: boolean;
    hideFooter?: boolean;
    progressPhaseLabel?: string;
    footerHint?: string | null;
    initialLoading?: boolean;
    children: React.ReactNode;
}

export function BecomeExpertWizardShell({
    steps,
    currentStep,
    onBack,
    onNavBack,
    onNext,
    onSubmit,
    canGoNext,
    canSubmit,
    isSubmitting,
    isLastStep,
    hideFooter = false,
    progressPhaseLabel,
    footerHint,
    initialLoading = false,
    children,
}: BecomeExpertWizardShellProps) {
    const navBackDisabled = currentStep === 1 && !progressPhaseLabel;

    const footer = (
        <div className="flex flex-col gap-2">
            {footerHint && (
                <p className="text-center text-xs leading-relaxed text-[#6a6a6a] lg:text-left" role="status">
                    {footerHint}
                </p>
            )}
            <div className="flex items-center justify-between gap-3">
                <button
                    type="button"
                    onClick={onNavBack}
                    disabled={navBackDisabled}
                    aria-disabled={navBackDisabled}
                    className={`inline-flex h-11 min-w-[88px] items-center justify-center gap-1.5 rounded-full px-3 text-sm font-semibold transition-colors ${FOCUS_RING} ${
                        navBackDisabled
                            ? 'pointer-events-none text-[#9ca3af] opacity-50'
                            : 'text-[#6a6a6a] hover:bg-[#f5f5f5] hover:text-[#1c1c1c]'
                    }`}
                >
                    <ArrowLeft className="h-4 w-4 shrink-0" />
                    <span className="hidden min-[400px]:inline">Atrás</span>
                </button>

                {isLastStep ? (
                    <button
                        type="button"
                        onClick={onSubmit}
                        disabled={!canSubmit || isSubmitting}
                        aria-busy={isSubmitting}
                        className={`sd-btn-primary h-11 min-w-0 flex-1 gap-2 px-5 sm:min-w-[160px] sm:flex-none disabled:cursor-wait ${FOCUS_RING}`}
                    >
                        {isSubmitting ? (
                            <span className="truncate">Publicando…</span>
                        ) : (
                            <>
                                <span className="truncate">Publicar perfil</span>
                                <Check className="h-4 w-4 shrink-0" />
                            </>
                        )}
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={onNext}
                        disabled={!canGoNext}
                        className={`sd-btn-primary h-11 min-w-0 flex-1 gap-2 px-5 sm:min-w-[130px] sm:flex-none disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS_RING}`}
                    >
                        <span className="truncate">Siguiente</span>
                        <ChevronRight className="h-4 w-4 shrink-0" />
                    </button>
                )}
            </div>
        </div>
    );

    const scrollPad = hideFooter
        ? 'pb-[calc(2rem+env(safe-area-inset-bottom,0px))]'
        : SD_MOBILE_SCROLL_PAD_CLASS;

    return (
        <div className="become-expert-wizard flex h-[100dvh] max-h-[100dvh] min-h-0 flex-col overflow-hidden bg-[#fafafa] font-display text-[#1c1c1c] lg:grid lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_minmax(420px,640px)] xl:grid-cols-[minmax(320px,1fr)_680px]">
            <aside
                className="relative hidden min-h-0 flex-col justify-between overflow-y-auto border-r border-[#e8e8e8] lg:flex lg:p-10 xl:p-12"
                style={{ background: HP_PANEL_GRADIENT }}
            >
                <div>
                    <button
                        type="button"
                        onClick={onBack}
                        className={`${hpIconButtonClass} ${FOCUS_RING}`}
                        aria-label="Volver al inicio"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <p className="mt-8 text-xs font-semibold uppercase tracking-[0.12em] text-brand">
                        Programa de expertos
                    </p>
                    <h1 className="mt-3 max-w-md font-display text-[1.75rem] font-semibold leading-[1.15] tracking-[-0.03em] text-[#1c1c1c] xl:text-[2rem]">
                        Publica tu perfil y recibe encargos
                    </h1>
                    <p className="mt-3 max-w-md text-[15px] leading-relaxed text-[#6a6a6a]">
                        Completa tu perfil, define tu zona de cobertura y conecta Stripe para cobrar con seguridad.
                    </p>
                    <ul className="mt-8 space-y-3">
                        {TRUST_ITEMS.map((item, i) => (
                            <li key={item} className="flex gap-2 text-sm leading-relaxed text-[#444]">
                                <span className="font-semibold tabular-nums text-[#1c1c1c]">{i + 1}.</span>
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <p className="mt-8 shrink-0 text-xs leading-relaxed text-[#6a6a6a]">
                    Pagos seguros con Stripe. Tus datos solo se usan para verificar tu perfil.
                </p>
            </aside>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white lg:h-full">
                <header className="sticky top-0 z-30 flex min-h-12 shrink-0 items-center gap-2 border-b border-[#e8e8e8] bg-white/95 px-4 pt-[max(0px,env(safe-area-inset-top,0px))] backdrop-blur-sm lg:hidden">
                    <button
                        type="button"
                        onClick={onBack}
                        className={`sd-icon-btn h-9 w-9 shrink-0 ${FOCUS_RING}`}
                        aria-label="Volver"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div className="min-w-0 flex-1">
                        <p className="text-[15px] font-semibold tracking-[-0.02em] text-[#1c1c1c]">
                            Registro de experto
                        </p>
                        <p className="text-xs text-[#6a6a6a]">Encargos verificados en tu zona</p>
                    </div>
                </header>

                <main
                    id="become-expert-main"
                    className={`min-h-0 flex-1 overflow-y-auto overscroll-y-contain ${scrollPad}`}
                >
                    <div className={`${SD_MOBILE_GUTTER_CLASS} mx-auto w-full py-5 lg:max-w-none lg:px-10 lg:py-8 xl:px-12`}>
                        {initialLoading ? (
                            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                                <Loader2 className="h-8 w-8 animate-spin text-brand" aria-hidden />
                                <p className="text-sm text-[#6a6a6a]">Comprobando tu cuenta…</p>
                            </div>
                        ) : (
                            <>
                                <BecomeExpertProgress
                                    steps={steps}
                                    currentStep={currentStep}
                                    phaseLabel={progressPhaseLabel}
                                />
                                <div className="mt-5 space-y-5 lg:mt-8 lg:space-y-6">{children}</div>
                            </>
                        )}
                    </div>
                </main>

                {!hideFooter && !initialLoading && (
                    <footer
                        className={`${SD_MOBILE_FOOTER_SHELL_CLASS} shrink-0 lg:static lg:z-auto lg:border-t lg:shadow-none`}
                    >
                        <div className={`${SD_MOBILE_GUTTER_CLASS} sd-mobile-footer-inner lg:px-10 lg:py-3 xl:px-12`}>
                            {footer}
                        </div>
                    </footer>
                )}
            </div>
        </div>
    );
}

export const BE_INPUT_CLASS =
    'w-full rounded-lg border border-[#e8e8e8] bg-white px-3.5 py-3 text-[15px] leading-snug text-[#1c1c1c] placeholder:text-[#9ca3af] transition-[border-color,box-shadow] focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/25';

export const BE_DAY_ACTIVE = 'bg-brand/[0.1] text-brand font-semibold';
export const BE_DAY_IDLE = 'bg-[#f5f5f5] text-[#444] hover:bg-[#ebebeb]';

const FAST_PATH_INTRO =
    'Mecánico, perito, agente o técnico: en Inspecciono haces revisiones presenciales y online antes de comprar (coches, viviendas, motos y más). Defines tu zona, publicas tus servicios y cobras cada encargo con Stripe.';

/** Razones para registrarse — el «por qué». */
const FAST_PATH_VALUE_PROPS = [
    {
        icon: Wallet,
        title: 'Tú fijas el precio',
        body: 'Cobras por encargo. Sin coste de alta ni cuota mensual.',
    },
    {
        icon: ShieldCheck,
        title: 'Cobro protegido',
        body: 'El cliente paga por adelantado; tú cobras al entregar el informe.',
    },
    {
        icon: CalendarClock,
        title: 'Tu zona, tus horarios',
        body: 'Decides dónde trabajas y cuándo estás disponible.',
    },
    {
        icon: BadgeCheck,
        title: 'Perfil verificado',
        body: 'Apareces en las búsquedas de clientes de tu área.',
    },
] as const;

/** Pasos del alta — el «cómo». Es una secuencia real, los números informan. */
const FAST_PATH_STEPS = [
    { title: 'Elige tu país y conecta Stripe', body: 'Verificación segura, solo una vez.' },
    { title: 'Completa tu perfil y tu zona', body: 'Foto, experiencia y radio de cobertura.' },
    { title: 'Recibe encargos y cobra', body: 'Los clientes te contratan; el dinero llega a tu cuenta.' },
] as const;

/** Avatares de prueba social — mismo origen que la homepage. */
const FAST_PATH_AVATARS = [13, 14, 15, 33] as const;

/**
 * Scrim de marca sobre la foto del oficio: tiñe la imagen de azul Inspecciono
 * y oscurece la zona del texto para garantizar contraste AA del copy blanco.
 * Es un velo de imagen (no un gradiente decorativo preset).
 */
export const BE_FAST_HERO_SCRIM =
    'linear-gradient(180deg, hsl(212 100% 16% / 0.28) 0%, hsl(212 100% 13% / 0.55) 58%, hsl(212 100% 11% / 0.86) 100%), ' +
    'linear-gradient(96deg, hsl(212 100% 17% / 0.90) 0%, hsl(212 100% 20% / 0.62) 46%, hsl(212 100% 26% / 0.30) 100%)';

/** Prueba social cualitativa: avatares + estrellas, sin cifras. */
function FastPathSocialProof({ tone = 'light' }: { tone?: 'onBrand' | 'light' }) {
    const onBrand = tone === 'onBrand';
    return (
        <div className="flex items-center gap-3">
            <div className="flex -space-x-2.5">
                {FAST_PATH_AVATARS.map((id) => (
                    <img
                        key={id}
                        src={`https://i.pravatar.cc/80?img=${id}`}
                        alt=""
                        aria-hidden
                        loading="lazy"
                        className={`h-8 w-8 rounded-full border-2 object-cover ${
                            onBrand ? 'border-white/75' : 'border-white shadow-sm'
                        }`}
                    />
                ))}
            </div>
            <div className="min-w-0">
                <div
                    className={`flex items-center gap-0.5 ${onBrand ? 'text-amber-300' : 'text-amber-400'}`}
                    aria-hidden
                >
                    {[0, 1, 2, 3, 4].map((i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-current" strokeWidth={0} />
                    ))}
                </div>
                <p className={`mt-0.5 text-xs leading-snug ${onBrand ? 'text-white/85' : 'text-[#6a6a6a]'}`}>
                    Profesionales verificados por toda España
                </p>
            </div>
        </div>
    );
}

/**
 * Gancho «listo en 15 min» con acento ámbar (color secundario de la marca,
 * presente en mapas y estrellas). Dos tonos: sobre el héroe azul y sobre blanco.
 */
function FastPathReadyBadge({ tone = 'light' }: { tone?: 'onBrand' | 'light' }) {
    const onBrand = tone === 'onBrand';
    return (
        <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12.5px] font-semibold ${
                onBrand
                    ? 'bg-amber-400/15 text-amber-100 ring-1 ring-amber-300/35'
                    : 'bg-amber-50 text-amber-900 ring-1 ring-amber-200'
            }`}
        >
            <Clock className={`h-3.5 w-3.5 ${onBrand ? 'text-amber-300' : 'text-amber-500'}`} strokeWidth={2.5} />
            Listo para recibir pagos en ~15 min
        </span>
    );
}

/** Lista de pasos del alta — reutilizada en intro móvil y columna de formulario. */
export function BecomeExpertFastPathSteps({ className = '' }: { className?: string }) {
    return (
        <div className={className}>
            <h2 className="font-display text-[1.05rem] font-semibold tracking-[-0.01em] text-[#1c1c1c]">
                Cómo empiezas
            </h2>
            <ol className="mt-3.5 space-y-3.5" aria-label="Pasos del alta">
                {FAST_PATH_STEPS.map((step, index) => (
                    <li key={step.title} className="flex gap-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand/10 text-[13px] font-bold tabular-nums text-brand">
                            {index + 1}
                        </span>
                        <div className="pt-0.5">
                            <p className="text-[14px] font-semibold leading-snug text-[#1c1c1c]">{step.title}</p>
                            <p className="mt-0.5 text-[13px] leading-snug text-[#6a6a6a]">{step.body}</p>
                        </div>
                    </li>
                ))}
            </ol>
        </div>
    );
}

/** Intro móvil — hero de marca con foto + scrim, prueba social y razones. */
export function BecomeExpertFastPathIntro({ onBack }: { onBack: () => void }) {
    return (
        <div className="lg:hidden">
            {/* Hero a sangre con foto del oficio velada en azul de marca */}
            <div className="relative -mx-5 overflow-hidden">
                <div className="absolute inset-0">
                    <HeroBannerPhoto imgClassName="object-cover object-[62%_30%]" />
                </div>
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0"
                    style={{ background: BE_FAST_HERO_SCRIM }}
                />
                <div className="relative z-10 flex min-h-[25rem] flex-col px-5 pb-6 pt-[max(0.75rem,env(safe-area-inset-top,0px))]">
                    <button
                        type="button"
                        onClick={onBack}
                        className={`${hpIconButtonClass} self-start border-white/30 bg-white/15 text-white backdrop-blur-sm hover:bg-white/25 active:bg-white/25 ${FOCUS_RING}`}
                        aria-label="Volver"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>

                    <div className="be-fast-reveal mt-auto" style={{ animationDelay: '40ms' }}>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/85">
                            Programa de expertos
                        </p>
                        <h1 className="mt-2 font-display text-[1.95rem] font-bold leading-[1.08] tracking-[-0.025em] text-white [text-wrap:balance]">
                            Tu experiencia, en ingresos
                        </h1>
                        <span aria-hidden className="mt-3 block h-1 w-12 rounded-full bg-amber-400" />
                        <p className="mt-3 text-[14px] leading-relaxed text-white/85 [text-wrap:pretty]">
                            {FAST_PATH_INTRO}
                        </p>
                        <div className="mt-4 flex flex-col items-start gap-3.5">
                            <FastPathReadyBadge tone="onBrand" />
                            <FastPathSocialProof tone="onBrand" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Razones — lista sobria con filete, no tarjetas de colores */}
            <ul className="mt-6 overflow-hidden rounded-2xl border border-[#e8e8e8] bg-white">
                {FAST_PATH_VALUE_PROPS.map(({ icon: Icon, title, body }, i) => (
                    <li
                        key={title}
                        className={`flex gap-3.5 px-4 py-3.5 ${i > 0 ? 'border-t border-[#f0f0f0]' : ''}`}
                    >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/[0.08] text-brand">
                            <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                        </span>
                        <div className="min-w-0">
                            <p className="text-[14px] font-semibold leading-snug text-[#1c1c1c]">{title}</p>
                            <p className="mt-0.5 text-[13px] leading-snug text-[#5a5a5a]">{body}</p>
                        </div>
                    </li>
                ))}
            </ul>

            {/* Pasos */}
            <BecomeExpertFastPathSteps className="mt-7" />
        </div>
    );
}

/** Shell Stripe-first — aside de marca en escritorio; scroll narrativo en móvil. */
export function BecomeExpertFastPathShell({
    onBack,
    children,
    footer,
}: {
    onBack: () => void;
    children: React.ReactNode;
    footer?: React.ReactNode;
}) {
    const scrollPad = footer
        ? SD_MOBILE_SCROLL_PAD_CLASS
        : 'pb-[calc(2rem+env(safe-area-inset-bottom,0px))]';

    return (
        <div className="become-expert-wizard be-fast-shell flex h-[100dvh] max-h-[100dvh] min-h-0 flex-col overflow-hidden bg-[#fafafa] font-display text-[#1c1c1c] lg:grid lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_minmax(420px,640px)] xl:grid-cols-[minmax(320px,1fr)_680px]">
            <aside className="relative hidden min-h-0 overflow-hidden border-r border-[#e8e8e8] lg:flex lg:flex-col">
                <div className="absolute inset-0">
                    <HeroBannerPhoto imgClassName="object-cover object-[58%_30%]" />
                </div>
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0"
                    style={{ background: BE_FAST_HERO_SCRIM }}
                />

                <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto p-10 xl:p-12">
                    <button
                        type="button"
                        onClick={onBack}
                        className={`${hpIconButtonClass} self-start border-white/30 bg-white/15 text-white backdrop-blur-sm hover:bg-white/25 active:bg-white/25 ${FOCUS_RING}`}
                        aria-label="Volver al inicio"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>

                    <div className="be-fast-reveal mt-9 max-w-md" style={{ animationDelay: '40ms' }}>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/85">
                            Programa de expertos
                        </p>
                        <h1 className="mt-3 font-display text-[2.1rem] font-bold leading-[1.06] tracking-[-0.03em] text-white xl:text-[2.55rem] [text-wrap:balance]">
                            Tu experiencia,
                            <br />
                            en ingresos
                        </h1>
                        <span aria-hidden className="mt-4 block h-1 w-14 rounded-full bg-amber-400" />
                        <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/85 [text-wrap:pretty]">
                            {FAST_PATH_INTRO}
                        </p>
                        <div className="mt-5">
                            <FastPathReadyBadge tone="onBrand" />
                        </div>
                    </div>

                    <ul className="be-fast-reveal mt-8 max-w-md space-y-3.5" style={{ animationDelay: '150ms' }}>
                        {FAST_PATH_VALUE_PROPS.map(({ icon: Icon, title, body }) => (
                            <li key={title} className="flex gap-3">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15 text-white ring-1 ring-white/20">
                                    <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                                </span>
                                <div>
                                    <p className="text-[15px] font-semibold leading-snug text-white">{title}</p>
                                    <p className="mt-0.5 text-[13px] leading-relaxed text-white/80">{body}</p>
                                </div>
                            </li>
                        ))}
                    </ul>

                    <div
                        className="be-fast-reveal mt-auto max-w-md pt-8"
                        style={{ animationDelay: '260ms' }}
                    >
                        <FastPathSocialProof tone="onBrand" />
                        <p className="mt-6 flex items-center gap-2 text-xs leading-relaxed text-white/70">
                            <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden />
                            Pagos con Stripe. Tus datos solo se usan para verificar tu perfil.
                        </p>
                    </div>
                </div>
            </aside>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white lg:h-full">
                <main
                    id="become-expert-main"
                    className={`min-h-0 flex-1 overflow-y-auto overscroll-y-contain ${scrollPad}`}
                >
                    <div
                        className={`${SD_MOBILE_GUTTER_CLASS} mx-auto w-full pt-[max(0.75rem,env(safe-area-inset-top,0px))] pb-4 lg:max-w-none lg:px-10 lg:py-8 xl:px-12`}
                    >
                        <BecomeExpertFastPathIntro onBack={onBack} />
                        <div className="mt-7 border-t border-[#ececec] pt-6 lg:mt-0 lg:border-t-0 lg:pt-10">{children}</div>
                    </div>
                </main>

                {footer && (
                    <footer className={`${SD_MOBILE_FOOTER_SHELL_CLASS} shrink-0 lg:hidden`}>
                        <div className={`${SD_MOBILE_GUTTER_CLASS} sd-mobile-footer-inner`}>
                            {footer}
                        </div>
                    </footer>
                )}
            </div>
        </div>
    );
}
