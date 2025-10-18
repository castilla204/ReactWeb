import { useState, useEffect } from 'react';
import { Car, Home, Bike } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { GoogleAuth } from './GoogleAuth';

interface HomePresentationProps {
    onScrollToForm: () => void;
}

const HomePresentation = ({ onScrollToForm }: HomePresentationProps) => {
    const { isAuthenticated } = useAuth();
    const [currentWord, setCurrentWord] = useState('coche');
    const [isGlitching, setIsGlitching] = useState(false);
    const [glitchText, setGlitchText] = useState('coche');

    useEffect(() => {
        const interval = setInterval(() => {
            // Iniciar efecto glitch
            setIsGlitching(true);
            
            // Generar texto glitch aleatorio
            const glitchChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            const glitchInterval = setInterval(() => {
                const randomText = Array.from({ length: currentWord.length }, () => 
                    glitchChars[Math.floor(Math.random() * glitchChars.length)]
                ).join('');
                setGlitchText(randomText);
            }, 50);

            // Después de 300ms, cambiar a la palabra real
            setTimeout(() => {
                clearInterval(glitchInterval);
                setCurrentWord((prev) => {
                    if (prev === 'coche') return 'casa';
                    if (prev === 'casa') return 'moto';
                    return 'coche';
                });
                setGlitchText(currentWord);
                setIsGlitching(false);
            }, 300);
        }, 3000); // Cambia cada 3 segundos

        // Inyectar el widget de Elfsight dinámicamente
        const widgetContainer = document.createElement('div');
        widgetContainer.id = 'elfsight-widget-container';
        widgetContainer.style.width = '100%'; // Ocupa todo el ancho disponible
        widgetContainer.style.height = 'auto'; // Altura automática para adaptarse al contenido
        widgetContainer.style.overflow = 'visible'; // Permitir que muestre más contenido
        
        // Escalado uniforme en móvil
        if (window.innerWidth < 768) {
            widgetContainer.style.transform = 'scale(0.9)';
            widgetContainer.style.transformOrigin = 'center top';
            widgetContainer.style.width = '100%';
            widgetContainer.style.maxWidth = '100%';
            widgetContainer.style.overflow = 'hidden';
            widgetContainer.style.maxHeight = '180px';
        }
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
        <div className="relative w-full bg-white overflow-hidden">
            {/* Professional subtle background */}
            <div className="absolute inset-0 overflow-hidden">
                {/* Minimal gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 via-blue-50/30 to-slate-50/40"></div>
                
                {/* Subtle geometric elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-50/40 to-transparent rounded-full -translate-y-48 translate-x-48"></div>
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-indigo-50/30 to-transparent rounded-full translate-y-40 -translate-x-40"></div>
                
                {/* Grid pattern */}
                <div className="absolute inset-0 opacity-[0.02] bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            </div>

            <div className="relative z-10 w-full px-4 sm:px-6 md:px-12 lg:px-16 py-8 sm:py-12 md:py-16 lg:py-20">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                        <div className="space-y-6 lg:space-y-7 text-left lg:text-left">
                            {/* Versión móvil - diseño limpio */}
                            <div className="lg:hidden">
                                {/* Header con efecto degradado en dos filas */}
                                <div className="relative w-full h-20 mb-4 overflow-visible">
                                    {/* FILA 1: Arriba - más visible */}
                                    <div className="absolute top-0 left-12 animate-fade-float animation-delay-800 z-20">
                                        <Car className="w-5 h-5 text-blue-500 drop-shadow-lg transform rotate-12" />
                                    </div>
                                    <div className="absolute top-0 right-16 animate-fade-float animation-delay-1400 z-20">
                                        <Bike className="w-5 h-5 text-purple-500 drop-shadow-lg transform -rotate-18" />
                                    </div>
                                    <div className="absolute top-1 left-1/2 transform -translate-x-1/2 animate-fade-float animation-delay-2000 z-20">
                                        <Home className="w-4 h-4 text-violet-500 drop-shadow-md transform rotate-24" />
                                    </div>
                                    
                                    {/* FILA 2: Abajo desordenada - degradado */}
                                    <div className="absolute top-8 left-6 animate-fade-float animation-delay-2600 z-20" style={{ opacity: 0.6 }}>
                                        <Car className="w-4 h-4 text-orange-500 drop-shadow-md transform -rotate-21" />
                                    </div>
                                    <div className="absolute top-10 right-8 animate-fade-float animation-delay-3200 z-20" style={{ opacity: 0.5 }}>
                                        <Bike className="w-3 h-3 text-emerald-500 drop-shadow-sm transform rotate-45" />
                                    </div>
                                    <div className="absolute top-9 left-1/3 animate-fade-float animation-delay-3800 z-20" style={{ opacity: 0.4 }}>
                                        <Home className="w-3 h-3 text-cyan-500 drop-shadow-sm transform -rotate-12" />
                                    </div>
                                    <div className="absolute top-11 right-1/3 animate-fade-float animation-delay-4400 z-20" style={{ opacity: 0.3 }}>
                                        <Car className="w-2 h-2 text-pink-500 drop-shadow-sm transform rotate-30" />
                                    </div>
                                </div>
                                
                                {/* Contenido principal */}
                                <div className="space-y-6">
                                    {/* Título centrado */}
                                    <div className="text-center">
                                        <h1 className="text-2xl font-bold text-gray-900 leading-tight">
                                            <span className="block">Revisa tu{' '}
                                                <span className="relative inline-block">
                                                    <span 
                                                        className={`bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent font-extrabold transition-all duration-300 ${
                                                            isGlitching ? 'glitch-effect' : ''
                                                        }`}
                                                    >
                                                        {isGlitching ? glitchText : currentWord}
                                                    </span>
                                                </span>
                                            </span>
                                            <span className="block">antes de comprar</span>
                                            <span className="block text-gray-900 font-extrabold">gracias a expertos</span>
                                        </h1>
                                    </div>
                                    
                                    {/* Descripción centrada */}
                                    <div className="text-center">
                                        <p className="text-lg text-gray-600 leading-relaxed font-light">
                                            Plataforma profesional de búsqueda y verificación de vehículos de segunda mano con tecnología avanzada y expertos certificados.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Versión desktop - mantener original */}
                            <div className="hidden lg:block space-y-4 lg:space-y-5">
                                {/* Badge/Tag optimizado para desktop */}
                                <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium border border-blue-100">
                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                    <span>Búsqueda inteligente de vehículos</span>
                                </div>
                                
                                {/* Título desktop */}
                                <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 leading-[1.1] tracking-tight">
                                    <div className="block">Revisa tu{' '}
                                    <span className="relative inline-block">
                                        <span 
                                            className={`bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent font-extrabold transition-all duration-300 ${
                                                isGlitching ? 'glitch-effect' : ''
                                            }`}
                                        >
                                            {isGlitching ? glitchText : currentWord}
                                        </span>
                                    </span>
                                    </div>
                                    <div className="block">antes de comprar</div>
                                    <div className="block text-gray-900 font-extrabold">con expertos</div>
                                </h1>
                                
                                {/* Descripción desktop */}
                                <p className="text-lg text-gray-600 max-w-xl leading-relaxed font-light">
                                        Plataforma profesional de búsqueda y verificación de vehículos de segunda mano con tecnología avanzada y expertos certificados.
                                </p>
                            </div>
                            
                            {/* Botones móvil - diseño limpio */}
                            <div className="lg:hidden space-y-3">
                                {isAuthenticated ? (
                                    <button
                                        onClick={onScrollToForm}
                                        className="group w-full inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3.5 rounded-lg font-semibold text-base hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                                    >
                                        <span>Comenzar búsqueda</span>
                                        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                ) : (
                                    <div className="w-full">
                                        <GoogleAuth />
                                    </div>
                                )}
                                
                                <button className="w-full inline-flex items-center justify-center gap-2 text-gray-700 px-5 py-3.5 rounded-lg font-medium text-base hover:bg-gray-50 transition-all duration-300 border border-gray-200 hover:border-gray-300">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v5a2 2 0 002 2z" />
                                    </svg>
                                    <span>Ver demo</span>
                                </button>
                            </div>
                            
                            {/* Botones desktop - mantener original */}
                            <div className="hidden lg:flex flex-row gap-4">
                                {isAuthenticated ? (
                                    <button
                                        onClick={onScrollToForm}
                                        className="group inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3.5 rounded-lg font-semibold text-base hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                                    >
                                        <span>Comenzar búsqueda</span>
                                        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                ) : (
                                    <div>
                                        <GoogleAuth />
                                    </div>
                                )}
                                
                                <button className="inline-flex items-center justify-center gap-2 text-gray-700 px-5 py-3.5 rounded-lg font-medium text-base hover:bg-gray-50 transition-all duration-300 border border-gray-200">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v5a2 2 0 002 2z" />
                                    </svg>
                                    <span>Ver demo</span>
                                </button>
                            </div>
                        </div>
                        
                        <div className="relative flex justify-center lg:justify-end">
                            {/* Main image container - oculta en móvil, visible en desktop */}
                            <div className="hidden lg:block relative p-10">
                                {/* Icons scattered organically - minimal but impactful */}
                                
                                {/* LADO IZQUIERDO - solo 2 iconos estratégicos */}
                                <div className="absolute top-8 -left-6 animate-fade-float animation-delay-800 z-20">
                                    <Car className="w-9 h-9 text-blue-500 drop-shadow-lg transform rotate-12" />
                                </div>
                                <div className="absolute bottom-12 -left-4 animate-fade-float animation-delay-2400 z-20">
                                    <Home className="w-7 h-7 text-violet-500 drop-shadow-lg transform rotate-24" />
                                </div>
                                
                                {/* LADO DERECHO - solo 2 iconos estratégicos */}
                                <div className="absolute top-6 -right-7 animate-fade-float animation-delay-1200 z-20">
                                    <Bike className="w-10 h-10 text-purple-500 drop-shadow-lg transform -rotate-18" />
                                </div>
                                <div className="absolute bottom-16 -right-5 animate-fade-float animation-delay-3200 z-20">
                                    <Car className="w-8 h-8 text-yellow-500 drop-shadow-lg transform -rotate-21" />
                                </div>
                                
                                {/* Iconos dispersos - solo 3 acentos */}
                                <div className="absolute -top-2 left-32 animate-fade-float animation-delay-2000 z-20">
                                    <Home className="w-5 h-5 text-orange-500 drop-shadow-sm transform rotate-30" />
                                </div>
                                <div className="absolute -bottom-3 left-28 animate-fade-float animation-delay-3000 z-20">
                                    <Bike className="w-6 h-6 text-emerald-500 drop-shadow-md transform rotate-45" />
                                </div>
                                <div className="absolute top-24 left-8 animate-fade-float animation-delay-1600 z-20">
                                    <Car className="w-4 h-4 text-pink-500 drop-shadow-sm transform -rotate-15" />
                                </div>
                                
                                {/* Main image */}
                                <img
                                    src={new URL('../media/bluecheck.png', import.meta.url).href}
                                    alt="Verificación profesional de vehículos"
                                    className="w-full max-w-md object-cover relative z-10"
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-4 lg:mt-24">
                        <div id="widget-mount-point" className="w-full lg:w-full">
                            {/* Widget de reseñas se inyectará aquí dinámicamente */}
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes glitch {
                    0% { 
                        transform: translate(0);
                        filter: hue-rotate(0deg);
                    }
                    10% { 
                        transform: translate(-2px, 2px);
                        filter: hue-rotate(90deg);
                    }
                    20% { 
                        transform: translate(2px, -2px);
                        filter: hue-rotate(180deg);
                    }
                    30% { 
                        transform: translate(-2px, -2px);
                        filter: hue-rotate(270deg);
                    }
                    40% { 
                        transform: translate(2px, 2px);
                        filter: hue-rotate(360deg);
                    }
                    50% { 
                        transform: translate(-2px, 2px);
                        filter: hue-rotate(45deg);
                    }
                    60% { 
                        transform: translate(2px, -2px);
                        filter: hue-rotate(135deg);
                    }
                    70% { 
                        transform: translate(-2px, -2px);
                        filter: hue-rotate(225deg);
                    }
                    80% { 
                        transform: translate(2px, 2px);
                        filter: hue-rotate(315deg);
                    }
                    90% { 
                        transform: translate(-2px, 2px);
                        filter: hue-rotate(45deg);
                    }
                    100% { 
                        transform: translate(0);
                        filter: hue-rotate(0deg);
                    }
                }
                
                .glitch-effect {
                    animation: glitch 0.3s ease-in-out;
                    text-shadow: 
                        2px 0 #ff0000,
                        -2px 0 #00ff00,
                        0 2px #0000ff,
                        0 -2px #ffff00;
                }
                
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-20px); }
                }
                .animate-float {
                    animation: float 6s ease-in-out infinite;
                }
                
                @keyframes fadeFloat {
                    0%, 100% { 
                        transform: translateY(0px); 
                        opacity: 0.1; 
                    }
                    25% { 
                        transform: translateY(-3px); 
                        opacity: 0.5; 
                    }
                    50% { 
                        transform: translateY(-6px); 
                        opacity: 1; 
                    }
                    75% { 
                        transform: translateY(-3px); 
                        opacity: 0.5; 
                    }
                }
                .animate-fade-float {
                    animation: fadeFloat 8s ease-in-out infinite;
                }
                .animation-delay-400 {
                    animation-delay: 0.4s;
                }
                .animation-delay-500 {
                    animation-delay: 0.5s;
                }
                .animation-delay-600 {
                    animation-delay: 0.6s;
                }
                .animation-delay-800 {
                    animation-delay: 0.8s;
                }
                .animation-delay-1000 {
                    animation-delay: 1s;
                }
                .animation-delay-1200 {
                    animation-delay: 1.2s;
                }
                .animation-delay-1500 {
                    animation-delay: 1.5s;
                }
                .animation-delay-1600 {
                    animation-delay: 1.6s;
                }
                .animation-delay-1800 {
                    animation-delay: 1.8s;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                .animation-delay-2400 {
                    animation-delay: 2.4s;
                }
                .animation-delay-2500 {
                    animation-delay: 2.5s;
                }
                .animation-delay-2800 {
                    animation-delay: 2.8s;
                }
                .animation-delay-3000 {
                    animation-delay: 3s;
                }
                .animation-delay-3200 {
                    animation-delay: 3.2s;
                }
                .animation-delay-3500 {
                    animation-delay: 3.5s;
                }
                .animation-delay-3400 {
                    animation-delay: 3.4s;
                }
                .animation-delay-3600 {
                    animation-delay: 3.6s;
                }
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
            `}</style>
        </div>
    );
};

export default HomePresentation;
