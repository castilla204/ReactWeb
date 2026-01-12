import { createClient, SupabaseClient } from '@supabase/supabase-js'

// ✅ Credenciales de Supabase hardcodeadas
const SUPABASE_URL = 'https://rveqsehzlvbttlpmsbmi.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2ZXFzZWh6bHZidHRscG1zYm1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NDkyMTcsImV4cCI6MjA4MzAyNTIxN30.LA_zA1QezNnVU2dsojD6adI01V3ZN3uUNU1rB78DqF8'
// Alternativa: Publishable Key (más moderna)
// const SUPABASE_ANON_KEY = 'sb_publishable__cytPrm1U5kZhUeKY3SvdQ_yV2QzGS0'

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
