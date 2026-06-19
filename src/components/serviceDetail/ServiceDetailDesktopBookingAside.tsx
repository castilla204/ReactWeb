import React from 'react';
import { SD_DESKTOP_ASIDE_MAX_H_CLASS } from '../../constants/homepageTypography';
import { ServiceDetailReviewStars } from './ServiceDetailReviewStars';
import { formatRatingDisplay } from '../../utils/reviewFormat';
import type { ServiceReviewItem } from './ServiceDetailReviewsSection';
import { cn } from '../../lib/utils';

export interface ServiceDetailDesktopBookingAsideProps {
  expertName: string;
  priceDisplay: React.ReactNode;
  priceWasConverted?: boolean;
  priceSourceFormatted?: string;
  isOnVacation?: boolean;
  isAuthenticated: boolean;
  averageRating?: number;
  reviewCount?: number;
  highlightReview?: ServiceReviewItem | null;
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
    <section className={cn('border-t border-[#f0f0f0] px-5 py-4 first:border-t-0', className)}>
      <p className="text-[12px] font-medium text-[#9ca3af]">{label}</p>
      <div className="mt-1.5">{children}</div>
    </section>
  );
}

/** Panel de reserva desktop — precio, meta, reseñas y CTA. */
export function ServiceDetailDesktopBookingAside({
  expertName,
  priceDisplay,
  priceWasConverted = false,
  priceSourceFormatted,
  isOnVacation = false,
  isAuthenticated,
  averageRating,
  reviewCount = 0,
  highlightReview,
  onReviewsClick,
  onReserve,
  onLogin,
}: ServiceDetailDesktopBookingAsideProps) {
  const hasReviews = reviewCount > 0 && averageRating != null && averageRating > 0;
  const reviewPreviewText = (
    highlightReview?.description ||
    highlightReview?.comment ||
    ''
  ).trim();

  return (
    <article
      className={`sd-aside-card sd-service-booking-aside flex flex-col overflow-hidden ${SD_DESKTOP_ASIDE_MAX_H_CLASS}`}
    >
      <AsideSection label="Precio" className="border-t-0 pt-5">
        <p className="sd-aside-price">{priceDisplay}</p>
        <p className="mt-1 text-xs leading-snug text-[#717171]">Impuestos incluidos</p>
        {priceWasConverted && priceSourceFormatted ? (
          <p className="mt-1 text-[11px] leading-snug text-[#9ca3af]">{priceSourceFormatted}</p>
        ) : null}
      </AsideSection>

      <AsideSection label="Experto">
        <p className="text-[15px] font-semibold leading-snug tracking-[-0.01em] text-[#1c1c1c]">
          {expertName}
        </p>
        {isOnVacation ? (
          <p className="mt-2 text-sm font-medium text-[#b45309]">No disponible temporalmente</p>
        ) : (
          <p className="mt-2 text-[13px] leading-relaxed text-[#717171]">
            En la siguiente página eliges fecha, hora y lugar de la inspección.
          </p>
        )}
      </AsideSection>

      <AsideSection label="Reseñas">
        {hasReviews ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <span className="font-display text-xl font-semibold tabular-nums leading-none tracking-[-0.02em] text-[#1c1c1c]">
                  {formatRatingDisplay(averageRating!)}
                </span>
                <ServiceDetailReviewStars rating={averageRating!} size="md" />
                <span className="text-sm text-[#717171]">
                  · {reviewCount} {reviewCount === 1 ? 'reseña' : 'reseñas'}
                </span>
              </div>
              {onReviewsClick ? (
                <button
                  type="button"
                  onClick={onReviewsClick}
                  className="shrink-0 text-[13px] font-semibold text-[#1c1c1c] underline decoration-[#d4d4d4] underline-offset-[3px] transition-colors hover:text-brand hover:decoration-brand/40"
                >
                  Ver reseñas
                </button>
              ) : null}
            </div>

            {reviewPreviewText ? (
              <button
                type="button"
                onClick={onReviewsClick}
                className="block w-full text-left text-[13px] leading-relaxed text-[#6a6a6a] transition-colors hover:text-[#484848]"
              >
                <span className="line-clamp-2">&ldquo;{reviewPreviewText}&rdquo;</span>
              </button>
            ) : null}
          </div>
        ) : (
          <p className="text-sm leading-relaxed text-[#9ca3af]">
            Aún no hay valoraciones de clientes.
          </p>
        )}
      </AsideSection>

      <footer className="mt-auto border-t border-[#f0f0f0] px-5 py-4">
        {isAuthenticated ? (
          <button type="button" onClick={onReserve} className="sd-aside-cta">
            Reservar
          </button>
        ) : (
          <button type="button" onClick={onLogin} className="sd-aside-cta">
            Inicia sesión para continuar
          </button>
        )}
      </footer>
    </article>
  );
}
