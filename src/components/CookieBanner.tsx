import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';

type CookiePreference = 'all' | 'necessary' | 'none' | null;

interface CookieBannerProps {
    onAccept?: (preference: CookiePreference) => void;
    cookiePolicyUrl?: string;
}

export const CookieBanner: React.FC<CookieBannerProps> = ({
    onAccept,
    cookiePolicyUrl = '/terms/cookie_policy'
}) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Verificar si el usuario ya ha aceptado/rechazado cookies
        const cookieConsent = localStorage.getItem('cookie-consent');
        if (!cookieConsent) {
            // Mostrar el banner después de un pequeño delay para mejor UX
            const timer = setTimeout(() => {
                setIsVisible(true);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAcceptAll = () => {
        localStorage.setItem('cookie-consent', 'all');
        localStorage.setItem('cookie-consent-date', new Date().toISOString());
        setIsVisible(false);
        onAccept?.('all');
    };

    const handleAcceptNecessary = () => {
        localStorage.setItem('cookie-consent', 'necessary');
        localStorage.setItem('cookie-consent-date', new Date().toISOString());
        setIsVisible(false);
        onAccept?.('necessary');
    };

    const handleManagePreferences = () => {
        // Aquí podrías abrir un modal o navegar a una página de preferencias
        // Por ahora, simplemente mostramos un mensaje
        console.log('Abrir gestión de preferencias de cookies');
        // Opcional: puedes abrir un modal o navegar a una página de preferencias
    };

    if (!isVisible) return null;

    return (
        <div
            className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 md:px-6 md:pb-6"
            style={{ bottom: '80px' }}
            data-testid="main-cookies-banner-container"
        >
            <section className="max-w-6xl mx-auto bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 md:p-8">
                <div className="flex flex-col gap-6">
                    {/* Contenido principal */}
                    <div className="flex flex-col gap-4">
                        <section>
                            <h1 
                                tabIndex={-1}
                                className="text-xl md:text-2xl font-semibold text-gray-900"
                            >
                                <div className="text-lg md:text-xl font-medium">
                                    Ayúdanos a mejorar tu experiencia
                                </div>
                            </h1>
                        </section>
                        <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                            Utilizamos cookies y otras tecnologías para personalizar el contenido, medir la eficacia de los anuncios y ofrecer una experiencia optimizada. Algunas cookies son necesarias para que el sitio web funcione y no se pueden desactivar. Al aceptar, confirmas que estás de acuerdo con la{' '}
                            <a
                                href={cookiePolicyUrl}
                                className="text-gray-900 underline hover:text-gray-700 font-medium transition-colors"
                            >
                                Política de Cookies
                            </a>
                            . Puedes modificar tus preferencias cuando quieras.
                        </p>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
                        <Button
                            type="button"
                            onClick={handleAcceptAll}
                            className="w-full sm:w-auto bg-gray-900 text-white hover:bg-gray-800 text-sm font-medium px-6 py-2.5 rounded-lg transition-colors"
                        >
                            Aceptar todas
                        </Button>
                        <Button
                            type="button"
                            onClick={handleAcceptNecessary}
                            variant="outline"
                            className="w-full sm:w-auto border-gray-300 text-gray-900 hover:bg-gray-50 text-sm font-medium px-6 py-2.5 rounded-lg transition-colors"
                        >
                            Solo las necesarias
                        </Button>
                        <Button
                            type="button"
                            onClick={handleManagePreferences}
                            variant="ghost"
                            className="w-full sm:w-auto text-gray-900 hover:bg-gray-100 text-sm font-medium px-6 py-2.5 rounded-lg transition-colors underline"
                        >
                            Gestiona tus preferencias
                        </Button>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default CookieBanner;

