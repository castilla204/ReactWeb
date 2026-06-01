import React, { useMemo } from 'react';
import { Star } from 'lucide-react';
import type { ServiceReviewItem } from './ServiceDetailReviewsSection';

interface ServiceDetailReviewsDesktopPreviewProps {
  reviews: ServiceReviewItem[];
  averageRating: number;
  onShowAll: () => void;
}

/** Vista previa mínima en ficha desktop (estilo Airbnb reducido). */
export const ServiceDetailReviewsDesktopPreview: React.FC<ServiceDetailReviewsDesktopPreviewProps> = ({
  reviews,
  averageRating,
  onShowAll,
}) => {
  const topReview = useMemo(() => {
    if (reviews.length === 0) return null;
    return [...reviews].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )[0];
  }, [reviews]);

  const ratingLabel = averageRating.toFixed(1).replace('.', ',');
  const reviewText = (topReview?.description || topReview?.comment || '').trim();

  if (reviews.length === 0) {
    return (
      <section className="border-t border-[#e8e8e8] pt-4" aria-labelledby="sd-reviews-heading">
        <h2 id="sd-reviews-heading" className="hp-section-title mb-2">
          Reseñas
        </h2>
        <p className="text-xs leading-relaxed text-[#6a6a6a]">
          Aún no hay valoraciones. Sé el primero en contratar este servicio.
        </p>
      </section>
    );
  }

  return (
    <section className="border-t border-[#e8e8e8] pt-4" aria-labelledby="sd-reviews-heading">
      <div className="mb-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <h2 id="sd-reviews-heading" className="hp-section-title">
          Reseñas
        </h2>
        <span className="inline-flex items-center gap-1 text-sm text-[#6a6a6a]">
          <Star className="h-3 w-3 fill-[#1c1c1c] text-[#1c1c1c]" aria-hidden />
          <span className="font-semibold tabular-nums text-[#1c1c1c]">{ratingLabel}</span>
          <span className="text-[#d4d4d4]" aria-hidden>
            ·
          </span>
          <span>
            {reviews.length} {reviews.length === 1 ? 'opinión' : 'opiniones'}
          </span>
        </span>
      </div>

      {topReview && reviewText ? (
        <blockquote className="mb-3 border-0 pl-0">
          <p className="line-clamp-2 text-xs leading-5 text-[#6a6a6a]">{reviewText}</p>
          <footer className="mt-1 text-[11px] text-[#6a6a6a]">
            — {topReview.client?.name || 'Cliente'}
          </footer>
        </blockquote>
      ) : null}

      <button
        type="button"
        onClick={onShowAll}
        className="w-full rounded-lg border border-[#1c1c1c] bg-white px-3 py-2 text-sm font-semibold text-[#1c1c1c] transition-colors hover:bg-[#f7f7f7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1c1c1c]"
      >
        {reviews.length > 1
          ? `Mostrar las ${reviews.length} reseñas`
          : 'Ver la reseña'}
      </button>
    </section>
  );
};
