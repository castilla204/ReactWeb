import React, { useState, useMemo, useEffect, useCallback, Suspense, lazy } from 'react';
import { useLocation } from 'react-router-dom';
import { HomepageMobileHero } from '../components/HomepageMobileHero';
import { HomepageMobileCategoryTabs } from '../components/homepage/HomepageMobileCategoryTabs';
import { HomePageShell } from '../components/homepage/HomePageShell';
import { HomeServicesLoading } from '../components/homepage/HomePageWallSkeleton';
import { HomeSearchBarLoading } from '../components/homepage/HomeSearchBarLoading';
import { HomeBottomBarLoading } from '../components/homepage/HomeBottomBarLoading';
import { SEO } from '../components/SEO';
import { FAQ_ITEMS } from '../content/faqContent';
import { faqPageSchema } from '../utils/jsonLd';

const AirbnbSearchBar = lazy(() =>
  import('../components/AirbnbSearchBar').then((m) => ({ default: m.AirbnbSearchBar })),
);

const HomepageWall = lazy(() =>
  import('../components/HomepageWall').then((m) => ({ default: m.HomepageWall })),
);

const MobileBottomBar = lazy(() =>
  import('../components/MobileBottomBar').then((m) => ({ default: m.MobileBottomBar })),
);

const DesktopLanding = lazy(() => import('../components/DesktopLanding'));

const HomePage: React.FC = () => {
  const location = useLocation();

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

  const homeFaqIds = ['what-is', 'how-it-works', 'price', 'escrow', 'report-time', 'dispute'];
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
        ogDescription="Coches, pisos, motos. Un perito verificado va, lo inspecciona y te entrega un informe. No pagas al experto hasta dar el visto bueno."
        jsonLd={[faqPageSchema(homeFaq)]}
      />
      <HomePageShell
        searchBar={
          <Suspense fallback={<HomeSearchBarLoading />}>
            <AirbnbSearchBar onSearch={handleSearch} countryCode={countryCode} />
          </Suspense>
        }
        hero={
          <>
            <HomepageMobileHero />
            <HomepageMobileCategoryTabs activeCategoryId={searchFilters.categoryId} />
          </>
        }
        services={
          <Suspense fallback={<HomeServicesLoading />}>
            <HomepageWall
              countryCode={countryCode}
              serviceTypeId={searchFilters.serviceTypeId}
              categoryId={searchFilters.categoryId}
              animateOnMount={false}
            />
          </Suspense>
        }
        desktopFooter={
          <div className="hidden md:block">
            <Suspense fallback={null}>
              <DesktopLanding />
            </Suspense>
          </div>
        }
        bottomBar={
          <Suspense fallback={<HomeBottomBarLoading />}>
            <MobileBottomBar />
          </Suspense>
        }
      />
    </>
  );
};

export default HomePage;
