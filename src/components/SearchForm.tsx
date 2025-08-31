import React, { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, Target, DollarSign, Zap, ArrowLeft, Crown, Search, Wallet, User, MapPin } from 'lucide-react';
import { GoogleMap, useLoadScript } from '@react-google-maps/api';
import { useSearch } from '../hooks/useSearch.hooks';
import { useSubscriptionLimits } from '../hooks/useSubscriptionLimits';
import { useUserSettings } from '../hooks/useUserSettings';
import { Notification, NotificationType } from './Notification';
import { useQueryClient } from '@tanstack/react-query';

const libraries: ("geometry" | "places" | "drawing")[] = ['geometry', 'places', 'drawing'];

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
    serviceImageUrls?: string[];
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
    serviceImageUrls,
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

    // Google Maps configuration
    const { isLoaded } = useLoadScript({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "__REDACTED_GOOGLE_API_KEY__",
        libraries
    });

    const mapCenter = {
        lat: parseFloat(parameters.latitude?.toString() || '40.4168') || 40.4168,
        lng: parseFloat(parameters.longitude?.toString() || '-3.7038') || -3.7038
    };

    const getZoomLevel = (range: number) => {
        // Fixed zoom level to show 100km circle properly (much more zoomed out)
        return 5; // Zoom level 5 shows approximately 600-800km area to see 100km circle completely
    };

    // Scroll to top when component loads
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

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
        <div className="w-full max-w-6xl mx-auto px-4 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
                <button
                    onClick={handleBack}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors text-sm"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Atrás
                </button>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-xl overflow-hidden flex-1 flex flex-col">
                <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    Confirmación de Contratación
                                </h2>
                                <p className="text-sm text-gray-600">
                                    Revisa los detalles antes de confirmar
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-gray-500 mb-1">Proceso seguro</div>
                            <div className="flex items-center gap-1 text-xs text-blue-600 font-medium">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                Protegido por atrapo.io
                            </div>
                            </div>
                        </div>
                        {!isDataComplete && (
                        <div className="mt-3 bg-red-50 text-red-600 p-3 rounded text-sm">
                            ❌ Los datos del servicio están incompletos. Vuelve a seleccionar un servicio.
                            </div>
                        )}
                    {parameters.userSearch && (
                        <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-100">
                            <div className="flex items-start gap-2">
                                <Zap className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <h4 className="text-sm font-medium text-gray-900 mb-1">Descripción</h4>
                                    <p className="text-sm text-gray-700 leading-relaxed">
                                        {parameters.userSearch}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Trust Message */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 flex-shrink-0 mt-0.5">
                                <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-semibold text-gray-900 mb-1">Transacción Segura</h4>
                                <p className="text-sm text-gray-700 leading-relaxed">
                                    <span className="font-medium text-blue-700">atrapo.io</span> actúa como intermediario seguro entre el revisor y el cliente. 
                                    Tu pago está protegido y solo se libera una vez completado el servicio satisfactoriamente.
                                </p>
                            </div>
                        </div>
                    </div>
                    
                                        {/* Simple chips for category and service type */}
                    <div className="flex flex-wrap gap-3 mb-6">
                        <div className="bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2">
                            <Search className="w-3 h-3" />
                                            {parameters.serviceTypeId === 1 ? 'Solo Revisión' : 
                                             parameters.serviceTypeId === 2 ? 'Búsqueda + Revisión' : 
                             'Servicio Personalizado'}
                                    </div>
                        <div className="bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2">
                            <span>
                                {parameters.category === 1 ? '🚗 Vehículos' : 
                                 parameters.category === 2 ? '🏍️ Motos' : 
                                 parameters.category === 3 ? '🏠 Inmuebles' : 
                                 '📝 General'}
                                    </span>
                                </div>
                            </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
                                <Target className="w-3 h-3 text-gray-400" />
                                <h3 className="text-xs font-medium text-gray-600 uppercase tracking-wide">Área</h3>
                            </div>
                            <div className="h-40 relative">
                                    {isLoaded ? (
                                        <GoogleMap
                                            mapContainerStyle={{ width: '100%', height: '100%' }}
                                            zoom={getZoomLevel(parameters.locationRange)}
                                            center={mapCenter}
                                            options={{
                                                disableDefaultUI: true,
                                                gestureHandling: 'none',
                                                zoomControl: false,
                                                scrollwheel: false,
                                                disableDoubleClickZoom: true,
                                                draggable: false,
                                                mapTypeControl: false,
                                                streetViewControl: false,
                                                fullscreenControl: false,
                                                styles: [
                                                    {
                                                        featureType: 'poi',
                                                        elementType: 'labels',
                                                        stylers: [{ visibility: 'off' }]
                                                    },
                                                    {
                                                        featureType: 'transit',
                                                        elementType: 'labels',
                                                        stylers: [{ visibility: 'off' }]
                                                    }
                                                ]
                                            }}
                                            onLoad={(map) => {
                                                // Create circle using native Google Maps API like in SearchParameterForm
                                                const circle = new google.maps.Circle({
                                                    map,
                                                    center: mapCenter,
                                                    radius: 100 * 1000,
                                                    fillColor: '#3b82f6',
                                                    fillOpacity: 0.15,
                                                    strokeColor: '#3b82f6',
                                                    strokeOpacity: 0.5,
                                                    strokeWeight: 2,
                                                    zIndex: 1,
                                                    clickable: false,
                                                    editable: false,
                                                    draggable: false
                                                });
                                            }}
                                        />
                                    ) : (
                                        <div className="h-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                                            <MapPin className="w-4 h-4 text-blue-500" />
                                        </div>
                                    )}
                            </div>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <div className="flex items-center gap-2 mb-3">
                                <User className="w-3 h-3 text-gray-400" />
                                <h3 className="text-xs font-medium text-gray-600 uppercase tracking-wide">Profesional y Servicio</h3>
                            </div>
                            
                            {/* Expert Info */}
                            <div className="flex items-start gap-3 mb-3">
                                <div className="flex-shrink-0">
                                    {expertProfilePicture ? (
                                        <img
                                            src={expertProfilePicture}
                                            alt={expertName || 'Experto'}
                                            className="w-8 h-8 rounded-full object-cover border border-gray-200"
                                            onError={(e) => {
                                                console.error(`SearchForm - Failed to load expert profile picture: ${expertProfilePicture}`);
                                                e.currentTarget.style.display = 'none';
                                                e.currentTarget.nextElementSibling!.style.display = 'flex';
                                            }}
                                        />
                                    ) : (
                                        <div className="w-8 h-8 bg-gray-200 flex items-center justify-center rounded-full">
                                            <User className="w-4 h-4 text-gray-400" />
                                        </div>
                                    )}
                                    <div className="w-8 h-8 bg-gray-200 flex items-center justify-center rounded-full" style={{ display: 'none' }}>
                                        <User className="w-4 h-4 text-gray-400" />
                                    </div>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="text-sm font-medium text-gray-900 mb-1">
                                            {expertName || 'No disponible'}
                                    </div>
                                    <div className="text-xs text-gray-500 mb-1">
                                        Servicio: {parameters.serviceTypeId === 1 ? 'Solo Revisión' : 
                                                 parameters.serviceTypeId === 2 ? 'Búsqueda + Revisión' : 
                                                 'Servicio Personalizado'}
                                    </div>
                                    <div className="text-xs text-gray-600 line-clamp-2">
                                        {serviceDescription ? serviceDescription.substring(0, 80) + (serviceDescription.length > 80 ? '...' : '') : 'Servicio profesional personalizado'}
                                    </div>
                                </div>
                            </div>
                            
                                                                                    {/* Service Images - Real images from service */}
                            {serviceImageUrls && serviceImageUrls.length > 0 && (
                                <div className="border-t border-gray-100 pt-3">
                                    <div className="text-xs text-gray-500 mb-2">Portfolio del servicio</div>
                                    <div className="grid grid-cols-3 gap-2">
                                        {serviceImageUrls.slice(0, 3).map((imageUrl, index) => (
                                            <div key={index} className="h-12 rounded border border-gray-200 relative overflow-hidden">
                                                <img
                                                    src={imageUrl}
                                                    alt={`Portfolio ${index + 1}`}
                                                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                                                    onError={(e) => {
                                                        console.error(`Failed to load service image: ${imageUrl}`);
                                                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                                                        (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                                                    }}
                                                />
                                                {/* Fallback when image fails to load */}
                                                <div className="absolute inset-0 bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white text-xs font-medium" style={{ display: 'none' }}>
                                                    Imagen {index + 1}
                        </div>
                                                {/* Show +X indicator on last image if there are more */}
                                                {serviceImageUrls.length > 3 && index === 2 && (
                                                    <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                                                        <span className="text-white font-semibold text-xs">+{serviceImageUrls.length - 3}</span>
                                </div>
                                                )}
                            </div>
                                        ))}
                                        {/* Empty placeholders for missing images */}
                                        {Array.from({ length: 3 - serviceImageUrls.length }).map((_, index) => (
                                            <div key={`empty-${index}`} className="h-12 rounded border border-gray-200 bg-gray-50"></div>
                                        ))}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-2">
                                        Precio del servicio: <span className="font-medium text-gray-900">
                                            €{servicePrice !== undefined ? servicePrice.toFixed(2) : 'Consultar'}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="col-span-1 md:col-span-2 bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                                    <Wallet className="w-4 h-4 text-blue-600" />
                                </div>
                                <h3 className="font-semibold text-gray-900">
                                    Resumen de Pago
                                </h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                                    <div className="text-xs text-blue-600 font-medium mb-1">Precio del Servicio</div>
                                    <div className="text-lg font-bold text-blue-900">
                                        €{servicePrice !== undefined ? servicePrice.toFixed(2) : 'No disponible'}
                                    </div>
                                </div>
                                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg">
                                    <div className="text-xs text-gray-600 font-medium mb-1">Saldo Actual</div>
                                    <div className="text-lg font-bold text-gray-900">
                                        {isLoadingBalance ? (
                                            <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                                        ) : (
                                            `€${(balance ?? 0).toFixed(2)}`
                                        )}
                                    </div>
                                </div>
                                <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-4 rounded-lg">
                                    <div className="text-xs text-emerald-600 font-medium mb-1">Saldo Restante</div>
                                    <div className={`text-lg font-bold ${
                                        isLoadingBalance || balance === null || servicePrice === undefined
                                            ? 'text-gray-500'
                                            : (balance ?? 0) - servicePrice >= 0
                                                ? 'text-emerald-700'
                                                : 'text-red-600'
                                    }`}>
                                        {isLoadingBalance || balance === null || servicePrice === undefined
                                            ? 'N/A'
                                            : `€${((balance ?? 0) - servicePrice).toFixed(2)}`}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white border-t border-gray-100 p-6 mt-6">
                        <div className="flex justify-between items-center">
                            <div className="text-sm text-gray-600">
                                Paso 3 de 3 • Listo para confirmar
                            </div>
                            {maxSearchesReached ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setCurrentStep(0);
                                        setShowSubscriptions(true);
                                    }}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded transition-colors"
                                >
                                    <Crown className="w-4 h-4" />
                                    <span>Mejorar Plan</span>
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={createSearchWithHire.isPending || isSubmitting || !isDataComplete || isLoadingBalance}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white text-sm font-medium rounded transition-colors disabled:cursor-not-allowed"
                                >
                                    {createSearchWithHire.isPending || isSubmitting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                            <span>
                                                {balance !== null && servicePrice !== undefined && (balance ?? 0) < servicePrice
                                                    ? 'Procesando...'
                                                    : 'Creando...'}
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <Wallet className="w-4 h-4" />
                                            <span>
                                                {balance !== null && servicePrice !== undefined && (balance ?? 0) < servicePrice
                                                    ? 'Pagar'
                                                    : 'Confirmar'}
                                            </span>
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
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
