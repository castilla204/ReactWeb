import { useEffect, useRef, useState } from 'react';
import { useChat } from '../hooks/useChat';
import { useAuth } from '../contexts/AuthContext';
import { isAdmin } from '../utils/admin';
import { Send, Paperclip, MapPin, Download, X, Loader2, HelpCircle, Calendar, FileText, MessageSquare, CheckCircle2, CheckCircle, XCircle, AlertCircle, Clock, FileCheck } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { NotificationType } from './Notification';
import { v4 as uuidv4 } from 'uuid';
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';

interface ChatProps {
    searchId: number;
    setNotifications: React.Dispatch<
        React.SetStateAction<{ id: string; type: NotificationType; message: string; duration?: number }[]>
    >;
    isExpert: boolean;
    expertData?: {
        name?: string;
        profilePictureUrl?: string;
    };
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
    icon: React.ReactNode;
    color: string;
    bgColor: string;
    borderColor: string;
}

const statusDisplayMap: Record<string, StatusDisplay> = {
    "appointment_proposed": {
        message: "Cita propuesta",
        icon: <Calendar className="w-4 h-4" />,
        color: "text-blue-700 dark:text-blue-300",
        bgColor: "bg-blue-50 dark:bg-blue-950/30",
        borderColor: "border-blue-200 dark:border-blue-800"
    },
    "appointment_confirmed": {
        message: "✅ Cita aceptada",
        icon: <CheckCircle className="w-4 h-4" />,
        color: "text-green-700 dark:text-green-300",
        bgColor: "bg-green-50 dark:bg-green-950/30",
        borderColor: "border-green-200 dark:border-green-800"
    },
    "appointment_rejected": {
        message: "❌ Cita rechazada",
        icon: <XCircle className="w-4 h-4" />,
        color: "text-red-700 dark:text-red-300",
        bgColor: "bg-red-50 dark:bg-red-950/30",
        borderColor: "border-red-200 dark:border-red-800"
    },
    "appointment_cancelled_by_client": {
        message: "Cita cancelada por el cliente",
        icon: <AlertCircle className="w-4 h-4" />,
        color: "text-orange-700 dark:text-orange-300",
        bgColor: "bg-orange-50 dark:bg-orange-950/30",
        borderColor: "border-orange-200 dark:border-orange-800"
    },
    "appointment_cancelled_by_expert": {
        message: "Cita cancelada por el experto",
        icon: <AlertCircle className="w-4 h-4" />,
        color: "text-orange-700 dark:text-orange-300",
        bgColor: "bg-orange-50 dark:bg-orange-950/30",
        borderColor: "border-orange-200 dark:border-orange-800"
    },
    "appointment_cancelled_by_client_second": {
        message: "Cita cancelada por el cliente (segunda cancelación)",
        icon: <AlertCircle className="w-4 h-4" />,
        color: "text-orange-700 dark:text-orange-300",
        bgColor: "bg-orange-50 dark:bg-orange-950/30",
        borderColor: "border-orange-200 dark:border-orange-800"
    },
    "appointment_cancelled_by_expert_second": {
        message: "Cita cancelada por el experto (segunda cancelación)",
        icon: <AlertCircle className="w-4 h-4" />,
        color: "text-orange-700 dark:text-orange-300",
        bgColor: "bg-orange-50 dark:bg-orange-950/30",
        borderColor: "border-orange-200 dark:border-orange-800"
    },
    "appointment_cancelled_by_no_response": {
        message: "Cita cancelada - sin respuesta",
        icon: <Clock className="w-4 h-4" />,
        color: "text-gray-700 dark:text-gray-300",
        bgColor: "bg-gray-50 dark:bg-gray-950/30",
        borderColor: "border-gray-200 dark:border-gray-800"
    },
    "appointment_cancelled_by_no_report": {
        message: "Cita cancelada - sin reporte",
        icon: <FileText className="w-4 h-4" />,
        color: "text-gray-700 dark:text-gray-300",
        bgColor: "bg-gray-50 dark:bg-gray-950/30",
        borderColor: "border-gray-200 dark:border-gray-800"
    },
    "appointment_report_sent": {
        message: "📄 Reporte enviado",
        icon: <FileCheck className="w-4 h-4" />,
        color: "text-green-700 dark:text-green-300",
        bgColor: "bg-green-50 dark:bg-green-950/30",
        borderColor: "border-green-200 dark:border-green-800"
    },
    "appointment_awaiting_report": {
        message: "Esperando reporte del experto",
        icon: <Clock className="w-4 h-4" />,
        color: "text-yellow-700 dark:text-yellow-300",
        bgColor: "bg-yellow-50 dark:bg-yellow-950/30",
        borderColor: "border-yellow-200 dark:border-yellow-800"
    },
    "appointment_cancelled_by_expert_rejection": {
        message: "Cita cancelada por rechazo del experto",
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

const Chat: React.FC<ChatProps> = ({ searchId, setNotifications, isExpert, expertData }) => {
    const { user } = useAuth();
    const { conversation, loading, error, newMessage, setNewMessage, sendMessage, isSending } = useChat(
        searchId,
        setNotifications
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
        googleMapsApiKey: "AIzaSyBNEdqihExcXPnWw_TJgHFzsPXS7BIazyM",
        libraries,
    });

    console.log('[09:15 CEST] Chat component render:', { searchId, isExpert, userId: user?.id, conversationId: conversation?.id });

    useEffect(() => {
        if (conversation?.messages && conversation.messages.length > lastMessageCount.current) {
            if (messagesEndRef.current) {
                messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
            }
            lastMessageCount.current = conversation.messages.length;
        }
    }, [conversation?.messages?.length]);

    // Scroll to bottom when conversation loads for the first time
    useEffect(() => {
        if (conversation?.messages && messagesEndRef.current && !loading) {
            // Use setTimeout to ensure DOM is fully rendered
            setTimeout(() => {
                if (messagesEndRef.current) {
                    messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
                }
            }, 100);
        }
    }, [conversation?.id, loading]);

    useEffect(() => {
        if (error) {
            setNotifications((prev) => [
                ...prev.filter((n) => !n.id.startsWith('chat-error-')),
                {
                    id: `chat-error-${uuidv4()}`,
                    type: 'error' as NotificationType,
                    message: error.includes('401') ? 'Sesión expirada. Por favor, inicia sesión de nuevo.' : error,
                    duration: 5000,
                },
            ]);
        }
    }, [error, setNotifications]);

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
            setNotifications((prev) => [
                ...prev,
                {
                    id: `file-selected-${uuidv4()}`,
                    type: 'success' as NotificationType,
                    message: `Archivos seleccionados: ${validFiles.map((f) => f.name).join(', ')}`,
                    duration: 3000,
                },
            ]);
        }
        if (validFiles.length < files.length) {
            setNotifications((prev) => [
                ...prev,
                {
                    id: `file-error-${uuidv4()}`,
                    type: 'error' as NotificationType,
                    message: `Solo se permiten archivos JPG, PNG, MP4 con un tamaño máximo de ${maxMessageFileSize / 1024 / 1024}MB.`,
                    duration: 5000,
                },
            ]);
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
        setNotifications((prev) => [
            ...prev,
            {
                id: `location-selected-${uuidv4()}`,
                type: 'success' as NotificationType,
                message: `Ubicación seleccionada: ${selectedMapLocation.lat.toFixed(4)}, ${selectedMapLocation.lng.toFixed(4)}`,
                duration: 3000,
            },
        ]);
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
            setNotifications((prev) => [
                ...prev,
                {
                    id: `empty-message-${uuidv4()}`,
                    type: 'error' as NotificationType,
                    message: 'Escribe un mensaje, selecciona un archivo o comparte tu ubicación para enviar.',
                    duration: 5000,
                },
            ]);
        }
    };

    const getAvatarInitials = (senderId: string) => {
        if (senderId === String(user?.id)) {
            return user?.name?.charAt(0)?.toUpperCase() || 'Y';
        }
        // Special case for header - 'other' means the other person in conversation
        if (senderId === 'other') {
            return isClient ? (expertData?.name?.charAt(0)?.toUpperCase() || 'E') : 'C';
        }
        // ✅ CORREGIDO: Para mensajes en el chat
        // Si el senderId es del experto, mostrar inicial del experto
        // Si el senderId es del cliente, mostrar inicial 'C'
        return String(senderId) === String(expertId) ? (expertData?.name?.charAt(0)?.toUpperCase() || 'E') : 'C';
    };

    const getAvatarColor = (senderId: string) => {
        if (senderId === String(user?.id)) {
            return 'bg-gray-600';
        }
        return 'bg-gray-500';
    };

    const getAvatarImage = (senderId: string) => {
        if (senderId === String(user?.id)) {
            return user?.profilePictureUrl;
        }
        // Special case for header - 'other' means the other person in conversation
        if (senderId === 'other') {
            return isClient ? expertData?.profilePictureUrl : undefined;
        }
        // ✅ CORREGIDO: Para mensajes en el chat
        // Si el senderId es del experto, mostrar su imagen
        // Si el senderId es del cliente, no mostrar imagen (solo inicial)
        return String(senderId) === String(expertId) ? expertData?.profilePictureUrl : undefined;
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
    const clientId = Number(conversation?.clientId);
    const expertId = Number(conversation?.expertId);
    
    // Check if user is admin
    const userIsAdmin = isAdmin(user?.email);
    
    // User has access if they are the client, expert, or admin
    const hasAccess = userId === clientId || userId === expertId || userIsAdmin;
    
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

        // Group if same sender and within 5 minutes
        if (previousMessage &&
            previousMessage.senderId === message.senderId &&
            timeDiff < 5 * 60 * 1000) {
            groups[groups.length - 1].messages.push(message);
        } else {
            groups.push({
                senderId: message.senderId,
                messages: [message],
                timestamp: message.sentAt,
                isOwn: message.senderId === user.id
            });
        }
        return groups;
    }, []) || [];

    return (
        <div className="relative flex flex-col h-full bg-background">
            {/* Messages Container - Fixed height with internal scroll */}
            <ScrollArea className="h-[calc(100vh-400px)] lg:h-[calc(100vh-350px)] flex-1 px-4 lg:px-6 chat-scroll-area">
                <div className="space-y-6 pb-32 lg:pb-40" data-chat-messages ref={messagesEndRef}>
                    {/* Mensajes de bienvenida - Siempre se muestran */}
                    {isExpert ? (
                        <div className={`flex flex-col items-center justify-start ${conversation.messages?.length === 0 ? 'pt-6 lg:pt-8' : 'pt-6'} pb-8 text-center px-4`}>
                            <div className="max-w-2xl w-full space-y-4">
                                {/* Primer mensaje de bienvenida - Experto */}
                                <div className="flex gap-3 justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <Avatar className="w-8 h-8 flex-shrink-0 border border-border/50">
                                        <AvatarImage src={expertData?.profilePictureUrl} alt="Sistema" />
                                        <AvatarFallback className="bg-muted text-muted-foreground font-medium text-xs">
                                            AI
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 flex justify-start">
                                        <div className="max-w-[85%] sm:max-w-[75%] lg:max-w-[65%] bg-muted/60 border border-border/50 text-foreground rounded-xl px-4 py-3 shadow-sm">
                                            <p className="text-sm text-foreground leading-relaxed">
                                                ¡Hola! 👋 Bienvenido al chat de este servicio. El cliente te ha contratado y está esperando poder comunicarse contigo.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Segundo mensaje de bienvenida - Experto con sugerencias */}
                                <div className="flex gap-3 justify-start animate-in fade-in slide-in-from-bottom-2 duration-300 delay-100">
                                    <Avatar className="w-8 h-8 flex-shrink-0 border border-border/50">
                                        <AvatarImage src={expertData?.profilePictureUrl} alt="Sistema" />
                                        <AvatarFallback className="bg-muted text-muted-foreground font-medium text-xs">
                                            AI
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 flex justify-start">
                                        <div className="max-w-[85%] sm:max-w-[75%] lg:max-w-[65%] bg-muted/60 border border-border/50 text-foreground rounded-xl px-4 py-3 shadow-sm">
                                            <div className="space-y-2.5">
                                                <p className="text-sm text-foreground leading-relaxed mb-2.5 font-medium">
                                                    Aquí tienes algunas cosas que puedes hacer:
                                                </p>
                                                <ul className="space-y-2 text-xs">
                                                    <li className="flex items-start gap-2.5">
                                                        <MessageSquare className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                                                        <span className="text-foreground">Responder preguntas sobre el servicio</span>
                                                    </li>
                                                    <li className="flex items-start gap-2.5">
                                                        <Calendar className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                                                        <span className="text-foreground">Coordinar detalles de la inspección</span>
                                                    </li>
                                                    <li className="flex items-start gap-2.5">
                                                        <Paperclip className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                                                        <span className="text-foreground">Compartir archivos e imágenes</span>
                                                    </li>
                                                </ul>
                                                {conversation.messages?.length === 0 && (
                                                    <p className="text-xs text-muted-foreground italic mt-3 pt-2.5 border-t border-border/40">
                                                        Escribe un mensaje para comenzar la conversación con el cliente.
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className={`flex flex-col items-center justify-start ${conversation.messages?.length === 0 ? 'pt-6 lg:pt-8' : 'pt-6'} pb-8 text-center px-4`}>
                            <div className="max-w-2xl w-full space-y-4">
                                {/* Primer mensaje de bienvenida - Cliente */}
                                <div className="flex gap-3 justify-start animate-in fade-in slide-in-from-bottom-3 duration-500">
                                    <Avatar className="w-10 h-10 flex-shrink-0 border-2 border-blue-500/30 ring-2 ring-blue-500/20 shadow-lg shadow-blue-500/20">
                                        <AvatarImage src={expertData?.profilePictureUrl} alt="Experto" />
                                        <AvatarFallback className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 text-white font-semibold text-sm shadow-lg">
                                            {expertData?.name?.charAt(0).toUpperCase() || 'E'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 flex justify-start">
                                        <div className="max-w-[85%] sm:max-w-[75%] lg:max-w-[65%] bg-gradient-to-br from-blue-50 via-indigo-50 to-orange-50/30 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-orange-950/20 border border-blue-200/50 dark:border-blue-800/50 text-foreground rounded-2xl px-5 py-4 shadow-lg shadow-blue-500/10 hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 relative overflow-hidden">
                                            {/* Efecto de brillo sutil */}
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_3s_infinite]"></div>
                                            <p className="text-sm text-foreground leading-relaxed relative z-10 font-medium">
                                                ¡Hola! 👋 Soy <span className="font-semibold bg-gradient-to-r from-blue-600 to-orange-500 dark:from-blue-400 dark:to-orange-400 bg-clip-text text-transparent">{expertData?.name || 'tu experto'}</span>. Estoy aquí para ayudarte con tu búsqueda. Puedes preguntarme cualquier cosa sobre el servicio.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Segundo mensaje de bienvenida - Cliente con sugerencias */}
                                <div className="flex gap-3 justify-start animate-in fade-in slide-in-from-bottom-3 duration-500 delay-150">
                                    <Avatar className="w-10 h-10 flex-shrink-0 border-2 border-blue-500/30 ring-2 ring-blue-500/20 shadow-lg shadow-blue-500/20">
                                        <AvatarImage src={expertData?.profilePictureUrl} alt="Experto" />
                                        <AvatarFallback className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 text-white font-semibold text-sm shadow-lg">
                                            {expertData?.name?.charAt(0).toUpperCase() || 'E'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 flex justify-start">
                                        <div className="max-w-[85%] sm:max-w-[75%] lg:max-w-[65%] bg-gradient-to-br from-blue-50 via-indigo-50 to-orange-50/30 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-orange-950/20 border border-blue-200/50 dark:border-blue-800/50 text-foreground rounded-2xl px-5 py-4 shadow-lg shadow-blue-500/10 hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 relative overflow-hidden">
                                            {/* Efecto de brillo sutil */}
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_3s_infinite]"></div>
                                            <div className="space-y-3 relative z-10">
                                                <p className="text-sm text-foreground leading-relaxed mb-3 font-semibold">
                                                    ¿En qué puedo ayudarte hoy?
                                                </p>
                                                {conversation.messages?.length === 0 && (
                                                    <>
                                                        <div className="grid grid-cols-1 gap-2.5">
                                                            <button 
                                                                onClick={() => {
                                                                    setNewMessage("¿Podrías explicarme cómo funciona el servicio?");
                                                                }}
                                                                className="text-left px-4 py-3 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-blue-200/50 dark:border-blue-700/50 hover:bg-white hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md hover:scale-[1.02] transition-all duration-200 text-sm text-foreground group flex items-center gap-3 font-medium"
                                                            >
                                                                <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm group-hover:scale-110 transition-transform">
                                                                    <HelpCircle className="w-4 h-4" />
                                                                </div>
                                                                <span>Explicación del servicio</span>
                                                            </button>
                                                            <button 
                                                                onClick={() => {
                                                                    setNewMessage("¿Cuándo podemos coordinar la cita?");
                                                                }}
                                                                className="text-left px-4 py-3 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-orange-200/50 dark:border-orange-700/50 hover:bg-white hover:border-orange-400 dark:hover:border-orange-500 hover:shadow-md hover:scale-[1.02] transition-all duration-200 text-sm text-foreground group flex items-center gap-3 font-medium"
                                                            >
                                                                <div className="p-1.5 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-sm group-hover:scale-110 transition-transform">
                                                                    <Calendar className="w-4 h-4" />
                                                                </div>
                                                                <span>Coordinar cita</span>
                                                            </button>
                                                            <button 
                                                                onClick={() => {
                                                                    setNewMessage("¿Qué documentos necesito?");
                                                                }}
                                                                className="text-left px-4 py-3 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-blue-200/50 dark:border-blue-700/50 hover:bg-white hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md hover:scale-[1.02] transition-all duration-200 text-sm text-foreground group flex items-center gap-3 font-medium"
                                                            >
                                                                <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-sm group-hover:scale-110 transition-transform">
                                                                    <FileText className="w-4 h-4" />
                                                                </div>
                                                                <span>Documentos necesarios</span>
                                                            </button>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground italic mt-4 pt-3 border-t border-blue-200/50 dark:border-blue-800/50">
                                                            O simplemente escribe tu pregunta y te responderé lo antes posible.
                                                        </p>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Mensajes reales de la conversación */}
                    {groupedMessages && groupedMessages.length > 0 && (
                        groupedMessages.map((group, groupIndex) => (
                        <div key={groupIndex} className="w-full">
                            {/* Message group - Inspirado en Vercel AI SDK Chatbot */}
                            <div className="space-y-2">
                                {group.messages.map((message: any, msgIndex: number) => {
                                    const isStatusMessage = message.content && isAppointmentStatusChangeMessage(message.content);
                                    
                                    // Si es mensaje de estado, renderizar de forma especial sin avatar
                                    if (isStatusMessage) {
                                        const statusValue = extractStatusValue(message.content);
                                        const display = statusValue ? getStatusDisplay(statusValue) : null;
                                        if (!display) return null;
                                        
                                        return (
                                            <div key={message.id} className="w-full flex justify-center my-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                                <div className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 ${display.bgColor} ${display.borderColor} ${display.color} shadow-md max-w-[85%] sm:max-w-[75%] lg:max-w-[65%]`}>
                                                    <div className={`${display.color} flex-shrink-0`}>
                                                        {display.icon}
                                                    </div>
                                                    <p className="text-sm font-medium">
                                                        {display.message}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    }
                                    
                                    // Mensaje normal con avatar
                                    return (
                                    <div key={message.id} className={`flex gap-3 ${group.isOwn ? 'flex-row-reverse' : 'flex-row'} ${msgIndex === 0 ? 'mt-3' : 'mt-1'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                                        {/* Avatar solo en el primer mensaje del grupo */}
                                        {msgIndex === 0 && (
                                            <Avatar className="w-8 h-8 flex-shrink-0 border-2 border-border ring-1 ring-primary/10">
                                                <AvatarImage 
                                                    src={getAvatarImage(group.senderId) || undefined} 
                                                    alt="Avatar"
                                                    className="object-cover"
                                                />
                                                <AvatarFallback className={`text-xs font-semibold ${getAvatarColor(group.senderId)} text-white`}>
                                                    {getAvatarInitials(group.senderId)}
                                                </AvatarFallback>
                                            </Avatar>
                                        )}
                                        {msgIndex > 0 && <div className="w-8" />}

                                        <div className="flex-1 space-y-2">
                                        {/* Message Content - Diseño más limpio inspirado en Vercel */}
                                            <div className={`${group.isOwn ? 'flex justify-end' : 'flex justify-start'}`}>
                                            {message.content && (
                                                <div className={`group relative max-w-[85%] sm:max-w-[75%] lg:max-w-[65%] ${
                                                    group.isOwn 
                                                        ? 'bg-primary text-primary-foreground' 
                                                        : 'bg-muted text-foreground'
                                                } rounded-2xl px-4 py-2.5 shadow-sm hover:shadow-md transition-shadow`}
                                                style={{
                                                    borderRadius: group.isOwn 
                                                        ? '1.125rem 1.125rem 0.25rem 1.125rem' 
                                                        : '1.125rem 1.125rem 1.125rem 0.25rem'
                                                }}>
                                                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                                        {message.content}
                                                    </p>
                                                    {/* Timestamp más discreto */}
                                                    <div className={`text-xs mt-1.5 pt-1.5 border-t ${
                                                        group.isOwn 
                                                            ? 'border-primary-foreground/20 text-primary-foreground/70' 
                                                            : 'border-border text-muted-foreground'
                                                    }`}>
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
                                        )}
                                            </div>

                                        {/* Attachments - Redesigned */}
                                        {message.attachmentUrls && message.attachmentUrls.length > 0 && (
                                            <div className={`w-full ${group.isOwn ? 'flex justify-end' : 'flex justify-start'} mb-3`}>
                                                <div className={`relative w-32 ${group.isOwn ? 'ml-auto' : 'mr-auto'}`}>
                                                    {message.attachmentUrls.length === 1 ? (
                                                        // Single image - full width
                                                        <div className="group cursor-pointer" onClick={() => setSelectedImage(message.attachmentUrls[0])}>
                                                            {message.attachmentUrls[0].endsWith('.mp4') ? (
                                                                <div className={`relative overflow-hidden shadow-lg ${
                                                                    group.isOwn 
                                                                        ? 'bg-blue-500' 
                                                                        : 'bg-white border border-gray-200'
                                                                }`}
                                                                style={{
                                                                    borderRadius: group.isOwn 
                                                                        ? '18px 18px 4px 18px' 
                                                                        : '18px 18px 18px 4px'
                                                                }}>
                                                                    <video
                                                                        src={message.attachmentUrls[0]}
                                                                        controls
                                                                        className="w-full h-24 object-cover"
                                                                        style={{
                                                                            borderRadius: group.isOwn 
                                                                                ? '18px 18px 4px 18px' 
                                                                                : '18px 18px 18px 4px'
                                                                        }}
                                                                    />
                                                                </div>
                                                            ) : (
                                                                <div className="relative overflow-hidden shadow-lg"
                                                                     style={{
                                                                         borderRadius: group.isOwn 
                                                                             ? '18px 18px 4px 18px' 
                                                                             : '18px 18px 18px 4px'
                                                                     }}>
                                                                    <img
                                                                        src={message.attachmentUrls[0]}
                                                                        alt="Imagen compartida"
                                                                        className="w-full h-24 object-cover group-hover:scale-105 transition-transform duration-300"
                                                                        style={{
                                                                            borderRadius: group.isOwn 
                                                                                ? '18px 18px 4px 18px' 
                                                                                : '18px 18px 18px 4px'
                                                                        }}
                                                                    />
                                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                                                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 backdrop-blur-sm rounded-full p-3">
                                                                            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                                                            </svg>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        // Multiple images - grid layout
                                                        <div className={`grid gap-1 ${
                                                            message.attachmentUrls.length === 2 ? 'grid-cols-2' : 
                                                            message.attachmentUrls.length === 3 ? 'grid-cols-2' :
                                                            'grid-cols-2'
                                                        }`}>
                                                            {message.attachmentUrls.map((url: string, index: number) => (
                                                                <div 
                                                                    key={index} 
                                                                    className={`group cursor-pointer relative overflow-hidden ${
                                                                        message.attachmentUrls.length === 3 && index === 0 ? 'row-span-2' : ''
                                                                    }`}
                                                                    onClick={() => setSelectedImage(url)}
                                                                   style={{
                                                                       borderRadius: '12px',
                                                                       aspectRatio: '1'
                                                                   }}
                                                                >
                                                                    {url.endsWith('.mp4') ? (
                                                                        <video
                                                                            src={url}
                                                                            className="w-full h-full object-cover"
                                                                            style={{ borderRadius: '12px' }}
                                                                        />
                                                                    ) : (
                                                                        <>
                                                                            <img
                                                                                src={url}
                                                                                alt={`Imagen ${index + 1}`}
                                                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                                                                style={{ borderRadius: '12px' }}
                                                                            />
                                                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                                                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 backdrop-blur-sm rounded-full p-2">
                                                                                    <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                                                                    </svg>
                                                                                </div>
                                                                            </div>
                                                                            {message.attachmentUrls.length > 4 && index === 3 && (
                                                                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center" style={{ borderRadius: '12px' }}>
                                                                                    <span className="text-white font-bold text-lg">+{message.attachmentUrls.length - 4}</span>
                                                                                </div>
                                                                            )}
                                                                        </>
                                                                    )}
                                                                </div>
                                                            )).slice(0, 4)}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Location */}
                                        {(message.locationLatitude || message.locationLongitude) && isLoaded && !loadError && (
                                                <div className={`w-full ${group.isOwn ? 'flex justify-end' : 'flex justify-start'}`}>
                                                <div className={`relative w-32 ${group.isOwn ? 'ml-auto' : 'mr-auto'}`}>
                                                    <div className="bg-white border border-gray-200 shadow-lg overflow-hidden"
                                                         style={{
                                                             borderRadius: group.isOwn 
                                                                 ? '18px 18px 4px 18px' 
                                                                 : '18px 18px 18px 4px'
                                                         }}>
                                                        <GoogleMap
                                                            mapContainerStyle={{ width: '100%', height: '96px' }}
                                                    zoom={14}
                                                    center={{
                                                        lat: parseFloat(message.locationLatitude || defaultCenter.lat.toString()),
                                                        lng: parseFloat(message.locationLongitude || defaultCenter.lng.toString()),
                                                    }}
                                                    options={{
                                                        disableDefaultUI: true,
                                                        zoomControl: false,
                                                        mapTypeControl: false,
                                                        streetViewControl: false,
                                                        fullscreenControl: false,
                                                        styles: mapStyles,
                                                    }}
                                                >
                                                    <Marker
                                                        position={{
                                                            lat: parseFloat(message.locationLatitude || defaultCenter.lat.toString()),
                                                            lng: parseFloat(message.locationLongitude || defaultCenter.lng.toString()),
                                                        }}
                                                        icon={markerIcon}
                                                    />
                                                        </GoogleMap>
                                                        <div className="p-1.5">
                                                            <a
                                                                href={`https://www.google.com/maps?q=${message.locationLatitude},${message.locationLongitude}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-gray-600 hover:text-gray-800 text-xs font-medium flex items-center gap-1"
                                                            >
                                                                <MapPin className="w-2.5 h-2.5" />
                                                                Ver
                                                            </a>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        </div>
                                    </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                    )}
                <div ref={messagesEndRef} />
            </div>
            </ScrollArea>

            {/* Fixed Input Area at Bottom - Inspirado en PromptInput de AI Elements */}
            <div className="absolute bottom-0 left-0 right-0 bg-background z-10 border-t border-border/50">
                <div className="w-full px-3 pt-3 pb-3 sm:px-4 sm:pt-4 sm:pb-4 lg:px-6 lg:pt-6" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
                    <div className="max-w-4xl mx-auto">
                        {/* PromptInput Container - Estilo moderno con colores tutifruti sutiles */}
                        <div className="relative bg-white dark:bg-gray-900 border-2 border-gray-300/70 dark:border-gray-600/60 rounded-xl shadow-lg overflow-hidden">
                            {/* Borde decorativo con gradiente tutifruti */}
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400/15 via-indigo-400/15 via-purple-400/15 to-orange-400/15 dark:from-blue-500/12 dark:via-indigo-500/12 dark:via-purple-500/12 dark:to-orange-500/12 -z-10 blur-sm"></div>
                            {/* Fondo con gradiente sutil */}
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-50/35 via-indigo-50/30 to-orange-50/30 dark:from-blue-950/25 dark:via-indigo-950/20 dark:to-orange-950/18 -z-10"></div>
                            <div className="relative bg-white dark:bg-gray-900 rounded-xl">
                                {/* Header - Attachments */}
                {(selectedFiles.length > 0 || location) && (
                                    <div className="px-2.5 py-2 sm:px-3 sm:py-2.5 border-b border-gray-200/60 dark:border-gray-700/50 bg-gradient-to-r from-blue-50/30 via-indigo-50/25 to-orange-50/25 dark:from-blue-950/18 dark:via-indigo-950/15 dark:to-orange-950/12">
                                        <div className="flex flex-wrap gap-2">
                            {selectedFiles.map((file, index) => (
                                                <div
                                                    key={index}
                                                    className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-background border border-border/50 text-xs"
                                                >
                                                    <Paperclip className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-foreground truncate max-w-[120px]">
                                        {file.name}
                                        </p>
                                                        <p className="text-muted-foreground">
                                        {formatFileSize(file.size)}
                                        </p>
                                    </div>
                                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newFiles = [...selectedFiles];
                                            newFiles.splice(index, 1);
                                            setSelectedFiles(newFiles);
                                        }}
                                                        className="ml-1 p-0.5 rounded hover:bg-muted transition-colors"
                                                    >
                                                        <X className="w-3.5 h-3.5 text-muted-foreground" />
                                                    </button>
                                                </div>
                            ))}
                {location && (
                                                <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-green-50/50 dark:bg-green-950/20 border border-green-200/50 dark:border-green-800/50 text-xs">
                                                    <MapPin className="w-3.5 h-3.5 text-green-600 dark:text-green-400 flex-shrink-0" />
                                                    <div className="font-medium text-green-700 dark:text-green-400">
                                {parseFloat(location.latitude).toFixed(4)}, {parseFloat(location.longitude).toFixed(4)}
                            </div>
                                                    <button
                                        type="button"
                                        onClick={() => setLocation(null)}
                                                        className="ml-1 p-0.5 rounded hover:bg-green-100/50 dark:hover:bg-green-900/30 transition-colors"
                                                    >
                                                        <X className="w-3.5 h-3.5 text-green-700 dark:text-green-400" />
                                                    </button>
                                                </div>
                            )}
                        </div>
                    </div>
                )}

                                {/* Body - Textarea */}
                                <div className="px-2.5 py-2.5 sm:px-3 sm:py-3">
                                    <textarea
                                        value={newMessage}
                                        onChange={(e) => {
                                            setNewMessage(e.target.value);
                                            // Auto-resize
                                            e.target.style.height = 'auto';
                                            e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
                                        }}
                                        placeholder="Escribe un mensaje..."
                                        className="w-full bg-transparent resize-none text-foreground placeholder:text-muted-foreground text-sm leading-relaxed focus:outline-none border-0"
                                        rows={1}
                                        style={{ minHeight: '44px', maxHeight: '160px' }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey && (newMessage.trim() || selectedFiles.length > 0 || location) && !isSending) {
                                                e.preventDefault();
                                                handleSendMessage();
                                            }
                                        }}
                                        disabled={isSending}
                                    />
                                </div>

                                {/* Footer - Tools and Submit */}
                                <div className="px-2.5 py-2 sm:px-3 sm:py-2.5 border-t border-gray-200/60 dark:border-gray-700/50 bg-gradient-to-r from-blue-50/30 via-indigo-50/25 to-orange-50/25 dark:from-blue-950/18 dark:via-indigo-950/15 dark:to-orange-950/12 flex items-center justify-between gap-1.5 sm:gap-2 min-w-0">
                                    {/* Tools - Left side */}
                                    <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                                        <label className="cursor-pointer">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                asChild
                                                className="h-7 w-7 sm:h-8 sm:w-8 rounded-md hover:bg-muted transition-colors"
                                            >
                                                <span>
                                                    <Paperclip className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                                                    <span className="sr-only">Adjuntar archivo</span>
                                                </span>
                                            </Button>
                                            <input
                                                type="file"
                                                multiple
                                                accept=".jpg,.jpeg,.png,.mp4"
                                                onChange={handleFileChange}
                                                className="hidden"
                                                disabled={isSending}
                                            />
                                        </label>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={handleOpenMapModal}
                                            className="h-7 w-7 sm:h-8 sm:w-8 rounded-md hover:bg-muted transition-colors"
                                            title="Seleccionar ubicación"
                                        >
                                            <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                                            <span className="sr-only">Ubicación</span>
                                        </Button>
                                    </div>

                                    {/* Submit Button - Right side */}
                                        <Button
                                            type="button"
                                            onClick={handleSendMessage}
                                            size="icon"
                                        className={`h-7 w-7 sm:h-8 sm:w-8 rounded-md transition-all duration-200 shrink-0 ${
                                                isSending || (!newMessage.trim() && selectedFiles.length === 0 && !location)
                                                    ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                                                    : messageSent
                                                    ? 'bg-green-500 text-white hover:bg-green-600 shadow-md'
                                                    : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md'
                                            }`}
                                            disabled={isSending || (!newMessage.trim() && selectedFiles.length === 0 && !location)}
                                        >
                                            {isSending ? (
                                            <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                                            ) : messageSent ? (
                                            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                            ) : (
                                            <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                            )}
                                        <span className="sr-only">Enviar mensaje</span>
                                        </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
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