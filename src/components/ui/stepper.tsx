import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Check } from "lucide-react"
import { cn } from "../../lib/utils"

const stepperVariants = cva(
  "flex items-center justify-center rounded-full transition-all",
  {
    variants: {
      variant: {
        default: "bg-gray-900 text-white",
        completed: "bg-gray-900 text-white",
        current: "bg-gray-900 text-white",
        pending: "bg-gray-200 text-gray-400",
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
                    "text-[9px] font-medium sm:hidden text-center leading-tight",
                    isCompleted || isCurrent
                      ? "text-gray-900"
                      : "text-gray-400"
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "h-[1px] w-12 sm:w-16 transition-colors mx-2 sm:mx-3",
                    isCompleted ? "bg-gray-900" : "bg-gray-200"
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
