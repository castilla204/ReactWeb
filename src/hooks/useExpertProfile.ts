import { useState } from 'react';
import { getAuthToken } from '../lib/auth';
import { useAuth } from '../contexts/AuthContext';
import { UpdateExpertProfileResponse } from '../types/stripe';
import { API_CONFIG } from '../config/api';

export interface AvailabilityFormData {
    daysOfWeek: string[];         // ["Monday", "Tuesday", ...]
    startTime: string;            // "09:00" (formato "HH:mm")
    endTime: string;              // "18:00" (formato "HH:mm")
}

interface UpdateExpertProfileData {
    description: string;
    latitude: string;
    longitude: string;
    profilePicture?: File;
    availability?: AvailabilityFormData;  // Opcional: solo se actualiza si se incluye
    workRadiusKm?: number;                // 0 = solo en su taller, máx 200; si no se envía se conserva
    formacion?: string;                   // JSON con la formación (opcional); se muestra al cliente
    workLocationDoor?: string;            // Puerta/garaje del taller (solo modo fijo)
    workLocationFloor?: string;           // Piso/planta del taller (solo modo fijo)
    workLocationDetails?: string;         // Observaciones de acceso (solo modo fijo)
}

export function useExpertProfile() {
    const { signOut } = useAuth();
    const [isUpdating, setIsUpdating] = useState(false);

    const updateExpertProfile = async (data: UpdateExpertProfileData) => {
        setIsUpdating(true);
        try {
            const token = getAuthToken();
            if (!token) {
                console.log('No token found, signing out');
                signOut();
                throw new Error('No authentication token found');
            }

            const formData = new FormData();
            formData.append('description', data.description);
            formData.append('latitude', data.latitude);
            formData.append('longitude', data.longitude);
            
            if (data.profilePicture) {
                formData.append('profilePicture', data.profilePicture);
            }

            if (typeof data.workRadiusKm === 'number') {
                formData.append('WorkRadiusKm', String(data.workRadiusKm));
            }

            // Formación (opcional): se envía como JSON en el campo 'formacion'.
            if (typeof data.formacion === 'string') {
                formData.append('formacion', data.formacion);
            }

            // 🏠 Detalle del punto fijo (solo modo fijo). Se envían siempre que el caller los pase;
            // el backend los limpia si el experto está en modo rango.
            if (typeof data.workLocationDoor === 'string') {
                formData.append('WorkLocationDoor', data.workLocationDoor);
            }
            if (typeof data.workLocationFloor === 'string') {
                formData.append('WorkLocationFloor', data.workLocationFloor);
            }
            if (typeof data.workLocationDetails === 'string') {
                formData.append('WorkLocationDetails', data.workLocationDetails);
            }

            // ✅ CRÍTICO: Si se incluye disponibilidad, agregar todos los campos
            if (data.availability) {
                console.log('🔍 useExpertProfile: Adding availability to FormData:', data.availability);
                console.log('🔍 useExpertProfile: daysOfWeek:', data.availability.daysOfWeek);
                
                data.availability.daysOfWeek.forEach((day: string) => {
                    formData.append('AvailabilityDaysOfWeek', day);
                    console.log('🔍 useExpertProfile: Added day to FormData:', day);
                });
                formData.append('AvailabilityStartTime', data.availability.startTime);
                formData.append('AvailabilityEndTime', data.availability.endTime);
                
                console.log('🔍 useExpertProfile: Added startTime:', data.availability.startTime);
                console.log('🔍 useExpertProfile: Added endTime:', data.availability.endTime);
            } else {
                console.log('🔍 useExpertProfile: No availability to send');
            }

            console.log('🔍 useExpertProfile: Updating expert profile with data:', {
                description: data.description,
                latitude: data.latitude,
                longitude: data.longitude,
                hasProfilePicture: !!data.profilePicture,
                hasAvailability: !!data.availability,
                availability: data.availability
            });
            
            // ✅ DEBUG: Verificar FormData
            console.log('🔍 useExpertProfile: FormData contents:');
            for (const [key, value] of formData.entries()) {
                if (value instanceof File) {
                    console.log(`  ${key}: [File] ${value.name}`);
                } else {
                    console.log(`  ${key}: ${value}`);
                }
            }

            const response = await fetch(`${API_CONFIG.baseUrl}/api/User/expert-profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            if (!response.ok) {
                if (response.status === 401) {
                    console.log('401 Unauthorized, signing out');
                    signOut();
                    throw new Error('No tienes permisos para actualizar este perfil');
                }
                if (response.status === 404) {
                    throw new Error('Perfil de experto no encontrado');
                }
                let errorMessage = `Error al actualizar perfil: ${response.statusText}`;
                let errorCode: string | undefined;
                let detectedCountry: string | undefined;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                    // 🛡️ Round 28 MUD-2: propagar errorCode + detectedCountry para que la UI
                    // pueda distinguir entre STRIPE_COUNTRY_LOCKED (mostrar wizard de mudanza),
                    // COUNTRY_NOT_SUPPORTED (sugerir ubicación válida), etc. Antes esto se ignoraba
                    // → todos los errores se mostraban con texto plano sin CTA accionable.
                    errorCode = errorData.errorCode || errorData.ErrorCode;
                    detectedCountry = errorData.detectedCountry || errorData.DetectedCountry;
                } catch {
                    // Ignore JSON parsing errors
                }
                const enrichedError = new Error(errorMessage) as Error & { errorCode?: string; detectedCountry?: string };
                if (errorCode) enrichedError.errorCode = errorCode;
                if (detectedCountry) enrichedError.detectedCountry = detectedCountry;
                throw enrichedError;
            }

            const updatedProfile: UpdateExpertProfileResponse = await response.json();
            console.log('Profile updated successfully:', updatedProfile);
            
            // ✅ Validar que expertProfile existe antes de acceder a sus propiedades
            const expertProfile =
                updatedProfile?.expertProfile ??
                (updatedProfile as { ExpertProfile?: typeof updatedProfile.expertProfile })?.ExpertProfile;
            if (expertProfile) {
                console.log('Updated Stripe Status:', expertProfile.stripeStatus ?? (expertProfile as { StripeStatus?: unknown }).StripeStatus);
            } else {
                console.warn('⚠️ useExpertProfile: expertProfile is missing in response:', updatedProfile);
            }
            
            return updatedProfile;
        } catch (error) {
            console.error('Error updating expert profile:', error);
            throw error;
        } finally {
            setIsUpdating(false);
        }
    };

    return {
        updateExpertProfile,
        isUpdating,
    };
}



