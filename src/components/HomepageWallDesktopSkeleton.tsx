import React from 'react';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

/** Placeholder desktop del carril de servicios — misma altura aprox. que HomepageWall cargado */
export const HomepageWallDesktopSkeleton: React.FC = () => (
  <SkeletonTheme baseColor="#f0f0f0" highlightColor="#e5e7eb">
    <div className="hidden md:block w-full max-w-[1280px] mx-auto px-4 md:px-6 lg:px-10 pt-6 md:pt-8 pb-8">
      <div className="mb-8">
        <Skeleton height={12} width={80} borderRadius={4} className="mb-2" />
        <Skeleton height={28} width={260} borderRadius={8} />
      </div>
      <div className="flex overflow-hidden gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="shrink-0 w-[184px]">
            <Skeleton height={138} borderRadius={12} className="mb-2" />
            <Skeleton height={14} width="88%" borderRadius={4} />
          </div>
        ))}
      </div>
    </div>
  </SkeletonTheme>
);

export default HomepageWallDesktopSkeleton;
