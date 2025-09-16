import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getAuthToken } from '../lib/auth';
import { API_CONFIG } from '../config/api';

interface ToggleVacationModeResponse {
    isOnVacation: boolean;
    message: string;
}

export function useVacationMode() {
    const { signOut } = useAuth();
    const [isToggling, setIsToggling] = useState(false);

    const toggleVacationMode = async (): Promise<ToggleVacationModeResponse> => {
        setIsToggling(true);
        
        try {
            const token = getAuthToken();
            if (!token) {
                console.log('No token found, signing out');
                signOut();
                throw new Error('No authentication token found');
            }

            const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.expert.toggleVacationMode}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                if (response.status === 401) {
                    console.log('401 Unauthorized, signing out');
                    signOut();
                    throw new Error('No tienes permisos para realizar esta acción');
                }
                
                let errorMessage = `Error al cambiar el modo vacaciones: ${response.statusText}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch {
                    // Ignore JSON parsing errors
                }
                throw new Error(errorMessage);
            }

            const data: ToggleVacationModeResponse = await response.json();
            console.log('Vacation mode toggled:', data);
            
            return data;
        } catch (error: any) {
            console.error('Error toggling vacation mode:', error);
            throw error;
        } finally {
            setIsToggling(false);
        }
    };

    return {
        toggleVacationMode,
        isToggling,
    };
}
