import React, { useState, useMemo, useEffect, useCallback, Suspense, lazy, useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { HomepageMobileHero } from '../components/HomepageMobileHero';
import { prefetchHomepageWall } from '../hooks/useHomepageWall';
import { useIsMobile } from '../hooks/useIsMobile';
import {
  HomePageSearchBarSkeleton,
  HomePageSearchBarDesktopSkeleton,
} from '../components/homepage/HomePageSearchBarSkeleton';
import { HomePageWallSkeleton } from '../components/homepage/HomePageWallSkeleton';

const WELCOME_POPUP_KEY = 'welcome-popup-shown';

const AirbnbSearchBar = lazy(() =>
  import('../components/AirbnbSearchBar').then((m) => ({ default: m.AirbnbSearchBar })),
);
const HomepageWall = lazy(() =>
  import('../components/HomepageWall').then((m) => ({ default: m.HomepageWall })),
);
const WelcomePopup = lazy(() =>
  import('../components/WelcomePopup').then((m) => ({ default: m.WelcomePopup })),
);
const MobileBottomBar = lazy(() =>
  import('../components/MobileBottomBar').then((m) => ({ default: m.MobileBottomBar })),
);
const DesktopLanding = lazy(() => import('../components/DesktopLanding'));

const HomePage: React.FC = () => {
  const location = useLocation();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [showWelcomePopup] = useState(
    () => typeof localStorage !== 'undefined' && !localStorage.getItem(WELCOME_POPUP_KEY),
  );

  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [location.pathname]);

  const countryCode = useMemo(() => {
    if (typeof navigator !== 'undefined' && navigator.language) {
      const lang = navigator.language.split('-')[1];
      if (lang) return lang.toUpperCase();
    }
    return 'ES';
  }, []);

  const [searchFilters, setSearchFilters] = useState<{
    serviceTypeId: number | null;
    categoryId: number;
    adUrl: string;
  }>({
    serviceTypeId: null,
    categoryId: 3,
    adUrl: '',
  });

  const wallParams = useMemo(
    () => ({
      categoryId: searchFilters.categoryId,
      latitude: null as string | null,
      longitude: null as string | null,
      countryCode,
      locationRange: 50,
      nearbyPage: 1,
      nearbyPageSize: 20,
      popularPage: 1,
      popularPageSize: 20,
      _enabled: true,
    }),
    [searchFilters.categoryId, countryCode],
  );

  useLayoutEffect(() => {
    void prefetchHomepageWall(queryClient, wallParams);
  }, [queryClient, wallParams]);

  const handleSearch = useCallback(
    (searchData: {
      serviceTypeId: number | null;
      categoryId: number | null;
      adUrl: string;
    }) => {
      setSearchFilters((prev) => {
        const newCategoryId = searchData.categoryId || 3;
        if (
          prev.serviceTypeId === searchData.serviceTypeId &&
          prev.categoryId === newCategoryId &&
          prev.adUrl === searchData.adUrl
        ) {
          return prev;
        }
        return {
          ...searchData,
          categoryId: newCategoryId,
        };
      });
    },
    [],
  );

  const searchBarFallback = isMobile ? (
    <HomePageSearchBarSkeleton />
  ) : (
    <HomePageSearchBarDesktopSkeleton />
  );

  return (
    <>
      <div className="min-h-screen md:min-h-0 bg-[#f5f5f5] md:bg-[#fafafa] pb-[65px] md:pb-0">
        {showWelcomePopup && (
          <Suspense fallback={null}>
            <WelcomePopup />
          </Suspense>
        )}

        <Suspense fallback={searchBarFallback}>
          <AirbnbSearchBar onSearch={handleSearch} countryCode={countryCode} />
        </Suspense>

        <HomepageMobileHero />

        <div className="pt-0 md:pb-0">
          <div
            data-services-section
            id="servicios-grid"
            className="relative z-20 bg-white -mt-1.5 md:-mt-5 pt-3 md:pt-6 pb-1 md:pb-8 shadow-[0_-4px_24px_rgba(15,23,42,0.06)]"
          >
            <Suspense fallback={<HomePageWallSkeleton />}>
              <HomepageWall
                countryCode={countryCode}
                serviceTypeId={searchFilters.serviceTypeId}
                categoryId={searchFilters.categoryId}
                animateOnMount={false}
              />
            </Suspense>
          </div>
        </div>

        {!isMobile && (
          <Suspense fallback={null}>
            <DesktopLanding />
          </Suspense>
        )}
      </div>

      {isMobile && (
        <Suspense fallback={null}>
          <MobileBottomBar />
        </Suspense>
      )}
    </>
  );
};

export default HomePage;
