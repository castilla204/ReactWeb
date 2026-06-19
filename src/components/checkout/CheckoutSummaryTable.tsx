import React from 'react';
import { cn } from '../../lib/utils';
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
  coordinationLabel?: string | null;
  appointmentLabel?: string | null;
  locationLabel?: string | null;
  locationHint?: string | null;
  sellerContactLabel?: string | null;
  sellerListingLabel?: string | null;
  locationRangeKm?: number;
  timezoneLabel?: string | null;
  deliverables: ServiceDeliverableType[];
  priceDisplay?: React.ReactNode;
  priceSubline?: React.ReactNode;
  showPriceDetails?: boolean;
  onTogglePriceDetails?: () => void;
  includePrice?: boolean;
  showFooterNotes?: boolean;
  /** Resumen reducido durante el wizard (fecha/ubicación). */
  compact?: boolean;
  className?: string;
}

function CheckoutSummaryTableRow({
  label,
  children,
  compact = false,
}: {
  label: string;
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={cn(SD_CHECKOUT_MOBILE_TABLE_ROW_CLASS, compact && 'py-2.5')}>
      <dt className={SD_CHECKOUT_MOBILE_TABLE_LABEL_CLASS}>{label}</dt>
      <dd className={`m-0 ${SD_CHECKOUT_MOBILE_TABLE_VALUE_CLASS}`}>{children}</dd>
    </div>
  );
}

function SummaryValue({
  children,
  hint,
}: {
  children: React.ReactNode;
  hint?: string | null;
}) {
  return (
    <>
      <span>{children}</span>
      {hint ? <span className="mt-0.5 block text-[11px] font-normal leading-snug text-[#64748b]">{hint}</span> : null}
    </>
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
  coordinationLabel,
  appointmentLabel,
  locationLabel,
  locationHint,
  sellerContactLabel,
  sellerListingLabel,
  priceDisplay,
  priceSubline,
  includePrice = true,
  showFooterNotes = false,
  compact = false,
  className = '',
}: CheckoutSummaryTableProps) {
  const headerMeta = buildHeaderMeta(categoryName, durationLabel);

  return (
    <div className={className}>
      <article
        className={cn(
          SD_CHECKOUT_MOBILE_TABLE_CLASS,
          compact && 'rounded-xl border border-[#eceef2] shadow-[0_1px_3px_rgba(15,23,42,0.05)]',
        )}
      >
        {!compact ? (
          <header className={SD_CHECKOUT_MOBILE_TABLE_HEADER_CLASS}>
            <h2 className={SD_CHECKOUT_MOBILE_TABLE_TITLE_CLASS}>{serviceName}</h2>
            {headerMeta ? <p className={SD_CHECKOUT_MOBILE_TABLE_SUBTITLE_CLASS}>{headerMeta}</p> : null}
          </header>
        ) : (
          <header className="border-b border-[#f0f0f0] px-4 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#64748b]">
              Resumen
            </p>
            <p className="mt-0.5 truncate text-[13px] font-semibold text-[#1c1c1c]">{serviceName}</p>
          </header>
        )}

        {!compact && expertName ? (
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
          {coordinationLabel ? (
            <CheckoutSummaryTableRow label="Coordinación" compact={compact}>
              {coordinationLabel}
            </CheckoutSummaryTableRow>
          ) : null}

          {appointmentLabel ? (
            <CheckoutSummaryTableRow label="Cita" compact={compact}>
              {appointmentLabel}
            </CheckoutSummaryTableRow>
          ) : null}

          {locationLabel || locationHint ? (
            <CheckoutSummaryTableRow label="Ubicación" compact={compact}>
              <SummaryValue hint={locationHint}>{locationLabel ?? '—'}</SummaryValue>
            </CheckoutSummaryTableRow>
          ) : null}

          {sellerContactLabel ? (
            <CheckoutSummaryTableRow label="Vendedor" compact={compact}>
              {sellerContactLabel}
            </CheckoutSummaryTableRow>
          ) : null}

          {sellerListingLabel ? (
            <CheckoutSummaryTableRow label="Anuncio" compact={compact}>
              <span className="break-all">{sellerListingLabel}</span>
            </CheckoutSummaryTableRow>
          ) : null}

          {includePrice && priceDisplay != null ? (
            <div className={cn('border-t border-[#f5f5f5] px-4', compact ? 'py-3' : 'py-3.5')}>
              <div className="flex items-baseline justify-between gap-4">
                <p className="text-xs text-[#6a6a6a]">Total</p>
                <p
                  className={cn(
                    'font-display font-semibold tabular-nums leading-none tracking-[-0.02em] text-[#1c1c1c]',
                    compact ? 'text-lg' : 'text-xl',
                  )}
                >
                  {priceDisplay}
                </p>
              </div>
              {priceSubline ? (
                <p className={`mt-1 ${SD_CHECKOUT_MOBILE_META_CLASS}`}>{priceSubline}</p>
              ) : (
                <p className={`mt-1 ${SD_CHECKOUT_MOBILE_META_CLASS}`}>Impuestos incluidos</p>
              )}
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
