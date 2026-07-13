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
    /** Nombre del paso: no se pinta, solo alimenta la etiqueta accesible. */
    label?: string;
}

interface CheckoutMobileStepperProps {
    currentStep: number;
    className?: string;
    /** Pasos del flujo; por defecto cuatro. */
    steps?: readonly StepDef[];
}

function StepperFrontierSpark({ burst = false }: { burst?: boolean }) {
    return (
        <span
            className={cn(
                'checkout-stepper-frontier pointer-events-none',
                burst && 'checkout-stepper-frontier--burst',
            )}
            aria-hidden
        >
            <span className="checkout-stepper-frontier-halo checkout-stepper-frontier-halo--a" />
            <span className="checkout-stepper-frontier-halo checkout-stepper-frontier-halo--b" />
            <span className="checkout-stepper-frontier-core" />
            <span className="checkout-stepper-frontier-flare" />
            <span className="checkout-stepper-spark checkout-stepper-spark--1" />
            <span className="checkout-stepper-spark checkout-stepper-spark--2" />
            <span className="checkout-stepper-spark checkout-stepper-spark--3" />
            <span className="checkout-stepper-spark checkout-stepper-spark--4" />
            <span className="checkout-stepper-spark checkout-stepper-spark--5" />
            <span className="checkout-stepper-ember checkout-stepper-ember--1" />
            <span className="checkout-stepper-ember checkout-stepper-ember--2" />
        </span>
    );
}

/**
 * Progreso del wizard móvil: línea segmentada con avance en azul de marca.
 * La frontera del paso activo lleva pulso y chispas contenidas en el tramo.
 */
export function CheckoutMobileStepper({
    currentStep,
    className,
    steps = STEPS,
}: CheckoutMobileStepperProps) {
    const index = Math.max(0, steps.findIndex((s) => s.id === currentStep));
    const current = steps[index];
    const prevIndexRef = useRef(index);
    const [igniteIndex, setIgniteIndex] = useState<number | null>(null);

    useEffect(() => {
        if (index > prevIndexRef.current) {
            setIgniteIndex(index);
            const timer = window.setTimeout(() => setIgniteIndex(null), 480);
            prevIndexRef.current = index;
            return () => window.clearTimeout(timer);
        }
        prevIndexRef.current = index;
        return undefined;
    }, [index]);

    return (
        <div
            className={cn('checkout-stepper flex items-center gap-3', className)}
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
                            'checkout-stepper-segment relative h-[3px] min-w-0 flex-1 rounded-full bg-line',
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
                        {isActive ? (
                            <StepperFrontierSpark burst={igniteIndex === i} />
                        ) : null}
                    </span>
                );
            })}
        </div>
    );
}
