import React from 'react';
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

  return (
    <div className="min-h-screen bg-white">
      {/* Search Bar Header */}
      <AirbnbSearchBar />
      
      {/* Main Content with proper spacing - Same as Airbnb */}
      <div className="pt-6 md:pt-10 pb-20 md:pb-0" style={{ paddingTop: '24px', paddingBottom: '80px' }}>
        <div className="md:pt-4" style={{ paddingTop: '16px' }}>
          <HomepageWall countryCode={countryCode} />
        </div>
      </div>

      {/* Mobile Bottom Bar */}
      <MobileBottomBar />
    </div>
  );
};

export default HomePage;

