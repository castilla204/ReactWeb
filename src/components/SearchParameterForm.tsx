import React, { useState, useEffect } from 'react';
import { MapPin, ArrowRight, ArrowLeft } from 'lucide-react';
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';
import { useSubscriptionLimits } from '../hooks/useSubscriptionLimits';

const libraries = ['drawing', 'geometry'];

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
        featureType: "all",
        elementType: "labels.text.fill",
        stylers: [{ color: "#666666" }]
    },
    {
        featureType: "water",
        elementType: "geometry",
        stylers: [{ color: "#e8f4f8" }]
    },
    {
        featureType: "landscape",
        elementType: "geometry",
        stylers: [{ color: "#ffffff" }]
    },
    {
        featureType: "road",
        elementType: "geometry",
        stylers: [{ color: "#e6e6e6" }]
    },
    {
        featureType: "poi",
        elementType: "geometry",
        stylers: [{ color: "#f0f5f7" }]
    },
    {
        featureType: "transit",
        elementType: "geometry",
        stylers: [{ color: "#f0f5f7" }]
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
        googleMapsApiKey: "__REDACTED_GOOGLE_API_KEY__",
        libraries
    });

    const [error, setError] = useState<string | null>(null);
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const { minSearchInterval } = useSubscriptionLimits();

    const initialFormState = {
        keywords: initialKeywords,
        userSearch: initialUserSearch,
        latitude: '',
        longitude: '',
        locationRange: '25',
        frequency: minSearchInterval.toString(),
        minPrice: '',
        maxPrice: '',
    };

    const [formData, setFormData] = useState(initialFormState);
    const [selectedLocation, setSelectedLocation] = useState(defaultCenter);
    const [circle, setCircle] = useState<google.maps.Circle | null>(null);
    const [drawingManager, setDrawingManager] = useState<google.maps.drawing.DrawingManager | null>(null);

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
                    setSelectedLocation(currentLocation);
                    setFormData(prev => ({
                        ...prev,
                        latitude: currentLocation.lat.toString(),
                        longitude: currentLocation.lng.toString()
                    }));
                    if (map) {
                        map.panTo(currentLocation);
                        const radius = parseInt(formData.locationRange);
                        const zoom = getZoomLevel(radius);
                        map.setZoom(zoom);

                        if (circle) {
                            circle.setCenter(currentLocation);
                            circle.setRadius(radius * 1000);
                        }
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

    const handleMapClick = (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
            const newLocation = {
                lat: e.latLng.lat(),
                lng: e.latLng.lng()
            };
            setSelectedLocation(newLocation);
            setFormData({
                ...formData,
                latitude: newLocation.lat.toString(),
                longitude: newLocation.lng.toString()
            });

            if (circle) {
                circle.setCenter(newLocation);
            }
        }
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        window.scrollTo(0, 0);

        if (!formData.latitude || !formData.longitude) {
            const errorMessage = 'Please select a location on the map';
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
        <div className="w-full max-w-4xl mx-auto relative pb-16">
            <div className="flex items-center gap-2 mb-4">
                <button
                    onClick={handleBack}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Atrás
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Map Container */}
                <div className="bg-white rounded-2xl overflow-hidden shadow-xl border border-gray-200">
                    <div className="relative h-[280px]">
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
                                <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-lg border border-gray-200 shadow-sm">
                                    <MapPin className="w-4 h-4 text-blue-600" />
                                    <span className="hidden md:inline text-sm text-gray-700">Haz clic para cambiar la ubicación</span>
                                    <span className="md:hidden text-sm text-gray-700">Toca para cambiar</span>
                                </div>
                                {selectedLocation && (
                                    <div className="absolute top-16 md:top-4 left-4 md:left-auto md:right-4 z-10 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-lg border border-gray-200 shadow-sm">
                                        <div className="text-sm text-gray-700 font-medium">
                                            {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
                                        </div>
                                    </div>
                                )}
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
                                    {selectedLocation && (
                                        <Marker
                                            position={selectedLocation}
                                            icon={markerIcon}
                                            zIndex={3}
                                        />
                                    )}
                                </GoogleMap>
                            </>
                        )}
                    </div>
                </div>

                {/* Settings Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-white backdrop-blur-xl rounded-xl border border-gray-200/60 p-4 space-y-3 shadow-lg hover:shadow-xl transition-all ring-1 ring-gray-100/80 lg:col-span-1">
                        <div>
                            <h3 className="text-sm font-medium text-gray-900 mb-1">
                                {serviceTypeId === 2 
                                    ? 'Selecciona el área en el que buscas el coche'
                                    : 'Configuración de Ubicación'
                                }
                            </h3>
                            <p className="text-xs text-gray-400">
                                {serviceTypeId === 2 
                                    ? 'Define la zona de búsqueda para tu vehículo'
                                    : 'Establece el área y radio de búsqueda'
                                }
                            </p>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-400">Radio de Búsqueda</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-lg font-semibold text-gray-900">
                                        {Math.min(parseInt(formData.locationRange), 100)}
                                    </span>
                                    <span className="text-sm text-gray-500">km</span>
                                    {parseInt(formData.locationRange) > 100 && (
                                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">
                                            Máximo
                                        </span>
                                    )}
                                </div>
                            </div>
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
                                className="w-full h-1.5 bg-blue-100 rounded-full appearance-none cursor-pointer focus:outline-none transition-all [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-500 [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:hover:border-blue-600"
                                style={{
                                    background: `linear-gradient(to right, rgb(59, 130, 246) 0%, rgb(59, 130, 246) ${(Math.min(parseInt(formData.locationRange), 100) / 100) * 100}%, rgb(219, 234, 254) ${(Math.min(parseInt(formData.locationRange), 100) / 100) * 100}%, rgb(219, 234, 254) 100%)`,
                                    height: '6px'
                                }}
                            />
                            <div className="flex justify-between text-xs text-gray-500">
                                <span>1km</span>
                                <span>50km</span>
                                <span>100km</span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white backdrop-blur-xl rounded-xl border border-gray-200/60 p-4 space-y-3 shadow-lg hover:shadow-xl transition-all ring-1 ring-gray-100/80 lg:col-span-1">
                        <div>
                            <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
                                Rango de Precio 
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                    {selectedCategory === 1 ? '🚗 Vehículos' : 
                                     selectedCategory === 2 ? '🏍️ Motos' : 
                                     '🏠 Inmuebles'}
                                </span>
                            </h3>
                            <p className="text-xs text-gray-400">
                                {selectedCategory === 1 ? 'Rango típico para vehículos de segunda mano' :
                                 selectedCategory === 2 ? 'Rango típico para motocicletas y ciclomotores' :
                                 'Rango típico para inmuebles y viviendas'}
                            </p>
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
                                    <div className="absolute inset-0 bg-blue-100 rounded-full"></div>
                                    <div
                                        className="absolute inset-y-0 bg-blue-500 rounded-full"
                                        style={{
                                            left: `${(parseInt(formData.minPrice || '0') / (selectedCategory === 1 ? 100000 : selectedCategory === 2 ? 50000 : 2000000)) * 100}%`,
                                            right: `${100 - ((parseInt(formData.maxPrice || (selectedCategory === 1 ? '100000' : selectedCategory === 2 ? '50000' : '2000000')) / (selectedCategory === 1 ? 100000 : selectedCategory === 2 ? 50000 : 2000000)) * 100)}%`,
                                            height: '6px'
                                        }}
                                    ></div>
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
                                            className="absolute top-[-8px] left-0 w-full pointer-events-none appearance-none bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:transition-transform"
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
                                            className="absolute top-[-8px] left-0 w-full pointer-events-none appearance-none bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:transition-transform"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500">
                                <span>0€</span>
                                <span>
                                    {selectedCategory === 1 ? '50.000€' : 
                                     selectedCategory === 2 ? '1.000.000€' : 
                                     '500.000€'}
                                </span>
                                <span>
                                    {selectedCategory === 1 ? '100.000€' : 
                                     selectedCategory === 2 ? '2.000.000€' : 
                                     '1.000.000€'}
                                </span>
                            </div>
                        </div>
                    </div>

                </div>

                {error && (
                    <div className="text-red-600 text-sm bg-red-50 border border-red-100 px-4 py-3 rounded-xl flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                        {error}
                    </div>
                )}

                <div className="sticky bottom-6 flex justify-end">
                    <button
                        type="submit"
                        className="flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold transition-all shadow-xl shadow-blue-500/25 hover:shadow-2xl hover:shadow-blue-500/40 hover:scale-105 transform"
                    >
                        <span>Continuar con el Servicio</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </form>
        </div>
    );
}