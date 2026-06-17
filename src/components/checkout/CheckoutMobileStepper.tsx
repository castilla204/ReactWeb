import React from 'react';
import { cn } from '../../lib/utils';

const STEPS = [
  { id: 1 as const, label: 'Fecha y hora' },
  { id: 2 as const, label: 'Ubicación' },
  { id: 3 as const, label: 'Pago' },
] as const;

export type CheckoutMobileWizardStep = (typeof STEPS)[number]['id'];

interface CheckoutMobileStepperProps {
  currentStep: CheckoutMobileWizardStep;
}

/** Indicador de paso — tres pasos: fecha, ubicación, pago. */
export function CheckoutMobileStepper({ currentStep }: CheckoutMobileStepperProps) {
  return (
    <nav className="mb-1" aria-label="Pasos de la reserva">
      <div className="grid grid-cols-3 gap-1 rounded-xl bg-[#f4f4f5] p-1">
        {STEPS.map((step) => {
          const active = currentStep === step.id;
          const done = currentStep > step.id;
          return (
            <div
              key={step.id}
              className={cn(
                'rounded-lg py-2 text-center text-[11px] font-medium transition-all duration-200 sm:text-[12px]',
                active && 'bg-white text-[#1c1c1c] shadow-sm',
                done && !active && 'text-[#6b7280]',
                !active && !done && 'text-[#9ca3af]',
              )}
              aria-current={active ? 'step' : undefined}
            >
              {step.label}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
