import { useState, useEffect } from 'react';
import { Car, Home, Bike, Search, ChevronDown, Link as LinkIcon, FolderTree, X, MoreHorizontal } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCategories } from '../contexts/CategoryContext';
import { useServiceTypes } from '../hooks/useServiceTypes';
import { useNavigate } from 'react-router-dom';
import { GoogleSignInButton } from './GoogleSignInButton';
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerClose,
} from './ui/drawer';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from './ui/dialog';


// Importar imágenes directamente
import motoAguaImg from '../media/motoagua.png';
import motoImg from '../media/motopng.png';
import cocheImg from '../media/cochepng.png';
import casaImg from '../media/casapng.png';

interface HomePresentationProps {
    onScrollToForm: () => void;
}

// Componente para mostrar el icono de la categoría
const CategoryImage: React.FC<{ categoryName: string; size?: 'sm' | 'md' }> = ({ categoryName, size = 'sm' }) => {
    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-10 h-10'
    };

    // Determinar qué imagen usar según el nombre de la categoría
    const isMotoAgua = categoryName.toLowerCase().includes('moto') && categoryName.toLowerCase().includes('agua');
    const isMoto = categoryName.toLowerCase().includes('moto') && !isMotoAgua;
    const isCoche = categoryName.toLowerCase().includes('coche') || categoryName.toLowerCase().includes('vehículo');
    const isCasa = categoryName.toLowerCase().includes('inmobiliaria') || categoryName.toLowerCase().includes('casa') || categoryName.toLowerCase().includes('inmueble');

    if (isMotoAgua) {
        return (
            <img 
                src={motoAguaImg}
                alt="Moto de agua"
                className={`${sizeClasses[size]} object-contain rounded-md`}
            />
        );
    }
    
    if (isMoto) {
        return (
            <img 
                src={motoImg}
                alt="Moto"
                className={`${sizeClasses[size]} object-contain rounded-md`}
            />
        );
    }
    
    if (isCoche) {
        return (
            <img 
                src={cocheImg}
                alt="Coche"
                className={`${sizeClasses[size]} object-contain rounded-md`}
            />
        );
    }
    
    if (isCasa) {
        return (
            <img 
                src={casaImg}
                alt="Casa"
                className={`${sizeClasses[size]} object-contain rounded-md`}
            />
        );
    }

    // Fallback: icono por defecto
    return (
        <div className={`${sizeClasses[size]} rounded-md bg-gray-100 flex items-center justify-center`}>
            <FolderTree className="w-4 h-4 text-gray-400" />
        </div>
    );
};

const HomePresentation = ({ onScrollToForm }: HomePresentationProps) => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const { categories } = useCategories();
    const { serviceTypes, isLoading: serviceTypesLoading } = useServiceTypes();
    const [currentWord, setCurrentWord] = useState('coche');
    const [isGlitching, setIsGlitching] = useState(false);
    const [glitchText, setGlitchText] = useState('coche');
    
    // Estado del buscador estilo Airbnb
    const [searchForm, setSearchForm] = useState({
        serviceTypeId: null as number | null,
        categoryId: null as number | null,
        adUrl: '',
    });
    
    const [isServiceTypeOpen, setIsServiceTypeOpen] = useState(false);
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [isCategoryDrawerOpen, setIsCategoryDrawerOpen] = useState(false);
    const [isUrlDialogOpen, setIsUrlDialogOpen] = useState(false);
    
    // Cerrar dropdowns al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.service-type-dropdown') && !target.closest('.category-dropdown')) {
                setIsServiceTypeOpen(false);
                setIsCategoryOpen(false);
            }
        };
        
        if (isServiceTypeOpen || isCategoryOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isServiceTypeOpen, isCategoryOpen]);
    
    const handleSearch = () => {
        // Validar que haya tipo de servicio y categoría
        if (!searchForm.serviceTypeId || !searchForm.categoryId) {
            // Si no hay selección, hacer scroll al formulario
            onScrollToForm();
            return;
        }
        
        // Guardar los parámetros en sessionStorage para que SearchCreationPage los lea
        sessionStorage.setItem('homeSearchParams', JSON.stringify({
            serviceTypeId: searchForm.serviceTypeId,
            categoryId: searchForm.categoryId,
            adUrl: searchForm.adUrl || '',
        }));
        
        // Navegar a crear-busqueda sin parámetros en la URL
        // Usar window.location para forzar una recarga completa si ya estamos en esa página
        if (window.location.pathname === '/crear-busqueda' || window.location.pathname === '/') {
            // Si ya estamos en la página, forzar recarga
            window.location.href = '/crear-busqueda';
        } else {
            navigate('/crear-busqueda');
        }
    };

    useEffect(() => {
        const interval = setInterval(() => {
            // Iniciar efecto glitch más suave
            setIsGlitching(true);
            
            // Generar texto glitch más moderno con caracteres más elegantes
            const glitchChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*';
            const glitchInterval = setInterval(() => {
                const randomText = Array.from({ length: currentWord.length }, () => 
                    glitchChars[Math.floor(Math.random() * glitchChars.length)]
                ).join('');
                setGlitchText(randomText);
            }, 100); // Más lento para efecto más elegante

            // Después de 200ms, cambiar a la palabra real
            setTimeout(() => {
                clearInterval(glitchInterval);
                setCurrentWord((prev) => {
                    if (prev === 'coche') return 'casa';
                    if (prev === 'casa') return 'moto';
                    return 'coche';
                });
                setGlitchText(currentWord);
                setIsGlitching(false);
            }, 200);
        }, 5000); // Cambia cada 5 segundos para ser más sutil

        // Limpieza al desmontar el componente
        return () => {
            clearInterval(interval);
        };
    }, [currentWord]);

    return (
        <div className="relative w-full min-h-[100dvh] lg:min-h-screen bg-white overflow-hidden">
            {/* Fondo Premium "Electric Wave" */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* 1. Fondo base limpio */}
                <div className="absolute inset-0 bg-white"></div>
                
                {/* 2. Onda principal vibrante (Azul Eléctrico a Violeta) */}
                <div className="absolute -top-[30%] -right-[10%] w-[90%] h-[120%] bg-gradient-to-b from-blue-600 via-indigo-600 to-violet-600 opacity-[0.15] rounded-[100%] blur-[80px] animate-float-delayed z-0 transform rotate-12"></div>
                
                {/* 3. Onda secundaria de contraste (Cian Brillante) */}
                <div className="absolute top-[-10%] right-[-20%] w-[70%] h-[100%] bg-gradient-to-bl from-cyan-400 via-blue-500 to-indigo-500 opacity-[0.12] rounded-[100%] blur-[60px] animate-pulse-slow z-0"></div>
                
                {/* 4. Acentos de luz (Orbes brillantes) */}
                <div className="absolute top-[15%] right-[15%] w-64 h-64 bg-blue-400/20 rounded-full blur-[50px] mix-blend-overlay animate-float"></div>
                <div className="absolute top-[40%] right-[5%] w-48 h-48 bg-cyan-300/20 rounded-full blur-[40px] mix-blend-overlay animate-float-delayed"></div>

                {/* 5. Malla de puntos técnica (Alta definición) */}
                <div className="absolute inset-0 z-0 opacity-[0.4]" style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, #3b82f6 1px, transparent 0)',
                    backgroundSize: '40px 40px',
                    maskImage: 'linear-gradient(to bottom right, rgba(0,0,0,0.8), rgba(0,0,0,0))'
                }}></div>
                
                {/* 6. Brillo cenital sutil */}
                <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-white/80 to-transparent z-0"></div>
                    </div>

            {/* Hero móvil - Diseño profesional marketplace */}
            <div className="lg:hidden relative min-h-[calc(100dvh-64px)] z-20 flex flex-col">
                <div className="flex-1 flex flex-col justify-center px-5 pt-8 pb-6">
                    <div className="w-full max-w-md mx-auto space-y-7">
                    
                        {/* Badge simple y profesional */}
                        <div className="inline-flex items-center gap-2 text-sm text-gray-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                            <span>Disponible en 50+ países</span>
                            </div>
                            
                        {/* Título - Tipografía más natural */}
                        <div className="space-y-3">
                            <h1 className="text-[2.5rem] leading-[1.15] font-semibold text-gray-900 tracking-[-0.01em]">
                        No compres <br/>
                                <span className="text-blue-600 font-medium">a ciegas</span>
                            </h1>
                            <p className="text-[1.05rem] text-gray-600 leading-relaxed">
                        Revisamos tu{' '}
                                <span className="font-semibold text-gray-900">
                                {isGlitching ? glitchText : currentWord}
                        </span>
                        {' '}antes de que pagues.
                            </p>
                    </div>
                            
                        {/* Estadísticas integradas */}
                        <div className="flex items-center gap-5 text-sm text-gray-500 pt-1">
                            <div className="flex items-center gap-1.5">
                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 002 2h2.945M15 15v3a2 2 0 01-2 2H5a2 2 0 01-2-2v-3m0-4V9a2 2 0 012-2h2.945M15 5v3a2 2 0 01-2 2H9a2 2 0 00-2 2v1m6-6V5a2 2 0 012-2h2a2 2 0 012 2v1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span><strong className="text-gray-900 font-medium">2.5k+</strong> inspecciones</span>
                            </div>
                            <div className="w-px h-4 bg-gray-300"></div>
                            <div className="flex items-center gap-1.5">
                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span><strong className="text-gray-900 font-medium">500+</strong> expertos</span>
                            </div>
                        </div>
                                
                        {/* Botón principal - Diseño marketplace */}
                        <div className="pt-3">
                                <button
                                    onClick={onScrollToForm}
                                className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium text-base py-3.5 px-6 rounded-lg active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
                                >
                                <span>Empezar ahora</span>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                                </button>
                    </div>
                    
                    {/* Botón secundario Google */}
                                {!isAuthenticated && (
                            <div className="w-full">
                            <GoogleSignInButton />
                                    </div>
                                )}
                    </div>
                </div>
                            
                {/* Social proof - Parte inferior */}
                <div className="px-5 pb-8">
                    <div className="max-w-md mx-auto">
                        <div className="flex items-center justify-center gap-4">
                            <div className="flex -space-x-3">
                                {[1,2,3,4].map(i => (
                                    <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-gray-200 overflow-hidden shadow-sm">
                                    <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" className="w-full h-full object-cover" />
                                </div>
                                        ))}
                                    </div>
                        <div className="text-left">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                    <div className="flex text-yellow-400 text-sm">★★★★★</div>
                                    <span className="text-xs text-gray-500 font-medium">4.9</span>
                                </div>
                                <div className="text-xs text-gray-600">
                                    <strong className="text-gray-900 font-medium">2,500+</strong> clientes satisfechos
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sección de formulario móvil - Diseño profesional */}
            <div id="form-section" className="lg:hidden relative z-10 w-full bg-white px-5 py-12">
                <div className="max-w-lg mx-auto w-full space-y-8">
                    {/* Header */}
                    <div className="space-y-2">
                        <h2 className="text-[1.9rem] font-semibold text-gray-900 tracking-tight">
                            Encuentra tu experto
                        </h2>
                        <p className="text-[0.95rem] text-gray-600 leading-relaxed">
                            Selecciona el tipo de servicio y categoría para comenzar
                        </p>
                    </div>

                    {/* Formulario - Diseño limpio marketplace */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        {/* Tipo de servicio */}
                        <div className="relative service-type-dropdown border-b border-gray-200">
                            <button
                                onClick={() => {
                                    setIsCategoryOpen(false);
                                    setIsServiceTypeOpen(!isServiceTypeOpen);
                                }}
                                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex-1">
                                    <div className="text-xs font-medium text-gray-700 mb-1">Tipo de servicio</div>
                                    <div className={searchForm.serviceTypeId ? 'text-base text-gray-900 font-medium' : 'text-base text-gray-400'}>
                                        {searchForm.serviceTypeId 
                                            ? serviceTypes.find(st => st.id === searchForm.serviceTypeId)?.name || 'Seleccionar'
                                            : 'Selecciona un tipo'}
                                    </div>
                                </div>
                                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${isServiceTypeOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {isServiceTypeOpen && (
                                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
                                    {serviceTypesLoading ? (
                                        <div className="px-6 py-4 text-sm text-gray-500">Cargando...</div>
                                    ) : serviceTypes.length > 0 ? (
                                        serviceTypes.map((st) => (
                                            <button
                                                key={st.id}
                                                onClick={() => {
                                                    setSearchForm({...searchForm, serviceTypeId: st.id});
                                                    setIsServiceTypeOpen(false);
                                                }}
                                                className="w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                                            >
                                                <div className="font-medium text-gray-900 text-sm">{st.name}</div>
                                                {st.description && (
                                                    <div className="text-xs text-gray-500 mt-0.5">{st.description}</div>
                                                )}
                                            </button>
                                        ))
                                    ) : (
                                        <div className="px-6 py-4 text-sm text-gray-500">No hay tipos disponibles</div>
                                    )}
                                </div>
                            )}
                        </div>
                        
                        {/* Categoría */}
                        <div className="border-b border-gray-200 pb-4">
                            <div className="text-xs font-medium text-gray-700 mb-3 px-5 pt-4">Categoría</div>
                            
                            {/* Categorías visibles */}
                            <div className="px-5">
                                <div className="flex flex-wrap gap-2">
                                    {categories.slice(0, 4).map((cat) => (
                                        <button
                                            key={cat.id}
                                            onClick={() => {
                                                setSearchForm({...searchForm, categoryId: cat.id});
                                            }}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                searchForm.categoryId === cat.id
                                                    ? 'bg-gray-900 text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                        >
                                            <CategoryImage categoryName={cat.name} size="sm" />
                                            <span>{cat.name}</span>
                                        </button>
                                    ))}
                                    
                                    {/* Botón "Ver más" si hay más categorías */}
                                    {categories.length > 4 && (
                                        <button
                                            onClick={() => {
                                                setIsServiceTypeOpen(false);
                                                setIsCategoryDrawerOpen(true);
                                            }}
                                            className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
                                        >
                                            <MoreHorizontal className="w-4 h-4" />
                                            <span>Más</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                            
                            {/* Drawer con todas las categorías */}
                            <Drawer open={isCategoryDrawerOpen} onOpenChange={setIsCategoryDrawerOpen}>
                                <DrawerContent className="max-h-[85vh]">
                                    <DrawerHeader className="border-b border-gray-200">
                                        <div className="flex items-center justify-between">
                                            <DrawerTitle className="text-lg font-semibold text-gray-900">
                                                Todas las categorías
                                            </DrawerTitle>
                                            <DrawerClose asChild>
                                                <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                                                    <X className="w-5 h-5 text-gray-500" />
                                                </button>
                                            </DrawerClose>
                                        </div>
                                    </DrawerHeader>
                                    
                                    <div className="overflow-y-auto px-4 py-4">
                                        <div className="grid grid-cols-2 gap-3">
                                            {categories.map((cat) => (
                                                <button
                                                    key={cat.id}
                                                    onClick={() => {
                                                        setSearchForm({...searchForm, categoryId: cat.id});
                                                        setIsCategoryDrawerOpen(false);
                                                    }}
                                                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                                                        searchForm.categoryId === cat.id
                                                            ? 'border-gray-900 bg-gray-50'
                                                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    <CategoryImage categoryName={cat.name} size="md" />
                                                    <span className={`text-sm font-medium ${
                                                        searchForm.categoryId === cat.id ? 'text-gray-900' : 'text-gray-700'
                                                    }`}>
                                                        {cat.name}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </DrawerContent>
                            </Drawer>
                        </div>
                        
                        {/* URL del anuncio - Estilo Airbnb */}
                        <div className="relative">
                            <div className="px-6 py-4">
                                <div className="text-xs font-semibold text-gray-900 mb-0.5">URL del anuncio</div>
                                <div className="relative">
                                    <LinkIcon className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Pega la URL del anuncio"
                                        value={searchForm.adUrl}
                                        onChange={(e) => setSearchForm({...searchForm, adUrl: e.target.value})}
                                        className="w-full pl-6 pr-2 text-sm text-gray-900 placeholder-gray-500 bg-transparent border-0 focus:outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                        
                        {/* Botón buscar */}
                        <div className="px-5 pb-5 pt-2">
                            <button
                                onClick={handleSearch}
                                className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium text-base py-3.5 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                <Search className="w-5 h-5" />
                                <span>Buscar expertos</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="relative z-10 w-full hidden lg:block px-4 sm:px-6 md:px-12 lg:px-16 py-6 sm:py-8 md:py-10 lg:py-12">
                {/* Contenido principal - solo desktop */}
                <div className="lg:block">
                    <div className="max-w-6xl mx-auto w-full">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-center">
                        <div className="space-y-5 lg:space-y-6 text-left lg:text-left">
                                {/* Versión móvil - diseño limpio y profesional */}
                                <div className="lg:hidden space-y-6">
                                    {/* Título simple y claro */}
                                    <div>
                                        <h1 className="text-3xl font-bold text-gray-900 leading-tight mb-3">
                                                Inspecciona tu{' '}
                                                <span className="relative inline-block min-w-[80px] text-left">
                                                    <span 
                                                        className={`${isGlitching ? 'glitch-effect' : 'glitch-text-gradient'} bg-clip-text text-transparent font-extrabold transition-all duration-300 inline-block`}
                                                        data-text={isGlitching ? glitchText : currentWord}
                                                    >
                                                        {isGlitching ? glitchText : currentWord}
                                                    </span>
                                                </span>
                                            {' '}antes de comprar
                                        </h1>
                                        <p className="text-base text-gray-600 leading-relaxed">
                                            Con expertos certificados que verifican cada detalle antes de tu compra.
                                        </p>
                                </div>
                            </div>
                            
                            {/* Versión desktop - mantener original */}
                            <div className="hidden lg:block space-y-4 lg:space-y-5">
                                {/* Badge/Tag optimizado para desktop - Diseño Premium */}
                                <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white border border-gray-100 shadow-[0_2px_10px_rgba(59,130,246,0.1)] hover:shadow-[0_4px_15px_rgba(59,130,246,0.15)] hover:-translate-y-0.5 transition-all duration-300 group cursor-default">
                                    <span className="text-sm font-medium text-gray-600">
                                        Servicios profesionales desde <span className="text-lg font-bold text-gray-900 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-800">25€</span>
                                    </span>
                                </div>
                                
                                {/* Título desktop */}
                                <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 leading-[1.1] tracking-tight">
                                    <div className="block whitespace-nowrap">
                                        Inspecciona tu{' '}
                                        <span className="relative inline-block min-w-[120px] lg:min-w-[140px] xl:min-w-[160px] text-left">
                                            <span 
                                                className={`${isGlitching ? 'glitch-effect' : 'glitch-text-gradient'} bg-clip-text text-transparent font-extrabold transition-all duration-300 inline-block`}
                                                data-text={isGlitching ? glitchText : currentWord}
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
                            
                            {/* Buscador estilo Airbnb - Desktop */}
                            <div className="hidden lg:block mt-8 relative z-50">
                                <div className="bg-white rounded-full shadow-xl border border-gray-200 flex items-center hover:shadow-2xl transition-shadow relative z-50">
                                    {/* Tipo de servicio */}
                                    <div className="relative flex-shrink-0 service-type-dropdown z-50">
                                        <button
                                            onClick={() => {
                                                setIsCategoryOpen(false);
                                                setIsServiceTypeOpen(!isServiceTypeOpen);
                                            }}
                                            className="px-6 py-6 text-left hover:bg-gray-50 rounded-l-full transition-colors min-w-[200px]"
                                        >
                                            <div className="text-xs font-medium text-gray-700 mb-0.5">Tipo de servicio</div>
                                            <div className={searchForm.serviceTypeId ? 'text-sm text-gray-900 font-medium' : 'text-sm text-gray-500'}>
                                                {searchForm.serviceTypeId 
                                                    ? serviceTypes.find(st => st.id === searchForm.serviceTypeId)?.name || 'Seleccionar'
                                                    : 'Seleccionar'}
                                            </div>
                                        </button>
                                        {isServiceTypeOpen && (
                                            <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-2xl shadow-2xl z-[200] max-h-96 overflow-y-auto">
                                                {serviceTypesLoading ? (
                                                    <div className="px-5 py-4 text-sm text-gray-500">Cargando...</div>
                                                ) : serviceTypes.length > 0 ? (
                                                    serviceTypes.map((st) => (
                                                        <button
                                                            key={st.id}
                                                            onClick={() => {
                                                                setSearchForm({...searchForm, serviceTypeId: st.id});
                                                                setIsServiceTypeOpen(false);
                                                            }}
                                                            className="w-full px-5 py-4 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                                                        >
                                                            <div className="font-medium text-gray-900">{st.name}</div>
                                                            {st.description && (
                                                                <div className="text-xs text-gray-500 mt-1">{st.description}</div>
                                                            )}
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="px-5 py-4 text-sm text-gray-500">No hay tipos disponibles</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="w-px h-12 bg-gray-200" />
                                    
                                    {/* Categoría */}
                                    <div className="relative flex-shrink-0 category-dropdown z-50">
                                        <button
                                            onClick={() => {
                                                setIsServiceTypeOpen(false);
                                                setIsCategoryOpen(!isCategoryOpen);
                                            }}
                                            className="px-4 py-6 text-left hover:bg-gray-50 transition-colors min-w-[100px]"
                                        >
                                            <div className="text-xs font-medium text-gray-700 mb-0.5">Categoría</div>
                                            <div className={searchForm.categoryId ? 'text-sm text-gray-900 font-medium' : 'text-sm text-gray-500'}>
                                                {searchForm.categoryId 
                                                    ? categories.find(c => c.id === searchForm.categoryId)?.name || 'Seleccionar'
                                                    : 'Seleccionar'}
                                            </div>
                                        </button>
                                        {isCategoryOpen && (
                                            <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-gray-200 rounded-2xl shadow-2xl z-[200] max-h-96 overflow-y-auto">
                                                {categories.length > 0 ? (
                                                    categories.map((cat) => (
                                                        <button
                                                            key={cat.id}
                                                            onClick={() => {
                                                                setSearchForm({...searchForm, categoryId: cat.id});
                                                                setIsCategoryOpen(false);
                                                            }}
                                                            className="w-full px-5 py-4 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 flex items-center gap-3"
                                                        >
                                                            <CategoryImage categoryName={cat.name} size="sm" />
                                                            <div className="font-medium text-gray-900">{cat.name}</div>
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="px-5 py-4 text-sm text-gray-500">No hay categorías disponibles</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="w-px h-12 bg-gray-200" />
                                    
                                    {/* URL del anuncio */}
                                    <div className="flex-1 min-w-0">
                                        <div className="px-5 py-6">
                                            <div className="text-[10px] font-medium text-gray-700 mb-0.5">URL del anuncio <span className="text-gray-400 font-normal">(opcional)</span></div>
                                            <div className="relative">
                                                <LinkIcon className="absolute left-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                                <input
                                                    type="text"
                                                    placeholder="Pega la URL del anuncio"
                                                    value={searchForm.adUrl}
                                                    onClick={() => setIsUrlDialogOpen(true)}
                                                    readOnly
                                                    className="w-full pl-5 pr-2 text-xs text-gray-900 placeholder-gray-500 bg-transparent border-0 focus:outline-none cursor-pointer truncate"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Dialog para URL */}
                                    <Dialog open={isUrlDialogOpen} onOpenChange={setIsUrlDialogOpen}>
                                        <DialogContent className="sm:max-w-[420px] rounded-3xl p-6">
                                            <DialogHeader className="text-left pb-3">
                                                <DialogTitle className="text-lg font-semibold text-gray-900">URL del anuncio</DialogTitle>
                                                <DialogDescription className="text-xs text-gray-500 mt-1">
                                                    Opcional
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-3">
                                                <div className="relative">
                                                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                    <input
                                                        type="url"
                                                        placeholder="https://..."
                                                    value={searchForm.adUrl}
                                                    onChange={(e) => setSearchForm({...searchForm, adUrl: e.target.value})}
                                                        className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50 focus:bg-white"
                                                        autoFocus
                                                />
                                            </div>
                                        </div>
                                            <div className="mt-4 flex justify-end gap-2 pt-3 border-t border-gray-100">
                                                {searchForm.adUrl && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setSearchForm({...searchForm, adUrl: ''})}
                                                        className="px-4 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors"
                                                    >
                                                        Limpiar
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => setIsUrlDialogOpen(false)}
                                                    className="px-5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-full transition-colors shadow-sm"
                                                >
                                                    Guardar
                                                </button>
                                    </div>
                                        </DialogContent>
                                    </Dialog>
                                    
                                    <div className="w-px h-12 bg-gray-200" />
                                    
                                    {/* Botón buscar - integrado en el contenedor */}
                                    <div className="flex-shrink-0 px-2">
                                    <button
                                        onClick={handleSearch}
                                            className="bg-[#0066CC] hover:bg-[#0052A3] text-white rounded-full w-11 h-11 transition-colors shadow-md hover:shadow-lg flex items-center justify-center"
                                    >
                                            <Search className="w-4 h-4" />
                                    </button>
                                    </div>
                                </div>
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
                </div>
                </div>
            </div>

            {/* Sección "Cómo funciona" - visible solo en desktop */}
            <div className="hidden lg:block py-20 bg-gradient-to-b from-white to-gray-50/50 relative z-0">
                <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
                    {/* Header */}
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">
                            ¿Cómo funciona?
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                            Contrata un experto verificado en 3 pasos simples y protege tu inversión
                        </p>
                    </div>

                    {/* Steps */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
                        {/* Step 1 */}
                        <div className="relative group">
                            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-xl hover:border-blue-100 transition-all duration-300 h-full">
                                {/* Number Badge */}
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 text-blue-600 font-bold text-xl mb-6 group-hover:scale-110 transition-transform">
                                    1
                                </div>
                                
                                {/* Icon */}
                                <div className="mb-6">
                                    <Search className="w-12 h-12 text-blue-600" />
                                </div>
                                
                                {/* Content */}
                                <h3 className="text-xl font-bold text-gray-900 mb-3">
                                    Encuentra tu experto
                                </h3>
                                <p className="text-gray-600 leading-relaxed">
                                    Introduce la URL del anuncio y selecciona tu categoría. Busca entre expertos verificados cerca de ti.
                                </p>
                            </div>
                            
                            {/* Connector Arrow */}
                            <div className="hidden md:block absolute top-1/2 -right-6 transform -translate-y-1/2 z-10">
                                <svg className="w-12 h-12 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div className="relative group">
                            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-xl hover:border-blue-100 transition-all duration-300 h-full">
                                {/* Number Badge */}
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 text-blue-600 font-bold text-xl mb-6 group-hover:scale-110 transition-transform">
                                    2
                                </div>
                                
                                {/* Icon */}
                                <div className="mb-6">
                                    <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                
                                {/* Content */}
                                <h3 className="text-xl font-bold text-gray-900 mb-3">
                                    Reserva y paga seguro
                                </h3>
                                <p className="text-gray-600 leading-relaxed">
                                    Elige fecha y hora. Paga de forma segura con Stripe. Tu dinero queda protegido hasta que confirmes el servicio.
                                </p>
                            </div>
                            
                            {/* Connector Arrow */}
                            <div className="hidden md:block absolute top-1/2 -right-6 transform -translate-y-1/2 z-10">
                                <svg className="w-12 h-12 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="relative group">
                            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-xl hover:border-blue-100 transition-all duration-300 h-full">
                                {/* Number Badge */}
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 text-blue-600 font-bold text-xl mb-6 group-hover:scale-110 transition-transform">
                                    3
                                </div>
                                
                                {/* Icon */}
                                <div className="mb-6">
                                    <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                
                                {/* Content */}
                                <h3 className="text-xl font-bold text-gray-900 mb-3">
                                    Recibe tu informe
                                </h3>
                                <p className="text-gray-600 leading-relaxed">
                                    El experto realiza la inspección y te entrega un informe completo con fotos y vídeos. Compra con confianza.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* CTA inferior */}
                    <div className="text-center mt-16">
                        <button
                            onClick={() => {
                                const formSection = document.getElementById('form-section');
                                if (formSection) {
                                    formSection.scrollIntoView({ behavior: 'smooth' });
                                }
                            }}
                            className="inline-flex items-center gap-2 bg-gray-900 text-white font-semibold px-8 py-4 rounded-xl hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 group"
                        >
                            <span>Comenzar ahora</span>
                            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                /* Efecto glitch profesional moderno */
                .glitch-effect {
                    position: relative;
                    animation: glitch 0.3s ease-in-out;
                }
                
                .glitch-effect::before,
                .glitch-effect::after {
                    content: attr(data-text);
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    opacity: 0.8;
                }
                
                .glitch-effect::before {
                    color: #ff0080;
                    transform: translate(-2px, -2px);
                    clip-path: polygon(0 0, 100% 0, 100% 45%, 0 45%);
                    animation: glitch-before 0.3s ease-in-out;
                }
                
                .glitch-effect::after {
                    color: #00ffff;
                    transform: translate(2px, 2px);
                    clip-path: polygon(0 55%, 100% 55%, 100% 100%, 0 100%);
                    animation: glitch-after 0.3s ease-in-out;
                }
                
                @keyframes glitch {
                    0% { 
                        transform: translate(0);
                        filter: hue-rotate(0deg);
                    }
                    10% { 
                        transform: translate(-1px, 1px);
                        filter: hue-rotate(90deg);
                    }
                    20% { 
                        transform: translate(1px, -1px);
                        filter: hue-rotate(180deg);
                    }
                    30% { 
                        transform: translate(-1px, -1px);
                        filter: hue-rotate(270deg);
                    }
                    40% { 
                        transform: translate(1px, 1px);
                        filter: hue-rotate(360deg);
                    }
                    50% { 
                        transform: translate(0);
                        filter: hue-rotate(0deg);
                    }
                    100% { 
                        transform: translate(0);
                        filter: hue-rotate(0deg);
                    }
                }
                
                @keyframes glitch-before {
                    0% { 
                        transform: translate(-2px, -2px);
                        clip-path: polygon(0 0, 100% 0, 100% 45%, 0 45%);
                    }
                    25% { 
                        transform: translate(-3px, -1px);
                        clip-path: polygon(0 0, 100% 0, 100% 40%, 0 40%);
                    }
                    50% { 
                        transform: translate(-1px, -3px);
                        clip-path: polygon(0 0, 100% 0, 100% 50%, 0 50%);
                    }
                    75% { 
                        transform: translate(-2px, -2px);
                        clip-path: polygon(0 0, 100% 0, 100% 45%, 0 45%);
                    }
                    100% { 
                        transform: translate(-2px, -2px);
                        clip-path: polygon(0 0, 100% 0, 100% 45%, 0 45%);
                    }
                }
                
                @keyframes glitch-after {
                    0% { 
                        transform: translate(2px, 2px);
                        clip-path: polygon(0 55%, 100% 55%, 100% 100%, 0 100%);
                    }
                    25% { 
                        transform: translate(3px, 1px);
                        clip-path: polygon(0 60%, 100% 60%, 100% 100%, 0 100%);
                    }
                    50% { 
                        transform: translate(1px, 3px);
                        clip-path: polygon(0 50%, 100% 50%, 100% 100%, 0 100%);
                    }
                    75% { 
                        transform: translate(2px, 2px);
                        clip-path: polygon(0 55%, 100% 55%, 100% 100%, 0 100%);
                    }
                    100% { 
                        transform: translate(2px, 2px);
                        clip-path: polygon(0 55%, 100% 55%, 100% 100%, 0 100%);
                    }
                }
                
                /* Gradiente profesional moderno */
                .glitch-text-gradient {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    background-clip: text;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-size: 200% 200%;
                    animation: gradientShift 3s ease-in-out infinite;
                }
                
                @keyframes gradientShift {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
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
                
                /* Animación de rotación lenta para el globo */
                @keyframes spin-slow {
                    from {
                        transform: rotate(0deg);
                    }
                    to {
                        transform: rotate(360deg);
                    }
                }
                .animate-spin-slow {
                    animation: spin-slow 20s linear infinite;
                }
                
                @keyframes pulse-slow {
                    0%, 100% { opacity: 0.6; transform: scale(1); }
                    50% { opacity: 0.3; transform: scale(1.1); }
                }
                .animate-pulse-slow {
                    animation: pulse-slow 8s ease-in-out infinite;
                }
                
                /* Animaciones modernas para el banner */
                @keyframes gradient-shift {
                    0%, 100% {
                        background-position: 0% 50%;
                    }
                    50% {
                        background-position: 100% 50%;
                    }
                }
                .animate-gradient-shift {
                    background-size: 200% 200%;
                    animation: gradient-shift 8s ease infinite;
                }
                
                @keyframes float {
                    0%, 100% {
                        transform: translateY(0px) translateX(0px);
                    }
                    33% {
                        transform: translateY(-20px) translateX(10px);
                    }
                    66% {
                        transform: translateY(-10px) translateX(-10px);
                    }
                }
                .animate-float {
                    animation: float 6s ease-in-out infinite;
                }
                .animate-float-delayed {
                    animation: float 8s ease-in-out infinite;
                    animation-delay: 2s;
                }
                
                @keyframes fade-in-up {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.6s ease-out;
                }
                .animate-fade-in-up-delayed {
                    animation: fade-in-up 0.8s ease-out 0.2s both;
                }
                .animate-fade-in-up-delayed-2 {
                    animation: fade-in-up 1s ease-out 0.4s both;
                }
                .animate-fade-in-up-delayed-3 {
                    animation: fade-in-up 1.2s ease-out 0.6s both;
                }
                
                @keyframes gradient-text {
                    0%, 100% {
                        background-position: 0% 50%;
                    }
                    50% {
                        background-position: 100% 50%;
                    }
                }
                .animate-gradient-text {
                    background-size: 200% 200%;
                    animation: gradient-text 3s ease infinite;
                }
                
                @keyframes underline {
                    0% {
                        transform: scaleX(0);
                    }
                    100% {
                        transform: scaleX(1);
                    }
                }
                .animate-underline {
                    animation: underline 1s ease-out 1.5s both;
                }
                
                /* Shimmer animation para skeleton - efecto moderno y suave */
                @keyframes shimmer {
                    0% {
                        background-position: -2000px 0;
                    }
                    100% {
                        background-position: 2000px 0;
                    }
                }
                
                .shimmer-animation {
                    position: relative;
                    overflow: hidden;
                }
                
                .shimmer-animation::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    z-index: 1;
                    background: linear-gradient(
                        90deg,
                        transparent 0%,
                        rgba(255, 255, 255, 0.5) 20%,
                        rgba(255, 255, 255, 0.7) 40%,
                        rgba(255, 255, 255, 0.5) 60%,
                        transparent 80%,
                        transparent 100%
                    );
                    background-size: 2000px 100%;
                    animation: shimmer 2.5s infinite ease-in-out;
                    pointer-events: none;
                }
                
                .shimmer-delay-1 {
                    animation-delay: 0.15s;
                }
                
                .shimmer-delay-2 {
                    animation-delay: 0.3s;
                }
                
                .shimmer-delay-3 {
                    animation-delay: 0.45s;
                }
                
                /* Ocultar botones de navegación del widget de Elfsight */
                .hide-widget-navigation button[aria-label*="Previous"],
                .hide-widget-navigation button[aria-label*="Next"],
                .hide-widget-navigation button[aria-label*="Anterior"],
                .hide-widget-navigation button[aria-label*="Siguiente"],
                .hide-widget-navigation .elfsight-app button[class*="arrow"],
                .hide-widget-navigation .elfsight-app button[class*="prev"],
                .hide-widget-navigation .elfsight-app button[class*="next"],
                .hide-widget-navigation .elfsight-app [class*="navigation"],
                .hide-widget-navigation .elfsight-app [class*="arrow"],
                .hide-widget-navigation .elfsight-app [class*="prev"],
                .hide-widget-navigation .elfsight-app [class*="next"],
                .hide-widget-navigation .elfsight-app [class*="slider-control"],
                .hide-widget-navigation .elfsight-app [class*="carousel-button"],
                .hide-widget-navigation .elfsight-app [class*="nav-button"],
                .hide-widget-navigation .elfsight-app [class*="swiper-button"] {
                    display: none !important;
                    visibility: hidden !important;
                    opacity: 0 !important;
                    pointer-events: none !important;
                }
                
                /* Animaciones modernas 2025 */
                @keyframes slide-down {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-slide-down {
                    animation: slide-down 0.3s ease-out;
                }
                
                @keyframes gradient-shift {
                    0%, 100% {
                        background-position: 0% 50%;
                    }
                    50% {
                        background-position: 100% 50%;
                    }
                }
                .animate-gradient-shift {
                    animation: gradient-shift 3s ease infinite;
                }
                
                /* Efecto de brillo en botones */
                @keyframes shine {
                    0% {
                        transform: translateX(-100%);
                    }
                    100% {
                        transform: translateX(100%);
                    }
                }
                
                /* Mejoras en glassmorphism */
                .backdrop-blur-xl {
                    backdrop-filter: blur(16px);
                    -webkit-backdrop-filter: blur(16px);
                }
                
                /* Animación de entrada mejorada */
                @keyframes fade-in-up-smooth {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .animate-fade-in-up {
                    animation: fade-in-up-smooth 0.8s ease-out;
                }
                
                .animate-fade-in-up-delayed {
                    animation: fade-in-up-smooth 0.8s ease-out 0.2s both;
                }
                
                .animate-fade-in-up-delayed-2 {
                    animation: fade-in-up-smooth 0.8s ease-out 0.4s both;
                }
                
                .animate-fade-in-up-delayed-3 {
                    animation: fade-in-up-smooth 0.8s ease-out 0.6s both;
                }
                
                /* Efecto de hover mejorado para cards */
                .hover\:shadow-3xl:hover {
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
                }
            `}</style>
        </div>
    );
};

export default HomePresentation;

