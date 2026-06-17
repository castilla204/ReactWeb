import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useApi } from '../hooks/useApi';
import { API_CONFIG } from '../config/api';
import { showToast } from '../lib/toast';
import { Service } from '../hooks/useServices';
import { useSearch } from '../hooks/useSearch.hooks';
import { formatPriceNumber } from '../utils/priceUtils';
import { useCurrency } from '../contexts/CurrencyContext';
import { formatTimezoneFriendly } from '../utils/timezoneFormat';
import { HomepageDesktopTopBar } from '../components/HomepageDesktopTopBar';
import { CheckoutSummaryTable } from '../components/checkout/CheckoutSummaryTable';
import { CheckoutPageTitle } from '../components/checkout/CheckoutPageTitle';
import { CheckoutPaymentAside } from '../components/checkout/CheckoutPaymentAside';
import { CheckoutMobileSheet } from '../components/checkout/CheckoutMobileSheet';
import { CheckoutMobileStickyFooter } from '../components/checkout/CheckoutMobileStickyFooter';
import { CheckoutMobileStepper, type CheckoutMobileWizardStep } from '../components/checkout/CheckoutMobileStepper';
import { CheckoutLegalNotices } from '../components/checkout/CheckoutLegalNotices';
import SlotPicker, { ChosenSlot } from '../components/SlotPicker';
import CheckoutLocationPicker, { CheckoutLocationData } from '../components/CheckoutLocationPicker';
import { normalizeDeliverableTypes } from '../components/serviceDetail/ServiceDetailDeliverablesGuide';
import { readServiceReturnPath } from '../utils/servicePageNavigation';
import { resolveCheckoutLocation, persistHireSearchLocation } from '../utils/hireSearchContext';
import { resolveExpertWorkRadiusKm } from '../utils/workRadius';
// Verificación de móvil/SMS: NO se exige al cliente para contratar (solo a expertos).
import { getCountryName } from '../utils/countries';
import {
    HP_FONT,
    SD_CHECKOUT_MOBILE_CTA_CLASS,
    SD_CHECKOUT_MOBILE_BACK_TEXT_BTN_CLASS,
    SD_CHECKOUT_MOBILE_FOOTER_ACTIONS_CLASS,
    SD_CHECKOUT_MOBILE_SCROLL_PAD_CLASS,
    SD_CHECKOUT_MOBILE_HEADER_CLASS,
    SD_CHECKOUT_GRID_CLASS,
    SD_CHECKOUT_INNER_MAX_CLASS,
    SD_CHECKOUT_MOBILE_GUTTER_CLASS,
    SD_DESKTOP_STICKY_TOP_CLASS,
    SD_CHECKOUT_DESKTOP_PAGE_CLASS,
    SD_CHECKOUT_DESKTOP_CARD_CLASS,
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
    // 🗓️ Fase E: hueco de cita elegido (modelo Calendly), null hasta que el cliente elige.
    const [chosenSlot, setChosenSlot] = useState<ChosenSlot | null>(null);
    // 🗓️ Fase E: ubicación de la cita (servicios con radio); estáticos la prefijan al taller.
    const [chosenLocation, setChosenLocation] = useState<CheckoutLocationData | null>(null);
    // 📱 Móvil: wizard (1 = fecha/hora, 2 = ubicación, 3 = pago). En desktop no aplica.
    const [mobileStep, setMobileStep] = useState<CheckoutMobileWizardStep>(1);

    // 🖥️ C1 FIX: montar SOLO un árbol (desktop o móvil), no ambos. Antes `hidden lg:block` /
    // `lg:hidden` dejaban los dos en el DOM → se montaban DOS SlotPicker + DOS CheckoutLocationPicker
    // (dos mapas Mapbox, peticiones dobles) y la instancia oculta podía borrar (onChange(null)) el
    // hueco/ubicación elegido en la visible. Con matchMedia solo existe una instancia de cada picker.
    const [isDesktop, setIsDesktop] = useState<boolean>(
        () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches
    );
    useEffect(() => {
        const mq = window.matchMedia('(min-width: 1024px)');
        const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, []);

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

        // 🗓️ Fase E: si el servicio requiere cita, hay que elegir hueco ANTES de pagar.
        if (service.requiresAppointment && !chosenSlot) {
            showToast('error', 'Elige un día y una hora para la cita antes de continuar.');
            return;
        }
        // 🗓️ Fase E: y la ubicación (salvo taller estático, que va prefijada).
        if (service.requiresAppointment && !isWorkshopOnly && !chosenLocation) {
            showToast('error', 'Indica en el mapa dónde será la cita antes de continuar.');
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
                // 🗓️ Fase E: el hueco viaja al backend → metadata Stripe → webhook crea la cita confirmada.
                startsAtUtc: chosenSlot?.startUtc ?? null,
                endsAtUtc: chosenSlot?.endUtc ?? null,
                location: chosenLocation?.location ?? null,
                latitude: chosenLocation?.latitude ?? null,
                longitude: chosenLocation?.longitude ?? null,
                doorNumber: chosenLocation?.doorNumber ?? null,
                siteDetails: chosenLocation?.siteDetails ?? null,
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
                    <p className="text-sm text-[#6a6a6a]" style={{ fontFamily: HP_FONT }}>Cargando…</p>
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
    const expertPicture = service.expert?.profilePictureUrl || undefined;
    const expertRating = service.averageRating ?? 0;
    const expertReviewCount = service.reviewsCount ?? 0;
    const expertCompletedSearches = service.completedSearches ?? 0;
    const expertStripeStatus = service.expert?.stripeStatus;
    const allowedStripeStatuses = ['Approved', 'PendingVerification'];
    const expertCanReceivePayments =
        !expertStripeStatus || allowedStripeStatuses.includes(expertStripeStatus);
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

    // 🗓️ Fase E: selector de huecos (solo si el servicio requiere cita). Bloquea el pago hasta elegir.
    const requiresAppointment = !!service.requiresAppointment;
    const slotSatisfied = !requiresAppointment || !!chosenSlot;
    const slotPickerProps = {
        serviceId: service.id,
        selected: chosenSlot,
        onSelect: setChosenSlot,
    };
    const slotPickerDesktopNode = requiresAppointment ? (
        <SlotPicker {...slotPickerProps} sectionTitle="Fecha y hora" />
    ) : null;
    const slotPickerMobileNode = requiresAppointment ? (
        <SlotPicker {...slotPickerProps} />
    ) : null;

    // 🗓️ Fase E: ubicación. Radio>0 → el cliente la elige en el mapa; estático (radio 0) → taller del experto.
    const eLat = Number(service.expert?.latitude);
    const eLng = Number(service.expert?.longitude);
    const expertHasCoords = Number.isFinite(eLat) && Number.isFinite(eLng) && (eLat !== 0 || eLng !== 0);
    const isWorkshopOnly = expertWorkRadiusKm === 0 && expertHasCoords;
    const locationSatisfied = !requiresAppointment || isWorkshopOnly || !!chosenLocation;
    const locationPickerProps = {
        expertLatitude: service.expert?.latitude,
        expertLongitude: service.expert?.longitude,
        expertCountry: service.expert?.country,
        expertRange: expertWorkRadiusKm,
        workRadiusKm: expertWorkRadiusKm,
        onChange: setChosenLocation,
    };
    const locationPickerNode = requiresAppointment ? (
        <CheckoutLocationPicker {...locationPickerProps} />
    ) : null;
    const locationPickerWizardNode = requiresAppointment ? (
        <CheckoutLocationPicker {...locationPickerProps} variant="wizard" />
    ) : null;

    const priceInfo = formatPriceDisplay(finalTotal);
    const priceDisplayNode = priceInfo.wasConverted ? (
        <>
            <span className="mr-0.5 text-sm font-medium text-brand lg:text-base">≈</span>
            {priceInfo.converted}
        </>
    ) : (
        priceInfo.display
    );
    const priceSublineNode = priceInfo.wasConverted
        ? `${priceInfo.sourceFormatted} · cargo en ${sourceCurrency}`
        : undefined;

    const summaryTableProps = {
        serviceName: finalServiceTypeName,
        durationLabel: serviceDuration,
        categoryName: service?.categoryName,
        expertName: finalExpertName,
        expertPicture,
        expertRating,
        expertReviewCount,
        expertCompletedSearches,
        locationLabel: checkoutLocationLabel,
        locationRangeKm: expertWorkRadiusKm,
        timezoneLabel,
        deliverables: finalDeliverableTypes,
        priceDisplay: priceDisplayNode,
        priceSubline: priceSublineNode,
        showPriceDetails,
        onTogglePriceDetails: () => setShowPriceDetails(!showPriceDetails),
        showFooterNotes: false,
    };

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

    // 📱 Móvil en 3 pasos cuando hay que elegir UBICACIÓN (servicio con radio).
    // Taller estático o sin cita → flujo de una pantalla.
    const mobileThreeStep = requiresAppointment && !isWorkshopOnly;
    const handleMobileBack = () => {
        if (mobileThreeStep && mobileStep > 1) {
            setMobileStep((s) => (s - 1) as CheckoutMobileWizardStep);
            return;
        }
        handleBack();
    };

    return (
        <>
            {/* Versión Desktop (C1: montada solo en ≥lg, nunca a la vez que la móvil) */}
            {isDesktop && (
            <div className={`checkout-page hidden min-h-screen lg:block ${SD_CHECKOUT_DESKTOP_PAGE_CLASS}`}>
                <HomepageDesktopTopBar
                    variant="checkout"
                    onBack={handleBack}
                />
                <div className={`${SD_CHECKOUT_INNER_MAX_CLASS} pb-6 pt-4`}>
                    <div className={`${SD_CHECKOUT_GRID_CLASS} gap-y-2.5`}>
                        <section className="flex min-w-0 flex-col gap-2.5">
                            {slotPickerDesktopNode}
                            {locationPickerNode}
                        </section>

                        <aside className={`flex h-full lg:sticky lg:self-stretch ${SD_DESKTOP_STICKY_TOP_CLASS}`}>
                            <div className={`flex h-full min-h-full w-full flex-col ${SD_CHECKOUT_DESKTOP_CARD_CLASS}`}>
                                <div className="shrink-0 border-b border-[#f0f0f0] px-4 py-3">
                                    <CheckoutPageTitle variant="subtle" className="text-[15px]" />
                                </div>
                                <CheckoutSummaryTable
                                    {...summaryTableProps}
                                    includePrice={false}
                                    className="flex min-h-0 flex-1 flex-col [&_article]:rounded-none [&_article]:border-0 [&_article]:bg-transparent [&_article]:shadow-none"
                                />
                                <CheckoutPaymentAside
                                    embedded
                                    priceDisplay={priceDisplayNode}
                                    canPay={expertCanReceivePayments && slotSatisfied && locationSatisfied}
                                    isProcessing={isProcessing}
                                    onPay={handlePayment}
                                    legalNotices={
                                        <CheckoutLegalNotices
                                            sourceCurrency={sourceCurrency}
                                            collapsible
                                            defaultOpen={false}
                                            variant="plain"
                                            showCancellation={false}
                                        />
                                    }
                                />
                            </div>
                        </aside>
                    </div>
                </div>
            </div>
            )}

            {/* Versión Móvil — wizard de 3 pasos cuando hay ubicación que elegir */}
            {!isDesktop && (
            <div className="checkout-page min-h-screen bg-white lg:hidden">
                <div className={SD_CHECKOUT_MOBILE_SCROLL_PAD_CLASS}>
                    <header className={SD_CHECKOUT_MOBILE_HEADER_CLASS}>
                        {!mobileThreeStep ? (
                            <CheckoutPageTitle className="text-lg" />
                        ) : null}
                        {mobileThreeStep ? (
                            <CheckoutMobileStepper currentStep={mobileStep} />
                        ) : null}
                    </header>

                    {mobileThreeStep ? (
                        mobileStep === 1 ? (
                            <div className={`${SD_CHECKOUT_MOBILE_GUTTER_CLASS} mb-4`}>{slotPickerMobileNode}</div>
                        ) : mobileStep === 2 ? (
                            <div className="mb-0">{locationPickerWizardNode}</div>
                        ) : (
                            <>
                                <div className={`${SD_CHECKOUT_MOBILE_GUTTER_CLASS} mb-3`}>
                                    <h2 className="text-lg font-semibold tracking-[-0.02em] text-[#1c1c1c]">
                                        Confirmar y pagar
                                    </h2>
                                </div>
                                <CheckoutMobileSheet
                                    {...summaryTableProps}
                                    includePrice
                                    showFooterNotes
                                />
                                <div className={`${SD_CHECKOUT_MOBILE_GUTTER_CLASS} pb-2 pt-1`}>
                                    <CheckoutLegalNotices
                                        sourceCurrency={sourceCurrency}
                                        collapsible
                                        defaultOpen={false}
                                        variant="plain"
                                        showCancellation={false}
                                    />
                                </div>
                            </>
                        )
                    ) : (
                        <>
                            {slotPickerMobileNode && (
                                <div className={`${SD_CHECKOUT_MOBILE_GUTTER_CLASS} mb-4`}>{slotPickerMobileNode}</div>
                            )}
                            {locationPickerNode && (
                                <div className={`${SD_CHECKOUT_MOBILE_GUTTER_CLASS} mb-4`}>{locationPickerNode}</div>
                            )}
                            <CheckoutMobileSheet {...summaryTableProps} includePrice showFooterNotes />
                        </>
                    )}
                </div>

                <CheckoutMobileStickyFooter>
                    <div className={SD_CHECKOUT_MOBILE_FOOTER_ACTIONS_CLASS}>
                        <button
                            type="button"
                            onClick={handleMobileBack}
                            className={SD_CHECKOUT_MOBILE_BACK_TEXT_BTN_CLASS}
                        >
                            Atrás
                        </button>
                        {mobileThreeStep && mobileStep < 3 ? (
                            <button
                                type="button"
                                onClick={() => {
                                    if (mobileStep === 1 && slotSatisfied) setMobileStep(2);
                                    else if (mobileStep === 2 && locationSatisfied) setMobileStep(3);
                                }}
                                disabled={mobileStep === 1 ? !slotSatisfied : !locationSatisfied}
                                className={`${SD_CHECKOUT_MOBILE_CTA_CLASS} gap-2`}
                            >
                                Continuar
                                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                            </button>
                        ) : (
                            <button
                                onClick={handlePayment}
                                disabled={!expertCanReceivePayments || isProcessing || !slotSatisfied || !locationSatisfied}
                                type="button"
                                aria-busy={isProcessing}
                                className={SD_CHECKOUT_MOBILE_CTA_CLASS}
                            >
                                {isProcessing ? 'Procesando…' : 'Reservar y pagar'}
                            </button>
                        )}
                    </div>
                </CheckoutMobileStickyFooter>
            </div>
            )}

            {isSubmitting && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-white/95 backdrop-blur-sm"
                    role="status"
                    aria-live="polite"
                >
                    <div className="text-center">
                        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-brand border-t-transparent" />
                        <p className="text-sm text-[#6a6a6a]" style={{ fontFamily: HP_FONT }}>
                            Conectando con el pago seguro…
                        </p>
                    </div>
                </div>
            )}
        </>
    );
}

