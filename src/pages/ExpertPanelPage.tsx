import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, User, Plane, PlaneTakeoff, Package, Menu, X, MessageCircle, Bell, Settings2, ExternalLink, CalendarClock } from 'lucide-react';
import { SileoPageLoader } from '../components/ui/sileo-loader';
import '../styles/expert-panel.css';
/* Cargar con el shell del panel — si va en el chunk lazy del form, el CSS llega ~1s tarde y “tapaba” el diseño nuevo */
import '../styles/expert-profile-form.css';
import '../styles/expert-service-form.css';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { SileoButton } from '../components/ui/sileo-button';
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
import { getCurrencyForCountry } from '../utils/priceUtils';
import { getAuthToken } from '../lib/auth';
import { ErrorDisplay } from '../components/ErrorDisplay';
import { useExpertStripeStatus, validateBeforeCreatingService, handleStripeServiceError } from '../hooks/useExpertStripeStatus';
import { useUnreadNotificationCount } from '../hooks/useNotifications';
import { STRIPE_STATUS } from '../constants/stripeStatus';
import { StripeStatusCard } from '../components/StripeStatusCard';
// 🛡️ C1 + unificación: banner ÚNICO de visibilidad (consecuencia comercial + acción + plazo
// Stripe). Sustituye al antiguo StripeStatusBanner, que mostraba info Stripe redundante. Antes
// era código muerto (nunca importado) → el experto no sabía que estaba oculto en búsquedas.
import { ExpertVisibilityBanner } from '../components/ExpertVisibilityBanner';
import { StripeLoadingOverlay } from '../components/StripeLoadingOverlay';
import { StripeStatusModal, useStripeStatusModal } from '../components/StripeStatusModal';
// 🛡️ Round 28 MUD-O: wizard de mudanza self-service (cierra Stripe Connect + re-onboarding).
import { ExpertRelocationWizard } from '../components/ExpertRelocationWizard';
import { useExpertHires } from '../hooks/useExpertHires';
import { useServices } from '../hooks/useServices';
import { useServiceTypes } from '../hooks/useServiceTypes';
import { useStripeAccountLink } from '../hooks/useStripeAccountLink';
import { useStripeLoginLink } from '../hooks/useStripeLoginLink';
import { useVacationMode } from '../hooks/useVacationMode';
import { usePhoneStatus } from '../components/expertPanel/PhoneStatusCard';
import { ProfileSetupWizard, useProfileSetupState } from '../components/expertPanel/ProfileSetupWizard';
import { isFiscalStepComplete } from '../components/expertPanel/profileSteps';
import { ServicesTab } from '../components/expertPanel/ServicesTab';
import { ExpertMessagesInbox } from '../components/expertPanel/ExpertMessagesInbox';
import AvailabilityTab from '../components/expertPanel/AvailabilityTab';
import { ServiceForm } from '../components/expertPanel/ServiceForm';
import { ProfileEditForm } from '../components/expertPanel/ProfileEditForm';
import { emptyConfig, resolveTemplate, type InspectionConfig } from '../lib/inspectionTemplateConfig';
import { buildTemplatePdf } from '../lib/inspectionPdf';
import { getInspectionCatalog } from '../lib/inspectionCatalog';

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
    // 🔀 'hires' se fusionó dentro de la bandeja 'messages' ("Contrataciones y mensajes"):
    // las contrataciones ya viven ahí como conversaciones. Redirigimos enlaces antiguos.
    const rawTabFromUrl = searchParams.get('tab');
    const tabFromUrl = rawTabFromUrl === 'hires' ? 'messages' : rawTabFromUrl;
    type ExpertTab = 'setup' | 'profile' | 'disponibilidad' | 'services' | 'messages';
    const validTabs: ExpertTab[] = ['setup', 'profile', 'disponibilidad', 'services', 'messages'];
    const initialTab: ExpertTab = validTabs.includes(tabFromUrl as ExpertTab) ? tabFromUrl as ExpertTab : 'services';
    const [activeTab, setActiveTab] = useState<ExpertTab>(initialTab);

    useEffect(() => {
        // Reescribe la URL antigua ?tab=hires → ?tab=messages (sin entrada en el historial)
        if (rawTabFromUrl === 'hires') {
            setSearchParams({ tab: 'messages' }, { replace: true });
            return;
        }
        if (tabFromUrl && validTabs.includes(tabFromUrl as ExpertTab)) {
            setActiveTab(tabFromUrl as ExpertTab);
        }
    }, [tabFromUrl, rawTabFromUrl]);
    
    const handleTabChange = (value: ExpertTab) => {
        setActiveTab(value);
        setSearchParams({ tab: value });
        setSidebarOpen(false);
    };
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
    const [inspectionConfig, setInspectionConfig] = useState<InspectionConfig>(emptyConfig());
    const [imagesSequence, setImagesSequence] = useState<string[]>([]);
    const [currentImageIndex, setCurrentImageIndex] = useState<{ [key: number]: number }>({});
    // Paginación fija: las contrataciones se consultan para el badge "sin leer" del sidebar.
    const hiresPage = 1;
    const hiresPageSize = 20;

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

    // 📱 Estado del móvil verificado — misma query que PhoneStatusCard/ProfileCompletionCard
    // (react-query la deduplica). El banner de visibilidad lo necesita porque el backend
    // OCULTA los servicios sin móvil verificado: banner y checklist deben contar lo mismo.
    const phoneStatusQuery = usePhoneStatus(Boolean(profile));
    const smsCapable = Boolean(phoneStatusQuery.data?.smsCapable);

    // 🛡️ MUD-DO — cargar hires SIEMPRE, no solo cuando el tab está activo.
    // ANTES: { enabled: activeTab === 'hires' } → en el tab "services" hires=[]
    // → sidebar y card central mostraban "Contrataciones: 0" + "Activos: 0" aunque
    // el experto tuviera contrataciones reales. Mentira de UI visible al abrir el panel.
    // AHORA: siempre habilitado para que los contadores reflejen el estado real.
    // hires se sigue cargando para alimentar el badge "sin leer" de la bandeja del sidebar.
    const { hires, error: hiresError } = useExpertHires(
        hiresPage,
        hiresPageSize
    );

    const stripeHook = useExpertStripeStatus();
    const { status: stripeStatus, loading: isLoadingStripeStatus, error: stripeStatusError, refetch: refetchStripeStatus } = stripeHook;

    const stripeContext = {
        stripeStatus: stripeStatus?.stripeStatus ?? (profile as { stripeStatus?: unknown })?.stripeStatus,
        onboardingCompleted: (stripeStatus as { onboardingCompleted?: boolean })?.onboardingCompleted ?? profile?.onboardingCompleted,
        stripeAccountId: (stripeStatus as { stripeAccountId?: string })?.stripeAccountId ?? profile?.stripeAccountId,
    };
    const { steps: profileSetupSteps, complete: profileSetupComplete, pendingRequired } = useProfileSetupState(profile, smsCapable, stripeContext);

    useEffect(() => {
        if (activeTab === 'profile') {
            // Respeta la caché de 60s: NO forzar (antes force=true disparaba un GET en
            // CADA visita al tab). Al editar y guardar, onProfileUpdated ya fuerza el
            // refetch (force=true), así que aquí no hace falta ignorar la caché.
            fetchProfile(false, { silent: true });
        }
    }, [activeTab]);

    // Perfil incompleto → abrir pestaña Configuración por defecto
    useEffect(() => {
        if (!profile || profileSetupComplete) return;
        if (!tabFromUrl) {
            setActiveTab('setup');
            setSearchParams({ tab: 'setup' }, { replace: true });
        }
    }, [profile?.id, profileSetupComplete, tabFromUrl, setSearchParams]);

    useEffect(() => {
        if (profileSetupComplete && activeTab === 'setup') {
            setActiveTab('services');
            setSearchParams({ tab: 'services' }, { replace: true });
        }
    }, [profileSetupComplete, activeTab, setSearchParams]);

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
    // 🛡️ Round 28 MUD-O: state del wizard de mudanza (cierra Stripe Connect actual y prepara
    // re-onboarding en nuevo país). Botón mostrado junto a Estado de Pagos en el sidebar.
    const [showRelocationWizard, setShowRelocationWizard] = useState(false);

    // 🛡️ Round 28 MUD-U: el ProfileEditForm dispatcha un evento global tras cerrar SU drawer
    // (Vaul aplica inert/aria-hidden a todo lo que no es el drawer activo, así que el wizard
    // dentro de ese drawer queda inert visualmente visible pero no clickeable). Cuando el form
    // cierra y dispatchá este evento, abrimos el wizard desde aquí (sin drawer encima).
    useEffect(() => {
        const handler = () => setShowRelocationWizard(true);
        window.addEventListener('openExpertRelocationWizard', handler);
        return () => window.removeEventListener('openExpertRelocationWizard', handler);
    }, []);
    
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

    // 🛡️ Fuente única de verdad para "este usuario es experto". El rol puede llegar
    // en distintas formas (string 'Expert'/'expert'/'EXPERT', numérico 1, PascalCase
    // `Role`, o solo en el JWT). ANTES, la guardia de redirección usaba esta detección
    // permisiva pero el fetch del perfil exigía `user?.role === 'Expert'` exacto: el
    // usuario entraba al panel pero el perfil nunca se cargaba → "No se encontró tu
    // perfil de experto" hasta pulsar "Recargar" a mano. Ahora ambos usan lo mismo.
    const isExpert = React.useMemo(() => {
        if (!user) return false;
        const userRole = (user as any).role ?? (user as any).Role;
        if (userRole === 'Expert' || userRole === 'expert' || userRole === 'EXPERT'
            || userRole === 1 || userRole === '1' || userRole === UserRole.Expert) {
            return true;
        }
        try {
            const token = getAuthToken();
            if (token && RoleChecker.getUserRole(token) === UserRole.Expert) return true;
        } catch (error) {
            console.warn('[ExpertPanelPage] Error checking role from token:', error);
        }
        return false;
    }, [user]);

    useEffect(() => {
        console.log('ExpertPanelPage State:', { user, profile, isLoadingProfile, profileError, hires });

        // ✅ Verificación robusta del rol — si no es experto (ni por user ni por token), fuera.
        if (user && !isExpert) {
            console.log('User is not Expert, redirecting to become-expert');
            navigate('/become-expert');
        }
    }, [user, isExpert, navigate]);

    // La carga inicial del perfil la gestiona EXCLUSIVAMENTE el hook useExpert
    // (hasInitializedRef + check de token + reintento en cambio de `user`). Este
    // useEffect duplicaba esa carga (segundo setTimeout) y provocaba 1-2 GET
    // /expert-profile en paralelo al montar el panel. Eliminado para deduplicar.

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

        // Validar conditions (descripción del servicio): entre 400 y 1000 caracteres
        const conditions = formData.conditions;
        if (!conditions || (typeof conditions === 'string' && conditions.trim() === '')) {
            errors.conditions = 'Las condiciones son requeridas';
        } else {
            const conditionsLength = String(conditions).trim().length;
            if (conditionsLength < 400 || conditionsLength > 1000) {
                errors.conditions = 'La descripción del servicio debe tener entre 400 y 1000 caracteres';
            }
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

        // Se requieren al menos 2 fotos por servicio (creación y edición).
        // En edición cuenta la suma de imágenes existentes conservadas + nuevas.
        const totalImages = selectedImages.length + (editingService ? existingImages.length : 0);
        if (totalImages < 2) {
            errors.images = editingService
                ? 'El servicio debe tener al menos 2 fotos'
                : 'Se requieren al menos 2 fotos';
        }

        setFormErrors(errors);
        console.log('Form validation errors:', errors);
        return Object.keys(errors).length === 0;
    };

    const isValidImageFile = (file: File) => {
        // Solo JPG/PNG: el backend re-codifica todo a JPEG con ImageSharp, que NO
        // puede cargar SVG (reventaría). Mantener este set alineado con el
        // accept="image/jpeg,image/png" del input y con el drop handler de ServiceForm.
        const mimeOk = ['image/jpeg', 'image/png'].includes(file.type);
        const extOk = /\.(jpe?g|png)$/i.test(file.name);
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
        setImagesSequence([]);
        setInspectionConfig(emptyConfig());
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
        
        setImagesToDelete([]);
        setImagesSequence([]); // Resetear imágenes a eliminar
        setFormErrors({});

        // Cargar config de inspección del servicio (soporta ambos casings)
        const rawCfg = (service as any).InspectionTemplateConfig ?? (service as any).inspectionTemplateConfig;
        if (rawCfg && typeof rawCfg === 'string') {
            try {
                const parsed = JSON.parse(rawCfg);
                // El editor saneará con el catálogo de la categoría del servicio.
                setInspectionConfig(parsed);
            } catch {
                setInspectionConfig(emptyConfig());
            }
        } else {
            setInspectionConfig(emptyConfig());
        }

        setShowServiceForm(true);
    };

    const clearServiceForm = () => {
        if (editingService) {
            handleEditService(editingService);
            return;
        }
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
        setImagesSequence([]);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        setFormErrors({});
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
            
            // Determinar si la categoría seleccionada es de coches (por nombre propio o del padre)
            const selectedCatUpdate = categories.find((c) => c.id === categoryId);
            const parentCatUpdate = selectedCatUpdate?.parentId != null
                ? categories.find((c) => c.id === selectedCatUpdate.parentId)
                : undefined;
            const updateCatalog = getInspectionCatalog(
                `${selectedCatUpdate?.name ?? ''} ${parentCatUpdate?.name ?? ''}`,
            );

            // Preparar config e PDF del informe de inspección (solo categorías con catálogo)
            let updateInspectionPdfFile: File | null = null;
            let updateInspectionConfigJson: string | null = null;
            if (updateCatalog) {
                updateInspectionConfigJson = JSON.stringify(inspectionConfig);
                try {
                    const resolvedTpl = resolveTemplate(updateCatalog, inspectionConfig);
                    const pdfBlob = await buildTemplatePdf(resolvedTpl);
                    updateInspectionPdfFile = new File([pdfBlob], 'informe-inspeccion.pdf', { type: 'application/pdf' });
                } catch (pdfErr) {
                    console.error('[ExpertPanelPage] No se pudo generar el PDF del informe (update):', pdfErr);
                    setFormErrors({ general: 'No se pudo generar el PDF del informe de inspección. Por favor, inténtalo de nuevo.' });
                    return;
                }
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
                imagesSequence: imagesSequence.length > 0 ? imagesSequence : undefined,
                selectedDeliverableTypes: formData.selectedDeliverableTypes || [],
                inspectionTemplateConfig: updateInspectionConfigJson,
                inspectionTemplatePdf: updateInspectionPdfFile,
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

            // Determinar si la categoría seleccionada es de coches (por nombre propio o del padre)
            const selectedCatCreate = categories.find((c) => c.id === categoryId);
            const parentCatCreate = selectedCatCreate?.parentId != null
                ? categories.find((c) => c.id === selectedCatCreate.parentId)
                : undefined;
            const createCatalog = getInspectionCatalog(
                `${selectedCatCreate?.name ?? ''} ${parentCatCreate?.name ?? ''}`,
            );

            // Preparar config e PDF del informe de inspección (solo categorías con catálogo)
            let inspectionTemplatePdfFile: File | null = null;
            let inspectionConfigJson: string | null = null;
            if (createCatalog) {
                inspectionConfigJson = JSON.stringify(inspectionConfig);
                try {
                    const resolvedTpl = resolveTemplate(createCatalog, inspectionConfig);
                    const pdfBlob = await buildTemplatePdf(resolvedTpl);
                    inspectionTemplatePdfFile = new File([pdfBlob], 'informe-inspeccion.pdf', { type: 'application/pdf' });
                } catch (pdfErr) {
                    console.error('[ExpertPanelPage] No se pudo generar el PDF del informe:', pdfErr);
                    setFormErrors({ general: 'No se pudo generar el PDF del informe de inspección. Por favor, inténtalo de nuevo.' });
                    return;
                }
            }

            await createService({
                expertProfileId: expertProfileId,
                categoryId: categoryId,
                serviceTypeId: serviceTypeId,
                price: price,
                conditions: conditions,
                durationInHours: durationInHours,
                images: selectedImages,
                selectedDeliverableTypes: formData.selectedDeliverableTypes || [],
                inspectionTemplateConfig: inspectionConfigJson,
                inspectionTemplatePdf: inspectionTemplatePdfFile,
                // BUG #12: divisa de cobro del experto (derivada de su país = la de su cuenta Stripe salvo
                // reubicación). Sin esto el backend caía a EUR y un experto no-eurozona quedaba no contratable.
                currency: getCurrencyForCountry(profile?.country ?? null),
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

    // 🛡️ Mostrar spinner mientras el perfil de un experto aún no ha llegado (cargando
    // O pendiente de que el fetch arranque tras el pequeño delay del token). Antes solo
    // cubría `isLoadingProfile`, dejando una ventana (profile null + isLoadingProfile
    // false) en la que se colaba la pantalla "No se encontró tu perfil". Si la carga
    // falla de verdad, profileError se setea y caemos al bloque de error de abajo.
    if (!profile && !profileError && (isLoadingProfile || isExpert)) {
        return (
            <SileoPageLoader message="Cargando tu panel de experto…" className="bg-white" />
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
            <SileoPageLoader message="Verificando estado de pagos…" className="bg-white" />
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

    // 🛡️ Round 28 MUD-Y: si el experto se acaba de mudar (RelocatedFromCountry presente,
    // Country=null, sin Stripe acct), el StripeStatusCard mostraría "Continuar Verificación"
    // que dispararía un onboarding sin país → 400 unsupported_country (loop infinito que
    // además persistía StripeStatus=Pending antes del fix MUD-V). Aquí lo interceptamos
    // y mandamos al usuario al wizard /become-expert (paso 2) para elegir país nuevo.
    const isRelocationPending = !!profile?.relocatedFromCountry
                              && !profile?.country
                              && !profile?.onboardingCompleted
                              && !profile?.stripeAccountId;

    if (!canAccessPanel && stripeStatus !== null && isRelocationPending) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-background">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center space-y-5">
                    <div className="w-16 h-16 mx-auto rounded-full bg-blue-100 flex items-center justify-center">
                        <Plane className="w-8 h-8 text-blue-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Completa tu mudanza</h2>
                        <p className="text-sm text-gray-600 mt-2">
                            Tu cuenta Stripe Connect anterior se ha cerrado. Para volver a operar como experto,
                            selecciona tu nuevo país y completa el onboarding fresco.
                        </p>
                        {profile?.relocatedFromCountry && (
                            <p className="text-xs text-gray-500 mt-2">
                                País anterior: <span className="font-semibold">{profile.relocatedFromCountry}</span>
                            </p>
                        )}
                    </div>
                    <button
                        onClick={() => navigate('/become-expert')}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        Continuar con la mudanza
                        <Plane className="w-4 h-4" />
                    </button>
                </div>
            </div>
        );
    }

    // 🛡️ M2: handlers del StripeStatusCard extraídos a scope de componente para reutilizarlos
    // tanto en la pantalla bloqueada (!canAccessPanel) como en el desglose de requisitos que ahora
    // se muestra en la pestaña Perfil cuando el experto SÍ tiene acceso al panel.
    // ⚠️ Deben declararse ANTES del early return de !canAccessPanel: ese return referencia estos
    // handlers en su JSX, y como son `const` (sin hoisting) colocarlos debajo provocaba
    // "Cannot access 'handleStripeSetup' before initialization" (TDZ) al renderizar esa rama.
    const handleStripeSetup = async () => {
        if (isStartingOnboarding || isRestartingOnboarding) return;
        setIsStripeLoading(true);
        try {
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
                detail: { type: 'error', message: error?.message || 'No se pudo iniciar el proceso en Stripe. Inténtalo de nuevo.' },
            }));
        }
    };

    const handleStripeAccessDashboard = async () => {
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
                detail: { type: 'error', message: 'Error al abrir el enlace de Stripe. Inténtalo de nuevo.' },
            }));
        }
    };

    const handleStripeContactSupport = () => {
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
        window.open(`mailto:info@inspecciono.io?subject=${subject}&body=${body}`, '_blank', 'noopener,noreferrer');
    };

    // ✅ Solo bloquear acceso si el estado está cargado Y canAccessStripe es false
    if (!canAccessPanel && stripeStatus !== null) {
        return (
            <>
                <div className="min-h-screen bg-[#fafafa]">
                    <div className="mx-auto max-w-3xl px-4 py-5 sm:px-6 sm:py-8 lg:py-12">
                        <button
                            type="button"
                            onClick={() => navigate('/')}
                            className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-[#6a6a6a] transition-colors hover:text-[#1c1c1c]"
                        >
                            <ArrowLeft className="h-4 w-4" aria-hidden />
                            Volver al inicio
                        </button>

                        <StripeStatusCard
                            stripe={stripeHook}
                            isLoadingOnboarding={isStartingOnboarding || isRestartingOnboarding}
                            onSetupStripe={handleStripeSetup}
                            onAccessDashboard={handleStripeAccessDashboard}
                            onContactSupport={handleStripeContactSupport}
                        />
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

    const unreadHires = hires.reduce((total, hire) => total + (hire.unreadMessagesCount || 0), 0);
    const tabTitles: Record<ExpertTab, string> = {
        setup: 'Configuración',
        profile: 'Mi perfil',
        disponibilidad: 'Disponibilidad',
        services: 'Servicios',
        messages: 'Contrataciones y mensajes',
    };

    const openStripeDashboard = async () => {
        const isApprovedNow = stripeStatus?.stripeStatus === STRIPE_STATUS.APPROVED
            && stripeStatus?.onboardingCompleted === true;
        try {
            await (isApprovedNow ? openLoginLink() : openAccountLink());
        } catch (error) {
            console.error('Error opening Stripe link:', error);
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: {
                    type: 'error',
                    message: 'Error al abrir el enlace de Stripe. Inténtalo de nuevo.',
                },
            }));
        }
    };

    const visibilityNote = !profileSetupComplete
        ? 'Tus servicios no aparecen en búsquedas hasta completar los requisitos obligatorios.'
        : null;

    const stripeNote = stripeContext && !isFiscalStepComplete(stripeContext) && stripeStatus?.stripeStatus
        ? (stripeStatus as { statusMessage?: string; stripeStatusDetails?: string }).statusMessage
            || (stripeStatus as { stripeStatusDetails?: string }).stripeStatusDetails
            || 'Hay datos pendientes en tu cuenta de pagos.'
        : null;

    return (
        <div className="expert-panel-layout">
            {sidebarOpen && (
                <div className="expert-sidebar-overlay lg:hidden" onClick={() => setSidebarOpen(false)} aria-hidden />
            )}

            <aside className={`expert-sidebar ${sidebarOpen ? 'expert-sidebar--open' : ''}`}>
                <div className="expert-sidebar-brand">
                    {profile?.profilePictureUrl ? (
                        <img src={profile.profilePictureUrl} alt="" className="expert-profile-avatar" />
                    ) : (
                        <div className="expert-profile-avatar-fallback">
                            <User className="w-4 h-4" />
                        </div>
                    )}
                    <div className="min-w-0 flex-1">
                        <p className="expert-sidebar-name">{user?.name}</p>
                        <p className="expert-sidebar-role">Experto</p>
                    </div>
                    <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8 shrink-0" onClick={() => setSidebarOpen(false)}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                <div className="expert-sidebar-actions" aria-label="Acciones del panel">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="relative expert-sidebar-notify"
                        onClick={() => {
                            const open = (window as Window & { openNotificationCenter?: () => void }).openNotificationCenter;
                            if (open) open();
                        }}
                        aria-label="Notificaciones"
                    >
                        <Bell className="w-4 h-4" />
                        {notificationUnreadCount > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-bold text-background">
                                {notificationUnreadCount > 9 ? '9+' : notificationUnreadCount}
                            </span>
                        )}
                    </Button>
                    <button
                        type="button"
                        className="expert-sidebar-back"
                        onClick={() => navigate('/')}
                    >
                        <ArrowLeft className="w-4 h-4" aria-hidden />
                        Volver
                    </button>
                </div>

                <nav className="expert-sidebar-nav" aria-label="Panel de experto">
                    {!profileSetupComplete && (
                        <button
                            type="button"
                            className={`expert-nav-item ${activeTab === 'setup' ? 'expert-nav-item--active' : ''}`}
                            onClick={() => handleTabChange('setup')}
                        >
                            <Settings2 />
                            Configuración
                            {pendingRequired > 0 && <span className="expert-nav-badge">{pendingRequired}</span>}
                        </button>
                    )}
                    <p className="expert-nav-section-label">Panel</p>
                    <button
                        type="button"
                        className={`expert-nav-item ${activeTab === 'profile' ? 'expert-nav-item--active' : ''}`}
                        onClick={() => handleTabChange('profile')}
                    >
                        <User />
                        Mi perfil
                    </button>
                    <button
                        type="button"
                        className={`expert-nav-item ${activeTab === 'disponibilidad' ? 'expert-nav-item--active' : ''}`}
                        onClick={() => handleTabChange('disponibilidad')}
                    >
                        <CalendarClock />
                        Disponibilidad
                    </button>
                    <button
                        type="button"
                        className={`expert-nav-item ${activeTab === 'services' ? 'expert-nav-item--active' : ''}`}
                        onClick={() => handleTabChange('services')}
                    >
                        <Package />
                        Servicios
                    </button>
                    <button
                        type="button"
                        className={`expert-nav-item ${activeTab === 'messages' ? 'expert-nav-item--active' : ''}`}
                        onClick={() => handleTabChange('messages')}
                    >
                        <MessageCircle />
                        Contrataciones y mensajes
                        {unreadHires > 0 && <span className="expert-nav-badge">{unreadHires > 9 ? '9+' : unreadHires}</span>}
                    </button>
                </nav>

                <div className="expert-sidebar-footer">
                    <p className="expert-nav-section-label">Cuenta</p>
                    <button type="button" className="expert-nav-item" onClick={() => void openStripeDashboard()}>
                        <ExternalLink />
                        Panel de pagos
                    </button>
                    <button type="button" className="expert-nav-item" onClick={() => setShowVacationModal(true)}>
                        {profile?.isOnVacation ? <PlaneTakeoff /> : <Plane />}
                        {profile?.isOnVacation ? 'Activar cuenta' : 'Modo vacaciones'}
                    </button>
                    {profile?.country && (
                        <div className="expert-sidebar-meta">
                            <span>País</span>
                            <Badge variant="outline" className="text-[10px] py-0">{profile.country}</Badge>
                        </div>
                    )}
                    <button type="button" className="expert-nav-item" onClick={() => setShowRelocationWizard(true)}>
                        <Plane />
                        Cambiar país
                    </button>
                </div>
            </aside>

            <div className="expert-main">
                <header className="expert-topbar">
                    <Button variant="ghost" size="icon" className="lg:hidden expert-topbar-menu" onClick={() => setSidebarOpen(true)}>
                        <Menu className="w-5 h-5" />
                    </Button>
                    <div className="expert-topbar-heading">
                        <h1 className="expert-topbar-title">{tabTitles[activeTab]}</h1>
                    </div>
                    <div className="expert-topbar-spacer" />
                    <div className="expert-topbar-actions">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="relative expert-topbar-notify"
                            onClick={() => {
                                const open = (window as Window & { openNotificationCenter?: () => void }).openNotificationCenter;
                                if (open) open();
                            }}
                            aria-label="Notificaciones"
                        >
                            <Bell className="w-5 h-5" />
                            {notificationUnreadCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-bold text-background">
                                    {notificationUnreadCount > 9 ? '9+' : notificationUnreadCount}
                                </span>
                            )}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="hidden sm:flex expert-topbar-back">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Volver
                        </Button>
                    </div>
                </header>

                <main className={`expert-workspace${activeTab === 'setup' ? ' expert-workspace--setup' : ''}${activeTab === 'profile' ? ' expert-workspace--profile' : ''}${activeTab === 'services' && !showServiceForm ? ' expert-workspace--services' : ''}${showServiceForm && activeTab === 'services' ? ' expert-workspace--service-editor' : ''}${activeTab === 'disponibilidad' ? ' expert-workspace--availability' : ''}${activeTab === 'messages' ? ' expert-workspace--messages' : ''}`}>
                    {activeTab === 'setup' && profile ? (
                        <ProfileSetupWizard
                            profile={profile}
                            onEditProfile={() => handleTabChange('profile')}
                            onEditAvailability={() => handleTabChange('disponibilidad')}
                            onOpenStripe={openStripeDashboard}
                            visibilityNote={visibilityNote}
                            stripeNote={stripeNote}
                            stripeContext={stripeContext}
                        />
                    ) : activeTab === 'profile' && profile ? (
                        <>
                            {/* 🛡️ M2: desglose de requisitos Stripe (vencidos / pendientes / errores) para
                                expertos CON acceso al panel. Antes solo aparecía en la pantalla bloqueada
                                (!canAccessPanel); estados como RequirementsDue/RestrictedSoon nunca mostraban
                                qué faltaba. Se omite para Approved (nada que resolver) y NotRequested (aún sin alta). */}
                            {stripeStatus?.stripeStatus
                                && stripeStatus.stripeStatus !== STRIPE_STATUS.APPROVED
                                && stripeStatus.stripeStatus !== STRIPE_STATUS.NOT_REQUESTED && (
                                <div className="expert-profile-stripe-notice">
                                    <StripeStatusCard
                                        stripe={stripeHook}
                                        isLoadingOnboarding={isStartingOnboarding || isRestartingOnboarding}
                                        onSetupStripe={handleStripeSetup}
                                        onAccessDashboard={handleStripeAccessDashboard}
                                        onContactSupport={handleStripeContactSupport}
                                    />
                                </div>
                            )}
                            <ProfileEditForm
                                embedded
                                profile={profile as any}
                                onProfileUpdated={() => fetchProfile(true, { silent: true })}
                                profileSetup={{
                                    steps: profileSetupSteps,
                                    complete: profileSetupComplete,
                                    pendingRequired,
                                    onOpenSetup: !profileSetupComplete ? () => handleTabChange('setup') : undefined,
                                }}
                            />
                        </>
                    ) : activeTab === 'services' && showServiceForm ? (
                        <ServiceForm
                            onClose={() => {
                                scheduleFormReset();
                                setShowServiceForm(false);
                            }}
                            onClearForm={clearServiceForm}
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
                            setExistingImagesWithIds={setExistingImagesWithIds}
                            imagesToDelete={imagesToDelete}
                            setImagesToDelete={setImagesToDelete}
                            onImagesSequenceChange={setImagesSequence}
                            expertCountry={profile?.country ?? null}
                            inspectionConfig={inspectionConfig}
                            onInspectionConfigChange={setInspectionConfig}
                        />
                    ) : activeTab === 'services' ? (
                        <ServicesTab
                            activeTab="services"
                            services={services}
                            isLoadingServices={isLoadingServices}
                            servicesError={servicesError}
                            setShowServiceForm={(value) => {
                                if (value && !showServiceForm) resetForm();
                                setShowServiceForm(value);
                            }}
                            currentImageIndex={currentImageIndex}
                            goToPreviousImage={goToPreviousImage}
                            goToNextImage={goToNextImage}
                            categories={categories}
                            deleteService={deleteService}
                            isDeletingService={isDeletingService}
                            onEditService={handleEditService}
                            stripeStatus={stripeStatus?.stripeStatus}
                            onboardingCompleted={(stripeStatus as { onboardingCompleted?: boolean }).onboardingCompleted ?? profile?.onboardingCompleted}
                            isOnVacation={profile?.isOnVacation}
                            hasLocation={Boolean(
                                (profile as { latitude?: string | number })?.latitude != null && (profile as { latitude?: string | number })?.latitude !== ''
                                && (profile as { longitude?: string | number })?.longitude != null && (profile as { longitude?: string | number })?.longitude !== '',
                            )}
                            profileIncomplete={!profileSetupComplete}
                            onGoToSetup={() => handleTabChange('setup')}
                        />
                    ) : (
                    <div className="expert-workspace-inner">
                            <div className="expert-panel-surface expert-tab-content">
                                {/* 🛡️ C1 + unificación: banner ÚNICO de visibilidad (consecuencia comercial +
                                    acción + plazo Stripe). Sustituye al StripeStatusBanner, que era redundante
                                    (mostrar ambos confundía). El desglose de requisitos vive en la pestaña Perfil
                                    (StripeStatusCard, M2). Visible en todas las pestañas del panel, incl. services. */}
                                {profile && stripeStatus?.stripeStatus && activeTab !== 'disponibilidad' && activeTab !== 'messages' && activeTab !== 'services' && (
                                    <div className="px-5 pt-4">
                                        <ExpertVisibilityBanner
                                            stripeStatus={stripeStatus.stripeStatus}
                                            onboardingCompleted={(stripeStatus as { onboardingCompleted?: boolean }).onboardingCompleted ?? profile?.onboardingCompleted}
                                            isOnVacation={profile?.isOnVacation}
                                            country={(profile as { country?: string })?.country}
                                            latitude={(profile as { latitude?: string | number })?.latitude}
                                            longitude={(profile as { longitude?: string | number })?.longitude}
                                            servicesCount={services.length}
                                            hasPhoto={Boolean((profile as { profilePictureUrl?: string })?.profilePictureUrl?.trim())}
                                            hasDescription={Boolean((profile as { description?: string })?.description?.trim())}
                                            phoneSmsCapable={smsCapable}
                                            futureDueAtIso={(stripeStatus as { stripeFutureDueAt?: string | null }).stripeFutureDueAt ?? null}
                                            onOpenStripe={openStripeDashboard}
                                            onEditProfile={() => handleTabChange('profile')}
                                        />
                                    </div>
                                )}
                                {activeTab === 'disponibilidad' ? (
                                    <AvailabilityTab />
                                ) : (
                                    <ExpertMessagesInbox
                                        token={getAuthToken() || ''}
                                        userId={user?.id || user?.Id || 0}
                                    />
                                )}
                            </div>
                    </div>
                    )}
                </main>

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

            {/* 🛡️ Round 28 MUD-O: wizard de mudanza (cierre Stripe + re-onboarding). */}
            <ExpertRelocationWizard
                isOpen={showRelocationWizard}
                onClose={() => setShowRelocationWizard(false)}
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
                                <SileoButton
                                    onClick={handleVacationModeToggle}
                                    loading={isToggling}
                                    loadingText="Procesando…"
                                    className={profile?.isOnVacation
                                        ? 'bg-green-600 hover:bg-green-700'
                                        : 'bg-orange-600 hover:bg-orange-700'
                                    }
                                >
                                    {profile?.isOnVacation ? 'Activar cuenta' : 'Activar vacaciones'}
                                </SileoButton>
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