import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { GoogleSignInButton } from '../components/GoogleSignInButton';

/**
 * 🛡️ Round 15 — R5 FIX: LoginPage real.
 *
 * Antes este componente NO EXISTÍA. `CheckoutPage:40`, `SearchForm:89` y
 * `AccountSettingsModal:183` hacían `navigate('/login')` que caía en `<NotFoundPage />`
 * porque no había ruta registrada. Resultado: cliente tras sesión expirada veía 404.
 *
 * Comportamiento:
 * - Si ya está autenticado, redirige al `from` (o `/`).
 * - Si no, muestra mensaje + botón Google Sign-In.
 * - Tras login exitoso, navega a `state.from` (rescatado de ProtectedRoute) o `/`.
 *
 * Patrón "returnTo": ProtectedRoute pasa `state={{ from: location }}` cuando bloquea
 * acceso. Lo leemos aquí. Adicionalmente, App.tsx escucha `auth:session-expired` y
 * navega con el mismo state cuando el refresh token muere.
 */
export const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated } = useAuth();

    // Rescatar URL de retorno desde state (ProtectedRoute o session-expired handler).
    const from = (location.state as { from?: { pathname?: string; search?: string } } | null)?.from;
    const returnTo = from
        ? `${from.pathname ?? '/'}${from.search ?? ''}`
        : '/';

    // Si ya estamos autenticados (ej. el usuario aterrizó aquí por error), volver inmediatamente.
    useEffect(() => {
        if (isAuthenticated) {
            navigate(returnTo, { replace: true });
        }
    }, [isAuthenticated, navigate, returnTo]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-gray-200 p-6 md:p-8 space-y-6">
                <header className="text-center space-y-2">
                    <h1 className="text-xl font-semibold text-gray-900">
                        Inicia sesión
                    </h1>
                    <p className="text-sm text-gray-600">
                        Para continuar necesitas iniciar sesión con tu cuenta de Google.
                    </p>
                </header>

                <div className="space-y-3">
                    <GoogleSignInButton
                        variant="default"
                        onSuccess={() => {
                            // Tras login exitoso AuthContext recibe el user → el useEffect de arriba
                            // detecta isAuthenticated=true y navega a returnTo. No hacer nada aquí.
                        }}
                    />
                </div>

                <p className="text-xs text-gray-500 text-center">
                    Al iniciar sesión aceptas nuestros{' '}
                    <a href="/terms.html" className="underline hover:text-gray-700">Términos</a>
                    {' '}y{' '}
                    <a href="/privacy-policy.html" className="underline hover:text-gray-700">Política de Privacidad</a>.
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
