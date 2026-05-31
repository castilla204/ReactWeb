import React, { useState, useRef, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { useIsMobile } from '../hooks/useIsMobile';
import { createPortal } from 'react-dom';
import { Search, ChevronDown, FolderTree, Filter, ChevronUp, Heart, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useServiceTypes } from '../hooks/useServiceTypes';
import { useCategories } from '../contexts/CategoryContext';
import { useAuth } from '../contexts/AuthContext';
import { isAdmin } from '../utils/admin';
// Importar imágenes directamente desde src/media para que Vite las procese
import { LoginModal } from './LoginModal';
import { CurrencySelector } from './CurrencySelector';
import casapngImg from '../media/casapng.png';
import cochepngImg from '../media/cochepng.png';
import motorcycleImg from '../media/motorcycle.png';
import motoaguaImg from '../media/motoagua.png';
import internet61Img from '../media/internet-61.png';
import houseImg from '../media/house.png';
import camarapngImg from '../media/camarapng.png';

// Mapa de imágenes importadas
const imageMap: Record<string, string> = {
  'casapng.png': casapngImg,
  'cochepng.png': cochepngImg,
  'motopng.png': motorcycleImg, // Usar motorcycle.png como motopng
  'motorcycle.png': motorcycleImg,
  'motoagua.png': motoaguaImg,
  'internet-61.png': internet61Img,
  'house.png': houseImg,
  'camarapng.png': camarapngImg,
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
import {
  HOMEPAGE_PICK_CATEGORY,
  type HomepagePickCategoryDetail,
} from '../utils/homepageCategoryPick';
const HomepageDesktopKayak = lazy(() =>
  import('./HomepageDesktopKayak').then((m) => ({ default: m.HomepageDesktopKayak })),
);
import {
  HP_FONT,
  HP_COLOR,
  HP_PANEL_GRADIENT,
  hpType,
  hpCardText,
  hpTitleUnderlineBarStyle,
  hpIconButtonClass,
} from '../constants/homepageTypography';

const CATEGORIES = {
  COCHES: 5,
  MOTOS: 6,
  INMOBILIARIA: 3,
  CAMARAS: 4,
  FONTANERIA: 12,
} as const;

interface AirbnbSearchBarProps {
  onSearch?: (searchData: {
    serviceTypeId: number | null;
    categoryId: number | null;
    adUrl: string;
  }) => void;
  countryCode?: string;
}

export const AirbnbSearchBar: React.FC<AirbnbSearchBarProps> = React.memo(({ onSearch, countryCode = 'ES' }) => {
  const navigate = useNavigate();
  const { user, isAuthenticated, signOut } = useAuth();
  // ✅ OPTIMIZADO: useServiceTypes y useCategories ya tienen cache, no hay problema en llamarlos aquí
  // Además, AirbnbSearchBar puede usarse independientemente, así que es correcto tenerlos aquí
  const { serviceTypes, isLoading: serviceTypesLoading } = useServiceTypes();
  const { categories, loading: categoriesLoading } = useCategories();
  
  // ✅ PRERENDERIZAR MAPA: Cargar Google Maps API en móvil para que esté listo cuando navegue
  // ✅ OPTIMIZADO: Solo cargar cuando realmente se necesita (móvil y cuando el modal está abierto)
  const isMobile = useIsMobile();

  const openMobileSearch = useCallback(() => {
    setIsMobileSearchOpen(true);
  }, []);
  
  const userEmail = (user as any)?.Email || user?.email;
  const userRole = (user as any)?.Role || user?.role;
  const isAdminByEmail = userEmail ? isAdmin(userEmail) : false;
  const isAdminByRole = userRole === 'Admin' || userRole === 'admin';
  const userIsAdmin = isAuthenticated && (isAdminByEmail || isAdminByRole);
  const isExpert = userRole === 'Expert';
  
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [serviceTypeId, setServiceTypeId] = useState<number | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(CATEGORIES.INMOBILIARIA);
  const [adUrl, setAdUrl] = useState('');
  const [activeField, setActiveField] = useState<string | null>(null);
  const [isServiceTypeOpen, setIsServiceTypeOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [expandedAccordion, setExpandedAccordion] = useState<string | null>(null);
  
  // ✅ En móvil, abrir automáticamente el acordeón de categorías cuando se abre el modal
  useEffect(() => {
    if (isMobileSearchOpen && isMobile) {
      setExpandedAccordion('where');
    }
  }, [isMobileSearchOpen, isMobile]);
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'coches' | 'motos' | 'inmobiliaria' | 'drawer' | null>('inmobiliaria');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerCategoryReplacement, setDrawerCategoryReplacement] = useState<{ id: number; name: string; image: string } | null>(null);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [imageCacheKey, setImageCacheKey] = useState(Date.now());
  const [waveKey, setWaveKey] = useState(0); // ✅ Para forzar re-render del efecto onda
  const serviceTypeDropdownRef = useRef<HTMLDivElement>(null);
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

  const normalizedServiceTypes = useMemo(
    () =>
      serviceTypes.map((st: { Id?: number; id?: number; Name?: string; name?: string; Description?: string; description?: string; Position?: number; position?: number }) => ({
        id: st.Id || st.id,
        name: st.Name || st.name,
        description: st.Description || st.description,
        position: st.Position || st.position,
      })),
    [serviceTypes],
  );

  const normalizedCategories = useMemo(
    () =>
      categories.map((cat: { Id?: number; id?: number; Name?: string; name?: string; IsActive?: boolean; isActive?: boolean; ParentId?: number | null; parentId?: number | null; IsParent?: boolean; isParent?: boolean }) => {
        const parentId = cat.ParentId ?? cat.parentId ?? null;
        return {
          id: cat.Id || cat.id,
          name: cat.Name || cat.name,
          isActive: cat.IsActive ?? cat.isActive ?? true,
          parentId,
          isParent: cat.IsParent ?? cat.isParent ?? parentId == null,
        };
      }),
    [categories],
  );

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
          
          // Tabs móvil (coches / inmobiliaria / más)
          if (params.categoryId === CATEGORIES.COCHES) {
            setActiveTab('coches');
          } else if (params.categoryId === CATEGORIES.MOTOS) {
            setActiveTab('motos');
          } else if (params.categoryId === CATEGORIES.INMOBILIARIA) {
            setActiveTab('inmobiliaria');
            setDrawerCategoryReplacement(null);
          } else {
            setActiveTab('inmobiliaria');
            setCategoryId(CATEGORIES.INMOBILIARIA);
          }
          
          // Abrir el modal móvil automáticamente
          const isMobileViewport = typeof window !== 'undefined' && window.innerWidth < 768;
          if (isMobileViewport) {
            openMobileSearch();
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

  // Cerrar dropdowns al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Solo cerrar si el dropdown está abierto y el clic es fuera
      if (isServiceTypeOpen && serviceTypeDropdownRef.current && !serviceTypeDropdownRef.current.contains(event.target as Node)) {
        setIsServiceTypeOpen(false);
        setActiveField(null);
      }
    };

    // Usar click en vez de mousedown para evitar conflictos
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isServiceTypeOpen]);
  
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

  // Filtro automático en homepage al cambiar categoría / tipo de servicio
  useEffect(() => {
    if (!onSearch || categoryId == null) return;
    onSearch({ serviceTypeId, categoryId, adUrl });
  }, [categoryId, serviceTypeId, adUrl, onSearch]);

  const handleSearch = () => {
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
    } else if (categoryId) {
      setIsNavigating(true);
      const params = new URLSearchParams();
      params.append('categoryId', categoryId.toString());
      if (serviceTypeId) params.append('serviceTypeId', serviceTypeId.toString());
      if (adUrl) params.append('adUrl', adUrl);
      navigate(`/crear-busqueda?${params.toString()}`, { replace: true });
    }
  };

  const handleTabClick = useCallback((tab: 'coches' | 'motos' | 'inmobiliaria', categoryIdValue: number) => {
    // ✅ Cambios instantáneos y coordinados
    setActiveTab(tab);
    setCategoryId(categoryIdValue);
    setIsDrawerOpen(false);
    setWaveKey(prev => prev + 1); // ✅ Trigger efecto onda
    
    if (tab === 'inmobiliaria' && categoryIdValue === CATEGORIES.INMOBILIARIA) {
      setDrawerCategoryReplacement(null);
    }
  }, []);

  const getCategoryImage = (categoryName: string): string | null => {
    const nameLower = categoryName.toLowerCase();
    if (nameLower.includes('moto') && !nameLower.includes('agua')) return getImageWithCache('motopng.png', imageCacheKey);
    if (nameLower.includes('coche') || nameLower.includes('vehículo')) return getImageWithCache('cochepng.png', imageCacheKey);
    if (nameLower.includes('inmobiliaria') || nameLower.includes('casa') || nameLower.includes('inmueble')) return getImageWithCache('casapng.png', imageCacheKey);
    if (nameLower.includes('cámara') || nameLower.includes('camara')) return getImageWithCache('camarapng.png', imageCacheKey);
    if (nameLower.includes('fontanería') || nameLower.includes('fontaneria') || nameLower.includes('caldera')) return getImageWithCache('house.png', imageCacheKey);
    return null;
  };

  const isBarActive = !!activeField || isServiceTypeOpen;

  const handleDrawerCategoryClick = (categoryIdValue: number, categoryName: string) => {
    const categoryImage = getCategoryImage(categoryName) || getImageWithCache('casapng.png', imageCacheKey);

    if (categoryIdValue === CATEGORIES.COCHES) {
      setActiveTab('coches');
      setDrawerCategoryReplacement(null);
    } else if (categoryIdValue === CATEGORIES.INMOBILIARIA) {
      setActiveTab('inmobiliaria');
      setDrawerCategoryReplacement(null);
    } else {
      setActiveTab('drawer');
      setDrawerCategoryReplacement({
        id: categoryIdValue,
        name: categoryName,
        image: categoryImage,
      });
    }

    setCategoryId(categoryIdValue);
    setIsDrawerOpen(false);
    setCategorySearchQuery('');
  };

  useEffect(() => {
    const onPick = (e: Event) => {
      const { categoryId: id, categoryName } = (e as CustomEvent<HomepagePickCategoryDetail>).detail;
      if (id === CATEGORIES.COCHES) {
        handleTabClick('coches', id);
      } else if (id === CATEGORIES.MOTOS) {
        handleTabClick('motos', id);
      } else if (id === CATEGORIES.INMOBILIARIA) {
        handleTabClick('inmobiliaria', id);
      } else if (categoryName) {
        handleDrawerCategoryClick(id, categoryName);
      }
    };
    window.addEventListener(HOMEPAGE_PICK_CATEGORY, onPick);
    return () => window.removeEventListener(HOMEPAGE_PICK_CATEGORY, onPick);
  }, [handleTabClick]);

  /** Solo categorías padre (como SearchCreationPage) — evita Electrodomésticos + subcategorías duplicadas */
  const parentCategories = useMemo(() => {
    const list = normalizedCategories.filter((c) => {
      if (!c.isActive) return false;
      return c.isParent !== undefined ? c.isParent : c.parentId == null;
    });
    const priority = (name: string) => {
      const n = name.toLowerCase();
      if (n.includes('coche') || n.includes('vehículo')) return 0;
      if (n.includes('inmobiliaria') || n.includes('inmueble')) return 1;
      return 2;
    };
    return [...list].sort(
      (a, b) => priority(a.name) - priority(b.name) || a.name.localeCompare(b.name, 'es')
    );
  }, [normalizedCategories]);

  /** Categorías del modal "Más" (padres, sin Coches/Inmobiliaria de los tabs) */
  const categoriesForDrawerModal = useMemo(
    () =>
      parentCategories.filter(
        (c) => c.id !== CATEGORIES.COCHES && c.id !== CATEGORIES.INMOBILIARIA
      ),
    [parentCategories]
  );

  const desktopCategoryTabs = useMemo(
    () =>
      [
        {
          key: 'coches' as const,
          label: 'Coches',
          icon: getImageWithCache('cochepng.png', imageCacheKey),
          onClick: () => handleTabClick('coches', CATEGORIES.COCHES),
          isActive: activeTab === 'coches',
        },
        {
          key: 'motos' as const,
          label: 'Motos',
          icon: getImageWithCache('motopng.png', imageCacheKey),
          onClick: () => handleTabClick('motos', CATEGORIES.MOTOS),
          isActive: activeTab === 'motos',
        },
        {
          key: 'inmobiliaria' as const,
          label: 'Inmobiliaria',
          icon: getImageWithCache('casapng.png', imageCacheKey),
          onClick: () => handleTabClick('inmobiliaria', CATEGORIES.INMOBILIARIA),
          isActive: activeTab === 'inmobiliaria',
        },
      ] as const,
    [
      activeTab,
      imageCacheKey,
      handleTabClick,
    ]
  );


  // Radix Popover maneja el cierre automáticamente, no necesitamos handleClickOutside

  return (
    <>
      {/* ✅ Overlay de transición con skeletons */}
      {isNavigating && <MapPageSkeleton />}
      
      {/* Desktop — barra fina */}
      <header
        className="sticky top-0 z-50 hidden md:block border-b border-[#dbe8f5]/80"
        style={{
          background:
            'linear-gradient(128deg, #dceaf8 0%, #eaf2fb 34%, #fafafa 100%)',
        }}
      >
        <div className="w-full h-12 flex items-center justify-between px-6 md:px-8 lg:px-10 xl:px-14">
          <button
            type="button"
            onClick={() => {
              if (isAuthenticated) {
                navigate('/busquedas');
              } else {
                setIsLoginModalOpen(true);
              }
            }}
            className="inline-flex items-center gap-2 rounded-full border border-[#d1d5db] bg-white px-3.5 py-1.5 text-[13px] font-semibold text-[#222222] hover:border-[#222222] hover:bg-[#f9fafb] transition-colors"
          >
            <User className="h-4 w-4 shrink-0" strokeWidth={2.1} />
            {isAuthenticated ? 'Mi cuenta' : 'Iniciar sesión'}
          </button>

          <div className="flex items-center gap-2">
            {userIsAdmin && (
              <button
                type="button"
                onClick={() => navigate('/admin')}
                className="text-xs font-semibold text-red-600 px-2.5 py-1 rounded-md border border-red-300 hover:bg-red-50"
              >
                Admin
              </button>
            )}
            <CurrencySelector variant="compact" />
            <button
              type="button"
              aria-label="Favoritos"
              onClick={() => navigate('/favoritos')}
              className="h-8 w-8 rounded-full border border-[#e5e7eb] bg-white hover:bg-[#f9fafb] text-[#222] inline-flex items-center justify-center transition-colors"
            >
              <Heart className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {!isMobile && (
        <Suspense
          fallback={
            <div
              className="hidden md:block h-[400px] lg:h-[500px] xl:h-[520px] bg-[#e8f0f7] animate-pulse"
              aria-hidden
            />
          }
        >
          <HomepageDesktopKayak
            categoryTabs={desktopCategoryTabs}
            categoryId={categoryId ?? CATEGORIES.INMOBILIARIA}
            countryCode={countryCode}
          />
        </Suspense>
      )}

      {/* Mobile */}
      <header className="sticky top-0 z-50 md:hidden bg-white border-b border-[#ebebeb] relative">
        <div className="px-4 pt-3.5 pb-1">
          <div
            onClick={openMobileSearch}
            className="w-full bg-white border border-gray-200 rounded-full transition-all flex items-center justify-center gap-3 px-4 cursor-pointer relative"
            
            style={{
              height: '56px',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.04), 0 8px 16px 0 rgba(0, 0, 0, 0.08)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 2px 4px 0 rgba(0, 0, 0, 0.06), 0 12px 24px 0 rgba(0, 0, 0, 0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.04), 0 8px 16px 0 rgba(0, 0, 0, 0.08)';
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
                  fontFamily: HP_FONT,
                  color: 'rgb(34, 34, 34)',
                }}
              >
                ¿Qué revisamos?
              </span>
              <div 
                className="flex items-center gap-1"
                style={{
                  fontSize: '12px',
                  lineHeight: '16px',
                  fontWeight: 400,
                  fontFamily: HP_FONT,
                  color: HP_COLOR.muted,
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
            
            {/* Botón circular con ícono de filtro - Posicionado absoluto a la derecha */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                openMobileSearch();
              }}
              className="absolute right-4 flex-shrink-0 w-10 h-10 rounded-full bg-[#0066CC] hover:bg-[#005bb5] transition-colors flex items-center justify-center cursor-pointer"
              aria-label="Filtros"
            >
              <Filter className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        {/* Tabs Mobile — fila compacta centrada (estilo Airbnb) */}
        <div className="w-full" role="tablist" aria-label="Categorías principales">
          <div className="flex justify-center gap-5 min-[390px]:gap-6 px-2 pt-0 pb-0">
            {(
              [
                {
                  id: 'coches' as const,
                  categoryId: CATEGORIES.COCHES,
                  label: 'Coches',
                  image: 'cochepng.png',
                  alt: 'Coche',
                },
                {
                  id: 'motos' as const,
                  categoryId: CATEGORIES.MOTOS,
                  label: 'Motos',
                  image: 'motopng.png',
                  alt: 'Moto',
                },
                {
                  id: 'inmobiliaria' as const,
                  categoryId: CATEGORIES.INMOBILIARIA,
                  label: 'Inmobiliaria',
                  image: 'casapng.png',
                  alt: 'Casa',
                },
              ] as const
            ).map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => handleTabClick(tab.id, tab.categoryId)}
                  className={`flex w-[5.25rem] min-[390px]:w-24 shrink-0 flex-col items-center border-b-2 bg-transparent py-0.5 cursor-pointer transition-[border-color,color,transform] active:scale-95 ${
                    isActive ? 'border-[#0066CC]' : 'border-transparent'
                  }`}
                >
                  <img
                    src={getImageWithCache(tab.image, imageCacheKey)}
                    alt={tab.alt}
                    className="mb-0 h-14 w-14 min-[390px]:h-16 min-[390px]:w-16 object-contain"
                    width={56}
                    height={56}
                  />
                  <span
                    className="-mt-0.5 max-w-full truncate text-center text-[13px] min-[390px]:text-sm leading-tight"
                    style={{
                      fontWeight: isActive ? 600 : 400,
                      fontFamily: HP_FONT,
                      color: isActive ? 'rgb(34, 34, 34)' : HP_COLOR.muted,
                    }}
                  >
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Modal Mobile */}
      {isMobileSearchOpen && typeof document !== 'undefined' && createPortal(
        <>
          <div 
            className="md:hidden fixed inset-0 z-50 flex flex-col"
            style={{
              background: isMobile ? HP_PANEL_GRADIENT : '#f9fafb',
              boxShadow: isMobile ? undefined : '0 4px 24px rgba(15, 23, 42, 0.08)',
            }}
          >
            {!isMobile && (
            <div className="absolute top-4 left-4 right-4 z-[60] flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  navigate('/');
                  setIsMobileSearchOpen(false);
                }}
                className={hpIconButtonClass}
                aria-label="Volver a inicio"
              >
                <ChevronUp className="h-4 w-4" style={{ strokeWidth: 2.5 }} />
              </button>
              <button
                type="button"
                onClick={() => setIsMobileSearchOpen(false)}
                className={hpIconButtonClass}
                aria-label="Cerrar"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 32 32" 
                  aria-hidden="true" 
                  role="presentation" 
                  focusable="false"
                  className="h-4 w-4"
                  style={{ display: 'block', fill: 'none', stroke: 'currentColor', strokeWidth: 2.25, overflow: 'visible' }}
                >
                  <path d="m6 6 20 20M26 6 6 26"></path>
                </svg>
              </button>
            </div>
            )}

            <div className="flex-1 overflow-y-auto">
              <div className={isMobile ? 'h-full' : 'pt-20 px-4 pb-6 space-y-4'}>
              {/* Categorías */}
              <div 
                ref={categoriesContainerRef}
                className={`border-0 flex flex-col ${
                  (expandedAccordion === 'where' || isMobile)
                    ? 'fixed inset-0 z-[60] rounded-none'
                    : 'bg-white rounded-2xl shadow-[0_8px_20px_rgba(0,0,0,0.18),0_4px_8px_rgba(0,0,0,0.12)]'
                } ${
                  expandedAccordion === 'where' && !isMobile
                    ? 'shadow-[0_8px_24px_rgba(0,0,0,0.15),0_4px_8px_rgba(0,0,0,0.12)]'
                    : ''
                }`}
                style={{
                  background: (expandedAccordion === 'where' || isMobile) ? HP_PANEL_GRADIENT : '#ffffff',
                  height: (expandedAccordion === 'where' || isMobile) ? '100vh' : 'auto',
                  minHeight: (expandedAccordion === 'where' || isMobile) ? '100vh' : '280px',
                  maxHeight: (expandedAccordion === 'where' || isMobile) ? '100vh' : '320px',
                  transition: isMobile ? 'none' : 'height 150ms cubic-bezier(0.4, 0, 0.2, 1), min-height 150ms cubic-bezier(0.4, 0, 0.2, 1), max-height 150ms cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                {/* ✅ En móvil: Siempre mostrar desplegado, sin modo colapsado */}
                {(expandedAccordion === 'where' || isMobile) ? (
                  <>
                    {isMobile && (
                      <div
                        className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between"
                        style={{ top: 'max(1rem, env(safe-area-inset-top, 0px))' }}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            navigate('/');
                            setIsMobileSearchOpen(false);
                          }}
                          className={hpIconButtonClass}
                          aria-label="Volver a inicio"
                        >
                          <ChevronUp className="h-4 w-4" style={{ strokeWidth: 2.5 }} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsMobileSearchOpen(false)}
                          className={hpIconButtonClass}
                          aria-label="Cerrar"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 32 32"
                            aria-hidden="true"
                            role="presentation"
                            focusable="false"
                            className="h-4 w-4"
                            style={{ display: 'block', fill: 'none', stroke: 'currentColor', strokeWidth: 2.25, overflow: 'visible' }}
                          >
                            <path d="m6 6 20 20M26 6 6 26" />
                          </svg>
                        </button>
                      </div>
                    )}

                    <div
                      className={`px-4 border-b border-[#e8e8e8]/90 ${isMobile ? 'pb-3 pt-[calc(max(1rem,env(safe-area-inset-top,0px))+3rem)]' : 'pb-4 pt-6'}`}
                    >
                      <div className={`flex items-center justify-between ${isMobile ? '' : 'mb-4'}`}>
                        <h2
                          tabIndex={-1}
                          className={`relative inline-block ${isMobile ? 'hp-section-title' : ''}`}
                          style={
                            isMobile
                              ? {
                                  fontFeatureSettings: '"liga" 1, "kern" 1',
                                  WebkitFontSmoothing: 'antialiased',
                                  MozOsxFontSmoothing: 'grayscale',
                                }
                              : {
                                  ...hpType.modalTitle,
                                  color: HP_COLOR.secondary,
                                  fontFeatureSettings: '"liga" 1, "kern" 1',
                                  WebkitFontSmoothing: 'antialiased',
                                  MozOsxFontSmoothing: 'grayscale',
                                }
                          }
                        >
                          ¿Qué revisamos?
                          <span aria-hidden style={hpTitleUnderlineBarStyle} />
                        </h2>
                        {isMobile && (
                          <p className="hp-eyebrow mt-2 max-w-[85%]">Elige una categoría</p>
                        )}
                        {!isMobile && (
                          <button
                            type="button"
                            onClick={() => setExpandedAccordion(null)}
                            className={hpIconButtonClass}
                            aria-label="Comprimir categorías"
                          >
                            <ChevronDown className="h-4 w-4 rotate-180" style={{ strokeWidth: 2.5 }} />
                          </button>
                        )}
                      </div>
                      {!isMobile && (
                        <form role="search" className="w-full">
                          <label
                            htmlFor="categories-search-input"
                            className="flex items-center w-full px-4 py-3.5 border-0 rounded-lg bg-gray-50 shadow-sm"
                            style={{
                              fontFamily: HP_FONT,
                            }}
                          >
                            <div className="flex items-center justify-center mr-3">
                              <svg
                                viewBox="0 0 32 32"
                                xmlns="http://www.w3.org/2000/svg"
                                aria-hidden="true"
                                role="presentation"
                                focusable="false"
                                style={{
                                  display: 'block',
                                  fill: 'none',
                                  height: '16px',
                                  width: '16px',
                                  stroke: 'currentcolor',
                                  strokeWidth: 4,
                                  overflow: 'visible',
                                }}
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
                                fontFamily: HP_FONT,
                              }}
                              autoComplete="off"
                              autoCorrect="off"
                              spellCheck="false"
                              aria-label="Buscar destinos"
                            />
                          </label>
                        </form>
                      )}
                    </div>

                    {/* Contenido expandido al 100% */}
                    <div
                      className="flex-1 overflow-y-auto px-4 py-4"
                      style={{
                        paddingBottom: isMobile
                          ? 'max(1rem, env(safe-area-inset-bottom, 0px))'
                          : undefined,
                      }}
                    >
                      <div>
                        {categoriesLoading ? (
                          <SkeletonTheme baseColor="#f3f4f6" highlightColor="#e5e7eb">
                            <div className="flex flex-col gap-3">
                              {[...Array(4)].map((_, index) => (
                                <Skeleton key={index} height={72} borderRadius={12} />
                              ))}
                            </div>
                          </SkeletonTheme>
                        ) : (
                    <div className="flex flex-col gap-3">
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
                                // ✅ En móvil: Navegar directamente al mapa con la categoría seleccionada
                                setCategoryId(category.id);
                                setCategorySearchQuery('');
                                
                                // ✅ Usar serviceTypeId existente o 1 por defecto
                                const defaultServiceTypeId = serviceTypeId || 1;
                                
                                // Navegar al mapa con la categoría y serviceTypeId por defecto
                                const params = new URLSearchParams();
                                params.append('categoryId', category.id.toString());
                                params.append('serviceTypeId', defaultServiceTypeId.toString());
                                if (adUrl) {
                                  params.append('adUrl', adUrl);
                                }
                                
                                // ✅ Usar window.location.href para navegación directa sin mostrar homepage
                                window.location.href = `/crear-busqueda?${params.toString()}`;
                                
                                // Llamar a onSearch para actualizar los filtros (antes de navegar)
                                if (onSearch) {
                                  onSearch({
                                    serviceTypeId: defaultServiceTypeId,
                                    categoryId: category.id,
                                    adUrl,
                                  });
                                }
                              }}
                                    className={`w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all duration-300 ease-out border animate-fade-in ${
                                      categoryId === category.id 
                                        ? 'border-[#005bb5]/40 bg-[#0066CC] text-white shadow-md shadow-[#0066CC]/20' 
                                        : 'border-[#ebebeb]/90 bg-white/80 shadow-sm backdrop-blur-sm hover:bg-white active:bg-white'
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
                                  categoryId === category.id ? 'bg-white/20' : 'bg-white'
                                }`}>
                                  <FolderTree className={`w-6 h-6 ${categoryId === category.id ? 'text-white' : 'text-[#737373]'}`} />
                                        </div>
                                      )}
                              <div>
                                    <div
                                      style={{
                                        ...hpCardText.title,
                                        color: categoryId === category.id ? '#ffffff' : HP_COLOR.secondary,
                                      }}
                                    >
                                  {category.name}
                                </div>
                                      <div
                                        style={{
                                          ...hpType.body,
                                          color: categoryId === category.id ? 'rgba(255, 255, 255, 0.85)' : HP_COLOR.muted,
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
                                className="text-center py-4"
                                style={{ ...hpType.body, color: HP_COLOR.muted }}
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
                    {/* ✅ SOLO EN DESKTOP: Vista colapsada (en móvil nunca se muestra) */}
                    {!isMobile && (
                      <>
                        {/* Header fijo con título y buscador - Estilo Airbnb */}
                        <div className="px-4 pt-6 pb-4 border-b border-gray-200">
                          <h2
                            tabIndex={-1}
                            className="relative mb-4 inline-block"
                            style={{
                              ...hpType.modalTitle,
                              color: HP_COLOR.secondary,
                              fontFeatureSettings: '"liga" 1, "kern" 1',
                              WebkitFontSmoothing: 'antialiased',
                              MozOsxFontSmoothing: 'grayscale',
                            }}
                          >
                            ¿Qué revisamos?
                            <span aria-hidden style={hpTitleUnderlineBarStyle} />
                          </h2>
                          
                          {/* Buscador fijo fuera del scroll */}
                          <form role="search" className="w-full">
                            <label 
                              htmlFor="categories-search-input-collapsed"
                              className="flex items-center w-full px-4 py-3.5 border-0 rounded-lg bg-gray-50 shadow-sm"
                              style={{ 
                                fontFamily: HP_FONT 
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
                                  fontFamily: HP_FONT 
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
                                          setExpandedAccordion('type');
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
                                              fontFamily: HP_FONT,
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
                                              fontFamily: HP_FONT,
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
                                      fontFamily: HP_FONT 
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
                  </>
                )}

                {/* Separador y flecha al final - Solo cuando NO está expandido Y NO es móvil */}
                {/* ✅ En móvil: Nunca mostrar la flecha de expandir */}
                {expandedAccordion !== 'where' && !isMobile && (
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

              {/* ✅ OCULTAR en móvil: Tipo de servicio - Rectángulo con sombra - Estilo Airbnb */}
              {!isMobile && (
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
                        fontFamily: HP_FONT 
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
                        fontFamily: HP_FONT 
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
              )}

              {/* ✅ OCULTAR en móvil: URL del anuncio - Rectángulo con sombra */}
              {!isMobile && (
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
              )}
            </div>
          </div>

          {/* ✅ OCULTAR en móvil: Botones de acción */}
          {!isMobile && (
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
          )}
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
          <div className="px-4 pt-2 pb-3 border-b border-[#e8e8e8]/90 flex-shrink-0">
            <h2 className="mb-0 hp-section-title">
              Más Categorías
            </h2>
          </div>

          {/* Barra de búsqueda mejorada */}
          <div className="px-4 pt-3 pb-3 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar categorías..."
                value={categorySearchQuery}
                onChange={(e) => setCategorySearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#f9fafb] rounded-lg text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:bg-white transition-all border border-[#ebebeb]/80"
                style={{
                  fontSize: '14px',
                  lineHeight: '18px',
                  fontWeight: 400,
                  fontFamily: HP_FONT,
                }}
              />
            </div>
          </div>
          
          {/* Lista de categorías mejorada - Scroll habilitado */}
          <div 
            className="flex-1 overflow-y-auto px-4" 
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
                {categoriesForDrawerModal
                  .filter(cat => {
                    if (categorySearchQuery.trim()) {
                      return cat.name.toLowerCase().includes(categorySearchQuery.toLowerCase());
                    }
                    return true;
                  })
                  .map((category) => {
                    const categoryImage = getCategoryImage(category.name);
                    const isSelected = categoryId === category.id;
                    
                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => handleDrawerCategoryClick(category.id, category.name)}
                        className={`flex items-center gap-4 px-4 py-4 transition-colors w-full rounded-xl border ${
                          isSelected
                            ? 'border-[#0066CC]/30 bg-[#0066CC]/8'
                            : 'border-transparent hover:bg-[#f9fafb]'
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
                            className="leading-tight mb-0.5"
                            style={{ ...hpCardText.title }}
                          >
                            {category.name}
                          </h3>
                          <p style={{ ...hpType.body, color: HP_COLOR.muted }}>
                            Explorar servicios
                          </p>
                        </div>
                        
                        {isSelected && (
                          <div className="flex-shrink-0">
                            <div className="w-2 h-2 rounded-full bg-[#0066CC]" />
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
                        fontFamily: HP_FONT,
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

      <LoginModal
        open={isLoginModalOpen}
        onOpenChange={setIsLoginModalOpen}
        initialTab="login"
        onSuccess={() => setIsLoginModalOpen(false)}
      />
    </>
  );
}, (prevProps, nextProps) =>
  prevProps.onSearch === nextProps.onSearch &&
  prevProps.countryCode === nextProps.countryCode);
