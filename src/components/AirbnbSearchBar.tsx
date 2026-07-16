import React, { useState, useRef, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { useIsMobile } from '../hooks/useIsMobile';
import {
  Search,
  FolderTree,
  Heart,
  User,
  Car,
  Bike,
  Home,
  Camera,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useServiceTypes } from '../hooks/useServiceTypes';
import { useCategories } from '../contexts/CategoryContext';
import { useAuth } from '../contexts/AuthContext';
import { isAdmin } from '../utils/admin';
// Importar imágenes directamente desde src/media para que Vite las procese
import { CurrencySelector } from './CurrencySelector';
import { HomepageDesktopTopBar } from './HomepageDesktopTopBar';
import { MobileSearchPill } from './homepage/MobileSearchPill';
import { CategoryPickerRow } from './homepage/CategoryPickerRow';
import casapngImg from '../media/casapng.png';
import cochepngImg from '../media/cochepng.png';
import motorcycleImg from '../media/motorcycle.png';
import motoaguaImg from '../media/motoagua.png';
import internet61Img from '../media/internet-61.png';
import houseImg from '../media/house.png';
import camarapngImg from '../media/camarapng.png';
import calderaImg from '../media/caldera.png';
// Fotos reales del oficio (las mismas que usa SearchInspectionListItem en
// /busquedas). Se usan en el picker office-row para hablar el mismo lenguaje
// "carpeta del despacho del perito" que el listado de inspecciones.
import revisionCocheImg from '../media/revisioncoche.jpg';
import revisionMotoImg from '../media/revisionmoto.jpg';
import revisionCasaImg from '../media/revisioncasa.jpg';
import { getCategoryMeta } from '../data/categoryMeta';

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
  'caldera.png': calderaImg,
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
import { SileoSkeleton } from './ui/sileo-skeleton';
import {
  HOMEPAGE_OPEN_SEARCH,
  HOMEPAGE_PICK_CATEGORY,
  type HomepagePickCategoryDetail,
} from '../utils/homepageCategoryPick';
const HomepageDesktopKayak = lazy(() =>
  import('./HomepageDesktopKayak').then((m) => ({ default: m.HomepageDesktopKayak })),
);
const LoginModalLazy = lazy(() =>
  import('./LoginModal').then((m) => ({ default: m.LoginModal })),
);
import {
  HP_FONT,
} from '../constants/homepageTypography';
import {
  DESKTOP_HERO_MAP_POSTER,
  DESKTOP_HERO_MIN_HEIGHT_CLASS,
} from '../constants/homepageHeroMap';
import {
  HP_MOBILE_HEADER_INSET_CLASS,
} from '../constants/homepageMobileRhythm';
import {
  MOBILE_SEARCH_MODAL_SUBTITLE,
  MOBILE_SEARCH_MODAL_TITLE,
} from '../constants/homepageSearchCopy';
import { cn } from '../lib/utils';

const CATEGORIES = {
  VEHICULOS: 2,
  COCHES: 5,
  MOTOS: 6,
  INMOBILIARIA: 3,
  CAMARAS: 4,
  FONTANERIA: 12,
} as const;

const isVehiculosParentCategory = (category: { id: number; name: string; parentId?: number | null }) =>
  category.id === CATEGORIES.VEHICULOS ||
  (category.parentId == null && category.name.toLowerCase().includes('vehículo'));

const getCategoryLucideIcon = (categoryName: string): LucideIcon => {
  const nameLower = categoryName.toLowerCase();
  if (nameLower.includes('moto') && !nameLower.includes('agua')) return Bike;
  if (nameLower.includes('coche') || nameLower.includes('vehículo')) return Car;
  if (nameLower.includes('inmobiliaria') || nameLower.includes('casa') || nameLower.includes('inmueble')) return Home;
  if (nameLower.includes('cámara') || nameLower.includes('camara')) return Camera;
  if (nameLower.includes('fontanería') || nameLower.includes('fontaneria') || nameLower.includes('caldera')) return Wrench;
  return FolderTree;
};

/**
 * Devuelve el PNG real de la app para una categoría (cochepng, motorcycle,
 * casapng, etc.). Cuando hay match real, evitamos el icon outline genérico
 * de lucide y mostramos la ilustración de la marca — mucho más distintiva,
 * sin "feel de juguete" que dan los iconos planos en cards grandes.
 */
/**
 * Foto REAL del oficio (no la ilustración PNG). Reutilizamos los JPGs que ya
 * sirve `SearchInspectionListItem` en /busquedas — así el picker y el listado
 * hablan el mismo idioma "carpeta del despacho del perito". Si no hay foto
 * real para la categoría (p.ej. coming-soon o cámaras), devolvemos null y el
 * componente cae a la ilustración del imageMap.
 */
const getCategoryPhoto = (categoryName: string): string | null => {
  const n = categoryName.toLowerCase();
  if (n.includes('moto') && n.includes('agua')) return null; // sin foto real aún
  if (n.includes('moto')) return revisionMotoImg;
  if (n.includes('coche') || n.includes('vehículo')) return revisionCocheImg;
  if (n.includes('inmobiliaria') || n.includes('casa') || n.includes('inmueble')) return revisionCasaImg;
  return null;
};

const getCategoryImage = (categoryName: string): string | null => {
  const n = categoryName.toLowerCase();
  if (n.includes('moto') && n.includes('agua')) return motoaguaImg;
  if (n.includes('moto')) return motorcycleImg;
  if (n.includes('coche') || n.includes('vehículo')) return cochepngImg;
  if (n.includes('inmobiliaria') || n.includes('casa') || n.includes('inmueble')) return casapngImg;
  if (n.includes('cámara') || n.includes('camara')) return camarapngImg;
  if (n.includes('internet') || n.includes('online') || n.includes('web')) return internet61Img;
  // Fontanería / caldera / calefacción: ilustración de caldera blanca con display "25 °C"
  if (
    n.includes('fontaner') ||
    n.includes('caldera') ||
    n.includes('calefac') ||
    n.includes('plomer')
  )
    return calderaImg;
  if (n.includes('hogar')) return houseImg;
  return null;
};


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

  // Permite abrir el picker "Elige qué quieres revisar" desde fuera (p.ej. la
  // tarjeta hero de HomepageMobileHero, que no es hija de AirbnbSearchBar).
  useEffect(() => {
    window.addEventListener(HOMEPAGE_OPEN_SEARCH, openMobileSearch);
    return () => window.removeEventListener(HOMEPAGE_OPEN_SEARCH, openMobileSearch);
  }, [openMobileSearch]);

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
  const [mobileHeaderScrolled, setMobileHeaderScrolled] = useState(false);

  useEffect(() => {
    if (!isMobile) return;
    const onScroll = () => setMobileHeaderScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isMobile]);
  
  // ✅ En móvil, abrir automáticamente el acordeón de categorías cuando se abre el modal
  useEffect(() => {
    if (isMobileSearchOpen && isMobile) {
      setExpandedAccordion('where');
    }
  }, [isMobileSearchOpen, isMobile]);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('mobile-search-overlay', { detail: { active: isMobileSearchOpen } }),
    );
    return () => {
      window.dispatchEvent(
        new CustomEvent('mobile-search-overlay', { detail: { active: false } }),
      );
    };
  }, [isMobileSearchOpen]);
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'coches' | 'motos' | 'inmobiliaria' | 'drawer' | null>('inmobiliaria');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  // 'map' = abierto desde "Buscar en el mapa" (al elegir categoría navega al mapa).
  // 'filter' = abierto desde la pestaña "Más" (al elegir categoría filtra la homepage).
  const [drawerIntent, setDrawerIntent] = useState<'filter' | 'map'>('filter');
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

  const mobilePillCategoryLabel = useMemo(() => {
    if (drawerCategoryReplacement?.name) return drawerCategoryReplacement.name;
    return selectedCategory?.name ?? 'Inmobiliaria';
  }, [drawerCategoryReplacement, selectedCategory]);

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

  // Filtro automático en homepage al cambiar categoría / tipo de servicio
  useEffect(() => {
    if (!onSearch || categoryId == null) return;
    onSearch({ serviceTypeId, categoryId, adUrl });
  }, [categoryId, serviceTypeId, adUrl, onSearch]);

  const handleSearch = () => {
    if (serviceTypeId && categoryId) {
      // El skeleton de transición lo pinta el fallback de RouteSuspense de /hire
      // (mismo MapPageSkeleton que usa SearchCreationPage) — no hace falta un
      // overlay propio aquí: React desmonta este componente en el mismo commit
      // en que cambia la ruta, así que nunca llegaría a pintarse.
      const params = new URLSearchParams();
      params.append('serviceTypeId', serviceTypeId.toString());
      params.append('categoryId', categoryId.toString());
      if (adUrl) params.append('adUrl', adUrl);
      
      // ✅ Navegar directamente sin pasar por homepage
      navigate(`/hire?${params.toString()}`, { replace: true });
    } else if (categoryId) {
      const params = new URLSearchParams();
      params.append('categoryId', categoryId.toString());
      if (serviceTypeId) params.append('serviceTypeId', serviceTypeId.toString());
      if (adUrl) params.append('adUrl', adUrl);
      navigate(`/hire?${params.toString()}`, { replace: true });
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

  // Abre el drawer existente en "modo mapa". Lo invoca el botón "Buscar en el
  // mapa" de HomepageDesktopKayak.
  const openMapCategoryDrawer = useCallback(() => {
    setDrawerIntent('map');
    setIsDrawerOpen(true);
  }, []);

  const navigateToCategoryMap = useCallback(
    (mapCategoryId: number) => {
      const stId = serviceTypeId || 2;
      setIsMobileSearchOpen(false);
      setIsDrawerOpen(false);
      setDrawerIntent('filter');
      setCategorySearchQuery('');

      if (onSearch) {
        onSearch({ serviceTypeId: stId, categoryId: mapCategoryId, adUrl });
      }

      const params = new URLSearchParams({
        categoryId: mapCategoryId.toString(),
        serviceTypeId: stId.toString(),
        step: 'map',
      });
      if (adUrl) params.append('adUrl', adUrl);
      navigate(`/hire?${params.toString()}`);
    },
    [serviceTypeId, adUrl, navigate, onSearch],
  );

  const goToCategoryMap = (mapCategoryId: number) => {
    navigateToCategoryMap(mapCategoryId);
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
      if (isVehiculosParentCategory(c)) return false;
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

  /** Solo las 3 categorías accionables en el picker móvil */
  const mobilePickerCategories = useMemo(() => {
    const primaryIds = [CATEGORIES.COCHES, CATEGORIES.MOTOS, CATEGORIES.INMOBILIARIA] as const;
    return primaryIds
      .map((id) => normalizedCategories.find((c) => c.id === id && c.isActive))
      .filter((c): c is NonNullable<typeof c> => !!c);
  }, [normalizedCategories]);

  /**
   * Categorías "Próximamente" del picker móvil — se muestran como filas
   * deshabilitadas (nombre + etiqueta) en vez de un pie de nota aparte.
   * Antes la nota ("de momento solo para explorar") describía categorías
   * invisibles en este picker; mostrarlas, aunque bloqueadas, es más
   * transparente que ocultarlas u ocultar el motivo tras un texto suelto.
   */
  const comingSoonPickerCategories = useMemo(() => {
    const ids = [CATEGORIES.CAMARAS, CATEGORIES.FONTANERIA] as const;
    return ids
      .map((id) => normalizedCategories.find((c) => c.id === id))
      .filter((c): c is NonNullable<typeof c> => !!c);
  }, [normalizedCategories]);

  /**
   * Total de categorías (activas + "Próximamente") del drawer de escritorio
   * "¿Qué quieres revisar?" / "Más categorías", antes de filtrar por búsqueda.
   * Un buscador con 1-2 filas debajo es ruido, no ayuda — se oculta hasta que
   * de verdad hay catálogo que buscar.
   */
  const drawerBaseCategoryCount = useMemo(() => {
    const base = drawerIntent === 'map' ? parentCategories : categoriesForDrawerModal;
    return base.length + comingSoonPickerCategories.length;
  }, [drawerIntent, parentCategories, categoriesForDrawerModal, comingSoonPickerCategories]);

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
        {
          key: 'mas' as const,
          label: 'Más',
          icon: null,
          onClick: () => {
            setDrawerIntent('filter');
            setIsDrawerOpen(true);
          },
          isActive: false,
          highlight: true,
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
      <HomepageDesktopTopBar variant="plain" showLogo />

      {!isMobile && (
        <Suspense
          fallback={
            <div
              className={`hidden md:block ${DESKTOP_HERO_MIN_HEIGHT_CLASS} bg-surface-tinted`}
              style={{ background: DESKTOP_HERO_MAP_POSTER }}
              aria-hidden
            />
          }
        >
          <HomepageDesktopKayak
            categoryTabs={desktopCategoryTabs}
            onSearchInMap={openMapCategoryDrawer}
            countryCode={countryCode}
          />
        </Suspense>
      )}

      {/* Mobile */}
      <header
        className={`sticky top-0 z-50 md:hidden border-b bg-white/95 backdrop-blur-sm supports-[backdrop-filter]:bg-white/90 transition-[border-color,box-shadow] duration-200 ${
          mobileHeaderScrolled
            ? 'border-line shadow-[0_1px_0_rgba(0,0,0,0.04),0_4px_16px_rgba(15,23,42,0.08)]'
            : 'border-transparent'
        }`}
      >
        <div className={HP_MOBILE_HEADER_INSET_CLASS}>
          <MobileSearchPill
            categoryId={categoryId}
            categoryLabel={mobilePillCategoryLabel}
            onOpen={openMobileSearch}
          />
        </div>
      </header>

      {/* Picker móvil "elige qué revisar" — hoja que se ajusta a su contenido real
          (3 categorías + enlace), no pantalla completa. A pantalla completa, 3
          filas cortas dejaban un vacío estructural en cualquier móvil alto
          (376px de hueco medido en iPhone 15 Pro Max) sin importar cómo se
          repartiera el contenido dentro. */}
      <ResponsiveModal
        open={isMobileSearchOpen}
        onOpenChange={setIsMobileSearchOpen}
        title={MOBILE_SEARCH_MODAL_TITLE}
        description={MOBILE_SEARCH_MODAL_SUBTITLE}
        className="md:hidden"
        drawerClassName="md:hidden"
        scaleBackground={false}
        autoFocus
      >
        <div className="px-4 pb-6 pt-2">
          <div className="mx-auto flex w-full max-w-md flex-col">
            {categoriesLoading ? (
              <div role="status" aria-busy="true" className="flex flex-col gap-2.5 py-2">
                <span className="sr-only">Cargando categorías…</span>
                {[...Array(4)].map((_, index) => (
                  <SileoSkeleton key={index} className="h-[88px] w-full rounded-2xl" />
                ))}
              </div>
            ) : (
              <div className="flex flex-col">
                {mobilePickerCategories.map((category, index) => (
                  <CategoryPickerRow
                    key={category.id}
                    index={index}
                    name={category.name}
                    image={getCategoryImage(category.name)}
                    fallbackIcon={getCategoryLucideIcon(category.name)}
                    meta={getCategoryMeta(category.id)}
                    selected={categoryId === category.id}
                    onClick={() => {
                      setCategorySearchQuery('');

                      if (category.id === CATEGORIES.COCHES) {
                        handleTabClick('coches', category.id);
                      } else if (category.id === CATEGORIES.MOTOS) {
                        handleTabClick('motos', category.id);
                      } else {
                        handleTabClick('inmobiliaria', category.id);
                      }

                      navigateToCategoryMap(category.id);
                    }}
                  />
                ))}
                {comingSoonPickerCategories.map((category) => {
                  const Icon = getCategoryLucideIcon(category.name);
                  return (
                    <div
                      key={category.id}
                      aria-label={`${category.name}, próximamente disponible`}
                      className="flex w-full cursor-default items-center gap-4 border-b border-line px-4 py-3 text-left last:border-b-0 opacity-60"
                    >
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-surface-tinted">
                        <Icon className="h-6 w-6 text-ink-soft" strokeWidth={1.75} aria-hidden />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="line-clamp-1 text-subtitle font-semibold leading-tight tracking-[-0.01em] text-ink-muted">
                          {category.name}
                        </h3>
                        <p className="mt-0.5 text-caption leading-snug text-ink-soft">Próximamente</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!categoriesLoading && (
              <div className="mt-8 flex flex-col items-center gap-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileSearchOpen(false);
                    setDrawerIntent('filter');
                    setIsDrawerOpen(true);
                  }}
                  className="inline-flex h-11 items-center gap-2 rounded-md border border-line px-4 text-body font-semibold text-ink-strong transition-colors hover:bg-surface-tinted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  <FolderTree className="h-4 w-4 text-ink-soft" strokeWidth={2} aria-hidden />
                  Ver catálogo completo
                </button>
              </div>
            )}
          </div>
        </div>
      </ResponsiveModal>

      {/* Modal Más Categorías */}
      <ResponsiveModal
        open={isDrawerOpen}
        onOpenChange={(open) => {
          setIsDrawerOpen(open);
          if (!open) {
            setCategorySearchQuery('');
            setDrawerIntent('filter');
          }
        }}
        title={drawerIntent === 'map' ? '¿Qué quieres revisar?' : 'Más categorías'}
        description={
          drawerIntent === 'map'
            ? 'Elige una categoría y te llevamos al mapa con los expertos disponibles.'
            : 'Explora todas las categorías del catálogo de inspecciones.'
        }
        drawerClassName="w-full"
        desktopSidePanel
        snapPoints={[0.9]}
      >
        <div className="flex h-full flex-col overflow-hidden" style={{ fontFamily: HP_FONT }}>
          {/* Buscador — solo si hay catálogo real que buscar; con 1-4 filas es
              ruido antes que ayuda (título lo aporta la cabecera de ResponsiveModal) */}
          {drawerBaseCategoryCount > 4 && (
            <div className="flex-shrink-0 px-4 pb-3 pt-4 md:px-5">
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink-soft"
                  strokeWidth={2.2}
                />
                <input
                  type="text"
                  placeholder="Buscar categoría…"
                  value={categorySearchQuery}
                  onChange={(e) => setCategorySearchQuery(e.target.value)}
                  className="h-12 w-full rounded-full bg-surface-tinted pl-12 pr-5 text-lead text-ink-strong transition-colors placeholder:text-ink-muted focus:bg-line-soft focus:outline-none"
                  style={{ fontFamily: HP_FONT }}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  aria-label="Buscar categorías"
                />
              </div>
            </div>
          )}

          {/* Lista de categorías — mismas filas que el picker móvil (CategoryPickerRow),
              para que precio/jerarquía/estados de foco no diverjan entre escritorio y móvil */}
          <div
            className="flex-1 overflow-y-auto px-4 pb-5 pt-4 md:px-5"
            style={{
              minHeight: 0,
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain',
            }}
          >
            {categoriesLoading ? (
              <div role="status" aria-busy="true" className="flex flex-col gap-2.5 py-2">
                <span className="sr-only">Cargando categorías…</span>
                {[...Array(4)].map((_, index) => (
                  <SileoSkeleton key={index} className="h-[100px] w-full rounded-[14px]" />
                ))}
              </div>
            ) : (
              (() => {
                const query = categorySearchQuery.trim().toLowerCase();
                const matchesQuery = (name: string) => !query || name.toLowerCase().includes(query);
                const list = (drawerIntent === 'map' ? parentCategories : categoriesForDrawerModal).filter(
                  (cat) => matchesQuery(cat.name),
                );
                const filteredComingSoon = comingSoonPickerCategories.filter((cat) => matchesQuery(cat.name));

                if (list.length === 0 && filteredComingSoon.length === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-tinted">
                        <Search className="h-5 w-5 text-ink-soft" strokeWidth={2} />
                      </div>
                      <p className="text-body font-semibold text-ink-strong">
                        {categorySearchQuery.trim()
                          ? `Sin resultados para “${categorySearchQuery.trim()}”`
                          : 'No hay categorías disponibles'}
                      </p>
                      <p className="max-w-[16rem] text-caption leading-snug text-ink-muted">
                        Prueba con otra palabra o revisa más tarde: el catálogo crece cada semana.
                      </p>
                    </div>
                  );
                }

                return (
                  <>
                    {list.length > 0 && (
                      <p className="px-1 pb-1.5 pt-1 text-kicker font-medium uppercase tracking-[0.1em] text-ink-soft">
                        {list.length} {list.length === 1 ? 'categoría' : 'categorías'}
                      </p>
                    )}
                    <div className="flex flex-col">
                      {list.map((category, index) => (
                        <CategoryPickerRow
                          key={category.id}
                          index={index}
                          name={category.name}
                          image={getCategoryImage(category.name)}
                          fallbackIcon={getCategoryLucideIcon(category.name)}
                          meta={getCategoryMeta(category.id)}
                          selected={categoryId === category.id}
                          onClick={() =>
                            drawerIntent === 'map'
                              ? goToCategoryMap(category.id)
                              : handleDrawerCategoryClick(category.id, category.name)
                          }
                        />
                      ))}
                      {filteredComingSoon.map((category) => {
                        const Icon = getCategoryLucideIcon(category.name);
                        return (
                          <div
                            key={category.id}
                            aria-label={`${category.name}, próximamente disponible`}
                            className="flex w-full cursor-default items-center gap-4 border-b border-line px-4 py-3 text-left last:border-b-0 opacity-60"
                          >
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-surface-tinted">
                              <Icon className="h-6 w-6 text-ink-soft" strokeWidth={1.75} aria-hidden />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="line-clamp-1 text-subtitle font-semibold leading-tight tracking-[-0.01em] text-ink-muted">
                                {category.name}
                              </h3>
                              <p className="mt-0.5 text-caption leading-snug text-ink-soft">Próximamente</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                );
              })()
            )}
          </div>
        </div>
      </ResponsiveModal>

      <Suspense fallback={null}>
        <LoginModalLazy
          open={isLoginModalOpen}
          onOpenChange={setIsLoginModalOpen}
          initialTab="login"
          onSuccess={() => setIsLoginModalOpen(false)}
        />
      </Suspense>
    </>
  );
}, (prevProps, nextProps) =>
  prevProps.onSearch === nextProps.onSearch &&
  prevProps.countryCode === nextProps.countryCode);
