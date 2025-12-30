import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
import { Drawer, DrawerContent } from './ui/drawer';

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
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isMobileServiceTypeOpen, setIsMobileServiceTypeOpen] = useState(false);
  const [isMobileCategoryOpen, setIsMobileCategoryOpen] = useState(false);
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const serviceTypeButtonRef = useRef<HTMLButtonElement>(null);
  const categoryButtonRef = useRef<HTMLButtonElement>(null);

  const selectedServiceType = serviceTypes.find(st => st.id === serviceTypeId);
  const selectedCategory = categories.find(c => c.id === categoryId);
  
  // Debug: verificar que el estado se actualiza
  useEffect(() => {
    console.log('🔍 Estado actualizado:', {
      serviceTypeId,
      serviceTypesCount: serviceTypes.length,
      selectedServiceType: selectedServiceType?.name,
      categoryId,
      categoriesCount: categories.length,
      selectedCategory: selectedCategory?.name,
    });
  }, [serviceTypeId, categoryId, selectedServiceType, selectedCategory, serviceTypes.length, categories.length]);

  const handleSearch = () => {
    // Si hay onSearch (desde HomePage), llamarlo para filtrar en la misma página
    if (onSearch) {
      onSearch({
        serviceTypeId,
        categoryId,
        adUrl,
      });
    }
    
    // Si hay serviceTypeId Y categoryId, navegar a /crear-busqueda al paso del mapa
    if (serviceTypeId && categoryId) {
      const params = new URLSearchParams();
      params.append('serviceTypeId', serviceTypeId.toString());
      params.append('categoryId', categoryId.toString());
      if (adUrl) params.append('adUrl', adUrl);
      
      const queryString = params.toString();
      navigate(`/crear-busqueda?${queryString}`);
    }
  };

  // Cerrar cuando se hace click fuera (desktop)
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

  // Cerrar dropdowns móviles cuando se hace clic fuera
  useEffect(() => {
    if (!isMobileSearchOpen) return;
    
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as HTMLElement;
      // Si el clic es en un botón del dropdown o en el contenido del dropdown, no cerrar
      if (target.closest('[data-dropdown-service]') || target.closest('[data-dropdown-category]')) {
        return;
      }
      // Si el clic es en el contenido del portal del dropdown, no cerrar
      if (target.closest('.mobile-dropdown-content')) {
        return;
      }
      // Cerrar los dropdowns móviles
      setIsMobileServiceTypeOpen(false);
      setIsMobileCategoryOpen(false);
    };

    // Usar un pequeño delay para evitar que se cierre inmediatamente al abrir
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isMobileSearchOpen]);

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
                      className="text-sm truncate flex items-center gap-1"
                      style={{ 
                        fontSize: '14px', 
                        lineHeight: '18px',
                        color: selectedServiceType ? '#222222' : '#717171',
                        fontWeight: selectedServiceType ? 600 : 400,
                      }}
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
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('✅ Click en serviceType:', {
                            id: serviceType.id,
                            name: serviceType.name,
                            serviceTypesArray: serviceTypes.map(st => ({ id: st.id, name: st.name })),
                          });
                          // Actualizar el estado directamente
                          const newServiceTypeId = serviceType.id;
                          setServiceTypeId(newServiceTypeId);
                          console.log('🔄 setServiceTypeId a:', newServiceTypeId);
                          // Cerrar el popover después de un pequeño delay
                          requestAnimationFrame(() => {
                          setIsServiceTypeOpen(false);
                          setActiveField(null);
                          });
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
                      className="text-sm truncate flex items-center gap-1"
                      style={{ 
                        fontSize: '14px', 
                        lineHeight: '18px',
                        color: selectedCategory ? '#222222' : '#717171',
                        fontWeight: selectedCategory ? 600 : 400,
                      }}
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
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('✅ Click en category:', {
                              id: category.id,
                              name: category.name,
                              categoriesArray: categories.map(c => ({ id: c.id, name: c.name })),
                            });
                            // Actualizar el estado directamente
                            const newCategoryId = category.id;
                            setCategoryId(newCategoryId);
                            console.log('🔄 setCategoryId a:', newCategoryId);
                            // Cerrar el popover después de un pequeño delay
                            requestAnimationFrame(() => {
                            setIsCategoryOpen(false);
                            setActiveField(null);
                            });
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
                    type="text"
                    placeholder="Pega cualquier texto aquí..."
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

        {/* Desktop: Tab Navigation Bar */}
        <div
          role="tablist"
          className="flex items-center justify-center mt-4"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: '0px',
            paddingBottom: '0px',
            gap: '32px',
            position: 'relative',
            width: '100%',
            maxWidth: '850px',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          {/* Homes Tab */}
          <a
            href="/homes"
            role="tab"
            aria-selected="true"
            tabIndex={0}
            data-tabid="tabBarItem-STAYS"
            id="search-block-tab-STAYS-desktop"
            onMouseEnter={() => setHoveredTab('homes')}
            onMouseLeave={() => setHoveredTab(null)}
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'flex-start',
              padding: '16px 0px',
              textDecoration: 'none',
              color: '#222222',
              position: 'relative',
              gap: '12px',
            }}
          >
            <span style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              position: 'relative',
              flexShrink: 0,
            }}>
              <img
                src={cocheImg}
                alt="Coche"
                style={{
                  display: 'block',
                  height: '32px',
                  width: '32px',
                  objectFit: 'contain',
                }}
              />
            </span>
            <span
              style={{
                fontSize: '16px',
                lineHeight: '20px',
                fontWeight: 600,
                color: '#222222',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Circular", "Helvetica Neue", Helvetica, Arial, sans-serif',
                whiteSpace: 'nowrap',
                position: 'relative',
              }}
            >
              Homes
            </span>
            {/* Underline indicator - debajo de todo el tab */}
            <span
              style={{
                position: 'absolute',
                bottom: '0px',
                left: '0px',
                right: '0px',
                height: '2px',
                backgroundColor: '#222222',
                transform: 'scaleX(1)',
                transformOrigin: 'left',
              }}
            />
          </a>

          {/* Experiences Tab */}
          <a
            href="/experiences"
            role="tab"
            aria-selected="false"
            tabIndex={-1}
            data-tabid="tabBarItem-EXPERIENCES"
            id="search-block-tab-EXPERIENCES-desktop"
            onMouseEnter={() => setHoveredTab('experiences')}
            onMouseLeave={() => setHoveredTab(null)}
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'flex-start',
              padding: '16px 0px',
              textDecoration: 'none',
              color: '#222222',
              position: 'relative',
              gap: '12px',
            }}
          >
            <span style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              position: 'relative',
              flexShrink: 0,
            }}>
              <img
                src={casaImg}
                alt="Casa"
                style={{
                  display: 'block',
                  height: '32px',
                  width: '32px',
                  objectFit: 'contain',
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '-8px',
                  backgroundColor: '#FF385C',
                  color: 'white',
                  fontSize: '10px',
                  fontWeight: 600,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Circular", "Helvetica Neue", Helvetica, Arial, sans-serif',
                  whiteSpace: 'nowrap',
                  lineHeight: '12px',
                }}
              >
                NEW
              </span>
            </span>
            <span
              style={{
                fontSize: '16px',
                lineHeight: '20px',
                fontWeight: 400,
                color: '#222222',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Circular", "Helvetica Neue", Helvetica, Arial, sans-serif',
                whiteSpace: 'nowrap',
                position: 'relative',
              }}
            >
              Experiences
            </span>
            {/* Underline indicator - debajo de todo el tab */}
            <span
              style={{
                position: 'absolute',
                bottom: '0px',
                left: '0px',
                right: '0px',
                height: '2px',
                backgroundColor: '#222222',
                transform: hoveredTab === 'experiences' ? 'scaleX(1)' : 'scaleX(0)',
                transformOrigin: 'left',
                transition: 'transform 0.2s ease',
              }}
            />
          </a>

          {/* Services Tab */}
          <a
            href="/services"
            role="tab"
            aria-selected="false"
            tabIndex={-1}
            data-tabid="tabBarItem-SERVICES"
            id="search-block-tab-SERVICES-desktop"
            onMouseEnter={() => setHoveredTab('services')}
            onMouseLeave={() => setHoveredTab(null)}
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'flex-start',
              padding: '16px 0px',
              textDecoration: 'none',
              color: '#222222',
              position: 'relative',
              gap: '12px',
            }}
          >
            <span style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              position: 'relative',
              flexShrink: 0,
            }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  height: '32px',
                  width: '32px',
                }}
              >
                <div
                  style={{
                    width: '5px',
                    height: '5px',
                    borderRadius: '50%',
                    backgroundColor: '#222222',
                  }}
                />
                <div
                  style={{
                    width: '5px',
                    height: '5px',
                    borderRadius: '50%',
                    backgroundColor: '#222222',
                  }}
                />
                <div
                  style={{
                    width: '5px',
                    height: '5px',
                    borderRadius: '50%',
                    backgroundColor: '#222222',
                  }}
                />
              </div>
              <span
                style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '-8px',
                  backgroundColor: '#FF385C',
                  color: 'white',
                  fontSize: '10px',
                  fontWeight: 600,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Circular", "Helvetica Neue", Helvetica, Arial, sans-serif',
                  whiteSpace: 'nowrap',
                  lineHeight: '12px',
                }}
              >
                NEW
              </span>
            </span>
            <span
              style={{
                fontSize: '16px',
                lineHeight: '20px',
                fontWeight: 400,
                color: '#222222',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Circular", "Helvetica Neue", Helvetica, Arial, sans-serif',
                whiteSpace: 'nowrap',
                position: 'relative',
              }}
            >
              Services
            </span>
            {/* Underline indicator - debajo de todo el tab */}
            <span
              style={{
                position: 'absolute',
                bottom: '0px',
                left: '0px',
                right: '0px',
                height: '2px',
                backgroundColor: '#222222',
                transform: hoveredTab === 'services' ? 'scaleX(1)' : 'scaleX(0)',
                transformOrigin: 'left',
                transition: 'transform 0.2s ease',
              }}
            />
          </a>
        </div>
      </div>

      {/* Mobile: Botón grande estilo Airbnb - Estructura exacta del HTML */}
      <div className="md:hidden">
        <div style={{ padding: '12px 24px' }}>
          <div className="c1tqtfcq" data-xray-jira-component="Guest: Search Bar">
        <button
          type="button"
          onClick={() => {
            // Cerrar Popovers del desktop antes de abrir el drawer móvil
            setIsServiceTypeOpen(false);
            setIsCategoryOpen(false);
            setActiveField(null);
            setIsMobileSearchOpen(true);
          }}
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

      {/* Mobile Search Modal/Drawer - Mismo contenido que PC */}
      <Drawer open={isMobileSearchOpen} onOpenChange={(open) => {
        setIsMobileSearchOpen(open);
        // Cerrar dropdowns cuando se cierra el drawer
        if (!open) {
          setIsMobileServiceTypeOpen(false);
          setIsMobileCategoryOpen(false);
        }
      }}>
        <DrawerContent className="max-h-[90vh] flex flex-col bg-white outline-none border-0 rounded-none" style={{ zIndex: 10000 }}>
          {/* Contenido del formulario - Igual que desktop */}
          <div className="flex-1 overflow-y-auto px-4 py-6" style={{ position: 'relative' }}>
            <div className="space-y-4">
              {/* Service Type */}
              <div data-dropdown-service className="relative">
                <label className="block text-sm font-semibold text-gray-900 mb-2">Tipo de servicio</label>
                <div className="relative">
                  <button
                    ref={serviceTypeButtonRef}
                    type="button"
                    onClick={() => {
                      setIsMobileServiceTypeOpen(!isMobileServiceTypeOpen);
                      if (!isMobileServiceTypeOpen) {
                        setIsMobileCategoryOpen(false);
                      }
                    }}
                    className="w-full text-left px-4 py-3 border border-gray-300 rounded-lg hover:border-gray-900 transition-colors flex items-center justify-between"
                  >
                    <span className={`text-sm ${selectedServiceType ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>
                      {selectedServiceType ? selectedServiceType.name : 'Selecciona tipo'}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isMobileServiceTypeOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isMobileServiceTypeOpen && serviceTypeButtonRef.current && typeof document !== 'undefined' && createPortal(
                    <div 
                      className="mobile-dropdown-content fixed bg-white border border-gray-300 rounded-lg shadow-lg max-h-[300px] overflow-y-auto"
                      style={{ 
                        top: serviceTypeButtonRef.current.getBoundingClientRect().bottom + 4,
                        left: serviceTypeButtonRef.current.getBoundingClientRect().left,
                        width: serviceTypeButtonRef.current.getBoundingClientRect().width,
                        maxWidth: 'calc(100vw - 32px)',
                        zIndex: 10002,
                        pointerEvents: 'auto'
                      }}
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                    >
                      {serviceTypesLoading ? (
                        <div className="p-4 text-center text-sm text-gray-500">Cargando...</div>
                      ) : serviceTypes.length === 0 ? (
                        <div className="p-4 text-center text-sm text-gray-500">No hay tipos disponibles</div>
                      ) : (
                        serviceTypes.map((serviceType) => (
                          <button
                            key={serviceType.id}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log('✅ Click en serviceType móvil:', serviceType.id);
                              setServiceTypeId(serviceType.id);
                              setIsMobileServiceTypeOpen(false);
                            }}
                            onTouchEnd={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log('✅ Touch en serviceType móvil:', serviceType.id);
                              setServiceTypeId(serviceType.id);
                              setIsMobileServiceTypeOpen(false);
                            }}
                            className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                              serviceTypeId === serviceType.id ? 'bg-blue-50' : ''
                            }`}
                            style={{ pointerEvents: 'auto', touchAction: 'manipulation' }}
                          >
                            <div className="font-medium text-sm text-gray-900">{serviceType.name}</div>
                            {serviceType.description && (
                              <div className="text-xs text-gray-500 mt-1">{serviceType.description}</div>
                            )}
                          </button>
                        ))
                      )}
                    </div>,
                    document.body
                  )}
                </div>
              </div>

              {/* Category */}
              <div data-dropdown-category className="relative">
                <label className="block text-sm font-semibold text-gray-900 mb-2">Categoría</label>
                <div className="relative">
                  <button
                    ref={categoryButtonRef}
                    type="button"
                    onClick={() => {
                      setIsMobileCategoryOpen(!isMobileCategoryOpen);
                      if (!isMobileCategoryOpen) {
                        setIsMobileServiceTypeOpen(false);
                      }
                    }}
                    className="w-full text-left px-4 py-3 border border-gray-300 rounded-lg hover:border-gray-900 transition-colors flex items-center justify-between"
                  >
                    <span className={`text-sm ${selectedCategory ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>
                      {selectedCategory ? selectedCategory.name : 'Selecciona categoría'}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isMobileCategoryOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isMobileCategoryOpen && categoryButtonRef.current && typeof document !== 'undefined' && createPortal(
                    <div 
                      className="mobile-dropdown-content fixed bg-white border border-gray-300 rounded-lg shadow-lg max-h-[300px] overflow-y-auto"
                      style={{ 
                        top: categoryButtonRef.current.getBoundingClientRect().bottom + 4,
                        left: categoryButtonRef.current.getBoundingClientRect().left,
                        width: categoryButtonRef.current.getBoundingClientRect().width,
                        maxWidth: 'calc(100vw - 32px)',
                        zIndex: 10002,
                        pointerEvents: 'auto'
                      }}
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                    >
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
                              onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('✅ Click en category móvil:', category.id);
                                setCategoryId(category.id);
                                setIsMobileCategoryOpen(false);
                              }}
                              onTouchEnd={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('✅ Touch en category móvil:', category.id);
                                setCategoryId(category.id);
                                setIsMobileCategoryOpen(false);
                              }}
                              className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                                categoryId === category.id ? 'bg-blue-50' : ''
                              }`}
                              style={{ pointerEvents: 'auto', touchAction: 'manipulation' }}
                            >
                              <div className="font-medium text-sm text-gray-900">{category.name}</div>
                            </button>
                          ))
                      )}
                    </div>,
                    document.body
                  )}
                </div>
              </div>

              {/* Ad URL */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1">
                  URL del anuncio
                  <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Pega cualquier texto aquí..."
                  value={adUrl}
                  onChange={(e) => setAdUrl(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900 transition-colors text-sm"
                />
              </div>
            </div>
          </div>

          {/* Footer con botones */}
          <div className="border-t border-gray-200 px-4 py-4 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => {
                setServiceTypeId(null);
                setCategoryId(null);
                setAdUrl('');
              }}
              className="px-4 py-2 text-sm font-semibold text-gray-900 underline hover:no-underline transition-all"
            >
              Clear all
            </button>
            <button
              type="button"
              onClick={() => {
                handleSearch();
                setIsMobileSearchOpen(false);
              }}
              className="px-6 py-3 bg-[#FF385C] hover:bg-[#E61E4D] text-white rounded-lg font-semibold text-sm transition-colors flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              Search
            </button>
          </div>
        </DrawerContent>
      </Drawer>
    </header>
  );
};
