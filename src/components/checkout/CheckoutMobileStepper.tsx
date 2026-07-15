import { useEffect, useRef, useState } from 'react';
import { cn } from '../../lib/utils';

const STEPS = [
    { id: 1 as const },
    { id: 2 as const },
    { id: 3 as const },
    { id: 4 as const },
] as const;

export type CheckoutMobileWizardStep = 1 | 2 | 3 | 4;

export interface StepDef {
    id: number;
    /** Nombre del paso: alimenta la etiqueta accesible y el texto visible bajo la barra. */
    label?: string;
}

interface CheckoutMobileStepperProps {
    currentStep: number;
    className?: string;
    /** Pasos del flujo; por defecto cuatro. */
    steps?: readonly StepDef[];
    /** Segmentos sobre banda oscura (header ink-strong). */
    onDark?: boolean;
}

/**
 * Progreso del wizard móvil: línea segmentada. Tramos completados y el actual en
 * azul de marca; pendientes en gris. Motion mínima: solo un fill al avanzar.
 */
export function CheckoutMobileStepper({
    currentStep,
    className,
    steps = STEPS,
    onDark = false,
}: CheckoutMobileStepperProps) {
    const index = Math.max(0, steps.findIndex((s) => s.id === currentStep));
    const current = steps[index];
    const prevIndexRef = useRef(index);
    const [igniteIndex, setIgniteIndex] = useState<number | null>(null);

    useEffect(() => {
        if (index > prevIndexRef.current) {
            setIgniteIndex(index);
            const timer = window.setTimeout(() => setIgniteIndex(null), 220);
            prevIndexRef.current = index;
            return () => window.clearTimeout(timer);
        }
        prevIndexRef.current = index;
        return undefined;
    }, [index]);

    return (
        <div className={cn('checkout-stepper', className)}>
            <div
                className="flex items-center gap-2.5"
                role="progressbar"
                aria-valuemin={1}
                aria-valuemax={steps.length}
                aria-valuenow={index + 1}
                aria-valuetext={
                    current?.label
                        ? `Paso ${index + 1} de ${steps.length}: ${current.label}`
                        : `Paso ${index + 1} de ${steps.length}`
                }
            >
                {steps.map((step, i) => {
                    const isDone = i < index;
                    const isActive = i === index;
                    const isPending = i > index;

                    return (
                        <span
                            key={step.id}
                            aria-hidden
                            className={cn(
                                'checkout-stepper-segment relative h-[3px] min-w-0 flex-1 rounded-full',
                                onDark ? 'bg-white/35' : 'bg-line',
                                isDone && 'checkout-stepper-segment--done',
                                isActive && 'checkout-stepper-segment--active',
                                isPending && 'checkout-stepper-segment--pending',
                            )}
                        >
                            {!isPending ? (
                                <span
                                    className={cn(
                                        'checkout-stepper-fill absolute inset-y-0 left-0 rounded-full bg-brand',
                                        isDone && 'checkout-stepper-fill--done w-full',
                                        isActive && 'checkout-stepper-fill--active w-full',
                                        isActive &&
                                            igniteIndex === i &&
                                            'checkout-stepper-fill--ignite',
                                    )}
                                />
                            ) : null}
                        </span>
                    );
                })}
            </div>
            {current?.label && !onDark ? (
                <p
                    className="mt-1.5 text-caption font-medium text-ink-muted"
                    aria-hidden
                >
                    {current.label}
                </p>
            ) : null}
        </div>
    );
}
