import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types/auth';
import { getAuthToken, getUserData, removeAuthToken } from '../lib/auth';

interface AuthContextType {
    user: User | null;
    setUser: (user: User | null | ((prevUser: User | null) => User | null)) => void;
    isAuthenticated: boolean;
    isLoading: boolean;
    signOut: () => void;
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
                    return;
                }

                const storedUserData = await getUserData();

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
            } finally {
                setIsLoading(false);
            }
        };

        restoreSession();
    }, []);

    useEffect(() => {
        // Update authentication state whenever user changes
        setIsAuthenticated(!!user);
    }, [user]);

    const signOut = () => {
        setUser(null);
        setIsAuthenticated(false);
        removeAuthToken();
    };

    return (
        <AuthContext.Provider value={{ user, setUser, isAuthenticated, isLoading, signOut }}>
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