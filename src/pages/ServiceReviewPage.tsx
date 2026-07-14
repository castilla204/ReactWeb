import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { SileoPageLoader } from '../components/ui/sileo-loader';
import {
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    X,
    Image,
} from 'lucide-react';
import { EnhancedReviewsList } from '../components/EnhancedReviewCard';
import { ServiceDetailDesktopHostPanel } from '../components/serviceDetail/ServiceDetailDesktopHostPanel';
import { ServiceDetailExpertFormacionSheet } from '../components/serviceDetail/ServiceDetailExpertFormacionSheet';
import { ServiceDetailExpertFormacionDialog } from '../components/serviceDetail/ServiceDetailExpertFormacionDialog';
import { useServices, Service } from '../hooks/useServices';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { useAuth } from '../contexts/AuthContext';
import { persistServiceReturnPath, resolveServiceReturnPath } from '../utils/servicePageNavigation';
import { readHireSearchLocation, persistHireSearchLocation, parseHireSearchLocationFromRouteState } from '../utils/hireSearchContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { showToast, toast } from '../lib/toast';
import { useServiceFavorites } from '../hooks/useServiceFavorites';
import { authService } from '../services/authService';
import { formatPriceNumber } from '../utils/priceUtils';
import { formatTimezoneFriendly } from '../utils/timezoneFormat';
import { ServiceDetailDesktopBookingAside } from '../components/serviceDetail/ServiceDetailDesktopBookingAside';
import { MobileReserveFooter } from '../components/serviceDetail/MobileReserveFooter';
import { useCurrency } from '../contexts/CurrencyContext';
import { PreHireChat } from '../components/PreHireChat';
import {
  SD_MOBILE_FOOTER_CTA_CLASS,
  SD_MOBILE_GUTTER_CLASS,
  SD_MOBILE_IDENTITY_GUTTER_CLASS,
  SD_MOBILE_IDENTITY_STACK_CLASS,
  SD_MOBILE_INSET_STACK_CLASS,
  SD_MOBILE_SCROLL_PAD_TRUST_CLASS,
  SD_MOBILE_SHEET_OVERLAP_CLASS,
  SD_MOBILE_SHEET_TOP_CLASS,
  SD_MOBILE_TAB_REGION_CLASS,
  SD_MOBILE_TABLIST_CLASS,
  SD_MOBILE_TABLIST_SHELL_CLASS,
  SD_MOBILE_TAB_PANEL_PT_CLASS,
  SD_MOBILE_TAB_PANEL_REVIEWS_CLASS,
  SD_PAGE_GRID_CLASS,
  SD_DESKTOP_PANEL_CLASS,
  SD_DESKTOP_STICKY_TOP_CLASS,
  SD_PAGE_INNER_MAX_CLASS,
  HP_FONT,
} from '../constants/homepageTypography';
import { MAP_LITERAL } from '../constants/designTokens';
import { ServiceDetailDesktopPhotoMapHero } from '../components/serviceDetail/ServiceDetailDesktopPhotoMapHero';
import {
    ServiceDetailDeliverablesGuide,
    normalizeDeliverableTypes,
    type ServiceDeliverableType,
} from '../components/serviceDetail/ServiceDetailDeliverablesGuide';
import { useDeliverableTypes } from '../hooks/useDeliverableTypes';
import { getDeliverableKind } from '../utils/deliverableIcons';
import { normalizeDeliverableLabels } from '../utils/deliverableLabels';
import { ServiceDetailReviewsModal } from '../components/serviceDetail/ServiceDetailReviewsModal';
import { ServiceDetailReviewsPreview } from '../components/serviceDetail/ServiceDetailReviewsPreview';
import { getCountryName } from '../utils/countries';
import { readWorkRadiusKm } from '../utils/workRadius';
import { stripServiceDescriptionLocationSuffix } from '../utils/stripServiceDescriptionLocationSuffix';
import { HomepageDesktopTopBar } from '../components/HomepageDesktopTopBar';
import { ServiceDetailPageHeadline } from '../components/serviceDetail/ServiceDetailPageHeadline';
import { ServiceDetailExpertHostRow } from '../components/serviceDetail/ServiceDetailExpertHostRow';
import InspectionReportPreview from '../components/serviceDetail/InspectionReportPreview';
import { type InspectionConfig } from '../lib/inspectionTemplateConfig';
import { getInspectionCatalog } from '../lib/inspectionCatalog';
import ServiceDetailAvailabilityCalendar from '../components/serviceDetail/ServiceDetailAvailabilityCalendar';
import { ServiceDetailMobilePhotoMapHero } from '../components/serviceDetail/ServiceDetailMobilePhotoMapHero';
import { ServiceDetailMobileTopBar } from '../components/serviceDetail/ServiceDetailMobileTopBar';
import { ServiceDetailPhotoLightbox } from '../components/serviceDetail/ServiceDetailPhotoLightbox';
import { FavoriteHeart } from '../components/FavoriteHeart';
import { LoginModal } from '../components/LoginModal';
import { useIsMobile } from '../hooks/useIsMobile';
import { buildClientPreHireChatPath } from '../utils/preHireChatNavigation';
import { parseFormacion } from '../components/expertPanel/formacion';
// La elección "¿Cómo se fija la cita?" ya no se decide aquí (ni en popup): se resuelve
// como primer paso dedicado dentro del checkout. Aquí solo navegamos al checkout.

/** Ciudad sola en móvil — el mapa del hero ya muestra la región/país. */
function compactMobileLocationLabel(label?: string | null): string | undefined {
    if (!label?.trim()) return undefined;
    const trimmed = label.trim();
    const comma = trimmed.indexOf(',');
    return comma > 0 ? trimmed.slice(0, comma).trim() : trimmed;
}

interface ServiceReviewPageProps {
    serviceId: number;
    expertProfilePicture?: string;
    expertName?: string;
    servicePrice?: number;
    serviceDescription?: string;
    serviceImageUrls?: string[];
    categoryId?: number;
    serviceTypeId?: number;
    latitude?: string;
    longitude?: string;
    locationRange?: number;
    currentStep?: number;
    totalSteps?: number;
    onBack: () => void;
    onContinue: () => void;
    // ✅ NUEVO: Permitir pasar el servicio completo directamente
    service?: Service | null;
}

export function ServiceReviewPage({
    serviceId,
    expertProfilePicture,
    expertName,
    servicePrice,
    serviceDescription,
    serviceImageUrls,
    categoryId,
    serviceTypeId,
    latitude,
    longitude,
    locationRange,
    currentStep = 2,
    totalSteps = 3,
    onBack,
    onContinue,
    service: serviceProp, // ✅ Servicio pasado como prop
}: ServiceReviewPageProps) {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const isMobile = useIsMobile();

    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [isFavorite, setIsFavorite] = useState(false);
    const [isExpertPhotoOpen, setIsExpertPhotoOpen] = useState(false);
    const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
    const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());
    const [showPreHireChat, setShowPreHireChat] = useState(false);
    const [showLoginDialog, setShowLoginDialog] = useState(false);
    const [mobileTopBarCompact, setMobileTopBarCompact] = useState(false);
    const mobileHeroRef = useRef<HTMLDivElement>(null);

    // ❤️ Favoritos: antes solo era estado LOCAL (no persistía ni avisaba). Ahora
    // usa el backend (igual que la homepage y el buscador del mapa) y muestra el
    // mismo toast AZUL de marca.
    const { toggleFavoriteAsync, checkFavorite } = useServiceFavorites();
    const favoriteQuery = checkFavorite(serviceId);
    useEffect(() => {
        // El endpoint /check devuelve casing MIXTO: el envoltorio anónimo trae
        // `data` (minúscula) pero el DTO interno serializa `IsFavorite` (PascalCase,
        // PropertyNamingPolicy=null). Hay que leer ambos niveles en cualquier casing.
        type FavInner = { isFavorite?: boolean; IsFavorite?: boolean };
        const d = favoriteQuery.data as { data?: FavInner; Data?: FavInner } | undefined;
        const inner = d?.data ?? d?.Data;
        const fav = inner?.isFavorite ?? inner?.IsFavorite;
        if (fav !== undefined) setIsFavorite(!!fav);
    }, [favoriteQuery.data]);

    const handleToggleFavorite = useCallback(async () => {
        if (!isAuthenticated) {
            toast.info('Inicia sesión para guardar favoritos', { duration: 3000 });
            return;
        }
        try {
            const result = await toggleFavoriteAsync(serviceId);
            setIsFavorite(result.isFavorite);
            if (result.isFavorite) {
                toast.info('Añadido a favoritos', {
                    description: 'Lo tienes guardado en tu lista de favoritos.',
                    action: { label: 'Ver favoritos', onClick: () => navigate('/favorites') },
                    duration: 3000,
                });
            } else {
                toast.info('Quitado de favoritos', { duration: 2500 });
            }
        } catch (error) {
            console.error('Error al actualizar favorito:', error);
            toast.error('No se pudo actualizar el favorito', { duration: 3000 });
        }
    }, [isAuthenticated, serviceId, toggleFavoriteAsync, navigate]);

    // Obtener token y userId para el chat
    const token = authService.getAccessToken() || '';
    const user = useAuth().user;
    const userId = user?.id || user?.Id || 0;
    
    // Handler para abrir chat o login
    const handleChatClick = () => {
        if (isAuthenticated && token && userId > 0) {
            navigate(buildClientPreHireChatPath(serviceId, { mobile: isMobile }));
            return;
        }
        sessionStorage.removeItem('redirectAfterLogin');
            sessionStorage.setItem('loginFromChat', 'true');
            setShowLoginDialog(true);
    };

    const getCheckoutPath = useCallback(() => {
        if (!serviceId) return null;
        const serviceIdNumber = typeof serviceId === 'number' ? serviceId : parseInt(String(serviceId), 10);
        if (isNaN(serviceIdNumber) || serviceIdNumber <= 0) return null;
        return `/checkout/${serviceIdNumber}`;
    }, [serviceId]);

    const openLoginForCheckout = useCallback(() => {
        const checkoutPath = getCheckoutPath();
        if (!checkoutPath) {
            showToast('error', 'Error: ID de servicio no válido');
            return;
        }
        sessionStorage.removeItem('loginFromChat');
        sessionStorage.setItem('redirectAfterLogin', checkoutPath);
        sessionStorage.setItem('pendingCheckoutAfterLogin', '1');
        setShowLoginDialog(true);
    }, [getCheckoutPath]);

    useEffect(() => {
        if (!isAuthenticated) return;

        if (sessionStorage.getItem('loginFromChat') === 'true') {
            sessionStorage.removeItem('loginFromChat');
            if (serviceId) {
                const t = window.setTimeout(() => {
                    navigate(buildClientPreHireChatPath(serviceId, { mobile: isMobile }), { replace: true });
                }, 100);
                return () => clearTimeout(t);
            }
            return;
        }

        if (sessionStorage.getItem('pendingCheckoutAfterLogin') !== '1') return;

        const redirectPath = sessionStorage.getItem('redirectAfterLogin');
        sessionStorage.removeItem('pendingCheckoutAfterLogin');
        sessionStorage.removeItem('redirectAfterLogin');
        if (redirectPath) {
            const t = window.setTimeout(() => {
                navigate(redirectPath, { replace: true });
            }, 100);
            return () => clearTimeout(t);
        }
    }, [isAuthenticated, navigate, serviceId, isMobile]);

    // ✅ Si el servicio viene como prop, usarlo directamente; si no, buscarlo con useServices
    const { services, isLoading } = useServices({
        categoryId,
        serviceTypeId,
        latitude,
        longitude,
        locationRange,
    });

    const service = serviceProp || services.find(s => s.id === serviceId);
    const finalService: Service | null = service || null;
    // Informe de inspección: catálogo según la categoría del servicio (coche, moto,
    // inmueble…); null = esa categoría no tiene informe. Cae a la plantilla base si
    // no hay PDF personalizado.
    const inspectionCatalog = getInspectionCatalog(
      (finalService as { categoryName?: string } | null)?.categoryName,
    );
    const showInspectionReport = inspectionCatalog != null;
    const inspectionConfig: InspectionConfig | null = (() => {
      const rawCfg = (finalService as { inspectionTemplateConfig?: string | null } | null)?.inspectionTemplateConfig;
      if (!rawCfg) return null;
      try { return JSON.parse(rawCfg) as InspectionConfig; } catch { return null; }
    })();

    // Normalizar imageUrls - puede venir de diferentes fuentes
    const normalizeImageUrls = (urls: any): string[] => {
      if (Array.isArray(urls)) return urls.filter(url => url && typeof url === 'string');
      if (typeof urls === 'string') return [urls];
      return [];
    };
    
    const finalImages = finalService?.imageUrls?.length 
      ? normalizeImageUrls(finalService.imageUrls)
      : normalizeImageUrls(serviceImageUrls || []);
    
    // Filtrar imágenes que fallaron
    const validImages = finalImages.filter(img => !failedImages.has(img));

    // Handlers para manejo de imágenes
    const handleImageError = (imgUrl: string) => {
        setFailedImages(prev => new Set([...prev, imgUrl]));
        setLoadingImages(prev => {
            const next = new Set(prev);
            next.delete(imgUrl);
            return next;
        });
    };
    
    const handleImageLoad = (imgUrl: string) => {
        setLoadingImages(prev => {
            const next = new Set(prev);
            next.delete(imgUrl);
            return next;
        });
    };
    
    const handleImageLoadStart = (imgUrl: string) => {
        setLoadingImages(prev => new Set([...prev, imgUrl]));
    };
    
    const finalExpertName = finalService?.expert?.user?.name || expertName || 'Experto';
    // ✅ CORRECTO: Usar profilePictureUrl del nivel superior del experto, NO de user (que siempre es null)
    const finalExpertPicture = finalService?.expert?.profilePictureUrl || expertProfilePicture;
    const finalExpertDescription = (finalService?.expert?.description || '').trim();
    const finalExpertFormacion =
        (finalService?.expert as { formacion?: string | null; Formacion?: string | null } | null | undefined)
            ?.formacion
        ?? (finalService?.expert as { Formacion?: string | null } | null | undefined)?.Formacion
        ?? '';
    const hasExpertFormacion = useMemo(
        () => parseFormacion(finalExpertFormacion).length > 0,
        [finalExpertFormacion],
    );
    const finalPrice = finalService?.price || servicePrice || 0;
    
    const expertCity = finalService?.expert?.city || null;

    // Solo descripción del servicio (experto), sin sufijo de ciudad al final (viene del SQL de enriquecimiento)
    const displayMainDescription = stripServiceDescriptionLocationSuffix(
      (
        finalService?.conditions ||
        (finalService as any)?.Conditions ||
        serviceDescription ||
        ''
      ).toString(),
      expertCity,
    );

    // ✅ INFORMACIÓN DE UBICACIÓN DEL EXPERTO PARA EL MAPA
    // Intentar múltiples fuentes para obtener las coordenadas
    const expertLat = finalService?.expertLatitude 
        || finalService?.expert?.latitude 
        || (finalService as any)?.ExpertLatitude
        || (finalService?.expert as any)?.Latitude;
    const expertLng = finalService?.expertLongitude 
        || finalService?.expert?.longitude 
        || (finalService as any)?.ExpertLongitude
        || (finalService?.expert as any)?.Longitude;
    
    const expertLocation = (expertLat && expertLng) ? {
        latitude: typeof expertLat === 'string' 
            ? parseFloat(expertLat) 
            : Number(expertLat),
        longitude: typeof expertLng === 'string' 
            ? parseFloat(expertLng) 
            : Number(expertLng)
    } : null;
    
    // Rango de trabajo elegido por el experto (0 = solo en su taller, válido).
    // Prioriza WorkRadiusKm sobre el legacy locationRange.
    const expertWorkRadius = readWorkRadiusKm(finalService?.expert);
    const expertRange = expertWorkRadius !== null
        ? expertWorkRadius
        : (finalService?.expert?.locationRange
            || (finalService as any)?.locationRange
            || (finalService as any)?.LocationRange
            || locationRange
            || null);
    const expertCountry = finalService?.expert?.country || null;

    const expertLocationLabel = (() => {
        const countryName = expertCountry ? getCountryName(expertCountry) : '';
        const parts: string[] = [];
        if (expertCity) parts.push(expertCity);
        if (countryName) parts.push(countryName);
        return parts.length > 0 ? parts.join(', ') : countryName || '';
    })();

    // ✅ FUNCIÓN PARA FORMATEAR DÍAS DE LA SEMANA
    const formatDay = (day: string): string => {
        const dayMap: Record<string, string> = {
            'Monday': 'L',
            'Tuesday': 'M',
            'Wednesday': 'X',
            'Thursday': 'J',
            'Friday': 'V',
            'Saturday': 'S',
            'Sunday': 'D'
        };
        return dayMap[day] || day.charAt(0);
    };
    
    const finalAvailability = finalService?.expert?.currentAvailability;

    const [activeTab, setActiveTab] = useState<
        'about' | 'deliverables' | 'reviews' | 'availability'
    >('about');

    const mobileTablistRef = useRef<HTMLDivElement>(null);
    const mobileTablistShellRef = useRef<HTMLDivElement>(null);
    const mobileAboutIntroRef = useRef<HTMLDivElement>(null);
    const mobileDeliverablesRef = useRef<HTMLDivElement>(null);
    const suppressMobileScrollSpyRef = useRef(false);
    const activeMobileTabRef = useRef(activeTab);
    activeMobileTabRef.current = activeTab;

    // Estado para "Mostrar más" en reviews
    const [expandedReviews, setExpandedReviews] = useState<Record<number, boolean>>({});
    // Estado para mostrar/ocultar imágenes de las reseñas
    const [reviewLightboxOpen, setReviewLightboxOpen] = useState<Record<number, boolean>>({});
    const [reviewLightboxIndex, setReviewLightboxIndex] = useState<Record<number, number>>({});
    const [reviewsModalOpen, setReviewsModalOpen] = useState(false);
    const [formacionSheetOpen, setFormacionSheetOpen] = useState(false);
    const [formacionDialogOpen, setFormacionDialogOpen] = useState(false);

    const finalRating = finalService?.averageRating || (finalService as any)?.AverageRating || 0;
    // Manejar tanto PascalCase como camelCase para reviews
    const rawReviews = finalService?.expert?.reviews || (finalService as any)?.Expert?.Reviews || (finalService as any)?.expert?.Reviews || [];
    const finalReviews = rawReviews.map((review: any) => {
        // Mapear reviewer a client, manejando casos donde reviewer puede ser undefined
        const reviewer = review.reviewer || review.Reviewer || review.client || review.Client;
        const client = reviewer ? {
            id: reviewer.id || reviewer.Id,
            name: reviewer.name || reviewer.Name || 'Usuario',
            email: reviewer.email || reviewer.Email,
            profilePictureUrl: reviewer.profilePictureUrl || reviewer.ProfilePictureUrl,
            createdAt: reviewer.createdAt || reviewer.CreatedAt, // Para calcular "Lleva X años"
            location: reviewer.location || reviewer.Location, // Para mostrar ubicación si no hay tiempo en plataforma
        } : review.client || { name: 'Usuario', email: '', profilePictureUrl: undefined };
        
        return {
            ...review,
            id: review.id || review.Id,
            score: review.score ?? review.Score ?? 5,
            description: review.description || review.Description || '',
            createdAt: review.createdAt || review.CreatedAt,
            client: client,
            rating: review.score ?? review.Score ?? review.rating ?? review.Rating ?? 5, // Mapear score a rating
            comment: review.description || review.Description || review.comment || review.Comment || '',
            imageUrls: review.imageUrls || review.ImageUrls || [],
        };
    });
    const finalCompletedSearches = finalService?.completedSearches || 0;

    const finalServiceTitle =
        finalService?.serviceTypeName ||
        (finalService as any)?.ServiceTypeName ||
        finalService?.categoryName ||
        (finalService as any)?.CategoryName ||
        'Servicio de inspección';

    useEffect(() => {
        const tablist = mobileTablistRef.current;
        const shell = mobileTablistShellRef.current;
        if (!tablist || !shell) return;

        const syncScrollHints = () => {
            const maxScroll = tablist.scrollWidth - tablist.clientWidth;
            const atStart = tablist.scrollLeft <= 2;
            const atEnd = maxScroll <= 2 || tablist.scrollLeft >= maxScroll - 2;
            shell.dataset.scrollStart = atStart ? 'false' : 'true';
            shell.dataset.scrollEnd = atEnd ? 'true' : 'false';
        };

        syncScrollHints();
        const activeEl = tablist.querySelector<HTMLElement>('[data-active="true"]');
        activeEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });

        tablist.addEventListener('scroll', syncScrollHints, { passive: true });
        const observer = typeof ResizeObserver !== 'undefined'
            ? new ResizeObserver(syncScrollHints)
            : null;
        observer?.observe(tablist);
        window.addEventListener('resize', syncScrollHints);

        return () => {
            tablist.removeEventListener('scroll', syncScrollHints);
            observer?.disconnect();
            window.removeEventListener('resize', syncScrollHints);
        };
    }, [activeTab]);

    useEffect(() => {
        const hero = mobileHeroRef.current;
        if (!hero) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                setMobileTopBarCompact(!entry.isIntersecting || entry.intersectionRatio < 0.35);
            },
            { threshold: [0, 0.35, 0.6, 1] },
        );

        observer.observe(hero);
        return () => observer.disconnect();
    }, [serviceId, finalService?.id]);
    
    const finalDeliverableTypes = finalService?.selectedDeliverableTypes ?? [];
    const visibleDeliverableTypes = normalizeDeliverableTypes(finalDeliverableTypes);
    // En coche, el "Informe PDF" lo representa la tarjeta de inspección; el
    // resto de entregables (vídeo, llamada…) se listan aparte para no duplicar.
    const nonPdfDeliverableTypes = visibleDeliverableTypes.filter(
        (dt) => (dt.name || dt.displayName || '').toLowerCase().replace('í', 'i') !== 'pdf'
            && !(dt.name || '').toLowerCase().includes('pdf')
            && !(dt.displayName || '').toLowerCase().includes('informe pdf'),
    );

    // Catálogo maestro de tipos de entregable: mostrar TODOS los que existen
    // (incluidos y no incluidos), marcando cuáles entran en este servicio para
    // que el cliente entienda qué recibe y qué no. Cae al comportamiento previo
    // (solo seleccionados) mientras el catálogo aún no ha cargado.
    const { deliverableTypes: allDeliverableTypes } = useDeliverableTypes();
    const buildDeliverableCatalogCards = (excludePdf: boolean): ServiceDeliverableType[] => {
        if (!allDeliverableTypes?.length) {
            return excludePdf ? nonPdfDeliverableTypes : visibleDeliverableTypes;
        }
        const selectedIds = new Set(
            visibleDeliverableTypes.map((d) => d.id).filter((x): x is number => typeof x === 'number'),
        );
        const selectedKinds = new Set(
            visibleDeliverableTypes.map((d) => getDeliverableKind(d)).filter((k) => k !== 'default'),
        );
        // El backend serializa PascalCase: leer ambos casings (igual que ServiceForm).
        return [...allDeliverableTypes]
            .map((raw) => {
                const dt = raw as Record<string, unknown>;
                return {
                    id: (dt.id ?? dt.Id) as number | undefined,
                    name: String(dt.name ?? dt.Name ?? ''),
                    displayName: String(dt.displayName ?? dt.DisplayName ?? dt.name ?? dt.Name ?? ''),
                    description: String(dt.description ?? dt.Description ?? ''),
                    isRequired: Boolean(dt.isRequired ?? dt.IsRequired),
                    isActive: (dt.isActive ?? dt.IsActive) as boolean | undefined,
                    sortOrder: Number(dt.sortOrder ?? dt.SortOrder ?? 0),
                };
            })
            .filter((dt) => dt.isActive !== false && (dt.name || dt.displayName))
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((dt) => {
                const kind = getDeliverableKind({ name: dt.name, displayName: dt.displayName });
                const isSelected =
                    (dt.id != null && selectedIds.has(dt.id)) || (kind !== 'default' && selectedKinds.has(kind));
                return normalizeDeliverableLabels({
                    id: dt.id,
                    name: dt.name,
                    displayName: dt.displayName,
                    description: dt.description,
                    isRequired: dt.isRequired,
                    isSelected,
                });
            })
            .filter((dt) => (excludePdf ? getDeliverableKind(dt) !== 'pdf' : true));
    };
    // En coche el PDF es la tarjeta de inspección; los extras (vídeo, fotos…) van aparte.
    const inspectionExtraDeliverables = buildDeliverableCatalogCards(true);
    // Categorías sin informe: lista completa con su estado de selección.
    const allDeliverablesForList = buildDeliverableCatalogCards(false);
    const hasMobileDeliverablesSection =
        showInspectionReport || visibleDeliverableTypes.length > 0;

    const mobileTabOrder = useMemo(
        () =>
            hasMobileDeliverablesSection
                ? (['about', 'deliverables', 'reviews', 'availability'] as const)
                : (['about', 'reviews', 'availability'] as const),
        [hasMobileDeliverablesSection],
    );

    const MOBILE_TAB_DOM_IDS = {
        about: 'sd-tab-about',
        deliverables: 'sd-tab-deliverables',
        reviews: 'sd-tab-reviews',
        availability: 'sd-tab-availability',
    } as const;

    const runWithScrollSpySuppressed = useCallback((action: () => void, ms = 700) => {
        suppressMobileScrollSpyRef.current = true;
        action();
        window.setTimeout(() => {
            suppressMobileScrollSpyRef.current = false;
        }, ms);
    }, []);

    const focusMobileTab = useCallback((tabId: keyof typeof MOBILE_TAB_DOM_IDS) => {
        requestAnimationFrame(() => {
            document.getElementById(MOBILE_TAB_DOM_IDS[tabId])?.focus();
        });
    }, []);

    const handleMobileAboutTabClick = useCallback(() => {
        runWithScrollSpySuppressed(() => {
            setActiveTab('about');
            mobileAboutIntroRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            focusMobileTab('about');
        });
    }, [focusMobileTab, runWithScrollSpySuppressed]);

    const handleMobileDeliverablesTabClick = useCallback(() => {
        runWithScrollSpySuppressed(() => {
            setActiveTab('deliverables');
            mobileDeliverablesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            focusMobileTab('deliverables');
        });
    }, [focusMobileTab, runWithScrollSpySuppressed]);

    const handleMobileTabKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLDivElement>) => {
            const currentIndex = mobileTabOrder.indexOf(
                activeTab as (typeof mobileTabOrder)[number],
            );
            if (currentIndex === -1) return;

            let nextIndex = currentIndex;
            switch (event.key) {
                case 'ArrowRight':
                    nextIndex = (currentIndex + 1) % mobileTabOrder.length;
                    break;
                case 'ArrowLeft':
                    nextIndex =
                        (currentIndex - 1 + mobileTabOrder.length) % mobileTabOrder.length;
                    break;
                case 'Home':
                    nextIndex = 0;
                    break;
                case 'End':
                    nextIndex = mobileTabOrder.length - 1;
                    break;
                default:
                    return;
            }

            event.preventDefault();
            const nextTab = mobileTabOrder[nextIndex];
            if (nextTab === 'about') {
                handleMobileAboutTabClick();
            } else if (nextTab === 'deliverables') {
                handleMobileDeliverablesTabClick();
            } else {
                setActiveTab(nextTab);
                focusMobileTab(nextTab);
            }
        },
        [
            activeTab,
            focusMobileTab,
            handleMobileAboutTabClick,
            handleMobileDeliverablesTabClick,
            mobileTabOrder,
        ],
    );

    useEffect(() => {
        if (!hasMobileDeliverablesSection) return;
        if (activeTab !== 'about' && activeTab !== 'deliverables') return;

        const section = mobileDeliverablesRef.current;
        if (!section) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (suppressMobileScrollSpyRef.current) return;
                const tab = activeMobileTabRef.current;
                if (tab === 'reviews' || tab === 'availability') return;

                if (entry.isIntersecting) {
                    setActiveTab((current) =>
                        current === 'reviews' || current === 'availability'
                            ? current
                            : 'deliverables',
                    );
                } else if (entry.boundingClientRect.top > 0) {
                    setActiveTab((current) =>
                        current === 'reviews' || current === 'availability' ? current : 'about',
                    );
                }
            },
            {
                root: null,
                threshold: [0, 0.12],
                rootMargin: '-96px 0px -55% 0px',
            },
        );

        observer.observe(section);
        return () => observer.disconnect();
    }, [hasMobileDeliverablesSection, activeTab]);

    const isMobileAboutPanelVisible =
        activeTab === 'about' || activeTab === 'deliverables';

    // 🛡️ Round 10 — P-B FIX: delegado a helper central NaN-safe (formatPriceNumber).
    // Antes: inline con minFractionDigits=0 inconsistente con CheckoutPage (2). Ahora ambas
    // muestran el mismo precio del mismo servicio con el mismo formato (16,50 €).
    const formatPrice = (price: number) => formatPriceNumber(price);

    // Round 24: conversion to preferred currency. Service price source default 'EUR'.
    const { formatPriceWithSource, preferredCurrency } = useCurrency();
    const servicePriceCurrency = (finalService as any)?.priceCurrency || (finalService as any)?.currency || 'EUR';
    const getServicePriceInfo = (amount: number) =>
        formatPriceWithSource(amount, servicePriceCurrency, preferredCurrency);

    /** Footer móvil: una sola línea (sin paréntesis de moneda origen). */
    const getMobileFooterPriceLine = (amount: number) => {
        const info = getServicePriceInfo(amount);
        if (!info.wasConverted) {
            return info.display.replace(/^≈\s*/, '');
        }
        return `≈ ${info.converted}`;
    };

    const renderServicePrice = (amount: number) => {
        const info = getServicePriceInfo(amount);
        if (!info.wasConverted) return <span>{info.display}</span>;
        return (
            <>
                <span>≈ {info.converted}</span>
                <span className="ml-1 text-xs font-normal text-ink-muted">({info.sourceFormatted})</span>
            </>
        );
    };

    useEffect(() => {
        const fromState = parseHireSearchLocationFromRouteState(location.state);
        if (fromState) persistHireSearchLocation(fromState);
    }, [location.state]);

    const handleReserveClick = () => {
        if (finalService?.expert?.isOnVacation) {
            showToast('info', 'Este experto está de vacaciones. Prueba más adelante.');
            return;
        }

        const checkoutPath = getCheckoutPath();
        if (!checkoutPath) {
            showToast('error', 'Error: ID de servicio no válido');
            return;
        }
        
        if (!isAuthenticated) {
            openLoginForCheckout();
            return;
        }

        persistServiceReturnPath(
            resolveServiceReturnPath((location.state as { returnTo?: string } | null)?.returnTo),
        );

        const expertLat =
            latitude?.toString() ??
            finalService?.expert?.latitude?.toString() ??
            (finalService as any)?.Expert?.Latitude?.toString() ??
            null;
        const expertLng =
            longitude?.toString() ??
            finalService?.expert?.longitude?.toString() ??
            (finalService as any)?.Expert?.Longitude?.toString() ??
            null;

        const hireSearchLocation =
            readHireSearchLocation() ??
            (expertLocationLabel
                ? {
                      locationName: expertLocationLabel,
                      latitude: expertLat,
                      longitude: expertLng,
                  }
                : null);

        if (hireSearchLocation) persistHireSearchLocation(hireSearchLocation);

        // Servicios con cita o sin ella navegan igual: la coordinación se decide
        // en el primer paso del checkout (pantalla dedicada, no popup).
        navigate(checkoutPath, {
            replace: false,
            state: hireSearchLocation ? { hireSearchLocation } : undefined,
        });
    };

    const handleImageClick = (index: number) => {
        setLightboxIndex(index);
        setIsLightboxOpen(true);
    };

    // Funciones para manejar el lightbox de imágenes de reseñas
    const handleReviewLightboxNavigation = (reviewId: number, direction: 'prev' | 'next', totalImages: number) => {
        setReviewLightboxIndex(prev => {
            const currentIndex = prev[reviewId] || 0;
            if (direction === 'prev') {
                return { ...prev, [reviewId]: currentIndex === 0 ? totalImages - 1 : currentIndex - 1 };
            } else {
                return { ...prev, [reviewId]: currentIndex === totalImages - 1 ? 0 : currentIndex + 1 };
            }
        });
    };

    const heroImage = validImages[0] || '';
    const gridImages = validImages.slice(1, 5);

    if (isLoading) {
        return (
            <SileoPageLoader message="Cargando reseñas…" className="bg-white" />
        );
    }

    return (
        <>
        <div className="service-detail-page min-h-screen bg-surface-tinted">
                
            {/* ========== VERSIÓN MÓVIL MEJORADA ========== */}
            <div className="lg:hidden">
                <div className="relative w-full" ref={mobileHeroRef}>
                    <ServiceDetailMobileTopBar
                        mode="both"
                        title={finalServiceTitle}
                        onBack={onBack}
                        showCompact={mobileTopBarCompact}
                        showFavorite={isAuthenticated}
                        isFavorite={isFavorite}
                        onFavoriteToggle={handleToggleFavorite}
                    />
                    <div className="relative w-full overflow-hidden">
                        <ServiceDetailMobilePhotoMapHero
                            images={validImages}
                            loadingImages={loadingImages}
                            failedImages={failedImages}
                            onImageError={handleImageError}
                            onImageLoad={handleImageLoad}
                            onImageLoadStart={handleImageLoadStart}
                            onOpenImage={handleImageClick}
                            location={expertLocation}
                            locationLabel={expertLocationLabel || undefined}
                            rangeKm={expertRange ?? 25}
                        />
                    </div>

                    <div
                        className={`relative ${SD_MOBILE_SHEET_OVERLAP_CLASS} z-10 rounded-t-xl bg-white shadow-[0_-1px_0_hsl(var(--line))] ${SD_MOBILE_SHEET_TOP_CLASS} ${SD_MOBILE_SCROLL_PAD_TRUST_CLASS}`}
                    >
                        <div className={SD_MOBILE_IDENTITY_GUTTER_CLASS}>
                            <section
                                className={`sd-mobile-identity-stack ${SD_MOBILE_IDENTITY_STACK_CLASS}`}
                            >
                                <ServiceDetailPageHeadline
                                    variant="compact"
                                    title={finalServiceTitle}
                                    locationLabel={compactMobileLocationLabel(expertLocationLabel)}
                                />
                                <ServiceDetailExpertHostRow
                                    variant="mobile"
                                    expertName={finalExpertName}
                                    expertPicture={finalExpertPicture}
                                    expertDescription={finalExpertDescription}
                                    expertFormacion={finalExpertFormacion}
                                    completedSearches={finalCompletedSearches}
                                    onFormacionClick={
                                        hasExpertFormacion
                                            ? () => setFormacionSheetOpen(true)
                                            : undefined
                                    }
                                    onAvatarClick={() => {
                                        if (finalExpertPicture) {
                                            setIsExpertPhotoOpen(true);
                                        }
                                    }}
                                    onChatClick={handleChatClick}
                                />
                            </section>

                            {hasExpertFormacion ? (
                                <ServiceDetailExpertFormacionSheet
                                    value={finalExpertFormacion}
                                    expertName={finalExpertName}
                                    expertDescription={finalExpertDescription}
                                    open={formacionSheetOpen}
                                    onOpenChange={setFormacionSheetOpen}
                                />
                            ) : null}
                        </div>

                        <section className={SD_MOBILE_TAB_REGION_CLASS} aria-label="Detalle del servicio">
                            <div ref={mobileTablistShellRef} className={SD_MOBILE_TABLIST_SHELL_CLASS}>
                                <div
                                    ref={mobileTablistRef}
                                    className={SD_MOBILE_TABLIST_CLASS}
                                    role="tablist"
                                    aria-label="Información del servicio"
                                    onKeyDown={handleMobileTabKeyDown}
                                >
                                    <button
                                        type="button"
                                        role="tab"
                                        id="sd-tab-about"
                                        aria-controls="sd-panel-about"
                                        aria-selected={activeTab === 'about'}
                                        aria-label="Acerca del servicio"
                                        tabIndex={activeTab === 'about' ? 0 : -1}
                                        data-active={activeTab === 'about' ? 'true' : undefined}
                                        onClick={handleMobileAboutTabClick}
                                        className="sd-tab"
                                    >
                                        <span className="sd-tab__label">Servicio</span>
                                    </button>
                                    {hasMobileDeliverablesSection ? (
                                        <button
                                            type="button"
                                            role="tab"
                                            id="sd-tab-deliverables"
                                            aria-controls="sd-panel-about"
                                            aria-selected={activeTab === 'deliverables'}
                                            aria-label="Qué entregará"
                                            tabIndex={activeTab === 'deliverables' ? 0 : -1}
                                            data-active={
                                                activeTab === 'deliverables' ? 'true' : undefined
                                            }
                                            onClick={handleMobileDeliverablesTabClick}
                                            className="sd-tab"
                                        >
                                            <span className="sd-tab__label">Entregables</span>
                                        </button>
                                    ) : null}
                                    <button
                                        type="button"
                                        role="tab"
                                        id="sd-tab-reviews"
                                        aria-controls="sd-panel-reviews"
                                        aria-selected={activeTab === 'reviews'}
                                        aria-label={
                                            finalReviews.length > 0
                                                ? `Reseñas, ${finalReviews.length}`
                                                : 'Reseñas'
                                        }
                                        tabIndex={activeTab === 'reviews' ? 0 : -1}
                                        data-active={activeTab === 'reviews' ? 'true' : undefined}
                                        onClick={() => setActiveTab('reviews')}
                                        className="sd-tab"
                                    >
                                        <span className="sd-tab__label">Reseñas</span>
                                        {finalReviews.length > 0 ? (
                                            <span className="sd-tab__badge" aria-hidden>
                                                {finalReviews.length}
                                            </span>
                                        ) : null}
                                    </button>
                                    <button
                                        type="button"
                                        role="tab"
                                        id="sd-tab-availability"
                                        aria-controls="sd-panel-availability"
                                        aria-selected={activeTab === 'availability'}
                                        aria-label="Disponibilidad"
                                        tabIndex={activeTab === 'availability' ? 0 : -1}
                                        data-active={activeTab === 'availability' ? 'true' : undefined}
                                        onClick={() => setActiveTab('availability')}
                                        className="sd-tab"
                                    >
                                        <span className="sd-tab__label">Agenda</span>
                                    </button>
                                    <span className="sd-tablist__spacer" aria-hidden />
                                </div>
                            </div>

                            {isMobileAboutPanelVisible && (
                                <div
                                    id="sd-panel-about"
                                    role="tabpanel"
                                    aria-labelledby={
                                        activeTab === 'deliverables'
                                            ? 'sd-tab-deliverables'
                                            : 'sd-tab-about'
                                    }
                                    className={`sd-tab-panel ${SD_MOBILE_GUTTER_CLASS} ${SD_MOBILE_INSET_STACK_CLASS} ${SD_MOBILE_TAB_PANEL_PT_CLASS}`}
                                >
                                    <div ref={mobileAboutIntroRef}>
                                        {displayMainDescription ? (
                                            <p className="sd-body m-0 whitespace-pre-line">
                                                {displayMainDescription}
                                            </p>
                                        ) : null}
                                    </div>
                                    {hasMobileDeliverablesSection ? (
                                        <div
                                            ref={mobileDeliverablesRef}
                                            id="sd-section-deliverables"
                                            className="flex flex-col gap-3 scroll-mt-24"
                                        >
                                            {showInspectionReport ? (
                                                <>
                                                    <h2 className="sd-section-label m-0">
                                                        Qué entregará
                                                    </h2>
                                                    <InspectionReportPreview
                                                        catalog={inspectionCatalog!}
                                                        config={inspectionConfig}
                                                    />
                                                    {inspectionExtraDeliverables.length > 0 ? (
                                                        <ServiceDetailDeliverablesGuide
                                                            items={inspectionExtraDeliverables}
                                                            variant="inline"
                                                            presentation="cover"
                                                            showHeading={false}
                                                        />
                                                    ) : null}
                                                </>
                                            ) : (
                                                <>
                                                    <h2 className="sd-section-label m-0">
                                                        Qué entregará
                                                    </h2>
                                                    <ServiceDetailDeliverablesGuide
                                                        items={allDeliverablesForList}
                                                        variant="inline"
                                                        presentation="cover"
                                                        showHeading={false}
                                                        showUnselected
                                                    />
                                                </>
                                            )}
                                        </div>
                                    ) : null}
                                </div>
                            )}

                            {activeTab === 'reviews' && (
                                <div
                                    id="sd-panel-reviews"
                                    role="tabpanel"
                                    aria-labelledby="sd-tab-reviews"
                                    className={`sd-tab-panel ${SD_MOBILE_GUTTER_CLASS} ${SD_MOBILE_TAB_PANEL_REVIEWS_CLASS}`}
                                >
                                    <ServiceDetailReviewsPreview
                                        variant="mobile"
                                        hideHeading
                                        headingId="sd-reviews-tab-heading"
                                        reviews={finalReviews}
                                        averageRating={finalRating}
                                        onShowAll={() => setReviewsModalOpen(true)}
                                    />
                                </div>
                            )}

                            {activeTab === 'availability' && (
                                <div
                                    id="sd-panel-availability"
                                    role="tabpanel"
                                    aria-labelledby="sd-tab-availability"
                                    className={`sd-tab-panel ${SD_MOBILE_GUTTER_CLASS} ${SD_MOBILE_TAB_PANEL_PT_CLASS}`}
                                >
                                    <ServiceDetailAvailabilityCalendar
                                        serviceId={serviceId}
                                        availability={finalAvailability}
                                        timezone={finalService?.expert?.timezone}
                                        isOnVacation={finalService?.expert?.isOnVacation}
                                        showHeading={false}
                                        mobileTab
                                        showFootnote
                                    />
                                </div>
                            )}
                        </section>
                    </div>
            </div>

                <MobileReserveFooter
                    price={getMobileFooterPriceLine(finalPrice)}
                    priceSuffix="por servicio"
                    priceAriaLabel={`${getMobileFooterPriceLine(finalPrice)} por servicio`}
                >
                            {isAuthenticated ? (
                                <button
                                    onClick={handleReserveClick}
                                    type="button"
                                    disabled={finalService?.expert?.isOnVacation}
                            className={`${SD_MOBILE_FOOTER_CTA_CLASS} sd-cta-dark disabled:cursor-not-allowed disabled:opacity-50`}
                                >
                            {finalService?.expert?.isOnVacation ? 'No disponible' : 'Reservar'}
                                </button>
                            ) : (
                                    <button
                                        type="button"
                            onClick={openLoginForCheckout}
                            className={`${SD_MOBILE_FOOTER_CTA_CLASS} sd-cta-dark`}
                        >
                            Inicia sesión para reservar
                                    </button>
                            )}
                </MobileReserveFooter>
            </div>

            {/* ========== DESKTOP — galería full-width + grid contenido / aside ========== */}
            <div className="service-detail-desktop hidden min-h-screen overflow-x-hidden lg:block">
                {/* Header unificado: el mismo topbar de la homepage en desktop
                    (logo→inicio, ayuda, moneda, notificaciones, cuenta) en lugar del
                    header propio de la ficha. Decisión del usuario 2026-06-16. */}
                <HomepageDesktopTopBar variant="plain" showLogo />

                <div className={`${SD_PAGE_INNER_MAX_CLASS} pb-12 pt-3 lg:pt-4`}>
                    <div className="mb-4 overflow-hidden lg:mb-5">
                        <ServiceDetailDesktopPhotoMapHero
                            images={validImages}
                            onBack={onBack}
                            primaryPhotoTopRight={
                                isAuthenticated ? (
                                    <button
                                        type="button"
                                        onClick={handleToggleFavorite}
                                        className="sd-mobile-topbar-btn"
                                        aria-label={isFavorite ? 'Quitar de guardados' : 'Guardar'}
                                        aria-pressed={isFavorite}
                                    >
                                        <FavoriteHeart filled={isFavorite} size={20} variant="plain" />
                                    </button>
                                ) : undefined
                            }
                            onOpen={handleImageClick}
                            loadingImages={loadingImages}
                            failedImages={failedImages}
                            onImageError={handleImageError}
                            onImageLoad={handleImageLoad}
                            onImageLoadStart={handleImageLoadStart}
                            location={expertLocation}
                            locationLabel={expertLocationLabel || undefined}
                            rangeKm={expertRange ?? 25}
                            titleOverlay={
                                <ServiceDetailPageHeadline
                                    variant="on-image"
                                    title={finalServiceTitle}
                                    rating={finalRating > 0 ? finalRating : undefined}
                                    reviewCount={
                                        finalReviews.length > 0 ? finalReviews.length : undefined
                                    }
                                    onReviewsClick={
                                        finalReviews.length > 0
                                            ? () => setReviewsModalOpen(true)
                                            : undefined
                                    }
                                />
                            }
                        />
                    </div>

                    <div className={`${SD_PAGE_GRID_CLASS} min-w-0`}>
                        <div className="min-w-0 lg:col-start-1 flex flex-col gap-5">
                            <ServiceDetailDesktopHostPanel
                                expertName={finalExpertName}
                                expertPicture={finalExpertPicture}
                                expertDescription={finalExpertDescription}
                                expertFormacion={finalExpertFormacion}
                                completedSearches={finalCompletedSearches}
                                onFormacionClick={
                                    hasExpertFormacion
                                        ? () => setFormacionDialogOpen(true)
                                        : undefined
                                }
                                onAvatarClick={() => {
                                    if (finalExpertPicture) {
                                        setIsExpertPhotoOpen(true);
                                    }
                                }}
                                onChatClick={handleChatClick}
                                description={displayMainDescription}
                                showInspectionReport={showInspectionReport}
                                inspectionCatalog={inspectionCatalog}
                                inspectionConfig={inspectionConfig}
                                inspectionExtraDeliverables={inspectionExtraDeliverables}
                                visibleDeliverableTypes={visibleDeliverableTypes}
                                allDeliverablesForList={allDeliverablesForList}
                                reviews={finalReviews}
                                averageRating={finalRating}
                                onShowAllReviews={() => setReviewsModalOpen(true)}
                            />
                        </div>

                        <aside
                            className={`min-w-0 lg:col-start-2 lg:sticky lg:self-start ${SD_DESKTOP_STICKY_TOP_CLASS}`}
                        >
                            {(() => {
                                const desktopPriceInfo = getServicePriceInfo(finalPrice);
                                return (
                                    <ServiceDetailDesktopBookingAside
                                        priceDisplay={
                                            desktopPriceInfo.wasConverted ? (
                                                <>
                                                    <span className="mr-0.5 text-base font-medium text-brand">
                                                        ≈
                                                    </span>
                                                    {desktopPriceInfo.converted}
                                                </>
                                            ) : (
                                                desktopPriceInfo.display
                                            )
                                        }
                                        priceWasConverted={desktopPriceInfo.wasConverted}
                                        priceSourceFormatted={desktopPriceInfo.sourceFormatted}
                                        isOnVacation={finalService?.expert?.isOnVacation}
                                        isAuthenticated={isAuthenticated}
                                        averageRating={finalRating > 0 ? finalRating : undefined}
                                        reviewCount={finalReviews.length}
                                        onReviewsClick={
                                            finalReviews.length > 0
                                                ? () => setReviewsModalOpen(true)
                                                : undefined
                                        }
                                        onReserve={handleReserveClick}
                                        onLogin={openLoginForCheckout}
                                    />
                                );
                            })()}
                        </aside>
                    </div>
                </div>
            </div>

            <ServiceDetailPhotoLightbox
                open={isLightboxOpen}
                onOpenChange={setIsLightboxOpen}
                images={validImages}
                index={lightboxIndex}
                onIndexChange={setLightboxIndex}
                loadingImages={loadingImages}
                failedImages={failedImages}
                onImageError={handleImageError}
                onImageLoad={handleImageLoad}
                onImageLoadStart={handleImageLoadStart}
            />

            <ServiceDetailReviewsModal
                open={reviewsModalOpen}
                onOpenChange={setReviewsModalOpen}
                reviews={finalReviews}
                averageRating={finalRating}
                expertName={finalExpertName}
                expandedReviews={expandedReviews}
                onToggleExpand={(key) =>
                    setExpandedReviews((prev) => ({ ...prev, [key]: !prev[key] }))
                }
                onOpenReviewImage={(reviewKey, imgIdx) => {
                    setReviewLightboxIndex((prev) => ({ ...prev, [reviewKey]: imgIdx }));
                    setReviewLightboxOpen((prev) => ({ ...prev, [reviewKey]: true }));
                }}
            />

            {/* Lightbox para imágenes de reseñas */}
            {finalReviews.map((review: any, idx: number) => {
                const reviewId = review.id || idx;
                const isOpen = reviewLightboxOpen[reviewId] || false;
                const currentIndex = reviewLightboxIndex[reviewId] || 0;
                const reviewImages = review.imageUrls || [];
                
                if (!isOpen || reviewImages.length === 0) return null;
                
                return (
                    <Dialog key={reviewId} open={isOpen} onOpenChange={(open) => setReviewLightboxOpen(prev => ({ ...prev, [reviewId]: open }))}>
                        <DialogContent 
                            className="w-full max-w-[1920px] p-0 bg-transparent border-none animate-in fade-in-0 zoom-in-95 duration-200"
                            overlayClassName="bg-black/20"
                        >
                            <DialogTitle className="sr-only">
                                Fotos de la reseña, imagen {currentIndex + 1} de {reviewImages.length}
                            </DialogTitle>
                            <DialogDescription className="sr-only">Galería de fotos de la reseña</DialogDescription>
                            <div className="relative h-[90vh] max-h-[90vh]">
                                <button
                                    type="button"
                                    onClick={() => setReviewLightboxOpen(prev => ({ ...prev, [reviewId]: false }))}
                                    className="absolute top-4 right-4 z-50 w-10 h-10 flex items-center justify-center rounded-full bg-white hover:bg-gray-100 shadow-lg border border-gray-200 transition-all duration-200 hover:scale-110"
                                    aria-label="Cerrar galería de reseña"
                                >
                                    <X className="w-5 h-5 text-gray-700" />
                                </button>
                                
                                {reviewImages.length > 1 && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => handleReviewLightboxNavigation(reviewId, 'prev', reviewImages.length)}
                                            className="absolute left-6 top-1/2 -translate-y-1/2 z-50 w-14 h-14 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-md hover:bg-white shadow-2xl border border-gray-100 hover:scale-110 hover:shadow-3xl transition-all duration-300 group"
                                            aria-label="Foto anterior de la reseña"
                                        >
                                            <ChevronLeft className="w-7 h-7 text-gray-800 group-hover:text-gray-900 transition-colors" strokeWidth={2.5} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleReviewLightboxNavigation(reviewId, 'next', reviewImages.length)}
                                            className="absolute right-6 top-1/2 -translate-y-1/2 z-50 w-14 h-14 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-md hover:bg-white shadow-2xl border border-gray-100 hover:scale-110 hover:shadow-3xl transition-all duration-300 group"
                                            aria-label="Foto siguiente de la reseña"
                                        >
                                            <ChevronRight className="w-7 h-7 text-gray-800 group-hover:text-gray-900 transition-colors" strokeWidth={2.5} />
                                        </button>
                                    </>
                                )}

                                <div className="h-full flex items-center justify-center p-8">
                                    {reviewImages[currentIndex] ? (
                                        <img
                                            key={currentIndex}
                                            src={reviewImages[currentIndex]}
                                            alt={`Foto reseña ${currentIndex + 1}`}
                                            className="max-w-full max-h-full object-contain transition-all duration-300 ease-in-out"
                                        />
                                    ) : (
                                        <div className="text-center text-white">
                                            <Image className="w-16 h-16 mx-auto mb-3 opacity-75" strokeWidth={1.5} />
                                            <p className="text-sm">No hay imágenes disponibles</p>
                                        </div>
                                    )}
                                </div>

                                {reviewImages.length > 1 && (
                                    <div 
                                        className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10"
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            paddingTop: '4px',
                                            paddingBottom: '4px',
                                            paddingLeft: '8px',
                                            paddingRight: '8px',
                                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                            backdropFilter: 'blur(4px)',
                                            borderRadius: '8px',
                                            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        <span
                                            className="text-badge text-ink-strong"
                                            style={{ fontFamily: HP_FONT }}
                                        >
                                        {currentIndex + 1} / {reviewImages.length}
                                        </span>
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '3px',
                                            }}
                                        >
                                            {reviewImages.map((_: string, imgIdx: number) => (
                                                <div
                                                    key={imgIdx}
                                                    className="rounded-full transition-all"
                                                    style={{
                                                        height: '3px',
                                                        width: imgIdx === currentIndex ? '12px' : '3px',
                                                        backgroundColor: imgIdx === currentIndex ? MAP_LITERAL.inkStrong : `${MAP_LITERAL.inkStrong}66`,
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </DialogContent>
                    </Dialog>
                );
            })}

            <style>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                    scroll-behavior: smooth;
                }
            `}</style>
            
            {/* Modal de Login unificado cuando el usuario no está autenticado */}
            <LoginModal
                open={showLoginDialog}
                onOpenChange={(open) => {
                    setShowLoginDialog(open);
                    if (!open && !isAuthenticated) {
                        sessionStorage.removeItem('loginFromChat');
                    }
                }}
                initialTab="login"
                onSuccess={() => {
                    setShowLoginDialog(false);
                }}
            />
        </div>
        
        {/* Modal desktop — expediente académico */}
        {hasExpertFormacion ? (
            <ServiceDetailExpertFormacionDialog
                value={finalExpertFormacion}
                expertName={finalExpertName}
                open={formacionDialogOpen}
                onOpenChange={setFormacionDialogOpen}
            />
        ) : null}

        {/* Modal para ampliar foto del experto */}
        {finalExpertPicture && (
            <Dialog open={isExpertPhotoOpen} onOpenChange={setIsExpertPhotoOpen}>
                <DialogContent className="max-w-2xl w-full p-0 bg-transparent border-none">
                    <DialogTitle className="sr-only">Foto de perfil de {finalExpertName}</DialogTitle>
                    <DialogDescription className="sr-only">Imagen ampliada del perfil del experto</DialogDescription>
                    <div 
                        className="relative w-full h-full flex items-center justify-center p-8 cursor-pointer"
                        onClick={() => setIsExpertPhotoOpen(false)}
                    >
                        <div 
                            className="w-[400px] h-[400px] min-w-[250px] min-h-[250px] max-w-[80vw] max-h-[80vw] aspect-square rounded-full overflow-hidden flex items-center justify-center bg-gray-100 border-4 border-white shadow-lg"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <img
                                src={finalExpertPicture}
                                alt={finalExpertName}
                                className="w-full h-full object-cover"
                                style={{ borderRadius: '50%' }}
                            />
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        )}
        </>
    );
}

