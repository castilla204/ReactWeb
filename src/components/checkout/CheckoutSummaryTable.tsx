import React from 'react';
import { cn } from '../../lib/utils';
import {
  SD_CHECKOUT_MOBILE_TABLE_CLASS,
  SD_CHECKOUT_MOBILE_PAYMENT_CARD_CLASS,
  SD_CHECKOUT_MOBILE_PAYMENT_CARD_HEADER_CLASS,
  SD_CHECKOUT_MOBILE_PAYMENT_CARD_TITLE_CLASS,
  SD_CHECKOUT_MOBILE_PAYMENT_CARD_SERVICE_CLASS,
  SD_CHECKOUT_MOBILE_PAYMENT_CARD_META_CLASS,
  SD_CHECKOUT_MOBILE_TABLE_ROW_CLASS,
  SD_CHECKOUT_MOBILE_TABLE_LABEL_CLASS,
  SD_CHECKOUT_MOBILE_TABLE_VALUE_CLASS,
  SD_CHECKOUT_MOBILE_PAYMENT_ROW_CLASS,
  SD_CHECKOUT_MOBILE_PAYMENT_ROW_LABEL_CLASS,
  SD_CHECKOUT_MOBILE_PAYMENT_ROW_VALUE_CLASS,
  SD_CHECKOUT_MOBILE_PAYMENT_SECTION_TITLE_CLASS,
  SD_CHECKOUT_MOBILE_PAYMENT_GROUP_CLASS,
  SD_CHECKOUT_MOBILE_PAYMENT_TRUST_BLOCK_CLASS,
  SD_CHECKOUT_MOBILE_PAYMENT_FOOTER_CLASS,
  SD_CHECKOUT_SUMMARY_HEADER_CLASS,
  SD_CHECKOUT_SUMMARY_SECTION_TITLE_CLASS,
  SD_CHECKOUT_SUMMARY_GROUP_CLASS,
  SD_CHECKOUT_SUMMARY_ROW_CLASS,
  SD_CHECKOUT_SUMMARY_ROW_LABEL_CLASS,
  SD_CHECKOUT_SUMMARY_ROW_VALUE_CLASS,
  SD_CHECKOUT_SUMMARY_BLOCK_CLASS,
} from '../../constants/homepageTypography';
import { CheckoutReserveHint } from './CheckoutReserveGuide';
import { CheckoutExpertHero } from './CheckoutExpertHero';
import { CheckoutPaymentExpertCard } from './CheckoutPaymentExpertCard';
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
  expertCompletedSearches?: number;
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
  /**
   * Dónde se sitúa la ficha del experto (foto+nombre+valoración). 'top' (por
   * defecto) es la cabecera de siempre; 'bottom' la baja a una firma discreta
   * tras el detalle del servicio — para el resumen final, donde lo primero que
   * hay que revisar es la reserva en sí, no la cara del experto.
   */
  expertHeroPosition?: 'top' | 'bottom';
  /** Muestra un bloque "Qué incluye" con las portadas de entregables (solo en revisar-y-pagar). */
  showDeliverables?: boolean;
  /** Nº de columnas de las portadas de "Qué incluye" en pantallas anchas (desktop: 2, apiladas por defecto). */
  deliverablesColumns?: 1 | 2;
  /** Zebra muy sutil en las filas del detalle (paso final de pago). */
  stripedRows?: boolean;
  className?: string;
}

function CheckoutSummaryTableRow({
  label,
  children,
  compact = false,
  firstInGroup = false,
  striped = false,
  payment = false,
  noTopBorder = false,
}: {
  label: string;
  children: React.ReactNode;
  compact?: boolean;
  firstInGroup?: boolean;
  striped?: boolean;
  payment?: boolean;
  noTopBorder?: boolean;
}) {
  if (payment) {
    return (
      <div
        className={cn(
          SD_CHECKOUT_MOBILE_PAYMENT_ROW_CLASS,
          firstInGroup && 'border-t-0',
          noTopBorder && 'border-t-0',
          striped && 'bg-surface-tinted/60',
        )}
      >
        <dt className={SD_CHECKOUT_MOBILE_PAYMENT_ROW_LABEL_CLASS}>{label}</dt>
        <dd className={cn('m-0', SD_CHECKOUT_MOBILE_PAYMENT_ROW_VALUE_CLASS)}>{children}</dd>
      </div>
    );
  }

  return (
    <div
      className={cn(
        compact ? SD_CHECKOUT_MOBILE_TABLE_ROW_CLASS : SD_CHECKOUT_SUMMARY_ROW_CLASS,
        compact && 'py-1.5',
        firstInGroup && 'border-t-0',
        noTopBorder && 'border-t-0',
        striped && 'bg-surface-tinted',
      )}
    >
      <dt className={cn(compact ? SD_CHECKOUT_MOBILE_TABLE_LABEL_CLASS : SD_CHECKOUT_SUMMARY_ROW_LABEL_CLASS)}>
        {label}
      </dt>
      <dd className={cn('m-0', compact ? SD_CHECKOUT_MOBILE_TABLE_VALUE_CLASS : SD_CHECKOUT_SUMMARY_ROW_VALUE_CLASS)}>
        {children}
      </dd>
    </div>
  );
}

/** Micro-cabecera de grupo dentro del resumen — junta filas relacionadas (chunking ≤4). */
function CheckoutSummaryGroupLabel({
  children,
  compact = false,
  payment = false,
}: {
  children: React.ReactNode;
  compact?: boolean;
  payment?: boolean;
}) {
  return (
    <div
      className={cn(
        payment
          ? SD_CHECKOUT_MOBILE_PAYMENT_GROUP_CLASS
          : cn(compact ? 'border-t border-line-soft px-4 pb-1 pt-4' : SD_CHECKOUT_SUMMARY_GROUP_CLASS),
      )}
    >
      <p
        className={cn(
          payment || compact
            ? SD_CHECKOUT_MOBILE_PAYMENT_SECTION_TITLE_CLASS
            : SD_CHECKOUT_SUMMARY_SECTION_TITLE_CLASS,
        )}
      >
        {children}
      </p>
    </div>
  );
}

function SummaryValue({
  children,
  hint,
  payment = false,
}: {
  children: React.ReactNode;
  hint?: string | null;
  payment?: boolean;
}) {
  return (
    <>
      <span>{children}</span>
      {hint ? (
        <span
          className={cn(
            'mt-0.5 block font-normal leading-snug text-ink-muted',
            payment ? 'text-meta' : 'text-caption',
          )}
        >
          {hint}
        </span>
      ) : null}
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
  expertCompletedSearches,
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
  expertHeroPosition = 'top',
  deliverables = [],
  showDeliverables = false,
  deliverablesColumns = 1,
  stripedRows = false,
  className = '',
}: CheckoutSummaryTableProps) {
  const payment = brandAccent && !compact;
  const hasLogisticsGroup = !compact && Boolean(coordinationLabel || appointmentLabel || locationLabel || locationHint);
  const coordinationIsFirst = hasLogisticsGroup && Boolean(coordinationLabel);
  const appointmentIsFirst = hasLogisticsGroup && !coordinationLabel && Boolean(appointmentLabel);
  const locationIsFirst =
    hasLogisticsGroup && !coordinationLabel && !appointmentLabel && Boolean(locationLabel || locationHint);
  const hasSellerGroup = !compact && Boolean(sellerContactLabel);

  let rowIndex = 0;
  const nextRowStriped = () => stripedRows && rowIndex++ % 2 === 1;
  let isFirstDataRow = true;
  const consumeFirstRow = () => {
    const current = isFirstDataRow;
    isFirstDataRow = false;
    return current;
  };

  const rowProps = (extra?: { firstInGroup?: boolean }) => ({
    compact,
    payment,
    striped: payment ? false : nextRowStriped(),
    noTopBorder: payment && showServiceDetailRows && consumeFirstRow(),
    ...extra,
  });

  const paymentTrustExpert =
    payment && !compact && expertName && expertHeroPosition === 'bottom';
  const paymentTrustDeliverables = payment && showDeliverables && deliverables.length > 0;
  const paymentTrustBlock = paymentTrustExpert || paymentTrustDeliverables;
  const paymentServiceMeta = [categoryName, durationLabel].filter(Boolean).join(' · ');
  const showServiceDetailRows =
    !compact &&
    ((!hideExpertHeader && serviceName) ||
      (!(payment && hideExpertHeader) && categoryName) ||
      (!(payment && hideExpertHeader) && durationLabel));

  return (
    <div className={className}>
      <article
        className={cn(
          payment ? SD_CHECKOUT_MOBILE_PAYMENT_CARD_CLASS : SD_CHECKOUT_MOBILE_TABLE_CLASS,
          payment && 'checkout-payment-card-enter',
          brandAccent && !payment && 'relative overflow-hidden',
          compact && 'shadow-[0_1px_3px_rgba(15,23,42,0.05)]',
        )}
      >
        {!compact ? null : (
          <header className="border-b border-line-soft px-4 py-2.5">
            <p className={SD_CHECKOUT_SUMMARY_SECTION_TITLE_CLASS}>Resumen</p>
            <p className="mt-0.5 truncate text-meta font-semibold text-ink-strong">{serviceName}</p>
          </header>
        )}

        {!compact && !hideExpertHeader && expertName && expertHeroPosition === 'top' ? (
          <CheckoutExpertHero
            expertName={expertName}
            expertPicture={expertPicture}
            rating={expertRating}
            reviewCount={expertReviewCount}
            className="px-5 py-4"
          />
        ) : null}

        {!compact && hideExpertHeader ? (
          payment ? (
            <div className={SD_CHECKOUT_MOBILE_PAYMENT_CARD_HEADER_CLASS}>
              <p className={SD_CHECKOUT_MOBILE_PAYMENT_CARD_TITLE_CLASS}>Tu reserva</p>
              <p className={SD_CHECKOUT_MOBILE_PAYMENT_CARD_SERVICE_CLASS}>{serviceName}</p>
              {paymentServiceMeta ? (
                <p className={SD_CHECKOUT_MOBILE_PAYMENT_CARD_META_CLASS}>{paymentServiceMeta}</p>
              ) : null}
            </div>
          ) : (
            <div className={SD_CHECKOUT_SUMMARY_HEADER_CLASS}>
              <h2 className={SD_CHECKOUT_SUMMARY_SECTION_TITLE_CLASS}>Detalles del servicio</h2>
              <p className="mt-1 text-subtitle font-semibold text-ink-strong [text-wrap:balance]">
                {serviceName}
              </p>
            </div>
          )
        ) : null}

        <section className={cn(payment && !hideExpertHeader && 'pt-4')}>
          {showServiceDetailRows ? (
          <dl aria-label="Detalles del servicio">
            {!compact && !hideExpertHeader && serviceName ? (
              <CheckoutSummaryTableRow label="Servicio" {...rowProps()}>
                {serviceName}
              </CheckoutSummaryTableRow>
            ) : null}

            {categoryName && !(payment && hideExpertHeader) ? (
              <CheckoutSummaryTableRow label="Categoría" {...rowProps()}>
                {categoryName}
              </CheckoutSummaryTableRow>
            ) : null}

            {durationLabel && !(payment && hideExpertHeader) ? (
              <CheckoutSummaryTableRow label="Duración" {...rowProps()}>
                {durationLabel}
              </CheckoutSummaryTableRow>
            ) : null}
          </dl>
          ) : null}

          {hasLogisticsGroup ? (
            <>
              <CheckoutSummaryGroupLabel compact={compact} payment={payment}>
                Cita y ubicación
              </CheckoutSummaryGroupLabel>
              <dl aria-label="Cita y ubicación">
                {coordinationLabel ? (
                  <CheckoutSummaryTableRow label="Coordinación" {...rowProps({ firstInGroup: coordinationIsFirst })}>
                    {coordinationLabel}
                  </CheckoutSummaryTableRow>
                ) : null}

                {appointmentLabel ? (
                  <CheckoutSummaryTableRow label="Cita" {...rowProps({ firstInGroup: appointmentIsFirst })}>
                    {appointmentLabel}
                  </CheckoutSummaryTableRow>
                ) : null}

                {locationLabel || locationHint ? (
                  <CheckoutSummaryTableRow label="Ubicación" {...rowProps({ firstInGroup: locationIsFirst })}>
                    <SummaryValue hint={locationHint} payment={payment}>
                      {locationLabel ?? '—'}
                    </SummaryValue>
                  </CheckoutSummaryTableRow>
                ) : null}
              </dl>
            </>
          ) : null}

          {hasSellerGroup ? (
            <>
              <CheckoutSummaryGroupLabel compact={compact} payment={payment}>
                Contacto del vendedor
              </CheckoutSummaryGroupLabel>
              <dl aria-label="Contacto del vendedor">
                {sellerContactLabel ? (
                  <CheckoutSummaryTableRow label="Vendedor" {...rowProps({ firstInGroup: hasSellerGroup })}>
                    {sellerContactLabel}
                  </CheckoutSummaryTableRow>
                ) : null}

                {sellerListingLabel ? (
                  <CheckoutSummaryTableRow label="Anuncio" {...rowProps()}>
                    <span className="break-all">{sellerListingLabel}</span>
                  </CheckoutSummaryTableRow>
                ) : null}
              </dl>
            </>
          ) : null}

          {includePrice && priceDisplay != null ? (
            <div
              className={cn(
                payment ? 'border-t border-line-soft px-5 py-4' : compact ? 'border-t border-line-soft px-4 py-2.5' : SD_CHECKOUT_SUMMARY_BLOCK_CLASS,
              )}
            >
              <div className="flex items-baseline justify-between gap-4">
                <p className="text-meta font-medium text-ink-muted">Total a pagar</p>
                <p
                  className={cn(
                    'font-display font-semibold tabular-nums leading-none tracking-[-0.02em] text-ink-strong',
                    compact ? 'text-xl' : 'text-2xl',
                  )}
                >
                  {priceDisplay}
                </p>
              </div>
              {priceSubline ? (
                <p className="mt-1 text-caption text-ink-muted">{priceSubline}</p>
              ) : (
                <p className="mt-1 text-caption text-ink-muted">Impuestos incluidos</p>
              )}
            </div>
          ) : null}
        </section>

        {paymentTrustBlock ? (
          <div className={SD_CHECKOUT_MOBILE_PAYMENT_TRUST_BLOCK_CLASS}>
            {paymentTrustExpert ? (
              <div>
                <p className={cn('mb-2', SD_CHECKOUT_MOBILE_PAYMENT_SECTION_TITLE_CLASS)}>
                  Tu experto
                </p>
                <CheckoutPaymentExpertCard
                  expertName={expertName!}
                  expertPicture={expertPicture}
                  rating={expertRating}
                  reviewCount={expertReviewCount}
                  completedSearches={expertCompletedSearches}
                  embedded
                />
              </div>
            ) : null}

            {paymentTrustDeliverables ? (
              <div>
                <p className={cn('mb-2', SD_CHECKOUT_MOBILE_PAYMENT_SECTION_TITLE_CLASS)}>
                  Incluido en tu reserva
                </p>
                <ServiceDetailDeliverablesGuide
                  items={deliverables}
                  variant="inline"
                  presentation="checkout"
                  showHeading={false}
                  coverColumns={deliverablesColumns}
                  embedded
                />
              </div>
            ) : null}
          </div>
        ) : null}

        {!payment && showDeliverables && deliverables.length > 0 ? (
          <div className={cn(compact ? 'border-t border-line-soft px-4 py-3' : SD_CHECKOUT_SUMMARY_BLOCK_CLASS)}>
            <p className={cn('mb-3', SD_CHECKOUT_SUMMARY_SECTION_TITLE_CLASS)}>
              Qué incluye
            </p>
            <ServiceDetailDeliverablesGuide
              items={deliverables}
              variant="inline"
              presentation="cover"
              showHeading={false}
              coverColumns={deliverablesColumns}
            />
          </div>
        ) : null}

        {!payment && !compact && !hideExpertHeader && expertName && expertHeroPosition === 'bottom' ? (
          <div className={SD_CHECKOUT_SUMMARY_BLOCK_CLASS}>
            <p className={cn('mb-3', SD_CHECKOUT_SUMMARY_SECTION_TITLE_CLASS)}>
              Experto asignado
            </p>
            <CheckoutExpertHero
              expertName={expertName}
              expertPicture={expertPicture}
              rating={expertRating}
              reviewCount={expertReviewCount}
              completedSearches={expertCompletedSearches}
              size="sm"
            />
          </div>
        ) : null}

        {showFooterNotes ? (
          <footer className={cn(payment ? SD_CHECKOUT_MOBILE_PAYMENT_FOOTER_CLASS : cn(SD_CHECKOUT_SUMMARY_BLOCK_CLASS, 'space-y-2.5 py-3.5'))}>
            <CheckoutReserveHint
              coordinationMode={coordinationMode}
              compact={payment}
              omitLeadBullet={payment}
            />
            <a
              href="/legal/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-caption inline-flex min-h-11 items-center py-2 underline decoration-line underline-offset-2 hover:no-underline text-ink-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            >
              Condiciones de contratación
            </a>
          </footer>
        ) : null}
      </article>
    </div>
  );
}
