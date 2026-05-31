import React from 'react';

/** Carril de servicios — CSS puro, sin librería de skeleton */
export const HomePageWallSkeleton: React.FC = () => (
  <div className="w-full max-w-[1280px] mx-auto px-4 md:px-6 lg:px-10 pt-0 md:pt-8 pb-1">
    <div className="mb-2 md:mb-5 space-y-2">
      <div className="h-3 w-20 rounded bg-[#f0f0f0] animate-pulse hidden md:block" />
      <div className="h-7 w-56 max-w-[70%] rounded-lg bg-[#f0f0f0] animate-pulse" />
    </div>
    <div className="flex gap-4 overflow-hidden pb-0">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="shrink-0 w-[160px] min-[390px]:w-[172px] md:w-[184px]">
          <div className="aspect-square md:aspect-[4/3] w-full rounded-[20px] md:rounded-xl bg-[#f0f0f0] animate-pulse mb-1.5" />
          <div className="h-3.5 w-full rounded bg-[#f0f0f0] animate-pulse mb-1.5" />
          <div className="h-3 w-3/4 rounded bg-[#f0f0f0] animate-pulse" />
        </div>
      ))}
    </div>
  </div>
);
