import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { useWindowSize } from '../hooks/useWindowSize';
// 🛡️ Round 28: helper unificado de símbolos de divisa (cubre EUR/USD/GBP/CHF/CAD/SEK/DKK/NOK/PLN/HUF/CZK/BGN/RON).
import { getCurrencySymbol } from '../utils/priceUtils';
import { ArrowRight, ArrowLeft, Search, X, Star, CheckCircle, User, Info, MapPin, Award, Zap, Shield, TrendingUp, Clock, FileText, Image, Video, Heart, ChevronRight, ChevronUp, HelpCircle, SlidersHorizontal } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ImageCarousel } from './ui/image-carousel';
// useLoadScript ya no es necesario - MapContainer lo maneja internamente
import { useServices } from '../hooks/useServices';
import { useInfiniteServices } from '../hooks/useInfiniteServices';
// useMapExperts ya no es necesario - MapContainer lo maneja internamente
import { useMapMarkers } from '../hooks/useMapMarkers'; // ✅ NUEVO: Marcadores ultra ligeros
// ✅ Default import → activa React.memo del MapContainer. Antes (named import)
//    cualquier re-render de SearchParameterForm forzaba al MapContainer a recorrer
//    su function body, lo que disparaba el efecto de markers (remove+create de TODOS).
import MapContainer from './Map/MapContainer';
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
import { reverseGeocodeMapbox, extractCountryCodeFromMapbox, MapboxFeature } from '../utils/mapboxGeocoding';
import {
    hpIconButtonClass,
    hpTitleUnderlineBarStyle,
    MAP_CARD_BODY_CLASS,
    MAP_CARD_CHIP_CLASS,
    MAP_CARD_EYEBROW_CLASS,
    MAP_CARD_HOOK_CLASS,
    MAP_CARD_IMAGE_CLASS,
    MAP_CARD_IMAGE_TOP_CLASS,
    MAP_CARD_NAME_CLASS,
    MAP_CARD_PRICE_CLASS,
    MAP_CARD_PRICE_SUFFIX_CLASS,
    MAP_CARD_BADGE_CLASS,
    MAP_CARD_DESKTOP_SHADOW,
    MAP_CARD_DESKTOP_SHADOW_ACTIVE,
    MAP_CARD_DESKTOP_SHADOW_HOVER,
    MAP_CARD_DESKTOP_SHADOW_HOVERED,
    MAP_DESKTOP_GRID_CLASS,
    MAP_DESKTOP_LIST_CELL_CLASS,
    MAP_DESKTOP_LIST_CLASS,
    MAP_DESKTOP_MAP_INNER_CLASS,
    MAP_DESKTOP_MAP_WRAP_CLASS,
    MAP_DESKTOP_PANEL_HEADER_CLASS,
    MAP_DESKTOP_PANEL_HEADER_META_CLASS,
    MAP_DESKTOP_PANEL_HEADER_META_SEP_CLASS,
    MAP_DESKTOP_PANEL_HEADER_META_STRONG_CLASS,
    MAP_DESKTOP_PANEL_HEADER_TITLE_CLASS,
    MAP_DESKTOP_SCROLL_CLASS,
    MAP_DESKTOP_SPLIT_CLASS,
    MAP_META_CHIP_CLASS,
    MAP_META_CHIP_MUTED_CLASS,
    MAP_MOBILE_DRAWER_HEADER_CLASS,
    MAP_MOBILE_DRAWER_HANDLE_WRAP_CLASS,
    MAP_MOBILE_DRAWER_HANDLE_CLASS,
    MAP_MOBILE_META_ROW_CLASS,
    MAP_MOBILE_META_STRONG_CLASS,
    MAP_MOBILE_META_SEP_CLASS,
    MAP_MOBILE_FILTER_ROW_CLASS,
    MAP_MOBILE_FILTER_CHIP_CLASS,
    MAP_MOBILE_FILTER_CHIP_ACTIVE_CLASS,
    MAP_MOBILE_LIST_CLASS,
    MAP_PAGE_SUBTITLE_MOBILE_CLASS,
    MAP_PAGE_TITLE_MOBILE_CLASS,
    MAP_CARD_MOBILE_COMPACT_WRAP_CLASS,
    MAP_CARD_MOBILE_COMPACT_IMG_CLASS,
    MAP_CARD_MOBILE_COMPACT_INFO_CLASS,
    MAP_CARD_MOBILE_NAME_CLASS,
    MAP_CARD_MOBILE_META_CLASS,
    MAP_CARD_MOBILE_PRICE_CLASS,
    MAP_CARD_MOBILE_FAV_BTN_CLASS,
    SD_MOBILE_GUTTER_CLASS,
} from '../constants/homepageTypography';
import { HomepageDesktopTopBar } from './HomepageDesktopTopBar';

// libraries ya no es necesario - MapContainer lo maneja internamente

// Componente para la card del servicio en el mapa
interface MapServiceCardProps {
    service: any;
    isSelected: boolean;
    isHovered?: boolean;
    onSelect: (serviceId: number) => void;
    initialIsFavorite?: boolean; // Estado inicial desde check-multiple
    /** Centro del mapa para calcular distancia del experto (móvil). Opcional. */
    mapCenter?: { lat: number; lng: number } | null;
}

const getExpertDisplayName = (service: any): string =>
    service.expert?.user?.name || service.expert?.User?.Name || 'Experto verificado';

const getCityLabel = (service: any): string | null =>
    service.expert?.city || service.expert?.City || null;

const getCardHook = (service: any): string => {
    const completed = Number(service.completedSearches ?? 0);
    const reviews = Number(service.totalReviews ?? (service as any).TotalReviews ?? 0);
    if (completed >= 10) return `${completed} inspecciones completadas`;
    if (reviews >= 5) return `${reviews} clientes ya confiaron en este experto`;
    return 'Verificado · Reserva con confianza';
};

/** Haversine en km entre dos puntos geográficos. Devuelve null si faltan coords. */
const distanceKm = (
    a: { lat: number; lng: number } | null,
    b: { lat: number | null; lng: number | null } | null,
): number | null => {
    if (!a || !b || b.lat == null || b.lng == null) return null;
    const R = 6371;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const s =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((a.lat * Math.PI) / 180) *
            Math.cos((b.lat * Math.PI) / 180) *
            Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(s));
};

const formatDistanceKm = (km: number): string => {
    if (km < 1) return `${Math.round(km * 1000)} m`;
    if (km < 10) return `${km.toFixed(1).replace('.', ',')} km`;
    return `${Math.round(km)} km`;
};

const getServiceCoords = (service: any): { lat: number | null; lng: number | null } => {
    const raw = service.expert?.latitude ?? service.expert?.Latitude ?? service.lat ?? service.Lat;
    const rawLng = service.expert?.longitude ?? service.expert?.Longitude ?? service.lng ?? service.Lng;
    const lat = raw != null ? Number(raw) : NaN;
    const lng = rawLng != null ? Number(rawLng) : NaN;
    return { lat: Number.isFinite(lat) ? lat : null, lng: Number.isFinite(lng) ? lng : null };
};

const MapServiceCardInner: React.FC<MapServiceCardProps> = ({ service, isSelected, isHovered = false, onSelect, initialIsFavorite = false, mapCenter = null }) => {
    const [imageIndex, setImageIndex] = useState(0);
    const { isAuthenticated } = useAuth();
    const { toggleFavoriteAsync, checkFavorite } = useServiceFavorites();
    const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
    const navigate = useNavigate();
    const location = useLocation();
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
        const returnTo = `${location.pathname}${location.search}`;
        navigate(`/service/${serviceId}`, { state: { returnTo } });
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
    // 🛡️ Round 28: símbolos del helper unificado en lugar de switches duplicados (cubre 13 divisas).
    const { formatPriceWithSource, preferredCurrency } = useCurrency();
    const priceData = (() => {
        if (!service.price) return { display: 'Consultar', wasConverted: false, sourceFormatted: '' };
        const src = service.priceCurrency || service.currency || service.Currency || 'EUR';
        const info = formatPriceWithSource(service.price, src, preferredCurrency);
        if (!info.wasConverted) {
            const symbol = getCurrencySymbol(src);
            return { display: `${symbol}${Math.round(service.price)}`, wasConverted: false, sourceFormatted: '' };
        }
        const tSym = getCurrencySymbol(preferredCurrency);
        const sSym = getCurrencySymbol(src);
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
    
    const expertName = getExpertDisplayName(service);
    const cityLabel = getCityLabel(service);
    const cardHook = getCardHook(service);
    const serviceTypeLabel = service.serviceTypeName || service.categoryName || 'Revisión';
    const totalReviews =
        service.totalReviews ??
        (service as any).TotalReviews ??
        service.expert?.totalReviews ??
        (service.expert as any)?.TotalReviews ??
        0;

    // En desktop, tarjeta estilo listado mapa (limpia, con copy corto)
    if (!isMobile) {
        return (
            <a
                href={`/service/${serviceId}`}
                onClick={handleCardClick}
                className="block flex-shrink-0 cursor-pointer group"
                style={{ width: '100%', textDecoration: 'none', color: 'inherit' }}
            >
                <div
                    className={`relative w-full rounded-2xl bg-white transition-all duration-200 ${
                        isSelected
                            ? `ring-2 ring-brand ${MAP_CARD_DESKTOP_SHADOW_ACTIVE}`
                            : isHovered
                              ? `${MAP_CARD_DESKTOP_SHADOW_HOVERED} ring-1 ring-brand/15`
                              : `${MAP_CARD_DESKTOP_SHADOW} ${MAP_CARD_DESKTOP_SHADOW_HOVER}`
                    }`}
                >
                    {/* Contenedor de imagen - Estilo exacto de HomepageWall */}
                    <div className={MAP_CARD_IMAGE_CLASS} style={{ borderRadius: '16px 16px 0 0' }}>
                        {imageUrls.length > 0 ? (
                            <>
                                <div className="relative w-full h-full">
                                    <img
                                        src={imageUrls[imageIndex]}
                                        alt={service.serviceTypeName || 'Servicio'}
                                        className="w-full h-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
                                        style={{ display: 'block' }}
                                    />
                                    {/* Vignette inferior — da soporte visual al avatar + indicadores sin oscurecer la imagen */}
                                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/35 via-black/10 to-transparent" aria-hidden />
                                </div>

                                {/* Badge "Recomendamos" - Estilo exacto de HomepageWall */}
                                {isGuestFavorite && (
                                    <div className="absolute left-3 top-3 z-10">
                                        <span className={MAP_CARD_BADGE_CLASS} aria-label="Recomendamos">
                                            Recomendamos
                                        </span>
                                    </div>
                                )}
                                
                                {/* Badge "Recomendación del viajero" cuando está seleccionado */}
                                {isSelected && (
                                    <div className="absolute left-3 top-3 z-10">
                                        <span className={`${MAP_CARD_BADGE_CLASS} gap-1.5`}>
                                            <CheckCircle className="h-3.5 w-3.5 shrink-0 text-[#1c1c1c]" strokeWidth={2.5} />
                                            Seleccionado
                                        </span>
                                    </div>
                                )}

                                {/* Botón de favorito — solo con sesión iniciada */}
                                {isAuthenticated ? (
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
                                            fill: isFavorite ? 'hsl(var(--brand))' : 'rgba(0, 0, 0, 0.5)',
                                            height: '24px',
                                            width: '24px',
                                            stroke: isFavorite ? 'hsl(var(--brand))' : 'rgba(255, 255, 255, 0.8)',
                                            strokeWidth: '2',
                                            overflow: 'visible',
                                            margin: '0',
                                            padding: '0',
                                        }}
                                    >
                                        <path d="m15.9998 28.6668c7.1667-4.8847 14.3334-10.8844 14.3334-18.1088 0-1.84951-.6993-3.69794-2.0988-5.10877-1.3996-1.4098-3.2332-2.11573-5.0679-2.11573-1.8336 0-3.6683.70593-5.0668 2.11573l-2.0999 2.11677-2.0999-2.11677c-1.3985-1.4098-3.2332-2.11573-5.0668-2.11573-1.8347 0-3.6683.70593-5.0679 2.11573-1.3996 1.41083-2.0988 3.25926-2.0988 5.10877 0 7.2244 7.1667 13.2241 14.3334 18.1088z"></path>
                                    </svg>
                                </button>
                                ) : null}

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
                                        width: '44px',
                                        height: '44px',
                                        bottom: '10px',
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

                    <MapServiceCardInfo
                        serviceTypeLabel={serviceTypeLabel}
                        expertName={expertName}
                        cardHook={cardHook}
                        cityLabel={cityLabel}
                        availabilityInfo={availabilityInfo}
                        isGuestFavorite={isGuestFavorite}
                        averageRating={service.averageRating || 0}
                        totalReviews={totalReviews}
                        price={price}
                        priceWasConverted={priceData.wasConverted}
                        priceSourceFormatted={priceData.sourceFormatted}
                    />
                </div>
            </a>
        );
    }
    
    // Móvil — DOS layouts:
    //  · NO seleccionado → COMPACTO (96×96 imagen izquierda + info derecha) → densidad alta
    //  · seleccionado    → HERO (imagen 16:10 arriba + info abajo) → destacado visual
    const coords = getServiceCoords(service);
    const distance = distanceKm(mapCenter, coords);
    const distanceLabel = distance != null ? formatDistanceKm(distance) : null;

    if (!isSelected) {
        const metaParts: string[] = [];
        if (distanceLabel) metaParts.push(distanceLabel);
        if (cityLabel) metaParts.push(cityLabel);
        if (availabilityInfo && availabilityInfo !== 'Flexible') metaParts.push(availabilityInfo);

        return (
            <a
                href={`/service/${serviceId}`}
                onClick={handleCardClick}
                className="block w-full cursor-pointer"
                style={{ textDecoration: 'none', color: 'inherit' }}
            >
                <div className="relative w-full overflow-hidden rounded-2xl bg-white border border-[#ebebeb] shadow-sm transition-colors active:bg-[#fafafa]">
                    <div className={MAP_CARD_MOBILE_COMPACT_WRAP_CLASS}>
                        <div className={MAP_CARD_MOBILE_COMPACT_IMG_CLASS}>
                            {imageUrls.length > 0 ? (
                                <img
                                    src={imageUrls[0]}
                                    alt={service.serviceTypeName || 'Servicio'}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-[10px] text-[#9aa0a6]">
                                    Sin imagen
                                </div>
                            )}
                            {isGuestFavorite && (
                                <span className="absolute left-1 top-1 inline-flex items-center rounded-md bg-white/95 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#1c1c1c] shadow-sm">
                                    Top
                                </span>
                            )}
                        </div>

                        <div className={MAP_CARD_MOBILE_COMPACT_INFO_CLASS}>
                            <div className={`min-w-0 ${isAuthenticated ? 'pr-10' : 'pr-0'}`}>
                                <div className="flex items-center gap-1.5">
                                    <p className="truncate text-[10px] font-semibold uppercase tracking-[0.085em] text-brand">
                                        {serviceTypeLabel}
                                    </p>
                                    {service.averageRating > 0 && (
                                        <span className="ml-auto inline-flex shrink-0 items-center gap-0.5 leading-none">
                                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                            <span className="text-[11.5px] font-semibold tabular-nums text-[#1c1c1c]">
                                                {service.averageRating.toFixed(1).replace('.', ',')}
                                            </span>
                                            {totalReviews > 0 && (
                                                <span className="text-[10.5px] font-normal text-[#9aa0a6] tabular-nums">
                                                    ({totalReviews})
                                                </span>
                                            )}
                                        </span>
                                    )}
                                </div>
                                <h3 className={MAP_CARD_MOBILE_NAME_CLASS}>{expertName}</h3>
                                {metaParts.length > 0 && (
                                    <p className={MAP_CARD_MOBILE_META_CLASS}>
                                        {metaParts.join(' · ')}
                                    </p>
                                )}
                            </div>

                            <div className="mt-1 flex items-baseline gap-1">
                                <span className={MAP_CARD_MOBILE_PRICE_CLASS}>{price}</span>
                                <span className="text-[12px] font-normal text-[#6a6a6a]">/ servicio</span>
                            </div>
                        </div>

                        {isAuthenticated ? (
                            <button
                                type="button"
                                onClick={handleFavoriteClick}
                                aria-label={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                                className={MAP_CARD_MOBILE_FAV_BTN_CLASS}
                            >
                                <svg
                                    viewBox="0 0 32 32"
                                    aria-hidden
                                    style={{
                                        height: 22,
                                        width: 22,
                                        fill: isFavorite ? 'hsl(var(--brand))' : 'rgba(0,0,0,0.45)',
                                        stroke: isFavorite ? 'hsl(var(--brand))' : 'rgba(255,255,255,0.95)',
                                        strokeWidth: 2,
                                    }}
                                >
                                    <path d="m15.9998 28.6668c7.1667-4.8847 14.3334-10.8844 14.3334-18.1088 0-1.84951-.6993-3.69794-2.0988-5.10877-1.3996-1.4098-3.2332-2.11573-5.0679-2.11573-1.8336 0-3.6683.70593-5.0668 2.11573l-2.0999 2.11677-2.0999-2.11677c-1.3985-1.4098-3.2332-2.11573-5.0668-2.11573-1.8347 0-3.6683.70593-5.0679 2.11573-1.3996 1.41083-2.0988 3.25926-2.0988 5.10877 0 7.2244 7.1667 13.2241 14.3334 18.1088z"></path>
                                </svg>
                            </button>
                        ) : null}
                    </div>
                </div>
            </a>
        );
    }

    // Layout HERO — solo cuando isSelected es true
    return (
        <a
            href={`/service/${serviceId}`}
            onClick={handleCardClick}
            className="block w-full cursor-pointer"
            style={{ textDecoration: 'none', color: 'inherit' }}
        >
            <div
                className="relative w-full overflow-hidden rounded-2xl bg-white ring-2 ring-brand shadow-md transition-shadow"
            >
                <div className={MAP_CARD_IMAGE_TOP_CLASS}>
                    {imageUrls.length > 0 ? (
                        <>
                            {/* Imagen principal — sin scale en móvil */}
                            <div className="relative w-full h-full">
                                <img
                                    src={imageUrls[imageIndex]}
                                    alt={service.serviceTypeName || service.categoryName || 'Servicio'}
                                    className="w-full h-full object-cover"
                                    style={{ display: 'block' }}
                                />
                                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/35 via-black/10 to-transparent" aria-hidden />
                            </div>

                            {isGuestFavorite && (
                                <div className="absolute left-3 top-3 z-10">
                                    <span className={MAP_CARD_BADGE_CLASS} aria-label="Recomendamos">
                                        Recomendamos
                                    </span>
                                </div>
                            )}

                            {isSelected && (
                                <div className="absolute left-3 top-3 z-10">
                                    <span className={`${MAP_CARD_BADGE_CLASS} gap-1.5`}>
                                        <CheckCircle className="h-3.5 w-3.5 shrink-0 text-[#1c1c1c]" strokeWidth={2.5} />
                                        Seleccionado
                                    </span>
                                </div>
                            )}

                            {isAuthenticated ? (
                            <button
                                onClick={handleFavoriteClick}
                                aria-label={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                                className="absolute top-1.5 right-1.5 z-10 flex items-center justify-center"
                                style={{
                                    padding: '0',
                                    margin: '0',
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    width: '44px',
                                    height: '44px',
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
                                        fill: isFavorite ? 'hsl(var(--brand))' : 'rgba(0, 0, 0, 0.5)',
                                        height: '24px',
                                        width: '24px',
                                        stroke: isFavorite ? 'hsl(var(--brand))' : 'rgba(255, 255, 255, 0.85)',
                                        strokeWidth: '2',
                                        overflow: 'visible',
                                        margin: '0',
                                        padding: '0',
                                    }}
                                >
                                    <path d="m15.9998 28.6668c7.1667-4.8847 14.3334-10.8844 14.3334-18.1088 0-1.84951-.6993-3.69794-2.0988-5.10877-1.3996-1.4098-3.2332-2.11573-5.0679-2.11573-1.8336 0-3.6683.70593-5.0668 2.11573l-2.0999 2.11677-2.0999-2.11677c-1.3985-1.4098-3.2332-2.11573-5.0668-2.11573-1.8347 0-3.6683.70593-5.0679 2.11573-1.3996 1.41083-2.0988 3.25926-2.0988 5.10877 0 7.2244 7.1667 13.2241 14.3334 18.1088z"></path>
                                </svg>
                            </button>
                            ) : null}

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
                                        width: '40px',
                                        height: '40px',
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
                                                backgroundColor: 'hsl(var(--brand))',
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

                <MapServiceCardInfo
                    serviceTypeLabel={serviceTypeLabel}
                    expertName={expertName}
                    cardHook={cardHook}
                    cityLabel={cityLabel}
                    availabilityInfo={availabilityInfo}
                    isGuestFavorite={isGuestFavorite}
                    averageRating={service.averageRating || 0}
                    totalReviews={totalReviews}
                    price={price}
                    priceWasConverted={priceData.wasConverted}
                    priceSourceFormatted={priceData.sourceFormatted}
                />
            </div>
        </a>
    );
};

/**
 * ✅ Memoización por shallow-equal de las props que importan.
 *    Sin esto, cualquier re-render del padre (mapa moviéndose, debounce, snap)
 *    re-renderizaba TODAS las cards → jank durante el drag del drawer.
 */
const MapServiceCard = memo(
    MapServiceCardInner,
    (prev, next) =>
        prev.service === next.service &&
        prev.isSelected === next.isSelected &&
        prev.isHovered === next.isHovered &&
        prev.initialIsFavorite === next.initialIsFavorite &&
        prev.onSelect === next.onSelect &&
        // Comparación por referencia: selectedLocation es estable salvo cambio real
        prev.mapCenter === next.mapCenter,
);

const getZoomLevel = (radius: number) => {
    const radiusInMeters = radius * 1000;
    return Math.min(14, Math.max(4, Math.floor(14 - Math.log2(radiusInMeters / 500))));
};
const defaultCenter = {
    lat: 40.4168,
    lng: -3.7038
};

/** Zoom inicial del mapa: vista amplia (país/región), no encima del usuario */
const getMapOverviewZoom = (countryCode: string): number =>
    getCountryCoordinates(countryCode)?.zoom ?? 6;

/** peek · reposo (al cargar, ~mitad inferior) · casi pantalla completa */
// ✅ 3 snaps: peek (mostrar el mapa) · deployed (mitad - posición inicial) · full.
//    Con la implementación custom (motion value + spring), el drag es 1:1 con el
//    dedo; los snaps SOLO se aplican al soltar, así que el snap intermedio no
//    se siente como "tramo" durante el gesto.
const MOBILE_MAP_SNAP_POINTS: (number | string)[] = [0.30, 0.50, 0.92];
const MOBILE_MAP_SNAP_PEEK = MOBILE_MAP_SNAP_POINTS[0];     // 30% – ver mapa
const MOBILE_MAP_SNAP_DEPLOYED = MOBILE_MAP_SNAP_POINTS[1]; // 50% – posición inicial
const MOBILE_MAP_SNAP_FULL = MOBILE_MAP_SNAP_POINTS[2];     // 92% – pantalla casi completa

function MapPanelHeader({
    count,
    hasLocation,
    titleClassName,
    subtitleClassName,
    subtitle = 'Compara valoraciones, informe y precio. Reserva con pago seguro.',
}: {
    count: number;
    hasLocation: boolean;
    titleClassName: string;
    subtitleClassName: string;
    subtitle?: string;
}) {
    if (!hasLocation) {
        return (
            <>
                <h2 className={titleClassName}>
                    Marca dónde buscas
                    <span aria-hidden style={hpTitleUnderlineBarStyle} />
                </h2>
                <p className={subtitleClassName}>
                    Toca el mapa o usa tu ubicación para ver opciones cerca.
                </p>
            </>
        );
    }
    return (
        <>
            {count > 0 && (
                <p className="hp-eyebrow mb-1">
                    {count} {count === 1 ? 'opción en el mapa' : 'opciones en el mapa'}
                </p>
            )}
            <h2 className={titleClassName}>
                Elige antes de comprar
                <span aria-hidden style={hpTitleUnderlineBarStyle} />
            </h2>
            <p className={subtitleClassName}>{subtitle}</p>
        </>
    );
}

type MobileSortKey = 'relevance' | 'price-asc' | 'price-desc' | 'rating';

const MOBILE_SORT_LABEL: Record<MobileSortKey, string> = {
    'relevance': 'Relevancia',
    'price-asc': 'Precio: menor',
    'price-desc': 'Precio: mayor',
    'rating': 'Mejor valorado',
};

interface MapMobileDrawerHeaderProps {
    count: number;
    locationLabel?: string | null;
    rangeKm?: number;
    sortKey?: MobileSortKey;
    priceActive?: boolean;
    ratingActive?: boolean;
    onOpenSort?: () => void;
    onOpenPrice?: () => void;
    onOpenRating?: () => void;
    /** Callback para minimizar el drawer (peek). El header dibuja el X inline. */
    onMinimize?: () => void;
}

/**
 * Cabecera del drawer móvil — REFACTOR:
 *   - Handle visible (affordance de drag)
 *   - Meta inline: N expertos · ubicación · ~radio km (señal de contexto)
 *   - Fila de chips de filtros: ordenar, precio, valoración (scroll-x)
 *
 * Antes: solo título "Elige antes de comprar" + subtítulo redundante. Sin handle
 *   (`CustomBottomSheet` solo renderiza grabber cuando NO se pasa `headerContent`).
 *   Resultado: el usuario no sabía que se arrastraba.
 */
function MapMobileDrawerHeader({
    count,
    locationLabel,
    rangeKm = 25,
    sortKey = 'relevance',
    priceActive = false,
    ratingActive = false,
    onOpenSort,
    onOpenPrice,
    onOpenRating,
    onMinimize,
}: MapMobileDrawerHeaderProps) {
    /*
     * Layout REDISEÑADO (método radicalmente distinto):
     *
     * Antes (estaba):     handle → meta → mt-3 → filtros
     *                     → el usuario percibía que algo "arriba" tapaba los chips
     *
     * Ahora (esto):       handle → FILTROS (primario) → meta (caption sutil)
     *                     → los chips NO TIENEN NADA encima salvo el handle,
     *                       que es decorativo y minúsculo (4×36px).
     *
     * Estructura: `flex flex-col gap-3` con cada fila como flex item independiente.
     * No hay absolute, no hay X, no hay solapamiento posible.
     */
    return (
        <div className="px-4 pt-2 pb-4 flex flex-col gap-4">
            {/* 1. Handle — decorativo, drag-down para minimizar */}
            <div className="flex justify-center" aria-hidden>
                <span className="h-1 w-10 rounded-full bg-[#d8d8d8]" />
            </div>

            {/* 2. FILTROS — elemento primario del drawer (lo más actionable).
                py-1 (padding vertical) para garantizar que la sombra de los chips
                no se recorta arriba/abajo y respiran claramente. */}
            <div
                className="flex items-center gap-2 overflow-x-auto -mx-4 px-4 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                role="group"
                aria-label="Filtros rápidos"
            >
                <button
                    type="button"
                    data-no-drag
                    onClick={onOpenSort}
                    className={sortKey !== 'relevance' ? MAP_MOBILE_FILTER_CHIP_ACTIVE_CLASS : MAP_MOBILE_FILTER_CHIP_CLASS}
                >
                    <span>Ordenar: {MOBILE_SORT_LABEL[sortKey]}</span>
                    <ChevronUp className="h-3 w-3 rotate-180 opacity-70" strokeWidth={2.5} aria-hidden />
                </button>
                <button
                    type="button"
                    data-no-drag
                    onClick={onOpenPrice}
                    className={priceActive ? MAP_MOBILE_FILTER_CHIP_ACTIVE_CLASS : MAP_MOBILE_FILTER_CHIP_CLASS}
                >
                    <span>Precio</span>
                    <ChevronUp className="h-3 w-3 rotate-180 opacity-70" strokeWidth={2.5} aria-hidden />
                </button>
                <button
                    type="button"
                    data-no-drag
                    onClick={onOpenRating}
                    className={ratingActive ? MAP_MOBILE_FILTER_CHIP_ACTIVE_CLASS : MAP_MOBILE_FILTER_CHIP_CLASS}
                >
                    <Star className="h-3 w-3" aria-hidden />
                    <span>Valoración</span>
                    <ChevronUp className="h-3 w-3 rotate-180 opacity-70" strokeWidth={2.5} aria-hidden />
                </button>
            </div>

            {/* 3. META — caption sutil al final, jerarquía secundaria */}
            <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0 text-[11.5px] font-medium leading-[1.2] text-[#9aa0a6] font-display">
                <span className="font-semibold text-[#1c1c1c] tabular-nums">{count}</span>
                <span>{count === 1 ? 'experto' : 'expertos'}</span>
                {locationLabel && (
                    <>
                        <span aria-hidden>·</span>
                        <span className="truncate max-w-[180px]">{locationLabel}</span>
                    </>
                )}
                <span aria-hidden>·</span>
                <span className="shrink-0 tabular-nums">~{rangeKm} km</span>
            </p>
        </div>
    );
}

/** Stepper editorial 1 ─── 2 ─── 3 (paso actual en brand). Desktop only. */
function MapDesktopStepper({ currentStep = 1 }: { currentStep?: 1 | 2 | 3 }) {
    const steps = [
        { n: 1, label: 'Elige experto' },
        { n: 2, label: 'Revisa servicio' },
        { n: 3, label: 'Reserva' },
    ] as const;
    return (
        <ol className="mb-3 flex items-center gap-2.5 font-display" aria-label="Pasos del proceso">
            {steps.map((s, idx) => {
                const isActive = s.n === currentStep;
                const isDone = s.n < currentStep;
                return (
                    <li key={s.n} className="flex items-center gap-2.5">
                        <span
                            className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums leading-none transition-colors ${
                                isActive
                                    ? 'bg-brand text-white shadow-[0_2px_6px_hsl(var(--brand)/0.35)]'
                                    : isDone
                                      ? 'bg-brand/15 text-brand'
                                      : 'bg-[#f4f4f4] text-[#9aa0a6]'
                            }`}
                            aria-current={isActive ? 'step' : undefined}
                        >
                            {s.n}
                        </span>
                        <span
                            className={`text-[12px] font-medium tracking-tight ${
                                isActive ? 'text-[#1c1c1c]' : 'text-[#6a6a6a]'
                            }`}
                        >
                            {s.label}
                        </span>
                        {idx < steps.length - 1 && (
                            <span className="ml-1 h-px w-6 bg-[#e0e0e0]" aria-hidden />
                        )}
                    </li>
                );
            })}
        </ol>
    );
}

/**
 * Microcabecera del PANEL DE CARDS (columna izquierda).
 *
 * Antes: este componente era un <header> full-width col-span-2 row-start-1 que
 * dejaba un hueco blanco de ~110px a la derecha (mitad del ancho × altura del
 * header) → el usuario lo percibía como "espacio vacío arriba".
 *
 * Ahora: vive DENTRO del scroll de la lista (no compite con el mapa, no resta
 * altura). Sticky → el contexto queda pinned al scrollear. El mapa nace pegado
 * a la topbar y ocupa 100dvh - 52px.
 *
 * Voz editorial reducida a un h2 + meta inline — la topbar mapStep ya tiene
 * stepper y chips de zona/expertos, no duplicamos.
 */
function MapDesktopPanelHeader({
    hasLocation,
    expertCount,
    locationLabel,
    rangeKm,
    sortKey = 'relevance',
    priceActive = false,
    ratingActive = false,
    onOpenSort,
    onOpenPrice,
    onOpenRating,
}: {
    hasLocation: boolean;
    expertCount?: number;
    locationLabel?: string;
    rangeKm?: number;
    sortKey?: MobileSortKey;
    priceActive?: boolean;
    ratingActive?: boolean;
    onOpenSort?: () => void;
    onOpenPrice?: () => void;
    onOpenRating?: () => void;
}) {
    if (!hasLocation) {
        return (
            <header className={MAP_DESKTOP_PANEL_HEADER_CLASS}>
                <p className="text-[13px] font-medium text-[#6a6a6a] font-display">
                    Selecciona una zona en el mapa para ver expertos con cobertura cerca de ti.
                </p>
            </header>
        );
    }

    return (
        <header className={MAP_DESKTOP_PANEL_HEADER_CLASS}>
            {/* Fila de filtros chips + meta inline (compacta, sin h2/eyebrow) */}
            <div className="flex flex-wrap items-center gap-1.5">
                <button
                    type="button"
                    onClick={onOpenSort}
                    className={sortKey !== 'relevance' ? MAP_MOBILE_FILTER_CHIP_ACTIVE_CLASS : MAP_MOBILE_FILTER_CHIP_CLASS}
                >
                    <span>Ordenar: {MOBILE_SORT_LABEL[sortKey]}</span>
                    <ChevronUp className="h-3 w-3 rotate-180 opacity-70" strokeWidth={2.5} aria-hidden />
                </button>
                <button
                    type="button"
                    onClick={onOpenPrice}
                    className={priceActive ? MAP_MOBILE_FILTER_CHIP_ACTIVE_CLASS : MAP_MOBILE_FILTER_CHIP_CLASS}
                >
                    <span>Precio</span>
                    <ChevronUp className="h-3 w-3 rotate-180 opacity-70" strokeWidth={2.5} aria-hidden />
                </button>
                <button
                    type="button"
                    onClick={onOpenRating}
                    className={ratingActive ? MAP_MOBILE_FILTER_CHIP_ACTIVE_CLASS : MAP_MOBILE_FILTER_CHIP_CLASS}
                >
                    <Star className="h-3 w-3" aria-hidden />
                    <span>Valoración</span>
                    <ChevronUp className="h-3 w-3 rotate-180 opacity-70" strokeWidth={2.5} aria-hidden />
                </button>
            </div>

            {/* Meta row — separador delgado bajo los filtros, con N expertos · zona · radio */}
            <p className={`${MAP_DESKTOP_PANEL_HEADER_META_CLASS} pt-2`}>
                {typeof expertCount === 'number' && (
                    <>
                        <span className={MAP_DESKTOP_PANEL_HEADER_META_STRONG_CLASS}>{expertCount}</span>
                        <span>{expertCount === 1 ? 'experto' : 'expertos'}</span>
                    </>
                )}
                {locationLabel && (
                    <>
                        <span className={MAP_DESKTOP_PANEL_HEADER_META_SEP_CLASS} aria-hidden>·</span>
                        <span className="truncate max-w-[260px]">{locationLabel}</span>
                    </>
                )}
                {rangeKm && (
                    <>
                        <span className={MAP_DESKTOP_PANEL_HEADER_META_SEP_CLASS} aria-hidden>·</span>
                        <span>~{rangeKm} km</span>
                    </>
                )}
            </p>
        </header>
    );
}

type MapServiceCardInfoProps = {
    serviceTypeLabel: string;
    expertName: string;
    cardHook: string;
    cityLabel: string | null;
    availabilityInfo: string;
    isGuestFavorite: boolean;
    averageRating: number;
    totalReviews: number;
    price: string;
    priceWasConverted: boolean;
    priceSourceFormatted: string;
};

function MapServiceCardInfo({
    serviceTypeLabel,
    expertName,
    cardHook,
    cityLabel,
    availabilityInfo,
    isGuestFavorite,
    averageRating,
    totalReviews,
    price,
    priceWasConverted,
    priceSourceFormatted,
}: MapServiceCardInfoProps) {
    return (
        <div className={MAP_CARD_BODY_CLASS}>
            <p className={`${MAP_CARD_EYEBROW_CLASS} mb-1`}>{serviceTypeLabel}</p>
            <div className="mb-1.5 flex items-start justify-between gap-2">
                <h3 className={MAP_CARD_NAME_CLASS}>{expertName}</h3>
                {averageRating > 0 && (
                    <div className="flex shrink-0 items-center gap-1 leading-none">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-[12.5px] font-semibold tabular-nums text-[#1c1c1c]">
                            {averageRating.toFixed(1).replace('.', ',')}
                        </span>
                        {totalReviews > 0 && (
                            <span className="text-[11px] font-normal text-[#9aa0a6] tabular-nums">({totalReviews})</span>
                        )}
                    </div>
                )}
            </div>
            <p className={`${MAP_CARD_HOOK_CLASS} mb-1.5`}>{cardHook}</p>
            <div className="mb-2 flex flex-wrap gap-1.5">
                {cityLabel && (
                    <span className={MAP_CARD_CHIP_CLASS}>
                        <MapPin className="h-3 w-3 shrink-0" />
                        {cityLabel}
                    </span>
                )}
                <span className={MAP_CARD_CHIP_CLASS}>
                    <Clock className="h-3 w-3 shrink-0" />
                    {availabilityInfo}
                </span>
                {isGuestFavorite && (
                    <span className="inline-flex items-center rounded-full bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand">
                        Top valorado
                    </span>
                )}
            </div>
            <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 pt-1">
                <span className={MAP_CARD_PRICE_CLASS}>{price}</span>
                {priceWasConverted && priceSourceFormatted && (
                    <span className="text-xs font-normal text-[#6a6a6a]">{priceSourceFormatted}</span>
                )}
                <span className={MAP_CARD_PRICE_SUFFIX_CLASS}>/ servicio</span>
            </div>
        </div>
    );
}

interface SearchParameterFormProps {
    onComplete: (parameters: any) => void;
    setCurrentStep: (step: number) => void;
    selectedCategory: number | null;
    initialKeywords: string;
    initialUserSearch: string;
    serviceTypeId: number | null;
    onMapReady?: () => void;
    /** Se llama una sola vez cuando la primera carga de servicios ha terminado
     *  (haya servicios o no). El padre usa esto para no mostrar la página vacía
     *  mientras llegan los datos del backend. */
    onServicesReady?: () => void;
}
export function SearchParameterForm({ onComplete, setCurrentStep, selectedCategory, initialKeywords, initialUserSearch, serviceTypeId, onMapReady, onServicesReady }: SearchParameterFormProps) {
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
    const [mapLoading, setMapLoading] = useState(true);

    const handleMapLoadingChange = useCallback(
        (state: { loading: boolean; isInitialLoading: boolean; isRefreshing: boolean }) => {
            setMapLoading(state.isInitialLoading);
        },
        []
    );
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
    // Móvil: drawer en reposo al entrar (~52% altura). Desktop: cerrado.
    const [isDrawerOpen, setIsDrawerOpen] = useState(initialIsMobile);
    const [isDrawerVisible, setIsDrawerVisible] = useState(initialIsMobile);
    // ✅ Rastrear si el usuario cerró el drawer manualmente para evitar reabrir automáticamente
    const [wasManuallyClosed, setWasManuallyClosed] = useState(false);
    
    const drawerContentRef = useRef<HTMLDivElement>(null);
    const drawerRef = useRef<HTMLDivElement>(null); // ✅ Ref para detectar clicks fuera del drawer
    const headerRef = useRef<HTMLDivElement>(null);
    const [headerHeight, setHeaderHeight] = useState(81); // Altura por defecto del header
    // ✅ INFINITE SCROLL: Refs para los sentinels
    const sentinelRefMobile = useRef<HTMLDivElement>(null);
    const sentinelRefDesktop = useRef<HTMLDivElement>(null);
    const sentinelRefSidebar = useRef<HTMLDivElement>(null);
    const [hoveredServiceId, setHoveredServiceId] = useState<number | null>(null);
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
    const [mobileDrawerSnap, setMobileDrawerSnap] = useState<number | string | null>(
        initialIsMobile ? MOBILE_MAP_SNAP_DEPLOYED : MOBILE_MAP_SNAP_PEEK,
    );

    const isMobileDrawerDeployed =
        mobileDrawerSnap === MOBILE_MAP_SNAP_DEPLOYED || mobileDrawerSnap === MOBILE_MAP_SNAP_FULL;

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
        enabled:
            !!(debouncedParams.categoryId &&
                debouncedParams.serviceTypeId &&
                debouncedParams.latitude &&
                debouncedParams.longitude &&
                debouncedParams.locationRange) &&
            // ✅ En móvil solo refetch cuando el drawer está desplegado.
            //    Antes era `isMobileDevice || ...` (siempre true en móvil) → refetch
            //    durante el drag del drawer cuando el mapa se movía bajo el dedo.
            (isMobileDevice ? isMobileDrawerDeployed : true),
    });
   
    // ✅ Dispara `onServicesReady` una sola vez cuando la primera carga finalice.
    //    El padre (SearchCreationPage) lo usa junto con `onMapReady` para evitar
    //    mostrar la página vacía mientras llegan los datos. Sin esto, el usuario veía
    //    primero la lista vacía y al rato aparecían los servicios → mal UX.
    const servicesReadyFiredRef = useRef(false);
    useEffect(() => {
        if (servicesReadyFiredRef.current) return;
        const hasParams = !!(debouncedParams.categoryId && debouncedParams.serviceTypeId && debouncedParams.latitude && debouncedParams.longitude);
        if (!hasParams) return;
        if (!isLoadingServices) {
            servicesReadyFiredRef.current = true;
            onServicesReady?.();
        }
    }, [isLoadingServices, debouncedParams.categoryId, debouncedParams.serviceTypeId, debouncedParams.latitude, debouncedParams.longitude, onServicesReady]);

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
                    
                    // 🛡️ Round 28 CUR-6: extraer priceCurrency del raw o del mapService (que ya
                    // viene normalizado por useServiceLoader tras CUR-4). Sin esta línea, las cards
                    // del mapa caían SIEMPRE al fallback EUR aunque el servicio fuera USD/GBP/etc.,
                    // anulando la conversión y el sufijo (source) en `MapServiceCard`.
                    const cardCurrency = mapService.priceCurrency
                        || mapService.currency
                        || rawService.priceCurrency
                        || rawService.PriceCurrency
                        || rawService.currency
                        || rawService.Currency
                        || 'EUR';
                    return {
                        id: mapService.id,
                        expertProfileId: rawExpert.id || rawExpert.Id,
                        categoryId: rawService.categoryId || rawService.CategoryId || selectedCategory,
                        serviceTypeId: rawService.serviceTypeId || rawService.ServiceTypeId || serviceTypeId,
                        serviceTypeName: mapService.type || rawService.serviceTypeName || rawService.ServiceTypeName,
                        serviceTypeDescription: rawService.serviceTypeDescription || rawService.ServiceTypeDescription,
                        price: mapService.price,
                        priceCurrency: cardCurrency,
                        currency: cardCurrency,
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
                            city: rawExpert.city || rawExpert.City || '',
                        },
                    } as typeof allServices[0];
                })
                .filter(service => {
                    // Filtrar por categoría si está seleccionada
                    if (selectedCategory > 0) {
                        const serviceCategoryId = Number(service.categoryId ?? (service as any).CategoryId);
                        return Number.isFinite(serviceCategoryId) && serviceCategoryId === Number(selectedCategory);
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
                const serviceCategoryId = Number(s.categoryId ?? (s as any).CategoryId);
                return Number.isFinite(serviceCategoryId) && serviceCategoryId === Number(selectedCategory);
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
        const sentinels = [
            sentinelRefMobile.current,
            sentinelRefDesktop.current,
            sentinelRefSidebar.current,
        ].filter(Boolean) as HTMLDivElement[];
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
    
    const collapseMobileDrawer = useCallback(() => {
        setWasManuallyClosed(true);
        setSelectedService(null);
        setMobileDrawerSnap(MOBILE_MAP_SNAP_PEEK);
        setIsDrawerOpen(true);
        setIsDrawerVisible(true);
    }, []);

    // Móvil: montar el drawer la primera vez en posición de reposo.
    // ❌ NO depender de formData.latitude/longitude: re-disparaba el setSnap
    //    cuando el mapa se movía bajo el dedo, interrumpiendo el gesto del drawer.
    const drawerMountedRef = useRef(false);
    useEffect(() => {
        if (!isMobileDevice) return;
        setIsDrawerOpen(true);
        setIsDrawerVisible(true);
        if (!drawerMountedRef.current && !wasManuallyClosed) {
            setMobileDrawerSnap(MOBILE_MAP_SNAP_DEPLOYED);
            drawerMountedRef.current = true;
        }
    }, [isMobileDevice, wasManuallyClosed]);

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
    // Logs de ubicación desactivados para evitar ruido y renders aparentes en bucle.
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
    const extractCountryCode = (result: any): string | null => {
        if (!result) return null;
        if (result.address_components && Array.isArray(result.address_components)) {
            for (const component of result.address_components) {
                if (component.types?.includes('country') && component.short_name) {
                    return component.short_name.toLowerCase();
                }
            }
        }
        return extractCountryCodeFromMapbox(result as MapboxFeature);
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
                        
                        try {
                            const feature = await reverseGeocodeMapbox(currentLocation.lat, currentLocation.lng);
                            if (feature?.place_name) {
                                updateLocationAndMap(currentLocation, feature.place_name);
                            } else {
                                updateLocationAndMap(currentLocation);
                            }
                        } catch {
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
    const handleMapClick = async (e: any) => {
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
            const latValue = typeof e.latLng?.lat === 'function' ? e.latLng.lat() : e.latLng?.lat;
            const lngValue = typeof e.latLng?.lng === 'function' ? e.latLng.lng() : e.latLng?.lng;
            const newLocation = {
                lat: latValue,
                lng: lngValue
            };
            
            setIsGeocoding(true);
            
            try {
                const feature = await reverseGeocodeMapbox(newLocation.lat, newLocation.lng);
                setIsGeocoding(false);
                if (feature?.place_name) {
                    const countryCode = extractCountryCode(feature);
                    if (countryCode && countryCode !== selectedCountry.toLowerCase()) {
                        setSelectedCountry(countryCode);
                    }
                    updateLocationAndMap(newLocation, feature.place_name);
                } else {
                    updateLocationAndMap(newLocation);
                }
            } catch {
                setIsGeocoding(false);
                updateLocationAndMap(newLocation);
            }
        }
    };
    // Ref para el contenedor del sidebar (lista de servicios)
    const sidebarRef = useRef<HTMLDivElement>(null);
    
    // ✅ useCallback con deps estables: la referencia es la misma entre renders,
    //    así MapServiceCard memoizado no se re-renderiza al cambiar otras props del padre.
    const handleServiceSelect = useCallback((serviceId: number | undefined | null) => {

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
            setMobileDrawerSnap(MOBILE_MAP_SNAP_DEPLOYED);
            setWasManuallyClosed(false);
        }
        
        // ✅ Hacer scroll al principio del sidebar para mostrar la card seleccionada (solo en desktop)
        if (sidebarRef.current) {
            setTimeout(() => {
                sidebarRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
            }, 100);
        }
    }, [isMobileDevice]);
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
        <div className="fixed inset-0 z-[100] flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden bg-white lg:relative lg:inset-auto lg:z-auto lg:h-[100dvh] lg:max-h-[100dvh] lg:min-h-0">
            <HomepageDesktopTopBar variant="map" onBack={() => navigate('/')} />

            {/* Main Layout — lista | mapa (sola fila bajo la topbar; el mapa nace pegado
                a la topbar y ocupa 100dvh-52px). La microcabecera editorial vive DENTRO
                del scroll de la lista para no robar altura al mapa. */}
            <div className={MAP_DESKTOP_SPLIT_CLASS}>
                {/* Cards con scroll */}
                <div className={MAP_DESKTOP_LIST_CELL_CLASS}>
                    <div
                        ref={sidebarRef}
                        className={MAP_DESKTOP_SCROLL_CLASS}
                        data-sidebar-scroll
                    >
                        {!isMobileDevice && (
                            <div className="px-5 xl:px-6">
                                <MapDesktopPanelHeader
                                    hasLocation={!!(formData.latitude && formData.longitude)}
                                    expertCount={formData.latitude && formData.longitude ? services.length : undefined}
                                    locationLabel={
                                        formData.locationName ||
                                        searchAddress ||
                                        getCountryName(selectedCountry) ||
                                        undefined
                                    }
                                    rangeKm={parseInt(formData.locationRange || '25', 10) || 25}
                                    sortKey="relevance"
                                    priceActive={filters.priceRange[0] > 0 || filters.priceRange[1] < 100000}
                                    ratingActive={filters.rating > 0}
                                    onOpenSort={() => { /* TODO: sheet de orden */ }}
                                    onOpenPrice={() => { /* TODO: sheet de precio */ }}
                                    onOpenRating={() => { /* TODO: sheet de valoración */ }}
                                />
                            </div>
                        )}
                        {formData.latitude && formData.longitude && (
                            <div className={MAP_DESKTOP_LIST_CLASS}>
                            {reorderedServices.length > 0 ? (
                                <>
                                    <div className={MAP_DESKTOP_GRID_CLASS}>
                                    {reorderedServices.map((service) => {
                                        const serviceId = service.id || (service as any).Id;
                                        const isSelected = selectedService === serviceId;
                                        const isHovered = hoveredServiceId === serviceId;
                                        return (
                                            <div
                                                key={serviceId}
                                                className="w-full"
                                                onMouseEnter={() => setHoveredServiceId(serviceId)}
                                                onMouseLeave={() => setHoveredServiceId(null)}
                                            >
                                                <MapServiceCard
                                                    service={service}
                                                    isSelected={isSelected}
                                                    isHovered={isHovered}
                                                    onSelect={handleServiceSelect}
                                                    initialIsFavorite={isAuthenticated ? (favoritesMap[serviceId] || false) : false}
                                                />
                                            </div>
                                        );
                                    })}
                                    {hasNextPage && (
                                        <div
                                            ref={sentinelRefSidebar}
                                            className="col-span-full flex h-16 items-center justify-center"
                                        >
                                            {isFetchingNextPage && (
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand/20 border-t-brand" />
                                                    <p className="font-display text-sm text-[#6a6a6a]">Cargando más opciones…</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {!hasNextPage && reorderedServices.length > 0 && (
                                        <div className="col-span-full flex items-center justify-center gap-3 py-5">
                                            <span className="h-px flex-1 max-w-[60px] bg-[#e8e8e8]" aria-hidden />
                                            <p className="font-display text-[12px] font-medium tracking-wide uppercase text-[#9aa0a6]">
                                                Has visto todo en esta zona
                                            </p>
                                            <span className="h-px flex-1 max-w-[60px] bg-[#e8e8e8]" aria-hidden />
                                        </div>
                                    )}
                                    </div>
                                </>
                            ) : mapLoading ? (
                                    <div className={MAP_DESKTOP_GRID_CLASS}>
                                        {[1, 2, 3, 4].map((i) => (
                                            <div key={i} className="h-64 animate-pulse rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50" />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex min-h-[360px] flex-col items-center justify-center p-8 text-center">
                                        <div className="flex max-w-sm flex-col items-center gap-5">
                                            <div className="relative">
                                                <div className="absolute inset-0 -m-3 rounded-full bg-brand/[0.06] blur-xl" aria-hidden />
                                                <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-brand/10 ring-1 ring-brand/15">
                                                    <MapPin className="h-7 w-7 text-brand" strokeWidth={2.1} />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5 font-display">
                                                <h3 className="text-[1.0625rem] font-semibold tracking-tight text-[#1c1c1c]">
                                                    Sin expertos en esta zona
                                                </h3>
                                                <p className="text-sm leading-relaxed text-[#6a6a6a]">
                                                    Prueba a ampliar el radio o explora otra zona — desplazando el mapa también verás más.
                                                </p>
                                            </div>
                                            <div className="flex flex-wrap items-center justify-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const current = parseInt(formData.locationRange || '25', 10) || 25;
                                                        const next = Math.min(200, current < 25 ? 25 : current < 50 ? 50 : current < 100 ? 100 : 200);
                                                        if (next !== current) {
                                                            setFormData((prev) => ({ ...prev, locationRange: String(next) }));
                                                        }
                                                    }}
                                                    className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 font-display text-[13px] font-semibold text-white shadow-[0_2px_8px_hsl(var(--brand)/0.22)] transition-colors hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                                                >
                                                    <Search className="h-3.5 w-3.5" aria-hidden />
                                                    Ampliar radio
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => navigate('/')}
                                                    className="inline-flex items-center gap-1.5 rounded-full border border-[#e0e0e0] bg-white px-4 py-2 font-display text-[13px] font-semibold text-[#1c1c1c] transition-colors hover:border-[#1c1c1c]/40 hover:bg-[#fafafa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                                                >
                                                    Cambiar zona
                                                </button>
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
                </div>

                {/* Fila 2 col 2: mapa */}
                {!isMobileDevice && (
                    <div className={MAP_DESKTOP_MAP_WRAP_CLASS}>
                        <div className={MAP_DESKTOP_MAP_INNER_CLASS}>
                            <MapContainer
                                categoryId={selectedCategory}
                                serviceTypeId={serviceTypeId}
                                initialCenter={selectedLocation || (() => {
                                    const countryCoords = getCountryCoordinates(selectedCountry);
                                    return countryCoords ? { lat: countryCoords.lat, lng: countryCoords.lng } : { lat: 40.4168, lng: -3.7038 };
                                })()}
                                initialZoom={getMapOverviewZoom(selectedCountry)}
                                recenterMode="pan-only"
                                onServiceSelect={(service: Service) => {
                                    handleServiceSelect(service.id);
                                }}
                                selectedServiceId={selectedService}
                                hoveredServiceId={hoveredServiceId}
                                isMobile={false}
                                style={{ width: '100%', height: '100%' }}
                                onMapLoad={onMapReady}
                                onServicesCountChange={setMapServicesCount}
                                onServicesChange={setMapServices}
                                onLoadingChange={handleMapLoadingChange}
                            />
                        </div>
                    </div>
                )}

                {/* Mobile: Map View */}
                <div className="relative flex min-h-0 w-full flex-1 flex-col lg:hidden">
                        {/* ✅ Loading overlay - Reemplazado por skeleton en la transición */}
                        {/* El skeleton se muestra desde AirbnbSearchBar y SearchCreationPage */}
                        {/* Header móvil — píldoras flotantes con sombra propia (sin scrim) */}
                        {/*  Antes: scrim h-28 from-white/95 → ocultaba marcadores bajo un velo blanco gigante.
                             Ahora: cada acción es una píldora circular con shadow propia → libera el mapa,
                             permite ver clusters cerca del borde, y los touch targets son de 44px (h-11 w-11). */}
                        <div
                            id="mobile-search-header"
                            ref={headerRef}
                            className="pointer-events-none absolute inset-x-0 top-0 z-[9999]"
                        >
                            <div
                                className={`pointer-events-auto flex items-center justify-between ${SD_MOBILE_GUTTER_CLASS} pt-[max(0.75rem,env(safe-area-inset-top))] pb-2`}
                            >
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        navigate('/');
                                    }}
                                    className="h-11 w-11 inline-flex items-center justify-center rounded-full bg-white/95 backdrop-blur-md shadow-[0_4px_14px_rgba(14,20,36,0.12),0_1px_3px_rgba(14,20,36,0.08)] ring-1 ring-black/[0.04] hover:bg-white active:scale-95 transition-[transform,background] duration-150"
                                    aria-label="Volver"
                                >
                                    <ArrowLeft className="h-5 w-5 text-[#1c1c1c]" strokeWidth={2.1} />
                                </button>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            navigate('/como-funciona');
                                        }}
                                        className="h-11 w-11 inline-flex items-center justify-center rounded-full bg-white/95 backdrop-blur-md shadow-[0_4px_14px_rgba(14,20,36,0.12),0_1px_3px_rgba(14,20,36,0.08)] ring-1 ring-black/[0.04] hover:bg-white active:scale-95 transition-[transform,background] duration-150"
                                        aria-label="Cómo funciona Inspecciono"
                                    >
                                        <HelpCircle className="h-5 w-5 text-[#1c1c1c]" strokeWidth={2.1} />
                                    </button>

                                    {isMobileDevice && selectedCategory && serviceTypeId && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const searchParams = {
                                                    serviceTypeId,
                                                    categoryId: selectedCategory,
                                                    adUrl: initialUserSearch || '',
                                                };
                                                sessionStorage.setItem('returnToSearch', JSON.stringify(searchParams));
                                                navigate('/');
                                            }}
                                            aria-label="Cambiar búsqueda"
                                            className="h-11 w-11 inline-flex items-center justify-center rounded-full bg-white/95 backdrop-blur-md shadow-[0_4px_14px_rgba(14,20,36,0.12),0_1px_3px_rgba(14,20,36,0.08)] ring-1 ring-black/[0.04] hover:bg-white active:scale-95 transition-[transform,background] duration-150"
                                        >
                                            <SlidersHorizontal className="h-[18px] w-[18px] text-[#1c1c1c]" strokeWidth={2.1} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        {/* Map - ocupa todo el espacio restante */}
                                {isMobileDevice && (
                                <div className="flex-1 relative w-full overflow-visible">
                                    <MapContainer
                                        categoryId={selectedCategory}
                                        serviceTypeId={serviceTypeId}
                                        initialCenter={selectedLocation || (() => {
                                            const countryCoords = getCountryCoordinates(selectedCountry);
                                            return countryCoords ? { lat: 42.5, lng: -3.7 } : { lat: 42.5, lng: -3.7 };
                                        })()}
                                        initialZoom={(() => {
                                            const baseZoom = selectedLocation
                                                ? getZoomLevel(parseInt(formData.locationRange || '25', 10))
                                                : getMapOverviewZoom(selectedCountry);
                                            // ✅ Este MapContainer SOLO se monta en móvil ({isMobileDevice && ...})
                                            //    Cargamos "mucho más atrás" (2 niveles de zoom menos) para dar
                                            //    contexto regional; el usuario amplía con gesto si quiere acercar.
                                            return Math.max(3, baseZoom - 2);
                                        })()}
                                        recenterMode="pan-only"
                                        onServiceSelect={(service: Service) => {
                                            // ✅ Convertir Service a formato esperado por handleServiceSelect
                                            // El servicio ya está en mapServices, así que estará disponible en allServicesCombined
                                            const serviceId = service.id;
                                            handleServiceSelect(serviceId);
                                        }}
                                        selectedServiceId={selectedService}
                                        isMobile={true}
                                        style={{ width: '100%', height: '100%' }}
                                        onMapLoad={onMapReady}
                                        onServicesCountChange={setMapServicesCount}
                                        onServicesChange={setMapServices}
                                        onLoadingChange={handleMapLoadingChange}
                                    />
                                </div>
                                )}
                                
                            {/* CTA lista — visible si el drawer no está expandido del todo */}
                                {formData.latitude && formData.longitude && (
                                <div
                                    className="pointer-events-none absolute inset-x-0 z-[9998] flex justify-center px-4"
                                    style={{
                                        bottom: isDrawerOpen && isDrawerVisible
                                            ? 'calc(env(safe-area-inset-bottom, 0px) + 1rem)'
                                            : 'calc(env(safe-area-inset-bottom, 0px) + 1.25rem)',
                                    }}
                                >
                                    {!isMobileDrawerDeployed && (
                                        <Button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setWasManuallyClosed(false);
                                                setIsDrawerOpen(true);
                                                setIsDrawerVisible(true);
                                                setMobileDrawerSnap(MOBILE_MAP_SNAP_DEPLOYED);
                                            }}
                                            size="lg"
                                            className="pointer-events-auto h-12 rounded-full border-0 bg-brand px-5 text-sm font-semibold text-white shadow-[0_4px_20px_hsl(var(--brand)/0.35)] transition-all hover:bg-brand-hover active:scale-[0.98]"
                                        >
                                            <span className="flex items-center gap-2">
                                                <span>
                                                    {mapServicesCount > 0
                                                        ? `Ver ${mapServicesCount} ${mapServicesCount === 1 ? 'opción' : 'opciones'}`
                                                        : 'Ver lista'}
                                                </span>
                                                <ChevronUp className="h-4 w-4 opacity-90" strokeWidth={2.5} />
                                            </span>
                                        </Button>
                                    )}
                                </div>
                                )}
                </div>
            </div>
                
                
                {/* CustomBottomSheet con Framer Motion en móvil, ResponsiveModal (Dialog) en PC */}
                {isMobileDevice ? (
                    <CustomBottomSheet
                        open={isDrawerOpen && isDrawerVisible}
                        dismissible={false}
                        // ✅ El X de minimizar lo dibuja MapMobileDrawerHeader inline
                        //    en la fila meta (justify-between), no como absolute. Sin esto,
                        //    el X automático se solapaba visualmente con el chip "Valoración".
                        hideCloseButton={true}
                        // ✅ Gesto unificado: secuencial = el dedo siempre lleva al snap
                        // adyacente, sin saltos por velocidad → no se percibe "tramos".
                        snapToSequentialPoint={true}
                        // ✅ 350 ms post-scroll donde el drawer NO se mueve: un scroll
                        //    natural que llega a scrollTop=0 no colapsa el drawer.
                        //    Para colapsar: levantar el dedo y volver a empujar,
                        //    o flick fuerte (Vaul lo evalúa en pointerUp).
                        scrollLockTimeout={350}
                        onOpenChange={(open) => {
                            setIsDrawerOpen(true);
                            setIsDrawerVisible(true);
                            if (open) {
                                setWasManuallyClosed(false);
                                drawerOpenedRef.current = true;
                            }
                        }}
                        onCloseRequest={collapseMobileDrawer}
                        onActiveSnapPointChange={(snap) => {
                            // ✅ Solo actualiza si realmente cambió (evita renders
                            //    concurrentes durante la animación de release de Vaul).
                            setMobileDrawerSnap((prev) => (prev === snap ? prev : snap));
                            if (
                                snap === MOBILE_MAP_SNAP_DEPLOYED ||
                                snap === MOBILE_MAP_SNAP_FULL
                            ) {
                                setWasManuallyClosed(false);
                            }
                        }}
                        snapPoints={MOBILE_MAP_SNAP_POINTS}
                        activeSnapPoint={mobileDrawerSnap}
                        headerContent={
                            <MapMobileDrawerHeader
                                count={services.length}
                                locationLabel={
                                    formData.locationName ||
                                    searchAddress ||
                                    getCountryName(selectedCountry) ||
                                    null
                                }
                                rangeKm={parseInt(formData.locationRange || '25', 10) || 25}
                                sortKey="relevance"
                                priceActive={filters.priceRange[0] > 0 || filters.priceRange[1] < 100000}
                                ratingActive={filters.rating > 0}
                                onOpenSort={() => { /* TODO: BottomSheet de orden */ }}
                                onOpenPrice={() => { /* TODO: BottomSheet de precio */ }}
                                onOpenRating={() => { /* TODO: BottomSheet de valoración */ }}
                                onMinimize={collapseMobileDrawer}
                            />
                        }
                        className="lg:hidden"
                    >
                        {/* Contenido con scroll */}
                        <div ref={drawerContentRef} className={MAP_MOBILE_LIST_CLASS}>
                            {services.length > 0 ? (
                                <div className="space-y-4">
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
                                                    mapCenter={selectedLocation}
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
                                                    <p className="font-display text-sm text-[#6a6a6a]">Cargando más opciones…</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    
                                    {/* ✅ Indicador de fin de lista */}
                                    {!hasNextPage && allServices.length > 0 && (
                                        <div className="py-8 text-center">
                                            <p className="font-display text-sm text-[#6a6a6a]">
                                                Has visto todas las opciones en esta zona
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ) : mapLoading ? (
                                <div className="space-y-4 py-4">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="h-52 animate-pulse rounded-2xl bg-gray-100" />
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-3 py-12 text-center font-display">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand/10">
                                        <MapPin className="h-7 w-7 text-brand" />
                                    </div>
                                    <p className="text-base font-semibold text-[#1c1c1c]">Sin opciones aquí</p>
                                    <p className="max-w-[16rem] text-sm leading-relaxed text-[#6a6a6a]">
                                        Mueve el mapa o elige otra zona para ver más expertos.
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
                                                    <p className="font-display text-sm text-[#6a6a6a]">Cargando más opciones…</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    
                                    {!hasNextPage && allServices.length > 0 && (
                                        <div className="py-8 text-center">
                                            <p className="font-display text-sm text-[#6a6a6a]">
                                                Has visto todas las opciones en esta zona
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