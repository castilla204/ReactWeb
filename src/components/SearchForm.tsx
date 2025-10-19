import React, { useState, useEffect } from 'react';
import { Sparkles, Target, Zap, ArrowLeft, Crown, Search, Wallet, User, MapPin } from 'lucide-react';
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
    locationName?: string; // ✅ NUEVO: Nombre de la ubicación
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
    const { } = useUserSettings();
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

    const getZoomLevel = () => {
        // Fixed zoom level to show 100km circle properly (much more zoomed out)
        return 5; // Zoom level 5 shows approximately 600-800km area to see 100km circle completely
    };

    // Scroll to top when component loads
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);


    const isDataComplete = serviceId !== null && expertName && servicePrice !== undefined;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        console.log('SearchForm - Submitting with:', { serviceId, servicePrice });

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

        if (createSearchWithHire.isPending || isSubmitting) {
            setNotification({
                type: 'error',
                message: '❌ Error: Procesando solicitud. Por favor, espera.',
            });
            setIsSubmitting(false);
            return;
        }

        try {
            // Truncate text to prevent metadata size issues (Stripe has 500 char limit)
            const truncateForMetadata = (text: string, maxLength: number = 200) => {
                if (text.length <= maxLength) return text;
                return text.substring(0, maxLength - 3) + '...';
            };

            const searchData = {
                title: truncateForMetadata(parameters.keywords, 100),
                description: truncateForMetadata(parameters.userSearch || 'Descripción por defecto'),
                frequency: parseInt(parameters.frequency.toString()),
                isActive: true,
                startDate: new Date().toISOString(),
                serviceId: serviceId!,
            };

            const parameterData = {
                keywords: truncateForMetadata(parameters.keywords, 100),
                userSearch: truncateForMetadata(parameters.userSearch),
                latitude: parameters.latitude,
                longitude: parameters.longitude,
                locationRange: parameters.locationRange,
                frequency: parameters.frequency,
                category: parameters.category || 0,
                minPrice: parameters.minPrice || null,
                maxPrice: parameters.maxPrice || null,
                shippingAvailable: parameters.shippingAvailable || false,
                strictMatchOnly: parameters.strictMatchOnly || false,
                brandId: parameters.brandId || null,
                modelId: parameters.modelId || null,
                serviceTypeId: parameters.serviceTypeId || null,
                platformIds: parameters.platformIds || [],
                locationName: parameters.locationName, // ✅ NUEVO: Incluir nombre de ubicación
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


    const handleBack = (e: React.MouseEvent) => {
        e.preventDefault();
        setCurrentStep(2);
    };

    return (
        <div className="w-full max-w-6xl mx-auto px-4 flex flex-col">
            <div className="bg-white rounded-xl border border-gray-100 shadow-xl overflow-hidden flex-1 flex flex-col">
                <div className="p-4 md:p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg flex-shrink-0">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h2 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">
                                    Confirmación de Contratación
                                </h2>
                                <p className="text-sm text-gray-600 mt-1">
                                    Revisa los detalles antes de confirmar
                                </p>
                            </div>
                        </div>
                        <div className="text-left sm:text-right flex-shrink-0">
                            <div className="text-xs text-gray-500 mb-1">Proceso seguro</div>
                            <div className="flex items-center gap-1 text-xs text-blue-600 font-medium">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="whitespace-nowrap">Protegido por atrapo.io</span>
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
                <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4 md:space-y-6">
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

                    {/* Company Supervision & Money-Back Guarantee */}
                    <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-100 flex-shrink-0 mt-0.5">
                                <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-semibold text-gray-900 mb-2">💯 Garantía Total de Satisfacción</h4>
                                <div className="space-y-2">
                                    <div className="flex items-start gap-2">
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full flex-shrink-0 mt-2"></div>
                                        <p className="text-sm text-gray-700 leading-relaxed">
                                            <span className="font-medium text-emerald-700">Proceso supervisado:</span> Todo el servicio está monitoreado por nuestro equipo para garantizar la calidad y cumplimiento.
                                        </p>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full flex-shrink-0 mt-2"></div>
                                        <p className="text-sm text-gray-700 leading-relaxed">
                                            <span className="font-medium text-emerald-700">Garantía de devolución:</span> Si el servicio no cumple con lo acordado, se efectuará la devolución completa del dinero.
                                        </p>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full flex-shrink-0 mt-2"></div>
                                        <p className="text-sm text-gray-700 leading-relaxed">
                                            <span className="font-medium text-emerald-700">Soporte 24/7:</span> Nuestro equipo de atención al cliente está disponible para resolver cualquier incidencia.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                                        {/* Simple chips for category and service type */}
                    <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 md:mb-6">
                        <div className="bg-blue-100 text-blue-800 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2">
                            <Search className="w-3 h-3 flex-shrink-0" />
                            <span className="whitespace-nowrap">
                                {parameters.serviceTypeId === 1 ? 'Solo Revisión' : 
                                 parameters.serviceTypeId === 2 ? 'Búsqueda + Revisión' : 
                                 'Servicio Personalizado'}
                            </span>
                        </div>
                        <div className="bg-emerald-100 text-emerald-800 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2">
                            <span className="whitespace-nowrap">
                                {parameters.category === 1 ? '🚗 Vehículos' : 
                                 parameters.category === 2 ? '🏍️ Motos' : 
                                 parameters.category === 3 ? '🏠 Inmuebles' : 
                                 '📝 General'}
                            </span>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <div className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-100">
                                <Target className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                <h3 className="text-xs font-medium text-gray-600 uppercase tracking-wide">Área</h3>
                            </div>
                            <div className="h-40 relative">
                                    {isLoaded ? (
                                        <GoogleMap
                                            mapContainerStyle={{ width: '100%', height: '100%' }}
                                            zoom={getZoomLevel()}
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
                                                new google.maps.Circle({
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
                        <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200">
                            <div className="flex items-center gap-2 mb-3">
                                <User className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                <h3 className="text-xs font-medium text-gray-600 uppercase tracking-wide">Profesional y Servicio</h3>
                            </div>
                            
                            {/* Expert Info */}
                            <div className="flex items-start gap-2 sm:gap-3 mb-3">
                                <div className="flex-shrink-0">
                                    {expertProfilePicture ? (
                                        <img
                                            src={expertProfilePicture}
                                            alt={expertName || 'Experto'}
                                            className="w-8 h-8 rounded-full object-cover border border-gray-200"
                                            onError={(e) => {
                                                console.error(`SearchForm - Failed to load expert profile picture: ${expertProfilePicture}`);
                                                const currentTarget = e.currentTarget as HTMLImageElement;
                                                const nextElement = currentTarget.nextElementSibling as HTMLElement;
                                                currentTarget.style.display = 'none';
                                                if (nextElement) nextElement.style.display = 'flex';
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
                                    <div className="text-sm font-medium text-gray-900 mb-1 leading-tight">
                                        {expertName || 'No disponible'}
                                    </div>
                                    <div className="text-xs text-gray-500 mb-1">
                                        Servicio: {parameters.serviceTypeId === 1 ? 'Solo Revisión' : 
                                                 parameters.serviceTypeId === 2 ? 'Búsqueda + Revisión' : 
                                                 'Servicio Personalizado'}
                                    </div>
                                    <div className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                                        {serviceDescription ? serviceDescription.substring(0, 60) + (serviceDescription.length > 60 ? '...' : '') : 'Servicio profesional personalizado'}
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

                        <div className="col-span-1 lg:col-span-2 bg-white border border-gray-200">
                            {/* Professional Payment Summary */}
                            <div className="bg-white p-4 sm:p-6">
                                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                                    <div className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center flex-shrink-0">
                                        <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                                    </div>
                                    <h3 className="text-sm sm:text-base font-medium text-gray-800 uppercase tracking-wide">Resumen de Facturación</h3>
                                </div>
                                
                                <div className="space-y-3 sm:space-y-4">
                                    {/* Service Price */}
                                    <div className="flex justify-between items-center py-1">
                                        <span className="text-gray-600 text-xs sm:text-sm">Precio del servicio</span>
                                        <span className="font-mono text-gray-900 font-medium text-sm sm:text-base">
                                            €{servicePrice !== undefined ? servicePrice.toFixed(2) : 'N/A'}
                                        </span>
                                    </div>
                                    
                                    
                                    {/* Divider */}
                                    <div className="border-t border-gray-300 pt-3 sm:pt-4 mt-3 sm:mt-4">
                                        {/* Total to Pay */}
                                        <div className="flex justify-between items-center py-1">
                                            <span className="text-gray-900 font-medium text-sm sm:text-base">Total</span>
                                            <span className="text-lg sm:text-xl font-mono font-semibold text-gray-900">
                                                {servicePrice !== undefined ? (
                                                    `€${servicePrice.toFixed(2)}`
                                                ) : (
                                                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-gray-400 border-t-gray-800 rounded-full animate-spin" />
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {/* Payment Status Message */}
                                    {servicePrice !== undefined && (
                                        <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-gray-50 border-l-4 border-gray-400 text-xs sm:text-sm text-gray-700">
                                            Pago procesado mediante Stripe
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white border-t border-gray-100 p-4 sm:p-6 mt-4 md:mt-6">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
                        {maxSearchesReached ? (
                            <button
                                type="button"
                                onClick={() => {
                                    setCurrentStep(0);
                                    setShowSubscriptions(true);
                                }}
                                className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors"
                            >
                                <Crown className="w-4 h-4 flex-shrink-0" />
                                <span>Mejorar Plan</span>
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={createSearchWithHire.isPending || isSubmitting || !isDataComplete}
                                className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-2.5 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
                            >
                                {createSearchWithHire.isPending || isSubmitting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin flex-shrink-0" />
                                        <span>
                                            {servicePrice !== undefined
                                                ? 'Procesando...'
                                                : 'Creando...'}
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <Wallet className="w-4 h-4 flex-shrink-0" />
                                        <span>
                                            {servicePrice !== undefined
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
