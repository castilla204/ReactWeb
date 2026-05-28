import React from 'react';

/** Placeholder ligero (sin react-loading-skeleton) mientras carga AirbnbSearchBar */
export const HomePageSearchBarSkeleton: React.FC = () => (
  <div className="md:hidden sticky top-0 z-40 bg-white border-b border-[#ebebeb]">
    <div className="px-4 pt-3 pb-2 space-y-3">
      <div className="h-10 w-full rounded-full bg-[#f0f0f0] animate-pulse" />
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-9 flex-1 rounded-full bg-[#f0f0f0] animate-pulse" />
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
          <div key={i} className="h-10 w-24 rounded-full bg-[#f0f0f0] animate-pulse" />
        ))}
      </div>
      <div className="h-14 max-w-[850px] mx-auto rounded-full bg-[#f0f0f0] animate-pulse" />
    </div>
    <div className="h-[400px] lg:h-[480px] bg-[#dce9f2] animate-pulse" />
  </div>
);
