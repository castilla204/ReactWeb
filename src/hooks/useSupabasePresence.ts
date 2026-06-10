import { useEffect, useState, useCallback, useRef } from 'react'
import { RealtimeChannel } from '@supabase/supabase-js'
import { getSupabaseClient } from '../lib/supabase'
import type { PresenceState } from '../types/chat.types'

interface UseSupabasePresenceProps {
  conversationId: number | null
  userId: number
  enabled?: boolean
}

interface UseSupabasePresenceReturn {
  onlineUsers: number[]
  isConnected: boolean
}

/**
 * Hook para rastrear usuarios online en una conversación
 * Usa Supabase Presence para tracking en tiempo real
 */
export function useSupabasePresence({
  conversationId,
  userId,
  enabled = true
}: UseSupabasePresenceProps): UseSupabasePresenceReturn {
  const [onlineUsers, setOnlineUsers] = useState<number[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!conversationId || !userId || !enabled) {
      return
    }

    const channelName = `presence:${conversationId}`

    const channel = getSupabaseClient().channel(channelName, {
      config: {
        presence: {
          key: userId.toString()
        }
      }
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        
        // Extraer IDs de usuarios únicos
        const users: number[] = []
        Object.values(state).forEach((presences) => {
          (presences as PresenceState[]).forEach((presence) => {
            if (!users.includes(presence.user_id)) {
              users.push(presence.user_id)
            }
          })
        })
        
        setOnlineUsers(users)
        console.log('👥 [Supabase] Usuarios online:', users)
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log(`👋 [Supabase] Usuario ${key} se unió:`, newPresences)
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log(`👋 [Supabase] Usuario ${key} salió:`, leftPresences)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Registrar nuestra presencia
          await channel.track({
            user_id: userId,
            online_at: new Date().toISOString()
          })
          setIsConnected(true)
          console.log('✅ [Supabase] Presencia registrada')
        } else if (status === 'CHANNEL_ERROR') {
          setIsConnected(false)
          console.error('❌ [Supabase] Error en canal de presencia')
        }
      })

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        channelRef.current.untrack()
        getSupabaseClient().removeChannel(channelRef.current)
        channelRef.current = null
      }
      setIsConnected(false)
    }
  }, [conversationId, userId, enabled])

  return {
    onlineUsers,
    isConnected
  }
}
