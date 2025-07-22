import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { useApi } from './useApi';
import { API_CONFIG } from '../config/api';
import { getAuthToken } from '../lib/auth';
import { HubConnectionBuilder, HubConnection, LogLevel, HttpTransportType } from '@microsoft/signalr';

interface Message {
    id: number;
    conversationId: number;
    senderId: number;
    content: string;
    sentAt: string;
    isRead: boolean;
    sender?: { name: string; $id?: string; $ref?: string };
    senderName?: string;
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
                console.log('[13:46 CEST] Fetched conversation:', response);
                return {
                    ...response,
                    messages: response.messages.map(msg => ({
                        ...msg,
                        conversation: undefined
                    }))
                };
            } catch (err) {
                console.error('[13:46 CEST] Fetch error:', err);
                throw err;
            }
        },
        enabled: !!user,
        retry: (failureCount, err) => failureCount < 3 && !err.message.includes('401'),
    });

    const connectSignalR = useCallback(async () => {
        if (!user || !conversation?.id || connection?.state === 'Connected' || connection?.state === 'Connecting') {
            console.log('[13:46 CEST] Skipping SignalR connection:', {
                userExists: !!user,
                conversationId: conversation?.id,
                connectionState: connection?.state
            });
            return;
        }

        if (connection) {
            console.log('[13:46 CEST] Stopping existing SignalR connection');
            await connection.stop();
            setConnection(null);
        }

        const token = getAuthToken();
        if (!token) {
            console.error('[13:46 CEST] No token available for SignalR');
            return;
        }

        const transport = window.WebSocket ? HttpTransportType.WebSockets : HttpTransportType.ServerSentEvents;

        const conn = new HubConnectionBuilder()
            .withUrl(`${API_CONFIG.baseUrl}/chatHub?conversationId=${conversation.id}`, {
                accessTokenFactory: () => token,
                transport,
                withCredentials: true,
            })
            .configureLogging(LogLevel.Debug)
            .withAutomaticReconnect({
                nextRetryDelayInMilliseconds: (retryContext) => {
                    const delay = Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
                    console.log(`[13:46 CEST] Reconnect attempt ${retryContext.previousRetryCount + 1}, delay: ${delay}ms`);
                    return delay;
                },
            })
            .build();

        // Register handlers before starting
        conn.onclose((error) => {
            console.log('[13:46 CEST] SignalR connection closed:', error ? error.message : 'No error, attempting reconnect...');
            setConnection(null);
        });

        conn.onreconnected((connectionId) => {
            console.log('[13:46 CEST] SignalR reconnected, new Connection ID:', connectionId);
            if (conversation?.id && user?.id) {
                conn.invoke('JoinConversation', conversation.id, user.id).catch(err =>
                    console.error('[13:46 CEST] Failed to rejoin conversation:', err)
                );
            }
        });

        conn.on('ReceiveMessage', (message: any) => {
            console.log('[13:46 CEST] Received SignalR message (raw):', {
                message,
                conversationId: conversation?.id,
                userId: user?.id,
                connectionId: conn.connectionId
            });
            if (message && typeof message === 'object' && message.conversationId === conversation?.id) {
                const typedMessage: Message = {
                    id: message.id,
                    conversationId: message.conversationId,
                    senderId: message.senderId,
                    content: message.content,
                    sentAt: message.sentAt,
                    isRead: message.isRead,
                    sender: message.sender,
                    senderName: message.senderName
                };
                console.log('[13:46 CEST] Updating conversation state with new message:', typedMessage);
                queryClient.setQueryData(['conversation', searchId], (prev: Conversation | undefined) => {
                    if (!prev) {
                        console.log('[13:46 CEST] No previous conversation, creating new with message');
                        return { ...conversation, messages: [typedMessage] } as Conversation;
                    }
                    const updatedMessages = [
                        ...prev.messages.filter(m => m.id !== typedMessage.id),
                        { ...typedMessage, conversation: undefined }
                    ].sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
                    console.log('[13:46 CEST] Updated messages:', updatedMessages);
                    return {
                        ...prev,
                        messages: updatedMessages,
                    };
                });
                queryClient.invalidateQueries({ queryKey: ['conversation', searchId] });
            } else {
                console.log('[13:46 CEST] Message ignored: not for this conversation', {
                    receivedConversationId: message?.conversationId,
                    currentConversationId: conversation?.id
                });
            }
        });

        conn.on('MessageRead', (messageId: number) => {
            console.log(`[13:46 CEST] Message ${messageId} marked as read via SignalR`);
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

        try {
            await conn.start();
            console.log(`[13:46 CEST] SignalR connected for conversation ${conversation.id}, Connection ID: ${conn.connectionId}`);
            await conn.invoke('JoinConversation', conversation.id, user.id);
            console.log(`[13:46 CEST] Successfully joined conversation ${conversation.id} with user ${user.id}`);
            setConnection(conn);
        } catch (err) {
            console.error('[13:46 CEST] SignalR connection error:', err);
            setTimeout(() => connectSignalR(), 1000); // Retry on failure
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
            console.log('[13:46 CEST] Message sent successfully:', message);
            queryClient.setQueryData(['conversation', searchId], (prev: Conversation | undefined) => {
                if (!prev) return { ...conversation, messages: [message] } as Conversation;
                return {
                    ...prev,
                    messages: [...prev.messages.filter(m => m.id !== message.id), message].sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()),
                };
            });
            setNewMessage('');
        },
        onError: (error: any) => {
            console.error('[13:46 CEST] Failed to send message:', error.message);
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
            console.error('[13:46 CEST] Failed to mark message as read:', error.message);
        },
    });

    useEffect(() => {
        if (conversation?.id && user && !connection) {
            connectSignalR();
        }

        return () => {
            if (connection) {
                console.log('[13:46 CEST] Cleaning up SignalR connection');
                connection.stop();
                setConnection(null);
            }
        };
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