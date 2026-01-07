import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Footer } from '../components/Footer';
import {
    BookOpen,
    Search,
    ShieldCheck,
    CreditCard,
    UserPlus,
    HelpCircle,
    ChevronRight,
    CheckCircle2
} from 'lucide-react';
import { cn } from '../lib/utils';

interface Section {
    id: string;
    title: string;
    icon: React.ElementType;
    content: React.ReactNode;
}

const ComoFuncionaPage: React.FC = () => {
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState<string>('introduction');

    const sections: Section[] = [
        {
            id: 'introduction',
            title: 'Introducción',
            icon: BookOpen,
            content: (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="prose prose-slate max-w-none">
                        <p className="text-lg leading-relaxed text-slate-600">
                            Nuestra plataforma conecta a personas que necesitan servicios especializados con expertos verificados y confiables. Ya sea que busques verificar una compra importante, obtener asesoramiento profesional o contratar un servicio especializado, aquí encontrarás a los mejores expertos del mercado.
                        </p>
                        <p className="text-lg leading-relaxed text-slate-600 mt-4">
                            En un mundo donde las transacciones online se han vuelto cada vez más comunes, la confianza y la verificación son fundamentales. Nuestra misión es garantizar que cada transacción sea segura, transparente y exitosa.
                        </p>
                    </div>

                    <div className="bg-indigo-50/50 rounded-2xl p-6 border border-indigo-100">
                        <h3 className="text-indigo-900 font-semibold mb-4 flex items-center gap-2">
                            <BookOpen className="w-5 h-5" />
                            ¿Qué encontrarás en esta guía?
                        </h3>
                        <ul className="grid sm:grid-cols-2 gap-3">
                            {[
                                '¿Qué es nuestra plataforma?',
                                'Cómo buscar y contratar expertos',
                                'Proceso de verificación',
                                'Sistema de pagos seguro',
                                'Cómo convertirse en experto'
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-2 text-indigo-700 text-sm">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )
        },
        {
            id: 'que-es-nuestra-plataforma',
            title: '¿Qué es nuestra plataforma?',
            icon: HelpCircle,
            content: (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">Un marketplace de confianza</h2>
                    <p className="text-slate-600 leading-relaxed">
                        Nuestra plataforma es un marketplace especializado que conecta a compradores con expertos verificados. Nos diferenciamos por nuestro enfoque obsesivo en la seguridad y la validación de credenciales.
                    </p>

                    <div className="grid sm:grid-cols-2 gap-4 mt-8">
                        <div className="p-4 border border-slate-200 rounded-xl hover:border-indigo-200 hover:shadow-md transition-all group bg-white">
                            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <h3 className="font-semibold text-slate-900 mb-2">Verificación Rigurosa</h3>
                            <p className="text-sm text-slate-500">Validamos identidad y credenciales de cada experto manualmente.</p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl hover:border-indigo-200 hover:shadow-md transition-all group bg-white">
                            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                <UserPlus className="w-5 h-5" />
                            </div>
                            <h3 className="font-semibold text-slate-900 mb-2">Profesionales Reales</h3>
                            <p className="text-sm text-slate-500">Solo expertos con experiencia comprobable pueden ofrecer servicios.</p>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'como-buscar-expertos',
            title: 'Cómo buscar expertos',
            icon: Search,
            content: (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="relative pl-8 border-l-2 border-slate-200 space-y-8">
                        {[
                            {
                                title: 'Define tu necesidad',
                                desc: 'Especifica qué tipo de servicio necesitas. Puedes buscar por categoría o describir tu necesidad.',
                                step: 1
                            },
                            {
                                title: 'Explora expertos',
                                desc: 'Revisa nuestra lista de expertos verificados, sus calificaciones y reseñas.',
                                step: 2
                            },
                            {
                                title: 'Contacta y contrata',
                                desc: 'Habla directamente con el experto y contrata el servicio de forma segura.',
                                step: 3
                            }
                        ].map((step, i) => (
                            <div key={i} className="relative">
                                <span className="absolute -left-[41px] top-0 w-8 h-8 rounded-full bg-white border-2 border-indigo-600 flex items-center justify-center text-indigo-600 font-bold text-sm z-10">
                                    {step.step}
                                </span>
                                <h3 className="text-lg font-bold text-slate-900 mb-2">{step.title}</h3>
                                <p className="text-slate-600">{step.desc}</p>
                            </div>
                        ))}
                    </div>

                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <p className="text-sm text-slate-600 flex gap-3">
                            <span className="shrink-0 w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600">💡</span>
                            Nuestro sistema de búsqueda avanzada te permite filtrar por ubicación, precio y disponibilidad para encontrar exactamente lo que necesitas.
                        </p>
                    </div>
                </div>
            )
        },
        {
            id: 'proceso-de-verificacion',
            title: 'Proceso de verificación',
            icon: ShieldCheck,
            content: (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-green-50/50 border border-green-100 rounded-2xl p-6 mb-8">
                        <h3 className="text-green-800 font-semibold mb-2">Seguridad ante todo</h3>
                        <p className="text-green-700 text-sm">
                            Todos los expertos deben pasar por nuestro riguroso proceso de 5 puntos antes de ser activados.
                        </p>
                    </div>

                    <div className="grid gap-4">
                        {[
                            'Verificación de identidad oficial',
                            'Validación de credenciales profesionales',
                            'Revisión de historial y experiencia',
                            'Verificación de antecedentes',
                            'Evaluación continua de calidad'
                        ].map((item, i) => (
                            <div key={i} className="flex items-start gap-4 p-4 rounded-lg bg-white border border-slate-100 shadow-sm">
                                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                                <span className="text-slate-700 font-medium">{item}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )
        },
        {
            id: 'sistema-de-pagos',
            title: 'Sistema de pagos seguro',
            icon: CreditCard,
            content: (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <p className="text-slate-600">
                        Utilizamos un sistema de custodia (escrow) que protege tu dinero hasta que el servicio se completa.
                    </p>

                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-2xl text-white shadow-lg">
                            <CreditCard className="w-8 h-8 mb-4 opacity-80" />
                            <h3 className="font-bold text-lg mb-2">Pago en Custodia</h3>
                            <p className="text-indigo-100 text-sm">Tu dinero está seguro. El experto solo recibe el pago cuando tú confirmas que el trabajo está hecho.</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <ShieldCheck className="w-8 h-8 mb-4 text-emerald-500" />
                            <h3 className="font-bold text-slate-900 text-lg mb-2">Encriptación Bancaria</h3>
                            <p className="text-slate-500 text-sm">Utilizamos los mismos estándares de seguridad (PCI DSS) que los bancos internacionales.</p>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'como-convertirse-en-experto',
            title: 'Ser experto',
            icon: UserPlus,
            content: (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="p-6 bg-slate-900 rounded-2xl text-white relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="text-2xl font-bold mb-4">Únete a nuestra red</h3>
                            <p className="text-slate-300 mb-6">Ofrece tus servicios a miles de clientes, gestiona tu negocio y recibe pagos seguros.</p>
                            <button
                                onClick={() => navigate('/become-expert')}
                                className="bg-white text-slate-900 px-6 py-2 rounded-lg font-medium hover:bg-slate-100 transition-colors inline-flex items-center gap-2"
                            >
                                Empezar ahora
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">
                        <div className="p-4 bg-slate-50 rounded-lg">
                            <strong className="block text-slate-900 mb-1">1. Crea tu cuenta</strong>
                            Registro simple y rápido.
                        </div>
                        <div className="p-4 bg-slate-50 rounded-lg">
                            <strong className="block text-slate-900 mb-1">2. Verifícate</strong>
                            Validamos tu perfil en 24-48 horas.
                        </div>
                    </div>
                </div>
            )
        }
    ];

    const activeContent = sections.find(s => s.id === activeSection)?.content;

    return (
        <div className="min-h-screen bg-white flex flex-col font-sans">
            {/* Header Section */}
            <section className="bg-white border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
                    <div className="max-w-3xl">
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-6">
                            Cómo funciona
                        </h1>
                        <p className="text-xl text-slate-500 leading-relaxed">
                            Descubre cómo conectamos a personas con expertos de confianza en una plataforma segura y transparente.
                        </p>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="lg:grid lg:grid-cols-[300px_1fr] lg:gap-12">
                    {/* Navigation - Mobile (Horizontal Scroll) & Desktop (Vertical Sidebar) */}
                    <nav className="mb-12 lg:mb-0">

                        {/* Mobile Scrollable Menu */}
                        <div className="lg:hidden -mx-4 px-4 overflow-x-auto pb-4 scrollbar-hide">
                            <div className="flex space-x-2 w-max">
                                {sections.map((section) => {
                                    const Icon = section.icon;
                                    const isActive = activeSection === section.id;
                                    return (
                                        <button
                                            key={section.id}
                                            onClick={() => setActiveSection(section.id)}
                                            className={cn(
                                                "flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                                                isActive
                                                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                                                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                                            )}
                                        >
                                            <Icon className="w-4 h-4" />
                                            {section.title}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Desktop Sidebar Menu */}
                        <div className="hidden lg:block sticky top-24 space-y-1">
                            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-4">
                                Guía de la plataforma
                            </h3>
                            {sections.map((section) => {
                                const Icon = section.icon;
                                const isActive = activeSection === section.id;
                                return (
                                    <button
                                        key={section.id}
                                        onClick={() => setActiveSection(section.id)}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-medium transition-all group",
                                            isActive
                                                ? "bg-indigo-50 text-indigo-700 shadow-sm"
                                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                                            isActive ? "bg-white shadow-sm" : "bg-slate-100 group-hover:bg-white"
                                        )}>
                                            <Icon className={cn(
                                                "w-4 h-4 transition-colors",
                                                isActive ? "text-indigo-600" : "text-slate-500 group-hover:text-slate-700"
                                            )} />
                                        </div>
                                        {section.title}
                                        {isActive && (
                                            <ChevronRight className="w-4 h-4 ml-auto text-indigo-400 animate-in fade-in slide-in-from-left-2" />
                                        )}
                                    </button>
                                );
                            })}

                            <div className="mt-8 px-4 pt-8 border-t border-slate-100">
                                <button
                                    onClick={() => navigate('/become-expert')}
                                    className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white px-4 py-3 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
                                >
                                    Convertirse en experto
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </nav>

                    {/* Content Section */}
                    <div className="min-h-[500px]">
                        <div className="bg-white rounded-3xl p-6 md:p-10 border border-slate-100 shadow-xl shadow-slate-100/50 ring-1 ring-slate-50">
                            {activeContent}
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default ComoFuncionaPage;
