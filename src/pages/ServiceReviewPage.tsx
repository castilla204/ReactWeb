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
    
    console.log('🖼️ ServiceReviewPage - Imágenes finales:', {
      serviceId,
      finalServiceImageUrls: finalService?.imageUrls,
      serviceImageUrls,
      finalImages,
      finalImagesLength: finalImages.length,
    });
    
    const finalExpertName = finalService?.expert?.user?.name || expertName || 'Experto';
    const finalExpertPicture = finalService?.expert?.profilePictureUrl || finalService?.expert?.user?.profilePictureUrl || expertProfilePicture;
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
    
    // Estado para "Leer más" en descripción
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const shouldTruncateDescription = (displayMainDescription || '').length > 150;

    // Estado para "Leer más" en detalles del experto
    const [isUserConditionsExpanded, setIsUserConditionsExpanded] = useState(false);
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
            setLightboxIndex(prev => (prev === 0 ? finalImages.length - 1 : prev - 1));
        } else {
            setLightboxIndex(prev => (prev === finalImages.length - 1 ? 0 : prev + 1));
        }
    };

    // Navegación del carrusel móvil mejorada
    const handleMobileCarouselScroll = useCallback(() => {
        if (carouselRef.current) {
            const scrollLeft = carouselRef.current.scrollLeft;
            const width = carouselRef.current.offsetWidth;
            const newIndex = Math.round(scrollLeft / width);
            if (newIndex >= 0 && newIndex < finalImages.length) {
                setMobileImageIndex(prevIndex => {
                    if (prevIndex !== newIndex) {
                        return newIndex;
                    }
                    return prevIndex;
                });
            }
        }
    }, [finalImages.length]);

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

    const heroImage = finalImages[0] || '';
    const gridImages = finalImages.slice(1, 5);

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
                    {/* Botones de acción móvil sin fondo */}
                    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 pointer-events-none">
                        <button 
                            onClick={onBack}
                            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors pointer-events-auto"
                        >
                            <ArrowLeft className="w-5 h-5 text-white drop-shadow-lg" />
                        </button>
                        <div className="flex items-center gap-2 pointer-events-auto">
                            <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors">
                                <Share2 className="w-5 h-5 text-white drop-shadow-lg" />
                            </button>
                            <button 
                                onClick={() => setIsFavorite(!isFavorite)}
                                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
                            >
                                <Heart className={`w-5 h-5 drop-shadow-lg ${isFavorite ? 'fill-red-500 text-red-500' : 'text-white'}`} />
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
                            {finalImages.length > 0 ? finalImages.map((img, idx) => (
                                <div 
                                    key={idx}
                                    className="relative w-full flex-shrink-0 aspect-[4/3] bg-gray-100 snap-start"
                                    onClick={() => handleImageClick(idx)}
                                >
                                    <img 
                                        src={img} 
                                        alt={`Imagen ${idx + 1}`} 
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            console.error('❌ Error cargando imagen:', img);
                                            (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                    />
                                </div>
                            )) : (
                                <div className="w-full aspect-[4/3] bg-gray-100 flex items-center justify-center">
                                    <div className="text-center">
                                        <Image className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                                        <p className="text-sm text-gray-400">Sin imagen disponible</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Indicadores de imágenes */}
                    {finalImages.length > 1 && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
                            {finalImages.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${
                                        idx === mobileImageIndex 
                                            ? 'w-6 bg-white' 
                                            : 'w-1.5 bg-white/50'
                                    }`}
                                />
                            ))}
                        </div>
                    )}
                    
                    {/* Badge de contador de fotos */}
                    {finalImages.length > 1 && (
                        <div className="absolute top-20 right-4 bg-black/70 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1.5 z-20">
                            <Grid3X3 className="w-3.5 h-3.5" />
                            <span>{finalImages.length} fotos</span>
                        </div>
                    )}

                    {/* Card blanco mejorado con mejor espaciado */}
                    <div className="relative -mt-12 bg-white rounded-t-3xl pt-8 pb-36 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
                        {/* Título y ubicación centrados estilo Airbnb - Tipografía exacta */}
                        <div className="mb-6 px-5 text-center">
                            <h1 className="text-[22px] font-semibold text-gray-900 leading-[1.3] mb-3 tracking-[-0.01em]">
                                {serviceTypeName} por {finalExpertName}
                            </h1>
                            
                            {/* Ubicación y tipo centrados */}
                            <div className="mb-3">
                                <h2 className="text-[15px] text-gray-600 font-normal leading-[1.4]">
                                    {finalService?.serviceTypeName || 'Servicio'} en {finalService?.expert?.country === 'ES' ? 'España' : finalService?.expert?.country || 'España'}
                                </h2>
                            </div>
                            
                            {/* Características principales en lista horizontal estilo Airbnb */}
                            {(finalService?.durationInHours || finalService?.selectedDeliverableTypes?.length) && (
                                <div className="mb-4">
                                    <ol className="flex items-center justify-center gap-2 flex-wrap list-none">
                                        {finalService?.durationInHours && (
                                            <li className="text-[15px] text-gray-600 font-normal leading-[1.4]">
                                                {Math.ceil(finalService.durationInHours / 24)} {Math.ceil(finalService.durationInHours / 24) === 1 ? 'día' : 'días'}
                                            </li>
                                        )}
                                        {finalService?.durationInHours && finalService?.selectedDeliverableTypes?.[0] && (
                                            <li className="text-[15px] text-gray-600 font-normal">·</li>
                                        )}
                                        {finalService?.selectedDeliverableTypes?.[0] && (
                                            <li className="text-[15px] text-gray-600 font-normal leading-[1.4]">
                                                {finalService.selectedDeliverableTypes[0].displayName || 'Informe detallado'}
                                            </li>
                                        )}
                                    </ol>
                                </div>
                            )}
                            
                    </div>
                    
                    {/* Sección "Quédate con [nombre]" estilo Airbnb */}
                    <div className="mb-6 px-5">
                        <div className="flex items-start gap-3">
                            <Avatar className="w-12 h-12 flex-shrink-0 border-2 border-gray-200">
                                <AvatarImage src={finalExpertPicture} alt={finalExpertName} />
                                <AvatarFallback className="bg-gray-900 text-white font-bold text-sm">
                                    {finalExpertName.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <div className="text-[15px] text-gray-700 leading-[1.4]">
                                    <span className="font-semibold">Quédate con {finalExpertName}</span>
                                    <ol className="inline-flex items-center gap-1.5 list-none ml-2">
                                        <li className="text-[15px] font-normal text-gray-900">Superanfitrión</li>
                                        {finalService?.expert?.createdAt && (
                                            <>
                                                <li className="text-[15px] text-gray-600">·</li>
                                                <li className="text-[15px] text-gray-600 font-normal">
                                                    {(() => {
                                                        const months = Math.floor((Date.now() - new Date(finalService.expert.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30));
                                                        const years = Math.floor(months / 12);
                                                        return years > 0 ? `${years} ${years === 1 ? 'año' : 'años'} de experiencia` : `${months} ${months === 1 ? 'mes' : 'meses'} de experiencia`;
                                                    })()}
                                                </li>
                                            </>
                                        )}
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Sección "Entre el 1% de los que más gustan" estilo Airbnb */}
                    {finalRating >= 4.5 && finalReviews.length >= 3 && (
                        <div className="mb-6 px-5">
                            <div className="mb-3">
                                <h3 className="text-[15px] font-semibold text-gray-900 mb-2 leading-[1.4]">
                                    Entre el 1% de los que más gustan
                                </h3>
                                <p className="text-[15px] text-gray-700 font-normal leading-[1.5]">
                                    Este es uno de los favoritos de los viajeros, según sus valoraciones, evaluaciones y su fiabilidad.
                                </p>
                            </div>
                        </div>
                    )}
                    
                    {/* Descripción del tipo de habitación/servicio */}
                    <div className="mb-6 px-5">
                        <p className="text-[15px] text-gray-700 font-normal leading-[1.5]">
                            {finalService?.serviceTypeName || 'Servicio'} con acceso a zonas comunes.
                        </p>
                    </div>

                        {/* Descripción Principal Móvil mejorada - Estilo Airbnb */}
                        {displayMainDescription && (
                            <div className="mb-8 px-5" data-plugin-in-point-id="DESCRIPTION_DEFAULT" data-section-id="DESCRIPTION_DEFAULT" style={{ paddingTop: '32px', paddingBottom: '32px' }}>
                                <p className={`text-[15px] text-gray-700 leading-[1.5] whitespace-pre-line ${!isDescriptionExpanded && shouldTruncateDescription ? 'line-clamp-4' : ''}`}>
                                    {displayMainDescription}
                                </p>
                                {shouldTruncateDescription && (
                                    <button 
                                        onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                                        className="text-[15px] font-semibold text-gray-900 mt-3 underline decoration-gray-300 underline-offset-2 hover:no-underline"
                                    >
                                        {isDescriptionExpanded ? 'Leer menos' : 'Leer más'}
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Información del Experto Móvil mejorada */}
                        {showSecondaryDescription && (
                            <div className="mb-8 px-5">
                                <h3 className="text-[15px] font-semibold text-gray-900 mb-3 leading-[1.4]">Detalles del experto</h3>
                                <p className="text-[15px] text-gray-700 leading-[1.5]">
                                    {finalUserConditions}
                                </p>
                            </div>
                        )}

                        <div className="h-[1px] bg-gray-200 mb-8 mx-5" />

                        <div className="h-[1px] bg-gray-200 mb-8 mx-5" />

                        {/* GARANTÍA INSPECCIONO mejorada */}
                        <div className="mb-8 px-5">
                            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
                                {/* Cabecera de marca */}
                                <div className="flex items-center gap-1.5 mb-5">
                                    <span className="text-lg font-bold text-[#0066CC] tracking-tight">inspecciono</span>
                                    <span className="text-lg font-normal text-gray-900">protección</span>
                                </div>
                            
                                <div className="space-y-5">
                                    <div className="flex gap-4 items-start">
                                        <div className="mt-0.5 flex-shrink-0">
                                            <BadgeCheck className="w-6 h-6 text-[#0066CC] stroke-[2]" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-gray-900 text-base mb-1">Calidad verificada</h4>
                                            <p className="text-[15px] text-gray-600 leading-relaxed">
                                                Auditamos manualmente la revisión para asegurar estándares profesionales.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 items-start">
                                        <div className="mt-0.5 flex-shrink-0">
                                            <Lock className="w-6 h-6 text-[#0066CC] stroke-[2]" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-gray-900 text-base mb-1">Pago en custodia</h4>
                                            <p className="text-[15px] text-gray-600 leading-relaxed">
                                                Tu dinero se retiene seguro hasta que recibes el informe.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="h-[1px] bg-gray-200 mb-8 mx-5" />

                        {/* Qué incluye mejorado */}
                        {finalDeliverableTypes.length > 0 && (
                            <>
                                <div className="mb-8 px-5">
                                    <h3 className="text-lg font-bold text-gray-900 mb-5">Qué incluye</h3>
                                    <div className="flex flex-wrap gap-3">
                                        {finalDeliverableTypes.map((dt) => {
                                            const n = (dt.displayName || dt.name).toLowerCase();
                                            let Icon = FileText;
                                            if (n.includes('video')) Icon = Video;
                                            else if (n.includes('imagen') || n.includes('foto')) Icon = Image;
                                            else if (n.includes('documento') || n.includes('informe')) Icon = FileText;
                                            else if (n.includes('archivo')) Icon = File;

                                            return (
                                                <div key={dt.id} className="inline-flex items-center gap-2 bg-white text-gray-700 px-4 py-2.5 rounded-xl border-2 border-gray-200 shadow-sm hover:border-gray-300 transition-colors">
                                                    <Icon className="w-5 h-5 flex-shrink-0 text-gray-600" />
                                                    <span className="text-[15px] font-medium leading-none">{dt.displayName || dt.name}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="h-[1px] bg-gray-200 mb-8 mx-5" />
                            </>
                        )}

                        {/* Reseñas (MÓVIL - ESTILO AIRBNB EXACTO) */}
                        {finalReviews.length > 0 ? (
                            <>
                                <div className="h-px bg-gray-200 mb-6 mx-6" />
                                <div className="mb-24 px-6 w-full">
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
                                            <span className="text-[18px] font-semibold text-gray-900 leading-[1.3]">{finalRating.toFixed(1)}</span>
                                            <span className="text-[18px] text-gray-900">·</span>
                                            <span className="text-[18px] font-semibold text-gray-900 leading-[1.3]">{finalReviews.length} {finalReviews.length === 1 ? 'reseña' : 'reseñas'}</span>
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
                            <div className="mb-24 px-6 py-8 bg-gray-50/50 rounded-xl border border-dashed border-gray-200 text-center w-full mt-6">
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-gray-100">
                                    <Star className="w-6 h-6 text-gray-300 fill-gray-50" />
                                </div>
                                <h3 className="text-gray-900 font-bold text-base mb-1">Sin reseñas todavía</h3>
                                <p className="text-xs text-gray-500 max-w-[200px] mx-auto leading-relaxed">
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
                                {finalImages.length > 2 && (
                                    <div className="absolute top-0 left-0 w-full h-full bg-white rounded-xl shadow-lg transform rotate-[-8deg] translate-x-[-15px] border-4 border-white z-0 transition-transform duration-500 group-hover:rotate-[-12deg] group-hover:translate-x-[-30px]">
                                         <div className="w-full h-full bg-gray-200 rounded-lg overflow-hidden opacity-40"></div>
                        </div>
                                )}
                                
                                {/* Capa Decorativa 2 (Medio) */}
                                {finalImages.length > 1 && (
                                    <div className="absolute top-0 left-0 w-full h-full bg-white rounded-xl shadow-xl transform rotate-[5deg] translate-x-[15px] border-4 border-white z-10 transition-transform duration-500 group-hover:rotate-[8deg] group-hover:translate-x-[30px]">
                                        <div className="w-full h-full rounded-lg overflow-hidden">
                                            <img src={finalImages[1]} className="w-full h-full object-cover opacity-90 filter contrast-75" alt="Background" />
                                    </div>
                        </div>
                                )}

                                {/* Foto Principal (Frente) */}
                                <div className="relative z-20 w-full aspect-[4/3] bg-white rounded-xl shadow-2xl transform transition-all duration-500 border-[6px] border-white overflow-hidden group-hover:-translate-y-2">
                                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent z-10 pointer-events-none" />
                                    {finalImages[0] ? (
                                        <img 
                                            src={finalImages[0]} 
                                            alt="Principal"
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                console.error('❌ Error cargando imagen:', finalImages[0]);
                                                (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                            <div className="text-center">
                                                <Image className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                                                <p className="text-sm text-gray-400">Sin imagen disponible</p>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Badge de contador de fotos */}
                                    {finalImages.length > 1 && (
                                        <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-white px-3.5 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1.5 transform transition-transform group-hover:scale-105 border border-white/10 z-20">
                                            <Grid3X3 className="w-3.5 h-3.5" />
                                            <span>+{finalImages.length - 1} fotos</span>
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
                                                <span className="text-[18px] font-bold text-gray-900">{finalRating.toFixed(1)}</span>
                                                <span className="text-[18px] text-gray-900">·</span>
                                                <span className="text-[18px] font-bold text-gray-900">{finalReviews.length} {finalReviews.length === 1 ? 'reseña' : 'reseñas'}</span>
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
                                        <h3 className="text-gray-900 font-bold text-lg mb-2">Sin reseñas todavía</h3>
                                        <p className="text-sm text-gray-500 max-w-xs mx-auto leading-relaxed">
                                            Este es un servicio nuevo en Inspecciono. <br/>
                                            <span className="font-semibold text-gray-700">¡Sé el primero en probarlo y compartir tu experiencia!</span>
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
                                    <h1 className="text-2xl font-bold text-gray-900 leading-tight">
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
                                <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                                    <span>Anfitrión: <span className="text-gray-900 font-medium">{finalExpertName}</span></span>
                                {finalCompletedSearches > 0 && (
                                    <>
                                        <span>·</span>
                                            <span className="text-green-600 font-medium">{finalCompletedSearches} trabajos hechos</span>
                                    </>
                                )}
                                </div>
                            </div>

                            {/* Descripción Oficial (ServiceTypeDescription) */}
                            <div className="mb-8">
                                <h3 className="text-base font-semibold text-gray-900 mb-2">Acerca del servicio</h3>
                                    <p className={`text-[15px] leading-relaxed text-gray-600 whitespace-pre-line ${!isDescriptionExpanded && shouldTruncateDescription ? 'max-h-[4.5em] overflow-hidden' : ''}`}>
                                        {finalServiceTypeDescription}
                                    </p>
                                {shouldTruncateDescription && (
                                    <button 
                                        onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                                        className="text-sm font-semibold text-gray-900 mt-2 hover:underline flex items-center gap-1"
                                    >
                                        {isDescriptionExpanded ? 'Leer menos' : 'Leer más'}
                                    </button>
                                )}
                            </div>

                            {/* Información del Experto (User Conditions) */}
                            {finalUserConditions && (
                                <div className="mb-4">
                                    <h3 className="text-sm font-semibold text-gray-900 mb-1">Detalles del experto</h3>
                                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                                            <p className={`text-[13px] leading-relaxed text-gray-600 whitespace-pre-line ${!isUserConditionsExpanded && shouldTruncateUserConditions ? 'max-h-[5em] overflow-hidden' : ''}`}>
                                                {finalUserConditions}
                                            </p>
                                        {shouldTruncateUserConditions && (
                                            <button 
                                                onClick={() => setIsUserConditionsExpanded(!isUserConditionsExpanded)}
                                                className="text-[11px] font-semibold text-gray-500 mt-1 hover:text-gray-900 hover:underline flex items-center gap-1"
                                            >
                                                {isUserConditionsExpanded ? 'Leer menos' : 'Leer más'}
                                            </button>
                                        )}
                                </div>
                                    </div>
                            )}

                            {/* Entregables (Iconos) - VERSIÓN DESKTOP */}
                            {finalDeliverableTypes.length > 0 && (
                                <div className="mb-4">
                                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Incluye</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {finalDeliverableTypes.map((dt) => {
                                            const n = (dt.displayName || dt.name).toLowerCase();
                                            let Icon = File;
                                            if (n.includes('video')) Icon = Video;
                                            else if (n.includes('foto') || n.includes('photo') || n.includes('imagen')) Icon = Image;
                                            else if (n.includes('informe') || n.includes('report') || n.includes('pdf')) Icon = FileText;

                                            return (
                                                <div key={dt.id} className="flex items-center gap-1.5 bg-blue-50/50 px-2.5 py-1.5 rounded-md border border-blue-100/50 text-blue-700" title={(dt as any).description}>
                                                    <Icon className="w-3.5 h-3.5" />
                                                    <span className="text-[11px] font-medium">{dt.displayName || dt.name}</span>
                                </div>
                                            );
                                        })}
                                        </div>
                                    </div>
                                )}

                            {/* GARANTÍA INSPECCIONO (DESKTOP - SUPER COMPACTA / 2 COLUMNAS) */}
                            <div className="mb-4 border border-gray-200 rounded-lg p-4 shadow-sm bg-white">
                                <div className="flex items-center gap-1 mb-3">
                                    <span className="text-base font-bold text-[#0066CC] tracking-tight">inspecciono</span>
                                    <span className="text-base font-light text-gray-900">protección</span>
                            </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex gap-2.5 items-start">
                                        <div className="mt-0.5 flex-shrink-0">
                                            <BadgeCheck className="w-4 h-4 text-[#0066CC] stroke-[2]" />
                                            </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 text-xs mb-0.5">Calidad verificada</h4>
                                            <p className="text-xs text-gray-500 leading-snug">
                                                Auditoría manual garantizada.
                                            </p>
                                    </div>
                                </div>

                                    <div className="flex gap-2.5 items-start">
                                        <div className="mt-0.5 flex-shrink-0">
                                            <Lock className="w-4 h-4 text-[#0066CC] stroke-[2]" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 text-xs mb-0.5">Pago en custodia</h4>
                                            <p className="text-xs text-gray-500 leading-snug">
                                                Dinero seguro hasta entrega.
                                </p>
                            </div>
                                    </div>
                                </div>
                        </div>

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
                        
                        {finalImages.length > 1 && (
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
                            <img
                                src={finalImages[lightboxIndex]}
                                alt={`Foto ${lightboxIndex + 1}`}
                                className="max-w-full max-h-full object-contain"
                            />
                        </div>

                        {finalImages.length > 1 && (
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium">
                                {lightboxIndex + 1} / {finalImages.length}
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

