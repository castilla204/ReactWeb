import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Heart, Sparkles, Settings, HelpCircle, CreditCard, LogOut, Menu, Bell, UserPlus, Briefcase } from 'lucide-react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
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

import SearchesPage from './pages/SearchesPage';
import SearchCreationPage from './pages/SearchCreationPage';
import SubscriptionsPage from './pages/SubscriptionsPage';
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

const App: React.FC = React.memo(() => {
    const { user, isAuthenticated, signOut } = useAuth();
    const [showFavorites, setShowFavorites] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showAccountSettings, setShowAccountSettings] = useState(false);

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
        <Router>
            <div className="min-h-screen bg-white text-gray-900 relative overflow-x-hidden">
                {/* Header */}
                <header className="h-16 bg-white border-b border-gray-200 shadow-sm relative z-50">
                    <div className="max-w-7xl mx-auto h-full px-4 lg:px-6 flex items-center justify-between">
                        {/* Marca YoChequeo */}
                        <h1 className="text-xl font-bold bg-gradient-to-r from-gray-800 via-blue-700 to-emerald-700 bg-clip-text text-transparent tracking-tight">
                            YoChequeo
                        </h1>

                        {/* Navegación compacta */}
                        <div className="flex items-center">
                            {/* Navegación principal - siempre visible */}
                            <div className="hidden md:flex items-center">
                                <button
                                    onClick={() => isAuthenticated ? window.location.href = '/busquedas' : handleRequireAuth('Ver tus búsquedas')}
                                    className="flex items-center gap-1.5 px-2 py-1 text-sm text-gray-700 hover:text-blue-600 transition-colors"
                                >
                                    <Search className="w-4 h-4" />
                                    <span>Búsquedas</span>
                                </button>
                                <span className="text-gray-300 mx-2">|</span>
                                <button
                                    onClick={() => isAuthenticated ? setShowFavorites(true) : handleRequireAuth('Ver tus favoritos')}
                                    className="flex items-center gap-1.5 px-2 py-1 text-sm text-gray-700 hover:text-blue-600 transition-colors"
                                >
                                    <Heart className="w-4 h-4" />
                                    <span>Favoritos</span>
                                </button>
                                <span className="text-gray-300 mx-2">|</span>
                                <button
                                    type="button"
                                    onClick={() => isAuthenticated ? setShowNotifications(true) : handleRequireAuth('Ver tus notificaciones')}
                                    className="relative flex items-center gap-1.5 px-2 py-1 text-sm text-gray-700 hover:text-blue-600 transition-colors"
                                >
                                    {isAuthenticated && unreadCount > 0 && (
                                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 text-white text-[8px] flex items-center justify-center rounded-full border border-white">
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </div>
                                    )}
                                    <Bell className="w-4 h-4" />
                                    <span>Notificaciones</span>
                                </button>
                                
                                {/* Panel de experto integrado - solo para expertos autenticados */}
                                {isAuthenticated && isExpert && (
                                    <>
                                        <span className="text-gray-300 mx-2">|</span>
                                        <a
                                            href="/expert-panel"
                                            className="flex items-center gap-1.5 px-2 py-1 text-sm text-gray-700 hover:text-blue-600 transition-colors"
                                        >
                                            <Briefcase className="w-4 h-4" />
                                            <span>Panel</span>
                                        </a>
                                    </>
                                )}
                            </div>

                            {/* Separador antes del avatar/login */}
                            <span className="text-gray-300 mx-3">|</span>

                            {/* Botón menú móvil */}
                            <button
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="md:hidden p-1 text-gray-600 hover:text-gray-900 rounded transition-colors mr-2"
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
                                        <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                                            <div className="px-4 py-3 border-b border-gray-100">
                                                <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
                                                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                                <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                                                    {isExpert ? 'Experto' : 'Usuario'}
                                                </span>
                                            </div>
                                            <a
                                                href="/suscripciones"
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                                onClick={() => setShowProfileMenu(false)}
                                            >
                                                <Sparkles className="w-4 h-4 text-blue-600" />
                                                Suscripción
                                            </a>
                                            <button
                                                onClick={() => {
                                                    setShowAccountSettings(true);
                                                    setShowProfileMenu(false);
                                                }}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                            >
                                                <Settings className="w-4 h-4 text-gray-600" />
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
                        className="px-3 py-1.5 text-sm text-gray-700 hover:text-blue-600 transition-colors"
                    >
                        Iniciar Sesión
                    </button>
                </div>
            )}
                        </div>
                    </div>
                </header>



                {/* Sidebar - Always visible */}
                <div className={`fixed inset-y-0 left-0 z-40 w-72 bg-white shadow-xl transform transition-transform duration-200 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:hidden`}>
                        <div className="flex flex-col h-full">
                            <div className="p-4 border-b border-gray-100">
                                <h1 className="text-xl font-bold text-gray-900">ATRAPO</h1>
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
                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <Search className="w-4 h-4 text-blue-600" />
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
                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <Heart className="w-4 h-4 text-blue-600" />
                                        Favoritos
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (isAuthenticated) {
                                                window.location.href = '/suscripciones';
                                            } else {
                                                handleRequireAuth('Ver planes de suscripción');
                                            }
                                            setSidebarOpen(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <Sparkles className="w-4 h-4 text-blue-600" />
                                        Mejorar Plan
                                    </button>
                                    {isAuthenticated && isExpert ? (
                                        <a
                                            href="/expert-panel"
                                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                            onClick={() => setSidebarOpen(false)}
                                        >
                                            <Briefcase className="w-4 h-4 text-blue-600" />
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
                                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                        >
                                            <UserPlus className="w-4 h-4 text-blue-600" />
                                            Hazte Buscador
                                        </button>
                                    )}
                                </div>
                                <div className="mt-8 space-y-1">
                                    <button
                                        onClick={() => setSidebarOpen(false)}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <Settings className="w-4 h-4 text-gray-500" />
                                        Configuración
                                    </button>
                                    <button
                                        onClick={() => setSidebarOpen(false)}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <HelpCircle className="w-4 h-4 text-gray-500" />
                                        Centro de Ayuda
                                    </button>
                                    <a
                                        href="/suscripciones"
                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                        onClick={() => setSidebarOpen(false)}
                                    >
                                        <CreditCard className="w-4 h-4 text-gray-500" />
                                        Mi Suscripción
                                    </a>
                                </div>
                            </nav>
                            <div className="p-4 border-t border-gray-100">
                                {isAuthenticated ? (
                                    <>
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                                <span className="text-sm font-medium text-blue-400">
                                                    {user?.name?.[0]?.toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                                                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleSignOut}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Cerrar Sesión
                                        </button>
                                    </>
                                ) : (
                                    /* Botón de login con GoogleAuth integrado */
                                    <div className="space-y-3">
                                        <p className="text-sm text-gray-600 text-center">Inicia sesión para acceder a todas las funciones</p>
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
                                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:text-blue-600 border border-gray-300 rounded-lg transition-colors"
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
                            <Route path="/suscripciones" element={<ProtectedRoute><SubscriptionsPage /></ProtectedRoute>} />
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
                    <Notification
                        type={notification.type}
                        message={notification.message}
                        onClose={() => setNotification(null)}
                    />
                )}
            </div>
        </Router>
    );
});

export default App;