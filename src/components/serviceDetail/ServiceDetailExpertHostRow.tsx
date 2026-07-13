import React, { useMemo, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { VerifiedBadge } from '../ui/VerifiedBadge';
import { Button } from '../ui/button';
import { formatFormacionInlineSummary, parseFormacion } from '../expertPanel/formacion';
import {
  SD_DESKTOP_HOST_BIO_CLASS,
  SD_DESKTOP_HOST_CHAT_CLASS,
  SD_DESKTOP_HOST_CONTENT_CLASS,
  SD_DESKTOP_HOST_INNER_CLASS,
  SD_DESKTOP_HOST_NAME_CLASS,
  SD_DESKTOP_HOST_ROW_CLASS,
  SD_DESKTOP_HOST_META_CLASS,
  SD_MOBILE_EMPHASIS_CLASS,
  SD_MOBILE_META_CLASS,
} from '../../constants/homepageTypography';

const DESKTOP_BIO_CLAMP_CHARS = 140;
const SD_HOST_INTERACTIVE_CLASS =
  'sd-host-interactive rounded-sm border-none bg-transparent p-0 font-inherit';

interface ServiceDetailExpertHostRowProps {
  expertName: string;
  expertPicture?: string;
  expertDescription?: string;
  completedSearches?: number;
  onAvatarClick: () => void;
  onChatClick: () => void;
  /** Abre expediente académico (móvil: sheet · desktop: dialog). */
  onFormacionClick?: () => void;
  /** Desktop: JSON de formación para etiqueta del enlace en meta. */
  expertFormacion?: string | null;
  variant?: 'mobile' | 'desktop';
  className?: string;
}

export const ServiceDetailExpertHostRow: React.FC<ServiceDetailExpertHostRowProps> = ({
  expertName,
  expertPicture,
  expertDescription,
  completedSearches = 0,
  onAvatarClick,
  onChatClick,
  onFormacionClick,
  expertFormacion,
  variant = 'desktop',
  className = '',
}) => {
  const isMobile = variant === 'mobile';
  const [bioExpanded, setBioExpanded] = useState(false);
  const trimmedExpertDescription = expertDescription?.trim() ?? '';
  const showDesktopExpertBio = !isMobile && trimmedExpertDescription.length > 0;
  const desktopBioIsLong =
    !isMobile && trimmedExpertDescription.length > DESKTOP_BIO_CLAMP_CHARS;
  const hasExpertFormacion = useMemo(
    () => parseFormacion(expertFormacion).length > 0,
    [expertFormacion],
  );
  const formacionSummary = useMemo(
    () => formatFormacionInlineSummary(expertFormacion),
    [expertFormacion],
  );
  const showDesktopFormacionLink = Boolean(
    !isMobile && onFormacionClick && formacionSummary.linkLabel,
  );
  const showMobileCredencialesLink = Boolean(
    isMobile && hasExpertFormacion && onFormacionClick,
  );
  const showDesktopMeta = !isMobile && (completedSearches > 0 || showDesktopFormacionLink);
  const completedLabel =
    completedSearches === 1 ? 'inspección completada' : 'inspecciones completadas';

  const avatarButton = (
    <button
      type="button"
      className="sd-host-interactive relative shrink-0 rounded-full border-none bg-transparent p-0"
      onClick={onAvatarClick}
      aria-label={
        isMobile
          ? `${expertName}, revisor verificado`
          : `Perfil verificado de ${expertName}`
      }
    >
      <Avatar className={`rounded-full ${isMobile ? 'h-10 w-10' : 'h-12 w-12'}`}>
        <AvatarImage src={expertPicture} alt="" />
        <AvatarFallback className="rounded-full bg-ink-strong text-sm font-semibold text-white">
          {expertName.charAt(0)}
        </AvatarFallback>
      </Avatar>
      <VerifiedBadge className="absolute -bottom-0.5 -right-0.5 h-5 w-5" />
    </button>
  );

  const identityBlock = (
    <div className={isMobile ? 'min-w-0 flex-1' : SD_DESKTOP_HOST_CONTENT_CLASS}>
      {isMobile ? (
        <>
          <p className={`truncate ${SD_MOBILE_EMPHASIS_CLASS}`}>{expertName}</p>
          {showMobileCredencialesLink ? (
            <button
              type="button"
              onClick={onFormacionClick}
              className={`${SD_HOST_INTERACTIVE_CLASS} mt-1 block text-left text-xs font-medium text-brand hover:text-brand-hover`}
              aria-label={`Ver credenciales de ${expertName}`}
            >
              Credenciales
            </button>
          ) : (
            <p className={`mt-1 ${SD_MOBILE_META_CLASS}`}>Revisor verificado</p>
          )}
          {completedSearches > 0 ? (
            <p className={`mt-1 ${SD_MOBILE_META_CLASS}`}>
              {completedSearches}{' '}
              {completedSearches === 1 ? 'inspección' : 'inspecciones'}
            </p>
          ) : null}
        </>
      ) : (
        <>
          <h2 className={`m-0 ${SD_DESKTOP_HOST_NAME_CLASS}`}>{expertName}</h2>

          {showDesktopExpertBio ? (
            <div className="mt-0.5 min-w-0">
              <p
                className={`${SD_DESKTOP_HOST_BIO_CLASS} m-0 ${
                  !bioExpanded && desktopBioIsLong ? 'line-clamp-2' : ''
                }`}
              >
                {trimmedExpertDescription}
              </p>
              {desktopBioIsLong ? (
                <button
                  type="button"
                  onClick={() => setBioExpanded((prev) => !prev)}
                  className={`${SD_HOST_INTERACTIVE_CLASS} mt-0.5 text-[13px] font-normal text-ink-muted underline decoration-line underline-offset-2 hover:text-ink`}
                >
                  {bioExpanded ? 'Mostrar menos' : 'Leer más'}
                </button>
              ) : null}
            </div>
          ) : null}

          {showDesktopMeta ? (
            <p className={`${SD_DESKTOP_HOST_META_CLASS} mt-1`}>
              {completedSearches > 0 ? (
                <span>
                  {completedSearches} {completedLabel}
                </span>
              ) : null}
              {showDesktopFormacionLink ? (
                <>
                  {completedSearches > 0 ? (
                    <span className="text-line" aria-hidden>
                      ·
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={onFormacionClick}
                    className={`sd-host-expediente-link ${SD_HOST_INTERACTIVE_CLASS} text-ink-muted underline decoration-line underline-offset-2 hover:text-ink`}
                    title={formacionSummary.fullText}
                  >
                    {formacionSummary.linkLabel}
                  </button>
                </>
              ) : null}
            </p>
          ) : null}
        </>
      )}
    </div>
  );

  const chatButton = (
    <Button
      type="button"
      onClick={onChatClick}
      variant="outline"
      size="sm"
      className={`shrink-0 rounded-full border-line px-3.5 text-sm font-semibold text-ink-strong hover:bg-surface-tinted hover:text-ink-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
        isMobile ? 'h-9 min-h-[36px]' : `mt-0.5 h-9 ${SD_DESKTOP_HOST_CHAT_CLASS}`
      }`}
      aria-label={`Chat con ${expertName}`}
    >
      Chat
    </Button>
  );

  if (isMobile) {
    return (
      <div className={className.trim()}>
        <div className="flex items-start gap-3">
          {avatarButton}
          <div className="min-w-0 flex-1">{identityBlock}</div>
          <div className="shrink-0 self-start">{chatButton}</div>
        </div>
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
