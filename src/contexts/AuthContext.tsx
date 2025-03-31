import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types/auth';
import { getAuthToken, getUserData, removeAuthToken } from '../lib/auth';

interface AuthContextType {
    user: User | null;
    setUser: (user: User | null | ((prevUser: User | null) => User | null)) => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

    useEffect(() => {
        const restoreSession = async () => {
            const token = getAuthToken();

            if (!token) {
                setUser(null);
                setIsAuthenticated(false);
                return;
            }

            try {
                const storedUserData = getUserData();

                if (!storedUserData) {
                    setUser(null);
                    setIsAuthenticated(false);
                    return;
                }

                setUser(storedUserData);
                setIsAuthenticated(true);
            } catch (error) {
                console.error('Error restoring session:', error);
                setUser(null);
                setIsAuthenticated(false);
                removeAuthToken();
            }
        };

        restoreSession();
    }, []);

    useEffect(() => {
        setIsAuthenticated(!!user);
    }, [user]);

    return (
        <AuthContext.Provider value={{ user, setUser, isAuthenticated }}>
            {children}
        </AuthContext.Provider>
    );
}

// Main hook for accessing auth context
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

// Alias for components using the auth context to avoid confusion with useAuth hook
export const useAuthContext = useAuth;