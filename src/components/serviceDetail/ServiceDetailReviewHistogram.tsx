import React from 'react';
import { Star } from 'lucide-react';
import type { ReviewRatingBucket } from '../../utils/reviewRatingDistribution';

export type ReviewHistogramVariant = 'default' | 'compact' | 'mobile';

interface ServiceDetailReviewHistogramProps {
  distribution: ReviewRatingBucket[];
  total: number;
  /** @deprecated Usar variant */
  compact?: boolean;
  variant?: ReviewHistogramVariant;
  /** Ocultar % en vista compacta móvil (referencia marketplace) */
  showPercent?: boolean;
  /** Más alto en pestaña móvil de la ficha */
  emphasis?: 'default' | 'prominent';
  /** Barras en carbón en lugar de color de marca (drawer sobrio). */
  neutral?: boolean;
}

export const ServiceDetailReviewHistogram: React.FC<ServiceDetailReviewHistogramProps> = ({
  distribution,
  total,
  compact = false,
  variant,
  showPercent = true,
  emphasis = 'default',
  neutral = false,
}) => {
  const resolvedVariant: ReviewHistogramVariant =
    variant ?? (compact ? 'compact' : 'default');
  const isMobile = resolvedVariant === 'mobile';
  const isCompact = resolvedVariant === 'compact';
  const isProminent = isMobile && emphasis === 'prominent';
  const maxCount = Math.max(...distribution.map((b) => b.count), 1);
  const hidePercent = isMobile && !showPercent;

  return (
    <div
      className={`flex w-full flex-col ${
        isProminent
          ? 'gap-2.5'
          : isMobile
            ? hidePercent
              ? 'gap-0.5'
              : 'gap-2'
            : isCompact
              ? 'gap-1'
              : 'gap-1.5'
      }`}
      role="img"
      aria-label={`Distribución de ${total} valoraciones`}
    >
      {distribution.map(({ star, count, percent }) => {
        const barWidth = count > 0 ? Math.max(6, (count / maxCount) * 100) : 0;
        return (
          <div
            key={star}
            className={`grid items-center ${
              isMobile
                ? hidePercent
                  ? `grid-cols-[0.625rem_minmax(0,1fr)] ${isProminent ? 'gap-x-2.5 gap-y-1' : 'gap-x-2 gap-y-1'}`
                  : 'grid-cols-[0.625rem_minmax(0,1fr)_2rem] gap-2'
                : isCompact
                  ? 'grid-cols-[1.5rem_1fr_2rem] gap-2'
                  : 'grid-cols-[2.75rem_1fr_1.75rem] gap-2'
            }`}
          >
            <span
              className={`tabular-nums ${
                isMobile
                  ? `${isProminent ? 'text-xs' : 'text-[10px]'} font-medium leading-none text-[#717171]`
                  : `flex items-center gap-0.5 text-[#6a6a6a] ${isCompact ? 'text-[10px]' : 'text-xs'}`
              }`}
            >
              <span className="sr-only">{star} estrellas</span>
              <span aria-hidden>{star}</span>
              {!isMobile ? (
                <Star
                  className={`fill-[#1c1c1c] text-[#1c1c1c] ${isCompact ? 'h-2 w-2' : 'h-2.5 w-2.5'}`}
                  aria-hidden
                />
              ) : null}
            </span>
            <div
              className={`overflow-hidden rounded-full bg-[#dddddd] ${
                isProminent ? 'h-2.5' : isMobile ? (hidePercent ? 'h-[7px]' : 'h-[7px]') : isCompact ? 'h-1' : 'h-1.5'
              }`}
            >
              <div
                className={`h-full rounded-full transition-[width] duration-300 ${
                  count > 0 ? (neutral ? 'bg-[#222222]' : 'bg-[#1c1c1c]') : 'bg-transparent'
                }`}
                style={{ width: `${barWidth}%` }}
              />
            </div>
            {!hidePercent ? (
              <span
                className={`text-right tabular-nums text-[#717171] ${
                  isMobile ? 'text-[11px]' : isCompact ? 'text-[10px]' : 'text-[11px]'
                }`}
              >
                {percent > 0 ? `${percent}%` : '—'}
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};
