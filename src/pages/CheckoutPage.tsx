import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Globe, Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useApi } from '../hooks/useApi';
import { API_CONFIG } from '../config/api';
import { showToast } from '../lib/toast';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { Service } from '../hooks/useServices';
import { useSearch } from '../hooks/useSearch.hooks';
import { formatPriceNumber } from '../utils/priceUtils';
import { useCurrency } from '../contexts/CurrencyContext';
import { formatTimezoneFriendly } from '../utils/timezoneFormat';
import { HomepageDesktopTopBar } from '../components/HomepageDesktopTopBar';
import { MobileReserveFooter } from '../components/serviceDetail/MobileReserveFooter';
import { CheckoutReserveHint } from '../components/checkout/CheckoutReserveGuide';
import {
    ServiceDetailDeliverablesGuide,
    normalizeDeliverableTypes,
} from '../components/serviceDetail/ServiceDetailDeliverablesGuide';
import { ServiceDetailCoverageMap } from '../components/serviceDetail/ServiceDetailCoverageMap';
import { readServiceReturnPath } from '../utils/servicePageNavigation';
import {
    HP_FONT,
    HP_LINK_UNDERLINE_CLASS,
    SD_MOBILE_FOOTER_CTA_CLASS,
    SD_MOBILE_GUTTER_CLASS,
    SD_MOBILE_SCROLL_PAD_CLASS,
    SD_CHECKOUT_GRID_CLASS,
    SD_CHECKOUT_INNER_MAX_CLASS,
    hpTitleUnderlineBarStyle,
} from '../constants/homepageTypography';

interface CheckoutPageProps {}

const checkoutRowLabelClass = 'text-sm font-semibold leading-[18px] text-[#1c1c1c]';
const checkoutRowValueClass = 'text-sm leading-snug text-[#6a6a6a]';
const checkoutCardClass =
    'overflow-hidden rounded-xl border border-[#e8e8e8] bg-white shadow-sm';
const checkoutDividerClass = 'h-px bg-[#e8e8e8]';
const checkoutNoticeBoxClass = 'mt-3 rounded border border-[#e8e8e8] bg-[#fafafa] p-2';
const checkoutNoticeTextClass = 'text-[11px] leading-[14px] text-[#6a6a6a]';

function CheckoutLegalNotices({
    sourceCurrency,
    collapsible = false,
    defaultOpen = false,
}: {
    sourceCurrency: string;
    collapsible?: boolean;
    defaultOpen?: boolean;
}) {
    const body = (
        <>
            <p className="text-xs leading-relaxed text-[#595959]">
                <strong className="text-[#1c1c1c]">Aviso de conversión bancaria:</strong> El cargo final lo realiza Stripe en {sourceCurrency}.
                Tu banco puede aplicar tasas de cambio y comisiones distintas, por lo que el importe cobrado puede variar ligeramente de la estimación mostrada.
            </p>
            <p className="mt-2 text-xs leading-relaxed text-[#595959]">
                <strong className="text-[#1c1c1c]">Cancelación gratuita:</strong> Si cancelas antes de que el experto comience la revisión, recibirás un reembolso completo.{' '}
                <a
                    href="/terms.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-[#1c1c1c] underline decoration-brand underline-offset-2 hover:no-underline"
                >
                    Ver condiciones
                </a>
            </p>
        </>
    );

    if (!collapsible) {
        return <div className={checkoutNoticeBoxClass}>{body}</div>;
    }

    return (
        <details className="mt-3 group" defaultOpen={defaultOpen}>
            <summary className="cursor-pointer list-none text-xs font-semibold text-[#1c1c1c] underline-offset-2 hover:underline [&::-webkit-details-marker]:hidden">
                Información legal y condiciones
            </summary>
            <div className={`${checkoutNoticeBoxClass} mt-2`}>{body}</div>
        </details>
    );
}

export function CheckoutPage({}: CheckoutPageProps) {
    const { serviceId } = useParams<{ serviceId: string }>();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const { fetchApi } = useApi();
    const { createSearchWithHire } = useSearch();
    const { formatPriceWithSource, preferredCurrency } = useCurrency();
    
    const [service, setService] = useState<Service | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    // 🛡️ T8 FIX: flag síncrono para cerrar la microventana entre el check y setIsSubmitting.
    // setState es asíncrono (batching de React) → si el usuario hace doble click muy rápido,
    // ambos handlers pueden leer isSubmitting=false y entrar al try. El useRef es síncrono:
    // isSubmittingRef.current=true se aplica INMEDIATAMENTE, bloqueando el segundo handler.
    const isSubmittingRef = useRef(false);
    const [showPriceDetails, setShowPriceDetails] = useState(false);
    
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

                // 🛡️ Round 10 — P-A FIX: logs sólo en dev. En prod exponían IDs de servicio
                // y URLs Stripe en la consola del navegador (visible en DevTools del usuario).
                if (import.meta.env.DEV) {
                    console.log('🔵 CheckoutPage - Servicio obtenido (raw):', rawService);
                }

                if (rawService) {
                    // Transformar PascalCase a camelCase (igual que en ServiceDetailPage.tsx)
                    const transformService = (service: any): Service => {
                        try {
                            const expert = service.Expert || service.expert;
                            const expertUser = expert?.User || expert?.user;

                            if (import.meta.env.DEV) {
                                console.log('🔵 CheckoutPage - Expert raw:', expert);
                                console.log('🔵 CheckoutPage - ExpertUser raw:', expertUser);
                            }
                            
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
                                priceCurrency: service.Currency || service.currency || service.PriceCurrency || service.priceCurrency || 'EUR',
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
                                    city: expert.City || expert.city || null,
                                    isOnVacation: expert.IsOnVacation ?? expert.isOnVacation ?? false,
                                    latitude: expert.Latitude || expert.latitude,
                                    longitude: expert.Longitude || expert.longitude,
                                    locationRange: expert.LocationRange || expert.locationRange,
                                    stripeStatus: (() => {
                                        const raw = expert.StripeStatus ?? expert.stripeStatus;
                                        if (typeof raw === 'string') return raw;
                                        if (typeof raw === 'number') {
                                            const map = [
                                                'NotRequested',
                                                'Pending',
                                                'Approved',
                                                'Rejected',
                                                'Disabled',
                                                'Restricted',
                                                'RequirementsPastDue',
                                                'PendingVerification',
                                                'Deauthorized',
                                                'ActionRequired',
                                                'RestrictedSoon',
                                                'RequirementsDue',
                                            ];
                                            return map[raw] ?? 'Unknown';
                                        }
                                        return undefined;
                                    })(),
                                    onboardingCompleted:
                                        expert.OnboardingCompleted ?? expert.onboardingCompleted,
                                } : null,
                                selectedDeliverableTypes: service.SelectedDeliverableTypes || service.selectedDeliverableTypes || [],
                            };
                        } catch (error) {
                            console.error('❌ Error en transformService:', error);
                            throw error;
                        }
                    };
                    const transformedService = transformService(rawService);
                    if (import.meta.env.DEV) {
                        console.log('✅ CheckoutPage - Servicio transformado:', transformedService);
                    }
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

    // 🛡️ Round 10 — P-B FIX: delegar a helper central NaN-safe en lugar de reimplementar.
    // El componente sigue concatenando "&nbsp;€" aparte (por el non-breaking space), así que
    // usamos formatPriceNumber (sin símbolo) en lugar de formatCurrency.
    // Round 24: helper legacy mantenido para casos donde solo necesitamos el número.
    const formatPrice = (price: number) => formatPriceNumber(price);

    // Round 24: helper para mostrar precio con conversión. Backend cobra siempre en EUR
    // (chargeCurrency = EUR), pero mostramos el equivalente en la moneda preferida del usuario.
    const sourceCurrency = service?.priceCurrency || 'EUR';
    const formatPriceDisplay = (amount: number) => formatPriceWithSource(amount, sourceCurrency, preferredCurrency);

    const handlePayment = async () => {
        if (!service) {
            showToast('error', 'Error: Servicio no disponible');
            return;
        }

        // 🛡️ Round 14 — Q14-S5 FIX: gate sobre stripeStatus del experto ANTES de iniciar
        // checkout. Si el experto cayó a Disabled/Restricted/Rejected/Deauthorized entre la
        // carga de la página y este clic, el backend va a rechazar igual — pero mostramos un
        // mensaje claro al cliente en lugar de un error genérico HTTP.
        // ApprovedStatuses incluye PendingVerification porque el backend live-check decide
        // si la cuenta puede operar realmente.
        const expertStripeStatus = service.expert?.stripeStatus;
        const allowedStatuses = ['Approved', 'PendingVerification'];
        if (expertStripeStatus && !allowedStatuses.includes(expertStripeStatus)) {
            showToast('error', 'Este experto no está disponible para nuevas contrataciones en este momento. Inténtalo más tarde o contacta con soporte.');
            return;
        }

        // 🛡️ T8 FIX: check ATÓMICO con useRef ANTES de cualquier setState. El check
        // anterior `isSubmitting` (state) tenía microventana 100-200ms entre lectura y
        // setIsSubmitting(true) durante la cual un doble click rápido pasaba ambos
        // requests → 2 sesiones Stripe + 2 hires duplicados. Ref + state combinados:
        // ref bloquea inmediato, state mantiene el UI disabled.
        if (isSubmittingRef.current || createSearchWithHire.isPending) {
            showToast('error', 'Error: Procesando solicitud. Por favor, espera.');
            return;
        }
        isSubmittingRef.current = true;
        setIsSubmitting(true);

        try {
            // 🛡️ Round 10 — P-A FIX: log sólo en dev (en prod expone IDs y URLs Stripe).
            if (import.meta.env.DEV) {
                console.log('🔵 Creando búsqueda con contratación para servicio:', service.id);
            }
            
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

            if (import.meta.env.DEV) {
                console.log('🔵 Respuesta del createSearchWithHire:', response);
            }

            if (response?.url) {
                if (import.meta.env.DEV) {
                    console.log('🔵 Redirigiendo a Stripe:', response.url);
                }
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
                isSubmittingRef.current = false; // 🛡️ T8: reset ref para permitir reintento
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
            isSubmittingRef.current = false; // 🛡️ T8: reset ref para permitir reintento
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#fafafa]">
                <div className="text-center">
                    <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-brand border-t-transparent" />
                    <p className="text-sm text-[#6a6a6a]" style={{ fontFamily: HP_FONT }}>Cargando...</p>
                </div>
            </div>
        );
    }

    if (!service) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#fafafa]">
                <div className="text-center">
                    <p className="mb-4 text-sm text-red-600" style={{ fontFamily: HP_FONT }}>Servicio no encontrado</p>
                    <button type="button" onClick={() => navigate(-1)} className="sd-btn-primary">
                        Volver
                    </button>
                </div>
            </div>
        );
    }

    const finalPrice = service.price || 0;
    // 🔧 FIX G2: el precio es INCLUSIVO de impuestos (lo que cobra Stripe). El TIPO de IVA depende del país de
    // facturación del COMPRADOR, que Stripe Tax determina DENTRO del Checkout (tras pedir la dirección) — es
    // DESCONOCIDO en esta página (pre-redirect). Antes mostrábamos un desglose con /1.21 (21% fijo) que es falso
    // fuera de ES. Solución honesta: mostrar solo el TOTAL; el desglose base/IVA real va en la factura post-pago.
    const finalTotal = finalPrice;
    const finalRating = service.averageRating || 0;
    const reviewCount =
        service.expert?.reviews?.length ?? service.reviewsCount ?? 0;
    const showRating = reviewCount > 0 && finalRating > 0;
    const finalDeliverableTypes = normalizeDeliverableTypes(service.selectedDeliverableTypes);
    const finalImages = service.imageUrls || [];
    const finalExpertName = service.expert?.user?.name || 'Experto';
    const finalServiceTypeName = service.serviceTypeName || 'Servicio';
    const expertStripeStatus = service.expert?.stripeStatus;
    const allowedStripeStatuses = ['Approved', 'PendingVerification'];
    const expertCanReceivePayments =
        !expertStripeStatus || allowedStripeStatuses.includes(expertStripeStatus);
    const desktopPriceInfo = formatPriceDisplay(finalTotal);
    const expertLatRaw = service.expert?.latitude ?? service.expertLatitude;
    const expertLngRaw = service.expert?.longitude ?? service.expertLongitude;
    const expertLat = expertLatRaw != null ? Number(expertLatRaw) : NaN;
    const expertLng = expertLngRaw != null ? Number(expertLngRaw) : NaN;
    const hasExpertCoords = Number.isFinite(expertLat) && Number.isFinite(expertLng);
    const expertRangeKm = Math.max(5, Number(service.expert?.locationRange) || 25);

    const handleBack = () => {
        if (serviceId) {
            const returnTo = readServiceReturnPath();
            navigate(`/service/${serviceId}`, {
                replace: true,
                state: { returnTo },
            });
            return;
        }
        navigate('/');
    };

    return (
        <>
            {/* Versión Desktop */}
            <div className="hidden min-h-screen bg-[#fafafa] lg:block">
                <HomepageDesktopTopBar
                    variant="checkout"
                    onBack={handleBack}
                    pageTitle="Confirmar y pagar"
                />
                <div className={`${SD_CHECKOUT_INNER_MAX_CLASS} pb-12 pt-4 lg:pt-5`}>
                    <p className="mb-5 max-w-2xl text-sm leading-relaxed text-[#6a6a6a] lg:mb-6">
                        Revisa tu reserva y continúa al pago seguro con Stripe.
                    </p>
                    <div className={SD_CHECKOUT_GRID_CLASS}>
                        <main className="min-w-0">
                            <div className={checkoutCardClass}>
                                <div className="p-5 lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-8">
                                    <div className="min-w-0 space-y-5 lg:space-y-6">
                                        <section aria-labelledby="checkout-booking-heading">
                                            <h2
                                                id="checkout-booking-heading"
                                                className="text-base font-semibold text-[#1c1c1c]"
                                            >
                                                Tu reserva
                                            </h2>
                                            <p className="mt-1 text-sm text-[#6a6a6a]">
                                                {finalServiceTypeName}
                                                {' · '}
                                                <span className="font-medium text-[#1c1c1c]">{finalExpertName}</span>
                                            </p>
                                            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-[minmax(0,9rem)_1fr]">
                                                <dt className="font-semibold text-[#1c1c1c]">Duración</dt>
                                                <dd className="text-[#6a6a6a]">{serviceDuration}</dd>
                                                {service?.categoryName ? (
                                                    <>
                                                        <dt className="font-semibold text-[#1c1c1c]">Categoría</dt>
                                                        <dd className="text-[#6a6a6a]">{service.categoryName}</dd>
                                                    </>
                                                ) : null}
                                            </dl>
                                            <button
                                                type="button"
                                                onClick={handleBack}
                                                className={`mt-3 text-sm font-semibold text-brand ${HP_LINK_UNDERLINE_CLASS}`}
                                            >
                                                Ver ficha del servicio
                                            </button>
                                        </section>

                                        {finalDeliverableTypes.length > 0 ? (
                                            <section
                                                className="border-t border-[#e8e8e8] pt-5 lg:border-t-0 lg:pt-0"
                                                aria-labelledby="checkout-includes-heading"
                                            >
                                                <h2
                                                    id="checkout-includes-heading"
                                                    className="mb-2 text-base font-semibold text-[#1c1c1c]"
                                                >
                                                    Qué incluye
                                                </h2>
                                                <ServiceDetailDeliverablesGuide
                                                    items={finalDeliverableTypes}
                                                    variant="inline"
                                                />
                                            </section>
                                        ) : null}

                                        {hasExpertCoords ? (
                                            <section
                                                className="border-t border-[#e8e8e8] pt-5"
                                                aria-labelledby="checkout-coverage-heading"
                                            >
                                                <h2
                                                    id="checkout-coverage-heading"
                                                    className="mb-2 text-base font-semibold text-[#1c1c1c]"
                                                >
                                                    Zona de cobertura
                                                </h2>
                                                <p className="mb-3 text-xs leading-relaxed text-[#6a6a6a]">
                                                    El experto se desplaza dentro de un radio de {expertRangeKm} km.
                                                </p>
                                                <ServiceDetailCoverageMap
                                                    latitude={expertLat}
                                                    longitude={expertLng}
                                                    rangeKm={expertRangeKm}
                                                    variant="preview"
                                                    expandable
                                                    className="h-[170px] w-full rounded-lg border border-[#e8e8e8]"
                                                />
                                            </section>
                                        ) : null}
                                    </div>

                                    <section
                                        className="border-t border-[#e8e8e8] pt-5 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0"
                                        aria-labelledby="checkout-steps-heading"
                                    >
                                        <h2
                                            id="checkout-steps-heading"
                                            className="text-base font-semibold text-[#1c1c1c]"
                                        >
                                            Qué ocurre al reservar
                                        </h2>
                                        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-[#6a6a6a]">
                                            <li className="flex gap-2">
                                                <span className="font-semibold text-[#1c1c1c]">1.</span>
                                                <span>Autorizas el pago en Stripe de forma segura.</span>
                                            </li>
                                            <li className="flex gap-2">
                                                <span className="font-semibold text-[#1c1c1c]">2.</span>
                                                <span>
                                                    El importe queda retenido hasta que apruebes el informe.
                                                </span>
                                            </li>
                                            <li className="flex gap-2">
                                                <span className="font-semibold text-[#1c1c1c]">3.</span>
                                                <span>
                                                    Coordinas fecha y lugar con el experto por chat (mín. 24&nbsp;h).
                                                </span>
                                            </li>
                                        </ul>
                                    </section>
                                </div>
                            </div>
                        </main>

                        <aside className="lg:sticky lg:top-14 lg:self-start">
                            <article className="sd-aside-card flex max-h-[calc(100dvh-4.5rem)] flex-col overflow-hidden">
                                <div className="min-h-0 flex-1 overflow-y-auto p-5">
                                    <div className="mb-4 flex gap-3">
                                        {finalImages[0] ? (
                                            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg">
                                                <img
                                                    src={finalImages[0]}
                                                    alt={finalServiceTypeName}
                                                    className="h-full w-full object-cover"
                                                />
                                            </div>
                                        ) : null}
                                        <div className="min-w-0 flex-1">
                                            <h2 className="font-display text-lg font-semibold leading-tight tracking-[-0.02em] text-[#1c1c1c]">
                                                {finalServiceTypeName}
                                            </h2>
                                            <p className="mt-1 text-xs text-[#6a6a6a]">por {finalExpertName}</p>
                                            {showRating ? (
                                                <div className="mt-1.5 flex items-center gap-1 text-sm text-[#6a6a6a]">
                                                    <Star
                                                        className="h-3 w-3 fill-[#1c1c1c] text-[#1c1c1c]"
                                                        aria-hidden
                                                    />
                                                    <span className="font-semibold tabular-nums text-[#1c1c1c]">
                                                        {finalRating.toFixed(1).replace('.', ',')}
                                                    </span>
                                                    <span className="text-[#d4d4d4]" aria-hidden>
                                                        ·
                                                    </span>
                                                    <span>
                                                        {reviewCount} evaluación
                                                        {reviewCount !== 1 ? 'es' : ''}
                                                    </span>
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>

                                    <section className="border-t border-[#e8e8e8] pt-4">
                                        <p className="text-2xl font-semibold tracking-tight tabular-nums text-[#1c1c1c]">
                                            {desktopPriceInfo.wasConverted
                                                ? `≈ ${desktopPriceInfo.converted}`
                                                : desktopPriceInfo.display}
                                        </p>
                                        <p className="text-sm text-[#6a6a6a]">total · impuestos incluidos</p>
                                        {desktopPriceInfo.wasConverted ? (
                                            <p className="mt-1 text-xs text-[#6a6a6a]">
                                                ({desktopPriceInfo.sourceFormatted} — cargo final en {sourceCurrency})
                                            </p>
                                        ) : null}
                                        {showPriceDetails ? (
                                            <p className="mt-2 text-xs leading-relaxed text-[#6a6a6a]">
                                                El IVA aplicable se calcula según tu país de facturación en Stripe.
                                            </p>
                                        ) : null}
                                        <button
                                            type="button"
                                            onClick={() => setShowPriceDetails(!showPriceDetails)}
                                            className={`mt-2 text-sm font-semibold text-[#1c1c1c] ${HP_LINK_UNDERLINE_CLASS}`}
                                            aria-expanded={showPriceDetails}
                                        >
                                            {showPriceDetails ? 'Ocultar detalles' : 'Detalles de precio'}
                                        </button>
                                    </section>

                                    {(() => {
                                        const tzLabel = formatTimezoneFriendly(service.expert?.timezone);
                                        if (!tzLabel) return null;
                                        return (
                                            <div className="mt-4 flex items-center gap-2 text-xs text-[#6a6a6a]">
                                                <Globe
                                                    className="h-3.5 w-3.5 shrink-0 text-brand"
                                                    aria-hidden
                                                />
                                                <span>Horario del experto: {tzLabel}</span>
                                            </div>
                                        );
                                    })()}
                                </div>

                                <footer className="shrink-0 space-y-2 border-t border-[#e8e8e8] bg-white p-5 pt-4">
                                    {!expertCanReceivePayments ? (
                                        <p className="text-xs leading-relaxed text-amber-800">
                                            Este experto no puede recibir nuevas contrataciones en este momento.
                                        </p>
                                    ) : null}
                                    <button
                                        onClick={handlePayment}
                                        disabled={
                                            !expertCanReceivePayments ||
                                            isSubmitting ||
                                            createSearchWithHire.isPending
                                        }
                                        type="button"
                                        aria-busy={isSubmitting || createSearchWithHire.isPending}
                                        className="sd-btn-primary w-full min-w-0"
                                    >
                                        {isSubmitting || createSearchWithHire.isPending
                                            ? 'Procesando...'
                                            : 'Reservar'}
                                    </button>
                                    <p className="text-center text-xs leading-relaxed text-[#6a6a6a]">
                                        Pago seguro con Stripe. Serás redirigido para completar el pago.
                                    </p>
                                    <CheckoutLegalNotices
                                        sourceCurrency={sourceCurrency}
                                        collapsible
                                        defaultOpen={desktopPriceInfo.wasConverted}
                                    />
                                </footer>
                            </article>
                        </aside>
                    </div>
                </div>
            </div>

            {/* Versión Móvil */}
            <div className="min-h-screen bg-[#fafafa] lg:hidden">
                <div className={SD_MOBILE_SCROLL_PAD_CLASS}>
                    <header
                        className={`${SD_MOBILE_GUTTER_CLASS} pb-4 pt-[calc(env(safe-area-inset-top,0px)+2rem)]`}
                    >
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={handleBack}
                                className="sd-icon-btn shrink-0"
                                aria-label="Volver"
                            >
                                <ArrowLeft className="h-5 w-5" aria-hidden />
                            </button>
                            <div className="min-w-0 flex-1">
                                <h1 className="sd-page-title relative inline-block text-[22px] leading-[26px]">
                                    Confirmar y pagar
                                    <span aria-hidden style={hpTitleUnderlineBarStyle} />
                                </h1>
                                <p className="mt-1 text-xs leading-relaxed text-[#6a6a6a]">
                                    Revisa tu reserva y continúa al pago seguro con Stripe.
                                </p>
                            </div>
                        </div>
                    </header>

                    <div className={`${SD_MOBILE_GUTTER_CLASS} pb-4`}>
                    <div className={`${checkoutCardClass} p-3`}>
                        <div className="mb-3">
                            <div className="flex items-center gap-4">
                                {finalImages[0] && (
                                    <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg">
                                        <img
                                            src={finalImages[0]}
                                            alt={finalServiceTypeName}
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                )}
                                <div className="flex min-w-0 flex-1 flex-col justify-center">
                                    <h2 className="mb-1 text-lg font-semibold leading-6 tracking-[-0.01em] text-[#1c1c1c]">
                                        {finalServiceTypeName} por {finalExpertName}
                                    </h2>
                                    {showRating ? (
                                        <div className="flex min-w-0 items-center gap-1.5 text-sm text-[#6a6a6a]">
                                            <Star
                                                className="h-3 w-3 fill-[#1c1c1c] text-[#1c1c1c]"
                                                aria-hidden
                                            />
                                            <span className="font-semibold tabular-nums text-[#1c1c1c]">
                                                {finalRating.toFixed(1).replace('.', ',')}
                                            </span>
                                            <span>
                                                ({reviewCount} evaluación{reviewCount !== 1 ? 'es' : ''})
                                            </span>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        </div>

                        <CheckoutReserveHint className="mb-3" />

                        <div className={`${checkoutDividerClass} mb-3`} />

                        <div className="pb-3">
                            <div className={`${checkoutRowLabelClass} mb-1`}>Servicio</div>
                            <div className={checkoutRowValueClass}>{finalServiceTypeName}</div>
                        </div>

                        <div className={checkoutDividerClass} />

                        <div className="py-3">
                            <div className={`${checkoutRowLabelClass} mb-1`}>Duración estimada</div>
                            <div className={checkoutRowValueClass}>{serviceDuration}</div>
                        </div>

                        {service?.categoryName && (
                            <>
                                <div className={checkoutDividerClass} />
                                <div className="pt-3">
                                    <div className={`${checkoutRowLabelClass} mb-1`}>Categoría</div>
                                    <div className={checkoutRowValueClass}>{service.categoryName}</div>
                                </div>
                            </>
                        )}
                        {!service?.categoryName && <div className={checkoutDividerClass} />}

                        <div className={`${checkoutDividerClass} my-3`} />

                        <div>
                            {(() => {
                                const priceInfo = formatPriceDisplay(finalTotal);
                                return (
                                    <>
                                        <div className="flex items-center justify-between pb-3">
                                            <span className="text-base font-semibold leading-5 text-[#1c1c1c]">Precio total</span>
                                            <span className="text-base font-semibold leading-5 text-[#1c1c1c]">
                                                {priceInfo.wasConverted ? `≈ ${priceInfo.converted}` : priceInfo.display}
                                            </span>
                                        </div>

                                        {priceInfo.wasConverted && (
                                            <p className="pb-2 text-right text-xs leading-4 text-[#6a6a6a]">
                                                ({priceInfo.sourceFormatted} — cargo final)
                                            </p>
                                        )}

                                        {showPriceDetails && (
                                            <div className="mt-2 space-y-2 pb-1">
                                                {priceInfo.wasConverted && (
                                                    <div className="flex justify-between text-xs leading-4 text-[#6a6a6a]">
                                                        <span>Cargo real ({sourceCurrency})</span>
                                                        <span>{priceInfo.sourceFormatted}</span>
                                                    </div>
                                                )}
                                                <p className="text-xs leading-4 text-[#6a6a6a]">
                                                    Impuestos incluidos. El IVA aplicable se calcula según tu país en el pago.
                                                </p>
                                            </div>
                                        )}
                                    </>
                                );
                            })()}

                            <button
                                type="button"
                                onClick={() => setShowPriceDetails(!showPriceDetails)}
                                className={`text-sm font-semibold text-[#1c1c1c] ${HP_LINK_UNDERLINE_CLASS}`}
                            >
                                {showPriceDetails ? 'Ocultar' : 'Detalles'}
                            </button>

                            <CheckoutLegalNotices
                                sourceCurrency={sourceCurrency}
                                collapsible
                                defaultOpen={false}
                            />
                        </div>
                    </div>
                    </div>
                </div>

                {(() => {
                    const priceInfo = formatPriceDisplay(finalTotal);
                    return (
                        <MobileReserveFooter
                            price={priceInfo.wasConverted ? `≈ ${priceInfo.converted}` : priceInfo.display}
                            priceSuffix="total"
                            priceAriaLabel={`Precio total ${priceInfo.display}`}
                        >
                            <button
                                onClick={handlePayment}
                                disabled={
                                    !expertCanReceivePayments ||
                                    isSubmitting ||
                                    createSearchWithHire.isPending
                                }
                                type="button"
                                aria-busy={isSubmitting || createSearchWithHire.isPending}
                                className={SD_MOBILE_FOOTER_CTA_CLASS}
                            >
                                {isSubmitting || createSearchWithHire.isPending ? 'Procesando...' : 'Reservar'}
                            </button>
                        </MobileReserveFooter>
                    );
                })()}
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

