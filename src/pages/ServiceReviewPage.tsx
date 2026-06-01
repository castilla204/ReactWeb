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
    Calendar
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
import { getCountryName } from '../utils/countries';
import { formatPriceNumber } from '../utils/priceUtils';
import { ServiceDetailBookingMeta } from '../components/serviceDetail/ServiceDetailBookingMeta';
import { useCurrency } from '../contexts/CurrencyContext';
import { PreHireChat } from '../components/PreHireChat';
import {
  SD_MOBILE_CAROUSEL_EDGE_CLASS,
  SD_MOBILE_FOOTER_INNER_CLASS,
  SD_MOBILE_GUTTER_CLASS,
  SD_MOBILE_SCROLL_PAD_CLASS,
  SD_PAGE_GRID_CLASS,
  SD_PAGE_INNER_MAX_CLASS,
} from '../constants/homepageTypography';
import { ServiceDetailDesktopGallery } from '../components/serviceDetail/ServiceDetailDesktopGallery';
import { ServiceDetailReviewsSection } from '../components/serviceDetail/ServiceDetailReviewsSection';
import { ServiceDetailHowItWorks } from '../components/serviceDetail/ServiceDetailHowItWorks';
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
    const { isAuthenticated, updateUser } = useAuth();
    const navigate = useNavigate();
    
    // Redirigir a checkout después del login si hay una ruta guardada
    useEffect(() => {
        if (isAuthenticated) {
            const redirectPath = sessionStorage.getItem('redirectAfterLogin');
            if (redirectPath) {
                console.log('🔵 Usuario autenticado, redirigiendo a:', redirectPath);
                sessionStorage.removeItem('redirectAfterLogin');
                // Usar setTimeout para asegurar que la navegación se complete
                setTimeout(() => {
                    navigate(redirectPath, { replace: true });
                }, 100);
            }
        }
    }, [isAuthenticated, navigate]);
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
            // Usuario autenticado: navegar a la página de chat
            navigate(`/chat-pre-contratacion/${serviceId}`);
        } else {
            // Usuario no autenticado: abrir login
            sessionStorage.setItem('loginFromChat', 'true');
            setShowLoginDialog(true);
        }
    };

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
    
    // ✅ PRIORIDAD DE DESCRIPCIONES (Sin texto genérico inventado)
    // 1. serviceTypeDescription (Descripción oficial del tipo de servicio)
    // 2. conditions (Descripción del usuario, si la oficial falla)
    // 3. serviceDescription (Prop de fallback)
    // Manejar tanto PascalCase como camelCase por si la transformación falla
    const finalServiceTypeDescription = finalService?.serviceTypeDescription || (finalService as any)?.ServiceTypeDescription;
    const finalUserConditions = finalService?.conditions || (finalService as any)?.Conditions || serviceDescription;
    
    // Si no hay descripción oficial, usamos la del usuario como principal
    const displayMainDescription = finalServiceTypeDescription || finalUserConditions || '';
    
    // Si usamos la del usuario como principal, no la repetimos abajo
    const showSecondaryDescription = !!finalServiceTypeDescription && !!finalUserConditions;

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
    
    // Estado para "Leer más" en descripción
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const shouldTruncateDescription = (displayMainDescription || '').length > 150;

    // Estado para "Leer más" en detalles del experto
    const [isUserConditionsExpanded, setIsUserConditionsExpanded] = useState(false);
    
    // Estado para el tab activo en móvil
    const [activeTab, setActiveTab] = useState<'about' | 'how'>('about');
    const shouldTruncateUserConditions = (finalUserConditions || '').length > 250; // Aprox 6 líneas

    // Estado para "Mostrar más" en reviews
    const [expandedReviews, setExpandedReviews] = useState<Record<number, boolean>>({});
    // Estado para mostrar/ocultar imágenes de las reseñas
    const [reviewLightboxOpen, setReviewLightboxOpen] = useState<Record<number, boolean>>({});
    const [reviewLightboxIndex, setReviewLightboxIndex] = useState<Record<number, number>>({});
    
    // Refs para scroll horizontal de reseñas
    const reviewsScrollRefMobile = useRef<HTMLDivElement>(null);
    const reviewsScrollRefDesktop = useRef<HTMLDivElement>(null);
    
    // Funciones para navegar el scroll
    const scrollReviews = (direction: 'left' | 'right', isMobile: boolean = false) => {
        const scrollRef = isMobile ? reviewsScrollRefMobile : reviewsScrollRefDesktop;
        if (scrollRef.current) {
            const scrollAmount = 400; // Cantidad de scroll en píxeles
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

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
    
    // ✅ FALLBACK VISUAL PARA ENTREGABLES (Si no hay, mostramos los estándar para que se vea el diseño)
    const defaultDeliverables = [
        { id: 991, name: 'Report', displayName: 'Informe detallado' },
        { id: 992, name: 'Photos', displayName: 'Fotos HD' },
        { id: 993, name: 'Video', displayName: 'Video revisión' }
    ];
    const finalDeliverableTypes = (finalService?.selectedDeliverableTypes && finalService.selectedDeliverableTypes.length > 0) 
        ? finalService.selectedDeliverableTypes 
        : defaultDeliverables;

    const serviceTypeName = serviceTypes.find(st => st.id === (finalService?.serviceTypeId || serviceTypeId))?.name || 'Servicio';

    // 🛡️ Round 10 — P-B FIX: delegado a helper central NaN-safe (formatPriceNumber).
    // Antes: inline con minFractionDigits=0 inconsistente con CheckoutPage (2). Ahora ambas
    // muestran el mismo precio del mismo servicio con el mismo formato (16,50 €).
    const formatPrice = (price: number) => formatPriceNumber(price);

    // Round 24: conversion to preferred currency. Service price source default 'EUR'.
    const { formatPriceWithSource, preferredCurrency } = useCurrency();
    const servicePriceCurrency = (finalService as any)?.priceCurrency || (finalService as any)?.currency || 'EUR';
    const renderServicePrice = (amount: number) => {
        const info = formatPriceWithSource(amount, servicePriceCurrency, preferredCurrency);
        if (!info.wasConverted) return <span>{info.display}</span>;
        return (
            <>
                <span>≈ {info.converted}</span>
                <span className="ml-1 text-xs text-gray-500">({info.sourceFormatted})</span>
            </>
        );
    };

    const [isGoogleReady, setIsGoogleReady] = useState(false);
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [authStep, setAuthStep] = useState<string>('');
    const googleButtonRefMobile = useRef<HTMLDivElement>(null);
    const googleButtonRefDesktop = useRef<HTMLDivElement>(null);

    // Inicializar Google Sign-In
    useEffect(() => {
        const initGoogleSignIn = () => {
            if (window.google?.accounts?.id) {
                    const clientId = '61603823707-4vsp43naifci8t893hdc276kkhbvn49a.apps.googleusercontent.com';
                
                    window.google.accounts.id.initialize({
                        client_id: clientId,
                        callback: async (response: any) => {
                            try {
                                setIsAuthenticating(true);
                                setAuthStep('Verificando credenciales...');
                                console.log('🔐 [ServiceReviewPage] Iniciando autenticación...');
                                
                                if (!response.credential) {
                                    throw new Error('No credential received from Google');
                                }

                                setAuthStep('Guardando información...');
                                // Guardar estado antes de iniciar sesión
                                sessionStorage.setItem('pendingServiceSelection', JSON.stringify({
                                    serviceId,
                                    expertName,
                                    servicePrice,
                                    expertProfilePicture,
                                    serviceDescription,
                                    serviceImageUrls,
                                    categoryId,
                                    serviceTypeId,
                                    latitude,
                                    longitude,
                                }));

                                setAuthStep('Autenticando con el servidor...');
                                const result = await authService.googleAuth(response.credential);
                                
                                if (!result.success) {
                                    throw new Error('Authentication failed');
                                }

                                setAuthStep('Configurando sesión...');
                                // ✅ ACTUALIZAR CONTEXTO DE AUTENTICACIÓN CON TOKEN
                                const token = authService.getAccessToken();
                                if (result.user && token) {
                                    updateUser(result.user, token, () => {
                                        setAuthStep('Redirigiendo...');
                                        console.log('✅ [ServiceReviewPage] Autenticación exitosa, redirigiendo...');
                                        
                                        // Si el login fue desde el diálogo de chat, cerrar el diálogo y navegar al chat
                                        const loginFromChat = sessionStorage.getItem('loginFromChat');
                                        if (loginFromChat === 'true') {
                                            sessionStorage.removeItem('loginFromChat');
                                            setShowLoginDialog(false);
                                            setTimeout(() => {
                                                navigate(`/chat-pre-contratacion/${serviceId}`);
                                            }, 300);
                                            return;
                                        }
                                        
                                        // Después de actualizar el usuario, redirigir a checkout
                                        setTimeout(() => {
                                            // Verificar si hay una ruta guardada para redirigir
                                            const redirectPath = sessionStorage.getItem('redirectAfterLogin');
                                            if (redirectPath) {
                                                sessionStorage.removeItem('redirectAfterLogin');
                                                navigate(redirectPath, { replace: true });
                                            } else if (serviceId) {
                                                // Si no hay ruta guardada pero hay serviceId, navegar directamente a checkout
                                                const serviceIdNumber = typeof serviceId === 'number' ? serviceId : parseInt(String(serviceId), 10);
                                                if (!isNaN(serviceIdNumber) && serviceIdNumber > 0) {
                                                    navigate(`/checkout/${serviceIdNumber}`, { replace: true });
                                                }
                                            }
                                        }, 500);
                                    });
                                } else {
                                    throw new Error('No token received after authentication');
                                }
                            } catch (error: any) {
                                console.error('❌ [ServiceReviewPage] Error en Google Auth:', error);
                                const errorMessage = error?.message || 'Error al iniciar sesión. Inténtalo de nuevo.';
                                showToast('error', errorMessage);
                                setAuthStep('');
                            } finally {
                                setIsAuthenticating(false);
                            }
                        },
                    });

                // Renderizar en Móvil
                if (googleButtonRefMobile.current) {
                    window.google.accounts.id.renderButton(googleButtonRefMobile.current, {
                        type: 'standard',
                        theme: 'outline',
                        size: 'large',
                        text: 'signin_with',
                        width: '100%',
                    });
                }

                // Renderizar en Desktop
                if (googleButtonRefDesktop.current) {
                    window.google.accounts.id.renderButton(googleButtonRefDesktop.current, {
                        type: 'standard',
                        theme: 'outline',
                        size: 'large',
                        text: 'signin_with',
                        width: '100%',
                    });
                }

                setIsGoogleReady(true);
            } else {
                setTimeout(initGoogleSignIn, 100);
            }
        };

        // Cargar script de Google si no está cargado
        if (!window.google?.accounts?.id) {
            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            script.onload = () => {
                setTimeout(initGoogleSignIn, 100);
            };
            document.head.appendChild(script);
        } else {
            initGoogleSignIn();
        }
    }, []);
    
    const handleGoogleSignIn = () => {
        // Intentar desktop primero, si es visible
        const containerDesktop = googleButtonRefDesktop.current;
        if (containerDesktop && containerDesktop.offsetParent !== null) {
            const googleButton = containerDesktop.querySelector('div[role="button"]') as HTMLElement;
            if (googleButton) {
                googleButton.click();
                return;
            }
        }

        // Si no, intentar móvil
        const containerMobile = googleButtonRefMobile.current;
        if (containerMobile) {
            const googleButton = containerMobile.querySelector('div[role="button"]') as HTMLElement;
            if (googleButton) {
                googleButton.click();
                return;
            }
        }
        
        // Fallback
        if (window.google?.accounts?.id?.prompt) {
            window.google.accounts.id.prompt();
        }
    };

    const handleReserveClick = () => {
        console.log('🔵 handleReserveClick llamado', { isAuthenticated, serviceId, serviceIdType: typeof serviceId });
        
        // Validar serviceId primero
        if (!serviceId) {
            console.error('❌ No hay serviceId');
            showToast('error', 'Error: ID de servicio no válido');
            return;
        }
        
        // Asegurar que serviceId sea un número válido y convertirlo a string
        const serviceIdNumber = typeof serviceId === 'number' ? serviceId : parseInt(String(serviceId), 10);
        if (isNaN(serviceIdNumber) || serviceIdNumber <= 0) {
            console.error('❌ serviceId no es un número válido:', serviceId);
            showToast('error', 'Error: ID de servicio no válido');
            return;
        }
        
        const checkoutPath = `/checkout/${serviceIdNumber}`;
        
        if (!isAuthenticated) {
            console.log('🔵 Usuario no autenticado, guardando ruta de destino y llamando handleGoogleSignIn');
            // Guardar la ruta de destino para redirigir después del login
            sessionStorage.setItem('redirectAfterLogin', checkoutPath);
            handleGoogleSignIn();
            return;
        }
        
        console.log('🔵 Navegando a checkout:', checkoutPath);
        
        try {
            // Navegar a la página de checkout
            navigate(checkoutPath, { replace: false });
        } catch (error) {
            console.error('❌ Error al navegar a checkout:', error);
            showToast('error', 'Error al redirigir a la página de checkout. Por favor, intenta de nuevo.');
        }
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
                <div className="fixed top-4 left-4 z-50">
                    <button 
                        onClick={onBack}
                        className="sd-icon-btn"
                        aria-label="Volver"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                </div>
                <div className="fixed top-4 right-4 z-50 flex gap-2">
                    <button 
                        className="sd-icon-btn"
                        aria-label="Compartir"
                    >
                        <Share2 className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={() => setIsFavorite(!isFavorite)}
                        className="sd-icon-btn"
                        aria-label="Favorito"
                    >
                        <Heart className={`w-5 h-5 ${isFavorite ? 'fill-[#0066CC] text-[#0066CC]' : ''}`} />
                    </button>
                </div>
                {/* Galería móvil mejorada - Carrusel de imágenes */}
                <div className="relative w-full">
                    {/* Carrusel de imágenes con indicadores */}
                    <div 
                        ref={carouselRef}
                        className="relative w-full overflow-x-auto snap-x snap-mandatory scrollbar-hide"
                        onScroll={handleMobileCarouselScroll}
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        <div className="flex">
                            {validImages.length > 0 ? validImages.map((img, idx) => (
                                <div 
                                    key={idx}
                                    className="relative w-full flex-shrink-0 aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 snap-start overflow-hidden cursor-pointer active:scale-[0.98] transition-transform duration-150"
                                    onClick={() => handleImageClick(idx)}
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
                                    
                                    {/* Contador de imágenes discreto - Abajo a la derecha */}
                                    {validImages.length > 1 && idx === mobileImageIndex && (
                                        <div 
                                            className="absolute bottom-16 right-3 z-30 pointer-events-none"
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                paddingTop: '2px',
                                                paddingBottom: '2px',
                                                paddingLeft: '6px',
                                                paddingRight: '6px',
                                                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                                backdropFilter: 'blur(4px)',
                                                borderRadius: '6px',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontSize: '9px',
                                                    lineHeight: '11px',
                                                    fontWeight: 500,
                                                    color: 'rgba(255, 255, 255, 0.9)',
                                                    fontFamily: '-apple-system, BlinkMacSystemFont, "Circular", "Helvetica Neue", Helvetica, Arial, sans-serif',
                                                    letterSpacing: '0.2px',
                                                }}
                                            >
                                                {mobileImageIndex + 1} / {validImages.length}
                                            </span>
                                        </div>
                                    )}
                                </div>
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

                    {/* Card blanco mejorado con mejor espaciado */}
                    <div
                        className={`relative -mt-10 bg-white rounded-t-2xl pt-5 ${SD_MOBILE_SCROLL_PAD_CLASS} shadow-[0_-2px_14px_rgba(15,23,42,0.07)] ring-1 ring-black/[0.04]`}
                    >
                        <div className={`${SD_MOBILE_GUTTER_CLASS} mb-3 text-center`}>
                            <h1 
                                style={{
                                    fontSize: '22px',
                                    lineHeight: '26px',
                                    fontWeight: 600,
                                    color: 'rgb(34, 34, 34)',
                                    fontFamily: 'Manrope, "SF Pro Display", system-ui, -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif',
                                    marginBottom: '12px',
                                    marginTop: 0,
                                    padding: 0,
                                }}
                            >
                                {serviceTypeName} por <span style={{ textDecoration: 'underline', textDecorationColor: 'rgb(209, 213, 219)', textUnderlineOffset: '3px' }}>{finalExpertName}</span>
                            </h1>
                            
                            <div>
                                <h2 
                                    style={{
                                        fontSize: '14px',
                                        lineHeight: '20px',
                                        fontWeight: 400,
                                        color: 'rgb(113, 113, 113)',
                                        fontFamily: 'Manrope, "SF Pro Display", system-ui, -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif',
                                        margin: 0,
                                        padding: 0,
                                    }}
                                >
                                    {(() => {
                                        const city = finalService?.expert?.city;
                                        const country = finalService?.expert?.country;
                                        const countryName = country ? getCountryName(country) : '';
                                        
                                        const locationParts: string[] = [];
                                        if (city) locationParts.push(city);
                                        if (countryName) locationParts.push(countryName);
                                        
                                        const location = locationParts.length > 0 
                                            ? locationParts.join(', ')
                                            : (countryName || 'España');
                                        
                                        return location;
                                    })()}
                                </h2>
                            </div>
                                </div>

                            {(finalAvailability || expertLocation) && (
                                <ServiceDetailBookingMeta
                                    layout="minimal"
                                    availability={finalAvailability ?? undefined}
                                    timezone={finalService?.expert?.timezone}
                                    isOnVacation={finalService?.expert?.isOnVacation}
                                    location={expertLocation ?? undefined}
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
                        <div className="flex border-b border-gray-200">
                            <button
                                onClick={() => setActiveTab('about')}
                                className="flex-1 py-3 text-center relative"
                                style={{
                                    fontSize: '16px',
                                        lineHeight: '20px',
                                    fontWeight: activeTab === 'about' ? 600 : 400,
                                    color: activeTab === 'about' ? 'rgb(34, 34, 34)' : 'rgb(113, 113, 113)',
                                        fontFamily: 'Manrope, "SF Pro Display", system-ui, -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif',
                                    borderBottom: activeTab === 'about' ? '2px solid #0066CC' : '2px solid transparent',
                                    transition: 'all 0.2s',
                                    }}
                                >
                                Acerca del servicio
                            </button>
                                    <button 
                                onClick={() => setActiveTab('how')}
                                className="flex-1 py-3 text-center relative"
                                        style={{
                                    fontSize: '16px',
                                            lineHeight: '20px',
                                    fontWeight: activeTab === 'how' ? 600 : 400,
                                    color: activeTab === 'how' ? 'rgb(34, 34, 34)' : 'rgb(113, 113, 113)',
                                            fontFamily: 'Manrope, "SF Pro Display", system-ui, -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif',
                                    borderBottom: activeTab === 'how' ? '2px solid #0066CC' : '2px solid transparent',
                                    transition: 'all 0.2s',
                                }}
                            >
                                ¿Cómo funciona?
                                    </button>
                            </div>
                        
                        {/* Contenido del tab "Acerca del servicio" */}
                        {activeTab === 'about' && (
                            <div className="pt-6">
                                {/* Descripción del tipo de habitación/servicio */}
                                {finalService?.serviceTypeName && (
                                    <div className="mb-6">
                                <p 
                                    style={{
                                                fontSize: '15px',
                                                lineHeight: '22px',
                                        fontWeight: 400,
                                                color: 'rgb(34, 34, 34)',
                                        fontFamily: 'Manrope, "SF Pro Display", system-ui, -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif',
                                        margin: 0,
                                        padding: 0,
                                    }}
                                >
                                            {finalService?.serviceTypeName || 'Servicio'} con acceso a zonas comunes.
                                </p>
                            </div>
                        )}

                                {/* Descripción Principal Móvil mejorada - Estilo Airbnb */}
                                {displayMainDescription && (
                                    <div data-plugin-in-point-id="DESCRIPTION_DEFAULT" data-section-id="DESCRIPTION_DEFAULT">
                                        <p 
                                            className="whitespace-pre-line"
                                                style={{
                                                    fontSize: '14px',
                                                    lineHeight: '20px',
                                                    fontWeight: 400,
                                                    color: 'rgb(34, 34, 34)',
                                                    fontFamily: 'Manrope, "SF Pro Display", system-ui, -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif',
                                                    margin: 0,
                                                    padding: 0,
                                                }}
                                            >
                                            {displayMainDescription}
                                            </p>
                                        </div>
                                )}

                                {/* Qué incluye mejorado - Diseño profesional */}
                        {finalDeliverableTypes.length > 0 && (
                            <>
                                        <div className="mb-6 mt-6">
                                    <h3 
                                        style={{
                                            fontSize: '16px',
                                            lineHeight: '20px',
                                            fontWeight: 600,
                                            color: 'rgb(34, 34, 34)',
                                            fontFamily: 'Manrope, "SF Pro Display", system-ui, -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif',
                                            marginBottom: '16px',
                                            marginTop: 0,
                                            padding: 0,
                                        }}
                                    >
                                        Qué incluye
                                    </h3>
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                                                {finalDeliverableTypes.map((dt, idx) => {
                                            const n = (dt.displayName || dt.name).toLowerCase();
                                            let Icon = FileText;
                                                    
                                                    if (n.includes('video')) {
                                                        Icon = Video;
                                                    } else if (n.includes('imagen') || n.includes('foto')) {
                                                        Icon = Image;
                                                    } else if (n.includes('documento') || n.includes('informe')) {
                                                        Icon = FileText;
                                                    } else if (n.includes('archivo')) {
                                                        Icon = File;
                                                    }

                                            return (
                                                        <div key={dt.id} className="flex items-center gap-1.5">
                                                            <Icon className="w-3.5 h-3.5 text-[#0066CC] flex-shrink-0" />
                                                    <span 
                                                        style={{
                                                            fontSize: '14px',
                                                            lineHeight: '20px',
                                                                    fontWeight: 400,
                                                            color: 'rgb(34, 34, 34)',
                                                            fontFamily: 'Manrope, "SF Pro Display", system-ui, -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif',
                                                        }}
                                                    >
                                                        {dt.displayName || dt.name}
                                                    </span>
                                                            {idx < finalDeliverableTypes.length - 1 && (
                                                                <span 
                                                                    style={{
                                                                        fontSize: '14px',
                                                                        color: 'rgb(113, 113, 113)',
                                                                        marginLeft: '4px',
                                                                    }}
                                                                >
                                                                    ·
                                                                </span>
                                                            )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </>
                        )}

                                {/* Información del Experto Móvil mejorada */}
                                {showSecondaryDescription && (
                                    <div className="mb-6">
                                        <h3 
                                            style={{
                                                fontSize: '14px',
                                                lineHeight: '20px',
                                                fontWeight: 600,
                                                color: 'rgb(34, 34, 34)',
                                                fontFamily: 'Manrope, "SF Pro Display", system-ui, -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif',
                                                marginBottom: '8px',
                                                marginTop: 0,
                                                padding: 0,
                                            }}
                                        >
                                            Información adicional del experto
                                        </h3>
                                        <p 
                                            style={{
                                                fontSize: '14px',
                                                lineHeight: '20px',
                                                fontWeight: 400,
                                                color: 'rgb(113, 113, 113)',
                                                fontFamily: 'Manrope, "SF Pro Display", system-ui, -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif',
                                                margin: 0,
                                                padding: 0,
                                            }}
                                        >
                                            {finalUserConditions}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {/* Contenido del tab "¿Cómo funciona?" */}
                        {activeTab === 'how' && (
                            <div className="pt-6">
                                <div className="space-y-5">
                                    {/* Paso 1 */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span 
                                                style={{
                                                    fontSize: '14px',
                                                    lineHeight: '20px',
                                                    fontWeight: 600,
                                                    color: '#0066CC',
                                                    fontFamily: 'Manrope, "SF Pro Display", system-ui, -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif',
                                                }}
                                            >
                                                1.
                                            </span>
                                            <h4 
                                                style={{
                                                    fontSize: '16px',
                                                    lineHeight: '20px',
                                                    fontWeight: 600,
                                                    color: 'rgb(34, 34, 34)',
                                                    fontFamily: 'Manrope, "SF Pro Display", system-ui, -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif',
                                                    margin: 0,
                                                }}
                                            >
                                                Pago seguro
                                            </h4>
                                        </div>
                                        <p 
                                            style={{
                                                fontSize: '14px',
                                                lineHeight: '20px',
                                                fontWeight: 400,
                                                color: 'rgb(113, 113, 113)',
                                                fontFamily: 'Manrope, "SF Pro Display", system-ui, -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif',
                                                margin: 0,
                                                paddingLeft: '20px',
                                            }}
                                        >
                                            Realiza el pago y tu dinero queda protegido en custodia. Se abrirá automáticamente un chat con el experto.
                                        </p>
                                    </div>

                                    {/* Paso 2 */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span 
                                                style={{
                                                    fontSize: '14px',
                                                    lineHeight: '20px',
                                                    fontWeight: 600,
                                                    color: '#0066CC',
                                                    fontFamily: 'Manrope, "SF Pro Display", system-ui, -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif',
                                                }}
                                            >
                                                2.
                                            </span>
                                            <h4 
                                                style={{
                                                    fontSize: '16px',
                                                    lineHeight: '20px',
                                                    fontWeight: 600,
                                                    color: 'rgb(34, 34, 34)',
                                                    fontFamily: 'Manrope, "SF Pro Display", system-ui, -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif',
                                                    margin: 0,
                                                }}
                                            >
                                                Propón una cita
                                            </h4>
                                        </div>
                                        <p 
                                            style={{
                                                fontSize: '14px',
                                                lineHeight: '20px',
                                                fontWeight: 400,
                                                color: 'rgb(113, 113, 113)',
                                                fontFamily: 'Manrope, "SF Pro Display", system-ui, -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif',
                                                margin: 0,
                                                marginBottom: '8px',
                                                paddingLeft: '20px',
                                            }}
                                        >
                                            Propón fecha, hora y ubicación a través del chat. Debe cumplir:
                                        </p>
                                        <ul 
                                            style={{
                                                fontSize: '14px',
                                                lineHeight: '20px',
                                                fontWeight: 400,
                                                color: 'rgb(113, 113, 113)',
                                                fontFamily: 'Manrope, "SF Pro Display", system-ui, -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif',
                                                margin: 0,
                                                paddingLeft: '40px',
                                                listStyleType: 'disc',
                                            }}
                                        >
                                            <li style={{ marginBottom: '4px' }}>Mínimo 24h de antelación</li>
                                            <li style={{ marginBottom: '4px' }}>Dentro del horario del experto</li>
                                            <li>Ubicación dentro del rango de cobertura</li>
                                        </ul>
                                    </div>

                                    {/* Paso 3 */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span 
                                                style={{
                                                    fontSize: '14px',
                                                    lineHeight: '20px',
                                                    fontWeight: 600,
                                                    color: '#0066CC',
                                                    fontFamily: 'Manrope, "SF Pro Display", system-ui, -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif',
                                                }}
                                            >
                                                3.
                                            </span>
                                            <h4 
                                                style={{
                                                    fontSize: '16px',
                                                    lineHeight: '20px',
                                                    fontWeight: 600,
                                                    color: 'rgb(34, 34, 34)',
                                                    fontFamily: 'Manrope, "SF Pro Display", system-ui, -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif',
                                                    margin: 0,
                                                }}
                                            >
                                                Confirmación
                                            </h4>
                                        </div>
                                        <p 
                                            style={{
                                                fontSize: '14px',
                                                lineHeight: '20px',
                                                fontWeight: 400,
                                                color: 'rgb(113, 113, 113)',
                                                fontFamily: 'Manrope, "SF Pro Display", system-ui, -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif',
                                                margin: 0,
                                                paddingLeft: '20px',
                                            }}
                                        >
                                            El experto acepta o rechaza la cita. Si la rechaza, se te devuelve el dinero automáticamente.
                                        </p>
                                    </div>

                                    {/* Paso 4 */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span 
                                                style={{
                                                    fontSize: '14px',
                                                    lineHeight: '20px',
                                                    fontWeight: 600,
                                                    color: '#0066CC',
                                                    fontFamily: 'Manrope, "SF Pro Display", system-ui, -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif',
                                                }}
                                            >
                                                4.
                                            </span>
                                            <h4 
                                                style={{
                                                    fontSize: '16px',
                                                    lineHeight: '20px',
                                                    fontWeight: 600,
                                                    color: 'rgb(34, 34, 34)',
                                                    fontFamily: 'Manrope, "SF Pro Display", system-ui, -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif',
                                                    margin: 0,
                                                }}
                                            >
                                                Realización del servicio
                                            </h4>
                                        </div>
                                        <p 
                                            style={{
                                                fontSize: '14px',
                                                lineHeight: '20px',
                                                fontWeight: 400,
                                                color: 'rgb(113, 113, 113)',
                                                fontFamily: 'Manrope, "SF Pro Display", system-ui, -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif',
                                                margin: 0,
                                                paddingLeft: '20px',
                                            }}
                                        >
                                            El experto realiza la inspección en la fecha y lugar acordados. Tu dinero sigue protegido.
                                        </p>
                                    </div>

                                    {/* Paso 5 */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span 
                                                style={{
                                                    fontSize: '14px',
                                                    lineHeight: '20px',
                                                    fontWeight: 600,
                                                    color: '#0066CC',
                                                    fontFamily: 'Manrope, "SF Pro Display", system-ui, -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif',
                                                }}
                                            >
                                                5.
                                            </span>
                                            <h4 
                                                style={{
                                                    fontSize: '16px',
                                                    lineHeight: '20px',
                                                    fontWeight: 600,
                                                    color: 'rgb(34, 34, 34)',
                                                    fontFamily: 'Manrope, "SF Pro Display", system-ui, -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif',
                                                    margin: 0,
                                                }}
                                            >
                                                Aprobación final
                                            </h4>
                                        </div>
                                        <p 
                                            style={{
                                                fontSize: '14px',
                                                lineHeight: '20px',
                                                fontWeight: 400,
                                                color: 'rgb(113, 113, 113)',
                                                fontFamily: 'Manrope, "SF Pro Display", system-ui, -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif',
                                                margin: 0,
                                                paddingLeft: '20px',
                                            }}
                                        >
                                            Recibe los materiales (videos, informes, documentos) y aprueba cuando todo esté correcto. Solo entonces se libera el pago.
                                        </p>
                                    </div>

                                    {/* Badge de seguridad */}
                                    <div 
                                        style={{
                                            marginTop: '24px',
                                            padding: '16px',
                                            backgroundColor: '#F9FAFB',
                                            borderRadius: '12px',
                                            border: '1px solid #E5E7EB',
                                        }}
                                    >
                                        <p 
                                            style={{
                                                fontSize: '14px',
                                                lineHeight: '20px',
                                                fontWeight: 600,
                                                color: 'rgb(34, 34, 34)',
                                                fontFamily: 'Manrope, "SF Pro Display", system-ui, -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif',
                                                margin: 0,
                                                marginBottom: '4px',
                                            }}
                                        >
                                            Tu dinero siempre protegido
                                        </p>
                                        <p 
                                            style={{
                                                fontSize: '13px',
                                                lineHeight: '18px',
                                                fontWeight: 400,
                                                color: 'rgb(113, 113, 113)',
                                                fontFamily: 'Manrope, "SF Pro Display", system-ui, -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif',
                                                margin: 0,
                                            }}
                                        >
                                            Durante todo el proceso, tu pago permanece seguro en custodia. Solo se libera cuando apruebas el trabajo completado.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                        {/* Reseñas (MÓVIL - MEJORADO) */}
                        {finalReviews.length > 0 ? (
                            <>
                                <div className="my-4 border-t border-[#e8e8e8]" />
                                <div className="mb-8 w-full">
                                    <div className={`${SD_MOBILE_GUTTER_CLASS} mb-4`}>
                                    {/* Texto de reseñas verificadas */}
                                    <div className="mb-2">
                                        <p 
                                            style={{
                                                fontSize: '13px',
                                                lineHeight: '18px',
                                                fontFamily: 'Manrope, "SF Pro Display", system-ui, -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif',
                                                margin: 0,
                                                padding: 0,
                                                color: '#0066CC',
                                                fontWeight: 600,
                                            }}
                                        >
                                            Reseñas de clientes verificados
                                        </p>
                                    </div>
                                    
                                    {/* Header de reseñas - Estilo Airbnb */}
                                    <div className="mb-4">
                                        <div className="flex items-center gap-2">
                                            <Star className="w-5 h-5 fill-[#FFB800] text-[#FFB800]" />
                                            <span 
                                                style={{
                                                    fontSize: '18px',
                                                    lineHeight: '24px',
                                                    fontWeight: 600,
                                                    color: 'rgb(34, 34, 34)',
                                                    fontFamily: 'Manrope, "SF Pro Display", system-ui, -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif',
                                                }}
                                            >
                                                {finalRating.toFixed(1)}
                                            </span>
                                            <span 
                                                style={{
                                                    fontSize: '18px',
                                                    color: 'rgb(34, 34, 34)',
                                                }}
                                            >
                                                ·
                                            </span>
                                            <span 
                                                style={{
                                                    fontSize: '18px',
                                                    lineHeight: '24px',
                                                    fontWeight: 600,
                                                    color: 'rgb(34, 34, 34)',
                                                    fontFamily: 'Manrope, "SF Pro Display", system-ui, -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif',
                                                }}
                                            >
                                                {finalReviews.length} {finalReviews.length === 1 ? 'reseña' : 'reseñas'}
                                            </span>
                                        </div>
                                    </div>
                                    </div>
                                    
                                    <div 
                                        ref={reviewsScrollRefMobile}
                                        className={`flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 scrollbar-hide w-full ${SD_MOBILE_CAROUSEL_EDGE_CLASS}`}
                                    >
                                        {finalReviews.map((review: any, idx: number) => {
                                            // Formatear fecha en formato "mes de año" como Airbnb
                                            const reviewDate = new Date(review.createdAt);
                                            const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
                                            const formattedDate = `${monthNames[reviewDate.getMonth()]} de ${reviewDate.getFullYear()}`;
                                            
                                            // Calcular tiempo desde que el reviewer está en la plataforma
                                            const reviewerCreatedAt = review.client?.createdAt ? new Date(review.client.createdAt) : null;
                                            const now = new Date();
                                            const reviewerMonths = reviewerCreatedAt ? Math.floor((now.getTime() - reviewerCreatedAt.getTime()) / (1000 * 60 * 60 * 24 * 30)) : null;
                                            const reviewerYears = reviewerMonths ? Math.floor(reviewerMonths / 12) : null;
                                            
                                            const reviewText = review.description || review.comment || '';
                                            // Calcular si el texto necesita truncarse (aproximadamente 6 líneas con line-height 1.5rem = ~200 caracteres)
                                            const shouldTruncate = reviewText.length > 200;
                                            const isExpanded = expandedReviews[review.id || idx] || false;
                                            const rating = review.rating || review.score || 5;
                                            
                                            const hasImages = review.imageUrls && review.imageUrls.length > 0;
                                            
                                            return (
                                                <div key={review.id || idx} className="w-[75%] max-w-[320px] shrink-0 snap-start">
                                                    {/* Estructura mejorada para móvil - Altura fija */}
                                                    <div className={`flex flex-col bg-white border border-gray-200 rounded-xl p-4 shadow-sm h-[380px] ${isExpanded && reviewText.length > 300 ? 'overflow-y-auto' : 'overflow-hidden'}`}>
                                                        {/* 1. Arriba: Estrellas y fecha */}
                                                        <div className="mb-2.5 flex items-start justify-between gap-2 flex-shrink-0">
                                                            <span role="img" aria-label={`Valoración: ${rating} estrellas`}>
                                                                <div className="flex gap-0.5 inline-flex items-center">
                                                                    {[...Array(5)].map((_, i) => (
                                                                        <Star 
                                                                            key={i} 
                                                                            className={`w-3 h-3 flex-shrink-0 ${i < rating ? 'fill-[#FFB800] text-[#FFB800]' : 'fill-gray-200 text-gray-200'}`} 
                                                                        />
                                                                    ))}
                                                                </div>
                                                            </span>
                                                            <span className="text-[13px] text-gray-500 leading-[1.4] text-right flex-shrink-0">{formattedDate}</span>
                                                        </div>
                                            
                                                        {/* 2. Medio: Texto de la review */}
                                                        <div className={`mb-2 flex-1 min-h-0 ${hasImages ? '' : 'mb-3'}`}>
                                                            <div 
                                                                style={{
                                                                    lineHeight: '1.5rem',
                                                                    overflow: isExpanded ? 'visible' : 'hidden',
                                                                    textOverflow: isExpanded ? 'clip' : 'ellipsis',
                                                                    display: isExpanded ? 'block' : '-webkit-box',
                                                                    WebkitLineClamp: isExpanded ? 'unset' : 5,
                                                                    WebkitBoxOrient: 'vertical' as 'vertical',
                                                                }}
                                                            >
                                                                <span className="text-[15px] text-gray-700 leading-[1.5]">
                                                                    {reviewText}
                                                                </span>
                                                            </div>
                                                            {shouldTruncate && (
                                                                <button
                                                                    role="button"
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setExpandedReviews(prev => ({ ...prev, [review.id || idx]: !prev[review.id || idx] }));
                                                                    }}
                                                                    className="mt-1.5 text-[14px] font-semibold text-[#0066CC] underline hover:no-underline leading-[1.4] hover:text-[#004a99] transition-colors"
                                                                >
                                                                    {isExpanded ? 'Mostrar menos' : 'Mostrar más'}
                                                                </button>
                                                            )}
                                                        </div>
                                                
                                                        {/* Imágenes de la reseña - Mostrar por defecto, máximo 3 */}
                                                        {hasImages && (
                                                            <div className="mb-2 flex-shrink-0">
                                                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide w-full">
                                                                    {review.imageUrls.slice(0, 3).map((img: string, imgIdx: number) => {
                                                                        const isLast = imgIdx === 2 && review.imageUrls.length > 3;
                                                                        const remainingCount = review.imageUrls.length - 3;
                                                                        return (
                                                                            <div key={imgIdx} className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                                                                                <img 
                                                                                    src={img} 
                                                                                    alt={`Foto reseña ${imgIdx + 1}`} 
                                                                                    className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                                                                    onClick={() => {
                                                                                        setReviewLightboxIndex(prev => ({ ...prev, [review.id || idx]: imgIdx }));
                                                                                        setReviewLightboxOpen(prev => ({ ...prev, [review.id || idx]: true }));
                                                                                    }}
                                                                                />
                                                                                {isLast && (
                                                                                    <div 
                                                                                        className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:bg-black/50 transition-colors"
                                                                                        onClick={() => {
                                                                                            setReviewLightboxIndex(prev => ({ ...prev, [review.id || idx]: 2 }));
                                                                                            setReviewLightboxOpen(prev => ({ ...prev, [review.id || idx]: true }));
                                                                                        }}
                                                                                    >
                                                                                        <span className="text-white text-sm font-bold">+{remainingCount}</span>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        )}
                                                        
                                                        {/* 3. Abajo: Avatar + Nombre + Antigüedad (horizontal, misma línea) */}
                                                        <div className="flex items-center gap-2 mt-auto">
                                                            <a href="#" className="block flex-shrink-0">
                                                                <Avatar className="w-8 h-8">
                                                                    <AvatarImage src={review.client?.profilePictureUrl} />
                                                                    <AvatarFallback className="bg-gray-900 text-white font-bold text-[10px]">
                                                                        {review.client?.name?.charAt(0) || 'U'}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                            </a>
                                                            <div className="flex items-center gap-1 flex-wrap">
                                                                <div className="text-sm font-semibold text-gray-900 leading-tight">
                                                                    {review.client?.name || 'Usuario'}
                                                                </div>
                                                                {reviewerYears && reviewerYears > 0 ? (
                                                                    <>
                                                                        <span className="text-xs text-gray-500"> · </span>
                                                                        <div className="text-sm text-gray-500 leading-tight">
                                                                            Lleva {reviewerYears} {reviewerYears === 1 ? 'año' : 'años'} en Inspecciono
                                                                        </div>
                                                                    </>
                                                                ) : reviewerMonths && reviewerMonths > 0 ? (
                                                                    <>
                                                                        <span className="text-xs text-gray-500"> · </span>
                                                                        <div className="text-sm text-gray-500 leading-tight">
                                                                            Lleva {reviewerMonths} {reviewerMonths === 1 ? 'mes' : 'meses'} en Inspecciono
                                                                        </div>
                                                                    </>
                                                                ) : review.client?.location ? (
                                                                    <>
                                                                        <span className="text-xs text-gray-500"> · </span>
                                                                        <div className="text-sm text-gray-500 leading-tight">
                                                                            {review.client.location}
                                                                        </div>
                                                                    </>
                                                                ) : null}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </>
                        ) : (
                            /* ESTADO SIN RESEÑAS MÓVIL */
                            <div
                                className={`mb-8 mt-6 w-full rounded-xl border border-dashed border-gray-200 bg-gray-50/50 py-8 text-center ${SD_MOBILE_GUTTER_CLASS}`}
                            >
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-gray-100">
                                    <Star className="w-6 h-6 text-gray-300 fill-gray-50" />
                                </div>
                                <h3 
                                    style={{
                                        fontSize: '16px',
                                        lineHeight: '20px',
                                        fontWeight: 600,
                                        fontFamily: 'Manrope, "SF Pro Display", system-ui, -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif',
                                        color: 'rgb(34, 34, 34)',
                                        marginBottom: '4px',
                                        marginTop: 0,
                                        padding: 0,
                                    }}
                                >
                                    Sin reseñas todavía
                                </h3>
                                <p 
                                    style={{
                                        fontSize: '14px',
                                        lineHeight: '20px',
                                        fontWeight: 400,
                                        fontFamily: 'Manrope, "SF Pro Display", system-ui, -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif',
                                        color: 'rgb(113, 113, 113)',
                                        maxWidth: '200px',
                                        margin: '0 auto',
                                        marginTop: '4px',
                                        padding: 0,
                                    }}
                                >
                                    Sé el primero en probar este servicio y compartir tu experiencia.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer fijo móvil mejorado - Estilo Airbnb */}
                <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#e8e8e8] bg-white shadow-[0_-2px_14px_rgba(15,23,42,0.07)]">
                    <div className={`${SD_MOBILE_GUTTER_CLASS} ${SD_MOBILE_FOOTER_INNER_CLASS}`}>
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                <button
                                    type="button"
                                    className="text-left flex flex-col"
                                >
                                    <div className="flex items-baseline gap-1 flex-wrap">
                                        <span
                                            className="text-[16px] font-semibold text-gray-900 leading-[1.5]"
                                            aria-label={`${formatPrice(finalPrice)} ${servicePriceCurrency} el servicio`}
                                        >
                                            {renderServicePrice(finalPrice)}
                                        </span>
                                    </div>
                                    <span className="text-[15px] text-gray-600 font-normal leading-[1.4]">el servicio</span>
                                </button>
                            </div>
                            {isAuthenticated ? (
                                <button
                                    onClick={handleReserveClick}
                                    type="button"
                                    className="sd-btn-primary shadow-[0_4px_16px_rgba(0,102,204,0.2)]"
                                >
                                    <span className="relative z-10" data-button-content="true">Reservar</span>
                                </button>
                            ) : (
                                <div className="relative flex-shrink-0">
                                    {/* Hidden Google button */}
                                    <div ref={googleButtonRefMobile} style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', zIndex: -1 }}></div>
                                    {/* Custom button - Sin icono de Google, solo texto blanco */}
                                    <button
                                        onClick={handleGoogleSignIn}
                                        disabled={!isGoogleReady || isAuthenticating}
                                        type="button"
                                        className={`sd-btn-primary ${isAuthenticating ? 'opacity-75 cursor-wait' : ''}`}
                                    >
                                        {isAuthenticating ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
                                                <span className="relative z-10" data-button-content="true">{authStep || 'Iniciando sesión...'}</span>
                                            </>
                                        ) : (
                                            <span className="relative z-10" data-button-content="true">Inicia sesión</span>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ========== DESKTOP — topbar homepage + grid (galería columna izquierda) ========== */}
            <div className="service-detail-desktop hidden lg:block min-h-screen bg-[#fafafa]">
                <HomepageDesktopTopBar onBack={onBack} />

                <div className={`${SD_PAGE_INNER_MAX_CLASS} pb-12 pt-6 lg:pt-8`}>
                    <div className={`${SD_PAGE_GRID_CLASS}`}>
                        <div className="min-w-0 space-y-6 lg:space-y-8">
                            <ServiceDetailDesktopGallery
                                images={validImages}
                                onOpen={handleImageClick}
                                loadingImages={loadingImages}
                                failedImages={failedImages}
                                onImageError={handleImageError}
                                onImageLoad={handleImageLoad}
                                onImageLoadStart={handleImageLoadStart}
                            />

                            {/* Experto */}
                            <div className="flex items-center gap-4 border-b border-[#e8e8e8] pb-5">
                                <button
                                    type="button"
                                    className="shrink-0"
                                    onClick={() => finalExpertPicture && setIsExpertPhotoOpen(true)}
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

                            <section>
                                <h2 className="hp-section-title mb-2">Acerca del servicio</h2>
                                <p className="text-sm leading-relaxed text-[#6a6a6a] whitespace-pre-line">
                                    {finalServiceTypeDescription}
                                </p>
                            </section>

                            {finalUserConditions && (
                                <section>
                                    <h2 className="hp-section-title mb-2">Detalles del experto</h2>
                                    <p className="text-sm leading-relaxed text-[#6a6a6a] whitespace-pre-line">
                                        {finalUserConditions}
                                    </p>
                                </section>
                            )}

                            {finalDeliverableTypes.length > 0 && (
                                <section>
                                    <h2 className="hp-section-title mb-2">Qué incluye</h2>
                                    <ul className="mt-2 space-y-2">
                                        {finalDeliverableTypes.map((dt) => {
                                            const n = (dt.displayName || dt.name).toLowerCase();
                                            let Icon = FileText;
                                            if (n.includes('video')) Icon = Video;
                                            else if (n.includes('imagen') || n.includes('foto')) Icon = Image;
                                            else if (n.includes('archivo')) Icon = File;
                                            return (
                                                <li key={dt.id} className="flex items-center gap-2.5 text-sm text-[#6a6a6a]">
                                                    <Icon className="h-4 w-4 shrink-0 text-[#0066CC]" />
                                                    {dt.displayName || dt.name}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </section>
                            )}

                            <ServiceDetailReviewsSection
                              reviews={finalReviews}
                              averageRating={finalRating}
                              expandedReviews={expandedReviews}
                              onToggleExpand={(key) =>
                                setExpandedReviews((prev) => ({ ...prev, [key]: !prev[key] }))
                              }
                              onOpenReviewImage={(reviewKey, imgIdx) => {
                                setReviewLightboxIndex((prev) => ({ ...prev, [reviewKey]: imgIdx }));
                                setReviewLightboxOpen((prev) => ({ ...prev, [reviewKey]: true }));
                              }}
                              className="!mt-0 !border-t-0 !pt-0"
                            />
                            <ServiceDetailHowItWorks className="!mt-0 !pt-0" />
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
                                            {(finalService?.expert?.city || finalService?.expert?.country) && (
                                                <>
                                                    {' · '}
                                                    {[
                                                        finalService?.expert?.city,
                                                        finalService?.expert?.country
                                                            ? getCountryName(finalService.expert.country)
                                                            : '',
                                                    ]
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
                                        <p className="mt-1.5 flex items-center gap-1 text-sm text-[#6a6a6a]">
                                            <Star className="h-3.5 w-3.5 fill-[#0066CC] text-[#0066CC]" aria-hidden />
                                            <span className="font-semibold text-[#1c1c1c]">
                                                {finalRating.toFixed(1)}
                                            </span>
                                            <span className="text-[#d4d4d4]" aria-hidden>
                                                ·
                                            </span>
                                            <span>
                                                {finalReviews.length} reseña
                                                {finalReviews.length !== 1 ? 's' : ''}
                                            </span>
                                        </p>
                                    )}
                                </section>

                                {(finalAvailability || expertLocation) && (
                                    <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
                                        <ServiceDetailBookingMeta
                                            availability={finalAvailability ?? undefined}
                                            timezone={finalService?.expert?.timezone}
                                            isOnVacation={finalService?.expert?.isOnVacation}
                                            location={expertLocation ?? undefined}
                                            rangeKm={expertRange || 25}
                                        />
                                    </div>
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
                                    <div className="relative">
                                        <div
                                            ref={googleButtonRefDesktop}
                                            className="pointer-events-none absolute opacity-0"
                                            aria-hidden
                                        />
                                        <button
                                            type="button"
                                            onClick={handleGoogleSignIn}
                                            disabled={!isGoogleReady || isAuthenticating}
                                            className={`sd-btn-primary w-full min-w-0 ${isAuthenticating ? 'opacity-75' : ''}`}
                                        >
                                            {isAuthenticating ? 'Iniciando sesión…' : 'Inicia sesión para reservar'}
                                        </button>
                                    </div>
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
                            <div className="relative h-[90vh] max-h-[90vh]">
                                <button
                                    onClick={() => setReviewLightboxOpen(prev => ({ ...prev, [reviewId]: false }))}
                                    className="absolute top-4 right-4 z-50 w-10 h-10 flex items-center justify-center rounded-full bg-white hover:bg-gray-100 shadow-lg border border-gray-200 transition-all duration-200 hover:scale-110"
                                >
                                    <X className="w-5 h-5 text-gray-700" />
                                </button>
                                
                                {reviewImages.length > 1 && (
                                    <>
                                        <button
                                            onClick={() => handleReviewLightboxNavigation(reviewId, 'prev', reviewImages.length)}
                                            className="absolute left-6 top-1/2 -translate-y-1/2 z-50 w-14 h-14 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-md hover:bg-white shadow-2xl border border-gray-100 hover:scale-110 hover:shadow-3xl transition-all duration-300 group"
                                        >
                                            <ChevronLeft className="w-7 h-7 text-gray-800 group-hover:text-gray-900 transition-colors" strokeWidth={2.5} />
                                        </button>
                                        <button
                                            onClick={() => handleReviewLightboxNavigation(reviewId, 'next', reviewImages.length)}
                                            className="absolute right-6 top-1/2 -translate-y-1/2 z-50 w-14 h-14 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-md hover:bg-white shadow-2xl border border-gray-100 hover:scale-110 hover:shadow-3xl transition-all duration-300 group"
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
                onOpenChange={setShowLoginDialog}
                initialTab="login"
                onSuccess={() => {
                    setShowLoginDialog(false);
                    // Existing post-login navigation should already trigger via AuthContext useEffect.
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

