import React from 'react';
import type { ReviewRatingBucket } from '../../utils/reviewRatingDistribution';
import { formatRatingDisplay } from '../../utils/reviewFormat';
import { ServiceDetailReviewStars } from './ServiceDetailReviewStars';
import { ServiceDetailReviewHistogram } from './ServiceDetailReviewHistogram';

interface ServiceDetailReviewsMobileStatsRowProps {
  averageRating: number;
  reviewCount: number;
  distribution: ReviewRatingBucket[];
  showHistogram?: boolean;
  /** Estrellas y barras en carbón para el drawer sobrio. */
  neutral?: boolean;
}

/** Resumen móvil en drawer: nota + estrellas | barras. */
export function ServiceDetailReviewsMobileStatsRow({
  averageRating,
  reviewCount,
  distribution,
  showHistogram = true,
  neutral = false,
}: ServiceDetailReviewsMobileStatsRowProps) {
  const ratingLabel = formatRatingDisplay(averageRating);
  const opinionsLabel = reviewCount === 1 ? '1 opinión' : `${reviewCount} opiniones`;

  if (!showHistogram) {
    return (
      <div className="sd-reviews-preview-summary-mobile__row sd-reviews-preview-summary-mobile__row--solo">
        <div className="sd-reviews-preview-summary-mobile__score-col">
          <p className="sd-rating-numeral text-[1.875rem] leading-none md:text-[1.875rem]">
            {ratingLabel}
          </p>
          <ServiceDetailReviewStars
            rating={averageRating}
            size="sm"
            neutral={neutral}
            className="mt-1.5"
          />
          <p className="mt-1 text-meta leading-snug text-ink-muted">{opinionsLabel}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sd-reviews-preview-summary-mobile__row">
      <div className="sd-reviews-preview-summary-mobile__score-col">
        <p className="sd-rating-numeral text-[1.875rem] leading-none md:text-[1.875rem]">
          {ratingLabel}
        </p>
        <ServiceDetailReviewStars
          rating={averageRating}
          size="sm"
          neutral={neutral}
          className="mt-1.5"
        />
        <p className="mt-1 text-meta leading-snug text-ink-muted">{opinionsLabel}</p>
      </div>
      <div className="sd-reviews-preview-summary-mobile__bars-col">
        <ServiceDetailReviewHistogram
          distribution={distribution}
          total={reviewCount}
          variant="mobile"
          showPercent={false}
          emphasis="default"
          neutral={neutral}
          barTone="solid"
        />
      </div>
    </div>
  );
}
