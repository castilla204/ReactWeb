import React, { useMemo } from 'react';
import type { ServiceReviewItem } from './ServiceDetailReviewsSection';
import { ServiceDetailReviewSnippet } from './ServiceDetailReviewSnippet';
import { ServiceDetailReviewStars } from './ServiceDetailReviewStars';
import { ServiceDetailReviewHistogram } from './ServiceDetailReviewHistogram';
import {
  computeReviewRatingDistribution,
  pickPreviewReviews,
} from '../../utils/reviewRatingDistribution';
import { formatRatingDisplay } from '../../utils/reviewFormat';

export type ServiceDetailReviewsPreviewVariant = 'desktop' | 'mobile';

interface ServiceDetailReviewsPreviewProps {
  reviews: ServiceReviewItem[];
  averageRating: number;
  onShowAll: () => void;
  variant?: ServiceDetailReviewsPreviewVariant;
  /** En pestaña móvil el título ya está en el tab. */
  hideHeading?: boolean;
  headingId?: string;
}

const MIN_REVIEWS_FOR_HISTOGRAM = 3;
const MOBILE_PREVIEW_COUNT = 2;
const DESKTOP_PREVIEW_COUNT = 2;

function MobileReviewsPreview({
  reviews,
  averageRating,
  onShowAll,
  headingId,
  hideHeading,
}: Omit<ServiceDetailReviewsPreviewProps, 'variant'>) {
  const distribution = useMemo(() => computeReviewRatingDistribution(reviews), [reviews]);
  const previewReviews = useMemo(() => pickPreviewReviews(reviews, MOBILE_PREVIEW_COUNT), [reviews]);
  const ratingLabel = formatRatingDisplay(averageRating);
  const showHistogram = reviews.length >= MIN_REVIEWS_FOR_HISTOGRAM;
  const showFeaturedBadge = averageRating >= 4.8 && reviews.length >= 5;
  const opinionsLabel =
    reviews.length === 1 ? '1 opinión verificada' : `${reviews.length} opiniones verificadas`;
  const ctaLabel =
    reviews.length > 1 ? `Ver las ${reviews.length} opiniones` : 'Ver la opinión';

  if (reviews.length === 0) {
    return (
      <section
        className="sd-reviews-preview sd-reviews-preview--mobile"
        aria-labelledby={hideHeading ? undefined : headingId}
      >
        <p className="text-sm leading-relaxed text-[#6a6a6a]">
          Aún no hay valoraciones. Sé el primero en contratar este servicio.
        </p>
      </section>
    );
  }

  return (
    <section
      className="sd-reviews-preview sd-reviews-preview--mobile"
      aria-labelledby={hideHeading ? undefined : headingId}
    >
      {/* Widget global: nota media + distribución de todas las valoraciones */}
      <div className="sd-reviews-preview-summary-mobile">
        {showFeaturedBadge ? (
          <p className="mb-3">
            <span className="inline-flex rounded-full border border-[#e8e8e8] bg-white px-2.5 py-1 text-xs font-medium text-[#1c1c1c]">
              Valoración destacada
            </span>
          </p>
        ) : null}

        <div
          className={
            showHistogram
              ? 'grid grid-cols-[4.75rem_minmax(0,1fr)] items-start gap-4'
              : undefined
          }
        >
          <div className="min-w-0">
            <p className="text-[2rem] font-semibold leading-none tracking-tight tabular-nums text-[#1c1c1c]">
              {ratingLabel}
            </p>
            <ServiceDetailReviewStars rating={averageRating} size="sm" className="mt-1" />
            <p className="mt-0.5 text-xs text-[#6a6a6a]">{opinionsLabel}</p>
          </div>

          {showHistogram ? (
            <div className="min-w-0 border-l border-[#e8e8e8] pl-4">
              <ServiceDetailReviewHistogram
                distribution={distribution}
                total={reviews.length}
                compact
              />
            </div>
          ) : null}
        </div>

        {!showHistogram ? (
          <p className="mt-3 border-t border-[#e8e8e8] pt-3 text-xs leading-relaxed text-[#6a6a6a]">
            {reviews.length === 1
              ? 'Basada en una opinión verificada.'
              : 'Aún hay pocas opiniones para mostrar la distribución por estrellas.'}
          </p>
        ) : null}
      </div>

      {previewReviews.length > 0 ? (
        <ul className="mt-5 divide-y divide-[#e8e8e8]">
          {previewReviews.map((review, idx) => {
            const key = review.id ?? `${review.createdAt}-${idx}`;
            return (
              <li key={key}>
                <ServiceDetailReviewSnippet
                  review={review}
                  variant="mobile"
                  onClick={onShowAll}
                  className="py-4"
                />
              </li>
            );
          })}
        </ul>
      ) : null}

      <button type="button" onClick={onShowAll} className="sd-btn-secondary mt-5 w-full justify-center">
        {ctaLabel}
      </button>
    </section>
  );
}

function DesktopReviewsPreview({
  reviews,
  averageRating,
  onShowAll,
  headingId = 'sd-reviews-heading',
}: Omit<ServiceDetailReviewsPreviewProps, 'variant' | 'hideHeading'>) {
  const distribution = useMemo(() => computeReviewRatingDistribution(reviews), [reviews]);
  const previewReviews = useMemo(
    () => pickPreviewReviews(reviews, DESKTOP_PREVIEW_COUNT),
    [reviews],
  );
  const ratingLabel = formatRatingDisplay(averageRating);
  const showHistogram = reviews.length >= MIN_REVIEWS_FOR_HISTOGRAM;
  const showFeaturedBadge = averageRating >= 4.8 && reviews.length >= 5;

  if (reviews.length === 0) {
    return (
      <section className="sd-reviews-preview" aria-labelledby={headingId}>
        <h2 id={headingId} className="hp-section-title mb-2">
          Reseñas
        </h2>
        <p className="sd-body border-l-2 border-[#0066CC] py-0 pl-3 text-sm leading-relaxed">
          Aún no hay valoraciones. Sé el primero en contratar este servicio.
        </p>
      </section>
    );
  }

  const opinionsLabel =
    reviews.length === 1 ? '1 opinión verificada' : `${reviews.length} opiniones verificadas`;

  const ctaLabel =
    reviews.length > 1 ? `Ver las ${reviews.length} opiniones` : 'Ver la opinión';

  return (
    <section className="sd-reviews-preview" aria-labelledby={headingId}>
      <div className="mb-1">
        <h2 id={headingId} className="hp-section-title">
          Reseñas
        </h2>
        <p className="mt-1 text-sm text-[#6a6a6a]">
          Lo que dicen clientes que ya contrataron este servicio.
        </p>
      </div>

      {showFeaturedBadge ? (
        <p className="mt-2">
          <span className="inline-flex rounded-full border border-[#e8e8e8] bg-[#fafafa] px-2.5 py-1 text-xs font-medium text-[#1c1c1c]">
            Valoración destacada
          </span>
        </p>
      ) : null}

      <div
        className="sd-reviews-preview-summary mt-4 grid grid-cols-1 gap-6 md:grid-cols-[minmax(140px,auto)_minmax(0,1fr)] md:items-center md:gap-8 lg:grid-cols-[180px_1fr]"
      >
        <div className="flex flex-col md:items-center md:text-center lg:items-start lg:text-left">
          <p className="text-[2.75rem] font-semibold leading-none tracking-tight tabular-nums text-[#1c1c1c]">
            {ratingLabel}
          </p>
          <ServiceDetailReviewStars rating={averageRating} size="md" className="mt-1.5" />
          <p className="mt-1.5 text-sm text-[#6a6a6a]">{opinionsLabel}</p>
        </div>

        <div className="min-w-0">
          {showHistogram ? (
            <ServiceDetailReviewHistogram distribution={distribution} total={reviews.length} />
          ) : (
            <p className="text-sm leading-relaxed text-[#6a6a6a]">
              {reviews.length === 1
                ? 'Basada en una opinión verificada.'
                : 'Aún hay pocas opiniones para mostrar la distribución por estrellas.'}
            </p>
          )}
        </div>
      </div>

      {previewReviews.length > 0 ? (
        <div
          className={`mt-6 grid gap-0 divide-y divide-[#ebebeb] border-y border-[#ebebeb] ${
            previewReviews.length > 1 ? 'sm:grid-cols-2 sm:divide-x sm:divide-y-0' : ''
          }`}
        >
          {previewReviews.map((review, idx) => {
            const key = review.id ?? `${review.createdAt}-${idx}`;
            return (
              <ServiceDetailReviewSnippet
                key={key}
                review={review}
                variant="default"
                onClick={onShowAll}
                className={
                  previewReviews.length > 1
                    ? `px-0 py-4 sm:px-5 sm:first:pl-0 sm:last:pr-0 ${
                        idx === 0 ? 'sm:pr-5' : 'sm:pl-5'
                      }`
                    : 'py-4'
                }
              />
            );
          })}
        </div>
      ) : null}

      <button
        type="button"
        onClick={onShowAll}
        className="sd-btn-secondary mt-5 w-full justify-center sm:mt-6 sm:w-auto sm:min-w-[220px]"
      >
        {ctaLabel}
      </button>
    </section>
  );
}

/** Vista previa de reseñas (desktop: sección bajo descripción; móvil: pestaña plana). */
export const ServiceDetailReviewsPreview: React.FC<ServiceDetailReviewsPreviewProps> = ({
  reviews,
  averageRating,
  onShowAll,
  variant = 'desktop',
  hideHeading = false,
  headingId = 'sd-reviews-heading',
}) => {
  if (variant === 'mobile') {
    return (
      <MobileReviewsPreview
        reviews={reviews}
        averageRating={averageRating}
        onShowAll={onShowAll}
        hideHeading={hideHeading}
        headingId={headingId}
      />
    );
  }

  return (
    <DesktopReviewsPreview
      reviews={reviews}
      averageRating={averageRating}
      onShowAll={onShowAll}
      headingId={headingId}
    />
  );
};
