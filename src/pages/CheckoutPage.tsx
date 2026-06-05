import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Globe, Star, ShieldCheck, Clock, RefreshCw, ChevronDown } from 'lucide-react';
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
    HP_TITLE_UNDERLINE_GRADIENT,
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
                    {/* Lead area: brand eyebrow + supporting paragraph */}
                    <div className="mb-7 lg:mb-8">
                        <p
                            className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand"
                            style={{ fontFamily: HP_FONT }}
                        >
                            Paso final · Reserva segura
                        </p>
                        <p
                            className="mt-2 max-w-[640px] text-[15px] leading-relaxed text-[#3a3a3a]"
                            style={{ fontFamily: HP_FONT }}
                        >
                            Revisa tu reserva y continúa al pago seguro con Stripe. El importe queda retenido en custodia
                            hasta que apruebes el informe del experto.
                        </p>

                        {/* Quiet trust strip */}
                        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-[#6a6a6a]">
                            <span className="inline-flex items-center gap-1.5">
                                <ShieldCheck className="h-4 w-4 shrink-0 text-brand" aria-hidden />
                                Pago seguro con Stripe
                            </span>
                            <span aria-hidden className="hidden h-3.5 w-px bg-[#e0e0e0] sm:inline-block" />
                            <span className="inline-flex items-center gap-1.5">
                                <Clock className="h-4 w-4 shrink-0 text-brand" aria-hidden />
                                Importe retenido hasta tu aprobación
                            </span>
                            <span aria-hidden className="hidden h-3.5 w-px bg-[#e0e0e0] sm:inline-block" />
                            <span className="inline-flex items-center gap-1.5">
                                <RefreshCw className="h-4 w-4 shrink-0 text-brand" aria-hidden />
                                Cancelación gratuita antes de la revisión
                            </span>
                        </div>
                    </div>

                    <div className={SD_CHECKOUT_GRID_CLASS}>
                        <main className="min-w-0">
                            <div className="overflow-hidden rounded-2xl border border-[#ececec] bg-white shadow-[0_2px_18px_rgba(15,23,42,0.05)]">
                                {/* Signature ornament: brand gradient hairline at the top */}
                                <div
                                    aria-hidden
                                    className="h-1 w-full"
                                    style={{ background: HP_TITLE_UNDERLINE_GRADIENT }}
                                />

                                <div className="p-7 lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-10">
                                    <div className="min-w-0 space-y-7 lg:space-y-8">
                                        <section aria-labelledby="checkout-booking-heading">
                                            <h2
                                                id="checkout-booking-heading"
                                                className="flex items-center font-display text-[18px] font-semibold tracking-[-0.015em] text-[#1c1c1c]"
                                                style={{ fontFamily: HP_FONT }}
                                            >
                                                <span
                                                    aria-hidden
                                                    className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-brand align-middle"
                                                />
                                                Tu reserva
                                            </h2>
                                            <p className="mt-1.5 leading-snug">
                                                <span
                                                    className="font-display text-[15px] font-medium text-[#1c1c1c]"
                                                    style={{ fontFamily: HP_FONT }}
                                                >
                                                    {finalServiceTypeName}
                                                </span>
                                                <span className="text-[14px] text-[#6a6a6a]"> · por {finalExpertName}</span>
                                            </p>
                                            <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-[minmax(0,9rem)_1fr]">
                                                <dt className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6a6a6a]">
                                                    Duración
                                                </dt>
                                                <dd className="text-[15px] leading-tight text-[#1c1c1c]">{serviceDuration}</dd>
                                                {service?.categoryName ? (
                                                    <>
                                                        <dt className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6a6a6a]">
                                                            Categoría
                                                        </dt>
                                                        <dd className="text-[15px] leading-tight text-[#1c1c1c]">{service.categoryName}</dd>
                                                    </>
                                                ) : null}
                                            </dl>
                                            <button
                                                type="button"
                                                onClick={handleBack}
                                                className={`mt-4 text-sm font-semibold text-brand ${HP_LINK_UNDERLINE_CLASS}`}
                                            >
                                                Ver ficha del servicio
                                            </button>
                                        </section>

                                        {finalDeliverableTypes.length > 0 ? (
                                            <section
                                                className="pt-7 lg:pt-0"
                                                aria-label="Qué incluye este servicio"
                                            >
                                                <ServiceDetailDeliverablesGuide
                                                    items={finalDeliverableTypes}
                                                    variant="inline"
                                                />
                                            </section>
                                        ) : null}

                                        {hasExpertCoords ? (
                                            <section
                                                className="pt-7"
                                                aria-labelledby="checkout-coverage-heading"
                                            >
                                                <h2
                                                    id="checkout-coverage-heading"
                                                    className="mb-3 flex items-center font-display text-[18px] font-semibold tracking-[-0.015em] text-[#1c1c1c]"
                                                    style={{ fontFamily: HP_FONT }}
                                                >
                                                    <span
                                                        aria-hidden
                                                        className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-brand align-middle"
                                                    />
                                                    Zona de cobertura
                                                </h2>
                                                <p className="mb-3 text-sm leading-relaxed text-[#3a3a3a]">
                                                    El experto se desplaza dentro de un radio de{' '}
                                                    <span className="font-semibold tabular-nums text-[#1c1c1c]">{expertRangeKm} km</span>.
                                                </p>
                                                <ServiceDetailCoverageMap
                                                    latitude={expertLat}
                                                    longitude={expertLng}
                                                    rangeKm={expertRangeKm}
                                                    variant="preview"
                                                    expandable
                                                    className="h-[200px] w-full rounded-xl border border-[#ececec]"
                                                />
                                            </section>
                                        ) : null}
                                    </div>

                                    <section
                                        className="pt-7 lg:border-l lg:border-[#f0f0f0] lg:pl-10 lg:pt-0"
                                        aria-labelledby="checkout-steps-heading"
                                    >
                                        <h2
                                            id="checkout-steps-heading"
                                            className="flex items-center font-display text-[18px] font-semibold tracking-[-0.015em] text-[#1c1c1c]"
                                            style={{ fontFamily: HP_FONT }}
                                        >
                                            <span
                                                aria-hidden
                                                className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-brand align-middle"
                                            />
                                            Qué ocurre al reservar
                                        </h2>
                                        <ol className="mt-4 space-y-3 text-sm leading-relaxed text-[#3a3a3a]">
                                            <li className="flex gap-3">
                                                <span
                                                    aria-hidden
                                                    className="mt-[1px] flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/[0.08] text-[12px] font-semibold tabular-nums text-brand ring-1 ring-brand/15"
                                                >
                                                    1
                                                </span>
                                                <span>Autorizas el pago en Stripe de forma segura.</span>
                                            </li>
                                            <li className="flex gap-3">
                                                <span
                                                    aria-hidden
                                                    className="mt-[1px] flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/[0.08] text-[12px] font-semibold tabular-nums text-brand ring-1 ring-brand/15"
                                                >
                                                    2
                                                </span>
                                                <span>
                                                    El importe queda retenido hasta que apruebes el informe.
                                                </span>
                                            </li>
                                            <li className="flex gap-3">
                                                <span
                                                    aria-hidden
                                                    className="mt-[1px] flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/[0.08] text-[12px] font-semibold tabular-nums text-brand ring-1 ring-brand/15"
                                                >
                                                    3
                                                </span>
                                                <span>
                                                    Coordinas fecha y lugar con el experto por chat (mín. 24&nbsp;h).
                                                </span>
                                            </li>
                                        </ol>
                                    </section>
                                </div>
                            </div>
                        </main>

                        <aside className="lg:sticky lg:top-14 lg:self-start">
                            <article className="sd-aside-card flex max-h-[calc(100dvh-4.5rem)] flex-col overflow-hidden">
                                <div className="min-h-0 flex-1 overflow-y-auto p-5">
                                    <div className="mb-5 flex gap-4">
                                        {finalImages[0] ? (
                                            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl ring-1 ring-[#ececec]">
                                                <img
                                                    src={finalImages[0]}
                                                    alt={finalServiceTypeName}
                                                    className="h-full w-full object-cover"
                                                />
                                            </div>
                                        ) : null}
                                        <div className="min-w-0 flex-1">
                                            <h2
                                                className="font-display text-[19px] font-semibold leading-tight tracking-[-0.02em] text-[#1c1c1c]"
                                                style={{ fontFamily: HP_FONT }}
                                            >
                                                {finalServiceTypeName}
                                            </h2>
                                            <p className="mt-1 text-[13px] text-[#6a6a6a]">por {finalExpertName}</p>
                                            {showRating ? (
                                                <div className="mt-2 flex items-center gap-1 text-[13px] text-[#6a6a6a]">
                                                    <Star
                                                        className="h-3.5 w-3.5 fill-brand text-brand"
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

                                    {/* Price block — hero of the sidebar */}
                                    <section className="rounded-xl bg-gradient-to-br from-[#f7fafd] to-[#fafafa] px-4 py-4 ring-1 ring-[#eef2f7]">
                                        <p
                                            className="text-xs font-semibold uppercase tracking-[0.08em] text-[#6a6a6a]"
                                            style={{ fontFamily: HP_FONT }}
                                        >
                                            Total · impuestos incluidos
                                        </p>
                                        <p
                                            className="mt-1.5 font-display text-[36px] font-semibold leading-none tracking-tight tabular-nums text-[#1c1c1c]"
                                            style={{ fontFamily: HP_FONT }}
                                        >
                                            {desktopPriceInfo.wasConverted ? (
                                                <>
                                                    <span className="mr-1 text-[28px] font-semibold text-brand">≈</span>
                                                    {desktopPriceInfo.converted}
                                                </>
                                            ) : (
                                                desktopPriceInfo.display
                                            )}
                                        </p>
                                        {desktopPriceInfo.wasConverted ? (
                                            <p className="mt-2 text-xs text-[#6a6a6a]">
                                                ({desktopPriceInfo.sourceFormatted} — cargo final en {sourceCurrency})
                                            </p>
                                        ) : null}
                                        {showPriceDetails ? (
                                            <p className="mt-3 text-xs leading-relaxed text-[#6a6a6a]">
                                                El IVA aplicable se calcula según tu país de facturación en Stripe.
                                            </p>
                                        ) : null}
                                        <button
                                            type="button"
                                            onClick={() => setShowPriceDetails(!showPriceDetails)}
                                            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#1c1c1c] transition-colors hover:text-brand"
                                            aria-expanded={showPriceDetails}
                                        >
                                            <ChevronDown
                                                aria-hidden
                                                className={`h-3.5 w-3.5 transition-transform ${showPriceDetails ? 'rotate-180' : ''}`}
                                            />
                                            <span>{showPriceDetails ? 'Ocultar detalles' : 'Detalles de precio'}</span>
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

                                <footer className="shrink-0 space-y-2 border-t border-[#ececec] bg-white p-5 pt-4">
                                    {!expertCanReceivePayments ? (
                                        <p className="text-xs leading-relaxed text-amber-800">
                                            Este experto no puede recibir nuevas contrataciones en este momento.
                                        </p>
                                    ) : null}
                                    <p
                                        className="mt-1 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-[#737373]"
                                        style={{ fontFamily: HP_FONT }}
                                    >
                                        Reserva con confianza
                                    </p>
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
                        className={`${SD_MOBILE_GUTTER_CLASS} pb-5 pt-[calc(env(safe-area-inset-top,0px)+1.75rem)]`}
                    >
                        <div className="flex items-start gap-3">
                            <button
                                type="button"
                                onClick={handleBack}
                                className="sd-icon-btn mt-1 shrink-0"
                                aria-label="Volver"
                            >
                                <ArrowLeft className="h-5 w-5" aria-hidden />
                            </button>
                            <div className="min-w-0 flex-1">
                                <h1 className="sd-page-title relative inline-block text-[22px] leading-[26px] min-[390px]:text-[24px] min-[390px]:leading-[28px]">
                                    Confirmar y pagar
                                    <span aria-hidden style={hpTitleUnderlineBarStyle} />
                                </h1>
                                <p
                                    className="mt-2 text-[13px] leading-relaxed tracking-[-0.005em] text-[#6a6a6a] min-[390px]:text-[13.5px]"
                                    style={{ fontFamily: HP_FONT }}
                                >
                                    Revisa tu reserva y continúa al pago seguro con Stripe.
                                </p>
                            </div>
                        </div>
                    </header>

                    <div className={`${SD_MOBILE_GUTTER_CLASS} pb-4`}>
                    <div className={checkoutCardClass}>
                        {/* Single distinctive accent: brand-colored vertical stripe along the card body */}
                        <div className="relative">
                            <span
                                aria-hidden
                                className="absolute inset-y-5 left-0 w-[3px] rounded-r-full bg-gradient-to-b from-brand via-brand to-[#004a99] opacity-90"
                            />

                            <div className="space-y-5 p-5 pl-6 min-[390px]:space-y-6 min-[390px]:p-6 min-[390px]:pl-7">
                                {/* Service identity */}
                                <section aria-labelledby="checkout-mobile-service-heading">
                                    <div className="flex items-start gap-4 min-[390px]:gap-5">
                                        {finalImages[0] && (
                                            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl ring-1 ring-[#e8e8e8] min-[390px]:h-28 min-[390px]:w-28">
                                                <img
                                                    src={finalImages[0]}
                                                    alt={finalServiceTypeName}
                                                    className="h-full w-full object-cover"
                                                />
                                            </div>
                                        )}
                                        <div className="flex min-w-0 flex-1 flex-col justify-center">
                                            <h2
                                                id="checkout-mobile-service-heading"
                                                className="font-display text-[18px] font-semibold leading-[1.2] tracking-[-0.015em] text-[#1c1c1c] min-[390px]:text-[19px]"
                                                style={{ fontFamily: HP_FONT }}
                                            >
                                                {finalServiceTypeName}
                                            </h2>
                                            <p className="mt-1 text-[13px] leading-snug text-[#6a6a6a]">
                                                por <span className="font-medium text-[#1c1c1c]">{finalExpertName}</span>
                                            </p>
                                            {showRating ? (
                                                <div className="mt-2 flex min-w-0 items-center gap-1.5 text-[13px] text-[#6a6a6a]">
                                                    <Star
                                                        className="h-3.5 w-3.5 shrink-0 fill-brand text-brand"
                                                        aria-hidden
                                                    />
                                                    <span className="font-semibold tabular-nums text-[#1c1c1c]">
                                                        {finalRating.toFixed(1).replace('.', ',')}
                                                    </span>
                                                    <span className="text-[#d4d4d4]" aria-hidden>·</span>
                                                    <span className="truncate">
                                                        {reviewCount} evaluación{reviewCount !== 1 ? 'es' : ''}
                                                    </span>
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                </section>

                                {/* Booking facts — clean dl, no horizontal rules between rows */}
                                <section aria-label="Detalles de la reserva">
                                    <dl className="grid grid-cols-[88px_1fr] gap-x-3 gap-y-3 min-[390px]:grid-cols-[100px_1fr]">
                                        <dt className="text-[11px] font-semibold uppercase leading-[18px] tracking-[0.08em] text-[#6a6a6a]">
                                            Duración
                                        </dt>
                                        <dd className="text-[15px] leading-tight tabular-nums text-[#1c1c1c]">
                                            {serviceDuration}
                                        </dd>
                                        {service?.categoryName ? (
                                            <>
                                                <dt className="text-[11px] font-semibold uppercase leading-[18px] tracking-[0.08em] text-[#6a6a6a]">
                                                    Categoría
                                                </dt>
                                                <dd className="text-[15px] leading-tight text-[#1c1c1c]">
                                                    {service.categoryName}
                                                </dd>
                                            </>
                                        ) : null}
                                    </dl>
                                </section>

                                {/* Qué incluye — el componente inline ya renderiza su propio eyebrow "Incluye" */}
                                {finalDeliverableTypes.length > 0 ? (
                                    <section aria-label="Qué incluye este servicio">
                                        <ServiceDetailDeliverablesGuide
                                            items={finalDeliverableTypes}
                                            variant="inline"
                                        />
                                    </section>
                                ) : null}

                                {/* Zona de cobertura — only when expert coords exist */}
                                {hasExpertCoords ? (
                                    <section aria-labelledby="checkout-mobile-coverage-heading">
                                        <h3
                                            id="checkout-mobile-coverage-heading"
                                            className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6a6a6a]"
                                        >
                                            Zona de cobertura
                                        </h3>
                                        <p className="mb-2.5 text-[12.5px] leading-relaxed text-[#6a6a6a]">
                                            El experto se desplaza dentro de un radio de{' '}
                                            <span className="font-semibold tabular-nums text-[#1c1c1c]">{expertRangeKm} km</span>.
                                        </p>
                                        <ServiceDetailCoverageMap
                                            latitude={expertLat}
                                            longitude={expertLng}
                                            rangeKm={expertRangeKm}
                                            variant="preview"
                                            expandable
                                            className="h-[150px] w-full rounded-xl border border-[#e8e8e8]"
                                        />
                                    </section>
                                ) : null}

                                {/* Qué ocurre al reservar — numbered roadmap (replaces CheckoutReserveHint wall) */}
                                <section aria-labelledby="checkout-mobile-steps-heading">
                                    <h3
                                        id="checkout-mobile-steps-heading"
                                        className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6a6a6a]"
                                    >
                                        Qué ocurre al reservar
                                    </h3>
                                    <ol className="space-y-3 text-[13.5px] leading-relaxed text-[#6a6a6a]">
                                        <li className="flex gap-3">
                                            <span
                                                aria-hidden
                                                className="mt-[1px] inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand/10 text-[11px] font-semibold tabular-nums text-brand"
                                            >
                                                1
                                            </span>
                                            <span>
                                                <span className="font-semibold text-[#1c1c1c]">Pago seguro con Stripe.</span>{' '}
                                                El importe queda retenido hasta que apruebes el informe.
                                            </span>
                                        </li>
                                        <li className="flex gap-3">
                                            <span
                                                aria-hidden
                                                className="mt-[1px] inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand/10 text-[11px] font-semibold tabular-nums text-brand"
                                            >
                                                2
                                            </span>
                                            <span>
                                                <span className="font-semibold text-[#1c1c1c]">Coordinas por chat</span>{' '}
                                                fecha, hora y lugar (mín. 24&nbsp;h de antelación).
                                            </span>
                                        </li>
                                        <li className="flex gap-3">
                                            <span
                                                aria-hidden
                                                className="mt-[1px] inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand/10 text-[11px] font-semibold tabular-nums text-brand"
                                            >
                                                3
                                            </span>
                                            <span>
                                                <span className="font-semibold text-[#1c1c1c]">Recibes informe, fotos y vídeo.</span>{' '}
                                                Si cancelas antes de la revisión, reembolso completo.
                                            </span>
                                        </li>
                                    </ol>
                                </section>
                            </div>

                            {/* Price block — single structural divider above anchors the CTA region */}
                            <div className="border-t border-[#e8e8e8] px-5 pb-5 pt-5 min-[390px]:px-6 min-[390px]:pb-6 min-[390px]:pt-6">
                                {(() => {
                                    const priceInfo = formatPriceDisplay(finalTotal);
                                    return (
                                        <>
                                            <p
                                                className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6a6a6a]"
                                                style={{ fontFamily: HP_FONT }}
                                            >
                                                Total
                                            </p>
                                            <p
                                                className="mt-1 text-[28px] font-semibold leading-none tracking-tight tabular-nums text-[#1c1c1c] min-[390px]:text-[32px]"
                                                style={{ fontFamily: HP_FONT }}
                                            >
                                                {priceInfo.wasConverted ? `≈ ${priceInfo.converted}` : priceInfo.display}
                                            </p>
                                            <p className="mt-1.5 text-xs leading-snug text-[#6a6a6a]">
                                                Impuestos incluidos
                                            </p>
                                            {priceInfo.wasConverted && (
                                                <p className="mt-1 text-[11.5px] leading-snug text-[#6a6a6a]">
                                                    {priceInfo.sourceFormatted} — cargo final en {sourceCurrency}
                                                </p>
                                            )}

                                            <button
                                                type="button"
                                                onClick={() => setShowPriceDetails(!showPriceDetails)}
                                                aria-expanded={showPriceDetails}
                                                className="mt-4 inline-flex items-center gap-1 rounded-sm text-[13px] font-semibold text-[#1c1c1c] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                                            >
                                                <span>{showPriceDetails ? 'Ocultar detalles de precio' : 'Detalles de precio'}</span>
                                                <span
                                                    aria-hidden
                                                    className={`text-[10px] text-[#6a6a6a] transition-transform ${showPriceDetails ? 'rotate-180' : ''}`}
                                                >
                                                    ▾
                                                </span>
                                            </button>

                                            {showPriceDetails && (
                                                <div className="mt-2 space-y-2 rounded-lg bg-[#fafafa] p-3">
                                                    {priceInfo.wasConverted && (
                                                        <div className="flex justify-between text-[12.5px] leading-snug text-[#6a6a6a]">
                                                            <span>Cargo real ({sourceCurrency})</span>
                                                            <span className="tabular-nums text-[#1c1c1c]">{priceInfo.sourceFormatted}</span>
                                                        </div>
                                                    )}
                                                    <p className="text-[12.5px] leading-relaxed text-[#6a6a6a]">
                                                        El IVA aplicable se calcula según tu país de facturación en Stripe.
                                                    </p>
                                                </div>
                                            )}

                                            <CheckoutLegalNotices
                                                sourceCurrency={sourceCurrency}
                                                collapsible
                                                defaultOpen={priceInfo.wasConverted}
                                            />
                                        </>
                                    );
                                })()}
                            </div>
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

