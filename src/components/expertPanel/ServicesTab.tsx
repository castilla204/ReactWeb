import React from 'react';
import { Plus, Search, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCategories } from '../../contexts/CategoryContext';

interface Service {
    id: number;
    categoryId: number;
    imageUrls: string[];
    conditions: string;
    price: number;
    durationInHours: number;
}

interface ServicesTabProps {
    activeTab: 'services' | 'hires';
    services: Service[];
    isLoadingServices: boolean;
    servicesError: Error | null;
    showServiceForm: boolean;
    setShowServiceForm: (value: boolean) => void;
    currentImageIndex: { [key: number]: number };
    goToPreviousImage: (serviceId: number) => void;
    goToNextImage: (serviceId: number) => void;
    categories: { id: number; name: string }[] | undefined;
}

export function ServicesTab({
    activeTab,
    services,
    isLoadingServices,
    servicesError,
    showServiceForm,
    setShowServiceForm,
    currentImageIndex,
    goToPreviousImage,
    goToNextImage,
    categories,
}: ServicesTabProps) {
    if (!activeTab || activeTab !== 'services') return null;

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <button
                    onClick={() => setShowServiceForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Nuevo Servicio
                </button>
            </div>

            {isLoadingServices ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                </div>
            ) : servicesError ? (
                <div className="text-center py-12 bg-red-50 text-red-600 rounded border border-red-200 shadow-lg">
                    <p>Error al cargar servicios: {servicesError.message}</p>
                </div>
            ) : services.length === 0 ? (
                <div className="text-center py-12 bg-white rounded border border-gray-200 shadow-lg">
                    <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No tienes servicios activos</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {services.map((service) => (
                        <div
                            key={service.id}
                            className="bg-white border border-gray-200 shadow-md hover:shadow-lg transition-all p-2"
                        >
                            <div className="h-6 px-4 flex items-center" style={{ backgroundColor: '#4B5563', opacity: 0.7 }}>
                                <h3 className="font-medium text-white text-xs">
                                    {categories?.find(c => c.id === service.categoryId)?.name || 'Categoría'}
                                </h3>
                            </div>
                            {service.imageUrls && Array.isArray(service.imageUrls) && service.imageUrls.length > 0 && (
                                <div className="relative w-full" style={{ height: '150px' }}>
                                    <div className="w-full h-full flex items-center justify-center">
                                        <button
                                            className="absolute left-2 z-10 bg-gray-800 bg-opacity-50 text-white p-1 rounded-full hover:bg-opacity-75"
                                            onClick={() => goToPreviousImage(service.id)}
                                            disabled={currentImageIndex[service.id] === 0}
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        <img
                                            src={service.imageUrls[currentImageIndex[service.id] || 0]}
                                            alt={`Service ${currentImageIndex[service.id] + 1}`}
                                            className="w-full h-full object-cover"
                                            style={{ objectFit: 'cover' }}
                                        />
                                        <button
                                            className="absolute right-2 z-10 bg-gray-800 bg-opacity-50 text-white p-1 rounded-full hover:bg-opacity-75"
                                            onClick={() => goToNextImage(service.id)}
                                            disabled={(currentImageIndex[service.id] || 0) >= service.imageUrls.length - 1}
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                            <div className="p-2 space-y-1">
                                <h3 className="text-sm font-medium text-gray-900">
                                    {categories?.find(c => c.id === service.categoryId)?.name || 'Sin categoría'}
                                </h3>
                                <p className="text-xs text-gray-600 line-clamp-2">{service.conditions}</p>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-500">Precio</span>
                                    <span className="font-medium text-gray-900">
                                        {new Intl.NumberFormat('es-ES', {
                                            style: 'currency',
                                            currency: 'EUR',
                                        }).format(service.price)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-500">Duración</span>
                                    <span className="font-medium text-gray-900">
                                        {service.durationInHours}h
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}