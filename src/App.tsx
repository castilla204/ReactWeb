import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Heart, Sparkles, Shield, Settings, HelpCircle, CreditCard, LogOut, Menu, Bell } from 'lucide-react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { GoogleAuth } from './components/GoogleAuth';
import { NotificationCenter } from './components/NotificationCenter';
import { useNotifications } from './hooks/useNotifications';
import { FavoritesModal } from './components/FavoritesModal';
import { PhoneVerification as PhoneVerificationPage } from './pages/PhoneVerificationPage';
import { removeAuthToken } from './lib/auth';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { AdDetails } from './components/AdDetails';
import { PaymentSuccessPage } from './pages/PaymentSuccessPage';
import { PaymentCancelPage } from './pages/PaymentCancelPage';
import { Notification, NotificationType } from './components/Notification';
import { useUserSettings } from './hooks/useUserSettings';
import SearchesPage from './pages/SearchesPage';
import SearchCreationPage from './pages/SearchCreationPage';
import SubscriptionsPage from './pages/SubscriptionsPage';
import AdminPanelPage from './pages/AdminPanelPage';
import Background from './components/Background';

const App: React.FC = React.memo(() => {
    const { user, setUser, isAuthenticated } = useAuth();
    const [showFavorites, setShowFavorites] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const { settings, toggleWhatsApp } = useUserSettings();
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

    const handleSignOut = () => {
        setUser(null);
        removeAuthToken();
    };

    return (
        <Router>
            <div className="min-h-screen bg-white text-gray-900 relative overflow-x-hidden">
                {/* Header */}
                <header className="fixed top-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-sm border-b border-gray-100/50 z-40">
                    <div className="container mx-auto h-full px-4 flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <h1 className="text-2xl font-bold text-blue-600">ATRAPO</h1>
                            <div className="relative hidden md:block">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search something here"
                                    className="w-[320px] pl-10 pr-4 py-2 bg-gray-50 rounded-lg text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="hidden md:flex items-center gap-4">
                                <a href="/busquedas" className="p-2 hover:bg-gray-50 rounded-lg">
                                    <Search className="w-5 h-5 text-gray-600" />
                                </a>
                                <button className="p-2 hover:bg-gray-50 rounded-lg">
                                    <Heart className="w-5 h-5 text-gray-600" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowNotifications(true)}
                                    className="p-2 hover:bg-gray-50 rounded-lg relative"
                                >
                                    {unreadCount > 0 && (
                                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full">
                                            {unreadCount}
                                        </div>
                                    )}
                                    <Bell className="w-5 h-5 text-gray-600" />
                                </button>
                                {user?.email === 'dcastillaa@gmail.com' && (
                                    <a
                                        href="/admin"
                                        className="p-2 hover:bg-gray-50 rounded-lg text-gray-600"
                                        title="Admin Panel"
                                    >
                                        <Shield className="w-5 h-5" />
                                    </a>
                                )}
                                <button className="p-2 hover:bg-gray-50 rounded-lg">
                                    <Settings className="w-5 h-5 text-gray-600" />
                                </button>
                                {isAuthenticated && (
                                    <button
                                        onClick={() => toggleWhatsApp()}
                                        className={`p-2 rounded-lg transition-colors ${settings?.isWhatsAppEnabled
                                            ? 'bg-green-50 text-green-600 hover:bg-green-100'
                                            : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                                            }`}
                                        title={`WhatsApp notifications ${settings?.isWhatsAppEnabled ? 'enabled' : 'disabled'}`}
                                    >
                                        <svg
                                            viewBox="0 0 24 24"
                                            width="20"
                                            height="20"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            fill="none"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
                                            <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
                                        </svg>
                                    </button>
                                )}
                            </div>

                            {isAuthenticated ? (
                                <div className="relative" ref={profileMenuRef}>
                                    <button
                                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                                        className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center hover:bg-blue-200 transition-colors mr-12 md:mr-0"
                                    >
                                        <span className="text-sm font-medium text-blue-600">
                                            {user?.name?.[0]?.toUpperCase()}
                                        </span>
                                    </button>

                                    {showProfileMenu && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                                            <div className="px-4 py-2 border-b border-gray-100">
                                                <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                                                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                            </div>
                                            <a
                                                href="/suscripciones"
                                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                                onClick={() => setShowProfileMenu(false)}
                                            >
                                                <Sparkles className="w-4 h-4 text-blue-600" />
                                                Actualizar Suscripción
                                            </a>
                                            <button
                                                onClick={handleSignOut}
                                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                Cerrar Sesión
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="mr-12 md:mr-0">
                                    <GoogleAuth />
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Mobile Menu Button */}
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="fixed top-3 right-3 z-50 p-2 bg-white/95 backdrop-blur-sm shadow-sm hover:shadow md:hidden border border-gray-100/50 rounded-full transition-all"
                >
                    <Menu className="w-5 h-5 text-gray-600" />
                </button>

                {/* Sidebar */}
                <div className={`fixed inset-y-0 left-0 z-40 w-72 bg-white shadow-xl transform transition-transform duration-200 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:hidden`}>
                    <div className="flex flex-col h-full">
                        <div className="p-4 border-b border-gray-100">
                            <h1 className="text-xl font-bold text-gray-900">ATRAPO</h1>
                        </div>
                        <div className="p-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="Buscar..."
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-lg text-sm text-gray-900 placeholder-gray-500 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                        <nav className="flex-1 overflow-y-auto p-4">
                            <div className="space-y-1">
                                <a
                                    href="/busquedas"
                                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    onClick={() => setSidebarOpen(false)}
                                >
                                    <Search className="w-4 h-4 text-blue-600" />
                                    Mis Búsquedas
                                </a>
                                <button
                                    onClick={() => {
                                        setShowFavorites(true);
                                        setSidebarOpen(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <Heart className="w-4 h-4 text-blue-600" />
                                    Favoritos
                                </button>
                                <a
                                    href="/suscripciones"
                                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    onClick={() => setSidebarOpen(false)}
                                >
                                    <Sparkles className="w-4 h-4 text-blue-600" />
                                    Mejorar Plan
                                </a>
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
                        {isAuthenticated && (
                            <div className="p-4 border-t border-gray-100">
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
                            </div>
                        )}
                    </div>
                </div>

                {sidebarOpen && (
                    <div
                        className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-30 md:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                <Background />

                <main className="relative z-10">
                    <section className="container mx-auto px-6 min-h-screen flex flex-col pt-20 md:pt-24">
                        <Routes>
                            <Route path="/verify-phone" element={<PhoneVerificationPage />} />
                            <Route path="/privacy-policy.html" element={<PrivacyPolicy />} />
                            <Route path="/success" element={<PaymentSuccessPage />} />
                            <Route path="/cancel" element={<PaymentCancelPage />} />
                            <Route path="/ad/:id" element={<AdDetails onBack={() => window.history.back()} />} />
                            <Route path="/busquedas" element={<ProtectedRoute><SearchesPage /></ProtectedRoute>} />
                            <Route path="/suscripciones" element={<ProtectedRoute><SubscriptionsPage /></ProtectedRoute>} />
                            <Route path="/admin" element={<ProtectedRoute><AdminPanelPage /></ProtectedRoute>} />
                            <Route path="/" element={<ProtectedRoute><SearchCreationPage /></ProtectedRoute>} />
                        </Routes>
                    </section>
                </main>
                {showFavorites && <FavoritesModal onClose={() => setShowFavorites(false)} />}
                <NotificationCenter isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
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