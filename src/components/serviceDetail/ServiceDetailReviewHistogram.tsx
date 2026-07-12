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
  /** soft = barras tenues (pestaña móvil); solid = contraste pleno (drawer/desktop). */
  barTone?: 'soft' | 'solid';
}

export const ServiceDetailReviewHistogram: React.FC<ServiceDetailReviewHistogramProps> = ({
  distribution,
  total,
  compact = false,
  variant,
  showPercent = true,
  emphasis = 'default',
  neutral = false,
  barTone = 'solid',
}) => {
  const resolvedVariant: ReviewHistogramVariant =
    variant ?? (compact ? 'compact' : 'default');
  const isMobile = resolvedVariant === 'mobile';
  const isCompact = resolvedVariant === 'compact';
  const isProminent = isMobile && emphasis === 'prominent';
  const isSoftBar = barTone === 'soft';
  const maxCount = Math.max(...distribution.map((b) => b.count), 1);
  const hidePercent = isMobile && !showPercent;

  return (
    <div
      className={`flex w-full flex-col ${
        isProminent
          ? 'gap-2.5'
          : isMobile
            ? hidePercent
              ? 'gap-1.5'
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
                  ? `${isProminent ? 'text-xs' : 'text-kicker'} font-medium leading-none text-ink-muted`
                  : `flex items-center gap-0.5 text-ink-muted ${isCompact ? 'text-badge' : 'text-xs'}`
              }`}
            >
              <span className="sr-only">{star} estrellas</span>
              <span aria-hidden>{star}</span>
              {!isMobile ? (
                <Star
                  className={`fill-ink-strong text-ink-strong ${isCompact ? 'h-2 w-2' : 'h-2.5 w-2.5'}`}
                  aria-hidden
                />
              ) : null}
            </span>
            <div
              className={`overflow-hidden bg-line-soft ${
                isSoftBar
                  ? 'h-1 rounded-sm'
                  : isProminent
                    ? 'h-2.5 rounded-full'
                    : isMobile
                      ? 'h-1.5 rounded-full'
                      : isCompact
                        ? 'h-1 rounded-full'
                        : 'h-1.5 rounded-full'
              } ${isMobile ? 'self-center' : ''}`}
            >
              <div
                className={`h-full transition-[width] duration-300 ${
                  isSoftBar ? 'rounded-sm' : 'rounded-full'
                } ${count > 0 ? (isSoftBar ? 'bg-ink/20' : 'bg-ink-strong') : 'bg-transparent'}`}
                style={{ width: `${barWidth}%` }}
              />
            </div>
            {!hidePercent ? (
              <span
                className={`text-right tabular-nums text-ink-muted ${
                  isMobile ? 'text-kicker' : isCompact ? 'text-badge' : 'text-kicker'
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
