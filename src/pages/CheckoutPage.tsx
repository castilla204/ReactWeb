import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Star, Shield, Check, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useApi } from '../hooks/useApi';
import { API_CONFIG } from '../config/api';
import { showToast } from '../lib/toast';
import { StripeLoadingOverlay } from '../components/StripeLoadingOverlay';
import { Service } from '../hooks/useServices';
import { useSearch } from '../hooks/useSearch.hooks';

interface CheckoutPageProps {}

export function CheckoutPage({}: CheckoutPageProps) {
    const { serviceId } = useParams<{ serviceId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated } = useAuth();
    const { fetchApi } = useApi();
    const { createSearchWithHire } = useSearch();
    
    const [service, setService] = useState<Service | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedPaymentPlan, setSelectedPaymentPlan] = useState<'full' | 'split'>('full');
    
    // Datos de la reserva (pueden venir de location.state o ser hardcodeados para demo)
    const [checkInDate, setCheckInDate] = useState<string>('17 abr 2026');
    const [checkOutDate, setCheckOutDate] = useState<string>('19 abr 2026');
    const [guests, setGuests] = useState<number>(1);

    useEffect(() => {
        if (!isAuthenticated) {
            showToast('error', 'Por favor, inicia sesión para continuar');
            navigate('/login');
            return;
        }

        if (!serviceId) {
            showToast('error', 'ID de servicio no válido');
            navigate(-1);
            return;
        }

        const loadService = async () => {
            try {
                setLoading(true);
                const id = parseInt(serviceId, 10);
                if (isNaN(id)) {
                    showToast('error', 'ID de servicio no válido');
                    navigate(-1);
                    return;
                }

                const url = API_CONFIG.endpoints.expert.services.get(id);
                const rawService = await fetchApi<any>(url);
                
                console.log('🔵 CheckoutPage - Servicio obtenido (raw):', rawService);
                
                if (rawService) {
                    // Transformar PascalCase a camelCase (igual que en ServiceDetailPage.tsx)
                    const transformService = (service: any): Service => {
                        try {
                            const expert = service.Expert || service.expert;
                            const expertUser = expert?.User || expert?.user;
                            
                            console.log('🔵 CheckoutPage - Expert raw:', expert);
                            console.log('🔵 CheckoutPage - ExpertUser raw:', expertUser);
                            
                            return {
                                id: service.Id || service.id,
                                expertProfileId: service.ExpertProfileId || service.expertProfileId,
                                categoryId: service.CategoryId || service.categoryId,
                                serviceTypeId: service.ServiceTypeId || service.serviceTypeId,
                                serviceTypeName: service.ServiceTypeName || service.serviceTypeName,
                                serviceTypeDescription: service.ServiceTypeDescription || service.serviceTypeDescription,
                                serviceTypeCategoryId: service.ServiceTypeCategoryId || service.serviceTypeCategoryId,
                                serviceTypeCategoryName: service.ServiceTypeCategoryName || service.serviceTypeCategoryName,
                                requiresAppointment: service.RequiresAppointment ?? service.requiresAppointment,
                                price: service.Price ?? service.price ?? 0,
                                conditions: service.Conditions || service.conditions || '',
                                durationInHours: service.DurationInHours ?? service.durationInHours,
                                createdAt: service.CreatedAt || service.createdAt,
                                imageUrls: service.ImageUrls || service.imageUrls || [],
                                categoryName: service.CategoryName || service.categoryName,
                                completedSearches: service.CompletedSearches ?? service.completedSearches,
                                averageRating: service.AverageRating ?? service.averageRating ?? 0,
                                reviewsCount: service.ReviewsCount ?? service.reviewsCount ?? 0,
                                expert: expert && (expert.Id || expert.id) ? {
                                    id: expert.Id || expert.id,
                                    profilePictureUrl: expert.ProfilePictureUrl || expert.profilePictureUrl || expertUser?.ProfilePictureUrl || expertUser?.profilePictureUrl,
                                    description: expert.Description || expert.description || expert.Bio || expert.bio || '',
                                    stripeAccountId: expert.StripeAccountId || expert.stripeAccountId,
                                    createdAt: expert.CreatedAt || expert.createdAt,
                                    user: expertUser ? {
                                        name: expertUser.Name || expertUser.name || '',
                                        email: expertUser.Email || expertUser.email || '',
                                        profilePictureUrl: expertUser.ProfilePictureUrl || expertUser.profilePictureUrl,
                                    } : {
                                        name: '',
                                        email: '',
                                    },
                                    currentAvailability: expert.CurrentAvailability || expert.currentAvailability,
                                    reviews: expert.Reviews || expert.reviews || [],
                                    timezone: expert.Timezone || expert.timezone,
                                    country: expert.Country || expert.country,
                                    latitude: expert.Latitude || expert.latitude,
                                    longitude: expert.Longitude || expert.longitude,
                                    locationRange: expert.LocationRange || expert.locationRange,
                                } : null,
                                selectedDeliverableTypes: service.SelectedDeliverableTypes || service.selectedDeliverableTypes || [],
                            };
                        } catch (error) {
                            console.error('❌ Error en transformService:', error);
                            throw error;
                        }
                    };
                    const transformedService = transformService(rawService);
                    console.log('✅ CheckoutPage - Servicio transformado:', transformedService);
                    setService(transformedService);
                } else {
                    showToast('error', 'Servicio no encontrado');
                    navigate(-1);
                }
            } catch (err) {
                console.error('Error al cargar el servicio:', err);
                showToast('error', 'Error al cargar el servicio');
                navigate(-1);
            } finally {
                setLoading(false);
            }
        };

        loadService();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [serviceId, isAuthenticated]);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('es-ES', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(price);
    };

    const handlePayment = async () => {
        if (!service) {
            showToast('error', 'Error: Servicio no disponible');
            return;
        }

        if (createSearchWithHire.isPending || isSubmitting) {
            showToast('error', 'Error: Procesando solicitud. Por favor, espera.');
            return;
        }

        setIsSubmitting(true);

        try {
            console.log('🔵 Creando búsqueda con contratación para servicio:', service.id);
            
            // Truncate text to prevent metadata size issues (Stripe has 500 char limit)
            const truncateForMetadata = (text: string, maxLength: number = 200) => {
                if (text.length <= maxLength) return text;
                return text.substring(0, maxLength - 3) + '...';
            };

            // Crear datos de búsqueda (similar a SearchForm.tsx)
            const searchData = {
                title: truncateForMetadata(service.serviceTypeName || 'Servicio', 100),
                description: truncateForMetadata(service.conditions || service.serviceTypeDescription || 'Descripción por defecto'),
                frequency: 24, // Frecuencia por defecto
                isActive: true,
                startDate: new Date().toISOString(),
                serviceId: service.id,
            };

            // Crear parámetros de búsqueda (valores por defecto basados en el servicio)
            const parameterData = {
                keywords: truncateForMetadata(service.serviceTypeName || 'Servicio', 100),
                userSearch: truncateForMetadata(service.conditions || service.serviceTypeDescription || ''),
                latitude: service.expert?.latitude?.toString() || null,
                longitude: service.expert?.longitude?.toString() || null,
                locationRange: service.expert?.locationRange || 25,
                frequency: 24,
                category: service.categoryId || 0,
                minPrice: null,
                maxPrice: null,
                shippingAvailable: false,
                strictMatchOnly: false,
                brandId: null,
                modelId: null,
                serviceTypeId: service.serviceTypeId || null,
                platformIds: [1, 2],
                locationName: service.expert?.country || 'España',
            };

            // Usar createSearchWithHire (igual que en SearchForm.tsx)
            const response = await createSearchWithHire.mutateAsync({
                searchData,
                parameters: parameterData,
            });

            console.log('🔵 Respuesta del createSearchWithHire:', response);

            if (response?.url) {
                console.log('🔵 Redirigiendo a Stripe:', response.url);
                // Guardar estado pendiente (igual que en SearchForm.tsx)
                sessionStorage.setItem('pendingHire', JSON.stringify({
                    serviceId: service.id,
                    searchData,
                    parameters: parameterData,
                }));
                // Redirigir a Stripe Checkout
                window.location.href = response.url;
            } else {
                console.error('❌ No se recibió URL en la respuesta:', response);
                showToast('error', 'Error al crear la sesión de pago. Por favor, intenta de nuevo.');
                setIsSubmitting(false);
            }
        } catch (error: any) {
            console.error('❌ Error al procesar el pago:', error);
            const errorMessage = error?.response?.data?.message || error?.message || 'Error al procesar el pago. Por favor, intenta de nuevo.';
            
            // Detectar error de experto que intenta crear contrataciones (igual que en SearchForm.tsx)
            if (errorMessage.includes('expertos no pueden') || 
                errorMessage.includes('experto') && errorMessage.includes('contrataciones') ||
                errorMessage.includes('Debes usar una cuenta distinta')) {
                showToast('error', 'Los expertos no pueden crear contrataciones. Debes usar una cuenta distinta (no registrada como experto) para contratar servicios.', 8000);
            } else {
            showToast('error', errorMessage);
            }
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <div className="w-10 h-10 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500 text-sm">Cargando...</p>
                </div>
            </div>
        );
    }

    if (!service) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 mb-4">Servicio no encontrado</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                    >
                        Volver
                    </button>
                </div>
            </div>
        );
    }

    const finalPrice = service.price || 0;
    const finalRating = service.averageRating || 0;
    const finalReviews = service.reviewsCount || 0;
    const finalImages = service.imageUrls || [];
    const finalExpertName = service.expert?.user?.name || 'Experto';
    const finalServiceTypeName = service.serviceTypeName || 'Servicio';

    return (
        <>
            {/* Versión Desktop */}
            <div className="hidden lg:block min-h-screen bg-gray-50">
                <div className="max-w-6xl mx-auto px-6 py-8">
                    <div className="grid grid-cols-[1fr_420px] gap-12 items-start">
                        {/* Columna izquierda - Contenido principal */}
                        <div className="space-y-8">
                            {/* Header */}
                            <div className="flex items-center mb-8">
                    <button 
                        onClick={() => navigate(-1)}
                                    className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
                                    aria-label="Atrás"
                    >
                                    <ArrowLeft className="w-4 h-4 text-gray-700" />
                    </button>
                                <h1 className="text-2xl font-semibold text-gray-900">Confirmar y pagar</h1>
                </div>

                {/* Contenido principal */}
                            <div className="space-y-8">
                        {/* Detalles de la reserva */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                            <div className="space-y-0">
                                <div className="flex items-center justify-between py-4">
                                    <div>
                                        <div className="text-sm font-semibold text-gray-900 mb-1" style={{ fontSize: '14px', lineHeight: '18px' }}>Fechas</div>
                                        <div className="text-base text-gray-700" style={{ fontSize: '16px', lineHeight: '20px' }}>{checkInDate} – {checkOutDate}</div>
                                    </div>
                                    <button 
                                        type="button"
                                        className="text-sm font-semibold text-gray-900 bg-gray-100 border border-gray-200 rounded-lg px-3 py-1 hover:bg-gray-200 hover:border-gray-300 transition-all"
                                        style={{
                                            height: '28px',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <span>Cambiar</span>
                                    </button>
                                </div>

                                <div className="h-px bg-gray-200"></div>

                                <div className="flex items-center justify-between py-4">
                                    <div>
                                        <div className="text-sm font-semibold text-gray-900 mb-1" style={{ fontSize: '14px', lineHeight: '18px' }}>Viajeros</div>
                                        <div className="text-base text-gray-700" style={{ fontSize: '16px', lineHeight: '20px' }}>{guests} {guests === 1 ? 'adulto' : 'adultos'}</div>
                                    </div>
                                    <button 
                                        type="button"
                                        className="text-sm font-semibold text-gray-900 bg-gray-100 border border-gray-200 rounded-lg px-3 py-1 hover:bg-gray-200 hover:border-gray-300 transition-all"
                                        style={{
                                            height: '28px',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <span>Cambiar</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Opciones de pago */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Elige cuándo quieres pagar</h2>
                            
                            <div className="space-y-0">
                                {/* Opción 1: Pago completo */}
                                <label className="block">
                                    <div className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:border-gray-900 transition-colors cursor-pointer">
                                        <div className="flex-1 min-w-0">
                                            <div className="text-base font-semibold text-gray-900 mb-1">
                                                Paga {formatPrice(finalPrice)} € ahora
                                            </div>
                                        </div>
                                        <input
                                            type="radio"
                                            name="payment-plan"
                                            value="full"
                                            checked={selectedPaymentPlan === 'full'}
                                            onChange={(e) => setSelectedPaymentPlan(e.target.value as 'full' | 'split')}
                                            className="w-5 h-5 text-gray-900 border-gray-300 focus:ring-gray-900 mt-0.5"
                                        />
                                    </div>
                                </label>

                                <div className="h-px bg-gray-200 my-2"></div>

                                {/* Opción 2: Pago dividido */}
                                <label className="block">
                                    <div className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:border-gray-900 transition-colors cursor-pointer">
                                        <div className="flex-1 min-w-0">
                                            <div className="text-base font-semibold text-gray-900 mb-1">
                                                Paga 0 € ahora
                                            </div>
                                            <div className="text-sm text-gray-700">
                                                Cantidad cobrada el {checkInDate}: {formatPrice(finalPrice)} €. Sin costes adicionales.{' '}
                                                <button 
                                                    type="button"
                                                    className="text-sm font-semibold text-gray-900 underline decoration-gray-300 underline-offset-2 hover:no-underline transition-all"
                                                >
                                                    Más información
                                                </button>
                                            </div>
                                        </div>
                                        <input
                                            type="radio"
                                            name="payment-plan"
                                            value="split"
                                            checked={selectedPaymentPlan === 'split'}
                                            onChange={(e) => setSelectedPaymentPlan(e.target.value as 'full' | 'split')}
                                            className="w-5 h-5 text-gray-900 border-gray-300 focus:ring-gray-900 mt-0.5"
                                        />
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Política de cancelación */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Política de cancelación</h2>
                            <div className="text-sm font-semibold text-gray-900 mb-2">Cancelación gratuita</div>
                            <div className="text-sm text-gray-700">
                                Si cancelas antes del {checkInDate}, recibirás un reembolso completo.{' '}
                                <button 
                                    type="button"
                                    className="text-sm font-semibold text-gray-900 underline decoration-gray-300 underline-offset-2 hover:no-underline transition-all"
                                >
                                    Política entera
                                </button>
                            </div>
                        </div>
                            </div>
                        </div>

                        {/* Sidebar derecho fijo */}
                        <div className="sticky top-8 h-fit" style={{ marginTop: '72px' }}>
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                        {/* Información del servicio en sidebar */}
                        <div className="flex items-start gap-4 mb-6">
                            {finalImages[0] && (
                                <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                                    <img 
                                        src={finalImages[0]} 
                                        alt={finalServiceTypeName}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <h3 className="text-base font-semibold text-gray-900 mb-1" style={{
                                    fontSize: '18px',
                                    lineHeight: '24px',
                                    fontWeight: 600,
                                    letterSpacing: '-0.01em',
                                }}>
                                    {finalServiceTypeName} por {finalExpertName}
                                </h3>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style={{ display: 'block', height: '12px', width: '12px', fill: 'currentcolor', flexShrink: 0 }}>
                                            <path fillRule="evenodd" d="m15.1 1.58-4.13 8.88-9.86 1.27a1 1 0 0 0-.54 1.74l7.3 6.57-1.97 9.85a1 1 0 0 0 1.48 1.06l8.62-5 8.63 5a1 1 0 0 0 1.48-1.06l-1.97-9.85 7.3-6.57a1 1 0 0 0-.55-1.73l-9.86-1.28-4.12-8.88a1 1 0 0 0-1.82 0z"></path>
                                        </svg>
                                        <span className="text-sm text-gray-600 font-bold">
                                            {finalRating.toFixed(2).replace('.', ',')} ({finalReviews})
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1 min-w-0 overflow-hidden">
                                        <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="presentation" focusable="false" style={{ display: 'block', height: '12px', width: '12px', fill: 'currentcolor', flexShrink: 0 }}>
                                            <path d="m3.21684098 6.36820948c.69286.63327.95745 1.53818.79375 2.71472-1.28708.14974-2.27704-.09198-2.96991-.72524-.692873-.63329-.95745494-1.53818-.793752-2.71471 1.287062-.14979 2.277042.09195 2.969912.72523zm.01823-5.61820948c1.0236.743338 1.54043 1.567488 1.55049 2.472468.01006.90497-.48856 1.71941-1.49585 2.44334-1.02358-.74338-1.54042-1.56751-1.55048-2.47247-.01006-.90499.48856-1.71942 1.49584-2.443338zm-2.524114 9.883578c1.034374-.7302 2.021244-.98278 2.960614-.75762.63073992.1511584 1.15987526.4985198 1.58740902 1.0419992l-.07821789-.02145c1.39197832.3681397 2.20787023 1.0733199 2.19755429 2.1491723-.00983089 1.0237908-.74501936 1.7707365-2.02138366 2.256627l-.53366353-1.401857c.7621544-.2901395 1.05238772-.5850143 1.05511624-.8691626.00211728-.220812-.24880712-.4483858-.96854292-.6537179-.71044194.3168616-1.39543503.3952123-2.05688155.236709-.93937-.2252-1.65337-.8854-2.142004-1.9807zm15.10285402-4.99059852c.1637 1.17653-.1009 2.08142-.7937 2.71471-.6929.63326-1.6829.87498-2.9699.72524-.1637-1.17654.1009-2.08145.7937-2.71472.6929-.63328 1.6829-.87502 2.9699-.72523zm-2.9881-4.89297948c1.0073.723918 1.5059 1.538348 1.4958 2.443338-.01.90496-.5269 1.72909-1.5505 2.47247-1.0072-.72393-1.5059-1.53837-1.4958-2.44334.0101-.90498.5269-1.72913 1.5505-2.472468zm2.5239 9.883578c-.4887 1.0953-1.2027 1.7555-2.1421 1.9807-.6614043.1585033-1.3464097.0801526-2.0549813-.2350171l.1110343-.0326099c-.8063957.2132596-1.0834017.4526742-1.0811775.684637.0027242.284151.2929566.579019 1.0551448.8691571l-.5336407 1.4018658c-1.27641442-.4858858-2.01161974-1.2328341-2.02143515-2.2566418-.01011718-1.0551234.77444821-1.7537176 2.11778055-2.1275085.4288532-.5436828.9579753-.8910442 1.588675-1.0422026.9394-.22516 1.9263.02742 2.9607.75762z"></path>
                                        </svg>
                                        <span className="text-sm text-gray-600 font-bold truncate">Recomendación del viajero</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-gray-200 my-6"></div>

                        {/* Detalles del precio */}
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Detalles del precio</h2>
                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between text-base text-gray-700">
                                <span>{formatPrice(finalPrice)} € x 2 noches</span>
                                <span>{formatPrice(finalPrice * 2)} €</span>
                            </div>
                            <div className="flex justify-between text-base text-gray-700">
                                <span className="underline decoration-gray-300 underline-offset-2">Limpieza</span>
                                <span>0 €</span>
                            </div>
                            <div className="flex justify-between text-base text-gray-700">
                                <span className="underline decoration-gray-300 underline-offset-2">Descuento semanal</span>
                                <span>-0 €</span>
                            </div>
                            <div className="flex justify-between text-base text-gray-700">
                                <span>IVA (21%)</span>
                                <span>{formatPrice((finalPrice * 2) * 0.21)} €</span>
                            </div>
                        </div>

                        <div className="h-px bg-gray-200 my-6"></div>

                        {/* Total */}
                        <div className="flex justify-between items-center text-lg font-semibold text-gray-900 mb-6">
                            <span>Total (EUR)</span>
                            <span>{formatPrice((finalPrice * 2) * 1.21)} €</span>
                        </div>

                        {/* Botón de reserva */}
                        <button
                            onClick={handlePayment}
                            disabled={isSubmitting || createSearchWithHire.isPending}
                            type="button"
                            className="relative w-full h-12 px-6 bg-gray-900 hover:bg-gray-800 text-white text-[16px] font-semibold transition-all duration-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span className="relative z-10" data-button-content="true">
                                {isSubmitting || createSearchWithHire.isPending ? 'Procesando...' : 'Reservar'}
                            </span>
                        </button>
                        <p className="mt-3 text-center text-sm text-gray-500 font-normal">
                            No se te cobrará nada todavía
                        </p>
                    </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Versión Móvil */}
            <div className="min-h-screen bg-white lg:hidden">
                {/* Header móvil - Solo botón de cerrar */}
                <div className="sticky top-0 z-50 bg-white">
                    <nav className="flex justify-end px-6 py-2" role="navigation">
                        <button 
                            onClick={() => navigate(-1)}
                            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                            aria-label="Salir"
                            type="button"
                            style={{
                                width: '32px',
                                height: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <X className="w-4 h-4 text-gray-900" strokeWidth={3} />
                        </button>
                    </nav>
                </div>

                {/* Título fuera del header */}
                <div className="pt-6 pb-4">
                    <h1 
                        className="text-gray-900 px-6" 
                        tabIndex={-1} 
                        aria-label="Confirmar y pagar"
                        style={{
                            fontSize: '26px',
                            lineHeight: '32px',
                            fontWeight: 600,
                            letterSpacing: '-0.01em',
                            fontFamily: 'inherit',
                        }}
                    >
                        Confirmar y pagar
                    </h1>
                </div>

                {/* Contenido principal */}
                <div className="pb-32">
                    {/* Contenedor principal con borde */}
                    <div className="mx-6 mb-6 bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                        {/* Información del servicio */}
                        <div className="mb-6">
                            <div className="flex items-start gap-4">
                                {finalImages[0] && (
                                    <div 
                                        className="rounded-lg overflow-hidden flex-shrink-0"
                                        style={{
                                            width: '96px',
                                            height: '96px',
                                            aspectRatio: '1',
                                        }}
                                    >
                                        <img 
                                            src={finalImages[0]} 
                                            alt={finalServiceTypeName}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}
                                <div 
                                    className="flex-1 min-w-0 flex flex-col justify-start"
                                >
                                    <h2 
                                        className="text-gray-900 mb-1" 
                                        tabIndex={-1}
                                        style={{
                                            fontSize: '18px',
                                            lineHeight: '24px',
                                            fontWeight: 600,
                                            letterSpacing: '-0.01em',
                                        }}
                                    >
                                    {finalServiceTypeName} por {finalExpertName}
                                </h2>
                                    <div className="flex flex-col md:flex-row md:items-center gap-2 min-w-0">
                                        <div className="flex items-center gap-1.5 min-w-0 flex-shrink-0">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style={{ display: 'block', height: '12px', width: '12px', fill: 'currentcolor', flexShrink: 0 }}>
                                                <path fillRule="evenodd" d="m15.1 1.58-4.13 8.88-9.86 1.27a1 1 0 0 0-.54 1.74l7.3 6.57-1.97 9.85a1 1 0 0 0 1.48 1.06l8.62-5 8.63 5a1 1 0 0 0 1.48-1.06l-1.97-9.85 7.3-6.57a1 1 0 0 0-.55-1.73l-9.86-1.28-4.12-8.88a1 1 0 0 0-1.82 0z"></path>
                                            </svg>
                                            <span className="text-sm text-gray-600 font-bold">
                                                {finalRating.toFixed(2).replace('.', ',')} ({finalReviews})
                                    </span>
                                </div>
                                        <div className="flex items-center gap-1 min-w-0 overflow-hidden">
                                            <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="presentation" focusable="false" style={{ display: 'block', height: '12px', width: '12px', fill: 'currentcolor', flexShrink: 0 }}>
                                        <path d="m3.21684098 6.36820948c.69286.63327.95745 1.53818.79375 2.71472-1.28708.14974-2.27704-.09198-2.96991-.72524-.692873-.63329-.95745494-1.53818-.793752-2.71471 1.287062-.14979 2.277042.09195 2.969912.72523zm.01823-5.61820948c1.0236.743338 1.54043 1.567488 1.55049 2.472468.01006.90497-.48856 1.71941-1.49585 2.44334-1.02358-.74338-1.54042-1.56751-1.55048-2.47247-.01006-.90499.48856-1.71942 1.49584-2.443338zm-2.524114 9.883578c1.034374-.7302 2.021244-.98278 2.960614-.75762.63073992.1511584 1.15987526.4985198 1.58740902 1.0419992l-.07821789-.02145c1.39197832.3681397 2.20787023 1.0733199 2.19755429 2.1491723-.00983089 1.0237908-.74501936 1.7707365-2.02138366 2.256627l-.53366353-1.401857c.7621544-.2901395 1.05238772-.5850143 1.05511624-.8691626.00211728-.220812-.24880712-.4483858-.96854292-.6537179-.71044194.3168616-1.39543503.3952123-2.05688155.236709-.93937-.2252-1.65337-.8854-2.142004-1.9807zm15.10285402-4.99059852c.1637 1.17653-.1009 2.08142-.7937 2.71471-.6929.63326-1.6829.87498-2.9699.72524-.1637-1.17654.1009-2.08145.7937-2.71472.6929-.63328 1.6829-.87502 2.9699-.72523zm-2.9881-4.89297948c1.0073.723918 1.5059 1.538348 1.4958 2.443338-.01.90496-.5269 1.72909-1.5505 2.47247-1.0072-.72393-1.5059-1.53837-1.4958-2.44334.0101-.90498.5269-1.72913 1.5505-2.472468zm2.5239 9.883578c-.4887 1.0953-1.2027 1.7555-2.1421 1.9807-.6614043.1585033-1.3464097.0801526-2.0549813-.2350171l.1110343-.0326099c-.8063957.2132596-1.0834017.4526742-1.0811775.684637.0027242.284151.2929566.579019 1.0551448.8691571l-.5336407 1.4018658c-1.27641442-.4858858-2.01161974-1.2328341-2.02143515-2.2566418-.01011718-1.0551234.77444821-1.7537176 2.11778055-2.1275085.4288532-.5436828.9579753-.8910442 1.588675-1.0422026.9394-.22516 1.9263.02742 2.9607.75762z"></path>
                                    </svg>
                                            <span className="text-sm text-gray-600 font-bold truncate">Recomendación del viajero</span>
                                        </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Separador */}
                        <div className="h-px bg-gray-200 mb-6"></div>

                    {/* Detalles de la reserva */}
                        <div className="mb-6">
                            <div className="mb-0">
                                <div className="flex items-start justify-between gap-4 py-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-semibold text-gray-900 mb-1" style={{ fontSize: '14px', lineHeight: '18px' }}>Fechas</div>
                                        <div className="text-base text-gray-700" style={{ fontSize: '16px', lineHeight: '20px' }}>{checkInDate} – {checkOutDate}</div>
                                </div>
                                <button 
                                    type="button"
                                        className="text-sm font-semibold text-gray-900 bg-gray-100 border border-gray-200 rounded-lg px-3 py-1 hover:bg-gray-200 hover:border-gray-300 transition-all flex-shrink-0"
                                        style={{
                                            height: '28px',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <span>Cambiar</span>
                                </button>
                            </div>
                        </div>

                            <div className="h-px bg-gray-200"></div>

                            <div className="mb-0">
                                <div className="flex items-start justify-between gap-4 py-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-semibold text-gray-900 mb-1" style={{ fontSize: '14px', lineHeight: '18px' }}>Viajeros</div>
                                        <div className="text-base text-gray-700" style={{ fontSize: '16px', lineHeight: '20px' }}>{guests} {guests === 1 ? 'adulto' : 'adultos'}</div>
                                </div>
                                <button 
                                    type="button"
                                        className="text-sm font-semibold text-gray-900 bg-gray-100 border border-gray-200 rounded-lg px-3 py-1 hover:bg-gray-200 hover:border-gray-300 transition-all flex-shrink-0"
                                        style={{
                                            height: '28px',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <span>Cambiar</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Separador */}
                        <div className="h-px bg-gray-200 mb-6"></div>

                    {/* Precio total */}
                        <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                                <span className="text-base font-semibold text-gray-900" style={{ fontSize: '16px', lineHeight: '20px' }}>Precio total</span>
                            <div className="flex items-baseline gap-1">
                                    <span className="text-base font-semibold text-gray-900" style={{ fontSize: '16px', lineHeight: '20px' }}>
                                        {formatPrice((finalPrice * 2) * 1.21)} €
                                </span>
                            </div>
                        </div>
                        <button 
                            type="button"
                                className="text-sm font-semibold text-gray-900 bg-gray-100 border border-gray-200 rounded-lg px-3 py-1 hover:bg-gray-200 hover:border-gray-300 transition-all"
                                style={{
                                    height: '28px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <span>Detalles</span>
                        </button>
                    </div>

                    {/* Separador */}
                        <div className="h-px bg-gray-200 mb-6"></div>

                    {/* Política de cancelación */}
                        <div>
                            <div className="text-base font-semibold text-gray-900 mb-2" style={{ fontSize: '16px', lineHeight: '20px' }}>Cancelación gratuita</div>
                            <div className="text-base text-gray-700" style={{ fontSize: '16px', lineHeight: '20px' }}>
                            Si cancelas antes del {checkInDate}, recibirás un reembolso completo.{' '}
                            <button 
                                type="button"
                                    className="text-base font-semibold text-gray-900 underline decoration-gray-300 underline-offset-2 hover:no-underline transition-all"
                                    style={{ fontSize: '16px', lineHeight: '20px' }}
                            >
                                Política entera
                            </button>
                            </div>
                        </div>
                    </div>

                    {/* Separador grande */}
                    <div className="h-6"></div>

                    {/* Opciones de pago */}
                    <div className="mx-6 mb-6 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Elige cuándo quieres pagar</h2>
                        
                        <div className="space-y-0">
                            {/* Opción 1: Pago completo */}
                            <label className="block cursor-pointer">
                                <div className="flex items-start gap-3 p-3 hover:bg-gray-50 transition-colors rounded-lg">
                                    <div className="flex-1 min-w-0">
                                        <div className="text-base font-semibold text-gray-900">
                                            Paga {formatPrice((finalPrice * 2) * 1.21)} € ahora
                                        </div>
                                    </div>
                                    <input
                                        type="radio"
                                        name="payment-plan"
                                        value="full"
                                        checked={selectedPaymentPlan === 'full'}
                                        onChange={(e) => setSelectedPaymentPlan(e.target.value as 'full' | 'split')}
                                        className="w-4 h-4 text-gray-900 border-gray-300 focus:ring-gray-900 mt-0.5 flex-shrink-0"
                                    />
                                </div>
                            </label>

                            <div className="h-px bg-gray-200"></div>

                            {/* Opción 2: Pago dividido (Stripe) */}
                            <label className="block cursor-pointer">
                                <div className="flex items-start gap-3 p-3 hover:bg-gray-50 transition-colors rounded-lg">
                                    <div className="flex-1 min-w-0">
                                        <div className="text-base font-semibold text-gray-900 mb-1">
                                            Paga 0 € ahora
                                        </div>
                                        <div className="text-base text-gray-700">
                                            Cantidad cobrada el {checkInDate}: {formatPrice((finalPrice * 2) * 1.21)} €. Sin costes adicionales.{' '}
                                            <button 
                                                type="button"
                                                className="text-base font-semibold text-gray-900 underline decoration-gray-300 underline-offset-2 hover:no-underline transition-all"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                Más información
                                            </button>
                                        </div>
                                    </div>
                                    <input
                                        type="radio"
                                        name="payment-plan"
                                        value="split"
                                        checked={selectedPaymentPlan === 'split'}
                                        onChange={(e) => setSelectedPaymentPlan(e.target.value as 'full' | 'split')}
                                        className="w-4 h-4 text-gray-900 border-gray-300 focus:ring-gray-900 mt-0.5 flex-shrink-0"
                                    />
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Footer fijo móvil */}
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 pb-safe">
                    <div className="px-6 py-4">
                        <button
                            onClick={handlePayment}
                            disabled={isSubmitting}
                            type="button"
                            className="relative w-full h-12 px-6 bg-gray-900 hover:bg-gray-800 text-white text-[16px] font-semibold transition-all duration-200 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span className="relative z-10" data-button-content="true">
                                {isSubmitting ? 'Procesando...' : 'Reservar'}
                            </span>
                        </button>
                        <p className="mt-3 text-center text-sm text-gray-500 font-normal">
                            No se te cobrará nada todavía
                        </p>
                    </div>
                </div>
            </div>

            <StripeLoadingOverlay 
                isOpen={isSubmitting}
                message="Procesando pago con Stripe..."
            />
        </>
    );
}

