import React, { useState, useEffect } from 'react';
import { Search, Sparkles, Settings, HelpCircle, CreditCard, LogOut, Menu, Bell, UserPlus, Briefcase, Wallet, Globe, Heart, User } from 'lucide-react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { NotificationCenter } from './components/NotificationCenter';
import { useUnreadNotificationCount } from './hooks/useNotifications';
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

import Background from './components/Background';
import { AccountSettingsModal } from './components/AccountSettingsModal';
import { AdminLayout } from './components/layout/AdminLayout';
import { RouteSuspense } from './components/RouteSuspense';
import * as LazyPages from './routes/lazyPages';
import { GoogleAuth } from './components/GoogleAuth';
import { GoogleSignInButton } from './components/GoogleSignInButton';
import { setupRateLimitHandler } from './services/rateLimitHandler';
import { authService } from './services/authService';
import { setupErrorInterceptor } from './services/errorInterceptor';
import { ProtectedRouteWithMFA } from './components/layout/ProtectedRouteWithMFA';
import { UserRole } from './utils/roleChecker';
import CountryFlag from './components/CountryFlag';
import CountrySelector from './components/CountrySelector';
import { ErrorBoundary } from './components/ErrorBoundary';
import { NotFoundPage } from './pages/NotFoundPage';
import { StatusPage } from './pages/StatusPage';
import { GoogleIdentityBootstrap } from './components/GoogleIdentityBootstrap';
import { ScrollToTop } from './components/ScrollToTop';
import { parsePositiveIntegerParam } from './utils/routeParams';
import logoImg from './media/logoi.png';

const SearchDetailsWrapper: React.FC<{ isAdmin: boolean }> = ({ isAdmin }) => {
    const navigate = useNavigate();
    
    return (
        <RouteSuspense>
            <LazyPages.SearchDetails
                onBack={() => navigate(-1)}
                isAdmin={isAdmin}
            />
        </RouteSuspense>
    );
};

// ✅ Wrapper específico para rutas con searchHireId (post-contratación)
// La ruta /searchhire/:id pasa el id como searchHireId directamente
const SearchDetailsByHireWrapper: React.FC<{ isAdmin: boolean }> = ({ isAdmin }) => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const searchHireId = parsePositiveIntegerParam(id);

    if (!searchHireId) {
        return <NotFoundPage />;
    }
    
    return (
        <RouteSuspense>
            <LazyPages.SearchDetails
                onBack={() => navigate(-1)}
                isAdmin={isAdmin}
                searchHireId={searchHireId}
            />
        </RouteSuspense>
    );
};

const AppContent: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, isAuthenticated, signOut } = useAuth();
    
    // Debug de ruta (opt-in en desarrollo)
    useEffect(() => {
        if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_ROUTES === 'true') {
            console.debug('[AppContent] Current route:', location.pathname, {
                isAuthenticated,
                hasUser: !!user,
                search: location.search,
                state: location.state,
            });
        }
    }, [location.pathname, location.search, location.state, isAuthenticated, user]);
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
        
        // 4. Configurar StatusBar (barra de estado blanca)
        const initStatusBar = async () => {
            try {
                const { Capacitor } = await import('@capacitor/core');
                if (Capacitor.isNativePlatform()) {
                    // En Capacitor 8, StatusBar se importa desde @capacitor/status-bar
                    const { StatusBar, Style } = await import('@capacitor/status-bar');
                    await StatusBar.setBackgroundColor({ color: '#ffffff' });
                    await StatusBar.setStyle({ style: Style.Light }); // Iconos oscuros sobre fondo blanco
                }
            } catch (error) {
                // StatusBar no disponible (probablemente en navegador)
                console.log('StatusBar no disponible (probablemente en navegador)');
            }
        };
        initStatusBar();
    }, []);
    
    // Ocultar header en móvil cuando se está en las páginas del formulario (SearchParameterForm o SearchForm)
    // Estas páginas están dentro de SearchCreationPage cuando currentStep es 1 o 2
    const isHomePage = location.pathname === '/' || location.pathname === '/explorar';
    const hideGlobalHeaderPaths = isHomePage
        || location.pathname === '/expert-panel'
        || location.pathname === '/become-expert'
        || location.pathname.startsWith('/complete-onboarding')
        || location.pathname.startsWith('/refresh-onboarding');
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
    const { data: unreadCount = 0 } = useUnreadNotificationCount();

    // Listen for notification events
    useEffect(() => {
        const handleShowNotification = (event: CustomEvent) => {
            const { type, message } = event.detail;
            // Solo mostrar errores
            if (type === 'error') {
                toast.error(message);
            }
            // No mostrar success ni info
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

        (window as any).openNotificationCenter = () => {
            setShowNotifications(true);
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
            delete (window as any).openNotificationCenter;
        };
    }, []);

    const handleSignOut = () => {
        signOut();
        // No mostrar notificación de adiós
    };

    const handleRequireAuth = (action: string) => {
        // No mostrar notificación de autenticación requerida
    };

    // El objeto user viene del backend con mayúsculas: Email, Role (no email, role)
    const userEmail = user?.Email || user?.email; // Compatibilidad con ambos formatos
    const userRole = user?.Role || user?.role; // Compatibilidad con ambos formatos
    const isExpert = userRole === 'Expert';
    const userIsAdmin = isAdmin(userEmail) || userRole === 'Admin' || userRole === 'admin';

    return (
        <div className="min-h-screen bg-background text-foreground relative overflow-x-hidden">
            <GoogleIdentityBootstrap />
            {/* Header estilo Memorae - Oculto en móvil */}
            <header className={`h-12 relative z-50 hidden md:block ${shouldHideHeaderOnMobile || hideGlobalHeaderPaths ? '!hidden' : ''}`} style={{ backgroundColor: '#ffffff' }}>
                    <div className="w-full h-full px-4 lg:px-6 flex items-center justify-between">
                        <a
                            href="/"
                            onClick={(e) => {
                                e.preventDefault();
                                navigate('/');
                            }}
                            className="flex items-center shrink-0"
                        >
                            <span
                                className="inline-flex items-center justify-center h-8 px-3 rounded-md bg-[#FF385C]/10 text-[#222] font-semibold text-[11px] tracking-[0.18em]"
                                aria-label="Inspecciono"
                            >
                                INSPECCIONO
                            </span>
                        </a>

                        <div className="flex items-center gap-2">
                            {userIsAdmin && (
                                <button
                                    type="button"
                                    onClick={() => navigate('/admin')}
                                    className="text-xs font-semibold text-red-600 px-2.5 py-1 rounded-md border border-red-300 hover:bg-red-50"
                                >
                                    Admin
                                </button>
                            )}
                            <button
                                type="button"
                                aria-label="Favoritos"
                                onClick={() => navigate('/favoritos')}
                                className="h-8 w-8 rounded-full border border-[#e5e7eb] bg-white hover:bg-[#f9fafb] text-[#222] inline-flex items-center justify-center transition-colors"
                            >
                                <Heart className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                aria-label={isAuthenticated ? 'Mi cuenta' : 'Iniciar sesión'}
                                onClick={() => navigate(isAuthenticated ? '/busquedas' : '/crear-busqueda')}
                                className="h-8 w-8 rounded-full border border-[#d1d5db] bg-white hover:bg-[#f9fafb] text-[#222] inline-flex items-center justify-center transition-colors"
                            >
                                <User className="w-4 h-4" />
                            </button>
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
                                        <RouteSuspense>
                                            <LazyPages.MFASetupPage />
                                        </RouteSuspense>
                                    </ProtectedRoute>
                                } 
                            />
                            
                            {/* Rutas protegidas con MFA */}
                            <Route path="/busquedas" element={<ProtectedRouteWithMFA><RouteSuspense><LazyPages.SearchesPage /></RouteSuspense></ProtectedRouteWithMFA>} />
                            <Route path="/busquedas/:id" element={<ProtectedRouteWithMFA><SearchDetailsWrapper isAdmin={user?.role === 'Admin' || user?.email === 'dcastillaa@gmail.com'} /></ProtectedRouteWithMFA>} />
                            <Route path="/searchhire/:id" element={<ProtectedRouteWithMFA><SearchDetailsByHireWrapper isAdmin={user?.role === 'Admin' || user?.email === 'dcastillaa@gmail.com'} /></ProtectedRouteWithMFA>} />
                            <Route path="/detalles/:id" element={<ProtectedRouteWithMFA><RouteSuspense><LazyPages.SearchResultsPage /></RouteSuspense></ProtectedRouteWithMFA>} />
                            <Route path="/admin" element={<ProtectedRouteWithMFA requireMfa allowedRoles={[UserRole.Admin]}><AdminLayout /></ProtectedRouteWithMFA>}>
                                <Route index element={<RouteSuspense><LazyPages.AdminDashboard /></RouteSuspense>} />
                                <Route path="users" element={<RouteSuspense><LazyPages.UserManagement onBack={() => window.location.href = '/'} /></RouteSuspense>} />
                                <Route path="config/*" element={<RouteSuspense><LazyPages.AdminConfigPage /></RouteSuspense>} />
                                <Route path="categories" element={<RouteSuspense><LazyPages.AdminCategoriesPage /></RouteSuspense>} />
                                <Route path="mappings" element={<RouteSuspense><LazyPages.AdminMappingsPage /></RouteSuspense>} />
                                <Route path="notifications" element={<RouteSuspense><LazyPages.NotificationManagement /></RouteSuspense>} />
                                <Route path="disputes" element={<RouteSuspense><LazyPages.DisputePanel /></RouteSuspense>} />
                                <Route path="hangfire" element={<RouteSuspense><LazyPages.HangfirePanel /></RouteSuspense>} />
                            </Route>
                            <Route path="/become-expert" element={<ProtectedRoute><RouteSuspense><LazyPages.BecomeExpertPage /></RouteSuspense></ProtectedRoute>} />
                            <Route path="/expert-panel" element={<ProtectedRouteWithMFA requireMfa allowedRoles={[UserRole.Expert]}><RouteSuspense><LazyPages.ExpertPanelPage /></RouteSuspense></ProtectedRouteWithMFA>} />
                            <Route path="/complete-onboarding" element={<ProtectedRoute><RouteSuspense><LazyPages.StripeOnboardingReturnPage /></RouteSuspense></ProtectedRoute>} />
                            <Route path="/refresh-onboarding" element={<ProtectedRoute><RouteSuspense><LazyPages.StripeOnboardingReturnPage /></RouteSuspense></ProtectedRoute>} />
                            <Route path="/transacciones" element={<ProtectedRouteWithMFA><RouteSuspense><LazyPages.TransactionsPage /></RouteSuspense></ProtectedRouteWithMFA>} />
                            <Route path="/service/:serviceId" element={<RouteSuspense><LazyPages.ServiceDetailPage /></RouteSuspense>} />
                            <Route path="/checkout/:serviceId" element={<ProtectedRoute><RouteSuspense><LazyPages.CheckoutPage /></RouteSuspense></ProtectedRoute>} />
                            <Route path="/chat-pre-contratacion/:serviceId" element={<ProtectedRoute><RouteSuspense><LazyPages.PreHireChatPage /></RouteSuspense></ProtectedRoute>} />
                            <Route path="/mis-mensajes" element={<ProtectedRoute><RouteSuspense><LazyPages.MessagesPage /></RouteSuspense></ProtectedRoute>} />
                            <Route path="/crear-busqueda" element={<RouteSuspense><LazyPages.SearchCreationPage /></RouteSuspense>} />
                            <Route path="/quienes-somos" element={<RouteSuspense><LazyPages.QuienesSomosPage /></RouteSuspense>} />
                            <Route path="/como-funciona" element={<RouteSuspense><LazyPages.ComoFuncionaPage /></RouteSuspense>} />
                            <Route path="/faq" element={<RouteSuspense><LazyPages.FAQPage /></RouteSuspense>} />
                            <Route path="/favoritos" element={<RouteSuspense><LazyPages.FavoritesPage /></RouteSuspense>} />
                            <Route path="/explorar" element={<RouteSuspense><LazyPages.HomePage /></RouteSuspense>} />
                            <Route path="/" element={<RouteSuspense><LazyPages.HomePage /></RouteSuspense>} />
                            
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
                <ScrollToTop />
                <AppContent />
            </Router>
        </ErrorBoundary>
    );
});

export default App;