import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types/auth';
import { getAuthToken, getUserData, removeAuthToken, setAuthToken } from '../lib/auth';
import { authService } from '../services/authService';

interface AuthContextType {
    user: User | null;
    setUser: (user: User | null | ((prevUser: User | null) => User | null)) => void;
    isAuthenticated: boolean;
    isLoading: boolean;
    signOut: () => void;
    updateUser: (newUser: User | null, newToken: string | null, callback?: () => void) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        const restoreSession = async () => {
            setIsLoading(true);
            try {
                const token = getAuthToken();
                if (!token) {
                    setUser(null);
                    setIsAuthenticated(false);
                    setIsLoading(false);
                    return;
                }

                const storedUserData = await getUserData();
                if (!storedUserData) {
                    // Token presente pero sin datos de usuario - limpiar silenciosamente
                    // Esto es normal cuando el token expiró o es inválido
                    setUser(null);
                    setIsAuthenticated(false);
                    removeAuthToken();
                    setIsLoading(false);
                    return;
                }

                setUser(storedUserData);
                setIsAuthenticated(true);
            } catch (error: any) {
                // Error al restaurar sesión - limpiar y continuar
                setUser(null);
                setIsAuthenticated(false);
                removeAuthToken();
            } finally {
                setIsLoading(false);
            }
        };

        restoreSession();
    }, []);

    useEffect(() => {
        // Verificar autenticación basada en token y usuario
        const token = getAuthToken();
        const hasUser = !!user;
        const hasToken = !!token;
        const authenticated = hasUser && hasToken;
        
        // ✅ Solo actualizar si el estado realmente cambió para evitar re-renderizados innecesarios
        setIsAuthenticated(prev => {
            if (prev !== authenticated) {
                console.log('Auth state updated:', { user: user?.email, isAuthenticated: authenticated, hasToken });
                return authenticated;
            }
            return prev;
        });
    }, [user]);

    const signOut = async () => {
        console.log('Signing out user');
        await authService.logout();
        setUser(null);
        setIsAuthenticated(false);
        removeAuthToken();
    };

    const updateUser = (newUser: User | null, newToken: string | null, callback?: () => void) => {
        console.log('Updating user:', newUser, 'Token:', newToken ? 'present' : 'missing');
        setUser(newUser);
        if (newToken) {
            setAuthToken(newToken);
            setIsAuthenticated(true);
        } else {
            removeAuthToken();
            setIsAuthenticated(false);
        }
        if (callback) {
            console.log('Executing updateUser callback');
            callback();
        }
    };

    return (
        <AuthContext.Provider value={{ user, setUser, isAuthenticated, isLoading, signOut, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export const useAuthContext = useAuth;