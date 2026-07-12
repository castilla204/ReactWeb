import React, { useState, useRef, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { useIsMobile } from '../hooks/useIsMobile';
import { createPortal } from 'react-dom';
import {
  Search,
  ChevronDown,
  ChevronRight,
  FolderTree,
  Map,
  ChevronUp,
  Heart,
  User,
  Car,
  Bike,
  Home,
  Camera,
  Wrench,
  Check,
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
import { getCategoryMeta, type CategoryOfficeMeta } from '../data/categoryMeta';

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
  HP_COLOR,
  hpType,
  hpCardText,
  hpTitleUnderlineBarStyle,
  hpIconButtonClass,
} from '../constants/homepageTypography';

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

interface CategoryPickerRowProps {
  name: string;
  isSelected: boolean;
  onClick: () => void;
  /** 'list' = sidebar desktop. 'tile' = legacy grid (mantenido por compat con
   *  callsites desktop). 'office-row' = NUEVO mobile picker con foto real del
   *  oficio + ficha técnica (precio, expertos, descripción). */
  variant?: 'list' | 'tile' | 'office-row';
  /** Marca la categoría como "próximamente": render disabled, badge "Pronto",
   *  sin onClick. Para anunciar verticales que aún no están en el backend. */
  comingSoon?: boolean;
  /** Metadata del oficio. Solo usada por variant='office-row'. */
  meta?: CategoryOfficeMeta | null;
}

const CategoryPickerRow: React.FC<CategoryPickerRowProps> = ({
  name,
  isSelected,
  onClick,
  variant = 'list',
  comingSoon = false,
  meta = null,
}) => {
  const Icon = getCategoryLucideIcon(name);
  const imgSrc = getCategoryImage(name);

  // VARIANT OFFICE-ROW · lista vertical con foto real + ficha técnica del oficio.
  // Mismo lenguaje "carpeta del despacho" que SearchInspectionListItem en
  // /busquedas. Altura uniforme garantizada por thumb 80px fijo + line-clamp-1
  // en todos los textos.
  if (variant === 'office-row') {
    const photo = getCategoryPhoto(name);
    const thumbSrc = photo || imgSrc;
    const isPhotoReal = Boolean(photo);
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={isSelected}
        aria-label={
          `${name}${meta ? `: ${meta.delivery}, desde ${meta.priceFromEur} euros, ${meta.expertCount} expertos disponibles, informe en ${meta.reportHours} horas` : ''}${isSelected ? ' (seleccionado)' : ''}`
        }
        className={[
          'group relative flex w-full items-stretch gap-3 overflow-hidden rounded-[14px] border bg-white p-2.5 text-left',
          'transition-[border-color,background-color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]',
          'active:scale-[0.995]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
          isSelected
            ? 'border-brand bg-brand/[0.04] shadow-[0_4px_18px_hsl(var(--brand)/0.14),0_2px_8px_rgba(0,0,0,0.06)]'
            : 'border-line hover:border-line hover:shadow-[0_4px_14px_-6px_rgba(15,23,42,0.10)]',
        ].join(' ')}
        style={{ fontFamily: HP_FONT }}
      >
        {/* THUMB del oficio · foto real si existe, ilustración si no. */}
        <div className="relative h-[80px] w-[80px] shrink-0 overflow-hidden rounded-[10px] bg-surface-tinted">
          {thumbSrc ? (
            <img
              src={thumbSrc}
              alt=""
              loading="lazy"
              decoding="async"
              draggable={false}
              className={`h-full w-full select-none ${isPhotoReal ? 'object-cover' : 'object-contain p-2'}`}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-ink-muted">
              <Icon className="h-7 w-7" strokeWidth={1.75} />
            </div>
          )}
        </div>

        {/* FICHA: nombre + entrega + meta-line (precio · expertos) */}
        <div className="flex min-w-0 flex-1 flex-col justify-center py-1">
          <h3 className="line-clamp-1 text-lead font-semibold leading-tight tracking-[-0.01em] text-ink-strong">
            {name}
          </h3>
          {meta ? (
            <>
              <p className="mt-0.5 line-clamp-1 text-caption leading-snug text-ink-muted">
                {meta.delivery}
              </p>
              <div className="mt-1.5 flex items-center gap-1.5 text-caption leading-none">
                <span className="font-semibold text-ink-strong">
                  desde {meta.priceFromEur}€
                </span>
                <span className="text-line" aria-hidden>·</span>
                <span className="text-ink-muted">
                  {meta.expertCount} expertos
                </span>
              </div>
            </>
          ) : (
            <p className="mt-0.5 line-clamp-1 text-caption leading-snug text-ink-muted">
              Toca para empezar
            </p>
          )}
        </div>

        {/* Indicador a la derecha · chevron sutil (sin tick en la activa). */}
        <div className="flex shrink-0 items-center pr-0.5">
          <ChevronRight
            className={`h-4 w-4 transition-colors ${isSelected ? 'text-brand' : 'text-line group-hover:text-brand'}`}
            strokeWidth={2}
            aria-hidden
          />
        </div>
      </button>
    );
  }

  if (variant === 'tile') {
    // Versión "próximamente": disabled, badge "Pronto", sin hover ni click.
    if (comingSoon) {
      return (
        <div
          role="button"
          aria-disabled
          aria-label={`${name} (próximamente)`}
          tabIndex={-1}
          className="relative flex aspect-square cursor-not-allowed flex-col items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed border-line bg-surface-tinted p-3 text-center"
        >
          <div className="flex h-[64px] w-[64px] items-center justify-center opacity-55">
            {imgSrc ? (
              <img
                src={imgSrc}
                alt=""
                loading="lazy"
                decoding="async"
                draggable={false}
                className="h-full w-full select-none object-contain grayscale"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-line-soft text-ink-soft">
                <Icon className="h-6 w-6" strokeWidth={2} />
              </div>
            )}
          </div>
          {/* min-h reserva el alto de 2 líneas en TODAS las cards para que la
              grid no se descuadre cuando algún label parta. line-clamp-2 corta
              con "..." en el (improbable) caso de un nombre aún más largo. */}
          <span className="line-clamp-2 min-h-[2.2em] text-meta font-semibold leading-tight tracking-[-0.01em] text-ink-muted">
            {name}
          </span>
          <span
            aria-hidden
            className="absolute right-2 top-2 inline-flex h-[18px] items-center rounded-full bg-ink-strong px-1.5 text-[9px] font-bold uppercase leading-none tracking-[0.06em] text-white"
          >
            Pronto
          </span>
        </div>
      );
    }

    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={isSelected}
        aria-label={`${name}${isSelected ? ' (seleccionado)' : ''}`}
        className={[
          'group relative flex aspect-square flex-col items-center justify-center gap-2.5 rounded-2xl border-2 bg-white p-3 text-center',
          'transition-[border-color,background-color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]',
          'active:scale-[0.97]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
          isSelected
            ? 'border-brand bg-brand/[0.04] shadow-[0_6px_20px_-6px_hsl(var(--brand)/0.28)]'
            : 'border-line hover:border-ink-soft hover:shadow-[0_4px_14px_-6px_rgba(15,23,42,0.10)]',
        ].join(' ')}
      >
        {/* PNG real de la app si existe; icon lucide solo como fallback */}
        <div
          className={[
            'flex h-[64px] w-[64px] items-center justify-center transition-transform duration-200',
            isSelected ? 'scale-105' : 'group-hover:scale-105 motion-reduce:group-hover:scale-100',
          ].join(' ')}
        >
          {imgSrc ? (
            <img
              src={imgSrc}
              alt=""
              loading="lazy"
              decoding="async"
              draggable={false}
              className="h-full w-full select-none object-contain"
            />
          ) : (
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-full ${
                isSelected ? 'bg-brand text-white' : 'bg-surface-tinted text-ink-muted'
              }`}
            >
              <Icon className="h-6 w-6" strokeWidth={2} />
            </div>
          )}
        </div>

        {/* min-h reserva el alto de 2 líneas en TODAS las cards para que la
            grid no se descuadre cuando algún label del backend parta. */}
        <span className="line-clamp-2 min-h-[2.2em] text-body font-semibold leading-tight tracking-[-0.01em] text-ink-strong">
          {name}
        </span>

        {/* Check indicator estilo Airbnb en esquina superior derecha */}
        {isSelected && (
          <span
            aria-hidden
            className="absolute right-2.5 top-2.5 flex h-[22px] w-[22px] items-center justify-center rounded-full bg-brand shadow-[0_2px_6px_hsl(var(--brand)/0.45)]"
          >
            <Check className="h-3 w-3 text-white" strokeWidth={3.5} />
          </span>
        )}
      </button>
    );
  }

  // variant === 'list' — versión para sidebar/desktop con PNG también si lo hay
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isSelected}
      className={`flex w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-colors ${
        isSelected
          ? 'border-brand/30 bg-brand/[0.06]'
          : 'border-transparent hover:bg-line-soft/80 active:bg-line-soft'
      }`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl overflow-hidden ${
          imgSrc ? 'bg-white' : isSelected ? 'bg-brand/10' : 'bg-line-soft'
        }`}
      >
        {imgSrc ? (
          <img
            src={imgSrc}
            alt=""
            loading="lazy"
            decoding="async"
            draggable={false}
            className="h-9 w-9 select-none object-contain"
          />
        ) : (
          <Icon
            className={`h-[18px] w-[18px] ${isSelected ? 'text-brand' : 'text-ink-muted'}`}
            strokeWidth={2}
          />
        )}
      </div>
      <span className="min-w-0 flex-1 truncate text-lead font-medium leading-tight text-ink-strong">
        {name}
      </span>
    </button>
  );
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

  const mobilePillMeta = useMemo(() => {
    const categoryByTab: Record<'coches' | 'motos' | 'inmobiliaria', string> = {
      coches: 'Coches',
      motos: 'Motos',
      inmobiliaria: 'Inmobiliaria',
    };
    const categoryLabel =
      (activeTab && activeTab !== 'drawer' ? categoryByTab[activeTab] : undefined) ||
      selectedCategory?.name ||
      'Todas las categorías';
    const locationLabel = adUrl.trim() ? adUrl.trim() : 'Cualquier zona';
    return { categoryLabel, locationLabel };
  }, [activeTab, selectedCategory?.name, adUrl]);

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

  // En modo mapa: al elegir categoría navegamos al mapa de esa categoría.
  // serviceTypeId || 2 iguala el comportamiento del antiguo goToMap (fijaba 2).
  const goToCategoryMap = (mapCategoryId: number) => {
    const stId = serviceTypeId || 2;
    setIsDrawerOpen(false);
    // Reset explícito por si onOpenChange no se dispara al navegar/desmontar.
    setDrawerIntent('filter');
    setCategorySearchQuery('');
    navigate(`/hire?categoryId=${mapCategoryId}&serviceTypeId=${stId}&step=map`);
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
              className="hidden md:block h-[400px] lg:h-[500px] xl:h-[520px] bg-surface-tinted animate-pulse"
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
        className={`sticky top-0 z-50 md:hidden border-b border-line bg-white/95 backdrop-blur-sm supports-[backdrop-filter]:bg-white/90 transition-shadow duration-200 ${
          mobileHeaderScrolled ? 'shadow-[0_1px_0_rgba(0,0,0,0.04),0_4px_16px_rgba(15,23,42,0.08)]' : ''
        }`}
        style={{ top: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="px-4 pt-3.5 pb-1">
          <div className="relative">
            {/* Halo/sombra con degradado azul→ámbar de marca, rodeando todo el botón */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-r from-brand to-amber-500 opacity-50 blur-[12px]"
              style={{ transform: 'translateY(2px)' }}
            />
          <div
            onClick={openMobileSearch}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openMobileSearch();
              }
            }}
            aria-label={`Buscar revisión de ${mobilePillMeta.categoryLabel.toLowerCase()} en ${mobilePillMeta.locationLabel}`}
            className="relative w-full bg-white border border-line rounded-full transition-all grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 cursor-pointer"
            style={{
              height: '56px',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.06)',
            }}
          >
            {/* Espaciador izquierdo — equilibra el botón mapa para centrar el texto */}
            <div aria-hidden className="h-11 w-11 shrink-0" />

            {/* Texto centrado ópticamente en la pill */}
            <div className="flex min-w-0 flex-col items-center justify-center text-center">
              <span
                className="mb-0.5 max-w-[13.5rem] truncate min-[390px]:max-w-[15rem]"
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
                className="flex max-w-[13.5rem] min-[390px]:max-w-[15rem] items-center justify-center gap-1"
                style={{
                  fontSize: '12px',
                  lineHeight: '16px',
                  fontWeight: 400,
                  fontFamily: HP_FONT,
                  color: HP_COLOR.muted,
                }}
              >
                <span className="truncate">{mobilePillMeta.categoryLabel}</span>
                <span aria-hidden="true" className="shrink-0">·</span>
                <span className="truncate">{mobilePillMeta.locationLabel}</span>
              </div>
            </div>

            {/* Botón circular con ícono de mapa */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openMobileSearch();
                }}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand transition-colors hover:bg-brand-hover cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                aria-label="Abrir búsqueda en mapa"
              >
                <Map className="h-5 w-5 text-white" strokeWidth={2.1} aria-hidden />
              </button>
            </div>
          </div>
          </div>
        </div>

        {/* Tabs Mobile — fila compacta centrada (estilo Airbnb) */}
        <div className="w-full" role="tablist" aria-label="Categorías principales">
          <div className="flex justify-center gap-4 min-[390px]:gap-5 px-2 pt-0 pb-0.5">
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
                  className={`flex w-[4.75rem] min-[390px]:w-[5.25rem] shrink-0 flex-col items-center border-b-2 bg-transparent py-0 cursor-pointer transition-[border-color,color,transform] active:scale-95 ${
                    isActive ? 'border-brand' : 'border-transparent'
                  }`}
                >
                  <img
                    src={getImageWithCache(tab.image, imageCacheKey)}
                    alt={tab.alt}
                    className="mb-0 h-12 w-12 min-[390px]:h-14 min-[390px]:w-14 object-contain"
                    width={48}
                    height={48}
                  />
                  <span
                    className="-mt-0.5 max-w-full truncate text-center text-caption min-[390px]:text-meta leading-tight"
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
              background: 'hsl(var(--surface))',
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
                  height: (expandedAccordion === 'where' || isMobile) ? '100dvh' : 'auto',
                  minHeight: (expandedAccordion === 'where' || isMobile) ? '100dvh' : '280px',
                  maxHeight: (expandedAccordion === 'where' || isMobile) ? '100dvh' : '320px',
                  transition: isMobile ? 'none' : 'box-shadow 150ms cubic-bezier(0.4, 0, 0.2, 1)',
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
                      className={`px-5 ${isMobile ? 'pb-4 pt-[calc(max(1rem,env(safe-area-inset-top,0px))+3.25rem)]' : 'border-b border-line pb-4 pt-6'}`}
                    >
                      <div className={`flex items-start justify-between gap-3 ${isMobile ? '' : 'mb-4'}`}>
                        <div className="min-w-0 flex-1">
                          <h2
                            tabIndex={-1}
                            className={
                              isMobile
                                ? 'm-0 text-xl font-semibold leading-tight tracking-[-0.02em] text-ink-strong'
                                : 'hp-section-title m-0'
                            }
                            style={isMobile ? { fontFamily: HP_FONT } : undefined}
                          >
                            ¿Qué revisamos?
                          </h2>
                          {isMobile && (
                            <p
                              className="mt-1 text-meta leading-snug text-ink-muted"
                              style={{ fontFamily: HP_FONT }}
                            >
                              Elige qué bien quieres que revise el experto.
                            </p>
                          )}
                        </div>
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
                              placeholder="Buscar categorías"
                              value={categorySearchQuery}
                              onChange={(e) => setCategorySearchQuery(e.target.value)}
                              className="flex-1 border-0 text-sm outline-none bg-transparent text-ink-strong placeholder:text-ink-muted"
                              style={{
                                fontSize: '14px',
                                lineHeight: '18px',
                                fontWeight: 400,
                                fontFamily: HP_FONT,
                              }}
                              autoComplete="off"
                              autoCorrect="off"
                              spellCheck="false"
                              aria-label="Buscar categorías"
                            />
                          </label>
                        </form>
                      )}
                    </div>

                    {/* Contenido expandido al 100% */}
                    <div
                      className={`flex-1 overflow-y-auto ${isMobile ? 'px-5 pt-2 pb-6' : 'px-4 py-6'}`}
                      style={{
                        paddingBottom: isMobile
                          ? 'max(1.5rem, env(safe-area-inset-bottom, 0px))'
                          : undefined,
                      }}
                    >
                      <div className={isMobile ? 'mx-auto max-w-md' : undefined}>
                        {categoriesLoading ? (
                          <div className={isMobile ? 'grid grid-cols-3 gap-2.5' : 'flex flex-col gap-3'}>
                            {[...Array(isMobile ? 6 : 4)].map((_, index) => (
                              <SileoSkeleton
                                key={index}
                                className={isMobile ? 'h-[120px] w-full rounded-2xl' : 'h-[72px] w-full rounded-2xl'}
                              />
                            ))}
                          </div>
                        ) : isMobile ? (
                          // LISTA VERTICAL minimalista (igual que el drawer desktop):
                          // ilustración + nombre + entrega + "desde X€ · N expertos",
                          // sin contornos.
                          (
                              <div className="flex flex-col">
                                {mobilePickerCategories.map((category) => {
                                  const meta = getCategoryMeta(category.id);
                                  const img = getCategoryImage(category.name);
                                  const selected = categoryId === category.id;
                                  return (
                                    <button
                                      key={category.id}
                                      type="button"
                                      aria-pressed={selected}
                                      onClick={() => {
                                        setCategoryId(category.id);
                                        setCategorySearchQuery('');

                                        const defaultServiceTypeId = serviceTypeId || 2;
                                        const params = new URLSearchParams();
                                        params.append('categoryId', category.id.toString());
                                        params.append('serviceTypeId', defaultServiceTypeId.toString());
                                        if (adUrl) {
                                          params.append('adUrl', adUrl);
                                        }

                                        window.location.href = `/hire?${params.toString()}`;

                                        if (onSearch) {
                                          onSearch({
                                            serviceTypeId: defaultServiceTypeId,
                                            categoryId: category.id,
                                            adUrl,
                                          });
                                        }
                                      }}
                                      className={`group flex w-full items-center gap-4 rounded-2xl px-2.5 py-3 text-left transition-colors ${
                                        selected ? 'bg-brand/[0.06]' : 'active:bg-surface-tinted'
                                      }`}
                                    >
                                      <div className="flex h-14 w-14 shrink-0 items-center justify-center">
                                        {img ? (
                                          <img
                                            src={img}
                                            alt=""
                                            loading="lazy"
                                            decoding="async"
                                            draggable={false}
                                            className="h-full w-full select-none object-contain"
                                          />
                                        ) : (
                                          <FolderTree className="h-6 w-6 text-line" strokeWidth={1.75} />
                                        )}
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <h3 className="text-lead font-semibold leading-tight tracking-[-0.01em] text-ink-strong">
                                          {category.name}
                                        </h3>
                                        {meta ? (
                                          <>
                                            <p className="mt-0.5 truncate text-caption leading-snug text-ink-muted">
                                              {meta.delivery}
                                            </p>
                                            <p className="mt-1 text-caption leading-none text-ink-muted">
                                              <span className="font-semibold text-ink-strong">desde {meta.priceFromEur}€</span>
                                              {' · '}
                                              {meta.expertCount} expertos
                                            </p>
                                          </>
                                        ) : (
                                          <p className="mt-0.5 text-caption leading-snug text-ink-muted">
                                            Toca para ver expertos
                                          </p>
                                        )}
                                      </div>
                                      <ChevronRight
                                        className={`h-4 w-4 shrink-0 ${selected ? 'text-brand' : 'text-line'}`}
                                        strokeWidth={2}
                                        aria-hidden
                                      />
                                    </button>
                                  );
                                })}
                              </div>
                            )
                        ) : (
                    <div className="flex flex-col gap-1">
                              {normalizedCategories
                                .filter((cat) => cat.isActive && !isVehiculosParentCategory(cat))
                                .filter((cat) => {
                                  if (categorySearchQuery.trim()) {
                                    return cat.name.toLowerCase().includes(categorySearchQuery.toLowerCase());
                                  }
                                  return true;
                                })
                        .map((category) => (
                                    <CategoryPickerRow
                                      key={category.id}
                                      name={category.name}
                                      isSelected={categoryId === category.id}
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
                                    />
                                  ))}
                      {normalizedCategories
                        .filter((cat) => cat.isActive && !isVehiculosParentCategory(cat))
                              .filter((cat) => {
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
                        <div className="px-4 pt-6 pb-4 border-b border-line">
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
                                placeholder="Buscar categorías"
                                value={categorySearchQuery}
                                onChange={(e) => setCategorySearchQuery(e.target.value)}
                                className="flex-1 border-0 text-sm outline-none bg-transparent text-ink-strong placeholder:text-ink-muted"
                                style={{ 
                                  fontSize: '14px',
                                  lineHeight: '18px',
                                  fontWeight: 400,
                                  fontFamily: HP_FONT 
                                }}
                                autoComplete="off"
                                autoCorrect="off"
                                spellCheck="false"
                                aria-label="Buscar categorías"
                              />
                            </label>
                          </form>
                        </div>

                        {/* Lista de categorías con scroll */}
                        <div className="flex-1 overflow-y-auto px-4 py-4">
                          <div>
                            {categoriesLoading ? (
                              <div className="space-y-2">
                                {[...Array(4)].map((_, index) => (
                                  <SileoSkeleton key={index} className="h-20 w-20 rounded-xl" />
                                ))}
                              </div>
                            ) : (
                              <div className="flex flex-col gap-2.5">
                                {normalizedCategories
                                  .filter(cat => cat.isActive && !isVehiculosParentCategory(cat))
                                  .filter(cat => {
                                    if (categorySearchQuery.trim()) {
                                      return cat.name.toLowerCase().includes(categorySearchQuery.toLowerCase());
                                    }
                                    return true;
                                  })
                                  .map((category) => (
                                    <CategoryPickerRow
                                      key={category.id}
                                      name={category.name}
                                      isSelected={categoryId === category.id}
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
                                    />
                                  ))}
                                {normalizedCategories
                                  .filter(cat => cat.isActive && !isVehiculosParentCategory(cat))
                                  .filter(cat => {
                                    if (categorySearchQuery.trim()) {
                                      return cat.name.toLowerCase().includes(categorySearchQuery.toLowerCase());
                                    }
                                    return true;
                                  }).length === 0 && (
                                  <div 
                                    className="text-center py-4 text-ink-muted"
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
                  <div className="border-t border-line mt-auto">
                    <button
                      type="button"
                      onClick={() => setExpandedAccordion('where')}
                      className="w-full flex items-center justify-center py-3 bg-transparent border-none cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <ChevronDown className="w-4 h-4 text-ink-muted" style={{ strokeWidth: 2.5 }} />
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
                      className="font-semibold text-ink-strong mb-1"
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
                      className="text-ink-muted"
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
                  <ChevronDown className={`w-3 h-3 text-ink-soft transition-transform ${expandedAccordion === 'type' ? 'rotate-180' : ''}`} style={{ strokeWidth: 4 }} />
                </button>
                
                {expandedAccordion === 'type' && (
                  <div className="px-4 pb-6">
                      {serviceTypesLoading ? (
                      <div className="space-y-2">
                        {[...Array(4)].map((_, index) => (
                          <SileoSkeleton key={index} className="h-12 w-full rounded-lg" />
                        ))}
                      </div>
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
                                ? 'bg-brand text-white shadow-[0_2px_8px_hsl(var(--brand)/0.2)]'
                                : 'bg-surface-tinted text-ink-strong hover:bg-surface-tinted'
                            }`}
                          >
                            <span className="text-sm font-semibold">{st.name}</span>
                            {st.description && (
                              <span className={`text-xs ${
                                serviceTypeId === st.id 
                                  ? 'text-line' 
                                  : 'text-ink-muted'
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
                  <label className="text-xs font-semibold text-ink-strong flex items-center gap-1" style={{ fontFamily: HP_FONT }}>
                      URL del anuncio
                    <span className="text-ink-soft font-normal">(opcional)</span>
                  </label>
                  <ChevronDown className={`w-3 h-3 text-ink-soft transition-transform ${expandedAccordion === 'url' ? 'rotate-180' : ''}`} style={{ strokeWidth: 4 }} />
                </button>
                
                {expandedAccordion === 'url' && (
                  <div className="px-4 pb-6">
                      <input
                        type="text"
                      placeholder="Pega la URL aquí..."
                        value={adUrl}
                        onChange={(e) => setAdUrl(e.target.value)}
                      className="w-full px-4 py-4 border border-line rounded-lg text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 transition-colors"
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
          <div className="px-4 py-5 border-t border-line bg-white flex justify-between gap-4">
            <button
              type="button"
              onClick={() => {
                setServiceTypeId(null);
                setCategoryId(null);
                setAdUrl('');
                setCategorySearchQuery('');
                setExpandedAccordion(null);
              }}
              className="px-4 py-2 text-sm font-semibold text-ink-strong underline bg-transparent border-none cursor-pointer"
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
              className="px-6 py-3.5 bg-brand hover:bg-brand-hover text-white rounded-lg text-sm font-semibold border-none cursor-pointer flex items-center gap-2 transition-colors active:scale-95 shadow-[0_4px_16px_hsl(var(--brand)/0.2)]"
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
          {/* Buscador — el título lo aporta la cabecera de ResponsiveModal */}
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

          {/* Lista de categorías — cards ricas con foto del oficio, precio y expertos */}
          <div
            className="flex-1 overflow-y-auto px-4 pb-5 md:px-5"
            style={{
              minHeight: 0,
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain',
            }}
          >
            {categoriesLoading ? (
              <div className="flex flex-col gap-2.5 py-2">
                {[...Array(4)].map((_, index) => (
                  <SileoSkeleton key={index} className="h-[100px] w-full rounded-[14px]" />
                ))}
              </div>
            ) : (
              (() => {
                const list = (drawerIntent === 'map' ? parentCategories : categoriesForDrawerModal).filter(
                  (cat) =>
                    !categorySearchQuery.trim() ||
                    cat.name.toLowerCase().includes(categorySearchQuery.toLowerCase()),
                );

                if (list.length === 0) {
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
                    <p className="px-1 pb-1.5 pt-1 text-kicker font-medium uppercase tracking-[0.1em] text-ink-soft">
                      {list.length} {list.length === 1 ? 'categoría' : 'categorías'}
                    </p>
                    <div className="flex flex-col">
                      {list.map((category) => {
                        const meta = getCategoryMeta(category.id);
                        const img = getCategoryImage(category.name);
                        const selected = categoryId === category.id;
                        return (
                          <button
                            key={category.id}
                            type="button"
                            aria-pressed={selected}
                            onClick={() =>
                              drawerIntent === 'map'
                                ? goToCategoryMap(category.id)
                                : handleDrawerCategoryClick(category.id, category.name)
                            }
                            className={`group flex w-full items-center gap-4 rounded-2xl px-2.5 py-3 text-left transition-colors ${
                              selected ? 'bg-brand/[0.06]' : 'hover:bg-surface-tinted'
                            }`}
                          >
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center">
                              {img ? (
                                <img
                                  src={img}
                                  alt=""
                                  loading="lazy"
                                  decoding="async"
                                  draggable={false}
                                  className="h-full w-full select-none object-contain"
                                />
                              ) : (
                                <FolderTree className="h-6 w-6 text-line" strokeWidth={1.75} />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="text-lead font-semibold leading-tight tracking-[-0.01em] text-ink-strong">
                                {category.name}
                              </h3>
                              {meta ? (
                                <>
                                  <p className="mt-0.5 truncate text-caption leading-snug text-ink-muted">
                                    {meta.delivery}
                                  </p>
                                  <p className="mt-1 text-caption leading-none text-ink-muted">
                                    <span className="font-semibold text-ink-strong">desde {meta.priceFromEur}€</span>
                                    {' · '}
                                    {meta.expertCount} expertos
                                  </p>
                                </>
                              ) : (
                                <p className="mt-0.5 text-caption leading-snug text-ink-muted">
                                  Toca para ver expertos
                                </p>
                              )}
                            </div>
                            {selected ? (
                              <span
                                aria-hidden
                                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand"
                              >
                                <Check className="h-3 w-3 text-white" strokeWidth={3.5} />
                              </span>
                            ) : (
                              <ChevronRight
                                className="h-4 w-4 shrink-0 text-line transition-colors group-hover:text-ink-soft"
                                strokeWidth={2}
                                aria-hidden
                              />
                            )}
                          </button>
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
