import React, { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Loader2, CheckCircle, User, Plane, PlaneTakeoff, Package, Briefcase, Menu, X, MessageCircle, Bell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerFooter,
    DrawerClose,
} from '../components/ui/drawer';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { useAuth } from '../contexts/AuthContext';
import { useCategories } from '../contexts/CategoryContext';
import { useExpert } from '../hooks/useExpert';
import { RoleChecker, UserRole } from '../utils/roleChecker';
import { getAuthToken } from '../lib/auth';
import { ErrorDisplay } from '../components/ErrorDisplay';
import { useExpertStripeStatus, validateBeforeCreatingService, handleStripeServiceError } from '../hooks/useExpertStripeStatus';
import { useUnreadNotificationCount } from '../hooks/useNotifications';
import { STRIPE_STATUS } from '../constants/stripeStatus';
import { StripeStatusCard } from '../components/StripeStatusCard';
import { StripeLoadingOverlay } from '../components/StripeLoadingOverlay';
import { StripeStatusModal, useStripeStatusModal } from '../components/StripeStatusModal';
import { useExpertHires } from '../hooks/useExpertHires';
import { useServices } from '../hooks/useServices';
import { useServiceTypes } from '../hooks/useServiceTypes';
import { useStripeAccountLink } from '../hooks/useStripeAccountLink';
import { useStripeLoginLink } from '../hooks/useStripeLoginLink';
import { useVacationMode } from '../hooks/useVacationMode';
import { ServicesTab } from '../components/expertPanel/ServicesTab';
import { HiresTab } from '../components/expertPanel/HiresTab';
import { PreHireConversationsTab } from '../components/expertPanel/PreHireConversationsTab';
import { ServiceForm } from '../components/expertPanel/ServiceForm';
/** Mapbox solo al abrir edición de perfil — evita bloquear la carga del panel */
const ProfileEditForm = lazy(() =>
    import('../components/expertPanel/ProfileEditForm').then((mod) => ({
        default: mod.ProfileEditForm,
    })),
);

interface Hire {
    id: number;
    searchId: number | null;
    client: { name: string; email: string };
    service: { categoryId: number };
    serviceType: { id: number; name: string; description: string; isActive: boolean; createdAt: string; updatedAt: string } | null;
    status: 'pending' | 'awaiting_client_decision' | 'disputed' | 'completed' | 'cancelled' | 'transfer_failed' | 'dispute_resolved' | 'dispute_resolved_client' | 'dispute_resolved_expert';
    createdAt: string;
    amount: number;
}

interface ServiceImage {
    id: number;
    url: string;
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
    images?: ServiceImage[]; // Imágenes con IDs para conservación
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
    const [searchParams, setSearchParams] = useSearchParams();
    const { user, signOut } = useAuth();
    const { categories, loading: categoriesLoading, error: categoriesError } = useCategories();
    const { serviceTypes, isLoading: isLoadingServiceTypes } = useServiceTypes();

    // Leer el tab desde los query params, por defecto 'services'
    const tabFromUrl = searchParams.get('tab');
    const initialTab = (tabFromUrl === 'hires' || tabFromUrl === 'services' || tabFromUrl === 'messages') ? tabFromUrl : 'services';
    const [activeTab, setActiveTab] = useState<'services' | 'hires' | 'messages'>(initialTab as 'services' | 'hires' | 'messages');
    
    // Sincronizar el tab con la URL cuando cambia
    useEffect(() => {
        if (tabFromUrl && (tabFromUrl === 'hires' || tabFromUrl === 'services' || tabFromUrl === 'messages')) {
            setActiveTab(tabFromUrl as 'services' | 'hires' | 'messages');
        }
    }, [tabFromUrl]);
    
    // Actualizar la URL cuando cambia el tab
    const handleTabChange = (value: string) => {
        setActiveTab(value as 'services' | 'hires' | 'messages');
        setSearchParams({ tab: value });
    };
    const [hireTab, setHireTab] = useState<'active' | 'inactive'>('active');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showServiceForm, setShowServiceForm] = useState(false);
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    // ✅ Espejo síncrono de selectedImages para handlers con useCallback estable: permite
    // leer el conteo más reciente sin recrear el callback ni depender del timing del updater.
    const selectedImagesRef = useRef<File[]>([]);
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
    const [existingImagesWithIds, setExistingImagesWithIds] = useState<ServiceImage[]>([]); // Imágenes con IDs
    const [imagesToDelete, setImagesToDelete] = useState<number[]>([]); // IDs de imágenes a eliminar
    const [showProfileEditForm, setShowProfileEditForm] = useState(false);
    const [filters, setFilters] = useState<{
        clientName: string;
        status: '' | 'pending' | 'awaiting_client_decision' | 'disputed' | 'completed' | 'cancelled' | 'transfer_failed' | 'dispute_resolved' | 'dispute_resolved_client' | 'dispute_resolved_expert';
        dateFrom: string;
        dateTo: string;
    }>({
        clientName: '',
        status: '',
        dateFrom: '',
        dateTo: '',
    });
    const [currentImageIndex, setCurrentImageIndex] = useState<{ [key: number]: number }>({});
    const [hiresPage, setHiresPage] = useState(1);
    const [hiresPageSize, setHiresPageSize] = useState(20);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const formResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const showServiceFormRef = useRef(false);
    const existingImagesCountRef = useRef(0);
    const editingServiceRef = useRef<Service | null>(null);

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

    // ✅ Optimización: Solo cargar servicios cuando el profile esté disponible y cargado
    const { services, isLoading: isLoadingServices, error: servicesError, createService, isCreatingService, updateService, isUpdatingService, deleteService, isDeletingService } = useServices({ 
        expertProfileId: profile?.id
    });

    const { hires, pagination: hiresPagination, isLoading: isLoadingHires, error: hiresError } = useExpertHires(
        hiresPage,
        hiresPageSize,
        { enabled: activeTab === 'hires' }
    );

    const stripeHook = useExpertStripeStatus();
    const { status: stripeStatus, loading: isLoadingStripeStatus, error: stripeStatusError, refetch: refetchStripeStatus } = stripeHook;
    const { data: notificationUnreadCount = 0 } = useUnreadNotificationCount();
    const { modalState, hideModal } = useStripeStatusModal();
    const { openAccountLink, isLoading: isAccountLinkLoading } = useStripeAccountLink();
    // 🛡️ Round 12 — D1: Express Dashboard real para experto aprobado.
    const { openLoginLink, isLoading: isLoginLinkLoading } = useStripeLoginLink();
    const { toggleVacationMode, isToggling } = useVacationMode();
    
    // Estado para mostrar overlay de carga de Stripe
    const [isStripeLoading, setIsStripeLoading] = useState(false);
    
    // Estado para el modal de confirmación de modo vacaciones
    const [showVacationModal, setShowVacationModal] = useState(false);
    
    // Estado para el diálogo de servicio duplicado
    const [duplicateServiceDialog, setDuplicateServiceDialog] = useState<{
        open: boolean;
        existingServiceId?: number;
        categoryName?: string;
        serviceTypeName?: string;
        message?: string;
    }>({ open: false });

    // Limpiar cache cuando el estado cambia a aprobado (solo una vez)
    const [hasClearedCache, setHasClearedCache] = useState(false);
    
    // ✅ Estado para banner dismissible (debe estar antes de cualquier early return)
    const [bannerDismissed, setBannerDismissed] = React.useState(() => {
        const dismissed = localStorage.getItem('stripe-verification-banner-dismissed');
        return dismissed === 'true';
    });
    
    // Función para manejar el toggle del modo vacaciones
    const handleVacationModeToggle = async () => {
        try {
            const result = await toggleVacationMode();
            
            // Actualizar el perfil local
            if (profile) {
                // Refrescar el perfil para obtener el estado actualizado
                fetchProfile(true, { silent: true });
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
    
    // ✅ Optimización: Solo ejecutar una vez cuando el estado cambia a APPROVED
    useEffect(() => {
        if (stripeStatus?.stripeStatus === STRIPE_STATUS.APPROVED && stripeStatus?.onboardingCompleted && !hasClearedCache) {
            console.log('🧹 ExpertPanelPage: Status changed to APPROVED, clearing cache and refreshing data');
            setHasClearedCache(true);
            // Limpiar cache y refrescar datos (solo una vez)
            fetchProfile(true); // force = true para ignorar cache
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stripeStatus?.stripeStatus, stripeStatus?.onboardingCompleted, hasClearedCache]);

    useEffect(() => {
        console.log('ExpertPanelPage State:', { user, profile, isLoadingProfile, profileError, hires });
        
        // ✅ Verificación robusta del rol - similar a MobileProfileMenu
        if (user) {
            const userRole = user.role || user.Role;
            const isExpertByRole = userRole === 'Expert' || userRole === 'expert' || userRole === 'EXPERT' || userRole === 1 || userRole === UserRole.Expert;
            
            // Si no se detecta por el rol del objeto user, verificar el token
            let isExpertByToken = false;
            try {
                const token = getAuthToken();
                if (token) {
                    const roleFromToken = RoleChecker.getUserRole(token);
                    isExpertByToken = roleFromToken === UserRole.Expert;
                }
            } catch (error) {
                console.warn('[ExpertPanelPage] Error checking role from token:', error);
            }
            
            const isExpert = isExpertByRole || isExpertByToken;
            
            console.log('[ExpertPanelPage] Role check:', { 
                userRole, 
                isExpertByRole, 
                isExpertByToken, 
                isExpert 
            });
            
            if (!isExpert) {
                console.log('User is not Expert, redirecting to become-expert');
                navigate('/become-expert');
            }
        }
    }, [user, navigate]);

    // ✅ Optimización: Solo fetch si realmente no hay profile y no está cargando
    // NO incluir fetchProfile en dependencias para evitar ejecuciones múltiples
    useEffect(() => {
        if (user?.role === 'Expert' && !profile && !isLoadingProfile && !profileError) {
            // ✅ CRÍTICO: Verificar que el token esté disponible antes de hacer requests
            const token = getAuthToken();
            if (!token) {
                console.warn('⚠️ ExpertPanelPage: No token available, waiting...');
                return;
            }
            
            // ✅ Pequeño delay para asegurar que el token esté completamente disponible
            const timeoutId = setTimeout(() => {
                console.log('Fetching expert profile (initial load)');
                fetchProfile(false); // Usar cache si está disponible
            }, 150);
            
            return () => clearTimeout(timeoutId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.role, profile, isLoadingProfile, profileError]);

    useEffect(() => {
        selectedImagesRef.current = selectedImages;
        console.log('selectedImages changed:', selectedImages.map(f => ({ name: f.name, size: f.size, type: f.type })));
    }, [selectedImages]);

    useEffect(() => {
        showServiceFormRef.current = showServiceForm;
        if (showServiceForm) {
            if (formResetTimeoutRef.current) {
                clearTimeout(formResetTimeoutRef.current);
                formResetTimeoutRef.current = null;
            }
        }
    }, [showServiceForm]);

    useEffect(() => {
        existingImagesCountRef.current = existingImages.length;
    }, [existingImages]);

    useEffect(() => {
        editingServiceRef.current = editingService;
    }, [editingService]);

    useEffect(() => {
        return () => {
            if (formResetTimeoutRef.current) {
                clearTimeout(formResetTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        console.log('Hires data:', hires);
        if (hiresError) {
            console.error('Error loading hires:', hiresError);
        }
    }, [hires, hiresError]);

    const validateForm = () => {
        const errors: { [key: string]: string } = {};

        // Validar categoryId
        const categoryId = formData.categoryId;
        if (!categoryId || String(categoryId).trim() === '') {
            errors.categoryId = 'La categoría es requerida';
        }

        // Validar serviceTypeId
        const serviceTypeId = formData.serviceTypeId;
        if (!serviceTypeId || String(serviceTypeId).trim() === '') {
            errors.serviceTypeId = 'El tipo de servicio es requerido';
        }

        // Validar conditions
        const conditions = formData.conditions;
        if (!conditions || (typeof conditions === 'string' && conditions.trim() === '')) {
            errors.conditions = 'Las condiciones son requeridas';
        }

        // Validar price
        const priceStr = formData.price;
        if (!priceStr || String(priceStr).trim() === '') {
            errors.price = 'El precio es requerido';
        } else {
            const price = parseFloat(String(priceStr));
            if (isNaN(price) || price <= 0) {
                errors.price = 'El precio debe ser mayor que 0';
            }
        }

        // Validar durationInHours (opcional)
        const durationStr = formData.durationInHours;
        if (durationStr && String(durationStr).trim() !== '') {
            const duration = parseInt(String(durationStr));
            if (isNaN(duration) || duration <= 0) {
                errors.durationInHours = 'La duración debe ser mayor que 0';
            }
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

    const isValidImageFile = (file: File) => {
        const mimeOk = [
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/gif',
            'image/bmp',
            'image/svg+xml',
        ].includes(file.type);
        const extOk = /\.(jpe?g|png|webp|gif|bmp|svg)$/i.test(file.name);
        return mimeOk || (!file.type && extOk) || extOk;
    };

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
        setExistingImagesWithIds([]);
        setImagesToDelete([]);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        setFormErrors({});
        setEditingService(null);
    };

    const scheduleFormReset = useCallback(() => {
        if (formResetTimeoutRef.current) {
            clearTimeout(formResetTimeoutRef.current);
        }
        formResetTimeoutRef.current = setTimeout(() => {
            formResetTimeoutRef.current = null;
            if (!showServiceFormRef.current) {
                resetForm();
            }
        }, 600);
    }, []);

    const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const inputEl = e.target;
        const files = Array.from(inputEl.files || []);
        // ✅ Resetear el value del input para que volver a elegir el MISMO archivo dispare
        // de nuevo el onChange. No afecta a las imágenes ya añadidas (viven en estado React).
        inputEl.value = '';

        console.log('Selected files:', files.map(f => ({ name: f.name, size: f.size, type: f.type })));
        if (files.length === 0) {
            return;
        }

        // Validación de tipo/tamaño (pura, no depende del estado actual).
        let typeError = false;
        let sizeError = false;
        const validFiles = files.filter(file => {
            console.log(`File: ${file.name}, Type: ${file.type}, Size: ${file.size}`);
            const isValidType = isValidImageFile(file);
            const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB - allows very high quality photos

            if (!isValidType) {
                console.error(`Invalid file type: ${file.type} for file: ${file.name}`);
                typeError = true;
            }
            if (!isValidSize) {
                sizeError = true;
            }
            return isValidType && isValidSize;
        });

        if (validFiles.length === 0) {
            console.warn('No valid files after filtering');
            const message = typeError
                ? 'Tipo de archivo no válido. Solo se permiten JPG, PNG, WebP, GIF, BMP o SVG'
                : sizeError
                    ? 'Las imágenes no pueden superar los 10MB'
                    : 'Ninguna imagen válida seleccionada';
            setFormErrors(prev => ({ ...prev, images: message }));
            return;
        }

        // ✅ FIX (closure obsoleta): el límite de 10 imágenes se calcula con el conteo MÁS
        // RECIENTE leído del ref síncrono (no de `selectedImages` capturada por useCallback([])),
        // y el alta se hace con un updater funcional sobre `prev`. Ambos quedan siempre
        // alineados con el estado actual.
        const maxImages = 10;
        const existingCount = editingServiceRef.current ? existingImagesCountRef.current : 0;
        const availableSlots = Math.max(
            0,
            maxImages - selectedImagesRef.current.length - existingCount
        );
        const filesToAdd = validFiles.slice(0, availableSlots);
        const truncated = filesToAdd.length < validFiles.length;

        if (filesToAdd.length > 0) {
            setSelectedImages(prev => {
                const newImages = [...prev, ...filesToAdd];
                console.log('Updated selectedImages:', newImages.map(f => ({ name: f.name, size: f.size, type: f.type })));
                return newImages;
            });
        }
        setFormErrors(prev => ({
            ...prev,
            images: truncated ? `Sólo puedes subir un máximo de ${maxImages} imágenes` : '',
        }));
    }, []);

    const removeImage = useCallback((index: number) => {
        setSelectedImages(prev => {
            const newImages = prev.filter((_, i) => i !== index);
            console.log('Images after removal:', newImages.map(f => ({ name: f.name, size: f.size, type: f.type })));
            return newImages;
        });
    }, []);

    const handleEditService = (service: Service) => {
        console.log('🔍 handleEditService called with service:', service);
        console.log('🔍 Service object keys:', Object.keys(service));
        console.log('🔍 Service selectedDeliverableTypes:', (service as any).selectedDeliverableTypes);
        
        // Extraer los IDs de los tipos de entregables seleccionados
        // Manejar ambas estructuras: listado (sin isSelected) y crear/actualizar (con isSelected)
        let selectedDeliverableTypeIds: number[] = [];
        
        if ((service as any).selectedDeliverableTypes && Array.isArray((service as any).selectedDeliverableTypes)) {
            const deliverableTypes = (service as any).selectedDeliverableTypes;
            
            // ✅ CRÍTICO: Normalizar IDs de deliverable types (manejar PascalCase y camelCase)
            selectedDeliverableTypeIds = deliverableTypes
                .map((dt: any) => {
                    // Intentar obtener ID de diferentes formas
                    const id = dt.id ?? dt.Id ?? dt.deliverableTypeId ?? dt.DeliverableTypeId ?? dt.deliverableType?.id ?? dt.deliverableType?.Id;
                    
                    // Si tiene isSelected, solo incluir si está seleccionado
                    if (dt.hasOwnProperty('isSelected') || dt.hasOwnProperty('IsSelected')) {
                        const isSelected = dt.isSelected ?? dt.IsSelected ?? false;
                        return isSelected ? id : null;
                    }
                    
                    // Si no tiene isSelected, asumir que todos están seleccionados
                    return id;
                })
                .filter((id: any): id is number => id != null && id !== undefined && !isNaN(Number(id)));
        }
        
        console.log('🔍 Extracted selectedDeliverableTypeIds:', selectedDeliverableTypeIds);
        console.log('🔍 Service selectedDeliverableTypes structure:', (service as any).selectedDeliverableTypes);
        
        setEditingService(service);
        setFormData({
            categoryId: service.categoryId != null ? String(service.categoryId) : '',
            serviceTypeId: service.serviceTypeId != null ? String(service.serviceTypeId) : '',
            price: service.price != null ? String(service.price) : '',
            conditions: service.conditions || '',
            durationInHours: service.durationInHours != null ? String(service.durationInHours) : '24',
            selectedDeliverableTypes: selectedDeliverableTypeIds,
        });
        setSelectedImages([]);
        setExistingImages(service.imageUrls || []);
        
        // ✅ CRÍTICO: Usar el campo 'images' del backend que ahora incluye IDs reales
        // El campo ya viene transformado a camelCase por useServices.ts
        if (service.images && service.images.length > 0) {
            // ✅ El backend ahora devuelve IDs reales en el campo 'images'
            // useServices.ts ya transformó PascalCase a camelCase
            console.log('✅ Usando campo Images del backend con IDs reales:', service.images);
            console.log('✅ Imágenes transformadas:', service.images.map(img => ({ id: img.id, url: img.url })));
            
            // Filtrar solo imágenes con IDs válidos (positivos)
            const validImages = service.images.filter((img: any) => {
                const imageId = img.id ?? img.Id ?? 0;
                return imageId > 0;
            }).map((img: any) => ({
                id: img.id ?? img.Id ?? 0,      // ✅ ID real del backend (positivo)
                url: img.url ?? img.Url ?? ''
            }));
            
            if (validImages.length > 0) {
                setExistingImagesWithIds(validImages);
                console.log('✅ Imágenes válidas cargadas:', validImages.length);
            } else {
                console.warn('⚠️ No hay imágenes con IDs válidos');
                setExistingImagesWithIds([]);
            }
        } else if (service.imageUrls && service.imageUrls.length > 0) {
            // ⚠️ Fallback: Si no hay 'images', usar 'imageUrls' pero mostrar advertencia
            console.warn('⚠️ El servicio no devuelve el campo Images con IDs. Usando imageUrls como fallback.');
            console.warn('⚠️ Las imágenes NO se podrán eliminar porque no hay IDs reales.');
            const imagesWithIds: ServiceImage[] = service.imageUrls.map((url, index) => ({
                id: -(index + 1), // ❌ IDs temporales negativos - NO funcionarán para eliminar
                url: url
            }));
            setExistingImagesWithIds(imagesWithIds);
        } else {
            setExistingImagesWithIds([]);
        }
        
        setImagesToDelete([]); // Resetear imágenes a eliminar
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
        console.log('🔍 Images to delete (IDs):', imagesToDelete);
        
        try {
            // ✅ CRÍTICO: Filtrar IDs válidos (solo positivos, que son los IDs reales del backend)
            // Los IDs negativos son temporales y no se pueden eliminar del backend
            const validImagesToDelete = imagesToDelete.filter(id => id > 0);
            const invalidIds = imagesToDelete.filter(id => id <= 0);
            
            console.log('🔍 All imagesToDelete:', imagesToDelete);
            console.log('🔍 Valid imagesToDelete (positive IDs only):', validImagesToDelete);
            console.log('🔍 Invalid IDs (temporary/negative):', invalidIds);
            console.log('🔍 existingImagesWithIds:', existingImagesWithIds);
            
            // ⚠️ Advertencia si hay IDs inválidos
            if (invalidIds.length > 0) {
                if (validImagesToDelete.length === 0) {
                    console.warn('⚠️ Solo hay IDs temporales (negativos). Las imágenes no se pueden eliminar.');
                    console.warn('⚠️ El backend debe devolver el campo Images con IDs reales para poder eliminarlas.');
                    setFormErrors({ 
                        general: 'No se pueden eliminar las imágenes porque el backend no devolvió los IDs reales. Por favor, recarga la página.' 
                    });
                    return;
                } else {
                    console.warn('⚠️ Algunos IDs son temporales y se ignorarán:', invalidIds);
                }
            }
            
            // ✅ Validar que hay IDs válidos para eliminar
            if (imagesToDelete.length > 0 && validImagesToDelete.length === 0) {
                console.warn('⚠️ No hay IDs válidos para eliminar. Todas las imágenes tienen IDs temporales.');
                setFormErrors({ 
                    general: 'No se pueden eliminar las imágenes seleccionadas porque no tienen IDs válidos.' 
                });
                return;
            }
            
            // Las nuevas imágenes a agregar
            const newImages = selectedImages.length > 0 ? selectedImages : undefined;
            
            // ✅ CRÍTICO: Validar y convertir todos los valores antes de enviar
            const categoryId = formData.categoryId ? parseInt(String(formData.categoryId)) : 0;
            const serviceTypeId = formData.serviceTypeId ? parseInt(String(formData.serviceTypeId)) : 0;
            const price = formData.price ? parseFloat(String(formData.price)) : 0;
            const conditions = formData.conditions ? String(formData.conditions).trim() : '';
            const durationInHours = formData.durationInHours ? parseInt(String(formData.durationInHours)) : null;
            
            // Validar que los valores requeridos no sean 0 o vacíos
            if (categoryId === 0 || serviceTypeId === 0 || price === 0 || conditions === '') {
                setFormErrors({ general: 'Por favor, completa todos los campos requeridos' });
                return;
            }
            
            // ✅ Preparar datos para actualizar
            const updateData = {
                serviceId: editingService.id,
                categoryId: categoryId,
                serviceTypeId: serviceTypeId,
                price: price,
                conditions: conditions,
                durationInHours: durationInHours,
                images: newImages, // Nuevas imágenes a agregar
                imagesToDelete: validImagesToDelete.length > 0 ? validImagesToDelete : undefined, // IDs de imágenes a eliminar
                selectedDeliverableTypes: formData.selectedDeliverableTypes || [],
            };
            
            console.log('🔍 ExpertPanelPage: Enviando updateData:', {
                ...updateData,
                images: updateData.images ? `${updateData.images.length} archivo(s)` : 'ninguna',
                imagesToDelete: updateData.imagesToDelete || 'ninguna'
            });
            console.log('🔍 ExpertPanelPage: imagesToDelete array:', updateData.imagesToDelete);
            console.log('🔍 ExpertPanelPage: imagesToDelete JSON string:', updateData.imagesToDelete ? JSON.stringify(updateData.imagesToDelete) : 'undefined');
            
            await updateService(updateData);

            // Cerrar el Drawer primero y esperar a que se cierre completamente antes de resetear
            setShowServiceForm(false);
            scheduleFormReset();

            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: {
                    type: 'success',
                    message: 'Servicio actualizado exitosamente',
                },
            }));
        } catch (error: any) {
            console.error('Error updating service:', error);
            let errorMessage = 'Error al actualizar el servicio';
            try {
                if (error && typeof error === 'object') {
                    errorMessage = error.message || error.error || JSON.stringify(error);
                } else if (error != null) {
                    errorMessage = String(error);
                }
            } catch (e) {
                // Si falla al convertir el error, usar el mensaje por defecto
            }
            setFormErrors({ general: errorMessage });
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
            // ✅ CRÍTICO: Validar y convertir todos los valores antes de enviar
            const categoryId = formData.categoryId ? parseInt(String(formData.categoryId)) : 0;
            const serviceTypeId = formData.serviceTypeId ? parseInt(String(formData.serviceTypeId)) : 0;
            const price = formData.price ? parseFloat(String(formData.price)) : 0;
            const conditions = formData.conditions ? String(formData.conditions).trim() : '';
            const durationInHours = formData.durationInHours ? parseInt(String(formData.durationInHours)) : null;
            
            // Validar que los valores requeridos no sean 0 o vacíos
            if (categoryId === 0 || serviceTypeId === 0 || price === 0 || conditions === '') {
                setFormErrors({ general: 'Por favor, completa todos los campos requeridos' });
                return;
            }
            
            // ✅ CRÍTICO: Validar que profile.id sea válido
            const expertProfileId = profile.id;
            if (!expertProfileId || expertProfileId === 0) {
                console.error('⚠️ Expert profile ID is invalid:', expertProfileId, 'Profile:', profile);
                setFormErrors({ general: 'Error: No se pudo obtener el ID del perfil de experto. Por favor, recarga la página.' });
                return;
            }
            
            console.log('🔍 Creating service with expertProfileId:', expertProfileId);
            
            await createService({
                expertProfileId: expertProfileId,
                categoryId: categoryId,
                serviceTypeId: serviceTypeId,
                price: price,
                conditions: conditions,
                durationInHours: durationInHours,
                images: selectedImages,
                selectedDeliverableTypes: formData.selectedDeliverableTypes || [],
            });

            // Cerrar el Drawer primero y esperar a que se cierre completamente antes de resetear
            setShowServiceForm(false);
            scheduleFormReset();

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
            } 
            // Manejar error de combinación categoría + tipo duplicada
            else if (error.isDuplicateComboError && error.existingServiceId && error.categoryName && error.serviceTypeName) {
                console.log('🔴 Setting duplicate service dialog:', {
                    open: true,
                    existingServiceId: error.existingServiceId,
                    categoryName: error.categoryName,
                    serviceTypeName: error.serviceTypeName,
                    message: error.message
                });
                // Limpiar errores del formulario para que no se muestre el error inline
                setFormErrors({});
                // Mostrar el AlertDialog
                setDuplicateServiceDialog({
                    open: true,
                    existingServiceId: error.existingServiceId,
                    categoryName: error.categoryName,
                    serviceTypeName: error.serviceTypeName,
                    message: error.message
                });
            } else {
                console.log('🔴 Error no es duplicate combo:', error);
                let errorMessage = 'Error al crear el servicio';
                try {
                    if (error && typeof error === 'object') {
                        errorMessage = error.message || error.error || JSON.stringify(error);
                    } else if (error != null) {
                        errorMessage = String(error);
                    }
                } catch (e) {
                    // Si falla al convertir el error, usar el mensaje por defecto
                }
                setFormErrors({ general: errorMessage });
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
            if (hire) {
                navigate(`/searchhire/${hireId}`);
            } else {
                console.error('Hire not found:', hireId);
                window.dispatchEvent(new CustomEvent('showNotification', {
                    detail: {
                        type: 'error',
                        message: 'No se pudo encontrar la contratación',
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
            if (currentImageIndex[service.id] === undefined) {
                setCurrentImageIndex(prev => ({ ...prev, [service.id]: 0 }));
            }
        });
    }, [services]);

    const activeHires = hires
        ? hires.filter((hire) =>
            hire.statusInfo
                ? !hire.statusInfo.isFinalizationStatus
                : ['pending', 'awaiting_client_decision', 'disputed'].includes(hire.status)
          )
        : [];

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

    if (isLoadingProfile && !profile) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    if (profileError) {
        return (
            <ErrorDisplay
                message={profileError.message === 'No authentication token found' 
                    ? 'Sesión expirada. Por favor, inicia sesión nuevamente.' 
                    : `Error al cargar el perfil: ${profileError.message}`}
                onRetry={() => {
                            if (profileError.message === 'No authentication token found') {
                                signOut();
                                navigate('/');
                            } else {
                                fetchProfile();
                            }
                        }}
                retryLabel={profileError.message === 'No authentication token found' ? 'Iniciar sesión' : 'Reintentar'}
            />
        );
    }

    // Verificar si el experto puede acceder al panel según backend
    // Ahora usamos canAccessStripe para permitir acceso de lectura/gestión
    // ✅ CRÍTICO: Esperar a que el estado de Stripe se cargue antes de evaluar
    // Si está cargando, mostrar spinner en lugar de bloquear el acceso
    
    // ✅ CRÍTICO: Verificar canAccessStripe de forma más robusta
    // También verificar si el estado es Approved como fallback
    const canAccessStripe = stripeStatus?.canAccessStripe === true || stripeStatus?.canAccessStripe === 'true';
    const isApproved = stripeStatus?.stripeStatus === STRIPE_STATUS.APPROVED || stripeStatus?.stripeStatus === 'Approved';
    const canAccessPanel = canAccessStripe || (isApproved && stripeStatus?.onboardingCompleted === true);
    
    // ✅ CRÍTICO: Log para depurar el problema
    console.log('🔍 [ExpertPanelPage] Access check:', {
        stripeStatus: stripeStatus?.stripeStatus,
        stripeStatusType: typeof stripeStatus?.stripeStatus,
        canAccessStripe: stripeStatus?.canAccessStripe,
        canAccessStripeType: typeof stripeStatus?.canAccessStripe,
        onboardingCompleted: stripeStatus?.onboardingCompleted,
        isApproved,
        canAccessStripeBool: canAccessStripe,
        canAccessPanel,
        isLoadingStripeStatus,
        stripeStatusNull: stripeStatus === null,
        fullStatus: stripeStatus
    });

    // ✅ Mostrar spinner mientras se carga el estado de Stripe
    if (isLoadingStripeStatus && stripeStatus === null) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    if (!isLoadingStripeStatus && stripeStatus === null) {
        return (
            <ErrorDisplay
                message={stripeStatusError || 'No se pudo verificar el estado de tu cuenta de pagos. Comprueba tu conexión e inténtalo de nuevo.'}
                onRetry={() => refetchStripeStatus()}
                retryLabel="Reintentar"
            />
        );
    }

    if (!profile) {
        return (
            <ErrorDisplay
                message="No se encontró tu perfil de experto. Si acabas de registrarte, espera unos segundos e inténtalo de nuevo."
                onRetry={() => fetchProfile(true)}
                retryLabel="Recargar perfil"
            />
        );
    }

    // ✅ Solo bloquear acceso si el estado está cargado Y canAccessStripe es false
    if (!canAccessPanel && stripeStatus !== null) {
        return (
            <>
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
                            stripe={stripeHook}
                            isLoadingOnboarding={isStartingOnboarding || isRestartingOnboarding}
                            onSetupStripe={async () => {
                                console.log('ExpertPanelPage: onSetupStripe called');
                                if (isStartingOnboarding || isRestartingOnboarding) return;
                                setIsStripeLoading(true);
                                try {
                                    // Si es Rejected y puede reintentar, usar restart-onboarding
                                    if (stripeStatus?.stripeStatus === STRIPE_STATUS.REJECTED && stripeStatus?.canRetryOnboarding !== false) {
                                        await restartAndStartOnboarding();
                                    } else {
                                        await startOnboarding();
                                    }
                                    setIsStripeLoading(false);
                                } catch (error: any) {
                                    setIsStripeLoading(false);
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
                                // 🛡️ Round 12 — D1: si la cuenta está APPROVED, abrir el Express
                                // Dashboard REAL (LoginLink) en lugar del onboarding (AccountLink).
                                // El Dashboard es donde el experto ve payouts, balance, transactions
                                // y puede ajustar cuenta bancaria / payout schedule.
                                const isApprovedNow = stripeStatus?.stripeStatus === STRIPE_STATUS.APPROVED
                                                   && stripeStatus?.onboardingCompleted === true;
                                setIsStripeLoading(true);
                                try {
                                    if (isApprovedNow) {
                                        await openLoginLink();
                                    } else {
                                        await openAccountLink();
                                    }
                                    setIsStripeLoading(false);
                                } catch (error) {
                                    setIsStripeLoading(false);
                                    console.error('Error opening dashboard/account link:', error);
                                    window.dispatchEvent(new CustomEvent('showNotification', {
                                        detail: {
                                            type: 'error',
                                            message: 'Error al abrir el enlace de Stripe. Inténtalo de nuevo.',
                                        },
                                    }));
                                }
                            }}
                            onContactSupport={() => {
                                // 🛡️ Round 12 — D8 FIX: abrir cliente de email con contexto pre-llenado
                                // para que el experto no tenga que copiar el email manualmente.
                                // El subject/body ayuda al admin a identificar al usuario sin pedir info.
                                const expertId = user?.id ?? (user as any)?.Id ?? 'N/A';
                                const accountId = stripeStatus?.stripeAccountId || 'N/A';
                                const subject = encodeURIComponent('Cuenta Stripe — necesito ayuda');
                                const body = encodeURIComponent(
                                    `Hola equipo de Inspecciono,\n\n` +
                                    `Necesito ayuda con mi cuenta de pagos.\n\n` +
                                    `Mi identificador: ${expertId}\n` +
                                    `Mi cuenta Stripe: ${accountId}\n\n` +
                                    `Describe tu problema aquí:\n\n`
                                );
                                window.open(
                                    `mailto:info@inspecciono.io?subject=${subject}&body=${body}`,
                                    '_blank',
                                    'noopener,noreferrer'
                                );
                            }}
                        />
                            </div>
                        </div>
                    </div>
                </div>
                <StripeLoadingOverlay 
                    isOpen={isStripeLoading || isStartingOnboarding || isRestartingOnboarding || isAccountLinkLoading}
                    message={isAccountLinkLoading ? "Abriendo panel de Stripe..." : "Configurando Stripe..."}
                />
            </>
        );
    }

    const handleDismissBanner = () => {
        setBannerDismissed(true);
        localStorage.setItem('stripe-verification-banner-dismissed', 'true');
    };

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
                        {/* Navegación con Tabs */}
                        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                            <TabsList className="w-full grid grid-cols-3 h-auto p-1">
                                <TabsTrigger 
                                    value="services" 
                                    className="flex items-center gap-2 justify-center text-sm font-medium data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground"
                                >
                                    <Package className="w-4 h-4" />
                                    <span className="hidden sm:inline">Servicios</span>
                                    <span className="sm:hidden">Serv.</span>
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="hires" 
                                    className="flex items-center gap-2 justify-center text-sm font-medium data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground relative"
                                >
                                    <Briefcase className="w-4 h-4" />
                                    <span className="hidden sm:inline">Contrataciones</span>
                                    <span className="sm:hidden">Cont.</span>
                                    {hires.reduce((total, hire) => total + (hire.unreadMessagesCount || 0), 0) > 0 && (
                                        <Badge variant="destructive" className="ml-1 h-5 min-w-[20px] px-1.5 text-xs">
                                            {hires.reduce((total, hire) => total + (hire.unreadMessagesCount || 0), 0)}
                                        </Badge>
                                    )}
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="messages" 
                                    className="flex items-center gap-2 justify-center text-sm font-medium data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground relative"
                                >
                                    <MessageCircle className="w-4 h-4" />
                                    <span className="hidden sm:inline">Mensajes</span>
                                    <span className="sm:hidden">Msg.</span>
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>

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
                        {/* 🛡️ Round 12 — D4 FIX: badge condicional sobre stripeStatus en lugar de hardcoded "Activo".
                            Antes el experto en estado Restricted/PendingVerification/RequirementsPastDue veía
                            "Activo" verde aquí mientras el resto de la UI le bloqueaba operaciones. */}
                        <div className="px-2 space-y-2">
                            <div className="flex items-center justify-between p-2">
                                <span className="text-xs text-muted-foreground">Estado de Pagos</span>
                                {(() => {
                                    const s = stripeStatus?.stripeStatus;
                                    const isOk = s === STRIPE_STATUS.APPROVED && stripeStatus?.onboardingCompleted;
                                    const isWarning = s === STRIPE_STATUS.PENDING_VERIFICATION
                                                   || s === STRIPE_STATUS.REQUIREMENTS_DUE
                                                   || s === STRIPE_STATUS.RESTRICTED_SOON
                                                   || s === STRIPE_STATUS.ACTION_REQUIRED;
                                    if (isOk) {
                                        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Activo</Badge>;
                                    }
                                    if (isWarning) {
                                        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Atención requerida</Badge>;
                                    }
                                    return <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">Bloqueado</Badge>;
                                })()}
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
                                    <Badge variant="secondary">{hiresPagination?.totalCount ?? hires.length}</Badge>
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
                                {activeTab === 'services' ? 'Servicios' : activeTab === 'hires' ? 'Contrataciones' : 'Mensajes sin contratación'}
                            </h1>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="relative"
                            onClick={() => {
                                const open = (window as Window & { openNotificationCenter?: () => void }).openNotificationCenter;
                                if (open) open();
                            }}
                            aria-label="Notificaciones"
                        >
                            <Bell className="w-5 h-5" />
                            {notificationUnreadCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                                    {notificationUnreadCount > 9 ? '9+' : notificationUnreadCount}
                                </span>
                            )}
                        </Button>
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
                                {/* 🛡️ Round 12 — D4 FIX: badge condicional sobre stripeStatus (móvil). */}
                                <Card>
                                    <CardContent className="p-3 space-y-2">
                                        {(() => {
                                            const s = stripeStatus?.stripeStatus;
                                            const isOk = s === STRIPE_STATUS.APPROVED && stripeStatus?.onboardingCompleted;
                                            const isWarning = s === STRIPE_STATUS.PENDING_VERIFICATION
                                                           || s === STRIPE_STATUS.REQUIREMENTS_DUE
                                                           || s === STRIPE_STATUS.RESTRICTED_SOON
                                                           || s === STRIPE_STATUS.ACTION_REQUIRED;
                                            const dotClass = isOk ? 'bg-emerald-500' : isWarning ? 'bg-amber-500' : 'bg-rose-500';
                                            const badgeClass = isOk
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                : isWarning
                                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                    : 'bg-rose-50 text-rose-700 border-rose-200';
                                            const label = isOk ? 'Activo' : isWarning ? 'Atención' : 'Bloqueado';
                                            const subtitle = isOk ? 'Cuenta verificada' : isWarning ? 'Revisa tu cuenta Stripe' : 'No puedes cobrar';
                                            return (
                                                <>
                                                    <div className="flex items-center gap-1.5">
                                                        <div className={`w-1.5 h-1.5 ${dotClass} rounded-full`}></div>
                                                        <Badge variant="outline" className={`${badgeClass} text-xs px-1.5 py-0`}>
                                                            {label}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-xs text-slate-500">{subtitle}</p>
                                                </>
                                            );
                                        })()}
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
                                                    {/* 🛡️ Round 12 — D4 FIX: badge ✓ solo si APPROVED; ⏳ si warning; ⚠ si bloqueado */}
                                                    {(() => {
                                                        const s = stripeStatus?.stripeStatus;
                                                        const isOk = s === STRIPE_STATUS.APPROVED && stripeStatus?.onboardingCompleted;
                                                        const isWarning = s === STRIPE_STATUS.PENDING_VERIFICATION
                                                                       || s === STRIPE_STATUS.REQUIREMENTS_DUE
                                                                       || s === STRIPE_STATUS.RESTRICTED_SOON
                                                                       || s === STRIPE_STATUS.ACTION_REQUIRED;
                                                        const cls = isOk
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                            : isWarning
                                                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                                : 'bg-rose-50 text-rose-700 border-rose-200';
                                                        const symbol = isOk ? '✓' : isWarning ? '⏳' : '⚠';
                                                        return (
                                                            <Badge variant="outline" className={`mt-0.5 ${cls} text-xs px-1.5 py-0`}>
                                                                {symbol}
                                                            </Badge>
                                                        );
                                                    })()}
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
                                        <div className="text-lg sm:text-2xl font-bold">{hiresPagination?.totalCount ?? hires.length}</div>
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
                                            Activas en la página actual
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
                                            // Solo resetear si el drawer no está abierto (para evitar conflictos)
                                            if (!showServiceForm) {
                                                resetForm(); // Resetear cuando se abre para crear nuevo servicio
                                            }
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
                                    ) : activeTab === 'hires' ? (
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
                                    pagination={hiresPagination}
                                    onPageChange={setHiresPage}
                                    onPageSizeChange={setHiresPageSize}
                                />
                                    ) : (
                                <PreHireConversationsTab
                                    token={getAuthToken() || ''}
                                    userId={user?.id || user?.Id || 0}
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
                                scheduleFormReset();
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
                        categoriesLoading={categoriesLoading}
                        categoriesError={categoriesError}
                        editingService={editingService}
                        handleUpdateService={handleUpdateService}
                        isUpdatingService={isUpdatingService}
                        existingImages={existingImages}
                        setExistingImages={setExistingImages}
                        existingImagesWithIds={existingImagesWithIds}
                        imagesToDelete={imagesToDelete}
                        setImagesToDelete={setImagesToDelete}
                        // 🛡️ Round 28: el form deriva el símbolo de moneda del país del experto.
                        expertCountry={profile?.country ?? null}
                    />
                    {profile && showProfileEditForm && (
                        <Suspense
                            fallback={
                                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/25">
                                    <Loader2 className="h-8 w-8 animate-spin text-white" aria-hidden />
                                    <span className="sr-only">Cargando editor de perfil</span>
                                </div>
                            }
                        >
                            <ProfileEditForm
                                showEditForm={showProfileEditForm}
                                setShowEditForm={(value) => {
                                    if (value && !showProfileEditForm) {
                                        fetchProfile(true, { silent: true });
                                    }
                                    setShowProfileEditForm(value);
                                }}
                                profile={profile as any}
                                onProfileUpdated={() => fetchProfile(true, { silent: true })}
                            />
                        </Suspense>
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

            {/* Diálogo de servicio duplicado (combinación categoría + tipo) */}
            <AlertDialog 
                open={duplicateServiceDialog.open} 
                onOpenChange={(open: boolean) => {
                    console.log('AlertDialog onOpenChange:', open);
                    setDuplicateServiceDialog(prev => ({ ...prev, open }));
                }}
            >
                <AlertDialogContent className="sm:max-w-[500px]">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-destructive">Servicio ya existe</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-foreground">
                            {duplicateServiceDialog.message || 
                                `Ya tienes un servicio activo en la categoría '${duplicateServiceDialog.categoryName}' con el tipo de servicio '${duplicateServiceDialog.serviceTypeName}'.`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    {duplicateServiceDialog.categoryName && duplicateServiceDialog.serviceTypeName && (
                        <div className="py-3 px-4 bg-destructive/10 border border-destructive/20 rounded-md">
                            <p className="text-xs text-muted-foreground mb-1.5 font-medium">Combinación existente:</p>
                            <p className="text-sm font-semibold text-destructive">
                                {duplicateServiceDialog.categoryName} + {duplicateServiceDialog.serviceTypeName}
                            </p>
                        </div>
                    )}
                    <AlertDialogFooter className="gap-2 sm:gap-0">
                        <AlertDialogCancel 
                            onClick={() => {
                                console.log('Cancel clicked');
                                setDuplicateServiceDialog({ open: false });
                            }} 
                            className="w-full sm:w-auto"
                        >
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                console.log('Update service clicked', duplicateServiceDialog.existingServiceId);
                                if (duplicateServiceDialog.existingServiceId) {
                                    // Buscar el servicio existente y abrirlo para edición
                                    const existingService = services?.find(s => s.id === duplicateServiceDialog.existingServiceId);
                                    if (existingService) {
                                        // Usar handleEditService para cargar correctamente todos los datos
                                        handleEditService(existingService);
                                        setShowServiceForm(true);
                                    }
                                }
                                setDuplicateServiceDialog({ open: false });
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto"
                        >
                            Actualizar servicio existente
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}