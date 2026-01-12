import { useEffect, useCallback, useRef } from 'react'
import { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { DBMessage, MessageDto, LegacyMessage, toLegacyMessage } from '../types/chat.types'

interface UseSupabaseMessagesProps {
  conversationId: number | null
  onNewMessage: (message: LegacyMessage) => void
  onMessageUpdated: (message: LegacyMessage) => void
  enabled?: boolean
}

/**
 * Hook para escuchar nuevos mensajes en tiempo real usando Supabase
 * Usa Postgres Changes para detectar INSERTs y UPDATEs en la tabla Messages
 */
export function useSupabaseMessages({
  conversationId,
  onNewMessage,
  onMessageUpdated,
  enabled = true
}: UseSupabaseMessagesProps) {
  const channelRef = useRef<RealtimeChannel | null>(null)

  // Convertir mensaje de DB a formato legacy (compatible con Chat.tsx actual)
  const convertDbMessageToLegacy = useCallback((dbMessage: DBMessage): LegacyMessage => {
    return {
      id: dbMessage.Id,
      conversationId: dbMessage.ConversationId,
      senderId: dbMessage.SenderId,
      content: dbMessage.Content || '',
      sentAt: dbMessage.SentAt,
      isRead: dbMessage.IsRead,
      senderName: '[Usuario]', // Se actualiza después desde el estado local
      locationLatitude: dbMessage.LocationLatitude,
      locationLongitude: dbMessage.LocationLongitude,
      attachmentUrls: [] // Los attachments vienen por otra tabla
    }
  }, [])

  useEffect(() => {
    if (!conversationId || !enabled) {
      return
    }

    // Crear canal con nombre único
    const channelName = `messages:${conversationId}:${Date.now()}`
    
    console.log(`📡 [Supabase] Suscribiéndose a mensajes de conversación ${conversationId}`)

    const channel = supabase
      .channel(channelName)
      // Escuchar nuevos mensajes
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'Messages',
          filter: `ConversationId=eq.${conversationId}`
        },
        (payload) => {
          console.log('📩 [Supabase] Nuevo mensaje recibido:', payload.new)
          const legacyMessage = convertDbMessageToLegacy(payload.new as DBMessage)
          onNewMessage(legacyMessage)
        }
      )
      // Escuchar actualizaciones (ej: IsRead cambia a true)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'Messages',
          filter: `ConversationId=eq.${conversationId}`
        },
        (payload) => {
          console.log('✏️ [Supabase] Mensaje actualizado:', payload.new)
          const legacyMessage = convertDbMessageToLegacy(payload.new as DBMessage)
          onMessageUpdated(legacyMessage)
        }
      )
      .subscribe((status) => {
        console.log(`📡 [Supabase] Estado de suscripción a mensajes: ${status}`)
      })

    channelRef.current = channel

    // Cleanup al desmontar o cambiar de conversación
    return () => {
      console.log(`🔌 [Supabase] Desuscribiéndose de mensajes de conversación ${conversationId}`)
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [conversationId, enabled, onNewMessage, onMessageUpdated, convertDbMessageToLegacy])

  // Función para forzar reconexión
  const reconnect = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.unsubscribe()
      channelRef.current.subscribe()
    }
  }, [])

  return { reconnect }
}
