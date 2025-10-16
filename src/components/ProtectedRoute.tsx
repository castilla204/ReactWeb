import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export const ProtectedRoute = React.memo(({ children }: ProtectedRouteProps) => {
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const currentPath = window.location.pathname;

    useEffect(() => {
        // Solo redirigir si:
        // 1. El usuario est� autenticado
        // 2. El tel�fono NO est� verificado
        // 3. NO estamos ya en la p�gina de verificaci�n
        if (isAuthenticated && user && !user.phoneVerified && currentPath !== '/verify-phone') {
            navigate('/verify-phone', { replace: true });
        }
    }, [isAuthenticated, user, navigate, currentPath]);

    // Solo bloquear el renderizado si necesitamos redirigir
    if (isAuthenticated && user && !user.phoneVerified && currentPath !== '/verify-phone') {
        return null;
    }

    return <>{children}</>;
});