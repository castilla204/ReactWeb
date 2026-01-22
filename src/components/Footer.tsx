import React from 'react';
import logoImg from '../media/logoi.png';

export const Footer = () => {
    return (
        <footer className="hidden md:block bg-white border-t border-gray-100 relative z-30" style={{ backgroundColor: '#fbfbfb' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
                {/* Links principales - Compacto */}
                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mb-3 md:mb-4">
                    <a href="/become-expert" className="text-xs md:text-sm text-gray-600 hover:text-cyan-600 transition-colors" style={{ color: '#4b5563' }}>
                        Hazte Experto
                    </a>
                    <span className="text-gray-300">·</span>
                    <a href="/terms.html" className="text-xs md:text-sm text-gray-600 hover:text-cyan-600 transition-colors" style={{ color: '#4b5563' }}>
                        Términos y Condiciones
                    </a>
                    <span className="text-gray-300">·</span>
                    <a href="/privacy-policy.html" className="text-xs md:text-sm text-gray-600 hover:text-cyan-600 transition-colors" style={{ color: '#4b5563' }}>
                        Privacidad
                    </a>
                    <span className="text-gray-300 hidden md:inline">·</span>
                    <a href="/cookies" className="text-xs md:text-sm text-gray-600 hover:text-cyan-600 transition-colors hidden md:inline" style={{ color: '#4b5563' }}>
                        Cookies
                    </a>
                </div>

                {/* Copyright - Compacto */}
                <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4">
                    <div className="flex items-center gap-2">
                        <img src={logoImg} alt="Logo" className="w-4 h-4 object-contain" />
                        <p className="text-xs text-gray-500" style={{ color: '#6b7280' }}>
                            © {new Date().getFullYear()} inspecciono.com
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
};

