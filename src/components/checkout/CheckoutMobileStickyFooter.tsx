import React from 'react';
import {
  SD_CHECKOUT_MOBILE_FOOTER_SHELL_CLASS,
  SD_CHECKOUT_MOBILE_GUTTER_CLASS,
} from '../../constants/homepageTypography';

interface CheckoutMobileStickyFooterProps {
  children: React.ReactNode;
}

/** Footer checkout móvil — CTA fijo. */
export function CheckoutMobileStickyFooter({ children }: CheckoutMobileStickyFooterProps) {
  return (
    <div className={SD_CHECKOUT_MOBILE_FOOTER_SHELL_CLASS}>
      <div
        className={`${SD_CHECKOUT_MOBILE_GUTTER_CLASS} pb-[max(0.625rem,env(safe-area-inset-bottom,0px))] pt-2.5`}
      >
        {children}
      </div>
    </div>
  );
}
