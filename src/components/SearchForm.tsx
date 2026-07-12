import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Wallet, ArrowRight, Shield, Check, Lock, BadgeCheck, FileText, Image, Video, ShieldCheck, Info } from 'lucide-react';
import { useSearch } from '../hooks/useSearch.hooks';
import { useUserSettings } from '../hooks/useUserSettings';
import { useAuth } from '../contexts/AuthContext';
import { showToast } from '../lib/toast';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { SileoButton } from './ui/sileo-button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { StripeLoadingOverlay } from './StripeLoadingOverlay';
import { getPriceDisplay, formatCurrency } from '../utils/priceUtils';
// 🛡️ Round 28 CUR-8: convertir a moneda preferida del usuario + mostrar original.
import { useCurrency } from '../contexts/CurrencyContext';

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
    /**
     * 🛡️ Round 28: divisa del servicio (ISO 4217). Si el experto está en UK/CH/SE/etc.,
     * el resumen debe mostrar £/CHF/kr en lugar de €. Default EUR para retro-compat.
     * El desglose IVA/Base se OCULTA salvo que el backend lo provea — antes se calculaba
     * `total/1.21` hardcoded asumiendo IVA español 21%, que es FALSO en FR (20%), DE (19%),
     * CH (8.1%), UK (20%), HU (27%), etc.
     */
    serviceCurrency?: string;
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
    serviceCurrency,
}: SearchFormProps) {
    const { createSearchWithHire } = useSearch();
    const { } = useUserSettings();
    // 🛡️ Round 28 CUR-8: usar formatPriceWithSource para convertir + mostrar original.
    const { formatPriceWithSource, preferredCurrency } = useCurrency();
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    // 🛡️ Guard atómico anti doble-submit (patrón T8 de CheckoutPage): el ref es SÍNCRONO, así que
    // bloquea un 2º submit ultra-rápido ANTES de que React aplique setIsSubmitting (asíncrono).
    const isSubmittingRef = useRef(false);

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
        
        // 🛡️ Guard atómico anti doble-submit: el ref bloquea el 2º handler de inmediato; el state
        // mantiene el UI (botón/overlay) deshabilitado. Sustituye al antiguo check por state, que leía
        // el valor del closure (siempre stale=false en la 1ª entrada) y no frenaba el doble click.
        if (isSubmittingRef.current || createSearchWithHire.isPending) {
            showToast('error', 'Error: Procesando solicitud. Por favor, espera.');
            return;
        }
        isSubmittingRef.current = true;
        setIsSubmitting(true);

        console.log('SearchForm - Submitting with:', { serviceId, servicePrice });

        if (!isDataComplete) {
            showToast('error', 'Error: Los datos del servicio están incompletos. Por favor, selecciona un servicio válido.');
            isSubmittingRef.current = false;
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

            showToast('success', '¡Búsqueda creada!', 6000, {
                description: `Has contactado con ${expertName}. Te avisaremos en cuanto responda.`,
                action: { label: 'Ver mis búsquedas', onClick: () => navigate('/hires') },
            });
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
            isSubmittingRef.current = false; // 🛡️ liberar el guard atómico junto al state
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
                        <p className="text-lead text-red-700">
                                ❌ Los datos del servicio están incompletos. Vuelve a seleccionar un servicio válido.
                            </p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-10">
                    {/* Layout - Service Details and Summary - Estilo moderno Compacto */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        {/* Left Column - Service Details - Moderno Compacto (7 columnas) */}
                        <div className="lg:col-span-7 space-y-5">
                            <div className="bg-white rounded-xl shadow-sm border border-line overflow-hidden">
                                {/* Header con Experto - Más compacto */}
                                <div className="p-5 border-b border-line-soft bg-surface-tinted">
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
                                                <h3 className="text-subtitle font-bold text-ink-strong leading-tight truncate pr-2">
                                                    {expertName || 'Servicio Profesional'}
                                            </h3>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    onClick={() => setCurrentStep(2)}
                                                    className="h-7 px-2.5 text-ink-muted hover:text-ink-strong hover:bg-surface-tinted text-kicker font-medium rounded-md transition-colors -mr-2"
                                                >
                                                    Cambiar
                                                </Button>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <BadgeCheck className="w-3.5 h-3.5 text-brand" />
                                                <span className="text-caption text-ink-muted font-medium">Experto Verificado</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="p-5 space-y-5">
                                    {/* Detalles técnicos - Grid Compacto */}
                                    <div className="grid grid-cols-3 gap-2 text-kicker text-gray-600 bg-gray-50/80 p-2.5 rounded-lg border border-gray-100">
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
                                        <div className="text-meta text-ink-muted leading-relaxed line-clamp-2">
                                                    {serviceDescription}
                                        </div>
                                    )}

                                    <Separator className="bg-gray-100" />
                                
                                    {/* Incluye (Badges más sutiles) */}
                                    <div>
                                        <h4 className="text-caption font-bold text-ink uppercase tracking-wide mb-3">
                                            El servicio incluye
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            <div className="inline-flex items-center gap-1.5 bg-brand/[0.08] text-brand px-2.5 py-1 rounded-full border border-brand/15">
                                                <FileText className="w-3 h-3" />
                                                <span className="text-kicker font-medium">Informe</span>
                                            </div>
                                            <div className="inline-flex items-center gap-1.5 bg-brand/[0.08] text-brand px-2.5 py-1 rounded-full border border-brand/15">
                                                <Image className="w-3 h-3" />
                                                <span className="text-kicker font-medium">Fotos HD</span>
                                            </div>
                                            <div className="inline-flex items-center gap-1.5 bg-brand/[0.08] text-brand px-2.5 py-1 rounded-full border border-brand/15">
                                                <Video className="w-3 h-3" />
                                                <span className="text-kicker font-medium">Video</span>
                                            </div>
                                            <div className="inline-flex items-center gap-1.5 bg-brand/[0.08] text-brand px-2.5 py-1 rounded-full border border-brand/15">
                                                <ShieldCheck className="w-3 h-3" />
                                                <span className="text-kicker font-medium">Garantía</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* GARANTÍA INSPECCIONO PROTECCIÓN - INTEGRADO Y COMPACTO */}
                            <div className="bg-surface-tinted border border-line rounded-xl p-4 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                                <div className="flex items-start gap-3">
                                    <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center border border-gray-200 shadow-sm flex-shrink-0">
                                        <Shield className="w-4 h-4 text-brand" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1 mb-0.5">
                                            <span className="text-sm font-bold text-brand tracking-tight">inspecciono</span>
                                            <span className="text-sm font-light text-gray-900">protección</span>
                                        </div>
                                        <p className="text-kicker text-gray-500 leading-tight max-w-sm">
                                            Pago retenido hasta finalización. Calidad 100% garantizada.
                                        </p>
                                    </div>
                                </div>
                                {/* Iconos de confianza pequeños */}
                                <div className="flex gap-3 pl-12 sm:pl-0">
                                    <div className="flex items-center gap-1.5 text-gray-400" title="Pago Seguro">
                                        <Lock className="w-3.5 h-3.5" />
                                        <span className="text-badge font-medium">Seguro</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-gray-400" title="Verificado">
                                        <BadgeCheck className="w-3.5 h-3.5" />
                                        <span className="text-badge font-medium">Verificado</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    
                        {/* Right Column - Payment Summary - Moderno */}
                        <div className="lg:col-span-5 bg-white rounded-2xl shadow-sm border border-line/50 sticky top-20 overflow-hidden">
                            <div className="px-8 pt-8 pb-6">
                                <h2 className="text-[24px] font-semibold text-ink leading-tight">
                                    Resumen
                                </h2>
                            </div>
                            <div className="px-8 pb-8 space-y-6">
                                {/* Resumen del pago con desglose calculado */}
                                {(() => {
                                    if (servicePrice === undefined) {
                                        return (
                                            <div className="flex justify-center p-4">
                                                <SileoLoader size="sm" color="current" />
                                    </div>
                                        );
                                    }
                                    
                                    // 🛡️ Round 28: el desglose Base/IVA antes se CALCULABA en cliente como
                                    // `total / 1.21` asumiendo IVA español 21%. INCORRECTO para FR (20%),
                                    // DE (19%), CH (8.1%), UK (20%), HU (27%), etc. Ahora mostramos solo el
                                    // total con la divisa real del servicio; el desglose REAL lo calcula
                                    // Stripe Tax en checkout según país del comprador (regla OSS UE).
                                    // 🛡️ Round 28 CUR-8: además convertimos a moneda preferida del usuario
                                    // y mostramos el original al lado — para que el paso 3 no diverja del
                                    // paso 2 (ServiceReviewPage que sí muestra "≈ €23 ($25 USD)").
                                    const total = servicePrice;
                                    const currencyCode = (serviceCurrency ?? 'EUR').toUpperCase();
                                    const priceInfo = formatPriceWithSource(total, currencyCode, preferredCurrency);

                                    return (
                                        <div className="space-y-4">
                                            {/* Subtotal */}
                                            <div className="flex justify-between items-center">
                                                <span className="text-lead text-ink">Subtotal</span>
                                                <span className="text-lead font-normal text-ink">
                                                    {priceInfo.wasConverted ? `≈ ${priceInfo.converted}` : priceInfo.display}
                                                </span>
                                            </div>

                                            {/* Total */}
                                            <div className="pt-4 border-t border-line">
                                                <div className="bg-gray-50/50 rounded-lg border border-gray-100 p-3">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-subtitle font-semibold text-ink">Total</span>
                                                        <div className="text-right">
                                                            <div className="flex items-center justify-end gap-1.5">
                                                                <span className="text-xl font-bold text-ink">
                                                                    {priceInfo.wasConverted ? `≈ ${priceInfo.converted}` : priceInfo.display}
                                                                </span>
                                                            </div>
                                                            {priceInfo.wasConverted && (
                                                                <p className="text-kicker text-gray-500 mt-0.5">
                                                                    ({priceInfo.sourceFormatted} — cargo en {currencyCode})
                                                                </p>
                                                            )}
                                                            <p className="text-badge text-gray-500 font-medium mt-1 inline-flex items-center gap-1"><span aria-hidden className="inline-block w-1 h-1 rounded-full bg-gray-400" />Impuestos incluidos</p>
                                                        </div>
                                                    </div>

                                                    {/* 🛡️ Round 28: desglose Base/IVA suprimido — lo calcula Stripe Tax en checkout */}
                                                    <p className="mt-3 text-kicker text-gray-500 leading-relaxed">
                                                        El desglose de impuestos definitivo se calculará en el checkout según tu país.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                                    
                                {/* Security Note - Moderno */}
                                    {servicePrice !== undefined && (
                                    <div className="pt-4 border-t border-line">
                                        <div className="flex items-start gap-3">
                                            <div className="w-5 h-5 rounded-full bg-brand/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <Shield className="w-3.5 h-3.5 text-brand" />
                                            </div>
                                            <p className="text-meta text-ink-muted leading-relaxed">
                                                Pago procesado mediante Stripe de forma segura. Tu información está protegida.
                                            </p>
                                        </div>
                                        </div>
                                    )}
                            </div>
                        </div>
                    </div>

                    {/* Submit Button - Moderno */}
                    <div className="flex justify-end pt-10 border-t border-line">
                        <SileoButton
                                type="submit"
                                loading={createSearchWithHire.isPending || isSubmitting}
                                loadingText={servicePrice !== undefined ? 'Procesando…' : 'Creando…'}
                                disabled={!isDataComplete}
                            size="lg"
                            icon={<><Wallet className="w-5 h-5 mr-2" />{servicePrice !== undefined ? 'Pagar ahora' : 'Confirmar'}<ArrowRight className="w-5 h-5 ml-2" /></>}
                            className="w-full sm:w-auto min-w-[220px] h-12 px-8 bg-brand hover:bg-brand-hover active:bg-brand-deep text-white font-semibold rounded-full transition-colors duration-200 text-lead shadow-[0_2px_8px_hsl(var(--brand)/0.18)] focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2"
                            >
                                {servicePrice !== undefined ? 'Pagar ahora' : 'Confirmar'}
                        </SileoButton>
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
