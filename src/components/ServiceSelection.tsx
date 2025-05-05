import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Clock, Star, Search, Loader2, CheckCircle, Shield, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '../hooks/useApi';
import { useCategories } from '../contexts/CategoryContext';

interface ServiceSelectionProps {
    onBack: () => void;
    onComplete: (serviceId: number) => void;
    selectedCategory: number;
}

interface Service {
    id: number;
    categoryId: number;
    price: number;
    conditions: string;
    durationInHours: number;
    createdAt: string;
    imageUrls: string[];
}

export function ServiceSelection({ onBack, onComplete, selectedCategory }: ServiceSelectionProps) {
    const { fetchApi } = useApi();
    const { categories } = useCategories();
    const [selectedService, setSelectedService] = useState<number | null>(null);

    const servicesQuery = useQuery({
        queryKey: ['services'],
        queryFn: () => fetchApi<Service[]>('/api/SearchService'),
    });

    const filteredServices = servicesQuery.data?.filter(
        service => service.categoryId === selectedCategory
    ) || [];

    const handleContinue = () => {
        if (selectedService !== null) {
            onComplete(selectedService);
        }
    };

    if (servicesQuery.isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex items-center gap-3 text-gray-500">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Cargando servicios disponibles...</span>
                </div>
            </div>
        );
    }

    if (servicesQuery.error) {
        return (
            <div className="text-center py-12 text-red-500">
                Error al cargar los servicios
            </div>
        );
    }

    if (filteredServices.length === 0) {
        return (
            <div className="max-w-2xl mx-auto px-4">
                <div className="flex items-center gap-2 mb-8">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Atrás
                    </button>
                </div>
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200 shadow-lg">
                    <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No hay servicios disponibles para esta categoría</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="hidden md:inline">Atrás</span>
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-1">
                            Servicios de Búsqueda Disponibles
                        </h2>
                        <p className="text-sm text-gray-500">
                            Selecciona el servicio que mejor se adapte a tus necesidades
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {filteredServices.map((service) => (
                    <div
                        key={service.id}
                        onClick={() => setSelectedService(service.id)}
                        className={`group bg-white rounded-xl border transition-all cursor-pointer overflow-hidden h-40 ${selectedService === service.id
                                ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-lg'
                                : 'border-gray-200 hover:border-blue-200 shadow hover:shadow-lg'
                            }`}
                    >
                        <div className="flex h-full">
                            {/* Image Section */}
                            <div className="relative w-48 flex-shrink-0">
                                {service.imageUrls && service.imageUrls.length > 0 ? (
                                    <img
                                        src={service.imageUrls[0]}
                                        alt="Service"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                        <Search className="w-8 h-8 text-gray-400" />
                                    </div>
                                )}
                                <div className="absolute top-3 left-3">
                                    <div className="px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-gray-900 shadow-sm">
                                        {categories?.find(c => c.id === service.categoryId)?.name}
                                    </div>
                                </div>
                            </div>

                            {/* Content Section */}
                            <div className="flex-1 p-4 flex flex-col justify-between">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="flex items-center gap-1">
                                                <Star className="w-3.5 h-3.5 text-yellow-400 fill-current" />
                                                <span className="text-sm font-medium text-gray-900">4.8</span>
                                            </div>
                                            <span className="text-xs text-gray-500">(120 valoraciones)</span>
                                        </div>
                                        <div className="flex items-baseline gap-1.5">
                                            <span className="text-lg font-bold text-gray-900">
                                                {new Intl.NumberFormat('es-ES', {
                                                    style: 'currency',
                                                    currency: 'EUR'
                                                }).format(service.price)}
                                            </span>
                                            <span className="text-xs text-gray-500">por búsqueda</span>
                                        </div>
                                    </div>
                                    {selectedService === service.id && (
                                        <div className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                                            <CheckCircle className="w-3.5 h-3.5" />
                                            <span className="text-xs font-medium">Seleccionado</span>
                                        </div>
                                    )}
                                </div>

                                <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                                    {service.conditions}
                                </p>

                                <div className="flex items-center gap-4 text-sm">
                                    <div className="flex items-center gap-1.5">
                                        <Clock className="w-4 h-4 text-gray-400" />
                                        <span className="text-gray-600">{service.durationInHours}h</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Users className="w-4 h-4 text-gray-400" />
                                        <span className="text-gray-600">+500 búsquedas</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Shield className="w-4 h-4 text-gray-400" />
                                        <span className="text-gray-600">Garantía 7 días</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="sticky bottom-8 flex justify-end mt-8">
                <button
                    onClick={handleContinue}
                    disabled={selectedService === null}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/20"
                >
                    Continuar con el Servicio Seleccionado
                    <ArrowRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}