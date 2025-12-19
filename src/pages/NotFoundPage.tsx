import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Home, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';

/**
 * Página 404 - Recurso no encontrado
 */
export const NotFoundPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 text-center">
                <div className="flex justify-center mb-4">
                    <div className="rounded-full bg-blue-100 dark:bg-blue-900/20 p-4">
                        <Search className="w-12 h-12 text-blue-600 dark:text-blue-400" />
                    </div>
                </div>
                
                <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-2">
                    404
                </h1>
                
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                    Página no encontrada
                </h2>
                
                <p className="text-gray-600 dark:text-gray-300 mb-8">
                    Lo sentimos, la página que estás buscando no existe o ha sido movida.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2"
                        variant="outline"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Volver atrás
                    </Button>
                    
                    <Button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2"
                        variant="default"
                    >
                        <Home className="w-4 h-4" />
                        Ir al inicio
                    </Button>
                </div>
            </div>
        </div>
    );
};

