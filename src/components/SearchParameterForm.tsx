import { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo, memo } from 'react';
import { useWindowSize } from '../hooks/useWindowSize';
// 🛡️ Round 28: helper unificado de símbolos de divisa (cubre EUR/USD/GBP/CHF/CAD/SEK/DKK/NOK/PLN/HUF/CZK/BGN/RON).
import { getCurrencySymbol } from '../utils/priceUtils';
import { ArrowRight, ArrowLeft, Search, X, Star, User, Info, MapPin, Award, Zap, Shield, TrendingUp, FileText, Image, Video, Heart, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Check, SlidersHorizontal } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ImageCarousel } from './ui/image-carousel';
import { FavoriteHeart } from './FavoriteHeart';
// useLoadScript ya no es necesario - MapContainer lo maneja internamente
import { useServices } from '../hooks/useServices';
import { useInfiniteServices } from '../hooks/useInfiniteServices';
// useMapExperts ya no es necesario - MapContainer lo maneja internamente
import { useMapMarkers } from '../hooks/useMapMarkers'; // ✅ NUEVO: Marcadores ultra ligeros
// ✅ Default import → activa React.memo del MapContainer. Antes (named import)
//    cualquier re-render de SearchParameterForm forzaba al MapContainer a recorrer
//    su function body, lo que disparaba el efecto de markers (remove+create de TODOS).
import MapContainer from './Map/MapContainer';
import { MapAddressSearchBar, MapAddressSelection } from './MapAddressSearchBar';
import { Service } from '../hooks/useServiceLoader';
import { useAuth } from '../contexts/AuthContext';
import { useServiceFavorites } from '../hooks/useServiceFavorites';
import { toast } from '../lib/toast';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { Input } from './ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose, DrawerOverlay } from './ui/drawer';
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
import { persistHireSearchLocation, readHireSearchLocation, snapshotHireSearchLocation } from '../utils/hireSearchContext';
import {
    clampTutorialDrawerSnap,
    getTutorialDrawerBottomBuffer,
} from '../utils/safeAreaInsets';
import {
    hpTitleUnderlineBarStyle,
    MAP_CARD_BODY_CLASS,
    MAP_CARD_META_LINE_CLASS,
    MAP_CARD_NAME_CLASS,
    MAP_CARD_PRICE_CLASS,
    MAP_CARD_PRICE_SUFFIX_CLASS,
    MAP_CARD_BADGE_CLASS,
    MAP_DESKTOP_GRID_CLASS,
    MAP_DESKTOP_LIST_CELL_CLASS,
    MAP_DESKTOP_LIST_CLASS,
    MAP_DESKTOP_MAP_INNER_CLASS,
    MAP_DESKTOP_MAP_WRAP_CLASS,
    MAP_DESKTOP_PANEL_HEADER_CLASS,
    MAP_DESKTOP_SCROLL_CLASS,
    MAP_DESKTOP_SPLIT_CLASS,
    MAP_MOBILE_LIST_CLASS,
    MAP_MOBILE_LIST_TUTORIAL_CLASS,
    SD_MOBILE_GUTTER_CLASS,
    MAP_CARD_ROW_SHADOW,
    MAP_CARD_ROW_SHADOW_HOVER,
    MAP_CARD_ROW_SHADOW_ACTIVE,
} from '../constants/homepageTypography';
import { HomepageDesktopTopBar } from './HomepageDesktopTopBar';
import { MapResultsSheet } from './MapResultsSheet';
import { getStripPriceFrom, getStripThumbnails, buildStripSummary } from '../utils/mapStripSummary';

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
    /** Persiste la ubicación de búsqueda antes de ir a la ficha. */
    onNavigateToService?: () => void;
    /** 'strip' → tarjeta compacta de la barra inferior (desktop y móvil); 'auto' = según viewport. */
    variant?: 'auto' | 'strip';
}

/** Contorno de selección: borde SÓLIDO de marca, superpuesto (z-20) sobre la foto.
 *  Antes se usaba un degradado azul→ámbar con `mask-composite: xor`, pero esa técnica
 *  no se renderiza en el WebView de Capacitor/Android (el borde no salía en móvil).
 *  Un borde sólido absoluto se ve siempre y no provoca layout shift. */
const MapCardGradientOutline: React.FC = () => (
    <span
        aria-hidden
        className="pointer-events-none absolute inset-0 z-20 rounded-2xl"
        style={{
            border: '2.5px solid #0066CC',
        }}
    />
);

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

const MapServiceCardInner: React.FC<MapServiceCardProps> = ({ service, isSelected, isHovered = false, onSelect, initialIsFavorite = false, mapCenter = null, onNavigateToService, variant = 'auto' }) => {
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
        onNavigateToService?.();
        const returnTo = `${location.pathname}${location.search}`;
        const hireSearchLocation = readHireSearchLocation();
        navigate(`/service/${serviceId}`, {
            state: {
                returnTo,
                ...(hireSearchLocation ? { hireSearchLocation } : {}),
            },
        });
    };
    
    const handleFavoriteClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        
        if (!isAuthenticated) {
            // El flujo de la web es azul → estado `info` (azul de marca), y vía
            // `toast` (shim) para que no lo filtre el surface por defecto.
            toast.info('Inicia sesión para guardar favoritos', { duration: 3000 });
            return;
        }

        try {
            const result = await toggleFavoriteAsync(serviceId);
            setIsFavorite(result.isFavorite);
            // Mismo toast azul que en la homepage (no el verde de `success`).
            if (result.isFavorite) {
                toast.info('Añadido a favoritos', {
                    description: 'Lo tienes guardado en tu lista de favoritos.',
                    action: { label: 'Ver favoritos', onClick: () => navigate('/favoritos') },
                    duration: 3000,
                });
            } else {
                toast.info('Quitado de favoritos', { duration: 2500 });
            }
        } catch (error: any) {
            console.error('Error al actualizar favorito:', error);
            toast.error('No se pudo actualizar el favorito', { duration: 3000 });
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

    // TARJETA COMPACTA fija para la barra inferior (desktop Y móvil, variant="strip"),
    // mismo look que el popover del mapa: foto arriba + avatar/tipo/nombre + ★valoración·distancia y precio.
    if (!isMobile || variant === 'strip') {
        const dist = distanceKm(mapCenter, getServiceCoords(service));
        const distLabel = dist != null && dist >= 0.4 ? formatDistanceKm(dist) : null;
        const ratingNum = service.averageRating || 0;
        return (
            <a
                href={`/service/${serviceId}`}
                onClick={handleCardClick}
                className={`group block ${isMobile ? 'w-[176px]' : 'w-[250px]'} cursor-pointer focus-visible:outline-none`}
                style={{ textDecoration: 'none', color: 'inherit' }}
            >
                <div
                    className={`relative overflow-hidden rounded-2xl bg-white transition-[box-shadow,transform] duration-200 ${
                        isSelected
                            ? 'shadow-[0_12px_32px_rgba(0,102,204,0.24)]'
                            : isHovered
                              ? 'shadow-[0_12px_30px_rgba(16,24,40,0.20)] -translate-y-0.5'
                              : 'shadow-[0_6px_18px_rgba(16,24,40,0.16)]'
                    }`}
                >
                    {/* Contorno de selección: mismo degradado azul→ámbar que la card grande. */}
                    {isSelected && <MapCardGradientOutline />}
                    {/* Imagen */}
                    <div className={`relative ${isMobile ? 'h-[88px]' : 'h-[118px]'} w-full overflow-hidden bg-[#eceff3]`}>
                        {imageUrls.length > 0 ? (
                            <>
                                <img
                                    src={imageUrls[imageIndex]}
                                    alt={service.serviceTypeName || 'Servicio'}
                                    className="h-full w-full object-cover transition-transform duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]"
                                    style={{ display: 'block' }}
                                />
                                {isGuestFavorite && (
                                    <span className="absolute left-2 top-2 z-10 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-semibold text-[#1c1c1c] shadow-sm backdrop-blur-sm">
                                        <Star className="h-2.5 w-2.5 fill-[#F59E0B] text-[#F59E0B]" /> Mejor valorado
                                    </span>
                                )}
                                {hasMultipleImages && (
                                    <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1.5">
                                        {imageUrls.slice(0, 5).map((_, idx) => (
                                            <span
                                                key={idx}
                                                className="h-1.5 w-1.5 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.35)] transition-all duration-300"
                                                style={{ opacity: idx === imageIndex ? 1 : 0.5, transform: idx === imageIndex ? 'scale(1.15)' : 'scale(1)' }}
                                            />
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="flex h-full w-full items-center justify-center bg-[#eceff3]">
                                <span className="text-[12px] text-[#9aa0a6]">Sin imagen</span>
                            </div>
                        )}
                        {isAuthenticated && (
                            <button
                                onClick={handleFavoriteClick}
                                aria-label={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                                className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full transition-transform hover:scale-110"
                            >
                                <FavoriteHeart filled={isFavorite} size={20} variant="on-image" />
                            </button>
                        )}
                    </div>

                    {/* Info */}
                    <div className={`${isMobile ? 'p-2' : 'p-2.5'} font-display`}>
                        <div className={`flex items-center ${isMobile ? 'gap-1.5' : 'gap-2'}`}>
                            <div className={`${isMobile ? 'h-6 w-6' : 'h-7 w-7'} shrink-0 overflow-hidden rounded-full bg-[#f0f0f0] ring-1 ring-white shadow-[0_1px_2px_rgba(0,0,0,0.15)]`}>
                                {service.expert?.profilePictureUrl ? (
                                    <img src={service.expert.profilePictureUrl} alt={expertName} className="h-full w-full object-cover" />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center bg-[#5b6b7e] text-[11px] font-semibold text-white">
                                        {expertName.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-[9.5px] font-semibold uppercase tracking-[0.06em] text-[#8a8a8a]">{serviceTypeLabel}</p>
                                <h3 className={`truncate ${isMobile ? 'text-[12.5px]' : 'text-[14px]'} font-semibold leading-[1.2] tracking-[-0.015em] text-[#1c1c1c]`}>{expertName}</h3>
                            </div>
                        </div>

                        <div className={`${isMobile ? 'mt-1.5' : 'mt-2'} flex items-center justify-between gap-2`}>
                            <span className={`flex min-w-0 items-center gap-1 ${isMobile ? 'text-[11px]' : 'text-[12px]'} leading-none text-[#525252]`}>
                                {ratingNum > 0 ? (
                                    <>
                                        <Star className="h-3.5 w-3.5 shrink-0 fill-[#F59E0B] text-[#F59E0B]" />
                                        <span className="font-semibold tabular-nums text-[#1c1c1c]">{ratingNum.toFixed(1).replace('.', ',')}</span>
                                        {totalReviews > 0 && <span className="tabular-nums text-[#737373]">({totalReviews})</span>}
                                    </>
                                ) : (
                                    <span className="font-medium text-[#737373]">Nuevo</span>
                                )}
                                {(distLabel || cityLabel) && <span className="truncate text-[#737373]">· {distLabel ? `a ${distLabel}` : cityLabel}</span>}
                            </span>
                            <span className="flex shrink-0 items-baseline gap-0.5">
                                <span className={`${isMobile ? 'text-[13.5px]' : 'text-[15px]'} font-semibold leading-none tabular-nums tracking-tight text-[#1c1c1c]`}>{price}</span>
                                <span className="text-[11px] font-normal text-[#737373]">/ serv.</span>
                            </span>
                        </div>
                    </div>
                </div>
            </a>
        );
    }
    
    // Móvil — misma tarjeta elevada (boxed) que desktop.
    return (
        <a
            href={`/service/${serviceId}`}
            onClick={handleCardClick}
            className="group block w-full cursor-pointer active:opacity-95"
            style={{ textDecoration: 'none', color: 'inherit' }}
        >
            <div
                className={`relative w-full overflow-hidden rounded-2xl bg-white transition-shadow duration-200 ${
                    isSelected
                        ? 'shadow-[0_10px_30px_rgba(0,102,204,0.20)]'
                        : 'shadow-[0_1px_2px_rgba(16,24,40,0.06),0_8px_24px_rgba(16,24,40,0.08)]'
                }`}
            >
                {isSelected && <MapCardGradientOutline />}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#eceff3]">
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

                            {/* Badge recomendado (sin badge de selección — el contorno basta). */}
                            {isGuestFavorite && (
                                <div className="absolute left-3 top-3 z-10">
                                    <span className={`${MAP_CARD_BADGE_CLASS} gap-1`} aria-label="Mejor valorado">
                                        <Star className="h-3 w-3 shrink-0 fill-[#F59E0B] text-[#F59E0B]" />
                                        Mejor valorado
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
                                <FavoriteHeart filled={isFavorite} size={24} variant="on-image" />
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
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div
                                            className="flex h-full w-full items-center justify-center"
                                            style={{
                                                backgroundColor: '#5b6b7e',
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
                    cityLabel={cityLabel}
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
        prev.onNavigateToService === next.onNavigateToService &&
        prev.variant === next.variant &&
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
const MOBILE_MAP_SNAP_POINTS: (number | string)[] = [0.20, 0.55, 0.92];
const MOBILE_MAP_SNAP_PEEK = MOBILE_MAP_SNAP_POINTS[0];     // 20% – reposo con card ya elegida
const MOBILE_MAP_SNAP_DEPLOYED = MOBILE_MAP_SNAP_POINTS[1]; // 55% – tutorial al cargar / tras elegir pin
const MOBILE_MAP_SNAP_FULL = MOBILE_MAP_SNAP_POINTS[2];     // 92% – pantalla casi completa
/** Drawer en reposo sin selección — se calcula al vuelo según altura del tutorial. */
const MOBILE_MAP_SNAP_TUTORIAL_FALLBACK = 0.36;

/** Colchón extra por subpíxeles / borde del header del sheet. */
const MOBILE_DRAWER_TUTORIAL_MEASURE_FUDGE_PX = 4;

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

interface MapMobileDrawerHeaderProps {
    count: number;
    locationLabel?: string | null;
    rangeKm?: number;
    awaitingSelection?: boolean;
    headerRef?: React.Ref<HTMLDivElement>;
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
    awaitingSelection = false,
    headerRef,
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
        <div
            ref={headerRef}
            className={`relative px-5 ${awaitingSelection ? 'pt-2 pb-2' : 'pt-2.5 pb-3'}`}
            style={{
                background:
                    'linear-gradient(to right, rgba(0,102,204,0.08) 0%, rgba(245,158,11,0.08) 100%), #ffffff',
            }}
        >
            {/* Handle — afordancia de arrastre */}
            <div className={`flex justify-center ${awaitingSelection ? 'mb-1.5' : 'mb-2.5'}`} aria-hidden>
                <span className="h-1.5 w-11 rounded-full bg-[#b8b8b8]" />
            </div>

            {/* Titular de resultados — mismo tono que desktop */}
            <h2
                className={`font-display font-semibold leading-tight tracking-[-0.01em] text-[#222222] ${
                    awaitingSelection ? 'text-[15px]' : 'text-[16px]'
                }`}
            >
                {count} {count === 1 ? 'experto disponible' : 'expertos disponibles'}
                {locationLabel ? (
                    <span className="font-normal text-[#717171]"> en {locationLabel}</span>
                ) : null}
            </h2>
            <p className="mt-0.5 font-display text-[12px] font-normal leading-snug text-[#8a8a8a]">
                {awaitingSelection
                    ? 'Toca una etiqueta de precio en el mapa'
                    : `En un radio de ~${rangeKm} km · desliza para ver la lista`}
            </p>
        </div>
    );
}

/** Tutorial en el drawer antes de elegir un experto en el mapa. */
function MapMobileSelectTutorial() {
    return (
        <div className="flex flex-col items-center px-1 pb-0.5 pt-0 text-center">
            <div
                className="relative mx-auto mb-2 h-[96px] w-full max-w-[240px] overflow-hidden rounded-xl bg-white ring-1 ring-[#d4d4d4] shadow-[0_2px_10px_rgba(15,23,42,0.10)]"
                aria-hidden
            >
                <div
                    className="absolute inset-0 opacity-95"
                    style={{
                        background:
                            'radial-gradient(ellipse 85% 70% at 58% 42%, #ebe8e3 0%, #e8e4dc 38%, transparent 72%), radial-gradient(ellipse 55% 45% at 22% 68%, #d4e8c8 0%, transparent 62%), linear-gradient(180deg, #e8f0f6 0%, #dde8f0 100%)',
                    }}
                />
                <div className="absolute left-[18%] top-[22%] h-2 w-2 rounded-full bg-brand/25" />
                <div className="absolute right-[24%] top-[34%] h-1.5 w-1.5 rounded-full bg-[#F59E0B]/35" />
                <div className="absolute bottom-[28%] left-[32%] h-1.5 w-1.5 rounded-full bg-brand/20" />

                <div className="absolute left-1/2 top-[36%] -translate-x-1/2">
                    <div className="relative inline-flex">
                        <span className="map-tutorial-price-label inline-flex items-center justify-center rounded-full border border-[#d9d9d9] bg-white px-3 py-1 font-display text-[12px] font-bold tabular-nums text-[#1c1c1c] shadow-[0_1px_2px_rgba(0,0,0,0.12),0_2px_5px_rgba(0,0,0,0.08)]">
                            €69
                        </span>

                        <span className="map-tutorial-click-ring pointer-events-none absolute left-1/2 top-1/2 h-8 w-[3.75rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-brand/25" />

                        <div
                            className="map-tutorial-cursor pointer-events-none absolute left-1/2 top-1/2 z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.18)]"
                            style={{ marginLeft: -5.5, marginTop: -3 }}
                        >
                            <svg width="24" height="24" viewBox="0 0 28 28" fill="none" aria-hidden className="block h-6 w-6">
                                <path
                                    d="M6.5 3.5L6.5 22.5L11.2 17.8L15.2 24.5L18.5 22.8L14.5 16.1L21.5 15.5L6.5 3.5Z"
                                    fill="#ffffff"
                                    stroke="#1c1c1c"
                                    strokeWidth="1.25"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            <p className="font-display text-[14px] font-semibold tracking-[-0.01em] text-[#1c1c1c]">
                Elige un experto en el mapa
            </p>
            <p className="mt-1 max-w-[15rem] text-xs leading-snug text-[#6a6a6a]">
                Pulsa una etiqueta de precio para ver su ficha.
            </p>

            <style>{`
                /* Punta del cursor anclada al centro del label vía margin negativo en el nodo. */
                @keyframes map-tutorial-cursor-tap {
                    0%, 18%, 100% { transform: translate(12px, 10px) scale(1); }
                    28% { transform: translate(0, 0) scale(0.92); }
                    36% { transform: translate(0, 0) scale(1); }
                }
                @keyframes map-tutorial-label-select {
                    0%, 24%, 100% {
                        background: #ffffff;
                        color: #1c1c1c;
                        border-color: #d9d9d9;
                        box-shadow: 0 1px 2px rgba(0,0,0,0.12), 0 2px 5px rgba(0,0,0,0.08);
                        transform: scale(1);
                    }
                    32%, 44% {
                        background: hsl(var(--brand));
                        color: #ffffff;
                        border-color: transparent;
                        box-shadow: 0 3px 10px rgba(0,0,0,0.22), 0 1px 3px rgba(0,0,0,0.14);
                        transform: scale(1.04);
                    }
                }
                @keyframes map-tutorial-click-ring {
                    0%, 26%, 100% { opacity: 0; transform: translate(-50%, -50%) scale(0.85); }
                    32% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                    44% { opacity: 0; transform: translate(-50%, -50%) scale(1.15); }
                }
                .map-tutorial-cursor {
                    animation: map-tutorial-cursor-tap 2.4s ease-in-out infinite;
                }
                .map-tutorial-price-label {
                    animation: map-tutorial-label-select 2.4s ease-in-out infinite;
                }
                .map-tutorial-click-ring {
                    animation: map-tutorial-click-ring 2.4s ease-in-out infinite;
                }
            `}</style>
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
type MapSortKey = 'relevance' | 'distance' | 'price_asc' | 'price_desc' | 'rating';

const MAP_SORT_OPTIONS: { key: MapSortKey; label: string }[] = [
    { key: 'relevance', label: 'Relevancia' },
    { key: 'distance', label: 'Distancia' },
    { key: 'price_asc', label: 'Precio: de menor a mayor' },
    { key: 'price_desc', label: 'Precio: de mayor a menor' },
    { key: 'rating', label: 'Mejor valorados' },
];

const MAP_RATING_OPTIONS: { value: number; label: string }[] = [
    { value: 0, label: 'Todas' },
    { value: 4.0, label: '4,0 o más' },
    { value: 4.5, label: '4,5 o más' },
    { value: 4.8, label: '4,8 o más' },
];

function getNextSearchRadiusKm(current: number): number {
    const km = current || 25;
    return Math.min(200, km < 25 ? 25 : km < 50 ? 50 : km < 100 ? 100 : 200);
}

const MAP_STRIP_FILTER_CLASS =
    'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-white/80 bg-white px-3 font-display text-[12px] font-semibold text-[#1c1c1c] shadow-[0_2px_10px_rgba(0,0,0,0.28),0_1px_3px_rgba(0,0,0,0.14)] transition-[box-shadow,background] hover:bg-white hover:shadow-[0_4px_14px_rgba(0,0,0,0.32)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 md:h-9 md:px-3.5 md:text-[13px]';
const MAP_STRIP_FILTER_ACTIVE_CLASS =
    'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-[#1c1c1c] bg-[#1c1c1c] px-3 font-display text-[12px] font-semibold text-white shadow-[0_3px_12px_rgba(0,0,0,0.38),0_1px_4px_rgba(0,0,0,0.2)] transition-[box-shadow,background] hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 md:h-9 md:px-3.5 md:text-[13px]';

const MAP_STRIP_OVERLAY_GRADIENT_CLASS =
    'pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 via-black/28 to-transparent pt-24';

const MAP_STRIP_ARROW_BTN_CLASS =
    'pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full border border-white/90 bg-white text-[#222222] shadow-[0_2px_10px_rgba(0,0,0,0.28),0_1px_3px_rgba(0,0,0,0.14)] transition-all hover:shadow-[0_4px_14px_rgba(0,0,0,0.34)] disabled:cursor-not-allowed disabled:opacity-35 md:h-9 md:w-9';

/** Filtros de orden/valoración/precio — píldoras sólidas (mismo contraste que homepage). */
function MapStripFilterControls({
    sortBy,
    onSort,
    minRating,
    onMinRating,
    priceRange,
    onPriceRange,
    priceMax,
    hideRating = false,
    isMobile = false,
}: {
    sortBy: MapSortKey;
    onSort: (k: MapSortKey) => void;
    minRating: number;
    onMinRating: (r: number) => void;
    priceRange: [number, number];
    onPriceRange: (r: [number, number]) => void;
    priceMax: number;
    hideRating?: boolean;
    isMobile?: boolean;
}) {
    const sortLabel = MAP_SORT_OPTIONS.find((o) => o.key === sortBy)?.label ?? 'Relevancia';
    const ratingActive = minRating > 0;
    const priceActive = priceRange[0] > 0 || priceRange[1] < priceMax;
    const trig = (active: boolean) => (active ? MAP_STRIP_FILTER_ACTIVE_CLASS : MAP_STRIP_FILTER_CLASS);

    // 📱 Móvil: los Popover anclados a las píldoras flotaban encima del mapa y
    //    quedaban mal (el slider de precio sobre todo). Usamos bottom sheets (Drawer)
    //    de Vaul, que es el patrón correcto en móvil: panel anclado abajo, ancho
    //    completo, targets grandes. Desktop conserva los Popover.
    if (isMobile) {
        return (
            <div className="flex flex-nowrap items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {/* Ordenar */}
                <Drawer shouldScaleBackground={false}>
                    <DrawerTrigger asChild>
                        <button type="button" className={trig(sortBy !== 'relevance')}>
                            <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
                            {sortLabel}
                            <ChevronDown className="h-3.5 w-3.5 opacity-70" aria-hidden />
                        </button>
                    </DrawerTrigger>
                    <DrawerContent
                        className="px-0 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)]"
                        style={{ zIndex: 10001 }}
                    >
                        <div className="px-5 pb-1 pt-1">
                            <h3 className="font-display text-[16px] font-semibold tracking-[-0.01em] text-[#1c1c1c]">
                                Ordenar por
                            </h3>
                        </div>
                        <div className="px-2 pb-1">
                            {MAP_SORT_OPTIONS.map((o) => (
                                <DrawerClose asChild key={o.key}>
                                    <button
                                        type="button"
                                        onClick={() => onSort(o.key)}
                                        className="flex w-full items-center justify-between gap-2 rounded-xl px-4 py-3.5 text-left font-display text-[15px] font-medium text-[#1c1c1c] active:bg-[#f5f5f5]"
                                    >
                                        {o.label}
                                        {sortBy === o.key && <Check className="h-5 w-5 shrink-0 text-brand" aria-hidden />}
                                    </button>
                                </DrawerClose>
                            ))}
                        </div>
                    </DrawerContent>
                </Drawer>

                {!hideRating && (
                    <Drawer shouldScaleBackground={false}>
                        <DrawerTrigger asChild>
                            <button type="button" className={trig(ratingActive)}>
                                <Star className={`h-3.5 w-3.5 ${ratingActive ? 'fill-current' : 'fill-[#F59E0B] text-[#F59E0B]'}`} aria-hidden />
                                {ratingActive ? `${minRating.toFixed(1).replace('.', ',')}+` : 'Valoración'}
                                <ChevronDown className="h-3.5 w-3.5 opacity-70" aria-hidden />
                            </button>
                        </DrawerTrigger>
                        <DrawerContent
                            className="px-0 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)]"
                            style={{ zIndex: 10001 }}
                        >
                            <div className="px-5 pb-1 pt-1">
                                <h3 className="font-display text-[16px] font-semibold tracking-[-0.01em] text-[#1c1c1c]">
                                    Valoración mínima
                                </h3>
                            </div>
                            <div className="px-2 pb-1">
                                {MAP_RATING_OPTIONS.map((o) => (
                                    <DrawerClose asChild key={o.value}>
                                        <button
                                            type="button"
                                            onClick={() => onMinRating(o.value)}
                                            className="flex w-full items-center justify-between gap-2 rounded-xl px-4 py-3.5 text-left font-display text-[15px] font-medium text-[#1c1c1c] active:bg-[#f5f5f5]"
                                        >
                                            {o.label}
                                            {minRating === o.value && <Check className="h-5 w-5 shrink-0 text-brand" aria-hidden />}
                                        </button>
                                    </DrawerClose>
                                ))}
                            </div>
                        </DrawerContent>
                    </Drawer>
                )}

                {/* Precio */}
                <Drawer shouldScaleBackground={false}>
                    <DrawerTrigger asChild>
                        <button type="button" className={trig(priceActive)}>
                            {priceActive ? `${priceRange[0]} – ${priceRange[1]} €` : 'Precio'}
                            <ChevronDown className="h-3.5 w-3.5 opacity-70" aria-hidden />
                        </button>
                    </DrawerTrigger>
                    <DrawerContent
                        className="px-5 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)]"
                        style={{ zIndex: 10001 }}
                    >
                        <div className="flex items-center justify-between pb-1 pt-1">
                            <h3 className="font-display text-[16px] font-semibold tracking-[-0.01em] text-[#1c1c1c]">
                                Precio por servicio
                            </h3>
                            {priceActive && (
                                <button
                                    type="button"
                                    onClick={() => onPriceRange([0, priceMax])}
                                    className="font-display text-[13px] font-semibold text-brand"
                                >
                                    Quitar
                                </button>
                            )}
                        </div>
                        <Slider
                            value={[priceRange[0], priceRange[1]]}
                            min={0}
                            max={priceMax}
                            step={5}
                            onValueChange={(v: number[]) => onPriceRange([v[0], v[1]] as [number, number])}
                            className="my-4"
                        />
                        <div className="flex items-center justify-between font-display text-[14px] font-medium tabular-nums text-[#525252]">
                            <span>{priceRange[0]} €</span>
                            <span>{priceRange[1] >= priceMax ? `${priceMax}+ €` : `${priceRange[1]} €`}</span>
                        </div>
                        <DrawerClose asChild>
                            <button
                                type="button"
                                className="mt-5 w-full rounded-full bg-brand py-3 font-display text-[15px] font-semibold text-white active:bg-brand-hover"
                            >
                                Ver resultados
                            </button>
                        </DrawerClose>
                    </DrawerContent>
                </Drawer>
            </div>
        );
    }

    return (
        <div className="flex flex-nowrap items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <Popover>
                    <PopoverTrigger asChild>
                        <button type="button" className={trig(sortBy !== 'relevance')}>
                            <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
                            <span className="hidden xl:inline">Ordenar:</span> {sortLabel}
                            <ChevronDown className="h-3.5 w-3.5 opacity-70" aria-hidden />
                        </button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-60 p-1.5 font-display">
                        {MAP_SORT_OPTIONS.map((o) => (
                            <button
                                key={o.key}
                                type="button"
                                onClick={() => onSort(o.key)}
                                className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-[13px] font-medium text-[#1c1c1c] transition-colors hover:bg-[#f5f5f5]"
                            >
                                {o.label}
                                {sortBy === o.key && <Check className="h-4 w-4 shrink-0 text-brand" aria-hidden />}
                            </button>
                        ))}
                    </PopoverContent>
                </Popover>

                {!hideRating && (
                <Popover>
                    <PopoverTrigger asChild>
                        <button type="button" className={trig(ratingActive)}>
                            <Star className={`h-3.5 w-3.5 ${ratingActive ? 'fill-current' : 'fill-[#F59E0B] text-[#F59E0B]'}`} aria-hidden />
                            {ratingActive ? `${minRating.toFixed(1).replace('.', ',')}+` : 'Valoración'}
                            <ChevronDown className="h-3.5 w-3.5 opacity-70" aria-hidden />
                        </button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-52 p-1.5 font-display">
                        {MAP_RATING_OPTIONS.map((o) => (
                            <button
                                key={o.value}
                                type="button"
                                onClick={() => onMinRating(o.value)}
                                className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-[13px] font-medium text-[#1c1c1c] transition-colors hover:bg-[#f5f5f5]"
                            >
                                {o.label}
                                {minRating === o.value && <Check className="h-4 w-4 shrink-0 text-brand" aria-hidden />}
                            </button>
                        ))}
                    </PopoverContent>
                </Popover>
                )}

                {/* Precio */}
                <Popover>
                    <PopoverTrigger asChild>
                        <button type="button" className={trig(priceActive)}>
                            {priceActive ? `${priceRange[0]} – ${priceRange[1]} €` : 'Precio'}
                            <ChevronDown className="h-3.5 w-3.5 opacity-70" aria-hidden />
                        </button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-72 p-4 font-display">
                        <div className="mb-3 flex items-center justify-between">
                            <span className="text-[13px] font-semibold text-[#1c1c1c]">Precio por servicio</span>
                            {priceActive && (
                                <button type="button" onClick={() => onPriceRange([0, priceMax])} className="text-[12px] font-semibold text-brand hover:underline">
                                    Quitar
                                </button>
                            )}
                        </div>
                        <Slider
                            value={[priceRange[0], priceRange[1]]}
                            min={0}
                            max={priceMax}
                            step={5}
                            onValueChange={(v: number[]) => onPriceRange([v[0], v[1]] as [number, number])}
                            className="my-2"
                        />
                        <div className="mt-3 flex items-center justify-between text-[13px] font-medium tabular-nums text-[#525252]">
                            <span>{priceRange[0]} €</span>
                            <span>{priceRange[1] >= priceMax ? `${priceMax}+ €` : `${priceRange[1]} €`}</span>
                        </div>
                    </PopoverContent>
                </Popover>
        </div>
    );
}

function MapStripNavArrows({
    canScrollLeft,
    canScrollRight,
    onScroll,
}: {
    canScrollLeft: boolean;
    canScrollRight: boolean;
    onScroll: (direction: 'left' | 'right') => void;
}) {
    return (
        <div className="flex shrink-0 items-center gap-1.5 md:gap-2">
            <button
                type="button"
                onClick={() => onScroll('left')}
                disabled={!canScrollLeft}
                className={MAP_STRIP_ARROW_BTN_CLASS}
                aria-label="Ver expertos anteriores"
            >
                <ChevronLeft className="h-4 w-4" strokeWidth={2.5} aria-hidden />
            </button>
            <button
                type="button"
                onClick={() => onScroll('right')}
                disabled={!canScrollRight}
                className={MAP_STRIP_ARROW_BTN_CLASS}
                aria-label="Ver más expertos"
            >
                <ChevronRight className="h-4 w-4" strokeWidth={2.5} aria-hidden />
            </button>
        </div>
    );
}

/** Cabecera sobre el carrusel — patrón HomepageWall: título izq + flechas der + filtros. */
function MapStripOverlayChrome({
    resultCount,
    sortBy,
    onSort,
    minRating,
    onMinRating,
    priceRange,
    onPriceRange,
    priceMax,
    canScrollLeft,
    canScrollRight,
    onScroll,
    hideRating = false,
    isLoading = false,
    rangeKm = 25,
    onExpandRadius,
    isMobile = false,
}: {
    resultCount: number;
    sortBy: MapSortKey;
    onSort: (k: MapSortKey) => void;
    minRating: number;
    onMinRating: (r: number) => void;
    priceRange: [number, number];
    onPriceRange: (r: [number, number]) => void;
    priceMax: number;
    canScrollLeft: boolean;
    canScrollRight: boolean;
    onScroll: (direction: 'left' | 'right') => void;
    hideRating?: boolean;
    isLoading?: boolean;
    rangeKm?: number;
    onExpandRadius?: () => void;
    isMobile?: boolean;
}) {
    const isEmpty = resultCount === 0 && !isLoading;
    const nextRadiusKm = getNextSearchRadiusKm(rangeKm);
    const canExpandRadius = nextRadiusKm !== rangeKm;

    return (
        <div className="mb-2 md:mb-3">
            <div className="mb-2 flex items-center justify-between gap-3 md:gap-4">
                <div className="min-w-0 flex-1">
                    <h2 className="truncate font-display text-[1.125rem] font-semibold leading-[1.25] tracking-[-0.01em] text-white md:text-[1.25rem] md:leading-[1.3]">
                        {resultCount} {resultCount === 1 ? 'experto disponible' : 'expertos disponibles'}
                    </h2>
                </div>
                {resultCount > 0 ? (
                    <MapStripNavArrows
                        canScrollLeft={canScrollLeft}
                        canScrollRight={canScrollRight}
                        onScroll={onScroll}
                    />
                ) : null}
            </div>
            <MapStripFilterControls
                sortBy={sortBy}
                onSort={onSort}
                minRating={minRating}
                onMinRating={onMinRating}
                priceRange={priceRange}
                onPriceRange={onPriceRange}
                priceMax={priceMax}
                hideRating={hideRating}
                isMobile={isMobile}
            />
            {isEmpty && (
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
                    <p className="text-[13px] font-medium leading-snug text-white/90">
                        Prueba ampliando el radio de búsqueda.
                    </p>
                    {canExpandRadius && onExpandRadius ? (
                        <button
                            type="button"
                            onClick={onExpandRadius}
                            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-brand px-3.5 py-1.5 font-display text-[12.5px] font-semibold text-white shadow-[0_2px_10px_rgba(0,102,204,0.35)] transition-colors hover:bg-brand-hover md:text-[13px]"
                        >
                            <Search className="h-3.5 w-3.5" aria-hidden />
                            Ampliar a ~{nextRadiusKm} km
                        </button>
                    ) : null}
                </div>
            )}
        </div>
    );
}

function useMapStripScroll(itemCount: number) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const checkScroll = useCallback(() => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setCanScrollLeft(scrollLeft > 0);
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
        }
    }, []);

    useEffect(() => {
        checkScroll();
        const scrollElement = scrollRef.current;
        if (!scrollElement) return;

        let rafId: number | null = null;
        let lastScrollTime = 0;
        const THROTTLE_MS = 16;

        const throttledCheckScroll = () => {
            const now = performance.now();
            if (now - lastScrollTime >= THROTTLE_MS) {
                lastScrollTime = now;
                if (rafId === null) {
                    rafId = requestAnimationFrame(() => {
                        checkScroll();
                        rafId = null;
                    });
                }
            }
        };

        scrollElement.addEventListener('scroll', throttledCheckScroll, { passive: true });
        const resizeObserver = new ResizeObserver(() => checkScroll());
        resizeObserver.observe(scrollElement);
        window.addEventListener('resize', checkScroll);

        return () => {
            if (rafId !== null) cancelAnimationFrame(rafId);
            scrollElement.removeEventListener('scroll', throttledCheckScroll);
            resizeObserver.disconnect();
            window.removeEventListener('resize', checkScroll);
        };
    }, [checkScroll, itemCount]);

    const scroll = useCallback((direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = window.innerWidth >= 768 ? 392 : 300;
            requestAnimationFrame(() => {
                scrollRef.current?.scrollBy({
                    left: direction === 'right' ? scrollAmount : -scrollAmount,
                    behavior: 'smooth',
                });
            });
        }
    }, []);

    return { scrollRef, canScrollLeft, canScrollRight, scroll };
}

function MapDesktopPanelHeader({
    hasLocation,
    expertCount,
    locationLabel,
    rangeKm,
}: {
    hasLocation: boolean;
    expertCount?: number;
    locationLabel?: string;
    rangeKm?: number;
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
            <h2 className="font-display text-[17px] font-semibold leading-tight tracking-[-0.015em] text-[#222222]">
                {typeof expertCount === 'number'
                    ? `${expertCount} ${expertCount === 1 ? 'experto disponible' : 'expertos disponibles'}`
                    : 'Expertos disponibles'}
                {locationLabel ? (
                    <span className="font-normal text-[#717171]"> en {locationLabel}</span>
                ) : null}
            </h2>
            {rangeKm ? (
                <p className="mt-1 font-display text-[13px] font-normal leading-snug text-[#717171]">
                    En un radio de ~{rangeKm} km · toca un experto para verlo en el mapa
                </p>
            ) : null}
        </header>
    );
}

type MapServiceCardInfoProps = {
    serviceTypeLabel: string;
    expertName: string;
    cityLabel: string | null;
    averageRating: number;
    totalReviews: number;
    price: string;
    priceWasConverted: boolean;
    priceSourceFormatted: string;
};

function MapServiceCardInfo({
    serviceTypeLabel,
    expertName,
    cityLabel,
    averageRating,
    totalReviews,
    price,
    priceWasConverted,
    priceSourceFormatted,
}: MapServiceCardInfoProps) {
    // Meta: "Tipo de servicio · Ciudad" (como en la vista previa elegida).
    const metaLine = [serviceTypeLabel, cityLabel].filter(Boolean).join(' · ');
    return (
        <div className={MAP_CARD_BODY_CLASS}>
            <div className="flex items-baseline justify-between gap-2">
                <h3 className={MAP_CARD_NAME_CLASS}>{expertName}</h3>
                {averageRating > 0 ? (
                    <span className="flex shrink-0 items-center gap-1 text-[13px] leading-5 text-[#222222]">
                        <Star className="h-3.5 w-3.5 fill-[#F59E0B] text-[#F59E0B]" />
                        <span className="font-semibold tabular-nums">
                            {averageRating.toFixed(1).replace('.', ',')}
                        </span>
                        {totalReviews > 0 && (
                            <span className="font-normal text-[#717171] tabular-nums">({totalReviews})</span>
                        )}
                    </span>
                ) : (
                    <span className="shrink-0 text-[12px] font-medium text-[#717171]">Nuevo</span>
                )}
            </div>
            {metaLine && <p className={MAP_CARD_META_LINE_CLASS}>{metaLine}</p>}
            <div className="mt-2 flex items-baseline gap-1">
                <span className={MAP_CARD_PRICE_CLASS}>{price}</span>
                {priceWasConverted && priceSourceFormatted && (
                    <span className="text-xs font-normal text-[#717171]">{priceSourceFormatted}</span>
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
                persistHireSearchLocation({
                    locationName: getCountryName(selectedCountry) || 'Ubicación seleccionada',
                    latitude: countryCoords.lat.toString(),
                    longitude: countryCoords.lng.toString(),
                });
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
    const [mapRefreshing, setMapRefreshing] = useState(false);

    const handleMapLoadingChange = useCallback(
        (state: { loading: boolean; isInitialLoading: boolean; isRefreshing: boolean }) => {
            setMapLoading(state.isInitialLoading);
            setMapRefreshing(state.isRefreshing);
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
        MOBILE_MAP_SNAP_TUTORIAL_FALLBACK,
    );
    const [tutorialSnapFraction, setTutorialSnapFraction] = useState(MOBILE_MAP_SNAP_TUTORIAL_FALLBACK);
    const mobileDrawerHeaderRef = useRef<HTMLDivElement>(null);
    const tutorialContentRef = useRef<HTMLDivElement>(null);

    const recomputeTutorialDrawerSnap = useCallback(() => {
        const header = mobileDrawerHeaderRef.current;
        const content = tutorialContentRef.current;
        const viewportH = window.innerHeight;
        if (!header || !content || viewportH <= 0) return;
        const totalPx =
            header.offsetHeight +
            content.offsetHeight +
            getTutorialDrawerBottomBuffer(viewportH) +
            MOBILE_DRAWER_TUTORIAL_MEASURE_FUDGE_PX;
        setTutorialSnapFraction(clampTutorialDrawerSnap(totalPx, viewportH));
    }, []);

    const mobileDrawerSnapPoints = useMemo(() => {
        if (selectedService) return MOBILE_MAP_SNAP_POINTS;
        // Tutorial: solo peek (bajar) y altura calculada del contenido (tope máximo).
        return [MOBILE_MAP_SNAP_PEEK, tutorialSnapFraction];
    }, [selectedService, tutorialSnapFraction]);

    useLayoutEffect(() => {
        if (!isMobileDevice || selectedService) return;

        const measure = () => recomputeTutorialDrawerSnap();
        measure();
        const raf = requestAnimationFrame(() => requestAnimationFrame(measure));

        const targets = [mobileDrawerHeaderRef.current, tutorialContentRef.current].filter(
            Boolean,
        ) as HTMLElement[];
        const observer = new ResizeObserver(measure);
        targets.forEach((el) => observer.observe(el));
        window.addEventListener('resize', measure);
        window.visualViewport?.addEventListener('resize', measure);

        return () => {
            cancelAnimationFrame(raf);
            observer.disconnect();
            window.removeEventListener('resize', measure);
            window.visualViewport?.removeEventListener('resize', measure);
        };
    }, [isMobileDevice, selectedService, recomputeTutorialDrawerSnap, mapLoading, mapServicesCount]);

    useEffect(() => {
        if (!isMobileDevice || selectedService) return;
        setMobileDrawerSnap((prev) => {
            if (prev == null) return tutorialSnapFraction;
            const prevFrac = Number(prev);
            if (prevFrac > tutorialSnapFraction + 0.001) return tutorialSnapFraction;
            return prev;
        });
    }, [isMobileDevice, selectedService, tutorialSnapFraction]);

    useEffect(() => {
        if (!isMobileDevice || selectedService || wasManuallyClosed) return;
        setMobileDrawerSnap(tutorialSnapFraction);
    }, [isMobileDevice, selectedService, wasManuallyClosed, tutorialSnapFraction]);

    const isMobileDrawerDeployed =
        mobileDrawerSnap === MOBILE_MAP_SNAP_DEPLOYED || mobileDrawerSnap === MOBILE_MAP_SNAP_FULL;

    // ✅ Eliminada lógica de scroll personalizada - Vaul maneja todo nativamente con gestos suaves
    
    const [filters, setFilters] = useState({
        priceRange: [0, 100000] as [number, number], // [min, max] en euros - rango amplio para servicios premium
        rating: 0 as number, // Mínimo de estrellas (0-5)
    });
    // Orden de la lista desktop (cliente). 'relevance' = orden del backend (selección primero).
    const [sortBy, setSortBy] = useState<MapSortKey>('relevance');
    // Panel inferior móvil plegable: arranca plegado para dejar ver el mapa.
    const [stripExpanded, setStripExpanded] = useState(false);

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
            (isMobileDevice ? isMobileDrawerDeployed : true) &&
            // ✅ FALLBACK-ONLY: `allServicesCombined` (más abajo) PRIORIZA `mapServices`
            //    (viewport del mapa) y DESCARTA lo que devuelve este hook cuando el mapa
            //    tiene resultados. Sin este gate, cada cambio de filtro disparaba una
            //    segunda llamada a /SearchService/map-experts EN PARALELO con la del mapa
            //    cuya respuesta se tiraba → llamada duplicada. Ahora solo pedimos los
            //    servicios por radio cuando el mapa no devuelve nada (fallback real).
            mapServices.length === 0,
    });
   
    // ✅ Dispara `onServicesReady` cuando termina la carga del listado Y del mapa.
    //    Evita mostrar el drawer con "Sin opciones aquí" antes de que lleguen los pins.
    const servicesReadyFiredRef = useRef(false);
    useEffect(() => {
        if (servicesReadyFiredRef.current) return;
        const hasParams = !!(debouncedParams.categoryId && debouncedParams.serviceTypeId && debouncedParams.latitude && debouncedParams.longitude);
        if (!hasParams) return;
        if (!isLoadingServices && !mapLoading) {
            servicesReadyFiredRef.current = true;
            onServicesReady?.();
        }
    }, [isLoadingServices, mapLoading, debouncedParams.categoryId, debouncedParams.serviceTypeId, debouncedParams.latitude, debouncedParams.longitude, onServicesReady]);

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

    // Tope de precio para el slider del filtro: el más caro cargado, redondeado a la decena.
    const priceMax = useMemo(() => {
        const prices = allServicesCombined
            .map((s) => Number(s.price ?? (s as any).Price ?? 0))
            .filter((p) => p > 0);
        if (prices.length === 0) return 1000;
        return Math.max(50, Math.ceil(Math.max(...prices) / 10) * 10);
    }, [allServicesCombined]);

    // Lista DESKTOP: aplica el orden elegido sobre `services` (ya filtrado por precio/valoración)
    // y mantiene el seleccionado al principio (estilo Airbnb).
    const displayedServices = useMemo(() => {
        const arr = [...services];
        const dist = (s: any) => distanceKm(selectedLocation, getServiceCoords(s)) ?? Infinity;
        if (sortBy === 'price_asc') arr.sort((a, b) => (a.price || 0) - (b.price || 0));
        else if (sortBy === 'price_desc') arr.sort((a, b) => (b.price || 0) - (a.price || 0));
        else if (sortBy === 'rating') arr.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
        else if (sortBy === 'distance') arr.sort((a, b) => dist(a) - dist(b));
        if (selectedService) {
            const i = arr.findIndex((s) => (s.id || (s as any).Id) === selectedService);
            if (i > 0) {
                const [sel] = arr.splice(i, 1);
                arr.unshift(sel);
            }
        }
        return arr;
    }, [services, sortBy, selectedService, selectedLocation]);

    // Props para el asa de la franja plegable (móvil): recuento, miniaturas y línea resumen.
    const stripBarProps = useMemo(() => {
        const sortLabel = MAP_SORT_OPTIONS.find((o) => o.key === sortBy)?.label ?? 'Relevancia';
        const priceFrom = getStripPriceFrom(displayedServices as any);
        return {
            count: displayedServices.length,
            thumbnails: getStripThumbnails(displayedServices as any, 3),
            summary: buildStripSummary({ sortLabel, isDefaultSort: sortBy === 'relevance', priceFrom }),
        };
    }, [displayedServices, sortBy]);

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
        setMobileDrawerSnap(tutorialSnapFraction);
        setIsDrawerOpen(true);
        setIsDrawerVisible(true);
    }, [tutorialSnapFraction]);

    // Móvil: montar el drawer la primera vez en posición de reposo.
    // ❌ NO depender de formData.latitude/longitude: re-disparaba el setSnap
    //    cuando el mapa se movía bajo el dedo, interrumpiendo el gesto del drawer.
    const drawerMountedRef = useRef(false);
    useEffect(() => {
        if (!isMobileDevice) return;
        setIsDrawerOpen(true);
        setIsDrawerVisible(true);
        if (!drawerMountedRef.current && !wasManuallyClosed) {
            setMobileDrawerSnap(tutorialSnapFraction);
            drawerMountedRef.current = true;
        }
    }, [isMobileDevice, wasManuallyClosed, tutorialSnapFraction]);

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

        const persistedName =
            locationName ||
            (address ? extractCityAndPostalCode(address) : '') ||
            'Ubicación seleccionada';
        persistHireSearchLocation({
            locationName: persistedName,
            latitude: newLocation.lat.toString(),
            longitude: newLocation.lng.toString(),
        });
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
    // Refs y scroll del carrusel inferior de expertos (desktop y móvil)
    const desktopStripScroll = useMapStripScroll(displayedServices.length);
    const mobileStripScroll = useMapStripScroll(displayedServices.length);

    const persistCurrentSearchLocation = useCallback(() => {
        const locationName = (formData.locationName || searchAddress || '').trim();
        const latitude = selectedLocation?.lat.toString() || formData.latitude || null;
        const longitude = selectedLocation?.lng.toString() || formData.longitude || null;
        const snapshot = snapshotHireSearchLocation(
            locationName || 'Ubicación seleccionada',
            latitude,
            longitude,
        );
        if (snapshot) persistHireSearchLocation(snapshot);
    }, [formData.locationName, formData.latitude, formData.longitude, searchAddress, selectedLocation]);

    const handleExpandSearchRadius = useCallback(() => {
        const current = parseInt(formData.locationRange || '25', 10) || 25;
        const next = getNextSearchRadiusKm(current);
        if (next !== current) setFormData((prev) => ({ ...prev, locationRange: String(next) }));
    }, [formData.locationRange]);

    // Barra de direcciones: al elegir un resultado, sincronizamos país (si cambia) y
    // recentramos el mapa vía updateLocationAndMap (setea selectedLocation → MapContainer
    // hace easeTo). recenterMode="pan-only" mantiene el zoom amplio inicial.
    const handleAddressSearchSelect = useCallback((selection: MapAddressSelection) => {
        if (!Number.isFinite(selection.lat) || !Number.isFinite(selection.lng)) return;
        if (selection.countryCode && selection.countryCode !== selectedCountry.toLowerCase()) {
            setSelectedCountry(selection.countryCode);
        }
        updateLocationAndMap({ lat: selection.lat, lng: selection.lng }, selection.address);
    }, [selectedCountry]);

    useEffect(() => {
        if (!formData.latitude || !formData.longitude) return;
        persistCurrentSearchLocation();
    }, [formData.latitude, formData.longitude, formData.locationName, searchAddress, persistCurrentSearchLocation]);
    
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
            setStripExpanded(true); // auto-expandir la franja plegable al tocar un pin
        }
        
        // ✅ Centrar la card seleccionada en el carrusel horizontal (desktop y móvil)
        const stripRef = isMobileDevice ? mobileStripScroll.scrollRef : desktopStripScroll.scrollRef;
        if (stripRef.current) {
            setTimeout(() => {
                const card = stripRef.current?.querySelector(`[data-strip-card="${serviceId}"]`);
                card?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            }, 100);
        }
    }, [isMobileDevice]);

    // ⚡ Carga/render: props del mapa ESTABLES para no derrotar el React.memo de <MapContainer>.
    //    Antes initialCenter/style/onServiceSelect se creaban inline en CADA render → MapContainer
    //    re-renderizaba y re-disparaba sus effects de cámara sin necesidad. (initialZoom es un
    //    número → compara por valor, no hace falta memoizarlo.)
    const mapStyleFull = useMemo(() => ({ width: '100%', height: '100%' }), []);
    const handleMapServiceSelect = useCallback(
        (service: Service) => { handleServiceSelect(service.id); },
        [handleServiceSelect],
    );
    // Click en zona vacía del mapa → deseleccionar (cierra el bocadillo y des-resalta la card).
    const handleMapDeselect = useCallback(
        () => { handleServiceSelect(null); },
        [handleServiceSelect],
    );
    const desktopInitialCenter = useMemo(() => {
        if (selectedLocation) return selectedLocation;
        const c = getCountryCoordinates(selectedCountry);
        return c ? { lat: c.lat, lng: c.lng } : { lat: 40.4168, lng: -3.7038 };
    }, [selectedLocation, selectedCountry]);
    const mobileInitialCenter = useMemo(
        () => selectedLocation || { lat: 42.5, lng: -3.7 },
        [selectedLocation],
    );

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
        persistCurrentSearchLocation();
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
        <div className="fixed inset-0 z-[100] flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden bg-[#f6f7f8] lg:relative lg:inset-auto lg:z-auto lg:h-[100dvh] lg:max-h-[100dvh] lg:min-h-0">
            <HomepageDesktopTopBar variant="plain" showLogo />

            <div className="relative flex min-h-0 w-full flex-1 overflow-hidden">
                {/* Desktop: mapa a TODO el ancho + barra inferior horizontal de cards (estilo Google Maps) */}
                {!isMobileDevice && (
                    <div className="relative hidden min-h-0 w-full flex-1 flex-col lg:flex">
                        <div className="relative min-h-0 w-full flex-1 overflow-hidden bg-[#dce9f2]">
                            <button
                                type="button"
                                onClick={() => navigate('/')}
                                className="absolute left-5 top-4 z-[15] inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/95 shadow-[0_4px_14px_rgba(14,20,36,0.12),0_1px_3px_rgba(14,20,36,0.08)] ring-1 ring-black/[0.04] backdrop-blur-md transition-[transform,background] duration-150 hover:bg-white active:scale-95 xl:left-6"
                                aria-label="Volver"
                            >
                                <ArrowLeft className="h-5 w-5 text-[#1c1c1c]" strokeWidth={2.1} />
                            </button>
                            {/* Barra de direcciones flotante junto a "Volver" (estilo Google Maps). */}
                            <div className="absolute left-[4.75rem] top-4 z-[16] w-[min(380px,calc(100%-7rem))] xl:left-[5.25rem]">
                                <MapAddressSearchBar
                                    onSelect={handleAddressSearchSelect}
                                    country={selectedCountry}
                                    proximity={selectedLocation}
                                />
                            </div>
                            <MapContainer
                                categoryId={selectedCategory}
                                serviceTypeId={serviceTypeId}
                                initialCenter={desktopInitialCenter}
                                initialZoom={Math.max(3, getMapOverviewZoom(selectedCountry) - 1)}
                                recenterMode="pan-only"
                                onServiceSelect={handleMapServiceSelect}
                                onDeselect={handleMapDeselect}
                                selectedServiceId={selectedService}
                                hoveredServiceId={hoveredServiceId}
                                isMobile={false}
                                style={mapStyleFull}
                                onMapLoad={onMapReady}
                                onServicesCountChange={setMapServicesCount}
                                onServicesChange={setMapServices}
                                onLoadingChange={handleMapLoadingChange}
                            />
                        </div>

                        {/* Barra inferior: cabecera estilo homepage + cards flotando sobre el mapa */}
                        {formData.latitude && formData.longitude && (
                            <div className={`${MAP_STRIP_OVERLAY_GRADIENT_CLASS} z-[20]`}>
                                <div className="pointer-events-auto px-4 pb-4 md:px-5 lg:px-6">
                                    <MapStripOverlayChrome
                                        resultCount={displayedServices.length}
                                        sortBy={sortBy}
                                        onSort={setSortBy}
                                        minRating={filters.rating}
                                        onMinRating={(r) => setFilters((prev) => ({ ...prev, rating: r }))}
                                        priceRange={[filters.priceRange[0], Math.min(filters.priceRange[1], priceMax)]}
                                        onPriceRange={(r) => setFilters((prev) => ({ ...prev, priceRange: r }))}
                                        priceMax={priceMax}
                                        canScrollLeft={desktopStripScroll.canScrollLeft}
                                        canScrollRight={desktopStripScroll.canScrollRight}
                                        onScroll={desktopStripScroll.scroll}
                                        isLoading={mapLoading}
                                        rangeKm={parseInt(formData.locationRange || '25', 10) || 25}
                                        onExpandRadius={handleExpandSearchRadius}
                                    />
                                    {(displayedServices.length > 0 || mapLoading) && (
                                    <div
                                        ref={desktopStripScroll.scrollRef}
                                        data-sidebar-scroll
                                        className="flex items-stretch gap-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                                    >
                                    {displayedServices.length > 0 ? (
                                        <>
                                            {displayedServices.map((service) => {
                                                const serviceId = service.id || (service as any).Id;
                                                const isSelected = selectedService === serviceId;
                                                const isHovered = hoveredServiceId === serviceId;
                                                return (
                                                    <div
                                                        key={serviceId}
                                                        data-strip-card={serviceId}
                                                        className="shrink-0"
                                                        onMouseEnter={() => setHoveredServiceId(serviceId)}
                                                        onMouseLeave={() => setHoveredServiceId(null)}
                                                    >
                                                        <MapServiceCard
                                                            service={service}
                                                            isSelected={isSelected}
                                                            isHovered={isHovered}
                                                            onSelect={handleServiceSelect}
                                                            onNavigateToService={persistCurrentSearchLocation}
                                                            mapCenter={selectedLocation}
                                                            variant="strip"
                                                            initialIsFavorite={isAuthenticated ? (favoritesMap[serviceId] || false) : false}
                                                        />
                                                    </div>
                                                );
                                            })}
                                            {hasNextPage && (
                                                <div ref={sentinelRefSidebar} className="flex w-12 shrink-0 items-center justify-center">
                                                    {isFetchingNextPage && (
                                                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand/20 border-t-brand" />
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        [1, 2, 3, 4].map((i) => (
                                            <div key={i} className="h-[200px] w-[250px] shrink-0 animate-pulse rounded-2xl bg-white/85" />
                                        ))
                                    )}
                                    </div>
                                    )}
                                </div>
                            </div>
                        )}
                        {error && (
                            <div className="absolute left-1/2 top-3 z-[30] -translate-x-1/2 rounded-full bg-destructive px-4 py-2 text-xs font-semibold text-white shadow-md">
                                {error}
                            </div>
                        )}
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
                            {/* Botón "Volver" + barra de direcciones en la MISMA línea. */}
                            <div
                                className={`pointer-events-auto flex items-center gap-2 ${SD_MOBILE_GUTTER_CLASS} pt-[max(0.75rem,env(safe-area-inset-top))] pb-2`}
                            >
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        navigate('/');
                                    }}
                                    className="h-11 w-11 shrink-0 inline-flex items-center justify-center rounded-full bg-white/95 backdrop-blur-md shadow-[0_4px_14px_rgba(14,20,36,0.12),0_1px_3px_rgba(14,20,36,0.08)] ring-1 ring-black/[0.04] hover:bg-white active:scale-95 transition-[transform,background] duration-150"
                                    aria-label="Volver"
                                >
                                    <ArrowLeft className="h-5 w-5 text-[#1c1c1c]" strokeWidth={2.1} />
                                </button>
                                <MapAddressSearchBar
                                    className="min-w-0 flex-1"
                                    onSelect={handleAddressSearchSelect}
                                    country={selectedCountry}
                                    proximity={selectedLocation}
                                />
                            </div>
                        </div>

                        {/* Map - ocupa todo el espacio restante */}
                                {isMobileDevice && (
                                <div className="relative flex-1 w-full overflow-visible bg-[#dce9f2]">
                                    <MapContainer
                                        categoryId={selectedCategory}
                                        serviceTypeId={serviceTypeId}
                                        initialCenter={mobileInitialCenter}
                                        initialZoom={(() => {
                                            // 🔭 Encuadre inicial amplio: el mapa carga expertos por viewport,
                                            //    así que arrancar muy pegado (zoom ~8 sobre 25 km) mostraba "pocos
                                            //    servicios". Abrimos ~3-4 niveles (vista regional amplia) para que
                                            //    se vean muchos más al entrar; el usuario ya puede acercar.
                                            const baseZoom = selectedLocation
                                                ? getZoomLevel(parseInt(formData.locationRange || '25', 10)) - 3
                                                : getMapOverviewZoom(selectedCountry) - 2;
                                            return Math.max(4, baseZoom);
                                        })()}
                                        recenterMode="pan-only"
                                        onServiceSelect={handleMapServiceSelect}
                                        onDeselect={handleMapDeselect}
                                        selectedServiceId={selectedService}
                                        isMobile={true}
                                        style={mapStyleFull}
                                        onMapLoad={onMapReady}
                                        onServicesCountChange={setMapServicesCount}
                                        onServicesChange={setMapServices}
                                        onLoadingChange={handleMapLoadingChange}
                                    />
                                </div>
                                )}

                            {/* Barra inferior PLEGABLE (móvil): franja-asa + cuerpo con chrome + carrusel */}
                            {formData.latitude && formData.longitude && (
                                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[9998] pb-[env(safe-area-inset-bottom,0px)]">
                                    <MapResultsSheet
                                        expanded={stripExpanded}
                                        onExpandedChange={setStripExpanded}
                                        count={stripBarProps.count}
                                        summary={stripBarProps.summary}
                                        thumbnails={stripBarProps.thumbnails}
                                    >
                                        <div className="bg-gradient-to-t from-black/55 via-black/28 to-transparent pt-10">
                                            <div className={`pointer-events-auto ${SD_MOBILE_GUTTER_CLASS} pb-3`}>
                                                <MapStripOverlayChrome
                                                    resultCount={displayedServices.length}
                                                    sortBy={sortBy}
                                                    onSort={setSortBy}
                                                    minRating={filters.rating}
                                                    onMinRating={(r) => setFilters((prev) => ({ ...prev, rating: r }))}
                                                    priceRange={[filters.priceRange[0], Math.min(filters.priceRange[1], priceMax)]}
                                                    onPriceRange={(r) => setFilters((prev) => ({ ...prev, priceRange: r }))}
                                                    priceMax={priceMax}
                                                    canScrollLeft={mobileStripScroll.canScrollLeft}
                                                    canScrollRight={mobileStripScroll.canScrollRight}
                                                    onScroll={mobileStripScroll.scroll}
                                                    hideRating
                                                    isMobile
                                                    isLoading={mapLoading}
                                                    rangeKm={parseInt(formData.locationRange || '25', 10) || 25}
                                                    onExpandRadius={handleExpandSearchRadius}
                                                />
                                                {(displayedServices.length > 0 || mapLoading) && (
                                                <div
                                                    ref={mobileStripScroll.scrollRef}
                                                    // -mx-5 px-5: el carrusel sangra hasta los bordes de la pantalla (cancela el
                                                    // gutter px-5 del contenedor) y reañade el padding como scroll-padding interno,
                                                    // así las cards usan todo el ancho sin márgenes laterales muertos en el deslizable.
                                                    className="-mx-5 flex snap-x snap-mandatory items-stretch gap-3 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                                                >
                                                {displayedServices.length > 0 ? (
                                                    displayedServices.map((service) => {
                                                        const serviceId = service.id || (service as any).Id;
                                                        const isSelected = selectedService === serviceId;
                                                        return (
                                                            <div key={serviceId} data-strip-card={serviceId} className="shrink-0 snap-center">
                                                                <MapServiceCard
                                                                    service={service}
                                                                    isSelected={isSelected}
                                                                    onSelect={handleServiceSelect}
                                                                    onNavigateToService={persistCurrentSearchLocation}
                                                                    mapCenter={selectedLocation}
                                                                    variant="strip"
                                                                    initialIsFavorite={isAuthenticated ? (favoritesMap[serviceId] || false) : false}
                                                                />
                                                            </div>
                                                        );
                                                    })
                                                ) : (
                                                    [1, 2, 3].map((i) => (
                                                        <div key={i} className="h-[150px] w-[176px] shrink-0 animate-pulse rounded-2xl bg-white/85" />
                                                    ))
                                                )}
                                                </div>
                                                )}
                                            </div>
                                        </div>
                                    </MapResultsSheet>
                                </div>
                            )}
                </div>
            </div>
                
                
                {/* Drawer móvil DESACTIVADO: sustituido por la barra inferior de cards (igual que desktop). */}
                {false && (isMobileDevice ? (
                    <CustomBottomSheet
                        open={isDrawerOpen && isDrawerVisible}
                        dismissible={false}
                        lockTopSnap={!selectedService}
                        headerLoading={mapLoading || mapRefreshing}
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
                            let nextSnap = snap;
                            if (!selectedService && snap != null) {
                                const frac = Number(snap);
                                if (Number.isFinite(frac) && frac > tutorialSnapFraction + 0.001) {
                                    nextSnap = tutorialSnapFraction;
                                }
                            }
                            setMobileDrawerSnap((prev) => (prev === nextSnap ? prev : nextSnap));
                            if (
                                selectedService &&
                                (snap === MOBILE_MAP_SNAP_DEPLOYED || snap === MOBILE_MAP_SNAP_FULL)
                            ) {
                                setWasManuallyClosed(false);
                            }
                        }}
                        snapPoints={mobileDrawerSnapPoints}
                        activeSnapPoint={mobileDrawerSnap}
                        headerContent={
                            <MapMobileDrawerHeader
                                headerRef={mobileDrawerHeaderRef}
                                count={Math.max(services.length, mapServicesCount)}
                                locationLabel={
                                    formData.locationName ||
                                    searchAddress ||
                                    getCountryName(selectedCountry) ||
                                    null
                                }
                                rangeKm={parseInt(formData.locationRange || '25', 10) || 25}
                                awaitingSelection={!selectedService}
                            />
                        }
                        className="lg:hidden"
                    >
                        {/* Contenido con scroll */}
                        <div ref={drawerContentRef} className={MAP_MOBILE_LIST_CLASS}>
                            {!selectedService ? (
                                <div ref={tutorialContentRef} className={MAP_MOBILE_LIST_TUTORIAL_CLASS}>
                                    <MapMobileSelectTutorial />
                                </div>
                            ) : services.length > 0 ? (
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
                                                    onNavigateToService={persistCurrentSearchLocation}
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
                                                onNavigateToService={persistCurrentSearchLocation}
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
                ))}
        </div>
    );
}