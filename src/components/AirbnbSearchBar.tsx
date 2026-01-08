import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, ChevronDown, FolderTree, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useServiceTypes } from '../hooks/useServiceTypes';
import { useCategories } from '../contexts/CategoryContext';
import { useAuth } from '../contexts/AuthContext';
import { isAdmin } from '../utils/admin';
import cocheImg from '../media/cochepng.png';
import casaImg from '../media/casapng.png';
import motoImg from '../media/motopng.png';
import camaraImg from '../media/internet-61.png';
import calderaImg from '../media/house.png';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';
import { ResponsiveModal } from './ui/responsive-modal';
import { Separator } from './ui/separator';

const CATEGORIES = {
  COCHES: 1,
  MOTOS: 2,
  INMOBILIARIA: 3,
  CAMARAS: 4,
  FONTANERIA: 5,
} as const;

interface AirbnbSearchBarProps {
  onSearch?: (searchData: {
    serviceTypeId: number | null;
    categoryId: number | null;
    adUrl: string;
  }) => void;
}

export const AirbnbSearchBar: React.FC<AirbnbSearchBarProps> = ({ onSearch }) => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { serviceTypes, isLoading: serviceTypesLoading } = useServiceTypes();
  const { categories, loading: categoriesLoading } = useCategories();
  
  const userEmail = (user as any)?.Email || user?.email;
  const userRole = (user as any)?.Role || user?.role;
  const isAdminByEmail = userEmail ? isAdmin(userEmail) : false;
  const isAdminByRole = userRole === 'Admin' || userRole === 'admin';
  const userIsAdmin = isAuthenticated && (isAdminByEmail || isAdminByRole);
  
  const [serviceTypeId, setServiceTypeId] = useState<number | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [adUrl, setAdUrl] = useState('');
  const [activeField, setActiveField] = useState<string | null>(null);
  const [isServiceTypeOpen, setIsServiceTypeOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [expandedAccordion, setExpandedAccordion] = useState<string | null>(null);
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'coches' | 'inmobiliaria' | 'drawer' | null>('coches');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerCategoryReplacement, setDrawerCategoryReplacement] = useState<{ id: number; name: string; image: string } | null>(null);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  const selectedServiceType = serviceTypes.find(st => st.id === serviceTypeId);
  const selectedCategory = categories.find(c => c.id === categoryId);
  
  // Eliminado: No establecer categoría por defecto
  // useEffect(() => {
  //   if (activeTab === 'coches' && !categoryId) {
  //     setCategoryId(CATEGORIES.COCHES);
  //     if (onSearch) {
  //       onSearch({
  //         serviceTypeId,
  //         categoryId: CATEGORIES.COCHES,
  //         adUrl,
  //       });
  //     }
  //   }
  // }, []);

  const handleSearch = () => {
    if (onSearch) {
      onSearch({
        serviceTypeId,
        categoryId,
        adUrl,
      });
    }
    
    if (serviceTypeId && categoryId) {
      const params = new URLSearchParams();
      params.append('serviceTypeId', serviceTypeId.toString());
      params.append('categoryId', categoryId.toString());
      if (adUrl) params.append('adUrl', adUrl);
      navigate(`/crear-busqueda?${params.toString()}`);
    }
  };

  const handleTabClick = (tab: 'coches' | 'inmobiliaria', categoryIdValue: number) => {
    setActiveTab(tab);
    setCategoryId(categoryIdValue);
    setIsDrawerOpen(false);
    
    if (tab === 'inmobiliaria' && categoryIdValue === CATEGORIES.INMOBILIARIA) {
      setDrawerCategoryReplacement(null);
    }
    
    if (onSearch) {
      onSearch({
        serviceTypeId,
        categoryId: categoryIdValue,
        adUrl,
      });
    }
  };

  const getCategoryImage = (categoryName: string): string | null => {
    const nameLower = categoryName.toLowerCase();
    if (nameLower.includes('moto') && !nameLower.includes('agua')) return motoImg;
    if (nameLower.includes('coche') || nameLower.includes('vehículo')) return cocheImg;
    if (nameLower.includes('inmobiliaria') || nameLower.includes('casa') || nameLower.includes('inmueble')) return casaImg;
    if (nameLower.includes('cámara') || nameLower.includes('camara')) return camaraImg;
    if (nameLower.includes('fontanería') || nameLower.includes('fontaneria') || nameLower.includes('caldera')) return calderaImg;
    return null;
  };

  const handleDrawerCategoryClick = (categoryIdValue: number, categoryName: string) => {
    const categoryImage = getCategoryImage(categoryName) || casaImg;
    
    setDrawerCategoryReplacement({
      id: categoryIdValue,
      name: categoryName,
      image: categoryImage
    });
    
    setActiveTab('inmobiliaria');
    setCategoryId(categoryIdValue);
    setIsDrawerOpen(false);
    setCategorySearchQuery('');
    
    if (onSearch) {
      onSearch({
        serviceTypeId,
        categoryId: categoryIdValue,
        adUrl,
      });
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        // Cerrar todos los popovers cuando se hace clic fuera
        setActiveField(null);
        setIsServiceTypeOpen(false);
        setIsCategoryOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-[#fbfbfb] border-b border-gray-200">
      {/* Desktop */}
      <div className="hidden md:block max-w-[1760px] mx-auto px-4 sm:px-6 lg:px-8 py-4 relative">
        {userIsAdmin && (
            <button
            onClick={() => navigate('/admin')}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-[1000] text-sm font-semibold text-red-600 hover:text-red-700 px-4 py-2 rounded-md hover:bg-red-50 transition-colors bg-white border-2 border-red-400 shadow-lg"
            >
              Admin
            </button>
        )}
        
        <form
          ref={formRef}
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
            <Popover 
              open={isServiceTypeOpen} 
              onOpenChange={(open) => {
                setIsServiceTypeOpen(open);
              }}
              modal={false}
            >
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
                        onPointerDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setServiceTypeId(serviceType.id);
                          setActiveField('serviceType');
                          // Forzar que el popover se mantenga abierto
                          setTimeout(() => {
                            setIsServiceTypeOpen(true);
                          }, 0);
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
            <Popover open={isCategoryOpen} onOpenChange={setIsCategoryOpen} modal={false}>
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
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setCategoryId(category.id);
                            if (onSearch) {
                              onSearch({
                                serviceTypeId,
                                categoryId: category.id,
                                adUrl,
                              });
                            }
                            // Mantener el popover abierto después de la selección
                            // setIsCategoryOpen(false);
                            // setActiveField(null);
                          }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          onPointerDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
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
                    className="text-sm text-gray-500 truncate"
                    style={{ fontSize: '14px', lineHeight: '18px' }}
                  >
                    {adUrl || 'Pega la URL aquí'}
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

        {/* Tabs Desktop */}
        <div className="flex items-center justify-center mt-4 gap-8 max-w-[850px] mx-auto relative">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'coches'}
            onClick={() => handleTabClick('coches', CATEGORIES.COCHES)}
            onMouseEnter={() => setHoveredTab('coches')}
            onMouseLeave={() => setHoveredTab(null)}
            className="flex items-center gap-3 py-4 relative bg-transparent border-none cursor-pointer"
          >
            <img src={cocheImg} alt="Coche" className="w-8 h-8 object-contain" />
            <span className={`text-base whitespace-nowrap ${activeTab === 'coches' ? 'font-semibold' : 'font-normal'}`}>
              Coches
            </span>
            <span className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 origin-left transition-transform ${
              activeTab === 'coches' ? 'scale-x-100' : 'scale-x-0'
            }`} />
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'inmobiliaria'}
            onClick={() => handleTabClick('inmobiliaria', drawerCategoryReplacement?.id || CATEGORIES.INMOBILIARIA)}
            onMouseEnter={() => setHoveredTab('inmobiliaria')}
            onMouseLeave={() => setHoveredTab(null)}
            className="flex items-center gap-3 py-4 relative bg-transparent border-none cursor-pointer"
          >
              <img
                src={drawerCategoryReplacement?.image || casaImg}
                alt={drawerCategoryReplacement?.name || "Casa"}
              className="w-8 h-8 object-contain"
            />
            <span className={`text-base whitespace-nowrap ${activeTab === 'inmobiliaria' ? 'font-semibold' : 'font-normal'}`}>
              {drawerCategoryReplacement?.name || 'Inmobiliaria'}
            </span>
            <span className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 origin-left transition-transform ${
              activeTab === 'inmobiliaria' || hoveredTab === 'inmobiliaria' ? 'scale-x-100' : 'scale-x-0'
            }`} />
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'drawer'}
            onClick={() => setIsDrawerOpen(true)}
            onMouseEnter={() => setHoveredTab('services')}
            onMouseLeave={() => setHoveredTab(null)}
            className="flex items-center gap-3 py-4 relative bg-transparent border-none cursor-pointer"
          >
            <div className="flex items-center justify-center gap-1 w-8 h-8">
              <div className="w-1.5 h-1.5 rounded-full bg-gray-900" />
              <div className="w-1.5 h-1.5 rounded-full bg-gray-900" />
              <div className="w-1.5 h-1.5 rounded-full bg-gray-900" />
              </div>
            <span className={`text-base whitespace-nowrap ${activeTab === 'drawer' ? 'font-semibold' : 'font-normal'}`}>
              Más
            </span>
            <span className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 origin-left transition-transform ${
              activeTab === 'drawer' || hoveredTab === 'services' ? 'scale-x-100' : 'scale-x-0'
            }`} />
          </button>
        </div>
      </div>

      {/* Mobile */}
      <div className="md:hidden px-6 py-3">
        <button
          type="button"
          onClick={() => setIsMobileSearchOpen(true)}
          className="w-full bg-white border border-gray-300 rounded-full shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-3 px-4 h-14"
              aria-label="Buscar revisor"
        >
          <Search className="w-3 h-3 text-gray-600" />
          <span className="text-sm font-medium text-gray-900">Buscar revisor</span>
            </button>

        {/* Tabs Mobile */}
        <div className="flex items-center justify-start px-10 relative w-full overflow-x-auto mt-0">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'coches'}
            onClick={() => handleTabClick('coches', CATEGORIES.COCHES)}
            className="flex flex-col items-center justify-center py-2 min-w-[40px] flex-1 bg-transparent border-none cursor-pointer"
          >
            <img src={cocheImg} alt="Coche" className="w-12 h-12 object-contain mb-0.5" />
            <span className={`text-[10px] leading-3 text-center w-full ${activeTab === 'coches' ? 'font-semibold' : 'font-normal'}`}>
              Coches
                  </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'inmobiliaria'}
            onClick={() => handleTabClick('inmobiliaria', drawerCategoryReplacement?.id || CATEGORIES.INMOBILIARIA)}
            className="flex flex-col items-center justify-center py-2 min-w-[40px] flex-1 bg-transparent border-none cursor-pointer"
          >
              <img
                src={drawerCategoryReplacement?.image || casaImg}
                alt={drawerCategoryReplacement?.name || "Casa"}
              className="w-12 h-12 object-contain mb-0.5"
            />
            <span className={`text-[10px] leading-3 text-center w-full ${activeTab === 'inmobiliaria' ? 'font-semibold' : 'font-normal'}`}>
              {drawerCategoryReplacement?.name || 'Inmobiliaria'}
                  </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'drawer'}
            onClick={() => setIsDrawerOpen(true)}
            className="flex flex-col items-center justify-center py-2 min-w-[40px] flex-1 bg-transparent border-none cursor-pointer"
          >
            <div className="flex items-center justify-center gap-1 w-12 h-12 mb-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-gray-900" />
              <div className="w-1.5 h-1.5 rounded-full bg-gray-900" />
              <div className="w-1.5 h-1.5 rounded-full bg-gray-900" />
              </div>
            <span className={`text-[10px] leading-3 text-center w-full ${activeTab === 'drawer' ? 'font-semibold' : 'font-normal'}`}>
              Más
            </span>
          </button>

          <div
            className="absolute bottom-0 h-0.5 w-10 bg-gray-900 rounded transition-all duration-300"
            style={{
              left: activeTab === 'coches' 
                ? 'calc(40px + ((100% - 80px) / 3) / 2 - 20px)'
                : activeTab === 'inmobiliaria'
                ? 'calc(40px + ((100% - 80px) / 3) + ((100% - 80px) / 3) / 2 - 20px)'
                : 'calc(40px + ((100% - 80px) / 3) * 2 + ((100% - 80px) / 3) / 2 - 20px)',
            }}
          />
        </div>
      </div>

      {/* Modal Mobile */}
      {isMobileSearchOpen && typeof document !== 'undefined' && createPortal(
        <>
          {/* Botón cerrar arriba derecha - Fuera del div principal */}
          <div className="md:hidden fixed top-4 right-4 z-[60]">
            <button
              type="button"
              onClick={() => setIsMobileSearchOpen(false)}
              className="p-2 bg-white hover:bg-gray-100 rounded-full transition-colors flex items-center justify-center shadow-sm"
              aria-label="Cerrar"
            >
              <span>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 32 32" 
                  aria-hidden="true" 
                  role="presentation" 
                  focusable="false"
                  style={{ display: 'block', fill: 'none', height: '16px', width: '16px', stroke: 'currentcolor', strokeWidth: 3, overflow: 'visible' }}
                >
                  <path d="m6 6 20 20M26 6 6 26"></path>
                </svg>
              </span>
            </button>
          </div>
          
          <div className="md:hidden fixed inset-0 z-50 bg-gray-100 flex flex-col">
            <div className="flex-1 overflow-y-auto">
              <div className="pt-16 px-4 pb-4 space-y-3">
              {/* Categorías - Div más alto con categorías visibles */}
              <div 
                className={`bg-white border border-gray-300 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col ${
                  expandedAccordion === 'where' ? 'fixed inset-0 z-[60] rounded-none' : ''
                }`}
                style={expandedAccordion === 'where' 
                  ? { height: '100vh', minHeight: '100vh', maxHeight: '100vh' }
                  : { height: '45vh', minHeight: '300px', maxHeight: '500px' }
                }
              >
                {expandedAccordion === 'where' ? (
                  <>
                    {/* Header con botón atrás y buscador cuando está expandido */}
                    <div className="flex items-center gap-3 p-4 border-b border-gray-200">
                      <button
                        type="button"
                        onClick={() => setExpandedAccordion(null)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors flex items-center justify-center"
                        aria-label="Atrás"
                      >
                        <ArrowLeft className="w-4 h-4" strokeWidth={4} />
                      </button>
                      <div className="flex-1">
                        <form role="search" className="w-full">
                          <div>
                            <label 
                              htmlFor="categories-search-input"
                              className="flex items-center w-full px-4 py-3 border border-gray-300 rounded-lg bg-white"
                              style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Circular", "Helvetica Neue", Helvetica, Arial, sans-serif' }}
                            >
                              <div className="flex items-center justify-center mr-3">
                                <svg 
                                  viewBox="0 0 32 32" 
                                  xmlns="http://www.w3.org/2000/svg" 
                                  aria-hidden="true" 
                                  role="presentation" 
                                  focusable="false"
                                  style={{ display: 'block', fill: 'none', height: '16px', width: '16px', stroke: 'currentcolor', strokeWidth: 4, overflow: 'visible' }}
                                >
                                  <path d="m20.666 20.666 10 10"></path>
                                  <path d="m24.0002 12.6668c0 6.2593-5.0741 11.3334-11.3334 11.3334-6.2592 0-11.3333-5.0741-11.3333-11.3334 0-6.2592 5.0741-11.3333 11.3333-11.3333 6.2593 0 11.3334 5.0741 11.3334 11.3333z" fill="none"></path>
                                </svg>
                              </div>
                <input 
                                id="categories-search-input"
                                type="search"
                  placeholder="Buscar categorías"
                  value={categorySearchQuery}
                  onChange={(e) => setCategorySearchQuery(e.target.value)}
                                className="flex-1 border-0 text-sm outline-none bg-transparent text-gray-900 placeholder:text-gray-400"
                                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Circular", "Helvetica Neue", Helvetica, Arial, sans-serif' }}
                                autoComplete="off"
                                autoCorrect="off"
                                spellCheck="false"
                                aria-label="Buscar categorías"
                              />
                            </label>
                          </div>
                        </form>
                      </div>
              </div>

                    {/* Contenido expandido al 100% */}
                    <div className="flex-1 overflow-y-auto px-4 py-4">
                      <div>
                  {categoriesLoading ? (
                          <div className="text-center py-4 text-sm text-gray-500" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Circular", "Helvetica Neue", Helvetica, Arial, sans-serif' }}>
                            Cargando...
                          </div>
                  ) : (
                    <div>
                      {categories
                        .filter(cat => cat.isActive)
                              .filter(cat => {
                                if (categorySearchQuery.trim()) {
                                  return cat.name.toLowerCase().includes(categorySearchQuery.toLowerCase());
                                }
                                return true;
                              })
                        .map((category) => {
                          const categoryImage = getCategoryImage(category.name);
                          return (
                            <button
                              key={category.id}
                              type="button"
                              onClick={() => {
                                setCategoryId(category.id);
                                setCategorySearchQuery('');
                                      setExpandedAccordion(null);
                                    }}
                                    className={`w-full flex items-center gap-3 p-3 mb-2 rounded-lg text-left transition-colors border-2 ${
                                      categoryId === category.id 
                                        ? 'bg-gray-900 text-white border-gray-900' 
                                        : 'hover:bg-gray-50 border-transparent'
                                    }`}
                            >
                              {categoryImage ? (
                                <img 
                                  src={categoryImage}
                                  alt=""
                                  className="w-12 h-12 rounded-lg object-contain"
                                />
                              ) : (
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                                  categoryId === category.id ? 'bg-white/20' : 'bg-gray-100'
                                }`}>
                                  <FolderTree className={`w-6 h-6 ${categoryId === category.id ? 'text-white' : 'text-gray-400'}`} />
                                </div>
                              )}
                              <div>
                                    <div className={`text-sm font-medium ${categoryId === category.id ? 'text-white' : 'text-gray-900'}`} style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Circular", "Helvetica Neue", Helvetica, Arial, sans-serif' }}>
                                  {category.name}
                                </div>
                                      <div className={`text-xs ${categoryId === category.id ? 'text-white/80' : 'text-gray-500'}`} style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Circular", "Helvetica Neue", Helvetica, Arial, sans-serif' }}>
                                  Explorar servicios
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      {categories
                        .filter(cat => cat.isActive)
                              .filter(cat => {
                                if (categorySearchQuery.trim()) {
                                  return cat.name.toLowerCase().includes(categorySearchQuery.toLowerCase());
                                }
                                return true;
                              }).length === 0 && (
                              <div className="text-center py-4 text-sm text-gray-500" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Circular", "Helvetica Neue", Helvetica, Arial, sans-serif' }}>
                          No se encontraron categorías
                        </div>
                      )}
                    </div>
                  )}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-4">
                      <h2 
                        tabIndex={-1}
                        className="text-2xl font-semibold text-gray-900"
                        style={{ 
                          fontFamily: '-apple-system, BlinkMacSystemFont, "Circular", "Helvetica Neue", Helvetica, Arial, sans-serif',
                          lineHeight: '1.2',
                          letterSpacing: '-0.01em'
                        }}
                      >
                        <div className="font-semibold">
                          Categorías
                        </div>
                      </h2>
            </div>

                    <div className="flex-1 overflow-y-auto px-4 pb-4">
                      <div className="mb-4">
                        <form role="search" className="w-full">
                          <div>
                            <label 
                              htmlFor="categories-search-input-collapsed"
                              className="flex items-center w-full px-4 py-3 border border-gray-300 rounded-lg bg-white"
                              style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Circular", "Helvetica Neue", Helvetica, Arial, sans-serif' }}
                            >
                              <div className="flex items-center justify-center mr-3">
                                <svg 
                                  viewBox="0 0 32 32" 
                                  xmlns="http://www.w3.org/2000/svg" 
                                  aria-hidden="true" 
                                  role="presentation" 
                                  focusable="false"
                                  style={{ display: 'block', fill: 'none', height: '16px', width: '16px', stroke: 'currentcolor', strokeWidth: 4, overflow: 'visible' }}
                                >
                                  <path d="m20.666 20.666 10 10"></path>
                                  <path d="m24.0002 12.6668c0 6.2593-5.0741 11.3334-11.3334 11.3334-6.2592 0-11.3333-5.0741-11.3333-11.3334 0-6.2592 5.0741-11.3333 11.3333-11.3333 6.2593 0 11.3334 5.0741 11.3334 11.3333z" fill="none"></path>
                                </svg>
                              </div>
                              <input
                                id="categories-search-input-collapsed"
                                type="search"
                                placeholder="Buscar categorías"
                                value={categorySearchQuery}
                                onChange={(e) => setCategorySearchQuery(e.target.value)}
                                className="flex-1 border-0 text-sm outline-none bg-transparent text-gray-900 placeholder:text-gray-400"
                                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Circular", "Helvetica Neue", Helvetica, Arial, sans-serif' }}
                                autoComplete="off"
                                autoCorrect="off"
                                spellCheck="false"
                                aria-label="Buscar categorías"
                              />
                            </label>
                          </div>
                        </form>
                      </div>

                      <div>
                        {categoriesLoading ? (
                          <div className="text-center py-4 text-sm text-gray-500" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Circular", "Helvetica Neue", Helvetica, Arial, sans-serif' }}>
                            Cargando...
                          </div>
                        ) : (
                          <div>
                            {categories
                              .filter(cat => cat.isActive)
                              .filter(cat => {
                                if (categorySearchQuery.trim()) {
                                  return cat.name.toLowerCase().includes(categorySearchQuery.toLowerCase());
                                }
                                return true;
                              })
                              .map((category) => {
                                const categoryImage = getCategoryImage(category.name);
                                return (
                <button
                                    key={category.id}
                  type="button"
                                    onClick={() => {
                                      setCategoryId(category.id);
                                      setCategorySearchQuery('');
                                    }}
                                    className={`w-full flex items-center gap-3 p-3 mb-2 rounded-lg text-left transition-colors border-2 ${
                                      categoryId === category.id 
                                        ? 'bg-gray-900 text-white border-gray-900' 
                                        : 'hover:bg-gray-50 border-transparent'
                                    }`}
                                  >
                                    {categoryImage ? (
                                      <img 
                                        src={categoryImage}
                                        alt=""
                                        className="w-12 h-12 rounded-lg object-contain"
                                      />
                                    ) : (
                                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                                        categoryId === category.id ? 'bg-white/20' : 'bg-gray-100'
                                      }`}>
                                        <FolderTree className={`w-6 h-6 ${categoryId === category.id ? 'text-white' : 'text-gray-400'}`} />
                                      </div>
                                    )}
                  <div>
                                      <div className={`text-sm font-medium ${categoryId === category.id ? 'text-white' : 'text-gray-900'}`} style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Circular", "Helvetica Neue", Helvetica, Arial, sans-serif' }}>
                                        {category.name}
                    </div>
                                      <div className={`text-xs ${categoryId === category.id ? 'text-white/80' : 'text-gray-500'}`} style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Circular", "Helvetica Neue", Helvetica, Arial, sans-serif' }}>
                                        Explorar servicios
                    </div>
                  </div>
                                  </button>
                                );
                              })}
                            {categories
                              .filter(cat => cat.isActive)
                              .filter(cat => {
                                if (categorySearchQuery.trim()) {
                                  return cat.name.toLowerCase().includes(categorySearchQuery.toLowerCase());
                                }
                                return true;
                              }).length === 0 && (
                              <div className="text-center py-4 text-sm text-gray-500" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Circular", "Helvetica Neue", Helvetica, Arial, sans-serif' }}>
                                No se encontraron categorías
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Separador y flecha al final - Solo cuando NO está expandido */}
                {expandedAccordion !== 'where' && (
                  <div className="border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setExpandedAccordion('where')}
                      className="w-full flex items-center justify-center p-4 bg-transparent border-none cursor-pointer"
                    >
                      <ChevronDown className="w-3 h-3 text-gray-400" style={{ strokeWidth: 4 }} />
                    </button>
                  </div>
                )}
              </div>

              {/* Tipo de servicio - Rectángulo con sombra */}
              <div className="bg-white border border-gray-300 rounded-2xl shadow-sm hover:shadow-md transition-all">
                <button
                  type="button"
                  onClick={() => setExpandedAccordion(expandedAccordion === 'type' ? null : 'type')}
                  className="w-full flex items-center justify-between p-4 bg-transparent border-none cursor-pointer"
                >
                  <label className="text-xs font-semibold text-gray-900" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Circular", "Helvetica Neue", Helvetica, Arial, sans-serif' }}>
                    Tipo de servicio
                  </label>
                  <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${expandedAccordion === 'type' ? 'rotate-180' : ''}`} style={{ strokeWidth: 4 }} />
                </button>
                
                {expandedAccordion === 'type' && (
                  <div className="px-4 pb-4">
                    {serviceTypesLoading ? (
                      <div className="text-center py-4 text-sm text-gray-500">Cargando...</div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {serviceTypes.map((st) => (
                          <button
                            key={st.id}
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setServiceTypeId(st.id);
                              // Mantener el desplegable abierto
                              setExpandedAccordion('type');
                            }}
                            className={`w-full px-3 py-3 rounded-lg text-left transition-colors flex flex-col gap-1 ${
                              serviceTypeId === st.id 
                                ? 'bg-gray-900 text-white' 
                                : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                            }`}
                          >
                            <span className="text-sm font-semibold">{st.name}</span>
                            {st.description && (
                              <span className={`text-xs ${
                                serviceTypeId === st.id 
                                  ? 'text-gray-300' 
                                  : 'text-gray-600'
                              }`}>
                                {st.description}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* URL del anuncio - Rectángulo con sombra */}
              <div className="bg-white border border-gray-300 rounded-2xl shadow-sm hover:shadow-md transition-all">
                <button
                  type="button"
                  onClick={() => setExpandedAccordion(expandedAccordion === 'url' ? null : 'url')}
                  className="w-full flex items-center justify-between p-4 bg-transparent border-none cursor-pointer"
                >
                  <label className="text-xs font-semibold text-gray-900 flex items-center gap-1" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Circular", "Helvetica Neue", Helvetica, Arial, sans-serif' }}>
                      URL del anuncio
                    <span className="text-gray-400 font-normal">(opcional)</span>
                  </label>
                  <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${expandedAccordion === 'url' ? 'rotate-180' : ''}`} style={{ strokeWidth: 4 }} />
                </button>
                
                {expandedAccordion === 'url' && (
                  <div className="px-4 pb-4">
                    <input
                      type="text"
                      placeholder="Pega la URL aquí..."
                      value={adUrl}
                      onChange={(e) => setAdUrl(e.target.value)}
                      className="w-full px-3 py-3 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400 transition-colors"
                      autoFocus
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-gray-200 bg-white flex justify-between gap-4">
            <button
              type="button"
              onClick={() => {
                setServiceTypeId(null);
                setCategoryId(null);
                setAdUrl('');
                setCategorySearchQuery('');
                setExpandedAccordion(null);
              }}
              className="px-4 py-2 text-sm font-semibold text-gray-900 underline bg-transparent border-none cursor-pointer"
            >
              Restablecer
            </button>
            <button
              type="button"
              onClick={() => {
                handleSearch();
                setIsMobileSearchOpen(false);
                setExpandedAccordion(null);
              }}
              className="px-6 py-3.5 bg-[#FF385C] text-white rounded-lg text-sm font-semibold border-none cursor-pointer flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              Buscar
            </button>
          </div>
        </div>
        </>,
        document.body
      )}

      {/* Modal Más Categorías */}
      <ResponsiveModal
        open={isDrawerOpen}
        onOpenChange={(open) => {
          setIsDrawerOpen(open);
          if (!open) {
            setCategorySearchQuery('');
          }
        }}
        title="Más Categorías"
        drawerClassName="w-full"
        dialogClassName="max-w-lg"
      >
        <div className="flex flex-col h-full">
          <div className="px-4 pt-2 pb-3">
            <div className="relative">
              <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar categorías..."
                value={categorySearchQuery}
                onChange={(e) => setCategorySearchQuery(e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none border-0 border-b border-gray-200 focus:border-gray-400 transition-colors"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto min-h-0">
            {categoriesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-gray-500">Cargando categorías...</div>
              </div>
            ) : (
              <div className="flex flex-col">
                {categories
                  .filter(cat => {
                    if (cat.id === CATEGORIES.COCHES || cat.id === CATEGORIES.INMOBILIARIA) {
                      return false;
                    }
                    if (categorySearchQuery.trim()) {
                      return cat.name.toLowerCase().includes(categorySearchQuery.toLowerCase());
                    }
                    return true;
                  })
                  .filter(cat => cat.isActive)
                  .map((category, index, array) => {
                    const categoryImage = getCategoryImage(category.name);
                    const isSelected = categoryId === category.id;
                    const isLast = index === array.length - 1;
                    
                    return (
                      <React.Fragment key={category.id}>
                        <button
                          type="button"
                          onClick={() => handleDrawerCategoryClick(category.id, category.name)}
                          className={`flex items-center gap-3 px-4 py-3 transition-colors w-full ${
                            isSelected ? 'bg-gray-100' : 'hover:bg-gray-50'
                          }`}
                        >
                          {categoryImage ? (
                            <img
                              src={categoryImage}
                              alt={category.name}
                              className="flex-shrink-0 w-9 h-9 object-contain"
                            />
                          ) : (
                            <div className="flex-shrink-0 w-9 h-9 bg-gray-100 rounded-md flex items-center justify-center">
                              <FolderTree className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                          
                          <div className="flex-1 text-left min-w-0">
                            <h3 className="text-base font-medium leading-tight">
                              {category.name}
                            </h3>
                            <p className="text-sm text-gray-500 mt-0.5">
                              Explorar servicios
                            </p>
                          </div>
                          
                          {isSelected && (
                            <div className="flex-shrink-0">
                              <div className="w-2 h-2 bg-gray-900 rounded-full" />
                            </div>
                          )}
                        </button>
                        {!isLast && <Separator className="mx-4" />}
                      </React.Fragment>
                    );
                  })}
                
                {categories
                  .filter(cat => {
                    if (cat.id === CATEGORIES.COCHES || cat.id === CATEGORIES.INMOBILIARIA) return false;
                    if (categorySearchQuery.trim()) {
                      return cat.name.toLowerCase().includes(categorySearchQuery.toLowerCase());
                    }
                    return true;
                  })
                  .filter(cat => cat.isActive).length === 0 && (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-sm text-gray-500">
                      {categorySearchQuery.trim() 
                        ? 'No se encontraron categorías' 
                        : 'No hay categorías disponibles'}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </ResponsiveModal>
    </header>
  );
};
