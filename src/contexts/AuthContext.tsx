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
                    console.log('No token found, user not authenticated');
                    setUser(null);
                    setIsAuthenticated(false);
                    return;
                }

                const storedUserData = await getUserData();

                if (!storedUserData) {
                    console.log('No user data found, user not authenticated');
                    setUser(null);
                    setIsAuthenticated(false);
                    return;
                }

                console.log('Restoring session with user:', storedUserData);
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

    const signOut = () => {
        console.log('Signing out user');
        setUser(null);
        setIsAuthenticated(false);
        removeAuthToken();
    };

    // Log state changes for debugging
    useEffect(() => {
        console.log('AuthContext - user:', user);
        console.log('AuthContext - isAuthenticated:', isAuthenticated);
        console.log('AuthContext - isLoading:', isLoading);
    }, [user, isAuthenticated, isLoading]);

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