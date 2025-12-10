import React, { useState, useEffect } from 'react';
import { Car, Home, Shield, CheckCircle, FolderTree, Wrench, ChevronRight, ArrowUp, AlertCircle, X } from 'lucide-react';
import { useCategories } from '../contexts/CategoryContext';
import SearchForm from '../components/SearchForm';
import { SearchParameterForm } from '../components/SearchParameterForm';
import { ServiceReviewPage } from './ServiceReviewPage';
import { useAuth } from '../contexts/AuthContext';
import { showToast } from '../lib/toast';
import HomePresentation from '../components/HomePresentation';
import { useServiceTypes } from '../hooks/useServiceTypes';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../components/ui/sheet';
import { ErrorDisplay } from '../components/ErrorDisplay';
import { useMfaVerification } from '../contexts/MfaVerificationContext';
import { Button } from '../components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert';
import { useNavigate, useLocation } from 'react-router-dom';
import { mfaService } from '../services/mfaService';


interface SearchParameters {
    keywords: string;
    userSearch: string;
    category: number;
    frequency: number;
    latitude?: string;
    longitude?: string;
    locationRange?: number;
    minPrice?: number;
    maxPrice?: number;
    serviceTypeId: number;
    strictMatchOnly?: boolean;
}

const SearchCreationPage: React.FC = () => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { categories } = useCategories();
    // Removed subscription limits - no longer needed
    const { serviceTypes, isLoading: serviceTypesLoading, error: serviceTypesError } = useServiceTypes();
    const { showVerification, hasPendingVerification } = useMfaVerification();
    const [currentStep, setCurrentStep] = useState(0);
    const [showPendingMfaBanner, setShowPendingMfaBanner] = useState(false);
    const [showMfaRecommendationBanner, setShowMfaRecommendationBanner] = useState(false);
    const [mfaEnabled, setMfaEnabled] = useState<boolean | null>(null);
    
    // Notificar a App.tsx cuando estamos en un formulario (step 1, 2 o 3) para ocultar el header en móvil
    React.useEffect(() => {
        if (currentStep === 1 || currentStep === 2 || currentStep === 3) {
            sessionStorage.setItem('isInFormStep', 'true');
        } else {
            sessionStorage.removeItem('isInFormStep');
        }
        // Disparar evento para que App.tsx pueda reaccionar
        window.dispatchEvent(new CustomEvent('formStepChanged', { detail: { step: currentStep } }));
    }, [currentStep]);
    const [searchParameters, setSearchParameters] = useState<Partial<SearchParameters>>({
        keywords: '',
        userSearch: '',
        frequency: 24,
        strictMatchOnly: false,
    });
    const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
    const [expertProfilePicture, setExpertProfilePicture] = useState<string | undefined>(undefined);
    const [expertName, setExpertName] = useState<string | undefined>(undefined);
    const [servicePrice, setServicePrice] = useState<number | undefined>(undefined);
    const [serviceDescription, setServiceDescription] = useState<string | undefined>(undefined);
    const [serviceImageUrls, setServiceImageUrls] = useState<string[]>([]);

    const safeCategories = Array.isArray(categories) ? categories : [];
    const [showMoreCategories, setShowMoreCategories] = useState(false);
    const [selectedThirdCategory, setSelectedThirdCategory] = useState<number | null>(null);
    const [showBackToTop, setShowBackToTop] = useState(false);

    // Mostrar/ocultar botón "back to top" basado en scroll
    useEffect(() => {
        const handleScroll = () => {
            setShowBackToTop(window.scrollY > 300);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Leer parámetros de sessionStorage (desde la homepage) y prellenar el formulario
    useEffect(() => {
        const homeSearchParams = sessionStorage.getItem('homeSearchParams');
        if (homeSearchParams) {
            try {
                const params = JSON.parse(homeSearchParams);
                if (params.serviceTypeId && params.categoryId) {
                    // Establecer parámetros primero
                    setSearchParameters(prev => ({
                        ...prev,
                        serviceTypeId: params.serviceTypeId,
                        category: params.categoryId,
                        keywords: params.adUrl || prev.keywords,
                        userSearch: params.adUrl || prev.userSearch,
                    }));
                    
                    // Limpiar sessionStorage después de leer
                    sessionStorage.removeItem('homeSearchParams');
                    
                    // Ocultar scroll durante la transición
                    document.body.style.overflow = 'hidden';
                    // Scroll instantáneo al top
                    window.scrollTo(0, 0);
                    // Cambiar step inmediatamente (igual que handleStartSearch)
                    setCurrentStep(1);
                    // Restaurar scroll después de un delay mínimo
                    setTimeout(() => {
                        document.body.style.overflow = '';
                    }, 50);
                }
            } catch (error) {
                console.error('Error parsing homeSearchParams:', error);
                sessionStorage.removeItem('homeSearchParams');
            }
        }
    }, []);
    
    // Scroll automático a la sección del formulario cuando se navega desde otra página
    useEffect(() => {
        const shouldScrollToForm = sessionStorage.getItem('scrollToFormSection');
        if (shouldScrollToForm && currentStep === 0) {
            sessionStorage.removeItem('scrollToFormSection');
            setTimeout(() => {
                scrollToForm();
            }, 500);
        }
    }, [currentStep]);

    // ✅ Verificar si hay verificación MFA pendiente
    useEffect(() => {
        const checkPendingVerification = () => {
            // ✅ Leer directamente del localStorage en lugar de usar el hook
            const hasPending = localStorage.getItem('mfa-verification-pending') === 'true';
            console.log('[SearchCreationPage] Checking pending verification:', hasPending, 'isAuthenticated:', isAuthenticated);
            if (isAuthenticated && hasPending) {
                setShowPendingMfaBanner(true);
            } else {
                setShowPendingMfaBanner(false);
            }
        };

        // Verificar al cargar
        checkPendingVerification();

        // ✅ Escuchar cambios en localStorage para actualizar el banner (funciona entre pestañas)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'mfa-verification-pending') {
                console.log('[SearchCreationPage] Storage change detected:', e.newValue);
                checkPendingVerification();
            }
        };

        // ✅ Escuchar eventos personalizados cuando se limpia la verificación (misma pestaña)
        const handleVerificationCleared = () => {
            console.log('[SearchCreationPage] MFA verification cleared event received');
            // Forzar verificación inmediata
            setTimeout(() => {
                checkPendingVerification();
            }, 50);
        };

        // ✅ Verificación periódica como fallback (cada 200ms para respuesta más rápida)
        const intervalId = setInterval(() => {
            checkPendingVerification();
        }, 200);

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('mfaVerificationCleared', handleVerificationCleared);

        return () => {
            clearInterval(intervalId);
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('mfaVerificationCleared', handleVerificationCleared);
        };
    }, [isAuthenticated]);

    // ✅ Verificar estado de MFA para mostrar recomendación
    useEffect(() => {
        const checkMfaStatus = async () => {
            if (!isAuthenticated) {
                setMfaEnabled(null);
                setShowMfaRecommendationBanner(false);
                return;
            }

            try {
                const mfaStatus = await mfaService.getMFAStatus();
                setMfaEnabled(mfaStatus.isEnabled);
                
                // Mostrar banner solo si:
                // 1. MFA no está habilitado
                // 2. El banner no ha sido cerrado (localStorage)
                // 3. Estamos en el paso 0 (homepage)
                const bannerDismissed = localStorage.getItem('mfa-recommendation-banner-dismissed') === 'true';
                if (!mfaStatus.isEnabled && !bannerDismissed && currentStep === 0) {
                    setShowMfaRecommendationBanner(true);
                } else {
                    setShowMfaRecommendationBanner(false);
                }
            } catch (error) {
                console.error('[SearchCreationPage] Error checking MFA status:', error);
                setMfaEnabled(null);
                setShowMfaRecommendationBanner(false);
            }
        };

        checkMfaStatus();
    }, [isAuthenticated, currentStep]);

    const handleDismissMfaRecommendation = () => {
        setShowMfaRecommendationBanner(false);
        localStorage.setItem('mfa-recommendation-banner-dismissed', 'true');
    };

    const handleSetupMfa = () => {
        navigate('/mfa/setup');
    };

    // Filtrar solo categorías padre
    const parentCategories = safeCategories.filter(cat => {
        // Calcular isParent si no viene del backend
        const isParent = cat.isParent !== undefined ? cat.isParent : cat.parentId === null;
        return isParent;
    });

    // Obtener subcategorías de una categoría padre
    const getSubcategories = (parentId: number) => {
        return safeCategories.filter(cat => cat.parentId === parentId);
    };


    const handleParametersComplete = (parameters: SearchParameters & { 
        latitude: string; 
        longitude: string; 
        locationRange: number;
        serviceId?: number;
        expertProfilePicture?: string;
        expertName?: string;
        servicePrice?: number;
        serviceDescription?: string;
        serviceImageUrls?: string[];
    }) => {
        // ✅ Ya no requiere autenticación para ver servicios y expertos
        // La autenticación se requerirá solo al contratar (en SearchForm)
        // Removed subscription limits - unlimited searches now available
        console.log('SearchCreationPage - Parameters received:', parameters);
        // Ensure strictMatchOnly is always false
        const updatedParameters = { ...parameters, strictMatchOnly: false };
        setSearchParameters(updatedParameters);
        
        // Si viene el servicio seleccionado, guardarlo y pasar al siguiente paso (ServiceReviewPage)
        if (parameters.serviceId) {
            setSelectedServiceId(parameters.serviceId);
            setExpertProfilePicture(parameters.expertProfilePicture);
            setExpertName(parameters.expertName);
            setServicePrice(parameters.servicePrice);
            setServiceDescription(parameters.serviceDescription);
            setServiceImageUrls(parameters.serviceImageUrls || []);
            setCurrentStep(2); // Paso 2: ServiceReviewPage (revisión del servicio)
        } else {
            // Si no viene servicio, quedarse en el paso actual
            setCurrentStep(1);
        }
    };


    const handleSearchComplete = () => {
        showToast('success', '🎉 ¡Búsqueda creada con éxito! Te notificaremos cuando encontremos coincidencias.');
        setCurrentStep(0);
        setSearchParameters({
            keywords: '',
            userSearch: '',
            category: 1,
            frequency: 24,
            serviceTypeId: 1,
            strictMatchOnly: false,
        });
        setSelectedServiceId(null);
        setExpertProfilePicture(undefined);
        setExpertName(undefined);
        setServicePrice(undefined);
        setServiceDescription(undefined);
    };

    const handleStartSearch = () => {
        // ✅ Ya no requiere autenticación para ver servicios y expertos
        // La autenticación se requerirá solo al contratar (en SearchForm)
        if (!searchParameters.serviceTypeId) {
            showToast('error', '📍 Por favor, selecciona un tipo de servicio');
            return;
        }
        if (!searchParameters.category) {
            showToast('error', '📍 Por favor, selecciona una categoría');
            return;
        }
        // Find the selected service type to check if it requires keywords
        const selectedServiceType = serviceTypes.find(st => st.id === searchParameters.serviceTypeId);
        const requiresKeywords = selectedServiceType?.id === 2 || selectedServiceType?.name.toLowerCase().includes('búsqueda') || selectedServiceType?.name.toLowerCase().includes('search');
        
        if ((requiresKeywords && !searchParameters.keywords) || !searchParameters.userSearch) {
            showToast('error', '📍 Por favor, completa los campos de búsqueda');
            return;
        }
        console.log('SearchCreationPage - Starting search with parameters:', searchParameters);
        // Hide scroll during transition to make it invisible
        document.body.style.overflow = 'hidden';
        // Instant scroll to top
        window.scrollTo(0, 0);
        // Change step immediately
        setCurrentStep(1);
        // Restore scroll after a minimal delay
        setTimeout(() => {
            document.body.style.overflow = '';
        }, 50);
    };

    const scrollToForm = () => {
        const formSection = document.getElementById('form-section');
        if (formSection) {
            // Obtener la posición exacta del elemento
            const elementPosition = formSection.getBoundingClientRect().top + window.pageYOffset;
            
            // Scroll un poco antes del inicio del elemento
            window.scrollTo({
                top: elementPosition - 20,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div className="relative w-full bg-background" style={{ transition: 'none', minHeight: '100vh' }}>
            {currentStep === 0 ? (
                <>
                    <HomePresentation onScrollToForm={scrollToForm} />
                    
                    {/* ✅ Banner de verificación MFA pendiente */}
                    {showPendingMfaBanner && isAuthenticated && (
                        <div className="w-full bg-yellow-50 border-b border-yellow-200">
                            <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-3">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                                        <div>
                                            <p className="text-sm font-medium text-yellow-900">
                                                Verificación de seguridad pendiente
                                            </p>
                                            <p className="text-xs text-yellow-700">
                                                Completa la verificación de dos factores para continuar
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() => showVerification()}
                                        size="sm"
                                        className="bg-yellow-600 hover:bg-yellow-700 text-white"
                                    >
                                        <Shield className="h-4 w-4 mr-2" />
                                        Verificar ahora
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <div className="w-full py-6 md:py-8">
                        <div
                            id="form-section"
                            className="w-full mx-auto max-w-7xl px-4 md:px-6 lg:px-8"
                        >
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
                                {/* Left Column - Form */}
                                <div>
                            {/* Header */}
                                    <div className="mb-12">
                                        <h2 className="text-2xl font-medium text-gray-900 mb-1">
                                            Sistema de Inspección
                                </h2>
                                        <p className="text-sm text-gray-500">
                                            Roadmap y documentación del sistema
                                        </p>
                                    </div>
                                    <div className="space-y-8 w-full">
                                        {/* Placeholder - Form removed */}
                                        <div className="p-8 bg-gray-50 rounded-lg border border-gray-200">
                                            <p className="text-gray-600 text-center">
                                                El formulario ha sido removido. Consulta el roadmap del sistema para más información.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                {/* Right Column - Visual Element */}
                                <div className="hidden lg:block sticky top-8">
                                    <div className="relative h-full min-h-[800px] rounded-tr-[2.5rem] overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3),0_10px_25px_-5px_rgba(0,0,0,0.2)] border border-white/10 backdrop-blur-sm">
                                        {/* Background Image - HD Real con fallback local */}
                                        <div className="absolute inset-0">
                                            {/* Imagen HD principal - Inspección de vehículo profesional en alta calidad */}
                                            <picture>
                                                {/* Fuentes HD optimizadas para diferentes resoluciones */}
                                                <source 
                                                    media="(min-width: 1920px)" 
                                                    srcSet="https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?ixlib=rb-4.0.3&auto=format&fit=crop&w=2560&q=100 1x,
                                                            https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?ixlib=rb-4.0.3&auto=format&fit=crop&w=3840&q=100 2x"
                                                />
                                                <source 
                                                    media="(min-width: 1280px)" 
                                                    srcSet="https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=100"
                                                />
                                                <img 
                                                    src="https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=100"
                                                    alt="Inspección profesional de vehículos"
                                                    className="w-full h-full object-cover"
                                                    loading="eager"
                                                    decoding="async"
                                                    onError={(e) => {
                                                        const img = e.target as HTMLImageElement;
                                                        // Fallback a imagen HD alternativa de alta calidad
                                                        img.src = "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=100";
                                                        img.onerror = () => {
                                                            // Si falla también, usar imagen local
                                                            img.src = new URL('../media/landingimage.png', import.meta.url).href;
                                                            img.onerror = () => {
                                                                // Último fallback
                                                                img.src = new URL('../media/fotohome.png', import.meta.url).href;
                                                            };
                                                        };
                                                    }}
                                                />
                                            </picture>
                                            {/* Fallback gradient elegante si todas las imágenes fallan */}
                                            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-700 to-gray-800 opacity-0" id="gradient-fallback"></div>
                                        </div>
                                        
                                        {/* Overlay sutil para mejorar legibilidad sin ocultar la imagen HD */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/15"></div>
                                        
                                        {/* Efecto de brillo sutil en la parte superior */}
                                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/25 pointer-events-none"></div>
                                        
                                        {/* Borde interno sutil para profundidad */}
                                        <div className="absolute inset-[1px] rounded-tr-[2.5rem] border border-white/5 pointer-events-none"></div>
                                        
                                        {/* Content */}
                                        <div className="relative h-full flex flex-col justify-between p-8">
                                            {/* Top badge */}
                                            <div className="flex justify-end">
                                                <div className="px-5 py-2.5 bg-white/98 backdrop-blur-md rounded-full flex items-center gap-2.5 shadow-[0_4px_14px_0_rgba(0,0,0,0.15)] border border-white/20 hover:shadow-[0_6px_20px_0_rgba(0,0,0,0.2)] transition-all duration-300">
                                                    <span className="text-sm font-semibold text-gray-900 tracking-tight">inspecciono.com</span>
                                                    <svg className="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                    </svg>
                                                </div>
                                            </div>
                                            
                                            {/* Bottom content */}
                                            <div className="space-y-6">
                                                <div className="space-y-4">
                                                    <p className="text-white/95 text-xs font-bold tracking-[0.15em] uppercase letter-spacing-wider">Descubriendo lo mejor</p>
                                                    <h3 className="text-3xl md:text-4xl font-bold text-white leading-[1.2] drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
                                                        "Una elección inteligente. La mejor inspección profesional para tu compra"
                                                    </h3>
                                                </div>
                                                
                                                {/* Feature badges */}
                                                <div className="flex flex-wrap gap-3">
                                                    <div className="flex items-center gap-2.5 px-5 py-2.5 bg-white/30 backdrop-blur-lg rounded-full border border-white/40 shadow-[0_4px_12px_rgba(0,0,0,0.15)] hover:bg-white/35 hover:shadow-[0_6px_16px_rgba(0,0,0,0.2)] transition-all duration-300">
                                                        <div className="w-7 h-7 rounded-full bg-white/40 backdrop-blur-sm border border-white/60 flex items-center justify-center flex-shrink-0 shadow-sm">
                                                            <Shield className="w-4 h-4 text-white drop-shadow-sm" />
                                                        </div>
                                                        <span className="text-sm font-bold text-white drop-shadow-sm">100% Garantía</span>
                                                    </div>
                                                    <div className="flex items-center gap-2.5 px-5 py-2.5 bg-white/30 backdrop-blur-lg rounded-full border border-white/40 shadow-[0_4px_12px_rgba(0,0,0,0.15)] hover:bg-white/35 hover:shadow-[0_6px_16px_rgba(0,0,0,0.2)] transition-all duration-300">
                                                        <div className="w-7 h-7 rounded-full bg-white/40 backdrop-blur-sm border border-white/60 flex items-center justify-center flex-shrink-0 shadow-sm">
                                                            <svg className="w-4 h-4 text-white drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                        </div>
                                                        <span className="text-sm font-bold text-white drop-shadow-sm">Informe detallado</span>
                                                    </div>
                                                </div>
                                                
                                                {/* Pagination dots */}
                                                <div className="flex items-center justify-center gap-2.5 pt-3">
                                                    <div className="w-12 h-1.5 bg-white rounded-full shadow-sm"></div>
                                                    <div className="w-5 h-1.5 bg-white/50 rounded-full"></div>
                                                    <div className="w-5 h-1.5 bg-white/50 rounded-full"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <footer className="mt-16 bg-background border-t border-border">
                        <div className="w-full px-4 sm:px-6 mx-auto max-w-7xl">
                            <div className="py-6 sm:py-8">
                                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6">
                                    {/* Copyright */}
                                    <p className="text-sm text-gray-600 text-center sm:text-left">
                                        © 2025 inspecciono.com. Todos los derechos reservados.
                                    </p>
                                    
                                    {/* Links */}
                                    <div className="flex flex-wrap justify-center sm:justify-end gap-4 sm:gap-6 text-sm">
                                        <a href="/privacy-policy.html" className="text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-1">
                                            <Shield className="w-3.5 h-3.5" />
                                            Privacidad
                                        </a>
                                        <a href="/terms.html" className="text-gray-500 hover:text-gray-700 transition-colors">
                                            Términos
                                        </a>
                                        <a href="/contact.html" className="text-gray-500 hover:text-gray-700 transition-colors">
                                            Contacto
                                        </a>
                                        <a href="/become-expert" className="text-gray-500 hover:text-blue-600 transition-colors">
                                            Hazte Experto
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </footer>
                </>
            ) : (
                                        <>
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
                                                {/* Left Column - Form */}
                                                <div>
                                            {/* Service Type Section */}
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-3 uppercase tracking-wide">
                                                    Tipo de servicio
                                                </label>
                                                <div className="space-y-3">
                                        {serviceTypesLoading ? (
                                            // Loading state
                                            <>
                                                <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 animate-pulse">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                                                        <div className="flex-1">
                                                            <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                                                            <div className="h-3 bg-gray-300 rounded w-full mb-2"></div>
                                                            <div className="flex gap-1">
                                                                <div className="h-5 bg-gray-300 rounded w-16"></div>
                                                                <div className="h-5 bg-gray-300 rounded w-20"></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 animate-pulse">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                                                        <div className="flex-1">
                                                            <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                                                            <div className="h-3 bg-gray-300 rounded w-full mb-2"></div>
                                                            <div className="flex gap-1">
                                                                <div className="h-5 bg-gray-300 rounded w-16"></div>
                                                                <div className="h-5 bg-gray-300 rounded w-20"></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        ) : serviceTypesError ? (
                                            // Error state
                                            <div className="col-span-2">
                                                <ErrorDisplay
                                                    message="Error al cargar los tipos de servicio. Usando configuración por defecto."
                                                    fullScreen={false}
                                                    compact={true}
                                                />
                                            </div>
                                        ) : (
                                            // Dynamic service types
                                            serviceTypes.map((serviceType) => {
                                                const isComingSoon = serviceType.id === 2;
                                                const isSelected = searchParameters.serviceTypeId === serviceType.id;
                                                
                                                return (
                                                <label 
                                                    key={serviceType.id}
                                                        className={`relative cursor-pointer flex items-center gap-3 p-4 md:p-3 border rounded-md transition-all min-h-[48px] md:min-h-0 ${
                                                            isSelected
                                                                ? 'border-gray-900 bg-gray-50'
                                                                : isComingSoon
                                                                    ? 'border-gray-200 bg-gray-50/60'
                                                                    : 'border-gray-200 bg-white hover:border-gray-300'
                                                        } ${isComingSoon ? 'cursor-not-allowed' : ''}`}
                                                >
                                                    <input
                                                        type="radio"
                                                        value={serviceType.id}
                                                            checked={isSelected}
                                                        onChange={() => {
                                                            if (!isComingSoon) {
                                                            setSearchParameters((prev) => ({ 
                                                                ...prev, 
                                                                serviceTypeId: serviceType.id,
                                                                keywords: serviceType.id === 2 ? '' : 'revisión presencial'
                                                            }));
                                                            }
                                                        }}
                                                            disabled={isComingSoon}
                                                        className="sr-only"
                                                    />
                                                        {isComingSoon && (
                                                            <div className="absolute top-2.5 right-2.5 z-10">
                                                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded text-[10px] font-semibold uppercase tracking-wide shadow-md">
                                                                    <Wrench className="w-3 h-3" />
                                                                    <span>Próximamente</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                                            isSelected
                                                                ? 'border-gray-900 bg-gray-900'
                                                            : isComingSoon
                                                                ? 'border-gray-400 bg-gray-200'
                                                            : 'border-gray-300'
                                                            }`}>
                                                            {isSelected && (
                                                                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                                            )}
                                                        </div>
                                                        <span className={`text-base md:text-sm ${
                                                            isSelected 
                                                                ? 'text-gray-900 font-medium' 
                                                                : isComingSoon
                                                                    ? 'text-gray-400 line-through'
                                                                : 'text-gray-700'
                                                        }`}>
                                                            {serviceType.name.replace('2', '').trim()}
                                                                    </span>
                                                </label>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>

                                {/* Categories Section */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-3 uppercase tracking-wide">
                                                Categoría
                                            </label>
                                            <div>
                                        {/* Categorías Padre - Solo 3 principales + botón más categorías */}
                                        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-3">
                                            {/* Mostrar solo 3 categorías principales */}
                                            {(() => {
                                                // Categorías principales: Coches (1), Motos (2), y la tercera (Inmobiliaria 3 o la seleccionada)
                                                const mainCategories = parentCategories.filter(cat => {
                                                    const isCoche = cat.id === 1;
                                                    const isMoto = cat.id === 2;
                                                    const isThird = selectedThirdCategory ? cat.id === selectedThirdCategory : cat.id === 3;
                                                    return isCoche || isMoto || isThird;
                                                }).sort((a, b) => {
                                                    // Ordenar: Coches (1), Motos (2), Tercera (3 o selectedThirdCategory)
                                                    if (a.id === 1) return -1;
                                                    if (b.id === 1) return 1;
                                                    if (a.id === 2) return -1;
                                                    if (b.id === 2) return 1;
                                                    return 0;
                                                });
                                                
                                                return mainCategories.map((parentCategory) => {
                                                const subcategories = getSubcategories(parentCategory.id);
                                                const hasSubcategories = subcategories.length > 0;
                                                const isSelected = searchParameters.category === parentCategory.id;
                                                
                                                // Detectar si hay una subcategoría seleccionada de esta categoría padre
                                                const selectedCategory = safeCategories.find(cat => cat.id === searchParameters.category);
                                                const hasSubcategorySelected = selectedCategory && selectedCategory.parentId === parentCategory.id;
                                                
                                                const isMotoAgua = parentCategory.name.toLowerCase().includes('agua') || 
                                                                  parentCategory.name.toLowerCase().includes('acuática') ||
                                                                  parentCategory.name.toLowerCase().includes('water');
                                                const isMoto = parentCategory.name.toLowerCase().includes('moto') || 
                                                              parentCategory.id === 2;
                                                const isCoche = parentCategory.name.toLowerCase().includes('coche') || 
                                                               parentCategory.name.toLowerCase().includes('vehículo') ||
                                                               parentCategory.id === 1;
                                                const isCasa = parentCategory.name.toLowerCase().includes('inmobiliaria') || 
                                                              parentCategory.name.toLowerCase().includes('inmueble') ||
                                                              parentCategory.name.toLowerCase().includes('casa') ||
                                                              parentCategory.id === 3;
                                                const isMotoCategory = isMotoAgua || isMoto;
                                                const isImageCategory = isMotoCategory || isCoche || isCasa;
                                                
                                                return (
                                                    <div key={parentCategory.id}>
                                                        <div className={`group relative rounded-xl transition-all ${
                                                                    isImageCategory ? 'border border-gray-200 bg-white' : 'border border-gray-200'
                                                                } ${
                                                            isSelected
                                                                        ? isImageCategory 
                                                                            ? 'border-gray-900 shadow-md ring-1 ring-gray-900/10' 
                                                                            : 'border-gray-900 bg-gray-50'
                                                                        : hasSubcategorySelected
                                                                            ? isImageCategory
                                                                                ? 'border-primary/40 bg-primary/5 opacity-75 backdrop-blur-sm'
                                                                                : 'border-primary/40 bg-primary/5 opacity-75 backdrop-blur-sm'
                                                                            : isImageCategory
                                                                                ? 'hover:border-gray-300 hover:shadow-sm'
                                                                                : 'hover:border-gray-300 bg-white'
                                                        }`}>
                                                                <button
                                                                        onClick={() => {
                                                                            const newCategoryId = parentCategory.id;
                                                                            const currentCategory = searchParameters.category;
                                                                            
                                                                            // Si se hace clic en la misma categoría, deseleccionar
                                                                            if (currentCategory === newCategoryId) {
                                                                                setSearchParameters((prev) => ({ ...prev, category: undefined }));
                                                                            } else {
                                                                                // Seleccionar nueva categoría
                                                                                setSearchParameters((prev) => ({ ...prev, category: newCategoryId }));
                                                                            }
                                                                        }}
                                                                        className="w-full relative"
                                                                    >
                                                                        {isImageCategory ? (
                                                                            // Diseño ordenado: texto arriba, imagen abajo
                                                                            <div className={`relative h-32 md:h-40 overflow-hidden ${hasSubcategorySelected ? 'opacity-80' : ''}`}>
                                                                                <div className="h-full flex flex-col p-3 md:p-4">
                                                                                    {/* Título arriba - Altura fija para alinear imágenes */}
                                                                                    <div className="flex items-center justify-between mb-auto min-h-[2rem] md:min-h-[2.5rem]">
                                                                                        <h4 className={`font-semibold text-sm md:text-lg leading-tight ${
                                                                                            isSelected ? 'text-gray-900' : hasSubcategorySelected ? 'text-primary' : 'text-gray-900'
                                                                                        }`}>
                                                                                            {parentCategory.name}
                                                                                        </h4>
                                                                                        {isSelected && (
                                                                                            <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-gray-900 flex-shrink-0" />
                                                                                        )}
                                                                                    </div>
                                                                                    
                                                                                    {/* Imagen abajo a la derecha */}
                                                                                    <div className="flex justify-end items-end mt-auto">
                                                                                        <div className="w-20 h-20 md:w-28 md:h-28 flex items-center justify-center">
                                                                                            <img 
                                                                                                src={
                                                                                                    isMotoAgua 
                                                                                                        ? new URL('../media/motoagua.png', import.meta.url).href
                                                                                                        : isMoto
                                                                                                            ? new URL('../media/motopng.png', import.meta.url).href
                                                                                                            : isCoche
                                                                                                                ? new URL('../media/cochepng.png', import.meta.url).href
                                                                                                                : isCasa
                                                                                                                    ? new URL('../media/casapng.png', import.meta.url).href
                                                                                                                    : ''
                                                                                                }
                                                                                                alt={
                                                                                                    isMotoAgua ? "Moto de agua" 
                                                                                                        : isMoto ? "Moto" 
                                                                                                        : isCoche ? "Coche"
                                                                                                        : isCasa ? "Casa"
                                                                                                        : ""
                                                                                                }
                                                                                                className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-105"
                                                                                            />
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ) : (
                                                                            // Diseño estándar para otras categorías
                                                                            <div className={`h-32 md:h-auto p-3 md:p-4 flex flex-col items-center text-center space-y-2 md:space-y-3 ${hasSubcategorySelected ? 'opacity-80' : ''}`}>
                                                                    <div className={`w-12 h-12 md:w-16 md:h-16 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${
                                                                        isSelected
                                                                                        ? 'bg-primary text-primary-foreground'
                                                                                        : hasSubcategorySelected
                                                                                            ? 'bg-primary/20 text-primary border border-primary/40'
                                                                                            : 'bg-gray-100 text-gray-600'
                                                                    }`}>
                                                                        {parentCategory.id === 1 && <Car className="w-6 h-6 md:w-8 md:h-8" />}
                                                                        {parentCategory.id === 3 && <Home className="w-6 h-6 md:w-8 md:h-8" />}
                                                                        {![1, 2, 3].includes(parentCategory.id) && <FolderTree className="w-6 h-6 md:w-8 md:h-8" />}
                                                                    </div>
                                                                    <div className="w-full flex-1 flex flex-col justify-center">
                                                                        <div className="flex items-center justify-center gap-1 md:gap-2 mb-0.5 md:mb-1">
                                                                            <h4 className={`font-semibold text-sm md:text-base ${
                                                                                isSelected ? 'text-primary' : hasSubcategorySelected ? 'text-primary' : 'text-gray-900'
                                                                            }`}>
                                                                                {parentCategory.name}
                                                                            </h4>
                                                                            {isSelected && (
                                                                                <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-primary flex-shrink-0" />
                                                                            )}
                                                                            {hasSubcategorySelected && !isSelected && (
                                                                                <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center flex-shrink-0">
                                                                                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <p className="text-xs md:text-sm text-gray-500 mb-1 md:mb-2 hidden md:block">
                                                                            {parentCategory.id === 1 && 'Coches, motos y vehículos'}
                                                                            {parentCategory.id === 2 && 'Motocicletas y ciclomotores'}
                                                                            {parentCategory.id === 3 && 'Inmuebles y propiedades'}
                                                                            {![1, 2, 3].includes(parentCategory.id) && 'Selecciona esta categoría'}
                                                                        </p>
                                                                        {hasSubcategories && (
                                                                            <div className="flex items-center justify-center gap-1 md:gap-2">
                                                                                            <span className="text-[10px] md:text-xs px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-full bg-gray-100 text-gray-600 font-medium">
                                                                                    General
                                                                                </span>
                                                                                            <span className="text-[10px] md:text-xs text-gray-500">
                                                                                    {subcategories.length} {subcategories.length === 1 ? 'subcategoría' : 'subcategorías'}
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                            </div>
                                                                            )}
                                                                        </button>
                                                                    </div>
                                                    </div>
                                                );
                                                });
                                            })()}
                                            
                                            {/* Botón "Más categorías" */}
                                            <Sheet open={showMoreCategories} onOpenChange={setShowMoreCategories}>
                                                <SheetTrigger asChild>
                                                    <button className="group relative rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100 transition-all h-32 md:h-40 overflow-hidden">
                                                        <div className="h-full flex flex-col items-center justify-center p-3 md:p-4 space-y-2 md:space-y-3">
                                                            <div className="text-center">
                                                                <h4 className="font-semibold text-sm md:text-base text-gray-900 mb-0.5 md:mb-1">
                                                                    Más categorías
                                                                </h4>
                                                                <p className="text-[10px] md:text-xs text-gray-500">
                                                                    Ver todas las opciones
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </button>
                                                </SheetTrigger>
                                                <SheetContent side="right" className="w-full sm:max-w-md">
                                                    <SheetHeader>
                                                        <SheetTitle className="text-xl font-semibold">Todas las categorías</SheetTitle>
                                                    </SheetHeader>
                                                    <div className="mt-6 space-y-2 max-h-[calc(100vh-120px)] overflow-y-auto">
                                                        {parentCategories
                                                            .filter(cat => {
                                                                // Excluir las 3 principales que ya se muestran
                                                                const isCoche = cat.id === 1;
                                                                const isMoto = cat.id === 2;
                                                                const isThird = selectedThirdCategory ? cat.id === selectedThirdCategory : cat.id === 3;
                                                                return !isCoche && !isMoto && !isThird;
                                                            })
                                                            .map((category) => {
                                                                const isSelected = selectedThirdCategory === category.id;
                                                                const isMotoAgua = category.name.toLowerCase().includes('agua') || 
                                                                                  category.name.toLowerCase().includes('acuática');
                                                                const isMoto = category.name.toLowerCase().includes('moto') && !isMotoAgua;
                                                                const isCoche = category.name.toLowerCase().includes('coche') || 
                                                                               category.name.toLowerCase().includes('vehículo');
                                                                const isCasa = category.name.toLowerCase().includes('inmobiliaria') || 
                                                                              category.name.toLowerCase().includes('inmueble') ||
                                                                              category.name.toLowerCase().includes('casa');
                                                                
                                                                return (
                                                                    <button
                                                                        key={category.id}
                                                                        onClick={() => {
                                                                            setSelectedThirdCategory(category.id);
                                                                            setSearchParameters((prev) => ({ ...prev, category: category.id }));
                                                                            setShowMoreCategories(false);
                                                                        }}
                                                                        className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-all text-left ${
                                                                            isSelected
                                                                                ? 'border-gray-900 bg-gray-50'
                                                                                : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                                                                        }`}
                                                                    >
                                                                        {/* Imagen o icono */}
                                                                        <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                                                                            {isMotoAgua ? (
                                                                                <img 
                                                                                    src={new URL('../media/motoagua.png', import.meta.url).href}
                                                                                    alt={category.name}
                                                                                    className="w-full h-full object-contain"
                                                                                />
                                                                            ) : isMoto ? (
                                                                                <img 
                                                                                    src={new URL('../media/motopng.png', import.meta.url).href}
                                                                                    alt={category.name}
                                                                                    className="w-full h-full object-contain"
                                                                                />
                                                                            ) : isCoche ? (
                                                                                <img 
                                                                                    src={new URL('../media/cochepng.png', import.meta.url).href}
                                                                                    alt={category.name}
                                                                                    className="w-full h-full object-contain"
                                                                                />
                                                                            ) : isCasa ? (
                                                                                <img 
                                                                                    src={new URL('../media/casapng.png', import.meta.url).href}
                                                                                    alt={category.name}
                                                                                    className="w-full h-full object-contain"
                                                                                />
                                                                            ) : (
                                                                                <FolderTree className="w-8 h-8 text-gray-600" />
                                                                            )}
                                                                        </div>
                                                                        
                                                                        {/* Nombre */}
                                                                        <div className="flex-1 min-w-0">
                                                                            <h4 className={`font-semibold text-base ${
                                                                                isSelected ? 'text-gray-900' : 'text-gray-900'
                                                                            }`}>
                                                                                {category.name}
                                                                            </h4>
                                                                        </div>
                                                                        
                                                                        {/* Checkmark o chevron */}
                                                                        {isSelected ? (
                                                                            <CheckCircle className="w-5 h-5 text-gray-900 flex-shrink-0" />
                                                                        ) : (
                                                                            <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                                                        )}
                                                                    </button>
                                                                );
                                                            })}
                                                    </div>
                                                </SheetContent>
                                            </Sheet>
                                        </div>

                                        {/* Subcategorías - Minimalista debajo de las cards - Siempre ocupa el mismo espacio */}
                                        <div className="mt-6 min-h-[60px] md:min-h-[50px]">
                                            {searchParameters.category ? (() => {
                                                // Buscar la categoría seleccionada en todas las categorías (no solo padre)
                                                const selectedCategory = safeCategories.find(cat => cat.id === searchParameters.category);
                                                
                                                if (!selectedCategory) return null;
                                                
                                                // Determinar el ID de la categoría padre
                                                let parentCategoryId: number;
                                                
                                                if (selectedCategory.parentId !== null) {
                                                    // Es una subcategoría, usar su parentId
                                                    parentCategoryId = selectedCategory.parentId;
                                                } else {
                                                    // Es una categoría padre, usar su propio ID
                                                    parentCategoryId = selectedCategory.id;
                                                }
                                                
                                                // Obtener las subcategorías del padre
                                                const subcategories = getSubcategories(parentCategoryId);
                                                
                                                if (subcategories.length === 0) {
                                                    return (
                                                        <div className="flex items-center justify-center py-3">
                                                            <p className="text-sm text-gray-500 text-center">
                                                                Esta categoría no tiene subcategorías disponibles
                                                            </p>
                                                                </div>
                                                    );
                                                }
                                                
                                                return (
                                                    <div className="space-y-2">
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2">
                                                                {subcategories.map((subcategory) => {
                                                                    const isSubSelected = searchParameters.category === subcategory.id;
                                                                    return (
                                            <button
                                                                            key={subcategory.id}
                                                onClick={() =>
                                                                                setSearchParameters((prev) => ({ ...prev, category: subcategory.id }))
                                                                            }
                                                                        className={`group/sub px-4 py-3 md:px-3 md:py-2 rounded-lg border transition-all text-left min-h-[48px] md:min-h-0 ${
                                                                                isSubSelected
                                                                                ? 'border-primary bg-primary/5 text-primary font-medium'
                                                                                : 'border-gray-200 bg-white hover:border-primary/50 hover:bg-gray-50 text-gray-700 active:bg-gray-100'
                                                                        }`}
                                                                    >
                                                                        <div className="flex items-center justify-between gap-2">
                                                                            <span className="text-base md:text-sm break-words">{subcategory.name}</span>
                                                                            {isSubSelected && (
                                                                                <CheckCircle className="w-5 h-5 md:w-4 md:h-4 text-primary flex-shrink-0" />
                                                                            )}
                                                                        </div>
                                            </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    );
                                            })() : (
                                                <div className="flex items-center justify-center py-3 h-full">
                                                    <p className="text-sm text-gray-400 text-center">
                                                        Selecciona una categoría para ver sus subcategorías
                                                    </p>
                                            </div>
                                        )}
                                        </div>
                                    </div>
                                </div>

                                                                {/* Keywords Section - Only show if service type requires keywords */}
                                {(() => {
                                    const selectedServiceType = serviceTypes.find(st => st.id === searchParameters.serviceTypeId);
                                    const requiresKeywords = selectedServiceType?.id === 2 || selectedServiceType?.name.toLowerCase().includes('búsqueda') || selectedServiceType?.name.toLowerCase().includes('search');
                                    return requiresKeywords && searchParameters.serviceTypeId;
                                })() && (
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-3 uppercase tracking-wide">
                                                    Palabras clave
                                                </label>
                                                <div>
                                            <input
                                                type="text"
                                                value={searchParameters.keywords || ''}
                                                onChange={(e) =>
                                                    setSearchParameters((prev) => ({ ...prev, keywords: e.target.value }))
                                                }
                                                placeholder="Ej: Tesla Model 3, BMW M4..."
                                                className="w-full px-4 py-3 md:px-3 md:py-2 border border-gray-300 rounded-md text-base md:text-sm text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none transition-colors min-h-[48px] md:min-h-0"
                                            />
                                            <div className="mt-2 flex flex-wrap gap-1">
                                                <span className="text-xs text-gray-500">Ejemplos:</span>
                                                {['Tesla Model S', 'BMW Serie 3', 'Piso Madrid'].map((example) => (
                                                    <button
                                                        key={example}
                                                        onClick={() => setSearchParameters(prev => ({ ...prev, keywords: example }))}
                                                        className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs hover:bg-gray-200 transition-colors"
                                                    >
                                                        {example}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Description Section */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-3 uppercase tracking-wide">
                                                {(() => {
                                                    const selectedServiceType = serviceTypes.find(st => st.id === searchParameters.serviceTypeId);
                                                    const requiresKeywords = selectedServiceType?.id === 2 || selectedServiceType?.name.toLowerCase().includes('búsqueda') || selectedServiceType?.name.toLowerCase().includes('search');
                                                    return requiresKeywords ? 'Describe tu búsqueda' : 'URL del anuncio';
                                                })()}
                                        </label>
                                        <div>
                                        <textarea
                                            value={searchParameters.userSearch || ''}
                                            onChange={(e) =>
                                                setSearchParameters((prev) => ({ ...prev, userSearch: e.target.value }))
                                            }
                                            placeholder={(() => {
                                                const selectedServiceType = serviceTypes.find(st => st.id === searchParameters.serviceTypeId);
                                                const requiresKeywords = selectedServiceType?.id === 2 || selectedServiceType?.name.toLowerCase().includes('búsqueda') || selectedServiceType?.name.toLowerCase().includes('search');
                                                return requiresKeywords 
                                                    ? "Ej: Coche <15.000€, automático, pocos km..."
                                                    : "Ej: https://www.milanuncios.com/anuncio-123456...";
                                            })()}
                                            className="w-full px-4 py-3 md:px-3 md:py-2 border border-gray-300 rounded-md text-base md:text-sm text-gray-900 placeholder-gray-400 min-h-[100px] md:min-h-[80px] focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none transition-colors resize-none"
                                        />
                                        {(() => {
                                            const selectedServiceType = serviceTypes.find(st => st.id === searchParameters.serviceTypeId);
                                            const requiresKeywords = selectedServiceType?.id === 2 || selectedServiceType?.name.toLowerCase().includes('búsqueda') || selectedServiceType?.name.toLowerCase().includes('search');
                                            return requiresKeywords;
                                        })() && (
                                            <div className="mt-2 flex flex-wrap gap-1">
                                                {['💰 Precio', '📍 Ubicación', '🚗 Características', '⭐ Estado'].map((tip) => (
                                                    <div key={tip} className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-md">
                                                        {tip}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Submit Button */}
                                    <div className="pt-4">
                                        <button
                                        onClick={handleStartSearch}
                                        disabled={
                                            serviceTypesLoading ||
                                            (() => {
                                                const selectedServiceType = serviceTypes.find(st => st.id === searchParameters.serviceTypeId);
                                                const requiresKeywords = selectedServiceType?.id === 2 || selectedServiceType?.name.toLowerCase().includes('búsqueda') || selectedServiceType?.name.toLowerCase().includes('search');
                                                return (requiresKeywords && !searchParameters.keywords) ||
                                                       !searchParameters.userSearch ||
                                                       !searchParameters.category ||
                                                       !searchParameters.serviceTypeId;
                                            })()
                                        }
                                        className="w-full px-4 py-4 md:py-2.5 bg-gray-900 text-white text-base md:text-sm font-medium rounded-md hover:bg-gray-800 active:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed min-h-[48px] md:min-h-0"
                                    >
                                            Crear búsqueda
                                        </button>
                                </div>
                            {isAuthenticated && (
                                <div className="mt-6 text-sm text-gray-500">
                                    <span>Búsquedas ilimitadas disponibles</span>
                                </div>
                            )}
                        </div>

                                {/* Right Column - Visual Element */}
                                <div className="hidden lg:block sticky top-8">
                                    <div className="relative h-full min-h-[800px] rounded-tr-[2.5rem] overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3),0_10px_25px_-5px_rgba(0,0,0,0.2)] border border-white/10 backdrop-blur-sm">
                                        {/* Background Image - HD Real con fallback local */}
                                        <div className="absolute inset-0">
                                            {/* Imagen HD principal - Inspección de vehículo profesional en alta calidad */}
                                            <picture>
                                                {/* Fuentes HD optimizadas para diferentes resoluciones */}
                                                <source 
                                                    media="(min-width: 1920px)" 
                                                    srcSet="https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?ixlib=rb-4.0.3&auto=format&fit=crop&w=2560&q=100 1x,
                                                            https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?ixlib=rb-4.0.3&auto=format&fit=crop&w=3840&q=100 2x"
                                                />
                                                <source 
                                                    media="(min-width: 1280px)" 
                                                    srcSet="https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=100"
                                                />
                                                <img 
                                                    src="https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=100"
                                                    alt="Inspección profesional de vehículos"
                                                    className="w-full h-full object-cover"
                                                    loading="eager"
                                                    decoding="async"
                                                    onError={(e) => {
                                                        const img = e.target as HTMLImageElement;
                                                        // Fallback a imagen HD alternativa de alta calidad
                                                        img.src = "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=100";
                                                        img.onerror = () => {
                                                            // Si falla también, usar imagen local
                                                            img.src = new URL('../media/landingimage.png', import.meta.url).href;
                                                            img.onerror = () => {
                                                                // Último fallback
                                                                img.src = new URL('../media/fotohome.png', import.meta.url).href;
                                                            };
                                                        };
                                                    }}
                                                />
                                            </picture>
                                            {/* Fallback gradient elegante si todas las imágenes fallan */}
                                            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-700 to-gray-800 opacity-0" id="gradient-fallback"></div>
                                        </div>
                                        
                                        {/* Overlay sutil para mejorar legibilidad sin ocultar la imagen HD */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/15"></div>
                                        
                                        {/* Efecto de brillo sutil en la parte superior */}
                                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/25 pointer-events-none"></div>
                                        
                                        {/* Borde interno sutil para profundidad */}
                                        <div className="absolute inset-[1px] rounded-tr-[2.5rem] border border-white/5 pointer-events-none"></div>
                                        
                                        {/* Content */}
                                        <div className="relative h-full flex flex-col justify-between p-8">
                                            {/* Top badge */}
                                            <div className="flex justify-end">
                                                <div className="px-5 py-2.5 bg-white/98 backdrop-blur-md rounded-full flex items-center gap-2.5 shadow-[0_4px_14px_0_rgba(0,0,0,0.15)] border border-white/20 hover:shadow-[0_6px_20px_0_rgba(0,0,0,0.2)] transition-all duration-300">
                                                    <span className="text-sm font-semibold text-gray-900 tracking-tight">inspecciono.com</span>
                                                    <svg className="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                    </svg>
                                                </div>
                                            </div>
                                            
                                            {/* Bottom content */}
                                            <div className="space-y-6">
                                                <div className="space-y-4">
                                                    <p className="text-white/95 text-xs font-bold tracking-[0.15em] uppercase letter-spacing-wider">Descubriendo lo mejor</p>
                                                    <h3 className="text-3xl md:text-4xl font-bold text-white leading-[1.2] drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
                                                        "Una elección inteligente. La mejor inspección profesional para tu compra"
                                                    </h3>
                                                </div>
                                                
                                                {/* Feature badges */}
                                                <div className="flex flex-wrap gap-3">
                                                    <div className="flex items-center gap-2.5 px-5 py-2.5 bg-white/30 backdrop-blur-lg rounded-full border border-white/40 shadow-[0_4px_12px_rgba(0,0,0,0.15)] hover:bg-white/35 hover:shadow-[0_6px_16px_rgba(0,0,0,0.2)] transition-all duration-300">
                                                        <div className="w-7 h-7 rounded-full bg-white/40 backdrop-blur-sm border border-white/60 flex items-center justify-center flex-shrink-0 shadow-sm">
                                                            <Shield className="w-4 h-4 text-white drop-shadow-sm" />
                                                        </div>
                                                        <span className="text-sm font-bold text-white drop-shadow-sm">100% Garantía</span>
                                                    </div>
                                                    <div className="flex items-center gap-2.5 px-5 py-2.5 bg-white/30 backdrop-blur-lg rounded-full border border-white/40 shadow-[0_4px_12px_rgba(0,0,0,0.15)] hover:bg-white/35 hover:shadow-[0_6px_16px_rgba(0,0,0,0.2)] transition-all duration-300">
                                                        <div className="w-7 h-7 rounded-full bg-white/40 backdrop-blur-sm border border-white/60 flex items-center justify-center flex-shrink-0 shadow-sm">
                                                            <svg className="w-4 h-4 text-white drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                        </div>
                                                        <span className="text-sm font-bold text-white drop-shadow-sm">Informe detallado</span>
                                                    </div>
                                                </div>
                                                
                                                {/* Pagination dots */}
                                                <div className="flex items-center justify-center gap-2.5 pt-3">
                                                    <div className="w-12 h-1.5 bg-white rounded-full shadow-sm"></div>
                                                    <div className="w-5 h-1.5 bg-white/50 rounded-full"></div>
                                                    <div className="w-5 h-1.5 bg-white/50 rounded-full"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                    <footer className="mt-16 bg-background border-t border-border">
                        <div className="w-full px-4 sm:px-6 mx-auto max-w-7xl">
                            <div className="py-6 sm:py-8">
                                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6">
                                    {/* Copyright */}
                                    <p className="text-sm text-gray-600 text-center sm:text-left">
                                        © 2025 inspecciono.com. Todos los derechos reservados.
                                    </p>
                                    
                                    {/* Links */}
                                    <div className="flex flex-wrap justify-center sm:justify-end gap-4 sm:gap-6 text-sm">
                                        <a href="/privacy-policy.html" className="text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-1">
                                            <Shield className="w-3.5 h-3.5" />
                                            Privacidad
                                        </a>
                                        <a href="/terms.html" className="text-gray-500 hover:text-gray-700 transition-colors">
                                            Términos
                                        </a>
                                        <a href="/contact.html" className="text-gray-500 hover:text-gray-700 transition-colors">
                                            Contacto
                                        </a>
                                        <a href="/become-expert" className="text-gray-500 hover:text-blue-600 transition-colors">
                                            Hazte Experto
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </footer>
                </>
            )}
            {(currentStep === 1 || currentStep === 2 || currentStep === 3) && (
                <div className="w-full h-screen flex flex-col bg-gray-50 overflow-hidden lg:min-h-screen lg:h-auto relative">
                    {currentStep === 1 && (
                        <>
                            {searchParameters.category && searchParameters.serviceTypeId ? (
                                <div className="flex-1 min-h-0 overflow-hidden">
                                    <SearchParameterForm
                                        onComplete={handleParametersComplete}
                                        setCurrentStep={setCurrentStep}
                                        selectedCategory={searchParameters.category}
                                        initialKeywords={searchParameters.keywords || ''}
                                        initialUserSearch={searchParameters.userSearch || ''}
                                        serviceTypeId={searchParameters.serviceTypeId}
                                    />
                                </div>
                            ) : (
                                // Mostrar el formulario con valores por defecto mientras cargan los parámetros
                                <div className="flex-1 min-h-0 overflow-hidden">
                                    <SearchParameterForm
                                        onComplete={handleParametersComplete}
                                        setCurrentStep={setCurrentStep}
                                        selectedCategory={searchParameters.category || null}
                                        initialKeywords={searchParameters.keywords || ''}
                                        initialUserSearch={searchParameters.userSearch || ''}
                                        serviceTypeId={searchParameters.serviceTypeId || null}
                                    />
                                </div>
                            )}
                        </>
                    )}
                    {currentStep === 2 && selectedServiceId && (
                        <div className="flex-1 overflow-y-auto">
                            <ServiceReviewPage
                                serviceId={selectedServiceId}
                                expertProfilePicture={expertProfilePicture}
                                expertName={expertName}
                                servicePrice={servicePrice}
                                serviceDescription={serviceDescription}
                                serviceImageUrls={serviceImageUrls}
                                categoryId={searchParameters.category}
                                serviceTypeId={searchParameters.serviceTypeId}
                                latitude={searchParameters.latitude}
                                longitude={searchParameters.longitude}
                                locationRange={searchParameters.locationRange}
                                currentStep={2}
                                totalSteps={3}
                                onBack={() => setCurrentStep(1)}
                                onContinue={() => setCurrentStep(3)}
                            />
                        </div>
                    )}
                    {currentStep === 3 && selectedServiceId && (
                        <div className="flex-1 overflow-y-auto">
                            <SearchForm
                                parameters={searchParameters as SearchParameters & { latitude: string; longitude: string; locationRange: number }}
                                setCurrentStep={setCurrentStep}
                                onComplete={handleSearchComplete}
                                serviceId={selectedServiceId}
                                setShowSubscriptions={() => (window.location.href = '/suscripciones')}
                                expertProfilePicture={expertProfilePicture}
                                expertName={expertName}
                                servicePrice={servicePrice}
                                serviceDescription={serviceDescription}
                                serviceImageUrls={serviceImageUrls}
                            />
                        </div>
                    )}
                </div>
            )}
            
            {/* Back to Top Button - Mobile only */}
            {showBackToTop && (
                <button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="fixed bottom-6 right-6 lg:hidden z-50 w-12 h-12 bg-gray-900 text-white rounded-full shadow-lg hover:bg-gray-800 active:bg-gray-700 transition-all flex items-center justify-center"
                    aria-label="Volver arriba"
                >
                    <ArrowUp className="w-5 h-5" />
                </button>
            )}
        </div>
    );
};

export default SearchCreationPage;