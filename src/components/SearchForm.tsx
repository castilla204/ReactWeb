import React, { useState, useEffect } from 'react';
import { ArrowLeft, Wallet, ArrowRight, Shield, Check } from 'lucide-react';
import { useSearch } from '../hooks/useSearch.hooks';
import { useUserSettings } from '../hooks/useUserSettings';
import { showToast } from '../lib/toast';
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
    const [isSubmitting, setIsSubmitting] = useState(false);

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
            {/* Header Section - Fixed */}
            <div className="sticky top-0 z-50 bg-background border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleBack}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Volver
                            </Button>
                            <Separator orientation="vertical" className="h-6" />
                            <div>
                                <h1 className="text-lg font-semibold text-foreground mb-2">
                                    Checkout
                                </h1>
                                {/* Timeline del proceso */}
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1 text-primary">
                                        <div className="w-2 h-2 rounded-full bg-primary" />
                                        <span>Ubicación</span>
                                    </div>
                                    <ArrowRight className="w-3 h-3" />
                                    <div className="flex items-center gap-1 text-primary">
                                        <div className="w-2 h-2 rounded-full bg-primary" />
                                        <span>Experto</span>
                                    </div>
                                    <ArrowRight className="w-3 h-3" />
                                    <div className="flex items-center gap-1 text-primary">
                                        <div className="w-2 h-2 rounded-full bg-primary" />
                                        <span>Pago</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-6">
                        {!isDataComplete && (
                    <Card className="mb-6 border-destructive/50 bg-destructive/5">
                        <CardContent className="p-4">
                            <p className="text-sm text-destructive">
                                ❌ Los datos del servicio están incompletos. Vuelve a seleccionar un servicio válido.
                            </p>
                        </CardContent>
                    </Card>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Accordion con información de seguridad */}
                    <Accordion type="single" collapsible defaultValue="security" className="mb-6">
                        <AccordionItem value="security" className="border-border">
                            <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline py-3">
                                <div className="flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-primary" />
                                    <span>Seguridad y Garantías</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="text-sm text-muted-foreground leading-relaxed pt-2 pb-4">
                                <p>
                                    <span className="font-medium text-primary">inspecciono.com</span> actúa como intermediario seguro. 
                                    Tu pago está protegido y solo se libera una vez completado el servicio satisfactoriamente.
                                    Garantía de devolución completa si el servicio no cumple con lo acordado.
                                </p>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>

                    {/* Layout - Service Details and Summary */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                        {/* Left Column - Service Details (Plan Style) */}
                        <Card className="bg-white">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-xl font-bold text-foreground">
                                    Servicio Contratado
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Service Info Row - Horizontal */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-3 rounded-lg bg-muted/30 border border-border">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        {/* Expert Photo */}
                                        {expertProfilePicture && (
                                            <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border border-border">
                                                <img 
                                                    src={expertProfilePicture} 
                                                    alt={expertName || 'Experto'}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-base font-semibold text-foreground mb-0.5">
                                                {expertName || 'Servicio Seleccionado'}
                                            </h3>
                                            <div className="mb-1">
                                                <Badge variant="secondary" className="text-xs">
                                                    {parameters.serviceTypeId === 1 ? 'Solo Revisión' : 
                                                     parameters.serviceTypeId === 2 ? 'Búsqueda + Revisión' : 
                                                     'Servicio Personalizado'}
                                                </Badge>
                                            </div>
                                            {serviceDescription && (
                                                <p className="text-xs text-muted-foreground line-clamp-1">
                                                    {serviceDescription}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right sm:text-right flex-shrink-0 sm:pl-3 sm:border-l sm:border-border pt-2 sm:pt-0 border-t sm:border-t-0 border-border">
                                        <div className="text-xl font-bold text-foreground">
                                            €{servicePrice !== undefined ? servicePrice.toFixed(2) : '0.00'}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Pago único
                                        </p>
                                    </div>
                                </div>
                            
                                {/* Includes Section */}
                                <div>
                                    <h4 className="text-sm font-semibold text-foreground mb-3">Incluye:</h4>
                                    <ul className="space-y-2">
                                        <li className="flex items-start gap-2 text-sm text-muted-foreground">
                                            <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                            <span>Servicio profesional certificado</span>
                                        </li>
                                        <li className="flex items-start gap-2 text-sm text-muted-foreground">
                                            <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                            <span>Garantía de satisfacción</span>
                                        </li>
                                        <li className="flex items-start gap-2 text-sm text-muted-foreground">
                                            <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                            <span>Soporte durante todo el proceso</span>
                                        </li>
                                        <li className="flex items-start gap-2 text-sm text-muted-foreground">
                                            <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                            <span>Informe detallado del servicio</span>
                                        </li>
                                        {parameters.serviceTypeId === 2 && (
                                            <li className="flex items-start gap-2 text-sm text-muted-foreground">
                                                <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                                <span>Búsqueda activa de opciones</span>
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>
                    
                        {/* Right Column - Payment Summary Only */}
                        <Card className="bg-white">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg font-semibold text-foreground">
                                    Resumen
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-3">
                                    {/* Service Info */}
                                    <div>
                                        <p className="text-sm font-medium text-foreground">
                                            {expertName || 'Servicio'}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {parameters.serviceTypeId === 1 ? 'Solo Revisión' : 
                                             parameters.serviceTypeId === 2 ? 'Búsqueda + Revisión' : 
                                             'Servicio Personalizado'}
                                        </p>
                                    </div>

                                    <Separator />

                                    {/* Subtotal */}
                                    <div className="flex justify-between items-center pt-1">
                                        <span className="text-sm text-muted-foreground">Subtotal</span>
                                        <span className="text-sm font-medium text-foreground">
                                            €{servicePrice !== undefined ? servicePrice.toFixed(2) : '0.00'}
                                        </span>
                                    </div>
                                    
                                    {/* Total */}
                                    <div className="flex justify-between items-center pt-3 border-t border-border">
                                        <span className="text-base font-semibold text-foreground">Total</span>
                                        <span className="text-2xl font-bold text-foreground">
                                                {servicePrice !== undefined ? (
                                                    `€${servicePrice.toFixed(2)}`
                                                ) : (
                                                <div className="w-6 h-6 sm:w-5 sm:h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                    
                                {/* Security Note */}
                                    {servicePrice !== undefined && (
                                    <div className="pt-4 border-t border-border">
                                        <div className="flex items-start gap-2">
                                            <Shield className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                            <p className="text-xs text-muted-foreground">
                                                Pago procesado mediante Stripe de forma segura. Tu información está protegida.
                                            </p>
                                        </div>
                                        </div>
                                    )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end pt-4 border-t border-border">
                        <Button
                                type="submit"
                                disabled={createSearchWithHire.isPending || isSubmitting || !isDataComplete}
                            size="lg"
                            className="w-full sm:w-auto min-w-[200px]"
                            >
                                {createSearchWithHire.isPending || isSubmitting ? (
                                    <>
                                    <div className="w-5 h-5 sm:w-4 sm:h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
                                    {servicePrice !== undefined ? 'Procesando...' : 'Creando...'}
                                    </>
                                ) : (
                                    <>
                                    <Wallet className="w-4 h-4 mr-2" />
                                    {servicePrice !== undefined ? 'Pagar' : 'Confirmar'}
                                    <ArrowRight className="w-4 h-4 ml-2" />
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
