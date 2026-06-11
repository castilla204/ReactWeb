import React from 'react';
import { Star } from 'lucide-react';

interface ServiceDetailPageHeadlineProps {
  title: string;
  /** @deprecated Usar locationLabel + rating + reviewCount */
  meta?: string | null;
  locationLabel?: string | null;
  rating?: number;
  reviewCount?: number;
  className?: string;
}

export const ServiceDetailPageHeadline: React.FC<ServiceDetailPageHeadlineProps> = ({
  title,
  meta,
  locationLabel,
  rating,
  reviewCount,
  className = '',
}) => {
  const hasStructuredMeta =
    Boolean(locationLabel) || (rating != null && rating > 0) || (reviewCount != null && reviewCount > 0);

  const ratingLabel =
    rating != null && rating > 0
      ? Number(rating).toFixed(1).replace(/\.0$/, '')
      : null;

  return (
    <header className={className}>
      <h1 className="sd-page-title">{title}</h1>
      {hasStructuredMeta ? (
        <p className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[13px] lg:mt-2.5 lg:text-sm lg:leading-snug text-[#6a6a6a]">
          {locationLabel ? <span>{locationLabel}</span> : null}
          {locationLabel && (ratingLabel || reviewCount) ? (
            <span className="text-[#d4d4d4]" aria-hidden>
              ·
            </span>
          ) : null}
          {ratingLabel ? (
            <span className="inline-flex items-center gap-1 font-medium text-[#222222]">
              <Star className="h-3.5 w-3.5 fill-[#222222] text-[#222222]" aria-hidden />
              {ratingLabel}
            </span>
          ) : null}
          {reviewCount != null && reviewCount > 0 ? (
            <>
              {ratingLabel ? (
                <span className="text-[#d4d4d4]" aria-hidden>
                  ·
                </span>
              ) : null}
              <span>
                {reviewCount} {reviewCount === 1 ? 'reseña' : 'reseñas'}
              </span>
            </>
          ) : null}
        </p>
      ) : meta ? (
        <p className="mt-2 text-sm leading-snug text-[#6a6a6a]">{meta}</p>
      ) : null}
    </header>
  );
};
