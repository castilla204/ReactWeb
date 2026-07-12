import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";
import { SileoLoader } from "./sileo-loader";

/**
 * Botón de Sileo con estado de carga integrado.
 *
 * Centraliza el patrón "spinner + texto" para no repetirlo en cada página.
 * Mantiene la API de Button de shadcn/ui para compatibilidad.
 */

const sileoButtonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60 disabled:cursor-wait",
  {
    variants: {
      variant: {
        default: "bg-brand text-white hover:bg-brand-hover shadow-[0_4px_16px_hsl(var(--brand)/0.2)]",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-brand underline-offset-4 hover:underline",
        white: "bg-white text-ink-strong hover:bg-gray-50 border border-line",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
        pill: "h-11 px-6 rounded-full",
        "pill-sm": "h-9 px-4 rounded-full text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface SileoButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof sileoButtonVariants> {
  asChild?: boolean;
  /** Si true, muestra el spinner y deshabilita el botón. */
  loading?: boolean;
  /** Texto mostrado durante la carga. Si no se pasa, se mantiene el children. */
  loadingText?: string;
  /** Icono opcional a la izquierda (se oculta durante la carga). */
  icon?: React.ReactNode;
}

const SileoButton = React.forwardRef<HTMLButtonElement, SileoButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      loadingText,
      icon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    const isLoading = loading;

    return (
      <Comp
        className={cn(sileoButtonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <SileoLoader
              size={size === "icon" ? "md" : "sm"}
              color="current"
            />
            <span className="ml-2">{loadingText !== undefined ? loadingText : children}</span>
          </>
        ) : (
          <>
            {icon ? <span className="mr-2 inline-flex items-center">{icon}</span> : null}
            {children}
          </>
        )}
      </Comp>
    );
  }
);
SileoButton.displayName = "SileoButton";

export { SileoButton, sileoButtonVariants };
