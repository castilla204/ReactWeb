import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { setAuthToken } from '../lib/auth';
import { BecomeExpertResponse } from '../types/stripe';
import { API_CONFIG } from '../config/api';
import { AvailabilityFormData } from './useExpertProfile';

interface FormData {
    description: string;
    profilePicture: File | null;
    latitude: string;
    longitude: string;
    availability?: AvailabilityFormData;
}

interface UseBecomeExpertResult {
    formData: FormData;
    previewUrl: string | null;
    isSubmitting: boolean;
    error: string | null;
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleMapClick: (e: google.maps.MapMouseEvent) => void;
    handleSubmit: () => Promise<void>;
    setFormData: React.Dispatch<React.SetStateAction<FormData>>;
    setPreviewUrl: React.Dispatch<React.SetStateAction<string | null>>;
}

export function useBecomeExpert(): UseBecomeExpertResult {
    const navigate = useNavigate();
    const { user, updateUser } = useAuth();
    const [formData, setFormData] = useState<FormData>({
        description: '',
        profilePicture: null,
        latitude: '',
        longitude: '',
        availability: undefined,
    });
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setError('La imagen no puede superar los 5MB');
                return;
            }
            if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
                setError('Solo se permiten imágenes JPG, JPEG y PNG');
                return;
            }
            setFormData((prev) => ({ ...prev, profilePicture: file }));
            setPreviewUrl(URL.createObjectURL(file));
            setError(null);
        }
    };

    const handleMapClick = (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
            const newLocation = {
                lat: e.latLng.lat(),
                lng: e.latLng.lng(),
            };
            setFormData((prev) => ({
                ...prev,
                latitude: newLocation.lat.toString(),
                longitude: newLocation.lng.toString(),
            }));
        }
    };

    const handleSubmit = useCallback(async () => {
        setIsSubmitting(true);
        setError(null);

        // Validaciones
        if (!formData.description.trim()) {
            setError('La descripción es requerida');
            setIsSubmitting(false);
            return;
        }

        if (formData.description.trim().length < 50) {
            setError('La descripción debe tener al menos 50 caracteres');
            setIsSubmitting(false);
            return;
        }

        if (!formData.profilePicture) {
            setError('La foto de perfil es requerida');
            setIsSubmitting(false);
            return;
        }

        if (!formData.latitude || !formData.longitude) {
            setError('Por favor selecciona una ubicación en el mapa');
            setIsSubmitting(false);
            return;
        }

        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                setError('No se encontró el token de autenticación');
                setIsSubmitting(false);
                return;
            }

            // Crear FormData
            const data = new FormData();
            data.append('Description', formData.description.trim());
            data.append('ProfilePicture', formData.profilePicture);
            data.append('Latitude', formData.latitude);
            data.append('Longitude', formData.longitude);

            // Incluir disponibilidad si está presente
            if (formData.availability && formData.availability.daysOfWeek.length > 0) {
                formData.availability.daysOfWeek.forEach(day => {
                    data.append('AvailabilityDaysOfWeek', day);
                });
                data.append('AvailabilityStartTime', formData.availability.startTime);
                data.append('AvailabilityEndTime', formData.availability.endTime);
            }

            console.log('Enviando datos:', {
                description: formData.description.trim(),
                profilePicture: formData.profilePicture.name,
                latitude: formData.latitude,
                longitude: formData.longitude,
                availability: formData.availability
            });

            const response = await fetch(`${API_CONFIG.baseUrl}/api/User/become-expert`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                    // No incluir Content-Type cuando se envía FormData
                },
                body: data,
            });

            console.log('Response status:', response.status);

            if (!response.ok) {
                let errorMessage = 'Error al registrarse como experto';

                try {
                    const errorText = await response.text();
                    console.error('Server error response:', errorText);

                    if (errorText) {
                        const errorData = JSON.parse(errorText);
                        errorMessage = errorData.message || errorMessage;
                    }
                } catch (parseError) {
                    console.error('Error parsing error response:', parseError);

                    // Mensajes de error más específicos basados en el status code
                    switch (response.status) {
                        case 400:
                            errorMessage = 'Datos inválidos. Verifica que todos los campos estén correctos.';
                            break;
                        case 401:
                            errorMessage = 'No autorizado. Por favor, inicia sesión nuevamente.';
                            break;
                        case 403:
                            errorMessage = 'No tienes permisos para realizar esta acción.';
                            break;
                        case 500:
                            errorMessage = 'Error interno del servidor. Inténtalo más tarde.';
                            break;
                        default:
                            errorMessage = `Error del servidor (${response.status})`;
                    }
                }

                throw new Error(errorMessage);
            }

            const result: BecomeExpertResponse = await response.json();
            console.log('Success response:', result);
            console.log('User role received:', result.user?.role);
            console.log('Full user object:', result.user);
            console.log('Expert profile:', result.user.expertProfile);

            if (!result.token || !result.user) {
                throw new Error('Respuesta del servidor incompleta');
            }

            // Verificar el rol de forma más flexible
            const userRole = result.user.role;
            if (userRole !== 'Expert' && userRole !== 'expert' && userRole !== 'EXPERT') {
                console.warn('Rol inesperado recibido:', userRole);
                // No lanzar error, solo advertir - el backend ya creó el usuario como experto
                // throw new Error('El usuario no tiene el rol de Experto después del registro');
            }

            // Log the new Stripe status information
            if (result.user.expertProfile) {
                console.log('Stripe Status:', result.user.expertProfile.stripeStatus);
                console.log('Stripe Status Details:', result.user.expertProfile.stripeStatusDetails);
                console.log('Onboarding Completed:', result.user.expertProfile.onboardingCompleted);
            }

            // Actualizar autenticación
            setAuthToken(result.token, result.user);
            updateUser(result.user, result.token, () => navigate('/expert-panel'));

            // Mostrar notificación de éxito
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: {
                    type: 'success',
                    message: '✨ ¡Te has registrado exitosamente como buscador experto!',
                },
            }));

        } catch (err) {
            console.error('Error in handleSubmit:', err);
            const errorMessage = err instanceof Error ? err.message : 'Error al procesar la solicitud';
            setError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    }, [formData, navigate, updateUser]);

    useEffect(() => {
        if (user?.role === 'Expert') {
            navigate('/expert-panel');
        }
    }, [user, navigate]);

    return {
        formData,
        previewUrl,
        isSubmitting,
        error,
        handleFileChange,
        handleMapClick,
        handleSubmit,
        setFormData,
        setPreviewUrl
    };
}