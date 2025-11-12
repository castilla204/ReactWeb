import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export const ProtectedRoute = React.memo(({ children }: ProtectedRouteProps) => {
    const { isAuthenticated, isLoading } = useAuth();

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
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
});
