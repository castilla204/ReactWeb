import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';
import { useApi } from '../hooks/useApi';
import { API_CONFIG } from '../config/api';
import { Service } from '../hooks/useServices';
import { PreHireChat } from '../components/PreHireChat';
import { ArrowLeft, MoreVertical, MapPin, MessageCircle, Star, Clock, Heart, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Dialog, DialogContent } from '../components/ui/dialog';
import { getCountryName } from '../utils/countries';
import CountryFlag from '../components/CountryFlag';
import { useServiceFavorites } from '../hooks/useServiceFavorites';
import { showToast } from '../lib/toast';
import { parsePositiveIntegerParam } from '../utils/routeParams';
import AppointmentMap from '../components/AppointmentMap';

export function PreHireChatPage() {
    const { serviceId } = useParams<{ serviceId: string }>();
    const navigate = useNavigate();
    const { isAuthenticated, user, updateUser } = useAuth();
    const { fetchApi } = useApi();
    
    const serviceIdNumber = parsePositiveIntegerParam(serviceId) ?? 0;
    const token = authService.getAccessToken() || '';
    const userId = user?.id || user?.Id || 0;
    
    const [service, setService] = useState<Service | null>(null);
    const [loading, setLoading] = useState(true);
    const [showLoginDialog, setShowLoginDialog] = useState(false);
    const [isGoogleReady, setIsGoogleReady] = useState(false);
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [authStep, setAuthStep] = useState<string>('');
    const [isChatConnected, setIsChatConnected] = useState(false);
    const [showAvatarModal, setShowAvatarModal] = useState(false);
    const [showMapPreview, setShowMapPreview] = useState(false);
    const googleButtonRefLoginDialog = useRef<HTMLDivElement>(null);
    
    // ✅ Bloquear scroll del body y usar altura dinámica del viewport en móviles
    useEffect(() => {
        const originalOverflow = document.body.style.overflow;
        const originalPosition = document.body.style.position;
        const originalWidth = document.body.style.width;
        const originalHeight = document.body.style.height;
        const originalTop = document.body.style.top;
        const originalLeft = document.body.style.left;
        
        // Función para calcular altura real del viewport (considera barra de direcciones en móviles)
        const setViewportHeight = () => {
            // Usar window.innerHeight que es más preciso en móviles (excluye barra de Chrome)
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };
        
        // Calcular altura inicial
        setViewportHeight();
        
        // Recalcular en resize, orientationchange y visualViewport (importante para móviles)
        const handleResize = () => {
            // Pequeño delay para asegurar que la barra de Chrome se haya ocultado/mostrado
            setTimeout(setViewportHeight, 100);
        };
        
        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleResize);
        
        // Visual Viewport API - más preciso para móviles
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', handleResize);
            window.visualViewport.addEventListener('scroll', handleResize);
        }
        
        // Bloquear scroll del body
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
        document.body.style.height = '100%';
        document.body.style.top = '0';
        document.body.style.left = '0';
        
        // También bloquear scroll del html
        const html = document.documentElement;
        const originalHtmlOverflow = html.style.overflow;
        html.style.overflow = 'hidden';
        
        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleResize);
            if (window.visualViewport) {
                window.visualViewport.removeEventListener('resize', handleResize);
                window.visualViewport.removeEventListener('scroll', handleResize);
            }
            document.body.style.overflow = originalOverflow || '';
            document.body.style.position = originalPosition || '';
            document.body.style.width = originalWidth || '';
            document.body.style.height = originalHeight || '';
            document.body.style.top = originalTop || '';
            document.body.style.left = originalLeft || '';
            html.style.overflow = originalHtmlOverflow || '';
            document.documentElement.style.removeProperty('--vh');
        };
    }, []);
    
    // Hook para favoritos - DEBE estar antes de cualquier return
    const { toggleFavoriteAsync, checkFavorite } = useServiceFavorites();
    // Llamar checkFavorite siempre, incluso si serviceIdNumber es 0 (el hook manejará el enabled)
    const favoriteQuery = checkFavorite(serviceIdNumber);
    const favoriteData = favoriteQuery.data;
    const [isFavorite, setIsFavorite] = useState(favoriteData?.isFavorite || false);
    
    // Usar useRef para mantener una referencia estable a fetchApi y evitar bucles infinitos
    const fetchApiRef = useRef(fetchApi);
    fetchApiRef.current = fetchApi;
    
    // Ref para evitar múltiples llamadas simultáneas
    const isLoadingRef = useRef(false);
    const loadedServiceIdRef = useRef<number | null>(null);
    
    // Google Icon Component
    const GoogleIcon = () => (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
    );
    
    // Inicializar Google Sign-In
    useEffect(() => {
        const initGoogleSignIn = () => {
            if (window.google?.accounts?.id) {
                const clientId = '61603823707-4vsp43naifci8t893hdc276kkhbvn49a.apps.googleusercontent.com';
                
                window.google.accounts.id.initialize({
                    client_id: clientId,
                    callback: async (response: any) => {
                        try {
                            setIsAuthenticating(true);
                            setAuthStep('Verificando credenciales...');
                            
                            if (!response.credential) {
                                throw new Error('No credential received from Google');
                            }
                            
                            setAuthStep('Autenticando con el servidor...');
                            const result = await authService.googleAuth(response.credential);
                            
                            if (!result.success) {
                                throw new Error('Authentication failed');
                            }
                            
                            setAuthStep('Configurando sesión...');
                            const token = authService.getAccessToken();
                            if (result.user && token) {
                                updateUser(result.user, token, () => {
                                    setAuthStep('Redirigiendo...');
                                    setShowLoginDialog(false);
                                    
                                    // Redirigir según la ruta guardada
                                    setTimeout(() => {
                                        const redirectPath = sessionStorage.getItem('redirectAfterLogin');
                                        if (redirectPath) {
                                            sessionStorage.removeItem('redirectAfterLogin');
                                            navigate(redirectPath, { replace: true });
                                        }
                                    }, 500);
                                });
                            } else {
                                throw new Error('No token received after authentication');
                            }
                        } catch (error: any) {
                            console.error('Error en Google Auth:', error);
                            showToast('error', error.message || 'Error al iniciar sesión');
                            setAuthStep('');
                        } finally {
                            setIsAuthenticating(false);
                        }
                    },
                });
                
                // Renderizar en Login Dialog
                if (googleButtonRefLoginDialog.current) {
                    window.google.accounts.id.renderButton(googleButtonRefLoginDialog.current, {
                        type: 'standard',
                        theme: 'outline',
                        size: 'large',
                        text: 'signin_with',
                        width: '100%',
                    });
                }
                
                setIsGoogleReady(true);
            } else {
                setTimeout(initGoogleSignIn, 100);
            }
        };
        
        // Cargar script de Google si no está cargado
        if (!window.google?.accounts?.id) {
            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            script.onload = () => {
                setTimeout(initGoogleSignIn, 100);
            };
            document.head.appendChild(script);
        } else {
            initGoogleSignIn();
        }
    }, []);
    
    // Renderizar botón de Google cuando se abre el diálogo de login
    useEffect(() => {
        if (showLoginDialog && window.google?.accounts?.id && googleButtonRefLoginDialog.current) {
            googleButtonRefLoginDialog.current.innerHTML = '';
            
            window.google.accounts.id.renderButton(googleButtonRefLoginDialog.current, {
                type: 'standard',
                theme: 'outline',
                size: 'large',
                text: 'signin_with',
                width: '100%',
            });
        }
    }, [showLoginDialog]);
    
    const handleGoogleSignIn = () => {
        if (showLoginDialog && googleButtonRefLoginDialog.current) {
            const googleButton = googleButtonRefLoginDialog.current.querySelector('div[role="button"]') as HTMLElement;
            if (googleButton) {
                googleButton.click();
                return;
            }
        }
        
        if (window.google?.accounts?.id?.prompt) {
            window.google.accounts.id.prompt();
        }
    };
    
    // Cargar información del servicio
    useEffect(() => {
        const loadService = async () => {
            if (!serviceIdNumber || serviceIdNumber === 0) {
                setLoading(false);
                return;
            }
            
            // Evitar cargar si ya tenemos el servicio cargado con este ID
            if (loadedServiceIdRef.current === serviceIdNumber) {
                setLoading(false);
                return;
            }
            
            // Evitar múltiples llamadas simultáneas
            if (isLoadingRef.current) {
                return;
            }
            
            try {
                isLoadingRef.current = true;
                setLoading(true);
                const url = API_CONFIG.endpoints.expert.services.get(serviceIdNumber);
                const rawService = await fetchApiRef.current<any>(url);
                
                if (rawService) {
                    // Transformar PascalCase a camelCase
                    const transformService = (service: any): Service => {
                        return {
                            id: service.Id || service.id,
                            expertProfileId: service.ExpertProfileId || service.expertProfileId,
                            categoryId: service.CategoryId || service.categoryId,
                            serviceTypeId: service.ServiceTypeId || service.serviceTypeId,
                            serviceTypeName: service.ServiceTypeName || service.serviceTypeName,
                            serviceTypeDescription: service.ServiceTypeDescription || service.serviceTypeDescription,
                            serviceTypeCategoryId: service.ServiceTypeCategoryId || service.serviceTypeCategoryId,
                            serviceTypeCategoryName: service.ServiceTypeCategoryName || service.serviceTypeCategoryName,
                            requiresAppointment: service.RequiresAppointment ?? service.requiresAppointment,
                            price: service.Price ?? service.price ?? 0,
                            conditions: service.Conditions || service.conditions || '',
                            durationInHours: service.DurationInHours ?? service.durationInHours,
                            createdAt: service.CreatedAt || service.createdAt,
                            imageUrls: service.ImageUrls || service.imageUrls || [],
                            categoryName: service.CategoryName || service.categoryName,
                            completedSearches: service.CompletedSearches ?? service.completedSearches,
                            averageRating: service.AverageRating ?? service.averageRating ?? 0,
                            isActive: service.IsActive ?? service.isActive ?? true,
                            selectedDeliverableTypes: (service.SelectedDeliverableTypes || service.selectedDeliverableTypes || []).map((dt: any) => ({
                                id: dt.Id || dt.id,
                                name: dt.Name || dt.name,
                                displayName: dt.DisplayName || dt.displayName,
                                description: dt.Description || dt.description,
                                isRequired: dt.IsRequired ?? dt.isRequired,
                                isActive: dt.IsActive ?? dt.isActive,
                                sortOrder: dt.SortOrder ?? dt.sortOrder,
                            })),
                            expert: service.Expert || service.expert ? {
                                id: (service.Expert || service.expert).Id || (service.Expert || service.expert).id,
                                profilePictureUrl: (service.Expert || service.expert).ProfilePictureUrl || (service.Expert || service.expert).profilePictureUrl,
                                description: (service.Expert || service.expert).Description || (service.Expert || service.expert).description,
                                stripeAccountId: (service.Expert || service.expert).StripeAccountId || (service.Expert || service.expert).stripeAccountId,
                                createdAt: (service.Expert || service.expert).CreatedAt || (service.Expert || service.expert).createdAt,
                                user: {
                                    name: ((service.Expert || service.expert).User || (service.Expert || service.expert).user)?.Name || ((service.Expert || service.expert).User || (service.Expert || service.expert).user)?.name || '',
                                    email: ((service.Expert || service.expert).User || (service.Expert || service.expert).user)?.Email || ((service.Expert || service.expert).User || (service.Expert || service.expert).user)?.email || '',
                                    profilePictureUrl: ((service.Expert || service.expert).User || (service.Expert || service.expert).user)?.ProfilePictureUrl || ((service.Expert || service.expert).User || (service.Expert || service.expert).user)?.profilePictureUrl,
                                },
                                reviews: ((service.Expert || service.expert).Reviews || (service.Expert || service.expert).reviews || []).map((review: any) => ({
                                    id: review.Id || review.id,
                                    score: review.Score ?? review.score,
                                    description: review.Description || review.description,
                                    createdAt: review.CreatedAt || review.createdAt,
                                })),
                                timezone: (service.Expert || service.expert).Timezone || (service.Expert || service.expert).timezone,
                                country: (service.Expert || service.expert).Country || (service.Expert || service.expert).country,
                                city: (service.Expert || service.expert).City || (service.Expert || service.expert).city || null,
                                latitude: (service.Expert || service.expert).Latitude || (service.Expert || service.expert).latitude,
                                longitude: (service.Expert || service.expert).Longitude || (service.Expert || service.expert).longitude,
                                locationRange: (service.Expert || service.expert).LocationRange || (service.Expert || service.expert).locationRange,
                                currentAvailability: (service.Expert || service.expert).CurrentAvailability || (service.Expert || service.expert).currentAvailability ? {
                                    id: ((service.Expert || service.expert).CurrentAvailability || (service.Expert || service.expert).currentAvailability).Id || ((service.Expert || service.expert).CurrentAvailability || (service.Expert || service.expert).currentAvailability).id,
                                    daysOfWeek: ((service.Expert || service.expert).CurrentAvailability || (service.Expert || service.expert).currentAvailability).DaysOfWeek || ((service.Expert || service.expert).CurrentAvailability || (service.Expert || service.expert).currentAvailability).daysOfWeek || [],
                                    startTime: ((service.Expert || service.expert).CurrentAvailability || (service.Expert || service.expert).currentAvailability).StartTime || ((service.Expert || service.expert).CurrentAvailability || (service.Expert || service.expert).currentAvailability).startTime,
                                    endTime: ((service.Expert || service.expert).CurrentAvailability || (service.Expert || service.expert).currentAvailability).EndTime || ((service.Expert || service.expert).CurrentAvailability || (service.Expert || service.expert).currentAvailability).endTime,
                                    effectiveFrom: ((service.Expert || service.expert).CurrentAvailability || (service.Expert || service.expert).currentAvailability).EffectiveFrom || ((service.Expert || service.expert).CurrentAvailability || (service.Expert || service.expert).currentAvailability).effectiveFrom,
                                } : undefined,
                            } : undefined,
                        };
                    };
                    
                    const transformedService = transformService(rawService);
                    setService(transformedService);
                    loadedServiceIdRef.current = transformedService.id;
                }
            } catch (error) {
                console.error('Error loading service:', error);
            } finally {
                setLoading(false);
                isLoadingRef.current = false;
            }
        };
        
        loadService();
    }, [serviceIdNumber]);
    
    // Actualizar estado de favorito cuando cambian los datos - DEBE estar antes de cualquier return
    useEffect(() => {
        if (favoriteData?.isFavorite !== undefined) {
            setIsFavorite(favoriteData.isFavorite);
        }
    }, [favoriteData?.isFavorite]);
    
    // ✅ El ProtectedRoute ya maneja la autenticación, solo verificamos serviceId
    if (serviceIdNumber === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600 mb-4">ID de servicio inválido</p>
                </div>
            </div>
        );
    }
    
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600 mb-4">Cargando información del servicio...</p>
                </div>
            </div>
        );
    }
    
    if (!service) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600 mb-4">No se pudo cargar la información del servicio.</p>
                </div>
            </div>
        );
    }
    
    const serviceImage = service?.imageUrls?.[0] || '';
    const expertName = service?.expert?.user?.name || 'Experto';
    const expertAvatar = service?.expert?.profilePictureUrl || '';
    const expertRating = service?.averageRating || 0;
    const reviewsCount = service?.expert?.reviews?.length || 0;
    const expertCity = service?.expert?.city || null;
    const expertCountry = service?.expert?.country || null;
    const expertCountryName = expertCountry ? getCountryName(expertCountry) : null;
    const toFiniteNumber = (value: unknown): number | null => {
        if (value === null || value === undefined || value === '') return null;
        const parsed = typeof value === 'string' ? Number.parseFloat(value) : Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    };
    const expertLatitude = toFiniteNumber(service?.expert?.latitude ?? service?.expertLatitude);
    const expertLongitude = toFiniteNumber(service?.expert?.longitude ?? service?.expertLongitude);
    const expertRange = toFiniteNumber(service?.expert?.locationRange) ?? 25;
    const hasExpertLocation = expertLatitude !== null && expertLongitude !== null;
    const locationLabel = expertCity
        ? `${expertCity}${expertCountryName ? `, ${expertCountryName}` : ''}`
        : expertCountryName || 'Zona no especificada';
    
    // Calcular tiempo de respuesta promedio (simulado - en producción vendría del backend)
    const responseTime = reviewsCount > 0 ? 'Menos de 1 hora' : null;
    
    // Handler para favorito
    const handleFavoriteClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        
        if (!isAuthenticated) {
            showToast('info', 'Inicia sesión para guardar favoritos', 3000);
            return;
        }
        
        try {
            const result = await toggleFavoriteAsync(serviceIdNumber);
            setIsFavorite(result.isFavorite);
            if (result.isFavorite) {
                showToast('success', result.message || 'Agregado a favoritos', 2000);
            } else {
                showToast('success', 'Favorito eliminado', 2000);
            }
        } catch (error: any) {
            console.error('Error al actualizar favorito:', error);
            showToast('error', error.message || 'Error al actualizar favorito', 3000);
        }
    };
    
    // Handler para contratar
    const handleHireClick = () => {
        if (!isAuthenticated) {
            sessionStorage.setItem('redirectAfterLogin', `/checkout/${serviceIdNumber}`);
            setShowLoginDialog(true);
            return;
        }
        navigate(`/checkout/${serviceIdNumber}`);
    };
    
    return (
        <div 
            className="fixed inset-0 bg-gray-50 flex flex-col overflow-hidden" 
            style={{ 
                height: 'calc(var(--vh, 1vh) * 100)', // Fallback para navegadores que no soportan dvh
            }}
        >
            {/* Header con información del servicio - Estilo Wallapop */}
            <div className="bg-gray-50 flex-shrink-0 shadow-sm border-b border-gray-200">
                <div className="max-w-4xl mx-auto">
                    {/* Header superior con botón atrás y menú */}
                    <div className="flex items-center justify-between px-4 py-1.5">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(-1)}
                            className="flex-shrink-0"
                            aria-label="Volver a la página anterior"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        
                        {/* Información del experto en desktop */}
                        <div className="hidden md:flex items-center gap-3 flex-1 ml-4">
                            <button
                                type="button"
                                className="relative cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => setShowAvatarModal(true)}
                                aria-label={`Ampliar foto de ${expertName}`}
                            >
                                <Avatar className="w-10 h-10">
                                    <AvatarImage src={expertAvatar} alt={expertName} />
                                    <AvatarFallback className="bg-gray-900 text-white text-sm">
                                        {expertName.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                {isChatConnected && (
                                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full animate-pulse" aria-label="Chat conectado"></span>
                                )}
                            </button>
                            <Link 
                                to={`/service/${serviceIdNumber}`}
                                className="font-semibold text-gray-900 hover:opacity-80 transition-opacity"
                            >
                                {expertName}
                            </Link>
                        </div>
                        
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="flex-shrink-0" aria-label="Abrir opciones del chat">
                                    <MoreVertical className="w-5 h-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => navigate(`/service/${serviceIdNumber}`)}>
                                    Ver servicio
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    Reportar usuario
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600">
                                    Bloquear usuario
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    
                    {/* Información del servicio - Móvil */}
                    <div className="md:hidden">
                        <div className="px-4 py-3">
                            {/* Sección del experto - A la derecha de la foto */}
                            <div className="mb-3">
                                <div className="flex items-start gap-3">
                                    {serviceImage && (
                                        <div 
                                            className="relative w-16 h-16 rounded-lg flex-shrink-0 bg-gray-200 bg-cover bg-center overflow-hidden"
                                            style={{ backgroundImage: `url(${serviceImage})` }}
                                        />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <Link 
                                            to={`/service/${serviceIdNumber}`}
                                            className="block"
                                        >
                                            <div 
                                                style={{
                                                    fontSize: '14px',
                                                    lineHeight: '20px',
                                                    fontWeight: 400,
                                                    color: 'rgb(34, 34, 34)',
                                                    fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                    marginBottom: '4px',
                                                }}
                                            >
                                                {expertName}
                                            </div>
                                            {expertRating > 0 && (
                                                <div className="flex items-center gap-1.5">
                                                    <div className="flex items-center gap-0.5">
                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                            <Star
                                                                key={star}
                                                                className={`w-3.5 h-3.5 ${
                                                                    star <= Math.round(expertRating)
                                                                        ? 'fill-gray-900 text-gray-900'
                                                                        : 'fill-gray-200 text-gray-200'
                                                                }`}
                                                            />
                                                        ))}
                                                    </div>
                                                    <span 
                                                        style={{
                                                            fontSize: '14px',
                                                            lineHeight: '20px',
                                                            fontWeight: 400,
                                                            color: 'rgb(113, 113, 113)',
                                                            fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                        }}
                                                    >
                                                        {expertRating.toFixed(1)} ({reviewsCount})
                                                    </span>
                                                </div>
                                            )}
                                            {(expertCity || expertCountryName) && (
                                                <div 
                                                    style={{
                                                        fontSize: '14px',
                                                        lineHeight: '20px',
                                                        fontWeight: 400,
                                                        color: 'rgb(113, 113, 113)',
                                                        fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                        marginTop: '4px',
                                                    }}
                                                >
                                                    {locationLabel}
                                                </div>
                                            )}
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-3 grid grid-cols-2 gap-2 text-xs text-gray-700">
                                <div className="flex items-center gap-2 rounded-2xl bg-white px-3 py-2 shadow-sm">
                                    {expertCountry ? <CountryFlag countryCode={expertCountry} className="h-4 w-5" /> : <MapPin className="h-4 w-4 text-gray-500" />}
                                    <span className="truncate">{locationLabel}</span>
                                </div>
                                <div className="flex items-center gap-2 rounded-2xl bg-white px-3 py-2 shadow-sm">
                                    <Clock className="h-4 w-4 text-gray-500" />
                                    <span className="truncate">{responseTime || 'Respuesta rápida'}</span>
                                </div>
                            </div>

                            {hasExpertLocation && (
                                <div className="mb-3 overflow-hidden rounded-2xl border border-gray-200 bg-white">
                                    <button
                                        type="button"
                                        onClick={() => setShowMapPreview((value) => !value)}
                                        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-semibold text-gray-900"
                                        aria-expanded={showMapPreview}
                                    >
                                        <span className="flex items-center gap-2">
                                            <MapPin className="h-4 w-4 text-[#E31C5F]" />
                                            Zona aproximada del servicio
                                        </span>
                                        <span className="text-xs text-gray-500">{showMapPreview ? 'Ocultar' : 'Ver mapa'}</span>
                                    </button>
                                    {showMapPreview && (
                                        <AppointmentMap
                                            className="h-36 w-full"
                                            expertLocation={{ latitude: expertLatitude!, longitude: expertLongitude! }}
                                            expertRange={expertRange}
                                            expertCountry={expertCountry}
                                            disabled
                                            showSearch={false}
                                            showCountrySelector={false}
                                            defaultZoom={11}
                                        />
                                    )}
                                </div>
                            )}
                            
                            {/* Barra de separación */}
                            <div className="border-t border-gray-200 my-3"></div>
                            
                            {/* Barra de botones */}
                            <div className="flex items-center gap-2">
                                <Button
                                    onClick={handleFavoriteClick}
                                    variant="outline"
                                    className="flex-1 rounded-full"
                                    aria-pressed={isFavorite}
                                    aria-label={isFavorite ? 'Quitar servicio de favoritos' : 'Guardar servicio en favoritos'}
                                    style={{
                                        fontSize: '14px',
                                        lineHeight: '20px',
                                        fontWeight: 600,
                                        fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                    }}
                                >
                                    <Heart 
                                        className={`w-4 h-4 mr-2 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
                                    />
                                    Favorito
                                </Button>
                                <Button
                                    onClick={handleHireClick}
                                    className="flex-1 rounded-full bg-gradient-to-r from-[#E61E4D] via-[#E31C5F] to-[#D70466] hover:from-[#D70466] hover:via-[#E61E4D] hover:to-[#E31C5F] text-white font-semibold"
                                    style={{
                                        fontSize: '14px',
                                        lineHeight: '20px',
                                        fontWeight: 600,
                                        fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                    }}
                                >
                                    Contratar
                                </Button>
                            </div>
                        </div>
                    </div>
                    
                    {/* Información del servicio - Desktop */}
                    <div className="hidden md:flex flex-col">
                        <div className="px-4 py-3">
                            {/* Sección del experto - A la derecha de la foto */}
                            <div className="mb-3">
                                <div className="flex items-start gap-4">
                                    {serviceImage && (
                                        <div 
                                            className="relative w-20 h-20 rounded-lg flex-shrink-0 bg-gray-200 bg-cover bg-center overflow-hidden"
                                            style={{ backgroundImage: `url(${serviceImage})` }}
                                        />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <Link 
                                            to={`/service/${serviceIdNumber}`}
                                            className="block hover:opacity-90 transition-opacity"
                                        >
                                            <div 
                                                style={{
                                                    fontSize: '14px',
                                                    lineHeight: '20px',
                                                    fontWeight: 400,
                                                    color: 'rgb(34, 34, 34)',
                                                    fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                    marginBottom: '4px',
                                                }}
                                            >
                                                {expertName}
                                            </div>
                                            {expertRating > 0 && (
                                                <div className="flex items-center gap-1.5">
                                                    <div className="flex items-center gap-0.5">
                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                            <Star
                                                                key={star}
                                                                className={`w-3.5 h-3.5 ${
                                                                    star <= Math.round(expertRating)
                                                                        ? 'fill-gray-900 text-gray-900'
                                                                        : 'fill-gray-200 text-gray-200'
                                                                }`}
                                                            />
                                                        ))}
                                                    </div>
                                                    <span 
                                                        style={{
                                                            fontSize: '14px',
                                                            lineHeight: '20px',
                                                            fontWeight: 400,
                                                            color: 'rgb(113, 113, 113)',
                                                            fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                        }}
                                                    >
                                                        {expertRating.toFixed(1)} ({reviewsCount})
                                                    </span>
                                                </div>
                                            )}
                                            {(expertCity || expertCountryName) && (
                                                <div 
                                                    style={{
                                                        fontSize: '14px',
                                                        lineHeight: '20px',
                                                        fontWeight: 400,
                                                        color: 'rgb(113, 113, 113)',
                                                        fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                        marginTop: '4px',
                                                    }}
                                                >
                                                    {locationLabel}
                                                </div>
                                            )}
                                        </Link>
                                    </div>
                                    {/* Avatar del experto a la derecha */}
                                    <div className="flex-shrink-0">
                                        <button
                                            type="button"
                                            className="relative cursor-pointer hover:opacity-90 transition-opacity"
                                            onClick={() => setShowAvatarModal(true)}
                                            aria-label={`Ampliar foto de ${expertName}`}
                                        >
                                            <Avatar className="w-10 h-10">
                                                <AvatarImage src={expertAvatar} alt={expertName} />
                                                <AvatarFallback className="bg-gray-900 text-white text-sm">
                                                    {expertName.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                            {isChatConnected && (
                                                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full animate-pulse" aria-label="Chat conectado"></span>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-3 grid grid-cols-3 gap-2 text-xs text-gray-700">
                                <div className="flex items-center gap-2 rounded-2xl bg-white px-3 py-2 shadow-sm">
                                    {expertCountry ? <CountryFlag countryCode={expertCountry} className="h-4 w-5" /> : <MapPin className="h-4 w-4 text-gray-500" />}
                                    <span className="truncate">{locationLabel}</span>
                                </div>
                                <div className="flex items-center gap-2 rounded-2xl bg-white px-3 py-2 shadow-sm">
                                    <Clock className="h-4 w-4 text-gray-500" />
                                    <span className="truncate">{responseTime || 'Respuesta rápida'}</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowMapPreview((value) => !value)}
                                    disabled={!hasExpertLocation}
                                    className="flex items-center justify-center gap-2 rounded-2xl bg-white px-3 py-2 font-semibold text-gray-900 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    aria-expanded={showMapPreview}
                                >
                                    <MapPin className="h-4 w-4 text-[#E31C5F]" />
                                    {showMapPreview ? 'Ocultar mapa' : 'Ver zona'}
                                </button>
                            </div>

                            {hasExpertLocation && showMapPreview && (
                                <div className="mb-3 overflow-hidden rounded-2xl border border-gray-200 bg-white">
                                    <AppointmentMap
                                        className="h-40 w-full"
                                        expertLocation={{ latitude: expertLatitude!, longitude: expertLongitude! }}
                                        expertRange={expertRange}
                                        expertCountry={expertCountry}
                                        disabled
                                        showSearch={false}
                                        showCountrySelector={false}
                                        defaultZoom={11}
                                    />
                                </div>
                            )}
                            
                            {/* Barra de separación */}
                            <div className="border-t border-gray-200 my-3"></div>
                            
                            {/* Barra de botones */}
                            <div className="flex items-center gap-2">
                                <Button
                                    onClick={handleFavoriteClick}
                                    variant="outline"
                                    className="flex-1 rounded-full"
                                    aria-pressed={isFavorite}
                                    aria-label={isFavorite ? 'Quitar servicio de favoritos' : 'Guardar servicio en favoritos'}
                                    style={{
                                        fontSize: '14px',
                                        lineHeight: '20px',
                                        fontWeight: 600,
                                        fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                    }}
                                >
                                    <Heart 
                                        className={`w-4 h-4 mr-2 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
                                    />
                                    Favorito
                                </Button>
                                <Button
                                    onClick={handleHireClick}
                                    className="flex-1 rounded-full bg-gradient-to-r from-[#E61E4D] via-[#E31C5F] to-[#D70466] hover:from-[#D70466] hover:via-[#E61E4D] hover:to-[#E31C5F] text-white font-semibold"
                                    style={{
                                        fontSize: '14px',
                                        lineHeight: '20px',
                                        fontWeight: 600,
                                        fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                    }}
                                >
                                    Contratar
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Chat Container - Ocupa el resto del espacio */}
            {service && !loading && (
                <div className="flex-1 max-w-4xl mx-auto w-full overflow-hidden flex flex-col bg-white min-h-0">
                    <PreHireChat
                        serviceId={serviceIdNumber}
                        token={token}
                        userId={userId}
                        onConnectionChange={setIsChatConnected}
                    />
                </div>
            )}
            
            {/* Modal para ampliar foto de perfil */}
            <Dialog open={showAvatarModal} onOpenChange={setShowAvatarModal}>
                <DialogContent className="max-w-2xl p-0 bg-transparent border-0 shadow-none">
                    <div className="relative bg-black/80 backdrop-blur-sm rounded-lg p-4">
                        <button
                            onClick={() => setShowAvatarModal(false)}
                            className="absolute -top-3 -right-3 text-white bg-black/70 rounded-full p-2 hover:bg-black/90 transition-colors z-10 shadow-lg"
                            aria-label="Cerrar"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <img
                            src={expertAvatar || (service?.expert?.id ? `/api/Users/${service.expert.id}/profile-picture` : '')}
                            alt={expertName}
                            className="w-full h-auto rounded-lg shadow-2xl max-h-[80vh] object-contain mx-auto"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                            }}
                        />
                    </div>
                </DialogContent>
            </Dialog>
            
            {/* Dialog para Login cuando el usuario no está autenticado */}
            <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
                <DialogContent className="max-w-md">
                    <div className="flex flex-col items-center gap-6 p-6">
                        <div className="text-center">
                            <MessageCircle className="w-12 h-12 text-primary mx-auto mb-4" />
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                Inicia sesión para continuar
                            </h2>
                            <p className="text-gray-600">
                                Necesitas iniciar sesión para contratar el servicio o guardar favoritos.
                            </p>
                        </div>
                        
                        <div className="w-full">
                            {/* Hidden Google button */}
                            <div ref={googleButtonRefLoginDialog} style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', zIndex: -1 }}></div>
                            
                            {/* Custom button */}
                            <button
                                onClick={handleGoogleSignIn}
                                disabled={!isGoogleReady || isAuthenticating}
                                type="button"
                                className={`relative w-full h-12 px-6 bg-gradient-to-r from-[#E61E4D] via-[#E31C5F] to-[#D70466] hover:from-[#D70466] hover:via-[#E61E4D] hover:to-[#E31C5F] text-white text-[16px] font-semibold transition-all duration-200 overflow-hidden rounded-lg flex items-center justify-center gap-3 ${isAuthenticating ? 'opacity-75 cursor-wait' : ''}`}
                            >
                                {isAuthenticating ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                        <span>{authStep || 'Iniciando sesión...'}</span>
                                    </>
                                ) : (
                                    <>
                                        <GoogleIcon />
                                        <span>Iniciar sesión con Google</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
