import React, { useState } from 'react';
import { Plus, Search, Loader2, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
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
    deleteService?: (serviceId: number) => Promise<any>;
    isDeletingService?: boolean;
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
    deleteService,
    isDeletingService,
}: ServicesTabProps) {
    const [deletingServiceId, setDeletingServiceId] = useState<number | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
    
    if (!activeTab || activeTab !== 'services') return null;

    const handleDeleteService = async (serviceId: number) => {
        if (!deleteService) return;
        
        try {
            setDeletingServiceId(serviceId);
            await deleteService(serviceId);
            setShowDeleteConfirm(null);
            
            // Mostrar notificación de éxito
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: {
                    type: 'success',
                    message: 'Servicio eliminado correctamente'
                }
            }));
        } catch (error: any) {
            console.error('Error deleting service:', error);
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: {
                    type: 'error',
                    message: error.message || 'Error al eliminar el servicio'
                }
            }));
        } finally {
            setDeletingServiceId(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <button
                    onClick={() => setShowServiceForm(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-black hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition-colors"
                >
                    <Plus className="w-4 h-4" />
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
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {services.map((service) => (
                        <div
                            key={service.id}
                            className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden"
                        >
                            {/* Imagen del servicio */}
                            {service.imageUrls && Array.isArray(service.imageUrls) && service.imageUrls.length > 0 && (
                                <div className="relative h-40 bg-gray-100">
                                    <img
                                        src={service.imageUrls[currentImageIndex[service.id] || 0]}
                                        alt={`Service ${currentImageIndex[service.id] + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                    
                                    {/* Badge de categoría */}
                                    <div className="absolute top-3 left-3">
                                        <span className="bg-black/70 text-white px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
                                            {categories?.find(c => c.id === service.categoryId)?.name || 'Categoría'}
                                        </span>
                                    </div>
                                    
                                    {/* Controles de navegación */}
                                    {service.imageUrls.length > 1 && (
                                        <>
                                            <button
                                                className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                                                onClick={() => goToPreviousImage(service.id)}
                                                disabled={currentImageIndex[service.id] === 0}
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                            </button>
                                            <button
                                                className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                                                onClick={() => goToNextImage(service.id)}
                                                disabled={(currentImageIndex[service.id] || 0) >= service.imageUrls.length - 1}
                                            >
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </>
                                    )}
                                    
                                    {/* Indicador de múltiples imágenes */}
                                    {service.imageUrls.length > 1 && (
                                        <div className="absolute bottom-3 right-3">
                                            <span className="bg-black/70 text-white px-2 py-1 rounded-full text-xs backdrop-blur-sm">
                                                {(currentImageIndex[service.id] || 0) + 1}/{service.imageUrls.length}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                            
                            {/* Contenido de la tarjeta */}
                            <div className="p-4">
                                <div className="mb-3">
                                    <h3 className="text-base font-semibold text-gray-900 mb-1">
                                        {categories?.find(c => c.id === service.categoryId)?.name || 'Sin categoría'}
                                    </h3>
                                    <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                                        {service.conditions}
                                    </p>
                                </div>
                                
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between py-2 border-t border-gray-100">
                                        <span className="text-xs font-medium text-gray-700">Precio</span>
                                        <span className="text-lg font-bold text-green-600">
                                            {new Intl.NumberFormat('es-ES', {
                                                style: 'currency',
                                                currency: 'EUR',
                                            }).format(service.price)}
                                        </span>
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-gray-500">Duración</span>
                                        <span className="text-xs font-medium text-gray-900 bg-gray-100 px-2 py-1 rounded-full">
                                            {service.durationInHours}h
                                        </span>
                                    </div>
                                </div>
                                
                                {/* Botones de acción */}
                                <div className="mt-4 flex gap-2">
                                    <button className="flex-1 bg-black hover:bg-gray-800 text-white text-xs font-medium py-2 px-3 rounded-md transition-colors">
                                        Editar
                                    </button>
                                    <button 
                                        onClick={() => setShowDeleteConfirm(service.id)}
                                        disabled={deletingServiceId === service.id}
                                        className="bg-red-100 hover:bg-red-200 text-red-700 text-xs font-medium py-2 px-3 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {deletingServiceId === service.id ? (
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : (
                                            <Trash2 className="w-3 h-3" />
                                        )}
                                    </button>
                                </div>
                                
                                {/* Modal de confirmación de eliminación */}
                                {showDeleteConfirm === service.id && (
                                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                                        <div className="bg-white rounded-lg p-6 max-w-md mx-4">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                                ¿Eliminar servicio?
                                            </h3>
                                            <p className="text-sm text-gray-600 mb-4">
                                                Esta acción desactivará el servicio y no podrá recibir más contrataciones. ¿Estás seguro?
                                            </p>
                                            <div className="flex gap-2 justify-end">
                                                <button
                                                    onClick={() => setShowDeleteConfirm(null)}
                                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                                                >
                                                    Cancelar
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteService(service.id)}
                                                    disabled={deletingServiceId === service.id}
                                                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {deletingServiceId === service.id ? 'Eliminando...' : 'Eliminar'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}