import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Star, AlertTriangle, MessageCircle, Upload, Share2, FileText, MessageSquare, Calendar, CheckCircle, XCircle, MapPin, Home, Phone, Info, Euro, Tag, Clock, X, Users, Award, Activity, FileCheck, Download, WifiOff, RefreshCw, AlertCircle, List } from 'lucide-react';
import CountryFlag from './CountryFlag';
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
import {
    canLeaveReview,
    canProposeAppointment,
    isDisputeResolvedStatus,
    isTerminalSearchHireStatus,
    SEARCH_HIRE_STATUS,
} from '../constants/hireStatuses';
import { useExpertResponse } from '../hooks/useExpertResponse';
import { getPriceDisplay } from '../utils/priceUtils';

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
    searchHireId?: number; // ✅ Opcional: si se pasa, se usa directamente (para rutas /searchhire/:id)
}

const categoryBanners: { [key: number]: string } = {
    1: '/src/media/Car.png',
    2: '/src/media/motorcycle.png',
    3: '/src/media/house.png',
};

const statusRoadmap = [
    { label: 'Pendiente', status: 'pending', color: 'bg-yellow-600' },
    { label: 'En revisión', status: 'awaiting_client_decision', color: 'bg-blue-600' },
    { label: 'Completado', status: 'completed', color: 'bg-green-600' },
];

export default function SearchDetails({ isAdmin, onBack, searchHireId: searchHireIdProp }: SearchDetailsProps) {
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

    // Prevent body scroll completely - no scroll on main page EVER
    useEffect(() => {
        const originalOverflow = document.body.style.overflow;
        const originalPosition = document.body.style.position;
        const originalWidth = document.body.style.width;
        const originalHeight = document.body.style.height;
        
        // Always prevent body scroll
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
        document.body.style.height = '100vh';
            
            // Scroll chat to bottom when switching to chat tab - multiple attempts for reliability
        if (activeTab === 'chat' || !activeTab) {
            const scrollToBottom = () => {
                const chatContainer = document.querySelector('[data-chat-messages]')?.parentElement as HTMLElement;
                if (chatContainer) {
                    chatContainer.scrollTop = chatContainer.scrollHeight;
                }
                const messagesEnd = document.querySelector('[data-chat-messages]')?.lastElementChild as HTMLElement;
                if (messagesEnd) {
                    messagesEnd.scrollIntoView({ behavior: 'auto', block: 'end' });
                }
            };
            
            // Try multiple times to ensure it works
            setTimeout(scrollToBottom, 100);
            setTimeout(scrollToBottom, 250);
            setTimeout(scrollToBottom, 400);
        }

        return () => {
            document.body.style.overflow = originalOverflow || '';
            document.body.style.position = originalPosition || '';
            document.body.style.width = originalWidth || '';
            document.body.style.height = originalHeight || '';
        };
    }, [activeTab]);

    const { user } = useAuth();

    // Scroll page to top when component mounts or searchId changes
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'auto' });
    }, [searchIdParam]);

    // ? HOOK OPTIMIZADO - Reemplaza múltiples queries
    // ✅ Obtener searchHireId desde prop, URL query params, o intentar obtenerlo de los datos después
    // Prioridad: 1) Prop searchHireId, 2) Query param, 3) De los datos
    const searchHireIdFromUrl = new URLSearchParams(window.location.search).get('searchHireId');
    const initialSearchHireId = searchHireIdProp || (searchHireIdFromUrl ? parseInt(searchHireIdFromUrl, 10) : undefined);
    
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
    const { expertResponse, debugDispute, useDisputeBySearchHire } = useDisputes();
    
    // Obtener disputa por searchHireId
    const { data: disputeData, isLoading: isLoadingDispute } = useDisputeBySearchHire(searchHireId || 0);
    
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
                
                // Si no hay tipos requeridos definidos, no hay nada que validar
                if (!result.requiredTypes || result.requiredTypes.length === 0) {
                    return { canSubmit: true, message: 'No hay tipos de archivo requeridos definidos' };
                }
                
                // Si hay tipos requeridos pero no hay archivos subidos
                if (result.uploadedFiles && result.uploadedFiles.length === 0 && result.requiredTypes && result.requiredTypes.length > 0) {
                    const requiredText = result.requiredTypes.map((t: any) => t.displayName || t.name).join(' y ');
                    return { 
                        canSubmit: false, 
                        message: `Para enviar el reporte necesitas subir: ${requiredText}` 
                    };
                }
                
                if (result.isValid) {
                    return { canSubmit: true, message: 'Todos los archivos requeridos están subidos' };
                } else {
                    const missingText = result.missingFiles && result.missingFiles.length > 0 
                        ? result.missingFiles.join(' y ')
                        : result.requiredTypes?.map((t: any) => t.displayName || t.name).join(' y ') || 'archivos requeridos';
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
    // ✅ También intentar obtener clientId de searchHire.client si está disponible
    const clientId = Number(
        search?.userId ?? 
        search?.searchHire?.client?.id ?? 
        0
    );
    // ✅ Cuando search es null, obtener expertId de expertProfile, expertInfo o searchHire
    const expertId = Number(
        search?.searchHire?.expert?.id ?? 
        expertInfo?.id ??
        expertProfile?.id ?? 
        0
    );

    const isExpert = userId === expertId || 
                     (search?.searchHire?.expert?.id && userId === Number(search.searchHire.expert.id)) ||
                     (expertInfo?.id && userId === Number(expertInfo.id)) ||
                     (expertProfile?.id && userId === Number(expertProfile.id));
    const isClient = clientId > 0
        ? userId === clientId
        : !isExpert && !isAdmin && !!user;
    const userRole = isClient ? 'client' : 'expert';
    
    // Debug: Verificar isExpert
    console.log('[SearchDetails] isExpert:', isExpert);
    
    // ✅ CORRECTO: Usar datos del experto del nivel superior, NO de user.profilePictureUrl (que siempre es null)
    const expertData = isExpert && user ? {
        name: user.name || expertInfo?.name || 'Experto',
        // ✅ Usar profilePictureUrl del nivel superior del experto, NO de user
        profilePictureUrl: expertInfo?.profilePictureUrl || ''
    } : expertInfo;
    
    const isDisputeExpert = userId === Number(disputes[0]?.expert?.id ?? search?.searchHire?.expert?.id ?? 0);
    
    // ✅ Usar la información de review del endpoint details-complete
    const hasReviewed = !!review;
    // ✅ Usar statusInfo.statusValue cuando esté disponible (viene del backend con valores correctos)
    const searchHireStatus = search?.searchHire?.statusInfo?.statusValue || search?.searchHire?.status;
    const searchHireStatusInfoObj = search?.searchHire?.statusInfo;
    const canReview =
        isClient && search?.searchHire && canLeaveReview(searchHireStatus || '') && !hasReviewed;
    
    const canDispute = isClient && searchHireStatus === SEARCH_HIRE_STATUS.AWAITING_CLIENT_DECISION;
    const canApprove = isClient && searchHireStatus === SEARCH_HIRE_STATUS.AWAITING_CLIENT_DECISION;
    const nonCancellableStatuses = [
        SEARCH_HIRE_STATUS.COMPLETED,
        SEARCH_HIRE_STATUS.CANCELLED,
        SEARCH_HIRE_STATUS.DISPUTED,
    ];
    const canCancel = isExpert && search?.searchHire && !nonCancellableStatuses.includes(searchHireStatus || '');
    const isDisputed = (isClient || isExpert) && searchHireStatus === SEARCH_HIRE_STATUS.DISPUTED;
    const isDisputeResolved = (isClient || isExpert) && isDisputeResolvedStatus(searchHireStatus || '');
    
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

    const isSearchHireFinalized = isTerminalSearchHireStatus(
        searchHireStatus || '',
        searchHireStatusInfoObj
    );

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
            const currentHireStatus = searchHireStatus || '';
            const canPropose = !isSearchHireFinalized && canProposeAppointment(currentHireStatus, isSearchHireFinalized);
            
            console.log('[SearchDetails] getAppointmentButtons - No appointment:', {
                isClient,
                canPropose,
                currentHireStatus,
                isSearchHireFinalized,
                hasSearchHire: !!search?.searchHire
            });
            
            return {
                showPropose: isClient && canPropose && !!search?.searchHire, // ✅ Asegurar que existe searchHire
                showCancel: false,
                showAccept: false,
                showReject: false
            };
        }

        const status = appointment.status;
        
        // ✅ Verificar si hay una propuesta activa (timer de tipo "proposal" o "response")
        // ✅ NORMALIZAR: Asegurar que timerType esté en lowercase para comparación
        const hasActiveProposal = appointment.timers && appointment.timers.some((timer: any) => {
          const timerType = (timer.timerType || '').toLowerCase();
          return (timerType === 'proposal' || timerType === 'response') && !timer.isExpired;
        });
        
        console.log('[SearchDetails] getAppointmentButtons:', {
            status,
            hasActiveProposal,
            timers: appointment.timers,
            isClient,
            isExpert
        });

        if (isClient) {
            // BOTONES PARA CLIENTE según la guía
            // ✅ CORREGIDO: En 'awaiting_appointment' el cliente SIEMPRE puede proponer cita
            // El timer activo solo indica que hay tiempo restante, no que no se pueda proponer
            // Solo mostrar "Proponer" si:
            // 1. No hay cita (ya manejado arriba)
            // 2. Estado es 'awaiting_appointment' (cliente puede proponer siempre)
            // 3. La cita fue rechazada o cancelada
            const canProposeWhenAwaiting = status === 'awaiting_appointment'; // ✅ SIEMPRE permitir si es awaiting_appointment
            const canProposeWhenRejectedOrCancelled = [
                'appointment_rejected',
                'appointment_cancelled_by_client',
                'appointment_cancelled_by_expert'
            ].includes(status);
            
            console.log('[SearchDetails] getAppointmentButtons - Client logic:', {
                status,
                canProposeWhenAwaiting,
                canProposeWhenRejectedOrCancelled,
                hasActiveProposal,
                showPropose: canProposeWhenAwaiting || canProposeWhenRejectedOrCancelled
            });
            
            return {
                showPropose: canProposeWhenAwaiting || canProposeWhenRejectedOrCancelled,
                showCancel: status === 'appointment_confirmed',
                showAccept: false,
                showReject: false
            };
        } else if (isExpert) {
            // BOTONES PARA EXPERTO según la guía
            // ✅ CORREGIDO: El experto solo puede aceptar/rechazar cuando:
            // 1. Estado es 'appointment_proposed' (formato antiguo), O
            // 2. Estado es 'awaiting_appointment' PERO hay una propuesta REAL (fecha y hora propuestas)
            // NO mostrar si es 'awaiting_appointment' pero NO hay fecha/hora propuesta (cliente aún no ha propuesto)
            const hasProposedDateTime = !!(appointment.proposedDate && appointment.proposedTime);
            const canAcceptOrReject = status === 'appointment_proposed' || 
                                      (status === 'awaiting_appointment' && hasProposedDateTime);
            
            console.log('[SearchDetails] getAppointmentButtons - Expert logic:', {
                status,
                hasProposedDateTime,
                proposedDate: appointment.proposedDate,
                proposedTime: appointment.proposedTime,
                hasActiveProposal,
                canAcceptOrReject
            });
            
            return {
                showPropose: false,
                showCancel: status === 'appointment_confirmed',
                showAccept: canAcceptOrReject,
                showReject: canAcceptOrReject
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
    
    // ✅ Debug: Log de los botones que se mostrarán
    console.log('[SearchDetails] Appointment buttons:', {
        appointmentStatus: appointment?.status,
        hasAppointment: !!appointment,
        timers: appointment?.timers,
        hasActiveProposal: appointment?.timers?.some((t: any) => 
            (t.timerType === 'proposal' || t.timerType === 'response') && !t.isExpired
        ),
        buttons: appointmentButtons,
        isClient,
        isExpert,
        searchHireStatus,
        searchHireId: search?.searchHire?.id,
        hasSearchHire: !!search?.searchHire,
        isSearchHireFinalized,
        userId,
        clientId,
        expertId
    });

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
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-3 border-gray-300 border-t-gray-900 rounded-full animate-spin"></div>
                    <p className="text-sm text-gray-600">Cargando...</p>
                </div>
            </div>
        );
    }

    // Verificar si es error de red
    const isNetworkErr = isError && error && isNetworkError(error);
    
    // Solo mostrar pantalla de error si es crítico y no es un error de red (los de red se manejan con toast)
    if (isError && error && !isNetworkErr) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
                <div className="text-center space-y-4 max-w-md">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                        <AlertCircle className="w-8 h-8 text-gray-400" />
                            </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-900">Error al cargar</p>
                        <p className="text-xs text-gray-500">
                            {error?.message || 'Ha ocurrido un error inesperado'}
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
        );
    }

    return (
        <div className="bg-gray-50 overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 64px)', maxHeight: 'calc(100vh - 64px)', minHeight: 'calc(100vh - 64px)', margin: 0, padding: 0 }}>
            {/* Header - Minimalista y limpio */}
            <header className="hidden lg:flex bg-white border-b border-gray-200 flex-shrink-0 z-50" style={{ margin: 0 }}>
                <div className="px-6 py-4 w-full">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onBack || (() => navigate('/busquedas'))}
                                className="h-8 w-8 hover:bg-gray-50 rounded-md transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4 text-gray-700" />
                            </Button>
                            <div className="flex flex-col min-w-0 flex-1">
                                <h1 
                                    className="text-lg font-semibold text-gray-900 tracking-tight truncate"
                                    style={{
                                        fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                        fontSize: '18px',
                                        lineHeight: '24px',
                                        fontWeight: 600,
                                    }}
                                >
                                    {search?.title || serviceInfo?.name || category?.name || 'Contratación'}
                                </h1>
                                {searchHireStatusInfo && (
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <StatusBadge statusInfo={searchHireStatusInfo} />
                                        {appointment && appointmentStatusInfo && (
                                            <StatusBadge statusInfo={appointmentStatusInfo} />
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="hidden lg:flex items-center gap-1 flex-shrink-0">
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-50 rounded-md transition-colors" title="Compartir">
                                <Share2 className="w-4 h-4 text-gray-600" />
                            </Button>
                            {canViewChat && (
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-50 rounded-md transition-colors" title="Mensajes">
                                    <MessageCircle className="w-4 h-4 text-gray-600" />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {searchHireStatus === SEARCH_HIRE_STATUS.TRANSFER_FAILED && (
                <div className="mx-4 mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    <div className="flex items-center gap-2 font-medium">
                        <AlertCircle className="h-4 w-4" />
                        Error en la transferencia de pago
                    </div>
                    <p className="mt-1 text-red-700">
                        El servicio se marcó como completado pero la transferencia al experto falló. Contacta con soporte si persiste.
                    </p>
                </div>
            )}

            {/* ✅ Mensaje simple para errores de red */}
            {isNetworkErr && (
                <div className="flex flex-col items-center justify-center py-16 px-4 flex-1 bg-gray-50 overflow-y-auto">
                    <div className="flex flex-col items-center gap-4 max-w-sm text-center">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                            <WifiOff className="w-8 h-8 text-gray-400" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-900">
                                No se pudo conectar con el servidor
                            </p>
                            <p className="text-xs text-gray-500">
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

            {/* Main Layout - Sin scroll, solo scroll interno en componentes */}
            {!isNetworkErr && (
            <div className="flex flex-col lg:flex-row flex-1 min-h-0 bg-gray-50 lg:gap-2 overflow-hidden" style={{ minHeight: 0, flex: '1 1 0%', overflow: 'hidden', padding: 0 }}>
                {/* Chat Section - Izquierda en desktop, tabs en móvil - Más grande */}
                {canViewChat && (
                    <div className="flex-1 lg:w-[70%] xl:w-[75%] bg-white flex flex-col flex-shrink-0 min-h-0 overflow-hidden" style={{ minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', margin: 0, padding: 0 }}>
                        {/* Tabs - Solo en móvil - Minimalista */}
                        <Tabs value={activeTab || 'chat'} onValueChange={(value: string) => setActiveTab(value as 'chat' | 'details')} className="w-full flex flex-col flex-1 min-h-0" style={{ minHeight: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <div className="bg-white sticky top-0 z-40 lg:hidden flex-shrink-0 border-b border-gray-200">
                                <TabsList className="w-full grid grid-cols-2 h-12 bg-transparent p-0 gap-0 border-none">
                                    <TabsTrigger 
                                        value="chat" 
                                        className="flex items-center justify-center gap-2 font-normal transition-all duration-200 relative border-b-2 border-transparent data-[state=active]:text-gray-900 data-[state=active]:border-gray-900 data-[state=inactive]:text-gray-500 data-[state=inactive]:hover:text-gray-700 data-[state=inactive]:hover:border-gray-200"
                                        style={{
                                            fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                            fontSize: '15px',
                                            lineHeight: '20px',
                                            fontWeight: 400,
                                        }}
                                    >
                                        <MessageCircle className="w-4 h-4" strokeWidth={2} />
                                        Chat
                                    </TabsTrigger>
                                    <TabsTrigger 
                                        value="details" 
                                        className="flex items-center justify-center gap-2 font-normal transition-all duration-200 relative border-b-2 border-transparent data-[state=active]:text-gray-900 data-[state=active]:border-gray-900 data-[state=inactive]:text-gray-500 data-[state=inactive]:hover:text-gray-700 data-[state=inactive]:hover:border-gray-200"
                                        style={{
                                            fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                            fontSize: '15px',
                                            lineHeight: '20px',
                                            fontWeight: 400,
                                        }}
                                    >
                                        <List className="w-4 h-4" strokeWidth={2} />
                                        Detalles
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            {/* Chat Content - Visible siempre en desktop, solo en tab chat en móvil - Con scroll interno */}
                            {(activeTab === 'chat' || !activeTab) && (
                                <TabsContent value="chat" className="mt-0 flex-1 flex flex-col min-h-0 overflow-hidden p-0 m-0 h-full">
                                    <div className="flex-1 w-full overflow-hidden flex flex-col bg-white min-h-0 h-full">
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
                            )}
                                    
                            {/* Details Content - Solo visible en móvil (en desktop está en la columna derecha) - Con scroll interno */}
                            {activeTab === 'details' && (
                                <div className="mt-0 flex-1 flex flex-col lg:hidden min-h-0 overflow-hidden">
                                <div className="flex-1 flex flex-col bg-background min-h-0 overflow-hidden">
                                    <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6" style={{ paddingBottom: '0.5rem' }}>
                                {/* Service Info - Minimalista */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 
                                            className="text-base font-semibold text-gray-900"
                                            style={{
                                                fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                fontSize: '16px',
                                                lineHeight: '20px',
                                                fontWeight: 600,
                                            }}
                                        >
                                            Servicio
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            {searchHireStatusInfo && (
                                                <StatusBadge statusInfo={searchHireStatusInfo} />
                                            )}
                                            {appointment && appointmentStatusInfo && (
                                                <StatusBadge statusInfo={appointmentStatusInfo} />
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm text-gray-900">
                                            <Tag className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                            <span 
                                                style={{
                                                    fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                }}
                                            >
                                                {serviceInfo?.categoryName || category?.name || 'N/A'}
                                            </span>
                                                </div>
                                        {serviceInfo?.serviceTypeName && (
                                            <div 
                                                className="text-sm"
                                                style={{
                                                    fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                }}
                                            >
                                                <span className="text-gray-500">Tipo: </span>
                                                <span className="text-gray-900 font-medium">{serviceInfo.serviceTypeName}</span>
                                            </div>
                                        )}
                                        {search?.description && (
                                            <div className="text-sm leading-relaxed">
                                                <span className="text-gray-500">Descripción: </span>
                                                <span 
                                                    className="text-gray-700"
                                                    style={{
                                                        fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                        lineHeight: '1.5',
                                                    }}
                                                >
                                                    {search.description}
                                                </span>
                                            </div>
                                        )}
                                        {serviceInfo?.locationRange && (
                                            <div 
                                                className="text-xs text-gray-500"
                                                style={{
                                                    fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                }}
                                            >
                                                Radio de servicio: <span className="font-medium text-gray-900">{serviceInfo.locationRange} km</span>
                                            </div>
                                        )}
                                        {/* Precio con desglose mejorado */}
                                        {(() => {
                                            const priceSource = search?.searchHire || (serviceInfo?.price ? { amount: serviceInfo.price } : null);
                                            if (!priceSource) return null;
                                            const priceDisplay = getPriceDisplay(priceSource);
                                            
                                            return (
                                                <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 mt-2">
                                                    <div className="flex items-center justify-between">
                                                        <span 
                                                            className="text-sm font-medium text-gray-600"
                                                            style={{
                                                                fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                            }}
                                                        >
                                                            Precio total
                                                        </span>
                                                        <div className="text-right">
                                                            <div className="flex items-center justify-end gap-1.5">
                                                                <span 
                                                                    className="text-lg font-bold text-gray-900"
                                                                    style={{
                                                                        fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                                    }}
                                                                >
                                                                    {priceDisplay.formattedTotal}
                                                                </span>
                                            </div>
                                                            {priceDisplay.hasTaxInfo && (
                                                                <p className="text-[10px] text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded-full inline-block mt-0.5">IVA incluido</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    
                                                    {priceDisplay.hasTaxInfo && (
                                                        <Accordion type="single" collapsible className="w-full mt-2 border-t border-gray-200/50">
                                                            <AccordionItem value="price-breakdown" className="border-none">
                                                                <AccordionTrigger 
                                                                    className="text-xs py-1.5 text-gray-500 hover:text-gray-700 hover:no-underline font-normal justify-start gap-2 h-auto min-h-0"
                                                                    style={{
                                                                        fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                                    }}
                                                                >
                                                                    <span>Ver desglose de impuestos</span>
                                                                </AccordionTrigger>
                                                                <AccordionContent className="pb-0 pt-1 space-y-1">
                                                                    <div 
                                                                        className="flex justify-between text-xs"
                                                                        style={{
                                                                            fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                                        }}
                                                                    >
                                                                        <span className="text-gray-500">Base imponible</span>
                                                                        <span className="text-gray-700 font-medium">{priceDisplay.formattedBase}</span>
                                                                    </div>
                                                                    <div 
                                                                        className="flex justify-between text-xs"
                                                                        style={{
                                                                            fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                                        }}
                                                                    >
                                                                        <span className="text-gray-500">IVA</span>
                                                                        <span className="text-gray-700 font-medium">{priceDisplay.formattedTax}</span>
                                                                    </div>
                                                                </AccordionContent>
                                                            </AccordionItem>
                                                        </Accordion>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                    </div>

                                    {/* Accordion para explicar el estado - Múltiples desplegables */}
                                    {searchHireStatusInfo && (
                                        <Accordion type="multiple" className="w-full">
                                            <AccordionItem value="status-info" className="border-none">
                                                <AccordionTrigger 
                                                    className="text-xs py-2 hover:no-underline"
                                                    style={{
                                                        fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                    }}
                                                >
                                                    ¿Qué significa este estado?
                                                </AccordionTrigger>
                                                <AccordionContent 
                                                    className="text-xs text-muted-foreground pt-2 pb-0"
                                                    style={{
                                                        fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                    }}
                                                >
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
                                                    <AccordionTrigger 
                                                        className="text-xs py-2 hover:no-underline"
                                                        style={{
                                                            fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                        }}
                                                    >
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
                                    <div className="mt-6 pt-6 border-t border-gray-200 lg:hidden">
                                        <div className="space-y-2">
                                            <h3 
                                                className="text-base font-semibold text-gray-900 mb-3"
                                                style={{
                                                    fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                    fontSize: '16px',
                                                    lineHeight: '20px',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                    {appointment ? (
                                                        appointmentStatusInfo?.displayName || 
                                                        (appointment.status === 'appointment_proposed' ? 'Cita Propuesta' : 
                                                         appointment.status === 'appointment_confirmed' ? 'Cita Confirmada' : 
                                                         'Cita')
                                                    ) : 'Cita Pendiente'}
                                                </h3>
                                            <div className="space-y-3">
                                                    {appointment ? (
                                                        <>
                                                            {appointment.proposedDate && appointment.proposedTime && (() => {
                                                                // ✅ CORRECTO: Usar campos *Local que el backend proporciona (ya están en hora local)
                                                                // ⚠️ NO usar proposedDate/proposedTime para mostrar (están en UTC)
                                                                const dateToUse = appointment.proposedDateLocal || appointment.proposedDate;
                                                                const timeToUse = appointment.proposedTimeLocal || appointment.proposedTime;
                                                                return (
                                                                <div 
                                                                    className="flex items-center gap-2 text-sm text-gray-900"
                                                                    style={{
                                                                        fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                                    }}
                                                                >
                                                                    <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                                                        <span className="font-medium">
                                                                            {new Date(dateToUse).toLocaleDateString('es-ES', {
                                                                                day: 'numeric',
                                                                                month: 'short',
                                                                                year: 'numeric'
                                                                            })} {timeToUse.substring(0, 5)}
                                                                        </span>
                                                                    </div>
                                                                );
                                                            })()}
                                                            {appointment.location && (
                                                            <div 
                                                                className="flex items-start gap-2 text-sm text-gray-900"
                                                                style={{
                                                                    fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                                }}
                                                            >
                                                                <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                                                                    <span className="leading-relaxed">{appointment.location}</span>
                                                                </div>
                                                            )}
                                                            {appointment.doorNumber && (
                                                            <div 
                                                                className="text-sm text-gray-900 ml-6"
                                                                style={{
                                                                    fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                                }}
                                                            >
                                                                <span className="text-gray-500">Puerta: </span>
                                                                    <span className="font-medium">{appointment.doorNumber}</span>
                                                                </div>
                                                            )}
                                                            {/* Reportes del Experto - Dentro del cuadro de cita */}
                                                            {appointment.status === 'appointment_report_sent' && deliverables && deliverables.length > 0 && (
                                                            <div className="mt-3 pt-3 border-t border-gray-200">
                                                                <div 
                                                                    className="flex items-center gap-2 text-sm text-gray-900 mb-2"
                                                                    style={{
                                                                        fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                                    }}
                                                                >
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
                                                                                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 transition-colors w-full text-left"
                                                                                    style={{
                                                                                        fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                                                    }}
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
                                                        <div 
                                                            className="flex items-center gap-2 text-sm text-gray-700"
                                                            style={{
                                                                fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                            }}
                                                        >
                                                            <Clock className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                                                <span>Debes proponer una cita</span>
                                                            </div>
                                                            {timeRemaining && timeRemaining !== '00:00:00' && (
                                                            <div 
                                                                className="flex items-center gap-2 text-sm text-amber-600 ml-6"
                                                                style={{
                                                                    fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                                }}
                                                            >
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
                                                            <AccordionTrigger 
                                                                className="text-xs py-2 hover:no-underline"
                                                                style={{
                                                                    fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                                }}
                                                            >
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

                                <div className="border-t border-gray-200 pt-6"></div>

                                {/* Cliente - Minimalista */}
                                {search?.user && (
                                    <div className="space-y-3">
                                        <h3 
                                            className="text-base font-semibold text-gray-900"
                                            style={{
                                                fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                fontSize: '16px',
                                                lineHeight: '20px',
                                                fontWeight: 600,
                                            }}
                                        >
                                            Cliente
                                        </h3>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9">
                                                <AvatarImage 
                                                    src={search.user.profilePictureUrl || undefined} 
                                                    alt={search.user.name}
                                                />
                                                <AvatarFallback className="bg-gray-100 text-gray-700 text-sm font-medium">
                                                    {search.user.name?.charAt(0).toUpperCase() || 'C'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p 
                                                    className="text-sm font-medium text-gray-900 truncate"
                                                    style={{
                                                        fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                    }}
                                                >
                                                    {search.user.name}
                                                </p>
                                                <p 
                                                    className="text-xs text-gray-500 truncate mt-0.5"
                                                    style={{
                                                        fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                    }}
                                                >
                                                    {search.user.email}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Experto - Minimalista */}
                                {expertData && (
                                    <>
                                        <div className="border-t border-gray-200 pt-6"></div>
                                        <div className="space-y-3">
                                            <h3 
                                                className="text-base font-semibold text-gray-900"
                                                style={{
                                                    fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                    fontSize: '16px',
                                                    lineHeight: '20px',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                Experto
                                            </h3>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9">
                                                    <AvatarImage 
                                                        src={expertData.profilePictureUrl || undefined} 
                                                        alt={expertData.name}
                                                    />
                                                    <AvatarFallback className="bg-gray-100 text-gray-700 text-sm font-medium">
                                                        {expertData.name?.charAt(0).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p 
                                                            className="text-sm font-medium text-gray-900 truncate"
                                                            style={{
                                                                fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                            }}
                                                        >
                                                            {expertData.name}
                                                        </p>
                                                        {/* ✅ BANDERA DEL PAÍS DEL EXPERTO */}
                                                        {(search?.searchHire?.expertCountry || serviceInfo?.expertCountry || expertProfile?.country) && (
                                                            <CountryFlag 
                                                                countryCode={
                                                                    search?.searchHire?.expertCountry || 
                                                                    serviceInfo?.expertCountry || 
                                                                    expertProfile?.country || 
                                                                    null
                                                                } 
                                                                size="sm" 
                                                            />
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 mt-1">
                                                        <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                                                        <span className="text-xs text-gray-500">Verificado</span>
                                                    </div>
                                                </div>
                                            </div>
                                            {/* ✅ Disponibilidad del experto en móvil */}
                                            {expertProfile?.currentAvailability && (
                                                <div className="pl-10">
                                                    <ExpertAvailability 
                                                        availability={expertProfile.currentAvailability}
                                                        compact={true}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}

                                

                                {/* Subir Informe - Solo en desktop (en móvil está en botones fijos) */}
                                {isExpert && appointment?.status === 'appointment_awaiting_report' && (
                                    <>
                                        <Separator className="hidden lg:block" />
                                        <div className="space-y-3 hidden lg:block">
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
                                        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 px-5 py-4 space-y-3 shadow-lg">
                                            {/* Información de la cita propuesta - Solo para experto cuando puede aceptar/rechazar */}
                                            {appointmentButtons.showAccept && appointment && appointment.proposedDate && appointment.proposedTime && (
                                                <div className="space-y-2 pb-2 border-b border-gray-200">
                                                    <div 
                                                        className="flex items-center gap-2 text-sm text-gray-900"
                                                        style={{
                                                            fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                        }}
                                                    >
                                                        <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                                        <span className="font-medium">
                                                            {(() => {
                                                                // ✅ CORRECTO: Usar campos *Local que el backend proporciona (ya están en hora local)
                                                                // ⚠️ NO usar proposedDate/proposedTime para mostrar (están en UTC)
                                                                const dateToUse = appointment.proposedDateLocal || appointment.proposedDate;
                                                                const timeToUse = appointment.proposedTimeLocal || appointment.proposedTime;
                                                                return `${new Date(dateToUse).toLocaleDateString('es-ES', {
                                                                    day: 'numeric',
                                                                    month: 'short',
                                                                    year: 'numeric'
                                                                })} ${timeToUse.substring(0, 5)}`;
                                                            })()}
                                                        </span>
                                                    </div>
                                                    <div 
                                                        className="flex items-start gap-2 text-sm text-gray-700"
                                                        style={{
                                                            fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                        }}
                                                    >
                                                        <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                                                        <span className="leading-relaxed">
                                                            {appointment.location && appointment.location.trim() 
                                                                ? appointment.location 
                                                                : 'Ubicación no aportada'}
                                                        </span>
                                                    </div>
                                                    <div 
                                                        className="text-sm text-gray-700 ml-6"
                                                        style={{
                                                            fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                        }}
                                                    >
                                                        <span className="text-gray-500">Puerta: </span>
                                                        <span className="font-medium">
                                                            {appointment.doorNumber && appointment.doorNumber.trim() 
                                                                ? appointment.doorNumber 
                                                                : 'No aportada'}
                                                        </span>
                                                    </div>
                                                    <div 
                                                        className="flex items-center gap-2 text-sm text-gray-700"
                                                        style={{
                                                            fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                        }}
                                                    >
                                                        <Phone className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                                        <span>
                                                            {appointment.phoneNumber && appointment.phoneNumber.trim() 
                                                                ? appointment.phoneNumber 
                                                                : 'No aportado'}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
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
                                    
                                    {/* Programar Cita - Solo en desktop (en móvil está en el botón fijo) */}
                                    {appointmentButtons.showPropose && (
                                        <div className="hidden lg:block">
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
                                        </div>
                                    )}
                                </div>
                                </div>
                            )}
                        </Tabs>
                    </div>
                )}

                {/* Sidebar - Info + Acciones - Derecha en desktop, oculto en móvil (usa tabs) - Con scroll interno */}
                <aside className="hidden lg:flex lg:flex-col lg:w-[30%] xl:w-[25%] bg-white lg:rounded-lg lg:border lg:border-gray-200/60 lg:overflow-hidden min-h-0" style={{ margin: 0 }}>
                    <ScrollArea className="flex-1 min-h-0">
                        <div className="p-4 space-y-4" style={{ padding: '1rem' }}>
                            
                            {/* Resumen del Servicio - Minimalista */}
                                <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-gray-900">Información del Servicio</h3>
                                    {searchHireStatusInfo && (
                                        <StatusBadge status={searchHireStatusInfo} />
                                    )}
                                        </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Tag className="w-3.5 h-3.5 text-gray-500" />
                                        <span className="text-gray-900 font-medium">{serviceInfo?.categoryName || category?.name || 'N/A'}</span>
                                </div>
                                    {serviceInfo?.serviceTypeName && (
                                        <div className="text-sm">
                                            <span className="text-gray-500">Tipo: </span>
                                            <span className="text-gray-900 font-medium">{serviceInfo.serviceTypeName}</span>
                                        </div>
                                    )}
                                    {search?.description && (
                                        <div className="text-sm">
                                            <span className="text-gray-500 block mb-1">Descripción:</span>
                                            <span className="text-gray-700 leading-relaxed">{search.description}</span>
                                        </div>
                                    )}
                                    {search?.createdAt && (
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span>Creado el {new Date(search.createdAt).toLocaleDateString('es-ES', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric'
                                            })}</span>
                                        </div>
                                    )}
                                    {serviceInfo?.locationRange && (
                                        <div className="text-xs text-gray-500">
                                            Radio de servicio: <span className="font-medium text-gray-900">{serviceInfo.locationRange} km</span>
                                        </div>
                                    )}
                                    {/* Precio con desglose mejorado */}
                                    {(() => {
                                        const priceSource = search?.searchHire || (serviceInfo?.price ? { amount: serviceInfo.price } : null);
                                        if (!priceSource) return null;
                                        const priceDisplay = getPriceDisplay(priceSource);
                                        
                                        return (
                                            <div className="bg-gray-50/50 rounded-lg border border-gray-100 p-3 mt-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium text-gray-600">Precio total</span>
                                                    <div className="text-right">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <span className="text-lg font-bold text-gray-900">{priceDisplay.formattedTotal}</span>
                                        </div>
                                                        {priceDisplay.hasTaxInfo && (
                                                            <p className="text-[10px] text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded-full inline-block mt-0.5">IVA incluido</p>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                {priceDisplay.hasTaxInfo && (
                                                    <Accordion type="single" collapsible className="w-full mt-2 border-t border-gray-200/50">
                                                        <AccordionItem value="price-breakdown" className="border-none">
                                                            <AccordionTrigger className="text-xs py-1.5 text-gray-500 hover:text-gray-700 hover:no-underline font-normal justify-start gap-2 h-auto min-h-0">
                                                                <span>Ver desglose de impuestos</span>
                                                            </AccordionTrigger>
                                                            <AccordionContent className="pb-0 pt-1 space-y-1">
                                                                <div className="flex justify-between text-xs">
                                                                    <span className="text-gray-500">Base imponible</span>
                                                                    <span className="text-gray-700 font-medium">{priceDisplay.formattedBase}</span>
                                                                </div>
                                                                <div className="flex justify-between text-xs">
                                                                    <span className="text-gray-500">IVA</span>
                                                                    <span className="text-gray-700 font-medium">{priceDisplay.formattedTax}</span>
                                                                </div>
                                                            </AccordionContent>
                                                        </AccordionItem>
                                                    </Accordion>
                                                )}
                                            </div>
                                        );
                                    })()}
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

                                {/* Sección de Cita - Desktop - Siempre visible si necesita cita - Minimalista */}
                                {needsAppointment && (
                                    <div className="mt-4 hidden lg:block border-t border-gray-200/60 pt-4">
                                        <div className="space-y-2">
                                            <h3 className="text-sm font-semibold text-gray-900">
                                                    {appointment ? (
                                                        appointmentStatusInfo?.displayName || 
                                                        (appointment.status === 'appointment_proposed' ? 'Cita Propuesta' : 
                                                         appointment.status === 'appointment_confirmed' ? 'Cita Confirmada' : 
                                                         'Cita')
                                                    ) : 'Cita Pendiente'}
                                                </h3>
                                            <div className="space-y-2">
                                                {appointment ? (
                                                    <>
                                                        {appointment.proposedDate && appointment.proposedTime && (() => {
                                                            // ✅ CORRECTO: Usar campos *Local que el backend proporciona (ya están en hora local)
                                                            // ⚠️ NO usar proposedDate/proposedTime para mostrar (están en UTC)
                                                            const dateToUse = appointment.proposedDateLocal || appointment.proposedDate;
                                                            const timeToUse = appointment.proposedTimeLocal || appointment.proposedTime;
                                                            return (
                                                                <div className="flex items-center gap-2 text-sm">
                                                                    <Calendar className="w-3.5 h-3.5 text-gray-500" />
                                                                    <span className="text-gray-900 font-medium">
                                                                        {new Date(dateToUse).toLocaleDateString('es-ES', {
                                                                            day: 'numeric',
                                                                            month: 'short',
                                                                            year: 'numeric'
                                                                        })} {timeToUse.substring(0, 5)}
                                                                    </span>
                                                                </div>
                                                            );
                                                        })()}
                                                        {appointment.location && (
                                                            <div className="flex items-start gap-2 text-sm">
                                                                <MapPin className="w-3.5 h-3.5 text-gray-500 flex-shrink-0 mt-0.5" />
                                                                <div className="flex-1">
                                                                    <span className="text-gray-900 leading-relaxed">{appointment.location}</span>
                                                                    {appointment.doorNumber && (
                                                                        <div className="text-sm text-gray-900 mt-2">
                                                                            <span className="text-gray-500">Puerta: </span>
                                                                            <span className="font-medium">{appointment.doorNumber}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                        {appointment.doorNumber && !appointment.location && (
                                                            <div className="text-sm text-gray-900">
                                                                <span className="text-gray-500">Puerta: </span>
                                                                <span className="font-medium">{appointment.doorNumber}</span>
                                                            </div>
                                                        )}
                                                        {/* Reportes del Experto - Dentro del cuadro de cita (Desktop) */}
                                                        {appointment.status === 'appointment_report_sent' && deliverables && deliverables.length > 0 && (
                                                            <div className="mt-3 pt-3 border-t border-gray-200">
                                                                <div className="flex items-center gap-2 text-sm text-gray-900 mb-2">
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
                                                                                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 transition-colors w-full text-left"
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
                                                        <div className="flex items-center gap-2 text-sm text-gray-700">
                                                            <Clock className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                                            <span>Debes proponer una cita</span>
                                                        </div>
                                                        {timeRemaining && timeRemaining !== '00:00:00' && (
                                                            <div className="flex items-center gap-2 text-sm text-amber-600 ml-6">
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
                                    <div className="mt-4 hidden lg:block">
                                        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
                                            {/* Información de la cita propuesta - Solo para experto cuando puede aceptar/rechazar */}
                                            {appointmentButtons.showAccept && appointment && appointment.proposedDate && appointment.proposedTime && (
                                                <div className="space-y-2 pb-3 border-b border-gray-200">
                                                    <div 
                                                        className="flex items-center gap-2 text-sm text-gray-900"
                                                        style={{
                                                            fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                        }}
                                                    >
                                                        <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                                        <span className="font-medium">
                                                            {(() => {
                                                                // ✅ CORRECTO: Usar campos *Local que el backend proporciona (ya están en hora local)
                                                                // ⚠️ NO usar proposedDate/proposedTime para mostrar (están en UTC)
                                                                const dateToUse = appointment.proposedDateLocal || appointment.proposedDate;
                                                                const timeToUse = appointment.proposedTimeLocal || appointment.proposedTime;
                                                                return `${new Date(dateToUse).toLocaleDateString('es-ES', {
                                                                    day: 'numeric',
                                                                    month: 'short',
                                                                    year: 'numeric'
                                                                })} ${timeToUse.substring(0, 5)}`;
                                                            })()}
                                                        </span>
                                                    </div>
                                                    <div 
                                                        className="flex items-start gap-2 text-sm text-gray-700"
                                                        style={{
                                                            fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                        }}
                                                    >
                                                        <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                                                        <span className="leading-relaxed">
                                                            {appointment.location && appointment.location.trim() 
                                                                ? appointment.location 
                                                                : 'Ubicación no aportada'}
                                                        </span>
                                                    </div>
                                                    <div 
                                                        className="text-sm text-gray-700 ml-6"
                                                        style={{
                                                            fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                        }}
                                                    >
                                                        <span className="text-gray-500">Puerta: </span>
                                                        <span className="font-medium">
                                                            {appointment.doorNumber && appointment.doorNumber.trim() 
                                                                ? appointment.doorNumber 
                                                                : 'No aportada'}
                                                        </span>
                                                    </div>
                                                    <div 
                                                        className="flex items-center gap-2 text-sm text-gray-700"
                                                        style={{
                                                            fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                        }}
                                                    >
                                                        <Phone className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                                        <span>
                                                            {appointment.phoneNumber && appointment.phoneNumber.trim() 
                                                                ? appointment.phoneNumber 
                                                                : 'No aportado'}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
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

                            {/* Cliente - Minimalista */}
                            {search?.user && (
                                <div className="space-y-2 border-t border-gray-200/60 pt-4">
                                    <h3 className="text-sm font-semibold text-gray-900">Cliente</h3>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9">
                                            <AvatarImage 
                                                src={search.user.profilePictureUrl || undefined} 
                                                alt={search.user.name}
                                            />
                                            <AvatarFallback className="bg-gray-100 text-gray-700 text-sm font-medium">
                                                {search.user.name?.charAt(0).toUpperCase() || 'C'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">{search.user.name}</p>
                                            <p className="text-xs text-gray-500 truncate mt-0.5">{search.user.email}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Experto - Minimalista */}
                        {expertData && (
                                <div className="space-y-2 border-t border-gray-200/60 pt-4">
                                    <h3 className="text-sm font-semibold text-gray-900">Experto</h3>
                                    <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9">
                                                <AvatarImage 
                                                    src={expertData.profilePictureUrl || undefined} 
                                            alt={expertData.name}
                                                />
                                                <AvatarFallback className="bg-gray-100 text-gray-700 text-sm font-medium">
                                                    {expertData.name?.charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p 
                                                        className="text-sm font-medium text-gray-900 truncate"
                                                        style={{
                                                            fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                        }}
                                                    >
                                                        {expertData.name}
                                                    </p>
                                                    {/* ✅ BANDERA DEL PAÍS DEL EXPERTO - Desktop */}
                                                    {(search?.searchHire?.expertCountry || serviceInfo?.expertCountry || expertProfile?.country) && (
                                                        <CountryFlag 
                                                            countryCode={
                                                                search?.searchHire?.expertCountry || 
                                                                serviceInfo?.expertCountry || 
                                                                expertProfile?.country || 
                                                                null
                                                            } 
                                                            size="sm" 
                                                        />
                                                    )}
                                                    <div className="flex items-center gap-1.5 mt-1">
                                                        <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                                                        <span className="text-xs text-gray-500">Verificado</span>
                                                    </div>
                                                </div>
                                        </div>
                                    </div>
                                        {/* ✅ NUEVO: Mostrar disponibilidad del experto en desktop */}
                                        {expertProfile?.currentAvailability && (
                                            <div className="pl-10">
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
                                <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
                                    <h3 className="text-base font-semibold text-gray-900">Acciones</h3>
                                    <div className="space-y-2">
                                        {canApprove && (
                                            <Button
                                                onClick={handleApproveService}
                                                className="w-full bg-green-600 hover:bg-green-700 text-white h-10"
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
                                                className="w-full border border-red-300 text-red-600 hover:bg-red-50 h-10"
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
                                                className="w-full border border-gray-300 hover:bg-gray-50 h-10"
                                                size="sm"
                                            >
                                                <MessageCircle className="w-4 h-4 mr-2" />
                                                Responder Disputa
                                            </Button>
                                        )}
                                </div>
                                </div>
                        )}


                            {/* Subir Informe */}
                        {isExpert && appointment?.status === 'appointment_awaiting_report' && (
                                <div className="space-y-3">
                                    <h3 className="text-[16px] font-semibold text-[#222222]">Subir Informe</h3>
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
                                <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                        <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                                        <h3 className="text-[16px] font-semibold text-[#222222]">Reseña</h3>
                                </div>
                                        <Button
                                            onClick={() => setModalState((prev) => ({ ...prev, showReviewModal: true }))}
                                        className="w-full bg-yellow-500 hover:bg-yellow-600 text-white"
                                        size="sm"
                                        >
                                        <Star className="w-3.5 h-3.5 mr-2" />
                                            Escribir Reseña
                                        </Button>
                            </div>
                            )}

                            {review && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                                            <span className="text-[16px] font-semibold text-[#222222]">Reseña</span>
                                        </div>
                                        <Badge className="bg-yellow-500 text-white px-2 py-1 text-[12px]">{review.score}/5</Badge>
                                    </div>
                                    {review.description && (
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <p className="text-[14px] text-[#222222] leading-relaxed">
                                                {review.description}
                                            </p>
                                </div>
                                )}
                            </div>
                            )}


                            {/* Espacio mínimo para el final del contenido */}
                            <div className="h-2"></div>
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
                    // ✅ NUEVO: País y timezone del experto
                    expertCountry={
                        search?.searchHire?.expertCountry || 
                        serviceInfo?.expertCountry || 
                        expertProfile?.country || 
                        null
                    }
                    serviceTimezone={
                        search?.searchHire?.expertTimezone || 
                        serviceInfo?.expertTimezone || 
                        expertProfile?.timezone || 
                        null
                    }
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
                                    {(() => {
                                        // ✅ CORRECTO: Usar campos *Local que el backend proporciona (ya están en hora local)
                                        // ⚠️ NO usar proposedDate/proposedTime para mostrar (están en UTC)
                                        const dateToUse = appointmentToConfirm.proposedDateLocal || appointmentToConfirm.proposedDate;
                                        const timeToUse = appointmentToConfirm.proposedTimeLocal || appointmentToConfirm.proposedTime;
                                        return (
                                            <>
                                                {new Date(dateToUse).toLocaleDateString('es-ES', {
                                                    weekday: 'long',
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })} {timeToUse?.substring(0, 5)}
                                            </>
                                        );
                                    })()}
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