import { API_CONFIG } from '../config/api';

export async function authenticateWithGoogle(accessToken: string, email: string, name: string, googleId: string) {
    try {
        console.log('Sending auth request to:', API_CONFIG.endpoints.auth.googleAuth);

        const response = await fetch(API_CONFIG.endpoints.auth.googleAuth, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                accessToken,
                email,
                name,
                googleId,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Authentication failed');
        }

        if (!data.token || !data.user) {
            console.error('Invalid response format:', data);
            throw new Error('Invalid response from server');
        }

        // Guardar temporalmente los datos del usuario
        localStorage.setItem('tempUserData', JSON.stringify(data.user));

        console.log('Authentication successful:', { userId: data.user.id, name: data.user.name });
        return data;
    } catch (error) {
        console.error('Authentication error:', error);
        throw error;
    }
}

export function setAuthToken(token: string) {
    localStorage.setItem('authToken', token);

    try {
        // Decodificar el token JWT y extraer los claims
        const [, payloadBase64] = token.split('.');
        const payload = JSON.parse(atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/')));

        console.log('Token payload:', payload); // Para debugging

        // Usar directamente los datos del usuario de la respuesta
        const userData = JSON.parse(localStorage.getItem('tempUserData') || '{}');
        localStorage.removeItem('tempUserData'); // Limpiar datos temporales

        console.log('Processed user data:', userData); // Para debugging

        if (isNaN(userData.id) || !userData.name || !userData.email) {
            throw new Error('Invalid user data');
        }

        localStorage.setItem('userData', JSON.stringify(userData));
    } catch (error) {
        console.error('Error storing user data:', error);
        removeAuthToken();
    }
}

export function getAuthToken(): string | null {
    const token = localStorage.getItem('authToken');
    if (!token) return null;

    try {
        const [, payloadBase64] = token.split('.');
        const payload = JSON.parse(atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/')));

        const hasRequiredFields =
            (payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || payload.nameid) &&
            (payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || payload.name) &&
            (payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || payload.email);

        if (!hasRequiredFields) {
            throw new Error('Token missing required fields');
        }

        // Verificar si el token ha expirado
        if (payload.exp * 1000 < Date.now()) {
            throw new Error('Token has expired');
        }

        return token;
    } catch (error) {
        console.error('Error parsing token:', error);
        removeAuthToken();
        return null;
    }
}

export function removeAuthToken() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
}

export function getUserData(): any | null {
    try {
        const userData = localStorage.getItem('userData');
        if (!userData) return null;

        const parsedData = JSON.parse(userData);
        console.log('Retrieved user data:', parsedData); // Para debugging

        if (!parsedData || isNaN(parsedData.id) || !parsedData.name || !parsedData.email ||
            typeof parsedData.phoneVerified !== 'boolean') {
            console.error('Invalid stored user data');
            removeAuthToken();
            return null;
        }

        // Asegurarse de que phoneVerified sea un booleano
        parsedData.phoneVerified = Boolean(parsedData.phoneVerified);

        return parsedData;
    } catch (error) {
        console.error('Error getting user data:', error);
        removeAuthToken();
        return null;
    }
}

export function updateUserData(updates: Partial<any>) {
    try {
        const userData = getUserData();
        if (!userData) {
            throw new Error('No user data found');
        }

        const updatedUserData = { ...userData, ...updates };
        localStorage.setItem('userData', JSON.stringify(updatedUserData));

        return updatedUserData;
    } catch (error) {
        console.error('Error updating user data:', error);
        throw error;
    }
}