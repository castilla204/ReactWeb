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

/**
 * Progreso del wizard móvil: una línea fina partida en tantos segmentos como
 * pasos. Los tramos ya recorridos (incluido el actual) van en azul de marca; los
 * pendientes, en gris. Sin círculos ni numeración — el título de la cabecera ya
 * dice en qué paso estás.
 */
export function CheckoutMobileStepper({
    currentStep,
    className,
    steps = STEPS,
}: CheckoutMobileStepperProps) {
    const index = Math.max(0, steps.findIndex((s) => s.id === currentStep));
    const current = steps[index];
    return (
        <div
            className={cn('flex items-center gap-1.5', className)}
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
            {steps.map((step, i) => (
                <span
                    key={step.id}
                    aria-hidden
                    className={cn(
                        'h-[3px] flex-1 rounded-full',
                        'transition-colors duration-300 ease-out motion-reduce:transition-none',
                        // Segmento vacío #dde2ea (un pelín más oscuro que el antiguo #e8eaed):
                        // se lee sobre el fondo gris susurro del topbar sin perderse.
                        i <= index ? 'bg-brand' : 'bg-line',
                    )}
                />
            ))}
        </div>
    );
}
