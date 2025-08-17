import { useEffect, useRef, useState } from 'react';
import { useChat } from '../hooks/useChat';
import { useAuth } from '../contexts/AuthContext';
import { Send, Smile, MessageCircle, Paperclip, MapPin } from 'lucide-react';
import { NotificationType } from './Notification';
import { v4 as uuidv4 } from 'uuid';
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';

interface ChatProps {
    searchId: number;
    setNotifications: React.Dispatch<
        React.SetStateAction<{ id: string; type: NotificationType; message: string; duration?: number }[]>
    >;
    isExpert: boolean;
}

const libraries = ['drawing', 'geometry'];

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

const Chat: React.FC<ChatProps> = ({ searchId, setNotifications, isExpert }) => {
    const { user } = useAuth();
    const { conversation, loading, error, newMessage, setNewMessage, sendMessage, isSending } = useChat(
        searchId,
        setNotifications
    );
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const lastMessageCount = useRef(conversation?.messages?.length || 0);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [location, setLocation] = useState<{ latitude: string; longitude: string } | null>(null);
    const [isMapModalOpen, setIsMapModalOpen] = useState(false);
    const [selectedMapLocation, setSelectedMapLocation] = useState(defaultCenter);
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: "__REDACTED_GOOGLE_API_KEY__",
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
            setLocation(null); // Reset location after sending
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

    if (!user || loading || !conversation || (user.id !== conversation.clientId && user.id !== conversation.expertId)) {
        return (
            <div className="flex items-center justify-center h-full text-gray-500">
                {loading ? 'Cargando chat...' : 'No tienes acceso a este chat.'}
            </div>
        );
    }

    const isClient = user.id === conversation.clientId;
    const chatWith = isClient ? 'Experto' : 'Cliente';

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-blue-600" />
                    Chatea con el {chatWith}
                </h3>
            </div>
            <div className="flex-1 overflow-y-auto mb-4 space-y-3 scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-blue-50 pr-2">
                {conversation.messages?.length === 0 && isExpert ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="bg-gradient-to-r from-blue-100 to-blue-50 rounded-xl p-4 shadow-sm max-w-md">
                            <Smile className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                            <p className="text-gray-700 text-sm font-medium">
                                ¡Bienvenido al chat! Estoy aquí para ayudarte con la búsqueda. Escribe un mensaje para comenzar.
                            </p>
                        </div>
                    </div>
                ) : conversation.messages?.length === 0 && !isExpert ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        <p className="text-sm">Aún no hay mensajes. Escribe algo para comenzar.</p>
                    </div>
                ) : (
                    conversation.messages?.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.senderId === user.id ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[70%] p-3 rounded-xl shadow-sm transition-all ${message.senderId === user.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'}`}
                            >
                                <p className="text-sm leading-relaxed">{message.content || 'Sin contenido'}</p>
                                {message.attachmentUrls && message.attachmentUrls.length > 0 && (
                                    <div className="mt-2">
                                        {message.attachmentUrls.map((url, index) => (
                                            <div key={index} className="mt-1">
                                                {url.endsWith('.mp4') ? (
                                                    <video src={url} controls className="max-w-full rounded-lg" style={{ maxHeight: '200px' }} />
                                                ) : (
                                                    <img src={url} alt="Attachment" className="max-w-full rounded-lg" style={{ maxHeight: '200px' }} />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {(message.locationLatitude || message.locationLongitude) && isLoaded && !loadError && (
                                    <div className="mt-2">
                                        <GoogleMap
                                            mapContainerStyle={{ width: '100%', height: '150px', borderRadius: '8px' }}
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
                                        <a
                                            href={`https://www.google.com/maps?q=${message.locationLatitude},${message.locationLongitude}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-500 underline text-sm mt-1 inline-block"
                                        >
                                            Ver en Google Maps
                                        </a>
                                    </div>
                                )}
                                <p className="text-xs mt-1 opacity-70">
                                    {message.sentAt
                                        ? new Date(message.sentAt).toLocaleString('es-ES', { timeStyle: 'short', dateStyle: 'short' })
                                        : 'Hora desconocida'}{' '}
                                    • {message.isRead ? 'Leído' : 'Enviado'}
                                </p>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className="sticky bottom-0 bg-gradient-to-t from-white to-transparent pt-2">
                <div className="flex items-center gap-2 mb-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Escribe un mensaje..."
                        className="flex-1 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors bg-white/80 backdrop-blur-sm"
                        onKeyPress={(e) => {
                            if (e.key === 'Enter' && (newMessage.trim() || selectedFiles.length > 0 || location) && !isSending) {
                                handleSendMessage();
                            }
                        }}
                        disabled={isSending}
                    />
                    <button
                        onClick={handleOpenMapModal}
                        className="p-3 rounded-xl bg-gray-100 hover:bg-gray-200"
                        title="Seleccionar ubicación"
                    >
                        <MapPin className="w-5 h-5 text-gray-600" />
                    </button>
                    <label className="p-3 rounded-xl bg-gray-100 hover:bg-gray-200 cursor-pointer">
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
                        className={`p-3 rounded-xl transition-colors ${isSending ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                        disabled={isSending}
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Map Modal */}
            {isMapModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-lg">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Seleccionar Ubicación</h3>
                        {isLoaded && !loadError ? (
                            <div className="relative h-[300px] mb-4">
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
                                <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-sm">
                                    <span className="text-sm text-gray-700">
                                        Haz clic para seleccionar una ubicación
                                    </span>
                                </div>
                                {selectedMapLocation && (
                                    <div className="absolute top-12 left-2 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-sm">
                                        <span className="text-sm text-gray-700 font-medium">
                                            {selectedMapLocation.lat.toFixed(4)}, {selectedMapLocation.lng.toFixed(4)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="h-[300px] flex items-center justify-center bg-gray-50">
                                {loadError ? (
                                    <span className="text-red-400">Error al cargar el mapa</span>
                                ) : (
                                    <span className="text-gray-500">Cargando mapa...</span>
                                )}
                            </div>
                        )}
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setIsMapModalOpen(false)}
                                className="px-4 py-2 bg-gray-200 rounded-xl text-gray-700 hover:bg-gray-300"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSelectLocation}
                                className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
                            >
                                Seleccionar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Chat;