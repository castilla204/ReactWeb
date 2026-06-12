import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Globe, ChevronDown, Shield } from 'lucide-react';
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
  ESCROW_CHECKOUT_INTRO,
  ESCROW_CHECKOUT_STEPS,
  ESCROW_TRUST_TAGLINE,
} from '../constants/escrowCopy';
import {
    ServiceDetailDeliverablesGuide,
    normalizeDeliverableTypes,
} from '../components/serviceDetail/ServiceDetailDeliverablesGuide';
import { ServiceDetailCoverageMap } from '../components/serviceDetail/ServiceDetailCoverageMap';
import { readServiceReturnPath } from '../utils/servicePageNavigation';
import { readWorkRadiusKm } from '../utils/workRadius';
import {
    HP_FONT,
    HP_LINK_UNDERLINE_CLASS,
    SD_MOBILE_FOOTER_CTA_CLASS,
    SD_MOBILE_GUTTER_CLASS,
    SD_MOBILE_SCROLL_PAD_TRUST_CLASS,
    SD_CHECKOUT_GRID_CLASS,
    SD_CHECKOUT_INNER_MAX_CLASS,
    SD_DESKTOP_ASIDE_MAX_H_CLASS,
    SD_DESKTOP_STICKY_TOP_CLASS,
} from '../constants/homepageTypography';
import erizoImg from '../media/erizo.png';

interface CheckoutPageProps {}

const checkoutRowLabelClass = 'text-sm font-semibold leading-[18px] text-[#1c1c1c]';
const checkoutRowValueClass = 'text-sm leading-snug text-[#6a6a6a]';
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
    // Rango de trabajo elegido por el experto: 0 = solo en su taller (válido); si el
    // campo no viene (cache antigua), fallback al legacy locationRange / 25 km.
    const expertWorkRadius = readWorkRadiusKm(service.expert);
    const expertRangeKm = expertWorkRadius !== null
        ? expertWorkRadius
        : Math.max(5, Number(service.expert?.locationRange) || 25);

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
                <div className={`${SD_CHECKOUT_INNER_MAX_CLASS} pb-10 pt-3`}>
                    <p className="mb-4 text-sm text-[#6a6a6a]">{ESCROW_CHECKOUT_INTRO}</p>

                    <div className={SD_CHECKOUT_GRID_CLASS}>
                        <main className="min-w-0">
                            <div className="divide-y divide-[#ebebeb] rounded-xl border border-[#e8e8e8] bg-white p-5">
                                <section aria-labelledby="checkout-booking-heading" className="pb-4">
                                    <h2 id="checkout-booking-heading" className="text-xs font-medium text-[#6a6a6a]">
                                        Tu reserva
                                    </h2>
                                    <p className="mt-1.5 text-sm text-[#1c1c1c]">
                                        <span className="font-medium">{finalServiceTypeName}</span>
                                        <span className="text-[#6a6a6a]"> · {finalExpertName}</span>
                                    </p>
                                    <p className="mt-2 text-xs text-[#6a6a6a]">
                                        {serviceDuration}
                                        {service?.categoryName ? ` · ${service.categoryName}` : ''}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={handleBack}
                                        className={`mt-2 text-xs font-medium text-brand ${HP_LINK_UNDERLINE_CLASS}`}
                                    >
                                        Ver ficha del servicio
                                    </button>
                                </section>

                                {finalDeliverableTypes.length > 0 ? (
                                    <section
                                        className="py-4 [&_.sd-section-label]:mb-2 [&_.sd-section-label]:text-xs [&_.sd-section-label]:font-medium [&_.sd-section-label]:text-[#6a6a6a]"
                                        aria-label="Qué incluye este servicio"
                                    >
                                        <ServiceDetailDeliverablesGuide
                                            items={finalDeliverableTypes}
                                            variant="inline"
                                            showHeading
                                        />
                                    </section>
                                ) : null}

                                <section className="py-4" aria-labelledby="checkout-steps-heading">
                                    <h2 id="checkout-steps-heading" className="text-xs font-medium text-[#6a6a6a]">
                                        Al reservar
                                    </h2>
                                    <ol className="mt-2 space-y-1.5 text-xs leading-relaxed text-[#6a6a6a]">
                                        {ESCROW_CHECKOUT_STEPS.map((text, index) => (
                                            <li key={text} className="flex gap-2">
                                                <span className="shrink-0 font-medium tabular-nums text-[#1c1c1c]">
                                                    {index + 1}.
                                                </span>
                                                <span>{text}</span>
                                            </li>
                                        ))}
                                    </ol>
                                </section>

                                {hasExpertCoords ? (
                                    <section className="pt-4" aria-labelledby="checkout-coverage-heading">
                                        <h2 id="checkout-coverage-heading" className="text-xs font-medium text-[#6a6a6a]">
                                            Cobertura · {expertRangeKm === 0 ? 'Solo en su taller' : `${expertRangeKm} km`}
                                        </h2>
                                        <ServiceDetailCoverageMap
                                            latitude={expertLat}
                                            longitude={expertLng}
                                            rangeKm={expertRangeKm}
                                            variant="preview"
                                            expandable
                                            className="mt-2 h-36 w-full rounded-lg border border-[#e8e8e8]"
                                        />
                                    </section>
                                ) : null}
                            </div>
                        </main>

                        <aside className={`lg:sticky lg:self-start ${SD_DESKTOP_STICKY_TOP_CLASS}`}>
                            <article
                                className={`flex flex-col overflow-hidden rounded-xl border border-[#e8e8e8] bg-white p-5 shadow-sm ${SD_DESKTOP_ASIDE_MAX_H_CLASS}`}
                            >
                                <div className="flex gap-3">
                                    {finalImages[0] ? (
                                        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg ring-1 ring-[#ececec]">
                                            <img
                                                src={finalImages[0]}
                                                alt={finalServiceTypeName}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                    ) : null}
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium text-[#1c1c1c]">
                                            {finalServiceTypeName}
                                        </p>
                                        <p className="mt-0.5 truncate text-xs text-[#6a6a6a]">{finalExpertName}</p>
                                    </div>
                                </div>

                                <div className="mt-4 border-t border-[#ebebeb] pt-4">
                                    <p className="text-xs text-[#6a6a6a]">Total · impuestos incluidos</p>
                                    <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-[#1c1c1c]">
                                        {desktopPriceInfo.wasConverted ? (
                                            <>
                                                <span className="mr-0.5 text-base font-medium text-brand">≈</span>
                                                {desktopPriceInfo.converted}
                                            </>
                                        ) : (
                                            desktopPriceInfo.display
                                        )}
                                    </p>
                                    {desktopPriceInfo.wasConverted ? (
                                        <p className="mt-1 text-[11px] text-[#6a6a6a]">
                                            {desktopPriceInfo.sourceFormatted} · cargo en {sourceCurrency}
                                        </p>
                                    ) : null}
                                    {showPriceDetails ? (
                                        <p className="mt-2 text-[11px] leading-relaxed text-[#6a6a6a]">
                                            El IVA se calcula en Stripe según tu país de facturación.
                                        </p>
                                    ) : null}
                                    <button
                                        type="button"
                                        onClick={() => setShowPriceDetails(!showPriceDetails)}
                                        className="mt-2 inline-flex items-center gap-0.5 text-[11px] font-medium text-[#6a6a6a] hover:text-[#1c1c1c]"
                                        aria-expanded={showPriceDetails}
                                    >
                                        <ChevronDown
                                            aria-hidden
                                            className={`h-3 w-3 transition-transform ${showPriceDetails ? 'rotate-180' : ''}`}
                                        />
                                        {showPriceDetails ? 'Ocultar' : 'Detalles de precio'}
                                    </button>
                                </div>

                                {(() => {
                                    const tzLabel = formatTimezoneFriendly(service.expert?.timezone);
                                    if (!tzLabel) return null;
                                    return (
                                        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-[#6a6a6a]">
                                            <Globe className="h-3 w-3 shrink-0 text-brand" aria-hidden />
                                            Horario: {tzLabel}
                                        </p>
                                    );
                                })()}

                                <footer className="mt-4 space-y-2 border-t border-[#ebebeb] pt-4">
                                    {!expertCanReceivePayments ? (
                                        <p className="text-xs text-amber-800">
                                            Este experto no puede recibir contrataciones ahora.
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
                                        className="inline-flex h-10 w-full items-center justify-center rounded-full bg-brand text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:cursor-wait disabled:opacity-75"
                                    >
                                        {isSubmitting || createSearchWithHire.isPending
                                            ? 'Procesando...'
                                            : 'Reservar'}
                                    </button>
                                    <p className="text-center text-[11px] leading-relaxed text-[#6a6a6a]">
                                        Redirección a Stripe para completar el pago.
                                    </p>
                                    <CheckoutLegalNotices
                                        sourceCurrency={sourceCurrency}
                                        collapsible
                                        defaultOpen={false}
                                    />
                                </footer>
                            </article>
                        </aside>
                    </div>
                </div>
            </div>

            {/* Versión Móvil */}
            <div className="min-h-screen bg-[#fafafa] lg:hidden">
                <div className={SD_MOBILE_SCROLL_PAD_TRUST_CLASS}>
                    <header
                        className={`${SD_MOBILE_GUTTER_CLASS} pb-4 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)]`}
                    >
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleBack}
                                className="sd-icon-btn shrink-0"
                                aria-label="Volver"
                            >
                                <ArrowLeft className="h-5 w-5" aria-hidden />
                            </button>
                            <a
                                href="/"
                                onClick={(e) => {
                                    e.preventDefault();
                                    navigate('/');
                                }}
                                className="inline-flex min-w-0 items-center gap-2"
                                aria-label="Inspecciono — inicio"
                            >
                                <img
                                    src={erizoImg}
                                    alt=""
                                    className="h-8 w-8 -scale-x-100 shrink-0 object-contain"
                                    style={{ imageRendering: '-webkit-optimize-contrast' }}
                                />
                                <span className="truncate text-sm font-semibold tracking-[-0.01em] text-[#1c1c1c]">
                                    Inspecciono
                                </span>
                            </a>
                        </div>
                        <h1 className="sr-only">Confirmar y pagar</h1>
                        <p className="mt-3 text-sm text-[#6a6a6a]">{ESCROW_CHECKOUT_INTRO}</p>
                    </header>

                    <div className={`${SD_MOBILE_GUTTER_CLASS} space-y-4 pb-4`}>
                        <div className="divide-y divide-[#ebebeb] rounded-xl border border-[#e8e8e8] bg-white p-5">
                            <section className="pb-4" aria-labelledby="checkout-mobile-service-heading">
                                <div className="flex gap-3">
                                    {finalImages[0] ? (
                                        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg ring-1 ring-[#ececec]">
                                            <img
                                                src={finalImages[0]}
                                                alt={finalServiceTypeName}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                    ) : null}
                                    <div className="min-w-0 flex-1">
                                        <h2
                                            id="checkout-mobile-service-heading"
                                            className="text-sm font-medium text-[#1c1c1c]"
                                        >
                                            {finalServiceTypeName}
                                        </h2>
                                        <p className="mt-0.5 text-xs text-[#6a6a6a]">{finalExpertName}</p>
                                        <p className="mt-2 text-xs text-[#6a6a6a]">
                                            {serviceDuration}
                                            {service?.categoryName ? ` · ${service.categoryName}` : ''}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleBack}
                                    className={`mt-3 text-xs font-medium text-brand ${HP_LINK_UNDERLINE_CLASS}`}
                                >
                                    Ver ficha del servicio
                                </button>
                            </section>

                            {finalDeliverableTypes.length > 0 ? (
                                <section
                                    className="py-4 [&_.sd-section-label]:mb-2 [&_.sd-section-label]:text-xs [&_.sd-section-label]:font-medium [&_.sd-section-label]:text-[#6a6a6a]"
                                    aria-label="Qué incluye este servicio"
                                >
                                    <ServiceDetailDeliverablesGuide
                                        items={finalDeliverableTypes}
                                        variant="inline"
                                        showHeading
                                    />
                                </section>
                            ) : null}

                            <section className="py-4" aria-labelledby="checkout-mobile-steps-heading">
                                <h2
                                    id="checkout-mobile-steps-heading"
                                    className="text-xs font-medium text-[#6a6a6a]"
                                >
                                    Al reservar
                                </h2>
                                <ol className="mt-2 space-y-1.5 text-xs leading-relaxed text-[#6a6a6a]">
                                    {ESCROW_CHECKOUT_STEPS.map((text, index) => (
                                        <li key={text} className="flex gap-2">
                                            <span className="shrink-0 font-medium tabular-nums text-[#1c1c1c]">
                                                {index + 1}.
                                            </span>
                                            <span>{text}</span>
                                        </li>
                                    ))}
                                </ol>
                            </section>

                            {hasExpertCoords ? (
                                <section className="pt-4" aria-labelledby="checkout-mobile-coverage-heading">
                                    <h2
                                        id="checkout-mobile-coverage-heading"
                                        className="text-xs font-medium text-[#6a6a6a]"
                                    >
                                        Cobertura · {expertRangeKm === 0 ? 'Solo en su taller' : `${expertRangeKm} km`}
                                    </h2>
                                    <ServiceDetailCoverageMap
                                        latitude={expertLat}
                                        longitude={expertLng}
                                        rangeKm={expertRangeKm}
                                        variant="preview"
                                        expandable
                                        className="mt-2 h-36 w-full rounded-lg border border-[#e8e8e8]"
                                    />
                                </section>
                            ) : null}
                        </div>

                        <CheckoutLegalNotices
                            sourceCurrency={sourceCurrency}
                            collapsible
                            defaultOpen={false}
                        />
                    </div>
                </div>

                {(() => {
                    const priceInfo = formatPriceDisplay(finalTotal);
                    return (
                        <MobileReserveFooter
                            price={priceInfo.wasConverted ? `≈ ${priceInfo.converted}` : priceInfo.display}
                            priceSuffix="total"
                            priceAriaLabel={`Precio total ${priceInfo.display}`}
                            trustNote={
                                <>
                                    <Shield className="h-3.5 w-3.5 shrink-0 text-brand" aria-hidden />
                                    {ESCROW_TRUST_TAGLINE}
                                </>
                            }
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

