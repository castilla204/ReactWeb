import { cn } from "../../lib/utils";

/**
 * Skeleton unificado de Sileo.
 *
 * Usa un shimmer sutil (barrido horizontal por transform, GPU) en lugar de pulse
 * plano para dar sensación de movimiento y reducir la percepción de espera. El
 * barrido está gated en `prefers-reduced-motion: no-preference` (ver `.sk-shimmer`
 * en index.css), así que se detiene de verdad para quien pide menos movimiento.
 *
 * `shimmerDelayMs` retrasa el inicio del barrido de este bloque → pasando índices
 * crecientes a una rejilla de tarjetas se obtiene una onda diagonal en vez de que
 * todo destelle a la vez (se percibe como progreso, no como "cargando genérico").
 */

interface SileoSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  /** Si true, usa el pulse clásico sin shimmer (útil para elementos muy pequeños). */
  plain?: boolean;
  /** Radio de borde. */
  rounded?: "none" | "sm" | "md" | "lg" | "xl" | "full";
  /** Retardo del barrido (ms) para escalonar la onda entre varios bloques. */
  shimmerDelayMs?: number;
}

const roundedClasses = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  full: "rounded-full",
};

export function SileoSkeleton({
  className,
  plain = false,
  rounded = "md",
  shimmerDelayMs,
  style,
  ...props
}: SileoSkeletonProps) {
  return (
    <div
      className={cn(
        "bg-surface-tinted",
        !plain &&
          "sk-shimmer relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:bg-gradient-to-r before:from-transparent before:via-white/55 before:to-transparent",
        roundedClasses[rounded],
        className
      )}
      style={
        shimmerDelayMs
          ? ({ ...style, "--sk-delay": `${shimmerDelayMs}ms` } as React.CSSProperties)
          : style
      }
      aria-hidden="true"
      {...props}
    />
  );
}

/** Bloque de texto con múltiples líneas. */
export function SileoSkeletonText({
  lines = 2,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <SileoSkeleton
          key={i}
          className={cn("h-3", i === lines - 1 ? "w-2/3" : "w-full")}
          rounded="sm"
        />
      ))}
    </div>
  );
}

/** Card genérica con imagen + texto (móvil/desktop). */
export function SileoSkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      <SileoSkeleton className="aspect-[4/3] w-full rounded-xl" />
      <SileoSkeleton className="h-3.5 w-3/4 rounded" />
      <SileoSkeleton className="h-3 w-1/2 rounded" />
    </div>
  );
}

/** Avatar circular. */
export function SileoSkeletonAvatar({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = { sm: "h-8 w-8", md: "h-10 w-10", lg: "h-14 w-14" };
  return <SileoSkeleton className={cn(sizes[size], className)} rounded="full" />;
}

/** Botón placeholder. */
export function SileoSkeletonButton({ className }: { className?: string }) {
  return (
    <SileoSkeleton className={cn("h-10 w-28 rounded-full", className)} />
  );
}
