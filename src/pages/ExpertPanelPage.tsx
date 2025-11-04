import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, CheckCircle, User, Plane, PlaneTakeoff, Package, Briefcase, Menu, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerFooter,
    DrawerClose,
} from '../components/ui/drawer';
import { useAuth } from '../contexts/AuthContext';
import { useCategories } from '../contexts/CategoryContext';
import { useExpert } from '../hooks/useExpert';
import { useExpertStripeStatus, validateBeforeCreatingService, handleStripeServiceError } from '../hooks/useExpertStripeStatus';
import { StripeStatusCard } from '../components/StripeStatusCard';
import { StripeStatusModal, useStripeStatusModal } from '../components/StripeStatusModal';
import { useExpertHires } from '../hooks/useExpertHires';
import { useServices } from '../hooks/useServices';
import { useServiceTypes } from '../hooks/useServiceTypes';
import { useStripeAccountLink } from '../hooks/useStripeAccountLink';
import { useVacationMode } from '../hooks/useVacationMode';
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
    status: 'pending' | 'awaiting_client_decision' | 'disputed' | 'completed' | 'cancelled' | 'transfer_failed' | 'dispute-resolved' | 'dispute-resolved-client' | 'dispute-resolved-expert';
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
    selectedDeliverableTypes?: Array<{
        id: number;
        name: string;
        displayName: string;
        description?: string;
        isRequired?: boolean;
        isActive?: boolean;
        // Campos adicionales para la estructura de crear/actualizar
        deliverableTypeId?: number;
        isSelected?: boolean;
        deliverableType?: {
            id: number;
            name: string;
            displayName: string;
            description: string;
        };
    }>;
}

export function ExpertPanelPage() {
    const navigate = useNavigate();
    const { user, signOut } = useAuth();
    const { categories } = useCategories();
    const { serviceTypes, isLoading: isLoadingServiceTypes } = useServiceTypes();

    const [activeTab, setActiveTab] = useState<'services' | 'hires'>('services');
    const [hireTab, setHireTab] = useState<'active' | 'inactive'>('active');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showServiceForm, setShowServiceForm] = useState(false);
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
    const [formData, setFormData] = useState({
        categoryId: '',
        serviceTypeId: '',
        price: '',
        conditions: '',
        durationInHours: '24',
        selectedDeliverableTypes: [] as number[],
    });
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [existingImages, setExistingImages] = useState<string[]>([]);
    const [showProfileEditForm, setShowProfileEditForm] = useState(false);
    const [filters, setFilters] = useState<{
        clientName: string;
        status: '' | 'pending' | 'awaiting_client_decision' | 'disputed' | 'completed' | 'cancelled' | 'transfer_failed' | 'dispute-resolved' | 'dispute-resolved-client' | 'dispute-resolved-expert';
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
        startOnboarding,
        restartAndStartOnboarding,
        isStartingOnboarding,
        checkOnboardingStatus,
        isCheckingOnboardingStatus,
        restartOnboarding,
        isRestartingOnboarding,
        syncStripeStatus,
        fetchProfile,
        fetchSearches,
        fetchServiceTypes,
    } = useExpert();

    const { services, isLoading: isLoadingServices, error: servicesError, createService, isCreatingService, updateService, isUpdatingService, deleteService, isDeletingService } = useServices({ expertProfileId: profile?.id });

    const { hires, isLoading: isLoadingHires, error: hiresError } = useExpertHires();

    const { status: stripeStatus, statusInfo: stripeStatusInfo } = useExpertStripeStatus();
    const { modalState, hideModal } = useStripeStatusModal();
    const { openAccountLink, isLoading: isAccountLinkLoading } = useStripeAccountLink();
    const { toggleVacationMode, isToggling } = useVacationMode();
    
    // Estado para el modal de confirmación de modo vacaciones
    const [showVacationModal, setShowVacationModal] = useState(false);

    // Limpiar cache cuando el estado cambia a aprobado (solo una vez)
    const [hasClearedCache, setHasClearedCache] = useState(false);
    
    // Función para manejar el toggle del modo vacaciones
    const handleVacationModeToggle = async () => {
        try {
            const result = await toggleVacationMode();
            
            // Actualizar el perfil local
            if (profile) {
                // Refrescar el perfil para obtener el estado actualizado
                fetchProfile();
            }
            
            // Mostrar notificación de éxito
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: {
                    type: 'success',
                    message: result.message
                }
            }));
            
            setShowVacationModal(false);
        } catch (error: any) {
            console.error('Error toggling vacation mode:', error);
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: {
                    type: 'error',
                    message: error.message || 'Error al cambiar el modo vacaciones'
                }
            }));
        }
    };
    
    useEffect(() => {
        if (stripeStatus?.stripeStatus === 'Approved' && stripeStatus?.onboardingCompleted && !hasClearedCache) {
            console.log('🧹 ExpertPanelPage: Status changed to APPROVED, clearing cache and refreshing data');
            setHasClearedCache(true);
            // Limpiar cache y refrescar datos
            fetchProfile();
            fetchSearches();
            fetchServiceTypes();
        }
    }, [stripeStatus?.stripeStatus, stripeStatus?.onboardingCompleted, hasClearedCache, fetchProfile, fetchSearches, fetchServiceTypes]);

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
            selectedDeliverableTypes: [],
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
        console.log('🔍 handleEditService called with service:', service);
        console.log('🔍 Service object keys:', Object.keys(service));
        console.log('🔍 Service selectedDeliverableTypes:', (service as any).selectedDeliverableTypes);
        
        // Extraer los IDs de los tipos de entregables seleccionados
        // Manejar ambas estructuras: listado (sin isSelected) y crear/actualizar (con isSelected)
        let selectedDeliverableTypeIds: number[] = [];
        
        if ((service as any).selectedDeliverableTypes && Array.isArray((service as any).selectedDeliverableTypes)) {
            const deliverableTypes = (service as any).selectedDeliverableTypes;
            
            // Verificar si es la estructura de crear/actualizar (tiene isSelected)
            if (deliverableTypes.some((dt: any) => dt.hasOwnProperty('isSelected'))) {
                // Estructura de crear/actualizar: filtrar por isSelected
                selectedDeliverableTypeIds = deliverableTypes
                    .filter((dt: any) => dt.isSelected === true)
                    .map((dt: any) => dt.deliverableTypeId || dt.deliverableType?.id);
            } else {
                // Estructura de listado: todos los tipos están seleccionados
                selectedDeliverableTypeIds = deliverableTypes.map((dt: any) => dt.id);
            }
        }
        
        console.log('🔍 Extracted selectedDeliverableTypeIds:', selectedDeliverableTypeIds);
        
        setEditingService(service);
        setFormData({
            categoryId: service.categoryId.toString(),
            serviceTypeId: service.serviceTypeId.toString(),
            price: service.price.toString(),
            conditions: service.conditions,
            durationInHours: service.durationInHours?.toString() || '24',
            selectedDeliverableTypes: selectedDeliverableTypeIds,
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

        console.log('🔍 Updating service with images:', selectedImages.map(img => ({ name: img.name, size: img.size, type: img.type })));
        console.log('🔍 Updating service with selectedDeliverableTypes:', formData.selectedDeliverableTypes);
        console.log('🔍 Existing images to keep:', existingImages);
        console.log('🔍 Original images:', editingService.imageUrls);
        
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
                selectedDeliverableTypes: formData.selectedDeliverableTypes,
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

        // Validar estado de Stripe antes de crear el servicio (usar cache si está disponible)
        const canCreate = await validateBeforeCreatingService(stripeStatus);
        if (!canCreate) {
            return;
        }

        console.log('🔍 Creating service with images:', selectedImages.map(img => ({ name: img.name, size: img.size, type: img.type })));
        console.log('🔍 Creating service with selectedDeliverableTypes:', formData.selectedDeliverableTypes);
        console.log('🔍 Full formData before creating service:', formData);
        try {
            await createService({
                expertProfileId: profile.id,
                categoryId: parseInt(formData.categoryId),
                serviceTypeId: parseInt(formData.serviceTypeId),
                price: parseFloat(formData.price),
                conditions: formData.conditions.trim(),
                durationInHours: formData.durationInHours ? parseInt(formData.durationInHours) : null,
                images: selectedImages,
                selectedDeliverableTypes: formData.selectedDeliverableTypes,
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
            
            // Manejar errores específicos de Stripe
            if (error.stripeStatus) {
                handleStripeServiceError(error);
            } else {
                setFormErrors({ general: error.message || 'Error al crear el servicio' });
            }
        }
    };

    const handleStartOnboarding = async () => {
        try {
            await startOnboarding();
        } catch (error) {
            console.error('Error in startOnboarding:', error);
        }
    };

    const handleStripeOnboarding = async () => {
        try {
            // 1. Primero verificar el estado actual
            const statusResponse = await checkOnboardingStatus();
            
            // 2. Si tiene cuenta pero no está completada, sincronizar con Stripe
            if (statusResponse?.hasStripeAccount && !statusResponse?.onboardingCompleted) {
                console.log('Sincronizando estado con Stripe...');
                const syncedStatus = await syncStripeStatus();
                console.log('Estado sincronizado:', syncedStatus);
                
                // Si ahora está completado, mostrar mensaje de éxito
                if (syncedStatus.onboardingCompleted) {
                    window.dispatchEvent(new CustomEvent('showNotification', {
                        detail: {
                            type: 'success',
                            message: '¡Cuenta Stripe configurada correctamente!',
                        },
                    }));
                    return;
                }
            }
            
            // 3. Crear link de onboarding o acceso
            await startOnboarding();
            
        } catch (error) {
            console.error('Error:', error);
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: {
                    type: 'error',
                    message: 'Error al configurar cuenta Stripe',
                },
            }));
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

    // Verificar si el experto puede acceder al panel según backend
    // Ahora usamos canAccessStripe para permitir acceso de lectura/gestión
    const canAccessPanel = stripeStatus?.canAccessStripe === true;

    if (!canAccessPanel) {
        return (
            <div className="min-h-screen bg-background relative overflow-hidden">
                {/* Fondo decorativo sutil para PC */}
                <div className="hidden lg:block absolute inset-0">
                    {/* Patrón de puntos sutiles */}
                    <div className="absolute inset-0 opacity-[0.02]" style={{
                        backgroundImage: `radial-gradient(circle at 1px 1px, #000 1px, transparent 0)`,
                        backgroundSize: '40px 40px'
                    }}></div>
                    
                    {/* Gradientes sutiles */}
                    <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-gray-50/30 to-transparent"></div>
                    <div className="absolute bottom-0 right-0 w-full h-1/3 bg-gradient-to-t from-gray-50/20 to-transparent"></div>
                    
                    {/* Elementos decorativos muy sutiles */}
                    <div className="absolute top-32 left-32 w-96 h-96 bg-gradient-to-br from-blue-50/40 to-transparent rounded-full filter blur-3xl"></div>
                    <div className="absolute bottom-32 right-32 w-96 h-96 bg-gradient-to-tl from-indigo-50/30 to-transparent rounded-full filter blur-3xl"></div>
                </div>
                
                <div className="relative z-10 px-6 py-8">
                    <div className="max-w-4xl mx-auto">
                        <button
                            onClick={() => navigate('/')}
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-6"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span className="text-sm">Volver</span>
                        </button>

                        <div className="max-w-4xl mx-auto flex items-center justify-center min-h-[calc(100vh-300px)]">
                        <StripeStatusCard
                        isLoadingOnboarding={isStartingOnboarding || isRestartingOnboarding}
                        onSetupStripe={async () => {
                            console.log('ExpertPanelPage: onSetupStripe called');
                            if (isStartingOnboarding || isRestartingOnboarding) return;
                            try {
                                if (stripeStatus?.stripeStatus === 'Rejected') {
                                    await restartAndStartOnboarding();
                                } else {
                                await startOnboarding();
                                }
                            } catch (error: any) {
                                console.error('Error starting Stripe onboarding:', error);
                                window.dispatchEvent(new CustomEvent('showNotification', {
                                    detail: {
                                        type: 'error',
                                        message: error?.message || 'No se pudo iniciar el proceso en Stripe. Inténtalo de nuevo.',
                                    },
                                }));
                            }
                        }}
                        onAccessDashboard={async () => {
                            try {
                                await openAccountLink();
                            } catch (error) {
                                console.error('Error opening account link:', error);
                                window.dispatchEvent(new CustomEvent('showNotification', {
                                    detail: {
                                        type: 'error',
                                        message: 'Error al abrir el enlace de actualización. Inténtalo de nuevo.',
                                    },
                                }));
                            }
                        }}
                        onContactSupport={() => {
                            window.dispatchEvent(new CustomEvent('showNotification', {
                                detail: {
                                    type: 'info',
                                    message: 'Contacta soporte en info@atrapo.io',
                                },
                            }));
                        }}
                    />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex">
            {/* Sidebar fijo - Estilo Dashboard-01 */}
            <aside className={`fixed inset-y-0 left-0 z-[60] w-64 bg-background border-r border-border transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
                sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
            }`}>
                <div className="flex flex-col h-full">
                    {/* Sidebar Header */}
                    <div className="flex h-16 items-center justify-end border-b border-border px-6">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="lg:hidden h-8 w-8"
                            onClick={() => setSidebarOpen(false)}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                            
                    {/* Sidebar Content */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {/* Botón Quick Create */}
                        <div className="px-2">
                            <Button 
                                className="w-full bg-foreground text-background hover:bg-foreground/90 h-10"
                                onClick={() => setShowServiceForm(true)}
                            >
                                Nuevo Servicio
                            </Button>
                                </div>

                        {/* Navegación */}
                        <nav className="px-2 space-y-1">
                            <Button
                                variant={activeTab === 'services' ? 'secondary' : 'ghost'}
                                className="w-full justify-start"
                                onClick={() => setActiveTab('services')}
                            >
                                <Package className="w-4 h-4 mr-2" />
                                Servicios
                            </Button>
                            <Button
                                variant={activeTab === 'hires' ? 'secondary' : 'ghost'}
                                className="w-full justify-start"
                                onClick={() => setActiveTab('hires')}
                            >
                                <Briefcase className="w-4 h-4 mr-2" />
                                Contrataciones
                                {hires.reduce((total, hire) => total + (hire.unreadMessagesCount || 0), 0) > 0 && (
                                    <Badge variant="destructive" className="ml-auto">
                                        {hires.reduce((total, hire) => total + (hire.unreadMessagesCount || 0), 0)}
                                    </Badge>
                                )}
                            </Button>
                        </nav>

                        <Separator />

                        {/* Perfil compacto */}
                        {profile && (
                            <div className="px-2 space-y-2">
                                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent">
                                    {profile.profilePictureUrl ? (
                                        <img
                                            src={profile.profilePictureUrl}
                                            alt="Profile"
                                            className="w-8 h-8 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                                            <User className="w-4 h-4" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{user?.name}</p>
                                        <p className="text-xs text-muted-foreground truncate">Experto</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 text-xs"
                                        onClick={() => setShowProfileEditForm(true)}
                                    >
                                        <User className="w-3 h-3 mr-1" />
                                        Editar
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 text-xs"
                                        onClick={() => setShowVacationModal(true)}
                                    >
                                        {profile.isOnVacation ? (
                                            <PlaneTakeoff className="w-3 h-3 mr-1" />
                                        ) : (
                                            <Plane className="w-3 h-3 mr-1" />
                                        )}
                                        {profile.isOnVacation ? 'Activar' : 'Vacaciones'}
                                    </Button>
                            </div>
                        </div>
                        )}

                        <Separator />

                        {/* Estado de Pagos compacto */}
                        <div className="px-2 space-y-2">
                            <div className="flex items-center justify-between p-2">
                                <span className="text-xs text-muted-foreground">Estado de Pagos</span>
                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                    Activo
                                </Badge>
                                    </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full text-xs"
                                        onClick={async () => {
                                            try {
                                                await openAccountLink();
                                            } catch (error) {
                                                console.error('Error opening account link:', error);
                                                window.dispatchEvent(new CustomEvent('showNotification', {
                                                    detail: {
                                                        type: 'error',
                                                        message: 'Error al abrir el enlace de actualización. Inténtalo de nuevo.',
                                                    },
                                                }));
                                            }
                                        }}
                            >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Acceder al Panel
                            </Button>
                                </div>

                        <Separator />

                        {/* Estadísticas compactas */}
                        <div className="px-2 space-y-1">
                            <div className="text-xs font-medium text-muted-foreground px-2 py-1">Estadísticas</div>
                            <div className="space-y-1">
                                <div className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-accent">
                                    <span className="text-sm">Servicios</span>
                                    <Badge variant="secondary">{services.length}</Badge>
                                                </div>
                                <div className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-accent">
                                    <span className="text-sm">Contrataciones</span>
                                    <Badge variant="secondary">{hires.length}</Badge>
                                        </div>
                                <div className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-accent">
                                    <span className="text-sm">Activos</span>
                                    <Badge>{activeHires.length}</Badge>
                                        </div>
                                    </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Overlay para móvil */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Contenido principal */}
            <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
                {/* Header limpio */}
                <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="flex h-14 items-center gap-4 px-4 sm:px-6">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="lg:hidden"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <Menu className="w-5 h-5" />
                        </Button>
                        <div className="flex items-center gap-4 flex-1">
                            <h1 className="text-lg font-semibold">
                                {activeTab === 'services' ? 'Servicios' : 'Contrataciones'}
                            </h1>
                            </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate('/')}
                            className="hidden sm:flex"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Volver
                        </Button>
                        </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto">
                    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
                        {/* Información móvil - solo visible en móvil */}
                        <div className="lg:hidden space-y-3">
                            {/* Estado de pagos y perfil en una fila */}
                            <div className="grid grid-cols-2 gap-3">
                                {/* Estado de pagos compacto con Card */}
                                <Card>
                                    <CardContent className="p-3 space-y-2">
                                        <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs px-1.5 py-0">
                                                Activo
                                            </Badge>
                                    </div>
                                        <p className="text-xs text-slate-500">Cuenta verificada</p>
                                <button
                                    onClick={async () => {
                                        try {
                                            await openAccountLink();
                                        } catch (error) {
                                            console.error('Error opening account link:', error);
                                            window.dispatchEvent(new CustomEvent('showNotification', {
                                                detail: {
                                                    type: 'error',
                                                    message: 'Error al abrir el enlace de actualización. Inténtalo de nuevo.',
                                                },
                                            }));
                                        }
                                    }}
                                            className="w-full px-2 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs rounded-md transition-colors flex items-center justify-center gap-1.5 border border-emerald-200 font-medium"
                                >
                                    <CheckCircle className="w-3 h-3" />
                                            Panel
                                </button>
                                    </CardContent>
                                </Card>

                                {/* Perfil compacto con Card */}
                            {profile && (
                                    <Card>
                                        <CardContent className="p-3 space-y-2">
                                            <div className="flex items-center gap-2">
                                        {profile.profilePictureUrl ? (
                                            <img
                                                src={profile.profilePictureUrl}
                                                alt="Profile"
                                                        className="w-8 h-8 rounded-full object-cover border border-slate-200"
                                            />
                                        ) : (
                                                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center border border-slate-200">
                                                        <User className="w-4 h-4 text-white" />
                                            </div>
                                        )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-semibold text-slate-900 truncate">{user?.name}</p>
                                                    <Badge variant="outline" className="mt-0.5 bg-emerald-50 text-emerald-700 border-emerald-200 text-xs px-1.5 py-0">
                                                        ✓
                                                    </Badge>
                                        </div>
                                    </div>
                                            <p className="text-xs text-slate-500 line-clamp-1">{profile.description}</p>
                                    <div className="space-y-1.5">
                                        <button
                                            onClick={() => setShowProfileEditForm(true)}
                                                    className="w-full px-2 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs rounded-md transition-colors flex items-center justify-center gap-1.5 border border-slate-200 font-medium"
                                        >
                                            <User className="w-3 h-3" />
                                            Editar
                                        </button>
                                        <button
                                            onClick={() => setShowVacationModal(true)}
                                                    className={`w-full px-2 py-1.5 text-xs rounded-md transition-colors flex items-center justify-center gap-1.5 border font-medium ${
                                                profile.isOnVacation 
                                                    ? 'bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200' 
                                                    : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
                                            }`}
                                        >
                                            {profile.isOnVacation ? (
                                                <PlaneTakeoff className="w-3 h-3" />
                                            ) : (
                                                <Plane className="w-3 h-3" />
                                            )}
                                            {profile.isOnVacation ? 'Activar' : 'Vacaciones'}
                                        </button>
                                    </div>
                                        </CardContent>
                                    </Card>
                            )}
                            </div>
                        </div>

                        {/* Contenido principal - Estilo Dashboard-01 */}
                        <div className="space-y-6">
                            {/* Cards de métricas */}
                            <div className="grid grid-cols-3 gap-2 sm:gap-4">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                                        <CardTitle className="text-xs sm:text-sm font-medium">Total Servicios</CardTitle>
                                        <Package className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                                        <div className="text-lg sm:text-2xl font-bold">{services.length}</div>
                                        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 hidden sm:block">
                                            Servicios activos en tu cuenta
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                                        <CardTitle className="text-xs sm:text-sm font-medium">Contrataciones</CardTitle>
                                        <Briefcase className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                                        <div className="text-lg sm:text-2xl font-bold">{hires.length}</div>
                                        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 hidden sm:block">
                                            Total de contrataciones recibidas
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                                        <CardTitle className="text-xs sm:text-sm font-medium">Activos</CardTitle>
                                        <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                                        <div className="text-lg sm:text-2xl font-bold">{activeHires.length}</div>
                                        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 hidden sm:block">
                                            Contrataciones en curso
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Contenido de pestañas */}
                            <Card className="border-border">
                                <CardContent className="p-0">
                                    {activeTab === 'services' ? (
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
                                    ) : (
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
                                    )}
                                </CardContent>
                            </Card>
                            </div>
                        </div>
                </main>
                    
                    {/* Formularios modales */}
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
            
            {/* Modal de estado de Stripe */}
            <StripeStatusModal
                isOpen={modalState.isOpen}
                onClose={hideModal}
                title={modalState.title}
                message={modalState.message}
                action={modalState.action}
                canRetry={modalState.canRetry}
                stripeStatus={modalState.stripeStatus}
                statusInfo={modalState.statusInfo}
                onAction={modalState.onAction}
            />
            
            {/* Drawer de confirmación de modo vacaciones */}
            <Drawer open={showVacationModal} onOpenChange={setShowVacationModal}>
                <DrawerContent className="max-h-[96vh] flex flex-col">
                    <div className="mx-auto w-full max-w-4xl flex flex-col h-full max-h-[96vh]">
                        <DrawerHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b border-border flex-shrink-0">
                            <div className="flex items-center gap-3">
                                {profile?.isOnVacation ? (
                                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                                        <PlaneTakeoff className="w-5 h-5 text-orange-600" />
                                    </div>
                                ) : (
                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                        <Plane className="w-5 h-5 text-blue-600" />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <DrawerTitle className="text-lg sm:text-xl font-semibold">
                                        {profile?.isOnVacation ? 'Activar cuenta' : 'Modo vacaciones'}
                                    </DrawerTitle>
                                    <DrawerDescription className="text-sm">
                                        {profile?.isOnVacation ? 'Volver a recibir contrataciones' : 'Pausar temporalmente'}
                                    </DrawerDescription>
                                </div>
                                <DrawerClose asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <X className="h-4 w-4" />
                                    </Button>
                                </DrawerClose>
                            </div>
                        </DrawerHeader>

                        {/* Contenido scrollable */}
                        <div className="px-4 sm:px-6 py-4 sm:py-6 flex-1 min-h-0 overflow-y-auto">
                            <div className="max-w-2xl space-y-4">
                                {profile?.isOnVacation ? (
                                    <>
                                        <div>
                                            <h4 className="text-sm font-medium mb-2">¿Qué sucederá?</h4>
                                            <p className="text-sm text-muted-foreground">
                                                Al activar tu cuenta, volverás a aparecer en las búsquedas de clientes y podrás recibir nuevas contrataciones.
                                            </p>
                                        </div>
                                        <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md p-4">
                                            <div className="flex items-start gap-3">
                                                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                                                <div>
                                                    <p className="text-sm font-medium text-green-900 dark:text-green-100">Volverás a ser visible</p>
                                                    <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                                                        Los clientes podrán encontrarte nuevamente en sus búsquedas
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md p-4">
                                            <div className="flex items-start gap-3">
                                                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                                                <div>
                                                    <p className="text-sm font-medium text-green-900 dark:text-green-100">Podrás recibir contrataciones</p>
                                                    <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                                                        Estarás disponible para nuevos servicios inmediatamente
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div>
                                            <h4 className="text-sm font-medium mb-2">¿Qué sucederá?</h4>
                                            <p className="text-sm text-muted-foreground">
                                                Al activar el modo vacaciones, tu perfil no aparecerá en las búsquedas de clientes y no recibirás nuevas contrataciones.
                                            </p>
                                        </div>
                                        <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-md p-4">
                                            <div className="flex items-start gap-3">
                                                <Plane className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                                                <div>
                                                    <p className="text-sm font-medium text-orange-900 dark:text-orange-100">No aparecerás en búsquedas</p>
                                                    <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                                                        Los clientes no podrán encontrarte temporalmente
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-md p-4">
                                            <div className="flex items-start gap-3">
                                                <Plane className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                                                <div>
                                                    <p className="text-sm font-medium text-orange-900 dark:text-orange-100">Pausar nuevas contrataciones</p>
                                                    <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                                                        Las contrataciones existentes permanecerán activas
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <Separator className="flex-shrink-0" />

                        {/* Footer con botones */}
                        <DrawerFooter className="flex-shrink-0">
                            <div className="flex justify-end gap-3 w-full">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowVacationModal(false)}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={handleVacationModeToggle}
                                    disabled={isToggling}
                                    className={profile?.isOnVacation 
                                        ? 'bg-green-600 hover:bg-green-700' 
                                        : 'bg-orange-600 hover:bg-orange-700'
                                    }
                                >
                                    {isToggling ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Procesando...
                                        </>
                                    ) : (
                                        profile?.isOnVacation ? 'Activar cuenta' : 'Activar vacaciones'
                                    )}
                                </Button>
                            </div>
                        </DrawerFooter>
                    </div>
                </DrawerContent>
            </Drawer>
        </div>
    );
}