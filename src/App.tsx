import React, { useState, useEffect } from 'react';
import { Search, Sparkles, Settings, HelpCircle, CreditCard, LogOut, Menu, Bell, UserPlus, Briefcase, Wallet, Globe } from 'lucide-react';
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
import { isAdmin } from './utils/admin';

import SearchesPage from './pages/SearchesPage';
import SearchCreationPage from './pages/SearchCreationPage';
import Background from './components/Background';
import { BecomeExpertPage } from './pages/BecomeExpertPage';
import { ExpertPanelPage } from './pages/ExpertPanelPage';
import { SearchResultsPage } from './pages/SearchResultsPage';
import TransactionsPage from './pages/TransactionsPage';
import HomePage from './pages/HomePage';
import ServiceDetailPage from './pages/ServiceDetailPage';
import { CheckoutPage } from './pages/CheckoutPage';
import QuienesSomosPage from './pages/QuienesSomosPage';
import ComoFuncionaPage from './pages/ComoFuncionaPage';
import FAQPage from './pages/FAQPage';
import { AccountSettingsModal } from './components/AccountSettingsModal';
import { AdminLayout } from './components/layout/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminConfigPage from './pages/admin/AdminConfigPage';
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage';
import AdminMappingsPage from './pages/admin/AdminMappingsPage';
import { UserManagement } from './components/UserManagement';
import NotificationManagement from './components/NotificationManagement';
import { DisputePanel } from './components/DisputePanel';
import HangfirePanel from './components/HangfirePanel';
import SearchDetails from './components/SearchDetails';
import { GoogleAuth } from './components/GoogleAuth';
import { GoogleSignInButton } from './components/GoogleSignInButton';
import { setupRateLimitHandler } from './services/rateLimitHandler';
import { authService } from './services/authService';
import { setupErrorInterceptor } from './services/errorInterceptor';
import { MFASetupPage } from './pages/MFASetupPage';
import { ProtectedRouteWithMFA } from './components/layout/ProtectedRouteWithMFA';
import { UserRole } from './utils/roleChecker';
import CountryFlag from './components/CountryFlag';
import CountrySelector from './components/CountrySelector';
import { ErrorBoundary } from './components/ErrorBoundary';
import { NotFoundPage } from './pages/NotFoundPage';
import { StatusPage } from './pages/StatusPage';
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
        
        // 3. Configurar interceptor de errores HTTP (debe ir después de rateLimitHandler)
        setupErrorInterceptor();
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

    // Exponer función global para abrir el sidebar desde MobileBottomBar
    useEffect(() => {
        // Función global que MobileBottomBar puede llamar
        (window as any).openSidebar = () => {
            console.log('👂 App.tsx - openSidebar() llamado directamente');
            setSidebarOpen(true);
            console.log('✅ App.tsx - Sidebar abierto');
        };

        // Función global para abrir AccountSettingsModal
        (window as any).openAccountSettings = () => {
            console.log('👂 App.tsx - openAccountSettings() llamado directamente');
            setShowAccountSettings(true);
            console.log('✅ App.tsx - AccountSettingsModal abierto');
        };

        // También mantener el listener de eventos por si acaso
        const handleOpenSidebar = (event: Event) => {
            setSidebarOpen(true);
        };

        const handleOpenAccountSettings = (event: Event) => {
            setShowAccountSettings(true);
        };

        window.addEventListener('openSidebar', handleOpenSidebar);
        window.addEventListener('openAccountSettings', handleOpenAccountSettings);
        
        return () => {
            window.removeEventListener('openSidebar', handleOpenSidebar);
            window.removeEventListener('openAccountSettings', handleOpenAccountSettings);
            delete (window as any).openSidebar;
            delete (window as any).openAccountSettings;
        };
    }, []);

    const handleSignOut = () => {
        signOut();
        toast.info('👋 ¡Hasta pronto!');
    };

    const handleRequireAuth = (action: string) => {
        toast.info(`Para ${action.toLowerCase()} necesitas iniciar sesión primero`);
    };

    // El objeto user viene del backend con mayúsculas: Email, Role (no email, role)
    const userEmail = user?.Email || user?.email; // Compatibilidad con ambos formatos
    const userRole = user?.Role || user?.role; // Compatibilidad con ambos formatos
    const isExpert = userRole === 'Expert';
    const userIsAdmin = isAdmin(userEmail) || userRole === 'Admin' || userRole === 'admin';

    return (
        <div className="min-h-screen bg-background text-foreground relative overflow-x-hidden">
            {/* Header estilo Memorae - Oculto en móvil */}
            <header className={`h-16 relative z-50 hidden md:block ${shouldHideHeaderOnMobile ? 'hidden' : ''}`} style={{ backgroundColor: '#fbfbfb' }}>
                    <div className="max-w-7xl mx-auto h-full px-4 lg:px-8 flex items-center justify-between">
                        {/* Logo estilo Memorae */}
                        <div className="flex items-center gap-3">
                            <a 
                                href="/"
                                onClick={(e) => {
                                    e.preventDefault();
                                    navigate('/');
                                }}
                                className="flex items-center"
                            >
                                <img 
                                    src={logoImg} 
                                    alt="Logo" 
                                    className="h-8 w-auto object-contain"
                                />
                            </a>
                        </div>

                        {/* Navegación estilo Memorae */}
                        <nav className="hidden md:flex items-center gap-6">
                            <Button
                                variant="ghost"
                                className="text-sm font-medium text-gray-700 hover:text-gray-900 h-auto px-0 py-0"
                                onClick={() => {
                                    if (location.pathname === '/') {
                                        const formSection = document.getElementById('form-section');
                                        if (formSection) {
                                            const elementPosition = formSection.getBoundingClientRect().top + window.pageYOffset;
                                            window.scrollTo({
                                                top: elementPosition - 20,
                                                behavior: 'smooth'
                                            });
                                        } else {
                                            sessionStorage.setItem('scrollToFormSection', 'true');
                                        }
                                    } else {
                                        sessionStorage.setItem('scrollToFormSection', 'true');
                                        navigate('/');
                                    }
                                }}
                            >
                                Servicios
                            </Button>
                            <Button
                                variant="ghost"
                                className="text-sm font-medium text-gray-700 hover:text-gray-900 h-auto px-0 py-0"
                                onClick={() => isAuthenticated ? navigate('/busquedas') : handleRequireAuth('Ver tus revisiones')}
                            >
                                Mis revisiones
                            </Button>
                            <Button
                                variant="ghost"
                                className="text-sm font-medium text-gray-700 hover:text-gray-900 h-auto px-0 py-0"
                                onClick={() => {
                                    // TODO: Implementar funcionalidad de favoritos
                                    if (isAuthenticated) {
                                        // Por ahora mantener notificaciones, pero cambiar a favoritos cuando esté implementado
                                        setShowNotifications(true);
                                    } else {
                                        handleRequireAuth('Ver tus favoritos');
                                    }
                                }}
                            >
                                Favoritos
                            </Button>
                            <button
                                onClick={() => navigate('/como-funciona')}
                                className="text-sm font-medium text-gray-700 hover:text-gray-900 h-auto px-0 py-0"
                            >
                                Cómo funciona
                            </button>
                        </nav>

                        {/* Botones de acción estilo Memorae */}
                        <div className="flex items-center gap-4">
                            {/* Botón menú móvil - Solo visible si está autenticado */}
                            {isAuthenticated && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setSidebarOpen(!sidebarOpen)}
                                    className="md:hidden h-9 w-9"
                                >
                                    <Menu className="w-5 h-5" />
                                </Button>
                            )}

                            {/* Botón "Hazte revisor" estilo Airbnb */}
                            <Button
                                variant="ghost"
                                className="hidden md:flex text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-full px-4 py-2"
                                onClick={() => navigate('/become-expert')}
                            >
                                Hazte revisor
                            </Button>

                            {/* Icono de globo para idioma */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="hidden md:flex h-10 w-10 rounded-full hover:bg-gray-100"
                            >
                                <Globe className="w-5 h-5 text-gray-700" />
                            </Button>

                            {isAuthenticated ? (
                                <>
                                    <Button
                                        variant="ghost"
                                        className="hidden md:flex text-sm font-medium text-gray-700 hover:text-gray-900"
                                        onClick={handleSignOut}
                                    >
                                        Cerrar Sesión
                                    </Button>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button 
                                                variant="ghost" 
                                                className="relative h-10 w-auto rounded-full p-1 border border-gray-300 hover:shadow-md transition-shadow flex items-center gap-2 px-3"
                                            >
                                                <Menu className="w-4 h-4 text-gray-700" />
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xs">
                                                        {user?.name?.[0]?.toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-56">
                                            <DropdownMenuLabel>
                                                <div className="flex flex-col space-y-1">
                                                    <p className="text-sm font-normal leading-none">{user?.name}</p>
                                                    <p className="text-xs leading-none text-muted-foreground truncate font-normal">{user?.email}</p>
                                                </div>
                                            </DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                onClick={() => navigate('/transacciones')}
                                                className="text-sm font-normal cursor-pointer"
                                            >
                                                <Wallet className="w-4 h-4 mr-2" />
                                                Transacciones
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => setShowAccountSettings(true)}
                                                className="text-sm font-normal cursor-pointer"
                                            >
                                                <Settings className="w-4 h-4 mr-2" />
                                                Configuración
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                onClick={handleSignOut}
                                                className="text-sm font-normal text-red-600 cursor-pointer"
                                            >
                                                <LogOut className="w-4 h-4 mr-2" />
                                                Cerrar Sesión
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </>
                            ) : (
                                <>
                                    <div className="hidden md:flex">
                                        <GoogleSignInButton variant="compact" />
                                    </div>
                                    <Button
                                        className="hidden md:flex bg-gray-900 text-white hover:bg-gray-800 text-sm font-medium px-4 py-2 rounded-lg"
                                        onClick={() => {
                                            if (location.pathname === '/') {
                                                const formSection = document.getElementById('form-section');
                                                if (formSection) {
                                                    formSection.scrollIntoView({ behavior: 'smooth' });
                                                }
                                            } else {
                                                navigate('/');
                                            }
                                        }}
                                    >
                                        Probar Gratis
                                    </Button>
                                </>
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
                                    /* Botón de login con Google */
                                    <div className="space-y-3">
                                        <p className="text-sm font-normal text-muted-foreground text-center">Inicia sesión para acceder a todas las funciones</p>
                                        <GoogleSignInButton 
                                            variant="default"
                                            onSuccess={() => setSidebarOpen(false)}
                                        />
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
                            <Route path="/status" element={<StatusPage />} />
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
                            {/* Admin Routes */}
                            <Route path="/admin" element={<ProtectedRouteWithMFA requireMfa allowedRoles={[UserRole.Admin]}><AdminLayout /></ProtectedRouteWithMFA>}>
                                <Route index element={<AdminDashboard />} />
                                <Route path="users" element={<UserManagement onBack={() => window.location.href = '/'} />} />
                                <Route path="config/*" element={<AdminConfigPage />} />
                                <Route path="categories" element={<AdminCategoriesPage />} />
                                <Route path="mappings" element={<AdminMappingsPage />} />
                                <Route path="notifications" element={<NotificationManagement />} />
                                <Route path="disputes" element={<DisputePanel />} />
                                <Route path="hangfire" element={<HangfirePanel />} />
                            </Route>
                            <Route path="/become-expert" element={<ProtectedRoute><BecomeExpertPage /></ProtectedRoute>} />
                            <Route path="/expert-panel" element={<ProtectedRouteWithMFA requireMfa allowedRoles={[UserRole.Expert]}><ExpertPanelPage /></ProtectedRouteWithMFA>} />
                            <Route path="/transacciones" element={<ProtectedRouteWithMFA><TransactionsPage /></ProtectedRouteWithMFA>} />
                            <Route path="/service/:serviceId" element={<ServiceDetailPage />} />
                            <Route path="/checkout/:serviceId" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
                            <Route path="/crear-busqueda" element={<SearchCreationPage />} />
                            <Route path="/quienes-somos" element={<QuienesSomosPage />} />
                            <Route path="/como-funciona" element={<ComoFuncionaPage />} />
                            <Route path="/faq" element={<FAQPage />} />
                            <Route path="/explorar" element={<HomePage />} />
                            <Route path="/" element={<HomePage />} />
                            
                            {/* Ruta 404 - debe ir al final */}
                            <Route path="*" element={<NotFoundPage />} />
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
        <ErrorBoundary>
            <Router>
                <AppContent />
            </Router>
        </ErrorBoundary>
    );
});

export default App;