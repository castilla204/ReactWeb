import React from 'react';
import { Star } from 'lucide-react';
import type { ReviewRatingBucket } from '../../utils/reviewRatingDistribution';

interface ServiceDetailReviewHistogramProps {
  distribution: ReviewRatingBucket[];
  total: number;
  compact?: boolean;
}

export const ServiceDetailReviewHistogram: React.FC<ServiceDetailReviewHistogramProps> = ({
  distribution,
  total,
  compact = false,
}) => {
  const maxCount = Math.max(...distribution.map((b) => b.count), 1);

  return (
    <div
      className={`flex flex-col ${compact ? 'gap-1' : 'gap-1.5'}`}
      role="img"
      aria-label={`Distribución de ${total} valoraciones`}
    >
      {distribution.map(({ star, count, percent }) => {
        const barWidth = count > 0 ? Math.max(8, (count / maxCount) * 100) : 0;
        return (
          <div
            key={star}
            className={`grid items-center gap-2 ${
              compact
                ? 'grid-cols-[1.5rem_1fr_2rem]'
                : 'grid-cols-[2.75rem_1fr_1.75rem]'
            }`}
          >
            <span
              className={`flex items-center gap-0.5 text-[#6a6a6a] ${
                compact ? 'text-[10px]' : 'text-xs'
              }`}
            >
              <span className="sr-only">{star} estrellas</span>
              <span aria-hidden>{star}</span>
              <Star
                className={`fill-[#1c1c1c] text-[#1c1c1c] ${compact ? 'h-2 w-2' : 'h-2.5 w-2.5'}`}
                aria-hidden
              />
            </span>
            <div
              className={`overflow-hidden rounded-full bg-[#ebebeb] ${
                compact ? 'h-1' : 'h-1.5'
              }`}
            >
              <div
                className="h-full rounded-full bg-[#1c1c1c] transition-[width] duration-300"
                style={{ width: `${barWidth}%` }}
              />
            </div>
            <span
              className={`text-right tabular-nums text-[#6a6a6a] ${
                compact ? 'text-[10px]' : 'text-[11px]'
              }`}
            >
              {percent > 0 ? `${percent}%` : '—'}
            </span>
          </div>
        );
      })}
    </div>
  );
};
