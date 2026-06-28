import React, { useEffect, useRef, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { showToast } from '../lib/toast';
import { authService } from '../services/authService';
import { PageRouteFallback } from './PageRouteFallback';

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
            }, 150); // Margen breve para que AuthContext termine de restaurar (antes 500ms = spinner garantizado)
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
        // Mismo loader que RouteSuspense → la fase de auth y la de carga de ruta
        // se ven como un único loader continuo (sin cascada texto→spinner).
        return <PageRouteFallback />;
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
