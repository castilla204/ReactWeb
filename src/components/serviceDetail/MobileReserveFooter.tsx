import React from 'react';
import {
  SD_MOBILE_FOOTER_SHELL_CLASS,
  SD_MOBILE_GUTTER_CLASS,
} from '../../constants/homepageTypography';

export interface MobileReserveFooterProps {
  /** Importe principal (ej. 52,00 €) */
  price: React.ReactNode;
  /** Línea secundaria (ej. «el servicio» o «Precio total») */
  priceMeta?: React.ReactNode;
  /** Tercera línea opcional (ej. horario del experto) */
  priceExtra?: React.ReactNode;
  priceAriaLabel?: string;
  children: React.ReactNode;
}

/**
 * Barra fija inferior móvil — mismo layout en ficha servicio y checkout:
 * precio a la izquierda, CTA compacto a la derecha.
 */
export const MobileReserveFooter: React.FC<MobileReserveFooterProps> = ({
  price,
  priceMeta,
  priceExtra,
  priceAriaLabel,
  children,
}) => (
  <div className={SD_MOBILE_FOOTER_SHELL_CLASS}>
    <div className={`${SD_MOBILE_GUTTER_CLASS} sd-mobile-footer-inner`}>
      <div className="sd-mobile-footer-row">
        <div className="min-w-0 flex-1 pr-3">
          <div className="sd-mobile-footer-price" aria-label={priceAriaLabel}>
            {price}
          </div>
          {priceMeta ? <p className="sd-mobile-footer-price-meta">{priceMeta}</p> : null}
          {priceExtra ? (
            <div className="sd-mobile-footer-price-extra">{priceExtra}</div>
          ) : null}
        </div>
        <div className="shrink-0 self-center">{children}</div>
      </div>
    </div>
  </div>
);
