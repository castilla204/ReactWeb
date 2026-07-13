import type { CSSProperties, ReactNode } from 'react';
import { cn } from '../../lib/utils';
import {
  SD_CHECKOUT_MOBILE_FOOTER_INSET_BOTTOM_CLASS,
  SD_CHECKOUT_MOBILE_FOOTER_PAD_BOTTOM_CLASS,
  SD_CHECKOUT_MOBILE_FOOTER_WITH_TRUST_PAD_CLASS,
  SD_CHECKOUT_MOBILE_GUTTER_CLASS,
  SD_CHECKOUT_MOBILE_HEADER_SURFACE_CLASS,
  SD_CHECKOUT_MOBILE_TOP_PAD_CLASS,
} from '../../constants/homepageTypography';

interface CheckoutMobileWizardShellProps {
  /** Cabecera fija: stepper + título + descripción del paso. */
  header: ReactNode;
  children: ReactNode;
  /** Mapa a pantalla completa: el cuerpo no scrollea; el picker usa inset inferior del footer. */
  fullBleed?: boolean;
  /**
   * Padding inferior medido del footer (p. ej. paso de elección con línea de confianza).
   * Si se omite, se usa la constante estándar del footer.
   */
  footerInsetPx?: number;
  /** Aire visible tras el último bloque al hacer scroll hasta el final (p. ej. fondo tinted). */
  scrollEndCushionPx?: number;
  /** Footer con línea de confianza: fallback de scroll pad más alto hasta medir el footer. */
  trustFooterFallback?: boolean;
  className?: string;
  bodyClassName?: string;
  headerClassName?: string;
}

/**
 * Shell móvil unificado del checkout: banda superior fija + cuerpo scrollable (o mapa
 * full-bleed) + footer fijo externo. Todos los pasos del wizard comparten la misma
 * arquitectura para que la distribución no cambie al avanzar.
 */
export function CheckoutMobileWizardShell({
  header,
  children,
  fullBleed = false,
  footerInsetPx,
  scrollEndCushionPx = 24,
  trustFooterFallback = false,
  className,
  bodyClassName,
  headerClassName,
}: CheckoutMobileWizardShellProps) {
  const measuredScrollPad =
    footerInsetPx != null && footerInsetPx > 0
      ? footerInsetPx + scrollEndCushionPx
      : undefined;

  const bodyStyle: CSSProperties | undefined = measuredScrollPad
    ? { paddingBottom: measuredScrollPad }
    : undefined;

  return (
    <div
      className={cn(
        'flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden bg-white',
        className,
      )}
    >
      <header
        className={cn(
          SD_CHECKOUT_MOBILE_GUTTER_CLASS,
          SD_CHECKOUT_MOBILE_HEADER_SURFACE_CLASS,
          SD_CHECKOUT_MOBILE_TOP_PAD_CLASS,
          'shrink-0 pb-3',
          headerClassName,
        )}
      >
        {header}
      </header>

      <div
        className={cn(
          'min-h-0 flex-1',
          fullBleed
            ? 'relative overflow-hidden'
            : cn(
                'overflow-y-auto overscroll-y-contain',
                measuredScrollPad == null &&
                  (trustFooterFallback
                    ? SD_CHECKOUT_MOBILE_FOOTER_WITH_TRUST_PAD_CLASS
                    : SD_CHECKOUT_MOBILE_FOOTER_PAD_BOTTOM_CLASS),
              ),
          bodyClassName,
        )}
        style={bodyStyle}
      >
        {fullBleed ? (
          <div
            className={cn(
              'absolute inset-x-0 top-0',
              SD_CHECKOUT_MOBILE_FOOTER_INSET_BOTTOM_CLASS,
            )}
          >
            {children}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
