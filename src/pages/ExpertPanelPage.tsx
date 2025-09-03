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
import { ProfileEditForm } from '../components/expertPanel/ProfileEditForm';

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
    expertProfileId?: number;
    categoryId: number;
    serviceTypeId: number;
    price: number;
    conditions: string;
    durationInHours: number | null;
    imageUrls: string[];
    createdAt?: string;
    updatedAt?: string;
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
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [existingImages, setExistingImages] = useState<string[]>([]);
    const [showProfileEditForm, setShowProfileEditForm] = useState(false);
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

    const { services, isLoading: isLoadingServices, error: servicesError, createService, isCreatingService, updateService, isUpdatingService, deleteService, isDeletingService } = useServices({ expertProfileId: profile?.id });

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

        // Para creación, se requiere al menos una imagen
        // Para edición, debe haber al menos una imagen (existente o nueva)
        if (!editingService && selectedImages.length === 0) {
            errors.images = 'Se requiere al menos una imagen';
        } else if (editingService && existingImages.length === 0 && selectedImages.length === 0) {
            errors.images = 'Debe mantener al menos una imagen';
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

        // Limit total number of images
        const maxImages = 10;
        const currentImageCount = selectedImages.length;
        const availableSlots = maxImages - currentImageCount;
        
        if (files.length > availableSlots) {
            setFormErrors(prev => ({ ...prev, images: `Solo puedes subir ${availableSlots} imágenes más (máximo ${maxImages} total)` }));
            return;
        }

        const validFiles = files.filter(file => {
            console.log(`File: ${file.name}, Type: ${file.type}, Size: ${file.size}`);
            const isValidType = [
                'image/jpeg',    // JPG files are reported as image/jpeg
                'image/png', 
                'image/webp', 
                'image/gif', 
                'image/bmp', 
                'image/svg+xml'
            ].includes(file.type);
            const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB - allows very high quality photos
            
            if (!isValidType) {
                console.error(`Invalid file type: ${file.type} for file: ${file.name}`);
                setFormErrors(prev => ({ ...prev, images: `Tipo de archivo no válido: ${file.type}. Solo se permiten JPG, PNG, WebP, GIF, BMP o SVG` }));
            }
            if (!isValidSize) {
                setFormErrors(prev => ({ ...prev, images: 'Las imágenes no pueden superar los 10MB' }));
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

    const resetForm = () => {
        setFormData({
            categoryId: '',
            serviceTypeId: '',
            price: '',
            conditions: '',
            durationInHours: '24',
        });
        setSelectedImages([]);
        setExistingImages([]);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        setFormErrors({});
        setEditingService(null);
    };

    const handleEditService = (service: Service) => {
        setEditingService(service);
        setFormData({
            categoryId: service.categoryId.toString(),
            serviceTypeId: service.serviceTypeId.toString(),
            price: service.price.toString(),
            conditions: service.conditions,
            durationInHours: service.durationInHours?.toString() || '24',
        });
        setSelectedImages([]);
        setExistingImages(service.imageUrls || []);
        setFormErrors({});
        setShowServiceForm(true);
    };

    const handleUpdateService = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            console.warn('Form validation failed');
            return;
        }

        if (!editingService) {
            console.error('No service being edited');
            return;
        }

        console.log('Updating service with images:', selectedImages.map(img => ({ name: img.name, size: img.size, type: img.type })));
        console.log('Existing images to keep:', existingImages);
        console.log('Original images:', editingService.imageUrls);
        
        try {
            // Determinar si necesitamos enviar imágenes
            const originalImages = editingService.imageUrls || [];
            const hasRemovedImages = existingImages.length !== originalImages.length;
            const hasNewImages = selectedImages.length > 0;
            
            // Si se removieron imágenes existentes O se agregaron nuevas, necesitamos actualizar
            const needsImageUpdate = hasRemovedImages || hasNewImages;
            
            let imagesToSend = undefined;
            if (needsImageUpdate) {
                // Necesitamos combinar las imágenes existentes que quiere mantener con las nuevas
                // Como el backend reemplaza todas las imágenes, necesitamos enviar todas las que queremos mantener
                
                if (hasRemovedImages && !hasNewImages) {
                    // Solo se eliminaron imágenes, no se agregaron nuevas
                    // En este caso, no podemos mantener las existentes sin enviar algo
                    // Tendremos que trabajar con las limitaciones del backend actual
                    imagesToSend = selectedImages; // Esto será un array vacío, efectivamente eliminando todas
                } else if (hasNewImages) {
                    // Se agregaron nuevas imágenes
                    // El backend reemplazará todas las imágenes con las nuevas
                    imagesToSend = selectedImages;
                }
            }
            
            await updateService({
                serviceId: editingService.id,
                categoryId: parseInt(formData.categoryId),
                serviceTypeId: parseInt(formData.serviceTypeId),
                price: parseFloat(formData.price),
                conditions: formData.conditions.trim(),
                durationInHours: formData.durationInHours ? parseInt(formData.durationInHours) : null,
                images: imagesToSend,
            });

            setShowServiceForm(false);
            resetForm();

            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: {
                    type: 'success',
                    message: 'Servicio actualizado exitosamente',
                },
            }));
        } catch (error: any) {
            console.error('Error updating service:', error);
            setFormErrors({ general: error.message || 'Error al actualizar el servicio' });
        }
    };

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
            resetForm();

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
        <div className="relative min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
            <Background />
            <div className="relative z-10">
                {/* Header mejorado */}
                <header className="bg-white border-b border-gray-200 shadow-sm">
                    <div className="max-w-7xl mx-auto px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <button
                                    onClick={() => navigate('/')}
                                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                    <span className="hidden sm:inline">Volver</span>
                                </button>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">Panel de Experto</h1>
                                    <p className="text-sm text-gray-600">Gestiona tus servicios y contrataciones</p>
                                </div>
                            </div>
                            
                            {/* Estadísticas rápidas */}
                            <div className="hidden lg:flex items-center gap-6">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-600">{services.length}</div>
                                    <div className="text-xs text-gray-500">Servicios</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-green-600">{activeHires.length}</div>
                                    <div className="text-xs text-gray-500">Activos</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-purple-600">{hires.length}</div>
                                    <div className="text-xs text-gray-500">Total</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="max-w-7xl mx-auto px-6 py-8">
                    {/* Navegación de pestañas mejorada */}
                    <div className="mb-8">
                        <div className="border-b border-gray-200">
                            <nav className="flex space-x-8">
                                <button
                                    onClick={() => setActiveTab('services')}
                                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                        activeTab === 'services' 
                                            ? 'border-blue-600 text-blue-600' 
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    Mis Servicios
                                    <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2 rounded-full text-xs">
                                        {services.length}
                                    </span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('hires')}
                                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                        activeTab === 'hires' 
                                            ? 'border-blue-600 text-blue-600' 
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    Contrataciones
                                    <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2 rounded-full text-xs">
                                        {hires.length}
                                    </span>
                                </button>
                            </nav>
                        </div>
                    </div>

                    {/* Tarjetas de dashboard */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Servicios Activos</p>
                                    <p className="text-3xl font-bold text-gray-900">{services.length}</p>
                                </div>
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <CheckCircle className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Contrataciones Activas</p>
                                    <p className="text-3xl font-bold text-gray-900">{activeHires.length}</p>
                                </div>
                                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                    <Loader2 className="w-6 h-6 text-green-600" />
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Contrataciones</p>
                                    <p className="text-3xl font-bold text-gray-900">{hires.length}</p>
                                </div>
                                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <User className="w-6 h-6 text-purple-600" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Perfil del experto minimalista */}
                    <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm mb-8">
                        {profile ? (
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="flex-shrink-0">
                                        {profile.profilePictureUrl ? (
                                            <img
                                                src={profile.profilePictureUrl}
                                                alt="Profile"
                                                className="w-12 h-12 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                                                <User className="w-6 h-6 text-blue-600" />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h2 className="text-lg font-semibold text-gray-900">{user?.name}</h2>
                                            <span className="inline-flex items-center px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                                                ✓ Verificado
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 max-w-md truncate">{profile.description}</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => setShowProfileEditForm(true)}
                                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition-colors flex items-center gap-1"
                                    >
                                        <User className="w-4 h-4" />
                                        Editar Perfil
                                    </button>
                                    <div className="hidden md:flex items-center gap-6 text-sm text-gray-500">
                                        <div className="text-center">
                                            <div className="font-medium text-gray-900">{new Date(profile.createdAt).toLocaleDateString()}</div>
                                            <div className="text-xs">Miembro desde</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="font-medium text-green-600">Activo</div>
                                            <div className="text-xs">Estado</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                <p className="text-sm">Error al cargar el perfil</p>
                            </div>
                        )}
                    </div>

                    <ServicesTab
                        activeTab={activeTab}
                        services={services}
                        isLoadingServices={isLoadingServices}
                        servicesError={servicesError}
                        showServiceForm={showServiceForm}
                        setShowServiceForm={(value) => {
                            if (value) {
                                resetForm(); // Resetear cuando se abre para crear nuevo servicio
                            }
                            setShowServiceForm(value);
                        }}
                        currentImageIndex={currentImageIndex}
                        goToPreviousImage={goToPreviousImage}
                        goToNextImage={goToNextImage}
                        categories={categories}
                        deleteService={deleteService}
                        isDeletingService={isDeletingService}
                        onEditService={handleEditService}
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
                        setShowServiceForm={(value) => {
                            if (!value) {
                                resetForm(); // Resetear cuando se cierra el formulario
                            }
                            setShowServiceForm(value);
                        }}
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
                        editingService={editingService}
                        handleUpdateService={handleUpdateService}
                        isUpdatingService={isUpdatingService}
                        existingImages={existingImages}
                        setExistingImages={setExistingImages}
                    />
                    {profile && (
                        <ProfileEditForm
                            showEditForm={showProfileEditForm}
                            setShowEditForm={setShowProfileEditForm}
                            profile={profile as any}
                            onProfileUpdated={fetchProfile}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}