import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { markFilePickerOpening } from '../../utils/filePickerGuard';
import { CheckCircle, Loader2, XCircle, Upload, User, MapPin, X, Clock } from 'lucide-react';
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';
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

// Define a local type to match the Library enum values
type GoogleMapLibrary = 'drawing' | 'geometry';
const libraries: GoogleMapLibrary[] = ['drawing', 'geometry'];

const mapStyles = [
    {
        featureType: "all",
        elementType: "labels.text.fill",
        stylers: [{ color: "#555555" }]
    },
    {
        featureType: "water",
        elementType: "geometry",
        stylers: [{ color: "#e0f0f8" }]
    },
    {
        featureType: "landscape",
        elementType: "geometry",
        stylers: [{ color: "#f5f5f5" }]
    },
    {
        featureType: "road",
        elementType: "geometry",
        stylers: [{ color: "#e0e0e0" }]
    },
    {
        featureType: "poi",
        elementType: "geometry",
        stylers: [{ color: "#f0f5f7" }]
    },
    {
        featureType: "transit",
        elementType: "geometry",
        stylers: [{ color: "#f0f5f7" }]
    }
];

const defaultCenter = {
    lat: 40.4168,
    lng: -3.7038
};

const markerIcon = {
    path: "M -4,0 A 4,4 0 1,0 4,0 A 4,4 0 1,0 -4,0",
    fillColor: '#1e40af',
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: 1.5,
    scale: 1.5,
    zIndex: 3
};

const circleOptions = {
    fillColor: 'rgba(30, 64, 175, 0.1)',
    fillOpacity: 0.15,
    strokeColor: 'rgba(30, 64, 175, 0.5)',
    strokeOpacity: 1,
    strokeWeight: 2,
    zIndex: 1,
    clickable: false,
    editable: false,
    draggable: false
};

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
    const [selectedLocation, setSelectedLocation] = useState(defaultCenter);
    const [circle, setCircle] = useState<google.maps.Circle | null>(null);
    
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '__REDACTED_GOOGLE_API_KEY__',
        libraries
    });

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

        const newLocation = (profile.latitude && profile.longitude)
            ? { lat: Number(profile.latitude), lng: Number(profile.longitude) }
            : defaultCenter;

        setSelectedLocation(newLocation);

        if (circle) {
            circle.setCenter(newLocation);
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

    const onLoad = (map: google.maps.Map) => {
        const initialCircle = new google.maps.Circle({
            map: map,
            center: selectedLocation,
            radius: 100000, // 100km en metros
            ...circleOptions
        });
        setCircle(initialCircle);
    };

    const handleMapClick = (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
            const newLocation = {
                lat: e.latLng.lat(),
                lng: e.latLng.lng(),
            };
            
            setSelectedLocation(newLocation);
            setFormData(prev => ({
                ...prev,
                latitude: newLocation.lat.toString(),
                longitude: newLocation.lng.toString(),
            }));
            
            // Actualizar el círculo si existe
            if (circle) {
                circle.setCenter(newLocation);
            }
            
            // Limpiar errores de ubicación si los hay
            setFormErrors(prev => ({
                ...prev,
                latitude: '',
                longitude: ''
            }));
        }
    };

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
            setFormErrors({ general: error.message || 'Error al actualizar el perfil' });
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
        const resetLocation = (profile.latitude && profile.longitude) 
            ? { lat: Number(profile.latitude), lng: Number(profile.longitude) }
            : defaultCenter;
            
        setSelectedLocation(resetLocation);
        
        // Actualizar el círculo si existe
        if (circle) {
            circle.setCenter(resetLocation);
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
                onPointerDownOutside={(e) => e.preventDefault()}
                onInteractOutside={(e) => e.preventDefault()}
                onFocusOutside={(e) => e.preventDefault()}
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
                                    
                                    {loadError ? (
                                        <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4">
                                            <p className="text-sm text-destructive">Error al cargar el mapa. Por favor, recarga la página.</p>
                                </div>
                            ) : !isLoaded ? (
                                        <div className="bg-muted border border-border rounded-md p-8 flex items-center justify-center">
                                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                                            <span className="ml-2 text-sm text-muted-foreground">Cargando mapa...</span>
                                </div>
                            ) : (
                                        <div className="border border-border rounded-lg overflow-hidden shadow-sm">
                                    <GoogleMap
                                        mapContainerStyle={{
                                            width: '100%',
                                                    height: '240px'
                                        }}
                                        center={selectedLocation}
                                        zoom={6}
                                        onLoad={onLoad}
                                        onClick={handleMapClick}
                                        options={{
                                            styles: mapStyles,
                                            disableDefaultUI: false,
                                            zoomControl: true,
                                            mapTypeControl: false,
                                                    scaleControl: false,
                                            streetViewControl: false,
                                            rotateControl: false,
                                                    fullscreenControl: false,
                                        }}
                                    >
                                        <Marker
                                            position={selectedLocation}
                                            icon={markerIcon}
                                        />
                                    </GoogleMap>
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
                                                Haz clic en el mapa para seleccionar tu ubicación. El círculo azul representa un rango de 100km.
                                            </p>
                                        </div>
                                    </div>
                            </div>
                        </div>

                        {formErrors.general && (
                                <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm border border-destructive/20 md:col-span-2">
                                {formErrors.general}
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
