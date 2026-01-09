import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useWindowSize } from '../hooks/useWindowSize';
import { ArrowRight, ArrowLeft, Search, X, Star, CheckCircle, User, Info, MapPin, Award, Zap, Shield, TrendingUp, Clock, FileText, Image, Video, Heart, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ImageCarousel } from './ui/image-carousel';
import { useLoadScript } from '@react-google-maps/api';
import { useServices } from '../hooks/useServices';
import { useMapExperts } from '../hooks/useMapExperts'; // ✅ Mantener para compatibilidad
import { useMapMarkers } from '../hooks/useMapMarkers'; // ✅ NUEVO: Marcadores ultra ligeros
import { LocationMap } from './LocationMap';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { Input } from './ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose, DrawerOverlay } from './ui/drawer';
import { ResponsiveModal } from './ui/responsive-modal';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Slider } from './ui/slider';
import { Label } from './ui/label';
import CountryFlag from './CountryFlag';
import CountrySelector from './CountrySelector';
import { getCountryCoordinates } from '../utils/countryCoordinates';
import { getCountryName } from '../utils/countries';
import Autocomplete from 'react-google-autocomplete';

const libraries: ('drawing' | 'geometry' | 'places')[] = ['drawing', 'geometry', 'places'];

// Componente para la card del servicio en el mapa
interface MapServiceCardProps {
    service: any;
    isSelected: boolean;
    onSelect: (serviceId: number) => void;
}

const MapServiceCard: React.FC<MapServiceCardProps> = ({ service, isSelected, onSelect }) => {
    const [imageIndex, setImageIndex] = useState(0);
    const [isFavorite, setIsFavorite] = useState(false);
    const navigate = useNavigate();
    
    const imageUrls = Array.isArray(service.imageUrls) 
        ? service.imageUrls 
        : Array.isArray(service.ImageUrls) 
            ? service.ImageUrls 
            : [];
    const hasMultipleImages = imageUrls.length > 1;
    const serviceId = service.id || service.Id;
    const isGuestFavorite = (service.completedSearches || 0) > 5 && (service.averageRating || 0) >= 4.0;
    
    const handleCardClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        navigate(`/service/${serviceId}`);
    };
    
    const handleFavoriteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setIsFavorite(!isFavorite);
    };
    
    // Formateo estilo Airbnb
    const price = service.price ? `${Math.round(service.price)} €` : 'Consultar';
    const completedCount = service.completedSearches || 0;
    const reviewCount = service.reviewCount || 0;
    
    // Avatar del experto
    const expertAvatar = service.expert?.user?.profilePicture || service.expert?.profilePicture;
    const expertName = service.expert?.user?.name || service.expert?.name || 'Profesional verificado';
    
    // Descripción del servicio
    const description = service.description || service.serviceTypeName || 'Servicio profesional';
    const shortDescription = description.length > 60 ? description.substring(0, 60) + '...' : description;
    
    // Horario de disponibilidad
    const getSchedule = () => {
        if (service.availability) return service.availability;
        // Formato horario
        return 'Lun-Vie 9:00-18:00';
    };
    
    return (
        <a
            href={`/service/${serviceId}`}
            onClick={handleCardClick}
            className="block cursor-pointer group"
            style={{ textDecoration: 'none', color: 'inherit' }}
        >
            <div className="relative">
                {/* Imagen cuadrada estilo Airbnb */}
                <div 
                    className="relative w-full overflow-hidden" 
                    style={{ aspectRatio: '1/1', borderRadius: '12px', marginBottom: '10px' }}
                >
                    {imageUrls.length > 0 ? (
                        <>
                            <img
                                src={imageUrls[imageIndex]}
                                alt={service.serviceTypeName || 'Servicio'}
                                className="w-full h-full object-cover"
                                loading="lazy"
                            />
                            
                            {/* Badge Guest favorite - Airbnb style */}
                            {isGuestFavorite && (
                                <div 
                                    className="absolute top-3 left-3"
                                    style={{
                                        padding: '4px 8px',
                                        backgroundColor: 'white',
                                        borderRadius: '4px',
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        color: '#222',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.18)'
                                    }}
                                >
                                    Guest favorite
                                </div>
                            )}

                            {/* Corazón Airbnb */}
                            <button 
                                onClick={handleFavoriteClick} 
                                className="absolute top-3 right-3"
                                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                            >
                                <svg viewBox="0 0 32 32" style={{ 
                                    width: '24px', height: '24px', 
                                    fill: isFavorite ? '#FF385C' : 'rgba(0,0,0,0.5)', 
                                    stroke: '#fff', strokeWidth: 2 
                                }}>
                                    <path d="m15.9998 28.6668c7.1667-4.8847 14.3334-10.8844 14.3334-18.1088 0-1.84951-.6993-3.69794-2.0988-5.10877-1.3996-1.4098-3.2332-2.11573-5.0679-2.11573-1.8336 0-3.6683.70593-5.0668 2.11573l-2.0999 2.11677-2.0999-2.11677c-1.3985-1.4098-3.2332-2.11573-5.0668-2.11573-1.8347 0-3.6683.70593-5.0679 2.11573-1.3996 1.41083-2.0988 3.25926-2.0988 5.10877 0 7.2244 7.1667 13.2241 14.3334 18.1088z"></path>
                                </svg>
                            </button>

                            {/* Foto del experto - Esquina inferior derecha */}
                            {expertAvatar && (
                                <div 
                                    className="absolute bottom-3 right-3"
                                    style={{
                                        width: '32px',
                                        height: '32px',
                                        border: '2px solid white',
                                        borderRadius: '50%',
                                        overflow: 'hidden',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.18)'
                                    }}
                                >
                                    <img 
                                        src={expertAvatar} 
                                        alt={expertName}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                </div>
                            )}

                            {/* Dots indicadores */}
                            {hasMultipleImages && (
                                <div className="absolute bottom-3 left-3 flex gap-1.5">
                                    {imageUrls.slice(0, 5).map((_: string, idx: number) => (
                                        <div 
                                            key={idx} 
                                            className="rounded-full"
                                            style={{ 
                                                height: '6px', 
                                                width: '6px', 
                                                backgroundColor: idx === imageIndex ? '#fff' : 'rgba(255,255,255,0.6)'
                                            }} 
                                        />
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <Image className="w-12 h-12 text-gray-400" />
                        </div>
                    )}
                </div>

                {/* Info estilo Airbnb exacto */}
                <div style={{ fontFamily: 'Circular, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, sans-serif' }}>
                    {/* Línea 1: Título */}
                    <div 
                        style={{ 
                            fontSize: '15px', 
                            fontWeight: 600, 
                            color: '#222', 
                            lineHeight: '18px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {service.serviceTypeName || service.categoryName || 'Servicio'}
                    </div>
                    
                    {/* Línea 2: Rating · Contrataciones · Experto - Todo en una línea */}
                    <div 
                        style={{ 
                            fontSize: '15px', 
                            color: '#717171', 
                            lineHeight: '18px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            overflow: 'hidden'
                        }}
                    >
                        {service.averageRating && service.averageRating > 0 && (
                            <>
                                <Star 
                                    style={{ 
                                        width: '10px', 
                                        height: '10px', 
                                        fill: '#222222', 
                                        color: '#222222',
                                        opacity: 0.7,
                                        flexShrink: 0
                                    }} 
                                />
                                <span>{service.averageRating.toFixed(1)}</span>
                            </>
                        )}
                        {completedCount > 0 && (
                            <>
                                <span>·</span>
                                <span>{completedCount} {completedCount === 1 ? 'contratación' : 'contrataciones'}</span>
                            </>
                        )}
                        {expertName && (
                            <>
                                <span>·</span>
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{expertName}</span>
                            </>
                        )}
                    </div>
                    
                    {/* Línea 3: Horario */}
                    <div 
                        style={{ 
                            fontSize: '15px', 
                            color: '#717171', 
                            lineHeight: '18px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {getSchedule()}
                    </div>
                    
                    {/* Línea 4: Precio */}
                    <div style={{ marginTop: '4px' }}>
                        <span style={{ fontSize: '15px', fontWeight: 600, color: '#222' }}>{price}</span>
                        <span style={{ fontSize: '15px', color: '#717171' }}> servicio</span>
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
    
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: "AIzaSyBNEdqihExcXPnWw_TJgHFzsPXS7BIazyM",
        libraries
    });
    const [error, setError] = useState<string | null>(null);
    const [map, setMap] = useState<google.maps.Map | null>(null);
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

    // Inicializar el mapa con el país por defecto cuando se carga
    useEffect(() => {
        if (isLoaded && map && selectedCountry) {
            const countryCoords = getCountryCoordinates(selectedCountry);
            if (countryCoords) {
                map.setCenter({ lat: countryCoords.lat, lng: countryCoords.lng });
                map.setZoom(countryCoords.zoom);
            }
        }
    }, [isLoaded, map, selectedCountry]);
   
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
    // En móvil, iniciar abierto pero invisible hasta que carguen los servicios
    const [isDrawerOpen, setIsDrawerOpen] = useState(initialIsMobile);
    const [isDrawerVisible, setIsDrawerVisible] = useState(false); // Controla la visibilidad
    // Estado para controlar la altura del drawer de forma fluida
    const [drawerHeight, setDrawerHeight] = useState(60); // En vh (60-95)
    // Altura máxima del drawer (hasta el topbar, no más)
    const topbarHeight = 73; // px - altura del topbar
    const maxDrawerHeight = typeof window !== 'undefined' 
        ? Math.floor(((window.innerHeight - topbarHeight) / window.innerHeight) * 100) 
        : 90; // En vh
    const lastScrollTop = useRef(0); // Para detectar dirección del scroll
    const touchStartY = useRef(0); // Para seguir el touch
    const drawerContentRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);
    const [headerTop, setHeaderTop] = useState(143); // 64px (top) + 79px (height) por defecto
    
    // Estado para controlar si es la primera carga y la posición inicial del drawer
    const [isFirstLoad, setIsFirstLoad] = useState(true);
    const [drawerTopPosition, setDrawerTopPosition] = useState<number | null>(null);
    
    // Calcular dinámicamente la posición del header
    useEffect(() => {
        const calculateHeaderPosition = () => {
            if (headerRef.current) {
                const rect = headerRef.current.getBoundingClientRect();
                const top = rect.top;
                const height = rect.height;
                setHeaderTop(top + height);
            }
        };
        
        calculateHeaderPosition();
        window.addEventListener('resize', calculateHeaderPosition);
        window.addEventListener('scroll', calculateHeaderPosition);
        
        return () => {
            window.removeEventListener('resize', calculateHeaderPosition);
            window.removeEventListener('scroll', calculateHeaderPosition);
        };
    }, []);
    const [filters, setFilters] = useState({
        priceRange: [0, 100000] as [number, number], // [min, max] en euros - rango amplio para servicios premium
        rating: 0 as number, // Mínimo de estrellas (0-5)
    });
   
    // Estado para bounds del mapa (para carga dinámica)
    const [mapBounds, setMapBounds] = useState<{
        northeast: { lat: number; lng: number };
        southwest: { lat: number; lng: number };
    } | null>(null);
    const [mapZoom, setMapZoom] = useState<number>(10);
   
    // Cargar servicios cuando hay ubicación seleccionada (Caso 3: búsqueda por ubicación)
    const { services: allServices, isLoading: isLoadingServices } = useServices({
        categoryId: selectedCategory || undefined,
        serviceTypeId: serviceTypeId || undefined,
        latitude: formData.latitude || undefined,
        longitude: formData.longitude || undefined,
        locationRange: formData.locationRange ? parseInt(formData.locationRange) : undefined,
    });
   
    // ✅ OPTIMIZADO: Cargar marcadores ultra ligeros para el mapa
    // Usar el nuevo endpoint map-markers que es mucho más rápido
    console.log('🔍 SearchParameterForm - Llamando useMapMarkers:', {
        selectedCategory,
        serviceTypeId,
        hasMapBounds: !!mapBounds,
        mapBounds: mapBounds
    });
    
    const { markers: mapMarkers, loading: markersLoading } = useMapMarkers(
        selectedCategory,
        serviceTypeId,
        mapBounds ? {
            bounds: mapBounds,
            zoom: mapZoom,
            limit: 200 // Límite recomendado para bounds
        } : {
            limit: 500 // Límite para carga inicial
        }
    );
    
    // ✅ Convertir marcadores a formato MapExpert para compatibilidad con LocationMap
    const mapExperts = mapMarkers.map(marker => ({
        id: marker.serviceId,
        name: '', // No disponible en marcadores ligeros
        profilePictureUrl: undefined,
        averageRating: 0,
        totalReviews: 0,
        completedSearches: 0,
        registeredSince: '',
        latitude: marker.latitude,
        longitude: marker.longitude,
        price: marker.price,
    }));
    
    // ✅ Para servicios completos, usar useMapSidebar cuando sea necesario
    // Por ahora, mantener servicesFromBounds vacío ya que los marcadores son ligeros
    const servicesFromBounds: any[] = [];
    
    // ✅ LOGS DETALLADOS
    console.log('🔍 SearchParameterForm - useMapMarkers retornó:', {
        mapMarkersCount: mapMarkers.length,
        mapExpertsCount: mapExperts.length,
        servicesFromBoundsCount: servicesFromBounds.length,
        markersLoading
    });
    
    // Handler para cuando cambian los bounds del mapa
    // ✅ Mejorado: Se ejecuta inmediatamente para cargar datos al mismo tiempo que el mapa
    const handleBoundsChange = useCallback((bounds: {
        northeast: { lat: number; lng: number };
        southwest: { lat: number; lng: number };
    }, zoom: number) => {
        // Actualizar bounds inmediatamente para que useMapExperts pueda cargar datos
        setMapBounds(bounds);
        setMapZoom(zoom);
        
        console.log('🔍 SearchParameterForm - handleBoundsChange llamado:', {
            bounds,
            zoom,
            timestamp: new Date().toISOString()
        });
    }, []);
   
    // ✅ Combinar servicios: de bounds (cuando se mueve el mapa) o de ubicación (cuando hay locationRange)
    // Priorizar servicios de bounds si existen, sino usar los de ubicación
    console.log('🔍 SearchParameterForm - Servicios disponibles:', {
        servicesFromBounds: servicesFromBounds.length,
        allServices: allServices.length,
        hasMapBounds: !!mapBounds,
        servicesFromBoundsData: servicesFromBounds,
        allServicesData: allServices
    });
    
    // ✅ SIEMPRE usar servicesFromBounds si hay bounds, incluso si está vacío (para evitar usar allServices que puede estar vacío)
    const allServicesCombined = mapBounds 
        ? servicesFromBounds 
        : allServices;
    
    console.log('🔍 SearchParameterForm - allServicesCombined:', {
        count: allServicesCombined.length,
        data: allServicesCombined
    });
    
    console.log('🔍 SearchParameterForm - allServicesCombined:', allServicesCombined.length, allServicesCombined);
    
    // ✅ Reordenar servicios: el seleccionado aparece primero (como en Airbnb)
    // ✅ IMPORTANTE: El servicio seleccionado NO aparece en el drawer, solo en la Floating Card
    const reorderedServices = useMemo(() => {
        if (!selectedService) {
            return allServicesCombined;
        }
        
        // Buscar el servicio seleccionado manejando tanto camelCase como PascalCase
        const selected = allServicesCombined.find(s => {
            const serviceId = s.id || (s as any).Id;
            return serviceId === selectedService;
        });
        
        // Filtrar los demás servicios (estos aparecerán en el drawer)
        // Cuando se selecciona un nuevo servicio, el anterior automáticamente vuelve aquí
        const others = allServicesCombined.filter(s => {
            const serviceId = s.id || (s as any).Id;
            return serviceId !== selectedService;
        });
        
        if (selected) {
            // El servicio seleccionado va primero (para la Floating Card)
            // Los demás servicios van después (para el drawer)
            return [selected, ...others];
        } else {
            return allServicesCombined;
        }
    }, [allServicesCombined, selectedService]);
   
    // Aplicar filtros a servicios (después de reordenar)
    console.log('🔍 SearchParameterForm - Antes de filtrar:', {
        reorderedServicesCount: reorderedServices.length,
        filters: filters,
        reorderedServices: reorderedServices.map(s => ({ id: s.id, price: s.price, rating: s.averageRating }))
    });
    
    const services = reorderedServices.filter(service => {
        // El precio viene directamente en euros
        const price = service.price || 0;
        const priceInRange = price >= filters.priceRange[0] && price <= filters.priceRange[1];
        
        if (!priceInRange) {
            console.log(`🔍 SearchParameterForm: Service ${service.id} filtrado por precio - price: ${price}, range: [${filters.priceRange[0]}, ${filters.priceRange[1]}]`);
            return false;
        }
        
        const rating = service.averageRating || 0;
        const ratingPassed = rating >= filters.rating;
        
        if (!ratingPassed) {
            console.log(`🔍 SearchParameterForm: Service ${service.id} filtrado por rating - rating: ${rating}, minRating: ${filters.rating}`);
            return false;
        }
        
        return true;
    });
    
    console.log('🔍 SearchParameterForm - Después de filtrar:', {
        servicesCount: services.length,
        services: services.map(s => ({ id: s.id, price: s.price, rating: s.averageRating }))
    });
    
    // Mostrar drawer cuando hay servicios disponibles en móvil (ya está abierto, solo lo hacemos visible)
    useEffect(() => {
        const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
        if (isMobile && allServices.length > 0 && !isLoadingServices && !isDrawerVisible) {
            console.log('✅ Mostrando drawer (ya posicionado)');
            setIsDrawerVisible(true);
            setDrawerHeight(60);
        }
    }, [allServices.length, isLoadingServices, isDrawerVisible]);
    
    // Establecer posición inicial del drawer a mitad de página en la primera carga
    useEffect(() => {
        if (isFirstLoad && isDrawerOpen && typeof window !== 'undefined') {
            const isMobile = window.innerWidth < 1024;
            if (isMobile) {
                // Calcular posición a mitad de página (50% del viewport height)
                const midPagePosition = window.innerHeight * 0.5;
                setDrawerTopPosition(midPagePosition);
            }
        }
    }, [isFirstLoad, isDrawerOpen]);
    
    // Detectar cuando el usuario interactúa con el drawer para permitir que vaya hasta arriba
    useEffect(() => {
        if (!isDrawerOpen || !isFirstLoad || typeof window === 'undefined') return;
        
        const isMobile = window.innerWidth < 1024;
        if (!isMobile) return;
        
        const midPagePosition = window.innerHeight * 0.5;
        
        // Función para permitir que el drawer vaya hasta arriba
        const allowFullHeight = () => {
            if (isFirstLoad) {
                setIsFirstLoad(false);
                setDrawerTopPosition(null);
            }
        };
        
        // Detectar cuando el usuario interactúa con el drawer
        // Buscar el elemento del drawer después de que se renderice
        const findAndSetupDrawer = () => {
            // Buscar el drawer usando varios selectores posibles
            const drawerSelectors = [
                '[data-vaul-drawer]',
                '[data-vaul-drawer-wrapper]',
                '.p1mcn102', // Clase específica mencionada por el usuario
                '[role="dialog"]'
            ];
            
            let drawerElement: HTMLElement | null = null;
            for (const selector of drawerSelectors) {
                const element = document.querySelector(selector) as HTMLElement;
                if (element) {
                    drawerElement = element;
                    break;
                }
            }
            
            if (drawerElement) {
                // Escuchar eventos de interacción en el drawer
                const handleInteraction = () => {
                    allowFullHeight();
                };
                
                // Escuchar eventos de touch y mouse
                drawerElement.addEventListener('touchstart', handleInteraction, { once: true });
                drawerElement.addEventListener('mousedown', handleInteraction, { once: true });
                
                // También verificar periódicamente si el drawer se ha movido
                const checkInterval = setInterval(() => {
                    const rect = drawerElement!.getBoundingClientRect();
                    // Si el drawer se ha movido hacia arriba desde su posición inicial
                    if (rect.top < midPagePosition - 30) {
                        allowFullHeight();
                        clearInterval(checkInterval);
                    }
                }, 100);
                
                // Limpiar después de 10 segundos si no hay interacción
                setTimeout(() => {
                    clearInterval(checkInterval);
                }, 10000);
            }
        };
        
        // Esperar a que el drawer se renderice
        const timeoutId = setTimeout(findAndSetupDrawer, 300);
        
        return () => {
            clearTimeout(timeoutId);
        };
    }, [isDrawerOpen, isFirstLoad]);
    
    // Detectar cuando el usuario interactúa con el drawer (arrastra o abre manualmente)
    const handleDrawerOpenChange = (open: boolean) => {
        // ✅ Permitir abrir tanto en móvil como en PC
        // El ResponsiveModal se encargará de mostrar Drawer o Dialog según el tamaño
        setIsDrawerOpen(open);
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
        // Actualizar mapa
        if (map) {
            map.panTo(newLocation);
            const radius = 25; // Fijo a 25km
            const zoom = getZoomLevel(radius);
            map.setZoom(zoom);
        }
        // El círculo se actualiza automáticamente con el componente Circle de React
    };
    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            frequency: '1' // Default to 1 hour
        }));
    }, []);
    useEffect(() => {
        if (navigator.geolocation) {
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
                () => {
                    setFormData(prev => ({
                        ...prev,
                        latitude: defaultCenter.lat.toString(),
                        longitude: defaultCenter.lng.toString()
                    }));
                    if (map) {
                        map.panTo(defaultCenter);
                        const radius = 25; // Fijo a 25km
                        const zoom = getZoomLevel(radius);
                        map.setZoom(zoom);
                    }
                }
            );
        }
    }, [map]);
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
        
        // Centrar el mapa
                    setTimeout(() => {
                        if (map) {
                            map.panTo(newLocation);
                const zoom = getZoomLevel(parseInt(formData.locationRange || '25'));
                map.setZoom(zoom);
            }
        }, 200);
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
        if (map && selectedLocation && formData.latitude && formData.longitude) {
            map.panTo(selectedLocation);
        }
    }, [selectedLocation, map, formData.latitude, formData.longitude]);
    const handleMapClick = (e: google.maps.MapMouseEvent) => {
        // ✅ Si el drawer está abierto, cerrarlo
        if (isDrawerOpen && isDrawerVisible) {
            console.log('🗺️ Click en mapa - cerrando drawer');
            setIsDrawerOpen(false);
            setIsDrawerVisible(false);
            return;
        }
        
        // ✅ Si hay una card abierta, solo cerrarla y deseleccionar, NO mover el mapa
        if (selectedService) {
            console.log('🗺️ Click en mapa - cerrando card (sin mover mapa)');
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
        console.log('🎯 handleServiceSelect llamado con:', { serviceId, servicesCount: services.length, currentSelected: selectedService });
        
        // Si serviceId es 0, null o undefined, cerrar la card (deseleccionar)
        if (serviceId === 0 || serviceId === null || serviceId === undefined) {
            console.log('❌ Cerrando card - deseleccionando servicio');
            setSelectedService(null);
            return;
        }
        
        // Validar que serviceId sea un número válido
        if (isNaN(serviceId)) {
            console.warn('⚠️ handleServiceSelect recibió un serviceId inválido:', serviceId);
            return;
        }
        
        // ✅ INTERCAMBIO: Si hay un servicio seleccionado (inmobiliaria), intercambiarlo con el nuevo
        if (selectedService && selectedService !== serviceId) {
            console.log('🔄 Intercambiando servicios:', { 
                servicioAnterior: selectedService, 
                servicioNuevo: serviceId 
            });
            // El servicio anterior (inmobiliaria) se moverá automáticamente al drawer
            // porque la lista de servicios excluye el selectedService
        }
        
        // ✅ Actualizar el estado para que el marcador cambie de color y se muestre la card flotante
        console.log('✅ Actualizando selectedService a:', serviceId);
        setSelectedService(serviceId);
        
        // Verificar que el servicio existe
        const serviceExists = services.find(s => s.id === serviceId || (s as any).Id === serviceId);
        console.log('🔍 Servicio encontrado:', { serviceExists: !!serviceExists, serviceId });
        
        // ✅ Hacer scroll al principio del sidebar para mostrar la card seleccionada (solo en desktop)
        if (sidebarRef.current) {
            setTimeout(() => {
                sidebarRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
            }, 100);
        }
        
        // ✅ NO navegar ni hacer llamadas a la API - solo mostrar el componente flotante
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
                <div className="hidden lg:flex flex-col w-[420px] min-w-[380px] border-r border-gray-200 bg-white">
                    {/* Header del panel */}
                    <div className="px-6 py-4 border-b border-gray-100">
                        <p className="text-sm text-gray-500">
                            {formData.latitude && formData.longitude 
                                ? `${services.length} expertos disponibles`
                                : 'Selecciona una ubicación en el mapa'
                            }
                        </p>
                        </div>
                    
                    {/* Filtros estilo Airbnb */}
                        {formData.latitude && formData.longitude && (
                        <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-2">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                    <button 
                                        type="button"
                                        className={`h-9 px-4 rounded-full border text-sm font-medium transition-all flex items-center gap-1.5 ${
                                            filters.priceRange[0] > 0 || filters.priceRange[1] < 100000 || filters.rating > 0
                                                ? 'border-gray-900 bg-gray-900 text-white'
                                                : 'border-gray-300 bg-white text-gray-700 hover:border-gray-900'
                                        }`}
                                    >
                                        <span className="flex items-center gap-1.5">
                                            <svg 
                                                xmlns="http://www.w3.org/2000/svg" 
                                                viewBox="0 0 32 32" 
                                                aria-hidden="true" 
                                                role="presentation" 
                                                focusable="false" 
                                                className="block fill-none h-4 w-4 stroke-current stroke-[3] overflow-visible"
                                            >
                                                <path 
                                                    fill="none" 
                                                    d="M7 16H3m26 0H15M29 6h-4m-8 0H3m26 20h-4M7 16a4 4 0 1 0 8 0 4 4 0 0 0-8 0zM17 6a4 4 0 1 0 8 0 4 4 0 0 0-8 0zm0 20a4 4 0 1 0 8 0 4 4 0 0 0-8 0zm0 0H3"
                                                />
                                            </svg>
                                            <span>Filtros</span>
                                        </span>
                                    </button>
                                        </PopoverTrigger>
                                <PopoverContent className="w-80 p-5" align="start">
                                            <div className="space-y-6">
                                        <h4 className="font-semibold text-gray-900">Filtros</h4>
                                        
                                        {/* Filtro de Precio */}
                                        <div className="space-y-4">
                                            <h5 className="text-sm font-medium text-gray-700">Rango de precio</h5>
                                                    <Slider
                                                        value={filters.priceRange}
                                                        onValueChange={(value) => setFilters({...filters, priceRange: value as [number, number]})}
                                                        min={0}
                                            max={1000}
                                                        step={10}
                                                        className="w-full"
                                                    />
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex-1">
                                                <label className="text-xs text-gray-500 mb-1 block">Mínimo</label>
                                                <div className="h-10 px-3 border border-gray-300 rounded-lg flex items-center text-sm">
                                                    €{filters.priceRange[0]}
                                                </div>
                                            </div>
                                            <div className="text-gray-400 mt-5">—</div>
                                            <div className="flex-1">
                                                <label className="text-xs text-gray-500 mb-1 block">Máximo</label>
                                                <div className="h-10 px-3 border border-gray-300 rounded-lg flex items-center text-sm">
                                                    €{filters.priceRange[1]}+
                                                </div>
                                                    </div>
                                                </div>
                                        </div>

                                        {/* Filtro de Valoración */}
                                        <div className="space-y-4">
                                            <h5 className="text-sm font-medium text-gray-700">Valoración mínima</h5>
                                        <div className="flex gap-2">
                                            {[0, 3, 3.5, 4, 4.5].map((rating) => (
                                                <button
                                                    key={rating}
                                                    onClick={() => setFilters({...filters, rating})}
                                                    className={`flex-1 h-10 rounded-lg border text-sm font-medium transition-all ${
                                                        filters.rating === rating
                                                            ? 'border-gray-900 bg-gray-900 text-white'
                                                            : 'border-gray-300 hover:border-gray-900'
                                                    }`}
                                                >
                                                    {rating === 0 ? 'Todas' : `${rating}+`}
                                                </button>
                                            ))}
                                                </div>
                                        </div>

                                        {/* Botón Borrar */}
                                        {(filters.priceRange[0] > 0 || filters.priceRange[1] < 100000 || filters.rating > 0) && (
                                            <button 
                                                onClick={() => setFilters({ priceRange: [0, 100000], rating: 0 })}
                                                className="text-sm font-medium text-gray-900 underline w-full text-left"
                                            >
                                                Borrar filtros
                                            </button>
                                        )}
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                            </div>
                    )}
                    
                    {/* Lista de servicios */}
                    <div ref={sidebarRef} className="flex-1 overflow-y-auto">
                        {formData.latitude && formData.longitude && (
                            <div className="p-4 pb-6">
                            {/* Services List - Desktop estilo Airbnb en 1 columna, cards más grandes */}
                            {(() => {
                                console.log('🔍 SearchParameterForm - Renderizando sidebar:', {
                                    reorderedServicesCount: reorderedServices.length,
                                    reorderedServices: reorderedServices
                                });
                                return null;
                            })()}
                            {reorderedServices.length > 0 ? (
                                <div className="flex flex-col gap-6" style={{ width: '100%' }}>
                                    {reorderedServices.map((service) => {
                                        const serviceId = service.id || (service as any).Id;
                                        const isSelected = selectedService === serviceId;
                                        return (
                                            <div key={serviceId} style={{ width: '100%', maxWidth: '347px' }}>
                                                <MapServiceCard
                                                    service={service}
                                                    isSelected={isSelected}
                                                    onSelect={handleServiceSelect}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
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
                        {/* Loading overlay mientras cargan los servicios */}
                        {isLoadingServices && (
                            <div className="absolute inset-0 bg-white z-[10000] flex items-center justify-center">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                                    <p className="text-sm text-gray-600">Cargando servicios...</p>
                                </div>
                            </div>
                        )}
                        {/* Header estilo Airbnb - Sticky - Igual que Airbnb móvil */}
                        <div 
                            id="mobile-search-header"
                            ref={headerRef}
                            className="sticky top-0 z-[9999] bg-white"
                        >
                            <div className="px-4 py-3 flex items-center gap-2">
                                {/* Botón de atrás - Estilo Airbnb */}
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        navigate('/');
                                    }}
                                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
                                    aria-label="Atrás"
                                >
                                    <ArrowLeft className="w-5 h-5 text-gray-900" />
                                </button>
                                
                                {/* Botón de búsqueda grande estilo Airbnb - Centrado */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        // Scroll to search bar or open search modal
                                    }}
                                    className="flex-1 h-[57px] px-4 rounded-full border border-gray-300 bg-white hover:shadow-md transition-all flex items-center justify-center text-center shadow-sm"
                                    aria-label="Revisores en tu zona"
                                    aria-describedby="searchInputDescriptionId"
                                    style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Circular", "Helvetica Neue", Helvetica, Arial, sans-serif' }}
                                >
                                    <div className="flex flex-col items-center justify-center text-center">
                                        <span className="text-sm text-gray-900" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Circular", "Helvetica Neue", Helvetica, Arial, sans-serif', fontWeight: 500 }}>
                                            Revisores en tu zona
                                        </span>
                                        <span className="text-xs text-gray-500 mt-0.5" aria-hidden="true" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Circular", "Helvetica Neue", Helvetica, Arial, sans-serif', fontWeight: 400 }}>
                                            Cualquier semana • Añade viajeros
                                        </span>
                                    </div>
                                    <span className="sr-only" id="searchInputDescriptionId">
                                        Filtro aplicado: Cualquier semana, Añade viajeros. Cambia la búsqueda.
                                    </span>
                                </button>
                                
                                {/* Botón de filtros - Estilo Airbnb */}
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <button
                                            type="button"
                                            aria-label="Show filters"
                                            className="w-10 h-10 rounded-full border-0 bg-transparent hover:bg-gray-100 transition-all flex items-center justify-center flex-shrink-0"
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
                                    </PopoverTrigger>
                                    <PopoverContent className="w-80 p-5" align="end">
                                        <div className="space-y-6">
                                            <h4 className="font-semibold text-gray-900">Filtros</h4>
                                            
                                            {/* Filtro de Precio */}
                                            <div className="space-y-4">
                                                <h5 className="text-sm font-medium text-gray-700">Rango de precio</h5>
                                                <Slider
                                                    value={filters.priceRange}
                                                    onValueChange={(value) => setFilters({...filters, priceRange: value as [number, number]})}
                                                    min={0}
                                                    max={1000}
                                                    step={10}
                                                    className="w-full"
                                                />
                                                <div className="flex items-center justify-between gap-4">
                                                    <div className="flex-1">
                                                        <label className="text-xs text-gray-500 mb-1 block">Mínimo</label>
                                                        <div className="h-10 px-3 border border-gray-300 rounded-lg flex items-center text-sm">
                                                            €{filters.priceRange[0]}
                                                        </div>
                                                    </div>
                                                    <div className="text-gray-400 mt-5">—</div>
                                                    <div className="flex-1">
                                                        <label className="text-xs text-gray-500 mb-1 block">Máximo</label>
                                                        <div className="h-10 px-3 border border-gray-300 rounded-lg flex items-center text-sm">
                                                            €{filters.priceRange[1]}+
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Filtro de Valoración */}
                                            <div className="space-y-4">
                                                <h5 className="text-sm font-medium text-gray-700">Valoración mínima</h5>
                                                <div className="flex gap-2">
                                                    {[0, 3, 3.5, 4, 4.5].map((rating) => (
                                                        <button
                                                            key={rating}
                                                            onClick={() => setFilters({...filters, rating})}
                                                            className={`flex-1 h-10 rounded-lg border text-sm font-medium transition-all ${
                                                                filters.rating === rating
                                                                    ? 'border-gray-900 bg-gray-900 text-white'
                                                                    : 'border-gray-300 hover:border-gray-900'
                                                            }`}
                                                        >
                                                            {rating === 0 ? 'Todas' : `${rating}+`}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Botón Borrar */}
                                            {(filters.priceRange[0] > 0 || filters.priceRange[1] < 100000 || filters.rating > 0) && (
                                                <button
                                                    onClick={() => setFilters({ priceRange: [0, 100000], rating: 0 })}
                                                    className="text-sm font-medium text-gray-900 underline w-full text-left"
                                                >
                                                    Borrar filtros
                                                </button>
                                            )}
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                        
                        {loadError ? (
                        <div className="h-full flex items-center justify-center bg-gray-100">
                            <div className="text-red-500">Error al cargar el mapa</div>
                            </div>
                        ) : (
                            <>
                            {/* Map - ocupa todo el espacio restante */}
                                <div className="flex-1 relative w-full overflow-visible">
                                    {isLoaded ? (
                                        <LocationMap
                                            selectedLocation={selectedLocation}
                                            mapExperts={mapExperts}
                                            services={services}
                                            selectedService={selectedService}
                                            onMapClick={handleMapClick}
                                            onMapLoad={(mapInstance) => {
                                                setMap(mapInstance);
                                                // Centrar en el país por defecto al cargar
                                                const countryCoords = getCountryCoordinates(selectedCountry);
                                                if (countryCoords) {
                                                    mapInstance.setCenter({ lat: countryCoords.lat, lng: countryCoords.lng });
                                                    mapInstance.setZoom(countryCoords.zoom);
                                                }
                                            }}
                                            onServiceSelect={handleServiceSelect}
                                            locationRange={parseInt(formData.locationRange)}
                                            isMobile={true}
                                            isLoaded={isLoaded}
                                        />
                                    ) : null}
                                </div>
                                
                            {/* Floating Button - Siempre visible cuando NO hay card seleccionada */}
                                {formData.latitude && formData.longitude && !selectedService && (
                                <div className="absolute bottom-[env(safe-area-inset-bottom,16px)] left-1/2 transform -translate-x-1/2 z-[9999] pb-4">
                                        <Button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (isDrawerOpen) {
                                                    // Si está abierto, alternar entre expandido y colapsado
                                                    setDrawerHeight(drawerHeight > 80 ? 60 : maxDrawerHeight);
                                                } else {
                                                    // Si está cerrado, abrir colapsado
                                                    setIsDrawerOpen(true);
                                                    setDrawerHeight(60);
                                                }
                                            }}
                                            size="lg"
                                        className={`shadow-2xl border-2 h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base rounded-full font-semibold transition-all pointer-events-auto ${
                                                services.length === 0 
                                                    ? 'bg-background/95 backdrop-blur-sm border-muted-foreground/30 text-muted-foreground' 
                                                    : 'bg-primary border-primary text-primary-foreground hover:bg-primary/90'
                                            }`}
                                            disabled={services.length === 0}
                                        >
                                            <MapPin className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                                            {services.length > 0 
                                                ? `Ver ${services.length} ${services.length === 1 ? 'resultado' : 'resultados'}`
                                                : 'Ver resultados'
                                            }
                                        </Button>
                                </div>
                                )}
                            </>
                        )}
                        
                        {/* Floating Card - Estilo Airbnb - SOLO MÓVIL - FUERA del contenedor del mapa para que aparezca correctamente */}
                        {selectedService && (() => {
                            console.log('🎴 Renderizando Floating Card (nivel superior):', { selectedService, servicesCount: services.length });
                            const selectedServiceData = services.find(s => s.id === selectedService || (s as any).Id === selectedService);
                            console.log('🎴 selectedServiceData encontrado:', { found: !!selectedServiceData, serviceId: selectedServiceData?.id || (selectedServiceData as any)?.Id });
                            if (!selectedServiceData) {
                                console.warn('⚠️ No se encontró el servicio con ID:', selectedService);
                                return null;
                            }
                            
                            const imageUrls = Array.isArray(selectedServiceData.imageUrls) 
                                ? selectedServiceData.imageUrls 
                                : Array.isArray(selectedServiceData.ImageUrls) 
                                    ? selectedServiceData.ImageUrls 
                                    : [];
                            const hasValidImage = imageUrls.length > 0;
                            const firstImage = imageUrls[0] || '';
                            
                            // Formatear fecha
                            const formatDate = () => {
                                const today = new Date();
                                const checkIn = new Date(today);
                                checkIn.setDate(today.getDate() + 2);
                                const checkOut = new Date(checkIn);
                                checkOut.setDate(checkIn.getDate() + 2);
                                const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
                                return `${checkIn.getDate()}–${checkOut.getDate()} ${months[checkIn.getMonth()]}`;
                            };
                            
                            const nights = selectedServiceData.durationInHours ? Math.ceil(selectedServiceData.durationInHours / 24) : 2;
                            const price = selectedServiceData.price || 0;
                            const totalPrice = price * nights;
                            
                            console.log('✅ Renderizando card HTML para servicio:', selectedServiceData.id || (selectedServiceData as any).Id);
                            const serviceId = selectedServiceData.id || (selectedServiceData as any).Id;
                            
                            const handleCardClick = (e: React.MouseEvent | React.TouchEvent) => {
                                // No navegar si se hace clic en los botones
                                const target = e.target as HTMLElement;
                                if (target.closest('button')) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    return;
                                }
                                
                                // Prevenir navegación si la card acaba de abrirse (para evitar clics accidentales)
                                const timeSinceOpen = Date.now() - cardOpenTimeRef.current;
                                if (cardJustOpened || timeSinceOpen < 500) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    console.log('🚫 Click bloqueado - card acaba de abrirse', { timeSinceOpen, cardJustOpened });
                                    return;
                                }
                                
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('🖱️ Click en card flotante, navegando a:', serviceId);
                                navigate(`/service/${serviceId}`);
                            };
                            
                            const handleCardTouchStart = (e: React.TouchEvent) => {
                                // Prevenir navegación en touch si la card acaba de abrirse
                                const timeSinceOpen = Date.now() - cardOpenTimeRef.current;
                                if (cardJustOpened || timeSinceOpen < 500) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    return;
                                }
                            };
                            
                            const handleOverlayClick = (e: React.MouseEvent | React.TouchEvent) => {
                                // Solo cerrar si el clic no es en la card misma
                                const target = e.target as HTMLElement;
                                if (target.closest('[data-testid="card-container"]')) {
                                    return;
                                }
                                
                                // Cerrar la card al hacer clic fuera
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('🖱️ Click fuera de la card, cerrando...');
                                handleServiceSelect(null);
                            };
                            
                            return (
                                <>
                                    {/* Overlay para cerrar al hacer clic fuera - Solo activo cuando hay card abierta - SOLO MÓVIL */}
                                    {selectedService && (
                                        <div
                                            className="fixed inset-0 z-[10000] bg-transparent lg:hidden"
                                            onClick={handleOverlayClick}
                                            onTouchEnd={handleOverlayClick}
                                            onTouchStart={(e) => {
                                                // Prevenir que el mapa se mueva cuando se toca el overlay
                                                e.preventDefault();
                                                e.stopPropagation();
                                            }}
                                            style={{
                                                pointerEvents: 'auto',
                                                touchAction: 'none' // Prevenir que el mapa se mueva
                                            }}
                                        />
                                    )}
                                    
                                    <div 
                                        className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-[10001] w-[calc(100vw-32px)] max-w-[400px] lg:hidden"
                                    role="dialog"
                                    data-testid="card-container"
                                        onClick={(e) => e.stopPropagation()}
                                        onTouchEnd={(e) => e.stopPropagation()}
                                    style={{ 
                                        fontFamily: '-apple-system, BlinkMacSystemFont, "Circular", "Helvetica Neue", Helvetica, Arial, sans-serif',
                                        '--card-container_width': 'calc(100vw - 32px)',
                                        position: 'fixed',
                                        bottom: '16px',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        zIndex: 10001,
                                        display: 'block',
                                            visibility: 'visible',
                                            pointerEvents: cardJustOpened ? 'none' : 'auto'
                                    } as React.CSSProperties}
                                        onTouchStart={handleCardTouchStart}
                                >
                                    <a
                                        href={`/service/${serviceId}`}
                                        onClick={handleCardClick}
                                        onTouchEnd={handleCardClick}
                                        className="block cursor-pointer"
                                        style={{ 
                                            textDecoration: 'none', 
                                            color: 'inherit',
                                            pointerEvents: cardJustOpened ? 'none' : 'auto'
                                        }}
                                    >
                                        <div className="bg-white rounded-xl shadow-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-3xl">
                                        {/* Header con imagen y botones - Estilo Airbnb */}
                                        <div className="relative">
                                            {hasValidImage && (
                                                <div className="relative w-full overflow-hidden" style={{ aspectRatio: '4/3', maxHeight: '300px' }}>
                                                    <div className="relative w-full h-full">
                                                        <img
                                                            src={firstImage}
                                                            alt={selectedServiceData.serviceTypeName || selectedServiceData.categoryName}
                                                            className="w-full h-full object-cover"
                                                            loading="eager"
                                                        />
                                                        
                                                        {/* Indicadores de imágenes si hay más de una */}
                                                        {imageUrls.length > 1 && (
                                                            <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-1">
                                                                {imageUrls.map((_: string, idx: number) => (
                                                                    <span
                                                                        key={idx}
                                                                        className={`w-1.5 h-1.5 rounded-full ${
                                                                            idx === 0 ? 'bg-white' : 'bg-white/50'
                                                                        }`}
                                                                        style={{ 
                                                                            transform: idx === 0 ? 'scale(1)' : `scale(${1 - idx * 0.15})`
                                                                        }}
                                                                    />
                                                                ))}
                                                            </div>
                                                        )}
                                                        
                                                        {/* Botones superiores - Estilo Airbnb */}
                                                        <div className="absolute top-3 right-3 flex gap-2 z-10" style={{ pointerEvents: 'auto' }}>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    e.preventDefault();
                                                                    // TODO: Agregar a favoritos
                                                                }}
                                                                className="w-10 h-10 rounded-full bg-white/90 hover:bg-white transition-all flex items-center justify-center shadow-sm"
                                                                aria-label="Añadir a favoritos"
                                                                type="button"
                                                                style={{ pointerEvents: 'auto' }}
                                                            >
                                                                <Heart className="w-5 h-5 text-gray-900" />
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    e.preventDefault();
                                                                    console.log('❌ Botón cerrar clickeado');
                                                                    handleServiceSelect(null);
                                                                }}
                                                                onTouchEnd={(e) => {
                                                                    e.stopPropagation();
                                                                    e.preventDefault();
                                                                    console.log('❌ Botón cerrar tocado');
                                                                    handleServiceSelect(null);
                                                                }}
                                                                className="w-10 h-10 rounded-full bg-white/90 hover:bg-white transition-all flex items-center justify-center shadow-sm"
                                                                aria-label="Cerrar"
                                                                type="button"
                                                                style={{ pointerEvents: 'auto' }}
                                                            >
                                                                <X className="w-5 h-5 text-gray-900" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Contenido del card - Estilo Airbnb */}
                                        <div className="p-4">
                                            {/* Título principal */}
                                            <div className="mb-2">
                                                <h3 
                                                    className="text-base font-semibold text-gray-900 mb-1 line-clamp-1"
                                                    id={`title_${selectedServiceData.id || (selectedServiceData as any).Id}`}
                                                    data-testid="listing-card-title"
                                                    style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Circular", "Helvetica Neue", Helvetica, Arial, sans-serif', fontWeight: 600 }}
                                                >
                                                    {selectedServiceData.serviceTypeName || selectedServiceData.categoryName || 'Servicio'}
                                                </h3>
                                                <p 
                                                    className="text-sm text-gray-600 line-clamp-1"
                                                    data-testid="listing-card-subtitle"
                                                    style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Circular", "Helvetica Neue", Helvetica, Arial, sans-serif' }}
                                                >
                                                    {selectedServiceData.expert?.user?.name || 'Experto'}
                                                </p>
                                            </div>
                                            
                                            {/* Fechas - Estilo Airbnb */}
                                            <div className="text-sm text-gray-600 mb-3" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Circular", "Helvetica Neue", Helvetica, Arial, sans-serif' }}>
                                                <span>{formatDate()}</span>
                                            </div>
                                            
                                            {/* Precio y rating - Estilo Airbnb */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-baseline gap-1">
                                                    <span 
                                                        className="text-base font-semibold text-gray-900"
                                                        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Circular", "Helvetica Neue", Helvetica, Arial, sans-serif', fontWeight: 500 }}
                                                    >
                                                        €{totalPrice}
                                                    </span>
                                                    <span 
                                                        className="text-sm text-gray-600"
                                                        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Circular", "Helvetica Neue", Helvetica, Arial, sans-serif' }}
                                                    >
                                                        por {nights} {nights === 1 ? 'noche' : 'noches'}
                                                    </span>
                                                </div>
                                                {selectedServiceData.averageRating && selectedServiceData.averageRating > 0 && (
                                                    <div className="flex items-center gap-1">
                                                        <Star className="w-3 h-3 fill-gray-900 text-gray-900" />
                                                        <span 
                                                            className="text-sm text-gray-900"
                                                            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Circular", "Helvetica Neue", Helvetica, Arial, sans-serif' }}
                                                        >
                                                            {selectedServiceData.averageRating.toFixed(2)}
                                                            {selectedServiceData.completedSearches && selectedServiceData.completedSearches > 0 && (
                                                                <span className="text-gray-600"> ({selectedServiceData.completedSearches})</span>
                                                            )}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    </a>
                                </div>
                                </>
                            );
                        })()}
                </div>
                
                {/* Desktop: Right Side - Map */}
                <div className="hidden lg:flex lg:flex-1 relative bg-gray-100">
                        {loadError ? (
                        <div className="h-full w-full flex items-center justify-center bg-gray-100">
                            <div className="text-red-500">Error al cargar el mapa</div>
                            </div>
                        ) : (
                            <>
                            {/* Barra de búsqueda desktop - Estilo Airbnb Compacto - Responsive para todos los formatos */}
                            <div className="absolute left-6 z-[9999] pointer-events-none" style={{ top: 'clamp(80px, calc(64px + 2vh), 96px)' }}>
                                <div className="w-[400px] pointer-events-auto">
                                    <div className="bg-white rounded-full shadow-2xl hover:shadow-3xl border border-gray-200 flex items-center overflow-hidden transition-all duration-300" style={{ minHeight: '56px' }}>
                                        {/* Selector de país - Compacto */}
                                        <div className="flex-shrink-0">
                                        <CountrySelector
                                            onCountrySelect={(countryCode, coordinates) => {
                                                setSelectedCountry(countryCode);
                                                if (map) {
                                                    map.setCenter({ lat: coordinates.lat, lng: coordinates.lng });
                                                    map.setZoom(coordinates.zoom);
                                                }
                                                setFormData(prev => ({
                                                    ...prev,
                                                    latitude: coordinates.lat.toString(),
                                                    longitude: coordinates.lng.toString(),
                                                    locationName: getCountryName(countryCode) || '',
                                                }));
                                                setSelectedLocation({ lat: coordinates.lat, lng: coordinates.lng });
                                                setSearchAddress('');
                                            }}
                                            currentCountry={selectedCountry}
                                                className="[&>button]:h-14 [&>button]:px-4 [&>button]:min-w-[110px] [&>button]:gap-2"
                                        />
                                        </div>
                                        
                                        {/* Separador - Más cerca */}
                                        <div className="w-px h-7 bg-gray-200 flex-shrink-0 mx-1" />
                                        
                                        {/* Campo de búsqueda */}
                                        <div className="flex-1 relative min-w-0">
                                            {isLoaded ? (
                                                <Autocomplete
                                                    onPlaceSelected={handlePlaceSelected}
                                                    options={{
                                                        componentRestrictions: { country: selectedCountry.toLowerCase() },
                                                        fields: ['formatted_address', 'geometry', 'name', 'place_id', 'address_components']
                                                    }}
                                                    className="w-full h-14 pl-4 pr-12 text-sm text-gray-900 placeholder-gray-500 bg-transparent border-0 focus:outline-none focus:ring-0 truncate"
                                                    placeholder="Buscar ciudad o dirección..."
                                                    disabled={isGeocoding}
                                                />
                                            ) : (
                                                <input
                                                type="text"
                                                    placeholder="Cargando mapa..."
                                                    disabled
                                                    className="w-full h-14 pl-4 pr-12 text-sm text-gray-400 placeholder-gray-400 bg-transparent border-0 truncate"
                                                />
                                            )}
                                            {isGeocoding ? (
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                                    <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                                                </div>
                                            ) : searchAddress ? (
                                                <button
                                                    onClick={() => {
                                                        setSearchAddress('');
                                                        if (searchInputRef.current) {
                                                            searchInputRef.current.value = '';
                                                            searchInputRef.current.focus();
                                                        }
                                                    }}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                            ) : (
                                                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                                            )}
                                        </div>
                                        </div>
                                    </div>
                                </div>
                                
                            {/* Map ocupa todo el espacio */}
                            <div className="absolute inset-0">
                                {isLoaded ? (
                                    <LocationMap
                                        selectedLocation={selectedLocation}
                                        mapExperts={mapExperts}
                                        services={services}
                                        selectedService={selectedService}
                                        onMapClick={handleMapClick}
                                        onMapLoad={async (mapInstance) => {
                                            setMap(mapInstance);
                                            // Centrar en el país por defecto al cargar
                                            const countryCoords = getCountryCoordinates(selectedCountry);
                                            if (countryCoords) {
                                                mapInstance.setCenter({ lat: countryCoords.lat, lng: countryCoords.lng });
                                                mapInstance.setZoom(countryCoords.zoom);
                                            } else {
                                        const radius = 25;
                                        const zoom = getZoomLevel(radius);
                                            mapInstance.setZoom(zoom);
                                            }
                                        }}
                                        onServiceSelect={handleServiceSelect}
                                        locationRange={25}
                                        isMobile={false}
                                        isLoaded={isLoaded}
                                    />
                                ) : null}
                                
                                {/* Floating Card Desktop - OCULTA EN PC */}
                            </div>
                            </>
                        )}
                    </div>
                </div>
                
                {/* Overlay para cerrar el drawer al hacer clic fuera - Solo móvil */}
                {isDrawerOpen && isDrawerVisible && (
                    <div 
                        className="lg:hidden fixed inset-0 z-[9999]"
                        style={{ 
                            backgroundColor: 'transparent',
                            pointerEvents: 'auto'
                        }}
                        onClick={() => {
                            console.log('🗺️ Click en overlay - cerrando drawer');
                            setIsDrawerOpen(false);
                            setIsDrawerVisible(false);
                        }}
                    />
                )}
                
                {/* ResponsiveModal: Drawer en móvil, Dialog en PC */}
                <ResponsiveModal
                    open={isDrawerOpen}
                    onOpenChange={handleDrawerOpenChange}
                    modal={false}
                    dismissible={false}
                    drawerHeight={`${drawerHeight}vh`}
                    style={{
                        opacity: isDrawerVisible ? 1 : 0,
                        pointerEvents: isDrawerVisible ? 'auto' : 'none'
                    }}
                    title={(() => {
                        // Contar solo los servicios que están en el drawer (excluyendo el seleccionado)
                        const drawerServicesCount = selectedService 
                            ? services.filter(s => (s.id || (s as any).Id) !== selectedService).length
                            : services.length;
                        return drawerServicesCount > 0 
                            ? `${drawerServicesCount} ${drawerServicesCount === 1 ? 'servicio' : 'servicios'}` 
                            : 'Sin servicios';
                    })()}
                    drawerClassName="lg:hidden flex flex-col bg-white outline-none border-0 shadow-none rounded-none"
                    dialogClassName="max-w-4xl max-h-[90vh] flex flex-col"
                    drawerStyle={{ 
                        bottom: '0',
                        zIndex: 10000,
                        height: `${drawerHeight}vh`,
                        maxHeight: `${drawerHeight}vh`,
                        position: 'fixed',
                        backgroundColor: 'white',
                        borderTopLeftRadius: '12px',
                        borderTopRightRadius: '12px',
                        borderBottomLeftRadius: '0',
                        borderBottomRightRadius: '0',
                        transition: 'none', // Sin transición para seguir el dedo en tiempo real
                        willChange: 'height'
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
                    noHandle={true}
                >
                    {/* Handle draggable para cerrar - Solo móvil */}
                    <div 
                        className="lg:hidden w-full py-2 flex justify-center cursor-grab active:cursor-grabbing bg-white"
                        style={{ borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}
                        onTouchStart={(e) => {
                            touchStartY.current = e.touches[0].clientY;
                        }}
                        onTouchMove={(e) => {
                            const touchY = e.touches[0].clientY;
                            const deltaY = touchStartY.current - touchY;
                            
                            // Si arrastra hacia abajo más de 50px, cerrar
                            if (deltaY < -50) {
                                setIsDrawerOpen(false);
                                setIsDrawerVisible(false);
                            } else if (deltaY < 0) {
                                // Reducir altura mientras arrastra hacia abajo
                                const newHeight = Math.max(40, 60 + (deltaY / 5));
                                setDrawerHeight(Math.round(newHeight));
                            }
                        }}
                        onTouchEnd={() => {
                            // Si la altura es muy baja, cerrar. Si no, restaurar
                            if (drawerHeight < 50) {
                                setIsDrawerOpen(false);
                                setIsDrawerVisible(false);
                            } else {
                                setDrawerHeight(60);
                            }
                        }}
                    >
                        <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
                    </div>
                    {/* Header con contador estilo Airbnb - Solo en móvil */}
                    <div className="lg:hidden px-6 py-3 bg-white border-b border-gray-100 flex-shrink-0" style={{ zIndex: 10001 }}>
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">
                                {(() => {
                                    // Contar solo los servicios que están en el drawer (excluyendo el seleccionado)
                                    const drawerServicesCount = selectedService 
                                        ? services.filter(s => (s.id || (s as any).Id) !== selectedService).length
                                        : services.length;
                                    return drawerServicesCount > 0 
                                        ? `${drawerServicesCount} ${drawerServicesCount === 1 ? 'servicio' : 'servicios'}` 
                                        : 'Sin servicios';
                                })()}
                            </h2>
                            <button
                                onClick={() => setIsDrawerOpen(false)}
                                className="p-2 -mr-2 text-gray-600 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-100"
                                aria-label="Cerrar"
                            >
                                <X className="w-5 h-5" />
                            </button>
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
                        onTouchStart={(e) => {
                            touchStartY.current = e.touches[0].clientY;
                        }}
                        onTouchMove={(e) => {
                            const isMobile = window.innerWidth < 1024;
                            if (!isMobile) return;
                            
                            const touchY = e.touches[0].clientY;
                            const deltaY = touchStartY.current - touchY; // Positivo = arrastrando hacia arriba
                            const target = e.currentTarget;
                            
                            // Si está en el tope (scrollTop = 0) y arrastra hacia abajo, cerrar
                            if (target.scrollTop <= 0 && deltaY < -30) {
                                setIsDrawerOpen(false);
                                setIsDrawerVisible(false);
                                return;
                            }
                            
                            // Calcular altura basada en el scroll y el touch (máximo hasta el topbar)
                            const scrollPercent = Math.min(target.scrollTop / 100, 1);
                            const heightRange = maxDrawerHeight - 60; // Rango de expansión
                            const newHeight = Math.max(40, Math.min(maxDrawerHeight, 60 + (scrollPercent * heightRange)));
                            setDrawerHeight(Math.round(newHeight));
                        }}
                        onScroll={(e) => {
                            const target = e.currentTarget;
                            const isMobile = window.innerWidth < 1024;
                            
                            if (!isMobile) return;
                            
                            // Detectar dirección del scroll
                            const scrollingDown = target.scrollTop > lastScrollTop.current;
                            lastScrollTop.current = target.scrollTop;
                            
                            // Si está arriba del todo y hace scroll hacia arriba, cerrar
                            if (target.scrollTop <= 0 && !scrollingDown && drawerHeight <= 60) {
                                // El usuario está intentando hacer scroll hacia arriba pero ya está arriba
                                // Esto se maneja en onTouchMove
                            }
                            
                            // Calcular altura del drawer basada en el scroll (máximo hasta el topbar)
                            const scrollPercent = Math.min(target.scrollTop / 100, 1);
                            const heightRange = maxDrawerHeight - 60;
                            const newHeight = 60 + (scrollPercent * heightRange);
                            setDrawerHeight(Math.round(newHeight));
                        }}
                        style={{
                            overscrollBehavior: 'none',
                            WebkitOverflowScrolling: 'touch',
                            touchAction: 'pan-y'
                        }}
                    >
                        {/* Services List - Estilo Airbnb */}
                        {/* ✅ Excluir el servicio seleccionado del drawer - solo mostrar los demás */}
                        {(() => {
                            // Filtrar servicios para excluir el seleccionado (que está en la Floating Card)
                            const drawerServices = services.filter(service => {
                                const serviceId = service.id || (service as any).Id;
                                return serviceId !== selectedService;
                            });
                            
                            return (
                                <div style={{ padding: '0 16px' }}>
                                    {drawerServices.length > 0 ? (
                                        <div 
                                            className="grid grid-cols-2" 
                                            style={{ gap: '24px 16px', paddingTop: '8px', paddingBottom: '24px' }}
                                        >
                                            {drawerServices.map((service) => (
                                                <MapServiceCard
                                                    key={service.id || service.Id}
                                                    service={service}
                                                    isSelected={false}
                                                    onSelect={handleServiceSelect}
                                                />
                                            ))}
                                </div>
                            ) : (
                                <div className="py-12 text-center">
                                    <p className="text-sm text-gray-500">
                                        {selectedService 
                                            ? 'El servicio seleccionado está en la tarjeta flotante' 
                                            : 'No hay servicios disponibles'}
                                    </p>
                                </div>
                            )}
                                </div>
                            );
                        })()}
                    </div>
                </ResponsiveModal>
        </div>
    );
}