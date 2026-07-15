import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import {
    SD_CHECKOUT_MOBILE_STEP_DESC_CLASS,
    SD_CHECKOUT_MOBILE_STEP_DESC_ON_DARK_CLASS,
    SD_CHECKOUT_MOBILE_STEP_TITLE_CLASS,
    SD_CHECKOUT_MOBILE_STEP_TITLE_ON_DARK_CLASS,
    SD_CHECKOUT_MOBILE_STEP_TITLE_UNDERLINE_CLASS,
} from '../../constants/homepageTypography';
import { CheckoutMobileStepper, type StepDef } from './CheckoutMobileStepper';

export type { CheckoutMobileWizardStep } from './CheckoutMobileStepper';

interface CheckoutMobileStepHeaderProps {
    /** Id del paso actual dentro de `steps`. */
    step: number;
    /** Pasos del flujo (un segmento de la barra por paso). */
    steps: readonly StepDef[];
    /** Qué se pide en esta pantalla, en lenguaje hablado. */
    title: string;
    /** Una frase que explique el paso (por qué / qué pasa después). */
    description?: ReactNode;
    /** Oculta la barra de avance (paso final de resumen: ya no hay que orientar). */
    hideStepper?: boolean;
    /** Acción o dato anclado a la derecha (p. ej. total en el paso de pago). */
    trailing?: ReactNode;
    /** Cabecera sobre banda ink-strong (wizard móvil). */
    onDark?: boolean;
    className?: string;
}

/**
 * Cabecera móvil del wizard de reserva: línea fina segmentada con el avance en
 * azul de marca + título y explicación del paso. La barra sustituye al contador
 * "Paso X de Y" (decisión del usuario 2026-07-08).
 */
export function CheckoutMobileStepHeader({
    step,
    steps,
    title,
    description,
    hideStepper = false,
    trailing,
    onDark = true,
    className,
}: CheckoutMobileStepHeaderProps) {
    return (
        <div className={cn('min-w-0', className)}>
            {hideStepper ? null : (
                <CheckoutMobileStepper currentStep={step} steps={steps} onDark={onDark} />
            )}
            <div
                className={cn(
                    trailing
                        ? 'mt-2 flex flex-col gap-2 min-[360px]:flex-row min-[360px]:items-center min-[360px]:justify-between min-[360px]:gap-3'
                        : cn('flex items-start justify-between gap-3', !hideStepper && 'mt-3'),
                )}
            >
                <div className="min-w-0 flex-1">
                    <h2
                        className={cn(
                            onDark
                                ? SD_CHECKOUT_MOBILE_STEP_TITLE_ON_DARK_CLASS
                                : SD_CHECKOUT_MOBILE_STEP_TITLE_CLASS,
                            hideStepper &&
                                !onDark &&
                                SD_CHECKOUT_MOBILE_STEP_TITLE_UNDERLINE_CLASS,
                        )}
                    >
                        {title}
                    </h2>
                    {description ? (
                        <p
                            className={
                                onDark
                                    ? SD_CHECKOUT_MOBILE_STEP_DESC_ON_DARK_CLASS
                                    : SD_CHECKOUT_MOBILE_STEP_DESC_CLASS
                            }
                        >
                            {description}
                        </p>
                    ) : null}
                </div>
                {trailing ? (
                    <div
                        className={cn(
                            'shrink-0',
                            hideStepper
                                ? 'min-[360px]:text-right'
                                : 'pt-1',
                        )}
                    >
                        {trailing}
                    </div>
                ) : null}
            </div>
        </div>
    );
}
