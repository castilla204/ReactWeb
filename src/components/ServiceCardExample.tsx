import React from 'react';
import { Star, MapPin, Clock, Euro } from 'lucide-react';
import { Service } from '../hooks/useServices';
import { CurrentReviewsList } from './CurrentReviewCard';

interface ServiceCardExampleProps {
    service: Service;
}

export default function ServiceCardExample({ service }: ServiceCardExampleProps) {
    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
            {/* Header del servicio */}
            <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            {service.serviceTypeName}
                        </h3>
                        <p className="text-gray-600 text-sm mb-3">
                            {service.conditions}
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center gap-1 text-2xl font-bold text-green-600">
                            <Euro className="w-5 h-5" />
                            {service.price}
                        </div>
                        {service.averageRating && (
                            <div className="flex items-center gap-1 mt-1">
                                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                <span className="text-sm font-medium">
                                    {service.averageRating.toFixed(1)}
                                </span>
                                <span className="text-xs text-gray-500">
                                    ({service.expert?.reviews?.length || 0})
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Información del servicio */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{service.categoryName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>{service.durationInHours}h</span>
                    </div>
                </div>

                {/* Información del experto */}
                {service.expert && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-4">
                        <div className="relative">
                            {service.expert.profilePictureUrl ? (
                                <img
                                    src={service.expert.profilePictureUrl}
                                    alt={service.expert.user.name}
                                    className="w-12 h-12 rounded-full object-cover border-2 border-white"
                                />
                            ) : (
                                <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center text-white font-medium">
                                    {service.expert.user.name.charAt(0)}
                                </div>
                            )}
                        </div>
                        <div className="flex-1">
                            <h4 className="font-medium text-gray-900">
                                {service.expert.user.name}
                            </h4>
                            <p className="text-sm text-gray-600">
                                {service.expert.user.email}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                {service.completedSearches} servicios completados
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Reviews del servicio */}
            {service.expert?.reviews && service.expert.reviews.length > 0 && (
                <div className="px-6 pb-6">
                    <div className="border-t border-gray-200 pt-4">
                        <CurrentReviewsList
                            reviews={service.expert.reviews}
                            showDate={true}
                            maxReviews={3}
                        />
                    </div>
                </div>
            )}

            {/* Footer con acciones */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                        ID: {service.id} • {service.isActive ? 'Activo' : 'Inactivo'}
                    </div>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                            Ver Detalles
                        </button>
                        <button className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors">
                            Contactar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Componente para mostrar múltiples servicios
interface ServiceListExampleProps {
    services: Service[];
}

export function ServiceListExample({ services }: ServiceListExampleProps) {
    if (services.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Star className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No hay servicios disponibles
                </h3>
                <p className="text-gray-500">
                    No se encontraron servicios que coincidan con tus criterios.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                    Servicios Disponibles ({services.length})
                </h2>
                <div className="text-sm text-gray-500">
                    Mostrando todos los resultados
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {services.map((service) => (
                    <ServiceCardExample
                        key={service.id}
                        service={service}
                    />
                ))}
            </div>
        </div>
    );
}
