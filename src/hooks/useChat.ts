import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { useApi } from './useApi';
import { API_CONFIG } from '../config/api';
import { showToast } from '../lib/toast';
import { getSupabaseClient } from '../lib/supabase';
import { isAdmin } from '../utils/admin';
import { getUserId, normalizeSenderId } from '../utils/userId';
import { RealtimeChannel } from '@supabase/supabase-js';
import type { DBMessage, LegacyMessage, LegacyConversation, Deliverable, PresenceState } from '../types/chat.types';

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

function readDeliverableUrls(item: unknown): string[] {
    if (!item || typeof item !== 'object') return [];
    const raw = item as Record<string, unknown>;
    const urls = raw.DeliverableUrls ?? raw.deliverableUrls;
    return Array.isArray(urls) ? (urls as string[]) : [];
}

function normalizeDeliverableFromApi(raw: unknown, fallbackSearchHireId: number): Deliverable {
    const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
    return {
        searchHireId: Number(o.SearchHireId ?? o.searchHireId ?? fallbackSearchHireId),
        deliverableUrls: readDeliverableUrls(o),
        createdAt: String(o.CreatedAt ?? o.createdAt ?? new Date().toISOString()),
    };
}

export const useChat = (searchId: number | null = null, searchHireId?: number) => {
    const { user } = useAuth();
    // El usuario puede venir con `id` o `Id` (backend). Normalizamos a número una vez.
    const currentUserId = getUserId(user as { id?: number; Id?: number });
    const userIsAdmin = isAdmin(
        (user as { email?: string; Email?: string })?.email ??
            (user as { Email?: string })?.Email
    );
    const { fetchApi } = useApi();
    const queryClient = useQueryClient();
    const [newMessage, setNewMessage] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [isReconnecting, setIsReconnecting] = useState(false);
    const [typingUserIds, setTypingUserIds] = useState<number[]>([]);
    const [onlineUserIds, setOnlineUserIds] = useState<number[]>([]);
    const [lastSeenByUserId, setLastSeenByUserId] = useState<Record<number, string>>({});
    const channelRef = useRef<RealtimeChannel | null>(null);
    const pendingChannelRef = useRef<RealtimeChannel | null>(null);
    const isTearingDownRef = useRef(false);
    const failedMessageIds = useRef<Set<number>>(new Set());
    const markedReadIdsRef = useRef<Set<number>>(new Set());
    const lastDeliverableFetch = useRef<number>(0);
    const lastSearchHireId = useRef<number | null>(null);
    const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isConnectedRef = useRef(false);
    const subscribedConversationIdRef = useRef<number | null>(null);
    const typingClearTimeoutsRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
    const typingNotifyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastTypingSentRef = useRef(false);
    const refetchConversationRef = useRef<() => void>(() => undefined);
    const refetchDeliverablesRef = useRef<() => void>(() => undefined);

    useEffect(() => {
        isConnectedRef.current = isConnected;
    }, [isConnected]);

    useEffect(() => {
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
            
            try {
                const rawResponse = await fetchApi<any>(endpoint);
                
                // ✅ Normalizar respuesta de PascalCase a camelCase
                const messagesArray = rawResponse.Messages ?? rawResponse.messages ?? [];
                const normalizedMessages = messagesArray.map((msg: any) => ({
                    id: msg.Id ?? msg.id,
                    conversationId: msg.ConversationId ?? msg.conversationId,
                    senderId: normalizeSenderId(msg.SenderId ?? msg.senderId),
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
        refetchInterval: () => (isConnectedRef.current ? false : 5000),
    });

    refetchConversationRef.current = refetch;

    // Fetch deliverables
    const { data: deliverables, refetch: refetchDeliverables, isLoading: deliverablesLoading, error: deliverablesError } = useQuery<Deliverable, Error>({
        queryKey: ['deliverables', conversation?.searchHireId],
        queryFn: async () => {
            if (!conversation?.searchHireId) {
                console.error('[Supabase Chat] SearchHireId not available for fetching deliverables');
                throw new Error('SearchHireId not available');
            }
            if (!API_CONFIG.endpoints.chat.deliverable) {
                console.error('[Supabase Chat] Deliverable endpoint is undefined in API_CONFIG');
                throw new Error('Deliverable endpoint not configured');
            }
            const deliverableEndpoint = API_CONFIG.endpoints.chat.deliverable(conversation.searchHireId);
            try {
                const response = await fetchApi<{ message: string; deliverable?: Deliverable; deliverables?: any[] }>(deliverableEndpoint);
                
                if (response.deliverables !== undefined) {
                    const list = Array.isArray(response.deliverables) ? response.deliverables : [];
                    return {
                        searchHireId: conversation!.searchHireId,
                        deliverableUrls: list.flatMap((d) => readDeliverableUrls(d)),
                        createdAt: new Date().toISOString(),
                    };
                }
                
                if (response.deliverable) {
                    return normalizeDeliverableFromApi(
                        response.deliverable,
                        conversation!.searchHireId
                    );
                }
                
                return {
                    searchHireId: conversation!.searchHireId,
                    deliverableUrls: [],
                    createdAt: new Date().toISOString(),
                };
            } catch (err: any) {
                console.error('[Supabase Chat] Error fetching deliverables:', err.message, err.response || err);
                if (err.response?.status === 404) {
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

    refetchDeliverablesRef.current = refetchDeliverables;

    // ==========================================
    // 🔄 SUPABASE REALTIME CONNECTION
    // ==========================================
    
    // Convertir mensaje de DB a formato de la aplicación
    const convertDbMessageToMessage = useCallback((dbMessage: any): Message => {
        // ✅ Normalizar senderId de PascalCase a camelCase
        return {
            id: dbMessage.Id ?? dbMessage.id,
            conversationId: dbMessage.ConversationId ?? dbMessage.conversationId,
            senderId: normalizeSenderId(dbMessage.SenderId ?? dbMessage.senderId),
            content: dbMessage.Content ?? dbMessage.content ?? '',
            sentAt: dbMessage.SentAt ?? dbMessage.sentAt,
            isRead: dbMessage.IsRead ?? dbMessage.isRead ?? false,
            senderName: dbMessage.SenderName ?? dbMessage.senderName ?? '[Usuario]',
            locationLatitude: dbMessage.LocationLatitude ?? dbMessage.locationLatitude ?? null,
            locationLongitude: dbMessage.LocationLongitude ?? dbMessage.locationLongitude ?? null,
            attachmentUrls: dbMessage.AttachmentUrls ?? dbMessage.attachmentUrls ?? []
        };
    }, []);

    const patchConversationCache = useCallback(
        (updater: (prev: Conversation) => Conversation) => {
            const keys: (string | number | undefined)[][] = [];
            if (useSearchHireEndpoint && searchHireId) {
                keys.push(['conversation', 'searchHire', searchHireId]);
            }
            if (searchId) {
                keys.push(['conversation', searchId]);
            }
            keys.forEach((queryKey) => {
                queryClient.setQueryData(queryKey, (prev: Conversation | undefined) => {
                    if (!prev) return prev;
                    return updater(prev);
                });
            });
        },
        [queryClient, searchHireId, searchId, useSearchHireEndpoint]
    );

    const scrollChatToBottom = useCallback(() => {
        requestAnimationFrame(() => {
            const chatContainer = document.querySelector('[data-chat-messages]') as HTMLElement | null;
            if (chatContainer) {
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }
        });
    }, []);

    const applyMessageToCache = useCallback(
        (messageData: any, mode: 'add' | 'update') => {
            if (!conversation?.id) return;
            const msgConversationId = messageData.ConversationId ?? messageData.conversationId;
            if (msgConversationId != null && msgConversationId !== conversation.id) return;

            const normalizedMsg = convertDbMessageToMessage(messageData);

            patchConversationCache((prev) => {
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

            if (mode === 'add') {
                scrollChatToBottom();
            }
        },
        [conversation?.id, convertDbMessageToMessage, patchConversationCache, scrollChatToBottom]
    );

    const applyMessageReadToCache = useCallback(
        (payload: { messageId?: number; MessageId?: number; conversationId?: number; ConversationId?: number }) => {
            const messageId = payload.messageId ?? payload.MessageId;
            const convId = payload.conversationId ?? payload.ConversationId;
            if (!messageId || (convId != null && conversation?.id != null && convId !== conversation.id)) {
                return;
            }
            patchConversationCache((prev) => ({
                ...prev,
                messages: prev.messages.map((msg) =>
                    msg.id === messageId ? { ...msg, isRead: true } : msg
                ),
            }));
        },
        [conversation?.id, patchConversationCache]
    );

    const applyMessageToCacheRef = useRef(applyMessageToCache);
    applyMessageToCacheRef.current = applyMessageToCache;
    const applyMessageReadToCacheRef = useRef(applyMessageReadToCache);
    applyMessageReadToCacheRef.current = applyMessageReadToCache;

    // Realtime: broadcast con anon key del proyecto Supabase activo (sin JWT .NET)
    useEffect(() => {
        const conversationId = conversation?.id;
        if (!conversationId || currentUserId <= 0) {
            return;
        }

        let cancelled = false;
        let retryCount = 0;
        const maxRetries = 8;
        const client = getSupabaseClient();
        const channelName = `conversation:${conversationId}`;

        const teardownChannel = async (ch: RealtimeChannel | null) => {
            if (!ch) return;
            isTearingDownRef.current = true;
            try {
                await client.removeChannel(ch);
            } finally {
                isTearingDownRef.current = false;
            }
        };

        const scheduleRetry = () => {
            if (cancelled || retryCount >= maxRetries) {
                setIsReconnecting(false);
                return;
            }
            retryCount += 1;
            setIsReconnecting(true);
            const delay = Math.min(2000 * retryCount, 15000);
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
            }
            retryTimeoutRef.current = setTimeout(() => {
                if (!cancelled) {
                    void subscribe();
                }
            }, delay);
        };

        const subscribe = async () => {
            if (cancelled) return;

            const existing = pendingChannelRef.current ?? channelRef.current;
            await teardownChannel(existing);
            pendingChannelRef.current = null;
            channelRef.current = null;
            subscribedConversationIdRef.current = null;

            const syncPresenceFromChannel = (ch: RealtimeChannel) => {
                const state = ch.presenceState();
                const users: number[] = [];
                Object.values(state).forEach((presences) => {
                    (presences as PresenceState[]).forEach((presence) => {
                        const uid = Number(presence.user_id);
                        if (uid > 0 && !users.includes(uid)) {
                            users.push(uid);
                        }
                    });
                });
                setOnlineUserIds(users);
            };

            const channel = client
                .channel(channelName, {
                    config: { presence: { key: String(currentUserId) } },
                })
                .on('presence', { event: 'sync' }, () => {
                    syncPresenceFromChannel(channel);
                })
                .on('presence', { event: 'leave' }, ({ leftPresences }) => {
                    (leftPresences as PresenceState[]).forEach((presence) => {
                        const uid = Number(presence.user_id);
                        if (!uid || uid === currentUserId) return;
                        setLastSeenByUserId((prev) => ({
                            ...prev,
                            [uid]: new Date().toISOString(),
                        }));
                        setOnlineUserIds((prev) => prev.filter((id) => Number(id) !== uid));
                    });
                })
                .on('broadcast', { event: 'new_message' }, ({ payload }) => {
                    applyMessageToCacheRef.current(payload, 'add');
                })
                .on('broadcast', { event: 'message_read' }, ({ payload }) => {
                    applyMessageReadToCacheRef.current(
                        payload as { messageId?: number; MessageId?: number }
                    );
                })
                .on('broadcast', { event: 'message_updated' }, ({ payload }) => {
                    applyMessageToCacheRef.current(payload, 'update');
                })
                .on('broadcast', { event: 'deliverable_uploaded' }, () => {
                    void refetchDeliverablesRef.current();
                })
                .on('broadcast', { event: 'typing' }, ({ payload }) => {
                    const p = payload as {
                        userId?: number | string;
                        UserId?: number | string;
                        isTyping?: boolean;
                        IsTyping?: boolean;
                    };
                    const typingUserId = Number(p.userId ?? p.UserId ?? 0);
                    const isTyping = p.isTyping ?? p.IsTyping ?? false;
                    if (!typingUserId || typingUserId === currentUserId) return;

                    const existingTimeout = typingClearTimeoutsRef.current.get(typingUserId);
                    if (existingTimeout) clearTimeout(existingTimeout);

                    if (isTyping) {
                        setTypingUserIds((prev) =>
                            prev.some((id) => Number(id) === typingUserId)
                                ? prev
                                : [...prev, typingUserId]
                        );
                        const timeout = setTimeout(() => {
                            setTypingUserIds((prev) =>
                                prev.filter((id) => Number(id) !== typingUserId)
                            );
                            typingClearTimeoutsRef.current.delete(typingUserId);
                        }, 4000);
                        typingClearTimeoutsRef.current.set(typingUserId, timeout);
                    } else {
                        setTypingUserIds((prev) =>
                            prev.filter((id) => Number(id) !== typingUserId)
                        );
                    }
                })
                .subscribe(async (status) => {
                    if (cancelled) return;

                if (status === 'SUBSCRIBED') {
                    setIsConnected(true);
                        setIsReconnecting(false);
                        retryCount = 0;
                        channelRef.current = channel;
                        pendingChannelRef.current = null;
                        subscribedConversationIdRef.current = conversationId;
                        try {
                            await channel.track({
                                user_id: currentUserId,
                                online_at: new Date().toISOString(),
                            });
                            syncPresenceFromChannel(channel);
                        } catch (e) {
                            console.error('[Supabase Chat] Error registrando presencia:', e);
                        }
                        void refetchConversationRef.current();
                    } else if (
                        (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') &&
                        !isTearingDownRef.current
                    ) {
                        console.error(`[Supabase Chat] ${channelName} → ${status}`);
                        setIsConnected(false);
                        channelRef.current = null;
                        pendingChannelRef.current = null;
                        subscribedConversationIdRef.current = null;
                        scheduleRetry();
                    } else if (status === 'CLOSED' && !cancelled && !isTearingDownRef.current) {
                        setIsConnected(false);
                        isConnectedRef.current = false;
                        scheduleRetry();
                    }
                });

            pendingChannelRef.current = channel;
        };

        void subscribe();

        return () => {
            cancelled = true;
            subscribedConversationIdRef.current = null;

            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
                retryTimeoutRef.current = null;
            }

            typingClearTimeoutsRef.current.forEach((t) => clearTimeout(t));
            typingClearTimeoutsRef.current.clear();

            const ch = pendingChannelRef.current ?? channelRef.current;
            pendingChannelRef.current = null;
                channelRef.current = null;
            if (ch) {
                void ch.untrack().finally(() => teardownChannel(ch));
            }
            setIsConnected(false);
            setIsReconnecting(false);
            setTypingUserIds([]);
            setOnlineUserIds([]);
        };
    }, [conversation?.id, currentUserId]);

    const notifyTyping = useCallback(
        (isTyping: boolean) => {
            if (!conversation?.id) return;

            if (typingNotifyTimeoutRef.current) {
                clearTimeout(typingNotifyTimeoutRef.current);
                typingNotifyTimeoutRef.current = null;
            }

            const send = () => {
                fetchApi<void>(API_CONFIG.endpoints.chat.typing, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        conversationId: conversation.id,
                        isTyping,
                    }),
                }).catch(() => undefined);
            };

            if (isTyping) {
                if (!lastTypingSentRef.current) {
                    lastTypingSentRef.current = true;
                    send();
                }
                typingNotifyTimeoutRef.current = setTimeout(() => {
                    lastTypingSentRef.current = false;
                    fetchApi<void>(API_CONFIG.endpoints.chat.typing, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            conversationId: conversation.id,
                            isTyping: false,
                        }),
                    }).catch(() => undefined);
                }, 2000);
            } else if (lastTypingSentRef.current) {
                lastTypingSentRef.current = false;
                send();
            }
        },
        [conversation?.id, fetchApi]
    );

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
            try {
                const rawResponse = await fetchApi<any>(API_CONFIG.endpoints.chat.message, {
                    method: 'POST',
                    body: formData,
                });
                
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
            // El mensaje llegará por Supabase Realtime, pero lo agregamos inmediatamente
            // para mejor UX (optimistic update)
            const updateQueryData = (queryKey: any[]) => {
                queryClient.setQueryData(queryKey, (prev: Conversation | undefined) => {
                    if (!prev && conversation) {
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
            
            scrollChatToBottom();
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
            try {
                const response = await fetchApi<{ message: string; deliverable?: Deliverable; deliverables?: any[] }>(deliverableEndpoint, {
                    method: 'POST',
                    body: formData,
                });
                if (response.deliverable) {
                    return normalizeDeliverableFromApi(
                        response.deliverable,
                        conversation!.searchHireId
                    );
                }
                
                if (response.deliverables !== undefined) {
                    const list = Array.isArray(response.deliverables) ? response.deliverables : [];
                    return {
                        searchHireId: conversation!.searchHireId,
                        deliverableUrls: list.flatMap((d) => readDeliverableUrls(d)),
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
            patchConversationCache((prev) => ({
                    ...prev,
                    messages: prev.messages.map((msg) =>
                        msg.id === messageId ? { ...msg, isRead: true } : msg
                    ),
            }));
            failedMessageIds.current.delete(messageId);
        },
        onError: (error: any, messageId) => {
            console.error('[Supabase Chat] Failed to mark message as read:', error.message, { messageId });
            markedReadIdsRef.current.delete(messageId);
            failedMessageIds.current.add(messageId);
            showToast('error', 'No se pudo marcar algunos mensajes como leídos. Por favor, intenta de nuevo más tarde.', 5000);
        },
    });

    // ✅ Limpiar mensajes fallidos cuando cambia la conversación
    useEffect(() => {
        if (conversation?.id) {
            failedMessageIds.current.clear();
            markedReadIdsRef.current.clear();
        }
    }, [conversation?.id]);

    // Mark unread messages
    const unreadMessageIds = conversation?.messages
        ?.filter(
            (msg) => 
                !msg.isRead && 
                normalizeSenderId(msg.senderId) !== currentUserId && 
                !failedMessageIds.current.has(msg.id)
        )
        .map(msg => msg.id) || [];

    const unreadKey = unreadMessageIds.join(',');

    useEffect(() => {
        if (!unreadKey || userIsAdmin) return;
            unreadMessageIds.forEach((messageId) => {
            if (markedReadIdsRef.current.has(messageId)) return;
            markedReadIdsRef.current.add(messageId);
                markAsReadMutation.mutate(messageId);
            });
    }, [unreadKey, userIsAdmin]);

    // Refetch deliverables when searchHireId changes
    useEffect(() => {
        if (conversation?.searchHireId && lastSearchHireId.current !== conversation.searchHireId) {
            lastSearchHireId.current = conversation.searchHireId;
            lastDeliverableFetch.current = Date.now();
        }
    }, [conversation?.searchHireId]);

    const memoizedRefetchDeliverables = useCallback(() => refetchDeliverables(), [refetchDeliverables]);

    return {
        conversation,
        conversationLoading: loading,
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
        isConnected,
        isReconnecting,
        typingUserIds,
        onlineUserIds,
        lastSeenByUserId,
        notifyTyping,
        refetchConversation: refetch,
    };
};
