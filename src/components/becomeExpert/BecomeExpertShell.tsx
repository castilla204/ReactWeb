import React from 'react';
import { ArrowLeft, ChevronRight, Check, BadgeCheck, ShieldCheck, Clock, Lock } from 'lucide-react';
import { SileoLoader } from '../ui/sileo-loader';
import revisionCocheImg from '../../media/revisioncoche.jpg';
import erizoImg from '../../media/erizo.png';
import { HomepageHeroTrustLines } from '../HomepageHeroTrustLines';
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
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <SileoLoader size="lg" message="Comprobando tu cuenta…" color="brand" />
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

const FAST_PATH_SUBLINE_NODE = (
    <>
        Recibe encargos de inspección en tu zona: coches, motos y viviendas.{' '}
        <strong className="font-semibold text-[#1c1c1c]">Tú pones el precio</strong>, eliges tus horarios y cobras con cada uno.
    </>
);

/**
 * Velo de marca direccional sobre la foto. Antes era un wash blanco plano que
 * lavaba la imagen (look "stock") y dejaba el texto sobre zonas heterogéneas de
 * bajo contraste. Ahora es un degradado con tinte azul de marca: sólido a la
 * izquierda (legibilidad del titular oscuro), y se abre antes para revelar la
 * foto nítida a la derecha, donde flotan las píldoras de prueba social.
 */
const BE_FAST_DESKTOP_WASH =
    'linear-gradient(100deg, #e7f0fb 0%, #e7f0fb 27%, rgba(231,240,251,0.92) 41%, rgba(231,240,251,0.45) 57%, rgba(231,240,251,0.10) 71%, rgba(231,240,251,0) 84%)';

/** Foto real del oficio, brillante (sin oscurecer). */
function FastPathHeroPhoto({ objectClass = 'object-center' }: { objectClass?: string }) {
    return (
        <img
            src={revisionCocheImg}
            alt="Un experto revisa un coche antes de la compra"
            decoding="async"
            fetchPriority="high"
            className={`h-full w-full object-cover ${objectClass}`}
        />
    );
}

/** Marca Inspecciono (mismo lockup que el header): erizo + wordmark azul con punto ámbar. */
function FastPathWordmark({ className = '' }: { className?: string }) {
    return (
        <div className={`flex items-center gap-2 ${className}`} aria-label="Inspecciono">
            <img src={erizoImg} alt="" aria-hidden className="h-8 w-8 -scale-x-100 object-contain" />
            <span className="font-display text-[18px] font-extrabold tracking-[-0.02em] text-[#2563EB]">
                Inspecciono<span className="text-[#F59E0B]">.</span>
            </span>
        </div>
    );
}

/** Eyebrow de marca (sin punto). */
function FastPathEyebrow() {
    return <p className="hp-eyebrow">Programa de expertos</p>;
}

/** Titular con el acento de marca de la home: línea azul + subrayado ámbar. */
function FastPathHeadline({ className = '' }: { className?: string }) {
    return (
        <h1 className={className}>
            Tus inspecciones,
            <span className="block text-brand">
                tus{' '}
                <span className="underline decoration-[#F59E0B] decoration-[3px] underline-offset-[6px] [text-decoration-skip-ink:none]">
                    ingresos
                </span>
            </span>
        </h1>
    );
}

/** Enlace de volver — chip claro legible sobre foto o blanco. */
function FastPathBack({ onBack, label }: { onBack: () => void; label: string }) {
    return (
        <button
            type="button"
            onClick={onBack}
            className={`inline-flex h-9 items-center gap-1.5 rounded-full border border-[#e2e5ea] bg-white/90 px-3.5 text-[13px] font-semibold text-[#1c1c1c] shadow-sm backdrop-blur-sm transition-colors hover:border-[#cbd0d8] hover:bg-white ${FOCUS_RING}`}
        >
            <ArrowLeft className="h-4 w-4 shrink-0" strokeWidth={2.2} />
            {label}
        </button>
    );
}

/** Intro móvil — hero claro con foto velada y titular de marca (igual que la home). */
export function BecomeExpertFastPathIntro({ onBack }: { onBack: () => void }) {
    return (
        <div className="-mx-5 lg:hidden">
            {/* Foto banner brillante a sangre, con fundido inferior a blanco */}
            <div className="relative aspect-[16/10] overflow-hidden bg-[#fafafa]">
                <div className="absolute inset-0">
                    <FastPathHeroPhoto objectClass="object-[60%_32%]" />
                </div>
                <div className="absolute left-4 top-[max(0.75rem,env(safe-area-inset-top,0px))] z-10">
                    <FastPathBack onBack={onBack} label="Volver" />
                </div>
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white via-white/70 to-transparent"
                />
            </div>

            {/* Texto centrado en la parte superior */}
            <div className="px-5 pt-6 text-center">
                <FastPathEyebrow />
                <FastPathHeadline className="mt-2.5 font-display text-[1.75rem] font-extrabold leading-[1.04] tracking-[-0.03em] text-[#111827]" />
                <p className="mx-auto mt-3 max-w-[20rem] text-[14px] leading-relaxed text-[#3a3a3a]">
                    {FAST_PATH_SUBLINE_NODE}
                </p>
            </div>
        </div>
    );
}

/** Píldora de prueba social flotante sobre la foto (chip claro con sombra, da profundidad). */
function FastPathProofPill({ icon, label }: { icon: React.ReactNode; label: string }) {
    return (
        <span className="inline-flex items-center gap-2 rounded-full bg-white/95 px-3.5 py-2 text-[13px] font-semibold text-[#1c1c1c] shadow-[0_8px_24px_rgba(15,23,42,0.14)] ring-1 ring-black/[0.04] backdrop-blur-sm">
            {icon}
            {label}
        </span>
    );
}

/**
 * Microcopy bajo el botón "Continuar con Stripe": fija la expectativa del salto
 * y desactiva el miedo al KYC. Visible solo en desktop (en móvil el botón vive
 * en el footer compacto).
 */
export function FastPathButtonNote() {
    return (
        <p className="mt-2.5 flex items-start gap-1.5 text-xs leading-relaxed text-[#6a6a6a]">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#9ca3af]" strokeWidth={2.2} />
            <span>
                Te llevamos a <span className="font-semibold text-[#444]">Stripe</span> para verificar tu cuenta
                (~5 min). No se te cobra nada y tus datos bancarios los gestiona Stripe.
            </span>
        </p>
    );
}

const FAST_PATH_STEPS = [
    {
        title: 'Elige tu país',
        body: 'El país donde cobras. Debe coincidir con tu cuenta bancaria.',
    },
    {
        title: 'Verifícate con Stripe',
        body: 'Identidad y cuenta de cobro. Unos 5 minutos, una sola vez.',
    },
    {
        title: 'Completa tu perfil',
        body: 'Foto, zona y servicios. Entonces empiezas a recibir encargos.',
    },
] as const;

/** "Qué pasa después" — timeline vertical (no rejilla de tarjetas). */
function FastPathSteps() {
    return (
        <section>
            <h3 className="text-sm font-semibold text-[#1c1c1c]">Qué pasa después</h3>
            <ol className="mt-4 space-y-0">
                {FAST_PATH_STEPS.map((step, i) => {
                    const last = i === FAST_PATH_STEPS.length - 1;
                    return (
                        <li key={step.title} className="relative flex gap-3.5 pb-5 last:pb-0">
                            {!last && (
                                <span
                                    aria-hidden
                                    className="absolute left-[13px] top-7 bottom-1 w-px bg-[#e3e3e3]"
                                />
                            )}
                            <span className="relative z-10 flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-brand/[0.1] text-[13px] font-semibold tabular-nums text-brand">
                                {i + 1}
                            </span>
                            <div className="min-w-0 pt-0.5">
                                <p className="text-sm font-semibold text-[#1c1c1c]">{step.title}</p>
                                <p className="mt-0.5 text-[13px] leading-relaxed text-[#6a6a6a]">{step.body}</p>
                            </div>
                        </li>
                    );
                })}
            </ol>
        </section>
    );
}

/** "Cómo cobras" — propuesta económica honesta, sin porcentaje inventado. */
function FastPathPayout() {
    return (
        <section className="rounded-xl bg-[#f7f9fc] px-4 py-4">
            <h3 className="text-sm font-semibold text-[#1c1c1c]">Cómo cobras</h3>
            <ul className="mt-2.5 space-y-2">
                {[
                    'Tú pones el precio de cada inspección.',
                    'Cobras tras cada trabajo completado, directo a tu cuenta.',
                    'Sin cuota mensual ni coste de alta: solo hay comisión cuando tú cobras.',
                ].map((line) => (
                    <li key={line} className="flex items-start gap-2 text-[13px] leading-relaxed text-[#444]">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" strokeWidth={2.6} />
                        {line}
                    </li>
                ))}
            </ul>
        </section>
    );
}

/** "Qué necesitas a mano" — reduce el abandono dentro de Stripe. */
function FastPathChecklist() {
    return (
        <section>
            <h3 className="flex items-center gap-1.5 text-sm font-semibold text-[#1c1c1c]">
                <Clock className="h-4 w-4 text-[#9ca3af]" strokeWidth={2.2} />
                Ten a mano para Stripe
            </h3>
            <p className="mt-2 text-[13px] leading-relaxed text-[#6a6a6a]">
                Documento de identidad y el <span className="font-semibold text-[#444]">IBAN</span> de tu cuenta de
                cobro. Nada más.
            </p>
        </section>
    );
}

const FAST_PATH_FAQ = [
    {
        q: '¿Por qué Stripe?',
        a: 'Stripe procesa los pagos de millones de empresas. Verifica tu identidad y envía el dinero a tu cuenta. Inspecciono nunca ve ni guarda tus datos bancarios.',
    },
    {
        q: '¿Cuándo cobro?',
        a: 'Tras cada inspección completada, el importe llega a tu cuenta a través de Stripe.',
    },
    {
        q: '¿Puedo cambiar el país después?',
        a: 'No. El país de cobro queda fijado al crear tu cuenta de Stripe. Si te mudas a otro país, tendrás que crear una cuenta nueva.',
    },
] as const;

/** FAQ corta colapsable — mata objeciones sin saturar. */
function FastPathFaq() {
    return (
        <section>
            <h3 className="text-sm font-semibold text-[#1c1c1c]">Preguntas frecuentes</h3>
            <div className="mt-2 divide-y divide-[#ececec]">
                {FAST_PATH_FAQ.map((item) => (
                    <details key={item.q} className="group py-2.5">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[13px] font-semibold text-[#1c1c1c] [&::-webkit-details-marker]:hidden">
                            {item.q}
                            <ChevronRight className="h-4 w-4 shrink-0 text-[#9ca3af] transition-transform group-open:rotate-90" />
                        </summary>
                        <p className="mt-1.5 pr-7 text-[13px] leading-relaxed text-[#6a6a6a]">{item.a}</p>
                    </details>
                ))}
            </div>
        </section>
    );
}

/**
 * Bloque de valor del fast-path desktop: se monta DEBAJO del formulario para
 * llenar la columna y dar confianza. Solo desktop (el formulario móvil es compacto).
 */
export function FastPathValueModules() {
    return (
        <div className="space-y-7 border-t border-[#ececec] pt-7">
            <FastPathSteps />
            <FastPathPayout />
            <FastPathChecklist />
            <FastPathFaq />
        </div>
    );
}

/** Shell — mismo lenguaje que la home: hero claro de marca a la izquierda, formulario a la derecha. */
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
        ? 'pb-[13rem] lg:pb-0'
        : 'pb-[calc(2rem+env(safe-area-inset-bottom,0px))]';

    return (
        <div className="become-expert-wizard be-fast-shell flex h-[100dvh] max-h-[100dvh] min-h-0 flex-col overflow-hidden bg-white font-display text-[#1c1c1c] lg:grid lg:h-auto lg:max-h-none lg:min-h-screen lg:items-start lg:overflow-visible lg:grid-cols-[minmax(0,0.9fr)_minmax(500px,600px)] xl:grid-cols-[minmax(0,1fr)_680px]">
            {/* Izquierda — hero claro de marca: foto velada + titular con acento azul/ámbar (estilo home).
                Desktop: fijo a la altura del viewport y pegajoso mientras la derecha scrollea con la página. */}
            <aside className="relative hidden min-h-0 overflow-hidden border-r border-[#e8e8e8] bg-[#fafafa] lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:self-start">
                <div className="absolute inset-0">
                    <FastPathHeroPhoto objectClass="object-[68%_center]" />
                </div>
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0"
                    style={{ background: BE_FAST_DESKTOP_WASH }}
                />

                {/* Píldoras de prueba social flotando sobre la zona nítida de la foto (profundidad) */}
                <div className="pointer-events-none absolute bottom-10 right-9 z-10 hidden flex-col items-end gap-2.5 xl:flex">
                    <FastPathProofPill
                        icon={<BadgeCheck className="h-4 w-4 text-brand" strokeWidth={2.4} />}
                        label="500+ expertos verificados"
                    />
                    <FastPathProofPill
                        icon={<ShieldCheck className="h-4 w-4 text-brand" strokeWidth={2.4} />}
                        label="Pagos seguros con Stripe"
                    />
                </div>

                <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto p-12 xl:p-14">
                    <div className="flex items-center justify-between gap-4">
                        <FastPathWordmark />
                        <FastPathBack onBack={onBack} label="Volver" />
                    </div>
                    <div className="my-auto max-w-md">
                        <FastPathEyebrow />
                        <FastPathHeadline className="hp-hero-title-lg mt-3" />
                        <p className="hp-hero-body mt-4 max-w-[26rem] lg:text-base">{FAST_PATH_SUBLINE_NODE}</p>
                        <HomepageHeroTrustLines className="mt-6" />
                    </div>
                </div>
            </aside>

            {/* Derecha — formulario + narrativa de valor. Antes flotaba centrado y vacío;
                ahora va anclado arriba y la columna se llena con "qué pasa después",
                "cómo cobras", "qué necesitas" y FAQ para que el alta de 1 campo no
                parezca de juguete en desktop. */}
            <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-white lg:h-auto lg:min-h-screen lg:overflow-visible">
                <main
                    id="become-expert-main"
                    className={`min-h-0 flex-1 overflow-y-auto overscroll-y-contain ${scrollPad} lg:overflow-visible lg:overscroll-auto`}
                >
                    <div
                        className={`${SD_MOBILE_GUTTER_CLASS} mx-auto w-full pb-4 lg:max-w-[40rem] lg:px-10 lg:py-12 xl:px-12 xl:py-14`}
                    >
                        <BecomeExpertFastPathIntro onBack={onBack} />
                        <div className="hidden lg:block">{children}</div>
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
