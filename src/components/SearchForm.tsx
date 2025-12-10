import React, { useState, useEffect } from 'react';
import { ArrowLeft, Wallet, ArrowRight, Shield, Check } from 'lucide-react';
import { useSearch } from '../hooks/useSearch.hooks';
import { useUserSettings } from '../hooks/useUserSettings';
import { useAuth } from '../contexts/AuthContext';
import { showToast } from '../lib/toast';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { StripeLoadingOverlay } from './StripeLoadingOverlay';

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
    locationName?: string;
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
    const { createSearchWithHire } = useSearch();
    const { } = useUserSettings();
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Scroll to top when component loads
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const isDataComplete = serviceId !== null && expertName && servicePrice !== undefined;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        // ✅ Verificar autenticación antes de contratar
        if (!isAuthenticated) {
            showToast('error', '🔒 Por favor, inicia sesión para contratar este servicio');
            // Guardar el estado actual para restaurarlo después del login
            sessionStorage.setItem('pendingServiceSelection', JSON.stringify({
                serviceId,
                parameters,
                expertName,
                servicePrice,
                expertProfilePicture,
                serviceDescription,
                serviceImageUrls,
            }));
            navigate('/login');
            return;
        }
        
        setIsSubmitting(true);

        console.log('SearchForm - Submitting with:', { serviceId, servicePrice });

        if (!isDataComplete) {
            showToast('error', 'Error: Los datos del servicio están incompletos. Por favor, selecciona un servicio válido.');
            setIsSubmitting(false);
            return;
        }

        if (createSearchWithHire.isPending || isSubmitting) {
            showToast('error', 'Error: Procesando solicitud. Por favor, espera.');
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
                locationName: parameters.locationName,
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
                // Mantener el estado de loading hasta que se abra Stripe
                // No resetear setIsSubmitting aquí - se mantendrá visible hasta la redirección
                window.location.href = response.url;
                return;
            }

            showToast('success', `✅ Búsqueda creada exitosamente para el servicio de ${expertName}.`);
            onComplete();
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || 'Error al crear la búsqueda';
            console.error('SearchForm - Error creating search:', err);

            // Detectar error de experto que intenta crear contrataciones
            if (errorMessage.includes('expertos no pueden') || 
                errorMessage.includes('experto') && errorMessage.includes('contrataciones') ||
                errorMessage.includes('Debes usar una cuenta distinta')) {
                showToast('error', 'Los expertos no pueden crear contrataciones. Debes usar una cuenta distinta (no registrada como experto) para contratar servicios.', 8000);
            } else if (err.response?.status === 403 && errorMessage.includes("You've reached your plan's limit")) {
                showToast('error', `👑 ${errorMessage}`, 6000);
                // Opcional: acción para ir a suscripciones
                setTimeout(() => {
                        setCurrentStep(0);
                        setShowSubscriptions(true);
                }, 2000);
            } else {
                showToast('error', errorMessage, 5000);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBack = (e: React.MouseEvent) => {
        e.preventDefault();
        setCurrentStep(1);
    };

    return (
        <div className="bg-background min-h-screen">
            {/* Header Section - Fixed - Estilo Airbnb */}
            <div className="fixed top-0 left-0 right-0 z-[9999] bg-white border-b border-gray-200 shadow-sm">
                <div className="h-14 px-4 flex items-center justify-between w-full">
                    {/* Botón volver */}
                    <button
                        onClick={handleBack}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-800" />
                    </button>
                    
                    {/* Steps indicator - Estilo Airbnb - Responsive */}
                    <div className="flex items-center gap-1.5 sm:gap-3 flex-1 justify-center px-2 sm:px-4">
                        {/* Paso 1: Ubicación */}
                        <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold transition-all bg-gray-900 text-white shadow-md">
                            <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold bg-white/20 text-white">1</span>
                            <span className="hidden sm:inline">Ubicación</span>
                        </div>
                        <div className="w-4 sm:w-10 h-[2px] bg-gray-900" />
                        
                        {/* Paso 2: Experto */}
                        <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold transition-all bg-gray-900 text-white shadow-md">
                            <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold bg-white/20 text-white">2</span>
                            <span className="hidden sm:inline">Experto</span>
                        </div>
                        <div className="w-4 sm:w-10 h-[2px] bg-gray-900" />
                        
                        {/* Paso 3: Pago */}
                        <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold transition-all bg-gray-900 text-white shadow-md">
                            <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold bg-white/20 text-white">3</span>
                            <span className="hidden sm:inline">Pago</span>
                        </div>
                    </div>

                    <div className="w-8" /> {/* Spacer */}
                </div>
            </div>
            
            {/* Spacer para compensar el header fijo */}
            <div className="h-14"></div>

            {/* Main Content - Estilo moderno minimalista */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                        {!isDataComplete && (
                    <div className="mb-8 p-4 rounded-xl bg-red-50 border border-red-200">
                        <p className="text-[15px] text-red-700">
                            ❌ Los datos del servicio están incompletos. Vuelve a seleccionar un servicio válido.
                        </p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-10">
                    {/* Layout - Service Details and Summary - Estilo moderno */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left Column - Service Details - Moderno */}
                        <div className="bg-white rounded-2xl shadow-sm border border-[#DDDDDD]/50 overflow-hidden">
                            <div className="px-8 pt-8 pb-6">
                                <h2 className="text-[24px] font-semibold text-[#222222] leading-tight mb-8">
                                    Servicio Contratado
                                </h2>
                            </div>
                            <div className="px-8 pb-8 space-y-8">
                                {/* Service Info - Moderno */}
                                <div className="bg-[#F7F7F7] rounded-2xl p-6 border border-[#DDDDDD]/30">
                                    <div className="flex items-start gap-4 mb-6">
                                        {/* Expert Photo */}
                                        {expertProfilePicture && (
                                            <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                                                <img 
                                                    src={expertProfilePicture} 
                                                    alt={expertName || 'Experto'}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-3 mb-2">
                                                <h3 className="text-[18px] font-semibold text-[#222222] leading-tight">
                                                    {expertName || 'Servicio Seleccionado'}
                                                </h3>
                                                {/* Botón Cambiar servicio */}
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => setCurrentStep(2)}
                                                    className="h-9 px-4 text-[#222222] hover:bg-[#F7F7F7] text-[13px] font-medium rounded-lg transition-colors border border-[#DDDDDD] flex-shrink-0"
                                                >
                                                    Cambiar
                                                </Button>
                                            </div>
                                            <div className="mb-3">
                                                <Badge variant="secondary" className="text-[13px] font-normal px-3 py-1 bg-[#F7F7F7] text-[#222222] border-[#DDDDDD]">
                                                    {parameters.serviceTypeId === 1 ? 'Solo Revisión' : 
                                                     parameters.serviceTypeId === 2 ? 'Búsqueda + Revisión' : 
                                                     'Servicio Personalizado'}
                                                </Badge>
                                            </div>
                                            {serviceDescription && (
                                                <p className="text-[15px] text-[#717171] leading-relaxed line-clamp-2">
                                                    {serviceDescription}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="pt-6 border-t border-[#DDDDDD]">
                                        <div className="flex items-baseline justify-between">
                                            <span className="text-[15px] text-[#717171]">Precio total</span>
                                            <div className="text-right">
                                                <div className="text-[22px] font-semibold text-[#222222]">
                                                    €{servicePrice !== undefined ? (servicePrice / 100).toFixed(2) : '0.00'}
                                                </div>
                                                <p className="text-[13px] text-[#717171] mt-1">
                                                    Pago único
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            
                                {/* Includes Section - Moderno */}
                                <div>
                                    <h4 className="text-[18px] font-semibold text-[#222222] mb-5 leading-tight">Incluye:</h4>
                                    <ul className="space-y-4">
                                        <li className="flex items-start gap-3">
                                            <div className="w-5 h-5 rounded-full bg-[#0066CC] flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <Check className="w-3.5 h-3.5 text-white" />
                                            </div>
                                            <span className="text-[15px] text-[#222222] leading-relaxed">Servicio profesional certificado</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <div className="w-5 h-5 rounded-full bg-[#0066CC] flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <Check className="w-3.5 h-3.5 text-white" />
                                            </div>
                                            <span className="text-[15px] text-[#222222] leading-relaxed">Garantía de satisfacción</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <div className="w-5 h-5 rounded-full bg-[#0066CC] flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <Check className="w-3.5 h-3.5 text-white" />
                                            </div>
                                            <span className="text-[15px] text-[#222222] leading-relaxed">Soporte durante todo el proceso</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <div className="w-5 h-5 rounded-full bg-[#0066CC] flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <Check className="w-3.5 h-3.5 text-white" />
                                            </div>
                                            <span className="text-[15px] text-[#222222] leading-relaxed">Informe detallado del servicio</span>
                                        </li>
                                        {parameters.serviceTypeId === 2 && (
                                            <li className="flex items-start gap-3">
                                                <div className="w-5 h-5 rounded-full bg-[#0066CC] flex items-center justify-center flex-shrink-0 mt-0.5">
                                                    <Check className="w-3.5 h-3.5 text-white" />
                                                </div>
                                                <span className="text-[15px] text-[#222222] leading-relaxed">Búsqueda activa de opciones</span>
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    
                        {/* Right Column - Payment Summary - Moderno */}
                        <div className="bg-white rounded-2xl shadow-sm border border-[#DDDDDD]/50 sticky top-20 overflow-hidden">
                            <div className="px-8 pt-8 pb-6">
                                <h2 className="text-[24px] font-semibold text-[#222222] leading-tight">
                                    Resumen
                                </h2>
                            </div>
                            <div className="px-8 pb-8 space-y-6">
                                <div className="space-y-4">
                                    {/* Subtotal */}
                                    <div className="flex justify-between items-center">
                                        <span className="text-[15px] text-[#222222]">Subtotal</span>
                                        <span className="text-[15px] font-normal text-[#222222]">
                                            €{servicePrice !== undefined ? (servicePrice / 100).toFixed(2) : '0.00'}
                                        </span>
                                    </div>
                                    
                                    {/* Total */}
                                    <div className="flex justify-between items-center pt-4 border-t border-[#DDDDDD]">
                                        <span className="text-[16px] font-semibold text-[#222222]">Total</span>
                                        <span className="text-[18px] font-semibold text-[#222222]">
                                                {servicePrice !== undefined ? (
                                                    `€${(servicePrice / 100).toFixed(2)}`
                                                ) : (
                                                <div className="w-5 h-5 border-2 border-[#222222]/20 border-t-[#222222] rounded-full animate-spin" />
                                                )}
                                            </span>
                                    </div>
                                </div>
                                    
                                {/* Security Note - Moderno */}
                                    {servicePrice !== undefined && (
                                    <div className="pt-6 border-t border-[#DDDDDD]">
                                        <div className="flex items-start gap-3">
                                            <div className="w-5 h-5 rounded-full bg-[#0066CC]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <Shield className="w-3.5 h-3.5 text-[#0066CC]" />
                                            </div>
                                            <p className="text-[13px] text-[#717171] leading-relaxed">
                                                Pago procesado mediante Stripe de forma segura. Tu información está protegida.
                                            </p>
                                        </div>
                                        </div>
                                    )}
                            </div>
                        </div>
                    </div>

                    {/* Submit Button - Moderno */}
                    <div className="flex justify-end pt-10 border-t border-[#DDDDDD]">
                        <Button
                                type="submit"
                                disabled={createSearchWithHire.isPending || isSubmitting || !isDataComplete}
                            size="lg"
                            className="w-full sm:w-auto min-w-[220px] h-14 px-10 bg-[#0066CC] hover:bg-[#0052A3] active:bg-[#004080] text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] text-[16px]"
                            >
                                {createSearchWithHire.isPending || isSubmitting ? (
                                    <>
                                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
                                    {servicePrice !== undefined ? 'Procesando...' : 'Creando...'}
                                    </>
                                ) : (
                                    <>
                                    <Wallet className="w-5 h-5 mr-2" />
                                    {servicePrice !== undefined ? 'Pagar ahora' : 'Confirmar'}
                                    <ArrowRight className="w-5 h-5 ml-2" />
                                    </>
                                )}
                        </Button>
                    </div>
                </form>
            </div>

            <StripeLoadingOverlay 
                isOpen={isSubmitting}
                message="Procesando pago con Stripe..."
            />
        </div>
    );
}
