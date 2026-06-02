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
      className={`mt-8 border-t border-[#e8e8e8] pt-6 lg:mt-10 lg:pt-8 ${className}`}
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
            <p className={isCompact ? 'text-xs text-[#6a6a6a]' : 'text-sm text-[#6a6a6a]'}>
              <span className="font-semibold tabular-nums text-[#1c1c1c]">
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
              ? 'border-l-2 border-[#0066CC] py-0 pl-2.5 text-xs text-[#6a6a6a]'
              : isDrawer
                ? 'border-l-2 border-[#0066CC] py-0 pl-3 text-[15px] leading-relaxed text-[#6a6a6a]'
                : 'border-l-2 border-[#0066CC] py-0 pl-3 text-sm text-[#6a6a6a]'
          }
        >
          Aún no hay valoraciones. Sé el primero en contratar este servicio.
        </p>
      ) : (
        <ul
          className={
            isCompact
              ? 'divide-y divide-[#ebebeb]'
              : isDrawer
                ? 'divide-y divide-[#e8e8e8]'
                : 'divide-y divide-[#e8e8e8] border-y border-[#e8e8e8]'
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
                ? 'py-5 first:pt-5 last:pb-2'
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
                        ? 'h-8 w-8 shrink-0 rounded-full border border-[#ebebeb]'
                        : isDrawer
                          ? 'h-11 w-11 shrink-0 rounded-full border border-[#ebebeb]'
                          : 'h-9 w-9 shrink-0 rounded-full border border-[#ebebeb]'
                    }
                  >
                    <AvatarImage src={review.client?.profilePictureUrl} alt="" />
                    <AvatarFallback
                      className={`rounded-full bg-[#f0f0f0] font-semibold text-[#1c1c1c] ${
                        isCompact ? 'text-xs' : isDrawer ? 'text-base' : 'text-sm'
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
                            ? 'truncate text-xs font-semibold text-[#1c1c1c]'
                            : isDrawer
                              ? 'truncate text-base font-semibold text-[#1c1c1c]'
                              : 'text-sm font-semibold text-[#1c1c1c]'
                        }
                      >
                        {clientName}
                      </span>
                      {formattedDate ? (
                        <time className={`shrink-0 text-[#6a6a6a] ${isDrawer ? 'text-sm' : 'text-[11px]'}`}>
                          {formattedDate}
                        </time>
                      ) : null}
                    </div>
                    <ServiceDetailReviewStars
                      rating={rating}
                      size={isCompact ? 'sm' : isDrawer ? 'lg' : 'md'}
                      className={isDrawer ? 'mt-1.5' : 'mt-1'}
                    />
                  </div>
                </div>
                {reviewText ? (
                  <>
                    <p
                      className={`text-[#444] ${
                        isCompact
                          ? 'text-xs leading-5'
                          : isDrawer
                            ? 'text-[15px] leading-relaxed'
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
                            ? 'mt-1 text-xs font-medium text-[#1c1c1c] underline-offset-2 hover:underline'
                            : isDrawer
                              ? 'mt-2.5 text-[15px] font-medium text-[#0066CC] hover:underline'
                              : 'mt-2 text-sm font-medium text-[#0066CC] hover:underline'
                        }
                      >
                        {isExpanded ? 'Menos' : 'Más'}
                      </button>
                    ) : null}
                  </>
                ) : null}
                {!isCompact && review.imageUrls && review.imageUrls.length > 0 ? (
                  <div className="mt-3 flex gap-2">
                    {review.imageUrls.slice(0, 4).map((img, imgIdx) => (
                      <button
                        key={imgIdx}
                        type="button"
                        className="h-14 w-14 overflow-hidden rounded border border-[#e8e8e8] bg-[#f5f5f5]"
                        onClick={() => onOpenReviewImage?.(key, imgIdx)}
                      >
                        <img src={img} alt="" className="h-full w-full object-cover" loading="lazy" />
                      </button>
                    ))}
                  </div>
                ) : null}
                {isCompact && review.imageUrls && review.imageUrls.length > 0 ? (
                  <div className="mt-2 flex gap-1.5">
                    {review.imageUrls.slice(0, 3).map((img, imgIdx) => (
                      <button
                        key={imgIdx}
                        type="button"
                        className="h-10 w-10 overflow-hidden rounded-md border border-[#ebebeb] bg-[#f5f5f5]"
                        onClick={() => onOpenReviewImage?.(key, imgIdx)}
                      >
                        <img src={img} alt="" className="h-full w-full object-cover" loading="lazy" />
                      </button>
                    ))}
                  </div>
                ) : null}
                {isDrawer && review.imageUrls && review.imageUrls.length > 0 ? (
                  <div className="mt-3 flex gap-2">
                    {review.imageUrls.slice(0, 3).map((img, imgIdx) => (
                      <button
                        key={imgIdx}
                        type="button"
                        className="h-14 w-14 overflow-hidden rounded-md border border-[#ebebeb] bg-[#f5f5f5]"
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
