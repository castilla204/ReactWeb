import React, { useState, useEffect } from 'react';
import { 
    Star, 
    MapPin, 
    CheckCircle, 
    ArrowLeft, 
    ChevronLeft, 
    ChevronRight, 
    X,
    User,
    Calendar,
    Clock,
    Shield,
    Share2,
    Heart,
    Headphones,
    MessageCircle,
    Award,
    Zap,
    Lock,
    Phone,
    Mail
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Card, CardContent } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { EnhancedReviewsList } from '../components/EnhancedReviewCard';
import { useServices, Service } from '../hooks/useServices';
import { useServiceTypes } from '../hooks/useServiceTypes';
import { Dialog, DialogContent } from '../components/ui/dialog';

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
    onContinue: () => void; // Ir a SearchForm
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
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const { serviceTypes } = useServiceTypes();

    // Obtener datos completos del servicio
    const { services, isLoading } = useServices({
        categoryId,
        serviceTypeId,
        latitude,
        longitude,
        locationRange,
    });

    const service = services.find(s => s.id === serviceId);
    
    // Usar datos del servicio si están disponibles, sino usar los props
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
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 0,
        }).format(price / 100);
    };

    const renderStars = (rating: number) => {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        return Array.from({ length: 5 }, (_, i) => {
            if (i < fullStars) {
                return <Star key={i} className="w-[14px] h-[14px] fill-[#0066CC] text-[#0066CC]" />;
            } else if (i === fullStars && hasHalfStar) {
                return <Star key={i} className="w-[14px] h-[14px] fill-[#0066CC]/50 text-[#0066CC]" />;
            } else {
                return <Star key={i} className="w-[14px] h-[14px] text-[#DDDDDD]" />;
            }
        });
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

    // Galería de fotos estilo Airbnb - imagen grande izquierda + grid 2x2 derecha
    const heroImage = finalImages[0] || '';
    const gridImages = finalImages.slice(1, 5); // Para PC: 4 imágenes en grid
    const mobileGridImages = finalImages.slice(1, 3); // Para móvil: 2 imágenes en grid

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando información del servicio...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white" style={{ fontFamily: 'Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif' }}>
            {/* Header con botón volver estilo Airbnb */}
            <div className="sticky top-0 z-40 bg-white border-b border-[#EBEBEB] backdrop-blur-sm bg-white/95 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-14">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                onClick={onBack}
                                className="flex items-center gap-1.5 hover:bg-gray-100 rounded-full -ml-2"
                            >
                                <ArrowLeft className="w-4 h-4" />
                            </Button>
                            {/* Indicador de paso del formulario */}
                            <div className="flex items-center gap-2 text-sm text-[#717171]">
                                <span className="font-medium">Paso {currentStep} de {totalSteps}</span>
                                <div className="flex gap-1">
                                    {Array.from({ length: totalSteps }).map((_, i) => (
                                        <div
                                            key={i}
                                            className={`w-2 h-2 rounded-full ${
                                                i + 1 <= currentStep ? 'bg-[#222222]' : 'bg-[#DDDDDD]'
                                            }`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                {/* Título y botones arriba de las imágenes */}
                <div className="mb-6">
                    <div className="flex items-start justify-between gap-4">
                        <h1 className="text-2xl lg:text-[26px] leading-[30px] font-semibold text-[#222222] flex-1" style={{ fontFamily: 'Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif' }}>
                            {serviceTypeName} por {finalExpertName}
                        </h1>
                        <div className="flex items-center gap-6 flex-shrink-0">
                            <button className="text-sm font-medium text-[#222222] hover:text-[#0066CC] transition-colors flex items-center gap-2 group">
                                <div className="p-1.5 rounded-full group-hover:bg-[#0066CC]/10 transition-colors">
                                    <Share2 className="w-4 h-4 stroke-[1.5]" />
                                </div>
                                <span className="underline decoration-1 group-hover:decoration-[#0066CC]">Compartir</span>
                            </button>
                            <button className="text-sm font-medium text-[#222222] hover:text-[#0066CC] transition-colors flex items-center gap-2 group">
                                <div className="p-1.5 rounded-full group-hover:bg-[#0066CC]/10 transition-colors">
                                    <Heart className="w-4 h-4 stroke-[1.5]" />
                                </div>
                                <span className="underline decoration-1 group-hover:decoration-[#0066CC]">Guardar</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Galería de fotos estilo Airbnb */}
                {finalImages.length > 0 && (
                    <>
                        {/* PC: 1 grande izquierda + 2x2 derecha - Estilo Airbnb exacto */}
                        <div className="hidden lg:grid w-full grid-cols-[1fr_1fr] gap-2 h-[400px] rounded-2xl overflow-hidden" style={{ gridAutoRows: 'minmax(0, 1fr)' }}>
                                    {/* Imagen grande izquierda - ocupa más espacio */}
                                    <div 
                                        className="relative overflow-hidden cursor-pointer group bg-gray-100 rounded-l-2xl"
                                        onClick={() => handleImageClick(0)}
                                    >
                                        {heroImage && (
                                            <img
                                                src={heroImage}
                                                alt="Servicio principal"
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                }}
                                            />
                                        )}
                                    </div>

                                    {/* Grid 2x2 derecha - TODAS LAS IMÁGENES EXACTAMENTE DEL MISMO TAMAÑO - ALTURA FIJA FORZADA */}
                                    <div className="grid grid-cols-2 gap-2 h-full" style={{ gridTemplateRows: 'repeat(2, 1fr)' }}>
                                        {/* Imagen 1 - Top Left */}
                                        {gridImages[0] ? (
                                            <div
                                                className="relative overflow-hidden cursor-pointer group bg-gray-100 rounded-tr-2xl"
                                                style={{ height: '100%', minHeight: 0 }}
                                                onClick={() => handleImageClick(1)}
                                            >
                                                <img
                                                    src={gridImages[0]}
                                                    alt="Foto 2"
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    style={{ height: '100%', objectFit: 'cover' }}
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                    }}
                                                />
                                            </div>
                                        ) : (
                                            <div className="bg-gray-100 rounded-tr-2xl" style={{ height: '100%' }} />
                                        )}
                                        
                                        {/* Imagen 2 - Top Right */}
                                        {gridImages[1] ? (
                                            <div
                                                className="relative overflow-hidden cursor-pointer group bg-gray-100"
                                                style={{ height: '100%', minHeight: 0 }}
                                                onClick={() => handleImageClick(2)}
                                            >
                                                <img
                                                    src={gridImages[1]}
                                                    alt="Foto 3"
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    style={{ height: '100%', objectFit: 'cover' }}
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                    }}
                                                />
                                            </div>
                                        ) : (
                                            <div className="bg-gray-100" style={{ height: '100%' }} />
                                        )}
                                        
                                        {/* Imagen 3 - Bottom Left */}
                                        {gridImages[2] ? (
                                            <div
                                                className="relative overflow-hidden cursor-pointer group bg-gray-100"
                                                style={{ height: '100%', minHeight: 0 }}
                                                onClick={() => handleImageClick(3)}
                                            >
                                                <img
                                                    src={gridImages[2]}
                                                    alt="Foto 4"
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    style={{ height: '100%', objectFit: 'cover' }}
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                    }}
                                                />
                                            </div>
                                        ) : (
                                            <div className="bg-gray-100" style={{ height: '100%' }} />
                                        )}
                                        
                                        {/* Imagen 4 - Bottom Right */}
                                        {gridImages[3] ? (
                                            <div
                                                className="relative overflow-hidden cursor-pointer group bg-gray-100 rounded-br-2xl"
                                                style={{ height: '100%', minHeight: 0 }}
                                                onClick={() => handleImageClick(4)}
                                            >
                                                <img
                                                    src={gridImages[3]}
                                                    alt="Foto 5"
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    style={{ height: '100%', objectFit: 'cover' }}
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                    }}
                                                />
                                                {finalImages.length > 5 && (
                                                    <button
                                                        className="absolute inset-0 bg-black/50 hover:bg-black/60 flex items-center justify-center text-white font-semibold cursor-pointer transition-colors backdrop-blur-[1px] rounded-br-2xl z-10"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setIsLightboxOpen(true);
                                                            setLightboxIndex(0);
                                                        }}
                                                    >
                                                        <span className="text-sm">Mostrar todas las fotos</span>
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="bg-gray-100 rounded-br-2xl" style={{ height: '100%' }} />
                                        )}
                                    </div>
                                </div>

                                {/* Móvil: 1 grande izquierda + 2 verticales derecha */}
                                <div className="lg:hidden w-full grid grid-cols-[2fr_1fr] gap-2 h-[320px] rounded-lg overflow-hidden">
                                    {/* Imagen grande izquierda */}
                                    <div 
                                        className="relative overflow-hidden cursor-pointer group rounded-l-lg bg-gray-100"
                                        onClick={() => handleImageClick(0)}
                                    >
                                        {heroImage && (
                                            <img
                                                src={heroImage}
                                                alt="Servicio principal"
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                }}
                                            />
                                        )}
                                    </div>
                                    {/* Grid derecha - 2 imágenes verticales */}
                                    <div className="grid grid-rows-2 gap-2 h-full">
                                        {mobileGridImages[0] ? (
                                            <div
                                                className="relative overflow-hidden cursor-pointer group bg-gray-100 rounded-tr-lg"
                                                onClick={() => handleImageClick(1)}
                                            >
                                                <img
                                                    src={mobileGridImages[0]}
                                                    alt="Foto 2"
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                    }}
                                                />
                                            </div>
                                        ) : (
                                            <div className="bg-gray-100 rounded-tr-lg" />
                                        )}
                                        {mobileGridImages[1] ? (
                                            <div
                                                className="relative overflow-hidden cursor-pointer group bg-gray-100 rounded-br-lg"
                                                onClick={() => handleImageClick(2)}
                                            >
                                                <img
                                                    src={mobileGridImages[1]}
                                                    alt="Foto 3"
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                    }}
                                                />
                                                {finalImages.length > 3 && (
                                                    <button
                                                        className="absolute inset-0 bg-black/50 hover:bg-black/60 flex items-center justify-center text-white font-semibold cursor-pointer transition-colors backdrop-blur-[1px] rounded-br-lg"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setIsLightboxOpen(true);
                                                            setLightboxIndex(0);
                                                        }}
                                                    >
                                                        <span className="text-xs">Mostrar todas las fotos</span>
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="bg-gray-100 rounded-br-lg" />
                                        )}
                                    </div>
                                </div>
                    </>
                )}

                {/* Layout de dos columnas después de las imágenes (Desktop) */}
                <div className="hidden lg:block">
                    <div className="grid grid-cols-[minmax(0,1fr)_400px] gap-12 mt-8">
                    {/* Columna izquierda - Contenido principal */}
                    <div className="space-y-6 w-full">
                        {/* Header del servicio estilo Airbnb */}
                        <div className="space-y-3 pt-4">
                            <div>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[#717171]">
                                    <div className="flex items-center gap-1.5">
                                        <Star className="w-[14px] h-[14px] fill-[#0066CC] text-[#0066CC]" />
                                        <span className="font-semibold text-[#222222]">
                                            {finalRating > 0 ? finalRating.toFixed(1) : 'Nuevo'}
                                        </span>
                                        {finalReviews.length > 0 && (
                                            <>
                                                <span>·</span>
                                                <button className="underline cursor-pointer hover:text-[#222222] decoration-1">
                                                    {finalReviews.length} {finalReviews.length === 1 ? 'reseña' : 'reseñas'}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                    {finalCompletedSearches > 0 && (
                                        <>
                                            <span>·</span>
                                            <div className="flex items-center gap-1.5">
                                                <CheckCircle className="w-[14px] h-[14px] text-[#00A699]" />
                                                <span>{finalCompletedSearches} servicios completados</span>
                                            </div>
                                        </>
                                    )}
                                    {latitude && longitude && (
                                        <>
                                            <span>·</span>
                                            <button className="flex items-center gap-1.5 underline cursor-pointer hover:text-[#222222] decoration-1">
                                                <MapPin className="w-[14px] h-[14px]" />
                                                <span>Mostrar mapa</span>
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-[#EBEBEB] pt-6 mt-4"></div>

                        {/* Información del experto estilo Airbnb */}
                        <div className="flex items-start gap-4 pb-5 border-b border-[#EBEBEB]">
                            <Avatar className="w-10 h-10 flex-shrink-0 border border-[#EBEBEB]">
                                <AvatarImage src={finalExpertPicture} alt={finalExpertName} />
                                <AvatarFallback className="bg-[#F7F7F7] text-[#222222] font-semibold">
                                    {finalExpertName.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <div className="mb-1.5">
                                    <h3 className="text-base font-semibold text-[#222222] mb-0.5" style={{ fontFamily: 'Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif' }}>
                                        Anfitrión: {finalExpertName}
                                    </h3>
                                    {finalService?.expert?.createdAt && (
                                        <p className="text-sm text-[#717171]">
                                            {(() => {
                                                const monthsSince = Math.floor(
                                                    (Date.now() - new Date(finalService.expert.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30)
                                                );
                                                if (monthsSince < 1) return 'Menos de 1 mes de experiencia';
                                                if (monthsSince === 1) return '1 mes de experiencia';
                                                return `${monthsSince} meses de experiencia`;
                                            })()}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="flex items-center gap-1.5">
                                        <Star className="w-3.5 h-3.5 fill-[#0066CC] text-[#0066CC]" />
                                        <span className="font-semibold text-[#222222]">
                                            {finalRating > 0 ? finalRating.toFixed(1) : 'Nuevo'}
                                        </span>
                                    </div>
                                    {finalReviews.length > 0 && (
                                        <>
                                            <span className="text-[#717171]">·</span>
                                            <button className="text-[#717171] underline cursor-pointer hover:text-[#222222] decoration-1">
                                                {finalReviews.length} {finalReviews.length === 1 ? 'reseña' : 'reseñas'}
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Detalles del servicio estilo Airbnb */}
                        <div className="space-y-6 pb-6 border-b border-[#EBEBEB]">
                            {/* Información básica con iconos */}
                            <div className="space-y-5">
                                {finalDeliverableTypes.length > 0 && (
                                    <div>
                                        <h3 className="text-base font-semibold text-[#222222] mb-3">Qué incluye</h3>
                                        <div className="space-y-3">
                                            {finalDeliverableTypes.map((dt) => (
                                                <div key={dt.id} className="flex items-start gap-3">
                                                    <CheckCircle className="w-5 h-5 text-[#222222] flex-shrink-0 mt-0.5" />
                                                    <div className="flex-1">
                                                        <div className="text-sm font-semibold text-[#222222] mb-1">
                                                            {dt.displayName || dt.name}
                                                        </div>
                                                        <div className="text-sm text-[#717171] leading-relaxed">
                                                            {dt.description || `Incluye ${dt.displayName || dt.name} completo con todos los detalles y especificaciones necesarias para garantizar la máxima calidad del servicio. Este elemento forma parte integral de la experiencia y está diseñado para cumplir con los más altos estándares profesionales.`}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {finalService?.durationInHours && (
                                    <div className="flex items-start gap-3">
                                        <Clock className="w-5 h-5 text-[#222222] mt-0.5 flex-shrink-0" />
                                        <div className="flex-1">
                                            <h3 className="text-sm font-semibold text-[#222222] mb-1">Duración</h3>
                                            <p className="text-sm text-[#717171]">
                                                {finalService.durationInHours} {finalService.durationInHours === 1 ? 'hora' : 'horas'}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Asistencia 24h */}
                                <div className="flex items-start gap-3">
                                    <Headphones className="w-5 h-5 text-[#222222] mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                        <h3 className="text-sm font-semibold text-[#222222] mb-1">Asistencia 24/7</h3>
                                        <p className="text-sm text-[#717171]">
                                            Nuestro equipo de soporte está disponible las 24 horas del día, los 7 días de la semana para ayudarte con cualquier consulta o problema que puedas tener durante el servicio.
                                        </p>
                                    </div>
                                </div>

                                {/* Garantía de calidad */}
                                <div className="flex items-start gap-3">
                                    <Award className="w-5 h-5 text-[#222222] mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                        <h3 className="text-sm font-semibold text-[#222222] mb-1">Garantía de satisfacción</h3>
                                        <p className="text-sm text-[#717171]">
                                            Estamos tan seguros de la calidad de nuestro trabajo que ofrecemos una garantía completa. Si no quedas satisfecho, trabajaremos contigo hasta resolver cualquier problema.
                                        </p>
                                    </div>
                                </div>

                                {/* Respuesta rápida */}
                                <div className="flex items-start gap-3">
                                    <Zap className="w-5 h-5 text-[#222222] mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                        <h3 className="text-sm font-semibold text-[#222222] mb-1">Respuesta rápida</h3>
                                        <p className="text-sm text-[#717171]">
                                            Respondemos a todas las consultas en menos de 2 horas durante el horario laboral. Comunicación clara y transparente en cada paso del proceso.
                                        </p>
                                    </div>
                                </div>

                                {/* Soporte post-servicio */}
                                <div className="flex items-start gap-3">
                                    <MessageCircle className="w-5 h-5 text-[#222222] mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                        <h3 className="text-sm font-semibold text-[#222222] mb-1">Soporte continuo</h3>
                                        <p className="text-sm text-[#717171]">
                                            El servicio no termina con la entrega. Ofrecemos seguimiento y soporte continuo para asegurarnos de que todo funcione perfectamente y puedas resolver cualquier duda posterior.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Descripción */}
                            <div>
                                <h2 className="text-base font-semibold text-[#222222] mb-3">Acerca de este servicio</h2>
                                <div className="text-sm text-[#222222] leading-relaxed space-y-3">
                                    {finalDescription && finalDescription.trim() ? (
                                        <p className="whitespace-pre-line">{finalDescription}</p>
                                    ) : (
                                        <>
                                            <p>
                                                Este servicio profesional está diseñado para ofrecerte una experiencia completa y de alta calidad. 
                                                Nuestro equipo de expertos cuenta con años de experiencia en el sector y está comprometido con 
                                                brindarte los mejores resultados.
                                            </p>
                                            <p>
                                                Trabajamos con metodologías probadas y herramientas de última generación para garantizar que 
                                                cada detalle sea cuidado al máximo. Desde la planificación inicial hasta la entrega final, 
                                                nos aseguramos de mantenerte informado en cada paso del proceso.
                                            </p>
                                            <p>
                                                Tu satisfacción es nuestra prioridad. Por eso, ofrecemos un servicio personalizado que se 
                                                adapta a tus necesidades específicas. No dudes en contactarnos si tienes alguna pregunta 
                                                o requisito especial que quieras discutir antes de reservar.
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Reseñas estilo Airbnb */}
                        {finalReviews.length > 0 && (
                            <div className="pb-8 border-b border-[#EBEBEB]">
                                <div className="flex items-center gap-2.5 mb-6">
                                    <div className="flex items-center gap-1.5">
                                        <Star className="w-4 h-4 fill-[#222222] text-[#222222]" />
                                        <span className="text-base font-semibold text-[#222222]">
                                            {finalRating.toFixed(1)}
                                        </span>
                                    </div>
                                    <div className="text-sm text-[#717171]">
                                        <span className="font-semibold text-[#222222]">{finalReviews.length}</span> {finalReviews.length === 1 ? 'reseña' : 'reseñas'}
                                    </div>
                                </div>
                                <EnhancedReviewsList 
                                    reviews={finalReviews}
                                    maxReviews={10}
                                />
                            </div>
                        )}
                    </div>

                    {/* Columna derecha - Sidebar de reserva estilo Airbnb (Desktop) */}
                    <div>
                        <div className="sticky top-24">
                            <div className="border border-[#DDDDDD] rounded-2xl shadow-[0_6px_16px_rgba(0,0,0,0.12)] overflow-hidden bg-white">
                                <div className="p-6 space-y-6">
                                    <div>
                                        <div className="flex items-baseline gap-1.5 mb-2">
                                            <span className="text-xl font-semibold text-[#222222]">
                                                {formatPrice(finalPrice)}
                                            </span>
                                            <span className="text-sm text-[#717171]">por servicio</span>
                                        </div>
                                        {finalRating > 0 && (
                                            <div className="flex items-center gap-1.5 text-sm text-[#717171]">
                                                <Star className="w-3.5 h-3.5 fill-[#0066CC] text-[#0066CC]" />
                                                <span className="font-semibold text-[#222222]">
                                                    {finalRating.toFixed(1)}
                                                </span>
                                                <span>·</span>
                                                <button className="underline cursor-pointer hover:text-[#222222] decoration-1">
                                                    {finalReviews.length} {finalReviews.length === 1 ? 'reseña' : 'reseñas'}
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <Button
                                        onClick={onContinue}
                                        className="w-full h-14 text-base font-semibold bg-[#0066CC] text-white hover:bg-[#0052A3] rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                                        size="lg"
                                    >
                                        Reservar
                                    </Button>

                                    <div className="text-center text-sm text-[#717171] leading-relaxed">
                                        No se te cobrará nada aún
                                    </div>

                                    <div className="border-t border-[#EBEBEB] pt-6"></div>

                                    <div className="space-y-5 text-sm">
                                        <div className="flex items-start gap-3">
                                            <div className="flex-shrink-0 mt-0.5">
                                                <CheckCircle className="w-4 h-4 text-[#222222]" />
                                            </div>
                                            <div>
                                                <div className="font-semibold text-[#222222] mb-1">Cancelación gratuita</div>
                                                <div className="text-sm text-[#717171] leading-relaxed">
                                                    Cancela hasta 24 horas antes de la fecha de inicio para recibir un reembolso completo.
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="flex-shrink-0 mt-0.5">
                                                <Shield className="w-4 h-4 text-[#222222]" />
                                            </div>
                                            <div>
                                                <div className="font-semibold text-[#222222] mb-1">Pago seguro</div>
                                                <div className="text-sm text-[#717171] leading-relaxed">
                                                    Tu pago está protegido y seguro.
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-t border-[#EBEBEB] pt-6"></div>

                                    <div className="text-xs text-[#717171] text-center">
                                        <button className="underline hover:text-[#222222] decoration-1 transition-colors">
                                            Denunciar este anuncio
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                </div>

                {/* Contenido móvil - sin sidebar */}
                <div className="lg:hidden space-y-6 pb-24">
                    {/* Header del servicio estilo Airbnb */}
                    <div className="space-y-2 pt-2">
                        <div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[#717171]">
                                <div className="flex items-center gap-1.5">
                                    <Star className="w-[14px] h-[14px] fill-[#0066CC] text-[#0066CC]" />
                                    <span className="font-semibold text-[#222222]">
                                        {finalRating > 0 ? finalRating.toFixed(1) : 'Nuevo'}
                                    </span>
                                    {finalReviews.length > 0 && (
                                        <>
                                            <span>·</span>
                                            <button className="underline cursor-pointer hover:text-[#222222] decoration-1">
                                                {finalReviews.length} {finalReviews.length === 1 ? 'reseña' : 'reseñas'}
                                            </button>
                                        </>
                                    )}
                                </div>
                                {finalCompletedSearches > 0 && (
                                    <>
                                        <span>·</span>
                                        <div className="flex items-center gap-1.5">
                                            <CheckCircle className="w-[14px] h-[14px] text-[#00A699]" />
                                            <span>{finalCompletedSearches} servicios completados</span>
                                        </div>
                                    </>
                                )}
                                {latitude && longitude && (
                                    <>
                                        <span>·</span>
                                        <button className="flex items-center gap-1.5 underline cursor-pointer hover:text-[#222222] decoration-1">
                                            <MapPin className="w-[14px] h-[14px]" />
                                            <span>Mostrar mapa</span>
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-[#EBEBEB] pt-4 mt-3"></div>

                    {/* Información del experto estilo Airbnb */}
                    <div className="flex items-start gap-3 pb-4 border-b border-[#EBEBEB]">
                        <Avatar className="w-10 h-10 flex-shrink-0 border border-[#EBEBEB]">
                            <AvatarImage src={finalExpertPicture} alt={finalExpertName} />
                            <AvatarFallback className="bg-[#F7F7F7] text-[#222222] font-semibold">
                                {finalExpertName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <div className="mb-1.5">
                                <h3 className="text-base font-semibold text-[#222222] mb-0.5">
                                    Anfitrión: {finalExpertName}
                                </h3>
                                {finalService?.expert?.createdAt && (
                                    <p className="text-sm text-[#717171]">
                                        {(() => {
                                            const monthsSince = Math.floor(
                                                (Date.now() - new Date(finalService.expert.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30)
                                            );
                                            if (monthsSince < 1) return 'Menos de 1 mes de experiencia';
                                            if (monthsSince === 1) return '1 mes de experiencia';
                                            return `${monthsSince} meses de experiencia`;
                                        })()}
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <div className="flex items-center gap-1.5">
                                    <Star className="w-3.5 h-3.5 fill-[#0066CC] text-[#0066CC]" />
                                    <span className="font-semibold text-[#222222]">
                                        {finalRating > 0 ? finalRating.toFixed(1) : 'Nuevo'}
                                    </span>
                                </div>
                                {finalReviews.length > 0 && (
                                    <>
                                        <span className="text-[#717171]">·</span>
                                        <button className="text-[#717171] underline cursor-pointer hover:text-[#222222] decoration-1">
                                            {finalReviews.length} {finalReviews.length === 1 ? 'reseña' : 'reseñas'}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Detalles del servicio estilo Airbnb */}
                    <div className="space-y-6 pb-6 border-b border-[#EBEBEB]">
                        {/* Información básica con iconos */}
                        <div className="space-y-5">
                            {finalDeliverableTypes.length > 0 && (
                                <div>
                                    <h3 className="text-base font-semibold text-[#222222] mb-3">Qué incluye</h3>
                                    <div className="space-y-3">
                                        {finalDeliverableTypes.map((dt) => (
                                            <div key={dt.id} className="flex items-start gap-3">
                                                <CheckCircle className="w-5 h-5 text-[#222222] flex-shrink-0 mt-0.5" />
                                                <div className="flex-1">
                                                    <div className="text-sm font-semibold text-[#222222] mb-1">
                                                        {dt.displayName || dt.name}
                                                    </div>
                                                    <div className="text-sm text-[#717171] leading-relaxed">
                                                        {dt.description || `Incluye ${dt.displayName || dt.name} completo con todos los detalles y especificaciones necesarias para garantizar la máxima calidad del servicio. Este elemento forma parte integral de la experiencia y está diseñado para cumplir con los más altos estándares profesionales.`}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {finalService?.durationInHours && (
                                <div className="flex items-start gap-3">
                                    <Clock className="w-5 h-5 text-[#222222] mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                        <h3 className="text-sm font-semibold text-[#222222] mb-1">Duración</h3>
                                        <p className="text-sm text-[#717171]">
                                            {finalService.durationInHours} {finalService.durationInHours === 1 ? 'hora' : 'horas'}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Asistencia 24h */}
                            <div className="flex items-start gap-3">
                                <Headphones className="w-5 h-5 text-[#222222] mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                    <h3 className="text-sm font-semibold text-[#222222] mb-1">Asistencia 24/7</h3>
                                    <p className="text-sm text-[#717171]">
                                        Nuestro equipo de soporte está disponible las 24 horas del día, los 7 días de la semana para ayudarte con cualquier consulta o problema que puedas tener durante el servicio.
                                    </p>
                                </div>
                            </div>

                            {/* Garantía de calidad */}
                            <div className="flex items-start gap-3">
                                <Award className="w-5 h-5 text-[#222222] mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                    <h3 className="text-sm font-semibold text-[#222222] mb-1">Garantía de satisfacción</h3>
                                    <p className="text-sm text-[#717171]">
                                        Estamos tan seguros de la calidad de nuestro trabajo que ofrecemos una garantía completa. Si no quedas satisfecho, trabajaremos contigo hasta resolver cualquier problema.
                                    </p>
                                </div>
                            </div>

                            {/* Respuesta rápida */}
                            <div className="flex items-start gap-3">
                                <Zap className="w-5 h-5 text-[#222222] mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                    <h3 className="text-sm font-semibold text-[#222222] mb-1">Respuesta rápida</h3>
                                    <p className="text-sm text-[#717171]">
                                        Respondemos a todas las consultas en menos de 2 horas durante el horario laboral. Comunicación clara y transparente en cada paso del proceso.
                                    </p>
                                </div>
                            </div>

                            {/* Soporte post-servicio */}
                            <div className="flex items-start gap-3">
                                <MessageCircle className="w-5 h-5 text-[#222222] mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                    <h3 className="text-sm font-semibold text-[#222222] mb-1">Soporte continuo</h3>
                                    <p className="text-sm text-[#717171]">
                                        El servicio no termina con la entrega. Ofrecemos seguimiento y soporte continuo para asegurarnos de que todo funcione perfectamente y puedas resolver cualquier duda posterior.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Descripción */}
                        <div>
                            <h2 className="text-base font-semibold text-[#222222] mb-3">Acerca de este servicio</h2>
                            <div className="text-sm text-[#222222] leading-relaxed space-y-3">
                                {finalDescription && finalDescription.trim() ? (
                                    <p className="whitespace-pre-line">{finalDescription}</p>
                                ) : (
                                    <>
                                        <p>
                                            Este servicio profesional está diseñado para ofrecerte una experiencia completa y de alta calidad. 
                                            Nuestro equipo de expertos cuenta con años de experiencia en el sector y está comprometido con 
                                            brindarte los mejores resultados.
                                        </p>
                                        <p>
                                            Trabajamos con metodologías probadas y herramientas de última generación para garantizar que 
                                            cada detalle sea cuidado al máximo. Desde la planificación inicial hasta la entrega final, 
                                            nos aseguramos de mantenerte informado en cada paso del proceso.
                                        </p>
                                        <p>
                                            Tu satisfacción es nuestra prioridad. Por eso, ofrecemos un servicio personalizado que se 
                                            adapta a tus necesidades específicas. No dudes en contactarnos si tienes alguna pregunta 
                                            o requisito especial que quieras discutir antes de reservar.
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                        {/* Reseñas estilo Airbnb */}
                        {finalReviews.length > 0 && (
                            <div className="pb-5 border-b border-[#EBEBEB] w-full">
                                <div className="flex items-center gap-2.5 mb-4">
                                    <div className="flex items-center gap-1.5">
                                        <Star className="w-4 h-4 fill-[#222222] text-[#222222]" />
                                        <span className="text-base font-semibold text-[#222222]">
                                            {finalRating.toFixed(1)}
                                        </span>
                                    </div>
                                    <div className="text-sm text-[#717171]">
                                        <span className="font-semibold text-[#222222]">{finalReviews.length}</span> {finalReviews.length === 1 ? 'reseña' : 'reseñas'}
                                    </div>
                                </div>
                                <div className="w-full">
                                    <EnhancedReviewsList 
                                        reviews={finalReviews}
                                        maxReviews={10}
                                    />
                                </div>
                            </div>
                        )}
                </div>

                {/* Botón de reserva fijo estilo Airbnb (Mobile) */}
                <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#DDDDDD] p-3 shadow-[0_-4px_16px_rgba(0,0,0,0.12)] z-50">
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <div className="text-xs text-[#717171] mb-0.5">Precio</div>
                            <div className="text-base font-semibold text-[#222222]">
                                {formatPrice(finalPrice)}
                                <span className="text-sm font-normal text-[#717171] ml-1">por servicio</span>
                            </div>
                        </div>
                    </div>
                    <Button
                        onClick={onContinue}
                        className="w-full h-10 text-sm font-semibold bg-[#0066CC] text-white hover:bg-[#0052A3] rounded-lg shadow-sm"
                        size="lg"
                    >
                        Reservar
                    </Button>
                </div>
            </div>

            {/* Lightbox para ver todas las fotos */}
            <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
                <DialogContent className="max-w-7xl w-full p-0 bg-black/95 border-none" aria-describedby="lightbox-description">
                    <span id="lightbox-description" className="sr-only">Galería de fotos del servicio</span>
                    <div className="relative">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
                            onClick={() => setIsLightboxOpen(false)}
                        >
                            <X className="w-6 h-6" />
                        </Button>
                        
                        {finalImages.length > 1 && (
                            <>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute left-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20"
                                    onClick={() => handleLightboxNavigation('prev')}
                                >
                                    <ChevronLeft className="w-8 h-8" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20"
                                    onClick={() => handleLightboxNavigation('next')}
                                >
                                    <ChevronRight className="w-8 h-8" />
                                </Button>
                            </>
                        )}

                        <div className="relative w-full h-[80vh] flex items-center justify-center">
                            <img
                                src={finalImages[lightboxIndex]}
                                alt={`Foto ${lightboxIndex + 1}`}
                                className="max-w-full max-h-full object-contain"
                            />
                        </div>

                        {finalImages.length > 1 && (
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full text-sm backdrop-blur-sm">
                                {lightboxIndex + 1} / {finalImages.length}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

