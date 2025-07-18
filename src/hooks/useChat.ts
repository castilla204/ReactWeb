import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { useApi } from './useApi';
import { API_CONFIG } from '../config/api';
import { getAuthToken } from '../lib/auth';
import { HubConnectionBuilder, HubConnection, LogLevel } from '@microsoft/signalr';

interface Message {
    id: number;
    conversationId: number;
    senderId: number;
    content: string;
    sentAt: string;
    isRead: boolean;
    sender?: { name: string; $id?: string; $ref?: string };
}

interface Conversation {
    id: number;
    searchHireId: number;
    clientId: number;
    expertId: number | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    messages: Message[];
    $id?: string;
    $ref?: string;
}

export const useChat = (searchId: number) => {
    const { user } = useAuth();
    const { fetchApi } = useApi();
    const queryClient = useQueryClient();
    const [newMessage, setNewMessage] = useState('');
    const [connection, setConnection] = useState<HubConnection | null>(null);

    const { data: conversation, isLoading: loading, error, refetch } = useQuery<Conversation, Error>({
        queryKey: ['conversation', searchId],
        queryFn: async () => {
            try {
                const response = await fetchApi<Conversation>(`${API_CONFIG.endpoints.chat.conversation}?searchId=${searchId}`);
                console.log('Fetched conversation:', response);
                return {
                    ...response,
                    messages: response.messages.map(msg => ({
                        ...msg,
                        conversation: undefined
                    }))
                };
            } catch (err) {
                console.error('Fetch error:', err);
                throw err;
            }
        },
        enabled: !!user,
        retry: (failureCount, err) => failureCount < 3 && !err.message.includes('401'),
    });

    const connectSignalR = useCallback(async () => {
        if (!user || !conversation?.id || connection) return;

        const token = getAuthToken();
        if (!token) {
            console.error('No token available for SignalR');
            return;
        }

        const conn = new HubConnectionBuilder()
            .withUrl(`${API_CONFIG.baseUrl}/chatHub`, {
                accessTokenFactory: () => token,
            })
            .configureLogging(LogLevel.Information)
            .withAutomaticReconnect({
                nextRetryDelayInMilliseconds: (retryContext) => {
                    if (retryContext.previousRetryCount < 3) return 1000 * (retryContext.previousRetryCount + 1);
                    return null;
                },
            })
            .build();

        conn.on('ReceiveMessage', (message: Message) => {
            console.log('Received SignalR message:', message);
            // Ensure the message is added to the correct conversation
            if (message.conversationId === conversation?.id) {
                queryClient.setQueryData(['conversation', searchId], (prev: Conversation | undefined) => {
                    if (!prev) return { ...conversation, messages: [message] } as Conversation;
                    return {
                        ...prev,
                        messages: [...prev.messages.filter(m => m.id !== message.id), { ...message, conversation: undefined }].sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()),
                    };
                });
            }
        });

        conn.on('MessageRead', (messageId: number) => {
            console.log(`Message ${messageId} marked as read via SignalR`);
            queryClient.setQueryData(['conversation', searchId], (prev: Conversation | undefined) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    messages: prev.messages.map((msg) =>
                        msg.id === messageId ? { ...msg, isRead: true, conversation: undefined } : msg
                    ),
                };
            });
        });

        conn.onclose(() => {
            console.log('SignalR connection closed, attempting to reconnect...');
            setConnection(null);
        });

        try {
            await conn.start();
            console.log(`SignalR connected for conversation ${conversation.id}`);
            await conn.invoke('JoinConversation', conversation.id, user.id);
            setConnection(conn);
        } catch (err) {
            console.error('SignalR connection error:', err);
        }
    }, [user, conversation?.id, connection, searchId, queryClient]);

    const sendMessageMutation = useMutation({
        mutationFn: async (content: string) => {
            if (!user || !conversation?.id) throw new Error('User or conversation not available');
            const response = await fetchApi<Message>(API_CONFIG.endpoints.chat.message, {
                method: 'POST',
                body: JSON.stringify({
                    conversationId: conversation.id,
                    content,
                }),
            });
            return { ...response, conversation: undefined };
        },
        onSuccess: (message) => {
            console.log('Message sent successfully:', message);
            queryClient.setQueryData(['conversation', searchId], (prev: Conversation | undefined) => {
                if (!prev) return { ...conversation, messages: [message] } as Conversation;
                return {
                    ...prev,
                    messages: [...prev.messages.filter(m => m.id !== message.id), message].sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()),
                };
            });
            setNewMessage(''); // Ensure state is cleared
        },
        onError: (error: any) => {
            console.error('Failed to send message:', error.message);
            if (error.message.includes('JsonException')) {
                refetch();
            }
        },
    });

    const markAsReadMutation = useMutation({
        mutationFn: (messageId: number) =>
            fetchApi<void>(API_CONFIG.endpoints.chat.markAsRead(messageId), {
                method: 'PUT',
            }),
        onSuccess: (_, messageId) => {
            queryClient.setQueryData(['conversation', searchId], (prev: Conversation | undefined) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    messages: prev.messages.map((msg) =>
                        msg.id === messageId ? { ...msg, isRead: true, conversation: undefined } : msg
                    ),
                };
            });
        },
        onError: (error: any) => {
            console.error('Failed to mark message as read:', error.message);
        },
    });

    useEffect(() => {
        if (conversation?.id && user && !connection) {
            connectSignalR();
        }
    }, [conversation?.id, user, connection, connectSignalR]);

    useEffect(() => {
        if (conversation?.messages && user) {
            const unreadMessages = conversation.messages.filter(
                (msg) => !msg.isRead && msg.senderId !== user.id
            );
            unreadMessages.forEach((msg) => markAsReadMutation.mutate(msg.id));
        }
    }, [conversation?.messages, user, markAsReadMutation]);

    return {
        conversation,
        loading,
        error: error?.message || null,
        newMessage,
        setNewMessage,
        sendMessage: sendMessageMutation.mutate,
        isSending: sendMessageMutation.isPending,
    };
};