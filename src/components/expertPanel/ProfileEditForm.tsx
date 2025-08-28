import React, { useState, useRef, useEffect } from 'react';
import { CheckCircle, Loader2, XCircle, Upload, User, MapPin } from 'lucide-react';
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';
import { useExpertProfile } from '../../hooks/useExpertProfile';

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
        latitude?: number;
        longitude?: number;
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

    const [formData, setFormData] = useState({
        description: profile.description || '',
        latitude: profile.latitude?.toString() || '',
        longitude: profile.longitude?.toString() || '',
    });

    const [profilePicture, setProfilePicture] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
    const [selectedLocation, setSelectedLocation] = useState(defaultCenter);
    const [circle, setCircle] = useState<google.maps.Circle | null>(null);
    
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: "__REDACTED_GOOGLE_API_KEY__",
        libraries
    });

    useEffect(() => {
        if (showEditForm && profile) {
            setFormData({
                description: profile.description || '',
                latitude: profile.latitude?.toString() || '',
                longitude: profile.longitude?.toString() || '',
            });
            setProfilePicture(null);
            setPreviewUrl(profile.profilePictureUrl || null);
            setFormErrors({});
            
            // Actualizar la ubicación seleccionada en el mapa
            const newLocation = (profile.latitude && profile.longitude) 
                ? { lat: Number(profile.latitude), lng: Number(profile.longitude) }
                : defaultCenter;
                
            setSelectedLocation(newLocation);
            
            // Actualizar el círculo si ya existe
            if (circle) {
                circle.setCenter(newLocation);
            }
        }
    }, [showEditForm, profile]);

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

        setProfilePicture(file);
        setPreviewUrl(URL.createObjectURL(file));
        setFormErrors(prev => ({ ...prev, profilePicture: '' }));
    };

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
            await updateExpertProfile({
                description: formData.description.trim(),
                latitude: formData.latitude,
                longitude: formData.longitude,
                profilePicture: profilePicture || undefined,
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

    if (!showEditForm) return null;

    return (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-start sm:items-center justify-center z-50 p-2 sm:p-4 pt-12 sm:pt-4">
            <div className="bg-white rounded-xl pt-6 px-4 pb-4 sm:p-6 lg:p-8 max-w-2xl w-full max-h-[85vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl transform transition-all duration-300 ease-in-out mt-6 sm:mt-0">
                <div className="space-y-4 sm:space-y-6">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 border-b pb-2">
                        Editar Perfil de Experto
                    </h3>

                    <div className="space-y-4 sm:space-y-6">
                        {/* Imagen de perfil */}
                        <div>
                            <label className="block text-xs font-normal text-gray-500 mb-2">Foto de perfil</label>
                            <div className="flex items-center space-x-4">
                                <div className="flex-shrink-0">
                                    {previewUrl || profile.profilePictureUrl ? (
                                        <img
                                            src={previewUrl || profile.profilePictureUrl}
                                            alt="Profile"
                                            className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                                        />
                                    ) : (
                                        <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                                            <User className="w-8 h-8 text-blue-600" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center space-x-2">
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-lg transition-colors"
                                        >
                                            <Upload className="w-3 h-3 inline mr-1" />
                                            Cambiar
                                        </button>
                                        {(previewUrl || profilePicture) && (
                                            <button
                                                type="button"
                                                onClick={removeImage}
                                                className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 text-xs rounded-lg transition-colors"
                                            >
                                                <XCircle className="w-3 h-3 inline mr-1" />
                                                Quitar
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">PNG, JPG (máx. 5MB)</p>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/jpg"
                                        onChange={handleImageSelect}
                                        className="hidden"
                                    />
                                </div>
                            </div>
                            {formErrors.profilePicture && (
                                <p className="mt-1 text-xs text-red-500">{formErrors.profilePicture}</p>
                            )}
                        </div>

                        {/* Descripción */}
                        <div>
                            <label className="block text-xs font-normal text-gray-500 mb-2">
                                Descripción ({formData.description.length}/500)
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-gray-300 focus:border-gray-400 focus:outline-none transition-colors resize-y ${
                                    formErrors.description ? 'border-red-300' : 'border-gray-200 bg-gray-50/50'
                                }`}
                                rows={4}
                                maxLength={500}
                                placeholder="Describe tu experiencia y servicios como experto..."
                                required
                            />
                            {formErrors.description && (
                                <p className="mt-1 text-xs text-red-500">{formErrors.description}</p>
                            )}
                        </div>

                        {/* Ubicación con mapa */}
                        <div>
                            <label className="block text-xs font-normal text-gray-500 mb-2">Ubicación del servicio</label>
                            
                            {loadError ? (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <p className="text-sm text-red-600">Error al cargar el mapa. Por favor, recarga la página.</p>
                                </div>
                            ) : !isLoaded ? (
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 flex items-center justify-center">
                                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                                    <span className="ml-2 text-sm text-gray-500">Cargando mapa...</span>
                                </div>
                            ) : (
                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                    <GoogleMap
                                        mapContainerStyle={{
                                            width: '100%',
                                            height: '300px'
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
                                            scaleControl: true,
                                            streetViewControl: false,
                                            rotateControl: false,
                                            fullscreenControl: true,
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
                            <div className="mt-2 text-xs text-gray-500">
                                <span>Ubicación seleccionada: </span>
                                <span className="font-mono">
                                    {typeof selectedLocation.lat === 'number' ? selectedLocation.lat.toFixed(6) : '0.000000'}, {typeof selectedLocation.lng === 'number' ? selectedLocation.lng.toFixed(6) : '0.000000'}
                                </span>
                            </div>
                            
                            {(formErrors.latitude || formErrors.longitude) && (
                                <p className="mt-1 text-xs text-red-500">
                                    {formErrors.latitude || formErrors.longitude}
                                </p>
                            )}
                        </div>

                        {/* Información de ubicación */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                                <MapPin className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div className="text-xs text-blue-800">
                                    <p className="font-medium mb-1">Cómo seleccionar tu ubicación</p>
                                    <p>Haz clic en el mapa para seleccionar tu ubicación de servicio. El área sombreada (círculo azul) representa un rango de 100km donde aparecerán tus servicios a los clientes.</p>
                                </div>
                            </div>
                        </div>

                        {formErrors.general && (
                            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                                {formErrors.general}
                            </div>
                        )}
                    </div>
                </div>

                {/* Botones de acción */}
                <div className="border-t border-gray-200 pt-4 mt-6">
                    <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-4">
                        <button
                            type="button"
                            onClick={() => {
                                setShowEditForm(false);
                                resetForm();
                            }}
                            className="w-full sm:w-auto px-4 py-2 text-gray-700 hover:text-gray-900 border border-gray-300 hover:bg-gray-50 transition-colors font-medium rounded-lg"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isUpdating}
                            className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white border border-blue-700 hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
                        >
                            {isUpdating ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Actualizando...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-4 h-4" />
                                    Actualizar Perfil
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
