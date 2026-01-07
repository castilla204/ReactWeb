import React, { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getAuthToken } from '../lib/auth';
import { API_CONFIG } from '../config/api';
import { isAdmin } from '../utils/admin';

const HangfirePanel: React.FC = () => {
    const [hangfireUrl, setHangfireUrl] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [iframeLoaded, setIframeLoaded] = useState<boolean>(false);
    const { isAuthenticated, user } = useAuth();

    useEffect(() => {
        if (!isAuthenticated || !user) {
            setError('Debes estar autenticado para acceder al dashboard de Hangfire');
            return;
        }

        // Verificar que el usuario sea admin (compatibilidad con PascalCase y camelCase)
        const userEmail = user?.Email || user?.email;
        const userRole = user?.Role || user?.role;
        const isAdminByEmail = userEmail ? isAdmin(userEmail) : false;
        const isAdminByRole = userRole === 'Admin' || userRole === 'admin';
        const userIsAdmin = isAdminByEmail || isAdminByRole;
        
        if (!userIsAdmin) {
            setError('Solo los administradores pueden acceder al dashboard de Hangfire');
            return;
        }

        // Construir la URL del Hangfire dashboard usando la misma configuración que el resto de la app
        // API_CONFIG.baseUrl ya incluye la URL base (ej: https://lainspecciono-c8gpcpgtfyc9cna8.canadacentral-01.azurewebsites.net o http://localhost:7124)
        // Hangfire está en /hangfire, no en /api/hangfire, así que usamos la baseUrl directamente
        const apiUrl = API_CONFIG.baseUrl;
        const token = getAuthToken();
        
        if (!token) {
            setError('No se encontró token de autenticación. Por favor, recarga la página o cierra sesión y vuelve a iniciar sesión.');
            return;
        }
        
        // Verificar si el token está expirado (decodificar JWT básico)
        try {
            const tokenParts = token.split('.');
            if (tokenParts.length === 3) {
                const payload = JSON.parse(atob(tokenParts[1].replace(/-/g, '+').replace(/_/g, '/')));
                const exp = payload.exp;
                const now = Math.floor(Date.now() / 1000);
                if (exp && exp < now) {
                    setError('Tu sesión ha expirado. Por favor, recarga la página o cierra sesión y vuelve a iniciar sesión.');
                    return;
                }
            }
        } catch (e) {
            console.warn('No se pudo verificar expiración del token:', e);
        }
        
        // Intentar pasar el token como query parameter
        const url = `${apiUrl}/hangfire?token=${encodeURIComponent(token)}`;
        
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

    // Verificar permisos de admin (compatibilidad con PascalCase y camelCase)
    const userEmail = user?.Email || user?.email;
    const userRole = user?.Role || user?.role;
    const isAdminByEmail = userEmail ? isAdmin(userEmail) : false;
    const isAdminByRole = userRole === 'Admin' || userRole === 'admin';
    const userIsAdmin = isAdminByEmail || isAdminByRole;
    
    if (!userIsAdmin) {
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
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden relative">
                {hangfireUrl ? (
                    <>
                        {/* Indicador de carga */}
                        {isLoading && (
                            <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10">
                                <div className="text-center">
                                    <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                                    <p className="text-gray-600">Cargando Hangfire Dashboard...</p>
                                </div>
                            </div>
                        )}
                        
                        {/* Botón para abrir en nueva pestaña */}
                        <div className="p-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                            <p className="text-sm text-gray-600">
                                Si el dashboard no se muestra correctamente, puedes abrirlo en una nueva pestaña
                            </p>
                            <a
                                href={hangfireUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
                            >
                                Abrir en nueva pestaña
                            </a>
                        </div>
                        
                        <iframe
                            src={hangfireUrl}
                            className="w-full"
                            style={{ height: 'calc(100vh - 300px)', minHeight: '600px', border: 'none' }}
                            title="Hangfire Dashboard"
                            allow="fullscreen"
                            onError={() => {
                                setIsLoading(false);
                                setError('Error al cargar el dashboard de Hangfire. El endpoint puede requerir autenticación adicional.');
                            }}
                            onLoad={(e) => {
                                console.log('Hangfire iframe loaded');
                                setIframeLoaded(true);
                                
                                // Verificar si el iframe cargó correctamente después de un tiempo
                                setTimeout(() => {
                                    setIsLoading(false);
                                    const iframe = e.currentTarget;
                                    try {
                                        // Intentar acceder al contenido para verificar si hay error
                                        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                                        if (iframeDoc) {
                                            const bodyText = iframeDoc.body?.innerText || '';
                                            const bodyHTML = iframeDoc.body?.innerHTML || '';
                                            
                                            // Verificar si hay errores de autenticación
                                            if (bodyText.includes('401') || bodyText.includes('Unauthorized') || 
                                                bodyText.includes('403') || bodyText.includes('Forbidden') ||
                                                bodyHTML.includes('401') || bodyHTML.includes('Unauthorized')) {
                                                setError('Error de autenticación. El token puede haber expirado. Por favor, recarga la página o cierra sesión y vuelve a iniciar sesión.');
                                            } else if (bodyText.trim() === '' && bodyHTML.trim() === '') {
                                                // Iframe vacío puede indicar un problema
                                                console.warn('Hangfire iframe appears to be empty');
                                                // No establecer error aquí, puede ser que el contenido aún esté cargando
                                            } else {
                                                // Si hay contenido, el iframe se cargó correctamente
                                                console.log('Hangfire iframe content detected');
                                            }
                                        }
                                    } catch (err) {
                                        // Error de CORS al acceder al contenido del iframe - esto es normal
                                        // Si hay CORS, no podemos verificar el contenido, pero el iframe puede estar cargando
                                        console.log('Cannot access iframe content (CORS) - this is expected if the iframe loads successfully');
                                        // Si el iframe se cargó pero no podemos acceder al contenido por CORS,
                                        // asumimos que está funcionando correctamente
                                        // El iframe debería mostrar el contenido de Hangfire
                                    }
                                }, 3000); // Esperar 3 segundos para que el contenido cargue
                            }}
                            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation"
                            referrerPolicy="same-origin"
                            loading="lazy"
                        />
                        
                        {/* Mensaje de ayuda si hay error */}
                        {error && (
                            <div className="p-4 bg-yellow-50 border-t border-yellow-200">
                                <p className="text-sm text-yellow-800 font-medium mb-2">{error}</p>
                                <div className="text-xs text-yellow-600 space-y-1">
                                    <p>Posibles soluciones:</p>
                                    <ul className="list-disc list-inside ml-2 space-y-1">
                                        <li>Recarga la página para obtener un nuevo token</li>
                                        <li>Abre el dashboard en una nueva pestaña usando el botón de arriba</li>
                                        <li>Verifica que el backend esté configurado correctamente para aceptar tokens en query parameters</li>
                                    </ul>
                                </div>
                            </div>
                        )}
                        
                        {/* Mensaje informativo si no hay error pero el iframe puede no estar visible */}
                        {!error && iframeLoaded && !isLoading && (
                            <div className="p-3 bg-blue-50 border-t border-blue-200">
                                <p className="text-xs text-blue-700">
                                    💡 Si no ves el contenido del dashboard, haz clic en "Abrir en nueva pestaña" arriba. 
                                    Esto puede ocurrir debido a restricciones de seguridad del navegador.
                                </p>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="p-8 text-center text-gray-500">
                        <div className="inline-block w-8 h-8 border-4 border-gray-300 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p>Cargando Hangfire Dashboard...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HangfirePanel;