import React from 'react';
import { ArrowRight, Shield, Users, Sparkles, CheckCircle2 } from 'lucide-react';

/**
 * Componente Hero mejorado para Memorae.ai
 * Mensaje claro estilo "Revisa antes de comprar"
 */
const MemoraeHeroImproved: React.FC = () => {
    return (
        <section className="relative w-full min-h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Fondo con efectos sutiles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Gradientes animados */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                
                {/* Grid sutil */}
                <div className="absolute inset-0 opacity-30" style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(59, 130, 246, 0.15) 1px, transparent 0)',
                    backgroundSize: '40px 40px'
                }}></div>
            </div>

            {/* Contenido principal */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="text-center space-y-8">
                    {/* Badge de confianza */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 shadow-sm">
                        <Shield className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-700">
                            10,000+ usuarios ya no pierden lo importante
                        </span>
                    </div>

                    {/* Mensaje principal - ESTILO "REVISA ANTES DE COMPRAR" */}
                    <div className="space-y-4">
                        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight">
                            <span className="block">No pierdas lo importante.</span>
                            <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent animate-gradient">
                                Memorae lo guarda por ti.
                            </span>
                        </h1>
                        
                        {/* Subtítulo */}
                        <p className="text-lg sm:text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                            Guarda conversaciones, eventos, tareas y recuerdos importantes.
                            <br className="hidden sm:block" />
                            <span className="font-semibold text-gray-800">Tu asistente de memoria con IA que nunca olvida.</span>
                        </p>
                    </div>

                    {/* CTAs mejorados */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        {/* CTA Principal */}
                        <button className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-lg rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                            <span className="relative z-10 flex items-center gap-2">
                                Comenzar a guardar mis recuerdos
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </span>
                            {/* Efecto hover */}
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </button>

                        {/* CTA Secundario */}
                        <button className="px-8 py-4 bg-white text-gray-700 font-semibold text-lg rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-300 shadow-sm">
                            Ver cómo funciona
                        </button>
                    </div>

                    {/* Indicadores de confianza */}
                    <div className="flex flex-wrap items-center justify-center gap-6 pt-8 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                            <span>Sin tarjeta de crédito</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                            <span>Prueba gratuita</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                            <span>Cancelación en cualquier momento</span>
                        </div>
                    </div>

                    {/* Social proof visual */}
                    <div className="pt-12">
                        <div className="flex items-center justify-center gap-4">
                            <div className="flex -space-x-3">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div
                                        key={i}
                                        className="w-12 h-12 rounded-full border-2 border-white bg-gradient-to-br from-blue-400 to-purple-400 shadow-md overflow-hidden"
                                    >
                                        <img
                                            src={`https://i.pravatar.cc/100?img=${i + 10}`}
                                            alt="Usuario"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="text-left">
                                <div className="flex items-center gap-1">
                                    <div className="flex text-yellow-400">
                                        {'★★★★★'.split('').map((star, i) => (
                                            <span key={i} className="text-lg">{star}</span>
                                        ))}
                                    </div>
                                    <span className="text-sm font-semibold text-gray-700 ml-1">4.9</span>
                                </div>
                                <p className="text-xs text-gray-600 mt-0.5">
                                    <span className="font-semibold text-gray-800">10,000+</span> usuarios satisfechos
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Estilos adicionales */}
            <style>{`
                @keyframes gradient {
                    0%, 100% {
                        background-position: 0% 50%;
                    }
                    50% {
                        background-position: 100% 50%;
                    }
                }
                .animate-gradient {
                    background-size: 200% 200%;
                    animation: gradient 3s ease infinite;
                }
            `}</style>
        </section>
    );
};

export default MemoraeHeroImproved;












