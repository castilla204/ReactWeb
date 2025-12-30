import React, { useState, useEffect } from 'react';
import { ArrowLeft, Wallet, ArrowRight, Shield, Check, Lock, BadgeCheck, FileText, Image, Video, ShieldCheck, Info } from 'lucide-react';
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
import { getPriceDisplay } from '../utils/priceUtils';

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
                    {/* Layout - Service Details and Summary - Estilo moderno Compacto */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        {/* Left Column - Service Details - Moderno Compacto (7 columnas) */}
                        <div className="lg:col-span-7 space-y-5">
                            <div className="bg-white rounded-xl shadow-sm border border-[#E5E7EB] overflow-hidden">
                                {/* Header con Experto - Más compacto */}
                                <div className="p-5 border-b border-[#F3F4F6] bg-[#FAFBFC]">
                                    <div className="flex items-center gap-4">
                                        {/* Expert Photo Compacta */}
                                        {expertProfilePicture ? (
                                            <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 border-2 border-white shadow-sm ring-1 ring-gray-100">
                                                <img 
                                                    src={expertProfilePicture} 
                                                    alt={expertName || 'Experto'}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center border-2 border-white shadow-sm ring-1 ring-gray-100">
                                                <span className="text-lg font-bold text-gray-400">
                                                    {(expertName || 'E').charAt(0)}
                                                </span>
                                            </div>
                                        )}
                                        
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <h3 className="text-[16px] font-bold text-[#111827] leading-tight truncate pr-2">
                                                    {expertName || 'Servicio Profesional'}
                                                </h3>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    onClick={() => setCurrentStep(2)}
                                                    className="h-7 px-2.5 text-[#6B7280] hover:text-[#111827] hover:bg-gray-100 text-[11px] font-medium rounded-md transition-colors -mr-2"
                                                >
                                                    Cambiar
                                                </Button>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <BadgeCheck className="w-3.5 h-3.5 text-[#0066CC]" />
                                                <span className="text-[12px] text-[#4B5563] font-medium">Experto Verificado</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="p-5 space-y-5">
                                    {/* Detalles técnicos - Grid Compacto */}
                                    <div className="grid grid-cols-3 gap-2 text-[11px] text-gray-600 bg-gray-50/80 p-2.5 rounded-lg border border-gray-100">
                                        {parameters.locationName && (
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-gray-900 mb-0.5">Ubicación</span>
                                                <span className="truncate" title={parameters.locationName}>{parameters.locationName}</span>
                                            </div>
                                        )}
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-gray-900 mb-0.5">Radio</span>
                                            <span>{parameters.locationRange} km</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-gray-900 mb-0.5">Duración</span>
                                            <span>{parameters.frequency}h aprox.</span>
                                        </div>
                                    </div>

                                    {serviceDescription && (
                                        <div className="text-[13px] text-[#4B5563] leading-relaxed line-clamp-2">
                                            {serviceDescription}
                                        </div>
                                    )}

                                    <Separator className="bg-gray-100" />
                                
                                    {/* Incluye (Badges más sutiles) */}
                                    <div>
                                        <h4 className="text-[12px] font-bold text-[#374151] uppercase tracking-wide mb-3">
                                            El servicio incluye
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            <div className="inline-flex items-center gap-1.5 bg-blue-50/50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-100/50">
                                                <FileText className="w-3 h-3" />
                                                <span className="text-[11px] font-medium">Informe</span>
                                            </div>
                                            <div className="inline-flex items-center gap-1.5 bg-blue-50/50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-100/50">
                                                <Image className="w-3 h-3" />
                                                <span className="text-[11px] font-medium">Fotos HD</span>
                                            </div>
                                            <div className="inline-flex items-center gap-1.5 bg-blue-50/50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-100/50">
                                                <Video className="w-3 h-3" />
                                                <span className="text-[11px] font-medium">Video</span>
                                            </div>
                                            <div className="inline-flex items-center gap-1.5 bg-blue-50/50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-100/50">
                                                <ShieldCheck className="w-3 h-3" />
                                                <span className="text-[11px] font-medium">Garantía</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* GARANTÍA INSPECCIONO PROTECCIÓN - INTEGRADO Y COMPACTO */}
                            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                                <div className="flex items-start gap-3">
                                    <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center border border-gray-200 shadow-sm flex-shrink-0">
                                        <Shield className="w-4 h-4 text-[#0066CC]" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1 mb-0.5">
                                            <span className="text-sm font-bold text-[#0066CC] tracking-tight">inspecciono</span>
                                            <span className="text-sm font-light text-gray-900">protección</span>
                                        </div>
                                        <p className="text-[11px] text-gray-500 leading-tight max-w-sm">
                                            Pago retenido hasta finalización. Calidad 100% garantizada.
                                        </p>
                                    </div>
                                </div>
                                {/* Iconos de confianza pequeños */}
                                <div className="flex gap-3 pl-12 sm:pl-0">
                                    <div className="flex items-center gap-1.5 text-gray-400" title="Pago Seguro">
                                        <Lock className="w-3.5 h-3.5" />
                                        <span className="text-[10px] font-medium">Seguro</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-gray-400" title="Verificado">
                                        <BadgeCheck className="w-3.5 h-3.5" />
                                        <span className="text-[10px] font-medium">Verificado</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    
                        {/* Right Column - Payment Summary - Moderno */}
                        <div className="lg:col-span-5 bg-white rounded-2xl shadow-sm border border-[#DDDDDD]/50 sticky top-20 overflow-hidden">
                            <div className="px-8 pt-8 pb-6">
                                <h2 className="text-[24px] font-semibold text-[#222222] leading-tight">
                                    Resumen
                                </h2>
                            </div>
                            <div className="px-8 pb-8 space-y-6">
                                {/* Resumen del pago con desglose calculado */}
                                {(() => {
                                    if (servicePrice === undefined) {
                                        return (
                                            <div className="flex justify-center p-4">
                                                <div className="w-5 h-5 border-2 border-[#222222]/20 border-t-[#222222] rounded-full animate-spin" />
                                            </div>
                                        );
                                    }
                                    
                                    // Cálculo visual del desglose (21% IVA incluido)
                                    // Total = Base * 1.21 => Base = Total / 1.21
                                    const total = servicePrice;
                                    const base = total / 1.21;
                                    const tax = total - base;
                                    
                                    return (
                                        <div className="space-y-4">
                                            {/* Subtotal */}
                                            <div className="flex justify-between items-center">
                                                <span className="text-[15px] text-[#222222]">Subtotal</span>
                                                <span className="text-[15px] font-normal text-[#222222]">
                                                    €{total.toFixed(2)}
                                                </span>
                                            </div>
                                            
                                            {/* Total */}
                                            <div className="pt-4 border-t border-[#DDDDDD]">
                                                <div className="bg-gray-50/50 rounded-lg border border-gray-100 p-3">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[16px] font-semibold text-[#222222]">Total</span>
                                                        <div className="text-right">
                                                            <div className="flex items-center justify-end gap-1.5">
                                                                <span className="text-[20px] font-bold text-[#222222]">€{total.toFixed(2)}</span>
                                                            </div>
                                                            <p className="text-[10px] text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded-full inline-block mt-0.5">IVA incluido</p>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Desglose de impuestos (Simulado/Calculado) - Siempre visible */}
                                                    <div className="mt-3 pt-3 border-t border-gray-200/50 space-y-2">
                                                        <div className="flex justify-between text-xs">
                                                            <span className="text-gray-500">Base imponible</span>
                                                            <span className="text-gray-700 font-medium">€{base.toFixed(2)}</span>
                                                        </div>
                                                        <div className="flex justify-between text-xs">
                                                            <span className="text-gray-500">IVA (21%)</span>
                                                            <span className="text-gray-700 font-medium">€{tax.toFixed(2)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                                    
                                {/* Security Note - Moderno */}
                                    {servicePrice !== undefined && (
                                    <div className="pt-4 border-t border-[#DDDDDD]">
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
