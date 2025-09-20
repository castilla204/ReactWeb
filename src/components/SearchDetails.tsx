import { useLayoutEffect, useState, useEffect, useRef } from 'react';
import { ArrowLeft, ChevronDown, Star, AlertTriangle, MessageCircle, Upload, Share2, ChevronUp, FileText, MessageSquare, Calendar } from 'lucide-react';
import { useSearch, SearchHire } from '../hooks/useSearch.hooks';
import { useServices } from '../hooks/useServices';
import { useCategories } from '../contexts/CategoryContext';
import { useAuth } from '../contexts/AuthContext';

import { useChat } from '../hooks/useChat';
import Chat from './Chat';
import { ReviewModal, DisputeModal, ResolveDisputeModal, AddAdModal, CancelServiceModal, FinalizeModal } from './Modals';
import { useSearchActions } from '../hooks/useSearchActions';
import { Notification, NotificationType } from './Notification';
import { useParams, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

// Imports para el sistema de citas
import { useAppointments } from '../hooks/useAppointments';
import AppointmentForm from './AppointmentForm';
import AppointmentStatus from './AppointmentStatus';
import RejectAppointmentModal from './RejectAppointmentModal';
import { Appointment, ProposeAppointmentDto, ConfirmAppointmentDto, RejectAppointmentDto, CancelAppointmentDto } from '../types/appointment';

// Imports para distribución de dinero
import { useMoneyDistribution } from '../hooks/useMoneyDistribution';
import MoneyDistributionInfo from './MoneyDistributionInfo';

interface Category {
    id: number;
    name: string;
}



interface NewAd {
    title: string;
    description: string;
    price: number;
    url: string;
    images: string[];
    category: string;
    province: string;
    city: string;
    sellerType: string;
    platformId: number;
}



interface SearchDetailsProps {
    isAdmin: boolean;
    onBack?: () => void;
}

const categoryBanners: { [key: number]: string } = {
    1: '/src/media/Car.png',
    2: '/src/media/motorcycle.png',
    3: '/src/media/house.png',
};

const statusRoadmap = [
    { label: 'Pendiente', status: 'pending', color: 'bg-yellow-600' },
    { label: 'En progreso', status: 'in_progress', color: 'bg-blue-600' },
    { label: 'En revisión', status: 'awaiting_client_decision', color: 'bg-purple-600' },
    { label: 'Completado', status: 'completed', color: 'bg-green-600' },
];

export default function SearchDetails({ isAdmin, onBack }: SearchDetailsProps) {
    const { id } = useParams<{ id: string }>();
    const searchId = parseInt(id || '0', 10);
    const navigate = useNavigate();
    const [modalState, setModalState] = useState({
        showFinalizeModal: false,
        showCancelConfirm: false,
        showAddAdForm: false,
        showDisputeModal: false,
        showResolveDisputeModal: false,
        showReviewModal: false,
    });
    const [disputeReason, setDisputeReason] = useState('');
    const [resolveInFavorOfClient, setResolveInFavorOfClient] = useState<boolean | null>(null);
    const [resolutionReason, setResolutionReason] = useState('');
    const [reviewForm, setReviewForm] = useState({
        score: 0,
        description: '',
        images: [] as File[],
    });
    const [newAd, setNewAd] = useState<NewAd>({
        title: '',
        description: '',
        price: 0,
        url: '',
        images: [],
        category: '',
        province: '',
        city: '',
        sellerType: 'particular',
        platformId: 1,
    });
    const [notifications, setNotifications] = useState<{ id: string; type: NotificationType; message: string; duration?: number }[]>([]);
    const [selectedDeliverableFiles, setSelectedDeliverableFiles] = useState<File[]>([]);
    const [showTrackOrder, setShowTrackOrder] = useState(false);
    const lastSearchHireId = useRef<number | null>(null);
    const [activeTab, setActiveTab] = useState<'chat' | 'details'>('chat');

    // Estado para el sistema de citas
    const [showAppointmentForm, setShowAppointmentForm] = useState(false);
    const [appointmentData, setAppointmentData] = useState<any>(null);
    const [timeRemaining, setTimeRemaining] = useState<string>('00:00:00');
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [appointmentToReject, setAppointmentToReject] = useState<Appointment | null>(null);
    
    // Estado para mostrar información de porcentajes
    const [showMoneyDistribution, setShowMoneyDistribution] = useState(false);
    const [selectedDistributionStatus, setSelectedDistributionStatus] = useState<string>('');

    // Prevent body scroll when chat is active on mobile
    useEffect(() => {
        if (activeTab === 'chat') {
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
            
            // Scroll chat to bottom when switching to chat tab
            setTimeout(() => {
                const chatContainer = document.querySelector('[data-chat-messages]');
                if (chatContainer) {
                    chatContainer.scrollTop = chatContainer.scrollHeight;
                }
            }, 150);
        } else {
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
        }

        return () => {
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
        };
    }, [activeTab]);

    const { getSearch } = useSearch({ enableQueries: false });
    const { useServiceByHireId } = useServices({});
    const { categories } = useCategories();
    const { user } = useAuth();

    const { deliverables, uploadDeliverable, deliverablesQuery, refetchDeliverables, isUploadingDeliverable } = useChat(searchId, setNotifications);
    const { handleCancelService, handleForceFinalize, handleCompleteService, handleDisputeSubmit, handleResolveDispute, handleAddAd } =
        useSearchActions(setNotifications);

    // Hook para el sistema de citas
    const { 
        getAppointmentBySearchHire, 
        proposeAppointment, 
        confirmAppointment, 
        rejectAppointment, 
        cancelAppointment, 
        isProposing,
        isRejecting
    } = useAppointments();
    
    const searchQuery = getSearch(searchId);
    // Only fetch service if we have a valid searchHire ID
    const hireId = searchQuery.data?.searchHire?.id;
    console.log('[SearchDetails] HireId extracted:', hireId);
    
    // Use the hook directly - it will handle enabled internally
    const serviceQuery = useServiceByHireId(hireId);
    
    // Query para obtener la cita si existe
    const appointmentQuery = getAppointmentBySearchHire(hireId || 0);
    
    // Determinar si este servicio necesita citas
    // Solo si hay un searchHire (servicio contratado)
    const hasSearchHire = !!searchQuery.data?.searchHire;
    
    // Obtener información del servicio directamente desde searchHire (optimizado)
    const serviceInfo = searchQuery.data?.searchHire?.service;
    
    // Hook para obtener configuración de distribución de dinero (después de serviceInfo)
    const { config: moneyDistributionConfig, isLoading: isLoadingMoneyConfig, error: moneyConfigError } = useMoneyDistribution(
        selectedDistributionStatus,
        searchQuery.data?.category, // categoryId
        serviceInfo?.serviceTypeCategoryId
    );
    
    // Opción 1: Verificar por serviceTypeCategoryId (1 o 2)
    const isAppointmentCategory = serviceInfo?.serviceTypeCategoryId === 1 || serviceInfo?.serviceTypeCategoryId === 2;
    
    // Opción 2: Verificar por requiresAppointment (nuevo campo del backend)
    const requiresAppointment = serviceInfo?.requiresAppointment;
    
    // Usar cualquiera de las dos condiciones, pero solo si hay searchHire
    const needsAppointment = hasSearchHire && (isAppointmentCategory || requiresAppointment);
    
    // Función para calcular el tiempo restante para crear cita (24 horas desde la contratación)
    const calculateTimeRemaining = () => {
        const searchHire: SearchHire | undefined = searchQuery.data?.searchHire;
        if (!searchHire?.createdAt) return '00:00:00';
        
        // ✅ CORRECTO: Calcular desde la fecha de contratación del servicio
        const hiredAt = new Date(searchHire.createdAt);
        const deadline = new Date(hiredAt.getTime() + 24 * 60 * 60 * 1000); // 24 horas después
        const now = new Date();
        const diff = deadline.getTime() - now.getTime();
        
        if (diff <= 0) return '00:00:00';
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    // Actualizar el temporizador cada segundo
    useEffect(() => {
        if (needsAppointment && !appointmentQuery.data) {
            const updateTimer = () => {
                setTimeRemaining(calculateTimeRemaining());
            };
            
            updateTimer(); // Actualizar inmediatamente
            const interval = setInterval(updateTimer, 1000);
            
            return () => clearInterval(interval);
        }
    }, [needsAppointment, appointmentQuery.data, searchQuery.data?.searchHire?.createdAt]);

    // Debug temporal para verificar los datos del servicio (optimizado)
    console.log('[SearchDetails] Service data (optimized):', {
        // Datos desde searchHire.service (optimizado)
        serviceTypeId: serviceInfo?.serviceTypeId,
        serviceTypeCategoryId: serviceInfo?.serviceTypeCategoryId,
        serviceTypeCategoryName: serviceInfo?.serviceTypeCategoryName,
        requiresAppointment: serviceInfo?.requiresAppointment,
        servicePrice: serviceInfo?.price,
        
        // Lógica de citas
        isAppointmentCategory,
        needsAppointment,
        hasSearchHire,
        hireId,
        
        // Temporizador
        timeRemaining,
        
        // Información completa del servicio
        fullServiceInfo: serviceInfo,
        
        // Estado de las queries
        searchQueryStatus: searchQuery.status,
        searchQueryIsLoading: searchQuery.isLoading,
        searchQueryError: searchQuery.error
    });

    // Debug adicional para verificar los datos del searchQuery
    console.log('[SearchDetails] Search data:', {
        searchData: searchQuery.data,
        searchHire: searchQuery.data?.searchHire,
        searchHireId: searchQuery.data?.searchHire?.id,
        searchStatus: searchQuery.status,
        searchIsLoading: searchQuery.isLoading,
        searchError: searchQuery.error
    });

    const userId = Number(user?.id) || 0;
    const clientId = Number(searchQuery.data?.userId ?? 0);
    const expertId = Number(searchQuery.data?.searchHire?.expertId ?? 0);

    const isClient = userId === clientId;
    const isExpert = userId === expertId;
    const hasReviewed = false; // Simplified since we're not fetching reviews anymore
    const canReview =
        isClient && searchQuery.data?.searchHire && ['completed', 'dispute-resolved'].includes(searchQuery.data.searchHire.status) && !hasReviewed;
    const canDispute = isClient && searchQuery.data?.searchHire?.status === 'awaiting_client_decision';
    const canApprove = isClient && searchQuery.data?.searchHire?.status === 'awaiting_client_decision';
    const canCancel = isExpert && searchQuery.data?.searchHire && !['completed', 'canceled', 'disputed'].includes(searchQuery.data.searchHire.status);
    const isDisputed = (isClient || isExpert) && searchQuery.data?.searchHire?.status === 'disputed';
    const canViewChat = (isClient || isExpert || isAdmin) && !!searchQuery.data?.searchHire;

    const category = categories?.find((c: Category) => c.id === searchQuery.data?.category);
    const categoryName = category?.name || 'Unknown Category';

    useEffect(() => {
        console.log('[SearchDetails] SearchDetails initialized with searchId:', searchId);
        console.log('[SearchDetails] SearchQuery state:', {
            isLoading: searchQuery.isLoading,
            isError: searchQuery.isError,
            error: searchQuery.error?.message,
            data: searchQuery.data ? 'Present' : 'Missing',
            searchHireId: searchQuery.data?.searchHire?.id
        });

        console.log('[SearchDetails] ServiceQuery state:', {
            isLoading: serviceQuery.isLoading,
            isError: serviceQuery.isError,
            error: serviceQuery.error?.message,
            data: serviceQuery.data ? 'Present' : 'Missing'
        });
        console.log('[SearchDetails] Deliverables state:', deliverables);
        console.log('[SearchDetails] Deliverables query status:', {
            isLoading: deliverablesQuery?.isLoading,
            isError: deliverablesQuery?.isError,
            error: deliverablesQuery?.error?.message,
        });
        console.log('[SearchDetails] Deliverables URLs:', deliverables?.deliverableUrls);
        if (deliverables?.deliverableUrls?.length) {
            console.log('[SearchDetails] Rendering deliverable URLs:', deliverables.deliverableUrls);
        } else {
            console.log('[SearchDetails] No deliverable URLs to render, deliverables:', JSON.stringify(deliverables));
        }
    }, [
        searchId, 
        searchQuery.isLoading, 
        searchQuery.isError, 
        searchQuery.data?.searchHire?.id,
        serviceQuery.isLoading, 
        serviceQuery.isError, 
        serviceQuery.data,
        deliverables?.deliverableUrls,
        deliverablesQuery?.isLoading,
        deliverablesQuery?.isError
    ]);

    useEffect(() => {
        if (searchQuery.data?.searchHire?.id && searchQuery.data.searchHire.id !== lastSearchHireId.current) {
            console.log('[13:42 CEST] searchHireId changed, refetching deliverables for searchHireId:', searchQuery.data.searchHire.id);
            lastSearchHireId.current = searchQuery.data.searchHire.id;
            // No necesitamos refetch manual, el useChat se encarga automáticamente
        }
    }, [searchQuery.data?.searchHire?.id]);

    const handleDeliverableFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files ? Array.from(e.target.files) : [];
        const maxDeliverableFileSize = 50 * 1024 * 1024; // 50MB
        const validFiles = files.filter((file) => {
            const extension = file.name.split('.').pop()?.toLowerCase();
            const isValidType = ['pdf', 'mp4'].includes(extension || '');
            const isValidSize = file.size <= maxDeliverableFileSize;
            return isValidType && isValidSize;
        });
        console.log('[13:42 CEST] Selected deliverable files:', validFiles.map((f) => ({ name: f.name, size: f.size })));
        if (validFiles.length > 0) {
            setNotifications((prev) => [
                ...prev,
                {
                    id: `deliverable-selected-${uuidv4()}`,
                    type: 'success' as NotificationType,
                    message: `Entregables seleccionados: ${validFiles.map((f) => f.name).join(', ')}`,
                    duration: 3000,
                },
            ]);
        }
        if (validFiles.length < files.length) {
            setNotifications((prev) => [
                ...prev,
                {
                    id: `deliverable-file-error-${uuidv4()}`,
                    type: 'error' as NotificationType,
                    message: `Solo se permiten archivos PDF, MP4 con un tamaño máximo de ${maxDeliverableFileSize / 1024 / 1024}MB.`,
                    duration: 5000,
                },
            ]);
        }
        setSelectedDeliverableFiles(validFiles);
    };

    const handleUploadDeliverable = async () => {
        if (selectedDeliverableFiles.length > 0) {
            console.log('[13:42 CEST] Uploading deliverables:', selectedDeliverableFiles.map((f) => ({ name: f.name, size: f.size })));
            await uploadDeliverable(selectedDeliverableFiles);
            setSelectedDeliverableFiles([]);
            // No necesitamos refetch manual, uploadDeliverable se encarga automáticamente
        } else {
            setNotifications((prev) => [
                ...prev,
                {
                    id: `deliverable-empty-error-${uuidv4()}`,
                    type: 'error' as NotificationType,
                    message: 'Por favor, selecciona al menos un archivo para subir como entregable.',
                    duration: 5000,
                },
            ]);
        }
    };

    useEffect(() => {
        if (!canViewChat && searchQuery.data?.searchHire && searchQuery.isSuccess) {
            setNotifications((prev) => [
                ...prev.filter((n) => !n.id.startsWith('chat-access-denied-')),
                {
                    id: `chat-access-denied-${Date.now()}`,
                    type: 'error',
                    message: `Chat no visible: El ID de usuario (${userId}) no coincide con el ID del cliente (${clientId}) ni con el del experto (${expertId})`,
                    duration: 5000,
                },
            ]);
        }
    }, [canViewChat, searchQuery.data, searchQuery.isSuccess, userId, clientId, expertId]);

    useEffect(() => {
        if (searchQuery.error) {
            console.error('[13:42 CEST] SearchQuery error:', searchQuery.error);
            setNotifications((prev) => [
                ...prev.filter((n) => !n.id.startsWith('api-error-')),
                {
                    id: `api-error-${Date.now()}`,
                    type: 'error',
                    message: 'Error al cargar la búsqueda. Por favor, verifica tu conexión o inicia sesión nuevamente.',
                    duration: 5000,
                },
            ]);
        }
        
        if (serviceQuery.error) {
            console.error('[13:42 CEST] ServiceQuery error:', serviceQuery.error);
            // Don't show error notification for service query as it's not critical for page function
            // The UI will gracefully fall back to showing category banners instead of service images
        }
    }, [searchQuery.error, serviceQuery.error]);

    useLayoutEffect(() => {
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
    }, []);

    const removeNotification = (id: string) => {
        setNotifications((prev) => prev.filter((notification) => notification.id !== id));
    };

    const handleAddAdAndClose = async () => {
        await handleAddAd(searchId, newAd, () => {
            // No need to refetch results in SearchDetails, just update the state
            setModalState((prev) => ({ ...prev, showAddAdForm: false }));
            setNewAd({
                title: '',
                description: '',
                price: 0,
                url: '',
                images: [],
                category: categories?.[0]?.id.toString() ?? '1',
                province: '',
                city: '',
                sellerType: 'particular',
                platformId: 1,
            });
        });
    };

    const handleDisputeSubmitAndClose = async () => {
        await handleDisputeSubmit(
            searchQuery.data?.searchHire?.id,
            disputeReason,
            () => {
                searchQuery.refetch();
                setModalState((prev) => ({ ...prev, showDisputeModal: false }));
                setDisputeReason('');
            }
        );
    };

    const handleResolveDisputeAndClose = async () => {
        await handleResolveDispute(searchQuery.data?.searchHire?.id, resolveInFavorOfClient, resolutionReason, () => {
            searchQuery.refetch();
            setModalState((prev) => ({ ...prev, showResolveDisputeModal: false }));
            setResolveInFavorOfClient(null);
            setResolutionReason('');
        });
    };

    const handleCancelServiceAndClose = async () => {
        await handleCancelService(searchQuery.data?.searchHire?.id);
            searchQuery.refetch();
            setModalState((prev) => ({ ...prev, showCancelConfirm: false }));
    };

    const handleForceFinalizeAndClose = async (favorExpert: boolean) => {
        await handleForceFinalize(searchQuery.data?.searchHire?.id, favorExpert, () => {
            searchQuery.refetch();
            setModalState((prev) => ({ ...prev, showFinalizeModal: false }));
        });
    };

    const handleApproveService = async () => {
        await handleCompleteService(searchQuery.data?.searchHire?.id, () => {
            searchQuery.refetch();
        });
    };

    // Función para verificar si se puede proponer una cita
    const canProposeAppointment = () => {
        // Si ya existe una cita, verificar su estado
        if (appointmentQuery.data) {
            const validAppointmentStatuses = ['awaiting_appointment', 'appointment_rejected', 'appointment_cancelled_by_client'];
            const canPropose = validAppointmentStatuses.includes(appointmentQuery.data.status);
            console.log('[SearchDetails] Can propose appointment (existing appointment):', {
                appointmentStatus: appointmentQuery.data.status,
                validStatuses: validAppointmentStatuses,
                canPropose
            });
            return canPropose;
        }
        
        // Si no existe cita, verificar que el SearchHire esté en un estado válido para crear citas
        const validHireStatuses = ['pending']; // Estado donde se puede proponer cita inicial
        const currentHireStatus = searchQuery.data?.searchHire?.status;
        const canPropose = currentHireStatus ? validHireStatuses.includes(currentHireStatus) : false;
        console.log('[SearchDetails] Can propose appointment (no appointment):', {
            hireStatus: currentHireStatus,
            validStatuses: validHireStatuses,
            canPropose,
            hasSearchHire: !!searchQuery.data?.searchHire,
            needsAppointment,
            isClient
        });
        return canPropose;
    };

    // Función para manejar la confirmación del rechazo desde el modal
    const handleRejectConfirm = async (reason: string) => {
        if (!appointmentToReject) return;
        
        try {
            const rejectData: RejectAppointmentDto = {
                appointmentId: appointmentToReject.id,
                reason: reason
            };
            
            await rejectAppointment(rejectData);
            
            setNotifications(prev => [...prev, {
                id: uuidv4(),
                type: 'success',
                message: 'Cita rechazada exitosamente'
            }]);
            
            // Cerrar modal y limpiar estado
            setShowRejectModal(false);
            setAppointmentToReject(null);
            
            // Recargar datos
            appointmentQuery.refetch();
            searchQuery.refetch();
            
        } catch (error) {
            console.error('Error al rechazar cita:', error);
            setNotifications(prev => [...prev, {
                id: uuidv4(),
                type: 'error',
                message: 'Error al rechazar la cita'
            }]);
        }
    };

    // Función para mostrar información de porcentajes antes de rechazar
    const showRejectionInfo = (appointment: Appointment) => {
        if (appointment.rejectionCount >= 1) {
            // Si es el segundo rechazo, mostrar configuración de cancelación
            setSelectedDistributionStatus('appointment_cancelled_by_expert_rejection');
        } else {
            // Si es el primer rechazo, no hay reembolso
            setSelectedDistributionStatus('appointment_rejected');
        }
        setShowMoneyDistribution(true);
        setAppointmentToReject(appointment);
    };

    // Función para mostrar información de porcentajes antes de cancelar
    const showCancellationInfo = (appointment: Appointment) => {
        if (appointment.cancellationCount >= 1) {
            // Si es la segunda cancelación del cliente
            setSelectedDistributionStatus('appointment_cancelled_by_client_second');
        } else {
            // Si es la primera cancelación, no hay reembolso
            setSelectedDistributionStatus('appointment_cancelled_by_client');
        }
        setShowMoneyDistribution(true);
        setAppointmentToReject(appointment);
    };

    // Funciones para manejar acciones de citas
    const handleAppointmentAction = async (action: string, appointment: Appointment) => {
        try {
            switch (action) {
                case 'propose':
                    setAppointmentData(appointment);
                    setShowAppointmentForm(true);
                    break;
                    
                case 'chat':
                    // Abrir el chat con el experto
                    setModalState(prev => ({ ...prev, showChatModal: true }));
                    break;
                    
                case 'confirm':
                    const confirmData: ConfirmAppointmentDto = {
                        appointmentId: appointment.id,
                        notes: 'Cita confirmada'
                    };
                    await confirmAppointment(confirmData);
                    setNotifications(prev => [...prev, {
                        id: uuidv4(),
                        type: 'success',
                        message: 'Cita confirmada exitosamente'
                    }]);
                    appointmentQuery.refetch();
                    break;
                    
                case 'reject':
                    // Mostrar información de porcentajes antes de rechazar
                    showRejectionInfo(appointment);
                    break;
                    
                case 'cancel':
                    // Mostrar información de porcentajes antes de cancelar
                    showCancellationInfo(appointment);
                    break;
                    
            }
        } catch (error) {
            console.error('Error en acción de cita:', error);
            setNotifications(prev => [...prev, {
                id: uuidv4(),
                type: 'error',
                message: 'Error al realizar la acción'
            }]);
        }
    };

    const handleProposalSubmit = async (data: ProposeAppointmentDto) => {
        try {
            if (appointmentData) {
                console.log('[SearchDetails] Proposing appointment with data:', {
                    searchHireId: appointmentData.searchHireId,
                    appointmentData: data,
                    searchHireStatus: searchQuery.data?.searchHire?.status,
                    appointmentStatus: appointmentQuery.data?.status,
                    hasExistingAppointment: !!appointmentQuery.data
                });
                
                // Verificar si se puede proponer una cita
                if (!canProposeAppointment()) {
                    const currentHireStatus = searchQuery.data?.searchHire?.status;
                    const currentAppointmentStatus = appointmentQuery.data?.status;
                    
                    let errorMessage = 'No se puede proponer cita.';
                    if (appointmentQuery.data) {
                        errorMessage += ` Estado de cita actual: ${currentAppointmentStatus}. Estados válidos: awaiting_appointment, appointment_rejected, appointment_cancelled_by_client`;
                    } else {
                        errorMessage += ` Estado de contratación actual: ${currentHireStatus}. Estados válidos: pending`;
                    }
                    
                    setNotifications(prev => [...prev, {
                        id: uuidv4(),
                        type: 'error',
                        message: errorMessage
                    }]);
                    return;
                }
                
                await proposeAppointment(appointmentData.searchHireId, data);
                setNotifications(prev => [...prev, {
                    id: uuidv4(),
                    type: 'success',
                    message: 'Cita propuesta exitosamente'
                }]);
                appointmentQuery.refetch();
                setShowAppointmentForm(false);
                setAppointmentData(null);
            }
        } catch (error) {
            console.error('Error al proponer cita:', error);
            setNotifications(prev => [...prev, {
                id: uuidv4(),
                type: 'error',
                message: 'Error al proponer cita'
            }]);
        }
    };

    const currentStatus = searchQuery.data?.searchHire?.status || 'pending';
    const currentStepIndex = statusRoadmap.findIndex((step) => step.status === currentStatus);

    // Only show loading for critical queries (searchQuery)
    if (searchQuery.isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-white text-black">
                <p className="text-lg">Cargando...</p>
            </div>
        );
    }

    // Only show error for critical failures (searchQuery)
    if (searchQuery.error) {
        return (
            <div className="flex items-center justify-center h-screen bg-white text-black">
                <p className="text-lg text-red-400">Error al cargar los datos</p>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/50 text-black lg:h-screen lg:min-h-screen flex flex-col">
            {/* Mobile-First Header - Compact */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
                <div className="px-3 py-2.5 sm:px-6 sm:py-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                            <button
                                onClick={onBack || (() => navigate('/busquedas'))}
                                className="p-1.5 hover:bg-gray-100 rounded-lg flex-shrink-0 transition-colors duration-200"
                            >
                                <ArrowLeft className="w-4 h-4 text-gray-700" />
                            </button>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-gray-500 text-xs font-medium flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                        </svg>
                                        {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                    </span>
                                    {/* Mobile Status Badge - No Border */}
                                    <span className={`sm:hidden inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium
                                        ${currentStatus === 'completed' ? 'bg-green-50 text-green-700' :
                                        currentStatus === 'in_progress' ? 'bg-blue-50 text-blue-700' :
                                        currentStatus === 'awaiting_client_decision' ? 'bg-orange-50 text-orange-700' : 'bg-gray-50 text-gray-700'}`}>
                                        <span className={`w-1 h-1 rounded-full ${currentStatus === 'completed' ? 'bg-green-500' :
                                            currentStatus === 'in_progress' ? 'bg-blue-500' :
                                            currentStatus === 'awaiting_client_decision' ? 'bg-orange-500' : 'bg-gray-400'}`} />
                                        {currentStatus === 'completed' ? 'Completado' :
                                            currentStatus === 'in_progress' ? 'En progreso' :
                                            currentStatus === 'awaiting_client_decision' ? 'En revisión' : 'Pendiente'}
                                    </span>
                                </div>
                                <h1 className="text-sm sm:text-xl font-semibold text-gray-900 truncate leading-tight">
                                    {searchQuery.data?.title || 'Cargando...'}
                                </h1>
                            </div>
                        </div>
                        
                        {/* Desktop Actions - Hidden on mobile */}
                        <div className="hidden sm:flex items-center gap-3">
                            <button className="px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 flex items-center gap-2 text-gray-700 font-medium transition-colors duration-200">
                                <Share2 className="w-4 h-4" />
                                Compartir
                            </button>
                            <button className="px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 flex items-center gap-2 text-gray-700 font-medium transition-colors duration-200">
                                <MessageCircle className="w-4 h-4" />
                                Comentarios
                            </button>
                        </div>
                        
                        {/* Mobile Menu Button - Compact */}
                        <button className="sm:hidden p-1.5 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                            <svg className="w-4 h-4 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Modern Full-Screen Layout */}
            <div className="flex flex-col lg:flex-row lg:h-[calc(100vh-120px)] lg:max-w-none lg:mx-0 lg:gap-0">
                {/* Main Chat Area - Takes Most Space */}
                {canViewChat && (
                    <div className="lg:flex-1 lg:w-[75%] xl:w-[80%] flex flex-col lg:h-full">
                        {/* Mobile Tabs Navigation */}
                        <div className="lg:hidden bg-white border-b border-gray-200 sticky top-[80px] z-40 shadow-sm">
                            {/* Expert Info Header */}
                            <div className="px-4 py-4 flex items-center gap-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                                <div className="flex items-center gap-3 flex-1">
                                    <div className="relative">
                                        {(serviceQuery.data?.expert?.profilePictureUrl || searchQuery.data?.searchHire?.expert?.profilePictureUrl) ? (
                                            <img 
                                                src={serviceQuery.data?.expert?.profilePictureUrl || searchQuery.data?.searchHire?.expert?.profilePictureUrl} 
                                                alt={serviceQuery.data?.expert?.user?.name || searchQuery.data?.searchHire?.expert?.name || 'Experto'}
                                                className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full object-cover border-2 border-white shadow-md"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-bold border-2 border-white shadow-md">
                                                {(serviceQuery.data?.expert?.user?.name || searchQuery.data?.searchHire?.expert?.name || 'E').charAt(0)}
                                            </div>
                                        )}
                                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-gray-900 truncate text-sm">
                                                {serviceQuery.data?.expert?.user?.name || searchQuery.data?.searchHire?.expert?.name || 'Experto'}
                                            </h3>
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                <svg className="w-2.5 h-2.5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                                Verificado
                                            </span>
                                        </div>
                                        <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                                            En línea • Responde rápido
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Tabs */}
                            <div className="flex bg-white">
                                <button
                                    onClick={() => setActiveTab('chat')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-colors duration-200 relative ${
                                        activeTab === 'chat'
                                            ? 'text-blue-600 bg-blue-50'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                                >
                                    <MessageSquare className="w-4 h-4" />
                                    Chat
                                    {activeTab === 'chat' && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
                                    )}
                                </button>
                                <button
                                    onClick={() => setActiveTab('details')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-colors duration-200 relative ${
                                        activeTab === 'details'
                                            ? 'text-blue-600 bg-blue-50'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                                >
                                    <FileText className="w-4 h-4" />
                                    Detalles
                                    {activeTab === 'details' && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Promotional Banners - Hidden on mobile, compact on desktop */}

                        {/* Main Content Container - Mobile Tabs / Desktop Chat */}
                        <div className="lg:bg-white lg:rounded-2xl lg:shadow-xl lg:border lg:border-gray-200/50 lg:mx-6 flex flex-col lg:flex-1 lg:flex-none lg:h-auto lg:backdrop-blur-sm">
                            {/* Chat Header - Desktop Only */}
                            <div className="hidden lg:block p-4 border-b border-gray-100">
                                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                                    Cargar mensajes anteriores
                                </button>
                            </div>
                            
                            {/* Mobile Tab Content */}
                            <div className="lg:flex-1 lg:px-4 lg:py-2 lg:overflow-hidden">
                                {/* Chat Tab Content - Mobile */}
                                {activeTab === 'chat' && (
                                    <div className="lg:hidden fixed inset-0 top-[190px] bottom-[80px] bg-white z-30">
                            <Chat 
                                searchId={searchId} 
                                setNotifications={setNotifications} 
                                isExpert={isExpert} 
                                expertData={{
                                    name: serviceQuery.data?.expert?.user?.name || searchQuery.data?.searchHire?.expert?.name,
                                    profilePictureUrl: serviceQuery.data?.expert?.profilePictureUrl || searchQuery.data?.searchHire?.expert?.profilePictureUrl
                                }}
                            />
                            
                            {/* Sistema de Citas - Mobile */}
                            {needsAppointment && appointmentQuery.data && (
                                <div className="fixed inset-x-0 bottom-0 z-40 p-2 bg-white border-t border-gray-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Calendar className="w-3 h-3 text-gray-600" />
                                        <h3 className="text-xs font-medium text-gray-900">Cita Programada</h3>
                                    </div>
                                    <div className="max-h-32 overflow-y-auto">
                                        <AppointmentStatus
                                            appointment={appointmentQuery.data}
                                            userRole={isClient ? 'client' : 'expert'}
                                            onAction={handleAppointmentAction}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Botón para proponer cita inicial - Mobile */}
                            {needsAppointment && !appointmentQuery.data && searchQuery.data?.searchHire && isClient && canProposeAppointment() && (
                                <div className="fixed inset-x-0 bottom-0 z-40 p-2 bg-white border-t border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-3 h-3 text-gray-600" />
                                            <div>
                                                <h3 className="text-xs font-medium text-gray-900">¿Necesitas programar una cita?</h3>
                                                <p className="text-xs text-gray-500">Este servicio requiere una cita</p>
                                            </div>
                                        </div>
                                        
                                        {/* Temporizador móvil compacto */}
                                        <div className="text-right mr-3">
                                            <div className="text-xs text-gray-500">Restante:</div>
                                            <div className="text-xs font-semibold text-blue-600">
                                                {timeRemaining}
                                            </div>
                                        </div>
                                        
                                        <button
                                            onClick={() => handleAppointmentAction('propose', { 
                                                id: 0, 
                                                searchHireId: searchQuery.data?.searchHire?.id || 0,
                                                status: 'awaiting_appointment',
                                                amount: serviceInfo?.price || 0
                                            } as Appointment)}
                                            className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs hover:bg-blue-700 transition-colors flex items-center gap-1"
                                        >
                                            <Calendar className="w-3 h-3" />
                                            Cita
                                        </button>
                                    </div>
                                </div>
                            )}

                            </div>
                                )}
                                
                                {/* Details Tab Content - Mobile */}
                                {activeTab === 'details' && (
                                    <div className="lg:hidden h-full overflow-y-auto">
                                        {/* Mobile Details Content */}
                                        <div className="p-3 space-y-3">
                                            {/* Service Card - Compact Layout */}
                                            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
                                                <div className="flex">
                                                    {/* Service Image - Side */}
                                                    <div className="relative w-20 h-16 flex-shrink-0">
                                                        {serviceQuery.data?.imageUrls && serviceQuery.data.imageUrls.length > 0 ? (
                                                            <img
                                                                src={serviceQuery.data.imageUrls[0]}
                                                                alt="Servicio contratado"
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    e.currentTarget.src = searchQuery.data?.category && categoryBanners[searchQuery.data.category] 
                                                                        ? categoryBanners[searchQuery.data.category] 
                                                                        : '/default-service.png';
                                                                }}
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                                                                {searchQuery.data?.category && categoryBanners[searchQuery.data.category] ? (
                                                                    <img
                                                                        src={categoryBanners[searchQuery.data.category]}
                                                                        alt={categoryName}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <div className="text-center">
                                                                        <svg className="w-6 h-6 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                                                        </svg>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Service Content - Side */}
                                                    <div className="flex-1 p-2 relative">
                                                        {/* Status Badge */}
                                                        <div className="absolute top-1 right-1">
                                                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium
                                                                ${currentStatus === 'completed' ? 'bg-green-50 text-green-700' :
                                                                currentStatus === 'in_progress' ? 'bg-blue-50 text-blue-700' :
                                                                currentStatus === 'awaiting_client_decision' ? 'bg-orange-50 text-orange-700' : 'bg-gray-50 text-gray-700'}`}>
                                                                <span className={`w-1.5 h-1.5 rounded-full ${currentStatus === 'completed' ? 'bg-green-500' :
                                                                    currentStatus === 'in_progress' ? 'bg-blue-500' :
                                                                    currentStatus === 'awaiting_client_decision' ? 'bg-orange-500' : 'bg-gray-400'}`} />
                                                                {currentStatus === 'completed' ? 'Completado' :
                                                                    currentStatus === 'in_progress' ? 'En progreso' :
                                                                    currentStatus === 'awaiting_client_decision' ? 'En revisión' : 'Pendiente'}
                                                            </span>
                                                        </div>
                                                        
                                                        <h3 className="font-semibold text-gray-900 mb-0.5 leading-tight pr-16 text-sm">
                                                            {searchQuery.data?.title}
                                                        </h3>
                                                        <p className="text-xs text-gray-600 leading-tight line-clamp-1">
                                                            {serviceQuery.data?.conditions || 'Servicio profesional personalizado'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Order Information - Mobile */}
                                            <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
                                                <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-1.5 text-sm">
                                                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                    Información del pedido
                                                </h4>
                                                <div className="grid grid-cols-1 gap-2 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500">Solicitado por</span>
                                                        <span className="font-medium text-gray-900">{user?.name || 'Usuario'}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500">Categoría</span>
                                                        <span className="font-medium text-gray-900">{categoryName}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500">Estado</span>
                                                        <span className="font-medium text-gray-900">
                                                            {searchQuery.data?.searchHire?.status 
                                                                ? searchQuery.data.searchHire.status.charAt(0).toUpperCase() + searchQuery.data.searchHire.status.slice(1).replace('_', ' ')
                                                                : 'No disponible'
                                                            }
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500">Número de pedido</span>
                                                        <span className="font-mono text-sm text-gray-700">#{searchId.toString().padStart(6, '0')}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action Buttons - Mobile */}
                                            <div className="space-y-2">
                                                {(canDispute || canApprove) && (
                                                    <div className="flex gap-2">
                                                        {canDispute && (
                                                            <button
                                                                onClick={() => setModalState((prev) => ({ ...prev, showDisputeModal: true }))}
                                                                className="flex-1 px-3 py-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg hover:bg-red-100 font-medium transition-colors duration-200 flex items-center justify-center gap-1.5"
                                                            >
                                                                <AlertTriangle className="w-4 h-4" />
                                                                Disputar
                                                            </button>
                                                        )}
                                                        {canApprove && (
                                                            <button
                                                                onClick={handleApproveService}
                                                                className="flex-1 px-3 py-2 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg hover:bg-green-100 font-medium transition-colors duration-200 flex items-center justify-center gap-1.5"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                                Aprobar
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                                
                                                {canCancel && (
                                                    <button
                                                        onClick={() => setModalState((prev) => ({ ...prev, showCancelConfirm: true }))}
                                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-100 font-medium transition-colors duration-200 flex items-center justify-center gap-1.5"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                        Cancelar Servicio
                                                    </button>
                                                )}

                                                {canReview && (
                                                    <button
                                                        onClick={() => setModalState((prev) => ({ ...prev, showReviewModal: true }))}
                                                        className="w-full px-3 py-2 bg-blue-50 border border-blue-200 text-blue-700 text-sm rounded-lg hover:bg-blue-100 font-medium transition-colors duration-200 flex items-center justify-center gap-1.5"
                                                    >
                                                        <Star className="w-4 h-4" />
                                                        Enviar Reseña
                                                    </button>
                                                )}
                                            </div>

                                            {/* Informes del Experto - Sección Móvil */}
                                            <div className="mt-6 pt-4 border-t border-gray-200">
                                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                                                            <FileText className="w-4 h-4 text-white" />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-base font-bold text-slate-900">📋 Informes del Experto</h3>
                                                            <p className="text-xs text-slate-600">Documentos técnicos y análisis profesional</p>
                                                        </div>
                                                    </div>

                                                    {deliverablesQuery.isLoading ? (
                                                        <div className="flex items-center justify-center gap-3 py-6">
                                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                                                            <p className="text-slate-600 font-medium text-sm">Cargando informes...</p>
                                                        </div>
                                                    ) : deliverablesQuery.isError ? (
                                                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <AlertTriangle className="w-4 h-4 text-red-600" />
                                                                <p className="text-red-800 font-medium text-sm">Error al cargar informes</p>
                                                            </div>
                                                            <p className="text-red-600 text-xs mb-3">No se pudieron cargar los informes del experto</p>
                                                            <button 
                                                                onClick={() => refetchDeliverables()}
                                                                className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition-colors"
                                                            >
                                                                Reintentar
                                                            </button>
                                                        </div>
                                                    ) : deliverables && deliverables.deliverableUrls && deliverables.deliverableUrls.length > 0 ? (
                                                        <div className="space-y-3">
                                                            <div className="grid gap-3">
                                                                {deliverables.deliverableUrls.map((url, index) => (
                                                                    <div key={index} className="bg-white rounded-lg border border-slate-200 p-3 hover:shadow-md transition-shadow">
                                                                        <div className="flex flex-col gap-3">
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                                                                                    {url.endsWith('.mp4') ? (
                                                                                        <video className="w-3 h-3 text-blue-600" />
                                                                                    ) : (
                                                                                        <FileText className="w-3 h-3 text-blue-600" />
                                                                                    )}
                                                                                </div>
                                                                                <div className="min-w-0 flex-1">
                                                                                    <h4 className="font-semibold text-slate-900 text-sm">
                                                                                        {url.endsWith('.mp4') ? `Video del Experto ${index + 1}` : `Informe Técnico ${index + 1}`}
                                                                                    </h4>
                                                                                    <p className="text-xs text-slate-500">
                                                                                        {url.endsWith('.mp4') ? 'Análisis en video' : 'Documento PDF detallado'}
                                                                                    </p>
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex items-center gap-2">
                                                                                {url.endsWith('.mp4') ? (
                                                                                    <video 
                                                                                        src={url} 
                                                                                        controls 
                                                                                        className="w-full h-20 rounded-lg object-cover"
                                                                                    />
                                                                                ) : (
                                                                                    <a 
                                                                                        href={url} 
                                                                                        target="_blank" 
                                                                                        rel="noopener noreferrer" 
                                                                                        className="w-full px-3 py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                                                                                    >
                                                                                        <FileText className="w-3 h-3" />
                                                                                        Ver Informe
                                                                                    </a>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                                    <p className="text-green-800 text-xs font-medium">
                                                                        ✅ {deliverables.deliverableUrls.length} informe{deliverables.deliverableUrls.length > 1 ? 's' : ''} disponible{deliverables.deliverableUrls.length > 1 ? 's' : ''}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-center py-6">
                                                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                                                <FileText className="w-6 h-6 text-slate-400" />
                                                            </div>
                                                            <h4 className="text-slate-900 font-semibold text-sm mb-2">No hay informes disponibles</h4>
                                                            <p className="text-slate-500 text-xs">El experto aún no ha subido informes técnicos</p>
                                                        </div>
                                                    )}

                                                    {isExpert && (
                                                        <div className="mt-4 pt-3 border-t border-blue-200">
                                                            <h4 className="font-semibold text-slate-900 text-sm mb-3 flex items-center gap-2">
                                                                <Upload className="w-4 h-4 text-blue-600" />
                                                                Subir Nuevo Informe
                                                            </h4>
                                                            <div className="space-y-3">
                                                                <label className="block">
                                                                    <input
                                                                        type="file"
                                                                        multiple
                                                                        accept=".pdf,.mp4"
                                                                        onChange={handleDeliverableFileChange}
                                                                        className="hidden"
                                                                    />
                                                                    <div className="w-full p-3 border-2 border-dashed border-blue-300 bg-blue-50 text-blue-700 cursor-pointer rounded-lg hover:bg-blue-100 transition-colors text-center">
                                                                                        <Upload className="w-4 h-4 mx-auto mb-2" />
                                                                                        <p className="font-medium text-sm">Subir Informe del Experto</p>
                                                                                        <p className="text-xs">PDF o MP4 (máx. 10MB)</p>
                                                                    </div>
                                                                </label>
                                                                <button
                                                                    onClick={handleUploadDeliverable}
                                                                    className={`w-full py-2.5 text-xs rounded-lg flex items-center justify-center gap-2 font-medium ${selectedDeliverableFiles.length === 0 || isUploadingDeliverable
                                                                        ? 'bg-slate-300 cursor-not-allowed text-slate-500'
                                                                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                                                                        }`}
                                                                    disabled={selectedDeliverableFiles.length === 0 || isUploadingDeliverable}
                                                                >
                                                                    {isUploadingDeliverable ? (
                                                                        <>
                                                                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                                                                            Subiendo...
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Upload className="w-3 h-3" />
                                                                            Subir Informe
                                                                        </>
                                                                    )}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Sistema de Citas - Mobile */}
                                            {needsAppointment && (
                                                <div className="space-y-3">
                                                    {appointmentQuery.data ? (
                                                        <AppointmentStatus
                                                            appointment={appointmentQuery.data}
                                                            userRole={isClient ? 'client' : 'expert'}
                                                            onAction={handleAppointmentAction}
                                                        />
                                                    ) : searchQuery.data?.searchHire && isClient && canProposeAppointment() ? (
                                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                                            <div className="flex items-center space-x-3">
                                                                <Calendar className="w-6 h-6 text-blue-600" />
                                                                <div className="flex-1">
                                                                    <h3 className="text-sm font-medium text-blue-900">Este servicio requiere una cita presencial</h3>
                                                                    <p className="text-xs text-blue-700 mt-1">Coordina con el experto para programar la revisión</p>
                                                                </div>
                                                                <button
                                                                    onClick={() => handleAppointmentAction('propose', { 
                                                                        id: 0, 
                                                                        searchHireId: searchQuery.data?.searchHire?.id || 0,
                                                                        status: 'awaiting_appointment',
                                                                        amount: serviceInfo?.price || 0
                                                                    } as Appointment)}
                                                                    className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-colors text-xs"
                                                                >
                                                                    Proponer Cita
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : needsAppointment && !appointmentQuery.data && isExpert ? (
                                                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                                            <div className="flex items-center space-x-3">
                                                                <Calendar className="w-6 h-6 text-gray-600" />
                                                                <div className="flex-1">
                                                                    <h3 className="text-sm font-medium text-gray-900">Esperando propuesta de cita</h3>
                                                                    <p className="text-xs text-gray-600 mt-1">El cliente debe proponer una fecha y hora para la revision</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : null}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                                
                                {/* Modern Professional Chat */}
                                <div className="hidden lg:block bg-white h-full flex flex-col shadow-2xl">
                                    {/* Modern Chat Header */}
                                    <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 border-b border-slate-700">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                                                    <MessageSquare className="w-6 h-6 text-white" />
                                                </div>
                                                <div>
                                                    <h2 className="text-xl font-bold text-white">Conversación</h2>
                                                    <p className="text-slate-300 text-sm">
                                                        {searchQuery.data?.searchHire?.expert?.name || 'Experto'}
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            {/* Modern Appointment Status */}
                                            {needsAppointment && (
                                                <div className="flex items-center gap-3">
                                                    {appointmentQuery.data ? (
                                                        <div className="bg-green-500 text-white px-4 py-2 rounded-full shadow-lg">
                                                            <span className="text-sm font-semibold">✓ Cita Programada</span>
                                                        </div>
                                                    ) : (
                                                        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-full shadow-lg">
                                                            <span className="text-sm font-semibold">⏰ {timeRemaining}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Full-Height Chat Area */}
                                    <div className="flex-1 bg-gray-50">
                                        <Chat 
                                            searchId={searchId} 
                                            setNotifications={setNotifications} 
                                            isExpert={isExpert} 
                                            expertData={{
                                                name: serviceQuery.data?.expert?.user?.name || searchQuery.data?.searchHire?.expert?.name,
                                                profilePictureUrl: serviceQuery.data?.expert?.profilePictureUrl || searchQuery.data?.searchHire?.expert?.profilePictureUrl
                                            }}
                                        />
                                    </div>

                                    {/* Modern Appointment Action Bar */}
                                    {needsAppointment && !appointmentQuery.data && isClient && canProposeAppointment() && (
                                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                                        <Calendar className="w-5 h-5 text-white" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-white text-lg">¿Necesitas programar una cita?</h4>
                                                        <p className="text-blue-100 text-sm">Este servicio requiere una cita para coordinar la revisión</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleAppointmentAction('propose', { 
                                                        id: 0, 
                                                        searchHireId: searchQuery.data?.searchHire?.id || 0,
                                                        status: 'awaiting_appointment',
                                                        amount: serviceInfo?.price || 0
                                                    } as Appointment)}
                                                    className="bg-white text-blue-600 px-6 py-3 rounded-xl hover:bg-gray-100 transition-all duration-200 text-sm font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                                                >
                                                    Proponer Cita
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                            </div>
                        </div>
                    </div>
                )}

                {/* Modern Right Sidebar - Desktop Only */}
                <div className="hidden lg:block lg:w-[25%] xl:w-[20%] bg-white shadow-2xl border-l border-gray-200 overflow-y-auto h-full">
                    {/* Order Details Header */}
                    <div className="p-3 border-b border-gray-100">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-base font-semibold text-gray-900">Detalles del pedido</h2>
                            <button className="text-gray-400 hover:text-gray-600 p-1">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                </svg>
                            </button>
                        </div>

                        {/* Service Card - Compact Side Layout */}
                        <div className="bg-gray-50 lg:bg-white rounded-lg border border-gray-200 p-3 mb-4 flex gap-3 items-start">
                            {/* Service Image - Small Side Image */}
                            <div className="relative flex-shrink-0">
                                {serviceQuery.data?.imageUrls && serviceQuery.data.imageUrls.length > 0 ? (
                                    <div className="relative w-12 h-12 overflow-hidden rounded-lg">
                                        <img
                                            src={serviceQuery.data.imageUrls[0]}
                                            alt="Servicio"
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                // Fallback to category banner if service image fails
                                                e.currentTarget.src = searchQuery.data?.category && categoryBanners[searchQuery.data.category] 
                                                    ? categoryBanners[searchQuery.data.category] 
                                                    : '/default-service.png';
                                            }}
                                        />
                                        {serviceQuery.data.imageUrls.length > 1 && (
                                            <div className="absolute -bottom-1 -right-1 bg-black/75 text-white text-xs px-1 py-0.5 rounded text-[10px] leading-none">
                                                +{serviceQuery.data.imageUrls.length - 1}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    // Fallback to category icon if no service images
                                    <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                                        {searchQuery.data?.category && categoryBanners[searchQuery.data.category] ? (
                                            <img
                                                src={categoryBanners[searchQuery.data.category]}
                                                alt={categoryName}
                                                className="w-full h-full object-cover rounded-lg"
                                            />
                                        ) : (
                                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                            </svg>
                                        )}
                                    </div>
                                )}
                            </div>
                            
                            {/* Service Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                    <h3 className="font-medium text-gray-900 text-sm line-clamp-1 leading-tight">
                                        {searchQuery.data?.title}
                                    </h3>
                                    {/* Status Badge - Small */}
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium flex-shrink-0
                                        ${currentStatus === 'completed' ? 'bg-green-100 text-green-700' :
                                        currentStatus === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                        currentStatus === 'awaiting_client_decision' ? 'bg-purple-100 text-purple-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                        <span className={`w-1 h-1 rounded-full ${
                                            currentStatus === 'completed' ? 'bg-green-500' :
                                            currentStatus === 'in_progress' ? 'bg-blue-500' :
                                            currentStatus === 'awaiting_client_decision' ? 'bg-purple-500' : 'bg-yellow-500'
                                        }`} />
                                        {currentStatus === 'completed' ? 'Completado' :
                                         currentStatus === 'in_progress' ? 'En progreso' :
                                         currentStatus === 'awaiting_client_decision' ? 'En revisión' : 'Pendiente'}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 line-clamp-1 leading-tight">
                                    {serviceQuery.data?.conditions || 'Servicio profesional personalizado'}
                                </p>
                            </div>
                        </div>

                        {/* Order Information - Mobile Optimized */}
                        <div className="space-y-2 lg:space-y-3">
                            <div className="grid grid-cols-2 gap-2 lg:gap-3 text-xs">
                                <div>
                                    <p className="text-gray-500 mb-1">Solicitado por</p>
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                                            {user?.name?.charAt(0) || 'U'}
                                        </div>
                                        <span className="font-medium text-gray-900">{user?.name || 'Usuario'}</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-gray-500 mb-1">Proyecto</p>
                                    <div className="flex items-center gap-1">
                                        <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                                        </svg>
                                        <span className="font-medium text-gray-900">Mi proyecto</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 lg:gap-3 text-xs">
                                <div>
                                    <p className="text-gray-500 mb-1">Categoría</p>
                                    <span className="font-medium text-gray-900">{categoryName}</span>
                                </div>
                                <div>
                                    <p className="text-gray-500 mb-1">Encargado a</p>
                                    <div className="flex items-center gap-3">
                                        {(serviceQuery.data?.expert?.profilePictureUrl || searchQuery.data?.searchHire?.expert?.profilePictureUrl) ? (
                                            <img 
                                                src={serviceQuery.data?.expert?.profilePictureUrl || searchQuery.data?.searchHire?.expert?.profilePictureUrl} 
                                                alt={serviceQuery.data?.expert?.user?.name || searchQuery.data?.searchHire?.expert?.name || 'Experto'}
                                                className="w-10 h-10 bg-green-500 rounded-full object-cover border-2 border-green-100"
                                                onError={(e) => {
                                                    // Fallback to initials if image fails to load
                                                    e.currentTarget.style.display = 'none';
                                                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                                }}
                                            />
                                        ) : null}
                                        <div className={`w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-medium border-2 border-green-100 ${(serviceQuery.data?.expert?.profilePictureUrl || searchQuery.data?.searchHire?.expert?.profilePictureUrl) ? 'hidden' : ''}`}>
                                            {(serviceQuery.data?.expert?.user?.name || searchQuery.data?.searchHire?.expert?.name || 'E').charAt(0)}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-gray-900">{serviceQuery.data?.expert?.user?.name || searchQuery.data?.searchHire?.expert?.name || 'Experto'}</span>
                                            {serviceQuery.data?.expert?.description && (
                                                <span className="text-xs text-gray-500 line-clamp-1">{serviceQuery.data.expert.description}</span>
                                            )}
                                        </div>
                                    </div>
                            </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 lg:gap-3 text-xs">
                                <div>
                                    <p className="text-gray-500 mb-1">Fecha de creación</p>
                                    <span className="font-medium text-gray-900">
                                        {searchQuery.data?.createdAt 
                                            ? new Date(searchQuery.data.createdAt).toLocaleDateString('es-ES', { 
                                                day: 'numeric', 
                                                month: 'short', 
                                                year: 'numeric',
                                                hour: '2-digit', 
                                                minute: '2-digit' 
                                            })
                                            : 'No disponible'
                                        }
                                </span>
                            </div>
                                <div>
                                    <p className="text-gray-500 mb-1">Estado de la contratación</p>
                                    <span className="font-medium text-gray-900">
                                        {searchQuery.data?.searchHire?.status 
                                            ? searchQuery.data.searchHire.status.charAt(0).toUpperCase() + searchQuery.data.searchHire.status.slice(1).replace('_', ' ')
                                            : 'No disponible'
                                        }
                                    </span>
                                </div>
                            </div>
                            
                            <div className="pt-2 border-t border-gray-100">
                                <p className="text-gray-500 text-sm mb-1">Número de pedido</p>
                                <span className="font-mono text-sm text-gray-700">#{searchId.toString().padStart(12, 'FO41A05960584')}</span>
                            </div>
                        </div>

                        {(isAdmin || isExpert) && (
                            <button
                                onClick={() => setModalState((prev) => ({ ...prev, showAddAdForm: true }))}
                                className="w-full mt-4 lg:mt-6 bg-gradient-to-r from-gray-900 to-gray-800 text-white py-2.5 lg:py-3 rounded-lg lg:rounded-xl hover:from-gray-800 hover:to-gray-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl text-sm lg:text-base"
                            >
                                Order Again
                            </button>
                        )}
                    </div>

                    {/* Track Order - Mobile Optimized */}
                    <div className="px-4 py-3 border-b border-gray-100">
                        <button
                            onClick={() => setShowTrackOrder(!showTrackOrder)}
                            className="flex items-center justify-between w-full text-left group"
                        >
                            <h3 className="font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">Seguimiento del Pedido</h3>
                            <div className="p-1 rounded-full group-hover:bg-gray-100 transition-colors">
                                {showTrackOrder ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                            </div>
                        </button>

                        {showTrackOrder && (
                            <div className="mt-4 space-y-3">
                                {statusRoadmap.map((step, index) => (
                                    <div key={step.status} className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${index <= currentStepIndex ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                        <span className={`text-sm ${index <= currentStepIndex ? 'text-gray-900' : 'text-gray-500'}`}>
                                            {step.label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {(canDispute || canApprove) && (
                            <div className="mt-4 flex gap-2">
                                {canDispute && (
                                    <button
                                        onClick={() => setModalState((prev) => ({ ...prev, showDisputeModal: true }))}
                                        className="flex-1 px-3 py-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg hover:bg-red-100 font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                                    >
                                        <AlertTriangle className="w-4 h-4" />
                                        Disputar
                                    </button>
                                )}
                                {canApprove && (
                                    <button
                                        onClick={handleApproveService}
                                        className="flex-1 px-3 py-2 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg hover:bg-green-100 font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Aprobar
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Support Section - Mobile Optimized */}
                    <div className="px-4 py-3">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">¿Necesitas ayuda con tu pedido?</p>
                                <p className="text-sm text-gray-500">Estoy aquí para ti.</p>
                            </div>
                        </div>

                        <button className="w-full mb-6 bg-white border-2 border-purple-500 text-purple-600 py-3 rounded-xl hover:bg-purple-50 flex items-center justify-center gap-2 font-medium transition-all duration-200 hover:shadow-md">
                            <MessageCircle className="w-4 h-4" />
                            Let's Chat
                        </button>

                        <div className="space-y-4">
                            <h4 className="font-semibold text-gray-900">Soporte</h4>

                            {isDisputed && (
                                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 mb-4">
                                    <p className="text-sm text-amber-800 flex items-center gap-3 font-medium">
                                        <div className="w-8 h-8 bg-amber-200 rounded-full flex items-center justify-center">
                                            <AlertTriangle className="w-4 h-4 text-amber-700" />
                                        </div>
                                        Disputa abierta. Un administrador la resolverá pronto.
                                    </p>
                                </div>
                            )}

                            <div className="space-y-3">
                                <button className="flex items-center justify-between w-full text-left p-3 hover:bg-gray-50 rounded-xl border border-gray-100 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                            <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">Fiverr Pro FAQs</p>
                                            <p className="text-xs text-gray-500">Encuentra respuestas necesarias.</p>
                                        </div>
                                    </div>
                                    <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                                </button>

                                <button className="flex items-center justify-between w-full text-left p-3 hover:bg-gray-50 rounded-xl border border-gray-100 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">Resolution center</p>
                                            <p className="text-xs text-gray-500">Resuelve problemas del pedido.</p>
                                        </div>
                                    </div>
                                    <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                                </button>
                            </div>

                            {canCancel && (
                                <button
                                    onClick={() => setModalState((prev) => ({ ...prev, showCancelConfirm: true }))}
                                    className="w-full mt-4 bg-gray-50 border border-gray-200 text-gray-700 py-3 rounded-xl hover:bg-gray-100 text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    Cancelar Servicio
                                </button>
                            )}

                            {isAdmin && searchQuery.data?.searchHire && (
                                <button
                                    onClick={() => setModalState((prev) => ({ ...prev, showFinalizeModal: true }))}
                                    className="w-full mt-3 bg-amber-500 text-white py-3 rounded-xl hover:bg-amber-600 text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                                >
                                    Finalizar Búsqueda
                                </button>
                            )}

                            {canReview && (
                                <button
                                    onClick={() => setModalState((prev) => ({ ...prev, showReviewModal: true }))}
                                    className="w-full mt-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-3 rounded-xl hover:from-yellow-600 hover:to-orange-600 text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                                >
                                    <Star className="w-4 h-4" />
                                    Enviar Reseña
                                </button>
                            )}
                        </div>

                        {/* Deliverables Section */}
                        {/* Informes del Experto - Sección Principal */}
                        <div className="mt-6 pt-6 border-t border-gray-200">
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 sm:p-6 border border-blue-200">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-full flex items-center justify-center">
                                        <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-base sm:text-lg font-bold text-slate-900">📋 Informes del Experto</h3>
                                        <p className="text-xs sm:text-sm text-slate-600">Documentos técnicos y análisis profesional</p>
                                    </div>
                                </div>

                                {deliverablesQuery.isLoading ? (
                                    <div className="flex items-center justify-center gap-3 py-8">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                        <p className="text-slate-600 font-medium">Cargando informes del experto...</p>
                                    </div>
                                ) : deliverablesQuery.isError ? (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <AlertTriangle className="w-5 h-5 text-red-600" />
                                            <p className="text-red-800 font-medium">Error al cargar informes</p>
                                        </div>
                                        <p className="text-red-600 text-sm mb-3">No se pudieron cargar los informes del experto</p>
                                        <button 
                                            onClick={() => refetchDeliverables()}
                                            className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                                        >
                                            Reintentar
                                        </button>
                                        {deliverablesQuery.error && (
                                            <p className="text-xs text-red-500 mt-2">{deliverablesQuery.error.message}</p>
                                        )}
                                    </div>
                                ) : deliverables && deliverables.deliverableUrls && deliverables.deliverableUrls.length > 0 ? (
                                    <div className="space-y-3 sm:space-y-4">
                                        <div className="grid gap-3 sm:gap-4">
                                            {deliverables.deliverableUrls.map((url, index) => (
                                                <div key={index} className="bg-white rounded-lg border border-slate-200 p-3 sm:p-4 hover:shadow-md transition-shadow">
                                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                                                {url.endsWith('.mp4') ? (
                                                                    <video className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                                                                ) : (
                                                                    <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                                                                )}
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <h4 className="font-semibold text-slate-900 text-sm sm:text-base">
                                                                    {url.endsWith('.mp4') ? `Video del Experto ${index + 1}` : `Informe Técnico ${index + 1}`}
                                                                </h4>
                                                                <p className="text-xs sm:text-sm text-slate-500">
                                                                    {url.endsWith('.mp4') ? 'Análisis en video' : 'Documento PDF detallado'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {url.endsWith('.mp4') ? (
                                                                <video 
                                                                    src={url} 
                                                                    controls 
                                                                    className="w-full sm:w-32 h-20 rounded-lg object-cover"
                                                                />
                                                            ) : (
                                                                <a 
                                                                    href={url} 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer" 
                                                                    className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-blue-600 text-white text-xs sm:text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                                                                >
                                                                    <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                                                                    <span className="hidden sm:inline">Ver Informe</span>
                                                                    <span className="sm:hidden">Ver</span>
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                <p className="text-green-800 text-xs sm:text-sm font-medium">
                                                    ✅ {deliverables.deliverableUrls.length} informe{deliverables.deliverableUrls.length > 1 ? 's' : ''} disponible{deliverables.deliverableUrls.length > 1 ? 's' : ''}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-6 sm:py-8">
                                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                                            <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400" />
                                        </div>
                                        <h4 className="text-slate-900 font-semibold text-sm sm:text-base mb-2">No hay informes disponibles</h4>
                                        <p className="text-slate-500 text-xs sm:text-sm">El experto aún no ha subido informes técnicos</p>
                                    </div>
                                )}

                                {isExpert && (
                                    <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-blue-200">
                                        <h4 className="font-semibold text-slate-900 text-sm sm:text-base mb-3 flex items-center gap-2">
                                            <Upload className="w-4 h-4 text-blue-600" />
                                            Subir Nuevo Informe
                                        </h4>
                                        <div className="space-y-3">
                                            <label className="block">
                                                <input
                                                    type="file"
                                                    multiple
                                                    accept=".pdf,.mp4"
                                                    onChange={handleDeliverableFileChange}
                                                    className="hidden"
                                                />
                                                <div className="w-full p-3 sm:p-4 border-2 border-dashed border-blue-300 bg-blue-50 text-blue-700 cursor-pointer rounded-lg hover:bg-blue-100 transition-colors text-center">
                                                    <Upload className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-2" />
                                                    <p className="font-medium text-sm sm:text-base">Subir Informe del Experto</p>
                                                    <p className="text-xs sm:text-sm">PDF o MP4 (máx. 10MB)</p>
                                                </div>
                                            </label>
                                            <button
                                                onClick={handleUploadDeliverable}
                                                className={`w-full py-2.5 sm:py-3 text-xs sm:text-sm rounded-lg flex items-center justify-center gap-2 font-medium ${selectedDeliverableFiles.length === 0 || isUploadingDeliverable
                                                    ? 'bg-slate-300 cursor-not-allowed text-slate-500'
                                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                                                    }`}
                                                disabled={selectedDeliverableFiles.length === 0 || isUploadingDeliverable}
                                            >
                                                {isUploadingDeliverable ? (
                                                    <>
                                                        <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-current"></div>
                                                        <span className="hidden sm:inline">Subiendo Informe...</span>
                                                        <span className="sm:hidden">Subiendo...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Upload className="w-3 h-3 sm:w-4 sm:h-4" />
                                                        <span className="hidden sm:inline">Subir Informe</span>
                                                        <span className="sm:hidden">Subir</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {/* Debug temporal - Información del servicio */}
            {process.env.NODE_ENV === 'development' && serviceQuery.data && (
                <div className="fixed top-20 right-4 z-50 bg-blue-100 border border-blue-300 rounded-lg p-3 text-xs max-w-xs">
                    <h4 className="font-bold text-blue-800 mb-2">Debug Servicio:</h4>
                    <div className="space-y-1 text-blue-700">
                        <div className="font-semibold text-blue-800">📊 Datos Optimizados:</div>
                        <div>ServiceTypeId: {serviceInfo?.serviceTypeId || 'N/A'}</div>
                        <div>ServiceTypeCategoryId: {serviceInfo?.serviceTypeCategoryId || 'N/A'}</div>
                        <div>ServiceTypeCategoryName: {serviceInfo?.serviceTypeCategoryName || 'N/A'}</div>
                        <div>RequiresAppointment: {serviceInfo?.requiresAppointment ? 'SÍ' : 'NO'}</div>
                        <div>ServicePrice: €{serviceInfo?.price || 'N/A'}</div>
                        <div className="border-t border-blue-300 pt-1 mt-1">
                            <div>IsAppointmentCategory: {isAppointmentCategory ? 'SÍ' : 'NO'}</div>
                            <div>HasSearchHire: {hasSearchHire ? 'SÍ' : 'NO'}</div>
                            <div>NeedsAppointment: {needsAppointment ? 'SÍ' : 'NO'}</div>
                        </div>
                        <div className="border-t border-blue-300 pt-1 mt-1">
                            <div>HireId: {hireId || 'N/A'}</div>
                            <div>SearchStatus: {searchQuery.data?.searchHire?.status || 'N/A'}</div>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            console.log('Refreshing search data (optimized)...');
                            searchQuery.refetch();
                        }}
                        className="mt-2 w-full bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                    >
                        Refrescar Datos
                    </button>
                </div>
            )}


            {/* Modal para proponer cita */}
            {showAppointmentForm && appointmentData && (
                <AppointmentForm
                    searchHireId={appointmentData.searchHireId}
                    onSubmit={handleProposalSubmit}
                    onCancel={() => {
                        setShowAppointmentForm(false);
                        setAppointmentData(null);
                    }}
                    isLoading={isProposing}
                />
            )}

            {/* Modal para rechazar cita */}
            <RejectAppointmentModal
                isOpen={showRejectModal}
                onClose={() => {
                    setShowRejectModal(false);
                    setAppointmentToReject(null);
                }}
                onConfirm={handleRejectConfirm}
                appointment={appointmentToReject}
                isLoading={isRejecting}
            />

            {/* Modal para mostrar información de distribución de dinero */}
            {showMoneyDistribution && appointmentToReject && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto p-6 relative">
                        <button 
                            onClick={() => {
                                setShowMoneyDistribution(false);
                                setAppointmentToReject(null);
                                setSelectedDistributionStatus('');
                            }} 
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        
                        <h3 className="text-xl font-semibold text-gray-900 mb-6">
                            Información de Distribución de Dinero
                        </h3>

                        <MoneyDistributionInfo
                            config={moneyDistributionConfig}
                            status={selectedDistributionStatus}
                            isLoading={isLoadingMoneyConfig}
                            error={moneyConfigError}
                            className="mb-6"
                        />

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => {
                                    setShowMoneyDistribution(false);
                                    setAppointmentToReject(null);
                                    setSelectedDistributionStatus('');
                                }}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors text-sm font-medium"
                            >
                                Cerrar
                            </button>
                            
                            {selectedDistributionStatus === 'appointment_cancelled_by_expert_rejection' && (
                                <button
                                    onClick={() => {
                                        setShowMoneyDistribution(false);
                                        setShowRejectModal(true);
                                    }}
                                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
                                >
                                    Continuar con Rechazo
                                </button>
                            )}
                            
                            {selectedDistributionStatus === 'appointment_cancelled_by_client_second' && (
                                <button
                                    onClick={async () => {
                                        const cancelReason = prompt('Razón de la cancelación:');
                                        if (cancelReason) {
                                            try {
                                                const cancelData: CancelAppointmentDto = {
                                                    appointmentId: appointmentToReject.id,
                                                    reason: cancelReason
                                                };
                                                await cancelAppointment(cancelData);
                                                setNotifications(prev => [...prev, {
                                                    id: uuidv4(),
                                                    type: 'success',
                                                    message: 'Cita cancelada exitosamente'
                                                }]);
                                                appointmentQuery.refetch();
                                                setShowMoneyDistribution(false);
                                                setAppointmentToReject(null);
                                                setSelectedDistributionStatus('');
                                            } catch (error) {
                                                console.error('Error al cancelar cita:', error);
                                                setNotifications(prev => [...prev, {
                                                    id: uuidv4(),
                                                    type: 'error',
                                                    message: 'Error al cancelar la cita'
                                                }]);
                                            }
                                        }
                                    }}
                                    className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors text-sm font-medium"
                                >
                                    Continuar con Cancelación
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <ReviewModal
                isOpen={modalState.showReviewModal}
                onClose={() => {
                    setModalState((prev) => ({ ...prev, showReviewModal: false }));
                    setReviewForm({ score: 0, description: '', images: [] });
                }}
                searchHireId={searchQuery.data?.searchHire?.id}
                reviewForm={reviewForm}
                setReviewForm={setReviewForm}
                onSubmit={() => {
                    searchQuery.refetch();
                    setModalState((prev) => ({ ...prev, showReviewModal: false }));
                    setReviewForm({ score: 0, description: '', images: [] });
                }}
                setNotifications={setNotifications}
            />
            <DisputeModal
                isOpen={modalState.showDisputeModal}
                onClose={() => {
                    setModalState((prev) => ({ ...prev, showDisputeModal: false }));
                    setDisputeReason('');
                }}
                disputeReason={disputeReason}
                setDisputeReason={setDisputeReason}
                onSubmit={handleDisputeSubmitAndClose}
            />
            <ResolveDisputeModal
                isOpen={modalState.showResolveDisputeModal}
                onClose={() => {
                    setModalState((prev) => ({ ...prev, showResolveDisputeModal: false }));
                    setResolveInFavorOfClient(null);
                    setResolutionReason('');
                }}
                resolveInFavorOfClient={resolveInFavorOfClient}
                setResolveInFavorOfClient={setResolveInFavorOfClient}
                resolutionReason={resolutionReason}
                setResolutionReason={setResolutionReason}
                onSubmit={handleResolveDisputeAndClose}
            />
            <AddAdModal
                isOpen={modalState.showAddAdForm}
                onClose={() => {
                    setModalState((prev) => ({ ...prev, showAddAdForm: false }));
                    setNewAd({
                        title: '',
                        description: '',
                        price: 0,
                        url: '',
                        images: [],
                        category: categories?.[0]?.id.toString() ?? '1',
                        province: '',
                        city: '',
                        sellerType: 'particular',
                        platformId: 1,
                    });
                }}
                newAd={newAd}
                setNewAd={setNewAd}
                categories={categories}
                onSubmit={handleAddAdAndClose}
            />
            <CancelServiceModal
                isOpen={modalState.showCancelConfirm}
                onClose={() => setModalState((prev) => ({ ...prev, showCancelConfirm: false }))}
                onConfirm={handleCancelServiceAndClose}
            />
            <FinalizeModal
                isOpen={modalState.showFinalizeModal}
                onClose={() => setModalState((prev) => ({
                    ...prev,
                    showFinalizeModal: false
                }))}
                onFinalize={handleForceFinalizeAndClose}
            />
            {notifications.map((notification) => (
                <Notification
                    key={notification.id}
                    type={notification.type}
                    message={notification.message}
                    onClose={() => removeNotification(notification.id)}
                    duration={notification.duration}
                />
            ))}
        </div>
    );
}