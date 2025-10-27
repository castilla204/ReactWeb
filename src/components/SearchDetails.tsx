import { useLayoutEffect, useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ChevronDown, Star, AlertTriangle, MessageCircle, Upload, Share2, ChevronUp, FileText, MessageSquare, Calendar, CheckCircle, DollarSign, User, XCircle, MapPin, Home, Phone, Info } from 'lucide-react';
import { SearchHire } from '../hooks/useSearch.hooks';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../hooks/useChat';
import Chat from './Chat';
import { ReviewModal, DisputeModal, ResolveDisputeModal, AddAdModal, CancelServiceModal, FinalizeModal, ReportModal } from './Modals';
import ExistingReviewCard from './ExistingReviewCard';
import ProfessionalReviewCard from './ProfessionalReviewCard';
import { useSearchActions } from '../hooks/useSearchActions';
import { useDisputes } from '../hooks/useDisputes';
import { Notification, NotificationType } from './Notification';
import { useParams, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

// Imports para el sistema de citas
import { useAppointments } from '../hooks/useAppointments';
import { useAppointmentStatuses, getAppointmentStatusText, getAppointmentStatusColor, getAppointmentStatusIcon } from '../hooks/useAppointmentStatuses';
import AppointmentForm from './AppointmentForm';
import AppointmentStatus from './AppointmentStatus';
import RejectAppointmentModal from './RejectAppointmentModal';
import { Appointment, ProposeAppointmentDto, ConfirmAppointmentDto, RejectAppointmentDto, CancelAppointmentDto } from '../types/appointment';

// Imports para distribución de dinero
import MoneyDistributionInfo from './MoneyDistributionInfo';
import { useMoneyDistributionConfig, shouldShowMoneyDistribution } from '../hooks/useMoneyDistributionConfig';

// ? NUEVOS HOOKS OPTIMIZADOS
import { useSearchDetailsOptimized } from '../hooks/useSearchDetailsOptimized';
import { getAuthToken } from '../lib/auth';
import { API_CONFIG } from '../config/api';

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
    const queryClient = useQueryClient();
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
    const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
    const [fileValidation, setFileValidation] = useState<{canSubmit: boolean, message: string} | null>(null);
    const [showTrackOrder, setShowTrackOrder] = useState(false);
    const lastSearchHireId = useRef<number | null>(null);
    const [activeTab, setActiveTab] = useState<'chat' | 'details'>('chat');

    // Estado para el sistema de citas
    const [showAppointmentForm, setShowAppointmentForm] = useState(false);
    const [appointmentData, setAppointmentData] = useState<any>(null);
    const [timeRemaining, setTimeRemaining] = useState<string>('00:00:00');
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [appointmentToReject, setAppointmentToReject] = useState<Appointment | null>(null);
    const [modalActionType, setModalActionType] = useState<'reject' | 'cancel'>('reject');
    
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

    const { user } = useAuth();

    // ? HOOK OPTIMIZADO - Reemplaza múltiples queries
    const {
        search,
        moneyDistribution,
        category,
        review,
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
    
    // ? DATOS DE EXPERTO DESDE SEARCHHIRE
    const expertInfo = search?.searchHire?.expert;

    // ? HOOKS PARA ACCIONES
    const { uploadDeliverable, isUploadingDeliverable } = useChat(searchId, setNotifications);
    const { handleCancelService, handleForceFinalize, handleCompleteService, handleDisputeSubmit: submitDispute, handleResolveDispute, handleAddAd } =
        useSearchActions(setNotifications);
    
    // Hook para obtener información de disputa
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
    
    // Funciones para los nuevos endpoints de gestión de archivos
    const validateFiles = async (appointmentId: number) => {
        try {
            const response = await fetch(`${API_CONFIG.baseUrl}/api/appointment/validate-files/${appointmentId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${getAuthToken()}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const result = await response.json();
                if (result.isValid) {
                    return { canSubmit: true, message: 'Todos los archivos requeridos están subidos' };
                } else {
                    const missingText = result.missingFiles.join(' y ');
                    return { 
                        canSubmit: false, 
                        message: `Para enviar el reporte necesitas subir: ${missingText}` 
                    };
                }
            } else {
                throw new Error('Error al validar archivos');
            }
        } catch (error) {
            console.error('Error validando archivos:', error);
            return { canSubmit: false, message: 'Error al validar archivos' };
        }
    };

    const getUploadedFiles = async (appointmentId: number) => {
        try {
            const response = await fetch(`${API_CONFIG.baseUrl}/api/appointment/files/${appointmentId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${getAuthToken()}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const result = await response.json();
                return result.files || [];
            } else {
                throw new Error('Error obteniendo archivos');
            }
        } catch (error) {
            console.error('Error obteniendo archivos:', error);
            return [];
        }
    };

    const deleteFile = async (appointmentId: number, deliverableId: number) => {
        try {
            const response = await fetch(`${API_CONFIG.baseUrl}/api/appointment/files/${appointmentId}/${deliverableId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${getAuthToken()}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const result = await response.json();
                return { success: true, message: result.message };
            } else {
                const error = await response.json();
                return { success: false, message: error.message };
            }
        } catch (error) {
            console.error('Error eliminando archivo:', error);
            return { success: false, message: 'Error al eliminar archivo' };
        }
    };

    const submitReportWithFiles = async (appointmentId: number, files: File[], notes: string = '') => {
        try {
            const formData = new FormData();
            
            // Agregar notas si las hay
            if (notes) {
                formData.append('notes', notes);
            }
            
            // Agregar archivos
            if (files && files.length > 0) {
                files.forEach(file => {
                    formData.append('files', file);
                });
            }
            
            const response = await fetch(`${API_CONFIG.baseUrl}/api/appointment/submit-report-with-files/${appointmentId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${getAuthToken()}`
                    // NO incluir Content-Type para FormData
                },
                body: formData
            });
            
            if (response.ok) {
                const result = await response.json();
                return { success: true, appointment: result.appointment };
            } else {
                const error = await response.json();
                return { success: false, message: error.message };
            }
        } catch (error) {
            console.error('Error enviando reporte:', error);
            return { success: false, message: 'Error al enviar reporte' };
        }
    };

    // Cargar archivos existentes y validar cuando cambie la cita
    useEffect(() => {
        if (appointment?.id) {
            loadUploadedFiles();
            validateFilesAndUpdate();
        }
    }, [appointment?.id]);

    // Validar archivos cuando cambien los archivos subidos o seleccionados
    useEffect(() => {
        // Si hay archivos seleccionados, usar validación local
        if (selectedDeliverableFiles.length > 0) {
            validateLocalFiles();
        } else {
            // Si no hay archivos seleccionados, usar validación del servidor
            validateFilesAndUpdate();
        }
    }, [uploadedFiles, selectedDeliverableFiles]);

    const loadUploadedFiles = async () => {
        if (appointment?.id) {
            const files = await getUploadedFiles(appointment.id);
            setUploadedFiles(files);
        }
    };

    const validateFilesAndUpdate = async () => {
        if (appointment?.id) {
            const validation = await validateFiles(appointment.id);
            setFileValidation(validation);
        }
    };

    const validateLocalFiles = () => {
        // Validación local que considera archivos subidos + archivos seleccionados
        const totalFiles = [...uploadedFiles, ...selectedDeliverableFiles];
        
        // Verificar si hay al menos un PDF y un MP4
        const hasPDF = totalFiles.some(file => 
            file.fileName?.toLowerCase().endsWith('.pdf') || 
            file.name?.toLowerCase().endsWith('.pdf')
        );
        const hasMP4 = totalFiles.some(file => 
            file.fileName?.toLowerCase().endsWith('.mp4') || 
            file.name?.toLowerCase().endsWith('.mp4')
        );
        
        if (hasPDF && hasMP4) {
            setFileValidation({ 
                canSubmit: true, 
                message: 'Todos los archivos requeridos están listos' 
            });
            // Limpiar notificaciones de error cuando la validación es exitosa
            setNotifications(prev => prev.filter(notif => 
                !notif.message.includes('Para enviar el reporte necesitas subir')
            ));
        } else {
            const missing = [];
            if (!hasPDF) missing.push('PDF');
            if (!hasMP4) missing.push('MP4');
            setFileValidation({ 
                canSubmit: false, 
                message: `Para enviar el reporte necesitas subir: ${missing.join(' y ')}` 
            });
        }
    };

    const handleDeleteFile = async (deliverableId: number) => {
        if (!appointment?.id) return;
        
        try {
            const result = await deleteFile(appointment.id, deliverableId);
            if (result.success) {
                setNotifications(prev => [...prev, {
                    id: uuidv4(),
                    type: 'success',
                    message: 'Archivo eliminado exitosamente'
                }]);
                // Recargar archivos y validación
                await loadUploadedFiles();
                await validateFilesAndUpdate();
            } else {
                setNotifications(prev => [...prev, {
                    id: uuidv4(),
                    type: 'error',
                    message: result.message
                }]);
            }
        } catch (error) {
            console.error('Error eliminando archivo:', error);
            setNotifications(prev => [...prev, {
                id: uuidv4(),
                type: 'error',
                message: 'Error al eliminar archivo'
            }]);
        }
    };

    // Funciones para manejar deliverables
    const handleDeliverableFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files ? Array.from(e.target.files) : [];
        const maxDeliverableFileSize = 10 * 1024 * 1024; // 10MB según endpoint
        const validFiles = files.filter((file) => {
            const extension = file.name.split('.').pop()?.toLowerCase();
            const isValidType = ['pdf', 'mp4'].includes(extension || '');
            const isValidSize = file.size <= maxDeliverableFileSize;
            return isValidType && isValidSize;
        });
        console.log('[SearchDetails] Selected deliverable files:', validFiles.map((f) => ({ name: f.name, size: f.size })));
        if (validFiles.length > 0) {
            setNotifications(prev => [...prev, {
                id: uuidv4(),
                type: 'success',
                message: `${validFiles.length} archivo(s) seleccionado(s) correctamente`
            }]);
        }
        setSelectedDeliverableFiles(prev => [...prev, ...validFiles]);
        
        // Limpiar el input para permitir seleccionar los mismos archivos otra vez
        e.target.value = '';
    };

    const handleUploadDeliverable = async () => {
        if (selectedDeliverableFiles.length > 0 && search?.searchHire?.id) {
            console.log('[SearchDetails] Uploading deliverables:', selectedDeliverableFiles.map((f) => ({ name: f.name, size: f.size })));
            
            try {
                const formData = new FormData();
                selectedDeliverableFiles.forEach(file => {
                    formData.append('Files', file);
                });

                const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.chat.deliverable(search.searchHire.id)}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${getAuthToken()}`
                    },
                    body: formData
                });

                if (response.ok) {
                    setNotifications(prev => [...prev, {
                        id: uuidv4(),
                        type: 'success',
                        message: 'Archivos subidos exitosamente. Ahora puedes enviar el reporte.'
                    }]);
                    // No limpiar archivos aquí, se limpiarán al enviar el reporte
                    invalidateAll();
                } else {
                    throw new Error('Error al subir archivos');
                }
            } catch (error) {
                console.error('[SearchDetails] Error uploading deliverables:', error);
                setNotifications(prev => [...prev, {
                    id: uuidv4(),
                    type: 'error',
                    message: 'Error al subir los archivos'
                }]);
            }
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

    const removeSelectedFile = (index: number) => {
        setSelectedDeliverableFiles(prev => prev.filter((_, i) => i !== index));
        // La validación se ejecutará automáticamente por el useEffect
    };

    const handleDisputeSubmit = async () => {
        if (!search?.searchHire?.id) {
            setNotifications(prev => [...prev, {
                id: uuidv4(),
                type: 'error',
                message: 'No se encontró el ID del servicio'
            }]);
            return;
        }

        if (!disputeReason.trim()) {
            setNotifications(prev => [...prev, {
                id: uuidv4(),
                type: 'error',
                message: 'Por favor, describe el motivo de la disputa'
            }]);
            return;
        }

        try {
            await submitDispute(
                search.searchHire.id, 
                disputeReason, 
                disputeFiles,
                () => {
                    // Callback de éxito
                    setNotifications(prev => [...prev, {
                        id: uuidv4(),
                        type: 'success',
                        message: 'Disputa enviada exitosamente'
                    }]);
                    // Limpiar el formulario
                    setDisputeReason('');
                    setDisputeFiles([]);
                    // Cerrar el modal
                    setModalState((prev) => ({ ...prev, showDisputeModal: false }));
                    // Refrescar datos
                    invalidateAll();
                }
            );
        } catch (error) {
            console.error('Error enviando disputa:', error);
            setNotifications(prev => [...prev, {
                id: uuidv4(),
                type: 'error',
                message: 'Error al enviar la disputa'
            }]);
        }
    };

    const handleSubmitReport = async () => {
        if (!appointment?.id) {
            setNotifications(prev => [...prev, {
                id: uuidv4(),
                type: 'error',
                message: 'No se encontró el ID de la cita'
            }]);
            return;
        }

        try {
            // Usar el endpoint unificado que maneja todo: subida + validación + envío
            console.log('[SearchDetails] Enviando reporte con archivos usando endpoint unificado...');
            const result = await submitReportWithFiles(appointment.id, selectedDeliverableFiles, 'Reporte completado por el experto');
            
            if (result.success) {
                setNotifications(prev => [...prev, {
                    id: uuidv4(),
                    type: 'success',
                    message: 'Reporte enviado exitosamente'
                }]);
                // Limpiar archivos seleccionados
                setSelectedDeliverableFiles([]);
                // Refrescar datos
                invalidateAll();
            } else {
                setNotifications(prev => [...prev, {
                    id: uuidv4(),
                    type: 'error',
                    message: result.message
                }]);
            }
        } catch (error) {
            console.error('[SearchDetails] Error submitting report:', error);
            setNotifications(prev => [...prev, {
                id: uuidv4(),
                type: 'error',
                message: 'Error al enviar el reporte'
            }]);
        }
    };

    const handleApproveService = async () => {
        await handleCompleteService(search?.searchHire?.id, () => {
            invalidateAll();
        });
    };
    
    // ✅ HOOK DINÁMICO PARA ESTADOS
    const { data: appointmentStatuses } = useAppointmentStatuses();
    
    // Variables para el estado de la cita
    const statusText = appointmentStatuses ? getAppointmentStatusText(appointment?.status || '', appointmentStatuses) : appointment?.status || '';
    const statusColor = appointmentStatuses ? getAppointmentStatusColor(appointment?.status || '', appointmentStatuses) : 'gray';
    
    // Función para obtener el icono del estado
    const getStatusIcon = (status: string) => {
        if (!appointmentStatuses) return <AlertTriangle className="w-5 h-5 text-gray-600" />;
        
        const iconName = getAppointmentStatusIcon(status, appointmentStatuses);
        
        switch (iconName) {
            case 'check-circle':
                return <CheckCircle className="w-5 h-5 text-green-600" />;
            case 'x-circle':
                return <XCircle className="w-5 h-5 text-red-600" />;
            case 'clock':
                return <Calendar className="w-5 h-5 text-blue-600" />;
            case 'timer':
                return <Calendar className="w-5 h-5 text-orange-600" />;
            case 'alert-triangle':
                return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
            default:
                return <AlertTriangle className="w-5 h-5 text-gray-600" />;
        }
    };
    
    // ? USAR HOOK ESPECÍFICO PARA DISTRIBUCIÓN DE DINERO
    const { 
        data: moneyDistributionConfig, 
        isLoading: isLoadingMoneyConfig, 
        error: moneyConfigError 
    } = useMoneyDistributionConfig(
        appointment?.status || '', 
        serviceInfo?.categoryId, 
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
        const searchHire: SearchHire | undefined = search?.searchHire;
        if (!searchHire?.createdAt) return '00:00:00';
        
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
        if (needsAppointment && !appointment) {
            const updateTimer = () => {
                setTimeRemaining(calculateTimeRemaining());
            };
            
            updateTimer();
            const interval = setInterval(updateTimer, 1000);
            
            return () => clearInterval(interval);
        }
    }, [needsAppointment, appointment, search?.searchHire?.createdAt]);

    const userId = Number(user?.id) || 0;
    const clientId = Number(search?.userId ?? 0);
    const expertId = Number(search?.searchHire?.expertId ?? search?.searchHire?.expert?.id ?? 0);

    const isClient = userId === clientId;
    const isExpert = userId === expertId || (search?.searchHire?.expert?.id && userId === Number(search.searchHire.expert.id));
    const userRole = isClient ? 'client' : 'expert';
    
    const isDisputeExpert = userId === Number(disputes[0]?.expert?.id ?? search?.searchHire?.expert?.id ?? 0);
    
    // ✅ Usar la información de review del endpoint details-complete
    const hasReviewed = !!review;
    const canReview =
        isClient && search?.searchHire && ['completed', 'dispute-resolved'].includes(search.searchHire.status) && !hasReviewed;
    
    const canDispute = isClient && search?.searchHire?.status === 'awaiting_client_decision';
    const canApprove = isClient && search?.searchHire?.status === 'awaiting_client_decision';
    const canCancel = isExpert && search?.searchHire && !['completed', 'canceled', 'disputed'].includes(search.searchHire.status);
    const isDisputed = (isClient || isExpert) && search?.searchHire?.status === 'disputed';
    const isDisputeResolved = (isClient || isExpert) && search?.searchHire?.status === 'dispute-resolved';
    
    // Determinar si el experto puede responder a la disputa
    const canExpertRespond = disputes[0]?.canExpertRespond !== undefined 
        ? disputes[0].canExpertRespond 
        : (isDisputeExpert && 
           disputes[0]?.status === 'pending' && 
           !disputes[0]?.expertResponse &&
           search?.searchHire?.status === 'disputed');
    
    // Validación más robusta para el chat
    const canViewChat = (isClient || isExpert || isAdmin) && !!search?.searchHire && !!search?.searchHire?.id;

    // ✅ Usar categoría del endpoint details-complete
    const categoryName = category?.name || 'Unknown Category';

    // Función para verificar si se puede proponer una cita
    const canProposeAppointment = () => {
        if (appointment) {
            const validAppointmentStatuses = appointmentStatuses && Array.isArray(appointmentStatuses)
                ? appointmentStatuses
                    .filter((s: any) => s.statusValue === 'awaiting_appointment' || 
                                s.statusValue === 'appointment_rejected' || 
                                s.statusValue === 'appointment_cancelled_by_client' ||
                                s.statusValue === 'appointment_cancelled_by_expert')
                    .map((s: any) => s.statusValue)
                : ['awaiting_appointment', 'appointment_rejected', 'appointment_cancelled_by_client', 'appointment_cancelled_by_expert'];
            const canPropose = validAppointmentStatuses.includes(appointment.status);
            return canPropose;
        }
        
        const validHireStatuses = ['pending'];
        const currentHireStatus = search?.searchHire?.status;
        const canPropose = currentHireStatus ? validHireStatuses.includes(currentHireStatus) : false;
        return canPropose;
    };

    // Función para manejar la confirmación del rechazo desde el modal
    const handleRejectConfirm = async (reason: string) => {
        if (!appointmentToReject) return;
        
        try {
            if (modalActionType === 'cancel') {
                const cancelData: CancelAppointmentDto = {
                    appointmentId: appointmentToReject.id,
                    reason: reason
                };
                
                await cancelAppointment(cancelData);
                
                setNotifications(prev => [...prev, {
                    id: uuidv4(),
                    type: 'success',
                    message: 'Cita cancelada exitosamente'
                }]);
            } else {
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
            }
            
            setShowRejectModal(false);
            setAppointmentToReject(null);
            invalidateAll();
            
        } catch (error) {
            console.error(`Error al ${modalActionType === 'cancel' ? 'cancelar' : 'rechazar'} cita:`, error);
            setNotifications(prev => [...prev, {
                id: uuidv4(),
                type: 'error',
                message: `Error al ${modalActionType === 'cancel' ? 'cancelar' : 'rechazar'} la cita`
            }]);
        }
    };

    // Funciones para manejar acciones de citas
    const handleAppointmentAction = async (action: string, appointment: Appointment) => {
        console.log('[SearchDetails] handleAppointmentAction called:', { action, appointmentId: appointment.id, appointment });
        try {
            switch (action) {
                case 'propose':
                    setAppointmentData(appointment);
                    setShowAppointmentForm(true);
                    break;
                    
                case 'confirm':
                    console.log('[SearchDetails] Confirming appointment:', appointment.id);
                    const confirmData: ConfirmAppointmentDto = {
                        appointmentId: appointment.id,
                        notes: 'Cita confirmada'
                    };
                    console.log('[SearchDetails] Sending confirm data:', confirmData);
                    await confirmAppointment(confirmData);
                    console.log('[SearchDetails] Appointment confirmed successfully');
                    setNotifications(prev => [...prev, {
                        id: uuidv4(),
                        type: 'success',
                        message: 'Cita confirmada exitosamente'
                    }]);
                    invalidateAll();
                    break;
                    
                case 'reject':
                        setAppointmentToReject(appointment);
                    setModalActionType('reject');
                        setShowRejectModal(true);
                    break;
                    
                case 'cancel':
                        setAppointmentToReject(appointment);
                    setModalActionType('cancel');
                        setShowRejectModal(true);
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
                if (!canProposeAppointment()) {
                    const currentHireStatus = search?.searchHire?.status;
                    const currentAppointmentStatus = appointment?.status;
                    
                    let errorMessage = 'No se puede proponer cita.';
                    if (appointment) {
                        errorMessage += ` Estado de cita actual: ${currentAppointmentStatus}. Estados válidos: ${appointmentStatuses ? appointmentStatuses.filter((s: any) => s.statusValue === 'awaiting_appointment' || s.statusValue === 'appointment_rejected' || s.statusValue === 'appointment_cancelled_by_client' || s.statusValue === 'appointment_cancelled_by_expert').map((s: any) => s.displayName).join(', ') : 'awaiting_appointment, appointment_rejected, appointment_cancelled_by_client, appointment_cancelled_by_expert'}`;
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
                invalidateAll();
                setShowAppointmentForm(false);
                setAppointmentData(null);
            }
        } catch (error: any) {
            console.error('Error al proponer cita:', error);
            
            let errorMessage = 'Error al proponer cita';
            
            if (error && typeof error === 'object') {
                if (error.message) {
                    if (error.message.includes('fuera del rango') || 
                        error.message.includes('Distancia:') || 
                        error.message.includes('Rango máximo:')) {
                        errorMessage = error.message;
                    } else if (error.message.includes('24 horas') || error.message.includes('12 horas')) {
                        errorMessage = 'La cita debe ser al menos 24 horas en el futuro';
                    } else if (error.message.includes('fecha')) {
                        errorMessage = 'La fecha seleccionada no es válida';
                    } else if (error.message.includes('ubicación')) {
                        errorMessage = 'Debes seleccionar una ubicación válida';
                    } else if (error.message.includes('tiempo')) {
                        errorMessage = 'El tiempo seleccionado no es válido';
                    } else {
                        errorMessage = error.message;
                    }
                }
            }
            
            setNotifications(prev => [...prev, {
                id: uuidv4(),
                type: 'error',
                message: errorMessage
            }]);
        }
    };

    const currentStatus = search?.searchHire?.status || 'pending';

    // Only show loading for critical queries
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-white text-black">
                <p className="text-lg">Cargando...</p>
            </div>
        );
    }

    // Only show error for critical failures
    if (isError) {
        return (
            <div className="flex items-center justify-center h-screen bg-white text-black">
                <p className="text-lg text-red-400">Error al cargar los datos</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
                <div className="px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={onBack || (() => navigate('/busquedas'))}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5 text-gray-600" />
                            </button>
                            <div>
                                <h1 className="text-xl font-semibold text-gray-900">
                                    {search?.title || 'Cargando...'}
                                </h1>
                                <p className="text-sm text-gray-500">
                                    {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <Share2 className="w-5 h-5 text-gray-600" />
                            </button>
                            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <MessageCircle className="w-5 h-5 text-gray-600" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Layout */}
            <div className="flex h-[calc(100vh-80px)]">
                {/* Chat Section */}
                {canViewChat && (
                    <div className="flex-1 lg:w-2/3 bg-white flex flex-col">
                        {/* Mobile Tabs */}
                        <div className="lg:hidden border-b border-gray-200 bg-white">
                            <nav className="flex">
                                <button
                                    onClick={() => setActiveTab('chat')}
                                    className={`flex-1 py-4 px-6 text-sm font-medium transition-colors border-b-2 ${
                                        activeTab === 'chat'
                                            ? 'text-blue-600 border-blue-600 bg-blue-50' 
                                            : 'text-gray-600 border-transparent hover:text-gray-800 hover:bg-gray-50'
                                    }`}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                    <MessageSquare className="w-4 h-4" />
                                    Chat
                                    </div>
                                </button>
                                <button
                                    onClick={() => setActiveTab('details')}
                                    className={`flex-1 py-4 px-6 text-sm font-medium transition-colors border-b-2 ${
                                        activeTab === 'details'
                                            ? 'text-blue-600 border-blue-600 bg-blue-50' 
                                            : 'text-gray-600 border-transparent hover:text-gray-800 hover:bg-gray-50'
                                    }`}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    Detalles
                                    </div>
                                </button>
                            </nav>
                        </div>

                        {/* Chat Content */}
                        {(activeTab === 'chat' || !activeTab) && (
                            <div className="h-[calc(100vh-200px)] lg:h-[calc(100vh-140px)]">
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
                                
                        {/* Details Content - Mobile */}
                                {activeTab === 'details' && (
                            <div className="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-4">
                                {/* Service Info */}
                                <div className="bg-white border border-gray-200 rounded-lg p-4">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Información del Servicio</h3>
                                    <div className="space-y-2">
                                                    <div className="flex justify-between">
                                            <span className="text-gray-600">Categoría:</span>
                                            <span className="font-medium">{serviceInfo?.categoryName}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                            <span className="text-gray-600">Precio:</span>
                                            <span className="font-medium">€{serviceInfo?.price}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                            <span className="text-gray-600">Estado:</span>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                currentStatus === 'completed' ? 'bg-green-100 text-green-800' :
                                                currentStatus === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                                currentStatus === 'awaiting_client_decision' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'
                                            }`}>
                                                {currentStatus === 'completed' ? 'Completado' :
                                                currentStatus === 'in_progress' ? 'En progreso' :
                                                currentStatus === 'awaiting_client_decision' ? 'En revisión' : 'Pendiente'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                {/* Expert Info */}
                                {expertInfo && (
                                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Experto</h3>
                                        <div className="flex items-center gap-3">
                                            {isClient ? (
                                            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                                                {expertInfo.name?.charAt(0)}
                                                        </div>
                                            ) : (
                                                expertInfo.profilePictureUrl ? (
                                                    <img 
                                                        src={expertInfo.profilePictureUrl} 
                                                        alt={expertInfo.name}
                                                        className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                                                    />
                                                ) : (
                                                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                                                        {expertInfo.name?.charAt(0)}
                                                    </div>
                                                )
                                            )}
                                                        <div>
                                                <h4 className="font-medium text-gray-900">{expertInfo.name}</h4>
                                                <p className="text-sm text-gray-600">Experto verificado</p>
                                                        </div>
                                                    </div>
                                                        </div>
                                                    )}

                                {/* Appointment Section */}
                                {appointment && (
                                    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
                                        {/* Header con estado - Minimalista */}
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center space-x-2">
                                                {getStatusIcon(appointment.status)}
                                                <h3 className="text-lg font-semibold text-gray-900">Cita Programada</h3>
                                            </div>
                                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-${statusColor}-100 text-${statusColor}-800`}>
                                                {statusText}
                                            </span>
                                        </div>
                                        
                                        {/* Appointment Details */}
                                        <div className="space-y-3">
                                            <div className="flex items-center space-x-3">
                                                <Calendar className="w-5 h-5 text-blue-600" />
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {new Date(appointment.proposedDate).toLocaleDateString('es-ES', {
                                                            weekday: 'long',
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        })}
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        {appointment.proposedTime}
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            {appointment.location && (
                                                <div className="flex items-center space-x-3">
                                                    <MapPin className="w-5 h-5 text-green-600" />
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">Ubicación</p>
                                                        <p className="text-sm text-gray-600">{appointment.location}</p>
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {appointment.doorNumber && (
                                                <div className="flex items-center space-x-3">
                                                    <Home className="w-5 h-5 text-purple-600" />
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">Puerta</p>
                                                        <p className="text-sm text-gray-600">{appointment.doorNumber}</p>
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {appointment.phoneNumber && (
                                                <div className="flex items-center space-x-3">
                                                    <Phone className="w-5 h-5 text-orange-600" />
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">Teléfono</p>
                                                        <p className="text-sm text-gray-600">{appointment.phoneNumber}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex flex-wrap gap-2 pt-3">
                                            {userRole === 'expert' && appointment.status === 'appointment_proposed' && (
                                                <>
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            handleAppointmentAction('confirm', appointment);
                                                        }}
                                                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm"
                                                    >
                                                        Confirmar
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            setAppointmentToReject(appointment);
                                                    setModalActionType('reject');
                                                    setShowRejectModal(true);
                                                        }}
                                                        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors text-sm"
                                                    >
                                                        Rechazar
                                                    </button>
                                                </>
                                            )}
                                            
                                            {appointment.status === 'appointment_confirmed' && (
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setAppointmentToReject(appointment);
                                                    setModalActionType('cancel');
                                                    setShowRejectModal(true);
                                                    }}
                                                    className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors text-sm"
                                                >
                                                    Cancelar Cita
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                                
                                {/* Propose Appointment Button - Mobile */}
                                {isClient && (canProposeAppointment() || (appointment && appointment.status === 'appointment_cancelled_by_expert')) && (
                                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4 mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                                                <Calendar className="w-5 h-5 text-white" />
                                                </div>
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-gray-900 text-sm">
                                                    {appointment && appointment.status === 'appointment_cancelled_by_expert' 
                                                        ? '¿Nueva cita?' 
                                                        : '¿Programar cita?'
                                                    }
                                                </h4>
                                                <p className="text-gray-600 text-xs mt-1">
                                                    {appointment && appointment.status === 'appointment_cancelled_by_expert'
                                                        ? 'El experto canceló. Proponer nueva fecha.'
                                                        : 'Servicio requiere cita presencial.'
                                                    }
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => handleAppointmentAction('propose', { 
                                                        id: 0, 
                                                        searchHireId: search?.searchHire?.id || 0,
                                                        status: 'awaiting_appointment',
                                                        amount: serviceInfo?.price || 0
                                                    } as Appointment)}
                                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                                                >
                                                <Calendar className="w-4 h-4" />
                                                Proponer
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                {/* Money Distribution */}
                                {appointment && shouldShowMoneyDistribution(moneyDistributionConfig, appointment.status, appointmentStatuses) && (
                                    <MoneyDistributionInfo 
                                        config={moneyDistributionConfig}
                                        status={appointment.status}
                                        isLoading={isLoadingMoneyConfig}
                                        error={moneyConfigError}
                                    />
                                )}

                                {/* Action Buttons - Mobile - Approve/Dispute */}
                                {(canDispute || canApprove || canExpertRespond) && (
                                    <div className="space-y-2">
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
                                                <button
                                                    onClick={() => setShowExpertResponseModal(true)}
                                                    className="flex-1 px-3 py-2 bg-orange-50 border border-orange-200 text-orange-700 text-sm rounded-lg hover:bg-orange-100 font-medium transition-colors duration-200 flex items-center justify-center gap-1.5"
                                                >
                                                    <MessageCircle className="w-4 h-4" />
                                                    Responder Disputa
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
                                    </div>
                                )}

                                {/* Deliverables Upload - Mobile - Solo para expertos cuando está esperando reporte */}
                                {isExpert && appointment?.status === 'appointment_awaiting_report' && (
                                    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                            <Upload className="w-5 h-5 text-blue-600" />
                                            Subir Informe del Experto
                                        </h3>
                                        
                                        {/* Validación de archivos */}
                                        {fileValidation && (
                                            <div className={`mb-4 p-3 rounded-lg border ${
                                                fileValidation.canSubmit 
                                                    ? 'bg-green-50 border-green-200 text-green-800' 
                                                    : 'bg-blue-50 border-blue-200 text-blue-800'
                                            }`}>
                                                <div className="flex items-center gap-2">
                                                    {fileValidation.canSubmit ? (
                                                        <CheckCircle className="w-4 h-4" />
                                                    ) : (
                                                        <Info className="w-4 h-4" />
                                                    )}
                                                    <span className="text-sm font-medium">{fileValidation.message}</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Archivos ya subidos */}
                                        {uploadedFiles.length > 0 && (
                                            <div className="mb-4">
                                                <h4 className="text-sm font-medium text-gray-700 mb-2">Archivos Subidos:</h4>
                                                <div className="space-y-2">
                                                    {uploadedFiles.map((file) => (
                                                        <div key={file.id} className="flex items-center justify-between bg-gray-50 p-2 rounded border">
                                                            <div className="flex items-center gap-2">
                                                                <FileText className="w-4 h-4 text-gray-500" />
                                                                <span className="text-sm text-gray-600">{file.fileName}</span>
                                                                <span className="text-xs text-gray-500">({file.fileType})</span>
                                                            </div>
                                                            <button 
                                                                onClick={() => handleDeleteFile(file.id)}
                                                                className="text-red-600 hover:text-red-800 text-xs font-medium"
                                                            >
                                                                Eliminar
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-3">
                                            <label className="block">
                                                <input
                                                    type="file"
                                                    multiple
                                                    accept=".pdf,.mp4"
                                                    onChange={handleDeliverableFileChange}
                                                    className="hidden"
                                                />
                                                <div className="w-full p-4 border-2 border-dashed border-blue-300 bg-blue-50 text-blue-700 cursor-pointer rounded-lg hover:bg-blue-100 transition-colors text-center">
                                                    <Upload className="w-6 h-6 mx-auto mb-2" />
                                                    <p className="font-medium text-sm">Seleccionar archivos</p>
                                                    <p className="text-xs">PDF o MP4 (máx. 10MB)</p>
                                                </div>
                                            </label>
                                            {selectedDeliverableFiles.length > 0 && (
                                                <div className="space-y-2">
                                                    <p className="text-sm font-medium text-gray-700">Archivos seleccionados:</p>
                                            {selectedDeliverableFiles.map((file, index) => (
                                                <div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="w-4 h-4 text-gray-500" />
                                                        <span className="text-sm text-gray-600">{file.name}</span>
                                                        <span className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(1)}MB</span>
                                                    </div>
                                                    <button 
                                                        onClick={() => removeSelectedFile(index)}
                                                        className="text-red-600 hover:text-red-800 text-xs font-medium"
                                                    >
                                                        Eliminar
                                                    </button>
                                                </div>
                                            ))}
                                                </div>
                                            )}
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={handleSubmitReport}
                                                    className={`flex-1 py-3 text-sm rounded-lg flex items-center justify-center gap-2 font-medium transition-colors ${
                                                        fileValidation && !fileValidation.canSubmit
                                                            ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                                                            : 'bg-green-600 hover:bg-green-700 text-white'
                                                    }`}
                                                    disabled={fileValidation ? !fileValidation.canSubmit : false}
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                    Enviar Reporte
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Review Button - Mobile */}
                                {canReview && (
                                    <div className="mt-4">
                                        <button
                                            onClick={() => setModalState((prev) => ({ ...prev, showReviewModal: true }))}
                                            className="w-full px-3 py-2 bg-blue-50 border border-blue-200 text-blue-700 text-sm rounded-lg hover:bg-blue-100 font-medium transition-colors duration-200 flex items-center justify-center gap-1.5"
                                        >
                                            <Star className="w-4 h-4" />
                                            Enviar Reseña
                                        </button>
                                    </div>
                                )}
                                    </div>
                                        )}
                                    </div>
                                )}

                {/* Sidebar - Desktop Only */}
                <aside className="hidden lg:flex lg:w-1/3 bg-white border-l border-gray-200 flex-col">
                    <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 pb-6">
                    <div className="p-6 space-y-6">
                        {/* Service Details */}
                                <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Detalles</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Categoría:</span>
                                    <span className="font-medium">{serviceInfo?.categoryName}</span>
                                        </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Precio:</span>
                                    <span className="font-medium">€{serviceInfo?.price}</span>
                                    </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Estado:</span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        currentStatus === 'completed' ? 'bg-green-100 text-green-800' :
                                        currentStatus === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                        currentStatus === 'awaiting_client_decision' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'
                                    }`}>
                                        {currentStatus === 'completed' ? 'Completado' :
                                        currentStatus === 'in_progress' ? 'En progreso' :
                                        currentStatus === 'awaiting_client_decision' ? 'En revisión' : 'Pendiente'}
                                </span>
                            </div>
                                </div>
                            </div>
                            
                        {/* Expert Info */}
                        {expertInfo && (
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Experto</h3>
                                    <div className="flex items-center gap-3">
                                    {isClient ? (
                                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                                        {expertInfo.name?.charAt(0)}
                                        </div>
                                    ) : (
                                        expertInfo.profilePictureUrl ? (
                                            <img 
                                                src={expertInfo.profilePictureUrl} 
                                                alt={expertInfo.name}
                                                className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                                                {expertInfo.name?.charAt(0)}
                                            </div>
                                        )
                                    )}
                                        <div>
                                        <h4 className="font-medium text-gray-900">{expertInfo.name}</h4>
                                        <p className="text-sm text-gray-600">Experto verificado</p>
                                        </div>
                                    </div>
                                        </div>
                        )}

                        {/* Appointment Info - Desktop */}
                        {appointment && (
                            <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                {/* Header con estado - Minimalista */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center space-x-2">
                                        {getStatusIcon(appointment.status)}
                                        <h3 className="text-lg font-semibold text-gray-900">Cita</h3>
                                    </div>
                                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-${statusColor}-100 text-${statusColor}-800`}>
                                        {statusText}
                                    </span>
                                </div>
                                
                                {/* Appointment Details */}
                                <div className="space-y-3">
                                    <div className="flex items-center space-x-3">
                                        <Calendar className="w-5 h-5 text-blue-600" />
                                    <div>
                                            <p className="text-sm font-medium text-gray-900">
                                                {new Date(appointment.proposedDate).toLocaleDateString('es-ES', {
                                                    weekday: 'long',
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                {appointment.proposedTime}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    {appointment.location && (
                                        <div className="flex items-center space-x-3">
                                            <MapPin className="w-5 h-5 text-green-600" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">Ubicación</p>
                                                <p className="text-sm text-gray-600">{appointment.location}</p>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {appointment.doorNumber && (
                                        <div className="flex items-center space-x-3">
                                            <Home className="w-5 h-5 text-purple-600" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">Puerta</p>
                                                <p className="text-sm text-gray-600">{appointment.doorNumber}</p>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {appointment.phoneNumber && (
                                        <div className="flex items-center space-x-3">
                                            <Phone className="w-5 h-5 text-orange-600" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">Teléfono</p>
                                                <p className="text-sm text-gray-600">{appointment.phoneNumber}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-wrap gap-2 pt-3">
                                    {userRole === 'expert' && appointment.status === 'appointment_proposed' && (
                                        <>
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleAppointmentAction('confirm', appointment);
                                                }}
                                                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm"
                                            >
                                                Confirmar
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setAppointmentToReject(appointment);
                                            setModalActionType('reject');
                                            setShowRejectModal(true);
                                                }}
                                                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors text-sm"
                                            >
                                                Rechazar
                                            </button>
                                        </>
                                    )}
                                    
                                    {appointment.status === 'appointment_confirmed' && (
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setAppointmentToReject(appointment);
                                            setModalActionType('cancel');
                                            setShowRejectModal(true);
                                            }}
                                            className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors text-sm"
                                        >
                                            Cancelar Cita
                                        </button>
                                    )}
                                </div>
                                    </div>
                                )}

                        {/* Propose Appointment Button - Desktop */}
                        {isClient && (canProposeAppointment() || (appointment && appointment.status === 'appointment_cancelled_by_expert')) && (
                            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4 mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                                        <Calendar className="w-5 h-5 text-white" />
                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-gray-900 text-sm">
                                            {appointment && appointment.status === 'appointment_cancelled_by_expert' 
                                                ? '¿Nueva cita?' 
                                                : '¿Programar cita?'
                                            }
                                        </h4>
                                        <p className="text-gray-600 text-xs mt-1">
                                            {appointment && appointment.status === 'appointment_cancelled_by_expert'
                                                ? 'El experto canceló. Proponer nueva fecha.'
                                                : 'Servicio requiere cita presencial.'
                                            }
                                        </p>
                </div>
                                    <button
                                        onClick={() => handleAppointmentAction('propose', { 
                                            id: 0, 
                                            searchHireId: search?.searchHire?.id || 0,
                                            status: 'awaiting_appointment',
                                            amount: serviceInfo?.price || 0
                                        } as Appointment)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                                    >
                                        <Calendar className="w-4 h-4" />
                                        Proponer
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Deliverables Upload - Desktop - Solo para expertos cuando está esperando reporte */}
                        {isExpert && appointment?.status === 'appointment_awaiting_report' && (
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <Upload className="w-5 h-5 text-blue-600" />
                                    Subir Informe del Experto
                                </h3>
                                
                                {/* Validación de archivos */}
                                {fileValidation && (
                                    <div className={`mb-4 p-3 rounded-lg border ${
                                        fileValidation.canSubmit 
                                            ? 'bg-green-50 border-green-200 text-green-800' 
                                            : 'bg-blue-50 border-blue-200 text-blue-800'
                                    }`}>
                                        <div className="flex items-center gap-2">
                                            {fileValidation.canSubmit ? (
                                                <CheckCircle className="w-4 h-4" />
                                            ) : (
                                                <Info className="w-4 h-4" />
                                            )}
                                            <span className="text-sm font-medium">{fileValidation.message}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Archivos ya subidos */}
                                {uploadedFiles.length > 0 && (
                                    <div className="mb-4">
                                        <h4 className="text-sm font-medium text-gray-700 mb-2">Archivos Subidos:</h4>
                                        <div className="space-y-2">
                                            {uploadedFiles.map((file) => (
                                                <div key={file.id} className="flex items-center justify-between bg-white p-2 rounded border">
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="w-4 h-4 text-gray-500" />
                                                        <span className="text-sm text-gray-600">{file.fileName}</span>
                                                        <span className="text-xs text-gray-500">({file.fileType})</span>
                                                    </div>
                                                    <button 
                                                        onClick={() => handleDeleteFile(file.id)}
                                                        className="text-red-600 hover:text-red-800 text-xs font-medium"
                                                    >
                                                        Eliminar
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-3">
                                    <label className="block">
                                        <input
                                            type="file"
                                            multiple
                                            accept=".pdf,.mp4"
                                            onChange={handleDeliverableFileChange}
                                            className="hidden"
                                        />
                                        <div className="w-full p-4 border-2 border-dashed border-blue-300 bg-blue-50 text-blue-700 cursor-pointer rounded-lg hover:bg-blue-100 transition-colors text-center">
                                            <Upload className="w-6 h-6 mx-auto mb-2" />
                                            <p className="font-medium text-sm">Seleccionar archivos</p>
                                            <p className="text-xs">PDF o MP4 (máx. 10MB)</p>
                                        </div>
                                    </label>
                                    {selectedDeliverableFiles.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-sm font-medium text-gray-700">Archivos seleccionados:</p>
                                            {selectedDeliverableFiles.map((file, index) => (
                                                <div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="w-4 h-4 text-gray-500" />
                                                        <span className="text-sm text-gray-600">{file.name}</span>
                                                        <span className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(1)}MB</span>
                                                    </div>
                                                    <button 
                                                        onClick={() => removeSelectedFile(index)}
                                                        className="text-red-600 hover:text-red-800 text-xs font-medium"
                                                    >
                                                        Eliminar
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleSubmitReport}
                                            className={`flex-1 py-3 text-sm rounded-lg flex items-center justify-center gap-2 font-medium transition-colors ${
                                                fileValidation && !fileValidation.canSubmit
                                                    ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                                                    : 'bg-green-600 hover:bg-green-700 text-white'
                                            }`}
                                            disabled={fileValidation ? !fileValidation.canSubmit : false}
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                            Enviar Reporte
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons - Desktop - Approve/Dispute */}
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

                        {/* Review Button - Desktop */}
                        {canReview && (
                            <div className="mt-4">
                                <button
                                    onClick={() => setModalState((prev) => ({ ...prev, showReviewModal: true }))}
                                    className="w-full mt-3 bg-yellow-500 text-white py-3 rounded-lg hover:bg-yellow-600 text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                                >
                                    <Star className="w-4 h-4" />
                                    Enviar Reseña
                                </button>
                            </div>
                        )}

                        {/* Espacio adicional para asegurar que todos los botones sean visibles */}
                        <div className="h-8"></div>

                    </div>
                </div>
                </aside>
            </div>

            {/* Modals */}
            {showAppointmentForm && (
                    <AppointmentForm
                    searchHireId={search?.searchHire?.id || 0}
                        onSubmit={handleProposalSubmit}
                    onCancel={() => setShowAppointmentForm(false)}
                />
            )}

            {showRejectModal && appointmentToReject && (
            <RejectAppointmentModal
                isOpen={showRejectModal}
                onClose={() => {
                    setShowRejectModal(false);
                    setAppointmentToReject(null);
                }}
                onConfirm={handleRejectConfirm}
                appointment={appointmentToReject}
                isLoading={isRejecting}
                    actionType={modalActionType}
                userRole={userRole}
                />
            )}

            {/* Review Modal */}
            {modalState.showReviewModal && (
                <ReviewModal
                    isOpen={modalState.showReviewModal}
                    onClose={() => setModalState((prev) => ({ ...prev, showReviewModal: false }))}
                    searchHireId={search?.searchHire?.id || 0}
                    reviewForm={reviewForm}
                    setReviewForm={setReviewForm}
                    onSubmit={() => {
                        invalidateAll();
                        setModalState((prev) => ({ ...prev, showReviewModal: false }));
                    }}
                    setNotifications={setNotifications}
                />
            )}

            {/* Dispute Modal */}
            {modalState.showDisputeModal && (
                <DisputeModal
                    isOpen={modalState.showDisputeModal}
                    onClose={() => setModalState((prev) => ({ ...prev, showDisputeModal: false }))}
                    disputeReason={disputeReason}
                    setDisputeReason={setDisputeReason}
                    files={disputeFiles}
                    setFiles={setDisputeFiles}
                    onSubmit={handleDisputeSubmit}
                />
            )}

            {/* Notifications - Fixed Position */}
            <div className="fixed top-24 right-6 z-[60] space-y-3 max-w-md">
                {notifications.map((notification, index) => (
                    <div 
                        key={notification.id}
                        className="transform transition-all duration-300 ease-out"
                        style={{
                            transform: `translateY(${index * 10}px)`,
                            zIndex: 60 - index
                        }}
                    >
                        <Notification
                            type={notification.type}
                            message={notification.message}
                            onClose={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
                            duration={notification.duration || 6000}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}