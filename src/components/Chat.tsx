import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useChat } from '../hooks/useChat';
import { useAuth } from '../contexts/AuthContext';
import { isAdmin } from '../utils/admin';
import { getUserId, isMessageFromUser, normalizeSenderId } from '../utils/userId';
import { getStatusTone, type StatusTone } from '../utils/statusUtils';
import { Send, Paperclip, MapPin, Download, X, Loader2, HelpCircle, Calendar, FileText, MessageSquare, CheckCircle2, CheckCircle, XCircle, AlertCircle, Clock, FileCheck, Info, Share2, ArrowLeft } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { showToast } from '../lib/toast';
import Map, { Marker, NavigationControl, type MapMouseEvent } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

interface ChatProps {
    searchId: number | null;
    isExpert: boolean;
    expertData?: {
        name?: string;
        profilePictureUrl?: string;
    };
    searchHireId?: number;
    /** IDs de participantes desde details-complete (fuente de verdad del hire) */
    hireClientUserId?: number | null;
    hireExpertUserId?: number | null;
    /** Callback para abrir el panel de detalles en móvil */
    onOpenDetails?: () => void;
    /** Para animar la flecha (móvil) */
    isDetailsOpen?: boolean;
    /** Volver / salir del chat */
    onBack?: () => void;
    /**
     * Incrustado dentro de otro contenedor que ya aporta su propia cabecera
     * (p. ej. el panel de la bandeja de Mensajes). Oculta la cabecera interna
     * del chat para no duplicarla. Por defecto false (vista a pantalla completa).
     */
    embedded?: boolean;
}

function formatLastSeen(iso: string): string {
    const diffMs = Date.now() - new Date(iso).getTime();
    if (Number.isNaN(diffMs) || diffMs < 0) return 'hace un momento';
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'hace un momento';
    if (mins < 60) return `hace ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `hace ${hours} h`;
    const days = Math.floor(hours / 24);
    return `hace ${days} d`;
}

type PeerPresenceStatus =
    | { kind: 'typing' }
    | { kind: 'online' }
    | { kind: 'lastSeen'; label: string }
    | null;

function TypingDots({ className = '' }: { className?: string }) {
    return (
        <span className={`inline-flex items-center gap-0.5 ${className}`} aria-hidden>
            {[0, 120, 240].map((delay) => (
                <span
                    key={delay}
                    className="h-1.5 w-1.5 rounded-full bg-current opacity-70 animate-bounce"
                    style={{ animationDelay: `${delay}ms` }}
                />
            ))}
        </span>
    );
}

const defaultCenter = {
    lat: 40.4168,
    lng: -3.7038,
};

// Funciones para detectar y manejar mensajes de cambio de estado de cita
const isAppointmentStatusChangeMessage = (content: string): boolean => {
    return content?.startsWith("APPointmentStatusChange:") ?? false;
};

const extractStatusValue = (content: string): string | null => {
    if (!isAppointmentStatusChangeMessage(content)) {
        return null;
    }
    return content.replace("APPointmentStatusChange:", "");
};

interface StatusDisplay {
    message: string;
    icon: React.ReactNode;
}

const statusDisplayMap: Record<string, StatusDisplay> = {
    appointment_proposed: { message: 'Cita propuesta', icon: <Calendar className="h-3.5 w-3.5" /> },
    appointment_confirmed: { message: 'Cita confirmada', icon: <CheckCircle className="h-3.5 w-3.5" /> },
    appointment_rejected: { message: 'Cita rechazada', icon: <XCircle className="h-3.5 w-3.5" /> },
    appointment_cancelled_by_client: { message: 'Cita cancelada por el cliente', icon: <AlertCircle className="h-3.5 w-3.5" /> },
    appointment_cancelled_by_expert: { message: 'Cita cancelada por el experto', icon: <AlertCircle className="h-3.5 w-3.5" /> },
    appointment_cancelled_by_client_second: { message: 'Cita cancelada por el cliente (segunda cancelación)', icon: <AlertCircle className="h-3.5 w-3.5" /> },
    appointment_cancelled_by_expert_second: { message: 'Cita cancelada por el experto (segunda cancelación)', icon: <AlertCircle className="h-3.5 w-3.5" /> },
    appointment_cancelled_by_no_response: { message: 'Cita cancelada por falta de respuesta', icon: <Clock className="h-3.5 w-3.5" /> },
    appointment_cancelled_by_no_report: { message: 'Cita cancelada: no se envió el informe', icon: <FileText className="h-3.5 w-3.5" /> },
    appointment_report_sent: { message: 'Informe enviado', icon: <FileCheck className="h-3.5 w-3.5" /> },
    appointment_awaiting_report: { message: 'Esperando el informe del experto', icon: <Clock className="h-3.5 w-3.5" /> },
    appointment_cancelled_by_expert_rejection: { message: 'Cita rechazada por el experto', icon: <XCircle className="h-3.5 w-3.5" /> },
};

const getStatusDisplay = (statusValue: string): StatusDisplay => {
    return statusDisplayMap[statusValue] ?? {
        message: 'Estado de la cita actualizado',
        icon: <HelpCircle className="h-3.5 w-3.5" />,
    };
};

// Pill de sistema en el hilo: color solo para desenlaces (éxito verde,
// cancelación/rechazo rojo); los hitos intermedios van en gris tranquilo
// para no encender el historial. Tono decidido por getStatusTone (fuente
// única de la semántica de estados, la misma que StatusBadge).
const CHAT_STATUS_PILL_CLASSES: Record<StatusTone, string> = {
    success: 'border-[#d8ebdf] bg-[#ecf6f0] text-[#0F6A3E]',
    danger: 'border-[#f5dada] bg-[#fdf2f2] text-[#b42318]',
    warning: 'border-[#e3e7ec] bg-white/85 text-[#737373]',
    info: 'border-[#e3e7ec] bg-white/85 text-[#737373]',
    neutral: 'border-[#e3e7ec] bg-white/85 text-[#737373]',
};

const Chat: React.FC<ChatProps> = ({
    searchId,
    isExpert,
    expertData,
    searchHireId,
    hireClientUserId,
    hireExpertUserId,
    onOpenDetails,
    isDetailsOpen,
    onBack,
    embedded = false,
}) => {
    const { user } = useAuth();
    const {
        conversation,
        loading,
        error,
        newMessage,
        setNewMessage,
        sendMessage,
        isSending,
        conversationLoading,
        isReconnecting,
        typingUserIds,
        onlineUserIds,
        lastSeenByUserId,
        notifyTyping,
    } = useChat(searchId, searchHireId);

    const userId = getUserId(user);
    const conversationClientId =
        conversation?.clientId != null ? Number(conversation.clientId) : null;
    const conversationExpertId =
        conversation?.expertId != null ? Number(conversation.expertId) : null;
    const hireClientId =
        hireClientUserId != null && hireClientUserId > 0 ? Number(hireClientUserId) : null;
    const hireExpertId =
        hireExpertUserId != null && hireExpertUserId > 0 ? Number(hireExpertUserId) : null;
    // IDs de conversación tienen prioridad (coinciden con JWT del broadcast typing)
    const expertId = conversationExpertId ?? hireExpertId;
    const clientParticipantId = conversationClientId ?? hireClientId;
    const isClient =
        (conversationClientId != null && userId === conversationClientId) ||
        (hireClientId != null && userId === hireClientId);
    const userIsAdmin = isAdmin(user?.email ?? (user as { Email?: string })?.Email);
    const hasAccess =
        userId > 0 &&
        (userIsAdmin ||
            (conversationClientId != null && userId === conversationClientId) ||
            (conversationExpertId != null && userId === conversationExpertId) ||
            (hireClientId != null && userId === hireClientId) ||
            (hireExpertId != null && userId === hireExpertId) ||
            (isExpert && hireExpertId != null && userId === hireExpertId));
    const isChatLoading = conversationLoading ?? loading;

    // State for image modal
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const lastMessageCount = useRef(conversation?.messages?.length || 0);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [location, setLocation] = useState<{ latitude: string; longitude: string } | null>(null);
    const [isMapModalOpen, setIsMapModalOpen] = useState(false);
    const [selectedMapLocation, setSelectedMapLocation] = useState(defaultCenter);
    const [messageSent, setMessageSent] = useState(false);
    const typingDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const mapboxToken = import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN || '';

    const otherParticipantId = isClient
        ? Number(expertId ?? 0)
        : Number(clientParticipantId ?? 0);

    /** Coincide userId de typing/presencia con el otro participante (tolerante a hire vs conversation) */
    const isOtherParticipant = useCallback(
        (participantUserId: number) => {
            const pid = Number(participantUserId);
            if (!pid || pid === userId) return false;
            if (otherParticipantId > 0 && pid === otherParticipantId) return true;
            if (isClient && conversationExpertId && pid === conversationExpertId) return true;
            if (!isClient && conversationClientId && pid === conversationClientId) return true;
            return false;
        },
        [otherParticipantId, userId, isClient, conversationExpertId, conversationClientId]
    );

    const otherParticipantName = useMemo(() => {
        if (isClient) {
            return expertData?.name || 'Experto';
        }
        const clientMsg = conversation?.messages?.find(
            (m) => m.senderId != null && Number(m.senderId) === Number(otherParticipantId)
        );
        return clientMsg?.senderName || 'Cliente';
    }, [isClient, expertData?.name, conversation?.messages, otherParticipantId]);

    const peerPresenceStatus = useMemo((): PeerPresenceStatus => {
        const otherTyping = typingUserIds.some((id) => isOtherParticipant(id));
        if (otherTyping) return { kind: 'typing' };
        const otherOnline = onlineUserIds.some((id) => isOtherParticipant(id));
        if (otherOnline) return { kind: 'online' };
        const lastSeenEntry = Object.entries(lastSeenByUserId).find(([uid]) =>
            isOtherParticipant(Number(uid))
        );
        if (lastSeenEntry) {
            return { kind: 'lastSeen', label: `Activo ${formatLastSeen(lastSeenEntry[1])}` };
        }
        return null;
    }, [typingUserIds, onlineUserIds, lastSeenByUserId, isOtherParticipant]);

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        if (conversation?.messages && conversation.messages.length > lastMessageCount.current) {
            // Use requestAnimationFrame for better performance
            requestAnimationFrame(() => {
                const chatContainer = document.querySelector('[data-chat-messages]') as HTMLElement;
                if (chatContainer) {
                    // Only scroll if user is near bottom (within 200px)
                    const isNearBottom = chatContainer.scrollHeight - chatContainer.scrollTop <= chatContainer.clientHeight + 200;
                    if (isNearBottom) {
                        chatContainer.scrollTop = chatContainer.scrollHeight;
                    }
                }
                if (messagesEndRef.current) {
                    const chatContainer = document.querySelector('[data-chat-messages]') as HTMLElement;
                    if (chatContainer) {
                        const isNearBottom = chatContainer.scrollHeight - chatContainer.scrollTop <= chatContainer.clientHeight + 200;
                        if (isNearBottom) {
                            messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
                        }
                    }
                }
            });
            lastMessageCount.current = conversation.messages.length;
        }
    }, [conversation?.messages?.length]);

    // Scroll to bottom when conversation loads for the first time
    useEffect(() => {
        if (conversation?.messages && messagesEndRef.current && !loading) {
            // Check if chat container is visible before scrolling
            const chatContainer = document.querySelector('[data-chat-messages]') as HTMLElement;
            if (!chatContainer) return;

            // Check if container is visible (not hidden by tab switching)
            const containerRect = chatContainer.getBoundingClientRect();
            const isContainerVisible = containerRect.width > 0 && containerRect.height > 0;

            if (!isContainerVisible) return;

            // Use a single timeout to avoid multiple scrolls
            const scrollToBottom = () => {
                // Check again if container is still visible
                const currentContainer = document.querySelector('[data-chat-messages]') as HTMLElement;
                if (!currentContainer) return;

                const currentRect = currentContainer.getBoundingClientRect();
                if (currentRect.width === 0 || currentRect.height === 0) return;

                // Check if already at bottom to avoid unnecessary scroll
                const isNearBottom = currentContainer.scrollHeight - currentContainer.scrollTop <= currentContainer.clientHeight + 100;
                if (!isNearBottom && messagesEndRef.current) {
                    currentContainer.scrollTop = currentContainer.scrollHeight;
                }
            };
            // Single timeout to avoid multiple scrolls
            const timeoutId = setTimeout(scrollToBottom, 150);
            return () => clearTimeout(timeoutId);
        }
    }, [conversation?.id, loading]);

    useEffect(() => {
        if (error) {
            showToast('error', error.includes('401') ? 'Sesión expirada. Por favor, inicia sesión de nuevo.' : error, 5000);
        }
    }, [error]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files ? Array.from(e.target.files) : [];
        const maxMessageFileSize = 10 * 1024 * 1024; // 10MB
        const validFiles = files.filter((file) => {
            const extension = file.name.split('.').pop()?.toLowerCase();
            const isValidType = ['jpg', 'jpeg', 'png', 'mp4'].includes(extension || '');
            const isValidSize = file.size <= maxMessageFileSize;
            return isValidType && isValidSize;
        });
        if (validFiles.length > 0) {
            showToast('success', `Archivos seleccionados: ${validFiles.map((f) => f.name).join(', ')}`, 3000);
        }
        if (validFiles.length < files.length) {
            showToast('error', `Solo se permiten archivos JPG, PNG, MP4 con un tamaño máximo de ${maxMessageFileSize / 1024 / 1024}MB.`, 5000);
        }
        setSelectedFiles(validFiles);
    };

    const handleOpenMapModal = () => {
        setIsMapModalOpen(true);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setSelectedMapLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    });
                },
                () => {
                    setSelectedMapLocation(defaultCenter);
                }
            );
        } else {
            setSelectedMapLocation(defaultCenter);
        }
    };

    const handleMapClick = (e: MapMouseEvent) => {
        if (e.lngLat) {
            const newLocation = {
                lat: e.lngLat.lat,
                lng: e.lngLat.lng,
            };
            setSelectedMapLocation(newLocation);
        }
    };

    const handleSelectLocation = () => {
        setLocation({
            latitude: selectedMapLocation.lat.toString(),
            longitude: selectedMapLocation.lng.toString(),
        });
        setIsMapModalOpen(false);
        showToast('success', `Ubicación seleccionada: ${selectedMapLocation.lat.toFixed(4)}, ${selectedMapLocation.lng.toFixed(4)}`, 3000);
    };

    const handleSendMessage = () => {
        if (newMessage.trim() || selectedFiles.length > 0 || location) {
            notifyTyping(false);
            sendMessage({
                content: newMessage,
                location,
                files: selectedFiles,
            });
            setNewMessage('');
            setSelectedFiles([]);
            setLocation(null);
            // Feedback visual
            setMessageSent(true);
            setTimeout(() => setMessageSent(false), 2000);
        } else {
            showToast('error', 'Escribe un mensaje, selecciona un archivo o comparte tu ubicación para enviar.', 5000);
        }
    };

    const getAvatarInitials = (senderId: string | number | null) => {
        // ✅ Manejar caso cuando senderId es null (usuario eliminado)
        if (senderId === null || senderId === undefined) {
            return '?';
        }

        const senderIdStr = String(senderId);
        const userIdStr = String(userId);
        const expertIdStr = String(expertId ?? '');

        if (senderIdStr === userIdStr) {
            return user?.name?.charAt(0)?.toUpperCase() || 'Y';
        }
        // Special case for header - 'other' means the other person in conversation
        if (senderId === 'other') {
            return isClient ? (expertData?.name?.charAt(0)?.toUpperCase() || 'E') : 'C';
        }
        // ✅ CORREGIDO: Para mensajes en el chat
        // Si el senderId es del experto, mostrar inicial del experto
        // Si el senderId es del cliente, mostrar inicial 'C'
        if (senderIdStr === expertIdStr) {
            return expertData?.name?.charAt(0)?.toUpperCase() || 'E';
        }
        return 'C';
    };

    const getAvatarColor = (senderId: string | number | null) => {
        // ✅ Manejar caso cuando senderId es null (usuario eliminado)
        if (senderId === null || senderId === undefined) {
            return 'bg-gray-500';
        }

        if (String(senderId) === String(user?.id)) {
            return 'bg-gray-600';
        }
        if (senderId === 'other') {
            return isClient ? 'bg-green-500' : 'bg-blue-500';
        }
        return String(senderId) === String(expertId) ? 'bg-green-500' : 'bg-blue-500';
    };

    const getAvatarImage = (senderId: string | number | null) => {
        // ✅ Manejar caso cuando senderId es null (usuario eliminado)
        if (senderId === null || senderId === undefined) {
            return undefined;
        }

        const senderIdStr = String(senderId);
        const userIdStr = String(userId);
        const expertIdStr = String(expertId ?? '');

        if (senderIdStr === userIdStr) {
            return user?.profilePictureUrl;
        }
        // Special case for header - 'other' means the other person in conversation
        if (senderId === 'other') {
            return isClient ? expertData?.profilePictureUrl : undefined;
        }
        // ✅ CORREGIDO: Para mensajes en el chat
        // Si el senderId es del experto, mostrar su imagen
        // Si el senderId es del cliente, no mostrar imagen (solo inicial)
        if (senderIdStr === expertIdStr) {
            return expertData?.profilePictureUrl;
        }
        return undefined;
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const getFileName = (url: string) => {
        return url.split('/').pop() || 'archivo';
    };

    if (!user) {
        return (
            <div className="flex items-center justify-center h-full text-[#737373]">
                Inicia sesión para ver el chat.
            </div>
        );
    }

    if (isChatLoading) {
        return (
            <div className="flex items-center justify-center h-full text-[#737373]">
                Cargando chat...
            </div>
        );
    }

    if (error && !conversation) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-[#737373] gap-2 px-4 text-center">
                <p>No se pudo cargar el chat.</p>
                <p className="text-xs text-[#a0a0a0]">{error}</p>
            </div>
        );
    }

    if (!conversation || !hasAccess) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-[#737373] gap-1 px-4 text-center">
                <p>No tienes acceso a este chat.</p>
                {!hasAccess && conversation && (
                    <p className="text-xs text-[#a0a0a0]">
                        Tu cuenta (ID {userId}) no coincide con cliente ni experto de esta contratación.
                    </p>
                )}
            </div>
        );
    }

    // Group messages by sender and proximity in time
    const groupedMessages = conversation.messages?.reduce((groups: any[], message: any, index: number) => {
        const previousMessage = conversation.messages?.[index - 1];
        const timeDiff = previousMessage
            ? new Date(message.sentAt).getTime() - new Date(previousMessage.sentAt).getTime()
            : 0;

        // ✅ Group if same sender and within 5 minutes
        // Manejar casos cuando senderId es null (usuario eliminado)
        const prevSid = normalizeSenderId(previousMessage?.senderId);
        const currSid = normalizeSenderId(message.senderId);
        const sameSender =
            previousMessage &&
            ((prevSid === null && currSid === null) ||
                (prevSid !== null && currSid !== null && prevSid === currSid));

        if (sameSender && timeDiff < 5 * 60 * 1000) {
            groups[groups.length - 1].messages.push(message);
        } else {
            groups.push({
                senderId: message.senderId,
                messages: [message],
                timestamp: message.sentAt,
                isOwn: isMessageFromUser(message.senderId, userId)
            });
        }
        return groups;
    }, []) || [];

    const otherAvatarSrc = otherParticipantId > 0 ? getAvatarImage(otherParticipantId) : null;

    return (
        <div className="flex min-h-0 flex-1 flex-col h-full bg-[#e8ecf1]">
            {/* Cabecera — oculta cuando el chat va incrustado (el contenedor padre
                ya aporta la suya); solo se conserva un aviso fino de reconexión. */}
            {embedded ? (
                isReconnecting && (
                    <p
                        role="status"
                        aria-live="polite"
                        className="shrink-0 border-b border-[#ebebeb] bg-white px-4 py-2 text-center text-[11px] leading-snug text-amber-800"
                    >
                        Reconectando…
                    </p>
                )
            ) : (
            <div className="shrink-0 border-b border-[#e8e8e8] bg-white px-4 py-3">
                <div className="flex items-center gap-3">
                    {onBack && (
                        <button
                            type="button"
                            onClick={onBack}
                            aria-label="Volver y salir del chat"
                            className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#e8e8e8] bg-white/80 shadow-sm transition-colors hover:bg-white active:scale-[0.98]"
                        >
                            <ArrowLeft className="h-5 w-5 text-[#1c1c1c]" />
                        </button>
                    )}
                    <Avatar className="h-11 w-11 ring-2 ring-white shadow-sm">
                        <AvatarImage src={otherAvatarSrc || undefined} alt={otherParticipantName} />
                        <AvatarFallback className="bg-brand text-sm font-semibold text-white">
                            {otherParticipantName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-semibold text-[#1c1c1c]">
                            {otherParticipantName}
                        </p>
                        {peerPresenceStatus?.kind === 'typing' && (
                            <p className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-primary">
                                <TypingDots className="text-primary" />
                                <span>está escribiendo</span>
                            </p>
                        )}
                        {peerPresenceStatus?.kind === 'online' && (
                            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-emerald-600">
                                <span
                                    className="h-2 w-2 shrink-0 rounded-full bg-emerald-500 ring-2 ring-emerald-500/25 animate-pulse"
                                    aria-hidden
                                />
                                <span>En línea</span>
                            </p>
                        )}
                        {peerPresenceStatus?.kind === 'lastSeen' && (
                            <p className="mt-0.5 text-xs text-[#737373]">{peerPresenceStatus.label}</p>
                        )}
                        {!peerPresenceStatus && !isReconnecting && (
                            <p className="mt-0.5 text-xs text-[#a0a0a0]">Mensajes privados</p>
                        )}
                    </div>
                    {isReconnecting && (
                        <span
                            className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-medium text-amber-800"
                            role="status"
                            aria-live="polite"
                        >
                            Reconectando…
                        </span>
                    )}
                </div>
                {userIsAdmin && (
                    <p className="mt-2.5 rounded-lg border border-amber-100 bg-amber-50/90 px-2.5 py-1.5 text-[11px] text-amber-900">
                        Vista de administrador: puedes leer el chat; los mensajes no se marcarán como leídos.
                    </p>
                )}
            </div>
            )}

            {/* Mensajes */}
            <div
                data-chat-messages
                className="chat-messages-area flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-4 sm:px-5"
                style={{
                    WebkitOverflowScrolling: 'touch',
                    backgroundImage:
                        'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.04) 1px, transparent 0)',
                    backgroundSize: '20px 20px',
                    backgroundColor: '#e8ecf1',
                }}
                role="log"
                aria-live="polite"
            >
                {groupedMessages && groupedMessages.length > 0 ? (
                    groupedMessages.flatMap((group) =>
                        group.messages.map((message: any, msgIndex: number) => {
                            const isFirstInGroup = msgIndex === 0;
                            const isLastInGroup = msgIndex === group.messages.length - 1;
                                    const isStatusMessage = message.content && isAppointmentStatusChangeMessage(message.content);

                                    // Mensajes de estado → pill centrado minimalista
                                    if (isStatusMessage) {
                                        const statusValue = extractStatusValue(message.content);
                                        const display = statusValue ? getStatusDisplay(statusValue) : null;
                                        if (!display || !statusValue) return null;
                                        const pillTone = CHAT_STATUS_PILL_CLASSES[getStatusTone({ statusValue })];
                                        return (
                                            <div key={message.id} className="flex justify-center my-3">
                                                <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${pillTone}`}>
                                                    {display.icon}
                                                    {display.message}
                                                </span>
                                            </div>
                                        );
                                    }

                                    // Mensaje normal con avatar - Estilo igual a PreHireChat
                                    const isOwnMessage =
                                        isMessageFromUser(message.senderId, userId) || group.isOwn;

                                    return (
                                        <div
                                            key={message.id}
                                            className={`chat-message-enter mb-0.5 flex gap-2 sm:gap-2.5 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} max-w-[88%] sm:max-w-[80%] ${isOwnMessage ? 'ml-auto' : 'mr-auto'} ${isFirstInGroup ? 'mt-3' : ''}`}
                                        >
                                            {!isOwnMessage && (
                                                <div className="w-8 shrink-0">
                                                    {isFirstInGroup ? (
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarImage
                                                                src={getAvatarImage(group.senderId) || undefined}
                                                                alt={message.senderName || 'Usuario'}
                                                            />
                                                            <AvatarFallback className="bg-gray-800 text-white text-xs">
                                                                {getAvatarInitials(group.senderId)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                    ) : (
                                                        <span className="block h-8 w-8" aria-hidden />
                                                    )}
                                                </div>
                                            )}

                                            <div
                                                className={`flex min-w-0 flex-col gap-0.5 ${isOwnMessage ? 'items-end' : 'items-start'}`}
                                            >
                                                {!isOwnMessage && isFirstInGroup && (
                                                    <span className="mb-0.5 px-1 text-[11px] font-medium text-[#737373]">
                                                        {message.senderName || 'Usuario'}
                                                    </span>
                                                )}
                                                {message.content && (
                                                    <div
                                                        className={`px-3.5 py-2.5 text-sm transition-shadow ${
                                                            isOwnMessage
                                                                ? 'rounded-[1.15rem] rounded-br-sm bg-brand text-white shadow-[0_2px_8px_hsl(var(--brand)/0.18)]'
                                                                : 'rounded-[1.15rem] rounded-bl-sm border border-[#e8e8e8] bg-white text-[#1c1c1c] shadow-[0_1px_2px_rgba(15,23,42,0.04)]'
                                                        }`}
                                                    >
                                                        <p className="whitespace-pre-wrap break-words leading-relaxed">
                                                            {message.content}
                                                        </p>
                                                    </div>
                                                )}
                                                {isLastInGroup && (
                                                    <span className="px-1 text-[10px] tabular-nums text-[#a0a0a0]">
                                                        {new Date(message.sentAt).toLocaleTimeString('es-ES', {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        })}
                                                    </span>
                                                )}

                                                {/* Adjuntos */}
                                        {message.attachmentUrls && message.attachmentUrls.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {message.attachmentUrls.map((url: string, idx: number) => (
                                                            <img
                                                                key={idx}
                                                                            src={url}
                                                                alt={`Adjunto ${idx + 1}`}
                                                                className="max-w-[200px] max-h-[200px] rounded-lg object-cover"
                                                            />
                                                        ))}
                                                                                </div>
                                        )}
                                        </div>
                                    </div>
                                    );
                                })
                        )
                    ) : (
                        <div className="flex min-h-[min(280px,50vh)] flex-1 flex-col items-center justify-center px-6 py-8">
                            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-md">
                                <MessageSquare className="h-7 w-7 text-[#a0a0a0]" strokeWidth={1.5} />
                            </div>
                            <p className="text-center text-sm font-medium text-[#1c1c1c]">
                                Aún no hay mensajes
                            </p>
                            <p className="mt-1 max-w-[240px] text-center text-xs leading-relaxed text-[#737373]">
                                Escribe abajo para coordinar el servicio con {otherParticipantName}.
                            </p>
                        </div>
                    )}
                <div ref={messagesEndRef} />
            </div>

            {/* Indicador de escritura sobre el input (patrón WhatsApp / iMessage) */}
            {peerPresenceStatus?.kind === 'typing' && (
                <div
                    className="flex shrink-0 items-center gap-2 border-t border-gray-100 bg-white/95 px-4 py-2 backdrop-blur-sm"
                    role="status"
                    aria-live="polite"
                >
                    <TypingDots className="text-[#737373]" />
                    <span className="text-xs text-[#6a6a6a]">
                        <span className="font-medium text-[#1c1c1c]">{otherParticipantName}</span>
                        {' '}
                        está escribiendo
                    </span>
                </div>
            )}

            {/* Input — composer unificado (adjuntos · ubicación · enviar) */}
            <div className="relative z-10 shrink-0 border-t border-[#f0f0f0] bg-white px-3 pt-2.5 shadow-[0_-1px_12px_rgba(15,23,42,0.04)] sm:px-4 sm:pt-3 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] lg:pb-3">
                {/* Previsualización de adjuntos / ubicación seleccionados */}
                {(selectedFiles.length > 0 || location) && (
                    <div className="mb-2 flex flex-wrap items-center gap-1.5">
                        {selectedFiles.map((file, idx) => (
                            <span
                                key={`${file.name}-${idx}`}
                                className="inline-flex max-w-[200px] items-center gap-1.5 rounded-full bg-brand/[0.08] py-1 pl-2.5 pr-1 text-[12px] font-medium text-brand"
                            >
                                <Paperclip className="h-3 w-3 shrink-0" strokeWidth={2.25} aria-hidden />
                                <span className="truncate">{file.name}</span>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setSelectedFiles((prev) => prev.filter((_, i) => i !== idx))
                                    }
                                    aria-label={`Quitar ${file.name}`}
                                    className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-brand/70 transition-colors hover:bg-brand/15 hover:text-brand"
                                >
                                    <X className="h-3 w-3" strokeWidth={2.5} />
                                </button>
                            </span>
                        ))}
                        {location && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 py-1 pl-2.5 pr-1 text-[12px] font-medium text-emerald-700">
                                <MapPin className="h-3 w-3 shrink-0" strokeWidth={2.25} aria-hidden />
                                <span>Ubicación adjunta</span>
                                <button
                                    type="button"
                                    onClick={() => setLocation(null)}
                                    aria-label="Quitar ubicación"
                                    className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-emerald-600/70 transition-colors hover:bg-emerald-100 hover:text-emerald-700"
                                >
                                    <X className="h-3 w-3" strokeWidth={2.5} />
                                </button>
                            </span>
                        )}
                    </div>
                )}

                <div
                    className={[
                        'flex items-center gap-0.5 rounded-[1.6rem] border bg-[#f6f7f9] py-1 pl-1 pr-1 transition-all duration-200',
                        isSending
                            ? 'border-[#e6e8eb] opacity-70'
                            : 'border-[#e6e8eb] focus-within:border-brand/40 focus-within:bg-white focus-within:shadow-[0_2px_12px_hsl(var(--brand)/0.10)] focus-within:ring-2 focus-within:ring-brand/12',
                    ].join(' ')}
                >
                    {/* Adjuntar foto o vídeo */}
                    <label
                        title="Adjuntar foto o vídeo"
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#737373] transition-colors hover:bg-black/[0.05] hover:text-[#1c1c1c] ${
                            isSending ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                        }`}
                    >
                        <Paperclip className="h-[19px] w-[19px]" strokeWidth={1.9} aria-hidden />
                        <input
                            type="file"
                            accept=".jpg,.jpeg,.png,.mp4"
                            multiple
                            onChange={handleFileChange}
                            disabled={isSending}
                            className="hidden"
                        />
                        <span className="sr-only">Adjuntar archivo</span>
                    </label>

                    {/* Compartir ubicación */}
                    <button
                        type="button"
                        onClick={handleOpenMapModal}
                        disabled={isSending}
                        aria-label="Compartir ubicación"
                        title="Compartir ubicación"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#737373] transition-colors hover:bg-black/[0.05] hover:text-[#1c1c1c] disabled:opacity-50"
                    >
                        <MapPin className="h-[19px] w-[19px]" strokeWidth={1.9} aria-hidden />
                    </button>

                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => {
                            const value = e.target.value;
                            setNewMessage(value);
                            if (typingDebounceRef.current) {
                                clearTimeout(typingDebounceRef.current);
                            }
                            typingDebounceRef.current = setTimeout(() => {
                                notifyTyping(value.trim().length > 0);
                            }, 400);
                        }}
                        onBlur={() => notifyTyping(false)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                if (newMessage.trim() || selectedFiles.length > 0 || location) {
                                    handleSendMessage();
                                }
                            }
                        }}
                        placeholder={isSending ? 'Enviando…' : 'Escribe un mensaje…'}
                        disabled={isSending}
                        className="min-w-0 flex-1 bg-transparent px-1.5 py-2 text-[15px] leading-relaxed text-[#1c1c1c] placeholder:text-[#9aa0a6] focus:outline-none disabled:cursor-not-allowed"
                    />

                    {/* Enviar */}
                    <button
                        type="button"
                        onClick={handleSendMessage}
                        disabled={
                            (!newMessage.trim() && selectedFiles.length === 0 && !location) || isSending
                        }
                        aria-label="Enviar mensaje"
                        className={[
                            'flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-200',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1',
                            (newMessage.trim() || selectedFiles.length > 0 || location) && !isSending
                                ? 'bg-brand text-white shadow-[0_2px_8px_hsl(var(--brand)/0.35)] hover:bg-brand-hover hover:scale-[1.06] active:scale-95'
                                : 'cursor-not-allowed bg-[#e3e5e8] text-[#a8adb3]',
                        ].join(' ')}
                    >
                        {isSending ? (
                            <Loader2 className="h-[18px] w-[18px] animate-spin" />
                        ) : (
                            <Send className="ml-px h-[17px] w-[17px]" strokeWidth={2.25} aria-hidden />
                        )}
                    </button>
                </div>

                {/* Botón de detalles — solo en móvil, debajo del input */}
                {onOpenDetails && (
                    <div className="flex justify-center pt-1.5 pb-0 lg:hidden">
                        <button
                            type="button"
                            onClick={onOpenDetails}
                            aria-label={isDetailsOpen ? 'Ocultar detalles' : 'Ver detalles del servicio'}
                            aria-expanded={!!isDetailsOpen}
                            className="group flex flex-col items-center gap-0.5 rounded-full px-1 py-1 outline-none transition-all duration-200 active:scale-[0.99]"
                        >
                            <div
                                className={[
                                    'flex items-center gap-1.5',
                                    'text-[#a0a0a0] transition-colors duration-200',
                                    isDetailsOpen ? 'text-primary' : 'group-hover:text-primary',
                                ].join(' ')}
                            >
                                <div
                                    className={[
                                        'h-px bg-gray-300 transition-all duration-200 group-hover:bg-primary/50',
                                        isDetailsOpen ? 'w-10' : 'w-8',
                                    ].join(' ')}
                                />
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth={1.5}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className={[
                                        'h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5',
                                        isDetailsOpen ? 'rotate-180' : '',
                                    ].join(' ')}
                                >
                                    <polyline points="18 15 12 9 6 15" />
                                </svg>
                                <div
                                    className={[
                                        'h-px bg-gray-300 transition-all duration-200 group-hover:bg-primary/50',
                                        isDetailsOpen ? 'w-10' : 'w-8',
                                    ].join(' ')}
                                />
                            </div>
                            <span
                                className={[
                                    'text-[10px] tracking-wide transition-colors duration-200',
                                    isDetailsOpen ? 'text-primary' : 'text-[#a0a0a0] group-hover:text-primary',
                                ].join(' ')}
                            >
                                {isDetailsOpen ? 'Ocultar' : 'Detalles'}
                            </span>
                        </button>
                    </div>
                )}
            </div>

            {/* Map Modal */}
            {isMapModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                        <div className="p-6 border-b border-[#e8e8e8]">
                            <h3 className="text-lg font-semibold text-[#1c1c1c]">Seleccionar Ubicación</h3>
                        </div>

                        {mapboxToken ? (
                            <div className="relative h-[400px]">
                                <Map
                                    mapboxAccessToken={mapboxToken}
                                    initialViewState={{
                                        longitude: selectedMapLocation.lng,
                                        latitude: selectedMapLocation.lat,
                                        zoom: 14,
                                    }}
                                    style={{ width: '100%', height: '100%' }}
                                    mapStyle="mapbox://styles/mapbox/streets-v12"
                                    onClick={handleMapClick}
                                >
                                    <NavigationControl position="top-right" />
                                    {selectedMapLocation && (
                                        <Marker
                                            longitude={selectedMapLocation.lng}
                                            latitude={selectedMapLocation.lat}
                                            anchor="center"
                                        >
                                            <div
                                                style={{
                                                    width: '18px',
                                                    height: '18px',
                                                    backgroundColor: '#3b82f6',
                                                    border: '2px solid #ffffff',
                                                    borderRadius: '50%',
                                                    boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                                                }}
                                            />
                                        </Marker>
                                    )}
                                </Map>
                                <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg">
                                    <span className="text-sm text-[#1c1c1c] font-medium">
                                        Haz clic para seleccionar una ubicación
                                    </span>
                                </div>
                                {selectedMapLocation && (
                                    <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg">
                                        <span className="text-sm text-[#1c1c1c] font-mono">
                                            {selectedMapLocation.lat.toFixed(4)}, {selectedMapLocation.lng.toFixed(4)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="h-[400px] flex items-center justify-center bg-gray-50">
                                <span className="text-red-500">Error al cargar el mapa: falta VITE_MAPBOX_PUBLIC_TOKEN</span>
                            </div>
                        )}

                        <div className="p-6 border-t border-[#e8e8e8] flex justify-end gap-3">
                            <button
                                onClick={() => setIsMapModalOpen(false)}
                                className="px-6 py-2 bg-[#f5f5f5] text-[#1c1c1c] rounded-xl hover:bg-gray-200 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSelectLocation}
                                className="px-6 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors"
                            >
                                Seleccionar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Image Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setSelectedImage(null)}
                >
                    <div className="relative max-w-4xl max-h-full">
                        <img
                            src={selectedImage}
                            alt="Imagen ampliada"
                            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                        />
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute top-4 right-4 bg-white border border-[#e8e8e8] hover:bg-[#fafafa] text-[#1c1c1c] rounded-full p-2 shadow-lg transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg">
                            <span className="text-sm text-[#1c1c1c] font-medium">
                                {getFileName(selectedImage)}
                            </span>
                        </div>
                        <a
                            href={selectedImage}
                            download
                            className="absolute bottom-4 right-4 bg-white border border-[#e8e8e8] hover:bg-[#fafafa] text-[#1c1c1c] rounded-lg px-4 py-2 shadow-lg transition-colors flex items-center gap-2 text-sm font-medium"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Download className="w-4 h-4" />
                            Descargar
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Chat;
