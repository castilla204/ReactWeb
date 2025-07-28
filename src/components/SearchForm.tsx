import React, { useState } from 'react';
import { Clock, ArrowRight, Sparkles, Target, DollarSign, Zap, ArrowLeft, Crown, Search } from 'lucide-react';
import { useSearch } from '../hooks/useSearch.hooks';
import { useSubscriptionLimits } from '../hooks/useSubscriptionLimits';
import { Notification, NotificationType } from './Notification';

export interface SearchParameters {
    keywords: string;
    userSearch: string;
    category: number;
    frequency: number;
    latitude: string;
    longitude: string;
    locationRange: number;
    minPrice?: number;
    maxPrice?: number;
    serviceTypeId: number;
}

export interface SearchFormProps {
    parameters: SearchParameters;
    onComplete: () => void;
    setCurrentStep: (step: number) => void;
    setShowSubscriptions?: (show: boolean) => void;
    serviceId: number | null;
}

export default function SearchForm({
    parameters,
    onComplete,
    setCurrentStep,
    setShowSubscriptions = () => { },
    serviceId,
}: SearchFormProps) {
    const { createSearchWithHire } = useSearch();
    const { maxSearchesReached, maxSearches } = useSubscriptionLimits();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [notification, setNotification] = useState<{
        type: NotificationType;
        message: string;
        action?: () => void;
    } | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        if (maxSearchesReached) {
            setNotification({
                type: 'error',
                message: `👑 Has alcanzado el límite de ${maxSearches} búsquedas activas. ¡Mejora tu plan para crear más búsquedas!`,
                action: () => {
                    setShowSubscriptions(true);
                },
            });
            setIsSubmitting(false);
            return;
        }

        if (createSearchWithHire.isPending || isSubmitting) {
            return;
        }

        try {
            const searchData = {
                title: parameters.keywords,
                description: parameters.userSearch || 'Descripción por defecto',
                category: parameters.category || 0,
                frequency: parseInt(parameters.frequency.toString()),
                isActive: true,
                startDate: new Date().toISOString(),
            };

            const { hireUrl } = await createSearchWithHire.mutateAsync({
                searchData,
                parameters: {
                    ...parameters,
                    serviceTypeId: parameters.serviceTypeId,
                    latitude: parameters.latitude,
                    longitude: parameters.longitude,
                    locationRange: parameters.locationRange,
                },
                serviceId: serviceId || undefined,
            });

            if (hireUrl) {
                window.location.href = hireUrl;
                return;
            }

            setNotification({
                type: 'success',
                message: '✅ Búsqueda creada exitosamente',
            });
            onComplete();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error creating search';
            console.error('Error creating search:', err);

            if (errorMessage.includes("You've reached your plan's limit")) {
                setNotification({
                    type: 'error',
                    message: `👑 ${errorMessage}`,
                    action: () => {
                        setCurrentStep(0);
                        setShowSubscriptions(true);
                    },
                });
            } else {
                setNotification({
                    type: 'error',
                    message: `❌ ${errorMessage}`,
                });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBack = (e: React.MouseEvent) => {
        e.preventDefault();
        setCurrentStep(2); // Back to ServiceSelection
    };

    return (
        <div className="w-full max-w-7xl mx-auto px-0 lg:px-0 flex flex-col">
            <div className="flex items-center gap-2 mb-6">
                <button
                    onClick={handleBack}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Atrás
                </button>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden flex-1 flex flex-col">
                <div className="p-4 md:p-6 lg:p-8 border-b border-gray-100 relative overflow-hidden bg-gradient-to-br from-blue-50 to-white">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.1),transparent_50%)]" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-100">
                                <Sparkles className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                                    Configuración de Búsqueda
                                </h2>
                                <p className="text-sm text-gray-500">
                                    Revisa y confirma tu configuración de búsqueda inteligente
                                </p>
                            </div>
                        </div>
                        <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                            <div className="flex items-start gap-3">
                                <div className="mt-1">
                                    <Zap className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-900 mb-2">
                                        Análisis de IA
                                    </h3>
                                    <p className="text-sm text-gray-600 leading-relaxed break-words">
                                        {parameters.userSearch}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="bg-white rounded-lg p-4 border border-gray-200 hover:border-blue-200 transition-colors group shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <Search className="w-5 h-5 text-blue-600" />
                                <h3 className="text-sm font-medium text-gray-900">
                                    Tipo de Servicio
                                </h3>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Servicio</span>
                                    <span className="text-gray-900 font-medium">
                                        {parameters.serviceTypeId === 1 ? 'Web Search' : parameters.serviceTypeId === 2 ? 'In-Person Review' : 'Unknown'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-gray-200 hover:border-blue-200 transition-colors group shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <Target className="w-5 h-5 text-blue-600" />
                                <h3 className="text-sm font-medium text-gray-900">
                                    Configuración de Ubicación
                                </h3>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Área de Búsqueda</span>
                                    <span className="text-gray-900 font-medium">
                                        {parameters.locationRange} km de radio
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Punto Central</span>
                                    <span className="text-gray-900 font-medium">
                                        {parameters.latitude.slice(0, 6)},{' '}
                                        {parameters.longitude.slice(0, 6)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Cobertura</span>
                                    <span className="text-gray-900 font-medium">
                                        {Math.PI * Math.pow(parseInt(parameters.locationRange.toString()), 2)} km²
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-gray-200 hover:border-blue-200 transition-colors group shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <DollarSign className="w-5 h-5 text-blue-600" title="Precio" />
                                <h3 className="text-sm font-medium text-gray-900">
                                    Rango de Precio
                                </h3>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Mínimo</span>
                                    <span className="text-gray-900 font-medium">
                                        €{parameters.minPrice || '0'}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Máximo</span>
                                    <span className="text-gray-900 font-medium">
                                        {parameters.maxPrice ? `€${parameters.maxPrice}` : 'Sin límite'}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Rango de Presupuesto</span>
                                    <span className="text-gray-900 font-medium">
                                        {parameters.maxPrice
                                            ? `€${parameters.maxPrice - (parameters.minPrice || 0)}`
                                            : 'Flexible'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="col-span-1 lg:col-span-3 bg-white rounded-lg p-4 border border-gray-200 hover:border-blue-200 transition-colors group shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <Clock className="w-5 h-5 text-blue-600" />
                                <h3 className="text-sm font-medium text-gray-900">
                                    Actualizaciones Automáticas
                                </h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Frecuencia</span>
                                        <span className="text-gray-900 font-medium">
                                            Cada {parameters.frequency}h
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Actualizaciones por Día</span>
                                        <span className="text-gray-900 font-medium">
                                            {24 / parseInt(parameters.frequency.toString())}
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Estado</span>
                                        <span className="text-green-400 font-medium">Activa</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="sticky bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl p-4 border-t border-gray-100">
                        {maxSearchesReached ? (
                            <button
                                type="button"
                                onClick={() => {
                                    setCurrentStep(0);
                                    setShowSubscriptions(true);
                                }}
                                className="w-full md:w-auto md:ml-auto flex items-center justify-center gap-3 py-3 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-lg font-medium transition-all shadow-lg shadow-amber-500/20 group relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-amber-400/20 to-transparent" />
                                <Crown className="w-7 h-7 text-amber-200 group-hover:scale-110 transition-transform duration-300 drop-shadow-[0_0_12px_rgba(245,158,11,0.8)] relative z-10" />
                                <span className="text-sm">Mejorar Plan</span>
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={createSearchWithHire.isPending || isSubmitting || !serviceId}
                                className="w-full md:w-auto md:ml-auto flex items-center justify-center gap-2 py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
                            >
                                {createSearchWithHire.isPending || isSubmitting ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                        <span className="text-sm">Creando Búsqueda...</span>
                                    </div>
                                ) : (
                                    <>
                                        <span className="text-sm">Crear Búsqueda</span>
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </form>
            </div>
            {notification && (
                <Notification
                    type={notification.type}
                    message={notification.message}
                    action={notification.action}
                    onClose={() => setNotification(null)}
                />
            )}
        </div>
    );
}