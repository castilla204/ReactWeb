import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, FolderTree, ArrowLeft, Filter } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useServiceTypes } from '../hooks/useServiceTypes';
import { useCategories } from '../contexts/CategoryContext';
import { useAuth } from '../contexts/AuthContext';
import { isAdmin } from '../utils/admin';
import { useLoadScript } from '@react-google-maps/api';

const libraries: ('drawing' | 'geometry' | 'places')[] = ['drawing', 'geometry', 'places'];
// Importar imágenes directamente desde src/media para que Vite las procese
import casapngImg from '../media/casapng.png';
import cochepngImg from '../media/cochepng.png';
import motorcycleImg from '../media/motorcycle.png';
import motoaguaImg from '../media/motoagua.png';
import internet61Img from '../media/internet-61.png';
import houseImg from '../media/house.png';

// Mapa de imágenes importadas
const imageMap: Record<string, string> = {
  'casapng.png': casapngImg,
  'cochepng.png': cochepngImg,
  'motopng.png': motorcycleImg, // Usar motorcycle.png como motopng
  'motorcycle.png': motorcycleImg,
  'motoagua.png': motoaguaImg,
  'internet-61.png': internet61Img,
  'house.png': houseImg,
};

// Función para obtener la ruta de imagen (desde src/media con Vite)
const getImagePath = (filename: string): string => {
  // Si la imagen está en el mapa, usar la importación de Vite (con hash automático)
  if (imageMap[filename]) {
    return imageMap[filename];
  }
  // Fallback a ruta desde public si no está importada
  return `/media/${filename}`;
};

// Ya no necesitamos blob URLs ni carga asíncrona
// Vite maneja el caché automáticamente cuando importamos desde src/media/
// Al cambiar las imágenes, Vite genera nuevos hashes y el navegador las recarga automáticamente

// Función para obtener la URL de una imagen
// Si está importada desde src/media, Vite ya añade hash automáticamente (sin caché)
// Si no, usar ruta desde public con parámetros de caché
const getImageWithCache = (filename: string, cacheKey: number): string => {
  const imagePath = getImagePath(filename);
  
  // Si la imagen está importada (en imageMap), Vite ya maneja el caché con hash
  // No necesitamos añadir parámetros adicionales
  if (imageMap[filename]) {
    return imagePath;
  }
  
  // Para imágenes desde public, añadir parámetros de caché
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return `${imagePath}?v=${cacheKey}&t=${timestamp}&r=${random}&nocache=${timestamp}`;
};
import { ResponsiveModal } from './ui/responsive-modal';
import { Separator } from './ui/separator';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { MapPageSkeleton } from './ui/map-page-skeleton';

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

export const AirbnbSearchBar: React.FC<AirbnbSearchBarProps> = React.memo(({ onSearch }) => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  // ✅ OPTIMIZADO: useServiceTypes y useCategories ya tienen cache, no hay problema en llamarlos aquí
  // Además, AirbnbSearchBar puede usarse independientemente, así que es correcto tenerlos aquí
  const { serviceTypes, isLoading: serviceTypesLoading } = useServiceTypes();
  const { categories, loading: categoriesLoading } = useCategories();
  
  // ✅ PRERENDERIZAR MAPA: Cargar Google Maps API en móvil para que esté listo cuando navegue
  // ✅ OPTIMIZADO: Solo cargar cuando realmente se necesita (móvil y cuando el modal está abierto)
  const [isMobile, setIsMobile] = React.useState(false);
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // ✅ Solo cargar Google Maps cuando es móvil Y el modal está abierto (o está a punto de abrirse)
  const { isLoaded: isMapPreloaded } = useLoadScript({
    googleMapsApiKey: "AIzaSyBNEdqihExcXPnWw_TJgHFzsPXS7BIazyM",
    libraries,
    // ✅ Solo cargar en móvil para prerenderizar
    // En desktop no es necesario porque el mapa se carga después
  });
  
  const userEmail = (user as any)?.Email || user?.email;
  const userRole = (user as any)?.Role || user?.role;
  const isAdminByEmail = userEmail ? isAdmin(userEmail) : false;
  const isAdminByRole = userRole === 'Admin' || userRole === 'admin';
  const userIsAdmin = isAuthenticated && (isAdminByEmail || isAdminByRole);
  
  const [serviceTypeId, setServiceTypeId] = useState<number | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(CATEGORIES.INMOBILIARIA);
  const [adUrl, setAdUrl] = useState('');
  const [activeField, setActiveField] = useState<string | null>(null);
  const [isServiceTypeOpen, setIsServiceTypeOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [expandedAccordion, setExpandedAccordion] = useState<string | null>(null);
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'coches' | 'inmobiliaria' | 'drawer' | null>('inmobiliaria');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerCategoryReplacement, setDrawerCategoryReplacement] = useState<{ id: number; name: string; image: string } | null>(null);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [imageCacheKey, setImageCacheKey] = useState(Date.now());
  const [waveKey, setWaveKey] = useState(0); // ✅ Para forzar re-render del efecto onda
  const formRef = useRef<HTMLFormElement>(null);
  const serviceTypeDropdownRef = useRef<HTMLDivElement>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const categoriesContainerRef = useRef<HTMLDivElement>(null);


  // ✅ OPTIMIZADO: Solo actualizar cache key en desarrollo y solo cuando sea necesario
  useEffect(() => {
    if (import.meta.env.DEV) {
      // Solo en desarrollo: actualizar cache key cuando la ventana vuelve a estar visible
      const handleVisibilityChange = () => {
        if (!document.hidden) {
          setImageCacheKey(Date.now());
        }
      };
      
      // Forzar recarga al hacer foco en la ventana (solo en dev)
      const handleFocus = () => {
        setImageCacheKey(Date.now());
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('focus', handleFocus);
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('focus', handleFocus);
      };
    }
  }, []);

  // Estos se actualizarán después de normalizar los datos
  let selectedServiceType: { id: number; name: string } | undefined;
  let selectedCategory: { id: number; name: string } | undefined;

  // Normalizar datos - el backend devuelve PascalCase, convertimos a camelCase
  const normalizedServiceTypes = serviceTypes.map((st: any) => ({
    id: st.Id || st.id,
    name: st.Name || st.name,
    description: st.Description || st.description,
    position: st.Position || st.position,
  }));

  const normalizedCategories = categories.map((cat: any) => ({
    id: cat.Id || cat.id,
    name: cat.Name || cat.name,
    isActive: cat.IsActive ?? cat.isActive ?? true,
  }));

  // Buscar selecciones actuales en los datos normalizados
  selectedServiceType = normalizedServiceTypes.find(st => st.id === serviceTypeId);
  selectedCategory = normalizedCategories.find(c => c.id === categoryId);

  // ✅ Leer parámetros de retorno desde SearchParameterForm y abrir modal automáticamente
  useEffect(() => {
    const returnToSearch = sessionStorage.getItem('returnToSearch');
    if (returnToSearch && normalizedCategories.length > 0) {
      try {
        const params = JSON.parse(returnToSearch);
        if (params.serviceTypeId && params.categoryId) {
          // Establecer los parámetros
          setServiceTypeId(params.serviceTypeId);
          setCategoryId(params.categoryId);
          if (params.adUrl) {
            setAdUrl(params.adUrl);
          }
          
          // Determinar el tab activo basado en la categoría
          if (params.categoryId === CATEGORIES.COCHES) {
            setActiveTab('coches');
          } else if (params.categoryId === CATEGORIES.INMOBILIARIA) {
            setActiveTab('inmobiliaria');
          } else {
            // Para otras categorías, usar el drawer
            setActiveTab('inmobiliaria');
            // Buscar la categoría en la lista para obtener su nombre e imagen
            const category = normalizedCategories.find(c => c.id === params.categoryId);
            if (category) {
              const categoryImage = getCategoryImage(category.name) || getImageWithCache('casapng.png', imageCacheKey);
              setDrawerCategoryReplacement({
                id: params.categoryId,
                name: category.name,
                image: categoryImage
              });
            }
          }
          
          // Abrir el modal móvil automáticamente
          const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
          if (isMobile) {
            setIsMobileSearchOpen(true);
            // ✅ Desplegar automáticamente el acordeón de tipo de servicio
            setExpandedAccordion('type');
          }
          
          // Llamar a onSearch si existe
          if (onSearch) {
            onSearch({
              serviceTypeId: params.serviceTypeId,
              categoryId: params.categoryId,
              adUrl: params.adUrl || ''
            });
          }
          
          // Limpiar sessionStorage
          sessionStorage.removeItem('returnToSearch');
        }
      } catch (error) {
        console.error('Error parsing returnToSearch:', error);
        sessionStorage.removeItem('returnToSearch');
      }
    }
  }, [normalizedCategories, imageCacheKey, onSearch]);

  // Forzar sombreado siempre en el contenedor de categorías - se ejecuta en cada render
  useEffect(() => {
    const forceShadow = () => {
      if (categoriesContainerRef.current) {
        const shadow = expandedAccordion === 'where' 
          ? '0 8px 24px rgba(0, 0, 0, 0.15), 0 4px 8px rgba(0, 0, 0, 0.12)'
          : '0 8px 20px rgba(0, 0, 0, 0.18), 0 4px 8px rgba(0, 0, 0, 0.12)';
        // Aplicar directamente al estilo, sobrescribiendo cualquier otra regla
        categoriesContainerRef.current.style.boxShadow = shadow;
        categoriesContainerRef.current.style.setProperty('box-shadow', shadow, 'important');
      }
    };
    
    // Ejecutar inmediatamente y también después del render
    forceShadow();
    const rafId = requestAnimationFrame(() => {
      forceShadow();
      // También después de un pequeño delay adicional
      setTimeout(forceShadow, 10);
    });
    
    return () => {
      cancelAnimationFrame(rafId);
    };
  });

  // Cerrar dropdowns al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Solo cerrar si el dropdown está abierto y el clic es fuera
      if (isServiceTypeOpen && serviceTypeDropdownRef.current && !serviceTypeDropdownRef.current.contains(event.target as Node)) {
        setIsServiceTypeOpen(false);
      }
      if (isCategoryOpen && categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setIsCategoryOpen(false);
      }
    };

    // Usar click en vez de mousedown para evitar conflictos
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isServiceTypeOpen, isCategoryOpen]);
  
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

  const [isNavigating, setIsNavigating] = useState(false);
  
  // ✅ Resetear estado de navegación cuando la ruta cambia
  const location = useLocation();
  useEffect(() => {
    // Si estamos navegando y la ruta cambió a crear-busqueda, resetear después de un delay
    if (isNavigating && location.pathname === '/crear-busqueda') {
      const timer = setTimeout(() => {
        setIsNavigating(false);
      }, 2000); // Mantener skeleton 2 segundos para que se vea la transición
      
      return () => clearTimeout(timer);
    }
  }, [isNavigating, location.pathname]);

  const handleSearch = () => {
    if (onSearch) {
      onSearch({
        serviceTypeId,
        categoryId,
        adUrl,
      });
    }
    
    if (serviceTypeId && categoryId) {
      // ✅ Activar estado de navegación para mostrar skeletons INMEDIATAMENTE
      setIsNavigating(true);
      
      // ✅ Navegar inmediatamente - el skeleton ya está visible
      const params = new URLSearchParams();
      params.append('serviceTypeId', serviceTypeId.toString());
      params.append('categoryId', categoryId.toString());
      if (adUrl) params.append('adUrl', adUrl);
      
      // ✅ Navegar directamente sin pasar por homepage
      navigate(`/crear-busqueda?${params.toString()}`, { replace: true });
    }
  };

  const handleTabClick = (tab: 'coches' | 'inmobiliaria', categoryIdValue: number) => {
    setActiveTab(tab);
    setCategoryId(categoryIdValue);
    setIsDrawerOpen(false);
    setWaveKey(prev => prev + 1); // ✅ Trigger efecto onda
    
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
    if (nameLower.includes('moto') && !nameLower.includes('agua')) return getImageWithCache('motopng.png', imageCacheKey);
    if (nameLower.includes('coche') || nameLower.includes('vehículo')) return getImageWithCache('cochepng.png', imageCacheKey);
    if (nameLower.includes('inmobiliaria') || nameLower.includes('casa') || nameLower.includes('inmueble')) return getImageWithCache('casapng.png', imageCacheKey);
    if (nameLower.includes('cámara') || nameLower.includes('camara')) return getImageWithCache('internet-61.png', imageCacheKey);
    if (nameLower.includes('fontanería') || nameLower.includes('fontaneria') || nameLower.includes('caldera')) return getImageWithCache('house.png', imageCacheKey);
    return null;
  };

  const handleDrawerCategoryClick = (categoryIdValue: number, categoryName: string) => {
    const categoryImage = getCategoryImage(categoryName) || getImageWithCache('casapng.png', imageCacheKey);
    
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

  // Radix Popover maneja el cierre automáticamente, no necesitamos handleClickOutside

  return (
    <>
      {/* ✅ Overlay de transición con skeletons */}
      {isNavigating && <MapPageSkeleton />}
      
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
        
        {/* Categorías encima de la barra de búsqueda - Solo Desktop */}
        <div className="flex items-center justify-center mb-3 max-w-[850px] mx-auto">
          <div className="flex items-center gap-8">
            <motion.button
              type="button"
              role="tab"
              aria-selected={activeTab === 'coches'}
              onClick={() => handleTabClick('coches', CATEGORIES.COCHES)}
              onMouseEnter={() => setHoveredTab('coches')}
              onMouseLeave={() => setHoveredTab(null)}
              className={`flex items-center gap-3 py-2 relative bg-transparent border-none cursor-pointer ${
                activeTab === 'coches' ? 'category-tab-active' : ''
              }`}
              key={`coches-${waveKey}`}
              whileTap={{ scale: 0.95 }}
            >
              <AnimatePresence mode="wait">
                {activeTab === 'coches' && (
                  <motion.div
                    key="wave"
                    className="absolute inset-0 rounded-full"
                    initial={{ scale: 0.8, opacity: 0.6 }}
                    animate={{ scale: 1.4, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    style={{
                      background: 'radial-gradient(circle, rgba(34, 34, 34, 0.15) 0%, transparent 70%)',
                      pointerEvents: 'none',
                    }}
                  />
                )}
              </AnimatePresence>
              <img 
                key={`coche-${imageCacheKey}`}
                src={getImageWithCache('cochepng.png', imageCacheKey)} 
                alt="Coche" 
                className="w-6 h-6 object-contain relative z-10" 
              />
              <span className={`text-sm whitespace-nowrap relative z-10 ${activeTab === 'coches' ? 'font-semibold text-gray-900' : 'font-normal text-gray-600'}`}>
                Coches
              </span>
              <span className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 origin-left transition-transform relative z-10 ${
                activeTab === 'coches' ? 'scale-x-100' : 'scale-x-0'
              }`} />
            </motion.button>

            <motion.button
              type="button"
              role="tab"
              aria-selected={activeTab === 'inmobiliaria'}
              onClick={() => handleTabClick('inmobiliaria', drawerCategoryReplacement?.id || CATEGORIES.INMOBILIARIA)}
              onMouseEnter={() => setHoveredTab('inmobiliaria')}
              onMouseLeave={() => setHoveredTab(null)}
              className={`flex items-center gap-3 py-2 relative bg-transparent border-none cursor-pointer ${
                activeTab === 'inmobiliaria' ? 'category-tab-active' : ''
              }`}
              key={`inmobiliaria-${waveKey}`}
              whileTap={{ scale: 0.95 }}
            >
              <AnimatePresence mode="wait">
                {activeTab === 'inmobiliaria' && (
                  <motion.div
                    key="wave"
                    className="absolute inset-0 rounded-full"
                    initial={{ scale: 0.8, opacity: 0.6 }}
                    animate={{ scale: 1.4, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    style={{
                      background: 'radial-gradient(circle, rgba(34, 34, 34, 0.15) 0%, transparent 70%)',
                      pointerEvents: 'none',
                    }}
                  />
                )}
              </AnimatePresence>
              <img
                key={`casa-${imageCacheKey}`}
                src={drawerCategoryReplacement?.image || getImageWithCache('casapng.png', imageCacheKey)}
                alt={drawerCategoryReplacement?.name || "Casa"}
                className="w-6 h-6 object-contain relative z-10"
              />
              <span className={`text-sm whitespace-nowrap relative z-10 ${activeTab === 'inmobiliaria' ? 'font-semibold text-gray-900' : 'font-normal text-gray-600'}`}>
                {drawerCategoryReplacement?.name || 'Inmobiliaria'}
              </span>
              <span className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 origin-left transition-transform relative z-10 ${
                activeTab === 'inmobiliaria' || hoveredTab === 'inmobiliaria' ? 'scale-x-100' : 'scale-x-0'
              }`} />
            </motion.button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'drawer'}
              onClick={() => setIsDrawerOpen(true)}
              onMouseEnter={() => setHoveredTab('services')}
              onMouseLeave={() => setHoveredTab(null)}
              className="flex items-center gap-3 py-2 relative bg-transparent border-none cursor-pointer"
            >
              <div className="flex items-center justify-center gap-1 w-6 h-6">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                <div className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                <div className="w-1.5 h-1.5 rounded-full bg-gray-600" />
              </div>
              <span className={`text-sm whitespace-nowrap ${activeTab === 'drawer' ? 'font-semibold text-gray-900' : 'font-normal text-gray-600'}`}>
                Más
              </span>
              <span className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 origin-left transition-transform ${
                activeTab === 'drawer' || hoveredTab === 'services' ? 'scale-x-100' : 'scale-x-0'
              }`} />
            </button>
          </div>
        </div>
        
        <form
          ref={formRef}
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="flex items-center justify-center w-full gap-4 max-w-[850px] mx-auto"
        >
          {/* Botones a la izquierda */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Aquí podríamos poner botones adicionales si es necesario */}
          </div>

          {/* Search Bar Container - Exact Airbnb style */}
          <div
            className={`flex items-center bg-white border border-gray-300 rounded-full shadow-sm hover:shadow-md transition-all overflow-visible flex-1 ${
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
            <div ref={serviceTypeDropdownRef} className="relative flex-1">
              <button
                type="button"
                className={`w-full px-4 sm:px-6 py-3 border-r border-gray-300 cursor-pointer transition-colors text-left ${
                  activeField === 'serviceType' || isServiceTypeOpen ? 'bg-gray-50' : 'hover:bg-gray-50'
                } ${activeField === 'serviceType' ? 'rounded-l-full' : ''}`}
                style={{ minHeight: '66px', minWidth: '120px' }}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsServiceTypeOpen(!isServiceTypeOpen);
                  setIsCategoryOpen(false);
                  setActiveField('serviceType');
                }}
              >
                <div className="flex flex-col justify-center h-full">
                  <span
                    className="text-xs font-semibold text-gray-900 mb-1 block"
                    style={{ fontSize: '12px', lineHeight: '16px', fontWeight: 600 }}
                  >
                    Tipo de servicio
                  </span>
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
                    <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform ${isServiceTypeOpen ? 'rotate-180' : ''}`} />
                  </div>
                </div>
              </button>
              
              {/* Dropdown de tipos de servicio */}
              {isServiceTypeOpen && (
                <div 
                  className="absolute top-full left-0 mt-2 w-[300px] bg-white border border-gray-200 shadow-2xl rounded-xl"
                  style={{ zIndex: 99999 }}
                >
                  <div className="max-h-[300px] overflow-y-auto py-2">
                    {serviceTypesLoading ? (
                      <SkeletonTheme baseColor="#f3f4f6" highlightColor="#e5e7eb">
                        <div className="p-2 space-y-2">
                          {[...Array(3)].map((_, index) => (
                            <Skeleton key={index} height={48} borderRadius={8} />
                          ))}
                        </div>
                      </SkeletonTheme>
                    ) : normalizedServiceTypes.length === 0 ? (
                      <div className="p-4 text-center text-sm text-gray-500">No hay tipos disponibles</div>
                    ) : (
                      normalizedServiceTypes.map((serviceType) => (
                        <button
                          key={serviceType.id}
                          type="button"
                          onClick={() => {
                            const newCategoryId = categoryId || CATEGORIES.COCHES;
                            setServiceTypeId(serviceType.id);
                            setIsServiceTypeOpen(false);
                            if (onSearch) {
                              onSearch({
                                serviceTypeId: serviceType.id,
                                categoryId: newCategoryId,
                                adUrl,
                              });
                            }
                          }}
                          className={`w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors ${
                            serviceTypeId === serviceType.id ? 'bg-gray-100' : ''
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
                </div>
              )}
            </div>

            {/* Category - Categoría */}
            <div ref={categoryDropdownRef} className="relative flex-1">
              <button
                type="button"
                className={`w-full px-4 sm:px-6 py-3 border-r border-gray-300 cursor-pointer transition-colors text-left ${
                  activeField === 'category' || isCategoryOpen ? 'bg-gray-50' : 'hover:bg-gray-50'
                }`}
                style={{ minHeight: '66px', minWidth: '120px' }}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCategoryOpen(!isCategoryOpen);
                  setIsServiceTypeOpen(false);
                  setActiveField('category');
                }}
              >
                <div className="flex flex-col justify-center h-full">
                  <span
                    className="text-xs font-semibold text-gray-900 mb-1 block"
                    style={{ 
                      fontSize: '12px', 
                      lineHeight: '16px', 
                      fontWeight: 600,
                      fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif'
                    }}
                  >
                    Categoría
                  </span>
                  <div
                    className="text-sm truncate flex items-center gap-1"
                    style={{ 
                      fontSize: '14px', 
                      lineHeight: '18px',
                      color: selectedCategory ? '#222222' : '#717171',
                      fontWeight: selectedCategory ? 600 : 400,
                      fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif'
                    }}
                  >
                    {selectedCategory ? selectedCategory.name : 'Selecciona categoría'}
                    <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`} />
                  </div>
                </div>
              </button>
              
              {/* Dropdown de categorías */}
              {isCategoryOpen && (
                <div 
                  className="absolute top-full left-0 mt-2 w-[300px] bg-white border border-gray-200 shadow-2xl rounded-xl"
                  style={{ zIndex: 99999 }}
                >
                  <div className="max-h-[300px] overflow-y-auto py-2">
                    {categoriesLoading ? (
                      <SkeletonTheme baseColor="#f3f4f6" highlightColor="#e5e7eb">
                        <div className="p-2 space-y-2">
                          {[...Array(3)].map((_, index) => (
                            <Skeleton key={index} height={80} width={80} borderRadius={12} />
                          ))}
                        </div>
                      </SkeletonTheme>
                    ) : normalizedCategories.length === 0 ? (
                      <div 
                        className="p-4 text-center text-sm text-gray-500"
                        style={{
                          fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif'
                        }}
                      >
                        No hay categorías disponibles
                      </div>
                    ) : (
                      normalizedCategories
                        .filter(cat => cat.isActive)
                        .map((category) => (
                          <button
                            key={category.id}
                            type="button"
                            onClick={() => {
                              setCategoryId(category.id);
                              setIsCategoryOpen(false);
                              if (onSearch) {
                                onSearch({
                                  serviceTypeId,
                                  categoryId: category.id,
                                  adUrl,
                                });
                              }
                            }}
                            className={`w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors ${
                              categoryId === category.id ? 'bg-gray-100' : ''
                            }`}
                          >
                            <div 
                              className="font-medium text-sm text-gray-900"
                              style={{
                                fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif'
                              }}
                            >
                              {category.name}
                            </div>
                          </button>
                        ))
                    )}
                  </div>
                </div>
              )}
            </div>

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

          {/* Botones a la derecha */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Aquí podríamos poner botones adicionales si es necesario */}
          </div>
        </form>
      </div>

      {/* Mobile */}
      <div className="md:hidden relative">
        <div className="px-5 pt-4 pb-0">
          <div
            onClick={() => setIsMobileSearchOpen(true)}
            className="w-full bg-white border border-gray-300 rounded-full transition-all flex items-center justify-center gap-3 px-4 cursor-pointer relative"
            style={{
              height: '56px',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.08), 0 4px 12px 0 rgba(0, 0, 0, 0.05)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 2px 4px 0 rgba(0, 0, 0, 0.12), 0 6px 16px 0 rgba(0, 0, 0, 0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.08), 0 4px 12px 0 rgba(0, 0, 0, 0.05)';
            }}
          >
            {/* Contenido centrado: Texto */}
            <div className="flex flex-col items-center flex-1 min-w-0">
              <span 
                className="mb-0.5"
                style={{
                  fontSize: '14px',
                  lineHeight: '18px',
                  fontWeight: 500,
                  fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                  color: 'rgb(34, 34, 34)',
                }}
              >
                ¿Qué servicio buscas?
              </span>
              <div 
                className="flex items-center gap-1"
                style={{
                  fontSize: '12px',
                  lineHeight: '16px',
                  fontWeight: 400,
                  fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                  color: 'rgb(106, 106, 106)',
                }}
              >
                <span className="truncate">
                  {adUrl || 'Ubicación'}
                </span>
                <span>·</span>
                <span className="truncate">
                  Fecha
                </span>
                <span>·</span>
                <span className="truncate">
                  Categoría
                </span>
              </div>
            </div>
            
            {/* Botón circular rosa con ícono de filtro - Posicionado absoluto a la derecha */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                setIsMobileSearchOpen(true);
              }}
              className="absolute right-3 flex-shrink-0 w-10 h-10 rounded-full bg-pink-500 hover:bg-pink-600 transition-colors flex items-center justify-center cursor-pointer"
              aria-label="Filtros"
            >
              <Filter className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        {/* Tabs Mobile - Estructura como Airbnb */}
        <div className="relative w-full" role="tablist">
          {/* Contenedor de tabs con flex */}
          <div className="flex w-full px-5 pt-1.5">
            {/* Tab 1: Coches */}
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'coches'}
              onClick={() => handleTabClick('coches', CATEGORIES.COCHES)}
              className="flex-1 flex flex-col items-center justify-center py-1.5 bg-transparent border-none cursor-pointer"
            >
              <img 
                key={`coche-mobile-${imageCacheKey}`}
                src={getImageWithCache('cochepng.png', imageCacheKey)} 
                alt="Coche" 
                className="w-16 h-16 object-contain" 
              />
              <span className={`text-xs leading-3 text-center mt-0.5 ${activeTab === 'coches' ? 'font-semibold text-gray-900' : 'font-normal text-gray-500'}`}>
                Coches
              </span>
            </button>

            {/* Tab 2: Inmobiliaria */}
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'inmobiliaria'}
              onClick={() => handleTabClick('inmobiliaria', drawerCategoryReplacement?.id || CATEGORIES.INMOBILIARIA)}
              className="flex-1 flex flex-col items-center justify-center py-1.5 bg-transparent border-none cursor-pointer"
            >
              <img
                key={`casa-mobile-${imageCacheKey}`}
                src={drawerCategoryReplacement?.image || getImageWithCache('casapng.png', imageCacheKey)}
                alt={drawerCategoryReplacement?.name || "Casa"}
                className="w-16 h-16 object-contain"
              />
              <span className={`text-xs leading-3 text-center mt-0.5 ${activeTab === 'inmobiliaria' ? 'font-semibold text-gray-900' : 'font-normal text-gray-500'}`}>
                {drawerCategoryReplacement?.name || 'Inmobiliaria'}
              </span>
            </button>

            {/* Tab 3: Más */}
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'drawer'}
              onClick={() => setIsDrawerOpen(true)}
              className="flex-1 flex flex-col items-center justify-center py-1.5 bg-transparent border-none cursor-pointer"
            >
              <div className="flex items-center justify-center gap-1.5 w-16 h-16">
                <div className="w-2 h-2 rounded-full bg-gray-900" />
                <div className="w-2 h-2 rounded-full bg-gray-900" />
                <div className="w-2 h-2 rounded-full bg-gray-900" />
              </div>
              <span className={`text-xs leading-3 text-center mt-0.5 ${activeTab === 'drawer' ? 'font-semibold text-gray-900' : 'font-normal text-gray-500'}`}>
                Más
              </span>
            </button>
          </div>

          {/* Indicador/Subrayado - Exactamente al ras del borde inferior del contenedor */}
          <div 
            className="absolute bottom-0 left-0 right-0 h-[2px] pointer-events-none"
          >
            <div 
              className="absolute bottom-0 left-0 h-[2px] bg-gray-900 transition-transform duration-300 ease-out"
              style={{
                width: '33.3333%',
                transform: `translateX(${activeTab === 'coches' ? '0%' : activeTab === 'inmobiliaria' ? '100%' : '200%'})`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Modal Mobile */}
      {isMobileSearchOpen && typeof document !== 'undefined' && createPortal(
        <>
          <div 
            className="md:hidden fixed inset-0 z-50 bg-gray-50 flex flex-col pb-4"
            style={{
              boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.12), 0 -2px 8px rgba(0, 0, 0, 0.08)'
            }}
          >
            {/* Botón cerrar arriba derecha - Mejorado y con mejor espaciado */}
            <div className="absolute top-4 right-4 z-[60]">
              <button
                type="button"
                onClick={() => {
                  if (expandedAccordion === 'where') {
                    setExpandedAccordion(null);
                  } else {
                    setIsMobileSearchOpen(false);
                  }
                }}
                className="w-10 h-10 bg-white hover:bg-gray-50 rounded-full transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl border border-gray-200 hover:border-gray-300 active:scale-95"
                aria-label="Cerrar"
                style={{
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12), 0 1px 3px rgba(0, 0, 0, 0.08)'
                }}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 32 32" 
                  aria-hidden="true" 
                  role="presentation" 
                  focusable="false"
                  style={{ display: 'block', fill: 'none', height: '18px', width: '18px', stroke: 'currentcolor', strokeWidth: 2.5, overflow: 'visible', color: '#222222' }}
                >
                  <path d="m6 6 20 20M26 6 6 26"></path>
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="pt-20 px-4 pb-6 space-y-4">
              {/* Categorías - Div más alto con categorías visibles */}
              <div 
                ref={categoriesContainerRef}
                className={`bg-white border-0 rounded-2xl flex flex-col ${
                  expandedAccordion === 'where' ? 'fixed inset-0 z-[60] rounded-none' : ''
                }`}
                style={{
                  height: expandedAccordion === 'where' ? '100vh' : 'auto',
                  minHeight: expandedAccordion === 'where' ? '100vh' : '280px',
                  maxHeight: expandedAccordion === 'where' ? '100vh' : '320px',
                  boxShadow: expandedAccordion === 'where' 
                    ? '0 8px 24px rgba(0, 0, 0, 0.15), 0 4px 8px rgba(0, 0, 0, 0.12)'
                    : '0 8px 20px rgba(0, 0, 0, 0.18), 0 4px 8px rgba(0, 0, 0, 0.12)',
                  transition: 'height 150ms cubic-bezier(0.4, 0, 0.2, 1), min-height 150ms cubic-bezier(0.4, 0, 0.2, 1), max-height 150ms cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                {expandedAccordion === 'where' ? (
                  <>
                    {/* Header con título y buscador cuando está expandido - Estilo Airbnb */}
                    <div className="px-4 pt-16 pb-4 border-b border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <h2 
                          tabIndex={-1}
                          style={{
                            fontSize: '22px',
                            lineHeight: '26px',
                            fontWeight: 700,
                            fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                            color: 'rgb(34, 34, 34)',
                            letterSpacing: '-0.01em',
                            fontFeatureSettings: '"liga" 1, "kern" 1',
                            WebkitFontSmoothing: 'antialiased',
                            MozOsxFontSmoothing: 'grayscale',
                          }}
                        >
                          ¿Qué revisamos?
                        </h2>
                        <button
                          type="button"
                          onClick={() => setExpandedAccordion(null)}
                          className="w-10 h-10 flex items-center justify-center rounded-full bg-white hover:bg-gray-50 transition-colors border border-gray-200 shadow-sm"
                          aria-label="Comprimir categorías"
                        >
                          <ChevronDown className="w-5 h-5 text-gray-900 rotate-180" style={{ strokeWidth: 2.5 }} />
                        </button>
                      </div>
                      <form role="search" className="w-full">
                        <label 
                          htmlFor="categories-search-input"
                          className="flex items-center w-full px-4 py-3.5 border-0 rounded-lg bg-gray-50 shadow-sm"
                          style={{ 
                            fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif' 
                          }}
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
                            placeholder="Buscar destinos"
                            value={categorySearchQuery}
                            onChange={(e) => setCategorySearchQuery(e.target.value)}
                            className="flex-1 border-0 text-sm outline-none bg-transparent text-gray-900 placeholder:text-gray-400"
                            style={{ 
                              fontSize: '14px',
                              lineHeight: '18px',
                              fontWeight: 400,
                              fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif' 
                            }}
                            autoComplete="off"
                            autoCorrect="off"
                            spellCheck="false"
                            aria-label="Buscar destinos"
                          />
                        </label>
                      </form>
                    </div>

                    {/* Contenido expandido al 100% */}
                    <div className="flex-1 overflow-y-auto px-4 py-4">
                      <div>
                        {categoriesLoading ? (
                          <SkeletonTheme baseColor="#f3f4f6" highlightColor="#e5e7eb">
                            <div className="space-y-2">
                              {[...Array(4)].map((_, index) => (
                                <Skeleton key={index} height={80} width={80} borderRadius={12} />
                              ))}
                            </div>
                          </SkeletonTheme>
                        ) : (
                    <div>
                              {normalizedCategories
                                .filter(cat => cat.isActive)
                                .filter(cat => {
                                  if (categorySearchQuery.trim()) {
                                    return cat.name.toLowerCase().includes(categorySearchQuery.toLowerCase());
                                  }
                                  return true;
                                })
                        .map((category, index) => {
                                  const categoryImage = getCategoryImage(category.name);
                                  return (
                                    <button
                                      key={category.id}
                                      type="button"
                              onClick={() => {
                                setCategoryId(category.id);
                                setCategorySearchQuery('');
                                // Colapsar categorías y abrir tipo de servicio
                                setExpandedAccordion('type');
                                // Llamar a onSearch para actualizar los filtros
                                if (onSearch) {
                                  onSearch({
                                    serviceTypeId,
                                    categoryId: category.id,
                                    adUrl,
                                  });
                                }
                              }}
                                    className={`w-full flex items-center gap-4 p-4 mb-3 rounded-lg text-left transition-all duration-300 ease-out border-0 animate-fade-in ${
                                      categoryId === category.id 
                                        ? 'bg-gray-900 text-white shadow-md' 
                                        : 'hover:bg-gray-50 shadow-sm'
                                    }`}
                                    style={{
                                      animationDelay: `${Math.min(index * 50, 300)}ms`,
                                      animationFillMode: 'both'
                                    }}
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
                                    <div 
                                      className={`font-medium ${categoryId === category.id ? 'text-white' : ''}`}
                                      style={{ 
                                        fontSize: '14px',
                                        lineHeight: '18px',
                                        fontWeight: 600,
                                        fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                        color: categoryId === category.id ? 'rgb(255, 255, 255)' : 'rgb(34, 34, 34)'
                                      }}
                                    >
                                  {category.name}
                                </div>
                                      <div 
                                        style={{ 
                                          fontSize: '14px',
                                          lineHeight: '18px',
                                          fontWeight: 400,
                                          fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                          color: categoryId === category.id ? 'rgba(255, 255, 255, 0.8)' : 'rgb(106, 106, 106)'
                                        }}
                                      >
                                  Explorar servicios
                                </div>
                                      </div>
                                    </button>
                                  );
                                })}
                      {normalizedCategories
                        .filter(cat => cat.isActive)
                              .filter(cat => {
                                if (categorySearchQuery.trim()) {
                                  return cat.name.toLowerCase().includes(categorySearchQuery.toLowerCase());
                                }
                                return true;
                              }).length === 0 && (
                              <div 
                                className="text-center py-4 text-gray-500"
                                style={{ 
                                  fontSize: '14px',
                                  lineHeight: '18px',
                                  fontWeight: 400,
                                  fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif' 
                                }}
                              >
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
                    {/* Header fijo con título y buscador - Estilo Airbnb */}
                    <div className="px-4 pt-6 pb-4 border-b border-gray-200">
                      <h2 
                        tabIndex={-1}
                        className="mb-4"
                        style={{
                          fontSize: '22px',
                          lineHeight: '26px',
                          fontWeight: 700,
                          fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                          color: 'rgb(34, 34, 34)',
                          letterSpacing: '-0.01em',
                          fontFeatureSettings: '"liga" 1, "kern" 1',
                          WebkitFontSmoothing: 'antialiased',
                          MozOsxFontSmoothing: 'grayscale',
                        }}
                      >
                        ¿Qué revisamos?
                      </h2>
                      
                      {/* Buscador fijo fuera del scroll */}
                      <form role="search" className="w-full">
                        <label 
                          htmlFor="categories-search-input-collapsed"
                          className="flex items-center w-full px-4 py-3.5 border-0 rounded-lg bg-gray-50 shadow-sm"
                          style={{ 
                            fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif' 
                          }}
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
                            placeholder="Buscar destinos"
                            value={categorySearchQuery}
                            onChange={(e) => setCategorySearchQuery(e.target.value)}
                            className="flex-1 border-0 text-sm outline-none bg-transparent text-gray-900 placeholder:text-gray-400"
                            style={{ 
                              fontSize: '14px',
                              lineHeight: '18px',
                              fontWeight: 400,
                              fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif' 
                            }}
                            autoComplete="off"
                            autoCorrect="off"
                            spellCheck="false"
                            aria-label="Buscar destinos"
                          />
                        </label>
                      </form>
                    </div>

                    {/* Lista de categorías con scroll */}
                    <div className="flex-1 overflow-y-auto px-4 py-4">
                      <div>
                        {categoriesLoading ? (
                          <SkeletonTheme baseColor="#f3f4f6" highlightColor="#e5e7eb">
                            <div className="space-y-2">
                              {[...Array(4)].map((_, index) => (
                                <Skeleton key={index} height={80} width={80} borderRadius={12} />
                              ))}
                            </div>
                          </SkeletonTheme>
                        ) : (
                          <div>
                            {normalizedCategories
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
                                      // Colapsar categorías y abrir tipo de servicio
                                      setExpandedAccordion('type');
                                      // Llamar a onSearch para actualizar los filtros
                                      if (onSearch) {
                                        onSearch({
                                          serviceTypeId,
                                          categoryId: category.id,
                                          adUrl,
                                        });
                                      }
                                    }}
                                    className={`w-full flex items-center gap-4 p-4 mb-3 rounded-lg text-left transition-all duration-200 border-0 ${
                                      categoryId === category.id 
                                        ? 'bg-gray-900 text-white shadow-md' 
                                        : 'hover:bg-gray-50 shadow-sm'
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
                                      <div 
                                        className={`font-medium ${categoryId === category.id ? 'text-white' : ''}`}
                                        style={{ 
                                          fontSize: '14px',
                                          lineHeight: '18px',
                                          fontWeight: 500,
                                          fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                          color: categoryId === category.id ? 'rgb(255, 255, 255)' : 'rgb(34, 34, 34)'
                                        }}
                                      >
                                        {category.name}
                    </div>
                                      <div 
                                        style={{ 
                                          fontSize: '14px',
                                          lineHeight: '18px',
                                          fontWeight: 400,
                                          fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                          color: categoryId === category.id ? 'rgba(255, 255, 255, 0.8)' : 'rgb(106, 106, 106)'
                                        }}
                                      >
                                        Explorar servicios
                  </div>
                  </div>
                </button>
                                );
                              })}
                            {normalizedCategories
                              .filter(cat => cat.isActive)
                              .filter(cat => {
                                if (categorySearchQuery.trim()) {
                                  return cat.name.toLowerCase().includes(categorySearchQuery.toLowerCase());
                                }
                                return true;
                              }).length === 0 && (
                              <div 
                                className="text-center py-4 text-gray-500"
                                style={{ 
                                  fontSize: '14px',
                                  lineHeight: '18px',
                                  fontWeight: 400,
                                  fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif' 
                                }}
                              >
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
                  <div className="border-t border-gray-200 mt-auto">
                    <button
                      type="button"
                      onClick={() => setExpandedAccordion('where')}
                      className="w-full flex items-center justify-center py-3 bg-transparent border-none cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <ChevronDown className="w-4 h-4 text-gray-600" style={{ strokeWidth: 2.5 }} />
                    </button>
                  </div>
                )}
              </div>

              {/* Tipo de servicio - Rectángulo con sombra - Estilo Airbnb */}
              <div className="bg-white border-0 rounded-2xl shadow-xl hover:shadow-2xl transition-all">
                <button
                  type="button"
                  onClick={() => setExpandedAccordion(expandedAccordion === 'type' ? null : 'type')}
                  className="w-full flex items-center justify-between px-4 py-5 bg-transparent border-none cursor-pointer"
                >
                  <div className="flex flex-col items-start">
                    <span 
                      className="font-semibold text-gray-900 mb-1"
                      style={{ 
                        fontSize: '12px',
                        lineHeight: '16px',
                        fontWeight: 600,
                        fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif' 
                      }}
                    >
                      Tipo de servicio
                    </span>
                    <span 
                      className="text-gray-500"
                      style={{ 
                        fontSize: '14px',
                        lineHeight: '18px',
                        fontWeight: 400,
                        fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif' 
                      }}
                    >
                      {selectedServiceType?.name || 'Añade tipo'}
                    </span>
                  </div>
                  <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${expandedAccordion === 'type' ? 'rotate-180' : ''}`} style={{ strokeWidth: 4 }} />
                </button>
                
                {expandedAccordion === 'type' && (
                  <div className="px-4 pb-6">
                      {serviceTypesLoading ? (
                      <SkeletonTheme baseColor="#f3f4f6" highlightColor="#e5e7eb">
                        <div className="space-y-2">
                          {[...Array(4)].map((_, index) => (
                            <Skeleton key={index} height={48} borderRadius={8} />
                          ))}
                        </div>
                      </SkeletonTheme>
                      ) : (
                      <div className="flex flex-col gap-2">
                        {normalizedServiceTypes.map((st) => (
                          <button
                            key={st.id}
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setServiceTypeId(st.id);
                              // Llamar a onSearch para actualizar los filtros
                              if (onSearch) {
                                onSearch({
                                  serviceTypeId: st.id,
                                  categoryId,
                                  adUrl,
                                });
                              }
                              // Mantener el desplegable abierto
                              setExpandedAccordion('type');
                            }}
                            className={`w-full px-4 py-4 rounded-lg text-left transition-colors flex flex-col gap-1 ${
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
              <div className="bg-white border-0 rounded-2xl shadow-xl hover:shadow-2xl transition-all">
                <button
                  type="button"
                  onClick={() => setExpandedAccordion(expandedAccordion === 'url' ? null : 'url')}
                  className="w-full flex items-center justify-between px-4 py-5 bg-transparent border-none cursor-pointer"
                >
                  <label className="text-xs font-semibold text-gray-900 flex items-center gap-1" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Circular", "Helvetica Neue", Helvetica, Arial, sans-serif' }}>
                      URL del anuncio
                    <span className="text-gray-400 font-normal">(opcional)</span>
                  </label>
                  <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${expandedAccordion === 'url' ? 'rotate-180' : ''}`} style={{ strokeWidth: 4 }} />
                </button>
                
                {expandedAccordion === 'url' && (
                  <div className="px-4 pb-6">
                      <input
                        type="text"
                      placeholder="Pega la URL aquí..."
                        value={adUrl}
                        onChange={(e) => setAdUrl(e.target.value)}
                      className="w-full px-4 py-4 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400 transition-colors"
                      autoFocus
                    />
                    </div>
                )}
              </div>
            </div>
          </div>

          <div className="px-4 py-5 border-t border-gray-200 bg-white flex justify-between gap-4">
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
                // ✅ OPTIMIZADO: Cerrar modal primero para transición más fluida
                setIsMobileSearchOpen(false);
                setExpandedAccordion(null);
                // Pequeño delay para que la animación de cierre se vea
                setTimeout(() => {
                  handleSearch();
                }, 150);
              }}
              className="px-6 py-3.5 bg-[#FF385C] text-white rounded-lg text-sm font-semibold border-none cursor-pointer flex items-center gap-2 transition-all active:scale-95"
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
        snapPoints={[0.82]}
      >
        <div className="flex flex-col h-full pt-2" style={{ height: '100%', overflow: 'hidden' }}>
          {/* Header mejorado con tipografía Airbnb - Estilo más sutil y moderno */}
          <div className="px-6 pt-2 pb-3 border-b border-gray-200 flex-shrink-0">
            <h2 
              className="mb-0"
              style={{
                fontSize: '20px',
                lineHeight: '24px',
                fontWeight: 500,
                fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                color: 'rgb(34, 34, 34)',
                letterSpacing: '-0.015em',
              }}
            >
              Más Categorías
            </h2>
          </div>

          {/* Barra de búsqueda mejorada */}
          <div className="px-6 pt-3 pb-3 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar categorías..."
                value={categorySearchQuery}
                onChange={(e) => setCategorySearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-lg text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white transition-all"
                style={{
                  fontSize: '14px',
                  lineHeight: '18px',
                  fontWeight: 400,
                  fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                }}
              />
            </div>
          </div>
          
          {/* Lista de categorías mejorada - Scroll habilitado */}
          <div 
            className="flex-1 overflow-y-auto px-2" 
            style={{ 
              minHeight: 0, 
              maxHeight: '100%',
              WebkitOverflowScrolling: 'touch',
              overflowY: 'auto',
              overscrollBehavior: 'contain'
            }}
          >
            {categoriesLoading ? (
              <SkeletonTheme baseColor="#f3f4f6" highlightColor="#e5e7eb">
                <div className="flex flex-col px-4 py-6 space-y-2">
                  {[...Array(4)].map((_, index) => (
                    <Skeleton key={index} height={64} borderRadius={8} />
                  ))}
                </div>
              </SkeletonTheme>
            ) : (
              <div className="flex flex-col pb-4">
                {normalizedCategories
                  .filter(cat => {
                    // ✅ Mostrar todas las categorías, incluyendo Coches e Inmobiliaria
                    if (categorySearchQuery.trim()) {
                      return cat.name.toLowerCase().includes(categorySearchQuery.toLowerCase());
                    }
                    return true;
                  })
                  .filter(cat => cat.isActive)
                  .map((category, index, array) => {
                    const categoryImage = getCategoryImage(category.name);
                    const isSelected = categoryId === category.id;
                    
                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => handleDrawerCategoryClick(category.id, category.name)}
                        className={`flex items-center gap-4 px-4 py-4 transition-colors w-full rounded-lg ${
                          isSelected ? 'bg-gray-100' : 'hover:bg-gray-50'
                        }`}
                      >
                        {categoryImage ? (
                          <img
                            src={categoryImage}
                            alt={category.name}
                            className="flex-shrink-0 w-10 h-10 object-contain rounded-md"
                          />
                        ) : (
                          <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center">
                            <FolderTree className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                        
                        <div className="flex-1 text-left min-w-0">
                          <h3 
                            className="font-medium leading-tight mb-0.5"
                            style={{
                              fontSize: '16px',
                              lineHeight: '20px',
                              fontWeight: 600,
                              fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                              color: 'rgb(34, 34, 34)',
                            }}
                          >
                            {category.name}
                          </h3>
                          <p 
                            style={{
                              fontSize: '14px',
                              lineHeight: '18px',
                              fontWeight: 400,
                              fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                              color: 'rgb(106, 106, 106)',
                            }}
                          >
                            Explorar servicios
                          </p>
                        </div>
                        
                        {isSelected && (
                          <div className="flex-shrink-0">
                            <div className="w-2 h-2 bg-gray-900 rounded-full" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                
                {normalizedCategories
                  .filter(cat => {
                    // ✅ Mostrar todas las categorías, incluyendo Coches e Inmobiliaria
                    if (categorySearchQuery.trim()) {
                      return cat.name.toLowerCase().includes(categorySearchQuery.toLowerCase());
                    }
                    return true;
                  })
                  .filter(cat => cat.isActive).length === 0 && (
                  <div className="flex items-center justify-center py-12">
                    <div 
                      className="text-sm text-gray-500"
                      style={{
                        fontSize: '14px',
                        lineHeight: '18px',
                        fontWeight: 400,
                        fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                        color: 'rgb(113, 113, 113)',
                      }}
                    >
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
      
      {/* ✅ PRERENDERIZAR MAPA: Inicializar mapa oculto en móvil para que el script ya esté cargado */}
      {isMobile && isMapPreloaded && (
        <div 
          style={{ 
            position: 'fixed', 
            top: '-9999px', 
            left: '-9999px', 
            width: '1px', 
            height: '1px', 
            opacity: 0, 
            pointerEvents: 'none',
            zIndex: -1 
          }}
          aria-hidden="true"
        >
          {/* ✅ Inicializar el mapa oculto para que Google Maps API ya esté lista */}
          <div 
            id="preload-map-container"
            style={{ width: '1px', height: '1px' }}
            ref={(node) => {
              if (node && isMapPreloaded && typeof window !== 'undefined' && window.google?.maps) {
                // ✅ Crear instancia del mapa oculta para prerenderizar
                try {
                  new window.google.maps.Map(node, {
                    zoom: 10,
                    center: { lat: 40.4168, lng: -3.7038 }, // Madrid por defecto
                    disableDefaultUI: true,
                    gestureHandling: 'none',
                  });
                } catch (e) {
                  // Ignorar errores de inicialización
                }
              }
            }}
          />
        </div>
      )}
    </header>
    </>
  );
}, (prevProps, nextProps) => {
  // ✅ Comparación personalizada: solo re-renderizar si onSearch cambia
  return prevProps.onSearch === nextProps.onSearch;
});
