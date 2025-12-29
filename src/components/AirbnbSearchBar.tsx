import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Link as LinkIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useServiceTypes } from '../hooks/useServiceTypes';
import { useCategories } from '../contexts/CategoryContext';
import cocheImg from '../media/cochepng.png';
import casaImg from '../media/casapng.png';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';

interface AirbnbSearchBarProps {
  onSearch?: (searchData: {
    serviceTypeId: number | null;
    categoryId: number | null;
    adUrl: string;
  }) => void;
}

export const AirbnbSearchBar: React.FC<AirbnbSearchBarProps> = ({ onSearch }) => {
  const navigate = useNavigate();
  const { serviceTypes, isLoading: serviceTypesLoading } = useServiceTypes();
  const { categories, loading: categoriesLoading } = useCategories();
  
  const [serviceTypeId, setServiceTypeId] = useState<number | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [adUrl, setAdUrl] = useState('');
  const [activeField, setActiveField] = useState<string | null>(null);
  const [isServiceTypeOpen, setIsServiceTypeOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedServiceType = serviceTypes.find(st => st.id === serviceTypeId);
  const selectedCategory = categories.find(c => c.id === categoryId);

  const handleSearch = () => {
    if (onSearch) {
      onSearch({
        serviceTypeId,
        categoryId,
        adUrl,
      });
    }
    // Si no hay onSearch, no hacer nada - el buscador solo filtra en la misma página
  };

  // Cerrar cuando se hace click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setActiveField(null);
        setIsServiceTypeOpen(false);
        setIsCategoryOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50" style={{ backgroundColor: '#fbfbfb', borderBottom: '1px solid #EBEBEB', position: 'sticky' }}>
      {/* Desktop: Barra de búsqueda completa */}
      <div className="hidden md:block max-w-[1760px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <form
          ref={containerRef}
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="flex items-center justify-center w-full"
        >
          {/* Search Bar Container - Exact Airbnb style */}
          <div
            className={`flex items-center bg-white border border-gray-300 rounded-full shadow-sm hover:shadow-md transition-all ${
              activeField ? 'shadow-md' : ''
            }`}
            style={{
              height: '66px',
              maxWidth: '850px',
              width: '100%',
              minWidth: '300px',
            }}
          >
            {/* Service Type - Tipo de Servicio */}
            <Popover open={isServiceTypeOpen} onOpenChange={setIsServiceTypeOpen}>
              <PopoverTrigger asChild>
                <div
                  className={`flex-1 px-4 sm:px-6 py-3 border-r border-gray-300 cursor-pointer transition-colors ${
                    activeField === 'serviceType' || isServiceTypeOpen ? 'bg-gray-50' : 'hover:bg-gray-50'
                  } ${activeField === 'serviceType' ? 'rounded-l-full' : ''}`}
                  onClick={() => {
                    setActiveField('serviceType');
                    setIsServiceTypeOpen(true);
                  }}
                  style={{ minHeight: '66px', minWidth: '120px' }}
                >
                  <div className="flex flex-col justify-center h-full">
                    <label
                      className="text-xs font-semibold text-gray-900 mb-1"
                      style={{ fontSize: '12px', lineHeight: '16px', fontWeight: 600 }}
                    >
                      Tipo de servicio
                    </label>
                    <div
                      className={`text-sm truncate flex items-center gap-1 ${
                        selectedServiceType ? 'text-gray-900 font-medium' : 'text-gray-500'
                      }`}
                      style={{ fontSize: '14px', lineHeight: '18px' }}
                    >
                      {selectedServiceType ? selectedServiceType.name : 'Selecciona tipo'}
                      <ChevronDown className="w-4 h-4 flex-shrink-0" />
                    </div>
                  </div>
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0" align="start">
                <div className="max-h-[300px] overflow-y-auto">
                  {serviceTypesLoading ? (
                    <div className="p-4 text-center text-sm text-gray-500">Cargando...</div>
                  ) : serviceTypes.length === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-500">No hay tipos disponibles</div>
                  ) : (
                    serviceTypes.map((serviceType) => (
                      <button
                        key={serviceType.id}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setServiceTypeId(serviceType.id);
                          setIsServiceTypeOpen(false);
                          setActiveField(null);
                        }}
                        className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                          serviceTypeId === serviceType.id ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="font-medium text-sm text-gray-900">{serviceType.name}</div>
                        {serviceType.description && (
                          <div className="text-xs text-gray-500 mt-1">{serviceType.description}</div>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {/* Category - Categoría */}
            <Popover open={isCategoryOpen} onOpenChange={setIsCategoryOpen}>
              <PopoverTrigger asChild>
                <div
                  className={`flex-1 px-4 sm:px-6 py-3 border-r border-gray-300 cursor-pointer transition-colors ${
                    activeField === 'category' || isCategoryOpen ? 'bg-gray-50' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    setActiveField('category');
                    setIsCategoryOpen(true);
                  }}
                  style={{ minHeight: '66px', minWidth: '120px' }}
                >
                  <div className="flex flex-col justify-center h-full">
                    <label
                      className="text-xs font-semibold text-gray-900 mb-1"
                      style={{ fontSize: '12px', lineHeight: '16px', fontWeight: 600 }}
                    >
                      Categoría
                    </label>
                    <div
                      className={`text-sm truncate flex items-center gap-1 ${
                        selectedCategory ? 'text-gray-900 font-medium' : 'text-gray-500'
                      }`}
                      style={{ fontSize: '14px', lineHeight: '18px' }}
                    >
                      {selectedCategory ? selectedCategory.name : 'Selecciona categoría'}
                      <ChevronDown className="w-4 h-4 flex-shrink-0" />
                    </div>
                  </div>
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0" align="start">
                <div className="max-h-[300px] overflow-y-auto">
                  {categoriesLoading ? (
                    <div className="p-4 text-center text-sm text-gray-500">Cargando...</div>
                  ) : categories.length === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-500">No hay categorías disponibles</div>
                  ) : (
                    categories
                      .filter(cat => cat.isActive)
                      .map((category) => (
                        <button
                          key={category.id}
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setCategoryId(category.id);
                            setIsCategoryOpen(false);
                            setActiveField(null);
                          }}
                          className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                            categoryId === category.id ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="font-medium text-sm text-gray-900">{category.name}</div>
                        </button>
                      ))
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {/* Ad URL - URL del Anuncio (Opcional) */}
            <div
              className={`flex-1 px-4 sm:px-6 py-3 cursor-pointer transition-colors ${
                activeField === 'adUrl' ? 'bg-gray-50' : 'hover:bg-gray-50'
              } ${activeField === 'adUrl' ? 'rounded-r-full' : ''}`}
              onClick={() => setActiveField('adUrl')}
              style={{ minHeight: '66px', minWidth: '120px' }}
            >
              <div className="flex flex-col justify-center h-full">
                <label
                  className="text-xs font-semibold text-gray-900 mb-1 flex items-center gap-1"
                  style={{ fontSize: '12px', lineHeight: '16px', fontWeight: 600 }}
                >
                  URL del anuncio
                  <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                {activeField === 'adUrl' ? (
                  <input
                    type="url"
                    placeholder="https://..."
                    value={adUrl}
                    onChange={(e) => setAdUrl(e.target.value)}
                    className="text-sm text-gray-600 placeholder-gray-400 bg-transparent border-none outline-none w-full"
                    style={{ fontSize: '14px', lineHeight: '18px' }}
                    autoFocus
                  />
                ) : (
                  <div
                    className="text-sm text-gray-500 truncate flex items-center gap-1"
                    style={{ fontSize: '14px', lineHeight: '18px' }}
                  >
                    {adUrl || (
                      <>
                        <LinkIcon className="w-4 h-4 flex-shrink-0" />
                        <span>Pega la URL aquí</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Search Button */}
            <button
              type="submit"
              className="ml-2 mr-2 p-3 bg-[#FF385C] hover:bg-[#E61E4D] rounded-full text-white transition-colors flex items-center justify-center flex-shrink-0"
              style={{ width: '48px', height: '48px', minWidth: '48px' }}
              aria-label="Search"
            >
              <Search className="w-4 h-4" strokeWidth={2.5} />
            </button>
          </div>
        </form>
      </div>

      {/* Mobile: Botón grande estilo Airbnb - Estructura exacta del HTML */}
      <div className="md:hidden">
        <div style={{ padding: '12px 24px' }}>
          <div className="c1tqtfcq" data-xray-jira-component="Guest: Search Bar">
            <button
              type="button"
              onClick={handleSearch}
              className="w-full bg-white border border-gray-300 rounded-full shadow-sm hover:shadow-md transition-all"
              style={{
                height: '56px',
                minHeight: '56px',
                paddingLeft: '16px',
                paddingRight: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label="Start your search"
              data-xray-jira-component="Guest: Search Bar"
            >
              {/* span.b15xd7zr con data-button-content="true" */}
              <span 
                data-button-content="true"
                className="b15xd7zr"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                }}
              >
                {/* span.moz9gxt */}
                <span className="moz9gxt" style={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                }}>
                  {/* div.dyig47i - Contiene icono Y texto */}
                  <div className="dyig47i" style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    gap: '12px',
                  }}>
                    {/* span.s1hvfp9h - Contenedor del SVG */}
                    <span className="s1hvfp9h" style={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      flexShrink: 0,
                    }}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 32 32"
                        aria-hidden="true"
                        role="presentation"
                        focusable="false"
                        style={{
                          display: 'block',
                          height: '12px',
                          width: '12px',
                          fill: 'currentcolor',
                        }}
                      >
                        <path d="M13 0a13 13 0 0 1 10.5 20.67l7.91 7.92-2.82 2.82-7.92-7.91A12.94 12.94 0 0 1 13 26a13 13 0 1 1 0-26zm0 4a9 9 0 1 0 0 18 9 9 0 0 0 0-18z"></path>
                      </svg>
                    </span>

                    {/* span.p19nk050 - Texto principal */}
                    <span
                      className="p19nk050"
                      elementtiming="time_to_search_rendered"
                      style={{
                        fontSize: '14px',
                        lineHeight: '17px',
                        fontWeight: 550,
                        color: '#222222',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        display: 'block',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Circular", "Helvetica Neue", Helvetica, Arial, sans-serif',
                        letterSpacing: 'normal',
                      }}
                    >
                      Start your search
                    </span>
                  </div>
                </span>
              </span>
            </button>
          </div>
        </div>

        {/* Mobile: Tab Navigation Bar */}
        <div
          role="tablist"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              paddingLeft: '40px',
              paddingRight: '40px',
              paddingTop: '0px',
              paddingBottom: '0px',
              gap: '0',
              position: 'relative',
              width: '100%',
              overflowX: 'auto',
            }}
        >
          {/* Homes Tab */}
          <a
            href="/homes"
            role="tab"
            aria-selected="true"
            tabIndex={0}
            data-tabid="tabBarItem-STAYS"
            id="search-block-tab-STAYS"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px 0px',
              textDecoration: 'none',
              color: '#222222',
              position: 'relative',
              minWidth: '40px',
              flex: '1 1 0',
            }}
          >
            <span style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              marginBottom: '2px', 
              position: 'relative',
              width: '100%',
            }}>
              <img
                src={cocheImg}
                alt="Coche"
                style={{
                  display: 'block',
                  height: '48px',
                  width: '48px',
                  objectFit: 'contain',
                }}
              />
            </span>
            <span
              style={{
                fontSize: '10px',
                lineHeight: '12px',
                fontWeight: 600,
                color: '#222222',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Circular", "Helvetica Neue", Helvetica, Arial, sans-serif',
                textAlign: 'center',
                width: '100%',
              }}
            >
              Homes
            </span>
          </a>

          {/* Experiences Tab */}
          <a
            href="/experiences"
            role="tab"
            aria-selected="false"
            tabIndex={-1}
            data-tabid="tabBarItem-EXPERIENCES"
            id="search-block-tab-EXPERIENCES"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px 0px',
              textDecoration: 'none',
              color: '#222222',
              position: 'relative',
              minWidth: '40px',
              flex: '1 1 0',
            }}
          >
            <span style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              marginBottom: '2px', 
              position: 'relative',
              width: '100%',
            }}>
              <img
                src={casaImg}
                alt="Casa"
                style={{
                  display: 'block',
                  height: '48px',
                  width: '48px',
                  objectFit: 'contain',
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '50%',
                  transform: 'translateX(calc(50% + 20px))',
                  backgroundColor: '#FF385C',
                  color: 'white',
                  fontSize: '8px',
                  fontWeight: 600,
                  padding: '2px 4px',
                  borderRadius: '4px',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Circular", "Helvetica Neue", Helvetica, Arial, sans-serif',
                  whiteSpace: 'nowrap',
                }}
              >
                NEW
              </span>
            </span>
            <span
              style={{
                fontSize: '10px',
                lineHeight: '12px',
                fontWeight: 400,
                color: '#222222',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Circular", "Helvetica Neue", Helvetica, Arial, sans-serif',
                textAlign: 'center',
                width: '100%',
              }}
            >
              Experiences
            </span>
          </a>

          {/* Services Tab */}
          <a
            href="/services"
            role="tab"
            aria-selected="false"
            tabIndex={-1}
            data-tabid="tabBarItem-SERVICES"
            id="search-block-tab-SERVICES"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px 0px',
              textDecoration: 'none',
              color: '#222222',
              position: 'relative',
              minWidth: '40px',
              flex: '1 1 0',
            }}
          >
            <span style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              marginBottom: '2px', 
              position: 'relative',
              width: '100%',
            }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  height: '48px',
                  width: '48px',
                }}
              >
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#222222',
                  }}
                />
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#222222',
                  }}
                />
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#222222',
                  }}
                />
              </div>
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '50%',
                  transform: 'translateX(calc(50% + 14px))',
                  backgroundColor: '#FF385C',
                  color: 'white',
                  fontSize: '8px',
                  fontWeight: 600,
                  padding: '2px 4px',
                  borderRadius: '4px',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Circular", "Helvetica Neue", Helvetica, Arial, sans-serif',
                  whiteSpace: 'nowrap',
                }}
              >
                NEW
              </span>
            </span>
            <span
              style={{
                fontSize: '10px',
                lineHeight: '12px',
                fontWeight: 400,
                color: '#222222',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Circular", "Helvetica Neue", Helvetica, Arial, sans-serif',
                textAlign: 'center',
                width: '100%',
              }}
            >
              Services
            </span>
          </a>

          {/* Underline indicator */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 'calc(40px + ((100% - 80px) / 3) / 2 - 20px)',
              height: '3px',
              width: '40px',
              backgroundColor: '#222222',
              borderRadius: '2px',
              transition: 'left 0.3s ease',
            }}
          />
        </div>
      </div>
    </header>
  );
};
