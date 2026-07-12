import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import type { ServiceReviewItem } from './ServiceDetailReviewsSection';
import { ServiceDetailReviewStars } from './ServiceDetailReviewStars';
import { formatReviewMonthYear } from '../../utils/reviewFormat';
import { getReviewStarRating } from '../../utils/reviewRatingDistribution';

interface ServiceDetailReviewSnippetProps {
  review: ServiceReviewItem;
  className?: string;
  onClick?: () => void;
  variant?: 'default' | 'mobile' | 'desktop';
  /** Estrellas en carbón en lugar de amarillo. */
  neutral?: boolean;
}

export const ServiceDetailReviewSnippet: React.FC<ServiceDetailReviewSnippetProps> = ({
  review,
  className = '',
  onClick,
  variant = 'default',
  neutral = false,
}) => {
  const isMobile = variant === 'mobile';
  const isDesktop = variant === 'desktop';
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());
  const reviewText = (review.description || review.comment || '').trim();
  const clientName = review.client?.name?.trim() || 'Cliente';
  const initial = clientName.charAt(0).toUpperCase();
  const dateLabel = formatReviewMonthYear(review.createdAt);
  const rating = getReviewStarRating(review);
  const images = review.imageUrls?.slice(0, 4) ?? [];

  const Wrapper = onClick ? 'button' : 'article';
  const wrapperProps = onClick
    ? {
        type: 'button' as const,
        onClick,
        className: `sd-reviews-preview-item group w-full text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-strong ${
          isMobile
            ? 'touch-manipulation active:bg-surface-tinted'
            : isDesktop
              ? 'rounded-none hover:opacity-90'
              : 'hover:bg-surface-tinted'
        } ${className}`,
      }
    : {
        className: `sd-reviews-preview-item ${className}`,
      };

  return (
    <Wrapper {...wrapperProps}>
      <header className={`flex items-start gap-3 ${isMobile ? 'mb-2.5' : 'mb-2'}`}>
        <Avatar
          className={`shrink-0 rounded-full border border-line ${
            isMobile ? 'h-10 w-10' : isDesktop ? 'h-9 w-9' : 'h-10 w-10'
          }`}
        >
          <AvatarImage src={review.client?.profilePictureUrl} alt="" />
          <AvatarFallback className="rounded-full bg-line-soft text-sm font-semibold text-ink-strong">
            {initial}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex items-baseline justify-between gap-x-2 gap-y-0.5">
            <p className="truncate text-sm font-semibold text-ink-strong">{clientName}</p>
            {dateLabel ? (
              <time className="shrink-0 text-xs text-ink-muted">{dateLabel}</time>
            ) : null}
          </div>
          <ServiceDetailReviewStars
            rating={rating}
            size="sm"
            neutral={neutral}
            className="mt-1"
          />
        </div>
      </header>

      {reviewText ? (
        <p
          className={`leading-relaxed text-ink-muted ${
            isDesktop
              ? 'line-clamp-4 text-sm leading-[1.65]'
              : isMobile
                ? 'line-clamp-4 text-sm leading-[1.65]'
                : 'line-clamp-4 text-sm text-ink-strong'
          }`}
        >
          {reviewText}
        </p>
      ) : null}

      {images.length > failedImages.size ? (
        <div className={`sd-review-images-row ${isMobile ? 'mt-3' : 'mt-2.5'}`}>
          {images.map((img, idx) =>
            failedImages.has(idx) ? null : (
              <img
                key={idx}
                src={img}
                alt=""
                className={`shrink-0 rounded-lg border border-line object-cover bg-surface-tinted ${
                  isMobile ? 'h-12 w-12' : 'h-12 w-12'
                }`}
                loading="lazy"
                onError={() =>
                  setFailedImages((prev) => new Set([...prev, idx]))
                }
              />
            ),
          )}
        </div>
      ) : null}
    </Wrapper>
  );
};
