import { useState, useEffect } from 'react';
import { Search, ChevronDown, Link as LinkIcon, FolderTree, X, MoreHorizontal } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCategories } from '../contexts/CategoryContext';
import { useServiceTypes } from '../hooks/useServiceTypes';
import { useNavigate } from 'react-router-dom';
import { GoogleSignInButton } from './GoogleSignInButton';
import { LoginModal } from './LoginModal';
import SpainCoverageMap from './SpainCoverageMap';
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
import camaraImg from '../media/camarapng.png';

interface HomePresentationProps {
    onScrollToForm: () => void;
}

// Componente para mostrar el icono de la categoría
const CategoryImage: React.FC<{ categoryName: string; size?: 'sm' | 'md' }> = ({ categoryName, size = 'sm' }) => {
    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-10 h-10'
    };

    // Validar que categoryName existe
    if (!categoryName) {
        return (
            <div className={`${sizeClasses[size]} rounded-md bg-gray-100 flex items-center justify-center`}>
                <FolderTree className="w-4 h-4 text-gray-400" />
            </div>
        );
    }

    // Determinar qué imagen usar según el nombre de la categoría
    const categoryNameLower = categoryName.toLowerCase();
    const isMotoAgua = categoryNameLower.includes('moto') && categoryNameLower.includes('agua');
    const isMoto = categoryNameLower.includes('moto') && !isMotoAgua;
    const isCoche = categoryNameLower.includes('coche') || categoryNameLower.includes('vehículo');
    const isCasa = categoryNameLower.includes('inmobiliaria') || categoryNameLower.includes('casa') || categoryNameLower.includes('inmueble');
    const isCamara = categoryNameLower.includes('cámara') || categoryNameLower.includes('camara');

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
    
    if (isCamara) {
        return (
            <img 
                src={camaraImg}
                alt="Cámara"
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
    const { categories, loading: categoriesLoading } = useCategories();
    const { serviceTypes, isLoading: serviceTypesLoading } = useServiceTypes();
    
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
    // 🛡️ Round 16: modal de auth (email/password + OAuth Google/Apple).
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [loginModalInitialTab, setLoginModalInitialTab] = useState<'login' | 'register'>('login');
    
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
        if (window.location.pathname === '/hire' || window.location.pathname === '/') {
            // Si ya estamos en la página, forzar recarga
            window.location.href = '/hire';
        } else {
            navigate('/hire');
        }
    };

    return (
        <div className="relative w-full bg-white">

            {/* Hero móvil — fondo de marca sólido (sin gradientes preset / sin olas / sin copos) */}
            <div data-homepage-hero className="lg:hidden relative min-h-[calc(100dvh-64px)] z-20 flex flex-col bg-brand overflow-hidden">
                <div className="flex-1 flex flex-col justify-center px-5 pt-8 pb-6 relative z-10">
                    <div className="w-full max-w-md mx-auto space-y-7">

                        {/* Eyebrow específico al producto, no genérico */}
                        <div className="inline-flex items-center gap-2 text-sm text-white">
                            <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                            <span>Inspecciones presenciales · informe en 48 h</span>
                            </div>

                        {/* H1 con clamp() para no desbordar S10e/SE; balance para repartir línea */}
                        <div className="space-y-3">
                            <h1 className="font-bold text-white tracking-[-0.02em] [text-wrap:balance] text-[clamp(2rem,8.5vw,2.85rem)] leading-[1.1]">
                                No compres a ciegas.{' '}
                                <span className="text-white font-extrabold">Revisa antes de pagar.</span>
                            </h1>
                            <p className="text-[1.05rem] text-white leading-relaxed [text-wrap:pretty]">
                                Un experto certificado va, verifica el anuncio y te entrega informe antes de que pagues.
                            </p>
                    </div>

                        {/* Estadísticas integradas */}
                        <div className="flex items-center gap-5 text-sm text-white/85 pt-1">
                            <div className="flex items-center gap-1.5">
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 002 2h2.945M15 15v3a2 2 0 01-2 2H5a2 2 0 01-2-2v-3m0-4V9a2 2 0 012-2h2.945M15 5v3a2 2 0 01-2 2H9a2 2 0 00-2 2v1m6-6V5a2 2 0 012-2h2a2 2 0 012 2v1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span><strong className="text-white font-semibold">2.5k+</strong> inspecciones</span>
                                </div>
                                <div className="w-px h-4 bg-white/30"></div>
                                <div className="flex items-center gap-1.5">
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span><strong className="text-white font-semibold">500+</strong> expertos</span>
                            </div>
                        </div>

                        {/* CTA primario móvil — inverso sobre fondo de marca */}
                        <div className="pt-3">
                                <button
                                    onClick={onScrollToForm}
                                className="w-full bg-white hover:bg-white/95 text-brand font-semibold text-base py-3.5 px-6 rounded-lg active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 shadow-xl"
                                >
                                <span>Empezar ahora</span>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                                </button>
                    </div>
                    
                    {/* 🛡️ Round 16: Botón "Iniciar sesión" → abre el LoginModal (Google + Apple + email/password). */}
                                {!isAuthenticated && (
                            <div className="w-full space-y-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setLoginModalInitialTab('login');
                                                setIsLoginModalOpen(true);
                                            }}
                                            className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/30 hover:border-white/50 backdrop-blur-sm font-semibold py-3 px-6 rounded-lg transition-all duration-200 active:scale-[0.98]"
                                        >
                                            Iniciar sesión o crear cuenta
                                        </button>
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
                                    <div key={i} className="w-10 h-10 rounded-full border-2 border-white/30 bg-white/20 backdrop-blur-sm overflow-hidden shadow-sm">
                                    <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" className="w-full h-full object-cover" />
                                </div>
                                        ))}
                                    </div>
                        <div className="text-left">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                    <div className="flex text-yellow-300 text-sm">★★★★★</div>
                                    <span className="text-xs text-white/90 font-medium">4.9</span>
                                </div>
                                <div className="text-xs text-white/80">
                                    <strong className="text-white font-medium">2,500+</strong> clientes satisfechos
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
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm" style={{ overflow: 'visible' }}>
                        {/* Tipo de servicio */}
                        <div className="relative service-type-dropdown border-b border-gray-200" style={{ overflow: 'visible' }}>
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
                                <div className="absolute z-[100] w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto" style={{ position: 'absolute', top: '100%', left: 0, right: 0 }}>
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
                                                <div className="font-medium text-gray-900 text-sm">{st?.name || 'Sin nombre'}</div>
                                                {st?.description && (
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
                        <div className="border-b border-gray-200 pb-4" style={{ overflow: 'visible' }}>
                            <div className="text-xs font-medium text-gray-700 mb-3 px-5 pt-4">Categoría</div>
                            
                            {/* Categorías visibles */}
                            <div className="px-5">
                                <div className="flex flex-wrap gap-2">
                                    {categoriesLoading ? (
                                        <div className="text-sm text-gray-500">Cargando categorías...</div>
                                    ) : categories && categories.length > 0 ? (
                                        categories.slice(0, 4).map((cat) => (
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
                                        ))
                                    ) : (
                                        <div className="text-sm text-gray-500">No hay categorías disponibles</div>
                                    )}
                                    
                                    {/* Botón "Ver más" si hay más categorías */}
                                    {!categoriesLoading && categories && categories.length > 4 && (
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
                                        {categoriesLoading ? (
                                            <div className="text-center py-8 text-sm text-gray-500">Cargando categorías...</div>
                                        ) : categories && categories.length > 0 ? (
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
                                        ) : (
                                            <div className="text-center py-8 text-sm text-gray-500">No hay categorías disponibles</div>
                                        )}
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
                        
                        {/* CTA primario del formulario — alineado con el sistema de marca */}
                        <div className="px-5 pb-5 pt-2">
                            <button
                                onClick={handleSearch}
                                className="w-full bg-brand hover:bg-brand-hover text-white font-semibold text-base py-3.5 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-[0_4px_16px_hsl(var(--brand)/0.2)]"
                            >
                                <Search className="w-5 h-5" />
                                <span>Buscar expertos</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Hero Desktop — bloque de marca sólido a la izquierda, foto del oficio a la derecha */}
            <div data-homepage-hero className="relative z-10 w-full hidden lg:flex min-h-[calc(100vh-64px)] items-start justify-center px-0 bg-brand overflow-x-hidden">
                {/* Fondo de marca para el lado izquierdo (sin gradiente preset SaaS) */}
                <div className="absolute inset-0 bg-brand" style={{
                    clipPath: 'polygon(0 0, 62% 0, 58% 100%, 0 100%)'
                }}></div>
                
                {/* Imagen real en el lado derecho con corte diagonal suave */}
                <div className="absolute inset-0 right-0" style={{
                    clipPath: 'polygon(62% 0, 100% 0, 100% 100%, 58% 100%)'
                }}>
                    <img
                        src={new URL('../media/revisioncoche.jpg', import.meta.url).href}
                        alt="Revisión profesional de vehículos"
                        className="w-full h-full"
                        style={{ 
                            objectFit: 'cover',
                            objectPosition: '100% center',
                            width: '140%',
                            height: '100%',
                            transform: 'translateX(10%)'
                        }}
                    />
                    {/* Overlay sutil para integrar la foto con el bloque de marca */}
                    <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--brand))]/25 to-transparent"></div>
                </div>

                {/* Contenido principal - solo desktop */}
                <div className="max-w-7xl mx-auto w-full relative z-10 px-4 sm:px-6 md:px-12 lg:px-16 pt-24 lg:pt-28">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center w-full">
                        {/* Columna izquierda - Contenido */}
                        <div className="space-y-6 lg:space-y-7 text-left flex flex-col justify-center relative z-10">
                            {/* Badge/Tag optimizado para desktop - Diseño Premium */}
                            <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 group cursor-default w-fit">
                                <span className="text-sm font-medium text-white">
                                    Servicios profesionales desde <span className="text-lg font-bold text-white">25€</span>
                                </span>
                            </div>
                            
                            {/* Título desktop - Más grande y centrado */}
                            <h1 className="text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-[1.1] tracking-tight">
                                No compres a ciegas.{' '}
                                <span className="text-white font-extrabold">Revisa antes de pagar.</span>
                            </h1>
                            
                            {/* Descripción desktop */}
                            <p className="text-xl text-white max-w-2xl leading-relaxed font-normal [text-wrap:pretty]">
                                Un experto certificado va, verifica el anuncio y te entrega informe antes de que pagues.
                            </p>
                            
                            {/* 🛡️ Round 17: Botón "Iniciar sesión" desktop → abre el LoginModal (Google + Apple + email/password). */}
                            {!isAuthenticated && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setLoginModalInitialTab('login');
                                        setIsLoginModalOpen(true);
                                    }}
                                    className="text-white/80 hover:text-white text-sm font-medium underline underline-offset-4 transition-colors self-start"
                                >
                                    ¿Ya tienes cuenta? Inicia sesión
                                </button>
                            )}

                            {/* Buscador estilo Airbnb - Desktop */}
                            <div className="mt-6 relative z-50" style={{ overflow: 'visible' }}>
                                <div className="bg-white/95 backdrop-blur-sm rounded-full shadow-2xl border border-white/30 flex items-center hover:shadow-3xl hover:bg-white transition-all relative z-50" style={{ overflow: 'visible' }}>
                                    {/* Tipo de servicio */}
                                    <div className="relative flex-shrink-0 service-type-dropdown z-50" style={{ overflow: 'visible' }}>
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
                                                            <div className="font-medium text-gray-900">{st?.name || 'Sin nombre'}</div>
                                                            {st?.description && (
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
                                    <div className="relative flex-shrink-0 category-dropdown z-50" style={{ overflow: 'visible' }}>
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
                                                {categoriesLoading ? (
                                                    <div className="px-5 py-4 text-sm text-gray-500">Cargando...</div>
                                                ) : categories && categories.length > 0 ? (
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
                                            <div className="text-badge font-medium text-gray-700 mb-0.5">URL del anuncio <span className="text-gray-400 font-normal">(opcional)</span></div>
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
                                            className="bg-brand hover:bg-brand-hover text-white rounded-full w-11 h-11 transition-colors shadow-md hover:shadow-lg flex items-center justify-center"
                                    >
                                            <Search className="w-4 h-4" />
                                    </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Columna derecha - Espacio para la imagen (ya está en el fondo) */}
                        <div className="hidden lg:block relative z-10">
                            {/* Esta columna está vacía porque la imagen está en el fondo absoluto */}
                        </div>
                    </div>
                </div>
            </div>

            {/* Sección: REVISIONES DE COCHE EN ESPAÑA - Con mapa */}
            <div className="relative z-20 w-full py-12 lg:py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
                        {/* Mapa - Responsive */}
                        <div className="w-full lg:w-auto lg:flex-shrink-0 flex justify-center lg:justify-start">
                            <div className="relative w-full max-w-full lg:w-[646.198px] aspect-[646/650] lg:h-[650px]">
                                {/* Fondo circular blanco sutil - Responsive */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-full max-w-[500px] aspect-square bg-white/60 rounded-full blur-2xl"></div>
                                </div>

                                {/* Mapa propio: trazo único en azul de bolígrafo, sin
                                    glassmorphism, sin dependencias remotas. Reemplaza el SVG
                                    del competidor revisario.com (ver PRODUCT.md). */}
                                <SpainCoverageMap className="absolute inset-0" />
                            </div>
                        </div>
                        
                        {/* Texto - Mejorado para móvil */}
                        <div className="flex-1 w-full lg:w-auto text-center lg:text-left space-y-4 lg:space-y-6">
                            <h2 className="text-sm lg:text-lg font-normal text-gray-900 uppercase tracking-wide">
                                REVISIONES DE COCHE EN ESPAÑA
                            </h2>
                            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
                                Estés donde estés, tu revisión está muy cerca
                            </h3>
                            <div className="space-y-3 lg:space-y-4 text-gray-700">
                                <p className="text-sm sm:text-base leading-relaxed">
                                    Contamos con revisores en toda España. Solo dinos dónde está el coche y enviaremos a nuestro experto más cercano.
                                </p>
                                <p className="text-sm sm:text-base leading-relaxed font-medium">
                                    ¡Rápido, fiable y sin complicaciones!
                                </p>
                            </div>
                            <div className="flex justify-center lg:justify-start pt-2">
                                <button
                                    onClick={onScrollToForm}
                                    className="inline-flex items-center gap-2 bg-brand hover:bg-brand-hover text-white font-semibold px-6 py-3 rounded-xl shadow-[0_4px_16px_hsl(var(--brand)/0.2)] hover:shadow-[0_8px_24px_hsl(var(--brand)/0.28)] transition-all duration-200 text-sm sm:text-base"
                                >
                                    Quiero mi revisión
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
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

                @media (prefers-reduced-motion: reduce) {
                    .animate-fade-in-up,
                    .animate-fade-in-up-delayed,
                    .animate-fade-in-up-delayed-2,
                    .animate-fade-in-up-delayed-3,
                    .animate-slide-down {
                        animation: none !important;
                    }
                }
            `}</style>

            {/* 🛡️ Round 16: Modal de autenticación (Google + Apple + email/password + OTP). */}
            <LoginModal
                open={isLoginModalOpen}
                onOpenChange={setIsLoginModalOpen}
                initialTab={loginModalInitialTab}
                onSuccess={() => {
                    // AuthContext.updateUser ya disparó isAuthenticated → la UI re-renderiza sola.
                }}
            />
        </div>
    );
};

export default HomePresentation;