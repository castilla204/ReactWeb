import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { FavoriteHeart } from '../FavoriteHeart';
import {
  SD_MOBILE_TOPBAR_COMPACT_INNER_CLASS,
  SD_MOBILE_TOPBAR_COMPACT_SHELL_CLASS,
  SD_MOBILE_TOPBAR_FLOATING_INNER_CLASS,
  SD_MOBILE_TOPBAR_FLOATING_SHELL_CLASS,
} from '../../constants/homepageTypography';

interface ServiceDetailMobileTopBarProps {
  title: string;
  onBack: () => void;
  showCompact: boolean;
  /** floating = botones glass sobre hero; compact = barra sticky; both = los dos */
  mode?: 'floating' | 'compact' | 'both';
  showFavorite?: boolean;
  isFavorite?: boolean;
  onFavoriteToggle?: () => void;
}

export const ServiceDetailMobileTopBar: React.FC<ServiceDetailMobileTopBarProps> = ({
  title,
  onBack,
  showCompact,
  mode = 'both',
  showFavorite = false,
  isFavorite = false,
  onFavoriteToggle,
}) => {
  const renderFloating = mode === 'floating' || mode === 'both';
  const renderCompact = mode === 'compact' || mode === 'both';
  const floatingHidden = showCompact;

  return (
    <>
      {renderFloating ? (
        <div
          className={`${SD_MOBILE_TOPBAR_FLOATING_SHELL_CLASS} ${
            floatingHidden ? 'pointer-events-none opacity-0' : 'opacity-100'
          }`}
          aria-hidden={floatingHidden}
        >
          <div className={SD_MOBILE_TOPBAR_FLOATING_INNER_CLASS}>
            <button
              type="button"
              onClick={onBack}
              className="sd-mobile-topbar-btn"
              aria-label="Volver"
            >
              <ArrowLeft className="h-5 w-5" strokeWidth={2.1} aria-hidden />
            </button>

            {showFavorite ? (
              <button
                type="button"
                onClick={onFavoriteToggle}
                className="sd-mobile-topbar-btn"
                aria-label={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                aria-pressed={isFavorite}
              >
                <FavoriteHeart filled={isFavorite} size={18} variant="plain" />
              </button>
            ) : (
              <span className="h-11 w-11 shrink-0" aria-hidden />
            )}
          </div>
        </div>
      ) : null}

      {renderCompact ? (
        <header
          className={`${SD_MOBILE_TOPBAR_COMPACT_SHELL_CLASS} ${
            showCompact
              ? 'translate-y-0 opacity-100'
              : 'pointer-events-none -translate-y-full opacity-0'
          }`}
          aria-hidden={!showCompact}
        >
          <div className={SD_MOBILE_TOPBAR_COMPACT_INNER_CLASS}>
            <button
              type="button"
              onClick={onBack}
              className="sd-icon-btn shrink-0"
              aria-label="Volver"
              tabIndex={showCompact ? 0 : -1}
            >
              <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
            </button>
            <h1 className="min-w-0 flex-1 truncate text-[15px] font-semibold leading-tight tracking-tight text-[#1c1c1c]">
              {title}
            </h1>
            {showFavorite ? (
              <button
                type="button"
                onClick={onFavoriteToggle}
                className="sd-icon-btn shrink-0"
                aria-label={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                aria-pressed={isFavorite}
                tabIndex={showCompact ? 0 : -1}
              >
                <FavoriteHeart filled={isFavorite} size={18} variant="plain" />
              </button>
            ) : (
              <span className="h-8 w-8 shrink-0" aria-hidden />
            )}
          </div>
        </header>
      ) : null}
    </>
  );
};
