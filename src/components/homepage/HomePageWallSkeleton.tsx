import React from 'react';
import { SileoSkeleton } from '../ui/sileo-skeleton';
import { HP_WALL_CARD_WIDTH_CLASS } from '../../constants/homepageTypography';

/** Carril de servicios — skeleton unificado con shimmer. */
export const HomePageWallSkeleton: React.FC = () => (
  <div className="w-full max-w-[1280px] mx-auto px-4 md:px-6 lg:px-10 pt-0 md:pt-0 pb-1 md:pb-3">
    <div className="mb-2 md:mb-3 flex items-start gap-3">
      <SileoSkeleton className="hidden md:block mt-1.5 h-7 w-[3px] rounded-full" rounded="full" />
      <SileoSkeleton className="h-7 w-56 max-w-[70%] rounded-lg" />
    </div>
    <div className="hidden md:grid md:grid-cols-6 md:gap-3 w-full pb-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="min-w-0">
          <SileoSkeleton className="aspect-[4/3] w-full rounded-xl mb-1" />
          <SileoSkeleton className="h-3.5 w-full rounded mb-1.5" />
          <SileoSkeleton className="h-3 w-3/4 rounded" />
        </div>
      ))}
    </div>
    <div className="flex gap-4 overflow-hidden pb-0 md:hidden">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className={`shrink-0 ${HP_WALL_CARD_WIDTH_CLASS}`}>
          <SileoSkeleton className="aspect-square w-full rounded-[20px] mb-1.5" />
          <SileoSkeleton className="h-3.5 w-full rounded mb-1.5" />
          <SileoSkeleton className="h-3 w-3/4 rounded" />
        </div>
      ))}
    </div>
  </div>
);
