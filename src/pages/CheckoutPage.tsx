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
import { CheckoutCoordinationStep } from '../components/checkout/CheckoutCoordinationStep';
import { CheckoutSellerCoordinationFields } from '../components/checkout/CheckoutSellerCoordinationFields';
import { readCheckoutCoordinationFromState, type CheckoutCoordinationPayload } from '../utils/checkoutCoordination';
import { getAuthToken } from '../lib/auth';
import {
    SELLER_BOOKING_MIN_LEAD_DAYS,
    SELLER_BOOKING_MAX_DAYS,
    parseAvailabilitySummary,
    hasAvailabilityInWindow,
} from '../utils/sellerBookingWindow';
import SlotPicker, { ChosenSlot } from '../components/SlotPicker';
import CheckoutLocationPicker, { CheckoutLocationData } from '../components/CheckoutLocationPicker';
import { normalizeDeliverableTypes } from '../components/serviceDetail/ServiceDetailDeliverablesGuide';
import { readServiceReturnPath } from '../utils/servicePageNavigation';
import { resolveCheckoutLocation, persistHireSearchLocation } from '../utils/hireSearchContext';
import { resolveExpertWorkRadiusKm } from '../utils/workRadius';
import { cn } from '../lib/utils';
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
    SD_CHECKOUT_APPOINTMENT_INNER_MAX_CLASS,
    SD_CHECKOUT_MOBILE_GUTTER_CLASS,
    SD_DESKTOP_STICKY_TOP_CLASS,
    SD_CHECKOUT_DESKTOP_PAGE_CLASS,
    SD_CHECKOUT_DESKTOP_CARD_CLASS,
    SD_CHECKOUT_DESKTOP_APPOINTMENT_SHELL_CLASS,
    SD_CHECKOUT_DESKTOP_APPOINTMENT_MAIN_CLASS,
    SD_CHECKOUT_DESKTOP_MAP_COLUMN_CLASS,
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
    // 🤝 Coordinación con el vendedor. "self" = el cliente elige hueco ahora (flujo de siempre).
    // "seller" = el cliente NO elige hueco; el experto propondrá la cita tras coordinar con el vendedor.
    const [coordinationMode, setCoordinationMode] = useState<'self' | 'seller' | null>(null);
    // Declarado arriba (no depende de `service`) para poder usarse en handlePayment sin TDZ.
    const effectiveCoordinationMode = coordinationMode ?? 'self';
    // 🤝 Paso de coordinación (primer paso del wizard): vista (elegir/datos vendedor)
    // y opción marcada. El footer compartido del wizard controla Atrás/Continuar.
    const [coordView, setCoordView] = useState<
        'choose' | 'seller' | 'seller-plazos' | 'seller-contact'
    >('choose');
    const [coordSelection, setCoordSelection] = useState<'self' | 'seller' | null>(null);
    const [sellerPhone, setSellerPhone] = useState('');
    const [sellerEmail, setSellerEmail] = useState('');
    const [sellerListingUrl, setSellerListingUrl] = useState('');
    // 🚪 Gate: ¿el experto tiene algún hueco en la ventana [+3, +14]? null = aún sin comprobar.
    // Si es false se deshabilita el modo "Coordínalo Inspecciono".
    const [sellerHasAvailability, setSellerHasAvailability] = useState<boolean | null>(null);
    // 📱 Móvil: wizard (1 = fecha/hora, 2 = ubicación, 3 = pago). En desktop no aplica.
    const [mobileStep, setMobileStep] = useState<CheckoutMobileWizardStep>(1);
    // 🖥️ Desktop con cita: 1 = cita (coord + calendario + mapa), 2 = confirmar y pagar.
    const [desktopStep, setDesktopStep] = useState<1 | 2>(1);

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

    // 🚪 Gate de disponibilidad del modo "seller": ¿hay algún hueco del experto en la
    // ventana fija [+3, +14] días? Si no, la opción "Coordínalo Inspecciono" se deshabilita.
    useEffect(() => {
        if (!serviceId) return;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const from = new Date(today);
        from.setDate(from.getDate() + SELLER_BOOKING_MIN_LEAD_DAYS);
        const pad = (n: number) => String(n).padStart(2, '0');
        const ymd = `${from.getFullYear()}-${pad(from.getMonth() + 1)}-${pad(from.getDate())}`;
        const days = SELLER_BOOKING_MAX_DAYS - SELLER_BOOKING_MIN_LEAD_DAYS + 1; // 12
        let cancelled = false;
        (async () => {
            try {
                const token = getAuthToken();
                const res = await fetch(
                    `${API_CONFIG.baseUrl}/api/Availability/service/${serviceId}/summary?from=${ymd}&days=${days}`,
                    { headers: token ? { Authorization: `Bearer ${token}` } : {} },
                );
                if (!res.ok || cancelled) return;
                const parsed = parseAvailabilitySummary(await res.json());
                if (!cancelled) setSellerHasAvailability(hasAvailabilityInWindow(parsed));
            } catch {
                if (!cancelled) setSellerHasAvailability(null);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [serviceId]);

    const applyCoordinationPayload = (payload: CheckoutCoordinationPayload) => {
        setCoordinationMode(payload.coordinationMode);
        if (payload.coordinationMode === 'seller') {
            setSellerPhone(payload.sellerPhone ?? '');
            setSellerEmail(payload.sellerEmail ?? '');
            setSellerListingUrl(payload.sellerListingUrl ?? '');
            setChosenSlot(null);
            setChosenLocation(null);
        } else {
            setSellerPhone('');
            setSellerEmail('');
            setSellerListingUrl('');
        }
        setMobileStep(1);
    };

    // 🤝 Confirmación del paso de coordinación (pantalla dedicada, sin modal).
    // "self" = el cliente elegirá hueco/ubicación en el flujo normal.
    const confirmCoordinationSelf = () => {
        setCoordinationMode('self');
        setMobileStep(1);
        setDesktopStep(1);
    };
    // "seller" = los datos del vendedor ya están en el estado (el form los escribe directo);
    // solo fijamos el modo y limpiamos hueco/ubicación que no aplican.
    const confirmCoordinationSeller = () => {
        if (!sellerPhone.trim() && !sellerEmail.trim()) return;
        setCoordinationMode('seller');
        setChosenSlot(null);
        setChosenLocation(null);
        setMobileStep(1);
        setDesktopStep(1);
    };

    const handleCoordinationSelect = (value: 'self' | 'seller') => {
        setCoordSelection(value);
        setDesktopStep(1);
        if (isDesktop) {
            if (value === 'self') {
                confirmCoordinationSelf();
                setCoordView('choose');
            } else {
                setCoordinationMode(null);
                setCoordView('seller');
                setChosenSlot(null);
                setChosenLocation(null);
            }
        }
    };

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
                    const coordinationFromRoute = readCheckoutCoordinationFromState(routerLocation.state);
                    if (transformedService.requiresAppointment) {
                        if (coordinationFromRoute) {
                            applyCoordinationPayload(coordinationFromRoute);
                        } else {
                            // Sin modo elegido → se renderiza el paso dedicado de coordinación
                            // (no un modal auto-abierto).
                            setCoordinationMode(null);
                        }
                    } else {
                        setCoordinationMode('self');
                    }
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
        // 🤝 En modo "seller" (coordinamos con el vendedor) NO se exige hueco ni ubicación:
        // el experto propondrá la cita después. Solo se piden los datos del vendedor.
        let paymentCoordMode = coordinationMode;
        if (service.requiresAppointment && !paymentCoordMode) {
            if (coordView === 'seller-contact' && (sellerPhone.trim() || sellerEmail.trim())) {
                paymentCoordMode = 'seller';
                setCoordinationMode('seller');
                setChosenSlot(null);
                setChosenLocation(null);
            } else {
                return;
            }
        }
        if (service.requiresAppointment && paymentCoordMode === 'self' && !chosenSlot) {
            showToast('error', 'Elige un día y una hora para la cita antes de continuar.');
            return;
        }
        if (service.requiresAppointment && paymentCoordMode === 'self' && !isWorkshopOnly && !chosenLocation) {
            showToast('error', 'Indica en el mapa dónde será la cita antes de continuar.');
            return;
        }
        if (service.requiresAppointment && paymentCoordMode === 'seller' && !sellerPhone.trim() && !sellerEmail.trim()) {
            showToast('error', 'Indica un teléfono o email del vendedor para que el experto pueda coordinar la cita.');
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
                // 🤝 Coordinación con el vendedor. En modo "seller" el hueco va nulo (arriba) y
                // el experto propone la cita después; aquí viajan los datos del vendedor.
                coordinationMode: paymentCoordMode ?? effectiveCoordinationMode,
                sellerPhone: effectiveCoordinationMode === 'seller' ? sellerPhone.trim() || null : null,
                sellerEmail: effectiveCoordinationMode === 'seller' ? sellerEmail.trim() || null : null,
                sellerListingUrl: effectiveCoordinationMode === 'seller' ? sellerListingUrl.trim() || null : null,
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

    // 🚪 Gate: si el experto no tiene disponibilidad en plazo y el cliente había
    // elegido (o tenía seleccionado) "Coordínalo Inspecciono", lo devolvemos a "Yo me encargo".
    const sellerOptionDisabled = sellerHasAvailability === false;
    useEffect(() => {
        if (!sellerOptionDisabled) return;
        if (coordinationMode === 'seller') {
            setCoordinationMode('self');
            setCoordView('choose');
        }
        if (coordSelection === 'seller') setCoordSelection('self');
    }, [sellerOptionDisabled, coordinationMode, coordSelection]);

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
    // 🖥️ Desktop: coordinación integrada con calendario/mapa (no pantalla aparte). Móvil: paso separado.
    const desktopInSellerFlow =
        coordinationMode === 'seller' ||
        coordView === 'seller' ||
        coordView === 'seller-plazos' ||
        coordView === 'seller-contact' ||
        coordSelection === 'seller';
    const desktopSelfFlowActive = requiresAppointment && !desktopInSellerFlow;
    // 🤝 En modo "seller" no se exige hueco (lo propone el experto), así que se da por satisfecho.
    const slotSatisfied = !requiresAppointment || coordinationMode !== 'self' || !!chosenSlot;
    const slotPickerProps = {
        serviceId: service.id,
        selected: chosenSlot,
        onSelect: setChosenSlot,
    };
    const desktopShowCalendar =
        requiresAppointment && isDesktop && (desktopSelfFlowActive || desktopInSellerFlow);
    const slotPickerDesktopNode = desktopShowCalendar ? (
        desktopInSellerFlow ? (
            <SlotPicker
                {...slotPickerProps}
                embedded
                previewMode
                windowDays={SELLER_BOOKING_MAX_DAYS}
                sectionTitle="Disponibilidad del experto"
            />
        ) : (
            <SlotPicker {...slotPickerProps} embedded sectionTitle="Fecha y hora" />
        )
    ) : null;
    const slotPickerMobileNode =
        requiresAppointment && !isDesktop && effectiveCoordinationMode === 'self' ? (
            <SlotPicker {...slotPickerProps} />
        ) : null;

    // 🗓️ Fase E: ubicación. Radio>0 → el cliente la elige en el mapa; estático (radio 0) → taller del experto.
    const eLat = Number(service.expert?.latitude);
    const eLng = Number(service.expert?.longitude);
    const expertHasCoords = Number.isFinite(eLat) && Number.isFinite(eLng) && (eLat !== 0 || eLng !== 0);
    const isWorkshopOnly = expertWorkRadiusKm === 0 && expertHasCoords;
    // 🤝 En modo "seller" no se elige ubicación aquí (la fija el experto al proponer la cita).
    const locationSatisfied = !requiresAppointment || coordinationMode !== 'self' || isWorkshopOnly || !!chosenLocation;
    const locationPickerProps = {
        expertLatitude: service.expert?.latitude,
        expertLongitude: service.expert?.longitude,
        expertCountry: service.expert?.country,
        expertRange: expertWorkRadiusKm,
        workRadiusKm: expertWorkRadiusKm,
        onChange: setChosenLocation,
    };
    const locationPickerNode = !isDesktop && requiresAppointment && coordinationMode === 'self' ? (
        <CheckoutLocationPicker {...locationPickerProps} />
    ) : null;
    const locationPickerWorkshopDesktopNode =
        isDesktop && (desktopSelfFlowActive || desktopInSellerFlow) && isWorkshopOnly ? (
            <CheckoutLocationPicker {...locationPickerProps} />
        ) : null;
    const desktopMapInSidebar =
        isDesktop && requiresAppointment && desktopStep === 1 && !isWorkshopOnly;
    const locationPickerSidebarNode = desktopMapInSidebar ? (
        <CheckoutLocationPicker
            {...locationPickerProps}
            variant="sidebar"
            referenceMode={desktopInSellerFlow}
        />
    ) : null;
    const locationPickerWizardNode = requiresAppointment && effectiveCoordinationMode === 'self' ? (
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

    const sellerContactReady = sellerPhone.trim() !== '' || sellerEmail.trim() !== '';
    const desktopSlotReady = !requiresAppointment || !desktopSelfFlowActive || !!chosenSlot;
    const desktopLocationReady =
        !requiresAppointment || !desktopSelfFlowActive || isWorkshopOnly || !!chosenLocation;
    const desktopStep1Ready =
        !requiresAppointment ||
        desktopInSellerFlow ||
        (desktopSelfFlowActive && desktopSlotReady && desktopLocationReady);
    const desktopPaymentReady =
        !requiresAppointment ||
        (coordinationMode === 'seller' && sellerContactReady) ||
        (coordinationMode === 'self' && desktopSlotReady && desktopLocationReady);

    const summaryTableProps = {
        serviceName: finalServiceTypeName,
        durationLabel: serviceDuration,
        categoryName: service?.categoryName,
        expertName: finalExpertName,
        expertPicture,
        expertRating,
        expertReviewCount,
        expertCompletedSearches,
        appointmentLabel: chosenSlot ? `${chosenSlot.dateLabel} · ${chosenSlot.label}` : null,
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

    const handleMainCheckoutBack = () => {
        handleBack();
    };

    const desktopAppointmentFlow = requiresAppointment;
    const desktopOnPaymentStep = !desktopAppointmentFlow || desktopStep === 2;
    const desktopOnAppointmentStep = desktopAppointmentFlow && desktopStep === 1;

    const handleDesktopBack = () => {
        if (desktopOnPaymentStep && desktopAppointmentFlow) {
            setDesktopStep(1);
            return;
        }
        handleMainCheckoutBack();
    };

    const handleDesktopContinue = () => {
        if (!desktopStep1Ready) return;
        if (coordinationMode === null) {
            if (desktopInSellerFlow) {
                setCoordinationMode('seller');
                setChosenSlot(null);
                setChosenLocation(null);
            } else {
                confirmCoordinationSelf();
            }
        }
        setDesktopStep(2);
    };

    // 📱 Móvil en 3 pasos cuando hay que elegir UBICACIÓN (servicio con radio).
    // Taller estático o sin cita → flujo de una pantalla.
    // 🤝 En modo "seller" no hay pasos de fecha/ubicación; el móvil va directo al pago.
    const mobileThreeStep = requiresAppointment && !isWorkshopOnly && effectiveCoordinationMode === 'self';
    const handleMobileBack = () => {
        if (mobileThreeStep && mobileStep > 1) {
            setMobileStep((s) => (s - 1) as CheckoutMobileWizardStep);
            return;
        }
        handleMainCheckoutBack();
    };

    // 🤝 Fase de coordinación: mientras no haya modo elegido, es el PRIMER paso del
    // wizard (mismo chrome: stepper arriba + footer Atrás/Continuar), no un modal.
    const inCoordinationChoice = requiresAppointment && coordinationMode === null;
    const mobileInSellerCoordination =
        coordSelection === 'seller' ||
        coordView === 'seller' ||
        coordView === 'seller-plazos' ||
        coordView === 'seller-contact';
    const mobileSellerMapNode =
        !isDesktop && requiresAppointment && inCoordinationChoice && mobileInSellerCoordination && !isWorkshopOnly ? (
            <div className={`${SD_CHECKOUT_MOBILE_GUTTER_CLASS} mt-4`}>
                <CheckoutLocationPicker {...locationPickerProps} referenceMode />
            </div>
        ) : null;
    const coordCanContinue =
        coordView === 'choose'
            ? !!coordSelection
            : coordView === 'seller-plazos'
              ? true
              : sellerPhone.trim() !== '' || sellerEmail.trim() !== '';
    const handleCoordPrimary = () => {
        if (coordView === 'choose') {
            if (!coordSelection) return;
            if (coordSelection === 'self') confirmCoordinationSelf();
            else setCoordView('seller-plazos');
            return;
        }
        if (coordView === 'seller-plazos') {
            setCoordView('seller-contact');
            return;
        }
        confirmCoordinationSeller();
    };
    const handleCoordBack = () => {
        if (coordView === 'seller-contact') {
            setCoordView('seller-plazos');
            return;
        }
        if (coordView === 'seller-plazos' || coordView === 'seller') {
            setCoordView('choose');
            return;
        }
        handleBack();
    };
    const coordinationStepDesktopNode = (
        <CheckoutCoordinationStep
            embedded
            coordinationMode={coordinationMode}
            view={coordinationMode === 'seller' ? 'seller' : coordView}
            selection={coordSelection}
            onSelect={handleCoordinationSelect}
            sellerPhone={sellerPhone}
            sellerEmail={sellerEmail}
            sellerListingUrl={sellerListingUrl}
            onSellerPhoneChange={setSellerPhone}
            onSellerEmailChange={setSellerEmail}
            onSellerListingUrlChange={setSellerListingUrl}
            sellerOptionDisabled={sellerOptionDisabled}
        />
    );
    const coordinationStepMobileNode = (
        <CheckoutCoordinationStep
            coordinationMode={coordinationMode}
            view={coordinationMode === 'seller' ? 'seller' : coordView}
            selection={coordSelection}
            onSelect={handleCoordinationSelect}
            sellerPhone={sellerPhone}
            sellerEmail={sellerEmail}
            sellerListingUrl={sellerListingUrl}
            onSellerPhoneChange={setSellerPhone}
            onSellerEmailChange={setSellerEmail}
            onSellerListingUrlChange={setSellerListingUrl}
            sellerOptionDisabled={sellerOptionDisabled}
        />
    );

    const desktopAppointmentBody =
        requiresAppointment && isDesktop ? (
            <>
                {coordinationStepDesktopNode}
                {slotPickerDesktopNode}
            </>
        ) : null;

    const desktopAppointmentFooter = (
        <div className="mt-auto flex shrink-0 items-center justify-between gap-3 border-t border-[#f0f0f0]/70 bg-white px-5 py-3.5">
            <button
                type="button"
                onClick={handleDesktopBack}
                className="inline-flex h-9 items-center justify-center rounded-full border border-[#e5e7eb] bg-white px-4 text-[13px] font-semibold text-[#565d6b] transition-colors hover:border-[#d1d5db] hover:text-[#1c1c1c]"
            >
                Atrás
            </button>
            <button
                type="button"
                onClick={handleDesktopContinue}
                disabled={!desktopStep1Ready}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-brand px-5 text-[13px] font-semibold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
                Continuar
                <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
            </button>
        </div>
    );

    return (
        <>
            {/* Versión Desktop (C1: montada solo en ≥lg, nunca a la vez que la móvil) */}
            {isDesktop && (
            <div className={`checkout-page hidden min-h-screen lg:block ${SD_CHECKOUT_DESKTOP_PAGE_CLASS}`}>
                <HomepageDesktopTopBar variant="checkout" onBack={handleDesktopBack} />
                {desktopOnPaymentStep ? (
                    <div className={`${SD_CHECKOUT_INNER_MAX_CLASS} pb-6 pt-4`}>
                        <div className={`${SD_CHECKOUT_GRID_CLASS} gap-y-2.5`}>
                            <section className="flex min-w-0 flex-col gap-2.5">
                                {desktopAppointmentFlow ? (
                                    <h2 className="text-lg font-semibold tracking-[-0.02em] text-[#1c1c1c]">
                                        Confirmar y pagar
                                    </h2>
                                ) : null}
                                {coordinationMode === 'seller' ? (
                                    <div className={`${SD_CHECKOUT_DESKTOP_CARD_CLASS} max-w-xl p-4`}>
                                        <h3 className="text-sm font-semibold tracking-[-0.01em] text-[#1c1c1c]">
                                            Datos del vendedor
                                        </h3>
                                        <p className="mt-1 text-[13px] leading-relaxed text-[#6b7280]">
                                            Teléfono o email para enviarle el enlace de reserva. El anuncio
                                            es opcional.
                                        </p>
                                        <div className="mt-3">
                                            <CheckoutSellerCoordinationFields
                                                variant="contact"
                                                sellerPhone={sellerPhone}
                                                sellerEmail={sellerEmail}
                                                sellerListingUrl={sellerListingUrl}
                                                onSellerPhoneChange={setSellerPhone}
                                                onSellerEmailChange={setSellerEmail}
                                                onSellerListingUrlChange={setSellerListingUrl}
                                            />
                                        </div>
                                    </div>
                                ) : null}
                            </section>
                            <aside
                                className={`flex h-full lg:sticky lg:self-stretch ${SD_DESKTOP_STICKY_TOP_CLASS}`}
                            >
                                <div
                                    className={`flex h-full min-h-full w-full flex-col ${SD_CHECKOUT_DESKTOP_CARD_CLASS}`}
                                >
                                    <CheckoutSummaryTable
                                        {...summaryTableProps}
                                        includePrice={false}
                                        className="flex min-h-0 flex-1 flex-col [&_article]:rounded-none [&_article]:border-0 [&_article]:bg-transparent [&_article]:shadow-none"
                                    />
                                    <CheckoutPaymentAside
                                        embedded
                                        priceDisplay={priceDisplayNode}
                                        canPay={expertCanReceivePayments && desktopPaymentReady}
                                        isProcessing={isProcessing}
                                        onPay={handlePayment}
                                    />
                                </div>
                            </aside>
                        </div>
                    </div>
                ) : (
                    <div className={`${SD_CHECKOUT_APPOINTMENT_INNER_MAX_CLASS} pb-10 pt-5`}>
                        <div className={SD_CHECKOUT_DESKTOP_APPOINTMENT_SHELL_CLASS}>
                            <div className="flex min-h-[min(78vh,720px)] items-stretch">
                                <div
                                    className={cn(
                                        SD_CHECKOUT_DESKTOP_APPOINTMENT_MAIN_CLASS,
                                        'flex min-h-0 flex-col',
                                    )}
                                >
                                    <div className="min-h-0 flex-1">
                                        {desktopAppointmentBody}
                                        {locationPickerWorkshopDesktopNode}
                                    </div>
                                    {desktopAppointmentFooter}
                                </div>
                                {desktopMapInSidebar ? (
                                    <aside
                                        className={cn(
                                            'hidden min-h-[min(78vh,720px)] lg:flex lg:flex-col lg:self-stretch',
                                            SD_CHECKOUT_DESKTOP_MAP_COLUMN_CLASS,
                                        )}
                                    >
                                        {locationPickerSidebarNode}
                                    </aside>
                                ) : null}
                            </div>
                        </div>
                    </div>
                )}
            </div>
            )}

            {/* Versión Móvil — wizard de 3 pasos cuando hay ubicación que elegir */}
            {!isDesktop && (
            <div
                className={cn(
                    'checkout-page lg:hidden',
                    !inCoordinationChoice && mobileThreeStep && mobileStep === 2
                        ? 'relative h-[100dvh] max-h-[100dvh] overflow-hidden'
                        : 'min-h-screen bg-white',
                )}
            >
                {inCoordinationChoice ? (
                    <div className={SD_CHECKOUT_MOBILE_SCROLL_PAD_CLASS}>
                        <div
                            className={`${SD_CHECKOUT_MOBILE_GUTTER_CLASS} pt-[max(0.75rem,env(safe-area-inset-top,0px))]`}
                        >
                            {coordinationStepMobileNode}
                            {coordView === 'seller-plazos' && requiresAppointment ? (
                                <div className="mt-4">
                                    <SlotPicker
                                        {...slotPickerProps}
                                        previewMode
                                        windowDays={SELLER_BOOKING_MAX_DAYS}
                                        sectionTitle="Disponibilidad del experto"
                                    />
                                </div>
                            ) : null}
                            {mobileSellerMapNode}
                        </div>
                    </div>
                ) : mobileThreeStep && mobileStep === 2 ? (
                    <>
                        <div className="absolute inset-x-0 top-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] z-0">
                            {locationPickerWizardNode}
                        </div>
                        <header className="pointer-events-none absolute inset-x-0 top-0 z-20">
                            <div
                                className={cn(
                                    SD_CHECKOUT_MOBILE_GUTTER_CLASS,
                                    'bg-gradient-to-b from-white/96 via-white/80 to-transparent pb-3 pt-[max(0.75rem,env(safe-area-inset-top,0px))]',
                                )}
                            >
                                <CheckoutMobileStepper currentStep={mobileStep} className="mb-0" />
                            </div>
                        </header>
                    </>
                ) : (
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
                )}

                <CheckoutMobileStickyFooter>
                    <div className={SD_CHECKOUT_MOBILE_FOOTER_ACTIONS_CLASS}>
                        <button
                            type="button"
                            onClick={inCoordinationChoice ? handleCoordBack : handleMobileBack}
                            className={SD_CHECKOUT_MOBILE_BACK_TEXT_BTN_CLASS}
                        >
                            Atrás
                        </button>
                        {inCoordinationChoice ? (
                            <button
                                type="button"
                                onClick={handleCoordPrimary}
                                disabled={!coordCanContinue}
                                className={`${SD_CHECKOUT_MOBILE_CTA_CLASS} gap-2`}
                            >
                                Continuar
                                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                            </button>
                        ) : mobileThreeStep && mobileStep < 3 ? (
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

