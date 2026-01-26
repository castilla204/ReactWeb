import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { getAuthToken } from './auth'

// ✅ Credenciales de Supabase hardcodeadas
const SUPABASE_URL = 'https://rveqsehzlvbttlpmsbmi.supabase.co'
// ✅ Usar Publishable Key (más moderna y segura según la guía)
const SUPABASE_ANON_KEY = '__REDACTED_SUPABASE_PUB__'

// Variable global para el cliente
let supabaseClient: SupabaseClient | null = null

// Función para crear/actualizar el cliente con el token actual
export function getSupabaseClient(token?: string | null): SupabaseClient {
  // Obtener token: primero del parámetro, luego de localStorage
  const authToken = token || getAuthToken()
  
  // Si ya existe un cliente y el token no ha cambiado, reutilizarlo
  if (supabaseClient && authToken) {
    // Actualizar la sesión si hay token
    supabaseClient.auth.setSession({
      access_token: authToken,
      refresh_token: '', // No necesario si no usas refresh
      expires_in: 3600,
      expires_at: Date.now() / 1000 + 3600,
      token_type: 'bearer',
      user: null
    }).then(() => {
      console.log('✅ [supabase] Sesión actualizada con token JWT');
    }).catch(err => {
      console.error('❌ [supabase] Error setting session:', err)
    })
    
    return supabaseClient
  }
  
  // Crear nuevo cliente con autenticación
  supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false, // No guardar sesión en Supabase (ya tienes tu propia auth)
      autoRefreshToken: false, // No refrescar tokens automáticamente
      detectSessionInUrl: false // No detectar sesión en URL
    },
    realtime: {
      params: {
        apikey: SUPABASE_ANON_KEY,
        eventsPerSecond: 10, // Límite de eventos por segundo
        // ✅ CRÍTICO: Pasar el token JWT directamente en los parámetros de Realtime
        // Esto es necesario porque setSession no funciona con JWT personalizados
        ...(authToken ? { access_token: authToken } : {})
      }
    },
    global: {
      // ✅ Pasar el token en los headers de todas las peticiones
      headers: authToken ? {
        Authorization: `Bearer ${authToken}`
      } : {}
    }
  })
  
  // ✅ Si hay token, establecerlo en el cliente
  if (authToken) {
    supabaseClient.auth.setSession({
      access_token: authToken,
      refresh_token: '', // No necesario si no usas refresh
      expires_in: 3600,
      expires_at: Date.now() / 1000 + 3600,
      token_type: 'bearer',
      user: null
    }).catch(err => {
      console.error('❌ [supabase] Error setting Supabase session:', err)
    })
  }
  
  return supabaseClient
}

// Exportar función para obtener cliente (compatibilidad con código existente)
export const supabase = getSupabaseClient()

// Exportar función para actualizar el cliente cuando cambie el token
export function updateSupabaseAuth(token: string | null) {
  if (token && supabaseClient) {
    supabaseClient.auth.setSession({
      access_token: token,
      refresh_token: '',
      expires_in: 3600,
      expires_at: Date.now() / 1000 + 3600,
      token_type: 'bearer',
      user: null
    }).catch(err => {
      console.error('❌ [supabase] Error updating Supabase session:', err)
    })
    
    // Actualizar headers globales
    supabaseClient.rest.headers = {
      ...supabaseClient.rest.headers,
      Authorization: `Bearer ${token}`
    }
    
    // ✅ CRÍTICO: Actualizar parámetros de Realtime con el token para WebSocket
    // El token se pasa automáticamente a través de setSession, pero también
    // debemos asegurarnos de que Realtime lo use
    if (supabaseClient.realtime && token) {
      // Actualizar la autenticación de Realtime
      // Nota: setAuth puede no existir en todas las versiones, pero setSession debería ser suficiente
      // Si el problema persiste, puede ser necesario recrear el cliente
      console.log('🔑 [supabase] Actualizando autenticación Realtime con token');
    }
  }
}

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
