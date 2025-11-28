import React, { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getAuthToken } from '../lib/auth';

const HangfirePanel: React.FC = () => {
    const [hangfireUrl, setHangfireUrl] = useState<string>('');
    const [error, setError] = useState<string>('');
    const { isAuthenticated, user } = useAuth();

    useEffect(() => {
        if (!isAuthenticated || !user) {
            setError('Debes estar autenticado para acceder al dashboard de Hangfire');
            return;
        }

        // Verificar que el usuario sea admin
        const isAdmin = user.role === 'Admin' || user.role === 'admin' || user.isAdmin === true;
        if (!isAdmin) {
            setError('Solo los administradores pueden acceder al dashboard de Hangfire');
            return;
        }

        // Construir la URL del Hangfire dashboard
        // El token se pasará automáticamente mediante cookies si el backend está configurado
        // Si no, necesitamos un endpoint proxy que acepte el token JWT
        const apiUrl = import.meta.env.VITE_API_URL || 'https://api.atrapo.io';
        const token = getAuthToken();
        
        // Intentar pasar el token como query parameter (si el backend lo soporta)
        // O usar la URL directa si el backend acepta cookies/headers del iframe
        const url = token 
            ? `${apiUrl}/hangfire?token=${encodeURIComponent(token)}`
            : `${apiUrl}/hangfire`;
        
        setHangfireUrl(url);
        console.log('Hangfire URL:', url);
    }, [isAuthenticated, user]);

    if (!isAuthenticated || !user) {
        return (
            <div className="p-6">
                <div className="mb-4">
                    <div className="flex items-center space-x-2 mb-2">
                        <Activity className="w-5 h-5 text-blue-600" />
                        <h2 className="text-xl font-semibold text-gray-900">Hangfire Dashboard</h2>
                    </div>
                    <div className="mt-2 p-4 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
                        Debes estar autenticado para acceder al dashboard de Hangfire.
                    </div>
                </div>
            </div>
        );
    }

    // Verificar permisos de admin
    const isAdmin = user.role === 'Admin' || user.role === 'admin' || user.isAdmin === true;
    if (!isAdmin) {
        return (
            <div className="p-6">
                <div className="mb-4">
                    <div className="flex items-center space-x-2 mb-2">
                        <Activity className="w-5 h-5 text-blue-600" />
                        <h2 className="text-xl font-semibold text-gray-900">Hangfire Dashboard</h2>
                    </div>
                    <div className="mt-2 p-4 bg-red-50 border border-red-200 rounded text-red-800">
                        No tienes permisos para acceder al dashboard de Hangfire. Se requieren permisos de administrador.
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="mb-4">
                <div className="flex items-center space-x-2 mb-2">
                    <Activity className="w-5 h-5 text-blue-600" />
                    <h2 className="text-xl font-semibold text-gray-900">Hangfire Dashboard</h2>
                </div>
                <p className="text-sm text-gray-600">
                    Panel de monitoreo de trabajos en segundo plano y tareas programadas
                </p>
                {error && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                        {error}
                    </div>
                )}
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {hangfireUrl ? (
                    <iframe
                        src={hangfireUrl}
                        className="w-full"
                        style={{ height: 'calc(100vh - 300px)', minHeight: '600px', border: 'none' }}
                        title="Hangfire Dashboard"
                        allow="fullscreen"
                        onError={() => setError('Error al cargar el dashboard de Hangfire. Verifica que el endpoint esté accesible y que tengas permisos de administrador.')}
                        onLoad={(e) => {
                            // Verificar si el iframe cargó correctamente
                            const iframe = e.currentTarget;
                            try {
                                // Intentar acceder al contenido para verificar si hay error de permisos
                                const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                                if (iframeDoc) {
                                    const bodyText = iframeDoc.body?.innerText || '';
                                    if (bodyText.includes('403') || bodyText.includes('Forbidden') || bodyText.includes('no tiene permisos')) {
                                        setError('No tienes permisos para acceder al dashboard de Hangfire. Contacta al administrador.');
                                    }
                                }
                            } catch (err) {
                                // Error de CORS al acceder al contenido del iframe - esto es normal
                                console.log('Cannot access iframe content (CORS) - this is expected');
                            }
                            console.log('Hangfire iframe loaded');
                        }}
                        // Permitir que el iframe pase cookies y credenciales
                        // Removemos restricciones del sandbox para permitir autenticación
                        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation"
                        // Intentar cargar con credenciales
                        referrerPolicy="same-origin"
                        // Permitir que el iframe use credenciales (cookies)
                        // Nota: Esto requiere que el backend acepte cookies del mismo origen
                        // Si el backend usa JWT en headers, necesitamos un endpoint proxy
                        loading="lazy"
                    />
                ) : (
                    <div className="p-8 text-center text-gray-500">
                        Cargando Hangfire Dashboard...
                    </div>
                )}
            </div>
        </div>
    );
};

export default HangfirePanel;
