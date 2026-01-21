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
    File
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { EnhancedReviewsList } from '../components/EnhancedReviewCard';
import { useServices, Service } from '../hooks/useServices';
import { useServiceTypes } from '../hooks/useServiceTypes';
import { Dialog, DialogContent } from '../components/ui/dialog';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { showToast } from '../lib/toast';
import { authService } from '../services/authService';
import { getCountryName } from '../utils/countries';
import AppointmentMap from '../components/AppointmentMap';

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
    const [isFavorite, setIsFavorite] = useState(false);
    const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
    const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());
    const carouselRef = useRef<HTMLDivElement>(null);
    const { serviceTypes } = useServiceTypes();

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
    const [showReviewImages, setShowReviewImages] = useState<Record<number, boolean>>({});
    
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

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('es-ES', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).format(price);
    };

    // Google Icon Component
    const GoogleIcon = () => (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
    );

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
        <div className="min-h-screen bg-white">
                
            {/* ========== VERSIÓN MÓVIL MEJORADA ========== */}
            <div className="lg:hidden">
                    {/* Botones de acción móvil con fondo blanco */}
                    <div className="relative z-50 flex items-center justify-between px-4 py-3 bg-white shadow-sm pointer-events-none">
                        <button 
                            onClick={onBack}
                            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors pointer-events-auto"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-900" />
                        </button>
                        <div className="flex items-center gap-2 pointer-events-auto">
                            <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                                <Share2 className="w-5 h-5 text-gray-900" />
                            </button>
                            <button 
                                onClick={() => setIsFavorite(!isFavorite)}
                                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-900'}`} />
                            </button>
                        </div>
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
                                    className="relative w-full flex-shrink-0 aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 snap-start overflow-hidden"
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
                                    
                                    {/* Badge discreto con indicadores - Solo en la primera imagen visible */}
                                    {validImages.length > 1 && idx === mobileImageIndex && (
                                        <div 
                                            className="absolute top-3 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
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
                                                {mobileImageIndex + 1} / {validImages.length}
                                            </span>
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '3px',
                                                }}
                                            >
                                                {validImages.map((_, dotIdx) => (
                                                    <div
                                                        key={dotIdx}
                                                        className="rounded-full transition-all"
                                                        style={{
                                                            height: '3px',
                                                            width: dotIdx === mobileImageIndex ? '12px' : '3px',
                                                            backgroundColor: dotIdx === mobileImageIndex ? '#222222' : 'rgba(34, 34, 34, 0.4)',
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )) : (
                                <div className="w-full aspect-[4/3] bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 flex items-center justify-center">
                                    <div className="text-center px-6">
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
                    <div className="relative -mt-12 bg-white rounded-t-3xl pt-6 pb-36 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
                        {/* Título y ubicación centrados estilo Airbnb - Tipografía exacta */}
                        <div className="mb-4 px-5 text-center">
                            <h1 
                                style={{
                                    fontSize: '22px',
                                    lineHeight: '26px',
                                    fontWeight: 600,
                                    color: 'rgb(34, 34, 34)',
                                    fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                    marginBottom: '12px',
                                    marginTop: 0,
                                    padding: 0,
                                }}
                            >
                                {serviceTypeName} por {finalExpertName}
                            </h1>
                            
                            {/* Ubicación y tipo centrados */}
                            <div className="mb-3">
                                <h2 
                                    style={{
                                        fontSize: '14px',
                                        lineHeight: '20px',
                                        fontWeight: 400,
                                        color: 'rgb(113, 113, 113)',
                                        fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
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
                                        
                                        return `Ubicación: ${location}`;
                                    })()}
                                </h2>
                            </div>
                            
                            {/* ✅ HORARIO AL PRINCIPIO - Estilo SearchDashboard */}
                            {finalAvailability && (
                                <div className="mb-3 px-5">
                                    <div 
                                        className="flex flex-wrap items-center justify-center gap-1.5"
                                        style={{
                                            fontSize: '13px',
                                            lineHeight: '18px',
                                            fontWeight: 400,
                                            fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                            color: 'rgb(34, 34, 34)',
                                        }}
                                    >
                                        {finalAvailability.daysOfWeek?.slice(0, 7).map((day: string, idx: number) => (
                                            <span 
                                                key={idx} 
                                                className="px-2 py-1 bg-gray-100 rounded-md text-gray-700 font-medium"
                                                style={{
                                                    fontSize: '12px',
                                                    lineHeight: '16px',
                                                }}
                                            >
                                                {formatDay(day)}
                                            </span>
                                        ))}
                                        {finalAvailability.startTime && finalAvailability.endTime && (
                                            <>
                                                <span className="text-gray-400 mx-1">·</span>
                                                <span className="text-gray-700 font-medium">
                                                    {finalAvailability.startTime.substring(0, 5)} - {finalAvailability.endTime.substring(0, 5)}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                            
                                </div>
                    
                    {/* Barra de separación discreta */}
                    <div className="border-t border-gray-200 my-6"></div>
                    
                    {/* Sección "Revisor" estilo Airbnb */}
                    <div className="mb-4 px-6">
                        <div className="flex items-start gap-4">
                            <div className="relative flex-shrink-0" style={{ height: '40px', width: '40px' }}>
                                <button
                                    type="button"
                                    aria-label={`${finalExpertName} es revisor verificado de inspecciono.com. Obtén más información sobre ${finalExpertName}.`}
                                    className="relative w-full h-full border-none bg-transparent p-0 cursor-pointer"
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
                                            <linearGradient id="superhost-gradient" x1="8.5%" x2="92.18%" y1="17.16%" y2="17.16%">
                                                <stop offset="0" stopColor="#e61e4d"></stop>
                                                <stop offset=".5" stopColor="#e31c5f"></stop>
                                                <stop offset="1" stopColor="#d70466"></stop>
                                            </linearGradient>
                                            <path fill="#fff" d="M9.93 0c.88 0 1.6.67 1.66 1.52l.01.15v2.15c0 .54-.26 1.05-.7 1.36l-.13.08-3.73 2.17a3.4 3.4 0 1 1-2.48 0L.83 5.26A1.67 1.67 0 0 1 0 3.96L0 3.82V1.67C0 .79.67.07 1.52 0L1.67 0z"></path>
                                            <path fill="url(#superhost-gradient)" d="M5.8 8.2a2.4 2.4 0 0 0-.16 4.8h.32a2.4 2.4 0 0 0-.16-4.8zM9.93 1H1.67a.67.67 0 0 0-.66.57l-.01.1v2.15c0 .2.1.39.25.52l.08.05L5.46 6.8c.1.06.2.09.29.1h.1l.1-.02.1-.03.09-.05 4.13-2.4c.17-.1.3-.29.32-.48l.01-.1V1.67a.67.67 0 0 0-.57-.66z"></path>
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
                                        fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                    }}
                                >
                                    <div style={{ fontSize: '14px', lineHeight: '20px', fontWeight: 400, color: 'rgb(34, 34, 34)', fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif' }}>
                                        Revisor: {finalExpertName}
                                        </div>
                                    <div className="mt-1" style={{ fontSize: '14px', lineHeight: '20px', fontWeight: 400, color: 'rgb(113, 113, 113)', fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif' }}>
                                        Revisor verificado de inspecciono.com
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Sección "Entre el 1% de los que más gustan" estilo Airbnb */}
                    {finalRating >= 4.5 && finalReviews.length >= 3 && (
                        <div className="mb-6 px-5">
                            <div className="mb-3">
                                <h3 
                                    style={{
                                        fontSize: '16px',
                                        lineHeight: '20px',
                                        fontWeight: 600,
                                        color: 'rgb(34, 34, 34)',
                                        fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                        marginBottom: '8px',
                                        marginTop: 0,
                                        padding: 0,
                                    }}
                                >
                                    Entre el 1% de los que más gustan
                                </h3>
                                <p 
                                    style={{
                                        fontSize: '15px',
                                        lineHeight: '22px',
                                        fontWeight: 400,
                                        color: 'rgb(34, 34, 34)',
                                        fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                        margin: 0,
                                        padding: 0,
                                    }}
                                >
                                    Este es uno de los favoritos de los viajeros, según sus valoraciones, evaluaciones y su fiabilidad.
                                </p>
                            </div>
                        </div>
                    )}
                    
                    {/* Barra de separación discreta */}
                    <div className="border-t border-gray-200 my-6"></div>
                    
                    {/* Tabs: Acerca del servicio y ¿Cómo funciona? */}
                        <div className="mb-6 px-5">
                        <div className="flex border-b border-gray-200">
                            <button
                                onClick={() => setActiveTab('about')}
                                className="flex-1 py-3 text-center relative"
                                style={{
                                    fontSize: '16px',
                                        lineHeight: '20px',
                                    fontWeight: activeTab === 'about' ? 600 : 400,
                                    color: activeTab === 'about' ? 'rgb(34, 34, 34)' : 'rgb(113, 113, 113)',
                                        fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                    borderBottom: activeTab === 'about' ? '2px solid rgb(34, 34, 34)' : '2px solid transparent',
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
                                            fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                    borderBottom: activeTab === 'how' ? '2px solid rgb(34, 34, 34)' : '2px solid transparent',
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
                                        fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
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
                                                    fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
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
                                            fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
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
                                                            <Icon className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                                                    <span 
                                                        style={{
                                                            fontSize: '14px',
                                                            lineHeight: '20px',
                                                                    fontWeight: 400,
                                                            color: 'rgb(34, 34, 34)',
                                                            fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
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

                        {/* ✅ MAPA DE RANGO DE TRABAJO DEL EXPERTO */}
                        {expertLocation ? (
                                    <div className="mb-6">
                                <h3 
                                    style={{
                                        fontSize: '16px',
                                        lineHeight: '20px',
                                        fontWeight: 600,
                                        color: 'rgb(34, 34, 34)',
                                        fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                        marginBottom: '8px',
                                        marginTop: 0,
                                        padding: 0,
                                    }}
                                >
                                    Zona de cobertura
                                </h3>
                                {expertRange ? (
                                    <p 
                                        style={{
                                            fontSize: '14px',
                                            lineHeight: '20px',
                                            fontWeight: 400,
                                            color: 'rgb(113, 113, 113)',
                                            fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                            marginBottom: '12px',
                                            marginTop: 0,
                                            padding: 0,
                                        }}
                                    >
                                        El experto cubre un radio de {expertRange} km desde su ubicación
                                    </p>
                                ) : (
                                    <p 
                                        style={{
                                            fontSize: '14px',
                                            lineHeight: '20px',
                                            fontWeight: 400,
                                            color: 'rgb(113, 113, 113)',
                                            fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                            marginBottom: '12px',
                                            marginTop: 0,
                                            padding: 0,
                                        }}
                                    >
                                        Ubicación del experto
                                    </p>
                                )}
                                        <div className="h-[200px] rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                                    <AppointmentMap
                                        expertLocation={expertLocation}
                                        expertRange={expertRange || 25}
                                        expertCountry={expertCountry}
                                        className="w-full h-full"
                                        disabled={true}
                                        showSearch={false}
                                        showCountrySelector={false}
                                                showExpertMarker={true}
                                        defaultZoom={9}
                                    />
                                </div>
                            </div>
                        ) : (
                                    <div className="mb-8">
                                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                                    <p className="text-sm text-yellow-800">
                                        ℹ️ La información de ubicación del experto no está disponible en este momento.
                                    </p>
                                </div>
                            </div>
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
                                                fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
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
                                                fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
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
                                <div 
                                    style={{
                                        fontSize: '14px',
                                        lineHeight: '20px',
                                        fontWeight: 400,
                                        color: 'rgb(34, 34, 34)',
                                        fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                    }}
                                >
                                    <div style={{ marginBottom: '20px' }}>
                                        <h4 style={{ 
                                            fontSize: '15px', 
                                            lineHeight: '20px', 
                                            fontWeight: 600, 
                                            marginBottom: '8px', 
                                            marginTop: 0,
                                            color: 'rgb(34, 34, 34)',
                                        }}>
                                            1. Realiza el pago seguro
                                        </h4>
                                        <p style={{ marginBottom: 0, marginTop: 0 }}>
                                            Una vez que realices el pago, tu dinero queda completamente a salvo en custodia. Se abrirá automáticamente un chat con el experto donde comenzará un flujo de trabajo completamente automatizado gestionado por inspecciono.com.
                                        </p>
                                    </div>

                                    <div style={{ marginBottom: '20px' }}>
                                        <h4 style={{ 
                                            fontSize: '15px', 
                                            lineHeight: '20px', 
                                            fontWeight: 600, 
                                            marginBottom: '8px', 
                                            marginTop: 0,
                                            color: 'rgb(34, 34, 34)',
                                        }}>
                                            2. Propón una cita válida
                                        </h4>
                                        <p style={{ marginBottom: 0, marginTop: 0 }}>
                                            A través del chat automatizado, deberás proponer una fecha, hora y ubicación para la cita. <strong>Es fundamental que la cita cumpla estos requisitos:</strong> debe tener un mínimo de 24 horas de antelación, debe estar dentro del horario disponible del experto (mostrado arriba) y la ubicación debe estar dentro del rango de cobertura del experto (indicado en el mapa). Si no cumple estos requisitos, el sistema automatizado no permitirá realizar la inspección.
                                        </p>
                                    </div>

                                    <div style={{ marginBottom: '20px' }}>
                                        <h4 style={{ 
                                            fontSize: '15px', 
                                            lineHeight: '20px', 
                                            fontWeight: 600, 
                                            marginBottom: '8px', 
                                            marginTop: 0,
                                            color: 'rgb(34, 34, 34)',
                                        }}>
                                            3. Confirmación del experto
                                        </h4>
                                        <p style={{ marginBottom: 0, marginTop: 0 }}>
                                            El experto puede aceptar o rechazar la cita propuesta. Si la rechaza, tendrá una única oportunidad para hacerlo. Si rechaza la cita, se te devolverá el dinero automáticamente y de forma segura. Tu dinero siempre está protegido.
                                        </p>
                                    </div>

                                    <div style={{ marginBottom: '20px' }}>
                                        <h4 style={{ 
                                            fontSize: '15px', 
                                            lineHeight: '20px', 
                                            fontWeight: 600, 
                                            marginBottom: '8px', 
                                            marginTop: 0,
                                            color: 'rgb(34, 34, 34)',
                                        }}>
                                            4. Realización del servicio
                                        </h4>
                                        <p style={{ marginBottom: 0, marginTop: 0 }}>
                                            Una vez aceptada la cita, el experto realizará la inspección en la fecha, hora y ubicación acordadas. Durante todo este proceso, tu dinero permanece seguro en custodia.
                                        </p>
                                    </div>

                                    <div style={{ marginBottom: '20px' }}>
                                        <h4 style={{ 
                                            fontSize: '15px', 
                                            lineHeight: '20px', 
                                            fontWeight: 600, 
                                            marginBottom: '8px', 
                                            marginTop: 0,
                                            color: 'rgb(34, 34, 34)',
                                        }}>
                                            5. Entrega y aprobación final
                                        </h4>
                                        <p style={{ marginBottom: 0, marginTop: 0 }}>
                                            El experto te enviará todos los materiales acordados (videos, informes, documentos, etc.) a través del chat. Solo cuando tú, como cliente, apruebes explícitamente que todo está correcto y completo, se liberará el pago al experto. Hasta ese momento, tu dinero permanece completamente seguro en custodia. Si no estás satisfecho, puedes solicitar correcciones y el dinero seguirá protegido.
                                        </p>
                                    </div>

                                    <div style={{ 
                                        marginTop: '24px', 
                                        padding: '16px', 
                                        backgroundColor: '#F0F9FF', 
                                        borderRadius: '12px',
                                        border: '1px solid #BAE6FD',
                                    }}>
                                        <p style={{ 
                                            marginBottom: '8px', 
                                            marginTop: 0,
                                            fontSize: '14px',
                                            lineHeight: '20px',
                                            fontWeight: 600,
                                            color: 'rgb(34, 34, 34)',
                                        }}>
                                            🔒 Tu dinero siempre está seguro
                                        </p>
                                        <p style={{ 
                                            marginBottom: 0, 
                                            marginTop: 0,
                                            fontSize: '14px',
                                            lineHeight: '20px',
                                            fontWeight: 400,
                                            color: 'rgb(34, 34, 34)',
                                        }}>
                                            Todo el proceso está completamente automatizado y inspecciono.com actúa como mediador y custodio del pago en todo momento. Tu dinero solo se libera cuando apruebas el trabajo completado, garantizando la seguridad y transparencia de la transacción para ambas partes.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                        {/* Reseñas (MÓVIL - ESTILO AIRBNB EXACTO) */}
                        {finalReviews.length > 0 ? (
                            <>
                                <div className="h-px bg-gray-200 mb-6 mx-5" />
                                <div className="mb-24 px-5 w-full">
                                    {/* Badge Guest Favorite - Imágenes correctas */}
                                    {finalRating >= 4.5 && finalReviews.length >= 3 && (
                                        <div className="mb-6">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="flex items-center gap-1.5">
                                                    <picture>
                                                        <source srcSet="https://a0.muscache.com/im/pictures/airbnb-platform-assets/AirbnbPlatformAssets-GuestFavorite/original/33b80859-e87e-4c86-841c-645c786ba4c1.png?im_w=240 1x" media="(min-width: 0px)" />
                                                        <img 
                                                            src="https://a0.muscache.com/im/pictures/airbnb-platform-assets/AirbnbPlatformAssets-GuestFavorite/original/33b80859-e87e-4c86-841c-645c786ba4c1.png?im_w=720" 
                                                            alt="Guest favorite" 
                                                            className="h-[105px] w-auto object-contain"
                                                            style={{ width: '68.97058823529412px', height: '105px' }}
                                                            decoding="async"
                                                        />
                                                    </picture>
                                                    <picture>
                                                        <source srcSet="https://a0.muscache.com/im/pictures/airbnb-platform-assets/AirbnbPlatformAssets-GuestFavorite/original/059619e1-1751-42dd-84e4-50881483571a.png?im_w=240 1x" media="(min-width: 0px)" />
                                                        <img 
                                                            src="https://a0.muscache.com/im/pictures/airbnb-platform-assets/AirbnbPlatformAssets-GuestFavorite/original/059619e1-1751-42dd-84e4-50881483571a.png?im_w=720" 
                                                            alt="Guest favorite" 
                                                            className="h-[105px] w-auto object-contain"
                                                            style={{ width: '68.97058823529412px', height: '105px' }}
                                                            decoding="async"
                                                        />
                                                    </picture>
                                                </div>
                                                <div 
                                                    style={{
                                                        fontSize: '15px',
                                                        lineHeight: '20px',
                                                        fontWeight: 600,
                                                        color: 'rgb(34, 34, 34)',
                                                        fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                    }}
                                                >
                                                    Guest favorite
                                                </div>
                                            </div>
                                            <div 
                                                style={{
                                                    fontSize: '15px',
                                                    lineHeight: '22px',
                                                    fontWeight: 400,
                                                    color: 'rgb(34, 34, 34)',
                                                    fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                }}
                                            >
                                                This home is a guest favorite based on ratings, reviews, and reliability
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Header de reseñas - Estilo Airbnb */}
                                    <div className="mb-6">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Star className="w-5 h-5 fill-gray-900 text-gray-900" />
                                            <span 
                                                style={{
                                                    fontSize: '18px',
                                                    lineHeight: '24px',
                                                    fontWeight: 600,
                                                    color: 'rgb(34, 34, 34)',
                                                    fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
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
                                                    fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                }}
                                            >
                                                {finalReviews.length} {finalReviews.length === 1 ? 'reseña' : 'reseñas'}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div 
                                        ref={reviewsScrollRefMobile}
                                        className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide w-full snap-x snap-mandatory px-0"
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
                                            // Calcular si el texto necesita truncarse (aproximadamente 4 líneas con line-height 1.25rem = ~150 caracteres)
                                            const shouldTruncate = reviewText.length > 150;
                                            const isExpanded = expandedReviews[review.id || idx] || false;
                                            const rating = review.rating || review.score || 5;
                                            
                                            return (
                                                <div key={review.id || idx} className={`flex-shrink-0 w-[85%] max-w-sm snap-start pr-4 ${idx === 0 ? 'pl-2' : ''}`}>
                                                    {/* Estructura vertical exacta de Airbnb con marco */}
                                                    <div className={`flex flex-col bg-white border border-gray-200 rounded-lg p-4 shadow-sm ${isExpanded ? 'min-h-[200px]' : 'h-[200px]'}`}>
                                                        {/* 1. Arriba: Estrellas y fecha */}
                                                        <div className="mb-2">
                                                            <span role="img" aria-label={`Valoración: ${rating} estrellas`}>
                                                                <div className="flex gap-[0.0625rem] inline-flex items-center">
                                                                    {[...Array(5)].map((_, i) => (
                                                                        <Star 
                                                                            key={i} 
                                                                            className={`w-[0.5625rem] h-[0.5625rem] flex-shrink-0 ${i < rating ? 'fill-gray-900 text-gray-900' : 'fill-gray-200 text-gray-200'}`} 
                                                                        />
                                                                    ))}
                                                                </div>
                                                            </span>
                                                            <span className="text-[14px] text-gray-500 leading-[1.4]">, </span>
                                                            <span aria-hidden="true" className="text-[14px] text-gray-500 leading-[1.4]"> · </span>
                                                            <span className="text-[14px] text-gray-500 leading-[1.4]">{formattedDate}</span>
                                                        </div>
                                            
                                                        {/* 2. Medio: Texto de la review */}
                                                        <div className="mb-3 flex-1">
                                                            <div 
                                                                style={{
                                                                    lineHeight: '1.25rem',
                                                                    overflow: isExpanded ? 'visible' : 'hidden',
                                                                    textOverflow: isExpanded ? 'clip' : 'ellipsis',
                                                                    display: isExpanded ? 'block' : '-webkit-box',
                                                                    WebkitLineClamp: isExpanded ? 'unset' : 4,
                                                                    WebkitBoxOrient: 'vertical' as 'vertical',
                                                                }}
                                                            >
                                                                <span>
                                                                    <span className="text-[15px] text-gray-700 leading-[1.5]">
                                                                        {reviewText}
                                                                    </span>
                                                                </span>
                                                            </div>
                                                            <div></div>
                                                            {shouldTruncate && (
                                                                <button
                                                                    role="button"
                                                                    type="button"
                                                                    onClick={() => setExpandedReviews(prev => ({ ...prev, [review.id || idx]: !prev[review.id || idx] }))}
                                                                    className="mt-2 text-[15px] font-semibold text-gray-900 underline hover:no-underline leading-[1.4]"
                                                                >
                                                                    {isExpanded ? 'Mostrar menos' : 'Mostrar más'}
                                                                </button>
                                                            )}
                                                        </div>
                                                
                                                        {/* Imágenes de la reseña */}
                                                        {review.imageUrls && review.imageUrls.length > 0 && (
                                                            <div className="mt-3 mb-3">
                                                                <button
                                                                    type="button"
                                                                    className="text-[15px] font-semibold text-gray-900 underline hover:no-underline leading-[1.4]"
                                                                    onClick={() => {
                                                                        setShowReviewImages(prev => ({
                                                                            ...prev,
                                                                            [review.id || idx]: !prev[review.id || idx]
                                                                        }));
                                                                    }}
                                                                >
                                                                    Ver fotos
                                                                </button>
                                                                {showReviewImages[review.id || idx] && (
                                                                    <>
                                                                        {/* Móvil: Scroll horizontal */}
                                                                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide w-full mt-2 lg:hidden">
                                                                            {review.imageUrls.map((img: string, imgIdx: number) => (
                                                                                <div key={imgIdx} className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                                                                                    <img 
                                                                                        src={img} 
                                                                                        alt={`Foto reseña ${imgIdx + 1}`} 
                                                                                        className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                                                                        onClick={() => {
                                                                                            // TODO: Abrir lightbox con la imagen
                                                                                            console.log('Abrir imagen:', img);
                                                                                        }}
                                                                                    />
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                        {/* Desktop: Grid vertical */}
                                                                        <div className="hidden lg:grid lg:grid-cols-4 lg:gap-2 w-full mt-2">
                                                                            {review.imageUrls.map((img: string, imgIdx: number) => (
                                                                                <div key={imgIdx} className="relative w-full aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                                                                                    <img 
                                                                                        src={img} 
                                                                                        alt={`Foto reseña ${imgIdx + 1}`} 
                                                                                        className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                                                                        onClick={() => {
                                                                                            // TODO: Abrir lightbox con la imagen
                                                                                            console.log('Abrir imagen:', img);
                                                                                        }}
                                                                                    />
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </>
                                                                )}
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
                            <div className="mb-24 px-5 py-8 bg-gray-50/50 rounded-xl border border-dashed border-gray-200 text-center w-full mt-6">
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-gray-100">
                                    <Star className="w-6 h-6 text-gray-300 fill-gray-50" />
                                </div>
                                <h3 
                                    style={{
                                        fontSize: '16px',
                                        lineHeight: '20px',
                                        fontWeight: 600,
                                        fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
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
                                        fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
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
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 pb-safe">
                    <div className="px-5 py-4">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                <button 
                                    type="button"
                                    className="text-left flex flex-col"
                                >
                                    <div className="flex items-baseline gap-1">
                                        <span 
                                            className="text-[16px] font-semibold text-gray-900 leading-[1.5] underline decoration-gray-900 underline-offset-2" 
                                            aria-label={`${formatPrice(finalPrice)} € por 2 noches`}
                                            style={{ textDecorationThickness: '1px' }}
                                        >
                                            {formatPrice(finalPrice)} €
                                        </span>
                                    </div>
                                    <span className="text-[15px] text-gray-600 font-normal leading-[1.4]">por 2 noches</span>
                                </button>
                            </div>
                            {isAuthenticated ? (
                                <button
                                    onClick={handleReserveClick}
                                    type="button"
                                    className="relative h-12 px-6 bg-gradient-to-r from-[#E61E4D] via-[#E31C5F] to-[#D70466] hover:from-[#D70466] hover:via-[#E61E4D] hover:to-[#E31C5F] text-white text-[16px] font-semibold transition-all duration-200 flex-shrink-0 min-w-[120px] overflow-hidden"
                                    style={{
                                        borderRadius: '24px',
                                        backgroundPosition: 'calc((100 - var(--mouse-x, 0)) * 1%) calc((100 - var(--mouse-y, 0)) * 1%)',
                                    }}
                                    onMouseMove={(e) => {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        const x = ((e.clientX - rect.left) / rect.width) * 100;
                                        const y = ((e.clientY - rect.top) / rect.height) * 100;
                                        e.currentTarget.style.setProperty('--mouse-x', x.toString());
                                        e.currentTarget.style.setProperty('--mouse-y', y.toString());
                                    }}
                                    onTouchMove={(e) => {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        const touch = e.touches[0];
                                        const x = ((touch.clientX - rect.left) / rect.width) * 100;
                                        const y = ((touch.clientY - rect.top) / rect.height) * 100;
                                        e.currentTarget.style.setProperty('--mouse-x', x.toString());
                                        e.currentTarget.style.setProperty('--mouse-y', y.toString());
                                    }}
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
                                        className={`relative h-12 px-6 bg-gradient-to-r from-[#E61E4D] via-[#E31C5F] to-[#D70466] hover:from-[#D70466] hover:via-[#E61E4D] hover:to-[#E31C5F] text-white text-[16px] font-semibold transition-all duration-200 min-w-[120px] overflow-hidden ${isAuthenticating ? 'opacity-75 cursor-wait' : ''}`}
                                        style={{
                                            borderRadius: '24px',
                                            backgroundPosition: 'calc((100 - var(--mouse-x, 0)) * 1%) calc((100 - var(--mouse-y, 0)) * 1%)',
                                        }}
                                        onMouseMove={(e) => {
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            const x = ((e.clientX - rect.left) / rect.width) * 100;
                                            const y = ((e.clientY - rect.top) / rect.height) * 100;
                                            e.currentTarget.style.setProperty('--mouse-x', x.toString());
                                            e.currentTarget.style.setProperty('--mouse-y', y.toString());
                                        }}
                                        onTouchMove={(e) => {
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            const touch = e.touches[0];
                                            const x = ((touch.clientX - rect.left) / rect.width) * 100;
                                            const y = ((touch.clientY - rect.top) / rect.height) * 100;
                                            e.currentTarget.style.setProperty('--mouse-x', x.toString());
                                            e.currentTarget.style.setProperty('--mouse-y', y.toString());
                                        }}
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

            {/* ========== VERSIÓN DESKTOP COMPACTA Y REFINADA ========== */}
            <div className="hidden lg:block min-h-screen bg-white">
                <div className="max-w-6xl mx-auto px-6 pt-16 pb-8">
                    <div className="grid grid-cols-[45%_1fr] gap-12 items-start">
                        
                        {/* COLUMNA IZQUIERDA: ÁLBUM DE FOTOS + RESEÑAS PREMIUM */}
                        <div className="space-y-12" style={{ paddingBottom: '250px' }}>
                            {/* ÁLBUM DE FOTOS (STACK EFFECT REALISTA - MEJORADO) */}
                            <div className="relative group cursor-pointer perspective-1000 mx-auto w-full max-w-[480px] mt-4 mb-12" onClick={() => handleImageClick(0)}>
                                {/* Capa Decorativa 3 (Fondo) */}
                                {validImages.length > 2 && (
                                    <div className="absolute top-0 left-0 w-full h-full bg-white rounded-xl shadow-lg transform rotate-[-8deg] translate-x-[-15px] border-4 border-white z-0 transition-transform duration-500 group-hover:rotate-[-12deg] group-hover:translate-x-[-30px]">
                                         <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg overflow-hidden opacity-40"></div>
                        </div>
                                )}
                                
                                {/* Capa Decorativa 2 (Medio) */}
                                {validImages.length > 1 && validImages[1] && (
                                    <div className="absolute top-0 left-0 w-full h-full bg-white rounded-xl shadow-xl transform rotate-[5deg] translate-x-[15px] border-4 border-white z-10 transition-transform duration-500 group-hover:rotate-[8deg] group-hover:translate-x-[30px]">
                                        <div className="w-full h-full rounded-lg overflow-hidden">
                                            {loadingImages.has(validImages[1]) ? (
                                                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                                    <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                                                </div>
                                            ) : (
                                                <img 
                                                    src={validImages[1]} 
                                                    className="w-full h-full object-cover opacity-90 filter contrast-75" 
                                                    alt="Imagen secundaria del servicio"
                                                    onError={() => handleImageError(validImages[1])}
                                                    onLoad={() => handleImageLoad(validImages[1])}
                                                    onLoadStart={() => handleImageLoadStart(validImages[1])}
                                                    loading="lazy"
                                                />
                                            )}
                                            {failedImages.has(validImages[1]) && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                                                    <Image className="w-8 h-8 text-gray-400" strokeWidth={1.5} />
                                                </div>
                                            )}
                                    </div>
                        </div>
                                )}

                                {/* Foto Principal (Frente) */}
                                <div className="relative z-20 w-full aspect-[4/3] bg-white rounded-xl shadow-2xl transform transition-all duration-500 border-[6px] border-white overflow-hidden group-hover:-translate-y-2">
                                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent z-10 pointer-events-none" />
                                    {validImages[0] ? (
                                        <>
                                            {loadingImages.has(validImages[0]) && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 z-10">
                                                    <div className="w-10 h-10 border-3 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                                                </div>
                                            )}
                                            <img 
                                                src={validImages[0]} 
                                                alt="Imagen principal del servicio"
                                                className={`w-full h-full object-cover transition-opacity duration-300 ${
                                                    loadingImages.has(validImages[0]) ? 'opacity-0' : 'opacity-100'
                                                }`}
                                                onError={() => handleImageError(validImages[0])}
                                                onLoad={() => handleImageLoad(validImages[0])}
                                                onLoadStart={() => handleImageLoadStart(validImages[0])}
                                                loading="eager"
                                            />
                                            {failedImages.has(validImages[0]) && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                                                    <div className="text-center px-4">
                                                        <Image className="w-14 h-14 text-gray-400 mx-auto mb-3" strokeWidth={1.5} />
                                                        <p className="text-sm text-gray-500 font-medium">Imagen no disponible</p>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 flex items-center justify-center">
                                            <div className="text-center px-6">
                                                <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                                                    <Image className="w-10 h-10 text-gray-400" strokeWidth={1.5} />
                                                </div>
                                                <p className="text-base font-medium text-gray-700 mb-1">Sin imágenes disponibles</p>
                                                <p className="text-sm text-gray-500">Este servicio aún no tiene fotos</p>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Badge discreto con indicadores - Estilo homepage */}
                                    {validImages.length > 1 && (
                                        <div 
                                            className="absolute top-3 right-3 z-30 pointer-events-none"
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
                                                {validImages.length} {validImages.length === 1 ? 'foto' : 'fotos'}
                                            </span>
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '3px',
                                                }}
                                            >
                                                {validImages.slice(0, 5).map((_, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="rounded-full transition-all"
                                                        style={{
                                                            height: '3px',
                                                            width: '3px',
                                                            backgroundColor: 'rgba(34, 34, 34, 0.4)',
                                                        }}
                                                    />
                                                ))}
                                                {validImages.length > 5 && (
                                                    <span
                                                        style={{
                                                            fontSize: '8px',
                                                            color: 'rgba(34, 34, 34, 0.6)',
                                                            marginLeft: '2px',
                                                        }}
                                                    >
                                                        +{validImages.length - 5}
                                                    </span>
                                                )}
                                            </div>
                            </div>
                                    )}
                                </div>
                        </div>

                            {/* RESEÑAS O ESTADO VACÍO - ESTILO AIRBNB */}
                            <div className="animate-fade-in-up">
                                {finalReviews.length > 0 ? (
                                    <>
                                        {/* Badge Guest Favorite - Imágenes correctas */}
                                        {finalRating >= 4.5 && finalReviews.length >= 3 && (
                                            <div className="mb-6">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="flex items-center gap-1.5">
                                                        <picture>
                                                            <source srcSet="https://a0.muscache.com/im/pictures/airbnb-platform-assets/AirbnbPlatformAssets-GuestFavorite/original/33b80859-e87e-4c86-841c-645c786ba4c1.png?im_w=240 1x" media="(min-width: 0px)" />
                                                            <img 
                                                                src="https://a0.muscache.com/im/pictures/airbnb-platform-assets/AirbnbPlatformAssets-GuestFavorite/original/33b80859-e87e-4c86-841c-645c786ba4c1.png?im_w=720" 
                                                                alt="Guest favorite" 
                                                                className="h-[105px] w-auto object-contain"
                                                                style={{ width: '68.97058823529412px', height: '105px' }}
                                                                decoding="async"
                                                            />
                                                        </picture>
                                                        <picture>
                                                            <source srcSet="https://a0.muscache.com/im/pictures/airbnb-platform-assets/AirbnbPlatformAssets-GuestFavorite/original/059619e1-1751-42dd-84e4-50881483571a.png?im_w=240 1x" media="(min-width: 0px)" />
                                                            <img 
                                                                src="https://a0.muscache.com/im/pictures/airbnb-platform-assets/AirbnbPlatformAssets-GuestFavorite/original/059619e1-1751-42dd-84e4-50881483571a.png?im_w=720" 
                                                                alt="Guest favorite" 
                                                                className="h-[105px] w-auto object-contain"
                                                                style={{ width: '68.97058823529412px', height: '105px' }}
                                                                decoding="async"
                                                            />
                                                        </picture>
                                                    </div>
                                                    <div className="text-[15px] font-semibold text-gray-900 leading-[1.4]">
                                                        Guest favorite
                                                    </div>
                                                </div>
                                                <div className="text-[15px] text-gray-700 leading-[1.5]">
                                                    This home is a guest favorite based on ratings, reviews, and reliability
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* Header de reseñas - Estilo Airbnb */}
                                        <div className="mb-6">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Star className="w-5 h-5 fill-gray-900 text-gray-900" />
                                                <span 
                                                    style={{
                                                        fontSize: '18px',
                                                        lineHeight: '24px',
                                                        fontWeight: 600,
                                                        fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                        color: 'rgb(34, 34, 34)',
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
                                                        fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                        color: 'rgb(34, 34, 34)',
                                                    }}
                                                >
                                                    {finalReviews.length} {finalReviews.length === 1 ? 'reseña' : 'reseñas'}
                                                </span>
                                                            </div>
                                                        </div>

                                        {/* Scroll horizontal en desktop con flechas */}
                                        <div className="relative">
                                            {/* Flecha izquierda */}
                                            <button
                                                onClick={() => scrollReviews('left', false)}
                                                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white border border-gray-300 rounded-full p-2 shadow-md hover:shadow-lg transition-shadow hover:bg-gray-50"
                                                aria-label="Scroll izquierda"
                                            >
                                                <ChevronLeft className="w-5 h-5 text-gray-700" />
                                            </button>
                                            
                                            {/* Flecha derecha */}
                                            <button
                                                onClick={() => scrollReviews('right', false)}
                                                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white border border-gray-300 rounded-full p-2 shadow-md hover:shadow-lg transition-shadow hover:bg-gray-50"
                                                aria-label="Scroll derecha"
                                            >
                                                <ChevronRight className="w-5 h-5 text-gray-700" />
                                            </button>
                                            
                                            <div 
                                                ref={reviewsScrollRefDesktop}
                                                className="flex gap-4 overflow-x-auto scrollbar-hide w-full snap-x snap-mandatory pl-8 pr-10"
                                                style={{ paddingBottom: '62px' }}
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
                                                // Calcular si el texto necesita truncarse (aproximadamente 4 líneas con line-height 1.25rem = ~150 caracteres)
                                                const shouldTruncate = reviewText.length > 150;
                                                const isExpanded = expandedReviews[review.id || idx] || false;
                                                const rating = review.rating || review.score || 5;
                                                
                                                return (
                                                    <div key={review.id || idx} className="flex-shrink-0 w-[85%] max-w-sm snap-start pr-4">
                                                        {/* Estructura vertical exacta de Airbnb con marco - Mismo que móvil */}
                                                        <div className={`flex flex-col bg-white border border-gray-200 rounded-lg p-4 shadow-sm ${isExpanded ? 'min-h-[200px]' : 'h-[200px]'}`}>
                                                            {/* 1. Arriba: Estrellas y fecha */}
                                                            <div className="mb-2">
                                                                <span role="img" aria-label={`Valoración: ${rating} estrellas`}>
                                                                    <div className="flex gap-[0.0625rem] inline-flex items-center">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star 
                                                                    key={i} 
                                                                                className={`w-[0.5625rem] h-[0.5625rem] flex-shrink-0 ${i < rating ? 'fill-gray-900 text-gray-900' : 'fill-gray-200 text-gray-200'}`} 
                                                                />
                                                            ))}
                                                        </div>
                                                                </span>
                                                                <span className="text-xs text-gray-500">, </span>
                                                                <span aria-hidden="true" className="text-xs text-gray-500"> · </span>
                                                                <span className="text-xs text-gray-500">{formattedDate}</span>
                                                    </div>
                                                    
                                                            {/* 2. Medio: Texto de la review */}
                                                            <div className="mb-3 flex-1">
                                                                <div 
                                                                    style={{
                                                                        lineHeight: '1.25rem',
                                                                        overflow: isExpanded ? 'visible' : 'hidden',
                                                                        textOverflow: isExpanded ? 'clip' : 'ellipsis',
                                                                        display: isExpanded ? 'block' : '-webkit-box',
                                                                        WebkitLineClamp: isExpanded ? 'unset' : 4,
                                                                        WebkitBoxOrient: 'vertical' as 'vertical',
                                                                    }}
                                                                >
                                                                    <span>
                                                                        <span className="text-[15px] text-gray-700 leading-[1.25rem]">
                                                                            {reviewText}
                                                                        </span>
                                                                    </span>
                                                                </div>
                                                                <div></div>
                                                                {shouldTruncate && (
                                                                    <button
                                                                        role="button"
                                                                        type="button"
                                                                        onClick={() => setExpandedReviews(prev => ({ ...prev, [review.id || idx]: !prev[review.id || idx] }))}
                                                                        className="mt-2 text-[15px] font-semibold text-gray-900 underline hover:no-underline leading-[1.4]"
                                                                    >
                                                                        {isExpanded ? 'Mostrar menos' : 'Mostrar más'}
                                                                    </button>
                                                                )}
                                                            </div>
                                                            
                                                            {/* Imágenes de la reseña */}
                                                        {review.imageUrls && review.imageUrls.length > 0 && (
                                                                <div className="mt-3 mb-3">
                                                                    <button
                                                                        type="button"
                                                                        className="text-[15px] font-semibold text-gray-900 underline hover:no-underline leading-[1.4]"
                                                                        onClick={() => {
                                                                            setShowReviewImages(prev => ({
                                                                                ...prev,
                                                                                [review.id || idx]: !prev[review.id || idx]
                                                                            }));
                                                                        }}
                                                                    >
                                                                        Ver fotos
                                                                    </button>
                                                                    {showReviewImages[review.id || idx] && (
                                                                        <div className="grid grid-cols-4 gap-2 w-full mt-2">
                                                                            {review.imageUrls.map((img: string, imgIdx: number) => (
                                                                                <div key={imgIdx} className="relative w-full aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                                                                        <img 
                                                                            src={img} 
                                                                            alt={`Foto reseña ${imgIdx + 1}`} 
                                                                                        className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                                                                        onClick={() => {
                                                                                            // TODO: Abrir lightbox con la imagen
                                                                                            console.log('Abrir imagen:', img);
                                                                                        }}
                                                                        />
                                                                    </div>
                                                                ))}
                                        </div>
                                    )}
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
                                    /* ESTADO SIN RESEÑAS */
                                    <div className="bg-gray-50/80 rounded-2xl p-8 text-center border border-gray-100">
                                        <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-100">
                                            <Star className="w-7 h-7 text-gray-300 fill-gray-100" />
                                </div>
                                        <h3 
                                            style={{
                                                fontSize: '16px',
                                                lineHeight: '20px',
                                                fontWeight: 600,
                                                fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                color: 'rgb(34, 34, 34)',
                                                marginBottom: '8px',
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
                                                fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                color: 'rgb(113, 113, 113)',
                                                maxWidth: '20rem',
                                                margin: '0 auto',
                                                marginTop: '8px',
                                                padding: 0,
                                            }}
                                        >
                                            Este es un servicio nuevo en Inspecciono. <br/>
                                            <span style={{ fontWeight: 600, color: 'rgb(55, 65, 81)' }}>¡Sé el primero en probarlo y compartir tu experiencia!</span>
                                        </p>
                        </div>
                    )}
                            </div>
                        </div>

                        {/* COLUMNA DERECHA: INFO + RESERVA */}
                        <div className="relative sticky top-8 self-start">
                            {/* Header Info Compacto */}
                            <div className="mb-6 border-b border-gray-100 pb-6">
                                <div className="flex items-center justify-between mb-2">
                                    <h1 
                                        style={{
                                            fontSize: '22px',
                                            lineHeight: '26px',
                                            fontWeight: 600,
                                            fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                            color: 'rgb(34, 34, 34)',
                                            margin: 0,
                                            padding: 0,
                                        }}
                                    >
                                        {serviceTypeName}
                                    </h1>
                                    <div className="flex gap-2">
                                        <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                                            <Share2 className="w-4 h-4" />
                                        </button>
                                        <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors" onClick={() => setIsFavorite(!isFavorite)}>
                                            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                                        </button>
                                    </div>
                                </div>
                                <div 
                                    className="flex items-center gap-2 mb-4"
                                    style={{
                                        fontSize: '14px',
                                        lineHeight: '20px',
                                        fontWeight: 400,
                                        fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                        color: 'rgb(113, 113, 113)',
                                    }}
                                >
                                    <span>Anfitrión: <span style={{ color: 'rgb(34, 34, 34)', fontWeight: 500 }}>{finalExpertName}</span></span>
                                    {/* Ubicación del experto */}
                                    {(finalService?.expert?.city || finalService?.expert?.country) && (
                                        <>
                                            <span>·</span>
                                            <div className="flex items-center gap-1.5">
                                                <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                                <span>
                                                    {(() => {
                                                        const city = finalService?.expert?.city;
                                                        const country = finalService?.expert?.country;
                                                        const countryName = country ? getCountryName(country) : '';
                                                        
                                                        const locationParts: string[] = [];
                                                        if (city) locationParts.push(city);
                                                        if (countryName) locationParts.push(countryName);
                                                        
                                                        return locationParts.length > 0 
                                                            ? locationParts.join(', ')
                                                            : (countryName || '');
                                                    })()}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                {finalCompletedSearches > 0 && (
                                    <>
                                        <span>·</span>
                                            <span style={{ color: 'rgb(34, 197, 94)', fontWeight: 500 }}>{finalCompletedSearches} trabajos hechos</span>
                                    </>
                                )}
                                </div>
                                
                                {/* ✅ HORARIO AL PRINCIPIO - Desktop */}
                                {finalAvailability && (
                                    <div className="mt-4">
                                        <div 
                                            className="flex flex-wrap items-center gap-1.5"
                                            style={{
                                                fontSize: '13px',
                                                lineHeight: '18px',
                                                fontWeight: 400,
                                                fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                color: 'rgb(34, 34, 34)',
                                            }}
                                        >
                                            {finalAvailability.daysOfWeek?.slice(0, 7).map((day: string, idx: number) => (
                                                <span 
                                                    key={idx} 
                                                    className="px-2 py-1 bg-gray-100 rounded-md text-gray-700 font-medium"
                                                    style={{
                                                        fontSize: '12px',
                                                        lineHeight: '16px',
                                                    }}
                                                >
                                                    {formatDay(day)}
                                                </span>
                                            ))}
                                            {finalAvailability.startTime && finalAvailability.endTime && (
                                                <>
                                                    <span className="text-gray-400 mx-1">·</span>
                                                    <span className="text-gray-700 font-medium">
                                                        {finalAvailability.startTime.substring(0, 5)} - {finalAvailability.endTime.substring(0, 5)}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Barra de separación discreta */}
                            <div className="border-t border-gray-200 my-6"></div>

                            {/* Sección "Revisor" estilo Airbnb - Desktop */}
                            <div className="mb-4 px-6">
                                <div className="flex items-start gap-4">
                                    <div className="relative flex-shrink-0" style={{ height: '40px', width: '40px' }}>
                                        <button
                                            type="button"
                                            aria-label={`${finalExpertName} es revisor verificado de inspecciono.com. Obtén más información sobre ${finalExpertName}.`}
                                            className="relative w-full h-full border-none bg-transparent p-0 cursor-pointer"
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
                                                    <linearGradient id="superhost-gradient" x1="8.5%" x2="92.18%" y1="17.16%" y2="17.16%">
                                                        <stop offset="0" stopColor="#e61e4d"></stop>
                                                        <stop offset=".5" stopColor="#e31c5f"></stop>
                                                        <stop offset="1" stopColor="#d70466"></stop>
                                                    </linearGradient>
                                                    <path fill="#fff" d="M9.93 0c.88 0 1.6.67 1.66 1.52l.01.15v2.15c0 .54-.26 1.05-.7 1.36l-.13.08-3.73 2.17a3.4 3.4 0 1 1-2.48 0L.83 5.26A1.67 1.67 0 0 1 0 3.96L0 3.82V1.67C0 .79.67.07 1.52 0L1.67 0z"></path>
                                                    <path fill="url(#superhost-gradient)" d="M5.8 8.2a2.4 2.4 0 0 0-.16 4.8h.32a2.4 2.4 0 0 0-.16-4.8zM9.93 1H1.67a.67.67 0 0 0-.66.57l-.01.1v2.15c0 .2.1.39.25.52l.08.05L5.46 6.8c.1.06.2.09.29.1h.1l.1-.02.1-.03.09-.05 4.13-2.4c.17-.1.3-.29.32-.48l.01-.1V1.67a.67.67 0 0 0-.57-.66z"></path>
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
                                                fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                            }}
                                        >
                                            <div style={{ fontSize: '14px', lineHeight: '20px', fontWeight: 400, color: 'rgb(34, 34, 34)', fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif' }}>
                                                Revisor: {finalExpertName}
                                            </div>
                                            <div className="mt-1" style={{ fontSize: '14px', lineHeight: '20px', fontWeight: 400, color: 'rgb(113, 113, 113)', fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif' }}>
                                                Revisor verificado de inspecciono.com
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Sección "Entre el 1% de los que más gustan" estilo Airbnb */}
                            {finalRating >= 4.5 && finalReviews.length >= 3 && (
                                <div className="mb-6 px-5">
                                    <div className="mb-3">
                                <h3 
                                    style={{
                                        fontSize: '16px',
                                        lineHeight: '20px',
                                        fontWeight: 600,
                                        color: 'rgb(34, 34, 34)',
                                                fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                        marginBottom: '8px',
                                        marginTop: 0,
                                        padding: 0,
                                    }}
                                >
                                            Entre el 1% de los que más gustan
                                </h3>
                                    <p 
                                        style={{
                                                fontSize: '15px',
                                                lineHeight: '22px',
                                            fontWeight: 400,
                                                color: 'rgb(34, 34, 34)',
                                            fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                            margin: 0,
                                            padding: 0,
                                        }}
                                    >
                                            Este es uno de los favoritos de los viajeros, según sus valoraciones, evaluaciones y su fiabilidad.
                                        </p>
                                    </div>
                                </div>
                            )}
                            
                            {/* Barra de separación discreta */}
                            <div className="border-t border-gray-200 my-6"></div>
                            
                            {/* Descripción del tipo de habitación/servicio */}
                            {finalService?.serviceTypeName && (
                                <div className="mb-6 px-5">
                                    <p 
                                        style={{
                                            fontSize: '15px',
                                            lineHeight: '22px',
                                            fontWeight: 400,
                                            color: 'rgb(34, 34, 34)',
                                            fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                            margin: 0,
                                            padding: 0,
                                        }}
                                    >
                                        {finalService?.serviceTypeName || 'Servicio'} con acceso a zonas comunes.
                                    </p>
                            </div>
                            )}

                            {/* Barra de separación discreta */}
                            <div className="border-t border-gray-200 my-6"></div>

                            {/* Descripción Oficial (ServiceTypeDescription) */}
                            <div className="mb-8">
                                    <h3 
                                        style={{
                                        fontSize: '16px',
                                            lineHeight: '20px',
                                            fontWeight: 600,
                                            fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                            color: 'rgb(34, 34, 34)',
                                        marginBottom: '8px',
                                            marginTop: 0,
                                            padding: 0,
                                        }}
                                    >
                                    Acerca del servicio
                                    </h3>
                                            <p 
                                        className="whitespace-pre-line"
                                                style={{
                                                    fontSize: '14px',
                                                    lineHeight: '20px',
                                                    fontWeight: 400,
                                                    fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                    color: 'rgb(113, 113, 113)',
                                                    margin: 0,
                                                    padding: 0,
                                                }}
                                            >
                                        {finalServiceTypeDescription}
                                    </p>
                                </div>

                            {/* Información del Experto (User Conditions) */}
                            {finalUserConditions && (
                                <div className="mb-4">
                                    <h3 
                                        style={{
                                            fontSize: '14px',
                                            lineHeight: '20px',
                                            fontWeight: 600,
                                            fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                            color: 'rgb(34, 34, 34)',
                                            marginBottom: '4px',
                                            marginTop: 0,
                                            padding: 0,
                                        }}
                                    >
                                        Detalles del experto
                                    </h3>
                                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                                            <p 
                                                className="whitespace-pre-line"
                                                    style={{
                                                    fontSize: '14px',
                                                    lineHeight: '20px',
                                                    fontWeight: 400,
                                                            fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                    color: 'rgb(113, 113, 113)',
                                                    margin: 0,
                                                    padding: 0,
                                                }}
                                            >
                                                {finalUserConditions}
                                            </p>
                                        </div>
                                    </div>
                                )}

                            {/* Qué incluye mejorado - Diseño profesional - Desktop */}
                            {finalDeliverableTypes.length > 0 && (
                                <>
                                    <div className="mb-6 px-5">
                                        <h3 
                                        style={{
                                            fontSize: '16px',
                                            lineHeight: '20px',
                                            fontWeight: 600,
                                                color: 'rgb(34, 34, 34)',
                                            fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
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
                                                        <Icon className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                                    <span 
                                        style={{
                                                                fontSize: '14px',
                                            lineHeight: '20px',
                                            fontWeight: 400,
                                            color: 'rgb(34, 34, 34)',
                                                                fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
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
                                    <div className="h-[1px] bg-gray-200 mb-6 mx-5" />
                                </>
                            )}

                            {/* ✅ MAPA DE RANGO DE TRABAJO DEL EXPERTO - Desktop */}
                            {expertLocation ? (
                                <div className="mb-6 px-5">
                                    <h3 
                                        style={{
                                            fontSize: '16px',
                                            lineHeight: '20px',
                                            fontWeight: 600,
                                            color: 'rgb(34, 34, 34)',
                                            fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                            marginBottom: '8px',
                                            marginTop: 0,
                                            padding: 0,
                                        }}
                                    >
                                        Zona de cobertura
                                    </h3>
                                    {expertRange ? (
                                        <p 
                                            style={{
                                                fontSize: '14px',
                                                lineHeight: '20px',
                                                fontWeight: 400,
                                                color: 'rgb(113, 113, 113)',
                                                fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                marginBottom: '12px',
                                                marginTop: 0,
                                                padding: 0,
                                            }}
                                        >
                                            El experto cubre un radio de {expertRange} km desde su ubicación
                                        </p>
                                    ) : (
                                        <p 
                                            style={{
                                                fontSize: '14px',
                                                lineHeight: '20px',
                                                fontWeight: 400,
                                                color: 'rgb(113, 113, 113)',
                                                fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                marginBottom: '12px',
                                                marginTop: 0,
                                                padding: 0,
                                            }}
                                        >
                                            Ubicación del experto
                                        </p>
                                    )}
                                    <div className="h-[200px] rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                                        <AppointmentMap
                                            expertLocation={expertLocation}
                                            expertRange={expertRange || 25}
                                            expertCountry={expertCountry}
                                            className="w-full h-full"
                                            disabled={true}
                                            showSearch={false}
                                            showCountrySelector={false}
                                            showExpertMarker={true}
                                            defaultZoom={9}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="mb-8 px-5">
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                                        <p className="text-sm text-yellow-800">
                                            ℹ️ La información de ubicación del experto no está disponible en este momento.
                                        </p>
                                    </div>
                                </div>
                            )}



                            {/* TARJETA DE RESERVA COMPACTA */}
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                                <div className="flex flex-col mb-6">
                                    <div className="flex items-baseline gap-1 mb-1">
                                        <span className="text-[22px] font-semibold text-gray-900 leading-[1.3]" aria-label={`${formatPrice(finalPrice)} € por 2 noches`}>{formatPrice(finalPrice)} €</span>
                                    </div>
                                    <span className="text-[15px] text-gray-600 font-normal leading-[1.4]" aria-hidden="true">por 2 noches</span>
                                </div>

                                    {isAuthenticated ? (
                                        <button
                                            onClick={handleReserveClick}
                                            className="relative w-full py-3 bg-gradient-to-r from-[#E61E4D] via-[#E31C5F] to-[#D70466] hover:from-[#D70466] hover:via-[#E61E4D] hover:to-[#E31C5F] text-white text-[16px] font-semibold rounded-lg transition-all duration-200 overflow-hidden"
                                            style={{
                                                backgroundPosition: 'calc((100 - var(--mouse-x, 0)) * 1%) calc((100 - var(--mouse-y, 0)) * 1%)',
                                            }}
                                            onMouseMove={(e) => {
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                const x = ((e.clientX - rect.left) / rect.width) * 100;
                                                const y = ((e.clientY - rect.top) / rect.height) * 100;
                                                e.currentTarget.style.setProperty('--mouse-x', x.toString());
                                                e.currentTarget.style.setProperty('--mouse-y', y.toString());
                                            }}
                                        >
                                            <span className="relative z-10">Reservar</span>
                                        </button>
                                    ) : (
                                    <div className="relative">
                                        <div ref={googleButtonRefDesktop} className="absolute inset-0 opacity-0 z-10" />
                                            <button
                                                onClick={handleGoogleSignIn}
                                                disabled={!isGoogleReady}
                                                className="relative w-full py-3 bg-gradient-to-r from-[#E61E4D] via-[#E31C5F] to-[#D70466] hover:from-[#D70466] hover:via-[#E61E4D] hover:to-[#E31C5F] text-white text-[16px] font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 overflow-hidden"
                                                style={{
                                                    backgroundPosition: 'calc((100 - var(--mouse-x, 0)) * 1%) calc((100 - var(--mouse-y, 0)) * 1%)',
                                                }}
                                                onMouseMove={(e) => {
                                                    const rect = e.currentTarget.getBoundingClientRect();
                                                    const x = ((e.clientX - rect.left) / rect.width) * 100;
                                                    const y = ((e.clientY - rect.top) / rect.height) * 100;
                                                    e.currentTarget.style.setProperty('--mouse-x', x.toString());
                                                    e.currentTarget.style.setProperty('--mouse-y', y.toString());
                                                }}
                                            >
                                                {isAuthenticating ? (
                                                    <>
                                                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                                        <span className="relative z-10 flex items-center gap-1">
                                                            <span className="loading-dot" style={{ animationDelay: '0ms' }}>.</span>
                                                            <span className="loading-dot" style={{ animationDelay: '150ms' }}>.</span>
                                                            <span className="loading-dot" style={{ animationDelay: '300ms' }}>.</span>
                                                        </span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <GoogleIcon />
                                                        <span className="relative z-10">Iniciar sesión</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    )}

                                <p className="mt-3 text-center text-xs text-gray-400">
                                    No se te cobrará nada todavía
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Lightbox */}
            <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
                <DialogContent className="max-w-6xl w-full p-0 bg-black border-none">
                    <div className="relative h-[85vh]">
                        <button
                            onClick={() => setIsLightboxOpen(false)}
                            className="absolute top-4 right-4 z-50 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                        >
                            <X className="w-6 h-6 text-white" />
                        </button>
                        
                        {validImages.length > 1 && (
                            <>
                                <button
                                    onClick={() => handleLightboxNavigation('prev')}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 z-50 w-12 h-12 flex items-center justify-center rounded-full bg-white shadow-lg hover:scale-105 transition-transform"
                                >
                                    <ChevronLeft className="w-6 h-6 text-gray-900" />
                                </button>
                                <button
                                    onClick={() => handleLightboxNavigation('next')}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 z-50 w-12 h-12 flex items-center justify-center rounded-full bg-white shadow-lg hover:scale-105 transition-transform"
                                >
                                    <ChevronRight className="w-6 h-6 text-gray-900" />
                                </button>
                            </>
                        )}

                        <div className="h-full flex items-center justify-center p-8">
                            {validImages[lightboxIndex] ? (
                                <>
                                    {loadingImages.has(validImages[lightboxIndex]) && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                                            <div className="w-12 h-12 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    )}
                                    <img
                                        src={validImages[lightboxIndex]}
                                        alt={`Foto ${lightboxIndex + 1} del servicio`}
                                        className={`max-w-full max-h-full object-contain transition-opacity duration-300 ${
                                            loadingImages.has(validImages[lightboxIndex]) ? 'opacity-0' : 'opacity-100'
                                        }`}
                                        onError={() => handleImageError(validImages[lightboxIndex])}
                                        onLoad={() => handleImageLoad(validImages[lightboxIndex])}
                                        onLoadStart={() => handleImageLoadStart(validImages[lightboxIndex])}
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
        </div>
        </>
    );
}

