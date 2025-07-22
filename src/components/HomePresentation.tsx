import React from 'react';
import { Shield, Search, CheckCircle } from 'lucide-react';
import PromoBanner from './PromoBanner'; // Importamos el nuevo componente

const HomePresentation = ({ onScrollToForm }) => {
    return (
        <div className="relative w-full bg-gradient-to-b from-blue-50 to-white/90 overflow-hidden animate-fade-in">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_20%,rgba(59,130,246,0.2),transparent_60%)]" />
            <div className="w-full px-4 md:px-8 lg:px-12 py-16 md:py-20 lg:py-24">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10 items-center animate-fade-in-up">
                        <div className="px-4 md:px-6 lg:px-8 space-y-5">
                            <h1 className="text-3xl sm:text-4xl md:text-5xl font-display text-blue-900 leading-tight animate-fade-in-up tracking-tight">
                                Tu eliges el coche, nosotros hacemos el resto
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
                    <div className="mt-8 sm:mt-10 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
                        <div className="p-3 sm:p-4 bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 space-y-2">
                            <Search className="w-5 sm:w-6 h-5 sm:h-6 text-blue-600" />
                            <h3 className="text-base sm:text-lg font-semibold text-gray-800">Busca en línea</h3>
                            <p className="text-xs sm:text-sm text-gray-600">Encuentra coches que cumplen con tus criterios usando nuestra búsqueda avanzada.</p>
                        </div>
                        <div className="p-3 sm:p-4 bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 space-y-2">
                            <CheckCircle className="w-5 sm:w-6 h-5 sm:h-6 text-blue-600" />
                            <h3 className="text-base sm:text-lg font-semibold text-gray-800">Revisión presencial</h3>
                            <p className="text-xs sm:text-sm text-gray-600">Nuestros técnicos revisan cada coche para garantizar su calidad.</p>
                        </div>
                        <div className="p-3 sm:p-4 bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 space-y-2">
                            <Shield className="w-5 sm:w-6 h-5 sm:h-6 text-blue-600" />
                            <h3 className="text-base sm:text-lg font-semibold text-gray-800">Compra con confianza</h3>
                            <p className="text-xs sm:text-sm text-gray-600">Decide con información completa y la tranquilidad de nuestra garantía.</p>
                        </div>
                    </div>
                    <div className="flex justify-center gap-3 sm:gap-4 mt-4 sm:mt-6">
                        <img src="path-to-certification-logo.jpg" alt="Certificación" className="h-8 sm:h-10" />
                        <img src="path-to-partner-logo.jpg" alt="Partner" className="h-8 sm:h-10" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomePresentation;