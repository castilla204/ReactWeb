import { useLayoutEffect, useState, useEffect, useRef } from 'react';
import { ArrowLeft, ChevronDown, Star, AlertTriangle, MessageCircle, Upload, Share2, ChevronUp, FileText, MessageSquare, Calendar, CheckCircle, DollarSign, User, XCircle } from 'lucide-react';
import { SearchHire } from '../hooks/useSearch.hooks';
import { useCategories } from '../contexts/CategoryContext';
import { useAuth } from '../contexts/AuthContext';

import { useChat } from '../hooks/useChat';
import Chat from './Chat';
import { ReviewModal, DisputeModal, ResolveDisputeModal, AddAdModal, CancelServiceModal, FinalizeModal, ReportModal } from './Modals';
import { useSearchActions } from '../hooks/useSearchActions';
import { useDisputes } from '../hooks/useDisputes';
import { Notification, NotificationType } from './Notification';
import { useParams, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

// Imports para el sistema de citas
import { useAppointments } from '../hooks/useAppointments';
import AppointmentForm from './AppointmentForm';
import AppointmentStatus from './AppointmentStatus';
import RejectAppointmentModal from './RejectAppointmentModal';
import { Appointment, ProposeAppointmentDto, ConfirmAppointmentDto, RejectAppointmentDto, CancelAppointmentDto } from '../types/appointment';

// Imports para distribuci�n de dinero
import MoneyDistributionInfo from './MoneyDistributionInfo';

// ? NUEVOS HOOKS OPTIMIZADOS
import { useSearchDetailsOptimized } from '../hooks/useSearchDetailsOptimized';

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
    { label: 'En revisi�n', status: 'awaiting_client_decision', color: 'bg-purple-600' },
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
        showReportModal: false,
    });
    const [disputeReason, setDisputeReason] = useState('');
    const [disputeFiles, setDisputeFiles] = useState<File[]>([]);
    const [resolveInFavorOfClient, setResolveInFavorOfClient] = useState<boolean | null>(null);
    const [resolutionReason, setResolutionReason] = useState('');
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    
    // Estados para respuesta del experto
    const [expertResponseText, setExpertResponseText] = useState('');
    const [expertResponseFiles, setExpertResponseFiles] = useState<File[]>([]);
    const [showExpertResponseModal, setShowExpertResponseModal] = useState(false);
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
    
    // Estado para mostrar informaci�n de porcentajes
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

    const { categories } = useCategories();
    const { user } = useAuth();

    // ? HOOK OPTIMIZADO - Reemplaza m�ltiples queries
    const {
        search,
        moneyDistribution,
        conversations,
        appointment,
        deliverables,
        disputes,
        isLoading,
        isError,
        error,
        invalidateAll
    } = useSearchDetailsOptimized(searchId);

    // ? DATOS DERIVADOS
    const hireId = search?.searchHire?.id;
    const hasSearchHire = !!search?.searchHire;
    const serviceInfo = search?.searchHire?.service;
    
    // ? DATOS DE EXPERTO DESDE SEARCHHIRE (ya viene en el hook optimizado)
    const expertInfo = search?.searchHire?.expert;

    // ? HOOKS PARA ACCIONES (se mantienen)
    const { deliverables: chatDeliverables, uploadDeliverable, deliverablesQuery, refetchDeliverables, isUploadingDeliverable } = useChat(searchId, setNotifications);
    const { handleCancelService, handleForceFinalize, handleCompleteService, handleDisputeSubmit, handleResolveDispute, handleAddAd } =
        useSearchActions(setNotifications);
    
    // Hook para obtener informaci�n de disputa (soluci�n integrada)
    const { expertResponse, debugDispute } = useDisputes();
    
    // Hook para el sistema de citas
    const { 
        proposeAppointment, 
        confirmAppointment, 
        rejectAppointment, 
        cancelAppointment, 
        isProposing,
        isRejecting
    } = useAppointments();
    
    // ? QUERIES LEGACY ELIMINADAS - Ahora se usan los datos del hook optimizado
    // const { getSearch } = useSearch({ enableQueries: false });
    // const searchQuery = getSearch(searchId);
    // const disputeQuery = useDisputeBySearchHire(hireId || 0);
    // const { useServiceByHireId } = useServices({});
    // const serviceQuery = useServiceByHireId(hireId);
    // const appointmentQuery = getAppointmentBySearchHire(hireId || 0);
    
    // ? DATOS YA OBTENIDOS DEL HOOK OPTIMIZADO
    // hasSearchHire y serviceInfo ya est�n definidos arriba
    
    // ? USAR DATOS OPTIMIZADOS PARA DISTRIBUCI�N DE DINERO
    const moneyDistributionConfig = moneyDistribution || null;
    const isLoadingMoneyConfig = false; // Ya viene del hook optimizado
    const moneyConfigError = null; // Ya viene del hook optimizado
    
    // Opci�n 1: Verificar por serviceTypeCategoryId (1 o 2)
    const isAppointmentCategory = serviceInfo?.serviceTypeCategoryId === 1 || serviceInfo?.serviceTypeCategoryId === 2;
    
    // Opci�n 2: Verificar por requiresAppointment (nuevo campo del backend)
    const requiresAppointment = serviceInfo?.requiresAppointment;
    
    // Usar cualquiera de las dos condiciones, pero solo si hay searchHire
    const needsAppointment = hasSearchHire && (isAppointmentCategory || requiresAppointment);
    
    // Funci�n para calcular el tiempo restante para crear cita (24 horas desde la contrataci�n)
    const calculateTimeRemaining = () => {
        const searchHire: SearchHire | undefined = search?.searchHire;
        if (!searchHire?.createdAt) return '00:00:00';
        
        // ? CORRECTO: Calcular desde la fecha de contrataci�n del servicio
        const hiredAt = new Date(searchHire.createdAt);
        const deadline = new Date(hiredAt.getTime() + 24 * 60 * 60 * 1000); // 24 horas despu�s
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
        if (needsAppointment && !appointment) {
            const updateTimer = () => {
                setTimeRemaining(calculateTimeRemaining());
            };
            
            updateTimer(); // Actualizar inmediatamente
            const interval = setInterval(updateTimer, 1000);
            
            return () => clearInterval(interval);
        }
    }, [needsAppointment, appointment, search?.searchHire?.createdAt]);

    // Debug temporal para verificar los datos del servicio (optimizado)
    console.log('[SearchDetails] Service data (optimized):', {
        // Datos desde searchHire.service (optimizado)
        serviceTypeId: serviceInfo?.serviceTypeId,
        serviceTypeCategoryId: serviceInfo?.serviceTypeCategoryId,
        serviceTypeCategoryName: serviceInfo?.serviceTypeCategoryName,
        requiresAppointment: serviceInfo?.requiresAppointment,
        servicePrice: serviceInfo?.price,
        
        // L�gica de citas
        isAppointmentCategory,
        needsAppointment,
        hasSearchHire,
        hireId,
        
        // Temporizador
        timeRemaining,
        
        // Informaci�n completa del servicio
        fullServiceInfo: serviceInfo,
        
        // Estado de las queries
        searchQueryStatus: 'success', // Datos del hook optimizado
        searchQueryIsLoading: isLoading,
        searchQueryError: error
    });

    // Debug adicional para verificar los datos del searchQuery
    console.log('[SearchDetails] Search data:', {
        searchData: search,
        searchHire: search?.searchHire,
        searchHireId: search?.searchHire?.id,
        searchStatus: 'success', // Datos del hook optimizado
        searchIsLoading: isLoading,
        searchError: error
    });

    const userId = Number(user?.id) || 0;
    const clientId = Number(search?.userId ?? 0);
    const expertId = Number(search?.searchHire?.expertId ?? search?.searchHire?.expert?.id ?? 0);
    
    // Debug temporal para verificar los datos del experto
    console.log('[SearchDetails] Expert data debug:', {
        userId,
        clientId,
        expertId,
        searchHire: search?.searchHire,
        expertInfo: search?.searchHire?.expert,
        expertIdFromHire: search?.searchHire?.expertId,
        expertIdFromExpert: search?.searchHire?.expert?.id
    });
    
    // Obtener el expertId de la disputa (puede ser diferente al de la b�squeda)
    const disputeExpertId = Number(disputes[0]?.id ?? 0); // Usar datos optimizados

    // Debug: Log user and role information
    console.log('[SearchDetails] User and role debug:', {
        userId,
        clientId,
        expertId,
        disputeExpertId,
        userData: user,
        searchData: search,
        disputeData: disputes
    });

    const isClient = userId === clientId;
    // Validación más robusta para isExpert - verificar tanto expertId como expert.id
    const isExpert = userId === expertId || (search?.searchHire?.expert?.id && userId === Number(search.searchHire.expert.id));
    const isDisputeExpert = userId === disputeExpertId;
    const hasReviewed = false; // Simplified since we're not fetching reviews anymore
    const canReview =
        isClient && search?.searchHire && ['completed', 'dispute-resolved'].includes(search.searchHire.status) && !hasReviewed;
    
    // Debug para reseñas
    console.log('[SearchDetails] Review debug:', {
        canReview,
        isClient,
        hasSearchHire: !!search?.searchHire,
        searchHireStatus: search?.searchHire?.status,
        hasReviewed,
        userId,
        clientId,
        validStatuses: ['completed', 'dispute-resolved'],
        statusIncluded: search?.searchHire?.status ? ['completed', 'dispute-resolved'].includes(search.searchHire.status) : false
    });
    const canDispute = isClient && search?.searchHire?.status === 'awaiting_client_decision';
    const canApprove = isClient && search?.searchHire?.status === 'awaiting_client_decision';
    const canCancel = isExpert && search?.searchHire && !['completed', 'canceled', 'disputed'].includes(search.searchHire.status);
    const isDisputed = (isClient || isExpert) && search?.searchHire?.status === 'disputed';
    const isDisputeResolved = (isClient || isExpert) && search?.searchHire?.status === 'dispute-resolved';
    
    // Determinar si el experto puede responder a la disputa
    const canExpertRespond = isDisputeExpert && 
                            disputes[0]?.status === 'pending' && 
                            !disputes[0]?.expertResponseText &&
                            search?.searchHire?.status === 'disputed';
    // Validación más robusta para el chat
    const canViewChat = (isClient || isExpert || isAdmin) && !!search?.searchHire && !!search?.searchHire?.id;
    
    // Debug adicional para la validación del chat
    console.log('[SearchDetails] Chat validation debug:', {
        canViewChat,
        isClient,
        isExpert,
        isAdmin,
        hasSearchHire: !!search?.searchHire,
        hasSearchHireId: !!search?.searchHire?.id,
        userId,
        clientId,
        expertId,
        expertIdFromExpert: search?.searchHire?.expert?.id
    });

    const category = categories?.find((c: Category) => c.id === search?.category);
    const categoryName = category?.name || 'Unknown Category';

    useEffect(() => {
        console.log('[SearchDetails] SearchDetails initialized with searchId:', searchId);
        console.log('[SearchDetails] SearchQuery state:', {
            isLoading: isLoading,
            isError: isError,
            error: error?.message,
            data: search ? 'Present' : 'Missing',
            searchHireId: search?.searchHire?.id
        });

        console.log('[SearchDetails] ServiceQuery state:', {
            isLoading: false, // Datos del hook optimizado
            isError: false,
            error: null,
            data: serviceInfo ? 'Present' : 'Missing'
        });
        console.log('[SearchDetails] Deliverables state:', deliverables);
        console.log('[SearchDetails] Deliverables query status:', {
            isLoading: deliverablesQuery?.isLoading,
            isError: deliverablesQuery?.isError,
            error: deliverablesQuery?.error?.message,
        });
        console.log('[SearchDetails] Deliverables:', deliverables);
        if (deliverables?.length) {
            console.log('[SearchDetails] Rendering deliverables:', deliverables);
        } else {
            console.log('[SearchDetails] No deliverable URLs to render, deliverables:', JSON.stringify(deliverables));
        }
    }, [
        searchId, 
        isLoading, 
        isError, 
        search?.searchHire?.id,
        false, // serviceQuery.isLoading - datos del hook optimizado
        false, // serviceQuery.isError - datos del hook optimizado 
        serviceInfo, // serviceInfo - datos del hook optimizado
        deliverables,
        deliverablesQuery?.isLoading,
        deliverablesQuery?.isError
    ]);

    useEffect(() => {
        if (search?.searchHire?.id && search.searchHire.id !== lastSearchHireId.current) {
            console.log('[13:42 CEST] searchHireId changed, refetching deliverables for searchHireId:', search.searchHire.id);
            lastSearchHireId.current = search.searchHire.id;
            // No necesitamos refetch manual, el useChat se encarga autom�ticamente
        }
    }, [search?.searchHire?.id]);

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
                    message: `Solo se permiten archivos PDF, MP4 con un tama�o m�ximo de ${maxDeliverableFileSize / 1024 / 1024}MB.`,
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
            // No necesitamos refetch manual, uploadDeliverable se encarga autom�ticamente
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
        if (!canViewChat && search?.searchHire) {
            setNotifications((prev) => [
                ...prev.filter((n) => !n.id.startsWith('chat-access-denied-')),
                {
                    id: `chat-access-denied-${Date.now()}`,
                    type: 'error',
                    message: `Chat no visible: Usuario ${userId}, Cliente ${clientId}, Experto ${expertId}. SearchHire: ${search?.searchHire?.id || 'N/A'}`,
                    duration: 5000,
                },
            ]);
        }
    }, [canViewChat, search, true, userId, clientId, expertId]); // search, searchQuery.isSuccess - datos del hook optimizado

    useEffect(() => {
        if (isError) {
            console.error('[13:42 CEST] SearchQuery error:', error);
            setNotifications((prev) => [
                ...prev.filter((n) => !n.id.startsWith('api-error-')),
                {
                    id: `api-error-${Date.now()}`,
                    type: 'error',
                    message: 'Error al cargar la b�squeda. Por favor, verifica tu conexi�n o inicia sesi�n nuevamente.',
                    duration: 5000,
                },
            ]);
        }
        
        if (isError) { // serviceQuery.error - datos del hook optimizado
            console.error('[13:42 CEST] ServiceQuery error:', error);
            // Don't show error notification for service query as it's not critical for page function
            // The UI will gracefully fall back to showing category banners instead of service images
        }
    }, [error, error]); // searchQuery.error, serviceQuery.error - datos del hook optimizado

    useLayoutEffect(() => {
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
    }, []);

    const removeNotification = (id: string) => {
        setNotifications((prev) => prev.filter((notification) => notification.id !== id));
    };

    const addNotification = (type: NotificationType, message: string, duration?: number) => {
        const id = uuidv4();
        setNotifications((prev) => [...prev, { id, type, message, duration }]);
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
            search?.searchHire?.id,
            disputeReason,
            disputeFiles,
            () => {
                invalidateAll();
                setModalState((prev) => ({ ...prev, showDisputeModal: false }));
                setDisputeReason('');
                setDisputeFiles([]);
            }
        );
    };

    const handleResolveDisputeAndClose = async () => {
        await handleResolveDispute(search?.searchHire?.id, resolveInFavorOfClient, resolutionReason, () => {
            invalidateAll();
            setModalState((prev) => ({ ...prev, showResolveDisputeModal: false }));
            setResolveInFavorOfClient(null);
            setResolutionReason('');
        });
    };

    // Funci�n de debug para entender el error 403
    const handleDebugDispute = async () => {
        if (!disputes[0]?.id) {
            addNotification('error', 'No hay disputa para debuggear');
            return;
        }

        try {
            console.log('[SearchDetails] Iniciando debug de disputa...');
            const debugData = await debugDispute(disputes[0].id);
            console.log('[SearchDetails] Debug data recibida:', debugData);
            addNotification('success', 'Debug completado - revisa la consola');
        } catch (error) {
            console.error('[SearchDetails] Error en debug:', error);
            addNotification('error', 'Error en debug - revisa la consola');
        }
    };

    // Funci�n para manejar la respuesta del experto
    const handleExpertResponseSubmit = async () => {
        if (!disputes[0]?.id || !expertResponseText.trim()) {
            addNotification('error', 'Por favor, proporciona una respuesta');
            return;
        }

        // Debug: Log expert response attempt
        console.log('[SearchDetails] Expert response attempt:', {
            disputeId: disputes[0].id,
            userId,
            expertId,
            disputeExpertId,
            isExpert,
            isDisputeExpert,
            canExpertRespond,
            disputeData: disputes,
            userData: user
        });

        try {
            await expertResponse.mutateAsync({
                disputeId: disputes[0].id,
                data: {
                    response: expertResponseText.trim(),
                    files: expertResponseFiles.length > 0 ? expertResponseFiles : undefined,
                }
            });
            
            addNotification('success', '? Respuesta enviada exitosamente');
            setShowExpertResponseModal(false);
            setExpertResponseText('');
            setExpertResponseFiles([]);
            invalidateAll(); // disputeQuery.refetch() - usar invalidaci�n unificada
        } catch (error) {
            console.error('Error al enviar respuesta del experto:', error);
            addNotification('error', 'Error al enviar la respuesta');
        }
    };

    const handleCancelServiceAndClose = async () => {
        await handleCancelService(search?.searchHire?.id);
            invalidateAll();
            setModalState((prev) => ({ ...prev, showCancelConfirm: false }));
    };

    const handleForceFinalizeAndClose = async (favorExpert: boolean) => {
        await handleForceFinalize(search?.searchHire?.id, favorExpert, () => {
            invalidateAll();
            setModalState((prev) => ({ ...prev, showFinalizeModal: false }));
        });
    };

    const handleApproveService = async () => {
        await handleCompleteService(search?.searchHire?.id, () => {
            invalidateAll();
        });
    };

    // Funci�n para verificar si se puede proponer una cita
    const canProposeAppointment = () => {
        // Si ya existe una cita, verificar su estado
        if (appointment) { // appointmentQuery.data - datos del hook optimizado
            const validAppointmentStatuses = ['awaiting_appointment', 'appointment_rejected', 'appointment_cancelled_by_client'];
            const canPropose = validAppointmentStatuses.includes(appointment.status);
            console.log('[SearchDetails] Can propose appointment (existing appointment):', {
                appointmentStatus: appointment.status,
                validStatuses: validAppointmentStatuses,
                canPropose
            });
            return canPropose;
        }
        
        // Si no existe cita, verificar que el SearchHire est� en un estado v�lido para crear citas
        const validHireStatuses = ['pending']; // Estado donde se puede proponer cita inicial
        const currentHireStatus = search?.searchHire?.status;
        const canPropose = currentHireStatus ? validHireStatuses.includes(currentHireStatus) : false;
        console.log('[SearchDetails] Can propose appointment (no appointment):', {
            hireStatus: currentHireStatus,
            validStatuses: validHireStatuses,
            canPropose,
            hasSearchHire: !!search?.searchHire,
            needsAppointment,
            isClient
        });
        return canPropose;
    };

    // Funci�n para manejar la confirmaci�n del rechazo desde el modal
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
            invalidateAll(); // appointmentQuery.refetch() - usar invalidaci�n unificada
            invalidateAll();
            
        } catch (error) {
            console.error('Error al rechazar cita:', error);
            setNotifications(prev => [...prev, {
                id: uuidv4(),
                type: 'error',
                message: 'Error al rechazar la cita'
            }]);
        }
    };

    // Funci�n para mostrar informaci�n de porcentajes antes del segundo rechazo
    const showRejectionInfo = (appointment: Appointment) => {
        // Solo se llama en el segundo rechazo, mostrar configuraci�n de cancelaci�n
        setSelectedDistributionStatus('appointment_cancelled_by_expert_rejection');
        setShowMoneyDistribution(true);
        setAppointmentToReject(appointment);
    };

    // Funci�n para mostrar informaci�n de porcentajes antes de la segunda cancelaci�n
    const showCancellationInfo = (appointment: Appointment) => {
        // Solo se llama en la segunda cancelaci�n, mostrar configuraci�n de cancelaci�n
        setSelectedDistributionStatus('appointment_cancelled_by_client_second');
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
                    invalidateAll(); // appointmentQuery.refetch() - usar invalidaci�n unificada
                    break;
                    
                case 'submit-report':
                    // Mostrar modal para ingresar notas del reporte
                    setModalState(prev => ({ ...prev, showReportModal: true }));
                    setSelectedAppointment(appointment);
                    break;
                    
                case 'reject':
                    // Si es el primer rechazo, rechazar directamente
                    if (appointment.rejectionCount === 0) {
                        const rejectData: RejectAppointmentDto = {
                            appointmentId: appointment.id,
                            reason: 'Rechazado por el experto'
                        };
                        await rejectAppointment(rejectData);
                        setNotifications(prev => [...prev, {
                            id: uuidv4(),
                            type: 'success',
                            message: 'Cita rechazada exitosamente'
                        }]);
                        invalidateAll(); // appointmentQuery.refetch() - usar invalidaci�n unificada
                    } else {
                        // Si es el segundo rechazo, mostrar informaci�n de porcentajes
                        showRejectionInfo(appointment);
                    }
                    break;
                    
                case 'cancel':
                    // Si es la primera cancelaci�n del cliente, cancelar directamente
                    if (appointment.cancellationCount === 0) {
                        const cancelData: CancelAppointmentDto = {
                            appointmentId: appointment.id,
                            reason: 'Cancelado por el cliente'
                        };
                        await cancelAppointment(cancelData);
                        setNotifications(prev => [...prev, {
                            id: uuidv4(),
                            type: 'success',
                            message: 'Cita cancelada exitosamente'
                        }]);
                        invalidateAll(); // appointmentQuery.refetch() - usar invalidaci�n unificada
                    } else {
                        // Si es la segunda cancelaci�n, mostrar informaci�n de porcentajes
                        showCancellationInfo(appointment);
                    }
                    break;
                    
            }
        } catch (error) {
            console.error('Error en acci�n de cita:', error);
            setNotifications(prev => [...prev, {
                id: uuidv4(),
                type: 'error',
                message: 'Error al realizar la acci�n'
            }]);
        }
    };

    const handleProposalSubmit = async (data: ProposeAppointmentDto) => {
        try {
            if (appointmentData) {
                console.log('[SearchDetails] Proposing appointment with data:', {
                    searchHireId: appointmentData.searchHireId,
                    appointmentData: data,
                    searchHireStatus: search?.searchHire?.status,
                    appointmentStatus: appointment?.status,
                    hasExistingAppointment: !!appointment
                });
                
                // Verificar si se puede proponer una cita
                if (!canProposeAppointment()) {
                    const currentHireStatus = search?.searchHire?.status;
                    const currentAppointmentStatus = appointment?.status; // appointmentQuery.data - datos del hook optimizado
                    
                    let errorMessage = 'No se puede proponer cita.';
                    if (appointment) { // appointmentQuery.data - datos del hook optimizado
                        errorMessage += ` Estado de cita actual: ${currentAppointmentStatus}. Estados v�lidos: awaiting_appointment, appointment_rejected, appointment_cancelled_by_client`;
                    } else {
                        errorMessage += ` Estado de contrataci�n actual: ${currentHireStatus}. Estados v�lidos: pending`;
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
                invalidateAll(); // appointmentQuery.refetch() - usar invalidaci�n unificada
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

    const currentStatus = search?.searchHire?.status || 'pending';
    const currentStepIndex = statusRoadmap.findIndex((step) => step.status === currentStatus);

    // Componente para mostrar la resoluci�n de la disputa
    const DisputeResolutionCard = () => {
        if (!isDisputeResolved || !disputes[0]) return null; // disputes[0] - datos del hook optimizado

        const dispute = disputes[0]; // disputes[0] - datos del hook optimizado
        const formatDate = (dateString: string) => {
            return new Date(dateString).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        };

        const formatCurrency = (amount: number) => {
            return new Intl.NumberFormat('es-ES', {
                style: 'currency',
                currency: 'EUR',
            }).format(amount);
        };

        const getResolutionIcon = () => {
            if (dispute.resolutionComments) {
                return <CheckCircle className="w-6 h-6 text-green-600" />;
            }
            return <AlertTriangle className="w-6 h-6 text-orange-500" />;
        };

        const getResolutionTitle = () => {
            if (dispute.resolutionComments) {
                return 'Disputa Resuelta';
            }
            return 'Disputa en Proceso';
        };

        const getResolutionColor = () => {
            if (dispute.resolutionComments) {
                return 'border-green-200 bg-green-50';
            }
            return 'border-orange-200 bg-orange-50';
        };

        return (
            <div className={`border rounded-lg p-6 ${getResolutionColor()}`}>
                <div className="flex items-center gap-3 mb-4">
                    {getResolutionIcon()}
                    <h3 className="text-lg font-semibold text-white">{getResolutionTitle()}</h3>
                </div>

                <div className="space-y-4">
                    {/* Disputa del cliente */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Disputa del Cliente</label>
                        <p className="text-white bg-white p-3 rounded-lg border">{dispute.reason}</p>
                        {dispute.files && dispute.files.length > 0 && (
                            <div className="mt-2">
                                <p className="text-xs text-gray-500 mb-1">Archivos del cliente:</p>
                                <div className="flex flex-wrap gap-1">
                                    {dispute.files.map((file) => (
                                        <span key={file.id} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                            {file.fileName}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Respuesta del experto */}
                    {dispute.expertResponse && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Respuesta del Experto</label>
                            <p className="text-white bg-white p-3 rounded-lg border">{dispute.expertResponse}</p>
                            {dispute.expertResponseFiles && dispute.expertResponseFiles.length > 0 && (
                                <div className="mt-2">
                                    <p className="text-xs text-gray-500 mb-1">Archivos del experto:</p>
                                    <div className="flex flex-wrap gap-1">
                                        {dispute.expertResponseFiles.map((file) => (
                                            <span key={file.id} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                                {file.fileName}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {dispute.expertResponseAt && (
                                <p className="text-xs text-gray-500 mt-1">
                                    Respondido el {new Date(dispute.expertResponseAt).toLocaleDateString('es-ES')}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Informaci�n de resoluci�n */}
                    {dispute.resolutionComments && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Resoluci�n del Administrador</label>
                            <p className="text-white bg-white p-3 rounded-lg border">{dispute.resolutionComments}</p>
                        </div>
                    )}

                    {/* Informaci�n financiera */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-lg border">
                            <div className="flex items-center gap-2 mb-2">
                                <DollarSign className="w-5 h-5 text-gray-500" />
                                <span className="text-sm font-medium text-gray-700">Monto del Servicio</span>
                            </div>
                            <p className="text-lg font-semibold text-white">{formatCurrency(dispute.searchHire.amount)}</p>
                        </div>

                        <div className="bg-white p-4 rounded-lg border">
                            <div className="flex items-center gap-2 mb-2">
                                <Calendar className="w-5 h-5 text-gray-500" />
                                <span className="text-sm font-medium text-gray-700">Fecha de Resoluci�n</span>
                            </div>
                            <p className="text-sm text-white">{formatDate(dispute.createdAt)}</p>
                        </div>
                    </div>

                    {/* Informaci�n de las partes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-lg border">
                            <div className="flex items-center gap-2 mb-2">
                                <User className="w-5 h-5 text-blue-500" />
                                <span className="text-sm font-medium text-gray-700">Cliente</span>
                            </div>
                            <p className="text-sm text-white">{dispute.client.name}</p>
                        </div>

                        {dispute.expert && (
                            <div className="bg-white p-4 rounded-lg border">
                                <div className="flex items-center gap-2 mb-2">
                                    <User className="w-5 h-5 text-green-500" />
                                    <span className="text-sm font-medium text-gray-700">Experto</span>
                                </div>
                                <p className="text-sm text-white">{dispute.expert.name}</p>
                            </div>
                        )}
                    </div>

                    {/* Mensaje informativo */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
                            <div>
                                <h4 className="text-sm font-medium text-blue-900 mb-1">Disputa Resuelta</h4>
                                <p className="text-sm text-blue-800">
                                    Esta disputa ha sido resuelta por nuestro equipo de administraci�n. 
                                    Si tienes alguna pregunta sobre la resoluci�n, puedes contactar con nuestro soporte.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Only show loading for critical queries (searchQuery)
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-white text-black">
                <p className="text-lg">Cargando...</p>
            </div>
        );
    }

    // Only show error for critical failures (searchQuery)
    if (isError) { // searchQuery.error - datos del hook optimizado
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
                                            currentStatus === 'awaiting_client_decision' ? 'En revisi�n' : 'Pendiente'}
                                    </span>
                                </div>
                                <h1 className="text-sm sm:text-xl font-semibold text-white truncate leading-tight">
                                    {search?.title || 'Cargando...'}
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

            {/* Clean Professional Layout */}
            <div className="flex flex-col lg:flex-row lg:h-[calc(100vh-100px)] lg:max-w-none lg:mx-0 lg:gap-6 lg:p-6">
                {/* Main Chat Area - Compact Modern Design */}
                {canViewChat && (
                    <div className="lg:flex-1 lg:w-[70%] xl:w-[75%] flex flex-col lg:h-full bg-white border border-gray-200 overflow-hidden">
                        {/* Modern Mobile Tabs Navigation */}
                        <div className="lg:hidden bg-white border-b border-gray-200 sticky top-[80px] z-40 shadow-lg">
                            {/* Expert Info Header */}
                            <div className="px-4 py-3 flex items-center gap-4 border-b border-gray-100 bg-gray-50">
                                <div className="flex items-center gap-3 flex-1">
                                    <div className="relative">
                                        {(expertInfo?.profilePictureUrl) ? ( 
                                            <img 
                                                src={expertInfo?.profilePictureUrl}  
                                                alt={expertInfo?.name || 'Experto'} 
                                                className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full object-cover border-2 border-white shadow-md"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                                {(expertInfo?.name || 'E').charAt(0)} 
                                            </div>
                                        )}
                                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-white truncate text-sm">
                                                {expertInfo?.name || 'Experto'} 
                                            </h3>
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                                                <svg className="w-2.5 h-2.5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                                Verificado
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-600 font-medium flex items-center gap-1">
                                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                            En l�nea � Responde r�pido
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Clean Tabs */}
                            <div className="flex bg-white border-b border-gray-200">
                                <button
                                    onClick={() => setActiveTab('chat')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-colors duration-200 relative ${
                                        activeTab === 'chat'
                                            ? 'text-blue-600 bg-gray-50'
                                            : 'text-gray-600 hover:text-white hover:bg-gray-50'
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
                                            ? 'text-blue-600 bg-gray-50'
                                            : 'text-gray-600 hover:text-white hover:bg-gray-50'
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
                                    <div className="lg:hidden h-full bg-white">
                                        <Chat 
                                            searchId={searchId} 
                                            setNotifications={setNotifications} 
                                            isExpert={!!isExpert} 
                                            expertData={{
                                                name: expertInfo?.name, 
                                                profilePictureUrl: expertInfo?.profilePictureUrl 
                                            }}
                                        />
                                    </div>
                                )}
                                
                                {/* Sistema de Citas - Mobile - Fuera del chat */}
                                {activeTab === 'chat' && needsAppointment && appointment && (
                                <div className="fixed inset-x-0 bottom-0 z-40 p-3 bg-white border-t border-gray-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Calendar className="w-3 h-3 text-gray-600" />
                                        <h3 className="text-xs font-medium text-white">Cita Programada</h3>
                                    </div>
                                    <div className="max-h-32 overflow-y-auto">
                                        <AppointmentStatus
                                            appointment={appointment} // appointmentQuery.data - datos del hook optimizado
                                            userRole={isClient ? 'client' : 'expert'}
                                            onAction={handleAppointmentAction}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Bot�n para proponer cita inicial - Mobile */}
                                {activeTab === 'chat' && needsAppointment && !appointment && search?.searchHire && isClient && canProposeAppointment() && (
                                <div className="fixed inset-x-0 bottom-0 z-40 p-3 bg-white border-t border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-3 h-3 text-gray-600" />
                                            <div>
                                                <h3 className="text-xs font-medium text-white">�Necesitas programar una cita?</h3>
                                                <p className="text-xs text-gray-500">Este servicio requiere una cita</p>
                                            </div>
                                        </div>
                                        
                                        {/* Temporizador m�vil compacto */}
                                        <div className="text-right mr-3">
                                            <div className="text-xs text-gray-500">Restante:</div>
                                            <div className="text-xs font-semibold text-blue-600">
                                                {timeRemaining}
                                            </div>
                                        </div>
                                        
                                        <button
                                            onClick={() => handleAppointmentAction('propose', { 
                                                id: 0, 
                                                searchHireId: search?.searchHire?.id || 0,
                                                status: 'awaiting_appointment',
                                                amount: serviceInfo?.price || 0
                                            } as Appointment)}
                                            className="bg-gray-600 text-white px-3 py-1.5 rounded text-xs hover:bg-gray-700 transition-colors flex items-center gap-1"
                                        >
                                            <Calendar className="w-3 h-3" />
                                            Cita
                                        </button>
                                    </div>
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
                                                        {false ? ( // serviceInfo - datos del hook optimizado (no incluye imageUrls)
                                                            <img
                                                                src={''} // No hay imageUrls en el DTO optimizado
                                                                alt="Servicio contratado"
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    e.currentTarget.src = search?.category && categoryBanners[search.category] // search - datos del hook optimizado 
                                                                        ? categoryBanners[search.category] // search - datos del hook optimizado 
                                                                        : '/default-service.png';
                                                                }}
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                                                                {search?.category && categoryBanners[search.category] ? ( // search - datos del hook optimizado
                                                                    <img
                                                                        src={categoryBanners[search.category]} // search - datos del hook optimizado
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
                                                                    currentStatus === 'awaiting_client_decision' ? 'En revisi�n' : 'Pendiente'}
                                                            </span>
                                                        </div>
                                                        
                                                        <h3 className="font-semibold text-white mb-0.5 leading-tight pr-16 text-sm">
                                                            {search?.title}
                                                        </h3>
                                                        <p className="text-xs text-gray-600 leading-tight line-clamp-1">
                                                            {serviceInfo?.serviceTypeName || 'Servicio profesional personalizado'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Dispute Resolution Card - Mobile */}
                                            <DisputeResolutionCard />

                                            {/* Order Information - Mobile */}
                                            <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
                                                <h4 className="font-medium text-white mb-2 flex items-center gap-1.5 text-sm">
                                                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                    Informaci�n del pedido
                                                </h4>
                                                <div className="grid grid-cols-1 gap-2 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500">Solicitado por</span>
                                                        <span className="font-medium text-white">{user?.name || 'Usuario'}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500">Categor�a</span>
                                                        <span className="font-medium text-white">{categoryName}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500">Estado</span>
                                                        <span className="font-medium text-white">
                                                            {search?.searchHire?.status 
                                                                ? search.searchHire.status.charAt(0).toUpperCase() + search.searchHire.status.slice(1).replace('_', ' ') // search - datos del hook optimizado
                                                                : 'No disponible'
                                                            }
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500">N�mero de pedido</span>
                                                        <span className="font-mono text-sm text-gray-700">#{searchId.toString().padStart(6, '0')}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action Buttons - Mobile */}
                                            <div className="space-y-2">
                                                {(canDispute || canApprove || canExpertRespond) && (
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
                                                        {canExpertRespond && (
                                                            <>
                                                                <button
                                                                    onClick={() => setShowExpertResponseModal(true)}
                                                                    className="flex-1 px-3 py-2 bg-orange-50 border border-orange-200 text-orange-700 text-sm rounded-lg hover:bg-orange-100 font-medium transition-colors duration-200 flex items-center justify-center gap-1.5"
                                                                >
                                                                    <MessageCircle className="w-4 h-4" />
                                                                    Responder Disputa
                                                                </button>
                                                                <button
                                                                    onClick={handleDebugDispute}
                                                                    className="px-3 py-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg hover:bg-red-100 font-medium transition-colors duration-200 flex items-center justify-center gap-1.5"
                                                                    title="Debug: Entender error 403"
                                                                >
                                                                    ?? Debug
                                                                </button>
                                                            </>
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
                                                        Enviar Rese�a
                                                    </button>
                                                )}
                                            </div>

                                            {/* Informes del Experto - Secci�n M�vil */}
                                            <div className="mt-6 pt-4 border-t border-gray-200">
                                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                                                            <FileText className="w-4 h-4 text-white" />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-base font-bold text-slate-900">?? Informes del Experto</h3>
                                                            <p className="text-xs text-slate-600">Documentos t�cnicos y an�lisis profesional</p>
                                                        </div>
                                                    </div>

                                                    {false ? ( // deliverablesQuery.isLoading - datos del hook optimizado
                                                        <div className="flex items-center justify-center gap-3 py-6">
                                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                                                            <p className="text-slate-600 font-medium text-sm">Cargando informes...</p>
                                                        </div>
                                                    ) : false ? ( // deliverablesQuery.isError - datos del hook optimizado
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
                                                    ) : deliverables && deliverables.length > 0 ? (
                                                        <div className="space-y-3">
                                                            <div className="grid gap-3">
                                                                {deliverables.map((deliverable, index) => (
                                                                    <div key={index} className="bg-white rounded-lg border border-slate-200 p-3 hover:shadow-md transition-shadow">
                                                                        <div className="flex flex-col gap-3">
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                                                                                    {deliverable.url.endsWith('.mp4') ? (
                                                                                        <video className="w-3 h-3 text-blue-600" />
                                                                                    ) : (
                                                                                        <FileText className="w-3 h-3 text-blue-600" />
                                                                                    )}
                                                                                </div>
                                                                                <div className="min-w-0 flex-1">
                                                                                    <h4 className="font-semibold text-slate-900 text-sm">
                                                                                        {deliverable.url.endsWith('.mp4') ? `Video del Experto ${index + 1}` : `Informe T�cnico ${index + 1}`}
                                                                                    </h4>
                                                                                    <p className="text-xs text-slate-500">
                                                                                        {deliverable.url.endsWith('.mp4') ? 'An�lisis en video' : 'Documento PDF detallado'}
                                                                                    </p>
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex items-center gap-2">
                                                                                {deliverable.url.endsWith('.mp4') ? (
                                                                                    <video 
                                                                                        src={deliverable.url} 
                                                                                        controls 
                                                                                        className="w-full h-20 rounded-lg object-cover"
                                                                                    />
                                                                                ) : (
                                                                                    <a 
                                                                                        href={deliverable.url} 
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
                                                                        ? {deliverables.length} informe{deliverables.length > 1 ? 's' : ''} disponible{deliverables.length > 1 ? 's' : ''}
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
                                                            <p className="text-slate-500 text-xs">El experto a�n no ha subido informes t�cnicos</p>
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
                                                                                        <p className="text-xs">PDF o MP4 (m�x. 10MB)</p>
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
                                                    {appointment ? ( // appointmentQuery.data - datos del hook optimizado
                                                        <AppointmentStatus
                                                            appointment={appointment} // appointmentQuery.data - datos del hook optimizado
                                                            userRole={isClient ? 'client' : 'expert'}
                                                            onAction={handleAppointmentAction}
                                                        />
                                                    ) : search?.searchHire && isClient && canProposeAppointment() ? ( // search - datos del hook optimizado
                                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                                            <div className="flex items-center space-x-3">
                                                                <Calendar className="w-6 h-6 text-blue-600" />
                                                                <div className="flex-1">
                                                                    <h3 className="text-sm font-medium text-blue-900">Este servicio requiere una cita presencial</h3>
                                                                    <p className="text-xs text-blue-700 mt-1">Coordina con el experto para programar la revisi�n</p>
                                                                </div>
                                                                <button
                                                                    onClick={() => handleAppointmentAction('propose', { 
                                                                        id: 0, 
                                                                        searchHireId: search?.searchHire?.id || 0,
                                                                        status: 'awaiting_appointment',
                                                                        amount: serviceInfo?.price || 0
                                                                    } as Appointment)}
                                                                    className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-colors text-xs"
                                                                >
                                                                    Proponer Cita
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : needsAppointment && !appointment && isExpert ? ( // appointmentQuery.data - datos del hook optimizado
                                                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                                            <div className="flex items-center space-x-3">
                                                                <Calendar className="w-6 h-6 text-gray-600" />
                                                                <div className="flex-1">
                                                                    <h3 className="text-sm font-medium text-white">Esperando propuesta de cita</h3>
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
                                
                                {/* Clean Professional Chat */}
                                <div className="hidden lg:block bg-white flex-1 flex flex-col border border-gray-200 overflow-hidden">
                                    {/* Clean Chat Header */}
                                    <div className="bg-white border-b border-gray-200 p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                                    <MessageSquare className="w-4 h-4 text-gray-600" />
                                                </div>
                                                <div>
                                                    <h2 className="text-xl font-bold text-white">Conversaci�n</h2>
                                                    <p className="text-slate-300 text-sm">
                                                        {expertInfo?.name || 'Experto'} // search - datos del hook optimizado
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            {/* Modern Appointment Status */}
                                            {needsAppointment && (
                                                <div className="flex items-center gap-3">
                                                    {appointment ? ( // appointmentQuery.data - datos del hook optimizado
                                                        <div className="bg-green-500 text-white px-4 py-2 rounded-full shadow-lg">
                                                            <span className="text-sm font-semibold">? Cita Programada</span>
                                                        </div>
                                                    ) : (
                                                        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-full shadow-lg">
                                                            <span className="text-sm font-semibold">? {timeRemaining}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Full-Height Chat Area */}
                                    <div className="flex-1 flex flex-col bg-gray-50">
                                        <Chat 
                                            searchId={searchId} 
                                            setNotifications={setNotifications} 
                                            isExpert={!!isExpert} 
                                            expertData={{
                                                name: expertInfo?.name, 
                                                profilePictureUrl: expertInfo?.profilePictureUrl 
                                            }}
                                            hideHeader={true}
                                        />
                                    </div>

                                    {/* Clean Appointment Action Bar */}
                                    {needsAppointment && !appointment && isClient && canProposeAppointment() && ( // appointmentQuery.data - datos del hook optimizado
                                        <div className="bg-gray-600 text-white p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                                                        <Calendar className="w-5 h-5 text-white" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-white text-lg">�Necesitas programar una cita?</h4>
                                                        <p className="text-blue-100 text-sm">Este servicio requiere una cita para coordinar la revisi�n</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleAppointmentAction('propose', { 
                                                        id: 0, 
                                                        searchHireId: search?.searchHire?.id || 0,
                                                        status: 'awaiting_appointment',
                                                        amount: serviceInfo?.price || 0
                                                    } as Appointment)}
                                                    className="bg-white text-gray-600 px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors duration-200 text-sm font-semibold"
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

                {/* Clean Professional Sidebar - Desktop Only */}
                <div className="hidden lg:block lg:w-[30%] xl:w-[25%] bg-white border border-gray-200 overflow-y-auto h-full">
                    {/* Clean Order Details Header */}
                    <div className="p-4 border-b border-gray-200 bg-gray-50">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-semibold text-gray-800">Detalles</h2>
                            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        </div>

                        {/* Dispute Resolution Card */}
                        <DisputeResolutionCard />

                        {/* Clean Service Card */}
                        <div className="bg-gray-50 border border-gray-200 p-4 mb-4 flex gap-3 items-start">
                            {/* Service Image - Small Side Image */}
                            <div className="relative flex-shrink-0">
                                {false ? ( // serviceInfo - datos del hook optimizado (no incluye imageUrls)
                                    <div className="relative w-12 h-12 overflow-hidden rounded-lg">
                                        <img
                                            src={''} // No hay imageUrls en el DTO optimizado
                                            alt="Servicio"
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                // Fallback to category banner if service image fails
                                                e.currentTarget.src = search?.category && categoryBanners[search.category] 
                                                    ? categoryBanners[search.category] 
                                                    : '/default-service.png';
                                            }}
                                        />
                                        {false && ( // No hay múltiples imágenes en el DTO optimizado
                                            <div className="absolute -bottom-1 -right-1 bg-black/75 text-white text-xs px-1 py-0.5 rounded text-[10px] leading-none">
                                                +0
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    // Clean category icon fallback
                                    <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center">
                                        {search?.category && categoryBanners[search.category] ? (
                                            <img
                                                src={categoryBanners[search.category]}
                                                alt={categoryName}
                                                className="w-full h-full object-cover rounded-lg"
                                            />
                                        ) : (
                                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                            </svg>
                                        )}
                                    </div>
                                )}
                            </div>
                            
                            {/* Service Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                    <h3 className="font-semibold text-gray-800 text-sm line-clamp-1 leading-tight">
                                        {search?.title}
                                    </h3>
                                    {/* Status Badge - Small */}
                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium flex-shrink-0
                                        ${currentStatus === 'completed' ? 'bg-green-100 text-green-700' :
                                        currentStatus === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                        currentStatus === 'awaiting_client_decision' ? 'bg-purple-100 text-purple-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${
                                            currentStatus === 'completed' ? 'bg-green-500' :
                                            currentStatus === 'in_progress' ? 'bg-blue-500' :
                                            currentStatus === 'awaiting_client_decision' ? 'bg-purple-500' : 'bg-yellow-500'
                                        }`} />
                                        {currentStatus === 'completed' ? 'Completado' :
                                         currentStatus === 'in_progress' ? 'En progreso' :
                                         currentStatus === 'awaiting_client_decision' ? 'En revisi�n' : 'Pendiente'}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-600 line-clamp-1 leading-tight font-medium">
                                    {serviceInfo?.serviceTypeName || 'Servicio profesional personalizado'}
                                </p>
                            </div>
                        </div>

                        {/* Clean Order Information */}
                        <div className="space-y-3 p-4 bg-gray-50 border border-gray-200">
                            <div className="grid grid-cols-2 gap-2 lg:gap-3 text-xs">
                                <div>
                                    <p className="text-gray-500 mb-1">Solicitado por</p>
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                                            {user?.name?.charAt(0) || 'U'}
                                        </div>
                                        <span className="font-medium text-white">{user?.name || 'Usuario'}</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-gray-500 mb-1">Proyecto</p>
                                    <div className="flex items-center gap-1">
                                        <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                                        </svg>
                                        <span className="font-medium text-white">Mi proyecto</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 lg:gap-3 text-xs">
                                <div>
                                    <p className="text-gray-500 mb-1">Categor�a</p>
                                    <span className="font-medium text-white">{categoryName}</span>
                                </div>
                                <div>
                                    <p className="text-gray-500 mb-1">Encargado a</p>
                                    <div className="flex items-center gap-3">
                                        {(expertInfo?.profilePictureUrl) ? ( 
                                            <img 
                                                src={expertInfo?.profilePictureUrl}  
                                                alt={expertInfo?.name || 'Experto'} 
                                                className="w-10 h-10 bg-green-500 rounded-full object-cover border-2 border-green-100"
                                                onError={(e) => {
                                                    // Fallback to initials if image fails to load
                                                    e.currentTarget.style.display = 'none';
                                                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                                }}
                                            />
                                        ) : null}
                                        <div className={`w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white text-sm font-medium ${(search?.searchHire?.expert?.profilePictureUrl) ? 'hidden' : ''}`}>
                                            {(search?.searchHire?.expert?.name || 'E').charAt(0)}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-white">{search?.searchHire?.expert?.name || 'Experto'}</span>
                                        </div>
                                    </div>
                            </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 lg:gap-3 text-xs">
                                <div>
                                    <p className="text-gray-500 mb-1">Fecha de creaci�n</p>
                                    <span className="font-medium text-white">
                                        {search?.createdAt 
                                            ? new Date(search.createdAt).toLocaleDateString('es-ES', { 
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
                                    <p className="text-gray-500 mb-1">Estado de la contrataci�n</p>
                                    <span className="font-medium text-white">
                                        {search?.searchHire?.status 
                                            ? search.searchHire.status.charAt(0).toUpperCase() + search.searchHire.status.slice(1).replace('_', ' ')
                                            : 'No disponible'
                                        }
                                    </span>
                                </div>
                            </div>
                            
                            <div className="pt-2 border-t border-gray-100">
                                <p className="text-gray-500 text-sm mb-1">N�mero de pedido</p>
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

                    {/* Clean Track Order */}
                    <div className="p-4 border-b border-gray-200 bg-gray-50">
                        <button
                            onClick={() => setShowTrackOrder(!showTrackOrder)}
                            className="flex items-center justify-between w-full text-left group"
                        >
                            <h3 className="font-semibold text-white group-hover:text-gray-700 transition-colors">Seguimiento del Pedido</h3>
                            <div className="p-1 rounded-full group-hover:bg-gray-100 transition-colors">
                                {showTrackOrder ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                            </div>
                        </button>

                        {showTrackOrder && (
                            <div className="mt-4 space-y-3">
                                {statusRoadmap.map((step, index) => (
                                    <div key={step.status} className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${index <= currentStepIndex ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                        <span className={`text-sm ${index <= currentStepIndex ? 'text-white' : 'text-gray-500'}`}>
                                            {step.label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {(canDispute || canApprove || canExpertRespond) && (
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
                                {canExpertRespond && (
                                    <button
                                        onClick={() => setShowExpertResponseModal(true)}
                                        className="flex-1 px-3 py-2 bg-orange-50 border border-orange-200 text-orange-700 text-sm rounded-lg hover:bg-orange-100 font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                                    >
                                        <MessageCircle className="w-4 h-4" />
                                        Responder Disputa
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

                    {/* Clean Support Section */}
                    <div className="p-4">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-medium text-white">�Necesitas ayuda con tu pedido?</p>
                                <p className="text-sm text-gray-500">Estoy aqu� para ti.</p>
                            </div>
                        </div>

                        <button className="w-full mb-6 bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 flex items-center justify-center gap-2 font-medium transition-colors duration-200">
                            <MessageCircle className="w-4 h-4" />
                            Let's Chat
                        </button>

                        <div className="space-y-4">
                            <h4 className="font-semibold text-white">Soporte</h4>

                            {isDisputed && (
                                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 mb-4">
                                    <p className="text-sm text-amber-800 flex items-center gap-3 font-medium">
                                        <div className="w-8 h-8 bg-amber-200 rounded-full flex items-center justify-center">
                                            <AlertTriangle className="w-4 h-4 text-amber-700" />
                                        </div>
                                        Disputa abierta. Un administrador la resolver� pronto.
                                    </p>
                                </div>
                            )}

                            <div className="space-y-3">
                                <button className="flex items-center justify-between w-full text-left p-3 hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                            <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white">Fiverr Pro FAQs</p>
                                            <p className="text-xs text-gray-500">Encuentra respuestas necesarias.</p>
                                        </div>
                                    </div>
                                    <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                                </button>

                                <button className="flex items-center justify-between w-full text-left p-3 hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white">Resolution center</p>
                                            <p className="text-xs text-gray-500">Resuelve problemas del pedido.</p>
                                        </div>
                                    </div>
                                    <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                                </button>
                            </div>

                            {canCancel && (
                                <button
                                    onClick={() => setModalState((prev) => ({ ...prev, showCancelConfirm: true }))}
                                    className="w-full mt-4 bg-gray-100 border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    Cancelar Servicio
                                </button>
                            )}

                            {isAdmin && search?.searchHire && (
                                <button
                                    onClick={() => setModalState((prev) => ({ ...prev, showFinalizeModal: true }))}
                                    className="w-full mt-3 bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 text-sm font-medium transition-colors duration-200"
                                >
                                    Finalizar B�squeda
                                </button>
                            )}

                            {canReview && (
                                <button
                                    onClick={() => setModalState((prev) => ({ ...prev, showReviewModal: true }))}
                                    className="w-full mt-3 bg-yellow-500 text-white py-3 rounded-lg hover:bg-yellow-600 text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                                >
                                    <Star className="w-4 h-4" />
                                    Enviar Rese�a
                                </button>
                            )}
                        </div>

                        {/* Deliverables Section */}
                        {/* Informes del Experto - Secci�n Principal */}
                        <div className="mt-6 pt-6 border-t border-gray-200">
                            <div className="bg-gray-50 p-4 sm:p-6 border border-gray-200">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-600 rounded-full flex items-center justify-center">
                                        <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-base sm:text-lg font-bold text-slate-900">?? Informes del Experto</h3>
                                        <p className="text-xs sm:text-sm text-slate-600">Documentos t�cnicos y an�lisis profesional</p>
                                    </div>
                                </div>

                                {false ? ( // deliverablesQuery.isLoading - datos del hook optimizado
                                    <div className="flex items-center justify-center gap-3 py-8">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                        <p className="text-slate-600 font-medium">Cargando informes del experto...</p>
                                    </div>
                                ) : false ? ( // deliverablesQuery.isError - datos del hook optimizado
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
                                        {false && ( // deliverablesQuery.error - datos del hook optimizado
                                            <p className="text-xs text-red-500 mt-2">Error</p>
                                        )}
                                    </div>
                                ) : deliverables && deliverables.length > 0 ? (
                                    <div className="space-y-3 sm:space-y-4">
                                        <div className="grid gap-3 sm:gap-4">
                                            {deliverables.map((deliverable, index) => (
                                                <div key={index} className="bg-white rounded-lg border border-slate-200 p-3 sm:p-4 hover:shadow-md transition-shadow">
                                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                                                {deliverable.url.endsWith('.mp4') ? (
                                                                    <video className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                                                                ) : (
                                                                    <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                                                                )}
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <h4 className="font-semibold text-slate-900 text-sm sm:text-base">
                                                                    {deliverable.url.endsWith('.mp4') ? `Video del Experto ${index + 1}` : `Informe T�cnico ${index + 1}`}
                                                                </h4>
                                                                <p className="text-xs sm:text-sm text-slate-500">
                                                                    {deliverable.url.endsWith('.mp4') ? 'An�lisis en video' : 'Documento PDF detallado'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {deliverable.url.endsWith('.mp4') ? (
                                                                <video 
                                                                    src={deliverable.url} 
                                                                    controls 
                                                                    className="w-full sm:w-32 h-20 rounded-lg object-cover"
                                                                />
                                                            ) : (
                                                                <a 
                                                                    href={deliverable.url} 
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
                                                    ? {deliverables.length} informe{deliverables.length > 1 ? 's' : ''} disponible{deliverables.length > 1 ? 's' : ''}
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
                                        <p className="text-slate-500 text-xs sm:text-sm">El experto a�n no ha subido informes t�cnicos</p>
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
                                                <div className="w-full p-3 sm:p-4 border-2 border-dashed border-gray-300 bg-gray-50 text-gray-700 cursor-pointer rounded-lg hover:bg-gray-100 transition-colors duration-200 text-center">
                                                    <Upload className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-2" />
                                                    <p className="font-medium text-sm sm:text-base">Subir Informe del Experto</p>
                                                    <p className="text-xs sm:text-sm">PDF o MP4 (m�x. 10MB)</p>
                                                </div>
                                            </label>
                                            <button
                                                onClick={handleUploadDeliverable}
                                                className={`w-full py-2.5 sm:py-3 text-xs sm:text-sm rounded-lg flex items-center justify-center gap-2 font-medium transition-colors duration-200 ${selectedDeliverableFiles.length === 0 || isUploadingDeliverable
                                                    ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                                                    : 'bg-gray-600 hover:bg-gray-700 text-white'
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
            {/* Debug temporal - Informaci�n del servicio */}
            {process.env.NODE_ENV === 'development' && serviceInfo && (
                <div className="fixed top-20 right-4 z-50 bg-blue-100 border border-blue-300 rounded-lg p-3 text-xs max-w-xs">
                    <h4 className="font-bold text-blue-800 mb-2">Debug Servicio:</h4>
                    <div className="space-y-1 text-blue-700">
                        <div className="font-semibold text-blue-800">?? Datos Optimizados:</div>
                        <div>ServiceTypeId: {serviceInfo?.serviceTypeId || 'N/A'}</div>
                        <div>ServiceTypeCategoryId: {serviceInfo?.serviceTypeCategoryId || 'N/A'}</div>
                        <div>ServiceTypeCategoryName: {serviceInfo?.serviceTypeCategoryName || 'N/A'}</div>
                        <div>RequiresAppointment: {serviceInfo?.requiresAppointment ? 'S�' : 'NO'}</div>
                        <div>ServicePrice: �{serviceInfo?.price || 'N/A'}</div>
                        <div className="border-t border-blue-300 pt-1 mt-1">
                            <div>IsAppointmentCategory: {isAppointmentCategory ? 'S�' : 'NO'}</div>
                            <div>HasSearchHire: {hasSearchHire ? 'S�' : 'NO'}</div>
                            <div>NeedsAppointment: {needsAppointment ? 'S�' : 'NO'}</div>
                        </div>
                        <div className="border-t border-blue-300 pt-1 mt-1">
                            <div>HireId: {hireId || 'N/A'}</div>
                            <div>SearchStatus: {search?.searchHire?.status || 'N/A'}</div>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            console.log('Refreshing search data (optimized)...');
                            invalidateAll();
                        }}
                        className="mt-2 w-full bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                    >
                        Refrescar Datos
                    </button>
                    
                    {/* Debug temporal para reseñas */}
                    <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded text-xs">
                        <div className="font-bold text-yellow-800 mb-1">Debug Reseñas:</div>
                        <div>Estado: {search?.searchHire?.status || 'N/A'}</div>
                        <div>Es Cliente: {isClient ? 'Sí' : 'No'}</div>
                        <div>Puede Reseñar: {canReview ? 'Sí' : 'No'}</div>
                        <div>Usuario ID: {userId}</div>
                        <div>Cliente ID: {clientId}</div>
                    </div>
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

            {/* Modal para mostrar informaci�n de distribuci�n de dinero */}
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
                        
                        <h3 className="text-xl font-semibold text-white mb-6">
                            Informaci�n de Distribuci�n de Dinero
                        </h3>

                        <MoneyDistributionInfo
                            config={moneyDistributionConfig as any}
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
                                        const cancelReason = prompt('Raz�n de la cancelaci�n:');
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
                                                invalidateAll(); // appointmentQuery.refetch() - usar invalidaci�n unificada
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
                                    Continuar con Cancelaci�n
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
                searchHireId={search?.searchHire?.id}
                reviewForm={reviewForm}
                setReviewForm={setReviewForm}
                onSubmit={() => {
                    invalidateAll();
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
                    setDisputeFiles([]);
                }}
                disputeReason={disputeReason}
                setDisputeReason={setDisputeReason}
                files={disputeFiles}
                setFiles={setDisputeFiles}
                onSubmit={handleDisputeSubmitAndClose}
                isSubmitting={false}
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
            {/* Modal profesional para respuesta del experto */}
            {showExpertResponseModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 pt-20">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden shadow-xl">
                        {/* Header */}
                        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <MessageCircle className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-semibold text-white">Responder a la Disputa</h2>
                                        <p className="text-sm text-gray-600">Proporciona tu versi�n de los hechos</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowExpertResponseModal(false);
                                        setExpertResponseText('');
                                        setExpertResponseFiles([]);
                                    }}
                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <XCircle className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col lg:flex-row max-h-[calc(80vh-120px)]">
                            {/* Panel izquierdo - Disputa del cliente */}
                            <div className="lg:w-1/2 p-6 border-r border-gray-200 overflow-y-auto">
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                            <AlertTriangle className="w-5 h-5 text-red-500" />
                                            Disputa del Cliente
                                        </h3>
                                        
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                            <p className="text-gray-800 leading-relaxed">
                                                {disputes[0]?.reason || 'No se pudo cargar la raz�n de la disputa'}
                                            </p>
                                        </div>

                                        {/* Archivos del cliente */}
                                        {disputes[0]?.files && disputes[0].files.length > 0 && (
                                            <div className="mt-4">
                                                <h4 className="text-sm font-medium text-gray-700 mb-2">Archivos del cliente:</h4>
                                                <div className="space-y-2">
                                                    {disputes[0].files.map((file, index) => (
                                                        <a
                                                            key={index}
                                                            href={file.fileUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                                                        >
                                                            <FileText className="w-4 h-4 text-blue-600" />
                                                            <span className="text-sm text-blue-800">{file.fileName}</span>
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Informaci�n de la disputa */}
                                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <span className="text-gray-500">Fecha de disputa:</span>
                                                    <p className="font-medium text-white">
                                                        {disputes[0]?.createdAt ? new Date(disputes[0].createdAt).toLocaleDateString('es-ES') : 'N/A'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">Estado:</span>
                                                    <p className="font-medium text-orange-600">Pendiente de respuesta</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Panel derecho - Formulario de respuesta */}
                            <div className="lg:w-1/2 p-6 overflow-y-auto">
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                            <MessageCircle className="w-5 h-5 text-green-500" />
                                            Tu Respuesta
                                        </h3>
                                        
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Explica tu versi�n de los hechos
                                                </label>
                                                <textarea
                                                    value={expertResponseText}
                                                    onChange={(e) => setExpertResponseText(e.target.value)}
                                                    placeholder="Describe detalladamente tu versi�n de los hechos, incluyendo cualquier informaci�n relevante que pueda ayudar a resolver la disputa..."
                                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-colors"
                                                    rows={6}
                                                    maxLength={1000}
                                                />
                                                <div className="flex justify-between items-center mt-1">
                                                    <p className="text-xs text-gray-500">
                                                        S� espec�fico y proporciona detalles relevantes
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {expertResponseText.length}/1000 caracteres
                                                    </p>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Archivos de evidencia (opcional)
                                                </label>
                                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                                                    <input
                                                        type="file"
                                                        multiple
                                                        accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.mp4,.avi,.mov"
                                                        onChange={(e) => {
                                                            const files = Array.from(e.target.files || []);
                                                            setExpertResponseFiles(files);
                                                        }}
                                                        className="hidden"
                                                        id="expert-response-files"
                                                    />
                                                    <label
                                                        htmlFor="expert-response-files"
                                                        className="cursor-pointer flex flex-col items-center gap-3"
                                                    >
                                                        <div className="p-3 bg-orange-100 rounded-full">
                                                            <Upload className="w-6 h-6 text-orange-600" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-700">
                                                                Haz clic para subir archivos
                                                            </p>
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                JPG, PNG, GIF, PDF, DOC, DOCX, MP4, AVI, MOV
                                                            </p>
                                                            <p className="text-xs text-gray-400">
                                                                M�ximo 10MB por archivo
                                                            </p>
                                                        </div>
                                                    </label>
                                                </div>
                                                
                                                {expertResponseFiles.length > 0 && (
                                                    <div className="mt-4">
                                                        <p className="text-sm font-medium text-gray-700 mb-3">Archivos seleccionados:</p>
                                                        <div className="space-y-2">
                                                            {expertResponseFiles.map((file, index) => (
                                                                <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border">
                                                                    <div className="flex items-center gap-3">
                                                                        <FileText className="w-4 h-4 text-gray-500" />
                                                                        <span className="text-sm text-gray-700">{file.name}</span>
                                                                        <span className="text-xs text-gray-500">
                                                                            ({(file.size / 1024 / 1024).toFixed(1)} MB)
                                                                        </span>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => {
                                                                            const newFiles = expertResponseFiles.filter((_, i) => i !== index);
                                                                            setExpertResponseFiles(newFiles);
                                                                        }}
                                                                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                                                    >
                                                                        <XCircle className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Informaci�n importante */}
                                    {disputes[0]?.expertResponseDeadline && (
                                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                                            <div className="flex items-start gap-3">
                                                <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                                                <div>
                                                    <h4 className="text-sm font-medium text-orange-800 mb-1">Tiempo l�mite</h4>
                                                    <p className="text-sm text-orange-700">
                                                        Tienes hasta el <strong>{new Date(disputes[0].expertResponseDeadline).toLocaleDateString('es-ES', {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}</strong> para responder a esta disputa.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <div className="flex items-start gap-3">
                                            <MessageCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                                            <div>
                                                <h4 className="text-sm font-medium text-blue-800 mb-1">Informaci�n importante</h4>
                                                <p className="text-sm text-blue-700">
                                                    Tu respuesta ser� revisada por nuestro equipo de administraci�n. 
                                                    Proporciona informaci�n clara y evidencia relevante para ayudar en la resoluci�n.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer con botones */}
                        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => {
                                        setShowExpertResponseModal(false);
                                        setExpertResponseText('');
                                        setExpertResponseFiles([]);
                                    }}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleExpertResponseSubmit}
                                    disabled={!expertResponseText.trim() || expertResponse.isPending}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center gap-2"
                                >
                                    {expertResponse.isPending ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Enviando...
                                        </>
                                    ) : (
                                        <>
                                            <MessageCircle className="w-4 h-4" />
                                            Enviar Respuesta
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ReportModal
                isOpen={modalState.showReportModal}
                onClose={() => {
                    setModalState((prev) => ({ ...prev, showReportModal: false }));
                    setSelectedAppointment(null);
                }}
                appointment={selectedAppointment}
                onSuccess={() => {
                    invalidateAll(); // appointmentQuery.refetch() - usar invalidaci�n unificada
                    invalidateAll();
                }}
                setNotifications={setNotifications}
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
