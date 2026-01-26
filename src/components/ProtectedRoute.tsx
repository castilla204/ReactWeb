import React, { useEffect, useRef, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { showToast } from '../lib/toast';
import { authService } from '../services/authService';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export const ProtectedRoute = React.memo(({ children }: ProtectedRouteProps) => {
    const { isAuthenticated, isLoading: authLoading, user } = useAuth();
    const location = useLocation();
    const hasShownNotification = useRef(false);
    
    // ✅ Verificar token directamente
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
            }, 500); // Esperar 500ms para que AuthContext termine de restaurar
            return () => clearTimeout(timeout);
        } else {
            setWaitingForAuth(false);
        }
    }, [hasToken, hasUser, authLoading]);

    // Mostrar notificación cuando el usuario no está autenticado intenta acceder
    useEffect(() => {
        if (!authLoading && !waitingForAuth && !isAuthenticated && !hasToken && !hasShownNotification.current) {
            showToast('error', '🔒 Por favor, inicia sesión para continuar');
            hasShownNotification.current = true;
        }
    }, [isAuthenticated, authLoading, waitingForAuth, hasToken]);

    // Resetear el flag cuando el usuario se autentica
    useEffect(() => {
        if (isAuthenticated || (hasToken && hasUser)) {
            hasShownNotification.current = false;
        }
    }, [isAuthenticated, hasToken, hasUser]);

    // ✅ CRÍTICO: Esperar a que termine la carga antes de redirigir
    if (authLoading || waitingForAuth) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-gray-600">Cargando...</div>
            </div>
        );
    }

    // ✅ Verificar autenticación: debe tener token Y usuario (o isAuthenticated debe ser true)
    const isReallyAuthenticated = (hasToken && hasUser) || isAuthenticated;
    
    // Si no está autenticado, redirigir a la home
    if (!token || !isReallyAuthenticated) {
        console.log('[ProtectedRoute] No autenticado, redirigiendo a /', {
            hasToken: !!token,
            hasUser: !!user,
            isAuthenticated,
            isReallyAuthenticated,
            authLoading,
            waitingForAuth,
            path: location.pathname
        });
        return <Navigate to="/" replace state={{ from: location }} />;
    }

    return <>{children}</>;
});
