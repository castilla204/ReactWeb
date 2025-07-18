// src/hooks/useChat.ts
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

    const { data: conversation, isLoading: loading, error } = useQuery<Conversation, Error>({
        queryKey: ['conversation', searchId],
        queryFn: async () => {
            const response = await fetchApi<Conversation>(`${API_CONFIG.endpoints.chat.conversation}?searchId=${searchId}`);
            console.log('Fetched conversation:', response);
            return response;
        },
        enabled: !!user,
        retry: (failureCount, err) => {
            console.log('Query error:', err.message);
            return failureCount < 3 && !err.message.includes('401');
        },
    });

    const connectSignalR = useCallback(async () => {
        if (!user || !conversation?.id) return;

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
            .withAutomaticReconnect()
            .build();

        conn.on('ReceiveMessage', (message: Message) => {
            console.log('Received SignalR message:', message);
            queryClient.setQueryData(['conversation', searchId], (prev: Conversation | undefined) =>
                prev
                    ? {
                        ...prev,
                        messages: [...prev.messages.filter(m => m.id !== message.id), message],
                    }
                    : prev
            );
        });

        conn.on('MessageRead', (messageId: number) => {
            console.log(`Message ${messageId} marked as read via SignalR`);
            queryClient.setQueryData(['conversation', searchId], (prev: Conversation | undefined) =>
                prev
                    ? {
                        ...prev,
                        messages: prev.messages.map((msg) =>
                            msg.id === messageId ? { ...msg, isRead: true } : msg
                        ),
                    }
                    : prev
            );
        });

        conn.on('JoinConversation', (conversationId: number, userId: number) => {
            console.log(`User ${userId} joined conversation ${conversationId}`);
        });

        try {
            await conn.start();
            console.log(`SignalR connected for conversation ${conversation.id}`);
            await conn.invoke('JoinConversation', conversation.id, user.id);
            setConnection(conn);
        } catch (err) {
            console.error('SignalR connection error:', err);
        }
    }, [conversation?.id, user, searchId, queryClient]);

    const sendMessageMutation = useMutation({
        mutationFn: (content: string) => {
            if (!user || !conversation?.id) throw new Error('User or conversation not available');
            return fetchApi<Message>(API_CONFIG.endpoints.chat.message, {
                method: 'POST',
                body: JSON.stringify({
                    conversationId: conversation.id,
                    content,
                }),
            });
        },
        onSuccess: (message) => {
            console.log('Message sent successfully:', message);
            queryClient.setQueryData(['conversation', searchId], (prev: Conversation | undefined) =>
                prev
                    ? {
                        ...prev,
                        messages: [...prev.messages.filter(m => m.id !== message.id), message],
                    }
                    : prev
            );
            setNewMessage('');
            queryClient.invalidateQueries({ queryKey: ['conversation', searchId] });
        },
        onError: (error: any) => {
            console.error('Failed to send message:', error.message);
        },
    });

    const markAsReadMutation = useMutation({
        mutationFn: (messageId: number) =>
            fetchApi<void>(API_CONFIG.endpoints.chat.markAsRead(messageId), {
                method: 'PUT',
            }),
        onSuccess: (_, messageId) => {
            console.log(`Message ${messageId} marked as read`);
            queryClient.setQueryData(['conversation', searchId], (prev: Conversation | undefined) =>
                prev
                    ? {
                        ...prev,
                        messages: prev.messages.map((msg) =>
                            msg.id === messageId ? { ...msg, isRead: true } : msg
                        ),
                    }
                    : prev
            );
        },
        onError: (error: any) => {
            console.error('Failed to mark message as read:', error.message);
        },
    });

    useEffect(() => {
        if (conversation?.id && user) {
            connectSignalR();
        }

        return () => {
            if (connection) {
                connection.stop();
                console.log('SignalR connection stopped');
            }
        };
    }, [conversation?.id, connectSignalR, user]);

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