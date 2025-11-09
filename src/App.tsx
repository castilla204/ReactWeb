import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Heart, Sparkles, Settings, HelpCircle, CreditCard, LogOut, Menu, Bell, UserPlus, Briefcase } from 'lucide-react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { NotificationCenter } from './components/NotificationCenter';
import { useNotifications } from './hooks/useNotifications';
import { FavoritesModal } from './components/FavoritesModal';
import { PhoneVerification as PhoneVerificationPage } from './pages/PhoneVerificationPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { AdDetails } from './components/AdDetails';
import { PaymentSuccessPage } from './pages/PaymentSuccessPage';
import { PaymentCancelPage } from './pages/PaymentCancelPage';
import { Notification, NotificationType } from './components/Notification';
import { AnimatedThemeToggler } from './components/ui/animated-theme-toggler';
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
} from './components/ui/navigation-menu';

import SearchesPage from './pages/SearchesPage';
import SearchCreationPage from './pages/SearchCreationPage';
import AdminPanelPage from './pages/AdminPanelPage';
import Background from './components/Background';
import { BecomeExpertPage } from './pages/BecomeExpertPage';
import { ExpertPanelPage } from './pages/ExpertPanelPage';
import { SearchResultsPage } from './pages/SearchResultsPage';
import { DisputePanelPage } from './pages/DisputePanelPage';
import { AccountSettingsModal } from './components/AccountSettingsModal';
import SearchDetails from './components/SearchDetails';
import { GoogleAuth } from './components/GoogleAuth';

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
    const { user, isAuthenticated, signOut } = useAuth();
    const [showFavorites, setShowFavorites] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showAccountSettings, setShowAccountSettings] = useState(false);
    
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

    const [notification, setNotification] = useState<{
        type: NotificationType;
        message: string;
    } | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { unreadCount } = useNotifications();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const profileMenuRef = useRef<HTMLDivElement>(null);

    const handleClickOutside = useCallback((event: MouseEvent) => {
        if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
            setShowProfileMenu(false);
        }
    }, []);

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [handleClickOutside]);

    // Listen for notification events
    useEffect(() => {
        const handleShowNotification = (event: CustomEvent) => {
            const { type, message } = event.detail;
            setNotification({ type, message });
        };

        window.addEventListener('showNotification', handleShowNotification as EventListener);
        return () => {
            window.removeEventListener('showNotification', handleShowNotification as EventListener);
        };
    }, []);

    const handleSignOut = () => {
        signOut();
        setShowProfileMenu(false);
        window.dispatchEvent(new CustomEvent('showNotification', {
            detail: {
                type: 'info',
                message: '👋 ¡Hasta pronto!'
            }
        }));
    };

    const handleRequireAuth = (action: string) => {
        setNotification({
            type: 'info',
            message: `Para ${action.toLowerCase()} necesitas iniciar sesión primero`
        });
    };

    const isExpert = user?.role === 'Expert';

    return (
        <div className="min-h-screen bg-background text-foreground relative overflow-x-hidden">
            {/* Header - Oculto en móvil cuando se está en creación de búsqueda */}
            <header className={`h-16 bg-background border-b border-border shadow-sm relative z-50 ${shouldHideHeaderOnMobile ? 'hidden lg:block' : ''}`}>
                    <div className="max-w-7xl mx-auto h-full px-4 lg:px-6 flex items-center justify-between">
                        {/* Marca inspecciono.com */}
                        <h1 className="text-lg font-medium text-foreground tracking-tight cursor-pointer hover:text-foreground/80 transition-colors">
                            inspecciono.com
                        </h1>

                        {/* Navegación compacta */}
                        <div className="flex items-center">
                            {/* Navegación principal - siempre visible */}
                            <div className="hidden md:flex items-center">
                                <NavigationMenu>
                                    <NavigationMenuList className="gap-1">
                                        <NavigationMenuItem>
                                            <NavigationMenuLink asChild>
                                                <button
                                                    onClick={() => isAuthenticated ? window.location.href = '/busquedas' : handleRequireAuth('Ver tus búsquedas')}
                                                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 rounded-md cursor-pointer"
                                                >
                                                    <Search className="w-4 h-4" />
                                                    <span>Búsquedas</span>
                                                </button>
                                            </NavigationMenuLink>
                                        </NavigationMenuItem>
                                        <NavigationMenuItem>
                                            <NavigationMenuLink asChild>
                                                <button
                                                    onClick={() => isAuthenticated ? setShowFavorites(true) : handleRequireAuth('Ver tus favoritos')}
                                                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 rounded-md cursor-pointer"
                                                >
                                                    <Heart className="w-4 h-4" />
                                                    <span>Favoritos</span>
                                                </button>
                                            </NavigationMenuLink>
                                        </NavigationMenuItem>
                                        <NavigationMenuItem>
                                            <NavigationMenuLink asChild>
                                                <button
                                                    type="button"
                                                    onClick={() => isAuthenticated ? setShowNotifications(true) : handleRequireAuth('Ver tus notificaciones')}
                                                    className="relative flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 rounded-md cursor-pointer"
                                                >
                                                    {isAuthenticated && unreadCount > 0 && (
                                                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 text-white text-[8px] flex items-center justify-center rounded-full border border-white">
                                                            {unreadCount > 9 ? '9+' : unreadCount}
                                                        </div>
                                                    )}
                                                    <Bell className="w-4 h-4" />
                                                    <span>Notificaciones</span>
                                                </button>
                                            </NavigationMenuLink>
                                        </NavigationMenuItem>
                                        
                                        {/* Theme Toggle */}
                                        <NavigationMenuItem>
                                            <div className="flex items-center px-3 py-2">
                                                <AnimatedThemeToggler />
                                            </div>
                                        </NavigationMenuItem>
                                        
                                        {/* Panel de experto integrado - solo para expertos autenticados */}
                                        {isAuthenticated && isExpert && (
                                            <NavigationMenuItem>
                                                <NavigationMenuLink
                                                    href="/expert-panel"
                                                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 rounded-md"
                                                >
                                                    <Briefcase className="w-4 h-4" />
                                                    <span>Panel</span>
                                                </NavigationMenuLink>
                                            </NavigationMenuItem>
                                        )}
                                    </NavigationMenuList>
                                </NavigationMenu>
                            </div>

                            {/* Separador antes del avatar/login */}
                            <span className="text-muted-foreground/50 mx-3">|</span>

                            {/* Botón menú móvil */}
                            <button
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="md:hidden p-1 text-foreground hover:text-foreground/80 rounded transition-colors mr-2"
                            >
                                <Menu className="w-5 h-5" />
                            </button>

                            {isAuthenticated ? (
                                /* Avatar compacto para usuarios autenticados */
                                <div className="relative" ref={profileMenuRef}>
                                    <button
                                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                                        className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-sm font-medium hover:bg-blue-200 transition-colors"
                                    >
                                        {user?.name?.[0]?.toUpperCase()}
                                    </button>

                                    {showProfileMenu && (
                                        <div className="absolute right-0 mt-2 w-52 bg-popover rounded-xl shadow-xl border border-border py-2 z-50">
                                            <div className="px-4 py-3 border-b border-border">
                                                <p className="text-sm font-semibold text-popover-foreground truncate">{user?.name}</p>
                                                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                                                <span className="inline-block mt-1 px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
                                                    {isExpert ? 'Experto' : 'Usuario'}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setShowAccountSettings(true);
                                                    setShowProfileMenu(false);
                                                }}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-popover-foreground hover:bg-accent transition-colors"
                                            >
                                                <Settings className="w-4 h-4 text-muted-foreground" />
                                                Configuración
                                            </button>
                                            <button
                                                onClick={handleSignOut}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                Cerrar Sesión
                                            </button>
                                        </div>
                                    )}
                                </div>
                                        ) : (
                /* Botón de login con GoogleAuth integrado */
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
                        }}
                        className="px-3 py-1.5 text-sm text-foreground hover:text-primary transition-colors"
                    >
                        Iniciar Sesión
                    </button>
                </div>
            )}
                        </div>
                    </div>
                </header>



                {/* Sidebar - Always visible */}
                <div className={`fixed inset-y-0 left-0 z-40 w-72 bg-background shadow-xl transform transition-transform duration-200 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:hidden`}>
                        <div className="flex flex-col h-full">
                            <div className="p-4 border-b border-border">
                                <h1 className="text-xl font-bold text-foreground">ATRAPO</h1>
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
                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-foreground hover:bg-accent rounded-lg transition-colors"
                                    >
                                        <Search className="w-4 h-4 text-primary" />
                                        Mis Búsquedas
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (isAuthenticated) {
                                                setShowFavorites(true);
                                            } else {
                                                handleRequireAuth('Ver tus favoritos');
                                            }
                                            setSidebarOpen(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-foreground hover:bg-accent rounded-lg transition-colors"
                                    >
                                        <Heart className="w-4 h-4 text-primary" />
                                        Favoritos
                                    </button>
                                    {isAuthenticated && isExpert ? (
                                        <a
                                            href="/expert-panel"
                                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-foreground hover:bg-accent rounded-lg transition-colors"
                                            onClick={() => setSidebarOpen(false)}
                                        >
                                            <Briefcase className="w-4 h-4 text-primary" />
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
                                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-foreground hover:bg-accent rounded-lg transition-colors"
                                        >
                                            <UserPlus className="w-4 h-4 text-primary" />
                                            Hazte Buscador
                                        </button>
                                    )}
                                </div>
                                <div className="mt-8 space-y-1">
                                    <button
                                        onClick={() => setSidebarOpen(false)}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-foreground hover:bg-accent rounded-lg transition-colors"
                                    >
                                        <Settings className="w-4 h-4 text-muted-foreground" />
                                        Configuración
                                    </button>
                                    <button
                                        onClick={() => setSidebarOpen(false)}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-foreground hover:bg-accent rounded-lg transition-colors"
                                    >
                                        <HelpCircle className="w-4 h-4 text-muted-foreground" />
                                        Centro de Ayuda
                                    </button>
                                </div>
                            </nav>
                            <div className="p-4 border-t border-border">
                                {isAuthenticated ? (
                                    <>
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                <span className="text-sm font-medium text-primary">
                                                    {user?.name?.[0]?.toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
                                                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleSignOut}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Cerrar Sesión
                                        </button>
                                    </>
                                ) : (
                                    /* Botón de login con GoogleAuth integrado */
                                    <div className="space-y-3">
                                        <p className="text-sm text-muted-foreground text-center">Inicia sesión para acceder a todas las funciones</p>
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
                            <Route path="/verify-phone" element={<PhoneVerificationPage />} />
                            <Route path="/privacy-policy.html" element={<PrivacyPolicy />} />
                            <Route path="/success" element={<PaymentSuccessPage />} />
                            <Route path="/cancel" element={<PaymentCancelPage />} />
                            <Route path="/ad/:id" element={<AdDetails onBack={() => window.history.back()} />} />
                            <Route path="/busquedas" element={<ProtectedRoute><SearchesPage /></ProtectedRoute>} />
                            <Route path="/busquedas/:id" element={<ProtectedRoute><SearchDetailsWrapper isAdmin={user?.role === 'Admin' || user?.email === 'dcastillaa@gmail.com'} /></ProtectedRoute>} />
                            <Route path="/detalles/:id" element={<ProtectedRoute><SearchResultsPage /></ProtectedRoute>} />
                            <Route path="/admin" element={<ProtectedRoute><AdminPanelPage /></ProtectedRoute>} />
                            <Route path="/admin/disputes" element={<ProtectedRoute><DisputePanelPage /></ProtectedRoute>} />
                            <Route path="/become-expert" element={<ProtectedRoute><BecomeExpertPage /></ProtectedRoute>} />
                            <Route path="/expert-panel" element={<ProtectedRoute><ExpertPanelPage /></ProtectedRoute>} />
                            <Route path="/" element={<SearchCreationPage />} />
                        </Routes>
                    </section>
                </main>


                {showFavorites && <FavoritesModal onClose={() => setShowFavorites(false)} />}
                <NotificationCenter isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
                <AccountSettingsModal isOpen={showAccountSettings} onClose={() => setShowAccountSettings(false)} />
                {notification && (
                    <div className="fixed top-4 right-4 z-[1000] flex flex-col items-end gap-2">
                        <Notification
                            type={notification.type}
                            message={notification.message}
                            onClose={() => setNotification(null)}
                        />
                    </div>
                )}
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