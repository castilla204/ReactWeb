import React, { useState, useEffect } from 'react';
import { Search, Sparkles, Settings, HelpCircle, CreditCard, LogOut, Menu, Bell, UserPlus, Briefcase, Wallet } from 'lucide-react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { NotificationCenter } from './components/NotificationCenter';
import { useNotifications } from './hooks/useNotifications';
// Verificación de teléfono desactivada temporalmente
// import { PhoneVerification as PhoneVerificationPage } from './pages/PhoneVerificationPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsPage } from './pages/TermsPage';
import { AdDetails } from './components/AdDetails';
import { PaymentSuccessPage } from './pages/PaymentSuccessPage';
import { PaymentCancelPage } from './pages/PaymentCancelPage';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
} from './components/ui/navigation-menu';
import { Button } from './components/ui/button';
import { Avatar, AvatarFallback } from './components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from './components/ui/dropdown-menu';
import { Separator } from './components/ui/separator';
import { Badge } from './components/ui/badge';

import SearchesPage from './pages/SearchesPage';
import SearchCreationPage from './pages/SearchCreationPage';
import AdminPanelPage from './pages/AdminPanelPage';
import Background from './components/Background';
import { BecomeExpertPage } from './pages/BecomeExpertPage';
import { ExpertPanelPage } from './pages/ExpertPanelPage';
import { SearchResultsPage } from './pages/SearchResultsPage';
import { DisputePanelPage } from './pages/DisputePanelPage';
import TransactionsPage from './pages/TransactionsPage';
import { AccountSettingsModal } from './components/AccountSettingsModal';
import SearchDetails from './components/SearchDetails';
import { GoogleAuth } from './components/GoogleAuth';
import { setupRateLimitHandler } from './services/rateLimitHandler';
import { authService } from './services/authService';
import { MFASetupPage } from './pages/MFASetupPage';
import { ProtectedRouteWithMFA } from './components/layout/ProtectedRouteWithMFA';
import { UserRole } from './utils/roleChecker';
import CountryFlag from './components/CountryFlag';
import CountrySelector from './components/CountrySelector';
import logoImg from './media/logoi.png';

const SearchDetailsWrapper: React.FC<{ isAdmin: boolean }> = ({ isAdmin }) => {
    const navigate = useNavigate();
    
    return (
        <SearchDetails 
            onBack={() => navigate(-1)} 
            isAdmin={isAdmin} 
        />
    );
};

const AppContent: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, isAuthenticated, signOut } = useAuth();
    const [showNotifications, setShowNotifications] = useState(false);
    const [showAccountSettings, setShowAccountSettings] = useState(false);
    const [selectedCountry, setSelectedCountry] = useState<string>('ES');

    // Inicializar servicios de seguridad
    useEffect(() => {
        // 1. Inicializar authService (esto configura el interceptor de tokens)
        // authService ya se inicializa automáticamente en su constructor
        
        // 2. Configurar rate limiting (debe ir después del authService)
        setupRateLimitHandler();
    }, []);
    
    // Ocultar header en móvil cuando se está en las páginas del formulario (SearchParameterForm o SearchForm)
    // Estas páginas están dentro de SearchCreationPage cuando currentStep es 1 o 2
    const isSearchCreationPage = location.pathname === '/crear-busqueda' || location.pathname === '/';
    const [isInFormStep, setIsInFormStep] = useState(false);
    
    // Escuchar cambios en el paso del formulario
    useEffect(() => {
        const checkFormStep = () => {
            const inFormStep = sessionStorage.getItem('isInFormStep') === 'true';
            setIsInFormStep(inFormStep);
        };
        
        // Verificar al cargar
        checkFormStep();
        
        // Escuchar eventos de cambio de paso
        const handleFormStepChange = () => {
            checkFormStep();
        };
        
        window.addEventListener('formStepChanged', handleFormStepChange);
        
        return () => {
            window.removeEventListener('formStepChanged', handleFormStepChange);
        };
    }, []);
    
    // Ocultar header en móvil cuando estamos en la página de creación Y en un paso de formulario (1, 2 o 3)
    // En desktop, el header se mantiene visible pero el SearchParameterForm tiene su propio header con roadmap
    const shouldHideHeaderOnMobile = isSearchCreationPage && isInFormStep;

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { unreadCount } = useNotifications();

    // Listen for notification events
    useEffect(() => {
        const handleShowNotification = (event: CustomEvent) => {
            const { type, message } = event.detail;
            if (type === 'success') {
                toast.success(message);
            } else if (type === 'error') {
                toast.error(message);
            } else {
                toast.info(message);
            }
        };

        window.addEventListener('showNotification', handleShowNotification as EventListener);
        return () => {
            window.removeEventListener('showNotification', handleShowNotification as EventListener);
        };
    }, []);

    const handleSignOut = () => {
        signOut();
        toast.info('👋 ¡Hasta pronto!');
    };

    const handleRequireAuth = (action: string) => {
        toast.info(`Para ${action.toLowerCase()} necesitas iniciar sesión primero`);
    };

    const isExpert = user?.role === 'Expert';

    return (
        <div className="min-h-screen bg-background text-foreground relative overflow-x-hidden">
            {/* Header mejorado - Oculto en móvil cuando se está en creación de búsqueda */}
            <header className={`h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 relative z-50 shadow-sm ${shouldHideHeaderOnMobile ? 'hidden' : ''}`}>
                    <div className="max-w-7xl mx-auto h-full px-4 lg:px-8 flex items-center justify-between">
                        {/* Logo mejorado */}
                        <div className="flex items-center gap-3">
                            {/* Marca inspecciono.com */}
                            <h1 
                                onClick={() => navigate('/')}
                                className="text-sm md:text-lg font-semibold text-gray-900 dark:text-white tracking-tight cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 group antialiased"
                                style={{ fontFeatureSettings: '"kern" 1', WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale' }}
                            >
                                <span className="relative">
                                    <span className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-400 dark:to-blue-500 bg-clip-text text-transparent">
                                        inspecciono
                                    </span>
                                    <span className="text-gray-400 dark:text-gray-500">.com</span>
                                    <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-blue-600 dark:bg-blue-400 group-hover:w-full transition-all duration-300"></span>
                                </span>
                            </h1>
                        </div>

                        {/* Navegación compacta */}
                        <div className="flex items-center gap-1.5">
                            {/* Navegación principal - siempre visible */}
                            <div className="hidden md:flex items-center gap-1">
                                <NavigationMenu>
                                    <NavigationMenuList className="gap-0.5">
                                        <NavigationMenuItem>
                                            <NavigationMenuLink asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        if (location.pathname === '/') {
                                                            // Si ya estamos en la home, hacer scroll al formulario
                                                            const formSection = document.getElementById('form-section');
                                                            if (formSection) {
                                                                const elementPosition = formSection.getBoundingClientRect().top + window.pageYOffset;
                                                                window.scrollTo({
                                                                    top: elementPosition - 20,
                                                                    behavior: 'smooth'
                                                                });
                                                            } else {
                                                                // Si no existe, guardar para que se haga scroll cuando se cargue
                                                                sessionStorage.setItem('scrollToFormSection', 'true');
                                                            }
                                                        } else {
                                                            // Si estamos en otra página, navegar a home y hacer scroll
                                                            sessionStorage.setItem('scrollToFormSection', 'true');
                                                            navigate('/');
                                                        }
                                                    }}
                                                    className="flex items-center gap-2 h-9 px-4 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200 group"
                                                >
                                                    <Sparkles className="w-4 h-4 transition-transform duration-200 group-hover:scale-110 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                                                    <span>Servicios</span>
                                                </Button>
                                            </NavigationMenuLink>
                                        </NavigationMenuItem>
                                        <NavigationMenuItem>
                                            <NavigationMenuLink asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => isAuthenticated ? window.location.href = '/busquedas' : handleRequireAuth('Ver tus inspecciones')}
                                                    className="flex items-center gap-2 h-9 px-4 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200 group"
                                                >
                                                    <Search className="w-4 h-4 transition-transform duration-200 group-hover:scale-110 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                                                    <span>Inspecciones</span>
                                                </Button>
                                            </NavigationMenuLink>
                                        </NavigationMenuItem>
                                        <NavigationMenuItem>
                                            <NavigationMenuLink asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => isAuthenticated ? setShowNotifications(true) : handleRequireAuth('Ver tus notificaciones')}
                                                    className="relative flex items-center gap-2 h-9 px-4 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200 group"
                                                >
                                                    <Bell className="w-4 h-4 transition-transform duration-200 group-hover:scale-110 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                                                    <span>Notificaciones</span>
                                                    {isAuthenticated && unreadCount > 0 && (
                                                        <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 min-w-5 px-1.5 text-[10px] flex items-center justify-center font-semibold bg-red-500 hover:bg-red-600">
                                                            {unreadCount > 9 ? '9+' : unreadCount}
                                                        </Badge>
                                                    )}
                                                </Button>
                                            </NavigationMenuLink>
                                        </NavigationMenuItem>
                                        
                                        {/* Panel de experto integrado - solo para expertos autenticados */}
                                        {isAuthenticated && isExpert && (
                                            <NavigationMenuItem>
                                                <NavigationMenuLink asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => window.location.href = '/expert-panel'}
                                                        className="flex items-center gap-2 h-9 px-4 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200 group"
                                                    >
                                                        <Briefcase className="w-4 h-4 transition-transform duration-200 group-hover:scale-110 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                                                        <span>Panel</span>
                                                    </Button>
                                                </NavigationMenuLink>
                                            </NavigationMenuItem>
                                        )}
                                    </NavigationMenuList>
                                </NavigationMenu>
                            </div>

                            {/* Separador antes del selector de país */}
                            <Separator orientation="vertical" className="h-6 mx-3 opacity-30 hidden md:block" />

                            {/* Selector de país - compacto para topbar */}
                            <div className="hidden md:flex items-center">
                                <CountrySelector
                                    onCountrySelect={(countryCode) => {
                                        setSelectedCountry(countryCode);
                                        // Aquí puedes agregar lógica adicional si necesitas actualizar algo al cambiar país
                                    }}
                                    currentCountry={selectedCountry}
                                    variant="compact"
                                />
                            </div>

                            {/* Separador antes del avatar/login */}
                            <Separator orientation="vertical" className="h-6 mx-3 hidden md:block opacity-30" />

                            {/* Botón menú móvil */}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="md:hidden h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-accent/60 rounded-lg transition-all duration-200 active:scale-95"
                            >
                                <Menu className="w-4 h-4" />
                            </Button>

                            {isAuthenticated ? (
                                /* Avatar compacto para usuarios autenticados */
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 hover:bg-accent/60 transition-all duration-200 hover:scale-105 active:scale-95 ring-2 ring-transparent hover:ring-primary/20">
                                            <Avatar className="h-9 w-9 border-2 border-border/30 shadow-sm">
                                                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary text-xs font-normal">
                                                    {user?.name?.[0]?.toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56 backdrop-blur-md bg-background/95 border-border/50 shadow-xl">
                                        <DropdownMenuLabel>
                                            <div className="flex flex-col space-y-1">
                                                <p className="text-sm font-normal leading-none">{user?.name}</p>
                                                <p className="text-xs leading-none text-muted-foreground truncate font-normal">{user?.email}</p>
                                                <Badge variant="secondary" className="mt-1.5 w-fit text-xs font-normal">
                                                    {isExpert ? 'Experto' : 'Usuario'}
                                                </Badge>
                                            </div>
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={() => {
                                                navigate('/transacciones');
                                            }}
                                            className="text-sm font-normal cursor-pointer transition-colors"
                                        >
                                            <Wallet className="w-4 h-4 mr-2" />
                                            Transacciones
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => {
                                                setShowAccountSettings(true);
                                            }}
                                            className="text-sm font-normal cursor-pointer transition-colors"
                                        >
                                            <Settings className="w-4 h-4 mr-2" />
                                            Configuración
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={handleSignOut}
                                            className="text-sm font-normal text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20 cursor-pointer transition-colors"
                                        >
                                            <LogOut className="w-4 h-4 mr-2" />
                                            Cerrar Sesión
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            ) : (
                                /* Botón de login con GoogleAuth integrado - oculto en móvil */
                                <div className="relative hidden lg:block">
                                    {/* GoogleAuth oculto */}
                                    <div className="absolute opacity-0 pointer-events-none">
                                        <GoogleAuth />
                                    </div>
                                    {/* Botón visible que activa GoogleAuth */}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            // Buscar y hacer clic en el botón de Google Auth
                                            const googleButton = document.querySelector('#googleButton div[role="button"]') as HTMLElement;
                                            if (googleButton) {
                                                googleButton.click();
                                            }
                                        }}
                                        className="h-9 px-4 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-white hover:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition-all duration-200 border border-gray-300 dark:border-gray-700 hover:border-blue-600 dark:hover:border-blue-500"
                                    >
                                        Iniciar Sesión
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>



                {/* Sidebar - Always visible */}
                <div 
                    className={`fixed inset-y-0 left-0 z-40 w-72 bg-background border-r border-border shadow-2xl transform transition-transform duration-300 ease-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:hidden`}
                    aria-hidden={!sidebarOpen}
                    tabIndex={sidebarOpen ? undefined : -1}
                    style={!sidebarOpen ? { pointerEvents: 'none' } : undefined}
                >
                        <div className="flex flex-col h-full">
                            <div className="p-4 border-b border-border/20">
                                <div className="flex items-center gap-2">
                                    <img src={logoImg} alt="Logo" className="w-5 h-5 object-contain" style={{ imageRendering: '-webkit-optimize-contrast' }} />
                                    <h1 className="text-sm font-medium text-foreground/90 tracking-tight bg-gradient-to-r from-foreground/90 to-foreground/70 bg-clip-text text-transparent antialiased" style={{ fontFeatureSettings: '"kern" 1', WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale' }}>
                                        inspecciono.com
                                    </h1>
                                </div>
                            </div>
                            <nav className="flex-1 overflow-y-auto p-4">
                                <div className="space-y-1">
                                    <button
                                        onClick={() => {
                                            if (location.pathname === '/') {
                                                // Si ya estamos en la home, hacer scroll al formulario
                                                const formSection = document.getElementById('form-section');
                                                if (formSection) {
                                                    const elementPosition = formSection.getBoundingClientRect().top + window.pageYOffset;
                                                    window.scrollTo({
                                                        top: elementPosition - 20,
                                                        behavior: 'smooth'
                                                    });
                                                } else {
                                                    // Si no existe, guardar para que se haga scroll cuando se cargue
                                                    sessionStorage.setItem('scrollToFormSection', 'true');
                                                }
                                            } else {
                                                // Si estamos en otra página, navegar a home y hacer scroll
                                                sessionStorage.setItem('scrollToFormSection', 'true');
                                                navigate('/');
                                            }
                                            setSidebarOpen(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-normal text-muted-foreground hover:text-foreground hover:bg-accent/60 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        <Sparkles className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                                        Ver servicios
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (isAuthenticated) {
                                                window.location.href = '/busquedas';
                                            } else {
                                                handleRequireAuth('Ver tus búsquedas');
                                            }
                                            setSidebarOpen(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-normal text-muted-foreground hover:text-foreground hover:bg-accent/60 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        <Search className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                                        Mis Búsquedas
                                    </button>
                                    {isAuthenticated && isExpert ? (
                                        <a
                                            href="/expert-panel"
                                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-normal text-muted-foreground hover:text-foreground hover:bg-accent/60 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                                            onClick={() => setSidebarOpen(false)}
                                        >
                                            <Briefcase className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                                            Panel de Experto
                                        </a>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                if (isAuthenticated) {
                                                    window.location.href = '/become-expert';
                                                } else {
                                                    handleRequireAuth('Convertirte en experto');
                                                }
                                                setSidebarOpen(false);
                                            }}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-normal text-muted-foreground hover:text-foreground hover:bg-accent/60 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                                        >
                                            <UserPlus className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                                            Hazte Buscador
                                        </button>
                                    )}
                                </div>
                                <div className="mt-8 space-y-1">
                                    {isAuthenticated && (
                                        <button
                                            onClick={() => {
                                                navigate('/transacciones');
                                                setSidebarOpen(false);
                                            }}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-normal text-muted-foreground hover:text-foreground hover:bg-accent/60 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                                        >
                                            <Wallet className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                                            Transacciones
                                        </button>
                                    )}
                                    <button
                                        onClick={() => {
                                            if (isAuthenticated) {
                                                setShowAccountSettings(true);
                                            }
                                            setSidebarOpen(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-normal text-muted-foreground hover:text-foreground hover:bg-accent/60 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        <Settings className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                                        Configuración
                                    </button>
                                    <button
                                        onClick={() => setSidebarOpen(false)}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-normal text-muted-foreground hover:text-foreground hover:bg-accent/60 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        <HelpCircle className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                                        Centro de Ayuda
                                    </button>
                                </div>
                            </nav>
                            <div className="p-4 border-t border-border/20">
                                <div className="mb-4">
                                    <p className="text-xs font-medium text-muted-foreground mb-2 px-1">País / Región</p>
                                    <CountrySelector
                                        onCountrySelect={(countryCode) => setSelectedCountry(countryCode)}
                                        currentCountry={selectedCountry}
                                        variant="default"
                                        className="w-full"
                                    />
                                </div>
                                <Separator className="mb-4 opacity-20" />
                                {isAuthenticated ? (
                                    <>
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border-2 border-border/30 shadow-sm">
                                                <span className="text-xs font-normal text-primary">
                                                    {user?.name?.[0]?.toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-normal text-foreground truncate">{user?.name}</p>
                                                <p className="text-xs font-normal text-muted-foreground truncate">{user?.email}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleSignOut}
                                            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-normal text-destructive hover:bg-destructive/10 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Cerrar Sesión
                                        </button>
                                    </>
                                ) : (
                                    /* Botón de login con GoogleAuth integrado */
                                    <div className="space-y-3">
                                        <p className="text-sm font-normal text-muted-foreground text-center">Inicia sesión para acceder a todas las funciones</p>
                                        <div className="relative">
                                            {/* GoogleAuth oculto */}
                                            <div className="absolute opacity-0 pointer-events-none">
                                                <GoogleAuth />
                                            </div>
                                            {/* Botón visible que activa GoogleAuth */}
                                            <button
                                                onClick={() => {
                                                    // Buscar y hacer clic en el botón de Google Auth
                                                    const googleButton = document.querySelector('#googleButton div[role="button"]') as HTMLElement;
                                                    if (googleButton) {
                                                        googleButton.click();
                                                    }
                                                    setSidebarOpen(false);
                                                }}
                                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-foreground hover:text-primary border border-border rounded-lg transition-colors"
                                            >
                                                Iniciar Sesión
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                {sidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                <main className="relative">
                    <Background />
                    <section className="w-full flex flex-col relative z-10" style={{ minHeight: 0, height: 'auto' }}>
                        <Routes>
                            {/* Verificación de teléfono desactivada temporalmente */}
                            {/* <Route path="/verify-phone" element={<PhoneVerificationPage />} /> */}
                            <Route path="/privacy-policy.html" element={<PrivacyPolicy />} />
                            <Route path="/terms.html" element={<TermsPage />} />
                            <Route path="/success" element={<PaymentSuccessPage />} />
                            <Route path="/cancel" element={<PaymentCancelPage />} />
                            <Route path="/ad/:id" element={<AdDetails onBack={() => window.history.back()} />} />
                            
                            {/* Rutas de MFA */}
                            <Route 
                                path="/mfa/setup-required" 
                                element={
                                    <ProtectedRoute>
                                        <MFASetupPage />
                                    </ProtectedRoute>
                                } 
                            />
                            
                            {/* Rutas protegidas con MFA */}
                            <Route path="/busquedas" element={<ProtectedRouteWithMFA><SearchesPage /></ProtectedRouteWithMFA>} />
                            <Route path="/busquedas/:id" element={<ProtectedRouteWithMFA><SearchDetailsWrapper isAdmin={user?.role === 'Admin' || user?.email === 'dcastillaa@gmail.com'} /></ProtectedRouteWithMFA>} />
                            <Route path="/detalles/:id" element={<ProtectedRouteWithMFA><SearchResultsPage /></ProtectedRouteWithMFA>} />
                            <Route path="/admin" element={<ProtectedRouteWithMFA requireMfa allowedRoles={[UserRole.Admin]}><AdminPanelPage /></ProtectedRouteWithMFA>} />
                            <Route path="/admin/disputes" element={<ProtectedRouteWithMFA requireMfa allowedRoles={[UserRole.Admin]}><DisputePanelPage /></ProtectedRouteWithMFA>} />
                            <Route path="/become-expert" element={<ProtectedRoute><BecomeExpertPage /></ProtectedRoute>} />
                            <Route path="/expert-panel" element={<ProtectedRouteWithMFA requireMfa allowedRoles={[UserRole.Expert]}><ExpertPanelPage /></ProtectedRouteWithMFA>} />
                            <Route path="/transacciones" element={<ProtectedRouteWithMFA><TransactionsPage /></ProtectedRouteWithMFA>} />
                            <Route path="/crear-busqueda" element={<SearchCreationPage />} />
                            <Route path="/" element={<SearchCreationPage />} />
                        </Routes>
                    </section>
                </main>


                <NotificationCenter isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
                <AccountSettingsModal isOpen={showAccountSettings} onClose={() => setShowAccountSettings(false)} />
                <Toaster />
        </div>
    );
};

const App: React.FC = React.memo(() => {
    return (
        <Router>
            <AppContent />
        </Router>
    );
});

export default App;