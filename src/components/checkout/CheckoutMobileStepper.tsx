import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';

const STEPS = [
  { id: 1 as const, label: 'Fecha y hora' },
  { id: 2 as const, label: 'Ubicación' },
  { id: 3 as const, label: 'Datos del vendedor' },
  { id: 4 as const, label: 'Pago' },
] as const;

export type CheckoutMobileWizardStep = (typeof STEPS)[number]['id'];

interface StepDef {
  id: number;
  label: string;
}

interface CheckoutMobileStepperProps {
  currentStep: number;
  className?: string;
  /** Lista de pasos a mostrar; por defecto fecha · ubicación · pago. */
  steps?: readonly StepDef[];
}

/**
 * Indicador de progreso del checkout — wizard secuencial con conector.
 * Círculo numerado por paso (hecho · actual · pendiente) unidos por una línea
 * que se rellena con el color de marca conforme se avanza. Mismo componente
 * para el wizard de reserva y el paso de coordinación.
 */
export function CheckoutMobileStepper({
  currentStep,
  className,
  steps = STEPS,
}: CheckoutMobileStepperProps) {
  const total = steps.length;
  return (
    <nav className={cn('mb-1.5', className)} aria-label="Pasos de la reserva">
      <ol className="flex items-start">
        {steps.map((step, index) => {
          const active = currentStep === step.id;
          const done = currentStep > step.id;
          const reached = currentStep >= step.id;
          const isFirst = index === 0;
          const isLast = index === total - 1;
          return (
            <li
              key={step.id}
              className="relative flex flex-1 flex-col items-center"
              aria-current={active ? 'step' : undefined}
            >
              {/* Conector izquierdo: relleno si ya hemos llegado a este paso */}
              {!isFirst ? (
                <span
                  aria-hidden
                  className={cn(
                    'absolute left-0 right-1/2 top-[0.875rem] h-0.5 -translate-y-1/2 rounded-full',
                    'transition-colors duration-300 ease-out motion-reduce:transition-none',
                    reached ? 'bg-brand' : 'bg-[#e5e7eb]',
                  )}
                />
              ) : null}
              {/* Conector derecho: relleno si el siguiente paso ya está alcanzado */}
              {!isLast ? (
                <span
                  aria-hidden
                  className={cn(
                    'absolute left-1/2 right-0 top-[0.875rem] h-0.5 -translate-y-1/2 rounded-full',
                    'transition-colors duration-300 ease-out motion-reduce:transition-none',
                    currentStep > step.id ? 'bg-brand' : 'bg-[#e5e7eb]',
                  )}
                />
              ) : null}

              {/* Círculo del paso */}
              <span
                className={cn(
                  'relative z-10 flex h-7 w-7 items-center justify-center rounded-full',
                  'text-[12px] font-semibold tabular-nums',
                  'transition-all duration-300 ease-out motion-reduce:transition-none',
                  done && 'bg-brand text-brand-foreground',
                  active &&
                    'bg-brand text-brand-foreground ring-4 ring-brand/15 shadow-[0_1px_4px_rgba(0,102,204,0.28)]',
                  !active &&
                    !done &&
                    'border border-[#e2e5e9] bg-white text-[#9ca3af]',
                )}
              >
                {done ? (
                  <Check className="h-3.5 w-3.5 stroke-[2.75]" aria-hidden />
                ) : (
                  <span aria-hidden>{step.id}</span>
                )}
              </span>

              {/* Etiqueta */}
              <span
                className={cn(
                  'mt-2 max-w-full px-1 text-center text-[11px] leading-tight tracking-[-0.01em]',
                  'transition-colors duration-300 ease-out motion-reduce:transition-none sm:text-[12px]',
                  active && 'font-semibold text-[#0f172a]',
                  done && !active && 'font-medium text-[#475569]',
                  !active && !done && 'font-medium text-[#94a3b8]',
                )}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
