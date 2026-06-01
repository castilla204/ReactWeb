import React, { useMemo } from 'react';
import { Star } from 'lucide-react';

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

export type ServiceDetailReviewsDensity = 'default' | 'compact';

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

const monthNames = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
] as const;

const TRUNCATE_CHARS = { default: 280, compact: 160 } as const;

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
              : 'divide-y divide-[#e8e8e8] border-y border-[#e8e8e8]'
          }
        >
          {sortedReviews.map((review, idx) => {
            const key = review.id ?? idx;
            const reviewDate = new Date(review.createdAt);
            const formattedDate = `${monthNames[reviewDate.getMonth()]} ${reviewDate.getFullYear()}`;
            const reviewText = review.description || review.comment || '';
            const shouldTruncate = reviewText.length > truncateAt;
            const isExpanded = expandedReviews[key] || false;
            const rating = review.rating || review.score || 5;
            const starClass = isCompact ? 'h-2.5 w-2.5' : 'h-3 w-3';
            const itemPy = isCompact ? 'py-3 first:pt-0 last:pb-0' : 'py-5 first:pt-5';

            return (
              <li key={key} className={itemPy}>
                <div
                  className={
                    isCompact
                      ? 'mb-1 flex items-center justify-between gap-2'
                      : 'mb-2 flex flex-wrap items-center justify-between gap-2'
                  }
                >
                  <span
                    className={
                      isCompact
                        ? 'truncate text-xs font-medium text-[#1c1c1c]'
                        : 'text-sm font-medium text-[#1c1c1c]'
                    }
                  >
                    {review.client?.name || 'Cliente'}
                  </span>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <div className="flex gap-px" role="img" aria-label={`${rating} de 5`}>
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`${starClass} ${
                            i < rating ? 'fill-[#1c1c1c] text-[#1c1c1c]' : 'text-[#e8e8e8]'
                          }`}
                          aria-hidden
                        />
                      ))}
                    </div>
                    <time className="text-[11px] text-[#6a6a6a]">{formattedDate}</time>
                  </div>
                </div>
                {reviewText ? (
                  <>
                    <p
                      className={`leading-snug text-[#6a6a6a] ${
                        isCompact ? 'text-xs leading-5' : 'text-sm'
                      } ${!isExpanded && shouldTruncate ? (isCompact ? 'line-clamp-2' : 'line-clamp-3') : ''}`}
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
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
