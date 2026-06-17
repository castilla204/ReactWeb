import React from 'react';
import {
  SD_CHECKOUT_MOBILE_GUTTER_CLASS,
  SD_CHECKOUT_MOBILE_SUMMARY_SECTION_CLASS,
  SD_CHECKOUT_MOBILE_TABLE_WRAP_CLASS,
} from '../../constants/homepageTypography';
import { CheckoutSummaryTable, type CheckoutSummaryTableProps } from './CheckoutSummaryTable';

type CheckoutMobileSheetProps = CheckoutSummaryTableProps & {
  sectionTitle?: string;
  separated?: boolean;
  /** Resumen más ligero tras el mapa en checkout móvil paso 2 */
  compact?: boolean;
};

/** Checkout móvil — tabla unificada a ancho completo. */
export function CheckoutMobileSheet({
  sectionTitle,
  separated = false,
  compact = false,
  ...props
}: CheckoutMobileSheetProps) {
  const inner = (
    <CheckoutSummaryTable {...props} className={SD_CHECKOUT_MOBILE_TABLE_WRAP_CLASS} />
  );

  if (!separated) {
    return <div className="checkout-mobile-sheet bg-white">{inner}</div>;
  }

  const sectionCls = compact
    ? 'checkout-mobile-sheet mt-4 border-t border-[#f0f0f0] bg-white pb-2 pt-4'
    : `checkout-mobile-sheet ${SD_CHECKOUT_MOBILE_SUMMARY_SECTION_CLASS}`;

  const titleCls = compact
    ? `${SD_CHECKOUT_MOBILE_GUTTER_CLASS} mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#999]`
    : `${SD_CHECKOUT_MOBILE_GUTTER_CLASS} mb-3 text-sm font-semibold tracking-[-0.01em] text-[#1c1c1c]`;

  return (
    <section className={sectionCls}>
      {sectionTitle ? (
        <h2 className={titleCls}>
          {sectionTitle}
        </h2>
      ) : null}
      {inner}
    </section>
  );
}
