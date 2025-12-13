import { useState, useEffect, useRef } from 'react';
import { useWindowSize } from '../hooks/useWindowSize';
import { ArrowRight, ArrowLeft, Search, X, Star, CheckCircle, User, Info, MapPin, Award, Zap, Shield, TrendingUp, Clock, FileText, Image, Video } from 'lucide-react';
import { ImageCarousel } from './ui/image-carousel';
import { useLoadScript } from '@react-google-maps/api';
import { useServices } from '../hooks/useServices';
import { useMapExperts } from '../hooks/useMapExperts';
import { LocationMap } from './LocationMap';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { Input } from './ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose } from './ui/drawer';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Slider } from './ui/slider';
import { Label } from './ui/label';
import CountryFlag from './CountryFlag';
import CountrySelector from './CountrySelector';
import { getCountryCoordinates } from '../utils/countryCoordinates';
import { getCountryName } from '../utils/countries';
import Autocomplete from 'react-google-autocomplete';

const libraries: ('drawing' | 'geometry' | 'places')[] = ['drawing', 'geometry', 'places'];
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
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [filters, setFilters] = useState({
        priceRange: [0, 100000] as [number, number], // [min, max] en euros - rango amplio para servicios premium
        rating: 0 as number, // Mínimo de estrellas (0-5)
    });
   
    // Cargar servicios cuando hay ubicación seleccionada
    const { services: allServices, isLoading: isLoadingServices } = useServices({
        categoryId: selectedCategory || undefined,
        serviceTypeId: serviceTypeId || undefined,
        latitude: formData.latitude || undefined,
        longitude: formData.longitude || undefined,
        locationRange: formData.locationRange ? parseInt(formData.locationRange) : undefined,
    });
   
    // Cargar posiciones de expertos para el mapa
    const { experts: mapExperts } = useMapExperts(
        selectedCategory,
        serviceTypeId
    );
   
    // Aplicar filtros a servicios
    const services = allServices.filter(service => {
        // El precio viene directamente en euros
        const price = service.price || 0;
        if (price < filters.priceRange[0] || price > filters.priceRange[1]) {
            if (service.id === 154) {
                console.log(`🔍 SearchParameterForm: Service 154 filtered by price - price: ${price}, range: [${filters.priceRange[0]}, ${filters.priceRange[1]}]`);
            }
            return false;
        }
        
        const rating = service.averageRating || 0;
        if (rating < filters.rating) {
            if (service.id === 154) {
                console.log(`🔍 SearchParameterForm: Service 154 filtered by rating - rating: ${rating}, minRating: ${filters.rating}`);
            }
            return false;
        }
        
        if (service.id === 154) {
            console.log('✅ SearchParameterForm: Service 154 PASSED all filters');
        }
        
        return true;
    });
    
    // Ref para rastrear si ya se abrió el drawer para esta ubicación
    const lastLocationRef = useRef<string>('');
    const hasOpenedDrawerRef = useRef<boolean>(false);
    
    // Abrir drawer automáticamente cuando hay servicios disponibles en móvil (solo una vez por ubicación)
    useEffect(() => {
        const locationKey = `${formData.latitude}-${formData.longitude}`;
        const isMobile = window.innerWidth < 1024;
        
        if (
            formData.latitude && 
            formData.longitude && 
            allServices.length > 0 && 
            isMobile &&
            locationKey !== lastLocationRef.current &&
            !hasOpenedDrawerRef.current
        ) {
            lastLocationRef.current = locationKey;
            hasOpenedDrawerRef.current = true;
            // No abrir automáticamente, solo marcar que se puede abrir
        }
        
        // Reset cuando cambia la ubicación
        if (locationKey !== lastLocationRef.current) {
            hasOpenedDrawerRef.current = false;
        }
    }, [formData.latitude, formData.longitude, allServices.length]);
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
        const service154 = allServices.find(s => s.id === 154);
        console.log('🔍 [DEBUG] Servicios cargados:', {
            totalServices: allServices.length,
            filteredServices: services.length,
            isLoading: isLoadingServices,
            service154InAll: !!service154,
            service154InFiltered: !!services.find(s => s.id === 154),
            service154Price: service154 ? service154.price : null,
            filters: filters,
            services: services.map(s => ({
                id: s.id,
                name: s.expert?.user?.name,
                price: s.price,
                rating: s.averageRating,
                categoryName: s.categoryName,
                serviceTypeName: s.serviceTypeName
            }))
        });
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
    const handleServiceSelect = (serviceId: number) => {
        setSelectedService(serviceId);
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
        <div className="bg-white h-[100dvh] flex flex-col overflow-hidden fixed inset-0 z-[100]" style={{ paddingTop: '64px' }}>
            {/* Header - Oculto porque el timeline ya lo maneja */}
            <header className="hidden">
                <div className="h-14 px-4 flex items-center justify-between w-full">
                    {/* Botón volver */}
                    <button
                        onClick={() => setCurrentStep(0)}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-800" />
                    </button>
                    
                    {/* Steps indicator - Estilo Airbnb - Responsive */}
                    <div className="flex items-center gap-1.5 sm:gap-3 flex-1 justify-center px-2 sm:px-4">
                        <div className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                            formData.latitude && formData.longitude 
                                ? 'bg-gray-900 text-white shadow-md' 
                                : 'bg-gray-100 text-gray-600'
                        }`}>
                            <span className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold ${
                                formData.latitude && formData.longitude 
                                    ? 'bg-white/20 text-white' 
                                    : 'bg-gray-300 text-gray-600'
                            }`}>1</span>
                            <span className="hidden sm:inline">Ubicación</span>
                        </div>
                        <div className={`w-4 sm:w-10 h-[2px] transition-colors ${
                            formData.latitude && formData.longitude 
                                ? 'bg-gray-900' 
                                : 'bg-gray-200'
                        }`} />
                        <div className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                            selectedService 
                                ? 'bg-gray-900 text-white shadow-md' 
                                : 'bg-gray-100 text-gray-400'
                        }`}>
                            <span className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold ${
                                selectedService 
                                    ? 'bg-white/20 text-white' 
                                    : 'bg-gray-300 text-gray-400'
                            }`}>2</span>
                            <span className="hidden sm:inline">Experto</span>
                        </div>
                        <div className="w-4 sm:w-10 h-[2px] bg-gray-200" />
                        <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold bg-gray-100 text-gray-400">
                            <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gray-300 text-gray-400 flex items-center justify-center text-[10px] sm:text-xs font-bold">3</span>
                            <span className="hidden sm:inline">Pago</span>
                        </div>
                    </div>
                    
                    {/* Spacer */}
                    <div className="w-8 flex-shrink-0" />
                </div>
            </header>
                   
            {/* Main Layout - Split View */}
            <div className="flex flex-1 min-h-0 overflow-hidden w-full">
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
                                    <button className={`h-9 px-4 rounded-full border text-sm font-medium transition-all ${
                                        filters.priceRange[0] > 0 || filters.priceRange[1] < 100000
                                            ? 'border-gray-900 bg-gray-900 text-white'
                                            : 'border-gray-300 bg-white text-gray-700 hover:border-gray-900'
                                    }`}>
                                        Precio
                                    </button>
                                        </PopoverTrigger>
                                <PopoverContent className="w-72 p-5" align="start">
                                            <div className="space-y-4">
                                        <h4 className="font-semibold text-gray-900">Rango de precio</h4>
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
                                        </PopoverContent>
                                    </Popover>
                                    
                                    <Popover>
                                        <PopoverTrigger asChild>
                                    <button className={`h-9 px-4 rounded-full border text-sm font-medium transition-all flex items-center gap-1.5 ${
                                        filters.rating > 0
                                            ? 'border-gray-900 bg-gray-900 text-white'
                                            : 'border-gray-300 bg-white text-gray-700 hover:border-gray-900'
                                    }`}>
                                        <Star className="w-3.5 h-3.5" />
                                        {filters.rating > 0 ? `${filters.rating}+` : 'Valoración'}
                                    </button>
                                        </PopoverTrigger>
                                <PopoverContent className="w-64 p-5" align="start">
                                            <div className="space-y-4">
                                        <h4 className="font-semibold text-gray-900">Valoración mínima</h4>
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
                                        </PopoverContent>
                                    </Popover>
                            
                            {(filters.priceRange[0] > 0 || filters.priceRange[1] < 100000 || filters.rating > 0) && (
                                <button 
                                    onClick={() => setFilters({ priceRange: [0, 100000], rating: 0 })}
                                    className="text-sm font-medium text-gray-900 underline ml-auto"
                                >
                                    Borrar
                                </button>
                            )}
                            </div>
                    )}
                    
                    {/* Lista de servicios */}
                    <div className="flex-1 overflow-y-auto">
                        {formData.latitude && formData.longitude && (
                            <div className="p-4 pb-6">
                            {/* Services List - Desktop Balanced Professional Style */}
                            {services.length > 0 ? (
                                <div className="space-y-4">
                                    {services.map((service) => {
                                        const isSelected = selectedService === service.id;
                                        
                                        // Datos detallados
                                        const availability = service.expert?.currentAvailability;
                                        const days = availability?.daysOfWeek?.map(d => d.slice(0, 3)).join(', ') || 'Consultar';
                                        const hours = availability ? `${availability.startTime?.slice(0,5)} - ${availability.endTime?.slice(0,5)}` : '';
                                        
                                        const deliverables = [
                                            { type: 'pdf', label: 'Informe' },
                                            { type: 'image', label: 'Fotos' },
                                            { type: 'video', label: 'Video' }
                                        ];

                                        return (
                                            <div
                                                key={service.id}
                                                className={`group cursor-pointer transition-all duration-300 bg-white rounded-xl overflow-hidden border ${
                                                    isSelected 
                                                        ? 'border-blue-600 ring-1 ring-blue-600 shadow-md' 
                                                        : 'border-gray-200 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] hover:border-blue-300 hover:shadow-md'
                                                }`}
                                                onClick={() => handleServiceSelect(service.id)}
                                            >
                                                <div className="p-4 flex gap-4">
                                                    {/* 1. AVATAR EXPERTO (Balanced) */}
                                                    <div className="flex-shrink-0 flex flex-col items-center gap-2">
                                                        <div className="w-[68px] h-[68px] rounded-full border-[3px] border-white shadow-sm overflow-hidden bg-gray-50 ring-1 ring-gray-100 group-hover:ring-blue-200 transition-all">
                                                            {service.expert?.profilePictureUrl ? (
                                                                <img
                                                                    src={service.expert.profilePictureUrl}
                                                                    alt={service.expert?.user?.name}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center">
                                                                    <User className="w-8 h-8 text-gray-300" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-1 bg-white border border-gray-100 px-2 py-0.5 rounded-full shadow-sm">
                                                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                                            <span className="text-xs font-bold text-gray-700">{service.averageRating?.toFixed(1) || '5.0'}</span>
                                                        </div>
                                                    </div>

                                                    {/* 2. INFO TÉCNICA (Balanced) */}
                                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                        {/* Header */}
                                                        <div className="flex justify-between items-start mb-3">
                                                            <div>
                                                                <h3 className="text-[15px] font-bold text-gray-900 leading-tight mb-0.5 group-hover:text-blue-700 transition-colors">
                                                                    {service.expert?.user?.name || 'Experto Profesional'}
                                                                </h3>
                                                                <p className="text-xs text-slate-500 font-medium">
                                                                    {service.categoryName}
                                                                </p>
                                                            </div>
                                                            <div className="text-right pl-2">
                                                                <span className="text-lg font-bold text-gray-900 block leading-none">{service.price}€</span>
                                                                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Total</span>
                                                            </div>
                                                        </div>

                                                        {/* Detalles Grid con Toques de Color Suave */}
                                                        <div className="bg-slate-50/80 rounded-lg p-2.5 border border-slate-100">
                                                            <div className="grid grid-cols-1 gap-2.5">
                                                                {/* Disponibilidad */}
                                                                <div className="flex items-start gap-2.5">
                                                                    <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                                        <Clock className="w-3 h-3 text-blue-600" />
                                                                    </div>
                                                                    <div className="min-w-0 flex-1">
                                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Disponibilidad</p>
                                                                        <p className="text-xs text-slate-700 font-medium truncate">
                                                                            {days} <span className="text-slate-300 mx-1">|</span> {hours || 'Flexible'}
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                {/* Entrega */}
                                                                <div className="flex items-start gap-2.5">
                                                                    <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                                        <CheckCircle className="w-3 h-3 text-emerald-600" />
                                                                    </div>
                                                                    <div className="min-w-0 flex-1">
                                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Incluye</p>
                                                                        <div className="flex flex-wrap gap-1.5">
                                                                            {deliverables.map((d, i) => (
                                                                                <div key={i} className="flex items-center gap-1 text-[11px] text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-100 shadow-sm">
                                                                                    {d.type === 'pdf' && <FileText className="w-3 h-3 text-slate-400" />}
                                                                                    {d.type === 'image' && <Image className="w-3 h-3 text-slate-400" />}
                                                                                    {d.type === 'video' && <Video className="w-3 h-3 text-slate-400" />}
                                                                                    <span>{d.label}</span>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
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
                
                    {/* Continue Button - Fijo en la parte inferior */}
                    {formData.latitude && formData.longitude && services.length > 0 && (
                        <div className="flex-shrink-0 border-t border-gray-200 bg-white">
                            <div className="px-6 py-4">
                                <button
                                    onClick={handleContinue}
                                    disabled={!selectedService}
                                    className={`w-full h-12 rounded-lg text-base font-semibold transition-all shadow-sm ${
                                        selectedService
                                            ? 'bg-[#0066CC] hover:bg-[#0052A3] text-white shadow-md hover:shadow-lg'
                                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    }`}
                                >
                                    {selectedService ? 'Continuar' : 'Selecciona un experto'}
                                </button>
                        </div>
                        </div>
                    )}
                    </div>
                    
                {/* Mobile: Map View */}
                <div className="lg:hidden flex-1 relative w-full">
                        {loadError ? (
                        <div className="h-full flex items-center justify-center bg-gray-100">
                            <div className="text-red-500">Error al cargar el mapa</div>
                            </div>
                        ) : (
                            <>
                            {/* Barra de búsqueda móvil - Tamaños dinámicos basados en ancho real */}
                            <div className="absolute top-4 left-4 right-4 z-[9998] pointer-events-none" style={{ top: isLargeMobile ? '24px' : '16px', left: isLargeMobile ? '24px' : '16px', right: isLargeMobile ? '24px' : '16px' }}>
                                <div className="pointer-events-auto w-full mx-auto" style={{ maxWidth: isLargeMobile ? '800px' : isMediumMobile ? '700px' : '600px' }}>
                                    <div 
                                        className="bg-white rounded-full shadow-xl border border-gray-200 flex items-center overflow-hidden"
                                        style={{ 
                                            height: `${searchBarHeight}px`,
                                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                                        }}
                                    >
                                        {/* Selector de país y separador juntos - Sin espacio entre ellos */}
                                        <div className="flex items-center flex-shrink-0" style={{ marginRight: '0' }}>
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
                                                setSelectedAddress('');
                                            }}
                                            currentCountry={selectedCountry}
                                                style={{
                                                    height: `${searchBarHeight}px`,
                                                    paddingLeft: `${searchBarPadding}px`,
                                                    paddingRight: '0px',
                                                    marginRight: '0px',
                                                    gap: isLargeMobile ? '8px' : '6px',
                                                    width: 'auto',
                                                    minWidth: 'auto'
                                                }}
                                                className="flex items-center"
                                        />
                                            {/* Separador - Inmediatamente después del botón, sin espacio */}
                                            <div 
                                                className="w-px bg-gray-200 flex-shrink-0" 
                                                style={{ 
                                                    height: `${searchBarHeight * 0.6}px`,
                                                    marginLeft: '0px',
                                                    marginRight: '0px'
                                                }}
                                            />
                                        </div>
                                        
                                        {/* Campo de búsqueda - Tamaños dinámicos */}
                                        <div className="flex-1 relative min-w-0">
                                            {isLoaded ? (
                                                <Autocomplete
                                                    onPlaceSelected={handlePlaceSelected}
                                                    options={{
                                                        componentRestrictions: { country: selectedCountry.toLowerCase() },
                                                        fields: ['formatted_address', 'geometry', 'name', 'place_id', 'address_components']
                                                    }}
                                                    style={{
                                                        height: `${searchBarHeight}px`,
                                                        paddingLeft: `${searchBarPadding}px`,
                                                        paddingRight: `${iconSize + searchBarPadding}px`,
                                                        fontSize: `${searchBarTextSize}px`
                                                    }}
                                                    className="w-full text-gray-900 placeholder-gray-500 bg-transparent border-0 focus:outline-none truncate"
                                                    placeholder="Buscar ciudad o dirección..."
                                                    disabled={isGeocoding}
                                                />
                                            ) : (
                                                <input
                                                type="text"
                                                    placeholder="Cargando mapa..."
                                                    disabled
                                                    style={{
                                                        height: `${searchBarHeight}px`,
                                                        paddingLeft: `${searchBarPadding}px`,
                                                        paddingRight: `${iconSize + searchBarPadding}px`,
                                                        fontSize: `${searchBarTextSize}px`
                                                    }}
                                                    className="w-full text-gray-400 placeholder-gray-400 bg-transparent border-0 truncate"
                                                />
                                            )}
                                            {isGeocoding ? (
                                                <div 
                                                    className="absolute top-1/2 -translate-y-1/2 pointer-events-none"
                                                    style={{ right: `${searchBarPadding}px` }}
                                                >
                                                    <div 
                                                        className="border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"
                                                        style={{ width: `${iconSize}px`, height: `${iconSize}px` }}
                                                    />
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
                                                    className="absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                                                    style={{ right: `${searchBarPadding}px` }}
                                                >
                                                    <X style={{ width: `${iconSize}px`, height: `${iconSize}px` }} />
                                                </button>
                                            ) : (
                                                <Search 
                                                    className="absolute top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                                                    style={{ right: `${searchBarPadding}px`, width: `${iconSize}px`, height: `${iconSize}px` }}
                                                />
                                            )}
                                        </div>
                                        </div>
                                    </div>
                                </div>
                                
                            {/* Map - ocupa todo el espacio */}
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
                                
                            {/* Floating Button - Siempre visible en la parte inferior */}
                                {formData.latitude && formData.longitude && (
                                <div className="absolute bottom-[env(safe-area-inset-bottom,16px)] left-1/2 transform -translate-x-1/2 z-[100] pb-4">
                                        <Button
                                            onClick={() => setIsDrawerOpen(true)}
                                            size="lg"
                                        className={`shadow-2xl border-2 h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base rounded-full font-semibold transition-all ${
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
                </div>
                
                {/* Desktop: Right Side - Map */}
                <div className="hidden lg:flex lg:flex-1 relative bg-gray-100">
                        {loadError ? (
                        <div className="h-full w-full flex items-center justify-center bg-gray-100">
                            <div className="text-red-500">Error al cargar el mapa</div>
                            </div>
                        ) : (
                            <>
                            {/* Barra de búsqueda desktop - Estilo Airbnb Compacto */}
                            <div className="absolute top-6 left-6 z-[9999] pointer-events-none">
                                <div className="w-[400px] pointer-events-auto">
                                    <div className="bg-white rounded-full shadow-2xl hover:shadow-3xl border border-gray-200 flex items-center overflow-hidden transition-all duration-300">
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
                                                setSelectedAddress('');
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
                            </div>
                            </>
                        )}
                    </div>
                </div>
                
                {/* Mobile Drawer with Services */}
                <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                    <DrawerContent className="max-h-[85vh] flex flex-col rounded-t-[24px] bg-gray-50 outline-none">
                        {/* Handle minimalista */}
                        <div className="flex justify-center pt-3 pb-2 bg-white rounded-t-[24px]">
                            <div className="w-12 h-1.5 bg-gray-200 rounded-full" />
                        </div>
                        
                        {/* Sin Header ni Filtros molestos, directo al contenido limpio */}
                        <div className="flex-1 overflow-y-auto bg-gray-50/50">
                            {/* Services List - Balanced Professional Style */}
                            <div className="px-3 py-3">
                                {services.length > 0 ? (
                                    <div className="space-y-4">
                                        {services.map((service) => {
                                            const isSelected = selectedService === service.id;
                                            
                                            // Datos detallados
                                            const availability = service.expert?.currentAvailability;
                                            const days = availability?.daysOfWeek?.map(d => d.slice(0, 3)).join(', ') || 'Consultar';
                                            const hours = availability ? `${availability.startTime?.slice(0,5)} - ${availability.endTime?.slice(0,5)}` : '';
                                            
                                            const deliverables = [
                                                { type: 'pdf', label: 'Informe' },
                                                { type: 'image', label: 'Fotos' },
                                                { type: 'video', label: 'Video' }
                                            ];

                                            return (
                                                <div
                                                    key={service.id}
                                                    className={`group cursor-pointer transition-all duration-300 bg-white rounded-xl overflow-hidden border ${
                                                        isSelected 
                                                            ? 'border-blue-600 ring-1 ring-blue-600 shadow-md' 
                                                            : 'border-gray-200 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] hover:border-blue-300 hover:shadow-md'
                                                    }`}
                                                    onClick={() => handleServiceSelect(service.id)}
                                                >
                                                    <div className="p-4 flex gap-4">
                                                        {/* 1. AVATAR EXPERTO (Balanced) */}
                                                        <div className="flex-shrink-0 flex flex-col items-center gap-2">
                                                            <div className="w-[68px] h-[68px] rounded-full border-[3px] border-white shadow-sm overflow-hidden bg-gray-50 ring-1 ring-gray-100 group-hover:ring-blue-200 transition-all">
                                                                {service.expert?.profilePictureUrl ? (
                                                                    <img
                                                                        src={service.expert.profilePictureUrl}
                                                                        alt={service.expert?.user?.name}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center">
                                                                        <User className="w-8 h-8 text-gray-300" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {/* Rating (Solo si tiene) */}
                                                            {service.averageRating && service.averageRating > 0 && (
                                                                <div className="flex items-center gap-1 bg-white border border-gray-100 px-2 py-0.5 rounded-full shadow-sm">
                                                                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                                                    <span className="text-xs font-bold text-gray-700">{service.averageRating.toFixed(1)}</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* 2. INFO TÉCNICA (Balanced) */}
                                                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                            {/* Header */}
                                                            <div className="flex justify-between items-start mb-3">
                                                                <div>
                                                                    <h3 className="text-[15px] font-bold text-gray-900 leading-tight mb-0.5 group-hover:text-blue-700 transition-colors">
                                                                        {service.expert?.user?.name || 'Experto Profesional'}
                                                                    </h3>
                                                                    <p className="text-xs text-slate-500 font-medium">
                                                                        {service.categoryName}
                                                                    </p>
                                                                </div>
                                                                <div className="text-right pl-2">
                                                                    <span className="text-lg font-bold text-gray-900 block leading-none">{service.price}€</span>
                                                                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Total</span>
                                                                </div>
                                                            </div>

                                                            {/* Detalles Grid con Toques de Color Suave */}
                                                            <div className="bg-slate-50/80 rounded-lg p-2.5 border border-slate-100">
                                                                <div className="grid grid-cols-1 gap-2.5">
                                                                    {/* Disponibilidad */}
                                                                    <div className="flex items-start gap-2.5">
                                                                        <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                                            <Clock className="w-3 h-3 text-blue-600" />
                                                                        </div>
                                                                        <div className="min-w-0 flex-1">
                                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Disponibilidad</p>
                                                                            <p className="text-xs text-slate-700 font-medium truncate">
                                                                                {days} <span className="text-slate-300 mx-1">|</span> {hours || 'Flexible'}
                                                                            </p>
                                                                        </div>
                                                                    </div>

                                                                    {/* Entrega */}
                                                                    <div className="flex items-start gap-2.5">
                                                                        <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                                                                        </div>
                                                                        <div className="min-w-0 flex-1">
                                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Incluye</p>
                                                                            <div className="flex flex-wrap gap-1.5">
                                                                                {deliverables.map((d, i) => (
                                                                                    <div key={i} className="flex items-center gap-1 text-[11px] text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-100 shadow-sm">
                                                                                        {d.type === 'pdf' && <FileText className="w-3 h-3 text-slate-400" />}
                                                                                        {d.type === 'image' && <Image className="w-3 h-3 text-slate-400" />}
                                                                                        {d.type === 'video' && <Video className="w-3 h-3 text-slate-400" />}
                                                                                        <span>{d.label}</span>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="py-12 text-center">
                                        <p className="text-sm text-gray-500">No hay servicios disponibles</p>
                                    </div>
                        )}
                        </div>
                    </div>
                        
                        {/* Continue Button */}
                        {services.length > 0 && (
                            <div className="border-t border-gray-200 bg-white px-4 py-3 flex-shrink-0">
                                <button
                                    onClick={() => {
                                        handleContinue();
                                        setIsDrawerOpen(false);
                                    }}
                                    disabled={!selectedService}
                                    className={`w-full h-11 rounded-lg text-sm font-semibold transition-all ${
                                        selectedService
                                            ? 'bg-[#0066CC] hover:bg-[#0052A3] text-white'
                                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    }`}
                                >
                                    {selectedService ? 'Continuar' : 'Selecciona un experto'}
                                </button>
                </div>
                        )}
                    </DrawerContent>
                </Drawer>
        </div>
    );
}