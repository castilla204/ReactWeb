import type { CSSProperties, ReactNode } from 'react';

import { cn } from '../../lib/utils';

import {

  SD_CHECKOUT_MOBILE_FOOTER_INSET_BOTTOM_CLASS,

  SD_CHECKOUT_MOBILE_FOOTER_PAD_BOTTOM_CLASS,

  SD_CHECKOUT_MOBILE_FOOTER_WITH_TRUST_PAD_CLASS,

  SD_CHECKOUT_MOBILE_GUTTER_CLASS,

  SD_CHECKOUT_MOBILE_WIZARD_TOP_PAD_CLASS,

  SD_CHECKOUT_MOBILE_WIZARD_HEADER_SURFACE_CLASS,

  SD_CHECKOUT_MOBILE_WIZARD_HEADER_PB_CLASS,

  SD_CHECKOUT_MOBILE_WIZARD_SCROLL_BODY_CLASS,

  SD_CHECKOUT_MOBILE_WIZARD_FULLBLEED_BODY_CLASS,

  SD_CHECKOUT_MOBILE_WIZARD_FULLBLEED_SHELL_CLASS,

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

 * Shell móvil unificado del checkout: banda superior fija + ola ink + cuerpo scrollable

 * (o mapa full-bleed) + footer fijo externo.

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



  const fullBleedInsetStyle: CSSProperties | undefined =

    footerInsetPx != null && footerInsetPx > 0 ? { bottom: footerInsetPx } : undefined;



  return (

    <div

      className={cn(

        'flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden',

        fullBleed ? SD_CHECKOUT_MOBILE_WIZARD_FULLBLEED_SHELL_CLASS : 'bg-surface-tinted',

        className,

      )}

    >

      <header

        className={cn(

          SD_CHECKOUT_MOBILE_GUTTER_CLASS,

          SD_CHECKOUT_MOBILE_WIZARD_HEADER_SURFACE_CLASS,

          SD_CHECKOUT_MOBILE_WIZARD_TOP_PAD_CLASS,

          SD_CHECKOUT_MOBILE_WIZARD_HEADER_PB_CLASS,

          'relative z-10 shrink-0',

          headerClassName,

        )}

      >

        {header}

      </header>



      <main

        id="checkout-main"

        className={cn(

          'min-h-0 flex-1',

          fullBleed

            ? SD_CHECKOUT_MOBILE_WIZARD_FULLBLEED_BODY_CLASS

            : cn(

                'relative z-0 overflow-y-auto overscroll-y-contain bg-surface-tinted',

                measuredScrollPad == null &&

                  (trustFooterFallback

                    ? SD_CHECKOUT_MOBILE_FOOTER_WITH_TRUST_PAD_CLASS

                    : SD_CHECKOUT_MOBILE_FOOTER_PAD_BOTTOM_CLASS),

              ),

          !fullBleed && SD_CHECKOUT_MOBILE_WIZARD_SCROLL_BODY_CLASS,

          bodyClassName,

        )}

        style={bodyStyle}

      >

        {fullBleed ? (

          <div

            className={cn(

              'absolute inset-x-0 top-0',

              fullBleedInsetStyle == null && SD_CHECKOUT_MOBILE_FOOTER_INSET_BOTTOM_CLASS,

            )}

            style={fullBleedInsetStyle}

          >

            {children}

          </div>

        ) : (

          children

        )}

      </main>

    </div>

  );

}


