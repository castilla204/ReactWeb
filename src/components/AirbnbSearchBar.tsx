import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, ChevronDown, Link as LinkIcon, FolderTree } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useServiceTypes } from '../hooks/useServiceTypes';
import { useCategories } from '../contexts/CategoryContext';
import { useAuth } from '../contexts/AuthContext';
import { isAdmin } from '../utils/admin';
import cocheImg from '../media/cochepng.png';
import casaImg from '../media/casapng.png';
import motoImg from '../media/motopng.png';
import camaraImg from '../media/internet-61.png'; // Usar imagen existente para cámaras
// TODO: Reemplazar con imagen de caldera cuando esté disponible
import calderaImg from '../media/house.png'; // Placeholder - usar imagen de caldera cuando esté disponible
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from './ui/drawer';
import { ResponsiveModal } from './ui/responsive-modal';
import { Separator } from './ui/separator';

// ✅ IDs de categorías según la documentación
const CATEGORIES = {
  COCHES: 1,
  MOTOS: 2,
  INMOBILIARIA: 3,
  CAMARAS: 4,
  FONTANERIA: 5, // Asumiendo ID 5, ajustar si es diferente
} as const;

// ✅ Categorías restantes para el drawer
const DRAWER_CATEGORIES = [
  { id: CATEGORIES.MOTOS, name: 'Motos' },
  { id: CATEGORIES.CAMARAS, name: 'Cámaras' },
  { id: CATEGORIES.FONTANERIA, name: 'Fontanería' },
] as const;

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
  
  // El objeto user viene del backend con mayúsculas: Email, Role (no email, role)
  const userEmail = user?.Email || user?.email; // Compatibilidad con ambos formatos
  const userRole = user?.Role || user?.role; // Compatibilidad con ambos formatos
  
  const isAdminByEmail = userEmail ? isAdmin(userEmail) : false;
  const isAdminByRole = userRole === 'Admin' || userRole === 'admin';
  const userIsAdmin = isAuthenticated && (isAdminByEmail || isAdminByRole);
  
  // Debug: Log completo del objeto user
  useEffect(() => {
    console.log('🔍 ========== AIRBNB SEARCH BAR - USER OBJECT ==========');
    console.log('👤 User completo:', user);
    console.log('👤 User keys:', user ? Object.keys(user) : 'NO USER');
    console.log('📧 user?.Email:', user?.Email);
    console.log('📧 user?.email:', user?.email);
    console.log('📧 userEmail (final):', userEmail);
    console.log('👤 user?.Role:', user?.Role);
    console.log('👤 user?.role:', user?.role);
    console.log('👤 userRole (final):', userRole);
    console.log('✅ isAdminByEmail:', isAdminByEmail);
    console.log('✅ isAdminByRole:', isAdminByRole);
    console.log('🔐 isAuthenticated:', isAuthenticated);
    console.log('🎯 userIsAdmin (FINAL):', userIsAdmin);
    console.log('===================================================');
  }, [user, isAuthenticated, userEmail, userRole, isAdminByEmail, isAdminByRole, userIsAdmin]);
  
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
  // ✅ Estado para el tab activo y drawer de categorías
  const [activeTab, setActiveTab] = useState<'coches' | 'inmobiliaria' | 'drawer' | null>('coches');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  // ✅ Estado para la categoría del drawer que reemplaza a Inmobiliaria
  const [drawerCategoryReplacement, setDrawerCategoryReplacement] = useState<{ id: number; name: string; image: string } | null>(null);
  // ✅ Estado para el buscador de categorías
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const serviceTypeButtonRef = useRef<HTMLButtonElement>(null);
  const categoryButtonRef = useRef<HTMLButtonElement>(null);

  const selectedServiceType = serviceTypes.find(st => st.id === serviceTypeId);
  const selectedCategory = categories.find(c => c.id === categoryId);
  
  // ✅ Inicializar con Coches por defecto al cargar
  useEffect(() => {
    if (activeTab === 'coches' && !categoryId) {
      setCategoryId(CATEGORIES.COCHES);
      if (onSearch) {
        onSearch({
          serviceTypeId,
          categoryId: CATEGORIES.COCHES,
          adUrl,
        });
      }
    }
  }, []); // Solo al montar el componente
  
  // Debug: verificar que el estado se actualiza
  useEffect(() => {
    console.log('🔍 Estado actualizado:', {
      serviceTypeId,
      serviceTypesCount: serviceTypes.length,
      selectedServiceType: selectedServiceType?.name,
      categoryId,
      categoriesCount: categories.length,
      selectedCategory: selectedCategory?.name,
      activeTab,
    });
  }, [serviceTypeId, categoryId, selectedServiceType, selectedCategory, serviceTypes.length, categories.length, activeTab]);

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

  // ✅ Handler para seleccionar categoría desde los tabs
  const handleTabClick = (tab: 'coches' | 'inmobiliaria', categoryIdValue: number) => {
    setActiveTab(tab);
    setCategoryId(categoryIdValue);
    setIsDrawerOpen(false);
    
    // Si se hace clic en "inmobiliaria" y hay una categoría del drawer seleccionada, limpiarla
    if (tab === 'inmobiliaria' && categoryIdValue === CATEGORIES.INMOBILIARIA) {
      setDrawerCategoryReplacement(null);
    }
    
    // Llamar a onSearch para actualizar el wall
    if (onSearch) {
      onSearch({
        serviceTypeId,
        categoryId: categoryIdValue,
        adUrl,
      });
    }
    
    // NO hacer scroll automático - eliminado según solicitud del usuario
  };

  // ✅ Función helper para obtener la imagen de una categoría por nombre
  const getCategoryImage = (categoryName: string): string | null => {
    const nameLower = categoryName.toLowerCase();
    if (nameLower.includes('moto') && !nameLower.includes('agua')) return motoImg;
    if (nameLower.includes('coche') || nameLower.includes('vehículo')) return cocheImg;
    if (nameLower.includes('inmobiliaria') || nameLower.includes('casa') || nameLower.includes('inmueble')) return casaImg;
    if (nameLower.includes('cámara') || nameLower.includes('camara')) return camaraImg;
    if (nameLower.includes('fontanería') || nameLower.includes('fontaneria') || nameLower.includes('caldera')) return calderaImg;
    return null;
  };

  // ✅ Handler para seleccionar categoría desde el drawer
  const handleDrawerCategoryClick = (categoryIdValue: number, categoryName: string) => {
    // Obtener la imagen de la categoría
    const categoryImage = getCategoryImage(categoryName) || casaImg;
    
    // Guardar la categoría del drawer para reemplazar a Inmobiliaria
    setDrawerCategoryReplacement({
      id: categoryIdValue,
      name: categoryName,
      image: categoryImage
    });
    
    // Cambiar al tab de "inmobiliaria" (que ahora mostrará la categoría del drawer)
    setActiveTab('inmobiliaria');
    
    setCategoryId(categoryIdValue);
    setIsDrawerOpen(false);
    setCategorySearchQuery(''); // Limpiar búsqueda
    
    // Llamar a onSearch para actualizar el wall
    if (onSearch) {
      onSearch({
        serviceTypeId,
        categoryId: categoryIdValue,
        adUrl,
      });
    }
    
    // NO hacer scroll automático - eliminado según solicitud del usuario
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
      <div className="hidden md:block max-w-[1760px] mx-auto px-4 sm:px-6 lg:px-8 py-4 relative">
        {/* Botón Admin - Solo visible para admins */}
        {userIsAdmin && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2" style={{ zIndex: 1000 }}>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Botón Admin clickeado - Navegando a /admin');
                navigate('/admin');
              }}
              className="text-sm font-semibold text-red-600 hover:text-red-700 px-4 py-2 rounded-md hover:bg-red-50 transition-colors bg-white border-2 border-red-400 shadow-lg"
            >
              Admin
            </button>
          </div>
        )}
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
          {/* Coches Tab */}
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'coches'}
            tabIndex={0}
            data-tabid="tabBarItem-COCHES"
            id="search-block-tab-COCHES-desktop"
            onClick={() => handleTabClick('coches', CATEGORIES.COCHES)}
            onMouseEnter={() => setHoveredTab('coches')}
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
              background: 'none',
              border: 'none',
              cursor: 'pointer',
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
                fontWeight: activeTab === 'coches' ? 600 : 400,
                color: '#222222',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Circular", "Helvetica Neue", Helvetica, Arial, sans-serif',
                whiteSpace: 'nowrap',
                position: 'relative',
              }}
            >
              Coches
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
                transform: activeTab === 'coches' ? 'scaleX(1)' : 'scaleX(0)',
                transformOrigin: 'left',
                transition: 'transform 0.2s ease',
              }}
            />
          </button>

          {/* Inmobiliaria Tab - Puede mostrar categoría del drawer si está seleccionada */}
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'inmobiliaria'}
            tabIndex={-1}
            data-tabid="tabBarItem-INMOBILIARIA"
            id="search-block-tab-INMOBILIARIA-desktop"
            onClick={() => handleTabClick('inmobiliaria', drawerCategoryReplacement?.id || CATEGORIES.INMOBILIARIA)}
            onMouseEnter={() => setHoveredTab('inmobiliaria')}
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
              background: 'none',
              border: 'none',
              cursor: 'pointer',
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
                src={drawerCategoryReplacement?.image || casaImg}
                alt={drawerCategoryReplacement?.name || "Casa"}
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
                fontWeight: activeTab === 'inmobiliaria' ? 600 : 400,
                color: '#222222',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Circular", "Helvetica Neue", Helvetica, Arial, sans-serif',
                whiteSpace: 'nowrap',
                position: 'relative',
              }}
            >
              {drawerCategoryReplacement?.name || 'Inmobiliaria'}
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
                transform: activeTab === 'inmobiliaria' || hoveredTab === 'inmobiliaria' ? 'scaleX(1)' : 'scaleX(0)',
                transformOrigin: 'left',
                transition: 'transform 0.2s ease',
              }}
            />
          </button>

          {/* Services Tab - ResponsiveModal con más categorías (Drawer en móvil, Dialog en PC) */}
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'drawer'}
            tabIndex={-1}
            data-tabid="tabBarItem-SERVICES"
            id="search-block-tab-SERVICES-desktop"
            onClick={() => setIsDrawerOpen(true)}
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
              background: 'none',
              border: 'none',
              cursor: 'pointer',
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
            </span>
            <span
              style={{
                fontSize: '16px',
                lineHeight: '20px',
                fontWeight: activeTab === 'drawer' ? 600 : 400,
                color: '#222222',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Circular", "Helvetica Neue", Helvetica, Arial, sans-serif',
                whiteSpace: 'nowrap',
                position: 'relative',
              }}
            >
              Más
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
                transform: activeTab === 'drawer' || hoveredTab === 'services' ? 'scaleX(1)' : 'scaleX(0)',
                transformOrigin: 'left',
                transition: 'transform 0.2s ease',
              }}
            />
          </button>
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
              aria-label="Buscar revisor"
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
                      Buscar revisor
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
          {/* Coches Tab */}
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'coches'}
            tabIndex={0}
            data-tabid="tabBarItem-COCHES"
            id="search-block-tab-COCHES"
            onClick={() => handleTabClick('coches', CATEGORIES.COCHES)}
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
              background: 'none',
              border: 'none',
              cursor: 'pointer',
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
                fontWeight: activeTab === 'coches' ? 600 : 400,
                color: '#222222',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Circular", "Helvetica Neue", Helvetica, Arial, sans-serif',
                textAlign: 'center',
                width: '100%',
              }}
            >
              Coches
                  </span>
          </button>

          {/* Inmobiliaria Tab - Puede mostrar categoría del drawer si está seleccionada */}
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'inmobiliaria'}
            tabIndex={-1}
            data-tabid="tabBarItem-INMOBILIARIA"
            id="search-block-tab-INMOBILIARIA"
            onClick={() => handleTabClick('inmobiliaria', drawerCategoryReplacement?.id || CATEGORIES.INMOBILIARIA)}
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
              background: 'none',
              border: 'none',
              cursor: 'pointer',
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
                src={drawerCategoryReplacement?.image || casaImg}
                alt={drawerCategoryReplacement?.name || "Casa"}
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
                      fontWeight: activeTab === 'inmobiliaria' ? 600 : 400,
                color: '#222222',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Circular", "Helvetica Neue", Helvetica, Arial, sans-serif',
                textAlign: 'center',
                      width: '100%',
                    }}
                  >
              {drawerCategoryReplacement?.name || 'Inmobiliaria'}
                  </span>
          </button>

          {/* Services Tab - ResponsiveModal con más categorías (Mobile) */}
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'drawer'}
            tabIndex={-1}
            data-tabid="tabBarItem-SERVICES"
            id="search-block-tab-SERVICES"
            onClick={() => setIsDrawerOpen(true)}
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
              background: 'none',
              border: 'none',
              cursor: 'pointer',
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
            </span>
            <span
              style={{
                fontSize: '10px',
                lineHeight: '12px',
                fontWeight: activeTab === 'drawer' ? 600 : 400,
                color: '#222222',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Circular", "Helvetica Neue", Helvetica, Arial, sans-serif',
                textAlign: 'center',
                width: '100%',
              }}
            >
              Más
            </span>
          </button>

          {/* Underline indicator - Se mueve según el tab activo */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: activeTab === 'coches' 
                ? 'calc(40px + ((100% - 80px) / 3) / 2 - 20px)'
                : activeTab === 'inmobiliaria'
                ? 'calc(40px + ((100% - 80px) / 3) + ((100% - 80px) / 3) / 2 - 20px)'
                : 'calc(40px + ((100% - 80px) / 3) * 2 + ((100% - 80px) / 3) / 2 - 20px)',
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
      
      {/* ResponsiveModal compartido para "Más Categorías" - Drawer en móvil, Dialog en PC - Mejorado */}
      <ResponsiveModal
        open={isDrawerOpen}
        onOpenChange={(open) => {
          setIsDrawerOpen(open);
          if (!open) {
            setCategorySearchQuery(''); // Limpiar búsqueda al cerrar
          }
        }}
        title="Más Categorías"
        drawerClassName="w-full"
        dialogClassName="max-w-lg"
      >
        <div className="flex flex-col" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Buscador moderno sin recuadro */}
          <div className="px-4 pt-2 pb-3" style={{ flex: '0 0 auto' }}>
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
          
          {/* Lista de categorías con scroll */}
          <div 
            style={{ flex: '1 1 auto', overflowY: 'auto', overflowX: 'hidden', minHeight: 0, paddingRight: 0 }}
            className="custom-scrollbar"
          >
            {categoriesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-muted-foreground">Cargando categorías...</div>
              </div>
            ) : (
              <div className="flex flex-col">
                {categories
                  .filter(cat => {
                    // Filtrar las categorías que ya están en los tabs principales
                    if (cat.id === CATEGORIES.COCHES || cat.id === CATEGORIES.INMOBILIARIA) {
                      return false;
                    }
                    // Filtrar por búsqueda
                    if (categorySearchQuery.trim()) {
                      return cat.name.toLowerCase().includes(categorySearchQuery.toLowerCase());
                    }
                    return true;
                  })
                  .filter(cat => cat.isActive) // Solo categorías activas
                  .map((category, index, array) => {
                    const categoryImage = getCategoryImage(category.name);
                    const isSelected = categoryId === category.id;
                    const isLast = index === array.length - 1;
                    
                    return (
                      <React.Fragment key={category.id}>
                        <button
                          type="button"
                          onClick={() => handleDrawerCategoryClick(category.id, category.name)}
                          className={`
                            flex items-center gap-3 px-4 py-3 transition-colors w-full
                            ${isSelected
                              ? 'bg-muted'
                              : 'hover:bg-muted/50'
                            }
                          `}
                        >
                          {/* Imagen pequeña a la izquierda */}
                          {categoryImage ? (
                            <img
                              src={categoryImage}
                              alt={category.name}
                              className="flex-shrink-0 w-9 h-9 object-contain"
                            />
                          ) : (
                            <div className="flex-shrink-0 w-9 h-9 bg-muted rounded-md flex items-center justify-center">
                              <FolderTree className="w-5 h-5 text-muted-foreground" />
                            </div>
                          )}
                          
                          {/* Texto normal a la derecha */}
                          <div className="flex-1 text-left min-w-0">
                            <h3 className="text-base font-medium leading-tight">
                              {category.name}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-0.5">
                              Explorar servicios
                            </p>
                          </div>
                          
                          {/* Indicador de selección */}
                          {isSelected && (
                            <div className="flex-shrink-0">
                              <div className="w-2 h-2 bg-foreground rounded-full" />
                            </div>
                          )}
                        </button>
                        {/* Separador elegante entre categorías */}
                        {!isLast && <Separator className="mx-4" />}
                      </React.Fragment>
                    );
                  })}
                
                {/* Mensaje si no hay resultados */}
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
                    <div className="text-sm text-muted-foreground">
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
