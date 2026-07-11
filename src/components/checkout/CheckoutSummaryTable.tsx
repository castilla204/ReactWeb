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
import { CheckoutExpertHero } from './CheckoutExpertHero';
import {
  ServiceDetailDeliverablesGuide,
  type ServiceDeliverableType,
} from '../serviceDetail/ServiceDetailDeliverablesGuide';

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
  /** Modo de coordinación — adapta la nota de cobro del pie (self vs vendedor). */
  coordinationMode?: 'self' | 'seller';
  /** Resumen reducido durante el wizard (fecha/ubicación). */
  compact?: boolean;
  /** Línea y lavado ámbar→azul (paso pago) */
  brandAccent?: boolean;
  /** Oculta el header del experto (cuando ya se muestra en el panel de pago) */
  hideExpertHeader?: boolean;
  /** Muestra un bloque "Qué incluye" con las portadas de entregables (solo en revisar-y-pagar). */
  showDeliverables?: boolean;
  /** Nº de columnas de las portadas de "Qué incluye" en pantallas anchas (desktop: 2, apiladas por defecto). */
  deliverablesColumns?: 1 | 2;
  className?: string;
}

function CheckoutSummaryTableRow({
  label,
  children,
  compact = false,
  firstInGroup = false,
}: {
  label: string;
  children: React.ReactNode;
  compact?: boolean;
  /** Primera fila tras una etiqueta de grupo: sin línea propia, la etiqueta ya separa. */
  firstInGroup?: boolean;
}) {
  return (
    <div
      className={cn(
        SD_CHECKOUT_MOBILE_TABLE_ROW_CLASS,
        compact ? 'py-1.5' : 'px-6 py-3.5',
        firstInGroup && 'border-t-0',
      )}
    >
      <dt className={cn(SD_CHECKOUT_MOBILE_TABLE_LABEL_CLASS, !compact && 'text-[13px] w-[28%]')}>{label}</dt>
      <dd className={cn('m-0', SD_CHECKOUT_MOBILE_TABLE_VALUE_CLASS, !compact && 'text-[14px]')}>{children}</dd>
    </div>
  );
}

/** Micro-cabecera de grupo dentro del resumen — junta filas relacionadas (chunking ≤4). */
function CheckoutSummaryGroupLabel({ children, compact = false }: { children: React.ReactNode; compact?: boolean }) {
  return (
    <div className={cn('border-t border-[#f5f5f5] pb-1 pt-4', compact ? 'px-4' : 'px-6')}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9ca3af]">{children}</p>
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
  coordinationMode = 'self',
  compact = false,
  brandAccent = false,
  hideExpertHeader = false,
  deliverables = [],
  showDeliverables = false,
  deliverablesColumns = 1,
  className = '',
}: CheckoutSummaryTableProps) {
  // Chunking del resumen (no-compacto): agrupa las filas relacionadas bajo una
  // micro-cabecera en vez de una lista plana de 9-10 filas sin jerarquía.
  const hasLogisticsGroup = !compact && Boolean(coordinationLabel || appointmentLabel || locationLabel || locationHint);
  const coordinationIsFirst = hasLogisticsGroup && Boolean(coordinationLabel);
  const appointmentIsFirst = hasLogisticsGroup && !coordinationLabel && Boolean(appointmentLabel);
  const locationIsFirst =
    hasLogisticsGroup && !coordinationLabel && !appointmentLabel && Boolean(locationLabel || locationHint);
  const hasSellerGroup = !compact && Boolean(sellerContactLabel);

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
          <CheckoutExpertHero
            expertName={expertName}
            expertPicture={expertPicture}
            rating={expertRating}
            reviewCount={expertReviewCount}
            className="px-6 py-4"
          />
        ) : null}

        {!compact && hideExpertHeader ? (
          <div className="px-6 py-5 border-b border-[#f5f5f5]">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#64748b]">Detalles del servicio</h2>
            {/* La duración ya sale en su fila («Duración») — aquí duplicaba el dato. */}
            <p className="mt-1 text-[16px] font-semibold tracking-[-0.01em] text-[#1c1c1c]">{serviceName}</p>
          </div>
        ) : null}

        <dl aria-label="Detalles del servicio">
          {!compact && !hideExpertHeader && serviceName ? (
            <CheckoutSummaryTableRow label="Servicio" compact={compact}>
              {serviceName}
            </CheckoutSummaryTableRow>
          ) : null}

          {categoryName ? (
            <CheckoutSummaryTableRow label="Categoría" compact={compact}>
              {categoryName}
            </CheckoutSummaryTableRow>
          ) : null}

          {durationLabel ? (
            <CheckoutSummaryTableRow label="Duración" compact={compact}>
              {durationLabel}
            </CheckoutSummaryTableRow>
          ) : null}

          {hasLogisticsGroup ? (
            <CheckoutSummaryGroupLabel compact={compact}>Cita y ubicación</CheckoutSummaryGroupLabel>
          ) : null}

          {coordinationLabel ? (
            <CheckoutSummaryTableRow label="Coordinación" compact={compact} firstInGroup={coordinationIsFirst}>
              {coordinationLabel}
            </CheckoutSummaryTableRow>
          ) : null}

          {appointmentLabel ? (
            <CheckoutSummaryTableRow label="Cita" compact={compact} firstInGroup={appointmentIsFirst}>
              {appointmentLabel}
            </CheckoutSummaryTableRow>
          ) : null}

          {locationLabel || locationHint ? (
            <CheckoutSummaryTableRow label="Ubicación" compact={compact} firstInGroup={locationIsFirst}>
              <SummaryValue hint={locationHint}>{locationLabel ?? '—'}</SummaryValue>
            </CheckoutSummaryTableRow>
          ) : null}

          {hasSellerGroup ? (
            <CheckoutSummaryGroupLabel compact={compact}>Contacto del vendedor</CheckoutSummaryGroupLabel>
          ) : null}

          {sellerContactLabel ? (
            <CheckoutSummaryTableRow label="Vendedor" compact={compact} firstInGroup={hasSellerGroup}>
              {sellerContactLabel}
            </CheckoutSummaryTableRow>
          ) : null}

          {sellerListingLabel ? (
            <CheckoutSummaryTableRow label="Anuncio" compact={compact}>
              <span className="break-all">{sellerListingLabel}</span>
            </CheckoutSummaryTableRow>
          ) : null}

          {includePrice && priceDisplay != null ? (
            <div className={cn('border-t border-[#f5f5f5]', compact ? 'px-4 py-2.5' : 'px-6 py-3')}>
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

        {showDeliverables && deliverables.length > 0 ? (
          <div className={cn('border-t border-[#f5f5f5]', compact ? 'px-4 py-3' : 'px-6 py-4')}>
            <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#64748b]">
              Qué incluye
            </h2>
            <ServiceDetailDeliverablesGuide
              items={deliverables}
              variant="inline"
              presentation="cover"
              showHeading={false}
              coverColumns={deliverablesColumns}
            />
          </div>
        ) : null}

        {showFooterNotes ? (
          <footer className="space-y-2.5 border-t border-[#f5f5f5] px-6 py-3.5">
            <CheckoutReserveHint coordinationMode={coordinationMode} />
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
