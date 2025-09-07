import React, { useState, useEffect, useRef } from 'react';
import { MapPin, ArrowRight, ArrowLeft, Search, X, Radar, DollarSign } from 'lucide-react';
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';
import { useSubscriptionLimits } from '../hooks/useSubscriptionLimits';

const libraries: ('drawing' | 'geometry' | 'places')[] = ['drawing', 'geometry', 'places'];

const getDrawingManagerOptions = () => ({
    drawingControl: false,
    circleOptions: {
        fillColor: 'rgba(59, 130, 246, 0.1)',
        fillOpacity: 0.15,
        strokeColor: 'rgba(59, 130, 246, 0.5)',
        strokeOpacity: 1,
        strokeWeight: 2,
        clickable: false,
        editable: true,
        zIndex: 1
    }
});

const markerIcon = {
    path: "M -4,0 A 4,4 0 1,0 4,0 A 4,4 0 1,0 -4,0",
    fillColor: '#3b82f6',
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: 1.5,
    scale: 1.5,
    zIndex: 3
};

const circleOptions = {
    fillColor: '#3b82f6',
    fillOpacity: 0.15,
    strokeColor: '#3b82f6',
    strokeOpacity: 0.5,
    strokeWeight: 2,
    zIndex: 1,
    clickable: false,
    editable: false,
    draggable: false
};

const getZoomLevel = (radius: number) => {
    const radiusInMeters = radius * 1000;
    return Math.min(14, Math.max(4, Math.floor(14 - Math.log2(radiusInMeters / 500))));
};

const mapStyles = [
    {
        featureType: 'poi',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }]
    },
    {
        featureType: 'transit',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }]
    }
];

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
        googleMapsApiKey: "AIzaSyBNEdqihExcXPnWw_TJgHFzsPXS7BIazyM",
        libraries
    });

    const [error, setError] = useState<string | null>(null);
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const { minSearchInterval } = useSubscriptionLimits();
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
        locationRange: '25',
        frequency: minSearchInterval.toString(),
        minPrice: '',
        maxPrice: '',
        address: '',
    };

    const [formData, setFormData] = useState(initialFormState);
    const [selectedLocation, setSelectedLocation] = useState(defaultCenter);
    const [circle, setCircle] = useState<google.maps.Circle | null>(null);
    const [drawingManager, setDrawingManager] = useState<google.maps.drawing.DrawingManager | null>(null);
    
    // Función para actualizar la ubicación y sincronizar todos los elementos del mapa
    const updateLocationAndMap = (newLocation: { lat: number; lng: number }, address?: string) => {
        setSelectedLocation(newLocation);
        
        if (address) {
            setSelectedAddress(address);
            setSearchAddress(address);
        }
        
        setFormData(prev => ({
            ...prev,
            latitude: newLocation.lat.toString(),
            longitude: newLocation.lng.toString(),
            ...(address && { address })
        }));

        // Actualizar mapa
        if (map) {
            map.panTo(newLocation);
            const radius = parseInt(formData.locationRange);
            const zoom = getZoomLevel(radius);
            map.setZoom(zoom);
        }

        // Actualizar círculo
        if (circle) {
            circle.setCenter(newLocation);
            const radius = parseInt(formData.locationRange) * 1000;
            circle.setRadius(radius);
        }
    };

    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            frequency: minSearchInterval.toString()
        }));
    }, [minSearchInterval]);

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
                        const radius = parseInt(formData.locationRange);
                        const zoom = getZoomLevel(radius);
                        map.setZoom(zoom);

                        if (circle) {
                            circle.setCenter(defaultCenter);
                            circle.setRadius(radius * 1000);
                        }
                    }
                }
            );
        }
    }, [map, circle]);

    useEffect(() => {
        if (map && circle) {
            const radius = parseInt(formData.locationRange);
            const zoom = getZoomLevel(radius);
            map.setZoom(zoom);
            circle.setRadius(radius * 1000);
        }
    }, [formData.locationRange, map, circle]);

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
    }, [isLoaded, autocomplete, map, circle, formData.locationRange]);

    // Efecto para asegurar que el mapa y círculo se actualicen cuando cambie la ubicación
    useEffect(() => {
        if (map && selectedLocation) {
            map.panTo(selectedLocation);
        }
        if (circle && selectedLocation) {
            circle.setCenter(selectedLocation);
        }
    }, [selectedLocation, map, circle]);

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

    const handleSubmit = (e: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        window.scrollTo(0, 0);

        if (!formData.latitude || !formData.longitude) {
            const errorMessage = 'Por favor, selecciona una ubicación usando el buscador de direcciones o haciendo clic en el mapa';
            setError(errorMessage);
            if (typeof window !== 'undefined' && window.dispatchEvent) {
                window.dispatchEvent(new CustomEvent('showNotification', {
                    detail: {
                        type: 'error',
                        message: `📍 ${errorMessage}`
                    }
                }));
            }
            return;
        }

        const searchParameterData = {
            category: selectedCategory,
            keywords: formData.keywords || initialKeywords,
            userSearch: formData.userSearch || initialUserSearch,
            latitude: selectedLocation.lat.toString(),
            longitude: selectedLocation.lng.toString(),
            locationRange: formData.locationRange ? parseInt(formData.locationRange) : null,
            frequency: formData.frequency ? parseInt(formData.frequency) : minSearchInterval,
            minPrice: formData.minPrice ? parseInt(formData.minPrice) : null,
            maxPrice: formData.maxPrice ? parseInt(formData.maxPrice) : null,
            brandId: null,
            modelId: null,
            platformIds: [1, 2],
            serviceTypeId
        };

        onComplete(searchParameterData);
    };

    const handleBack = (e: React.MouseEvent) => {
        e.preventDefault();
        setCurrentStep(0);
    };

    return (
        <div className="w-full max-w-6xl mx-auto px-4">
            <div className="flex items-center gap-2 mb-4">
                <button
                    onClick={handleBack}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors text-sm"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Atrás
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Combined Container - Map + Settings */}
                <div className="bg-white rounded-none md:rounded-2xl overflow-hidden shadow-xl border border-gray-100/50">
                    {/* Header with instructions */}
                    <div className="p-3 md:p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-blue-50/30">
                        <div className="flex items-start gap-3 md:gap-4">
                            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex-shrink-0 shadow-lg">
                                <MapPin className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-1 md:mb-2">
                                    {serviceTypeId === 1 ? 'Ubicación del vehículo' : 'Área de búsqueda'}
                                </h2>
                                <p className="text-xs md:text-sm text-gray-600 leading-relaxed hidden md:block">
                                    {serviceTypeId === 1 
                                        ? 'Seleccione la ubicación exacta del vehículo en el mapa para coordinar la inspección. Los expertos cercanos recibirán la notificación para ofrecer sus servicios.'
                                        : 'Defina el área de búsqueda donde desea encontrar anuncios. Ajuste el radio según la distancia que esté dispuesto a desplazarse. Un radio mayor aumentará el número de resultados disponibles, mientras que uno menor se centrará en opciones más cercanas a su ubicación.'
                                    }
                                </p>
                                {/* Versión móvil más compacta */}
                                <p className="text-xs text-gray-600 leading-relaxed md:hidden">
                                    {serviceTypeId === 1 
                                        ? 'Seleccione la ubicación exacta del vehículo para coordinar la inspección.'
                                        : 'Defina el área donde buscar anuncios. Ajuste el radio según la distancia que esté dispuesto a desplazarse.'
                                    }
                                </p>
                                <div className="mt-2 md:mt-3 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                    <span className="text-xs text-gray-500 font-medium">
                                    {serviceTypeId === 1 
                                        ? 'Paso 2 de 3 • Ubicación del vehículo'
                                        : 'Paso 2 de 3 • Definir área de búsqueda'
                                    }
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Map Section */}
                    <div className="relative h-[280px] md:h-[380px]">
                        {!isLoaded ? (
                            <div className="h-full flex items-center justify-center bg-gray-50">
                                <div className="text-gray-500">Cargando mapa...</div>
                            </div>
                        ) : loadError ? (
                            <div className="h-full flex items-center justify-center bg-gray-50">
                                <div className="text-red-400">Error al cargar el mapa</div>
                            </div>
                        ) : (
                            <>
                                {/* Buscador de direcciones integrado sobre el mapa */}
                                <div className="absolute top-2 left-2 right-2 md:top-4 md:left-4 md:right-4 z-10">
                                    <div className="relative max-w-sm md:max-w-md mx-auto">
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 md:pl-4 flex items-center pointer-events-none">
                                                {isGeocoding ? (
                                                    <div className="h-3.5 w-3.5 md:h-4 md:w-4 border-2 border-blue-400/30 border-t-blue-500 rounded-full animate-spin"></div>
                                                ) : (
                                                    <Search className="h-3.5 w-3.5 md:h-4 md:w-4 text-gray-400" />
                                                )}
                                            </div>
                                            <input
                                                ref={searchInputRef}
                                                type="text"
                                                value={searchAddress}
                                                onChange={(e) => setSearchAddress(e.target.value)}
                                                placeholder={isGeocoding ? "Buscando..." : "Buscar dirección..."}
                                                disabled={isGeocoding}
                                                className={`w-full pl-9 pr-8 py-2.5 md:pl-11 md:pr-10 md:py-3 bg-white/95 backdrop-blur-md border border-gray-200/60 rounded-lg md:rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/30 text-xs md:text-sm font-medium placeholder-gray-500 transition-all duration-200 hover:shadow-xl focus:bg-white ${isGeocoding ? 'cursor-not-allowed opacity-75' : ''}`}
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
                                                    className="absolute inset-y-0 right-0 pr-3 md:pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                                                >
                                                    <X className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                                </button>
                                            )}
                                            {selectedAddress && (
                                                <div className="absolute -bottom-1.5 md:-bottom-2 left-0 right-0 transform translate-y-full animate-in slide-in-from-top-2 duration-300">
                                                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/60 rounded-md md:rounded-lg shadow-lg px-2.5 py-1.5 md:px-3 md:py-2 text-xs font-medium mx-1 md:mx-0">
                                                        <div className="flex items-center gap-1.5 md:gap-2">
                                                            <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-green-500 rounded-full flex-shrink-0 animate-pulse"></div>
                                                            <span className="text-green-700 truncate text-xs">{selectedAddress}</span>
                                                        </div>
                                                    </div>
                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Indicador de estado en la esquina */}
                                <div className="absolute bottom-2 left-2 md:bottom-4 md:left-4 z-10 flex items-center gap-1.5 md:gap-2 px-2.5 py-1 md:px-3 md:py-1.5 bg-white/90 backdrop-blur-sm rounded-full border border-gray-200/40 shadow-sm">
                                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                    <span className="text-xs text-gray-600 font-medium hidden md:inline">
                                        {formData.latitude && formData.longitude ? 'Ubicación seleccionada' : 'Selecciona ubicación'}
                                    </span>
                                    <span className="text-xs text-gray-600 font-medium md:hidden">
                                        {formData.latitude && formData.longitude ? 'Seleccionada' : 'Ubicación'}
                                    </span>
                                </div>
                                <GoogleMap
                                    mapContainerStyle={{ width: '100%', height: '100%' }}
                                    zoom={getZoomLevel(parseInt(formData.locationRange))}
                                    center={selectedLocation}
                                    onClick={handleMapClick}
                                    onLoad={async (map) => {
                                        setMap(map);
                                        const radius = parseInt(formData.locationRange);
                                        const zoom = getZoomLevel(radius);
                                        map.setZoom(zoom);

                                        const manager = new google.maps.drawing.DrawingManager(getDrawingManagerOptions());
                                        manager.setMap(map);
                                        setDrawingManager(manager);

                                        const initialCircle = new google.maps.Circle({
                                            map,
                                            center: selectedLocation,
                                            radius: radius * 1000,
                                            ...circleOptions
                                        });
                                        setCircle(initialCircle);

                                        google.maps.event.addListener(manager, 'circlecomplete', (newCircle: google.maps.Circle) => {
                                            if (circle) {
                                                circle.setMap(null);
                                            }

                                            setCircle(newCircle);
                                            const center = newCircle.getCenter();
                                            if (center) {
                                                setSelectedLocation({
                                                    lat: center.lat(),
                                                    lng: center.lng()
                                                });
                                                setFormData(prev => ({
                                                    ...prev,
                                                    latitude: center.lat().toString(),
                                                    longitude: center.lng().toString(),
                                                    locationRange: Math.round(newCircle.getRadius() / 1000).toString()
                                                }));
                                            }

                                            google.maps.event.addListener(newCircle, 'radius_changed', () => {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    locationRange: Math.round(newCircle.getRadius() / 1000).toString()
                                                }));
                                            });

                                            google.maps.event.addListener(newCircle, 'center_changed', () => {
                                                const newCenter = newCircle.getCenter();
                                                if (newCenter) {
                                                    setSelectedLocation({
                                                        lat: newCenter.lat(),
                                                        lng: newCenter.lng()
                                                    });
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        latitude: newCenter.lat().toString(),
                                                        longitude: newCenter.lng().toString()
                                                    }));
                                                }
                                            });
                                        });
                                    }}
                                    onUnmount={() => {
                                        if (circle) {
                                            circle.setMap(null);
                                            setCircle(null);
                                        }
                                        if (drawingManager) {
                                            drawingManager.setMap(null);
                                            setDrawingManager(null);
                                        }
                                    }}
                                    options={{
                                        disableDefaultUI: false,
                                        zoomControl: true,
                                        mapTypeControl: false,
                                        scaleControl: true,
                                        streetViewControl: false,
                                        rotateControl: false,
                                        fullscreenControl: false,
                                        styles: mapStyles
                                    }}
                                >
                                    {selectedLocation && formData.latitude && formData.longitude && (
                                        <Marker
                                            position={selectedLocation}
                                            icon={markerIcon}
                                            zIndex={3}
                                            animation={google.maps.Animation.DROP}
                                        />
                                    )}
                                </GoogleMap>
                            </>
                        )}
                    </div>

                    {/* Settings Grid - Connected directly to map */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 border-t border-gray-100">
                        <div className="p-3 md:p-5 border-r border-gray-100 lg:border-r-gray-100">
                            <div className="flex items-center gap-2 mb-3 md:mb-4">
                                <Radar className="w-4 h-4 text-gray-500" />
                                <h3 className="text-sm md:text-base font-semibold text-gray-900">
                                    {serviceTypeId === 1 ? 'Radio de Revisión' : 'Radio de Búsqueda'}
                                </h3>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg">
                                    <span className="text-sm text-gray-600">Radio actual</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold text-gray-900">
                                            {Math.min(parseInt(formData.locationRange), 100)} km
                                        </span>
                                        {parseInt(formData.locationRange) > 100 && (
                                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">
                                                Máximo
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="relative">
                                    {/* Background track */}
                                    <div className="w-full h-2 bg-gray-100 rounded-lg relative border border-gray-200/50 shadow-inner">
                                        {/* Progress fill */}
                                        <div 
                                            className="absolute top-0 left-0 h-2 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 rounded-lg transition-all duration-300 ease-out shadow-sm"
                                            style={{ 
                                                width: `${((Math.min(parseInt(formData.locationRange), 100) - 1) / (100 - 1)) * 100}%` 
                                            }}
                                        ></div>
                                        {/* Subtle inner shadow for depth */}
                                        <div className="absolute inset-0 rounded-lg shadow-inner pointer-events-none"></div>
                                    </div>
                                    {/* Range input */}
                                    <input
                                        type="range"
                                        min="1"
                                        max="100"
                                        value={Math.min(parseInt(formData.locationRange), 100)}
                                        onChange={(e) => {
                                            setFormData({ ...formData, locationRange: e.target.value });
                                            if (map) {
                                                const radius = parseInt(e.target.value);
                                                const zoom = getZoomLevel(radius);
                                                map.setZoom(zoom);
                                            }
                                        }}
                                        className="absolute top-0 left-0 w-full h-2 bg-transparent appearance-none cursor-pointer focus:outline-none rounded-lg
                                        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:hover:shadow-lg [&::-webkit-slider-thumb]:hover:scale-105 [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-200 [&::-webkit-slider-thumb]:ease-out
                                        [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-blue-500 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:hover:shadow-lg [&::-moz-range-thumb]:transition-all [&::-moz-range-thumb]:duration-200 [&::-moz-range-thumb]:ease-out [&::-moz-range-thumb]:border-none
                                        [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-runnable-track]:rounded-lg
                                        [&::-moz-range-track]:bg-transparent [&::-moz-range-track]:rounded-lg [&::-moz-range-track]:border-none"
                                    />
                                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                                        <span>1km</span>
                                        <span>50km</span>
                                        <span>100km</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-3 md:p-5">
                            <div className="mb-3 md:mb-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <DollarSign className="w-4 h-4 text-gray-500" />
                                    <h3 className="text-sm md:text-base font-semibold text-gray-900">
                                    Rango de Precio
                                </h3>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg">
                                        <span className="text-sm text-gray-600">Precio mínimo</span>
                                        <span className="text-sm font-medium text-gray-900">
                                            {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(parseInt(formData.minPrice || '0'))}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg">
                                        <span className="text-sm text-gray-600">Precio máximo</span>
                                        <span className="text-sm font-medium text-gray-900">
                                            {formData.maxPrice ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(parseInt(formData.maxPrice)) : 'Sin límite'}
                                        </span>
                                    </div>
                                    <div className="relative h-2 mt-6">
                                        <div className="absolute inset-0 bg-gray-100 rounded-full border border-gray-200/50 shadow-inner"></div>
                                        <div
                                            className="absolute inset-y-0 bg-gradient-to-r from-green-500 via-green-600 to-green-700 rounded-full shadow-sm transition-all duration-300 ease-out"
                                            style={{
                                                left: `${(parseInt(formData.minPrice || '0') / (selectedCategory === 1 ? 100000 : selectedCategory === 2 ? 50000 : 2000000)) * 100}%`,
                                                right: `${100 - ((parseInt(formData.maxPrice || (selectedCategory === 1 ? '100000' : selectedCategory === 2 ? '50000' : '2000000')) / (selectedCategory === 1 ? 100000 : selectedCategory === 2 ? 50000 : 2000000)) * 100)}%`,
                                                height: '8px'
                                            }}
                                        ></div>
                                        {/* Subtle inner shadow for depth */}
                                        <div className="absolute inset-0 rounded-full shadow-inner pointer-events-none"></div>
                                        <div className="relative">
                                            <input
                                                type="range"
                                                min="0"
                                                max={selectedCategory === 1 ? '100000' : selectedCategory === 2 ? '50000' : '2000000'}
                                                step={selectedCategory === 1 ? '500' : selectedCategory === 2 ? '250' : '5000'}
                                                value={formData.minPrice || 0}
                                                onChange={(e) => {
                                                    const value = parseInt(e.target.value);
                                                    const maxValue = selectedCategory === 1 ? 100000 : selectedCategory === 2 ? 50000 : 2000000;
                                                    const max = parseInt(formData.maxPrice || maxValue.toString());
                                                    if (value <= max) {
                                                        setFormData({ ...formData, minPrice: value.toString() });
                                                    }
                                                }}
                                                className="absolute top-[-8px] left-0 w-full pointer-events-none appearance-none bg-transparent focus:outline-none rounded-lg
                                                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-green-500 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:hover:shadow-lg [&::-webkit-slider-thumb]:hover:scale-105 [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-200 [&::-webkit-slider-thumb]:ease-out
                                                [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-green-500 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:hover:shadow-lg [&::-moz-range-thumb]:transition-all [&::-moz-range-thumb]:duration-200 [&::-moz-range-thumb]:ease-out [&::-moz-range-thumb]:border-none"
                                            />
                                            <input
                                                type="range"
                                                min="0"
                                                max={selectedCategory === 1 ? '100000' : selectedCategory === 2 ? '50000' : '2000000'}
                                                step={selectedCategory === 1 ? '500' : selectedCategory === 2 ? '250' : '5000'}
                                                value={formData.maxPrice || (selectedCategory === 1 ? 100000 : selectedCategory === 2 ? 50000 : 2000000)}
                                                onChange={(e) => {
                                                    const value = parseInt(e.target.value);
                                                    const min = parseInt(formData.minPrice || '0');
                                                    if (value >= min) {
                                                        setFormData({ ...formData, maxPrice: value.toString() });
                                                    }
                                                }}
                                                className="absolute top-[-8px] left-0 w-full pointer-events-none appearance-none bg-transparent focus:outline-none rounded-lg
                                                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-green-500 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:hover:shadow-lg [&::-webkit-slider-thumb]:hover:scale-105 [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-200 [&::-webkit-slider-thumb]:ease-out
                                                [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-green-500 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:hover:shadow-lg [&::-moz-range-thumb]:transition-all [&::-moz-range-thumb]:duration-200 [&::-moz-range-thumb]:ease-out [&::-moz-range-thumb]:border-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-between text-xs text-gray-500 mt-2">
                                    <span>0€</span>
                                    <span>
                                        {selectedCategory === 1 ? '50k€' : 
                                         selectedCategory === 2 ? '25k€' : 
                                         '1M€'}
                                    </span>
                                    <span>
                                        {selectedCategory === 1 ? '100k€' : 
                                         selectedCategory === 2 ? '50k€' : 
                                         '2M€'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="text-red-600 text-sm bg-red-50 border border-red-200 px-4 py-3 rounded-lg flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        {error}
                    </div>
                )}

                <div className="bg-gradient-to-r from-gray-50 to-blue-50/30 border-t border-gray-100 p-3 md:p-6 mt-4 md:mt-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-3 md:gap-0">
                        <div className="text-xs md:text-sm text-gray-600 font-medium order-2 md:order-1">
                            Paso 2 de 3 • Configuración completada
                        </div>
                        <button
                            type="submit"
                            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 md:py-2.5 bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 text-white text-sm font-semibold rounded-xl md:rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 order-1 md:order-2"
                        >
                            <span>Continuar</span>
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}