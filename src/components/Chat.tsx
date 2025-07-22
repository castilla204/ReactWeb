import React, { useEffect, useRef } from 'react';
import { useChat } from '../hooks/useChat';
import { useAuth } from '../contexts/AuthContext';
import { Send, X } from 'lucide-react';
import { NotificationType } from './Notification';

interface ChatProps {
    searchId: number;
    setNotifications: React.Dispatch<
        React.SetStateAction<{ id: string; type: NotificationType; message: string; duration?: number }[]>
    >;
    isOpen: boolean;
    onClose: () => void;
}

const Chat: React.FC<ChatProps> = ({ searchId, setNotifications, isOpen, onClose }) => {
    const { user } = useAuth();
    const { conversation, loading, error, newMessage, setNewMessage, sendMessage, isSending } = useChat(searchId);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const lastMessageCount = useRef(conversation?.messages?.length || 0);

    useEffect(() => {
        console.log('Chat useEffect triggered:', { isOpen, messageCount: conversation?.messages?.length, lastMessageCount: lastMessageCount.current });
        if (isOpen && conversation?.messages && conversation.messages.length > lastMessageCount.current) {
            if (messagesEndRef.current) {
                console.log('Scrolling to bottom due to new message');
                messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
            }
            lastMessageCount.current = conversation.messages.length;
        }
    }, [isOpen, conversation?.messages?.length]);

    useEffect(() => {
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

    if (!user || loading || !conversation || (user.id !== conversation.clientId && user.id !== conversation.expertId)) {
        console.log('Chat not rendered:', { user: !!user, loading, conversationExists: !!conversation, isAuthorized: user && conversation ? user.id === conversation.clientId || user.id === conversation.expertId : false });
        return null;
    }

    if (!isOpen) {
        return null;
    }

    const isClient = user.id === conversation.clientId;
    const chatWith = isClient ? 'Cliente' : 'Experto';

    return (
        <div className="fixed bottom-4 right-4 w-[400px] bg-white rounded-xl shadow-lg p-6 border border-gray-200 max-h-[500px] flex flex-col z-50 transition-all duration-300 ease-in-out transform translate-y-0 opacity-100">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                    Chatea con el {chatWith}
                </h3>
                <button
                    onClick={onClose}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                    aria-label="Close chat"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto mb-4 space-y-4" style={{ scrollbarWidth: 'thin' }}>
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
                <div ref={messagesEndRef} />
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
                    onClick={() => {
                        if (newMessage.trim() && !isSending) {
                            sendMessage(newMessage);
                        }
                    }}
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