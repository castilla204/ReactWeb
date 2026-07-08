import React from 'react';
import { ArrowLeft, ChevronRight, Check, Lock, ShieldCheck } from 'lucide-react';
import { SileoLoader } from '../ui/sileo-loader';
import revisionCocheImg from '../../media/revisioncoche.jpg';
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

/**
 * Controles del alta rápida (país + CTA). Deliberadamente NO usan el CTA global
 * (`HP_SERVICE_CTA_CLASS`, una píldora con glow azul): en un formulario de cobros
 * la píldora + sombra de color se lee como app de consumo.
 *
 * El CTA es casi negro, no azul de marca: una losa azul saturada a todo el ancho
 * es lo más ruidoso de la pantalla y desequilibra el campo, que queda tímido al
 * lado. El azul de marca se reserva para el acento y el anillo de foco.
 * Ambos controles comparten altura (48px) y radio (10px).
 */
const BE_FAST_CONTROL_RADIUS = 'rounded-[10px]';

// El foco vive en CSS (`.be-fast-control:focus` / `.be-fast-cta:focus-visible`,
// en index.css) en vez de en variantes `focus:` de Tailwind: es un requisito de
// accesibilidad y así no depende de la generación de variantes.
export const BE_FAST_SELECT_CLASS =
    `be-fast-control h-12 w-full cursor-pointer appearance-none border border-slate-300 bg-white ${BE_FAST_CONTROL_RADIUS} text-[15px] font-medium text-slate-900 shadow-[inset_0_1px_2px_rgba(15,23,42,0.05)] transition-[border-color,box-shadow] hover:border-slate-400`;

export const BE_FAST_PRIMARY_BTN_CLASS =
    `be-fast-cta inline-flex h-12 w-full items-center justify-center ${BE_FAST_CONTROL_RADIUS} bg-slate-900 text-[15px] font-semibold tracking-[-0.01em] text-white transition-colors duration-150 hover:bg-slate-800 active:bg-slate-950 disabled:cursor-wait disabled:opacity-60`;

const FAST_PATH_SUBLINE_NODE = (
    <>
        Recibe encargos de inspección en tu zona: coches, motos y viviendas.{' '}
        <strong className="font-semibold text-[#1c1c1c]">Tú pones el precio</strong>, eliges tus horarios y cobras con cada uno.
    </>
);

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

/**
 * Microcopy bajo el botón "Continuar con Stripe": fija la expectativa del salto
 * y desactiva el miedo al KYC. Visible solo en desktop (en móvil el botón vive
 * en el footer compacto).
 */
export function FastPathButtonNote() {
    return (
        <p className="mt-3 flex items-start gap-1.5 text-xs leading-relaxed text-slate-500">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" strokeWidth={2.2} />
            <span>Verificación con Stripe (~5 min). Sin coste; tus datos los gestiona Stripe.</span>
        </p>
    );
}

/**
 * Shell del alta rápida. Desktop: split a pantalla completa — panel de imagen a
 * la izquierda (marca visual + titular) y formulario a la derecha, centrado
 * vertical. Sin tarjeta flotante ni vacío gris: llena la pantalla y pesa.
 * Móvil: banner intro + formulario en el footer (sin cambios).
 */
export function BecomeExpertFastPathShell({
    onBack,
    children,
    footer,
}: {
    onBack: () => void;
    children: React.ReactNode;
    footer?: React.ReactNode;
}) {
    // En desktop el padding vertical debe ser simétrico (pt-12 / pb-12) para que la
    // tarjeta quede centrada de verdad; antes `lg:pb-0` ganaba a `lg:py-12` y la subía.
    const scrollPad = footer
        ? 'pb-[13rem] lg:pb-12'
        : 'pb-[calc(2rem+env(safe-area-inset-bottom,0px))] lg:pb-12';

    return (
        <div className="become-expert-wizard be-fast-shell relative flex h-[100dvh] max-h-[100dvh] min-h-0 flex-col overflow-hidden bg-white font-display text-[#1c1c1c] lg:h-auto lg:max-h-none lg:min-h-screen lg:overflow-visible lg:bg-[#f2f5f9]">
            {/* Botón volver — desktop, arriba a la izquierda de la página */}
            <div className="absolute left-6 top-6 z-20 hidden lg:block">
                <FastPathBack onBack={onBack} label="Volver" />
            </div>

            <main
                id="become-expert-main"
                className={`min-h-0 flex-1 overflow-y-auto overscroll-y-contain ${scrollPad} lg:flex lg:items-center lg:justify-center lg:overflow-visible lg:overscroll-auto lg:px-6 lg:pt-12`}
            >
                {/* Móvil — banner intro; el formulario va en el footer */}
                <div className={`${SD_MOBILE_GUTTER_CLASS} mx-auto w-full pb-4 lg:hidden`}>
                    <BecomeExpertFastPathIntro onBack={onBack} />
                </div>

                {/* Desktop — tarjeta contenida y centrada: imagen a la izquierda,
                    formulario a la derecha. Grande y con peso (no un recuadro flotando):
                    960px de ancho, 560px de alto mínimo, redondeo contenido y sombra
                    en capas. */}
                <div className="hidden w-full max-w-[60rem] overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_24px_64px_-28px_rgba(15,23,42,0.30)] lg:grid lg:min-h-[560px] lg:grid-cols-[minmax(0,44%)_minmax(0,56%)]">
                    {/* Izquierda — imagen del oficio, a sangre dentro de la tarjeta */}
                    <div className="relative overflow-hidden bg-slate-900">
                        <img
                            src={revisionCocheImg}
                            alt="Un experto revisa un coche antes de la compra"
                            decoding="async"
                            fetchPriority="high"
                            className="absolute inset-0 h-full w-full object-cover object-[56%_38%]"
                        />
                        <div
                            aria-hidden
                            className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-slate-950/10"
                        />
                        <div className="absolute inset-x-0 bottom-0 p-8 xl:p-9">
                            <h2 className="font-display text-[1.6rem] font-semibold leading-[1.1] tracking-[-0.03em] text-white xl:text-[1.75rem]">
                                Tus inspecciones,
                                <br />
                                tus ingresos
                            </h2>
                            <p className="mt-2.5 max-w-[22rem] text-[14px] leading-relaxed text-white/80">
                                Recibe encargos de inspección en tu zona y cobra con cada trabajo. Tú pones el precio.
                            </p>
                            <div className="mt-5 flex items-center gap-2 text-[12.5px] font-medium text-white/70">
                                <ShieldCheck className="h-4 w-4 shrink-0 text-white/60" strokeWidth={2.2} />
                                Pagos seguros con Stripe · 500+ expertos
                            </div>
                        </div>
                    </div>

                    {/* Derecha — formulario, centrado vertical y alineado a la izquierda */}
                    <div className="flex items-center px-9 py-10 xl:px-11">
                        <div className="w-full max-w-[24rem]">{children}</div>
                    </div>
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
    );
}
