import React, { useState } from 'react';
import { Car, Home, Bike, ArrowRight, Shield, Eye, Search, Settings, Users, FileText } from 'lucide-react';
import { useCategories } from '../contexts/CategoryContext';
import SearchForm from '../components/SearchForm';
import { SearchParameterForm } from '../components/SearchParameterForm';
import { ServiceSelection } from '../components/ServiceSelection';
import { ProgressBar } from '../components/ProgressBar';
import { useAuth } from '../contexts/AuthContext';
import { Notification, NotificationType } from '../components/Notification';
import HomePresentation from '../components/HomePresentation';
import { useServiceTypes } from '../hooks/useServiceTypes';


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
    // Removed subscription limits - no longer needed
    const { serviceTypes, isLoading: serviceTypesLoading, error: serviceTypesError } = useServiceTypes();
    const [notification, setNotification] = useState<{ type: NotificationType; message: string } | null>(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [searchParameters, setSearchParameters] = useState<Partial<SearchParameters>>({
        keywords: '',
        userSearch: '',
        frequency: 24,
        strictMatchOnly: false,
    });
    const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
    const [expertProfilePicture, setExpertProfilePicture] = useState<string | undefined>(undefined);
    const [expertName, setExpertName] = useState<string | undefined>(undefined);
    const [servicePrice, setServicePrice] = useState<number | undefined>(undefined);
    const [serviceDescription, setServiceDescription] = useState<string | undefined>(undefined);
    const [serviceImageUrls, setServiceImageUrls] = useState<string[]>([]);

    const safeCategories = Array.isArray(categories) ? categories : [];

    // Definición de los pasos del formulario
    const formSteps = [
        {
            id: 1,
            title: 'Categoría',
            description: 'Selecciona el tipo de servicio',
            icon: <Search className="w-4 h-4" />
        },
        {
            id: 2,
            title: 'Configuración',
            description: 'Define los parámetros de tu búsqueda',
            icon: <Settings className="w-4 h-4" />
        },
        {
            id: 3,
            title: 'Selección',
            description: 'Elige el experto ideal',
            icon: <Users className="w-4 h-4" />
        },
        {
            id: 4,
            title: 'Contratación',
            description: 'Finaliza tu solicitud',
            icon: <FileText className="w-4 h-4" />
        }
    ];

    const handleParametersComplete = (parameters: SearchParameters & { latitude: string; longitude: string; locationRange: number }) => {
        if (!isAuthenticated) {
            setNotification({
                type: 'error',
                message: '🔒 Por favor, inicia sesión para crear una búsqueda',
            });
            return;
        }
        // Removed subscription limits - unlimited searches now available
        console.log('SearchCreationPage - Parameters received:', parameters);
        // Ensure strictMatchOnly is always false
        const updatedParameters = { ...parameters, strictMatchOnly: false };
        setSearchParameters(updatedParameters);
        setCurrentStep(2);
    };

    const handleServiceSelectionComplete = (
        serviceId: number,
        expertProfilePicture?: string,
        expertName?: string,
        servicePrice?: number,
        serviceDescription?: string,
        serviceImageUrls?: string[]
    ) => {
        console.log('SearchCreationPage - Service selection complete:', {
            serviceId,
            expertProfilePicture,
            expertName,
            servicePrice,
            serviceDescription,
            serviceImageUrls,
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
        setServiceImageUrls(serviceImageUrls || []);
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
        // Find the selected service type to check if it requires keywords
        const selectedServiceType = serviceTypes.find(st => st.id === searchParameters.serviceTypeId);
        const requiresKeywords = selectedServiceType?.id === 2 || selectedServiceType?.name.toLowerCase().includes('búsqueda') || selectedServiceType?.name.toLowerCase().includes('search');
        
        if ((requiresKeywords && !searchParameters.keywords) || !searchParameters.userSearch) {
            setNotification({
                type: 'error',
                message: '📍 Por favor, completa los campos de búsqueda',
            });
            return;
        }
        console.log('SearchCreationPage - Starting search with parameters:', searchParameters);
        // Hide scroll during transition to make it invisible
        document.body.style.overflow = 'hidden';
        // Instant scroll to top
        window.scrollTo(0, 0);
        // Change step immediately
        setCurrentStep(1);
        // Restore scroll after a minimal delay
        setTimeout(() => {
            document.body.style.overflow = '';
        }, 50);
    };

    const scrollToForm = () => {
        const formSection = document.getElementById('form-section');
        if (formSection) formSection.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="relative w-full bg-white" style={{ transition: 'none', minHeight: '100vh' }}>
            {currentStep === 0 ? (
                <>
                    <HomePresentation onScrollToForm={scrollToForm} />
                    <div className="w-full py-6 md:py-8">
                        <div
                            id="form-section"
                            className="w-full mx-auto max-w-4xl lg:max-w-6xl px-4 md:px-6 lg:px-8"
                        >
                            {/* Header */}
                            <div className="mb-6">
                                <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-2">
                                    Crea tu búsqueda personalizada
                                </h2>
                                <p className="text-sm md:text-base text-gray-600">
                                    Define tus preferencias y déjanos encontrar exactamente lo que buscas.
                                </p>
                            </div>
                            <div className="space-y-6 w-full">
                                {/* Service Type Section */}
                                <div className="border-b border-gray-200 pb-6">
                                    <div className="mb-4">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white rounded-full text-sm font-medium">1</span>
                                            <h3 className="text-lg font-semibold text-gray-900">Tipo de servicio</h3>
                                        </div>
                                        <p className="text-sm text-gray-600 ml-9">Elige cómo quieres que realicemos tu búsqueda</p>
                                    </div>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 ml-9">
                                        {serviceTypesLoading ? (
                                            // Loading state
                                            <>
                                                <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 animate-pulse">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                                                        <div className="flex-1">
                                                            <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                                                            <div className="h-3 bg-gray-300 rounded w-full mb-2"></div>
                                                            <div className="flex gap-1">
                                                                <div className="h-5 bg-gray-300 rounded w-16"></div>
                                                                <div className="h-5 bg-gray-300 rounded w-20"></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 animate-pulse">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                                                        <div className="flex-1">
                                                            <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                                                            <div className="h-3 bg-gray-300 rounded w-full mb-2"></div>
                                                            <div className="flex gap-1">
                                                                <div className="h-5 bg-gray-300 rounded w-16"></div>
                                                                <div className="h-5 bg-gray-300 rounded w-20"></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        ) : serviceTypesError ? (
                                            // Error state
                                            <div className="col-span-2 p-4 border border-red-200 rounded-lg bg-red-50">
                                                <p className="text-red-600 text-sm">
                                                    Error al cargar los tipos de servicio. Usando configuración por defecto.
                                                </p>
                                            </div>
                                        ) : (
                                            // Dynamic service types
                                            serviceTypes.map((serviceType) => (
                                                <label 
                                                    key={serviceType.id}
                                                    className={`cursor-pointer p-4 border rounded-lg transition-all ${searchParameters.serviceTypeId === serviceType.id
                                                        ? 'border-blue-600 bg-blue-50'
                                                        : 'border-gray-200 hover:border-gray-300 bg-white'
                                                        }`}
                                                >
                                                    <input
                                                        type="radio"
                                                        value={serviceType.id}
                                                        checked={searchParameters.serviceTypeId === serviceType.id}
                                                        onChange={() => {
                                                            setSearchParameters((prev) => ({ 
                                                                ...prev, 
                                                                serviceTypeId: serviceType.id,
                                                                keywords: serviceType.id === 2 ? '' : 'revisión presencial'
                                                            }));
                                                        }}
                                                        className="sr-only"
                                                    />
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${searchParameters.serviceTypeId === serviceType.id
                                                            ? 'border-blue-600 bg-blue-600'
                                                            : 'border-gray-300'
                                                            }`}>
                                                            {searchParameters.serviceTypeId === serviceType.id && (
                                                                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                {serviceType.id === 1 ? (
                                                                    <Eye className="w-4 h-4 text-blue-600" />
                                                                ) : (
                                                                    <>
                                                                        <Search className="w-4 h-4 text-blue-600" />
                                                                        <Eye className="w-4 h-4 text-blue-600" />
                                                                    </>
                                                                )}
                                                                <h4 className="font-semibold text-gray-900">{serviceType.name}</h4>
                                                            </div>
                                                            <p className="text-sm text-gray-600 mb-1">{serviceType.description}</p>
                                                            <div className="flex flex-wrap gap-1">
                                                                {serviceType.serviceTypeCategoryName && (
                                                                    <span className="px-2 py-0.5 text-xs bg-purple-50 text-purple-700 rounded-full">
                                                                        {serviceType.serviceTypeCategoryName}
                                                                    </span>
                                                                )}
                                                                {serviceType.id === 1 ? (
                                                                    <>
                                                                        <span className="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded-full">Directo</span>
                                                                        <span className="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded-full">Presencial</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <span className="px-2 py-0.5 text-xs bg-green-50 text-green-700 rounded-full">Completo</span>
                                                                        <span className="px-2 py-0.5 text-xs bg-green-50 text-green-700 rounded-full">Premium</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </label>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Categories Section */}
                                <div className="border-b border-gray-200 pb-6">
                                    <div className="mb-4">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white rounded-full text-sm font-medium">2</span>
                                            <h3 className="text-lg font-semibold text-gray-900">Selecciona tu categoría</h3>
                                        </div>
                                        <p className="text-sm text-gray-600 ml-9">¿Qué tipo de producto o servicio buscas?</p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 ml-9">
                                        {safeCategories.map((category) => (
                                            <button
                                                key={category.id}
                                                onClick={() =>
                                                    setSearchParameters((prev) => ({ ...prev, category: category.id }))
                                                }
                                                className={`text-left p-4 border rounded-lg transition-all ${searchParameters.category === category.id
                                                    ? 'border-blue-600 bg-blue-50'
                                                    : 'border-gray-200 hover:border-gray-300 bg-white'
                                                    }`}
                                            >
                                                <div className={`w-10 h-10 mb-3 rounded-lg flex items-center justify-center ${searchParameters.category === category.id
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {category.id === 1 && <Car className="w-5 h-5" />}
                                                    {category.id === 2 && <Bike className="w-5 h-5" />}
                                                    {category.id === 3 && <Home className="w-5 h-5" />}
                                                </div>
                                                <h4 className="font-semibold text-gray-900 mb-1 text-sm">{category.name}</h4>
                                                <p className="text-xs text-gray-500">
                                                    {category.id === 1 && 'Coches, motos y vehículos'}
                                                    {category.id === 2 && 'Motocicletas y ciclomotores'}
                                                    {category.id === 3 && 'Inmuebles y propiedades'}
                                                </p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                                                {/* Keywords Section - Only show if service type requires keywords */}
                                {(() => {
                                    const selectedServiceType = serviceTypes.find(st => st.id === searchParameters.serviceTypeId);
                                    const requiresKeywords = selectedServiceType?.id === 2 || selectedServiceType?.name.toLowerCase().includes('búsqueda') || selectedServiceType?.name.toLowerCase().includes('search');
                                    return requiresKeywords && searchParameters.serviceTypeId;
                                })() && (
                                    <div className="border-b border-gray-200 pb-6">
                                        <div className="mb-4">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white rounded-full text-sm font-medium">3</span>
                                                <h3 className="text-lg font-semibold text-gray-900">Palabras clave</h3>
                                            </div>
                                            <p className="text-sm text-gray-600 ml-9">Define qué estás buscando específicamente</p>
                                        </div>
                                        <div className="ml-9">
                                            <input
                                                type="text"
                                                value={searchParameters.keywords || ''}
                                                onChange={(e) =>
                                                    setSearchParameters((prev) => ({ ...prev, keywords: e.target.value }))
                                                }
                                                placeholder="Ej: Tesla Model 3, BMW M4, Piso en Madrid centro..."
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none transition-all"
                                            />
                                            <div className="mt-2 flex flex-wrap gap-1">
                                                <span className="text-xs text-gray-500">Ejemplos:</span>
                                                {['Tesla Model S', 'BMW Serie 3', 'Piso Madrid'].map((example) => (
                                                    <button
                                                        key={example}
                                                        onClick={() => setSearchParameters(prev => ({ ...prev, keywords: example }))}
                                                        className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs hover:bg-gray-200 transition-colors"
                                                    >
                                                        {example}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Description Section */}
                                <div className="border-b border-gray-200 pb-6">
                                    <div className="mb-4">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white rounded-full text-sm font-medium">
                                                {(() => {
                                                    const selectedServiceType = serviceTypes.find(st => st.id === searchParameters.serviceTypeId);
                                                    const requiresKeywords = selectedServiceType?.id === 2 || selectedServiceType?.name.toLowerCase().includes('búsqueda') || selectedServiceType?.name.toLowerCase().includes('search');
                                                    return requiresKeywords ? '4' : '3';
                                                })()}
                                            </span>
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                {(() => {
                                                    const selectedServiceType = serviceTypes.find(st => st.id === searchParameters.serviceTypeId);
                                                    const requiresKeywords = selectedServiceType?.id === 2 || selectedServiceType?.name.toLowerCase().includes('búsqueda') || selectedServiceType?.name.toLowerCase().includes('search');
                                                    return requiresKeywords ? 'Describe tu búsqueda' : 'URL del anuncio';
                                                })()}
                                            </h3>
                                        </div>
                                        <p className="text-sm text-gray-600 ml-9">
                                            {(() => {
                                                const selectedServiceType = serviceTypes.find(st => st.id === searchParameters.serviceTypeId);
                                                const requiresKeywords = selectedServiceType?.id === 2 || selectedServiceType?.name.toLowerCase().includes('búsqueda') || selectedServiceType?.name.toLowerCase().includes('search');
                                                return requiresKeywords ? 'Detalles específicos para encontrar lo que buscas' : 'URL del anuncio o descripción si no está online';
                                            })()}
                                        </p>
                                    </div>
                                    <div className="ml-9">
                                        <textarea
                                            value={searchParameters.userSearch || ''}
                                            onChange={(e) =>
                                                setSearchParameters((prev) => ({ ...prev, userSearch: e.target.value }))
                                            }
                                            placeholder={(() => {
                                                const selectedServiceType = serviceTypes.find(st => st.id === searchParameters.serviceTypeId);
                                                const requiresKeywords = selectedServiceType?.id === 2 || selectedServiceType?.name.toLowerCase().includes('búsqueda') || selectedServiceType?.name.toLowerCase().includes('search');
                                                return requiresKeywords 
                                                    ? "Ej: Coche <15.000€, automático, pocos km, blanco/negro..."
                                                    : "Ej: https://www.milanuncios.com/anuncio-123456 o describe: Coche particular, no está online...";
                                            })()}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 min-h-[80px] focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none transition-all resize-none"
                                        />
                                        {(() => {
                                            const selectedServiceType = serviceTypes.find(st => st.id === searchParameters.serviceTypeId);
                                            const requiresKeywords = selectedServiceType?.id === 2 || selectedServiceType?.name.toLowerCase().includes('búsqueda') || selectedServiceType?.name.toLowerCase().includes('search');
                                            return requiresKeywords;
                                        })() && (
                                            <div className="mt-2 flex flex-wrap gap-1">
                                                {['💰 Precio', '📍 Ubicación', '🚗 Características', '⭐ Estado'].map((tip) => (
                                                    <div key={tip} className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-md">
                                                        {tip}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <div className="pt-6">
                                    <button
                                        onClick={handleStartSearch}
                                        disabled={
                                            serviceTypesLoading ||
                                            (() => {
                                                const selectedServiceType = serviceTypes.find(st => st.id === searchParameters.serviceTypeId);
                                                const requiresKeywords = selectedServiceType?.id === 2 || selectedServiceType?.name.toLowerCase().includes('búsqueda') || selectedServiceType?.name.toLowerCase().includes('search');
                                                return (requiresKeywords && !searchParameters.keywords) ||
                                                       !searchParameters.userSearch ||
                                                       !searchParameters.category ||
                                                       !searchParameters.serviceTypeId;
                                            })()
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
                                    <span>Búsquedas ilimitadas disponibles</span>
                                </div>
                            )}
                        </div>

                    </div>
                    <footer className="mt-16 bg-white border-t border-gray-100">
                        <div className="w-full px-4 sm:px-6 mx-auto max-w-7xl">
                            <div className="py-6 sm:py-8">
                                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6">
                                    {/* Copyright */}
                                    <p className="text-sm text-gray-600 text-center sm:text-left">
                                        © 2025 inspecciono.com. Todos los derechos reservados.
                                    </p>
                                    
                                    {/* Links */}
                                    <div className="flex flex-wrap justify-center sm:justify-end gap-4 sm:gap-6 text-sm">
                                        <a href="/privacy-policy.html" className="text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-1">
                                            <Shield className="w-3.5 h-3.5" />
                                            Privacidad
                                        </a>
                                        <a href="/terms.html" className="text-gray-500 hover:text-gray-700 transition-colors">
                                            Términos
                                        </a>
                                        <a href="/contact.html" className="text-gray-500 hover:text-gray-700 transition-colors">
                                            Contacto
                                        </a>
                                        <a href="/become-expert" className="text-gray-500 hover:text-blue-600 transition-colors">
                                            Hazte Experto
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </footer>
                </>
            ) : (
                <div className="w-full min-h-screen flex flex-col bg-gray-50">
                    {/* Botón Volver y Barra de progreso integrados */}
                    {currentStep >= 0 && (
                        <div className="w-full bg-gray-50 pt-6 pb-2">
                            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                                {/* Botón Volver arriba de la barra de progreso */}
                                {currentStep > 0 && (
                                    <div className="mb-4">
                                        <button
                                            onClick={() => setCurrentStep(currentStep - 1)}
                                            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium px-3 py-2 rounded-lg hover:bg-gray-100"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                            </svg>
                                            Volver
                                        </button>
                                    </div>
                                )}
                                <ProgressBar 
                                    currentStep={currentStep + 1}
                                    totalSteps={formSteps.length}
                                    steps={formSteps}
                                />
                            </div>
                        </div>
                    )}
                    
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
                                serviceImageUrls={serviceImageUrls}
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