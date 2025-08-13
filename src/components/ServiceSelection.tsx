import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Clock, Star, CheckCircle, ChevronLeft, ChevronRight, User, StarHalf, X } from 'lucide-react';
import { useCategories } from '../contexts/CategoryContext';
import { useServices } from '../hooks/useServices';
import { useServiceTypes } from '../hooks/useServiceTypes';

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
    const { services, isLoading, error } = useServices({
        categoryId: selectedCategory,
        serviceTypeId: selectedServiceTypeId,
        latitude,
        longitude,
        locationRange,
    });
    const [carouselIndices, setCarouselIndices] = useState<{ [key: number]: number }>({});

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

    return (
        <div className="max-w-6xl mx-auto px-6 py-8">
            <div className="flex items-center justify-between mb-8">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft className="w-6 h-6" />
                    <span className="text-lg font-medium">Atrás</span>
                </button>
                <h1 className="text-3xl font-bold text-gray-900">Servicios de {serviceTypeName}</h1>
            </div>

            {errorMessage && (
                <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-sm shadow-sm text-center">
                    <p className="text-lg">{errorMessage}</p>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map((service) => {
                    const savings = Math.floor(Math.random() * 500) + 300;
                    const currentImageIndex = carouselIndices[service.id] || 0;

                    return (
                        <div
                            key={service.id}
                            className="bg-white rounded-sm shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-all duration-300"
                        >
                            <div className="relative h-24">
                                {service.imageUrls && service.imageUrls.length > 0 ? (
                                    <div className="relative w-full h-full">
                                        <img
                                            src={service.imageUrls[currentImageIndex]}
                                            alt={`Imagen del servicio ${service.id}`}
                                            className="w-full h-full object-cover"
                                        />
                                        {service.imageUrls.length > 1 && (
                                            <>
                                                <button
                                                    onClick={() => handleCarouselChange(service.id, 'prev')}
                                                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-1 rounded-sm hover:bg-opacity-70"
                                                >
                                                    <ChevronLeft className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleCarouselChange(service.id, 'next')}
                                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-1 rounded-sm hover:bg-opacity-70"
                                                >
                                                    <ChevronRight className="w-4 h-4" />
                                                </button>
                                                <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-1">
                                                    {service.imageUrls.map((_, index) => (
                                                        <div
                                                            key={index}
                                                            className={`w-1.5 h-1.5 rounded-sm ${index === currentImageIndex ? 'bg-white' : 'bg-gray-400'}`}
                                                        />
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                        <div className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 rounded-sm text-xs font-medium">
                                            Ahorra {savings}€ de media
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-full h-24 bg-gray-100 flex items-center justify-center">
                                        <Star className="w-8 h-8 text-gray-400" />
                                    </div>
                                )}
                                <div className="absolute -bottom-8 left-4 bg-white rounded-full overflow-hidden shadow-md border-2 border-gray-200">
                                    {service.expert && service.expert.profilePictureUrl ? (
                                        <img
                                            src={service.expert.profilePictureUrl}
                                            alt={service.expert.user?.name || 'Experto'}
                                            className="w-16 h-16 object-cover"
                                            onError={(e) => {
                                                console.error(`Failed to load profile picture for service ${service.id}: ${service.expert.profilePictureUrl}`);
                                                e.currentTarget.style.display = 'none';
                                                e.currentTarget.nextElementSibling!.style.display = 'flex';
                                            }}
                                        />
                                    ) : (
                                        <div className="w-16 h-16 bg-gray-200 flex items-center justify-center">
                                            <User className="w-8 h-8 text-gray-400" />
                                        </div>
                                    )}
                                    <div className="w-16 h-16 bg-gray-200 flex items-center justify-center" style={{ display: 'none' }}>
                                        <User className="w-8 h-8 text-gray-400" />
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 pt-10">
                                <div className="mb-2">
                                    <h3 className="text-lg font-semibold text-gray-900">{service.expert?.user?.name || 'Experto desconocido'}</h3>
                                    {'averageRating' in service && (
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="flex">{renderStars(service.averageRating)}</div>
                                            {service.averageRating > 0 && (
                                                <span className="text-xs text-gray-600">{service.averageRating.toFixed(1)}</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <p className="text-gray-600 text-sm line-clamp-2 mb-2">{service.conditions || 'Sin descripción'}</p>
                                <div className="text-2xl font-bold text-gray-900 mb-2">
                                    {service.price
                                        ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(service.price)
                                        : 'Precio no disponible'}
                                    <span className="text-sm text-gray-500 ml-1">/ servicio</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                    <Clock className="w-5 h-5" />
                                    <span>{service.durationInHours}h</span>
                                </div>
                                {service.completedSearches > 0 && (
                                    <div className="text-sm text-gray-600 mb-4">
                                        <span>{service.completedSearches} servicios completados</span>
                                    </div>
                                )}
                                {service.expert?.description && (
                                    <p className="text-sm text-gray-500 line-clamp-2 mb-4">{service.expert.description}</p>
                                )}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setSelectedService(service.id)}
                                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-sm hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
                                    >
                                        Seleccionar
                                    </button>
                                    <button
                                        onClick={() => setDetailServiceId(service.id)}
                                        className="flex-1 px-4 py-2 bg-gray-100 text-gray-800 rounded-sm hover:bg-gray-200 transition-colors shadow-sm hover:shadow-md"
                                    >
                                        Más Detalles
                                    </button>
                                </div>
                                {selectedService === service.id && (
                                    <div className="flex items-center gap-2 mt-2 text-blue-600">
                                        <CheckCircle className="w-5 h-5" />
                                        <span className="text-sm font-medium">Seleccionado</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {detailService && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-sm max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto p-6 shadow-xl">
                        <div className="flex justify-between items-start mb-4 border-b border-gray-200 pb-4">
                            <h2 className="text-2xl font-bold text-gray-900">{detailService.serviceTypeName || 'Servicio'}</h2>
                            <button
                                onClick={() => setDetailServiceId(null)}
                                className="text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="relative mb-6">
                            <div className="relative h-64">
                                {detailService.imageUrls && detailService.imageUrls.length > 0 ? (
                                    <div className="relative w-full h-full">
                                        <img
                                            src={detailService.imageUrls[carouselIndices[detailService.id] || 0]}
                                            alt={`Imagen del servicio ${detailService.id}`}
                                            className="w-full h-full object-cover rounded-sm border border-gray-200"
                                        />
                                        {detailService.imageUrls.length > 1 && (
                                            <>
                                                <button
                                                    onClick={() => handleCarouselChange(detailService.id, 'prev', true)}
                                                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-gray-800 bg-opacity-60 text-white p-2 rounded-sm hover:bg-opacity-80"
                                                >
                                                    <ChevronLeft className="w-6 h-6" />
                                                </button>
                                                <button
                                                    onClick={() => handleCarouselChange(detailService.id, 'next', true)}
                                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gray-800 bg-opacity-60 text-white p-2 rounded-sm hover:bg-opacity-80"
                                                >
                                                    <ChevronRight className="w-6 h-6" />
                                                </button>
                                                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-2">
                                                    {detailService.imageUrls.map((_, index) => (
                                                        <div
                                                            key={index}
                                                            className={`w-2 h-2 rounded-sm ${index === (carouselIndices[detailService.id] || 0) ? 'bg-white' : 'bg-gray-400'}`}
                                                        />
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <div className="w-full h-64 bg-gray-100 flex items-center justify-center rounded-sm border border-gray-200">
                                        <Star className="w-12 h-12 text-gray-400" />
                                    </div>
                                )}
                                {detailService.expert && detailService.expert.profilePictureUrl && (
                                    <div className="absolute top-2 left-2">
                                        <img
                                            src={detailService.expert.profilePictureUrl}
                                            alt={detailService.expert.user?.name || 'Experto'}
                                            className="w-20 h-20 object-cover rounded-full border-2 border-white shadow-md"
                                            onError={(e) => {
                                                console.error(`Failed to load profile picture in modal for service ${detailService.id}: ${detailService.expert.profilePictureUrl}`);
                                                e.currentTarget.style.display = 'none';
                                                e.currentTarget.nextElementSibling!.style.display = 'flex';
                                            }}
                                        />
                                        <div className="w-20 h-20 bg-gray-200 flex items-center justify-center rounded-full border-2 border-white shadow-md" style={{ display: 'none' }}>
                                            <User className="w-10 h-10 text-gray-400" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                                Valoraciones
                                {'averageRating' in detailService && (
                                    <div className="flex items-center">
                                        <div className="flex">{renderStars(detailService.averageRating)}</div>
                                        {detailService.averageRating > 0 && (
                                            <span className="text-xs text-gray-600 ml-1">{detailService.averageRating.toFixed(1)}</span>
                                        )}
                                    </div>
                                )}
                            </h3>
                            {detailService.expert?.reviews && detailService.expert.reviews.length > 0 ? (
                                <div className="space-y-4">
                                    {detailService.expert.reviews.map((review) => (
                                        <div key={review.id} className="border-b border-gray-200 pb-4">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="flex">{renderStars(review.score)}</div>
                                                <span className="text-xs text-gray-600">{review.score.toFixed(1)}</span>
                                            </div>
                                            <p className="text-gray-700 text-sm leading-relaxed mb-1">{review.description}</p>
                                            <p className="text-xs text-gray-500">
                                                {new Date(review.createdAt).toLocaleDateString('es-ES')}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-sm">No hay valoraciones disponibles</p>
                            )}
                        </div>
                        <button
                            onClick={() => setDetailServiceId(null)}
                            className="w-full px-6 py-2 bg-blue-600 text-white rounded-sm hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            )}

            <div className="sticky bottom-8 flex justify-end mt-8">
                <button
                    onClick={handleContinue}
                    disabled={selectedService === null}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-sm hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Continuar
                    <ArrowRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}