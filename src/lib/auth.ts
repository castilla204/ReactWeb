import { authService } from '../services/authService';

// Mantener compatibilidad con código existente
export async function authenticateWithGoogle(accessToken: string, email: string, name: string, googleId: string) {
    const result = await authService.googleAuth(accessToken);
    return {
        token: `${result.user ? 'token' : ''}`, // Mantener compatibilidad
        user: result.user,
        requiresMFA: result.requiresMFA,
    };
}

export function setAuthToken(token: string, user?: any) {
    localStorage.setItem('authToken', token);
    if (user) {
        localStorage.setItem('userData', JSON.stringify(user));
    }
}

export function getAuthToken(): string | null {
    const token = localStorage.getItem('authToken');
    if (!token) return null;

    try {
        // Verificar si el token tiene el formato JWT b�sico
        const parts = token.split('.');
        if (parts.length !== 3) {
            // Token con formato inválido - limpiar
            removeAuthToken();
            return null;
        }

        // Decodificar el payload para verificar expiraci�n
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        if (payload.exp && payload.exp * 1000 < Date.now()) {
            // Token expirado - limpiar
            removeAuthToken();
            return null;
        }

        return token;
    } catch (error) {
        // Error al parsear token - limpiar
        removeAuthToken();
        return null; // No eliminamos el token autom�ticamente
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
        if (!parsedData || isNaN(parsedData.id) || !parsedData.name || !parsedData.email) {
            // Datos de usuario inválidos - limpiar
            localStorage.removeItem('userData');
            return null;
        }

        // Asegurarse de que phoneVerified sea un booleano
        parsedData.phoneVerified = Boolean(parsedData.phoneVerified);
        return parsedData;
    } catch (error) {
        // Error al parsear datos de usuario - limpiar
        localStorage.removeItem('userData');
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