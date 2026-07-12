import React from 'react';
import {
  SD_MOBILE_FOOTER_SHELL_CLASS,
  SD_MOBILE_GUTTER_CLASS,
} from '../../constants/homepageTypography';

export interface MobileReserveFooterProps {
  /** Importe principal (una línea, sin paréntesis de conversión) */
  price: React.ReactNode;
  /** Texto corto en la misma línea (ej. «por servicio») */
  priceSuffix?: React.ReactNode;
  priceAriaLabel?: string;
  /** Línea encima de precio + CTA (ej. nota de pago retenido) */
  trustNote?: React.ReactNode;
  children: React.ReactNode;
}

/** Barra fija inferior móvil — nota opcional, precio a la izquierda, CTA a la derecha. */
export const MobileReserveFooter: React.FC<MobileReserveFooterProps> = ({
  price,
  priceSuffix,
  priceAriaLabel,
  trustNote,
  children,
}) => (
  <div className={SD_MOBILE_FOOTER_SHELL_CLASS}>
    <div className={`${SD_MOBILE_GUTTER_CLASS} sd-mobile-footer-inner`}>
      {trustNote ? <div className="sd-mobile-footer-trust">{trustNote}</div> : null}
      <div className="sd-mobile-footer-row">
        <div
          className="sd-mobile-footer-price-line min-w-0 flex-1"
          aria-label={priceAriaLabel}
        >
          <span className="sd-mobile-footer-price">{price}</span>
          {priceSuffix ? (
            <>
              <span className="sd-mobile-footer-price-sep" aria-hidden>
                ·
              </span>
              <span className="sd-mobile-footer-price-suffix">{priceSuffix}</span>
            </>
          ) : null}
        </div>
        <div className="shrink-0">{children}</div>
      </div>
    </div>
  </div>
);
