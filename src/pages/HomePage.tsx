import React, { useState, useMemo, useEffect, useCallback, Suspense, lazy } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCategories } from '../contexts/CategoryContext';
import { useServiceTypes } from '../hooks/useServiceTypes';

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
  const { categories, loading: categoriesLoading } = useCategories();
  const { serviceTypes, isLoading: serviceTypesLoading } = useServiceTypes();

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
        className="min-h-screen bg-white pb-[calc(65px+max(11px,env(safe-area-inset-bottom)))] md:pb-0"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <Suspense fallback={null}>
          <WelcomePopup />
        </Suspense>

        <div className="relative bg-[#f5f5f5] shadow-[0_6px_20px_0_rgba(0,0,0,0.15)]">
          <motion.div variants={itemVariants} initial="hidden" animate="visible">
            <Suspense fallback={null}>
              <AirbnbSearchBar onSearch={handleSearch} />
            </Suspense>
          </motion.div>
        </div>

        <motion.div
          className="pt-3 md:pt-8 lg:pt-10"
          variants={itemVariants}
        >
          <div className="md:pt-2 lg:pt-4" data-services-section>
            <Suspense fallback={null}>
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
