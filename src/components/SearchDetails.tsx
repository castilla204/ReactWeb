import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Star, AlertTriangle, MessageCircle, Upload, Share2, FileText, MessageSquare, Calendar, CheckCircle, XCircle, MapPin, Home, Phone, Info, Euro, Tag, Clock, X, Users, Award, Activity, FileCheck, Download, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
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
import { useParams, useNavigate } from 'react-router-dom';
import { showToast, NotificationType } from '../lib/toast';
import { useErrorHandler, isNetworkError } from '../hooks/useErrorHandler';

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
    const searchIdParam = parseInt(id || '0', 10);
    // ✅ Si searchId es 0, significa que solo tenemos searchHireId (cliente eliminado)
    const searchId = searchIdParam === 0 ? null : searchIdParam;
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
    // ✅ Obtener searchHireId desde la URL o intentar obtenerlo de los datos después
    const searchHireIdFromUrl = new URLSearchParams(window.location.search).get('searchHireId');
    const initialSearchHireId = searchHireIdFromUrl ? parseInt(searchHireIdFromUrl, 10) : undefined;
    
    const {
        search,
        moneyDistribution,
        category,
        review,
        expertProfile,
        conversations,
        appointment,
        deliverables,
        requiredDeliverableTypes, // ✅ NUEVO: Tipos de reportes requeridos
        disputes,
        isLoading,
        isError,
        error,
        invalidateAll
    } = useSearchDetailsOptimized(searchId, { searchHireId: initialSearchHireId });
    
    // ✅ Obtener searchHireId final (de URL o de los datos cargados)
    const searchHireId = initialSearchHireId || search?.searchHire?.id;

    // ? DATOS DERIVADOS
    const hireId = searchHireId || search?.searchHire?.id;
    const hasSearchHireData = !!search?.searchHire || !!searchHireId;
    // ✅ Cuando search es null, usar serviceInfo de searchHire si está disponible
    const serviceInfo = search?.searchHire?.service;
    
    // ? DATOS DE EXPERTO DESDE SEARCHHIRE O EXPERTPROFILE
    // ✅ Cuando search es null, usar expertProfile.user directamente
    const expertInfo = search?.searchHire?.expert || expertProfile?.user || null;
    
    // Debug: Verificar qué datos tiene expertInfo
    console.log('[SearchDetails] expertInfo:', expertInfo);
    console.log('[SearchDetails] user:', user);

    // ? HOOKS PARA ACCIONES
    const { uploadDeliverable, isUploadingDeliverable } = useChat(searchId, searchHireId);
    const { handleCancelService, handleForceFinalize, handleCompleteService, handleDisputeSubmit: submitDispute, handleResolveDispute, handleAddAd } =
        useSearchActions();
    
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
        isConfirming,
        isRejecting,
        isCancelling
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
    }, [uploadedFiles, selectedDeliverableFiles, requiredDeliverableTypes]);

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
        
        // ✅ Usar requiredDeliverableTypes del backend para validación dinámica
        const requiredTypes = requiredDeliverableTypes || [];
        
        if (requiredTypes.length === 0) {
            // Si no hay tipos requeridos definidos, usar validación por defecto (PDF y MP4)
            if (hasPDF && hasMP4) {
                setFileValidation({ 
                    canSubmit: true, 
                    message: 'Todos los archivos requeridos están listos' 
                });
            } else {
                const missing = [];
                if (!hasPDF) missing.push('PDF');
                if (!hasMP4) missing.push('MP4');
                setFileValidation({ 
                    canSubmit: false, 
                    message: `Para enviar el reporte necesitas subir: ${missing.join(' y ')}` 
                });
            }
        } else {
            // ✅ Validar usando los tipos requeridos del backend
            const deliveredTypes = totalFiles.map(file => {
                const fileName = (file as any).fileName || (file as any).name || '';
                const extension = fileName.split('.').pop()?.toUpperCase() || '';
                // Mapear extensiones a nombres de tipos del backend
                if (extension === 'PDF') return 'PDF';
                if (extension === 'MP4' || extension === 'VIDEO') return 'Video';
                return extension;
            });
            
            const missing = requiredTypes
                .filter(type => {
                    const typeName = type.name.toUpperCase();
                    // Verificar si el tipo está en los archivos entregados
                    return !deliveredTypes.some(delivered => {
                        if (typeName === 'PDF' && delivered === 'PDF') return true;
                        if ((typeName === 'VIDEO' || typeName === 'MP4') && delivered === 'Video') return true;
                        return delivered === typeName;
                    });
                })
                .map(type => type.displayName || type.name);
            
            if (missing.length === 0) {
                setFileValidation({ 
                    canSubmit: true, 
                    message: 'Todos los archivos requeridos están listos' 
                });
            } else {
                const missingText = missing.length === 1 
                    ? missing[0] 
                    : missing.slice(0, -1).join(', ') + ' y ' + missing[missing.length - 1];
                setFileValidation({ 
                    canSubmit: false, 
                    message: `Para enviar el reporte necesitas subir: ${missingText}` 
                });
            }
        }
    };

    const handleDeleteFile = async (deliverableId: number) => {
        if (!appointment?.id) return;
        
        try {
            const result = await deleteFile(appointment.id, deliverableId);
            if (result.success) {
                showToast('success', 'Archivo eliminado exitosamente');
                // Recargar archivos y validación
                await loadUploadedFiles();
                await validateFilesAndUpdate();
            } else {
                showToast('error', result.message);
            }
        } catch (error) {
            console.error('Error eliminando archivo:', error);
            showToast('error', 'Error al eliminar archivo');
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
            showToast('success', `${validFiles.length} archivo(s) seleccionado(s) correctamente`);
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
                    showToast('success', 'Archivos subidos exitosamente. Ahora puedes enviar el reporte.');
                    // No limpiar archivos aquí, se limpiarán al enviar el reporte
                    invalidateAll();
                } else {
                    throw new Error('Error al subir archivos');
                }
            } catch (error) {
                console.error('[SearchDetails] Error uploading deliverables:', error);
                showToast('error', 'Error al subir los archivos');
            }
        } else {
            showToast('error', 'Por favor, selecciona al menos un archivo para subir como entregable.', 5000);
        }
    };

    const removeSelectedFile = (index: number) => {
        setSelectedDeliverableFiles(prev => prev.filter((_, i) => i !== index));
        // La validación se ejecutará automáticamente por el useEffect
    };

    const handleDisputeSubmit = async () => {
        if (!search?.searchHire?.id) {
            showToast('error', 'No se encontró el ID del servicio');
            return;
        }

        if (!disputeReason.trim()) {
            showToast('error', 'Por favor, describe el motivo de la disputa');
            return;
        }

        try {
            await submitDispute(
                search.searchHire.id, 
                disputeReason, 
                disputeFiles,
                () => {
                    // Callback de éxito
                    showToast('success', 'Disputa enviada exitosamente');
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
            showToast('error', 'Error al enviar la disputa');
        }
    };

    const handleExpertResponseSubmit = async (response: string, files: File[]) => {
        if (!disputes[0]?.id) {
            showToast('error', 'No se encontró la disputa');
            return;
        }

        try {
            console.log('[SearchDetails] Sending expert response:', { 
                disputeId: disputes[0].id, 
                response, 
                filesCount: files.length 
            });
            
            await sendExpertResponse(disputes[0].id, response, files);
            
            showToast('success', 'Respuesta enviada exitosamente');
            
            setShowExpertResponseModal(false);
            invalidateAll();
        } catch (error: any) {
            console.error('[SearchDetails] Error submitting expert response:', error);
            showToast('error', error.message || 'Error al enviar la respuesta');
        }
    };

    const [isSubmittingReport, setIsSubmittingReport] = useState(false);

    const handleSubmitReport = async () => {
        if (!appointment?.id) {
            showToast('error', 'No se encontró el ID de la cita');
            return;
        }

        setIsSubmittingReport(true);
        try {
            // Usar el endpoint unificado que maneja todo: subida + validación + envío
            console.log('[SearchDetails] Enviando reporte con archivos usando endpoint unificado...');
            const result = await submitReportWithFiles(appointment.id, selectedDeliverableFiles, 'Reporte completado por el experto');
            
            if (result.success) {
                showToast('success', 'Reporte enviado exitosamente');
                // Limpiar archivos seleccionados
                setSelectedDeliverableFiles([]);
                // Refrescar datos
                invalidateAll();
            } else {
                showToast('error', result.message);
            }
        } catch (error) {
            console.error('[SearchDetails] Error submitting report:', error);
            showToast('error', 'Error al enviar el reporte');
        } finally {
            setIsSubmittingReport(false);
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
    const needsAppointment = hasSearchHireData && (isAppointmentCategory || requiresAppointment);
    
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
    // ✅ Cuando search es null, no podemos obtener clientId (cliente eliminado)
    const clientId = Number(search?.userId ?? 0);
    // ✅ Cuando search es null, obtener expertId de expertProfile, expertInfo o searchHire
    const expertId = Number(
        search?.searchHire?.expert?.id ?? 
        expertInfo?.id ??
        expertProfile?.id ?? 
        0
    );

    // ✅ Determinar si es cliente o experto
    // Si search es null, solo podemos verificar si es experto (el cliente fue eliminado)
    const isClient = search ? (userId === clientId) : false;
    const isExpert = userId === expertId || 
                     (search?.searchHire?.expert?.id && userId === Number(search.searchHire.expert.id)) ||
                     (expertInfo?.id && userId === Number(expertInfo.id)) ||
                     (expertProfile?.id && userId === Number(expertProfile.id));
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
    // ✅ Usar statusInfo.statusValue cuando esté disponible (viene del backend con valores correctos)
    const searchHireStatus = search?.searchHire?.statusInfo?.statusValue || search?.searchHire?.status;
    const canReview =
        isClient && search?.searchHire && ['completed', 'dispute_resolved'].includes(searchHireStatus || '') && !hasReviewed;
    
    const canDispute = isClient && searchHireStatus === 'awaiting_client_decision';
    const canApprove = isClient && searchHireStatus === 'awaiting_client_decision';
    const canCancel = isExpert && search?.searchHire && !['completed', 'canceled', 'disputed'].includes(searchHireStatus || '');
    const isDisputed = (isClient || isExpert) && searchHireStatus === 'disputed';
    const isDisputeResolved = (isClient || isExpert) && searchHireStatus === 'dispute_resolved';
    
    // Determinar si el experto puede responder a la disputa
    // ✅ SOLO PARA EXPERTOS: Verificar que el usuario actual es el experto de la disputa
    const canExpertRespond = isExpert && // ← AÑADIDO: Solo si es experto
        (disputes[0]?.canExpertRespond !== undefined 
            ? disputes[0].canExpertRespond 
            : (isDisputeExpert && 
               disputes[0]?.status === 'pending' && 
               !disputes[0]?.expertResponse &&
               searchHireStatus === 'disputed'));
    
    // Validación más robusta para el chat
    // ✅ Permitir ver chat si tenemos searchHireId, incluso cuando search es null (cliente eliminado)
    // Si tenemos searchHireId y el usuario está autenticado, permitir ver el chat
    // El backend validará los permisos reales cuando se intente acceder a la conversación
    const hasValidSearchHire = !!search?.searchHire?.id || !!searchHireId;
    // ✅ Si tenemos searchHireId y usuario autenticado, mostrar el chat (el backend validará permisos)
    const canViewChat = hasValidSearchHire && !!user;
    
    // ✅ DEBUG: Log para verificar por qué no se muestra el chat
    console.log('[SearchDetails] Chat visibility check:', {
        isClient,
        isExpert,
        isAdmin,
        hasSearchHireId: !!search?.searchHire?.id,
        hasSearchHireIdParam: !!searchHireId,
        hasValidSearchHire,
        canViewChat,
        userId,
        expertId,
        clientId,
        searchIsNull: search === null,
        expertInfo: expertInfo?.id,
        expertProfile: expertProfile?.id
    });

    // ✅ Usar categoría del endpoint details-complete
    const categoryName = category?.name || 'Unknown Category';

    // ✅ Verificar si el SearchHire está finalizado (según la guía)
    const isSearchHireFinalized = search?.searchHire?.statusInfo?.isFinalizationStatus === true ||
                                  (searchHireStatus && ['completed', 'canceled', 'disputed', 'dispute_resolved'].includes(searchHireStatus));

    // ✅ Función helper para determinar qué botones mostrar según la guía
    const getAppointmentButtons = () => {
        // Si SearchHire está finalizado, no mostrar ningún botón
        if (isSearchHireFinalized) {
            return {
                showPropose: false,
                showCancel: false,
                showAccept: false,
                showReject: false
            };
        }

        // Si no hay cita, solo el cliente puede proponer (si el SearchHire está en estado válido)
        if (!appointment) {
            const validHireStatuses = ['pending', 'in_progress'];
            const currentHireStatus = searchHireStatus;
            const canPropose = currentHireStatus ? validHireStatuses.includes(currentHireStatus) : false;
            
            return {
                showPropose: isClient && canPropose,
                showCancel: false,
                showAccept: false,
                showReject: false
            };
        }

        const status = appointment.status;

        if (isClient) {
            // BOTONES PARA CLIENTE según la guía
            return {
                showPropose: [
                    'awaiting_appointment',
                    'appointment_rejected',
                    'appointment_cancelled_by_client',
                    'appointment_cancelled_by_expert'
                ].includes(status),
                showCancel: status === 'appointment_confirmed',
                showAccept: false,
                showReject: false
            };
        } else if (isExpert) {
            // BOTONES PARA EXPERTO según la guía
            return {
                showPropose: false,
                showCancel: status === 'appointment_confirmed',
                showAccept: status === 'appointment_proposed',
                showReject: status === 'appointment_proposed'
            };
        }

        return {
            showPropose: false,
            showCancel: false,
            showAccept: false,
            showReject: false
        };
    };

    const appointmentButtons = getAppointmentButtons();

    // ✅ Función para verificar si se puede proponer una cita (compatibilidad con código existente)
    const canProposeAppointment = () => {
        if (isSearchHireFinalized) return false;
        return appointmentButtons.showPropose;
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
                
                showToast('success', 'Cita cancelada exitosamente');
            } else {
            const rejectData: RejectAppointmentDto = {
                appointmentId: appointmentToReject.id,
                reason: reason
            };
            
            await rejectAppointment(rejectData);
            
            showToast('success', 'Cita rechazada exitosamente');
            }
            
            setShowRejectModal(false);
            setAppointmentToReject(null);
            invalidateAll();
            
        } catch (error: any) {
            console.error(`Error al ${modalActionType === 'cancel' ? 'cancelar' : 'rechazar'} cita:`, error);
            // Extraer el mensaje del backend si está disponible
            const errorMessage = error?.message || `Error al ${modalActionType === 'cancel' ? 'cancelar' : 'rechazar'} la cita`;
            showToast('error', errorMessage);
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
                    showToast('success', 'Cita confirmada exitosamente');
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
        } catch (error: any) {
            console.error('Error en acción de cita:', error);
            // Extraer el mensaje del backend si está disponible
            const errorMessage = error?.message || 'Error al realizar la acción';
            showToast('error', errorMessage);
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
                    showToast('error', errorMessage);
                    return;
                }
                
                await proposeAppointment(appointmentData.searchHireId, data);
                showToast('success', 'Cita propuesta exitosamente');
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
            showToast('error', errorMessage);
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

    // ✅ Manejo elegante de errores con toast (DEBE estar antes de cualquier return)
    useErrorHandler(error, isError);

    // Only show loading for critical queries
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-white text-black">
                <p className="text-lg">Cargando...</p>
            </div>
        );
    }

    // Verificar si es error de red
    const isNetworkErr = isError && error && isNetworkError(error);
    
    // Solo mostrar pantalla de error si es crítico y no es un error de red (los de red se manejan con toast)
    if (isError && error && !isNetworkErr) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 p-4">
                <div className="text-center space-y-6 max-w-md">
                    <div className="flex justify-center">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 rounded-full blur-xl opacity-50"></div>
                            <div className="relative w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center border-2 border-gray-200 dark:border-gray-700">
                                <AlertCircle className="w-12 h-12 text-gray-400 dark:text-gray-500" strokeWidth={1.5} />
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                            {error?.message || 'Ha ocurrido un error inesperado'}
                        </p>
                    </div>
                    <Button
                        onClick={() => invalidateAll()}
                        variant="outline"
                        size="sm"
                        className="mt-4"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Reintentar
                    </Button>
                </div>
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
                                    {search?.title || serviceInfo?.name || category?.name || 'Contratación'}
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

            {/* ✅ Mensaje simple para errores de red */}
            {isNetworkErr && (
                <div className="flex flex-col items-center justify-center py-16 px-4 min-h-[60vh]">
                    <div className="flex flex-col items-center gap-4 max-w-sm text-center">
                        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                            <WifiOff className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                No se pudo conectar con el servidor
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                                Intenta nuevamente en unos minutos
                            </p>
                        </div>
                        <Button
                            onClick={() => invalidateAll()}
                            variant="outline"
                            size="sm"
                            className="mt-2"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Reintentar
                        </Button>
                    </div>
                </div>
            )}

            {/* Main Layout - Dos columnas en desktop, tabs en móvil */}
            {!isNetworkErr && (
            <div className="flex flex-col lg:flex-row h-[calc(100vh-80px)] bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-950 dark:to-gray-900 lg:gap-6 lg:p-6">
                {/* Chat Section - Izquierda en desktop, tabs en móvil */}
                {canViewChat && (
                    <div className="flex-1 lg:w-[60%] xl:w-[65%] bg-white dark:bg-gray-900 flex flex-col lg:rounded-2xl lg:shadow-xl lg:border lg:border-gray-200/50 dark:border-gray-800/50 lg:overflow-hidden flex-shrink-0">
                        {/* Tabs - Solo en móvil */}
                        <Tabs value={activeTab || 'chat'} onValueChange={(value: string) => setActiveTab(value as 'chat' | 'details')} className="w-full flex flex-col flex-1 min-h-0">
                            <div className="border-b border-border bg-background/95 backdrop-blur-sm p-2 sticky top-[80px] z-40 lg:hidden">
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
                            </div>

                            {/* Chat Content - Visible siempre en desktop, solo en tab chat en móvil */}
                            <TabsContent value="chat" className="mt-0 flex-1 flex flex-col lg:mt-0 lg:flex min-h-0">
                                <div className="h-full flex-1 min-h-0 relative flex flex-col">
                                    <Chat 
                                        searchId={searchId} 
                                        searchHireId={searchHireId}
                                        isExpert={!!isExpert} 
                                        expertData={{
                                            name: expertData?.name, 
                                            profilePictureUrl: expertData?.profilePictureUrl 
                                        }}
                                    />
                                </div>
                            </TabsContent>
                                    
                            {/* Details Content - Solo visible en móvil (en desktop está en la columna derecha) */}
                            <TabsContent value="details" className="mt-0 flex-1 flex flex-col lg:hidden">
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
                                                    accept={(() => {
                                                        // ✅ Generar accept dinámicamente basado en requiredDeliverableTypes
                                                        if (requiredDeliverableTypes && requiredDeliverableTypes.length > 0) {
                                                            const extensions = requiredDeliverableTypes.map(type => {
                                                                const typeName = type.name.toUpperCase();
                                                                if (typeName === 'PDF') return '.pdf';
                                                                if (typeName === 'VIDEO' || typeName === 'MP4') return '.mp4';
                                                                return '';
                                                            }).filter(ext => ext !== '').join(',');
                                                            return extensions || '.pdf,.mp4';
                                                        }
                                                        return '.pdf,.mp4';
                                                    })()}
                                                    onChange={handleDeliverableFileChange}
                                                    className="hidden"
                                                />
                                                <div className="w-full p-4 border-2 border-dashed border-border rounded-md cursor-pointer hover:bg-muted/50 transition-colors text-center">
                                                    <Upload className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                                                    <p className="text-sm font-medium text-foreground mb-1">Seleccionar archivos</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {(() => {
                                                            // ✅ Mostrar tipos requeridos dinámicamente
                                                            if (requiredDeliverableTypes && requiredDeliverableTypes.length > 0) {
                                                                const typesText = requiredDeliverableTypes
                                                                    .map(type => type.displayName || type.name)
                                                                    .join(' y ');
                                                                return `${typesText} (máx. 10MB)`;
                                                            }
                                                            return 'PDF o MP4 (máx. 10MB)';
                                                        })()}
                                                    </p>
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
                                                    disabled={(fileValidation ? !fileValidation.canSubmit : false) || isSubmittingReport}
                                                size="sm"
                                                >
                                                {isSubmittingReport ? (
                                                    <>
                                                        <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                        </svg>
                                                        Enviando...
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckCircle className="w-4 h-4 mr-2" />
                                                        Enviar Reporte
                                                    </>
                                                )}
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
                                    
                                    {/* ✅ Botones de acción fijos en móvil - Según la guía */}
                                    {(appointmentButtons.showPropose || appointmentButtons.showCancel || appointmentButtons.showAccept || appointmentButtons.showReject || canDispute || canApprove || canExpertRespond) && (
                                        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border z-50 p-4 space-y-2 shadow-lg">
                                            <div className="flex gap-2">
                                                {/* ✅ BOTÓN: Aceptar (Solo Experto, solo cuando appointment_proposed) */}
                                                {appointmentButtons.showAccept && (
                                                    <Button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            setAppointmentToConfirm(appointment as Appointment);
                                                            setShowConfirmAppointmentDialog(true);
                                                        }}
                                                        className="flex-1"
                                                        size="sm"
                                                        disabled={isConfirming || isRejecting}
                                                    >
                                                        {isConfirming ? (
                                                            <>
                                                                <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                                </svg>
                                                                Aceptando...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                                Aceptar
                                                            </>
                                                        )}
                                                    </Button>
                                                )}
                                                
                                                {/* ✅ BOTÓN: Rechazar (Solo Experto, solo cuando appointment_proposed) */}
                                                {appointmentButtons.showReject && (
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
                                                        disabled={isConfirming || isRejecting}
                                                    >
                                                        {isRejecting ? (
                                                            <>
                                                                <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                                </svg>
                                                                Rechazando...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <XCircle className="w-4 h-4 mr-2" />
                                                                Rechazar
                                                            </>
                                                        )}
                                                    </Button>
                                                )}
                                                
                                                {/* ✅ BOTÓN: Cancelar (Cliente o Experto, solo cuando appointment_confirmed) */}
                                                {appointmentButtons.showCancel && (
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
                                                        disabled={isCancelling}
                                                    >
                                                        {isCancelling ? (
                                                            <>
                                                                <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                                </svg>
                                                                Cancelando...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <XCircle className="w-4 h-4 mr-2" />
                                                                Cancelar Cita
                                                            </>
                                                        )}
                                                    </Button>
                                                )}
                                            </div>
                                            
                                            {/* ✅ BOTÓN: Proponer (Solo Cliente) */}
                                            {appointmentButtons.showPropose && (
                                                <Button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        handleAppointmentAction('propose', { 
                                                            id: 0, 
                                                            searchHireId: search?.searchHire?.id || searchHireId || 0,
                                                            status: 'awaiting_appointment',
                                                            amount: serviceInfo?.price || 0
                                                        } as Appointment);
                                                    }}
                                                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                                                    size="sm"
                                                    disabled={isProposing}
                                                >
                                                    {isProposing ? (
                                                        <>
                                                            <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                            </svg>
                                                            Proponiendo...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Calendar className="w-4 h-4 mr-2" />
                                                            {appointment && appointment.status === 'appointment_cancelled_by_expert' 
                                                                ? 'Proponer Nueva Cita'
                                                                : 'Programar Cita'
                                                            }
                                                        </>
                                                    )}
                                                </Button>
                                            )}
                                            
                                            {/* ✅ Acciones Principales - Aprobar/Disputar/Responder */}
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
                                            disabled={fileValidation ? !fileValidation.canSubmit : false || isSubmittingReport}
                                            size="sm"
                                        >
                                            {isSubmittingReport ? (
                                                <>
                                                    <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                    </svg>
                                                    Enviando...
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle className="w-4 h-4 mr-2" />
                                                    Enviar Reporte
                                                </>
                                            )}
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
                                    {appointmentButtons.showPropose && (
                                        <Button
                                            onClick={() => handleAppointmentAction('propose', { 
                                                id: 0, 
                                                searchHireId: search?.searchHire?.id || 0,
                                                status: 'awaiting_appointment',
                                                amount: serviceInfo?.price || 0
                                            } as Appointment)}
                                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] rounded-lg"
                                            size="lg"
                                            disabled={isProposing}
                                        >
                                            {isProposing ? (
                                                <>
                                                    <svg className="w-5 h-5 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                    </svg>
                                                    Proponiendo...
                                                </>
                                            ) : (
                                                <>
                                                    <Calendar className="w-5 h-5 mr-2" />
                                                    {appointment && appointment.status === 'appointment_cancelled_by_expert' 
                                                        ? 'Proponer Nueva Cita'
                                                        : 'Programar Cita'
                                                    }
                                                </>
                                            )}
                                        </Button>
                                    )}
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                )}

                {/* Sidebar - Info + Acciones - Derecha en desktop, oculto en móvil (usa tabs) */}
                <aside className="hidden lg:flex lg:flex-col lg:w-[40%] xl:w-[35%] bg-white dark:bg-gray-900 lg:rounded-2xl lg:shadow-xl lg:border lg:border-gray-200/50 dark:border-gray-800/50 lg:overflow-hidden">
                    <ScrollArea className="flex-1">
                        <div className="p-6 space-y-5">
                            
                            {/* Resumen del Servicio */}
                            <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/30 rounded-2xl border border-gray-200/60 dark:border-gray-800/60 p-6 space-y-4 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-gray-300/60 dark:hover:border-gray-700/60">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-1 h-5 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
                                    <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 tracking-tight">Información del Servicio</h3>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2.5 text-sm">
                                        <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                                            <Tag className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <span className="font-medium text-gray-700 dark:text-gray-300">{serviceInfo?.categoryName || category?.name || 'N/A'}</span>
                                </div>
                                    {serviceInfo?.serviceTypeName && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="text-gray-500 dark:text-gray-400">Tipo:</span>
                                            <span className="text-gray-900 dark:text-gray-100 font-semibold">{serviceInfo.serviceTypeName}</span>
                                        </div>
                                    )}
                                    {search?.description && (
                                        <div className="text-sm leading-relaxed">
                                            <span className="text-gray-500 dark:text-gray-400 block mb-1">Descripción:</span>
                                            <span className="text-gray-700 dark:text-gray-300">{search.description}</span>
                                        </div>
                                    )}
                                    {search?.createdAt && (
                                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 rounded-lg">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span>Creado el {new Date(search.createdAt).toLocaleDateString('es-ES', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric'
                                            })}</span>
                                        </div>
                                    )}
                                    {serviceInfo?.locationRange && (
                                        <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 rounded-lg">
                                            Radio de servicio: <span className="font-medium text-gray-700 dark:text-gray-300">{serviceInfo.locationRange} km</span>
                                        </div>
                                    )}
                                    {serviceInfo?.price && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="text-gray-500 dark:text-gray-400">Precio:</span>
                                            <span className="text-gray-900 dark:text-gray-100 font-semibold">
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
                                    <div className="mt-5 hidden lg:block">
                                        <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/30 rounded-2xl border border-gray-200/60 dark:border-gray-800/60 p-6 space-y-4 shadow-sm">
                                            <div className="flex items-center gap-2 mb-4">
                                                <div className="w-1 h-5 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
                                                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                                                    {appointment ? (
                                                        appointmentStatusInfo?.displayName || 
                                                        (appointment.status === 'appointment_proposed' ? 'Cita Propuesta' : 
                                                         appointment.status === 'appointment_confirmed' ? 'Cita Confirmada' : 
                                                         'Cita')
                                                    ) : 'Cita Pendiente'}
                                                </h3>
                                            </div>
                                            <div className="space-y-2.5">
                                                {appointment ? (
                                                    <>
                                                        {appointment.proposedDate && appointment.proposedTime && (
                                                            <div className="flex items-center gap-2.5 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-xl">
                                                                <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                                                    <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                                </div>
                                                                <span className="font-semibold text-gray-900 dark:text-gray-100">
                                                                    {new Date(appointment.proposedDate).toLocaleDateString('es-ES', {
                                                                        day: 'numeric',
                                                                        month: 'short',
                                                                        year: 'numeric'
                                                                    })} {appointment.proposedTime.substring(0, 5)}
                                                                </span>
                                                            </div>
                                                        )}
                                                        {appointment.location && (
                                                            <div className="flex items-start gap-2.5 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                                                                <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700/50">
                                                                    <MapPin className="w-4 h-4 text-gray-600 dark:text-gray-400 flex-shrink-0 mt-0.5" />
                                                                </div>
                                                                <div className="flex-1">
                                                                    <span className="leading-relaxed text-gray-700 dark:text-gray-300">{appointment.location}</span>
                                                                    {appointment.doorNumber && (
                                                                        <div className="text-sm text-gray-700 dark:text-gray-300 mt-2 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 rounded-lg">
                                                                            <span className="text-gray-500 dark:text-gray-400">Puerta: </span>
                                                                            <span className="font-semibold">{appointment.doorNumber}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                        {appointment.doorNumber && !appointment.location && (
                                                            <div className="text-sm text-gray-700 dark:text-gray-300 ml-6 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 rounded-lg">
                                                                <span className="text-gray-500 dark:text-gray-400">Puerta: </span>
                                                                <span className="font-semibold">{appointment.doorNumber}</span>
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
                                        </div>
                                    </div>
                                )}

                                {/* ✅ Botones de acción para desktop - Según la guía - Fuera de needsAppointment para que siempre se muestren */}
                                {(appointmentButtons.showPropose || appointmentButtons.showCancel || appointmentButtons.showAccept || appointmentButtons.showReject) && (
                                    <div className="mt-5 hidden lg:block">
                                        <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/30 rounded-2xl border border-gray-200/60 dark:border-gray-800/60 p-6 space-y-4 shadow-sm">
                                            <div className="flex gap-2">
                                                {/* ✅ BOTÓN: Aceptar (Solo Experto, solo cuando appointment_proposed) */}
                                                {appointmentButtons.showAccept && (
                                                    <Button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            setAppointmentToConfirm(appointment as Appointment);
                                                            setShowConfirmAppointmentDialog(true);
                                                        }}
                                                        className="flex-1"
                                                        size="sm"
                                                        disabled={isConfirming || isRejecting}
                                                    >
                                                        {isConfirming ? (
                                                            <>
                                                                <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                                </svg>
                                                                Aceptando...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                                Aceptar
                                                            </>
                                                        )}
                                                    </Button>
                                                )}
                                                
                                                {/* ✅ BOTÓN: Rechazar (Solo Experto, solo cuando appointment_proposed) */}
                                                {appointmentButtons.showReject && (
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
                                                        disabled={isConfirming || isRejecting}
                                                    >
                                                        {isRejecting ? (
                                                            <>
                                                                <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                                </svg>
                                                                Rechazando...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <XCircle className="w-4 h-4 mr-2" />
                                                                Rechazar
                                                            </>
                                                        )}
                                                    </Button>
                                                )}
                                                
                                                {/* ✅ BOTÓN: Cancelar (Cliente o Experto, solo cuando appointment_confirmed) */}
                                                {appointmentButtons.showCancel && (
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
                                                        disabled={isCancelling}
                                                    >
                                                        {isCancelling ? (
                                                            <>
                                                                <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                                </svg>
                                                                Cancelando...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <XCircle className="w-4 h-4 mr-2" />
                                                                Cancelar Cita
                                                            </>
                                                        )}
                                                    </Button>
                                                )}
                                                
                                                {/* ✅ BOTÓN: Proponer (Solo Cliente) */}
                                                {appointmentButtons.showPropose && (
                                                    <Button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            handleAppointmentAction('propose', { 
                                                                id: 0, 
                                                                searchHireId: search?.searchHire?.id || searchHireId || 0,
                                                                status: 'awaiting_appointment',
                                                                amount: serviceInfo?.price || 0
                                                            } as Appointment);
                                                        }}
                                                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                                                        size="sm"
                                                        disabled={isProposing}
                                                    >
                                                        {isProposing ? (
                                                            <>
                                                                <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                                </svg>
                                                                Proponiendo...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Calendar className="w-4 h-4 mr-2" />
                                                                {appointment && appointment.status === 'appointment_cancelled_by_expert' 
                                                                    ? 'Proponer Nueva Cita'
                                                                    : 'Programar Cita'
                                                                }
                                                            </>
                                                        )}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Cliente */}
                            {search?.user && (
                                <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/30 rounded-2xl border border-gray-200/60 dark:border-gray-800/60 p-6 space-y-4 shadow-sm">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-1 h-5 bg-gradient-to-b from-purple-500 to-pink-600 rounded-full"></div>
                                        <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 tracking-tight">Cliente</h3>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Avatar className="h-14 w-14 ring-2 ring-gray-200 dark:ring-gray-700 ring-offset-2 ring-offset-white dark:ring-offset-gray-900">
                                            <AvatarImage 
                                                src={search.user.profilePictureUrl || undefined} 
                                                alt={search.user.name}
                                            />
                                            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-base font-bold">
                                                {search.user.name?.charAt(0).toUpperCase() || 'C'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-base font-bold text-gray-900 dark:text-gray-100 truncate">{search.user.name}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">{search.user.email}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Experto */}
                        {expertData && (
                                <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/30 rounded-2xl border border-gray-200/60 dark:border-gray-800/60 p-6 space-y-4 shadow-sm">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-1 h-5 bg-gradient-to-b from-blue-500 to-cyan-600 rounded-full"></div>
                                        <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 tracking-tight">Experto</h3>
                                    </div>
                                    <div className="flex items-center gap-4">
                                            <Avatar className="h-14 w-14 ring-2 ring-blue-200 dark:ring-blue-800 ring-offset-2 ring-offset-white dark:ring-offset-gray-900">
                                                <AvatarImage 
                                                    src={expertData.profilePictureUrl || undefined} 
                                            alt={expertData.name}
                                                />
                                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white text-base font-bold">
                                                    {expertData.name?.charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-base font-bold text-gray-900 dark:text-gray-100 truncate">{expertData.name}</p>
                                                    <div className="flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 rounded-full">
                                                        <CheckCircle className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                                                        <span className="text-xs font-medium text-green-700 dark:text-green-400">Verificado</span>
                                                    </div>
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
                            )}


                            {/* Acciones Principales */}
                            {(canDispute || canApprove || canExpertRespond) && (
                                <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/30 rounded-2xl border border-gray-200/60 dark:border-gray-800/60 p-6 space-y-3 shadow-sm">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-1 h-5 bg-gradient-to-b from-orange-500 to-red-600 rounded-full"></div>
                                        <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 tracking-tight">Acciones</h3>
                                    </div>
                                    <div className="space-y-2.5">
                                        {canApprove && (
                                            <Button
                                                onClick={handleApproveService}
                                                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200 h-11"
                                                size="lg"
                                            >
                                                <CheckCircle className="w-5 h-5 mr-2" />
                                                Aprobar Servicio
                                            </Button>
                                        )}
                                        {canDispute && (
                                            <Button
                                                onClick={() => setModalState((prev) => ({ ...prev, showDisputeModal: true }))}
                                                variant="outline"
                                                className="w-full border-2 border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 font-semibold h-11"
                                                size="lg"
                                            >
                                                <AlertTriangle className="w-5 h-5 mr-2" />
                                                Disputar
                                            </Button>
                                        )}
                                        {canExpertRespond && (
                                            <Button
                                                onClick={() => setShowExpertResponseModal(true)}
                                                variant="outline"
                                                className="w-full border-2 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 font-semibold h-11"
                                                size="lg"
                                            >
                                                <MessageCircle className="w-5 h-5 mr-2" />
                                                Responder Disputa
                                            </Button>
                                        )}
                                </div>
                                </div>
                        )}


                            {/* Subir Informe */}
                        {isExpert && appointment?.status === 'appointment_awaiting_report' && (
                                <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/30 rounded-2xl border border-gray-200/60 dark:border-gray-800/60 p-6 space-y-4 shadow-sm">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-1 h-5 bg-gradient-to-b from-green-500 to-emerald-600 rounded-full"></div>
                                        <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 tracking-tight">Subir Informe</h3>
                                    </div>
                                {fileValidation && (
                                            <div className={`p-3 rounded-xl text-sm font-medium ${
                                        fileValidation.canSubmit 
                                                    ? 'bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/50 text-green-800 dark:text-green-300' 
                                                    : 'bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 text-blue-800 dark:text-blue-300'
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
                                            accept={(() => {
                                                // ✅ Generar accept dinámicamente basado en requiredDeliverableTypes
                                                if (requiredDeliverableTypes && requiredDeliverableTypes.length > 0) {
                                                    const extensions = requiredDeliverableTypes.map(type => {
                                                        const typeName = type.name.toUpperCase();
                                                        if (typeName === 'PDF') return '.pdf';
                                                        if (typeName === 'VIDEO' || typeName === 'MP4') return '.mp4';
                                                        return '';
                                                    }).filter(ext => ext !== '').join(',');
                                                    return extensions || '.pdf,.mp4';
                                                }
                                                return '.pdf,.mp4';
                                            })()}
                                            onChange={handleDeliverableFileChange}
                                            className="hidden"
                                        />
                                            <div className="w-full p-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:border-gray-400 dark:hover:border-gray-600 transition-all duration-200 text-center group">
                                                <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 w-fit mx-auto mb-3 group-hover:bg-gray-200 dark:group-hover:bg-gray-700 transition-colors">
                                                    <Upload className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                                                </div>
                                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Seleccionar archivos</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {(() => {
                                                        // ✅ Mostrar tipos requeridos dinámicamente
                                                        if (requiredDeliverableTypes && requiredDeliverableTypes.length > 0) {
                                                            const typesText = requiredDeliverableTypes
                                                                .map(type => type.displayName || type.name)
                                                                .join(' y ');
                                                            return `${typesText} (máx. 10MB)`;
                                                        }
                                                        return 'PDF o MP4 (máx. 10MB)';
                                                    })()}
                                                </p>
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
                                            className={`w-full font-semibold shadow-md hover:shadow-lg transition-all duration-200 h-11 ${
                                                fileValidation && !fileValidation.canSubmit
                                                    ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed text-gray-500'
                                                    : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'
                                            }`}
                                            disabled={fileValidation ? !fileValidation.canSubmit : false || isSubmittingReport}
                                            size="lg"
                                        >
                                            {isSubmittingReport ? (
                                                <>
                                                    <svg className="w-5 h-5 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                    </svg>
                                                    Enviando...
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle className="w-5 h-5 mr-2" />
                                                    Enviar Reporte
                                                </>
                                            )}
                                        </Button>
                                </div>
                            )}

                            {/* Reseña */}
                            {canReview && (
                                <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/30 rounded-2xl border border-gray-200/60 dark:border-gray-800/60 p-6 space-y-4 shadow-sm">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-1 h-5 bg-gradient-to-b from-yellow-500 to-orange-600 rounded-full"></div>
                                        <div className="flex items-center gap-2">
                                            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                                            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 tracking-tight">Reseña</h3>
                                        </div>
                                </div>
                                        <Button
                                            onClick={() => setModalState((prev) => ({ ...prev, showReviewModal: true }))}
                                            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200 h-11"
                                            size="lg"
                                        >
                                            <Star className="w-5 h-5 mr-2" />
                                            Escribir Reseña
                                        </Button>
                            </div>
                            )}

                            {review && (
                                <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/30 rounded-2xl border border-gray-200/60 dark:border-gray-800/60 p-6 space-y-4 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                                            <span className="text-base font-bold text-gray-900 dark:text-gray-100">Reseña</span>
                                        </div>
                                        <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold px-3 py-1 text-sm">{review.score}/5</Badge>
                                    </div>
                                    {review.description && (
                                        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
                                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                                {review.description}
                                            </p>
                                </div>
                                )}
                            </div>
                            )}

                            {/* Programar Cita - Solo en móvil (en desktop está dentro de la card) */}
                            <div className="lg:hidden">
                            {appointmentButtons.showPropose && (
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
                                        disabled={isProposing}
                                    >
                                        {isProposing ? (
                                            <>
                                                <svg className="w-5 h-5 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                                Proponiendo...
                                            </>
                                        ) : (
                                            <>
                                                <Calendar className="w-5 h-5 mr-2" />
                                                {appointment && appointment.status === 'appointment_cancelled_by_expert' 
                                                    ? 'Proponer Nueva Cita'
                                                    : 'Programar Cita'
                                                }
                                            </>
                                        )}
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
            )}

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
                    isLoading={isProposing}
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
                isLoading={modalActionType === 'cancel' ? isCancelling : isRejecting}
                    actionType={modalActionType}
                userRole={userRole}
            />
            )}

            {/* Alert Dialog para confirmar cita */}
            <AlertDialog open={showConfirmAppointmentDialog} onOpenChange={setShowConfirmAppointmentDialog}>
                <AlertDialogContent className="border-t-4 border-destructive">
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
                        <AlertDialogCancel disabled={isConfirming}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (appointmentToConfirm) {
                                    handleAppointmentAction('confirm', appointmentToConfirm);
                                }
                            }}
                            disabled={isConfirming}
                        >
                            {isConfirming ? (
                                <>
                                    <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Confirmando...
                                </>
                            ) : (
                                'Confirmar'
                            )}
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

        </div>
    );
}