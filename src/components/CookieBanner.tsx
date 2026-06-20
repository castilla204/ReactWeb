import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
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
    const location = useLocation();
    const [isVisible, setIsVisible] = useState(false);
    // `entered` controla la animación de entrada/salida (slide + fade) sin depender de plugins.
    const [entered, setEntered] = useState(false);

    useEffect(() => {
        const cookieConsent = localStorage.getItem('cookie-consent');
        if (cookieConsent || location.pathname.startsWith('/checkout/')) {
            setIsVisible(false);
            return;
        }
        const showTimer = setTimeout(() => setIsVisible(true), 600);
        return () => clearTimeout(showTimer);
    }, [location.pathname]);

    useEffect(() => {
        if (!isVisible) return;
        const enterTimer = setTimeout(() => setEntered(true), 20);
        return () => clearTimeout(enterTimer);
    }, [isVisible]);

    const persistAndClose = (preference: Exclude<CookiePreference, null>) => {
        localStorage.setItem('cookie-consent', preference);
        localStorage.setItem('cookie-consent-date', new Date().toISOString());
        // Animamos la salida antes de desmontar (debe coincidir con la duración de la transición)
        setEntered(false);
        setTimeout(() => setIsVisible(false), 300);
        onAccept?.(preference);
    };

    const handleAcceptAll = () => persistAndClose('all');
    const handleAcceptNecessary = () => persistAndClose('necessary');

    if (!isVisible) return null;

    return (
        <div
            className="fixed z-[60] inset-x-0 bottom-0 sm:inset-x-auto sm:left-6 sm:right-auto sm:bottom-6 sm:max-w-md"
            data-testid="main-cookies-banner-container"
        >
            <section
                role="dialog"
                aria-label="Aviso de cookies"
                className={[
                    'bg-white/95 backdrop-blur shadow-2xl ring-1 ring-gray-200',
                    // En móvil es un drawer pegado al borde (esquinas superiores redondeadas);
                    // en desktop es una tarjeta flotante completa.
                    'rounded-t-2xl sm:rounded-2xl',
                    'px-5 pt-3 pb-6 sm:p-6',
                    'transition-all duration-300 ease-out',
                    entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full sm:translate-y-3'
                ].join(' ')}
            >
                {/* Asa del drawer (solo móvil) */}
                <div aria-hidden="true" className="sm:hidden mx-auto mb-3 h-1.5 w-10 rounded-full bg-gray-300" />

                <div className="flex items-start gap-3">
                    <span aria-hidden="true" className="text-xl leading-none mt-0.5 select-none">🍪</span>
                    <p className="text-sm leading-relaxed text-gray-600">
                        Usamos cookies para que el sitio funcione y mejorar tu experiencia.{' '}
                        <a
                            href={cookiePolicyUrl}
                            className="text-gray-900 underline underline-offset-2 hover:text-gray-700 font-medium transition-colors"
                        >
                            Más información
                        </a>
                        .
                    </p>
                </div>

                <div className="mt-4 flex gap-3">
                    <Button
                        type="button"
                        onClick={handleAcceptNecessary}
                        variant="outline"
                        className="flex-1 h-10 border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium rounded-lg transition-colors"
                    >
                        Solo necesarias
                    </Button>
                    <Button
                        type="button"
                        onClick={handleAcceptAll}
                        className="flex-1 h-10 bg-gray-900 text-white hover:bg-gray-800 text-sm font-medium rounded-lg transition-colors"
                    >
                        Aceptar todas
                    </Button>
                </div>
            </section>
        </div>
    );
};

export default CookieBanner;
