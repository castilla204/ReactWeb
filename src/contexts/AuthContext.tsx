import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types/auth';
import { getAuthToken, getUserData, removeAuthToken, setAuthToken } from '../lib/auth';
import { updateSupabaseAuth } from '../lib/supabase';
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
                // ✅ CRÍTICO: Inicializar authService desde localStorage primero
                // Esto asegura que los tokens se carguen y se renueven si es necesario
                authService.initFromStorage();

                // Verificar tokens usando authService (más confiable)
                const accessToken = authService.getAccessToken();
                const refreshToken = authService.getRefreshToken();

                if (!accessToken || !refreshToken) {
                    if (import.meta.env.DEV) {
                        console.debug('[AuthContext] No hay tokens en localStorage');
                    }
                    setUser(null);
                    setIsAuthenticated(false);
                    setIsLoading(false);
                    return;
                }

                // ✅ Verificar si el access token expiró usando accessTokenExpiresAt
                const expiresAt = localStorage.getItem('accessTokenExpiresAt');
                if (expiresAt) {
                    const expirationTime = new Date(expiresAt).getTime();
                    const now = Date.now();
                    if (expirationTime < now) {
                        console.log('⚠️ [AuthContext] Access token expirado, renovando...');
                        // Token expirado, intentar renovar
                        try {
                            const renewed = await authService.refreshAccessToken();
                            if (!renewed) {
                                console.log('❌ [AuthContext] No se pudo renovar el token - Refresh token expirado o inválido');
                                setUser(null);
                                setIsAuthenticated(false);
                                setIsLoading(false);
                                return;
                            }
                            console.log('✅ [AuthContext] Token renovado exitosamente');
                        } catch (error) {
                            console.error('❌ [AuthContext] Error al renovar token:', error);
                            setUser(null);
                            setIsAuthenticated(false);
                            setIsLoading(false);
                            return;
                        }
                    } else {
                        // Token válido, pero verificar si expira pronto (5 minutos)
                        const timeUntilExpiry = expirationTime - now;
                        if (timeUntilExpiry < 5 * 60 * 1000 && timeUntilExpiry > 0) {
                            console.log('🔄 [AuthContext] Token expira pronto, renovando proactivamente...');
                            // Renovar proactivamente (no bloqueante)
                            authService.refreshAccessToken().catch(err => {
                                console.warn('⚠️ [AuthContext] Error en renovación proactiva:', err);
                            });
                        }
                    }
                }

                // Obtener datos del usuario desde localStorage
                const storedUserData = getUserData();
                if (!storedUserData) {
                    console.log('⚠️ [AuthContext] No hay userData en localStorage');
                    // Token presente pero sin datos de usuario - limpiar silenciosamente
                    setUser(null);
                    setIsAuthenticated(false);
                    removeAuthToken();
                    setIsLoading(false);
                    return;
                }

                console.log('✅ [AuthContext] Sesión restaurada correctamente:', {
                    hasToken: !!accessToken,
                    hasRefreshToken: !!refreshToken,
                    userEmail: storedUserData.Email || storedUserData.email,
                    expiresAt: expiresAt
                });

                setUser(storedUserData);
                setIsAuthenticated(true);
                const activeToken = authService.getAccessToken();
                if (activeToken) {
                    updateSupabaseAuth(activeToken);
                }
            } catch (error: any) {
                console.error('❌ [AuthContext] Error al restaurar sesión:', error);
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
        // 🛡️ Limpiar SIEMPRE el estado local — incluso si el endpoint de logout
        //    del backend falla (cuenta ya borrada, 401, red caída, …). Antes,
        //    si `authService.logout()` tiraba, las tres líneas de limpieza no se
        //    ejecutaban y el usuario quedaba con JWT zombi en localStorage.
        try {
            await authService.logout();
        } catch (err) {
            console.warn('[AuthContext] authService.logout() falló; limpiando localmente igualmente.', err);
        }
        setUser(null);
        setIsAuthenticated(false);
        removeAuthToken();
    };

    const updateUser = (newUser: User | null, newToken: string | null, callback?: () => void) => {
        console.log('Updating user:', newUser, 'Token:', newToken ? 'present' : 'missing');
        setUser(newUser);
        if (newToken && newUser) {
            // ✅ CRÍTICO: Pasar tanto el token como el usuario para que se guarden ambos
            setAuthToken(newToken, newUser);
            updateSupabaseAuth(newToken);
            setIsAuthenticated(true);
            console.log('✅ [AuthContext] Usuario y token guardados en localStorage');
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