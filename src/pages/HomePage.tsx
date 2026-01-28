import React, { useState, useMemo, useEffect, useCallback, Suspense, lazy } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCategories } from '../contexts/CategoryContext';
import { useServiceTypes } from '../hooks/useServiceTypes';

// ✅ LAZY LOADING: Cargar componentes pesados solo cuando se necesiten
const HomepageWall = lazy(() => import('../components/HomepageWall').then(module => ({ default: module.HomepageWall })));
const AirbnbSearchBar = lazy(() => import('../components/AirbnbSearchBar').then(module => ({ default: module.AirbnbSearchBar })));
const MobileBottomBar = lazy(() => import('../components/MobileBottomBar').then(module => ({ default: module.MobileBottomBar })));
const WelcomePopup = lazy(() => import('../components/WelcomePopup').then(module => ({ default: module.WelcomePopup })));

// ✅ OPTIMIZADO PARA MÁXIMA FLUIDEZ: Animaciones ultra-rápidas y coordinadas
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.08, // ✅ Ultra-rápido para cambio de categoría instantáneo
      staggerChildren: 0.005, // ✅ Mínimo stagger para entrada coordinada
      ease: [0.4, 0.0, 0.2, 1], // ✅ easeInOut más suave
      // ✅ Evitar tirones durante la transición
      when: 'beforeChildren',
    },
  },
};

const itemVariants = {
  hidden: { 
    opacity: 0, 
    y: 3,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.12, // ✅ Ultra-rápido para cambio de categoría fluido
      ease: [0.4, 0.0, 0.2, 1], // ✅ easeInOut más suave
    },
  },
};

const HomePage: React.FC = () => {
  const location = useLocation();
  const { categories, loading: categoriesLoading } = useCategories();
  const { serviceTypes, isLoading: serviceTypesLoading } = useServiceTypes();
  
  // ✅ Mostrar skeleton completo mientras cargan categorías o tipos de servicio
  const isLoading = categoriesLoading || serviceTypesLoading;
  
  // Posicionar arriba cuando se carga o se vuelve a la homepage (sin scroll)
  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [location.pathname]);
  // Detectar país del navegador (fallback a ES) - Memoizado para evitar recálculos
  const countryCode = useMemo(() => {
    if (typeof navigator !== 'undefined' && navigator.language) {
      const lang = navigator.language.split('-')[1];
      if (lang) return lang.toUpperCase();
    }
    return 'ES';
  }, []);
  
  // Estado para los filtros de búsqueda
  const [searchFilters, setSearchFilters] = useState<{
    serviceTypeId: number | null;
    categoryId: number; // ✅ OBLIGATORIO: Siempre debe tener un valor
    adUrl: string;
  }>({
    serviceTypeId: null,
    categoryId: 3, // ✅ Por defecto Inmobiliaria (categoryId: 3) - categoría del medio
    adUrl: '',
  });

  // ✅ Memoizar handleSearch para evitar re-renders innecesarios
  const handleSearch = useCallback((searchData: {
    serviceTypeId: number | null;
    categoryId: number | null;
    adUrl: string;
  }) => {
    setSearchFilters(prev => {
      const newCategoryId = searchData.categoryId || 3;
      // ✅ Solo actualizar si realmente cambió
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

  // ✅ No mostrar skeleton completo, solo el HomepageWall mostrará su skeleton interno

  return (
    <>
      <motion.div
        className="min-h-screen bg-white"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{
          // ✅ Optimizaciones máximas para fluidez en webview
          willChange: 'contents',
          contain: 'layout style paint',
          // ✅ GPU acceleration
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
          perspective: '1000px',
          // ✅ Padding para el bottom bar siempre presente
          paddingBottom: 'calc(65px + max(11px, env(safe-area-inset-bottom)))',
        }}
      >
        {/* Welcome Popup - Solo se muestra la primera vez */}
        <Suspense fallback={null}>
          <WelcomePopup />
        </Suspense>
        
        {/* Search Bar Header con Tabs */}
        {/* ✅ Contenedor estático con sombra - NO se anima */}
        <div
          style={{
            backgroundColor: '#f5f5f5', // ✅ Fondo más gris
            boxShadow: '0 6px 20px 0 rgba(0, 0, 0, 0.15)', // ✅ Sombra divisoria más larga y extendida - SIEMPRE visible (no se anima)
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* ✅ Contenido animado - sin sombra */}
          <motion.div 
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            style={{
              backgroundColor: 'transparent', // ✅ Transparente porque el fondo está en el padre
            }}
          >
            <Suspense fallback={null}>
              <AirbnbSearchBar onSearch={handleSearch} />
            </Suspense>
          </motion.div>
        </div>
        
        {/* Main Content with proper spacing - Same as Airbnb */}
        <motion.div
          className="pt-3 md:pt-10 md:pb-0"
          style={{ 
            paddingTop: '12px',
            paddingBottom: '0px', // ✅ Sin padding inferior - el bottom bar es fixed
          }}
          variants={itemVariants}
        >
          <div className="md:pt-4" style={{ paddingTop: '8px', paddingBottom: '0px' }} data-services-section>
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

      {/* ✅ Mobile Bottom Bar - SIEMPRE PRESENTE (fuera del motion.div para estar siempre visible) */}
      <Suspense fallback={null}>
        <MobileBottomBar />
      </Suspense>
    </>
  );
};

export default HomePage;

