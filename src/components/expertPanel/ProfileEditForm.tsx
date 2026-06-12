import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { markFilePickerOpening } from '../../utils/filePickerGuard';
import { CheckCircle, Loader2, XCircle, Upload, User, MapPin, X, Clock, Plane } from 'lucide-react';
// 🛡️ Round 28: migración Google Maps → Mapbox (react-map-gl@^7 + mapbox-gl@^3).
import Map, {
    Marker,
    NavigationControl,
    Source,
    Layer,
    type MapRef,
    type MapMouseEvent,
    type MarkerDragEvent,
} from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { circlePolygonGeoJSON } from '../../utils/geoCircle';
import { useExpertProfile, AvailabilityFormData } from '../../hooks/useExpertProfile';
import { VALID_DAYS_OF_WEEK, DAY_NAMES_ES, CurrentExpertAvailabilityDto } from '../../types/stripe';
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
} from '../ui/drawer';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';

// 🛡️ Round 28: token Mapbox vía env var (preferido VITE_MAPBOX_PUBLIC_TOKEN; fallback al usado por mapboxGeocoding).
const MAPBOX_TOKEN =
    import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN ||
    import.meta.env.VITE_MAPBOX_ACCESS_TOKEN ||
    '';

// 🛡️ Round 28: estilo Mapbox claro, equivalente visual a los estilos custom anteriores de Google Maps.
const MAPBOX_STYLE = 'mapbox://styles/mapbox/light-v11';

// Centro fallback (Madrid) sólo si el experto aún no tiene coords guardadas.
const defaultCenter = {
    lat: 40.4168,
    lng: -3.7038,
};

// Radio de trabajo por defecto (en km) si el perfil aún no tiene WorkRadiusKm (backend default = 100).
const DEFAULT_WORK_RADIUS_KM = 100;
// Límite máximo del radio de trabajo configurable (igual que la validación del backend).
const MAX_WORK_RADIUS_KM = 200;

// Lee el radio de trabajo del perfil aceptando ambos casings (la API serializa PascalCase).
function readWorkRadiusKm(profile: unknown): number {
    const p = profile as { workRadiusKm?: unknown; WorkRadiusKm?: unknown } | null | undefined;
    const raw = p?.workRadiusKm ?? p?.WorkRadiusKm;
    const value = Number(raw);
    if (Number.isFinite(value) && value >= 0 && value <= MAX_WORK_RADIUS_KM) return value;
    return DEFAULT_WORK_RADIUS_KM;
}

// 🛡️ Round 28: colores azules translúcidos heredados del círculo de Google Maps original.
const CIRCLE_FILL_COLOR = '#1e40af';
const CIRCLE_FILL_OPACITY = 0.15;
const CIRCLE_LINE_COLOR = 'rgba(30, 64, 175, 0.5)';
const CIRCLE_LINE_WIDTH = 2;

interface ProfileEditFormProps {
    showEditForm: boolean;
    setShowEditForm: (value: boolean) => void;
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
}

export function ProfileEditForm({
    showEditForm,
    setShowEditForm,
    profile,
    onProfileUpdated,
}: ProfileEditFormProps) {
    const { updateExpertProfile, isUpdating } = useExpertProfile();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const prevShowEditFormRef = useRef(false);
    const localPreviewBlobRef = useRef<string | null>(null);
    // 🛡️ Round 28: ref tipada de react-map-gl; permite recentrar/animar tras cambios.
    const mapRef = useRef<MapRef | null>(null);

    const [formData, setFormData] = useState({
        description: profile?.description || '',
        latitude: profile?.latitude?.toString() || '',
        longitude: profile?.longitude?.toString() || '',
    });

    // Formatear tiempo de TimeSpan (HH:mm:ss) a HH:mm
    const formatTimeFromTimeSpan = (timeSpan: string): string => {
        if (!timeSpan) return '';
        const parts = timeSpan.split(':');
        return `${parts[0]}:${parts[1]}`;
    };

    // ✅ CRÍTICO: Inicializar disponibilidad desde el perfil con transformación correcta
    const initialAvailability: AvailabilityFormData = profile?.currentAvailability ? {
        daysOfWeek: (() => {
            // Manejar tanto camelCase como PascalCase
            const days = profile?.currentAvailability?.daysOfWeek ??
                        (profile?.currentAvailability as any)?.DaysOfWeek ??
                        [];
            console.log('🔍 ProfileEditForm: Initial availability daysOfWeek:', days);
            return Array.isArray(days) ? days : [];
        })(),
        startTime: formatTimeFromTimeSpan(
            profile?.currentAvailability?.startTime ??
            (profile?.currentAvailability as any)?.StartTime ??
            ''
        ),
        endTime: formatTimeFromTimeSpan(
            profile?.currentAvailability?.endTime ??
            (profile?.currentAvailability as any)?.EndTime ??
            ''
        ),
    } : {
        daysOfWeek: [],
        startTime: '09:00',
        endTime: '18:00',
    };

    const [availability, setAvailability] = useState<AvailabilityFormData>(initialAvailability);

    const [profilePicture, setProfilePicture] = useState<File | null>(null);
    // ✅ Inicializar previewUrl como null, se actualizará en useEffect
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

    // 🛡️ Round 28: centro inicial = coords del experto si existen; si no, Madrid.
    const initialLocation = useMemo(() => {
        const lat = Number(profile?.latitude);
        const lng = Number(profile?.longitude);
        if (Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0)) {
            return { lat, lng };
        }
        return defaultCenter;
    }, [profile?.latitude, profile?.longitude]);

    const [selectedLocation, setSelectedLocation] = useState(initialLocation);

    // Rango de trabajo del experto: 0 = solo en su taller/punto fijo, máx 200 km.
    const [workRadiusKm, setWorkRadiusKm] = useState<number>(() => readWorkRadiusKm(profile));

    useEffect(() => {
        const justOpened = showEditForm && !prevShowEditFormRef.current;
        prevShowEditFormRef.current = showEditForm;

        if (!showEditForm || !profile || !justOpened) {
            return;
        }

        setFormData({
            description: profile.description || '',
            latitude: profile.latitude?.toString() || '',
            longitude: profile.longitude?.toString() || '',
        });
        setProfilePicture(null);
        setFormErrors({});

        const profileImageUrl = (profile as any)?.ProfilePictureUrl || profile.profilePictureUrl || null;
        setPreviewUrl(profileImageUrl);

        const newAvailability: AvailabilityFormData = profile.currentAvailability ? {
            daysOfWeek: (() => {
                const days = profile.currentAvailability?.daysOfWeek ??
                    (profile.currentAvailability as any)?.DaysOfWeek ??
                    [];
                return Array.isArray(days) ? days : [];
            })(),
            startTime: formatTimeFromTimeSpan(
                profile.currentAvailability.startTime ??
                (profile.currentAvailability as any)?.StartTime ??
                ''
            ),
            endTime: formatTimeFromTimeSpan(
                profile.currentAvailability.endTime ??
                (profile.currentAvailability as any)?.EndTime ??
                ''
            ),
        } : {
            daysOfWeek: [],
            startTime: '09:00',
            endTime: '18:00',
        };
        setAvailability(newAvailability);

        const lat = Number(profile.latitude);
        const lng = Number(profile.longitude);
        const newLocation =
            Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0)
                ? { lat, lng }
                : defaultCenter;

        setSelectedLocation(newLocation);
        setWorkRadiusKm(readWorkRadiusKm(profile));

        // 🛡️ Round 28: recentrar el mapa al abrir el formulario.
        const map = mapRef.current;
        if (map) {
            map.flyTo({ center: [newLocation.lng, newLocation.lat], duration: 0 });
        }
    }, [showEditForm, profile?.id]);

    useBodyScrollLock(showEditForm);

    useEffect(() => {
        if (showEditForm) {
            document.body.dataset.drawerOpen = 'profile';
        } else if (document.body.dataset.drawerOpen === 'profile') {
            delete document.body.dataset.drawerOpen;
        }
        return () => {
            if (document.body.dataset.drawerOpen === 'profile') {
                delete document.body.dataset.drawerOpen;
            }
        };
    }, [showEditForm]);

    const validateForm = () => {
        const errors: { [key: string]: string } = {};

        if (!formData.description.trim()) {
            errors.description = 'La descripción es requerida';
        } else if (formData.description.length < 10) {
            errors.description = 'La descripción debe tener al menos 10 caracteres';
        } else if (formData.description.length > 500) {
            errors.description = 'La descripción no puede superar los 500 caracteres';
        }

        if (!formData.latitude) {
            errors.latitude = 'La latitud es requerida';
        } else {
            const lat = parseFloat(formData.latitude);
            if (isNaN(lat) || lat < -90 || lat > 90) {
                errors.latitude = 'La latitud debe estar entre -90 y 90';
            }
        }

        if (!formData.longitude) {
            errors.longitude = 'La longitud es requerida';
        } else {
            const lng = parseFloat(formData.longitude);
            if (isNaN(lng) || lng < -180 || lng > 180) {
                errors.longitude = 'La longitud debe estar entre -180 y 180';
            }
        }

        if (availability.daysOfWeek.length === 0) {
            errors.availability = 'Selecciona al menos un día de disponibilidad';
        } else if (!availability.startTime || !availability.endTime) {
            errors.availability = 'Debes especificar hora de inicio y fin';
        } else {
            const [startH, startM] = availability.startTime.split(':').map(Number);
            const [endH, endM] = availability.endTime.split(':').map(Number);

            if (Number.isNaN(startH) || Number.isNaN(endH)) {
                errors.availability = 'Horario de disponibilidad no válido';
            } else {
                const startMinutes = startH * 60 + startM;
                const endMinutes = endH * 60 + endM;

                if (startMinutes >= endMinutes) {
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

        if (localPreviewBlobRef.current) {
            URL.revokeObjectURL(localPreviewBlobRef.current);
        }
        const blobUrl = URL.createObjectURL(file);
        localPreviewBlobRef.current = blobUrl;
        setProfilePicture(file);
        setPreviewUrl(blobUrl);
        setFormErrors(prev => ({ ...prev, profilePicture: '' }));
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const openFilePicker = useCallback(() => {
        markFilePickerOpening();
        fileInputRef.current?.click();
    }, []);

    const removeImage = () => {
        setProfilePicture(null);
        setPreviewUrl(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // 🛡️ Round 28: GeoJSON del círculo de cobertura — se recalcula cuando cambia la ubicación
    // o el rango elegido. Con rango 0 (solo taller) no se dibuja círculo, solo el marcador.
    const coverageGeoJSON = useMemo(
        () =>
            workRadiusKm > 0
                ? circlePolygonGeoJSON(
                      selectedLocation.lng,
                      selectedLocation.lat,
                      workRadiusKm,
                  )
                : null,
        [selectedLocation.lat, selectedLocation.lng, workRadiusKm],
    );

    // 🛡️ Round 28: click en el mapa → fijar ubicación + sincronizar inputs y limpiar errores.
    const handleMapClick = useCallback((e: MapMouseEvent) => {
        const { lng, lat } = e.lngLat;
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

        const newLocation = { lat, lng };
        setSelectedLocation(newLocation);
        setFormData(prev => ({
            ...prev,
            latitude: lat.toString(),
            longitude: lng.toString(),
        }));
        setFormErrors(prev => ({
            ...prev,
            latitude: '',
            longitude: '',
        }));
    }, []);

    // 🛡️ Round 28: marker arrastrable — al soltarlo, persistimos coords.
    const handleMarkerDragEnd = useCallback((e: MarkerDragEvent) => {
        const { lng, lat } = e.lngLat;
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

        const newLocation = { lat, lng };
        setSelectedLocation(newLocation);
        setFormData(prev => ({
            ...prev,
            latitude: lat.toString(),
            longitude: lng.toString(),
        }));
        setFormErrors(prev => ({
            ...prev,
            latitude: '',
            longitude: '',
        }));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            // Incluir disponibilidad solo si hay días seleccionados
            const availabilityData = availability;

            console.log('🔍 ProfileEditForm: Submitting with availability:', availabilityData);
            console.log('🔍 ProfileEditForm: daysOfWeek to send:', availabilityData?.daysOfWeek);
            console.log('🔍 ProfileEditForm: startTime to send:', availabilityData?.startTime);
            console.log('🔍 ProfileEditForm: endTime to send:', availabilityData?.endTime);

            await updateExpertProfile({
                description: formData.description.trim(),
                latitude: formData.latitude,
                longitude: formData.longitude,
                profilePicture: profilePicture || undefined,
                availability: availabilityData,
                workRadiusKm,
            });

            setShowEditForm(false);
            onProfileUpdated();

            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: {
                    type: 'success',
                    message: 'Perfil actualizado exitosamente',
                },
            }));
        } catch (error: any) {
            console.error('Error updating profile:', error);
            // 🛡️ Round 28 MUD-2: distinguir STRIPE_COUNTRY_LOCKED para guiar al experto al
            // flujo de mudanza (cerrar cuenta + re-registrarse) en vez de mostrar texto plano.
            // El backend devuelve errorCode + detectedCountry; el hook los propaga en el Error.
            if (error?.errorCode === 'STRIPE_COUNTRY_LOCKED') {
                const detected = error?.detectedCountry ? ` (${error.detectedCountry})` : '';
                setFormErrors({
                    general: error.message,
                    // Marcador especial para que el componente pueda mostrar CTA al wizard de mudanza.
                    relocationRequired: 'true',
                });
                // Notificación destacada con call-to-action.
                window.dispatchEvent(new CustomEvent('showNotification', {
                    detail: {
                        type: 'warning',
                        message: `Para operar desde otro país${detected}, debes cerrar tu cuenta Stripe actual y volver a registrarte. Ve al panel de experto → "Mudarme a otro país".`,
                        duration: 12000,
                    },
                }));
            } else if (error?.errorCode === 'COUNTRY_NOT_SUPPORTED') {
                setFormErrors({
                    general: error.message,
                    countryNotSupported: 'true',
                });
            } else {
                setFormErrors({ general: error.message || 'Error al actualizar el perfil' });
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

        // Resetear disponibilidad
        const resetAvailability: AvailabilityFormData = profile.currentAvailability ? {
            daysOfWeek: profile.currentAvailability.daysOfWeek || [],
            startTime: formatTimeFromTimeSpan(profile.currentAvailability.startTime),
            endTime: formatTimeFromTimeSpan(profile.currentAvailability.endTime),
        } : {
            daysOfWeek: [],
            startTime: '09:00',
            endTime: '18:00',
        };
        setAvailability(resetAvailability);

        // Resetear la ubicación del mapa
        const lat = Number(profile.latitude);
        const lng = Number(profile.longitude);
        const resetLocation =
            Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0)
                ? { lat, lng }
                : defaultCenter;

        setSelectedLocation(resetLocation);
        setWorkRadiusKm(readWorkRadiusKm(profile));

        // 🛡️ Round 28: recentrar el mapa al resetear.
        const map = mapRef.current;
        if (map) {
            map.flyTo({ center: [resetLocation.lng, resetLocation.lat], duration: 300 });
        }

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const toggleDay = (day: string) => {
        console.log('🔍 toggleDay called with day:', day);
        setAvailability(prev => {
            const newDays = prev.daysOfWeek.includes(day)
                ? prev.daysOfWeek.filter(d => d !== day)
                : [...prev.daysOfWeek, day];
            console.log('🔍 toggleDay: Previous days:', prev.daysOfWeek);
            console.log('🔍 toggleDay: New days:', newDays);
            return {
                ...prev,
                daysOfWeek: newDays
            };
        });
    };

    if (!profile) {
        return null;
    }

    return (
        <Drawer
            open={showEditForm}
            onOpenChange={(open) => {
                if (open && !showEditForm) {
                    setShowEditForm(true);
                }
            }}
            dismissible={false}
            repositionInputs={false}
            shouldScaleBackground={false}
        >
            <DrawerContent
                className="max-h-[96vh] flex flex-col md:max-h-[90vh] md:h-[90vh]"
                onOpenAutoFocus={(e) => e.preventDefault()}
                onCloseAutoFocus={(e) => e.preventDefault()}
                // 🛡️ Round 28 MUD-T: si el target está dentro del wizard de mudanza
                // (portal renderizado en body con [data-relocation-wizard]), dejar pasar
                // — el wizard tiene su propio modal y su propia overlay. Sin esto,
                // Vaul bloquea TODOS los clicks "fuera" del DrawerContent y el wizard
                // queda interactivamente muerto (visible pero clicks inertes).
                onPointerDownOutside={(e) => {
                    const target = e.target as HTMLElement | null;
                    if (target?.closest('[data-relocation-wizard]')) return; // dejar pasar
                    e.preventDefault();
                }}
                onInteractOutside={(e) => {
                    const target = e.target as HTMLElement | null;
                    if (target?.closest('[data-relocation-wizard]')) return;
                    e.preventDefault();
                }}
                onFocusOutside={(e) => {
                    const target = e.target as HTMLElement | null;
                    if (target?.closest('[data-relocation-wizard]')) return;
                    e.preventDefault();
                }}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <div className="mx-auto w-full max-w-7xl flex flex-col h-full max-h-[96vh] md:max-h-[90vh] md:h-[90vh]">
                    <DrawerHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b border-border flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <DrawerTitle className="text-lg sm:text-xl font-semibold">Editar Perfil de Experto</DrawerTitle>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowEditForm(false)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </DrawerHeader>
                    {/* Contenido: móvil en columna única con scroll, desktop en dos columnas sin scroll */}
                    <div className="px-4 sm:px-6 py-4 sm:py-6 md:py-5 flex-1 min-h-0 overflow-y-auto md:overflow-y-hidden">
                        <div className="max-w-3xl mx-auto w-full md:max-w-none md:grid md:grid-cols-2 md:gap-6 lg:gap-8 md:items-start space-y-4 sm:space-y-5 md:space-y-0 md:h-full md:overflow-y-auto md:pr-2">
                            {/* Columna izquierda - Información del perfil */}
                            <div className="md:space-y-4 md:space-y-5 space-y-4 sm:space-y-5">
                        {/* Imagen de perfil */}
                                <div className="space-y-2">
                                    <Label>Foto de perfil</Label>
                                    <div className="flex items-center gap-4">
                                <div className="flex-shrink-0 relative">
                                    {(() => {
                                        // ✅ Priorizar previewUrl (imagen nueva seleccionada), luego ProfilePictureUrl del nivel superior
                                        // ✅ IMPORTANTE: Usar ProfilePictureUrl (PascalCase) del objeto principal, NO del objeto User
                                        const imageUrl = previewUrl ||
                                                       (profile as any)?.ProfilePictureUrl ||
                                                       profile.profilePictureUrl ||
                                                       null;
                                        console.log('🔍 ProfileEditForm (render): imageUrl:', imageUrl);
                                        console.log('🔍 ProfileEditForm (render): previewUrl:', previewUrl);
                                        console.log('🔍 ProfileEditForm (render): profile.profilePictureUrl:', profile.profilePictureUrl);

                                        if (imageUrl) {
                                            return (
                                                <>
                                                    <img
                                                        src={imageUrl}
                                                        alt="Profile"
                                                        className="w-20 h-20 rounded-full object-cover border-2 border-border"
                                                        onError={(e) => {
                                                            // ✅ Si la imagen falla al cargar, ocultar y mostrar placeholder
                                                            console.error('❌ ProfileEditForm: Error loading image:', imageUrl);
                                                            e.currentTarget.style.display = 'none';
                                                            const placeholder = e.currentTarget.nextElementSibling as HTMLElement;
                                                            if (placeholder) {
                                                                placeholder.style.display = 'flex';
                                                            }
                                                        }}
                                                    />
                                                    <div className="w-20 h-20 bg-muted rounded-full items-center justify-center hidden">
                                                        <User className="w-10 h-10 text-muted-foreground" />
                                                    </div>
                                                </>
                                            );
                                        }
                                        return (
                                            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
                                                <User className="w-10 h-10 text-muted-foreground" />
                                            </div>
                                        );
                                    })()}
                                </div>
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Button
                                            type="button"
                                                    variant="outline"
                                                    size="sm"
                                            onClick={openFilePicker}
                                        >
                                                    <Upload className="w-4 h-4 mr-2" />
                                            Cambiar
                                                </Button>
                                        {(previewUrl || profilePicture) && (
                                                    <Button
                                                type="button"
                                                        variant="outline"
                                                        size="sm"
                                                onClick={removeImage}
                                            >
                                                        <XCircle className="w-4 h-4 mr-2" />
                                                Quitar
                                                    </Button>
                                        )}
                                    </div>
                                            <p className="text-xs text-muted-foreground">PNG, JPG (máx. 5MB)</p>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/jpg"
                                        onChange={handleImageSelect}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            markFilePickerOpening();
                                        }}
                                        className="hidden"
                                    />
                                </div>
                            </div>
                            {formErrors.profilePicture && (
                                        <p className="text-sm text-destructive">{formErrors.profilePicture}</p>
                            )}
                        </div>

                                <Separator />

                        {/* Descripción */}
                                <div className="space-y-2">
                                    <Label htmlFor="description">
                                Descripción ({formData.description.length}/500)
                                    </Label>
                            <textarea
                                        id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className={`flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y ${
                                            formErrors.description ? 'border-destructive' : ''
                                }`}
                                rows={4}
                                maxLength={500}
                                placeholder="Describe tu experiencia y servicios como experto..."
                                required
                            />
                            {formErrors.description && (
                                        <p className="text-sm text-destructive">{formErrors.description}</p>
                            )}
                        </div>

                                <Separator className="md:hidden" />

                                {/* Disponibilidad horaria */}
                                <div className="space-y-3">
                                    <div className="space-y-1.5">
                                        <Label className="flex items-center gap-2 text-sm font-semibold">
                                            <Clock className="w-4 h-4 text-muted-foreground" />
                                            Disponibilidad horaria
                                            <span className="text-xs font-normal text-muted-foreground">(Opcional)</span>
                                        </Label>
                                        <p className="text-xs text-muted-foreground pl-6">
                                            Define los días y horarios en los que estarás disponible para recibir contrataciones.
                                        </p>
                                    </div>

                                    {/* Días de la semana */}
                                    <div className="space-y-2">
                                        <Label className="text-xs font-medium text-muted-foreground">Días de trabajo</Label>
                                        <div className="grid grid-cols-7 gap-1.5">
                                            {VALID_DAYS_OF_WEEK.map(day => {
                                                const isSelected = availability.daysOfWeek.includes(day);
                                                return (
                                                    <Button
                                                        key={day}
                                                        type="button"
                                                        variant={isSelected ? "default" : "outline"}
                                                        size="sm"
                                                        onClick={() => toggleDay(day)}
                                                        className={`text-xs font-medium transition-all ${
                                                            isSelected
                                                                ? "bg-primary text-primary-foreground shadow-sm"
                                                                : "hover:bg-accent"
                                                        }`}
                                                    >
                                                        {DAY_NAMES_ES[day as keyof typeof DAY_NAMES_ES].substring(0, 2)}
                                                    </Button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Horario */}
                                    {availability.daysOfWeek.length > 0 && (
                                        <div className="grid grid-cols-2 gap-3 pt-1">
                                            <div className="space-y-1.5">
                                                <Label htmlFor="startTime" className="text-xs font-medium text-muted-foreground">Hora de inicio</Label>
                                                <input
                                                    id="startTime"
                                                    type="time"
                                                    value={availability.startTime}
                                                    onChange={(e) => setAvailability(prev => ({ ...prev, startTime: e.target.value }))}
                                                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                    required={availability.daysOfWeek.length > 0}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label htmlFor="endTime" className="text-xs font-medium text-muted-foreground">Hora de fin</Label>
                                                <input
                                                    id="endTime"
                                                    type="time"
                                                    value={availability.endTime}
                                                    onChange={(e) => setAvailability(prev => ({ ...prev, endTime: e.target.value }))}
                                                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                    required={availability.daysOfWeek.length > 0}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {formErrors.availability && (
                                        <p className="text-sm text-destructive mt-1">{formErrors.availability}</p>
                                    )}
                                </div>
                            </div>

                            {/* Columna derecha - Ubicación */}
                            <div className="md:space-y-4 md:space-y-5 space-y-4 sm:space-y-5">
                                <Separator className="md:hidden" />

                                {/* Ubicación con mapa */}
                                <div className="space-y-2">
                                    <Label>Ubicación del servicio</Label>

                                    {/* 🛡️ Round 28: si falta el token, mostrar mensaje claro en lugar de un mapa roto. */}
                                    {!MAPBOX_TOKEN ? (
                                        <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4">
                                            <p className="text-sm text-destructive">
                                                Falta configurar <code className="font-mono">VITE_MAPBOX_PUBLIC_TOKEN</code>. El mapa no puede cargarse.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="border border-border rounded-lg overflow-hidden shadow-sm">
                                            {/* 🛡️ Round 28: Map de react-map-gl/mapbox con marker draggable + círculo GeoJSON. */}
                                            <Map
                                                ref={mapRef}
                                                mapboxAccessToken={MAPBOX_TOKEN}
                                                initialViewState={{
                                                    longitude: initialLocation.lng,
                                                    latitude: initialLocation.lat,
                                                    zoom: 6,
                                                }}
                                                style={{ width: '100%', height: 240 }}
                                                mapStyle={MAPBOX_STYLE}
                                                onClick={handleMapClick}
                                                cursor="pointer"
                                                attributionControl={false}
                                                dragRotate={false}
                                                pitchWithRotate={false}
                                                touchPitch={false}
                                            >
                                                <NavigationControl position="top-right" showCompass={false} />

                                                {/* 🛡️ Round 28: círculo de cobertura como Source GeoJSON + 2 capas (fill + line) en azul translúcido.
                                                    Con rango 0 (solo taller) no hay círculo: solo el marcador del punto fijo. */}
                                                {coverageGeoJSON && (
                                                    <Source id="coverage" type="geojson" data={coverageGeoJSON}>
                                                        <Layer
                                                            id="coverage-fill"
                                                            type="fill"
                                                            paint={{
                                                                'fill-color': CIRCLE_FILL_COLOR,
                                                                'fill-opacity': CIRCLE_FILL_OPACITY,
                                                            }}
                                                        />
                                                        <Layer
                                                            id="coverage-line"
                                                            type="line"
                                                            paint={{
                                                                'line-color': CIRCLE_LINE_COLOR,
                                                                'line-width': CIRCLE_LINE_WIDTH,
                                                            }}
                                                        />
                                                    </Source>
                                                )}

                                                {/* 🛡️ Round 28: marker draggable con el mismo div azul #1e40af de antes. */}
                                                <Marker
                                                    longitude={selectedLocation.lng}
                                                    latitude={selectedLocation.lat}
                                                    draggable
                                                    onDragEnd={handleMarkerDragEnd}
                                                    anchor="center"
                                                >
                                                    <div
                                                        style={{
                                                            width: 18,
                                                            height: 18,
                                                            borderRadius: '50%',
                                                            background: '#1e40af',
                                                            border: '2px solid #ffffff',
                                                            boxShadow: '0 2px 6px rgba(30, 64, 175, 0.4)',
                                                            cursor: 'grab',
                                                        }}
                                                        aria-label="Marcador de ubicación del experto"
                                                    />
                                                </Marker>
                                            </Map>
                                        </div>
                                    )}

                            {/* Mostrar coordenadas seleccionadas */}
                                    <div className="text-xs text-muted-foreground">
                                <span>Ubicación seleccionada: </span>
                                <span className="font-mono">
                                    {typeof selectedLocation.lat === 'number' ? selectedLocation.lat.toFixed(6) : '0.000000'}, {typeof selectedLocation.lng === 'number' ? selectedLocation.lng.toFixed(6) : '0.000000'}
                                </span>
                            </div>

                            {(formErrors.latitude || formErrors.longitude) && (
                                        <p className="text-sm text-destructive">
                                    {formErrors.latitude || formErrors.longitude}
                                </p>
                            )}

                        {/* Información de ubicación */}
                                    <div className="bg-muted/30 border border-border/50 rounded-md p-2.5">
                            <div className="flex items-start gap-2">
                                            <MapPin className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                                            <p className="text-xs text-muted-foreground leading-relaxed">
                                                {workRadiusKm === 0
                                                    ? 'Haz clic en el mapa o arrastra el marcador para fijar tu taller. Con rango 0 km, los clientes se desplazan a tu punto fijo.'
                                                    : `Haz clic en el mapa o arrastra el marcador para seleccionar tu ubicación. El círculo azul representa tu rango de trabajo de ${workRadiusKm} km.`}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Rango de trabajo del experto */}
                                    <div className="space-y-2 pt-1">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="workRadius" className="text-sm font-semibold">
                                                Rango de trabajo
                                            </Label>
                                            <span className={`text-sm font-medium ${workRadiusKm === 0 ? 'text-blue-700' : 'text-foreground'}`}>
                                                {workRadiusKm === 0 ? 'Solo en mi taller' : `${workRadiusKm} km`}
                                            </span>
                                        </div>
                                        <input
                                            id="workRadius"
                                            type="range"
                                            min={0}
                                            max={MAX_WORK_RADIUS_KM}
                                            step={5}
                                            value={workRadiusKm}
                                            onChange={(e) => setWorkRadiusKm(Number(e.target.value))}
                                            className="w-full h-2 rounded-lg accent-blue-700 cursor-pointer"
                                            aria-valuetext={workRadiusKm === 0 ? 'Solo en mi taller' : `${workRadiusKm} kilómetros`}
                                        />
                                        <div className="flex justify-between text-[11px] text-muted-foreground">
                                            <span>Solo en mi taller</span>
                                            <span>{MAX_WORK_RADIUS_KM} km</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            Distancia máxima a la que te desplazas desde tu punto fijo. Elige 0 km si solo
                                            atiendes en tu taller. Tu rango se muestra a los clientes en todas las páginas.
                                        </p>
                                    </div>
                            </div>
                        </div>

                        {formErrors.general && (
                                <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm border border-destructive/20 md:col-span-2 space-y-3">
                                    <div>{formErrors.general}</div>
                                    {/* 🛡️ Round 28 MUD-Q: CTA inline al wizard de mudanza
                                        cuando el backend rechaza por STRIPE_COUNTRY_LOCKED.
                                        Antes el usuario tenía que ir a leer dónde estaba
                                        "Mudarme a otro país" — ahora un click lo abre aquí. */}
                                    {formErrors.relocationRequired === 'true' && (
                                        <Button
                                            type="button"
                                            variant="default"
                                            size="sm"
                                            className="bg-blue-600 hover:bg-blue-700 text-white"
                                            onClick={() => {
                                                // 🛡️ Round 28 MUD-U: cerrar el Drawer del
                                                // ProfileEditForm ANTES de abrir el wizard.
                                                // Vaul/Radix marca todo lo demás como inert/
                                                // aria-hidden cuando el drawer está abierto,
                                                // así que el wizard (en portal a body) se ve
                                                // pero NO recibe eventos. Cerramos el drawer
                                                // y dispatchamos un evento global para que
                                                // ExpertPanelPage (sin drawer encima) abra
                                                // el wizard tras un tick.
                                                setShowEditForm(false);
                                                setTimeout(() => {
                                                    window.dispatchEvent(new CustomEvent('openExpertRelocationWizard'));
                                                }, 50);
                                            }}
                                        >
                                            <Plane className="w-4 h-4 mr-2" />
                                            Iniciar asistente de mudanza
                                        </Button>
                                    )}
                            </div>
                        )}
                    </div>
                </div>

                    <Separator className="flex-shrink-0" />

                    {/* Botones de acción - Fijos en la parte inferior */}
                    <div className="px-4 sm:px-6 pt-3 pb-4 sm:py-4 bg-background border-t border-border flex-shrink-0 flex flex-row justify-end gap-3 md:sticky md:bottom-0 md:z-10">
                        <div className="max-w-3xl mx-auto w-full md:max-w-none md:flex md:justify-end md:w-full">
                            <div className="flex flex-row gap-3 w-full md:ml-auto">
                                <Button
                            type="button"
                                    variant="outline"
                            onClick={() => {
                                setShowEditForm(false);
                                resetForm();
                            }}
                                    className="flex-1 md:flex-none md:w-auto"
                        >
                            Cancelar
                                </Button>
                                <Button
                            onClick={handleSubmit}
                            disabled={isUpdating}
                                    className="flex-1 md:flex-none md:w-auto"
                        >
                            {isUpdating ? (
                                <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Actualizando...
                                </>
                            ) : (
                                <>
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                    Actualizar Perfil
                                </>
                            )}
                                </Button>
                    </div>
                </div>
            </div>
        </div>
            </DrawerContent>
        </Drawer>
    );
}
