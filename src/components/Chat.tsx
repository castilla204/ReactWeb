import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useChat } from '../hooks/useChat';
import { useAuth } from '../contexts/AuthContext';
import { isAdmin } from '../utils/admin';
import { getUserId, isMessageFromUser, normalizeSenderId } from '../utils/userId';
import { Send, Paperclip, MapPin, Download, X, Loader2, HelpCircle, Calendar, FileText, MessageSquare, CheckCircle2, CheckCircle, XCircle, AlertCircle, Clock, FileCheck, Info, Share2, ArrowLeft } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
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
    description?: string;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
    borderColor: string;
}

const statusDisplayMap: Record<string, StatusDisplay> = {
    "appointment_proposed": {
        message: "Cita propuesta",
        description: "El cliente ha propuesto una fecha y hora para la cita. El experto puede aceptarla o rechazarla.",
        icon: <Calendar className="w-4 h-4" />,
        color: "text-blue-700 dark:text-blue-300",
        bgColor: "bg-blue-50 dark:bg-blue-950/30",
        borderColor: "border-blue-200 dark:border-blue-800"
    },
    "appointment_confirmed": {
        message: "✅ Cita aceptada",
        description: "La cita ha sido confirmada por ambas partes. El servicio puede proceder según lo acordado.",
        icon: <CheckCircle className="w-4 h-4" />,
        color: "text-green-700 dark:text-green-300",
        bgColor: "bg-green-50 dark:bg-green-950/30",
        borderColor: "border-green-200 dark:border-green-800"
    },
    "appointment_rejected": {
        message: "❌ Cita rechazada",
        description: "El experto ha rechazado la propuesta de cita. El cliente puede proponer una nueva fecha y hora.",
        icon: <XCircle className="w-4 h-4" />,
        color: "text-red-700 dark:text-red-300",
        bgColor: "bg-red-50 dark:bg-red-950/30",
        borderColor: "border-red-200 dark:border-red-800"
    },
    "appointment_cancelled_by_client": {
        message: "Cita cancelada por el cliente",
        description: "El cliente ha cancelado la cita. Puede proponer una nueva fecha si lo desea.",
        icon: <AlertCircle className="w-4 h-4" />,
        color: "text-orange-700 dark:text-orange-300",
        bgColor: "bg-orange-50 dark:bg-orange-950/30",
        borderColor: "border-orange-200 dark:border-orange-800"
    },
    "appointment_cancelled_by_expert": {
        message: "Cita cancelada por el experto",
        description: "El experto ha cancelado la cita. El cliente puede proponer una nueva fecha.",
        icon: <AlertCircle className="w-4 h-4" />,
        color: "text-orange-700 dark:text-orange-300",
        bgColor: "bg-orange-50 dark:bg-orange-950/30",
        borderColor: "border-orange-200 dark:border-orange-800"
    },
    "appointment_cancelled_by_client_second": {
        message: "Cita cancelada por el cliente (segunda cancelación)",
        description: "Segunda cancelación del cliente. Se aplicarán políticas de reembolso según los términos del servicio.",
        icon: <AlertCircle className="w-4 h-4" />,
        color: "text-orange-700 dark:text-orange-300",
        bgColor: "bg-orange-50 dark:bg-orange-950/30",
        borderColor: "border-orange-200 dark:border-orange-800"
    },
    "appointment_cancelled_by_expert_second": {
        message: "Cita cancelada por el experto (segunda cancelación)",
        description: "Segunda cancelación del experto. El cliente puede proponer una nueva fecha.",
        icon: <AlertCircle className="w-4 h-4" />,
        color: "text-orange-700 dark:text-orange-300",
        bgColor: "bg-orange-50 dark:bg-orange-950/30",
        borderColor: "border-orange-200 dark:border-orange-800"
    },
    "appointment_cancelled_by_no_response": {
        message: "Cita cancelada - sin respuesta",
        description: "La cita fue cancelada automáticamente porque no se recibió respuesta en el tiempo establecido.",
        icon: <Clock className="w-4 h-4" />,
        color: "text-[#1c1c1c] dark:text-gray-300",
        bgColor: "bg-gray-50 dark:bg-gray-950/30",
        borderColor: "border-[#e8e8e8] dark:border-gray-800"
    },
    "appointment_cancelled_by_no_report": {
        message: "Cita cancelada - sin reporte",
        description: "La cita fue cancelada automáticamente porque el experto no envió el reporte en el tiempo establecido.",
        icon: <FileText className="w-4 h-4" />,
        color: "text-[#1c1c1c] dark:text-gray-300",
        bgColor: "bg-gray-50 dark:bg-gray-950/30",
        borderColor: "border-[#e8e8e8] dark:border-gray-800"
    },
    "appointment_report_sent": {
        message: "📄 Reporte enviado",
        description: "El experto ha enviado el reporte de la cita. El cliente puede revisarlo y aprobar el servicio.",
        icon: <FileCheck className="w-4 h-4" />,
        color: "text-green-700 dark:text-green-300",
        bgColor: "bg-green-50 dark:bg-green-950/30",
        borderColor: "border-green-200 dark:border-green-800"
    },
    "appointment_awaiting_report": {
        message: "Esperando reporte del experto",
        description: "La cita ha finalizado. El experto debe enviar el reporte con los detalles del servicio realizado.",
        icon: <Clock className="w-4 h-4" />,
        color: "text-yellow-700 dark:text-yellow-300",
        bgColor: "bg-yellow-50 dark:bg-yellow-950/30",
        borderColor: "border-yellow-200 dark:border-yellow-800"
    },
    "appointment_cancelled_by_expert_rejection": {
        message: "Cita cancelada por rechazo del experto",
        description: "El experto rechazó la cita. El cliente puede proponer una nueva fecha y hora.",
        icon: <XCircle className="w-4 h-4" />,
        color: "text-red-700 dark:text-red-300",
        bgColor: "bg-red-50 dark:bg-red-950/30",
        borderColor: "border-red-200 dark:border-red-800"
    }
};

const getStatusDisplay = (statusValue: string): StatusDisplay => {
    return statusDisplayMap[statusValue] ?? {
        message: `Estado: ${statusValue}`,
        icon: <HelpCircle className="w-4 h-4" />,
        color: "text-[#1c1c1c] dark:text-gray-300",
        bgColor: "bg-gray-50 dark:bg-gray-950/30",
        borderColor: "border-[#e8e8e8] dark:border-gray-800"
    };
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
            {/* Cabecera */}
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
                                        if (!display) return null;
                                        return (
                                            <div key={message.id} className="flex justify-center my-3">
                                                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${display.bgColor} ${display.color} border ${display.borderColor}`}>
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

            {/* Input */}
            <div className="relative z-10 shrink-0 border-t border-[#e8e8e8] bg-white pt-3 shadow-[0_-2px_12px_rgba(15,23,42,0.04)] sm:pt-4 pb-[max(0.25rem,env(safe-area-inset-bottom,0px))] lg:pb-0">
                <div className="flex items-end gap-2 px-3 sm:px-4">
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
                        placeholder={isSending ? 'Enviando…' : 'Mensaje…'}
                        disabled={isSending}
                        className="flex-1 rounded-2xl border border-[#e8e8e8]/90 bg-gray-50/90 px-4 py-3 text-sm shadow-inner transition-all placeholder:text-[#a0a0a0] focus:border-primary/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                    <Button
                        onClick={handleSendMessage}
                        disabled={
                            (!newMessage.trim() && selectedFiles.length === 0 && !location) || isSending
                        }
                        className="h-11 w-11 shrink-0 rounded-full p-0 shadow-md shadow-primary/25 transition-transform hover:scale-[1.03] active:scale-95"
                        size="icon"
                        aria-label="Enviar mensaje"
                    >
                        {isSending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                    </Button>
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
