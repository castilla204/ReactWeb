import React, { useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { showToast } from '../lib/toast';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export const ProtectedRoute = React.memo(({ children }: ProtectedRouteProps) => {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();
    const hasShownNotification = useRef(false);

    // Mostrar notificación cuando el usuario no está autenticado intenta acceder
    useEffect(() => {
        if (!isLoading && !isAuthenticated && !hasShownNotification.current) {
            showToast('error', '🔒 Por favor, inicia sesión para continuar');
            hasShownNotification.current = true;
        }
    }, [isAuthenticated, isLoading]);

    // Resetear el flag cuando el usuario se autentica
    useEffect(() => {
        if (isAuthenticated) {
            hasShownNotification.current = false;
        }
    }, [isAuthenticated]);

    // Mostrar loading mientras se verifica la autenticación
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-gray-600">Cargando...</div>
            </div>
        );
    }

    // Si no está autenticado, redirigir a la home
    if (!isAuthenticated) {
        return <Navigate to="/" replace state={{ from: location }} />;
    }

    return <>{children}</>;
});
