import React, { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo } from 'react';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { markFilePickerOpening } from '../../utils/filePickerGuard';
import { Loader2, Upload, X, Plane, Search } from 'lucide-react';
import MapGL, {
    Marker,
    Source,
    Layer,
    type MapRef,
    type MapMouseEvent,
    type MarkerDragEvent,
} from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { circlePolygonGeoJSON } from '../../utils/geoCircle';
import { getCartoVoyagerNoLabelsTiles } from '../../utils/mapTileUrls';
import {
    searchMapboxAutocomplete,
    reverseGeocodeMapbox,
    type MapboxFeature,
} from '../../utils/mapboxGeocoding';
import { useExpertProfile, AvailabilityFormData } from '../../hooks/useExpertProfile';
import { VALID_DAYS_OF_WEEK, CurrentExpertAvailabilityDto } from '../../types/stripe';
import {
    Drawer,
    DrawerContent,
    DrawerTitle,
} from '../ui/drawer';
import { Button } from '../ui/button';
import type { ProfileStep } from './profileSteps';
import '../../styles/expert-profile-form.css';

const MAPBOX_TOKEN =
    import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN ||
    import.meta.env.VITE_MAPBOX_ACCESS_TOKEN ||
    '';

const MAP_SKY_COLOR = '#e6ecf2';

function buildCartoMapStyle() {
    return {
        version: 8 as const,
        sources: {
            carto: {
                type: 'raster' as const,
                tiles: getCartoVoyagerNoLabelsTiles(),
                tileSize: 256,
                attribution: '© OpenStreetMap · CARTO',
            },
        },
        layers: [
            { id: 'sky-bg', type: 'background' as const, paint: { 'background-color': MAP_SKY_COLOR } },
            { id: 'carto', type: 'raster' as const, source: 'carto', paint: { 'raster-opacity': 1 } },
        ],
    };
}

const defaultCenter = { lat: 40.4168, lng: -3.7038 };
const DEFAULT_WORK_RADIUS_KM = 100;
const MAX_WORK_RADIUS_KM = 200;

const CIRCLE_FILL_COLOR = '#0066CC';
const CIRCLE_FILL_OPACITY = 0.12;
const CIRCLE_LINE_COLOR = 'rgba(0, 102, 204, 0.55)';
const CIRCLE_LINE_WIDTH = 2;

const DAY_LETTER: Record<string, string> = {
    Monday: 'L',
    Tuesday: 'M',
    Wednesday: 'X',
    Thursday: 'J',
    Friday: 'V',
    Saturday: 'S',
    Sunday: 'D',
};

function readWorkRadiusKm(profile: unknown): number {
    const p = profile as { workRadiusKm?: unknown; WorkRadiusKm?: unknown } | null | undefined;
    const raw = p?.workRadiusKm ?? p?.WorkRadiusKm;
    const value = Number(raw);
    if (Number.isFinite(value) && value >= 0 && value <= MAX_WORK_RADIUS_KM) return value;
    return DEFAULT_WORK_RADIUS_KM;
}

function formatTimeFromTimeSpan(timeSpan: string): string {
    if (!timeSpan) return '';
    const parts = timeSpan.split(':');
    return `${parts[0]}:${parts[1]}`;
}

interface ProfileEditFormProps {
    showEditForm?: boolean;
    setShowEditForm?: (value: boolean) => void;
    embedded?: boolean;
    profile: {
        id: number;
        profilePictureUrl?: string;
        description: string;
        stripeAccountId?: string | null;
        createdAt: string;
        latitude?: number | string;
        longitude?: number | string;
        workRadiusKm?: number;
        currentAvailability?: CurrentExpertAvailabilityDto | null;
    };
    onProfileUpdated: () => void;
    profileSetup?: {
        steps: ProfileStep[];
        complete: boolean;
        pendingRequired: number;
        onOpenSetup?: () => void;
    };
}

export function ProfileEditForm({
    showEditForm = false,
    setShowEditForm,
    embedded = false,
    profile,
    onProfileUpdated,
    profileSetup: _profileSetup,
}: ProfileEditFormProps) {
    const { updateExpertProfile, isUpdating } = useExpertProfile();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const prevShowEditFormRef = useRef(false);
    const localPreviewBlobRef = useRef<string | null>(null);
    const mapRef = useRef<MapRef | null>(null);
    const mapCanvasRef = useRef<HTMLDivElement>(null);
    const addressDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const addressSearchAbortRef = useRef<AbortController | null>(null);
    const addressSearchFromUserRef = useRef(false);
    const addressInputFocusedRef = useRef(false);
    const appliedAddressRef = useRef('');
    const addressSearchCacheRef = useRef(new Map<string, MapboxFeature[]>());

    const ADDRESS_SEARCH_DEBOUNCE_MS = 450;
    const ADDRESS_SEARCH_MIN_CHARS = 3;
    const ADDRESS_SEARCH_CACHE_MAX = 24;

    const [formData, setFormData] = useState({
        description: profile?.description || '',
        latitude: profile?.latitude?.toString() || '',
        longitude: profile?.longitude?.toString() || '',
    });

    const initialAvailability: AvailabilityFormData = profile?.currentAvailability ? {
        daysOfWeek: (() => {
            const days = profile?.currentAvailability?.daysOfWeek ??
                (profile?.currentAvailability as { DaysOfWeek?: string[] })?.DaysOfWeek ??
                [];
            return Array.isArray(days) ? days : [];
        })(),
        startTime: formatTimeFromTimeSpan(
            profile?.currentAvailability?.startTime ??
            (profile?.currentAvailability as { StartTime?: string })?.StartTime ??
            '',
        ),
        endTime: formatTimeFromTimeSpan(
            profile?.currentAvailability?.endTime ??
            (profile?.currentAvailability as { EndTime?: string })?.EndTime ??
            '',
        ),
    } : {
        daysOfWeek: [],
        startTime: '09:00',
        endTime: '18:00',
    };

    const [availability, setAvailability] = useState<AvailabilityFormData>(initialAvailability);
    const [profilePicture, setProfilePicture] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

    const initialLocation = useMemo(() => {
        const lat = Number(profile?.latitude);
        const lng = Number(profile?.longitude);
        if (Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0)) {
            return { lat, lng };
        }
        return defaultCenter;
    }, [profile?.latitude, profile?.longitude]);

    const [selectedLocation, setSelectedLocation] = useState(initialLocation);
    const selectedLocationRef = useRef(selectedLocation);
    const [workRadiusKm, setWorkRadiusKm] = useState<number>(() => readWorkRadiusKm(profile));
    const [addressQuery, setAddressQuery] = useState('');
    const [addressResults, setAddressResults] = useState<MapboxFeature[]>([]);
    const [showAddressResults, setShowAddressResults] = useState(false);
    const [addressSearchError, setAddressSearchError] = useState<string | null>(null);

    const cartoMapStyle = useMemo(() => buildCartoMapStyle(), []);
    const [mapCanRender, setMapCanRender] = useState(false);
    const [mapHeight, setMapHeight] = useState(260);

    useEffect(() => {
        selectedLocationRef.current = selectedLocation;
    }, [selectedLocation]);

    const setAddressQueryProgrammatic = useCallback((text: string) => {
        addressSearchFromUserRef.current = false;
        addressSearchAbortRef.current?.abort();
        if (addressDebounceRef.current) clearTimeout(addressDebounceRef.current);
        appliedAddressRef.current = text.trim();
        setAddressQuery(text);
        setAddressResults([]);
        setShowAddressResults(false);
        setAddressSearchError(null);
    }, []);

    const applyLocation = useCallback((lat: number, lng: number, addressText?: string) => {
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
        setSelectedLocation({ lat, lng });
        setFormData((prev) => ({
            ...prev,
            latitude: lat.toString(),
            longitude: lng.toString(),
        }));
        setFormErrors((prev) => ({ ...prev, latitude: '', longitude: '' }));
        if (addressText) setAddressQueryProgrammatic(addressText);
        const zoom = workRadiusKm > 0 ? 10 : 14;
        mapRef.current?.flyTo({ center: [lng, lat], zoom, duration: 800 });
    }, [workRadiusKm, setAddressQueryProgrammatic]);

    const syncAddressFromCoords = useCallback(async (lat: number, lng: number) => {
        if (!MAPBOX_TOKEN) return;
        try {
            const feature = await reverseGeocodeMapbox(lat, lng, { language: 'es' });
            if (feature?.address) setAddressQueryProgrammatic(feature.address);
        } catch { /* noop */ }
    }, [setAddressQueryProgrammatic]);

    const handleAddressSelect = useCallback((item: MapboxFeature) => {
        if (item.lat == null || item.lng == null) return;
        addressSearchFromUserRef.current = false;
        addressSearchAbortRef.current?.abort();
        if (addressDebounceRef.current) clearTimeout(addressDebounceRef.current);
        appliedAddressRef.current = (item.address || item.place_name || '').trim();
        setAddressResults([]);
        setShowAddressResults(false);
        setAddressSearchError(null);
        applyLocation(item.lat, item.lng, item.address || item.place_name);
    }, [applyLocation]);

    useEffect(() => {
        if (!MAPBOX_TOKEN) return;
        const lat = Number(initialLocation.lat);
        const lng = Number(initialLocation.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
        void syncAddressFromCoords(lat, lng);
    }, [initialLocation.lat, initialLocation.lng, syncAddressFromCoords]);

    const resizeMap = useCallback(() => {
        mapRef.current?.resize();
    }, []);

    useLayoutEffect(() => {
        const canvas = mapCanvasRef.current;
        if (!canvas) return undefined;

        const syncMapLayout = () => {
            const height = Math.round(canvas.getBoundingClientRect().height);
            const width = Math.round(canvas.getBoundingClientRect().width);
            if (width > 0 && height > 0) {
                setMapHeight(height);
                setMapCanRender(true);
                window.requestAnimationFrame(() => {
                    mapRef.current?.resize();
                });
            }
        };

        syncMapLayout();
        const delayed = window.setTimeout(syncMapLayout, 120);
        const delayedAgain = window.setTimeout(syncMapLayout, 420);
        const observer = new ResizeObserver(syncMapLayout);
        observer.observe(canvas);
        window.addEventListener('resize', syncMapLayout);

        return () => {
            window.clearTimeout(delayed);
            window.clearTimeout(delayedAgain);
            observer.disconnect();
            window.removeEventListener('resize', syncMapLayout);
        };
    }, []);

    useEffect(() => {
        const canvas = mapCanvasRef.current;
        if (!canvas) return undefined;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((entry) => entry.isIntersecting)) {
                    resizeMap();
                }
            },
            { threshold: 0.15 },
        );
        observer.observe(canvas);
        return () => observer.disconnect();
    }, [resizeMap]);

    useEffect(() => {
        if (addressDebounceRef.current) clearTimeout(addressDebounceRef.current);

        if (!addressSearchFromUserRef.current) {
            addressSearchAbortRef.current?.abort();
            return undefined;
        }

        const query = addressQuery.trim();
        if (query.length < ADDRESS_SEARCH_MIN_CHARS) {
            addressSearchAbortRef.current?.abort();
            setAddressResults([]);
            setShowAddressResults(false);
            setAddressSearchError(null);
            return undefined;
        }

        const applied = appliedAddressRef.current.trim();
        if (applied && query === applied) {
            setAddressResults([]);
            setShowAddressResults(false);
            setAddressSearchError(null);
            return undefined;
        }

        const cacheKey = query.toLowerCase();
        const cached = addressSearchCacheRef.current.get(cacheKey);
        if (cached) {
            setAddressResults(cached);
            setShowAddressResults(addressInputFocusedRef.current && cached.length > 0);
            setAddressSearchError(null);
            return undefined;
        }

        addressDebounceRef.current = setTimeout(async () => {
            if (!addressSearchFromUserRef.current) return;

            const debouncedQuery = addressQuery.trim();
            if (debouncedQuery.length < ADDRESS_SEARCH_MIN_CHARS || debouncedQuery !== query) return;

            const cachedAfterWait = addressSearchCacheRef.current.get(debouncedQuery.toLowerCase());
            if (cachedAfterWait) {
                setAddressResults(cachedAfterWait);
                setShowAddressResults(addressInputFocusedRef.current && cachedAfterWait.length > 0);
                return;
            }

            addressSearchAbortRef.current?.abort();
            const controller = new AbortController();
            addressSearchAbortRef.current = controller;
            try {
                setAddressSearchError(null);
                const results = await searchMapboxAutocomplete(debouncedQuery, {
                    language: 'es',
                    signal: controller.signal,
                    proximity: {
                        lat: selectedLocationRef.current.lat,
                        lng: selectedLocationRef.current.lng,
                    },
                });
                if (controller.signal.aborted || !addressSearchFromUserRef.current) return;

                const cache = addressSearchCacheRef.current;
                if (cache.size >= ADDRESS_SEARCH_CACHE_MAX) {
                    const oldestKey = cache.keys().next().value;
                    if (oldestKey) cache.delete(oldestKey);
                }
                cache.set(debouncedQuery.toLowerCase(), results);

                setAddressResults(results);
                setShowAddressResults(addressInputFocusedRef.current && results.length > 0);
            } catch (err: unknown) {
                if ((err as DOMException)?.name === 'AbortError') return;
                if (!addressSearchFromUserRef.current) return;
                setAddressSearchError(err instanceof Error ? err.message : 'Error en la búsqueda');
                setAddressResults([]);
                setShowAddressResults(false);
            }
        }, ADDRESS_SEARCH_DEBOUNCE_MS);

        return () => {
            if (addressDebounceRef.current) clearTimeout(addressDebounceRef.current);
        };
    }, [addressQuery]);

    useEffect(() => {
        const isOpen = embedded || showEditForm;
        const justOpened = isOpen && !prevShowEditFormRef.current;
        prevShowEditFormRef.current = isOpen;
        if (!isOpen || !profile || !justOpened) return;

        setFormData({
            description: profile.description || '',
            latitude: profile.latitude?.toString() || '',
            longitude: profile.longitude?.toString() || '',
        });
        setProfilePicture(null);
        setFormErrors({});
        const profileImageUrl = (profile as { ProfilePictureUrl?: string }).ProfilePictureUrl || profile.profilePictureUrl || null;
        setPreviewUrl(profileImageUrl);

        const newAvailability: AvailabilityFormData = profile.currentAvailability ? {
            daysOfWeek: (() => {
                const days = profile.currentAvailability?.daysOfWeek ??
                    (profile.currentAvailability as { DaysOfWeek?: string[] })?.DaysOfWeek ?? [];
                return Array.isArray(days) ? days : [];
            })(),
            startTime: formatTimeFromTimeSpan(
                profile.currentAvailability.startTime ??
                (profile.currentAvailability as { StartTime?: string })?.StartTime ?? '',
            ),
            endTime: formatTimeFromTimeSpan(
                profile.currentAvailability.endTime ??
                (profile.currentAvailability as { EndTime?: string })?.EndTime ?? '',
            ),
        } : { daysOfWeek: [], startTime: '09:00', endTime: '18:00' };
        setAvailability(newAvailability);

        const lat = Number(profile.latitude);
        const lng = Number(profile.longitude);
        const newLocation = Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0)
            ? { lat, lng }
            : defaultCenter;
        setSelectedLocation(newLocation);
        setWorkRadiusKm(readWorkRadiusKm(profile));
        void syncAddressFromCoords(newLocation.lat, newLocation.lng);
        mapRef.current?.flyTo({ center: [newLocation.lng, newLocation.lat], duration: 0 });
    }, [embedded, showEditForm, profile?.id, syncAddressFromCoords]);

    useBodyScrollLock(showEditForm && !embedded);

    useEffect(() => {
        if (!embedded && showEditForm) {
            document.body.dataset.drawerOpen = 'profile';
        } else if (document.body.dataset.drawerOpen === 'profile') {
            delete document.body.dataset.drawerOpen;
        }
        return () => {
            if (document.body.dataset.drawerOpen === 'profile') delete document.body.dataset.drawerOpen;
        };
    }, [showEditForm, embedded]);

    const closeEditor = () => setShowEditForm?.(false);

    const validateForm = () => {
        const errors: { [key: string]: string } = {};
        if (!formData.description.trim()) {
            errors.description = 'La descripción es requerida';
        } else {
            const descTrimLen = formData.description.trim().length;
            if (descTrimLen < 30 || descTrimLen > 60) {
                errors.description = 'La descripción del experto debe tener entre 30 y 60 caracteres';
            }
        }
        if (!formData.latitude) {
            errors.latitude = 'La latitud es requerida';
        } else {
            const lat = parseFloat(formData.latitude);
            if (isNaN(lat) || lat < -90 || lat > 90) errors.latitude = 'La latitud debe estar entre -90 y 90';
        }
        if (!formData.longitude) {
            errors.longitude = 'La longitud es requerida';
        } else {
            const lng = parseFloat(formData.longitude);
            if (isNaN(lng) || lng < -180 || lng > 180) errors.longitude = 'La longitud debe estar entre -180 y 180';
        }
        if (availability.daysOfWeek.length > 0) {
            if (!availability.startTime || !availability.endTime) {
                errors.availability = 'Debes especificar hora de inicio y fin';
            } else {
                const [startH, startM] = availability.startTime.split(':').map(Number);
                const [endH, endM] = availability.endTime.split(':').map(Number);
                if (Number.isNaN(startH) || Number.isNaN(endH)) {
                    errors.availability = 'Horario de disponibilidad no válido';
                } else if (startH * 60 + startM >= endH * 60 + endM) {
                    errors.availability = 'La hora de inicio debe ser anterior a la hora de fin';
                }
            }
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            setFormErrors(prev => ({ ...prev, profilePicture: 'La imagen no puede superar los 5MB' }));
            return;
        }
        if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
            setFormErrors(prev => ({ ...prev, profilePicture: 'Solo se permiten imágenes JPG, JPEG y PNG' }));
            return;
        }
        if (localPreviewBlobRef.current) URL.revokeObjectURL(localPreviewBlobRef.current);
        const blobUrl = URL.createObjectURL(file);
        localPreviewBlobRef.current = blobUrl;
        setProfilePicture(file);
        setPreviewUrl(blobUrl);
        setFormErrors(prev => ({ ...prev, profilePicture: '' }));
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const openFilePicker = useCallback(() => {
        markFilePickerOpening();
        fileInputRef.current?.click();
    }, []);

    const removeImage = () => {
        setProfilePicture(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const coverageGeoJSON = useMemo(
        () => workRadiusKm > 0
            ? circlePolygonGeoJSON(selectedLocation.lng, selectedLocation.lat, workRadiusKm)
            : null,
        [selectedLocation.lat, selectedLocation.lng, workRadiusKm],
    );

    const handleMapClick = useCallback((e: MapMouseEvent) => {
        const { lng, lat } = e.lngLat;
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
        applyLocation(lat, lng);
        void syncAddressFromCoords(lat, lng);
    }, [applyLocation, syncAddressFromCoords]);

    const handleMarkerDragEnd = useCallback((e: MarkerDragEvent) => {
        const { lng, lat } = e.lngLat;
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
        applyLocation(lat, lng);
        void syncAddressFromCoords(lat, lng);
    }, [applyLocation, syncAddressFromCoords]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        try {
            await updateExpertProfile({
                description: formData.description.trim(),
                latitude: formData.latitude,
                longitude: formData.longitude,
                profilePicture: profilePicture || undefined,
                availability,
                workRadiusKm,
            });
            if (!embedded) setShowEditForm?.(false);
            onProfileUpdated();
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: { type: 'success', message: 'Perfil actualizado exitosamente' },
            }));
        } catch (error: unknown) {
            const err = error as { message?: string; errorCode?: string; detectedCountry?: string };
            if (err?.errorCode === 'STRIPE_COUNTRY_LOCKED') {
                const detected = err?.detectedCountry ? ` (${err.detectedCountry})` : '';
                setFormErrors({ general: err.message, relocationRequired: 'true' });
                window.dispatchEvent(new CustomEvent('showNotification', {
                    detail: {
                        type: 'warning',
                        message: `Para operar desde otro país${detected}, debes cerrar tu cuenta Stripe actual y volver a registrarte. Ve al panel de experto → "Mudarme a otro país".`,
                        duration: 12000,
                    },
                }));
            } else if (err?.errorCode === 'COUNTRY_NOT_SUPPORTED') {
                setFormErrors({ general: err.message, countryNotSupported: 'true' });
            } else {
                setFormErrors({ general: err.message || 'Error al actualizar el perfil' });
            }
        }
    };

    const resetForm = () => {
        setFormData({
            description: profile.description || '',
            latitude: profile.latitude?.toString() || '',
            longitude: profile.longitude?.toString() || '',
        });
        setProfilePicture(null);
        setPreviewUrl(null);
        setFormErrors({});
        const resetAvailability: AvailabilityFormData = profile.currentAvailability ? {
            daysOfWeek: profile.currentAvailability.daysOfWeek || [],
            startTime: formatTimeFromTimeSpan(profile.currentAvailability.startTime),
            endTime: formatTimeFromTimeSpan(profile.currentAvailability.endTime),
        } : { daysOfWeek: [], startTime: '09:00', endTime: '18:00' };
        setAvailability(resetAvailability);
        const lat = Number(profile.latitude);
        const lng = Number(profile.longitude);
        const resetLocation = Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0)
            ? { lat, lng }
            : defaultCenter;
        setSelectedLocation(resetLocation);
        setWorkRadiusKm(readWorkRadiusKm(profile));
        mapRef.current?.flyTo({ center: [resetLocation.lng, resetLocation.lat], duration: 300 });
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const toggleDay = (day: string) => {
        setAvailability(prev => ({
            ...prev,
            daysOfWeek: prev.daysOfWeek.includes(day)
                ? prev.daysOfWeek.filter(d => d !== day)
                : [...prev.daysOfWeek, day],
        }));
    };

    const profileImageUrl = previewUrl
        || (profile as { ProfilePictureUrl?: string })?.ProfilePictureUrl
        || profile.profilePictureUrl
        || null;

    const descLength = formData.description.length;

    if (!profile) return null;

    const saveButton = (
        <Button type="button" className="pf-btn-save" onClick={handleSubmit} disabled={isUpdating}>
            {isUpdating ? (
                <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Guardando…</>
            ) : 'Guardar'}
        </Button>
    );

    const saveButtonBar = (
        <Button type="button" className="pf-btn-save pf-btn-save--bar" onClick={handleSubmit} disabled={isUpdating}>
            {isUpdating ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Guardando…</>
            ) : 'Guardar'}
        </Button>
    );

    const mobileFooterActions = (
        <div className="pf-editor-footer-actions">
            <Button
                type="button"
                variant="ghost"
                className="pf-btn-clear"
                onClick={resetForm}
                aria-label="Limpiar formulario"
            >
                Limpiar
            </Button>
            {saveButtonBar}
        </div>
    );

    const editorCard = (
        <div className="pf-editor-stack">
            {embedded && (
                <div className="pf-settings-card pf-settings-card--meta">
                    <header className="pf-card-header pf-card-header--actions pf-editor-save-desktop">
                        <div className="pf-editor-bar-end">{saveButton}</div>
                    </header>
                </div>
            )}

            <form className="pf-form pf-form--stacked" onSubmit={handleSubmit}>
                <div className="pf-settings-card pf-settings-card--content">
                    <div className="pf-form-body">
                        <div className="pf-form-grid">
                    <section id="pf-section-about" className="pf-section pf-section--about">
                        <div className={`pf-about-composer${formErrors.description ? ' pf-about-composer--error' : ''}`}>
                            <span className="pf-about-composer__meta">{descLength}/60</span>
                            <div className="pf-about-composer__photo">
                                    <button type="button" className="pf-avatar pf-avatar--composer" onClick={openFilePicker} aria-label="Cambiar foto de perfil">
                                        {profileImageUrl ? (
                                            <img src={profileImageUrl} alt="" />
                                        ) : (
                                            <span className="pf-avatar-empty"><Upload className="h-8 w-8" /></span>
                                        )}
                                        <span className="pf-avatar-overlay" aria-hidden>
                                            <Upload className="h-4 w-4" />
                                        </span>
                                    </button>
                                    <div className="pf-about-composer__actions">
                                        <button type="button" className="pf-avatar-link" onClick={openFilePicker}>
                                            {profileImageUrl ? 'Cambiar foto' : 'Subir foto'}
                                        </button>
                                        {(previewUrl || profilePicture) && (
                                            <button type="button" className="pf-avatar-link pf-avatar-link--danger" onClick={removeImage}>
                                                Quitar
                                            </button>
                                        )}
                                    </div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/jpg"
                                        onChange={handleImageSelect}
                                        onClick={(e) => { e.stopPropagation(); markFilePickerOpening(); }}
                                        className="hidden"
                                    />
                                    {formErrors.profilePicture && <p className="pf-error pf-error--inline">{formErrors.profilePicture}</p>}
                                </div>
                                <textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={5}
                                    minLength={30}
                                    maxLength={60}
                                    placeholder="Cuéntales a tus clientes quién eres, tu experiencia y en qué te especializas…"
                                    className={`pf-textarea pf-textarea--composer${formErrors.description ? ' pf-textarea--error' : ''}`}
                                    required
                            />
                        </div>
                        {formErrors.description && (
                            <div className="pf-about-errors">
                                <p className="pf-error">{formErrors.description}</p>
                            </div>
                        )}
                    </section>

                    <section id="pf-section-zone" className="pf-section pf-section--zone">
                        <div className="pf-section-fields">
                            {!MAPBOX_TOKEN ? (
                                <div className="pf-alert">Falta configurar VITE_MAPBOX_PUBLIC_TOKEN.</div>
                            ) : (
                                <div className="pf-map-panel">
                                    <div className="pf-map-search">
                                        <div className="pf-map-search-bar">
                                            <Search className="pf-map-search-icon" aria-hidden />
                                            <input
                                                id="work-address-search"
                                                type="text"
                                                value={addressQuery}
                                                onChange={(e) => {
                                                    addressSearchFromUserRef.current = true;
                                                    setShowAddressResults(false);
                                                    setAddressQuery(e.target.value);
                                                }}
                                                onFocus={() => {
                                                    addressInputFocusedRef.current = true;
                                                    if (
                                                        addressSearchFromUserRef.current
                                                        && addressResults.length > 0
                                                        && addressQuery.trim() !== appliedAddressRef.current.trim()
                                                    ) {
                                                        setShowAddressResults(true);
                                                    }
                                                }}
                                                onBlur={() => {
                                                    addressInputFocusedRef.current = false;
                                                    window.setTimeout(() => setShowAddressResults(false), 150);
                                                }}
                                                placeholder="Buscar dirección…"
                                                autoComplete="off"
                                                className="pf-map-search-input"
                                            />
                                        </div>
                                        {showAddressResults && addressResults.length > 0 && (
                                            <ul className="pf-map-search-results" role="listbox">
                                                {addressResults.map((item) => (
                                                    <li key={item.id} role="option">
                                                        <button
                                                            type="button"
                                                            className="pf-map-search-result"
                                                            onMouseDown={(e) => e.preventDefault()}
                                                            onClick={() => handleAddressSelect(item)}
                                                        >
                                                            {item.address || item.place_name}
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>

                                    <div className="pf-map-canvas" ref={mapCanvasRef}>
                                        <div className="pf-map-canvas__map" aria-hidden={!mapCanRender}>
                                            {mapCanRender && (
                                                <MapGL
                                                    ref={mapRef}
                                                    mapboxAccessToken={MAPBOX_TOKEN}
                                                    initialViewState={{ longitude: initialLocation.lng, latitude: initialLocation.lat, zoom: 6 }}
                                                    style={{ width: '100%', height: mapHeight }}
                                                    mapStyle={cartoMapStyle as never}
                                                    onClick={handleMapClick}
                                                    onLoad={resizeMap}
                                                    onResize={resizeMap}
                                                    cursor="pointer"
                                                    attributionControl={false}
                                                    dragRotate={false}
                                                    pitchWithRotate={false}
                                                    touchPitch={false}
                                                >
                                                    {coverageGeoJSON && (
                                                        <Source id="coverage" type="geojson" data={coverageGeoJSON}>
                                                            <Layer id="coverage-fill" type="fill" paint={{ 'fill-color': CIRCLE_FILL_COLOR, 'fill-opacity': CIRCLE_FILL_OPACITY }} />
                                                            <Layer id="coverage-line" type="line" paint={{ 'line-color': CIRCLE_LINE_COLOR, 'line-width': CIRCLE_LINE_WIDTH }} />
                                                        </Source>
                                                    )}
                                                    <Marker longitude={selectedLocation.lng} latitude={selectedLocation.lat} draggable onDragEnd={handleMarkerDragEnd} anchor="center">
                                                        <div className="pf-map-pin" />
                                                    </Marker>
                                                </MapGL>
                                            )}
                                        </div>

                                        <div className="pf-map-canvas__ui">
                                            <div className="pf-map-radius">
                                                <input
                                                    id="workRadius"
                                                    type="range"
                                                    min={0}
                                                    max={MAX_WORK_RADIUS_KM}
                                                    step={5}
                                                    value={workRadiusKm}
                                                    onChange={(e) => setWorkRadiusKm(Number(e.target.value))}
                                                    className="pf-range"
                                                    aria-label="Radio de trabajo"
                                                    style={{ '--pf-range-pct': `${(workRadiusKm / MAX_WORK_RADIUS_KM) * 100}%` } as React.CSSProperties}
                                                />
                                                <span className="pf-map-radius-val">{workRadiusKm === 0 ? 'Solo taller' : `${workRadiusKm} km`}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {addressSearchError && <p className="pf-error">{addressSearchError}</p>}
                            {(formErrors.latitude || formErrors.longitude) && (
                                <p className="pf-error">{formErrors.latitude || formErrors.longitude}</p>
                            )}
                        </div>
                    </section>
                    </div>
                    </div>
                </div>

                <div className="pf-settings-card pf-settings-card--schedule">
                    <section id="pf-section-schedule" className="pf-schedule-block">
                    <div className="pf-availability-row">
                        <span className="pf-label">Disponibilidad <span className="pf-section-tag">Opcional</span></span>
                        <div className="pf-days" role="group" aria-label="Días de atención">
                            {VALID_DAYS_OF_WEEK.map(day => {
                                const isSelected = availability.daysOfWeek.includes(day);
                                return (
                                    <button
                                        key={day}
                                        type="button"
                                        aria-pressed={isSelected}
                                        className={`pf-day${isSelected ? ' pf-day--on' : ''}`}
                                        onClick={() => toggleDay(day)}
                                    >
                                        {DAY_LETTER[day] ?? day[0]}
                                    </button>
                                );
                            })}
                        </div>
                        {availability.daysOfWeek.length > 0 ? (
                            <div className="pf-time-row">
                                <input
                                    id="startTime"
                                    type="time"
                                    className="pf-input pf-input--time"
                                    value={availability.startTime}
                                    onChange={(e) => setAvailability(prev => ({ ...prev, startTime: e.target.value }))}
                                />
                                <span className="pf-time-sep">—</span>
                                <input
                                    id="endTime"
                                    type="time"
                                    className="pf-input pf-input--time"
                                    value={availability.endTime}
                                    onChange={(e) => setAvailability(prev => ({ ...prev, endTime: e.target.value }))}
                                />
                            </div>
                        ) : (
                            <p className="pf-schedule-empty">Selecciona días para definir horario</p>
                        )}
                    </div>
                    {formErrors.availability && <p className="pf-error">{formErrors.availability}</p>}
                    </section>
                </div>

                {formErrors.general && (
                    <div className="pf-alert">
                        <div>{formErrors.general}</div>
                        {formErrors.relocationRequired === 'true' && (
                            <Button
                                type="button"
                                size="sm"
                                className="pf-btn-save mt-2"
                                onClick={() => {
                                    closeEditor();
                                    setTimeout(() => window.dispatchEvent(new CustomEvent('openExpertRelocationWizard')), 50);
                                }}
                            >
                                <Plane className="w-4 h-4 mr-2" />
                                Iniciar asistente de mudanza
                            </Button>
                        )}
                    </div>
                )}
            </form>
        </div>
    );

    if (embedded) {
        return (
            <div className="pf-editor pf-editor--embedded">
                <div className="pf-editor-body">
                    <div className="pf-editor-frame">{editorCard}</div>
                </div>
                <footer className="pf-editor-footer pf-editor-save-mobile">{mobileFooterActions}</footer>
            </div>
        );
    }

    return (
        <Drawer
            open={showEditForm}
            onOpenChange={(open) => { if (open && !showEditForm) setShowEditForm?.(true); }}
            dismissible={false}
            repositionInputs={false}
            shouldScaleBackground={false}
        >
            <DrawerContent
                className="h-[100dvh] max-h-[100dvh] rounded-none border-0 flex flex-col"
                onOpenAutoFocus={(e) => e.preventDefault()}
                onCloseAutoFocus={(e) => e.preventDefault()}
                onPointerDownOutside={(e) => {
                    if ((e.target as HTMLElement | null)?.closest('[data-relocation-wizard]')) return;
                    e.preventDefault();
                }}
                onInteractOutside={(e) => {
                    if ((e.target as HTMLElement | null)?.closest('[data-relocation-wizard]')) return;
                    e.preventDefault();
                }}
                onFocusOutside={(e) => {
                    if ((e.target as HTMLElement | null)?.closest('[data-relocation-wizard]')) return;
                    e.preventDefault();
                }}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <header className="pf-drawer-header">
                    <DrawerTitle asChild><h2>Editar perfil</h2></DrawerTitle>
                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={closeEditor} aria-label="Cerrar">
                        <X className="h-4 w-4" />
                    </Button>
                </header>
                <div className="pf-drawer-body">
                    <div className="pf-editor-frame">{editorCard}</div>
                </div>
                <footer className="pf-drawer-footer">
                    {mobileFooterActions}
                </footer>
            </DrawerContent>
        </Drawer>
    );
}
