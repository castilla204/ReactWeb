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
                console.log('Restoring session, token:', token ? 'present' : 'missing');
                if (!token) {
                    setUser(null);
                    setIsAuthenticated(false);
                    return;
                }

                const storedUserData = await getUserData();
                console.log('Restored user data:', storedUserData);
                if (!storedUserData) {
                    console.error('No user data found for token');
                    setUser(null);
                    setIsAuthenticated(false);
                    removeAuthToken();
                    return;
                }

                setUser(storedUserData);
                setIsAuthenticated(true);
            } catch (error: any) {
                console.error('Error restoring session:', error);
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
        
        setIsAuthenticated(authenticated);
        console.log('Auth state updated:', { user, isAuthenticated: authenticated, hasToken });
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