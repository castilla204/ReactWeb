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
                        // ... (lógica de callback igual que antes) ...
                            try {
                                if (!response.credential) {
                                    throw new Error('No credential received from Google');
                                }

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

                                const result = await authService.googleAuth(response.credential);
                                
                                if (!result.success) {
                                    throw new Error('Authentication failed');
                                }

                                // ✅ ACTUALIZAR CONTEXTO DE AUTENTICACIÓN CON TOKEN
                                const token = authService.getAccessToken();
                                if (result.user && token) {
                                    updateUser(result.user, token, () => {
                                        // Después de actualizar el usuario, continuar con el flujo
                                        setTimeout(() => {
                                            onContinue();
                                        }, 500);
                                    });
                                } else {
                                    throw new Error('No token received after authentication');
                                }
                            } catch (error) {
                                console.error('Error en Google Auth:', error);
                                showToast('error', 'Error al iniciar sesión. Inténtalo de nuevo.');
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
        if (!isAuthenticated) {
            handleGoogleSignIn();
            return;
        }
        onContinue();
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

    // Navegación del carrusel móvil
    const handleMobileCarouselScroll = () => {
        if (carouselRef.current) {
            const scrollLeft = carouselRef.current.scrollLeft;
            const width = carouselRef.current.offsetWidth;
            const newIndex = Math.round(scrollLeft / width);
            setMobileImageIndex(newIndex);
        }
    };

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
        <div className="min-h-screen bg-white">
                
            {/* ========== VERSIÓN MÓVIL ========== */}
            <div className="lg:hidden">
                    {/* Botones de acción móvil */}
                    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-end gap-2 px-4 py-2 bg-gradient-to-b from-black/40 to-transparent">
                        <button className="w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-lg">
                            <Share2 className="w-4 h-4 text-gray-900" />
                            </button>
                        <button 
                            onClick={() => setIsFavorite(!isFavorite)}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-lg"
                        >
                            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-900'}`} />
                            </button>
                    </div>
                    
                    {/* Spacer adicional para los botones de acción en móvil */}
                    <div className="h-12"></div>

                {/* Galería móvil - Imagen a pantalla completa con card blanco superpuesto */}
                <div className="relative w-full">
                    {/* Imagen principal - Aspecto cuadrado, 100% ancho */}
                    <div className="relative w-full aspect-[1/1] bg-gray-100" onClick={() => handleImageClick(0)}>
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
                                    <Image className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                    <p className="text-xs text-gray-400">Sin imagen disponible</p>
                                </div>
                            </div>
                        )}
                        
                        {/* Badge de contador de fotos */}
                        {finalImages.length > 1 && (
                            <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1.5 z-20">
                                <Grid3X3 className="w-3.5 h-3.5" />
                                <span>{finalImages.length} fotos</span>
                            </div>
                        )}
                    </div>

                    {/* Card blanco con bordes redondeados superiores - Se superpone sobre la imagen */}
                    <div className="relative -mt-16 bg-white rounded-t-3xl pt-6 pb-32 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
                        {/* Título y ubicación - Estilo Airbnb mejorado */}
                        <div className="mb-5 px-6">
                            <h1 className="text-[26px] font-semibold text-gray-900 leading-tight mb-3">
                                {serviceTypeName} por {finalExpertName}
                            </h1>
                            
                            {/* Ubicación y tipo - Estilo Airbnb */}
                            <div className="mb-3">
                                <p className="text-sm text-gray-600 font-normal">
                                    {finalService?.serviceTypeName || 'Servicio'} en {finalService?.expert?.country === 'ES' ? 'España' : finalService?.expert?.country || 'España'}
                                </p>
                            </div>
                            
                            {/* Características principales - Estilo Airbnb */}
                            {finalService?.durationInHours && (
                                <div className="mb-4">
                                    <p className="text-sm text-gray-600">
                                        {Math.ceil(finalService.durationInHours / 24)} {Math.ceil(finalService.durationInHours / 24) === 1 ? 'día' : 'días'} · {finalService.selectedDeliverableTypes?.[0]?.displayName || 'Informe detallado'}
                                    </p>
                                </div>
                            )}
                            
                            {/* Rating y reseñas - Estilo Airbnb compacto */}
                            {finalRating > 0 && (
                                <div className="flex flex-wrap items-center gap-x-2 text-sm mb-4">
                                    <div className="flex items-center gap-1">
                                        <Star className="w-4 h-4 fill-gray-900 text-gray-900" />
                                        <span className="font-semibold text-gray-900">{finalRating.toFixed(1)}</span>
                                    </div>
                                    <span className="text-gray-400">·</span>
                                    <button className="underline hover:no-underline text-gray-900 font-semibold">
                                        {finalReviews.length} {finalReviews.length === 1 ? 'reseña' : 'reseñas'}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Descripción Principal Móvil - Estilo Airbnb */}
                        {displayMainDescription && (
                            <div className="mb-6 px-6">
                                <p className={`text-[15px] text-gray-700 leading-relaxed whitespace-pre-line ${!isDescriptionExpanded && shouldTruncateDescription ? 'max-h-[4.5em] overflow-hidden' : ''}`}>
                                    {displayMainDescription}
                                </p>
                                {shouldTruncateDescription && (
                                    <button 
                                        onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                                        className="text-sm font-semibold text-gray-900 mt-2 underline decoration-gray-300 underline-offset-2"
                                    >
                                        {isDescriptionExpanded ? 'Leer menos' : 'Leer más'}
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Información del Experto Móvil (Secundaria) - Estilo Airbnb */}
                        {showSecondaryDescription && (
                            <div className="mb-6 px-6">
                                <h3 className="text-base font-semibold text-gray-900 mb-3">Detalles del experto</h3>
                                <p className="text-[15px] text-gray-700 leading-relaxed">
                                    {finalUserConditions}
                                </p>
                            </div>
                        )}

                        <div className="h-px bg-gray-200 mb-6 mx-6" />

                        {/* Info del anfitrión - Estilo Airbnb exacto */}
                        <div className="mb-6 px-6">
                            <div className="flex items-start gap-3">
                                <Avatar className="w-12 h-12 flex-shrink-0">
                                    <AvatarImage src={finalExpertPicture} alt={finalExpertName} />
                                    <AvatarFallback className="bg-gray-900 text-white font-bold text-sm">
                                        {finalExpertName.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <div className="text-[15px] text-gray-700">
                                        <span className="font-semibold">Anfitrión: {finalExpertName}</span>
                                        {finalService?.expert?.createdAt && (
                                            <>
                                                <span className="mx-1">·</span>
                                                <span>
                                                    {(() => {
                                                        const months = Math.floor((Date.now() - new Date(finalService.expert.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30));
                                                        const years = Math.floor(months / 12);
                                                        return years > 0 ? `${years} ${years === 1 ? 'año' : 'años'} de experiencia` : `${months} ${months === 1 ? 'mes' : 'meses'} de experiencia`;
                                                    })()}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-gray-200 mb-6 mx-6" />

                        {/* GARANTÍA INSPECCIONO (MÓVIL - ESTILO AIRBNB) */}
                        <div className="mb-6 px-6">
                            <div className="border-b border-gray-200 pb-6">
                            {/* Cabecera de marca */}
                            <div className="flex items-center gap-1 mb-4">
                                <span className="text-base font-semibold text-[#0066CC] tracking-tight">inspecciono</span>
                                <span className="text-base font-normal text-gray-900">protección</span>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="flex gap-3 items-start">
                                    <div className="mt-0.5 flex-shrink-0">
                                        <BadgeCheck className="w-5 h-5 text-[#0066CC] stroke-[2]" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 text-sm mb-0.5">Calidad verificada</h4>
                                        <p className="text-sm text-gray-600 leading-relaxed">
                                            Auditamos manualmente la revisión para asegurar estándares profesionales.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-3 items-start">
                                    <div className="mt-0.5 flex-shrink-0">
                                        <Lock className="w-5 h-5 text-[#0066CC] stroke-[2]" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 text-sm mb-0.5">Pago en custodia</h4>
                                        <p className="text-sm text-gray-600 leading-relaxed">
                                            Tu dinero se retiene seguro hasta que recibes el informe.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                        <div className="h-px bg-gray-200 mb-6 mx-6" />

                        {/* Qué incluye (MÓVIL - ESTILO AIRBNB) */}
                        {finalDeliverableTypes.length > 0 && (
                            <>
                                <div className="mb-6 px-6">
                                <h3 className="text-base font-semibold text-gray-900 mb-4">Qué incluye</h3>
                                <div className="flex flex-wrap gap-2">
                                    {finalDeliverableTypes.map((dt) => {
                                        const n = (dt.displayName || dt.name).toLowerCase();
                                        let Icon = FileText;
                                        if (n.includes('video')) Icon = Video;
                                        else if (n.includes('imagen') || n.includes('foto')) Icon = Image;
                                        else if (n.includes('documento') || n.includes('informe')) Icon = FileText;
                                        else if (n.includes('archivo')) Icon = File;

                                        return (
                                            <div key={dt.id} className="inline-flex items-center gap-1.5 bg-gray-50 text-gray-700 px-3 py-2 rounded-lg border border-gray-200">
                                                <Icon className="w-4 h-4 flex-shrink-0" />
                                                <span className="text-sm font-normal leading-none">{dt.displayName || dt.name}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                                </div>
                                <div className="h-px bg-gray-200 mb-6 mx-6" />
                            </>
                        )}

                        {/* Reseñas (MÓVIL - ESTILO AIRBNB EXACTO) */}
                        {finalReviews.length > 0 ? (
                            <>
                                <div className="h-px bg-gray-200 mb-6 mx-6" />
                                <div className="mb-24 px-6 w-full">
                                    {/* Header de reseñas - Estilo Airbnb */}
                                    <div className="mb-6">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Star className="w-5 h-5 fill-gray-900 text-gray-900" />
                                            <span className="text-[18px] font-bold text-gray-900">{finalRating.toFixed(1)}</span>
                                            <span className="text-[18px] text-gray-900">·</span>
                                            <span className="text-[18px] font-bold text-gray-900">{finalReviews.length} {finalReviews.length === 1 ? 'reseña' : 'reseñas'}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-8 w-full">
                                        {finalReviews.slice(0, 3).map((review: any, idx: number) => {
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
                                            // Calcular si el texto necesita truncarse (aproximadamente 4 líneas con line-height 1.25rem)
                                            const shouldTruncate = reviewText.length > 200;
                                            const isExpanded = expandedReviews[review.id] || false;
                                            
                                            return (
                                                <div key={review.id || idx} className="w-full">
                                                    <div className="flex justify-between w-full">
                                                        {/* Contenido principal de la review */}
                                                        <div className="flex-1 min-w-0">
                                                            {/* Estrellas y fecha - Estilo Airbnb exacto */}
                                                            <div className="flex items-center gap-0.5 mb-1">
                                                                <div className="flex gap-[0.0625rem]">
                                                                    {[...Array(5)].map((_, i) => (
                                                                        <Star 
                                                                            key={i} 
                                                                            className={`w-[0.5625rem] h-[0.5625rem] flex-shrink-0 ${i < (review.rating || review.score || 5) ? 'fill-gray-900 text-gray-900' : 'fill-gray-200 text-gray-200'}`} 
                                                                        />
                                                                    ))}
                                                                </div>
                                                                <span className="text-xs text-gray-500 ml-1">, </span>
                                                                <span className="text-xs text-gray-500" aria-hidden="true"> · </span>
                                                                <span className="text-xs text-gray-500">{formattedDate}</span>
                                                            </div>
                                                            
                                                            {/* Texto de la review - Estilo Airbnb exacto */}
                                                            <div className="mb-3">
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
                                                                    <p className="text-[15px] text-gray-700 leading-[1.25rem]">
                                                                        {reviewText}
                                                                    </p>
                                                                </div>
                                                                {shouldTruncate && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setExpandedReviews(prev => ({ ...prev, [review.id || idx]: !prev[review.id || idx] }))}
                                                                        className="mt-2 text-sm font-semibold text-gray-900 underline hover:no-underline"
                                                                    >
                                                                        {isExpanded ? 'Mostrar menos' : 'Mostrar más'}
                                                                    </button>
                                                                )}
                                                            </div>
                                                            
                                                            {/* Imágenes de la reseña - Estilo Airbnb */}
                                                            {review.imageUrls && review.imageUrls.length > 0 && (
                                                                <div className="mt-3">
                                                                    <button
                                                                        type="button"
                                                                        className="text-sm font-semibold text-gray-900 underline hover:no-underline"
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
                                                                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide w-full mt-2 lg:grid lg:grid-cols-4 lg:overflow-visible">
                                                                            {review.imageUrls.map((img: string, imgIdx: number) => (
                                                                                <div key={imgIdx} className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 lg:w-full lg:aspect-square">
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
                                                        </div>
                                                        
                                                        {/* Avatar y info del reviewer - Estilo Airbnb */}
                                                        <div className="flex-shrink-0 ml-4">
                                                            <div className="flex flex-col items-center gap-2">
                                                                <Avatar className="w-10 h-10 flex-shrink-0">
                                                                    <AvatarImage src={review.client?.profilePictureUrl} />
                                                                    <AvatarFallback className="bg-gray-900 text-white font-bold text-xs">
                                                                        {review.client?.name?.charAt(0) || 'U'}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <div className="text-center">
                                                                    <div className="text-sm font-semibold text-gray-900 leading-tight">
                                                                        {review.client?.name || 'Usuario'}
                                                                    </div>
                                                                    {reviewerYears && reviewerYears > 0 ? (
                                                                        <div className="text-sm text-gray-500 leading-tight mt-0.5">
                                                                            Lleva {reviewerYears} {reviewerYears === 1 ? 'año' : 'años'} en Inspecciono
                                                                        </div>
                                                                    ) : reviewerMonths && reviewerMonths > 0 ? (
                                                                        <div className="text-sm text-gray-500 leading-tight mt-0.5">
                                                                            Lleva {reviewerMonths} {reviewerMonths === 1 ? 'mes' : 'meses'} en Inspecciono
                                                                        </div>
                                                                    ) : review.client?.location ? (
                                                                        <div className="text-sm text-gray-500 leading-tight mt-0.5">
                                                                            {review.client.location}
                                                                        </div>
                                                                    ) : null}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {finalReviews.length > 3 && (
                                        <button className="w-full mt-6 py-3.5 border border-gray-300 rounded-lg text-sm font-semibold text-gray-900 hover:border-gray-900 transition-colors">
                                            Mostrar las {finalReviews.length} reseñas
                                        </button>
                                    )}
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

                {/* Footer fijo móvil - Estilo Airbnb moderno */}
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50 pb-safe">
                    <div className="px-6 py-4">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-1.5 mb-0.5">
                                    <span className="text-[20px] font-bold text-gray-900">{formatPrice(finalPrice)} €</span>
                                    <span className="text-[14px] text-gray-500 font-normal">total</span>
                            </div>
                                <div className="flex items-center gap-1">
                                    <span className="text-[12px] font-medium text-gray-500">IVA incluido</span>
                                </div>
                        </div>
                        {isAuthenticated ? (
                                <Button
                                onClick={handleReserveClick}
                                    className="h-12 px-8 bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 active:scale-[0.98] text-white text-[16px] font-bold rounded-xl shadow-lg transition-all duration-200 flex-shrink-0"
                            >
                                Reservar
                                </Button>
                        ) : (
                                <div className="relative flex-shrink-0">
                                {/* Hidden Google button */}
                                <div ref={googleButtonRefMobile} style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', zIndex: -1 }}></div>
                                {/* Custom button */}
                                    <Button
                                    onClick={handleGoogleSignIn}
                                    disabled={!isGoogleReady}
                                        className="h-12 px-6 bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 active:scale-[0.98] text-white text-[15px] font-bold rounded-xl shadow-lg transition-all duration-200 inline-flex items-center justify-center gap-2.5"
                                >
                                    <GoogleIcon />
                                        <span>Inicia sesión</span>
                                    </Button>
                            </div>
                        )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ========== VERSIÓN DESKTOP COMPACTA Y REFINADA ========== */}
            <div className="hidden lg:block min-h-screen bg-white">
                <div className="max-w-6xl mx-auto px-6 py-8">
                    <div className="grid grid-cols-[45%_1fr] gap-12 items-start">
                        
                        {/* COLUMNA IZQUIERDA: ÁLBUM DE FOTOS + RESEÑAS PREMIUM */}
                        <div className="space-y-12">
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
                                        {/* Header de reseñas - Estilo Airbnb */}
                                        <div className="mb-6">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Star className="w-5 h-5 fill-gray-900 text-gray-900" />
                                                <span className="text-[18px] font-bold text-gray-900">{finalRating.toFixed(1)}</span>
                                                <span className="text-[18px] text-gray-900">·</span>
                                                <span className="text-[18px] font-bold text-gray-900">{finalReviews.length} {finalReviews.length === 1 ? 'reseña' : 'reseñas'}</span>
                                            </div>
                                        </div>

                                        <div className="space-y-8">
                                            {finalReviews.slice(0, 3).map((review: any, idx: number) => {
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
                                                // Calcular si el texto necesita truncarse (aproximadamente 4 líneas con line-height 1.25rem)
                                                const shouldTruncate = reviewText.length > 200;
                                                const isExpanded = expandedReviews[review.id] || false;
                                                
                                                return (
                                                    <div key={review.id || idx} className="w-full">
                                                        <div className="flex justify-between w-full">
                                                            {/* Contenido principal de la review */}
                                                            <div className="flex-1 min-w-0">
                                                                {/* Estrellas y fecha - Estilo Airbnb exacto */}
                                                                <div className="flex items-center gap-0.5 mb-1">
                                                                    <div className="flex gap-[0.0625rem]">
                                                                        {[...Array(5)].map((_, i) => (
                                                                            <Star 
                                                                                key={i} 
                                                                                className={`w-[0.5625rem] h-[0.5625rem] flex-shrink-0 ${i < (review.rating || review.score || 5) ? 'fill-gray-900 text-gray-900' : 'fill-gray-200 text-gray-200'}`} 
                                                                            />
                                                                        ))}
                                                                    </div>
                                                                    <span className="text-xs text-gray-500 ml-1">, </span>
                                                                    <span className="text-xs text-gray-500" aria-hidden="true"> · </span>
                                                                    <span className="text-xs text-gray-500">{formattedDate}</span>
                                                                </div>
                                                                
                                                                {/* Texto de la review - Estilo Airbnb exacto */}
                                                                <div className="mb-3">
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
                                                                        <p className="text-[15px] text-gray-700 leading-[1.25rem]">
                                                                            {reviewText}
                                                                        </p>
                                                                    </div>
                                                                    {shouldTruncate && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setExpandedReviews(prev => ({ ...prev, [review.id || idx]: !prev[review.id || idx] }))}
                                                                            className="mt-2 text-sm font-semibold text-gray-900 underline hover:no-underline"
                                                                        >
                                                                            {isExpanded ? 'Mostrar menos' : 'Mostrar más'}
                                                                        </button>
                                                                    )}
                                                                </div>
                                                                
                                                                {/* Imágenes de la reseña - Estilo Airbnb */}
                                                                {review.imageUrls && review.imageUrls.length > 0 && (
                                                                    <div className="mt-3">
                                                                        <button
                                                                            type="button"
                                                                            className="text-sm font-semibold text-gray-900 underline hover:no-underline"
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
                                                            </div>
                                                            
                                                            {/* Avatar y info del reviewer - Estilo Airbnb */}
                                                            <div className="flex-shrink-0 ml-4">
                                                                <div className="flex flex-col items-center gap-2">
                                                                    <Avatar className="w-10 h-10 flex-shrink-0">
                                                                        <AvatarImage src={review.client?.profilePictureUrl} />
                                                                        <AvatarFallback className="bg-gray-900 text-white font-bold text-xs">
                                                                            {review.client?.name?.charAt(0) || 'U'}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    <div className="text-center">
                                                                        <div className="text-sm font-semibold text-gray-900 leading-tight">
                                                                            {review.client?.name || 'Usuario'}
                                                                        </div>
                                                                        {reviewerYears && reviewerYears > 0 ? (
                                                                            <div className="text-sm text-gray-500 leading-tight mt-0.5">
                                                                                Lleva {reviewerYears} {reviewerYears === 1 ? 'año' : 'años'} en Inspecciono
                                                                            </div>
                                                                        ) : reviewerMonths && reviewerMonths > 0 ? (
                                                                            <div className="text-sm text-gray-500 leading-tight mt-0.5">
                                                                                Lleva {reviewerMonths} {reviewerMonths === 1 ? 'mes' : 'meses'} en Inspecciono
                                                                            </div>
                                                                        ) : review.client?.location ? (
                                                                            <div className="text-sm text-gray-500 leading-tight mt-0.5">
                                                                                {review.client.location}
                                                                            </div>
                                                                        ) : null}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        
                                        {finalReviews.length > 3 && (
                                            <button className="w-full mt-6 py-3.5 border border-gray-300 rounded-lg text-sm font-semibold text-gray-900 hover:border-gray-900 transition-colors">
                                                Mostrar las {finalReviews.length} reseñas
                                            </button>
                                        )}
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
                        <div className="relative">
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
                                <div className="flex items-end justify-between mb-6">
                        <div>
                                        <span className="text-2xl font-bold text-gray-900">{formatPrice(finalPrice)}€</span>
                                        <span className="text-sm text-gray-500 ml-1">total</span>
                                        </div>
                                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">IVA incluido</span>
                                    </div>

                                    {isAuthenticated ? (
                                        <button
                                            onClick={handleReserveClick}
                                        className="w-full py-3 bg-gray-900 hover:bg-black text-white text-base font-semibold rounded-lg shadow-sm transition-all active:scale-[0.99]"
                                        >
                                            Reservar
                                        </button>
                                    ) : (
                                    <div className="relative">
                                        <div ref={googleButtonRefDesktop} className="absolute inset-0 opacity-0 z-10" />
                                            <button
                                                onClick={handleGoogleSignIn}
                                                disabled={!isGoogleReady}
                                            className="w-full py-3 bg-gray-900 hover:bg-black text-white text-base font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
                                            >
                                                <GoogleIcon />
                                            <span>Iniciar sesión</span>
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
            `}</style>
        </div>
        </>
    );
}

