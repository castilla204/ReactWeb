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

/** Resumen móvil a ancho completo: nota + estrellas | barras. */
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
      <div className="sd-reviews-preview-summary-mobile__row">
        <div className="sd-reviews-preview-summary-mobile__score-col">
          <p className="sd-reviews-mobile-score tabular-nums text-[#222222]">{ratingLabel}</p>
          <ServiceDetailReviewStars rating={averageRating} size="md" neutral={neutral} className="mt-1.5" />
          <p className="mt-1 text-[13px] leading-snug text-[#717171]">{opinionsLabel}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sd-reviews-preview-summary-mobile__row">
      <div className="sd-reviews-preview-summary-mobile__score-col">
        <p className="sd-reviews-mobile-score tabular-nums text-[#222222]">{ratingLabel}</p>
        <ServiceDetailReviewStars rating={averageRating} size="sm" neutral={neutral} className="mt-1.5" />
        <p className="mt-1.5 text-[13px] leading-snug text-[#717171]">{opinionsLabel}</p>
      </div>
      <div className="sd-reviews-preview-summary-mobile__bars-col">
        <ServiceDetailReviewHistogram
          distribution={distribution}
          total={reviewCount}
          variant="mobile"
          showPercent={false}
          neutral={neutral}
        />
      </div>
    </div>
  );
}
