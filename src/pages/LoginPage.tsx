import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LoginModal } from '../components/LoginModal';
import SEO from '../components/SEO';

/**
 * Página de acceso obligatorio para rutas protegidas.
 * El modal no se puede cerrar: la única salida es autenticarse o volver atrás en el navegador.
 */
export const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated } = useAuth();

    const from = (location.state as { from?: { pathname?: string; search?: string } } | null)?.from;
    const returnTo = from
        ? `${from.pathname ?? '/'}${from.search ?? ''}`
        : '/';

    useEffect(() => {
        if (isAuthenticated) {
            navigate(returnTo, { replace: true });
        }
    }, [isAuthenticated, navigate, returnTo]);

    return (
        <div className="relative flex min-h-[100dvh] flex-col items-center justify-center bg-surface-tinted px-4">
            <SEO
                title="Inicia sesión | Inspecciono"
                description="Accede a tu cuenta de Inspecciono para gestionar tus inspecciones."
                noindex
            />
            {/* Marca de fondo discreta — el modal es el foco, no una tarjeta duplicada. */}
            <div
                className="pointer-events-none absolute inset-0 overflow-hidden"
                aria-hidden
            >
                <div className="absolute left-1/2 top-[18%] h-64 w-64 -translate-x-1/2 rounded-full bg-brand/[0.04] blur-3xl" />
            </div>

            <LoginModal
                open
                dismissible={false}
                onOpenChange={() => {}}
                onSuccess={() => {
                    // El useEffect detecta isAuthenticated y navega.
                }}
            />
        </div>
    );
};

export default LoginPage;
