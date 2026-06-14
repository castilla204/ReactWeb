import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
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
import { CheckoutSummaryTable } from '../components/checkout/CheckoutSummaryTable';
import { CheckoutPaymentAside } from '../components/checkout/CheckoutPaymentAside';
import { CheckoutMobileSheet } from '../components/checkout/CheckoutMobileSheet';
import { CheckoutMobileStickyFooter } from '../components/checkout/CheckoutMobileStickyFooter';
import { CheckoutLegalNotices } from '../components/checkout/CheckoutLegalNotices';
import { normalizeDeliverableTypes } from '../components/serviceDetail/ServiceDetailDeliverablesGuide';
import { readServiceReturnPath } from '../utils/servicePageNavigation';
import { resolveCheckoutLocation, persistHireSearchLocation } from '../utils/hireSearchContext';
import { resolveExpertWorkRadiusKm } from '../utils/workRadius';
// Verificación de móvil/SMS: NO se exige al cliente para contratar (solo a expertos).
import { getCountryName } from '../utils/countries';
import {
    HP_FONT,
    SD_CHECKOUT_MOBILE_CTA_CLASS,
    SD_CHECKOUT_MOBILE_SCROLL_PAD_CLASS,
    SD_CHECKOUT_MOBILE_TITLE_CLASS,
    SD_CHECKOUT_MOBILE_HEADER_CLASS,
    SD_CHECKOUT_MOBILE_HEADER_ROW_CLASS,
    SD_CHECKOUT_MOBILE_BACK_BTN_CLASS,
    SD_CHECKOUT_GRID_CLASS,
    SD_CHECKOUT_INNER_MAX_CLASS,
    HP_LINK_UNDERLINE_CLASS,
    hpCheckoutTitleUnderlineStyle,
} from '../constants/homepageTypography';

interface CheckoutPageProps {}

export function CheckoutPage({}: CheckoutPageProps) {
    const { serviceId } = useParams<{ serviceId: string }>();
    const navigate = useNavigate();
    const routerLocation = useLocation();
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
                                    workRadiusKm: expert.WorkRadiusKm ?? expert.workRadiusKm,
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
            const hireSearchLocation = resolveCheckoutLocation(routerLocation.state, {
                city: service.expert?.city,
                country: service.expert?.country,
                countryName: service.expert?.country ? getCountryName(service.expert.country) : null,
                latitude: service.expert?.latitude,
                longitude: service.expert?.longitude,
            });
            if (hireSearchLocation) persistHireSearchLocation(hireSearchLocation);

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
                latitude: hireSearchLocation?.latitude ?? service.expert?.latitude?.toString() ?? null,
                longitude: hireSearchLocation?.longitude ?? service.expert?.longitude?.toString() ?? null,
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
                locationName:
                    hireSearchLocation?.locationName ??
                    service.expert?.city ??
                    service.expert?.country ??
                    'España',
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
    const finalExpertName = service.expert?.user?.name || 'Experto';
    const finalServiceTypeName = service.serviceTypeName || 'Servicio';
    const expertStripeStatus = service.expert?.stripeStatus;
    const allowedStripeStatuses = ['Approved', 'PendingVerification'];
    const expertCanReceivePayments =
        !expertStripeStatus || allowedStripeStatuses.includes(expertStripeStatus);
    const desktopPriceInfo = formatPriceDisplay(finalTotal);
    const hireSearchLocation = resolveCheckoutLocation(routerLocation.state, {
        city: service.expert?.city,
        country: service.expert?.country,
        countryName: service.expert?.country ? getCountryName(service.expert.country) : null,
        latitude: service.expert?.latitude,
        longitude: service.expert?.longitude,
    });
    const checkoutLocationLabel = hireSearchLocation?.locationName ?? null;
    const expertWorkRadiusKm = resolveExpertWorkRadiusKm(service);
    const timezoneLabel = formatTimezoneFriendly(service.expert?.timezone) || null;
    const isProcessing = isSubmitting || createSearchWithHire.isPending;

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
            <div className="checkout-page hidden min-h-screen bg-[#fafafa] lg:block">
                <HomepageDesktopTopBar
                    variant="checkout"
                    onBack={handleBack}
                    pageTitle="Confirmar y pagar"
                />
                <div className={`${SD_CHECKOUT_INNER_MAX_CLASS} pb-12 pt-8`}>
                    <div className={SD_CHECKOUT_GRID_CLASS}>
                        <main className="min-w-0 space-y-5">
                            <CheckoutSummaryTable
                                serviceName={finalServiceTypeName}
                                expertName={finalExpertName}
                                durationLabel={serviceDuration}
                                categoryName={service?.categoryName}
                                locationLabel={checkoutLocationLabel}
                                locationRangeKm={expertWorkRadiusKm}
                                deliverables={finalDeliverableTypes}
                                includePrice={false}
                            />
                            <button
                                type="button"
                                onClick={handleBack}
                                className={`text-sm font-medium text-brand ${HP_LINK_UNDERLINE_CLASS}`}
                            >
                                Ver ficha del servicio
                            </button>
                        </main>

                        <CheckoutPaymentAside
                            priceDisplay={
                                desktopPriceInfo.wasConverted ? (
                                    <>
                                        <span className="mr-0.5 text-base font-medium text-brand">≈</span>
                                        {desktopPriceInfo.converted}
                                    </>
                                ) : (
                                    desktopPriceInfo.display
                                )
                            }
                            priceSubline={
                                desktopPriceInfo.wasConverted ? (
                                    <>
                                        {desktopPriceInfo.sourceFormatted} · cargo en {sourceCurrency}
                                    </>
                                ) : undefined
                            }
                            showPriceDetails={showPriceDetails}
                            onTogglePriceDetails={() => setShowPriceDetails(!showPriceDetails)}
                            timezoneLabel={timezoneLabel}
                            canPay={expertCanReceivePayments}
                            isProcessing={isProcessing}
                            onPay={handlePayment}
                            legalNotices={
                                <CheckoutLegalNotices
                                    sourceCurrency={sourceCurrency}
                                    collapsible
                                    defaultOpen={false}
                                    variant="plain"
                                />
                            }
                        />
                    </div>
                </div>
            </div>

            {/* Versión Móvil */}
            <div className="checkout-page min-h-screen bg-white lg:hidden">
                <div className={SD_CHECKOUT_MOBILE_SCROLL_PAD_CLASS}>
                    <header className={SD_CHECKOUT_MOBILE_HEADER_CLASS}>
                        <div className={SD_CHECKOUT_MOBILE_HEADER_ROW_CLASS}>
                            <button
                                type="button"
                                onClick={handleBack}
                                className={SD_CHECKOUT_MOBILE_BACK_BTN_CLASS}
                                aria-label="Volver"
                            >
                                <ArrowLeft className="h-5 w-5" aria-hidden />
                            </button>
                            <h1 className="min-w-0 flex-1">
                                <span className={SD_CHECKOUT_MOBILE_TITLE_CLASS}>
                                    Confirmar y pagar
                                    <span
                                        aria-hidden
                                        className="checkout-mobile-title-underline"
                                        style={hpCheckoutTitleUnderlineStyle}
                                    />
                                </span>
                            </h1>
                        </div>
                    </header>

                    {(() => {
                        const priceInfo = formatPriceDisplay(finalTotal);
                        return (
                            <CheckoutMobileSheet
                                serviceName={finalServiceTypeName}
                                durationLabel={serviceDuration}
                                categoryName={service?.categoryName}
                                locationLabel={checkoutLocationLabel}
                                locationRangeKm={expertWorkRadiusKm}
                                timezoneLabel={timezoneLabel}
                                deliverables={finalDeliverableTypes}
                                priceDisplay={
                                    priceInfo.wasConverted ? (
                                        <>
                                            <span className="mr-0.5 text-sm font-medium text-brand">≈</span>
                                            {priceInfo.converted}
                                        </>
                                    ) : (
                                        priceInfo.display
                                    )
                                }
                                priceSubline={
                                    priceInfo.wasConverted
                                        ? `${priceInfo.sourceFormatted} · cargo en ${sourceCurrency}`
                                        : undefined
                                }
                                showPriceDetails={showPriceDetails}
                                onTogglePriceDetails={() => setShowPriceDetails(!showPriceDetails)}
                            />
                        );
                    })()}
                </div>

                <CheckoutMobileStickyFooter>
                    <button
                        onClick={handlePayment}
                        disabled={!expertCanReceivePayments || isProcessing}
                        type="button"
                        aria-busy={isProcessing}
                        className={SD_CHECKOUT_MOBILE_CTA_CLASS}
                    >
                        {isProcessing ? 'Procesando...' : 'Reservar'}
                    </button>
                </CheckoutMobileStickyFooter>
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

