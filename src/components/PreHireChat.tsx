import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getSupabaseClient } from '../lib/supabase';
import { API_CONFIG } from '../config/api';
import { sendMessage, markMessageAsRead, notifyTyping } from '../services/chatService';
import { isAdmin } from '../utils/admin';
import { getUserId, isMessageFromUser, normalizeSenderId } from '../utils/userId';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { AlertCircle, CheckCheck, Loader2, MessageCircle, RefreshCw, Send, Wifi, WifiOff, X } from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { useAuth } from '../contexts/AuthContext';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Skeleton } from './ui/skeleton';
import { fetchWithTimeout } from '../utils/fetchWithTimeout';

interface PreHireChatProps {
  serviceId: number;
  token: string;
  userId: number;
  /** Abre la conversación concreta (experto con varios clientes en el mismo servicio) */
  conversationId?: number;
  onClose?: () => void;
  onConnectionChange?: (isConnected: boolean) => void;
}

interface Message {
  id: number;
  conversationId: number;
  senderId: number | null;
  content: string;
  sentAt: string;
  isRead: boolean;
  senderName: string;
  locationLatitude: string | null;
  locationLongitude: string | null;
  attachmentUrls: string[];
  // ✅ Flag para identificar mensajes optimísticos
  isOptimistic?: boolean;
}

interface Conversation {
  id: number;
  searchHireId: number | null;
  searchServiceId: number | null;
  clientId: number | null;
  expertId: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
}

const CHAT_FETCH_TIMEOUT_MS = 30000;

function sortMessagesByDate(messages: Message[]) {
  return [...messages].sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
}

function formatMessageTime(value: string) {
  return new Date(value).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function normalizeBroadcastMessage(messageData: Record<string, unknown>, expectedConversationId: number): Message | null {
  const msgConversationId = Number(messageData.ConversationId ?? messageData.conversationId);
  if (!msgConversationId || msgConversationId !== expectedConversationId) return null;

  return {
    id: Number(messageData.Id ?? messageData.id),
    conversationId: msgConversationId,
    senderId: normalizeSenderId(messageData.SenderId ?? messageData.senderId),
    content: String(messageData.Content ?? messageData.content ?? ''),
    sentAt: String(messageData.SentAt ?? messageData.sentAt ?? new Date().toISOString()),
    isRead: Boolean(messageData.IsRead ?? messageData.isRead ?? false),
    senderName: String(messageData.SenderName ?? messageData.senderName ?? '[Usuario]'),
    locationLatitude: (messageData.LocationLatitude ?? messageData.locationLatitude ?? null) as string | null,
    locationLongitude: (messageData.LocationLongitude ?? messageData.locationLongitude ?? null) as string | null,
    attachmentUrls: (messageData.AttachmentUrls ?? messageData.attachmentUrls ?? []) as string[],
  };
}

function mergeIncomingMessage(prev: Message[], messageDto: Message): Message[] {
  const existingIndex = prev.findIndex((m) => m.id === messageDto.id);
  if (existingIndex !== -1) {
    if (prev[existingIndex].isOptimistic) {
      const updated = [...prev];
      updated[existingIndex] = { ...messageDto, isOptimistic: false };
      return sortMessagesByDate(updated);
    }
    return prev;
  }

  const optimisticIndex = prev.findIndex(
    (m) =>
      m.isOptimistic &&
      m.content === messageDto.content &&
      normalizeSenderId(m.senderId) === normalizeSenderId(messageDto.senderId) &&
      Math.abs(new Date(m.sentAt).getTime() - new Date(messageDto.sentAt).getTime()) < 5000
  );

  if (optimisticIndex !== -1) {
    const updated = [...prev];
    updated[optimisticIndex] = { ...messageDto, isOptimistic: false };
    return sortMessagesByDate(updated);
  }

  return sortMessagesByDate([...prev, messageDto]);
}

function formatMessageDay(value: string) {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Hoy';
  if (date.toDateString() === yesterday.toDateString()) return 'Ayer';

  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export const PreHireChat = ({ serviceId, token, userId: userIdProp, conversationId, onClose, onConnectionChange }: PreHireChatProps) => {
  const { user } = useAuth();
  const userId = userIdProp > 0 ? userIdProp : getUserId(user as { id?: number; Id?: number });
  const userIsAdmin = isAdmin(user?.email);
  const [inputValue, setInputValue] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [typingUserIds, setTypingUserIds] = useState<number[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sendError, setSendError] = useState<string | null>(null);
  const [liveAnnouncement, setLiveAnnouncement] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageListRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const pendingChannelRef = useRef<RealtimeChannel | null>(null);
  const isTearingDownRef = useRef(false);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingClearTimeoutsRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  const typingNotifyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSentRef = useRef(false);
  const markedReadIdsRef = useRef<Set<number>>(new Set());
  const messagesRef = useRef<Message[]>([]);
  const refetchRef = useRef<() => void>(() => undefined);
  const API_URL = API_CONFIG.baseUrl;

  const supabase = getSupabaseClient();

  // Mantener ref actualizado con los mensajes
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Obtener o crear conversación previa
  const { data: conversation, isLoading, isFetching, error: conversationError, refetch } = useQuery<Conversation>({
    queryKey: ['pre-hire-conversation', serviceId, conversationId],
    queryFn: async () => {
      const conversationParam = conversationId ? `&conversationId=${conversationId}` : '';
      const response = await fetchWithTimeout(
        `${API_URL}/api/Chat/conversation-by-service?searchServiceId=${serviceId}${conversationParam}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        },
        CHAT_FETCH_TIMEOUT_MS
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error al obtener conversación: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      // Convertir de PascalCase a camelCase si es necesario
      return {
        id: data.Id || data.id,
        searchHireId: data.SearchHireId ?? data.searchHireId ?? null,
        searchServiceId: data.SearchServiceId ?? data.searchServiceId ?? null,
        clientId: data.ClientId ?? data.clientId ?? null,
        expertId: data.ExpertId ?? data.expertId ?? null,
        isActive: data.IsActive ?? data.isActive ?? true,
        createdAt: data.CreatedAt || data.createdAt,
        updatedAt: data.UpdatedAt || data.updatedAt,
        messages: (data.Messages || data.messages || []).map((msg: any) => ({
          id: msg.Id || msg.id,
          conversationId: msg.ConversationId || msg.conversationId,
          senderId: normalizeSenderId(msg.SenderId ?? msg.senderId),
          content: msg.Content || msg.content || '',
          sentAt: msg.SentAt || msg.sentAt,
          isRead: msg.IsRead ?? msg.isRead ?? false,
          senderName: msg.SenderName || msg.senderName || '[Usuario]',
          locationLatitude: msg.LocationLatitude ?? msg.locationLatitude ?? null,
          locationLongitude: msg.LocationLongitude ?? msg.locationLongitude ?? null,
          attachmentUrls: msg.AttachmentUrls || msg.attachmentUrls || []
        }))
      };
    },
    enabled: !!serviceId && !!token,
    retry: 2
  });

  refetchRef.current = refetch;

  const hasAccess =
    !!conversation &&
    userId > 0 &&
    (userIsAdmin ||
      (conversation.clientId != null && userId === conversation.clientId) ||
      (conversation.expertId != null && userId === conversation.expertId));

  const otherParticipantId =
    conversation?.clientId === userId ? conversation?.expertId : conversation?.clientId;

  const notifyTypingState = useCallback(
    (isTyping: boolean) => {
      if (!conversation?.id || !token) return;

      if (typingNotifyTimeoutRef.current) {
        clearTimeout(typingNotifyTimeoutRef.current);
        typingNotifyTimeoutRef.current = null;
      }

      const send = (typing: boolean) => {
        void notifyTyping({ ConversationId: conversation.id, IsTyping: typing }, token);
      };

      if (isTyping) {
        if (!lastTypingSentRef.current) {
          lastTypingSentRef.current = true;
          send(true);
        }
        typingNotifyTimeoutRef.current = setTimeout(() => {
          lastTypingSentRef.current = false;
          send(false);
        }, 2000);
      } else if (lastTypingSentRef.current) {
        lastTypingSentRef.current = false;
        send(false);
      }
    },
    [conversation?.id, token]
  );

  // Inicializar mensajes desde la conversación
  useEffect(() => {
    if (conversation?.messages) {
      // Ordenar mensajes por fecha
      const sortedMessages = sortMessagesByDate(conversation.messages);
      setMessages(sortedMessages);
    }
  }, [conversation]);

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) return;

    const author = lastMessage.senderId === userId ? 'Tú' : lastMessage.senderName || 'La otra persona';
    setLiveAnnouncement(`${author}: ${lastMessage.content}`);
  }, [messages, userId]);

  // Supabase Realtime (mismo canal y eventos que useChat post-contratación)
  useEffect(() => {
    if (!conversation?.id || !token || !hasAccess) return;

    const convId = conversation.id;
    let cancelled = false;
    let retryCount = 0;
    const maxRetries = 8;
    const client = supabase;
    const channelName = `conversation:${convId}`;

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
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = setTimeout(() => {
        if (!cancelled) void subscribe();
      }, delay);
    };

    const subscribe = async () => {
      if (cancelled) return;

      const existing = pendingChannelRef.current ?? channelRef.current;
      await teardownChannel(existing);
      pendingChannelRef.current = null;
      channelRef.current = null;

      const channel = client
        .channel(channelName)
        .on('broadcast', { event: 'new_message' }, ({ payload }) => {
          const messageDto = normalizeBroadcastMessage(
            payload as Record<string, unknown>,
            convId
          );
          if (!messageDto) return;
          setMessages((prev) => mergeIncomingMessage(prev, messageDto));
        })
        .on('broadcast', { event: 'message_updated' }, ({ payload }) => {
          const messageDto = normalizeBroadcastMessage(
            payload as Record<string, unknown>,
            convId
          );
          if (!messageDto) return;
          setMessages((prev) =>
            prev.map((msg) => (msg.id === messageDto.id ? { ...msg, ...messageDto } : msg))
          );
        })
        .on('broadcast', { event: 'message_read' }, ({ payload }) => {
          const p = payload as { messageId?: number; MessageId?: number };
          const messageId = p.messageId ?? p.MessageId;
          if (!messageId) return;
          setMessages((prev) =>
            prev.map((msg) => (msg.id === messageId ? { ...msg, isRead: true } : msg))
          );
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
          if (!typingUserId || typingUserId === userId) return;

          const existingTimeout = typingClearTimeoutsRef.current.get(typingUserId);
          if (existingTimeout) clearTimeout(existingTimeout);

          if (isTyping) {
            setTypingUserIds((prev) =>
              prev.some((id) => Number(id) === typingUserId) ? prev : [...prev, typingUserId]
            );
            const timeout = setTimeout(() => {
              setTypingUserIds((prev) => prev.filter((id) => Number(id) !== typingUserId));
              typingClearTimeoutsRef.current.delete(typingUserId);
            }, 4000);
            typingClearTimeoutsRef.current.set(typingUserId, timeout);
          } else {
            setTypingUserIds((prev) => prev.filter((id) => Number(id) !== typingUserId));
          }
        })
        .subscribe((status, err) => {
          if (cancelled) return;

          const connected = status === 'SUBSCRIBED';
          setIsConnected(connected);
          setIsReconnecting(false);
          onConnectionChange?.(connected);

          if (status === 'SUBSCRIBED') {
            retryCount = 0;
            channelRef.current = channel;
            pendingChannelRef.current = null;
            void refetchRef.current();
          } else if (err) {
            console.error('[PreHireChat] Error en canal Realtime:', err);
          }

          if (
            (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') &&
            !isTearingDownRef.current
          ) {
            setIsConnected(false);
            onConnectionChange?.(false);
            scheduleRetry();
          }
        });

      pendingChannelRef.current = channel;
    };

    void subscribe();

    return () => {
      cancelled = true;
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      typingClearTimeoutsRef.current.forEach((t) => clearTimeout(t));
      typingClearTimeoutsRef.current.clear();
      const ch = pendingChannelRef.current ?? channelRef.current;
      pendingChannelRef.current = null;
      channelRef.current = null;
      if (ch) void teardownChannel(ch);
      setIsConnected(false);
      setIsReconnecting(false);
      setTypingUserIds([]);
      onConnectionChange?.(false);
    };
  }, [conversation?.id, token, userId, hasAccess, onConnectionChange, supabase]);

  // Polling si Realtime no está conectado
  useEffect(() => {
    if (!conversation?.id || !hasAccess || isConnected) return;
    const interval = setInterval(() => {
      void refetchRef.current();
    }, 5000);
    return () => clearInterval(interval);
  }, [conversation?.id, hasAccess, isConnected]);

  // Marcar mensajes entrantes como leídos (no en vista admin: no debe afectar al cliente/experto)
  useEffect(() => {
    if (!conversation?.id || !token || !hasAccess || userIsAdmin) return;

    const unread = messages.filter(
      (msg) =>
        !msg.isRead &&
        !msg.isOptimistic &&
        msg.senderId != null &&
        !isMessageFromUser(msg.senderId, userId) &&
        !markedReadIdsRef.current.has(msg.id)
    );

    unread.forEach((msg) => {
      markedReadIdsRef.current.add(msg.id);
      void markMessageAsRead(msg.id, token).catch(() => {
        markedReadIdsRef.current.delete(msg.id);
      });
    });
  }, [messages, conversation?.id, token, userId, hasAccess, userIsAdmin]);

  useEffect(() => {
    if (conversation?.id) {
      markedReadIdsRef.current.clear();
    }
  }, [conversation?.id]);

  // Scroll automático al final
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Enviar mensaje (CON OPTIMISTIC UPDATE)
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!conversation) {
        throw new Error('No hay conversación disponible');
      }

      const response = await sendMessage(
        {
          ConversationId: conversation.id,
          Content: content
        },
        token
      );
      
      // Convertir respuesta de PascalCase a camelCase si es necesario
      return {
        id: response.Id || response.id,
        conversationId: response.ConversationId || response.conversationId,
        senderId:
          normalizeSenderId(response.SenderId ?? response.senderId) ??
          (userId > 0 ? userId : null),
        content: response.Content || response.content || '',
        sentAt: response.SentAt || response.sentAt,
        isRead: response.IsRead ?? response.isRead ?? false,
        senderName: response.SenderName || response.senderName || (user?.name || user?.Name || 'Tú'),
        locationLatitude: response.LocationLatitude ?? response.locationLatitude ?? null,
        locationLongitude: response.LocationLongitude ?? response.locationLongitude ?? null,
        attachmentUrls: response.AttachmentUrls || response.attachmentUrls || []
      };
    },
    onMutate: async (content) => {
      setSendError(null);
      // ✅ OPTIMISTIC UPDATE: Agregar mensaje inmediatamente
      const optimisticMessage: Message = {
        id: Date.now(), // ID temporal (se reemplazará con el real)
        conversationId: conversation!.id,
        senderId: userId,
        content: content,
        sentAt: new Date().toISOString(),
        isRead: false,
        senderName: user?.name || user?.Name || 'Tú',
        locationLatitude: null,
        locationLongitude: null,
        attachmentUrls: [],
        isOptimistic: true // ✅ Flag para identificar mensajes optimísticos
      };

      setMessages((prev) => sortMessagesByDate([...prev, optimisticMessage]));

      setInputValue(''); // Limpiar input inmediatamente

      return { optimisticMessage };
    },
    onSuccess: (data, variables) => {
      setMessages((prev) => {
        const updated = prev.map((msg) => {
          if (msg.isOptimistic && msg.content === variables && msg.senderId === userId) {
            return { ...data, isOptimistic: false };
          }
          return msg;
        });
        if (!updated.some((m) => m.id === data.id)) {
          updated.push({ ...data, isOptimistic: false });
        }
        return sortMessagesByDate(updated);
      });
    },
    onError: (error, variables, context) => {
      console.error('❌ [PreHireChat] Error al enviar mensaje:', error);
      setSendError(error instanceof Error ? error.message : 'No se pudo enviar el mensaje. Revisa tu conexión e inténtalo de nuevo.');
      
      // ✅ Remover mensaje optimístico en caso de error
      if (context?.optimisticMessage) {
        setMessages((prev) => prev.filter((msg) => msg.id !== context.optimisticMessage.id));
      }
      
      // ✅ Restaurar el input
      setInputValue(variables);
    }
  });

  const handleSend = () => {
    if (!inputValue.trim() || !conversation) return;
    setSendError(null);
    sendMessageMutation.mutate(inputValue.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full flex-col bg-white">
        <div className="flex-1 space-y-5 overflow-hidden p-4" aria-label="Cargando conversación">
          <div className="flex gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-16 w-64 rounded-2xl" />
            </div>
          </div>
          <div className="flex justify-end">
            <Skeleton className="h-14 w-72 rounded-2xl" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-20 w-56 rounded-2xl" />
          </div>
        </div>
        <div className="border-t border-gray-200 p-4">
          <Skeleton className="h-12 w-full rounded-full" />
        </div>
      </div>
    );
  }

  if (conversationError || !conversation) {
    const needsConversationId =
      conversationError?.message?.includes('conversationId is required') ?? false;
    return (
      <div className="flex h-full items-center justify-center bg-white p-6">
        <Alert variant="destructive" className="max-w-lg">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No se pudo cargar la conversación</AlertTitle>
          <AlertDescription className="mt-2 space-y-3">
            <p>
              {needsConversationId
                ? 'Como experto, abre el chat desde el panel de mensajes previos a contratar (cada cliente tiene su propia conversación).'
                : 'Revisa tu conexión o vuelve a intentarlo. Si el problema continúa, abre el servicio desde su ficha.'}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="gap-2"
            >
              {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Reintentar
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex h-full items-center justify-center bg-white p-6 text-center text-gray-600">
        <p>No tienes acceso a esta conversación privada.</p>
      </div>
    );
  }

  const otherUserId = conversation.clientId === userId 
    ? conversation.expertId 
    : conversation.clientId;

    // Calcular altura dinámicamente: si no hay onClose, usar altura completa
    const containerHeight = onClose ? 'h-[600px]' : 'h-full';
    
    return (
        <div className={`flex flex-col ${containerHeight} ${onClose ? 'border border-gray-200 rounded-lg' : ''} bg-white`}>
            <div className="sr-only" aria-live="polite" aria-atomic="false">
              {liveAnnouncement}
            </div>
            {/* Header - Solo mostrar si hay onClose (para modales) */}
            {onClose && (
                <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                    <div className="flex items-center gap-2">
                        <MessageCircle className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-semibold text-gray-900">Chat antes de contratar</h3>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Indicador de conexión */}
                        <div className="flex items-center gap-1.5">
                            {isConnected ? (
                                <span className="text-xs text-green-600 flex items-center gap-1" aria-label="Chat conectado">
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" aria-hidden="true"></span>
                                    Conectado
                                </span>
                            ) : (
                                <span className="text-xs text-red-600 flex items-center gap-1" aria-label="Chat desconectado">
                                    <span className="w-2 h-2 bg-red-500 rounded-full" aria-hidden="true"></span>
                                    Desconectado
                                </span>
                            )}
                        </div>
                        <button 
                            onClick={onClose} 
                            className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                            aria-label="Cerrar chat"
                        >
                            <X className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>
                </div>
            )}
      {typingUserIds.some((id) => Number(id) === Number(otherParticipantId)) && (
        <div className="mx-4 mt-2 text-xs text-gray-500 italic px-1">La otra persona está escribiendo…</div>
      )}

      {userIsAdmin && (
        <p className="mx-4 mt-2 text-[11px] text-amber-800 bg-amber-50 rounded-md px-2 py-1">
          Vista de administrador: los mensajes no se marcarán como leídos para el cliente ni el experto.
        </p>
      )}

      <div className={`mx-4 mt-3 flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs ${isConnected ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-amber-100 bg-amber-50 text-amber-800'}`}>
        {isConnected ? <Wifi className="h-4 w-4" aria-hidden="true" /> : <WifiOff className="h-4 w-4" aria-hidden="true" />}
        <span>
          {isConnected
            ? 'Chat privado en tiempo real.'
            : isReconnecting
              ? 'Reconectando… Los mensajes se sincronizan cada pocos segundos.'
              : 'Sin conexión en vivo. Puedes enviar mensajes; se entregarán por la API.'}
        </span>
      </div>

      {/* Lista de mensajes */}
      <div
        ref={messageListRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 overscroll-contain"
        style={{ WebkitOverflowScrolling: 'touch' }}
        role="log"
        aria-live="polite"
        aria-relevant="additions text"
        aria-label="Mensajes del chat antes de contratar"
        tabIndex={0}
      >
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="max-w-sm rounded-3xl border border-gray-100 bg-gray-50 px-6 py-7 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
                <MessageCircle className="h-6 w-6 text-gray-700" aria-hidden="true" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">Pregunta antes de contratar</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Resuelve dudas sobre disponibilidad, alcance del servicio o zona de trabajo antes de continuar.
              </p>
            </div>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwnMessage = isMessageFromUser(message.senderId, userId);
            const previousMessage = messages[index - 1];
            const showDaySeparator = !previousMessage ||
              new Date(previousMessage.sentAt).toDateString() !== new Date(message.sentAt).toDateString();
            
            return (
              <div key={message.id}>
                {showDaySeparator && (
                  <div className="my-4 flex justify-center" aria-label={`Mensajes de ${formatMessageDay(message.sentAt)}`}>
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-gray-500">
                      {formatMessageDay(message.sentAt)}
                    </span>
                  </div>
                )}
                <article
                  className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} max-w-[86%] sm:max-w-[72%] ${isOwnMessage ? 'ml-auto' : 'mr-auto'}`}
                  aria-label={`${isOwnMessage ? 'Tú' : message.senderName} a las ${formatMessageTime(message.sentAt)}`}
                >
                  {!isOwnMessage && (
                    <Avatar className="w-8 h-8 flex-shrink-0 shadow-sm">
                      <AvatarImage 
                        src={otherUserId ? `/api/Users/${otherUserId}/profile-picture` : undefined}
                        alt={message.senderName}
                      />
                      <AvatarFallback className="bg-gray-900 text-white text-xs">
                        {message.senderName?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className={`flex flex-col gap-1 ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                    {!isOwnMessage && (
                      <span className="text-xs font-semibold text-gray-600">{message.senderName}</span>
                    )}
                    <div
                      className={`px-4 py-2.5 rounded-3xl shadow-sm ${
                        isOwnMessage
                          ? 'bg-gradient-to-r from-[#E61E4D] via-[#E31C5F] to-[#D70466] text-white rounded-tr-md'
                          : 'bg-gray-100 text-gray-900 rounded-tl-md'
                      } ${message.isOptimistic ? 'opacity-75' : ''}`}
                    >
                      <p className="text-sm leading-6 whitespace-pre-wrap break-words">{message.content}</p>
                    </div>
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      {formatMessageTime(message.sentAt)}
                      {isOwnMessage && (
                        <>
                          {message.isOptimistic ? 'Enviando' : 'Enviado'}
                          {!message.isOptimistic && <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />}
                        </>
                      )}
                    </span>
                    
                    {message.attachmentUrls && message.attachmentUrls.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {message.attachmentUrls.map((url, idx) => (
                          <img
                            key={idx}
                            src={url}
                            alt={`Adjunto ${idx + 1}`}
                            className="max-w-[220px] max-h-[220px] rounded-2xl object-cover shadow-sm"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 bg-white p-3 sm:p-4 rounded-b-lg relative z-10">
        {sendError && (
          <div className="mb-3 rounded-2xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {sendError}
          </div>
        )}
        <div className="flex items-end gap-2">
        <Textarea
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            notifyTypingState(e.target.value.trim().length > 0);
          }}
          onBlur={() => notifyTypingState(false)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe tu mensaje..."
          disabled={sendMessageMutation.isPending}
          aria-label="Escribe tu mensaje"
          aria-describedby="chat-input-help"
          aria-invalid={!!sendError}
          rows={1}
          maxLength={1200}
          className="min-h-[44px] max-h-32 flex-1 resize-none rounded-3xl border-gray-200 bg-gray-50 px-4 py-3 text-sm leading-5 focus:bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
          style={{ pointerEvents: 'auto' }}
        />
        <Button
          type="button"
          onClick={handleSend}
          disabled={!inputValue.trim() || sendMessageMutation.isPending}
          className="h-11 w-11 rounded-full p-0 shadow-sm"
          aria-label={sendMessageMutation.isPending ? 'Enviando mensaje' : 'Enviar mensaje'}
        >
          {sendMessageMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          ) : (
            <Send className="w-4 h-4" aria-hidden="true" />
          )}
        </Button>
        </div>
        <p id="chat-input-help" className="mt-2 px-2 text-[11px] text-gray-500">
          Pulsa Enter para enviar. Usa Shift + Enter para escribir en varias líneas.
        </p>
      </div>
    </div>
  );
};
