import { createClient, SupabaseClient } from '@supabase/supabase-js'

// ✅ Credenciales de Supabase hardcodeadas
const SUPABASE_URL = 'https://rveqsehzlvbttlpmsbmi.supabase.co'
const SUPABASE_ANON_KEY = '__REDACTED_JWT__'
// Alternativa: Publishable Key (más moderna)
// const SUPABASE_ANON_KEY = '__REDACTED_SUPABASE_PUB__'

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: {
    params: {
      eventsPerSecond: 10 // Límite de eventos por segundo
    }
  }
})

// Helper para verificar conexión
export const checkRealtimeConnection = async (): Promise<boolean> => {
  return new Promise((resolve) => {
    const channel = supabase.channel('connection-test')
    
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        supabase.removeChannel(channel)
        resolve(true)
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        supabase.removeChannel(channel)
        resolve(false)
      }
    })

    // Timeout de 5 segundos
    setTimeout(() => {
      supabase.removeChannel(channel)
      resolve(false)
    }, 5000)
  })
}

// Helper para obtener el estado de conexión actual
export const getRealtimeStatus = () => {
  return supabase.realtime.connectionState()
}
