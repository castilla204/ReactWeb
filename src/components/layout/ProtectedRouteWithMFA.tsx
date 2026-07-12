import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authService } from '../../services/authService';
import { PageRouteFallback } from '../PageRouteFallback';
import { RoleChecker, UserRole } from '../../utils/roleChecker';
import { useMfaEnforcement } from '../../hooks/useMfaEnforcement';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteWithMFAProps {
    children: React.ReactNode;
    requireMfa?: boolean;
    allowedRoles?: UserRole[];
}

/**
 * ✅ BEST PRACTICE 2025: Route protection con MFA enforcement
 * 
 * Este componente protege rutas y verifica:
 * 1. Autenticación (tiene token válido)
 * 2. Autorización (rol permitido)
 * 3. MFA (si es requerido)
 */
export const ProtectedRouteWithMFA: React.FC<ProtectedRouteWithMFAProps> = ({
    children,
    requireMfa = false,
    allowedRoles
}) => {
    const location = useLocation();
    const { isAuthenticated, isLoading: authLoading, user } = useAuth();
    const { isLoading, requiresSetup, isEnforced, userRole } = useMfaEnforcement();
    
    // ✅ CRÍTICO: Todos los hooks deben estar al inicio, antes de cualquier return condicional
    const token = authService.getAccessToken();
    const hasUser = !!user;
    const hasToken = !!token;
    
    // ✅ Esperar un momento adicional si hay token pero no hay usuario todavía
    // Esto da tiempo a que AuthContext termine de restaurar la sesión
    const [waitingForAuth, setWaitingForAuth] = useState(false);
    
    useEffect(() => {
        if (hasToken && !hasUser && !authLoading) {
            // Hay token pero no hay usuario todavía - esperar un momento
            setWaitingForAuth(true);
            const timeout = setTimeout(() => {
                setWaitingForAuth(false);
            }, 150); // Margen breve para que AuthContext termine de restaurar (antes 500ms = spinner garantizado)
            return () => clearTimeout(timeout);
        } else {
            setWaitingForAuth(false);
        }
    }, [hasToken, hasUser, authLoading]);

    // 1. Verificar autenticación - ✅ CRÍTICO: Esperar a que termine la carga antes de redirigir
    if (authLoading || waitingForAuth) {
        // Mismo loader que RouteSuspense → sin doble spinner (auth + ruta).
        return <PageRouteFallback />;
    }
    
    // ✅ Verificar autenticación: debe tener token Y usuario (o isAuthenticated debe ser true)
    const isReallyAuthenticated = (hasToken && hasUser) || isAuthenticated;
    
    if (!token || !isReallyAuthenticated) {
        console.log('[ProtectedRouteWithMFA] No autenticado, redirigiendo a /', {
            hasToken: !!token,
            hasUser: !!user,
            isAuthenticated,
            isReallyAuthenticated,
            authLoading,
            path: location.pathname
        });
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    // 2. Verificar autorización (rol) - ✅ Verificación robusta similar a MobileProfileMenu
    if (allowedRoles) {
        // Primero verificar el rol del objeto user
        const userRoleFromUser = user?.role || user?.Role;
        const isExpertByUser = userRoleFromUser === 'Expert' || userRoleFromUser === 'expert' || userRoleFromUser === 'EXPERT' || userRoleFromUser === 1 || userRoleFromUser === UserRole.Expert;
        
        // Verificar el rol del token directamente (más confiable)
        let roleFromToken: UserRole | null = null;
        try {
            roleFromToken = RoleChecker.getUserRole(token);
        } catch (error) {
            console.warn('[ProtectedRouteWithMFA] Error checking role from token:', error);
        }
        
        // Usar el rol del token si está disponible, sino usar el de useMfaEnforcement, sino usar el del user
        const finalUserRole = roleFromToken !== null ? roleFromToken : (userRole !== null ? userRole : (isExpertByUser ? UserRole.Expert : null));
        
        console.log('🔒 ProtectedRouteWithMFA - Role check:', {
            userRoleFromUser,
            isExpertByUser,
            roleFromToken,
            userRole,
            finalUserRole,
            allowedRoles
        });
        
        if (finalUserRole === null || !allowedRoles.includes(finalUserRole)) {
            console.log('🔒 ProtectedRouteWithMFA - Access denied:', {
                finalUserRole,
                allowedRoles,
                token: token ? 'present' : 'missing'
            });
            if (location.pathname === '/expert') {
                return <Navigate to="/expert/join" replace />;
            }
            return <Navigate to="/" replace />;
        }
    }
    
    // Debug: Log para admin route
    if (allowedRoles?.includes(UserRole.Admin)) {
        console.log('🔍 ProtectedRouteWithMFA - Admin route check:', {
            userRole,
            allowedRoles,
            isAuthenticated,
            hasToken: !!token
        });
    }

    // 3. Verificar MFA (si es requerido) - DESACTIVADO: MFA ya no es obligatorio
    // if (requireMfa || RoleChecker.requiresMfa(userRole)) {
    //     if (isLoading) {
    //         return (
    //             <div className="flex items-center justify-center min-h-screen bg-background">
    //                 <div className="flex flex-col items-center gap-3">
    //                     <Loader2 className="w-8 h-8 animate-spin text-primary" />
    //                     <p className="text-sm text-muted-foreground">Verificando seguridad...</p>
    //                 </div>
    //             </div>
    //         );
    //     }

    //     if (requiresSetup && isEnforced) {
    //         // MFA obligatorio y no configurado → Redirigir a setup
    //         return <Navigate to="/mfa/setup-required" replace />;
    //     }
    // }

    // ✅ Todo OK → Renderizar contenido
    return <>{children}</>;
};

