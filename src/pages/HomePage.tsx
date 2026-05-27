import React, { useState, useMemo, useEffect, useCallback, Suspense, lazy } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
const HomepageWall = lazy(() => import('../components/HomepageWall').then(module => ({ default: module.HomepageWall })));
const AirbnbSearchBar = lazy(() => import('../components/AirbnbSearchBar').then(module => ({ default: module.AirbnbSearchBar })));
const MobileBottomBar = lazy(() => import('../components/MobileBottomBar').then(module => ({ default: module.MobileBottomBar })));
const WelcomePopup = lazy(() => import('../components/WelcomePopup').then(module => ({ default: module.WelcomePopup })));

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.08,
      staggerChildren: 0.005,
      ease: [0.4, 0.0, 0.2, 1],
      when: 'beforeChildren',
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 3 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.12,
      ease: [0.4, 0.0, 0.2, 1],
    },
  },
};

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

  const handleSearch = useCallback((searchData: {
    serviceTypeId: number | null;
    categoryId: number | null;
    adUrl: string;
  }) => {
    setSearchFilters(prev => {
      const newCategoryId = searchData.categoryId || 3;
      if (prev.serviceTypeId === searchData.serviceTypeId &&
          prev.categoryId === newCategoryId &&
          prev.adUrl === searchData.adUrl) {
        return prev;
      }
      return {
        ...searchData,
        categoryId: newCategoryId,
      };
    });
  }, []);

  return (
    <>
      <motion.div
        className="min-h-screen md:min-h-0 bg-[#f5f5f5] md:bg-white pb-[calc(65px+max(11px,env(safe-area-inset-bottom)))] md:pb-0"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <Suspense fallback={null}>
          <WelcomePopup />
        </Suspense>

        <motion.div variants={itemVariants} initial="hidden" animate="visible">
          <Suspense fallback={null}>
            <AirbnbSearchBar onSearch={handleSearch} />
          </Suspense>
        </motion.div>

        <motion.div
          className="pt-0 md:pb-0"
          variants={itemVariants}
        >
          <div
            data-services-section
            className="md:block md:pt-4 md:pb-6 bg-white"
            id="servicios-grid"
          >
            <Suspense
              fallback={
                <div className="hidden md:block max-w-[1280px] mx-auto px-4 md:px-6 lg:px-10 py-8">
                  <div className="animate-pulse flex gap-4 overflow-hidden">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="shrink-0 w-[240px]">
                        <div className="aspect-square rounded-[20px] bg-gray-200" />
                        <div className="h-4 bg-gray-200 rounded mt-2 w-3/4" />
                      </div>
                    ))}
                  </div>
                </div>
              }
            >
              <HomepageWall
                countryCode={countryCode}
                serviceTypeId={searchFilters.serviceTypeId}
                categoryId={searchFilters.categoryId}
              />
            </Suspense>
          </div>
        </motion.div>
      </motion.div>

      <Suspense fallback={null}>
        <MobileBottomBar />
      </Suspense>
    </>
  );
};

export default HomePage;
