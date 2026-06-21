import React from 'react';
import { SileoSkeleton } from '../ui/sileo-skeleton';

/** Placeholder ligero mientras carga AirbnbSearchBar — ahora con shimmer unificado. */
export const HomePageSearchBarSkeleton: React.FC = () => (
  <div className="md:hidden sticky top-0 z-40 bg-white border-b border-[#ebebeb]">
    <div className="px-4 pt-3 pb-2 space-y-3">
      <SileoSkeleton className="h-10 w-full rounded-full" />
      <div className="flex justify-center gap-5 min-[390px]:gap-6 px-2">
        {[1, 2, 3].map((i) => (
          <SileoSkeleton
            key={i}
            className="h-[4.25rem] w-[5.25rem] min-[390px]:h-[4.75rem] min-[390px]:w-24 rounded-md"
          />
        ))}
      </div>
    </div>
  </div>
);

export const HomePageSearchBarDesktopSkeleton: React.FC = () => (
  <div className="hidden md:block bg-white border-b border-[#e8e8e8]">
    <div className="max-w-[1760px] mx-auto px-6 lg:px-8 py-4 space-y-3">
      <div className="flex justify-center gap-8 max-w-[850px] mx-auto">
        {[1, 2, 3].map((i) => (
          <SileoSkeleton key={i} className="h-10 w-24 rounded-full" />
        ))}
      </div>
      <SileoSkeleton className="h-14 max-w-[850px] mx-auto rounded-full" />
    </div>
    <div className="h-[400px] lg:h-[500px] xl:h-[520px] bg-[#e8f0f7] animate-pulse" />
  </div>
);
