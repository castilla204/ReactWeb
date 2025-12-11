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
import { useLoadScript } from '@react-google-maps/api';
import { LocationMap } from '../components/LocationMap';
import { useMapExperts } from '../hooks/useMapExperts';
import { useServices } from '../hooks/useServices';
import CountrySelector from '../components/CountrySelector';
import { getCountryCoordinates } from '../utils/countryCoordinates';
import { getCountryName } from '../utils/countries';
import Autocomplete from 'react-google-autocomplete';
import { Search } from 'lucide-react';
import { FormProgressTimeline } from '../components/FormProgressTimeline';

const libraries: ('drawing' | 'geometry' | 'places')[] = ['drawing', 'geometry', 'places'];


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
    
    // Estado del formulario - debe declararse antes de los hooks que lo usan
    const [searchParameters, setSearchParameters] = useState<Partial<SearchParameters>>({
        keywords: '',
        userSearch: '',
        frequency: 24,
        strictMatchOnly: false,
    });
    
    // Estado del mapa compartido para pasos 1, 2 y 3
    const { isLoaded: isMapLoaded, loadError: mapLoadError } = useLoadScript({
        googleMapsApiKey: "AIzaSyBNEdqihExcXPnWw_TJgHFzsPXS7BIazyM",
        libraries
    });
    const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
    const [selectedCountry, setSelectedCountry] = useState<string>('es');
    const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [searchAddress, setSearchAddress] = useState<string>('');
    const searchInputRef = React.useRef<HTMLInputElement>(null);
    const [isGeocoding, setIsGeocoding] = useState<boolean>(false);
    
    // Cargar expertos y servicios para el mapa
    const { experts: mapExperts } = useMapExperts(
        searchParameters.category ?? null,
        searchParameters.serviceTypeId ?? null
    );
    
    const { services: mapServices } = useServices({
        categoryId: searchParameters.category || undefined,
        serviceTypeId: searchParameters.serviceTypeId || undefined,
        latitude: searchParameters.latitude || undefined,
        longitude: searchParameters.longitude || undefined,
        locationRange: searchParameters.locationRange || 25,
    });
    
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
    
    // Actualizar mapa cuando cambia la ubicación
    useEffect(() => {
        if (mapInstance && selectedLocation) {
            mapInstance.panTo(selectedLocation);
            if (searchParameters.locationRange) {
                const radius = searchParameters.locationRange;
                const zoom = Math.min(14, Math.max(4, Math.floor(14 - Math.log2((radius * 1000) / 500))));
                mapInstance.setZoom(zoom);
            }
        }
    }, [mapInstance, selectedLocation, searchParameters.locationRange]);
    
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
    
    // Función para manejar la selección de lugar en el mapa
    const handlePlaceSelected = (place: google.maps.places.PlaceResult) => {
        if (!place.geometry || !place.geometry.location) return;
        
        setIsGeocoding(true);
        const location = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
        };
        
        const address = place.formatted_address || '';
        setSelectedLocation(location);
        setSearchAddress(address);
        
        // Actualizar searchParameters con la nueva ubicación
        setSearchParameters(prev => ({
            ...prev,
            latitude: location.lat.toString(),
            longitude: location.lng.toString(),
            locationName: address
        }));
        
        // Actualizar mapa
        if (mapInstance) {
            mapInstance.panTo(location);
            const radius = searchParameters.locationRange || 25;
            const zoom = Math.min(14, Math.max(4, Math.floor(14 - Math.log2((radius * 1000) / 500))));
            mapInstance.setZoom(zoom);
        }
        
        setIsGeocoding(false);
    };
    
    // Función para manejar clic en el mapa
    const handleMapClick = (e: google.maps.MapMouseEvent) => {
        if (!e.latLng) return;
        const location = {
            lat: e.latLng.lat(),
            lng: e.latLng.lng()
        };
        setSelectedLocation(location);
        setSearchParameters(prev => ({
            ...prev,
            latitude: location.lat.toString(),
            longitude: location.lng.toString()
        }));
    };

    return (
        <div className="relative w-full bg-background" style={{ transition: 'none', minHeight: '100vh' }}>
            {currentStep === 0 && (
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
                                    <div className="space-y-8 w-full">
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
            )}
                    {currentStep === 1 && (
                <div className="w-full h-screen flex flex-col lg:flex-row bg-gray-50 overflow-hidden lg:min-h-screen lg:h-auto relative">
                    {/* Timeline Header */}
                    <FormProgressTimeline currentStep={1} onBack={() => setCurrentStep(0)} />
                    
                    {/* Left Side - Content */}
                    <div className="flex-1 flex flex-col overflow-hidden lg:overflow-y-auto" style={{ paddingTop: '64px' }}>
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
                    </div>
                    
                    {/* Right Side - Map (Desktop only, solo en paso 1) */}
                    <div className="hidden lg:flex lg:flex-1 relative bg-gray-100 border-l border-gray-200">
                            {mapLoadError ? (
                                <div className="h-full w-full flex items-center justify-center bg-gray-100">
                                    <div className="text-red-500">Error al cargar el mapa</div>
                                </div>
                            ) : (
                                <>
                                    {/* Map ocupa todo el espacio - La barra de búsqueda está en SearchParameterForm */}
                                    <div className="absolute inset-0">
                                        {isMapLoaded && selectedLocation ? (
                                            <LocationMap
                                                selectedLocation={selectedLocation}
                                                mapExperts={mapExperts}
                                                services={mapServices}
                                                selectedService={selectedServiceId}
                                                onMapClick={handleMapClick}
                                                onMapLoad={(map) => {
                                                    setMapInstance(map);
                                                    if (selectedLocation) {
                                                        map.panTo(selectedLocation);
                                                        const radius = searchParameters.locationRange || 25;
                                                        const zoom = Math.min(14, Math.max(4, Math.floor(14 - Math.log2((radius * 1000) / 500))));
                                                        map.setZoom(zoom);
                                                    }
                                                }}
                                                onServiceSelect={(serviceId) => {
                                                    // No hacer nada, solo mostrar en el mapa
                                                }}
                                                locationRange={searchParameters.locationRange || 25}
                                                isMobile={false}
                                                isLoaded={isMapLoaded}
                                            />
                                        ) : null}
                                    </div>
                        </>
                    )}
                        </div>
                </div>
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
                <div className="w-full h-screen flex flex-col bg-gray-50 overflow-hidden lg:min-h-screen lg:h-auto relative">
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
