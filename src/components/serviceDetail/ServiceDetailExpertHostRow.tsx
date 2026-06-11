import React from 'react';
import { BadgeCheck, Star } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import {
  SD_DESKTOP_HOST_ROW_CLASS,
  SD_MOBILE_EMPHASIS_CLASS,
  SD_MOBILE_META_CLASS,
} from '../../constants/homepageTypography';

interface ServiceDetailExpertHostRowProps {
  expertName: string;
  expertPicture?: string;
  completedSearches?: number;
  rating?: number;
  reviewCount?: number;
  onAvatarClick: () => void;
  onChatClick: () => void;
  variant?: 'mobile' | 'desktop';
  className?: string;
}

export const ServiceDetailExpertHostRow: React.FC<ServiceDetailExpertHostRowProps> = ({
  expertName,
  expertPicture,
  completedSearches = 0,
  rating,
  reviewCount,
  onAvatarClick,
  onChatClick,
  variant = 'desktop',
  className = '',
}) => {
  const isMobile = variant === 'mobile';
  const showMobileRating = isMobile && rating != null && rating > 0 && (reviewCount ?? 0) > 0;
  const ratingLabel =
    rating != null && rating > 0 ? rating.toFixed(1).replace('.', ',') : null;

  return (
    <div
      className={`flex items-center gap-3 ${
        isMobile ? className : `${SD_DESKTOP_HOST_ROW_CLASS} ${className}`
      }`.trim()}
    >
      <button
        type="button"
        className="relative shrink-0 border-none bg-transparent p-0"
        onClick={onAvatarClick}
        aria-label={`${expertName}, revisor verificado`}
      >
        <Avatar
          className={`rounded-full ${isMobile ? 'h-11 w-11' : 'h-12 w-12'}`}
        >
          <AvatarImage src={expertPicture} alt={expertName} />
          <AvatarFallback className="rounded-full bg-[#1c1c1c] text-sm font-semibold text-white">
            {expertName.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <span
          className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand text-white ring-2 ring-white"
          aria-hidden
        >
          <BadgeCheck className="h-3 w-3" strokeWidth={2.5} />
        </span>
      </button>

      <div className="min-w-0 flex-1">
        <p
          className={
            isMobile
              ? `truncate ${SD_MOBILE_EMPHASIS_CLASS}`
              : 'truncate text-[15px] font-semibold leading-snug text-[#222222]'
          }
        >
          {expertName}
        </p>
        <p
          className={`mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 ${
            isMobile ? SD_MOBILE_META_CLASS : 'text-[13px] leading-snug text-[#6a6a6a]'
          }`}
        >
          <span>Revisor verificado</span>
          {completedSearches > 0 ? (
            <>
              <span className="text-[#d4d4d4]" aria-hidden>
                ·
              </span>
              <span>
                {completedSearches} {completedSearches === 1 ? 'trabajo' : 'trabajos'}
              </span>
            </>
          ) : null}
          {showMobileRating && ratingLabel ? (
            <>
              <span className="text-[#d4d4d4]" aria-hidden>
                ·
              </span>
              <span className="inline-flex items-center gap-0.5 text-xs font-semibold tabular-nums text-[#1c1c1c]">
                <Star className="h-3.5 w-3.5 fill-current" aria-hidden />
                {ratingLabel}
                <span className="font-normal text-[#6a6a6a]">({reviewCount})</span>
              </span>
            </>
          ) : null}
        </p>
      </div>

      <Button
        type="button"
        onClick={onChatClick}
        variant="outline"
        size="sm"
        className={`shrink-0 rounded-full border-[#dddddd] font-medium text-[#222222] hover:border-[#222222] hover:bg-white ${
          isMobile ? 'h-9 px-3.5 text-sm' : 'h-9 px-4 text-sm'
        }`}
        aria-label={`Chat con ${expertName}`}
      >
        Chat
      </Button>
    </div>
  );
};
