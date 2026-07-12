import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Check } from "lucide-react"
import { cn } from "../../lib/utils"

const stepperVariants = cva(
  "flex items-center justify-center rounded-full transition-all",
  {
    variants: {
      variant: {
        default: "bg-brand text-white shadow-[0_2px_8px_hsl(var(--brand)/0.25)]",
        completed: "bg-brand text-white",
        current: "bg-brand text-white ring-2 ring-brand/25 ring-offset-2",
        pending: "bg-brand/10 text-ink-soft border border-line",
      },
      size: {
        default: "h-8 w-8",
        sm: "h-7 w-7",
        lg: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface StepperProps extends VariantProps<typeof stepperVariants> {
  steps: Array<{
    label: string
    icon?: React.ReactNode
  }>
  currentStep: number
  className?: string
}

const Stepper = React.forwardRef<HTMLDivElement, StepperProps>(
  ({ steps, currentStep, className, size = "default", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex items-center justify-center w-full", className)}
        {...props}
      >
        {steps.map((step, index) => {
          const stepNumber = index + 1
          const isCompleted = stepNumber < currentStep
          const isCurrent = stepNumber === currentStep
          const isPending = stepNumber > currentStep

          return (
            <React.Fragment key={index}>
              {/* Step Circle */}
              <div className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    stepperVariants({
                      variant: isCompleted
                        ? "completed"
                        : isCurrent
                        ? "current"
                        : "pending",
                      size,
                    })
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4 text-white" />
                  ) : (
                    <span className="text-xs font-semibold">
                      {String(stepNumber).padStart(2, '0')}
                    </span>
                  )}
                </div>
                {/* Label - Solo en móvil */}
                <span
                  className={cn(
                    "max-w-[4.5rem] text-center text-badge font-medium leading-tight sm:max-w-none sm:text-xs",
                    isCompleted || isCurrent
                      ? "text-ink-strong"
                      : "text-ink-soft"
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "mx-1.5 h-0.5 w-6 rounded-full transition-colors sm:mx-2 sm:w-10",
                    isCompleted ? "bg-brand" : "bg-line"
                  )}
                />
              )}
            </React.Fragment>
          )
        })}
      </div>
    )
  }
)
Stepper.displayName = "Stepper"

export { Stepper, stepperVariants }
