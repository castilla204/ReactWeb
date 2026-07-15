import React from 'react';
import { ChevronRight } from 'lucide-react';

import {
  getMobileSearchPillAriaLabel,
  getMobileSearchPillSubtitle,
  MOBILE_SEARCH_PILL_TITLE,
} from '../../constants/homepageSearchCopy';
import {
  HP_MOBILE_SEARCH_PILL_ACTIVE_BORDER_CLASS,
  HP_MOBILE_SEARCH_PILL_BASE_CLASS,
  HP_MOBILE_SEARCH_PILL_HEIGHT_PX,
  HP_MOBILE_SEARCH_PILL_IDLE_BORDER_CLASS,
  HP_MOBILE_SEARCH_PILL_SHADOW,
} from '../../constants/homepageMobileRhythm';
import { HP_FONT } from '../../constants/homepageTypography';
import { cn } from '../../lib/utils';
import { MobileSearchPillIcon } from './MobileSearchPillIcon';

interface MobileSearchPillProps {
  categoryId: number | null;
  categoryLabel: string;
  onOpen: () => void;
}

/** Pill sticky móvil — entrada al mapa (estático, sin animación de borde). */
export const MobileSearchPill: React.FC<MobileSearchPillProps> = ({
  categoryId,
  categoryLabel,
  onOpen,
}) => {
  const subtitle = getMobileSearchPillSubtitle(categoryLabel);

  return (
    <div
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
      aria-label={getMobileSearchPillAriaLabel(categoryLabel)}
      className={cn(
        HP_MOBILE_SEARCH_PILL_BASE_CLASS,
        categoryId != null
          ? HP_MOBILE_SEARCH_PILL_ACTIVE_BORDER_CLASS
          : HP_MOBILE_SEARCH_PILL_IDLE_BORDER_CLASS,
      )}
      style={{
        height: `${HP_MOBILE_SEARCH_PILL_HEIGHT_PX}px`,
        boxShadow: HP_MOBILE_SEARCH_PILL_SHADOW,
      }}
    >
      <MobileSearchPillIcon />
      <div className="min-w-0 flex-1 text-left">
        <span
          className="block max-w-full truncate text-sm font-semibold leading-[18px] text-ink-strong"
          style={{ fontFamily: HP_FONT }}
        >
          {MOBILE_SEARCH_PILL_TITLE}
        </span>
        <span
          className="block max-w-full truncate text-xs leading-4 text-ink-muted"
          style={{ fontFamily: HP_FONT }}
        >
          {subtitle}
        </span>
      </div>
      <ChevronRight
        className="h-4 w-4 shrink-0 text-ink-soft"
        strokeWidth={2}
        aria-hidden
      />
    </div>
  );
};
