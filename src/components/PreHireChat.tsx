import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getSupabaseClient, updateSupabaseAuth } from '../lib/supabase';
import { API_CONFIG } from '../config/api';
import { sendMessage } from '../services/chatService';
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

export const PreHireChat = ({ serviceId, token, userId, onClose, onConnectionChange }: PreHireChatProps) => {
  const { user } = useAuth();
  const [inputValue, setInputValue] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sendError, setSendError] = useState<string | null>(null);
  const [liveAnnouncement, setLiveAnnouncement] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageListRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);
  const messagesRef = useRef<Message[]>([]);
  const API_URL = API_CONFIG.baseUrl;
  
  // ✅ Obtener cliente Supabase autenticado
  const supabase = getSupabaseClient(token);
  
  // ✅ Actualizar autenticación cuando cambie el token
  useEffect(() => {
    if (token) {
      console.log('🔑 [PreHireChat] Actualizando autenticación Supabase con token');
      updateSupabaseAuth(token);
      
      // ✅ CRÍTICO: Esperar un momento para que la autenticación se establezca antes de suscribirse
      // Verificar que Supabase tiene el token
      supabase.auth.getSession().then(({ data, error }) => {
        if (error) {
          console.error('❌ [PreHireChat] Error obteniendo sesión:', error);
        } else {
          console.log('✅ [PreHireChat] Sesión Supabase:', data.session ? 'Activa' : 'Inactiva');
          if (data.session) {
            console.log('🔑 [PreHireChat] Token Supabase (primeros 20 chars):', data.session.access_token?.substring(0, 20));
            console.log('🔑 [PreHireChat] Token coincide con el esperado:', data.session.access_token?.substring(0, 20) === token.substring(0, 20));
          } else {
            console.warn('⚠️ [PreHireChat] No hay sesión activa en Supabase, los eventos de Realtime pueden no funcionar');
          }
        }
      });
    }
  }, [token, supabase]);
  
  // Mantener ref actualizado con los mensajes
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Obtener o crear conversación previa
  const { data: conversation, isLoading, isFetching, error: conversationError, refetch } = useQuery<Conversation>({
    queryKey: ['pre-hire-conversation', serviceId],
    queryFn: async () => {
      const response = await fetchWithTimeout(
        `${API_URL}/api/Chat/conversation-by-service?searchServiceId=${serviceId}`,
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
          senderId: msg.SenderId ?? msg.senderId ?? null,
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

  // ✅ NOTA: handleNewMessage ahora se define dentro del useEffect para capturar conversation.id actual

  // ✅ Suscribirse a nuevos mensajes con Supabase Realtime
  useEffect(() => {
    if (!conversation?.id || !token) {
      console.warn('⚠️ [PreHireChat] No conversationId o token, no se puede conectar');
      return;
    }

    // ✅ CRÍTICO: Definir handleNewMessage dentro del useEffect para capturar conversation.id actual
    const handleNewMessage = (messageData: any) => {
      console.log('🔍 [PreHireChat] handleNewMessage llamado con:', messageData);
      
      // ✅ Verificar que es para esta conversación (usar conversation.id directamente)
      const msgConversationId = messageData.ConversationId || messageData.conversationId;
      console.log('🔍 [PreHireChat] ConversationId del mensaje:', msgConversationId);
      console.log('🔍 [PreHireChat] ConversationId esperado:', conversation.id);
      
      if (msgConversationId !== conversation.id) {
        console.warn('⚠️ [PreHireChat] Mensaje de otra conversación, ignorando');
        return;
      }
      
      console.log('✅ [PreHireChat] Mensaje es para esta conversación, procesando...');
      
      // ✅ Crear objeto MessageDto (leer en PascalCase como envía el backend)
      const newMessage = messageData;
      
      // ✅ Obtener nombre del sender desde la conversación
      let senderName = '[Usuario]';
      if (newMessage.SenderId || newMessage.senderId) {
        const senderId = newMessage.SenderId || newMessage.senderId;
        // Determinar si es cliente o experto basándose en la conversación
        if (conversation.clientId && conversation.clientId === senderId) {
          // Es el cliente - intentar obtener nombre desde mensajes existentes o usar placeholder
          const existingClientMessage = messagesRef.current.find(m => m.senderId === conversation.clientId);
          senderName = existingClientMessage?.senderName || 'Cliente';
        } else if (conversation.expertId && conversation.expertId === senderId) {
          // Es el experto - intentar obtener nombre desde mensajes existentes o usar placeholder
          const existingExpertMessage = messagesRef.current.find(m => m.senderId === conversation.expertId);
          senderName = existingExpertMessage?.senderName || 'Experto';
        } else {
          // No coincide con cliente ni experto, usar placeholder
          senderName = '[Usuario]';
        }
        
        // Si no encontramos el nombre en mensajes existentes, intentar obtenerlo desde la API
        if (senderName === 'Cliente' || senderName === 'Experto' || senderName === '[Usuario]') {
          // Intentar obtener el nombre real desde la API
          (async () => {
            try {
              const userResponse = await fetchWithTimeout(
                `${API_URL}/api/Users/${senderId}`,
                {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  }
                },
                CHAT_FETCH_TIMEOUT_MS
              );
              
              if (userResponse.ok) {
                const userData = await userResponse.json();
                senderName = userData.Name || userData.name || senderName;
              }
            } catch (error) {
              console.error('[PreHireChat] Error obteniendo info del sender:', error);
              // Mantener el nombre por defecto
            }
          })();
        }
      }

      // ✅ Crear objeto MessageDto (leer en PascalCase como envía el backend)
      const messageDto: Message = {
        id: newMessage.Id || newMessage.id,
        conversationId: msgConversationId,
        senderId: newMessage.SenderId ?? newMessage.senderId ?? null,
        content: newMessage.Content || newMessage.content || '',
        sentAt: newMessage.SentAt || newMessage.sentAt,
        isRead: newMessage.IsRead ?? newMessage.isRead ?? false,
        senderName: newMessage.SenderName || newMessage.senderName || senderName,
        locationLatitude: newMessage.LocationLatitude ?? newMessage.locationLatitude ?? null,
        locationLongitude: newMessage.LocationLongitude ?? newMessage.locationLongitude ?? null,
        attachmentUrls: newMessage.AttachmentUrls || newMessage.attachmentUrls || []
      };
      
      // ✅ Agregar mensaje al estado (evitar duplicados y reemplazar optimísticos)
      setMessages(prev => {
        // Verificar si el mensaje ya existe (por ID)
        const existingIndex = prev.findIndex(m => m.id === messageDto.id);
        
        if (existingIndex !== -1) {
          console.log('⚠️ [PreHireChat] Mensaje duplicado detectado:', messageDto.id);
          // ✅ Si existe pero es optimístico, reemplazarlo con el real
          if (prev[existingIndex].isOptimistic) {
            console.log('🔄 [PreHireChat] Reemplazando mensaje optimístico con mensaje real desde Supabase');
            const updated = [...prev];
            updated[existingIndex] = messageDto; // Reemplazar con el mensaje real
            return sortMessagesByDate(updated);
          }
          console.log('⚠️ [PreHireChat] Mensaje duplicado ignorado (ya existe y no es optimístico):', messageDto.id);
          return prev; // Ya existe y no es optimístico, no hacer nada
        }

        // ✅ Buscar mensaje optimístico por contenido y senderId para reemplazarlo
        const optimisticIndex = prev.findIndex(m => 
          m.isOptimistic && 
          m.content === messageDto.content && 
          m.senderId === messageDto.senderId &&
          Math.abs(new Date(m.sentAt).getTime() - new Date(messageDto.sentAt).getTime()) < 5000 // Dentro de 5 segundos
        );

        if (optimisticIndex !== -1) {
          console.log('🔄 [PreHireChat] Reemplazando mensaje optimístico con mensaje real desde Supabase (por contenido)');
          const updated = [...prev];
          updated[optimisticIndex] = messageDto; // Reemplazar con el mensaje real
          return sortMessagesByDate(updated);
        }

        // ✅ Agregar nuevo mensaje y ordenar por fecha
        const updated = sortMessagesByDate([...prev, messageDto]);

        console.log('✅ [PreHireChat] Mensaje agregado. Total mensajes:', updated.length);
        return updated;
      });
    };

    console.log('🔌 [PreHireChat] ===== INICIANDO SUSCRIPCIÓN REALTIME =====');
    console.log('🔌 [PreHireChat] Conectando a Supabase Realtime con autenticación para conversación:', conversation.id);
    console.log('🔑 [PreHireChat] Token disponible:', !!token);
    console.log('🔑 [PreHireChat] Token (primeros 20 chars):', token?.substring(0, 20));
    
    // ✅ CRÍTICO: Asegurar que Supabase tiene el token ANTES de suscribirse
    // Esperar a que la sesión se establezca antes de crear el canal
    const setupSubscription = async () => {
      // Actualizar autenticación primero
      updateSupabaseAuth(token);
      
      // Esperar un momento para que la sesión se establezca
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verificar que Supabase tiene el token
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('❌ [PreHireChat] Error en sesión Supabase antes de suscribirse:', sessionError);
        return;
      }
      
      // ✅ IMPORTANTE: Con JWT personalizados, getSession() puede no funcionar
      // pero el token se pasa directamente en realtime.params.access_token
      // Por lo tanto, continuamos aunque no haya sesión en auth.getSession()
      if (!sessionData.session) {
        console.warn('⚠️ [PreHireChat] No hay sesión en auth.getSession(), pero el token se pasa en realtime.params');
        console.warn('⚠️ [PreHireChat] Esto es normal con JWT personalizados. Los broadcasts funcionarán, pero postgres_changes puede requerir RLS configurado.');
      } else {
        console.log('✅ [PreHireChat] Sesión Supabase confirmada antes de suscribirse: Activa');
        console.log('🔑 [PreHireChat] Token en sesión Supabase (primeros 20 chars):', sessionData.session.access_token?.substring(0, 20));
      }

      // ✅ IMPORTANTE: El canal debe ser "conversation:{id}" para coincidir con el backend
      const channelName = `conversation:${conversation.id}`;
      console.log(`📡 [PreHireChat] Nombre del canal: ${channelName}`);
    
    const channel = supabase
      .channel(channelName)
      
      // ⚠️ TEMPORALMENTE DESHABILITADO: postgres_changes causa error "mismatch between server and client bindings"
      // Esto ocurre porque el JWT personalizado no es válido para RLS de Supabase
      // Usaremos solo broadcast que es más confiable con JWT personalizados
      /*
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'Messages',
          filter: `ConversationId=eq.${conversation.id}`
        },
        async (payload) => {
          console.log('📨 [PreHireChat] ===== EVENTO RECIBIDO (postgres_changes) =====');
          console.log('📨 [PreHireChat] Tipo:', payload.eventType);
          console.log('📨 [PreHireChat] Payload completo:', JSON.stringify(payload, null, 2));
          console.log('📨 [PreHireChat] Nuevo mensaje:', payload.new);
          console.log('📨 [PreHireChat] ConversationId del payload:', payload.new?.ConversationId);
          console.log('📨 [PreHireChat] ConversationId esperado:', conversation.id);
          console.log('📨 [PreHireChat] ¿Coinciden?', payload.new?.ConversationId === conversation.id);
          
          handleNewMessage(payload.new);
        }
      )
      */
      
      // ✅ SUSCRIPCIÓN 1: broadcast (recibe broadcasts del backend) - MÁS CONFIABLE Y NO REQUIERE RLS
      .on(
        'broadcast',
        { event: 'new_message' },
        ({ payload }) => {
          console.log('📨 [PreHireChat] ===== EVENTO RECIBIDO (broadcast) =====');
          console.log('📨 [PreHireChat] Payload completo:', JSON.stringify(payload, null, 2));
          console.log('📨 [PreHireChat] Mensaje recibido vía broadcast:', payload);
          console.log('📨 [PreHireChat] SenderId del broadcast:', payload?.SenderId || payload?.senderId);
          console.log('📨 [PreHireChat] Current userId:', userId);
          console.log('📨 [PreHireChat] ¿Es mensaje propio?', (payload?.SenderId || payload?.senderId) === userId);
          console.log('📨 [PreHireChat] ConversationId del broadcast:', payload?.ConversationId || payload?.conversationId);
          console.log('📨 [PreHireChat] ConversationId esperado:', conversation.id);
          
          // ✅ El backend envía el mensaje completo en el payload
          // IMPORTANTE: NO filtrar mensajes propios aquí - handleNewMessage ya maneja duplicados
          handleNewMessage(payload);
        }
      )
      
      // ✅ SUSCRIPCIÓN 2: Escuchar TODOS los broadcasts para debug (incluye cualquier evento)
      .on(
        'broadcast',
        { event: '*' },
        ({ event, payload }) => {
          console.log('🔍 [PreHireChat] ===== BROADCAST RECIBIDO (cualquier evento) =====');
          console.log('🔍 [PreHireChat] Evento:', event);
          console.log('🔍 [PreHireChat] Payload completo:', JSON.stringify(payload, null, 2));
          console.log('🔍 [PreHireChat] Tipo de payload:', typeof payload);
          console.log('🔍 [PreHireChat] ¿Tiene Id?', 'Id' in payload || 'id' in payload);
          console.log('🔍 [PreHireChat] ¿Tiene ConversationId?', 'ConversationId' in payload || 'conversationId' in payload);
          
          // Listener de diagnóstico: el procesamiento real lo hace el listener new_message.
        }
      )
      
      // ⚠️ TEMPORALMENTE DESHABILITADO: postgres_changes causa error "mismatch between server and client bindings"
      // Usaremos solo broadcast para UPDATE y DELETE también
      /*
      // ✅ SUSCRIPCIÓN 3: Mensajes actualizados (UPDATE)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'Messages',
          filter: `ConversationId=eq.${conversation.id}`
        },
        (payload) => {
          console.log('🔄 [PreHireChat] Mensaje actualizado:', payload);
          
          const updatedMessage = payload.new as any;
          
          // ✅ Actualizar mensaje en el estado
          setMessages(prev =>
            prev.map(msg =>
              msg.id === updatedMessage.Id
                ? {
                    ...msg,
                    isRead: updatedMessage.IsRead || msg.isRead,
                    content: updatedMessage.Content || msg.content,
                    // Actualizar otros campos si es necesario
                  }
                : msg
            )
          );
        }
      )

      // ✅ SUSCRIPCIÓN 4: Mensajes eliminados (DELETE)
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'Messages',
          filter: `ConversationId=eq.${conversation.id}`
        },
        (payload) => {
          console.log('🗑️ [PreHireChat] Mensaje eliminado:', payload);
          
          const deletedMessage = payload.old as any;
          
          // ✅ Remover mensaje del estado
          setMessages(prev => prev.filter(msg => msg.id !== deletedMessage.Id));
        }
      )
      */

      // ✅ Suscribirse al canal
      .subscribe((status, err) => {
        console.log('📡 [PreHireChat] ===== ESTADO DE SUSCRIPCIÓN =====');
        console.log(`📡 [PreHireChat] Estado: ${status}`);
        if (err) {
          console.error('❌ [PreHireChat] Error:', err);
        }
        
        const connected = status === 'SUBSCRIBED';
        setIsConnected(connected);
        
        // Notificar cambio de conexión al componente padre
        if (onConnectionChange) {
          onConnectionChange(connected);
        }
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ [PreHireChat] Conectado a Supabase Realtime');
          console.log(`✅ [PreHireChat] Escuchando en canal: ${channelName}`);
          console.log('✅ [PreHireChat] Listo para recibir broadcasts (postgres_changes deshabilitado)');
          console.log('🧪 [PreHireChat] Canal suscrito correctamente. Esperando broadcasts del backend...');
          console.log('🧪 [PreHireChat] IMPORTANTE: El backend DEBE emitir broadcasts en el canal:', channelName);
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ [PreHireChat] Error en el canal. Verifica autenticación.');
          // Verificar autenticación cuando hay error
          supabase.auth.getSession().then(({ data, error }) => {
            console.log('🔑 [PreHireChat] Verificación de sesión después del error:');
            console.log('🔑 [PreHireChat] Sesión:', data.session ? 'Activa' : 'Inactiva');
            console.log('🔑 [PreHireChat] Error:', error);
          });
          // Notificar desconexión
          if (onConnectionChange) {
            onConnectionChange(false);
          }
        } else if (status === 'TIMED_OUT') {
          console.error('⏱️ [PreHireChat] Timeout. Verifica conexión y CSP.');
          // Notificar desconexión
          if (onConnectionChange) {
            onConnectionChange(false);
          }
        }
      });

      channelRef.current = channel;
    };
    
    // ✅ Llamar a la función de configuración
    setupSubscription().catch(err => {
      console.error('❌ [PreHireChat] Error en setupSubscription:', err);
    });

    // ✅ Limpiar suscripción al desmontar el componente
    return () => {
      console.log('🔌 [PreHireChat] Desconectando de Supabase Realtime');
      if (channelRef.current) {
        console.log('🔌 [PreHireChat] Removiendo canal:', channelRef.current.topic);
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [conversation?.id, token, supabase, userId, conversation?.clientId, conversation?.expertId]); // ✅ Remover handleNewMessage de las dependencias

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
        senderId: response.SenderId ?? response.senderId ?? null,
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

      console.log('🚀 [PreHireChat] Agregando mensaje optimístico:', optimisticMessage);

      setMessages(prev => {
        const updated = sortMessagesByDate([...prev, optimisticMessage]);
        console.log('✅ [PreHireChat] Mensaje optimístico agregado. Total mensajes:', updated.length);
        return updated;
      });

      setInputValue(''); // Limpiar input inmediatamente

      return { optimisticMessage };
    },
    onSuccess: (data, variables) => {
      console.log('✅ [PreHireChat] Mensaje enviado exitosamente:', data);
      
      // ✅ Reemplazar mensaje optimístico con el real inmediatamente
      setMessages(prev => {
        const updated = prev.map(msg => {
          // Buscar mensaje optimístico por contenido y senderId
          if (msg.isOptimistic && msg.content === variables && msg.senderId === userId) {
            console.log('🔄 [PreHireChat] Reemplazando mensaje optimístico con respuesta del servidor');
            // Reemplazar con el mensaje real del servidor
            return {
              ...data,
              isOptimistic: false
            };
          }
          return msg;
        });
        
        // Si no se encontró el mensaje optimístico, agregar el real
        if (!updated.some(m => m.id === data.id)) {
          console.log('📨 [PreHireChat] Agregando mensaje real (no se encontró optimístico)');
          updated.push(data);
        }
        
        return sortMessagesByDate(updated);
      });
    },
    onError: (error, variables, context) => {
      console.error('❌ [PreHireChat] Error al enviar mensaje:', error);
      setSendError(error instanceof Error ? error.message : 'No se pudo enviar el mensaje. Revisa tu conexión e inténtalo de nuevo.');
      
      // ✅ Remover mensaje optimístico en caso de error
      if (context?.optimisticMessage) {
        console.log('🗑️ [PreHireChat] Removiendo mensaje optimístico debido a error');
        setMessages(prev => 
          prev.filter(msg => msg.id !== context.optimisticMessage.id)
        );
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
    return (
      <div className="flex h-full items-center justify-center bg-white p-6">
        <Alert variant="destructive" className="max-w-lg">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No se pudo cargar la conversación</AlertTitle>
          <AlertDescription className="mt-2 space-y-3">
            <p>
              Revisa tu conexión o vuelve a intentarlo. Si el problema continúa, abre el servicio desde su ficha.
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
      <div className={`mx-4 mt-3 flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs ${isConnected ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-amber-100 bg-amber-50 text-amber-800'}`}>
        {isConnected ? <Wifi className="h-4 w-4" aria-hidden="true" /> : <WifiOff className="h-4 w-4" aria-hidden="true" />}
        <span>
          {isConnected
            ? 'Chat en tiempo real activo. Recibirás las respuestas al instante.'
            : 'Conectando con el chat en tiempo real. Puedes escribir, pero el envío se habilitará al reconectar.'}
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
            const isOwnMessage = message.senderId === userId;
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
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={!isConnected ? "Conectando..." : "Escribe tu mensaje..."}
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
          disabled={!inputValue.trim() || sendMessageMutation.isPending || !isConnected}
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
