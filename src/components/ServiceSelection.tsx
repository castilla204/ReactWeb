import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Clock, Star, CheckCircle, User, StarHalf, X, MapPin, DollarSign, Eye, Search } from 'lucide-react';
import { GoogleMap, useLoadScript, Circle } from '@react-google-maps/api';
import { useCategories } from '../contexts/CategoryContext';
import { useServices } from '../hooks/useServices';
import { useServiceTypes } from '../hooks/useServiceTypes';

const libraries: ("geometry" | "places")[] = ['geometry', 'places'];

interface ServiceSelectionProps {
    onBack: () => void;
    onComplete: (serviceId: number, expertProfilePicture?: string, expertName?: string, servicePrice?: number, serviceDescription?: string, serviceImageUrls?: string[]) => void;
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
    const [carouselIndices, setCarouselIndices] = useState<{ [key: number]: number }>({});
    const [filters, setFilters] = useState({
        priceRange: 'all' as 'all' | 'low' | 'medium' | 'high',
        rating: 'all' as 'all' | '4+' | '4.5+',
        experience: 'all' as 'all' | 'new' | 'experienced' | 'pro'
    });
    
    // Google Maps configuration
    const { isLoaded } = useLoadScript({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "__REDACTED_GOOGLE_API_KEY__",
        libraries
    });

    const mapCenter = {
        lat: parseFloat(latitude?.toString() || '40.4168') || 40.4168,
        lng: parseFloat(longitude?.toString() || '-3.7038') || -3.7038
    };

    const getZoomLevel = (range: number) => {
        if (range <= 5) return 13;
        if (range <= 10) return 12;
        if (range <= 25) return 11;
        if (range <= 50) return 10;
        return 9;
    };

    const { services: allServices, isLoading, error } = useServices({
        categoryId: selectedCategory,
        serviceTypeId: selectedServiceTypeId,
        latitude,
        longitude,
        locationRange,
    });

    // Aplicar filtros
    const services = allServices.filter(service => {
        // Filtro de precio
        if (filters.priceRange !== 'all') {
            const price = service.price || 0;
            if (filters.priceRange === 'low' && price > 50) return false;
            if (filters.priceRange === 'medium' && (price <= 50 || price > 150)) return false;
            if (filters.priceRange === 'high' && price <= 150) return false;
        }

        // Filtro de rating
        if (filters.rating !== 'all') {
            const rating = service.averageRating || 0;
            if (filters.rating === '4+' && rating < 4) return false;
            if (filters.rating === '4.5+' && rating < 4.5) return false;
        }

        // Filtro de experiencia
        if (filters.experience !== 'all') {
            const completedSearches = service.completedSearches || 0;
            if (filters.experience === 'new' && completedSearches > 2) return false;
            if (filters.experience === 'experienced' && (completedSearches <= 2 || completedSearches > 10)) return false;
            if (filters.experience === 'pro' && completedSearches <= 10) return false;
        }

        return true;
    });


    // Helper function to truncate text to 600 characters
    const truncateText = (text: string, maxLength: number = 120): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
};

const truncateTextMobile = (text: string, maxLength: number = 80): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
};

    // Depuración: Mostrar los servicios recibidos
    console.log('ServiceSelection - Services received:', services);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    {/* Header Skeleton */}
                    <div className="mb-6 bg-white border border-gray-100/50 rounded-2xl p-3 md:p-6 shadow-lg animate-pulse">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                            <div className="h-6 bg-gray-200 rounded w-64"></div>
                        </div>
                        <div className="space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
                        {/* Sidebar Skeleton */}
                        <div className="hidden lg:block w-80 flex-shrink-0">
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-8 overflow-hidden animate-pulse">
                                <div className="p-4 border-b border-gray-200">
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-gray-200 rounded"></div>
                                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                                    </div>
                                </div>
                                <div className="p-4 space-y-6">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i}>
                                            <div className="h-3 bg-gray-200 rounded w-20 mb-2"></div>
                                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-4 h-4 bg-gray-200 rounded"></div>
                                                    <div className="h-4 bg-gray-200 rounded flex-1"></div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Services Skeleton */}
                        <div className="flex-1">
                            <div className="space-y-6">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200/60 animate-pulse">
                                        {/* Mobile Layout Skeleton */}
                                        <div className="lg:hidden">
                                            <div className="flex items-center gap-3 p-4 bg-gray-50 border-b border-gray-100">
                                                <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                                                <div className="flex-1">
                                                    <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                                                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                                                </div>
                                            </div>
                                            <div className="p-4 space-y-3">
                                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                                <div className="flex gap-2 mt-4">
                                                    <div className="h-8 bg-gray-200 rounded flex-1"></div>
                                                    <div className="h-8 bg-gray-200 rounded w-20"></div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Desktop Layout Skeleton */}
                                        <div className="hidden lg:flex">
                                            <div className="w-24 bg-gray-50 flex items-center justify-center p-4">
                                                <div className="w-16 h-16 bg-gray-200 rounded-xl"></div>
                                            </div>
                                            <div className="flex-1 p-6">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="flex-1">
                                                        <div className="h-5 bg-gray-200 rounded w-48 mb-2"></div>
                                                        <div className="h-3 bg-gray-200 rounded w-32"></div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="h-6 bg-gray-200 rounded w-20 mb-1"></div>
                                                        <div className="h-3 bg-gray-200 rounded w-16"></div>
                                                    </div>
                                                </div>
                                                <div className="space-y-2 mb-4">
                                                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                                                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                                                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                                                </div>
                                                <div className="flex gap-3">
                                                    <div className="h-9 bg-gray-200 rounded flex-1"></div>
                                                    <div className="h-9 bg-gray-200 rounded w-20"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
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
        const serviceImageUrls = selectedServiceData.imageUrls ?? [];

        console.log('ServiceSelection - Selected service data:', {
            serviceId: selectedService,
            expertProfilePicture,
            expertName,
            servicePrice,
            serviceDescription,
            serviceImageUrls,
        });

        if (!expertName || servicePrice === 0) {
            console.warn('ServiceSelection - Missing critical data:', { expertName, servicePrice });
            setErrorMessage('Error: Los datos del servicio están incompletos (falta el nombre del experto o el precio).');
            return;
        }

        onComplete(selectedService, expertProfilePicture, expertName, servicePrice, serviceDescription, serviceImageUrls);
    };

    // Función auxiliar para manejar el carrusel de imágenes
    const handleCarouselChange = (serviceId: number, direction: 'prev' | 'next', isModal = false) => {
        const service = services.find(s => s.id === serviceId);
        if (!service || !service.imageUrls || service.imageUrls.length === 0) return;

        setCarouselIndices(prev => {
            const current = prev[serviceId] || 0;
            let newIndex;
            
            if (direction === 'prev') {
                newIndex = current === 0 ? service.imageUrls.length - 1 : current - 1;
            } else {
                newIndex = current === service.imageUrls.length - 1 ? 0 : current + 1;
            }
            
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
    const categoryName = categories.find((c) => c.id === selectedCategory)?.name || 'Categoría';

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-6 pt-2 pb-4">
                                {/* Simplified Header */}
                <div className="flex items-center justify-end mb-4">
                    <span className="text-sm text-gray-500">
                        {services.length} resultado{services.length !== 1 ? 's' : ''}
                    </span>
                </div>

                {/* Main Content with Sidebar */}
                <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
                    {/* Left Sidebar - Hidden on mobile */}
                    <div className="hidden lg:block w-80 flex-shrink-0">
                        <div className="bg-white rounded-lg shadow-xl border border-gray-200/60 sticky top-8 overflow-hidden">
                            {/* Sidebar Header */}
                            <div className="p-6 bg-gradient-to-br from-blue-50 via-indigo-50/50 to-purple-50/30 border-b border-gray-200/50">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-md bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
                                        <Search className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">
                                            Criterios de Búsqueda
                                        </h3>
                                        <p className="text-sm text-blue-600/80 mt-1 font-medium">Configuración aplicada</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Main Info - Clean Layout */}
                                <div className="space-y-4">
                                    {/* Service Type and Category */}
                                    <div className="space-y-3">
                                        <div>
                                            <div className="text-xs text-gray-500 mb-1 font-medium">Tipo de servicio</div>
                                            <div className="text-sm font-semibold text-gray-800">
                                                {selectedServiceTypeId === 1 ? 'Solo revisión' : 'Búsqueda web + revisión'}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500 mb-1 font-medium">Categoría</div>
                                            <div className="text-sm font-semibold text-gray-800">
                                                {categoryName}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Location and Price */}
                                    <div className="space-y-3">
                                        <div>
                                            <div className="text-xs text-gray-500 mb-1 font-medium">Ubicación</div>
                                            <div className="text-sm font-semibold text-gray-800">
                                                Radio: {locationRange} km
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500 mb-1 font-medium">Rango de precios</div>
                                            <div className="text-sm font-semibold text-gray-800">
                                                {selectedCategory === 1 ? 'Hasta €100.000' : 
                                                 selectedCategory === 2 ? 'Hasta €50.000' : 
                                                 'Hasta €2.000.000'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                        
                                {/* Map - Full Width */}
                                <div className="group">
                                    <div className="text-sm text-gray-600 mb-3 font-medium">
                                        Mapa de ubicación
                                    </div>
                                    <div className="h-32 rounded-md border border-indigo-200/60 relative overflow-hidden bg-gradient-to-br from-indigo-50/50 to-slate-50 shadow-sm group-hover:shadow-md transition-all duration-200">
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
                                                        fillColor: '#6366F1',
                                                        fillOpacity: 0.15,
                                                        strokeColor: '#6366F1',
                                                            strokeOpacity: 0.8,
                                                            strokeWeight: 2,
                                                        zIndex: 1,
                                                        clickable: false,
                                                        editable: false,
                                                        draggable: false
                                                        }}
                                                    />
                                                </GoogleMap>
                                            ) : (
                                            <div className="h-full bg-gradient-to-br from-indigo-100 to-slate-100 flex items-center justify-center">
                                                <div className="text-xs font-medium text-indigo-600">Cargando mapa...</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                {/* Filters */}
                                <div className="pt-6 border-t border-gray-200/60">
                                    <div className="text-sm text-gray-600 mb-4 font-medium">
                                        Filtros adicionales
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        {/* Price Range Filter */}
                                        <div>
                                            <label className="text-xs text-gray-500 mb-2 block font-medium">Precio</label>
                                            <select 
                                                value={filters.priceRange}
                                                onChange={(e) => setFilters(prev => ({ ...prev, priceRange: e.target.value as any }))}
                                                className="w-full text-xs border border-gray-200 rounded-md px-3 py-2.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:border-gray-300 transition-all duration-200 shadow-sm"
                                            >
                                                <option value="all">Todos</option>
                                                <option value="low">Hasta €50</option>
                                                <option value="medium">€50-€150</option>
                                                <option value="high">+€150</option>
                                            </select>
                                        </div>

                                        {/* Rating Filter */}
                                        <div>
                                            <label className="text-xs text-gray-500 mb-2 block font-medium">Valoración</label>
                                            <select 
                                                value={filters.rating}
                                                onChange={(e) => setFilters(prev => ({ ...prev, rating: e.target.value as any }))}
                                                className="w-full text-xs border border-gray-200 rounded-md px-3 py-2.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:border-gray-300 transition-all duration-200 shadow-sm"
                                            >
                                                <option value="all">Todas</option>
                                                <option value="4+">4+ ⭐</option>
                                                <option value="4.5+">4.5+ ⭐</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Search Stats */}
                                <div className="pt-6 border-t border-gray-200/60">
                                    <div className="text-sm text-gray-600 mb-4 font-medium">
                                        Resumen
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-gradient-to-br from-blue-50/80 to-blue-100/50 border border-blue-200/60 rounded-md p-4 text-center hover:shadow-lg transition-all duration-200">
                                            <div className="text-2xl font-bold text-blue-900">{services.length}</div>
                                            <div className="text-xs font-semibold text-blue-700 mt-1">Resultados</div>
                                        </div>
                                        <div className="bg-gradient-to-br from-green-50/80 to-green-100/50 border border-green-200/60 rounded-md p-4 text-center hover:shadow-lg transition-all duration-200">
                                            <div className="text-2xl font-bold text-green-900">
                                                €{Math.round(services.reduce((acc, s) => acc + (s.price || 0), 0) / services.length || 0)}
                                            </div>
                                            <div className="text-xs font-semibold text-green-700 mt-1">Precio medio</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
            </div>

                    {/* Right Content - Services */}
                    <div className="flex-1">
                        {/* Instructions Header */}
                        <div className="mb-6 bg-gradient-to-r from-blue-50/50 to-indigo-50/30 border border-blue-200/50 rounded-lg p-4 md:p-6 shadow-lg">
                            <div className="flex items-start gap-4">
                                <div className="flex items-center justify-center w-10 h-10 rounded-md bg-gradient-to-br from-blue-500 to-blue-600 flex-shrink-0 shadow-lg">
                                    <User className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-2">
                                        {selectedServiceTypeId === 1 ? 'Selección de inspector especializado' : 'Selección de experto en búsquedas'}
                                    </h2>
                                    <p className="text-sm md:text-base text-gray-600 leading-relaxed mb-3">
                                        {selectedServiceTypeId === 1 
                                            ? 'Profesionales certificados que realizarán la inspección en la ubicación especificada.'
                                            : 'Especialistas que ejecutarán búsquedas automatizadas e inspecciones presenciales.'
                                        }
                                    </p>
                                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 font-medium">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                            <span>Certificados</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                            <span>Verificados</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                            <span>Pago seguro</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Auto-Refund Guarantee */}
                        <div className="mb-4 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200/60 rounded-lg p-3 shadow-sm">
                            <div className="flex items-center gap-2">
                                <div className="flex items-center justify-center w-5 h-5 rounded-md bg-emerald-100 flex-shrink-0">
                                    <svg className="w-3 h-3 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xs font-semibold text-emerald-900 mb-1">Garantía de Respuesta Rápida</h3>
                                    <p className="text-xs text-emerald-700 leading-relaxed">
                                        Devolución automática en 24h si el experto no responde
                                    </p>
                                </div>
                            </div>
                        </div>

                        {errorMessage && (
                            <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-lg shadow-sm text-center">
                                <p className="text-lg">{errorMessage}</p>
                            </div>
                        )}

                        <div className="space-y-6">
                {services.map((service) => {
                    const savings = Math.floor(Math.random() * 500) + 300;
                    const currentImageIndex = carouselIndices[service.id] || 0;
                    const isTopRated = (service.averageRating || 0) >= 4.8;
                    const isChoice = (service.completedSearches || 0) > 10;
                    const isPro = (service.completedSearches || 0) > 5;

                    return (
                        <div
                            key={service.id}
                            className={`bg-white rounded-lg shadow-xl overflow-hidden border transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] ${
                                selectedService === service.id ? 'border-emerald-500 ring-2 ring-emerald-200/50 shadow-2xl bg-gradient-to-br from-emerald-50/50 to-emerald-100/30' : 'border-gray-200/60 hover:border-gray-300'
                            }`}
                        >
                                                        {/* Mobile Layout */}
                            <div className="lg:hidden">
                                {/* Header with Expert Profile */}
                                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-gray-50 to-blue-50/30 border-b border-gray-100">
                                    <div className="flex-shrink-0">
                                        {service.expert && service.expert.profilePictureUrl ? (
                                            <div className="relative">
                                            <img
                                                src={service.expert.profilePictureUrl}
                                                alt={service.expert.user?.name || 'Experto'}
                                                    className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-lg"
                                                onError={(e) => {
                                                        console.error(`Failed to load profile picture for service ${service.id}: ${service.expert?.profilePictureUrl}`);
                                                    e.currentTarget.style.display = 'none';
                                                        (e.currentTarget.nextElementSibling as HTMLElement)!.style.display = 'flex';
                                                    }}
                                                />
                                                {isPro && (
                                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center border-2 border-white">
                                                        <CheckCircle className="w-3 h-3 text-white" />
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-500 rounded-xl flex items-center justify-center border-2 border-white shadow-lg">
                                                <User className="w-6 h-6 text-white" />
                                            </div>
                                        )}
                                        <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-500 rounded-xl flex items-center justify-center border-2 border-white shadow-lg" style={{ display: 'none' }}>
                                            <User className="w-6 h-6 text-white" />
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-base font-bold text-gray-900">
                                                {service.expert?.user?.name || 'Experto desconocido'}
                                            </h3>
                                            {isPro && (
                                                <span className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-2.5 py-0.5 rounded-full text-xs font-semibold shadow-sm">
                                                    Pro
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className="flex">
                                                {renderStars(service.averageRating || 0)}
                                            </div>
                                            <span className="text-xs font-bold text-gray-900">
                                                {(service.averageRating || 0).toFixed(1)}
                                            </span>
                                            <span className="text-xs text-gray-500 font-medium">
                                                ({service.expert?.reviews?.length || 0} reseñas)
                                            </span>
                                        </div>
                                    </div>
                                                                </div>

                                {/* Service Info */}
                                <div className="p-4">
                                    <p className="text-gray-900 text-sm mb-2 leading-snug">
                                        {truncateTextMobile(service.conditions || 'Servicio profesional personalizado.')}
                                    </p>

                                    <div className="flex flex-wrap gap-1 mb-3">
                                        {['Revisión completa', 'Análisis detallado'].map((tag) => (
                                            <span key={tag} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>

                                                                                                            {/* Portfolio Images - Moved Below Description */}
                                    {service.imageUrls && service.imageUrls.length > 0 && (
                                        <div className="flex gap-1 mb-3">
                                            {service.imageUrls.slice(0, 3).map((url, index) => (
                                                <div key={index} className="relative rounded overflow-hidden flex-1 h-20">
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

                                    <div className="mb-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <div>
                                                <div className="text-sm text-gray-600 mb-1">Desde</div>
                                                <div className="text-lg text-gray-900">
                                                    <span className="font-bold">
                                                        {service.price
                                                            ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(service.price)
                                                            : '€72'}
                                                    </span>/servicio
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                                <button
                                                onClick={() => setSelectedService(service.id)}
                                                className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200 shadow-lg hover:shadow-xl ${
                                                    selectedService === service.id
                                                        ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:from-emerald-700 hover:to-emerald-800'
                                                        : 'bg-gradient-to-r from-gray-900 to-gray-800 text-white hover:from-gray-800 hover:to-gray-700'
                                                }`}
                                            >
                                                {selectedService === service.id ? '✓ Seleccionado' : 'Seleccionar'}
                                                </button>
                                                <button
                                                onClick={() => setDetailServiceId(service.id)}
                                                className="px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 text-sm font-semibold shadow-sm hover:shadow-md"
                                                >
                                                Ver
                                                </button>
                                        </div>
                                    </div>

                                    {selectedService === service.id && (
                                        <div className="flex items-center justify-center gap-1 text-emerald-600 text-xs">
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
                                                console.error(`Failed to load profile picture for service ${service.id}: ${service.expert?.profilePictureUrl}`);
                                                e.currentTarget.style.display = 'none';
                                                    (e.currentTarget.nextElementSibling as HTMLElement)!.style.display = 'flex';
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
                                                    {renderStars(service.averageRating || 0)}
                                                </div>
                                                <span className="text-sm font-semibold text-gray-900">
                                                    {(service.averageRating || 0).toFixed(1)}
                                                </span>
                                                <span className="text-sm text-gray-500">
                                                    ({service.expert?.reviews?.length || 0})
                                                </span>
                                    </div>
                                </div>
                            </div>

                                    {/* Service Description */}
                                    <p className="text-gray-900 text-sm mb-2 leading-snug">
                                        {truncateText(service.conditions || 'Servicio profesional personalizado.')}
                                    </p>

                                    {/* Location and Stats */}
                                    <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                                        <span>🇪🇸 España</span>
                                        <span className="mx-2">•</span>
                                        <Clock className="w-3 h-3" />
                                        <span>Tarifas por horas</span>
                                    </div>

                                    {/* Service Tags */}
                                    <div className="flex flex-wrap gap-1 mb-3">
                                        {['Revisión completa', 'Análisis detallado'].map((tag) => (
                                            <span key={tag} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Portfolio Images - Aligned with description in desktop */}
                                    {service.imageUrls && service.imageUrls.length > 0 && (
                                        <div className="flex gap-1 mb-4">
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
                                    )}
                                </div>

                                {/* Right Side - Pricing Only */}
                                <div className="flex-shrink-0 w-80 p-4">
                                    {/* Pricing and Actions */}
                                    <div className="text-right">
                                        <div className="mb-3">
                                            <div className="text-sm text-gray-600 mb-1">Desde</div>
                                            <div className="text-lg text-gray-900">
                                                <span className="font-bold">
                                    {service.price
                                        ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(service.price)
                                                        : '€72'}
                                                </span>/servicio
                                </div>
                                            <div className="text-xs text-gray-500">Garantía de satisfacción</div>
                                </div>

                                        {/* Action Buttons */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setSelectedService(service.id)}
                                                className={`flex-1 py-2.5 px-4 rounded font-medium text-sm transition-all duration-200 ${
                                                    selectedService === service.id
                                                        ? 'bg-emerald-600 text-white shadow-md hover:bg-emerald-700'
                                                        : 'bg-gray-900 text-white hover:bg-gray-800'
                                                }`}
                                            >
                                                {selectedService === service.id ? 'Seleccionado' : 'Seleccionar'}
                                    </button>
                                    <button
                                        onClick={() => setDetailServiceId(service.id)}
                                                className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 text-sm font-medium"
                                    >
                                                Ver servicio
                                    </button>
                                </div>

                                        {/* Selected Indicator */}
                                {selectedService === service.id && (
                                            <div className="flex items-center justify-center gap-1 mt-2 text-emerald-600 text-xs">
                                                <CheckCircle className="w-3 h-3" />
                                                <span>¡Seleccionado!</span>
                                    </div>
                                )}
                            </div>
                                </div>
                            </div>


                        </div>
                    );
                })}
            </div>

                        {/* Continue Button */}
                        <div className="bg-gradient-to-r from-gray-50 to-blue-50/30 border-t border-gray-100 p-3 md:p-6 mt-6 md:mt-8 rounded-b-2xl">
                            <div className="flex flex-col md:flex-row justify-between items-center gap-3 md:gap-0">
                                <div className="text-xs md:text-sm text-gray-600 font-medium order-2 md:order-1">
                                    Paso 3 de 3 • Selecciona un servicio
                                </div>
                            <button
                                    onClick={handleContinue}
                                    disabled={selectedService === null}
                                    className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 md:py-2.5 bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 disabled:from-gray-400 disabled:to-gray-500 text-white text-sm font-semibold rounded-xl md:rounded-lg shadow-lg hover:shadow-xl disabled:shadow-sm transition-all duration-200 disabled:cursor-not-allowed order-1 md:order-2"
                            >
                                    <span>Continuar</span>
                                    <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                        </div>
                    </div>
                </div>
            </div>

            {detailService && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 p-4 pt-20">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[85vh] overflow-hidden shadow-xl">
                        {/* Scrollable Content - No Header */}
                        <div className="overflow-y-auto max-h-[85vh]">
                            {/* Map Section - Absolute top, full width, no margins */}
                            <div className="relative h-32 bg-gradient-to-r from-gray-600 to-gray-800 overflow-hidden">
                                {/* Close Button Floating Over Map */}
                                                <button
                                    onClick={() => setDetailServiceId(null)}
                                    className="absolute top-4 right-4 z-10 text-white hover:text-gray-300 p-2 rounded-full bg-black/30 hover:bg-black/50 transition-colors"
                                                >
                                    <X className="w-5 h-5" />
                                                </button>
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
                                                fillOpacity: 0.2,
                                                strokeColor: '#FFFFFF',
                                                strokeOpacity: 0.9,
                                                strokeWeight: 3,
                                            }}
                                        />
                                    </GoogleMap>
                                ) : (
                                    <div className="h-full bg-gradient-to-br from-gray-500 to-gray-700 flex items-center justify-center">
                                        <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full border-2 border-white flex items-center justify-center">
                                            <MapPin className="w-6 h-6 text-white" />
                                        </div>
                                    </div>
                                )}
                                {/* Overlay Info */}
                                <div className="absolute bottom-2 left-2 bg-white bg-opacity-95 backdrop-blur-sm rounded px-2 py-1">
                                    <div className="flex items-center gap-1">
                                        <MapPin className="w-3 h-3 text-blue-600" />
                                        <span className="text-xs font-medium text-gray-900">{locationRange}km</span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Content with padding and top margin */}
                            <div className="px-6 pb-6 pt-6">
                            {/* Service Details - Compact */}
                            <div className="mb-6">
                                <h4 className="text-sm font-medium text-gray-600 mb-3 uppercase tracking-wide">Detalles del Servicio</h4>
                                
                                {/* Service Type and Category */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                                    <div className="bg-blue-50 rounded p-3 border border-blue-200">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Eye className="w-4 h-4 text-blue-600" />
                                            <span className="text-sm font-medium text-blue-900">Tipo de Servicio</span>
                                        </div>
                                        <p className="text-sm text-blue-700">
                                            {selectedServiceTypeId === 1 ? 'Solo revisión' : 'Revisión completa'}
                                        </p>
                                    </div>
                                    <div className="bg-green-50 rounded p-3 border border-green-200">
                                        <div className="flex items-center gap-2 mb-1">
                                            <DollarSign className="w-4 h-4 text-green-600" />
                                            <span className="text-sm font-medium text-green-900">Categoría</span>
                                        </div>
                                        <p className="text-sm text-green-700">
                                            {selectedCategory === 1 ? '🚗 Vehículos' : selectedCategory === 2 ? '🏍️ Motos' : '🏠 Inmuebles'}
                                        </p>
                                    </div>
                        </div>
                                
                                {/* Service Description */}
                                {detailService.conditions && (
                                    <div className="bg-white rounded p-4 border border-gray-200">
                                        <h5 className="font-medium text-gray-900 mb-2 text-sm">Descripción</h5>
                                        <p className="text-gray-600 text-sm leading-relaxed mb-3">
                                            {detailService.conditions}
                                        </p>
                                        
                                        {/* Images within description */}
                                        {detailService.imageUrls && detailService.imageUrls.length > 0 && (
                                            <div className="mb-3">
                                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                                    {detailService.imageUrls.map((url, index) => (
                                                        <div key={index} className="bg-white border border-gray-200 rounded overflow-hidden hover:shadow-sm transition-shadow duration-200">
                                                            <img
                                                                src={url}
                                                                alt={`Imagen ${index + 1}`}
                                                                className="w-full h-20 object-cover"
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* Service Features */}
                                        <div className="pt-2 border-t border-gray-100">
                                            <div className="flex flex-wrap gap-1">
                                                {selectedServiceTypeId === 1 ? (
                                                    <>
                                                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">Revisión presencial</span>
                                                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">Informe detallado</span>
                                                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">Verificación directa</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">Revisión completa</span>
                                                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">Análisis detallado</span>
                                                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">Informe profesional</span>
                                            </>
                                        )}
                                    </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                                                        

                            {/* Contact Information */}
                            <div className="mb-6">
                                <h4 className="text-sm font-medium text-gray-600 mb-3 uppercase tracking-wide">Información de Contacto</h4>
                                <div className="bg-gray-50 rounded p-4 border border-gray-200">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                                <div>
                                            <h5 className="text-sm font-medium text-gray-900 mb-1">Disponibilidad</h5>
                                            <div className="space-y-1 text-xs text-gray-600">
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3 text-green-500" />
                                                    <span>Respuesta en 2-4h</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3 text-blue-500" />
                                                    <span>Lun-Vie: 9:00-18:00</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <h5 className="text-sm font-medium text-gray-900 mb-1">Precio</h5>
                                            <div className="text-lg font-bold text-blue-600">
                                                {detailService.price ? `${detailService.price}€` : 'Consultar'}
                                            </div>
                                            <p className="text-xs text-gray-500">Precio base</p>
                        </div>
                                    </div>
                            </div>
                        </div>

                            {/* Reviews Section */}
                        <div className="mb-6">
                                <h4 className="text-sm font-medium text-gray-600 mb-3 uppercase tracking-wide">
                                    Reseñas
                                    {(detailService.expert?.reviews?.length || 0) > 0 && (
                                        <span className="text-xs font-normal text-gray-500 ml-1">
                                            ({detailService.expert?.reviews?.length || 0})
                                        </span>
                                    )}
                                </h4>
                            {detailService.expert?.reviews && detailService.expert.reviews.length > 0 ? (
                                <div className="space-y-3">
                                        {detailService.expert.reviews.slice(0, 2).map((review) => (
                                            <div key={review.id} className="bg-white border border-gray-200 rounded p-4">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                                                            <User className="w-4 h-4 text-blue-600" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900">Cliente verificado</p>
                                                            <div className="flex items-center gap-1">
                                                                <div className="flex scale-75">{renderStars(review.score)}</div>
                                                                <span className="text-xs font-medium text-gray-900">{review.score.toFixed(1)}</span>
                                                            </div>
                                    </div>
                                            </div>
                                                    <span className="text-xs text-gray-500">
                                                {new Date(review.createdAt).toLocaleDateString('es-ES')}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-700 leading-relaxed">{review.description}</p>
                                        </div>
                                    ))}
                                        {(detailService.expert?.reviews?.length || 0) > 3 && (
                                            <div className="text-center">
                                                <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                                                    Ver todas las reseñas ({detailService.expert?.reviews?.length || 0})
                                                </button>
                                        </div>
                                        )}
                                </div>
                            ) : (
                                    <div className="bg-gray-50 rounded-lg p-8 text-center border border-gray-200">
                                        <Star className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                        <p className="text-gray-500 font-medium">Sin reseñas aún</p>
                                        <p className="text-gray-400 text-sm mt-1">Este experto está disponible para recibir su primera valoración</p>
                                    </div>
                            )}
                        </div>

                                                                                                            {/* Action Buttons */}
                            <div className="pt-4 border-t border-gray-200">
                                <div className="flex justify-center">
                        <button
                            onClick={() => setDetailServiceId(null)}
                                        className="px-6 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm font-medium"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
                            </div>
                        </div>
            </div>
                </div>
            )}
        </div>
    );
}