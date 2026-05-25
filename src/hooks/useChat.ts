import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { useApi } from './useApi';
import { API_CONFIG } from '../config/api';
import { showToast } from '../lib/toast';
import { getAuthToken } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import type { DBMessage, LegacyMessage, LegacyConversation, Deliverable } from '../types/chat.types';

interface Message {
    id: number;
    conversationId: number;
    senderId: number | null;
    content: string;
    sentAt: string;
    isRead: boolean;
    sender?: { name: string; $id?: string; $ref?: string };
    senderName: string;
    locationLatitude?: string | null;
    locationLongitude?: string | null;
    attachmentUrls?: string[];
}

interface Conversation {
    id: number;
    searchHireId: number | null;  // ✅ Ahora nullable (pre-contratación)
    searchServiceId: number | null;  // ✅ NUEVO: Para chat pre-contratación
    clientId: number | null;
    expertId: number | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    messages: Message[];
    $id?: string;
    $ref?: string;
}

export const useChat = (searchId: number | null = null, searchHireId?: number) => {
    const { user } = useAuth();
    const { fetchApi } = useApi();
    const queryClient = useQueryClient();
    const [newMessage, setNewMessage] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const channelRef = useRef<RealtimeChannel | null>(null);
    const failedMessageIds = useRef<Set<number>>(new Set());
    const lastDeliverableFetch = useRef<number>(0);
    const lastSearchHireId = useRef<number | null>(null);

    // Validate API_CONFIG.endpoints.chat.deliverable
    useEffect(() => {
        console.log('[Supabase Chat] Validating API_CONFIG.endpoints.chat.deliverable:', API_CONFIG.endpoints.chat.deliverable);
        if (!API_CONFIG.endpoints.chat.deliverable) {
            console.error('[Supabase Chat] API_CONFIG.endpoints.chat.deliverable is undefined');
            showToast('error', 'Error de configuración: Endpoint de entregables no definido. Contacta al soporte.', 5000);
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
            
            console.log(`[Supabase Chat] Fetching conversation for ${useSearchHireEndpoint ? 'searchHireId' : 'searchId'}:`, identifier);
            console.log(`[Supabase Chat] Endpoint:`, endpoint);
            try {
                // ✅ Obtener respuesta cruda (puede venir en PascalCase)
                const rawResponse = await fetchApi<any>(endpoint);
                console.log('[Supabase Chat] Fetched conversation (raw):', rawResponse);
                
                // ✅ Normalizar respuesta de PascalCase a camelCase
                const messagesArray = rawResponse.Messages ?? rawResponse.messages ?? [];
                const normalizedMessages = messagesArray.map((msg: any) => ({
                    id: msg.Id ?? msg.id,
                    conversationId: msg.ConversationId ?? msg.conversationId,
                    senderId: msg.SenderId ?? msg.senderId,
                    content: msg.Content ?? msg.content ?? '',
                    sentAt: msg.SentAt ?? msg.sentAt,
                    isRead: msg.IsRead ?? msg.isRead ?? false,
                    senderName: msg.SenderName ?? msg.senderName ?? '[Usuario eliminado]',
                    locationLatitude: msg.LocationLatitude ?? msg.locationLatitude ?? null,
                    locationLongitude: msg.LocationLongitude ?? msg.locationLongitude ?? null,
                    attachmentUrls: msg.AttachmentUrls ?? msg.attachmentUrls ?? [],
                }));
                
                const normalizedConversation: Conversation = {
                    id: rawResponse.Id ?? rawResponse.id,
                    searchHireId: rawResponse.SearchHireId ?? rawResponse.searchHireId ?? null,  // ✅ Ahora nullable
                    searchServiceId: rawResponse.SearchServiceId ?? rawResponse.searchServiceId ?? null,  // ✅ NUEVO
                    clientId: rawResponse.ClientId ?? rawResponse.clientId ?? null,
                    expertId: rawResponse.ExpertId ?? rawResponse.expertId ?? null,
                    isActive: rawResponse.IsActive ?? rawResponse.isActive ?? true,
                    createdAt: rawResponse.CreatedAt ?? rawResponse.createdAt,
                    updatedAt: rawResponse.UpdatedAt ?? rawResponse.updatedAt,
                    messages: normalizedMessages.map((msg) => ({
                        ...msg,
                        conversation: undefined,
                        attachmentUrls: msg.attachmentUrls || [],
                    })),
                };
                
                console.log('[Supabase Chat] Normalized conversation:', normalizedConversation);
                console.log('[Supabase Chat] Conversation searchHireId:', normalizedConversation.searchHireId);
                console.log('[Supabase Chat] Messages count:', normalizedConversation.messages.length);
                
                return normalizedConversation;
            } catch (err: any) {
                console.error('[Supabase Chat] Fetch conversation error:', err.message, err.response || err);
                if (err.message === 'Search hire not found') {
                    showToast('error', 'No se encontró la conversación para este servicio. Verifica el ID del servicio.', 5000);
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
            console.log('[Supabase Chat] Fetching deliverables for searchHireId:', conversation?.searchHireId);
            if (!conversation?.searchHireId) {
                console.error('[Supabase Chat] SearchHireId not available for fetching deliverables');
                throw new Error('SearchHireId not available');
            }
            if (!API_CONFIG.endpoints.chat.deliverable) {
                console.error('[Supabase Chat] Deliverable endpoint is undefined in API_CONFIG');
                throw new Error('Deliverable endpoint not configured');
            }
            const deliverableEndpoint = API_CONFIG.endpoints.chat.deliverable(conversation.searchHireId);
            console.log('[Supabase Chat] Deliverable endpoint:', deliverableEndpoint);
            try {
                const response = await fetchApi<{ message: string; deliverable?: Deliverable; deliverables?: any[] }>(deliverableEndpoint);
                console.log('[Supabase Chat] Raw API response for deliverables:', JSON.stringify(response));
                
                if (response.deliverables !== undefined) {
                    console.log('[Supabase Chat] API returned deliverables array format:', response.deliverables);
                    return {
                        searchHireId: conversation!.searchHireId,
                        deliverableUrls: Array.isArray(response.deliverables) ? 
                            response.deliverables.map(d => d.deliverableUrls || []).flat() : [],
                        createdAt: new Date().toISOString(),
                    };
                }
                
                if (response.deliverable) {
                    console.log('[Supabase Chat] API returned deliverable object format:', response.deliverable);
                    return {
                        searchHireId: response.deliverable.searchHireId,
                        deliverableUrls: Array.isArray(response.deliverable.deliverableUrls) ? response.deliverable.deliverableUrls : [],
                        createdAt: response.deliverable.createdAt,
                    };
                }
                
                console.log('[Supabase Chat] Unexpected API response format, returning empty deliverables');
                return {
                    searchHireId: conversation!.searchHireId,
                    deliverableUrls: [],
                    createdAt: new Date().toISOString(),
                };
            } catch (err: any) {
                console.error('[Supabase Chat] Error fetching deliverables:', err.message, err.response || err);
                if (err.response?.status === 404) {
                    console.log('[Supabase Chat] No deliverables found (404), returning empty array');
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
            console.log(`[Supabase Chat] Deliverables query retry attempt ${failureCount}, error:`, err.message);
            const noRetryConditions = [
                '401',
                'SearchHireId not available',
                'No deliverables found', 
                'Deliverable endpoint not configured'
            ];
            const shouldNotRetry = noRetryConditions.some(condition => err.message.includes(condition));
            return failureCount < 3 && !shouldNotRetry;
        },
        staleTime: 30000,
        gcTime: 5 * 60 * 1000,
    });

    // ==========================================
    // 🔄 SUPABASE REALTIME CONNECTION
    // ==========================================
    
    // Convertir mensaje de DB a formato de la aplicación
    const convertDbMessageToMessage = useCallback((dbMessage: any): Message => {
        // ✅ Normalizar senderId de PascalCase a camelCase
        const senderId = dbMessage.SenderId ?? dbMessage.senderId ?? null;
        
        console.log('[useChat] Converting DB message to Message:', {
            rawSenderId: dbMessage.SenderId ?? dbMessage.senderId,
            normalizedSenderId: senderId,
            userId: user?.id,
            messageId: dbMessage.Id ?? dbMessage.id,
            hasContent: !!dbMessage.Content || !!dbMessage.content
        });
        
        return {
            id: dbMessage.Id ?? dbMessage.id,
            conversationId: dbMessage.ConversationId ?? dbMessage.conversationId,
            senderId: senderId,
            content: dbMessage.Content ?? dbMessage.content ?? '',
            sentAt: dbMessage.SentAt ?? dbMessage.sentAt,
            isRead: dbMessage.IsRead ?? dbMessage.isRead ?? false,
            senderName: dbMessage.SenderName ?? dbMessage.senderName ?? '[Usuario]',
            locationLatitude: dbMessage.LocationLatitude ?? dbMessage.locationLatitude ?? null,
            locationLongitude: dbMessage.LocationLongitude ?? dbMessage.locationLongitude ?? null,
            attachmentUrls: dbMessage.AttachmentUrls ?? dbMessage.attachmentUrls ?? []
        };
    }, [user?.id]);

    // Conectar a Supabase Realtime
    const connectSupabase = useCallback(async () => {
        if (!user || !conversation?.id) {
            console.log('[Supabase Chat] Skipping Supabase connection:', {
                userExists: !!user,
                conversationId: conversation?.id,
            });
            return;
        }

        // Limpiar conexión anterior si existe
        if (channelRef.current) {
            console.log('[Supabase Chat] Removing existing channel');
            await supabase.removeChannel(channelRef.current);
            channelRef.current = null;
        }

        const channelName = `conversation:${conversation.id}`;
        console.log(`📡 [Supabase Chat] Conectando al canal ${channelName}`);

        const applyMessageToCache = (messageData: any, mode: 'add' | 'update') => {
            const msgConversationId = messageData.ConversationId ?? messageData.conversationId;
            if (msgConversationId !== conversation.id) return;

            const normalizedMsg = convertDbMessageToMessage(messageData);

            const updateQueryData = (queryKey: (string | number | undefined)[]) => {
                queryClient.setQueryData(queryKey, (prev: Conversation | undefined) => {
                    if (!prev) {
                        return conversation ? { ...conversation, messages: [normalizedMsg] } : undefined;
                    }
                    if (mode === 'add') {
                        if (prev.messages.some((m) => m.id === normalizedMsg.id)) return prev;
                        return {
                            ...prev,
                            messages: [...prev.messages, normalizedMsg].sort(
                                (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
                            ),
                        };
                    }
                    return {
                        ...prev,
                        messages: prev.messages.map((msg) =>
                            msg.id === normalizedMsg.id ? { ...msg, ...normalizedMsg } : msg
                        ),
                    };
                });
            };

            if (useSearchHireEndpoint && searchHireId) {
                updateQueryData(['conversation', 'searchHire', searchHireId]);
            }
            if (searchId) {
                updateQueryData(['conversation', searchId]);
            }

            if (mode === 'add') {
                setTimeout(() => {
                    const chatContainer = document.querySelector('[data-chat-messages]')?.parentElement as HTMLElement;
                    if (chatContainer) {
                        chatContainer.scrollTop = chatContainer.scrollHeight;
                    }
                }, 100);
            }
        };

        const channel = supabase
            .channel(channelName)
            .on(
                'broadcast',
                { event: 'new_message' },
                ({ payload }) => {
                    console.log('📩 [Supabase Chat] Mensaje recibido vía broadcast:', payload);
                    applyMessageToCache(payload, 'add');
                }
            )
            .on(
                'broadcast',
                { event: 'message_updated' },
                ({ payload }) => {
                    console.log('✏️ [Supabase Chat] Mensaje actualizado vía broadcast:', payload);
                    applyMessageToCache(payload, 'update');
                }
            )
            .subscribe((status) => {
                console.log(`📡 [Supabase Chat] Estado de suscripción: ${status}`);
                if (status === 'SUBSCRIBED') {
                    setIsConnected(true);
                    console.log('✅ [Supabase Chat] Conectado exitosamente');
                } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                    setIsConnected(false);
                    console.error('❌ [Supabase Chat] Error de conexión');
                    // Reintentar conexión después de 3 segundos
                    setTimeout(() => {
                        if (!channelRef.current || channelRef.current.state !== 'joined') {
                            connectSupabase();
                        }
                    }, 3000);
                }
            });

        channelRef.current = channel;
    }, [user?.id, conversation?.id, searchId, searchHireId, queryClient, convertDbMessageToMessage, useSearchHireEndpoint]);

    // Efecto para conectar a Supabase cuando hay conversación
    useEffect(() => {
        if (conversation?.id && user?.id) {
            console.log('[Supabase Chat] Initiating Supabase connection for conversation:', conversation.id);
            connectSupabase();
        }

        return () => {
            if (channelRef.current) {
                console.log('[Supabase Chat] Cleaning up Supabase connection');
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
                setIsConnected(false);
            }
        };
    }, [conversation?.id, user?.id, connectSupabase]);

    // ==========================================
    // MUTATIONS
    // ==========================================

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
                console.error('[Supabase Chat] Cannot send message: user or conversation not available', {
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
            console.log('[Supabase Chat] Sending message with FormData:', formDataEntries);
            try {
                const rawResponse = await fetchApi<any>(API_CONFIG.endpoints.chat.message, {
                    method: 'POST',
                    body: formData,
                });
                console.log('[Supabase Chat] Message sent, raw response:', rawResponse);
                
                // ✅ Normalizar respuesta de PascalCase a camelCase
                const normalizedMessage: Message = {
                    id: rawResponse.Id ?? rawResponse.id,
                    conversationId: rawResponse.ConversationId ?? rawResponse.conversationId,
                    senderId: rawResponse.SenderId ?? rawResponse.senderId ?? user?.id ?? null,
                    content: rawResponse.Content ?? rawResponse.content ?? '',
                    sentAt: rawResponse.SentAt ?? rawResponse.sentAt,
                    isRead: rawResponse.IsRead ?? rawResponse.isRead ?? false,
                    senderName: rawResponse.SenderName ?? rawResponse.senderName ?? user?.name ?? '[Usuario]',
                    locationLatitude: rawResponse.LocationLatitude ?? rawResponse.locationLatitude ?? null,
                    locationLongitude: rawResponse.LocationLongitude ?? rawResponse.locationLongitude ?? null,
                    attachmentUrls: rawResponse.AttachmentUrls ?? rawResponse.attachmentUrls ?? []
                };
                
                console.log('[Supabase Chat] Normalized message:', normalizedMessage);
                console.log('[Supabase Chat] Message senderId check:', {
                    rawSenderId: rawResponse.SenderId ?? rawResponse.senderId,
                    normalizedSenderId: normalizedMessage.senderId,
                    userId: user?.id,
                    match: String(normalizedMessage.senderId) === String(user?.id)
                });
                
                return { ...normalizedMessage, conversation: undefined };
            } catch (err: any) {
                console.error('[Supabase Chat] Message send error:', err.message, err.response || err);
                let errorMessage = err.message || 'Failed to send message';
                if (err.response?.status === 400) {
                    errorMessage = err.response.data?.message || 'Invalid request data';
                } else if (err.response?.status === 404) {
                    errorMessage = 'Conversación no encontrada. Verifica el ID del servicio.';
                }
                throw new Error(errorMessage);
            }
        },
        onSuccess: (message) => {
            console.log('[Supabase Chat] Message sent successfully:', message);
            
            // El mensaje llegará por Supabase Realtime, pero lo agregamos inmediatamente
            // para mejor UX (optimistic update)
            const updateQueryData = (queryKey: any[]) => {
                queryClient.setQueryData(queryKey, (prev: Conversation | undefined) => {
                    if (!prev && conversation) {
                        console.log('[Supabase Chat] No previous conversation, using current conversation');
                        return { ...conversation, messages: [message] };
                    }
                    if (!prev) {
                        console.warn('[Supabase Chat] No previous or current conversation, cannot update');
                        return undefined;
                    }
                    // Evitar duplicados
                    if (prev.messages.some(m => m.id === message.id)) {
                        return prev;
                    }
                    return {
                        ...prev,
                        messages: [...prev.messages, message].sort(
                            (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
                        ),
                    };
                });
            };
            
            if (useSearchHireEndpoint && searchHireId) {
                updateQueryData(['conversation', 'searchHire', searchHireId]);
            }
            if (searchId) {
                updateQueryData(['conversation', searchId]);
            }
            
            setNewMessage('');
            showToast('success', 'Mensaje enviado con éxito.', 3000);
            
            // Scroll al final
            setTimeout(() => {
                const chatContainer = document.querySelector('[data-chat-messages]')?.parentElement as HTMLElement;
                if (chatContainer) {
                    chatContainer.scrollTop = chatContainer.scrollHeight;
                }
            }, 100);
        },
        onError: (error: any, variables, context) => {
            console.error('[Supabase Chat] Failed to send message:', error.message, error, { variables, context });
            showToast('error', `Error al enviar el mensaje: ${error.message || 'Error desconocido'}`, 5000);
            if (error.message.includes('400') || error.message.includes('404')) {
                refetch();
            }
        },
    });

    const uploadDeliverableMutation = useMutation({
        mutationFn: async (files: File[]) => {
            console.log('[Supabase Chat] Initiating deliverable upload for searchHireId:', conversation?.searchHireId);
            if (!conversation?.searchHireId) {
                console.error('[Supabase Chat] Cannot upload deliverable: searchHireId not available', { conversation });
                throw new Error('SearchHireId not available');
            }
            if (!API_CONFIG.endpoints.chat.deliverable) {
                console.error('[Supabase Chat] Deliverable endpoint is undefined in API_CONFIG');
                throw new Error('Deliverable endpoint not configured');
            }
            const safeFiles = Array.isArray(files) ? files : [];
            if (safeFiles.length === 0) {
                console.error('[Supabase Chat] No files provided for deliverable upload');
                throw new Error('No files provided');
            }
            const formData = new FormData();
            safeFiles.forEach((file) => {
                formData.append('Files', file, file.name);
            });
            const deliverableEndpoint = API_CONFIG.endpoints.chat.deliverable(conversation.searchHireId);
            console.log(`[Supabase Chat] Uploading deliverable to: ${deliverableEndpoint}`);
            try {
                const response = await fetchApi<{ message: string; deliverable?: Deliverable; deliverables?: any[] }>(deliverableEndpoint, {
                    method: 'POST',
                    body: formData,
                });
                console.log('[Supabase Chat] Deliverable uploaded, response:', response);
                
                if (response.deliverable) {
                    return {
                        searchHireId: response.deliverable.searchHireId,
                        deliverableUrls: Array.isArray(response.deliverable.deliverableUrls) ? response.deliverable.deliverableUrls : [],
                        createdAt: response.deliverable.createdAt,
                    };
                }
                
                if (response.deliverables !== undefined) {
                    return {
                        searchHireId: conversation!.searchHireId,
                        deliverableUrls: Array.isArray(response.deliverables) ? 
                            response.deliverables.map(d => d.deliverableUrls || []).flat() : [],
                        createdAt: new Date().toISOString(),
                    };
                }
                
                throw new Error('Unexpected response format from upload');
            } catch (err: any) {
                console.error('[Supabase Chat] Deliverable upload error:', err.message, err.response || err);
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
            console.log('[Supabase Chat] Deliverable uploaded successfully:', deliverable);
            queryClient.invalidateQueries({ queryKey: ['deliverables', conversation?.searchHireId] });
            queryClient.invalidateQueries({ queryKey: ['searchDetailsComplete'] });
            queryClient.invalidateQueries({ queryKey: ['searchDetailsCompleteByHire'] });
            if (searchHireId) {
                queryClient.invalidateQueries({ queryKey: ['searchDetailsCompleteByHire', searchHireId] });
            }
            if (searchId) {
                queryClient.invalidateQueries({ queryKey: ['searchDetailsComplete', searchId] });
            }
            queryClient.setQueryData(['deliverables', conversation?.searchHireId], deliverable);
            lastDeliverableFetch.current = Date.now();
            showToast('success', 'Entregable subido con éxito.', 5000);
        },
        onError: (error: any) => {
            console.error('[Supabase Chat] Failed to upload deliverable:', error.message);
            showToast('error', `Error al subir el entregable: ${error.message || 'Error desconocido'}`, 5000);
        },
    });

    const markAsReadMutation = useMutation({
        mutationFn: (messageId: number) =>
            fetchApi<void>(API_CONFIG.endpoints.chat.markAsRead(messageId), {
                method: 'PUT',
            }),
        onSuccess: (_, messageId) => {
            console.log('[Supabase Chat] ✅ Successfully marked message as read:', messageId);
            const conversationQueryKey = useSearchHireEndpoint 
                ? ['conversation', 'searchHire', searchHireId]
                : ['conversation', searchId];
            queryClient.setQueryData(conversationQueryKey, (prev: Conversation | undefined) => {
                if (!prev) return prev;
                const message = prev.messages.find(m => m.id === messageId);
                if (message && message.isRead) {
                    return prev;
                }
                return {
                    ...prev,
                    messages: prev.messages.map((msg) =>
                        msg.id === messageId ? { ...msg, isRead: true } : msg
                    ),
                };
            });
            failedMessageIds.current.delete(messageId);
        },
        onError: (error: any, messageId) => {
            console.error('[Supabase Chat] Failed to mark message as read:', error.message, { messageId });
            failedMessageIds.current.add(messageId);
            showToast('error', 'No se pudo marcar algunos mensajes como leídos. Por favor, intenta de nuevo más tarde.', 5000);
        },
    });

    // ✅ Limpiar mensajes fallidos cuando cambia la conversación
    useEffect(() => {
        if (conversation?.id) {
            console.log('[Supabase Chat] Conversation changed, clearing failed message IDs');
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
            console.log('[Supabase Chat] Marking unread messages:', unreadMessageIds);
            unreadMessageIds.forEach((messageId) => {
                markAsReadMutation.mutate(messageId);
            });
        }
    }, [unreadMessageIds.length]);

    // Refetch deliverables when searchHireId changes
    useEffect(() => {
        if (conversation?.searchHireId && lastSearchHireId.current !== conversation.searchHireId) {
            console.log('[Supabase Chat] searchHireId changed, refetching deliverables');
            lastSearchHireId.current = conversation.searchHireId;
            lastDeliverableFetch.current = Date.now();
        }
    }, [conversation?.searchHireId]);

    // Debug deliverables cache
    useEffect(() => {
        console.log('[Supabase Chat] Current deliverables cache state:', {
            deliverables,
            searchHireId: conversation?.searchHireId,
            deliverableUrls: deliverables?.deliverableUrls,
            isLoading: deliverablesLoading,
            error: deliverablesError?.message,
        });
    }, [deliverables, deliverablesLoading, deliverablesError, conversation?.searchHireId]);

    const memoizedRefetchDeliverables = useCallback(() => {
        console.log('[Supabase Chat] Manual refetch of deliverables requested');
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
        // ✅ Nuevo: Estado de conexión Supabase
        isConnected,
    };
};
