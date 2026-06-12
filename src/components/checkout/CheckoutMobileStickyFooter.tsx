import React from 'react';
import {
  SD_CHECKOUT_MOBILE_FOOTER_SHELL_CLASS,
  SD_CHECKOUT_MOBILE_GUTTER_CLASS,
} from '../../constants/homepageTypography';
import { ESCROW_CHECKOUT_FOOTER_NOTE } from '../../constants/escrowCopy';

interface CheckoutMobileStickyFooterProps {
  children: React.ReactNode;
}

/** Footer checkout móvil — una línea + CTA fijo. */
export function CheckoutMobileStickyFooter({ children }: CheckoutMobileStickyFooterProps) {
  return (
    <div className={SD_CHECKOUT_MOBILE_FOOTER_SHELL_CLASS}>
      <div
        className={`${SD_CHECKOUT_MOBILE_GUTTER_CLASS} pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pt-2.5`}
      >
        <p className="mb-2.5 text-[11px] leading-snug text-[#6a6a6a]">
          {ESCROW_CHECKOUT_FOOTER_NOTE}{' '}
          <a
            href="/terms.html"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[#222222] underline decoration-[#c8c8c8] underline-offset-2 hover:no-underline"
          >
            Condiciones
          </a>
        </p>
        {children}
      </div>
    </div>
  );
}
