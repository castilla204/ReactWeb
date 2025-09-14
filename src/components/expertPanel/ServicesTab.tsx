import React, { useState } from 'react';
import { Plus, Search, Loader2, ChevronLeft, ChevronRight, Trash2, Edit3 } from 'lucide-react';
import { useCategories } from '../../contexts/CategoryContext';

interface Service {
    id: number;
    categoryId: number;
    serviceTypeId: number;
    imageUrls: string[];
    conditions: string;
    price: number;
    durationInHours: number | null;
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
    onEditService?: (service: Service) => void;
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
    onEditService,
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
        <div className="p-3 sm:p-6">
            {/* Header con botón de nuevo servicio - móvil optimizado */}
            <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div>
                    <h2 className="text-base sm:text-lg font-semibold text-slate-900">Mis Servicios</h2>
                    <p className="text-xs sm:text-sm text-slate-500 hidden sm:block">Gestiona tus servicios activos</p>
                </div>
                <button
                    onClick={() => setShowServiceForm(true)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Nuevo Servicio</span>
                    <span className="sm:hidden">Nuevo</span>
                </button>
            </div>

            {isLoadingServices ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                </div>
            ) : servicesError ? (
                <div className="text-center py-12 bg-red-50 text-red-600 rounded-lg border border-red-200">
                    <p>Error al cargar servicios: {servicesError.message}</p>
                </div>
            ) : services.length === 0 ? (
                <div className="text-center py-12">
                    <Search className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600">No tienes servicios activos</p>
                    <p className="text-sm text-slate-500 mt-1">Crea tu primer servicio para empezar</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {services.map((service) => (
                        <div
                            key={service.id}
                            className="bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors overflow-hidden"
                        >
                            {/* Imagen del servicio */}
                            {service.imageUrls && Array.isArray(service.imageUrls) && service.imageUrls.length > 0 && (
                                <div className="relative h-24 sm:h-32 bg-slate-100">
                                    <img
                                        src={service.imageUrls[currentImageIndex[service.id] || 0]}
                                        alt={`Service ${currentImageIndex[service.id] + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                    
                                    {/* Badge de categoría */}
                                    <div className="absolute top-1.5 left-1.5">
                                        <span className="bg-slate-900/80 text-white px-1.5 py-0.5 rounded text-xs font-medium">
                                            {categories?.find(c => c.id === service.categoryId)?.name || 'Categoría'}
                                        </span>
                                    </div>
                                    
                                    {/* Controles de navegación */}
                                    {service.imageUrls.length > 1 && (
                                        <>
                                            <button
                                                className="absolute left-1.5 top-1/2 -translate-y-1/2 bg-slate-900/50 hover:bg-slate-900/70 text-white p-1 rounded-full transition-colors"
                                                onClick={() => goToPreviousImage(service.id)}
                                                disabled={currentImageIndex[service.id] === 0}
                                            >
                                                <ChevronLeft className="w-3 h-3" />
                                            </button>
                                            <button
                                                className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-slate-900/50 hover:bg-slate-900/70 text-white p-1 rounded-full transition-colors"
                                                onClick={() => goToNextImage(service.id)}
                                                disabled={(currentImageIndex[service.id] || 0) >= service.imageUrls.length - 1}
                                            >
                                                <ChevronRight className="w-3 h-3" />
                                            </button>
                                        </>
                                    )}
                                    
                                    {/* Indicador de múltiples imágenes */}
                                    {service.imageUrls.length > 1 && (
                                        <div className="absolute bottom-1.5 right-1.5">
                                            <span className="bg-slate-900/80 text-white px-1.5 py-0.5 rounded text-xs">
                                                {(currentImageIndex[service.id] || 0) + 1}/{service.imageUrls.length}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                            
                            {/* Contenido de la tarjeta */}
                            <div className="p-3 sm:p-4">
                                <div className="mb-2 sm:mb-3">
                                    <h3 className="text-sm font-semibold text-slate-900 mb-1">
                                        {categories?.find(c => c.id === service.categoryId)?.name || 'Sin categoría'}
                                    </h3>
                                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                                        {service.conditions}
                                    </p>
                                </div>
                                
                                <div className="flex items-center justify-between mb-2 sm:mb-3">
                                    <div>
                                        <span className="text-base sm:text-lg font-bold text-slate-900">
                                            {new Intl.NumberFormat('es-ES', {
                                                style: 'currency',
                                                currency: 'EUR',
                                            }).format(service.price)}
                                        </span>
                                        {service.durationInHours && (
                                            <span className="text-xs text-slate-500 ml-2">
                                                • {service.durationInHours}h
                                            </span>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Botones de acción */}
                                <div className="flex gap-1.5 sm:gap-2">
                                    <button 
                                        onClick={() => onEditService?.(service)}
                                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium py-1.5 sm:py-2 px-2 sm:px-3 rounded transition-colors flex items-center justify-center gap-1"
                                    >
                                        <Edit3 className="w-3 h-3" />
                                        Editar
                                    </button>
                                    <button 
                                        onClick={() => setShowDeleteConfirm(service.id)}
                                        disabled={deletingServiceId === service.id}
                                        className="bg-red-50 hover:bg-red-100 text-red-600 p-1.5 sm:p-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                                        <div className="bg-white rounded-lg p-6 max-w-md w-full">
                                            <h3 className="text-lg font-semibold text-slate-900 mb-2">
                                                ¿Eliminar servicio?
                                            </h3>
                                            <p className="text-sm text-slate-600 mb-4">
                                                Esta acción desactivará el servicio y no podrá recibir más contrataciones. ¿Estás seguro?
                                            </p>
                                            <div className="flex gap-2 justify-end">
                                                <button
                                                    onClick={() => setShowDeleteConfirm(null)}
                                                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                                                >
                                                    Cancelar
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteService(service.id)}
                                                    disabled={deletingServiceId === service.id}
                                                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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