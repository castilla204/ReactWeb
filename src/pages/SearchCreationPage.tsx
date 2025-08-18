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

interface SearchParameters {
    keywords: string;
    userSearch: string;
    category: number;
    frequency: number;
    latitude?: string;
    longitude?: string;
    locationRange?: number;
    minPrice?: number;
    maxPrice?: number;
    serviceTypeId: number;
    strictMatchOnly?: boolean;
}

const SearchCreationPage: React.FC = () => {
    const { isAuthenticated } = useAuth();
    const { categories } = useCategories();
    const { currentSearchCount, maxSearches } = useSubscriptionLimits();
    const [notification, setNotification] = useState<{ type: NotificationType; message: string } | null>(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [searchParameters, setSearchParameters] = useState<Partial<SearchParameters>>({
        keywords: '',
        userSearch: '',
        category: 1,
        frequency: 24,
        serviceTypeId: 1,
        strictMatchOnly: false,
    });
    const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
    const [expertProfilePicture, setExpertProfilePicture] = useState<string | undefined>(undefined);
    const [expertName, setExpertName] = useState<string | undefined>(undefined);
    const [servicePrice, setServicePrice] = useState<number | undefined>(undefined);
    const [serviceDescription, setServiceDescription] = useState<string | undefined>(undefined);

    const safeCategories = Array.isArray(categories) ? categories : [];

    const handleParametersComplete = (parameters: SearchParameters & { latitude: string; longitude: string; locationRange: number }) => {
        if (!isAuthenticated) {
            setNotification({
                type: 'error',
                message: '🔒 Por favor, inicia sesión para crear una búsqueda',
            });
            return;
        }
        if (currentSearchCount >= maxSearches) {
            setNotification({
                type: 'error',
                message: `👑 Has alcanzado el límite de ${maxSearches} búsquedas activas. ¡Mejora tu plan para crear más búsquedas!`,
            });
            window.location.href = '/suscripciones';
            return;
        }
        console.log('SearchCreationPage - Parameters received:', parameters);
        setSearchParameters(parameters);
        setCurrentStep(2);
    };

    const handleServiceSelectionComplete = (
        serviceId: number,
        expertProfilePicture?: string,
        expertName?: string,
        servicePrice?: number,
        serviceDescription?: string
    ) => {
        console.log('SearchCreationPage - Service selection complete:', {
            serviceId,
            expertProfilePicture,
            expertName,
            servicePrice,
            serviceDescription,
        });
        if (!expertName || servicePrice === undefined) {
            setNotification({
                type: 'error',
                message: '❌ Error: Los datos del servicio están incompletos (falta el nombre del experto o el precio).',
            });
            return;
        }
        setSelectedServiceId(serviceId);
        setExpertProfilePicture(expertProfilePicture);
        setExpertName(expertName);
        setServicePrice(servicePrice);
        setServiceDescription(serviceDescription);
        setCurrentStep(3);
    };

    const handleSearchComplete = () => {
        setNotification({
            type: 'success',
            message: '🎉 ¡Búsqueda creada con éxito! Te notificaremos cuando encontremos coincidencias.',
        });
        setCurrentStep(0);
        setSearchParameters({
            keywords: '',
            userSearch: '',
            category: 1,
            frequency: 24,
            serviceTypeId: 1,
            strictMatchOnly: false,
        });
        setSelectedServiceId(null);
        setExpertProfilePicture(undefined);
        setExpertName(undefined);
        setServicePrice(undefined);
        setServiceDescription(undefined);
    };

    const handleStartSearch = () => {
        if (!isAuthenticated) {
            setNotification({
                type: 'error',
                message: '🔒 Por favor, inicia sesión para crear una búsqueda',
            });
            return;
        }
        if (!searchParameters.serviceTypeId) {
            setNotification({
                type: 'error',
                message: '📍 Por favor, selecciona un tipo de servicio',
            });
            return;
        }
        if (!searchParameters.category) {
            setNotification({
                type: 'error',
                message: '📍 Por favor, selecciona una categoría',
            });
            return;
        }
        if (!searchParameters.keywords || !searchParameters.userSearch) {
            setNotification({
                type: 'error',
                message: '📍 Por favor, completa los campos de búsqueda',
            });
            return;
        }
        console.log('SearchCreationPage - Starting search with parameters:', searchParameters);
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
                            className="w-full bg-white rounded-3xl shadow-2xl p-8 md:p-12 border border-gray-100 mx-auto max-w-6xl animate-fade-in-up relative overflow-hidden"
                        >
                            {/* Background decoration */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-50 to-purple-50 rounded-full -translate-y-32 translate-x-32 opacity-50"></div>
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-green-50 to-blue-50 rounded-full translate-y-24 -translate-x-24 opacity-40"></div>
                            
                            {/* Header with icon */}
                            <div className="relative text-center mb-10">
                                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-6 shadow-lg">
                                    <Search className="w-10 h-10 text-white" />
                                </div>
                                <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-4 leading-tight">
                                    Crea tu búsqueda personalizada
                                </h2>
                                <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                                    Define tus preferencias con precisión y déjanos encontrar exactamente lo que buscas. 
                                    <span className="text-blue-600 font-medium">Es rápido y fácil.</span>
                                </p>
                            </div>
                            <div className="relative space-y-8 w-full mx-auto max-w-4xl">
                                {/* Categories Section */}
                                <div className="bg-gradient-to-r from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200 p-6 md:p-8 relative">
                                    <div className="absolute top-4 right-4 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                        <span className="text-blue-600 font-bold text-sm">1</span>
                                    </div>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                                            <Search className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900">Selecciona tu categoría</h3>
                                            <p className="text-gray-600 text-sm">¿Qué tipo de producto o servicio buscas?</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        {safeCategories.map((category) => (
                                            <button
                                                key={category.id}
                                                onClick={() =>
                                                    setSearchParameters((prev) => ({ ...prev, category: category.id }))
                                                }
                                                className={`group relative p-6 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${searchParameters.category === category.id
                                                    ? 'border-blue-500 bg-blue-50 shadow-lg'
                                                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                                                    }`}
                                            >
                                                <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center transition-colors ${searchParameters.category === category.id
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                                                    }`}>
                                                    {category.id === 1 && <Car className="w-8 h-8" />}
                                                    {category.id === 2 && <Bike className="w-8 h-8" />}
                                                    {category.id === 3 && <Home className="w-8 h-8" />}
                                                </div>
                                                <h4 className="font-semibold text-gray-900 mb-2">{category.name}</h4>
                                                <p className="text-xs text-gray-500">
                                                    {category.id === 1 && 'Coches, motos y vehículos'}
                                                    {category.id === 2 && 'Motocicletas y ciclomotores'}
                                                    {category.id === 3 && 'Inmuebles y propiedades'}
                                                </p>
                                                {searchParameters.category === category.id && (
                                                    <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                                        <span className="text-white text-xs">✓</span>
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {/* Keywords Section */}
                                <div className="bg-gradient-to-r from-white to-blue-50 rounded-2xl shadow-lg border border-gray-200 p-6 md:p-8 relative">
                                    <div className="absolute top-4 right-4 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                        <span className="text-green-600 font-bold text-sm">2</span>
                                    </div>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                                            <Search className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900">Palabras clave</h3>
                                            <p className="text-gray-600 text-sm">Define qué estás buscando específicamente</p>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={searchParameters.keywords || ''}
                                            onChange={(e) =>
                                                setSearchParameters((prev) => ({ ...prev, keywords: e.target.value }))
                                            }
                                            placeholder="Ej: Tesla Model 3, BMW M4, Piso en Madrid centro..."
                                            className="w-full p-4 md:p-5 rounded-xl border-2 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-green-500 focus:ring-4 focus:ring-green-100 pl-14 text-lg transition-all duration-300"
                                        />
                                        <Search className="absolute top-1/2 left-4 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
                                    </div>
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <span className="text-xs text-gray-500">Ejemplos populares:</span>
                                        {['Tesla Model S', 'BMW Serie 3', 'Piso Madrid'].map((example) => (
                                            <button
                                                key={example}
                                                onClick={() => setSearchParameters(prev => ({ ...prev, keywords: example }))}
                                                className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs hover:bg-gray-200 transition-colors"
                                            >
                                                {example}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {/* Description Section */}
                                <div className="bg-gradient-to-r from-white to-purple-50 rounded-2xl shadow-lg border border-gray-200 p-6 md:p-8 relative">
                                    <div className="absolute top-4 right-4 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                        <span className="text-purple-600 font-bold text-sm">3</span>
                                    </div>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                                            <Wand2 className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900">Describe tu búsqueda</h3>
                                            <p className="text-gray-600 text-sm">Añade detalles específicos que te ayuden a encontrar exactamente lo que quieres</p>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <textarea
                                            value={searchParameters.userSearch || ''}
                                            onChange={(e) =>
                                                setSearchParameters((prev) => ({ ...prev, userSearch: e.target.value }))
                                            }
                                            placeholder="Ejemplo: Busco un coche de menos de 15.000€, automático, con pocos kilómetros, preferiblemente de color blanco o negro..."
                                            className="w-full p-4 md:p-5 rounded-xl border-2 border-gray-200 text-gray-900 placeholder-gray-400 min-h-[120px] focus:border-purple-500 focus:ring-4 focus:ring-purple-100 pl-14 text-lg transition-all duration-300 resize-none"
                                        />
                                        <Wand2 className="absolute top-4 left-4 w-6 h-6 text-gray-400" />
                                    </div>
                                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
                                        {['💰 Precio máximo', '📍 Ubicación', '🚗 Características', '⭐ Estado'].map((tip) => (
                                            <div key={tip} className="flex items-center gap-2 text-xs text-gray-500 bg-white p-2 rounded-lg">
                                                <span>{tip}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                {/* Service Type Section */}
                                <div className="bg-gradient-to-r from-white to-orange-50 rounded-2xl shadow-lg border border-gray-200 p-6 md:p-8 relative">
                                    <div className="absolute top-4 right-4 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                                        <span className="text-orange-600 font-bold text-sm">4</span>
                                    </div>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                                            <Shield className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900">Tipo de servicio</h3>
                                            <p className="text-gray-600 text-sm">Elige cómo quieres que realicemos tu búsqueda</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <label className={`group relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:scale-105 ${searchParameters.serviceTypeId === 1
                                            ? 'border-orange-500 bg-orange-50 shadow-lg'
                                            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                                            }`}>
                                            <input
                                                type="radio"
                                                value={1}
                                                checked={searchParameters.serviceTypeId === 1}
                                                onChange={() =>
                                                    setSearchParameters((prev) => ({ ...prev, serviceTypeId: 1 }))
                                                }
                                                className="absolute top-4 right-4 w-5 h-5 text-orange-600"
                                            />
                                            <div className="mb-3">
                                                <h4 className="font-semibold text-gray-900 mb-2">🌐 Búsqueda Web</h4>
                                                <p className="text-sm text-gray-600">Búsqueda automatizada en múltiples plataformas web</p>
                                            </div>
                                            <div className="text-xs text-gray-500">Rápido • Automático • 24/7</div>
                                        </label>
                                        <label className={`group relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:scale-105 ${searchParameters.serviceTypeId === 2
                                            ? 'border-orange-500 bg-orange-50 shadow-lg'
                                            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                                            }`}>
                                            <input
                                                type="radio"
                                                value={2}
                                                checked={searchParameters.serviceTypeId === 2}
                                                onChange={() =>
                                                    setSearchParameters((prev) => ({ ...prev, serviceTypeId: 2 }))
                                                }
                                                className="absolute top-4 right-4 w-5 h-5 text-orange-600"
                                            />
                                            <div className="mb-3">
                                                <h4 className="font-semibold text-gray-900 mb-2">👨‍💼 Búsqueda Premium</h4>
                                                <p className="text-sm text-gray-600">Búsqueda web plus revisión manual experta</p>
                                            </div>
                                            <div className="text-xs text-gray-500">Personal • Detallado • Premium</div>
                                        </label>
                                    </div>
                                </div>
                                {/* Additional Options */}
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={searchParameters.strictMatchOnly || false}
                                            onChange={(e) =>
                                                setSearchParameters((prev) => ({
                                                    ...prev,
                                                    strictMatchOnly: e.target.checked,
                                                }))
                                            }
                                            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <div>
                                            <span className="text-sm font-medium text-gray-700">Solo coincidencias exactas</span>
                                            <p className="text-xs text-gray-500">Buscar únicamente resultados que coincidan exactamente con tus criterios</p>
                                        </div>
                                    </label>
                                </div>

                                {/* Submit Button */}
                                <div className="pt-4">
                                    <button
                                        onClick={handleStartSearch}
                                        disabled={
                                            !searchParameters.keywords ||
                                            !searchParameters.userSearch ||
                                            !searchParameters.category ||
                                            !searchParameters.serviceTypeId
                                        }
                                        className="group w-full px-8 py-6 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 text-white rounded-2xl text-lg font-bold hover:from-blue-700 hover:via-purple-700 hover:to-blue-800 transform hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-3xl relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                                        <div className="relative flex items-center justify-center gap-3">
                                            <span>🚀 Crear mi búsqueda personalizada</span>
                                            <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
                                        </div>
                                    </button>
                                    <p className="text-center text-sm text-gray-500 mt-4">
                                        ⚡ Configuración rápida en menos de 2 minutos
                                    </p>
                                </div>
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
                                        <img src="/images/avatar1.jpg" alt="Avatar" className="w-6 md:w-8 h-6 md:h-8 rounded-full" />
                                        <p className="text-xs md:text-sm font-medium text-gray-800">— Juan P.</p>
                                    </div>
                                </div>
                                <div className="p-4 md:p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
                                    <p className="text-sm md:text-base text-gray-600 mb-3">"El proceso fue súper sencillo y confiable. Recomiendo Atrapo a todos mis amigos."</p>
                                    <div className="flex items-center gap-2">
                                        <img src="/images/avatar2.jpg" alt="Avatar" className="w-6 md:w-8 h-6 md:h-8 rounded-full" />
                                        <p className="text-xs md:text-sm font-medium text-gray-800">— María G.</p>
                                    </div>
                                </div>
                                <div className="p-4 md:p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
                                    <p className="text-sm md:text-base text-gray-600 mb-3">"Nunca pensé que comprar un coche de segunda mano sería tan fácil. ¡Gran servicio!"</p>
                                    <div className="flex items-center gap-2">
                                        <img src="/images/avatar3.jpg" alt="Avatar" className="w-6 md:w-8 h-6 md:h-8 rounded-full" />
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
                    {currentStep === 1 && searchParameters.category && searchParameters.serviceTypeId && (
                        <SearchParameterForm
                            onComplete={handleParametersComplete}
                            setCurrentStep={setCurrentStep}
                            selectedCategory={searchParameters.category}
                            initialKeywords={searchParameters.keywords || ''}
                            initialUserSearch={searchParameters.userSearch || ''}
                            serviceTypeId={searchParameters.serviceTypeId}
                            strictMatchOnly={searchParameters.strictMatchOnly}
                        />
                    )}
                    {currentStep === 2 && searchParameters.category && searchParameters.serviceTypeId && searchParameters.latitude && searchParameters.longitude && searchParameters.locationRange && (
                        <ServiceSelection
                            onBack={() => setCurrentStep(1)}
                            onComplete={handleServiceSelectionComplete}
                            selectedCategory={searchParameters.category}
                            selectedServiceTypeId={searchParameters.serviceTypeId}
                            latitude={searchParameters.latitude}
                            longitude={searchParameters.longitude}
                            locationRange={searchParameters.locationRange}
                        />
                    )}
                    {currentStep === 3 && selectedServiceId && (
                        <>
                            {console.log('SearchCreationPage - Rendering SearchForm with:', {
                                selectedServiceId,
                                expertProfilePicture,
                                expertName,
                                servicePrice,
                                serviceDescription,
                            })}
                            <SearchForm
                                parameters={searchParameters as SearchParameters & { latitude: string; longitude: string; locationRange: number }}
                                setCurrentStep={setCurrentStep}
                                onComplete={handleSearchComplete}
                                serviceId={selectedServiceId}
                                setShowSubscriptions={() => (window.location.href = '/suscripciones')}
                                expertProfilePicture={expertProfilePicture}
                                expertName={expertName}
                                servicePrice={servicePrice}
                                serviceDescription={serviceDescription}
                            />
                        </>
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