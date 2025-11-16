import { jwtDecode } from 'jwt-decode';

export enum UserRole {
    Client = 0,
    Expert = 1,
    Admin = 2
}

export interface DecodedToken {
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier': string;
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress': string;
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name': string;
    'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': string;
    exp: number;
    iat: number;
    jti?: string;
}

/**
 * ✅ BEST PRACTICE 2025: Type-safe role checking
 */
export class RoleChecker {
    private static readonly ROLE_CLAIM = 
        'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';

    /**
     * Obtiene el rol del usuario desde el token
     */
    static getUserRole(token: string): UserRole | null {
        try {
            const decoded = jwtDecode<DecodedToken>(token);
            const roleString = decoded[this.ROLE_CLAIM];
            
            // Convertir string a enum
            switch (roleString) {
                case 'Client': return UserRole.Client;
                case 'Expert': return UserRole.Expert;
                case 'Admin': return UserRole.Admin;
                default: return null;
            }
        } catch (error) {
            console.error('Error decoding token:', error);
            return null;
        }
    }

    /**
     * Verifica si el rol requiere MFA obligatorio
     */
    static requiresMfa(role: UserRole | null): boolean {
        if (role === null) return false;
        return role === UserRole.Admin || role === UserRole.Expert;
    }

    /**
     * Obtiene el nombre del rol en español
     */
    static getRoleName(role: UserRole): string {
        switch (role) {
            case UserRole.Client: return 'Cliente';
            case UserRole.Expert: return 'Experto';
            case UserRole.Admin: return 'Administrador';
            default: return 'Desconocido';
        }
    }

    /**
     * Verifica si el usuario es Admin
     */
    static isAdmin(token: string): boolean {
        return this.getUserRole(token) === UserRole.Admin;
    }

    /**
     * Verifica si el usuario es Expert
     */
    static isExpert(token: string): boolean {
        return this.getUserRole(token) === UserRole.Expert;
    }

    /**
     * Verifica si el usuario es Client
     */
    static isClient(token: string): boolean {
        return this.getUserRole(token) === UserRole.Client;
    }
}

