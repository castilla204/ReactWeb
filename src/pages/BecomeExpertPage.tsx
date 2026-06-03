// 🛡️ Round 28: migración Google Maps → Mapbox geocoding + MapLibre interactive map.
// El proyecto NO tiene `react-map-gl` ni `mapbox-gl` en package.json: usa `maplibre-gl`
// (renderizado) con tiles Carto + la API REST de Mapbox para geocoding (igual que el
// resto de pantallas migradas — ver `ServiceDetailCoverageMap.tsx`).
import { useRef, useState, useEffect, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-csp-worker?url';
import 'maplibre-gl/dist/maplibre-gl.css';
import { ArrowLeft, Loader2, AlertTriangle, MapPin, Check, Search, CreditCard } from 'lucide-react';
import {
    BecomeExpertWizardShell,
    BecomeExpertStepHeader,
    BE_INPUT_CLASS,
    BE_SECTION_CLASS,
    BE_DAY_ACTIVE,
    BE_DAY_IDLE,
} from '../components/becomeExpert/BecomeExpertShell';
import { BecomeExpertPhotoField } from '../components/becomeExpert/BecomeExpertPhotoField';
import { HP_PANEL_GRADIENT, hpIconButtonClass } from '../constants/homepageTypography';
import { useNavigate } from 'react-router-dom';
import { useBecomeExpert } from '../hooks/useBecomeExpert';
import { VALID_DAYS_OF_WEEK, DAY_NAMES_ES } from '../types/stripe';
import { AvailabilityFormData } from '../hooks/useExpertProfile';
import { showToast } from '../lib/toast';
import { useAuth } from '../contexts/AuthContext';
import { useExpert } from '../hooks/useExpert';
// 🛡️ Round 28: helpers compartidos para tiles Carto + círculo en GeoJSON
import { boundsFromCircle, circlePolygonGeoJSON } from '../utils/geoCircle';
import { getCartoVoyagerNoLabelsTiles, isExternalMapTileUrl } from '../utils/mapTileUrls';
// 🛡️ Round 28: autocomplete y reverse geocoding vía Mapbox REST (token VITE_MAPBOX_ACCESS_TOKEN)
import { searchMapboxAutocomplete, MapboxAutocompleteItem } from '../utils/mapboxGeocoding';
// 🛡️ Round 28: worker MapLibre global (idempotente entre montajes)
maplibregl.setWorkerUrl(maplibreWorkerUrl);

const defaultCenter = {
    lat: 40.4168,
    lng: -3.7038,
};

// Radio de cobertura del experto (km). Antes era 100000 m con google.maps.Circle;
// ahora generamos el polígono GeoJSON con el mismo radio.
const COVERAGE_RADIUS_KM = 100;

// 🛡️ Round 28: tema visual equivalente al `circleOptions` previo (azul corporativo translúcido)
const MAP_THEME = {
    sky: '#dce9f2',
    brand: 'rgb(30, 64, 175)',
    brandStroke: 'rgba(30, 64, 175, 0.5)',
    brandFill: 'rgba(30, 64, 175, 0.15)',
} as const;

// Espejo de newApi.Common.SupportedConnectCountries (backend). Solo para aviso temprano:
// EEA-27 + NO/LI + US/CA/GB/CH (IS fuera). La validación REAL la hace el backend.
const SUPPORTED_PAYOUT_COUNTRIES = new Set<string>([
    'AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT',
    'LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE','NO','LI',
    'US','CA','GB','CH',
]);

// 🛡️ Round 28: zoom de inicio para 100 km de radio (similar al getZoomLevel previo)
const INITIAL_ZOOM = 7;

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

const BE_CHECKOUT_CARD =
    'overflow-hidden rounded-xl border border-[#e8e8e8] bg-white shadow-sm';

// 🛡️ Round 28: estilo MapLibre con tiles Carto Voyager (sin labels) — mismo que el mapa de servicios.
function buildCartoStyle(): maplibregl.StyleSpecification {
    return {
        version: 8,
        sources: {
            carto: {
                type: 'raster',
                tiles: getCartoVoyagerNoLabelsTiles(),
                tileSize: 256,
                attribution: '© OpenStreetMap · CARTO',
            },
        },
        layers: [
            { id: 'sky-bg', type: 'background', paint: { 'background-color': MAP_THEME.sky } },
            { id: 'carto', type: 'raster', source: 'carto', paint: { 'raster-opacity': 1 } },
        ],
    };
}

// 🛡️ Round 28: token Mapbox para el geocoder (no para tiles).
// Mantenemos compatibilidad con ambas convenciones (PUBLIC_TOKEN y ACCESS_TOKEN).
const MAPBOX_TOKEN: string | undefined =
    import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN || import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

function BecomeExpertPage() {
    const navigate = useNavigate();
    const searchInputRef = useRef<HTMLInputElement>(null);
    // 🛡️ Round 28: capturamos errorCode + detectedCountry para mostrar UX específica
    // (en vez del mensaje fósil "Google Cloud Storage configuration issue").
    // ✅ Round 30: `submitted` permite mostrar el bloque Stripe inline sin navegar.
    const { formData, previewUrl, isSubmitting, error, errorCode, detectedCountry, submitted,
            applyProfilePhoto, handleSubmit, setFormData } = useBecomeExpert();
    const { user } = useAuth();
    const { startOnboarding, isStartingOnboarding, checkOnboardingStatus } = useExpert();
    const isAlreadyExpert =
        user?.role === 'Expert' ||
        user?.Role === 'Expert' ||
        user?.role === 'expert' ||
        user?.Role === 'EXPERT' ||
        Number(user?.role) === 1;

    // Si ya eres experto pero no completaste Stripe, NO mostramos el formulario (daría "ya eres experto"):
    // ✅ Round 30: si ya completaste Stripe → al panel. Si no → saltamos al paso 3 del MISMO
    //    wizard, que renderiza el bloque Stripe inline (sin vista separada de "ya casi eres experto").
    useEffect(() => {
        if (!isAlreadyExpert) return;
        checkOnboardingStatus(true)
            .then((status) => {
                if (status?.onboardingCompleted) {
                    navigate('/expert-panel', { replace: true });
                } else {
                    // Saltar al último paso, que mostrará el bloque Stripe automáticamente.
                    setCurrentStep(3);
                }
            })
            .catch(() => {});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAlreadyExpert]);

    const [selectedLocation, setSelectedLocation] = useState(defaultCenter);
    const [searchAddress, setSearchAddress] = useState<string>('');
    const [acceptTerms, setAcceptTerms] = useState<boolean>(false);
    const [acceptNotifications, setAcceptNotifications] = useState<boolean>(false);
    const [availability, setAvailability] = useState<AvailabilityFormData>({
        daysOfWeek: [],
        startTime: '09:00',
        endTime: '18:00',
    });
    const [currentStep, setCurrentStep] = useState(1);

    // 🛡️ Round 28: estado para autocomplete de direcciones (Mapbox forward geocoding).
    const [autocompleteResults, setAutocompleteResults] = useState<MapboxAutocompleteItem[]>([]);
    const [showAutocomplete, setShowAutocomplete] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const autocompleteAbortRef = useRef<AbortController | null>(null);

    // 🛡️ Round 28: refs del mapa MapLibre — sustituyen al `useState<google.maps.Map>` previo.
    const mapWrapperRef = useRef<HTMLDivElement>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);
    const markerRef = useRef<maplibregl.Marker | null>(null);
    const [mapReady, setMapReady] = useState(false);
    const [mapError, setMapError] = useState<string | null>(null);

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

    // 🛡️ Round 28: helper centralizado para actualizar ubicación, marker, círculo y formData.
    // Reemplaza al antiguo `updateLocationAndMap` + `onMapClick` + `handleMapClick`.
    const applyLocation = useCallback((lat: number, lng: number, options?: { fitBounds?: boolean; panTo?: boolean }) => {
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

        const next = { lat, lng };
        setSelectedLocation(next);
        setFormData((prev) => ({
            ...prev,
            latitude: lat.toString(),
            longitude: lng.toString(),
        }));

        const map = mapRef.current;
        if (!map) return;

        // Actualizar marker
        if (markerRef.current) {
            markerRef.current.setLngLat([lng, lat]);
        }

        // Actualizar polígono del círculo de cobertura
        const src = map.getSource('coverage') as maplibregl.GeoJSONSource | undefined;
        if (src) {
            src.setData(circlePolygonGeoJSON(lng, lat, COVERAGE_RADIUS_KM));
        }

        // Mover cámara
        if (options?.fitBounds) {
            map.fitBounds(boundsFromCircle(lng, lat, COVERAGE_RADIUS_KM), {
                padding: 40,
                duration: 600,
                maxZoom: 9,
            });
        } else if (options?.panTo !== false) {
            map.easeTo({ center: [lng, lat], duration: 400 });
        }
    }, [setFormData]);

    // 🛡️ Round 28: inicialización del mapa MapLibre — sustituye `useLoadScript` + `<GoogleMap onLoad>`.
    useEffect(() => {
        const el = mapContainerRef.current;
        const wrapper = mapWrapperRef.current;
        if (!el || !wrapper) return;
        // ✅ Round 30: el mapa vive ahora en el paso 2 (Cobertura), no en el 3.
        if (currentStep !== 2) return;
        if (mapRef.current) return;

        let cancelled = false;

        const initMap = () => {
            if (cancelled || mapRef.current) return;
            if (wrapper.clientWidth < 2 || wrapper.clientHeight < 2) return;

            try {
                const initialLngLat: [number, number] = [
                    selectedLocationRef.current.lng,
                    selectedLocationRef.current.lat,
                ];

                const map = new maplibregl.Map({
                    container: el,
                    style: buildCartoStyle(),
                    center: initialLngLat,
                    zoom: INITIAL_ZOOM,
                    minZoom: 3,
                    maxZoom: 14,
                    pitch: 0,
                    bearing: 0,
                    attributionControl: false,
                    interactive: true,
                    dragRotate: false,
                    pitchWithRotate: false,
                    touchPitch: false,
                    boxZoom: false,
                    transformRequest: (url, resourceType) => {
                        if (resourceType === 'Tile' && isExternalMapTileUrl(url)) {
                            return { url, credentials: 'omit' };
                        }
                        return { url };
                    },
                });

                mapRef.current = map;

                map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-left');
                map.addControl(
                    new maplibregl.NavigationControl({ visualizePitch: false, showCompass: false }),
                    'top-right',
                );

                const onLoad = () => {
                    if (cancelled || !mapRef.current) return;

                    // 🛡️ Round 28: pintamos el círculo de cobertura como capa fill+line (equivalente al google.maps.Circle).
                    const initialCircle = circlePolygonGeoJSON(
                        selectedLocationRef.current.lng,
                        selectedLocationRef.current.lat,
                        COVERAGE_RADIUS_KM,
                    );
                    if (!map.getSource('coverage')) {
                        map.addSource('coverage', { type: 'geojson', data: initialCircle });
                        map.addLayer({
                            id: 'coverage-fill',
                            type: 'fill',
                            source: 'coverage',
                            paint: {
                                'fill-color': MAP_THEME.brand,
                                'fill-opacity': 0.15,
                            },
                        });
                        map.addLayer({
                            id: 'coverage-line',
                            type: 'line',
                            source: 'coverage',
                            paint: {
                                'line-color': MAP_THEME.brandStroke,
                                'line-width': 2,
                            },
                        });
                    }

                    // 🛡️ Round 28: marker draggable — reemplaza al `<Marker>` de @react-google-maps/api.
                    const pin = document.createElement('div');
                    pin.style.cssText =
                        'width:14px;height:14px;border-radius:50%;background:' +
                        MAP_THEME.brand +
                        ';border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.25);cursor:grab';
                    markerRef.current?.remove();
                    const marker = new maplibregl.Marker({ element: pin, anchor: 'center', draggable: true })
                        .setLngLat(initialLngLat)
                        .addTo(map);
                    marker.on('dragend', () => {
                        const lngLat = marker.getLngLat();
                        applyLocation(lngLat.lat, lngLat.lng, { panTo: false });
                    });
                    markerRef.current = marker;

                    setMapReady(true);
                };

                map.once('load', onLoad);
                if (map.loaded()) onLoad();

                // 🛡️ Round 28: click en el mapa → reposiciona marker + círculo (era `onMapClick`).
                map.on('click', (e) => {
                    const { lat, lng } = e.lngLat;
                    applyLocation(lat, lng, { panTo: false });
                });
            } catch (err) {
                console.error('[BecomeExpert] No se pudo inicializar el mapa', err);
                setMapError('No se pudo cargar el mapa. Recarga la página.');
            }
        };

        const ro = new ResizeObserver(() => {
            mapRef.current?.resize();
            if (!mapRef.current) initMap();
        });
        ro.observe(wrapper);
        initMap();

        return () => {
            cancelled = true;
            ro.disconnect();
            markerRef.current?.remove();
            markerRef.current = null;
            mapRef.current?.remove();
            mapRef.current = null;
            setMapReady(false);
        };
    }, [currentStep, applyLocation]);

    // 🛡️ Round 28: autocomplete con debounce 350ms (reemplaza al google.maps.places.Autocomplete).
    useEffect(() => {
        const query = searchAddress.trim();
        if (query.length < 3) {
            setAutocompleteResults([]);
            setShowAutocomplete(false);
            setIsSearching(false);
            return;
        }
        if (!MAPBOX_TOKEN) {
            // Sin token no podemos hacer autocomplete — silenciamos resultados.
            setAutocompleteResults([]);
            setShowAutocomplete(false);
            return;
        }

        setIsSearching(true);
        // Abortamos request anterior (UX: solo mostramos los últimos resultados).
        autocompleteAbortRef.current?.abort();
        const controller = new AbortController();
        autocompleteAbortRef.current = controller;

        const timer = window.setTimeout(async () => {
            try {
                // Marketplace global → sin restricción de país (igual que el comportamiento Google previo).
                const items = await searchMapboxAutocomplete(query);
                if (controller.signal.aborted) return;
                setAutocompleteResults(items);
                setShowAutocomplete(items.length > 0);
            } catch (err) {
                if (!controller.signal.aborted) {
                    console.warn('[BecomeExpert] autocomplete falló', err);
                    setAutocompleteResults([]);
                    setShowAutocomplete(false);
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
        if (countryCode && !SUPPORTED_PAYOUT_COUNTRIES.has(countryCode)) {
            showToast(
                'error',
                'Tu país aún no puede recibir pagos en la plataforma, por lo que no podrás cobrar como experto. Elige otra ubicación o contacta con soporte.',
                9000,
            );
        }
        applyLocation(item.lat, item.lng, { fitBounds: true });
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

    const canGoNext = () => {
        switch (currentStep) {
            case 1:
                // ✅ Identidad: foto + descripción ≥ 50 caracteres.
                return !!formData.profilePicture && formData.description.trim().length >= 50;
            case 2: {
                // ✅ Cobertura: ubicación válida + disponibilidad coherente.
                if (!(formData.latitude && formData.longitude)) return false;
                if (availability.daysOfWeek.length === 0) return false;
                if (!availability.startTime || !availability.endTime) return false;
                const [startH, startM] = availability.startTime.split(':').map(Number);
                const [endH, endM] = availability.endTime.split(':').map(Number);
                if (Number.isNaN(startH) || Number.isNaN(endH)) return false;
                return startH * 60 + startM < endH * 60 + endM;
            }
            case 3:
                // ✅ Confirmar: términos aceptados (Stripe se conecta DESPUÉS del submit).
                return acceptTerms;
            default:
                return false;
        }
    };

    const handleNext = () => {
        if (canGoNext() && currentStep < STEPS.length) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
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
        <div className="space-y-6">
            <BecomeExpertStepHeader
                title="Conecta tus cobros con Stripe"
                description="Configura tu cuenta de pagos para recibir encargos. Es el último paso antes de publicar tu perfil."
            />

            <div className={BE_CHECKOUT_CARD}>
                <div className="border-b border-[#ececec] px-5 py-4 sm:px-6">
                    <p className="text-sm font-semibold text-[#1c1c1c]">Tu perfil está creado</p>
                    <p className="mt-1 text-sm text-[#6a6a6a]">Solo falta conectar la cuenta de cobros.</p>
                </div>

                <div className="space-y-5 px-5 py-6 sm:px-6">
                    <ul className="space-y-3">
                        {[
                            'Cobros protegidos por Stripe.',
                            'Unos 5 minutos; solo se hace una vez.',
                            'Sin coste para ti; los pagos llegan a tu cuenta.',
                        ].map((label) => (
                            <li key={label} className="flex items-start gap-2.5 text-sm leading-relaxed text-[#444]">
                                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#0066CC]" strokeWidth={2.5} />
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

    const renderStepContent = () => {
        // ✅ Round 30: tras submit exitoso (o si ya eres experto pendiente de Stripe),
        //    el paso 3 se transforma en el bloque Stripe inline.
        if (submitted) return renderStripeConnectBlock();

        switch (currentStep) {
            case 1:
                // 🎨 Paso 1 — Identidad: foto + descripción juntos.
                //    Desktop: foto a la izquierda (200px), textarea a la derecha.
                //    Móvil: stack vertical natural.
                return (
                    <div className="space-y-5">
                        <BecomeExpertStepHeader
                            title="Tu identidad pública"
                            description="La foto y la descripción son lo primero que verán los clientes."
                        />

                        <BecomeExpertPhotoField
                            previewUrl={previewUrl}
                            onPhotoReady={applyProfilePhoto}
                        />

                        <section className={BE_SECTION_CLASS}>
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
                                className={`${BE_INPUT_CLASS} mt-3 min-h-[120px] resize-y leading-relaxed sm:min-h-[140px]`}
                                rows={5}
                                placeholder="Ej.: 8 años revisando vehículos de ocasión. Informes detallados para compradores y concesionarios…"
                                required
                                minLength={50}
                            />
                            <div className="mt-2 flex items-center justify-between gap-3 text-xs">
                                <span className="text-[#6a6a6a]">Mínimo 50 caracteres</span>
                                <span
                                    className={`font-semibold tabular-nums ${
                                        formData.description.length >= 50 ? 'text-[#0066CC]' : 'text-[#9ca3af]'
                                    }`}
                                >
                                    {formData.description.length}/50
                                </span>
                            </div>
                        </section>
                    </div>
                );

            case 2:
                // 🎨 Paso 2 — Cobertura + disponibilidad juntos en la misma página.
                //    Mapa arriba (sigue siendo la pieza visual principal), días/horario debajo.
                return (
                    <div className="space-y-6">
                        <BecomeExpertStepHeader
                            title="Dónde y cuándo trabajas"
                            description="Zona de cobertura (100 km) y disponibilidad horaria para recibir encargos."
                        />

                        <section className={`${BE_SECTION_CLASS} space-y-3`}>
                            <div className="flex items-baseline justify-between gap-3">
                                <label className="text-sm font-semibold text-[#1c1c1c]">Zona de cobertura</label>
                                <span className="text-xs text-[#9ca3af]">Radio fijo de 100 km</span>
                            </div>
                            <div className="relative">
                                <div className="relative">
                                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" />
                                    <input
                                        ref={searchInputRef}
                                        type="text"
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
                                        className="absolute z-30 mt-2 max-h-72 w-full overflow-y-auto rounded-lg bg-white py-1 shadow-[0_16px_48px_rgba(0,0,0,0.12)]"
                                        role="listbox"
                                    >
                                        {autocompleteResults.map((item) => (
                                            <li key={item.id}>
                                                <button
                                                    type="button"
                                                    onMouseDown={(e) => {
                                                        e.preventDefault();
                                                        handleSelectAutocomplete(item);
                                                    }}
                                                    className="flex w-full items-start gap-2.5 px-4 py-2.5 text-left transition-colors hover:bg-[#f0f6fc]"
                                                >
                                                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#0066CC]" />
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
                            </div>

                            <div className="overflow-hidden rounded-xl border border-[#e8e8e8] bg-[#eef4f8]">
                                <div
                                    ref={mapWrapperRef}
                                    className="relative h-[240px] w-full touch-pan-y sm:h-[280px]"
                                    style={{ touchAction: 'pan-y pinch-zoom' }}
                                >
                                    {mapError ? (
                                        <div className="h-full flex flex-col items-center justify-center gap-2 bg-gray-50 px-4 text-center">
                                            <AlertTriangle className="w-6 h-6 text-gray-400" />
                                            <p className="text-xs text-gray-600">{mapError}</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div ref={mapContainerRef} className="absolute inset-0 h-full w-full" />
                                            {!mapReady && (
                                                <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-gray-50/60">
                                                    <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            {!MAPBOX_TOKEN ? (
                                <p className="text-xs leading-relaxed text-amber-800">
                                    Búsqueda de direcciones deshabilitada (falta token de Mapbox). Puedes seleccionar la ubicación haciendo clic en el mapa.
                                </p>
                            ) : (
                                <p className="text-xs text-[#6a6a6a]">
                                    Arrastra el marcador o haz clic en el mapa para afinar la posición.
                                </p>
                            )}

                            <style>{`
                                .maplibregl-ctrl-attribution { font-size: 8px !important; opacity: 0.85; }
                                .maplibregl-ctrl-group { border: none !important; box-shadow: 0 1px 6px rgba(0,0,0,0.08) !important; }
                            `}</style>
                        </section>

                        <section className={`${BE_SECTION_CLASS} space-y-4`}>
                            <div className="flex items-baseline justify-between gap-3">
                                <label className="text-sm font-semibold text-[#1c1c1c]">Tu disponibilidad horaria</label>
                                <span className="text-xs text-[#9ca3af]">Mínimo 1 día</span>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {VALID_DAYS_OF_WEEK.map((day) => (
                                    <button
                                        key={day}
                                        type="button"
                                        onClick={() => toggleDay(day)}
                                        className={`rounded-md px-3.5 py-2 text-sm font-medium transition-colors ${
                                            availability.daysOfWeek.includes(day) ? BE_DAY_ACTIVE : BE_DAY_IDLE
                                        }`}
                                    >
                                        {DAY_NAMES_ES[day as keyof typeof DAY_NAMES_ES]}
                                    </button>
                                ))}
                            </div>

                            {availability.daysOfWeek.length > 0 && (
                                <div className="grid grid-cols-2 gap-3 pt-2">
                                    <div>
                                        <label className="mb-2 block text-xs font-medium text-[#6a6a6a]">Hora de inicio</label>
                                        <input
                                            type="time"
                                            value={availability.startTime}
                                            onChange={(e) => setAvailability((prev) => ({ ...prev, startTime: e.target.value }))}
                                            className={BE_INPUT_CLASS}
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-xs font-medium text-[#6a6a6a]">Hora de fin</label>
                                        <input
                                            type="time"
                                            value={availability.endTime}
                                            onChange={(e) => setAvailability((prev) => ({ ...prev, endTime: e.target.value }))}
                                            className={BE_INPUT_CLASS}
                                        />
                                    </div>
                                </div>
                            )}
                        </section>
                    </div>
                );

            case 3:
                // 🎨 Paso 3 — Confirmar: resumen + términos. Tras submit, se transforma
                //    automáticamente en el bloque Stripe (gestionado en el guard de arriba).
                return (
                    <div className="space-y-6">
                        <BecomeExpertStepHeader
                            title="Revisa y publica tu perfil"
                            description="Confirma que todo está correcto. Después conectarás Stripe para recibir pagos."
                        />

                        <ul className={`${BE_CHECKOUT_CARD} divide-y divide-[#ececec] p-0`}>
                            {[
                                { ok: !!formData.profilePicture, label: 'Foto de perfil' },
                                { ok: formData.description.length >= 50, label: `Descripción (${formData.description.length} caracteres)` },
                                { ok: !!(formData.latitude && formData.longitude), label: 'Zona de cobertura' },
                                { ok: availability.daysOfWeek.length > 0, label: `Disponibilidad (${availability.daysOfWeek.length} día${availability.daysOfWeek.length === 1 ? '' : 's'})` },
                            ].map((item) => (
                                <li key={item.label} className="flex items-center gap-3 px-4 py-3 text-sm">
                                    <Check
                                        className={`h-4 w-4 shrink-0 ${item.ok ? 'text-[#0066CC]' : 'text-[#d1d5db]'}`}
                                        strokeWidth={2.5}
                                        aria-hidden
                                    />
                                    <span className={item.ok ? 'text-[#1c1c1c]' : 'text-[#9ca3af]'}>{item.label}</span>
                                </li>
                            ))}
                        </ul>

                        <div className="space-y-4 border-t border-[#ececec] pt-6">
                            <label htmlFor="acceptTerms" className="flex cursor-pointer items-start gap-3">
                                <input
                                    type="checkbox"
                                    id="acceptTerms"
                                    checked={acceptTerms}
                                    onChange={(e) => setAcceptTerms(e.target.checked)}
                                    className="mt-1 h-4 w-4 shrink-0 cursor-pointer rounded text-[#0066CC] focus:ring-[#0066CC]/30"
                                    required
                                />
                                <span className="text-[15px] leading-relaxed text-[#1c1c1c]">
                                    Acepto las{' '}
                                    <a
                                        href="/privacy-policy.html"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[#0066CC] underline-offset-2 hover:underline"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        condiciones de uso
                                    </a>{' '}
                                    y la política de privacidad.
                                </span>
                            </label>
                            <label htmlFor="acceptNotifications" className="flex cursor-pointer items-start gap-3">
                                <input
                                    type="checkbox"
                                    id="acceptNotifications"
                                    checked={acceptNotifications}
                                    onChange={(e) => setAcceptNotifications(e.target.checked)}
                                    className="mt-1 h-4 w-4 shrink-0 cursor-pointer rounded text-[#0066CC] focus:ring-[#0066CC]/30"
                                />
                                <span className="text-[15px] leading-relaxed text-[#6a6a6a]">
                                    Recibir avisos de nuevas búsquedas en mi zona (opcional).
                                </span>
                            </label>
                        </div>

                        {error && errorCode !== 'ACTIVE_HIRES_AS_CLIENT' && !error.includes('contrataciones activas') && !error.includes('contratación(es) activa(s)') && (
                            <div className={`${BE_CHECKOUT_CARD} border-red-200 bg-red-50/80 px-4 py-3`}>
                                <div className="mb-1 flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />
                                    <span className="text-sm font-semibold text-red-900">
                                        {errorCode === 'COUNTRY_NOT_SUPPORTED'
                                            ? `País no disponible${detectedCountry ? ` (${detectedCountry})` : ''}`
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
                                            onClick={() => setCurrentStep(2)}
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
    const isOnStripeStage = submitted || (isAlreadyExpert && currentStep === 3);

    return (
        <BecomeExpertWizardShell
            steps={STEPS}
            currentStep={currentStep}
            onBack={() => navigate(-1)}
            onNavBack={handleBack}
            onNext={handleNext}
            onSubmit={handleFinalSubmit}
            canGoNext={canGoNext()}
            canSubmit={acceptTerms && !isSubmitting}
            isSubmitting={isSubmitting}
            isLastStep={currentStep === STEPS.length}
            // En la etapa Stripe inline, esconder Next/Back/Submit — la acción primaria
            // ('Configurar pagos con Stripe') vive dentro del propio paso.
            hideFooter={isOnStripeStage}
        >
            {/* Si entraste como experto pendiente de Stripe (isAlreadyExpert + step 3),
                renderiza el bloque Stripe directamente; submitted=true llega por el path
                normal cuando el usuario completa el wizard ahora mismo. */}
            {isOnStripeStage && !submitted ? renderStripeConnectBlock() : renderStepContent()}
        </BecomeExpertWizardShell>
    );
}

export default BecomeExpertPage;
export { BecomeExpertPage };
