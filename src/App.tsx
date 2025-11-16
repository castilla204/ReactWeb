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
    
    // Solo ocultar header en móvil cuando estamos en la página de creación Y en un paso de formulario (1 o 2)
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
            {/* Header - Oculto en móvil cuando se está en creación de búsqueda */}
            <header className={`h-14 bg-background/95 backdrop-blur-md border-b border-border/20 relative z-50 ${shouldHideHeaderOnMobile ? 'hidden lg:block' : ''}`}>
                    <div className="max-w-7xl mx-auto h-full px-4 lg:px-6 flex items-center justify-between">
                        {/* Marca inspecciono.com - Moderna con gradiente sutil */}
                        <h1 
                            onClick={() => navigate('/')}
                            className="text-base font-normal text-foreground/90 tracking-tight cursor-pointer hover:text-foreground transition-all duration-200 hover:scale-[1.02] group"
                        >
                            <span className="bg-gradient-to-r from-foreground/90 to-foreground/70 bg-clip-text text-transparent group-hover:from-foreground group-hover:to-foreground/90">
                                inspecciono.com
                            </span>
                        </h1>

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
                                                    onClick={() => isAuthenticated ? window.location.href = '/busquedas' : handleRequireAuth('Ver tus inspecciones')}
                                                    className="flex items-center gap-1.5 h-9 px-3 text-sm font-normal text-muted-foreground hover:text-foreground hover:bg-accent/60 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] group"
                                                >
                                                    <Search className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
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
                                                    className="relative flex items-center gap-1.5 h-9 px-3 text-sm font-normal text-muted-foreground hover:text-foreground hover:bg-accent/60 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] group"
                                                >
                                                    <Bell className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                                                    <span>Notificaciones</span>
                                                    {isAuthenticated && unreadCount > 0 && (
                                                        <Badge variant="destructive" className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 text-[10px] flex items-center justify-center font-normal animate-pulse">
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
                                                        className="flex items-center gap-1.5 h-9 px-3 text-sm font-normal text-muted-foreground hover:text-foreground hover:bg-accent/60 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] group"
                                                    >
                                                        <Briefcase className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                                                        <span>Panel</span>
                                                    </Button>
                                                </NavigationMenuLink>
                                            </NavigationMenuItem>
                                        )}
                                    </NavigationMenuList>
                                </NavigationMenu>
                            </div>

                            {/* Separador antes del avatar/login - Más sutil */}
                            <Separator orientation="vertical" className="h-6 mx-2 hidden md:block opacity-20" />

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
                                /* Botón de login con GoogleAuth integrado */
                                <div className="relative">
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
                                        className="h-9 px-4 text-sm font-normal text-muted-foreground hover:text-foreground hover:bg-accent/60 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] border border-border/30 hover:border-border/50"
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
                                <h1 className="text-base font-normal text-foreground/90 tracking-tight bg-gradient-to-r from-foreground/90 to-foreground/70 bg-clip-text text-transparent">
                                    inspecciono.com
                                </h1>
                            </div>
                            <nav className="flex-1 overflow-y-auto p-4">
                                <div className="space-y-1">
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
                    <section className="w-full min-h-screen flex flex-col relative z-10">
                        <Routes>
                            {/* Verificación de teléfono desactivada temporalmente */}
                            {/* <Route path="/verify-phone" element={<PhoneVerificationPage />} /> */}
                            <Route path="/privacy-policy.html" element={<PrivacyPolicy />} />
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