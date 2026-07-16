import { useState, useEffect, type ReactNode } from 'react';
import { ArrowLeft, Star, AlertTriangle, MessageCircle, Upload, Share2, FileText, Calendar, CheckCircle, XCircle, MapPin, Tag, X, FileCheck, Film, Download, WifiOff, RefreshCw, AlertCircle, FastForward, Loader2 } from 'lucide-react';
import { SearchDetailsSkeleton } from './SearchDetailsSkeleton';
import CountryFlag from './CountryFlag';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { VerifiedBadge } from './ui/VerifiedBadge';
import { ScrollArea } from './ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { useAuth } from '../contexts/AuthContext';
import { getUserId } from '../utils/userId';
import { LazyChat as Chat } from './chat/LazyChat';
import { MobileDetailsSheet } from './chat/MobileDetailsSheet';
import { ReviewModal, DisputeModal } from './Modals';
import { ExpertResponseModal } from './ExpertResponseModal';
import { useSearchActions } from '../hooks/useSearchActions';
import { useParams, useNavigate } from 'react-router-dom';
import { showToast } from '../lib/toast';
import { useErrorHandler, isNetworkError } from '../hooks/useErrorHandler';

// Imports para el sistema de citas
import { useAppointments } from '../hooks/useAppointments';
import { useAppointmentStatuses } from '../hooks/useAppointmentStatuses';
import { useSearchHireStatuses } from '../hooks/useSearchHireStatuses';
import StatusTimeline from './StatusTimeline';
import ExpertAvailability from './ExpertAvailability';
import RejectAppointmentModal from './RejectAppointmentModal';
import { Appointment, ConfirmAppointmentDto, RejectAppointmentDto, CancelAppointmentDto } from '../types/appointment';
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

// ✅ NUEVOS IMPORTS PARA SISTEMA DE ESTADOS
import StatusBadge from './StatusBadge';
import { getStatusInfoWithFallback } from '../utils/statusUtils';
import {
    canLeaveReview,
    isTerminalSearchHireStatus,
    SEARCH_HIRE_STATUS,
} from '../constants/hireStatuses';
import { useExpertResponse } from '../hooks/useExpertResponse';
import { getPriceDisplay } from '../utils/priceUtils';

// ? NUEVOS HOOKS OPTIMIZADOS
import { useSearchDetailsOptimized } from '../hooks/useSearchDetailsOptimized';
import { getAuthToken } from '../lib/auth';
import { isAdmin as checkIsAdmin } from '../utils/admin';
import { API_CONFIG } from '../config/api';
import {
    SD_SEARCH_DETAILS_DESKTOP_PAGE_CLASS,
    SD_SEARCH_DETAILS_DESKTOP_CHAT_CARD_CLASS,
    SD_SEARCH_DETAILS_DESKTOP_SIDEBAR_CARD_CLASS,
    SD_SEARCH_DETAILS_DESKTOP_INNER_CLASS,
    SD_SEARCH_DETAILS_DESKTOP_LAYOUT_CLASS,
    SD_SEARCH_DETAILS_DESKTOP_SIDEBAR_CLASS,
    SD_SEARCH_DETAILS_DESKTOP_CHAT_CLASS,
    SD_CHECKOUT_DESKTOP_CARD_HEADER_CLASS,
} from '../constants/homepageTypography';

interface SearchDetailsProps {
    isAdmin: boolean;
    onBack?: () => void;
    searchHireId?: number; // ✅ Opcional: si se pasa, se usa directamente (para rutas /searchhire/:id)
    /**
     * Incrustado dentro de otro contenedor (p. ej. el panel derecho de la bandeja
     * de Mensajes): no ocupa el viewport completo (sin `fixed`/bloqueo de scroll),
     * oculta su cabecera de página y propaga `embedded` al chat. Todos los botones
     * de acción (cita, aprobar, disputar, informe, reseña…) siguen funcionando
     * in-place vía modales, sin navegar a otra ruta. Por defecto false.
     */
    embedded?: boolean;
}

// ───────────────────────────────────────────────────────────────────────────
// Helpers presentacionales del panel de detalles (sidebar derecho de Mensajes).
// Lenguaje minimalista compartido con la bandeja: micro-etiqueta de sección +
// fila label/valor, misma paleta (#1c1c1c ink · #737373 label · #9a9a9a icono ·
// hairline #f0f0f0). Sin gradientes ni sombras decorativas.
// ───────────────────────────────────────────────────────────────────────────

/** Etiqueta de sección del panel — jerarquía por peso (600 vs 500), sin uppercase:
 *  el único uppercase del sistema es el eyebrow brand puntual, y aquí habría 6 seguidos. */
function SdSectionTitle({ children }: { children: ReactNode }) {
    return (
        <h3 className="text-meta font-semibold text-ink-strong">
            {children}
        </h3>
    );
}

export default function SearchDetails({ isAdmin, onBack, searchHireId: searchHireIdProp, embedded = false }: SearchDetailsProps) {
    const { id } = useParams<{ id: string }>();
    const searchIdParam = parseInt(id || '0', 10);
    // ✅ Si searchId es 0, significa que solo tenemos searchHireId (cliente eliminado)
    const searchId = searchIdParam === 0 ? null : searchIdParam;
    const navigate = useNavigate();
    const [modalState, setModalState] = useState({
        showDisputeModal: false,
        showReviewModal: false,
    });
    const [disputeReason, setDisputeReason] = useState('');
    const [disputeFiles, setDisputeFiles] = useState<File[]>([]);

    // Estado para respuesta del experto
    const [showExpertResponseModal, setShowExpertResponseModal] = useState(false);
    const [reviewForm, setReviewForm] = useState({
        score: 0,
        description: '',
        images: [] as File[],
    });
    const [selectedDeliverableFiles, setSelectedDeliverableFiles] = useState<File[]>([]);
    const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
    const [fileValidation, setFileValidation] = useState<{canSubmit: boolean, message: string} | null>(null);
    const [mobileDetailsOpen, setMobileDetailsOpen] = useState(false);

    // Estado para el sistema de citas
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [appointmentToReject, setAppointmentToReject] = useState<Appointment | null>(null);
    const [modalActionType, setModalActionType] = useState<'reject' | 'cancel'>('reject');
    const [showConfirmAppointmentDialog, setShowConfirmAppointmentDialog] = useState(false);
    const [appointmentToConfirm, setAppointmentToConfirm] = useState<Appointment | null>(null);

    // Bloquear scroll + altura real del viewport en móvil (evita hueco inferior).
    // Incrustado NO debe tocar el <body> (rompería la bandeja de Mensajes).
    useEffect(() => {
        if (embedded) return;
        const originalOverflow = document.body.style.overflow;
        const originalPosition = document.body.style.position;
        const originalWidth = document.body.style.width;
        const originalHeight = document.body.style.height;
        const originalTop = document.body.style.top;
        const originalLeft = document.body.style.left;

        const setViewportHeight = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };

        setViewportHeight();

        const handleResize = () => {
            setTimeout(setViewportHeight, 100);
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleResize);
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', handleResize);
            window.visualViewport.addEventListener('scroll', handleResize);
        }

        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
        document.body.style.height = '100%';
        document.body.style.top = '0';
        document.body.style.left = '0';

        const html = document.documentElement;
        const originalHtmlOverflow = html.style.overflow;
        html.style.overflow = 'hidden';

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleResize);
            if (window.visualViewport) {
                window.visualViewport.removeEventListener('resize', handleResize);
                window.visualViewport.removeEventListener('scroll', handleResize);
            }
            document.body.style.overflow = originalOverflow || '';
            document.body.style.position = originalPosition || '';
            document.body.style.width = originalWidth || '';
            document.body.style.height = originalHeight || '';
            document.body.style.top = originalTop || '';
            document.body.style.left = originalLeft || '';
            html.style.overflow = originalHtmlOverflow || '';
        };
    }, [embedded]);

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
        category,
        review,
        expertProfile,
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
    const hasSearchHireData = !!search?.searchHire || !!searchHireId;
    // ✅ Cuando search es null, usar serviceInfo de searchHire si está disponible
    const serviceInfo = search?.searchHire?.service;
    
    // ? DATOS DE EXPERTO DESDE SEARCHHIRE O EXPERTPROFILE
    // ✅ Cuando search es null, usar expertProfile.user directamente
    const expertInfo = search?.searchHire?.expert || expertProfile?.user || null;
    
    // ? HOOKS PARA ACCIONES (chat: un solo useChat dentro de <Chat />)
    const { handleCompleteService, handleDisputeSubmit: submitDispute } = useSearchActions();

    // Hook para enviar respuesta del experto
    const { sendExpertResponse, isSubmitting: isSubmittingExpertResponse } = useExpertResponse();
    
    // Hook para el sistema de citas
    const {
        confirmAppointment,
        rejectAppointment,
        cancelAppointment,
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
                    return { canSubmit: true, message: 'Puedes enviar el informe cuando quieras.' };
                }
                
                // Si hay tipos requeridos pero no hay archivos subidos
                if (result.uploadedFiles && result.uploadedFiles.length === 0 && result.requiredTypes && result.requiredTypes.length > 0) {
                    const requiredText = result.requiredTypes.map((t: any) => t.displayName || t.name).join(' y ');
                    return { 
                        canSubmit: false, 
                        message: `Para enviar el informe necesitas subir: ${requiredText}` 
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
                        message: `Para enviar el informe necesitas subir: ${missingText}` 
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
            console.error('Error enviando informe:', error);
            return { success: false, message: 'Error al enviar el informe' };
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
                    message: `Para enviar el informe necesitas subir: ${missing.join(' y ')}` 
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
                    message: `Para enviar el informe necesitas subir: ${missingText}` 
                });
            }
        }
    };

    const handleDeleteFile = async (deliverableId: number) => {
        if (!appointment?.id) return;
        
        try {
            const result = await deleteFile(appointment.id, deliverableId);
            if (result.success) {
                showToast('success', 'Archivo eliminado');
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
        // Avisar de los descartados: antes se filtraban en silencio y arrastrar un
        // .docx no producía NINGUNA reacción visible (parecía que la app estaba rota).
        const rejectedCount = files.length - validFiles.length;
        if (rejectedCount > 0) {
            showToast('error', rejectedCount === 1
                ? 'Un archivo no se ha añadido: solo se admiten PDF o MP4 de hasta 10MB.'
                : `${rejectedCount} archivos no se han añadido: solo se admiten PDF o MP4 de hasta 10MB.`);
        }
        if (validFiles.length > 0) {
            showToast('success', validFiles.length === 1 ? 'Archivo añadido' : `${validFiles.length} archivos añadidos`);
        }
        setSelectedDeliverableFiles(prev => [...prev, ...validFiles]);
        
        // Limpiar el input para permitir seleccionar los mismos archivos otra vez
        e.target.value = '';
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
                    showToast('success', 'Disputa enviada correctamente');
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
            await sendExpertResponse(disputes[0].id, response, files);
            
            showToast('success', 'Respuesta enviada correctamente');
            
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
            const result = await submitReportWithFiles(appointment.id, selectedDeliverableFiles, 'Informe completado por el experto');

            if (result.success) {
                showToast('success', 'Informe enviado correctamente');
                // Limpiar archivos seleccionados
                setSelectedDeliverableFiles([]);
                // Refrescar datos
                invalidateAll();
            } else {
                showToast('error', result.message);
            }
        } catch (error) {
            console.error('[SearchDetails] Error submitting report:', error);
            showToast('error', 'Error al enviar el informe');
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

    // Opción 1: Verificar por serviceTypeCategoryId (1 o 2)
    const isAppointmentCategory = serviceInfo?.serviceTypeCategoryId === 1 || serviceInfo?.serviceTypeCategoryId === 2;
    
    // Opción 2: Verificar por requiresAppointment (nuevo campo del backend)
    const requiresAppointment = serviceInfo?.requiresAppointment;
    
    // Usar cualquiera de las dos condiciones, pero solo si hay searchHire
    const needsAppointment = hasSearchHireData && (isAppointmentCategory || requiresAppointment);

    // 🤝 Modo de coordinación (self/seller). Cuando aún NO hay cita, el cliente NO debe "proponer" nada
    // (eso era el flujo VIEJO de proponer/aceptar, ya retirado): en modo "seller" el vendedor coordina la
    // cita por magic-link; en "self" el cliente ya eligió el hueco en el checkout (y la cita aparece en
    // cuanto el webhook la crea). Mensaje correcto según el modo, sin el contador de 24h legacy.
    const coordinationMode: string | null =
        (search?.searchHire as any)?.coordinationMode ?? (search?.searchHire as any)?.CoordinationMode ?? null;
    const noAppointmentMessage =
        coordinationMode === 'seller'
            ? 'Estamos coordinando la cita con el vendedor. Te avisaremos en cuanto elija día, hora y lugar.'
            : coordinationMode === 'self'
            ? 'Estamos preparando tu cita. Aparecerá aquí en unos instantes.'
            : 'Estamos coordinando tu cita. Te avisaremos en cuanto esté confirmada.';

    const userId = getUserId(user);
    const effectiveIsAdmin =
        isAdmin ||
        checkIsAdmin(user?.email ?? (user as { Email?: string })?.Email) ||
        user?.role === 'Admin' ||
        user?.role === 'admin';
    const clientId = Number(
        search?.user?.id ??
        search?.userId ??
        search?.searchHire?.client?.id ??
        0
    );
    const expertUserId = Number(
        search?.searchHire?.expert?.id ??
        expertInfo?.id ??
        expertProfile?.user?.id ??
        0
    );

    const isExpert =
        expertUserId > 0 &&
        (userId === expertUserId ||
            (search?.searchHire?.expert?.id != null && userId === Number(search.searchHire.expert.id)) ||
            (expertInfo?.id != null && userId === Number(expertInfo.id)) ||
            (expertProfile?.user?.id != null && userId === Number(expertProfile.user.id)));
    const isClient = clientId > 0
        ? userId === clientId
        : isExpert
            ? false
            : !effectiveIsAdmin && !!user;
    const userRole = isClient ? 'client' : 'expert';
    
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
    const canViewChat =
        hasValidSearchHire && !!user && (effectiveIsAdmin || isClient || isExpert);

    const isSearchHireFinalized = isTerminalSearchHireStatus(
        searchHireStatus || '',
        searchHireStatusInfoObj
    );

    // ✅ Función helper para determinar qué botones mostrar según la guía
    const getAppointmentButtons = () => {
        // Si SearchHire está finalizado, no mostrar ningún botón
        if (isSearchHireFinalized) {
            return {
                showCancel: false,
                showCancelPending: false,
                showAccept: false,
                showReject: false
            };
        }

        // Si no hay cita, no hay botones que mostrar (proponer cita: sistema antiguo retirado).
        if (!appointment) {
            return {
                showCancel: false,
                showCancelPending: false,
                showAccept: false,
                showReject: false
            };
        }

        const status = appointment.status;

        if (isClient) {
            return {
                showCancel: status === 'appointment_confirmed',
                // Cancelar SIN COSTE mientras el experto no confirme (pago solo autorizado → devolución 100%).
                showCancelPending: status === 'appointment_pending_expert_confirmation',
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

            return {
                showCancel: status === 'appointment_confirmed',
                showCancelPending: false,
                showAccept: false && canAcceptOrReject, // SISTEMA ANTIGUO: aceptar cita retirado (endpoint /confirm #if false)
                showReject: false && canAcceptOrReject  // SISTEMA ANTIGUO: rechazar cita retirado (endpoint /reject #if false)
            };
        }

        return {
            showCancel: false,
            showCancelPending: false,
            showAccept: false,
            showReject: false
        };
    };

    const appointmentButtons = getAppointmentButtons();

    const showAdminSkipReport = effectiveIsAdmin && appointment?.status === 'appointment_confirmed';

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
                
                showToast('success', 'Cita cancelada correctamente');
            } else {
            const rejectData: RejectAppointmentDto = {
                appointmentId: appointmentToReject.id,
                reason: reason
            };
            
            await rejectAppointment(rejectData);
            
            showToast('success', 'Cita rechazada correctamente');
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
    // 🧪 PRUEBAS (Admin): salto de la espera de 3h post-cita. Llama al endpoint admin que reusa
    // el mismo handler idempotente del watchdog (ProcessAppointmentToAwaitingReportAsync) para
    // pasar la cita confirmada directamente a 'awaiting_report'. Solo visible para admin.
    const [isSkippingReport, setIsSkippingReport] = useState(false);

    const handleAdminSkipReport = async () => {
        if (!appointment?.id) return;
        setIsSkippingReport(true);
        try {
            const response = await fetch(
                `${API_CONFIG.baseUrl}/api/appointment/admin/${appointment.id}/skip-to-awaiting-report`,
                {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${getAuthToken()}` },
                }
            );
            const data: any = await response.json().catch(() => ({}));
            if (response.ok) {
                showToast('success', data?.message || data?.Message || 'Cita saltada a "esperando reporte"');
                invalidateAll();
            } else {
                showToast('error', data?.message || data?.Message || 'No se pudo saltar el paso de la cita');
            }
        } catch (error) {
            console.error('[SearchDetails] Error en salto admin de cita:', error);
            showToast('error', 'Error al saltar el paso de la cita');
        } finally {
            setIsSkippingReport(false);
        }
    };

    // Botón de pruebas (solo admin) que aparece en la contratación cuando la cita está confirmada.
    const renderAdminSkipReportButton = () => {
        if (!showAdminSkipReport) return null;
        return (
            <Button
                type="button"
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleAdminSkipReport();
                }}
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 rounded-full text-warning-text hover:bg-warning-tint hover:text-warning-text"
                disabled={isSkippingReport}
                aria-label="Admin: saltar a esperando reporte"
                title="Admin (pruebas): salta la espera de 3h post-cita"
            >
                {isSkippingReport ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                    <FastForward className="h-4 w-4" aria-hidden />
                )}
            </Button>
        );
    };

    // Pareja de badges de estado (hire + cita) — compartida por la cabecera de página
    // (no embebido), la hoja de detalles móvil y el aside de escritorio para que no
    // diverjan entre sí. El wrapper (div/gap/margen) queda en cada llamador porque
    // difiere legítimamente entre esos tres contextos.
    const renderHireStatusBadges = () => (
        <>
            {searchHireStatusInfo && <StatusBadge statusInfo={searchHireStatusInfo} />}
            {showAppointmentBadge && <StatusBadge statusInfo={appointmentStatusInfo} />}
        </>
    );

    // Precio total + desglose de impuestos — idéntico en la hoja móvil y el aside
    // de escritorio; solo cambia el wrapper alrededor de la llamada.
    const renderPriceSummary = () => {
        const priceSource = search?.searchHire || (serviceInfo?.price ? { amount: serviceInfo.price } : null);
        if (!priceSource) return null;
        const priceDisplay = getPriceDisplay(priceSource);

        return (
            <div className="border-t border-line-soft pt-3">
                <div className="flex items-baseline justify-between gap-3">
                    <span className="text-meta font-medium text-ink-muted">Precio total</span>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-xl font-semibold tracking-[-0.01em] text-ink-strong">{priceDisplay.formattedTotal}</span>
                        {priceDisplay.hasTaxInfo && (
                            <span className="text-caption font-medium text-ink-muted">IVA incl.</span>
                        )}
                    </div>
                </div>

                {priceDisplay.hasTaxInfo && (
                    <Accordion type="single" collapsible className="mt-1.5 w-full">
                        <AccordionItem value="price-breakdown" className="border-none">
                            <AccordionTrigger className="h-auto min-h-0 justify-start gap-1.5 py-1.5 text-caption font-normal text-ink-muted hover:text-ink-strong hover:no-underline">
                                <span>Ver desglose de impuestos</span>
                            </AccordionTrigger>
                            <AccordionContent className="space-y-1 pb-0 pt-1">
                                <div className="flex justify-between text-caption">
                                    <span className="text-ink-muted">Base imponible</span>
                                    <span className="font-medium text-ink-strong">{priceDisplay.formattedBase}</span>
                                </div>
                                <div className="flex justify-between text-caption">
                                    <span className="text-ink-muted">IVA</span>
                                    <span className="font-medium text-ink-strong">{priceDisplay.formattedTax}</span>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                )}
            </div>
        );
    };

    // Bloque "Cliente" (avatar + nombre + email) — idéntico en móvil y escritorio.
    const renderClienteBlock = () => {
        if (!search?.user) return null;
        return (
            <>
                <SdSectionTitle>Cliente</SdSectionTitle>
                <div className="mt-2.5 flex items-center gap-3">
                    <Avatar className="h-9 w-9 shrink-0">
                        <AvatarImage
                            src={search.user.profilePictureUrl || undefined}
                            alt={search.user.name}
                        />
                        <AvatarFallback className="bg-line-soft text-meta font-semibold text-ink-muted">
                            {search.user.name?.charAt(0).toUpperCase() || 'C'}
                        </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-meta font-medium text-ink-strong">{search.user.name}</p>
                        <p className="mt-0.5 truncate text-caption text-ink-muted">{search.user.email}</p>
                    </div>
                </div>
            </>
        );
    };

    // Bloque "Experto" (avatar + nombre + verificado + bandera + disponibilidad) —
    // idéntico en móvil y escritorio.
    const renderExpertoBlock = () => {
        if (!expertData) return null;
        return (
            <>
                <SdSectionTitle>Experto</SdSectionTitle>
                <div className="mt-2.5 flex items-center gap-3">
                    <Avatar className="h-9 w-9 shrink-0">
                        <AvatarImage
                            src={expertData.profilePictureUrl || undefined}
                            alt={expertData.name}
                        />
                        <AvatarFallback className="bg-line-soft text-meta font-semibold text-ink-muted">
                            {expertData.name?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                            <p className="truncate text-meta font-medium text-ink-strong">{expertData.name}</p>
                            <VerifiedBadge className="h-4 w-4 shrink-0" />
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
                    </div>
                </div>
                {expertProfile?.currentAvailability && (
                    <div className="mt-2.5 pl-[48px]">
                        <ExpertAvailability
                            availability={expertProfile.currentAvailability}
                            compact={true}
                        />
                    </div>
                )}
            </>
        );
    };

    // Reseña ya publicada (puntuación + comentario) — idéntico en móvil y escritorio.
    // `review.score` puede llegar null/undefined desde el backend; sin la guarda de
    // tipo se pintaba "★ /5" en blanco.
    const renderExistingReview = () => {
        if (!review) return null;
        return (
            <>
                <div className="flex items-center justify-between">
                    <SdSectionTitle>Reseña</SdSectionTitle>
                    {typeof review.score === 'number' && (
                        <span
                            className="inline-flex items-center gap-1 text-caption font-semibold text-ink-strong"
                            aria-label={`Puntuación ${review.score} de 5`}
                        >
                            <Star className="h-3.5 w-3.5 fill-current" aria-hidden />
                            {review.score}/5
                        </span>
                    )}
                </div>
                {review.description && (
                    <p className="rounded-xl bg-surface-tinted p-3 text-meta leading-relaxed text-ink">
                        {review.description}
                    </p>
                )}
            </>
        );
    };

    // Confirmación genérica para acciones destructivas (cancelar inspección/cita) que antes
    // usaban window.confirm() nativo: mismo AlertDialog de marca que "Confirmar cita", con
    // loading visible en el botón mientras la petición está en vuelo (antes no había ningún
    // feedback durante el window.confirm/fetch).
    const [dangerConfirm, setDangerConfirm] = useState<{
        title: string;
        description: string;
        confirmLabel: string;
        onConfirm: () => Promise<void>;
    } | null>(null);
    const [dangerConfirmLoading, setDangerConfirmLoading] = useState(false);

    const handleDangerConfirmAction = async () => {
        if (!dangerConfirm || dangerConfirmLoading) return;
        setDangerConfirmLoading(true);
        try {
            await dangerConfirm.onConfirm();
        } finally {
            setDangerConfirmLoading(false);
            setDangerConfirm(null);
        }
    };

    const handleShare = async () => {
        const shareTitle = search?.title || serviceInfo?.serviceTypeName || category?.name || 'Contratación en Inspecciono';
        const shareUrl = window.location.href;
        if (navigator.share) {
            try {
                await navigator.share({ title: shareTitle, url: shareUrl });
            } catch (err) {
                if ((err as Error)?.name !== 'AbortError') {
                    showToast('error', 'No se pudo compartir el enlace.');
                }
            }
            return;
        }
        try {
            await navigator.clipboard.writeText(shareUrl);
            showToast('success', 'Enlace copiado al portapapeles');
        } catch {
            showToast('error', 'No se pudo copiar el enlace.');
        }
    };

    // 🛡️ FIX [GAP-CANCEL-UI] (auditoría 2026-07-12): el checkout promete "cancelación sin coste si
    // cambias de idea antes de que el vendedor reserve" y el backend tiene el endpoint expreso para
    // honrarla (FIX [GAP-CANCEL] → POST /api/SearchHire/{id}/cancel-seller-booking), pero NINGÚN
    // componente lo llamaba: el comprador arrepentido se quedaba con la autorización retenida hasta
    // el watchdog de 48h. Botón discreto en la fase "coordinando con el vendedor" (sin cita aún).
    const [cancellingSellerBooking, setCancellingSellerBooking] = useState(false);
    const handleCancelSellerBooking = () => {
        const hireId = search?.searchHire?.id;
        if (!hireId) { showToast('error', 'No se pudo identificar la contratación.'); return; }
        if (cancellingSellerBooking) return;
        setDangerConfirm({
            title: 'Cancelar inspección',
            description: 'El vendedor aún no ha reservado la cita, así que no se te cobrará nada (devolución del 100%).',
            confirmLabel: 'Cancelar inspección',
            onConfirm: async () => {
                setCancellingSellerBooking(true);
                try {
                    const resp = await fetch(`${API_CONFIG.baseUrl}/api/SearchHire/${hireId}/cancel-seller-booking`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${getAuthToken()}` },
                    });
                    if (!resp.ok) {
                        const err = await resp.json().catch(() => ({} as any));
                        // 409 = carrera (el vendedor acaba de reservar / ya gestionada): el mensaje del
                        // backend lo explica; refrescar para que la vista muestre la realidad.
                        showToast('error', err.message || 'No se pudo cancelar la contratación.');
                        invalidateAll();
                        return;
                    }
                    showToast('success', 'Contratación cancelada. No se te ha cobrado nada.');
                    invalidateAll();
                } catch {
                    showToast('error', 'No se pudo cancelar la contratación. Inténtalo de nuevo.');
                } finally {
                    setCancellingSellerBooking(false);
                }
            },
        });
    };

    const handleAppointmentAction = async (action: string, appointment: Appointment) => {
        try {
            switch (action) {
                // 🧟 LEGACY (2026-06-19): los case 'confirm'/'reject' son del flujo antiguo retirado.
                // Inalcanzables: ningún botón vivo dispara estas acciones (triggers desactivados en
                // AppointmentStatus.tsx + flags showAccept/showReject forzados a false). Se conservan
                // por estructura del switch; las acciones vivas son 'cancel'/'chat'/'dispute'/'approve'/etc.
                // ('propose' se retiró del todo: era 100% inalcanzable, ver antiguo AppointmentForm).
                case 'confirm':
                    const confirmData: ConfirmAppointmentDto = {
                        appointmentId: appointment.id,
                        notes: 'Cita confirmada'
                    };
                    await confirmAppointment(confirmData);
                    showToast('success', 'Cita confirmada correctamente');
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

                // Cancelación SIN COSTE mientras la cita está PENDIENTE de confirmación del experto.
                // El dinero solo está autorizado (no cobrado) → devolución 100% a 0€ (rama N10 backend).
                case 'cancelPending': {
                    const hireId = appointment.searchHireId;
                    if (!hireId) { showToast('error', 'No se pudo identificar la contratación.'); break; }
                    // El AlertDialog (dangerConfirm) + su propio disabled-while-loading sustituyen
                    // al lock síncrono que usaba el window.confirm() nativo: solo un fetch a la vez
                    // puede estar en vuelo porque handleDangerConfirmAction ignora re-entradas.
                    setDangerConfirm({
                        title: 'Cancelar cita',
                        description: 'Como el experto aún no la ha confirmado, no se te cobrará nada (devolución del 100%).',
                        confirmLabel: 'Cancelar cita',
                        onConfirm: async () => {
                            try {
                                const resp = await fetch(`${API_CONFIG.baseUrl}/api/SearchHire/${hireId}/cancel-pending`, {
                                    method: 'POST',
                                    headers: { 'Authorization': `Bearer ${getAuthToken()}` },
                                });
                                if (!resp.ok) {
                                    const err = await resp.json().catch(() => ({} as any));
                                    // W11 FIX: en un 409 (el experto acaba de responder / watchdog) la vista está
                                    // obsoleta → refrescar además de avisar; antes el botón muerto persistía.
                                    if (resp.status === 409) invalidateAll();
                                    throw new Error(err.message || 'No se pudo cancelar la cita.');
                                }
                                showToast('success', 'Cita cancelada. No se te ha cobrado nada.');
                                invalidateAll();
                            } catch (err: any) {
                                showToast('error', err?.message || 'No se pudo cancelar la cita.');
                            }
                        },
                    });
                    break;
                }
            }
        } catch (error: any) {
            console.error('Error en acción de cita:', error);
            // Extraer el mensaje del backend si está disponible
            const errorMessage = error?.message || 'Error al realizar la acción';
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

    // Una vez el hire llega a un estado terminal (completado, cancelado, disputa
    // resuelta…), el badge de la cita no aporta nada nuevo — el propio badge del
    // hire ya implica que la cita terminó. Evita mostrar dos pastillas redundantes.
    const showAppointmentBadge =
        !!appointment && !!appointmentStatusInfo &&
        !isTerminalSearchHireStatus(searchHireStatus || '', searchHireStatusInfo);

    // ✅ Manejo elegante de errores con toast (DEBE estar antes de cualquier return)
    useErrorHandler(error, isError);

    if (isLoading) {
        // Skeleton que ESPEJA el layout real (cabecera + chat + sidebar) reutilizando
        // sus mismas constantes de marco → sin salto de layout al llegar el contenido.
        return <SearchDetailsSkeleton embedded={embedded} />;
    }

    // Verificar si es error de red
    const isNetworkErr = isError && error && isNetworkError(error);
    
    // Solo mostrar pantalla de error si es crítico y no es un error de red (los de red se manejan con toast)
    if (isError && error && !isNetworkErr) {
        return (
            <div className={`flex items-center justify-center bg-surface-tinted p-4 ${embedded ? 'h-full min-h-[20rem]' : 'min-h-screen'}`}>
                <div className="text-center space-y-4 max-w-md">
                    <div className="w-16 h-16 bg-line-soft rounded-full flex items-center justify-center mx-auto">
                        <AlertCircle className="w-8 h-8 text-ink-soft" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-ink-strong">Error al cargar</p>
                        <p className="text-xs text-ink-muted">
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

    // Clases de layout conscientes del modo. Embebido = diseño PLANO (sin tarjetas
    // ni bordes/sombra: chat y detalles a ras, separados por una hairline). Móvil
    // (no embebido) = edge-to-edge, sin el marco de tarjeta ni el padding exterior.
    const sdInnerClass = embedded
        ? 'flex h-full w-full min-h-0 flex-1 flex-col'
        : SD_SEARCH_DETAILS_DESKTOP_INNER_CLASS;
    const sdLayoutClass = embedded
        ? 'flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row md:items-stretch'
        : `${SD_SEARCH_DETAILS_DESKTOP_LAYOUT_CLASS} max-md:gap-0 max-md:p-0`;
    const sdChatClass = embedded
        ? `${SD_SEARCH_DETAILS_DESKTOP_CHAT_CLASS} overflow-hidden md:border-r md:border-line`
        : `${SD_SEARCH_DETAILS_DESKTOP_CHAT_CLASS} ${SD_SEARCH_DETAILS_DESKTOP_CHAT_CARD_CLASS} max-md:rounded-none max-md:border-0 max-md:shadow-none`;
    const sdSidebarClass = embedded
        ? `${SD_SEARCH_DETAILS_DESKTOP_SIDEBAR_CLASS} overflow-hidden bg-white`
        : `${SD_SEARCH_DETAILS_DESKTOP_SIDEBAR_CLASS} ${SD_SEARCH_DETAILS_DESKTOP_SIDEBAR_CARD_CLASS}`;

    return (
        <div className={
            embedded
                ? `relative flex h-full min-h-0 flex-col overflow-hidden bg-surface-tinted`
                : `fixed inset-0 z-30 flex flex-col overflow-hidden bg-surface-tinted h-[calc(var(--vh,1vh)*100)] md:relative md:inset-auto md:z-auto md:h-[calc(var(--vh,1vh)*100-4rem)] md:max-h-[calc(var(--vh,1vh)*100-4rem)] ${SD_SEARCH_DETAILS_DESKTOP_PAGE_CLASS}`
        }>
            {/* Header de página — oculto cuando va incrustado (la bandeja ya aporta cabecera) */}
            {!embedded && (
            <header className="hidden md:flex flex-shrink-0 z-50 border-b border-line bg-white">
                <div className={`${SD_SEARCH_DETAILS_DESKTOP_INNER_CLASS} px-6 py-3.5`}>
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onBack || (() => navigate('/hires'))}
                                className="h-9 w-9 shrink-0 rounded-full hover:bg-surface-tinted"
                            >
                                <ArrowLeft className="h-4 w-4 text-ink" />
                            </Button>
                            <div className="min-w-0 flex-1">
                                <h1 className="truncate font-display text-title font-semibold tracking-[-0.02em] text-ink-strong">
                                    {search?.title || serviceInfo?.name || category?.name || 'Contratación'}
                                </h1>
                                {searchHireStatusInfo && (
                                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                        {renderHireStatusBadges()}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-1">
                            <Button variant="ghost" size="icon" onClick={handleShare} className="h-9 w-9 rounded-full hover:bg-surface-tinted" title="Compartir" aria-label="Compartir">
                                <Share2 className="h-4 w-4 text-ink-muted" />
                            </Button>
                        </div>
                    </div>
                </div>
            </header>
            )}

            {searchHireStatus === SEARCH_HIRE_STATUS.TRANSFER_FAILED && (
                <div className="mx-4 mt-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    <div className="flex items-center gap-2 font-medium">
                        <AlertCircle className="h-4 w-4" />
                        Error en la transferencia de pago
                    </div>
                    <p className="mt-1">
                        El servicio se completó, pero el pago al experto no se pudo transferir.
                        {isClient
                            ? ' Tu dinero no corre riesgo: nuestro equipo ya lo está revisando.'
                            : ' Nuestro equipo ya lo está revisando para que recibas tu pago.'}
                    </p>
                    <button
                        type="button"
                        onClick={() => navigate('/help')}
                        className="mt-2 text-sm font-semibold text-destructive underline underline-offset-2 hover:no-underline"
                    >
                        Contactar con soporte
                    </button>
                </div>
            )}

            {/* ✅ Mensaje simple para errores de red */}
            {isNetworkErr && (
                <div className="flex flex-col items-center justify-center py-16 px-4 flex-1 bg-surface-tinted overflow-y-auto">
                    <div className="flex flex-col items-center gap-4 max-w-sm text-center">
                        <div className="w-16 h-16 rounded-full bg-line-soft flex items-center justify-center">
                            <WifiOff className="w-8 h-8 text-ink-soft" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-ink-strong">
                                No se pudo conectar con el servidor
                            </p>
                            <p className="text-xs text-ink-muted">
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
            <div className={sdInnerClass}>
            <div className={`${sdLayoutClass} ${embedded ? 'bg-white' : 'bg-surface-tinted md:bg-transparent'}`} style={{ minHeight: 0, flex: '1 1 0%' }}>
                {/* Chat Section - Izquierda en desktop, tabs en móvil */}
                {canViewChat && (
                    <div className={sdChatClass}>
                        <div className="flex h-full min-h-0 w-full flex-col">
                            <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-white">
                                <Chat
                                    searchId={searchHireId ? null : searchId}
                                    searchHireId={searchHireId}
                                    isExpert={!!isExpert}
                                    hireClientUserId={clientId > 0 ? clientId : null}
                                    hireExpertUserId={expertUserId > 0 ? expertUserId : null}
                                    expertData={{
                                        name: expertData?.name,
                                        profilePictureUrl: expertData?.profilePictureUrl,
                                    }}
                                    isDetailsOpen={mobileDetailsOpen}
                                    onOpenDetails={() => setMobileDetailsOpen((v) => !v)}
                                    onBack={onBack || (() => navigate('/hires'))}
                                    embedded={embedded}
                                    hideHeaderOnMd={!embedded}
                                />
                            </div>

                            <MobileDetailsSheet
                                open={mobileDetailsOpen}
                                onOpenChange={setMobileDetailsOpen}
                                title="Detalles del servicio"
                            >
                                <div className="space-y-6 pb-24">
                                {/* Service Info */}
                                <div className="space-y-4">
                                    {/* Estado — solo badges, sin título de sección */}
                                    {(searchHireStatusInfo || (appointment && appointmentStatusInfo)) && (
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {renderHireStatusBadges()}
                                        </div>
                                    )}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-meta text-ink-strong">
                                            <Tag className="h-4 w-4 shrink-0 text-ink-soft" strokeWidth={1.75} />
                                            <span>{serviceInfo?.categoryName || category?.name || 'N/A'}</span>
                                        </div>
                                        {serviceInfo?.serviceTypeName && (
                                            <div className="text-meta">
                                                <span className="text-ink-muted">Tipo: </span>
                                                <span className="font-medium text-ink-strong">{serviceInfo.serviceTypeName}</span>
                                            </div>
                                        )}
                                        {search?.description && (
                                            <p className="sd-user-text break-words text-meta leading-relaxed text-ink-muted">
                                                {search.description}
                                            </p>
                                        )}
                                        {serviceInfo?.locationRange && (
                                            <p className="text-caption text-ink-muted">
                                                Radio de servicio <span className="font-medium text-ink-strong">{serviceInfo.locationRange} km</span>
                                            </p>
                                        )}
                                        {renderPriceSummary()}
                                    </div>

                                    {/* Accordion para explicar el estado - Múltiples desplegables */}
                                    {searchHireStatusInfo && (
                                        <Accordion type="multiple" className="w-full">
                                            <AccordionItem value="status-info" className="border-none">
                                                <AccordionTrigger className="py-2 text-caption font-normal text-ink-muted hover:text-ink-strong hover:no-underline">
                                                    ¿Qué significa este estado?
                                                </AccordionTrigger>
                                                <AccordionContent className="pt-2 pb-0 text-caption text-ink-muted">
                                                    <p className="leading-relaxed">
                                                        {searchHireStatusInfo.description || 'Estado del servicio contratado.'}
                                                    </p>
                                                    {searchHireStatusInfo.statusValue === 'pending' && (
                                                        <p className="mt-2 border-t border-line-soft pt-2">
                                                            El experto aún no ha aceptado la contratación. Puedes comunicarte con él a través del chat.
                                                        </p>
                                                    )}
                                                </AccordionContent>
                                            </AccordionItem>
                                            {searchHireStatuses && Array.isArray(searchHireStatuses) && searchHireStatuses.length > 0 && (
                                                <AccordionItem value="status-timeline" className="border-none">
                                                    <AccordionTrigger className="py-2 text-caption font-normal text-ink-muted hover:text-ink-strong hover:no-underline">
                                                        Historial del estado
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
                                    <div className="mt-6 border-t border-line-soft pt-5 md:hidden">
                                        <div className="mb-2.5 flex items-center justify-between gap-2">
                                            <SdSectionTitle>Cita</SdSectionTitle>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-kicker font-medium text-ink-muted">
                                                    {appointment
                                                        ? (appointmentStatusInfo?.displayName ||
                                                            (appointment.status === 'appointment_proposed' ? 'Propuesta' :
                                                             appointment.status === 'appointment_confirmed' ? 'Confirmada' :
                                                             'Cita'))
                                                        : 'Pendiente'}
                                                </span>
                                                {renderAdminSkipReportButton()}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            {appointment ? (
                                                <>
                                                    {appointment.proposedDate && appointment.proposedTime && (() => {
                                                        // ✅ CORRECTO: Usar campos *Local que el backend proporciona (ya están en hora local)
                                                        // ⚠️ NO usar proposedDate/proposedTime para mostrar (están en UTC)
                                                        const dateToUse = appointment.proposedDateLocal || appointment.proposedDate;
                                                        const timeToUse = appointment.proposedTimeLocal || appointment.proposedTime;
                                                        return (
                                                            <p className="text-meta font-medium text-ink-strong">
                                                                {new Date(dateToUse).toLocaleDateString('es-ES', {
                                                                    day: 'numeric',
                                                                    month: 'short',
                                                                    year: 'numeric'
                                                                })} · {timeToUse.substring(0, 5)}
                                                            </p>
                                                        );
                                                    })()}
                                                    {appointment.location && (
                                                        <p className="text-meta leading-relaxed text-ink-muted">
                                                            {appointment.location}
                                                            {appointment.doorNumber && (
                                                                <span className="mt-0.5 block text-ink-muted">
                                                                    Puerta <span className="font-medium text-ink-strong">{appointment.doorNumber}</span>
                                                                </span>
                                                            )}
                                                        </p>
                                                    )}
                                                    {appointment.doorNumber && !appointment.location && (
                                                        <p className="text-meta text-ink-muted">
                                                            Puerta <span className="font-medium text-ink-strong">{appointment.doorNumber}</span>
                                                        </p>
                                                    )}
                                                    {/* Entregables — el producto de la compra: tarjeta con icono por tipo y descarga visible */}
                                                    {appointment.status === 'appointment_report_sent' && deliverables && deliverables.length > 0 && (
                                                        <div className="space-y-2 pt-2">
                                                            <div className="flex items-center gap-1.5 text-caption font-medium text-success">
                                                                <FileCheck className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                                                                <span>Informe enviado</span>
                                                            </div>
                                                            {deliverables.map((deliverable) => {
                                                                // Nombre limpio: sin query string (las URLs firmadas llevan ?token=…)
                                                                const fileName = (deliverable.url.split('/').pop() || 'archivo').split('?')[0];
                                                                const isVideo = /\.(mp4|mov|webm)$/i.test(fileName);
                                                                const TypeIcon = isVideo ? Film : FileText;
                                                                return (
                                                                    <a
                                                                        key={deliverable.id}
                                                                        href={deliverable.url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="group flex w-full items-center gap-3 rounded-xl border border-line bg-white p-3 transition-colors hover:border-brand/40 hover:bg-surface-tinted"
                                                                    >
                                                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10">
                                                                            <TypeIcon className="h-4 w-4 text-brand" strokeWidth={1.75} aria-hidden />
                                                                        </span>
                                                                        <span className="min-w-0 flex-1">
                                                                            <span className="block truncate text-meta font-medium text-ink-strong">
                                                                                {isVideo ? 'Vídeo de la inspección' : 'Informe de inspección'}
                                                                            </span>
                                                                            <span className="mt-0.5 block truncate text-caption text-ink-muted">{fileName}</span>
                                                                        </span>
                                                                        <Download className="h-4 w-4 shrink-0 text-ink-soft transition-colors group-hover:text-ink-strong" strokeWidth={1.75} aria-hidden />
                                                                    </a>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <div>
                                                    <p className="text-meta leading-relaxed text-ink-muted">{noAppointmentMessage}</p>
                                                    {/* FIX [GAP-CANCEL-UI]: cancelación sin coste prometida en el checkout
                                                        (modo seller, antes de que el vendedor reserve). */}
                                                    {isClient && coordinationMode === 'seller' && !isSearchHireFinalized && (
                                                        <button
                                                            type="button"
                                                            onClick={handleCancelSellerBooking}
                                                            disabled={cancellingSellerBooking}
                                                            className="mt-2 text-caption text-ink-muted underline underline-offset-2 transition-colors hover:text-ink-strong disabled:opacity-50"
                                                        >
                                                            {cancellingSellerBooking ? 'Cancelando…' : 'Cancelar sin coste'}
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        {appointment && appointmentStatusInfo && appointmentStatuses && Array.isArray(appointmentStatuses) && appointmentStatuses.length > 0 && (
                                            <Accordion type="single" collapsible className="mt-3 w-full">
                                                <AccordionItem value="appointment-timeline" className="border-none">
                                                    <AccordionTrigger className="py-2 text-caption font-normal text-ink-muted hover:text-ink-strong hover:no-underline">
                                                        Historial del estado
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
                                )}

                                {/* Cliente */}
                                {search?.user && (
                                    <div className="border-t border-line-soft pt-5">
                                        {renderClienteBlock()}
                                    </div>
                                )}

                                {/* Experto */}
                                {expertData && (
                                    <div className="border-t border-line-soft pt-5">
                                        {renderExpertoBlock()}
                                    </div>
                                )}

                                {/* Subir informe (móvil) — selección de archivos; el envío está en la barra fija */}
                                {isExpert && appointment?.status === 'appointment_awaiting_report' && (
                                    <div className="space-y-3 border-t border-line-soft pt-5">
                                        <SdSectionTitle>Subir informe</SdSectionTitle>
                                        {fileValidation && (
                                            <div className={`rounded-xl px-3 py-2.5 text-caption font-medium ${
                                                fileValidation.canSubmit
                                                    ? 'bg-success-tint text-success'
                                                    : 'bg-warning-tint text-warning-text'
                                            }`} role="status">
                                                {fileValidation.message}
                                            </div>
                                        )}
                                        {uploadedFiles.length > 0 && (
                                            <div className="space-y-1.5">
                                                {uploadedFiles.map((file) => (
                                                    <div key={file.id} className="flex items-center justify-between rounded-lg border border-line bg-white px-2.5 py-2 text-caption">
                                                        <div className="flex min-w-0 items-center gap-2">
                                                            <FileText className="h-3.5 w-3.5 shrink-0 text-ink-soft" strokeWidth={1.75} />
                                                            <span className="truncate text-ink-strong">{file.fileName}</span>
                                                        </div>
                                                        <Button
                                                            onClick={() => handleDeleteFile(file.id)}
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-11 w-11 shrink-0 p-0 text-ink-soft hover:text-ink-strong"
                                                            aria-label={`Eliminar ${file.fileName}`}
                                                        >
                                                            <X className="h-3.5 w-3.5" />
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
                                            <div className="group w-full cursor-pointer rounded-xl border-2 border-dashed border-line p-5 text-center transition-colors hover:border-brand/40 hover:bg-surface-tinted">
                                                <div className="mx-auto mb-2.5 flex h-10 w-10 items-center justify-center rounded-full bg-line-soft transition-colors group-hover:bg-brand/10">
                                                    <Upload className="h-5 w-5 text-ink-muted transition-colors group-hover:text-brand" strokeWidth={1.75} />
                                                </div>
                                                <p className="mb-0.5 text-meta font-semibold text-ink-strong">Seleccionar archivos</p>
                                                <p className="text-caption text-ink-muted">
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
                                                    <div key={index} className="flex items-center justify-between rounded-lg border border-line bg-white px-2.5 py-2 text-caption">
                                                        <span className="truncate text-ink-strong">{file.name}</span>
                                                        <Button
                                                            onClick={() => removeSelectedFile(index)}
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-11 w-11 shrink-0 p-0 text-ink-soft hover:text-ink-strong"
                                                            aria-label={`Eliminar ${file.name}`}
                                                        >
                                                            <X className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <Button
                                            onClick={handleSubmitReport}
                                            className={`h-11 w-full font-semibold transition-colors ${
                                                fileValidation && !fileValidation.canSubmit
                                                    ? 'cursor-not-allowed bg-line text-ink-soft hover:bg-line'
                                                    : 'bg-brand text-white hover:bg-brand-hover'
                                            }`}
                                            disabled={(fileValidation ? !fileValidation.canSubmit : false) || isSubmittingReport}
                                            size="sm"
                                        >
                                            {isSubmittingReport ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden />
                                                    Enviando...
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle className="w-4 h-4 mr-2" />
                                                    Enviar informe
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                )}

                                {review && (
                                    <div className="space-y-2.5 border-t border-line-soft pt-5">
                                        {renderExistingReview()}
                                    </div>
                                )}

                                    {/* Botones de acción en el panel de detalles (móvil) */}
                                    {(appointmentButtons.showCancel || appointmentButtons.showAccept || appointmentButtons.showReject || canDispute || canApprove || canExpertRespond) && (
                                        <div className="md:hidden sticky bottom-0 -mx-5 border-t border-line bg-white px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] space-y-3 shadow-[0_-4px_20px_rgba(15,23,42,0.08)]">
                                            {/* Información de la cita propuesta - Solo para experto cuando puede aceptar/rechazar */}
                                            {appointmentButtons.showAccept && appointment && appointment.proposedDate && appointment.proposedTime && (
                                                <div className="space-y-1.5 border-b border-line-soft pb-3">
                                                    <p className="text-meta font-medium text-ink-strong">
                                                        {(() => {
                                                            // ✅ CORRECTO: Usar campos *Local que el backend proporciona (ya están en hora local)
                                                            // ⚠️ NO usar proposedDate/proposedTime para mostrar (están en UTC)
                                                            const dateToUse = appointment.proposedDateLocal || appointment.proposedDate;
                                                            const timeToUse = appointment.proposedTimeLocal || appointment.proposedTime;
                                                            return `${new Date(dateToUse).toLocaleDateString('es-ES', {
                                                                day: 'numeric',
                                                                month: 'short',
                                                                year: 'numeric'
                                                            })} · ${timeToUse.substring(0, 5)}`;
                                                        })()}
                                                    </p>
                                                    <p className="text-meta leading-relaxed text-ink-muted">
                                                        {appointment.location && appointment.location.trim()
                                                            ? appointment.location
                                                            : 'Ubicación no aportada'}
                                                        <span className="mt-0.5 block text-ink-muted">
                                                            Puerta <span className="font-medium text-ink-strong">
                                                                {appointment.doorNumber && appointment.doorNumber.trim()
                                                                    ? appointment.doorNumber
                                                                    : 'no aportada'}
                                                            </span>
                                                            <span className="px-1.5 text-ink-soft">·</span>
                                                            Tel. <span className="font-medium text-ink-strong">
                                                                {appointment.phoneNumber && appointment.phoneNumber.trim()
                                                                    ? appointment.phoneNumber
                                                                    : 'no aportado'}
                                                            </span>
                                                        </span>
                                                    </p>
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
                                                        className="h-11 flex-1"
                                                        size="sm"
                                                        disabled={isConfirming || isRejecting}
                                                    >
                                                        {isConfirming ? (
                                                            <>
                                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden />
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
                                                        className="h-11 flex-1"
                                                        size="sm"
                                                        disabled={isConfirming || isRejecting}
                                                    >
                                                        {isRejecting ? (
                                                            <>
                                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden />
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
                                                        className="h-11 w-full border-line text-ink-strong hover:bg-surface-tinted"
                                                        size="sm"
                                                        disabled={isCancelling}
                                                    >
                                                        {isCancelling ? (
                                                            <>
                                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden />
                                                                Cancelando...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <XCircle className="w-4 h-4 mr-2" />
                                                                Cancelar cita
                                                            </>
                                                        )}
                                                    </Button>
                                                )}

                                                {/* ✅ BOTÓN: Cancelar SIN COSTE mientras el experto no confirme (cliente). Pago solo
                                                    autorizado → devolución 100% a 0€. Estado appointment_pending_expert_confirmation. */}
                                                {appointmentButtons.showCancelPending && (
                                                    <div className="w-full flex flex-col gap-1.5">
                                                        <Button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                handleAppointmentAction('cancelPending', appointment as Appointment);
                                                            }}
                                                            variant="outline"
                                                            className="h-11 w-full border-line text-ink-strong hover:bg-surface-tinted"
                                                            size="sm"
                                                        >
                                                            <XCircle className="w-4 h-4 mr-2" />
                                                            Cancelar cita
                                                        </Button>
                                                        <p className="text-caption leading-relaxed text-ink-muted">
                                                            El experto aún no ha confirmado. Si cancelas ahora no se te cobra nada (devolución del 100%).
                                                        </p>
                                                    </div>
                                                )}

                                            </div>

                                            {/* ✅ Acciones Principales - Aprobar/Disputar/Responder */}
                                            {canApprove && (
                                                <Button
                                                    onClick={handleApproveService}
                                                    className="h-11 w-full bg-brand text-white hover:bg-brand-hover"
                                                    size="sm"
                                                >
                                                    <CheckCircle className="w-4 h-4 mr-2" />
                                                    Aprobar servicio
                                                </Button>
                                            )}
                                            {canDispute && (
                                                <Button
                                                    onClick={() => setModalState((prev) => ({ ...prev, showDisputeModal: true }))}
                                                    variant="outline"
                                                    className="h-11 w-full border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
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
                                                    className="h-11 w-full border-line text-ink-strong hover:bg-surface-tinted"
                                                    size="sm"
                                                >
                                                    <MessageCircle className="w-4 h-4 mr-2" />
                                                    Responder disputa
                                                </Button>
                                            )}
                                        </div>
                                    )}

                                    {/* Escribir Reseña */}
                                    {canReview && (
                                        <div className="space-y-2.5 border-t border-line-soft pt-5">
                                            <SdSectionTitle>Reseña</SdSectionTitle>
                                            <Button
                                                onClick={() => setModalState((prev) => ({ ...prev, showReviewModal: true }))}
                                                variant="outline"
                                                className="h-11 w-full border-line text-ink-strong hover:bg-surface-tinted"
                                                size="sm"
                                            >
                                                <Star className="w-4 h-4 mr-2" />
                                                Escribir reseña
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </MobileDetailsSheet>
                        </div>
                    </div>
                )}

                {/* Sidebar — detalles + acciones (desktop) */}
                <aside className={sdSidebarClass}>
                    <div className={`${SD_CHECKOUT_DESKTOP_CARD_HEADER_CLASS} shrink-0 py-3.5`}>
                        {(() => {
                            const categoryLabel = (serviceInfo as { categoryName?: string } | undefined)?.categoryName || category?.name || '';
                            const typeLabel = serviceInfo?.serviceTypeName || '';
                            const primary = typeLabel || categoryLabel || 'Detalles del servicio';
                            return (
                                <h2 className="truncate text-lead font-semibold tracking-[-0.01em] text-ink-strong">{primary}</h2>
                            );
                        })()}
                        {searchHireStatusInfo && (
                            <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                {renderHireStatusBadges()}
                            </div>
                        )}
                    </div>
                    {/* [&>div>div]:!block — el viewport de Radix usa display:table (min-width:100%),
                        que deja crecer el contenido más allá del panel (nombres de archivo largos
                        rompían el borde derecho). En bloque, truncate vuelve a funcionar. */}
                    <ScrollArea className="min-h-0 flex-1 [&>div>div]:!block">
                        <div className="space-y-4 p-4">
                            
                            {/* Resumen del Servicio */}
                                <div className="space-y-3">
                                <div className="space-y-3">
                                    {search?.description && (
                                        <p className="sd-user-text break-words text-meta leading-relaxed text-ink-muted">
                                            {search.description}
                                        </p>
                                    )}
                                    {(search?.createdAt || serviceInfo?.locationRange) && (
                                        <p className="text-caption text-ink-soft">
                                            {search?.createdAt && (
                                                <>Creado el {new Date(search.createdAt).toLocaleDateString('es-ES', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}</>
                                            )}
                                            {search?.createdAt && serviceInfo?.locationRange && <span className="px-1.5 text-ink-soft">·</span>}
                                            {serviceInfo?.locationRange && <>Radio {serviceInfo.locationRange} km</>}
                                        </p>
                                    )}
                                    {renderPriceSummary()}
                            </div>

                                {/* Cita — fecha, lugar y estado */}
                                {needsAppointment && (
                                    <div className="pt-1">
                                        <div className="mb-2.5 flex items-center justify-between gap-2">
                                            <SdSectionTitle>Cita</SdSectionTitle>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-kicker font-medium text-ink-muted">
                                                    {appointment
                                                        ? (appointmentStatusInfo?.displayName ||
                                                            (appointment.status === 'appointment_proposed' ? 'Propuesta' :
                                                             appointment.status === 'appointment_confirmed' ? 'Confirmada' :
                                                             'Cita'))
                                                        : 'Pendiente'}
                                                </span>
                                                {renderAdminSkipReportButton()}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            {appointment ? (
                                                <>
                                                    {appointment.proposedDate && appointment.proposedTime && (() => {
                                                        // ✅ CORRECTO: Usar campos *Local que el backend proporciona (ya están en hora local)
                                                        // ⚠️ NO usar proposedDate/proposedTime para mostrar (están en UTC)
                                                        const dateToUse = appointment.proposedDateLocal || appointment.proposedDate;
                                                        const timeToUse = appointment.proposedTimeLocal || appointment.proposedTime;
                                                        return (
                                                            <p className="text-meta font-medium text-ink-strong">
                                                                {new Date(dateToUse).toLocaleDateString('es-ES', {
                                                                    day: 'numeric',
                                                                    month: 'short',
                                                                    year: 'numeric'
                                                                })} · {timeToUse.substring(0, 5)}
                                                            </p>
                                                        );
                                                    })()}
                                                    {appointment.location && (
                                                        <p className="text-meta leading-relaxed text-ink-muted">
                                                            {appointment.location}
                                                            {appointment.doorNumber && (
                                                                <span className="mt-0.5 block text-ink-soft">
                                                                    Puerta <span className="font-medium text-ink-strong">{appointment.doorNumber}</span>
                                                                </span>
                                                            )}
                                                        </p>
                                                    )}
                                                    {appointment.doorNumber && !appointment.location && (
                                                        <p className="text-meta text-ink-muted">
                                                            Puerta <span className="font-medium text-ink-strong">{appointment.doorNumber}</span>
                                                        </p>
                                                    )}
                                                    {/* Entregables (Desktop) — mismo tratamiento de tarjeta que en móvil */}
                                                    {appointment.status === 'appointment_report_sent' && deliverables && deliverables.length > 0 && (
                                                        <div className="space-y-2 pt-2">
                                                            <div className="flex items-center gap-1.5 text-caption font-medium text-success">
                                                                <FileCheck className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                                                                <span>Informe enviado</span>
                                                            </div>
                                                            {deliverables.map((deliverable) => {
                                                                // Nombre limpio: sin query string (las URLs firmadas llevan ?token=…)
                                                                const fileName = (deliverable.url.split('/').pop() || 'archivo').split('?')[0];
                                                                const isVideo = /\.(mp4|mov|webm)$/i.test(fileName);
                                                                const TypeIcon = isVideo ? Film : FileText;
                                                                return (
                                                                    <a
                                                                        key={deliverable.id}
                                                                        href={deliverable.url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="group flex w-full items-center gap-3 rounded-xl border border-line bg-white p-3 transition-colors hover:border-brand/40 hover:bg-surface-tinted"
                                                                    >
                                                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10">
                                                                            <TypeIcon className="h-4 w-4 text-brand" strokeWidth={1.75} aria-hidden />
                                                                        </span>
                                                                        <span className="min-w-0 flex-1">
                                                                            <span className="block truncate text-meta font-medium text-ink-strong">
                                                                                {isVideo ? 'Vídeo de la inspección' : 'Informe de inspección'}
                                                                            </span>
                                                                            <span className="mt-0.5 block truncate text-caption text-ink-muted">{fileName}</span>
                                                                        </span>
                                                                        <Download className="h-4 w-4 shrink-0 text-ink-soft transition-colors group-hover:text-ink-strong" strokeWidth={1.75} aria-hidden />
                                                                    </a>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <div>
                                                    <p className="text-meta leading-relaxed text-ink-muted">{noAppointmentMessage}</p>
                                                    {/* FIX [GAP-CANCEL-UI]: cancelación sin coste prometida en el checkout
                                                        (modo seller, antes de que el vendedor reserve). */}
                                                    {isClient && coordinationMode === 'seller' && !isSearchHireFinalized && (
                                                        <button
                                                            type="button"
                                                            onClick={handleCancelSellerBooking}
                                                            disabled={cancellingSellerBooking}
                                                            className="mt-2 text-caption text-ink-muted underline underline-offset-2 transition-colors hover:text-ink-strong disabled:opacity-50"
                                                        >
                                                            {cancellingSellerBooking ? 'Cancelando…' : 'Cancelar sin coste'}
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* ✅ Botones de acción para desktop - Según la guía - Fuera de needsAppointment para que siempre se muestren */}
                                {(appointmentButtons.showCancel || appointmentButtons.showAccept || appointmentButtons.showReject) && (
                                    <div className="mt-4 hidden pt-4 md:block">
                                        <div className="space-y-3">
                                            {/* Información de la cita propuesta - Solo para experto cuando puede aceptar/rechazar */}
                                            {appointmentButtons.showAccept && appointment && appointment.proposedDate && appointment.proposedTime && (
                                                <div className="space-y-1.5 border-b border-line-soft pb-3">
                                                    <p className="text-meta font-medium text-ink-strong">
                                                        {(() => {
                                                            // ✅ CORRECTO: Usar campos *Local que el backend proporciona (ya están en hora local)
                                                            // ⚠️ NO usar proposedDate/proposedTime para mostrar (están en UTC)
                                                            const dateToUse = appointment.proposedDateLocal || appointment.proposedDate;
                                                            const timeToUse = appointment.proposedTimeLocal || appointment.proposedTime;
                                                            return `${new Date(dateToUse).toLocaleDateString('es-ES', {
                                                                day: 'numeric',
                                                                month: 'short',
                                                                year: 'numeric'
                                                            })} · ${timeToUse.substring(0, 5)}`;
                                                        })()}
                                                    </p>
                                                    <p className="text-meta leading-relaxed text-ink-muted">
                                                        {appointment.location && appointment.location.trim()
                                                            ? appointment.location
                                                            : 'Ubicación no aportada'}
                                                        <span className="mt-0.5 block text-ink-muted">
                                                            Puerta <span className="font-medium text-ink-strong">
                                                                {appointment.doorNumber && appointment.doorNumber.trim()
                                                                    ? appointment.doorNumber
                                                                    : 'no aportada'}
                                                            </span>
                                                            <span className="px-1.5 text-ink-soft">·</span>
                                                            Tel. <span className="font-medium text-ink-strong">
                                                                {appointment.phoneNumber && appointment.phoneNumber.trim()
                                                                    ? appointment.phoneNumber
                                                                    : 'no aportado'}
                                                            </span>
                                                        </span>
                                                    </p>
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
                                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden />
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
                                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden />
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
                                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden />
                                                                Cancelando...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <XCircle className="w-4 h-4 mr-2" />
                                                                Cancelar cita
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
                                <div className="pt-4">
                                    {renderClienteBlock()}
                                </div>
                            )}

                            {/* Experto */}
                            {expertData && (
                                <div className="pt-4">
                                    {renderExpertoBlock()}
                                </div>
                            )}


                            {/* Acciones Principales */}
                            {(canDispute || canApprove || canExpertRespond) && (
                                <div className="space-y-2.5 pt-4">
                                    <SdSectionTitle>Acciones</SdSectionTitle>
                                    <div className="space-y-2">
                                        {canApprove && (
                                            <Button
                                                onClick={handleApproveService}
                                                className="h-10 w-full bg-brand text-white hover:bg-brand-hover"
                                                size="sm"
                                            >
                                                <CheckCircle className="mr-2 h-4 w-4" />
                                                Aprobar servicio
                                            </Button>
                                        )}
                                        {canDispute && (
                                            <Button
                                                onClick={() => setModalState((prev) => ({ ...prev, showDisputeModal: true }))}
                                                variant="outline"
                                                className="h-10 w-full border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                size="sm"
                                            >
                                                <AlertTriangle className="mr-2 h-4 w-4" />
                                                Disputar
                                            </Button>
                                        )}
                                        {canExpertRespond && (
                                            <Button
                                                onClick={() => setShowExpertResponseModal(true)}
                                                variant="outline"
                                                className="h-10 w-full border-line text-ink-strong hover:bg-surface-tinted"
                                                size="sm"
                                            >
                                                <MessageCircle className="mr-2 h-4 w-4" />
                                                Responder disputa
                                            </Button>
                                        )}
                                </div>
                                </div>
                        )}


                            {/* Subir Informe */}
                        {isExpert && appointment?.status === 'appointment_awaiting_report' && (
                                <div className="space-y-3 pt-4">
                                    <SdSectionTitle>Subir informe</SdSectionTitle>
                                {fileValidation && (
                                            <div className={`rounded-xl px-3 py-2.5 text-caption font-medium ${
                                        fileValidation.canSubmit
                                                    ? 'bg-success-tint text-success'
                                                    : 'bg-warning-tint text-warning-text'
                                            }`}>
                                                {fileValidation.message}
                                    </div>
                                )}
                                {uploadedFiles.length > 0 && (
                                            <div className="space-y-1.5">
                                            {uploadedFiles.map((file) => (
                                                    <div key={file.id} className="flex items-center justify-between rounded-lg border border-line bg-white px-2.5 py-2 text-caption">
                                                    <div className="flex min-w-0 items-center gap-2">
                                                            <FileText className="h-3.5 w-3.5 shrink-0 text-ink-soft" strokeWidth={1.75} />
                                                            <span className="truncate text-ink-strong">{file.fileName}</span>
                                                    </div>
                                                        <Button
                                                        onClick={() => handleDeleteFile(file.id)}
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 shrink-0 rounded-full p-0 text-ink-soft hover:bg-surface-tinted hover:text-ink-strong"
                                                            aria-label={`Eliminar ${file.fileName}`}
                                                    >
                                                            <X className="h-3.5 w-3.5" />
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
                                            <div className="group w-full cursor-pointer rounded-xl border-2 border-dashed border-line p-6 text-center transition-colors hover:border-brand/40 hover:bg-surface-tinted">
                                                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-line-soft transition-colors group-hover:bg-brand/10">
                                                    <Upload className="h-5 w-5 text-ink-muted transition-colors group-hover:text-brand" strokeWidth={1.75} />
                                                </div>
                                                <p className="mb-0.5 text-meta font-semibold text-ink-strong">Seleccionar archivos</p>
                                                <p className="text-caption text-ink-muted">
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
                                                    <div key={index} className="flex items-center justify-between rounded-lg border border-line bg-white px-2.5 py-2 text-caption">
                                                        <span className="truncate text-ink-strong">{file.name}</span>
                                                        <Button
                                                        onClick={() => removeSelectedFile(index)}
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 shrink-0 rounded-full p-0 text-ink-soft hover:bg-surface-tinted hover:text-ink-strong"
                                                            aria-label={`Eliminar ${file.name}`}
                                                    >
                                                            <X className="h-3.5 w-3.5" />
                                                        </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                        <Button
                                            onClick={handleSubmitReport}
                                            className={`h-11 w-full font-semibold transition-colors ${
                                                fileValidation && !fileValidation.canSubmit
                                                    ? 'cursor-not-allowed bg-line text-ink-soft hover:bg-line'
                                                    : 'bg-brand text-white hover:bg-brand-hover'
                                            }`}
                                            disabled={(fileValidation ? !fileValidation.canSubmit : false) || isSubmittingReport}
                                            size="lg"
                                        >
                                            {isSubmittingReport ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" aria-hidden />
                                                    Enviando...
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle className="w-5 h-5 mr-2" />
                                                    Enviar informe
                                                </>
                                            )}
                                        </Button>
                                </div>
                            )}

                            {/* Reseña */}
                            {canReview && (
                                <div className="space-y-2.5 pt-4">
                                    <SdSectionTitle>Reseña</SdSectionTitle>
                                    <Button
                                        onClick={() => setModalState((prev) => ({ ...prev, showReviewModal: true }))}
                                        variant="outline"
                                        className="h-10 w-full border-line text-ink-strong hover:bg-surface-tinted"
                                        size="sm"
                                    >
                                        <Star className="mr-2 h-3.5 w-3.5" />
                                        Escribir reseña
                                    </Button>
                                </div>
                            )}

                            {review && (
                                <div className="space-y-2.5 pt-4">
                                    {renderExistingReview()}
                                </div>
                            )}


                            {/* Espacio mínimo para el final del contenido */}
                            <div className="h-2"></div>
                    </div>
                    </ScrollArea>
                </aside>
            </div>
            </div>
            )}

            {/* Modals */}
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
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar cita</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Quieres aceptar esta cita? El cliente recibirá la confirmación y la cita quedará programada.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    {appointmentToConfirm && (
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-ink-muted">
                                <Calendar className="w-4 h-4 text-ink-soft" />
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
                                <div className="flex items-center gap-2 text-ink-muted">
                                    <MapPin className="w-4 h-4 text-ink-soft" />
                                    <span>{appointmentToConfirm.location}</span>
                                </div>
                            )}
                        </div>
                    )}
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isConfirming}>Volver</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (appointmentToConfirm) {
                                    handleAppointmentAction('confirm', appointmentToConfirm);
                                }
                            }}
                            disabled={isConfirming}
                            className="bg-brand text-white hover:bg-brand-hover"
                        >
                            {isConfirming ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden />
                                    Confirmando...
                                </>
                            ) : (
                                'Confirmar cita'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Alert Dialog genérico para acciones destructivas (cancelar inspección/cita) —
                sustituye a los window.confirm() nativos que rompían la consistencia con el resto
                de diálogos de la página. */}
            <AlertDialog open={!!dangerConfirm} onOpenChange={(open) => { if (!open && !dangerConfirmLoading) setDangerConfirm(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{dangerConfirm?.title}</AlertDialogTitle>
                        <AlertDialogDescription>{dangerConfirm?.description}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={dangerConfirmLoading}>Volver</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleDangerConfirmAction();
                            }}
                            disabled={dangerConfirmLoading}
                            className="bg-destructive text-white hover:bg-destructive/90"
                        >
                            {dangerConfirmLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden />
                                    Cancelando...
                                </>
                            ) : (
                                dangerConfirm?.confirmLabel || 'Confirmar'
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