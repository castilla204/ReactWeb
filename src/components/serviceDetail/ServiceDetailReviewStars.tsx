import React from 'react';
import { Star } from 'lucide-react';

interface ServiceDetailReviewStarsProps {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
  /** Tono monocromo (carbón) para superficies sobrias como el drawer de reseñas. */
  neutral?: boolean;
  className?: string;
}

const SIZE_CLASS = {
  sm: 'h-3 w-3',
  md: 'h-3.5 w-3.5',
  lg: 'h-4 w-4',
} as const;

export const ServiceDetailReviewStars: React.FC<ServiceDetailReviewStarsProps> = ({
  rating,
  size = 'sm',
  neutral = false,
  className = '',
}) => {
  const starClass = SIZE_CLASS[size];
  const rounded = Math.min(5, Math.max(0, Math.round(rating)));
  const filledClass = neutral
    ? 'fill-[#222222] text-[#222222]'
    : 'fill-[#F59E0B] text-[#F59E0B]';

  return (
    <div
      className={`flex gap-px ${className}`}
      role="img"
      aria-label={`${rounded} de 5 estrellas`}
    >
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`${starClass} ${
            i < rounded ? filledClass : 'text-[#e8e8e8]'
          }`}
          aria-hidden
        />
      ))}
    </div>
  );
};
