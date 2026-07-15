import React, { useState, useEffect } from 'react';
import { Car, Home, Shield, CheckCircle, FolderTree, Wrench, ChevronRight, ArrowUp, AlertCircle, X } from 'lucide-react';
import { useCategories } from '../contexts/CategoryContext';
import SearchForm from '../components/SearchForm';
import { SearchParameterForm } from '../components/SearchParameterForm';
import { ServiceReviewPage } from './ServiceReviewPage';
import { useAuth } from '../contexts/AuthContext';
import { showToast } from '../lib/toast';
// HomePresentation movido a /quienes-somos
import { useServiceTypes } from '../hooks/useServiceTypes';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../components/ui/sheet';
import { ErrorDisplay } from '../components/ErrorDisplay';
import { useMfaVerification } from '../contexts/MfaVerificationContext';
import { Button } from '../components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert';
import { useNavigate, useLocation } from 'react-router-dom';
import { mfaService } from '../services/mfaService';
import { Service } from '../hooks/useServiceLoader';
import { useApi } from '../hooks/useApi';
import { API_CONFIG } from '../config/api';
import CountrySelector from '../components/CountrySelector';
import { getCountryCoordinates } from '../utils/countryCoordinates';
import { getCountryName } from '../utils/countries';
import { persistHireSearchLocation } from '../utils/hireSearchContext';
import { Footer } from '../components/Footer';
import SEO from '../components/SEO';
import { MapPageSkeleton } from '../components/ui/map-page-skeleton';

// Libraries ya no son necesarias - el nuevo MapContainer las maneja internamente


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
    const { fetchApi } = useApi();
    // Iniciar en paso 0, pero si hay parámetros en la URL, ir directamente al paso 1
    const [currentStep, setCurrentStep] = useState(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const serviceTypeIdParam = searchParams.get('serviceTypeId');
        const categoryIdParam = searchParams.get('categoryId');
        const stepParam = searchParams.get('step');
        // Si nos piden explícitamente mapa, empezar en paso 1
        if (stepParam === 'map') return 1;
        // Si hay ambos parámetros, empezar en paso 1
        return (serviceTypeIdParam && categoryIdParam) ? 1 : 0;
    });
    const [showPendingMfaBanner, setShowPendingMfaBanner] = useState(false);
    const [showMfaRecommendationBanner, setShowMfaRecommendationBanner] = useState(false);
    const [mfaEnabled, setMfaEnabled] = useState<boolean | null>(null);
    
    // Estado del formulario - debe declararse antes de los hooks que lo usan
    const [searchParameters, setSearchParameters] = useState<Partial<SearchParameters>>({
        keywords: '',
        userSearch: '',
        frequency: 24,
        strictMatchOnly: false,
    });
    
    // Estado del mapa compartido para pasos 1, 2 y 3
    const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [selectedCountry, setSelectedCountry] = useState<string>('es');
    const [isMapLoaded, setIsMapLoaded] = useState<boolean>(false);
    const [areServicesReady, setAreServicesReady] = useState<boolean>(false);
    // ✅ Bloquear la página hasta que mapa + servicios estén listos. Sin esto, el
    //    drawer mostraba estados vacíos antes de que llegaran los expertos del mapa.
    //    Fallback: a los 5s mostramos sí o sí (por si el backend nunca responde).
    const isPageReady = isMapLoaded && areServicesReady;
    
    // Inicializar ubicación con coordenadas de searchParameters o país por defecto
    useEffect(() => {
        if (searchParameters.latitude && searchParameters.longitude) {
            const lat = parseFloat(searchParameters.latitude);
            const lng = parseFloat(searchParameters.longitude);
            if (!isNaN(lat) && !isNaN(lng)) {
                setSelectedLocation({ lat, lng });
            }
        } else if (selectedCountry && !selectedLocation) {
            const countryCoords = getCountryCoordinates(selectedCountry);
            if (countryCoords) {
                setSelectedLocation({ lat: countryCoords.lat, lng: countryCoords.lng });
            }
        }
    }, [searchParameters.latitude, searchParameters.longitude, selectedCountry]);
    
    // El mapa se actualiza automáticamente con el nuevo MapContainer

    // ✅ Fallback: si tras 5s la página sigue oculta (backend lento o caído),
    //    forzamos a mostrarla para que el usuario no se quede en skeleton infinito.
    React.useEffect(() => {
        if (currentStep !== 1) return;
        if (isPageReady) return;
        const t = setTimeout(() => {
            setIsMapLoaded(true);
            setAreServicesReady(true);
        }, 5000);
        return () => clearTimeout(t);
    }, [currentStep, isPageReady]);

    // ✅ El MapPageSkeleton se mantiene montado 300ms más allá de isPageReady=true
    //    (mismo `duration-300` que el fade-in del contenido real) y se desvanece
    //    en paralelo en vez de desmontarse en seco. Antes el skeleton (z-[99999])
    //    desaparecía de golpe mientras el contenido real seguía a medio fade-in,
    //    dejando ver un hueco del fondo blanco durante la transición.
    const [showMapSkeleton, setShowMapSkeleton] = useState(true);
    React.useEffect(() => {
        if (!isPageReady) {
            setShowMapSkeleton(true);
            return;
        }
        const t = setTimeout(() => setShowMapSkeleton(false), 300);
        return () => clearTimeout(t);
    }, [isPageReady]);

    // Notificar a App.tsx cuando estamos en un formulario (step 1, 2 o 3) para ocultar el header en móvil
    React.useEffect(() => {
        if (currentStep === 1 || currentStep === 2 || currentStep === 3) {
            sessionStorage.setItem('isInFormStep', 'true');
        } else {
            sessionStorage.removeItem('isInFormStep');
        }
        // Resetear isMapLoaded cuando se sale del paso 1
        if (currentStep !== 1) {
            setIsMapLoaded(false);
            setAreServicesReady(false);
        }
        // Disparar evento para que App.tsx pueda reaccionar
        window.dispatchEvent(new CustomEvent('formStepChanged', { detail: { step: currentStep } }));
    }, [currentStep]);
    const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
    const [expertProfilePicture, setExpertProfilePicture] = useState<string | undefined>(undefined);
    const [expertName, setExpertName] = useState<string | undefined>(undefined);
    const [servicePrice, setServicePrice] = useState<number | undefined>(undefined);
    // 🛡️ Round 28 CUR-7: divisa del servicio para que el SearchForm muestre la divisa real
    // (no caiga al fallback EUR). Antes el paso 3 (SearchForm) divergía visualmente del paso 2
    // (ServiceReviewPage que sí convertía) — el cliente veía "€" justo antes del checkout aunque
    // ServiceReview le hubiera mostrado "$" con conversión.
    const [serviceCurrency, setServiceCurrency] = useState<string | undefined>(undefined);
    const [serviceDescription, setServiceDescription] = useState<string | undefined>(undefined);
    const [serviceImageUrls, setServiceImageUrls] = useState<string[]>([]);

    // Detectar serviceId desde la URL y cargar el servicio directamente
    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const serviceIdParam = searchParams.get('serviceId');
        const serviceTypeIdParam = searchParams.get('serviceTypeId');
        const categoryIdParam = searchParams.get('categoryId');
        
        // Si hay serviceId en la URL, cargar el servicio y mostrar el formulario
        if (serviceIdParam && !selectedServiceId) {
            const serviceId = parseInt(serviceIdParam, 10);
            if (!isNaN(serviceId)) {
                // Buscar servicio directamente desde la API
                let service = null;
                if (!service) {
                    const loadService = async () => {
                        try {
                            const url = API_CONFIG.endpoints.expert.services.get(serviceId);
                            const fetchedService = await fetchApi<any>(url);
                            if (fetchedService) {
                                setSelectedServiceId(serviceId);
                                setExpertProfilePicture(fetchedService.expert?.profilePictureUrl || fetchedService.expert?.profilePicture);
                                setExpertName(fetchedService.expert?.user?.name || fetchedService.expert?.name);
                                setServicePrice(fetchedService.price);
                                setServiceDescription(fetchedService.conditions || fetchedService.description || '');
                                setServiceImageUrls(fetchedService.imageUrls || []);
                                // Establecer también los parámetros de búsqueda
                                if (fetchedService.serviceTypeId) {
                                    setSearchParameters(prev => ({ ...prev, serviceTypeId: fetchedService.serviceTypeId }));
                                }
                                if (fetchedService.categoryId) {
                                    setSearchParameters(prev => ({ ...prev, category: fetchedService.categoryId }));
                                }
                                // Ir directamente al paso 3 (SearchForm)
                                setCurrentStep(3);
                            }
                        } catch (error) {
                            console.error('Error loading service:', error);
                            // Si falla, establecer los parámetros de la URL y esperar
                            if (serviceTypeIdParam) {
                                const serviceTypeId = parseInt(serviceTypeIdParam, 10);
                                if (!isNaN(serviceTypeId)) {
                                    setSearchParameters(prev => ({ ...prev, serviceTypeId }));
                                }
                            }
                            if (categoryIdParam) {
                                const categoryId = parseInt(categoryIdParam, 10);
                                if (!isNaN(categoryId)) {
                                    setSearchParameters(prev => ({ ...prev, category: categoryId }));
                                }
                            }
                        }
                    };
                    loadService();
                } else {
                    // Configurar el servicio
                    setSelectedServiceId(serviceId);
                    setExpertProfilePicture(service.expert?.profilePictureUrl || service.expert?.profilePicture);
                    setExpertName(service.expert?.user?.name || service.expert?.name);
                    setServicePrice(service.price);
                    setServiceDescription(service.conditions || service.description || '');
                    setServiceImageUrls(service.imageUrls || []);
                    // Establecer también los parámetros de búsqueda si el servicio los tiene
                    if (service.serviceTypeId) {
                        setSearchParameters(prev => ({ ...prev, serviceTypeId: service.serviceTypeId }));
                    }
                    if (service.categoryId) {
                        setSearchParameters(prev => ({ ...prev, category: service.categoryId }));
                    }
                    // Ir directamente al paso 3 (SearchForm) como cuando seleccionas en el mapa
                    setCurrentStep(3);
                }
            }
        }
        
        // Si hay serviceTypeId o categoryId (sin serviceId), establecerlos en searchParameters
        // y, si viene step=map, forzar paso 1 (mapa)
        if ((serviceTypeIdParam || categoryIdParam) && !serviceIdParam) {
            const stepParam = searchParams.get('step');
            let hasChanges = false;
            if (serviceTypeIdParam) {
                const serviceTypeId = parseInt(serviceTypeIdParam, 10);
                if (!isNaN(serviceTypeId)) {
                    setSearchParameters(prev => {
                        if (prev.serviceTypeId !== serviceTypeId) {
                            hasChanges = true;
                            return { ...prev, serviceTypeId };
                        }
                        return prev;
                    });
                }
            }
            if (categoryIdParam) {
                const categoryId = parseInt(categoryIdParam, 10);
                if (!isNaN(categoryId)) {
                    setSearchParameters(prev => {
                        if (prev.category !== categoryId) {
                            hasChanges = true;
                            return { ...prev, category: categoryId };
                        }
                        return prev;
                    });
                }
            }

            // Si se abre directamente el mapa sin serviceTypeId, usar
            // "Búsqueda web + revisión" por defecto para evitar mapas vacíos.
            if (stepParam === 'map' && !serviceTypeIdParam) {
                setSearchParameters(prev => {
                    if (prev.serviceTypeId !== 2) {
                        hasChanges = true;
                        return { ...prev, serviceTypeId: 2 };
                    }
                    return prev;
                });
            }
            // Si hay serviceTypeId Y categoryId, ir directamente al paso 1 (mapa)
            // o si la URL pide explícitamente step=map
            if ((serviceTypeIdParam && categoryIdParam) || stepParam === 'map') {
                setCurrentStep(1);
            }
        }
    }, [location.search, selectedServiceId, fetchApi]);

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
        let previousState = { hasPending: false, isAuth: false };
        
        const checkPendingVerification = () => {
            // ✅ Leer directamente del localStorage en lugar de usar el hook
            const hasPending = localStorage.getItem('mfa-verification-pending') === 'true';
            
            // Solo actualizar si el estado cambió
            if (previousState.hasPending !== hasPending || previousState.isAuth !== isAuthenticated) {
                previousState = { hasPending, isAuth: isAuthenticated };
                if (isAuthenticated && hasPending) {
                    setShowPendingMfaBanner(true);
                } else {
                    setShowPendingMfaBanner(false);
                }
            }
        };

        // Verificar al cargar
        checkPendingVerification();

        // ✅ Escuchar cambios en localStorage para actualizar el banner (funciona entre pestañas)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'mfa-verification-pending') {
                checkPendingVerification();
            }
        };

        // ✅ Escuchar eventos personalizados cuando se limpia la verificación (misma pestaña)
        const handleVerificationCleared = () => {
            setTimeout(() => {
                checkPendingVerification();
            }, 50);
        };

        // ✅ Verificación periódica como fallback (cada 30 segundos para evitar bucles)
        const intervalId = setInterval(() => {
            checkPendingVerification();
        }, 30000); // Aumentado a 30 segundos para evitar bucles infinitos

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
        serviceCurrency?: string;
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

        const locationName =
            typeof (parameters as { locationName?: string }).locationName === 'string'
                ? (parameters as { locationName?: string }).locationName!.trim()
                : '';
        if (locationName || parameters.latitude) {
            persistHireSearchLocation({
                locationName: locationName || 'Ubicación seleccionada',
                latitude: parameters.latitude ?? null,
                longitude: parameters.longitude ?? null,
            });
        }
        
        // Si viene el servicio seleccionado, guardarlo y pasar al siguiente paso (ServiceReviewPage)
        if (parameters.serviceId) {
            setSelectedServiceId(parameters.serviceId);
            setExpertProfilePicture(parameters.expertProfilePicture);
            setExpertName(parameters.expertName);
            setServicePrice(parameters.servicePrice);
            setServiceCurrency(parameters.serviceCurrency);
            setServiceDescription(parameters.serviceDescription);
            setServiceImageUrls(parameters.serviceImageUrls || []);
            setCurrentStep(2); // Paso 2: ServiceReviewPage (revisión del servicio)
        } else {
            // Si no viene servicio, quedarse en el paso actual
            setCurrentStep(1);
        }
    };


    const handleSearchComplete = () => {
        showToast('success', '¡Búsqueda creada con éxito!', 6000, {
            description: 'Te avisaremos en cuanto un experto coincida con tu búsqueda.',
            action: { label: 'Ver mis búsquedas', onClick: () => navigate('/hires') },
        });
        setCurrentStep(0);
        setSearchParameters({
            keywords: '',
            userSearch: '',
            category: 1,
            frequency: 24,
            serviceTypeId: 2,
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
    
    // Función para manejar selección de servicio en el mapa
    const handleServiceSelect = (service: Service) => {
        setSelectedServiceId(service.id);
        // Extraer información del servicio
        const expert = (service as any).raw?.expert || (service as any).expert || {};
        setExpertProfilePicture(expert.profilePictureUrl || expert.ProfilePictureUrl);
        setExpertName(expert.user?.name || expert.User?.Name || service.name);
        setServicePrice(service.price);
        setServiceDescription((service as any).raw?.serviceTypeDescription || service.type || '');
        setServiceImageUrls((service as any).raw?.imageUrls || []);
        
        // Actualizar parámetros de búsqueda
        if ((service as any).raw?.serviceTypeId || (service as any).serviceTypeId) {
            setSearchParameters(prev => ({ 
                ...prev, 
                serviceTypeId: (service as any).raw?.serviceTypeId || (service as any).serviceTypeId 
            }));
        }
        if ((service as any).raw?.categoryId || (service as any).categoryId) {
            setSearchParameters(prev => ({ 
                ...prev, 
                category: (service as any).raw?.categoryId || (service as any).categoryId 
            }));
        }
    };

    return (
        <div className="relative w-full bg-background" style={{ transition: 'none', minHeight: '100vh' }}>
            <SEO
                title="Busca expertos cerca de ti en el mapa | Inspecciono"
                description="Elige qué quieres inspeccionar (coche, piso, moto…) y encuentra peritos verificados cerca de la ubicación del producto. Compara precios y valoraciones."
                canonical="/hire"
            />
            {currentStep === 0 && (
                <>
                    {/* Ya no mostramos HomePresentation aquí - se movió a /quienes-somos */}
                    {/* Redirigir directamente al paso 1 si hay parámetros */}
                    
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
                    
                    <div className="mt-16">
                        <Footer />
                    </div>
                </>
            )}
                    {currentStep === 1 && (
                <>
                    {/* ✅ Mostrar skeleton mientras carga el mapa Y los servicios.
                        Sin la espera a servicios, el usuario veía la página vacía
                        y al rato aparecían las cards → mal UX. `fadingOut` lo cruza
                        en paralelo con el fade-in del contenido real (ver showMapSkeleton). */}
                    {showMapSkeleton && <MapPageSkeleton fadingOut={isPageReady} />}

                    <div className={`relative flex h-[100dvh] w-full flex-col overflow-hidden bg-white ${!isPageReady ? 'pointer-events-none opacity-0' : 'opacity-100 transition-opacity duration-300 ease-out motion-reduce:transition-none'}`}>
                        {searchParameters.category && searchParameters.serviceTypeId ? (
                            <SearchParameterForm
                                onComplete={handleParametersComplete}
                                setCurrentStep={setCurrentStep}
                                selectedCategory={searchParameters.category}
                                initialKeywords={searchParameters.keywords || ''}
                                initialUserSearch={searchParameters.userSearch || ''}
                                serviceTypeId={searchParameters.serviceTypeId}
                                onMapReady={() => setIsMapLoaded(true)}
                                onServicesReady={() => setAreServicesReady(true)}
                            />
                        ) : (
                            <SearchParameterForm
                                onComplete={handleParametersComplete}
                                setCurrentStep={setCurrentStep}
                                selectedCategory={searchParameters.category || null}
                                initialKeywords={searchParameters.keywords || ''}
                                initialUserSearch={searchParameters.userSearch || ''}
                                serviceTypeId={searchParameters.serviceTypeId || null}
                                onMapReady={() => setIsMapLoaded(true)}
                                onServicesReady={() => setAreServicesReady(true)}
                            />
                        )}
                    </div>
                </>
            )}
            
                    {currentStep === 2 && selectedServiceId && (
                <div className="w-full min-h-screen bg-gray-50 relative">
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
                <div className="w-full h-[100dvh] flex flex-col bg-gray-50 overflow-hidden lg:min-h-screen lg:h-auto relative">
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
                                serviceCurrency={serviceCurrency}
                                serviceDescription={serviceDescription}
                                serviceImageUrls={serviceImageUrls}
                            />
                        </div>
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
