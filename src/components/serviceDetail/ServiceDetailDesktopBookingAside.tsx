import React from 'react';
import { SD_DESKTOP_ASIDE_MAX_H_CLASS } from '../../constants/homepageTypography';
import { formatRatingDisplay } from '../../utils/reviewFormat';
import { cn } from '../../lib/utils';
import { ServiceDetailReserveNote } from './ServiceDetailReserveNote';

export interface ServiceDetailDesktopBookingAsideProps {
  priceDisplay: React.ReactNode;
  priceWasConverted?: boolean;
  priceSourceFormatted?: string;
  isOnVacation?: boolean;
  isAuthenticated: boolean;
  averageRating?: number;
  reviewCount?: number;
  onReviewsClick?: () => void;
  onReserve: () => void;
  onLogin: () => void;
}

function AsideSection({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('border-t border-line px-5 py-5 first:border-t-0', className)}>
      <p className="text-caption font-medium text-ink-muted">{label}</p>
      <div className="mt-1.5">{children}</div>
    </section>
  );
}

/** Panel de reserva desktop — precio, señal mínima y CTA. */
export function ServiceDetailDesktopBookingAside({
  priceDisplay,
  priceWasConverted = false,
  priceSourceFormatted,
  isOnVacation = false,
  isAuthenticated,
  averageRating,
  reviewCount = 0,
  onReviewsClick,
  onReserve,
  onLogin,
}: ServiceDetailDesktopBookingAsideProps) {
  const hasReviews = reviewCount > 0 && averageRating != null && averageRating > 0;
  const reserveDisabled = isOnVacation;
  const vacationHintId = 'sd-aside-vacation-hint';

  return (
    <article
      className={`sd-aside-card sd-service-booking-aside flex flex-col overflow-hidden ${SD_DESKTOP_ASIDE_MAX_H_CLASS}`}
    >
      <div className="border-b border-line bg-ink-strong px-5 py-5">
        <p className="text-caption font-medium text-ink-soft">Precio</p>
        <p className="sd-aside-price mt-1 text-white">{priceDisplay}</p>
        <p className="mt-1 text-xs leading-snug text-ink-soft">Impuestos incluidos</p>
        {priceWasConverted && priceSourceFormatted ? (
          <p className="mt-1 text-kicker leading-snug text-ink-soft">{priceSourceFormatted}</p>
        ) : null}
        {hasReviews && onReviewsClick ? (
          <button
            type="button"
            onClick={onReviewsClick}
            aria-label={`Ver ${reviewCount} reseñas, desplazar a la sección inferior`}
            className="mt-2.5 text-left text-caption font-medium text-line underline decoration-ink-muted underline-offset-[3px] transition-colors hover:text-white hover:decoration-white/50"
          >
            {formatRatingDisplay(averageRating!)} · {reviewCount}{' '}
            {reviewCount === 1 ? 'reseña' : 'reseñas'}
          </button>
        ) : null}
      </div>

      {isOnVacation ? (
        <AsideSection label="Disponibilidad">
          <p id={vacationHintId} className="text-sm font-medium leading-relaxed text-warning">
            El experto está de vacaciones. Vuelve más adelante para reservar.
          </p>
        </AsideSection>
      ) : (
        <AsideSection label="Reserva">
          <ServiceDetailReserveNote variant="aside" />
        </AsideSection>
      )}

      <footer className="mt-auto space-y-3 border-t border-line px-5 py-5">
        {isAuthenticated ? (
          <button
            type="button"
            onClick={onReserve}
            disabled={reserveDisabled}
            aria-describedby={reserveDisabled ? vacationHintId : undefined}
            className="sd-aside-cta sd-cta-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {reserveDisabled ? 'No disponible' : 'Reservar'}
          </button>
        ) : (
          <button type="button" onClick={onLogin} className="sd-aside-cta sd-cta-dark">
            Inicia sesión para reservar
          </button>
        )}
      </footer>
    </article>
  );
}
