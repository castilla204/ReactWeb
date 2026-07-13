import { useState, useEffect, useRef, useCallback } from 'react';
import { SileoFullscreenLoader } from '../components/ui/sileo-loader';
import { SileoSkeleton } from '../components/ui/sileo-skeleton';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useApi } from '../hooks/useApi';
import { API_CONFIG } from '../config/api';
import { showToast } from '../lib/toast';
import { Service } from '../hooks/useServices';
import { useSearch } from '../hooks/useSearch.hooks';
import { useCurrency } from '../contexts/CurrencyContext';
import { formatTimezoneFriendly } from '../utils/timezoneFormat';
import { HomepageDesktopTopBar } from '../components/HomepageDesktopTopBar';
import { CheckoutSummaryTable } from '../components/checkout/CheckoutSummaryTable';
import { CheckoutPaymentAside } from '../components/checkout/CheckoutPaymentAside';
import { CheckoutMobileSheet } from '../components/checkout/CheckoutMobileSheet';
import { CheckoutMobileStickyFooter } from '../components/checkout/CheckoutMobileStickyFooter';
import { CheckoutMobileWizardShell } from '../components/checkout/CheckoutMobileWizardShell';
import { CheckoutMobileStepHeader, type CheckoutMobileWizardStep } from '../components/checkout/CheckoutMobileStepHeader';
import { CheckoutCoordinationStep, type CoordinationView, COORD_CHOOSE_TITLE, getCoordDesktopStep1Lead } from '../components/checkout/CheckoutCoordinationStep';
import { getInspectionSubject, getInspectionSubjectOf, getInspectionSubjectCapitalized } from '../utils/inspectionSubject';
import { CheckoutDesktopAppointmentHeader, type DesktopCrumbStep } from '../components/checkout/CheckoutDesktopAppointmentHeader';
import {
    sellerCoordinationCanContinue,
    CheckoutSellerCoordinationFields,
    COORD_SELF_PICK_LOCATION_HEADER_LEAD,
    isValidSellerPhone,
    isValidSellerEmail,
} from '../components/checkout/CheckoutSellerCoordinationFields';
import { CheckoutDesktopLocationStepBody } from '../components/checkout/CheckoutDesktopLocationStepBody';
import { CheckoutSellerChoiceMobileWarning } from '../components/checkout/CheckoutSellerChoiceLocked';
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
import { buildCheckoutSummaryDisplay } from '../utils/checkoutSummary';
import { resolveExpertWorkRadiusKm } from '../utils/workRadius';
import { cn } from '../lib/utils';
// Verificación de móvil/SMS: NO se exige al cliente para contratar (solo a expertos).
import { getCountryName } from '../utils/countries';
import {
    HP_FONT,
    SD_CHECKOUT_MOBILE_CTA_CLASS,
    SD_CHECKOUT_MOBILE_CTA_DARK_CLASS,
    SD_CHECKOUT_MOBILE_BACK_TEXT_BTN_CLASS,
    SD_CHECKOUT_MOBILE_FOOTER_ACTIONS_CLASS,
    SD_CHECKOUT_MOBILE_GUTTER_CLASS,
    SD_CHECKOUT_MOBILE_PAYMENT_BODY_CLASS,
    SD_CHECKOUT_MOBILE_PAYMENT_HEADER_PRICE_CLASS,
    SD_CHECKOUT_MOBILE_PAYMENT_HEADER_PRICE_META_CLASS,
    SD_DESKTOP_STICKY_TOP_CLASS,
    SD_CHECKOUT_DESKTOP_PAGE_CLASS,
    SD_CHECKOUT_DESKTOP_APPOINTMENT_SHELL_HEIGHT_CLASS,
    SD_CHECKOUT_DESKTOP_CARD_CLASS,
} from '../constants/homepageTypography';

// El flujo "Que la elija el vendedor" tiene 4 paradas en móvil (agenda · zona ·
// contacto · pago); el pago cierra en Stripe, así que el stepper nunca marca el 4 activo.
// El paso 1 de AMBOS flujos es siempre "¿Quién elige la fecha?" (la elección): sin
// contarlo, la barra no avanzaba de la elección al primer paso del flujo (los dos
// marcaban el segmento 1). Ahora la elección es el tramo 1 y el flujo empieza en el 2.
const MOBILE_SELLER_PREVIEW_STEPS = [
    { id: 1, label: 'La cita' },
    { id: 2, label: 'Disponibilidad' },
    { id: 3, label: 'Ubicación' },
    { id: 4, label: 'Contacto' },
    { id: 5, label: 'Pago' },
] as const;

// Flujo "La elijo yo ahora": elección + 4 pasos = 5 tramos.
const MOBILE_SELF_STEPS = [
    { id: 1, label: 'La cita' },
    { id: 2, label: 'Fecha y hora' },
    { id: 3, label: 'Ubicación' },
    { id: 4, label: 'Vendedor' },
    { id: 5, label: 'Pago' },
] as const;

// Paso 2 desktop, flujo vendedor: la confianza va en una línea bajo el formulario
// (CheckoutDesktopLocationStepBody), no en un bloque aparte.

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
    // 📏 El footer móvil es `position: fixed`, así que no ocupa flujo y su alto VARÍA
    // (la línea de "pago protegido" solo aparece en el paso de elección). Para poder
    // centrar de verdad las tarjetas sobre él hay que MEDIRLO, no asumir una constante.
    const mobileFooterRoRef = useRef<ResizeObserver | null>(null);
    const [mobileFooterHeight, setMobileFooterHeight] = useState(0);
    // Callback ref: se engancha cuando el footer monta (no siempre está en el DOM) y
    // reobserva si cambia de alto (p. ej. el texto de confianza envuelve a 3 líneas).
    const attachMobileFooter = useCallback((el: HTMLDivElement | null) => {
        mobileFooterRoRef.current?.disconnect();
        mobileFooterRoRef.current = null;
        if (!el) {
            setMobileFooterHeight(0);
            return;
        }
        const ro = new ResizeObserver(() => setMobileFooterHeight(el.offsetHeight));
        ro.observe(el);
        mobileFooterRoRef.current = ro;
        setMobileFooterHeight(el.offsetHeight);
    }, []);
    const [showPriceDetails, setShowPriceDetails] = useState(false);
    // 🗓️ Fase E: hueco de cita elegido (modelo Calendly), null hasta que el cliente elige.
    const [chosenSlot, setChosenSlot] = useState<ChosenSlot | null>(null);
    // 🗓️ Fase E: ubicación de la cita (servicios con radio); estáticos la prefijan al taller.
    const [chosenLocation, setChosenLocation] = useState<CheckoutLocationData | null>(null);
    // 🤝 Coordinación con el vendedor. "self" = el cliente elige hueco ahora (flujo de siempre).
    // "seller" = el cliente NO elige hueco; el experto propondrá la cita tras coordinar con el vendedor.
    const [coordinationMode, setCoordinationMode] = useState<'self' | 'seller' | null>(null);
    // 🤝 Paso de coordinación (primer paso del wizard): vista (elegir/datos vendedor)
    // y opción marcada. El footer compartido del wizard controla Atrás/Continuar.
    const [coordView, setCoordView] = useState<CoordinationView>(() =>
        typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches
            ? 'seller'
            : 'choose',
    );
    const [coordSelection, setCoordSelection] = useState<'self' | 'seller' | null>('seller');
    const [sellerPhone, setSellerPhone] = useState('');
    const [sellerEmail, setSellerEmail] = useState('');
    const [sellerListingUrl, setSellerListingUrl] = useState('');
    const [showSellerValidation, setShowSellerValidation] = useState(false);
    // 🚪 Gate: ¿el experto tiene algún hueco en la ventana [+3, +14]? null = aún sin comprobar.
    // Si es false se deshabilita el modo "Coordínalo Inspecciono".
    const [sellerHasAvailability, setSellerHasAvailability] = useState<boolean | null>(null);
    const effectiveCoordinationMode =
        coordinationMode ?? (sellerHasAvailability === false ? 'self' : 'seller');
    // 📱 Móvil: wizard (1 = fecha/hora, 2 = ubicación, 3 = pago). En desktop no aplica.
    const [mobileStep, setMobileStep] = useState<CheckoutMobileWizardStep>(1);
    // 🖥️ Desktop con cita: 1 = coordinación + calendario, 2 = mapa (+ datos vendedor), 3 = pago.
    const [desktopStep, setDesktopStep] = useState<1 | 2 | 3>(1);

    // 🖥️ C1 FIX: montar SOLO un árbol (desktop o móvil), no ambos. Antes `hidden lg:block` /
    // `lg:hidden` dejaban los dos en el DOM → se montaban DOS SlotPicker + DOS CheckoutLocationPicker
    // (dos mapas Mapbox, peticiones dobles) y la instancia oculta podía borrar (onChange(null)) el
    // hueco/ubicación elegido en la visible. Con matchMedia solo existe una instancia de cada picker.
    const [isDesktop, setIsDesktop] = useState<boolean>(
        () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches
    );
    useEffect(() => {
        const mq = window.matchMedia('(min-width: 1024px)');
        const syncCoordViewForViewport = (desktop: boolean) => {
            if (!desktop && coordinationMode === null && coordView === 'seller') {
                setCoordView('choose');
            }
        };
        const onChange = (e: MediaQueryListEvent) => {
            setIsDesktop(e.matches);
            syncCoordViewForViewport(e.matches);
        };
        syncCoordViewForViewport(mq.matches);
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, [coordView, coordinationMode]);

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
        if (!sellerCoordinationCanContinue(sellerPhone, sellerEmail)) return;
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
                            setCoordinationMode(null);
                            setCoordSelection('seller');
                            setCoordView(
                                window.matchMedia('(min-width: 1024px)').matches ? 'seller' : 'choose',
                            );
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
            if (coordView === 'seller-contact' && sellerCoordinationCanContinue(sellerPhone, sellerEmail)) {
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
        if (service.requiresAppointment && paymentCoordMode === 'seller' && !sellerCoordinationCanContinue(sellerPhone, sellerEmail)) {
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
                // W12 FIX (auditoría 2026-07-12): también en modo "self". El paso de ubicación pide
                // el contacto del vendedor "para que el experto pueda coordinar el acceso" y luego
                // se descartaba aquí (siempre null en self) → formulario que promete y tira el dato.
                // El webhook lo persiste en el hire y lo vuelca en Appointment.OwnerPhone. Solo
                // valores VÁLIDOS: en self los campos son opcionales y no bloquean aunque estén mal
                // (y el saneado del backend solo corre en modo seller).
                sellerPhone: isValidSellerPhone(sellerPhone) ? sellerPhone.trim() : null,
                sellerEmail: isValidSellerEmail(sellerEmail) ? sellerEmail.trim() : null,
                sellerListingUrl: sellerListingUrl.trim() || null,
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
        if (coordSelection === 'seller') {
            setCoordSelection('self');
            if (isDesktop) {
                setCoordinationMode('self');
                setCoordView('choose');
                setChosenSlot(null);
                setChosenLocation(null);
            }
        }
    }, [sellerOptionDisabled, coordinationMode, coordSelection, isDesktop]);

    // Taller fijo: prefijar ubicación sin mostrar el picker en móvil (como en desktop).
    useEffect(() => {
        if (!service || coordinationMode !== 'self') return;
        const radius = resolveExpertWorkRadiusKm(service);
        const lat = Number(service.expert?.latitude);
        const lng = Number(service.expert?.longitude);
        const hasCoords = Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0);
        if (radius !== 0 || !hasCoords) return;
        setChosenLocation((prev) => {
            if (prev?.location === 'Taller del experto (punto fijo)') return prev;
            return {
                location: 'Taller del experto (punto fijo)',
                latitude: String(lat),
                longitude: String(lng),
                doorNumber: null,
                siteDetails: null,
            };
        });
    }, [service, coordinationMode]);

    if (loading) {
        // Skeleton con la forma del checkout (columna del wizard + resumen lateral)
        // en vez de un spinner a pantalla completa.
        return (
            <div className="min-h-screen bg-surface-tinted px-4 pb-12 pt-8 sm:px-5 lg:px-8" aria-busy="true">
                <div className="mx-auto w-full max-w-[75rem]">
                    <SileoSkeleton className="mb-6 h-7 w-56 max-w-[70%] rounded-lg" />
                    <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
                        <div className="space-y-4">
                            <SileoSkeleton className="h-10 w-full rounded-lg" />
                            <SileoSkeleton className="h-64 w-full rounded-2xl" />
                            <div className="grid grid-cols-4 gap-2">
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <SileoSkeleton key={i} className="h-9 w-full rounded-md" />
                                ))}
                            </div>
                        </div>
                        <div className="space-y-4 rounded-2xl border border-line bg-white p-4">
                            <div className="flex items-center gap-3">
                                <SileoSkeleton className="h-12 w-12" rounded="full" />
                                <div className="flex-1 space-y-2">
                                    <SileoSkeleton className="h-4 w-3/4 rounded" />
                                    <SileoSkeleton className="h-3 w-1/2 rounded" />
                                </div>
                            </div>
                            <SileoSkeleton className="h-16 w-full rounded-lg" />
                            <SileoSkeleton className="h-4 w-full rounded" />
                            <SileoSkeleton className="h-4 w-5/6 rounded" />
                            <SileoSkeleton className="h-11 w-full rounded-full" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!service) {
        return (
            <div className="flex min-h-[100dvh] items-center justify-center bg-surface-tinted">
                <div className="text-center">
                    <p className="mb-4 text-sm text-red-600" style={{ fontFamily: HP_FONT }}>Servicio no encontrado</p>
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="inline-flex h-11 items-center justify-center rounded-full bg-ink-strong px-7 text-body font-semibold text-white transition-colors hover:bg-ink active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-strong focus-visible:ring-offset-2"
                    >
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
        coordView === 'seller-map' ||
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
        requiresAppointment &&
        isDesktop &&
        desktopStep === 1 &&
        (desktopSelfFlowActive || desktopInSellerFlow);
    const slotPickerDesktopNode = desktopShowCalendar ? (
        desktopInSellerFlow ? (
        <SlotPicker
            {...slotPickerProps}
            embedded
            embeddedSplitColumn
            bare
            previewMode
            showSectionHeader={false}
            windowDays={SELLER_BOOKING_MAX_DAYS}
            sectionTitle="Disponibilidad del experto"
        />
    ) : (
        <SlotPicker
            {...slotPickerProps}
            embedded
            embeddedSplitColumn
            bare
            showSectionHeader={false}
            sectionTitle="Fecha y hora"
        />
    )
) : null;
    const slotPickerMobileNode =
        requiresAppointment && !isDesktop && coordinationMode === 'self' ? (
            <SlotPicker {...slotPickerProps} embedded sectionTitle="Fecha y hora" />
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
    const desktopShowMapOnStep2 =
        isDesktop &&
        requiresAppointment &&
        desktopStep === 2 &&
        !isWorkshopOnly &&
        (coordinationMode === 'self' || coordinationMode === 'seller');
    const locationPickerSidebarNode = desktopShowMapOnStep2 ? (
        <CheckoutLocationPicker
            {...locationPickerProps}
            variant="sidebar"
            referenceMode={coordinationMode === 'seller'}
            showEmbeddedHeader={false}
            externalForm={coordinationMode === 'self'}
            controlledLocation={chosenLocation}
        />
    ) : null;
    const locationPickerWizardNode =
        requiresAppointment && coordinationMode === 'self' ? (
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

    const checkoutSummary = buildCheckoutSummaryDisplay({
        requiresAppointment,
        coordinationMode:
            coordinationMode ??
            (coordSelection === 'self' || coordSelection === 'seller' ? coordSelection : null),
        chosenSlot,
        chosenLocation,
        isWorkshopOnly,
        hireSearchLocation,
        expert: {
            city: service.expert?.city,
            country: service.expert?.country,
            countryName: service.expert?.country ? getCountryName(service.expert.country) : null,
        },
        sellerPhone,
        sellerEmail,
        sellerListingUrl,
    });

    const sellerContactReady = sellerCoordinationCanContinue(sellerPhone, sellerEmail);
    const desktopSlotReady = !requiresAppointment || !desktopSelfFlowActive || !!chosenSlot;
    const desktopLocationReady =
        !requiresAppointment || !desktopSelfFlowActive || isWorkshopOnly || !!chosenLocation;
    const desktopStep1Ready =
        !requiresAppointment ||
        desktopInSellerFlow ||
        (desktopSelfFlowActive && desktopSlotReady);
    const desktopStep2Ready =
        !requiresAppointment ||
        // 🤝 "Que lo coordine Inspecciono" → contacto del vendedor OBLIGATORIO (le mandamos el enlace).
        (coordinationMode === 'seller' && sellerContactReady) ||
        // 🤝 "Yo la reservo" → el contacto del vendedor es OPCIONAL: solo exige la ubicación.
        (coordinationMode === 'self' && desktopLocationReady);
    const desktopContinueReady =
        desktopStep === 1 ? desktopStep1Ready : desktopStep === 2 ? desktopStep2Ready : false;
    const desktopPaymentReady =
        !requiresAppointment ||
        (coordinationMode === 'seller' && sellerContactReady) ||
        (coordinationMode === 'self' && desktopSlotReady && desktopLocationReady);

    const summaryTableProps = {
        coordinationMode: effectiveCoordinationMode,
        serviceName: finalServiceTypeName,
        durationLabel: serviceDuration,
        categoryName: service?.categoryName,
        expertName: finalExpertName,
        expertPicture,
        expertRating,
        expertReviewCount,
        expertCompletedSearches,
        coordinationLabel: checkoutSummary.coordinationLabel,
        appointmentLabel: checkoutSummary.appointmentLabel,
        locationLabel: checkoutSummary.locationLabel,
        locationHint: checkoutSummary.locationHint,
        sellerContactLabel: checkoutSummary.sellerContactLabel,
        sellerListingLabel: checkoutSummary.sellerListingLabel,
        locationRangeKm: expertWorkRadiusKm,
        timezoneLabel,
        deliverables: finalDeliverableTypes,
        priceDisplay: priceDisplayNode,
        priceSubline: priceSublineNode,
        showPriceDetails,
        onTogglePriceDetails: () => setShowPriceDetails(!showPriceDetails),
        showFooterNotes: false,
        stripedRows: true,
    };

    const mobileContentWidthClass = cn(SD_CHECKOUT_MOBILE_GUTTER_CLASS, 'w-full md:mx-auto md:max-w-[32rem]');

    const mobilePaymentSummaryNode = (
        <CheckoutMobileSheet
            key="checkout-payment-summary"
            {...summaryTableProps}
            includePrice={false}
            showFooterNotes
            showDeliverables
            expertHeroPosition="bottom"
            hideExpertHeader
            paymentStep
        />
    );

    const mobilePaymentHeaderNode = (
        <CheckoutMobileStepHeader
            step={5}
            steps={MOBILE_SELF_STEPS}
            hideStepper
            title="Revisa y reserva"
            description="Comprueba que todo está bien antes de pagar."
            trailing={
                <div className="text-right">
                    <p className={SD_CHECKOUT_MOBILE_PAYMENT_HEADER_PRICE_CLASS}>
                        {priceDisplayNode}
                    </p>
                    <p className={SD_CHECKOUT_MOBILE_PAYMENT_HEADER_PRICE_META_CLASS}>Impuestos incluidos</p>
                </div>
            }
        />
    );

    const exitCheckout = () => {
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

    const resetToCoordinationChoose = () => {
        setCoordinationMode(null);
        setCoordView('choose');
        setDesktopStep(1);
        setMobileStep(1);
    };

    const desktopAppointmentFlow = requiresAppointment;
    const desktopOnPaymentStep = !desktopAppointmentFlow || desktopStep === 3;
    const desktopOnCoordCalendarStep = desktopAppointmentFlow && desktopStep === 1;
    const desktopOnMapDetailsStep = desktopAppointmentFlow && desktopStep === 2;

    const resolveDesktopStepAfterCoordCalendar = (
        mode: 'self' | 'seller',
    ): 2 | 3 => {
        if (mode === 'seller') return 2;
        return isWorkshopOnly ? 3 : 2;
    };

    const handleDesktopBack = () => {
        if (desktopStep === 3 && desktopAppointmentFlow) {
            setDesktopStep(
                coordinationMode === 'seller' || (coordinationMode === 'self' && !isWorkshopOnly)
                    ? 2
                    : 1,
            );
            return;
        }
        if (desktopStep === 2) {
            setDesktopStep(1);
            return;
        }
        if (desktopOnCoordCalendarStep && (coordinationMode === 'self' || coordinationMode === 'seller')) {
            resetToCoordinationChoose();
            return;
        }
        exitCheckout();
    };

    const handleDesktopContinue = () => {
        if (desktopStep === 1) {
            if (!desktopStep1Ready) return;
            const nextMode: 'self' | 'seller' = desktopInSellerFlow ? 'seller' : 'self';
            if (coordinationMode === null) {
                if (nextMode === 'seller') {
                    setCoordinationMode('seller');
                    setChosenSlot(null);
                    setChosenLocation(null);
                } else {
                    confirmCoordinationSelf();
                }
            }
            setDesktopStep(resolveDesktopStepAfterCoordCalendar(nextMode));
            return;
        }
        if (desktopStep === 2) {
            if (!desktopStep2Ready) {
                setShowSellerValidation(true);
                return;
            }
            setDesktopStep(3);
        }
    };

    // 📱 Móvil en 3 pasos (fecha → ubicación/mapa → pago), también con taller fijo.
    // 🤝 En modo "seller" no hay pasos de fecha/ubicación; el móvil va directo al pago.
    const mobileThreeStep = requiresAppointment && coordinationMode === 'self';
    const mobileInSelfWizard = mobileThreeStep;
    const handleMobileBack = () => {
        if (mobileInSelfWizard) {
            if (mobileStep > 1) {
                setMobileStep((s) => (s - 1) as CheckoutMobileWizardStep);
                return;
            }
            resetToCoordinationChoose();
            return;
        }
        if (requiresAppointment && coordinationMode === 'seller') {
            setCoordinationMode(null);
            setCoordView('seller-contact');
            return;
        }
        exitCheckout();
    };

    // 🤝 Fase de coordinación: mientras no haya modo elegido, es el PRIMER paso del
    // wizard (mismo chrome: stepper arriba + footer Atrás/Continuar), no un modal.
    const inCoordinationChoice = requiresAppointment && coordinationMode === null;
    const mobileOnPaymentStep = !inCoordinationChoice && (!mobileThreeStep || mobileStep === 4);
    const mobileFooterScrollPad = mobileFooterHeight > 0 ? mobileFooterHeight : undefined;
    const isCoordOptionPickView =
        coordView === 'choose' || (coordView === 'seller' && coordinationMode === null);
    const coordCanContinue =
        isCoordOptionPickView
            ? !!coordSelection && !(coordSelection === 'seller' && sellerOptionDisabled)
            : coordView === 'seller-plazos' || coordView === 'seller-map'
              ? true
              : sellerCoordinationCanContinue(sellerPhone, sellerEmail);
    const handleCoordPrimary = () => {
        if (isCoordOptionPickView) {
            if (!coordSelection || (coordSelection === 'seller' && sellerOptionDisabled)) return;
            if (coordSelection === 'self') confirmCoordinationSelf();
            else setCoordView('seller-plazos');
            return;
        }
        if (coordView === 'seller-plazos') {
            if (isWorkshopOnly) setCoordView('seller-contact');
            else setCoordView('seller-map');
            return;
        }
                if (coordView === 'seller-map') {
                    setCoordView('seller-contact');
                    return;
                }
                confirmCoordinationSeller();
    };
    const handleCoordBack = () => {
        if (coordView === 'seller-contact') {
            if (isWorkshopOnly) setCoordView('seller-plazos');
            else setCoordView('seller-map');
            return;
        }
        if (coordView === 'seller-map') {
            setCoordView('seller-plazos');
            return;
        }
        if (coordView === 'seller-plazos' || coordView === 'seller') {
            setCoordView('choose');
            return;
        }
        exitCheckout();
    };
    const coordinationStepDesktopNode = (
        <CheckoutCoordinationStep
            embedded
            showStepHeader={false}
            coordinationMode={coordinationMode}
            categoryName={service?.categoryName}
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
            showSellerValidation={showSellerValidation}
        />
    );
    const coordinationStepMobileNode = (
        <CheckoutCoordinationStep
            coordinationMode={coordinationMode}
            categoryName={service?.categoryName}
            // El título/explicación los pone la cabecera del wizard (CheckoutMobileStepHeader):
            // en contacto móvil y en el paso de elección (ahora banda fija fuera del scroll),
            // se oculta el header propio para no duplicar.
            hideHeader={(coordView === 'seller-contact' && !isWorkshopOnly) || coordView === 'choose'}
            // Paso de elección: el shell móvil ya es el scroll container; fillHeight
            // en el paso de coordinación quedaría como doble scroll.
            fillHeight={false}
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
            showSellerValidation={showSellerValidation}
        />
    );

    // 📱 Paso «Datos del vendedor» del wizard móvil en modo «Yo la reservo». Es OPCIONAL:
    // el cliente ya coordina con el vendedor, así que se puede continuar sin rellenar nada.
    // El título/explicación del paso los pone la cabecera del wizard (CheckoutMobileStepHeader).
    const sellerDataSelfMobileNode = (
        <div className={cn(SD_CHECKOUT_MOBILE_GUTTER_CLASS, 'pb-4')}>
            <CheckoutSellerCoordinationFields
                variant="contact"
                selfMode
                sellerPhone={sellerPhone}
                sellerEmail={sellerEmail}
                sellerListingUrl={sellerListingUrl}
                onSellerPhoneChange={setSellerPhone}
                onSellerEmailChange={setSellerEmail}
                onSellerListingUrlChange={setSellerListingUrl}
            />
        </div>
    );

    const desktopCoordColumnNode =
        requiresAppointment && isDesktop && desktopStep === 1 ? coordinationStepDesktopNode : null;
    const desktopCalendarColumnNode = desktopShowCalendar ? slotPickerDesktopNode : null;


    // Ambos pasos comparten ahora la MISMA altura de fila (SD_CHECKOUT_DESKTOP_APPOINTMENT
    // _SHELL_HEIGHT_CLASS en el wrapper), así que los paneles llenan el alto en los dos y el
    // scroll interior protege los viewports bajos.
    const desktopSplitLeftClass =
        'min-w-0 flex-[0_0_45%] xl:flex-[0_0_42%] flex flex-col rounded-2xl border border-line bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)] h-full min-h-0';
    const desktopSplitRightClass =
        'relative min-w-0 flex-1 flex flex-col rounded-2xl border border-line bg-white shadow-[0_2px_12px_rgba(15,23,42,0.06),0_1px_3px_rgba(15,23,42,0.04)] h-full min-h-0 overflow-hidden';
    const desktopSplitPanelScrollClass =
        'px-6 pb-5 pt-5 xl:px-7 flex min-h-0 flex-1 flex-col overflow-y-auto';

    const desktopMapDetailsBody =
        requiresAppointment && isDesktop && desktopStep === 2 ? (
            <CheckoutDesktopLocationStepBody
                mode={coordinationMode === 'seller' ? 'seller' : 'self'}
                expertLatitude={service.expert?.latitude}
                expertLongitude={service.expert?.longitude}
                expertCountry={service.expert?.country}
                expertRange={expertWorkRadiusKm}
                chosenLocation={chosenLocation}
                onLocationChange={setChosenLocation}
                sellerPhone={sellerPhone}
                sellerEmail={sellerEmail}
                sellerListingUrl={sellerListingUrl}
                onSellerPhoneChange={setSellerPhone}
                onSellerEmailChange={setSellerEmail}
                onSellerListingUrlChange={setSellerListingUrl}
                showSellerValidation={showSellerValidation}
            />
        ) : null;

    const desktopStep2Header =
        coordinationMode === 'seller'
            ? {
                  title: 'Datos del vendedor y cobertura',
                  description: (
                      <>
                          Un móvil o un email bastan: le enviamos un enlace para que reserve la cita.
                          A la derecha puedes revisar la zona donde actúa el experto.
                      </>
                  ),
              }
            : {
                  title: COORD_SELF_PICK_LOCATION_HEADER_LEAD,
                  description: (
                      <>
                          Busca la dirección o marca un punto dentro del área azul del mapa: es la zona donde
                          trabaja el experto. Puedes moverlo y ajustarlo con calma; la ubicación queda fijada al
                          pagar.
                      </>
                  ),
              };

    // 🧭 Miga de pasos desktop (patrón Shopify/Baymard: los pasos completados son clicables
    // y hacen de «volver» con destino visible). El paso 2 solo existe si el flujo lo tiene:
    // seller siempre; self salvo taller fijo. Con el modo aún sin elegir se asume que
    // existirá (caso mayoritario) y la etiqueta se concreta al elegir.
    const desktopHasStep2 = coordinationMode === 'seller' ? true : !isWorkshopOnly;
    const desktopCrumbSteps: DesktopCrumbStep[] = [
        { id: 0, label: 'Servicio' },
        ...(desktopAppointmentFlow
            ? [
                  { id: 1, label: 'Cita' },
                  ...(desktopHasStep2
                      ? [{ id: 2, label: coordinationMode === 'seller' ? 'Vendedor' : 'Ubicación' }]
                      : []),
              ]
            : []),
        { id: 3, label: 'Pago' },
    ];
    const desktopCurrentCrumbId = desktopOnPaymentStep ? 3 : desktopStep;
    const handleDesktopCrumbSelect = (id: number) => {
        if (id === 0) {
            exitCheckout();
            return;
        }
        if (id === 1 || id === 2) setDesktopStep(id);
    };
    // El chip «Volver» nombra su destino (misma lógica de retroceso que handleDesktopBack):
    // un «Volver» huérfano no dice a qué vuelve.
    const desktopBackLabel = desktopOnPaymentStep
        ? desktopAppointmentFlow
            ? coordinationMode === 'seller'
                ? 'Volver a los datos del vendedor'
                : !isWorkshopOnly
                  ? 'Volver a la ubicación'
                  : 'Volver a la cita'
            : 'Volver al servicio'
        : desktopOnMapDetailsStep
          ? 'Volver a la cita'
          : 'Volver al servicio';

    const desktopSellerStepFooter = (
        <div className="shrink-0 border-t border-line-soft bg-surface-tinted/60 px-6 py-4 xl:px-7">
            <button
                type="button"
                onClick={handleDesktopContinue}
                disabled={!desktopContinueReady}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-brand px-7 text-body font-semibold text-white shadow-[0_4px_16px_hsl(var(--brand)/0.2)] transition-[colors,box-shadow,transform] duration-200 hover:bg-brand-hover hover:shadow-[0_8px_24px_hsl(var(--brand)/0.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none motion-reduce:active:scale-100"
            >
                Continuar
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
            </button>
        </div>
    );

    const desktopAppointmentFooter = (
        <div className="relative z-10 flex shrink-0 items-center justify-between gap-4 py-1">
            <span />
            <button
                type="button"
                onClick={handleDesktopContinue}
                disabled={!desktopContinueReady}
                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-ink-strong px-7 text-body font-semibold text-white transition-colors hover:bg-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-strong focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
                Continuar
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
            </button>
        </div>
    );

    return (
        <>
            {/* Versión Desktop (C1: montada solo en ≥lg, nunca a la vez que la móvil) */}
            {isDesktop && (
            <div className={`checkout-page hidden min-h-screen lg:block ${SD_CHECKOUT_DESKTOP_PAGE_CLASS}`}>
                <HomepageDesktopTopBar
                    variant="checkout"
                />
                {desktopOnPaymentStep ? (
                    <div className="mx-auto w-full max-w-[75rem] px-4 pb-12 pt-8 sm:px-5 lg:px-8">
                        {/* Sin título ni lead: la miga ya marca "Pago" como paso actual y el
                            resumen de abajo es autoexplicativo — repetirlo aquí era redundante. */}
                        <CheckoutDesktopAppointmentHeader
                            onBack={handleDesktopBack}
                            backLabel={desktopBackLabel}
                            steps={desktopCrumbSteps}
                            currentStepId={desktopCurrentCrumbId}
                            onStepSelect={handleDesktopCrumbSelect}
                            className="mb-5"
                        />
                        {/* items-start: el panel de pago mide lo que mide su contenido y se queda
                            sticky bajo el topbar; estirado a la altura de la columna izquierda
                            dejaba ~300px de blanco muerto entre el Total y el botón. */}
                        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[1fr_360px]">
                            <section className="min-w-0">
                                <CheckoutSummaryTable
                                    {...summaryTableProps}
                                    includePrice={false}
                                    hideExpertHeader
                                    showDeliverables
                                    deliverablesColumns={2}
                                    className="[&_article]:rounded-2xl [&_article]:border [&_article]:border-line [&_article]:shadow-[0_1px_3px_rgba(15,23,42,0.04)]"
                                />
                            </section>
                            <aside className={cn('lg:sticky lg:self-start', SD_DESKTOP_STICKY_TOP_CLASS)}>
                                <CheckoutPaymentAside
                                    embedded
                                    coordinationMode={effectiveCoordinationMode}
                                    priceDisplay={priceDisplayNode}
                                    priceSubline={priceSublineNode}
                                    canPay={expertCanReceivePayments && desktopPaymentReady}
                                    isProcessing={isProcessing}
                                    onPay={handlePayment}
                                    expertName={finalExpertName}
                                    expertPicture={expertPicture}
                                    serviceName={finalServiceTypeName}
                                    expertRating={expertRating}
                                    expertReviewCount={expertReviewCount}
                                />
                            </aside>
                        </div>
                    </div>
                ) : (
                    <div className="mx-auto w-full max-w-[75rem] px-4 pb-4 pt-8 sm:px-5 lg:px-8">
                        {desktopOnCoordCalendarStep ? (
                            <CheckoutDesktopAppointmentHeader
                                title={COORD_CHOOSE_TITLE}
                                description={getCoordDesktopStep1Lead(service?.categoryName)}
                                onBack={handleDesktopBack}
                                backLabel={desktopBackLabel}
                                steps={desktopCrumbSteps}
                                currentStepId={desktopCurrentCrumbId}
                                onStepSelect={handleDesktopCrumbSelect}
                                className="mb-5"
                            />
                        ) : null}
                        {desktopOnMapDetailsStep ? (
                            <CheckoutDesktopAppointmentHeader
                                title={desktopStep2Header.title}
                                description={desktopStep2Header.description}
                                onBack={handleDesktopBack}
                                backLabel={desktopBackLabel}
                                steps={desktopCrumbSteps}
                                currentStepId={desktopCurrentCrumbId}
                                onStepSelect={handleDesktopCrumbSelect}
                                className="mb-5"
                            />
                        ) : null}
                        <div
                            className={cn(
                                // 🗺️ El paso MAPA sí necesita altura fija (el mapa llena una lámina alta
                                // con scroll interior). El paso CITA (tarjetas + calendario) va a altura
                                // NATURAL: nada scrollea, las dos columnas se igualan solas con
                                // items-stretch y el contenido nunca queda pegado ni cortado
                                // (feedback 2026-07-13). Debe seguir siendo flex flex-col para que el
                                // flex-1 de la fila del mapa propague altura (h-full → mapa visible).
                                'flex flex-col',
                                desktopOnMapDetailsStep && SD_CHECKOUT_DESKTOP_APPOINTMENT_SHELL_HEIGHT_CLASS,
                            )}
                        >
                            <div
                                className={cn(
                                    'flex items-stretch gap-5 xl:gap-6',
                                    desktopOnMapDetailsStep && 'min-h-0 flex-1 overflow-hidden',
                                )}
                            >
                                    {desktopOnCoordCalendarStep ? (
                                        <>
                                            {/* Altura NATURAL: ninguna columna scrollea. Con items-stretch
                                                en la fila, la columna más baja se estira hasta la más alta,
                                                así los dos paneles quedan igual de altos sin recortes ni
                                                cards pegadas (feedback 2026-07-13). */}
                                            <div className="flex min-w-0 flex-[0_0_45%] flex-col rounded-2xl border border-line bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)] xl:flex-[0_0_42%]">
                                                <div className="px-6 pb-5 pt-5 xl:px-7">
                                                    {desktopCoordColumnNode}
                                                </div>
                                            </div>
                                            <aside className="relative flex min-h-0 w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)] lg:w-[20rem] lg:shrink-0 xl:w-[22rem]">
                                                {desktopCalendarColumnNode}
                                            </aside>
                                        </>
                                    ) : null}
                                {desktopOnMapDetailsStep ? (
                                    <>
                                        {coordinationMode === 'seller' ? (
                                            // 🤝 Flujo vendedor: un solo panel izquierdo (formulario +
                                            // pasos del proceso + CTA anclado). Antes eran dos tarjetas
                                            // apiladas con flex-1 en la de confianza → hueco muerto y CTA
                                            // flotando lejos del formulario (feedback 2026-07-13).
                                            <div
                                                className={cn(
                                                    SD_CHECKOUT_DESKTOP_CARD_CLASS,
                                                    'flex h-full min-h-0 min-w-0 flex-[0_0_45%] flex-col xl:flex-[0_0_42%]',
                                                )}
                                            >
                                                <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pb-5 pt-5 xl:px-7">
                                                    {desktopMapDetailsBody}
                                                </div>
                                                {desktopSellerStepFooter}
                                            </div>
                                        ) : (
                                            <div className={desktopSplitLeftClass}>
                                                <div className={desktopSplitPanelScrollClass}>
                                                    {desktopMapDetailsBody}
                                                </div>
                                            </div>
                                        )}
                                        {desktopShowMapOnStep2 ? (
                                            <aside className={desktopSplitRightClass}>
                                                {locationPickerSidebarNode}
                                            </aside>
                                        ) : (
                                            <aside
                                                className={cn(
                                                    desktopSplitRightClass,
                                                    'items-center justify-center bg-surface-tinted px-6',
                                                )}
                                            >
                                                <p className="max-w-sm text-center text-meta leading-[1.55] text-ink-muted">
                                                    La inspección será en el taller del experto. No hace falta
                                                    indicar ubicación en el mapa.
                                                </p>
                                            </aside>
                                        )}
                                    </>
                                ) : null}
                            </div>
                            {!(desktopOnMapDetailsStep && coordinationMode === 'seller') ? (
                                <div className="mt-5">{desktopAppointmentFooter}</div>
                            ) : null}
                        </div>
                    </div>
                )}
            </div>
            )}

            {/* Versión Móvil — shell unificado en todos los pasos */}
            {!isDesktop && (
            <div className="checkout-page lg:hidden">
                {inCoordinationChoice ? (
                    coordView === 'seller-map' && requiresAppointment && !isWorkshopOnly ? (
                        <CheckoutMobileWizardShell
                            fullBleed
                            header={
                                <CheckoutMobileStepHeader
                                    step={3}
                                    steps={MOBILE_SELLER_PREVIEW_STEPS}
                                    title="Zona del experto"
                                    description={`Aquí solo ves su área de trabajo, para comprobar que cubre tu zona. El vendedor indicará la dirección exacta ${getInspectionSubjectOf(service?.categoryName)} al reservar.`}
                                />
                            }
                        >
                            <CheckoutLocationPicker
                                {...locationPickerProps}
                                variant="wizard"
                                referenceMode
                            />
                        </CheckoutMobileWizardShell>
                    ) : coordView === 'choose' ? (
                        <CheckoutMobileWizardShell
                            footerInsetPx={mobileFooterScrollPad}
                            trustFooterFallback
                            header={
                                <CheckoutMobileStepHeader
                                    step={1}
                                    steps={MOBILE_SELF_STEPS}
                                    title="¿Quién elige la fecha?"
                                    description={`${getInspectionSubjectCapitalized(service?.categoryName)} lo tiene el vendedor, así que la cita de la inspección tiene que cuadrar con su disponibilidad.`}
                                />
                            }
                            bodyClassName={SD_CHECKOUT_MOBILE_GUTTER_CLASS}
                        >
                            {coordinationStepMobileNode}
                        </CheckoutMobileWizardShell>
                    ) : coordView === 'seller-plazos' && requiresAppointment ? (
                        <CheckoutMobileWizardShell
                            header={
                                <CheckoutMobileStepHeader
                                    step={2}
                                    steps={MOBILE_SELLER_PREVIEW_STEPS}
                                    title="Agenda del experto"
                                    description={
                                        isWorkshopOnly
                                            ? 'Consulta los huecos libres del experto antes de continuar.'
                                            : 'Aquí solo consultas su agenda, para ver que tiene huecos libres. Tras el pago, el vendedor elegirá el día y la hora con el enlace que le enviamos.'
                                    }
                                />
                            }
                        >
                            <div className={cn(mobileContentWidthClass, 'pt-1')}>
                                {isWorkshopOnly ? (
                                    <CheckoutSellerChoiceMobileWarning
                                        variant="calendar"
                                        className="mb-3"
                                    />
                                ) : null}
                                <SlotPicker
                                    {...slotPickerProps}
                                    embedded
                                    previewMode
                                    windowDays={SELLER_BOOKING_MAX_DAYS}
                                    sectionTitle="Disponibilidad del experto"
                                    minLeadDays={SELLER_BOOKING_MIN_LEAD_DAYS}
                                />
                            </div>
                        </CheckoutMobileWizardShell>
                    ) : coordView === 'seller-contact' ? (
                        <CheckoutMobileWizardShell
                            header={
                                <CheckoutMobileStepHeader
                                    step={4}
                                    steps={MOBILE_SELLER_PREVIEW_STEPS}
                                    title="Datos del vendedor"
                                    description="Le enviaremos un enlace para elegir la cita. Móvil o email; el anuncio es opcional."
                                />
                            }
                        >
                            <div className={cn(mobileContentWidthClass, 'pt-1')}>
                                {coordinationStepMobileNode}
                            </div>
                        </CheckoutMobileWizardShell>
                    ) : (
                        <CheckoutMobileWizardShell
                            header={
                                <CheckoutMobileStepHeader
                                    step={1}
                                    steps={MOBILE_SELF_STEPS}
                                    title="¿Quién elige la fecha?"
                                    description={`${getInspectionSubjectCapitalized(service?.categoryName)} lo tiene el vendedor, así que la cita de la inspección tiene que cuadrar con su disponibilidad.`}
                                />
                            }
                        >
                            <div className={cn(mobileContentWidthClass, 'pt-1')}>
                                {coordinationStepMobileNode}
                            </div>
                        </CheckoutMobileWizardShell>
                    )
                ) : mobileThreeStep && mobileStep === 2 ? (
                    <CheckoutMobileWizardShell
                        fullBleed
                        header={
                            <CheckoutMobileStepHeader
                                step={3}
                                steps={MOBILE_SELF_STEPS}
                                title={`¿Dónde está ${getInspectionSubject(service?.categoryName)}?`}
                                description="Marca la dirección donde el experto hará la revisión."
                            />
                        }
                    >
                        {locationPickerWizardNode}
                    </CheckoutMobileWizardShell>
                ) : mobileThreeStep && mobileStep === 1 ? (
                    <CheckoutMobileWizardShell
                        header={
                            <CheckoutMobileStepHeader
                                step={mobileStep + 1}
                                steps={MOBILE_SELF_STEPS}
                                title="Elige día y hora"
                                description="Estos son los huecos libres del experto. Elige el que os venga bien a ti y al vendedor."
                            />
                        }
                    >
                        <div className={cn(mobileContentWidthClass, 'pt-1')}>
                            {slotPickerMobileNode}
                        </div>
                    </CheckoutMobileWizardShell>
                ) : mobileThreeStep && mobileStep === 3 ? (
                    <CheckoutMobileWizardShell
                        header={
                            <CheckoutMobileStepHeader
                                step={mobileStep + 1}
                                steps={MOBILE_SELF_STEPS}
                                title="Datos del vendedor"
                                description="Opcional: deja un contacto del vendedor para coordinar el acceso al vehículo. Puedes continuar sin rellenarlo."
                            />
                        }
                    >
                        <div className="pt-1 md:mx-auto md:max-w-[32rem]">{sellerDataSelfMobileNode}</div>
                    </CheckoutMobileWizardShell>
                ) : (
                    <CheckoutMobileWizardShell
                        key="checkout-mobile-payment"
                        header={mobilePaymentHeaderNode}
                        headerClassName="pb-4"
                        bodyClassName={SD_CHECKOUT_MOBILE_PAYMENT_BODY_CLASS}
                        footerInsetPx={mobileFooterScrollPad}
                        scrollEndCushionPx={28}
                        trustFooterFallback
                    >
                        {mobilePaymentSummaryNode}
                    </CheckoutMobileWizardShell>
                )}

                <CheckoutMobileStickyFooter shellRef={attachMobileFooter}>
                    {/* Anclaje de confianza dentro del propio bottom bar, ENCIMA de Atrás/Continuar
                        (solo en el paso de elección). */}
                    {inCoordinationChoice && coordView === 'choose' ? (
                        <div className="mb-2.5 flex items-start gap-2">
                            <ShieldCheck className="mt-[1px] h-[15px] w-[15px] shrink-0 text-brand" strokeWidth={2} aria-hidden />
                            <p className="text-caption leading-[1.4] text-ink-muted">
                                Elijas lo que elijas, tu pago queda protegido: no cobramos al experto hasta que apruebes el informe.
                            </p>
                        </div>
                    ) : mobileOnPaymentStep ? (
                        <div className="checkout-payment-trust-enter mb-2.5 flex items-start gap-2.5 rounded-xl border border-brand/10 bg-brand/[0.05] px-3 py-2.5">
                            <ShieldCheck className="mt-[1px] h-4 w-4 shrink-0 text-brand" strokeWidth={2} aria-hidden />
                            <p className="text-meta leading-[1.4] text-ink-muted">
                                <span className="font-semibold text-ink-strong">Hoy no se te cobra</span>: solo
                                reservamos el importe en tu tarjeta. Pago seguro con Stripe.
                            </p>
                        </div>
                    ) : null}
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
                                className={`${SD_CHECKOUT_MOBILE_CTA_DARK_CLASS} gap-2`}
                            >
                                {coordView === 'seller-plazos' || coordView === 'seller-map'
                                    ? 'Siguiente'
                                    : 'Continuar'}
                                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                            </button>
                        ) : mobileThreeStep && mobileStep < 4 ? (
                            <button
                                type="button"
                                onClick={() => {
                                    if (mobileStep === 1 && slotSatisfied) setMobileStep(2);
                                    else if (mobileStep === 2 && locationSatisfied) setMobileStep(3);
                                    // Paso 3 (datos del vendedor) es opcional: siempre se puede avanzar.
                                    else if (mobileStep === 3) setMobileStep(4);
                                }}
                                disabled={
                                    mobileStep === 1
                                        ? !slotSatisfied
                                        : mobileStep === 2
                                          ? !locationSatisfied
                                          : false
                                }
                                className={`${SD_CHECKOUT_MOBILE_CTA_DARK_CLASS} gap-2`}
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
                                {isProcessing ? 'Procesando…' : (
                                    <>
                                        Reservar y pagar
                                        <svg className="ml-1.5 h-3.5 w-3.5 shrink-0 translate-y-[1px] opacity-70" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                                            <rect x="3.5" y="8" width="13" height="8.5" rx="1.5" />
                                            <path d="M6.5 8V5.5a3.5 3.5 0 117 0V8" />
                                        </svg>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </CheckoutMobileStickyFooter>
            </div>
            )}

            {isSubmitting && (
                <SileoFullscreenLoader message="Conectando con el pago seguro…" className="bg-white/95" />
            )}
        </>
    );
}

