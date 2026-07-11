import { useLayoutEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-csp-worker?url';
import 'maplibre-gl/dist/maplibre-gl.css';
import { capMapWorkers } from '../../lib/mapWorkers';
capMapWorkers(maplibregl);
import { AlertTriangle } from 'lucide-react';
import { boundsFromCircle, circlePolygonGeoJSON } from '../../utils/geoCircle';
import { isExternalMapTileUrl } from '../../utils/mapTileUrls';
import { buildInspeccionoMapStyle, MAP_CANON } from '../../utils/inspeccionoMapStyle';
import { buildInkDotBareElement } from '../../utils/mapMarkers';
import { BecomeExpertMapSkeleton } from './BecomeExpertMapSkeleton';
import { HP_LINK_UNDERLINE_CLASS } from '../../constants/homepageTypography';

maplibregl.setWorkerUrl(maplibreWorkerUrl);

const INITIAL_ZOOM = 7;

export interface BecomeExpertCoverageMapProps {
    latitude: number;
    longitude: number;
    radiusKm: number;
    onLocationChange: (lat: number, lng: number) => void;
}

export function BecomeExpertCoverageMap({
    latitude,
    longitude,
    radiusKm,
    onLocationChange,
}: BecomeExpertCoverageMapProps) {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);
    const markerRef = useRef<maplibregl.Marker | null>(null);
    const onLocationChangeRef = useRef(onLocationChange);
    const [ready, setReady] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [initKey, setInitKey] = useState(0);

    useLayoutEffect(() => {
        onLocationChangeRef.current = onLocationChange;
    }, [onLocationChange]);

    useLayoutEffect(() => {
        const el = containerRef.current;
        const wrapper = wrapperRef.current;
        if (!el || !wrapper) return;

        let cancelled = false;
        let map: maplibregl.Map | null = null;

        const lng = longitude;
        const lat = latitude;
        // radiusKm === 0: solo taller → sin círculo (radio pequeño solo para encuadre).
        const isWorkshopOnly = radiusKm === 0;
        const radius = isWorkshopOnly ? 3 : Math.max(5, radiusKm);

        const init = () => {
            if (cancelled || mapRef.current || wrapper.clientWidth < 2 || wrapper.clientHeight < 2) return;

            try {
                map = new maplibregl.Map({
                    container: el,
                    // Estilo canónico único CON etiquetas: el aspirante reconoce su
                    // ciudad/calles al colocar su ubicación de trabajo.
                    style: buildInspeccionoMapStyle({ withLabels: true }),
                    center: [lng, lat],
                    zoom: INITIAL_ZOOM,
                    minZoom: 3,
                    maxZoom: 14,
                    pitch: 0,
                    bearing: 0,
                    attributionControl: false,
                    interactive: true,
                    scrollZoom: false,
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

                map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-left');
                map.addControl(
                    new maplibregl.NavigationControl({ visualizePitch: false, showCompass: false }),
                    'top-right',
                );

                mapRef.current = map;

                map.on('error', (e) => {
                    console.error('[BecomeExpertCoverageMap] error', e);
                });

                const onLoad = () => {
                    if (cancelled || !map) return;

                    if (!isWorkshopOnly) {
                        const circle = circlePolygonGeoJSON(lng, lat, radius);
                        if (!map.getSource('coverage')) {
                            map.addSource('coverage', { type: 'geojson', data: circle });
                            map.addLayer({
                                id: 'coverage-fill',
                                type: 'fill',
                                source: 'coverage',
                                paint: {
                                    'fill-color': MAP_CANON.ringFill,
                                    'fill-opacity': MAP_CANON.ringFillOpacity,
                                },
                            });
                            map.addLayer({
                                id: 'coverage-line',
                                type: 'line',
                                source: 'coverage',
                                paint: {
                                    'line-color': MAP_CANON.ring,
                                    'line-width': MAP_CANON.ringWidth,
                                    'line-dasharray': MAP_CANON.ringDash,
                                },
                            });
                        }
                    }

                    // Pin tinta canónico arrastrable (mismo lenguaje que checkout/ficha/panel).
                    const pin = buildInkDotBareElement(18, { draggable: true });
                    markerRef.current?.remove();
                    const marker = new maplibregl.Marker({ element: pin, anchor: 'center', draggable: true })
                        .setLngLat([lng, lat])
                        .addTo(map);
                    marker.on('dragend', () => {
                        const ll = marker.getLngLat();
                        onLocationChangeRef.current(ll.lat, ll.lng);
                    });
                    markerRef.current = marker;

                    map.fitBounds(boundsFromCircle(lng, lat, radius), {
                        padding: 40,
                        duration: 0,
                        maxZoom: 9,
                    });

                    map.resize();
                    setReady(true);
                    setError(null);
                };

                map.once('load', onLoad);
                if (map.loaded()) onLoad();

                map.on('click', (e) => {
                    const { lat: clickLat, lng: clickLng } = e.lngLat;
                    markerRef.current?.setLngLat([clickLng, clickLat]);
                    onLocationChangeRef.current(clickLat, clickLng);
                });
            } catch (err) {
                console.error('[BecomeExpertCoverageMap] init failed', err);
                setError('No se pudo cargar el mapa.');
            }
        };

        const ro = new ResizeObserver(() => {
            if (wrapper.clientWidth < 2 || wrapper.clientHeight < 2) return;
            mapRef.current?.resize();
            if (!mapRef.current) init();
        });
        ro.observe(wrapper);
        init();

        return () => {
            cancelled = true;
            ro.disconnect();
            markerRef.current?.remove();
            markerRef.current = null;
            map?.remove();
            mapRef.current = null;
            setReady(false);
        };
    }, [radiusKm, initKey]);

    useLayoutEffect(() => {
        const map = mapRef.current;
        if (!map || !ready) return;

        const lng = longitude;
        const lat = latitude;
        const isWorkshopOnly = radiusKm === 0;
        const radius = isWorkshopOnly ? 3 : Math.max(5, radiusKm);
        if (!isWorkshopOnly) {
            const circle = circlePolygonGeoJSON(lng, lat, radius);
            const src = map.getSource('coverage') as maplibregl.GeoJSONSource | undefined;
            src?.setData(circle);
        }
        markerRef.current?.setLngLat([lng, lat]);
        map.resize();
        map.fitBounds(boundsFromCircle(lng, lat, radius), {
            padding: 40,
            duration: 400,
            maxZoom: 9,
        });
    }, [latitude, longitude, radiusKm, ready]);

    const retry = () => {
        markerRef.current?.remove();
        markerRef.current = null;
        mapRef.current?.remove();
        mapRef.current = null;
        setReady(false);
        setError(null);
        setInitKey((k) => k + 1);
    };

    return (
        <div
            ref={wrapperRef}
            className="become-expert-map relative h-[280px] w-full shrink-0 overflow-hidden bg-[#dce9f2] sm:h-[300px]"
        >
            {error ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
                    <AlertTriangle className="h-6 w-6 text-[#9ca3af]" />
                    <p className="text-sm text-[#444]">{error}</p>
                    <button
                        type="button"
                        onClick={retry}
                        className={`text-sm font-semibold text-brand ${HP_LINK_UNDERLINE_CLASS}`}
                    >
                        Reintentar mapa
                    </button>
                </div>
            ) : (
                <>
                    <div ref={containerRef} className="absolute inset-0 z-0 h-full w-full" />
                    {!ready && (
                        <div className="pointer-events-none absolute inset-0 z-[1]">
                            <BecomeExpertMapSkeleton className="h-full w-full" />
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
