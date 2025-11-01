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

            // Si se incluye disponibilidad, agregar todos los campos
            if (data.availability) {
                data.availability.daysOfWeek.forEach(day => {
                    formData.append('AvailabilityDaysOfWeek', day);
                });
                formData.append('AvailabilityStartTime', data.availability.startTime);
                formData.append('AvailabilityEndTime', data.availability.endTime);
            }

            console.log('Updating expert profile with data:', {
                description: data.description,
                latitude: data.latitude,
                longitude: data.longitude,
                hasProfilePicture: !!data.profilePicture,
                hasAvailability: !!data.availability,
                availability: data.availability
            });

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
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch {
                    // Ignore JSON parsing errors
                }
                throw new Error(errorMessage);
            }

            const updatedProfile: UpdateExpertProfileResponse = await response.json();
            console.log('Profile updated successfully:', updatedProfile);
            console.log('Updated Stripe Status:', updatedProfile.expertProfile.stripeStatus);
            console.log('Updated Stripe Status Details:', updatedProfile.expertProfile.stripeStatusDetails);
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



