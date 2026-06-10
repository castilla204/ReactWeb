import { useEffect, useState, useCallback, useRef } from 'react'
import { RealtimeChannel } from '@supabase/supabase-js'
import { getSupabaseClient } from '../lib/supabase'
import { notifyTyping } from '../services/chatService'
import type { TypingPayload } from '../types/chat.types'

interface UseSupabaseTypingIndicatorProps {
  conversationId: number | null
  currentUserId: number
  token: string
  enabled?: boolean
}

interface UseSupabaseTypingIndicatorReturn {
  typingUsers: number[]
  startTyping: () => void
  stopTyping: () => void
}

/**
 * Hook para manejar el indicador de "escribiendo..." usando Supabase Realtime
 * - Escucha cuando otros usuarios están escribiendo
 * - Envía notificaciones cuando el usuario actual está escribiendo
 */
export function useSupabaseTypingIndicator({
  conversationId,
  currentUserId,
  token,
  enabled = true
}: UseSupabaseTypingIndicatorProps): UseSupabaseTypingIndicatorReturn {
  const [typingUsers, setTypingUsers] = useState<number[]>([])
  const channelRef = useRef<RealtimeChannel | null>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isTypingRef = useRef(false)

  // Limpiar usuarios que dejaron de escribir después de 3 segundos
  const typingTimeouts = useRef<Map<number, NodeJS.Timeout>>(new Map())

  useEffect(() => {
    if (!conversationId || !enabled) {
      return
    }

    const channelName = `typing:${conversationId}`

    const channel = getSupabaseClient()
      .channel(channelName)
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        const typingData = payload as TypingPayload
        
        // Ignorar nuestro propio evento de typing
        if (typingData.userId === currentUserId) {
          return
        }

        if (typingData.isTyping) {
          // Agregar usuario a la lista
          setTypingUsers(prev => {
            if (!prev.includes(typingData.userId)) {
              return [...prev, typingData.userId]
            }
            return prev
          })

          // Limpiar timeout anterior si existe
          const existingTimeout = typingTimeouts.current.get(typingData.userId)
          if (existingTimeout) {
            clearTimeout(existingTimeout)
          }

          // Configurar timeout para remover después de 3 segundos sin actividad
          const timeout = setTimeout(() => {
            setTypingUsers(prev => prev.filter(id => id !== typingData.userId))
            typingTimeouts.current.delete(typingData.userId)
          }, 3000)

          typingTimeouts.current.set(typingData.userId, timeout)
        } else {
          // Remover usuario de la lista
          setTypingUsers(prev => prev.filter(id => id !== typingData.userId))
          
          const existingTimeout = typingTimeouts.current.get(typingData.userId)
          if (existingTimeout) {
            clearTimeout(existingTimeout)
            typingTimeouts.current.delete(typingData.userId)
          }
        }
      })
      .subscribe()

    channelRef.current = channel

    return () => {
      // Limpiar todos los timeouts
      typingTimeouts.current.forEach(timeout => clearTimeout(timeout))
      typingTimeouts.current.clear()
      
      if (channelRef.current) {
        getSupabaseClient().removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [conversationId, currentUserId, enabled])

  // Notificar que empezamos a escribir
  const startTyping = useCallback(() => {
    if (!conversationId || isTypingRef.current) {
      return
    }

    isTypingRef.current = true
    
    // Enviar via broadcast de Supabase
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          userId: currentUserId,
          conversationId,
          isTyping: true,
          timestamp: new Date().toISOString()
        }
      })
    }

    // También notificar al backend
    notifyTyping({ ConversationId: conversationId, IsTyping: true }, token)

    // Auto-stop después de 2 segundos sin actividad
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping()
    }, 2000)
  }, [conversationId, token, currentUserId])

  // Notificar que dejamos de escribir
  const stopTyping = useCallback(() => {
    if (!conversationId || !isTypingRef.current) {
      return
    }

    isTypingRef.current = false
    
    // Enviar via broadcast de Supabase
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          userId: currentUserId,
          conversationId,
          isTyping: false,
          timestamp: new Date().toISOString()
        }
      })
    }

    // También notificar al backend
    notifyTyping({ ConversationId: conversationId, IsTyping: false }, token)

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }
  }, [conversationId, token, currentUserId])

  return {
    typingUsers,
    startTyping,
    stopTyping
  }
}
