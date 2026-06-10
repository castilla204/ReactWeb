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
import { SEO } from '../components/SEO';
import { FAQ_ITEMS } from '../content/faqContent';
import { faqPageSchema } from '../utils/jsonLd';

// ⚡ Los import() arrancan en cuanto se evalúa este módulo (en paralelo entre sí),
// no cuando React monta cada <Suspense>. Antes cada lazy() esperaba a su render
// → cascada de peticiones secuenciales y la página aparecía "por partes".
const airbnbSearchBarPromise = import('../components/AirbnbSearchBar');
const homepageWallPromise = import('../components/HomepageWall');
const mobileBottomBarPromise = import('../components/MobileBottomBar');
const desktopLandingPromise = import('../components/DesktopLanding');

const AirbnbSearchBar = lazy(() =>
  airbnbSearchBarPromise.then((m) => ({ default: m.AirbnbSearchBar })),
);
const HomepageWall = lazy(() =>
  homepageWallPromise.then((m) => ({ default: m.HomepageWall })),
);
const MobileBottomBar = lazy(() =>
  mobileBottomBarPromise.then((m) => ({ default: m.MobileBottomBar })),
);
const DesktopLanding = lazy(() => desktopLandingPromise);

const HomePage: React.FC = () => {
  const location = useLocation();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
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

  // 🛡️ SEO: 6 FAQ curadas (las de máximo intent transaccional). El JSON-LD requiere
  // que las preguntas también aparezcan visibles en la home (Google update 08/2023).
  // El componente <FAQ /> al final de la página renderiza las 41 — coincidencia OK.
  const homeFaqIds = [
    'what-is',
    'how-it-works',
    'price',
    'escrow',
    'report-time',
    'dispute',
  ];
  const homeFaq = FAQ_ITEMS.filter((it) => homeFaqIds.includes(it.id)).map((it) => ({
    question: it.question,
    answer: it.answer,
  }));

  return (
    <>
      <SEO
        title="Antes de comprar, inspecciona · Peritos verificados | Inspecciono"
        description="¿Vas a comprar un coche, un piso o una moto de segunda mano? Un experto verificado lo revisa por ti y te entrega un informe. Pago seguro en escrow."
        canonical="/"
        ogTitle="Antes de comprar, que un experto lo revise por ti"
        ogDescription="Coches, pisos, motos. Un perito verificado va, lo inspecciona y te entrega un informe. Tú no pagas hasta dar el visto bueno."
        jsonLd={[faqPageSchema(homeFaq)]}
      />
      <div className="min-h-screen md:min-h-0 bg-[#f5f5f5] md:bg-[#fafafa] pb-[65px] md:pb-0">
        <Suspense fallback={searchBarFallback}>
          <AirbnbSearchBar onSearch={handleSearch} countryCode={countryCode} />
        </Suspense>

        <HomepageMobileHero />

        <div className="pt-0 md:pb-0">
          <div
            data-services-section
            id="servicios-grid"
            className="relative z-20 bg-white -mt-1.5 md:mt-0 md:rounded-t-2xl md:overflow-hidden pt-3 md:pt-8 pb-1 md:pb-10 md:shadow-[0_-2px_16px_rgba(15,23,42,0.05)]"
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
