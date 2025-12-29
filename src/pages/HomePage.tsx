import React, { useState } from 'react';
import { HomepageWall } from '../components/HomepageWall';
import { AirbnbSearchBar } from '../components/AirbnbSearchBar';
import { MobileBottomBar } from '../components/MobileBottomBar';

const HomePage: React.FC = () => {
  // Detectar país del navegador (fallback a ES)
  const getCountryCode = (): string => {
    if (typeof navigator !== 'undefined' && navigator.language) {
      const lang = navigator.language.split('-')[1];
      if (lang) return lang.toUpperCase();
    }
    return 'ES';
  };

  const countryCode = getCountryCode();
  
  // Estado para los filtros de búsqueda
  const [searchFilters, setSearchFilters] = useState<{
    serviceTypeId: number | null;
    categoryId: number | null;
    adUrl: string;
  }>({
    serviceTypeId: null,
    categoryId: null,
    adUrl: '',
  });

  const handleSearch = (searchData: {
    serviceTypeId: number | null;
    categoryId: number | null;
    adUrl: string;
  }) => {
    setSearchFilters(searchData);
    // Hacer scroll a las secciones de servicios
    setTimeout(() => {
      const servicesSection = document.querySelector('[data-services-section]');
      if (servicesSection) {
        servicesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Search Bar Header */}
      <AirbnbSearchBar onSearch={handleSearch} />
      
      {/* Main Content with proper spacing - Same as Airbnb */}
      <div className="pt-6 md:pt-10 pb-20 md:pb-0" style={{ paddingTop: '24px', paddingBottom: '80px' }}>
        <div className="md:pt-4" style={{ paddingTop: '16px' }} data-services-section>
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

