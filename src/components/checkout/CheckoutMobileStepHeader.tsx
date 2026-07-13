import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import {
    SD_CHECKOUT_MOBILE_STEP_DESC_CLASS,
    SD_CHECKOUT_MOBILE_STEP_TITLE_CLASS,
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
    className,
}: CheckoutMobileStepHeaderProps) {
    return (
        <header className={cn('min-w-0', className)}>
            {hideStepper ? null : <CheckoutMobileStepper currentStep={step} steps={steps} />}
            <div className={cn('flex items-start justify-between gap-4', !hideStepper && 'mt-3.5')}>
                <div className="min-w-0 flex-1">
                    <h2
                        className={cn(
                            SD_CHECKOUT_MOBILE_STEP_TITLE_CLASS,
                            hideStepper && SD_CHECKOUT_MOBILE_STEP_TITLE_UNDERLINE_CLASS,
                        )}
                    >
                        {title}
                    </h2>
                    {description ? (
                        <p className={SD_CHECKOUT_MOBILE_STEP_DESC_CLASS}>
                            {description}
                        </p>
                    ) : null}
                </div>
                {trailing ? <div className="shrink-0 pt-1">{trailing}</div> : null}
            </div>
        </header>
    );
}
