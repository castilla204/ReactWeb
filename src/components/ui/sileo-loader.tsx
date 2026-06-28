import { useState, useEffect } from "react";
import { cn } from "../../lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

/**
 * Sistema unificado de carga de Sileo.
 *
 * Objetivos:
 * - Un solo componente para TODO tipo de espera (página, botón, inline, overlay).
 * - Colores siempre coherentes con la marca (--brand).
 * - Accesible por defecto (role, aria-live, aria-busy).
 * - Respeta prefers-reduced-motion.
 */

const sileoLoaderVariants = cva(
  "inline-flex items-center justify-center",
  {
    variants: {
      variant: {
        // Spinner determinado de marca (por defecto)
        spinner: "",
        // Logo/marca "respirando" — para momentos clave (pago, login)
        brand: "sileo-loader-brand",
        // Puntos de escritura para chat/asistente
        typing: "sileo-loader-typing",
        // Barra de progreso indeterminada
        bar: "sileo-loader-bar",
      },
      size: {
        xs: "gap-1.5 text-[11px]",
        sm: "gap-2 text-xs",
        md: "gap-2.5 text-sm",
        lg: "gap-3 text-base",
        xl: "gap-4 text-lg",
      },
      layout: {
        inline: "",
        center: "flex-col",
        fullscreen: "fixed inset-0 z-[9999] flex-col bg-background/80 backdrop-blur-sm",
        page: "min-h-[40vh] w-full flex-col",
      },
    },
    defaultVariants: {
      variant: "spinner",
      size: "md",
      layout: "inline",
    },
  }
);

const spinnerSizes = {
  xs: "w-3 h-3",
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-8 h-8",
  xl: "w-10 h-10",
};

export interface SileoLoaderProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof sileoLoaderVariants> {
  /** Texto que acompaña al loader. Si no se pasa, solo se muestra el icono. */
  message?: string;
  /** Oculta el texto visualmente pero lo mantiene para lectores de pantalla. */
  srOnlyMessage?: boolean;
  /** Color del spinner. Por defecto usa el color de marca. */
  color?: "brand" | "current" | "white" | "muted";
  /** Añade un retraso antes de mostrarse (ms). Útil para evitar parpadeos en cargas rápidas. */
  delay?: number;
}

export function SileoLoader({
  className,
  variant = "spinner",
  size = "md",
  layout = "inline",
  message,
  srOnlyMessage = false,
  color = "brand",
  delay,
  ...props
}: SileoLoaderProps) {
  const colorClasses = {
    brand: "text-brand",
    current: "text-current",
    white: "text-white",
    muted: "text-[#9ca3af]",
  };

  const wrapper = (
    <div
      className={cn(sileoLoaderVariants({ variant, size, layout }), className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
      {...props}
    >
      {variant === "spinner" && (
        <Loader2 className={cn("animate-spin", spinnerSizes[size as keyof typeof spinnerSizes], colorClasses[color])} aria-hidden="true" />
      )}

      {variant === "brand" && (
        <span className="relative flex items-center justify-center">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand/30 opacity-60" />
          <span className="relative inline-flex h-2/3 w-2/3 rounded-full bg-brand" />
        </span>
      )}

      {variant === "typing" && (
        <span className="flex items-center gap-1" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="sileo-loader-typing-dot block h-1.5 w-1.5 rounded-full bg-current"
              style={{ animationDelay: `${i * 120}ms` }}
            />
          ))}
        </span>
      )}

      {variant === "bar" && (
        <div className="h-1 w-full overflow-hidden rounded-full bg-[#e8e8e8]">
          <div className="sileo-loader-bar-track h-full w-1/3 rounded-full bg-brand" />
        </div>
      )}

      {message ? (
        <span className={cn("font-medium", srOnlyMessage && "sr-only")}>
          {message}
        </span>
      ) : null}

      <span className="sr-only">Cargando</span>
    </div>
  );

  const [shouldShow, setShouldShow] = useState(delay ? false : true);

  useEffect(() => {
    if (!delay || delay <= 0) return;
    const t = setTimeout(() => setShouldShow(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  if (!shouldShow) return null;

  return wrapper;
}

/** Variante de pantalla completa con mensaje centrado. */
export function SileoFullscreenLoader({
  message = "Cargando…",
  className,
}: {
  message?: string;
  className?: string;
}) {
  return (
    <SileoLoader
      variant="spinner"
      size="xl"
      layout="fullscreen"
      message={message}
      className={className}
    />
  );
}

/** Variante para páginas enteras con estructura previa mínima. */
export function SileoPageLoader({
  message = "Cargando…",
  className,
  contained = false,
}: {
  message?: string;
  className?: string;
  /** Si el loader vive dentro de un contenedor que ya lo centra/limita,
   *  evita ocupar el alto completo de la ventana. */
  contained?: boolean;
}) {
  return (
    <SileoLoader
      variant="spinner"
      size="lg"
      layout="page"
      message={message}
      // Por defecto centra en el alto completo de la ventana; "contained"
      // mantiene el bloque acotado (40vh) para usos embebidos.
      className={cn(!contained && "min-h-[100dvh]", className)}
    />
  );
}
