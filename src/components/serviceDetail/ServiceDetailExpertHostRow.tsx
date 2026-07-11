import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { VerifiedBadge } from '../ui/VerifiedBadge';
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
  formacion,
  onAvatarClick,
  onChatClick,
  variant = 'desktop',
  className = '',
}) => {
  const isMobile = variant === 'mobile';
  const formacionItems = !isMobile ? parseFormacion(formacion) : [];
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
        <VerifiedBadge className="absolute -bottom-1 -right-1 h-[22px] w-[22px]" />
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
                  className="inline-flex max-w-[200px] items-center rounded-full bg-[#f4f4f5] px-2.5 py-1 text-[12px] font-medium leading-none text-[#52525b] ring-1 ring-[#e4e4e7]"
                  title={it.titulo}
                >
                  <span className="truncate">{it.titulo}</span>
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
          {/* El rating vive en el titular de la página y en la tab Reseñas; repetirlo aquí lo triplicaba */}
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
      className={`rounded-full border-[#d5e3f5] font-semibold text-brand hover:bg-[#eef4fb] hover:text-brand ${
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
