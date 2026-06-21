import React from 'react';
import { cn } from '../../lib/utils';
import {
  SD_CHECKOUT_MOBILE_TABLE_CLASS,
  SD_CHECKOUT_MOBILE_TABLE_ROW_CLASS,
  SD_CHECKOUT_MOBILE_TABLE_LABEL_CLASS,
  SD_CHECKOUT_MOBILE_TABLE_VALUE_CLASS,
  SD_CHECKOUT_MOBILE_META_CLASS,
} from '../../constants/homepageTypography';
import { CheckoutReserveHint } from './CheckoutReserveGuide';
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
  /** Línea y lavado ámbar→azul (paso pago) */
  brandAccent?: boolean;
  /** Resumen embebido en tarjeta desktop — sin línea superior duplicada */
  brandAccentEmbedded?: boolean;
  /** Oculta el header del experto (cuando ya se muestra en el panel de pago) */
  hideExpertHeader?: boolean;
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
    <div className={cn(SD_CHECKOUT_MOBILE_TABLE_ROW_CLASS, compact ? 'py-1.5' : 'px-6 py-3.5')}>
      <dt className={cn(SD_CHECKOUT_MOBILE_TABLE_LABEL_CLASS, !compact && 'text-[13px] w-[28%]')}>{label}</dt>
      <dd className={cn('m-0', SD_CHECKOUT_MOBILE_TABLE_VALUE_CLASS, !compact && 'text-[14px]')}>{children}</dd>
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

/** Resumen minimalista de checkout — móvil y desktop. */
export function CheckoutSummaryTable({
  serviceName,
  durationLabel,
  categoryName,
  expertName,
  expertPicture,
  expertRating,
  expertReviewCount,
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
  brandAccent = false,
  brandAccentEmbedded = false,
  hideExpertHeader = false,
  className = '',
}: CheckoutSummaryTableProps) {
  return (
    <div className={className}>
      <article
        className={cn(
          SD_CHECKOUT_MOBILE_TABLE_CLASS,
          brandAccent && 'relative overflow-hidden',
          compact && 'rounded-xl border border-[#eceef2] shadow-[0_1px_3px_rgba(15,23,42,0.05)]',
        )}
      >
        {!compact ? null : (
          <header className="border-b border-[#f0f0f0] px-4 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#64748b]">
              Resumen
            </p>
            <p className="mt-0.5 truncate text-[13px] font-semibold text-[#1c1c1c]">{serviceName}</p>
          </header>
        )}

        {!compact && !hideExpertHeader && expertName ? (
          <div className="flex items-center gap-3.5 bg-gradient-to-br from-[hsl(210_86%_53%)] via-[hsl(210_84%_45%)] to-[hsl(210_82%_38%)] px-5 py-4">
            {expertPicture ? (
              <img
                src={expertPicture}
                alt={expertName}
                className="h-11 w-11 shrink-0 rounded-full bg-[#e2e8f0] object-cover ring-2 ring-white/45 shadow-[0_2px_8px_rgba(0,0,0,0.18)]"
              />
            ) : (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15 ring-2 ring-white/35">
                <span className="text-sm font-bold text-white">{expertName.charAt(0) || 'E'}</span>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold text-white">{expertName}</p>
              <span className="mt-0.5 inline-block text-[11px] font-medium text-white/85">Experto verificado</span>
            </div>
          </div>
        ) : null}

        {!compact && hideExpertHeader ? (
          <div className="px-6 py-5 border-b border-[#f5f5f5]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#64748b]">Detalles del servicio</p>
            <p className="mt-1 text-[16px] font-semibold tracking-[-0.01em] text-[#1c1c1c]">{serviceName}</p>
            <p className="mt-0.5 text-[13px] text-[#6a6a6a]">{durationLabel}</p>
          </div>
        ) : null}

        <dl aria-label="Detalles del servicio">
          {categoryName ? (
            <CheckoutSummaryTableRow label="Categoría" compact={compact} className="py-2">
              {categoryName}
            </CheckoutSummaryTableRow>
          ) : null}

          {durationLabel ? (
            <CheckoutSummaryTableRow label="Duración" compact={compact}>
              {durationLabel}
            </CheckoutSummaryTableRow>
          ) : null}

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
            <div className={cn('border-t border-[#f5f5f5] px-3.5', compact ? 'py-2.5' : 'py-3')}>
              <div className="flex items-baseline justify-between gap-4">
                <p className="text-xs text-[#6a6a6a] font-medium">Total a pagar</p>
                <p
                  className={cn(
                    'font-display font-semibold tabular-nums leading-none tracking-[-0.02em] text-[#1c1c1c]',
                    compact ? 'text-xl' : 'text-2xl',
                  )}
                >
                  {priceDisplay}
                </p>
              </div>
              {priceSubline ? (
                <p className="mt-1 text-xs text-[#64748b]">{priceSubline}</p>
              ) : (
                <p className="mt-1 text-xs text-[#64748b]">Impuestos incluidos</p>
              )}
            </div>
          ) : null}
        </dl>

        {showFooterNotes ? (
          <footer className="space-y-2.5 border-t border-[#f5f5f5] px-3.5 py-2.5">
            <CheckoutReserveHint />
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
