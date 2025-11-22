import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { useApi } from './useApi';
import { API_CONFIG } from '../config/api';
import { HubConnectionBuilder, HubConnection, LogLevel, HttpTransportType } from '@microsoft/signalr';
import { showToast } from '../lib/toast';
import { getAuthToken } from '../lib/auth';

interface Message {
    id: number;
    conversationId: number;
    senderId: number | null; // ✅ Nullable si usuario borró cuenta
    content: string;
    sentAt: string;
    isRead: boolean;
    sender?: { name: string; $id?: string; $ref?: string };
    senderName: string; // ✅ "[Usuario eliminado]" si senderId es null
    locationLatitude?: string | null;
    locationLongitude?: string | null;
    attachmentUrls?: string[]; // ✅ URLs de archivos adjuntos
}

interface Conversation {
    id: number;
    searchHireId: number;
    clientId: number | null; // ✅ Nullable si cliente borró cuenta
    expertId: number | null; // ✅ Nullable si experto borró cuenta
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    messages: Message[]; // ✅ Todos los mensajes incluidos
    $id?: string;
    $ref?: string;
}

interface Deliverable {
    searchHireId: number;
    deliverableUrls: string[];
    createdAt: string;
}

export const useChat = (searchId: number | null = null, searchHireId?: number) => {
    const { user } = useAuth();
    const { fetchApi } = useApi();
    const queryClient = useQueryClient();
    const [newMessage, setNewMessage] = useState('');
    const [connection, setConnection] = useState<HubConnection | null>(null);
    const connectionRef = useRef<HubConnection | null>(null); // ✅ Ref para evitar dependencias problemáticas
    const failedMessageIds = useRef<Set<number>>(new Set());
    const lastDeliverableFetch = useRef<number>(0);
    const lastSearchHireId = useRef<number | null>(null);
    
    // ✅ Sincronizar ref con state
    useEffect(() => {
        connectionRef.current = connection;
    }, [connection]);

    // Validate API_CONFIG.endpoints.chat.deliverable
    useEffect(() => {
        console.log('[10:45 CEST] Validating API_CONFIG.endpoints.chat.deliverable:', API_CONFIG.endpoints.chat.deliverable);
        if (!API_CONFIG.endpoints.chat.deliverable) {
            console.error('[10:45 CEST] API_CONFIG.endpoints.chat.deliverable is undefined');
            showToast('error', 'Error de configuración: Endpoint de entregables no definido. Contacta al soporte.', 5000);
            // Removed setNotifications call
            /*
                    type: 'error' as NotificationType,
                    message: 'Error de configuraci�n: Endpoint de entregables no definido. Contacta al soporte.',
                    duration: 5000,
                },
            ]);
            */
        }
    }, []);

    // ✅ Usar searchHireId si está disponible, sino usar searchId
    const useSearchHireEndpoint = !!searchHireId;
    const identifier = searchHireId || searchId;
    
    // Fetch conversation
    const { data: conversation, isLoading: loading, error, refetch } = useQuery<Conversation, Error>({
        queryKey: useSearchHireEndpoint 
            ? ['conversation', 'searchHire', searchHireId]
            : ['conversation', searchId],
        queryFn: async () => {
            const endpoint = useSearchHireEndpoint
                ? API_CONFIG.endpoints.chat.conversationBySearchHire(searchHireId!)
                : `${API_CONFIG.endpoints.chat.conversation}?searchId=${searchId}`;
            
            console.log(`[useChat] Fetching conversation for ${useSearchHireEndpoint ? 'searchHireId' : 'searchId'}:`, identifier);
            console.log(`[useChat] Endpoint:`, endpoint);
            try {
                const response = await fetchApi<Conversation>(endpoint);
                console.log('[10:45 CEST] Fetched conversation:', response);
                console.log('[10:45 CEST] Conversation searchHireId:', response.searchHireId);
                return {
                    ...response,
                    messages: response.messages.map((msg) => ({
                        ...msg,
                        conversation: undefined,
                        attachmentUrls: msg.attachmentUrls || [],
                    })),
                };
            } catch (err: any) {
                console.error('[10:45 CEST] Fetch conversation error:', err.message, err.response || err);
                if (err.message === 'Search hire not found') {
                    showToast('error', 'No se encontró la conversación para este servicio. Verifica el ID del servicio.', 5000);
                    /*
                    setNotifications((prev) => [
                        ...prev,
                        {
                            id: `conversation-error-${uuidv4()}`,
                            type: 'error' as NotificationType,
                            message: 'No se encontr� la conversaci�n para este servicio. Verifica el ID del servicio.',
                            duration: 5000,
                        },
                    ]);
                    */
                }
                throw err;
            }
        },
        enabled: !!user && (!!searchHireId || !!searchId),
        retry: (failureCount, err) => failureCount < 3 && !err.message.includes('401') && !err.message.includes('Search hire not found'),
    });

    // Fetch deliverables
    const { data: deliverables, refetch: refetchDeliverables, isLoading: deliverablesLoading, error: deliverablesError } = useQuery<Deliverable, Error>({
        queryKey: ['deliverables', conversation?.searchHireId],
        queryFn: async () => {
            console.log('[10:45 CEST] Fetching deliverables for searchHireId:', conversation?.searchHireId);
            if (!conversation?.searchHireId) {
                console.error('[10:45 CEST] SearchHireId not available for fetching deliverables');
                throw new Error('SearchHireId not available');
            }
            if (!API_CONFIG.endpoints.chat.deliverable) {
                console.error('[10:45 CEST] Deliverable endpoint is undefined in API_CONFIG');
                throw new Error('Deliverable endpoint not configured');
            }
            const deliverableEndpoint = API_CONFIG.endpoints.chat.deliverable(conversation.searchHireId);
            console.log('[10:45 CEST] Deliverable endpoint:', deliverableEndpoint);
            try {
                const response = await fetchApi<{ message: string; deliverable?: Deliverable; deliverables?: any[] }>(deliverableEndpoint);
                console.log('[10:45 CEST] Raw API response for deliverables:', JSON.stringify(response));
                
                // Handle case when API returns { message, deliverables: [] } (no deliverables found)
                if (response.deliverables !== undefined) {
                    console.log('[10:45 CEST] API returned deliverables array format:', response.deliverables);
                    return {
                        searchHireId: conversation!.searchHireId,
                        deliverableUrls: Array.isArray(response.deliverables) ? 
                            response.deliverables.map(d => d.deliverableUrls || []).flat() : [],
                        createdAt: new Date().toISOString(),
                    };
                }
                
                // Handle case when API returns { message, deliverable: {...} } (deliverables found)
                if (response.deliverable) {
                    console.log('[10:45 CEST] API returned deliverable object format:', response.deliverable);
                    return {
                        searchHireId: response.deliverable.searchHireId,
                        deliverableUrls: Array.isArray(response.deliverable.deliverableUrls) ? response.deliverable.deliverableUrls : [],
                        createdAt: response.deliverable.createdAt,
                    };
                }
                
                // Fallback - return empty deliverables
                console.log('[10:45 CEST] Unexpected API response format, returning empty deliverables');
                return {
                    searchHireId: conversation!.searchHireId,
                    deliverableUrls: [],
                    createdAt: new Date().toISOString(),
                };
            } catch (err: any) {
                console.error('[10:45 CEST] Error fetching deliverables:', err.message, err.response || err);
                if (err.response?.status === 404) {
                    console.log('[10:45 CEST] No deliverables found (404), returning empty array');
                    return { 
                        searchHireId: conversation!.searchHireId, 
                        deliverableUrls: [], 
                        createdAt: new Date().toISOString() 
                    };
                }
                throw err;
            }
        },
        enabled: !!conversation?.searchHireId && !!API_CONFIG.endpoints.chat.deliverable,
        retry: (failureCount, err) => {
            console.log(`[10:45 CEST] Deliverables query retry attempt ${failureCount}, error:`, err.message);
            // Don't retry for specific cases that are not actual errors
            const noRetryConditions = [
                '401',
                'SearchHireId not available',
                'No deliverables found', 
                'Deliverable endpoint not configured'
            ];
            const shouldNotRetry = noRetryConditions.some(condition => err.message.includes(condition));
            return failureCount < 3 && !shouldNotRetry;
        },
        staleTime: 30000, // 30 seconds
        gcTime: 5 * 60 * 1000, // 5 minutes
    });

    // SignalR connection
    const connectSignalR = useCallback(async () => {
        if (!user || !conversation?.id || connection?.state === 'Connected' || connection?.state === 'Connecting') {
            console.log('[10:45 CEST] Skipping SignalR connection:', {
                userExists: !!user,
                conversationId: conversation?.id,
                connectionState: connection?.state,
            });
            return;
        }

        if (connection) {
            console.log('[10:45 CEST] Stopping existing SignalR connection');
            if (conversation?.id) {
                try {
                    await connection.invoke('LeaveConversation', conversation.id);
                } catch (err) {
                    console.warn('[10:45 CEST] Failed to leave previous conversation before reconnecting:', err);
                }
            }
            await connection.stop();
            setConnection(null);
        }

        const token = getAuthToken();
        if (!token) {
            console.error('[10:45 CEST] No token available for SignalR');
            showToast('error', 'No se pudo conectar al chat en tiempo real. Verifica tu sesión.', 5000);
            /*
            setNotifications((prev) => [
                ...prev,
                {
                    id: `signalr-error-${uuidv4()}`,
                    type: 'error' as NotificationType,
                    message: 'No se pudo conectar al chat en tiempo real. Verifica tu sesi�n.',
                    duration: 5000,
                },
            ]);
            */
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
                    console.log(`[10:45 CEST] Reconnect attempt ${retryContext.previousRetryCount + 1}, delay: ${delay}ms`);
                    return delay;
                },
            })
            .build();

        conn.onclose((error) => {
            console.log('[10:45 CEST] SignalR connection closed:', error ? error.message : 'No error, attempting reconnect...');
            setConnection(null);
        });

        conn.onreconnected((connectionId) => {
            console.log('[10:45 CEST] SignalR reconnected, new Connection ID:', connectionId);
            if (conversation?.id && user?.id) {
                conn.invoke('JoinConversation', conversation.id, user.id).catch((err) =>
                    console.error('[10:45 CEST] Failed to rejoin conversation:', err)
                );
            }
        });

        conn.on('ReceiveMessage', (message: any) => {
            console.log('[10:45 CEST] 📨 Received SignalR message (raw):', {
                message,
                conversationId: conversation?.id,
                userId: user?.id,
                connectionId: conn.connectionId,
            });
            if (message && typeof message === 'object' && message.conversationId === conversation?.id) {
                const typedMessage: Message = {
                    id: message.id,
                    conversationId: message.conversationId,
                    senderId: message.senderId,
                    content: message.content || '',
                    sentAt: message.sentAt,
                    isRead: message.isRead,
                    sender: message.sender,
                    senderName: message.senderName,
                    locationLatitude: message.locationLatitude,
                    locationLongitude: message.locationLongitude,
                    attachmentUrls: Array.isArray(message.attachmentUrls) ? message.attachmentUrls : [],
                };
                console.log('[10:45 CEST] Updating conversation state with new message:', typedMessage);
                
                // Update both query keys (searchId and searchHireId) to ensure consistency
                const updateQueryData = (queryKey: any[]) => {
                    queryClient.setQueryData(queryKey, (prev: Conversation | undefined) => {
                        if (!prev) {
                            console.log('[10:45 CEST] No previous conversation, creating new with message');
                            return conversation ? { ...conversation, messages: [typedMessage] } : undefined;
                        }
                        const updatedMessages = [
                            ...prev.messages.filter((m) => m.id !== typedMessage.id),
                            { ...typedMessage, conversation: undefined },
                        ].sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
                        console.log('[10:45 CEST] Updated messages:', updatedMessages);
                        return {
                            ...prev,
                            messages: updatedMessages,
                        };
                    });
                };
                
                // Update both possible query keys
                if (useSearchHireEndpoint && searchHireId) {
                    updateQueryData(['conversation', 'searchHire', searchHireId]);
                }
                if (searchId) {
                    updateQueryData(['conversation', searchId]);
                }
                
                // Invalidate queries to trigger re-render and scroll
                queryClient.invalidateQueries({ queryKey: ['conversation'] });
                
                // Trigger scroll to bottom after message is added
                setTimeout(() => {
                    const chatContainer = document.querySelector('[data-chat-messages]')?.parentElement as HTMLElement;
                    if (chatContainer) {
                        chatContainer.scrollTop = chatContainer.scrollHeight;
                    }
                    // Also try the messages container directly
                    const messagesContainer = document.querySelector('[data-chat-messages]') as HTMLElement;
                    if (messagesContainer) {
                        messagesContainer.scrollTop = messagesContainer.scrollHeight;
                    }
                }, 100);
            } else {
                console.log('[10:45 CEST] Message ignored: not for this conversation', {
                    receivedConversationId: message?.conversationId,
                    currentConversationId: conversation?.id,
                });
            }
        });

        conn.on('MessageRead', (messageId: number) => {
            console.log(`[10:45 CEST] ✅ Message ${messageId} marked as read via SignalR`);
            // ✅ Usar la queryKey correcta según si se usa searchHireId o searchId
            const useSearchHire = !!searchHireId;
            const conversationQueryKey = useSearchHire 
                ? ['conversation', 'searchHire', searchHireId]
                : ['conversation', searchId];
            queryClient.setQueryData(conversationQueryKey, (prev: Conversation | undefined) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    messages: prev.messages.map((msg) =>
                        msg.id === messageId ? { ...msg, isRead: true, conversation: undefined } : msg
                    ),
                };
            });
        });

        conn.on('ReceiveDeliverable', (deliverable: Deliverable) => {
            console.log('[10:45 CEST] Received SignalR deliverable:', deliverable);
            console.log('[10:45 CEST] Updating deliverables cache for searchHireId:', deliverable.searchHireId);
            queryClient.setQueryData(['deliverables', deliverable.searchHireId], {
                ...deliverable,
                deliverableUrls: Array.isArray(deliverable.deliverableUrls) ? deliverable.deliverableUrls : [],
            });
            // No necesitamos refetch manual, el cache se actualiza automáticamente
            lastDeliverableFetch.current = Date.now();
        });

        try {
            await conn.start();
            console.log(`[10:45 CEST] SignalR connected for conversation ${conversation.id}, Connection ID: ${conn.connectionId}`);
            await conn.invoke('JoinConversation', conversation.id, user.id);
            console.log(`[10:45 CEST] Successfully joined conversation ${conversation.id} with user ${user.id}`);
            setConnection(conn);
            connectionRef.current = conn;
        } catch (err) {
            console.error('[10:45 CEST] SignalR connection error:', err);
            showToast('error', 'Error al conectar con el chat en tiempo real. Reintentando...', 5000);
            setTimeout(() => connectSignalR(), 1000);
        }
        // ✅ Removido connection de dependencias - usar ref en su lugar
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id, conversation?.id, searchId, searchHireId, queryClient]);

    const sendMessageMutation = useMutation({
        mutationFn: async ({
            content,
            location,
            files,
        }: {
            content: string;
            location: { latitude: string; longitude: string } | null;
            files: File[];
        }) => {
            if (!user || !conversation?.id) {
                console.error('[10:45 CEST] Cannot send message: user or conversation not available', {
                    user,
                    conversationId: conversation?.id,
                });
                throw new Error('User or conversation not available');
            }
            const formData = new FormData();
            formData.append('ConversationId', conversation.id.toString());
            if (content.trim()) {
                formData.append('Content', content.trim());
            }
            if (location) {
                formData.append('LocationLatitude', location.latitude);
                formData.append('LocationLongitude', location.longitude);
            }
            const safeFiles = Array.isArray(files) ? files : [];
            if (safeFiles.length === 0 && !content.trim() && !location) {
                throw new Error('No content, files, or location provided');
            }
            safeFiles.forEach((file) => {
                formData.append('Attachments', file, file.name);
            });
            const formDataEntries: { [key: string]: any } = {};
            formData.forEach((value, key) => {
                formDataEntries[key] = value instanceof File ? { name: value.name, type: value.type, size: value.size } : value;
            });
            console.log('[10:45 CEST] Sending message with FormData:', formDataEntries);
            try {
                const response = await fetchApi<Message>(API_CONFIG.endpoints.chat.message, {
                    method: 'POST',
                    body: formData,
                });
                console.log('[10:45 CEST] Message sent, response:', response);
                return { ...response, conversation: undefined, attachmentUrls: Array.isArray(response.attachmentUrls) ? response.attachmentUrls : [] };
            } catch (err: any) {
                console.error('[10:45 CEST] Message send error:', err.message, err.response || err);
                let errorMessage = err.message || 'Failed to send message';
                if (err.response?.status === 400) {
                    errorMessage = err.response.data?.message || 'Invalid request data';
                } else if (err.response?.status === 404) {
                    errorMessage = 'Conversaci�n no encontrada. Verifica el ID del servicio.';
                }
                throw new Error(errorMessage);
            }
        },
        onSuccess: (message) => {
            console.log('[10:45 CEST] Message sent successfully:', message);
            
            const updateQueryData = (queryKey: any[]) => {
                queryClient.setQueryData(queryKey, (prev: Conversation | undefined) => {
                    if (!prev && conversation) {
                        console.log('[10:45 CEST] No previous conversation, using current conversation');
                        return { ...conversation, messages: [message] };
                    }
                    if (!prev) {
                        console.warn('[10:45 CEST] No previous or current conversation, cannot update');
                        return undefined;
                    }
                    return {
                        ...prev,
                        messages: [...prev.messages.filter((m) => m.id !== message.id), message].sort(
                            (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
                        ),
                    };
                });
            };
            
            // Update both possible query keys
            if (useSearchHireEndpoint && searchHireId) {
                updateQueryData(['conversation', 'searchHire', searchHireId]);
            }
            if (searchId) {
                updateQueryData(['conversation', searchId]);
            }
            
            setNewMessage('');
            showToast('success', 'Mensaje enviado con éxito.', 3000);
            
            // Trigger scroll to bottom after message is sent
            setTimeout(() => {
                const chatContainer = document.querySelector('[data-chat-messages]')?.parentElement as HTMLElement;
                if (chatContainer) {
                    chatContainer.scrollTop = chatContainer.scrollHeight;
                }
                // Also try the messages container directly
                const messagesContainer = document.querySelector('[data-chat-messages]') as HTMLElement;
                if (messagesContainer) {
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;
                }
            }, 100);
            /*
            setNotifications((prev) => [
                ...prev,
                {
                    id: `message-success-${uuidv4()}`,
                    type: 'success' as NotificationType,
                    message: 'Mensaje enviado con �xito.',
                    duration: 3000,
                },
            ]);
            */
        },
        onError: (error: any, variables, context) => {
            console.error('[10:45 CEST] Failed to send message:', error.message, error, { variables, context });
            showToast('error', `Error al enviar el mensaje: ${error.message || 'Error desconocido'}`, 5000);
            if (error.message.includes('400') || error.message.includes('404')) {
                refetch();
            }
        },
    });

    const uploadDeliverableMutation = useMutation({
        mutationFn: async (files: File[]) => {
            console.log('[10:45 CEST] Initiating deliverable upload for searchHireId:', conversation?.searchHireId);
            if (!conversation?.searchHireId) {
                console.error('[10:45 CEST] Cannot upload deliverable: searchHireId not available', { conversation });
                throw new Error('SearchHireId not available');
            }
            if (!API_CONFIG.endpoints.chat.deliverable) {
                console.error('[10:45 CEST] Deliverable endpoint is undefined in API_CONFIG');
                throw new Error('Deliverable endpoint not configured');
            }
            const safeFiles = Array.isArray(files) ? files : [];
            if (safeFiles.length === 0) {
                console.error('[10:45 CEST] No files provided for deliverable upload');
                throw new Error('No files provided');
            }
            const formData = new FormData();
            safeFiles.forEach((file) => {
                formData.append('Files', file, file.name);
            });
            const formDataEntries: { [key: string]: any } = {};
            formData.forEach((value, key) => {
                formDataEntries[key] = value instanceof File ? { name: value.name, type: value.type, size: value.size } : value;
            });
            const deliverableEndpoint = API_CONFIG.endpoints.chat.deliverable(conversation.searchHireId);
            console.log(`[10:45 CEST] Uploading deliverable to: ${deliverableEndpoint}`, {
                SearchHireId: conversation.searchHireId,
                FormData: formDataEntries,
            });
            try {
                const response = await fetchApi<{ message: string; deliverable?: Deliverable; deliverables?: any[] }>(deliverableEndpoint, {
                    method: 'POST',
                    body: formData,
                });
                console.log('[10:45 CEST] Deliverable uploaded, response:', response);
                
                // Handle case when API returns { message, deliverable: {...} } (upload successful)
                if (response.deliverable) {
                    console.log('[10:45 CEST] Upload successful, deliverable object format:', response.deliverable);
                    return {
                        searchHireId: response.deliverable.searchHireId,
                        deliverableUrls: Array.isArray(response.deliverable.deliverableUrls) ? response.deliverable.deliverableUrls : [],
                        createdAt: response.deliverable.createdAt,
                    };
                }
                
                // Handle case when API returns { message, deliverables: [...] } (upload successful, different format)
                if (response.deliverables !== undefined) {
                    console.log('[10:45 CEST] Upload successful, deliverables array format:', response.deliverables);
                    return {
                        searchHireId: conversation!.searchHireId,
                        deliverableUrls: Array.isArray(response.deliverables) ? 
                            response.deliverables.map(d => d.deliverableUrls || []).flat() : [],
                        createdAt: new Date().toISOString(),
                    };
                }
                
                // Fallback
                console.log('[10:45 CEST] Unexpected upload response format');
                throw new Error('Unexpected response format from upload');
            } catch (err: any) {
                console.error('[10:45 CEST] Deliverable upload error:', err.message, err.response || err);
                let errorMessage = err.message || 'Failed to upload deliverable';
                if (err.response?.status === 400) {
                    errorMessage = err.response.data?.message || 'Invalid request data';
                } else if (err.response?.status === 404) {
                    errorMessage = 'SearchHire no encontrado. Verifica el ID del servicio.';
                }
                throw new Error(errorMessage);
            }
        },
        onSuccess: (deliverable) => {
            console.log('[10:45 CEST] Deliverable uploaded successfully:', deliverable);
            console.log('[10:45 CEST] Updating deliverables cache with URLs:', deliverable.deliverableUrls);
            
            // Invalidar múltiples queries relacionadas para asegurar que se actualice la UI
            queryClient.invalidateQueries({ queryKey: ['deliverables', conversation?.searchHireId] });
            queryClient.invalidateQueries({ queryKey: ['searchDetails', searchId] });
            queryClient.invalidateQueries({ queryKey: ['searchDetailsOptimized', searchId] });
            
            // Actualizar el cache directamente para respuesta inmediata
            queryClient.setQueryData(['deliverables', conversation?.searchHireId, API_CONFIG.endpoints.chat.deliverable], deliverable);
            lastDeliverableFetch.current = Date.now();
            showToast('success', 'Entregable subido con éxito.', 5000);
        },
        onError: (error: any) => {
            console.error('[10:45 CEST] Failed to upload deliverable:', error.message);
            showToast('error', `Error al subir el entregable: ${error.message || 'Error desconocido'}`, 5000);
        },
    });

    const markAsReadMutation = useMutation({
        mutationFn: (messageId: number) =>
            fetchApi<void>(API_CONFIG.endpoints.chat.markAsRead(messageId), {
                method: 'PUT',
            }),
        onSuccess: (_, messageId) => {
            console.log('[10:45 CEST] ✅ Successfully marked message as read:', messageId);
            // ✅ Usar la queryKey correcta según si se usa searchHireId o searchId
            const conversationQueryKey = useSearchHireEndpoint 
                ? ['conversation', 'searchHire', searchHireId]
                : ['conversation', searchId];
            queryClient.setQueryData(conversationQueryKey, (prev: Conversation | undefined) => {
                if (!prev) return prev;
                // ✅ Solo actualizar si el mensaje realmente no está marcado como leído
                const message = prev.messages.find(m => m.id === messageId);
                if (message && message.isRead) {
                    console.log('[10:45 CEST] Message already marked as read, skipping update:', messageId);
                    return prev;
                }
                return {
                    ...prev,
                    messages: prev.messages.map((msg) =>
                        msg.id === messageId ? { ...msg, isRead: true, conversation: undefined } : msg
                    ),
                };
            });
            failedMessageIds.current.delete(messageId);
        },
        onError: (error: any, messageId) => {
            console.error('[10:45 CEST] Failed to mark message as read:', error.message, { messageId });
            failedMessageIds.current.add(messageId);
            showToast('error', 'No se pudo marcar algunos mensajes como leídos. Por favor, intenta de nuevo más tarde.', 5000);
            /*
            setNotifications((prev) => {
                const exists = prev.some((n) => n.id === `mark-read-error-${messageId}`);
                if (exists) return prev;
                return [
                    ...prev,
                    {
                        id: `mark-read-error-${messageId}`,
                        type: 'error' as NotificationType,
                        message: 'No se pudo marcar algunos mensajes como le�dos. Por favor, intenta de nuevo m�s tarde.',
                        duration: 5000,
                    },
                ];
            });
            */
        },
    });

    // Trigger SignalR connection
    useEffect(() => {
        const currentConnection = connectionRef.current;
        const shouldConnect = conversation?.id && user?.id && !currentConnection;
        
        if (shouldConnect) {
            console.log('[10:45 CEST] Initiating SignalR connection for conversation:', conversation.id);
            connectSignalR();
        }

        return () => {
            const cleanupConnection = connectionRef.current;
            if (cleanupConnection) {
                console.log('[10:45 CEST] Cleaning up SignalR connection');
                const currentConversationId = conversation?.id;
                const state = cleanupConnection.state;
                
                // ✅ Verificar que la conexión esté en un estado válido antes de intentar limpiarla
                if (state === 'Connected' || state === 'Connecting') {
                    if (currentConversationId) {
                        // Usar Promise.race para evitar esperar indefinidamente si la conexión está cerrando
                        Promise.race([
                            cleanupConnection.invoke('LeaveConversation', currentConversationId),
                            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 1000))
                        ]).catch((err) => {
                            // Ignorar errores si la conexión ya está cerrada
                            if (err.message !== 'Invocation canceled due to the underlying connection being closed') {
                                console.warn('[10:45 CEST] Failed to leave conversation gracefully:', err);
                            }
                        });
                    }
                    // Detener la conexión sin esperar
                    cleanupConnection.stop().catch((err) => {
                        // Ignorar errores si ya está cerrada
                        if (!err.message?.includes('connection being closed')) {
                            console.warn('[10:45 CEST] Error stopping connection:', err);
                        }
                    });
                }
                setConnection(null);
                connectionRef.current = null;
            }
        };
        // ✅ CRÍTICO: Removido connection?.state de dependencias - causaba re-renders infinitos
        // Solo depender de conversation?.id y user?.id que son estables
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [conversation?.id, user?.id]);

    // ✅ Limpiar mensajes fallidos cuando cambia la conversación
    useEffect(() => {
        if (conversation?.id) {
            console.log('[10:45 CEST] Conversation changed, clearing failed message IDs');
            failedMessageIds.current.clear();
        }
    }, [conversation?.id]);

    // Mark unread messages
    const unreadMessageIds = conversation?.messages
        ?.filter(
            (msg) => 
                !msg.isRead && 
                msg.senderId !== user?.id && 
                !failedMessageIds.current.has(msg.id)
        )
        .map(msg => msg.id) || [];

    useEffect(() => {
        if (unreadMessageIds.length > 0) {
            console.log('[10:45 CEST] Marking unread messages:', unreadMessageIds);
            unreadMessageIds.forEach((messageId) => {
                markAsReadMutation.mutate(messageId);
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [unreadMessageIds.length]);

    // Refetch deliverables only when searchHireId changes (but not on every render)
    useEffect(() => {
        if (conversation?.searchHireId && lastSearchHireId.current !== conversation.searchHireId) {
            console.log('[10:45 CEST] searchHireId changed, refetching deliverables for searchHireId:', conversation.searchHireId);
            lastSearchHireId.current = conversation.searchHireId;
            lastDeliverableFetch.current = Date.now();
            // La query se refetch automáticamente cuando cambia la queryKey
        }
    }, [conversation?.searchHireId]);

    // Debug deliverables cache
    useEffect(() => {
        console.log('[10:45 CEST] Current deliverables cache state:', {
            deliverables,
            searchHireId: conversation?.searchHireId,
            deliverableUrls: deliverables?.deliverableUrls,
            isLoading: deliverablesLoading,
            error: deliverablesError?.message,
        });
    }, [deliverables, deliverablesLoading, deliverablesError, conversation?.searchHireId]);

    // Memoize refetchDeliverables to prevent unnecessary re-renders
    const memoizedRefetchDeliverables = useCallback(() => {
        console.log('[10:45 CEST] Manual refetch of deliverables requested');
        return refetchDeliverables();
    }, [refetchDeliverables]);

    return {
        conversation,
        loading: loading || deliverablesLoading,
        error: error?.message || deliverablesError?.message || null,
        newMessage,
        setNewMessage,
        sendMessage: sendMessageMutation.mutate,
        isSending: sendMessageMutation.isPending,
        deliverables,
        deliverablesQuery: { 
            isLoading: deliverablesLoading, 
            isError: !!deliverablesError, 
            error: deliverablesError,
            data: deliverables 
        },
        uploadDeliverable: uploadDeliverableMutation.mutate,
        refetchDeliverables: memoizedRefetchDeliverables,
        isUploadingDeliverable: uploadDeliverableMutation.isPending,
    };
};