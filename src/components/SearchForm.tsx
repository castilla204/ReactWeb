import React, { useState } from 'react';
import { ArrowRight, Sparkles, Target, DollarSign, Zap, ArrowLeft, Crown, Search, Wallet, User } from 'lucide-react';
import { useSearch } from '../hooks/useSearch.hooks';
import { useSubscriptionLimits } from '../hooks/useSubscriptionLimits';
import { useUserSettings } from '../hooks/useUserSettings';
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
    expertProfilePicture?: string;
    expertName?: string;
    servicePrice?: number;
    serviceDescription?: string;
}

export default function SearchForm({
    parameters,
    onComplete,
    setCurrentStep,
    setShowSubscriptions = () => { },
    serviceId,
    expertProfilePicture,
    expertName,
    servicePrice,
    serviceDescription,
}: SearchFormProps) {
    // Depuración: Mostrar los props recibidos
    console.log('SearchForm - Received props:', {
        serviceId,
        expertProfilePicture,
        expertName,
        servicePrice,
        serviceDescription,
        parameters,
    });

    const { createSearchWithHire } = useSearch();
    const { maxSearchesReached, maxSearches } = useSubscriptionLimits();
    const { fetchApi } = useUserSettings();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [notification, setNotification] = useState<{
        type: NotificationType;
        message: string;
        action?: () => void;
    } | null>(null);
    const { balance, isLoadingBalance, balanceError } = useUserSettings();

    // Handle balance fetch error
    if (balanceError) {
        setNotification({
            type: 'error',
            message: '❌ Error al obtener el saldo de la cuenta',
        });
    }

    // Validar datos requeridos
    const isDataComplete = serviceId !== null && expertName && servicePrice !== undefined;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        console.log('SearchForm - Submitting with:', { serviceId, servicePrice, balance });

        if (!isDataComplete) {
            setNotification({
                type: 'error',
                message: '❌ Error: Los datos del servicio están incompletos. Por favor, selecciona un servicio válido.',
            });
            setIsSubmitting(false);
            return;
        }

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

        if (createSearchWithHire.isPending || isSubmitting || isLoadingBalance || balance === null) {
            setNotification({
                type: 'error',
                message: '❌ Error: No se pudo cargar el saldo. Por favor, intenta de nuevo.',
            });
            setIsSubmitting(false);
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

            if (balance >= servicePrice!) {
                const { hireUrl } = await createSearchWithHire.mutateAsync({
                    searchData,
                    parameters: {
                        ...parameters,
                        serviceTypeId: parameters.serviceTypeId,
                        latitude: parameters.latitude,
                        longitude: parameters.longitude,
                        locationRange: parameters.locationRange,
                    },
                    serviceId: serviceId!,
                });

                if (hireUrl) {
                    console.log('SearchForm - Redirecting to hire URL:', hireUrl);
                    window.location.href = hireUrl;
                    return;
                }

                setNotification({
                    type: 'success',
                    message: `✅ Búsqueda creada exitosamente para el servicio de ${expertName}.`,
                });
                onComplete();
            } else {
                const response = await fetchApi<{ url: string }>('/api/Subscription/load-money-service', {
                    method: 'POST',
                    body: JSON.stringify({
                        serviceId,
                        amount: servicePrice,
                    }),
                });

                if (response.url) {
                    console.log('SearchForm - Redirecting to payment URL:', response.url);
                    window.location.href = response.url;
                } else {
                    throw new Error('No se recibió la URL de pago');
                }
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error al crear la búsqueda';
            console.error('SearchForm - Error creating search:', err);

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
        setCurrentStep(2);
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
                                    Confirmación de Contratación
                                </h2>
                                <p className="text-sm text-gray-500">
                                    Revisa y confirma los detalles de tu contratación
                                </p>
                            </div>
                        </div>
                        {!isDataComplete && (
                            <div className="mb-4 bg-red-50 text-red-600 p-4 rounded-lg">
                                <p className="text-sm">❌ Error: Los datos del servicio están incompletos. Por favor, vuelve a seleccionar un servicio.</p>
                            </div>
                        )}
                        <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100 mb-4">
                            <div className="flex items-start gap-3">
                                <div className="mt-1">
                                    <Zap className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-900 mb-2">
                                        Descripción de tu Búsqueda
                                    </h3>
                                    <p className="text-sm text-gray-600 leading-relaxed break-words">
                                        {parameters.userSearch || 'No se proporcionó descripción.'}
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
                                    Detalles del Servicio
                                </h3>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Servicio</span>
                                    <span className="text-gray-900 font-medium">
                                        {parameters.serviceTypeId === 1 ? 'Búsqueda Web' : parameters.serviceTypeId === 2 ? 'Búsqueda Web + Revisión' : 'Desconocido'}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Experto</span>
                                    <span className="text-gray-900 font-medium">
                                        {expertName || 'No disponible'}
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
                                        {Math.PI * Math.pow(parseInt(parameters.locationRange.toString()), 2).toFixed(2)} km²
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-gray-200 hover:border-blue-200 transition-colors group shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <User className="w-5 h-5 text-blue-600" />
                                <h3 className="text-sm font-medium text-gray-900">
                                    Detalles del Experto
                                </h3>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0">
                                    {expertProfilePicture ? (
                                        <img
                                            src={expertProfilePicture}
                                            alt={expertName || 'Experto'}
                                            className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                                            onError={(e) => {
                                                console.error(`SearchForm - Failed to load expert profile picture: ${expertProfilePicture}`);
                                                e.currentTarget.style.display = 'none';
                                                e.currentTarget.nextElementSibling!.style.display = 'flex';
                                            }}
                                        />
                                    ) : (
                                        <div className="w-12 h-12 bg-gray-200 flex items-center justify-center rounded-full">
                                            <User className="w-6 h-6 text-gray-400" />
                                        </div>
                                    )}
                                    <div className="w-12 h-12 bg-gray-200 flex items-center justify-center rounded-full" style={{ display: 'none' }}>
                                        <User className="w-6 h-6 text-gray-400" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex flex-col text-sm">
                                        <span className="text-gray-500">Nombre</span>
                                        <span className="text-gray-900 font-medium ml-2">
                                            {expertName || 'No disponible'}
                                        </span>
                                    </div>
                                    <div className="flex flex-col text-sm">
                                        <span className="text-gray-500">Condiciones del Servicio</span>
                                        <span className="text-gray-900 font-medium line-clamp-3 ml-2">
                                            {serviceDescription || 'No hay descripción disponible'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-span-1 lg:col-span-3 bg-white rounded-lg p-4 border border-gray-200 hover:border-blue-200 transition-colors group shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <DollarSign className="w-5 h-5 text-blue-600" title="Precio" />
                                <h3 className="text-sm font-medium text-gray-900">
                                    Detalles de Pago
                                </h3>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Precio del Servicio</span>
                                    <span className="text-gray-900 font-medium">
                                        €{servicePrice !== undefined ? servicePrice.toFixed(2) : 'No disponible'}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Saldo Actual</span>
                                    <span className="text-gray-900 font-medium">
                                        {isLoadingBalance ? 'Cargando...' : `€${balance?.toFixed(2) || '0.00'}`}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Saldo Restante</span>
                                    <span className="text-gray-900 font-medium">
                                        {isLoadingBalance || balance === null || servicePrice === undefined
                                            ? 'N/A'
                                            : `€${(balance - servicePrice).toFixed(2)}`}
                                    </span>
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
                                disabled={createSearchWithHire.isPending || isSubmitting || !isDataComplete || isLoadingBalance}
                                className="w-full md:w-auto md:ml-auto flex items-center justify-center gap-2 py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
                            >
                                {createSearchWithHire.isPending || isSubmitting ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                        <span className="text-sm">
                                            {balance !== null && servicePrice !== undefined && balance < servicePrice
                                                ? 'Redirigiendo a pago...'
                                                : 'Creando Búsqueda...'}
                                        </span>
                                    </div>
                                ) : (
                                    <>
                                        <Wallet className="w-5 h-5" />
                                        <span className="text-sm">
                                            {balance !== null && servicePrice !== undefined && balance < servicePrice
                                                ? 'Pagar Servicio'
                                                : 'Confirmar Contratación'}
                                        </span>
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