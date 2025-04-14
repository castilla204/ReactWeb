import React, { useState } from 'react'
import { Search, Car, Home, Bike, Heart, Sparkles, ArrowRight, Shield, ArrowLeft, Settings, HelpCircle, CreditCard, LogOut, Menu, Play, Bell } from 'lucide-react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext'
import { UserManagement } from './components/UserManagement'
import { GoogleAuth } from './components/GoogleAuth'
import { NotificationCenter } from './components/NotificationCenter'
import { useNotifications } from './hooks/useNotifications'
import { useCategories } from './contexts/CategoryContext'
import { useRef, useCallback } from 'react';
import { FavoritesModal } from './components/FavoritesModal'
import SearchForm from './components/SearchForm'
import { SubscriptionPlans } from './components/SubscriptionPlans'
import { PhoneVerificationPage } from './pages/PhoneVerificationPage'
import { SearchParameterForm } from './components/SearchParameterForm'
import { SearchDashboard } from './components/SearchDashboard'
import { removeAuthToken } from './lib/auth'
import { ProtectedRoute } from './components/ProtectedRoute'
import { PrivacyPolicy } from './pages/PrivacyPolicy'
import { AdDetails } from './components/AdDetails'
import { PaymentSuccessPage } from './pages/PaymentSuccessPage'
import { PaymentCancelPage } from './pages/PaymentCancelPage'
import { Notification, NotificationType } from './components/Notification';
import { useEffect } from 'react';
import { useSubscriptionLimits } from './hooks/useSubscriptionLimits'

const App: React.FC = React.memo(() => {
    const { user, setUser, isAuthenticated } = useAuth()
    const [showFavorites, setShowFavorites] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [showAdminPanel, setShowAdminPanel] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notification, setNotification] = useState<{
        type: NotificationType;
        message: string;
    } | null>(null);

    const [searchParameters, setSearchParameters] = useState<any>(null);
    const [formData, setFormData] = useState({
        keywords: '',
        userSearch: '',
    });
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [showSubscriptions, setShowSubscriptions] = useState(false);
    const { categories } = useCategories();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { currentSearchCount, maxSearches } = useSubscriptionLimits();
    const { unreadCount } = useNotifications();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const profileMenuRef = useRef<HTMLDivElement>(null);
    const [currentCard, setCurrentCard] = useState(0);
    const cards = [
        {
            title: "Forma fácil de encontrar\ncasa a buen precio",
            description: "Ofreciendo servicios de búsqueda\nseguros y confortables.",
            buttonText: "Buscar Casa",
            image: new URL('./media/house.png', import.meta.url).href,
            gradient: "from-blue-600 to-blue-700",
            imageClass: "-right-12 -bottom-16 transform-gpu [filter:drop-shadow(2px_4px_8px_rgba(0,0,0,0.2))_drop-shadow(0_30px_30px_rgba(29,78,216,0.35))_drop-shadow(0_20px_20px_rgba(59,130,246,0.45))]"
        },
        {
            title: "La Mejor Plataforma\npara Buscar Coches",
            description: "Facilidad para buscar coches de forma segura\ny cercana. Por supuesto, a bajo precio.",
            buttonText: "Buscar Coche",
            image: new URL('./media/Car.png', import.meta.url).href,
            gradient: "from-blue-500 to-blue-600",
            imageClass: "-right-12 bottom-0"
        }
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentCard((current) => (current + 1) % cards.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

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
        setUser(null)
        removeAuthToken()
    }

    const handleParametersComplete = (parameters: any) => {
        setSearchParameters(parameters);
        setCurrentStep(2);
    }

    const handleSearchComplete = () => {
        setNotification({
            type: 'success',
            message: '🎉 ¡Búsqueda creada con éxito! Te notificaremos cuando encontremos coincidencias.'
        });
        setCurrentStep(0);
        setSearchParameters(null);
        setFormData({
            keywords: '',
            userSearch: ''
        });
    };

    const handleStartSearch = () => {
        window.scrollTo(0, 0);

        if (!isAuthenticated) {
            setNotification({
                type: 'error',
                message: '🔒 Por favor, inicia sesión para crear una búsqueda'
            });
            return;
        }
        setCurrentStep(1);
        setSearchParameters(null);
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
                            {/* Desktop Navigation */}
                            <div className="hidden md:flex items-center gap-4">
                                <button
                                    onClick={() => {
                                        setShowSubscriptions(false);
                                        setCurrentStep(3);
                                    }}
                                    className="p-2 hover:bg-gray-50 rounded-lg"
                                >
                                    <Search className="w-5 h-5 text-gray-600" />
                                </button>
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
                                    <button
                                        onClick={() => {
                                            setShowFavorites(false);
                                            setShowSubscriptions(false);
                                            setCurrentStep(0);
                                            setShowAdminPanel(true);
                                        }}
                                        className={`p-2 rounded-lg transition-colors ${showAdminPanel
                                            ? 'bg-blue-50 text-blue-600'
                                            : 'hover:bg-gray-50 text-gray-600'
                                            }`}
                                        title="Admin Panel"
                                    >
                                        <Shield className="w-5 h-5" />
                                    </button>
                                )}
                                <button className="p-2 hover:bg-gray-50 rounded-lg">
                                    <Settings className="w-5 h-5 text-gray-600" />
                                </button>
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

                                    {/* Profile Dropdown Menu */}
                                    {showProfileMenu && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                                            <div className="px-4 py-2 border-b border-gray-100">
                                                <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                                                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setShowFavorites(false);
                                                    setShowSubscriptions(true);
                                                    setCurrentStep(0);
                                                    setShowProfileMenu(false);
                                                }}
                                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                            >
                                                <Sparkles className="w-4 h-4 text-blue-600" />
                                                Actualizar Suscripción
                                            </button>
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
                        {/* Logo */}
                        <div className="p-4 border-b border-gray-100">
                            <h1 className="text-xl font-bold text-gray-900">ATRAPO</h1>
                        </div>

                        {/* Search Bar */}
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

                        {/* Navigation */}
                        <nav className="flex-1 overflow-y-auto p-4">
                            <div className="space-y-1">
                                <button
                                    onClick={() => {
                                        setShowSubscriptions(false);
                                        setCurrentStep(3);
                                        setSidebarOpen(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <Search className="w-4 h-4 text-blue-600" />
                                    Mis Búsquedas
                                </button>
                                <button
                                    onClick={() => {
                                        setShowSubscriptions(false);
                                        setShowFavorites(true);
                                        setSidebarOpen(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <Heart className="w-4 h-4 text-blue-600" />
                                    Favoritos
                                </button>
                                <button
                                    onClick={() => {
                                        setShowFavorites(false);
                                        setShowSubscriptions(true);
                                        setCurrentStep(0);
                                        setSidebarOpen(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <Sparkles className="w-4 h-4 text-blue-600" />
                                    Mejorar Plan
                                </button>
                            </div>

                            <div className="mt-8 space-y-1">
                                <button
                                    onClick={() => {
                                        setShowSubscriptions(false);
                                        setCurrentStep(0);
                                        setSidebarOpen(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <Settings className="w-4 h-4 text-gray-500" />
                                    Configuración
                                </button>
                                <button
                                    onClick={() => {
                                        setShowSubscriptions(false);
                                        setCurrentStep(0);
                                        setSidebarOpen(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <HelpCircle className="w-4 h-4 text-gray-500" />
                                    Centro de Ayuda
                                </button>
                                <button
                                    onClick={() => {
                                        setShowFavorites(false);
                                        setShowSubscriptions(true);
                                        setCurrentStep(0);
                                        setSidebarOpen(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <CreditCard className="w-4 h-4 text-gray-500" />
                                    Mi Suscripción
                                </button>
                            </div>
                        </nav>

                        {/* User Profile */}
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

                {/* Overlay for mobile */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-30 md:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                    {/* Modern Grid Background */}
                    <div className="absolute inset-0 bg-white">
                        {/* Base grid pattern */}
                        <div className="absolute inset-0" style={{
                            backgroundImage: `
                                linear-gradient(to right, rgba(59, 130, 246, 0.1) 1px, transparent 1px),
                                linear-gradient(to bottom, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
                            `,
                            backgroundSize: '40px 40px'
                        }} />

                        {/* Larger grid pattern */}
                        <div className="absolute inset-0" style={{
                            backgroundImage: `
                                linear-gradient(to right, rgba(59, 130, 246, 0.2) 1px, transparent 1px),
                                linear-gradient(to bottom, rgba(59, 130, 246, 0.2) 1px, transparent 1px)
                            `,
                            backgroundSize: '160px 160px'
                        }} />

                        {/* Radial gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-transparent to-white/80" />
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_20%,white_70%)]" />

                        {/* Accent lines */}
                        <div className="absolute left-1/4 top-0 w-px h-full bg-gradient-to-b from-transparent via-blue-500/20 to-transparent" />
                        <div className="absolute right-1/4 top-0 w-px h-full bg-gradient-to-b from-transparent via-blue-500/20 to-transparent" />
                        <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
                        <div className="absolute bottom-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
                    </div>
                </div>

                {/* Main Content */}
                <main className="relative z-10">
                    <section className="container mx-auto px-6 min-h-screen flex flex-col pt-20 md:pt-24">
                        <Routes>
                            <Route path="/verify-phone" element={<PhoneVerificationPage />} />
                            <Route path="/privacy-policy.html" element={<PrivacyPolicy />} />
                            <Route path="/success" element={<PaymentSuccessPage />} />
                            <Route path="/cancel" element={<PaymentCancelPage />} />
                            <Route path="/ad/:id" element={<AdDetails onBack={() => window.history.back()} />} />
                            <Route path="/" element={showAdminPanel ? (
                                <UserManagement onBack={() => setShowAdminPanel(false)} />
                            ) : (
                                <ProtectedRoute>
                                    {showSubscriptions ? (
                                        <div>
                                            <button
                                                onClick={() => {
                                                    setShowSubscriptions(false);
                                                    setCurrentStep(0);
                                                }}
                                                className="mb-8 flex items-center text-gray-400 hover:text-white transition-colors"
                                            >
                                                <ArrowLeft className="w-5 h-5 mr-2" />
                                                Back
                                            </button>
                                            <SubscriptionPlans />
                                        </div>
                                    ) : currentStep === 3 ? (
                                        <SearchDashboard onBack={() => setCurrentStep(0)} />
                                    ) : currentStep === 0 ? (
                                        <div className="relative max-w-7xl mx-auto px-4 pt-4 md:pt-8">
                                            {/* Enhanced Landing Page Background - Mobile Optimized */}
                                            <div className="fixed inset-0 -z-10">
                                                {/* Base layer with subtle gradient */}
                                                <div className="absolute inset-0 bg-gradient-to-b from-blue-50 via-white to-blue-50" />

                                                {/* Animated gradient spheres */}
                                                <div className="absolute top-0 -right-1/4 w-full h-full">
                                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 via-blue-300/10 to-transparent rounded-full blur-3xl animate-pulse" />
                                                </div>
                                                <div className="absolute bottom-0 -left-1/4 w-full h-full">
                                                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 via-blue-400/10 to-transparent rounded-full blur-3xl animate-pulse [animation-delay:1s]" />
                                                </div>

                                                {/* Radial gradient overlays */}
                                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.1),transparent_50%)]" />
                                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(37,99,235,0.1),transparent_50%)]" />
                                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_80%,rgba(96,165,250,0.1),transparent_50%)]" />

                                                {/* Animated gradient flows */}
                                                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-100/10 to-transparent opacity-30 animate-gradient" />
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-200/10 to-transparent opacity-20 animate-gradient [animation-delay:2s]" />

                                                {/* Subtle grid pattern */}
                                                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAyMCAwIEwgMCAwIDAgMjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSg5NiwgMTY1LCAyNTAsIDAuMSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30" />

                                                {/* Light noise texture */}
                                                <div className="absolute inset-0 opacity-5" style={{
                                                    backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noise"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/%3E%3C/filter%3E%3Crect width="100%" height="100%" filter="url(%23noise)" opacity="0.5"/%3E%3C/svg%3E")',
                                                    filter: 'contrast(200%) brightness(150%)'
                                                }} />
                                            </div>

                                            {/* Mobile Carousel */}
                                            <div className="md:hidden relative w-full max-w-2xl mx-auto overflow-hidden mt-2">
                                                <div
                                                    className={`relative overflow-hidden rounded-3xl bg-gradient-to-r ${cards[currentCard].gradient} p-6 md:p-8 flex flex-col justify-between min-h-[280px] md:min-h-[320px] transition-opacity duration-500`}
                                                >
                                                    <div>
                                                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                                                            {cards[currentCard].title}
                                                            <div className="inline-flex items-center gap-2 ml-3 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium">
                                                                <span>+</span>
                                                                <Sparkles className="w-4 h-4" />
                                                                <span>IA</span>
                                                            </div>
                                                        </h2>
                                                        <p className="text-blue-100 text-sm md:text-base mb-6">
                                                            {cards[currentCard].description}
                                                        </p>
                                                        <button className="bg-white text-blue-600 px-6 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors">
                                                            {cards[currentCard].buttonText}
                                                        </button>
                                                    </div>
                                                    <img
                                                        src={cards[currentCard].image}
                                                        alt={cards[currentCard].buttonText}
                                                        className={`absolute w-64 md:w-72 object-contain ${cards[currentCard].imageClass}`}
                                                    />
                                                </div>
                                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                                                    {cards.map((_, index) => (
                                                        <button
                                                            key={index}
                                                            onClick={() => setCurrentCard(index)}
                                                            className={`w-2 h-2 rounded-full transition-colors ${index === currentCard ? 'bg-white' : 'bg-white/50'}`}
                                                        />
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Desktop Grid */}
                                            <div className="hidden md:grid grid-cols-2 gap-6">
                                                {/* First Card */}
                                                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-500 to-blue-600 p-8 flex flex-col justify-between min-h-[320px]">
                                                    <div>
                                                        <h2 className="text-3xl font-bold text-white mb-4">
                                                            La Mejor Plataforma<br />
                                                            para Buscar Coches
                                                            <div className="inline-flex items-center gap-2 ml-3 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium">
                                                                <span>+</span>
                                                                <Sparkles className="w-4 h-4" />
                                                                <span>IA</span>
                                                            </div>
                                                        </h2>
                                                        <p className="text-blue-100 text-base mb-6">
                                                            Facilidad para buscar coches de forma segura<br />
                                                            y cercana. Por supuesto, a bajo precio.
                                                        </p>
                                                        <button className="bg-white text-blue-600 px-6 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors">
                                                            Buscar Coche
                                                        </button>
                                                    </div>
                                                    <img
                                                        src={new URL('./media/Car.png', import.meta.url).href}
                                                        alt="White Sports Car"
                                                        className="absolute -right-12 bottom-0 w-72 object-contain"
                                                    />
                                                </div>

                                                {/* Second Card */}
                                                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-blue-700 p-8 flex flex-col justify-between min-h-[320px]">
                                                    <div>
                                                        <h2 className="text-3xl font-bold text-white mb-4">
                                                            Forma fácil de encontrar<br />
                                                            casa a buen precio
                                                            <div className="inline-flex items-center gap-2 ml-3 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium">
                                                                <span>+</span>
                                                                <Sparkles className="w-4 h-4" />
                                                                <span>IA</span>
                                                            </div>
                                                        </h2>
                                                        <p className="text-blue-100 text-base mb-6">
                                                            Ofreciendo servicios de búsqueda<br />
                                                            seguros y confortables.
                                                        </p>
                                                        <button className="bg-white text-blue-600 px-6 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors">
                                                            Buscar Casa
                                                        </button>
                                                    </div>
                                                    <img
                                                        src={new URL('./media/house.png', import.meta.url).href}
                                                        alt="Modern House"
                                                        className="absolute -right-12 -bottom-16 w-72 object-contain transform-gpu [filter:drop-shadow(2px_4px_8px_rgba(0,0,0,0.2))_drop-shadow(0_30px_30px_rgba(29,78,216,0.35))_drop-shadow(0_20px_20px_rgba(59,130,246,0.45))]"
                                                    />
                                                </div>

                                                {/* AI Separator */}
                                                <div className="absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center gap-4">
                                                    <div className="w-px h-32 bg-gradient-to-b from-transparent via-blue-500/20 to-transparent animate-pulse" />
                                                    <div className="relative group">
                                                        <div className="absolute inset-0 bg-[conic-gradient(from_0deg,theme(colors.blue.400/20),theme(colors.violet.400/20),theme(colors.blue.400/20))] rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 animate-spin [animation-duration:4s]" />
                                                        <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-white/90 to-white/80 backdrop-blur-xl flex items-center justify-center shadow-[0_8px_32px_-8px_rgba(59,130,246,0.3)] border border-blue-100/50 group-hover:border-blue-200/80 group-hover:shadow-[0_12px_36px_-8px_rgba(59,130,246,0.4)] transition-all duration-500">
                                                            <div className="relative">
                                                                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-violet-600 rounded-full blur opacity-0 group-hover:opacity-30 transition-opacity duration-500" />
                                                                <Sparkles className="w-7 h-7 text-blue-600 group-hover:scale-110 transition-transform duration-500 relative z-10" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="w-px h-32 bg-gradient-to-b from-transparent via-blue-500/20 to-transparent animate-pulse [animation-delay:0.5s]" />
                                                </div>

                                            </div>
                                            {/* Search Form */}
                                            <div className="mt-4 md:mt-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 p-4 md:p-6">
                                                <div className="relative z-10">
                                                    <div className="flex flex-wrap gap-1.5 mb-4">
                                                        {categories?.map((category) => (
                                                            <button
                                                                key={category.id}
                                                                onClick={() => setSelectedCategory(category.id)}
                                                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedCategory === category.id
                                                                    ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-200 shadow-sm'
                                                                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                                                    }`}
                                                            >
                                                                <span className="flex items-center gap-1.5">
                                                                    {category.id === 1 && <Car className="w-4 h-4" />}
                                                                    {category.id === 2 && <Bike className="w-4 h-4" />}
                                                                    {category.id === 3 && <Home className="w-4 h-4" />}
                                                                    {category.name}
                                                                </span>
                                                            </button>
                                                        ))}
                                                    </div>

                                                    <div className="w-full">
                                                        <input
                                                            type="text"
                                                            value={formData.keywords}
                                                            onChange={(e) => setFormData(prev => ({ ...prev, keywords: e.target.value }))}
                                                            placeholder="¿Qué estás buscando? (Ej: Tesla Model 3, BMW M4...)"
                                                            className="w-full px-4 py-2.5 rounded-lg bg-white/80 border border-gray-200 text-gray-900 text-sm placeholder-gray-500 transition-all focus:bg-white focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 hover:border-gray-300 outline-none select-none"
                                                        />
                                                    </div>

                                                    <div className="mt-3">
                                                        <textarea
                                                            value={formData.userSearch}
                                                            onChange={(e) => setFormData(prev => ({ ...prev, userSearch: e.target.value }))}
                                                            placeholder="Describe los detalles que buscas..."
                                                            className="w-full px-4 py-2.5 rounded-lg bg-white/80 border border-gray-200 text-gray-900 text-xs min-h-[80px] placeholder-gray-500 transition-all resize-none focus:bg-white focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 hover:border-gray-300 outline-none select-none"
                                                        />
                                                    </div>

                                                    <div className="mt-4">
                                                        <button
                                                            onClick={handleStartSearch}
                                                            disabled={!formData.keywords || !formData.userSearch || !selectedCategory}
                                                            className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
                                                        >
                                                            <span>Generar</span>
                                                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                                        </button>
                                                    </div>
                                                    {isAuthenticated && (
                                                        <div className="mt-3 text-[10px] text-gray-400 flex items-center justify-center gap-1.5">
                                                            <Search className="w-4 h-4" />
                                                            <span>Búsquedas activas: {currentSearchCount} / {maxSearches}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="mt-8 pb-4 md:fixed md:bottom-6 md:right-6 md:mt-0 md:pb-0 z-50 flex justify-end">
                                                <a
                                                    href="/privacy-policy.html"
                                                    className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1.5"
                                                >
                                                    <Shield className="w-3.5 h-3.5" />
                                                    Política de Privacidad
                                                </a>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="max-w-4xl mx-auto">
                                            {currentStep === 1 && (
                                                <SearchParameterForm
                                                    onComplete={handleParametersComplete}
                                                    setCurrentStep={setCurrentStep}
                                                    selectedCategory={selectedCategory}
                                                    initialKeywords={formData.keywords}
                                                    initialUserSearch={formData.userSearch}
                                                />
                                            )}
                                            {currentStep === 2 && (
                                                <SearchForm
                                                    parameters={searchParameters}
                                                    setCurrentStep={setCurrentStep}
                                                    setShowSubscriptions={setShowSubscriptions}
                                                    onComplete={handleSearchComplete}
                                                />
                                            )}
                                        </div>
                                    )}
                                </ProtectedRoute>
                            )} />
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
    )
});

export default App;

