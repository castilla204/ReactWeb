import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HomepageWall } from '../components/HomepageWall';
import { AirbnbSearchBar } from '../components/AirbnbSearchBar';
import { MobileBottomBar } from '../components/MobileBottomBar';
import { WelcomePopup } from '../components/WelcomePopup';
import { HomepageSkeleton } from '../components/ui/homepage-skeleton';
import { useCategories } from '../contexts/CategoryContext';
import { useServiceTypes } from '../hooks/useServiceTypes';

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

  const handleSearch = (searchData: {
    serviceTypeId: number | null;
    categoryId: number | null;
    adUrl: string;
  }) => {
    setSearchFilters({
      ...searchData,
      categoryId: searchData.categoryId || 3,
    });
  };

  // ✅ Mostrar skeleton completo mientras carga
  if (isLoading) {
    return <HomepageSkeleton />;
  }

  // ✅ Animación simultánea para todos los elementos
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.4,
        staggerChildren: 0.05,
        ease: [0.25, 0.46, 0.45, 0.94], // easeOutQuad
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };

  return (
    <motion.div
      className="min-h-screen bg-white"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Welcome Popup - Solo se muestra la primera vez */}
      <WelcomePopup />
      
      {/* Search Bar Header con Tabs */}
      <motion.div variants={itemVariants}>
        <AirbnbSearchBar onSearch={handleSearch} />
      </motion.div>
      
      {/* Main Content with proper spacing - Same as Airbnb */}
      <motion.div
        className="pt-3 md:pt-10 md:pb-0"
        style={{ 
          paddingTop: '12px', 
          paddingBottom: 'calc(65px + max(11px, env(safe-area-inset-bottom)))' // ✅ Altura exacta del bottom bar: 65px + padding
        }}
        variants={itemVariants}
      >
        <div className="md:pt-4" style={{ paddingTop: '8px' }} data-services-section>
          <HomepageWall 
            countryCode={countryCode}
            serviceTypeId={searchFilters.serviceTypeId}
            categoryId={searchFilters.categoryId}
          />
        </div>
      </motion.div>

      {/* Mobile Bottom Bar */}
      <motion.div variants={itemVariants}>
        <MobileBottomBar />
      </motion.div>
    </motion.div>
  );
};

export default HomePage;

