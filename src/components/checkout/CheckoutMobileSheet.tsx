import React from 'react';
import { SD_CHECKOUT_MOBILE_TABLE_WRAP_CLASS } from '../../constants/homepageTypography';
import { CheckoutSummaryTable, type CheckoutSummaryTableProps } from './CheckoutSummaryTable';

type CheckoutMobileSheetProps = Omit<CheckoutSummaryTableProps, 'includePrice' | 'expertName' | 'className'> &
  Required<Pick<CheckoutSummaryTableProps, 'priceDisplay' | 'onTogglePriceDetails'>>;

/** Checkout móvil — tabla contorneada tipo Airbnb. */
export function CheckoutMobileSheet(props: CheckoutMobileSheetProps) {
  return (
    <div className="checkout-mobile-sheet bg-white">
      <div className={SD_CHECKOUT_MOBILE_TABLE_WRAP_CLASS}>
        <CheckoutSummaryTable {...props} includePrice />
      </div>
    </div>
  );
}
