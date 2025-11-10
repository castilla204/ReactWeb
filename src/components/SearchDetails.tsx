import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Star, AlertTriangle, MessageCircle, Upload, Share2, FileText, MessageSquare, Calendar, CheckCircle, XCircle, MapPin, Home, Phone, Info, Euro, Tag, Clock, X, Users, Award, Activity, FileCheck, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { ScrollArea } from './ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { SearchHire } from '../hooks/useSearch.hooks';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../hooks/useChat';
import Chat from './Chat';
import { ReviewModal, DisputeModal } from './Modals';
import { ExpertResponseModal } from './ExpertResponseModal';
import { useSearchActions } from '../hooks/useSearchActions';
import { useDisputes } from '../hooks/useDisputes';
import { Notification, NotificationType } from './Notification';
import { useParams, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

// Imports para el sistema de citas
import { useAppointments } from '../hooks/useAppointments';
import { useAppointmentStatuses, getAppointmentStatusIcon } from '../hooks/useAppointmentStatuses';
import { useSearchHireStatuses } from '../hooks/useSearchHireStatuses';
import StatusTimeline from './StatusTimeline';
import ExpertAvailability from './ExpertAvailability';
import AppointmentForm from './AppointmentForm';
import RejectAppointmentModal from './RejectAppointmentModal';
import { Appointment, ProposeAppointmentDto, ConfirmAppointmentDto, RejectAppointmentDto, CancelAppointmentDto } from '../types/appointment';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from './ui/alert-dialog';

// Imports para distribución de dinero
import MoneyDistributionInfo from './MoneyDistributionInfo';
import { useMoneyDistributionConfig, shouldShowMoneyDistribution } from '../hooks/useMoneyDistributionConfig';

// ✅ NUEVOS IMPORTS PARA SISTEMA DE ESTADOS
import StatusBadge from './StatusBadge';
import { getStatusInfoWithFallback } from '../utils/statusUtils';
import { useExpertResponse } from '../hooks/useExpertResponse';

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
    const [appointmentFormError, setAppointmentFormError] = useState<string | null>(null);
    const [appointmentData, setAppointmentData] = useState<any>(null);
    const [timeRemaining, setTimeRemaining] = useState<string>('00:00:00');
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [appointmentToReject, setAppointmentToReject] = useState<Appointment | null>(null);
    const [modalActionType, setModalActionType] = useState<'reject' | 'cancel'>('reject');
    const [showConfirmAppointmentDialog, setShowConfirmAppointmentDialog] = useState(false);
    const [appointmentToConfirm, setAppointmentToConfirm] = useState<Appointment | null>(null);
    
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
        expertProfile,
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
    
    // Debug: Verificar qué datos tiene expertInfo
    console.log('[SearchDetails] expertInfo:', expertInfo);
    console.log('[SearchDetails] user:', user);

    // ? HOOKS PARA ACCIONES
    const { uploadDeliverable, isUploadingDeliverable } = useChat(searchId, setNotifications);
    const { handleCancelService, handleForceFinalize, handleCompleteService, handleDisputeSubmit: submitDispute, handleResolveDispute, handleAddAd } =
        useSearchActions(setNotifications);
    
    // Hook para obtener información de disputa
    const { expertResponse, debugDispute } = useDisputes();
    
    // Hook para enviar respuesta del experto
    const { sendExpertResponse, isSubmitting: isSubmittingExpertResponse } = useExpertResponse();
    
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

    const handleExpertResponseSubmit = async (response: string, files: File[]) => {
        if (!disputes[0]?.id) {
            setNotifications(prev => [...prev, {
                id: uuidv4(),
                type: 'error',
                message: 'No se encontró la disputa'
            }]);
            return;
        }

        try {
            console.log('[SearchDetails] Sending expert response:', { 
                disputeId: disputes[0].id, 
                response, 
                filesCount: files.length 
            });
            
            await sendExpertResponse(disputes[0].id, response, files);
            
            setNotifications(prev => [...prev, {
                id: uuidv4(),
                type: 'success',
                message: 'Respuesta enviada exitosamente'
            }]);
            
            setShowExpertResponseModal(false);
            invalidateAll();
        } catch (error: any) {
            console.error('[SearchDetails] Error submitting expert response:', error);
            setNotifications(prev => [...prev, {
                id: uuidv4(),
                type: 'error',
                message: error.message || 'Error al enviar la respuesta'
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
    const { data: searchHireStatuses } = useSearchHireStatuses();
    
    // ✅ FUNCIÓN PARA OBTENER EL ICONO DEL ESTADO (mantenida para compatibilidad)
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
    
    // Debug: Verificar isExpert
    console.log('[SearchDetails] isExpert:', isExpert);
    
    // ✅ SOLUCIÓN TEMPORAL: Usar datos del usuario actual si es experto
    const expertData = isExpert && user ? {
        name: user.name || expertInfo?.name || 'Experto',
        profilePictureUrl: user.profilePictureUrl || expertInfo?.profilePictureUrl
    } : expertInfo;
    
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
    // ✅ SOLO PARA EXPERTOS: Verificar que el usuario actual es el experto de la disputa
    const canExpertRespond = isExpert && // ← AÑADIDO: Solo si es experto
        (disputes[0]?.canExpertRespond !== undefined 
            ? disputes[0].canExpertRespond 
            : (isDisputeExpert && 
               disputes[0]?.status === 'pending' && 
               !disputes[0]?.expertResponse &&
               search?.searchHire?.status === 'disputed'));
    
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
                    setShowConfirmAppointmentDialog(false);
                    setAppointmentToConfirm(null);
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
            setAppointmentFormError(null); // Limpiar errores previos
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
                    
                    setAppointmentFormError(errorMessage);
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
                setAppointmentFormError(null);
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
            
            setAppointmentFormError(errorMessage);
            setNotifications(prev => [...prev, {
                id: uuidv4(),
                type: 'error',
                message: errorMessage
            }]);
        }
    };

    const currentStatus = search?.searchHire?.status || 'pending';
    
    // ✅ OBTENER INFORMACIÓN DE ESTADO CON FALLBACK
    const searchHireStatusInfo = getStatusInfoWithFallback(
        search?.searchHire?.statusInfo, 
        currentStatus
    );
    
    const appointmentStatusInfo = getStatusInfoWithFallback(
        appointment?.statusInfo,
        appointment?.status || ''
    );

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
        <div className="min-h-screen bg-background">
            {/* Header - Mejorado con más información */}
            <header className="bg-background/95 backdrop-blur-md border-b border-border/50 sticky top-0 z-50 shadow-sm">
                <div className="px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onBack || (() => navigate('/busquedas'))}
                                className="h-10 w-10 hover:bg-muted rounded-lg"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                            <div className="flex flex-col min-w-0 flex-1">
                                <h1 className="text-xl font-semibold text-foreground tracking-tight truncate">
                                    {search?.title || 'Cargando...'}
                                </h1>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-muted rounded-lg" title="Compartir">
                                <Share2 className="w-5 h-5" />
                            </Button>
                            {canViewChat && (
                                <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-muted rounded-lg" title="Mensajes">
                                    <MessageCircle className="w-5 h-5" />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Layout - Mejorado */}
            <div className="flex h-[calc(100vh-80px)] bg-background">
                {/* Chat Section - Mejorado */}
                {canViewChat && (
                    <div className="flex-1 lg:w-2/3 bg-background flex flex-col border-r border-border/50">
                        {/* Mobile Tabs - Mejorado */}
                        <div className="lg:hidden border-b border-border bg-background/95 backdrop-blur-sm p-2 sticky top-[80px] z-40">
                            <Tabs value={activeTab || 'chat'} onValueChange={(value: string) => setActiveTab(value as 'chat' | 'details')}>
                                <TabsList className="w-full grid grid-cols-2 h-10">
                                    <TabsTrigger value="chat" className="flex items-center gap-2 text-sm font-medium">
                                    <MessageSquare className="w-4 h-4" />
                                    Chat
                                    </TabsTrigger>
                                    <TabsTrigger value="details" className="flex items-center gap-2 text-sm font-medium">
                                    <FileText className="w-4 h-4" />
                                    Detalles
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>

                        {/* Chat Content */}
                        {(activeTab === 'chat' || !activeTab) && (
                            <div className="h-[calc(100vh-200px)] lg:h-[calc(100vh-140px)]">
                                        <Chat 
                                            searchId={searchId} 
                                            setNotifications={setNotifications} 
                                            isExpert={!!isExpert} 
                                            expertData={{
                                                name: expertData?.name, 
                                                profilePictureUrl: expertData?.profilePictureUrl 
                                            }}
                                        />
                                    </div>
                                )}
                                
                        {/* Details Content - Mobile - Misma información que Desktop */}
                                {activeTab === 'details' && (
                            <div className="flex-1 flex flex-col bg-background">
                                <div className="flex-1 overflow-y-auto p-5 space-y-5 pb-24 lg:pb-5">
                                {/* Service Info */}
                                <div className="bg-card rounded-xl border border-border/50 p-4 space-y-3 shadow-sm transition-shadow hover:shadow-md">
                                    <h3 className="text-sm font-semibold text-foreground">Servicio</h3>
                                    <div className="space-y-2.5">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Tag className="w-4 h-4" />
                                            <span>{serviceInfo?.categoryName || category?.name || 'N/A'}</span>
                                                </div>
                                        {serviceInfo?.serviceTypeName && (
                                            <div className="text-sm">
                                                <span className="text-muted-foreground">Tipo: </span>
                                                <span className="text-foreground font-medium">{serviceInfo.serviceTypeName}</span>
                                            </div>
                                        )}
                                        {search?.description && (
                                            <div className="text-sm">
                                                <span className="text-muted-foreground">Descripción: </span>
                                                <span className="text-foreground">{search.description}</span>
                                            </div>
                                        )}
                                        {serviceInfo?.locationRange && (
                                            <div className="text-xs text-muted-foreground">
                                                Radio de servicio: {serviceInfo.locationRange} km
                                            </div>
                                        )}
                                        {serviceInfo?.price && (
                                            <div className="text-sm text-muted-foreground">
                                                <span>Precio: </span>
                                                <span className="text-foreground font-medium">
                                                    {new Intl.NumberFormat('es-ES', {
                                                        style: 'currency',
                                                        currency: 'EUR',
                                                        minimumFractionDigits: 0,
                                                        maximumFractionDigits: 0,
                                                    }).format(serviceInfo.price)}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Accordion para explicar el estado - Múltiples desplegables */}
                                    {searchHireStatusInfo && (
                                        <Accordion type="multiple" className="w-full">
                                            <AccordionItem value="status-info" className="border-none">
                                                <AccordionTrigger className="text-xs py-2 hover:no-underline">
                                                    ¿Qué significa este estado?
                                                </AccordionTrigger>
                                                <AccordionContent className="text-xs text-muted-foreground pt-2 pb-0">
                                                    <p className="leading-relaxed">
                                                        {searchHireStatusInfo.description || 'Estado del servicio contratado.'}
                                                    </p>
                                                    {searchHireStatusInfo.statusValue === 'pending' && (
                                                        <p className="mt-2 pt-2 border-t border-border/50">
                                                            El experto aún no ha aceptado la contratación. Puedes comunicarte con él a través del chat.
                                                        </p>
                                                    )}
                                                </AccordionContent>
                                            </AccordionItem>
                                            {searchHireStatuses && Array.isArray(searchHireStatuses) && searchHireStatuses.length > 0 && (
                                                <AccordionItem value="status-timeline" className="border-none">
                                                    <AccordionTrigger className="text-xs py-2 hover:no-underline">
                                                        Timeline del estado
                                                    </AccordionTrigger>
                                                    <AccordionContent className="pt-2 pb-0">
                                                        <StatusTimeline
                                                            currentStatus={searchHireStatusInfo}
                                                            allStatuses={searchHireStatuses}
                                                            statusType="SearchHireStatus"
                                                        />
                                                    </AccordionContent>
                                                </AccordionItem>
                                            )}
                                        </Accordion>
                                    )}
                                </div>

                                {/* Sección de Cita - Móvil - Siempre visible si necesita cita */}
                                {needsAppointment && (
                                    <div className="mt-4 pt-4 border-t border-border/50 lg:hidden">
                                        <div className="relative bg-gradient-to-br from-blue-50/50 via-indigo-50/40 to-orange-50/35 dark:from-blue-950/30 dark:via-indigo-950/25 dark:to-orange-950/20 border-2 border-blue-300/70 dark:border-blue-700/60 rounded-xl p-4 space-y-3 shadow-md overflow-hidden">
                                            {/* Borde decorativo con gradiente */}
                                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400/40 via-indigo-400/40 via-purple-400/40 to-orange-400/40 dark:from-blue-500/35 dark:via-indigo-500/35 dark:via-purple-500/35 dark:to-orange-500/35 -z-10 blur-sm"></div>
                                            <div className="relative">
                                                <h3 className="text-sm font-semibold text-foreground mb-3">
                                                    {appointment ? (
                                                        appointmentStatusInfo?.displayName || 
                                                        (appointment.status === 'appointment_proposed' ? 'Cita Propuesta' : 
                                                         appointment.status === 'appointment_confirmed' ? 'Cita Confirmada' : 
                                                         'Cita')
                                                    ) : 'Cita Pendiente'}
                                                </h3>
                                                <div className="space-y-2.5">
                                                    {appointment ? (
                                                        <>
                                                            {appointment.proposedDate && appointment.proposedTime && (
                                                                <div className="flex items-center gap-2 text-sm text-foreground">
                                                                    <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                                                    <span className="font-medium">
                                                                        {new Date(appointment.proposedDate).toLocaleDateString('es-ES', {
                                                                            day: 'numeric',
                                                                            month: 'short',
                                                                            year: 'numeric'
                                                                        })} {appointment.proposedTime.substring(0, 5)}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {appointment.location && (
                                                                <div className="flex items-start gap-2 text-sm text-foreground">
                                                                    <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                                                                    <span className="leading-relaxed">{appointment.location}</span>
                                                                </div>
                                                            )}
                                                            {appointment.doorNumber && (
                                                                <div className="text-sm text-foreground ml-6">
                                                                    <span className="text-muted-foreground">Puerta: </span>
                                                                    <span className="font-medium">{appointment.doorNumber}</span>
                                                                </div>
                                                            )}
                                                            {/* Reportes del Experto - Dentro del cuadro de cita */}
                                                            {appointment.status === 'appointment_report_sent' && deliverables && deliverables.length > 0 && (
                                                                <div className="mt-3 pt-3 border-t border-border/30">
                                                                    <div className="flex items-center gap-2 text-sm text-foreground mb-2">
                                                                        <FileCheck className="w-4 h-4 text-green-600 flex-shrink-0" />
                                                                        <span className="font-medium">Informe Enviado</span>
                                                                    </div>
                                                                    <div className="space-y-1.5 ml-6">
                                                                        {deliverables.map((deliverable) => {
                                                                            const fileName = deliverable.url.split('/').pop() || 'archivo';
                                                                            return (
                                                                                <button
                                                                                    key={deliverable.id}
                                                                                    onClick={() => window.open(deliverable.url, '_blank')}
                                                                                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-full text-left"
                                                                                >
                                                                                    <FileText className="w-3 h-3 flex-shrink-0" />
                                                                                    <span className="truncate">{fileName}</span>
                                                                                </button>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-2 text-sm text-foreground">
                                                                <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                                                <span>Debes proponer una cita</span>
                                                            </div>
                                                            {timeRemaining && timeRemaining !== '00:00:00' && (
                                                                <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 ml-6">
                                                                    <Clock className="w-4 h-4 flex-shrink-0" />
                                                                    <span className="font-medium">Tiempo restante: {timeRemaining}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                {appointment && appointmentStatusInfo && appointmentStatuses && Array.isArray(appointmentStatuses) && appointmentStatuses.length > 0 && (
                                                    <Accordion type="single" collapsible className="w-full mt-3">
                                                        <AccordionItem value="appointment-timeline" className="border-none">
                                                            <AccordionTrigger className="text-xs py-2 hover:no-underline">
                                                                Timeline del estado
                                                            </AccordionTrigger>
                                                            <AccordionContent className="pt-2 pb-0">
                                                                <StatusTimeline
                                                                    currentStatus={appointmentStatusInfo}
                                                                    allStatuses={appointmentStatuses}
                                                                    statusType="AppointmentStatus"
                                                                />
                                                            </AccordionContent>
                                                        </AccordionItem>
                                                    </Accordion>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <Separator />

                                {/* Cliente */}
                                {search?.user && (
                                    <div className="space-y-3">
                                        <h3 className="text-sm font-semibold text-foreground">Cliente</h3>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage 
                                                    src={search.user.profilePictureUrl || undefined} 
                                                    alt={search.user.name}
                                                />
                                                <AvatarFallback className="bg-muted text-foreground text-sm font-medium">
                                                    {search.user.name?.charAt(0).toUpperCase() || 'C'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-foreground truncate">{search.user.name}</p>
                                                <p className="text-xs text-muted-foreground truncate">{search.user.email}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Experto */}
                                {expertData && (
                                    <>
                                        <Separator />
                                        <div className="space-y-3">
                                            <h3 className="text-sm font-semibold text-foreground">Experto</h3>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-11 w-11">
                                                    <AvatarImage 
                                                        src={expertData.profilePictureUrl || undefined} 
                                                        alt={expertData.name}
                                                    />
                                                    <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                                                        {expertData.name?.charAt(0).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-foreground truncate">{expertData.name}</p>
                                                    <div className="flex items-center gap-1.5 mt-1">
                                                        <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                                                        <span className="text-xs text-muted-foreground">Verificado</span>
                                                    </div>
                                                </div>
                                            </div>
                                            {/* ✅ Disponibilidad del experto en móvil */}
                                            {expertProfile?.currentAvailability && (
                                                <div className="pl-14">
                                                    <ExpertAvailability 
                                                        availability={expertProfile.currentAvailability}
                                                        compact={true}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}

                                

                                {/* Subir Informe */}
                                {isExpert && appointment?.status === 'appointment_awaiting_report' && (
                                    <>
                                        <Separator />
                                        <div className="space-y-3">
                                            <h3 className="text-sm font-semibold text-foreground">Subir Informe</h3>
                                        {fileValidation && (
                                                <div className={`p-2.5 rounded-md text-xs ${
                                                fileValidation.canSubmit 
                                                        ? 'bg-green-50 border border-green-200 text-green-800' 
                                                        : 'bg-blue-50 border border-blue-200 text-blue-800'
                                                }`}>
                                                    {fileValidation.message}
                                            </div>
                                        )}
                                        {uploadedFiles.length > 0 && (
                                                <div className="space-y-1.5">
                                                    {uploadedFiles.map((file) => (
                                                        <div key={file.id} className="flex items-center justify-between p-2 bg-background rounded-md border text-xs">
                                                            <div className="flex items-center gap-2">
                                                                <FileText className="w-3.5 h-3.5" />
                                                                <span className="truncate">{file.fileName}</span>
                                                            </div>
                                                            <Button
                                                                onClick={() => handleDeleteFile(file.id)}
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-6 w-6 p-0"
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                            </div>
                                        )}
                                            <label className="block">
                                                <input
                                                    type="file"
                                                    multiple
                                                    accept=".pdf,.mp4"
                                                    onChange={handleDeliverableFileChange}
                                                    className="hidden"
                                                />
                                                <div className="w-full p-4 border-2 border-dashed border-border rounded-md cursor-pointer hover:bg-muted/50 transition-colors text-center">
                                                    <Upload className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                                                    <p className="text-sm font-medium text-foreground mb-1">Seleccionar archivos</p>
                                                    <p className="text-xs text-muted-foreground">PDF o MP4 (máx. 10MB)</p>
                                                </div>
                                            </label>
                                            {selectedDeliverableFiles.length > 0 && (
                                                <div className="space-y-1.5">
                                            {selectedDeliverableFiles.map((file, index) => (
                                                        <div key={index} className="flex items-center justify-between p-2 bg-background rounded-md border text-xs">
                                                            <span className="truncate">{file.name}</span>
                                                            <Button
                                                        onClick={() => removeSelectedFile(index)}
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-6 w-6 p-0"
                                                    >
                                                                <X className="w-3 h-3" />
                                                            </Button>
                                                </div>
                                            ))}
                                                </div>
                                            )}
                                            <Button
                                                    onClick={handleSubmitReport}
                                                className={`w-full ${
                                                        fileValidation && !fileValidation.canSubmit
                                                        ? 'bg-muted cursor-not-allowed'
                                                        : 'bg-green-600 hover:bg-green-700'
                                                    }`}
                                                    disabled={fileValidation ? !fileValidation.canSubmit : false}
                                                size="sm"
                                                >
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                    Enviar Reporte
                                            </Button>
                                            </div>
                                    </>
                                )}

                                {/* Reseña */}
                                {canReview && (
                                    <>
                                        <Separator />
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                                <h3 className="text-sm font-semibold text-foreground">Reseña</h3>
                                            </div>
                                    </div>
                                    </>
                                )}

                                {review && (
                                    <>
                                        <Separator />
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                                    <span className="text-sm font-semibold text-foreground">Reseña</span>
                                    </div>
                                                <Badge variant="secondary">{review.score}/5</Badge>
                                            </div>
                                            {review.description && (
                                                <p className="text-sm text-foreground leading-relaxed bg-background p-3 rounded-md border">
                                                    {review.description}
                                                </p>
                                        )}
                                    </div>
                                    </>
                                )}

                                        </div>
                                
                                {/* Botones de acción fijos en móvil */}
                                <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border z-50 p-4 space-y-2 shadow-lg">
                                    {/* Botones de cita - Confirmar/Rechazar/Cancelar */}
                                    {(userRole === 'expert' && appointment?.status === 'appointment_proposed') || appointment?.status === 'appointment_confirmed' ? (
                                        <div className="flex gap-2">
                                            {userRole === 'expert' && appointment.status === 'appointment_proposed' && (
                                                <>
                                                    <Button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            setAppointmentToConfirm(appointment as Appointment);
                                                            setShowConfirmAppointmentDialog(true);
                                                        }}
                                                        className="flex-1"
                                                        size="sm"
                                                    >
                                                        <CheckCircle className="w-4 h-4 mr-2" />
                                                        Confirmar
                                                    </Button>
                                                    <Button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            setAppointmentToReject(appointment as Appointment);
                                                            setModalActionType('reject');
                                                            setShowRejectModal(true);
                                                        }}
                                                        variant="destructive"
                                                        className="flex-1"
                                                        size="sm"
                                                    >
                                                        <XCircle className="w-4 h-4 mr-2" />
                                                        Rechazar
                                                    </Button>
                                                </>
                                            )}
                                            {appointment.status === 'appointment_confirmed' && (
                                                <Button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setAppointmentToReject(appointment as Appointment);
                                                        setModalActionType('cancel');
                                                        setShowRejectModal(true);
                                                    }}
                                                    variant="outline"
                                                    className="w-full"
                                                    size="sm"
                                                >
                                                    <XCircle className="w-4 h-4 mr-2" />
                                                    Cancelar Cita
                                                </Button>
                                            )}
                                        </div>
                                    ) : null}
                                    
                                    {/* Acciones Principales */}
                                    {(canDispute || canApprove || canExpertRespond) && (
                                        <div className="space-y-2">
                                            {canApprove && (
                                                <Button
                                                    onClick={handleApproveService}
                                                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                                                    size="sm"
                                                >
                                                    <CheckCircle className="w-4 h-4 mr-2" />
                                                    Aprobar Servicio
                                                </Button>
                                            )}
                                            {canDispute && (
                                                <Button
                                                    onClick={() => setModalState((prev) => ({ ...prev, showDisputeModal: true }))}
                                                    variant="outline"
                                                    className="w-full border-destructive text-destructive hover:bg-destructive/10"
                                                    size="sm"
                                                >
                                                    <AlertTriangle className="w-4 h-4 mr-2" />
                                                    Disputar
                                                </Button>
                                            )}
                                            {canExpertRespond && (
                                                <Button
                                                    onClick={() => setShowExpertResponseModal(true)}
                                                    variant="outline"
                                                    className="w-full"
                                                    size="sm"
                                                >
                                                    <MessageCircle className="w-4 h-4 mr-2" />
                                                    Responder Disputa
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                    
                                    {/* Enviar Reporte */}
                                    {isExpert && appointment?.status === 'appointment_awaiting_report' && (
                                        <Button
                                            onClick={handleSubmitReport}
                                            className={`w-full ${
                                                fileValidation && !fileValidation.canSubmit
                                                    ? 'bg-muted cursor-not-allowed'
                                                    : 'bg-green-600 hover:bg-green-700'
                                            }`}
                                            disabled={fileValidation ? !fileValidation.canSubmit : false}
                                            size="sm"
                                        >
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            Enviar Reporte
                                        </Button>
                                    )}
                                    
                                    {/* Escribir Reseña */}
                                    {canReview && (
                                        <Button
                                            onClick={() => setModalState((prev) => ({ ...prev, showReviewModal: true }))}
                                            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white"
                                            size="sm"
                                        >
                                            <Star className="w-4 h-4 mr-2" />
                                            Escribir Reseña
                                        </Button>
                                    )}
                                    
                                    {/* Programar Cita */}
                                    {isClient && (canProposeAppointment() || (appointment && appointment.status === 'appointment_cancelled_by_expert')) && (
                                        <Button
                                            onClick={() => handleAppointmentAction('propose', { 
                                                id: 0, 
                                                searchHireId: search?.searchHire?.id || 0,
                                                status: 'awaiting_appointment',
                                                amount: serviceInfo?.price || 0
                                            } as Appointment)}
                                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] rounded-lg"
                                            size="lg"
                                        >
                                            <Calendar className="w-5 h-5 mr-2" />
                                            {appointment && appointment.status === 'appointment_cancelled_by_expert' 
                                                ? 'Proponer Nueva Cita'
                                                : 'Programar Cita'
                                            }
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Sidebar - Desktop Only - Diseño Profesional */}
                <aside className="hidden lg:flex lg:w-1/3 border-l border-border flex-col bg-muted/30">
                    <ScrollArea className="flex-1">
                        <div className="p-5 space-y-6">
                            
                            {/* Resumen del Servicio */}
                            <div className="bg-card rounded-xl border border-border/50 p-5 space-y-3 shadow-sm transition-shadow hover:shadow-md">
                                <h3 className="text-sm font-semibold text-foreground">Servicio</h3>
                                <div className="space-y-2.5">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Tag className="w-4 h-4" />
                                        <span>{serviceInfo?.categoryName || category?.name || 'N/A'}</span>
                                </div>
                                    {serviceInfo?.serviceTypeName && (
                                        <div className="text-sm">
                                            <span className="text-muted-foreground">Tipo: </span>
                                            <span className="text-foreground font-medium">{serviceInfo.serviceTypeName}</span>
                                        </div>
                                    )}
                                    {search?.description && (
                                        <div className="text-sm">
                                            <span className="text-muted-foreground">Descripción: </span>
                                            <span className="text-foreground">{search.description}</span>
                                        </div>
                                    )}
                                    {search?.createdAt && (
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span>Creado el {new Date(search.createdAt).toLocaleDateString('es-ES', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric'
                                            })}</span>
                                        </div>
                                    )}
                                    {serviceInfo?.locationRange && (
                                        <div className="text-xs text-muted-foreground">
                                            Radio de servicio: {serviceInfo.locationRange} km
                                        </div>
                                    )}
                                    {serviceInfo?.price && (
                                        <div className="text-sm text-muted-foreground">
                                            <span>Precio: </span>
                                            <span className="text-foreground font-medium">
                                                {new Intl.NumberFormat('es-ES', {
                                                    style: 'currency',
                                                    currency: 'EUR',
                                                    minimumFractionDigits: 0,
                                                    maximumFractionDigits: 0,
                                                }).format(serviceInfo.price)}
                                            </span>
                                        </div>
                                    )}
                            </div>
                            
                                {/* Accordion para explicar el estado */}
                                {searchHireStatusInfo && (
                                    <Accordion type="single" collapsible className="w-full">
                                        <AccordionItem value="status-info" className="border-none">
                                            <AccordionTrigger className="text-xs py-2 hover:no-underline">
                                                ¿Qué significa este estado?
                                            </AccordionTrigger>
                                            <AccordionContent className="text-xs text-muted-foreground pt-2 pb-0">
                                                <p className="leading-relaxed">
                                                    {searchHireStatusInfo.description || 'Estado del servicio contratado.'}
                                                </p>
                                                {searchHireStatusInfo.statusValue === 'pending' && (
                                                    <p className="mt-2 pt-2 border-t border-border/50">
                                                        El experto aún no ha aceptado la contratación. Puedes comunicarte con él a través del chat.
                                                    </p>
                                                )}
                                            </AccordionContent>
                                        </AccordionItem>
                                        {searchHireStatuses && Array.isArray(searchHireStatuses) && searchHireStatuses.length > 0 && (
                                            <AccordionItem value="status-timeline" className="border-none">
                                                <AccordionTrigger className="text-xs py-2 hover:no-underline">
                                                    Timeline del estado
                                                </AccordionTrigger>
                                                <AccordionContent className="pt-2 pb-0">
                                                    <StatusTimeline
                                                        currentStatus={searchHireStatusInfo}
                                                        allStatuses={searchHireStatuses}
                                                        statusType="SearchHireStatus"
                                                    />
                                                </AccordionContent>
                                            </AccordionItem>
                                        )}
                                    </Accordion>
                                )}

                                {/* Sección de Cita - Desktop - Siempre visible si necesita cita */}
                                {needsAppointment && (
                                    <div className="mt-6 hidden lg:block">
                                        <div className="relative bg-gradient-to-br from-blue-50/50 via-indigo-50/40 to-orange-50/35 dark:from-blue-950/30 dark:via-indigo-950/25 dark:to-orange-950/20 border-2 border-blue-300/70 dark:border-blue-700/60 rounded-xl p-5 space-y-3 shadow-md overflow-hidden">
                                            {/* Borde decorativo con gradiente */}
                                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400/40 via-indigo-400/40 via-purple-400/40 to-orange-400/40 dark:from-blue-500/35 dark:via-indigo-500/35 dark:via-purple-500/35 dark:to-orange-500/35 -z-10 blur-sm"></div>
                                            <div className="relative">
                                                <h3 className="text-sm font-semibold text-foreground mb-3">
                                                    {appointment ? (
                                                        appointmentStatusInfo?.displayName || 
                                                        (appointment.status === 'appointment_proposed' ? 'Cita Propuesta' : 
                                                         appointment.status === 'appointment_confirmed' ? 'Cita Confirmada' : 
                                                         'Cita')
                                                    ) : 'Cita Pendiente'}
                                                </h3>
                                                <div className="space-y-2.5">
                                                    {appointment ? (
                                                        <>
                                                            {appointment.proposedDate && appointment.proposedTime && (
                                                                <div className="flex items-center gap-2 text-sm text-foreground">
                                                                    <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                                                    <span className="font-medium">
                                                {new Date(appointment.proposedDate).toLocaleDateString('es-ES', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                                            year: 'numeric'
                                                                        })} {appointment.proposedTime.substring(0, 5)}
                                                </span>
                                        </div>
                                                            )}
                                    {appointment.location && (
                                                                <div className="flex items-start gap-2 text-sm text-foreground">
                                                    <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                                                                    <span className="leading-relaxed">{appointment.location}</span>
                                    </div>
                                    )}
                                    {appointment.doorNumber && (
                                                                <div className="text-sm text-foreground ml-6">
                                                                    <span className="text-muted-foreground">Puerta: </span>
                                                                    <span className="font-medium">{appointment.doorNumber}</span>
                                </div>
                            )}
                                                            {/* Reportes del Experto - Dentro del cuadro de cita (Desktop) */}
                                                            {appointment.status === 'appointment_report_sent' && deliverables && deliverables.length > 0 && (
                                                                <div className="mt-3 pt-3 border-t border-border/30">
                                                                    <div className="flex items-center gap-2 text-sm text-foreground mb-2">
                                                                        <FileCheck className="w-4 h-4 text-green-600 flex-shrink-0" />
                                                                        <span className="font-medium">Informe Enviado</span>
                                        </div>
                                                                    <div className="space-y-1.5 ml-6">
                                                                        {deliverables.map((deliverable) => {
                                                                            const fileName = deliverable.url.split('/').pop() || 'archivo';
                                                                            return (
                                                                                <button
                                                                                    key={deliverable.id}
                                                                                    onClick={() => window.open(deliverable.url, '_blank')}
                                                                                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-full text-left"
                                                                                >
                                                                                    <FileText className="w-3 h-3 flex-shrink-0" />
                                                                                    <span className="truncate">{fileName}</span>
                                                                                </button>
                                                                            );
                                                                        })}
                                        </div>
                                        </div>
                                        )}
                                                        </>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-2 text-sm text-foreground">
                                                <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                                                <span>Debes proponer una cita</span>
                                        </div>
                                                            {timeRemaining && timeRemaining !== '00:00:00' && (
                                                                <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 ml-6">
                                                                    <Clock className="w-4 h-4 flex-shrink-0" />
                                                                    <span className="font-medium">Tiempo restante: {timeRemaining}</span>
                                        </div>
                                    )}
                                        </div>
                                    )}
                                            </div>
                                                {appointment && appointmentStatusInfo && appointmentStatuses && Array.isArray(appointmentStatuses) && appointmentStatuses.length > 0 && (
                                                    <Accordion type="single" collapsible className="w-full mt-3">
                                                        <AccordionItem value="appointment-timeline" className="border-none">
                                                    <AccordionTrigger className="text-xs py-2 hover:no-underline">
                                                        Timeline del estado
                                                    </AccordionTrigger>
                                                    <AccordionContent className="pt-2 pb-0">
                                                            <StatusTimeline
                                                                currentStatus={appointmentStatusInfo}
                                                                    allStatuses={appointmentStatuses}
                                                                statusType="AppointmentStatus"
                                                            />
                                                    </AccordionContent>
                                                </AccordionItem>
                                            </Accordion>
                                        )}

                                                {/* Botones de acción para desktop */}
                                                {((appointment && ((userRole === 'expert' && appointment.status === 'appointment_proposed') || appointment.status === 'appointment_confirmed')) || 
                                                  (isClient && (canProposeAppointment() || (appointment && appointment.status === 'appointment_cancelled_by_expert')))) && (
                                                    <div className="flex gap-2 mt-4 pt-3 border-t border-border/50">
                                                        {userRole === 'expert' && appointment && appointment.status === 'appointment_proposed' && (
                                        <>
                                                        <Button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                                        setAppointmentToConfirm(appointment as Appointment);
                                                                        setShowConfirmAppointmentDialog(true);
                                                }}
                                                            className="flex-1"
                                                            size="sm"
                                            >
                                                            <CheckCircle className="w-4 h-4 mr-2" />
                                                                    Aceptar
                                                        </Button>
                                                        <Button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                                        setAppointmentToReject(appointment as Appointment);
                                            setModalActionType('reject');
                                            setShowRejectModal(true);
                                                }}
                                                            variant="destructive"
                                                            className="flex-1"
                                                            size="sm"
                                            >
                                                            <XCircle className="w-4 h-4 mr-2" />
                                                Rechazar
                                                        </Button>
                                        </>
                                    )}
                                                        {appointment && appointment.status === 'appointment_confirmed' && (
                                                    <Button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                                    setAppointmentToReject(appointment as Appointment);
                                            setModalActionType('cancel');
                                            setShowRejectModal(true);
                                            }}
                                                        variant="outline"
                                                        className="w-full"
                                                        size="sm"
                                        >
                                                        <XCircle className="w-4 h-4 mr-2" />
                                                                Cancelar Cita
                                                            </Button>
                                                        )}
                                                        {isClient && (canProposeAppointment() || (appointment && appointment.status === 'appointment_cancelled_by_expert')) && (
                                                            <Button
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    handleAppointmentAction('propose', { 
                                                                        id: 0, 
                                                                        searchHireId: search?.searchHire?.id || 0,
                                                                        status: 'awaiting_appointment',
                                                                        amount: serviceInfo?.price || 0
                                                                    } as Appointment);
                                                                }}
                                                                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                                                                size="sm"
                                                            >
                                                                <Calendar className="w-4 h-4 mr-2" />
                                                                {appointment && appointment.status === 'appointment_cancelled_by_expert' 
                                                                    ? 'Proponer Nueva Cita'
                                                                    : 'Programar Cita'
                                                                }
                                                    </Button>
                                    )}
                                </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <Separator />

                            {/* Cliente */}
                            {search?.user && (
                                <div className="space-y-3">
                                    <h3 className="text-sm font-semibold text-foreground">Cliente</h3>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage 
                                                src={search.user.profilePictureUrl || undefined} 
                                                alt={search.user.name}
                                            />
                                            <AvatarFallback className="bg-muted text-foreground text-sm font-medium">
                                                {search.user.name?.charAt(0).toUpperCase() || 'C'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-foreground truncate">{search.user.name}</p>
                                            <p className="text-xs text-muted-foreground truncate">{search.user.email}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Experto */}
                        {expertData && (
                                <>
                                    <Separator />
                                    <div className="space-y-3">
                                        <h3 className="text-sm font-semibold text-foreground">Experto</h3>
                                    <div className="flex items-center gap-3">
                                            <Avatar className="h-11 w-11">
                                                <AvatarImage 
                                                    src={expertData.profilePictureUrl || undefined} 
                                            alt={expertData.name}
                                                />
                                                <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                                                    {expertData.name?.charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-foreground truncate">{expertData.name}</p>
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                                                    <span className="text-xs text-muted-foreground">Verificado</span>
                                        </div>
                                        </div>
                                    </div>
                                        {/* ✅ NUEVO: Mostrar disponibilidad del experto en desktop */}
                                        {expertProfile?.currentAvailability && (
                                            <div className="pl-14">
                                                <ExpertAvailability 
                                                    availability={expertProfile.currentAvailability}
                                                    compact={true}
                                                />
                                        </div>
                                        )}
                                    </div>
                                </>
                            )}


                            {/* Acciones Principales */}
                            {(canDispute || canApprove || canExpertRespond) && (
                                <>
                                    <Separator />
                                    <div className="space-y-2">
                                        {canApprove && (
                                            <Button
                                                onClick={handleApproveService}
                                                className="w-full bg-green-600 hover:bg-green-700 text-white"
                                                size="sm"
                                            >
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                Aprobar Servicio
                                            </Button>
                                        )}
                                        {canDispute && (
                                            <Button
                                                onClick={() => setModalState((prev) => ({ ...prev, showDisputeModal: true }))}
                                                variant="outline"
                                                className="w-full border-destructive text-destructive hover:bg-destructive/10"
                                                size="sm"
                                            >
                                                <AlertTriangle className="w-4 h-4 mr-2" />
                                                Disputar
                                            </Button>
                                        )}
                                        {canExpertRespond && (
                                            <Button
                                                onClick={() => setShowExpertResponseModal(true)}
                                                variant="outline"
                                                className="w-full"
                                                size="sm"
                                            >
                                                <MessageCircle className="w-4 h-4 mr-2" />
                                                Responder Disputa
                                            </Button>
                                        )}
                                </div>
                                </>
                        )}


                            {/* Subir Informe */}
                        {isExpert && appointment?.status === 'appointment_awaiting_report' && (
                                <>
                                    <Separator />
                                    <div className="space-y-3">
                                        <h3 className="text-sm font-semibold text-foreground">Subir Informe</h3>
                                {fileValidation && (
                                            <div className={`p-2.5 rounded-md text-xs ${
                                        fileValidation.canSubmit 
                                                    ? 'bg-green-50 border border-green-200 text-green-800' 
                                                    : 'bg-blue-50 border border-blue-200 text-blue-800'
                                            }`}>
                                                {fileValidation.message}
                                    </div>
                                )}
                                {uploadedFiles.length > 0 && (
                                            <div className="space-y-1.5">
                                            {uploadedFiles.map((file) => (
                                                    <div key={file.id} className="flex items-center justify-between p-2 bg-background rounded-md border text-xs">
                                                    <div className="flex items-center gap-2">
                                                            <FileText className="w-3.5 h-3.5" />
                                                            <span className="truncate">{file.fileName}</span>
                                                    </div>
                                                        <Button
                                                        onClick={() => handleDeleteFile(file.id)}
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 w-6 p-0"
                                                    >
                                                            <X className="w-3 h-3" />
                                                        </Button>
                                                </div>
                                            ))}
                                    </div>
                                )}
                                    <label className="block">
                                        <input
                                            type="file"
                                            multiple
                                            accept=".pdf,.mp4"
                                            onChange={handleDeliverableFileChange}
                                            className="hidden"
                                        />
                                            <div className="w-full p-4 border-2 border-dashed border-border rounded-md cursor-pointer hover:bg-muted/50 transition-colors text-center">
                                                <Upload className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                                                <p className="text-sm font-medium text-foreground mb-1">Seleccionar archivos</p>
                                                <p className="text-xs text-muted-foreground">PDF o MP4 (máx. 10MB)</p>
                                        </div>
                                    </label>
                                    {selectedDeliverableFiles.length > 0 && (
                                            <div className="space-y-1.5">
                                            {selectedDeliverableFiles.map((file, index) => (
                                                    <div key={index} className="flex items-center justify-between p-2 bg-background rounded-md border text-xs">
                                                        <span className="truncate">{file.name}</span>
                                                        <Button
                                                        onClick={() => removeSelectedFile(index)}
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 w-6 p-0"
                                                    >
                                                            <X className="w-3 h-3" />
                                                        </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                        <Button
                                            onClick={handleSubmitReport}
                                            className={`w-full ${
                                                fileValidation && !fileValidation.canSubmit
                                                    ? 'bg-muted cursor-not-allowed'
                                                    : 'bg-green-600 hover:bg-green-700'
                                            }`}
                                            disabled={fileValidation ? !fileValidation.canSubmit : false}
                                            size="sm"
                                        >
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            Enviar Reporte
                                        </Button>
                                    </div>
                                </>
                            )}

                            {/* Reseña */}
                            {canReview && (
                                <>
                                    <Separator />
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                            <h3 className="text-sm font-semibold text-foreground">Reseña</h3>
                                </div>
                                        <Button
                                            onClick={() => setModalState((prev) => ({ ...prev, showReviewModal: true }))}
                                            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white"
                                            size="sm"
                                        >
                                            <Star className="w-4 h-4 mr-2" />
                                            Escribir Reseña
                                        </Button>
                            </div>
                                </>
                            )}

                            {review && (
                                <>
                                    <Separator />
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                                <span className="text-sm font-semibold text-foreground">Reseña</span>
                                            </div>
                                            <Badge variant="secondary">{review.score}/5</Badge>
                                        </div>
                                        {review.description && (
                                            <p className="text-sm text-foreground leading-relaxed bg-background p-3 rounded-md border">
                                                {review.description}
                                            </p>
                                )}
                            </div>
                                </>
                            )}

                            {/* Programar Cita - Solo en móvil (en desktop está dentro de la card) */}
                            <div className="lg:hidden">
                            {isClient && (canProposeAppointment() || (appointment && appointment.status === 'appointment_cancelled_by_expert')) && (
                                <>
                                    <Separator />
                                    <Button
                                        onClick={() => handleAppointmentAction('propose', { 
                                            id: 0, 
                                            searchHireId: search?.searchHire?.id || 0,
                                            status: 'awaiting_appointment',
                                            amount: serviceInfo?.price || 0
                                        } as Appointment)}
                                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] rounded-lg"
                                        size="lg"
                                    >
                                        <Calendar className="w-5 h-5 mr-2" />
                                        {appointment && appointment.status === 'appointment_cancelled_by_expert' 
                                            ? 'Proponer Nueva Cita'
                                            : 'Programar Cita'
                                        }
                                    </Button>
                                </>
                            )}
                            </div>

                            <div className="h-6"></div>


                        {/* Espacio adicional para asegurar que todos los botones sean visibles */}
                        <div className="h-8"></div>
                    </div>
                    </ScrollArea>
                </aside>
            </div>

            {/* Modals */}
            {showAppointmentForm && (
                    <AppointmentForm
                    searchHireId={search?.searchHire?.id || 0}
                        onSubmit={handleProposalSubmit}
                    onCancel={() => {
                        setShowAppointmentForm(false);
                        setAppointmentFormError(null);
                    }}
                    error={appointmentFormError}
                    expertAvailability={expertProfile?.currentAvailability || null}
                    expertLocation={
                        serviceInfo?.expertLatitude && serviceInfo?.expertLongitude
                            ? {
                                latitude: typeof serviceInfo.expertLatitude === 'string' 
                                    ? parseFloat(serviceInfo.expertLatitude) 
                                    : Number(serviceInfo.expertLatitude),
                                longitude: typeof serviceInfo.expertLongitude === 'string' 
                                    ? parseFloat(serviceInfo.expertLongitude) 
                                    : Number(serviceInfo.expertLongitude)
                            }
                            : null
                    }
                    expertRange={serviceInfo?.locationRange || null}
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

            {/* Alert Dialog para confirmar cita */}
            <AlertDialog open={showConfirmAppointmentDialog} onOpenChange={setShowConfirmAppointmentDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar cita</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro de que quieres aceptar esta cita? Una vez confirmada, no podrás cancelarla.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    {appointmentToConfirm && (
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Calendar className="w-4 h-4" />
                                <span>
                                    {new Date(appointmentToConfirm.proposedDate).toLocaleDateString('es-ES', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })} {appointmentToConfirm.proposedTime?.substring(0, 5)}
                                </span>
                            </div>
                            {appointmentToConfirm.location && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <MapPin className="w-4 h-4" />
                                    <span>{appointmentToConfirm.location}</span>
                                </div>
                            )}
                        </div>
                    )}
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (appointmentToConfirm) {
                                    handleAppointmentAction('confirm', appointmentToConfirm);
                                }
                            }}
                        >
                            Confirmar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

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

            {/* Expert Response Modal */}
            {showExpertResponseModal && (
                <ExpertResponseModal
                    isOpen={showExpertResponseModal}
                    onClose={() => setShowExpertResponseModal(false)}
                    onSubmit={handleExpertResponseSubmit}
                    isSubmitting={isSubmittingExpertResponse}
                    dispute={disputes[0]}
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