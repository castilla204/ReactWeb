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
  /** Desktop: bloque a ancho completo bajo el grid */
  layout?: 'default' | 'full';
  /** En pestaña móvil el título ya está en el tab. */
  hideHeading?: boolean;
  headingId?: string;
}

const MIN_REVIEWS_FOR_HISTOGRAM = 3;
const MOBILE_PREVIEW_COUNT = 2;
const DESKTOP_PREVIEW_COUNT = 4;
const DESKTOP_FULL_PREVIEW_COUNT = 2;

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
        className="sd-reviews-preview sd-reviews-preview--mobile w-full"
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
      className="sd-reviews-preview sd-reviews-preview--mobile w-full"
      aria-labelledby={hideHeading ? undefined : headingId}
    >
      <div className="sd-reviews-preview-summary-mobile">
        {showFeaturedBadge ? (
          <p className="mb-3 text-center">
            <span className="inline-flex rounded-full border border-[#e8e8e8] bg-white px-2.5 py-1 text-xs font-medium text-[#1c1c1c]">
              Valoración destacada
            </span>
          </p>
        ) : null}

        {showHistogram ? (
          <div className="sd-reviews-preview-summary-mobile__stats">
            <div className="sd-reviews-preview-summary-mobile__score">
              <p className="sd-reviews-mobile-score tabular-nums text-[#222222]">{ratingLabel}</p>
              <p className="mt-1 text-xs leading-snug text-[#717171]">{opinionsLabel}</p>
              <ServiceDetailReviewStars
                rating={averageRating}
                size="sm"
                className="mt-2 justify-center"
              />
            </div>
            <div className="sd-reviews-preview-summary-mobile__bars">
              <ServiceDetailReviewHistogram
                distribution={distribution}
                total={reviews.length}
                variant="mobile"
                showPercent={false}
                emphasis="prominent"
              />
            </div>
          </div>
        ) : (
          <div className="sd-reviews-preview-summary-mobile__score">
            <p className="sd-reviews-mobile-score tabular-nums text-[#222222]">{ratingLabel}</p>
            <p className="mt-1 text-xs leading-snug text-[#717171]">{opinionsLabel}</p>
            <ServiceDetailReviewStars rating={averageRating} size="sm" className="mt-2 justify-center" />
          </div>
        )}
      </div>

      {previewReviews.length > 0 ? (
        <ul className="mt-4 w-full divide-y divide-[#ebebeb] border-t border-[#ebebeb]">
          {previewReviews.map((review, idx) => {
            const key = review.id ?? `${review.createdAt}-${idx}`;
            return (
              <li key={key}>
                <ServiceDetailReviewSnippet
                  review={review}
                  variant="mobile"
                  onClick={onShowAll}
                  className="py-3"
                />
              </li>
            );
          })}
        </ul>
      ) : null}

      <button type="button" onClick={onShowAll} className="sd-btn-secondary mt-4 w-full justify-center">
        {ctaLabel}
      </button>
    </section>
  );
}

function DesktopReviewsPreview({
  reviews,
  averageRating,
  onShowAll,
  layout = 'default',
  headingId = 'sd-reviews-heading',
}: Omit<ServiceDetailReviewsPreviewProps, 'variant' | 'hideHeading'>) {
  const isFullWidth = layout === 'full';
  const distribution = useMemo(() => computeReviewRatingDistribution(reviews), [reviews]);
  const previewReviews = useMemo(
    () =>
      pickPreviewReviews(
        reviews,
        isFullWidth ? DESKTOP_FULL_PREVIEW_COUNT : DESKTOP_PREVIEW_COUNT,
      ),
    [reviews, isFullWidth],
  );
  const ratingLabel = formatRatingDisplay(averageRating);
  const showHistogram = reviews.length >= MIN_REVIEWS_FOR_HISTOGRAM;
  const showFeaturedBadge = averageRating >= 4.8 && reviews.length >= 5;
  const opinionsLabel =
    reviews.length === 1 ? '1 opinión verificada' : `${reviews.length} opiniones verificadas`;

  if (reviews.length === 0) {
    return (
      <section className="sd-reviews-preview sd-reviews-preview--desktop" aria-labelledby={headingId}>
        <h2 id={headingId} className="hp-section-title mb-2">
          Reseñas
        </h2>
        <p className="sd-body">
          Aún no hay valoraciones. Sé el primero en contratar este servicio.
        </p>
      </section>
    );
  }

  const ctaLabel =
    reviews.length > 1 ? `Mostrar las ${reviews.length} reseñas` : 'Mostrar la reseña';

  const histogramBlock = showHistogram ? (
    <div className="min-w-0 flex-1 max-w-xs">
      <ServiceDetailReviewHistogram distribution={distribution} total={reviews.length} />
    </div>
  ) : (
    <p className="min-w-0 flex-1 text-xs leading-relaxed text-[#6a6a6a]">
      {reviews.length === 1
        ? 'Basada en una opinión verificada.'
        : 'Aún hay pocas opiniones para mostrar la distribución por estrellas.'}
    </p>
  );

  const previewGridClass = (() => {
    if (isFullWidth || previewReviews.length <= 1) return '';
    if (previewReviews.length >= 3) return 'sm:grid-cols-2 lg:grid-cols-3';
    return 'sm:grid-cols-2';
  })();

  return (
    <section
      className={`sd-reviews-preview sd-reviews-preview--desktop ${
        isFullWidth ? 'sd-reviews-preview--desktop-full w-full' : ''
      }`}
      aria-labelledby={headingId}
    >
      {isFullWidth ? (
        <div className="sd-reviews-preview-full-row grid grid-cols-1 items-start gap-8 border-b border-[#ebebeb] pb-8 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-x-12 xl:gap-14">
          <div className="min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id={headingId} className="hp-section-title">
                  Reseñas
                </h2>
                <p className="mt-1 text-[13px] text-[#6a6a6a]">{opinionsLabel}</p>
              </div>
              {showFeaturedBadge ? (
                <span className="inline-flex shrink-0 rounded-full border border-[#e8e8e8] bg-[#fafafa] px-2.5 py-1 text-[11px] font-medium text-[#1c1c1c]">
                  Valoración destacada
                </span>
              ) : null}
            </div>

            <div className="mt-5 flex items-center gap-5 lg:mt-6 lg:gap-6">
              <div className="shrink-0">
                <p className="sd-rating-numeral text-[2rem] leading-none md:text-[2rem]">
                  {ratingLabel}
                </p>
                <ServiceDetailReviewStars rating={averageRating} size="md" className="mt-1.5" />
              </div>
              {showHistogram ? (
                <div className="min-w-0 flex-1">
                  <ServiceDetailReviewHistogram distribution={distribution} total={reviews.length} />
                </div>
              ) : (
                <p className="min-w-0 flex-1 text-xs leading-relaxed text-[#6a6a6a]">
                  {reviews.length === 1
                    ? 'Basada en una opinión verificada.'
                    : 'Aún hay pocas opiniones para mostrar la distribución por estrellas.'}
                </p>
              )}
            </div>
          </div>

          <div className="min-w-0 lg:border-l lg:border-[#ebebeb] lg:pl-12 xl:pl-14">
            {previewReviews.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8">
                {previewReviews.map((review, idx) => {
                  const key = review.id ?? `${review.createdAt}-${idx}`;
                  return (
                    <ServiceDetailReviewSnippet
                      key={key}
                      review={review}
                      variant="desktop"
                      onClick={onShowAll}
                      className="text-left"
                    />
                  );
                })}
              </div>
            ) : null}

            <button
              type="button"
              onClick={onShowAll}
              className="sd-btn-secondary mt-6 min-w-[12rem] justify-center px-5"
            >
              {ctaLabel}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 id={headingId} className="hp-section-title">
                Reseñas
              </h2>
              <p className="mt-1.5 text-[13px] text-[#6a6a6a]">{opinionsLabel}</p>
            </div>
            {showFeaturedBadge ? (
              <span className="inline-flex rounded-full border border-[#e8e8e8] bg-[#fafafa] px-2.5 py-1 text-[11px] font-medium text-[#1c1c1c]">
                Valoración destacada
              </span>
            ) : null}
          </div>

          <div className="sd-reviews-preview-summary mt-6 grid grid-cols-1 gap-5 border-b border-[#ebebeb] pb-7 lg:grid-cols-[140px_1fr] lg:items-center lg:gap-10">
            <div className="flex shrink-0 flex-col lg:items-start lg:text-left">
              <p className="sd-rating-numeral text-[2rem] leading-none md:text-[2rem]">
                {ratingLabel}
              </p>
              <ServiceDetailReviewStars rating={averageRating} size="md" className="mt-2" />
            </div>
            {histogramBlock}
          </div>
        </>
      )}

      {!isFullWidth && previewReviews.length > 0 ? (
        <div className={`mt-7 grid gap-x-8 gap-y-8 ${previewGridClass}`}>
          {previewReviews.map((review, idx) => {
            const key = review.id ?? `${review.createdAt}-${idx}`;
            return (
              <ServiceDetailReviewSnippet
                key={key}
                review={review}
                variant="desktop"
                onClick={onShowAll}
                className="h-full text-left"
              />
            );
          })}
        </div>
      ) : null}

      {!isFullWidth ? (
        <button
          type="button"
          onClick={onShowAll}
          className="sd-btn-secondary mt-8 min-w-[12rem] justify-center px-5"
        >
          {ctaLabel}
        </button>
      ) : null}
    </section>
  );
}

/** Vista previa de reseñas (desktop: sección bajo descripción; móvil: pestaña plana). */
export const ServiceDetailReviewsPreview: React.FC<ServiceDetailReviewsPreviewProps> = ({
  reviews,
  averageRating,
  onShowAll,
  variant = 'desktop',
  layout = 'default',
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
      layout={layout}
      headingId={headingId}
    />
  );
};
