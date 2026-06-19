import React from 'react';
import {
  SD_CHECKOUT_MOBILE_TABLE_CLASS,
  SD_CHECKOUT_MOBILE_TABLE_HEADER_CLASS,
  SD_CHECKOUT_MOBILE_TABLE_TITLE_CLASS,
  SD_CHECKOUT_MOBILE_TABLE_SUBTITLE_CLASS,
  SD_CHECKOUT_MOBILE_TABLE_ROW_CLASS,
  SD_CHECKOUT_MOBILE_TABLE_LABEL_CLASS,
  SD_CHECKOUT_MOBILE_TABLE_VALUE_CLASS,
  SD_CHECKOUT_MOBILE_META_CLASS,
} from '../../constants/homepageTypography';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import type { ServiceDeliverableType } from '../serviceDetail/ServiceDetailDeliverablesGuide';

export interface CheckoutSummaryTableProps {
  serviceName: string;
  durationLabel: string;
  categoryName?: string;
  expertName?: string;
  expertPicture?: string;
  expertRating?: number;
  expertReviewCount?: number;
  appointmentLabel?: string | null;
  locationLabel?: string | null;
  locationRangeKm?: number;
  timezoneLabel?: string | null;
  deliverables: ServiceDeliverableType[];
  priceDisplay?: React.ReactNode;
  priceSubline?: React.ReactNode;
  showPriceDetails?: boolean;
  onTogglePriceDetails?: () => void;
  includePrice?: boolean;
  showFooterNotes?: boolean;
  className?: string;
}

function CheckoutSummaryTableRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={SD_CHECKOUT_MOBILE_TABLE_ROW_CLASS}>
      <dt className={SD_CHECKOUT_MOBILE_TABLE_LABEL_CLASS}>{label}</dt>
      <dd className={`m-0 ${SD_CHECKOUT_MOBILE_TABLE_VALUE_CLASS}`}>{children}</dd>
    </div>
  );
}

function buildHeaderMeta(categoryName?: string, durationLabel?: string): string | null {
  return [categoryName, durationLabel].filter(Boolean).join(' · ') || null;
}

/** Resumen minimalista de checkout — móvil y desktop. */
export function CheckoutSummaryTable({
  serviceName,
  durationLabel,
  categoryName,
  expertName,
  expertPicture,
  appointmentLabel,
  locationLabel,
  priceDisplay,
  includePrice = true,
  showFooterNotes = false,
  className = '',
}: CheckoutSummaryTableProps) {
  const headerMeta = buildHeaderMeta(categoryName, durationLabel);

  return (
    <div className={className}>
      <article className={SD_CHECKOUT_MOBILE_TABLE_CLASS}>
        <header className={SD_CHECKOUT_MOBILE_TABLE_HEADER_CLASS}>
          <h2 className={SD_CHECKOUT_MOBILE_TABLE_TITLE_CLASS}>{serviceName}</h2>
          {headerMeta ? <p className={SD_CHECKOUT_MOBILE_TABLE_SUBTITLE_CLASS}>{headerMeta}</p> : null}
        </header>

        {expertName ? (
          <div className="flex items-center gap-2.5 border-t border-[#f5f5f5] px-4 py-3">
            <Avatar className="h-8 w-8 shrink-0 rounded-full">
              <AvatarImage src={expertPicture} alt={expertName} />
              <AvatarFallback className="rounded-full bg-[#1c1c1c] text-[11px] font-semibold text-white">
                {expertName.charAt(0) || 'E'}
              </AvatarFallback>
            </Avatar>
            <p className="min-w-0 flex-1 truncate text-[13px] font-medium text-[#1c1c1c]">{expertName}</p>
          </div>
        ) : null}

        <dl aria-label="Detalles del servicio">
          {appointmentLabel ? (
            <CheckoutSummaryTableRow label="Cita">{appointmentLabel}</CheckoutSummaryTableRow>
          ) : null}

          {locationLabel ? (
            <CheckoutSummaryTableRow label="Ubicación">{locationLabel}</CheckoutSummaryTableRow>
          ) : null}

          {includePrice && priceDisplay != null ? (
            <div className="border-t border-[#f5f5f5] px-4 py-3.5">
              <div className="flex items-baseline justify-between gap-4">
                <p className="text-xs text-[#6a6a6a]">Total</p>
                <p className="font-display text-xl font-semibold tabular-nums leading-none tracking-[-0.02em] text-[#1c1c1c]">
                  {priceDisplay}
                </p>
              </div>
              <p className={`mt-1 ${SD_CHECKOUT_MOBILE_META_CLASS}`}>Impuestos incluidos</p>
            </div>
          ) : null}
        </dl>

        {showFooterNotes ? (
          <footer className="border-t border-[#f5f5f5] px-4 py-3">
            <a
              href="/terms.html"
              target="_blank"
              rel="noopener noreferrer"
              className={`${SD_CHECKOUT_MOBILE_META_CLASS} underline decoration-[#d4d4d4] underline-offset-2 hover:no-underline`}
            >
              Condiciones
            </a>
          </footer>
        ) : null}
      </article>
    </div>
  );
}
