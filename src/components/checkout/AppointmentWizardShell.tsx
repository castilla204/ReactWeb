import type { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { CheckoutDesktopAppointmentHeader } from './CheckoutDesktopAppointmentHeader';
import { CheckoutMobileStepHeader } from './CheckoutMobileStepHeader';
import { CheckoutMobileStickyFooter } from './CheckoutMobileStickyFooter';
import { HomepageDesktopTopBar } from '../HomepageDesktopTopBar';
import {
    SD_CHECKOUT_DESKTOP_PAGE_CLASS,
    SD_CHECKOUT_DESKTOP_APPOINTMENT_SHELL_HEIGHT_CLASS,
    SD_CHECKOUT_MOBILE_GUTTER_CLASS,
    SD_CHECKOUT_MOBILE_HEADER_SURFACE_CLASS,
    SD_CHECKOUT_MOBILE_FOOTER_ACTIONS_CLASS,
    SD_CHECKOUT_MOBILE_BACK_TEXT_BTN_CLASS,
} from '../../constants/homepageTypography';

export interface WizardStepDef {
    id: number;
    label: string;
}

export interface AppointmentWizardShellProps {
    /** Pasos del stepper móvil (p.ej. Fecha · Ubicación). */
    steps: readonly WizardStepDef[];
    /** Paso actual (id dentro de `steps`). */
    currentStep: number;
    /** Cabecera del paso (desktop): título + descripción + back. */
    title: string;
    description: ReactNode;
    onBack: () => void;
    /** Desktop: columna izquierda (tarjetas / detalles / resumen). */
    desktopLeft: ReactNode;
    /** Desktop: columna derecha (calendario / mapa). */
    desktopRight: ReactNode;
    /** El paso actual muestra mapa a la derecha → fija altura como el checkout. */
    desktopTallRight?: boolean;
    /** Móvil: cuerpo del paso. Si el paso es mapa, pásalo a pantalla casi completa. */
    mobileBody: ReactNode;
    /** Móvil: el paso ocupa el alto completo (mapa) sin scroll. */
    mobileFullBleed?: boolean;
    /** Acción primaria (Continuar / Confirmar). */
    primaryLabel: string;
    onPrimary: () => void;
    primaryDisabled?: boolean;
    /** Texto del botón "Atrás" móvil; oculto si no hay onSecondary. */
    onSecondary?: () => void;
    secondaryLabel?: string;
}

// Botón de AVANCE del wizard (Continuar/Confirmar) en negro neutro: en estas páginas
// (coordinación del vendedor / confirmación del experto) no hay pago, así que el primario
// va oscuro, coherente con la jerarquía negro-avanza del checkout.
const DESKTOP_PRIMARY_BTN =
    'inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-[#171717] px-7 text-[14px] font-semibold text-white transition-colors hover:bg-[#2a2d33] disabled:cursor-not-allowed disabled:opacity-50';

export function AppointmentWizardShell({
    steps,
    currentStep,
    title,
    description,
    onBack,
    desktopLeft,
    desktopRight,
    desktopTallRight = false,
    mobileBody,
    mobileFullBleed = false,
    primaryLabel,
    onPrimary,
    primaryDisabled = false,
    onSecondary,
    secondaryLabel = 'Atrás',
}: AppointmentWizardShellProps) {
    return (
        <>
            {/* DESKTOP (≥lg) */}
            <div className={cn('hidden min-h-screen lg:block', SD_CHECKOUT_DESKTOP_PAGE_CLASS)}>
                <HomepageDesktopTopBar variant="checkout" />
                <div className="mx-auto w-full max-w-[75rem] px-4 pb-4 pt-8 sm:px-5 lg:px-8">
                    <CheckoutDesktopAppointmentHeader
                        title={title}
                        description={description}
                        onBack={onBack}
                        className="mb-4"
                    />
                    <div className={cn('flex flex-col', desktopTallRight && SD_CHECKOUT_DESKTOP_APPOINTMENT_SHELL_HEIGHT_CLASS)}>
                        <div className={cn('flex flex-1 items-stretch gap-5 overflow-hidden xl:gap-6', desktopTallRight && 'min-h-0')}>
                            <div className={cn(
                                'flex min-w-0 flex-[0_0_45%] flex-col rounded-xl border border-[#e5e7eb] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)] xl:flex-[0_0_42%]',
                                desktopTallRight ? 'h-full min-h-0' : 'min-h-0 self-stretch',
                            )}>
                                <div className={cn('px-6 pb-5 pt-5 xl:px-7', desktopTallRight ? 'flex min-h-0 flex-1 flex-col overflow-y-auto' : 'flex min-h-0 flex-col justify-start')}>
                                    {desktopLeft}
                                </div>
                            </div>
                            <aside className={cn(
                                'relative flex min-w-0 flex-1 flex-col rounded-xl border border-[#e5e7eb] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]',
                                desktopTallRight ? 'h-full min-h-0' : 'min-h-0 items-stretch self-start',
                            )}>
                                {desktopTallRight ? desktopRight : (
                                    <div className="flex shrink-0 flex-col p-5 xl:p-6">{desktopRight}</div>
                                )}
                            </aside>
                        </div>
                        <div className="mt-5 flex shrink-0 items-center justify-between gap-4 px-0.5 py-1">
                            <span />
                            <button type="button" onClick={onPrimary} disabled={primaryDisabled} className={DESKTOP_PRIMARY_BTN}>
                                {primaryLabel}
                                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* MÓVIL (<lg) */}
            <div className={cn('lg:hidden', mobileFullBleed ? 'relative flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden bg-white' : 'min-h-[100dvh] bg-white')}>
                <header className={cn(SD_CHECKOUT_MOBILE_GUTTER_CLASS, SD_CHECKOUT_MOBILE_HEADER_SURFACE_CLASS, 'shrink-0 pb-3 pt-[max(0.75rem,env(safe-area-inset-top,0px))]')}>
                    {/* Mapa de pasos + cabecera explicativa (título + qué se pide). */}
                    <CheckoutMobileStepHeader
                        step={currentStep}
                        steps={steps}
                        title={title}
                        description={description}
                    />
                </header>
                <div className={cn(mobileFullBleed ? 'relative min-h-0 flex-1 overflow-hidden' : 'px-5 pb-[calc(0.625rem+2.75rem+max(0.625rem,env(safe-area-inset-bottom,0px))+1rem)] pt-4')}>
                    {mobileBody}
                </div>
                <CheckoutMobileStickyFooter>
                    <div className={SD_CHECKOUT_MOBILE_FOOTER_ACTIONS_CLASS}>
                        {onSecondary ? (
                            <button type="button" onClick={onSecondary} className={SD_CHECKOUT_MOBILE_BACK_TEXT_BTN_CLASS}>
                                {secondaryLabel}
                            </button>
                        ) : null}
                        <button
                            type="button"
                            onClick={onPrimary}
                            disabled={primaryDisabled}
                            className="inline-flex h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-full bg-[#171717] text-[15px] font-semibold text-white transition-colors hover:bg-[#2a2d33] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45"
                        >
                            {primaryLabel}
                            <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                        </button>
                    </div>
                </CheckoutMobileStickyFooter>
            </div>
        </>
    );
}
