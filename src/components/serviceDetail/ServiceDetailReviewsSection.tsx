import React, { useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { ServiceDetailReviewStars } from './ServiceDetailReviewStars';
import { formatReviewMonthYear } from '../../utils/reviewFormat';
import { getReviewStarRating } from '../../utils/reviewRatingDistribution';

export interface ServiceReviewItem {
  id?: number | string;
  createdAt: string;
  description?: string;
  comment?: string;
  rating?: number;
  score?: number;
  imageUrls?: string[];
  client?: {
    name?: string;
    createdAt?: string;
    location?: string;
    profilePictureUrl?: string;
  };
}

export type ServiceDetailReviewsDensity = 'default' | 'compact' | 'drawer';

interface ServiceDetailReviewsSectionProps {
  reviews: ServiceReviewItem[];
  averageRating: number;
  expandedReviews: Record<string | number, boolean>;
  onToggleExpand: (key: string | number) => void;
  onOpenReviewImage?: (reviewKey: string | number, imageIndex: number) => void;
  hideHeading?: boolean;
  headingId?: string;
  density?: ServiceDetailReviewsDensity;
  className?: string;
}

const TRUNCATE_CHARS = { default: 280, compact: 160, drawer: 280 } as const;

export const ServiceDetailReviewsSection: React.FC<ServiceDetailReviewsSectionProps> = ({
  reviews,
  averageRating,
  expandedReviews,
  onToggleExpand,
  onOpenReviewImage,
  hideHeading = false,
  headingId = 'sd-reviews-heading',
  density = 'default',
  className = '',
}) => {
  const isCompact = density === 'compact';
  const isDrawer = density === 'drawer';

  const sortedReviews = useMemo(
    () =>
      [...reviews].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [reviews],
  );

  const truncateAt = TRUNCATE_CHARS[density];

  return (
    <section
      className={`mt-8 border-t border-line pt-6 lg:mt-10 lg:pt-8 ${className}`}
      aria-labelledby={headingId}
    >
      {hideHeading ? (
        <h2 id={headingId} className="sr-only">
          Reseñas
        </h2>
      ) : (
        <div
          className={
            isCompact
              ? 'mb-2 flex flex-wrap items-baseline justify-between gap-2'
              : isDrawer
                ? 'mb-4 flex flex-wrap items-baseline justify-between gap-3'
                : 'mb-3 flex flex-wrap items-baseline justify-between gap-3 md:mb-4'
          }
        >
          <h2 id={headingId} className="hp-section-title">
            Reseñas
          </h2>
          {reviews.length > 0 && (
            <p className={isCompact ? 'text-xs text-ink-muted' : 'text-sm text-ink-muted'}>
              <span className="font-semibold tabular-nums text-ink-strong">
                {averageRating.toFixed(1).replace('.', ',')}
              </span>
              {' · '}
              {reviews.length} {reviews.length === 1 ? 'opinión' : 'opiniones'}
            </p>
          )}
        </div>
      )}

      {reviews.length === 0 ? (
        <p
          className={
            isCompact
              ? 'rounded-lg border border-line bg-surface-tinted px-2.5 py-2 text-xs text-ink-muted'
              : isDrawer
                ? 'rounded-lg border border-line bg-surface-tinted px-3 py-2 text-lead leading-relaxed text-ink-muted'
                : 'rounded-lg border border-line bg-brand/5 px-3 py-2 text-sm text-ink-muted'
          }
        >
          Aún no hay valoraciones. Sé el primero en contratar este servicio.
        </p>
      ) : (
        <ul
          className={
            isCompact
              ? 'divide-y divide-line'
              : isDrawer
                ? 'divide-y divide-line'
                : 'divide-y divide-line border-y border-line'
          }
        >
          {sortedReviews.map((review, idx) => {
            const key = review.id ?? idx;
            const formattedDate = formatReviewMonthYear(review.createdAt);
            const reviewText = review.description || review.comment || '';
            const shouldTruncate = reviewText.length > truncateAt;
            const isExpanded = expandedReviews[key] || false;
            const rating = getReviewStarRating(review);
            const clientName = review.client?.name?.trim() || 'Cliente';
            const clientInitial = clientName.charAt(0).toUpperCase();
            const itemPy = isCompact
              ? 'py-3.5 first:pt-0 last:pb-0'
              : isDrawer
                ? 'py-5 first:pt-4 last:pb-2'
                : 'py-5 first:pt-5';

            return (
              <li key={key} className={itemPy}>
                <div
                  className={
                    isCompact
                      ? 'mb-2 flex items-start gap-2.5'
                      : isDrawer
                        ? 'mb-3 flex items-start gap-3'
                        : 'mb-2.5 flex items-start gap-3'
                  }
                >
                  <Avatar
                    className={
                      isCompact
                        ? 'h-8 w-8 shrink-0 rounded-full border border-line'
                        : isDrawer
                          ? 'h-10 w-10 shrink-0 rounded-full border border-line'
                          : 'h-9 w-9 shrink-0 rounded-full border border-line'
                    }
                  >
                    <AvatarImage src={review.client?.profilePictureUrl} alt="" />
                    <AvatarFallback
                      className={`rounded-full bg-line-soft font-semibold text-ink-strong ${
                        isCompact ? 'text-xs' : isDrawer ? 'text-sm' : 'text-sm'
                      }`}
                    >
                      {clientInitial}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                      <span
                        className={
                          isCompact
                            ? 'truncate text-xs font-semibold text-ink-strong'
                            : isDrawer
                              ? 'truncate text-sm font-semibold text-ink'
                              : 'text-sm font-semibold text-ink-strong'
                        }
                      >
                        {clientName}
                      </span>
                      {formattedDate ? (
                        <time className={`shrink-0 text-ink-muted ${isDrawer ? 'text-xs' : 'text-kicker'}`}>
                          {formattedDate}
                        </time>
                      ) : null}
                    </div>
                    <ServiceDetailReviewStars
                      rating={rating}
                      size={isCompact ? 'sm' : isDrawer ? 'sm' : 'md'}
                      neutral={isDrawer}
                      className={isDrawer ? 'mt-1' : 'mt-1'}
                    />
                    {isDrawer && review.client?.location ? (
                      <p className="mt-1 truncate text-xs text-ink-muted">{review.client.location}</p>
                    ) : null}
                  </div>
                </div>
                {reviewText ? (
                  <>
                    <p
                      className={`text-ink ${
                        isCompact
                          ? 'text-xs leading-5'
                          : isDrawer
                            ? 'text-sm leading-[1.65] text-ink-muted'
                            : 'text-sm leading-snug'
                      } ${!isExpanded && shouldTruncate ? (isCompact ? 'line-clamp-2' : isDrawer ? 'line-clamp-4' : 'line-clamp-3') : ''}`}
                    >
                      {reviewText}
                    </p>
                    {shouldTruncate ? (
                      <button
                        type="button"
                        onClick={() => onToggleExpand(key)}
                        className={
                          isCompact
                            ? 'mt-1 text-xs font-medium text-ink-strong underline-offset-2 hover:underline'
                            : isDrawer
                              ? 'mt-2 text-sm font-medium text-ink underline-offset-2 hover:underline'
                              : 'mt-2 text-sm font-medium text-brand hover:underline'
                        }
                      >
                        {isExpanded ? 'Menos' : 'Más'}
                      </button>
                    ) : null}
                  </>
                ) : null}
                {review.imageUrls && review.imageUrls.length > 0 ? (
                  <div
                    className={`sd-review-images-row ${
                      isDrawer ? 'mt-2.5 gap-2' : isCompact ? 'mt-2' : 'mt-3 gap-2'
                    }`}
                  >
                    {review.imageUrls.slice(0, 4).map((img, imgIdx) => (
                      <button
                        key={imgIdx}
                        type="button"
                        className={`sd-review-images-row__thumb shrink-0 overflow-hidden border bg-surface-tinted transition-opacity hover:opacity-90 ${
                          isDrawer
                            ? 'h-12 w-12 rounded-lg border-line'
                            : isCompact
                              ? 'h-10 w-10 rounded-md border-line'
                              : 'h-14 w-14 rounded border-line'
                        }`}
                        onClick={() => onOpenReviewImage?.(key, imgIdx)}
                      >
                        <img src={img} alt="" className="h-full w-full object-cover" loading="lazy" />
                      </button>
                    ))}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
