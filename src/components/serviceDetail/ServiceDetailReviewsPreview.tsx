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

/** Vista previa de reseñas (desktop: sección bajo descripción; móvil: pestaña Reseñas). */
export const ServiceDetailReviewsPreview: React.FC<ServiceDetailReviewsPreviewProps> = ({
  reviews,
  averageRating,
  onShowAll,
  variant = 'desktop',
  hideHeading = false,
  headingId = 'sd-reviews-heading',
}) => {
  const isMobile = variant === 'mobile';
  const previewCount = isMobile ? MOBILE_PREVIEW_COUNT : DESKTOP_PREVIEW_COUNT;

  const distribution = useMemo(() => computeReviewRatingDistribution(reviews), [reviews]);
  const previewReviews = useMemo(() => pickPreviewReviews(reviews, previewCount), [reviews, previewCount]);
  const ratingLabel = formatRatingDisplay(averageRating);
  const showHistogram = reviews.length >= MIN_REVIEWS_FOR_HISTOGRAM;
  const showFeaturedBadge = averageRating >= 4.8 && reviews.length >= 5;

  const sectionClass = isMobile
    ? 'sd-reviews-preview sd-reviews-preview--mobile'
    : 'sd-reviews-preview';

  if (reviews.length === 0) {
    return (
      <section className={sectionClass} aria-labelledby={hideHeading ? undefined : headingId}>
        {!hideHeading ? (
          <h2 id={headingId} className="hp-section-title mb-2">
            Reseñas
          </h2>
        ) : null}
        <p
          className={`sd-body text-sm leading-relaxed ${
            isMobile
              ? 'rounded-lg border border-[#e8e8e8] bg-[#fafafa] p-3.5'
              : 'border-l-2 border-[#0066CC] py-0 pl-3'
          }`}
        >
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
    <section
      className={sectionClass}
      aria-labelledby={hideHeading ? undefined : headingId}
    >
      {!hideHeading ? (
        <div className="mb-1">
          <h2 id={headingId} className="hp-section-title">
            Reseñas
          </h2>
          <p className="mt-1 text-sm text-[#6a6a6a]">
            Lo que dicen clientes que ya contrataron este servicio.
          </p>
        </div>
      ) : (
        <p className={`text-sm leading-snug text-[#6a6a6a] ${isMobile ? 'mb-3' : ''}`}>
          Opiniones de clientes que ya contrataron este servicio.
        </p>
      )}

      {showFeaturedBadge ? (
        <p className={isMobile ? 'mb-3' : hideHeading ? 'mb-3' : 'mt-2'}>
          <span className="inline-flex rounded-full border border-[#e8e8e8] bg-[#fafafa] px-2.5 py-1 text-xs font-medium text-[#1c1c1c]">
            Valoración destacada
          </span>
        </p>
      ) : null}

      {/* Resumen: nota + histograma */}
      <div
        className={
          isMobile
            ? 'sd-reviews-preview-summary-mobile'
            : `sd-reviews-preview-summary mt-4 grid grid-cols-1 gap-6 md:grid-cols-[minmax(140px,auto)_minmax(0,1fr)] md:items-center md:gap-8 lg:grid-cols-[180px_1fr] ${
                hideHeading && showFeaturedBadge ? 'mt-0' : ''
              }`
        }
      >
        <div
          className={
            isMobile
              ? 'flex flex-col gap-3'
              : 'flex flex-col md:items-center md:text-center lg:items-start lg:text-left'
          }
        >
          <div className={isMobile ? 'min-w-0' : undefined}>
            <p
              className={
                isMobile
                  ? 'text-[2rem] font-semibold leading-none tracking-tight tabular-nums text-[#1c1c1c]'
                  : 'text-[2.75rem] font-semibold leading-none tracking-tight tabular-nums text-[#1c1c1c]'
              }
            >
              {ratingLabel}
            </p>
            <ServiceDetailReviewStars
              rating={averageRating}
              size={isMobile ? 'sm' : 'md'}
              className="mt-1"
            />
            <p className={`text-[#6a6a6a] ${isMobile ? 'mt-0.5 text-xs' : 'mt-1.5 text-sm'}`}>
              {opinionsLabel}
            </p>
          </div>

          {isMobile && showHistogram ? (
            <div className="min-w-0 border-t border-[#e8e8e8] pt-3">
              <ServiceDetailReviewHistogram
                distribution={distribution}
                total={reviews.length}
                compact
              />
            </div>
          ) : null}
        </div>

        {!isMobile ? (
          <div className="min-w-0">
            {showHistogram ? (
              <ServiceDetailReviewHistogram
                distribution={distribution}
                total={reviews.length}
              />
            ) : (
              <p className="text-sm leading-relaxed text-[#6a6a6a]">
                {reviews.length === 1
                  ? 'Basada en una opinión verificada.'
                  : 'Aún hay pocas opiniones para mostrar la distribución por estrellas.'}
              </p>
            )}
          </div>
        ) : null}

        {isMobile && !showHistogram ? (
          <p className="mt-2.5 border-t border-[#e8e8e8] pt-2.5 text-xs leading-relaxed text-[#6a6a6a]">
            {reviews.length === 1
              ? 'Basada en una opinión verificada.'
              : 'Aún hay pocas opiniones para mostrar la distribución por estrellas.'}
          </p>
        ) : null}
      </div>

      {/* Opiniones destacadas */}
      {previewReviews.length > 0 ? (
        <div
          className={
            isMobile
              ? 'mt-3 flex flex-col gap-3'
              : `mt-6 grid gap-0 divide-y divide-[#ebebeb] border-y border-[#ebebeb] ${
                  previewReviews.length > 1 ? 'sm:grid-cols-2 sm:divide-x sm:divide-y-0' : ''
                }`
          }
        >
          {previewReviews.map((review, idx) => {
            const key = review.id ?? `${review.createdAt}-${idx}`;
            return (
              <ServiceDetailReviewSnippet
                key={key}
                review={review}
                variant={isMobile ? 'mobile' : 'default'}
                onClick={onShowAll}
                className={
                  isMobile
                    ? 'sd-reviews-preview-snippet-mobile'
                    : previewReviews.length > 1
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
        className={
          isMobile
            ? 'sd-reviews-preview-cta-mobile mt-3'
            : 'sd-btn-secondary mt-5 w-full justify-center sm:mt-6 sm:w-auto sm:min-w-[220px]'
        }
      >
        {ctaLabel}
      </button>
    </section>
  );
};
