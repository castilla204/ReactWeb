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

        console.log('Authentication successful:', { userId: data.user.id, name: data.user.name });
        setAuthToken(data.token, data.user); // Guardar token y usuario directamente
        return data;
    } catch (error) {
        console.error('Authentication error:', error);
        throw error;
    }
}

export function setAuthToken(token: string, user?: any) {
    console.log('Setting auth token:', token ? 'present' : 'missing');
    localStorage.setItem('authToken', token);
    if (user) {
        console.log('Setting user data:', user);
        localStorage.setItem('userData', JSON.stringify(user));
    }
}

export function getAuthToken(): string | null {
    const token = localStorage.getItem('authToken');
    console.log('Getting auth token:', token ? 'present' : 'missing');
    if (!token) return null;

    try {
        // Verificar si el token tiene el formato JWT básico
        const parts = token.split('.');
        if (parts.length !== 3) {
            console.error('Invalid JWT format');
            return null;
        }

        // Decodificar el payload para verificar expiración
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        if (payload.exp && payload.exp * 1000 < Date.now()) {
            console.log('Token has expired');
            return null; // No eliminamos el token, solo retornamos null
        }

        return token;
    } catch (error) {
        console.error('Error parsing token:', error);
        return null; // No eliminamos el token automáticamente
    }
}

export function removeAuthToken() {
    console.log('Removing auth token and user data');
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
}

export function getUserData(): any | null {
    try {
        const userData = localStorage.getItem('userData');
        console.log('Getting user data:', userData ? JSON.parse(userData) : 'no user data');
        if (!userData) return null;

        const parsedData = JSON.parse(userData);
        if (!parsedData || isNaN(parsedData.id) || !parsedData.name || !parsedData.email) {
            console.error('Invalid stored user data');
            return null;
        }

        // Asegurarse de que phoneVerified sea un booleano
        parsedData.phoneVerified = Boolean(parsedData.phoneVerified);
        return parsedData;
    } catch (error) {
        console.error('Error getting user data:', error);
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
        console.log('Updated user data:', updatedUserData);
        return updatedUserData;
    } catch (error) {
        console.error('Error updating user data:', error);
        throw error;
    }
}