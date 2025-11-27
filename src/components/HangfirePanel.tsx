import React, { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';

const HangfirePanel: React.FC = () => {
    const [hangfireUrl, setHangfireUrl] = useState<string>('');
    const [error, setError] = useState<string>('');

    useEffect(() => {
        // Construir la URL del Hangfire dashboard
        const apiUrl = import.meta.env.VITE_API_URL || 'https://api.atrapo.io';
        const url = `${apiUrl}/hangfire`;
        setHangfireUrl(url);
        console.log('Hangfire URL:', url);
    }, []);

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
                        onError={() => setError('Error al cargar el dashboard de Hangfire. Verifica que el endpoint esté accesible.')}
                        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
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
