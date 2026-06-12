import React from 'react';
import { ChevronDown, Globe } from 'lucide-react';
import {
  SD_CHECKOUT_MOBILE_TABLE_CLASS,
  SD_CHECKOUT_MOBILE_TABLE_ROW_CLASS,
  SD_CHECKOUT_MOBILE_TABLE_LABEL_CLASS,
  SD_CHECKOUT_MOBILE_TABLE_VALUE_CLASS,
  SD_CHECKOUT_MOBILE_TABLE_VALUE_META_CLASS,
  SD_CHECKOUT_MOBILE_META_CLASS,
} from '../../constants/homepageTypography';
import { formatWorkRadiusCoverageLabel } from '../../utils/workRadius';
import type { ServiceDeliverableType } from '../serviceDetail/ServiceDetailDeliverablesGuide';

export interface CheckoutSummaryTableProps {
  serviceName: string;
  durationLabel: string;
  categoryName?: string;
  expertName?: string;
  locationLabel?: string | null;
  locationRangeKm?: number;
  timezoneLabel?: string | null;
  deliverables: ServiceDeliverableType[];
  priceDisplay?: React.ReactNode;
  priceSubline?: React.ReactNode;
  showPriceDetails?: boolean;
  onTogglePriceDetails?: () => void;
  /** Móvil: precio en tabla. Desktop: precio en aside. */
  includePrice?: boolean;
  className?: string;
}

function CheckoutSummaryTableRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={SD_CHECKOUT_MOBILE_TABLE_ROW_CLASS}>
      <span className={SD_CHECKOUT_MOBILE_TABLE_LABEL_CLASS}>{label}</span>
      <div className={SD_CHECKOUT_MOBILE_TABLE_VALUE_CLASS}>{children}</div>
    </div>
  );
}

function formatDeliverablesList(items: ServiceDeliverableType[]): string {
  return items
    .map((item) =>
      (
        item.displayName ||
        item.deliverableType?.displayName ||
        item.name ||
        item.deliverableType?.name ||
        ''
      ).trim()
    )
    .filter(Boolean)
    .join(' · ');
}

/** Tabla contorneada de resumen — compartida móvil y desktop checkout. */
export function CheckoutSummaryTable({
  serviceName,
  durationLabel,
  categoryName,
  expertName,
  locationLabel,
  locationRangeKm,
  timezoneLabel,
  deliverables,
  priceDisplay,
  priceSubline,
  showPriceDetails = false,
  onTogglePriceDetails,
  includePrice = true,
  className = '',
}: CheckoutSummaryTableProps) {
  const deliverablesLine = formatDeliverablesList(deliverables);
  const rangeLabel =
    locationRangeKm != null ? formatWorkRadiusCoverageLabel(locationRangeKm) : null;

  return (
    <div className={className}>
      <div className={SD_CHECKOUT_MOBILE_TABLE_CLASS} role="table" aria-label="Resumen del servicio">
        <CheckoutSummaryTableRow label="Servicio">{serviceName}</CheckoutSummaryTableRow>

        {expertName ? (
          <CheckoutSummaryTableRow label="Experto">{expertName}</CheckoutSummaryTableRow>
        ) : null}

        {durationLabel ? (
          <CheckoutSummaryTableRow label="Detalles">{durationLabel}</CheckoutSummaryTableRow>
        ) : null}

        {categoryName ? (
          <CheckoutSummaryTableRow label="Categoría">{categoryName}</CheckoutSummaryTableRow>
        ) : null}

        {locationLabel ? (
          <CheckoutSummaryTableRow label="Ubicación">
            <span className="block">{locationLabel}</span>
            {rangeLabel ? (
              <span className={SD_CHECKOUT_MOBILE_TABLE_VALUE_META_CLASS}>{rangeLabel}</span>
            ) : null}
          </CheckoutSummaryTableRow>
        ) : null}

        {deliverablesLine ? (
          <CheckoutSummaryTableRow label="Incluye">{deliverablesLine}</CheckoutSummaryTableRow>
        ) : null}

        {timezoneLabel ? (
          <CheckoutSummaryTableRow label="Horario">
            <span className="inline-flex items-center justify-end gap-1.5">
              <Globe className="h-3.5 w-3.5 shrink-0 text-brand" aria-hidden />
              {timezoneLabel}
            </span>
          </CheckoutSummaryTableRow>
        ) : null}

        {includePrice && priceDisplay != null && onTogglePriceDetails ? (
          <div className="border-b border-[#ebebeb] last:border-b-0">
            <div className="flex items-start justify-between gap-4 px-4 py-3.5">
              <span className={SD_CHECKOUT_MOBILE_TABLE_LABEL_CLASS}>Precio total</span>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <p className="text-base font-semibold tabular-nums leading-none tracking-tight text-[#222222]">
                  {priceDisplay}
                </p>
                <button
                  type="button"
                  onClick={onTogglePriceDetails}
                  className={`inline-flex items-center gap-0.5 ${SD_CHECKOUT_MOBILE_META_CLASS} font-medium text-[#222222]`}
                  aria-expanded={showPriceDetails}
                >
                  <ChevronDown
                    aria-hidden
                    className={`h-3.5 w-3.5 transition-transform ${showPriceDetails ? 'rotate-180' : ''}`}
                  />
                  {showPriceDetails ? 'Ocultar' : 'Detalles'}
                </button>
              </div>
            </div>

            {showPriceDetails ? (
              <div
                className={`border-t border-[#ebebeb] px-4 py-3 ${SD_CHECKOUT_MOBILE_META_CLASS}`}
                role="region"
                aria-label="Detalles del precio"
              >
                <p>Impuestos incluidos. El IVA se calcula en Stripe según tu país.</p>
                {priceSubline ? <p className="mt-1">{priceSubline}</p> : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
