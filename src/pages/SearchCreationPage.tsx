import React, { useState } from 'react';
import { Car, Home, Bike, Search, ArrowRight, Shield, Wand2 } from 'lucide-react';
import { useCategories } from '../contexts/CategoryContext';
import SearchForm from '../components/SearchForm';
import { SearchParameterForm } from '../components/SearchParameterForm';
import { ServiceSelection } from '../components/ServiceSelection';
import { useSubscriptionLimits } from '../hooks/useSubscriptionLimits';
import { useAuth } from '../contexts/AuthContext';
import { Notification, NotificationType } from '../components/Notification';
import HomePresentation from '../components/HomePresentation';

const SearchCreationPage = () => {
    const { isAuthenticated } = useAuth();
    const [notification, setNotification] = useState(null);
    const [searchParameters, setSearchParameters] = useState(null);
    const [selectedServiceTypeId, setSelectedServiceTypeId] = useState(1);
    const [selectedServiceId, setSelectedServiceId] = useState(null);
    const [formData, setFormData] = useState({ keywords: '', userSearch: '' });
    const [selectedCategory, setSelectedCategory] = useState(null);
    const { categories } = useCategories();
    const { currentSearchCount, maxSearches } = useSubscriptionLimits();
    const [strictMatchOnly, setStrictMatchOnly] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [showMobileOptions, setShowMobileOptions] = useState(false);

    // Ensure categories is an array to prevent TypeError
    const safeCategories = Array.isArray(categories) ? categories : [];

    const handleParametersComplete = (parameters) => {
        parameters.strictMatchOnly = strictMatchOnly;
        parameters.serviceTypeId = selectedServiceTypeId;
        setSearchParameters(parameters);
        setCurrentStep(2);
    };

    const handleServiceSelectionComplete = (serviceId) => {
        setSelectedServiceId(serviceId);
        setCurrentStep(3);
    };

    const handleSearchComplete = () => {
        setNotification({
            type: 'success',
            message: '🎉 ¡Búsqueda creada con éxito! Te notificaremos cuando encontremos coincidencias.',
        });
        setCurrentStep(0);
        setSearchParameters(null);
        setSelectedServiceTypeId(1);
        setSelectedServiceId(null);
        setFormData({ keywords: '', userSearch: '' });
        setSelectedCategory(null);
    };

    const handleStartSearch = () => {
        if (!isAuthenticated) {
            setNotification({
                type: 'error',
                message: '🔒 Por favor, inicia sesión para crear una búsqueda',
            });
            return;
        }
        if (!selectedServiceTypeId) {
            setNotification({
                type: 'error',
                message: '📍 Por favor, selecciona un tipo de servicio',
            });
            return;
        }
        if (!selectedCategory) {
            setNotification({
                type: 'error',
                message: '📍 Por favor, selecciona una categoría',
            });
            return;
        }
        if (!formData.keywords || !formData.userSearch) {
            setNotification({
                type: 'error',
                message: '📍 Por favor, completa los campos de búsqueda',
            });
            return;
        }
        setCurrentStep(1);
    };

    const scrollToForm = () => {
        const formSection = document.getElementById('form-section');
        if (formSection) formSection.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="relative w-full bg-gradient-to-b from-blue-50 to-white/90 overflow-hidden animate-fade-in">
            {currentStep === 0 ? (
                <>
                    <HomePresentation onScrollToForm={scrollToForm} />
                    <div className="w-full py-12 md:py-16">
                        <div
                            id="form-section"
                            className="w-full bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-100 mx-auto max-w-6xl animate-fade-in-up"
                        >
                            <h2 className="text-2xl md:text-3xl font-display text-blue-900 mb-5 md:mb-6 text-center leading-tight">
                                Crea tu búsqueda personalizada
                            </h2>
                            <p className="text-sm md:text-base text-gray-600 mb-6 md:mb-8 text-center max-w-xl mx-auto">
                                Define tus preferencias y déjanos encontrar el coche perfecto para ti.
                            </p>
                            <div className="space-y-6 w-full mx-auto max-w-3xl">
                                <div className="bg-white rounded-xl shadow-md p-4 md:p-5">
                                    <h3 className="text-base md:text-lg font-semibold mb-3 flex items-center gap-2 text-blue-900">
                                        <Search className="w-4 md:w-5 h-4 md:h-5 text-blue-600" /> Categoría
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        {safeCategories.map((category) => (
                                            <button
                                                key={category.id}
                                                onClick={() => setSelectedCategory(category.id)}
                                                className={`px-3 py-2 md:px-4 md:py-3 rounded-lg text-xs md:text-sm font-medium transition-colors flex items-center justify-center gap-2 ${selectedCategory === category.id
                                                    ? 'bg-blue-600 text-white shadow-sm'
                                                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                                    }`}
                                            >
                                                {category.id === 1 && <Car className="w-4 md:w-5 h-4 md:h-5" />}
                                                {category.id === 2 && <Bike className="w-4 md:w-5 h-4 md:h-5" />}
                                                {category.id === 3 && <Home className="w-4 md:w-5 h-4 md:h-5" />}
                                                {category.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-white rounded-xl shadow-md p-4 md:p-5">
                                    <h3 className="text-base md:text-lg font-semibold mb-3 flex items-center gap-2 text-blue-900">
                                        <Search className="w-4 md:w-5 h-4 md:h-5 text-blue-600" /> Palabras clave
                                    </h3>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={formData.keywords}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, keywords: e.target.value }))}
                                            placeholder="Ej: Tesla Model 3, BMW M4, Piso en Madrid centro..."
                                            className="w-full p-3 md:p-4 rounded-lg border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 pl-9"
                                        />
                                        <Search className="absolute top-1/2 left-3 transform -translate-y-1/2 w-4 md:w-5 h-4 md:h-5 text-gray-400" />
                                    </div>
                                </div>
                                <div className="bg-white rounded-xl shadow-md p-4 md:p-5">
                                    <h3 className="text-base md:text-lg font-semibold mb-3 flex items-center gap-2 text-blue-900">
                                        <Wand2 className="w-4 md:w-5 h-4 md:h-5 text-blue-600" /> Describe tu búsqueda
                                    </h3>
                                    <div className="relative">
                                        <textarea
                                            value={formData.userSearch}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, userSearch: e.target.value }))}
                                            placeholder="Detalles como precio máximo, características específicas, etc."
                                            className="w-full p-3 md:p-4 rounded-lg border border-gray-200 text-gray-900 placeholder-gray-400 min-h-[100px] focus:border-blue-500 focus:ring-1 focus:ring-blue-100 pl-9"
                                        />
                                        <Wand2 className="absolute top-3 left-3 w-4 md:w-5 h-4 md:h-5 text-gray-400" />
                                    </div>
                                </div>
                                <div className="bg-white rounded-xl shadow-md p-4 md:p-5">
                                    <h3 className="text-base md:text-lg font-semibold mb-3 flex items-center gap-2 text-blue-900">
                                        <Shield className="w-4 md:w-5 h-4 md:h-5 text-blue-600" /> Tipo de servicio
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <label className="flex items-center gap-2 p-3 md:p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                                            <input
                                                type="radio"
                                                value={1}
                                                checked={selectedServiceTypeId === 1}
                                                onChange={() => setSelectedServiceTypeId(1)}
                                                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                            />
                                            <span className="text-xs md:text-sm text-gray-700">Búsqueda Web</span>
                                        </label>
                                        <label className="flex items-center gap-2 p-3 md:p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                                            <input
                                                type="radio"
                                                value={2}
                                                checked={selectedServiceTypeId === 2}
                                                onChange={() => setSelectedServiceTypeId(2)}
                                                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                            />
                                            <span className="text-xs md:text-sm text-gray-700">Búsqueda Web + Revisión</span>
                                        </label>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={strictMatchOnly}
                                        onChange={(e) => setStrictMatchOnly(e.target.checked)}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <label className="text-xs md:text-sm text-gray-700">Solo coincidencias exactas</label>
                                </div>
                                <button
                                    onClick={handleStartSearch}
                                    disabled={!formData.keywords || !formData.userSearch || !selectedCategory || !selectedServiceTypeId}
                                    className="w-full py-2 md:py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition-colors shadow-md hover:shadow-lg animate-fade-in-up"
                                >
                                    Continuar <ArrowRight className="inline w-4 h-4 ml-2" />
                                </button>
                            </div>
                            {isAuthenticated && (
                                <div className="mt-4 text-xs md:text-sm text-gray-500 flex items-center justify-center gap-2 animate-fade-in-up">
                                    <Search className="w-4 h-4" />
                                    <span>Búsquedas activas: {currentSearchCount} / {maxSearches}</span>
                                </div>
                            )}
                        </div>
                        <div className="mt-12 md:mt-16 bg-gray-50 py-10 md:py-12">
                            <h2 className="text-2xl md:text-3xl font-display text-blue-900 mb-6 md:mb-8 text-center leading-tight">
                                Lo que dicen nuestros clientes
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mx-auto max-w-5xl">
                                <div className="p-4 md:p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
                                    <p className="text-sm md:text-base text-gray-600 mb-3">"Atrapo me ayudó a encontrar el coche perfecto en solo unos días. ¡La revisión presencial fue clave!"</p>
                                    <div className="flex items-center gap-2">
                                        <img src="path-to-avatar1.jpg" alt="Avatar" className="w-6 md:w-8 h-6 md:h-8 rounded-full" />
                                        <p className="text-xs md:text-sm font-medium text-gray-800">— Juan P.</p>
                                    </div>
                                </div>
                                <div className="p-4 md:p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
                                    <p className="text-sm md:text-base text-gray-600 mb-3">"El proceso fue súper sencillo y confiable. Recomiendo Atrapo a todos mis amigos."</p>
                                    <div className="flex items-center gap-2">
                                        <img src="path-to-avatar2.jpg" alt="Avatar" className="w-6 md:w-8 h-6 md:h-8 rounded-full" />
                                        <p className="text-xs md:text-sm font-medium text-gray-800">— María G.</p>
                                    </div>
                                </div>
                                <div className="p-4 md:p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
                                    <p className="text-sm md:text-base text-gray-600 mb-3">"Nunca pensé que comprar un coche de segunda mano sería tan fácil. ¡Gran servicio!"</p>
                                    <div className="flex items-center gap-2">
                                        <img src="path-to-avatar3.jpg" alt="Avatar" className="w-6 md:w-8 h-6 md:h-8 rounded-full" />
                                        <p className="text-xs md:text-sm font-medium text-gray-800">— Carlos R.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <footer className="mt-12 py-6 bg-gray-100">
                        <div className="w-full px-4 md:px-6 flex flex-col md:flex-row justify-between items-center mx-auto max-w-7xl">
                            <p className="text-xs md:text-sm text-gray-600 mb-2 md:mb-0">© 2025 Atrapo. Todos los derechos reservados.</p>
                            <div className="flex flex-col md:flex-row gap-2 md:gap-4">
                                <a href="/privacy-policy.html" className="text-xs md:text-sm text-gray-600 hover:text-blue-800 flex items-center gap-1">
                                    <Shield className="w-4 h-4" /> Política de Privacidad
                                </a>
                                <a href="/terms.html" className="text-xs md:text-sm text-gray-600 hover:text-blue-800">Términos y Condiciones</a>
                                <a href="/contact.html" className="text-xs md:text-sm text-gray-600 hover:text-blue-800">Contacto</a>
                            </div>
                        </div>
                    </footer>
                </>
            ) : (
                <div className="w-full py-12 md:py-16">
                    {currentStep === 1 && selectedCategory && selectedServiceTypeId && (
                        <SearchParameterForm
                            onComplete={handleParametersComplete}
                            setCurrentStep={setCurrentStep}
                            selectedCategory={selectedCategory}
                            initialKeywords={formData.keywords}
                            initialUserSearch={formData.userSearch}
                            serviceTypeId={selectedServiceTypeId}
                        />
                    )}
                    {currentStep === 2 && selectedCategory && selectedServiceTypeId && (
                        <ServiceSelection
                            onBack={() => setCurrentStep(1)}
                            onComplete={handleServiceSelectionComplete}
                            selectedCategory={selectedCategory}
                            selectedServiceTypeId={selectedServiceTypeId}
                        />
                    )}
                    {currentStep === 3 && selectedServiceId && (
                        <SearchForm
                            parameters={{ ...searchParameters, serviceTypeId: selectedServiceTypeId }}
                            setCurrentStep={setCurrentStep}
                            onComplete={handleSearchComplete}
                            serviceId={selectedServiceId}
                        />
                    )}
                </div>
            )}
            {notification && (
                <Notification type={notification.type} message={notification.message} onClose={() => setNotification(null)} />
            )}
        </div>
    );
};

export default SearchCreationPage;