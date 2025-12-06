import { useState, useEffect, useRef } from 'react';
import { ArrowRight, ArrowLeft, Search, X, Star, CheckCircle, User, Info, MapPin, Award, Zap, Shield, TrendingUp, Clock } from 'lucide-react';
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
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: "__REDACTED_GOOGLE_API_KEY__",
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
        <div className="bg-white h-[100dvh] flex flex-col overflow-hidden fixed inset-0">
            {/* Header - Estilo Airbnb minimalista */}
            <header className="z-50 bg-white border-b border-gray-200 flex-shrink-0">
                <div className="h-14 px-4 flex items-center justify-between">
                    {/* Botón volver */}
                    <button
                        onClick={() => setCurrentStep(0)}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-800" />
                    </button>
                    
                    {/* Steps indicator - Estilo Airbnb */}
                    <div className="flex items-center gap-2">
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                            formData.latitude && formData.longitude 
                                ? 'bg-black text-white' 
                                : 'bg-gray-100 text-gray-600'
                        }`}>
                            <span className="w-4 h-4 rounded-full bg-current/20 flex items-center justify-center text-[10px]">1</span>
                            Ubicación
                        </div>
                        <div className="w-8 h-[2px] bg-gray-200" />
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                            selectedService 
                                ? 'bg-black text-white' 
                                : 'bg-gray-100 text-gray-400'
                        }`}>
                            <span className="w-4 h-4 rounded-full bg-current/20 flex items-center justify-center text-[10px]">2</span>
                            Experto
                        </div>
                        <div className="w-8 h-[2px] bg-gray-200" />
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-400">
                            <span className="w-4 h-4 rounded-full bg-current/20 flex items-center justify-center text-[10px]">3</span>
                            Pago
                        </div>
                    </div>
                    
                    {/* Spacer */}
                    <div className="w-8" />
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
                                {/* Services List - Estilo Airbnb */}
                                {services.length > 0 ? (
                                    <div className="space-y-4">
                                        {services.map((service) => {
                                            const allImages = service.imageUrls && service.imageUrls.length > 0
                                                ? service.imageUrls
                                                : (service.expert?.profilePictureUrl ? [service.expert.profilePictureUrl] : []);
                                            const isSelected = selectedService === service.id;
                                            const reviewCount = service.expert?.reviews?.length || 0;
                                            
                                            return (
                                                <div
                                                    key={service.id}
                                                    className={`group cursor-pointer transition-all duration-200 rounded-2xl overflow-hidden ${
                                                        isSelected
                                                            ? 'ring-2 ring-black shadow-lg'
                                                            : 'hover:shadow-md'
                                                    }`}
                                                    onClick={() => handleServiceSelect(service.id)}
                                                >
                                                    {/* Card horizontal estilo Airbnb */}
                                                    <div className="flex bg-white">
                                                        {/* Imagen */}
                                                        <div className="w-[140px] h-[140px] flex-shrink-0 relative" onClick={(e) => e.stopPropagation()}>
                                                            {allImages.length > 0 ? (
                                                                <ImageCarousel
                                                                    images={allImages}
                                                                    alt={service.expert?.user?.name || 'Experto'}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                                                    <User className="w-10 h-10 text-gray-300" />
                                                                </div>
                                                            )}
                                                            {/* Badge verificado */}
                                                            {service.expert?.stripeAccountId && (
                                                                <div className="absolute top-2 left-2 bg-white/95 backdrop-blur-sm px-2 py-1 rounded-md text-[10px] font-medium text-gray-800 shadow-sm">
                                                                    Verificado
                                                                </div>
                                                            )}
                                                        </div>
                                                        
                                                        {/* Contenido */}
                                                        <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                                                            {/* Header */}
                                                            <div>
                                                                {/* Categoría y ubicación */}
                                                                <p className="text-[11px] text-gray-500 uppercase tracking-wide mb-0.5">
                                                                    {service.categoryName || 'Servicio'}
                                                                </p>
                                                                
                                                                {/* Nombre */}
                                                                <h3 className="text-[15px] font-medium text-gray-900 leading-snug mb-1 line-clamp-1">
                                                                    {service.expert?.user?.name || 'Experto profesional'}
                                                                </h3>
                                                                
                                                                {/* Descripción */}
                                                                <p className="text-[13px] text-gray-500 line-clamp-2 leading-relaxed">
                                                                    {service.conditions || 'Servicio profesional de inspección'}
                                                                </p>
                                                            </div>
                                                            
                                                            {/* Footer */}
                                                            <div className="flex items-end justify-between mt-2">
                                                                {/* Rating */}
                                                                <div className="flex items-center gap-1">
                                                                    <Star className="w-3.5 h-3.5 fill-gray-900 text-gray-900" />
                                                                    <span className="text-[13px] font-medium text-gray-900">
                                                                        {service.averageRating?.toFixed(1) || 'Nuevo'}
                                                                    </span>
                                                                    {reviewCount > 0 && (
                                                                        <span className="text-[13px] text-gray-500">
                                                                            ({reviewCount})
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                
                                                                {/* Precio */}
                                                                <div className="text-right">
                                                                    <span className="text-[15px] font-semibold text-gray-900">
                                                                        {service.price || 0} €
                                                                    </span>
                                                                    <span className="text-[12px] text-gray-500 ml-1">
                                                                        total
                                                                    </span>
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
                            {/* Barra de búsqueda móvil - Estilo Airbnb */}
                            <div className="absolute top-3 left-3 right-3 z-[9999] pointer-events-none">
                                <div className="pointer-events-auto">
                                    <div className="bg-white rounded-full shadow-lg border border-gray-200 flex items-center overflow-visible">
                                        {/* Selector de país */}
                                        <CountrySelector
                                            onCountrySelect={(countryCode, coordinates) => {
                                                setSelectedCountry(countryCode);
                                                if (map) {
                                                    map.setCenter({ lat: coordinates.lat, lng: coordinates.lng });
                                                    map.setZoom(coordinates.zoom);
                                                }
                                                // Actualizar coordenadas automáticamente al cambiar país
                                                setFormData(prev => ({
                                                    ...prev,
                                                    latitude: coordinates.lat.toString(),
                                                    longitude: coordinates.lng.toString(),
                                                    locationName: getCountryName(countryCode) || '',
                                                }));
                                                setSelectedLocation({ lat: coordinates.lat, lng: coordinates.lng });
                                                // Limpiar búsqueda al cambiar país
                                                setSearchAddress('');
                                                setSelectedAddress('');
                                            }}
                                            currentCountry={selectedCountry}
                                        />
                                        
                                        <div className="w-px h-6 bg-gray-200" />
                                        
                                        {/* Campo de búsqueda */}
                                        <div className="flex-1 relative">
                                            {isLoaded ? (
                                                <Autocomplete
                                                    onPlaceSelected={handlePlaceSelected}
                                                    options={{
                                                        componentRestrictions: { country: selectedCountry.toLowerCase() },
                                                        fields: ['formatted_address', 'geometry', 'name', 'place_id', 'address_components']
                                                    }}
                                                    className="w-full h-11 pl-3 pr-10 text-sm text-gray-900 placeholder-gray-500 bg-transparent border-0 focus:outline-none"
                                                    placeholder="Buscar ciudad o dirección..."
                                                    disabled={isGeocoding}
                                                />
                                            ) : (
                                                <input
                                                    type="text"
                                                    placeholder="Cargando mapa..."
                                                    disabled
                                                    className="w-full h-11 pl-3 pr-10 text-sm text-gray-400 placeholder-gray-400 bg-transparent border-0"
                                                />
                                            )}
                                            {isGeocoding ? (
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                                    <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
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
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            ) : (
                                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
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
                                        className={`shadow-2xl border-2 h-12 px-6 ${
                                            services.length === 0 
                                                ? 'bg-background/95 backdrop-blur-sm border-muted-foreground/30 text-muted-foreground' 
                                                : 'bg-primary border-primary text-primary-foreground hover:bg-primary/90'
                                        }`}
                                        disabled={services.length === 0}
                                    >
                                        <MapPin className="w-4 h-4 mr-2" />
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
                            {/* Barra de búsqueda estilo Airbnb */}
                            <div className="absolute top-4 left-4 right-4 z-[9999] pointer-events-none">
                                <div className="max-w-lg pointer-events-auto">
                                    <div className="bg-white rounded-full shadow-lg border border-gray-200 flex items-center overflow-visible hover:shadow-xl transition-shadow">
                                        {/* Selector de país integrado */}
                                        <CountrySelector
                                            onCountrySelect={(countryCode, coordinates) => {
                                                setSelectedCountry(countryCode);
                                                if (map) {
                                                    map.setCenter({ lat: coordinates.lat, lng: coordinates.lng });
                                                    map.setZoom(coordinates.zoom);
                                                }
                                                // Actualizar coordenadas automáticamente al cambiar país
                                                setFormData(prev => ({
                                                    ...prev,
                                                    latitude: coordinates.lat.toString(),
                                                    longitude: coordinates.lng.toString(),
                                                    locationName: getCountryName(countryCode) || '',
                                                }));
                                                setSelectedLocation({ lat: coordinates.lat, lng: coordinates.lng });
                                                // Limpiar búsqueda al cambiar país
                                                setSearchAddress('');
                                                setSelectedAddress('');
                                            }}
                                            currentCountry={selectedCountry}
                                        />
                                        
                                        {/* Separador */}
                                        <div className="w-px h-6 bg-gray-200" />
                                        
                                        {/* Campo de búsqueda */}
                                        <div className="flex-1 relative">
                                            {isLoaded ? (
                                                <Autocomplete
                                                    onPlaceSelected={handlePlaceSelected}
                                                    options={{
                                                        componentRestrictions: { country: selectedCountry.toLowerCase() },
                                                        fields: ['formatted_address', 'geometry', 'name', 'place_id', 'address_components']
                                                    }}
                                                    className="w-full h-12 pl-4 pr-10 text-sm text-gray-900 placeholder-gray-500 bg-transparent border-0 focus:outline-none focus:ring-0"
                                                    placeholder="Buscar ciudad o dirección..."
                                                    disabled={isGeocoding}
                                                />
                                            ) : (
                                                <input
                                                    type="text"
                                                    placeholder="Cargando mapa..."
                                                    disabled
                                                    className="w-full h-12 pl-4 pr-10 text-sm text-gray-400 placeholder-gray-400 bg-transparent border-0"
                                                />
                                            )}
                                            {isGeocoding ? (
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                                    <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
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
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            ) : (
                                                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
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
                    <DrawerContent className="max-h-[90vh] flex flex-col rounded-t-[20px]">
                        {/* Handle */}
                        <div className="flex justify-center py-2">
                            <div className="w-10 h-1 bg-gray-300 rounded-full" />
                        </div>
                        
                        <DrawerHeader className="border-b border-gray-200 px-4 pb-3 pt-1 flex-shrink-0">
                            <div className="flex items-center justify-between">
                                <div>
                                    <DrawerTitle className="text-lg font-semibold text-gray-900">
                                        {services.length} {services.length === 1 ? 'experto' : 'expertos'}
                                    </DrawerTitle>
                                    <DrawerDescription className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                                        <MapPin className="w-3.5 h-3.5" />
                                        {formData.locationName || 'Ubicación seleccionada'}
                                    </DrawerDescription>
                                </div>
                                <DrawerClose asChild>
                                    <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                                        <X className="w-5 h-5 text-gray-500" />
                                    </button>
                                </DrawerClose>
                            </div>
                        </DrawerHeader>
                        
                        <div className="flex-1 overflow-y-auto bg-gray-50">
                            {/* Filters - Estilo Airbnb */}
                            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
                                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                                    <button 
                                        onClick={() => setFilters({ priceRange: [0, 100000], rating: 0 })}
                                        className={`h-9 px-4 rounded-full border text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                                            filters.priceRange[0] === 0 && filters.priceRange[1] === 100000 && filters.rating === 0
                                                ? 'border-gray-900 bg-gray-900 text-white'
                                                : 'border-gray-300 bg-white text-gray-700'
                                        }`}
                                    >
                                        Todos
                                    </button>
                                    
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <button className={`h-9 px-4 rounded-full border text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                                                filters.priceRange[0] > 0 || filters.priceRange[1] < 100000
                                                    ? 'border-gray-900 bg-gray-900 text-white'
                                                    : 'border-gray-300 bg-white text-gray-700'
                                            }`}>
                                                Precio
                                            </button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-72 p-4" align="start">
                                            <h4 className="font-semibold text-gray-900 mb-3">Rango de precio</h4>
                                            <Slider
                                                value={filters.priceRange}
                                                onValueChange={(value) => setFilters({...filters, priceRange: value as [number, number]})}
                                                min={0}
                                                max={1000}
                                                step={10}
                                                className="w-full mb-3"
                                            />
                                            <div className="flex items-center justify-between text-sm text-gray-600">
                                                <span>€{filters.priceRange[0]}</span>
                                                <span>€{filters.priceRange[1]}+</span>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                    
                                    {[4, 4.5].map((rating) => (
                                        <button
                                            key={rating}
                                            onClick={() => setFilters({...filters, rating: filters.rating === rating ? 0 : rating})}
                                            className={`h-9 px-4 rounded-full border text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 flex items-center gap-1 ${
                                                filters.rating === rating
                                                    ? 'border-gray-900 bg-gray-900 text-white'
                                                    : 'border-gray-300 bg-white text-gray-700'
                                            }`}
                                        >
                                            <Star className="w-3.5 h-3.5" />
                                            {rating}+
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Services List - Mobile Airbnb Style */}
                            <div className="px-4 py-3">
                                {services.length > 0 ? (
                                    <div className="space-y-3">
                                        {services.map((service) => {
                                            const allImages = service.imageUrls && service.imageUrls.length > 0
                                                ? service.imageUrls
                                                : (service.expert?.profilePictureUrl ? [service.expert.profilePictureUrl] : []);
                                            const isSelected = selectedService === service.id;
                                            const reviewCount = service.expert?.reviews?.length || 0;
                                            
                                            return (
                                                <div
                                                    key={service.id}
                                                    className={`cursor-pointer transition-all duration-200 rounded-xl overflow-hidden bg-white ${
                                                        isSelected ? 'ring-2 ring-black' : 'border border-gray-200'
                                                    }`}
                                                    onClick={() => handleServiceSelect(service.id)}
                                                >
                                                    <div className="flex gap-3 p-3">
                                                        {/* Imagen cuadrada */}
                                                        <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                                                            {allImages.length > 0 ? (
                                                                <img
                                                                    src={allImages[0]}
                                                                    alt={service.expert?.user?.name || 'Experto'}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center">
                                                                    <User className="w-8 h-8 text-gray-300" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        
                                                        {/* Info */}
                                                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                                                            <div>
                                                                <p className="text-[10px] text-gray-500 uppercase tracking-wide">
                                                                    {service.categoryName || 'Servicio'}
                                                                </p>
                                                                <h3 className="text-[14px] font-medium text-gray-900 truncate">
                                                                    {service.expert?.user?.name || 'Experto'}
                                                                </h3>
                                                            </div>
                                                            
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-1">
                                                                    <Star className="w-3 h-3 fill-gray-900 text-gray-900" />
                                                                    <span className="text-[12px] font-medium">
                                                                        {service.averageRating?.toFixed(1) || 'Nuevo'}
                                                                    </span>
                                                                    {reviewCount > 0 && (
                                                                        <span className="text-[12px] text-gray-500">({reviewCount})</span>
                                                                    )}
                                                                </div>
                                                                <span className="text-[14px] font-semibold text-gray-900">
                                                                    {service.price || 0} €
                                                                </span>
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