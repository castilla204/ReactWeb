import { useEffect, useRef, useState } from 'react';
import { useChat } from '../hooks/useChat';
import { useAuth } from '../contexts/AuthContext';
import { Send, Smile, Paperclip, MapPin, Download } from 'lucide-react';
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
        if (senderId === user?.id) {
            return user?.name?.charAt(0)?.toUpperCase() || 'Y';
        }
        // Special case for header - 'other' means the other person in conversation
        if (senderId === 'other') {
            return isClient ? (expertData?.name?.charAt(0)?.toUpperCase() || 'E') : 'C';
        }
        // For expert, use expert name initial, for client use 'C'
        return isExpert ? 'C' : (expertData?.name?.charAt(0)?.toUpperCase() || 'E');
    };

    const getAvatarColor = (senderId: string) => {
        if (senderId === user?.id) {
            return 'bg-gray-600';
        }
        return 'bg-gray-500';
    };

    const getAvatarImage = (senderId: string) => {
        if (senderId === user?.id) {
            return user?.profilePictureUrl;
        }
        // Special case for header - 'other' means the other person in conversation
        if (senderId === 'other') {
            return isClient ? expertData?.profilePictureUrl : null;
        }
        // If current user is expert, then other messages are from client (no image)
        // If current user is client, then other messages are from expert (use expert image)
        return isExpert ? null : expertData?.profilePictureUrl;
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

    if (!user || loading || !conversation || (user.id !== conversation.clientId && user.id !== conversation.expertId)) {
        return (
            <div className="flex items-center justify-center h-full text-gray-500">
                {loading ? 'Cargando chat...' : 'No tienes acceso a este chat.'}
            </div>
        );
    }

    const isClient = user.id === conversation.clientId;

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
        <div className="flex flex-col h-full bg-gray-50">
            {/* Header - Hidden on mobile (info shown in parent header) */}
            <div className="hidden lg:block bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden">
                        {getAvatarImage('other') ? (
                            <img 
                                src={getAvatarImage('other')} 
                                alt="Avatar"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    // Fallback to initials if image fails to load
                                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                                    ((e.currentTarget.nextElementSibling as HTMLElement)).style.display = 'flex';
                                }}
                            />
                        ) : null}
                        <div className={`w-full h-full flex items-center justify-center text-white font-medium ${getAvatarColor('other')} ${getAvatarImage('other') ? 'hidden' : ''}`}>
                            {getAvatarInitials('other')}
                        </div>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                            {isClient ? (expertData?.name || 'Experto') : 'Cliente'}
                        </h3>
                        {/* Removed "En línea" status */}
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                {conversation.messages?.length === 0 && isExpert ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="bg-white rounded-2xl p-6 shadow-sm max-w-md border border-gray-100">
                            <Smile className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                            <p className="text-gray-700 font-medium mb-2">
                                ¡Bienvenido al chat!
                            </p>
                            <p className="text-gray-500 text-sm">
                                Estoy aquí para ayudarte con la búsqueda. Escribe un mensaje para comenzar.
                            </p>
                        </div>
                    </div>
                ) : conversation.messages?.length === 0 && !isExpert ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        <p className="text-sm">Aún no hay mensajes. Escribe algo para comenzar.</p>
                    </div>
                ) : (
                    groupedMessages.map((group, groupIndex) => (
                        <div key={groupIndex} className={`flex gap-3 ${group.isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                            {/* Avatar */}
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm flex-shrink-0 overflow-hidden ${getAvatarColor(group.senderId)}`}>
                                {getAvatarImage(group.senderId) ? (
                                    <img 
                                        src={getAvatarImage(group.senderId)} 
                                        alt="Avatar"
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            // Fallback to initials if image fails to load
                                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                                            ((e.currentTarget.nextElementSibling as HTMLElement)).style.display = 'flex';
                                        }}
                                    />
                                ) : null}
                                <span 
                                    className={`w-full h-full flex items-center justify-center ${getAvatarImage(group.senderId) ? 'hidden' : ''}`}
                                >
                                    {getAvatarInitials(group.senderId)}
                                </span>
                            </div>

                            {/* Message group */}
                            <div className="flex-1 space-y-1">
                                {/* Sender name and timestamp */}
                                <div className={`flex items-center gap-2 mb-2 ${group.isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <div className={`flex flex-col ${group.isOwn ? 'items-end' : 'items-start'}`}>
                                        <span className="text-sm font-medium text-gray-900">
                                            {group.isOwn ? 'Tú' : (isExpert ? 'Cliente' : (expertData?.name || 'Experto'))}
                                        </span>
                                        {!group.isOwn && !isExpert && (
                                            <span className="text-xs text-blue-600 font-medium">Experto</span>
                                        )}
                                    </div>
                                    <span className="text-xs text-gray-500">
                                        {new Date(group.timestamp).toLocaleDateString('es-ES', {
                                            day: 'numeric',
                                            month: 'short',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </span>
                                </div>

                                {/* Messages in group */}
                                {group.messages.map((message: any) => (
                                    <div key={message.id} className="w-full">
                                        {/* Text content */}
                                        {message.content && (
                                            <div className={`w-full ${group.isOwn ? 'flex justify-end' : 'flex justify-start'} mb-2`}>
                                                <div className={`relative inline-block px-3 py-2 max-w-sm ${
                                                    group.isOwn 
                                                        ? 'bg-blue-500 text-white' 
                                                        : 'bg-white text-gray-900 border border-gray-200'
                                                } shadow-sm`}
                                                style={{
                                                    borderRadius: group.isOwn 
                                                        ? '18px 18px 4px 18px' 
                                                        : '18px 18px 18px 4px'
                                                }}>
                                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                                        {message.content}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

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
                                            <div className={`w-full ${group.isOwn ? 'flex justify-end' : 'flex justify-start'} mb-3`}>
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
                                ))}
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Selected files preview */}
            {selectedFiles.length > 0 && (
                <div className="px-6 py-2 bg-gray-100 border-t border-gray-200">
                    <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">
                        ARCHIVOS SELECCIONADOS
                    </div>
                    <div className="flex gap-2 overflow-x-auto">
                        {selectedFiles.map((file, index) => (
                            <div key={index} className="bg-white rounded-lg p-2 border border-gray-200 min-w-0 flex-shrink-0">
                                <div className="text-xs font-medium text-gray-700 truncate max-w-[120px]">
                                    {file.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                    {formatFileSize(file.size)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Selected location preview */}
            {location && (
                <div className="px-6 py-2 bg-gray-100 border-t border-gray-200">
                    <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">
                        UBICACIÓN SELECCIONADA
                    </div>
                    <div className="bg-white rounded-lg p-2 border border-gray-200 inline-block">
                        <div className="text-xs font-medium text-gray-700">
                            {parseFloat(location.latitude).toFixed(4)}, {parseFloat(location.longitude).toFixed(4)}
                        </div>
                    </div>
                </div>
            )}

            {/* Input area */}
            <div className="bg-white border-t border-gray-200 px-6 py-4">
                <div className="flex items-end gap-3">
                    <div className="flex-1 relative">
                        <textarea
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Escribe un mensaje..."
                            className="w-full p-3 pr-12 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors resize-none bg-gray-50 text-sm"
                            rows={1}
                            style={{ minHeight: '44px', maxHeight: '120px' }}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey && (newMessage.trim() || selectedFiles.length > 0 || location) && !isSending) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            disabled={isSending}
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleOpenMapModal}
                            className="p-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
                            title="Seleccionar ubicación"
                        >
                            <MapPin className="w-5 h-5 text-gray-600" />
                        </button>

                        <label className="p-3 rounded-xl bg-gray-100 hover:bg-gray-200 cursor-pointer transition-colors">
                            <Paperclip className="w-5 h-5 text-gray-600" />
                            <input
                                type="file"
                                multiple
                                accept=".jpg,.jpeg,.png,.mp4"
                                onChange={handleFileChange}
                                className="hidden"
                                disabled={isSending}
                            />
                        </label>

                        <button
                            onClick={handleSendMessage}
                            className={`p-3 rounded-xl transition-colors ${isSending || (!newMessage.trim() && selectedFiles.length === 0 && !location)
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    : 'bg-gray-900 text-white hover:bg-gray-800'
                                }`}
                            disabled={isSending || (!newMessage.trim() && selectedFiles.length === 0 && !location)}
                        >
                            <Send className="w-5 h-5" />
                        </button>
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