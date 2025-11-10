import { useState, useEffect, useRef } from 'react';
import { ArrowRight, ArrowLeft, Search, X, Star, CheckCircle, User, Info, MapPin } from 'lucide-react';
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
    const [searchAddress, setSearchAddress] = useState<string>('');
    const [selectedAddress, setSelectedAddress] = useState<string>('');
    const [isGeocoding, setIsGeocoding] = useState<boolean>(false);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);

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
        priceRange: [0, 1000] as [number, number], // [min, max] en euros
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
            const price = service.price || 0;
        if (price < filters.priceRange[0] || price > filters.priceRange[1]) return false;
        
            const rating = service.averageRating || 0;
        if (rating < filters.rating) return false;
        
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
        console.log('🔍 [DEBUG] Servicios cargados:', {
            totalServices: allServices.length,
            filteredServices: services.length,
            isLoading: isLoadingServices,
            services: services.map(s => ({
                id: s.id,
                name: s.expert?.user?.name,
                price: s.price,
                categoryName: s.categoryName,
                serviceTypeName: s.serviceTypeName
            }))
        });
    }, [allServices, services, isLoadingServices]);
   
    
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
            setSelectedAddress(address);
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
    // Inicializar Google Places Autocomplete
    useEffect(() => {
        if (isLoaded && searchInputRef.current && !autocomplete) {
            const autoCompleteInstance = new google.maps.places.Autocomplete(searchInputRef.current, {
                types: ['address'],
                componentRestrictions: { country: 'es' }, // Restringir a España
                fields: ['formatted_address', 'geometry', 'name']
            });
            autoCompleteInstance.addListener('place_changed', () => {
                const place = autoCompleteInstance.getPlace();
                if (place.geometry && place.geometry.location) {
                    const newLocation = {
                        lat: place.geometry.location.lat(),
                        lng: place.geometry.location.lng()
                    };
                    
                    const address = place.formatted_address || place.name || '';
                    
                    // Usar la función centralizada para actualizar todo
                    updateLocationAndMap(newLocation, address);
                    
                    // Pequeño delay adicional para asegurar que el mapa se centre correctamente
                    setTimeout(() => {
                        if (map) {
                            map.panTo(newLocation);
                        }
                    }, 150);
                }
            });
            setAutocomplete(autoCompleteInstance);
        }
    }, [isLoaded, autocomplete, map, formData.locationRange]);
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
            locationName: formData.locationName || selectedAddress,
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
        <div className="bg-background h-screen flex flex-col overflow-hidden fixed inset-0 lg:relative lg:h-auto lg:min-h-screen">
            {/* Header Section - Fixed */}
            <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b flex-shrink-0">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setCurrentStep(0)}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Volver
                            </Button>
                            <Separator orientation="vertical" className="h-6" />
                        <div>
                                <h1 className="text-lg font-semibold text-foreground mb-2">
                                    {serviceTypeId === 1 ? 'Inspector especializado' : 'Experto en búsquedas'}
                            </h1>
                                {/* Timeline del proceso */}
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <div className={`flex items-center gap-1 ${formData.latitude && formData.longitude ? 'text-primary' : ''}`}>
                                        <div className={`w-2 h-2 rounded-full ${formData.latitude && formData.longitude ? 'bg-primary' : 'bg-muted'}`} />
                                        <span>Ubicación</span>
                        </div>
                                    <ArrowRight className="w-3 h-3" />
                                    <div className={`flex items-center gap-1 ${selectedService ? 'text-primary' : ''}`}>
                                        <div className={`w-2 h-2 rounded-full ${selectedService ? 'bg-primary' : 'bg-muted'}`} />
                                        <span>Experto</span>
                                    </div>
                                    <ArrowRight className="w-3 h-3" />
                                    <div className="flex items-center gap-1">
                                        <div className="w-2 h-2 rounded-full bg-muted" />
                                        <span>Pago</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
                   
            {/* Main Layout - Split View */}
            <div className="flex flex-1 min-h-0 overflow-hidden max-w-7xl mx-auto">
                {/* Left Side - Form & Results (Desktop only) */}
                <div className="hidden lg:flex flex-1 overflow-y-auto">
                    <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
                        {/* Accordion con instrucciones - Siempre visible */}
                        <Accordion type="single" collapsible defaultValue="instructions" className="mb-6">
                            <AccordionItem value="instructions" className="border-border">
                                <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline py-3">
                                    <div className="flex items-center gap-2">
                                        <Info className="w-4 h-4 text-primary" />
                                        <span>¿Qué hacer en esta página?</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pt-2 pb-4">
                                    <p className="mb-2">
                                        Selecciona una ubicación en el mapa usando la barra de búsqueda o haciendo clic directamente en el mapa.
                                        Una vez seleccionada la ubicación, aparecerán los servicios disponibles en un radio de 25 km.
                                    </p>
                                    <p className="mb-2">
                                        Puedes filtrar los servicios por precio y valoración usando los menús desplegables.
                                        Haz clic en una tarjeta de servicio para seleccionarla y luego presiona "Continuar" para proceder.
                                    </p>
                                    <p>
                                        Las imágenes de los servicios se pueden pasar deslizando o usando las flechas.
                                        Revisa la descripción y los detalles de cada servicio antes de seleccionar.
                                    </p>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                        {/* Services Results - Only show when location is selected */}
                        {formData.latitude && formData.longitude && (
                            <>
                                {/* Filters compactos */}
                                <div className="flex items-center gap-2 mb-4 flex-wrap">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="h-8 text-xs px-3">
                                                {filters.priceRange[0] === 0 && filters.priceRange[1] === 1000 ? 'Precio' : `€${filters.priceRange[0]}-€${filters.priceRange[1]}`}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-80 p-4" align="start">
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-medium">Rango de Precio</Label>
                                                    <Slider
                                                        value={filters.priceRange}
                                                        onValueChange={(value) => setFilters({...filters, priceRange: value as [number, number]})}
                                                        min={0}
                                                        max={1000}
                                                        step={10}
                                                        className="w-full"
                                                    />
                                                    <div className="flex justify-between text-xs text-muted-foreground">
                                                        <span>€{filters.priceRange[0]}</span>
                                                        <span>€{filters.priceRange[1]}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                    
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="h-8 text-xs px-3">
                                                {filters.rating > 0 ? (
                                                    <span className="flex items-center gap-1">
                                                        {filters.rating}+
                                                        <Star className="w-3 h-3 fill-muted-foreground/40 text-muted-foreground" />
                                                    </span>
                                                ) : 'Valoración'}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-80 p-4" align="start">
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-medium">Valoración Mínima</Label>
                                                    <Slider
                                                        value={[filters.rating]}
                                                        onValueChange={(value) => setFilters({...filters, rating: value[0]})}
                                                        min={0}
                                                        max={5}
                                                        step={0.5}
                                                        className="w-full"
                                                    />
                                                    <div className="flex justify-between text-xs text-muted-foreground">
                                                        <span className="flex items-center gap-0.5">
                                                            0
                                                            <Star className="w-2.5 h-2.5 fill-muted-foreground/40 text-muted-foreground" />
                                                        </span>
                                                        <span className="flex items-center gap-0.5">
                                                            {filters.rating > 0 ? `${filters.rating}` : 'Todas'}
                                                            {filters.rating > 0 && <Star className="w-2.5 h-2.5 fill-muted-foreground/40 text-muted-foreground" />}
                                                        </span>
                                                        <span className="flex items-center gap-0.5">
                                                            5
                                                            <Star className="w-2.5 h-2.5 fill-muted-foreground/40 text-muted-foreground" />
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                            </div>
                                {/* Services List */}
                                {isLoadingServices ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="text-muted-foreground">Cargando servicios...</div>
                        </div>
                                ) : services.length > 0 ? (
                                    <div className="space-y-6 mb-6">
                                        {services.map((service) => {
                                            const isPro = (service.completedSearches || 0) > 5;
                                            const allImages = service.imageUrls && service.imageUrls.length > 0
                                                ? service.imageUrls
                                                : (service.expert?.profilePictureUrl ? [service.expert.profilePictureUrl] : []);
    return (
                                                <div
                                                    key={service.id}
                                                    className={`group cursor-pointer transition-all border rounded-xl overflow-hidden ${
                                                        selectedService === service.id
                                                            ? 'border-primary/60 bg-primary/5 shadow-sm'
                                                            : 'border-border/50 hover:border-border hover:shadow-sm'
                                                    }`}
                                                    onClick={() => handleServiceSelect(service.id)}
                                                >
                                                    <div className="flex">
                                                        {/* Imagen a la izquierda - estilo Airbnb con carousel */}
                                                        <div
                                                            className="w-64 h-48 flex-shrink-0"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            {allImages.length > 0 ? (
                                                                <div className="relative w-full h-full">
                                                                    <ImageCarousel
                                                                        images={allImages}
                                                                        alt={service.expert?.user?.name || 'Experto'}
                                                                        className="w-full h-full rounded-l-xl"
                                                                    />
                                                                    {isPro && (
                                                                        <div className="absolute top-2 left-2 bg-primary text-white text-[10px] font-semibold px-2 py-1 rounded-md shadow-sm z-20">
                                                                            Pro
                    </div>
                                                                    )}
                                                                    {selectedService === service.id && (
                                                                        <div className="absolute top-2 right-2 z-20">
                                                                            <div className="bg-primary/90 backdrop-blur-sm text-white rounded-full p-1 shadow-md">
                                                                                <CheckCircle className="w-3.5 h-3.5" />
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center rounded-l-xl relative">
                                                                    <User className="w-12 h-12 text-muted-foreground/50" />
                                                                    {selectedService === service.id && (
                                                                        <div className="absolute top-2 right-2 z-20">
                                                                            <div className="bg-primary/90 backdrop-blur-sm text-white rounded-full p-1 shadow-md">
                                                                                <CheckCircle className="w-3.5 h-3.5" />
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                        {/* Información a la derecha - estilo Airbnb */}
                                                        <div className="flex-1 p-5 flex flex-col justify-between min-w-0">
                                                            <div className="flex-1 space-y-2.5">
                                                                {/* Categoría */}
                                                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                                                    {service.categoryName || 'Servicio'} · {service.serviceTypeName || 'Revisión'}
                                                                </p>
                                                               
                                                                {/* Título */}
                                                                <h3 className="text-lg font-semibold text-foreground leading-tight">
                                                                    {service.expert?.user?.name || 'Experto'}
                                                                </h3>
                                                               
                                                                {/* Descripción */}
                                                                {service.conditions && (
                                                                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                                                                        {service.conditions.length > 120
                                                                            ? `${service.conditions.substring(0, 120)}...`
                                                                            : service.conditions}
                                                                    </p>
                                                                )}
                                                               
                                                                {/* Detalles en una línea */}
                                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
                                                                    {service.selectedDeliverableTypes?.slice(0, 3).map((deliverable, idx) => (
                                                                        <span key={deliverable.id}>
                                                                            {deliverable.displayName}
                                                                            {idx < Math.min(2, (service.selectedDeliverableTypes?.length || 0) - 1) && ' · '}
                                                                        </span>
                                                                    ))}
                                                                    {service.selectedDeliverableTypes && service.selectedDeliverableTypes.length > 3 && (
                                                                        <span> · +{service.selectedDeliverableTypes.length - 3} más</span>
                                                                    )}
                            </div>
                                                               
                                                                {/* Rating y precio en la misma línea */}
                                                                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <Star className="w-3.5 h-3.5 fill-muted-foreground/30 text-muted-foreground" />
                                                                        <span className="text-sm font-semibold text-foreground">
                                                                            {service.averageRating?.toFixed(1) || '0.0'}
                                                                        </span>
                                                                        <span className="text-xs text-muted-foreground">
                                                                            ({service.expert?.reviews?.length || 0})
                                                                        </span>
                        </div>
                                                                    <div className="text-right">
                                                                        <span className="text-lg font-bold text-foreground">
                                                                            €{service.price || 72}
                                                                        </span>
                                                                        <span className="text-xs text-muted-foreground ml-1 font-normal">
                                                                            /servicio
                                                                        </span>
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
                                    <Card className="p-8 text-center">
                                        <p className="text-muted-foreground">No hay servicios disponibles en esta ubicación.</p>
                                    </Card>
                                )}
                                {/* Continue Button */}
                                {services.length > 0 && (
                                    <div className="mt-6 pb-6">
                                        <Button
                                            onClick={handleContinue}
                                            disabled={!selectedService}
                                            size="lg"
                                            className="w-full h-11 text-base font-medium shadow-lg"
                                        >
                                            Continuar
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </>
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
                
                {/* Mobile: Map View */}
                <div className="lg:hidden flex flex-col h-full w-full min-h-0">
                    {/* Accordion con instrucciones - Mobile */}
                    <div className="px-4 pt-4 pb-2 flex-shrink-0">
                        <Accordion type="single" collapsible defaultValue="instructions" className="mb-2">
                            <AccordionItem value="instructions" className="border-border">
                                <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline py-2">
                                    <div className="flex items-center gap-2">
                                        <Info className="w-4 h-4 text-primary" />
                                        <span>¿Qué hacer en esta página?</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pt-2 pb-3">
                                    <p>
                                        Selecciona una ubicación en el mapa. Una vez seleccionada, aparecerán los servicios disponibles en un radio de 25 km.
                                        Puedes filtrar por precio y valoración, y seleccionar un servicio para continuar.
                                    </p>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>
                    
                    {/* Map Container */}
                    <div className="flex-1 relative min-h-0 w-full">
                        {!isLoaded ? (
                            <div className="h-full flex items-center justify-center bg-muted">
                                <div className="text-muted-foreground">Cargando mapa...</div>
                            </div>
                        ) : loadError ? (
                            <div className="h-full flex items-center justify-center bg-muted">
                                <div className="text-destructive">Error al cargar el mapa</div>
                            </div>
                        ) : (
                            <>
                                {/* Search Bar */}
                                <div className="absolute top-4 left-4 right-4 z-20">
                                        <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                {isGeocoding ? (
                                                <div className="h-3.5 w-3.5 border-2 border-primary/40 border-t-primary rounded-full animate-spin"></div>
                                                ) : (
                                                <Search className="h-4 w-4 text-muted-foreground/60" />
                                                )}
                                            </div>
                                        <Input
                                                ref={searchInputRef}
                                                type="text"
                                                value={searchAddress}
                                                onChange={(e) => setSearchAddress(e.target.value)}
                                                placeholder={isGeocoding ? "Buscando..." : "Buscar dirección..."}
                                                disabled={isGeocoding}
                                            className="w-full pl-9 pr-8 h-9 text-sm bg-background/95 backdrop-blur-md border-border/50 shadow-sm"
                                            />
                                            {searchAddress && (
                                                <button
                                                    onClick={() => {
                                                        setSearchAddress('');
                                                        setSelectedAddress('');
                                                        if (searchInputRef.current) {
                                                            searchInputRef.current.focus();
                                                        }
                                                    }}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                                                >
                                                <X className="h-3.5 w-3.5" />
                                                </button>
                                            )}
                                    </div>
                                </div>
                                
                                {/* Map */}
                                {isLoaded && (
                                    <LocationMap
                                        selectedLocation={selectedLocation}
                                        mapExperts={mapExperts}
                                        services={services}
                                        selectedService={selectedService}
                                        onMapClick={(e) => {
                                            if (e.latLng) {
                                                const lat = e.latLng.lat();
                                                const lng = e.latLng.lng();
                                                const newLocation = { lat, lng };
                                                setSelectedLocation(newLocation);
                                                setFormData(prev => ({
                                                    ...prev,
                                                    latitude: lat.toString(),
                                                    longitude: lng.toString(),
                                                }));
                                            }
                                        }}
                                        onMapLoad={(mapInstance) => {
                                            setMap(mapInstance);
                                        }}
                                        onServiceSelect={handleServiceSelect}
                                        locationRange={parseInt(formData.locationRange)}
                                        isMobile={true}
                                        isLoaded={isLoaded}
                                    />
                                )}
                                
                                {/* Floating Button to Open Drawer */}
                                {formData.latitude && formData.longitude && (
                                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
                                        <Button
                                            onClick={() => setIsDrawerOpen(true)}
                                            size="lg"
                                            className={`shadow-2xl border-2 ${
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
                </div>
                
                {/* Desktop: Right Side - Map */}
                <div className="hidden lg:block w-1/2 border-l bg-muted/30">
                    <div className="h-full sticky top-[73px]">
                        {!isLoaded ? (
                            <div className="h-full flex items-center justify-center bg-muted">
                                <div className="text-muted-foreground">Cargando mapa...</div>
                            </div>
                        ) : loadError ? (
                            <div className="h-full flex items-center justify-center bg-muted">
                                <div className="text-destructive">Error al cargar el mapa</div>
                            </div>
                        ) : (
                            <>
                                {/* Search Bar */}
                                <div className="absolute top-4 left-4 right-4 z-10 max-w-sm">
                                        <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                {isGeocoding ? (
                                                <div className="h-3.5 w-3.5 border-2 border-primary/40 border-t-primary rounded-full animate-spin"></div>
                                                ) : (
                                                <Search className="h-4 w-4 text-muted-foreground/60" />
                                                )}
                                            </div>
                                        <Input
                                                ref={searchInputRef}
                                                type="text"
                                                value={searchAddress}
                                                onChange={(e) => setSearchAddress(e.target.value)}
                                                placeholder={isGeocoding ? "Buscando..." : "Buscar dirección..."}
                                                disabled={isGeocoding}
                                            className="w-full pl-9 pr-8 h-9 text-sm bg-background/95 backdrop-blur-md border-border/50 shadow-sm"
                                            />
                                            {searchAddress && (
                                                <button
                                                    onClick={() => {
                                                        setSearchAddress('');
                                                        setSelectedAddress('');
                                                        if (searchInputRef.current) {
                                                            searchInputRef.current.focus();
                                                        }
                                                    }}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                                                >
                                                <X className="h-3.5 w-3.5" />
                                                </button>
                                            )}
                                    </div>
                                </div>
                                
                                {isLoaded && (
                                    <LocationMap
                                        selectedLocation={selectedLocation}
                                        mapExperts={mapExperts}
                                        services={services}
                                        selectedService={selectedService}
                                        onMapClick={handleMapClick}
                                        onMapLoad={async (mapInstance) => {
                                            setMap(mapInstance);
                                        const radius = 25;
                                        const zoom = getZoomLevel(radius);
                                            mapInstance.setZoom(zoom);
                                        }}
                                        onServiceSelect={handleServiceSelect}
                                        locationRange={25}
                                        isMobile={false}
                                        isLoaded={isLoaded}
                                    />
                                )}
                            </>
                        )}
                        </div>
                    </div>
                </div>
                
                {/* Mobile Drawer with Services */}
                <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                    <DrawerContent className="max-h-[95vh] flex flex-col">
                        <DrawerHeader className="border-b px-4 py-3 flex-shrink-0">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <DrawerTitle className="text-base font-semibold">
                                        {services.length} {services.length === 1 ? 'resultado' : 'resultados'} disponibles
                                    </DrawerTitle>
                                    <DrawerDescription className="text-xs mt-1 flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        <span className="truncate">{formData.locationName || 'Ubicación seleccionada'}</span>
                                    </DrawerDescription>
                                </div>
                                <DrawerClose asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                                        <X className="h-4 w-4" />
                                    </Button>
                                </DrawerClose>
                            </div>
                        </DrawerHeader>
                        
                        <div className="flex-1 overflow-y-auto">
                            {/* Filters - Sticky */}
                            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b px-4 py-3">
                                <div className="flex items-center gap-2">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="h-9 flex-1 text-sm">
                                                {filters.priceRange[0] === 0 && filters.priceRange[1] === 1000 ? 'Precio' : `€${filters.priceRange[0]}-€${filters.priceRange[1]}`}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-80 p-4" align="start">
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-medium">Rango de Precio</Label>
                                                    <Slider
                                                        value={filters.priceRange}
                                                        onValueChange={(value) => setFilters({...filters, priceRange: value as [number, number]})}
                                                        min={0}
                                                        max={1000}
                                                        step={10}
                                                        className="w-full"
                                                    />
                                                    <div className="flex justify-between text-xs text-muted-foreground">
                                                        <span>€{filters.priceRange[0]}</span>
                                                        <span>€{filters.priceRange[1]}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                    
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="h-9 flex-1 text-sm">
                                                {filters.rating > 0 ? (
                                                    <span className="flex items-center gap-1">
                                                        {filters.rating}+
                                                        <Star className="w-3 h-3 fill-muted-foreground/40 text-muted-foreground" />
                                                    </span>
                                                ) : 'Valoración'}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-80 p-4" align="start">
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-medium">Valoración Mínima</Label>
                                                    <Slider
                                                        value={[filters.rating]}
                                                        onValueChange={(value) => setFilters({...filters, rating: value[0]})}
                                                        min={0}
                                                        max={5}
                                                        step={0.5}
                                                        className="w-full"
                                                    />
                                                    <div className="flex justify-between text-xs text-muted-foreground">
                                                        <span className="flex items-center gap-0.5">
                                                            0
                                                            <Star className="w-2.5 h-2.5 fill-muted-foreground/40 text-muted-foreground" />
                                                        </span>
                                                        <span className="flex items-center gap-0.5">
                                                            {filters.rating > 0 ? `${filters.rating}` : 'Todas'}
                                                            {filters.rating > 0 && <Star className="w-2.5 h-2.5 fill-muted-foreground/40 text-muted-foreground" />}
                                                        </span>
                                                        <span className="flex items-center gap-0.5">
                                                            5
                                                            <Star className="w-2.5 h-2.5 fill-muted-foreground/40 text-muted-foreground" />
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                            
                            {/* Services List */}
                            <div className="px-4 py-4">
                                {isLoadingServices ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="text-muted-foreground text-sm">Cargando servicios...</div>
                                    </div>
                                ) : services.length > 0 ? (
                                    <div className="space-y-2">
                                        {services.map((service) => {
                                            const isPro = (service.completedSearches || 0) > 5;
                                            const allImages = service.imageUrls && service.imageUrls.length > 0
                                                ? service.imageUrls
                                                : (service.expert?.profilePictureUrl ? [service.expert.profilePictureUrl] : []);
                                                return (
                                                <div
                                                    key={service.id}
                                                    className={`group cursor-pointer transition-all border rounded-lg overflow-hidden ${
                                                        selectedService === service.id
                                                            ? 'border-primary bg-primary/5 shadow-sm'
                                                            : 'border-border/50 hover:border-border'
                                                    }`}
                                                    onClick={() => handleServiceSelect(service.id)}
                                                >
                                                    {/* Layout horizontal compacto tipo lista */}
                                                    <div className="flex items-center gap-3 p-3">
                                                        {/* Imagen pequeña */}
                                                        <div className="relative w-16 h-16 flex-shrink-0 rounded-md overflow-hidden">
                                                            {allImages.length > 0 ? (
                                                                <>
                                                                    <img
                                                                        src={allImages[0]}
                                                                        alt={service.expert?.user?.name || 'Experto'}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                    {isPro && (
                                                                        <div className="absolute top-0.5 left-0.5 bg-primary text-white text-[8px] font-semibold px-1 py-0.5 rounded z-20">
                                                                            Pro
                                                                        </div>
                                                                    )}
                                                                    {selectedService === service.id && (
                                                                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center z-10">
                                                                            <CheckCircle className="w-5 h-5 text-primary" />
                                                                        </div>
                                                                    )}
                                                                </>
                                                            ) : (
                                                                <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center relative">
                                                                    <User className="w-6 h-6 text-muted-foreground/50" />
                                                                    {selectedService === service.id && (
                                                                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center z-10">
                                                                            <CheckCircle className="w-5 h-5 text-primary" />
                                                                        </div>
                        )}
                        </div>
                                                            )}
                    </div>
                                                        
                                                        {/* Información compacta */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-start justify-between gap-2">
                                                                <div className="flex-1 min-w-0">
                                                                    <h3 className="text-sm font-semibold text-foreground leading-tight truncate">
                                                                        {service.expert?.user?.name || 'Experto'}
                                                                    </h3>
                                                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">
                                                                        {service.categoryName || 'Servicio'} · {service.serviceTypeName || 'Revisión'}
                                                                    </p>
                                                                    <div className="flex items-center gap-2 mt-1">
                                                                        <div className="flex items-center gap-0.5">
                                                                            <Star className="w-2.5 h-2.5 fill-muted-foreground/30 text-muted-foreground" />
                                                                            <span className="text-xs font-semibold text-foreground">
                                                                                {service.averageRating?.toFixed(1) || '0.0'}
                                                                            </span>
                </div>
                                                                        <span className="text-[10px] text-muted-foreground">
                                                                            ({service.expert?.reviews?.length || 0})
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right flex-shrink-0">
                                                                    <span className="text-sm font-bold text-foreground">
                                                                        €{service.price || 72}
                                                                    </span>
                                                                    <span className="text-[10px] text-muted-foreground block">
                                                                        /servicio
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
                                    <Card className="p-8 text-center">
                                        <p className="text-sm text-muted-foreground">No hay servicios disponibles en esta ubicación.</p>
                                    </Card>
                        )}
                        </div>
                    </div>
                        
                        {/* Continue Button - Fixed at bottom */}
                        {services.length > 0 && (
                            <div className="border-t bg-background px-4 py-3 flex-shrink-0">
                                <Button
                                    onClick={() => {
                                        handleContinue();
                                        setIsDrawerOpen(false);
                                    }}
                                    disabled={!selectedService}
                                    size="lg"
                                    className="w-full h-11 text-base font-medium"
                                >
                                    {selectedService ? 'Continuar' : 'Selecciona un experto'}
                                    {selectedService && <ArrowRight className="ml-2 h-4 w-4" />}
                                </Button>
                </div>
                        )}
                    </DrawerContent>
                </Drawer>
        </div>
    );
}