import { useEffect, useRef } from 'react';
import { useChat } from '../hooks/useChat';
import { useAuth } from '../contexts/AuthContext';
import { Send, Smile, MessageCircle } from 'lucide-react';
import { NotificationType } from './Notification';

interface ChatProps {
    searchId: number;
    setNotifications: React.Dispatch<React.SetStateAction<{ id: string; type: NotificationType; message: string; duration?: number }[]>>;
    isExpert: boolean;
}

const Chat: React.FC<ChatProps> = ({ searchId, setNotifications, isExpert }) => {
    const { user } = useAuth();
    const { conversation, loading, error, newMessage, setNewMessage, sendMessage, isSending } = useChat(searchId);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const lastMessageCount = useRef(conversation?.messages?.length || 0);

    // Auto-scroll to the latest message when new messages are added
    useEffect(() => {
        if (conversation?.messages && conversation.messages.length > lastMessageCount.current) {
            if (messagesEndRef.current) {
                messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
            }
            lastMessageCount.current = conversation.messages.length;
        }
    }, [conversation?.messages?.length]);

    // Handle chat-related errors (e.g., 401 unauthorized)
    useEffect(() => {
        if (error) {
            setNotifications((prev) => [
                ...prev.filter((n) => !n.id.startsWith('chat-error-')),
                {
                    id: `chat-error-${Date.now()}`,
                    type: 'error',
                    message: error.includes('401') ? 'Sesión expirada. Por favor, inicia sesión de nuevo.' : error,
                    duration: 5000,
                },
            ]);
        }
    }, [error, setNotifications]);

    // Check if the user is authorized to view the chat
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
                {/* Welcome message: Only shown to experts when there are no messages */}
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
                    /* Empty state for clients: No welcome message, just an empty chat */
                    <div className="flex items-center justify-center h-full text-gray-500">
                        <p className="text-sm">Aún no hay mensajes. Escribe algo para comenzar.</p>
                    </div>
                ) : (
                    /* Render messages for both clients and experts when messages exist */
                    conversation.messages?.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.senderId === user.id ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[70%] p-3 rounded-xl shadow-sm transition-all ${message.senderId === user.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
                                    }`}
                            >
                                <p className="text-sm leading-relaxed">{message.content || 'Sin contenido'}</p>
                                <p className="text-xs mt-1 opacity-70">
                                    {message.sentAt ? new Date(message.sentAt).toLocaleString('es-ES', { timeStyle: 'short', dateStyle: 'short' }) : 'Hora desconocida'} •{' '}
                                    {message.isRead ? 'Leído' : 'Enviado'}
                                </p>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className="sticky bottom-0 bg-gradient-to-t from-white to-transparent pt-2">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Escribe un mensaje..."
                        className="flex-1 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors bg-white/80 backdrop-blur-sm"
                        onKeyPress={(e) => {
                            if (e.key === 'Enter' && newMessage.trim() && !isSending) {
                                sendMessage(newMessage);
                            }
                        }}
                        disabled={isSending}
                    />
                    <button
                        onClick={() => {
                            if (newMessage.trim() && !isSending) {
                                sendMessage(newMessage);
                            }
                        }}
                        className={`p-3 rounded-xl transition-colors ${isSending ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                        disabled={isSending}
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Chat;