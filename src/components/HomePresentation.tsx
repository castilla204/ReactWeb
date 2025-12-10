import { useState, useEffect } from 'react';
import { Car, Home, Bike, Search, ChevronDown, Link as LinkIcon, FolderTree } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { GoogleAuth } from './GoogleAuth';
import { useCategories } from '../contexts/CategoryContext';
import { useServiceTypes } from '../hooks/useServiceTypes';
import { useNavigate } from 'react-router-dom';

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
    const [isReviewsLoading, setIsReviewsLoading] = useState(true);
    
    // Estado del buscador estilo Airbnb
    const [searchForm, setSearchForm] = useState({
        serviceTypeId: null as number | null,
        categoryId: null as number | null,
        adUrl: '',
    });
    
    const [isServiceTypeOpen, setIsServiceTypeOpen] = useState(false);
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    
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
        
        // Handle script errors (including APP_VIEWS_LIMIT_REACHED)
        script.onerror = () => {
            console.warn('Elfsight widget script failed to load. This may be due to platform limitations.');
            setIsReviewsLoading(false);
        };
        
        // Listen for Elfsight platform errors
        const handlePlatformError = (event: ErrorEvent) => {
            if (event.message && event.message.includes('APP_VIEWS_LIMIT_REACHED')) {
                console.warn('Elfsight widget limit reached. Widget will not be displayed.');
                setIsReviewsLoading(false);
                // Remove the widget container if it fails
                const mountPoint = document.getElementById('widget-mount-point');
                if (mountPoint && widgetContainer.parentNode === mountPoint) {
                    mountPoint.removeChild(widgetContainer);
                }
            }
        };
        
        window.addEventListener('error', handlePlatformError);
        
        const widgetDiv = document.createElement('div');
        widgetDiv.className = 'elfsight-app-bcc2528d-c48e-48d1-b03d-f282be8b8c32';
        widgetDiv.setAttribute('data-elfsight-app-lazy', '');
        widgetContainer.appendChild(script);
        widgetContainer.appendChild(widgetDiv);
        const mountPoint = document.getElementById('widget-mount-point');
        if (mountPoint) {
            mountPoint.appendChild(widgetContainer);
        }

        // Detectar cuando el widget está cargado
        let checkCount = 0;
        const maxChecks = 100; // Máximo 10 segundos (100 * 100ms)
        
        const checkWidgetLoaded = () => {
            checkCount++;
            const widgetElement = widgetContainer.querySelector('.elfsight-app-bcc2528d-c48e-48d1-b03d-f282be8b8c32');
            const hasContent = widgetElement && (
                widgetElement.children.length > 0 || 
                widgetElement.innerHTML.trim().length > 0 ||
                widgetElement.offsetHeight > 0
            );
            
            // Check for error messages in the widget
            const hasError = widgetElement && (
                widgetElement.textContent?.includes('APP_VIEWS_LIMIT_REACHED') ||
                widgetElement.textContent?.includes("can't be initialized")
            );
            
            if (hasError) {
                console.warn('Elfsight widget initialization error detected.');
                setIsReviewsLoading(false);
                return;
            }
            
            if (hasContent) {
                // Esperar un frame más para asegurar que el contenido está renderizado
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        setIsReviewsLoading(false);
                    });
                });
            } else if (checkCount < maxChecks) {
                setTimeout(checkWidgetLoaded, 100);
            } else {
                // Si no se carga después de 10 segundos, ocultar skeleton
                setIsReviewsLoading(false);
            }
        };

        // Esperar un poco antes de empezar a verificar (dar tiempo a que el script se cargue)
        setTimeout(checkWidgetLoaded, 1000);

        // Limpieza al desmontar el componente
        return () => {
            clearInterval(interval);
            window.removeEventListener('error', handlePlatformError);
            const mountPoint = document.getElementById('widget-mount-point');
            if (mountPoint && widgetContainer.parentNode === mountPoint) {
                mountPoint.removeChild(widgetContainer);
            }
        };
    }, []);

    return (
        <div className="relative w-full h-screen lg:h-auto bg-background overflow-hidden">
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

            {/* Hero móvil fullscreen - estilo Bolt */}
            <div className="lg:hidden absolute inset-0 z-20">
                <div className="relative h-full flex flex-col">
                    <div className="absolute inset-0">
                        <img 
                            src="https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&q=80" 
                            alt="Inspección profesional"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/90"></div>
                    </div>
                    <div className="relative z-10 flex-1 flex flex-col justify-end px-5 pb-8">
                        <div className="mb-3">
                            <span className="inline-flex items-center gap-1.5 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Inspección en 48h
                            </span>
                        </div>
                        <h1 className="text-[28px] font-bold text-white leading-[1.1] mb-3">
                            No compres a ciegas.{' '}
                            <span className="text-blue-400">Inspecciona</span>{' '}
                            antes.
                        </h1>
                        <p className="text-sm text-gray-300 mb-5">
                            Mecánicos profesionales revisan tu{' '}
                            <span className="text-white font-medium">{currentWord}</span>{' '}
                            y te envían un informe completo.
                        </p>
                        <button
                            onClick={onScrollToForm}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl text-base"
                        >
                            Calcular precio
                        </button>
                        <div className="flex items-center justify-between mt-5 pt-5 border-t border-white/10">
                            <div className="flex items-center gap-1.5">
                                <div className="flex">
                                    {[1,2,3,4,5].map(i => (
                                        <svg key={i} className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                    ))}
                                </div>
                                <span className="text-white font-semibold text-xs">4.9</span>
                            </div>
                            <div className="text-gray-400 text-xs">+2.500 inspecciones</div>
                            <div className="flex items-center gap-1 text-green-400 text-xs font-medium">
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span>Garantizado</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="relative z-10 w-full h-full lg:h-auto px-4 sm:px-6 md:px-12 lg:px-16 py-8 sm:py-12 md:py-16 lg:py-20 flex flex-col lg:block">
                {/* Contenido principal centrado verticalmente en móvil, normal en desktop */}
                <div className="flex-1 lg:flex-none flex items-center lg:block">
                    <div className="max-w-6xl mx-auto w-full">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                        <div className="space-y-6 lg:space-y-7 text-left lg:text-left">
                                {/* Versión móvil - diseño limpio y profesional */}
                                <div className="lg:hidden space-y-6">
                                    {/* Título simple y claro */}
                                    <div>
                                        <h1 className="text-3xl font-bold text-gray-900 leading-tight mb-3">
                                                Inspecciona tu{' '}
                                                <span className="relative inline-block">
                                                    <span 
                                                        className={`${isGlitching ? 'glitch-effect' : 'glitch-text-gradient'} bg-clip-text text-transparent font-extrabold transition-all duration-300`}
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
                                {/* Badge/Tag optimizado para desktop */}
                                <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium border border-blue-100">
                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                    <span>Búsqueda inteligente de vehículos</span>
                                </div>
                                
                                {/* Título desktop */}
                                <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 leading-[1.1] tracking-tight">
                                    <div className="block whitespace-nowrap">
                                        Inspecciona tu{' '}
                                        <span className="relative inline-block">
                                            <span 
                                                className={`${isGlitching ? 'glitch-effect' : 'glitch-text-gradient'} bg-clip-text text-transparent font-extrabold transition-all duration-300`}
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
                            
                                {/* Buscador estilo Airbnb - Móvil */}
                                <div className="lg:hidden mt-6">
                                    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-4">
                                        <div className="space-y-3">
                                            {/* Tipo de servicio */}
                                            <div className="relative service-type-dropdown">
                                                <label className="block text-xs font-medium text-gray-700 mb-1.5">Tipo de servicio</label>
                                                <button
                                                    onClick={() => setIsServiceTypeOpen(!isServiceTypeOpen)}
                                                    className="w-full flex items-center justify-between px-4 py-3 text-left bg-gray-50 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                                                >
                                                    <span className={searchForm.serviceTypeId ? 'text-gray-900' : 'text-gray-500'}>
                                                        {searchForm.serviceTypeId 
                                                            ? serviceTypes.find(st => st.id === searchForm.serviceTypeId)?.name || 'Seleccionar'
                                                            : 'Seleccionar tipo'}
                                                    </span>
                                                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isServiceTypeOpen ? 'rotate-180' : ''}`} />
                                                </button>
                                                {isServiceTypeOpen && (
                                                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                                        {serviceTypesLoading ? (
                                                            <div className="px-4 py-3 text-sm text-gray-500">Cargando...</div>
                                                        ) : serviceTypes.length > 0 ? (
                                                            serviceTypes.map((st) => (
                                                                <button
                                                                    key={st.id}
                                                                    onClick={() => {
                                                                        setSearchForm({...searchForm, serviceTypeId: st.id});
                                                                        setIsServiceTypeOpen(false);
                                                                    }}
                                                                    className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                                                                >
                                                                    <div className="font-medium text-gray-900">{st.name}</div>
                                                                    {st.description && (
                                                                        <div className="text-xs text-gray-500 mt-0.5">{st.description}</div>
                                                                    )}
                                                                </button>
                                                            ))
                                                        ) : (
                                                            <div className="px-4 py-3 text-sm text-gray-500">No hay tipos disponibles</div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {/* Categoría */}
                                            <div className="relative category-dropdown">
                                                <label className="block text-xs font-medium text-gray-700 mb-1.5">Categoría</label>
                                                <button
                                                    onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                                                    className="w-full flex items-center justify-between px-4 py-3 text-left bg-gray-50 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                                                >
                                                    <span className={searchForm.categoryId ? 'text-gray-900' : 'text-gray-500'}>
                                                        {searchForm.categoryId 
                                                            ? categories.find(c => c.id === searchForm.categoryId)?.name || 'Seleccionar'
                                                            : 'Seleccionar categoría'}
                                                    </span>
                                                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`} />
                                                </button>
                                                {isCategoryOpen && (
                                                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                                        {categories.length > 0 ? (
                                                            categories.map((cat) => (
                                                                <button
                                                                    key={cat.id}
                                                                    onClick={() => {
                                                                        setSearchForm({...searchForm, categoryId: cat.id});
                                                                        setIsCategoryOpen(false);
                                                                    }}
                                                                    className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3"
                                                                >
                                                                    <CategoryImage categoryName={cat.name} size="sm" />
                                                                    <div className="font-medium text-gray-900">{cat.name}</div>
                                                                </button>
                                                            ))
                                                        ) : (
                                                            <div className="px-4 py-3 text-sm text-gray-500">No hay categorías disponibles</div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {/* URL del anuncio */}
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1.5">URL del anuncio</label>
                                                <div className="relative">
                                                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                    <input
                                                        type="text"
                                                        placeholder="Pega la URL del anuncio"
                                                        value={searchForm.adUrl}
                                                        onChange={(e) => setSearchForm({...searchForm, adUrl: e.target.value})}
                                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    />
                                                </div>
                                            </div>
                                            
                                            {/* Botón buscar */}
                                            <button
                                                onClick={handleSearch}
                                                className="w-full bg-[#0066CC] hover:bg-[#0052A3] text-white font-semibold py-3.5 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                                            >
                                                <Search className="w-5 h-5" />
                                                <span>Buscar</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            
                            {/* Buscador estilo Airbnb - Desktop */}
                            <div className="hidden lg:block mt-8">
                                <div className="bg-white rounded-full shadow-xl border border-gray-200 flex items-center overflow-visible hover:shadow-2xl transition-shadow">
                                    {/* Tipo de servicio */}
                                    <div className="relative flex-shrink-0 service-type-dropdown">
                                        <button
                                            onClick={() => setIsServiceTypeOpen(!isServiceTypeOpen)}
                                            className="px-6 py-4 text-left hover:bg-gray-50 rounded-l-full transition-colors min-w-[200px]"
                                        >
                                            <div className="text-xs font-medium text-gray-700 mb-0.5">Tipo de servicio</div>
                                            <div className={searchForm.serviceTypeId ? 'text-sm text-gray-900 font-medium' : 'text-sm text-gray-500'}>
                                                {searchForm.serviceTypeId 
                                                    ? serviceTypes.find(st => st.id === searchForm.serviceTypeId)?.name || 'Seleccionar'
                                                    : 'Seleccionar'}
                                            </div>
                                        </button>
                                        {isServiceTypeOpen && (
                                            <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 max-h-96 overflow-y-auto">
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
                                    
                                    <div className="w-px h-8 bg-gray-200" />
                                    
                                    {/* Categoría */}
                                    <div className="relative flex-shrink-0 category-dropdown">
                                        <button
                                            onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                                            className="px-6 py-4 text-left hover:bg-gray-50 transition-colors min-w-[180px]"
                                        >
                                            <div className="text-xs font-medium text-gray-700 mb-0.5">Categoría</div>
                                            <div className={searchForm.categoryId ? 'text-sm text-gray-900 font-medium' : 'text-sm text-gray-500'}>
                                                {searchForm.categoryId 
                                                    ? categories.find(c => c.id === searchForm.categoryId)?.name || 'Seleccionar'
                                                    : 'Seleccionar'}
                                            </div>
                                        </button>
                                        {isCategoryOpen && (
                                            <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 max-h-96 overflow-y-auto">
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
                                    
                                    <div className="w-px h-8 bg-gray-200" />
                                    
                                    {/* URL del anuncio */}
                                    <div className="flex-1 min-w-0">
                                        <div className="px-6 py-4">
                                            <div className="text-xs font-medium text-gray-700 mb-0.5">URL del anuncio</div>
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
                                    <button
                                        onClick={handleSearch}
                                        className="flex-shrink-0 bg-[#0066CC] hover:bg-[#0052A3] text-white rounded-full p-3.5 m-2 transition-colors shadow-md hover:shadow-lg"
                                    >
                                        <Search className="w-5 h-5" />
                                    </button>
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
                    
                {/* Widget de reseñas - fuera del viewport inicial en móvil, normal en desktop */}
                    <div className="mt-4 lg:mt-24">
                    <div className="w-full lg:max-w-[calc(80rem-2rem)] lg:mx-auto px-4 md:px-6 lg:px-8">
                        {/* Contenedor con altura mínima para evitar saltos */}
                        <div className="relative min-h-[240px]">
                            {/* Skeleton loader mientras carga - posición absoluta */}
                            {isReviewsLoading && (
                                <div className="absolute inset-0 w-full space-y-4 -top-2">
                                    {/* Header skeleton */}
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="h-6 bg-gray-200 rounded-lg w-40 shimmer-animation"></div>
                                        <div className="h-4 bg-gray-200 rounded-lg w-24 shimmer-animation shimmer-delay-1"></div>
                                    </div>
                                    {/* Cards skeleton - horizontal scroll como el widget real */}
                                    <div className="flex gap-4 overflow-x-hidden">
                                        {[1, 2, 3, 4].map((i) => (
                                            <div 
                                                key={i} 
                                                className="flex-shrink-0 w-[320px] bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow"
                                            >
                                                {/* Avatar y nombre */}
                                                <div className="flex items-start gap-3 mb-4">
                                                    <div className="relative flex-shrink-0">
                                                        <div className="w-11 h-11 bg-gray-200 rounded-full shimmer-animation"></div>
                                                        {/* Google G badge skeleton */}
                                                        <div className="absolute -bottom-0.5 -right-0.5 w-4.5 h-4.5 bg-blue-200 rounded-full border-2 border-white shimmer-animation shimmer-delay-2"></div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1.5">
                                                            <div className="h-4 bg-gray-200 rounded-md w-28 shimmer-animation shimmer-delay-1"></div>
                                                            {/* Checkmark skeleton */}
                                                            <div className="w-4 h-4 bg-green-200 rounded-full flex-shrink-0 shimmer-animation shimmer-delay-3"></div>
                                                        </div>
                                                        {/* Timestamp */}
                                                        <div className="h-3 bg-gray-200 rounded w-20 shimmer-animation shimmer-delay-1"></div>
                                                    </div>
                                                </div>
                                                {/* Estrellas */}
                                                <div className="flex gap-1 mb-3">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <div 
                                                            key={star} 
                                                            className="w-4.5 h-4.5 bg-yellow-200 rounded-sm shimmer-animation"
                                                            style={{ 
                                                                animationDelay: `${star * 0.1}s`,
                                                                clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)'
                                                            }}
                                                        ></div>
                                                    ))}
                                                </div>
                                                {/* Texto de la reseña */}
                                                <div className="space-y-2 mb-3">
                                                    <div className="h-3.5 bg-gray-200 rounded-md w-full shimmer-animation"></div>
                                                    <div className="h-3.5 bg-gray-200 rounded-md w-11/12 shimmer-animation shimmer-delay-1"></div>
                                                    <div className="h-3.5 bg-gray-200 rounded-md w-4/5 shimmer-animation shimmer-delay-2"></div>
                                                </div>
                                                {/* Read more link skeleton */}
                                                <div className="h-3 bg-blue-200 rounded w-24 shimmer-animation shimmer-delay-2"></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {/* Widget - se muestra cuando está listo, con opacidad para transición suave */}
                            <div 
                                id="widget-mount-point" 
                                className={`w-full transition-opacity duration-300 ${isReviewsLoading ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                                style={{ minHeight: isReviewsLoading ? '240px' : 'auto' }}
                            >
                            {/* Widget de reseñas se inyectará aquí dinámicamente */}
                            </div>
                        </div>
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
            `}</style>
        </div>
    );
};

export default HomePresentation;

