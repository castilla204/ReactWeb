import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    X,
    Heart,
    Image,
    MapPin,
} from 'lucide-react';
import { EnhancedReviewsList } from '../components/EnhancedReviewCard';
import FormacionPhotoOverlay from '../components/serviceDetail/FormacionPhotoOverlay';
import { useServices, Service } from '../hooks/useServices';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { useAuth } from '../contexts/AuthContext';
import { persistServiceReturnPath, resolveServiceReturnPath } from '../utils/servicePageNavigation';
import { readHireSearchLocation, persistHireSearchLocation, parseHireSearchLocationFromRouteState } from '../utils/hireSearchContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { showToast } from '../lib/toast';
import { authService } from '../services/authService';
import { formatPriceNumber } from '../utils/priceUtils';
import { formatTimezoneFriendly } from '../utils/timezoneFormat';
import { ServiceDetailBookingMeta } from '../components/serviceDetail/ServiceDetailBookingMeta';
import { ServiceDetailDesktopBookingAside } from '../components/serviceDetail/ServiceDetailDesktopBookingAside';
import { pickPreviewReviews } from '../utils/reviewRatingDistribution';
import { MobileReserveFooter } from '../components/serviceDetail/MobileReserveFooter';
import { EscrowTrustLine } from '../components/EscrowTrustLine';
import { useCurrency } from '../contexts/CurrencyContext';
import { PreHireChat } from '../components/PreHireChat';
import {
  SD_MOBILE_FOOTER_CTA_CLASS,
  SD_MOBILE_EMPHASIS_CLASS,
  SD_MOBILE_GUTTER_CLASS,
  SD_MOBILE_HEADER_PB_CLASS,
  SD_MOBILE_INSET_STACK_CLASS,
  SD_MOBILE_META_CLASS,
  SD_MOBILE_META_SECTION_CLASS,
  SD_MOBILE_SCROLL_PAD_CLASS,
  SD_MOBILE_SHEET_BOTTOM_CLASS,
  SD_MOBILE_SHEET_DIVIDER_CLASS,
  SD_MOBILE_SHEET_OVERLAP_CLASS,
  SD_MOBILE_SHEET_TOP_CLASS,
  SD_MOBILE_TAB_PANEL_PT_CLASS,
  SD_PAGE_GRID_CLASS,
  SD_DESKTOP_PANEL_CLASS,
  SD_DESKTOP_STICKY_TOP_CLASS,
  SD_PAGE_INNER_MAX_CLASS,
} from '../constants/homepageTypography';
import { ServiceDetailDesktopPhotoMapHero } from '../components/serviceDetail/ServiceDetailDesktopPhotoMapHero';
import {
    ServiceDetailDeliverablesGuide,
    normalizeDeliverableTypes,
} from '../components/serviceDetail/ServiceDetailDeliverablesGuide';
import { ServiceDetailReviewsModal } from '../components/serviceDetail/ServiceDetailReviewsModal';
import { ServiceDetailReviewsPreview } from '../components/serviceDetail/ServiceDetailReviewsPreview';
import { getCountryName } from '../utils/countries';
import { readWorkRadiusKm, formatWorkRadiusExplanation } from '../utils/workRadius';
import { stripServiceDescriptionLocationSuffix } from '../utils/stripServiceDescriptionLocationSuffix';
import { HomepageDesktopTopBar } from '../components/HomepageDesktopTopBar';
import { ServiceDetailPageHeadline } from '../components/serviceDetail/ServiceDetailPageHeadline';
import { ServiceDetailExpertHostRow } from '../components/serviceDetail/ServiceDetailExpertHostRow';
import InspectionReportPreview from '../components/serviceDetail/InspectionReportPreview';
import { type InspectionConfig } from '../lib/inspectionTemplateConfig';
import { ServiceDetailMobilePhotoMapHero } from '../components/serviceDetail/ServiceDetailMobilePhotoMapHero';
import { ServiceDetailMobileTopBar } from '../components/serviceDetail/ServiceDetailMobileTopBar';
import { ServiceDetailPhotoLightbox } from '../components/serviceDetail/ServiceDetailPhotoLightbox';
import { LoginModal } from '../components/LoginModal';
import { useIsMobile } from '../hooks/useIsMobile';
import { buildClientPreHireChatPath } from '../utils/preHireChatNavigation';

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
    // Informe de inspección: solo en servicios de coche; cae a la plantilla base.
    const showInspectionReport = ((finalService as { categoryName?: string } | null)?.categoryName || '')
      .toLowerCase()
      .includes('coche');
    const inspectionPdfUrl: string =
      (finalService as { inspectionTemplatePdfUrl?: string | null } | null)?.inspectionTemplatePdfUrl
      || '/plantillas/inspeccion-coche.pdf';
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
    const finalExpertFormacion = (finalService?.expert as { formacion?: string } | null | undefined)?.formacion ?? '';
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

    // ✅ DISPONIBILIDAD
    const finalAvailability = finalService?.expert?.currentAvailability;
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
    
    const [activeTab, setActiveTab] = useState<'about' | 'reviews'>('about');

    // Estado para "Mostrar más" en reviews
    const [expandedReviews, setExpandedReviews] = useState<Record<number, boolean>>({});
    // Estado para mostrar/ocultar imágenes de las reseñas
    const [reviewLightboxOpen, setReviewLightboxOpen] = useState<Record<number, boolean>>({});
    const [reviewLightboxIndex, setReviewLightboxIndex] = useState<Record<number, number>>({});
    const [reviewsModalOpen, setReviewsModalOpen] = useState(false);

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

    const serviceHeadlineMeta = [
        expertLocationLabel || null,
        finalRating > 0
            ? `${Number(finalRating).toFixed(1).replace(/\.0$/, '')}${
                  finalReviews.length > 0 ? ` · ${finalReviews.length} reseñas` : ''
              }`
            : finalReviews.length > 0
              ? `${finalReviews.length} reseñas`
              : null,
    ]
        .filter(Boolean)
        .join(' · ');

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
                <span className="ml-1 text-xs font-normal text-[#6a6a6a]">({info.sourceFormatted})</span>
            </>
        );
    };

    useEffect(() => {
        const fromState = parseHireSearchLocationFromRouteState(location.state);
        if (fromState) persistHireSearchLocation(fromState);
    }, [location.state]);

    const handleReserveClick = () => {
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
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="text-center">
                    <div className="w-10 h-10 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500 text-sm">Cargando...</p>
                </div>
            </div>
        );
    }

    return (
        <>
        <div className="service-detail-page min-h-screen bg-[#fafafa]">
                
            {/* ========== VERSIÓN MÓVIL MEJORADA ========== */}
            <div className="lg:hidden">
                <ServiceDetailMobileTopBar
                    mode="compact"
                    title={finalServiceTitle}
                    onBack={onBack}
                    showCompact={mobileTopBarCompact}
                    showFavorite={isAuthenticated}
                    isFavorite={isFavorite}
                    onFavoriteToggle={() => setIsFavorite(!isFavorite)}
                />

                <div className="relative w-full" ref={mobileHeroRef}>
                    <ServiceDetailMobileTopBar
                        mode="floating"
                        title={finalServiceTitle}
                        onBack={onBack}
                        showCompact={mobileTopBarCompact}
                        showFavorite={isAuthenticated}
                        isFavorite={isFavorite}
                        onFavoriteToggle={() => setIsFavorite(!isFavorite)}
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
                            formacionOverlay={
                                <FormacionPhotoOverlay
                                    value={finalExpertFormacion}
                                    variant="mobile"
                                />
                            }
                        />
                    </div>

                    <div
                        className={`relative ${SD_MOBILE_SHEET_OVERLAP_CLASS} z-10 rounded-t-2xl bg-white shadow-[0_-4px_24px_rgba(15,23,42,0.06)] ${SD_MOBILE_SHEET_TOP_CLASS} ${SD_MOBILE_SCROLL_PAD_CLASS}`}
                    >
                        <div className={SD_MOBILE_GUTTER_CLASS}>
                            <ServiceDetailPageHeadline
                                title={finalServiceTitle}
                                meta={serviceHeadlineMeta || null}
                                className="mb-4"
                            />
                            <header className={SD_MOBILE_HEADER_PB_CLASS}>
                                <ServiceDetailExpertHostRow
                                    variant="mobile"
                                    expertName={finalExpertName}
                                    expertPicture={finalExpertPicture}
                                    completedSearches={finalCompletedSearches}
                                    rating={finalRating > 0 ? finalRating : undefined}
                                    reviewCount={finalReviews.length > 0 ? finalReviews.length : undefined}
                                    onAvatarClick={() => {
                                        if (finalExpertPicture) {
                                            setIsExpertPhotoOpen(true);
                                        }
                                    }}
                                    onChatClick={handleChatClick}
                                />
                            </header>

                            {finalAvailability ? (
                                <section
                                    aria-label="Información para reservar"
                                    className={SD_MOBILE_META_SECTION_CLASS}
                                >
                                    <ServiceDetailBookingMeta
                                        layout="minimal"
                                        embedded
                                        showCoverage={false}
                                        availability={finalAvailability}
                                        timezone={finalService?.expert?.timezone}
                                        isOnVacation={finalService?.expert?.isOnVacation}
                                        rangeKm={expertRange ?? 25}
                                        mapVariant="preview"
                                        showAvailabilityHint={false}
                                    />
                                </section>
                            ) : null}
                        </div>

                        <div className={`${SD_MOBILE_SHEET_BOTTOM_CLASS} ${SD_MOBILE_SHEET_DIVIDER_CLASS}`}>
                            <div
                                className={`sd-tablist w-full ${SD_MOBILE_GUTTER_CLASS}`}
                                role="tablist"
                                aria-label="Información del servicio"
                            >
                            <button
                                type="button"
                                role="tab"
                                id="sd-tab-about"
                                aria-controls="sd-panel-about"
                                aria-selected={activeTab === 'about'}
                                data-active={activeTab === 'about' ? 'true' : undefined}
                                onClick={() => setActiveTab('about')}
                                className="sd-tab"
                            >
                                Acerca del servicio
                            </button>
                            <button
                                type="button"
                                role="tab"
                                id="sd-tab-reviews"
                                aria-controls="sd-panel-reviews"
                                aria-selected={activeTab === 'reviews'}
                                data-active={activeTab === 'reviews' ? 'true' : undefined}
                                onClick={() => setActiveTab('reviews')}
                                className="sd-tab"
                            >
                                Reseñas
                                {finalReviews.length > 0 ? (
                                    <span className="text-xs font-normal tabular-nums text-[#6a6a6a]">
                                        {finalReviews.length}
                                    </span>
                                ) : null}
                            </button>
                            </div>

                            {activeTab === 'about' && (
                                <div
                                    id="sd-panel-about"
                                    role="tabpanel"
                                    aria-labelledby="sd-tab-about"
                                    className={`${SD_MOBILE_GUTTER_CLASS} ${SD_MOBILE_INSET_STACK_CLASS} ${SD_MOBILE_TAB_PANEL_PT_CLASS}`}
                                >
                                    {displayMainDescription ? (
                                        <p className="sd-body whitespace-pre-line">
                                            {displayMainDescription}
                                        </p>
                                    ) : null}
                                    {visibleDeliverableTypes.length > 0 ? (
                                        <ServiceDetailDeliverablesGuide
                                            items={finalDeliverableTypes}
                                            variant="inline"
                                        />
                                    ) : null}
                                    {showInspectionReport && (
                                        <InspectionReportPreview config={inspectionConfig} pdfUrl={inspectionPdfUrl} />
                                    )}
                                    {(expertLocationLabel || expertRange !== null) ? (
                                        <div className={`flex items-start gap-2 ${SD_MOBILE_META_CLASS}`}>
                                            <MapPin size={16} className="mt-0.5 shrink-0 text-[#1C63B4]" />
                                            <span>
                                                {expertLocationLabel ? (
                                                    <span className="font-medium text-[#1c1c1c]">
                                                        {expertLocationLabel}
                                                    </span>
                                                ) : null}
                                                {expertLocationLabel && expertRange !== null ? (
                                                    <br />
                                                ) : null}
                                                {expertRange !== null
                                                    ? formatWorkRadiusExplanation(expertRange)
                                                    : null}
                                            </span>
                                        </div>
                                    ) : null}
                                </div>
                            )}

                            {activeTab === 'reviews' && (
                                <div
                                    id="sd-panel-reviews"
                                    role="tabpanel"
                                    aria-labelledby="sd-tab-reviews"
                                    className={`${SD_MOBILE_GUTTER_CLASS} ${SD_MOBILE_TAB_PANEL_PT_CLASS}`}
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
                        </div>
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
                            className={SD_MOBILE_FOOTER_CTA_CLASS}
                                >
                            Reservar
                                </button>
                            ) : (
                                    <button
                                        type="button"
                            onClick={openLoginForCheckout}
                            className={SD_MOBILE_FOOTER_CTA_CLASS}
                        >
                            Inicia sesión
                                    </button>
                            )}
                </MobileReserveFooter>
            </div>

            {/* ========== DESKTOP — galería full-width + grid contenido / aside ========== */}
            <div className="service-detail-desktop hidden min-h-screen overflow-x-hidden lg:block">
                {/* Header unificado: el mismo topbar de la homepage en desktop
                    (logo→inicio, ayuda, moneda, notificaciones, cuenta) en lugar del
                    header propio de la ficha. Decisión del usuario 2026-06-16. */}
                <HomepageDesktopTopBar variant="plain" showLogo onBack={onBack} />

                <div className={`${SD_PAGE_INNER_MAX_CLASS} pb-12 pt-5 lg:pt-6`}>
                    <div className="mb-5 overflow-hidden lg:mb-6">
                        <ServiceDetailDesktopPhotoMapHero
                            images={validImages}
                            onOpen={handleImageClick}
                            loadingImages={loadingImages}
                            failedImages={failedImages}
                            onImageError={handleImageError}
                            onImageLoad={handleImageLoad}
                            onImageLoadStart={handleImageLoadStart}
                            location={expertLocation}
                            locationLabel={expertLocationLabel || undefined}
                            rangeKm={expertRange ?? 25}
                            formacionOverlay={
                                <FormacionPhotoOverlay value={finalExpertFormacion} />
                            }
                            titleOverlay={
                                <ServiceDetailPageHeadline
                                    variant="on-image"
                                    title={finalServiceTitle}
                                    locationLabel={expertLocationLabel || undefined}
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
                            <article className={SD_DESKTOP_PANEL_CLASS}>
                                <ServiceDetailExpertHostRow
                                    variant="desktop"
                                    expertName={finalExpertName}
                                    expertPicture={finalExpertPicture}
                                    expertDescription={finalExpertDescription}
                                    completedSearches={finalCompletedSearches}
                                    rating={finalRating > 0 ? finalRating : undefined}
                                    reviewCount={finalReviews.length > 0 ? finalReviews.length : undefined}
                                    onAvatarClick={() => {
                                        if (finalExpertPicture) {
                                            setIsExpertPhotoOpen(true);
                                        }
                                    }}
                                    onChatClick={handleChatClick}
                                />

                                {(expertLocationLabel || expertRange !== null) ? (
                                    <p className="mt-4 flex items-start gap-2 text-sm text-[#6a6a6a]">
                                        <MapPin size={16} className="mt-0.5 shrink-0 text-[#1C63B4]" />
                                        <span>
                                            {expertLocationLabel ? (
                                                <span className="font-medium text-[#1c1c1c]">
                                                    {expertLocationLabel}
                                                </span>
                                            ) : null}
                                            {expertLocationLabel && expertRange !== null ? (
                                                <span className="mx-1.5 text-[#d4d4d4]" aria-hidden>
                                                    ·
                                                </span>
                                            ) : null}
                                            {expertRange !== null
                                                ? formatWorkRadiusExplanation(expertRange)
                                                : null}
                                        </span>
                                    </p>
                                ) : null}

                                {(displayMainDescription || visibleDeliverableTypes.length > 0 || showInspectionReport) && (
                                    <div className="mt-5 flex flex-col gap-5">
                                        {displayMainDescription ? (
                                            <section className="min-w-0 overflow-hidden">
                                                <h2 className="hp-section-title mb-2">Acerca del servicio</h2>
                                                <div className="sd-body sd-user-text space-y-3">
                                                    {displayMainDescription
                                                        .split(/\n\s*\n/)
                                                        .map((paragraph) => paragraph.trim())
                                                        .filter(Boolean)
                                                        .map((paragraph, index) => (
                                                            <p key={index} className="m-0 whitespace-pre-line">
                                                                {paragraph}
                                                            </p>
                                                        ))}
                                                </div>
                                            </section>
                                        ) : null}
                                        {visibleDeliverableTypes.length > 0 ? (
                                            <section
                                                className={
                                                    displayMainDescription
                                                        ? 'border-t border-[#ebebeb] pt-5'
                                                        : undefined
                                                }
                                            >
                                                <ServiceDetailDeliverablesGuide
                                                    items={finalDeliverableTypes}
                                                    variant="inline"
                                                    presentation="list"
                                                    showHeading
                                                />
                                            </section>
                                        ) : null}
                                        {showInspectionReport ? (
                                            <section className={visibleDeliverableTypes.length > 0 || displayMainDescription ? 'border-t border-[#ebebeb] pt-5' : undefined}>
                                                <InspectionReportPreview config={inspectionConfig} pdfUrl={inspectionPdfUrl} />
                                            </section>
                                        ) : null}
                                    </div>
                                )}

                                <EscrowTrustLine className="mt-5 border-t border-[#ebebeb] pt-4" />
                            </article>
                        </div>

                        <aside
                            className={`min-w-0 lg:col-start-2 lg:sticky lg:self-start ${SD_DESKTOP_STICKY_TOP_CLASS}`}
                        >
                            {(() => {
                                const desktopPriceInfo = getServicePriceInfo(finalPrice);
                                return (
                                    <ServiceDetailDesktopBookingAside
                                        expertName={finalExpertName}
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
                                        highlightReview={
                                            finalReviews.length > 0
                                                ? pickPreviewReviews(finalReviews, 1)[0] ?? null
                                                : null
                                        }
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
                                            style={{
                                                fontSize: '10px',
                                                lineHeight: '12px',
                                                fontWeight: 400,
                                                color: '#222222',
                                                fontFamily: HP_FONT,
                                                letterSpacing: '0',
                                            }}
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
                                                        backgroundColor: imgIdx === currentIndex ? '#222222' : 'rgba(34, 34, 34, 0.4)',
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

