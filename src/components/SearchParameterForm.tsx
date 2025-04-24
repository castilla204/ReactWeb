import React, { useState, useEffect } from 'react';
import { AlertCircle, MapPin, ArrowRight, ArrowLeft } from 'lucide-react';
import { GoogleMap, useLoadScript, Marker, Libraries } from '@react-google-maps/api';
import { useSubscriptionLimits } from '../hooks/useSubscriptionLimits';

const libraries: Libraries = ['drawing', 'geometry'];

const getDrawingManagerOptions = () => ({
    drawingControl: false,
    circleOptions: {
        fillColor: 'rgba(120,80,255,1)',
        fillOpacity: 0.15,
        strokeColor: 'rgba(120,80,255,1)',
        strokeOpacity: 1,
        strokeWeight: 3,
        clickable: false,
        editable: true,
        zIndex: 1
    }
});

const markerIcon = {
    path: "M -8,0 A 8,8 0 1,0 8,0 A 8,8 0 1,0 -8,0",
    fillColor: '#3b82f6',
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: 2,
    scale: 3,
    zIndex: 3
};

const circleOptions = {
    fillColor: '#3b82f6',
    fillOpacity: 0.15,
    strokeColor: '#3b82f6',
    strokeOpacity: 1,
    strokeWeight: 3,
    zIndex: 1,
    clickable: false,
    editable: false,
    draggable: false
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
    initialKeywords: string;
    initialUserSearch: string;
    selectedCategory: number | null;
    StrictMatchOnly?: boolean;
}

export function SearchParameterForm({ onComplete, setCurrentStep, selectedCategory, initialKeywords, initialUserSearch, StrictMatchOnly = false }: SearchParameterFormProps) {
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: "__REDACTED_GOOGLE_API_KEY__",
        libraries
    });

    const [error, setError] = useState<string | null>(null);
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const { minSearchInterval } = useSubscriptionLimits();
    const [isStrictMatch, setIsStrictMatch] = useState(StrictMatchOnly);

    const initialFormState = {
        keywords: initialKeywords,
        userSearch: initialUserSearch,
        latitude: '',
        longitude: '',
        locationRange: '600',
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
                        const zoom = Math.max(6, Math.min(12, 13 - Math.log2(radius / 5)));
                        map.setZoom(zoom);

                        if (circle) {
                            circle.setCenter(currentLocation);
                            circle.setRadius(parseInt(formData.locationRange) * 1000);
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
                        const zoom = Math.max(10, Math.min(12, 13 - Math.log2(radius / 10)));
                        map.setZoom(zoom);

                        if (circle) {
                            circle.setCenter(defaultCenter);
                            circle.setRadius(parseInt(formData.locationRange) * 1000);
                        }
                    }
                }
            );
        }
    }, [map, circle]);

    useEffect(() => {
        if (map && circle) {
            const radius = parseInt(formData.locationRange);
            const zoom = Math.max(6, Math.min(12, 13 - Math.log2(radius / 5)));
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
            StrictMatchOnly: isStrictMatch,
            latitude: selectedLocation.lat.toString(),
            longitude: selectedLocation.lng.toString(),
            locationRange: formData.locationRange ? parseInt(formData.locationRange) : null,
            frequency: formData.frequency ? parseInt(formData.frequency) : minSearchInterval,
            minPrice: formData.minPrice ? parseInt(formData.minPrice) : null,
            maxPrice: formData.maxPrice ? parseInt(formData.maxPrice) : null,
            brandId: null,
            modelId: null,
            platformIds: [1, 2]
        };

        onComplete(searchParameterData);
    };

    const handleBack = (e: React.MouseEvent) => {
        e.preventDefault();
        setCurrentStep(0);
    };

    return (
        <div className="w-full max-w-4xl mx-auto relative min-h-screen pb-32">
            <div className="flex items-center gap-2 mb-6">
                <button
                    onClick={handleBack}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Atrás
                </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Map Container */}
                <div className="bg-white rounded-2xl overflow-hidden shadow-xl border border-gray-200/80 ring-1 ring-gray-100">
                    {/* Map Section */}
                    <div className="relative h-[400px]">
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
                                    zoom={window.innerWidth < 768 ? 5 : 6}
                                    center={selectedLocation}
                                    onClick={handleMapClick}
                                    onLoad={async (map) => {
                                        setMap(map);
                                        const radius = parseInt(formData.locationRange);
                                        // Calculate zoom based on screen size and radius
                                        const baseZoom = window.innerWidth < 768 ? 4 : 5;
                                        const zoom = Math.max(2, Math.min(baseZoom, 6 - Math.log2(radius / 50)));
                                        map.setZoom(zoom);

                                        const manager = new google.maps.drawing.DrawingManager(getDrawingManagerOptions());
                                        manager.setMap(map);
                                        setDrawingManager(manager);

                                        const initialCircle = new google.maps.Circle({
                                            map,
                                            center: selectedLocation,
                                            radius: parseInt(formData.locationRange) * 1000,
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
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Location Settings */}
                    <div className="bg-white backdrop-blur-xl rounded-xl border border-gray-200/60 p-6 space-y-4 shadow-lg hover:shadow-xl transition-all ring-1 ring-gray-100/80 lg:col-span-1">
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-sm font-medium text-gray-900 mb-1">Configuración de Ubicación</h3>
                                <p className="text-xs text-gray-400">Establece el área y radio de búsqueda</p>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-400">Radio de Búsqueda</span>
                                    <div className="flex items-center gap-1">
                                        <span className="text-lg font-semibold text-gray-900">{formData.locationRange}</span>
                                        <span className="text-sm text-gray-500">km</span>
                                    </div>
                                </div>
                                <input
                                    type="range"
                                    min="1"
                                    max="600"
                                    value={formData.locationRange}
                                    onChange={(e) => {
                                        setFormData({ ...formData, locationRange: e.target.value });
                                        if (map) {
                                            const radius = parseInt(e.target.value);
                                            const baseZoom = window.innerWidth < 768 ? 4 : 5;
                                            const zoom = Math.max(2, Math.min(baseZoom, 6 - Math.log2(radius / 50)));
                                            map.setZoom(zoom);
                                        }
                                    }}
                                    className="w-full h-1.5 bg-blue-100 rounded-full appearance-none cursor-pointer focus:outline-none transition-all [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-500 [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:hover:border-blue-600"
                                    style={{
                                        background: `linear-gradient(to right, rgb(59, 130, 246) 0%, rgb(59, 130, 246) ${(parseInt(formData.locationRange) / 600) * 100}%, rgb(219, 234, 254) ${(parseInt(formData.locationRange) / 600) * 100}%, rgb(219, 234, 254) 100%)`,
                                        height: '6px'
                                    }}
                                />
                                <div className="flex justify-between text-xs text-gray-500">
                                    <span>1km</span>
                                    <span>300km</span>
                                    <span>600km</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Price Range Settings */}
                    <div className="bg-white backdrop-blur-xl rounded-xl border border-gray-200/60 p-6 space-y-4 shadow-lg hover:shadow-xl transition-all ring-1 ring-gray-100/80 lg:col-span-1">
                        <div>
                            <h3 className="text-sm font-medium text-gray-900 mb-4">Rango de Precio</h3>
                            <p className="text-xs text-gray-400">Establece los límites de precio mínimo y máximo</p>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-6">
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
                                            left: `${(parseInt(formData.minPrice || '0') / 1000000) * 100}%`,
                                            right: `${100 - ((parseInt(formData.maxPrice || '1000000') / 1000000) * 100)}%`,
                                            height: '6px'
                                        }}
                                    ></div>
                                    <div className="relative">
                                        <input
                                            type="range"
                                            min="0"
                                            max="1000000"
                                            step="1000"
                                            value={formData.minPrice || 0}
                                            onChange={(e) => {
                                                const value = parseInt(e.target.value);
                                                const max = parseInt(formData.maxPrice || '1000000');
                                                if (value <= max) {
                                                    setFormData({ ...formData, minPrice: value.toString() });
                                                }
                                            }}
                                            className="absolute top-[-8px] left-0 w-full pointer-events-none appearance-none bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:transition-transform"
                                        />
                                        <input
                                            type="range"
                                            min="0"
                                            max="1000000"
                                            step="1000"
                                            value={formData.maxPrice || 1000000}
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
                                <span>500.000€</span>
                                <span>1.000.000€</span>
                            </div>
                        </div>
                    </div>

                    {/* Update Frequency Settings */}
                    <div className="bg-white backdrop-blur-xl rounded-xl border border-gray-200/60 p-6 space-y-4 shadow-lg hover:shadow-xl transition-all ring-1 ring-gray-100/80 lg:col-span-1">
                        <div>
                            <h3 className="text-sm font-medium text-gray-900 mb-1">Frecuencia de Actualización</h3>
                            <p className="text-xs text-gray-400">Con qué frecuencia buscar nuevos resultados</p>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-400">Revisar cada</span>
                                <div className="flex items-center gap-1">
                                    <span className="text-lg font-semibold text-white">{formData.frequency}</span>
                                    <span className="text-sm text-gray-500">horas</span>
                                </div>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="24"
                                value={formData.frequency}
                                step="1"
                                onChange={(e) => {
                                    const value = parseInt(e.target.value);
                                    if (value < minSearchInterval) {
                                        setFormData({ ...formData, frequency: minSearchInterval.toString() });
                                    } else {
                                        setFormData({ ...formData, frequency: value.toString() });
                                    }
                                }}
                                className="relative w-full h-1.5 bg-blue-100 rounded-full appearance-none cursor-pointer focus:outline-none transition-all [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-500 [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:hover:border-blue-600"
                                style={{
                                    background: `linear-gradient(to right, 
                                        rgba(245,158,11,0.3) 0%, 
                                        rgba(245,158,11,0.3) ${(minSearchInterval / 24) * 100}%,
                                        rgb(59, 130, 246) ${(minSearchInterval / 24) * 100}%,
                                        rgb(59, 130, 246) ${(parseInt(formData.frequency) / 24) * 100}%, 
                                        rgb(219, 234, 254) ${(parseInt(formData.frequency) / 24) * 100}%, 
                                        rgb(219, 234, 254) 100%)`,
                                    height: '6px'
                                }}
                                onInput={(e) => {
                                    const input = e.target as HTMLInputElement;
                                    const value = parseInt(input.value);
                                    if (value < minSearchInterval) {
                                        input.value = minSearchInterval.toString();
                                        setFormData({ ...formData, frequency: minSearchInterval.toString() });
                                    }
                                }}
                            />
                            <div className="flex justify-between text-xs text-gray-500">
                                <span>0h</span>
                                <span>12h</span>
                                <span>24h</span>
                            </div>
                            <div className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-600"></span>
                                <span className="flex items-center gap-1">
                                    Área restringida (mínimo {minSearchInterval}h) -
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setCurrentStep(0);
                                            window.dispatchEvent(new CustomEvent('showSubscriptions'));
                                        }}
                                        className="text-amber-500 hover:text-amber-400 font-medium transition-colors"
                                    >
                                        Mejorar Plan
                                    </button>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="flex items-center gap-2 text-red-400 text-sm bg-red-50 border border-red-100 px-4 py-3 rounded-xl shadow-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Submit Button */}
                <div
                    className={`fixed bottom-8 right-1/2 translate-x-1/2 md:right-8 md:translate-x-0 z-50 transition-opacity duration-300 ${window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 300
                        ? 'opacity-100'
                        : 'opacity-0 pointer-events-none'
                        }`}
                >
                    <button
                        type="submit"
                        onClick={(e) => handleSubmit(e)}
                        disabled={window.innerHeight + window.scrollY < document.documentElement.scrollHeight - 300}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all shadow-xl shadow-blue-500/20 hover:shadow-2xl hover:shadow-blue-500/30 backdrop-blur-sm w-[200px] md:w-auto">
                        Continuar
                        <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsStrictMatch(!isStrictMatch)}
                        className={`p-2 rounded-lg transition-colors ${isStrictMatch
                                ? 'bg-blue-100 text-blue-600'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                        title="Toggle strict match"
                    >
                        <span className="text-xs">Strict</span>
                    </button>
                </div>
            </form>
        </div>
    );
}