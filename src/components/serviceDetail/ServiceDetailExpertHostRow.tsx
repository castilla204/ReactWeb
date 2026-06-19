import React from 'react';
import { BadgeCheck, GraduationCap, Star } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { parseFormacion } from '../expertPanel/formacion';
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
  /** JSON de formación del experto; se muestra como chips junto al nombre (solo desktop). */
  formacion?: string | null;
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
  formacion,
  onAvatarClick,
  onChatClick,
  variant = 'desktop',
  className = '',
}) => {
  const isMobile = variant === 'mobile';
  const formacionItems = !isMobile ? parseFormacion(formacion) : [];
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
      {isMobile ? (
        <span
          className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand text-white ring-2 ring-white"
          aria-hidden
        >
          <BadgeCheck className="h-3 w-3" strokeWidth={2.5} />
        </span>
      ) : null}
    </button>
  );

  const identityBlock = (
    <div className={isMobile ? 'min-w-0 flex-1' : SD_DESKTOP_HOST_CONTENT_CLASS}>
      {isMobile ? (
        <p className={`truncate ${SD_MOBILE_EMPHASIS_CLASS}`}>{expertName}</p>
      ) : (
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <span className={`max-w-full ${SD_DESKTOP_HOST_NAME_CLASS}`}>{expertName}</span>
          {formacionItems.length > 0 ? (
            <span className="flex flex-wrap items-center gap-1.5">
              {formacionItems.map((it, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 rounded-full bg-[#EAF1FB] px-2 py-0.5 text-[11px] font-medium leading-tight text-[#1C63B4]"
                  title={it.titulo}
                >
                  <GraduationCap size={12} strokeWidth={2} className="shrink-0" />
                  <span className="max-w-[160px] truncate">{it.titulo}</span>
                </span>
              ))}
            </span>
          ) : null}
        </div>
      )}

      {showDesktopExpertBio ? (
        <p className={SD_DESKTOP_HOST_BIO_CLASS}>
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
