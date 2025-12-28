import React from 'react';
import { Shield, Mail, Instagram, Twitter, Linkedin, Facebook, MapPin, Globe } from 'lucide-react';
import { Separator } from './ui/separator';
import logoImg from '../media/logoi.png';

export const Footer = () => {
    return (
        <footer className="bg-white border-t border-gray-100 relative z-30" style={{ backgroundColor: '#ffffff' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
                    {/* Brand Column */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                             <img src={logoImg} alt="Logo" className="w-6 h-6 object-contain" />
                             <span className="text-lg font-bold bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                inspecciono.com
                            </span>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed max-w-xs" style={{ color: '#4b5563' }}>
                            La plataforma líder en inspecciones profesionales. Garantizamos seguridad y confianza en tus compras de segunda mano.
                        </p>
                        <div className="flex gap-4 pt-2">
                            <a href="#" className="text-gray-400 hover:text-gray-900 transition-colors" aria-label="Twitter">
                                <Twitter className="w-4 h-4" />
                            </a>
                             <a href="#" className="text-gray-400 hover:text-pink-600 transition-colors" aria-label="Instagram">
                                <Instagram className="w-4 h-4" />
                            </a>
                             <a href="#" className="text-gray-400 hover:text-blue-700 transition-colors" aria-label="LinkedIn">
                                <Linkedin className="w-4 h-4" />
                            </a>
                        </div>
                    </div>

                    {/* Product Column */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-4" style={{ color: '#111827' }}>Plataforma</h3>
                        <ul className="space-y-2.5">
                            <li>
                                <a href="/servicios" className="text-sm text-gray-600 hover:text-cyan-600 transition-colors" style={{ color: '#4b5563' }}>Servicios</a>
                            </li>
                            <li>
                                <a href="/become-expert" className="text-sm text-gray-600 hover:text-cyan-600 transition-colors" style={{ color: '#4b5563' }}>Hazte Experto</a>
                            </li>
                            <li>
                                <a href="/como-funciona" className="text-sm text-gray-600 hover:text-cyan-600 transition-colors" style={{ color: '#4b5563' }}>Cómo funciona</a>
                            </li>
                        </ul>
                    </div>

                    {/* Company Column */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-4" style={{ color: '#111827' }}>Compañía</h3>
                        <ul className="space-y-2.5">
                            <li>
                                <a href="/about" className="text-sm text-gray-600 hover:text-cyan-600 transition-colors" style={{ color: '#4b5563' }}>Sobre nosotros</a>
                            </li>
                             <li>
                                <a href="/contact.html" className="text-sm text-gray-600 hover:text-cyan-600 transition-colors" style={{ color: '#4b5563' }}>Contacto</a>
                            </li>
                            <li>
                                <a href="/blog" className="text-sm text-gray-600 hover:text-cyan-600 transition-colors" style={{ color: '#4b5563' }}>Blog</a>
                            </li>
                        </ul>
                    </div>
                    
                    {/* Legal Column */}
                     <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-4" style={{ color: '#111827' }}>Legal</h3>
                        <ul className="space-y-2.5">
                            <li>
                                <a href="/privacy-policy.html" className="text-sm text-gray-600 hover:text-cyan-600 transition-colors" style={{ color: '#4b5563' }}>Política de Privacidad</a>
                            </li>
                            <li>
                                <a href="/terms.html" className="text-sm text-gray-600 hover:text-cyan-600 transition-colors" style={{ color: '#4b5563' }}>Términos y Condiciones</a>
                            </li>
                            <li>
                                <a href="/cookies" className="text-sm text-gray-600 hover:text-cyan-600 transition-colors" style={{ color: '#4b5563' }}>Cookies</a>
                            </li>
                        </ul>
                    </div>
                </div>

                <Separator className="my-8 bg-gray-100" />

                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-xs text-gray-500 text-center md:text-left" style={{ color: '#6b7280' }}>
                        © {new Date().getFullYear()} inspecciono.com. Todos los derechos reservados.
                    </p>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 text-xs text-gray-500" style={{ color: '#6b7280' }}>
                            <Globe className="w-3.5 h-3.5" />
                            <span>Español</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

