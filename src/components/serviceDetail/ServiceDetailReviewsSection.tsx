import React from 'react';
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
  };
}

interface ServiceDetailReviewsSectionProps {
  reviews: ServiceReviewItem[];
  averageRating: number;
  expandedReviews: Record<string | number, boolean>;
  onToggleExpand: (key: string | number) => void;
  onOpenReviewImage?: (reviewKey: string | number, imageIndex: number) => void;
  /** Sin borde superior si va justo después de otra sección en la misma columna */
  className?: string;
}

const monthNames = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
];

export const ServiceDetailReviewsSection: React.FC<ServiceDetailReviewsSectionProps> = ({
  reviews,
  averageRating,
  expandedReviews,
  onToggleExpand,
  onOpenReviewImage,
  className = '',
}) => (
  <section
    className={`mt-8 border-t border-[#e8e8e8] pt-6 lg:mt-10 lg:pt-8 ${className}`}
    aria-labelledby="sd-reviews-heading"
  >
    <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3 md:mb-4">
      <h2 id="sd-reviews-heading" className="hp-section-title">
        Reseñas
      </h2>
      {reviews.length > 0 && (
        <p className="text-sm text-[#6a6a6a]">
          <span className="font-semibold text-[#1c1c1c]">{averageRating.toFixed(1)}</span>
          {' · '}
          {reviews.length} {reviews.length === 1 ? 'opinión' : 'opiniones'}
        </p>
      )}
    </div>

    {reviews.length === 0 ? (
      <p className="text-sm text-[#6a6a6a] border-l-2 border-[#0066CC] pl-3">
        Aún no hay valoraciones. Sé el primero en contratar este servicio.
      </p>
    ) : (
      <ul className="divide-y divide-[#e8e8e8] border-y border-[#e8e8e8]">
        {reviews.map((review, idx) => {
          const key = review.id ?? idx;
          const reviewDate = new Date(review.createdAt);
          const formattedDate = `${monthNames[reviewDate.getMonth()]} ${reviewDate.getFullYear()}`;
          const reviewText = review.description || review.comment || '';
          const shouldTruncate = reviewText.length > 280;
          const isExpanded = expandedReviews[key] || false;
          const rating = review.rating || review.score || 5;

          return (
            <li key={key} className="py-5 first:pt-5">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span className="text-sm font-medium text-[#1c1c1c]">
                  {review.client?.name || 'Cliente'}
                </span>
                <div className="flex items-center gap-2">
                  <div className="flex gap-px">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${i < rating ? 'fill-[#1c1c1c] text-[#1c1c1c]' : 'text-[#ddd]'}`}
                      />
                    ))}
                  </div>
                  <time className="text-xs text-[#6a6a6a]">{formattedDate}</time>
                </div>
              </div>
              <p className={`text-sm leading-snug text-[#6a6a6a] ${!isExpanded && shouldTruncate ? 'line-clamp-3' : ''}`}>
                {reviewText}
              </p>
              {shouldTruncate && (
                <button
                  type="button"
                  onClick={() => onToggleExpand(key)}
                  className="mt-2 text-sm font-medium text-[#0066CC] hover:underline"
                >
                  {isExpanded ? 'Menos' : 'Más'}
                </button>
              )}
              {review.imageUrls && review.imageUrls.length > 0 && (
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
              )}
            </li>
          );
        })}
      </ul>
    )}
  </section>
);
