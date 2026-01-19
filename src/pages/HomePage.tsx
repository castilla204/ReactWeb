import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { HomepageWall } from '../components/HomepageWall';
import { AirbnbSearchBar } from '../components/AirbnbSearchBar';
import { MobileBottomBar } from '../components/MobileBottomBar';
import { WelcomePopup } from '../components/WelcomePopup';

const HomePage: React.FC = () => {
  const location = useLocation();
  
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
    categoryId: 1, // ✅ Por defecto Coches (categoryId: 1)
    adUrl: '',
  });

  const handleSearch = (searchData: {
    serviceTypeId: number | null;
    categoryId: number | null;
    adUrl: string;
  }) => {
    setSearchFilters({
      ...searchData,
      categoryId: searchData.categoryId || 1,
    });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Welcome Popup - Solo se muestra la primera vez */}
      <WelcomePopup />
      
      {/* Search Bar Header con Tabs */}
      <AirbnbSearchBar onSearch={handleSearch} />
      
      {/* Main Content with proper spacing - Same as Airbnb */}
      <div className="pt-3 md:pt-10 pb-20 md:pb-0" style={{ 
        paddingTop: '12px', 
        paddingBottom: 'max(80px, calc(80px + env(safe-area-inset-bottom)))' 
      }}>
        <div className="md:pt-4" style={{ paddingTop: '8px' }} data-services-section>
          <HomepageWall 
            countryCode={countryCode}
            serviceTypeId={searchFilters.serviceTypeId}
            categoryId={searchFilters.categoryId}
          />
        </div>
      </div>

      {/* Mobile Bottom Bar */}
      <MobileBottomBar />
    </div>
  );
};

export default HomePage;

