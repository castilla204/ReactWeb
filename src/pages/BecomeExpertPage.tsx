// 🛡️ Round 28: migración Google Maps → Mapbox geocoding + MapLibre interactive map.
// El proyecto NO tiene `react-map-gl` ni `mapbox-gl` en package.json: usa `maplibre-gl`
// (renderizado) con tiles Carto + la API REST de Mapbox para geocoding (igual que el
// resto de pantallas migradas — ver `ServiceDetailCoverageMap.tsx`).
import { useRef, useState, useEffect, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-csp-worker?url';
import 'maplibre-gl/dist/maplibre-gl.css';
import { ArrowLeft, Upload, Loader2, UserPlus, Clock, AlertTriangle, MapPin, Check, ChevronRight, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBecomeExpert } from '../hooks/useBecomeExpert';
import { VALID_DAYS_OF_WEEK, DAY_NAMES_ES } from '../types/stripe';
import { AvailabilityFormData } from '../hooks/useExpertProfile';
import { showToast } from '../lib/toast';
import { Stepper } from '../components/ui/stepper';
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

const STEPS = [
    { id: 1, label: 'Foto', icon: Upload },
    { id: 2, label: 'Descripción', icon: UserPlus },
    { id: 3, label: 'Ubicación', icon: MapPin },
    { id: 4, label: 'Disponibilidad', icon: Clock },
    { id: 5, label: 'Confirmar', icon: Check },
];

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
    const fileInputRef = useRef<HTMLInputElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const { formData, previewUrl, isSubmitting, error, handleFileChange, handleSubmit, setFormData } = useBecomeExpert();
    const { user } = useAuth();
    const { startOnboarding, isStartingOnboarding, checkOnboardingStatus } = useExpert();
    const isAlreadyExpert =
        user?.role === 'Expert' ||
        user?.Role === 'Expert' ||
        user?.role === 'expert' ||
        user?.Role === 'EXPERT' ||
        Number(user?.role) === 1;

    // Si ya eres experto pero no completaste Stripe, NO mostramos el formulario (daría "ya eres experto"):
    // comprobamos el estado y, si ya está completo, vamos al panel; si no, mostramos el botón de reanudar pagos.
    useEffect(() => {
        if (!isAlreadyExpert) return;
        checkOnboardingStatus(true)
            .then((status) => {
                if (status?.onboardingCompleted) navigate('/expert-panel', { replace: true });
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
        // Solo crear el mapa cuando el contenedor sea visible (stepper en paso 3).
        if (currentStep !== 3) return;
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
                return !!formData.profilePicture;
            case 2:
                return formData.description.trim().length >= 50;
            case 3:
                return !!(formData.latitude && formData.longitude);
            case 4: {
                if (availability.daysOfWeek.length === 0) return false;
                if (!availability.startTime || !availability.endTime) return false;
                const [startH, startM] = availability.startTime.split(':').map(Number);
                const [endH, endM] = availability.endTime.split(':').map(Number);
                if (Number.isNaN(startH) || Number.isNaN(endH)) return false;
                return startH * 60 + startM < endH * 60 + endM;
            }
            case 5:
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

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="space-y-6">
                        <div>
                            <div
                                style={{
                                    fontSize: '14px',
                                    lineHeight: '18px',
                                    fontWeight: 600,
                                    color: 'rgb(34, 34, 34)',
                                    fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                    marginBottom: '8px',
                                }}
                            >
                                Sube tu foto de perfil
                            </div>
                            <div
                                style={{
                                    fontSize: '14px',
                                    lineHeight: '20px',
                                    fontWeight: 400,
                                    color: 'rgb(113, 113, 113)',
                                    fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                }}
                            >
                                Esta será la foto que verán todos los usuarios en tu perfil
                            </div>
                        </div>
                        <div
                            className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
                                formData.profilePicture
                                    ? 'border-gray-300 bg-gray-50'
                                    : 'border-gray-300 hover:border-gray-400'
                            }`}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {previewUrl ? (
                                <div className="relative w-32 h-32 mx-auto rounded-full overflow-hidden">
                                    <img
                                        src={previewUrl}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                        <Upload className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="inline-flex p-4 bg-gray-100 rounded-full">
                                        <Upload className="w-8 h-8 text-gray-500" />
                                    </div>
                                    <div>
                                        <div
                                            style={{
                                                fontSize: '14px',
                                                lineHeight: '20px',
                                                fontWeight: 400,
                                                color: 'rgb(34, 34, 34)',
                                                fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                marginBottom: '4px',
                                            }}
                                        >
                                            Haz clic para subir foto
                                        </div>
                                        <div
                                            style={{
                                                fontSize: '14px',
                                                lineHeight: '20px',
                                                fontWeight: 400,
                                                color: 'rgb(113, 113, 113)',
                                                fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                            }}
                                        >
                                            PNG o JPG (máx. 5MB)
                                        </div>
                                    </div>
                                </div>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/jpg"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-6">
                        <div>
                            <div
                                style={{
                                    fontSize: '14px',
                                    lineHeight: '18px',
                                    fontWeight: 600,
                                    color: 'rgb(34, 34, 34)',
                                    fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                    marginBottom: '8px',
                                }}
                            >
                                Describe tu experiencia
                            </div>
                            <div
                                style={{
                                    fontSize: '14px',
                                    lineHeight: '20px',
                                    fontWeight: 400,
                                    color: 'rgb(113, 113, 113)',
                                    fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                }}
                            >
                                Cuéntanos sobre tu experiencia y especialidad en vehículos o inmobiliario
                            </div>
                        </div>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 resize-none"
                            style={{
                                fontSize: '14px',
                                lineHeight: '20px',
                                fontWeight: 400,
                                fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                            }}
                            rows={6}
                            placeholder="Describe tu experiencia y especialidad en vehículos o inmobiliario..."
                            required
                            minLength={50}
                        />
                        <div className="flex justify-between items-center">
                            <p
                                style={{
                                    fontSize: '12px',
                                    lineHeight: '16px',
                                    fontWeight: 400,
                                    color: 'rgb(113, 113, 113)',
                                    fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                }}
                            >
                                Mínimo 50 caracteres
                            </p>
                            <span
                                style={{
                                    fontSize: '12px',
                                    lineHeight: '16px',
                                    fontWeight: 500,
                                    color: formData.description.length >= 50 ? 'rgb(34, 34, 34)' : 'rgb(156, 163, 175)',
                                    fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                }}
                            >
                                {formData.description.length}/50
                            </span>
                        </div>
                    </div>
                );

            case 3:
                return (
                    <div className="space-y-6">
                        <div>
                            <div
                                style={{
                                    fontSize: '14px',
                                    lineHeight: '18px',
                                    fontWeight: 600,
                                    color: 'rgb(34, 34, 34)',
                                    fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                    marginBottom: '8px',
                                }}
                            >
                                Define tu área de trabajo
                            </div>
                            <div
                                style={{
                                    fontSize: '14px',
                                    lineHeight: '20px',
                                    fontWeight: 400,
                                    color: 'rgb(113, 113, 113)',
                                    fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                }}
                            >
                                Área donde te encontrarán los usuarios y donde se te encargarán los trabajos
                            </div>
                        </div>
                        <div>
                            {/* 🛡️ Round 28: input de búsqueda + dropdown de sugerencias Mapbox (reemplaza places.Autocomplete) */}
                            <div className="relative mb-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        placeholder="Buscar dirección o ciudad..."
                                        value={searchAddress}
                                        onChange={(e) => setSearchAddress(e.target.value)}
                                        onFocus={() => {
                                            if (autocompleteResults.length > 0) setShowAutocomplete(true);
                                        }}
                                        onBlur={() => {
                                            // Delay para permitir click en la sugerencia antes de cerrar el dropdown.
                                            window.setTimeout(() => setShowAutocomplete(false), 180);
                                        }}
                                        className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                                        style={{
                                            fontSize: '14px',
                                            lineHeight: '20px',
                                            fontWeight: 400,
                                            fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                        }}
                                    />
                                    {isSearching && (
                                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                                    )}
                                </div>
                                {showAutocomplete && autocompleteResults.length > 0 && (
                                    <ul
                                        className="absolute z-30 mt-1 w-full max-h-72 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg"
                                        role="listbox"
                                    >
                                        {autocompleteResults.map((item) => (
                                            <li key={item.id}>
                                                <button
                                                    type="button"
                                                    onMouseDown={(e) => {
                                                        // onMouseDown gana al onBlur del input → click siempre se procesa.
                                                        e.preventDefault();
                                                        handleSelectAutocomplete(item);
                                                    }}
                                                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors flex items-start gap-2"
                                                >
                                                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <div
                                                            className="truncate"
                                                            style={{
                                                                fontSize: '14px',
                                                                fontWeight: 500,
                                                                color: 'rgb(34, 34, 34)',
                                                                fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                            }}
                                                        >
                                                            {item.address}
                                                        </div>
                                                        {item.locationName && item.locationName !== 'Ubicación' && (
                                                            <div
                                                                className="truncate"
                                                                style={{
                                                                    fontSize: '12px',
                                                                    color: 'rgb(113, 113, 113)',
                                                                    fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                                }}
                                                            >
                                                                {item.locationName}
                                                            </div>
                                                        )}
                                                    </div>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div className="border border-gray-300 rounded-xl overflow-hidden">
                                {/* 🛡️ Round 28: el contenedor mantiene el mismo height (300px) del mapa Google previo. */}
                                <div ref={mapWrapperRef} className="relative h-[300px] w-full bg-[#dce9f2]">
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

                            {!MAPBOX_TOKEN && (
                                <p
                                    className="mt-2"
                                    style={{
                                        fontSize: '12px',
                                        lineHeight: '16px',
                                        fontWeight: 400,
                                        color: 'rgb(180, 83, 9)',
                                        fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                    }}
                                >
                                    Búsqueda de direcciones deshabilitada (falta token de Mapbox). Puedes seleccionar la ubicación haciendo clic en el mapa.
                                </p>
                            )}

                            {/* 🛡️ Round 28: estilos de los controles MapLibre (mismos que ServiceDetailCoverageMap) */}
                            <style>{`
                                .maplibregl-ctrl-attribution { font-size: 8px !important; opacity: 0.85; }
                                .maplibregl-ctrl-group { border: none !important; box-shadow: 0 1px 6px rgba(0,0,0,0.08) !important; }
                            `}</style>
                        </div>
                    </div>
                );

            case 4:
                return (
                    <div className="space-y-6">
                        <div>
                            <div
                                style={{
                                    fontSize: '14px',
                                    lineHeight: '18px',
                                    fontWeight: 600,
                                    color: 'rgb(34, 34, 34)',
                                    fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                    marginBottom: '8px',
                                }}
                            >
                                Disponibilidad horaria
                            </div>
                            <div
                                style={{
                                    fontSize: '14px',
                                    lineHeight: '20px',
                                    fontWeight: 400,
                                    color: 'rgb(113, 113, 113)',
                                    fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                }}
                            >
                                Define los días y horarios en los que estarás disponible (obligatorio)
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label
                                    style={{
                                        fontSize: '14px',
                                        lineHeight: '18px',
                                        fontWeight: 500,
                                        color: 'rgb(34, 34, 34)',
                                        fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                        marginBottom: '12px',
                                        display: 'block',
                                    }}
                                >
                                    Días de trabajo
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {VALID_DAYS_OF_WEEK.map(day => (
                                        <button
                                            key={day}
                                            type="button"
                                            onClick={() => toggleDay(day)}
                                            className={`px-4 py-2.5 text-sm font-medium rounded-lg border transition-colors ${
                                                availability.daysOfWeek.includes(day)
                                                    ? 'bg-gray-900 text-white border-gray-900'
                                                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                                            }`}
                                            style={{
                                                fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                            }}
                                        >
                                            {DAY_NAMES_ES[day as keyof typeof DAY_NAMES_ES]}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {availability.daysOfWeek.length > 0 && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label
                                            style={{
                                                fontSize: '14px',
                                                lineHeight: '18px',
                                                fontWeight: 600,
                                                color: 'rgb(34, 34, 34)',
                                                fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                marginBottom: '8px',
                                                display: 'block',
                                            }}
                                        >
                                            Hora de inicio
                                        </label>
                                        <input
                                            type="time"
                                            value={availability.startTime}
                                            onChange={(e) => setAvailability(prev => ({ ...prev, startTime: e.target.value }))}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                                            style={{
                                                fontSize: '14px',
                                                lineHeight: '20px',
                                                fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label
                                            style={{
                                                fontSize: '14px',
                                                lineHeight: '18px',
                                                fontWeight: 600,
                                                color: 'rgb(34, 34, 34)',
                                                fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                marginBottom: '8px',
                                                display: 'block',
                                            }}
                                        >
                                            Hora de fin
                                        </label>
                                        <input
                                            type="time"
                                            value={availability.endTime}
                                            onChange={(e) => setAvailability(prev => ({ ...prev, endTime: e.target.value }))}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                                            style={{
                                                fontSize: '14px',
                                                lineHeight: '20px',
                                                fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                            }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );

            case 5:
                return (
                    <div className="space-y-6">
                        <div>
                            <div
                                style={{
                                    fontSize: '14px',
                                    lineHeight: '18px',
                                    fontWeight: 600,
                                    color: 'rgb(34, 34, 34)',
                                    fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                    marginBottom: '8px',
                                }}
                            >
                                Confirma y finaliza
                            </div>
                            <div
                                style={{
                                    fontSize: '14px',
                                    lineHeight: '20px',
                                    fontWeight: 400,
                                    color: 'rgb(113, 113, 113)',
                                    fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                }}
                            >
                                Revisa y acepta los términos para completar tu registro
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                                <input
                                    type="checkbox"
                                    id="acceptTerms"
                                    checked={acceptTerms}
                                    onChange={(e) => setAcceptTerms(e.target.checked)}
                                    className="mt-0.5 w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-1 focus:ring-gray-900 cursor-pointer"
                                    required
                                />
                                <label
                                    htmlFor="acceptTerms"
                                    style={{
                                        fontSize: '14px',
                                        lineHeight: '20px',
                                        fontWeight: 400,
                                        color: 'rgb(34, 34, 34)',
                                        fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                    }}
                                >
                                    Acepto las{' '}
                                    <a href="/privacy-policy.html" target="_blank" style={{ color: 'rgb(34, 34, 34)', fontWeight: 500, textDecoration: 'underline' }}>
                                        condiciones de uso de inspecciono.io
                                    </a>
                                    {' '}y confirmo que he leído la política de privacidad
                                </label>
                            </div>
                            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                                <input
                                    type="checkbox"
                                    id="acceptNotifications"
                                    checked={acceptNotifications}
                                    onChange={(e) => setAcceptNotifications(e.target.checked)}
                                    className="mt-0.5 w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-1 focus:ring-gray-900 cursor-pointer"
                                />
                                <label
                                    htmlFor="acceptNotifications"
                                    style={{
                                        fontSize: '14px',
                                        lineHeight: '20px',
                                        fontWeight: 400,
                                        color: 'rgb(34, 34, 34)',
                                        fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                    }}
                                >
                                    Acepto recibir notificaciones sobre nuevas búsquedas
                                </label>
                            </div>
                        </div>
                        {error && !error.includes('contrataciones activas') && !error.includes('contratación(es) activa(s)') && (
                            <div className="p-4 border border-red-200 bg-red-50 rounded-xl">
                                <div className="flex items-center gap-2 mb-1">
                                    <AlertTriangle className="w-5 h-5 text-red-600" />
                                    <span
                                        style={{
                                            fontSize: '14px',
                                            lineHeight: '18px',
                                            fontWeight: 600,
                                            color: '#991b1b',
                                            fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                        }}
                                    >
                                        Error al procesar la solicitud
                                    </span>
                                </div>
                                <p
                                    style={{
                                        fontSize: '14px',
                                        lineHeight: '20px',
                                        fontWeight: 400,
                                        color: '#b91c1c',
                                        fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                        marginTop: '4px',
                                    }}
                                >
                                    {error}
                                </p>
                            </div>
                        )}
                    </div>
                );

            default:
                return null;
        }
    };

    // Guard: ya eres experto → no mostrar el formulario; ofrecer reanudar la configuración de pagos.
    if (isAlreadyExpert) {
        return (
            <div className="min-h-screen bg-white">
                <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
                    <button
                        onClick={() => navigate('/')}
                        className="mb-6 p-2 rounded-full hover:bg-gray-100 transition-colors"
                        aria-label="Atrás"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-900" />
                    </button>
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-8 text-center">
                        <div className="inline-flex p-4 bg-blue-50 rounded-full mb-4">
                            <Check className="w-8 h-8 text-blue-600" />
                        </div>
                        <h1 className="text-xl font-semibold text-gray-900 mb-2">Ya casi eres experto</h1>
                        <p className="text-sm text-gray-600 mb-6">
                            Tu perfil de experto ya está creado. Solo falta <strong>configurar tus pagos con Stripe</strong> para
                            poder recibir encargos y cobrar.
                        </p>
                        <button
                            onClick={async () => {
                                try {
                                    await startOnboarding();
                                } catch {
                                    showToast('error', 'No se pudo iniciar la configuración de pagos. Inténtalo de nuevo en unos minutos.');
                                }
                            }}
                            disabled={isStartingOnboarding}
                            className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white text-[15px] font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isStartingOnboarding ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Conectando con Stripe…</span>
                                </>
                            ) : (
                                <span>Configurar pagos con Stripe</span>
                            )}
                        </button>
                        <button
                            onClick={() => navigate('/expert-panel')}
                            className="mt-3 text-sm font-semibold text-gray-700 hover:text-gray-900 underline"
                        >
                            Ir a mi panel de experto
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Hero Header más pequeño */}
            <div className="relative h-[200px] lg:h-[240px] overflow-hidden">
                {/* Imagen de fondo con gradiente */}
                <div
                    className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600"
                    style={{
                        backgroundImage: `linear-gradient(135deg, rgba(37, 99, 235, 0.9) 0%, rgba(59, 130, 246, 0.85) 50%, rgba(79, 70, 229, 0.9) 100%),
                        url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    }}
                />

                {/* Contenido del header */}
                <div className="relative z-10 h-full flex flex-col">
                    {/* Botón volver */}
                    <div className="absolute top-4 left-4 z-20">
                        <button
                            onClick={() => navigate('/')}
                            className="p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors shadow-lg"
                            aria-label="Atrás"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-900" />
                        </button>
                    </div>

                    {/* Contenido centrado */}
                    <div className="flex-1 flex items-center justify-center px-4 sm:px-6 pt-16 pb-8">
                        <div className="text-center max-w-2xl">
                            <h1
                                style={{
                                    fontSize: '22px',
                                    lineHeight: '26px',
                                    fontWeight: 600,
                                    color: 'rgb(255, 255, 255)',
                                    fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                    marginBottom: '8px',
                                    textShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                                }}
                            >
                                Conviértete en Buscador Experto
                            </h1>
                            <p
                                style={{
                                    fontSize: '14px',
                                    lineHeight: '20px',
                                    fontWeight: 400,
                                    color: 'rgba(255, 255, 255, 0.95)',
                                    fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                    textShadow: '0 1px 4px rgba(0, 0, 0, 0.1)',
                                }}
                            >
                                Ayuda a otros usuarios y genera ingresos trabajando desde casa
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contenido principal con stepper arriba */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-8 sm:-mt-12 relative z-20">
                {/* Card del formulario */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
                    {/* Stepper arriba */}
                    <div className="px-4 sm:px-8 py-5 border-b border-gray-200 bg-gray-50">
                        <Stepper
                            steps={STEPS.map(s => ({ label: s.label, icon: <s.icon className="w-4 h-4" /> }))}
                            currentStep={currentStep}
                            size="default"
                        />
                    </div>

                    {/* Contenido del paso */}
                    <div className="px-4 sm:px-8 py-6 sm:py-8">
                        {renderStepContent()}
                    </div>

                    {/* Botones de navegación */}
                    <div className="px-4 sm:px-8 py-4 sm:py-6 border-t border-gray-200 bg-gray-50 flex items-center justify-between gap-4">
                        <button
                            onClick={handleBack}
                            disabled={currentStep === 1}
                            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2.5 sm:py-3 rounded-xl transition-colors ${
                                currentStep === 1
                                    ? 'text-gray-400 cursor-not-allowed'
                                    : 'text-gray-700 hover:bg-gray-100'
                            }`}
                            style={{
                                fontSize: '14px',
                                lineHeight: '18px',
                                fontWeight: 600,
                                fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                            }}
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span className="hidden sm:inline">Atrás</span>
                        </button>

                        {currentStep < STEPS.length ? (
                            <button
                                onClick={handleNext}
                                disabled={!canGoNext()}
                                className={`flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl transition-colors ${
                                    canGoNext()
                                        ? 'bg-gray-900 text-white hover:bg-gray-800'
                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                                style={{
                                    fontSize: '14px',
                                    lineHeight: '18px',
                                    fontWeight: 600,
                                    fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                }}
                            >
                                <span>Siguiente</span>
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                onClick={handleFinalSubmit}
                                disabled={!acceptTerms || isSubmitting}
                                className={`flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl transition-colors ${
                                    acceptTerms && !isSubmitting
                                        ? 'bg-gray-900 text-white hover:bg-gray-800'
                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                                style={{
                                    fontSize: '14px',
                                    lineHeight: '18px',
                                    fontWeight: 600,
                                    fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                }}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Procesando...</span>
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-4 h-4" />
                                        <span className="hidden sm:inline">Completar Registro</span>
                                        <span className="sm:hidden">Completar</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default BecomeExpertPage;
export { BecomeExpertPage };
