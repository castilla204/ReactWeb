import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertTriangle, CheckCircle, User } from 'lucide-react';
import Background from '../components/Background';
import { useAuth } from '../contexts/AuthContext';
import { useCategories } from '../contexts/CategoryContext';
import { useExpert } from '../hooks/useExpert';
import { useExpertHires } from '../hooks/useExpertHires';
import { useServices } from '../hooks/useServices';
import { ServicesTab } from '../components/expertPanel/ServicesTab';
import { HiresTab } from '../components/expertPanel/HiresTab';
import { ServiceForm } from '../components/expertPanel/ServiceForm';

interface Hire {
    id: number;
    searchId: number | null;
    client: { name: string; email: string };
    service: { categoryId: number };
    serviceType: { id: number; name: string; description: string; isActive: boolean; createdAt: string; updatedAt: string } | null;
    status: 'pending' | 'awaiting_client_decision' | 'disputed' | 'completed' | 'cancelled' | 'transfer_failed' | 'dispute-resolved';
    createdAt: string;
    amount: number;
}

interface Service {
    id: number;
    expertProfileId: number;
    categoryId: number;
    serviceTypeId: number;
    price: number;
    conditions: string;
    durationInHours: number | null;
    imageUrls: string[];
    createdAt: string;
    updatedAt: string;
}

export function ExpertPanelPage() {
    const navigate = useNavigate();
    const { user, signOut } = useAuth();
    const { categories } = useCategories();

    const [activeTab, setActiveTab] = useState<'services' | 'hires'>('services');
    const [hireTab, setHireTab] = useState<'active' | 'inactive'>('active');
    const [showServiceForm, setShowServiceForm] = useState(false);
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
    const [formData, setFormData] = useState({
        categoryId: '',
        serviceTypeId: '',
        price: '',
        conditions: '',
        durationInHours: '24',
    });
    const [filters, setFilters] = useState<{
        clientName: string;
        status: '' | 'pending' | 'awaiting_client_decision' | 'disputed' | 'completed' | 'cancelled' | 'transfer_failed' | 'dispute-resolved';
        dateFrom: string;
        dateTo: string;
    }>({
        clientName: '',
        status: '',
        dateFrom: '',
        dateTo: '',
    });
    const [currentImageIndex, setCurrentImageIndex] = useState<{ [key: number]: number }>({});

    const fileInputRef = useRef<HTMLInputElement>(null);

    const {
        profile,
        isLoadingProfile,
        profileError,
        serviceTypes,
        isLoadingServiceTypes,
        startOnboarding,
        isStartingOnboarding,
        fetchProfile,
    } = useExpert();

    const { services, isLoading: isLoadingServices, error: servicesError, createService, isCreatingService } = useServices({ expertProfileId: profile?.id });

    const { hires, isLoading: isLoadingHires, error: hiresError } = useExpertHires();

    useEffect(() => {
        console.log('ExpertPanelPage State:', { user, profile, isLoadingProfile, profileError, hires });
        if (user && user.role !== 'Expert') {
            console.log('User is not Expert, redirecting to become-expert');
            navigate('/become-expert');
        }
    }, [user, navigate]);

    useEffect(() => {
        if (user?.role === 'Expert' && !profile && !isLoadingProfile && !profileError) {
            console.log('Fetching expert profile');
            fetchProfile();
        }
    }, [user, profile, isLoadingProfile, profileError, fetchProfile]);

    useEffect(() => {
        console.log('selectedImages changed:', selectedImages.map(f => ({ name: f.name, size: f.size, type: f.type })));
    }, [selectedImages]);

    useEffect(() => {
        console.log('Hires data:', hires);
        if (hiresError) {
            console.error('Error loading hires:', hiresError);
        }
    }, [hires, hiresError]);

    const validateForm = () => {
        const errors: { [key: string]: string } = {};

        if (!formData.categoryId) {
            errors.categoryId = 'La categoría es requerida';
        }

        if (!formData.serviceTypeId) {
            errors.serviceTypeId = 'El tipo de servicio es requerido';
        }

        if (!formData.conditions.trim()) {
            errors.conditions = 'Las condiciones son requeridas';
        }

        const price = parseFloat(formData.price);
        if (isNaN(price) || price <= 0) {
            errors.price = 'El precio debe ser mayor que 0';
        }

        if (formData.durationInHours && (parseInt(formData.durationInHours) <= 0 || isNaN(parseInt(formData.durationInHours)))) {
            errors.durationInHours = 'La duración debe ser mayor que 0';
        }

        if (selectedImages.length === 0) {
            errors.images = 'Se requiere al menos una imagen';
        }

        setFormErrors(errors);
        console.log('Form validation errors:', errors);
        return Object.keys(errors).length === 0;
    };

    const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        console.log('Selected files:', files.map(f => ({ name: f.name, size: f.size, type: f.type })));
        if (files.length === 0) {
            console.warn('No files selected in handleImageSelect');
            setFormErrors(prev => ({ ...prev, images: 'No se seleccionaron archivos' }));
            return;
        }

        const validFiles = files.filter(file => {
            const isValidType = ['image/jpeg', 'image/png'].includes(file.type);
            const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
            if (!isValidType) {
                setFormErrors(prev => ({ ...prev, images: 'Solo se permiten imágenes JPG o PNG' }));
            }
            if (!isValidSize) {
                setFormErrors(prev => ({ ...prev, images: 'Las imágenes no pueden superar los 5MB' }));
            }
            return isValidType && isValidSize;
        });

        if (validFiles.length === 0) {
            console.warn('No valid files after filtering');
            setFormErrors(prev => ({ ...prev, images: 'Ninguna imagen válida seleccionada' }));
            return;
        }

        setSelectedImages(prev => {
            const newImages = [...prev, ...validFiles];
            console.log('Updated selectedImages:', newImages.map(f => ({ name: f.name, size: f.size, type: f.type })));
            return newImages;
        });
        setFormErrors(prev => ({ ...prev, images: '' }));
    }, []);

    const removeImage = useCallback((index: number) => {
        setSelectedImages(prev => {
            const newImages = prev.filter((_, i) => i !== index);
            console.log('Images after removal:', newImages.map(f => ({ name: f.name, size: f.size, type: f.type })));
            return newImages;
        });
    }, []);

    const handleCreateService = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            console.warn('Form validation failed');
            return;
        }

        if (!profile) {
            console.error('No expert profile found');
            setFormErrors({ general: 'No se encontró el perfil de experto' });
            return;
        }

        console.log('Creating service with images:', selectedImages.map(img => ({ name: img.name, size: img.size, type: img.type })));
        try {
            await createService({
                expertProfileId: profile.id,
                categoryId: parseInt(formData.categoryId),
                serviceTypeId: parseInt(formData.serviceTypeId),
                price: parseFloat(formData.price),
                conditions: formData.conditions.trim(),
                durationInHours: formData.durationInHours ? parseInt(formData.durationInHours) : null,
                images: selectedImages,
            });

            setShowServiceForm(false);
            setFormData({
                categoryId: '',
                serviceTypeId: '',
                price: '',
                conditions: '',
                durationInHours: '24',
            });
            setSelectedImages([]);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            setFormErrors({});

            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: {
                    type: 'success',
                    message: 'Servicio creado exitosamente',
                },
            }));
        } catch (error: any) {
            console.error('Error creating service:', error);
            setFormErrors({ general: error.message || 'Error al crear el servicio' });
        }
    };

    const handleStartOnboarding = async () => {
        try {
            await startOnboarding();
        } catch (error) {
            console.error('Error in startOnboarding:', error);
        }
    };

    const handleViewHire = (hireId: number | null) => {
        if (hireId) {
            const hire = hires.find((h: Hire) => h.id === hireId);
            if (hire && hire.searchId) {
                navigate(`/busquedas/${hire.searchId}`);
            } else {
                console.error('Search ID not found for hire:', hireId);
                window.dispatchEvent(new CustomEvent('showNotification', {
                    detail: {
                        type: 'error',
                        message: 'No se pudo encontrar la búsqueda asociada',
                    },
                }));
            }
        }
    };

    const goToPreviousImage = (serviceId: number) => {
        setCurrentImageIndex(prev => ({
            ...prev,
            [serviceId]: Math.max((prev[serviceId] || 0) - 1, 0)
        }));
    };

    const goToNextImage = (serviceId: number) => {
        setCurrentImageIndex(prev => {
            const currentIndex = prev[serviceId] || 0;
            const imageUrls = services.find(s => s.id === serviceId)?.imageUrls || [];
            return {
                ...prev,
                [serviceId]: Math.min(currentIndex + 1, imageUrls.length - 1)
            };
        });
    };

    useEffect(() => {
        services.forEach(service => {
            if (!currentImageIndex[service.id]) {
                setCurrentImageIndex(prev => ({ ...prev, [service.id]: 0 }));
            }
        });
    }, [services]);

    const activeHires = hires ? hires.filter((hire) => ['pending', 'awaiting_client_decision', 'disputed'].includes(hire.status)) : [];

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600">Por favor, inicia sesión para continuar</p>
                    <button
                        onClick={() => navigate('/')}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
                    >
                        Volver al inicio
                    </button>
                </div>
            </div>
        );
    }

    if (isLoadingProfile) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    if (profileError) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center bg-red-50 text-red-600 px-4 py-3 rounded-xl max-w-md">
                    <p>{profileError.message === 'No authentication token found' ? 'Sesión expirada. Por favor, inicia sesión nuevamente.' : `Error al cargar el perfil: ${profileError.message}`}</p>
                    <button
                        onClick={() => {
                            if (profileError.message === 'No authentication token found') {
                                signOut();
                                navigate('/');
                            } else {
                                fetchProfile();
                            }
                        }}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
                    >
                        {profileError.message === 'No authentication token found' ? 'Iniciar sesión' : 'Reintentar'}
                    </button>
                </div>
            </div>
        );
    }

    if (!profile?.stripeAccountId) {
        return (
            <div className="relative min-h-screen">
                <Background />
                <div className="relative z-10 max-w-2xl mx-auto px-4 py-12">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-8"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Volver
                    </button>

                    <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-lg text-center">
                        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="w-8 h-8 text-amber-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            Validación Pendiente
                        </h2>
                        <p className="text-gray-600 mb-8">
                            Para empezar a ofrecer tus servicios como experto, necesitas completar la configuración de tu cuenta de Stripe.
                        </p>
                        <button
                            onClick={handleStartOnboarding}
                            disabled={isStartingOnboarding}
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            {isStartingOnboarding ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Cargando...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-5 h-5" />
                                    Configurar Cuenta de Stripe
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen">
            <Background />
            <div className="relative z-10 max-w-7xl mx-auto px-4 py-12">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/')}
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Volver
                        </button>
                        <h1 className="text-2xl font-bold text-gray-900">Panel de Experto</h1>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveTab('services')}
                            className={`px-4 py-2 rounded-lg transition-colors ${activeTab === 'services' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                            Servicios
                        </button>
                        <button
                            onClick={() => setActiveTab('hires')}
                            className={`px-4 py-2 rounded-lg transition-colors ${activeTab === 'hires' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                            Contrataciones
                        </button>
                    </div>
                </div>

                <div className="mb-8 bg-white p-6 border border-gray-200 shadow-lg">
                    {profile ? (
                        <div className="flex items-start gap-6">
                            <div className="flex-shrink-0">
                                {profile.profilePictureUrl ? (
                                    <img
                                        src={profile.profilePictureUrl}
                                        alt="Profile"
                                        className="w-24 h-24 rounded object-cover"
                                    />
                                ) : (
                                    <div className="w-24 h-24 bg-blue-100 rounded flex items-center justify-center">
                                        <User className="w-12 h-12 text-blue-600" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h2 className="text-xl font-semibold text-gray-900">{user?.name}</h2>
                                    <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs font-medium rounded-full">
                                        Experto Verificado
                                    </span>
                                </div>
                                <p className="text-gray-600 mb-4">{profile.description}</p>
                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                    <span>Miembro desde {new Date(profile.createdAt).toLocaleDateString()}</span>
                                    <span>•</span>
                                    <span>{services.length} servicios activos</span>
                                    <span>•</span>
                                    <span>{activeHires.length} contrataciones activas</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            Error al cargar el perfil
                        </div>
                    )}
                </div>

                <ServicesTab
                    activeTab={activeTab}
                    services={services}
                    isLoadingServices={isLoadingServices}
                    servicesError={servicesError}
                    showServiceForm={showServiceForm}
                    setShowServiceForm={setShowServiceForm}
                    currentImageIndex={currentImageIndex}
                    goToPreviousImage={goToPreviousImage}
                    goToNextImage={goToNextImage}
                    categories={categories}
                />
                <HiresTab
                    activeTab={activeTab}
                    hireTab={hireTab}
                    hires={hires}
                    isLoadingHires={isLoadingHires}
                    hiresError={hiresError}
                    filters={filters}
                    setHireTab={setHireTab}
                    setFilters={(value) => setFilters({ ...filters, ...value, status: value.status as any })}
                    handleViewHire={handleViewHire}
                    categories={categories}
                />
                <ServiceForm
                    showServiceForm={showServiceForm}
                    setShowServiceForm={setShowServiceForm}
                    selectedImages={selectedImages}
                    setSelectedImages={setSelectedImages}
                    formErrors={formErrors}
                    setFormErrors={setFormErrors}
                    formData={formData}
                    setFormData={setFormData}
                    handleImageSelect={handleImageSelect as (e: React.ChangeEvent<any>) => void}
                    removeImage={removeImage}
                    handleCreateService={handleCreateService}
                    serviceTypes={serviceTypes}
                    isLoadingServiceTypes={isLoadingServiceTypes}
                    isCreatingService={isCreatingService}
                    categories={categories}
                />
            </div>
        </div>
    );
}