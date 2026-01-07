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
        // Asegurarse de guardar el usuario con las propiedades correctas (puede venir con Email/email, Role/role, Id/id)
        const userToStore = {
            ...user,
            // Normalizar propiedades a minúsculas para compatibilidad
            id: user.Id || user.id,
            email: user.Email || user.email,
            role: user.Role || user.role,
            name: user.Name || user.name,
            // Mantener también las originales por si acaso
            Id: user.Id || user.id,
            Email: user.Email || user.email,
            Role: user.Role || user.role,
            Name: user.Name || user.name,
        };
        // ✅ Guardar en ambas claves para compatibilidad: 'user' (guía) y 'userData' (código existente)
        localStorage.setItem('user', JSON.stringify(userToStore));
        localStorage.setItem('userData', JSON.stringify(userToStore));
        console.log('✅ [auth.ts] Token y user guardados:', { 
            hasToken: !!token, 
            hasUser: !!user,
            userEmail: userToStore.email || userToStore.Email,
            userRole: userToStore.role || userToStore.Role
        });
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
    localStorage.removeItem('user');
    localStorage.removeItem('userData');
}

export function getUserData(): any | null {
    try {
        // ✅ Intentar primero 'user' (guía), luego 'userData' (compatibilidad)
        let userData = localStorage.getItem('user') || localStorage.getItem('userData');
        if (!userData) {
            console.log('⚠️ [auth.ts] No user/userData encontrado en localStorage');
            return null;
        }

        const parsedData = JSON.parse(userData);
        
        // ✅ Verificar que tenga al menos id (puede ser Id o id) y email (puede ser Email o email)
        const userId = parsedData?.Id || parsedData?.id;
        const hasId = userId && !isNaN(userId);
        const hasEmail = parsedData?.Email || parsedData?.email;
        const hasName = parsedData?.Name || parsedData?.name;
        
        if (!parsedData || !hasId || !hasEmail) {
            console.log('⚠️ [auth.ts] Datos de usuario inválidos:', { 
                userId,
                hasId, 
                hasEmail, 
                hasName,
                parsedDataKeys: parsedData ? Object.keys(parsedData) : 'null',
                parsedDataId: parsedData?.Id || parsedData?.id,
                parsedDataEmail: parsedData?.Email || parsedData?.email
            });
            // Datos de usuario inválidos - limpiar ambas claves
            localStorage.removeItem('user');
            localStorage.removeItem('userData');
            return null;
        }
        
        // ✅ Normalizar id (asegurar que exista tanto Id como id)
        if (!parsedData.id && parsedData.Id) parsedData.id = parsedData.Id;
        if (!parsedData.Id && parsedData.id) parsedData.Id = parsedData.id;

        // Asegurarse de que phoneVerified sea un booleano
        parsedData.phoneVerified = Boolean(parsedData.phoneVerified || parsedData.PhoneVerified);
        
        // Normalizar propiedades para compatibilidad (mantener ambas versiones)
        if (!parsedData.email && parsedData.Email) parsedData.email = parsedData.Email;
        if (!parsedData.Email && parsedData.email) parsedData.Email = parsedData.email;
        if (!parsedData.role && parsedData.Role) parsedData.role = parsedData.Role;
        if (!parsedData.Role && parsedData.role) parsedData.Role = parsedData.role;
        if (!parsedData.name && parsedData.Name) parsedData.name = parsedData.Name;
        if (!parsedData.Name && parsedData.name) parsedData.Name = parsedData.name;
        
        console.log('✅ [auth.ts] user restaurado correctamente:', { 
            id: parsedData.id || parsedData.Id,
            email: parsedData.email || parsedData.Email,
            role: parsedData.role || parsedData.Role,
            name: parsedData.name || parsedData.Name
        });
        
        return parsedData;
    } catch (error) {
        console.error('❌ [auth.ts] Error al parsear user:', error);
        // Error al parsear datos de usuario - limpiar ambas claves
        localStorage.removeItem('user');
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