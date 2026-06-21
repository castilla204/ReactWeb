import React from 'react';
import { SileoSkeleton } from './ui/sileo-skeleton';

/** Placeholder desktop del carril de servicios — skeleton unificado. */
export const HomepageWallDesktopSkeleton: React.FC = () => (
  <div className="hidden md:block w-full max-w-[1280px] mx-auto px-4 md:px-6 lg:px-10 pt-6 md:pt-8 pb-8">
    <div className="mb-8">
      <SileoSkeleton className="h-3 w-20 mb-2 rounded" />
      <SileoSkeleton className="h-7 w-64 rounded-lg" />
    </div>
    <div className="flex overflow-hidden gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="shrink-0 w-[184px]">
          <SileoSkeleton className="h-[138px] w-full rounded-xl mb-2" />
          <SileoSkeleton className="h-3.5 w-[88%] rounded" />
        </div>
      ))}
    </div>
  </div>
);

export default HomepageWallDesktopSkeleton;
