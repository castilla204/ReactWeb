import React, { useState, useEffect } from 'react';
import { Car, Home, Bike, ArrowRight, Shield } from 'lucide-react';
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
        if ((searchParameters.serviceTypeId === 2 && !searchParameters.keywords) || !searchParameters.userSearch) {
            setNotification({
                type: 'error',
                message: '📍 Por favor, completa los campos de búsqueda',
            });
            return;
        }
        console.log('SearchCreationPage - Starting search with parameters:', searchParameters);
        setCurrentStep(1);
        // Scroll to top when going to map step
        setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
    };

    const scrollToForm = () => {
        const formSection = document.getElementById('form-section');
        if (formSection) formSection.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="relative w-full bg-white overflow-hidden">
            {currentStep === 0 ? (
                <>
                    <HomePresentation onScrollToForm={scrollToForm} />
                    <div className="w-full py-8 md:py-12">
                        <div
                            id="form-section"
                            className="w-full mx-auto max-w-7xl px-4 md:px-8"
                        >
                            {/* Header */}
                            <div className="mb-8">
                                <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-3">
                                    Crea tu búsqueda personalizada
                                </h2>
                                <p className="text-gray-600 max-w-3xl">
                                    Define tus preferencias con precisión y déjanos encontrar exactamente lo que buscas. 
                                </p>
                            </div>
                            <div className="space-y-8 w-full">
                                {/* Categories Section */}
                                <div className="border-b border-gray-200 pb-8">
                                    <div className="mb-6">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="flex items-center justify-center w-7 h-7 bg-gray-900 text-white rounded-full text-sm font-medium">1</span>
                                            <h3 className="text-xl font-semibold text-gray-900">Selecciona tu categoría</h3>
                                        </div>
                                        <p className="text-gray-600 ml-10">¿Qué tipo de producto o servicio buscas?</p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ml-10">
                                        {safeCategories.map((category) => (
                                            <button
                                                key={category.id}
                                                onClick={() =>
                                                    setSearchParameters((prev) => ({ ...prev, category: category.id }))
                                                }
                                                className={`text-left p-6 border rounded-lg transition-all ${searchParameters.category === category.id
                                                    ? 'border-gray-900 bg-gray-50'
                                                    : 'border-gray-200 hover:border-gray-300 bg-white'
                                                    }`}
                                            >
                                                <div className={`w-12 h-12 mb-4 rounded-lg flex items-center justify-center ${searchParameters.category === category.id
                                                    ? 'bg-gray-900 text-white'
                                                    : 'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {category.id === 1 && <Car className="w-6 h-6" />}
                                                    {category.id === 2 && <Bike className="w-6 h-6" />}
                                                    {category.id === 3 && <Home className="w-6 h-6" />}
                                                </div>
                                                <h4 className="font-medium text-gray-900 mb-1">{category.name}</h4>
                                                <p className="text-sm text-gray-500">
                                                    {category.id === 1 && 'Coches, motos y vehículos'}
                                                    {category.id === 2 && 'Motocicletas y ciclomotores'}
                                                    {category.id === 3 && 'Inmuebles y propiedades'}
                                                </p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Service Type Section */}
                                <div className="border-b border-gray-200 pb-8">
                                    <div className="mb-6">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="flex items-center justify-center w-7 h-7 bg-gray-900 text-white rounded-full text-sm font-medium">2</span>
                                            <h3 className="text-xl font-semibold text-gray-900">Tipo de servicio</h3>
                                        </div>
                                        <p className="text-gray-600 ml-10">Elige cómo quieres que realicemos tu búsqueda</p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-10">
                                        <label className={`cursor-pointer p-6 border rounded-lg transition-all ${searchParameters.serviceTypeId === 1
                                            ? 'border-gray-900 bg-gray-50'
                                            : 'border-gray-200 hover:border-gray-300 bg-white'
                                            }`}>
                                            <input
                                                type="radio"
                                                value={1}
                                                checked={searchParameters.serviceTypeId === 1}
                                                onChange={() => {
                                                    setSearchParameters((prev) => ({ 
                                                        ...prev, 
                                                        serviceTypeId: 1,
                                                        keywords: 'revisión presencial'
                                                    }));
                                                }}
                                                className="sr-only"
                                            />
                                            <div className="flex items-start gap-3">
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${searchParameters.serviceTypeId === 1
                                                    ? 'border-gray-900 bg-gray-900'
                                                    : 'border-gray-300'
                                                    }`}>
                                                    {searchParameters.serviceTypeId === 1 && (
                                                        <div className="w-2 h-2 bg-white rounded-full"></div>
                                                    )}
                                                </div>
                                                <div>
                                                    <h4 className="font-medium text-gray-900 mb-1">Solo revisión</h4>
                                                    <p className="text-sm text-gray-600 mb-2">Únicamente revisión presencial de un anuncio específico</p>
                                                    <span className="text-xs text-gray-500">Directo • Específico • Presencial</span>
                                                </div>
                                            </div>
                                        </label>
                                        <label className={`cursor-pointer p-6 border rounded-lg transition-all ${searchParameters.serviceTypeId === 2
                                            ? 'border-gray-900 bg-gray-50'
                                            : 'border-gray-200 hover:border-gray-300 bg-white'
                                            }`}>
                                            <input
                                                type="radio"
                                                value={2}
                                                checked={searchParameters.serviceTypeId === 2}
                                                onChange={() =>
                                                    setSearchParameters((prev) => ({ ...prev, serviceTypeId: 2 }))
                                                }
                                                className="sr-only"
                                            />
                                            <div className="flex items-start gap-3">
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${searchParameters.serviceTypeId === 2
                                                    ? 'border-gray-900 bg-gray-900'
                                                    : 'border-gray-300'
                                                    }`}>
                                                    {searchParameters.serviceTypeId === 2 && (
                                                        <div className="w-2 h-2 bg-white rounded-full"></div>
                                                    )}
                                        </div>
                                        <div>
                                                    <h4 className="font-medium text-gray-900 mb-1">Búsqueda web + revisión</h4>
                                                    <p className="text-sm text-gray-600 mb-2">Búsqueda automatizada más revisión manual experta</p>
                                                    <span className="text-xs text-gray-500">Completo • Personal • Premium</span>
                                                </div>
                                        </div>
                                        </label>
                                    </div>
                                </div>

                                                                {/* Keywords Section - Only show if serviceTypeId is 2 */}
                                {searchParameters.serviceTypeId === 2 && (
                                    <div className="border-b border-gray-200 pb-8">
                                        <div className="mb-6">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="flex items-center justify-center w-7 h-7 bg-gray-900 text-white rounded-full text-sm font-medium">3</span>
                                                <h3 className="text-xl font-semibold text-gray-900">Palabras clave</h3>
                                            </div>
                                            <p className="text-gray-600 ml-10">Define qué estás buscando específicamente</p>
                                        </div>
                                        <div className="ml-10">
                                        <input
                                            type="text"
                                            value={searchParameters.keywords || ''}
                                            onChange={(e) =>
                                                setSearchParameters((prev) => ({ ...prev, keywords: e.target.value }))
                                            }
                                            placeholder="Ej: Tesla Model 3, BMW M4, Piso en Madrid centro..."
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none transition-all"
                                            />
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                <span className="text-sm text-gray-500">Ejemplos:</span>
                                        {['Tesla Model S', 'BMW Serie 3', 'Piso Madrid'].map((example) => (
                                            <button
                                                key={example}
                                                onClick={() => setSearchParameters(prev => ({ ...prev, keywords: example }))}
                                                        className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm hover:bg-gray-200 transition-colors"
                                            >
                                                {example}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                    </div>
                                )}

                                                                {/* Description Section */}
                                <div className="border-b border-gray-200 pb-8">
                                    <div className="mb-6">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="flex items-center justify-center w-7 h-7 bg-gray-900 text-white rounded-full text-sm font-medium">{searchParameters.serviceTypeId === 2 ? '4' : '3'}</span>
                                            <h3 className="text-xl font-semibold text-gray-900">
                                                {searchParameters.serviceTypeId === 1 
                                                    ? 'Introduce la URL del anuncio' 
                                                    : 'Describe tu búsqueda'
                                                }
                                            </h3>
                                        </div>
                                        <p className="text-gray-600 ml-10">
                                            {searchParameters.serviceTypeId === 1 
                                                ? 'URL del anuncio encontrado o si no está en ninguna plataforma de segunda mano indícalo'
                                                : 'Añade detalles específicos que te ayuden a encontrar exactamente lo que quieres'
                                            }
                                        </p>
                                    </div>
                                    <div className="ml-10">
                                        <textarea
                                            value={searchParameters.userSearch || ''}
                                            onChange={(e) =>
                                                setSearchParameters((prev) => ({ ...prev, userSearch: e.target.value }))
                                            }
                                            placeholder={searchParameters.serviceTypeId === 1 
                                                ? "Ejemplo: https://www.milanuncios.com/anuncio-coche-123456 o describe: Coche particular en venta, no está en plataformas online..."
                                                : "Ejemplo: Busco un coche de menos de 15.000€, automático, con pocos kilómetros, preferiblemente de color blanco o negro..."
                                            }
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 min-h-[120px] focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none transition-all resize-none"
                                        />
                                        {searchParameters.serviceTypeId === 2 && (
                                            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {['💰 Precio máximo', '📍 Ubicación', '🚗 Características', '⭐ Estado'].map((tip) => (
                                                    <div key={tip} className="text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-md">
                                                        {tip}
                                            </div>
                                        ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {/* Additional Options */}
                                <div className="border-b border-gray-200 pb-8">
                                    <label className="flex items-start gap-3 cursor-pointer ml-10">
                                        <input
                                            type="checkbox"
                                            checked={searchParameters.strictMatchOnly || false}
                                            onChange={(e) =>
                                                setSearchParameters((prev) => ({
                                                    ...prev,
                                                    strictMatchOnly: e.target.checked,
                                                }))
                                            }
                                            className="mt-1 w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900 focus:ring-1"
                                        />
                                        <div>
                                            <span className="text-sm font-medium text-gray-900">Solo coincidencias exactas</span>
                                            <p className="text-sm text-gray-600 mt-1">Buscar únicamente resultados que coincidan exactamente con tus criterios</p>
                                        </div>
                                    </label>
                                </div>

                                {/* Submit Button */}
                                <div className="pt-8">
                                    <button
                                        onClick={handleStartSearch}
                                        disabled={
                                            (searchParameters.serviceTypeId === 2 && !searchParameters.keywords) ||
                                            !searchParameters.userSearch ||
                                            !searchParameters.category ||
                                            !searchParameters.serviceTypeId
                                        }
                                        className="w-full px-8 py-4 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        <span>Crear mi búsqueda personalizada</span>
                                        <ArrowRight className="w-5 h-5" />
                                    </button>
                                    <p className="text-center text-sm text-gray-500 mt-3">
                                        Configuración rápida en menos de 2 minutos
                                    </p>
                                </div>
                            </div>
                            {isAuthenticated && (
                                <div className="mt-6 text-sm text-gray-500 flex items-center justify-center gap-2">
                                    <span>Búsquedas activas: {currentSearchCount} / {maxSearches}</span>
                                </div>
                            )}
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