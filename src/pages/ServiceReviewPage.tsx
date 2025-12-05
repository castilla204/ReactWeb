import React, { useState, useRef } from 'react';
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
import { Button } from '../components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
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
        <div className="min-h-screen bg-white">
            {/* ========== VERSIÓN MÓVIL ========== */}
            <div className="lg:hidden">
                {/* Header móvil flotante */}
                <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/40 to-transparent">
                    <button
                                onClick={onBack}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-lg"
                    >
                        <ChevronLeft className="w-5 h-5 text-gray-900" />
                    </button>
                    <div className="flex items-center gap-2">
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
                </div>

                {/* Galería móvil con carrusel */}
                {finalImages.length > 0 && (
                    <div className="relative">
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

                {/* Contenido móvil */}
                <div className="px-5 pt-5 pb-32">
                    {/* Título */}
                    <h1 className="text-[22px] font-semibold text-gray-900 leading-tight mb-2">
                        {serviceTypeName} por {finalExpertName}
                    </h1>

                    {/* Meta info */}
                    <div className="flex flex-wrap items-center gap-x-2 text-sm text-gray-600 mb-5">
                        {finalRating > 0 ? (
                            <>
                                <Star className="w-4 h-4 fill-gray-900 text-gray-900" />
                                <span className="font-medium text-gray-900">{finalRating.toFixed(1)}</span>
                                                <span>·</span>
                                <span className="underline">{finalReviews.length} reseñas</span>
                                            </>
                        ) : (
                            <span className="flex items-center gap-1">
                                <Star className="w-4 h-4" />
                                Nuevo
                            </span>
                                        )}
                                    {finalCompletedSearches > 0 && (
                                        <>
                                            <span>·</span>
                                <span>{finalCompletedSearches} completados</span>
                                        </>
                                    )}
                                </div>

                    <div className="h-px bg-gray-200 mb-5" />

                    {/* Info del anfitrión */}
                    <div className="flex items-center gap-4 mb-5">
                        <Avatar className="w-12 h-12">
                            <AvatarImage src={finalExpertPicture} alt={finalExpertName} />
                            <AvatarFallback className="bg-gray-900 text-white font-semibold">
                                {finalExpertName.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h3 className="font-medium text-gray-900">Anfitrión: {finalExpertName}</h3>
                            <p className="text-sm text-gray-500">
                                {finalService?.expert?.createdAt 
                                    ? (() => {
                                        const months = Math.floor((Date.now() - new Date(finalService.expert.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30));
                                        return months < 1 ? 'Menos de 1 mes' : `${months} meses de experiencia`;
                                    })()
                                    : 'Profesional verificado'
                                }
                            </p>
                        </div>
                    </div>

                    <div className="h-px bg-gray-200 mb-5" />

                    {/* Features destacadas */}
                    <div className="space-y-5 mb-5">
                        <div className="flex gap-4">
                            <Shield className="w-6 h-6 text-gray-700 flex-shrink-0" />
                            <div>
                                <h4 className="font-medium text-gray-900">Cancelación gratuita</h4>
                                <p className="text-sm text-gray-500">Cancela hasta 24h antes sin cargos</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <Headphones className="w-6 h-6 text-gray-700 flex-shrink-0" />
                            <div>
                                <h4 className="font-medium text-gray-900">Soporte 24/7</h4>
                                <p className="text-sm text-gray-500">Asistencia disponible en cualquier momento</p>
                                </div>
                                    </div>
                        <div className="flex gap-4">
                            <Award className="w-6 h-6 text-gray-700 flex-shrink-0" />
                            <div>
                                <h4 className="font-medium text-gray-900">Garantía de satisfacción</h4>
                                <p className="text-sm text-gray-500">Si no quedas satisfecho, te devolvemos el dinero</p>
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-gray-200 mb-5" />

                    {/* Qué incluye */}
                                {finalDeliverableTypes.length > 0 && (
                        <>
                            <div className="mb-5">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Qué incluye</h3>
                                        <div className="space-y-3">
                                            {finalDeliverableTypes.map((dt) => (
                                                <div key={dt.id} className="flex items-start gap-3">
                                            <CheckCircle className="w-5 h-5 text-gray-900 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <span className="text-gray-900">{dt.displayName || dt.name}</span>
                                                {dt.description && (
                                                    <p className="text-sm text-gray-500 mt-0.5">{dt.description}</p>
                                                )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                            <div className="h-px bg-gray-200 mb-5" />
                        </>
                    )}

                    {/* Descripción */}
                    <div className="mb-5">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Acerca del servicio</h3>
                        <p className="text-gray-600 leading-relaxed">
                            {finalDescription || 'Este servicio profesional incluye todo lo necesario para garantizar tu satisfacción. Nuestro equipo de expertos está comprometido con brindarte la mejor experiencia posible.'}
                                            </p>
                                        </div>

                    {/* Reseñas */}
                    {finalReviews.length > 0 && (
                        <>
                            <div className="h-px bg-gray-200 mb-5" />
                            <div className="mb-5">
                                <div className="flex items-center gap-2 mb-4">
                                    <Star className="w-5 h-5 fill-gray-900 text-gray-900" />
                                    <span className="text-lg font-semibold">{finalRating.toFixed(1)}</span>
                                    <span className="text-gray-500">·</span>
                                    <span className="text-gray-600">{finalReviews.length} reseñas</span>
                                </div>
                                <EnhancedReviewsList reviews={finalReviews} maxReviews={5} />
                                    </div>
                        </>
                    )}
                                </div>

                {/* Footer fijo móvil */}
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-5 py-3 z-50">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-base font-semibold text-gray-900">{formatPrice(finalPrice)} €</span>
                                <span className="text-xs text-gray-500">total</span>
                            </div>
                            {finalRating > 0 && (
                                <div className="flex items-center gap-1 text-xs">
                                    <Star className="w-3 h-3 fill-gray-900 text-gray-900" />
                                    <span className="font-medium">{finalRating.toFixed(1)}</span>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={onContinue}
                            className="h-11 px-6 bg-[#0066CC] hover:bg-[#0052A3] text-white font-medium rounded-lg transition-colors"
                        >
                            Reservar
                        </button>
                    </div>
                </div>
            </div>

            {/* ========== VERSIÓN DESKTOP ========== */}
            <div className="hidden lg:block">
                {/* Header desktop */}
                <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
                    <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                        <button
                            onClick={onBack}
                            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-800" />
                        </button>
                        
                        {/* Steps */}
                        <div className="flex items-center gap-2">
                            {Array.from({ length: totalSteps }).map((_, i) => (
                                <React.Fragment key={i}>
                                    <div className={`w-2.5 h-2.5 rounded-full ${i + 1 <= currentStep ? 'bg-gray-900' : 'bg-gray-300'}`} />
                                    {i < totalSteps - 1 && <div className="w-6 h-0.5 bg-gray-200" />}
                                </React.Fragment>
                            ))}
                        </div>

                        <div className="w-9" /> {/* Spacer */}
                                    </div>
                </header>

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
                            <div className="flex items-center gap-3 py-4 border-b border-gray-200">
                                <Avatar className="w-11 h-11">
                                    <AvatarImage src={finalExpertPicture} alt={finalExpertName} />
                                    <AvatarFallback className="bg-gray-900 text-white text-base font-semibold">
                                        {finalExpertName.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-900">Anfitrión: {finalExpertName}</h3>
                                    <p className="text-xs text-gray-500">
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
                                    <button
                                        onClick={onContinue}
                                        className="w-full h-11 bg-[#0066CC] hover:bg-[#0052A3] text-white text-sm font-semibold rounded-lg transition-colors mb-3"
                                    >
                                        Reservar
                                    </button>

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
    );
}
