import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getSupabaseClient } from '../lib/supabase';
import { API_CONFIG } from '../config/api';
import { sendMessage, markMessageAsRead, notifyTyping } from '../services/chatService';
import { isAdmin } from '../utils/admin';
import { getUserId, isMessageFromUser, normalizeSenderId } from '../utils/userId';
import type { RealtimeChannel } from '@supabase/supabase-js';
import {
  AlertCircle,
  ArrowUpRight,
  CheckCheck,
  Loader2,
  MessageCircle,
  RefreshCw,
  Send,
  ShieldCheck,
  Wifi,
  WifiOff,
  X,
  CreditCard,
  ShoppingBag,
} from 'lucide-react';
import { PRE_HIRE_CHAT_COPY } from '../constants/chatCopy.es';
import { TypingDots } from './chat/TypingDots';
import { SileoLoader } from './ui/sileo-loader';
import { isSameChatMessageGroup } from '../utils/chatMessageGroups';
import { detectContactInfo } from '../utils/contactFilter';
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
  /** Nombre del interlocutor (para typing y empty state). */
  peerName?: string;
  /** Página dedicada: banner de confianza y menos ruido de conexión. */
  embedded?: boolean;
  /** Cuando la conversación se obtiene/crea en el servidor (p. ej. sincronizar bandeja). */
  onConversationLoaded?: (conversation: { id: number }) => void;
  /** Servicio completo para mostrar precio en el botón de contratar */
  service?: {
    price: number;
    imageUrls?: string[];
    expert?: {
      user?: {
        name: string;
      };
    };
  };
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

export const PreHireChat = ({
  serviceId,
  token,
  userId: userIdProp,
  conversationId,
  onClose,
  onConnectionChange,
  peerName = 'El experto',
  embedded = false,
  onConversationLoaded,
  service,
}: PreHireChatProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = userIdProp > 0 ? userIdProp : getUserId(user as { id?: number; Id?: number });
  const userIsAdmin = isAdmin(user?.email);
  const [inputValue, setInputValue] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [typingUserIds, setTypingUserIds] = useState<number[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sendError, setSendError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastScrolledMessageIdRef = useRef<number | string | null>(null);
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

  useEffect(() => {
    if (conversation?.id) {
      onConversationLoaded?.({ id: conversation.id });
    }
  }, [conversation?.id, onConversationLoaded]);

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
      // Ordenar mensajes por fecha. Con el polling de respaldo siempre activo,
      // preservamos los mensajes optimistas aún en vuelo (el refetch del servidor
      // todavía no los incluye y los borraría hasta que termine el POST).
      const sortedMessages = sortMessagesByDate(conversation.messages);
      setMessages((prev) => {
        const pendingOptimistic = prev.filter(
          (m) => m.isOptimistic && !sortedMessages.some((s) => s.id === m.id)
        );
        return pendingOptimistic.length
          ? sortMessagesByDate([...sortedMessages, ...pendingOptimistic])
          : sortedMessages;
      });
    }
  }, [conversation]);

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
          // 🛡️ W35: el canal `conversation:{id}` es público → el backend deja de enviar el contenido
          // en el payload. Refetch por el endpoint autenticado (fuente de verdad). Compat con backend
          // antiguo: si el payload aún trae contenido, se aplica optimista para no perder inmediatez.
          const messageDto = normalizeBroadcastMessage(
            payload as Record<string, unknown>,
            convId
          );
          if (messageDto) {
            setMessages((prev) => mergeIncomingMessage(prev, messageDto));
          }
          void refetchRef.current();
        })
        .on('broadcast', { event: 'message_updated' }, ({ payload }) => {
          // 🛡️ W35: igual que new_message — refetch autenticado; compat con payload completo.
          const messageDto = normalizeBroadcastMessage(
            payload as Record<string, unknown>,
            convId
          );
          if (messageDto) {
            setMessages((prev) =>
              prev.map((msg) => (msg.id === messageDto.id ? { ...msg, ...messageDto } : msg))
            );
          }
          void refetchRef.current();
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

  // ✅ TIEMPO REAL ROBUSTO: polling de respaldo SIEMPRE activo — rápido (4s) sin
  // Realtime, lento (15s) como red de seguridad con Realtime. Antes solo corría
  // cuando isConnected era false, pero el broadcast del backend a Supabase puede
  // fallar en silencio con el canal SUBSCRIBED → el receptor no veía los mensajes
  // hasta recargar ("solo una dirección"). Además, al recuperar foco/visibilidad/
  // conexión se refresca al instante para recuperar lo perdido.
  useEffect(() => {
    if (!conversation?.id || !hasAccess) return;
    const interval = setInterval(() => {
      void refetchRef.current();
    }, isConnected ? 15000 : 4000);
    const onWake = () => {
      if (document.visibilityState === 'visible') void refetchRef.current();
    };
    document.addEventListener('visibilitychange', onWake);
    window.addEventListener('focus', onWake);
    window.addEventListener('online', onWake);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onWake);
      window.removeEventListener('focus', onWake);
      window.removeEventListener('online', onWake);
    };
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

  // Scroll al final solo cuando llega un mensaje nuevo (no al marcar leídos)
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) return;
    const scrollKey = `${lastMessage.id}-${lastMessage.isOptimistic ? 'opt' : 'ok'}`;
    if (lastScrolledMessageIdRef.current === scrollKey) return;
    lastScrolledMessageIdRef.current = scrollKey;
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
    const contactCheck = detectContactInfo(inputValue.trim());
    if (contactCheck.hasViolation) {
      setSendError(contactCheck.message);
      return;
    }
    sendMessageMutation.mutate(inputValue.trim());
  };

   const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleHireClick = () => {
    navigate(`/checkout/${serviceId}`);
  };

  const servicePrice = service?.price ?? 0;
  const serviceCurrencyCode = 'EUR';
  const priceLabel = servicePrice > 0
    ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: serviceCurrencyCode }).format(servicePrice)
    : null;

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
        <div className="border-t border-line p-4">
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
            {needsConversationId ? (
              <Button type="button" variant="default" size="sm" asChild>
                <a href="/expert?tab=messages">Ir a mis conversaciones</a>
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="gap-2"
            >
              {isFetching ? <SileoLoader size="sm" color="current" /> : <RefreshCw className="h-4 w-4" />}
              Reintentar
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex h-full items-center justify-center bg-white p-6 text-center text-ink-muted">
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
        <div className={`flex flex-col ${containerHeight} ${onClose ? 'border border-line rounded-lg' : ''} bg-white`}>
            {/* Header - Solo mostrar si hay onClose (para modales) */}
            {onClose && (
                <div className="flex items-center justify-between p-4 border-b border-line bg-surface-tinted rounded-t-lg">
                    <div className="flex items-center gap-2">
                        <MessageCircle className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-semibold text-ink-strong">Chat antes de contratar</h3>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Botón de contratar */}
                        <Button
                            type="button"
                            onClick={handleHireClick}
                            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand to-brand-hover text-white text-sm font-semibold shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <ShoppingBag className="h-4 w-4" />
                            <span>Contratar servicio</span>
                            {priceLabel && (
                                <span className="hidden sm:inline-block rounded-lg bg-white/20 px-2 py-0.5 text-xs font-medium backdrop-blur-sm">
                                    {priceLabel}
                                </span>
                            )}
                        </Button>
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
                            className="p-1 hover:bg-surface-tinted rounded-full transition-colors"
                            aria-label="Cerrar chat"
                        >
                            <X className="w-5 h-5 text-ink-muted" />
                        </button>
                    </div>
                </div>
            )}
      {userIsAdmin && (
        <p className="mx-4 mt-2 text-kicker text-amber-800 bg-amber-50 rounded-md px-2 py-1">
          Vista de administrador: los mensajes no se marcarán como leídos para el cliente ni el experto.
        </p>
      )}

      {embedded ? (
        isReconnecting ? (
          <p
            role="status"
            aria-live="polite"
            className="shrink-0 border-b border-line bg-white px-4 py-2 text-center text-kicker leading-snug text-ink-muted"
          >
            {PRE_HIRE_CHAT_COPY.reconnecting}
          </p>
        ) : null
      ) : (
        (!isConnected || isReconnecting) && (
          <div
            className={`mx-3 mt-2 flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-xs ${
              isConnected
                ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                : 'border-amber-100 bg-amber-50 text-amber-800'
            }`}
            role="status"
          >
            {isConnected ? (
              <Wifi className="h-4 w-4 shrink-0" aria-hidden />
            ) : (
              <WifiOff className="h-4 w-4 shrink-0" aria-hidden />
            )}
            <span>
              {isConnected
                ? 'Conectado en tiempo real'
                : isReconnecting
                  ? PRE_HIRE_CHAT_COPY.reconnecting
                  : PRE_HIRE_CHAT_COPY.offlineSend}
            </span>
          </div>
        )
      )}

      {/* Lista de mensajes */}
      <div
        ref={messageListRef}
        data-chat-messages
        className="chat-messages-area flex-1 min-h-0 overflow-y-auto overscroll-contain bg-surface-tinted px-3 py-4 [background-image:radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.04)_1px,transparent_0)] [background-size:20px_20px] sm:px-4"
        style={{ WebkitOverflowScrolling: 'touch' }}
        role="log"
        aria-label="Mensajes del chat antes de contratar"
      >
        {messages.length === 0 ? (
          <div className="flex h-full min-h-[12rem] items-center justify-center px-4 py-6">
            <div className="flex flex-col items-center text-center">
              <h3 className="text-body font-semibold text-ink-strong">
                {PRE_HIRE_CHAT_COPY.emptyTitle}
              </h3>
              <p className="mt-1 max-w-[240px] text-caption leading-relaxed text-ink-soft">
                {PRE_HIRE_CHAT_COPY.emptyBody}
              </p>
            </div>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwnMessage = isMessageFromUser(message.senderId, userId);
            const previousMessage = messages[index - 1];
            const showDaySeparator =
              !!previousMessage &&
              new Date(previousMessage.sentAt).toDateString() !==
                new Date(message.sentAt).toDateString();
            const isFirstInGroup = !isSameChatMessageGroup(previousMessage, message);
            const nextMessage = messages[index + 1];
            const isLastInGroup = !nextMessage || !isSameChatMessageGroup(message, nextMessage);

            return (
              <div key={message.id}>
                {showDaySeparator && (
                  <div
                    className="my-3 flex justify-center"
                    aria-label={`Mensajes de ${formatMessageDay(message.sentAt)}`}
                  >
                    <span className="rounded-full bg-white/90 px-3 py-1 text-kicker font-medium text-ink-muted shadow-sm">
                      {formatMessageDay(message.sentAt)}
                    </span>
                  </div>
                )}
                <article
                  className={`mb-0.5 flex gap-2 sm:gap-2.5 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} max-w-[88%] sm:max-w-[80%] ${isOwnMessage ? 'ml-auto' : 'mr-auto'} ${isFirstInGroup ? 'mt-2.5' : ''}`}
                  aria-label={`${isOwnMessage ? 'Tú' : message.senderName} a las ${formatMessageTime(message.sentAt)}`}
                >
                  {!isOwnMessage && (
                    <div className="w-8 shrink-0">
                      {isFirstInGroup ? (
                        <Avatar className="h-8 w-8 shadow-sm">
                          <AvatarImage
                            src={otherUserId ? `/api/Users/${otherUserId}/profile-picture` : undefined}
                            alt=""
                          />
                          <AvatarFallback className="bg-ink-strong text-xs text-white">
                            {message.senderName?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <span className="block h-8 w-8" aria-hidden />
                      )}
                    </div>
                  )}

                  <div className={`flex min-w-0 flex-col gap-0.5 ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                    {!isOwnMessage && isFirstInGroup && (
                      <span className="px-1 text-xs font-semibold text-ink-muted">
                        {message.senderName}
                      </span>
                    )}
                    <div
                      className={`rounded-[1.15rem] px-3.5 py-2 shadow-sm ${
                        isOwnMessage
                          ? 'rounded-br-sm bg-primary text-primary-foreground'
                          : 'rounded-bl-sm border border-line bg-white text-ink-strong'
                      } ${message.isOptimistic ? 'opacity-80' : ''}`}
                    >
                      <p className="whitespace-pre-wrap break-words text-sm leading-snug">
                        {message.content}
                      </p>
                    </div>
                    {isLastInGroup && (
                      <span className="flex items-center gap-1 px-1 text-badge text-ink-muted">
                        <time dateTime={message.sentAt}>{formatMessageTime(message.sentAt)}</time>
                        {isOwnMessage && (
                          <>
                            <span aria-hidden>·</span>
                            <span>{message.isOptimistic ? 'Enviando…' : message.isRead ? 'Leído' : 'Enviado'}</span>
                            {message.isOptimistic ? (
                              <SileoLoader size="xs" color="muted" />
                            ) : (
                              <CheckCheck
                                className={`h-3 w-3 ${message.isRead ? 'text-brand' : 'text-ink-soft'}`}
                                aria-hidden
                              />
                            )}
                          </>
                        )}
                      </span>
                    )}

                    {message.attachmentUrls && message.attachmentUrls.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {message.attachmentUrls.map((url, idx) => (
                          <img
                            key={idx}
                            src={url}
                            alt={`Adjunto ${idx + 1}`}
                            className="max-h-[200px] max-w-[200px] rounded-xl border border-line object-cover"
                            loading="lazy"
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

      {typingUserIds.some((id) => Number(id) === Number(otherParticipantId)) && (
        <div
          className="flex shrink-0 items-center gap-2 border-t border-line bg-white/95 px-4 py-2"
          role="status"
          aria-live="polite"
        >
          <TypingDots className="text-ink-muted" />
          <span className="text-xs text-ink-muted">
            {PRE_HIRE_CHAT_COPY.typing(peerName)}
          </span>
        </div>
      )}

      {/* Input */}
      <div className="relative z-10 shrink-0 border-t border-line bg-white px-3 py-2.5 sm:px-4 pb-[max(0.625rem,env(safe-area-inset-bottom,0px))]">
        {sendError && (
          <div className="mb-2.5 rounded-2xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {sendError}
          </div>
        )}
        <div className="flex items-end gap-1.5 rounded-[1.5rem] border border-line bg-surface-tinted py-1 pl-3.5 pr-1 transition-colors focus-within:border-brand/50 focus-within:bg-white focus-within:ring-2 focus-within:ring-brand/15">
          <Textarea
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              notifyTypingState(e.target.value.trim().length > 0);
            }}
            onBlur={() => notifyTypingState(false)}
            onKeyDown={handleKeyDown}
            placeholder={PRE_HIRE_CHAT_COPY.inputPlaceholder}
            disabled={sendMessageMutation.isPending}
            aria-label="Escribe tu mensaje"
            aria-describedby="chat-input-help"
            aria-invalid={!!sendError}
            rows={1}
            maxLength={1200}
            className="min-h-[36px] max-h-32 flex-1 resize-none border-0 bg-transparent px-1 py-[0.4rem] text-sm leading-5 shadow-none ring-offset-0 placeholder:text-ink-soft focus-visible:ring-0 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-60"
            style={{ pointerEvents: 'auto' }}
          />
          <Button
            type="button"
            onClick={handleSend}
            disabled={!inputValue.trim() || sendMessageMutation.isPending}
            className="h-9 w-9 shrink-0 rounded-full bg-brand p-0 text-white shadow-sm transition-all hover:bg-brand-hover active:scale-90 disabled:bg-transparent disabled:text-ink-soft disabled:shadow-none"
            aria-label={sendMessageMutation.isPending ? 'Enviando mensaje' : 'Enviar mensaje'}
          >
            {sendMessageMutation.isPending ? (
              <SileoLoader size="sm" color="white" />
            ) : (
              <Send className="h-[18px] w-[18px]" aria-hidden="true" />
            )}
          </Button>
        </div>
        <p id="chat-input-help" className="mt-1.5 hidden px-2 text-kicker text-ink-soft sm:block">
          {PRE_HIRE_CHAT_COPY.inputHelp}
        </p>
      </div>
    </div>
  );
};
