import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient, updateSupabaseAuth } from '../lib/supabase';
import { API_CONFIG } from '../config/api';
import { sendMessage } from '../services/chatService';
import { MessageCircle, X, Send } from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { useAuth } from '../contexts/AuthContext';

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

export const PreHireChat = ({ serviceId, token, userId, onClose, onConnectionChange }: PreHireChatProps) => {
  const { user } = useAuth();
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);
  const messagesRef = useRef<Message[]>([]);
  const queryClient = useQueryClient();
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
  const { data: conversation, isLoading } = useQuery<Conversation>({
    queryKey: ['pre-hire-conversation', serviceId],
    queryFn: async () => {
      const response = await fetch(
        `${API_URL}/api/Chat/conversation-by-service?searchServiceId=${serviceId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
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
      const sortedMessages = conversation.messages.sort((a, b) => 
        new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
      );
      setMessages(sortedMessages);
    }
  }, [conversation]);

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
              const userResponse = await fetch(
                `${API_URL}/api/Users/${senderId}`,
                {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  }
                }
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
            return updated.sort((a, b) => 
              new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
            );
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
          return updated.sort((a, b) => 
            new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
          );
        }

        // ✅ Agregar nuevo mensaje y ordenar por fecha
        const updated = [...prev, messageDto].sort((a, b) => 
          new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
        );

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
          
          // Si es un evento new_message, también procesarlo
          if (event === 'new_message') {
            console.log('🔍 [PreHireChat] Procesando new_message desde listener de *');
            handleNewMessage(payload);
          }
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
        const updated = [...prev, optimisticMessage].sort((a, b) => 
          new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
        );
        console.log('✅ [PreHireChat] Mensaje optimístico agregado. Total mensajes:', updated.length);
        return updated;
      });

      setInputValue(''); // Limpiar input inmediatamente
      setIsTyping(false);

      return { optimisticMessage };
    },
    onSuccess: (data, variables, context) => {
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
        
        return updated.sort((a, b) => 
          new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
        );
      });
    },
    onError: (error, variables, context) => {
      console.error('❌ [PreHireChat] Error al enviar mensaje:', error);
      
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
    sendMessageMutation.mutate(inputValue.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-600">Cargando conversación...</p>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-red-600">No se pudo cargar la conversación</p>
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
                                <span className="text-xs text-green-600 flex items-center gap-1">
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                    Conectado
                                </span>
                            ) : (
                                <span className="text-xs text-red-600 flex items-center gap-1">
                                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
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
            

      {/* Lista de mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 text-center">
              No hay mensajes aún. ¡Empieza la conversación!
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.senderId === userId;
            
            return (
              <div
                key={message.id}
                className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} max-w-[70%] ${isOwnMessage ? 'ml-auto' : 'mr-auto'}`}
              >
                {/* ✅ Foto de perfil */}
                {!isOwnMessage && (
                  <Avatar className="w-8 h-8 flex-shrink-0">
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
                    className={`px-3 py-2 rounded-2xl ${
                      isOwnMessage
                        ? 'bg-primary text-white rounded-tr-sm'
                        : 'bg-gray-100 text-gray-900 rounded-tl-sm'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(message.sentAt).toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  
                  {/* Adjuntos */}
                  {message.attachmentUrls && message.attachmentUrls.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {message.attachmentUrls.map((url, idx) => (
                        <img
                          key={idx}
                          src={url}
                          alt={`Adjunto ${idx + 1}`}
                          className="max-w-[200px] max-h-[200px] rounded-lg object-cover"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 p-4 border-t border-gray-200 bg-white rounded-b-lg relative z-10">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={!isConnected ? "Conectando..." : "Escribe tu mensaje..."}
          disabled={sendMessageMutation.isPending}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          style={{ pointerEvents: 'auto' }}
        />
        <Button
          onClick={handleSend}
          disabled={!inputValue.trim() || sendMessageMutation.isPending || !isConnected}
          className="rounded-full px-6"
        >
          {sendMessageMutation.isPending ? (
            'Enviando...'
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
};
