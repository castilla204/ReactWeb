import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';
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
    className,
}: CheckoutMobileStepHeaderProps) {
    return (
        <header className={cn('min-w-0', className)}>
            {hideStepper ? null : <CheckoutMobileStepper currentStep={step} steps={steps} />}
            <h2
                className={cn(
                    !hideStepper && 'mt-4',
                    'text-center text-[20px] font-extrabold leading-[1.15] tracking-[-0.025em] text-[#14161a] [text-wrap:balance]',
                )}
            >
                {title}
            </h2>
            {description ? (
                // min-h-[3lh] reserva 3 líneas de descripción (el máximo actual entre los
                // pasos) para que TODAS las bandas midan igual y la línea inferior del topbar
                // quede a la misma cota al navegar entre pasos (2 vs 3 líneas ya no descuadra).
                // Solo en los pasos con barra (banda): el paso final de resumen (hideStepper)
                // no lleva banda ni necesita igualar altura, y reservar 3 líneas ahí dejaría
                // hueco muerto antes del resumen.
                <p
                    className={cn(
                        'mx-auto mt-1.5 max-w-[42ch] text-center text-[13px] leading-relaxed text-[#565d6b]',
                        !hideStepper && 'min-h-[3lh]',
                    )}
                >
                    {description}
                </p>
            ) : null}
        </header>
    );
}
