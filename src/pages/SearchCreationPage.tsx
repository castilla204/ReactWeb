import React, { useState } from 'react';
import { Car, Home, Bike, ArrowRight, Shield, Eye, Search, FileText, ChevronDown, ChevronRight, CheckCircle, FolderTree } from 'lucide-react';
import { useCategories } from '../contexts/CategoryContext';
import SearchForm from '../components/SearchForm';
import { SearchParameterForm } from '../components/SearchParameterForm';
import { useAuth } from '../contexts/AuthContext';
import { Notification, NotificationType } from '../components/Notification';
import HomePresentation from '../components/HomePresentation';
import { useServiceTypes } from '../hooks/useServiceTypes';
import { Button } from '../components/ui/button';


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
    
    // Notificar a App.tsx cuando estamos en un formulario (step 1 o 2) para ocultar el header en móvil
    React.useEffect(() => {
        if (currentStep === 1 || currentStep === 2) {
            sessionStorage.setItem('isInFormStep', 'true');
        } else {
            sessionStorage.removeItem('isInFormStep');
        }
        // Disparar evento para que App.tsx pueda reaccionar
        window.dispatchEvent(new CustomEvent('formStepChanged', { detail: { step: currentStep } }));
    }, [currentStep]);
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
    const [expandedCategoryIds, setExpandedCategoryIds] = useState<number[]>([]);

    // Filtrar solo categorías padre
    const parentCategories = safeCategories.filter(cat => {
        // Calcular isParent si no viene del backend
        const isParent = cat.isParent !== undefined ? cat.isParent : cat.parentId === null;
        return isParent;
    });

    // Obtener subcategorías de una categoría padre
    const getSubcategories = (parentId: number) => {
        return safeCategories.filter(cat => cat.parentId === parentId);
    };

    const toggleCategoryExpand = (categoryId: number) => {
        setExpandedCategoryIds(prev => 
            prev.includes(categoryId)
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId]
        );
    };


    const handleParametersComplete = (parameters: SearchParameters & { 
        latitude: string; 
        longitude: string; 
        locationRange: number;
        serviceId?: number;
        expertProfilePicture?: string;
        expertName?: string;
        servicePrice?: number;
        serviceDescription?: string;
        serviceImageUrls?: string[];
    }) => {
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
        
        // Si viene el servicio seleccionado, guardarlo y pasar al siguiente paso
        if (parameters.serviceId) {
            setSelectedServiceId(parameters.serviceId);
            setExpertProfilePicture(parameters.expertProfilePicture);
            setExpertName(parameters.expertName);
            setServicePrice(parameters.servicePrice);
            setServiceDescription(parameters.serviceDescription);
            setServiceImageUrls(parameters.serviceImageUrls || []);
            setCurrentStep(2); // Ahora el paso 2 es Contratación (antes era 3)
        } else {
            // Si no viene servicio, quedarse en el paso actual
            setCurrentStep(1);
        }
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
        <div className="relative w-full bg-background" style={{ transition: 'none', minHeight: '100vh' }}>
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
                                <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-2">
                                    Crea tu búsqueda personalizada
                                </h2>
                                <p className="text-sm md:text-base text-muted-foreground">
                                    Define tus preferencias y déjanos encontrar exactamente lo que buscas.
                                </p>
                            </div>
                            <div className="space-y-6 w-full">
                                {/* Service Type Section */}
                                <div className="border-b border-gray-200 pb-6">
                                    <div className="mb-4">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white rounded-full text-sm font-medium">1</span>
                                            <h3 className="text-lg font-semibold text-foreground">Tipo de servicio</h3>
                                        </div>
                                        <p className="text-sm text-muted-foreground ml-9">Elige cómo quieres que realicemos tu búsqueda</p>
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
                                                        ? 'border-primary bg-primary/10'
                                                        : 'border-border hover:border-border/80 bg-background'
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
                                                                <div className="w-1.5 h-1.5 bg-background rounded-full"></div>
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
                                    <div className="ml-9 space-y-6">
                                        {/* Categorías Padre */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                            {parentCategories.map((parentCategory) => {
                                                const subcategories = getSubcategories(parentCategory.id);
                                                const hasSubcategories = subcategories.length > 0;
                                                const isExpanded = expandedCategoryIds.includes(parentCategory.id);
                                                const isSelected = searchParameters.category === parentCategory.id;
                                                
                                                return (
                                                    <div key={parentCategory.id}>
                                                        <div className={`group relative border-2 rounded-xl transition-all overflow-hidden ${
                                                            isSelected
                                                                ? 'border-primary bg-primary/5 shadow-md'
                                                                : 'border-border hover:border-primary/50 bg-background hover:shadow-sm'
                                                        }`}>
                                                            <div className="p-5">
                                                                <button
                                                                    onClick={() =>
                                                                        setSearchParameters((prev) => ({ ...prev, category: parentCategory.id }))
                                                                    }
                                                                    className="w-full flex flex-col items-center text-center space-y-3"
                                                                >
                                                                    <div className={`w-16 h-16 rounded-xl flex items-center justify-center transition-all ${
                                                                        isSelected
                                                                            ? 'bg-primary text-primary-foreground shadow-lg scale-105'
                                                                            : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600 group-hover:from-primary/10 group-hover:to-primary/20'
                                                                    }`}>
                                                                        {parentCategory.id === 1 && <Car className="w-8 h-8" />}
                                                                        {parentCategory.id === 2 && <Bike className="w-8 h-8" />}
                                                                        {parentCategory.id === 3 && <Home className="w-8 h-8" />}
                                                                        {![1, 2, 3].includes(parentCategory.id) && <FolderTree className="w-8 h-8" />}
                                                                    </div>
                                                                    <div className="w-full">
                                                                        <div className="flex items-center justify-center gap-2 mb-1">
                                                                            <h4 className={`font-semibold text-base ${
                                                                                isSelected ? 'text-primary' : 'text-gray-900'
                                                                            }`}>
                                                                                {parentCategory.name}
                                                                            </h4>
                                                                            {isSelected && (
                                                                                <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                                                                            )}
                                                                        </div>
                                                                        <p className="text-sm text-gray-500 mb-2">
                                                                            {parentCategory.id === 1 && 'Coches, motos y vehículos'}
                                                                            {parentCategory.id === 2 && 'Motocicletas y ciclomotores'}
                                                                            {parentCategory.id === 3 && 'Inmuebles y propiedades'}
                                                                            {![1, 2, 3].includes(parentCategory.id) && 'Selecciona esta categoría'}
                                                                        </p>
                                                                        {hasSubcategories && (
                                                                            <div className="flex items-center justify-center gap-2">
                                                                                <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground font-medium">
                                                                                    General
                                                                                </span>
                                                                                <span className="text-xs text-muted-foreground">
                                                                                    {subcategories.length} {subcategories.length === 1 ? 'subcategoría' : 'subcategorías'}
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </button>
                                                                {hasSubcategories && (
                                                                    <div className="mt-3 pt-3 border-t border-border">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => toggleCategoryExpand(parentCategory.id)}
                                                                            className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg transition-all ${
                                                                                isExpanded
                                                                                    ? 'bg-primary/10 text-primary'
                                                                                    : 'text-muted-foreground hover:bg-muted'
                                                                            }`}
                                                                        >
                                                                            {isExpanded ? (
                                                                                <>
                                                                                    <ChevronDown className="w-4 h-4" />
                                                                                    <span className="text-xs font-medium">Ocultar subcategorías</span>
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <ChevronRight className="w-4 h-4" />
                                                                                    <span className="text-xs font-medium">Ver subcategorías</span>
                                                                                </>
                                                                            )}
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Subcategorías - Nueva fila debajo */}
                                        {expandedCategoryIds.length > 0 && (
                                            <div className="space-y-4">
                                                {expandedCategoryIds.map((expandedCategoryId) => {
                                                    const parentCategory = parentCategories.find(cat => cat.id === expandedCategoryId);
                                                    if (!parentCategory) return null;
                                                    
                                                    const subcategories = getSubcategories(parentCategory.id);
                                                    if (subcategories.length === 0) return null;
                                                    
                                                    return (
                                                        <div key={expandedCategoryId} className="space-y-3">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                                                    {parentCategory.id === 1 && <Car className="w-4 h-4 text-primary" />}
                                                                    {parentCategory.id === 2 && <Bike className="w-4 h-4 text-primary" />}
                                                                    {parentCategory.id === 3 && <Home className="w-4 h-4 text-primary" />}
                                                                    {![1, 2, 3].includes(parentCategory.id) && <FolderTree className="w-4 h-4 text-primary" />}
                                                                </div>
                                                                <h3 className="text-sm font-semibold text-gray-700">
                                                                    Subcategorías de {parentCategory.name}
                                                                </h3>
                                                            </div>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                                                {subcategories.map((subcategory) => {
                                                                    const isSubSelected = searchParameters.category === subcategory.id;
                                                                    return (
                                            <button
                                                                            key={subcategory.id}
                                                onClick={() =>
                                                                                setSearchParameters((prev) => ({ ...prev, category: subcategory.id }))
                                                                            }
                                                                            className={`group/sub flex items-center gap-3 p-4 border-2 rounded-xl transition-all ${
                                                                                isSubSelected
                                                                                    ? 'border-primary bg-primary/5 shadow-md'
                                                                                    : 'border-border hover:border-primary/50 bg-background hover:shadow-sm'
                                                                            }`}
                                                                        >
                                                                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all flex-shrink-0 ${
                                                                                isSubSelected
                                                                                    ? 'bg-primary text-primary-foreground shadow-lg'
                                                                                    : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600 group-hover/sub:from-primary/10 group-hover/sub:to-primary/20'
                                                                            }`}>
                                                                                <FileText className="w-6 h-6" />
                                                                            </div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <h4 className={`font-semibold text-sm ${
                                                                                    isSubSelected ? 'text-primary' : 'text-gray-900'
                                                                                }`}>
                                                                                    {subcategory.name}
                                                                                </h4>
                                                </div>
                                                                            {isSubSelected && (
                                                                                <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                                                                            )}
                                            </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
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
                                <div className="pt-6 flex justify-end">
                                    <Button
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
                                        size="lg"
                                    >
                                        Crear mi búsqueda personalizada
                                        <ArrowRight className="w-5 h-5 ml-2" />
                                    </Button>
                                </div>
                            </div>
                            {isAuthenticated && (
                                <div className="mt-6 text-sm text-gray-500 flex items-center justify-center gap-2">
                                    <span>Búsquedas ilimitadas disponibles</span>
                                </div>
                            )}
                        </div>

                    </div>
                    <footer className="mt-16 bg-background border-t border-border">
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
                <div className="w-full h-screen flex flex-col bg-gray-50 overflow-hidden lg:min-h-screen lg:h-auto">
                    {/* Barra superior minimalista */}
                                {currentStep > 0 && currentStep < 2 && (
                        <div className="w-full bg-background border-b flex-shrink-0">
                            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                                        <button
                                            onClick={() => setCurrentStep(currentStep - 1)}
                                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                            </svg>
                                            Volver
                                        </button>
                            </div>
                        </div>
                    )}
                    
                    {currentStep === 1 && searchParameters.category && searchParameters.serviceTypeId && (
                        <div className="flex-1 min-h-0 overflow-hidden">
                            <SearchParameterForm
                                onComplete={handleParametersComplete}
                                setCurrentStep={setCurrentStep}
                                selectedCategory={searchParameters.category}
                                initialKeywords={searchParameters.keywords || ''}
                                initialUserSearch={searchParameters.userSearch || ''}
                                serviceTypeId={searchParameters.serviceTypeId}
                            />
                        </div>
                    )}
                    {currentStep === 2 && selectedServiceId && (
                        <div className="flex-1 overflow-y-auto">
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
                        </div>
                    )}
                </div>
            )}
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

export default SearchCreationPage;