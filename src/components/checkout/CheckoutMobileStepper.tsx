import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';

const STEPS = [
  { id: 1 as const, label: 'Fecha y hora' },
  { id: 2 as const, label: 'Ubicación' },
  { id: 3 as const, label: 'Pago' },
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

/** Indicador de paso — misma píldora para el wizard y el paso de coordinación. */
export function CheckoutMobileStepper({
  currentStep,
  className,
  steps = STEPS,
}: CheckoutMobileStepperProps) {
  return (
    <nav className={cn('mb-1.5', className)} aria-label="Pasos de la reserva">
      <div
        className={cn(
          'grid gap-1 rounded-full border border-[#e5e7eb]/80 bg-[#f0f1f3] p-1.5',
          steps.length === 2 ? 'grid-cols-2' : 'grid-cols-3',
          'shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)]',
        )}
      >
        {steps.map((step) => {
          const active = currentStep === step.id;
          const done = currentStep > step.id;
          return (
            <div
              key={step.id}
              className={cn(
                'flex min-h-[2.375rem] items-center justify-center gap-1 rounded-full px-1.5',
                'text-center text-[11px] font-semibold tracking-[-0.01em] transition-all duration-300 ease-out sm:text-[12px]',
                active &&
                  'bg-white text-[#1c1c1c] shadow-[0_1px_4px_rgba(15,23,42,0.08),0_0_0_1px_rgba(15,23,42,0.04)]',
                done && !active && 'text-brand',
                !active && !done && 'text-[#9ca3af]',
              )}
              aria-current={active ? 'step' : undefined}
            >
              {done && !active ? (
                <Check className="h-3 w-3 shrink-0 stroke-[2.5]" aria-hidden />
              ) : null}
              <span className="leading-tight">{step.label}</span>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
