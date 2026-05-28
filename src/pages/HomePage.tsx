import React, { useState, useMemo, useEffect, useCallback, Suspense, lazy, useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { AirbnbSearchBar } from '../components/AirbnbSearchBar';
import { HomepageMobileHero } from '../components/HomepageMobileHero';
import { HomepageWall } from '../components/HomepageWall';
import DesktopLanding from '../components/DesktopLanding';
import { useHomepageWallQuery, prefetchHomepageWall } from '../hooks/useHomepageWall';

const WelcomePopup = lazy(() =>
  import('../components/WelcomePopup').then((m) => ({ default: m.WelcomePopup })),
);
const MobileBottomBar = lazy(() =>
  import('../components/MobileBottomBar').then((m) => ({ default: m.MobileBottomBar })),
);

const HomePage: React.FC = () => {
  const location = useLocation();
  const queryClient = useQueryClient();

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

  useHomepageWallQuery(wallParams);

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

  return (
    <>
      <div className="min-h-screen md:min-h-0 bg-[#f5f5f5] md:bg-[#fafafa] pb-[65px] md:pb-0">
        <Suspense fallback={null}>
          <WelcomePopup />
        </Suspense>

        <AirbnbSearchBar onSearch={handleSearch} countryCode={countryCode} />

        <HomepageMobileHero />

        <div className="pt-0 md:pb-0">
          <div
            data-services-section
            id="servicios-grid"
            className="relative z-20 bg-white md:-mt-5 rounded-t-[1.25rem] md:rounded-t-[1.75rem] pt-4 md:pt-8 md:pb-10 shadow-[0_-4px_24px_rgba(15,23,42,0.06)]"
          >
            <HomepageWall
              countryCode={countryCode}
              serviceTypeId={searchFilters.serviceTypeId}
              categoryId={searchFilters.categoryId}
              animateOnMount={false}
            />
          </div>
        </div>

        <DesktopLanding />
      </div>

      <Suspense fallback={null}>
        <MobileBottomBar />
      </Suspense>
    </>
  );
};

export default HomePage;
