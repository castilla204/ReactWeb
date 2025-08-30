import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Clock, Star, CheckCircle, ChevronLeft, ChevronRight, User, StarHalf, X, Shield, Crown, Award, MapPin, Filter, DollarSign, Eye, Search } from 'lucide-react';
import { GoogleMap, useLoadScript, Circle } from '@react-google-maps/api';
import { useCategories } from '../contexts/CategoryContext';
import { useServices } from '../hooks/useServices';
import { useServiceTypes } from '../hooks/useServiceTypes';

const libraries = ['geometry'];

interface ServiceSelectionProps {
    onBack: () => void;
    onComplete: (serviceId: number, expertProfilePicture?: string, expertName?: string, servicePrice?: number, serviceDescription?: string) => void;
    selectedCategory: number;
    selectedServiceTypeId: number;
    latitude: string;
    longitude: string;
    locationRange: number;
}

export function ServiceSelection({
    onBack,
    onComplete,
    selectedCategory,
    selectedServiceTypeId,
    latitude,
    longitude,
    locationRange,
}: ServiceSelectionProps) {
    const { categories } = useCategories();
    const { serviceTypes } = useServiceTypes();
    const [selectedService, setSelectedService] = useState<number | null>(null);
    const [detailServiceId, setDetailServiceId] = useState<number | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    
    // Google Maps configuration
    const { isLoaded } = useLoadScript({
        googleMapsApiKey: "AIzaSyBNEdqihExcXPnWw_TJgHFzsPXS7BIazyM",
        libraries
    });

    const mapCenter = {
        lat: parseFloat(latitude) || 40.4168,
        lng: parseFloat(longitude) || -3.7038
    };

    const getZoomLevel = (range: number) => {
        if (range <= 5) return 13;
        if (range <= 10) return 12;
        if (range <= 25) return 11;
        if (range <= 50) return 10;
        return 9;
    };

    const { services, isLoading, error } = useServices({
        categoryId: selectedCategory,
        serviceTypeId: selectedServiceTypeId,
        latitude,
        longitude,
        locationRange,
    });
    const [carouselIndices, setCarouselIndices] = useState<{ [key: number]: number }>({});

    // Helper function to truncate text to 600 characters
    const truncateText = (text: string, maxLength: number = 400): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
};

const truncateTextMobile = (text: string, maxLength: number = 150): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
};

    // Depuración: Mostrar los servicios recibidos
    console.log('ServiceSelection - Services received:', services);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex items-center gap-3 text-gray-500">
                    <Star className="w-5 h-5 animate-spin" />
                    <span>Cargando servicios...</span>
                </div>
            </div>
        );
    }

    if (error) {
        const errorMessage = `Error al cargar los servicios: ${error.message}`;
        return (
            <div className="max-w-4xl mx-auto px-6 py-12">
                <div className="bg-red-50 text-red-600 p-6 rounded-sm shadow-sm text-center">
                    <p className="text-lg">{errorMessage}</p>
                    <button
                        onClick={onBack}
                        className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-sm hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
                    >
                        Volver
                    </button>
                </div>
            </div>
        );
    }

    if (selectedCategory <= 0 || !selectedServiceTypeId || selectedServiceTypeId <= 0 || services.length === 0) {
        const serviceTypeName = serviceTypes.find((st) => st.id === selectedServiceTypeId)?.name || 'Servicios';
        return (
            <div className="max-w-4xl mx-auto px-6 py-12">
                <div className="bg-red-50 text-red-600 p-6 rounded-sm shadow-sm text-center">
                    <p className="text-lg">No hay servicios disponibles para {serviceTypeName} en la ubicación seleccionada.</p>
                    <button
                        onClick={onBack}
                        className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-sm hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
                    >
                        Volver
                    </button>
                </div>
            </div>
        );
    }

    const handleContinue = () => {
        if (selectedService === null) {
            setErrorMessage('Por favor, selecciona un servicio antes de continuar.');
            return;
        }

        const selectedServiceData = services.find((s) => s.id === selectedService);
        if (!selectedServiceData) {
            console.error('ServiceSelection - No service found for ID:', selectedService);
            setErrorMessage('Error: No se encontró el servicio seleccionado.');
            return;
        }

        const expertProfilePicture = selectedServiceData.expert?.profilePictureUrl ?? '';
        const expertName = selectedServiceData.expert?.user?.name ?? 'Experto desconocido';
        const servicePrice = selectedServiceData.price ?? 0;
        const serviceDescription = selectedServiceData.conditions ?? 'Sin descripción disponible';

        console.log('ServiceSelection - Selected service data:', {
            serviceId: selectedService,
            expertProfilePicture,
            expertName,
            servicePrice,
            serviceDescription,
        });

        if (!expertName || servicePrice === 0) {
            console.warn('ServiceSelection - Missing critical data:', { expertName, servicePrice });
            setErrorMessage('Error: Los datos del servicio están incompletos (falta el nombre del experto o el precio).');
            return;
        }

        onComplete(selectedService, expertProfilePicture, expertName, servicePrice, serviceDescription);
    };

    const handleCarouselChange = (serviceId: number, direction: 'next' | 'prev', isDetail = false) => {
        setCarouselIndices((prev) => {
            const currentIndex = prev[serviceId] || 0;
            const totalImages = (isDetail ? detailService?.imageUrls?.length : services.find((s) => s.id === serviceId)?.imageUrls?.length) || 1;
            let newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
            if (newIndex >= totalImages) newIndex = 0;
            if (newIndex < 0) newIndex = totalImages - 1;
            return { ...prev, [serviceId]: newIndex };
        });
    };

    const renderStars = (rating: number) => {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const stars = [];
        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                stars.push(<Star key={i} className="w-4 h-4 fill-current text-yellow-500" />);
            } else if (i === fullStars && hasHalfStar) {
                stars.push(<StarHalf key={i} className="w-4 h-4 fill-current text-yellow-500" />);
            } else {
                stars.push(<Star key={i} className="w-4 h-4 text-gray-300" />);
            }
        }
        return stars;
    };

    const detailService = services.find((s) => s.id === detailServiceId);
    const serviceTypeName = services[0]?.serviceTypeName || serviceTypes.find((st) => st.id === selectedServiceTypeId)?.name || 'Servicios';
    const categoryName = categories.find((c) => c.id === selectedCategory)?.name || 'Categoría';

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-6 py-8">
                                {/* Simplified Header */}
                <div className="flex items-center justify-between mb-6">
                <button
                    onClick={onBack}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm font-medium">Volver</span>
                </button>
                    <span className="text-sm text-gray-500">
                        {services.length} resultado{services.length !== 1 ? 's' : ''}
                    </span>
                </div>

                {/* Main Content with Sidebar */}
                <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
                    {/* Left Sidebar - Hidden on mobile */}
                    <div className="hidden lg:block w-80 flex-shrink-0">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-8">
                            {/* Sidebar Header */}
                            <div className="p-4 border-b border-gray-200">
                                <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wide">
                                    Filtros aplicados
                                </h3>
                            </div>

                            <div className="p-4 space-y-6">
                                {/* Service Type */}
                                <div>
                                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Tipo de servicio</h4>
                                    <div className="flex items-center gap-2 text-sm text-gray-900">
                                        {selectedServiceTypeId === 1 ? (
                                            <Eye className="w-4 h-4 text-gray-400" />
                                        ) : (
                                            <>
                                                <Search className="w-4 h-4 text-gray-400" />
                                                <Eye className="w-4 h-4 text-gray-400" />
                                            </>
                                        )}
                                        <span>
                                            {selectedServiceTypeId === 1 ? 'Solo revisión' : 'Búsqueda web + revisión'}
                                        </span>
                                    </div>
                                </div>

                                {/* Category */}
                                <div>
                                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Categoría</h4>
                                    <div className="flex items-center gap-2 text-sm text-gray-900">
                                        <span className="text-lg">
                                            {selectedCategory === 1 && '🚗'}
                                            {selectedCategory === 2 && '🏍️'}
                                            {selectedCategory === 3 && '🏠'}
                                        </span>
                                        <span>{categoryName}</span>
                                    </div>
                                </div>

                                {/* Location and Range */}
                                <div>
                                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Ubicación</h4>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-sm text-gray-900">
                                            <MapPin className="w-4 h-4 text-gray-400" />
                                            <span>Radio: {locationRange} km</span>
                                        </div>
                                        
                                        {/* Google Map */}
                                        <div className="h-32 rounded border border-gray-200 relative overflow-hidden">
                                            {isLoaded ? (
                                                <GoogleMap
                                                    mapContainerStyle={{ width: '100%', height: '100%' }}
                                                    zoom={getZoomLevel(locationRange)}
                                                    center={mapCenter}
                                                    options={{
                                                        disableDefaultUI: true,
                                                        gestureHandling: 'none',
                                                        zoomControl: false,
                                                        scrollwheel: false,
                                                        disableDoubleClickZoom: true,
                                                        draggable: false,
                                                        styles: [
                                                            {
                                                                featureType: 'poi',
                                                                elementType: 'labels',
                                                                stylers: [{ visibility: 'off' }]
                                                            }
                                                        ]
                                                    }}
                                                >
                                                    <Circle
                                                        center={mapCenter}
                                                        radius={locationRange * 1000}
                                                        options={{
                                                            fillColor: '#3B82F6',
                                                            fillOpacity: 0.1,
                                                            strokeColor: '#3B82F6',
                                                            strokeOpacity: 0.8,
                                                            strokeWeight: 2,
                                                        }}
                                                    />
                                                </GoogleMap>
                                            ) : (
                                                <div className="h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                                                    <div className="w-16 h-16 bg-blue-500 bg-opacity-30 rounded-full border-2 border-blue-500 flex items-center justify-center">
                                                        <MapPin className="w-6 h-6 text-blue-600" />
                                                    </div>
                                                </div>
                                            )}
                                            <div className="absolute bottom-2 left-2 text-xs text-gray-600 font-medium bg-white bg-opacity-90 px-2 py-1 rounded text-center">
                                                {locationRange}km
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Budget Range */}
                                <div>
                                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Rango de precios</h4>
                                    <div className="flex items-center gap-2 text-sm text-gray-900">
                                        <DollarSign className="w-4 h-4 text-gray-400" />
                                        <span>
                                            {selectedCategory === 1 ? 'Hasta €100.000' : 
                                             selectedCategory === 2 ? 'Hasta €50.000' : 
                                             'Hasta €2.000.000'}
                                        </span>
                                    </div>
                                </div>

                                {/* Search Stats */}
                                <div className="pt-6 border-t border-gray-200">
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-500">Resultados</span>
                                            <span className="text-sm font-medium text-gray-900">{services.length}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-500">Precio medio</span>
                                            <span className="text-sm font-medium text-gray-900">
                                                €{Math.round(services.reduce((acc, s) => acc + (s.price || 0), 0) / services.length || 0)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
            </div>

                    {/* Right Content - Services */}
                    <div className="flex-1">
            {errorMessage && (
                            <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-lg shadow-sm text-center">
                    <p className="text-lg">{errorMessage}</p>
                </div>
            )}

                        <div className="space-y-6">
                {services.map((service) => {
                    const savings = Math.floor(Math.random() * 500) + 300;
                    const currentImageIndex = carouselIndices[service.id] || 0;
                    const isTopRated = service.averageRating >= 4.8;
                    const isChoice = service.completedSearches > 10;
                    const isPro = service.expert?.isPro || service.completedSearches > 5;

                    return (
                        <div
                            key={service.id}
                            className={`bg-white rounded-lg shadow-md overflow-hidden border transition-all duration-300 hover:shadow-lg ${
                                selectedService === service.id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
                            }`}
                        >
                                                        {/* Mobile Layout */}
                            <div className="lg:hidden">
                                {/* Header with Expert Profile */}
                                <div className="flex items-center gap-3 p-4 border-b border-gray-100">
                                    <div className="flex-shrink-0">
                                        {service.expert && service.expert.profilePictureUrl ? (
                                            <img
                                                src={service.expert.profilePictureUrl}
                                                alt={service.expert.user?.name || 'Experto'}
                                                className="w-10 h-10 rounded-full object-cover"
                                                onError={(e) => {
                                                    console.error(`Failed to load profile picture for service ${service.id}: ${service.expert.profilePictureUrl}`);
                                                    e.currentTarget.style.display = 'none';
                                                    e.currentTarget.nextElementSibling!.style.display = 'flex';
                                                }}
                                            />
                                        ) : (
                                            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                                                <User className="w-5 h-5 text-gray-500" />
                                            </div>
                                        )}
                                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center" style={{ display: 'none' }}>
                                            <User className="w-5 h-5 text-gray-500" />
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-base font-bold text-gray-900">
                                                {service.expert?.user?.name || 'Experto desconocido'}
                                            </h3>
                                            {isPro && (
                                                <span className="bg-orange-500 text-white px-2 py-0.5 rounded text-xs font-medium">
                                                    Vetted Pro
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className="flex">
                                                {renderStars('averageRating' in service ? service.averageRating : 0)}
                                            </div>
                                            <span className="text-xs font-semibold text-gray-900">
                                                {'averageRating' in service ? service.averageRating.toFixed(1) : '0.0'}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                ({service.expert?.reviews?.length || 0})
                                            </span>
                                        </div>
                                    </div>
                                                                </div>

                                {/* Service Info */}
                                <div className="p-4">
                                    <p className="text-gray-900 text-sm mb-3 leading-relaxed">
                                        {truncateTextMobile(service.conditions || 'Servicio profesional personalizado para tus necesidades específicas.')}
                                    </p>

                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {['Customización', 'Revisión de vehículos', 'Inspección técnica'].map((tag) => (
                                            <span key={tag} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>

                                                                                                            {/* Portfolio Images - Moved Below Description */}
                                    {service.imageUrls && service.imageUrls.length > 0 && (
                                        <div className="flex gap-1 mb-4">
                                            {service.imageUrls.slice(0, 3).map((url, index) => (
                                                <div key={index} className="relative rounded overflow-hidden flex-1 h-28">
                                                    <img
                                                        src={url}
                                                        alt={`Portfolio ${index + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                                    {service.imageUrls.length > 3 && index === 2 && (
                                                        <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                                                            <span className="text-white font-semibold text-sm">+{service.imageUrls.length - 3}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            {/* Empty placeholders to maintain 1/3 width for single images */}
                                            {service.imageUrls.length === 1 && (
                                                <>
                                                    <div className="flex-1"></div>
                                                    <div className="flex-1"></div>
                                            </>
                                        )}
                                            {service.imageUrls.length === 2 && (
                                                <div className="flex-1"></div>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <div className="text-sm text-gray-600 mb-1">Desde</div>
                                            <div className="text-lg font-bold text-gray-900">
                                                {service.price
                                                    ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(service.price)
                                                    : '€72'}/proyecto
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setSelectedService(service.id)}
                                            className={`px-4 py-2 rounded font-medium text-sm transition-all duration-200 ${
                                                selectedService === service.id
                                                    ? 'bg-blue-600 text-white shadow-md'
                                                    : 'bg-gray-900 text-white hover:bg-gray-800'
                                            }`}
                                        >
                                            {selectedService === service.id ? 'Seleccionado' : 'Contactar'}
                                        </button>
                                    </div>

                                    {selectedService === service.id && (
                                        <div className="flex items-center justify-center gap-1 text-blue-600 text-xs">
                                            <CheckCircle className="w-3 h-3" />
                                            <span>¡Seleccionado!</span>
                                    </div>
                                )}
                                </div>
                            </div>

                            {/* Desktop Layout */}
                            <div className="hidden lg:flex">
                                {/* Left Side - Expert Profile */}
                                <div className="flex-shrink-0 p-4 w-20">
                                    <div className="relative">
                                    {service.expert && service.expert.profilePictureUrl ? (
                                        <img
                                            src={service.expert.profilePictureUrl}
                                            alt={service.expert.user?.name || 'Experto'}
                                                className="w-12 h-12 rounded-full object-cover"
                                            onError={(e) => {
                                                console.error(`Failed to load profile picture for service ${service.id}: ${service.expert.profilePictureUrl}`);
                                                e.currentTarget.style.display = 'none';
                                                e.currentTarget.nextElementSibling!.style.display = 'flex';
                                            }}
                                        />
                                    ) : (
                                            <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                                                <User className="w-6 h-6 text-gray-500" />
                                            </div>
                                        )}
                                        <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center" style={{ display: 'none' }}>
                                            <User className="w-6 h-6 text-gray-500" />
                                        </div>
                                    </div>
                                </div>

                                {/* Center - Content */}
                                <div className="flex-1 p-4">
                                    {/* Header with name and badges */}
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-lg font-bold text-gray-900">
                                                    {service.expert?.user?.name || 'Experto desconocido'}
                                                </h3>
                                                {isPro && (
                                                    <span className="bg-orange-500 text-white px-2 py-1 rounded text-xs font-medium">
                                                        Vetted Pro
                                                    </span>
                                                )}
                                                {isChoice && (
                                                    <span className="bg-gray-800 text-white px-2 py-1 rounded text-xs font-medium">
                                                        Fiverr's Choice
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1 mb-2">
                                                <div className="flex">
                                                    {renderStars('averageRating' in service ? service.averageRating : 0)}
                                                </div>
                                                <span className="text-sm font-semibold text-gray-900">
                                                    {'averageRating' in service ? service.averageRating.toFixed(1) : '0.0'}
                                                </span>
                                                <span className="text-sm text-gray-500">
                                                    ({service.expert?.reviews?.length || 0})
                                                </span>
                            </div>
                                        </div>
                                    </div>

                                    {/* Service Description */}
                                    <p className="text-gray-900 text-sm mb-3 leading-relaxed">
                                        {truncateText(service.conditions || 'Servicio profesional personalizado para tus necesidades específicas.')}
                                    </p>

                                    {/* Location and Stats */}
                                    <div className="flex items-center gap-1 text-sm text-gray-600 mb-3">
                                        <span>🇪🇸 España</span>
                                        <span className="mx-2">•</span>
                                        <Clock className="w-3 h-3" />
                                        <span>Ofertas tarifas por horas</span>
                                    </div>

                                    {/* Service Tags */}
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {['Customización', 'Revisión de vehículos', 'Inspección técnica', 'PHP', '+17'].map((tag) => (
                                            <span key={tag} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Right Side - Pricing Only */}
                                <div className="flex-shrink-0 w-80 p-4">
                                    {/* Pricing and Actions */}
                                    <div className="text-right">
                                        <div className="mb-3">
                                            <div className="text-sm text-gray-600 mb-1">Desde</div>
                                            <div className="text-lg font-bold text-gray-900">
                                    {service.price
                                        ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(service.price)
                                                    : '€72'}/proyecto
                                </div>
                                            <div className="text-xs text-gray-500">Garantía de satisfacción</div>
                                </div>

                                        {/* Action Buttons */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setSelectedService(service.id)}
                                                className={`flex-1 px-3 py-2 rounded font-medium text-sm transition-all duration-200 ${
                                                    selectedService === service.id
                                                        ? 'bg-blue-600 text-white shadow-md'
                                                        : 'bg-gray-900 text-white hover:bg-gray-800'
                                                }`}
                                            >
                                                {selectedService === service.id ? 'Seleccionado' : 'Seleccionar'}
                                    </button>
                                    <button
                                        onClick={() => setDetailServiceId(service.id)}
                                                className="px-3 py-2 border border-gray-300 text-gray-700 rounded hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 text-sm"
                                    >
                                                Ver perfil
                                    </button>
                                </div>

                                        {/* Selected Indicator */}
                                {selectedService === service.id && (
                                            <div className="flex items-center justify-center gap-1 mt-2 text-blue-600 text-xs">
                                                <CheckCircle className="w-3 h-3" />
                                                <span>¡Seleccionado!</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Portfolio Images - Below entire card in desktop */}
                            {service.imageUrls && service.imageUrls.length > 0 && (
                                <div className="hidden lg:block p-4 border-t border-gray-100">
                                    <div className="flex gap-1">
                                        {service.imageUrls.slice(0, 3).map((url, index) => (
                                            <div key={index} className="relative rounded overflow-hidden flex-1 h-40">
                                                <img
                                                    src={url}
                                                    alt={`Portfolio ${index + 1}`}
                                                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                                />
                                                {service.imageUrls.length > 3 && index === 2 && (
                                                    <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                                                        <span className="text-white font-semibold text-lg">+{service.imageUrls.length - 3}</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {/* Empty placeholders to maintain 1/3 width for single images */}
                                        {service.imageUrls.length === 1 && (
                                            <>
                                                <div className="flex-1"></div>
                                                <div className="flex-1"></div>
                                            </>
                                        )}
                                        {service.imageUrls.length === 2 && (
                                            <div className="flex-1"></div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
                        </div>

                        {/* Continue Button */}
                        <div className="sticky bottom-8 flex justify-end mt-8">
                            <button
                                onClick={handleContinue}
                                disabled={selectedService === null}
                                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Continuar
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {detailService && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden shadow-2xl transform transition-all duration-300 ease-in-out">
                        {/* Header with gradient */}
                        <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
                            <div className="flex justify-between items-center">
                                <div className="text-white">
                                    <h2 className="text-2xl font-bold">{detailService.serviceTypeName || 'Perfil del Experto'}</h2>
                                    <p className="text-blue-100 text-sm mt-1">Información detallada del servicio</p>
                                </div>
                                <button
                                    onClick={() => setDetailServiceId(null)}
                                    className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-full transition-all duration-200"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        {/* Scrollable Content */}
                        <div className="overflow-y-auto max-h-[calc(95vh-80px)]">
                            <div className="p-6">
                        {/* Expert Profile Section */}
                        <div className="flex flex-col lg:flex-row gap-6 mb-8">
                            {/* Expert Info */}
                            <div className="lg:w-1/3">
                                <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                                    <div className="text-center">
                                        {detailService.expert && detailService.expert.profilePictureUrl ? (
                                            <img
                                                src={detailService.expert.profilePictureUrl}
                                                alt={detailService.expert.user?.name || 'Experto'}
                                                className="w-24 h-24 object-cover rounded-full border-4 border-white shadow-lg mx-auto mb-4"
                                                onError={(e) => {
                                                    console.error(`Failed to load profile picture in modal for service ${detailService.id}: ${detailService.expert.profilePictureUrl}`);
                                                    e.currentTarget.style.display = 'none';
                                                    e.currentTarget.nextElementSibling!.style.display = 'flex';
                                                }}
                                            />
                                        ) : null}
                                        <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center rounded-full border-4 border-white shadow-lg mx-auto mb-4" style={{ display: detailService.expert?.profilePictureUrl ? 'none' : 'flex' }}>
                                            <User className="w-12 h-12 text-blue-600" />
                                        </div>
                                        
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                                            {detailService.expert?.user?.name || 'Experto Profesional'}
                                        </h3>
                                        
                                        <div className="flex items-center justify-center gap-2 mb-3">
                                            <Crown className="w-4 h-4 text-orange-500" />
                                            <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                                                Vetted Pro
                                            </span>
                                        </div>

                                        {'averageRating' in detailService && (
                                            <div className="flex items-center justify-center gap-2 mb-4">
                                                <div className="flex">{renderStars(detailService.averageRating)}</div>
                                                <span className="text-sm font-semibold text-gray-900">
                                                    {detailService.averageRating.toFixed(1)}
                                                </span>
                                                <span className="text-sm text-gray-500">
                                                    ({detailService.expert?.reviews?.length || 0} reseñas)
                                                </span>
                                            </div>
                                        )}

                                        <div className="space-y-2 text-sm text-gray-600">
                                            <div className="flex items-center justify-center gap-2">
                                                <Award className="w-4 h-4 text-blue-500" />
                                                <span>Experto Verificado</span>
                                            </div>
                                            <div className="flex items-center justify-center gap-2">
                                                <Shield className="w-4 h-4 text-green-500" />
                                                <span>Garantía de Calidad</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Portfolio Images */}
                            <div className="lg:w-2/3">
                                <h4 className="text-lg font-semibold text-gray-900 mb-4">Portfolio</h4>
                                {detailService.imageUrls && detailService.imageUrls.length > 0 ? (
                                    <div className="relative">
                                        <div className="relative h-80 rounded-2xl overflow-hidden shadow-lg">
                                            <img
                                                src={detailService.imageUrls[carouselIndices[detailService.id] || 0]}
                                                alt={`Portfolio ${(carouselIndices[detailService.id] || 0) + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                            {detailService.imageUrls.length > 1 && (
                                                <>
                                                    <button
                                                        onClick={() => handleCarouselChange(detailService.id, 'prev', true)}
                                                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 backdrop-blur-sm text-white p-3 rounded-full hover:bg-black/70 transition-all duration-200"
                                                    >
                                                        <ChevronLeft className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleCarouselChange(detailService.id, 'next', true)}
                                                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 backdrop-blur-sm text-white p-3 rounded-full hover:bg-black/70 transition-all duration-200"
                                                    >
                                                        <ChevronRight className="w-5 h-5" />
                                                    </button>
                                                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                                                        {detailService.imageUrls.map((_, index) => (
                                                            <button
                                                                key={index}
                                                                onClick={() => setCarouselIndices(prev => ({ ...prev, [detailService.id]: index }))}
                                                                className={`w-3 h-3 rounded-full transition-all duration-200 ${
                                                                    index === (carouselIndices[detailService.id] || 0) 
                                                                        ? 'bg-white scale-110' 
                                                                        : 'bg-white/60 hover:bg-white/80'
                                                                }`}
                                                            />
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                        
                                        {/* Thumbnail row */}
                                        {detailService.imageUrls.length > 1 && (
                                            <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                                                {detailService.imageUrls.map((url, index) => (
                                                    <button
                                                        key={index}
                                                        onClick={() => setCarouselIndices(prev => ({ ...prev, [detailService.id]: index }))}
                                                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                                                            index === (carouselIndices[detailService.id] || 0)
                                                                ? 'border-blue-500 scale-105'
                                                                : 'border-gray-200 hover:border-gray-300'
                                                        }`}
                                                    >
                                                        <img
                                                            src={url}
                                                            alt={`Thumbnail ${index + 1}`}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="w-full h-80 bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300">
                                        <Star className="w-16 h-16 text-gray-400 mb-3" />
                                        <p className="text-gray-500 text-lg font-medium">Sin portfolio disponible</p>
                                        <p className="text-gray-400 text-sm">Este experto aún no ha subido imágenes de muestra</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        {/* Service Description */}
                        <div className="mb-8">
                            <h4 className="text-lg font-semibold text-gray-900 mb-4">Descripción del Servicio</h4>
                            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                                <p className="text-gray-700 leading-relaxed">
                                    {detailService.conditions || 'Servicio profesional personalizado para tus necesidades específicas. Ofrecemos soluciones de alta calidad con garantía de satisfacción.'}
                                </p>
                                <div className="flex flex-wrap gap-2 mt-4">
                                    {['Servicio Premium', 'Garantía incluida', 'Soporte 24/7'].map((tag) => (
                                        <span key={tag} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Reviews Section */}
                        <div className="mb-8">
                            <h4 className="text-lg font-semibold text-gray-900 mb-4">
                                Reseñas y Valoraciones 
                                {detailService.expert?.reviews?.length > 0 && (
                                    <span className="text-sm font-normal text-gray-500 ml-2">
                                        ({detailService.expert.reviews.length} reseña{detailService.expert.reviews.length !== 1 ? 's' : ''})
                                    </span>
                                )}
                            </h4>
                            {detailService.expert?.reviews && detailService.expert.reviews.length > 0 ? (
                                <div className="space-y-4">
                                    {detailService.expert.reviews.map((review) => (
                                        <div key={review.id} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                                                        <User className="w-5 h-5 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">Cliente verificado</p>
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex">{renderStars(review.score)}</div>
                                                            <span className="text-sm font-semibold text-gray-900">{review.score.toFixed(1)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className="text-sm text-gray-500">
                                                    {new Date(review.createdAt).toLocaleDateString('es-ES', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    })}
                                                </span>
                                            </div>
                                            <p className="text-gray-700 leading-relaxed">{review.description}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-gray-50 rounded-xl p-8 text-center border border-gray-200">
                                    <Star className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                    <p className="text-gray-500 font-medium">Sin reseñas aún</p>
                                    <p className="text-gray-400 text-sm mt-1">Este experto está disponible para recibir su primera valoración</p>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-6 border-t border-gray-200">
                            <button
                                onClick={() => setDetailServiceId(null)}
                                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium"
                            >
                                Cerrar
                            </button>
                            <button
                                onClick={() => {
                                    // TODO: Implement contact functionality
                                    setDetailServiceId(null);
                                }}
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                            >
                                Contactar Experto
                            </button>
                        </div>
                        </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}