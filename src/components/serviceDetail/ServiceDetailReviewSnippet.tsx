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
  variant?: 'default' | 'mobile';
}

export const ServiceDetailReviewSnippet: React.FC<ServiceDetailReviewSnippetProps> = ({
  review,
  className = '',
  onClick,
  variant = 'default',
}) => {
  const isMobile = variant === 'mobile';
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());
  const reviewText = (review.description || review.comment || '').trim();
  const clientName = review.client?.name?.trim() || 'Cliente';
  const initial = clientName.charAt(0).toUpperCase();
  const dateLabel = formatReviewMonthYear(review.createdAt);
  const rating = getReviewStarRating(review);
  const images = review.imageUrls?.slice(0, 2) ?? [];

  const Wrapper = onClick ? 'button' : 'article';
  const wrapperProps = onClick
    ? {
        type: 'button' as const,
        onClick,
        className: `sd-reviews-preview-item group w-full text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1c1c1c] ${
          isMobile
            ? 'touch-manipulation active:bg-[#f9fafb]'
            : 'hover:bg-[#fafafa]'
        } ${className}`,
      }
    : {
        className: `sd-reviews-preview-item ${className}`,
      };

  return (
    <Wrapper {...wrapperProps}>
      <header className={`flex items-center gap-3 ${isMobile ? 'mb-2' : 'mb-2.5'}`}>
        <Avatar
          className={`shrink-0 rounded-full border border-[#e8e8e8] ${
            isMobile ? 'h-9 w-9' : 'h-10 w-10'
          }`}
        >
          <AvatarImage src={review.client?.profilePictureUrl} alt="" />
          <AvatarFallback className="rounded-full bg-[#f0f0f0] text-sm font-semibold text-[#1c1c1c]">
            {initial}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[#1c1c1c]">{clientName}</p>
          {dateLabel ? (
            <p className="text-xs text-[#6a6a6a]">{dateLabel}</p>
          ) : null}
        </div>
      </header>

      <ServiceDetailReviewStars rating={rating} className={isMobile ? 'mb-1.5' : 'mb-2'} />

      {reviewText ? (
        <p
          className={`text-sm leading-relaxed text-[#1c1c1c] ${
            isMobile ? 'line-clamp-3' : 'line-clamp-4'
          }`}
        >
          {reviewText}
        </p>
      ) : null}

      {images.length > failedImages.size ? (
        <div className={`flex gap-1.5 ${isMobile ? 'mt-2' : 'mt-2.5'}`}>
          {images.map((img, idx) =>
            failedImages.has(idx) ? null : (
              <img
                key={idx}
                src={img}
                alt=""
                className={`rounded-md border border-[#e8e8e8] object-cover bg-[#f5f5f5] ${
                  isMobile ? 'h-11 w-11' : 'h-12 w-12'
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
