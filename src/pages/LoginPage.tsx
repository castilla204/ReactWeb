import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LoginModal } from '../components/LoginModal';

/**
 * 🛡️ Round 15 — R5 FIX: LoginPage real (era 404).
 * 🛡️ Round 16: ahora el contenido es LoginModal abierto siempre — misma UX que el modal global.
 *
 * Comportamiento:
 * - Si ya está autenticado, redirige al `from` (o `/`).
 * - Si no, muestra el modal (no se puede cerrar — login obligatorio para acceder a rutas privadas).
 *
 * Patrón "returnTo": ProtectedRoute pasa `state={{ from: location }}` cuando bloquea
 * acceso. Lo leemos aquí. App.tsx escucha `auth:session-expired` y navega con el
 * mismo state cuando el refresh token muere.
 */
export const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated } = useAuth();
    const [modalOpen, setModalOpen] = useState(true);

    // Rescatar URL de retorno desde state (ProtectedRoute o session-expired handler).
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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 px-4">
            {/* Card de fondo decorativa (visible si el usuario cierra el modal en mobile). */}
            <div className="text-center max-w-md">
                <h1 className="text-2xl font-semibold text-gray-900 mb-2">Bienvenido</h1>
                <p className="text-sm text-gray-600 mb-6">
                    Inicia sesión o crea tu cuenta para continuar.
                </p>
                <button
                    onClick={() => setModalOpen(true)}
                    className="px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                    Inicia sesión
                </button>
            </div>

            <LoginModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                onSuccess={() => {
                    // El useEffect detecta isAuthenticated y navega.
                }}
            />
        </div>
    );
};

export default LoginPage;
