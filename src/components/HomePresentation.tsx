import React, { useState, useEffect } from 'react';
import { Shield, Search, CheckCircle } from 'lucide-react';
import PromoBanner from './PromoBanner'; // Importamos el nuevo componente

const HomePresentation = ({ onScrollToForm }) => {
    const [currentWord, setCurrentWord] = useState('coche');
    const [opacity, setOpacity] = useState(1);

    useEffect(() => {
        const interval = setInterval(() => {
            setOpacity(0); // Inicia el fundido
            setTimeout(() => {
                setCurrentWord((prev) => {
                    if (prev === 'coche') return 'casa';
                    if (prev === 'casa') return 'moto';
                    return 'coche';
                });
                setOpacity(1); // Finaliza el fundido
            }, 500); // Duración del fundido
        }, 3000); // Cambia cada 3 segundos

        // Inyectar el widget de Elfsight dinámicamente
        const widgetContainer = document.createElement('div');
        widgetContainer.id = 'elfsight-widget-container';
        widgetContainer.style.width = '100%'; // Ocupa todo el ancho disponible
        widgetContainer.style.height = 'auto'; // Altura automática para adaptarse al contenido
        widgetContainer.style.overflow = 'visible'; // Permitir que muestre más contenido
        const script = document.createElement('script');
        script.src = 'https://static.elfsight.com/platform/platform.js';
        script.async = true;
        const widgetDiv = document.createElement('div');
        widgetDiv.className = 'elfsight-app-bcc2528d-c48e-48d1-b03d-f282be8b8c32';
        widgetDiv.setAttribute('data-elfsight-app-lazy', '');
        widgetContainer.appendChild(script);
        widgetContainer.appendChild(widgetDiv);
        const mountPoint = document.getElementById('widget-mount-point');
        if (mountPoint) {
            mountPoint.appendChild(widgetContainer);
        }

        // Limpieza al desmontar el componente
        return () => {
            clearInterval(interval);
            const mountPoint = document.getElementById('widget-mount-point');
            if (mountPoint && widgetContainer.parentNode === mountPoint) {
                mountPoint.removeChild(widgetContainer);
            }
        };
    }, []);

    return (
        <div className="relative w-full bg-gradient-to-b from-blue-50 to-white/90 overflow-hidden animate-fade-in">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_20%,rgba(59,130,246,0.2),transparent_60%)]" />
            <div className="w-full px-4 md:px-8 lg:px-12 py-20 md:py-24 lg:py-28">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 items-start animate-fade-in-up">
                        <div className="px-4 md:px-6 lg:px-8 space-y-5">
                            <h1 className="text-3xl sm:text-4xl md:text-5xl font-display text-blue-900 leading-tight animate-fade-in-up tracking-tight">
                                Tu eliges el <span
                                    className="relative inline-block"
                                    style={{ opacity: opacity, transition: 'opacity 0.5s ease-in-out' }}
                                >
                                    <span
                                        className="text-4xl sm:text-5xl md:text-6xl font-extrabold"
                                        style={{
                                            background: 'linear-gradient(45deg, #3b82f6, #1e40af, #1e3a8a)',
                                            WebkitBackgroundClip: 'text',
                                            backgroundClip: 'text',
                                            color: 'transparent',
                                        }}
                                    >
                                        {currentWord}
                                    </span>
                                </span>, nosotros hacemos el <span className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-blue-900">resto</span>
                            </h1>
                            <p className="text-sm sm:text-base md:text-lg text-gray-700 max-w-lg animate-fade-in-up">
                                Descubre el coche perfecto de segunda mano con nuestra búsqueda avanzada y revisiones presenciales expertas.
                            </p>
                            <button
                                onClick={onScrollToForm}
                                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold text-sm sm:text-base hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg animate-fade-in-up"
                            >
                                Comienza tu búsqueda
                            </button>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm animate-fade-in-up">
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <Shield className="w-4 sm:w-5 h-4 sm:h-5 text-blue-600" />
                                    <span className="text-gray-700 font-medium">+10 años de experiencia</span>
                                </div>
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <Search className="w-4 sm:w-5 h-4 sm:h-5 text-blue-600" />
                                    <span className="text-gray-700 font-medium">+25.000 coches revisados</span>
                                </div>
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <CheckCircle className="w-4 sm:w-5 h-4 sm:h-5 text-blue-600" />
                                    <span className="text-gray-700 font-medium">+30 técnicos revisando</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-center md:justify-end w-full">
                            <img
                                src={new URL('../media/bluecheck.png', import.meta.url).href}
                                alt="Coche y técnico"
                                className="rounded-2xl w-full max-w-sm sm:max-w-md md:max-w-sm object-cover animate-fade-in-up"
                            />
                        </div>
                    </div>
                    <div className="mt-12 lg:mt-16">
                        <div id="widget-mount-point" className="w-full">
                            {/* Widget de reseñas se inyectará aquí dinámicamente */}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomePresentation;