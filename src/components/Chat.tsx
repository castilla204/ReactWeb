import { useEffect, useRef, useState } from 'react';
import { useChat } from '../hooks/useChat';
import { useAuth } from '../contexts/AuthContext';
import { isAdmin } from '../utils/admin';
import { Send, Paperclip, MapPin, Download, X, Loader2, HelpCircle, Calendar, FileText, MessageSquare, CheckCircle2, CheckCircle, XCircle, AlertCircle, Clock, FileCheck, Info, Share2 } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { showToast } from '../lib/toast';
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';

interface ChatProps {
    searchId: number | null;
    isExpert: boolean;
    expertData?: {
        name?: string;
        profilePictureUrl?: string;
    };
    searchHireId?: number;
}

const libraries: ("drawing" | "geometry")[] = ['drawing', 'geometry'];

const mapStyles = [
    {
        featureType: "all",
        elementType: "labels.text.fill",
        stylers: [{ color: "#666666" }],
    },
    {
        featureType: "water",
        elementType: "geometry",
        stylers: [{ color: "#e8f4f8" }],
    },
    {
        featureType: "landscape",
        elementType: "geometry",
        stylers: [{ color: "#ffffff" }],
    },
    {
        featureType: "road",
        elementType: "geometry",
        stylers: [{ color: "#e6e6e6" }],
    },
    {
        featureType: "poi",
        elementType: "geometry",
        stylers: [{ color: "#f0f5f7" }],
    },
    {
        featureType: "transit",
        elementType: "geometry",
        stylers: [{ color: "#f0f5f7" }],
    },
];

const markerIcon = {
    path: "M -4,0 A 4,4 0 1,0 4,0 A 4,4 0 1,0 -4,0",
    fillColor: '#3b82f6',
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: 1.5,
    scale: 1.5,
    zIndex: 3,
};

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
        color: "text-gray-700 dark:text-gray-300",
        bgColor: "bg-gray-50 dark:bg-gray-950/30",
        borderColor: "border-gray-200 dark:border-gray-800"
    },
    "appointment_cancelled_by_no_report": {
        message: "Cita cancelada - sin reporte",
        description: "La cita fue cancelada automáticamente porque el experto no envió el reporte en el tiempo establecido.",
        icon: <FileText className="w-4 h-4" />,
        color: "text-gray-700 dark:text-gray-300",
        bgColor: "bg-gray-50 dark:bg-gray-950/30",
        borderColor: "border-gray-200 dark:border-gray-800"
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
        color: "text-gray-700 dark:text-gray-300",
        bgColor: "bg-gray-50 dark:bg-gray-950/30",
        borderColor: "border-gray-200 dark:border-gray-800"
    };
};

const Chat: React.FC<ChatProps> = ({ searchId, isExpert, expertData, searchHireId }) => {
    const { user } = useAuth();
    const { conversation, loading, error, newMessage, setNewMessage, sendMessage, isSending } = useChat(
        searchId,
        searchHireId
    );
    
    // State for image modal
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const lastMessageCount = useRef(conversation?.messages?.length || 0);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [location, setLocation] = useState<{ latitude: string; longitude: string } | null>(null);
    const [isMapModalOpen, setIsMapModalOpen] = useState(false);
    const [selectedMapLocation, setSelectedMapLocation] = useState(defaultCenter);
    const [messageSent, setMessageSent] = useState(false);
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: "__REDACTED_GOOGLE_API_KEY__",
        libraries,
    });

    console.log('[09:15 CEST] Chat component render:', { searchId, isExpert, userId: user?.id, conversationId: conversation?.id });

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        if (conversation?.messages && conversation.messages.length > lastMessageCount.current) {
            // Use requestAnimationFrame for better performance
            requestAnimationFrame(() => {
                const chatContainer = document.querySelector('[data-chat-messages]')?.parentElement as HTMLElement;
                if (chatContainer) {
                    // Only scroll if user is near bottom (within 200px)
                    const isNearBottom = chatContainer.scrollHeight - chatContainer.scrollTop <= chatContainer.clientHeight + 200;
                    if (isNearBottom) {
                        chatContainer.scrollTop = chatContainer.scrollHeight;
                    }
                }
                if (messagesEndRef.current) {
                    const chatContainer = document.querySelector('[data-chat-messages]')?.parentElement as HTMLElement;
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
            const chatContainer = document.querySelector('[data-chat-messages]')?.parentElement as HTMLElement;
            if (!chatContainer) return;
            
            // Check if container is visible (not hidden by tab switching)
            const containerRect = chatContainer.getBoundingClientRect();
            const isContainerVisible = containerRect.width > 0 && containerRect.height > 0;
            
            if (!isContainerVisible) return;
            
            // Use a single timeout to avoid multiple scrolls
            const scrollToBottom = () => {
                // Check again if container is still visible
                const currentContainer = document.querySelector('[data-chat-messages]')?.parentElement as HTMLElement;
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
        console.log('[09:15 CEST] Selected message files:', validFiles.map((f) => ({ name: f.name, size: f.size })));
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

    const handleMapClick = (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
            const newLocation = {
                lat: e.latLng.lat(),
                lng: e.latLng.lng(),
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
            console.log('[09:15 CEST] Sending message with files and location:', {
                files: selectedFiles.map((f) => ({ name: f.name, size: f.size })),
                location,
            });
            const formDataEntries: { [key: string]: any } = {
                ConversationId: conversation?.id,
                Content: newMessage.trim() || undefined,
                LocationLatitude: location?.latitude,
                LocationLongitude: location?.longitude,
                Attachments: selectedFiles.map((f) => ({ name: f.name, type: f.type, size: f.size })),
            };
            console.log('[09:15 CEST] FormData before sending:', formDataEntries);
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
            console.log('[Chat] getAvatarInitials: senderId is null/undefined, returning ?');
            return '?';
        }
        
        const senderIdStr = String(senderId);
        const userIdStr = String(user?.id ?? '');
        const expertIdStr = String(expertId ?? '');
        
        console.log('[Chat] getAvatarInitials:', {
            senderId,
            senderIdStr,
            userId: user?.id,
            userIdStr,
            expertId,
            expertIdStr,
            isOwn: senderIdStr === userIdStr,
            isExpert: senderIdStr === expertIdStr
        });
        
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
            console.log('[Chat] getAvatarImage: senderId is null/undefined, returning undefined');
            return undefined;
        }
        
        const senderIdStr = String(senderId);
        const userIdStr = String(user?.id ?? '');
        const expertIdStr = String(expertId ?? '');
        
        console.log('[Chat] getAvatarImage:', {
            senderId,
            senderIdStr,
            userId: user?.id,
            userIdStr,
            expertId,
            expertIdStr,
            isOwn: senderIdStr === userIdStr,
            isExpert: senderIdStr === expertIdStr,
            userProfilePicture: user?.profilePictureUrl,
            expertProfilePicture: expertData?.profilePictureUrl
        });
        
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

    // Convert IDs to numbers for comparison to handle string/number type mismatches
    const userId = Number(user?.id);
    // ✅ Manejar casos cuando clientId o expertId son null (usuarios eliminados)
    const clientId = conversation?.clientId ? Number(conversation.clientId) : null;
    const expertId = conversation?.expertId ? Number(conversation.expertId) : null;
    
    // Check if user is admin
    const userIsAdmin = isAdmin(user?.email);
    
    // ✅ Manejar casos cuando clientId o expertId son null (usuarios eliminados)
    // User has access if they are the client, expert, or admin
    const hasAccess = (clientId !== null && userId === clientId) || 
                      (expertId !== null && userId === expertId) || 
                      userIsAdmin;
    
    // Debug: Log access control information
    console.log('[Chat] Access control debug:', {
        user: user ? { id: user.id, email: user.email, role: user.role } : null,
        loading,
        conversation: conversation ? {
            id: conversation.id,
            clientId: conversation.clientId,
            expertId: conversation.expertId,
            searchHireId: conversation.searchHireId
        } : null,
        userId,
        clientId,
        expertId,
        isAdmin: userIsAdmin,
        hasAccess,
        userIdType: typeof user?.id,
        clientIdType: typeof conversation?.clientId,
        expertIdType: typeof conversation?.expertId,
        userEmail: user?.email
    });

    if (!user || loading || !conversation || !hasAccess) {
        return (
            <div className="flex items-center justify-center h-full text-gray-500">
                {loading ? 'Cargando chat...' : 'No tienes acceso a este chat.'}
            </div>
        );
    }

    const isClient = userId === clientId;

    // Group messages by sender and proximity in time
    const groupedMessages = conversation.messages?.reduce((groups: any[], message: any, index: number) => {
        const previousMessage = conversation.messages?.[index - 1];
        const timeDiff = previousMessage
            ? new Date(message.sentAt).getTime() - new Date(previousMessage.sentAt).getTime()
            : 0;

        // ✅ Group if same sender and within 5 minutes
        // Manejar casos cuando senderId es null (usuario eliminado)
        const sameSender = previousMessage && 
            ((previousMessage.senderId === null && message.senderId === null) ||
             (previousMessage.senderId !== null && message.senderId !== null && 
              previousMessage.senderId === message.senderId));
        
        if (sameSender && timeDiff < 5 * 60 * 1000) {
            groups[groups.length - 1].messages.push(message);
        } else {
            groups.push({
                senderId: message.senderId,
                messages: [message],
                timestamp: message.sentAt,
                isOwn: message.senderId !== null && message.senderId === user?.id
            });
        }
        return groups;
    }, []) || [];

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Lista de mensajes */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
                {groupedMessages && groupedMessages.length > 0 ? (
                    groupedMessages.flatMap((group) =>
                        group.messages.map((message: any, msgIndex: number) => {
                                    const isStatusMessage = message.content && isAppointmentStatusChangeMessage(message.content);
                                    
                                    // Si es mensaje de estado, renderizar de forma especial sin avatar
                                    if (isStatusMessage) {
                                        const statusValue = extractStatusValue(message.content);
                                        const display = statusValue ? getStatusDisplay(statusValue) : null;
                                        if (!display) return null;
                                        
                                        return (
                                            <div key={message.id} className="w-full flex justify-center my-2">
                                                <div className={`w-full max-w-[85%] sm:max-w-[75%] lg:max-w-[65%] rounded-lg border ${display.borderColor} ${display.bgColor} shadow-sm overflow-hidden`}>
                                                    {/* Header con icono, mensaje e info */}
                                                    <div className="flex items-start gap-2 px-3 py-2">
                                                        <div className={`${display.color} flex-shrink-0 mt-0.5`}>
                                                            {display.icon}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-0.5">
                                                                <p className={`text-sm font-medium ${display.color}`}>
                                                                    {display.message}
                                                                </p>
                                                            </div>
                                                            {/* Timestamp */}
                                                            <div className={`text-xs ${display.color} opacity-60`}>
                                                                {(() => {
                                                                    const date = new Date(message.sentAt);
                                                                    return isNaN(date.getTime()) 
                                                                        ? 'Ahora'
                                                                        : date.toLocaleTimeString('es-ES', {
                                                                            hour: '2-digit',
                                                                            minute: '2-digit'
                                                                        });
                                                                })()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Accordion con información adicional */}
                                                    {display.description && (
                                                        <div className="px-3 pb-2">
                                                            <Accordion type="single" collapsible className="w-full">
                                                                <AccordionItem value="status-info" className="border-none">
                                                                    <AccordionTrigger className={`py-1 hover:no-underline ${display.color} opacity-70 hover:opacity-100`}>
                                                                        <div className="flex items-center gap-1.5 text-xs">
                                                                            <Info className="w-3 h-3" />
                                                                            <span>Más información</span>
                                                                        </div>
                                                                    </AccordionTrigger>
                                                                    <AccordionContent className="pt-0.5 pb-0">
                                                                        <p className={`text-xs ${display.color} opacity-80 leading-relaxed`}>
                                                                            {display.description}
                                                                        </p>
                                                                    </AccordionContent>
                                                                </AccordionItem>
                                                            </Accordion>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    }
                                    
                                    // Mensaje normal con avatar - Estilo igual a PreHireChat
                                    const isOwnMessage = group.isOwn;
                                    
                                    return (
                                        <div
                                            key={message.id}
                                            className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} max-w-[70%] ${isOwnMessage ? 'ml-auto' : 'mr-auto'}`}
                                        >
                                            {/* ✅ Foto de perfil */}
                                            {!isOwnMessage && (
                                            <Avatar className="w-8 h-8 flex-shrink-0">
                                                <AvatarImage 
                                                    src={getAvatarImage(group.senderId) || undefined} 
                                                        alt={message.senderName || 'Usuario'}
                                                />
                                                    <AvatarFallback className="bg-gray-900 text-white text-xs">
                                                    {getAvatarInitials(group.senderId)}
                                                </AvatarFallback>
                                            </Avatar>
                                        )}
                                            
                                            <div className={`flex flex-col gap-1 ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                                                {!isOwnMessage && (
                                                    <span className="text-xs font-semibold text-gray-600">{message.senderName || 'Usuario'}</span>
                                                )}
                                            {message.content && (
                                                    <div
                                                        className={`px-3 py-2 rounded-2xl ${
                                                            isOwnMessage
                                                                ? 'bg-primary text-white rounded-tr-sm'
                                                                : 'bg-gray-100 text-gray-900 rounded-tl-sm'
                                                        }`}
                                                    >
                                                        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                                            </div>
                                        )}
                                                <span className="text-xs text-gray-500">
                                                    {new Date(message.sentAt).toLocaleTimeString('es-ES', {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                                
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
                        <div className="flex items-center justify-center h-full">
                            <p className="text-gray-500 text-center">
                                No hay mensajes aún. ¡Empieza la conversación!
                            </p>
                                            </div>
                                        )}
                <div ref={messagesEndRef} />
                                    </div>

            {/* Input */}
            <div className="flex gap-2 p-4 border-t border-gray-200 bg-white rounded-b-lg relative z-10">
                <input
                    type="text"
                                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                            if (newMessage.trim() || selectedFiles.length > 0 || location) {
                                            handleSendMessage();
                            }
                                        }
                                    }}
                    placeholder={isSending ? "Enviando..." : "Escribe tu mensaje..."}
                                    disabled={isSending}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    style={{ pointerEvents: 'auto' }}
                />
                                        <Button
                                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() && selectedFiles.length === 0 && !location || isSending}
                    className="rounded-full px-6"
                                >
                                    {isSending ? (
                        'Enviando...'
                                    ) : (
                        <Send className="w-4 h-4" />
                                    )}
                                </Button>
            </div>

            {/* Map Modal */}
            {isMapModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">Seleccionar Ubicación</h3>
                        </div>

                        {isLoaded && !loadError ? (
                            <div className="relative h-[400px]">
                                <GoogleMap
                                    mapContainerStyle={{ width: '100%', height: '100%' }}
                                    zoom={14}
                                    center={selectedMapLocation}
                                    onClick={handleMapClick}
                                    options={{
                                        disableDefaultUI: false,
                                        zoomControl: true,
                                        mapTypeControl: false,
                                        scaleControl: true,
                                        streetViewControl: false,
                                        rotateControl: false,
                                        fullscreenControl: false,
                                        styles: mapStyles,
                                    }}
                                >
                                    {selectedMapLocation && (
                                        <Marker position={selectedMapLocation} icon={markerIcon} />
                                    )}
                                </GoogleMap>
                                <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg">
                                    <span className="text-sm text-gray-700 font-medium">
                                        Haz clic para seleccionar una ubicación
                                    </span>
                                </div>
                                {selectedMapLocation && (
                                    <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg">
                                        <span className="text-sm text-gray-700 font-mono">
                                            {selectedMapLocation.lat.toFixed(4)}, {selectedMapLocation.lng.toFixed(4)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="h-[400px] flex items-center justify-center bg-gray-50">
                                {loadError ? (
                                    <span className="text-red-500">Error al cargar el mapa</span>
                                ) : (
                                    <span className="text-gray-500">Cargando mapa...</span>
                                )}
                            </div>
                        )}

                        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                            <button
                                onClick={() => setIsMapModalOpen(false)}
                                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
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
                            className="absolute top-4 right-4 bg-white/90 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg">
                            <span className="text-sm text-gray-700 font-medium">
                                {getFileName(selectedImage)}
                            </span>
                        </div>
                        <a
                            href={selectedImage}
                            download
                            className="absolute bottom-4 right-4 bg-white/90 hover:bg-white text-gray-800 rounded-lg px-4 py-2 shadow-lg transition-colors flex items-center gap-2 text-sm font-medium"
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