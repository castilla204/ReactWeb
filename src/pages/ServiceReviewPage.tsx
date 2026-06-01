import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
    Star, 
    MapPin, 
    CheckCircle, 
    ArrowLeft, 
    ChevronLeft, 
    ChevronRight, 
    X,
    User,
    Clock,
    Shield,
    Share2,
    Heart,
    Headphones,
    MessageCircle,
    Award,
    Zap,
    Grid3X3,
    Lock,
    BadgeCheck,
    FileText,
    Video,
    Image,
    File,
    Calendar,
    Globe
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { EnhancedReviewsList } from '../components/EnhancedReviewCard';
import { useServices, Service } from '../hooks/useServices';
import { useServiceTypes } from '../hooks/useServiceTypes';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { showToast } from '../lib/toast';
import { authService } from '../services/authService';
import { formatPriceNumber } from '../utils/priceUtils';
import { formatTimezoneFriendly } from '../utils/timezoneFormat';
import { ServiceDetailBookingMeta } from '../components/serviceDetail/ServiceDetailBookingMeta';
import { MobileReserveFooter } from '../components/serviceDetail/MobileReserveFooter';
import { useCurrency } from '../contexts/CurrencyContext';
import { PreHireChat } from '../components/PreHireChat';
import {
  SD_MOBILE_CAROUSEL_EDGE_CLASS,
  SD_MOBILE_FLOATING_TOP_CLASS,
  SD_MOBILE_FOOTER_CTA_CLASS,
  SD_MOBILE_GUTTER_CLASS,
  SD_MOBILE_SCROLL_PAD_CLASS,
  SD_PAGE_GRID_CLASS,
  SD_PAGE_INNER_MAX_CLASS,
} from '../constants/homepageTypography';
import { ServiceDetailDesktopGallery } from '../components/serviceDetail/ServiceDetailDesktopGallery';
import {
    ServiceDetailDeliverablesGuide,
    normalizeDeliverableTypes,
} from '../components/serviceDetail/ServiceDetailDeliverablesGuide';
import { ServiceDetailReviewsModal } from '../components/serviceDetail/ServiceDetailReviewsModal';
import { ServiceDetailReviewsPreview } from '../components/serviceDetail/ServiceDetailReviewsPreview';
import { getCountryName } from '../utils/countries';
import { stripServiceDescriptionLocationSuffix } from '../utils/stripServiceDescriptionLocationSuffix';
import { HomepageDesktopTopBar } from '../components/HomepageDesktopTopBar';
import { LoginModal } from '../components/LoginModal';

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

    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [mobileImageIndex, setMobileImageIndex] = useState(0);
    const touchStartX = useRef<number | null>(null);
    const touchEndX = useRef<number | null>(null);
    const [isFavorite, setIsFavorite] = useState(false);
    const [isExpertPhotoOpen, setIsExpertPhotoOpen] = useState(false);
    const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
    const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());
    const [showPreHireChat, setShowPreHireChat] = useState(false);
    const [showLoginDialog, setShowLoginDialog] = useState(false);
    const carouselRef = useRef<HTMLDivElement>(null);
    const { serviceTypes } = useServiceTypes();
    
    // Obtener token y userId para el chat
    const token = authService.getAccessToken() || '';
    const user = useAuth().user;
    const userId = user?.id || user?.Id || 0;
    
    // Handler para abrir chat o login
    const handleChatClick = () => {
        if (isAuthenticated && token && userId > 0) {
            navigate(`/chat-pre-contratacion/${serviceId}`);
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
        setShowLoginDialog(true);
    }, [getCheckoutPath]);

    useEffect(() => {
        if (!isAuthenticated) return;

        if (sessionStorage.getItem('loginFromChat') === 'true') {
            sessionStorage.removeItem('loginFromChat');
            if (serviceId) {
                const t = window.setTimeout(() => {
                    navigate(`/chat-pre-contratacion/${serviceId}`, { replace: true });
                }, 100);
                return () => clearTimeout(t);
            }
            return;
        }

        const redirectPath = sessionStorage.getItem('redirectAfterLogin');
        if (redirectPath) {
            sessionStorage.removeItem('redirectAfterLogin');
            const t = window.setTimeout(() => {
                navigate(redirectPath, { replace: true });
            }, 100);
            return () => clearTimeout(t);
        }
    }, [isAuthenticated, navigate, serviceId]);

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
    
    console.log('🔍 ServiceReviewPage - Servicio final:', {
        serviceId,
        hasServiceProp: !!serviceProp,
        hasServiceFromHook: !!services.find(s => s.id === serviceId),
        finalService: finalService ? {
            id: finalService.id,
            hasExpert: !!finalService.expert,
            reviewsCount: finalService.expert?.reviews?.length || 0,
            reviews: finalService.expert?.reviews,
        } : null,
    });
    
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
    
    console.log('🖼️ ServiceReviewPage - Imágenes finales:', {
      serviceId,
      finalServiceImageUrls: finalService?.imageUrls,
      serviceImageUrls,
      finalImages,
      finalImagesLength: finalImages.length,
      validImagesLength: validImages.length,
      failedImagesCount: failedImages.size,
    });
    
    // Handlers para manejo de imágenes
    const handleImageError = (imgUrl: string) => {
        console.error('❌ Error cargando imagen:', imgUrl);
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
    
    const expertRange = finalService?.expert?.locationRange 
        || (finalService as any)?.locationRange 
        || (finalService as any)?.LocationRange
        || locationRange 
        || null;
    const expertCountry = finalService?.expert?.country || null;

    const expertLocationLabel = (() => {
        const countryName = expertCountry ? getCountryName(expertCountry) : '';
        const parts: string[] = [];
        if (expertCity) parts.push(expertCity);
        if (countryName) parts.push(countryName);
        return parts.length > 0 ? parts.join(', ') : countryName || '';
    })();

    // ✅ DEBUG: Log para verificar datos de ubicación
    console.log('🗺️ ServiceReviewPage - Datos de ubicación del experto:', {
        hasFinalService: !!finalService,
        expertLat,
        expertLng,
        expertLocation,
        expertRange,
        expertCountry,
        finalServiceKeys: finalService ? Object.keys(finalService) : [],
        expertKeys: finalService?.expert ? Object.keys(finalService.expert) : [],
    });
    
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
    
    // Estado para el tab activo en móvil
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
    console.log('🔍 ServiceReviewPage - Reviews raw:', {
        rawReviewsCount: rawReviews.length,
        rawReviews: rawReviews,
        firstReview: rawReviews[0],
    });
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
    console.log('🔍 ServiceReviewPage - Reviews finales:', {
        finalReviewsCount: finalReviews.length,
        finalReviews: finalReviews,
    });
    const finalCompletedSearches = finalService?.completedSearches || 0;
    
    const finalDeliverableTypes = finalService?.selectedDeliverableTypes ?? [];
    const visibleDeliverableTypes = normalizeDeliverableTypes(finalDeliverableTypes);

    const serviceTypeName = serviceTypes.find(st => st.id === (finalService?.serviceTypeId || serviceTypeId))?.name || 'Servicio';

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
                <span className="ml-1 text-xs text-gray-500">({info.sourceFormatted})</span>
            </>
        );
    };

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

        navigate(checkoutPath, { replace: false });
    };

    const handleImageClick = (index: number) => {
        setLightboxIndex(index);
        setIsLightboxOpen(true);
    };

    const handleLightboxNavigation = (direction: 'prev' | 'next') => {
        if (direction === 'prev') {
            setLightboxIndex(prev => (prev === 0 ? validImages.length - 1 : prev - 1));
        } else {
            setLightboxIndex(prev => (prev === validImages.length - 1 ? 0 : prev + 1));
        }
    };

    // Handlers para swipe
    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        touchEndX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
        if (!touchStartX.current || !touchEndX.current) return;
        
        const distance = touchStartX.current - touchEndX.current;
        const minSwipeDistance = 50;

        if (Math.abs(distance) > minSwipeDistance) {
            if (distance > 0) {
                // Swipe izquierda - siguiente
                handleLightboxNavigation('next');
            } else {
                // Swipe derecha - anterior
                handleLightboxNavigation('prev');
            }
        }

        touchStartX.current = null;
        touchEndX.current = null;
    };

    useEffect(() => {
        if (!isLightboxOpen || validImages.length <= 1) return;

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                handleLightboxNavigation('prev');
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                handleLightboxNavigation('next');
            }
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isLightboxOpen, validImages.length]);

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

    // Navegación del carrusel móvil mejorada
    const handleMobileCarouselScroll = useCallback(() => {
        if (carouselRef.current) {
            const scrollLeft = carouselRef.current.scrollLeft;
            const width = carouselRef.current.offsetWidth;
            const newIndex = Math.round(scrollLeft / width);
            if (newIndex >= 0 && newIndex < validImages.length) {
                setMobileImageIndex(prevIndex => {
                    if (prevIndex !== newIndex) {
                        return newIndex;
                    }
                    return prevIndex;
                });
            }
        }
    }, [validImages.length]);

    const scrollMobileCarouselTo = useCallback((index: number) => {
        const carousel = carouselRef.current;
        if (!carousel || index < 0 || index >= validImages.length) return;
        carousel.scrollTo({ left: index * carousel.offsetWidth, behavior: 'smooth' });
        setMobileImageIndex(index);
    }, [validImages.length]);

    // Inicializar listener del carrusel móvil
    useEffect(() => {
        const carousel = carouselRef.current;
        if (carousel) {
            carousel.addEventListener('scroll', handleMobileCarouselScroll);
            return () => {
                carousel.removeEventListener('scroll', handleMobileCarouselScroll);
            };
        }
    }, [handleMobileCarouselScroll]);

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
        <style>{`
            .loading-dot {
                display: inline-block;
                animation: wave 1.4s ease-in-out infinite;
                font-size: 1.2em;
                line-height: 1;
            }
            @keyframes wave {
                0%, 60%, 100% {
                    transform: translateY(0);
                    opacity: 0.7;
                }
                30% {
                    transform: translateY(-10px);
                    opacity: 1;
                }
            }
        `}</style>
        <div className="service-detail-page min-h-screen bg-[#fafafa]">
                
            {/* ========== VERSIÓN MÓVIL MEJORADA ========== */}
            <div className="lg:hidden">
                {/* Botones flotantes móvil con fondo blanco redondo */}
                <div className={`fixed left-4 z-50 ${SD_MOBILE_FLOATING_TOP_CLASS}`}>
                    <button 
                        onClick={onBack}
                        className="sd-icon-btn"
                        aria-label="Volver"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                </div>
                <div className={`fixed right-4 z-50 flex gap-2 ${SD_MOBILE_FLOATING_TOP_CLASS}`}>
                    <button 
                        type="button"
                        className="sd-icon-btn"
                        aria-label="Compartir"
                        disabled
                        aria-disabled="true"
                    >
                        <Share2 className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={() => setIsFavorite(!isFavorite)}
                        className="sd-icon-btn"
                        aria-label={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                        aria-pressed={isFavorite}
                    >
                        <Heart className={`w-5 h-5 ${isFavorite ? 'fill-[#0066CC] text-[#0066CC]' : ''}`} />
                    </button>
                </div>
                {/* Hero móvil: chips anclados al borde inferior de la foto */}
                <div className="relative w-full">
                    <div className="relative w-full overflow-hidden">
                    {/* Carrusel de imágenes con indicadores */}
                    <div 
                        ref={carouselRef}
                        className="relative w-full overflow-x-auto snap-x snap-mandatory scrollbar-hide"
                        onScroll={handleMobileCarouselScroll}
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        <div className="flex">
                            {validImages.length > 0 ? validImages.map((img, idx) => (
                                <button
                                    type="button"
                                    key={idx}
                                    className="relative block w-full flex-shrink-0 aspect-[4/3] border-0 bg-gradient-to-br from-gray-100 to-gray-200 p-0 snap-start overflow-hidden cursor-pointer text-left active:scale-[0.98] transition-transform duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0066CC]"
                                    onClick={() => handleImageClick(idx)}
                                    aria-label={`Abrir imagen ${idx + 1} de ${validImages.length}`}
                                >
                                    {loadingImages.has(img) && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                                            <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                                        </div>
                                    )}
                                    <img 
                                        src={img} 
                                        alt={`Imagen ${idx + 1} del servicio`} 
                                        className={`w-full h-full object-cover transition-opacity duration-300 ${
                                            loadingImages.has(img) ? 'opacity-0' : 'opacity-100'
                                        }`}
                                        onError={() => handleImageError(img)}
                                        onLoad={() => handleImageLoad(img)}
                                        onLoadStart={() => handleImageLoadStart(img)}
                                        loading="lazy"
                                    />
                                    {failedImages.has(img) && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                                            <div className="text-center px-4">
                                                <Image className="w-12 h-12 text-gray-400 mx-auto mb-2" strokeWidth={1.5} />
                                                <p className="text-xs text-gray-500 font-medium">Imagen no disponible</p>
                                            </div>
                                        </div>
                                    )}
                                </button>
                            )) : (
                                <div className="w-full aspect-[4/3] bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 flex items-center justify-center">
                                    <div className={`text-center ${SD_MOBILE_GUTTER_CLASS}`}>
                                        <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                                            <Image className="w-10 h-10 text-gray-400" strokeWidth={1.5} />
                                        </div>
                                        <p className="text-base font-medium text-gray-700 mb-1">Sin imágenes disponibles</p>
                                        <p className="text-sm text-gray-500">Este servicio aún no tiene fotos</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {validImages.length > 1 && (
                        <div
                            className="sd-gallery-dots"
                            role="tablist"
                            aria-label="Fotos del servicio"
                        >
                            {validImages.map((_, dotIndex) => (
                                <button
                                    key={dotIndex}
                                    type="button"
                                    role="tab"
                                    aria-selected={dotIndex === mobileImageIndex}
                                    aria-label={`Foto ${dotIndex + 1} de ${validImages.length}`}
                                    className={`sd-gallery-dot${dotIndex === mobileImageIndex ? ' is-active' : ''}`}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        scrollMobileCarouselTo(dotIndex);
                                    }}
                                />
                            ))}
                        </div>
                    )}

                    {validImages.length > 0 && visibleDeliverableTypes.length > 0 && (
                        <ServiceDetailDeliverablesGuide
                            items={finalDeliverableTypes}
                            variant="overlay"
                            className="sd-deliverable-guide-on-image"
                        />
                    )}
                    </div>

                    <div
                        className={`relative -mt-10 z-10 bg-white rounded-t-2xl pt-6 ${SD_MOBILE_SCROLL_PAD_CLASS} shadow-[0_-2px_14px_rgba(15,23,42,0.07)] ring-1 ring-black/[0.04]`}
                    >
                        <div className={`${SD_MOBILE_GUTTER_CLASS} mb-3 text-center`}>
                            <h1
                                className="sd-page-title relative z-10 mb-3 text-[22px] leading-[26px] md:text-[22px]"
                            >
                                {serviceTypeName} por{' '}
                                <span className="underline decoration-[#d1d5db] underline-offset-[3px]">
                                    {finalExpertName}
                                </span>
                            </h1>
                        </div>

                            {validImages.length === 0 && visibleDeliverableTypes.length > 0 && (
                                <ServiceDetailDeliverablesGuide
                                    items={finalDeliverableTypes}
                                    variant="inline"
                                    className={`mb-3 ${SD_MOBILE_GUTTER_CLASS}`}
                                />
                            )}

                            {(finalAvailability || expertLocation) && (
                                <ServiceDetailBookingMeta
                                    layout="minimal"
                                    availability={finalAvailability ?? undefined}
                                    timezone={finalService?.expert?.timezone}
                                    isOnVacation={finalService?.expert?.isOnVacation}
                                    location={expertLocation ?? undefined}
                                    locationLabel={expertLocationLabel || undefined}
                                    rangeKm={expertRange || 25}
                                    coverageFirst
                                    mapVariant="preview"
                                    mapClassName="h-[100px] w-full rounded-none border-x-0 border-y border-[#ebebeb]"
                                    showAvailabilityHint={false}
                                    className="mb-1"
                                />
                            )}

                    
                    <div className="my-3 border-t border-[#e8e8e8]" />

                    <div className={`${SD_MOBILE_GUTTER_CLASS} my-3`}>
                        <div className="flex items-start gap-4">
                            <div className="relative flex-shrink-0" style={{ height: '40px', width: '40px' }}>
                                <button
                                    type="button"
                                    aria-label={`${finalExpertName} es revisor verificado de inspecciono.com. Obtén más información sobre ${finalExpertName}.`}
                                    className="relative w-full h-full border-none bg-transparent p-0 cursor-pointer"
                                    onClick={() => {
                                        if (finalExpertPicture) {
                                            setIsExpertPhotoOpen(true);
                                        }
                                    }}
                                >
                                    <Avatar className="w-10 h-10 flex-shrink-0 border-0" style={{ height: '40px', width: '40px', borderRadius: '50%' }}>
                                <AvatarImage src={finalExpertPicture} alt={finalExpertName} />
                                <AvatarFallback className="bg-gray-900 text-white font-bold text-sm">
                                    {finalExpertName.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                                    {/* Badge de Superanfitrión */}
                                    <div className="absolute -bottom-0.5 -right-0.5" style={{ height: '20px', width: '20px' }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 14" aria-hidden="true" role="presentation" focusable="false" style={{ display: 'block', height: '20px', width: '20px' }}>
                                            <linearGradient id="superhost-gradient-mobile" x1="8.5%" x2="92.18%" y1="17.16%" y2="17.16%">
                                                <stop offset="0" stopColor="#0066CC"></stop>
                                                <stop offset=".5" stopColor="#005bb5"></stop>
                                                <stop offset="1" stopColor="#004a99"></stop>
                                            </linearGradient>
                                            <path fill="url(#superhost-gradient-mobile)" d="M9.93 0c.88 0 1.6.67 1.66 1.52l.01.15v2.15c0 .54-.26 1.05-.7 1.36l-.13.08-3.73 2.17a3.4 3.4 0 1 1-2.48 0L.83 5.26A1.67 1.67 0 0 1 0 3.96L0 3.82V1.67C0 .79.67.07 1.52 0L1.67 0z"></path>
                                            <path fill="url(#superhost-gradient-mobile)" d="M5.8 8.2a2.4 2.4 0 0 0-.16 4.8h.32a2.4 2.4 0 0 0-.16-4.8zM9.93 1H1.67a.67.67 0 0 0-.66.57l-.01.1v2.15c0 .2.1.39.25.52l.08.05L5.46 6.8c.1.06.2.09.29.1h.1l.1-.02.1-.03.09-.05 4.13-2.4c.17-.1.3-.29.32-.48l.01-.1V1.67a.67.67 0 0 0-.57-.66z"></path>
                                        </svg>
                                    </div>
                                </button>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div 
                                    style={{
                                        fontSize: '14px',
                                        lineHeight: '20px',
                                        fontWeight: 400,
                                        color: 'rgb(34, 34, 34)',
                                        fontFamily: 'Manrope, "SF Pro Display", system-ui, -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif',
                                    }}
                                >
                                    <div style={{ fontSize: '14px', lineHeight: '20px', fontWeight: 400, color: 'rgb(34, 34, 34)', fontFamily: 'Manrope, "SF Pro Display", system-ui, -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif' }}>
                                        Revisor: {finalExpertName}
                                        </div>
                                    <div className="mt-1 hidden md:block" style={{ fontSize: '14px', lineHeight: '20px', fontWeight: 400, color: 'rgb(113, 113, 113)', fontFamily: 'Manrope, "SF Pro Display", system-ui, -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif' }}>
                                        Revisor verificado de inspecciono.com
                                    </div>
                                    <div className="mt-1 md:hidden" style={{ fontSize: '14px', lineHeight: '20px', fontWeight: 400, color: 'rgb(113, 113, 113)', fontFamily: 'Manrope, "SF Pro Display", system-ui, -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif' }}>
                                        Revisor verificado
                                    </div>
                                </div>
                            </div>
                            {/* Botón de Chat - Siempre visible */}
                            <div className="flex-shrink-0">
                                <Button
                                    onClick={handleChatClick}
                                    variant="outline"
                                    className="flex items-center gap-2 rounded-full border-gray-300 hover:border-gray-400"
                                >
                                    <MessageCircle className="w-4 h-4" />
                                    <span>Chat</span>
                                </Button>
                            </div>
                        </div>
                    </div>
                    
                    <div className="my-3 border-t border-[#e8e8e8]" />

                        <div className={`mb-6 ${SD_MOBILE_GUTTER_CLASS}`}>
                            <div
                                className="-mx-4 flex border-b border-[#e8e8e8] px-4"
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
                                        <span
                                            className={`ml-1.5 tabular-nums font-normal ${
                                                activeTab === 'reviews' ? 'text-[#6a6a6a]' : 'text-[#737373]'
                                            }`}
                                        >
                                            ({finalReviews.length})
                                        </span>
                                    ) : null}
                                </button>
                            </div>

                            {activeTab === 'about' && (
                                <div
                                    id="sd-panel-about"
                                    role="tabpanel"
                                    aria-labelledby="sd-tab-about"
                                    className="pt-6"
                                >
                                    {displayMainDescription ? (
                                        <p className="whitespace-pre-line text-sm font-normal leading-relaxed text-[#6a6a6a]">
                                            {displayMainDescription}
                                        </p>
                                    ) : null}
                                </div>
                            )}

                            {activeTab === 'reviews' && (
                                <div
                                    id="sd-panel-reviews"
                                    role="tabpanel"
                                    aria-labelledby="sd-tab-reviews"
                                    className="pt-4"
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

            {/* ========== DESKTOP — topbar homepage + grid (galería columna izquierda) ========== */}
            <div className="service-detail-desktop hidden lg:block min-h-screen bg-[#fafafa]">
                <HomepageDesktopTopBar onBack={onBack} />

                <div className={`${SD_PAGE_INNER_MAX_CLASS} pb-12 pt-6 lg:pt-8`}>
                    <div className={`${SD_PAGE_GRID_CLASS}`}>
                        <div className="min-w-0 space-y-5 lg:space-y-6">
                            <div className="relative">
                                <ServiceDetailDesktopGallery
                                    images={validImages}
                                    onOpen={handleImageClick}
                                    loadingImages={loadingImages}
                                    failedImages={failedImages}
                                    onImageError={handleImageError}
                                    onImageLoad={handleImageLoad}
                                    onImageLoadStart={handleImageLoadStart}
                                />
                                {validImages.length > 0 && visibleDeliverableTypes.length > 0 && (
                                    <ServiceDetailDeliverablesGuide
                                        items={finalDeliverableTypes}
                                        variant="overlay"
                                    />
                                )}
                            </div>

                            {validImages.length === 0 && visibleDeliverableTypes.length > 0 && (
                                <ServiceDetailDeliverablesGuide
                                    items={finalDeliverableTypes}
                                    variant="inline"
                                />
                            )}

                            {/* Experto */}
                            <div className="flex items-center gap-4 border-b border-[#e8e8e8] pb-5">
                                <button
                                    type="button"
                                    className="shrink-0"
                                    onClick={() => finalExpertPicture && setIsExpertPhotoOpen(true)}
                                    aria-label={`Ver foto de ${finalExpertName}`}
                                >
                                    <Avatar className="h-12 w-12 rounded-md">
                                        <AvatarImage src={finalExpertPicture} alt={finalExpertName} />
                                        <AvatarFallback className="rounded-md bg-[#1c1c1c] text-white text-sm">
                                            {finalExpertName.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                </button>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-[#1c1c1c]">{finalExpertName}</p>
                                    <p className="text-xs text-[#6a6a6a]">Revisor verificado · Inspecciono</p>
                                </div>
                                <button type="button" onClick={handleChatClick} className="sd-btn-secondary shrink-0">
                                    <MessageCircle className="h-4 w-4" />
                                    Chat
                                </button>
                            </div>

                            {finalCompletedSearches > 0 && (
                                <p className="text-sm text-[#0066CC] font-medium">
                                    {finalCompletedSearches} trabajos completados
                                </p>
                            )}

                            {displayMainDescription && (
                                <section>
                                    <h2 className="hp-section-title mb-2">Acerca del servicio</h2>
                                    <p className="text-sm leading-relaxed text-[#6a6a6a] whitespace-pre-line">
                                        {displayMainDescription}
                                    </p>
                                </section>
                            )}

                            <ServiceDetailReviewsPreview
                              variant="desktop"
                              reviews={finalReviews}
                              averageRating={finalRating}
                              onShowAll={() => setReviewsModalOpen(true)}
                            />
                        </div>

                        <aside className="lg:sticky lg:top-12 lg:self-start">
                            <article className="sd-aside-card flex max-h-[calc(100dvh-3rem)] flex-col overflow-y-auto">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <h1 className="font-display text-lg font-semibold leading-tight tracking-[-0.02em] text-[#1c1c1c]">
                                            {serviceTypeName}
                                        </h1>
                                        <p className="mt-1 text-xs text-[#6a6a6a]">
                                            {finalExpertName}
                                            {(expertCity || expertCountry) && (
                                                <>
                                                    {' · '}
                                                    {[expertCity, expertCountry ? getCountryName(expertCountry) : '']
                                                        .filter(Boolean)
                                                        .join(', ')}
                                                </>
                                            )}
                                        </p>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-1">
                                        <button
                                            type="button"
                                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#e5e7eb] bg-white text-[#444] transition-colors hover:bg-[#f9fafb]"
                                            aria-label="Compartir"
                                        >
                                            <Share2 className="h-4 w-4" />
                                        </button>
                                        <button
                                            type="button"
                                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#e5e7eb] bg-white text-[#444] transition-colors hover:bg-[#f9fafb]"
                                            aria-label="Favorito"
                                            onClick={() => setIsFavorite(!isFavorite)}
                                        >
                                            <Heart
                                                className={`h-4 w-4 ${isFavorite ? 'fill-[#0066CC] text-[#0066CC]' : ''}`}
                                            />
                                        </button>
                                    </div>
                                </div>
                                <section className="mt-4 shrink-0 border-t border-[#e8e8e8] pt-4">
                                    <p className="text-2xl font-semibold tracking-tight text-[#1c1c1c]">
                                        {renderServicePrice(finalPrice)}
                                    </p>
                                    <p className="text-sm text-[#6a6a6a]">por servicio</p>
                                    {finalRating > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => setReviewsModalOpen(true)}
                                            className="mt-1.5 flex w-fit items-center gap-1 text-left text-sm text-[#6a6a6a] transition-colors hover:text-[#1c1c1c]"
                                        >
                                            <Star className="h-3 w-3 fill-[#1c1c1c] text-[#1c1c1c]" aria-hidden />
                                            <span className="font-semibold tabular-nums text-[#1c1c1c]">
                                                {finalRating.toFixed(1).replace('.', ',')}
                                            </span>
                                            <span className="text-[#d4d4d4]" aria-hidden>
                                                ·
                                            </span>
                                            <span className="underline-offset-2 hover:underline">
                                                {finalReviews.length} reseña
                                                {finalReviews.length !== 1 ? 's' : ''}
                                            </span>
                                        </button>
                                    )}
                                </section>

                                {(finalAvailability || expertLocation) && (
                                    <section className="mt-4 w-full min-h-0 flex-1">
                                        <ServiceDetailBookingMeta
                                            layout="card"
                                            availability={finalAvailability ?? undefined}
                                            timezone={finalService?.expert?.timezone}
                                            isOnVacation={finalService?.expert?.isOnVacation}
                                            location={expertLocation ?? undefined}
                                            locationLabel={expertLocationLabel || undefined}
                                            rangeKm={expertRange || 25}
                                            mapVariant="preview"
                                        />
                                    </section>
                                )}

                                <footer className="mt-4 shrink-0 space-y-2 border-t border-[#e8e8e8] pt-4">
                                {isAuthenticated ? (
                                    <button
                                        type="button"
                                        onClick={handleReserveClick}
                                        className="sd-btn-primary w-full min-w-0"
                                    >
                                        Reservar
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={openLoginForCheckout}
                                        className="sd-btn-primary w-full min-w-0"
                                    >
                                        Inicia sesión para reservar
                                    </button>
                                )}
                                <p className="text-xs leading-relaxed text-[#6a6a6a]">
                                    Sin cargo hasta confirmar la reserva con el experto.
                                </p>
                                </footer>
                            </article>
                        </aside>
                    </div>
                </div>
            </div>

            {/* Lightbox */}
            <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
                <DialogContent 
                    className="max-w-full w-full h-full p-0 bg-transparent border-none animate-in fade-in-0 zoom-in-95 duration-200"
                    overlayClassName="bg-black/80"
                    hideCloseButton={true}
                    onPointerDownOutside={(e) => {
                        // Permitir cerrar al hacer clic fuera
                        setIsLightboxOpen(false);
                    }}
                    onEscapeKeyDown={() => setIsLightboxOpen(false)}
                >
                    <DialogTitle className="sr-only">Foto {lightboxIndex + 1} de {validImages.length} del servicio</DialogTitle>
                    <DialogDescription className="sr-only">Imagen ampliada del servicio</DialogDescription>
                    <button
                        type="button"
                        onClick={() => setIsLightboxOpen(false)}
                        className="absolute top-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white shadow-lg transition-colors hover:bg-gray-100"
                        aria-label="Cerrar galería"
                    >
                        <X className="h-5 w-5 text-gray-700" />
                    </button>
                    {validImages.length > 1 && (
                        <>
                            <button
                                type="button"
                                onClick={() => handleLightboxNavigation('prev')}
                                className="absolute left-4 top-1/2 z-50 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-gray-100 bg-white/90 shadow-lg backdrop-blur-sm"
                                aria-label="Imagen anterior"
                            >
                                <ChevronLeft className="h-6 w-6 text-gray-800" strokeWidth={2.5} />
                            </button>
                            <button
                                type="button"
                                onClick={() => handleLightboxNavigation('next')}
                                className="absolute right-4 top-1/2 z-50 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-gray-100 bg-white/90 shadow-lg backdrop-blur-sm"
                                aria-label="Imagen siguiente"
                            >
                                <ChevronRight className="h-6 w-6 text-gray-800" strokeWidth={2.5} />
                            </button>
                        </>
                    )}
                    <div 
                        className="relative w-full h-full flex items-center justify-center pointer-events-auto"
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        onClick={(e) => {
                            // Cerrar si se hace clic fuera de la imagen
                            if (e.target === e.currentTarget) {
                                setIsLightboxOpen(false);
                            }
                        }}
                    >
                        <div 
                            className="w-full h-full flex items-center justify-center"
                        >
                            {validImages[lightboxIndex] ? (
                                <>
                                    {loadingImages.has(validImages[lightboxIndex]) && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-10 pointer-events-none">
                                            <div className="w-12 h-12 border-3 border-white/50 border-t-white rounded-full animate-spin"></div>
                                        </div>
                                    )}
                                    <img
                                        key={lightboxIndex}
                                        src={validImages[lightboxIndex]}
                                        alt={`Foto ${lightboxIndex + 1} del servicio`}
                                        className={`w-full h-full object-contain transition-all duration-300 ease-in-out ${
                                            loadingImages.has(validImages[lightboxIndex]) ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                                        }`}
                                        onError={() => handleImageError(validImages[lightboxIndex])}
                                        onLoad={() => handleImageLoad(validImages[lightboxIndex])}
                                        onLoadStart={() => handleImageLoadStart(validImages[lightboxIndex])}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    {failedImages.has(validImages[lightboxIndex]) && (
                                        <div className="text-center text-white">
                                            <Image className="w-16 h-16 mx-auto mb-3 opacity-75" strokeWidth={1.5} />
                                            <p className="text-sm">Imagen no disponible</p>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center text-white">
                                    <Image className="w-16 h-16 mx-auto mb-3 opacity-75" strokeWidth={1.5} />
                                    <p className="text-sm">No hay imágenes disponibles</p>
                                </div>
                            )}
                        </div>

                        {validImages.length > 1 && (
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
                                        fontFamily: '-apple-system, BlinkMacSystemFont, "Circular", "Helvetica Neue", Helvetica, Arial, sans-serif',
                                        letterSpacing: '0',
                                    }}
                                >
                                {lightboxIndex + 1} / {validImages.length}
                                </span>
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '3px',
                                    }}
                                >
                                    {validImages.map((_, idx) => (
                                        <div
                                            key={idx}
                                            className="rounded-full transition-all"
                                            style={{
                                                height: '3px',
                                                width: idx === lightboxIndex ? '12px' : '3px',
                                                backgroundColor: idx === lightboxIndex ? '#222222' : 'rgba(34, 34, 34, 0.4)',
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

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
                                                fontFamily: '-apple-system, BlinkMacSystemFont, "Circular", "Helvetica Neue", Helvetica, Arial, sans-serif',
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

