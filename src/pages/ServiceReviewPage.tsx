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
    Grid3X3
} from 'lucide-react';
import { FormProgressTimeline } from '../components/FormProgressTimeline';
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
}: ServiceReviewPageProps) {
    const { isAuthenticated, updateUser } = useAuth();
    const navigate = useNavigate();
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [mobileImageIndex, setMobileImageIndex] = useState(0);
    const [isFavorite, setIsFavorite] = useState(false);
    const carouselRef = useRef<HTMLDivElement>(null);
    const { serviceTypes } = useServiceTypes();

    const { services, isLoading } = useServices({
        categoryId,
        serviceTypeId,
        latitude,
        longitude,
        locationRange,
    });

    const service = services.find(s => s.id === serviceId);
    const finalService: Service | null = service || null;
    const finalImages = finalService?.imageUrls?.length ? finalService.imageUrls : (serviceImageUrls || []);
    const finalExpertName = finalService?.expert?.user?.name || expertName || 'Experto';
    const finalExpertPicture = finalService?.expert?.profilePictureUrl || finalService?.expert?.user?.profilePictureUrl || expertProfilePicture;
    const finalPrice = finalService?.price || servicePrice || 0;
    const finalDescription = finalService?.conditions || serviceDescription || '';
    const finalRating = finalService?.averageRating || 0;
    const finalReviews = finalService?.expert?.reviews || [];
    const finalCompletedSearches = finalService?.completedSearches || 0;
    const finalDeliverableTypes = finalService?.selectedDeliverableTypes || [];
    const serviceTypeName = serviceTypes.find(st => st.id === (finalService?.serviceTypeId || serviceTypeId))?.name || 'Servicio';

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('es-ES', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).format(price / 100);
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
    const googleButtonRef = useRef<HTMLDivElement>(null);

    // Inicializar Google Sign-In
    useEffect(() => {
        const initGoogleSignIn = () => {
            if (window.google?.accounts?.id) {
                const buttonContainer = googleButtonRef.current;
                if (buttonContainer) {
                    const clientId = '61603823707-4vsp43naifci8t893hdc276kkhbvn49a.apps.googleusercontent.com';
                    window.google.accounts.id.initialize({
                        client_id: clientId,
                        callback: async (response: any) => {
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

                    window.google.accounts.id.renderButton(buttonContainer, {
                        type: 'standard',
                        theme: 'outline',
                        size: 'large',
                        text: 'signin_with',
                        width: '100%',
                    });

                    setIsGoogleReady(true);
                }
            } else {
                // Reintentar después de un tiempo
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
        const buttonContainer = googleButtonRef.current;
        if (buttonContainer) {
            const googleButton = buttonContainer.querySelector('div[role="button"]') as HTMLElement;
            if (googleButton) {
                googleButton.click();
            } else if (window.google?.accounts?.id?.prompt) {
                window.google.accounts.id.prompt();
            }
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
            {/* Header Timeline - Componente reutilizable */}
            <FormProgressTimeline currentStep={currentStep} onBack={onBack} />
            
        <div className="min-h-screen bg-white">
                {/* Spacer para compensar el header fijo */}
                <div className="h-16"></div>
                
            {/* ========== VERSIÓN MÓVIL ========== */}
            <div className="lg:hidden">
                    {/* Botones de acción móvil - Debajo del timeline */}
                    <div className="fixed top-14 left-0 right-0 z-50 flex items-center justify-end gap-2 px-4 py-2 bg-gradient-to-b from-black/40 to-transparent">
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

                {/* Galería móvil con carrusel */}
                {finalImages.length > 0 && (
                    <div className="relative -mt-16">
                        <div 
                            ref={carouselRef}
                            className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
                            onScroll={handleMobileCarouselScroll}
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                            {finalImages.map((img, idx) => (
                                <div 
                                    key={idx}
                                    className="w-full flex-shrink-0 snap-center"
                                    onClick={() => handleImageClick(idx)}
                                >
                                    <div className="aspect-[4/3] bg-gray-100">
                                        <img
                                            src={img}
                                            alt={`Foto ${idx + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                </div>
                            ))}
                                    </div>
                        {/* Indicador de fotos */}
                        <div className="absolute bottom-4 right-4 bg-gray-900/80 text-white text-xs font-medium px-2.5 py-1 rounded-md">
                            {mobileImageIndex + 1} / {finalImages.length}
                                    </div>
                                </div>
                )}

                {/* Contenido móvil - Estilo Airbnb compacto */}
                <div className="px-5 pt-4 pb-32">
                    {/* Título y ubicación */}
                    <div className="mb-6">
                        <h1 className="text-[20px] font-semibold text-[#222222] leading-[1.2] mb-2 tracking-tight">
                        {serviceTypeName} por {finalExpertName}
                    </h1>
                        {/* Meta info - Estilo Airbnb */}
                        <div className="flex flex-wrap items-center gap-x-2 text-[13px] text-[#717171]">
                        {finalRating > 0 ? (
                            <>
                                    <div className="flex items-center gap-1">
                                        <Star className="w-[12px] h-[12px] fill-[#222222] text-[#222222]" />
                                        <span className="font-semibold text-[#222222]">{finalRating.toFixed(1)}</span>
                                    </div>
                                                <span>·</span>
                                    <button className="underline hover:no-underline text-[#222222] font-normal">
                                        {finalReviews.length} {finalReviews.length === 1 ? 'reseña' : 'reseñas'}
                                    </button>
                                    {finalCompletedSearches > 0 && (
                                        <>
                                            <span>·</span>
                                            <span className="text-[#717171]">{finalCompletedSearches} completados</span>
                                        </>
                                    )}
                                </>
                            ) : (
                                <span className="flex items-center gap-1 text-[#717171]">
                                    <Star className="w-[12px] h-[12px]" />
                                    <span>Nuevo</span>
                                </span>
                            )}
                        </div>
                                </div>

                    <div className="h-px bg-[#DDDDDD] my-6" />

                    {/* Info del anfitrión - Estilo Airbnb */}
                    <div className="mb-6">
                        <div className="flex items-start gap-3 mb-3">
                        <Avatar className="w-12 h-12">
                            <AvatarImage src={finalExpertPicture} alt={finalExpertName} />
                                <AvatarFallback className="bg-[#222222] text-white font-semibold text-sm">
                                {finalExpertName.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                            <div className="flex-1 pt-0.5">
                                <h3 className="text-[15px] font-semibold text-[#222222] mb-1 leading-tight">
                                    Anfitrión: {finalExpertName}
                                </h3>
                                <p className="text-[13px] text-[#717171] leading-relaxed">
                                {finalService?.expert?.createdAt 
                                    ? (() => {
                                        const months = Math.floor((Date.now() - new Date(finalService.expert.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30));
                                            return months < 1 ? 'Menos de 1 mes' : `${months} ${months === 1 ? 'mes' : 'meses'} de experiencia`;
                                    })()
                                    : 'Profesional verificado'
                                }
                            </p>
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-[#DDDDDD] mb-6" />

                    {/* Features destacadas - Estilo Airbnb */}
                    <div className="grid grid-cols-1 gap-5 mb-6">
                        <div className="flex items-start gap-3">
                            <Shield className="w-5 h-5 text-[#222222] flex-shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-[14px] font-semibold text-[#222222] mb-1 leading-tight">Cancelación gratuita</h4>
                                <p className="text-[13px] text-[#717171] leading-relaxed">Cancela hasta 24h antes sin cargos</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Headphones className="w-5 h-5 text-[#222222] flex-shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-[14px] font-semibold text-[#222222] mb-1 leading-tight">Soporte 24/7</h4>
                                <p className="text-[13px] text-[#717171] leading-relaxed">Asistencia disponible en cualquier momento</p>
                                </div>
                                    </div>
                        <div className="flex items-start gap-3">
                            <Award className="w-5 h-5 text-[#222222] flex-shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-[14px] font-semibold text-[#222222] mb-1 leading-tight">Garantía de satisfacción</h4>
                                <p className="text-[13px] text-[#717171] leading-relaxed">Si no quedas satisfecho, te devolvemos el dinero</p>
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-[#DDDDDD] mb-6" />

                    {/* Qué incluye */}
                                {finalDeliverableTypes.length > 0 && (
                        <>
                            <div className="mb-4">
                                <h3 className="text-[15px] font-semibold text-gray-900 mb-3">Qué incluye</h3>
                                        <div className="space-y-2.5">
                                            {finalDeliverableTypes.map((dt) => (
                                                <div key={dt.id} className="flex items-start gap-2.5">
                                            <CheckCircle className="w-4 h-4 text-gray-900 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <span className="text-[13px] text-gray-900">{dt.displayName || dt.name}</span>
                                                {dt.description && (
                                                    <p className="text-[12px] text-gray-500 mt-0.5">{dt.description}</p>
                                                )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                            <div className="h-px bg-gray-200 mb-4" />
                        </>
                    )}

                    {/* Descripción - Estilo Airbnb */}
                    <div className="mb-6">
                        <h3 className="text-[16px] font-semibold text-[#222222] mb-4 leading-tight">Acerca del servicio</h3>
                        <p className="text-[14px] text-[#222222] leading-[1.5] whitespace-pre-line">
                            {finalDescription || 'Este servicio profesional incluye todo lo necesario para garantizar tu satisfacción. Nuestro equipo de expertos está comprometido con brindarte la mejor experiencia posible.'}
                                            </p>
                                        </div>

                    {/* Reseñas */}
                    {finalReviews.length > 0 && (
                        <>
                            <div className="h-px bg-gray-200 mb-4" />
                            <div className="mb-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <Star className="w-4 h-4 fill-gray-900 text-gray-900" />
                                    <span className="text-[15px] font-semibold">{finalRating.toFixed(1)}</span>
                                    <span className="text-gray-500">·</span>
                                    <span className="text-[13px] text-gray-600">{finalReviews.length} reseñas</span>
                                </div>
                                <EnhancedReviewsList reviews={finalReviews} maxReviews={5} />
                                    </div>
                        </>
                    )}
                                </div>

                {/* Footer fijo móvil - Estilo Airbnb moderno */}
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#DDDDDD] shadow-[0_-2px_16px_rgba(0,0,0,0.08)] z-50">
                    <div className="px-6 py-4">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-1.5 mb-1">
                                    <span className="text-[22px] font-semibold text-[#222222]">{formatPrice(finalPrice)} €</span>
                                    <span className="text-[14px] text-[#717171] font-normal">total</span>
                            </div>
                            {finalRating > 0 && (
                                    <div className="flex items-center gap-1.5 text-[13px] text-[#717171]">
                                        <Star className="w-4 h-4 fill-[#222222] text-[#222222]" />
                                        <span className="font-semibold text-[#222222]">{finalRating.toFixed(1)}</span>
                                        <span>·</span>
                                        <button className="underline hover:no-underline text-[#222222] font-medium">
                                            {finalReviews.length} {finalReviews.length === 1 ? 'reseña' : 'reseñas'}
                                        </button>
                                </div>
                            )}
                        </div>
                        {isAuthenticated ? (
                                <Button
                                onClick={handleReserveClick}
                                    className="h-11 px-8 bg-[#0066CC] hover:bg-[#0052A3] active:bg-[#004080] text-white text-[15px] font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex-shrink-0"
                            >
                                Reservar
                                </Button>
                        ) : (
                                <div className="relative flex-shrink-0">
                                {/* Hidden Google button */}
                                <div ref={googleButtonRef} style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', zIndex: -1 }}></div>
                                {/* Custom button */}
                                    <Button
                                    onClick={handleGoogleSignIn}
                                    disabled={!isGoogleReady}
                                        className="h-11 px-8 bg-[#0066CC] hover:bg-[#0052A3] active:bg-[#004080] text-white text-[15px] font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 inline-flex items-center justify-center gap-2.5"
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

            {/* ========== VERSIÓN DESKTOP ========== */}
            <div className="hidden lg:block">
                <div className="max-w-6xl mx-auto px-6 py-5">
                    {/* Título y acciones */}
                    <div className="flex items-start justify-between mb-4">
                        <h1 className="text-xl font-semibold text-gray-900">
                            {serviceTypeName} por {finalExpertName}
                        </h1>
                        <div className="flex items-center gap-3">
                            <button className="flex items-center gap-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 px-2.5 py-1.5 rounded-md transition-colors">
                                <Share2 className="w-3.5 h-3.5" />
                                <span className="underline">Compartir</span>
                            </button>
                            <button 
                                onClick={() => setIsFavorite(!isFavorite)}
                                className="flex items-center gap-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 px-2.5 py-1.5 rounded-md transition-colors"
                            >
                                <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                                <span className="underline">Guardar</span>
                            </button>
                        </div>
                    </div>

                    {/* Galería desktop */}
                    {finalImages.length > 0 && (
                        <div className="grid grid-cols-4 grid-rows-2 gap-1.5 h-[340px] rounded-lg overflow-hidden mb-6">
                            {/* Imagen principal */}
                            <div 
                                className="col-span-2 row-span-2 relative cursor-pointer group rounded-l-lg overflow-hidden"
                                onClick={() => handleImageClick(0)}
                            >
                                <img
                                    src={heroImage}
                                    alt="Principal"
                                    className="w-full h-full object-cover group-hover:brightness-95 transition-all"
                                />
                            </div>
                            {/* Grid de 4 imágenes */}
                            {[0, 1, 2, 3].map((idx) => (
                                <div
                                    key={idx}
                                    className={`relative cursor-pointer group bg-gray-100 overflow-hidden ${idx === 1 ? 'rounded-tr-lg' : ''} ${idx === 3 ? 'rounded-br-lg' : ''}`}
                                    onClick={() => gridImages[idx] && handleImageClick(idx + 1)}
                                >
                                    {gridImages[idx] ? (
                                        <img
                                            src={gridImages[idx]}
                                            alt={`Foto ${idx + 2}`}
                                            className="w-full h-full object-cover group-hover:brightness-95 transition-all"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <User className="w-6 h-6 text-gray-300" />
                                        </div>
                                    )}
                                    {/* Botón mostrar todas */}
                                    {idx === 3 && finalImages.length > 5 && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setIsLightboxOpen(true);
                                                setLightboxIndex(0);
                                            }}
                                            className="absolute bottom-3 right-3 bg-white px-3 py-1.5 rounded-md text-xs font-medium text-gray-900 shadow-md hover:shadow-lg transition-shadow flex items-center gap-1.5"
                                        >
                                            <Grid3X3 className="w-3.5 h-3.5" />
                                            Ver todas
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Layout de dos columnas */}
                    <div className="grid grid-cols-[1fr_320px] gap-10">
                        {/* Columna izquierda */}
                        <div>
                            {/* Meta info */}
                            <div className="flex items-center gap-2 text-xs text-gray-600 pb-4 border-b border-gray-200">
                                {finalRating > 0 && (
                                    <>
                                        <Star className="w-3.5 h-3.5 fill-gray-900 text-gray-900" />
                                        <span className="font-medium text-gray-900">{finalRating.toFixed(1)}</span>
                                        <span>·</span>
                                        <button className="underline hover:text-gray-900">{finalReviews.length} reseñas</button>
                                        <span>·</span>
                                    </>
                                )}
                                {finalCompletedSearches > 0 && (
                                    <>
                                        <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                                        <span>{finalCompletedSearches} completados</span>
                                    </>
                                )}
                            </div>

                            {/* Anfitrión */}
                            <div className="flex items-center gap-3 py-4 border-b border-[#DDDDDD]">
                                <Avatar className="w-11 h-11">
                                    <AvatarImage src={finalExpertPicture} alt={finalExpertName} />
                                    <AvatarFallback className="bg-[#222222] text-white text-base font-semibold">
                                        {finalExpertName.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="text-sm font-semibold text-[#222222]">Anfitrión: {finalExpertName}</h3>
                                    <p className="text-xs text-[#717171]">
                                        {finalService?.expert?.createdAt 
                                            ? (() => {
                                                const months = Math.floor((Date.now() - new Date(finalService.expert.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30));
                                                return months < 1 ? 'Menos de 1 mes' : `${months} meses de experiencia`;
                                            })()
                                            : 'Verificado'
                                        }
                                    </p>
                                </div>
                            </div>

                            {/* Features */}
                            <div className="py-4 border-b border-gray-200 space-y-3">
                                <div className="flex gap-3">
                                    <Shield className="w-5 h-5 text-gray-600 flex-shrink-0" />
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-900">Cancelación gratuita</h4>
                                        <p className="text-xs text-gray-500">Hasta 24h antes sin cargo</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <Headphones className="w-5 h-5 text-gray-600 flex-shrink-0" />
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-900">Soporte 24/7</h4>
                                        <p className="text-xs text-gray-500">Asistencia disponible siempre</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <Award className="w-5 h-5 text-gray-600 flex-shrink-0" />
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-900">Garantía de satisfacción</h4>
                                        <p className="text-xs text-gray-500">Reembolso si no quedas satisfecho</p>
                                    </div>
                                </div>
                                {finalService?.durationInHours && (
                                    <div className="flex gap-3">
                                        <Clock className="w-5 h-5 text-gray-600 flex-shrink-0" />
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-900">Duración</h4>
                                            <p className="text-xs text-gray-500">{finalService.durationInHours}h estimadas</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Qué incluye */}
                            {finalDeliverableTypes.length > 0 && (
                                <div className="py-4 border-b border-gray-200">
                                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Qué incluye</h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        {finalDeliverableTypes.map((dt) => (
                                            <div key={dt.id} className="flex items-start gap-2">
                                                <CheckCircle className="w-4 h-4 text-[#0066CC] flex-shrink-0 mt-0.5" />
                                                <span className="text-xs text-gray-700">{dt.displayName || dt.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Descripción */}
                            <div className="py-4 border-b border-gray-200">
                                <h3 className="text-sm font-semibold text-gray-900 mb-2">Acerca del servicio</h3>
                                <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">
                                    {finalDescription || 'Servicio profesional de alta calidad. Nuestro equipo de expertos está comprometido con brindarte los mejores resultados.'}
                                </p>
                            </div>

                            {/* Reseñas */}
                            {finalReviews.length > 0 && (
                                <div className="py-4">
                                    <div className="flex items-center gap-1.5 mb-4">
                                        <Star className="w-4 h-4 fill-gray-900 text-gray-900" />
                                        <span className="text-sm font-semibold">{finalRating.toFixed(1)}</span>
                                        <span className="text-xs text-gray-500">· {finalReviews.length} reseñas</span>
                                    </div>
                                    <EnhancedReviewsList reviews={finalReviews} maxReviews={6} />
                                </div>
                            )}
                        </div>

                        {/* Columna derecha - Sidebar de reserva */}
                        <div>
                            <div className="sticky top-20">
                                <div className="border border-gray-200 rounded-xl shadow-lg p-5">
                                    {/* Precio */}
                                    <div className="mb-4">
                                        <div className="flex items-baseline gap-1 mb-0.5">
                                            <span className="text-xl font-semibold text-gray-900">{formatPrice(finalPrice)} €</span>
                                            <span className="text-xs text-gray-500">total</span>
                                        </div>
                                        {finalRating > 0 && (
                                            <div className="flex items-center gap-1 text-xs">
                                                <Star className="w-3 h-3 fill-gray-900 text-gray-900" />
                                                <span className="font-medium">{finalRating.toFixed(1)}</span>
                                                <span className="text-gray-500">· {finalReviews.length} reseñas</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Botón reservar */}
                                    {isAuthenticated ? (
                                        <button
                                            onClick={handleReserveClick}
                                            className="w-full h-12 bg-[#0066CC] hover:bg-[#0052A3] active:bg-[#004080] text-white text-[16px] font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl mb-3"
                                        >
                                            Reservar
                                        </button>
                                    ) : (
                                        <div className="relative mb-3">
                                            {/* Hidden Google button */}
                                            <div ref={googleButtonRef} style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', zIndex: -1 }}></div>
                                            {/* Custom button */}
                                            <button
                                                onClick={handleGoogleSignIn}
                                                disabled={!isGoogleReady}
                                                className="w-full h-12 bg-[#0066CC] hover:bg-[#0052A3] active:bg-[#004080] text-white text-[16px] font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl inline-flex items-center justify-center gap-3"
                                            >
                                                <GoogleIcon />
                                                <span>Inicia sesión para contratar</span>
                                            </button>
                                        </div>
                                    )}

                                    <p className="text-center text-xs text-gray-500 mb-4">
                                        No se te cobrará nada aún
                                    </p>

                                    <div className="h-px bg-gray-200 mb-4" />

                                    {/* Garantías */}
                                    <div className="space-y-3 text-xs">
                                        <div className="flex items-start gap-2">
                                            <CheckCircle className="w-3.5 h-3.5 text-[#0066CC] mt-0.5 flex-shrink-0" />
                                            <span className="text-gray-600">Cancelación gratuita 24h antes</span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <Shield className="w-3.5 h-3.5 text-[#0066CC] mt-0.5 flex-shrink-0" />
                                            <span className="text-gray-600">Pago 100% seguro</span>
                                        </div>
                                    </div>
                                </div>
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
