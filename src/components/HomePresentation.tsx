import { useState, useEffect } from 'react';
import { Car, Home, Bike, Search, ChevronDown, Link as LinkIcon, FolderTree, X, MoreHorizontal } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCategories } from '../contexts/CategoryContext';
import { useServiceTypes } from '../hooks/useServiceTypes';
import { useNavigate } from 'react-router-dom';
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

// Google SVG Icon Component
const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
);

// Declaración de tipos para Google Sign-In
declare global {
    interface Window {
        google?: {
            accounts: {
                id: {
                    initialize: (config: any) => void;
                    prompt: () => void;
                };
            };
        };
    }
}

// Componente para botón de inicio de sesión con Google en Homepage
const GoogleSignInButton = () => {
    const [isReady, setIsReady] = useState(false);
    const { setUser } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        // Inicializar Google Auth cuando el componente se monta
        const initGoogleAuth = () => {
            if (window.google?.accounts?.id) {
                const clientId = '61603823707-4vsp43naifci8t893hdc276kkhbvn49a.apps.googleusercontent.com';
                
                window.google.accounts.id.initialize({
                    client_id: clientId,
                    callback: async (response: any) => {
                        try {
                            if (!response.credential) {
                                throw new Error('No credential received from Google');
                            }

                            const { authService } = await import('../services/authService');
                            const result = await authService.googleAuth(response.credential);
                            
                            if (!result.success) {
                                throw new Error('Authentication failed');
                            }

                            setUser(result.user);
                            localStorage.setItem('userData', JSON.stringify(result.user));
                            
                            // Redirigir según el rol
                            const token = authService.getAccessToken();
                            if (token) {
                                const { RoleChecker } = await import('../utils/roleChecker');
                                const userRole = RoleChecker.getUserRole(token);
                                const requiresMfa = RoleChecker.requiresMfa(userRole);
                                
                                if (requiresMfa) {
                                    const { mfaService } = await import('../services/mfaService');
                                    try {
                                        const mfaStatus = await mfaService.getMFAStatus();
                                        if (mfaStatus.isEnabled) {
                                            navigate('/mfa/verify', { state: { returnTo: '/busquedas' } });
                                            return;
                                        }
                                    } catch (error) {
                                        console.error('Error checking MFA status:', error);
                                    }
                                }
                            }
                            
                            navigate('/busquedas');
                        } catch (error) {
                            console.error('Error during Google authentication:', error);
                        }
                    },
                    auto_select: false,
                    cancel_on_tap_outside: false,
                });
                
                setIsReady(true);
            } else {
                // Reintentar después de un delay
                setTimeout(initGoogleAuth, 500);
            }
        };

        // Esperar a que el script de Google se cargue
        if (document.readyState === 'complete') {
            initGoogleAuth();
        } else {
            window.addEventListener('load', initGoogleAuth);
        }

        return () => {
            window.removeEventListener('load', initGoogleAuth);
        };
    }, [setUser, navigate]);

    const handleClick = () => {
        if (!isReady) {
            console.warn('Google Sign-In not ready yet');
            return;
        }

        try {
            // Usar el método prompt() directamente
            if (window.google?.accounts?.id?.prompt) {
                window.google.accounts.id.prompt();
            } else {
                console.error('Google prompt method not available');
            }
        } catch (error) {
            console.error('Error triggering Google Sign-In:', error);
        }
    };

    return (
        <button
            onClick={handleClick}
            disabled={!isReady}
            className="w-full bg-white text-gray-900 font-semibold py-4 px-6 rounded-xl text-base transition-colors border-2 border-gray-200 hover:border-gray-300 active:bg-gray-50 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            <GoogleIcon />
            <span>Iniciar Sesión</span>
        </button>
    );
};

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
            const widgetElement = widgetContainer.querySelector('.elfsight-app-bcc2528d-c48e-48d1-b03d-f282be8b8c32') as HTMLElement;
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
        <div className="relative w-full min-h-[100dvh] lg:min-h-0 lg:h-auto bg-background overflow-hidden">
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

            {/* Hero móvil - Diseño limpio y profesional */}
            <div className="lg:hidden relative min-h-[calc(100dvh-60px)] z-20 bg-white">
                {/* Background sutil */}
                <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-white"></div>
                
                {/* Contenido principal */}
                <div className="relative z-10 px-6 pt-8 pb-6">
                    {/* Badge simple */}
                    <div className="mb-4">
                        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold border border-blue-100">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span>Inspección en 48h</span>
                        </div>
                    </div>
                    
                    {/* Título principal - Limpio y claro */}
                    <h1 className="text-4xl font-bold text-gray-900 leading-tight mb-3">
                        No compres a ciegas
                    </h1>
                    
                    {/* Subtítulo */}
                    <p className="text-lg text-gray-600 leading-relaxed mb-4">
                        Expertos certificados revisan tu{' '}
                        <span className="text-gray-900 font-semibold">{currentWord}</span>
                        {' '}y te envían un informe detallado en menos de 48 horas.
                    </p>
                    
                    {/* Botón principal */}
                    <button
                        onClick={onScrollToForm}
                        className="w-full bg-gray-900 text-white font-semibold py-4 px-6 rounded-xl text-base transition-colors hover:bg-gray-800 active:bg-gray-700 mb-4"
                    >
                        Calcular precio
                    </button>
                    
                    {/* Botón secundario */}
                    {!isAuthenticated && (
                        <GoogleSignInButton />
                    )}
                    
                    {/* Barra de confianza - Simplificada */}
                    <div className="mt-8 pt-6 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="flex">
                                    {[1,2,3,4,5].map(i => (
                                        <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                    ))}
                                </div>
                                <span className="text-gray-900 font-semibold text-sm">4.9</span>
                            </div>
                            <div className="text-gray-600 text-sm">+2.500 inspecciones</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sección de formulario móvil - Diseño limpio */}
            <div id="form-section" className="lg:hidden relative z-10 w-full bg-gray-50 py-8 px-4">
                <div className="max-w-lg mx-auto">
                    {/* Header */}
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            Calcula el precio
                        </h2>
                        <p className="text-sm text-gray-600">
                            Completa el formulario y obtén una cotización personalizada
                        </p>
                    </div>

                    {/* Formulario - Contenedor limpio */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        {/* Tipo de servicio - Estilo Airbnb */}
                        <div className="relative service-type-dropdown border-b border-gray-200">
                            <button
                                onClick={() => {
                                    setIsCategoryOpen(false);
                                    setIsServiceTypeOpen(!isServiceTypeOpen);
                                }}
                                className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex-1">
                                    <div className="text-xs font-semibold text-gray-900 mb-0.5">Tipo de servicio</div>
                                    <div className={searchForm.serviceTypeId ? 'text-sm text-gray-900 font-medium' : 'text-sm text-gray-500'}>
                                        {searchForm.serviceTypeId 
                                            ? serviceTypes.find(st => st.id === searchForm.serviceTypeId)?.name || 'Seleccionar'
                                            : 'Seleccionar'}
                                    </div>
                                </div>
                                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${isServiceTypeOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {isServiceTypeOpen && (
                                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-80 overflow-y-auto">
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
                        
                        {/* Categoría - Estilo Airbnb con chips arriba */}
                        <div className="border-b border-gray-200 pb-4">
                            <div className="text-xs font-semibold text-gray-900 mb-3 px-6 pt-4">Categoría</div>
                            
                            {/* Categorías visibles (primeras 3-4) */}
                            <div className="px-6">
                                <div className="flex flex-wrap gap-2">
                                    {categories.slice(0, 4).map((cat) => (
                                        <button
                                            key={cat.id}
                                            onClick={() => {
                                                setSearchForm({...searchForm, categoryId: cat.id});
                                            }}
                                            className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
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
                        
                        {/* Botón buscar - Estilo Airbnb circular */}
                        <div className="px-6 pb-6 pt-2">
                            <button
                                onClick={handleSearch}
                                className="w-full bg-[#0066CC] hover:bg-[#0052A3] text-white rounded-full p-3.5 transition-colors shadow-md hover:shadow-lg flex items-center justify-center"
                            >
                                <Search className="w-5 h-5" />
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
                                {/* Badge/Tag optimizado para desktop */}
                                <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium border border-blue-100">
                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                    <span>Búsqueda inteligente de vehículos</span>
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

            {/* Widget de reseñas - visible solo en desktop */}
            <div className="hidden lg:block mt-2 lg:mt-2 relative z-0">
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
                            className={`w-full transition-opacity duration-300 ${isReviewsLoading ? 'opacity-0 pointer-events-none' : 'opacity-100'} hide-widget-navigation`}
                            style={{ minHeight: isReviewsLoading ? '240px' : 'auto' }}
                        >
                        {/* Widget de reseñas se inyectará aquí dinámicamente */}
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
            `}</style>
        </div>
    );
};

export default HomePresentation;

