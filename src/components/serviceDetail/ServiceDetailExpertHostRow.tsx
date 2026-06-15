import React from 'react';
import { BadgeCheck, Star } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import {
  SD_DESKTOP_HOST_BIO_CLASS,
  SD_DESKTOP_HOST_CHAT_CLASS,
  SD_DESKTOP_HOST_CONTENT_CLASS,
  SD_DESKTOP_HOST_INNER_CLASS,
  SD_DESKTOP_HOST_NAME_CLASS,
  SD_DESKTOP_HOST_ROW_CLASS,
  SD_MOBILE_EMPHASIS_CLASS,
  SD_MOBILE_META_CLASS,
} from '../../constants/homepageTypography';

interface ServiceDetailExpertHostRowProps {
  expertName: string;
  expertPicture?: string;
  expertDescription?: string;
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
  expertDescription,
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
  const trimmedExpertDescription = expertDescription?.trim() ?? '';
  const showDesktopExpertBio = !isMobile && trimmedExpertDescription.length > 0;

  const avatarButton = (
    <button
      type="button"
      className="relative shrink-0 border-none bg-transparent p-0"
      onClick={onAvatarClick}
      aria-label={isMobile ? `${expertName}, revisor verificado` : `Perfil de ${expertName}`}
    >
      <Avatar className={`rounded-full ${isMobile ? 'h-11 w-11' : 'h-12 w-12'}`}>
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
  );

  const identityBlock = (
    <div className={isMobile ? 'min-w-0 flex-1' : SD_DESKTOP_HOST_CONTENT_CLASS}>
      <p className={isMobile ? `truncate ${SD_MOBILE_EMPHASIS_CLASS}` : SD_DESKTOP_HOST_NAME_CLASS}>
        {expertName}
      </p>

      {showDesktopExpertBio ? (
        <p className={SD_DESKTOP_HOST_BIO_CLASS} title={trimmedExpertDescription}>
          {trimmedExpertDescription}
        </p>
      ) : null}

      {isMobile ? (
        <p className={`mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 ${SD_MOBILE_META_CLASS}`}>
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
                <Star className="h-3.5 w-3.5 fill-[#F59E0B] text-[#F59E0B]" aria-hidden />
                {ratingLabel}
                <span className="font-normal text-[#6a6a6a]">({reviewCount})</span>
              </span>
            </>
          ) : null}
        </p>
      ) : null}
    </div>
  );

  const chatButton = (
    <Button
      type="button"
      onClick={onChatClick}
      variant="outline"
      size="sm"
      // Contorno con degradado azul→ámbar de marca. Técnica de doble fondo
      // (padding-box blanco + border-box degradado) para que respete el rounded-full.
      style={{
        border: '2px solid transparent',
        background:
          'linear-gradient(#ffffff, #ffffff) padding-box, linear-gradient(to right, #0066CC, #F59E0B) border-box',
      }}
      className={`rounded-full font-semibold text-[#222222] hover:bg-transparent hover:shadow-sm ${
        isMobile
          ? 'h-9 shrink-0 px-3.5 text-sm'
          : `${SD_DESKTOP_HOST_CHAT_CLASS} h-9 px-4 text-sm`
      }`}
      aria-label={`Chat con ${expertName}`}
    >
      Chat
    </Button>
  );

  if (isMobile) {
    return (
      <div className={`flex items-center gap-3 ${className}`.trim()}>
        {avatarButton}
        {identityBlock}
        {chatButton}
      </div>
    );
  }

  return (
    <div className={`${SD_DESKTOP_HOST_INNER_CLASS} ${SD_DESKTOP_HOST_ROW_CLASS} ${className}`.trim()}>
      {avatarButton}
      {identityBlock}
      {chatButton}
    </div>
  );
};
