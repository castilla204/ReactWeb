import React, { useState } from 'react';
import { Car, Home, Bike, Search, ArrowRight, Shield } from 'lucide-react';
import { useCategories } from '../contexts/CategoryContext';
import SearchForm from '../components/SearchForm';
import { SearchParameterForm } from '../components/SearchParameterForm';
import { useSubscriptionLimits } from '../hooks/useSubscriptionLimits';
import { useAuth } from '../contexts/AuthContext';
import { Notification, NotificationType } from '../components/Notification';
import HomeHero from '../components/HomeHero';

interface SearchCreationPageProps {
    // Removed setShowSubscriptions prop
}

const SearchCreationPage: React.FC<SearchCreationPageProps> = () => {
    const { isAuthenticated } = useAuth();
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
    const { categories } = useCategories();
    const { currentSearchCount, maxSearches } = useSubscriptionLimits();
    const [showSearchOptions, setShowSearchOptions] = useState(false);
    const [strictMatchOnly, setStrictMatchOnly] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    const handleParametersComplete = (parameters: any) => {
        setSearchParameters(parameters);
        setCurrentStep(2);
    };

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
        <div className="relative max-w-7xl mx-auto px-4 pt-4 md:pt-8">
            {currentStep === 0 ? (
                <>
                    <HomeHero />
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
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleStartSearch}
                                        disabled={!formData.keywords || !formData.userSearch || !selectedCategory}
                                        className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
                                    >
                                        <span>Generar</span>
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => setShowSearchOptions(prev => !prev)}
                                            className="h-full px-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
                                        >
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="12" cy="12" r="1" />
                                                <circle cx="12" cy="5" r="1" />
                                                <circle cx="12" cy="19" r="1" />
                                            </svg>
                                        </button>
                                        {showSearchOptions && (
                                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                                                <div className="px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors">
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={strictMatchOnly}
                                                            onChange={(e) => setStrictMatchOnly(e.target.checked)}
                                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <span className="text-sm text-gray-700">Coincidencia exacta</span>
                                                    </label>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
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
                </>
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
                            onComplete={handleSearchComplete}
                        />
                    )}
                </div>
            )}
            {notification && (
                <Notification
                    type={notification.type}
                    message={notification.message}
                    onClose={() => setNotification(null)}
                />
            )}
        </div>
    );
};

export default SearchCreationPage;