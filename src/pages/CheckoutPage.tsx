import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Star, Shield, Check, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useApi } from '../hooks/useApi';
import { API_CONFIG } from '../config/api';
import { showToast } from '../lib/toast';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
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
    const [showPriceDetails, setShowPriceDetails] = useState(true);
    
    // Datos del servicio
    const serviceDuration = service?.durationInHours ? `${service.durationInHours} ${service.durationInHours === 1 ? 'hora' : 'horas'}` : 'No especificada';

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
                                    // ✅ CORRECTO: Usar ProfilePictureUrl del nivel superior, NO de user (que siempre es null)
                                    profilePictureUrl: expert.ProfilePictureUrl || expert.profilePictureUrl || '',
                                    description: expert.Description || expert.description || expert.Bio || expert.bio || '',
                                    stripeAccountId: expert.StripeAccountId || expert.stripeAccountId,
                                    createdAt: expert.CreatedAt || expert.createdAt,
                                    user: expertUser ? {
                                        name: expertUser.Name || expertUser.name || '',
                                        email: expertUser.Email || expertUser.email || '',
                                        // ✅ user.profilePictureUrl siempre será null para expertos - no usar como fallback
                                        profilePictureUrl: null,
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
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {/* Detalles del servicio */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div style={{ padding: '12px' }}>
                                {/* Separador arriba de Servicio */}
                                <div className="h-px bg-gray-200" style={{ marginTop: '0px', marginBottom: '0px', height: '1px' }}></div>
                                
                                {/* Tipo de servicio */}
                                <div className="flex items-center justify-between" role="group" aria-labelledby="description-row-servicio" style={{ paddingTop: '12px', paddingBottom: '12px' }}>
                                    <div className="flex-1">
                                        <div className="text-sm font-semibold text-gray-900 mb-1" id="description-row-servicio" style={{ fontSize: '14px', lineHeight: '18px' }}>Servicio</div>
                                        <div className="text-base text-gray-700" style={{ fontSize: '16px', lineHeight: '20px' }}>{finalServiceTypeName}</div>
                                    </div>
                                </div>

                                <div className="h-px bg-gray-200" style={{ marginTop: '0px', marginBottom: '0px', height: '1px' }}></div>

                                {/* Duración */}
                                <div className="flex items-center justify-between" role="group" aria-labelledby="description-row-duracion" style={{ paddingTop: '12px', paddingBottom: '12px' }}>
                                    <div className="flex-1">
                                        <div className="text-sm font-semibold text-gray-900 mb-1" id="description-row-duracion" style={{ fontSize: '14px', lineHeight: '18px' }}>Duración estimada</div>
                                        <div className="text-base text-gray-700" style={{ fontSize: '16px', lineHeight: '20px' }}>{serviceDuration}</div>
                                    </div>
                                </div>

                                {service?.categoryName && (
                                    <>
                                        <div className="h-px bg-gray-200" style={{ marginTop: '0px', marginBottom: '0px', height: '1px' }}></div>
                                        {/* Categoría */}
                                        <div className="flex items-center justify-between" role="group" aria-labelledby="description-row-categoria" style={{ paddingTop: '12px', paddingBottom: '0px' }}>
                                            <div className="flex-1">
                                                <div className="text-sm font-semibold text-gray-900 mb-1" id="description-row-categoria" style={{ fontSize: '14px', lineHeight: '18px' }}>Categoría</div>
                                                <div className="text-base text-gray-700" style={{ fontSize: '16px', lineHeight: '20px' }}>{service.categoryName}</div>
                                            </div>
                                        </div>
                                        {/* Separador abajo de Categoría */}
                                        <div className="h-px bg-gray-200" style={{ marginTop: '12px', marginBottom: '0px', height: '1px' }}></div>
                                    </>
                                )}
                                {!service?.categoryName && (
                                    <>
                                        {/* Separador abajo de Duración si no hay categoría */}
                                        <div className="h-px bg-gray-200" style={{ marginTop: '0px', marginBottom: '0px', height: '1px' }}></div>
                                    </>
                                )}
                            </div>
                        </div>

                            </div>
                        </div>

                        {/* Sidebar derecho fijo - Estilo Airbnb */}
                        <div className="sticky top-8 h-fit" style={{ marginTop: '72px' }}>
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                {/* Información del servicio - Estilo Airbnb */}
                                <div style={{ padding: '12px' }}>
                                    <div className="mb-6">
                                        {finalImages[0] && (
                                            <div className="w-full rounded-lg overflow-hidden mb-4" style={{ aspectRatio: '1' }}>
                                                <img 
                                                    src={finalImages[0]} 
                                                    alt={finalServiceTypeName}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        )}
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2" style={{
                                            fontSize: '18px',
                                            lineHeight: '24px',
                                            fontWeight: 600,
                                            letterSpacing: '-0.01em',
                                        }}>
                                            {finalServiceTypeName}
                                        </h3>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <div className="flex items-center gap-1.5">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style={{ display: 'block', height: '12px', width: '12px', fill: 'currentcolor' }}>
                                                    <path fillRule="evenodd" d="m15.1 1.58-4.13 8.88-9.86 1.27a1 1 0 0 0-.54 1.74l7.3 6.57-1.97 9.85a1 1 0 0 0 1.48 1.06l8.62-5 8.63 5a1 1 0 0 0 1.48-1.06l-1.97-9.85 7.3-6.57a1 1 0 0 0-.55-1.73l-9.86-1.28-4.12-8.88a1 1 0 0 0-1.82 0z"></path>
                                                </svg>
                                                <span className="text-sm text-gray-600" style={{ fontSize: '14px', lineHeight: '18px' }}>
                                                    Valoración de {finalRating.toFixed(2).replace('.', ',')}&nbsp;sobre 5; {finalReviews}&nbsp;evaluaciones
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="h-px bg-gray-200" style={{ marginTop: '16px', marginBottom: '16px' }}></div>

                                    {/* Precio total - Estilo Airbnb con desglose IVA */}
                                    <div className="mb-6">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-base font-semibold text-gray-900" style={{ fontSize: '16px', lineHeight: '20px' }}>Precio total</span>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-lg font-semibold text-gray-900" style={{ fontSize: '18px', lineHeight: '24px' }}>
                                                    {formatPrice(finalPrice * 1.21)}&nbsp;€
                                                </span>
                                            </div>
                                        </div>
                                        
                                        {/* Desglose del precio */}
                                        {showPriceDetails && (
                                            <div className="mt-3 space-y-2 pb-3">
                                                <div className="flex justify-between text-sm text-gray-700" style={{ fontSize: '14px', lineHeight: '18px' }}>
                                                    <span>Precio del servicio</span>
                                                    <span>{formatPrice(finalPrice)}&nbsp;€</span>
                                                </div>
                                                <div className="flex justify-between text-sm text-gray-700" style={{ fontSize: '14px', lineHeight: '18px' }}>
                                                    <span>IVA (21%)</span>
                                                    <span>{formatPrice(finalPrice * 0.21)}&nbsp;€</span>
                                                </div>
                                                <div className="h-px bg-gray-200 my-2"></div>
                                                <div className="flex justify-between text-base font-semibold text-gray-900" style={{ fontSize: '16px', lineHeight: '20px' }}>
                                                    <span>Total</span>
                                                    <span>{formatPrice(finalPrice * 1.21)}&nbsp;€</span>
                                                </div>
                                            </div>
                                        )}
                                        
                                        <button 
                                            type="button"
                                            onClick={() => setShowPriceDetails(!showPriceDetails)}
                                            className="text-sm font-semibold text-gray-900 underline decoration-gray-300 underline-offset-2 hover:no-underline transition-all"
                                            style={{ fontSize: '14px', lineHeight: '18px' }}
                                        >
                                            {showPriceDetails ? 'Ocultar' : 'Detalles'}
                                        </button>
                                    </div>

                                    <div className="h-px bg-gray-200" style={{ marginTop: '16px', marginBottom: '16px' }}></div>

                                    {/* Cancelación gratuita - Estilo Airbnb */}
                                    <div className="mb-6">
                                        <div className="text-base font-semibold text-gray-900 mb-2" style={{ fontSize: '16px', lineHeight: '20px' }}>Cancelación gratuita</div>
                                        <div className="text-sm text-gray-700" style={{ fontSize: '14px', lineHeight: '18px' }}>
                                            Si cancelas antes de que el experto comience la revisión, recibirás un reembolso completo.{' '}
                                            <button 
                                                type="button"
                                                className="text-sm font-semibold text-gray-900 underline decoration-gray-300 underline-offset-2 hover:no-underline transition-all"
                                                style={{ fontSize: '14px', lineHeight: '18px' }}
                                            >
                                                Política&nbsp;entera
                                            </button>
                                        </div>
                                    </div>

                                    {/* Botón de reserva - Estilo Airbnb */}
                                    <button
                                        onClick={handlePayment}
                                        disabled={isSubmitting || createSearchWithHire.isPending}
                                        type="button"
                                        className="relative w-full h-12 px-6 bg-gray-900 hover:bg-gray-800 text-white text-[16px] font-semibold transition-all duration-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                        style={{ fontSize: '16px', lineHeight: '20px', fontWeight: 600 }}
                                    >
                                        <span className="relative z-10" data-button-content="true">
                                            {isSubmitting || createSearchWithHire.isPending ? 'Procesando...' : 'Reservar'}
                                        </span>
                                    </button>
                                    <p className="mt-3 text-center text-sm text-gray-500 font-normal" style={{ fontSize: '14px', lineHeight: '18px' }}>
                                        No se te cobrará nada todavía
                                    </p>
                                </div>
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
                <div className="pt-2 pb-6">
                    <h1 
                        className="text-gray-900 px-6" 
                        tabIndex={-1} 
                        aria-label="Finaliza tu reserva"
                        style={{
                            fontSize: '26px',
                            lineHeight: '32px',
                            fontWeight: 700,
                            letterSpacing: '-0.01em',
                            fontFamily: 'inherit',
                            position: 'relative',
                            display: 'inline-block',
                        }}
                    >
                        Finaliza tu reserva
                        <span 
                            style={{
                                position: 'absolute',
                                bottom: '-4px',
                                left: '24px',
                                right: '24px',
                                height: '3px',
                                background: 'linear-gradient(to right, #e61e4d, #e31c5f, #d70466)',
                                borderRadius: '2px',
                                opacity: 0.8,
                            }}
                        />
                    </h1>
                </div>

                {/* Contenido principal */}
                <div className="pb-32">
                    {/* Contenedor principal con borde */}
                    <div className="mx-6 bg-white rounded-xl border border-gray-200 shadow-sm" style={{ marginBottom: '0px', padding: '12px' }}>
                        {/* Información del servicio */}
                        <div style={{ marginBottom: '12px', marginTop: '0px' }}>
                            <div className="flex items-center gap-4" style={{ marginTop: '0px' }}>
                                {finalImages[0] && (
                                    <div 
                                        className="rounded-lg overflow-hidden flex-shrink-0"
                                        style={{
                                            width: '96px',
                                            height: '96px',
                                            aspectRatio: '1',
                                            marginTop: '0px',
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
                                    className="flex-1 min-w-0 flex flex-col justify-center"
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
                                    <div className="flex items-center gap-1.5 min-w-0 flex-shrink-0">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style={{ display: 'block', height: '12px', width: '12px', fill: 'currentcolor', flexShrink: 0 }}>
                                            <path fillRule="evenodd" d="m15.1 1.58-4.13 8.88-9.86 1.27a1 1 0 0 0-.54 1.74l7.3 6.57-1.97 9.85a1 1 0 0 0 1.48 1.06l8.62-5 8.63 5a1 1 0 0 0 1.48-1.06l-1.97-9.85 7.3-6.57a1 1 0 0 0-.55-1.73l-9.86-1.28-4.12-8.88a1 1 0 0 0-1.82 0z"></path>
                                        </svg>
                                        <span className="text-sm text-gray-600 font-bold">
                                            {finalRating.toFixed(2).replace('.', ',')} ({finalReviews})
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Detalles del servicio - dentro del mismo contenedor */}
                        {/* Separador arriba de Servicio */}
                        <div className="h-px bg-gray-200" style={{ marginTop: '0px', marginBottom: '12px', height: '1px' }}></div>
                        
                        <div className="mb-0">
                            <div className="flex items-start justify-between gap-4" style={{ paddingTop: '0px', paddingBottom: '12px' }}>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-semibold text-gray-900 mb-1" style={{ fontSize: '14px', lineHeight: '18px' }}>Servicio</div>
                                        <div className="text-base text-gray-700" style={{ fontSize: '16px', lineHeight: '20px' }}>{finalServiceTypeName}</div>
                                </div>
                            </div>
                        </div>

                            <div className="h-px bg-gray-200" style={{ marginTop: '0px', marginBottom: '0px', height: '1px' }}></div>

                            <div className="mb-0">
                                <div className="flex items-start justify-between gap-4" style={{ paddingTop: '12px', paddingBottom: '12px' }}>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-semibold text-gray-900 mb-1" style={{ fontSize: '14px', lineHeight: '18px' }}>Duración estimada</div>
                                        <div className="text-base text-gray-700" style={{ fontSize: '16px', lineHeight: '20px' }}>{serviceDuration}</div>
                                </div>
                            </div>
                        </div>

                        {service?.categoryName && (
                            <>
                                <div className="h-px bg-gray-200" style={{ marginTop: '0px', marginBottom: '0px', height: '1px' }}></div>
                                <div className="mb-0">
                                    <div className="flex items-start justify-between gap-4" style={{ paddingTop: '12px', paddingBottom: '0px' }}>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-semibold text-gray-900 mb-1" style={{ fontSize: '14px', lineHeight: '18px' }}>Categoría</div>
                                            <div className="text-base text-gray-700" style={{ fontSize: '16px', lineHeight: '20px' }}>{service.categoryName}</div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                        {!service?.categoryName && (
                            <>
                                {/* Separador abajo de Duración si no hay categoría */}
                                <div className="h-px bg-gray-200" style={{ marginTop: '0px', marginBottom: '0px', height: '1px' }}></div>
                            </>
                        )}

                        {/* Separador entre secciones */}
                        <div className="h-px bg-gray-200" style={{ marginTop: '12px', marginBottom: '12px', height: '1px' }}></div>

                        {/* Precio total con desglose IVA */}
                        <div style={{ marginBottom: '0px' }}>
                            <div className="flex items-center justify-between" style={{ paddingTop: '0px', paddingBottom: '12px' }}>
                                <span className="text-base font-semibold text-gray-900" style={{ fontSize: '16px', lineHeight: '20px' }}>Precio total</span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-base font-semibold text-gray-900" style={{ fontSize: '16px', lineHeight: '20px' }}>
                                        {formatPrice(finalPrice * 1.21)} €
                                    </span>
                                </div>
                            </div>
                            
                            {/* Desglose del precio móvil */}
                            {showPriceDetails && (
                                <div className="mt-3 space-y-2 pb-3">
                                    <div className="flex justify-between text-sm text-gray-700" style={{ fontSize: '14px', lineHeight: '18px' }}>
                                        <span>Precio del servicio</span>
                                        <span>{formatPrice(finalPrice)} €</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-gray-700" style={{ fontSize: '14px', lineHeight: '18px' }}>
                                        <span>IVA (21%)</span>
                                        <span>{formatPrice(finalPrice * 0.21)} €</span>
                                    </div>
                                    <div className="h-px bg-gray-200 my-2"></div>
                                    <div className="flex justify-between text-base font-semibold text-gray-900" style={{ fontSize: '16px', lineHeight: '20px' }}>
                                        <span>Total</span>
                                        <span>{formatPrice(finalPrice * 1.21)} €</span>
                                    </div>
                                </div>
                            )}
                            
                            <button 
                                type="button"
                                onClick={() => setShowPriceDetails(!showPriceDetails)}
                                className="text-sm font-semibold text-gray-900 underline decoration-gray-300 underline-offset-2 hover:no-underline transition-all"
                                style={{
                                    fontSize: '14px',
                                    lineHeight: '18px',
                                }}
                            >
                                <span>{showPriceDetails ? 'Ocultar' : 'Detalles'}</span>
                            </button>
                        </div>

                        {/* Separador entre secciones */}
                        <div className="h-px bg-gray-200" style={{ marginTop: '12px', marginBottom: '12px', height: '1px' }}></div>

                        {/* Política de cancelación */}
                        <div style={{ marginBottom: '0px' }}>
                            <div className="text-base font-semibold text-gray-900 mb-2" style={{ fontSize: '16px', lineHeight: '20px', paddingTop: '0px', paddingBottom: '8px' }}>Cancelación gratuita</div>
                            <div className="text-base text-gray-700" style={{ fontSize: '16px', lineHeight: '20px', paddingBottom: '12px' }}>
                                Si cancelas antes de que el experto comience la revisión, recibirás un reembolso completo.{' '}
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

                </div>

                {/* Footer fijo móvil */}
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 pb-safe">
                    <div className="px-6" style={{ paddingTop: '12px', paddingBottom: '16px' }}>
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
                    </div>
                </div>
            </div>

            {isSubmitting && (
                <div className="fixed inset-0 z-[9999] bg-white">
                    <SkeletonTheme baseColor="#f3f4f6" highlightColor="#e5e7eb">
                        <div className="min-h-screen p-6">
                            <div className="max-w-2xl mx-auto space-y-6">
                                <Skeleton height={40} width="60%" borderRadius={0} />
                                <Skeleton height={300} width="100%" borderRadius={0} />
                                <Skeleton height={200} width="100%" borderRadius={0} />
                                <Skeleton height={150} width="100%" borderRadius={0} />
                            </div>
                        </div>
                    </SkeletonTheme>
                </div>
            )}
        </>
    );
}

