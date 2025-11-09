import React from 'react';
// Verificación de teléfono desactivada temporalmente
// import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export const ProtectedRoute = React.memo(({ children }: ProtectedRouteProps) => {
    // Verificación de teléfono desactivada temporalmente
    // const { user, isAuthenticated } = useAuth();
    // const navigate = useNavigate();
    // const currentPath = window.location.pathname;

    // Verificación de teléfono desactivada temporalmente
    // useEffect(() => {
    //     // Solo redirigir si:
    //     // 1. El usuario está autenticado
    //     // 2. El teléfono NO está verificado
    //     // 3. NO estamos ya en la página de verificación
    //     if (isAuthenticated && user && !user.phoneVerified && currentPath !== '/verify-phone') {
    //         navigate('/verify-phone', { replace: true });
    //     }
    // }, [isAuthenticated, user, navigate, currentPath]);

    // Verificación de teléfono desactivada temporalmente
    // if (isAuthenticated && user && !user.phoneVerified && currentPath !== '/verify-phone') {
    //     return null;
    // }

    return <>{children}</>;
});
