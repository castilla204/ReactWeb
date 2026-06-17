import React from 'react';
import { Star } from 'lucide-react';

interface ServiceDetailPageHeadlineProps {
  title: string;
  /** @deprecated Usar locationLabel + rating + reviewCount */
  meta?: string | null;
  locationLabel?: string | null;
  rating?: number;
  reviewCount?: number;
  /** on-image = overlay sobre la foto principal (desktop) */
  variant?: 'default' | 'on-image';
  /** Al pulsar rating/reseñas (p. ej. abrir drawer en desktop) */
  onReviewsClick?: () => void;
  className?: string;
}

export const ServiceDetailPageHeadline: React.FC<ServiceDetailPageHeadlineProps> = ({
  title,
  meta,
  locationLabel,
  rating,
  reviewCount,
  variant = 'default',
  onReviewsClick,
  className = '',
}) => {
  const onImage = variant === 'on-image';
  const hasStructuredMeta =
    Boolean(locationLabel) || (rating != null && rating > 0) || (reviewCount != null && reviewCount > 0);
  const hasReviewsLink =
    Boolean(onReviewsClick) && (reviewCount != null && reviewCount > 0);

  const ratingLabel =
    rating != null && rating > 0
      ? Number(rating).toFixed(1).replace(/\.0$/, '')
      : null;

  return (
    <header className={className}>
      <h1
        className={
          onImage
            ? 'font-display text-xl font-semibold tracking-[-0.02em] text-white [text-shadow:0_1px_10px_rgba(0,0,0,0.55)] lg:text-[1.625rem] lg:leading-[1.25]'
            : 'sd-page-title'
        }
      >
        {title}
      </h1>
      {hasStructuredMeta ? (
        <p
          className={
            onImage
              ? 'mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm leading-5 text-white/90'
              : 'mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm leading-5 text-[#6a6a6a]'
          }
        >
          {locationLabel ? <span>{locationLabel}</span> : null}
          {locationLabel && (ratingLabel || reviewCount) ? (
            <span className={onImage ? 'text-white/50' : 'text-[#d4d4d4]'} aria-hidden>
              ·
            </span>
          ) : null}
          {hasReviewsLink ? (
            <button
              type="button"
              onClick={onReviewsClick}
              className={`inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5 border-none bg-transparent p-0 font-inherit transition-opacity hover:opacity-80 ${
                onImage ? 'text-white/90' : 'text-[#6a6a6a]'
              }`}
              aria-label={`Ver ${reviewCount} ${reviewCount === 1 ? 'reseña' : 'reseñas'}`}
            >
              {ratingLabel ? (
                <span
                  className={
                    onImage
                      ? 'inline-flex items-center gap-1 font-medium text-white'
                      : 'inline-flex items-center gap-1 font-medium text-[#222222]'
                  }
                >
                  <Star className="h-3.5 w-3.5 fill-[#F59E0B] text-[#F59E0B]" aria-hidden />
                  {ratingLabel}
                </span>
              ) : null}
              {reviewCount != null && reviewCount > 0 ? (
                <>
                  {ratingLabel ? (
                    <span className={onImage ? 'text-white/50' : 'text-[#d4d4d4]'} aria-hidden>
                      ·
                    </span>
                  ) : null}
                  <span className={onImage ? 'underline decoration-white/40 underline-offset-2' : 'underline decoration-[#d4d4d4] underline-offset-2'}>
                    {reviewCount} {reviewCount === 1 ? 'reseña' : 'reseñas'}
                  </span>
                </>
              ) : null}
            </button>
          ) : (
            <>
              {ratingLabel ? (
                <span
                  className={
                    onImage
                      ? 'inline-flex items-center gap-1 font-medium text-white'
                      : 'inline-flex items-center gap-1 font-medium text-[#222222]'
                  }
                >
                  <Star className="h-3.5 w-3.5 fill-[#F59E0B] text-[#F59E0B]" aria-hidden />
                  {ratingLabel}
                </span>
              ) : null}
              {reviewCount != null && reviewCount > 0 ? (
                <>
                  {ratingLabel ? (
                    <span className={onImage ? 'text-white/50' : 'text-[#d4d4d4]'} aria-hidden>
                      ·
                    </span>
                  ) : null}
                  <span>
                    {reviewCount} {reviewCount === 1 ? 'reseña' : 'reseñas'}
                  </span>
                </>
              ) : null}
            </>
          )}
        </p>
      ) : meta ? (
        <p
          className={
            onImage
              ? 'mt-2 text-sm leading-snug text-white/90'
              : 'mt-2 text-sm leading-snug text-[#6a6a6a]'
          }
        >
          {meta}
        </p>
      ) : null}
    </header>
  );
};
