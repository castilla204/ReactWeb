import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useWindowSize } from '../hooks/useWindowSize';
import { ArrowRight, ArrowLeft, Search, X, Star, CheckCircle, User, Info, MapPin, Award, Zap, Shield, TrendingUp, Clock, FileText, Image, Video, Heart, ChevronRight, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ImageCarousel } from './ui/image-carousel';
// useLoadScript ya no es necesario - MapContainer lo maneja internamente
import { useServices } from '../hooks/useServices';
import { useInfiniteServices } from '../hooks/useInfiniteServices';
// useMapExperts ya no es necesario - MapContainer lo maneja internamente
import { useMapMarkers } from '../hooks/useMapMarkers'; // ✅ NUEVO: Marcadores ultra ligeros
import { MapContainer } from './Map/MapContainer';
import { Service } from '../hooks/useServiceLoader';
import { useAuth } from '../contexts/AuthContext';
import { useServiceFavorites } from '../hooks/useServiceFavorites';
import { showToast } from '../lib/toast';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { Input } from './ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose, DrawerOverlay } from './ui/drawer';
import { ResponsiveModal } from './ui/responsive-modal';
import { CustomBottomSheet } from './ui/custom-bottom-sheet';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Slider } from './ui/slider';
import { Label } from './ui/label';
import CountryFlag from './CountryFlag';
import CountrySelector from './CountrySelector';
import { getCountryCoordinates } from '../utils/countryCoordinates';
import { getCountryName } from '../utils/countries';
import { useCurrency } from '../contexts/CurrencyContext';
import Autocomplete from 'react-google-autocomplete';

// libraries ya no es necesario - MapContainer lo maneja internamente

// Componente para la card del servicio en el mapa
interface MapServiceCardProps {
    service: any;
    isSelected: boolean;
    onSelect: (serviceId: number) => void;
    initialIsFavorite?: boolean; // Estado inicial desde check-multiple
}

const MapServiceCard: React.FC<MapServiceCardProps> = ({ service, isSelected, onSelect, initialIsFavorite = false }) => {
    const [imageIndex, setImageIndex] = useState(0);
    const { isAuthenticated } = useAuth();
    const { toggleFavoriteAsync, checkFavorite } = useServiceFavorites();
    const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
    const navigate = useNavigate();
    const [isMobile, setIsMobile] = useState(false);
    
    const serviceId = service.id || service.Id;
    
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);
    
    // ✅ OPTIMIZADO: Solo verificar favorito individual si no viene en initialIsFavorite
    // Esto evita llamadas duplicadas ya que checkMultipleFavorites se ejecuta en el padre
    const { data: favoriteCheck } = checkFavorite(serviceId, {
        enabled: initialIsFavorite === undefined && isAuthenticated, // Solo si no viene inicial
    });
    
    useEffect(() => {
        // Priorizar initialIsFavorite (viene de checkMultipleFavorites)
        if (initialIsFavorite !== undefined) {
            setIsFavorite(initialIsFavorite);
        } else if (favoriteCheck?.data?.isFavorite !== undefined) {
            setIsFavorite(favoriteCheck.data.isFavorite);
        }
    }, [favoriteCheck, initialIsFavorite]);
    
    const imageUrls = Array.isArray(service.imageUrls) 
        ? service.imageUrls 
        : Array.isArray(service.ImageUrls) 
            ? service.ImageUrls 
            : [];
    const hasMultipleImages = imageUrls.length > 1;
    const isGuestFavorite = (service.completedSearches || 0) > 10 && (service.averageRating || 0) >= 4.5;
    
    const handleCardClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        navigate(`/service/${serviceId}`);
    };
    
    const handleFavoriteClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        
        if (!isAuthenticated) {
            showToast('info', 'Inicia sesión para guardar favoritos', 3000);
            return;
        }

        try {
            const result = await toggleFavoriteAsync(serviceId);
            setIsFavorite(result.isFavorite);
            showToast('success', result.message, 2000);
        } catch (error: any) {
            console.error('Error al actualizar favorito:', error);
            showToast('error', error.message || 'Error al actualizar favorito', 3000);
        }
    };
    
    const handleImageNavigation = (e: React.MouseEvent, direction: 'prev' | 'next') => {
        e.stopPropagation();
        if (imageUrls.length <= 1) return;
        
        if (direction === 'next') {
            setImageIndex((prev) => (prev + 1) % imageUrls.length);
        } else {
            setImageIndex((prev) => (prev - 1 + imageUrls.length) % imageUrls.length);
        }
    };
    
    // Precio del servicio. Round 24: conversión a moneda preferida del usuario.
    const { formatPriceWithSource, preferredCurrency } = useCurrency();
    const priceData = (() => {
        if (!service.price) return { display: 'Consultar', wasConverted: false, sourceFormatted: '' };
        const src = service.priceCurrency || service.currency || service.Currency || 'EUR';
        const info = formatPriceWithSource(service.price, src, preferredCurrency);
        if (!info.wasConverted) {
            const symbol = src === 'USD' ? '$' : src === 'GBP' ? '£' : src === 'CHF' ? 'CHF ' : src === 'CAD' ? 'C$' : '€';
            return { display: `${symbol}${Math.round(service.price)}`, wasConverted: false, sourceFormatted: '' };
        }
        const tSym = preferredCurrency === 'USD' ? '$' : preferredCurrency === 'GBP' ? '£' : preferredCurrency === 'CHF' ? 'CHF ' : preferredCurrency === 'CAD' ? 'C$' : '€';
        const sSym = src === 'USD' ? '$' : src === 'GBP' ? '£' : src === 'CHF' ? 'CHF ' : src === 'CAD' ? 'C$' : '€';
        return {
            display: `≈ ${tSym}${Math.round(info.convertedAmount)} ${preferredCurrency}`,
            wasConverted: true,
            sourceFormatted: `(${sSym}${Math.round(service.price)} ${src})`,
        };
    })();
    const price = priceData.display;
    
    // Horario de disponibilidad (formato compacto como en homepage)
    const formatAvailability = () => {
        const availability = service.expert?.currentAvailability;
        if (!availability) return 'Flexible';
        
        const days = availability.daysOfWeek || [];
        if (days.length === 0) return 'Flexible';
        
        const dayMap: Record<string, string> = {
            'Monday': 'L',
            'Tuesday': 'M',
            'Wednesday': 'X',
            'Thursday': 'J',
            'Friday': 'V',
            'Saturday': 'S',
            'Sunday': 'D'
        };
        
        const dayAbbr = days
            .slice(0, 5)
            .map((day: string) => dayMap[day] || day.charAt(0))
            .join('');
        
        const startTime = availability.startTime ? availability.startTime.substring(0, 5) : '';
        const endTime = availability.endTime ? availability.endTime.substring(0, 5) : '';
        
        if (startTime && endTime) {
            const startHour = parseInt(startTime.split(':')[0], 10).toString();
            const endHour = parseInt(endTime.split(':')[0], 10).toString();
            return `${dayAbbr} ${startHour}-${endHour}h`;
        }
        return dayAbbr || 'Flexible';
    };
    
    const availabilityInfo = formatAvailability();
    
    // En desktop, usar el mismo estilo que HomepageWall
    if (!isMobile) {
        return (
            <a
                href={`/service/${serviceId}`}
                onClick={handleCardClick}
                className="block flex-shrink-0 cursor-pointer group"
                style={{ width: '100%', textDecoration: 'none', color: 'inherit' }}
            >
                <div className="relative w-full">
                    {/* Contenedor de imagen - Estilo exacto de HomepageWall */}
                    <div className="relative w-full overflow-hidden mb-2" style={{ aspectRatio: '1', borderRadius: '20px', width: '100%' }}>
                        {imageUrls.length > 0 ? (
                            <>
                                <div className="relative w-full h-full">
                                    <img
                                        src={imageUrls[imageIndex]}
                                        alt={service.serviceTypeName || 'Servicio'}
                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                        style={{ display: 'block' }}
                                    />
                                </div>
                                
                                {/* Badge "Recomendamos" - Estilo exacto de HomepageWall */}
                                {isGuestFavorite && (
                                    <div
                                        className="absolute top-3 left-3 z-10"
                                        style={{
                                            padding: '0',
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
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
                                                aria-label="Recomendamos"
                                            >
                                                Recomendamos
                                            </span>
                                        </div>
                                    </div>
                                )}
                                
                                {/* Badge "Recomendación del viajero" cuando está seleccionado */}
                                {isSelected && (
                                    <div
                                        className="absolute top-3 left-3 z-10"
                                        style={{
                                            padding: '0',
                                        }}
                                    >
                                        <div
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
                                            <CheckCircle className="w-3.5 h-3.5 text-gray-900 flex-shrink-0" strokeWidth={2.5} />
                                            <span
                                                style={{
                                                    fontSize: '12px',
                                                    lineHeight: '16px',
                                                    fontWeight: 400,
                                                    color: '#000000',
                                                    fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                }}
                                            >
                                                Selección del usuario
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Botón de favorito - Estilo exacto de HomepageWall */}
                                <button
                                    onClick={handleFavoriteClick}
                                    className="absolute top-3 right-3 z-10"
                                    style={{
                                        padding: '0',
                                        margin: '0',
                                        backgroundColor: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '24px',
                                        height: '24px',
                                    }}
                                >
                                    <svg
                                        viewBox="0 0 32 32"
                                        xmlns="http://www.w3.org/2000/svg"
                                        aria-hidden="true"
                                        role="presentation"
                                        focusable="false"
                                        style={{
                                            display: 'block',
                                            fill: isFavorite ? '#FF385C' : 'rgba(0, 0, 0, 0.5)',
                                            height: '24px',
                                            width: '24px',
                                            stroke: isFavorite ? '#FF385C' : 'rgba(255, 255, 255, 0.8)',
                                            strokeWidth: '2',
                                            overflow: 'visible',
                                            margin: '0',
                                            padding: '0',
                                        }}
                                    >
                                        <path d="m15.9998 28.6668c7.1667-4.8847 14.3334-10.8844 14.3334-18.1088 0-1.84951-.6993-3.69794-2.0988-5.10877-1.3996-1.4098-3.2332-2.11573-5.0679-2.11573-1.8336 0-3.6683.70593-5.0668 2.11573l-2.0999 2.11677-2.0999-2.11677c-1.3985-1.4098-3.2332-2.11573-5.0668-2.11573-1.8347 0-3.6683.70593-5.0679 2.11573-1.3996 1.41083-2.0988 3.25926-2.0988 5.10877 0 7.2244 7.1667 13.2241 14.3334 18.1088z"></path>
                                    </svg>
                                </button>

                                {/* Navegación de imágenes - Solo en desktop */}
                                {hasMultipleImages && (
                                    <>
                                        <button
                                            onClick={(e) => handleImageNavigation(e, 'prev')}
                                            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                            style={{
                                                padding: '6px',
                                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                            }}
                                        >
                                            <ChevronRight className="w-4 h-4 text-gray-700 rotate-180" />
                                        </button>
                                        <button
                                            onClick={(e) => handleImageNavigation(e, 'next')}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                            style={{
                                                padding: '6px',
                                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                            }}
                                        >
                                            <ChevronRight className="w-4 h-4 text-gray-700" />
                                        </button>
                                        
                                        {/* Indicadores de imágenes */}
                                        <div
                                            className="absolute left-1/2 -translate-x-1/2 flex"
                                            style={{ 
                                                gap: '6px',
                                                bottom: '12px',
                                            }}
                                        >
                                            {imageUrls.map((_, idx) => (
                                                <div
                                                    key={idx}
                                                    className="rounded-full transition-all bg-white"
                                                    style={{
                                                        height: '4px',
                                                        width: idx === imageIndex ? '24px' : '4px',
                                                        opacity: idx === imageIndex ? 1 : 0.6,
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </>
                                )}

                                {/* Avatar del experto - Esquina inferior izquierda */}
                                {service.expert && (
                                    <div
                                        className="absolute left-3 z-10"
                                    style={{
                                        width: '52px',
                                        height: '52px',
                                        bottom: '12px',
                                            borderRadius: '50%',
                                            border: '2px solid white',
                                            overflow: 'hidden',
                                            backgroundColor: '#f0f0f0',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                                        }}
                                    >
                                        {service.expert.profilePictureUrl ? (
                                            <img
                                                src={service.expert.profilePictureUrl}
                                                alt={service.expert.user?.name || 'Experto'}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div 
                                                className="w-full h-full flex items-center justify-center"
                                                style={{
                                                    backgroundColor: '#3b82f6',
                                                    color: 'white',
                                                    fontSize: '14px',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {service.expert.user?.name?.charAt(0)?.toUpperCase() || 'E'}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                <span className="text-gray-400 text-sm">Sin imagen</span>
                            </div>
                        )}
                    </div>

                    {/* Información del servicio - Estructura exacta como Airbnb */}
                    <div style={{ marginTop: '12px' }}>
                        {/* Primera fila: Título con Rating en la misma línea */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: '4px',
                                gap: '8px',
                                width: '100%',
                            }}
                        >
                            <div
                                style={{
                                    flex: '1 1 auto',
                                    minWidth: 0,
                                    overflow: 'hidden',
                                    fontSize: '16px',
                                    lineHeight: 'normal',
                                    fontWeight: 500,
                                    color: 'rgb(0, 0, 0)',
                                    fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                    textAlign: 'left',
                                }}
                            >
                                <div className="truncate" style={{ textAlign: 'left' }}>{service.serviceTypeName || service.categoryName || 'Servicio'}</div>
                            </div>
                            {service.averageRating && service.averageRating > 0 && (
                                <div style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '4px', 
                                    flexShrink: 0,
                                    whiteSpace: 'nowrap',
                                }}>
                                    <Star 
                                        className="flex-shrink-0" 
                                        style={{ 
                                            width: '14px', 
                                            height: '14px', 
                                            fill: '#222222', 
                                            color: '#222222',
                                        }} 
                                    />
                                    <span style={{ 
                                        fontSize: '15px',
                                        lineHeight: '19px',
                                        fontWeight: 400,
                                        color: 'rgb(106, 106, 106)',
                                        fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                    }}>
                                        {service.averageRating.toFixed(2).replace('.', ',')}
                                    </span>
                                    {(() => {
                                        // Buscar totalReviews en múltiples ubicaciones posibles
                                        const totalReviews = service.totalReviews 
                                            ?? (service as any).TotalReviews 
                                            ?? service.expert?.totalReviews 
                                            ?? (service.expert as any)?.TotalReviews
                                            ?? 0;
                                        // Debug temporal
                                        if (process.env.NODE_ENV === 'development') {
                                            console.log('🔍 [MapServiceCard Desktop] totalReviews:', {
                                                serviceId: service.id || service.Id,
                                                totalReviews,
                                                serviceTotalReviews: service.totalReviews,
                                                serviceTotalReviewsPascal: (service as any).TotalReviews,
                                                expertTotalReviews: service.expert?.totalReviews,
                                                expertTotalReviewsPascal: (service.expert as any)?.TotalReviews,
                                                serviceKeys: Object.keys(service)
                                            });
                                        }
                                        return totalReviews > 0 ? (
                                            <span style={{ 
                                                fontSize: '15px',
                                                lineHeight: '19px',
                                                fontWeight: 400,
                                                color: 'rgb(106, 106, 106)',
                                                fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                            }}>
                                                ({totalReviews})
                                            </span>
                                        ) : null;
                                    })()}
                                </div>
                            )}
                        </div>

                        {/* Segunda fila: Descripción del servicio (justo después del título) */}
                        {(() => {
                            const serviceDescription = service.serviceTypeDescription || (service as any).ServiceTypeDescription || service.conditions || (service as any).Conditions;
                            return serviceDescription ? (
                                <>
                                    <div
                                        className="overflow-hidden"
                                        style={{
                                            marginBottom: '4px',
                                            fontSize: '15px',
                                            lineHeight: '19px',
                                            fontWeight: 400,
                                            color: 'rgb(106, 106, 106)',
                                            fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                            textAlign: 'left',
                                        }}
                                    >
                                        <div style={{ 
                                            textAlign: 'left',
                                            whiteSpace: 'pre-line',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden',
                                            lineHeight: '19px',
                                            gap: '4px',
                                        }}>{serviceDescription}</div>
                                    </div>
                                </>
                            ) : null;
                        })()}

                        {/* Tercera fila: Ciudad · Horario */}
                        <div
                            className="flex items-center overflow-hidden"
                            style={{
                                marginBottom: '4px',
                                fontSize: '15px',
                                lineHeight: '19px',
                                fontWeight: 400,
                                color: 'rgb(106, 106, 106)',
                                fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                textAlign: 'left',
                            }}
                        >
                            <div className="flex items-center flex-wrap" style={{ textAlign: 'left' }}>
                                {service.expert?.city && (
                                    <>
                                        <span className="truncate">{service.expert.city}</span>
                                        <span style={{ marginLeft: '4px', marginRight: '4px' }} aria-hidden="true">·</span>
                                    </>
                                )}
                                <span className="truncate">{availabilityInfo}</span>
                            </div>
                        </div>

                        {/* Quinta fila: Precio con "por servicio" seguido */}
                        <div
                            className="flex items-center"
                            style={{
                                marginTop: '4px',
                                gap: '4px',
                            }}
                        >
                            <span
                                style={{
                                    fontSize: '16px',
                                    lineHeight: 'normal',
                                    fontWeight: 500,
                                    color: 'rgb(0, 0, 0)',
                                    fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                    textDecoration: 'underline',
                                }}
                            >
                                {price}
                                {priceData.wasConverted && (
                                    <span style={{ marginLeft: 4, fontSize: '0.85em', color: '#6B7280', fontWeight: 400 }}>
                                        {priceData.sourceFormatted}
                                    </span>
                                )}
                            </span>
                            <span
                                style={{
                                    fontSize: '15px',
                                    lineHeight: '19px',
                                    fontWeight: 400,
                                    color: 'rgb(106, 106, 106)',
                                    fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                }}
                            >
                                por servicio
                            </span>
                        </div>
                    </div>
                </div>
            </a>
        );
    }
    
    // En móvil, usar exactamente el mismo estilo que HomepageWall (igual a Airbnb) pero cuadradas y un poco menos anchas
    return (
        <a
            href={`/service/${serviceId}`}
            onClick={handleCardClick}
            className="block cursor-pointer group"
            style={{ textDecoration: 'none', color: 'inherit', width: '100%', maxWidth: '92%', margin: '0 auto', display: 'block' }}
        >
            {/* Contenedor principal - Estructura exacta de Airbnb */}
            <div className="relative cursor-pointer group" style={{ width: '100%' }}>
                {/* Contenedor de imagen con todos los subdivs - Cuadrada y un poco menos ancha */}
                <div className="relative w-full overflow-hidden mb-2" style={{ aspectRatio: '1', borderRadius: '12px', width: '100%' }}>
                    {imageUrls.length > 0 ? (
                        <>
                            {/* Imagen principal */}
                            <div className="relative w-full h-full">
                                <img
                                    src={imageUrls[imageIndex]}
                                    alt={service.serviceTypeName || service.categoryName || 'Servicio'}
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    style={{ display: 'block' }}
                                />
                            </div>
                            
                            {/* Badge "Recomendamos" - Estructura similar a Airbnb */}
                            {isGuestFavorite && (
                                <div
                                    className="absolute top-3 left-3 z-10"
                                    style={{
                                        padding: '0',
                                    }}
                                >
                                    <div
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
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
                                            aria-label="Recomendamos"
                                        >
                                            Recomendamos
                                        </span>
                                    </div>
                                </div>
                            )}
                            
                            {/* Badge "Recomendación del viajero" cuando está seleccionado */}
                            {isSelected && (
                                <div
                                    className="absolute top-3 left-3 z-10"
                                    style={{
                                        padding: '0',
                                    }}
                                >
                                    <div
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
                                        <CheckCircle className="w-3.5 h-3.5 text-gray-900 flex-shrink-0" strokeWidth={2.5} />
                                        <span
                                            style={{
                                                fontSize: '12px',
                                                lineHeight: '16px',
                                                fontWeight: 400,
                                                color: '#000000',
                                                fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                            }}
                                        >
                                            Selección del usuario
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Botón de favorito - Solo el corazón sin círculo */}
                            <button
                                onClick={handleFavoriteClick}
                                className="absolute top-3 right-3 z-10"
                                style={{
                                    padding: '0',
                                    margin: '0',
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '28px',
                                    height: '28px',
                                }}
                            >
                                <svg
                                    viewBox="0 0 32 32"
                                    xmlns="http://www.w3.org/2000/svg"
                                    aria-hidden="true"
                                    role="presentation"
                                    focusable="false"
                                    style={{
                                        display: 'block',
                                        fill: isFavorite ? '#FF385C' : 'rgba(0, 0, 0, 0.5)',
                                        height: '28px',
                                        width: '28px',
                                        stroke: isFavorite ? '#FF385C' : 'rgba(255, 255, 255, 0.8)',
                                        strokeWidth: '2',
                                        overflow: 'visible',
                                        margin: '0',
                                        padding: '0',
                                    }}
                                >
                                    <path d="m15.9998 28.6668c7.1667-4.8847 14.3334-10.8844 14.3334-18.1088 0-1.84951-.6993-3.69794-2.0988-5.10877-1.3996-1.4098-3.2332-2.11573-5.0679-2.11573-1.8336 0-3.6683.70593-5.0668 2.11573l-2.0999 2.11677-2.0999-2.11677c-1.3985-1.4098-3.2332-2.11573-5.0668-2.11573-1.8347 0-3.6683.70593-5.0679 2.11573-1.3996 1.41083-2.0988 3.25926-2.0988 5.10877 0 7.2244 7.1667 13.2241 14.3334 18.1088z"></path>
                                </svg>
                            </button>

                            {/* Indicadores de imágenes */}
                            {hasMultipleImages && (
                                <div
                                    className="absolute left-1/2 -translate-x-1/2 flex"
                                    style={{ 
                                        gap: '6px',
                                        bottom: '8px',
                                    }}
                                >
                                    {imageUrls.map((_, idx) => (
                                        <div
                                            key={idx}
                                            className="rounded-full transition-all bg-white"
                                            style={{
                                                height: '3px',
                                                width: idx === imageIndex ? '20px' : '3px',
                                                opacity: idx === imageIndex ? 1 : 0.6,
                                            }}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Avatar del experto - Esquina inferior izquierda */}
                            {service.expert && (
                                <div
                                    className="absolute left-3 z-10"
                                    style={{
                                        width: '48px',
                                        height: '48px',
                                        bottom: '8px',
                                        borderRadius: '50%',
                                        border: '2px solid white',
                                        overflow: 'hidden',
                                        backgroundColor: '#f0f0f0',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                                    }}
                                >
                                    {service.expert.profilePictureUrl ? (
                                        <img
                                            src={service.expert.profilePictureUrl}
                                            alt={service.expert.user?.name || 'Experto'}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div 
                                            className="w-full h-full flex items-center justify-center"
                                            style={{
                                                backgroundColor: '#3b82f6',
                                                color: 'white',
                                                fontSize: '14px',
                                                fontWeight: 600,
                                            }}
                                        >
                                            {service.expert.user?.name?.charAt(0)?.toUpperCase() || 'E'}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-400 text-sm">Sin imagen</span>
                        </div>
                    )}
                </div>

                {/* Información del servicio - Estructura exacta como Airbnb */}
                <div style={{ marginTop: '12px', width: '100%' }}>
                    {/* Primera fila: Título con Rating en la misma línea */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '4px',
                            gap: '8px',
                            width: '100%',
                            boxSizing: 'border-box',
                        }}
                    >
                        <div
                            style={{
                                flex: '1 1 0%',
                                minWidth: 0,
                                overflow: 'hidden',
                                fontSize: '16px',
                                lineHeight: 'normal',
                                fontWeight: 500,
                                color: 'rgb(0, 0, 0)',
                                fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                textAlign: 'left',
                            }}
                        >
                            <div className="truncate" style={{ textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{service.serviceTypeName || service.categoryName || 'Servicio'}</div>
                        </div>
                        {service.averageRating && service.averageRating > 0 && (
                            <div style={{ 
                                display: 'flex', 
                                flexDirection: 'row',
                                alignItems: 'center', 
                                gap: '4px', 
                                flexShrink: 0,
                                flexGrow: 0,
                                whiteSpace: 'nowrap',
                            }}>
                                <Star 
                                    className="flex-shrink-0" 
                                    style={{ 
                                        width: '14px', 
                                        height: '14px', 
                                        fill: '#222222', 
                                        color: '#222222',
                                        flexShrink: 0,
                                    }} 
                                />
                                <span style={{ 
                                    fontSize: '15px',
                                    lineHeight: '19px',
                                    fontWeight: 400,
                                    color: 'rgb(106, 106, 106)',
                                    fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                    whiteSpace: 'nowrap',
                                }}>
                                    {service.averageRating.toFixed(2).replace('.', ',')}
                                </span>
                                {(() => {
                                    // Buscar totalReviews en múltiples ubicaciones posibles
                                    const totalReviews = service.totalReviews 
                                        ?? (service as any).TotalReviews 
                                        ?? service.expert?.totalReviews 
                                        ?? (service.expert as any)?.TotalReviews
                                        ?? 0;
                                    // Debug temporal
                                    if (process.env.NODE_ENV === 'development') {
                                        console.log('🔍 [MapServiceCard Mobile] totalReviews:', {
                                            serviceId: service.id || service.Id,
                                            totalReviews,
                                            serviceTotalReviews: service.totalReviews,
                                            serviceTotalReviewsPascal: (service as any).TotalReviews,
                                            expertTotalReviews: service.expert?.totalReviews,
                                            expertTotalReviewsPascal: (service.expert as any)?.TotalReviews,
                                            serviceKeys: Object.keys(service)
                                        });
                                    }
                                    return totalReviews > 0 ? (
                                        <span style={{ 
                                            fontSize: '15px',
                                            lineHeight: '19px',
                                            fontWeight: 400,
                                            color: 'rgb(106, 106, 106)',
                                            fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                            whiteSpace: 'nowrap',
                                        }}>
                                            ({totalReviews})
                                        </span>
                                    ) : null;
                                })()}
                            </div>
                        )}
                    </div>

                    {/* Segunda fila: Descripción del servicio (justo después del título) */}
                    {(() => {
                        const serviceDescription = service.serviceTypeDescription || (service as any).ServiceTypeDescription || service.conditions || (service as any).Conditions;
                        return serviceDescription ? (
                            <>
                                <div
                                    className="overflow-hidden"
                                    style={{
                                        marginBottom: '4px',
                                        fontSize: '15px',
                                        lineHeight: '19px',
                                        fontWeight: 400,
                                        color: 'rgb(106, 106, 106)',
                                        fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                        textAlign: 'left',
                                    }}
                                >
                                    <div style={{ 
                                        textAlign: 'left',
                                        whiteSpace: 'pre-line',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                        lineHeight: '23px',
                                    }}>{serviceDescription}</div>
                                </div>
                            </>
                        ) : null;
                    })()}

                    {/* Tercera fila: Ciudad · Horario */}
                    <div
                        className="flex items-center overflow-hidden"
                        style={{
                            marginBottom: '4px',
                            fontSize: '15px',
                            lineHeight: '19px',
                            fontWeight: 400,
                            color: 'rgb(106, 106, 106)',
                            fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                            textAlign: 'left',
                        }}
                    >
                        <div className="flex items-center flex-wrap" style={{ textAlign: 'left' }}>
                            {service.expert?.city && (
                                <>
                                    <span className="truncate">{service.expert.city}</span>
                                    <span style={{ marginLeft: '4px', marginRight: '4px' }} aria-hidden="true">·</span>
                                </>
                            )}
                            <span className="truncate">{availabilityInfo}</span>
                        </div>
                    </div>

                    {/* Quinta fila: Precio con "por servicio" seguido */}
                    <div
                        className="flex items-center"
                        style={{
                            marginTop: '4px',
                            gap: '4px',
                        }}
                    >
                        <span
                            style={{
                                fontSize: '16px',
                                lineHeight: 'normal',
                                fontWeight: 500,
                                color: 'rgb(0, 0, 0)',
                                fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                textDecoration: 'underline',
                            }}
                        >
                            {price}
                            {priceData.wasConverted && (
                                <span style={{ marginLeft: 4, fontSize: '0.85em', color: '#6B7280', fontWeight: 400 }}>
                                    {priceData.sourceFormatted}
                                </span>
                            )}
                        </span>
                        <span
                            style={{
                                fontSize: '15px',
                                lineHeight: '19px',
                                fontWeight: 400,
                                color: 'rgb(106, 106, 106)',
                                fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                            }}
                        >
                            por servicio
                        </span>
                    </div>
                </div>
            </div>
        </a>
    );
};
const getZoomLevel = (radius: number) => {
    const radiusInMeters = radius * 1000;
    return Math.min(14, Math.max(4, Math.floor(14 - Math.log2(radiusInMeters / 500))));
};
const defaultCenter = {
    lat: 40.4168,
    lng: -3.7038
};
interface SearchParameterFormProps {
    onComplete: (parameters: any) => void;
    setCurrentStep: (step: number) => void;
    selectedCategory: number | null;
    initialKeywords: string;
    initialUserSearch: string;
    serviceTypeId: number | null;
}
export function SearchParameterForm({ onComplete, setCurrentStep, selectedCategory, initialKeywords, initialUserSearch, serviceTypeId }: SearchParameterFormProps) {
    const { width } = useWindowSize();
    const navigate = useNavigate();
    const isMobileDevice = width > 0 ? width < 1024 : (typeof window !== 'undefined' && window.innerWidth < 1024);
    
    // Calcular tamaños basados en el ancho real de la pantalla
    // iPhone SE: 375px, iPhone XR: 414px, iPhone 12 Pro Max: 428px
    const isLargeMobile = width >= 414; // iPhone XR y superiores
    const isMediumMobile = width >= 375 && width < 414; // iPhone SE y similares
    const isSmallMobile = width < 375; // Pantallas muy pequeñas
    
    // Tamaños dinámicos basados en el ancho real
    const searchBarHeight = isLargeMobile ? 64 : isMediumMobile ? 56 : 48; // h-16, h-14, h-12
    const searchBarPadding = isLargeMobile ? 24 : isMediumMobile ? 20 : 16; // px-6, px-5, px-4
    const searchBarTextSize = isLargeMobile ? 18 : isMediumMobile ? 16 : 14; // text-lg, text-base, text-sm
    const iconSize = isLargeMobile ? 24 : isMediumMobile ? 20 : 16; // w-6, w-5, w-4
    const countrySelectorMinWidth = isLargeMobile ? 160 : isMediumMobile ? 130 : 100;
    
    // useLoadScript ya no es necesario - MapContainer lo maneja internamente
    const [error, setError] = useState<string | null>(null);
    // map ya no es necesario - MapContainer lo maneja internamente
    // País por defecto: España
    const [selectedCountry, setSelectedCountry] = useState<string>('es');
    const [isGeocoding, setIsGeocoding] = useState<boolean>(false);
    const [searchAddress, setSearchAddress] = useState<string>('');
    const searchInputRef = useRef<HTMLInputElement>(null);

    const initialFormState = {
        keywords: initialKeywords,
        userSearch: initialUserSearch,
        latitude: '',
        longitude: '',
        locationRange: '25', // Fijo a 25km
        frequency: '1', // Default to 1 hour
        address: '',
        locationName: '', // ✅ NUEVO: Nombre de la ubicación
    };
    const [formData, setFormData] = useState(initialFormState);
    const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
   
    // Inicializar coordenadas con el país por defecto al cargar
    useEffect(() => {
        if (selectedCountry && !formData.latitude && !formData.longitude) {
            const countryCoords = getCountryCoordinates(selectedCountry);
            if (countryCoords) {
                setFormData(prev => ({
                    ...prev,
                    latitude: countryCoords.lat.toString(),
                    longitude: countryCoords.lng.toString(),
                    locationName: getCountryName(selectedCountry) || '',
                }));
                setSelectedLocation({ lat: countryCoords.lat, lng: countryCoords.lng });
            }
        }
    }, [selectedCountry]);

    // El mapa se inicializa automáticamente con MapContainer
   
    // Sincronizar selectedLocation con formData cuando hay coordenadas
    useEffect(() => {
        if (formData.latitude && formData.longitude) {
            const lat = parseFloat(formData.latitude);
            const lng = parseFloat(formData.longitude);
            if (!isNaN(lat) && !isNaN(lng)) {
                const location = { lat, lng };
                // Solo actualizar si es diferente para evitar loops
                if (!selectedLocation || 
                    Math.abs(selectedLocation.lat - lat) > 0.0001 || 
                    Math.abs(selectedLocation.lng - lng) > 0.0001) {
                    setSelectedLocation(location);
                }
            }
        }
    }, [formData.latitude, formData.longitude]);
   
    // Estados para servicios
    const [selectedService, setSelectedService] = useState<number | null>(null);
    // Estado para el número real de servicios del mapa
    const [mapServicesCount, setMapServicesCount] = useState<number>(0);
    // Estado para servicios del mapa (para verificar favoritos)
    const [mapServices, setMapServices] = useState<Service[]>([]);
    // Estado para prevenir clics accidentales en la card móvil justo después de abrirse
    const [cardJustOpened, setCardJustOpened] = useState(false);
    const cardOpenTimeRef = useRef<number>(0);
    
    // Resetear el flag cuando cambia el servicio seleccionado
    useEffect(() => {
        if (selectedService) {
            setCardJustOpened(true);
            cardOpenTimeRef.current = Date.now();
            // Permitir clics después de 500ms (aumentado para móvil)
            const timer = setTimeout(() => {
                setCardJustOpened(false);
            }, 500);
            return () => clearTimeout(timer);
        } else {
            setCardJustOpened(false);
            cardOpenTimeRef.current = 0;
        }
    }, [selectedService]);
    
    // ✅ Estado para controlar el modal (Drawer en móvil, Dialog en PC)
    // Detectar si es móvil al inicio
    const initialIsMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
    // ✅ OPTIMIZADO: Detectar si viene de búsqueda (tiene categoryId y serviceTypeId)
    const comesFromSearch = selectedCategory !== null && serviceTypeId !== null;
    // ✅ Drawer cerrado por defecto - NO se abre automáticamente
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isDrawerVisible, setIsDrawerVisible] = useState(false);
    // ✅ Rastrear si el usuario cerró el drawer manualmente para evitar reabrir automáticamente
    const [wasManuallyClosed, setWasManuallyClosed] = useState(false);
    
    const drawerContentRef = useRef<HTMLDivElement>(null);
    const drawerRef = useRef<HTMLDivElement>(null); // ✅ Ref para detectar clicks fuera del drawer
    const headerRef = useRef<HTMLDivElement>(null);
    const [headerHeight, setHeaderHeight] = useState(81); // Altura por defecto del header
    // ✅ INFINITE SCROLL: Refs para los sentinels
    const sentinelRefMobile = useRef<HTMLDivElement>(null);
    const sentinelRefDesktop = useRef<HTMLDivElement>(null);
    // ✅ Ref para el elemento del servicio seleccionado en móvil (para scroll automático)
    const selectedServiceRef = useRef<HTMLDivElement | null>(null);
    // ✅ Ref para evitar múltiples aperturas del drawer
    const drawerOpenedRef = useRef(false);
    
    // Calcular altura del header dinámicamente
    useEffect(() => {
        const updateHeaderHeight = () => {
            if (headerRef.current) {
                const height = headerRef.current.offsetHeight;
                setHeaderHeight(height);
            }
        };
        
        updateHeaderHeight();
        window.addEventListener('resize', updateHeaderHeight);
        return () => window.removeEventListener('resize', updateHeaderHeight);
    }, []);
    
    // ✅ SnapPoints estilo Airbnb: 0 = cerrado, 0.7 = reposo (70%), 0.85 = casi arriba (deja espacio para el header)
    // Vaul manejará los gestos y animaciones de forma nativa y fluida
    const SNAP_POINTS = useMemo(() => {
        return [0, 0.7, 0.85] as const;
    }, []);
    
    // ✅ Posición inicial: 0 (cerrado) - El drawer no se abre automáticamente
    const [activeSnapPoint, setActiveSnapPoint] = useState<string | number | null>(0);
    
    // ✅ Eliminada lógica de scroll personalizada - Vaul maneja todo nativamente con gestos suaves
    
    const [filters, setFilters] = useState({
        priceRange: [0, 100000] as [number, number], // [min, max] en euros - rango amplio para servicios premium
        rating: 0 as number, // Mínimo de estrellas (0-5)
    });
   
    // MapContainer maneja bounds internamente - ya no necesitamos estos estados
   
    // ✅ OPTIMIZADO: Debounce de parámetros para evitar llamadas excesivas al cambiar filtros
    const [debouncedParams, setDebouncedParams] = useState({
        categoryId: selectedCategory || undefined,
        serviceTypeId: serviceTypeId || undefined,
        latitude: formData.latitude || undefined,
        longitude: formData.longitude || undefined,
        locationRange: formData.locationRange ? parseInt(formData.locationRange) : undefined,
    });

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedParams({
                categoryId: selectedCategory || undefined,
                serviceTypeId: serviceTypeId || undefined,
                latitude: formData.latitude || undefined,
                longitude: formData.longitude || undefined,
                locationRange: formData.locationRange ? parseInt(formData.locationRange) : undefined,
            });
        }, 300); // Debounce de 300ms para cambios de filtros

        return () => clearTimeout(timer);
    }, [selectedCategory, serviceTypeId, formData.latitude, formData.longitude, formData.locationRange]);
   
    // ✅ OPTIMIZADO: Lazy loading - Solo cargar servicios cuando el drawer esté abierto
    // Esto evita llamadas innecesarias cuando el usuario solo está viendo el mapa
    const {
        services: allServices,
        isLoading: isLoadingServices,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
    } = useInfiniteServices({
        categoryId: debouncedParams.categoryId,
        serviceTypeId: debouncedParams.serviceTypeId,
        latitude: debouncedParams.latitude,
        longitude: debouncedParams.longitude,
        locationRange: debouncedParams.locationRange,
        pageSize: 20, // ✅ Cargar 20 servicios por página
        enabled: (isDrawerOpen || isDrawerVisible) && !!(debouncedParams.categoryId && debouncedParams.serviceTypeId && debouncedParams.latitude && debouncedParams.longitude && debouncedParams.locationRange), // ✅ Solo cargar cuando el drawer esté abierto Y haya parámetros válidos
    });
   
    // MapContainer maneja la carga de servicios internamente - ya no necesitamos useMapExperts ni handleBoundsChange
   
    // ✅ LÓGICA CORREGIDA: PRIORIZAR servicios del mapa cuando están disponibles
    // Si hay servicios del mapa (viewport), usar SOLO esos (son los visibles)
    // Si NO hay servicios del mapa, usar servicios de ubicación (useInfiniteServices)
    // Esto evita que aparezcan más servicios en el drawer de los que se ven en el mapa
    const allServicesCombined = useMemo(() => {
        // ✅ PRIORIDAD 1: Si hay servicios del mapa, usar SOLO esos (son los visibles en el viewport)
        // Esto asegura que el drawer muestre exactamente los mismos servicios que el mapa
        if (mapServices.length > 0) {
            // Convertir servicios del mapa al formato esperado
            const convertedServices = mapServices
                .map(mapService => {
                    const rawService = mapService.raw || {};
                    const rawExpert = rawService.expert || rawService.Expert || {};
                    const rawUser = rawExpert.user || rawExpert.User || {};
                    
                    return {
                        id: mapService.id,
                        expertProfileId: rawExpert.id || rawExpert.Id,
                        categoryId: rawService.categoryId || rawService.CategoryId || selectedCategory,
                        serviceTypeId: rawService.serviceTypeId || rawService.ServiceTypeId || serviceTypeId,
                        serviceTypeName: mapService.type || rawService.serviceTypeName || rawService.ServiceTypeName,
                        serviceTypeDescription: rawService.serviceTypeDescription || rawService.ServiceTypeDescription,
                        price: mapService.price,
                        conditions: rawService.conditions || rawService.Conditions || '',
                        durationInHours: rawService.durationInHours || rawService.DurationInHours || null,
                        createdAt: rawService.createdAt || rawService.CreatedAt || new Date().toISOString(),
                        imageUrls: rawService.imageUrls || rawService.ImageUrls || [],
                        categoryName: rawService.categoryName || rawService.CategoryName,
                        completedSearches: rawService.completedSearches || rawService.CompletedSearches || 0,
                        totalReviews: rawService.totalReviews || rawService.TotalReviews || 0,
                        averageRating: rawService.averageRating || rawService.AverageRating || 0,
                        isActive: rawService.isActive !== undefined ? rawService.isActive : true,
                        expert: {
                            id: rawExpert.id || rawExpert.Id,
                            profilePictureUrl: rawExpert.profilePictureUrl || rawExpert.ProfilePictureUrl || '',
                            description: rawExpert.description || rawExpert.Description || '',
                            createdAt: rawExpert.createdAt || rawExpert.CreatedAt || new Date().toISOString(),
                            user: {
                                name: mapService.name || rawUser.name || rawUser.Name || 'Experto',
                                email: rawUser.email || rawUser.Email || '',
                            },
                            latitude: rawExpert.latitude || rawExpert.Latitude || mapService.lat?.toString(),
                            longitude: rawExpert.longitude || rawExpert.Longitude || mapService.lng?.toString(),
                        },
                    } as typeof allServices[0];
                })
                .filter(service => {
                    // Filtrar por categoría si está seleccionada
                    if (selectedCategory > 0) {
                        const serviceCategoryId = service.categoryId || (service as any).CategoryId;
                        return serviceCategoryId === selectedCategory;
                    }
                    return true;
                });
            
            return convertedServices;
        }
        
        // ✅ PRIORIDAD 2: Si NO hay servicios del mapa, usar servicios de ubicación (allServices)
        // Esto es para cuando el usuario busca por ubicación específica, no por viewport del mapa
        let services: typeof allServices = allServices;
        
        // Filtrar por categoría si está seleccionada
        if (selectedCategory > 0) {
            services = services.filter(s => {
                const serviceCategoryId = s.categoryId || (s as any).CategoryId;
                return serviceCategoryId === selectedCategory;
            });
        }
        
        return services;
    }, [allServices, selectedCategory, mapServices, serviceTypeId]);
    
    // ✅ Reordenar servicios: el seleccionado aparece primero (como en Airbnb)
    const reorderedServices = useMemo(() => {
        if (!selectedService) {
            return allServicesCombined;
        }
        
        // Buscar el servicio seleccionado manejando tanto camelCase como PascalCase
        const selected = allServicesCombined.find(s => {
            const serviceId = s.id || (s as any).Id;
            return serviceId === selectedService;
        });
        
        // Los demás servicios
        const others = allServicesCombined.filter(s => {
            const serviceId = s.id || (s as any).Id;
            return serviceId !== selectedService;
        });
        
        if (selected) {
            // El servicio seleccionado va primero en el drawer
            return [selected, ...others];
        } else {
            return allServicesCombined;
        }
    }, [allServicesCombined, selectedService]);
   
    // Aplicar filtros a servicios (después de reordenar)
    const services = reorderedServices.filter(service => {
        const price = service.price || 0;
        const priceInRange = price >= filters.priceRange[0] && price <= filters.priceRange[1];
        if (!priceInRange) return false;
        
        const rating = service.averageRating || 0;
        const ratingPassed = rating >= filters.rating;
        if (!ratingPassed) return false;
        
        return true;
    });
    
    // ✅ OPTIMIZADO: Verificar favoritos de servicios del mapa y del drawer de una vez
    const { isAuthenticated } = useAuth();
    const { checkMultipleFavorites } = useServiceFavorites();
    
    // Combinar IDs de servicios del mapa y del drawer
    const allServiceIds = useMemo(() => {
        const drawerIds = services.map(s => s.id || (s as any).Id).filter(Boolean);
        const mapIds = mapServices.map(s => s.id).filter(Boolean);
        // Combinar y deduplicar
        const combined = [...new Set([...drawerIds, ...mapIds])];
        return combined;
    }, [services, mapServices]);
    
    // Una sola llamada para todos los servicios (mapa + drawer)
    const { data: favoritesData } = checkMultipleFavorites(allServiceIds);
    const favoritesMap = favoritesData?.data || {};
    
    // ✅ INFINITE SCROLL: IntersectionObserver para cargar más servicios
    useEffect(() => {
        const sentinels = [sentinelRefMobile.current, sentinelRefDesktop.current].filter(Boolean) as HTMLDivElement[];
        if (sentinels.length === 0 || !hasNextPage || isFetchingNextPage) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some(e => e.isIntersecting) && hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                }
            },
            { threshold: 0.1, rootMargin: '100px' } // ✅ Cargar 100px antes de llegar al final
        );

        sentinels.forEach(sentinel => observer.observe(sentinel));
        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);
    
    // ✅ Drawer cerrado por defecto - NO se abre automáticamente
    // El usuario debe abrirlo manualmente o usando el botón "Ver resultados"
    
    // ✅ Detectar clicks fuera del drawer para cerrarlo
    useEffect(() => {
        if (!isDrawerOpen || !isDrawerVisible || !isMobileDevice) return;
        
        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
            const target = event.target as HTMLElement;
            
            // ✅ Verificar que el click no sea en el drawer ni en sus elementos hijos
            const drawerElement = document.querySelector('[data-vaul-drawer]') as HTMLElement;
            if (!drawerElement) return;
            
            if (!drawerElement.contains(target)) {
                // ✅ Verificar que no sea un click en el mapa o header (para no interferir)
                const isMapClick = target.closest('[role="button"]') || 
                                   target.closest('.gm-style') || 
                                   target.closest('[class*="map"]') ||
                                   target.closest('#mobile-search-header');
                
                // ✅ Solo cerrar si no es un click en el mapa o header
                if (!isMapClick) {
                    setIsDrawerOpen(false);
                    setIsDrawerVisible(false);
                    setWasManuallyClosed(true);
                    setSelectedService(null); // ✅ Deseleccionar servicio al cerrar
                }
            }
        };
        
        // ✅ Añadir listener con un pequeño delay para evitar que se cierre inmediatamente al abrir
        const timeoutId = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        }, 100);
        
        return () => {
            clearTimeout(timeoutId);
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [isDrawerOpen, isDrawerVisible, isMobileDevice]);
    
    // Detectar cuando el usuario interactúa con el drawer (arrastra o abre manualmente)
    const handleDrawerOpenChange = (open: boolean) => {
        // ✅ Permitir abrir tanto en móvil como en PC
        // El ResponsiveModal se encargará de mostrar Drawer o Dialog según el tamaño
        setIsDrawerOpen(open);
        // ✅ Si se cierra el drawer, deseleccionar el servicio
        if (!open) {
            setSelectedService(null);
        }
    };
    // Logs para debugging
    useEffect(() => {
        console.log('📍 [DEBUG] Estado de ubicación:', {
            selectedLocation,
            formDataLatitude: formData.latitude,
            formDataLongitude: formData.longitude,
            hasSelectedLocation: !!selectedLocation,
            hasCoordinates: !!(formData.latitude && formData.longitude)
        });
    }, [selectedLocation, formData.latitude, formData.longitude]);
    useEffect(() => {
        // Log comentado para evitar spam
        // const service154 = allServices.find(s => s.id === 154);
        // console.log('🔍 [DEBUG] Servicios cargados:', {
        //     totalServices: allServices.length,
        //     filteredServices: services.length,
        //     isLoading: isLoadingServices,
        //     service154InAll: !!service154,
        //     service154InFiltered: !!services.find(s => s.id === 154),
        //     service154Price: service154 ? service154.price : null,
        //     filters: filters,
        //     services: services.map(s => ({
        //         id: s.id,
        //         name: s.expert?.user?.name,
        //         price: s.price,
        //         rating: s.averageRating,
        //         categoryName: s.categoryName,
        //         serviceTypeName: s.serviceTypeName
        //     }))
        // });
    }, [allServices, services, isLoadingServices, filters]);
   
    
    // Función para extraer el código de país desde los resultados de geocodificación o place
    const extractCountryCode = (result: google.maps.GeocoderResult | google.maps.places.PlaceResult): string | null => {
        if (!result.address_components) return null;
        
        for (const component of result.address_components) {
            if (component.types.includes('country') && component.short_name) {
                return component.short_name.toLowerCase();
            }
        }
        return null;
    };
    
    // Función para extraer ciudad y código postal de la dirección
    const extractCityAndPostalCode = (address: string): string => {
        try {
            // Dividir la dirección por comas
            const parts = address.split(',').map(part => part.trim());
            
            let city = '';
            let postalCode = '';
            
            // Buscar la ciudad y código postal
            for (let i = parts.length - 1; i >= 0; i--) {
                const part = parts[i];
                
                // Si contiene código postal, extraer ambos
                if (part.match(/\d{5}/)) {
                    // Ejemplo: "42001 Soria" -> postalCode: "42001", city: "Soria"
                    const postalMatch = part.match(/(\d{5})\s+(.+)/);
                    if (postalMatch) {
                        postalCode = postalMatch[1].trim();
                        city = postalMatch[2].trim();
                        break;
                    }
                }
                
                // Si es una parte que parece ciudad (no contiene palabras de calle)
                if (part.length > 3 && part.length < 30 && 
                    !part.match(/^\d/) && 
                    !part.match(/(Calle|Avenida|Plaza|Paseo|Carrera|Boulevard|Ronda|Camino|Vía|España)/i)) {
                    city = part;
                }
            }
            
            // Si no encontramos ciudad específica, usar la penúltima parte (antes de "España")
            if (!city && parts.length >= 2) {
                const beforeLast = parts[parts.length - 2];
                if (beforeLast && !beforeLast.match(/(España|Spain)/i)) {
                    city = beforeLast;
                }
            }
            
            // Formatear: "Ciudad, Código Postal" o solo "Ciudad" si no hay código postal
            if (city && postalCode) {
                return `${city}, ${postalCode}`;
            } else if (city) {
                return city;
            } else {
                return 'Ubicación'; // Fallback a "Ubicación" si no se encuentra ciudad
            }
        } catch (error) {
            console.error('Error extracting city and postal code:', error);
            return 'Ubicación'; // Fallback a "Ubicación"
        }
    };
    // Función para actualizar la ubicación y sincronizar todos los elementos del mapa
    const updateLocationAndMap = (newLocation: { lat: number; lng: number }, address?: string) => {
        setSelectedLocation(newLocation);
        
        let locationName = '';
        
        if (address) {
            setSearchAddress(address);
            // ✅ NUEVO: Extraer ciudad y código postal automáticamente
            locationName = extractCityAndPostalCode(address);
            console.log('📍 Location extracted:', { address, locationName }); // Debug log
        }
        
        setFormData(prev => ({
            ...prev,
            latitude: newLocation.lat.toString(),
            longitude: newLocation.lng.toString(),
            ...(address && { address }),
            locationName // ✅ NUEVO: Rellenar automáticamente el nombre de ubicación
        }));
        // El mapa se actualiza automáticamente con MapContainer
    };
    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            frequency: '1' // Default to 1 hour
        }));
    }, []);
    useEffect(() => {
        // Verificar si geolocalización está disponible y permitida
        if (navigator.geolocation) {
            try {
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        const currentLocation = {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                        };
                        
                        // Geocodificar la ubicación actual para mostrar la dirección
                        if (window.google?.maps?.Geocoder) {
                            const geocoder = new google.maps.Geocoder();
                            geocoder.geocode({ location: currentLocation }, (results, status) => {
                                if (status === 'OK' && results && results[0]) {
                                    updateLocationAndMap(currentLocation, results[0].formatted_address);
                                } else {
                                    updateLocationAndMap(currentLocation);
                                }
                            });
                        } else {
                            updateLocationAndMap(currentLocation);
                        }
                    },
                    (error) => {
                        // Manejar errores de geolocalización silenciosamente
                        // No mostrar errores en consola si está bloqueado por política
                        if (error.code !== error.PERMISSION_DENIED) {
                            console.warn('Error de geolocalización:', error.message);
                        }
                        setFormData(prev => ({
                            ...prev,
                            latitude: defaultCenter.lat.toString(),
                            longitude: defaultCenter.lng.toString()
                        }));
                        // El mapa se actualiza automáticamente con MapContainer
                    },
                    {
                        timeout: 10000,
                        maximumAge: 300000, // 5 minutos
                        enableHighAccuracy: false
                    }
                );
            } catch (error) {
                // Capturar errores de permisos antes de que se lancen
                // Silenciar errores de política de permisos
                if (error instanceof Error && !error.message.includes('Permissions policy')) {
                    console.warn('Error al acceder a geolocalización:', error);
                }
                setFormData(prev => ({
                    ...prev,
                    latitude: defaultCenter.lat.toString(),
                    longitude: defaultCenter.lng.toString()
                }));
            }
        }
    }, []);
    // Handler para cuando se selecciona un lugar
    const handlePlaceSelected = (place: any) => {
        if (!place || !place.geometry || !place.geometry.location) {
            return;
        }

        setIsGeocoding(true);
        
                    const newLocation = {
                        lat: place.geometry.location.lat(),
                        lng: place.geometry.location.lng()
                    };
                    
                    const address = place.formatted_address || place.name || '';
        
        // Detectar y actualizar el país si es diferente
        const countryCode = extractCountryCode(place);
        if (countryCode && countryCode !== selectedCountry.toLowerCase()) {
            setSelectedCountry(countryCode);
        }
        
        setSearchAddress(address);
                    
                    // Usar la función centralizada para actualizar todo
                    updateLocationAndMap(newLocation, address);
                    
        setIsGeocoding(false);
        
        // El mapa se actualiza automáticamente con MapContainer
    };

    // Agregar estilos para las sugerencias de Google Places
    useEffect(() => {
        const style = document.createElement('style');
        style.id = 'google-places-autocomplete-styles';
        style.textContent = `
            .pac-container {
                z-index: 99999 !important;
                border-radius: 8px !important;
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12) !important;
                border: 1px solid #e5e7eb !important;
                margin-top: 4px !important;
            }
            .pac-item {
                padding: 12px 16px !important;
                cursor: pointer !important;
                border-bottom: 1px solid #f3f4f6 !important;
            }
            .pac-item:hover {
                background-color: #f9fafb !important;
            }
            .pac-item-selected {
                background-color: #f3f4f6 !important;
            }
            .pac-icon {
                display: none !important;
            }
            .pac-item-query {
                font-size: 14px !important;
                color: #111827 !important;
                font-weight: 500 !important;
            }
            .pac-matched {
                font-weight: 600 !important;
            }
        `;
        
        if (!document.getElementById('google-places-autocomplete-styles')) {
            document.head.appendChild(style);
        }
        
        return () => {
            const existingStyle = document.getElementById('google-places-autocomplete-styles');
            if (existingStyle) {
                document.head.removeChild(existingStyle);
            }
        };
    }, []);
    // Efecto para asegurar que el mapa se actualice cuando cambie la ubicación
    useEffect(() => {
        // El mapa se actualiza automáticamente con MapContainer
    }, [selectedLocation, formData.latitude, formData.longitude]);
    const handleMapClick = (e: google.maps.MapMouseEvent) => {
        // ✅ Si el drawer está abierto, cerrarlo y marcar como cerrado manualmente
        if (isDrawerOpen && isDrawerVisible) {
            setIsDrawerOpen(false);
            setIsDrawerVisible(false);
            setWasManuallyClosed(true); // ✅ Marcar que fue cerrado manualmente
            return;
        }
        
        // ✅ Si hay una card abierta, solo cerrarla y deseleccionar, NO mover el mapa
        if (selectedService) {
            setSelectedService(null);
            return; // Salir temprano para no cambiar la ubicación
        }
        
        // Solo cambiar la ubicación si NO hay una card abierta
        if (e.latLng) {
            const newLocation = {
                lat: e.latLng.lat(),
                lng: e.latLng.lng()
            };
            
            setIsGeocoding(true);
            
            // Geocodificar la ubicación seleccionada para obtener la dirección
            if (window.google?.maps?.Geocoder) {
                const geocoder = new google.maps.Geocoder();
                geocoder.geocode({ location: newLocation }, (results, status) => {
                    setIsGeocoding(false);
                    if (status === 'OK' && results && results[0]) {
                        const address = results[0].formatted_address;
                        // Detectar y actualizar el país si es diferente
                        const countryCode = extractCountryCode(results[0]);
                        if (countryCode && countryCode !== selectedCountry.toLowerCase()) {
                            setSelectedCountry(countryCode);
                        }
                        updateLocationAndMap(newLocation, address);
                    } else {
                        updateLocationAndMap(newLocation);
                    }
                });
            } else {
                setIsGeocoding(false);
                updateLocationAndMap(newLocation);
            }
        }
    };
    // Ref para el contenedor del sidebar (lista de servicios)
    const sidebarRef = useRef<HTMLDivElement>(null);
    
    const handleServiceSelect = (serviceId: number | undefined | null) => {
        
        // Si serviceId es 0, null o undefined, cerrar la card (deseleccionar)
        if (serviceId === 0 || serviceId === null || serviceId === undefined) {
            setSelectedService(null);
            return;
        }
        
        // Validar que serviceId sea un número válido
        if (isNaN(serviceId)) {
            console.warn('⚠️ handleServiceSelect recibió un serviceId inválido:', serviceId);
            return;
        }
        
        // ✅ Actualizar el estado para que el marcador cambie de color
        setSelectedService(serviceId);
        
        // ✅ Abrir el drawer en móvil cuando se selecciona un servicio
        if (isMobileDevice) {
            setIsDrawerOpen(true);
            setIsDrawerVisible(true);
            setWasManuallyClosed(false); // ✅ Resetear flag cuando se selecciona un servicio (acción intencional)
        }
        
        // ✅ Hacer scroll al principio del sidebar para mostrar la card seleccionada (solo en desktop)
        if (sidebarRef.current) {
            setTimeout(() => {
                sidebarRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
            }, 100);
        }
    };
    const handleContinue = () => {
        if (!selectedService) {
            setError('Por favor, selecciona un servicio antes de continuar.');
            return;
        }
        if (!formData.latitude || !formData.longitude) {
            setError('Por favor, selecciona una ubicación usando el buscador de direcciones o haciendo clic en el mapa');
            return;
        }
        const selectedServiceData = services.find((s) => s.id === selectedService);
        if (!selectedServiceData) {
            setError('Error: No se encontró el servicio seleccionado.');
            return;
        }
        const searchParameterData = {
            category: selectedCategory,
            keywords: formData.keywords || initialKeywords,
            userSearch: formData.userSearch || initialUserSearch,
            latitude: selectedLocation?.lat.toString() || formData.latitude,
            longitude: selectedLocation?.lng.toString() || formData.longitude,
            locationRange: 25,
            frequency: formData.frequency ? parseInt(formData.frequency) : 1,
            brandId: null,
            modelId: null,
            platformIds: [1, 2],
            serviceTypeId,
            locationName: formData.locationName || searchAddress,
            serviceId: selectedService,
            expertProfilePicture: selectedServiceData.expert?.profilePictureUrl,
            expertName: selectedServiceData.expert?.user?.name,
            servicePrice: selectedServiceData.price,
            serviceDescription: selectedServiceData.conditions,
            serviceImageUrls: selectedServiceData.imageUrls || []
        };
        onComplete(searchParameterData);
    };
    return (
        <div className="bg-white h-[100dvh] flex flex-col overflow-visible fixed inset-0 z-[100]">
                   
            {/* Main Layout - Split View */}
            <div className="flex flex-1 min-h-0 overflow-visible w-full">
                {/* Left Side - Panel de resultados (Desktop) */}
                <div className="hidden lg:flex flex-col bg-white flex-shrink-0" style={{ 
                    width: width >= 1280 ? '900px' : '600px', 
                    minWidth: '600px', 
                    maxWidth: '900px' 
                }}>
                    {/* Header del panel */}
                    <div className="px-8 md:px-10 py-4 border-b border-gray-100">
                        <p className="text-sm text-gray-500">
                            {formData.latitude && formData.longitude 
                                ? `${services.length} expertos disponibles`
                                : 'Selecciona una ubicación en el mapa'
                            }
                        </p>
                        </div>
                    
                    {/* Lista de servicios */}
                    <div 
                        ref={sidebarRef} 
                        className="flex-1 overflow-y-auto"
                        data-sidebar-scroll
                        style={{
                            scrollbarWidth: 'none', /* Firefox */
                            msOverflowStyle: 'none', /* IE and Edge */
                        }}
                    >
                        <style>{`
                            [data-sidebar-scroll]::-webkit-scrollbar {
                                display: none; /* Chrome, Safari, Opera */
                            }
                        `}</style>
                        {formData.latitude && formData.longitude && (
                            <div className="px-8 md:px-10 pt-20 pb-6">
                            {/* Services List - Desktop estilo Airbnb en grid de 2 columnas */}
                            {(() => {
                                console.log('🔍 SearchParameterForm - Renderizando sidebar:', {
                                    reorderedServicesCount: reorderedServices.length,
                                    reorderedServices: reorderedServices
                                });
                                return null;
                            })()}
                            {reorderedServices.length > 0 ? (
                                <>
                                    {/* Header con total de servicios estilo Airbnb */}
                                    <div className="px-8 md:px-10 pb-4">
                                        <p className="text-base font-medium text-gray-900">
                                            {(() => {
                                                // ✅ CORREGIDO: Mostrar número de servicios, no de revisiones
                                                const servicesCount = reorderedServices.length;
                                                return servicesCount > 0 
                                                    ? `${servicesCount} ${servicesCount === 1 ? 'servicio disponible' : 'servicios disponibles'}`
                                                    : 'Sin servicios disponibles';
                                            })()}
                                        </p>
                                    </div>
                                    <div 
                                        className="grid grid-cols-1 xl:grid-cols-2" 
                                        style={{ 
                                            width: '100%',
                                            gap: '24px',
                                            padding: '0',
                                        }}
                                    >
                                    {reorderedServices.map((service) => {
                                        const serviceId = service.id || (service as any).Id;
                                        const isSelected = selectedService === serviceId;
                                        return (
                                            <div key={serviceId} style={{ width: '100%' }}>
                                                <MapServiceCard
                                                    service={service}
                                                    isSelected={isSelected}
                                                    onSelect={handleServiceSelect}
                                                    initialIsFavorite={isAuthenticated ? (favoritesMap[serviceId] || false) : false}
                                                />
                                            </div>
                                        );
                                    })}
                                    </div>
                                </>
                            ) : (
                                    <div className="flex flex-col items-center justify-center h-full min-h-[400px] p-8 text-center">
                                        <div className="flex flex-col items-center gap-4 max-w-sm">
                                            <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center">
                                                <MapPin className="w-10 h-10 text-muted-foreground/50" />
                                            </div>
                                            <div className="space-y-2">
                                                <h3 className="text-lg font-semibold text-foreground">
                                                    No hay servicios disponibles
                                                </h3>
                                                <p className="text-sm text-muted-foreground">
                                                    No encontramos expertos en esta ubicación. Intenta seleccionar otra ubicación en el mapa.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                    </div>
                        )}
                        {error && (
                            <Card className="mb-6 border-destructive/50 bg-destructive/5">
                                <CardContent className="p-4">
                                    <p className="text-sm text-destructive">{error}</p>
                                </CardContent>
                            </Card>
                        )}
                </div>
                
                    {/* Botón de continuar eliminado - ahora se avanza automáticamente al seleccionar un servicio */}
                    </div>
                    
                {/* Mobile: Map View */}
                <div className="lg:hidden flex-1 relative w-full flex flex-col">
                        {/* ✅ Loading overlay - Reemplazado por skeleton en la transición */}
                        {/* El skeleton se muestra desde AirbnbSearchBar y SearchCreationPage */}
                        {/* Header móvil - Completamente transparente, solo botones flotantes */}
                        <div 
                            id="mobile-search-header"
                            ref={headerRef}
                            className="absolute top-0 left-0 right-0 z-[9999] pointer-events-none px-4 pt-3"
                            style={{
                                background: 'transparent',
                                backgroundColor: 'transparent',
                                backgroundImage: 'none',
                                backdropFilter: 'none'
                            }}
                        >
                            <div className="flex items-center justify-between pointer-events-auto">
                                {/* Botón de atrás */}
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        navigate('/');
                                    }}
                                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white hover:bg-gray-100 transition-colors flex-shrink-0 shadow-lg"
                                    aria-label="Atrás"
                                >
                                    <ArrowLeft className="w-5 h-5 text-gray-900" />
                                </button>
                                
                                {/* Botón de filtros - Navega de vuelta a búsqueda */}
                                {isMobileDevice && selectedCategory && serviceTypeId && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            // Guardar parámetros en sessionStorage para que AirbnbSearchBar los lea
                                            const searchParams = {
                                                serviceTypeId,
                                                categoryId: selectedCategory,
                                                adUrl: initialUserSearch || ''
                                            };
                                            sessionStorage.setItem('returnToSearch', JSON.stringify(searchParams));
                                            // Navegar a homepage
                                            navigate('/');
                                        }}
                                        aria-label="Cambiar búsqueda"
                                        className="w-10 h-10 rounded-full bg-white hover:bg-gray-100 transition-all flex items-center justify-center flex-shrink-0 shadow-lg"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 32 32"
                                            aria-hidden="true"
                                            role="presentation"
                                            focusable="false"
                                            className="block fill-none h-4 w-4 stroke-current stroke-[2.5] overflow-visible text-gray-900"
                                        >
                                            <path
                                                fill="none"
                                                d="M7 16H3m26 0H15M29 6h-4m-8 0H3m26 20h-4M7 16a4 4 0 1 0 8 0 4 4 0 0 0-8 0zM17 6a4 4 0 1 0 8 0 4 4 0 0 0-8 0zm0 20a4 4 0 1 0 8 0 4 4 0 0 0-8 0zm0 0H3"
                                            />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>
                        
                        {/* Map - ocupa todo el espacio restante */}
                                <div className="flex-1 relative w-full overflow-visible">
                                    <MapContainer
                                        categoryId={selectedCategory}
                                        serviceTypeId={serviceTypeId}
                                        initialCenter={selectedLocation || (() => {
                                            const countryCoords = getCountryCoordinates(selectedCountry);
                                            return countryCoords ? { lat: 42.5, lng: -3.7 } : { lat: 42.5, lng: -3.7 };
                                        })()}
                                        initialZoom={selectedLocation ? Math.min(14, Math.max(4, Math.floor(14 - Math.log2((parseInt(formData.locationRange || '25') * 1000) / 500)))) : 5}
                                        onServiceSelect={(service: Service) => {
                                            // ✅ Convertir Service a formato esperado por handleServiceSelect
                                            // El servicio ya está en mapServices, así que estará disponible en allServicesCombined
                                            const serviceId = service.id;
                                            handleServiceSelect(serviceId);
                                        }}
                                        selectedServiceId={selectedService}
                                        isMobile={true}
                                        style={{ width: '100%', height: '100%' }}
                                        onServicesCountChange={setMapServicesCount}
                                        onServicesChange={setMapServices}
                                    />
                                </div>
                                
                            {/* Floating Button - Siempre visible cuando NO hay card seleccionada */}
                                {formData.latitude && formData.longitude && !selectedService && (
                                <div className="absolute bottom-[env(safe-area-inset-bottom,16px)] left-1/2 transform -translate-x-1/2 z-[9999] pb-4">
                                        <Button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (isDrawerOpen && isDrawerVisible) {
                                                    // Si está abierto, alternar entre expandido y colapsado
                                                    // Usar snapPoints nativos de vaul (números decimales)
                                                    setActiveSnapPoint(activeSnapPoint === 0.85 ? 0.7 : 0.85);
                                                } else {
                                                    // Si está cerrado, abrir expandido
                                                    setIsDrawerOpen(true);
                                                    setIsDrawerVisible(true);
                                                    setActiveSnapPoint(0.7);
                                                    setWasManuallyClosed(false); // ✅ Resetear flag cuando se abre manualmente con el botón
                                                }
                                            }}
                                            size="lg"
                                            className="shadow-[0_2px_8px_rgba(0,0,0,0.1)] border border-gray-200 h-12 px-6 text-sm rounded-full font-medium transition-all duration-200 pointer-events-auto bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100 hover:shadow-[0_2px_12px_rgba(0,0,0,0.15)]"
                                            disabled={false}
                                            style={{
                                                fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                letterSpacing: '-0.01em',
                                            }}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span>
                                                    {mapServicesCount > 0 
                                                        ? `Ver ${mapServicesCount} ${mapServicesCount === 1 ? 'resultado' : 'resultados'}`
                                                        : 'Ver resultados'
                                                    }
                                                </span>
                                                <ChevronUp className="w-4 h-4 text-gray-500" strokeWidth={2.5} />
                                            </div>
                                        </Button>
                                </div>
                                )}
                        
                </div>
                
                {/* Desktop: Right Side - Map */}
                <div className="hidden lg:flex lg:flex-1 relative bg-white" style={{ paddingTop: '80px', paddingLeft: '0px', paddingRight: '32px', paddingBottom: '32px', minWidth: '400px' }}>
                        {false ? (
                        <div className="h-full w-full flex items-center justify-center bg-gray-100">
                            <div className="text-red-500">Error al cargar el mapa</div>
                            </div>
                        ) : (
                            <>
                            {/* Map ocupa todo el espacio con borde blanco más grueso y laterales muy redondeados */}
                            <div className="absolute" style={{ 
                                borderRadius: '32px', 
                                overflow: 'hidden',
                                top: '80px',
                                left: '40px',
                                right: '32px',
                                bottom: '32px',
                                boxShadow: '0 0 0 24px white'
                            }}>
                                <MapContainer
                                    categoryId={selectedCategory}
                                    serviceTypeId={serviceTypeId}
                                    initialCenter={selectedLocation || (() => {
                                        const countryCoords = getCountryCoordinates(selectedCountry);
                                        return countryCoords ? { lat: countryCoords.lat, lng: countryCoords.lng } : { lat: 40.4168, lng: -3.7038 };
                                    })()}
                                    initialZoom={selectedLocation ? Math.min(14, Math.max(4, Math.floor(14 - Math.log2((25 * 1000) / 500)))) : 5}
                                    onServiceSelect={(service: Service) => {
                                        // ✅ Convertir Service a formato esperado por handleServiceSelect
                                        // El servicio ya está en mapServices, así que estará disponible en allServicesCombined
                                        const serviceId = service.id;
                                        handleServiceSelect(serviceId);
                                    }}
                                    selectedServiceId={selectedService}
                                    isMobile={false}
                                    style={{ width: '100%', height: '100%' }}
                                />
                                
                                {/* Floating Card Desktop - OCULTA EN PC */}
                            </div>
                            </>
                        )}
                    </div>
                </div>
                
                
                {/* CustomBottomSheet con Framer Motion en móvil, ResponsiveModal (Dialog) en PC */}
                {isMobileDevice ? (
                    <CustomBottomSheet
                        open={isDrawerOpen && isDrawerVisible}
                        onOpenChange={(open) => {
                            setIsDrawerOpen(open);
                            setIsDrawerVisible(open);
                            // ✅ Si el usuario cierra el drawer, marcar como cerrado manualmente y deseleccionar servicio
                            if (!open) {
                                setWasManuallyClosed(true);
                                setSelectedService(null); // ✅ Deseleccionar servicio al cerrar
                                drawerOpenedRef.current = false; // ✅ Resetear ref cuando se cierra
                            } else {
                                // Si lo abre, resetear el flag (puede abrirse manualmente)
                                setWasManuallyClosed(false);
                                drawerOpenedRef.current = true; // ✅ Marcar como abierto
                            }
                        }}
                        title={(() => {
                            // ✅ USAR EL CONTADOR CORRECTO: Mostrar número de servicios, no de revisiones
                            const drawerServicesCount = services.length;
                            return drawerServicesCount > 0 
                                ? `${drawerServicesCount} ${drawerServicesCount === 1 ? 'servicio disponible' : 'servicios disponibles'}` 
                                : 'Sin servicios';
                        })()}
                        className="lg:hidden"
                    >
                        {/* Contenido con scroll */}
                        <div 
                            ref={drawerContentRef}
                            style={{ padding: '0 16px' }}
                            onTouchStart={(e) => e.stopPropagation()}
                            onTouchMove={(e) => e.stopPropagation()}
                            onTouchEnd={(e) => e.stopPropagation()}
                            onWheel={(e) => e.stopPropagation()}
                        >
                            {services.length > 0 ? (
                                <div 
                                    className="flex flex-col" 
                                    style={{ 
                                        gap: '32px', // ✅ Más espacio entre cards
                                        paddingTop: '12px', 
                                        paddingBottom: '40px', // ✅ Más padding inferior
                                    }}
                                    onTouchStart={(e) => e.stopPropagation()}
                                    onTouchMove={(e) => e.stopPropagation()}
                                    onTouchEnd={(e) => e.stopPropagation()}
                                    onWheel={(e) => e.stopPropagation()}
                                >
                                    {services.map((service) => {
                                        const serviceId = service.id || (service as any).Id;
                                        const isSelected = selectedService === serviceId;
                                        return (
                                            <div
                                                key={serviceId}
                                                ref={(node) => {
                                                    // ✅ Guardar ref del servicio seleccionado
                                                    if (isSelected) {
                                                        selectedServiceRef.current = node;
                                                    }
                                                }}
                                            >
                                                <MapServiceCard
                                                    service={service}
                                                    isSelected={isSelected}
                                                    onSelect={handleServiceSelect}
                                                    initialIsFavorite={isAuthenticated ? (favoritesMap[serviceId] || false) : false}
                                                />
                                            </div>
                                        );
                                    })}
                                    
                                    {/* ✅ INFINITE SCROLL: Sentinel para detectar cuando llegar al final (móvil) */}
                                    {hasNextPage && (
                                        <div
                                            ref={sentinelRefMobile}
                                            className="h-20 flex items-center justify-center"
                                        >
                                            {isFetchingNextPage && (
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
                                                    <p className="text-sm text-gray-500">Cargando más servicios...</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    
                                    {/* ✅ Indicador de fin de lista */}
                                    {!hasNextPage && allServices.length > 0 && (
                                        <div className="py-8 text-center">
                                            <p className="text-sm text-gray-500">
                                                Has visto todos los servicios disponibles
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="py-12 text-center">
                                    <p className="text-sm text-gray-500">
                                        No hay servicios disponibles
                                    </p>
                                </div>
                            )}
                        </div>
                    </CustomBottomSheet>
                ) : (
                    <ResponsiveModal
                    open={isDrawerOpen}
                    onOpenChange={handleDrawerOpenChange}
                    modal={false}
                    dismissible={true}
                    // ✅ NUEVO: SnapPoints nativos de vaul para fluidez estilo Google Maps/Airbnb
                    snapPoints={SNAP_POINTS as unknown as (number | string)[]}
                    activeSnapPoint={activeSnapPoint}
                    setActiveSnapPoint={setActiveSnapPoint}
                    fadeFromIndex={0}
                    snapToSequentialPoint={true} // ✅ true para mejor fluidez estilo Airbnb
                    style={{
                        opacity: isDrawerVisible ? 1 : 0,
                        pointerEvents: isDrawerVisible ? 'auto' : 'none',
                        transition: 'opacity 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
                    }}
                    title={(() => {
                        const drawerServicesCount = selectedService 
                            ? services.filter(s => (s.id || (s as any).Id) !== selectedService).length
                            : services.length;
                        return drawerServicesCount > 0 
                            ? `${drawerServicesCount} ${drawerServicesCount === 1 ? 'servicio' : 'servicios'}` 
                            : 'Sin servicios';
                    })()}
                    drawerClassName="lg:hidden flex flex-col bg-white outline-none border-0 rounded-t-[20px]"
                    dialogClassName="max-w-4xl max-h-[90vh] flex flex-col"
                    drawerStyle={{ 
                        bottom: '0',
                        zIndex: 10000,
                        position: 'fixed',
                        backgroundColor: 'white',
                        // Sombra igual que el topbar de categorías
                        boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.12), 0 -2px 8px rgba(0, 0, 0, 0.08)',
                        // ✅ Vaul maneja las transiciones nativamente - no sobrescribir
                        willChange: 'transform',
                        // ✅ Sin límite de altura - permitir que suba hasta 100vh
                        maxHeight: '100vh',
                    }}
                    dialogStyle={{
                        maxHeight: '90vh',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        width: '90vw',
                        maxWidth: '1200px'
                    }}
                    noOverlay={true}
                    noHandle={false}
                >
                    {/* Header con contador estilo Airbnb - Solo en móvil - ARRASTRABLE */}
                    <div 
                        className="lg:hidden px-6 py-1.5 bg-white flex-shrink-0 cursor-grab active:cursor-grabbing touch-none"
                        style={{ 
                            zIndex: 10001,
                            userSelect: 'none',
                            WebkitUserSelect: 'none',
                        }}
                        data-vaul-no-drag="false"
                    >
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex-1"></div>
                            <div className="flex flex-col items-center flex-1">
                                <h2 
                                    className="select-none"
                                    style={{
                                        fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                        fontSize: '15px',
                                        fontWeight: 500,
                                        lineHeight: '19px',
                                        color: 'rgb(34, 34, 34)',
                                        margin: 0,
                                        padding: 0,
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {(() => {
                                        // ✅ USAR EL CONTADOR CORRECTO: Mostrar número de servicios, no de revisiones
                                        const drawerServicesCount = selectedService 
                                            ? services.filter(s => (s.id || (s as any).Id) !== selectedService).length
                                            : services.length;
                                        return drawerServicesCount > 0 
                                            ? `${drawerServicesCount} ${drawerServicesCount === 1 ? 'servicio disponible' : 'servicios disponibles'}` 
                                            : 'Sin servicios';
                                    })()}
                                </h2>
                                <div 
                                    style={{
                                        fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                        fontSize: '12px',
                                        fontWeight: 400,
                                        lineHeight: '16px',
                                        color: 'rgb(106, 106, 106)',
                                        whiteSpace: 'nowrap',
                                        marginTop: '2px',
                                    }}
                                >
                                    Cómo ordenamos los resultados
                                </div>
                            </div>
                            <div className="flex-1 flex justify-end">
                                <button
                                    onClick={() => {
                                        setIsDrawerOpen(false);
                                        setIsDrawerVisible(false);
                                    }}
                                    className="p-2 -mr-2 text-gray-600 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-100 flex-shrink-0"
                                    aria-label="Cerrar"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    {/* Header para PC - Dentro del Dialog */}
                    <div className="hidden lg:block px-6 py-4 bg-white border-b border-gray-100 flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-gray-900">
                                {(() => {
                                    const drawerServicesCount = selectedService 
                                        ? services.filter(s => (s.id || (s as any).Id) !== selectedService).length
                                        : services.length;
                                    return drawerServicesCount > 0 
                                        ? `${drawerServicesCount} ${drawerServicesCount === 1 ? 'servicio' : 'servicios'}` 
                                        : 'Sin servicios';
                                })()}
                            </h2>
                        </div>
                    </div>
                    
                    {/* Contenido con scroll */}
                    <div 
                        ref={drawerContentRef}
                        className="flex-1 overflow-y-auto bg-white px-0 lg:px-4"
                        style={{
                            overscrollBehavior: 'contain',
                            WebkitOverflowScrolling: 'touch',
                            scrollBehavior: 'auto',
                            // Altura máxima para asegurar que el scroll funcione (100vh menos header del drawer y topbar)
                            maxHeight: `calc(100vh - ${headerHeight}px - 80px)`,
                            // Mejorar rendimiento del scroll
                            willChange: 'scroll-position',
                            // Suavizar el scroll en iOS
                            WebkitTransform: 'translateZ(0)',
                            transform: 'translateZ(0)',
                            // Forzar aceleración por hardware
                            backfaceVisibility: 'hidden',
                            perspective: '1000px',
                        }}
                    >
                        {/* Services List - Estilo Airbnb */}
                        {services.length > 0 ? (
                            <div style={{ padding: '0 16px' }}>
                                <div 
                                    className="flex flex-col" 
                                    style={{ 
                                        gap: '18px', 
                                        paddingTop: '12px', 
                                        paddingBottom: '28px',
                                        // Mejorar rendimiento de renderizado
                                        contain: 'layout style paint',
                                    }}
                                >
                                    {allServices.map((service) => {
                                        const serviceId = service.id;
                                        const isSelected = selectedService === serviceId;
                                        return (
                                            <MapServiceCard
                                                key={serviceId}
                                                service={service}
                                                isSelected={isSelected}
                                                onSelect={handleServiceSelect}
                                                initialIsFavorite={isAuthenticated ? (favoritesMap[serviceId] || false) : false}
                                            />
                                        );
                                    })}
                                    
                                    {/* ✅ INFINITE SCROLL: Sentinel para detectar cuando llegar al final (desktop) */}
                                    {hasNextPage && (
                                        <div
                                            ref={sentinelRefDesktop}
                                            className="h-20 flex items-center justify-center"
                                        >
                                            {isFetchingNextPage && (
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
                                                    <p className="text-sm text-gray-500">Cargando más servicios...</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    
                                    {!hasNextPage && allServices.length > 0 && (
                                        <div className="py-8 text-center">
                                            <p className="text-sm text-gray-500">
                                                Has visto todos los servicios disponibles
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div style={{ padding: '0 16px' }}>
                                <div className="py-12 text-center">
                                    <p className="text-sm text-gray-500">
                                        {selectedService 
                                            ? 'El servicio seleccionado está en la tarjeta flotante' 
                                            : 'No hay servicios disponibles'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                    </ResponsiveModal>
                )}
        </div>
    );
}