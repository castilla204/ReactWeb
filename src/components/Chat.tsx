// src/components/Chat.tsx
import React from 'react';
import { useChat } from '../hooks/useChat';
import { useAuth } from '../contexts/AuthContext';
import { Send, Loader2 } from 'lucide-react';
import { NotificationType } from './Notification';

interface ChatProps {
    searchId: number;
    setNotifications: React.Dispatch<
        React.SetStateAction<{ id: string; type: NotificationType; message: string; duration?: number }[]>
    >;
}

const Chat: React.FC<ChatProps> = ({ searchId, setNotifications }) => {
    const { user } = useAuth();
    const { conversation, loading, error, newMessage, setNewMessage, sendMessage, isSending } = useChat(searchId);

    React.useEffect(() => {
        if (error) {
            setNotifications((prev) => [
                ...prev.filter((n) => !n.id.startsWith('chat-error-')),
                {
                    id: `chat-error-${Date.now()}`,
                    type: 'error' as NotificationType,
                    message: error.includes('401') ? 'Sesión expirada. Por favor, inicia sesión de nuevo.' : error,
                    duration: 5000,
                },
            ]);
        }
    }, [error, setNotifications]);

    if (!user) {
        return (
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <p className="text-red-500">Debes estar autenticado para ver el chat.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!conversation) {
        return (
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <p className="text-red-500">No se encontró una conversación para esta búsqueda.</p>
            </div>
        );
    }

    const isClient = user.id === conversation.clientId;
    const isExpert = user.id === conversation.expertId;

    if (!isClient && !isExpert) {
        return (
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <p className="text-red-500">No estás autorizado para ver esta conversación.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 max-h-[500px] flex flex-col">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Chat con {isClient ? 'Experto' : 'Cliente'}
            </h3>
            <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                {conversation.messages?.map((message) => (
                    <div
                        key={message.id}
                        className={`flex ${message.senderId === user.id ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[70%] p-3 rounded-lg ${message.senderId === user.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'}`}
                        >
                            <p className="text-sm">{message.content || 'Sin contenido'}</p>
                            <p className="text-xs mt-1 opacity-70">
                                {message.sentAt ? new Date(message.sentAt).toLocaleString('es-ES', { timeStyle: 'short', dateStyle: 'short' }) : 'Hora desconocida'} •{' '}
                                {message.isRead ? 'Leído' : 'Enviado'}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex items-center gap-2">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Escribe un mensaje..."
                    className="flex-1 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
                    onKeyPress={(e) => {
                        if (e.key === 'Enter' && newMessage.trim() && !isSending) {
                            sendMessage(newMessage);
                        }
                    }}
                    disabled={isSending}
                />
                <button
                    onClick={() => newMessage.trim() && !isSending && sendMessage(newMessage)}
                    className={`p-2 rounded-lg transition-colors ${isSending ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                    disabled={isSending}
                >
                    <Send className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export default Chat;