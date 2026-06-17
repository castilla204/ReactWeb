import React from 'react';
import { BadgeCheck, ChevronDown, Star } from 'lucide-react';
import {
  SD_CHECKOUT_MOBILE_TABLE_CLASS,
  SD_CHECKOUT_MOBILE_TABLE_HEADER_CLASS,
  SD_CHECKOUT_MOBILE_TABLE_TITLE_CLASS,
  SD_CHECKOUT_MOBILE_TABLE_SUBTITLE_CLASS,
  SD_CHECKOUT_MOBILE_TABLE_ROW_CLASS,
  SD_CHECKOUT_MOBILE_TABLE_LABEL_CLASS,
  SD_CHECKOUT_MOBILE_TABLE_VALUE_CLASS,
  SD_CHECKOUT_MOBILE_TABLE_VALUE_META_CLASS,
  SD_CHECKOUT_MOBILE_META_CLASS,
} from '../../constants/homepageTypography';
import { ESCROW_TRUST_TAGLINE } from '../../constants/escrowCopy';
import { formatWorkRadiusCoverageLabel } from '../../utils/workRadius';
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

function buildHeaderMeta(categoryName?: string, durationLabel?: string): string | null {
  return [categoryName, durationLabel].filter(Boolean).join(' · ') || null;
}

/** Resumen compacto de checkout — móvil y desktop. */
export function CheckoutSummaryTable({
  serviceName,
  durationLabel,
  categoryName,
  expertName,
  expertPicture,
  expertRating,
  expertReviewCount,
  locationLabel,
  locationRangeKm,
  timezoneLabel,
  deliverables,
  priceDisplay,
  priceSubline,
  showPriceDetails = false,
  onTogglePriceDetails,
  includePrice = true,
  showFooterNotes = false,
  className = '',
}: CheckoutSummaryTableProps) {
  const deliverablesLine = formatDeliverablesList(deliverables);
  const rangeLabel =
    locationRangeKm != null ? formatWorkRadiusCoverageLabel(locationRangeKm) : null;
  const headerMeta = buildHeaderMeta(categoryName, durationLabel);
  const ratingLabel =
    expertRating != null && expertRating > 0 ? expertRating.toFixed(1).replace('.', ',') : null;
  const showRating = ratingLabel != null && (expertReviewCount ?? 0) > 0;

  return (
    <div className={className}>
      <article className={SD_CHECKOUT_MOBILE_TABLE_CLASS}>
        <header className={SD_CHECKOUT_MOBILE_TABLE_HEADER_CLASS}>
          <h2 className={SD_CHECKOUT_MOBILE_TABLE_TITLE_CLASS}>{serviceName}</h2>
          {headerMeta ? <p className={SD_CHECKOUT_MOBILE_TABLE_SUBTITLE_CLASS}>{headerMeta}</p> : null}
        </header>

        {expertName ? (
          <div className="flex items-center gap-2.5 border-t border-[#f5f5f5] px-4 py-2.5">
            <Avatar className="h-8 w-8 shrink-0 rounded-full">
              <AvatarImage src={expertPicture} alt={expertName} />
              <AvatarFallback className="rounded-full bg-[#1c1c1c] text-[11px] font-semibold text-white">
                {expertName.charAt(0) || 'E'}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-[#1c1c1c]">{expertName}</p>
              <p className="mt-px flex flex-wrap items-center gap-x-1.5 text-[11px] text-[#6a6a6a]">
                <span className="inline-flex items-center gap-0.5 text-brand">
                  <BadgeCheck className="h-3 w-3" aria-hidden strokeWidth={2.25} />
                  Verificado
                </span>
                {showRating ? (
                  <span className="inline-flex items-center gap-0.5 tabular-nums text-[#1c1c1c]">
                    <Star className="h-2.5 w-2.5 fill-[#F59E0B] text-[#F59E0B]" aria-hidden />
                    {ratingLabel}
                  </span>
                ) : null}
              </p>
            </div>
          </div>
        ) : null}

        <dl aria-label="Detalles del servicio">
          {locationLabel ? (
            <CheckoutSummaryTableRow label="Ubicación">
              <span className="block">{locationLabel}</span>
              {rangeLabel ? (
                <span className={SD_CHECKOUT_MOBILE_TABLE_VALUE_META_CLASS}>{rangeLabel}</span>
              ) : null}
              {timezoneLabel ? (
                <span className={SD_CHECKOUT_MOBILE_TABLE_VALUE_META_CLASS}>{timezoneLabel}</span>
              ) : null}
            </CheckoutSummaryTableRow>
          ) : null}

          {deliverablesLine ? (
            <CheckoutSummaryTableRow label="Incluye">{deliverablesLine}</CheckoutSummaryTableRow>
          ) : null}

          {includePrice && priceDisplay != null && onTogglePriceDetails ? (
            <div className="border-t border-[#f5f5f5] px-4 py-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-[#6a6a6a]">Total</p>
                  <p className="mt-0.5 font-display text-xl font-semibold tabular-nums leading-none tracking-[-0.02em] text-[#1c1c1c]">
                    {priceDisplay}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onTogglePriceDetails}
                  className={`inline-flex shrink-0 items-center gap-0.5 ${SD_CHECKOUT_MOBILE_META_CLASS} text-[#1c1c1c]`}
                  aria-expanded={showPriceDetails}
                >
                  <ChevronDown
                    aria-hidden
                    className={`h-3 w-3 transition-transform ${showPriceDetails ? 'rotate-180' : ''}`}
                  />
                  Detalles
                </button>
              </div>
              {showPriceDetails ? (
                <div className={`mt-2.5 ${SD_CHECKOUT_MOBILE_META_CLASS}`} role="region" aria-label="Detalles del precio">
                  <p>Impuestos incluidos. IVA según tu país en Stripe.</p>
                  {priceSubline ? <p className="mt-0.5">{priceSubline}</p> : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </dl>

        {showFooterNotes ? (
          <footer className="border-t border-[#f5f5f5] px-4 py-2.5">
            <p className={`${SD_CHECKOUT_MOBILE_META_CLASS} leading-snug`}>
              {ESCROW_TRUST_TAGLINE}.{' '}
              <a
                href="/terms.html"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#1c1c1c] underline decoration-[#d4d4d4] underline-offset-2 hover:no-underline"
              >
                Condiciones
              </a>
            </p>
          </footer>
        ) : null}
      </article>
    </div>
  );
}
