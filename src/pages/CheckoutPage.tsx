import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Star, Shield, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useApi } from '../hooks/useApi';
import { API_CONFIG } from '../config/api';
import { showToast } from '../lib/toast';
import { StripeLoadingOverlay } from '../components/StripeLoadingOverlay';
import { Service } from '../hooks/useServices';

interface CheckoutPageProps {}

export function CheckoutPage({}: CheckoutPageProps) {
    const { serviceId } = useParams<{ serviceId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated } = useAuth();
    const { fetchApi } = useApi();
    
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

        const loadService = async () => {
            if (!serviceId) {
                showToast('error', 'ID de servicio no válido');
                navigate(-1);
                return;
            }

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
                
                if (rawService) {
                    // Transformar PascalCase a camelCase
                    const transformService = (service: any): Service => {
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
                            expert: service.Expert ? {
                                id: service.Expert.Id || service.expert.id,
                                userId: service.Expert.UserId || service.expert.userId,
                                user: service.Expert.User ? {
                                    id: service.Expert.User.Id || service.expert.user.id,
                                    name: service.Expert.User.Name || service.expert.user.name,
                                    email: service.Expert.User.Email || service.expert.user.email,
                                    profilePictureUrl: service.Expert.User.ProfilePictureUrl || service.expert.user.profilePictureUrl,
                                    createdAt: service.Expert.User.CreatedAt || service.expert.user.createdAt,
                                } : service.expert.user,
                                bio: service.Expert.Bio || service.expert.bio,
                                country: service.Expert.Country || service.expert.country,
                                city: service.Expert.City || service.expert.city,
                                phone: service.Expert.Phone || service.expert.phone,
                                address: service.Expert.Address || service.expert.address,
                                zipCode: service.Expert.ZipCode || service.expert.zipCode,
                                isVerified: service.Expert.IsVerified ?? service.expert.isVerified,
                                isSuperExpert: service.Expert.IsSuperExpert ?? service.expert.isSuperExpert,
                                reviews: service.Expert.Reviews || service.expert.reviews || [],
                                averageRating: service.Expert.AverageRating ?? service.expert.averageRating ?? 0,
                                reviewsCount: service.Expert.ReviewsCount ?? service.expert.reviewsCount ?? 0,
                                completedSearches: service.Expert.CompletedSearches ?? service.expert.completedSearches ?? 0,
                                currentAvailability: service.Expert.CurrentAvailability || service.expert.currentAvailability,
                                responseTimeInHours: service.Expert.ResponseTimeInHours ?? service.expert.responseTimeInHours,
                                responseRate: service.Expert.ResponseRate ?? service.expert.responseRate,
                                languages: service.Expert.Languages || service.expert.languages || [],
                                education: service.Expert.Education || service.expert.education || [],
                                workExperience: service.Expert.WorkExperience || service.expert.workExperience || [],
                                certifications: service.Expert.Certifications || service.expert.certifications || [],
                                awards: service.Expert.Awards || service.expert.awards || [],
                                linkedInUrl: service.Expert.LinkedInUrl || service.expert.linkedInUrl,
                                websiteUrl: service.Expert.WebsiteUrl || service.expert.websiteUrl,
                                facebookUrl: service.Expert.FacebookUrl || service.expert.facebookUrl,
                                twitterUrl: service.Expert.TwitterUrl || service.expert.twitterUrl,
                                instagramUrl: service.Expert.InstagramUrl || service.expert.instagramUrl,
                                createdAt: service.Expert.CreatedAt || service.expert.createdAt,
                            } : service.expert,
                            selectedDeliverableTypes: service.SelectedDeliverableTypes || service.selectedDeliverableTypes || [],
                        };
                    };
                    setService(transformService(rawService));
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
    }, [serviceId, isAuthenticated, navigate, fetchApi]);

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

        setIsSubmitting(true);

        try {
            console.log('🔵 Creando sesión de checkout para servicio:', service.id);
            // Crear la sesión de checkout con Stripe
            const response = await fetchApi<any>(API_CONFIG.endpoints.expert.hires.createCheckout(service.id), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    paymentPlan: selectedPaymentPlan === 'split' ? 'split' : 'full',
                }),
            });

            console.log('🔵 Respuesta del checkout:', response);

            if (response?.url) {
                console.log('🔵 Redirigiendo a Stripe:', response.url);
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
            showToast('error', errorMessage);
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
            <div className="min-h-screen bg-white lg:hidden">
                {/* Header móvil sin fondo */}
                <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 pointer-events-none">
                    <button 
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors pointer-events-auto"
                    >
                        <ArrowLeft className="w-5 h-5 text-white drop-shadow-lg" />
                    </button>
                </div>

                {/* Contenido principal */}
                <div className="pt-16 pb-32">
                    {/* Información del servicio */}
                    <div className="px-5 mb-6">
                        <div className="flex gap-4 mb-4">
                            {finalImages[0] && (
                                <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                                    <img 
                                        src={finalImages[0]} 
                                        alt={finalServiceTypeName}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <h2 className="text-[15px] font-semibold text-gray-900 leading-[1.4] mb-2">
                                    {finalServiceTypeName} por {finalExpertName}
                                </h2>
                                <div className="flex items-center gap-1.5 mb-1">
                                    <Star className="w-3 h-3 fill-gray-900 text-gray-900" />
                                    <span className="text-[14px] text-gray-900 font-normal leading-[1.4]">
                                        {finalRating.toFixed(2).replace('.', ',')}
                                    </span>
                                    <span className="text-[14px] text-gray-600">·</span>
                                    <span className="text-[14px] text-gray-600 font-normal leading-[1.4]">
                                        {finalReviews} {finalReviews === 1 ? 'evaluación' : 'evaluaciones'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1 mt-1">
                                    <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="presentation" focusable="false" style={{ display: 'block', height: '12px', width: '12px', fill: 'currentcolor' }}>
                                        <path d="m3.21684098 6.36820948c.69286.63327.95745 1.53818.79375 2.71472-1.28708.14974-2.27704-.09198-2.96991-.72524-.692873-.63329-.95745494-1.53818-.793752-2.71471 1.287062-.14979 2.277042.09195 2.969912.72523zm.01823-5.61820948c1.0236.743338 1.54043 1.567488 1.55049 2.472468.01006.90497-.48856 1.71941-1.49585 2.44334-1.02358-.74338-1.54042-1.56751-1.55048-2.47247-.01006-.90499.48856-1.71942 1.49584-2.443338zm-2.524114 9.883578c1.034374-.7302 2.021244-.98278 2.960614-.75762.63073992.1511584 1.15987526.4985198 1.58740902 1.0419992l-.07821789-.02145c1.39197832.3681397 2.20787023 1.0733199 2.19755429 2.1491723-.00983089 1.0237908-.74501936 1.7707365-2.02138366 2.256627l-.53366353-1.401857c.7621544-.2901395 1.05238772-.5850143 1.05511624-.8691626.00211728-.220812-.24880712-.4483858-.96854292-.6537179-.71044194.3168616-1.39543503.3952123-2.05688155.236709-.93937-.2252-1.65337-.8854-2.142004-1.9807zm15.10285402-4.99059852c.1637 1.17653-.1009 2.08142-.7937 2.71471-.6929.63326-1.6829.87498-2.9699.72524-.1637-1.17654.1009-2.08145.7937-2.71472.6929-.63328 1.6829-.87502 2.9699-.72523zm-2.9881-4.89297948c1.0073.723918 1.5059 1.538348 1.4958 2.443338-.01.90496-.5269 1.72909-1.5505 2.47247-1.0072-.72393-1.5059-1.53837-1.4958-2.44334.0101-.90498.5269-1.72913 1.5505-2.472468zm2.5239 9.883578c-.4887 1.0953-1.2027 1.7555-2.1421 1.9807-.6614043.1585033-1.3464097.0801526-2.0549813-.2350171l.1110343-.0326099c-.8063957.2132596-1.0834017.4526742-1.0811775.684637.0027242.284151.2929566.579019 1.0551448.8691571l-.5336407 1.4018658c-1.27641442-.4858858-2.01161974-1.2328341-2.02143515-2.2566418-.01011718-1.0551234.77444821-1.7537176 2.11778055-2.1275085.4288532-.5436828.9579753-.8910442 1.588675-1.0422026.9394-.22516 1.9263.02742 2.9607.75762z"></path>
                                    </svg>
                                    <div className="text-[14px] text-gray-600 font-normal leading-[1.4]">Recomendación del viajero</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Separador */}
                    <div className="h-px bg-gray-200 mx-5 mb-6"></div>

                    {/* Detalles de la reserva */}
                    <div className="px-5 mb-6">
                        <div className="mb-4">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <div className="text-[15px] font-semibold text-gray-900 leading-[1.4] mb-1">Fechas</div>
                                    <div className="text-[15px] text-gray-700 font-normal leading-[1.4]">{checkInDate} – {checkOutDate}</div>
                                </div>
                                <button 
                                    type="button"
                                    className="text-[15px] font-semibold text-gray-900 underline decoration-gray-300 underline-offset-2 hover:no-underline"
                                >
                                    Cambiar
                                </button>
                            </div>
                        </div>

                        <div className="h-px bg-gray-200 mb-4"></div>

                        <div className="mb-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-[15px] font-semibold text-gray-900 leading-[1.4] mb-1">Viajeros</div>
                                    <div className="text-[15px] text-gray-700 font-normal leading-[1.4]">{guests} {guests === 1 ? 'adulto' : 'adultos'}</div>
                                </div>
                                <button 
                                    type="button"
                                    className="text-[15px] font-semibold text-gray-900 underline decoration-gray-300 underline-offset-2 hover:no-underline"
                                >
                                    Cambiar
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Separador */}
                    <div className="h-px bg-gray-200 mx-5 mb-6"></div>

                    {/* Precio total */}
                    <div className="px-5 mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[15px] font-semibold text-gray-900 leading-[1.4]">Precio total</span>
                            <div className="flex items-baseline gap-1">
                                <span 
                                    className="text-[15px] font-semibold text-gray-900 leading-[1.4] underline decoration-gray-900 underline-offset-2"
                                    style={{ textDecorationThickness: '1px' }}
                                >
                                    {formatPrice(finalPrice)} €
                                </span>
                            </div>
                        </div>
                        <button 
                            type="button"
                            className="text-[15px] font-semibold text-gray-900 underline decoration-gray-300 underline-offset-2 hover:no-underline"
                        >
                            Detalles
                        </button>
                    </div>

                    {/* Separador */}
                    <div className="h-px bg-gray-200 mx-5 mb-6"></div>

                    {/* Política de cancelación */}
                    <div className="px-5 mb-6">
                        <div className="text-[15px] font-semibold text-gray-900 leading-[1.4] mb-2">Cancelación gratuita</div>
                        <div className="text-[15px] text-gray-700 font-normal leading-[1.5]">
                            Si cancelas antes del {checkInDate}, recibirás un reembolso completo.{' '}
                            <button 
                                type="button"
                                className="text-[15px] font-semibold text-gray-900 underline decoration-gray-300 underline-offset-2 hover:no-underline"
                            >
                                Política entera
                            </button>
                        </div>
                    </div>

                    {/* Separador grande */}
                    <div className="h-6"></div>

                    {/* Opciones de pago */}
                    <div className="px-5 mb-6">
                        <h2 className="text-[18px] font-semibold text-gray-900 leading-[1.3] mb-4">Elige cuándo quieres pagar</h2>
                        
                        <div className="space-y-0">
                            {/* Opción 1: Pago completo */}
                            <label className="block">
                                <div className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:border-gray-900 transition-colors cursor-pointer">
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[15px] font-semibold text-gray-900 leading-[1.4] mb-1">
                                            Paga {formatPrice(finalPrice)} € ahora
                                        </div>
                                    </div>
                                    <input
                                        type="radio"
                                        name="payment-plan"
                                        value="full"
                                        checked={selectedPaymentPlan === 'full'}
                                        onChange={(e) => setSelectedPaymentPlan(e.target.value as 'full' | 'split')}
                                        className="w-5 h-5 text-gray-900 border-gray-300 focus:ring-gray-900"
                                    />
                                </div>
                            </label>

                            <div className="h-px bg-gray-200 my-2"></div>

                            {/* Opción 2: Pago dividido (Stripe) */}
                            <label className="block">
                                <div className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:border-gray-900 transition-colors cursor-pointer">
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[15px] font-semibold text-gray-900 leading-[1.4] mb-1">
                                            Paga 0 € ahora
                                        </div>
                                        <div className="text-[15px] text-gray-700 font-normal leading-[1.5]">
                                            Cantidad cobrada el {checkInDate}: {formatPrice(finalPrice)} €. Sin costes adicionales.{' '}
                                            <button 
                                                type="button"
                                                className="text-[15px] font-semibold text-gray-900 underline decoration-gray-300 underline-offset-2 hover:no-underline"
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
                                        className="w-5 h-5 text-gray-900 border-gray-300 focus:ring-gray-900"
                                    />
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Footer fijo móvil */}
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 pb-safe">
                    <div className="px-5 py-4">
                        <button
                            onClick={handlePayment}
                            disabled={isSubmitting}
                            type="button"
                            className="relative w-full h-12 px-6 bg-gradient-to-r from-[#E61E4D] via-[#E31C5F] to-[#D70466] hover:from-[#D70466] hover:via-[#E61E4D] hover:to-[#E31C5F] text-white text-[16px] font-semibold transition-all duration-200 overflow-hidden"
                            style={{
                                borderRadius: '24px',
                                backgroundPosition: 'calc((100 - var(--mouse-x, 0)) * 1%) calc((100 - var(--mouse-y, 0)) * 1%)',
                            }}
                            onMouseMove={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const x = ((e.clientX - rect.left) / rect.width) * 100;
                                const y = ((e.clientY - rect.top) / rect.height) * 100;
                                e.currentTarget.style.setProperty('--mouse-x', x.toString());
                                e.currentTarget.style.setProperty('--mouse-y', y.toString());
                            }}
                            onTouchMove={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const touch = e.touches[0];
                                const x = ((touch.clientX - rect.left) / rect.width) * 100;
                                const y = ((touch.clientY - rect.top) / rect.height) * 100;
                                e.currentTarget.style.setProperty('--mouse-x', x.toString());
                                e.currentTarget.style.setProperty('--mouse-y', y.toString());
                            }}
                        >
                            <span className="relative z-10" data-button-content="true">
                                {isSubmitting ? 'Procesando...' : 'Reservar'}
                            </span>
                        </button>
                        <p className="mt-3 text-center text-[14px] text-gray-500 font-normal leading-[1.4]">
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

