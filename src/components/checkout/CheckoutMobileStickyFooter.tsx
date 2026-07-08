import React from 'react';
import {
  SD_CHECKOUT_MOBILE_FOOTER_SHELL_CLASS,
  SD_CHECKOUT_MOBILE_GUTTER_CLASS,
} from '../../constants/homepageTypography';

interface CheckoutMobileStickyFooterProps {
  children: React.ReactNode;
  /**
   * Ref al shell fijo. El footer es `position: fixed`, así que su alto NO ocupa flujo:
   * quien necesite centrar contenido sobre él debe MEDIRLO (su alto varía, p. ej. con la
   * línea de "pago protegido" del paso de elección) en vez de asumir una constante.
   */
  shellRef?: React.Ref<HTMLDivElement>;
}

/** Footer checkout móvil — CTA fijo. */
export function CheckoutMobileStickyFooter({ children, shellRef }: CheckoutMobileStickyFooterProps) {
  return (
    <div ref={shellRef} className={SD_CHECKOUT_MOBILE_FOOTER_SHELL_CLASS}>
      <div
        className={`${SD_CHECKOUT_MOBILE_GUTTER_CLASS} pb-[max(0.625rem,env(safe-area-inset-bottom,0px))] pt-2.5`}
      >
        {children}
      </div>
    </div>
  );
}
