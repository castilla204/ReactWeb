// 🛡️ Round 28: migración Google Maps → Mapbox geocoding + MapLibre interactive map.
// El proyecto NO tiene `react-map-gl` ni `mapbox-gl` en package.json: usa `maplibre-gl`
// (renderizado) con tiles Carto + la API REST de Mapbox para geocoding (igual que el
// resto de pantallas migradas — ver `ServiceDetailCoverageMap.tsx`).
import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2, AlertTriangle, MapPin, Check, Search, CreditCard, ChevronDown, ArrowRight } from 'lucide-react';
import {
    BecomeExpertWizardShell,
    BecomeExpertStepHeader,
    BecomeExpertFastPathShell,
    FastPathButtonNote,
    BE_CARD_CLASS,
    BE_INPUT_CLASS,
    BE_FAST_SELECT_CLASS,
    BE_FAST_PRIMARY_BTN_CLASS,
    BE_DAY_ACTIVE,
    BE_DAY_IDLE,
} from '../components/becomeExpert/BecomeExpertShell';
import { BecomeExpertPhotoField } from '../components/becomeExpert/BecomeExpertPhotoField';
import { BecomeExpertTrustStrip } from '../components/becomeExpert/BecomeExpertTrustStrip';
import { lazy, Suspense } from 'react';
import { LazyMount } from '../components/Map/LazyMount';

// ⚡ Mapa de cobertura del paso "Tu zona". Aparece tras varios campos del
// formulario (below-the-fold inicial). Lazy → no descarga maplibre-gl hasta
// que el contenedor se acerca al viewport.
const BecomeExpertCoverageMap = lazy(() =>
    import('../components/becomeExpert/BecomeExpertCoverageMap').then((m) => ({
        default: m.BecomeExpertCoverageMap,
    })),
);
import {
    SUPPORTED_PAYOUT_COUNTRIES,
    formatPayoutCountryLabel,
    isSupportedPayoutCountry,
} from '../constants/stripeConnectCountries';
import { API_CONFIG } from '../config/api';
import { authService } from '../services/authService';
import { HP_LINK_UNDERLINE_CLASS } from '../constants/homepageTypography';
import { useNavigate } from 'react-router-dom';
import { useBecomeExpert } from '../hooks/useBecomeExpert';
import { SEO } from '../components/SEO';
import { breadcrumbSchema } from '../utils/jsonLd';
import { VALID_DAYS_OF_WEEK, DAY_NAMES_ES } from '../types/stripe';
import { AvailabilityFormData } from '../hooks/useExpertProfile';
import { showToast } from '../lib/toast';
import { useAuth } from '../contexts/AuthContext';
import { useExpert } from '../hooks/useExpert';
import { ErrorDisplay } from '../components/ErrorDisplay';
// 🛡️ Round 28: autocomplete y reverse geocoding vía Mapbox REST (token VITE_MAPBOX_ACCESS_TOKEN)
import { searchMapboxAutocomplete, MapboxAutocompleteItem, reverseCountryMapbox } from '../utils/mapboxGeocoding';

const defaultCenter = {
    lat: 40.4168,
    lng: -3.7038,
};

// Radio de cobertura del experto (km). Antes era 100000 m con google.maps.Circle;
// ahora generamos el polígono GeoJSON con el mismo radio.
const COVERAGE_RADIUS_KM = 100;

// 🎨 Round 30 — Rediseño: de 5 pasos triviales a 3 pasos sólidos.
//   - "Identidad": foto + descripción (juntos en grid 2 columnas en desktop).
//   - "Cobertura": mapa de zona + disponibilidad horaria (juntos).
//   - "Confirmar": resumen + términos. Tras el submit, este paso muta a "Conecta Stripe"
//                  INLINE — sin navegar a otra página. Antes había una vista separada
//                  "Ya casi eres experto" que rompía el flujo y daba sensación de juguete.
const STEPS = [
    { id: 1, label: 'Identidad' },
    { id: 2, label: 'Cobertura' },
    { id: 3, label: 'Confirmar' },
] as const;

// 🛡️ Round 28: token Mapbox para el geocoder (no para tiles).
// Mantenemos compatibilidad con ambas convenciones (PUBLIC_TOKEN y ACCESS_TOKEN).
const MAPBOX_TOKEN: string | undefined =
    import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN || import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

function BecomeExpertPage() {
    const navigate = useNavigate();
    const searchInputRef = useRef<HTMLInputElement>(null);
    const { user } = useAuth();
    const { profile, fetchProfile, profileError, startOnboarding, isStartingOnboarding, checkOnboardingStatus } = useExpert();
    // 🛡️ MUD-AG: si está mudándose, pasar la URL preservada como foto existente.
    // useBecomeExpert ya NO exige nuevo upload si existingProfilePictureUrl está.
    const isAlreadyExpertInner =
        user?.role === 'Expert' || user?.Role === 'Expert' ||
        user?.role === 'expert' || user?.Role === 'EXPERT' || Number(user?.role) === 1;
    const isRelocatingInner =
        !!profile?.relocatedFromCountry && !profile?.onboardingCompleted &&
        !profile?.stripeAccountId && !profile?.country;
    const existingProfilePictureUrl =
        isAlreadyExpertInner && isRelocatingInner ? (profile?.profilePictureUrl || null) : null;
    // 🛡️ Round 28: capturamos errorCode + apiDetectedCountry (backend) para UX de errores.
    // ✅ Round 30: `submitted` permite mostrar el bloque Stripe inline sin navegar.
    const { formData, previewUrl, isSubmitting, error, errorCode, detectedCountry: apiDetectedCountry, submitted,
            applyProfilePhoto, handleSubmit, setFormData, setPreviewUrl } = useBecomeExpert({ existingProfilePictureUrl });
    const isAlreadyExpert =
        user?.role === 'Expert' ||
        user?.Role === 'Expert' ||
        user?.role === 'expert' ||
        user?.Role === 'EXPERT' ||
        Number(user?.role) === 1;

    // 🛡️ Round 28 MUD-X: si el experto se acaba de mudar, su ExpertProfile tiene
    // RelocatedFromCountry != null + Country == null + StripeAccountId == null. En ese caso
    // NO podemos saltar a step 3 (bloque Stripe Connect) porque AccountCreateOptions fallaría
    // sin país. El usuario debe pasar primero por step 2 (selector de país nuevo) para
    // setear Country. Esta detección se aplica antes del check onboarding-status.
    const isRelocating =
        !!profile?.relocatedFromCountry
        && !profile?.onboardingCompleted
        && !profile?.stripeAccountId
        && !profile?.country;

    // 🛡️ Round 28 MUD-AA (rediseño limpio): asegurar perfil fresco al cargar.
    // El step renderizado se DERIVA del profile abajo con useMemo — cero race conditions.
    useEffect(() => {
        if (isAlreadyExpert && !profile) {
            void fetchProfile(true); // force=true para evitar cache stale tras la mudanza
        }
    }, [isAlreadyExpert, profile, fetchProfile]);

    // 🛡️ Round 28 MUD-AA: paso DERIVADO síncronamente del profile, no asíncrono.
    // Esto reemplaza el useEffect+checkOnboardingStatus+setCurrentStep que tenía race
    // conditions imposibles de cerrar (profile arrives ↔ effect re-runs ↔ setCurrentStep
    // gana o pierde según el orden de React batching). Ahora es una pura función del
    // estado: profile → step. -1 = redirect, 0 = loading, 1/3 = step a renderizar.
    const derivedStep = useMemo<number>(() => {
        if (!isAlreadyExpert) return 1;          // cliente → wizard fresh
        if (!profile) return 0;                  // expert pero profile no cargado → spinner
        // Onboarding YA completo con Stripe activo → al panel
        if (profile.onboardingCompleted && profile.stripeAccountId) return -1;
        // Sin país → DEBE elegirlo (relocated O onboarding interrumpido pre-país)
        if (!profile.country) return 1;
        // Tiene país pero falta Stripe → bloque Stripe inline
        return 3;
    }, [isAlreadyExpert, profile?.country, profile?.stripeAccountId, profile?.onboardingCompleted]);

    // Override manual del usuario (Next/Back/error-link). Si está seteado, gana sobre derivedStep.
    const [stepOverride, setStepOverride] = useState<number | null>(null);

    // Aplicar derivedStep cuando cambie, salvo que el usuario haya navegado manualmente.
    useEffect(() => {
        if (derivedStep === -1) {
            navigate('/expert-panel', { replace: true });
            return;
        }
        if (derivedStep === 0) return; // aún loading, no tocar
        if (stepOverride === null) {
            setCurrentStep(derivedStep);
        }
    }, [derivedStep, stepOverride, navigate]);

    // 🛡️ MUD-X: prefill description al re-onboarding tras mudanza (no tiene que reescribir).
    useEffect(() => {
        if (!isRelocating || !profile?.description) return;
        setFormData(prev => prev.description ? prev : { ...prev, description: profile.description });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isRelocating, profile?.description]);

    // 🛡️ Round 28 MUD-AG: prefill foto preview con la URL preservada del país anterior.
    useEffect(() => {
        if (!isRelocating || !profile?.profilePictureUrl || previewUrl) return;
        setPreviewUrl(profile.profilePictureUrl);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isRelocating, profile?.profilePictureUrl]);

    const [selectedLocation, setSelectedLocation] = useState(defaultCenter);
    // 🛡️ Round 28 — Sprint US-2 (SUS2-10): detección de país en vivo desde las coords
    // del marker para mostrarlo al experto ANTES del submit. Stripe Connect.account.country
    // es INMUTABLE post-creación; si el marker está en una zona fronteriza y mal detecta,
    // el experto queda con una cuenta del país equivocado sin poder mudarla.
    const [detectedCountry, setDetectedCountry] = useState<{ code: string; supported: boolean } | null>(null);
    const [detectingCountry, setDetectingCountry] = useState(false);
    const [searchAddress, setSearchAddress] = useState<string>('');
    const [acceptTerms, setAcceptTerms] = useState<boolean>(false);
    const countryDetectSeqRef = useRef(0);
    const countryDetectAbortRef = useRef<AbortController | null>(null);
    // 🛡️ Round 28 MUD-AG: ref para evitar re-prefillar si el usuario modificó manualmente.
    const availabilityPrefilledRef = useRef(false);
    const [availability, setAvailability] = useState<AvailabilityFormData>({
        daysOfWeek: [],
        startTime: '09:00',
        endTime: '18:00',
    });
    // Rango de trabajo elegido por el experto: 0 = solo en su taller/punto fijo, máx 200 km.
    const [workRadiusKm, setWorkRadiusKm] = useState<number>(COVERAGE_RADIUS_KM);
    // 🛡️ MUD-AG: prefill availability con la disponibilidad del país anterior.
    // ExpertProfile.currentAvailability viene del backend con startTime/endTime en HH:mm:ss
    // (TimeSpan); cortamos a HH:mm que es lo que el <input type="time"> usa.
    useEffect(() => {
        if (!isRelocating || availabilityPrefilledRef.current) return;
        const cur = profile?.currentAvailability;
        if (!cur || !cur.daysOfWeek?.length) return;
        availabilityPrefilledRef.current = true;
        const toHHmm = (s: string) => (s?.length >= 5 ? s.substring(0, 5) : s || '');
        setAvailability({
            daysOfWeek: cur.daysOfWeek,
            startTime: toHHmm(cur.startTime) || '09:00',
            endTime: toHHmm(cur.endTime) || '18:00',
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isRelocating, profile?.currentAvailability]);
    const [currentStep, setCurrentStep] = useState(1);

    // 🧩 STRIPE-FIRST: estado del alta mínima (solo país) para usuarios nuevos.
    const [fastPathCountry, setFastPathCountry] = useState('ES');
    const [fastPathSubmitting, setFastPathSubmitting] = useState(false);
    const [fastPathError, setFastPathError] = useState<string | null>(null);
    // 🛡️ MUD-AA: derivado — si eres expert y profile no cargó, está checking.
    const isCheckingOnboarding = isAlreadyExpert && !profile;
    const setIsCheckingOnboarding = (_value: boolean) => { /* derived, no-op for compat */ };
    const [stepAttempted, setStepAttempted] = useState<Record<number, boolean>>({});

    // 🛡️ Round 28: estado para autocomplete de direcciones (Mapbox forward geocoding).
    const [autocompleteResults, setAutocompleteResults] = useState<MapboxAutocompleteItem[]>([]);
    const [showAutocomplete, setShowAutocomplete] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [autocompleteStatus, setAutocompleteStatus] = useState<'idle' | 'searching' | 'empty' | 'error'>('idle');
    const autocompleteAbortRef = useRef<AbortController | null>(null);

    const step2GeoInitRef = useRef(false);

    // Mantenemos una ref con la ubicación actual para usarla dentro de listeners (no re-suscribir).
    const selectedLocationRef = useRef(selectedLocation);
    useEffect(() => {
        selectedLocationRef.current = selectedLocation;
    }, [selectedLocation]);

    const toggleDay = (day: string) => {
        setAvailability(prev => ({
            ...prev,
            daysOfWeek: prev.daysOfWeek.includes(day)
                ? prev.daysOfWeek.filter(d => d !== day)
                : [...prev.daysOfWeek, day],
        }));
    };

    // Actualizar disponibilidad en formData cuando cambie
    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            availability: availability.daysOfWeek.length > 0 ? availability : undefined,
        }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [availability]);

    // Sincronizar el rango de trabajo con el formData del submit.
    useEffect(() => {
        setFormData(prev => ({ ...prev, workRadiusKm }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [workRadiusKm]);

    // 🛡️ Round 28: helper centralizado para actualizar ubicación, marker, círculo y formData.
    // Reemplaza al antiguo `updateLocationAndMap` + `onMapClick` + `handleMapClick`.
    const applyLocation = useCallback((lat: number, lng: number) => {
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

        const next = { lat, lng };
        setSelectedLocation(next);
        setFormData((prev) => ({
            ...prev,
            latitude: lat.toString(),
            longitude: lng.toString(),
        }));

        countryDetectAbortRef.current?.abort();
        const controller = new AbortController();
        countryDetectAbortRef.current = controller;
        const seq = ++countryDetectSeqRef.current;
        setDetectingCountry(true);
        setDetectedCountry(null);
        reverseCountryMapbox(lat, lng, { signal: controller.signal })
            .then((cc) => {
                if (seq !== countryDetectSeqRef.current || controller.signal.aborted) return;
                if (!cc) {
                    setDetectedCountry(null);
                } else {
                    setDetectedCountry({ code: cc, supported: isSupportedPayoutCountry(cc) });
                }
            })
            .catch((err) => {
                if ((err as DOMException)?.name === 'AbortError') return;
                if (seq === countryDetectSeqRef.current) setDetectedCountry(null);
            })
            .finally(() => {
                if (seq === countryDetectSeqRef.current) setDetectingCountry(false);
            });
    }, [setFormData]);

    // 🛡️ Round 28 MUD-AB: para un experto MUDADO (Country=null), step 3 NO debe ser el
    // bloque Stripe directo — debe ser confirmación + "Actualizar perfil" para que
    // useBecomeExpert.handleSubmit POSTee /api/User/become-expert con la nueva ubicación
    // (lat/lng/país) y backend UPDATEE Country. Después de submitted=true, sí muestra
    // el bloque Stripe (con Country ya seteado).
    const isOnStripeStage = submitted || (isAlreadyExpert && !isRelocating && currentStep === 3);

    // Detección de país al entrar en cobertura (antes la hacía el onLoad del mapa).
    useEffect(() => {
        if (currentStep !== 2 || isOnStripeStage) {
            step2GeoInitRef.current = false;
            return;
        }
        if (step2GeoInitRef.current) return;
        step2GeoInitRef.current = true;
        const { lat, lng } = selectedLocationRef.current;
        applyLocation(lat, lng);
    }, [currentStep, isOnStripeStage, applyLocation]);

    // 🛡️ Round 28: autocomplete con debounce 350ms (reemplaza al google.maps.places.Autocomplete).
    useEffect(() => {
        const query = searchAddress.trim();
        if (query.length < 3) {
            setAutocompleteResults([]);
            setShowAutocomplete(false);
            setIsSearching(false);
            setAutocompleteStatus('idle');
            return;
        }
        if (!MAPBOX_TOKEN) {
            setAutocompleteResults([]);
            setShowAutocomplete(false);
            setAutocompleteStatus('idle');
            return;
        }

        setIsSearching(true);
        setAutocompleteStatus('searching');
        autocompleteAbortRef.current?.abort();
        const controller = new AbortController();
        autocompleteAbortRef.current = controller;

        const timer = window.setTimeout(async () => {
            try {
                const items = await searchMapboxAutocomplete(query, { signal: controller.signal });
                if (controller.signal.aborted) return;
                setAutocompleteResults(items);
                setShowAutocomplete(items.length > 0);
                setAutocompleteStatus(items.length > 0 ? 'idle' : 'empty');
            } catch (err) {
                if (!controller.signal.aborted) {
                    console.warn('[BecomeExpert] autocomplete falló', err);
                    setAutocompleteResults([]);
                    setShowAutocomplete(false);
                    setAutocompleteStatus('error');
                }
            } finally {
                if (!controller.signal.aborted) setIsSearching(false);
            }
        }, 350);

        return () => {
            window.clearTimeout(timer);
            controller.abort();
        };
    }, [searchAddress]);

    // 🛡️ Round 28: al elegir una sugerencia, validamos país y aplicamos ubicación.
    const handleSelectAutocomplete = useCallback((item: MapboxAutocompleteItem) => {
        const countryCode = item.countryCode?.toUpperCase();
        if (countryCode && !isSupportedPayoutCountry(countryCode)) {
            showToast(
                'error',
                'Tu país aún no puede recibir pagos en la plataforma. Elige otra ubicación o contacta con soporte.',
                9000,
            );
            return;
        }
        applyLocation(item.lat, item.lng);
        setSearchAddress('');
        setAutocompleteResults([]);
        setShowAutocomplete(false);
    }, [applyLocation]);

    // Mostrar toast cuando hay error de contrataciones activas
    useEffect(() => {
        if (error && (error.includes('contrataciones activas') || error.includes('contratación(es) activa(s)'))) {
            showToast('error', error, 8000);
        }
    }, [error]);

    const descriptionTrimLen = formData.description.trim().length;

    const isTimeRangeValid = useCallback(() => {
        if (!availability.startTime || !availability.endTime) return false;
        const [startH, startM] = availability.startTime.split(':').map(Number);
        const [endH, endM] = availability.endTime.split(':').map(Number);
        if (Number.isNaN(startH) || Number.isNaN(endH)) return false;
        return startH * 60 + startM < endH * 60 + endM;
    }, [availability.startTime, availability.endTime]);

    const canGoNext = () => {
        switch (currentStep) {
            case 1:
                // 🛡️ MUD-AG: para mudanza, la foto preservada cuenta como válida.
                return (!!formData.profilePicture || !!existingProfilePictureUrl) && descriptionTrimLen >= 30 && descriptionTrimLen <= 60;
            case 2: {
                if (!(formData.latitude && formData.longitude)) return false;
                if (detectingCountry || !detectedCountry?.supported) return false;
                if (availability.daysOfWeek.length === 0) return false;
                return isTimeRangeValid();
            }
            case 3:
                return acceptTerms;
            default:
                return false;
        }
    };

    const canAdvance = canGoNext();

    const footerHint = useMemo((): string | null => {
        if (isOnStripeStage || canAdvance) return null;
        switch (currentStep) {
            case 1: {
                const missing: string[] = [];
                if (!formData.profilePicture && !existingProfilePictureUrl) missing.push('añade una foto');
                if (descriptionTrimLen < 30 || descriptionTrimLen > 60) missing.push('escribe entre 30 y 60 caracteres en tu descripción');
                return missing.length ? `Para continuar: ${missing.join(' y ')}.` : null;
            }
            case 2: {
                if (!(formData.latitude && formData.longitude)) {
                    return 'Marca tu zona en el mapa o busca una dirección.';
                }
                if (detectingCountry) return 'Detectando país para pagos…';
                if (!detectedCountry) {
                    return 'No pudimos detectar el país. Mueve el marcador o busca otra dirección.';
                }
                if (!detectedCountry.supported) {
                    return 'Tu ubicación no admite cobros. Coloca el marcador en un país compatible.';
                }
                if (availability.daysOfWeek.length === 0) return 'Selecciona al menos un día de disponibilidad.';
                if (!isTimeRangeValid()) return 'La hora de fin debe ser posterior a la de inicio.';
                return null;
            }
            case 3:
                return acceptTerms ? null : 'Acepta los términos y la política de privacidad para publicar.';
            default:
                return null;
        }
    }, [
        currentStep,
        formData.profilePicture,
        descriptionTrimLen,
        formData.latitude,
        formData.longitude,
        detectingCountry,
        detectedCountry,
        availability.daysOfWeek.length,
        acceptTerms,
        isTimeRangeValid,
        isOnStripeStage,
        canAdvance,
    ]);

    const handleNext = () => {
        setStepAttempted((prev) => ({ ...prev, [currentStep]: true }));
        if (canAdvance && currentStep < STEPS.length) {
            // 🛡️ MUD-AA: usar stepOverride para que la elección manual sobreescriba derivedStep.
            const next = currentStep + 1;
            setStepOverride(next);
            setCurrentStep(next);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            const prev = currentStep - 1;
            setStepOverride(prev);
            setCurrentStep(prev);
        }
    };

    const handleFinalSubmit = () => {
        if (acceptTerms) {
            handleSubmit();
        }
    };

    // ✅ Round 30: bloque Stripe inline. Lo usamos en el paso 3 cuando ya hay perfil creado
    //    (submitted=true tras submit, o isAlreadyExpert=true al volver de Stripe sin completar).
    //    Antes esto era una vista totalmente separada — ahora es parte natural del wizard.
    const renderStripeConnectBlock = () => (
        <div className="space-y-5">
            <BecomeExpertStepHeader
                title="Conecta tus cobros con Stripe"
                description="Tu perfil ya está creado. Configura pagos para poder aceptar encargos."
            />

            <div className={BE_CARD_CLASS}>
                <div className="space-y-5 px-5 py-6 sm:px-6">
                    <ul className="space-y-3">
                        {[
                            'Cobros protegidos por Stripe.',
                            'Unos 5 minutos; solo se hace una vez.',
                            'Sin coste para ti; los pagos llegan a tu cuenta.',
                        ].map((label) => (
                            <li key={label} className="flex items-start gap-2.5 text-sm leading-relaxed text-[#444]">
                                <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" strokeWidth={2.5} />
                                {label}
                            </li>
                        ))}
                    </ul>

                    <button
                        type="button"
                        onClick={async () => {
                            try {
                                await startOnboarding();
                            } catch (err: any) {
                                // 🛡️ Round 28 Sprint US: antes el catch tragaba el error y mostraba un
                                // toast genérico. Ahora extraemos el mensaje real del backend (que ya
                                // contiene el StripeError.Message si aplica, p.ej. "You cannot request the
                                // `transfers` capability without `card_payments` for US"). Si no hay
                                // mensaje útil, caemos al texto amigable original.
                                const detail = err?.message && !err.message.includes('status 401')
                                    ? err.message
                                    : 'No se pudo iniciar la configuración de pagos. Inténtalo en unos minutos.';
                                showToast('error', detail);
                            }
                        }}
                        disabled={isStartingOnboarding}
                        className="sd-btn-primary w-full gap-2 disabled:cursor-wait"
                    >
                        {isStartingOnboarding ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Conectando con Stripe…
                            </>
                        ) : (
                            <>
                                <CreditCard className="h-4 w-4" />
                                Configurar pagos con Stripe
                            </>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate('/expert-panel')}
                        className="block w-full text-center text-sm font-semibold text-[#6a6a6a] hover:text-[#1c1c1c]"
                    >
                        Configurar más tarde
                    </button>
                </div>
            </div>

            <p className="text-center text-xs leading-relaxed text-[#9ca3af]">
                Necesitas conectar Stripe antes de poder aceptar encargos.
            </p>
        </div>
    );

    const renderCoverageBlock = () => (
        <div className="space-y-5">
            <BecomeExpertStepHeader
                title="Dónde y cuándo trabajas"
                description="Zona de cobertura (100 km) y disponibilidad horaria para recibir encargos."
            />

            <div className={BE_CARD_CLASS}>
                <div className="space-y-3 p-4 sm:p-5">
                    <div className="flex items-baseline justify-between gap-3">
                        <label htmlFor="be-address-search" className="text-sm font-semibold text-[#1c1c1c]">
                            Zona de cobertura
                        </label>
                        <span className="rounded-md bg-brand/[0.08] px-2 py-0.5 text-xs font-medium text-brand">
                            Radio 100 km
                        </span>
                    </div>
                    <div className="relative">
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" />
                            <input
                                id="be-address-search"
                                ref={searchInputRef}
                                type="text"
                                role="combobox"
                                aria-expanded={showAutocomplete}
                                aria-autocomplete="list"
                                aria-controls="be-address-listbox"
                                placeholder="Buscar dirección o ciudad…"
                                value={searchAddress}
                                onChange={(e) => setSearchAddress(e.target.value)}
                                onFocus={() => {
                                    if (autocompleteResults.length > 0) setShowAutocomplete(true);
                                }}
                                onBlur={() => {
                                    window.setTimeout(() => setShowAutocomplete(false), 180);
                                }}
                                className={`${BE_INPUT_CLASS} pl-10 pr-10`}
                            />
                            {isSearching && (
                                <Loader2 className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[#9ca3af]" />
                            )}
                        </div>
                        {showAutocomplete && autocompleteResults.length > 0 && (
                            <ul
                                id="be-address-listbox"
                                className="absolute z-30 mt-2 max-h-72 w-full overflow-y-auto rounded-lg bg-white py-1 shadow-[0_16px_48px_rgba(0,0,0,0.12)]"
                                role="listbox"
                            >
                                {autocompleteResults.map((item) => (
                                    <li key={item.id} role="option">
                                        <button
                                            type="button"
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                handleSelectAutocomplete(item);
                                            }}
                                            className="flex w-full items-start gap-2.5 px-4 py-2.5 text-left transition-colors hover:bg-[#f0f6fc]"
                                        >
                                            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium text-[#1c1c1c]">{item.address}</p>
                                                {item.locationName && item.locationName !== 'Ubicación' && (
                                                    <p className="truncate text-xs text-[#6a6a6a]">{item.locationName}</p>
                                                )}
                                            </div>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                        {!showAutocomplete &&
                            searchAddress.trim().length >= 3 &&
                            autocompleteStatus === 'empty' &&
                            !isSearching && (
                                <p className="mt-2 text-xs text-[#6a6a6a]" role="status">
                                    No hay resultados. Prueba con otra ciudad o mueve el marcador en el mapa.
                                </p>
                            )}
                        {autocompleteStatus === 'error' && (
                            <p className="mt-2 text-xs text-amber-800" role="alert">
                                No pudimos buscar direcciones. Usa el mapa o inténtalo de nuevo.
                            </p>
                        )}
                    </div>

                    {detectingCountry ? (
                        <p className="flex items-center gap-2 text-xs text-[#6a6a6a]">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Detectando país para pagos…
                        </p>
                    ) : detectedCountry ? (
                        <p
                            className={`text-xs leading-relaxed ${
                                detectedCountry.supported ? 'text-[#444]' : 'text-amber-900'
                            }`}
                            role="status"
                        >
                            {detectedCountry.supported ? (
                                <>
                                    Cuenta de pagos en{' '}
                                    <strong>{formatPayoutCountryLabel(detectedCountry.code)}</strong>. No se puede
                                    cambiar después; mueve el marcador si no es correcto.
                                </>
                            ) : (
                                <>
                                    {formatPayoutCountryLabel(detectedCountry.code)} no admite cobros en la plataforma.
                                    Coloca el marcador en EEE, UK, CH, EE. UU. o Canadá.
                                </>
                            )}
                        </p>
                    ) : stepAttempted[2] && formData.latitude && formData.longitude ? (
                        <p className="text-xs text-amber-800" role="alert">
                            No detectamos el país en este punto. Mueve el marcador o busca otra dirección.
                        </p>
                    ) : null}

                    {!MAPBOX_TOKEN && (
                        <p className="text-xs text-[#6a6a6a]">
                            Sin búsqueda por dirección: haz clic en el mapa o arrastra el marcador.
                        </p>
                    )}
                </div>

                <LazyMount aspectRatio="16/9" minHeight={220}>
                    <Suspense fallback={null}>
                        <BecomeExpertCoverageMap
                            latitude={selectedLocation.lat}
                            longitude={selectedLocation.lng}
                            radiusKm={workRadiusKm}
                            onLocationChange={applyLocation}
                        />
                    </Suspense>
                </LazyMount>

                {/* Rango de trabajo del experto (0 = solo en su taller) */}
                <div className="space-y-2 border-t border-[#ececec] p-4 sm:p-5">
                    <div className="flex items-baseline justify-between gap-3">
                        <label htmlFor="be-work-radius" className="text-sm font-semibold text-[#1c1c1c]">
                            Rango de trabajo
                        </label>
                        <span className="text-sm font-medium text-[#1c1c1c]">
                            {workRadiusKm === 0 ? 'Solo en mi taller' : `${workRadiusKm} km`}
                        </span>
                    </div>
                    <input
                        id="be-work-radius"
                        type="range"
                        min={0}
                        max={200}
                        step={5}
                        value={workRadiusKm}
                        onChange={(e) => setWorkRadiusKm(Number(e.target.value))}
                        className="w-full h-2 rounded-lg accent-blue-700 cursor-pointer"
                        aria-valuetext={workRadiusKm === 0 ? 'Solo en mi taller' : `${workRadiusKm} kilómetros`}
                    />
                    <div className="flex justify-between text-[11px] text-[#9ca3af]">
                        <span>Solo en mi taller</span>
                        <span>200 km</span>
                    </div>
                    <p className="text-xs leading-relaxed text-[#6a6a6a]">
                        Distancia máxima a la que te desplazas desde tu punto fijo. Elige 0 km si solo atiendes
                        en tu taller. Podrás cambiarlo después desde tu perfil.
                    </p>
                </div>

                <div className="space-y-4 border-t border-[#ececec] p-4 sm:p-5">
                    <div className="flex items-baseline justify-between gap-3">
                        <span className="text-sm font-semibold text-[#1c1c1c]">Disponibilidad horaria</span>
                        <span className="text-xs text-[#9ca3af]">Mín. 1 día</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {VALID_DAYS_OF_WEEK.map((day) => {
                            const active = availability.daysOfWeek.includes(day);
                            return (
                                <button
                                    key={day}
                                    type="button"
                                    onClick={() => toggleDay(day)}
                                    aria-pressed={active}
                                    className={`rounded-md px-3.5 py-2 text-sm font-medium transition-colors ${
                                        active ? BE_DAY_ACTIVE : BE_DAY_IDLE
                                    }`}
                                >
                                    {DAY_NAMES_ES[day as keyof typeof DAY_NAMES_ES]}
                                </button>
                            );
                        })}
                    </div>

                    {availability.daysOfWeek.length > 0 && (
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label htmlFor="be-start-time" className="mb-2 block text-xs font-medium text-[#6a6a6a]">
                                    Hora de inicio
                                </label>
                                <input
                                    id="be-start-time"
                                    type="time"
                                    value={availability.startTime}
                                    onChange={(e) =>
                                        setAvailability((prev) => ({ ...prev, startTime: e.target.value }))
                                    }
                                    className={BE_INPUT_CLASS}
                                />
                            </div>
                            <div>
                                <label htmlFor="be-end-time" className="mb-2 block text-xs font-medium text-[#6a6a6a]">
                                    Hora de fin
                                </label>
                                <input
                                    id="be-end-time"
                                    type="time"
                                    value={availability.endTime}
                                    onChange={(e) =>
                                        setAvailability((prev) => ({ ...prev, endTime: e.target.value }))
                                    }
                                    className={BE_INPUT_CLASS}
                                />
                            </div>
                        </div>
                    )}
                    {stepAttempted[2] &&
                        availability.daysOfWeek.length > 0 &&
                        !isTimeRangeValid() && (
                            <p className="text-xs font-medium text-amber-800" role="alert">
                                La hora de fin debe ser posterior a la de inicio.
                            </p>
                        )}
                </div>
            </div>
        </div>
    );

    const renderStepContent = () => {
        if (isOnStripeStage) return renderStripeConnectBlock();

        switch (currentStep) {
            case 1:
                return (
                    <div className="space-y-5">
                        <BecomeExpertTrustStrip />
                        <BecomeExpertStepHeader
                            title="Tu identidad pública"
                            description="La foto y la descripción son lo primero que verán los clientes."
                        />

                        <div className={BE_CARD_CLASS}>
                            <div className="p-4 sm:p-5 lg:grid lg:grid-cols-[minmax(200px,240px)_1fr] lg:gap-6 lg:items-start">
                                <BecomeExpertPhotoField
                                    previewUrl={previewUrl}
                                    onPhotoReady={applyProfilePhoto}
                                />
                                <div className="mt-5 border-t border-[#ececec] pt-5 lg:mt-0 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                                    <label htmlFor="be-description" className="block text-sm font-semibold text-[#1c1c1c]">
                                        Experiencia profesional
                                    </label>
                                    <p className="mt-1 text-xs text-[#6a6a6a]">
                                        Años de experiencia, especialidad y qué incluye tu servicio.
                                    </p>
                                    <textarea
                                        id="be-description"
                                        value={formData.description}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                                        className={`${BE_INPUT_CLASS} mt-3 min-h-[120px] resize-y leading-relaxed sm:min-h-[140px] ${
                                            stepAttempted[1] && (descriptionTrimLen < 30 || descriptionTrimLen > 60) ? 'border-amber-400 focus:border-amber-500 focus:ring-amber-500/25' : ''
                                        }`}
                                        rows={5}
                                        placeholder="Ej.: 8 años revisando vehículos de ocasión. Informes detallados para compradores y concesionarios…"
                                        required
                                        minLength={30}
                                        maxLength={60}
                                        aria-invalid={stepAttempted[1] && (descriptionTrimLen < 30 || descriptionTrimLen > 60)}
                                    />
                                    <div className="mt-2 flex items-center justify-between gap-3 text-xs">
                                        <span className="text-[#6a6a6a]">Entre 30 y 60 caracteres (sin espacios al inicio o final)</span>
                                        <span
                                            className={`font-semibold tabular-nums ${
                                                descriptionTrimLen >= 30 && descriptionTrimLen <= 60 ? 'text-brand' : 'text-[#9ca3af]'
                                            }`}
                                        >
                                            {descriptionTrimLen}/60
                                        </span>
                                    </div>
                                    {stepAttempted[1] && !formData.profilePicture && !existingProfilePictureUrl && (
                                        <p className="mt-2 text-xs font-medium text-amber-800" role="alert">
                                            Añade una foto de perfil para continuar.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 2:
                return renderCoverageBlock();

            case 3:
                // 🎨 Paso 3 — Confirmar: resumen + términos. Tras submit, se transforma
                //    automáticamente en el bloque Stripe (gestionado en el guard de arriba).
                return (
                    <div className="space-y-6">
                        <BecomeExpertStepHeader
                            title="Revisa y publica tu perfil"
                            description="Confirma que todo está correcto. Después conectarás Stripe para recibir pagos."
                        />

                        <ul className={`${BE_CARD_CLASS} divide-y divide-[#ececec] p-0`}>
                            {[
                                { ok: !!formData.profilePicture || !!existingProfilePictureUrl, label: 'Foto de perfil' },
                                {
                                    ok: descriptionTrimLen >= 30 && descriptionTrimLen <= 60,
                                    label: `Descripción (${descriptionTrimLen} caracteres)`,
                                },
                                {
                                    ok: !!(formData.latitude && formData.longitude && detectedCountry?.supported),
                                    label: detectedCountry?.supported
                                        ? `Zona · ${formatPayoutCountryLabel(detectedCountry.code)}`
                                        : 'Zona de cobertura y país',
                                },
                                {
                                    ok: availability.daysOfWeek.length > 0 && isTimeRangeValid(),
                                    label: `Disponibilidad (${availability.daysOfWeek.length} día${availability.daysOfWeek.length === 1 ? '' : 's'})`,
                                },
                            ].map((item) => (
                                <li key={item.label} className="flex items-center gap-3 px-4 py-3 text-sm">
                                    <Check
                                        className={`h-4 w-4 shrink-0 ${item.ok ? 'text-brand' : 'text-[#d1d5db]'}`}
                                        strokeWidth={2.5}
                                        aria-hidden
                                    />
                                    <span className={item.ok ? 'text-[#1c1c1c]' : 'text-[#9ca3af]'}>{item.label}</span>
                                </li>
                            ))}
                        </ul>

                        <div className={`${BE_CARD_CLASS} space-y-4 p-4 sm:p-5`}>
                            <label htmlFor="acceptTerms" className="flex cursor-pointer items-start gap-3">
                                <input
                                    type="checkbox"
                                    id="acceptTerms"
                                    checked={acceptTerms}
                                    onChange={(e) => setAcceptTerms(e.target.checked)}
                                    className="mt-1 h-4 w-4 shrink-0 cursor-pointer rounded text-brand focus:ring-brand/30"
                                    required
                                />
                                <span className="text-[15px] leading-relaxed text-[#1c1c1c]">
                                    Acepto los{' '}
                                    <a
                                        href="/terms.html"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`font-semibold text-brand ${HP_LINK_UNDERLINE_CLASS}`}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        términos de uso
                                    </a>{' '}
                                    y la{' '}
                                    <a
                                        href="/privacy-policy.html"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`font-semibold text-brand ${HP_LINK_UNDERLINE_CLASS}`}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        política de privacidad
                                    </a>
                                    .
                                </span>
                            </label>
                        </div>

                        {error && errorCode !== 'ACTIVE_HIRES_AS_CLIENT' && !error.includes('contrataciones activas') && !error.includes('contratación(es) activa(s)') && (
                            <div className={`${BE_CARD_CLASS} border-red-200 bg-red-50/80 px-4 py-3`}>
                                <div className="mb-1 flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />
                                    <span className="text-sm font-semibold text-red-900">
                                        {errorCode === 'COUNTRY_NOT_SUPPORTED'
                                            ? `País no disponible${apiDetectedCountry ? ` (${apiDetectedCountry})` : ''}`
                                            : errorCode === 'COUNTRY_DETECTION_FAILED'
                                            ? 'No pudimos verificar tu ubicación'
                                            : errorCode === 'PROFILE_PICTURE_UPLOAD_FAILED'
                                            ? 'Error al subir tu foto'
                                            : errorCode === 'AVAILABILITY_CREATION_FAILED'
                                            ? 'Error al guardar tu disponibilidad'
                                            : errorCode === 'DATABASE_ERROR' || errorCode === 'INTERNAL_ERROR'
                                            ? 'Error temporal del servidor'
                                            : 'Error al procesar la solicitud'}
                                    </span>
                                </div>
                                <p className="mt-1 text-sm leading-relaxed text-red-800">{error}</p>
                                {errorCode === 'COUNTRY_NOT_SUPPORTED' && (
                                    <div className="mt-3 flex flex-col gap-1">
                                        <button
                                            type="button"
                                            onClick={() => { setStepOverride(2); setCurrentStep(2); }}
                                            className="text-sm font-semibold text-red-700 hover:text-red-900 underline self-start"
                                        >
                                            Cambiar ubicación
                                        </button>
                                        <a
                                            href="mailto:soporte@inspecciono.io?subject=Solicitud%20pa%C3%ADs%20no%20soportado"
                                            className="text-sm font-semibold text-red-700 hover:text-red-900 underline self-start"
                                        >
                                            Contactar soporte
                                        </a>
                                    </div>
                                )}
                                {(errorCode === 'COUNTRY_DETECTION_FAILED' || errorCode === 'PROFILE_PICTURE_UPLOAD_FAILED' || errorCode === 'DATABASE_ERROR' || errorCode === 'INTERNAL_ERROR') && (
                                    <p className="text-xs text-red-600 mt-2 italic">
                                        Si el problema persiste, contacta con soporte indicando el código: <code className="px-1 py-0.5 bg-red-100 rounded">{errorCode}</code>
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                );

            default:
                return null;
        }
    };

    // ✅ Round 30: el guard "ya eres experto" desapareció como vista separada.
    //    Si llegas como experto pendiente de Stripe, el useEffect de arriba te lleva al
    //    paso 3 del MISMO wizard y `renderStepContent` muestra el bloque Stripe inline
    //    (mismo flujo visual, sin saltos a otra página).
    //
    //    Una vez `submitted=true` (acabas de completar el formulario) o estás siendo
    //    redirigido como experto pendiente, el shell debe ocultar el botón "Completar
    //    registro" — porque ya no hay nada que enviar, solo conectar Stripe.
    // ─────────────────────────────────────────────────────────────────────────
    // 🧩 STRIPE-FIRST: para altas NUEVAS (no experto aún, no mudanza) saltamos el
    // wizard largo: solo eliges PAÍS (inmutable en Stripe) y conectas Stripe ya.
    // El resto del perfil (foto, descripción, ubicación, disponibilidad) se rellena
    // después en el panel de experto — y NO eres visible hasta completarlo.
    // El wizard completo se conserva para el flujo de mudanza (isRelocating).
    // ─────────────────────────────────────────────────────────────────────────
    // 🛡️ Escape del loader infinito: el shell muestra initialLoading mientras
    // isAlreadyExpert && !profile, pero si fetchProfile FALLA (red caída, 500) el
    // profile se queda null para siempre y el efecto de carga no re-dispara (sus
    // deps no cambian) → el experto que volvía con el onboarding a medias quedaba
    // atrapado en un spinner sin salida. fetchProfile(true) limpia profileError al
    // empezar, así el retry vuelve al loader y de ahí al wizard o de nuevo aquí.
    if (isAlreadyExpert && !profile && profileError) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-white">
                <ErrorDisplay
                    message="No se pudo cargar tu perfil de experto. Revisa tu conexión e inténtalo de nuevo."
                    onRetry={() => { void fetchProfile(true); }}
                    fullScreen={false}
                />
            </div>
        );
    }

    if (!isAlreadyExpert && !isRelocating) {
        const sortedCountries = Array.from(SUPPORTED_PAYOUT_COUNTRIES)
            .sort((a, b) => formatPayoutCountryLabel(a).localeCompare(formatPayoutCountryLabel(b), 'es'));
        const submitMinimal = async () => {
            const token = authService.getAccessToken();
            if (!token) { navigate('/login'); return; }
            setFastPathSubmitting(true); setFastPathError(null);
            try {
                const res = await fetch(`${API_CONFIG.baseUrl}/api/User/become-expert-minimal`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ country: fastPathCountry }),
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) throw new Error(data?.message || 'No se pudo completar el alta.');

                // CRÍTICO: el rol ya cambió a Expert en BD, pero el access token en uso
                // sigue diciendo Client → el endpoint expert-onboarding daría 403. Pedimos
                // un token FRESCO vía el refresh estándar (lee el rol actual de BD y lo
                // guarda en las claves correctas de authService: accessToken + userData).
                await authService.refreshAccessToken();
                const freshToken = authService.getAccessToken();

                // 🧩 STRIPE-FIRST: ir DIRECTO al onboarding de Stripe (sin pantalla
                // intermedia). Creamos la cuenta Connect y redirigimos a su URL de KYC.
                try {
                    const onbRes = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.subscription.expertOnboarding}`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${freshToken}`, 'Content-Type': 'application/json' },
                    });
                    const onb = await onbRes.json().catch(() => ({}));
                    if (onbRes.ok && onb?.url) {
                        window.location.href = onb.url; // → formulario de Stripe
                        return;
                    }
                } catch { /* si falla, caemos al bloque manual de la página */ }

                // Fallback: recargar y mostrar el bloque "Conecta Stripe" con su botón.
                window.location.reload();
            } catch (e: unknown) {
                setFastPathError((e as Error)?.message || 'No se pudo completar el alta.');
                setFastPathSubmitting(false);
            }
        };
        return (
            <>
            <SEO
                title="Hazte experto en Inspecciono · Cobra inspecciones pre-compra | Inspecciono"
                description="Mecánico, perito o técnico: revisiones presenciales y online antes de comprar. Conecta Stripe y completa tu perfil."
                canonical="/become-expert"
            />
            <BecomeExpertFastPathShell
                onBack={() => navigate(-1)}
                footer={
                    <div className="space-y-2.5">
                        <div className="be-fast-form-field">
                            <label htmlFor="fast-country-m" className="be-fast-form-label">
                                ¿Dónde trabajarás?
                            </label>
                            <div className="relative">
                                <span className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-[18px] w-6 -translate-y-1/2 overflow-hidden rounded-[3px] ring-1 ring-black/10">
                                    <span
                                        className={`fi fi-${fastPathCountry.toLowerCase()} !block !h-full !w-full`}
                                        aria-hidden
                                    />
                                </span>
                                <select
                                    id="fast-country-m"
                                    value={fastPathCountry}
                                    onChange={(e) => setFastPathCountry(e.target.value)}
                                    className={`${BE_FAST_SELECT_CLASS} pl-12 pr-10`}
                                >
                                    {sortedCountries.map((code) => (
                                        <option key={code} value={code}>{formatPayoutCountryLabel(code)}</option>
                                    ))}
                                </select>
                                <ChevronDown
                                    className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                                    aria-hidden
                                />
                            </div>
                            <p className="be-fast-form-hint">
                                Operamos en todo el mundo. Tu país de cobro debe coincidir con el de trabajo y no se puede cambiar.
                            </p>
                        </div>
                        {fastPathError && (
                            <p className="text-sm text-red-600" role="alert">{fastPathError}</p>
                        )}
                        <button
                            type="button"
                            onClick={submitMinimal}
                            disabled={fastPathSubmitting}
                            aria-busy={fastPathSubmitting}
                            className={BE_FAST_PRIMARY_BTN_CLASS}
                        >
                            {fastPathSubmitting ? (
                                'Creando tu alta…'
                            ) : (
                                <>
                                    Continuar con Stripe
                                    <ArrowRight
                                        className="h-4 w-4 shrink-0 text-white/70 transition-transform group-hover:translate-x-0.5"
                                        strokeWidth={2.4}
                                    />
                                </>
                            )}
                        </button>
                    </div>
                }
            >
                <div className="be-fast-form">
                    {/* Formulario alineado a la izquierda del panel derecho de la tarjeta:
                        título → explicación del alta → un campo → Stripe. */}
                    <div>
                        <h1 className="font-display text-[1.6rem] font-semibold leading-tight tracking-[-0.025em] text-slate-900">
                            Crea tu cuenta de cobros
                        </h1>
                        <p className="mt-3 text-sm leading-relaxed text-slate-600">
                            Vas a darte de alta como experto en Inspecciono. Con tu país creamos tu cuenta de
                            cobros en Stripe, que verifica tu identidad y se encarga de que el dinero de cada
                            inspección llegue a tu banco.
                        </p>
                        <p className="mt-3 text-sm leading-relaxed text-slate-600">
                            Después completas tu perfil desde el panel: foto, descripción, zona de cobertura,
                            horarios y los servicios que ofreces. Sin coste de alta ni cuota mensual: solo hay
                            comisión cuando cobras.
                        </p>
                    </div>

                    <div className="be-fast-form-field">
                        <label htmlFor="fast-country" className="be-fast-form-label">
                            ¿En qué país trabajas?
                        </label>
                        <div className="relative">
                            <span className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-[18px] w-6 -translate-y-1/2 overflow-hidden rounded-[3px] ring-1 ring-black/10">
                                <span
                                    className={`fi fi-${fastPathCountry.toLowerCase()} !block !h-full !w-full`}
                                    aria-hidden
                                />
                            </span>
                            <select
                                id="fast-country"
                                value={fastPathCountry}
                                onChange={(e) => setFastPathCountry(e.target.value)}
                                className={`${BE_FAST_SELECT_CLASS} pl-12 pr-10`}
                            >
                                {sortedCountries.map((code) => (
                                    <option key={code} value={code}>{formatPayoutCountryLabel(code)}</option>
                                ))}
                            </select>
                            <ChevronDown
                                className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                                aria-hidden
                            />
                        </div>
                        <p className="be-fast-form-hint">
                            Es también tu país de cobro y no se puede cambiar después.
                        </p>
                    </div>

                    {fastPathError && (
                        <p className="text-sm text-red-600" role="alert">{fastPathError}</p>
                    )}

                    <div>
                        <button
                            type="button"
                            onClick={submitMinimal}
                            disabled={fastPathSubmitting}
                            aria-busy={fastPathSubmitting}
                            className={BE_FAST_PRIMARY_BTN_CLASS}
                        >
                            {fastPathSubmitting ? (
                                'Creando tu alta…'
                            ) : (
                                <>
                                    Continuar con Stripe
                                    <ArrowRight
                                        className="h-4 w-4 shrink-0 text-white/70 transition-transform group-hover:translate-x-0.5"
                                        strokeWidth={2.4}
                                    />
                                </>
                            )}
                        </button>
                        <FastPathButtonNote />
                    </div>
                </div>
            </BecomeExpertFastPathShell>
            </>
        );
    }

    return (
        <>
        <SEO
            title="Hazte experto en Inspecciono · Cobra inspecciones pre-compra | Inspecciono"
            description="Mecánico, perito o técnico: monta tu ficha en Inspecciono y empieza a cobrar inspecciones pre-compra con Stripe. Verificación rápida, sin coste de alta."
            canonical="/become-expert"
            ogTitle="Hazte experto verificado en Inspecciono"
            ogDescription="Inspecciones pre-compra para clientes que pagan en escrow. Tú fijas precio y zona. Comisión transparente, sin alta."
            jsonLd={[
                breadcrumbSchema([
                    { name: 'Inicio', url: '/' },
                    { name: 'Hazte experto', url: '/become-expert' },
                ]),
            ]}
        />
        <BecomeExpertWizardShell
            steps={STEPS}
            currentStep={currentStep}
            onBack={() => navigate(-1)}
            onNavBack={handleBack}
            onNext={handleNext}
            onSubmit={handleFinalSubmit}
            canGoNext={canAdvance}
            canSubmit={canAdvance && acceptTerms && !isSubmitting}
            isSubmitting={isSubmitting}
            isLastStep={currentStep === STEPS.length && !isOnStripeStage}
            hideFooter={isOnStripeStage}
            progressPhaseLabel={isOnStripeStage ? 'Conectar pagos con Stripe' : undefined}
            footerHint={footerHint}
            initialLoading={isCheckingOnboarding}
        >
            {renderStepContent()}
        </BecomeExpertWizardShell>
        </>
    );
}

export default BecomeExpertPage;
export { BecomeExpertPage };
