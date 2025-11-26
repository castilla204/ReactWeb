import React from 'react';
import { Activity } from 'lucide-react';

const HangfirePanel: React.FC = () => {
    const hangfireUrl = `${import.meta.env.VITE_API_URL || 'https://api.atrapo.io'}/hangfire`;

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
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <iframe
                    src={hangfireUrl}
                    className="w-full"
                    style={{ height: 'calc(100vh - 300px)', minHeight: '600px', border: 'none' }}
                    title="Hangfire Dashboard"
                    allow="fullscreen"
                />
            </div>
        </div>
    );
};

export default HangfirePanel;
