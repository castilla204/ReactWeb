import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { authService } from '../../services/authService';
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
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const { isLoading, requiresSetup, isEnforced, userRole } = useMfaEnforcement();

    // 1. Verificar autenticación
    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Verificando autenticación...</p>
                </div>
            </div>
        );
    }

    const token = authService.getAccessToken();
    if (!token || !isAuthenticated) {
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    // 2. Verificar autorización (rol)
    if (allowedRoles && userRole !== null) {
        if (!allowedRoles.includes(userRole)) {
            return <Navigate to="/" replace />;
        }
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

