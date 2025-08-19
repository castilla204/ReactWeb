import React, { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, Target, DollarSign, Zap, ArrowLeft, Crown, Search, Wallet, User } from 'lucide-react';
import { useSearch } from '../hooks/useSearch.hooks';
import { useSubscriptionLimits } from '../hooks/useSubscriptionLimits';
import { useUserSettings } from '../hooks/useUserSettings';
import { Notification, NotificationType } from './Notification';
import { useQueryClient } from '@tanstack/react-query';

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
    shippingAvailable?: boolean;
    strictMatchOnly?: boolean;
    brandId?: number;
    modelId?: number;
    platformIds?: number[];
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
    const queryClient = useQueryClient();
    const { createSearchWithHire } = useSearch();
    const { maxSearchesReached, maxSearches } = useSubscriptionLimits();
    const { balance, isLoadingBalance, balanceError, refetchBalance } = useUserSettings();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [notification, setNotification] = useState<{
        type: NotificationType;
        message: string;
        action?: () => void;
    } | null>(null);

    if (balanceError) {
        setNotification({
            type: 'error',
            message: '❌ Error al obtener el saldo de la cuenta',
        });
    }

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
                action: () => setShowSubscriptions(true),
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
                frequency: parseInt(parameters.frequency.toString()),
                isActive: true,
                startDate: new Date().toISOString(),
                serviceId: serviceId!,
            };

            const parameterData = {
                keywords: parameters.keywords,
                userSearch: parameters.userSearch,
                latitude: parameters.latitude,
                longitude: parameters.longitude,
                locationRange: parameters.locationRange,
                category: parameters.category || 0,
                minPrice: parameters.minPrice || null,
                maxPrice: parameters.maxPrice || null,
                shippingAvailable: parameters.shippingAvailable || false,
                strictMatchOnly: parameters.strictMatchOnly || false,
                brandId: parameters.brandId || null,
                modelId: parameters.modelId || null,
                serviceTypeId: parameters.serviceTypeId || null,
                platformIds: parameters.platformIds || [],
            };

            const response = await createSearchWithHire.mutateAsync({
                searchData,
                parameters: parameterData,
            });

            if (response.url) {
                console.log('SearchForm - Redirecting to payment URL:', response.url);
                sessionStorage.setItem('pendingHire', JSON.stringify({
                    serviceId,
                    searchData,
                    parameters: parameterData,
                }));
                window.location.href = response.url;
                return;
            }

            setNotification({
                type: 'success',
                message: `✅ Búsqueda creada exitosamente para el servicio de ${expertName}.`,
            });
            onComplete();
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || 'Error al crear la búsqueda';
            console.error('SearchForm - Error creating search:', err);

            if (err.response?.status === 403 && errorMessage.includes("You've reached your plan's limit")) {
                setNotification({
                    type: 'error',
                    message: `👑 ${errorMessage}`,
                    action: () => {
                        setCurrentStep(0);
                        setShowSubscriptions(true);
                    },
                });
            } else if (err.response?.status === 403 && errorMessage.includes("Phone verification required")) {
                setNotification({
                    type: 'error',
                    message: '📱 Verificación de teléfono requerida para crear búsquedas.',
                    action: () => setCurrentStep(0),
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

    useEffect(() => {
        const pendingHire = sessionStorage.getItem('pendingHire');
        if (pendingHire) {
            (async () => {
                setIsSubmitting(true);
                try {
                    await refetchBalance();
                    queryClient.invalidateQueries({ queryKey: ['searches'] });
                    setNotification({
                        type: 'success',
                        message: `✅ Búsqueda y contratación creadas exitosamente para el servicio de ${expertName}.`,
                    });
                    onComplete();
                } catch (err) {
                    setNotification({
                        type: 'error',
                        message: `❌ Error al verificar el saldo: ${err instanceof Error ? err.message : 'Error desconocido'}`,
                    });
                } finally {
                    setIsSubmitting(false);
                    sessionStorage.removeItem('pendingHire');
                }
            })();
        }
    }, [expertName, onComplete, refetchBalance, queryClient]);

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
            <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden flex-1 flex flex-col">
                <div className="p-6 md:p-8 lg:p-10 border-b border-gray-100 relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-white">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.15),transparent_60%)]" />
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-100/30 to-transparent rounded-full -translate-y-32 translate-x-32" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-5 mb-8">
                            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25">
                                <Sparkles className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">
                                    Confirmación de Contratación
                                </h2>
                                <p className="text-sm md:text-base text-gray-600">
                                    Revisa y confirma los detalles de tu búsqueda personalizada
                                </p>
                            </div>
                        </div>
                        {!isDataComplete && (
                            <div className="mb-4 bg-red-50 text-red-600 p-4 rounded-lg">
                                <p className="text-sm">❌ Error: Los datos del servicio están incompletos. Por favor, vuelve a seleccionar un servicio.</p>
                            </div>
                        )}
                        <div className="p-5 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-xl border border-blue-200/50 mb-6 shadow-sm">
                            <div className="flex items-start gap-4">
                                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500 shadow-md">
                                    <Zap className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-base font-semibold text-gray-900 mb-3">
                                        Descripción de tu Búsqueda
                                    </h3>
                                    <p className="text-sm text-gray-700 leading-relaxed break-words bg-white/70 p-3 rounded-lg border border-white/50">
                                        {parameters.userSearch || 'No se proporcionó descripción específica.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <form onSubmit={handleSubmit} className="p-8 space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-5 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 group">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <Search className="w-4 h-4 text-blue-600" />
                                </div>
                                <h3 className="text-base font-semibold text-gray-900">
                                    Tipo de Servicio
                                </h3>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between text-sm bg-white/60 p-3 rounded-lg">
                                    <span className="text-gray-600 font-medium">Modalidad</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-900 font-semibold">
                                            {parameters.serviceTypeId === 1 ? 'Solo Revisión' : 
                                             parameters.serviceTypeId === 2 ? 'Búsqueda + Revisión' : 
                                             'Desconocido'}
                                        </span>
                                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                                            {parameters.serviceTypeId === 1 ? '👨‍💼' : 
                                             parameters.serviceTypeId === 2 ? '🌐' : 
                                             '❓'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex justify-between text-sm bg-white/60 p-3 rounded-lg">
                                    <span className="text-gray-600 font-medium">Experto</span>
                                    <span className="text-gray-900 font-semibold">
                                        {expertName || 'No disponible'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-5 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 group">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <Target className="w-4 h-4 text-blue-600" />
                                </div>
                                <h3 className="text-base font-semibold text-gray-900">
                                    {parameters.serviceTypeId === 2 
                                        ? 'Área de búsqueda del vehículo'
                                        : 'Configuración de Ubicación'
                                    }
                                </h3>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm bg-white/60 p-3 rounded-lg">
                                    <span className="text-gray-600 font-medium">Radio de búsqueda</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-900 font-semibold">
                                            {Math.min(parameters.locationRange, 100)} km
                                        </span>
                                        {parameters.locationRange > 100 && (
                                            <span className="text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded-full font-medium">
                                                Máx. 100km
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex justify-between text-sm bg-white/60 p-3 rounded-lg">
                                    <span className="text-gray-600 font-medium">Coordenadas</span>
                                    <span className="text-gray-900 font-semibold font-mono text-xs">
                                        {parameters.latitude.slice(0, 7)}, {parameters.longitude.slice(0, 7)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm bg-white/60 p-3 rounded-lg">
                                    <span className="text-gray-600 font-medium">Área cubierta</span>
                                    <span className="text-gray-900 font-semibold">
                                        ~{(Math.PI * Math.pow(Math.min(parseInt(parameters.locationRange.toString()), 100), 2) / 1000).toFixed(1)}k km²
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-5 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 group">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <User className="w-4 h-4 text-blue-600" />
                                </div>
                                <h3 className="text-base font-semibold text-gray-900">
                                    Experto Asignado
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
                        <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-5 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 group">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <DollarSign className="w-4 h-4 text-green-600" />
                                </div>
                                <h3 className="text-base font-semibold text-gray-900">
                                    Criterios de Precio
                                </h3>
                            </div>
                            <div className="space-y-4">
                                {parameters.minPrice || parameters.maxPrice ? (
                                    <div className="flex justify-between text-sm bg-white/60 p-3 rounded-lg">
                                        <span className="text-gray-600 font-medium">Rango de precio</span>
                                        <span className="text-gray-900 font-semibold">
                                            {parameters.minPrice ? `€${parameters.minPrice.toLocaleString()}` : '€0'} - {parameters.maxPrice ? `€${parameters.maxPrice.toLocaleString()}` : '∞'}
                                        </span>
                                    </div>
                                ) : (
                                    <div className="flex justify-between text-sm bg-white/60 p-3 rounded-lg">
                                        <span className="text-gray-600 font-medium">Rango de precio</span>
                                        <span className="text-gray-900 font-semibold text-green-600">Sin límite</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-sm bg-white/60 p-3 rounded-lg">
                                    <span className="text-gray-600 font-medium">Categoría</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-900 font-semibold">
                                            {parameters.category === 1 ? 'Vehículos' : 
                                             parameters.category === 2 ? 'Inmuebles' : 
                                             'General'}
                                        </span>
                                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                            {parameters.category === 1 ? '🚗' : 
                                             parameters.category === 2 ? '🏠' : 
                                             '📝'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-span-1 lg:col-span-2 bg-gradient-to-br from-white to-gray-50 rounded-xl p-5 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 group">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-2 bg-emerald-100 rounded-lg">
                                    <Wallet className="w-4 h-4 text-emerald-600" title="Precio" />
                                </div>
                                <h3 className="text-base font-semibold text-gray-900">
                                    Resumen de Pago
                                </h3>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between text-sm bg-white/60 p-3 rounded-lg">
                                    <span className="text-gray-600 font-medium">Precio del Servicio</span>
                                    <span className="text-gray-900 font-semibold text-lg">
                                        €{servicePrice !== undefined ? servicePrice.toFixed(2) : 'No disponible'}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm bg-white/60 p-3 rounded-lg">
                                    <span className="text-gray-600 font-medium">Saldo Actual</span>
                                    <span className="text-gray-900 font-semibold">
                                        {isLoadingBalance ? (
                                            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                                        ) : (
                                            `€${balance?.toFixed(2) || '0.00'}`
                                        )}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm bg-white/60 p-3 rounded-lg">
                                    <span className="text-gray-600 font-medium">Saldo Restante</span>
                                    <span className={`font-semibold ${
                                        isLoadingBalance || balance === null || servicePrice === undefined
                                            ? 'text-gray-500'
                                            : balance - servicePrice >= 0
                                                ? 'text-green-600'
                                                : 'text-red-600'
                                    }`}>
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